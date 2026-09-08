#!/usr/bin/env node
/**
 * The revenue dashboard's gate.
 *
 * This dataset is invented, and that is exactly why it needs a harder gate
 * than the ones built on public filings. A page resting on 국토교통부 data can
 * be checked against 국토교통부. A page resting on a generator can only be
 * checked against itself — so the two halves of it are written by different
 * passes and made to agree here:
 *
 *   lib/bi.data.ts holds AGGREGATES. public/data/bi/ holds BASE ROWS.
 *   Every published aggregate is recomputed from the rows and compared.
 *
 * Nothing below re-runs the generator. That is deliberate and follows
 * check-prices.mjs: a gate that regenerates its input can only ever agree
 * with itself, and it would also rewrite the working tree while claiming to
 * inspect it. Determinism is a separate, explicit step — `pnpm check:bi:regen`.
 *
 * FOUR OF THESE CHECKS EXIST BECAUSE THE GENERATOR SHIPPED THEM BROKEN, and
 * they are marked below. Two of the four could not have been caught by
 * looking at the output:
 *
 *   The household scale implied 164% of the registered population of the
 *   districts it covered. Internally consistent, and only a number from
 *   outside could see it — so section A now measures the realised share
 *   against the population already in this repository.
 *
 *   The generator's random streams were correlated across key prefixes at
 *   r = -0.15, which bent the acquisition curve by a third in the final
 *   year. Every stream was uniform on its own; the standard test passed.
 *   Section G measures independence, not uniformity.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { makeStream, STREAM_KEYS } from './bi.rng.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const line = (s) => process.stdout.write(s + '\n')
const problems = []
const notes = []
const nfk = (v) => Number(v).toLocaleString('ko-KR')

/**
 * Problems carry their section, and the report shows a few from each.
 *
 * A flat list with a cap does not work here, and the negative tests proved
 * it: inverting a volume discount band breaks the per-month subscription
 * recomputation on thousands of rows, those filled the cap, and the one
 * message that named the actual cause — the rate card no longer falling —
 * was pushed off the end of the output. A gate that reports the loudest
 * symptom and hides the diagnosis is a gate that gets misread.
 */
let SECTION = '?'
const section = (id) => { SECTION = id }
const bad = (s) => problems.push({ section: SECTION, msg: s })

/* ==== reading the published TypeScript ============================== */

/**
 * A TS literal, as JSON.
 *
 * The other gates on this site pick fields out with one regex each. That
 * works while a file has four numbers in it and stops working at forty:
 * a regex per field cannot notice a field that disappeared, and this file
 * has to check shapes as well as values. So the emitted literal — whose
 * format build-bi.mjs controls — is transformed into JSON and parsed, which
 * fails loudly on a shape change instead of quietly matching nothing.
 */
function literal(src, name) {
  const at = src.indexOf(`export const ${name}`)
  if (at < 0) return null
  let i = src.indexOf('=', at)
  while (i < src.length && src[i] !== '[' && src[i] !== '{') i++
  const open = src[i]
  const close = open === '[' ? ']' : '}'
  let depth = 0
  let quote = false
  let j = i
  for (; j < src.length; j++) {
    const ch = src[j]
    if (quote) {
      if (ch === '\\') j++
      else if (ch === "'") quote = false
      continue
    }
    if (ch === "'") { quote = true; continue }
    if (ch === open) depth++
    else if (ch === close) { depth--; if (depth === 0) break }
  }
  let text = src.slice(i, j + 1)
  text = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_, body) => JSON.stringify(body.replace(/\\'/g, "'")))
    .replace(/([[{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/\bInfinity\b/g, '"Infinity"')
    .replace(/,(\s*[}\]])/g, '$1')
  try {
    return JSON.parse(text)
  } catch (e) {
    bad(`${name} 을 JSON 으로 못 읽었습니다: ${e.message}`)
    return null
  }
}

const scalar = (src, name) => {
  const m = new RegExp(`export const ${name} = (-?[\\d.]+)`).exec(src)
  return m ? Number(m[1]) : null
}
const stringConst = (src, name) => {
  const m = new RegExp(`export const ${name} = '([^']*)'`).exec(src)
  return m ? m[1] : null
}

const rosterSrc = readFileSync(join(ROOT, 'lib', 'bi.roster.data.ts'), 'utf8')
const biSrc = readFileSync(join(ROOT, 'lib', 'bi.data.ts'), 'utf8')

const R = {
  addressable: scalar(rosterSrc, 'ROSTER_ADDRESSABLE'),
  tiers: literal(rosterSrc, 'ROSTER_TIERS'),
  scale: literal(rosterSrc, 'ROSTER_SCALE'),
  fit: literal(rosterSrc, 'ROSTER_FIT'),
  intake: literal(rosterSrc, 'ROSTER_INTAKE'),
  households: literal(rosterSrc, 'ROSTER_HOUSEHOLDS'),
  years: literal(rosterSrc, 'ROSTER_YEARS'),
  tierCounts: literal(rosterSrc, 'ROSTER_TIER_COUNTS'),
  districts: literal(rosterSrc, 'ROSTER_DISTRICTS'),
}
const B = {
  window: literal(biSrc, 'BI_WINDOW'),
  months: literal(biSrc, 'BI_MONTHS'),
  seed: stringConst(biSrc, 'BI_SEED'),
  services: literal(biSrc, 'BI_SERVICES'),
  bands: literal(biSrc, 'BI_VOLUME_BANDS'),
  minMonthly: scalar(biSrc, 'BI_MIN_MONTHLY'),
  movement: literal(biSrc, 'BI_MOVEMENT'),
  adoption: literal(biSrc, 'BI_ADOPTION'),
  tam: literal(biSrc, 'BI_TAM'),
  districtPen: literal(biSrc, 'BI_DISTRICT_PENETRATION'),
  attach: literal(biSrc, 'BI_ATTACH'),
  rateCard: literal(biSrc, 'BI_RATE_CARD'),
  tierEcon: literal(biSrc, 'BI_TIER_ECONOMICS'),
  cohorts: literal(biSrc, 'BI_COHORTS'),
  reps: literal(biSrc, 'BI_REPS'),
  regions: literal(biSrc, 'BI_REGIONS'),
  intake: literal(biSrc, 'BI_INTAKE'),
  dynamics: literal(biSrc, 'BI_DYNAMICS'),
}
for (const [k, v] of Object.entries({ ...R, ...B })) {
  if (v === null || v === undefined) bad(`${k} 를 읽지 못했습니다`)
}
if (problems.length) {
  line('')
  for (const p of problems) line(`  ✗ ${p.msg}`)
  line('')
  line(`  FAIL — ${problems.length} problem${problems.length === 1 ? '' : 's'} reading the data files`)
  line('')
  process.exit(1)
}
section('A 명부')

const tierOf = (hh) => R.tiers.find((t) => t.to === 'Infinity' || hh < t.to).id

/* ==== reading the base rows ========================================= */

const ROSTER_DIR = join(ROOT, 'public', 'data', 'bi', 'roster')
const SERIES_DIR = join(ROOT, 'public', 'data', 'bi', 'series')

const roster = new Map()
const districtCounts = new Map()
for (const f of readdirSync(ROSTER_DIR).filter((n) => n.endsWith('.json'))) {
  const code = f.replace('.json', '')
  const rows = JSON.parse(readFileSync(join(ROSTER_DIR, f), 'utf8'))
  districtCounts.set(code, rows)
  rows.forEach((r, k) => {
    const want = `${code}-${String(k).padStart(4, '0')}`
    if (r.i !== want) bad(`${f} 의 ${k}번째 id 가 ${r.i}, ${want} 이어야 합니다`)
    if (roster.has(r.i)) bad(`단지 id ${r.i} 가 두 번 있습니다`)
    roster.set(r.i, { ...r, code, tier: tierOf(r.h) })
  })
}

const contracts = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'bi', 'contracts.json'), 'utf8'))
const pipeline = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'bi', 'pipeline.json'), 'utf8'))

