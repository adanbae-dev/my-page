#!/usr/bin/env node
/**
 * Content invariants.
 *
 * This deliberately does NOT re-validate frontmatter types. lib/content/schema.ts
 * already does that, and it does it during `next build` — invalid frontmatter
 * fails the build rather than rendering an empty page. Restating those rules
 * here would create a second source of truth that drifts.
 *
 * What it checks is everything the loader cannot see from inside one file:
 * files in the wrong place, slugs that will not survive a URL, dates in the
 * future, and summaries too long to be usable as a meta description.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import matter from 'gray-matter'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content')

// Chapters are read out of lib/sections.ts so this file cannot disagree with
// the route table about which chapters exist.
const sectionsSrc = readFileSync(join(ROOT, 'lib', 'sections.ts'), 'utf8')
const idsMatch = /export const SECTION_IDS = \[([^\]]+)\]/.exec(sectionsSrc)
if (!idsMatch) {
  process.stderr.write('\n  Could not read SECTION_IDS from lib/sections.ts\n\n')
  process.exit(1)
}
const CHAPTERS = [...idsMatch[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1])

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/* Translations are siblings: `slug.en.mdx` beside `slug.mdx`. Read the locale
   list from lib/i18n/config.ts so this cannot disagree with the app. */
const i18nSrc = readFileSync(join(ROOT, 'lib', 'i18n', 'config.ts'), 'utf8')
const LOCALES = [
  ...(/export const LOCALES = \[([^\]]+)\]/.exec(i18nSrc)?.[1] ?? '').matchAll(
    /'([a-z-]+)'/g,
  ),
].map((m) => m[1])
const DEFAULT_LOCALE = /export const DEFAULT_LOCALE: Locale = '([a-z-]+)'/.exec(i18nSrc)?.[1]
const translations = Object.fromEntries(LOCALES.map((l) => [l, 0]))
const MAX_SUMMARY = 160
const today = new Date().toISOString().slice(0, 10)

const line = (s) => process.stdout.write(s + '\n')
const problems = []
const notes = []
let count = 0
let drafts = 0

line('')
line('  CONTENT GUARD')
line('  ' + '-'.repeat(70))

if (!existsSync(CONTENT)) {
  line('  ✗ no content/ directory')
  process.exit(1)
}

// 1. Nothing outside a known chapter directory.
for (const name of readdirSync(CONTENT)) {
  const full = join(CONTENT, name)
  if (!statSync(full).isDirectory()) {
    problems.push(`content/${name} — loose file; content lives in a chapter directory`)
    continue
  }
  if (!CHAPTERS.includes(name)) {
    problems.push(`content/${name}/ — not a chapter (${CHAPTERS.join(', ')})`)
  }
}

const toISO = (v) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === 'string' ? v : ''

for (const chapter of CHAPTERS) {
  const dir = join(CONTENT, chapter)
  if (!existsSync(dir)) {
    notes.push(`content/${chapter}/ does not exist yet — chapter renders empty`)
    continue
  }

  const seen = new Set()
  const files = readdirSync(dir)

  for (const f of files) {
    const rel = `content/${chapter}/${f}`

    if (!f.endsWith('.mdx')) {
      problems.push(`${rel} — only .mdx files are read; this one is ignored silently`)
      continue
    }

    count++
    const slug = f.replace(/\.mdx$/, '')

    // 2. Slugs must survive being a URL and stay stable across filesystems.
    if (!SLUG.test(slug)) {
      problems.push(`${rel} — slug must be lowercase-kebab-case`)
    }
    if (seen.has(slug.toLowerCase())) {
      problems.push(`${rel} — duplicate slug (case-insensitive) in this chapter`)
    }
    seen.add(slug.toLowerCase())

    const { data } = matter(readFileSync(join(dir, f), 'utf8'))

    // 3. A future date on a published entry is almost always a typo, and it
    //    silently sorts the entry to the top of every list.
    const date = toISO(data.date)
    if (date && date > today && !data.draft) {
      problems.push(`${rel} — date ${date} is in the future; mark it draft or fix it`)
    }

    // 4. The summary is reused as the meta description.
    if (typeof data.summary === 'string' && data.summary.length > MAX_SUMMARY) {
      problems.push(
        `${rel} — summary is ${data.summary.length} chars; keep it under ${MAX_SUMMARY}`,
      )
    }

    if (data.draft === true) {
      drafts++
      notes.push(`${rel} — draft; visible in dev, never published`)
    }
  }
}

line(`  ${count} entr${count === 1 ? 'y' : 'ies'} across ${CHAPTERS.length} chapters` +
     (drafts ? `, ${drafts} draft` : ''))
for (const n of notes) line(`  · ${n}`)
for (const p of problems) line(`  ✗ ${p}`)

line('  ' + '-'.repeat(70))
if (problems.length) {
  line(`  FAIL — ${problems.length} content problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line('  PASS — content is where it says it is.')
line('')
