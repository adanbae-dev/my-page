import type { Commit } from './schema'

/**
 * The history, grouped into readable spans.
 *
 * A flat list of every commit is accurate and unreadable. The grouping is a
 * pure projection over validated commits — the same relationship lib/field.ts
 * has to the archive — so it can be reasoned about without touching git.
 *
 * Two strategies, chosen by what the repository actually contains:
 *
 *   MILESTONE  This project's commits are titled `Phase 0:` … `Phase 4:`, so
 *              the history already declares its own chapters. An era runs
 *              from one milestone commit up to the next.
 *   MONTH      Any repository without milestone commits. Falling back keeps
 *              the component honest somewhere else rather than making it
 *              only ever work here.
 *
 * The milestone case is stated rather than fudged: commits that follow the
 * last milestone belong to ITS era, because that is when they happened —
 * they were done after Phase 4 and before any Phase 5 was declared.
 */

export type Era = {
  readonly key: string
  /** Uppercase name for the index rail, e.g. `PHASE 2` or `2026.08`. */
  readonly label: string
  /** The milestone's own title. Empty for month eras — a month has no thesis. */
  readonly title: string
  /** Newest first, matching every other list in the product. */
  readonly commits: readonly Commit[]
  readonly insertions: number
  readonly deletions: number
  readonly generated: number
}

type Bucket = {
  key: string
  label: string
  title: string
  commits: Commit[]
}

function seal(buckets: readonly Bucket[]): Era[] {
  // Buckets are filled oldest-first because that is the only order in which
  // "start a new era here" makes sense. Display is newest-first, so both the
  // list of eras and the commits inside each are reversed exactly once.
  return buckets
    .slice()
    .reverse()
    .map((b) => ({
      key: b.key,
      label: b.label,
      title: b.title,
      commits: b.commits.slice().reverse(),
      insertions: b.commits.reduce((n, c) => n + c.insertions, 0),
      deletions: b.commits.reduce((n, c) => n + c.deletions, 0),
      generated: b.commits.reduce((n, c) => n + c.generated, 0),
    }))
}

function byMilestone(oldestFirst: readonly Commit[]): Era[] {
  const buckets: Bucket[] = []

  for (const c of oldestFirst) {
    const m = c.milestone
    // A new bucket opens on a milestone, and once at the start for anything
    // committed before the first one was declared.
    if (m || buckets.length === 0) {
      buckets.push({
        key: m ? `phase-${m.n}` : 'before',
        label: m ? `PHASE ${m.n}` : 'BEFORE',
        title: m ? m.title : '마일스톤이 선언되기 전',
        commits: [],
      })
    }
    buckets[buckets.length - 1]?.commits.push(c)
  }

  return seal(buckets)
}

function byMonth(oldestFirst: readonly Commit[]): Era[] {
  const buckets: Bucket[] = []

  for (const c of oldestFirst) {
    const key = c.date.slice(0, 7)
    const last = buckets[buckets.length - 1]
    if (!last || last.key !== key) {
      buckets.push({ key, label: key.replace('-', '.'), title: '', commits: [] })
      buckets[buckets.length - 1]?.commits.push(c)
      continue
    }
    last.commits.push(c)
  }

  return seal(buckets)
}

/** `commits` newest first, as `git log` gives it. */
export function toEras(commits: readonly Commit[]): Era[] {
  if (commits.length === 0) return []
  const oldestFirst = commits.slice().reverse()
  return oldestFirst.some((c) => c.milestone !== null)
    ? byMilestone(oldestFirst)
    : byMonth(oldestFirst)
}
