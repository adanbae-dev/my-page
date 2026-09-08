#!/usr/bin/env node
/**
 * The invented half: contracts, prices, revenue, churn and a sales team.
 *
 * GENERATES lib/bi.data.ts, public/data/bi/contracts.json,
 * public/data/bi/pipeline.json and 36 monthly files under
 * public/data/bi/series/. Reads the roster built by scripts/build-roster.mjs
 * and invents everything else.
 *
 * NONE OF THIS IS REAL and the dashboard has to say so in three places, not
 * one. What a management app charges an apartment complex, which complexes
 * signed, when they left and who sold to them is commercial information that
 * does not exist in public form and could not be published if it did. So the
 * only honest way to build a revenue dashboard on this subject is to invent
 * the revenue and be loud about it — which is also why the roster underneath
 * is real: it makes the one figure that would otherwise be meaningless,
 * market penetration, rest on a denominator nobody had to make up.
 *
 * TWO FINDINGS ARE DESIGNED IN, NOT DISCOVERED. Saying so is the difference
 * between a demonstration and a lie:
 *
 *   1  PER-HOUSEHOLD REVENUE FALLS AS COMPLEXES GET BIGGER, while revenue
 *      per complex rises. Two mechanisms do it — a volume discount above
 *      1,000 households and a monthly floor that binds only on small
 *      accounts — and both are ordinary commercial terms. A bar chart of
 *      revenue by size tier says "large complexes are our best customers".
 *      The same data per household says the opposite, and a sales incentive
 *      built on either one alone pays for the wrong thing.
 *
 *   2  TOTAL MRR RISES EVERY MONTH WHILE SOME COHORTS SHRINK. New business
 *      covers churn, so the headline line goes up and to the right for all
 *      36 months while complexes signed in the middle of the window are
 *      worth less than they were. One line cannot show this; the movement
 *      waterfall and the cohort grid can.
 *
 * TIME SERIES ARE NOT NOISE ON A TREND. The generator keeps two components
 * strictly apart, because conflating them is what makes synthetic revenue
 * data look wrong to anyone who has read a real P&L:
 *
 *   SUBSCRIPTION IS A STEP FUNCTION. A per-household fee times a household
 *   count that does not change is the same number every month until the
 *   contract changes. It does not drift, wobble or trend. `pnpm check:bi`
 *   asserts that it never moves in a month with no contract event — a gate
 *   that exists because the first instinct when generating revenue is to
 *   multiply everything by a little noise, and that instinct would have
 *   destroyed the only signal the step function carries.
 *
 *   USAGE IS CONTINUOUS AND AUTOCORRELATED. Visitor parking, SMS fallbacks
 *   and resident votes vary month to month, with an AR(1) so that a busy
 *   month is followed by a busy month. Drawing each month independently
 *   makes a sawtooth, and real usage series do not saw.
 *
 * SEASONALITY IS ONLY WHERE A REASON CAN BE NAMED. Resident council
 * elections in November and December, management-company handover in
 * January and July, 명절 visitor traffic, moving season SMS. Nothing was
 * added because it made the chart livelier — decorative seasonality is
 * indistinguishable from a finding once it is drawn.
 *
 * MRR IS SUBSCRIPTION ONLY. Usage revenue is real revenue and is reported,
 * but it is not recurring and putting it in MRR would make the movement
 * waterfall unreconcilable and the growth rate a function of how many
 * holidays fell in the quarter.
 *
 * EVERYTHING IS SEEDED BY KEY, NOT BY SEQUENCE. Each entity draws from a
 * stream derived from its own id, so adding a complex changes that complex
 * and nothing else. A single sequential generator would reshuffle the whole
 * dataset on any upstream change, and no diff would be readable again.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { makeStream } from './bi.rng.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROSTER_DIR = join(ROOT, 'public', 'data', 'bi', 'roster')
const OUT_DIR = join(ROOT, 'public', 'data', 'bi')
const SERIES_DIR = join(OUT_DIR, 'series')
const OUT_TS = join(ROOT, 'lib', 'bi.data.ts')

/** Change this and every invented number below changes. Nothing else does. */
const SEED = 'goldibug/bi/2026-09'

/* ==== 1. the window ================================================= */

const FROM = '202309'
const TO = '202608'

/**
 * A burn-in before the published window, and it is not a nicety.
 *
 * THE FIRST VERSION OF THIS FILE STARTED THE COMPANY ON THE WINDOW'S FIRST
 * MONTH, and the result was a dashboard reporting 313x MRR growth over three
 * years — true, arithmetically, and worthless. It began at two customers.
 * Every rate on the page was dominated by the fact that the denominator
 * started near zero: month-over-month growth, cohort counts, attainment
 * against quota, all of them measuring the founding rather than the
 * business.
 *
 * Worse, the movement waterfall's first row was wrong in a way that would
 * have looked right. With no month before it, every existing account's
 * revenue lands in `new` — so the first row said the company signed its
 * entire book in one month. A window that does not start at a company's
 * founding has an OPENING BALANCE, and there is nowhere for it to come from
 * unless the simulation ran before the window did.
 *
 * So 24 months are simulated and thrown away. Contracts, churn, upsell and
 * the AR(1) usage chains all run through them; only the published window is
 * published. What reaches the page therefore opens mid-history, with an
 * opening balance, mature cohorts, and customers whose start dates are
 * simply not in the window — which is what a real dashboard looks like.
 */
const PRE = 24

const step = (ym, k) => {
  let y = +ym.slice(0, 4)
  let m = +ym.slice(4) + k
  y += Math.floor((m - 1) / 12)
  m = ((((m - 1) % 12) + 12) % 12) + 1
  return `${y}${String(m).padStart(2, '0')}`
}

/** Every simulated month, burn-in first. Indices in this array are `m`. */
const MONTHS = (() => {
  const out = []
  let ym = step(FROM, -PRE)
  for (;;) {
    out.push(ym)
    if (ym === TO) break
    ym = step(ym, 1)
    if (out.length > 600) throw new Error('window never reached TO')
  }
  return out
})()
const MI = new Map(MONTHS.map((m, i) => [m, i]))
const T = MONTHS.length

/** The published window: the last months, burn-in dropped. */
const W0 = MI.get(FROM)
if (W0 !== PRE) throw new Error(`burn-in is ${W0} months, expected ${PRE}`)
const WIN = MONTHS.slice(W0)
const TW = WIN.length

/* ==== 2. the service catalogue ====================================== */

/**
 * Eleven services, four billing models.
 *
 * `perHH` is a monthly fee per household — the bulk of recurring revenue and
 * the only model the volume discount and the monthly floor touch.
 * `perComplex` is a flat monthly fee, used where the work does not scale
 * with households (a booking calendar, a defect intake queue).
 * `perEvent` and `perUse` are usage: a vote costs the same whether the
 * complex has 200 households or 2,000, and an SMS fallback is billed per
 * message actually sent.
 *
 * `needs` is a hard dependency, not a bundle discount — visitor registration
 * reads the parking system's plate database and cannot be sold without it.
 * `minHouseholds` and `minYear` are eligibility, not preference: a shared
 * facility booking service has nothing to book below about 300 households,
 * and a defect intake queue is only useful inside the statutory warranty
 * period, which is why it is sold to complexes completed from 2021 on.
 */
const SERVICES = [
  { id: 'parking',   model: 'perHH',      price: 480,    minHouseholds: 100, setup: [1500000, 6000000] },
  { id: 'visitor',   model: 'perHH',      price: 110,    needs: 'parking' },
  { id: 'access',    model: 'perHH',      price: 250,    minHouseholds: 200, setup: [1000000, 4000000] },
  { id: 'cctv',      model: 'perHH',      price: 160,    minHouseholds: 150, setup: [800000, 3000000] },
  { id: 'billing',   model: 'perHH',      price: 320 },
  { id: 'notice',    model: 'perHH',      price: 150 },
  { id: 'community', model: 'perComplex', price: 90000,  minHouseholds: 300 },
  { id: 'defect',    model: 'perComplex', price: 80000,  minYear: 2021 },
  { id: 'locker',    model: 'perComplex', price: 50000,  minHouseholds: 150, setup: [400000, 1200000] },
  { id: 'vote',      model: 'perEvent',   price: 180000 },
  { id: 'sms',       model: 'perUse',     price: 15,     needs: 'notice' },
]
const SVC = new Map(SERVICES.map((s) => [s.id, s]))

/**
 * The volume discount, and the floor. Both are ordinary terms, and together
 * they are the whole of finding 1.
 *
 * The discount applies to the households ABOVE each edge, not to all of them
 * — a 1,200-household complex pays full rate on the first thousand. Written
 * as marginal bands because that is how such a term is actually drafted, and
 * because a cliff at 1,000 would make one extra household worth minus ten
 * per cent of the bill.
 */
