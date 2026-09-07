#!/usr/bin/env node
/**
 * Derive lib/umd.data.ts — one hexagon grid per district, at 읍면동 level.
 *
 * WHAT THIS IS FOR. The district map answers "where are the brokerage
 * offices" at 시군구. Clicking a hexagon should answer the same question one
 * level down. 중개사무소 등록현황, which the 시군구 map uses, is published as
 * district totals and nothing finer, so this reads the office-level file
 * instead: 부동산중개업정보, one row per office.
 *
 * THE JOIN IS THE HARD PART, and it broke twice.
 *
 *   First, the file's `법정동코드` column is five digits — the district, not
 *   the 동, despite the name. The 동 exists only inside `지번주소`. Nor is
 *   `도로명주소코드` any help: its first ten digits resolve as a 법정동 code
 *   for 0.2% of rows, and for those it points somewhere else entirely.
 *
 *   So addresses are matched against the full 법정동 name table by LONGEST
 *   PREFIX on the space-stripped string, which handles the file's habit of
 *   writing 수원시장안구 without a space. Tokenising the address first got
 *   70%; this gets 99.4%. Three fallbacks carry the rest: 세종's doubled
 *   name (세종특별자치시 세종시 나성동), the 전남광주 merge against the older
 *   code table, and — for wards created after that table — 시도 plus 동 name,
 *   accepted only when exactly one 동 in that 시도 has the name. When two do,
 *   the row is dropped rather than guessed.
 *
 *   Second, 13% of resolved codes are 리 (a village under a 읍 or 면), whose
 *   codes do not end in 00 and therefore match no 읍면동 boundary. Rolling
 *   them up to their parent — the first eight digits — moves coverage from
 *   86.4% of offices to 99.2%. This was the 법정동/행정동 hazard the plan
 *   warned about, arriving in a shape nobody predicted.
 *
 * ONE GRID PER DISTRICT, and each is small: five to seventy cells against
 * the national map's 245. The placement is the same idea as the national one
 * — centroids projected, longitude scaled by cos(latitude), then an OPTIMAL
 * assignment to cells rather than a greedy pass — but there is no land mask.
 * At this size a mask would leave a district's shape to whichever three
 * cells happened to contain a centre. Instead the grid is shaped like the
 * district's own bounding box and given half again as many cells as it
 * needs, so the outline has room to form.
 *
 * A FLOOR OF FIVE. Below that a hexagon grid is three shapes in a row, not a
 * map. The districts that miss it are counted and get no page, and the
 * national map dims their cell rather than pretending it links somewhere.
 *
 * Run after `pnpm run umd:centroids`.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const AGENCY = join(ROOT, '.rtms-cache', 'source', 'agency.raw')
const LAWD = join(ROOT, '.rtms-cache', 'source', 'lawd.raw')
const CENTROIDS = join(ROOT, 'scripts', 'rtms', 'umd.centroids.csv')
const OUT = join(ROOT, 'lib', 'umd.data.ts')
/**
 * One static JSON per district, fetched on click.
 *
 * The alternative was a route per district — 215 of them, 430 pages with the
 * locales. Measured against it: all 215 grids inlined into the national map
 * would be 32.8 KB gzip of markup and about the same again as serialized
 * tree, on a page already at 28.3 KB. A single district is 221 bytes at the
 * median and 708 at the worst. So the grids are files, the page fetches the
 * one that was clicked, and the route count does not move.
 *
 * `public/` is copied verbatim by the export, so these are plain assets. The
 * budget gate measures routes, not assets, so their weight is reported by
 * this script and checked by scripts/check-umd.mjs — a payload the gate
 * cannot see is exactly the thing this repository does not allow.
 */
const JSON_DIR = join(ROOT, 'public', 'data', 'umd')

/** Cells below which a grid is not a map. */
const FLOOR = 5
/** Cells offered per cell needed, so a shape has somewhere to form. */
const SLACK = 1.5

/* The national map's geometry, so a child grid looks like its parent. */
const STEP_X = 30
const STEP_Y = 26

const line = (s) => process.stdout.write(s + '\n')
const die = (m) => {
  process.stderr.write(`\n  x ${m}\n\n`)
  process.exit(1)
}

for (const p of [AGENCY, LAWD, CENTROIDS]) {
  if (!existsSync(p)) die(`${p} 이 없습니다`)
}

