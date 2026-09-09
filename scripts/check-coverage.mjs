#!/usr/bin/env node
/**
 * Does every district on the map actually have filings behind it?
 *
 * THIS GATE EXISTS BECAUSE A WHOLE PROVINCE WAS MISSING AND NOTHING SAID SO.
 * 광주·전남 — 27 시군구, 3.16 million residents, 11% of the districts on
 * the map — sat in the cache with twelve monthly files each and zero rows in
 * every one of them. The API had moved the region to 시도코드 12 after the
 * merger into 전남광주통합특별시; the fetcher was still asking for 29xxx and
 * 46xxx, and data.go.kr answers a retired code with HTTP 200, resultCode
 * 000, totalCount 0. A dead code and an empty market are the same response.
 *
 * So /portfolio/prices published those 27 districts in its "표본 부족"
 * class, which was a claim about the housing market. It was actually a claim
 * about a URL. /portfolio/direct dropped them from its scatter and
 * /portfolio/renewal from its distribution, and all three said the reason
 * out loud — the wrong reason. That is worse than an error bar: a reader
 * cannot tell the difference from the page, and neither could the build.
 *
 * What is checked, all of it offline:
 *
 *   1  Every district in the code table has rows somewhere in the window.
 *      A district that has none must be named in KNOWN_EMPTY with a reason,
 *      and a district in KNOWN_EMPTY that turns out to have rows fails too —
 *      an allowlist nobody prunes is how the next dead code hides.
 *   2  No orphan files. 648 empty files under retired codes were still on
 *      disk after the remap, and build scripts that key off the code table
 *      skip them silently.
 *   3  The window is complete: districts × months files per endpoint.
 *   4  THE API'S OWN VOCABULARY IS COMPARED WITH THE TABLE. Every 매매
 *      filing carries 중개사무소 소재지 as 시도 약칭 + 시군구명, so the cache
 *      already holds the list of districts the API believes in. Any name in
 *      it that the table does not have is a district this site cannot draw,
 *      and the count has to match what /portfolio/districts says is missing.
 *      This is free — no call, no download — and it is the check that turns a
 *      행정구역 개편 from a silent hole into a failed build.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, '.rtms-cache')
const KINDS = ['trade', 'rent']

const line = (s) => process.stdout.write(s + '\n')
const problems = []

/**
 * Districts with no filings that are not a mistake.
 *
 * The bar for an entry here is a reason that would still be true next year,
 * not "it was empty when I looked".
 */
const KNOWN_EMPTY = {
  28720: '옹진군 — 유인도 열 곳에 인구 1.9만, 아파트 재고가 거래로 잡히지 않는다',
}

/** 시도 약칭, as the API writes it in 중개사무소 소재지. */
const ABBR = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  전남광주통합특별시: '전남광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  충청북도: '충북',
  충청남도: '충남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
  강원특별자치도: '강원',
  전북특별자치도: '전북',
}

const nfc = (v) => String(v ?? '').normalize('NFC').trim()
const key = (s) => nfc(s).replace(/\s+/g, '')

const districts = JSON.parse(readFileSync(join(ROOT, 'scripts', 'rtms', 'lawd.json'), 'utf8'))
for (const d of districts) {
  if (!ABBR[d.sido]) problems.push(`시도 약칭을 모릅니다: ${d.sido}`)
}
const byCode = new Map(districts.map((d) => [String(d.lawd), d]))

/**
 * 전남광주통합특별시 answers to three abbreviations, and the data says so.
 *
 * 29,497 filings write it 전남광주. Twelve write 광주 and eleven write 전남 —
 * the two predecessor provinces, still being typed by the office filing the
 * contract. That is 0.08% of the region's filings, which is exactly what a
 * human-entered field looks like after a merger, and a gate that accepted
 * only the new form would have reported 23 phantom districts.
 */
const EXTRA_ABBR = { 전남광주통합특별시: ['광주', '전남'] }