const VOLUME_BANDS = [
  { upTo: 1000, rate: 1 },
  { upTo: 2000, rate: 0.9 },
  { upTo: Infinity, rate: 0.82 },
]

/**
 * Minimum monthly charge across a complex's per-household services.
 *
 * Real, and the reason small complexes have the highest per-household
 * revenue: onboarding, support and an account cost roughly the same whatever
 * the household count, so below about 330 households the per-household rate
 * stops covering them. Billed as its own line rather than folded into a
 * service, so that a complex's bill still adds up service by service and the
 * top-up is visible as what it is.
 */
const MIN_MONTHLY = 50000

/* ==== 3. the sales organisation ===================================== */

/**
 * Four regions, seven teams, eighteen people. Ordinary shape for a B2B field
 * team of this size: a region owns provinces outright, so a complex's owner
 * follows from where it is rather than from who found it, and territory
 * conflicts do not have to be modelled.
 */
const REGIONS = [
  { id: 'capital', sido: ['서울특별시', '인천광역시', '경기도'], teams: 3 },
  { id: 'yeongnam', sido: ['부산광역시', '대구광역시', '울산광역시', '경상북도', '경상남도'], teams: 2 },
  { id: 'chungho', sido: ['대전광역시', '세종특별자치시', '충청북도', '충청남도', '전북특별자치도', '전남광주통합특별시'], teams: 1 },
  { id: 'gangje', sido: ['강원특별자치도', '제주특별자치도'], teams: 1 },
]

/** Rank mix per team, and what each rank is expected to close per month. */
const RANKS = [
  { id: 'lead', quota: 7600000 },
  { id: 'senior', quota: 6200000 },
  { id: 'mid', quota: 4800000 },
  { id: 'junior', quota: 3100000 },
]

/* ==== 4. acquisition targets ======================================== */

/**
 * How many complexes of each tier ever become customers.
 *
 * WEIGHTED HARD TOWARD SIZE, and that is not a modelling convenience — it is
 * how this product is actually sold. A 2,400-household complex has a full
 * management office, a budget line for software and a residents' council
 * that meets; a 90-household walk-up has a part-time caretaker. So roughly
 * half the largest tier ever signs against well under one per cent of the
 * smallest, and the single national penetration rate the dashboard also
 * reports is an average of those two worlds that describes neither.
 *
 * These are EVER-SIGNED counts, not end-of-window ones. Churn runs over the
 * burn-in as well as the window, so the final month's penetration is lower
 * than these targets and is reported from the series rather than from here.
 */
const TIER_TARGET = { xlarge: 30, large: 175, mid: 500, small: 480, sub: 100 }

/** Of those, the share that has churned by the end of the window. */
const CHURN_BASE = 0.009
const CHURN_SELF_MULT = 2.0
const CHURN_SEASON = { '01': 2.2, '07': 1.8 }
const WINBACK_RATE = 0.08

/* ==== 5. seasonality, declared with its reason ====================== */

/**
 * Only where a cause can be named. Everything absent from this table is flat
 * on purpose: a seasonal bump nobody can explain is indistinguishable from a
 * finding once it is drawn on a chart.
 */
const SEASON = {
  /* 입주자대표회의 선거 — councils are elected in late autumn and the
     electronic ballot is what the complex buys the service for. */
  vote: { '11': 2.6, '12': 2.2, '01': 0.7, '02': 0.6, '03': 0.6, '04': 0.6, '05': 0.6, '06': 0.6, '07': 0.6, '08': 0.6, '09': 0.7, '10': 1.1 },
  /* 명절. Approximated to February and September: 설 and 추석 both move
     against the solar calendar and pinning them exactly would need a lunar
     table for a 40% bump. */
  visitor: { '02': 1.4, '09': 1.4, '01': 1.1, '08': 1.1 },
  /* 이사철 and 신학기 — the months a management office sends the most
     notices, and therefore the most SMS fallbacks to residents with no app. */
  sms: { '02': 1.25, '03': 1.25, '08': 1.2, '09': 1.2 },
}

/** AR(1) on usage. Higher and the series barely moves; lower and it saws. */
const AR_PHI = 0.6
const AR_SIGMA = 0.18

/* ==== 6. seeded streams ============================================= */

/**
 * The stream, from scripts/bi.rng.mjs.
 *
 * It lives in its own module so that scripts/check-bi.mjs can measure THIS
 * generator's independence across key prefixes rather than a copy of it. The
 * reason that check exists at all is written there.
 */
const streamFor = makeStream(SEED)

