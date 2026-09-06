#!/usr/bin/env node
/**
 * Pull 실거래가 from the MOLIT open API into a local cache.
 *
 * WHY A CACHE AND NOT A STREAM. The API is keyed by (법정동코드 5자리 ×
 * 계약년월), so one year of one property type across the country is
 * 245 × 12 = 2,940 calls, and a development key's daily traffic allowance is
 * finite. A run that starts over on every failure would burn the allowance
 * before it finished. Every response is written to disk first and nothing is
 * refetched, so an interrupted run resumes and a re-run costs nothing.
 *
 * The cache is raw. Aggregation is a separate step on purpose: the shape of
 * the questions this data answers is still moving, and re-deriving from disk
 * is free while re-fetching is not.
 *
 * THE KEY IS NEVER PRINTED. It is read from .env.local (gitignored), sent as
 * a query parameter because that is the only thing the API accepts, and
 * redacted out of every error message before it reaches a log.
 *
 * Usage:
 *   node scripts/fetch-rtms.mjs rent  202501 202512
 *   node scripts/fetch-rtms.mjs trade 202501 202512
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, '.rtms-cache')

/**
 * The two endpoints, and which page each one feeds.
 *
 * `rent` carries 갱신요구권사용 / 종전계약보증금 / 종전계약월세 — the renewal
 * question. `trade` carries 거래유형 (중개거래 vs 직거래) and 중개사소재지 —
 * the brokerage questions. Nothing else is fetched, because every other
 * property type doubles the call count for a question nobody asked.
 */
const APIS = {
  rent: {
    path: '1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
    what: '아파트 전월세',
  },
  trade: {
    path: '1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade',
    what: '아파트 매매',
  },
}

const HOST = 'https://apis.data.go.kr'
const PAGE = 1000

const die = (msg) => {
  process.stderr.write(`\n  ✗ ${msg}\n\n`)
  process.exit(1)
}

/* --- config --------------------------------------------------------- */

function serviceKey() {
  const file = join(ROOT, '.env.local')
  if (!existsSync(file)) die('.env.local 이 없습니다 — MOLIT_SERVICE_KEY 를 넣어 주세요')
  const line = readFileSync(file, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('MOLIT_SERVICE_KEY='))
  const key = line?.slice('MOLIT_SERVICE_KEY='.length).trim()
  if (!key) die('.env.local 에 MOLIT_SERVICE_KEY 가 없습니다')
  return key
}

const KEY = serviceKey()
/** Anything that might carry the key is scrubbed before it is shown. */
const safe = (s) => String(s).split(KEY).join('<KEY>').replace(/serviceKey=[^&\s]*/g, 'serviceKey=<KEY>')

const [, , which, from, to] = process.argv
if (!APIS[which]) die(`첫 인자는 ${Object.keys(APIS).join(' | ')} 중 하나여야 합니다`)
if (!/^\d{6}$/.test(from ?? '') || !/^\d{6}$/.test(to ?? '')) {
  die('기간은 YYYYMM YYYYMM 형식입니다 — 예: 202501 202512')
}

const months = []
for (let y = +from.slice(0, 4), m = +from.slice(4); ; m++) {
  if (m > 12) { m = 1; y++ }
  const ym = `${y}${String(m).padStart(2, '0')}`
  months.push(ym)
  if (ym === to) break
  if (months.length > 240) die('기간이 20년을 넘습니다 — 오타 같습니다')
}

const districts = JSON.parse(readFileSync(join(ROOT, 'scripts', 'rtms', 'lawd.json'), 'utf8'))

/* --- fetch ---------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * One (district, month). Returns the parsed items, or throws.
 *
 * `_type=json` because the XML the API returns by default would need a
 * parser dependency for no gain. The envelope is checked rather than
 * trusted: data.go.kr answers a rejected key with HTTP 200 and an error
 * body, so a run without this check would cache 3,000 error pages and call
 * itself finished.
 */
