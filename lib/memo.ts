/**
 * Memoise a filesystem read for as long as the file tree is frozen — which is
 * the whole of `next build` and none of `next dev`.
 *
 * Both loaders in this project read files that nothing imports: MDX entries
 * via `readdirSync`, the git snapshot via `readFileSync`. During a build that
 * is free and correct — the process is short and the tree cannot change under
 * it. In dev it is the opposite. Turbopack invalidates a module when something
 * it IMPORTS changes, and neither `content/` nor `lib/git.data.json` is
 * imported by anything. Adding an entry therefore invalidates nothing, so a
 * memo held at module scope keeps answering with the list from before the file
 * existed, until the server restarts.
 *
 * That is not hypothetical: three finished THINK entries returned 404 on
 * :3000 while `next build` prerendered all seven, and the three were exactly
 * the ones written after the first request had filled the memo.
 *
 * So hold it in production and re-read every call in development. Dev pays
 * about twenty small file reads per render, which is not measurable beside
 * compilation, and gets a server that tells the truth about the tree.
 *
 * One half of the problem is out of reach. Listings are fixed by this, because
 * they read the loader directly, but an entry route is pinned by
 * `dynamicParams = false` and Next caches the parameter list, so a brand-new
 * slug 404s until something in the module graph changes. Making that dev-only
 * was tried and Next 16 rejects it — the field has to be a literal boolean.
 * In practice any source edit invalidates it; otherwise restart `next dev`.
 */
export function memoStatic<T>(load: () => T): () => T {
  let held: { readonly value: T } | null = null
  return () => {
    if (process.env.NODE_ENV === 'development') return load()
    held ??= { value: load() }
    return held.value
  }
}