const MONTHS = B.months
const MI = new Map(MONTHS.map((m, i) => [m, i]))
const T = MONTHS.length
const series = MONTHS.map((ym) => {
  const p = join(SERIES_DIR, `${ym}.json`)
  if (!existsSync(p)) { bad(`public/data/bi/series/${ym}.json 이 없습니다`); return [] }
  return JSON.parse(readFileSync(p, 'utf8'))
})
const subOf = series.map((rows) => new Map(rows.map((r) => [r.i, r.s])))

/* ==== A. the roster — the real layer =============================== */

section('A 명부')

/* WHY THE POPULATION CHECK IS HERE. The first household estimate implied
   33.8 million households across the roster, which at 2.3 people each is
   164% of the registered population of the districts holding them. Every
   number inside the estimator agreed with every other; the defect was only
   visible against a figure from outside it. So the outside figure is now
   load-bearing and this is where it bears. */
{
  const all = [...roster.values()]
  const hhTotal = all.reduce((s, c) => s + c.h, 0)

  if (all.length !== R.intake.complexes) bad(`명부 ${all.length}개 ≠ ROSTER_INTAKE.complexes ${R.intake.complexes}`)
  if (hhTotal !== R.households.total) bad(`세대 합 ${hhTotal} ≠ ROSTER_HOUSEHOLDS.total ${R.households.total}`)

  const realised = (hhTotal * R.scale.persons) / R.scale.coveredPop
  if (Math.abs(realised - R.scale.realisedShare) > 0.0002) {
    bad(`실현 비율 재계산 ${realised.toFixed(4)} ≠ 게시 ${R.scale.realisedShare}`)
  }
  /* The band, not the exact number: clamping and rounding to even households
     move the total slightly, and a gate demanding equality here would fail on
     an arithmetic detail rather than on a wrong estimate. Two points wide,
     which is a hundred times the drift rounding can cause and a fiftieth of
     the error it caught. */
  if (Math.abs(realised - R.scale.share) > 0.02) {
    bad(`세대 추정이 인구의 ${(realised * 100).toFixed(1)}% 를 함의합니다 — 선언한 ${(R.scale.share * 100).toFixed(0)}% 에서 2점 넘게 벗어났습니다`)
  }

  const addressable = all.filter((c) => c.h >= R.addressable).length
  if (addressable !== R.intake.addressable) bad(`판매가능 ${addressable} ≠ ROSTER_INTAKE.addressable ${R.intake.addressable}`)

  for (const t of R.tiers) {
    const n = all.filter((c) => c.tier === t.id).length
    if (n !== R.tierCounts[t.id]) bad(`티어 ${t.id}: 다시 센 ${n} ≠ 게시 ${R.tierCounts[t.id]}`)
  }
  const subEdge = R.tiers[0].to
  if (subEdge !== R.addressable) bad(`sub 경계 ${subEdge} ≠ ROSTER_ADDRESSABLE ${R.addressable}`)

  const hhs = all.map((c) => c.h).sort((a, b) => a - b)
  const at = (p) => hhs[Math.min(hhs.length - 1, Math.floor(hhs.length * p))]
  for (const [key, got] of [['p10', at(0.1)], ['median', at(0.5)], ['p90', at(0.9)], ['max', hhs[hhs.length - 1]]]) {
    if (got !== R.households[key]) bad(`세대 ${key}: 다시 센 ${got} ≠ 게시 ${R.households[key]}`)
  }
  if (hhs[0] < R.scale.min) bad(`최소 세대 ${hhs[0]} < 선언한 하한 ${R.scale.min}`)
  if (hhs[hhs.length - 1] > R.scale.max) bad(`최대 세대 ${hhs[hhs.length - 1]} > 선언한 상한 ${R.scale.max}`)

  const codes = new Set()
  let covered = 0
  for (const d of R.districts) {
    if (codes.has(d.code)) bad(`시군구 코드 ${d.code} 가 두 번 있습니다`)
    codes.add(d.code)
    const rows = districtCounts.get(d.code) ?? []
    if (rows.length !== d.complexes) bad(`${d.sgg}: 파일 ${rows.length}행 ≠ 게시 complexes ${d.complexes}`)
    const hh = rows.reduce((s, r) => s + r.h, 0)
    if (hh !== d.households) bad(`${d.sgg}: 파일 세대합 ${hh} ≠ 게시 ${d.households}`)
    const adr = rows.filter((r) => r.h >= R.addressable).length
    if (adr !== d.addressable) bad(`${d.sgg}: 판매가능 ${adr} ≠ 게시 ${d.addressable}`)
    if (d.complexes > 0) covered++
    if (d.pop <= 0) bad(`${d.sgg}: 인구가 ${d.pop} 입니다`)
  }
  if (R.districts.length !== R.intake.districts) bad(`격자 ${R.districts.length} ≠ ROSTER_INTAKE.districts ${R.intake.districts}`)
  if (covered !== R.intake.covered) bad(`단지가 있는 시군구 ${covered} ≠ 게시 covered ${R.intake.covered}`)

  const declaredPop = R.districts.filter((d) => d.complexes > 0).reduce((s, d) => s + d.pop, 0)
  if (declaredPop !== R.scale.coveredPop) bad(`커버 인구 재계산 ${declaredPop} ≠ 게시 ${R.scale.coveredPop}`)

  /* The fit is published as a claim about ORDER. A Spearman that has fallen
     to nothing means the ranking is no longer evidence for anything and the
     household estimate is a bare declaration. */
  if (!(R.fit.spearman > 0.5)) bad(`점수 순위상관 ${R.fit.spearman} — 순서가 관측이라고 말할 수 없습니다`)
  if (R.fit.holdout < 1000) bad(`홀드아웃 ${R.fit.holdout}개로는 순위상관이 의미 없습니다`)
}

/* ==== B. the base rows — joins and truncation ====================== */

section('B 베이스 행')

