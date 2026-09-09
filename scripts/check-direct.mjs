#!/usr/bin/env node
/**
 * The scatter, and the three numbers the page is built on.
 *
 * The strong check here is that the correlations are RECOMPUTED from the
 * points the page actually ships. lib/direct.data.ts states r = -0.581 and
 * -0.633 in its header, the page prints them in a heading and a table, and
 * every one of those is a copy. Recomputing from DIRECT_POINTS proves the
 * headline is derivable from the evidence next to it rather than from a run
 * nobody can repeat.
 *
 * The rest is the same discipline as check-renewal.mjs: the intake
 * arithmetic has to close, the floor has to have been applied, and every
 * percentage a headline sentence states has to be a number the data holds.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const line = (s) => process.stdout.write(s + '\n')
const problems = []

const src = readFileSync(join(ROOT, 'lib', 'direct.data.ts'), 'utf8')
const num = (re, what) => {
  const m = re.exec(src)
  if (!m) problems.push(`lib/direct.data.ts: ${what} 를 못 읽었습니다`)
  return Number(m?.[1])
}

const FLOOR = num(/DIRECT_FLOOR = (\d+)/, 'DIRECT_FLOOR')
const NATIONAL = num(/DIRECT_NATIONAL = ([\d.]+)/, 'DIRECT_NATIONAL')
const MEDIAN = num(/DIRECT_MEDIAN = ([\d.]+)/, 'DIRECT_MEDIAN')
const intake = Object.fromEntries(
  [...src.matchAll(/^\s{2}(rows|deals|direct|districts|plotted|belowFloor|offGrid): (\d+),$/gm)]
    .map((m) => [m[1], Number(m[2])]),
)
const R = {
  density: num(/density: (-?[\d.]+),/, 'R.density'),
  pop: num(/\n {2}pop: (-?[\d.]+),/, 'R.pop'),
  both: num(/both: (-?[\d.]+),/, 'R.both'),
}

const points = [...src.matchAll(
  /\{ sido: '([^']+)', sgg: '([^']+)', deals: (\d+), rate: ([\d.]+), density: ([\d.]+), pop: (\d+) \},/g,
)].map((m) => ({
  sido: m[1], sgg: m[2], deals: +m[3], rate: +m[4], density: +m[5], pop: +m[6],
}))

/* --- shape ---------------------------------------------------------- */

if (points.length !== intake.plotted) {
  problems.push(`점 ${points.length}개 ≠ plotted ${intake.plotted}`)
}
if (intake.plotted + intake.belowFloor > intake.districts) {
  problems.push(`plotted ${intake.plotted} + 바닥미달 ${intake.belowFloor} > 거래있는 시군구 ${intake.districts}`)
}
if (intake.direct > intake.deals) problems.push(`직거래 ${intake.direct} > 전체 ${intake.deals}`)
if (intake.offGrid !== 0) problems.push(`격자 밖 행 ${intake.offGrid} — 코드표가 시군구 지도와 어긋납니다`)

const thin = points.filter((p) => p.deals < FLOOR)
if (thin.length) {
  problems.push(`바닥 ${FLOOR} 미만인데 그려진 곳 ${thin.length}: ${thin.slice(0, 3).map((p) => p.sgg).join(', ')}`)
}
for (const p of points) {
  if (!(p.rate > 0) || !(p.density > 0) || !(p.pop > 0)) {
    problems.push(`${p.sgg}: 로그 축에 올릴 수 없는 값 (rate ${p.rate}, density ${p.density}, pop ${p.pop})`)
  }
}
const seen = new Set()
for (const p of points) {
  const name = `${p.sido} ${p.sgg}`
  if (seen.has(name)) problems.push(`${name} 가 두 번 있습니다`)
  seen.add(name)
}

const rates = points.map((p) => p.rate).sort((a, b) => a - b)
const mid = rates[Math.floor(rates.length / 2)]
if (mid !== MEDIAN) problems.push(`중앙값 ${MEDIAN} ≠ 점에서 계산한 ${mid}`)
if (!(NATIONAL > 0 && NATIONAL < 100)) problems.push(`전국 비율 ${NATIONAL} 가 범위 밖입니다`)

/* --- the correlations, recomputed ----------------------------------- */

