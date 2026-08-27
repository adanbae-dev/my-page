import type { Entry } from '@/lib/content/schema'
import { localePath, t, type Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionary'
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

/** Labels are injected: this projection crosses to the client, and the text
 *  on it has a language. */
type MetaLabels = Pick<Dictionary, 'logKind' | 'entry'>

function metaFor(entry: Entry, d: MetaLabels): string {
  switch (entry.chapter) {
    case 'make':
      return entry.role
    case 'trace':
      return d.logKind[entry.kind]
    case 'live':
      return entry.place ?? ''
    case 'think':
      return t(d.entry.readingMinutes, { n: entry.readingMinutes })
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
/**
 * `locale` is not optional, and the reason is a bug this signature now
 * prevents.
 *
 * The href used to be `/${chapter}/${slug}`, which was right until every
 * route moved under `/[lang]`. After that, clicking a bar pushed a URL that
 * does not exist — `dynamicParams = false`, so it 404s rather than falling
 * back. The scene rendered correctly, the data was correct, and the only
 * broken thing was the one action a visitor takes. Making the locale a
 * required parameter means the next person to add a caller cannot forget it.
 */
export function toField(
  entries: readonly Entry[],
  d: MetaLabels,
  locale: Locale,
): FieldDatum[] {
  const ordered = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug),
  )
  const last = Math.max(1, ordered.length - 1)

  return ordered.map((entry, i) => ({
    slug: entry.slug,
    chapter: entry.chapter,
    href: localePath(locale, `/${entry.chapter}/${entry.slug}`),
    title: entry.title,
    date: entry.date,
    lane: SECTION_IDS.indexOf(entry.chapter),
    t: i / last,
    weight: Math.max(1, entry.readingMinutes),
    meta: metaFor(entry, d),
  }))
}

/**
 * How many chapter lanes a set of entries would occupy.
 *
 * The scene's Z axis IS the chapter. With one lane the bars stand in a single
 * row and half the visualisation says nothing — the axis is still drawn, still
 * labelled with four chapters, and three of them are empty. That is worse than
 * not offering the view: it looks like data is missing.
 *
 * So this is the condition for showing it, replacing a hardcoded "only on
 * TRACE". TRACE happened to be the only page that spanned chapters when the
 * scene was built; topic pages span them too, and a chapter page never can.
 * Stating the reason instead of the symptom means the rule stays right when
 * the next kind of page appears.
 */
export function laneCount(entries: readonly Entry[]): number {
  return new Set(entries.map((e) => e.chapter)).size
}

/** Two lanes is where the chapter axis starts carrying information. */
export const FIELD_MIN_LANES = 2