/* WHY TRUNCATION HAS ITS OWN CHECK. Filling the months before a complex
   signed with zeroes rather than leaving them out is the commonest bug in a
   revenue series, and it is invisible: every total stays correct and every
   AVERAGE per complex becomes wrong, in the direction that flatters early
   months. There is no zero row anywhere in this dataset and this is what
   says so. */
{
  const byComplex = new Map()
  for (const k of contracts) {
    if (!roster.has(k.i)) bad(`계약이 명부에 없는 단지 ${k.i} 를 가리킵니다`)
    if (!B.services.some((s) => s.id === k.k)) bad(`계약의 서비스 ${k.k} 가 카탈로그에 없습니다`)
    if (k.t !== null && !(k.f < k.t)) bad(`계약 ${k.i}/${k.k}: 시작 ${k.f} 이 종료 ${k.t} 보다 늦습니다`)
    const list = byComplex.get(k.i)
    if (list) list.push(k)
    else byComplex.set(k.i, [k])
  }
  if (contracts.length !== B.intake.contracts) bad(`계약 ${contracts.length} ≠ BI_INTAKE.contracts ${B.intake.contracts}`)

  /* Eligibility and dependency, from the published catalogue. */
  for (const k of contracts) {
    const svc = B.services.find((s) => s.id === k.k)
    const c = roster.get(k.i)
    if (!svc || !c) continue
    if (svc.minHouseholds && c.h < svc.minHouseholds) {
      bad(`${k.i} (${c.h}세대) 가 ${svc.minHouseholds}세대 이상 전용 서비스 ${k.k} 를 씁니다`)
    }
    if (svc.minYear && (c.y === null || c.y < svc.minYear)) {
      bad(`${k.i} (${c.y}년) 가 ${svc.minYear}년 이후 전용 서비스 ${k.k} 를 씁니다`)
    }
    if (svc.needs) {
      const parent = (byComplex.get(k.i) ?? []).filter((o) => o.k === svc.needs)
      const covers = parent.some((o) => o.f <= k.f && (o.t === null || (k.t !== null ? k.t <= o.t : false) || o.t === null))
      if (!covers) bad(`${k.i}: ${k.k} 가 선행 서비스 ${svc.needs} 없이 열렸습니다`)
    }
  }

  let rows = 0
  for (let m = 0; m < T; m++) {
    const seen = new Set()
    for (const r of series[m]) {
      rows++
      if (!roster.has(r.i)) bad(`${MONTHS[m]}: 명부에 없는 단지 ${r.i}`)
      if (seen.has(r.i)) bad(`${MONTHS[m]}: 단지 ${r.i} 가 두 번 있습니다`)
      seen.add(r.i)
      if (r.s === 0 && r.u === 0) bad(`${MONTHS[m]}: ${r.i} 이 0원 행으로 들어 있습니다 — 없어야 합니다`)
      if (r.s < 0 || r.u < 0 || r.f < 0) bad(`${MONTHS[m]}: ${r.i} 에 음수 금액이 있습니다`)
      const live = (byComplex.get(r.i) ?? []).filter(
        (k) => MI.get(k.f) <= m || k.f < MONTHS[0] ? (k.t === null || MI.get(k.t) > m || k.t > MONTHS[T - 1] ? true : false) : false,
      )
      if (!live.length) bad(`${MONTHS[m]}: ${r.i} 에 이 달을 덮는 계약이 없습니다`)
      if (r.n !== live.length) bad(`${MONTHS[m]}: ${r.i} 의 활성 서비스 ${r.n} ≠ 계약에서 센 ${live.length}`)
    }
  }
  if (rows !== B.intake.seriesRows) bad(`시계열 ${rows}행 ≠ BI_INTAKE.seriesRows ${B.intake.seriesRows}`)
  if (pipeline.length !== B.intake.pipeline) bad(`파이프라인 ${pipeline.length} ≠ BI_INTAKE.pipeline ${B.intake.pipeline}`)
  for (const p of pipeline) {
    if (!roster.has(p.i)) bad(`파이프라인이 명부에 없는 단지 ${p.i} 를 가리킵니다`)
    if (!['won', 'lost', 'open'].includes(p.s)) bad(`파이프라인 단계 ${p.s} 를 모릅니다`)
    if (p.s === 'open' && p.c !== null) bad(`${p.i}: open 인데 종료월 ${p.c} 이 있습니다`)
  }
}

/* ==== C. the step function, recomputed from the rate card ========= */

section('C 계단함수')

/**
 * Subscription is recomputed for every complex-month from the price terms and
 * the household count, and compared to the published row.
 *
 * This is the strongest check in the file, and it is the one the generator's
 * design exists for. A per-household fee times a household count that does
 * not change is the same number every month until the contract changes. If
 * anything in the generator ever multiplies a subscription by a little noise
 * — which is the first instinct when producing revenue data, and which would
 * destroy the only signal the step function carries — the recomputation
 * stops matching on the first month and every month after it.
 *
 * It also independently verifies the volume bands and the monthly floor, so
 * finding 1's mechanism is checked against the rows rather than asserted.
 */
{
  const perHouseholdMonthly = (households, price) => {
    let sum = 0
    let left = households
    let floor = 0
    for (const band of B.bands) {
      if (left <= 0) break
      const upTo = band.upTo === 'Infinity' ? Infinity : band.upTo
      const take = Math.min(left, upTo - floor)
      sum += take * price * band.rate
      left -= take
      floor = upTo
    }
    return Math.round(sum)
  }

  const byComplex = new Map()
  for (const k of contracts) {
    const list = byComplex.get(k.i)
    if (list) list.push(k)
    else byComplex.set(k.i, [k])
  }

  let checked = 0
  let steps = 0
  let drift = 0
  for (let m = 0; m < T; m++) {
    for (const r of series[m]) {
      const c = roster.get(r.i)
      if (!c) continue
      let perHH = 0
      let flat = 0
      for (const k of byComplex.get(r.i) ?? []) {
        const startedBy = k.f <= MONTHS[m]
        const endedBy = k.t !== null && k.t <= MONTHS[m]
        if (!startedBy || endedBy) continue
        const svc = B.services.find((s) => s.id === k.k)
        if (!svc) continue
        if (svc.model === 'perHH') perHH += perHouseholdMonthly(c.h, svc.price)
        else if (svc.model === 'perComplex') flat += svc.price
      }
      const topUp = perHH > 0 ? Math.max(0, B.minMonthly - perHH) : 0
      const want = perHH + topUp + flat
      checked++
      if (want !== r.s) {
        bad(`${MONTHS[m]}: ${r.i} 구독 ${r.s} ≠ 요율표에서 다시 계산한 ${want}`)
        if (problems.length > 200) break
      }
      if (topUp !== r.f) bad(`${MONTHS[m]}: ${r.i} 최소요금 보전 ${r.f} ≠ 다시 계산한 ${topUp}`)
    }
    if (problems.length > 200) break
  }

  /* And the step itself: no contract event in the month means no change. */
  const eventMonths = new Map()
  for (const k of contracts) {
    for (const ym of [k.f, k.t]) {
      if (ym === null) continue
      const set = eventMonths.get(k.i) ?? new Set()
      set.add(ym)
      eventMonths.set(k.i, set)
    }
  }
  for (let m = 1; m < T; m++) {
    for (const [id, s] of subOf[m]) {
      const was = subOf[m - 1].get(id)
      if (was === undefined) continue
      if (s === was) { steps++; continue }
      if (!(eventMonths.get(id)?.has(MONTHS[m]))) {
        drift++
        bad(`${MONTHS[m]}: ${id} 구독이 ${was} → ${s} 로 움직였는데 이 달에 계약 이벤트가 없습니다`)
      }
    }
  }
  notes.push(`구독 ${checked.toLocaleString('ko-KR')}개월분을 요율표에서 다시 계산 · 평탄 ${steps.toLocaleString('ko-KR')}개월 · 드리프트 ${drift}`)
}

