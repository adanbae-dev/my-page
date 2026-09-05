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
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { contentSecurityPolicy, ANALYTICS_SCRIPT } from '../lib/csp.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const APP = join(ROOT, '.next', 'server', 'app')

/* Locales are read out of lib/i18n/config.ts rather than restated here, the
   same way check-content.mjs reads SECTION_IDS out of lib/sections.ts. A
   gate with its own copy of the list stops agreeing with the app. */
const LOCALE_TAGS = (() => {
  const src = readFileSync(join(ROOT, 'lib', 'i18n', 'config.ts'), 'utf8')
  const m = /export const LOCALES = \[([^\]]+)\]/.exec(src)
  if (!m) {
    process.stderr.write('\n  Could not read LOCALES from lib/i18n/config.ts\n\n')
    process.exit(1)
  }
  return [...m[1].matchAll(/'([a-z-]+)'/g)].map((x) => x[1])
})()

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

/* 2. The production CSP -------------------------------------------------- */

// `'unsafe-eval'` is what React's development build needs and what nothing in
// production needs. lib/csp.mjs adds it conditionally; this asserts the
// condition actually holds, because a comment saying "dev only" is not a
// mechanism. Both sides read the same function, so they cannot disagree.
{
  const prod = contentSecurityPolicy({ dev: false })
  const dev = contentSecurityPolicy({ dev: true })

  if (prod.includes('unsafe-eval')) {
    blockers.push("production CSP contains 'unsafe-eval'")
  }
  if (!dev.includes('unsafe-eval')) {
    warnings.push(
      "development CSP has no 'unsafe-eval' — React's dev build will log a console error on every load",
    )
  }
  for (const required of [
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    'upgrade-insecure-requests',
  ]) {
    if (!prod.includes(required)) blockers.push(`production CSP is missing: ${required}`)
  }

  /* THE SET OF EXTERNAL ORIGINS IS EXACTLY ONE.
   *
   * `script-src` admits Cloudflare's analytics beacon, and that hole was
   * opened on purpose — see lib/csp.mjs for the trade. What this asserts is
   * that it stays the ONLY one. A policy is not weakened by its first
   * documented exception; it is weakened by the second one nobody noticed.
   *
   * Matching every `scheme://host` in the whole policy rather than only in
   * `script-src`, so a host appearing in a directive nobody thought to check
   * — connect-src, img-src, font-src — still trips this. */
  const ALLOWED_ORIGINS = [ANALYTICS_SCRIPT]
  const found = prod.match(/https?:\/\/[^\s;]+/g) ?? []
  for (const origin of found) {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      blockers.push(`production CSP admits an undeclared external origin: ${origin}`)
    }
  }
  for (const expected of ALLOWED_ORIGINS) {
    if (!found.includes(expected)) {
      /* Not a blocker. Removing the beacon is a legitimate decision and the
         site works without it; this only says the two files disagree. */
      warnings.push(`lib/csp.mjs declares ${expected} but the production policy does not carry it`)
    }
  }

  /* The dev policy gets no external origin at all. It is the policy a
     developer reads most often, and a host sitting in it teaches that the
     site talks to that host in every environment. */
  const devExternal = dev.match(/https?:\/\/[^\s;]+/g) ?? []
  if (devExternal.length) {
    blockers.push(`development CSP admits an external origin: ${devExternal.join(', ')}`)
  }
}

/* 3. The files a published site is expected to have --------------------- */

const REQUIRED = [
  ['sitemap.xml', 'sitemap.xml.body'],
  ['robots.txt', 'robots.txt.body'],
  // Derived from the content, so it is only ever missing because the route
  // stopped being prerendered — which is silent otherwise.
  ['llms.txt', 'llms.txt.body'],
]
for (const names of REQUIRED) {
  const found = names.some((n) => existsSync(join(APP, n)))
  if (!found) blockers.push(`missing from the build: ${names[0]}`)
}

/* The feed moved under the locale segment, so there is one per language and
   none at the root. Checked per locale rather than once: a build that
   prerendered only the default locale's feed would have passed the old
   check while shipping a dead URL in every English page's <link>. */
for (const tag of LOCALE_TAGS) {
  const found = [`${tag}/feed.xml`, `${tag}/feed.xml.body`].some((n) =>
    existsSync(join(APP, n)),
  )
  if (!found) blockers.push(`missing from the build: /${tag}/feed.xml`)
}

/* Metadata images sit wherever their file convention sits, and
   opengraph-image moved under the locale segment when the tree did — a
   card image belongs to a language. Searched rather than assumed: this
   check reported "no opengraph-image" while every page had one. */