/** Box-Muller. Two draws per call; the second is discarded. */
const normal = (rnd) => {
  const u = Math.max(1e-12, rnd())
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
}
const between = (rnd, a, b) => a + rnd() * (b - a)
const intBetween = (rnd, a, b) => Math.floor(between(rnd, a, b + 1))
const shuffled = (rnd, arr) => {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
const pickWeighted = (rnd, items, weightOf) => {
  const total = items.reduce((s, it) => s + weightOf(it), 0)
  let r = rnd() * total
  for (const it of items) {
    r -= weightOf(it)
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

/* ==== 7. read the roster ============================================ */

if (!existsSync(ROSTER_DIR)) {
  process.stderr.write('\n  x public/data/bi/roster is missing — run node scripts/build-roster.mjs\n\n')
  process.exit(1)
}

const rsrc = readFileSync(join(ROOT, 'lib', 'bi.roster.data.ts'), 'utf8')
const TIERS = [...rsrc.matchAll(/\{ id: '(\w+)', to: (\d+|Infinity) \},/g)]
  .map((m) => ({ id: m[1], to: m[2] === 'Infinity' ? Infinity : +m[2] }))
const tierOf = (hh) => TIERS.find((t) => hh < t.to).id
const ADDRESSABLE = +/ROSTER_ADDRESSABLE = (\d+)/.exec(rsrc)[1]
const districtMeta = new Map(
  [...rsrc.matchAll(/\{ code: '(\d+)', sido: '([^']+)', sgg: '([^']+)', pop: \d+, complexes: \d+, addressable: \d+, households: \d+ \},/g)]
    .map((m) => [m[1], { sido: m[2], sgg: m[3] }]),
)

const roster = []
for (const f of readdirSync(ROSTER_DIR).filter((n) => n.endsWith('.json'))) {
  const code = f.replace('.json', '')
  const meta = districtMeta.get(code)
  if (!meta) continue
  for (const r of JSON.parse(readFileSync(join(ROSTER_DIR, f), 'utf8'))) {
    roster.push({
      id: r.i, code, sido: meta.sido, sgg: meta.sgg, umd: r.u,
      name: r.n, year: r.y, hh: r.h, tier: tierOf(r.h),
    })
  }
}
if (roster.length < 1000) {
  process.stderr.write(`\n  x roster has only ${roster.length} complexes\n\n`)
  process.exit(1)
}

/**
 * Management type, invented.
 *
 * 위탁 (a management company runs the complex) or 자치 (the residents'
 * council runs it directly). It matters twice: delegated complexes adopt
 * software far more readily because the management company already runs it
 * elsewhere, and self-managed complexes churn about twice as often because
 * the decision sits with a council whose members turn over. Larger complexes
 * are overwhelmingly delegated, which is why the draw is size dependent.
 */
for (const c of roster) {
  const rnd = streamFor(`mgmt|${c.id}`)
  const pDelegated = c.hh >= 1000 ? 0.94 : c.hh >= 400 ? 0.86 : c.hh >= ADDRESSABLE ? 0.72 : 0.45
  c.mgmt = rnd() < pDelegated ? 'delegated' : 'self'
}

/* ==== 8. build the sales organisation =============================== */

const sidoRegion = new Map()
for (const r of REGIONS) for (const s of r.sido) sidoRegion.set(s, r.id)
const unmapped = [...new Set(roster.map((c) => c.sido))].filter((s) => !sidoRegion.has(s))
if (unmapped.length) {
  process.stderr.write(`\n  x no sales region covers: ${unmapped.join(', ')}\n\n`)
  process.exit(1)
}

const teams = []
const reps = []
for (const region of REGIONS) {
  for (let t = 0; t < region.teams; t++) {
    const teamId = `${region.id}-${t + 1}`
    teams.push({ id: teamId, region: region.id })
    const rnd = streamFor(`team|${teamId}`)
    /* A team is a lead plus two or three others. Ranks below the lead are
       drawn, so team strength varies — which is what makes attainment worth
       charting at all. */
    const mix = ['lead', ...Array.from({ length: intBetween(rnd, 1, 2) }, () =>
      pickWeighted(rnd, ['senior', 'mid', 'junior'], (r) => (r === 'mid' ? 3 : 2)))]
    mix.forEach((rank, i) => {
      reps.push({
        id: `${teamId}-${i + 1}`,
        team: teamId,
        region: region.id,
        rank,
        quota: RANKS.find((r) => r.id === rank).quota,
      })
    })
  }
}

/* Districts are split across the region's reps so that a complex's owner is
   a function of where it is. Sorted by code first: an unsorted assignment
   would depend on filesystem order. */
const repOfDistrict = new Map()
for (const region of REGIONS) {
  const codes = [...new Set(roster.filter((c) => region.sido.includes(c.sido)).map((c) => c.code))].sort()
  const crew = reps.filter((r) => r.region === region.id)
  codes.forEach((code, i) => repOfDistrict.set(code, crew[i % crew.length].id))
}

/* ==== 9. choose the customers ======================================= */

/**
 * Which complexes ever sign, and when.
 *
 * Selection is by score within tier rather than uniformly at random: a
 * delegated complex is far likelier to sign than a self-managed one of the
 * same size, and inside a tier the bigger complexes go first. The tier
 * targets then fix how many of each are taken, so the resulting penetration
 * curve by size is a stated intention rather than an emergent accident.
 */
const customers = []
for (const tier of TIERS) {
  const pool = roster.filter((c) => c.tier === tier.id)
  const target = Math.min(TIER_TARGET[tier.id] ?? 0, pool.length)
  const scored = pool.map((c) => {
    const rnd = streamFor(`pick|${c.id}`)
    const appeal = (c.mgmt === 'delegated' ? 1.9 : 1) * Math.log(c.hh + 40) * between(rnd, 0.55, 1.45)
    return { c, appeal }
  })
  scored.sort((a, b) => b.appeal - a.appeal || (a.c.id < b.c.id ? -1 : 1))
  for (const { c } of scored.slice(0, target)) customers.push(c)
}

/**
 * Onboarding month, weighted toward the end of the window.
 *
 * A company that signed the same number of complexes every month for three
 * years is not a company anybody would build this dashboard for. The weight
 * grows about fourfold across the window, which puts most cohorts late and
 * is also what makes finding 2 possible — a rising acquisition rate is
 * exactly what lets total MRR climb while older cohorts decay.
 */
for (const c of customers) {
  const rnd = streamFor(`onboard|${c.id}`)
  const idx = MONTHS.map((_, i) => i)
  c.start = pickWeighted(rnd, idx, (i) => 1 + 3 * (i / (T - 1)) ** 1.5)
  c.rep = repOfDistrict.get(c.code)
}

/* ==== 10. contracts, upsell, churn and winback ====================== */

const eligible = (c, svc) => {
  if (svc.minHouseholds && c.hh < svc.minHouseholds) return false
  if (svc.minYear && (c.year === null || c.year < svc.minYear)) return false
  return true
}

/** Entry weight: what a complex buys first, before it trusts the vendor. */
const ENTRY_WEIGHT = {
  notice: 9, billing: 7, parking: 6, vote: 4, locker: 3,
  community: 2, cctv: 2, access: 2, defect: 2, visitor: 1, sms: 1,
}

const contracts = []
/** activeAt[complexId] = Uint8Array over months, 1 while under contract. */
const spans = new Map()

for (const c of customers) {
  const rnd = streamFor(`life|${c.id}`)
  const own = new Uint8Array(T)

  /* The complex's own life: signed at `start`, churns on a monthly hazard,
     and may come back once. Computed before services, because a service
     cannot outlive the account that holds it. */
  const segments = []
  let cursor = c.start
  let winbackLeft = rnd() < WINBACK_RATE ? 1 : 0
  while (cursor < T) {
    let end = T
    /* Churn is evaluated from the SECOND month of a segment, not the first.
       Testing it at m === cursor lets a complex cancel in the month it
       signed, which produces a customer with no billed month at all — not a
       customer, a lost deal, and it corrupted every cohort's first column:
       `kept[0]` came out between 81 and 97 per cent when by definition it is
       100. `pnpm check:bi` asserts that column now. */
    for (let m = cursor + 1; m < T; m++) {
      const tenure = m - cursor
      const season = CHURN_SEASON[MONTHS[m].slice(4)] ?? 1
      /* Elevated in the first half-year: an account that never got past
         onboarding is the commonest way a contract like this ends. */
      const green = tenure < 6 ? 1.8 : 1
      const hazard = CHURN_BASE * (c.mgmt === 'self' ? CHURN_SELF_MULT : 1) * season * green
      if (rnd() < hazard) { end = m; break }
    }
    segments.push([cursor, end])
    for (let m = cursor; m < end; m++) own[m] = 1
    if (end >= T || !winbackLeft) break
    winbackLeft = 0
    const gap = intBetween(rnd, 4, 12)
    cursor = end + gap
  }
  spans.set(c.id, own)
  c.segments = segments

  /* Services. An entry bundle of one to three, then upsell attempts from six
     months in — one service at a time, because that is how an account
     manager actually adds them. */
  const pool = SERVICES.filter((s) => eligible(c, s))
  const held = new Set()
  const openFrom = new Map()

  const canAdd = (s) => !held.has(s.id) && (!s.needs || held.has(s.needs))
  const addAt = (s, m) => { held.add(s.id); openFrom.set(s.id, m) }

  /**
   * The first service is always a RECURRING one.
   *
   * An account whose only service is a vote or an SMS fallback bills nothing
   * in a month with no vote and no SMS — so it is a customer with a signed
   * contract and no revenue, which is not a customer in this business. A
   * management app is bought as a platform and votes are an add-on to it.
   *
   * It was also a data bug with two faces, and `pnpm check:bi` caught both:
   * such an account has no series row in a quiet month, so the cohort it
   * belongs to reported first-month retention of 92 to 98 per cent when by
   * definition it is 100, and the sales table's account count ran ahead of
   * the number of complexes actually billing. Emitting a zero row instead
   * would have squared the two counts and corrupted every per-complex
   * average, which is the trade this file refuses everywhere else.
   */
  const RECURRING = new Set(['perHH', 'perComplex'])
  const base = pool.filter((s) => RECURRING.has(s.model) && canAdd(s))
  if (!base.length) {
    process.stderr.write(`\n  x ${c.id} (${c.hh}세대, ${c.year}년) has no recurring service to sell\n\n`)
    process.exit(1)
  }
  addAt(pickWeighted(rnd, base, (s) => ENTRY_WEIGHT[s.id] ?? 1), c.start)

  const bundleSize = Math.min(pool.length, intBetween(rnd, 1, 3))
  for (let k = 1; k < bundleSize; k++) {
    const options = pool.filter(canAdd)
    if (!options.length) break
    addAt(pickWeighted(rnd, options, (s) => ENTRY_WEIGHT[s.id] ?? 1), c.start)
  }

  for (const [segStart, segEnd] of segments) {
    for (let m = Math.max(segStart, c.start); m < segEnd; m++) {
      if (m - c.start < 6) continue
      if (rnd() > 0.035) continue
      const options = pool.filter(canAdd)
      if (!options.length) continue
      /* A dependent service whose parent is already held is the easiest
         upsell there is — the integration exists, the data is already in the
         system, and the account manager is proposing one line on an invoice
         the complex already pays. Weighting it the same as a cold service
         left visitor registration on 3.7% of accounts while parking sat on
         48%, which is not how those two products relate. */
      const weight = (svc) =>
        (ENTRY_WEIGHT[svc.id] ?? 1) + 2 + (svc.needs && held.has(svc.needs) ? 6 : 0)
      addAt(pickWeighted(rnd, options, weight), m)
    }
  }

  /* One contract row per (complex, service, segment). A service the complex
     held before it churned and held again after winback is two rows, because
     it is two contracts. */
  for (const [id, from] of openFrom) {
    const svc = SVC.get(id)
    const setupRnd = streamFor(`setup|${c.id}|${id}`)
    for (const [segStart, segEnd] of segments) {
      const f = Math.max(from, segStart)
      if (f >= segEnd) continue
      contracts.push({
        complex: c.id,
        service: id,
        from: MONTHS[f],
        to: segEnd >= T ? null : MONTHS[segEnd],
        setup: svc.setup && f === from
          ? Math.round(between(setupRnd, svc.setup[0], svc.setup[1]) / 10000) * 10000
          : 0,
        rep: c.rep,
      })
    }
  }
}

/* ==== 11. the monthly series ======================================== */

/** Per-household monthly fee, discounted on the marginal bands. */
function perHouseholdMonthly(households, price) {
  let sum = 0
  let left = households
  let floor = 0
  for (const band of VOLUME_BANDS) {
    if (left <= 0) break
    const take = Math.min(left, band.upTo - floor)
    sum += take * price * band.rate
    left -= take
    floor = band.upTo
  }
  return Math.round(sum)
}

/* Contracts indexed by complex, so each complex's 36 months are one pass. */
const byComplex = new Map()
for (const k of contracts) {
  const list = byComplex.get(k.complex)
  if (list) list.push(k)
  else byComplex.set(k.complex, [k])
}

const custById = new Map(customers.map((c) => [c.id, c]))

/** rows[monthIndex] = array of per-complex rows for that month. */
const rows = Array.from({ length: T }, () => [])
/** Usage AR(1) state, one chain per (complex, service). */
const arState = new Map()

for (const [id, list] of byComplex) {
  const c = custById.get(id)
  for (let m = 0; m < T; m++) {
    if (!spans.get(id)[m]) continue
    const ym = MONTHS[m]
    const mm = ym.slice(4)

    let perHH = 0
    let flat = 0
    let usage = 0
    let events = 0
    let messages = 0
    let visits = 0
    let active = 0

    for (const k of list) {
      const a = MI.get(k.from)
      const b = k.to === null ? T : MI.get(k.to)
      if (m < a || m >= b) continue
      active++
      const svc = SVC.get(k.service)

      if (svc.model === 'perHH') {
        perHH += perHouseholdMonthly(c.hh, svc.price)
        continue
      }
      if (svc.model === 'perComplex') {
        flat += svc.price
        continue
      }

      /* Usage. One AR(1) chain per contract line, advanced every active
         month so a gap in the middle of the window does not reset it. */
      const key = `${id}|${k.service}`
      let e = arState.get(key)
      if (e === undefined) {
        e = normal(streamFor(`ar0|${key}`))
        arState.set(key, e)
      } else {
        e = AR_PHI * e + Math.sqrt(1 - AR_PHI * AR_PHI) * normal(streamFor(`ar|${key}|${ym}`))
        arState.set(key, e)
      }
      const wobble = Math.exp(AR_SIGMA * e)
      const season = SEASON[k.service]?.[mm] ?? 1

      if (k.service === 'vote') {
        /* Votes are whole events, so the rate is turned into a count rather
           than a fractional invoice. A complex holds two or three a year. */
        const rate = (2.5 / 12) * season * wobble
        const rnd = streamFor(`vote|${key}|${ym}`)
        events = rate >= 1 ? Math.round(rate) : rnd() < rate ? 1 : 0
        usage += events * svc.price
        continue
      }
      if (k.service === 'sms') {
        /* Notices per household per month, times the share of residents with
           no app, times the fallback rate. */
        const rnd = streamFor(`sms|${key}`)
        messages = Math.round(c.hh * between(rnd, 6, 14) * between(rnd, 0.08, 0.18) * season * wobble)
        usage += messages * svc.price
        continue
      }
      if (k.service === 'visitor') {
        const rnd = streamFor(`visit|${key}`)
        visits = Math.round(c.hh * between(rnd, 0.8, 1.6) * season * wobble)
        /* Billed per household monthly, not per visit — the visit count is
           carried because it is what the complex asks about, not what it
           pays for. */
        perHH += perHouseholdMonthly(c.hh, svc.price)
        continue
      }
    }

    /* The floor, as its own line. Applies to the per-household part only:
       a complex holding nothing but a flat-fee service is not underpriced. */
    const topUp = perHH > 0 ? Math.max(0, MIN_MONTHLY - perHH) : 0
    const subscription = perHH + topUp + flat
    if (subscription === 0 && usage === 0) continue

    rows[m].push({
      i: id,
      s: subscription,
      f: topUp,
      u: Math.round(usage),
      n: active,
      e: events,
      g: messages,
      v: visits,
    })
  }
}

/* ==== 12. the movement waterfall ==================================== */

/**
 * Recomputed from the series, not accumulated while generating it.
 *
 * The identity end = start + new + winback + expansion - contraction - churn
 * only proves anything if the two sides come from different passes. Adding
 * up movements as they were generated would produce a table that always
 * reconciles and never checks anything.
 */
const subOf = rows.map((list) => new Map(list.map((r) => [r.i, r.s])))
const seenBefore = new Set()
const movement = []

for (let m = 0; m < T; m++) {
  const now = subOf[m]
  const prev = m > 0 ? subOf[m - 1] : new Map()
  let start = 0
  for (const v of prev.values()) start += v

  let fresh = 0, winback = 0, expansion = 0, contraction = 0, churn = 0
  for (const [id, v] of now) {
    const was = prev.get(id) ?? 0
    if (was === 0) {
      if (seenBefore.has(id)) winback += v
      else fresh += v
    } else if (v > was) expansion += v - was
    else if (v < was) contraction += was - v
  }
  for (const [id, was] of prev) if (!now.has(id)) churn += was

  let end = 0
  for (const v of now.values()) end += v

  movement.push({
    month: MONTHS[m],
    start, new: fresh, winback, expansion, contraction, churn, end,
    complexes: now.size,
    usage: rows[m].reduce((s, r) => s + r.u, 0),
  })
  for (const id of now.keys()) seenBefore.add(id)
}

const broken = movement.filter(
  (r) => r.start + r.new + r.winback + r.expansion - r.contraction - r.churn !== r.end,
)
if (broken.length) {
  process.stderr.write(`\n  x movement does not reconcile in ${broken.length} month(s): ${broken.map((r) => r.month).join(', ')}\n\n`)
  process.exit(1)
}

/* ==== 13. adoption, tiers, cohorts ================================== */

const tierOfId = new Map(customers.map((c) => [c.id, c.tier]))
const sidoOfId = new Map(customers.map((c) => [c.id, c.sido]))
const hhOfId = new Map(customers.map((c) => [c.id, c.hh]))
const addressableOfId = new Map(customers.map((c) => [c.id, c.hh >= ADDRESSABLE]))

const tamTier = Object.fromEntries(TIERS.map((t) => [t.id, roster.filter((c) => c.tier === t.id).length]))
const tamSido = {}
for (const c of roster) tamSido[c.sido] = (tamSido[c.sido] ?? 0) + 1
const tamAddressable = roster.filter((c) => c.hh >= ADDRESSABLE).length

/* Contracts active per service per month — the attach rate's numerator. */
const attach = SERVICES.map((s) => ({ id: s.id, per: new Array(T).fill(0) }))
const attachIdx = new Map(attach.map((a, i) => [a.id, i]))
for (const k of contracts) {
  const a = MI.get(k.from)
  const b = k.to === null ? T : MI.get(k.to)
  const slot = attach[attachIdx.get(k.service)].per
  for (let m = a; m < b; m++) slot[m]++
}

const adoption = MONTHS.map((ym, m) => {
  const ids = [...subOf[m].keys()]
  const byTier = Object.fromEntries(TIERS.map((t) => [t.id, 0]))
  const bySido = {}
  let addressable = 0
  let households = 0
  for (const id of ids) {
    byTier[tierOfId.get(id)]++
    const s = sidoOfId.get(id)
    bySido[s] = (bySido[s] ?? 0) + 1
    if (addressableOfId.get(id)) addressable++
    households += hhOfId.get(id)
  }
  return { month: ym, complexes: ids.length, addressable, households, byTier, bySido }
})

/**
 * Contracted complexes per district, at the last month.
 *
 * THE MAP NEEDED THIS AND DID NOT HAVE IT. The first version coloured all 245
 * hexagons from the provincial roll, spreading each 시도's contracted count
 * over its districts by their share of the addressable market — so the grid
 * drew 245 cells carrying sixteen distinct values, and claimed a resolution
 * the data did not have. A reader would have compared two districts in the
 * same province and read a difference that was arithmetic.
 *
 * The count is right here for the taking: a complex id is its district's
 * 법정동코드 and an index, so every billing complex names its own district.
 */
const penByDistrict = new Map()
for (const r of rows[T - 1]) {
  const code = r.i.slice(0, 5)
  penByDistrict.set(code, (penByDistrict.get(code) ?? 0) + 1)
}

/* Revenue per household per tier, at the last month. Finding 1, as a table. */
const lastRows = rows[T - 1]
const tierEcon = TIERS.map((t) => {
  const list = lastRows.filter((r) => tierOfId.get(r.i) === t.id)
  const revenue = list.reduce((s, r) => s + r.s + r.u, 0)
  const households = list.reduce((s, r) => s + hhOfId.get(r.i), 0)
  const floored = list.filter((r) => r.f > 0).length
  return {
    tier: t.id,
    complexes: list.length,
    households,
    revenue,
    perComplex: list.length ? Math.round(revenue / list.length) : 0,
    perHousehold: households ? Math.round((revenue / households) * 10) / 10 : 0,
    floored,
  }
})

/**
 * The rate card, walked up a size ladder. Finding 1, as arithmetic.
 *
 * THE REALISED TIER TABLE BELOW CANNOT CARRY THIS ARGUMENT and an earlier
 * version of this file tried. Per-household revenue averaged over a tier
 * mixes two things: the price structure, and which services those particular
 * complexes happen to hold. The largest tier holds about twenty accounts, so
 * its average moves several tens of won when one complex adds a service —
 * and on one seed the average came out cleanly monotone, on the next it did
 * not. The pattern was real; the evidence was not.
 *
 * So the mechanism is shown where it actually lives: in the rate card. Two
 * reference bundles are priced at a ladder of household counts, holding the
 * bundle FIXED and varying only size. Nothing is sampled, nothing is
 * averaged, and the result is the same on every seed because it is
 * multiplication.
 *
 * The two bundles isolate the two mechanisms:
 *
 *   ENTRY is notice alone, the cheapest thing a complex can buy. Below about
 *   330 households its bill hits the monthly floor, so its effective
 *   per-household rate rises to more than three times list. The floor is
 *   what small accounts actually pay for.
 *
 *   CORE is notice, billing and parking — the modal bundle. Its per-household
 *   rate is flat to 1,000 households and then falls, because that is where
 *   the volume bands start.
 *
 * Together they run from about 500원 per household to about 130원, and both
 * curves fall monotonically. The realised table is then read AGAINST this:
 * where a tier's average departs from the ladder, the cause is bundle mix,
 * which is a different finding and is labelled as one.
 */
const RATE_LADDER = [100, 150, 300, 400, 600, 900, 1200, 2000, 4000, 6000]
const RATE_BUNDLES = [
  { id: 'entry', services: ['notice'] },
  { id: 'core', services: ['notice', 'billing', 'parking'] },
]
const rateCard = RATE_BUNDLES.map((b) => ({
  id: b.id,
  services: b.services,
  /* List rate per household with no discount and no floor — the number the
     price list states, and the one the effective rate departs from. */
  list: b.services.reduce((sum, id) => sum + SVC.get(id).price, 0),
  rows: RATE_LADDER.map((hh) => {
    const perHH = b.services.reduce((sum, id) => sum + perHouseholdMonthly(hh, SVC.get(id).price), 0)
    const topUp = Math.max(0, MIN_MONTHLY - perHH)
    const total = perHH + topUp
    return {
      households: hh,
      monthly: total,
      /* Rounded to a tenth of a won. The point is the ratio, not the coin. */
      perHousehold: Math.round((total / hh) * 10) / 10,
      floored: topUp > 0,
    }
  }),
}))

/* Both ladders must fall. If a rate card change ever makes one rise, the
   page's whole argument inverts and this is where it should stop. */
for (const b of rateCard) {
  for (let i = 1; i < b.rows.length; i++) {
    if (b.rows[i].perHousehold > b.rows[i - 1].perHousehold) {
      process.stderr.write(
        `\n  x rate card '${b.id}' rises from ${b.rows[i - 1].households} to ${b.rows[i].households} households\n\n`,
      )
      process.exit(1)
    }
  }
}

/**
 * Cohort retention, by quarter and in quarters.
 *
 * MONTHLY COHORTS WERE WRONG TWICE OVER. Thirty-six of them across this book
 * is about twenty-five complexes each, and a retention curve resting on
 * twenty-five accounts moves four points when one of them leaves — it is a
 * staircase presented as a trend, and the eye reads the steps as events. The
 * second problem was weight: two grids of thirty-six rows came to 1,433
 * rectangles and about as many SVG titles, which put the page's markup at
 * 264% of its gzip budget. Both problems have the same fix.
 *
 * Quarters give twelve cohorts of about seventy-five, measured at the end of
 * each following quarter. The triangle is an eighth the size and every cell
 * in it rests on three times the accounts.
 *
 * THE TRIANGLE IS RAGGED ON PURPOSE. A cohort that signed in the window's
 * last quarter has one observation and no more; filling the rest with
 * anything at all would invent it.
 */
const QUARTER_OF = (m) => Math.floor((MI.get(MONTHS[m]) - W0) / 3)
const QN = Math.ceil(TW / 3)
const qLabel = (q) => {
  const ym = WIN[q * 3]
  return `${ym.slice(0, 4)}Q${Math.floor((+ym.slice(4) - 1) / 3) + 1}`
}
/** Last simulated month index of quarter q. */
const qEnd = (q) => Math.min(T - 1, W0 + q * 3 + 2)

const COHORT_FLOOR = 8
const cohorts = []
for (let q0 = 0; q0 < QN; q0++) {
  const members = customers.filter((c) => c.start >= W0 && QUARTER_OF(c.start) === q0)
  if (members.length < COHORT_FLOOR) continue
  const base = members.reduce((s, c) => s + (subOf[qEnd(q0)].get(c.id) ?? 0), 0)
  const kept = []
  const value = []
  for (let k = 0; q0 + k < QN; k++) {
    const at = qEnd(q0 + k)
    const alive = members.filter((c) => subOf[at].has(c.id))
    kept.push(Math.round((alive.length / members.length) * 1000) / 10)
    const rev = alive.reduce((s, c) => s + (subOf[at].get(c.id) ?? 0), 0)
    value.push(base ? Math.round((rev / base) * 1000) / 10 : 0)
  }
  cohorts.push({ period: qLabel(q0), index: q0, size: members.length, kept, value })
}

/* Rep attainment: closed new + expansion MRR against quota, per month. */
const repMonthly = new Map(reps.map((r) => [r.id, new Array(T).fill(0)]))
const repOfComplex = new Map(customers.map((c) => [c.id, c.rep]))
for (let m = 0; m < T; m++) {
  const now = subOf[m]
  const prev = m > 0 ? subOf[m - 1] : new Map()
  for (const [id, v] of now) {
    const gain = v - (prev.get(id) ?? 0)
    if (gain > 0) repMonthly.get(repOfComplex.get(id))[m] += gain
  }
}
const repRows = reps.map((r) => {
  const series = repMonthly.get(r.id)
  /* Window only. Crediting a rep with burn-in months would put closes on the
     board that no chart on the page can show them earning. */
  const closed = series.slice(W0).reduce((s, v) => s + v, 0)
  /* Attainment over the months the window can judge: the last twelve. */
  const recent = series.slice(-12).reduce((s, v) => s + v, 0)
  return {
    ...r,
    accounts: customers.filter((c) => c.rep === r.id && spans.get(c.id)[T - 1]).length,
    closed,
    recent,
    attainment: Math.round((recent / (r.quota * 12)) * 1000) / 10,
  }
})

/* ==== 14. pipeline ================================================== */

/**
 * Leads, proposals and the ones that closed. Every won lead points at a real
 * onboarding, so the funnel's bottom row is the same 1,285 complexes the rest
 * of the dataset holds rather than a separate invented number.
 */
const pipeline = []
for (const c of customers) {
  const rnd = streamFor(`won|${c.id}`)
  const cycle = intBetween(rnd, 1, 5)
  pipeline.push({
    complex: c.id, rep: c.rep, opened: MONTHS[Math.max(0, c.start - cycle)],
    closed: MONTHS[c.start], stage: 'won',
  })
}
/* Lost and open leads, drawn against complexes that never signed. */
const nonCustomers = roster.filter((c) => !custById.has(c.id))
const lostTarget = Math.round(customers.length * 1.85)
{
  const rnd = streamFor('lost|pool')
  for (const c of shuffled(rnd, nonCustomers).slice(0, lostTarget)) {
    const r2 = streamFor(`lost|${c.id}`)
    const opened = intBetween(r2, 0, T - 1)
    const cycle = intBetween(r2, 1, 6)
    const done = opened + cycle
    pipeline.push({
      complex: c.id, rep: repOfDistrict.get(c.code), opened: MONTHS[opened],
      closed: done < T ? MONTHS[done] : null,
      stage: done < T ? 'lost' : 'open',
    })
  }
}

/* Published pipeline is the window's. A lead that opened and closed inside
   the burn-in is history the funnel cannot draw; one still open at the
   window's start is carried, because it is on the board. */
const inWindow = (p) => (p.closed ?? TO) >= FROM
const pipelineOut = pipeline.filter(inWindow)
const pipelineDropped = pipeline.length - pipelineOut.length

/* ==== 15. emit ====================================================== */

/* Emptied rather than deleted, and compared against the WINDOW rather than
   the simulation: a burn-in month's file must not survive a change to PRE,
   and MI still knows those months. */
const winSet = new Set(WIN)
for (const f of readdirSync(SERIES_DIR).filter((n) => n.endsWith('.json'))) {
  if (!winSet.has(f.replace('.json', ''))) writeFileSync(join(SERIES_DIR, f), '[]', 'utf8')
}
let seriesBytes = 0
WIN.forEach((ym, i) => {
  const json = JSON.stringify(rows[W0 + i])
  seriesBytes += Buffer.byteLength(json)
  writeFileSync(join(SERIES_DIR, `${ym}.json`), json, 'utf8')
})

/* Contracts are NOT windowed. A contract signed during the burn-in is still
   the contract the window's revenue is billed under, and clipping its start
   date to the window's first month would make every pre-window account look
   like it signed in ${FROM}. The dates are simply outside the window, which
   is the honest shape: `check:bi` joins on them rather than assuming they
   fall inside. */
const contractsJson = JSON.stringify(
  contracts.map((k) => ({ i: k.complex, k: k.service, f: k.from, t: k.to, s: k.setup, r: k.rep })),
)
writeFileSync(join(OUT_DIR, 'contracts.json'), contractsJson, 'utf8')
const pipelineJson = JSON.stringify(
  pipelineOut.map((p) => ({ i: p.complex, r: p.rep, o: p.opened, c: p.closed, s: p.stage })),
)
writeFileSync(join(OUT_DIR, 'pipeline.json'), pipelineJson, 'utf8')

const movementOut = movement.slice(W0)
const adoptionOut = adoption.slice(W0)
const last = { ...movementOut[TW - 1], addressableCount: adoptionOut[TW - 1].addressable }
const first = movementOut[0]
const totalRows = rows.slice(W0).reduce((s, l) => s + l.length, 0)
const preWindow = customers.filter((c) => c.start < W0).length
const sum = (list, key) => list.reduce((s, r) => s + r[key], 0)
const nf = (v) => v.toLocaleString('en-US')
const j = (v) => JSON.stringify(v)

const ts = `/**
 * The invented half of the revenue dashboard.
 *
 * GENERATED by scripts/build-bi.mjs — do not hand-edit.
 *
 * NONE OF THIS IS REAL. The complexes it refers to are (lib/bi.roster.data.ts
 * — real names, real districts, real completion years, estimated household
 * counts) but no contract, price, invoice, cancellation or salesperson below
 * corresponds to anything that happened. What an apartment management app
 * charges is commercial information with no public form, so a dashboard on
 * this subject either invents its revenue or does not exist; this one invents
 * it, from seed '${SEED}', and every page that draws from this file has to
 * say so where a reader will see it.
 *
 * WHAT IS REAL IS THE DENOMINATOR. Penetration is
 * ${nf(last.complexes)} contracted complexes out of ${nf(roster.length)} filed with
 * 국토교통부 — ${((last.complexes / roster.length) * 100).toFixed(2)}% — and against the
 * ${nf(tamAddressable)} large enough to have a management office,
 * ${((last.addressableCount / tamAddressable) * 100).toFixed(2)}%. Those two
 * differ by a factor of about two and the dashboard shows both, because the
 * first understates the product and the second hides how much of the country
 * it cannot reach.
 *
 * TWO FINDINGS ARE DESIGNED IN. They are not discoveries and the page says
 * so; they are here because a dashboard that cannot be read wrong cannot
 * demonstrate reading it right.
 *
 *   1  PER-HOUSEHOLD PRICE RUNS BACKWARDS TO PRICE PER COMPLEX. Two ordinary
 *      terms do it — a marginal volume discount above 1,000 households, and a
 *      ${nf(MIN_MONTHLY)}원 monthly floor. Held to one fixed bundle and walked up a
 *      size ladder (BI_RATE_CARD), the cheapest bundle costs
 *      ${rateCard[0].rows[0].perHousehold}원 per household at ${rateCard[0].rows[0].households} households and
 *      ${rateCard[0].rows[rateCard[0].rows.length - 1].perHousehold}원 at ${rateCard[0].rows[rateCard[0].rows.length - 1].households}. A revenue-by-tier bar chart and a
 *      revenue-per-household bar chart are the same data and give opposite
 *      instructions to a sales manager.
 *
 *      THIS IS ARGUED FROM THE RATE CARD, NOT FROM THE REALISED AVERAGES, and
 *      an earlier version of this file got that wrong. Averaging per-household
 *      revenue over a tier mixes the price structure with which services those
 *      complexes happen to hold; the largest tier has about
 *      ${nf(tierEcon.find((t) => t.tier === 'xlarge')?.complexes ?? 0)} accounts, and on one seed its average came out
 *      cleanly monotone while on the next it did not. The pattern was real and
 *      the evidence was a coincidence. BI_TIER_ECONOMICS still publishes the
 *      realised numbers, with the account count beside each one, and is meant
 *      to be read against the ladder rather than in place of it.
 *
 *   2  MRR RISES EVERY MONTH WHILE COHORTS DECAY. Total subscription MRR goes
 *      from ${nf(first.end)}원 to ${nf(last.end)}원 across ${TW} months
 *      without a single down month, and cumulative churn over the same window
 *      is ${nf(sum(movementOut, 'churn'))}원. New business covers
 *      it. The headline line cannot show that; MOVEMENT and COHORTS can.
 *
 * MRR IS SUBSCRIPTION ONLY. Usage — votes held, SMS fallbacks sent — is
 * reported separately and is ${((sum(movementOut, 'usage') / (sum(movementOut, 'usage') + sum(movementOut, 'end'))) * 100).toFixed(1)}%
 * of total billings. Folding it into MRR would make the movement identity
 * below unreconcilable and the growth rate a function of the holiday
 * calendar.
 *
 * SUBSCRIPTION IS A STEP FUNCTION and usage is not. A per-household fee times
 * a household count that does not change is the same number every month until
 * the contract changes; \`pnpm check:bi\` asserts it never drifts. Usage
 * carries an AR(1) with phi ${AR_PHI} and named seasonality only — resident
 * council elections in November and December, 명절 visitor traffic, moving
 * season SMS. Nothing seasonal was added that a cause could not be given for.
 *
 * Per-complex monthly rows are not here: ${nf(totalRows)} of them are
 * ${nf(Math.round(seriesBytes / 1024))} KB under public/data/bi/series/, one file per
 * month. Contracts (${nf(contracts.length)}) and the pipeline
 * (${nf(pipelineOut.length)}) are beside them.
 */

export type BillingModel = 'perHH' | 'perComplex' | 'perEvent' | 'perUse'

export type Service = {
  readonly id: string
  readonly model: BillingModel
  /** KRW. Per household per month, per complex per month, or per unit. */
  readonly price: number
  /** Households below which the service has nothing to do. */
  readonly minHouseholds?: number
  /** Completion year from which the service applies. */
  readonly minYear?: number
  /** Service that must already be held. A hard dependency. */
  readonly needs?: string
  /** One-off installation, as a range. */
  readonly setup?: readonly [number, number]
}

/** The window every series below covers, inclusive. */
export const BI_WINDOW = { from: '${FROM}', to: '${TO}', months: ${TW} } as const
export const BI_MONTHS: readonly string[] = ${j(WIN)}

/** The seed. Rerunning build-bi.mjs with it reproduces every number here. */
export const BI_SEED = '${SEED}'

export const BI_SERVICES: readonly Service[] = [
${SERVICES.map((s) => {
  const bits = [`id: '${s.id}'`, `model: '${s.model}'`, `price: ${s.price}`]
  if (s.minHouseholds) bits.push(`minHouseholds: ${s.minHouseholds}`)
  if (s.minYear) bits.push(`minYear: ${s.minYear}`)
  if (s.needs) bits.push(`needs: '${s.needs}'`)
  if (s.setup) bits.push(`setup: [${s.setup.join(', ')}]`)
  return `  { ${bits.join(', ')} },`
}).join('\n')}
]

/**
 * The volume discount, on marginal bands. The first 1,000 households of a
 * 3,000-household complex pay full rate.
 */
export const BI_VOLUME_BANDS: readonly { readonly upTo: number; readonly rate: number }[] = [
${VOLUME_BANDS.map((b) => `  { upTo: ${b.upTo === Infinity ? 'Infinity' : b.upTo}, rate: ${b.rate} },`).join('\n')}
]

/** Monthly floor across a complex's per-household services, in KRW. */
export const BI_MIN_MONTHLY = ${MIN_MONTHLY}

export type MovementRow = {
  readonly month: string
  /** Subscription MRR at the start of the month, in KRW. */
  readonly start: number
  readonly new: number
  readonly winback: number
  readonly expansion: number
  readonly contraction: number
  readonly churn: number
  readonly end: number
  /** Complexes billing anything this month. */
  readonly complexes: number
  /** Usage billings this month. NOT part of MRR. */
  readonly usage: number
}

/**
 * The movement waterfall. \`end === start + new + winback + expansion -
 * contraction - churn\` holds in all ${T} rows, and \`pnpm check:bi\`
 * recomputes both sides from public/data/bi/series/ to prove it. A revenue
 * table whose movements do not reconcile is a revenue table with a bug
 * somewhere upstream of the chart, and it is the commonest way a real BI
 * dashboard reports a wrong number confidently.
 */
export const BI_MOVEMENT: readonly MovementRow[] = [
${movementOut
  .map(
    (r) =>
      `  { month: '${r.month}', start: ${r.start}, new: ${r.new}, winback: ${r.winback},` +
      ` expansion: ${r.expansion}, contraction: ${r.contraction}, churn: ${r.churn},` +
      ` end: ${r.end}, complexes: ${r.complexes}, usage: ${r.usage} },`,
  )
  .join('\n')}
]

export type AdoptionRow = {
  readonly month: string
  readonly complexes: number
  /** Of those, at or above the addressable household floor. */
  readonly addressable: number
  /** Households under contract. */
  readonly households: number
  readonly byTier: Readonly<Record<string, number>>
  readonly bySido: Readonly<Record<string, number>>
}

/**
 * Penetration over time. The numerators are invented; every denominator
 * below is counted from the filings.
 */
export const BI_ADOPTION: readonly AdoptionRow[] = [
${adoptionOut
  .map(
    (r) =>
      `  { month: '${r.month}', complexes: ${r.complexes}, addressable: ${r.addressable},` +
      ` households: ${r.households}, byTier: ${j(r.byTier)}, bySido: ${j(r.bySido)} },`,
  )
  .join('\n')}
]

/** The market, counted. Denominators for everything in BI_ADOPTION. */
export const BI_TAM = {
  complexes: ${roster.length},
  addressable: ${tamAddressable},
  byTier: ${j(tamTier)},
  bySido: ${j(tamSido)},
} as const

/**
 * Active contracts per service per month — the attach rate's numerator.
 * Divided by BI_ADOPTION's \`complexes\`, not by BI_TAM: this measures what
 * customers buy, not what the market has adopted.
 */
export const BI_ATTACH: Readonly<Record<string, readonly number[]>> = {
${attach.map((a) => `  ${a.id}: ${j(a.per.slice(W0))},`).join('\n')}
}

export type TierEconomics = {
  readonly tier: string
  readonly complexes: number
  readonly households: number
  /** Subscription plus usage, final month, KRW. */
  readonly revenue: number
  readonly perComplex: number
  readonly perHousehold: number
  /** Accounts where the monthly floor topped the bill up. */
  readonly floored: number
}

/**
 * Realised economics per size tier, final month.
 *
 * NOT the evidence for finding 1 — BI_RATE_CARD is. This is what the tiers
 * actually billed, which is the price structure times whatever bundle those
 * particular complexes hold, and \`complexes\` is published beside every row
 * because the top tiers are thin enough that their averages move on one
 * account changing its mind. Read against the ladder: a tier sitting above it
 * is buying more than the reference bundle, below it is buying less.
 */
export const BI_TIER_ECONOMICS: readonly TierEconomics[] = [
${tierEcon
  .map(
    (t) =>
      `  { tier: '${t.tier}', complexes: ${t.complexes}, households: ${t.households},` +
      ` revenue: ${t.revenue}, perComplex: ${t.perComplex}, perHousehold: ${t.perHousehold},` +
      ` floored: ${t.floored} },`,
  )
  .join('\n')}
]

export type RateCardRow = {
  readonly households: number
  /** Monthly subscription for this bundle at this size, KRW. */
  readonly monthly: number
  readonly perHousehold: number
  /** True where the monthly floor, not the rate card, set the price. */
  readonly floored: boolean
}

export type RateCardBundle = {
  readonly id: string
  readonly services: readonly string[]
  /** Sum of list prices per household, before discount and before floor. */
  readonly list: number
  readonly rows: readonly RateCardRow[]
}

/**
 * Finding 1, as arithmetic rather than as an average.
 *
 * The bundle is held fixed and only household count varies, so nothing here
 * depends on which complexes happened to sign or what they happened to buy.
 * Both ladders fall monotonically and build-bi.mjs refuses to write this file
 * if either one rises.
 *
 * \`entry\` shows the monthly floor: below about 330 households the floor sets
 * the price, so the effective per-household rate is
 * ${(rateCard[0].rows[0].perHousehold / rateCard[0].list).toFixed(1)}x list at
 * ${rateCard[0].rows[0].households} households and reaches list only past
 * ${rateCard[0].rows.find((r) => !r.floored)?.households ?? '?'}.
 * \`core\` shows the volume bands: flat to 1,000 households, then falling to
 * ${rateCard[1].rows[rateCard[1].rows.length - 1].perHousehold}원 at
 * ${rateCard[1].rows[rateCard[1].rows.length - 1].households}.
 *
 * BI_TIER_ECONOMICS is read against this, not instead of it. Where a tier's
 * realised average departs from the ladder the cause is bundle mix — a
 * different finding, and one that needs its own sample size before it is
 * worth stating.
 */
export const BI_RATE_CARD: readonly RateCardBundle[] = [
${rateCard
  .map(
    (b) =>
      `  {\n    id: '${b.id}', services: ${j(b.services)}, list: ${b.list},\n    rows: [\n` +
      b.rows
        .map(
          (r) =>
            `      { households: ${r.households}, monthly: ${r.monthly},` +
            ` perHousehold: ${r.perHousehold}, floored: ${r.floored} },`,
        )
        .join('\n') +
      '\n    ],\n  },',
  )
  .join('\n')}
]

export type DistrictPenetration = {
  readonly code: string
  /** Complexes billing in the final month. */
  readonly signed: number
}

/**
 * Per-district contracted complexes, final month. The map's numerator.
 *
 * Only districts with at least one are listed; the rest are absent and the
 * map reads them as zero rather than as missing — a district with an
 * addressable market and no customers is a fact about the sales coverage, and
 * the hexagon has to show it. Districts with no addressable complexes at all
 * are a different class and get the neutral fill.
 *
 * The denominator is in lib/bi.roster.data.ts, counted from the filings.
 */
export const BI_DISTRICT_PENETRATION: readonly DistrictPenetration[] = [
${[...penByDistrict.entries()]
  .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  .map(([code, n]) => `  { code: '${code}', signed: ${n} },`)
  .join('\n')}
]

export type Cohort = {
  /** Onboarding quarter, e.g. 2024Q2. */
  readonly period: string
  /** Its index in the window's quarters, 0 first. */
  readonly index: number
  readonly size: number
  /** Share still billing at the end of each following quarter. */
  readonly kept: readonly number[]
  /** Subscription revenue against the cohort's own first quarter. */
  readonly value: readonly number[]
}

/**
 * Finding 2's other half. \`value\` can exceed 100 while \`kept\` falls —
 * that is expansion inside the survivors paying for the ones who left, and
 * it is the number a single MRR line cannot show.
 *
 * Quarterly, not monthly. Thirty-six monthly cohorts of about twenty-five
 * accounts each gave curves that stepped four points whenever one complex
 * left — a staircase read as a trend — and two grids of them came to 1,433
 * marks, which put this route at 264% of its markup budget. Twelve quarters
 * of about seventy-five fix both.
 *
 * Cohorts smaller than ${COHORT_FLOOR} complexes are still not published.
 */
export const BI_COHORTS: readonly Cohort[] = [
${cohorts
  .map(
    (c) =>
      `  { period: '${c.period}', index: ${c.index}, size: ${c.size},` +
      ` kept: ${j(c.kept)}, value: ${j(c.value)} },`,
  )
  .join('\n')}
]

export type Rep = {
  readonly id: string
  readonly team: string
  readonly region: string
  readonly rank: string
  /** Monthly new-and-expansion MRR target, KRW. */
  readonly quota: number
  /** Complexes billing in the final month. */
  readonly accounts: number
  /** New and expansion MRR closed across the window. */
  readonly closed: number
  /** The same, last twelve months. */
  readonly recent: number
  /** \`recent\` against twelve months of quota, as a percentage. */
  readonly attainment: number
}

/** ${reps.length} people, ${teams.length} teams, ${REGIONS.length} regions. Ordinary shape, invented. */
export const BI_REPS: readonly Rep[] = [
${repRows
  .map(
    (r) =>
      `  { id: '${r.id}', team: '${r.team}', region: '${r.region}', rank: '${r.rank}',` +
      ` quota: ${r.quota}, accounts: ${r.accounts}, closed: ${r.closed},` +
      ` recent: ${r.recent}, attainment: ${r.attainment} },`,
  )
  .join('\n')}
]

export const BI_REGIONS: readonly { readonly id: string; readonly sido: readonly string[] }[] = [
${REGIONS.map((r) => `  { id: '${r.id}', sido: ${j(r.sido)} },`).join('\n')}
]

/** What was generated, and how big it is on disk. */
export const BI_INTAKE = {
  customers: ${customers.length},
  /** Of those, signed during the burn-in — their start date is off-window. */
  preWindow: ${preWindow},
  /** Window-born complexes in cohorts too small to publish a curve for. */
  cohortsDropped: ${customers.filter((c) => c.start >= W0).length - cohorts.reduce((a, c) => a + c.size, 0)},
  /** Quarters in the window. Cohorts are quarterly. */
  quarters: ${QN},
  /** Leads decided entirely inside the burn-in. */
  pipelineDropped: ${pipelineDropped},
  contracts: ${contracts.length},
  seriesRows: ${totalRows},
  pipeline: ${pipelineOut.length},
  reps: ${reps.length},
  teams: ${teams.length},
  seriesBytes: ${seriesBytes},
  contractsBytes: ${Buffer.byteLength(contractsJson)},
  pipelineBytes: ${Buffer.byteLength(pipelineJson)},
} as const

/** Churn and seasonality parameters, published so the shape can be argued. */
export const BI_DYNAMICS = {
  churnBase: ${CHURN_BASE},
  churnSelfMultiplier: ${CHURN_SELF_MULT},
  churnSeason: ${j(CHURN_SEASON)},
  winbackRate: ${WINBACK_RATE},
  arPhi: ${AR_PHI},
  arSigma: ${AR_SIGMA},
  season: ${j(SEASON)},
  cohortFloor: ${COHORT_FLOOR},
} as const
`

writeFileSync(OUT_TS, ts, 'utf8')

const pct = (a, b) => `${((a / b) * 100).toFixed(2)}%`
const won = pipeline.filter((p) => p.stage === 'won').length
process.stdout.write(`
  REVENUE — invented, on a real roster
  ${'-'.repeat(70)}
  seed        ${SEED}
  window      ${FROM} .. ${TO} (${TW} published, ${PRE} burn-in)
  customers   ${nf(customers.length)} ever - ${nf(last.complexes)} billing in ${TO}
  penetration ${pct(last.complexes, roster.length)} of ${nf(roster.length)} filed - ${pct(last.addressableCount, tamAddressable)} of ${nf(tamAddressable)} addressable
  contracts   ${nf(contracts.length)} - series rows ${nf(totalRows)} - pipeline ${nf(pipelineOut.length)} (won ${nf(won)}, ${nf(pipelineDropped)} pre-window dropped)
  org         ${reps.length} reps - ${teams.length} teams - ${REGIONS.length} regions
  ${'-'.repeat(70)}
  MRR         ${nf(first.end)} -> ${nf(last.end)} (x${(last.end / Math.max(1, first.end)).toFixed(2)})
  movement    reconciles in ${T}/${T} simulated months
  churned     ${nf(sum(movementOut, 'churn'))} cumulative in window
  usage       ${pct(sum(movementOut, 'usage'), sum(movementOut, 'usage') + sum(movementOut, 'end'))} of billings
  ${'-'.repeat(70)}
  RATE CARD — bundle fixed, size varying. This is finding 1's evidence.
${rateCard.map((b) => `  ${b.id.padEnd(6)} list ${String(b.list).padStart(4)}/hh  ` +
  b.rows.map((r) => `${nf(r.households)}:${r.perHousehold}${r.floored ? '*' : ''}`).join('  ')).join('\n')}
  * = the monthly floor set the price, not the rate card
  ${'-'.repeat(70)}
  REALISED — price structure times bundle mix. Thin tiers move on one account.
  tier         ${'n'.padStart(5)}${'per complex'.padStart(14)}${'per household'.padStart(16)}${'floored'.padStart(9)}
${tierEcon.map((t) => `  ${t.tier.padEnd(11)} ${String(t.complexes).padStart(5)} ${nf(t.perComplex).padStart(13)} ${String(t.perHousehold).padStart(15)} ${String(t.floored).padStart(8)}`).join('\n')}
  ${'-'.repeat(70)}
  wrote lib/bi.data.ts, contracts.json, pipeline.json and ${TW} files in public/data/bi/series/ (${nf(Math.round(seriesBytes / 1024))} KB)
`)

/**
 * The series, without a chart.
 *
 * These 36-character rows are the whole review surface for the generator. A
 * seasonality that is too strong, a churn spike in the wrong month, a step
 * function that is quietly drifting or an attach curve that goes backwards
 * are all visible here, and none of them would be visible in a table of
 * totals. Scaled per row: each line uses its own min and max, so the shape
 * is comparable across rows and the magnitude is not.
 */
const BLOCKS = '▁▂▃▄▅▆▇█'
const spark = (xs) => {
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  if (hi === lo) return BLOCKS[0].repeat(xs.length)
  return xs.map((v) => BLOCKS[Math.min(7, Math.floor(((v - lo) / (hi - lo)) * 8))]).join('')
}
const row = (label, xs, fmt = nf) =>
  `  ${label.padEnd(11)} ${spark(xs)}  ${fmt(Math.min(...xs))} .. ${fmt(Math.max(...xs))}`

const usageOut = movementOut.map((r) => r.usage)
const seasonProbe = MONTHS.slice(W0).map((ym, i) => ({ mm: ym.slice(4), v: usageOut[i] }))
const byCalendar = {}
for (const { mm, v } of seasonProbe) (byCalendar[mm] ??= []).push(v)

/* One complex's subscription, to show the step. Chosen as the account with
   the most contract events in the window — the busiest step function there
   is, and therefore the one where drift would hide best. */
const events = new Map()
for (const k of contracts) {
  if (MI.get(k.from) >= W0) events.set(k.complex, (events.get(k.complex) ?? 0) + 1)
}
const busiest = [...events.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]
const stepSeries = movementOut.map((_, i) => subOf[W0 + i].get(busiest?.[0]) ?? 0)

process.stdout.write(`
  THE SERIES, WITHOUT A CHART — ${WIN[0]} .. ${WIN[TW - 1]}, one column per month
  ${'-'.repeat(70)}
  onboarding  ${(() => {
    const bins = new Array(T).fill(0)
    for (const c of customers) bins[c.start]++
    const yr = []
    for (let a = 0; a < T; a += 12) yr.push(bins.slice(a, a + 12).reduce((x, y) => x + y, 0))
    return `by 12-month block, burn-in first: ${yr.join(' / ')}`
  })()}
  ${'-'.repeat(70)}
${row('MRR', movementOut.map((r) => r.end))}
${row('new', movementOut.map((r) => r.new))}
${row('expansion', movementOut.map((r) => r.expansion))}
${row('churn', movementOut.map((r) => r.churn))}
${row('complexes', movementOut.map((r) => r.complexes))}
${row('usage', usageOut)}
  ${'-'.repeat(70)}
  usage by calendar month, averaged over the ${TW / 12} years in the window
  ${Object.keys(byCalendar).sort().map((mm) => mm).join('  ')}
  ${Object.keys(byCalendar).sort().map((mm) => {
    const avg = byCalendar[mm].reduce((a, b) => a + b, 0) / byCalendar[mm].length
    const all = usageOut.reduce((a, b) => a + b, 0) / usageOut.length
    return (avg / all).toFixed(2)
  }).join('  ')}
  ${'-'.repeat(70)}
  attach rate, share of billing complexes
${attach.map((a) => {
  const win = a.per.slice(W0)
  const rates = win.map((v, i) => (adoptionOut[i].complexes ? (v / adoptionOut[i].complexes) * 100 : 0))
  return `  ${a.id.padEnd(11)} ${spark(rates)}  ${rates[0].toFixed(1)}% -> ${rates[TW - 1].toFixed(1)}%`
}).join('\n')}
  ${'-'.repeat(70)}
  the step function - complex ${busiest?.[0] ?? 'none'}, ${busiest?.[1] ?? 0} contract events in window
  ${'-'.repeat(70)}
${row('subscription', stepSeries)}
  distinct levels ${new Set(stepSeries).size} in ${TW} months - a drifting series would show ${TW}
  ${'-'.repeat(70)}
`)