/* ==== D. the movement waterfall ==================================== */

section('D 워터폴')

/**
 * Both sides recomputed from the rows, then the identity.
 *
 * ONE LIMIT IS STATED RATHER THAN HIDDEN. `new` and `winback` cannot be told
 * apart from published data: a complex first appearing in the window's fifth
 * month may be new, or may be returning from a cancellation that happened
 * during the burn-in, and the burn-in is not published. So the two are
 * checked as one quantity. Everything else — the opening balance from the
 * previous month, expansion, contraction, churn, the closing balance, the
 * account count and the usage total — is checked exactly.
 */
{
  for (let m = 0; m < T; m++) {
    const row = B.movement[m]
    if (row.month !== MONTHS[m]) { bad(`BI_MOVEMENT[${m}] 이 ${row.month}, BI_MONTHS 는 ${MONTHS[m]}`); continue }

    const identity = row.start + row.new + row.winback + row.expansion - row.contraction - row.churn
    if (identity !== row.end) {
      bad(`${row.month}: 기초 ${row.start} + 신규 ${row.new} + 윈백 ${row.winback} + 확장 ${row.expansion} − 축소 ${row.contraction} − 이탈 ${row.churn} = ${identity} ≠ 기말 ${row.end}`)
    }

    const end = series[m].reduce((s, r) => s + r.s, 0)
    if (end !== row.end) bad(`${row.month}: 기말 게시 ${row.end} ≠ 행에서 합한 ${end}`)
    if (series[m].length !== row.complexes) bad(`${row.month}: 단지 ${row.complexes} ≠ 행 수 ${series[m].length}`)
    const usage = series[m].reduce((s, r) => s + r.u, 0)
    if (usage !== row.usage) bad(`${row.month}: 사용량 게시 ${row.usage} ≠ 행에서 합한 ${usage}`)

    if (m === 0) continue
    const prev = subOf[m - 1]
    const now = subOf[m]
    let start = 0
    for (const v of prev.values()) start += v
    if (start !== row.start) bad(`${row.month}: 기초 게시 ${row.start} ≠ 전월 기말 ${start}`)

    let arrived = 0
    let expansion = 0
    let contraction = 0
    let churn = 0
    for (const [id, v] of now) {
      const was = prev.get(id) ?? 0
      if (was === 0) arrived += v
      else if (v > was) expansion += v - was
      else if (v < was) contraction += was - v
    }
    for (const [id, was] of prev) if (!now.has(id)) churn += was

    if (arrived !== row.new + row.winback) {
      bad(`${row.month}: 신규+윈백 게시 ${row.new + row.winback} ≠ 행에서 센 ${arrived}`)
    }
    if (expansion !== row.expansion) bad(`${row.month}: 확장 게시 ${row.expansion} ≠ 다시 센 ${expansion}`)
    if (contraction !== row.contraction) bad(`${row.month}: 축소 게시 ${row.contraction} ≠ 다시 센 ${contraction}`)
    if (churn !== row.churn) bad(`${row.month}: 이탈 게시 ${row.churn} ≠ 다시 센 ${churn}`)
  }
  if (B.movement.length !== T) bad(`BI_MOVEMENT ${B.movement.length}행 ≠ ${T}개월`)
  if (B.window.months !== T) bad(`BI_WINDOW.months ${B.window.months} ≠ BI_MONTHS ${T}`)
  if (B.window.from !== MONTHS[0] || B.window.to !== MONTHS[T - 1]) {
    bad(`BI_WINDOW ${B.window.from}..${B.window.to} 가 BI_MONTHS 양 끝과 다릅니다`)
  }
}

/* ==== E. the denominators ========================================== */

section('E 분모')

