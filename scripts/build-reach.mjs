#!/usr/bin/env node
/**
 * 중개사무소 소재지 -> lib/reach.data.ts.
 *
 * THE QUESTION THIS PAGE WAS SUPPOSED TO ANSWER was where brokerage flows:
 * every 매매 filing names the district its 중개사무소 sits in, so the cache
 * holds a complete origin-destination matrix for a year of apartment sales.
 * The obvious figure is arcs on a map.
 *
 * THE DATA SAYS DO NOT DRAW IT. 91.5% of brokerage legs are handled by an
 * office in the district the property is in, the median district's share is
 * 92.5%, and the 8.4% that does cross a boundary has a median distance of
 * 9.3 km — the next district over. There are 5,032 distinct external pairs
 * and the ten thickest of them carry 7.9% of the external volume. Arcs would
 * be five thousand lines drawn to show eight percent of a phenomenon that is
 * mostly adjacency, and the reader would come away thinking they had seen
 * flows. So the page publishes the null result and the four exceptions that
 * survive it, and this file computes exactly that.
 *
 * A LEG, NOT A DEAL, is the unit. 중개사무소 소재지 is comma separated when
 * more than one district is involved, and each entry is one leg. That matters
 * for the denominator: counting deals would credit a co-brokered sale to
 * whichever office was listed first.
 *
 * AND THE FIELD ALL BUT NEVER REPEATS A DISTRICT. Of the filings with two
 * entries, all but a dozen name two DIFFERENT 시군구. A field recording
 * offices would show same-district pairs in bulk, because co-brokerage
 * between two offices on the same street is ordinary. So what it records is
 * the set of districts involved, and the share below is the rate at which
 * co-brokerage crosses a district line rather than the co-brokerage rate.
 *
 * THE COUNTS ARE PUBLISHED, NOT THE SHARE, and that is a correction. The
 * complement is 12/30,329 = 0.04%, which rounds to 100.0% at one decimal —
 * and a 100 read off a rounded percentage was written up as "not one of
 * them". Counts cannot round.
 *
 * DISTANCE comes from district centroids, and those come from the committed
 * 읍면동 centroid table averaged per district. The table is an older
 * administrative edition than the code table, so the 27 districts the API
 * moved to 시도코드 12 are looked up under their pre-merger prefixes — the
 * same remap scripts/rtms/lawd.json records, listed here rather than inferred
 * because a wrong entry would silently produce a plausible distance.
 *
 * Run after `node scripts/fetch-rtms.mjs trade <from> <to>`.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, '.rtms-cache', 'trade')
const OUT = join(ROOT, 'lib', 'reach.data.ts')

/** Legs below which a district's share is noise. Same floor, same reason, as
    /portfolio/direct: a district resting on forty legs and one resting on
    three thousand would draw the same dot. */
const FLOOR = 200

/** How many of the low end the page tabulates. */
const LOW_ROWS = 12

/** Distance bands, in km, for the external legs. */
const BANDS = [10, 20, 50, 100, 200]

const nfc = (v) => String(v ?? '').normalize('NFC').trim()
const K = (s) => nfc(s).replace(/\s+/g, '')
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d

/* --- the code table, and the names the API writes ------------------- */

const ABBR = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  전남광주통합특별시: '전남광주', 대전광역시: '대전', 울산광역시: '울산',
  세종특별자치시: '세종', 경기도: '경기', 충청북도: '충북', 충청남도: '충남',
  경상북도: '경북', 경상남도: '경남', 제주특별자치도: '제주',
  강원특별자치도: '강원', 전북특별자치도: '전북',
}
/* 전남광주통합특별시 is still written 광주 and 전남 by a few hundred filing
   offices — 0.08% of the region's legs. scripts/check-coverage.mjs measures
   that split; here both spellings simply resolve. */
const EXTRA = { 전남광주통합특별시: ['광주', '전남'] }
/* 세종 writes only the province name for its single district. */
const ALIAS = { 세종: '36110' }

const lawd = JSON.parse(readFileSync(join(ROOT, 'scripts', 'rtms', 'lawd.json'), 'utf8'))
const info = new Map(lawd.map((r) => [r.lawd, r]))
const codeOf = new Map()
for (const r of lawd) {
  for (const a of [ABBR[r.sido], ...(EXTRA[r.sido] ?? [])]) {
    if (!a) throw new Error(`시도 약칭을 모릅니다: ${r.sido}`)
    codeOf.set(K(a + r.sgg), r.lawd)
  }
}
for (const [name, code] of Object.entries(ALIAS)) codeOf.set(K(name), code)

