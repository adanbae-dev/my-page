#!/usr/bin/env node
/**
 * Copy the default locale's 404 to the asset root.
 *
 * Cloudflare's `not_found_handling: "404-page"` serves the NEAREST
 * `404.html`, searching upward from the requested path. `next build` already
 * writes `out/ko/404.html` and `out/en/404.html`, so a 404 under a locale
 * prefix is answered in that locale with no help from this script.
 *
 * What is left is a path with no locale in it at all — `/nope`, or a stale
 * link from before the locale prefixes existed. Next writes its own
 * `out/404.html` for that case: 6,999 bytes of "404: This page could not be
 * found.", which is the page this product replaced and does not want back.
 *
 * So the default locale's copy overwrites it. The root 404 is therefore
 * Korean, for the same reason `/` redirects to `/ko`: a single file cannot
 * be two languages, and the visitor can switch from the page itself.
 *
 * Runs after `next build`, and fails the build if the source is missing —
 * a silently un-copied 404 is exactly the kind of thing that ships.
 */

import { copyFileSync, existsSync, statSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const i18n = readFileSync(join(ROOT, 'lib', 'i18n', 'config.ts'), 'utf8')
const DEFAULT_LOCALE = /export const DEFAULT_LOCALE: Locale = '([a-z-]+)'/.exec(i18n)?.[1]

const out = []
const line = (s) => out.push(s)
const fail = (msg) => {
  line(`  ✗ ${msg}`)
  line('  ' + '-'.repeat(70))
  line('  FAIL — the deployed 404 would be the framework default')
  line('')
  process.stdout.write(out.join('\n') + '\n')
  process.exit(1)
}

line('')
line('  404')
line('  ' + '-'.repeat(70))

if (!DEFAULT_LOCALE) fail('could not read DEFAULT_LOCALE from lib/i18n/config.ts')

const OUT = join(ROOT, 'out')
if (!existsSync(OUT)) fail('out/ does not exist — run this after `next build`')

const src = join(OUT, DEFAULT_LOCALE, '404.html')
const dst = join(OUT, '404.html')
if (!existsSync(src)) fail(`out/${DEFAULT_LOCALE}/404.html is missing — is app/[lang]/404/page.tsx still there?`)

/**
 * The framework default is ~7 KB and renders nothing of this site. A real
 * one carries the stylesheet link and the chapter rail, so it is several
 * times that. Checking the SIZE rather than a phrase, because the phrase is
 * Next's and could change with a release, while "too small to contain the
 * page" stays true.
 */
const MIN_BYTES = 12_000
const size = statSync(src).size
if (size < MIN_BYTES) {
  fail(`out/${DEFAULT_LOCALE}/404.html is only ${size} bytes — under ${MIN_BYTES}, it cannot hold the rendered page`)
}

/* And assert it actually server-rendered. A route that calls notFound()
   exports a 38-byte <body> with everything in the RSC payload; that page
   is blank with JavaScript off. */
const html = readFileSync(src, 'utf8')
const body = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)?.[1] ?? ''
const withoutScripts = body.replace(/<script[\s\S]*?<\/script>/g, '').trim()
if (withoutScripts.length < 500) {
  fail(
    `out/${DEFAULT_LOCALE}/404.html has a ${withoutScripts.length}-byte body once scripts are removed — it renders blank without JavaScript`,
  )
}

copyFileSync(src, dst)

line(`  out/${DEFAULT_LOCALE}/404.html → out/404.html  (${size.toLocaleString()} B)`)
line(`  server-rendered body: ${withoutScripts.length.toLocaleString()} B without scripts`)
line('  ' + '-'.repeat(70))
line('  OK — an unmatched path gets this product\'s 404, with JavaScript off.')
line('')
process.stdout.write(out.join('\n') + '\n')