const nfc = (v) => String(v ?? '').normalize('NFC').trim()
const flat = (s) => s.replace(/ /g, '')

/** Minimal CSV: quoted fields, no embedded newlines. Enough for these. */
function* rows(text) {
  for (const raw of text.split('\n')) {
    const l = raw.replace(/\r$/, '')
    if (!l) continue
    const out = []
    let cur = ''
    let q = false
    for (const ch of l) {
      if (ch === '"') q = !q
      else if (ch === ',' && !q) {
        out.push(cur)
        cur = ''
      } else cur += ch
    }
    out.push(cur)
    yield out
  }
}

const decodeCp949 = (path) => new TextDecoder('euc-kr').decode(readFileSync(path))

/* --- the 법정동 name table ------------------------------------------ */

const byName = new Map()
const byLength = new Map()
const bySido = new Map()

for (const r of rows(decodeCp949(LAWD))) {
  if (r.length < 3 || r[0] === '법정동코드') continue
  const code = r[0].trim()
  if (nfc(r[2]) !== '존재' || code.endsWith('00000')) continue
  const name = nfc(r[1])
  const key = flat(name)
  byName.set(key, code)
  if (!byLength.has(key.length)) byLength.set(key.length, new Set())
  byLength.get(key.length).add(key)
  const parts = name.split(' ')
  if (!bySido.has(parts[0])) bySido.set(parts[0], new Map())
  const pool = bySido.get(parts[0])
  const leaf = parts[parts.length - 1]
  if (!pool.has(leaf)) pool.set(leaf, new Set())
  pool.get(leaf).add(code)
}
const lengths = [...byLength.keys()].sort((a, b) => b - a)

/** 2026 names against a 2025 table. */
const ALIAS = new Map([['전남광주통합특별시', ['광주광역시', '전라남도']]])

const longestPrefix = (a) => {
  for (const L of lengths) {
    if (L <= a.length && byLength.get(L).has(a.slice(0, L))) return byName.get(a.slice(0, L))
  }
  return null
}

function resolveAddress(address) {
  const a = flat(address)
  if (!a) return null

  const direct = longestPrefix(a)
  if (direct) return direct

  if (a.startsWith('세종특별자치시세종시')) {
    const c = longestPrefix('세종특별자치시' + a.slice('세종특별자치시세종시'.length))
    if (c) return c
  }

  for (const [now, before] of ALIAS) {
    if (!a.startsWith(now)) continue
    for (const old of before) {
      const c = longestPrefix(old + a.slice(now.length))
      if (c) return c
    }
  }

  /* Wards created after the code table. The district is unrecognisable but
     the 동 under it is not — accepted only when the name is unambiguous
     inside its province. */
  const tokens = address.split(/\s+/)
  if (tokens.length >= 3) {
    for (const sido of ALIAS.get(tokens[0]) ?? [tokens[0]]) {
      const pool = bySido.get(sido)
      if (!pool) continue
      for (const t of tokens.slice(1)) {
        const hits = pool.get(t)
        if (hits && hits.size === 1) return [...hits][0]
      }
    }
  }
  return null
}

/* --- 시군구 name -> code, for the parent map's links ----------------- */

const sggCode = new Map()
for (const r of rows(decodeCp949(LAWD))) {
  if (r.length < 3 || r[0] === '법정동코드') continue
  const code = r[0].trim()
  if (nfc(r[2]) !== '존재' || !code.endsWith('00000')) continue
  const parts = nfc(r[1]).split(' ')
  if (parts.length < 2) {
    /* 세종 has no district level: the province IS the district. */
    sggCode.set(`${parts[0]}\t세종시`, code.slice(0, 5))
    continue
  }
  sggCode.set(`${parts[0]}\t${parts.slice(1).join('')}`, code.slice(0, 5))
}

/* --- offices -------------------------------------------------------- */

const centroid = new Map()
for (const r of rows(readFileSync(CENTROIDS, 'utf8'))) {
  if (r[0] === 'bjcd') continue
  centroid.set(r[0], { name: nfc(r[1]), lon: Number(r[2]), lat: Number(r[3]) })
}

const offices = new Map()
let live = 0
let joined = 0
let unresolved = 0
let noBoundary = 0
let rolled = 0

