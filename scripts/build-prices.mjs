#!/usr/bin/env node
/**
 * Derive lib/prices.data.ts from the trade cache.
 *
 * MATCHED PAIRS, NOT MEDIANS. A district's median sale price moves when the
 * mix of what sold moves, and the mix moves constantly — one tower closing
 * out its units will lift a district that did not change. Comparing raw
 * medians would have drawn a map of "where expensive apartments happened to
 * sell", labelled it price change, and been wrong in a way nothing on the
 * page would reveal.
 *
 * So the unit of comparison is a (district, complex, 10 square metre band)
 * that transacted in BOTH ends of the window. Each pair contributes one
 * percentage change of its median price per unit area, and the district is
 * the median of its pairs. That holds the building, the size class and the
 * neighbourhood fixed, which is as close to repeat sales as filings without
 * a unit identifier allow.
 *
 * WHAT IT COSTS: a district needs the same complexes trading twice, months
 * apart. The ones that do not are never guessed at — they get their own
 * class and their own swatch.
 *
 * Run after `node scripts/fetch-rtms.mjs trade <from> <to>`.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, '.rtms-cache', 'trade')
const OUT = join(ROOT, 'lib', 'prices.data.ts')

/** Pairs below which a district's change is noise. */
const FLOOR = 20

/**
 * Class edges, chosen rather than derived.
 *
 * Every other figure on this site classes by the data — quantiles on the
 * histogram, natural breaks on the district map. A diverging scale cannot:
 * its midpoint has to be zero, because zero is what the two colours mean.
 * Once the midpoint is fixed the edges may as well be numbers a reader can
 * hold, so they are round. The observed range is printed beside them.
 */
const EDGES = [-5, -2, 0, 2, 5, 10, 15]

