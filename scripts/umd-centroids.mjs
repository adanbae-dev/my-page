#!/usr/bin/env node
/**
 * 읍면동 boundary Shapefile -> committed centroid table.
 *
 * WHY A SHAPEFILE AND NOT THE PORTAL. The 시군구 boundaries came from
 * data.go.kr as a CSV of WKB. Its 읍면동 sibling (15123128) stopped
 * resolving mid-session: four datasets in the 국토지리정보원
 * 공간정보공동활용 series began answering 404 while every other dataset on
 * the portal answered 200, including one in the same id block. The 시군구
 * file had downloaded from that exact URL hours earlier. So the boundaries
 * were taken from V-World instead, where they ship as ESRI Shapefile.
 *
 * WHY A HAND-WRITTEN READER. There is no shapefile library in this
 * environment, and adding one for a build-time script that runs once per
 * boundary edition is a poor trade. Both formats are simple: DBF is a fixed
 * header plus fixed-width records, SHP is a 100-byte header plus
 * length-prefixed records. The parts this file reads are the parts it needs.
 *
 * THE PROJECTION IS THE PART THAT COULD SILENTLY LIE. The .prj declares
 * Korea 2000 / Unified CS — Transverse Mercator on GRS80, central meridian
 * 127.5, origin latitude 38, scale 0.9996, false origin 1,000,000 /
 * 2,000,000 (EPSG:5179). GRS80 and WGS84 agree to about a metre, so no datum
 * shift is needed and the inverse projection is pure arithmetic. Another
 * V-World dataset in this session declared Bessel, which would have needed a
 * shift of a few hundred metres — at 읍면동 scale that is a different 동.
 * So the check is built in and printed: 종로구 청운동 has to land at roughly
 * 126.969, 37.589 or this script fails.
 *
 * Output is committed so the 186 MB shapefile is not needed to rebuild the
 * maps — the same arrangement as scripts/rtms/lawd.json.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = join(ROOT, '.rtms-cache', 'source', 'umd-shp', 'N3A_G0110000')
const OUT = join(ROOT, 'scripts', 'rtms', 'umd.centroids.csv')

const line = (s) => process.stdout.write(s + '\n')

for (const ext of ['.shp', '.dbf']) {
  if (!existsSync(BASE + ext)) {
    process.stderr.write(
      `\n  x ${BASE + ext} 이 없습니다.\n` +
        `    V-World 에서 읍면동 경계를 받아 .rtms-cache/source/umd-shp/ 에 두세요.\n\n`,
    )
    process.exit(1)
  }
}

/* --- DBF ------------------------------------------------------------ */

/** Fixed-width records behind a field descriptor table. CP949 throughout. */
function readDbf(path) {
  const buf = readFileSync(path)
  const count = buf.readUInt32LE(4)
  const headerLen = buf.readUInt16LE(8)
  const recordLen = buf.readUInt16LE(10)

  const fields = []
  for (let p = 32; p < headerLen && buf[p] !== 0x0d; p += 32) {
    const name = buf
      .subarray(p, p + 11)
      .toString('latin1')
      .replace(/\0.*$/, '')
    fields.push({ name, length: buf[p + 16] })
  }

  const decoder = new TextDecoder('euc-kr')
  const rows = []
  for (let i = 0; i < count; i++) {
    const start = headerLen + i * recordLen
    if (start + recordLen > buf.length) break
    let p = start + 1 // the first byte is the deletion flag
    const row = {}
    for (const f of fields) {
      row[f.name] = decoder.decode(buf.subarray(p, p + f.length)).trim()
      p += f.length
    }
    rows.push(row)
  }
  return rows
}

/* --- SHP ------------------------------------------------------------ */

const POLYGON = 5

/**
 * Every record's rings, in file order — which is the order the DBF rows are
 * in, and the only thing that ties an attribute to a shape.
 */
function* readPolygons(path) {
  const buf = readFileSync(path)
  let p = 100
  while (p + 8 <= buf.length) {
    const contentWords = buf.readInt32BE(p + 4)
    const body = p + 8
    p = body + contentWords * 2
    if (buf.readInt32LE(body) !== POLYGON) {
      yield []
      continue
    }
    const numParts = buf.readInt32LE(body + 36)
    const numPoints = buf.readInt32LE(body + 40)
    const partsAt = body + 44
    const pointsAt = partsAt + numParts * 4
    const parts = []
    for (let i = 0; i < numParts; i++) parts.push(buf.readInt32LE(partsAt + i * 4))
    const rings = []
    for (let i = 0; i < numParts; i++) {
      const from = parts[i]
      const to = i + 1 < numParts ? parts[i + 1] : numPoints
      const ring = new Float64Array((to - from) * 2)
      for (let j = from; j < to; j++) {
        ring[(j - from) * 2] = buf.readDoubleLE(pointsAt + j * 16)
        ring[(j - from) * 2 + 1] = buf.readDoubleLE(pointsAt + j * 16 + 8)
      }
      rings.push(ring)
    }
    yield rings
  }
}

/**
 * Area-weighted centroid of the LARGEST ring.
 *
 * Not of all rings together: a 동 with an offshore islet would otherwise be
 * placed in the water between them. The largest ring is where the place is.
 */
