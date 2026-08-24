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

import { readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const budget = JSON.parse(readFileSync(join(ROOT, 'perf.budget.json'), 'utf8'))
const APP = join(ROOT, '.next', 'server', 'app')

const gz = (buf) => gzipSync(buf, { level: 9 }).length
const CATEGORY = { '.js': 'js', '.css': 'css', '.woff2': 'font' }
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB'
const line = (s) => process.stdout.write(s + '\n')

/** Route path -> prerendered file. "/" is emitted as index.html. */
const fileFor = (route) =>
  join(APP, (route === '/' ? 'index' : route.replace(/^\//, '')) + '.html')

function measure(route) {
  const file = fileFor(route)
  if (!existsSync(file)) return { route, missing: true }

  const html = readFileSync(file)
  const used = { html: gz(html), css: 0, js: 0, font: 0 }
  const seen = new Set()

  for (const m of html
    .toString()
    .matchAll(/\/_next\/static\/[^"'\s]+?\.(js|css|woff2)/g)) {
    const url = m[0]
    if (seen.has(url)) continue
    seen.add(url)
    const asset = join(ROOT, '.next', url.replace('/_next', ''))
    if (!existsSync(asset)) continue
    const cat = CATEGORY['.' + url.split('.').pop()]
    if (!cat) continue
    const buf = readFileSync(asset)
    // woff2 carries its own compression; gzip on top is a rounding error.
    used[cat] += cat === 'font' ? buf.length : gz(buf)
  }

  used.total = used.html + used.css + used.js + used.font
  return { route, used }
}

const KEYS = ['html', 'css', 'js', 'font', 'total']
const results = budget.routes.map(measure)

line('')
line(`  PERFORMANCE BUDGET — gzip transfer, per route`)
line('  ' + '-'.repeat(72))
line(
  '  route'.padEnd(20) +
    KEYS.map((k) => k.padStart(10)).join('') +
    '   verdict',
)
line('  ' + '-'.repeat(72))

let failures = 0
for (const r of results) {
  if (r.missing) {
    line(`  ${r.route.padEnd(18)} not prerendered — run \`pnpm build\``)
    failures++
    continue
  }
  const over = KEYS.filter((k) => r.used[k] > budget.budgets[k])
  if (over.length) failures++
  line(
    `  ${r.route.padEnd(18)}` +
      KEYS.map((k) => {
        const s = (r.used[k] / 1024).toFixed(1)
        return (over.includes(k) ? `!${s}` : s).padStart(10)
      }).join('') +
      `   ${over.length ? '✗ ' + over.join(', ') : '✓'}`,
  )
}

line('  ' + '-'.repeat(72))
line('  limit'.padEnd(20) + KEYS.map((k) => (budget.budgets[k] / 1024).toFixed(1).padStart(10)).join(''))

// Report the tightest route per category so the next phase knows where the
// headroom actually is, rather than guessing from the total.
const ok = results.filter((r) => !r.missing)
if (ok.length) {
  line('')
  for (const k of KEYS) {
    const worst = ok.reduce((a, b) => (b.used[k] > a.used[k] ? b : a))
    const pct = ((worst.used[k] / budget.budgets[k]) * 100).toFixed(0)
    line(`  ${k.padEnd(6)} tightest: ${worst.route.padEnd(16)} ${kb(worst.used[k])}  ${pct.padStart(3)}% of budget`)
  }
}

line('')
if (failures > 0) {
  line(`  FAIL — ${failures} route${failures === 1 ? '' : 's'} over budget`)
  line('')
  process.exit(1)
}
line('  PASS — every route within budget.')
line('')
