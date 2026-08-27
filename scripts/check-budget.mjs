#!/usr/bin/env node
/**
 * Performance budget guard.
 *
 * For every prerendered route, walks its HTML, collects the static assets it
 * actually references, measures gzip transfer size, and fails if any
 * category — or the route total — is over perf.budget.json.
 *
 * The limits apply PER ROUTE. A budget checked only on the home page stops
 * being a budget the moment a second page exists.
 *
 * Run after `pnpm build`.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { CATEGORY_KEYS, measureBuild } from '../lib/perf/measure.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const budget = JSON.parse(readFileSync(join(ROOT, 'perf.budget.json'), 'utf8'))

const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB'
const line = (s) => process.stdout.write(s + '\n')

/* The measurement itself lives in lib/perf/measure.mjs, because `pnpm
   sync:perf` needs the same numbers to write the snapshot the site
   publishes. This file is now only the part that compares them to a limit
   and says so. */
const build = measureBuild()
const {
  routes,
  results,
  ok,
  sharedBytes,
  worstRoute,
  deferred,
} = build

const KEYS = CATEGORY_KEYS

line('')
line(`  PERFORMANCE BUDGET — gzip transfer, ${routes.length} prerendered routes`)
line('  ' + '-'.repeat(84))
line(
  '  route'.padEnd(32) +
    KEYS.map((k) => k.padStart(10)).join('') +
    '   verdict',
)
line('  ' + '-'.repeat(84))

let failures = 0
for (const r of results) {
  if (r.missing) {
    line(`  ${r.route.padEnd(36)} not prerendered — run \`pnpm build\``)
    failures++
    continue
  }
  const over = KEYS.filter((k) => r.used[k] > budget.budgets[k])
  if (over.length) failures++
  line(
    `  ${r.route.padEnd(36)}` +
      KEYS.map((k) => {
        const s = (r.used[k] / 1024).toFixed(1)
        return (over.includes(k) ? `!${s}` : s).padStart(10)
      }).join('') +
      `   ${over.length ? '✗ ' + over.join(', ') : '✓'}`,
  )
}

line('  ' + '-'.repeat(84))
line('  limit'.padEnd(32) + KEYS.map((k) => (budget.budgets[k] / 1024).toFixed(1).padStart(10)).join(''))

// Report the tightest route per category so the next phase knows where the
// headroom actually is, rather than guessing from the total.
if (ok.length) {
  line('')
  for (const k of KEYS) {
    const worst = ok.reduce((a, b) => (b.used[k] > a.used[k] ? b : a))
    const pct = ((worst.used[k] / budget.budgets[k]) * 100).toFixed(0)
    line(`  ${k.padEnd(6)} tightest: ${worst.route.padEnd(34)} ${kb(worst.used[k])}  ${pct.padStart(3)}% of budget`)
  }
}

/* --- Shared vs route JS ---------------------------------------------- */

/*
 * A single `js` number conflates two things that behave completely
 * differently: the framework baseline, which we do not write and can only
 * accept or upgrade away from, and our own client code, which we choose
 * every time. Reported together, the framework hides our growth — 96% of
 * budget looks alarming when 92 points of it are Next and React.
 *
 * `shared` is the set of chunks EVERY route loads; `route` is what a page
 * adds on top of it. Splitting them makes the budget bind harder on the
 * half we control, not softer.
 *
 * Both numbers come from lib/perf/measure.mjs.
 */

line('')
line('  JS SPLIT')
const sharedLimit = budget.budgets['js.shared']
const routeLimit = budget.budgets['js.route']
const sharedOver = sharedLimit !== undefined && sharedBytes > sharedLimit
const routeOver = routeLimit !== undefined && worstRoute.bytes > routeLimit
if (sharedLimit !== undefined) {
  line(
    `  ${sharedOver ? '✗' : '✓'} shared  ${kb(sharedBytes)} / ${kb(sharedLimit)}   framework + shared app code, every route`,
  )
  if (sharedOver) failures++
} else {
  line(`    shared  ${kb(sharedBytes)}  (no limit set)`)
}
if (routeLimit !== undefined) {
  line(
    `  ${routeOver ? '✗' : '✓'} route   ${kb(worstRoute.bytes)} / ${kb(routeLimit)}   worst single route (${worstRoute.route})`,
  )
  if (routeOver) failures++
} else {
  line(`    route   ${kb(worstRoute.bytes)}  worst: ${worstRoute.route}  (no limit set)`)
}

/* --- Deferred ------------------------------------------------------- */

const deferredLimit = budget.budgets.deferred
const deferredOver = deferredLimit !== undefined && deferred.bytes > deferredLimit

line('')
line('  DEFERRED — chunks no route loads on first paint')
if (deferred.files.length === 0) {
  line('    (none)')
} else {
  for (const f of deferred.files.slice(0, 6)) line(`    ${kb(f.size)}  ${f.name}`)
  if (deferred.files.length > 6) {
    line(`    …and ${deferred.files.length - 6} more`)
  }
}
if (deferredLimit !== undefined) {
  const pct = ((deferred.bytes / deferredLimit) * 100).toFixed(0)
  line(
    `  ${deferredOver ? '✗' : '✓'} deferred ${kb(deferred.bytes)} / ${kb(deferredLimit)}   ${pct.padStart(3)}% of budget`,
  )
  if (deferredOver) failures++
}

line('')
if (failures > 0) {
  line(`  FAIL — ${failures} route${failures === 1 ? '' : 's'} over budget`)
  line('')
  process.exit(1)
}
line('  PASS — every route within budget.')
line('')
