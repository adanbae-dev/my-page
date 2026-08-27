import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'

import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/config'
import { SECTION_IDS, type SectionId } from '@/lib/sections'
import { TOPIC_IDS, type TopicId } from '@/lib/topics'
import { ContentError, toEntry, type Entry, type Log, type Work } from './schema'

/**
 * Content loader. Server-only: it touches the filesystem, so importing it
 * from a Client Component fails the build rather than shipping `fs`.
 *
 * Everything is read once at build time — every route in this product is
 * statically prerendered, so there is no request-time cost and no cache to
 * invalidate. Invalid frontmatter throws, which fails `next build`: bad
 * content cannot reach production by being merely unrendered.
 */

const CONTENT_DIR = join(process.cwd(), 'content')

/**
 * Translations are SIBLINGS, not a parallel tree.
 *
 *   content/think/why-contrast-came-first.mdx       the original (ko)
 *   content/think/why-contrast-came-first.en.mdx    a translation
 *
 * A `content/{locale}/{chapter}/` layout was the obvious alternative and is
 * worse here, because partial translation is the expected steady state, not a
 * transitional one: 13 entries of authored Korean prose will not all be
 * translated, and some never should be. With siblings, `ls` answers "what is
 * missing" — with a parallel tree you have to diff two directories.
 */
const LOCALE_SUFFIX = /\.([a-z]{2})$/

/** `foo.en` -> { slug: 'foo', locale: 'en' } · `foo` -> { slug: 'foo', locale: default } */
function splitName(base: string): { slug: string; locale: Locale } | null {
  const m = LOCALE_SUFFIX.exec(base)
  if (!m) return { slug: base, locale: DEFAULT_LOCALE }
  const tag = m[1]!
  // A slug may legitimately end in a two-letter segment that is not a locale
  // (`.js`, `.io`). Only a known locale counts as a translation marker.
  if (!isLocale(tag)) return { slug: base, locale: DEFAULT_LOCALE }
  return { slug: base.slice(0, -m[0].length), locale: tag }
}

/** One entry plus the language its text is actually in. */
export type LocalisedEntry = Entry & {
  readonly locale: Locale
  /** False when this is the original standing in for a missing translation. */
  readonly translated: boolean
}

type Loaded = { entry: Entry; locale: Locale }

function readChapter(chapter: SectionId): Loaded[] {
  const dir = join(CONTENT_DIR, chapter)
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const base = f.replace(/\.mdx$/, '')
      const parsed = splitName(base)
      if (!parsed) throw new ContentError(`content/${chapter}/${f}`, 'unreadable filename')
      const raw = readFileSync(join(dir, f), 'utf8')
      const { data, content } = matter(raw)
      return {
        locale: parsed.locale,
        entry: toEntry({
          file: `content/${chapter}/${f}`,
          chapter,
          slug: parsed.slug,
          data: data as Record<string, unknown>,
          body: content.trim(),
        }),
      }
    })
}

/** Newest first. Ties broken by slug so the order is stable across builds. */
const byDateDesc = (a: Entry, b: Entry): number =>
  b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)

let cache: readonly Loaded[] | null = null

function allLoaded(): readonly Loaded[] {
  if (cache) return cache
  const loaded = SECTION_IDS.flatMap(readChapter)

  // A collision would make one entry unreachable and the other ambiguous.
  // The key includes the locale now: `foo.mdx` and `foo.en.mdx` are the same
  // entry in two languages, not a duplicate.
  const seen = new Set<string>()
  for (const { entry, locale } of loaded) {
    const key = `${locale}:${entry.chapter}/${entry.slug}`
    if (seen.has(key)) {
      throw new ContentError(key, 'duplicate slug for this locale')
    }
    seen.add(key)
  }

  // A translation with no original is a broken link waiting to happen: the
  // entry would exist in English and 404 in Korean.
  const originals = new Set(
    loaded
      .filter((l) => l.locale === DEFAULT_LOCALE)
      .map((l) => `${l.entry.chapter}/${l.entry.slug}`),
  )
  for (const { entry, locale } of loaded) {
    if (locale === DEFAULT_LOCALE) continue
    const key = `${entry.chapter}/${entry.slug}`
    if (!originals.has(key)) {
      throw new ContentError(
        `content/${key}.${locale}.mdx`,
        `translation without an original — ${key}.mdx does not exist`,
      )
    }
  }

  cache = loaded.sort((a, b) => byDateDesc(a.entry, b.entry))
  return cache
}

/** Drafts are authored freely and never published. */
const isPublished = (e: Entry): boolean =>
  !e.draft || process.env.NODE_ENV === 'development'

/**
 * Resolve one entry for one locale, falling back to the original.
 *
 * The fallback is VISIBLE, not silent: `translated: false` travels with the
 * entry so the page can say "this exists only in Korean". Hiding untranslated
 * entries from a locale was the alternative and it breaks TRACE's definition
 * — an archive that is a different size in each language is not a trace of
 * the work, it is a filtered view of it.
 */
