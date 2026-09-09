#!/usr/bin/env node
/**
 * /portfolio/reach, re-derived from what it published.
 *
 * The page's whole argument is a null result — brokerage does not travel —
 * and a null result is the easiest kind of claim to leave standing after the
 * data stops supporting it. So every headline number is recomputed here from
 * the rows the page ships, the page's premises are asserted rather than
 * assumed, and every figure quoted in the prose has to be one the data holds.
 *
 * IT READS THE SOURCE, not the module, for the same reason its siblings do:
 * what ships is the text of lib/reach.data.ts, and a gate that imports it
 * checks a re-evaluation instead of the file.
 *
 * IT CHECKS COUNTS, NOT ONLY PERCENTAGES, because this page has already been
 * bitten twice by a number that was not a percentage. Once when a district
 * count in a search description went fifteen stale behind the chart it
 * described, and once on this page's own co-brokerage figure: 12 of 30,329
 * is 0.04%, its complement rounds to 100.0% at one decimal place, and a 100
 * read off that rounding was written up as "not one of them". A gate that
 * only read `%` would have passed both.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const line = (s) => process.stdout.write(s + '\n')
const problems = []
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d

const src = readFileSync(join(ROOT, 'lib', 'reach.data.ts'), 'utf8')
const one = (re, what) => {
  const m = re.exec(src)
  if (!m) problems.push(`lib/reach.data.ts: ${what} 를 못 읽었습니다`)
  return m?.[1]
}
const num = (re, what) => Number(one(re, what))

const FLOOR = num(/REACH_FLOOR = (\d+)/, 'REACH_FLOOR')
const NATIONAL = num(/REACH_NATIONAL = ([\d.]+)/, 'REACH_NATIONAL')
const TOP_TEN = num(/REACH_TOP_TEN = ([\d.]+)/, 'REACH_TOP_TEN')

const intake = Object.fromEntries(
  [
    ...src.matchAll(
      /^ {2}(records|legs|matched|unmatched|districts|measured|belowFloor|noLegs|external|flows): (\d+),$/gm,
    ),
  ].map((m) => [m[1], Number(m[2])]),
)
/* Scoped to its own block. REACH_DISTANCE also has `median`, `p75` and
   `max`, so a file-wide match let the distance values overwrite the shares
   and the gate reported a median of 9.3% on a scale of percentages. */
const quantBlock = one(/REACH_QUANTILES = \{([\s\S]*?)\n\} as const/, 'REACH_QUANTILES') ?? ''
const quant = Object.fromEntries(
  [...quantBlock.matchAll(/^ {2}(min|p5|p25|median|p75|p95|max): ([\d.]+),$/gm)].map((m) => [
    m[1],
    Number(m[2]),
  ]),
)
const rates = (one(/REACH_RATES: readonly number\[\] = \[([^\]]*)\]/, 'REACH_RATES') ?? '')
  .split(',')
  .map((x) => Number(x.trim()))
  .filter((x) => Number.isFinite(x))

const distBlock = one(/REACH_DISTANCE = \{([\s\S]*?)\n\} as const/, 'REACH_DISTANCE') ?? ''
const dist = Object.fromEntries(
  [...distBlock.matchAll(/^ {2}(median|p75|p90|p99|max): ([\d.]+),$/gm)].map((m) => [
    m[1],
    Number(m[2]),
  ]),
)
const bands = [...distBlock.matchAll(/\{ to: (\d+), share: ([\d.]+) \}/g)].map((m) => ({
  to: +m[1],
  share: +m[2],
}))

const coBlock = one(/REACH_CO = \{([\s\S]*?)\n\} as const/, 'REACH_CO') ?? ''
const co = Object.fromEntries(
  [...coBlock.matchAll(/^ {2}(pairs|cross|same|share): ([\d.]+),$/gm)].map((m) => [
    m[1],
    Number(m[2]),
  ]),
)