const money = (v) => {
  const n = Number(String(v ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}
const nfc = (v) => String(v ?? '').normalize('NFC').trim()
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const lawd = JSON.parse(readFileSync(join(ROOT, 'scripts', 'rtms', 'lawd.json'), 'utf8'))
const byCode = new Map(lawd.map((r) => [r.lawd, `${r.sido}\t${r.sgg}`]))

const dsrc = readFileSync(join(ROOT, 'lib', 'cartogram.districts.data.ts'), 'utf8')
const grid = [
  ...dsrc.matchAll(/sido: '([^']+)', sgg: '([^']+)', row: (\d+), col: (\d+),/g),
].map((m) => ({ sido: nfc(m[1]), sgg: nfc(m[2]), row: +m[3], col: +m[4] }))

const files = readdirSync(CACHE).filter((f) => f.endsWith('.json'))
if (!files.length) {
  process.stderr.write('\n  x .rtms-cache/trade is empty\n\n')
  process.exit(1)
}

const months = [...new Set(files.map((f) => f.replace('.json', '').split('-')[1]))].sort()
if (months.length < 6) {
  process.stderr.write(`\n  x window is ${months.length} months, need at least 6\n\n`)
  process.exit(1)
}
const EARLY = new Set(months.slice(0, 3))
const LATE = new Set(months.slice(-3))

const early = new Map()
const late = new Map()
let rows = 0

for (const f of files) {
  const [code, ym] = f.replace('.json', '').split('-')
  const key = byCode.get(code)
  if (!key) continue
  const half = EARLY.has(ym) ? early : LATE.has(ym) ? late : null
  if (!half) continue
  for (const r of JSON.parse(readFileSync(join(CACHE, f), 'utf8'))) {
    const amount = money(r.dealAmount)
    const area = Number(r.excluUseAr) || 0
    if (amount <= 0 || area <= 0) continue
    rows++
    /* Price per unit area. The unit never reaches the page — only the
       percentage change does — so it only has to be consistent. Tab
       separated, because a complex name can contain a space. */
    const k = `${key}\t${nfc(r.aptNm)}\t${Math.round(area / 10)}`
    const list = half.get(k)
    if (list) list.push(amount / area)
    else half.set(k, [amount / area])
  }
}

const perDistrict = new Map()
let pairs = 0
for (const [k, before] of early) {
  const after = late.get(k)
  if (!after) continue
  const a = median(before)
  const b = median(after)
  if (!(a > 0)) continue
  pairs++
  const parts = k.split('\t')
  const district = `${parts[0]}\t${parts[1]}`
  const change = ((b - a) / a) * 100
  const list = perDistrict.get(district)
  if (list) list.push(change)
  else perDistrict.set(district, [change])
}

const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d
const classOf = (v) => {
  for (let i = EDGES.length - 1; i >= 0; i--) if (v >= EDGES[i]) return i + 1
  return 0
}

const values = []
let thin = 0
for (const g of grid) {
  const list = perDistrict.get(`${g.sido}\t${g.sgg}`)
  if (!list || list.length < FLOOR) {
    if (list) thin++
    continue
  }
  values.push({ sido: g.sido, sgg: g.sgg, change: round(median(list)), pairs: list.length })
}
values.sort((a, b) => b.change - a.change)

const changes = values.map((v) => v.change)
const sorted = [...changes].sort((a, b) => a - b)
const counts = new Array(EDGES.length + 1).fill(0)
for (const c of changes) counts[classOf(c)]++

const fell = changes.filter((c) => c < 0).length
const rose = changes.filter((c) => c > 0).length

const ts = `/**
 * 시군구별 아파트 가격변동, 같은 단지끼리 짝지어 잰 것.
 *
 * GENERATED by scripts/build-prices.mjs — do not hand-edit.
 *
 * NOT a comparison of medians. A district's median sale price moves when the
 * mix of what sold moves, so the unit here is a (district, complex, 10 m2
 * band) that traded in both ends of the window — ${pairs.toLocaleString('en-US')} of
 * them. Each contributes one percentage change of its median price per unit
 * area and the district is the median of its pairs, which holds the
 * building, the size class and the neighbourhood fixed.
 *
 * THE SCALE DIVERGES because the data does: ${fell} districts fell and ${rose}
 * rose, from ${sorted[0]}% to ${sorted[sorted.length - 1]}%. Zero is a real
 * midpoint rather than a convenience, and that is why the class edges are
 * chosen round numbers instead of quantiles or natural breaks — a diverging
 * scale cannot put its midpoint wherever the data would prefer.
 *
 * ${values.length} of ${grid.length} districts are measured. The rest did not
 * have the same complexes trading at both ends.
 */

export type PriceChange = {
  readonly sido: string
  readonly sgg: string
  /** Median percentage change across this district's matched pairs. */
  readonly change: number
  /** How many pairs it rests on. */
  readonly pairs: number
}

/** The two ends compared, three months each. */
export const PRICE_WINDOW = {
  early: '${months[0]}',
  earlyEnd: '${months[2]}',
  late: '${months[months.length - 3]}',
  lateEnd: '${months[months.length - 1]}',
} as const

/** Pairs below which a district is left unmeasured. */
export const PRICE_FLOOR = ${FLOOR}

/**
 * Class edges. There are \`PRICE_EDGES.length + 1\` classes: class 0 is
 * everything below the first edge, the last is everything above the last.
 */
export const PRICE_EDGES: readonly number[] = [${EDGES.join(', ')}]

/** Districts per class, in the same order. */
export const PRICE_COUNTS: readonly number[] = [${counts.join(', ')}]

export const PRICE_INTAKE = {
  rows: ${rows},
  pairs: ${pairs},
  districts: ${grid.length},
  measured: ${values.length},
  /** Had pairs, but fewer than the floor. */
  thin: ${thin},
} as const

export const PRICE_STATS = {
  median: ${round(median(changes))},
  min: ${sorted[0]},
  max: ${sorted[sorted.length - 1]},
  fell: ${fell},
  rose: ${rose},
} as const

export const PRICE_VALUES: readonly PriceChange[] = [
${values
  .map((v) => `  { sido: '${v.sido}', sgg: '${v.sgg}', change: ${v.change}, pairs: ${v.pairs} },`)
  .join('\n')}
]
`

writeFileSync(OUT, ts, 'utf8')
process.stdout.write(`
  PRICE CHANGE
  ${'-'.repeat(70)}
  ${rows.toLocaleString('en-US')} sales in the two ends - ${months[0]}..${months[2]} vs ${months[months.length - 3]}..${months[months.length - 1]}
  matched pairs ${pairs.toLocaleString('en-US')} - measured ${values.length}/${grid.length} (thin ${thin})
  median ${round(median(changes))}% - range ${sorted[0]}% .. ${sorted[sorted.length - 1]}% - fell ${fell} rose ${rose}
  classes ${counts.join(' / ')}
  ${'-'.repeat(70)}
  wrote lib/prices.data.ts
`)