const hasImage = (name, dir = APP, depth = 0) => {
  if (depth > 3) return false
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(name)) return true
    if (e.isDirectory() && hasImage(name, join(dir, e.name), depth + 1)) return true
  }
  return false
}
if (!hasImage('opengraph-image')) warnings.push('no opengraph-image in the build')
if (!hasImage('icon')) warnings.push('no icon in the build')

/* 4. Every page a crawler will see -------------------------------------- */

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

  /*
   * Length, not just presence.
   *
   * A title and a description that exist but do not fit are a silent defect:
   * the page indexes, the snippet is cut mid-word, and nothing in the build
   * says so. These were all measured on this site before the limits went in —
   * /en/think shipped a 179-character description, and eight topic pages
   * shipped descriptions of 22 to 33 characters, which is the blurb alone and
   * tells a searcher nothing.
   *
   * WARNINGS, not blockers. The numbers are conventions for how much a result
   * page renders, not a specification, and Korean occupies more pixels per
   * character than Latin so the same count truncates sooner. A gate that fails
   * a deploy over a snippet is a gate that gets disabled.
   */
  if (title && title.length > 60) {
    warnings.push(`${route} — title is ${title.length} chars, over 60`)
  }
  if (desc && route !== '/_not-found') {
    if (desc.length > 160) {
      warnings.push(`${route} — description is ${desc.length} chars, over 160`)
    } else if (desc.length < 50) {
      warnings.push(`${route} — description is only ${desc.length} chars`)
    }
  }

  // A multilingual site that does not declare its alternates reads to a
  // crawler as duplicate content in two places rather than one page in two
  // languages. Next emits the attribute as `hrefLang`; HTML attributes are
  // case-insensitive, so the match has to be too.
  if (route !== '/_not-found' && route !== '/_global-error') {
    const alts = [...html.matchAll(/rel="alternate"\s+hreflang="([^"]+)"/gi)].map(
      (m) => m[1].toLowerCase(),
    )
    for (const expected of LOCALE_TAGS) {
      if (!alts.includes(expected)) {
        blockers.push(`${route} — no hreflang alternate for "${expected}"`)
      }
    }
    /* x-default names the fallback for a visitor whose language matches none
       of the alternates. Without it a crawler has to guess which of two equal
       alternates is the default, and this site does have an answer. */
    if (!alts.includes('x-default')) {
      blockers.push(`${route} — no x-default hreflang alternate`)
    }
  }

  // A localhost URL baked into shipped HTML is the classic "worked on my
  // machine" deploy: crawlers follow it, and it points at nothing.
  //
  // One page legitimately carries one. `/_not-found` is emitted by Next
  // without a layout — the root layout now lives under app/[lang] — so it has
  // no `metadataBase` to resolve og:image against and falls back to
  // localhost. That is harmless ONLY because the page is noindex, so the
  // exemption demands proof of exactly that rather than trusting the route
  // name: an indexable page with a localhost URL is still a blocker.
  if (/https?:\/\/localhost/.test(html)) {
    const noindex = /<meta name="robots" content="[^"]*noindex/.test(html)
    if (noindex) {
      warnings.push(`${route} — localhost URL in HTML, tolerated because the page is noindex`)
    } else {
      blockers.push(`${route} — localhost URL baked into the HTML`)
    }
  }
}

/* 5. Content the author still has to write ------------------------------ */

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

/* 6. The build record ---------------------------------------------------- */

