import { AREAS, parseMilestone, type CommitRecord, type Milestone } from '@/lib/git/parse.mjs'
import { isSectionId, type SectionId } from '@/lib/sections'

/**
 * The repository, as content.
 *
 * TRACE promises "지나간 버전, 폐기된 시도, 바뀐 마음". Git is the machine-
 * generated half of exactly that record, so it is loaded through a typed,
 * validating boundary the same way MDX is: a malformed record fails
 * `next build` rather than rendering a page that is quietly wrong.
 *
 * The snapshot in lib/git.data.json is a plain JSON file that a human can
 * edit and a bad merge can corrupt. That is the whole reason this validator
 * exists — the live `git log` path is trustworthy, the committed file is not.
 */

export type Area = (typeof AREAS)[number]

/** What each area is called in the interface. */
export const AREA_LABEL: Readonly<Record<Area, string>> = {
  app: '라우트',
  components: '컴포넌트',
  lib: '로직',
  styles: '스타일',
  content: '글',
  scripts: '게이트',
  docs: '문서',
  config: '설정',
  generated: '생성물',
}

/** An entry a commit touched, as a link target. */
export type EntryRef = {
  readonly chapter: SectionId
  readonly slug: string
}

export type Commit = {
  /** Abbreviated hash, pinned to 7 characters by GIT_LOG_ARGS. */
  readonly sha: string
  /** ISO yyyy-mm-dd, author date. */
  readonly date: string
  readonly subject: string
  /** Lines a person wrote. Lockfiles and binaries are not counted here. */
  readonly insertions: number
  readonly deletions: number
  /** Lines in generated files, both directions summed. */
  readonly generated: number
  readonly files: number
  readonly areas: readonly Area[]
  readonly entries: readonly EntryRef[]
  /** Set when the subject declared one, e.g. `Phase 2: Personal System`. */
  readonly milestone: Milestone | null
}

export class GitError extends Error {
  constructor(source: string, message: string) {
    super(`${source}: ${message}`)
    this.name = 'GitError'
  }
}

const AREA_SET: ReadonlySet<string> = new Set<string>(AREAS)
const isArea = (v: string): v is Area => AREA_SET.has(v)

const SHA = /^[0-9a-f]{7}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function count(source: string, sha: string, key: string, v: unknown): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    throw new GitError(
      source,
      `${sha} "${key}" must be a non-negative integer, got ${JSON.stringify(v)}`,
    )
  }
  return v
}

/** Validate one parsed record into a typed Commit, or throw. */
export function toCommit(record: CommitRecord, source: string): Commit {
  const { sha } = record
  if (typeof sha !== 'string' || !SHA.test(sha)) {
    throw new GitError(
      source,
      `"sha" must be 7 lowercase hex characters, got ${JSON.stringify(sha)}`,
    )
  }

  if (typeof record.date !== 'string' || !ISO_DATE.test(record.date)) {
    throw new GitError(
      source,
      `${sha} "date" must be yyyy-mm-dd, got ${JSON.stringify(record.date)}`,
    )
  }

  if (typeof record.subject !== 'string') {
    throw new GitError(source, `${sha} "subject" must be a string`)
  }

  if (!Array.isArray(record.areas)) {
    throw new GitError(source, `${sha} "areas" must be an array`)
  }
  const areas: Area[] = []
  for (const a of record.areas) {
    if (typeof a !== 'string' || !isArea(a)) {
      throw new GitError(source, `${sha} unknown area ${JSON.stringify(a)}`)
    }
    areas.push(a)
  }

  if (!Array.isArray(record.entries)) {
    throw new GitError(source, `${sha} "entries" must be an array`)
  }
  const entries: EntryRef[] = []
  for (const e of record.entries) {
    // A chapter that is not a chapter would render a link to a 404. The
    // route table is the authority, so it is asked rather than trusted.
    if (!e || typeof e.chapter !== 'string' || !isSectionId(e.chapter)) {
      throw new GitError(
        source,
        `${sha} entry chapter ${JSON.stringify(e?.chapter)} is not a chapter`,
      )
    }
    if (typeof e.slug !== 'string' || e.slug.length === 0) {
      throw new GitError(source, `${sha} entry slug must be a non-empty string`)
    }
    entries.push({ chapter: e.chapter, slug: e.slug })
  }

  return {
    sha,
    date: record.date,
    subject: record.subject,
    insertions: count(source, sha, 'insertions', record.insertions),
    deletions: count(source, sha, 'deletions', record.deletions),
    generated: count(source, sha, 'generated', record.generated),
    files: count(source, sha, 'files', record.files),
    areas,
    entries,
    // Derived, not stored. Keeping it out of the snapshot means the phrasing
    // of a milestone label can change without rewriting committed data.
    milestone: parseMilestone(record.subject),
  }
}