/* --- centroids ------------------------------------------------------ */

/** 12xxx -> the prefix the boundary edition files that district under. */
const OLD_PREFIX = {
  12110: '46110', 12130: '46130', 12150: '46150', 12170: '46170', 12190: '46230',
  12210: '29110', 12240: '29140', 12270: '29155', 12300: '29170', 12330: '29200',
  12710: '46710', 12720: '46720', 12730: '46730', 12740: '46770', 12750: '46780',
  12760: '46790', 12770: '46800', 12780: '46810', 12790: '46820', 12800: '46830',
  12810: '46840', 12820: '46860', 12830: '46870', 12840: '46880', 12850: '46890',
  12860: '46900', 12870: '46910',
}

const acc = new Map()
for (const l of readFileSync(join(ROOT, 'scripts', 'rtms', 'umd.centroids.csv'), 'utf8')
  .trim()
  .split('\n')
  .slice(1)) {
  const [bjcd, , lon, lat] = l.split(',')
  const p = bjcd.slice(0, 5)
  const a = acc.get(p) ?? { n: 0, lon: 0, lat: 0 }
  a.n++
  a.lon += Number(lon)
  a.lat += Number(lat)
  acc.set(p, a)
}
const centroid = new Map()
for (const r of lawd) {
  const a = acc.get(OLD_PREFIX[r.lawd] ?? r.lawd)
  if (a) centroid.set(r.lawd, { lon: a.lon / a.n, lat: a.lat / a.n })
}
if (centroid.size !== lawd.length) {
  process.stderr.write(
    `\n  x 중심점이 ${centroid.size}/${lawd.length} 곳뿐입니다 —` +
      ` OLD_PREFIX 가 경계 자료 판과 맞는지 확인하세요\n\n`,
  )
  process.exit(1)
}
const km = (a, b) => {
  const R = 6371
  const t = Math.PI / 180
  const dLat = (b.lat - a.lat) * t
  const dLon = (b.lon - a.lon) * t
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/* --- read ----------------------------------------------------------- */

const files = readdirSync(CACHE).filter((f) => f.endsWith('.json'))
if (!files.length) {
  process.stderr.write('\n  x .rtms-cache/trade 가 비었습니다\n\n')
  process.exit(1)
}
const months = [...new Set(files.map((f) => f.replace('.json', '').split('-')[1]))].sort()

const flow = new Map() // `${dest}\t${origin}` -> legs
const total = new Map() // dest -> legs
const dists = []
let records = 0
let legs = 0
let matched = 0
let coPairs = 0
let coCross = 0
const unmatched = new Map()

for (const f of files) {
  const [dest] = f.replace('.json', '').split('-')
  if (!info.has(dest)) continue
  for (const r of JSON.parse(readFileSync(join(CACHE, f), 'utf8'))) {
    const raw = nfc(r.estateAgentSggNm)
    if (!raw) continue // 직거래 has no office
    records++
    const parts = raw.split(',').map(nfc).filter(Boolean)
    const codes = []
    for (const p of parts) {
      legs++
      const c = codeOf.get(K(p))
      if (!c) {
        unmatched.set(p, (unmatched.get(p) ?? 0) + 1)
        continue
      }
      matched++
      codes.push(c)
      total.set(dest, (total.get(dest) ?? 0) + 1)
      const k = `${dest}\t${c}`
      flow.set(k, (flow.get(k) ?? 0) + 1)
      if (c !== dest) dists.push(km(centroid.get(dest), centroid.get(c)))
    }
    if (parts.length > 1 && codes.length === parts.length) {
      coPairs++
      if (new Set(codes).size > 1) coCross++
    }
  }
}

/* --- per district --------------------------------------------------- */

const rows = []
let belowFloor = 0
for (const r of lawd) {
  const n = total.get(r.lawd) ?? 0
  if (n < FLOOR) {
    if (n > 0) belowFloor++
    continue
  }
  rows.push({ ...r, legs: n, rate: round((100 * (flow.get(`${r.lawd}\t${r.lawd}`) ?? 0)) / n) })
}
rows.sort((a, b) => a.rate - b.rate)
const noLegs = lawd.filter((r) => (total.get(r.lawd) ?? 0) === 0).length

const sortedRates = rows.map((r) => r.rate)
const q = (xs, p) => xs[Math.min(xs.length - 1, Math.floor(xs.length * p))]

/** The thickest external inflow into a district, and how far it came. */
function topOrigin(dest) {
  let best = null
  for (const [k, v] of flow) {
    const [d, o] = k.split('\t')
    if (d !== dest || o === dest) continue
    if (!best || v > best.legs) best = { code: o, legs: v }
  }
  if (!best) return null
  const t = info.get(best.code)
  return {
    sgg: t.sgg,
    legs: best.legs,
    km: Math.round(km(centroid.get(dest), centroid.get(best.code))),
  }
}

const low = rows.slice(0, LOW_ROWS).map((r) => {
  const o = topOrigin(r.lawd)
  return {
    sido: r.sido,
    sgg: r.sgg,
    rate: r.rate,
    legs: r.legs,
    origin: o?.sgg ?? '',
    originLegs: o?.legs ?? 0,
    originShare: o ? round((100 * o.legs) / r.legs) : 0,
    originKm: o?.km ?? 0,
  }
})

/* --- flows ---------------------------------------------------------- */

const external = [...flow]
  .filter(([k]) => {
    const [d, o] = k.split('\t')
    return d !== o
  })
  .sort((a, b) => b[1] - a[1])
const externalLegs = external.reduce((a, b) => a + b[1], 0)
const topTen = external.slice(0, 10).reduce((a, b) => a + b[1], 0)

const selfLegs = matched - externalLegs

/* --- distance ------------------------------------------------------- */

dists.sort((a, b) => a - b)
const bands = BANDS.map((to) => ({
  to,
  share: round((100 * dists.filter((d) => d <= to).length) / dists.length),
}))

/* --- write ---------------------------------------------------------- */

const ts = `/**
 * 중개사무소 소재지와 매물 소재지, 같은지 다른지.
 *
 * GENERATED by scripts/build-reach.mjs — do not hand-edit.
 *
 * ${matched.toLocaleString('en-US')} 개의 중개 다리 가운데 ${round((100 * selfLegs) / matched)}% 가 매물과 같은
 * 시군구의 사무소에서 나왔습니다. 시군구별 중앙값은 ${q(sortedRates, 0.5)}% 이고,
 * 경계를 넘은 ${round((100 * externalLegs) / matched)}% 도 중앙값 ${round(q(dists, 0.5))}km — 대개 바로 옆
 * 시군구입니다.
 *
 * 그래서 이 데이터로 흐름 지도를 그리지 않습니다. 서로 다른 외부 짝이
 * ${external.length.toLocaleString('en-US')}개이고 그중 가장 굵은 10개가 외부 물량의 ${round((100 * topTen) / externalLegs)}% 입니다.
 * 5천 개의 선을 그려 8%를 보여주는 그림은, 흐름을 봤다는 인상만 남깁니다.
 *
 * 단위는 거래가 아니라 다리입니다. 소재지 필드는 시군구가 둘 이상
 * 걸리면 쉼표로 나뉘고, 항목 하나가 다리 하나입니다.
 */

export type ReachDistrict = {
  readonly sido: string
  readonly sgg: string
  /** Share of this district's legs handled from inside it. */
  readonly rate: number
  readonly legs: number
  /** The thickest external inflow, its size and how far it came. */
  readonly origin: string
  readonly originLegs: number
  readonly originShare: number
  readonly originKm: number
}

export const REACH_WINDOW = {
  from: '${months[0].slice(0, 4)}-${months[0].slice(4)}',
  to: '${months[months.length - 1].slice(0, 4)}-${months[months.length - 1].slice(4)}',
} as const

/** Legs below which a district is counted but not plotted. */
export const REACH_FLOOR = ${FLOOR}

export const REACH_INTAKE = {
  /** 중개거래 filings — 직거래 has no office and is not here. */
  records: ${records},
  legs: ${legs},
  matched: ${matched},
  /** Legs whose 시군구 name is not in the code table. */
  unmatched: ${legs - matched},
  districts: ${lawd.length},
  measured: ${rows.length},
  belowFloor: ${belowFloor},
  noLegs: ${noLegs},
  /** Legs that crossed a district line. */
  external: ${externalLegs},
  /** Distinct (destination, origin) pairs among those. */
  flows: ${external.length},
} as const

/** Share of all matched legs handled from inside the property's district. */
export const REACH_NATIONAL = ${round((100 * selfLegs) / matched)}

/** Share of external legs carried by the ten thickest pairs. */
export const REACH_TOP_TEN = ${round((100 * topTen) / externalLegs)}

/** The distribution of \`rate\` across the ${rows.length} measured districts. */
export const REACH_QUANTILES = {
  min: ${sortedRates[0]},
  p5: ${q(sortedRates, 0.05)},
  p25: ${q(sortedRates, 0.25)},
  median: ${q(sortedRates, 0.5)},
  p75: ${q(sortedRates, 0.75)},
  p95: ${q(sortedRates, 0.95)},
  max: ${sortedRates[sortedRates.length - 1]},
} as const

/**
 * Every measured district's share, ascending. The figure is a dot per entry
 * on a full 0–100 axis: no binning, so the one district at ${sortedRates[0]}% stays
 * visible instead of disappearing into an underflow bucket.
 */
export const REACH_RATES: readonly number[] = [${sortedRates.join(', ')}]

/** How far the external legs went. */
export const REACH_DISTANCE = {
  median: ${round(q(dists, 0.5))},
  p75: ${round(q(dists, 0.75))},
  p90: ${round(q(dists, 0.9))},
  p99: ${Math.round(q(dists, 0.99))},
  max: ${Math.round(dists[dists.length - 1])},
  bands: [${bands.map((b) => `{ to: ${b.to}, share: ${b.share} }`).join(', ')}],
} as const

/**
 * 공동중개, as far as this field can see it.
 *
 * \`cross\` and \`same\` are COUNTS, not a share, because the share rounds to
 * 100.0% at one decimal place and a rounded 100 was once read as "not one of
 * them". ${coCross.toLocaleString('en-US')} filings with two entries name two
 * different 시군구; ${coPairs - coCross} name the same one twice.
 *
 * That is not a finding about co-brokerage. It is what tells us the field
 * records districts rather than offices: co-brokerage between two offices in
 * one district is ordinary, so a field recording offices would show it in
 * bulk. \`share\` is therefore the rate at which co-brokerage CROSSES a
 * district line, not the co-brokerage rate, and the same-district kind cannot
 * be counted from this source.
 */
export const REACH_CO = {
  pairs: ${coPairs},
  cross: ${coCross},
  same: ${coPairs - coCross},
  /** Share of all 중개거래 filings that name two districts. */
  share: ${round((100 * coPairs) / records)},
} as const

/** The lowest ${LOW_ROWS}, with the thickest inflow into each. */
export const REACH_LOW: readonly ReachDistrict[] = [
${low
  .map(
    (r) =>
      `  { sido: '${r.sido}', sgg: '${r.sgg}', rate: ${r.rate}, legs: ${r.legs},` +
      ` origin: '${r.origin}', originLegs: ${r.originLegs}, originShare: ${r.originShare}, originKm: ${r.originKm} },`,
  )
  .join('\n')}
]
`

writeFileSync(OUT, ts, 'utf8')

const line = (s) => process.stdout.write(s + '\n')
line('')
line('  BROKER REACH')
line('  ' + '-'.repeat(70))
line(
  `  ${records.toLocaleString('en-US')} 중개거래 · 다리 ${legs.toLocaleString('en-US')}` +
    ` · 매칭 ${round((100 * matched) / legs, 2)}%`,
)
line(
  `  자기지역 ${round((100 * selfLegs) / matched)}% · 시군구 ${rows.length}곳 중앙 ${q(sortedRates, 0.5)}%` +
    ` (바닥 ${FLOOR} 미만 ${belowFloor} · 다리 없음 ${noLegs})`,
)
line(
  `  외부 ${externalLegs.toLocaleString('en-US')} 다리 · 짝 ${external.length.toLocaleString('en-US')} 종류` +
    ` · 상위 10개가 ${round((100 * topTen) / externalLegs)}%`,
)
line(
  `  외부 거리 중앙 ${round(q(dists, 0.5))}km · ` +
    bands.map((b) => `${b.to}km ${b.share}%`).join(' · '),
)
line(
  `  공동중개 ${coPairs.toLocaleString('en-US')} — 시군구 다름 ${coCross.toLocaleString('en-US')}` +
    ` · 같음 ${coPairs - coCross}`,
)
if (unmatched.size) {
  const top = [...unmatched].sort((a, b) => b[1] - a[1]).slice(0, 3)
  line(`  코드표에 없는 이름 ${unmatched.size}종 · ${top.map(([n, v]) => `${n} ${v}`).join(' · ')}`)
}
line('  ' + '-'.repeat(70))
line('  wrote lib/reach.data.ts')
line('')
