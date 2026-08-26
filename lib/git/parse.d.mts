/**
 * Types for lib/git/parse.mjs, mirroring lib/csp.d.mts.
 *
 * The parser is plain ESM so that a .mjs script and the TypeScript build can
 * share it; this file is what lets the TypeScript half of that pair keep its
 * types instead of reaching for `any`.
 */

export declare const SUBJECT_MAX: number

export declare const GIT_LOG_ARGS: readonly string[]

export declare const AREAS: readonly [
  'app',
  'components',
  'lib',
  'styles',
  'content',
  'scripts',
  'docs',
  'config',
  'generated',
]

export type ParsedFile = {
  readonly path: string
  readonly insertions: number
  readonly deletions: number
}

export type ParsedCommit = {
  readonly sha: string
  readonly date: string
  readonly subject: string
  readonly files: readonly ParsedFile[]
}

/**
 * The published projection.
 *
 * Types are deliberately WIDE here — `string` rather than a union, plain
 * `number` — because this value has only been PARSED. lib/git/schema.ts is
 * what narrows and validates it, and it has to be able to reject a bad one.
 */
export type CommitRecord = {
  readonly sha: string
  readonly date: string
  readonly subject: string
  /** Lines a person wrote. Generated files are excluded. */
  readonly insertions: number
  readonly deletions: number
  /** Lines in lockfiles and binaries, both directions summed. */
  readonly generated: number
  readonly files: number
  readonly areas: readonly string[]
  readonly entries: readonly { readonly chapter: string; readonly slug: string }[]
}

export type Milestone = { readonly n: number; readonly title: string }

export declare function isGenerated(path: string): boolean

export declare function areaFor(path: string): (typeof AREAS)[number]

export declare function entryRefFor(
  path: string,
): { readonly chapter: string; readonly slug: string } | null

export declare function parseMilestone(subject: string): Milestone | null

export declare function parseGitLog(raw: string): ParsedCommit[]

export declare function toCommitRecord(parsed: ParsedCommit): CommitRecord
