import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'

import { SECTION_IDS, type SectionId } from '@/lib/sections'
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

function readChapter(chapter: SectionId): Entry[] {
  const dir = join(CONTENT_DIR, chapter)
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const slug = f.replace(/\.mdx$/, '')
      const raw = readFileSync(join(dir, f), 'utf8')
      const { data, content } = matter(raw)
      return toEntry({
        file: `content/${chapter}/${f}`,
        chapter,
        slug,
        data: data as Record<string, unknown>,
        body: content.trim(),
      })
    })
}

/** Newest first. Ties broken by slug so the order is stable across builds. */
const byDateDesc = (a: Entry, b: Entry): number =>
  b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)

let cache: readonly Entry[] | null = null

function allEntries(): readonly Entry[] {
  if (cache) return cache
  const entries = SECTION_IDS.flatMap(readChapter)

  // A slug collision inside a chapter would make one entry unreachable and
  // the other ambiguous. Catch it here rather than as a mystery 404.
  const seen = new Map<string, string>()
  for (const e of entries) {
    const key = `${e.chapter}/${e.slug}`
    const prev = seen.get(key)
    if (prev) throw new ContentError(key, `duplicate slug (also in ${prev})`)
    seen.set(key, key)
  }

  cache = entries.sort(byDateDesc)
  return cache
}

/** Drafts are authored freely and never published. */
const isPublished = (e: Entry): boolean =>
  !e.draft || process.env.NODE_ENV === 'development'

export function entriesFor(chapter: SectionId): readonly Entry[] {
  return allEntries().filter((e) => e.chapter === chapter && isPublished(e))
}

export function getEntry(chapter: SectionId, slug: string): Entry | undefined {
  return allEntries().find(
    (e) => e.chapter === chapter && e.slug === slug && isPublished(e),
  )
}

export function publishedEntries(): readonly Entry[] {
  return allEntries().filter(isPublished)
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
export function archive(): readonly Entry[] {
  return publishedEntries()
}

export const isWork = (e: Entry): e is Work => e.chapter === 'make'
export const isLog = (e: Entry): e is Log => e.chapter === 'trace'

/** Every published entry, for generateStaticParams. */
export function allParams(): { section: SectionId; slug: string }[] {
  return publishedEntries().map((e) => ({ section: e.chapter, slug: e.slug }))
}

/** Previous / next entry within the same chapter, in display order. */
export function entryNeighbours(
  chapter: SectionId,
  slug: string,
): { newer: Entry | undefined; older: Entry | undefined } {
  const list = entriesFor(chapter)
  const i = list.findIndex((e) => e.slug === slug)
  if (i === -1) return { newer: undefined, older: undefined }
  // The list is newest-first, so the previous index is the newer entry.
  return { newer: list[i - 1], older: list[i + 1] }
}
