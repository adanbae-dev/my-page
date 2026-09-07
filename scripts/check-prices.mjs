#!/usr/bin/env node
/**
 * The price map, and the sentences about it.
 *
 * Three things this gate exists for, in order of how badly they would fail:
 *
 *   1  THE MIDPOINT. A diverging scale means one thing: the colour changes
 *      side where the value changes sign. If zero is not an edge, the map
 *      says teal for a rise somewhere and nothing on the page would show it.
 *   2  THE CLASSES. Counts have to add up to the measured districts, and
 *      every district's published change has to fall in the class the edges
 *      put it in. The counts are printed in the legend; a legend that
 *      disagrees with the map is worse than no legend.
 *   3  THE PROSE. Same rule as the other two data pages: every percentage a
 *      headline sentence states has to be a number the data holds.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const line = (s) => process.stdout.write(s + '\n')
const problems = []

const src = readFileSync(join(ROOT, 'lib', 'prices.data.ts'), 'utf8')
const one = (re, what) => {
  const m = re.exec(src)
  if (!m) problems.push(`lib/prices.data.ts: ${what} 를 못 읽었습니다`)
  return m?.[1]
}

const EDGES = (one(/PRICE_EDGES: readonly number\[\] = \[([^\]]+)\]/, 'PRICE_EDGES') ?? '')
  .split(',').map((x) => Number(x.trim()))
const COUNTS = (one(/PRICE_COUNTS: readonly number\[\] = \[([^\]]+)\]/, 'PRICE_COUNTS') ?? '')
  .split(',').map((x) => Number(x.trim()))
const FLOOR = Number(one(/PRICE_FLOOR = (\d+)/, 'PRICE_FLOOR'))
const intake = Object.fromEntries(
  [...src.matchAll(/^\s{2}(rows|pairs|districts|measured|thin): (\d+),$/gm)]
    .map((m) => [m[1], Number(m[2])]),
)
const stats = Object.fromEntries(
  [...src.matchAll(/^\s{2}(median|min|max|fell|rose): (-?[\d.]+),$/gm)]
    .map((m) => [m[1], Number(m[2])]),
)
const values = [...src.matchAll(
  /\{ sido: '([^']+)', sgg: '([^']+)', change: (-?[\d.]+), pairs: (\d+) \},/g,
)].map((m) => ({ sido: m[1], sgg: m[2], change: +m[3], pairs: +m[4] }))

/* --- 1. the midpoint ------------------------------------------------ */

if (!EDGES.includes(0)) {
  problems.push(`경계에 0 이 없습니다 [${EDGES.join(', ')}] — 발산형 축척이 부호에서 갈리지 않습니다`)
}
for (let i = 1; i < EDGES.length; i++) {
  if (!(EDGES[i] > EDGES[i - 1])) problems.push(`경계가 오르지 않습니다: ${EDGES[i - 1]} → ${EDGES[i]}`)
}

/* --- 2. the classes ------------------------------------------------- */

const classOf = (v) => {
  for (let i = EDGES.length - 1; i >= 0; i--) if (v >= EDGES[i]) return i + 1
  return 0
}
if (COUNTS.length !== EDGES.length + 1) {
  problems.push(`계급 ${COUNTS.length}개, 경계 ${EDGES.length}개면 ${EDGES.length + 1}개여야 합니다`)
}
const again = new Array(EDGES.length + 1).fill(0)
for (const v of values) again[classOf(v.change)]++
for (let i = 0; i < again.length; i++) {
  if (again[i] !== COUNTS[i]) {
    problems.push(`계급 ${i}: 게시 ${COUNTS[i]} ≠ 값에서 다시 센 ${again[i]}`)
  }
}
const total = COUNTS.reduce((a, b) => a + b, 0)
if (total !== values.length) problems.push(`계급 합 ${total} ≠ 값 ${values.length}개`)
if (values.length !== intake.measured) {
  problems.push(`값 ${values.length}개 ≠ measured ${intake.measured}`)
}
if (intake.measured > intake.districts) {
  problems.push(`measured ${intake.measured} > 격자 ${intake.districts}`)
}

const thin = values.filter((v) => v.pairs < FLOOR)
if (thin.length) {
  problems.push(`짝 ${FLOOR} 미만인데 값이 있는 곳 ${thin.length}: ${thin.slice(0, 3).map((v) => v.sgg).join(', ')}`)
}
const seen = new Set()
for (const v of values) {
  const k = `${v.sido} ${v.sgg}`
  if (seen.has(k)) problems.push(`${k} 가 두 번 있습니다`)
  seen.add(k)
}

/* Recount the headline split from the values themselves. */
const fell = values.filter((v) => v.change < 0).length
const rose = values.filter((v) => v.change > 0).length
if (fell !== stats.fell) problems.push(`하락 게시 ${stats.fell} ≠ 다시 센 ${fell}`)
if (rose !== stats.rose) problems.push(`상승 게시 ${stats.rose} ≠ 다시 센 ${rose}`)
const sorted = values.map((v) => v.change).sort((a, b) => a - b)
if (sorted[0] !== stats.min) problems.push(`최소 게시 ${stats.min} ≠ ${sorted[0]}`)
if (sorted[sorted.length - 1] !== stats.max) problems.push(`최대 게시 ${stats.max} ≠ ${sorted[sorted.length - 1]}`)

/* --- 3. the sentences ----------------------------------------------- */

const allowed = new Set([0, 100, stats.median, stats.min, stats.max])
for (const v of values) {
  allowed.add(v.change)
  allowed.add(Math.round(v.change))
}
for (const e of EDGES) allowed.add(Math.abs(e))

for (const locale of ['ko', 'en']) {
  const dict = readFileSync(join(ROOT, 'lib', 'i18n', 'dictionaries', `${locale}.ts`), 'utf8')
  const block = /\n {2}prices: \{([\s\S]*?)\n {2}\},/.exec(dict)?.[1]
  if (!block) { problems.push(`${locale}.ts: prices 블록이 없습니다`); continue }
  const seo = /\n {4}prices:\n?\s*'([^']*)'/.exec(dict)?.[1] ?? ''
  const texts = [seo]
  for (const key of ['lead', 'note', 'summary']) {
    const m = new RegExp(`\\n {4}${key}:\\n?\\s*'([^']*)'`).exec(block)
    if (m) texts.push(m[1])
  }
  for (const text of texts) {
    for (const [, raw] of text.matchAll(/(\d+(?:\.\d+)?)\s*%/g)) {
      if (!allowed.has(Number(raw))) {
        problems.push(`${locale}.ts: 본문의 ${raw}% 가 데이터에 없는 값입니다`)
      }
    }
  }
}

/* --- report --------------------------------------------------------- */

line('')
line('  PRICE CHANGE')
line('  ' + '-'.repeat(70))
line(`  짝 ${intake.pairs.toLocaleString('ko-KR')} · 측정 ${intake.measured}/${intake.districts} (짝 ${FLOOR} 미만 ${intake.thin})`)
line(`  하락 ${fell} · 상승 ${rose} · 중앙 ${stats.median}% · 범위 ${stats.min}% ~ ${stats.max}%`)
line(`  경계 [${EDGES.join(', ')}] · 계급 ${COUNTS.join(' / ')}`)
line('  ' + '-'.repeat(70))
if (problems.length) {
  for (const p of problems) line(`  ✗ ${p}`)
  line('')
  line(`  FAIL — ${problems.length} problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line('  PASS — 0 에서 갈리고, 계급이 값에서 다시 나오고, 본문 숫자가 데이터에 있습니다.')
line('')
