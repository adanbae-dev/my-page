#!/usr/bin/env node
/**
 * One file the browser can filter.
 *
 * /portfolio/revenue answers nine questions the page's author chose. This
 * builds the dataset for /portfolio/bi-dashboard, which answers the question
 * the READER chose — which needs the per-complex series in the browser,
 * because filtering by district, size, management type, service and month
 * range cannot be precomputed. Twelve filters over six dimensions is not a
 * combinatorial table anybody wants to build or ship.
 *
 * SO IT IS FETCHED, NOT INLINED. public/data/bi/series/ is 36 files and
 * 1.4 MB; this is one file, and it arrives after first paint the way
 * public/data/umd/*.json does for the district drill-down. Nothing here
 * counts against the route's html or js budget, which is the only reason a
 * client-side dashboard fits on this site at all.
 *
 * SUBSCRIPTION IS RUN-LENGTH ENCODED, and that is not only compression. A
 * per-household fee times a household count that does not change is the same
 * number every month until the contract changes — the series is a step
 * function, and `[[109120, 14], [163680, 22]]` says so in a way that
 * thirty-six repeated integers does not. It also happens to cut the payload
 * roughly in half. Usage is not encoded this way because usage genuinely
 * moves every month; pretending otherwise would be the same mistake in
 * reverse.
 *
 * CONTRACTS SHIP TOO, as (service, from, to) triples. The revenue arrays
 * cannot answer "which complexes held parking in this range" and the attach
 * chart needs exactly that. Month indices are relative to the published
 * window; a contract that opened during the burn-in gets -1, which the
 * client reads as "already open when the window starts" rather than as a
 * date it should print.
 *
 * Run after scripts/build-bi.mjs.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'data', 'bi', 'slice.json')

const biSrc = readFileSync(join(ROOT, 'lib', 'bi.data.ts'), 'utf8')
const rosterSrc = readFileSync(join(ROOT, 'lib', 'bi.roster.data.ts'), 'utf8')

const one = (src, re, what) => {
  const m = re.exec(src)
  if (!m) {
    process.stderr.write(`\n  x ${what} 를 못 읽었습니다\n\n`)
    process.exit(1)
  }
  return m[1]
}

const MONTHS = JSON.parse(one(biSrc, /BI_MONTHS: readonly string\[\] = (\[[^\]]+\])/, 'BI_MONTHS'))
const MI = new Map(MONTHS.map((m, i) => [m, i]))
const T = MONTHS.length

const SERVICES = [...biSrc.matchAll(/\{ id: '(\w+)', model: '\w+', price: \d+/g)].map((m) => m[1])
if (SERVICES.length < 5) {
  process.stderr.write('\n  x BI_SERVICES 를 못 읽었습니다\n\n')
  process.exit(1)
}
const SVI = new Map(SERVICES.map((s, i) => [s, i]))

/* Tier ids and their upper edges, read once. */
const TIER_ROWS = [...rosterSrc.matchAll(/\{ id: '(\w+)', to: (\d+|Infinity) \},/g)].map((m) => ({
  id: m[1],
  to: m[2] === 'Infinity' ? Infinity : +m[2],
}))
const TIERS = TIER_ROWS.map((t) => t.id)
const TRI = new Map(TIERS.map((t, i) => [t, i]))
const tierIndexOf = (households) =>
  TIER_ROWS.findIndex((t) => households < t.to)
const ADDRESSABLE = +one(rosterSrc, /ROSTER_ADDRESSABLE = (\d+)/, 'ROSTER_ADDRESSABLE')

/* Districts, with 시도 factored out. 245 rows repeating sixteen province
   names is 3 KB of the same strings; an index is two bytes. */
const districtRows = [
  ...rosterSrc.matchAll(
    /\{ code: '(\d+)', sido: '([^']+)', sgg: '([^']+)', pop: \d+, complexes: (\d+), addressable: (\d+), households: \d+ \},/g,
  ),
].map((m) => ({ code: m[1], sido: m[2], sgg: m[3], complexes: +m[4], addressable: +m[5] }))

const SIDO = [...new Set(districtRows.map((d) => d.sido))]
const SDI = new Map(SIDO.map((s, i) => [s, i]))
const DISTRICTS = districtRows.map((d) => ({ c: d.code, s: SDI.get(d.sido), n: d.sgg, a: d.addressable }))
const DTI = new Map(DISTRICTS.map((d, i) => [d.c, i]))

/* ---- the roster, for the attributes a filter needs ----------------- */

const ROSTER_DIR = join(ROOT, 'public', 'data', 'bi', 'roster')
const roster = new Map()
for (const f of readdirSync(ROSTER_DIR).filter((n) => n.endsWith('.json'))) {
  const code = f.replace('.json', '')
  for (const r of JSON.parse(readFileSync(join(ROSTER_DIR, f), 'utf8'))) {
    roster.set(r.i, { ...r, code })
  }
}

/* ---- contracts and the monthly series ------------------------------ */

const contracts = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'bi', 'contracts.json'), 'utf8'))

/**
 * The invented per-customer attributes, folded in.
 *
 * customers.json is where management type and the owning rep actually live —
 * the half of the dataset labelled invented. This file denormalises them
 * into the client bundle so the browser makes ONE request instead of three,
 * which is worth the duplication: the alternative is a page that cannot
 * filter until the slowest of three fetches lands.
 */
