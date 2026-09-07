#!/usr/bin/env node
/**
 * The 읍면동 grids, and the weight the budget gate cannot see.
 *
 * scripts/check-budget.mjs measures ROUTES. The drill-down is not a route —
 * it is 215 static JSON files under public/, fetched one at a time — so its
 * payload is invisible there. That is exactly how a budget stops meaning
 * anything, so the ceiling for those files lives here instead.
 *
 * The rest is the shape of the data: a grid whose cells overlap draws two
 * 동 on top of each other, and a file the page can fetch but the module
 * does not know about (or the reverse) is a click that fails or a district
 * that is silently unreachable.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'lib', 'umd.data.ts')
const JSON_DIR = join(ROOT, 'public', 'data', 'umd')

/**
 * Total bytes of the drill-down assets.
 *
 * One click costs one file — 616 bytes on average, under a kilobyte at the
 * worst — so the number that matters for a reader is small. This limit is
 * about the repository: 215 files is the whole country at 읍면동, and if it
 * ever doubles something has changed that should be noticed.
 */
const ASSET_LIMIT = 160 * 1024

const line = (s) => process.stdout.write(s + '\n')
const problems = []

if (!existsSync(DATA)) {
  line('')
  line('  ✗ lib/umd.data.ts 이 없습니다 — pnpm run build:umd')
  line('')
  process.exit(1)
}

const src = readFileSync(DATA, 'utf8')
const num = (re, what) => {
  const m = re.exec(src)
  if (!m) problems.push(`lib/umd.data.ts: ${what} 를 못 읽었습니다`)
  return Number(m?.[1])
}

const FLOOR = num(/UMD_FLOOR = (\d+)/, 'UMD_FLOOR')
const intake = Object.fromEntries(
  [...src.matchAll(
    /^\s{2}(live|joined|unresolved|rolledUp|noBoundary|placed|districtsWithOffices|districtsMapped|districtsSkipped|cells|offices|meanDisplacement): ([\d.]+),$/gm,
  )].map((m) => [m[1], Number(m[2])]),
)

/* Each district block, with its declared grid and its cells. */
const districts = []
for (const m of src.matchAll(
  /\{\s*sgg: '(\d{5})',\s*rows: (\d+),\s*cols: (\d+),\s*cells: \[([\s\S]*?)\n {4}\],\s*\}/g,
)) {
  const cells = [...m[4].matchAll(
    /\{ bjcd: '(\d{10})', name: '([^']*)', offices: (\d+), row: (\d+), col: (\d+) \}/g,
  )].map((c) => ({ bjcd: c[1], name: c[2], offices: +c[3], row: +c[4], col: +c[5] }))
  districts.push({ sgg: m[1], rows: +m[2], cols: +m[3], cells })
}

