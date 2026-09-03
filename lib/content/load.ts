import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'

import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/config'
import { memoStatic } from '@/lib/memo'
import { SECTION_IDS, type SectionId } from '@/lib/sections'
import { TOPIC_IDS, type TopicId } from '@/lib/topics'
import {
  ContentError,
  toEli5,
  toEntry,
  type Eli5,
  type Entry,
  type Log,
  type Work,
} from './schema'

/**
 * Content loader. Server-only: it touches the filesystem, so importing it
 * from a Client Component fails the build rather than shipping `fs`.
 *
 * Everything is read once per build — every route in this product is
 * statically prerendered, so there is no request-time cost in production. The
 * read is memoised by `memoStatic`, which deliberately stops holding in dev:
 * nothing imports `content/`, so no edit in there can invalidate a module,
 * and a memo that outlived the tree served 404s for entries that existed.
 * Invalid frontmatter throws, which fails `next build`: bad content cannot
 * reach production by being merely unrendered.
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

/**
 * The plain retelling is a SIBLING too, for the same reason a translation is.
 *
 *   content/think/why-contrast-came-first.mdx           the entry
 *   content/think/why-contrast-came-first.eli5.mdx      the same entry, retold plainly
 *   content/think/why-contrast-came-first.eli5.en.mdx   that retelling in English
 *
 * The locale stays OUTERMOST so the rule already in place — the last segment,
 * if it is a known locale, is the language — keeps working untouched, and one
 * `ls` still sorts every version of an entry together. Partial coverage is
 * the expected steady state here as well: some entries are already plain and
 * do not need a second telling.
 */
const ELI5_SUFFIX = /\.eli5$/

/** Which telling of an entry a file holds. */
export type Register = 'full' | 'eli5'

/** `foo.eli5.en` -> { slug: 'foo', locale: 'en', register: 'eli5' } */
function splitName(base: string): { slug: string; locale: Locale; register: Register } {
  let rest = base
  let locale: Locale = DEFAULT_LOCALE

  const m = LOCALE_SUFFIX.exec(rest)
  if (m) {
    const tag = m[1]!
    // A slug may legitimately end in a two-letter segment that is not a locale
    // (`.js`, `.io`). Only a known locale counts as a translation marker.
    if (isLocale(tag)) {
      locale = tag
      rest = rest.slice(0, -m[0].length)
    }
  }

  const e = ELI5_SUFFIX.exec(rest)
  if (e) return { slug: rest.slice(0, -e[0].length), locale, register: 'eli5' }
  return { slug: rest, locale, register: 'full' }
}

/** One entry plus the language its text is actually in. */
export type LocalisedEntry = Entry & {
  readonly locale: Locale
  /** False when this is the original standing in for a missing translation. */
  readonly translated: boolean
}

/** A plain retelling plus the language its text is actually in. */
export type Eli5Entry = Eli5 & {
  readonly locale: Locale
  /** False when this is the Korean retelling standing in for a missing one. */
  readonly translated: boolean
}

type Loaded = { entry: Entry; locale: Locale }
type LoadedEli5 = { eli5: Eli5; locale: Locale }

function readChapter(chapter: SectionId): { entries: Loaded[]; eli5: LoadedEli5[] } {
  const dir = join(CONTENT_DIR, chapter)
  if (!existsSync(dir)) return { entries: [], eli5: [] }

  const entries: Loaded[] = []
  const eli5: LoadedEli5[] = []

  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.mdx')) continue
    const { slug, locale, register } = splitName(f.replace(/\.mdx$/, ''))
    const { data, content } = matter(readFileSync(join(dir, f), 'utf8'))
    const args = {
      file: `content/${chapter}/${f}`,
      chapter,
      slug,
      data: data as Record<string, unknown>,
      body: content.trim(),
    }
    if (register === 'eli5') eli5.push({ eli5: toEli5(args), locale })
    else entries.push({ entry: toEntry(args), locale })
  }

  return { entries, eli5 }
}

/** Newest first. Ties broken by slug so the order is stable across builds. */
const byDateDesc = (a: Entry, b: Entry): number =>
  b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)

