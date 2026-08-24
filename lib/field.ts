import type { Entry } from '@/lib/content/schema'
import { LOG_KIND_LABEL } from '@/lib/content/schema'
import { SECTION_IDS, type SectionId } from '@/lib/sections'

/**
 * The archive, flattened into something a WebGL scene can consume.
 *
 * Deliberately plain data: it crosses the server/client boundary, so it
 * carries no MDX bodies and no functions. An entry's body is the single
 * largest field on it and the field never draws text from it.
 */
export type FieldDatum = {
  readonly slug: string
  readonly chapter: SectionId
  readonly href: string
  readonly title: string
  readonly date: string
  /** Chapter index — the lane this sits in. */
  readonly lane: number
  /** Position along the sequence axis, 0..1, oldest to newest. */
  readonly t: number
  /** Bar height driver. Reading estimate, floored so nothing is invisible. */
  readonly weight: number
  /** Short trailing label shown when this datum is focused. */
  readonly meta: string
}

function metaFor(entry: Entry): string {
  switch (entry.chapter) {
    case 'make':
      return entry.role
    case 'trace':
      return LOG_KIND_LABEL[entry.kind]
    case 'live':
      return entry.place ?? ''
    case 'think':
      return `약 ${entry.readingMinutes}분`
  }
}

/**
 * Position is by RANK, not by raw date.
 *
 * Mapping dates linearly looks correct until a real archive arrives: seven
 * entries written in one week collapse onto a single pixel, and one entry
 * from two years ago stretches everything else into nothing. Rank spacing
 * stays readable at 7 and at 700, and the axis is still strictly
 * chronological — it just refuses to let one outlier eat the layout.
 */
export function toField(entries: readonly Entry[]): FieldDatum[] {
  const ordered = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug),
  )
  const last = Math.max(1, ordered.length - 1)

  return ordered.map((entry, i) => ({
    slug: entry.slug,
    chapter: entry.chapter,
    href: `/${entry.chapter}/${entry.slug}`,
    title: entry.title,
    date: entry.date,
    lane: SECTION_IDS.indexOf(entry.chapter),
    t: i / last,
    weight: Math.max(1, entry.readingMinutes),
    meta: metaFor(entry),
  }))
}