const linked = new Set([...src.matchAll(/'[^']+': '(\d{5})',/g)].map((m) => m[1]))
const codeMap = linked.size

/* --- shape ---------------------------------------------------------- */

if (districts.length !== intake.districtsMapped) {
  problems.push(`격자 ${districts.length}개 ≠ districtsMapped ${intake.districtsMapped}`)
}
if (codeMap === 0) problems.push('UMD_SGG_BY_DISTRICT 이 비었습니다')

let cellTotal = 0
let officeTotal = 0
const seenSgg = new Set()
const seenBjcd = new Set()

for (const d of districts) {
  if (seenSgg.has(d.sgg)) problems.push(`${d.sgg} 격자가 두 번 있습니다`)
  seenSgg.add(d.sgg)

  if (d.cells.length < FLOOR) {
    problems.push(`${d.sgg}: ${d.cells.length}칸 — 문턱 ${FLOOR} 미만인데 격자가 있습니다`)
  }

  const cellAt = new Set()
  for (const c of d.cells) {
    cellTotal++
    officeTotal += c.offices
    /* Two 동 in one cell is two shapes drawn on top of each other. */
    const key = `${c.row},${c.col}`
    if (cellAt.has(key)) problems.push(`${d.sgg}: (${key}) 에 두 동이 있습니다`)
    cellAt.add(key)
    if (c.row >= d.rows || c.col >= d.cols) {
      problems.push(`${d.sgg} ${c.name}: (${c.row},${c.col}) 가 ${d.rows}x${d.cols} 밖입니다`)
    }
    /* The boundary file is 읍면동 level; a 리 code here means the roll-up
       was skipped and the cell has no polygon behind it. */
    if (!c.bjcd.endsWith('00')) problems.push(`${d.sgg} ${c.name}: ${c.bjcd} 가 리 코드입니다`)
    if (!c.bjcd.startsWith(d.sgg)) problems.push(`${d.sgg} ${c.name}: ${c.bjcd} 가 다른 시군구입니다`)
    if (c.offices <= 0) problems.push(`${d.sgg} ${c.name}: 사무소 ${c.offices}`)
    if (seenBjcd.has(c.bjcd)) problems.push(`${c.bjcd} 가 두 격자에 있습니다`)
    seenBjcd.add(c.bjcd)
  }
  /* A declared grid larger than what is used means the trim did not run. */
  if (Math.max(...d.cells.map((c) => c.row)) + 1 !== d.rows) {
    problems.push(`${d.sgg}: rows ${d.rows} 인데 실제 최대 행은 ${Math.max(...d.cells.map((c) => c.row))}`)
  }
  if (Math.max(...d.cells.map((c) => c.col)) + 1 !== d.cols) {
    problems.push(`${d.sgg}: cols ${d.cols} 인데 실제 최대 열은 ${Math.max(...d.cells.map((c) => c.col))}`)
  }
}

if (cellTotal !== intake.cells) problems.push(`칸 ${cellTotal} ≠ intake.cells ${intake.cells}`)
if (officeTotal !== intake.offices) {
  problems.push(`사무소 ${officeTotal} ≠ intake.offices ${intake.offices}`)
}
if (intake.joined > intake.live) problems.push(`결합 ${intake.joined} > 영업중 ${intake.live}`)

/* --- the files the page fetches ------------------------------------- */

if (!existsSync(JSON_DIR)) {
  problems.push('public/data/umd/ 이 없습니다 — pnpm run build:umd')
} else {
  const files = readdirSync(JSON_DIR).filter((f) => f.endsWith('.json'))
  if (files.length !== districts.length) {
    problems.push(`JSON ${files.length}개 ≠ 격자 ${districts.length}개`)
  }
  let bytes = 0
  let biggest = { size: 0 }
  for (const f of files) {
    const size = statSync(join(JSON_DIR, f)).size
    bytes += size
    if (size > biggest.size) biggest = { size, f }
    const code = f.replace('.json', '')
    if (!seenSgg.has(code)) problems.push(`${f}: 데이터 모듈에 없는 시군구입니다`)
  }
  for (const d of districts) {
    if (!existsSync(join(JSON_DIR, `${d.sgg}.json`))) {
      problems.push(`${d.sgg}: 격자는 있는데 JSON 이 없습니다 — 클릭이 실패합니다`)
    }
  }
  /* Every file has to parse and agree with the module, or a click renders a
     grid that disagrees with the map it came from. */
  for (const d of districts) {
    const p = join(JSON_DIR, `${d.sgg}.json`)
    if (!existsSync(p)) continue
    let g
    try {
      g = JSON.parse(readFileSync(p, 'utf8'))
    } catch {
      problems.push(`${d.sgg}.json 이 JSON 이 아닙니다`)
      continue
    }
    if (g.r !== d.rows || g.c !== d.cols) {
      problems.push(`${d.sgg}.json: ${g.r}x${g.c} ≠ 모듈 ${d.rows}x${d.cols}`)
    }
    if (!Array.isArray(g.cells) || g.cells.length !== d.cells.length) {
      problems.push(`${d.sgg}.json: 칸 ${g.cells?.length} ≠ 모듈 ${d.cells.length}`)
    }
  }
  const kb = (n) => (n / 1024).toFixed(1)
  if (bytes > ASSET_LIMIT) {
    problems.push(
      `정적 JSON 합계 ${kb(bytes)} KB > 한도 ${kb(ASSET_LIMIT)} KB — 예산 게이트는 이걸 못 봅니다`,
    )
  }
  line('')
  line('  UMD GRIDS')
  line('  ' + '-'.repeat(70))
  line(
    `  격자 ${districts.length} · 칸 ${cellTotal.toLocaleString('ko-KR')} · 사무소 ${officeTotal.toLocaleString('ko-KR')}` +
      ` · 문턱 ${FLOOR} · 이름표 ${codeMap}`,
  )
  line(
    `  정적 JSON ${files.length}개 · ${kb(bytes)} / ${kb(ASSET_LIMIT)} KB` +
      ` · 최대 ${biggest.f} ${biggest.size} B · 평균 ${Math.round(bytes / files.length)} B`,
  )
  /* Grids nothing links to. Not a failure: a district can have offices and
     enough 읍면동 while having no cell on the national map, because that map
     drops the eleven wards created after its 2023 boundary file. Reported so
     the number is known rather than discovered. */
  const orphan = districts.filter((d) => !linked.has(d.sgg)).map((d) => d.sgg)
  if (orphan.length) {
    line(`  링크 없는 격자 ${orphan.length}개 — 전국 지도에 칸이 없는 시군구 (${orphan.slice(0, 4).join(', ')}${orphan.length > 4 ? ' …' : ''})`)
  }
  line(
    `  결합 ${intake.joined.toLocaleString('ko-KR')}/${intake.live.toLocaleString('ko-KR')}` +
      ` (${((intake.joined / intake.live) * 100).toFixed(2)}%) · 리 롤업 ${intake.rolledUp.toLocaleString('ko-KR')}` +
      ` · 평균 이동 ${intake.meanDisplacement}칸`,
  )
  line('  ' + '-'.repeat(70))
}

if (problems.length) {
  for (const p of problems.slice(0, 12)) line(`  ✗ ${p}`)
  if (problems.length > 12) line(`  … 그리고 ${problems.length - 12}건 더`)
  line('')
  line(`  FAIL — ${problems.length} problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line('  PASS — 격자가 겹치지 않고, JSON 이 모듈과 일치하고, 자산 무게가 한도 안입니다.')
line('')