/* Penetration is the one figure a synthetic dataset cannot fake, and it is
   only worth that if the denominator really is the counted market. Anything
   here disagreeing means the page is dividing by an invented number while
   telling the reader it counted. */
{
  const all = [...roster.values()]
  if (B.tam.complexes !== all.length) bad(`BI_TAM.complexes ${B.tam.complexes} ≠ 명부 ${all.length}`)
  const adr = all.filter((c) => c.h >= R.addressable).length
  if (B.tam.addressable !== adr) bad(`BI_TAM.addressable ${B.tam.addressable} ≠ 명부에서 센 ${adr}`)
  for (const t of R.tiers) {
    const n = all.filter((c) => c.tier === t.id).length
    if (B.tam.byTier[t.id] !== n) bad(`BI_TAM.byTier.${t.id} ${B.tam.byTier[t.id]} ≠ ${n}`)
  }
  const bySido = new Map()
  const sidoOf = new Map(R.districts.map((d) => [d.code, d.sido]))
  for (const c of all) {
    const s = sidoOf.get(c.code)
    bySido.set(s, (bySido.get(s) ?? 0) + 1)
  }
  for (const [s, n] of bySido) {
    if (B.tam.bySido[s] !== n) bad(`BI_TAM.bySido['${s}'] ${B.tam.bySido[s]} ≠ ${n}`)
  }
  if (Object.keys(B.tam.bySido).length !== bySido.size) bad(`BI_TAM.bySido 의 시도 수가 명부와 다릅니다`)

  /**
   * The map's numerator, per district, recounted from the final month's rows.
   *
   * This exists because the map shipped without it: the first version had
   * only a provincial count and spread it over each province's districts by
   * market share, so 245 hexagons carried sixteen values and two districts in
   * one province differed on the map for arithmetic reasons. Nothing in the
   * data was wrong — the FIGURE was claiming a resolution the data did not
   * have, which no aggregate check would have noticed.
   */
  {
    const recount = new Map()
    for (const r of series[T - 1]) {
      const code = r.i.slice(0, 5)
      recount.set(code, (recount.get(code) ?? 0) + 1)
    }
    const byCode = new Map(R.districts.map((d) => [d.code, d]))
    let total = 0
    for (const d of B.districtPen) {
      total += d.signed
      const want = recount.get(d.code) ?? 0
      if (want !== d.signed) bad(`${d.code}: 계약 단지 게시 ${d.signed} ≠ 마지막 달 행에서 센 ${want}`)
      const home = byCode.get(d.code)
      if (!home) { bad(`BI_DISTRICT_PENETRATION 의 ${d.code} 가 격자에 없습니다`); continue }
      if (d.signed > home.addressable) {
        bad(`${home.sgg}: 계약 ${d.signed} > 판매가능 ${home.addressable}`)
      }
    }
    if (total !== series[T - 1].length) {
      bad(`시군구별 계약 합 ${total} ≠ 마지막 달 청구 단지 ${series[T - 1].length}`)
    }
    for (const [code, n] of recount) {
      if (!B.districtPen.some((d) => d.code === code)) {
        bad(`${code} 에 ${n}개 단지가 청구되는데 BI_DISTRICT_PENETRATION 에 없습니다`)
      }
    }
  }

  for (let m = 0; m < T; m++) {
    const a = B.adoption[m]
    if (a.month !== MONTHS[m]) { bad(`BI_ADOPTION[${m}] 이 ${a.month}`); continue }
    if (a.complexes !== series[m].length) bad(`${a.month}: BI_ADOPTION.complexes ${a.complexes} ≠ 행 수 ${series[m].length}`)
    if (a.complexes > B.tam.complexes) bad(`${a.month}: 계약 ${a.complexes} > 시장 ${B.tam.complexes}`)
    if (a.addressable > B.tam.addressable) bad(`${a.month}: 판매가능 계약 ${a.addressable} > ${B.tam.addressable}`)
    const hh = series[m].reduce((s, r) => s + (roster.get(r.i)?.h ?? 0), 0)
    if (hh !== a.households) bad(`${a.month}: 계약 세대 게시 ${a.households} ≠ 명부에서 합한 ${hh}`)
    const adrNow = series[m].filter((r) => (roster.get(r.i)?.h ?? 0) >= R.addressable).length
    if (adrNow !== a.addressable) bad(`${a.month}: 판매가능 계약 ${a.addressable} ≠ 다시 센 ${adrNow}`)
    for (const t of R.tiers) {
      const n = series[m].filter((r) => roster.get(r.i)?.tier === t.id).length
      if ((a.byTier[t.id] ?? 0) !== n) bad(`${a.month}: byTier.${t.id} ${a.byTier[t.id]} ≠ ${n}`)
      if (n > B.tam.byTier[t.id]) bad(`${a.month}: 티어 ${t.id} 계약 ${n} > 시장 ${B.tam.byTier[t.id]}`)
    }
    for (const svc of B.services) {
      const v = B.attach[svc.id]?.[m]
      if (v === undefined) { bad(`BI_ATTACH.${svc.id} 에 ${a.month} 이 없습니다`); continue }
      if (v > a.complexes) bad(`${a.month}: ${svc.id} 부착 ${v} > 청구 단지 ${a.complexes}`)
      const n = contracts.filter(
        (k) => k.k === svc.id && k.f <= MONTHS[m] && (k.t === null || k.t > MONTHS[m]),
      ).length
      if (v !== n) bad(`${a.month}: ${svc.id} 부착 게시 ${v} ≠ 계약에서 센 ${n}`)
    }
  }
}

/* ==== F. the rate card ============================================= */

section('F 요율표')

/* Finding 1's evidence, recomputed. Both ladders must fall: if a pricing
   change ever makes per-household revenue rise with size, the page's central
   argument inverts and nothing else here would notice. */
{
  const perHouseholdMonthly = (households, price) => {
    let sum = 0
    let left = households
    let floor = 0
    for (const band of B.bands) {
      if (left <= 0) break
      const upTo = band.upTo === 'Infinity' ? Infinity : band.upTo
      const take = Math.min(left, upTo - floor)
      sum += take * price * band.rate
      left -= take
      floor = upTo
    }
    return Math.round(sum)
  }
  for (const b of B.rateCard) {
    const list = b.services.reduce((s, id) => s + (B.services.find((x) => x.id === id)?.price ?? 0), 0)
    if (list !== b.list) bad(`요율표 ${b.id}: 정가 합 ${b.list} ≠ 카탈로그에서 ${list}`)
    for (let i = 0; i < b.rows.length; i++) {
      const r = b.rows[i]
      const perHH = b.services.reduce(
        (s, id) => s + perHouseholdMonthly(r.households, B.services.find((x) => x.id === id).price), 0,
      )
      const topUp = Math.max(0, B.minMonthly - perHH)
      if (perHH + topUp !== r.monthly) bad(`요율표 ${b.id}@${r.households}: 월액 ${r.monthly} ≠ 다시 계산한 ${perHH + topUp}`)
      if ((topUp > 0) !== r.floored) bad(`요율표 ${b.id}@${r.households}: floored 플래그가 최소요금 적용 여부와 다릅니다`)
      const per = Math.round((r.monthly / r.households) * 10) / 10
      if (per !== r.perHousehold) bad(`요율표 ${b.id}@${r.households}: 세대당 ${r.perHousehold} ≠ ${per}`)
      if (i > 0 && r.perHousehold > b.rows[i - 1].perHousehold) {
        bad(`요율표 ${b.id} 가 ${b.rows[i - 1].households} → ${r.households} 세대에서 올라갑니다 — 발견 1이 뒤집힙니다`)
      }
    }
  }
  if (B.bands.some((b, i) => i > 0 && b.rate > B.bands[i - 1].rate)) {
    bad('볼륨 밴드 할인율이 구간이 올라가는데 커집니다')
  }
}

/* ==== G. the generator's streams =================================== */

section('G 스트림')

