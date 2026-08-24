#!/usr/bin/env node
/**
 * Release gate.
 *
 * Separate from `pnpm verify` on purpose. `verify` answers "is the code
 * correct?" and should be green all day. This answers "is this thing
 * allowed to be published?" — and it is red until the two things only the
 * author can supply are supplied.
 *
 * It reads the built output rather than the source, because what ships is
 * the output. A canonical URL that is right in the config and wrong in the
 * HTML is still wrong.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const APP = join(ROOT, '.next', 'server', 'app')

const line = (s) => process.stdout.write(s + '\n')
const blockers = []
const warnings = []

line('')
line('  RELEASE GATE')
line('  ' + '-'.repeat(70))

if (!existsSync(APP)) {
  line('  ✗ no production build — run `pnpm build`')
  line('')
  process.exit(1)
}

/* 1. The two things only the author can supply -------------------------- */

const configSrc = readFileSync(join(ROOT, 'lib', 'site.config.ts'), 'utf8')
if (/const NAME = '\[name\]'/.test(configSrc)) {
  blockers.push(
    'site.name is still the placeholder "[name]" — set NAME in lib/site.config.ts',
  )
}

const origin = process.env.NEXT_PUBLIC_SITE_URL ?? ''
if (!origin) {
  blockers.push('NEXT_PUBLIC_SITE_URL is unset — canonical URLs, sitemap and feed would advertise localhost')
} else if (origin.includes('localhost') || origin.startsWith('http://')) {
  blockers.push(`NEXT_PUBLIC_SITE_URL is "${origin}" — needs a public https origin`)
}

/* 2. The files a published site is expected to have --------------------- */

const REQUIRED = [
  ['sitemap.xml', 'sitemap.xml.body'],
  ['robots.txt', 'robots.txt.body'],
  ['feed.xml', 'feed.xml.body'],
]
for (const names of REQUIRED) {
  const found = names.some((n) => existsSync(join(APP, n)))
  if (!found) blockers.push(`missing from the build: ${names[0]}`)
}

const hasImage = (name) =>
  readdirSync(APP, { withFileTypes: true }).some(
    (e) => e.name.startsWith(name) || (e.isDirectory() && e.name === name),
  )
if (!hasImage('opengraph-image')) warnings.push('no opengraph-image in the build')
if (!hasImage('icon')) warnings.push('no icon in the build')

/* 3. Every page a crawler will see -------------------------------------- */

function htmlFiles(dir = APP, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name)
    if (e.isDirectory()) return htmlFiles(full, `${prefix}/${e.name}`)
    if (!e.name.endsWith('.html')) return []
    const base = e.name.replace(/\.html$/, '')
    if (base === '_global-error') return []
    return [{ route: base === 'index' ? prefix || '/' : `${prefix}/${base}`, file: full }]
  })
}

const pages = htmlFiles()
let checked = 0
for (const { route, file } of pages) {
  const html = readFileSync(file, 'utf8')
  checked++

  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim()
  if (!title) blockers.push(`${route} — no <title>`)

  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1]?.trim()
  if (!desc && route !== '/_not-found') {
    blockers.push(`${route} — no meta description`)
  }

  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1]
  if (!canonical && route !== '/_not-found') {
    warnings.push(`${route} — no canonical link`)
  }

  // A localhost URL baked into shipped HTML is the classic "worked on my
  // machine" deploy: crawlers follow it, and it points at nothing.
  if (/https?:\/\/localhost/.test(html)) {
    blockers.push(`${route} — localhost URL baked into the HTML`)
  }
}

/* 4. Content the author still has to write ------------------------------ */

const placeholders = []
const contentRoot = join(ROOT, 'content')
if (existsSync(contentRoot)) {
  for (const chapter of readdirSync(contentRoot)) {
    const dir = join(contentRoot, chapter)
    if (!statSync(dir).isDirectory()) continue
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.mdx')) continue
      const body = readFileSync(join(dir, f), 'utf8')
      if (/tags:\s*\[placeholder\]/.test(body)) {
        placeholders.push(`content/${chapter}/${f}`)
      }
    }
  }
}
for (const p of placeholders) warnings.push(`${p} is still a placeholder entry`)

/* --- Report ------------------------------------------------------------ */

line(`  ${checked} pages checked · origin ${origin || '(unset)'}`)
line('')
for (const w of warnings) line(`  · ${w}`)
for (const b of blockers) line(`  ✗ ${b}`)
line('  ' + '-'.repeat(70))

if (blockers.length) {
  line(`  NOT READY — ${blockers.length} blocker${blockers.length === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line(`  READY${warnings.length ? ` — with ${warnings.length} warning(s)` : ''}`)
line('')