const inTable = new Set()
for (const d of districts) {
  for (const a of [ABBR[d.sido], ...(EXTRA_ABBR[d.sido] ?? [])]) inTable.add(key(a + d.sgg))
}

/* --- 1..3  the cache ------------------------------------------------ */

const rows = {}
const months = {}
const orphans = new Set()

for (const kind of KINDS) {
  const dir = join(CACHE, kind)
  if (!existsSync(dir)) {
    problems.push(`.rtms-cache/${kind} 이 없습니다 — fetch-rtms 를 먼저 도세요`)
    continue
  }
  rows[kind] = new Map()
  months[kind] = new Set()
  let files = 0
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    files++
    const [code, ym] = f.replace('.json', '').split('-')
    months[kind].add(ym)
    if (!byCode.has(code)) {
      orphans.add(`${kind}/${code}`)
      continue
    }
    let list
    try {
      list = JSON.parse(readFileSync(join(dir, f), 'utf8'))
    } catch {
      problems.push(`${kind}/${f} 를 읽을 수 없습니다`)
      continue
    }
    if (!Array.isArray(list)) {
      problems.push(`${kind}/${f} 가 배열이 아닙니다`)
      continue
    }
    rows[kind].set(code, (rows[kind].get(code) ?? 0) + list.length)
  }
  const want = districts.length * months[kind].size
  if (files !== want) {
    problems.push(
      `${kind}: 파일이 ${files} 개인데 ${districts.length} 시군구 × ${months[kind].size} 개월 = ${want} 개여야 합니다`,
    )
  }
}

if (orphans.size) {
  problems.push(
    `코드표에 없는 캐시 파일이 있습니다 (${orphans.size} 개 코드): ${[...orphans].slice(0, 8).join(' ')}` +
      ` — 코드가 바뀌었으면 옛 파일을 치우세요, 안 그러면 빌드가 조용히 건너뜁니다`,
  )
}

const monthCount = months[KINDS[0]]?.size ?? 0
for (const kind of KINDS.slice(1)) {
  if ((months[kind]?.size ?? 0) !== monthCount) {
    problems.push(`창이 다릅니다: ${KINDS[0]} ${monthCount} 개월 vs ${kind} ${months[kind]?.size} 개월`)
  }
}

const empty = []
for (const d of districts) {
  const total = KINDS.reduce((a, k) => a + (rows[k]?.get(String(d.lawd)) ?? 0), 0)
  if (total === 0) empty.push(d)
}
for (const d of empty) {
  if (!KNOWN_EMPTY[d.lawd]) {
    problems.push(
      `${d.lawd} ${d.sido} ${d.sgg}: 창 전체가 0 행입니다 —` +
        ` 코드가 폐지됐는지 먼저 확인하세요 (폐지된 코드도 200 / totalCount 0 을 답합니다)`,
    )
  }
}
for (const code of Object.keys(KNOWN_EMPTY)) {
  if (!byCode.has(code)) {
    problems.push(`KNOWN_EMPTY 의 ${code} 는 코드표에 없습니다 — 지우세요`)
  } else if (!empty.some((d) => String(d.lawd) === code)) {
    problems.push(`KNOWN_EMPTY 의 ${code} 에 이제 행이 있습니다 — 지우세요`)
  }
}

/* --- 4  what the API believes in ------------------------------------ */

/**
 * 중개사무소 소재지, every distinct value in the 매매 cache.
 *
 * Two normalisations, both narrow. `세종` is the province writing its own
 * single district's name, and a value with no space is a truncated entry
 * rather than a district. A value that is a strict prefix of another is the
 * parent of districts that are themselves in the list — 화성시 filed under
 * its own name and under its four new wards — and counting it as a twelfth
 * absence would double-count one place.
 */