/**
 * Independence across key prefixes, not uniformity within one.
 *
 * The generator shipped with FNV-1a feeding one xorshift step, and every
 * stream it produced was uniform: chi-square 7 across ten bins on all 36,040
 * complex ids, against a 5% critical value of 16.9. That test passed and the
 * data was wrong. `pick|<id>` and `onboard|<id>` correlated at r = -0.15, and
 * because customers are selected by the first and dated by the second, the
 * acquisition curve fell by a third in the year it was meant to peak.
 *
 * So this measures every pair of prefixes the generator uses, and then the
 * thing that actually broke: among the complexes a `pick` draw would select,
 * the distribution of their `onboard` draw has to stay flat.
 */
{
  const ids = [...roster.keys()]
  const n = ids.length
  const stream = makeStream(B.seed)
  const draws = STREAM_KEYS.map((k) => ids.map((id) => stream(`${k}|${id}`)()))

  const pearson = (a, b) => {
    let ma = 0
    let mb = 0
    for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i] }
    ma /= n
    mb /= n
    let num = 0
    let da = 0
    let db = 0
    for (let i = 0; i < n; i++) {
      const x = a[i] - ma
      const y = b[i] - mb
      num += x * y
      da += x * x
      db += y * y
    }
    return num / Math.sqrt(da * db)
  }

  /* Four standard errors. With 21 pairs that is about a one-in-a-thousand
     false alarm, and it is a fiftieth of the correlation that caused the bug. */
  const se = 1 / Math.sqrt(n)
  const limit = 4 * se
  let worst = 0
  let worstPair = ''
  for (let i = 0; i < STREAM_KEYS.length; i++) {
    for (let k = i + 1; k < STREAM_KEYS.length; k++) {
      const r = pearson(draws[i], draws[k])
      if (Math.abs(r) > Math.abs(worst)) { worst = r; worstPair = `${STREAM_KEYS[i]}/${STREAM_KEYS[k]}` }
      if (Math.abs(r) > limit) {
        bad(`스트림 ${STREAM_KEYS[i]}/${STREAM_KEYS[k]} 상관 ${r.toFixed(4)} — 한계 ${limit.toFixed(4)} (4 표준오차)`)
      }
    }
  }

  /* The conditional test — the failure mode itself. */
  const pi = STREAM_KEYS.indexOf('pick')
  const oi = STREAM_KEYS.indexOf('onboard')
  const take = 1285
  const top = draws[pi]
    .map((v, i) => [v, draws[oi][i]])
    .sort((a, b) => b[0] - a[0])
    .slice(0, take)
    .map((p) => p[1])
  const BINS = 5
  const bins = new Array(BINS).fill(0)
  for (const v of top) bins[Math.min(BINS - 1, Math.floor(v * BINS))]++
  const expect = take / BINS
  const chi = bins.reduce((s, b) => s + (b - expect) ** 2 / expect, 0)
  /* 4 degrees of freedom, 0.1% critical value 18.47. The broken generator
     scored 96 on this test. */
  if (chi > 18.47) {
    bad(`선정된 단지의 온보딩 분포가 치우쳤습니다 — chi2 ${chi.toFixed(1)} > 18.47 (자유도 4, 0.1%): ${bins.join(' ')}`)
  }
  notes.push(`스트림 최악 상관 ${worst.toFixed(4)} (${worstPair}) · 한계 ${limit.toFixed(4)} · 조건부 chi2 ${chi.toFixed(1)}`)
  if (!B.seed) bad('BI_SEED 가 비어 있습니다 — 재현할 수 없습니다')
}

/* ==== H. cohorts, the sales org, and the prose ===================== */

section('H 코호트·영업·본문')

{
  /**
   * Cohorts, recomputed from the contracts and the series.
   *
   * A complex's cohort is the quarter of its earliest contract month, which
   * means the published curves can be rebuilt from the base rows rather than
   * trusted. `kept[0]` is deliberately NOT asserted to be 100: retention is
   * measured at the END of each quarter, so a complex that signed in the
   * first month of its quarter and cancelled in the third is already gone by
   * its own cohort's first observation. That is the correct reading of a
   * quarterly cohort and an earlier version of this gate demanded the wrong
   * one.
   */
  const QN = B.intake.quarters
  const firstMonth = new Map()
  for (const k of contracts) {
    const at = firstMonth.get(k.i)
    if (at === undefined || k.f < at) firstMonth.set(k.i, k.f)
  }
  const quarterOf = (ym) => {
    const m = MI.get(ym)
    return m === undefined ? null : Math.floor(m / 3)
  }
  const qEnd = (q) => Math.min(T - 1, q * 3 + 2)

  const membersOf = new Map()
  for (const [id, ym] of firstMonth) {
    const q = quarterOf(ym)
    if (q === null) continue
    const list = membersOf.get(q)
    if (list) list.push(id)
    else membersOf.set(q, [id])
  }

  for (const c of B.cohorts) {
    const label = c.period
    if (typeof c.index !== 'number' || c.index < 0 || c.index >= QN) {
      bad(`코호트 ${label}: 분기 인덱스 ${c.index} 가 0..${QN - 1} 밖입니다`)
      continue
    }
    if (c.kept.length !== QN - c.index) {
      bad(`코호트 ${label}: kept ${c.kept.length}개, ${QN - c.index}개여야 합니다`)
    }
    if (c.value.length !== c.kept.length) bad(`코호트 ${label}: value 와 kept 길이가 다릅니다`)
    if (c.kept.some((v) => v < 0 || v > 100)) bad(`코호트 ${label}: kept 에 0..100 밖 값이 있습니다`)
    if (c.size < B.dynamics.cohortFloor) {
      bad(`코호트 ${label}: ${c.size}개는 게시 하한 ${B.dynamics.cohortFloor} 미만입니다`)
    }

    const members = membersOf.get(c.index) ?? []
    if (members.length !== c.size) {
      bad(`코호트 ${label}: 규모 ${c.size} ≠ 계약 시작월에서 센 ${members.length}`)
      continue
    }
    const base = members.reduce((s, id) => s + (subOf[qEnd(c.index)].get(id) ?? 0), 0)
    for (let k = 0; k < c.kept.length; k++) {
      const at = qEnd(c.index + k)
      const alive = members.filter((id) => subOf[at].has(id))
      const kept = Math.round((alive.length / members.length) * 1000) / 10
      if (kept !== c.kept[k]) bad(`코호트 ${label} +${k}Q: 잔존 게시 ${c.kept[k]} ≠ 다시 센 ${kept}`)
      const rev = alive.reduce((s, id) => s + (subOf[at].get(id) ?? 0), 0)
      const value = base ? Math.round((rev / base) * 1000) / 10 : 0
      if (value !== c.value[k]) bad(`코호트 ${label} +${k}Q: 매출비 게시 ${c.value[k]} ≠ 다시 계산한 ${value}`)
    }
  }
  if (B.cohorts.length > QN) bad(`코호트 ${B.cohorts.length}개 > 창의 분기 ${QN}개`)

  /* The org table against the waterfall: everything a rep is credited with
     has to be a gain some month actually recorded. */
  const closed = B.reps.reduce((s, r) => s + r.closed, 0)
  let gains = 0
  for (let m = 1; m < T; m++) {
    for (const [id, v] of subOf[m]) {
      const was = subOf[m - 1].get(id) ?? 0
      if (v > was) gains += v - was
    }
  }
  const first = B.movement[0]
  gains += first.new + first.winback + first.expansion
  if (closed !== gains) bad(`영업 실적 합 ${closed} ≠ 월별 증가분 합 ${gains}`)
  for (const r of B.reps) {
    const want = Math.round((r.recent / (r.quota * 12)) * 1000) / 10
    if (want !== r.attainment) bad(`${r.id}: 달성률 ${r.attainment} ≠ 다시 계산한 ${want}`)
    if (!B.regions.some((g) => g.id === r.region)) bad(`${r.id}: 지역 ${r.region} 을 모릅니다`)
    if (!r.team.startsWith(r.region)) bad(`${r.id}: 팀 ${r.team} 이 지역 ${r.region} 과 안 맞습니다`)
  }
  const accounts = B.reps.reduce((s, r) => s + r.accounts, 0)
  if (accounts !== series[T - 1].length) bad(`담당 단지 합 ${accounts} ≠ 마지막 달 청구 단지 ${series[T - 1].length}`)

  const tierEconTiers = new Set(B.tierEcon.map((t) => t.tier))
  for (const t of R.tiers) if (!tierEconTiers.has(t.id)) bad(`BI_TIER_ECONOMICS 에 티어 ${t.id} 가 없습니다`)
  for (const t of B.tierEcon) {
    const list = series[T - 1].filter((r) => roster.get(r.i)?.tier === t.tier)
    if (list.length !== t.complexes) bad(`티어 경제 ${t.tier}: 단지 ${t.complexes} ≠ ${list.length}`)
    const rev = list.reduce((s, r) => s + r.s + r.u, 0)
    if (rev !== t.revenue) bad(`티어 경제 ${t.tier}: 매출 ${t.revenue} ≠ ${rev}`)
    const floored = list.filter((r) => r.f > 0).length
    if (floored !== t.floored) bad(`티어 경제 ${t.tier}: 최소요금 적용 ${t.floored} ≠ ${floored}`)
  }

  /* THE PROSE. Same rule as the other data pages: a percentage in a sentence
     has to be a number the data holds. The dictionary block does not exist
     yet — the page is not written — so this reports rather than fails, and
     becomes binding the moment the block appears. */
  const hasBlock = ['ko', 'en'].map((locale) => {
    const dict = readFileSync(join(ROOT, 'lib', 'i18n', 'dictionaries', `${locale}.ts`), 'utf8')
    return { locale, block: /\n {2}revenue: \{([\s\S]*?)\n {2}\},/.exec(dict)?.[1] ?? null }
  })
  if (hasBlock.every((h) => h.block === null)) {
    notes.push('본문 검사는 대기 중 — 사전에 revenue 블록이 아직 없습니다')
  } else {
    const allowed = new Set([0, 100])
    for (const b of B.rateCard) for (const r of b.rows) allowed.add(r.perHousehold)
    for (const t of B.tierEcon) allowed.add(t.perHousehold)
    for (const c of B.cohorts) for (const v of [...c.kept, ...c.value]) allowed.add(v)
    for (const r of B.reps) allowed.add(r.attainment)
    for (let m = 0; m < T; m++) {
      const a = B.adoption[m]
      allowed.add(Math.round((a.complexes / B.tam.complexes) * 10000) / 100)
      allowed.add(Math.round((a.addressable / B.tam.addressable) * 10000) / 100)
      for (const svc of B.services) {
        allowed.add(Math.round((B.attach[svc.id][m] / a.complexes) * 1000) / 10)
      }
    }
    for (const { locale, block } of hasBlock) {
      if (!block) { bad(`${locale}.ts 에 revenue 블록이 없습니다 — 다른 로케일에는 있습니다`); continue }
      for (const [, raw] of block.matchAll(/(\d+(?:\.\d+)?)\s*%/g)) {
        if (!allowed.has(Number(raw))) bad(`${locale}.ts: 본문의 ${raw}% 가 데이터에 없는 값입니다`)
      }
    }
    /* And the three places the page has to say what is real and what is not.
       A dashboard on invented revenue that stops saying so is the one failure
       this whole exercise cannot survive. */
    for (const { locale, block } of hasBlock) {
      if (!block) continue
      for (const key of ['syntheticHero', 'syntheticChart', 'syntheticPanel']) {
        if (!new RegExp(`\\n {4}${key}:`).test(block)) {
          bad(`${locale}.ts revenue 블록에 ${key} 가 없습니다 — 합성 데이터 표기 3곳 중 하나입니다`)
        }
      }
    }
  }
}