const low = [
  ...src.matchAll(
    /\{ sido: '([^']+)', sgg: '([^']+)', rate: ([\d.]+), legs: (\d+), origin: '([^']*)', originLegs: (\d+), originShare: ([\d.]+), originKm: (\d+) \},/g,
  ),
].map((m) => ({
  sido: m[1],
  sgg: m[2],
  rate: +m[3],
  legs: +m[4],
  origin: m[5],
  originLegs: +m[6],
  originShare: +m[7],
  originKm: +m[8],
}))

/* --- 1. the dots against the summary -------------------------------- */

if (rates.length !== intake.measured) {
  problems.push(`점 ${rates.length}개인데 measured 는 ${intake.measured} 입니다`)
}
for (let i = 1; i < rates.length; i++) {
  if (rates[i] < rates[i - 1]) {
    problems.push('REACH_RATES 가 오름차순이 아닙니다 — 도표가 쌓는 순서에 기댑니다')
    break
  }
}
for (const r of rates) {
  if (!(r >= 0 && r <= 100)) problems.push(`비율이 0~100 밖입니다: ${r}`)
}
if (rates.length) {
  const q = (p) => rates[Math.min(rates.length - 1, Math.floor(rates.length * p))]
  const want = {
    min: rates[0],
    p5: q(0.05),
    p25: q(0.25),
    median: q(0.5),
    p75: q(0.75),
    p95: q(0.95),
    max: rates[rates.length - 1],
  }
  for (const [k, v] of Object.entries(want)) {
    if (quant[k] !== v) {
      problems.push(`분위 ${k} 가 ${quant[k]} 인데 점에서 다시 계산하면 ${v} 입니다`)
    }
  }
}

/* --- 2. the intake closes ------------------------------------------- */

const accounted = intake.measured + intake.belowFloor + intake.noLegs
if (accounted !== intake.districts) {
  problems.push(
    `그린 것 ${intake.measured} + 바닥 미만 ${intake.belowFloor} +` +
      ` 다리 없음 ${intake.noLegs} = ${accounted}, 시군구는 ${intake.districts} 입니다`,
  )
}
if (intake.matched + intake.unmatched !== intake.legs) {
  problems.push('매칭 + 미매칭 이 다리 수와 다릅니다')
}
if (intake.legs < intake.records) {
  problems.push('다리가 신고보다 적습니다 — 한 신고는 최소 한 다리입니다')
}
if (!(intake.external < intake.matched)) {
  problems.push('외부 다리가 매칭된 다리 전체 이상입니다')
}
const wantNational = round((100 * (intake.matched - intake.external)) / intake.matched)
if (NATIONAL !== wantNational) {
  problems.push(`자기지역 ${NATIONAL}% 인데 intake 에서 다시 계산하면 ${wantNational}% 입니다`)
}

/* --- 3. the page's premises ----------------------------------------- */

/* Each of these is a sentence the page states as a finding. If the data stops
   supporting one, the page is wrong rather than merely out of date, so the
   build should stop instead of the prose quietly becoming false. */
if (!(NATIONAL >= 50)) {
  problems.push(`자기지역이 ${NATIONAL}% 입니다 — "중개는 자기 지역에서 일어난다" 가 무너집니다`)
}
if (!(TOP_TEN < 50)) {
  problems.push(
    `가장 굵은 열 짝이 외부의 ${TOP_TEN}% 입니다 — 흐름이 집중됐다면 흐름 지도를 안 그린 이유가 사라집니다`,
  )
}
if (!(intake.flows >= 1000)) {
  problems.push(`외부 짝이 ${intake.flows} 종류입니다 — "오천 개" 라는 서술이 무너집니다`)
}
if (!(dist.median < 30)) {
  problems.push(`외부 거리 중앙값이 ${dist.median}km 입니다 — "옆 동네" 라는 서술이 무너집니다`)
}

/* --- 4. distance ---------------------------------------------------- */