type Library = { entries: readonly Loaded[]; eli5: readonly LoadedEli5[] }

const library = memoStatic((): Library => {
  const read = SECTION_IDS.map(readChapter)
  const loaded = read.flatMap((r) => r.entries)
  const plain = read.flatMap((r) => r.eli5)

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

  /* The retellings answer to the same two rules, for the same reasons: a
     second one in a locale would be an ambiguous route, and one with no
     entry behind it would be a page claiming to simplify something that
     does not exist. The English retelling additionally needs the Korean
     one, so the fallback below always has somewhere to land. */
  const plainOriginals = new Set(
    plain
      .filter((l) => l.locale === DEFAULT_LOCALE)
      .map((l) => `${l.eli5.chapter}/${l.eli5.slug}`),
  )
  const plainSeen = new Set<string>()
  for (const { eli5, locale } of plain) {
    const behind = `${eli5.chapter}/${eli5.slug}`
    const key = `${locale}:${behind}`
    if (plainSeen.has(key)) {
      throw new ContentError(key, 'duplicate eli5 slug for this locale')
    }
    plainSeen.add(key)

    if (!originals.has(behind)) {
      throw new ContentError(
        `content/${behind}.eli5.mdx`,
        `a retelling with no entry behind it — ${behind}.mdx does not exist`,
      )
    }
    /* Checked against the whole set rather than what the loop has passed:
       readdir hands back `foo.eli5.en.mdx` before `foo.eli5.mdx`, so a
       progressive check would fail on a pair that is complete. */
    if (locale !== DEFAULT_LOCALE && !plainOriginals.has(behind)) {
      throw new ContentError(
        `content/${behind}.eli5.${locale}.mdx`,
        `a translated retelling with no ${DEFAULT_LOCALE} retelling to fall back to`,
      )
    }
  }

  return { entries: loaded.sort((a, b) => byDateDesc(a.entry, b.entry)), eli5: plain }
})

const allLoaded = (): readonly Loaded[] => library().entries

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

/* ------------------------------------------------------------------ */
/* The plain register                                                  */
/* ------------------------------------------------------------------ */

/**
 * The plain retelling of one entry, resolved for one locale.
 *
 * `undefined` is the ordinary answer, not a failure: most entries have no
 * retelling, and the toggle on the entry page appears only where this
 * returns something. The locale fallback is the entry's own — the Korean
 * retelling stands in for a missing English one and says so — because a
 * reader who asked for plain language is worse served by a 404 than by the
 * wrong language with a notice on it.
 */
export function getEli5(
  chapter: SectionId,
  slug: string,
  locale: Locale,
): Eli5Entry | undefined {
  // Gated on the entry, so a draft cannot be published through its retelling.
  if (!getEntry(chapter, slug, locale)) return undefined

  const all = library().eli5
  const wanted = all.find(
    (l) => l.locale === locale && l.eli5.chapter === chapter && l.eli5.slug === slug,
  )
  if (wanted) return { ...wanted.eli5, locale, translated: true }

  const original = all.find(
    (l) =>
      l.locale === DEFAULT_LOCALE && l.eli5.chapter === chapter && l.eli5.slug === slug,
  )
  if (!original) return undefined
  return {
    ...original.eli5,
    locale: DEFAULT_LOCALE,
    translated: locale === DEFAULT_LOCALE,
  }
}

/** Whether the entry page should offer the choice at all. */
export function hasEli5(chapter: SectionId, slug: string, locale: Locale): boolean {
  return getEli5(chapter, slug, locale) !== undefined
}

/**
 * Every (locale, chapter, slug) that has a retelling to prerender.
 *
 * The cross product, for the same reason `allParams` takes it: an entry
 * retold only in Korean still has an English route rather than a 404 on a
 * page a reader can see linked.
 */
export function allEli5Params(): { lang: Locale; section: SectionId; slug: string }[] {
  const locales = ['ko', 'en'] as const
  return locales.flatMap((lang) =>
    publishedEntries(lang)
      .filter((e) => hasEli5(e.chapter, e.slug, lang))
      .map((e) => ({ lang, section: e.chapter, slug: e.slug })),
  )
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
