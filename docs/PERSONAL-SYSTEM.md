# Personal System — Phase 2

The content system. Four chapters, four shapes, one archive.

---

## Why not one `post` type

Each chapter answers a different question, so each stores a different shape.
The extra fields are lifted straight out of the brief rather than invented:

| Chapter | Brief says | Fields |
|---|---|---|
| THINK | 글과 노트 | `updated?`, derived reading estimate |
| MAKE | 어떤 제약이 있었고, 무엇을 포기했고, 무엇이 남았는지 | `constraint` · `tradeoff` · `outcome`, `role`, `period`, `stack[]` |
| LIVE | 일하지 않는 시간 | `place?` |
| TRACE | 지나간 버전, 폐기된 시도, 바뀐 마음 | `kind: version \| abandoned \| reconsidered` |

A generic post type would have flattened all four into "title, date, body" and
quietly thrown the distinctions away. MAKE is the clearest case: the brief
promises **decisions rather than screenshots**, so the constraint, the thing
given up, and the thing that survived are *fields in the model* — not
paragraphs an author may or may not remember to write. They render as a dark
dense slab above the body.

## Pipeline

MDX files under `content/<chapter>/*.mdx`, read at build time.

```
content/think/why-contrast-came-first.mdx
lib/content/schema.ts    types + validation, one file at a time
lib/content/load.ts      filesystem, sorting, drafts, archive merge
components/Prose.tsx     MDX compiled in a Server Component
```

**MDX is compiled on the server.** None of the compiler and none of the
remark/rehype plugins reach the browser: adding the whole content system cost
**0.5 KB** of client JavaScript (173.7 → 174.2 KB). An entry page ships the
same client bundle as a page with no content at all.

Invalid frontmatter **throws**, which fails `next build`. Bad content cannot
reach production by merely rendering empty — it is a build error with the file
name and the field in the message.

## The archive

TRACE is not a fifth pile of posts. It merges every chapter's entries with its
own logs into one chronological stream, each row labelled with the chapter it
came from. The record is *derived from the work*, not maintained alongside it —
which is what makes it a trace rather than a category.

## Reading

Long-form stays on the **light** ground. Sustained reading on the dark ground
costs more than the rhythm gains, so density carries the middle beat instead —
the same reason tone and density are separate axes.

Prose is built from the existing scale; there is no second design system for
"article pages". Code is set in the same grotesk with tabular figures and
wider tracking rather than a mono companion: a second typeface for six code
blocks would break "grotesk only" for very little legibility. Wide code and
tables scroll inside their own box — verified at 390px, where a 602px code
block scrolls internally and the page overflow stays 0.

Dates are formatted by splitting the ISO string, never through `new Date()`.
A prerendered date passed through a Date constructor shifts across midnight
for anyone west of the build machine and silently renames the 24th to the 23rd.
YAML's own date coercion is normalised with **UTC** getters for the same reason.

## Guards

`pnpm check:content` deliberately does **not** re-validate frontmatter types —
`lib/content/schema.ts` already does that during the build, and restating the
rules would create a second source of truth. It checks what a single file
cannot see:

- files outside a known chapter directory, or non-`.mdx` files that would be
  ignored silently
- slugs that will not survive a URL, and case-insensitive collisions
- dates in the future on published entries (a typo that silently sorts to the
  top of every list)
- summaries too long to work as a meta description

Chapters are read out of `lib/sections.ts`, so the guard cannot disagree with
the route table about which chapters exist.

`pnpm check:budget` now **discovers** routes from the build output instead of
reading a list. A route that has to be added by hand is a route that will
eventually be forgotten, and forgotten routes are the ones that get heavy.

## Budget after Phase 2

14 prerendered routes, all passing.

| | tightest route | | limit |
|---|---|---|---|
| html | `/art-direction` | 7.2 KB | 23.4 KB |
| css | entry pages | 5.5 KB | 7.8 KB |
| js | all routes | **174.2 KB** | 180.7 KB |
| font | all routes | 88.0 KB | 97.7 KB |
| total | `/art-direction` | 274.2 KB | 293.0 KB |

Still **6.5 KB** of JS headroom. Phase 3 must dynamically import WebGL; see
`docs/GOLDEN-PATH.md` for the options when the headroom runs out.

## Seed content

The seven entries that ship are real records of building this product — the
contrast derivation, the TypeScript 7 rollback, the cascade-layer inversion.
They exist so the shapes are demonstrated by something true rather than by
lorem ipsum.

`content/live/placeholder.mdx` is the exception and says so plainly: what
someone does outside work is the one thing only they can write, so the slot
was left empty rather than filled with invention.

## Open, deliberately

- **LIVE.** Empty by design, awaiting the author.
- **Tags** are stored and displayed but do not filter yet.
- **Search** — not built. At this volume, the archive is the search.
- **The name.** Still `[name]`, in `lib/site.config.ts`.