/* ==== I. the browser's copy ======================================== */

section('I 클라이언트 슬라이스')

/**
 * public/data/bi/slice.json is a THIRD copy of the same numbers, and that is
 * the whole reason it needs checking.
 *
 * lib/bi.data.ts holds aggregates, public/data/bi/series/ holds the base
 * rows, and this holds the base rows again — denormalised, run-length
 * encoded and folded together with the roster and the invented per-customer
 * attributes so the browser makes one request instead of four. Every
 * transformation in that sentence is a place the copy can quietly stop
 * agreeing with its sources, and the page that reads it does all of its
 * arithmetic in the browser where no gate can watch.
 *
 * So the RLE is expanded and compared month by month against the series
 * files. If the two ever disagree, the filterable dashboard is reporting
 * different revenue from the static one for the same slice, which is the
 * worst failure either page has available.
 */
{
  const path = join(ROOT, 'public', 'data', 'bi', 'slice.json')
  const custPath = join(ROOT, 'public', 'data', 'bi', 'customers.json')
  if (!existsSync(path) || !existsSync(custPath)) {
    bad('public/data/bi/slice.json 또는 customers.json 이 없습니다 — build-bi-slice.mjs 를 돌리세요')
  } else {
    const sl = JSON.parse(readFileSync(path, 'utf8'))
    const cust = new Map(JSON.parse(readFileSync(custPath, 'utf8')).map((c) => [c.i, c]))

    if (sl.m.length !== T || sl.m[0] !== MONTHS[0] || sl.m[T - 1] !== MONTHS[T - 1]) {
      bad(`슬라이스의 창 ${sl.m[0]}..${sl.m[sl.m.length - 1]} 이 BI_MONTHS 와 다릅니다`)
    }
    if (sl.sv.length !== B.services.length) {
      bad(`슬라이스 서비스 ${sl.sv.length}종 ≠ 카탈로그 ${B.services.length}종`)
    }
    if (sl.tr.length !== R.tiers.length) bad(`슬라이스 티어 ${sl.tr.length} ≠ ${R.tiers.length}`)
    if (sl.dt.length !== R.districts.length) bad(`슬라이스 시군구 ${sl.dt.length} ≠ ${R.districts.length}`)
    if (sl.ad !== R.addressable) bad(`슬라이스 판매가능 하한 ${sl.ad} ≠ ${R.addressable}`)

    /* Every complex that billed in the window has to be in the slice, and
       nothing else may be. */
    const billed = new Set()
    for (const rows of series) for (const r of rows) billed.add(r.i)
    if (sl.cx.length !== billed.size) {
      bad(`슬라이스 단지 ${sl.cx.length} ≠ 창 안에서 청구된 단지 ${billed.size}`)
    }

    const expand = (pairs) => {
      const out = []
      for (const [v, n] of pairs) for (let k = 0; k < n; k++) out.push(v)
      return out
    }
    const tierOfIdx = (hh) => R.tiers.findIndex((t) => t.to === 'Infinity' || hh < t.to)

    let months = 0
    for (const c of sl.cx) {
      const home = roster.get(c.i)
      if (!home) { bad(`슬라이스의 ${c.i} 가 명부에 없습니다`); continue }
      if (!billed.has(c.i)) { bad(`슬라이스의 ${c.i} 는 창 안에서 청구되지 않았습니다`); continue }
      if (c.h !== home.h) bad(`${c.i}: 세대수 ${c.h} ≠ 명부 ${home.h}`)
      if (c.n !== home.n) bad(`${c.i}: 이름이 명부와 다릅니다`)
      if (sl.dt[c.d]?.c !== home.code) bad(`${c.i}: 시군구 색인이 명부의 ${home.code} 를 가리키지 않습니다`)
      if (c.t !== tierOfIdx(home.h)) bad(`${c.i}: 티어 색인 ${c.t} 가 ${home.h}세대와 안 맞습니다`)
      const inv = cust.get(c.i)
      if (!inv) bad(`${c.i}: customers.json 에 없습니다`)
      else {
        if (c.g !== inv.g) bad(`${c.i}: 관리방식 ${c.g} ≠ customers.json ${inv.g}`)
        if (sl.rp[c.r] !== inv.r) bad(`${c.i}: 담당 색인이 ${inv.r} 을 가리키지 않습니다`)
      }

      const sub = expand(c.s)
      if (sub.length !== c.u.length) bad(`${c.i}: 구독 ${sub.length}개월 ≠ 사용량 ${c.u.length}개월`)
      for (let k = 0; k < sub.length; k++) {
        const m = c.f + k
        if (m >= T) { bad(`${c.i}: ${k}번째 값이 창을 넘어갑니다`); break }
        const row = series[m].find((r) => r.i === c.i)
        const wantS = row ? row.s : 0
        const wantU = row ? row.u : 0
        if (sub[k] !== wantS) bad(`${MONTHS[m]}: ${c.i} 슬라이스 구독 ${sub[k]} ≠ 행 ${wantS}`)
        if (c.u[k] !== wantU) bad(`${MONTHS[m]}: ${c.i} 슬라이스 사용량 ${c.u[k]} ≠ 행 ${wantU}`)
        months++
        if (problems.length > 200) break
      }
      /* And nothing outside [f, f+len) may have billed — otherwise the dense
         array silently drops a month the reader would never see. */
      for (let m = 0; m < T; m++) {
        const inArr = m >= c.f && m < c.f + sub.length
        const inRows = series[m].some((r) => r.i === c.i)
        if (inRows && !inArr) bad(`${MONTHS[m]}: ${c.i} 이 청구됐는데 슬라이스 배열 밖입니다`)
      }
      if (problems.length > 200) break
    }

    for (const c of sl.cx) {
      for (const [svc, a, b] of c.k) {
        if (svc < 0 || svc >= sl.sv.length) { bad(`${c.i}: 서비스 색인 ${svc}`); break }
        if (a > b && b >= 0) bad(`${c.i}: 계약 구간 ${a}..${b} 가 뒤집혔습니다`)
      }
    }
    /**
     * The unfiltered slice has to reproduce the published aggregate.
     *
     * This is the check that matters most, because it is the one a reader can
     * perform themselves: open /portfolio/bi-dashboard with no filters set
     * and the headline MRR has to be the number /portfolio/revenue prints for
     * the same month. Two pages built from the same data reporting different
     * revenue for the same slice is the worst failure either of them has
     * available, and nothing else here would catch it — the aggregates are
     * checked against the series, and the slice is checked against the
     * series, but the ARITHMETIC THE BROWSER DOES is checked by nothing.
     *
     * So it is done the way the browser does it: expand every RLE, sum the
     * default view, compare against BI_MOVEMENT.
     */
    const monthly = new Array(T).fill(0)
    const usage = new Array(T).fill(0)
    const live = new Array(T).fill(0)
    for (const c of sl.cx) {
      const sub = expand(c.s)
      for (let k = 0; k < sub.length; k++) {
        const m = c.f + k
        if (m >= T) break
        if (sub[k] === 0 && (c.u[k] ?? 0) === 0) continue
        monthly[m] += sub[k]
        usage[m] += c.u[k] ?? 0
        live[m] += 1
      }
    }
    for (let m = 0; m < T; m++) {
      const row = B.movement[m]
      if (monthly[m] !== row.end) {
        bad(`${MONTHS[m]}: 필터 없는 슬라이스 합 ${monthly[m]} ≠ BI_MOVEMENT.end ${row.end}`)
      }
      if (usage[m] !== row.usage) {
        bad(`${MONTHS[m]}: 슬라이스 사용량 합 ${usage[m]} ≠ BI_MOVEMENT.usage ${row.usage}`)
      }
      if (live[m] !== row.complexes) {
        bad(`${MONTHS[m]}: 슬라이스 청구 단지 ${live[m]} ≠ BI_MOVEMENT.complexes ${row.complexes}`)
      }
    }

    notes.push(`슬라이스 ${nfk(sl.cx.length)}단지 · ${nfk(months)}개월분을 RLE 풀어 행과 대조`)
    notes.push(`필터 없는 슬라이스 합이 ${T}개월 전부에서 BI_MOVEMENT 와 일치`)
  }
}

