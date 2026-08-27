import type { SectionId } from '@/lib/sections'
import { isTopicId, type TopicId } from '@/lib/topics'

/**
 * The content model.
 *
 * Each chapter answers a different question, so each chapter stores a
 * different shape. The extra fields are not decoration — they are lifted
 * straight out of the brief:
 *
 *   MAKE  "어떤 제약이 있었고, 무엇을 포기했고, 무엇이 남았는지"
 *           -> constraint / tradeoff / outcome
 *   TRACE "지나간 버전, 폐기된 시도, 바뀐 마음"
 *           -> version / abandoned / reconsidered
 *
 * A generic `post` type would have quietly thrown that away and left every
 * chapter looking the same.
 */

export type BaseEntry = {
  readonly chapter: SectionId
  readonly slug: string
  readonly title: string
  /** ISO yyyy-mm-dd. */
  readonly date: string
  readonly summary: string
  readonly draft: boolean
  /**
   * The browsable axis — controlled, validated, never invented here.
   *
   * Separate from `tags` because they answer different questions: this is
   * what a reader navigates by and what gets its own page, while `tags`
   * stays free-form for the specificity JSON-LD keywords want.
   */
  readonly topics: readonly TopicId[]
  readonly tags: readonly string[]
  /** Raw MDX body, compiled at render time in a Server Component. */
  readonly body: string
  /** Derived, not authored. */
  readonly readingMinutes: number
}

export type Note = BaseEntry & {
  readonly chapter: 'think'
  readonly updated?: string
}

export type Work = BaseEntry & {
  readonly chapter: 'make'
  readonly role: string
  readonly period: string
  readonly stack: readonly string[]
  readonly constraint: string
  readonly tradeoff: string
  readonly outcome: string
}

export type Fragment = BaseEntry & {
  readonly chapter: 'live'
  readonly place?: string
}

export const LOG_KINDS = ['version', 'abandoned', 'reconsidered'] as const
export type LogKind = (typeof LOG_KINDS)[number]

/* The human-readable name of each kind lives in lib/i18n, not here. A label
   is a sentence fragment and a sentence has a language; keeping a Korean copy
   next to the type would be a second source of truth for the same string. */

export type Log = BaseEntry & {
  readonly chapter: 'trace'
  readonly kind: LogKind
}

export type Entry = Note | Work | Fragment | Log

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export class ContentError extends Error {
  constructor(file: string, message: string) {
    super(`${file}: ${message}`)
    this.name = 'ContentError'
  }
}

const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * YAML parses an unquoted `2026-08-24` into a Date, not a string, so a
 * validator that only accepts strings would force every author to quote
 * every date. Normalise instead — using the UTC parts, because the Date
 * YAML produced is UTC midnight and reading it with local getters moves it
 * to the previous day for anyone west of GMT.
 */
function toISODate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear()
    const m = String(value.getUTCMonth() + 1).padStart(2, '0')
    const d = String(value.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof value === 'string' && ISO_DATE.test(value)) return value
  return undefined
}

function requireString(
  file: string,
  data: Record<string, unknown>,
  key: string,
): string {
  const v = data[key]
  if (!isString(v)) {
    throw new ContentError(file, `frontmatter "${key}" must be a non-empty string`)
  }
  return v
}

function optionalDate(
  file: string,
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = data[key]
  if (v === undefined) return undefined
  const iso = toISODate(v)
  if (!iso) throw new ContentError(file, `frontmatter "${key}" must be yyyy-mm-dd`)
  return iso
}

/**
 * Mixed Korean/English reading estimate.
 *
 * Korean is counted per character and English per word, because a
 * words-only count under-reports Hangul by roughly a factor of three. This
 * is an estimate and is labelled as one in the UI.
 */
export function estimateReadingMinutes(body: string): number {
  const text = body.replace(/```[\s\S]*?```/g, ' ').replace(/[#*_>`\[\]()]/g, ' ')
  const hangul = (text.match(/[가-힣]/g) ?? []).length
  const latinWords = (text.match(/\b[A-Za-z][A-Za-z'-]*\b/g) ?? []).length
  const minutes = hangul / 350 + latinWords / 220
  return Math.max(1, Math.round(minutes))
}

/** Parse and validate one file's frontmatter into a typed Entry. */
export function toEntry(args: {
  file: string
  chapter: SectionId
  slug: string
  data: Record<string, unknown>
  body: string
}): Entry {
  const { file, chapter, slug, data, body } = args

  const date = toISODate(data['date'])
  if (!date) {
    throw new ContentError(
      file,
      `frontmatter "date" must be yyyy-mm-dd, got ${JSON.stringify(data['date'])}`,
    )
  }

  const tags = data['tags'] === undefined ? [] : data['tags']
  if (!isStringArray(tags)) {
    throw new ContentError(file, 'frontmatter "tags" must be an array of strings')
  }

  const draft = data['draft'] === undefined ? false : data['draft']
  if (typeof draft !== 'boolean') {
    throw new ContentError(file, 'frontmatter "draft" must be a boolean')
  }

  /* Required and non-empty. An entry with no topic is unreachable by the
     only axis a reader can browse, and defaulting it to something would put
     it under a heading it does not belong to. */
  const rawTopics = data['topics']
  if (!isStringArray(rawTopics) || rawTopics.length === 0) {
    throw new ContentError(
      file,
      'frontmatter "topics" must be a non-empty array of strings',
    )
  }
  const topics: TopicId[] = []
  for (const t of rawTopics) {
    if (!isTopicId(t)) {
      throw new ContentError(
        file,
        `frontmatter "topics" contains "${t}", which is not a topic — see lib/topics.ts`,
      )
    }
    topics.push(t)
  }

  const base = {
    slug,
    title: requireString(file, data, 'title'),
    date,
    summary: requireString(file, data, 'summary'),
    draft,
    topics,
    tags,
    body,
    readingMinutes: estimateReadingMinutes(body),
  }

  switch (chapter) {
    case 'think': {
      const updated = optionalDate(file, data, 'updated')
      return { ...base, chapter, ...(updated ? { updated } : {}) }
    }
    case 'make': {
      const stack = data['stack']
      if (!isStringArray(stack) || stack.length === 0) {
        throw new ContentError(file, 'frontmatter "stack" must be a non-empty array of strings')
      }
      return {
        ...base,
        chapter,
        role: requireString(file, data, 'role'),
        period: requireString(file, data, 'period'),
        stack,
        constraint: requireString(file, data, 'constraint'),
        tradeoff: requireString(file, data, 'tradeoff'),
        outcome: requireString(file, data, 'outcome'),
      }
    }
    case 'live': {
      const place = data['place']
      if (place !== undefined && !isString(place)) {
        throw new ContentError(file, 'frontmatter "place" must be a string')
      }
      return { ...base, chapter, ...(place ? { place } : {}) }
    }
    case 'trace': {
      const kind = data['kind']
      if (typeof kind !== 'string' || !(LOG_KINDS as readonly string[]).includes(kind)) {
        throw new ContentError(
          file,
          `frontmatter "kind" must be one of ${LOG_KINDS.join(' | ')}`,
        )
      }
      return { ...base, chapter, kind: kind as LogKind }
    }
  }
}