const ln = Math.log
function pearson(xs, ys) {
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let s = 0, dx = 0, dy = 0
  for (let i = 0; i < n; i++) {
    s += (xs[i] - mx) * (ys[i] - my)
    dx += (xs[i] - mx) ** 2
    dy += (ys[i] - my) ** 2
  }
  return Math.round((s / Math.sqrt(dx * dy)) * 1000) / 1000
}
const rate = points.map((p) => ln(p.rate))
const again = {
  density: pearson(points.map((p) => ln(p.density)), rate),
  pop: pearson(points.map((p) => ln(p.pop)), rate),
  both: pearson(points.map((p) => ln(p.pop)), points.map((p) => ln(p.density))),
}
for (const k of ['density', 'pop', 'both']) {
  if (again[k] !== R[k]) problems.push(`r.${k}: 게시값 ${R[k]} ≠ 점에서 다시 계산한 ${again[k]}`)
}
/* The page's whole argument. If this stops being true the prose is wrong,
   not the chart. */
if (!(Math.abs(again.pop) > Math.abs(again.density))) {
  problems.push(`인구(${again.pop})가 밀도(${again.density})보다 더 잘 설명하지 않습니다 — 페이지의 논지가 무너집니다`)
}

/* --- the sentences -------------------------------------------------- */

/* Rounded variants too: the data keeps two decimals and a sentence quotes
   one. 84.62 in the table is 84.6 in the prose, and that is not a
   discrepancy. */
const allowed = new Set([NATIONAL, MEDIAN, 0, 100])
for (const p of points) {
  allowed.add(p.rate)
  allowed.add(Math.round(p.rate * 10) / 10)
  allowed.add(Math.round(p.rate))
}

/* The counts a sentence on this page is allowed to name, and `plotted - 1`
   with them: the note says "the other N pile into a smudge", which is every
   plotted district but the one in the corner. */
const counts = new Set([
  intake.districts,
  intake.rows,
  intake.deals,
  intake.direct,
  intake.plotted,
  intake.plotted - 1,
  intake.belowFloor,
  intake.offGrid,
  points.length,
  FLOOR,
])

for (const locale of ['ko', 'en']) {
  const dict = readFileSync(join(ROOT, 'lib', 'i18n', 'dictionaries', `${locale}.ts`), 'utf8')
  const block = /\n {2}direct: \{([\s\S]*?)\n {2}\},/.exec(dict)?.[1]
  if (!block) { problems.push(`${locale}.ts: direct 블록이 없습니다`); continue }
  const seo = /\n {4}direct:\n?\s*'([^']*)'/.exec(dict)?.[1] ?? ''
  const texts = [seo]
  for (const key of ['lead', 'note', 'summary']) {
    const m = new RegExp(`\\n {4}${key}:\\n?\\s*'([^']*)'`).exec(block)
    if (m) texts.push(m[1])
  }
  for (const text of texts) {
    for (const [, raw] of text.matchAll(/(\d+(?:\.\d+)?)\s*%/g)) {
      if (!allowed.has(Number(raw))) problems.push(`${locale}.ts: 본문의 ${raw}% 가 데이터에 없는 값입니다`)
    }
    /* `[\d.]+` swallowed the full stop that ends the sentence and turned
       "r = -0.581." into NaN. A number ends at its last digit. */
    for (const [, sign, raw] of text.matchAll(/r = (-?)(\d+(?:\.\d+)?)/g)) {
      const v = Number(`${sign}${raw}`)
      if (![R.density, R.pop, R.both].includes(v)) {
        problems.push(`${locale}.ts: 본문의 r = ${v} 가 데이터에 없는 값입니다`)
      }
    }
    /* BARE COUNTS, because only percentages were checked and a count went
       stale behind the check. The search description said 176 시군구 while
       the chart drew 191: the refetch that added 광주·전남 moved the count,
       every percentage in the same sentence was still valid, and the gate
       passed. Three digits with no decimal point, no comma and no % is a
       district count on this page, and there are only a few it can be. */
    for (const [, raw] of text.matchAll(/(?<![\d.,%])(\d{3})(?![\d.,%])/g)) {
      if (!counts.has(Number(raw))) {
        problems.push(`${locale}.ts: 본문의 ${raw} 이 데이터에 없는 개수입니다`)
      }
    }
  }
}

/* --- report --------------------------------------------------------- */

line('')
line('  DIRECT DEALS')
line('  ' + '-'.repeat(70))
line(`  ${intake.deals.toLocaleString('ko-KR')} 거래 · 시군구 ${intake.districts} → 그린 것 ${points.length} (바닥 ${FLOOR} 미만 ${intake.belowFloor})`)
line(`  전국 ${NATIONAL}% · 중앙 ${MEDIAN}%`)
line(`  r 재계산  밀도 ${again.density}  인구 ${again.pop}  인구↔밀도 ${again.both}`)
line('  ' + '-'.repeat(70))
if (problems.length) {
  for (const p of problems) line(`  ✗ ${p}`)
  line('')
  line(`  FAIL — ${problems.length} problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line('  PASS — 상관계수가 게시된 점에서 다시 나오고, 본문 숫자가 전부 데이터에 있습니다.')
line('')