{
  let header = null
  for (const r of rows(decodeCp949(AGENCY))) {
    if (!header) {
      header = r.map(nfc)
      continue
    }
    const row = {}
    header.forEach((h, i) => (row[h] = r[i]))
    if (nfc(row['상태구분명']) !== '영업중') continue
    live++
    const code = resolveAddress(nfc(row['지번주소']))
    if (!code) {
      unresolved++
      continue
    }
    joined++
    /* 리 -> its parent 읍/면. The boundary file is 읍면동 level. */
    const cell = code.slice(0, 8) + '00'
    if (cell !== code) rolled++
    if (!centroid.has(cell)) {
      noBoundary++
      continue
    }
    offices.set(cell, (offices.get(cell) ?? 0) + 1)
  }
}

const placed = [...offices.values()].reduce((a, b) => a + b, 0)

/* --- Hungarian ------------------------------------------------------ */

/**
 * Jonker-Volgenant shortest augmenting path. O(n^3), and n <= 70 here.
 *
 * Same objective as the national grid — minimise total squared displacement
 * — because a greedy nearest-free-cell pass produces an arrangement that
 * depends on the order districts are considered in, and "deterministic" is
 * not the same as "the best one available".
 */
function assign(cost, n, m) {
  const INF = Infinity
  const u = new Float64Array(n + 1)
  const v = new Float64Array(m + 1)
  const p = new Int32Array(m + 1)
  const way = new Int32Array(m + 1)
  for (let i = 1; i <= n; i++) {
    p[0] = i
    let j0 = 0
    const minv = new Float64Array(m + 1).fill(INF)
    const used = new Uint8Array(m + 1)
    do {
      used[j0] = 1
      const i0 = p[j0]
      let delta = INF
      let j1 = 0
      for (let j = 1; j <= m; j++) {
        if (used[j]) continue
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j]
        if (cur < minv[j]) {
          minv[j] = cur
          way[j] = j0
        }
        if (minv[j] < delta) {
          delta = minv[j]
          j1 = j
        }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]] += delta
          v[j] -= delta
        } else minv[j] -= delta
      }
      j0 = j1
    } while (p[j0] !== 0)
    do {
      const j1 = way[j0]
      p[j0] = p[j1]
      j0 = j1
    } while (j0)
  }
  const out = new Int32Array(n).fill(-1)
  for (let j = 1; j <= m; j++) if (p[j]) out[p[j] - 1] = j - 1
  return out
}

/* --- one grid per district ------------------------------------------ */

const bySgg = new Map()
for (const [code, count] of offices) {
  const sgg = code.slice(0, 5)
  if (!bySgg.has(sgg)) bySgg.set(sgg, [])
  bySgg.get(sgg).push({ bjcd: code, offices: count, ...centroid.get(code) })
}

const districts = []
const skipped = []
let totalDisp = 0
let totalCells = 0
let worst = { d: 0 }

for (const [sgg, list] of [...bySgg].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (list.length < FLOOR) {
    skipped.push(sgg)
    continue
  }
  list.sort((a, b) => a.bjcd.localeCompare(b.bjcd))
  const n = list.length
  const meanLat = list.reduce((s, d) => s + d.lat, 0) / n
  const k = Math.cos((meanLat * Math.PI) / 180)
  const px = list.map((d) => d.lon * k)
  const py = list.map((d) => -d.lat)
  const x0 = Math.min(...px)
  const y0 = Math.min(...py)
  const w = Math.max(Math.max(...px) - x0, 1e-9)
  const h = Math.max(Math.max(...py) - y0, 1e-9)

  /* Shape the grid like the district: the bounding box aspect, corrected for
     the hexagon step being wider than it is tall. A square grid would make a
     long coastal county look round. */
  const target = Math.max(n + 1, Math.ceil(n * SLACK))
  const aspect = (w / h) * (STEP_Y / STEP_X)
  const cols = Math.max(2, Math.round(Math.sqrt(target * aspect)))
  let gridRows = Math.max(2, Math.ceil(target / cols))
  while (cols * gridRows < n) gridRows++

  const spanX = (cols - 1) * STEP_X + STEP_X / 2
  const spanY = (gridRows - 1) * STEP_Y

  const cells = []
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ r, c, x: c * STEP_X + (r % 2 ? STEP_X / 2 : 0), y: r * STEP_Y })
    }
  }

  const want = list.map((_, i) => ({
    x: ((px[i] - x0) / w) * spanX,
    y: ((py[i] - y0) / h) * spanY,
  }))
  const cost = want.map((p) => cells.map((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2))
  const pick = assign(cost, n, cells.length)

  const used = []
  for (let i = 0; i < n; i++) {
    const cell = cells[pick[i]]
    const d = Math.hypot((cell.x - want[i].x) / STEP_X, (cell.y - want[i].y) / STEP_Y)
    totalDisp += d
    totalCells++
    if (d > worst.d) worst = { d, name: list[i].name, sgg }
    used.push({ ...list[i], row: cell.r, col: cell.c })
  }

  /* Trim to what is used. Rows shift by an EVEN amount so the odd-row offset
     that makes the grid hexagonal survives the move. */
  let minRow = Math.min(...used.map((r) => r.row))
  if (minRow % 2) minRow--
  const minCol = Math.min(...used.map((r) => r.col))
  for (const r of used) {
    r.row -= minRow
    r.col -= minCol
  }
  districts.push({
    sgg,
    rows: Math.max(...used.map((r) => r.row)) + 1,
    cols: Math.max(...used.map((r) => r.col)) + 1,
    cells: used.sort((a, b) => a.row - b.row || a.col - b.col),
  })
}

