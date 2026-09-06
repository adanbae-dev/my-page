#!/usr/bin/env node
/**
 * The renewal figure, and the sentences about it.
 *
 * The data file is generated, so its internal shape is the cheap half of
 * this gate: bins have to agree between the two series, shares have to add
 * to a hundred, and the intake arithmetic has to close.
 *
 * The expensive half is the PROSE. This page's argument is a pair of
 * numbers — "4.9% and 4.7%, but 0.2% and 30.7%" — and those numbers are
 * written into two dictionaries as sentences. Regenerate the data over a
 * different window and the picture moves while the sentences stay, which is
 * the exact failure this site claims not to have: a published number nobody
 * re-derived. So every percentage a headline sentence states has to be a
 * number the data actually holds.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const line = (s) => process.stdout.write(s + '\n')
const problems = []

const src = readFileSync(join(ROOT, 'lib', 'renewal.data.ts'), 'utf8')

const one = (re, what) => {
  const m = re.exec(src)
  if (!m) problems.push(`lib/renewal.data.ts: ${what} 를 못 읽었습니다`)
  return m?.[1]
}

const FROM = Number(one(/RENEWAL_BIN_FROM = (-?\d+)/, 'RENEWAL_BIN_FROM'))
const TO = Number(one(/RENEWAL_BIN_TO = (-?\d+)/, 'RENEWAL_BIN_TO'))
const CAP = Number(one(/RENEWAL_CAP = (\d+)/, 'RENEWAL_CAP'))
const intake = Object.fromEntries(
  [...src.matchAll(/^\s{2}(rows|renewals|mixed|unusable|kept): (\d+),$/gm)].map((m) => [m[1], Number(m[2])]),
)

const series = [...src.matchAll(
  /\{\s*key: '(\w+)',\s*n: (\d+),\s*median: (-?[\d.]+),\s*p25: (-?[\d.]+),\s*p75: (-?[\d.]+),\s*p90: (-?[\d.]+),\s*cut: (-?[\d.]+),\s*frozen: (-?[\d.]+),\s*atCap: (-?[\d.]+),\s*overCap: (-?[\d.]+),\s*bins: \[([^\]]+)\],\s*\}/g,
)].map((m) => ({
  key: m[1],
  n: Number(m[2]),
  median: Number(m[3]),
  p25: Number(m[4]),
  p75: Number(m[5]),
  p90: Number(m[6]),
  cut: Number(m[7]),
  frozen: Number(m[8]),
  atCap: Number(m[9]),
  overCap: Number(m[10]),
  bins: m[11].split(',').map((x) => Number(x.trim())),
}))

/* --- shape ---------------------------------------------------------- */

if (series.length !== 2) problems.push(`계열이 2개여야 하는데 ${series.length}개입니다`)
const want = TO - FROM + 3
for (const s of series) {
  if (s.bins.length !== want) {
    problems.push(`${s.key}: 칸이 ${s.bins.length}개, ${FROM}~${TO} 라면 ${want}개여야 합니다`)
  }
  const sum = s.bins.reduce((a, b) => a + b, 0)
  /* Each bin is rounded to one decimal, so the total drifts by at most half
     a tenth per bin. Anything past that is a lost bin, not rounding. */
  if (Math.abs(sum - 100) > s.bins.length * 0.05 + 0.05) {
    problems.push(`${s.key}: 칸 합계가 ${sum.toFixed(1)}% 입니다 — 100 이어야 합니다`)
  }
  if (s.n <= 0) problems.push(`${s.key}: n 이 ${s.n} 입니다`)
  if (s.overCap > 0 && s.p90 < CAP && s.key === 'used') {
    /* Not a contradiction, but worth noticing: it would mean the cap binds
       above the 90th percentile, which is not what this page says. */
    problems.push(`used: p90 ${s.p90}% 가 상한 ${CAP}% 아래인데 초과가 ${s.overCap}% 입니다`)
  }
}

const total = series.reduce((a, s) => a + s.n, 0)
if (total !== intake.kept) problems.push(`계열 합 ${total} ≠ kept ${intake.kept}`)
if (intake.kept + intake.mixed + intake.unusable !== intake.renewals) {
  problems.push(
    `kept ${intake.kept} + mixed ${intake.mixed} + unusable ${intake.unusable} ≠ 갱신 ${intake.renewals}`,
  )
}
if (intake.renewals > intake.rows) problems.push(`갱신 ${intake.renewals} > 전체 ${intake.rows}`)

/* --- the sentences -------------------------------------------------- */

/** Every percentage the data licenses a sentence to state. */
const allowed = new Set([CAP, 0, 100])
for (const s of series) {
  for (const k of ['median', 'p25', 'p75', 'p90', 'cut', 'frozen', 'atCap', 'overCap']) {
    allowed.add(s[k])
    allowed.add(Math.round(s[k]))
  }
  const peak = Math.max(...s.bins)
  allowed.add(peak)
  allowed.add(Math.round(peak))
}

const SENTENCES = ['lead', 'note', 'summary']
for (const locale of ['ko', 'en']) {
  const dict = readFileSync(join(ROOT, 'lib', 'i18n', 'dictionaries', `${locale}.ts`), 'utf8')
  const block = /\n {2}renewal: \{([\s\S]*?)\n {2}\},/.exec(dict)?.[1]
  if (!block) {
    problems.push(`${locale}.ts: renewal 블록이 없습니다`)
    continue
  }
  const seo = /\n {4}renewal:\n?\s*'([^']*)'/.exec(dict)?.[1] ?? ''
  const texts = [seo]
  for (const key of SENTENCES) {
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

const pct = (v) => `${v.toFixed(1)}%`
line('')
line('  RENEWAL')
line('  ' + '-'.repeat(70))
line(
  `  ${intake.rows.toLocaleString('ko-KR')} 행 · 갱신 ${intake.renewals.toLocaleString('ko-KR')}` +
    ` → 쓴 것 ${intake.kept.toLocaleString('ko-KR')} (월세 ${intake.mixed.toLocaleString('ko-KR')} · 종전값 없음 ${intake.unusable.toLocaleString('ko-KR')})`,
)
for (const s of series) {
  line(
    `  ${s.key.padEnd(8)} n=${s.n.toLocaleString('ko-KR').padStart(7)}  중앙 ${pct(s.median).padStart(6)}` +
      `  p90 ${pct(s.p90).padStart(6)}  ${CAP}% 초과 ${pct(s.overCap).padStart(6)}  칸 ${s.bins.length}`,
  )
}
line('  ' + '-'.repeat(70))
if (problems.length) {
  for (const p of problems) line(`  ✗ ${p}`)
  line('')
  line(`  FAIL — ${problems.length} problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line('  PASS — 분포가 닫히고, 본문이 인용한 숫자가 전부 데이터에 있습니다.')
line('')
