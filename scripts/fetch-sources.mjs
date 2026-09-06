#!/usr/bin/env node
/**
 * Re-download the file datasets every map on this site is built from.
 *
 * WHY THIS EXISTS. The four files below were fetched by hand, and for a
 * while the only record of where they came from was a conversation. The
 * dataset pages were cited in lib/cartogram.data.ts — which is the licence
 * and the provenance, and is the right thing to publish — but a citation is
 * not a download. Losing 39 MB of boundary WKB would have meant finding it
 * again by memory, and this repository's whole argument is that a claim
 * should be checkable by running something.
 *
 * NO KEY. Every dataset here is `fileData`, which data.go.kr serves without
 * registration. The 실거래가 API is different and lives in fetch-rtms.mjs.
 *
 * The download link is RESOLVED, not stored. data.go.kr puts the file behind
 * an `atchFileId` that changes whenever the publisher uploads a new edition,
 * so a hardcoded URL would rot silently — it 404s, or worse, keeps serving
 * the old edition. The dataset id is the stable thing, so that is what is
 * written down, and the link is read off the page each time.
 *
 * Usage:
 *   node scripts/fetch-sources.mjs          # download what is missing
 *   node scripts/fetch-sources.mjs --check  # resolve links, download nothing
 *   node scripts/fetch-sources.mjs --force  # re-download everything
 */

import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '.rtms-cache', 'source')

/**
 * `sha` is the truncated SHA-256 of the edition this site was built from.
 * It is not a security check — these are public files over TLS. It is a
 * CHANGE check: a differing hash means the publisher shipped a new edition,
 * and every number derived from that file has to be re-derived rather than
 * assumed. The build has been wrong about a stale edition once already
 * (the boundary file still calls 여주시 '여주군', a 2013 rename).
 */
const SOURCES = [
  {
    file: 'sgg.raw',
    id: '15123131',
    what: '국토지리정보원 공간정보공동활용 시군구 경계 (WKB)',
    sha: 'a881637c18c8',
  },
  {
    file: 'pop.raw',
    id: '15097972',
    what: '행정안전부 주민등록 인구',
    sha: '6920fdafd269',
  },
  {
    file: 'broker.raw',
    id: '15063946',
    what: '국토교통부 중개사무소 등록현황',
    sha: 'b7826982e78a',
  },
  {
    file: 'lawd.raw',
    id: '15123287',
    what: '국토교통부 법정동코드 (폐지여부 포함)',
    sha: 'd1062860dd73',
  },
]

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
const line = (s) => process.stdout.write(s + '\n')
const kb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`
const digest = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12)

const check = process.argv.includes('--check')
const force = process.argv.includes('--force')

/** Read the download link off the dataset page. */
async function resolveLink(id) {
  const page = `https://www.data.go.kr/data/${id}/fileData.do`
  const res = await fetch(page, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`데이터셋 페이지 ${id}: HTTP ${res.status}`)
  const html = await res.text()
  const m = html.match(/fileDownload\.do\?atchFileId=([A-Za-z0-9_]+)&fileDetailSn=(\d+)/)
  if (!m) throw new Error(`데이터셋 페이지 ${id}: 다운로드 링크를 못 찾았습니다`)
  return {
    page,
    url: `https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${m[1]}&fileDetailSn=${m[2]}&insertDataPrcus=N`,
  }
}

mkdirSync(OUT, { recursive: true })
line('')
line('  SOURCE FILES — data.go.kr, 인증키 없이 받는 파일 데이터')
line('  ' + '-'.repeat(74))

let changed = 0
let failed = 0

for (const s of SOURCES) {
  const path = join(OUT, s.file)
  const have = existsSync(path)

  if (have && !force && !check) {
    line(`  = ${s.file.padEnd(11)} ${kb(statSync(path).size).padStart(8)}  이미 있음`)
    continue
  }

  let link
  try {
    link = await resolveLink(s.id)
  } catch (e) {
    line(`  ✗ ${s.file.padEnd(11)} ${e.message}`)
    failed++
    continue
  }

  if (check) {
    line(`  → ${s.file.padEnd(11)} ${s.id}  링크 확인됨`)
    continue
  }

  const res = await fetch(link.url, {
    headers: { 'user-agent': UA, referer: link.page },
    signal: AbortSignal.timeout(300_000),
  })
  if (!res.ok) {
    line(`  ✗ ${s.file.padEnd(11)} HTTP ${res.status}`)
    failed++
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const sha = digest(buf)
  writeFileSync(path, buf)
  const same = sha === s.sha
  if (!same) changed++
  line(
    `  ${same ? '=' : '!'} ${s.file.padEnd(11)} ${kb(buf.length).padStart(8)}  ${sha}` +
      (same ? '' : `  ≠ ${s.sha} — 판이 바뀌었습니다`),
  )
}

line('  ' + '-'.repeat(74))
for (const s of SOURCES) line(`  ${s.file.padEnd(11)} ${s.id}  ${s.what}`)
line('  ' + '-'.repeat(74))
if (failed) {
  line(`  ✗ ${failed}개 실패`)
  line('')
  process.exit(1)
}
if (changed) {
  line(`  ! ${changed}개가 기록된 판과 다릅니다 — 파생 데이터를 다시 만들고 sha 를 고치세요`)
  line('')
  process.exit(1)
}
line('  OK — ' + OUT)
line('')