/**
 * Two questions about lib/git.data.json, and they are not the same question.
 *
 * IS IT SAFE?   The parser does not collect authors, so an email address in
 *               the snapshot means the projection regressed and a personal
 *               address is about to be published as static HTML on every
 *               route that shows a commit. That is a blocker.
 *
 * IS IT CURRENT? The snapshot cannot contain the commit that writes it, so it
 *               is ALWAYS at least one commit behind. One is structural; more
 *               than that means `pnpm sync:git` was not run, and /build will
 *               quietly under-report the work. That is a warning, because a
 *               slightly stale record is still a true record.
 */
{
  const snapshotFile = join(ROOT, 'lib', 'git.data.json')

  if (!existsSync(snapshotFile)) {
    warnings.push('no lib/git.data.json — /build falls back to live git only (run `pnpm sync:git`)')
  } else {
    const raw = readFileSync(snapshotFile, 'utf8')

    const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(raw)
    if (email) {
      blockers.push(`lib/git.data.json contains an email address (${email[0]}) — it would ship in static HTML`)
    }

    let snap = null
    try {
      snap = JSON.parse(raw)
    } catch {
      blockers.push('lib/git.data.json is not valid JSON')
    }

    if (snap && typeof snap.head === 'string') {
      const git = (args) =>
        execFileSync('git', args, {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()

      /*
       * Each question gets its OWN error handling, and that is the point.
       *
       * A single try/catch around all of this was written first and was
       * WRONG: `git cat-file` on a sha that does not exist throws, the broad
       * catch swallowed it, and a snapshot pointing at a bogus commit was
       * reported as "no git repository" — the gate stayed silent on exactly
       * the case it exists to catch. Verified by deliberately corrupting the
       * head and watching nothing happen.
       */
      let shallow = null
      try {
        shallow = git(['rev-parse', '--is-shallow-repository']) !== 'false'
      } catch {
        // No git binary, or not a repository. Deploying from a tarball is a
        // legitimate way to ship; it just cannot be audited from here.
        line('  · no readable git repository — snapshot freshness not checked')
      }

      if (shallow === true) {
        // A shallow clone cannot answer any of this. Say so rather than
        // reporting a distance that is an artefact of the clone depth.
        line(`  · shallow clone — snapshot freshness not checked (head ${snap.head})`)
      } else if (shallow === false) {
        let type = null
        try {
          type = git(['cat-file', '-t', snap.head])
        } catch {
          type = null
        }

        if (type !== 'commit') {
          blockers.push(
            `lib/git.data.json head ${snap.head} is not a commit in this repository — regenerate with \`pnpm sync:git\``,
          )
        } else {
          // An ancestor check, not just a distance: a snapshot taken on
          // another branch or before a rebase would otherwise look merely
          // stale, and /build would cite commits this history does not have.
          let ancestor = true
          try {
            execFileSync('git', ['merge-base', '--is-ancestor', snap.head, 'HEAD'], {
              cwd: ROOT,
              stdio: 'ignore',
            })
          } catch {
            ancestor = false
          }

          if (!ancestor) {
            blockers.push(
              `lib/git.data.json head ${snap.head} is not an ancestor of HEAD — regenerate with \`pnpm sync:git\``,
            )
          } else {
            const behind = Number.parseInt(git(['rev-list', '--count', `${snap.head}..HEAD`]), 10)
            if (Number.isFinite(behind) && behind > 1) {
              warnings.push(
                `lib/git.data.json is ${behind} commits behind HEAD — run \`pnpm sync:git\``,
              )
            }
          }
        }

/* --- The published weight ------------------------------------------- */

/*
 * The site states its own gzip size on every page it can. That number is a
 * measurement, and a measurement that has drifted from the thing it measures
 * is worse than no number at all — it carries the authority of having been
 * measured while being wrong, and nobody reading the page can tell.
 *
 * Warning rather than blocker, and deliberately: a stale figure is a wrong
 * sentence on a page, not a broken deploy, and a gate that blocks a release
 * over a reporting script is a gate that gets bypassed. The routes check is
 * the one that matters — a snapshot missing routes the build now has means new
 * pages are publishing nothing at all.
 */
{
  const snapFile = join(ROOT, 'lib', 'perf.data.json')
  if (!existsSync(snapFile)) {
    warnings.push('lib/perf.data.json is missing — run `pnpm sync:perf`')
  } else {
    try {
      const snap = JSON.parse(readFileSync(snapFile, 'utf8'))
      const known = Object.keys(snap.routes ?? {})
      if (known.length === 0) {
        blockers.push('lib/perf.data.json has no routes — regenerate with `pnpm sync:perf`')
      } else {
        const built = pages.map((p) => p.route)
        const missing = built.filter(
          (r) => r !== '/_not-found' && r !== '/_global-error' && !known.includes(r),
        )
        if (missing.length > 0) {
          warnings.push(
            `lib/perf.data.json has no weight for ${missing.length} route(s) in this build ` +
              `(${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ', …' : ''}) — run \`pnpm sync:perf\``,
          )
        }
        let headSha = ''
        try {
          headSha = git(['rev-parse', '--short=7', 'HEAD']).trim()
        } catch {
          headSha = ''
        }
        if (snap.head && headSha && snap.head !== headSha) {
          warnings.push(
            `lib/perf.data.json measures ${snap.head}, HEAD is ${headSha} — run \`pnpm sync:perf\``,
          )
        }
      }
    } catch (err) {
      blockers.push(`lib/perf.data.json is unreadable — ${err.message}`)
    }
  }
}
      }
    }
  }
}

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