const vocabulary = new Map()
if (existsSync(join(CACHE, 'trade'))) {
  for (const f of readdirSync(join(CACHE, 'trade'))) {
    if (!f.endsWith('.json')) continue
    let list
    try {
      list = JSON.parse(readFileSync(join(CACHE, 'trade', f), 'utf8'))
    } catch {
      continue
    }
    if (!Array.isArray(list)) continue
    for (const r of list) {
      const raw = nfc(r.estateAgentSggNm)
      if (!raw) continue
      /* 공동중개 puts two offices in one field, comma separated. */
      for (const part of raw.split(',').map(nfc).filter(Boolean)) {
        vocabulary.set(part, (vocabulary.get(part) ?? 0) + 1)
      }
    }
  }
}

/* 세종 has one district and writes only the province name for it. The value
   has to come out in the same shape as the table's key, 시도 약칭 + 시군구명. */
const ALIAS = { 세종: '세종 세종시' }
const names = [...vocabulary.keys()].map((v) => ALIAS[v] ?? v)
const withSpace = names.filter((v) => /\s/.test(v))
const absent = withSpace.filter((v) => !inTable.has(key(v)))
const leaves = absent.filter((v) => !absent.some((o) => o !== v && key(o).startsWith(key(v))))

/* Every absent district has to be named on the page that draws the map. The
   page writes them compressed — 화성 동탄, not 경기 화성시 동탄구 — so the
   stem is what is looked for. */
const stem = (v) => {
  const last = nfc(v).split(/\s+/).pop() ?? ''
  return last.replace(/[구시군]$/, '')
}
const declared = {}
for (const locale of ['ko', 'en']) {
  const dict = readFileSync(join(ROOT, 'lib', 'i18n', 'dictionaries', `${locale}.ts`), 'utf8')
  declared[locale] = /\n {4}missingWhy:\n?\s*'([^']*)'/.exec(dict)?.[1] ?? ''
  if (!declared[locale]) problems.push(`${locale}.ts: districts.missingWhy 를 못 찾았습니다`)
}
for (const v of leaves) {
  const s = stem(v)
  if (s && declared.ko && !declared.ko.includes(s)) {
    problems.push(`ko.ts: 지도에 없는 ${v} 를 missingWhy 가 안 적었습니다`)
  }
}
const claimed = /(\d+)곳이 없다/.exec(
  /\n {4}missingTerm:\s*'([^']*)'/.exec(
    readFileSync(join(ROOT, 'lib', 'i18n', 'dictionaries', 'ko.ts'), 'utf8'),
  )?.[1] ?? '',
)?.[1]
if (claimed === undefined) {
  problems.push('ko.ts: missingTerm 이 "N곳이 없다" 형식이 아닙니다')
} else if (Number(claimed) !== leaves.length) {
  problems.push(
    `ko.ts: missingTerm 은 ${claimed}곳이라는데 API 는 코드표에 없는 시군구 ${leaves.length}곳을 씁니다`,
  )
}

/* --- report --------------------------------------------------------- */

const n = (v) => v.toLocaleString('ko-KR')
line('')
line('  COVERAGE')
line('  ' + '-'.repeat(70))
line(`  ${districts.length} 시군구 × ${monthCount} 개월`)
for (const kind of KINDS) {
  const total = [...(rows[kind]?.values() ?? [])].reduce((a, b) => a + b, 0)
  line(`  ${kind.padEnd(6)} ${n(total).padStart(10)} 행`)
}
line(`  행이 없는 시군구 ${empty.length}${empty.length ? ' — ' + empty.map((d) => d.sgg).join(' ') : ''}`)
line(`  API 어휘 ${vocabulary.size} 개 문자열 · 코드표에 없는 시군구 ${leaves.length}곳`)
if (leaves.length) line(`    ${leaves.sort().join(' · ')}`)
line('  ' + '-'.repeat(70))

if (problems.length) {
  for (const p of problems) line(`  ✗ ${p}`)
  line('')
  line(`  FAIL — ${problems.length} problem${problems.length > 1 ? 's' : ''}`)
  line('')
  process.exit(1)
}
line('  PASS — 모든 시군구에 행이 있고, 빠진 곳은 이름이 적혀 있습니다.')
line('')
