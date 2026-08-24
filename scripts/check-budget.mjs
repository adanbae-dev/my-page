#!/usr/bin/env node
/**
 * Performance budget guard.
 *
 * Walks the prerendered HTML for the route, collects every static asset it
 * actually references, measures gzip transfer size, and fails if any
 * category — or the total — is over the number agreed in perf.budget.json.
 *
 * Run after `pnpm build`.
 */

import { readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const budget = JSON.parse(readFileSync(join(ROOT, 'perf.budget.json'), 'utf8'))

const HTML = join(ROOT, '.next', 'server', 'app', 'index.html')
if (!existsSync(HTML)) {
  process.stderr.write('\n  No production build found. Run `pnpm build` first.\n\n')
  process.exit(1)
}

const html = readFileSync(HTML)
const gz = (buf) => gzipSync(buf, { level: 9 }).length

const CATEGORY = { '.js': 'js', '.css': 'css', '.woff2': 'font' }

const assets = new Map()
for (const m of html.toString().matchAll(/\/_next\/static\/[^"'\s]+?\.(js|css|woff2)/g)) {
  const url = m[0]
  const file = join(ROOT, '.next', url.replace('/_next', ''))
  if (existsSync(file)) assets.set(url, file)
}

const used = { html: gz(html), css: 0, js: 0, font: 0 }
const rows = []

for (const [url, file] of assets) {
  const ext = '.' + url.split('.').pop()
  const cat = CATEGORY[ext]
  if (!cat) continue
  const buf = readFileSync(file)
  // woff2 carries its own compression; gzip on top is a rounding error.
  const size = cat === 'font' ? buf.length : gz(buf)
  used[cat] += size
  rows.push({ cat, name: basename(url), size })
}

used.total = used.html + used.css + used.js + used.font

const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB'
const line = (s) => process.stdout.write(s + '\n')

line('')
line(`  PERFORMANCE BUDGET — route ${budget.route}  (gzip transfer)`)
line('  ' + '-'.repeat(60))

rows.sort((a, b) => b.size - a.size)
for (const r of rows) line(`      ${r.cat.padEnd(5)} ${kb(r.size)}   ${r.name}`)

line('  ' + '-'.repeat(60))

let over = 0
for (const key of ['html', 'css', 'js', 'font', 'total']) {
  const limit = budget.budgets[key]
  const actual = used[key]
  const ok = actual <= limit
  if (!ok) over++
  const pct = ((actual / limit) * 100).toFixed(0).padStart(3)
  line(
    `  ${ok ? '✓' : '✗'} ${key.padEnd(6)} ${kb(actual)} / ${kb(limit)}   ${pct}% of budget`,
  )
}

line('  ' + '-'.repeat(60))
if (over > 0) {
  line(`  FAIL — ${over} budget${over === 1 ? '' : 's'} exceeded`)
  line('')
  process.exit(1)
}
line('  PASS — within budget.')
line('')