/* ==== report ======================================================= */

const nf = (v) => Number(v).toLocaleString('ko-KR')
const last = B.movement[T - 1]
const lastAdopt = B.adoption[T - 1]

line('')
line('  REVENUE DASHBOARD')
line('  ' + '-'.repeat(70))
line(`  명부(실제)  단지 ${nf(R.intake.complexes)} · 시군구 ${R.intake.covered}/${R.intake.districts} · 세대 ${nf(R.households.total)} = 인구의 ${(R.scale.realisedShare * 100).toFixed(1)}%`)
line(`  추정        순서 관측(rho ${R.fit.spearman}, 홀드아웃 ${nf(R.fit.holdout)}) · 크기 선언(중앙 ${nf(R.households.median)})`)
line(`  합성        계약 ${nf(B.intake.contracts)} · 시계열 ${nf(B.intake.seriesRows)}행 · 파이프라인 ${nf(B.intake.pipeline)} · 영업 ${B.reps.length}명`)
line(`  침투율      ${((lastAdopt.complexes / B.tam.complexes) * 100).toFixed(2)}% 전체 · ${((lastAdopt.addressable / B.tam.addressable) * 100).toFixed(2)}% 판매가능`)
line(`  MRR         ${nf(B.movement[0].end)} → ${nf(last.end)} (${T}개월, ×${(last.end / B.movement[0].end).toFixed(2)})`)
line(`  요율표      ${B.rateCard.map((b) => `${b.id} ${b.rows[0].perHousehold}→${b.rows[b.rows.length - 1].perHousehold}`).join(' · ')} 원/세대`)
line('  ' + '-'.repeat(70))
for (const n of notes) line(`  · ${n}`)
line('  ' + '-'.repeat(70))
if (problems.length) {
  /* Grouped, and every section that failed gets to speak. Three examples
     each is enough to recognise a pattern and few enough that no section can
     bury another. */
  const groups = new Map()
  for (const p of problems) {
    const list = groups.get(p.section)
    if (list) list.push(p.msg)
    else groups.set(p.section, [p.msg])
  }
  for (const [name, msgs] of groups) {
    line(`  ${name} — ${msgs.length}건`)
    for (const m of msgs.slice(0, 3)) line(`    ✗ ${m}`)
    if (msgs.length > 3) line(`    ... 그리고 ${msgs.length - 3}건`)
  }
  line('')
  line(`  FAIL — ${groups.size}개 섹션, ${problems.length} problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line('  PASS — 집계가 행에서 다시 나오고, 워터폴이 닫히고, 구독이 요율표와 일치하고,')
line('         분모가 실측이고, 요율표가 단조 하락이고, 스트림이 독립입니다.')
line('')