/* --- emit ----------------------------------------------------------- */

/** Districts on the national map that this table could not give a code. */
const missingCode = []

const meanDisp = Math.round((totalDisp / totalCells) * 100) / 100
const cellCount = districts.reduce((a, d) => a + d.cells.length, 0)
const officeCount = districts.reduce((a, d) => a + d.cells.reduce((b, c) => b + c.offices, 0), 0)
const sizes = districts.map((d) => d.cells.length).sort((a, b) => a - b)

const ts = `/**
 * 읍면동별 중개사무소, 시군구마다 하나의 육각 격자.
 *
 * GENERATED by scripts/build-umd.mjs — do not hand-edit.
 *
 * ${districts.length} districts of ${bySgg.size} clear a ${FLOOR}-cell floor and get a grid;
 * ${skipped.length} do not and get no page. Between them ${cellCount.toLocaleString('en-US')} 읍면동 carry
 * ${officeCount.toLocaleString('en-US')} offices.
 *
 * HOW THE OFFICES GOT HERE. 부동산중개업정보 gives one row per office with
 * the 동 only inside its address, so addresses are matched against the
 * 법정동 name table by longest prefix: ${joined.toLocaleString('en-US')} of
 * ${live.toLocaleString('en-US')} live offices resolved (${((joined / live) * 100).toFixed(2)}%).
 * ${rolled.toLocaleString('en-US')} of those resolved to a 리 and were rolled up to the 읍/면
 * above it, because the boundary file is 읍면동 level.
 * ${noBoundary.toLocaleString('en-US')} resolved to a 동 with no boundary and
 * ${unresolved.toLocaleString('en-US')} did not resolve at all — both counted rather than
 * distributed.
 *
 * PLACEMENT. Centroids from the 읍면동 boundary Shapefile, longitude scaled
 * by cos(latitude), assigned to cells by the Hungarian algorithm on squared
 * distance — the optimal arrangement, not a greedy one. Each grid is shaped
 * like its district's bounding box and given half again as many cells as it
 * needs, so the outline has room to form. Mean displacement ${meanDisp} cells;
 * the worst is ${worst.name ?? '?'} at ${Math.round(worst.d * 100) / 100}.
 *
 * There is no land mask here, unlike the national map. At ${sizes[0]} to
 * ${sizes[sizes.length - 1]} cells a mask would hand a district's shape to
 * whichever cells happened to contain a centre.
 */

export type UmdCell = {
  /** 법정동코드, 읍면동 level — the last two digits are always 00. */
  readonly bjcd: string
  readonly name: string
  readonly offices: number
  readonly row: number
  readonly col: number
}

export type UmdDistrict = {
  /** 시군구코드, five digits. The route parameter. */
  readonly sgg: string
  readonly rows: number
  readonly cols: number
  readonly cells: readonly UmdCell[]
}

/** Cells below which a district gets no page. */
export const UMD_FLOOR = ${FLOOR}

export const UMD_INTAKE = {
  live: ${live},
  joined: ${joined},
  unresolved: ${unresolved},
  rolledUp: ${rolled},
  noBoundary: ${noBoundary},
  placed: ${placed},
  districtsWithOffices: ${bySgg.size},
  districtsMapped: ${districts.length},
  districtsSkipped: ${skipped.length},
  cells: ${cellCount},
  offices: ${officeCount},
  meanDisplacement: ${meanDisp},
} as const

/** Districts with offices but fewer than the floor — no page, dimmed cell. */
export const UMD_SKIPPED: readonly string[] = [${skipped.map((s) => `'${s}'`).join(', ')}]

/**
 * The national map's own labels to a district code.
 *
 * lib/cartogram.districts.data.ts stores names, not codes, because nothing
 * on that map needed one. The drill-down does: the code is the file it
 * fetches. Keeping the lookup here rather than regenerating that table means
 * the placement data and the link data can be rebuilt independently.
 */
export const UMD_SGG_BY_DISTRICT: Readonly<Record<string, string>> = {
${(() => {
  const src = readFileSync(join(ROOT, 'lib', 'cartogram.districts.data.ts'), 'utf8')
  const out = []
  for (const m of src.matchAll(/sido: '([^']+)', sgg: '([^']+)'/g)) {
    /* The merged province is not in the 2025 code table under its new
       name, so its districts are looked up under the two it replaced. */
    const sidos = [nfc(m[1]), ...(ALIAS.get(nfc(m[1])) ?? [])]
    let code = null
    for (const sido of sidos) {
      code = sggCode.get(`${sido}\t${nfc(m[2])}`)
      if (code) break
    }
    if (code) out.push(`  '${m[1]} ${m[2]}': '${code}',`)
    else missingCode.push(`${m[1]} ${m[2]}`)
  }
  return out.join('\n')
})()}
}

export const UMD_DISTRICTS: readonly UmdDistrict[] = [
${districts
  .map(
    (d) => `  {
    sgg: '${d.sgg}',
    rows: ${d.rows},
    cols: ${d.cols},
    cells: [
${d.cells
  .map(
    (c) =>
      `      { bjcd: '${c.bjcd}', name: '${c.name.replace(/'/g, "\\'")}', offices: ${c.offices}, row: ${c.row}, col: ${c.col} },`,
  )
  .join('\n')}
    ],
  },`,
  )
  .join('\n')}
]
`

