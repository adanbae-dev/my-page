#!/usr/bin/env node
/**
 * Determinism, as its own step.
 *
 * Kept out of `pnpm check` deliberately. Every other gate on this site reads
 * the committed artifacts and re-derives the published claims from them; this
 * one re-runs the generators, which writes to the working tree. A gate with
 * side effects does not belong in the routine check, and a gate that
 * regenerates its own input can only ever agree with itself — so
 * scripts/check-bi.mjs does the consistency work and this does the one thing
 * consistency cannot show: that the seed actually pins the output.
 *
 * It is safe to run. If the generators are deterministic nothing changes, and
 * if they are not the tree is already wrong and that is the finding.
 *
 * THE ROSTER LAYER IS SKIPPED WITHOUT THE CACHE. .rtms-cache/ is 874 MB of
 * raw open-API responses, gitignored and refetchable; the roster derived from
 * it is committed. So on a fresh clone only the invented layer can be
 * regenerated, and this says which halves it checked rather than passing
 * quietly on half the work.
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const line = (s) => process.stdout.write(s + '\n')

/** Every file the generators write, hashed together in a stable order. */
function fingerprint(paths) {
  const h = createHash('sha256')
  const walk = (p) => {
    if (!existsSync(p)) { h.update(`missing:${p}\n`); return }
    if (statSync(p).isDirectory()) {
      for (const n of readdirSync(p).sort()) walk(join(p, n))
      return
    }
    h.update(p.slice(ROOT.length) + '\n')
    h.update(readFileSync(p))
  }
  for (const p of paths) walk(join(ROOT, p))
  return h.digest('hex').slice(0, 16)
}

const ROSTER_OUT = ['lib/bi.roster.data.ts', 'public/data/bi/roster']
const BI_OUT = [
  'lib/bi.data.ts',
  'public/data/bi/series',
  'public/data/bi/contracts.json',
  'public/data/bi/pipeline.json',
]

const hasCache = existsSync(join(ROOT, '.rtms-cache', 'trade'))
const stages = [
  ...(hasCache ? [{ name: 'roster', script: 'build-roster.mjs', out: ROSTER_OUT }] : []),
  { name: 'revenue', script: 'build-bi.mjs', out: BI_OUT },
]

const problems = []
line('')
line('  BI DETERMINISM')
line('  ' + '-'.repeat(70))
if (!hasCache) {
  line('  roster    SKIPPED — .rtms-cache/trade 가 없습니다 (gitignore, 재수집 가능)')
}

for (const stage of stages) {
  const before = fingerprint(stage.out)
  try {
    execFileSync('node', [join(ROOT, 'scripts', stage.script)], { cwd: ROOT, stdio: 'pipe' })
  } catch (e) {
    problems.push(`${stage.name}: ${stage.script} 가 실패했습니다 — ${String(e.stderr ?? e.message).trim().slice(0, 120)}`)
    continue
  }
  const after = fingerprint(stage.out)
  if (before === after) {
    line(`  ${stage.name.padEnd(9)} ${before} — 재실행이 바이트 동일`)
  } else {
    problems.push(`${stage.name}: 재실행이 다른 결과를 냈습니다 (${before} → ${after}) — 시드가 출력을 고정하지 못합니다`)
  }
}

/* The seed has to be recorded in the published file, or the run cannot be
   reproduced by anyone who did not read the generator's source. */
const biSrc = readFileSync(join(ROOT, 'lib', 'bi.data.ts'), 'utf8')
const seed = /export const BI_SEED = '([^']*)'/.exec(biSrc)?.[1]
if (!seed) problems.push('lib/bi.data.ts 에 BI_SEED 가 없습니다')
else line(`  seed      ${seed}`)

line('  ' + '-'.repeat(70))
if (problems.length) {
  for (const p of problems) line(`  ✗ ${p}`)
  line('')
  line(`  FAIL — ${problems.length} problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line(`  PASS — ${stages.map((s) => s.name).join(' + ')} 재실행이 같은 바이트를 냅니다.`)
line('')