if (
  !(dist.median <= dist.p75 && dist.p75 <= dist.p90 && dist.p90 <= dist.p99 && dist.p99 <= dist.max)
) {
  problems.push('거리 분위가 단조가 아닙니다')
}
let last = -1
for (const b of bands) {
  if (b.share < last) problems.push(`누적 거리 비율이 줄어듭니다: ${b.to}km`)
  if (b.share < 0 || b.share > 100) problems.push(`누적 비율이 0~100 밖입니다: ${b.share}`)
  last = b.share
}
if (!bands.some((b) => b.to === 20)) {
  problems.push('20km 구간이 없습니다 — 본문이 그 값을 인용합니다')
}

/* --- 5. the low table ----------------------------------------------- */

if (!low.length) problems.push('REACH_LOW 가 비었습니다')
const seen = new Set()
for (let i = 0; i < low.length; i++) {
  const r = low[i]
  if (i && r.rate < low[i - 1].rate) problems.push(`REACH_LOW 가 오름차순이 아닙니다 (${r.sgg})`)
  if (r.rate !== rates[i]) {
    problems.push(`${r.sgg} 의 비율 ${r.rate} 가 점 배열 ${i}번째 ${rates[i]} 와 다릅니다`)
  }
  if (r.legs < FLOOR) problems.push(`${r.sgg} 의 다리 ${r.legs} 가 바닥 미만인데 표에 있습니다`)
  if (r.originLegs > r.legs) problems.push(`${r.sgg} 의 최대 유입이 전체 다리보다 많습니다`)
  const share = round((100 * r.originLegs) / r.legs)
  if (r.originShare !== share) {
    problems.push(`${r.sgg} 의 유입 비율 ${r.originShare} 가 개수에서 다시 나오지 않습니다 (${share})`)
  }
  /* An inflow cannot exceed the room the self share leaves. Half a point of
     slack, because both sides are rounded to one place. */
  if (r.originShare > 100 - r.rate + 0.5) {
    problems.push(`${r.sgg} 의 유입 ${r.originShare}% 가 외부 몫 ${round(100 - r.rate)}% 보다 큽니다`)
  }
  if (r.originKm < 0 || r.originKm > 700) {
    problems.push(`${r.sgg} 의 거리가 국토 범위를 벗어납니다: ${r.originKm}km`)
  }
  if (!r.origin) problems.push(`${r.sgg} 에 최대 유입 이름이 없습니다`)
  /* 중구 is five different places, so a row is identified by both names. */
  const k = `${r.sido} ${r.sgg}`
  if (seen.has(k)) problems.push(`REACH_LOW 에 ${k} 가 두 번 있습니다`)
  seen.add(k)
}

/* --- 6. co-brokerage ------------------------------------------------ */

if (co.cross + co.same !== co.pairs) {
  problems.push(`공동중개 다름 ${co.cross} + 같음 ${co.same} 이 전체 ${co.pairs} 와 다릅니다`)
}
if (co.pairs > intake.records) problems.push('공동중개가 신고보다 많습니다')
const wantCoShare = round((100 * co.pairs) / intake.records)
if (co.share !== wantCoShare) {
  problems.push(`공동중개 비율 ${co.share}% 가 개수에서 다시 나오지 않습니다 (${wantCoShare}%)`)
}

/* --- 7. the sentences ----------------------------------------------- */

/**
 * What a sentence on this page is allowed to say, as a number.
 *
 * THE 186 DISTRICT SHARES ARE DELIBERATELY NOT IN HERE. They were, and it
 * made the check almost worthless: with every measured rate allowed, any
 * plausible percentage between the min and the max passed. A negative test
 * swapped the median for 88.4% — a real district's share, and not the
 * median — and the gate said PASS. The prose only ever quotes quantiles, the
 * national share, the low table and the distance bands, so only those are
 * allowed and a number from the middle of the distribution is now a failure.
 */
const allowed = new Set([0, 100, NATIONAL, TOP_TEN, co.share, FLOOR])
for (const v of Object.values(quant)) allowed.add(v)
for (const r of low) {
  allowed.add(r.rate)
  allowed.add(r.originShare)
  allowed.add(r.originKm)
}
for (const v of Object.values(dist)) allowed.add(v)
for (const b of bands) {
  allowed.add(b.to)
  allowed.add(b.share)
}
allowed.add(round((100 * intake.external) / intake.matched))