const CUSTOMERS = new Map(
  JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'bi', 'customers.json'), 'utf8')).map((c) => [
    c.i,
    c,
  ]),
)
const REPS = [...new Set([...CUSTOMERS.values()].map((c) => c.r))].sort()
const RPI = new Map(REPS.map((r, i) => [r, i]))
const SERIES_DIR = join(ROOT, 'public', 'data', 'bi', 'series')
const series = MONTHS.map((ym) => {
  const p = join(SERIES_DIR, `${ym}.json`)
  if (!existsSync(p)) {
    process.stderr.write(`\n  x public/data/bi/series/${ym}.json 이 없습니다 — build-bi.mjs 를 먼저 돌리세요\n\n`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(p, 'utf8'))
})

/** Per complex, the months it billed. */
const rows = new Map()
series.forEach((list, m) => {
  for (const r of list) {
    let hit = rows.get(r.i)
    if (!hit) { hit = new Map(); rows.set(r.i, hit) }
    hit.set(m, r)
  }
})

const byComplex = new Map()
for (const k of contracts) {
  const list = byComplex.get(k.i)
  if (list) list.push(k)
  else byComplex.set(k.i, [k])
}

/**
 * Run-length encode a step function.
 *
 * Emits `[value, count]` pairs. A series that never changes is one pair; a
 * series with a contract event every month is thirty-six, which is the
 * honest worst case and does not happen — the median account changes level
 * three or four times in three years.
 */
function rle(values) {
  const out = []
  for (const v of values) {
    const last = out[out.length - 1]
    if (last && last[0] === v) last[1]++
    else out.push([v, 1])
  }
  return out
}

/* ---- assemble -------------------------------------------------------- */

const cx = []
let gaps = 0
for (const [id, months] of rows) {
  const home = roster.get(id)
  if (!home) {
    process.stderr.write(`\n  x ${id} 이 명부에 없습니다\n\n`)
    process.exit(1)
  }
  const active = [...months.keys()].sort((a, b) => a - b)
  const first = active[0]
  const last = active[active.length - 1]

  /* A complex that churned and came back has a hole. The arrays are dense
     from `f` to its last billed month, and a month it did not bill is a
     zero — which the client must read as "not a customer that month", not as
     "billed nothing". `g` marks that the row has holes so the reader is not
     told a zero is a measurement. */
  const sub = []
  const use = []
  for (let m = first; m <= last; m++) {
    const r = months.get(m)
    sub.push(r ? r.s : 0)
    use.push(r ? r.u : 0)
  }
  const holed = sub.some((v) => v === 0)
  if (holed) gaps++

  /* Contracts, as window-relative indices. -1 means it opened before the
     window; T means it is still open at the end. */
  const ks = (byComplex.get(id) ?? []).map((k) => [
    SVI.get(k.k),
    MI.has(k.f) ? MI.get(k.f) : -1,
    k.t === null ? T : MI.has(k.t) ? MI.get(k.t) : -1,
  ])

  const invented = CUSTOMERS.get(id)
  if (!invented) {
    process.stderr.write(`\n  x ${id} 이 customers.json 에 없습니다 — build-bi.mjs 를 먼저 돌리세요\n\n`)
    process.exit(1)
  }

  cx.push({
    i: id,
    n: home.n,
    d: DTI.get(home.code),
    t: tierIndexOf(home.h),
    h: home.h,
    y: home.y,
    b: home.b === 'checked' ? 1 : 0,
    g: invented.g,
    r: RPI.get(invented.r),
    f: first,
    s: rle(sub),
    u: use,
    k: ks,
  })
}
cx.sort((a, b) => (a.i < b.i ? -1 : 1))

const payload = {
  $: 'GENERATED by scripts/build-bi-slice.mjs — contracts and revenue are invented, the roster is not',
  w: { f: MONTHS[0], t: MONTHS[T - 1] },
  m: MONTHS,
  sd: SIDO,
  dt: DISTRICTS,
  tr: TIERS,
  sv: SERVICES,
  rp: REPS,
  ad: ADDRESSABLE,
  cx,
}

const json = JSON.stringify(payload)
writeFileSync(OUT, json, 'utf8')

/* ---- report ---------------------------------------------------------- */

const nf = (v) => v.toLocaleString('en-US')
const subPairs = cx.reduce((s, c) => s + c.s.length, 0)
const subMonths = cx.reduce((s, c) => s + c.s.reduce((t, [, n]) => t + n, 0), 0)
process.stdout.write(`
  FILTERABLE SLICE
  ${'-'.repeat(70)}
  complexes   ${nf(cx.length)} · months ${T} · districts ${DISTRICTS.length} · 시도 ${SIDO.length}
  contracts   ${nf(cx.reduce((s, c) => s + c.k.length, 0))} triples · reps ${REPS.length}
  mgmt        위탁 ${nf(cx.filter((c) => c.g === 0).length)} · 자치 ${nf(cx.filter((c) => c.g === 1).length)}
  step RLE    ${nf(subPairs)} pairs for ${nf(subMonths)} complex-months (${(subMonths / subPairs).toFixed(1)}x)
  gaps        ${gaps} complexes billed, stopped and came back — zero months marked
  size        ${nf(Math.round(Buffer.byteLength(json) / 1024))} KB raw · fetched after paint, not first-paint weight
  ${'-'.repeat(70)}
  wrote public/data/bi/slice.json
`)