writeFileSync(OUT, ts, 'utf8')

/* One file per district. Rebuilt from scratch so a district that drops below
   the floor does not leave a stale grid behind for the page to fetch. */
rmSync(JSON_DIR, { recursive: true, force: true })
mkdirSync(JSON_DIR, { recursive: true })
let jsonBytes = 0
for (const d of districts) {
  /* Short keys. These are read by one function in one component, and at 215
     files the difference between `name` and `n` is real. */
  const body = JSON.stringify({
    r: d.rows,
    c: d.cols,
    cells: d.cells.map((c) => ({ n: c.name, o: c.offices, y: c.row, x: c.col })),
  })
  writeFileSync(join(JSON_DIR, `${d.sgg}.json`), body, 'utf8')
  jsonBytes += Buffer.byteLength(body)
}

line('')
line('  UMD GRIDS')
line('  ' + '-'.repeat(70))
line(
  `  영업중 ${live.toLocaleString('ko-KR')} · 결합 ${joined.toLocaleString('ko-KR')} (${((joined / live) * 100).toFixed(2)}%)` +
    ` · 리 롤업 ${rolled.toLocaleString('ko-KR')} · 경계없음 ${noBoundary.toLocaleString('ko-KR')} · 미해석 ${unresolved.toLocaleString('ko-KR')}`,
)
line(
  `  시군구 ${bySgg.size} → 격자 ${districts.length} (${FLOOR}칸 미만 ${skipped.length}곳 제외)` +
    ` · 칸 ${cellCount.toLocaleString('ko-KR')} · 사무소 ${officeCount.toLocaleString('ko-KR')}`,
)
line(`  평균 이동 ${meanDisp}칸 · 최대 ${Math.round(worst.d * 100) / 100} (${worst.name ?? '?'})`)
line(`  격자 크기  중앙 ${sizes[sizes.length >> 1]} · 최소 ${sizes[0]} · 최대 ${sizes[sizes.length - 1]}`)
line(
  `  정적 JSON ${districts.length}개 · 합 ${(jsonBytes / 1024).toFixed(1)} KB` +
    ` · 한 곳 평균 ${Math.round(jsonBytes / districts.length)} B`,
)
line('  ' + '-'.repeat(70))
line('  wrote lib/umd.data.ts + public/data/umd/*.json')
line('')
