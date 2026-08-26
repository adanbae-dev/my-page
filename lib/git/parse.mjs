/**
 * Git log parsing, in plain ESM.
 *
 * Lives outside the TypeScript sources for the same reason lib/csp.mjs does:
 * two callers need the SAME parser and one of them is a Node script that
 * cannot import a .ts module.
 *
 *   lib/git/load.ts       reads the live repository during `next build`
 *   scripts/sync-git.mjs  writes the committed snapshot
 *
 * If those two disagreed, a shallow-clone CI build would publish a record
 * shaped differently from the one the author reviewed — and nothing would
 * error. One parser, two callers, no drift.
 */

/* Field and record separators, matching the %x1f / %x00 in GIT_LOG_ARGS
   below. Both are control characters, so neither can appear in a commit
   subject and neither needs escaping or quoting. Written as escapes rather
   than literal bytes so this file survives an editor, a formatter and a
   diff without anyone noticing it had been mangled. */
const FS = '\u001f'
const RS = '\u0000'

/** Subjects are truncated, not wrapped: the per-route html budget is 24 KB. */
export const SUBJECT_MAX = 96

/**
 * `--abbrev=7` rather than bare `%h`.
 *
 * Git widens the abbreviation as a repository grows, so `%h` alone would
 * silently rewrite every sha in the snapshot on the commit that crosses the
 * threshold. Pinning the width keeps the diff about what actually changed.
 */
export const GIT_LOG_ARGS = [
  'log',
  '--no-merges',
  '--abbrev=7',
  '--date=short',
  '--numstat',
  '--format=%x00%h%x1f%ad%x1f%s',
]

/**
 * Which part of the product a path belongs to.
 *
 * Declared order, because it is also display order: a commit's areas read
 * outside-in — the route, then the component, then the logic underneath.
 */