function resolve(
  loaded: readonly Loaded[],
  chapter: SectionId,
  slug: string,
  locale: Locale,
): LocalisedEntry | undefined {
  const wanted = loaded.find(
    (l) => l.locale === locale && l.entry.chapter === chapter && l.entry.slug === slug,
  )
  if (wanted) return { ...wanted.entry, locale, translated: true }

  const original = loaded.find(
    (l) =>
      l.locale === DEFAULT_LOCALE && l.entry.chapter === chapter && l.entry.slug === slug,
  )
  if (!original) return undefined
  return { ...original.entry, locale: DEFAULT_LOCALE, translated: locale === DEFAULT_LOCALE }
}

/** Every distinct entry, once, resolved for this locale. Newest first. */
function resolvedAll(locale: Locale): readonly LocalisedEntry[] {
  const loaded = allLoaded()
  const out: LocalisedEntry[] = []
  for (const { entry, locale: fileLocale } of loaded) {
    // Iterate the originals only — they define which entries exist.
    if (fileLocale !== DEFAULT_LOCALE) continue
    const r = resolve(loaded, entry.chapter, entry.slug, locale)
    if (r && isPublished(r)) out.push(r)
  }
  return out
}

export function entriesFor(chapter: SectionId, locale: Locale): readonly LocalisedEntry[] {
  return resolvedAll(locale).filter((e) => e.chapter === chapter)
}

export function getEntry(
  chapter: SectionId,
  slug: string,
  locale: Locale,
): LocalisedEntry | undefined {
  const e = resolve(allLoaded(), chapter, slug, locale)
  return e && isPublished(e) ? e : undefined
}

export function publishedEntries(locale: Locale = DEFAULT_LOCALE): readonly LocalisedEntry[] {
  return resolvedAll(locale)
}

/** How much of the archive exists in each locale — reported by the gate. */
export function translationCoverage(): Record<Locale, { translated: number; total: number }> {
  const loaded = allLoaded()
  const total = loaded.filter((l) => l.locale === DEFAULT_LOCALE).length
  const out = {} as Record<Locale, { translated: number; total: number }>
  for (const l of ['ko', 'en'] as const) {
    out[l] = { translated: loaded.filter((x) => x.locale === l).length, total }
  }
  return out
}

/**
 * TRACE is the archive of everything, not a fifth pile of posts.
 *
 * It merges its own log entries — the abandoned attempts and changed minds
 * that never became a THINK note or a MAKE case — with every other chapter's
 * entries, in one chronological stream. That is what makes it a trace rather
 * than a category: the record is derived from the work, not maintained
 * alongside it.
 */
export function archive(locale: Locale): readonly LocalisedEntry[] {
  return publishedEntries(locale)
}

export const isWork = (e: Entry): e is Work => e.chapter === 'make'
export const isLog = (e: Entry): e is Log => e.chapter === 'trace'

/**
 * Every (locale, chapter, slug) that will render, for generateStaticParams.
 *
 * The cross product is deliberate: an entry with no translation still has an
 * English route, showing the original with a notice. Emitting only translated
 * combinations would 404 the English URL of an entry that plainly exists.
 */
export function allParams(): { lang: Locale; section: SectionId; slug: string }[] {
  const locales = ['ko', 'en'] as const
  return locales.flatMap((lang) =>
    publishedEntries(lang).map((e) => ({ lang, section: e.chapter, slug: e.slug })),
  )
}

/** Previous / next entry within the same chapter, in display order. */
export function entryNeighbours(
  chapter: SectionId,
  slug: string,
  locale: Locale,
): { newer: LocalisedEntry | undefined; older: LocalisedEntry | undefined } {
  const list = entriesFor(chapter, locale)
  const i = list.findIndex((e) => e.slug === slug)
  if (i === -1) return { newer: undefined, older: undefined }
  // The list is newest-first, so the previous index is the newer entry.
  return { newer: list[i - 1], older: list[i + 1] }
}

/* ------------------------------------------------------------------ */
/* Topics — the browsable axis                                         */
/* ------------------------------------------------------------------ */

/** Every published entry carrying this topic, newest first, across chapters. */
export function entriesForTopic(
  topic: TopicId,
  locale: Locale,
): readonly LocalisedEntry[] {
  return publishedEntries(locale).filter((e) => e.topics.includes(topic))
}

/** How many entries each topic has, for counts beside the filter. */
export function topicCounts(locale: Locale): Readonly<Record<TopicId, number>> {
  const out = {} as Record<TopicId, number>
  for (const t of TOPIC_IDS) out[t] = 0
  for (const e of publishedEntries(locale)) {
    for (const t of e.topics) out[t] += 1
  }
  return out
}

/**
 * (locale, topic) pairs to prerender.
 *
 * Only topics that actually have entries. An empty topic page is a dead end
 * a crawler indexes and a reader bounces off — and with a controlled
 * vocabulary an empty one means the vocabulary is ahead of the writing, which
 * is a content problem rather than a routing one.
 */
export function allTopicParams(): { lang: Locale; topic: TopicId }[] {
  const locales = ['ko', 'en'] as const
  return locales.flatMap((lang) =>
    TOPIC_IDS.filter((t) => entriesForTopic(t, lang).length > 0).map((topic) => ({
      lang,
      topic,
    })),
  )
}
