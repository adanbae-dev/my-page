import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  GIT_LOG_ARGS,
  parseGitLog,
  toCommitRecord,
  type CommitRecord,
} from '@/lib/git/parse.mjs'
import { memoStatic } from '@/lib/memo'
import type { SectionId } from '@/lib/sections'
import { toEras, type Era } from './eras'
import { toCommit, type Commit } from './schema'

/**
 * The build record loader. Server-only: it shells out to git and reads the
 * filesystem, so importing it from a Client Component fails the build rather
 * than shipping either.
 *
 * Read once at build time, like content. Every route is statically
 * prerendered, so there is no request-time cost and nothing to invalidate.
 *
 * TWO SOURCES, and the order matters:
 *
 *   live git   Correct and current. Used whenever the full history is
 *              actually present.
 *   snapshot   lib/git.data.json, written by `pnpm sync:git` and committed.
 *
 * Vercel and most CI providers clone with `--depth=1`. Reading a truncated
 * history would publish a PARTIAL record that looks complete — seven commits
 * becoming one, with no error anywhere. That is strictly worse than a
 * snapshot which is honestly a commit or two behind, so a shallow repository
 * is refused rather than read.
 *
 * The snapshot can never contain the commit that adds it, so it is one commit
 * behind by construction. `pnpm check:release` reports the real distance and
 * the page states its own source.
 */

const SNAPSHOT_FILE = join(process.cwd(), 'lib', 'git.data.json')

export type Source = 'live' | 'snapshot' | 'none'

export type Repo = {
  readonly commits: readonly Commit[]
  readonly source: Source
  /** Newest sha in the record, or '' when there is no record at all. */
  readonly head: string
  /** When the snapshot was written. Null for the live path. */
  readonly generatedAt: string | null
}

function git(args: readonly string[]): string {
  return execFileSync('git', [...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    // A long history with numstat is large. 64 MB is far past this
    // repository and still bounded.
    maxBuffer: 64 * 1024 * 1024,
    // stderr is discarded on purpose: "not a git repository" is an expected
    // outcome here, not a problem to print during a build.
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function liveRepo(): Repo | null {
  try {
    if (git(['rev-parse', '--is-inside-work-tree']).trim() !== 'true') return null
    if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'false') return null

    const commits = parseGitLog(git(GIT_LOG_ARGS))
      .map(toCommitRecord)
      .map((r) => toCommit(r, 'live git'))

    const head = commits[0]?.sha
    if (!head) return null

    return { commits, source: 'live', head, generatedAt: null }
  } catch (error) {
    // A GitError means the repository produced a record this product refuses
    // to publish. That is a real failure and must not be swallowed into a
    // silent fallback.
    if (error instanceof Error && error.name === 'GitError') throw error
    // Everything else — no git binary, not a repository, a tarball deploy —
    // is normal, and none of it should fail a build.
    return null
  }
}

function snapshotRepo(): Repo | null {
  if (!existsSync(SNAPSHOT_FILE)) return null

  const raw: unknown = JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf8'))
  if (typeof raw !== 'object' || raw === null) return null

  const snap = raw as {
    generatedAt?: unknown
    commits?: unknown
  }
  if (!Array.isArray(snap.commits)) return null

  const commits = (snap.commits as CommitRecord[]).map((r) =>
    toCommit(r, 'lib/git.data.json'),
  )
  const head = commits[0]?.sha
  if (!head) return null

  return {
    commits,
    source: 'snapshot',
    head,
    generatedAt: typeof snap.generatedAt === 'string' ? snap.generatedAt : null,
  }
}

const EMPTY: Repo = { commits: [], source: 'none', head: '', generatedAt: null }

export const repo = memoStatic((): Repo => liveRepo() ?? snapshotRepo() ?? EMPTY)

export function commits(): readonly Commit[] {
  return repo().commits
}

export function eras(): readonly Era[] {
  return toEras(repo().commits)
}

/**
 * Every commit that touched one entry, newest first.
 *
 * Derived from the single pass over the log rather than a per-file `git log`,
 * so it costs nothing extra and works identically from the snapshot.
 */
export function historyFor(chapter: SectionId, slug: string): readonly Commit[] {
  return commits().filter((c) =>
    c.entries.some((e) => e.chapter === chapter && e.slug === slug),
  )
}

export type RepoStats = {
  readonly count: number
  /** Oldest and newest dates in the record. Empty strings when there is none. */
  readonly first: string
  readonly last: string
  readonly insertions: number
  readonly deletions: number
  readonly generated: number
  readonly source: Source
  readonly head: string
  readonly generatedAt: string | null
}

export function stats(): RepoStats {
  const r = repo()
  const list = r.commits
  return {
    count: list.length,
    first: list[list.length - 1]?.date ?? '',
    last: list[0]?.date ?? '',
    insertions: list.reduce((n, c) => n + c.insertions, 0),
    deletions: list.reduce((n, c) => n + c.deletions, 0),
    generated: list.reduce((n, c) => n + c.generated, 0),
    source: r.source,
    head: r.head,
    generatedAt: r.generatedAt,
  }
}