function centroid(rings) {
  let best = null
  for (const r of rings) {
    const n = r.length / 2
    if (n < 3) continue
    let a = 0
    let cx = 0
    let cy = 0
    for (let i = 0; i < n; i++) {
      const x0 = r[i * 2]
      const y0 = r[i * 2 + 1]
      const j = (i + 1) % n
      const x1 = r[j * 2]
      const y1 = r[j * 2 + 1]
      const cross = x0 * y1 - x1 * y0
      a += cross
      cx += (x0 + x1) * cross
      cy += (y0 + y1) * cross
    }
    if (a === 0) continue
    const A2 = a / 2
    const size = Math.abs(A2)
    if (!best || size > best.size) best = { x: cx / (6 * A2), y: cy / (6 * A2), size }
  }
  return best
}

/* --- inverse Transverse Mercator, EPSG:5179 ------------------------- */

const A = 6378137.0
const F = 1 / 298.257222101
const E2 = 2 * F - F * F
const EP2 = E2 / (1 - E2)
const K0 = 0.9996
const LON0 = (127.5 * Math.PI) / 180
const LAT0 = (38.0 * Math.PI) / 180
const FE = 1000000.0
const FN = 2000000.0

const meridianArc = (phi) =>
  A *
  ((1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256) * phi -
    ((3 * E2) / 8 + (3 * E2 ** 2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * phi) +
    ((15 * E2 ** 2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * phi) -
    ((35 * E2 ** 3) / 3072) * Math.sin(6 * phi))

const M0 = meridianArc(LAT0)

function toLonLat(x, y) {
  const M = M0 + (y - FN) / K0
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2))
  const mu = M / (A * (1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256))
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu)
  const C1 = EP2 * Math.cos(phi1) ** 2
  const T1 = Math.tan(phi1) ** 2
  const N1 = A / Math.sqrt(1 - E2 * Math.sin(phi1) ** 2)
  const R1 = (A * (1 - E2)) / (1 - E2 * Math.sin(phi1) ** 2) ** 1.5
  const D = (x - FE) / (N1 * K0)
  const lat =
    phi1 -
    ((N1 * Math.tan(phi1)) / R1) *
      ((D * D) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * D ** 6) / 720)
  const lon =
    LON0 +
    (D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * D ** 5) / 120) /
      Math.cos(phi1)
  return [(lon * 180) / Math.PI, (lat * 180) / Math.PI]
}

/* --- run ------------------------------------------------------------ */

const rows = readDbf(BASE + '.dbf')
const out = []
let noShape = 0
let shapes = 0
for (const rings of readPolygons(BASE + '.shp')) {
  const row = rows[shapes++]
  if (!row) break
  const c = centroid(rings)
  if (!c) {
    noShape++
    continue
  }
  const [lon, lat] = toLonLat(c.x, c.y)
  out.push({
    bjcd: row.BJCD,
    name: row.NAME,
    lon: Math.round(lon * 1e5) / 1e5,
    lat: Math.round(lat * 1e5) / 1e5,
  })
}

const problems = []
if (out.length === 0) problems.push('중심점이 하나도 안 나왔습니다')
if (shapes !== rows.length) {
  problems.push(`DBF ${rows.length}행과 SHP ${shapes}개 도형이 안 맞습니다`)
}
for (const r of out) {
  if (!/^\d{10}$/.test(r.bjcd)) problems.push(`법정동코드 형식이 아닙니다: ${r.bjcd}`)
  else if (!(r.lon > 124 && r.lon < 132 && r.lat > 32 && r.lat < 39)) {
    problems.push(`${r.name} 가 국토 밖입니다 (${r.lon}, ${r.lat})`)
  }
  if (problems.length > 5) break
}

/* The projection check. 종로구 청운동 is at 126.969, 37.589 on any correct
   reading of this file; a wrong datum or a wrong false origin moves it by
   hundreds of metres to hundreds of kilometres. */
const probe = out.find((r) => r.bjcd === '1111010100')
if (!probe) {
  problems.push('검증용 1111010100 (청운동) 이 없습니다')
} else if (Math.abs(probe.lon - 126.969) > 0.01 || Math.abs(probe.lat - 37.589) > 0.01) {
  problems.push(
    `투영 검증 실패: 청운동이 (${probe.lon}, ${probe.lat}) — (126.969, 37.589) 여야 합니다`,
  )
}

line('')
line('  UMD CENTROIDS')
line('  ' + '-'.repeat(70))
line(`  ${out.length} 읍면동 · 도형 없음 ${noShape}`)
if (out.length) {
  const lons = out.map((r) => r.lon)
  const lats = out.map((r) => r.lat)
  line(
    `  경도 ${Math.min(...lons).toFixed(3)}~${Math.max(...lons).toFixed(3)}` +
      ` · 위도 ${Math.min(...lats).toFixed(3)}~${Math.max(...lats).toFixed(3)}`,
  )
}
if (probe) line(`  투영 검증  청운동 (${probe.lon}, ${probe.lat})`)
line('  ' + '-'.repeat(70))
if (problems.length) {
  for (const p of problems) line(`  ✗ ${p}`)
  line('')
  process.exit(1)
}

writeFileSync(
  OUT,
  'bjcd,name,lon,lat\n' +
    out.map((r) => `${r.bjcd},${r.name},${r.lon},${r.lat}`).join('\n') +
    '\n',
  'utf8',
)
line('  wrote scripts/rtms/umd.centroids.csv')
line('')