const counts = new Set([...Object.values(intake), co.pairs, co.cross, co.same, FLOOR, rates.length])

const SENTENCES = [
  'lead',
  'note',
  'caption',
  'summary',
  'distanceWhy',
  'bandsCaption',
  'lowWhy',
  'lowCaption',
  'arcWhy',
  'coWhy',
  'legWhy',
  'floorWhy',
  'centroidWhy',
]
let scanned = 0
for (const locale of ['ko', 'en']) {
  const dict = readFileSync(join(ROOT, 'lib', 'i18n', 'dictionaries', `${locale}.ts`), 'utf8')
  const block = /\n {2}reach: \{([\s\S]*?)\n {2}\},/.exec(dict)?.[1]
  if (!block) {
    problems.push(`${locale}.ts: reach 블록이 없습니다`)
    continue
  }
  const seo = /\n {4}reach:\n?\s*'([^']*)'/.exec(dict)?.[1] ?? ''
  if (!seo) problems.push(`${locale}.ts: seo.reach 가 없습니다`)
  const texts = [seo]
  for (const key of SENTENCES) {
    const m = new RegExp(`\\n {4}${key}:\\n?\\s*'([^']*)'`).exec(block)
    if (m) texts.push(m[1])
    else problems.push(`${locale}.ts: reach.${key} 가 없습니다`)
  }
  for (const text of texts) {
    scanned++
    /* Two things are not prose. A `{placeholder}` is filled from the data at
       render time; blank it rather than delete it, so digits on either side
       cannot run together into a number nobody wrote. And a `\uXXXX` escape
       is source syntax — the four hex digits of `’` were being read as
       the year 2019, which is the exact class of false positive that teaches
       people to switch a gate off. Decode it to the character it means, so
       what is scanned is what a reader sees. */
    const literal = text
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\{[a-zA-Z]+\}/g, ' ')
    for (const [, raw] of literal.matchAll(/(\d+(?:\.\d+)?)\s*%/g)) {
      if (!allowed.has(Number(raw))) {
        problems.push(`${locale}.ts: 본문의 ${raw}% 가 데이터에 없는 값입니다`)
      }
    }
    for (const [, raw] of literal.matchAll(/(?<![\d.,%])(\d{3,})(?![\d.,%])/g)) {
      const v = Number(raw)
      if (!counts.has(v) && !allowed.has(v)) {
        problems.push(`${locale}.ts: 본문의 ${raw} 이 데이터에 없는 개수입니다`)
      }
    }
  }
}

/* --- report --------------------------------------------------------- */

const n = (v) => (Number.isFinite(v) ? v.toLocaleString('ko-KR') : '?')
const within20 = bands.find((b) => b.to === 20)
line('')
line('  BROKER REACH')
line('  ' + '-'.repeat(70))
line(`  신고 ${n(intake.records)} · 다리 ${n(intake.legs)} · 매칭 ${n(intake.matched)}`)
line(
  `  자기지역 ${NATIONAL}% · 점 ${rates.length}개 · 중앙 ${quant.median}%` +
    ` · 범위 ${quant.min}~${quant.max}%`,
)
line(`  외부 ${n(intake.external)} 다리 · 짝 ${n(intake.flows)} 종류 · 상위 10개 ${TOP_TEN}%`)
line(`  거리 중앙 ${dist.median}km · 20km 이내 ${within20?.share}% · 최대 ${dist.max}km`)
line(`  공동중개 ${n(co.pairs)} — 다름 ${n(co.cross)} · 같음 ${co.same}`)
line(`  낮은 순 표 ${low.length}행 · 문장 ${scanned}개 검사`)
line('  ' + '-'.repeat(70))

if (problems.length) {
  for (const p of problems) line(`  ✗ ${p}`)
  line('')
  line(`  FAIL — ${problems.length} problem${problems.length > 1 ? 's' : ''}`)
  line('')
  process.exit(1)
}
line('  PASS — 요약이 행에서 다시 나오고, 본문 숫자가 전부 데이터에 있습니다.')
line('')
