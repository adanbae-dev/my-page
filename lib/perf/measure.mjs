/**
 * Build measurement, shared by the gate and the snapshot writer.
 *
 * This used to live entirely inside scripts/check-budget.mjs. It moved here
 * for the same reason lib/git/parse.mjs exists: two things now need the
 * numbers — the gate that fails a build over them, and the script that writes
 * them into a file the site publishes. Two copies of a measurement is two
 * measurements, and the day they disagree the page is lying while the gate
 * passes.
 *
 * Plain ESM with no TypeScript, so a Node script can import it directly and
 * lib/perf.ts can read the file it produces.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename, sep } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const APP = join(ROOT, '.next', 'server', 'app')

export const CATEGORY_KEYS = ['html', 'css', 'js', 'font', 'total']

export const gz = (buf) => gzipSync(buf, { level: 9 }).length
const CATEGORY = { '.js': 'js', '.css': 'css', '.woff2': 'font' }

/**
 * Every prerendered route is discovered from the build output rather than
 * listed in config. A route that has to be added to a list by hand is a
 * route that will eventually be forgotten — and forgotten routes are
 * exactly the ones that get heavy.
 */
export function discoverRoutes(dir = APP, prefix = '') {
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

export function measure(route) {
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
export function measureDeferred(referenced) {
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

const sizeOf = (url) => {
  const abs = join(ROOT, '.next', url.replace('/_next', ''))
  return existsSync(abs) ? gz(readFileSync(abs)) : 0
}

/**
 * The whole build, measured once.
 *
 * `shared` is the set of chunks EVERY route loads; each route's `extra` is
 * what that page adds on top of it. Splitting them makes the budget bind
 * harder on the half we write, not softer.
 */
export function measureBuild() {
  const routes = discoverRoutes().sort(
    (a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b),
  )
  const results = routes.map(measure)
  const ok = results.filter((r) => !r.missing)

  const chunkSets = ok.map(
    (r) => new Set((r.refs ?? []).filter((u) => u.endsWith('.js'))),
  )
  const sharedUrls = chunkSets.length
    ? [...chunkSets[0]].filter((u) => chunkSets.every((s) => s.has(u)))
    : []
  const sharedBytes = sharedUrls.reduce((n, u) => n + sizeOf(u), 0)
  const sharedSet = new Set(sharedUrls)

  const routeExtras = ok.map((r) => ({
    route: r.route,
    bytes: (r.refs ?? [])
      .filter((u) => u.endsWith('.js') && !sharedSet.has(u))
      .reduce((n, u) => n + sizeOf(u), 0),
  }))
  const worstRoute = routeExtras.length
    ? routeExtras.reduce((a, b) => (b.bytes > a.bytes ? b : a))
    : { route: '', bytes: 0 }

  const referenced = new Set(ok.flatMap((r) => r.refs ?? []))
  const deferred = measureDeferred(referenced)

  return { routes, results, ok, sharedBytes, routeExtras, worstRoute, deferred }
}