async function page(api, lawd, ym, pageNo) {
  const url =
    `${HOST}/${api.path}?serviceKey=${encodeURIComponent(KEY)}` +
    `&LAWD_CD=${lawd}&DEAL_YMD=${ym}&numOfRows=${PAGE}&pageNo=${pageNo}&_type=json`

  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status} · ${safe(text).slice(0, 200)}`)

  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(`JSON 이 아닙니다 · ${safe(text).slice(0, 200)}`)
  }
  const header = body?.response?.header
  if (header && header.resultCode !== '00' && header.resultCode !== '000') {
    throw new Error(`API ${header.resultCode} ${header.resultMsg}`)
  }
  const items = body?.response?.body?.items?.item ?? []
  return {
    list: Array.isArray(items) ? items : items ? [items] : [],
    total: Number(body?.response?.body?.totalCount ?? 0),
  }
}

/**
 * One (district, month), every page of it.
 *
 * A page cap that is never checked is a silent truncation, and this one is
 * close: 인천 부평구 filed 969 rent contracts in June 2026 against a
 * 1,000-row page. The month that crosses it would have lost its tail without
 * a word, and the map would have shown a real district with a wrong number.
 */
async function once(api, lawd, ym) {
  const first = await page(api, lawd, ym, 1)
  const out = first.list
  for (let n = 2; out.length < first.total && n <= 40; n++) {
    await sleep(120)
    const more = await page(api, lawd, ym, n)
    if (!more.list.length) break
    out.push(...more.list)
  }
  if (out.length < first.total) {
    throw new Error(`${lawd}/${ym}: ${out.length}/${first.total} 행만 받았습니다`)
  }
  return out
}

/**
 * A rejected key is the only thing worth stopping for.
 *
 * The first version treated a connection failure as fatal too, on the theory
 * that an unreachable host stays unreachable. It does not: this gateway
 * refuses perhaps one call in twenty and answers the retry, and the run that
 * aborted on the first refusal had already cached 229 districts before it
 * was killed. Treating flakiness as an outage cost more than the flakiness.
 */
const FATAL = /API (?:20|22|30|31|32|33|34)\b/

class Fatal extends Error {}

/** Six tries with growing backoff. Only a bad key skips them. */
async function withRetry(api, lawd, ym) {
  let last
  for (let i = 0; i < 3; i++) {
    try {
      return await once(api, lawd, ym)
    } catch (e) {
      last = e
      const text = `${e.message} ${e.cause?.code ?? ''}`
      if (FATAL.test(text)) throw new Fatal(safe(text.trim()))
      await sleep(500 * 2 ** i)
    }
  }
  throw last
}

/* --- run ------------------------------------------------------------ */

const api = APIS[which]
const dir = join(CACHE, which)
mkdirSync(dir, { recursive: true })

/**
 * One call before the other 2,939.
 *
 * The host has been down before while the rest of data.go.kr was up, and
 * finding that out 2,940 timeouts later is 16 hours of nothing. This is the
 * cheapest possible answer to "is there any point starting".
 */
async function preflight() {
  const d = districts[0]
  const ym = months[0]
  let last
  for (let i = 0; i < 4; i++) {
    try {
      await once(api, d.lawd, ym)
      return
    } catch (e) {
      if (e instanceof Fatal) {
        die(`인증키가 거부됐습니다 — ${safe(e.message)}`)
      }
      last = e
      await sleep(1500 * (i + 1))
    }
  }
  /* NOT fatal. The gateway goes down in windows of minutes and comes back:
     one run cached 229 districts and then could not make a single call four
     minutes later. Every response is on disk and a re-run skips it, so the
     useful thing to do with a bad window is grind through it and report what
     is still missing — not refuse to start. */
  process.stdout.write(
    `  ! 첫 호출 4회 실패 — ${safe(last?.message ?? '?')}\n` +
      `    게이트웨이가 지금 안 되는 것 같습니다. 받은 것은 캐시에 남으니\n` +
      `    끝까지 돌린 뒤 남은 것만 다시 도세요.\n`,
  )
}

const jobs = []
for (const ym of months) for (const d of districts) jobs.push([d, ym])
const done = jobs.filter(([d, ym]) => existsSync(join(dir, `${d.lawd}-${ym}.json`)))

process.stdout.write(`\n  RTMS · ${api.what}\n  ${'-'.repeat(70)}\n`)
process.stdout.write(`  ${districts.length} 시군구 × ${months.length} 개월 = ${jobs.length} 콜\n`)
process.stdout.write(`  캐시에 이미 ${done.length} 개 · 받을 것 ${jobs.length - done.length} 개\n`)
process.stdout.write(`  ${'-'.repeat(70)}\n`)

await preflight()

let ok = 0
let rows = 0
let streak = 0
let pauses = 0
const failures = []
const started = Date.now()

/**
 * A circuit breaker, because per-call retries answer the wrong question.
 *
 * When the gateway is merely flaky, three tries fix it. When the gateway is
 * DOWN, three tries per call times 2,711 calls is four days of waiting to
 * learn one fact. Twenty consecutive failures is that fact. The run then
 * sleeps five minutes and tries again — the outages seen here last minutes,
 * not days — and gives up after half an hour of them, with everything it did
 * get already on disk.
 */
const BREAK_AFTER = 20
const PAUSE_MS = 5 * 60_000
const MAX_PAUSES = 6

for (const [d, ym] of jobs) {
  const out = join(dir, `${d.lawd}-${ym}.json`)
  if (existsSync(out)) { ok++; continue }
  try {
    const list = await withRetry(api, d.lawd, ym)
    writeFileSync(out, JSON.stringify(list), 'utf8')
    ok++
    rows += list.length
    streak = 0
  } catch (e) {
    failures.push(`${d.sido} ${d.sgg} ${d.lawd}/${ym}: ${safe(e.message)}`)
    if (e instanceof Fatal) break
    if (++streak >= BREAK_AFTER) {
      if (++pauses > MAX_PAUSES) {
        process.stdout.write(`  ✗ ${BREAK_AFTER}회 연속 실패가 ${MAX_PAUSES}번 — 게이트웨이가 계속 안 됩니다. 중단합니다.\n`)
        break
      }
      process.stdout.write(
        `  … ${BREAK_AFTER}회 연속 실패 — 5분 쉬고 다시 (${pauses}/${MAX_PAUSES})\n`,
      )
      await sleep(PAUSE_MS)
      streak = 0
    }
  }
  if ((ok + failures.length) % 50 === 0) {
    const pct = (((ok + failures.length) / jobs.length) * 100).toFixed(0)
    process.stdout.write(`  ${pct.padStart(3)}%  ${ok} 성공 · ${failures.length} 실패 · ${rows} 행\n`)
  }
  await sleep(120)
}

process.stdout.write(`  ${'-'.repeat(70)}\n`)
process.stdout.write(`  ${ok} 성공 · ${failures.length} 실패 · 새로 ${rows} 행 · ${((Date.now() - started) / 1000).toFixed(0)}초\n`)
if (failures.length) {
  process.stdout.write(`\n  실패 ${failures.length} 건 중 처음 5개:\n`)
  for (const f of failures.slice(0, 5)) process.stdout.write(`    ${f}\n`)
  process.stdout.write('\n')
  process.exit(1)
}
process.stdout.write(`  OK — ${dir}\n\n`)
