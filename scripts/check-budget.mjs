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

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename, sep } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const budget = JSON.parse(readFileSync(join(ROOT, 'perf.budget.json'), 'utf8'))
const APP = join(ROOT, '.next', 'server', 'app')

const gz = (buf) => gzipSync(buf, { level: 9 }).length
const CATEGORY = { '.js': 'js', '.css': 'css', '.woff2': 'font' }
const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB'
const line = (s) => process.stdout.write(s + '\n')

/**
 * Every prerendered route is discovered from the build output rather than
 * listed in config. A route that has to be added to a list by hand is a
 * route that will eventually be forgotten — and forgotten routes are
 * exactly the ones that get heavy.
 */
function discoverRoutes(dir = APP, prefix = '') {
  const out = []
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name)
    if (name.isDirectory()) {
      out.push(...discoverRoutes(full, `${prefix}/${name.name}`))
      continue
    }
    if (!name.name.endsWith('.html')) continue
    const base = name.name.replace(/\.html$/, '')
    if (base === '_global-error') continue
    out.push(base === 'index' ? prefix || '/' : `${prefix}/${base}`)
  }
  return out
}

/** Route path -> prerendered file. "/" is emitted as index.html. */
const fileFor = (route) =>
  join(APP, (route === '/' ? 'index' : route.replace(/^\//, '')) + '.html')

function measure(route) {
  const file = fileFor(route)
  if (!existsSync(file)) return { route, missing: true }

  const html = readFileSync(file)
  const used = { html: gz(html), css: 0, js: 0, font: 0 }
  const seen = new Set()
  const refs = []

  for (const m of html
    .toString()
    .matchAll(/\/_next\/static\/[^"'\s]+?\.(js|css|woff2)/g)) {
    const url = m[0]
    if (seen.has(url)) continue
    seen.add(url)
    refs.push(url)
    const asset = join(ROOT, '.next', url.replace('/_next', ''))
    if (!existsSync(asset)) continue
    const cat = CATEGORY['.' + url.split('.').pop()]
    if (!cat) continue
    const buf = readFileSync(asset)
    // woff2 carries its own compression; gzip on top is a rounding error.
    used[cat] += cat === 'font' ? buf.length : gz(buf)
  }

  used.total = used.html + used.css + used.js + used.font
  return { route, used, refs }
}

/**
 * Deferred weight.
 *
 * A dynamic import does not appear in the initial HTML, so a route can pass
 * its first-load budget while pulling half a megabyte the moment a visitor
 * clicks. "Lazy" is not "free" — it is weight moved, not weight removed.
 *
 * Everything under .next/static/chunks that no prerendered route references
 * on first load is counted here and held to its own limit.
 */
function measureDeferred(referenced) {
  const chunkDir = join(ROOT, '.next', 'static', 'chunks')
  if (!existsSync(chunkDir)) return { bytes: 0, files: [] }

  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    )

  const files = []
  let bytes = 0
  for (const abs of walk(chunkDir)) {
    if (!abs.endsWith('.js')) continue
    const url = '/_next' + abs.slice(join(ROOT, '.next').length).split(sep).join('/')
    if (referenced.has(url)) continue
    const size = gz(readFileSync(abs))
    bytes += size
    files.push({ name: basename(abs), size })
  }
  files.sort((a, b) => b.size - a.size)
  return { bytes, files }
}

const KEYS = ['html', 'css', 'js', 'font', 'total']
const routes = discoverRoutes().sort(
  (a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b),
)
const results = routes.map(measure)

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
const ok = results.filter((r) => !r.missing)
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
 */
const chunkSets = ok.map((r) => new Set((r.refs ?? []).filter((u) => u.endsWith('.js'))))
const sharedUrls = chunkSets.length
  ? [...chunkSets[0]].filter((u) => chunkSets.every((s) => s.has(u)))
  : []
const sizeOf = (url) => {
  const abs = join(ROOT, '.next', url.replace('/_next', ''))
  return existsSync(abs) ? gz(readFileSync(abs)) : 0
}
const sharedBytes = sharedUrls.reduce((n, u) => n + sizeOf(u), 0)
const sharedSet = new Set(sharedUrls)

const routeExtras = ok.map((r) => ({
  route: r.route,
  bytes: (r.refs ?? [])
    .filter((u) => u.endsWith('.js') && !sharedSet.has(u))
    .reduce((n, u) => n + sizeOf(u), 0),
}))
const worstRoute = routeExtras.reduce((a, b) => (b.bytes > a.bytes ? b : a))

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

const referenced = new Set(ok.flatMap((r) => r.refs ?? []))
const deferred = measureDeferred(referenced)
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