export const AREAS = [
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

const AREA_BY_PREFIX = [
  ['app/', 'app'],
  ['components/', 'components'],
  ['lib/', 'lib'],
  ['styles/', 'styles'],
  ['content/', 'content'],
  ['scripts/', 'scripts'],
  ['docs/', 'docs'],
]

/* Root-level prose. Everything else at the root — package.json,
   next.config.ts, tsconfig.json, perf.budget.json — is configuration. */
const ROOT_DOCS = new Set(['README.md', 'AGENTS.md', 'CLAUDE.md'])

/**
 * Lines nobody wrote.
 *
 * This matters more than it looks. In this repository lockfiles are 36% of
 * every line ever added, and git counts a 1.7 MB PDF as 1,778 lines of text
 * because it failed to detect it as binary. Left in, the build record would
 * report the commit that ran `pnpm install` as the largest piece of
 * engineering in the project — a graph that is arithmetically true and
 * completely misleading.
 *
 * So generated content is CLASSIFIED, not discarded: it gets its own area
 * and its own counter, the bars are driven by authored lines, and the page
 * says which is which. Dropping it silently would be the same dishonesty
 * pointed the other way.
 */
const GENERATED_FILES = new Set([
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
])

const GENERATED_EXT =
  /\.(?:tsbuildinfo|pdf|png|jpe?g|gif|webp|avif|ico|svg|woff2?|ttf|otf|eot|mp4|webm|zip|gz)$/i

export function isGenerated(path) {
  const base = path.slice(path.lastIndexOf('/') + 1)
  return GENERATED_FILES.has(base) || GENERATED_EXT.test(path)
}

export function areaFor(path) {
  // Checked FIRST, because generated files live under real directories:
  // `docs/brief/*.pdf` would otherwise be filed as prose someone wrote.
  if (isGenerated(path)) return 'generated'
  for (const [prefix, area] of AREA_BY_PREFIX) {
    if (path.startsWith(prefix)) return area
  }
  return ROOT_DOCS.has(path) ? 'docs' : 'config'
}

/** `content/think/foo.mdx` -> the entry that commit touched. */
export function entryRefFor(path) {
  const m = /^content\/([a-z]+)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx$/.exec(path)
  return m ? { chapter: m[1], slug: m[2] } : null
}

/** `Phase 2: Personal System` -> a milestone this repository declared. */
export function parseMilestone(subject) {
  const m = /^Phase (\d+):\s*(.+)$/.exec(subject)
  if (!m) return null
  return { n: Number.parseInt(m[1], 10), title: m[2].trim() }
}

/**
 * Renames.
 *
 * numstat writes them two ways — `dir/{old.ts => new.ts}` when the paths
 * share a prefix, and `old.ts => new.ts` when they do not. Both resolve to
 * the NEW path, because that is the file that exists now and therefore the
 * only one a reader can go and look at.
 *
 * Known limit, stated rather than hidden: history BEFORE a rename stays
 * attributed to the old path, so a renamed entry's per-file history starts
 * at the rename. `--follow` would fix it and cannot be used here, because it
 * accepts exactly one pathspec and this is one pass over the whole log.
 */
function normalisePath(raw) {
  if (!raw.includes('=>')) return raw
  const braced = raw.replace(/\{([^{}]*) => ([^{}]*)\}/g, (_, __, to) => to)
  if (braced !== raw) return braced.replace(/\/{2,}/g, '/').replace(/\/$/, '')
  const parts = raw.split(' => ')
  return (parts[parts.length - 1] ?? raw).trim()
}

const truncate = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`)

/**
 * Raw `git log` output -> one object per commit, still unvalidated.
 *
 * Per-FILE counts are kept rather than summed here, because the caller has
 * to split authored lines from generated ones and cannot do that from a
 * total. Aggregation belongs where the classification happens.
 */
export function parseGitLog(raw) {
  const out = []

  for (const chunk of raw.split(RS)) {
    if (!chunk.trim()) continue

    const nl = chunk.indexOf('\n')
    const header = nl === -1 ? chunk : chunk.slice(0, nl)
    const body = nl === -1 ? '' : chunk.slice(nl + 1)

    const fields = header.split(FS)
    const sha = fields[0]
    const date = fields[1]
    // A subject may legitimately be empty; a sha or a date may not. Skip
    // rather than invent — the validator downstream would reject it anyway.
    if (!sha || !date) continue
    const subject = fields.slice(2).join(FS)

    const files = []
    for (const row of body.split('\n')) {
      const cols = row.trim().split('\t')
      if (cols.length < 3) continue
      const [add, del, ...rest] = cols
      files.push({
        path: normalisePath(rest.join('\t')),
        // Binary files report `-` for both counts. They are still a touched
        // file; they simply have no line delta to contribute.
        insertions: Number.parseInt(add, 10) || 0,
        deletions: Number.parseInt(del, 10) || 0,
      })
    }

    out.push({ sha, date, subject, files })
  }

  return out
}

/**
 * Project a parsed commit down to what is published.
 *
 * This is where the record gets deliberately smaller. What is dropped:
 *
 *   author name / email  A single-author repository, so the field carries no
 *                        information — and it would publish a personal
 *                        address into static HTML on every route that shows
 *                        a commit. `pnpm check:release` fails if an address
 *                        reaches the snapshot regardless of this.
 *   commit body          Unbounded, and the subject is the claim.
 *   full paths           Bucketed to an area. "Which part of the product
 *                        moved" is readable; forty paths is not.
 */
export function toCommitRecord(parsed) {
  const areas = new Set()
  const entries = []
  const seen = new Set()

  let insertions = 0
  let deletions = 0
  let generated = 0

  for (const file of parsed.files) {
    areas.add(areaFor(file.path))

    if (isGenerated(file.path)) {
      // Both directions, one number. A lockfile's insertions and deletions
      // are not two facts about the work; they are one fact about npm.
      generated += file.insertions + file.deletions
    } else {
      insertions += file.insertions
      deletions += file.deletions
    }

    const ref = entryRefFor(file.path)
    if (!ref) continue
    const key = `${ref.chapter}/${ref.slug}`
    if (seen.has(key)) continue
    seen.add(key)
    entries.push(ref)
  }

  return {
    sha: parsed.sha,
    date: parsed.date,
    subject: truncate(parsed.subject, SUBJECT_MAX),
    insertions,
    deletions,
    generated,
    files: parsed.files.length,
    // Filtered through AREAS rather than emitted in encounter order, so the
    // chips read the same way on every row.
    areas: AREAS.filter((a) => areas.has(a)),
    entries,
  }
}
