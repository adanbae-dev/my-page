# Interaction

Scroll- and pointer-driven behaviour, at **zero JavaScript cost**.

---

## Why not GSAP

GSAP is ~50 KB gzipped, ScrollTrigger on top. The shared bundle had 3.2 KB of
headroom. A JS scroll library was never available here — and that turned out
to be the right constraint rather than a limitation:

- CSS scroll-driven animations run on the **compositor**, so they cannot jank
  the main thread the way a scroll listener can.
- They work with **JavaScript disabled**.
- They cost **0 bytes of JS**. Adding the whole interaction layer moved the
  shared bundle by nothing and CSS from 5.9 → 6.3 KB.

"Technology is invisible" is easier to honour when there is no technology to
hide.

## What was added

| | Where | Driven by |
|---|---|---|
| Chapter headline arrives, clipped upward from its own baseline | golden path, chapter pages | `animation-timeline: view()` |
| Section rule draws itself | every section head | `view()` |
| List rows settle as they enter | every listing | `view()` |
| Reading progress hairline in the index bar | entry pages only | `animation-timeline: scroll(root)` |
| Hovering or focusing one axis dims the others | hero | `:hover` / `:focus-within` |
| A hairline draws under the row being considered | listings | `transition` |
| The accent mark wipes in once, on arrival | hero | `@starting-style` |

The headline reveal is a **typographic** gesture, not a fade: the line is
clipped from its baseline upward, the way type lands on a page. A floating
fade would have been decoration, and the brief forbids it — *interactivity
must have meaning*.

Reading progress exists only where there is something to read. `/think` is a
list; `/think/some-note` is a page you move through. Measured: the bar tracks
scroll 1:1 (0 → 0.25 → 0.5 → 0.75 → 1) and is absent from listings.

## The failure mode this could have had

A reveal animation starts from an invisible state. That is fine while the
animation runs and a **disaster** the moment it does not — a browser without
scroll timelines, or a visitor who asked for less motion, is left looking at
a page with a hole in it. Nothing errors. The text is simply never there.

So `pnpm check:motion` reads the built CSS and holds every scroll-driven rule
to a requirement **proportional to what it actually does**:

```
✓ readingProgress   indicator only    .progress
✓ arrive            hides content     .arrive
✓ draw              indicator only    .draw
✓ settle            hides content     .settle
```

- Every scroll-driven rule must sit inside `@supports (animation-timeline: …)`.
- A rule whose **from-state hides content** — opacity below 0.9, or a
  clip-path with a non-zero inset — must additionally sit inside
  `@media (prefers-reduced-motion: no-preference)`.

A progress hairline growing from `scaleX(0)` hides nothing. Forcing it behind
the motion gate would take a useful indicator away from the very readers the
gate exists to protect, so the guard does not ask for it.

Verified by walking the whole document and confirming **all 8 reveal targets
resolve to fully visible** — no content is permanently hidden.

### The guard missed its own subject, once

The first version scanned for declarations ending at `;`. Minified CSS drops
the final semicolon of every rule, so the last declaration in each block was
never examined — and `animation-timeline` is the last declaration in the
progress rule. The guard reported "all gated" while the one rule it was
written for went unseen. It now terminates on `;` **or** `}`.

## Also fixed

`.axes` set `color: var(--muted)` in a CSS Module. Modules are unlayered and
beat the utilities layer, so the dim-the-siblings rule had nothing left to
dim — the interaction was a no-op that looked implemented. The module no
longer sets colour; the utility owns it. The dimmed state is `--muted`, which
still clears 4.55:1, so the effect cannot push text under AA.

## Measured after

- Lighthouse: accessibility / best practices / SEO / agentic **100 · 100 · 100 · 100**, 51 passed, 0 failed
- LCP **114 ms**, CLS **0.00** — no regression
- JS unchanged; CSS 6.3 KB of an 7.8 KB budget

## Open, deliberately

- Chapter pages reuse the same reveal as the golden path. A distinct arrival
  for a depth route would be better and is not done.
- The WebGL field still has no keyboard path — the list remains the
  accessible route. Unchanged from Phase 3.

---

## Round two — the effects layer

Added after the i18n and topics work, on the same premise: **no JavaScript.**
`js.route` was 6.4 KB before and 6.4 KB after. Everything below is CSS.

### What was added

| | Driver | Gated by |
|---|---|---|
| `lineIn` | `view()`, offset per line by `--i` | supports + reduced-motion |
| `trail` | `view()` | supports + reduced-motion |
| `layIn` | `view()`, clip-path wipe | supports + reduced-motion |
| `slideIn` | `view()` | supports + reduced-motion |
| `indexFill` | `view()`, colour only | supports — it is an indicator |
| `pin` | `position: sticky` | — |
| `lift` · `tilt` | `:hover` / `:focus-visible` | — |
| `accentRise` | `:hover` / `:focus-visible`, `scaleY` from baseline | — |
| `rowMark` | `:hover` / `:focus-visible`, `background-size` | — |
| `onLoad` | `@starting-style` | reduced-motion (from-state only) |
| `balance` | `text-wrap` | — |
| `::selection` | — | — |
| shared elements | `@view-transition` + `view-transition-name` | — |

`pnpm check:motion` classifies all nine scroll-driven ones and asserts each is
gated for what it actually does. `indexFill` is an indicator — it moves over
content that is already painted — so it stays available to a visitor who asked
for less motion, the same call the reading-progress hairline gets.

### One that shipped broken

`sweep` sent an accent band through the display type with
`background-clip: text`, and it made the home page headline invisible. That
property paints an element's OWN background through its glyphs and needs
`color: transparent` to show — but `DisplayLines` wraps each line in a span,
and a span inherits the transparent colour while background is not an
inherited property. Nothing to clip, nothing to see. Removed rather than
repaired: every display headline here goes through DisplayLines, so the effect
has no site, and leaving the class in would mean the next child element added
inside such a headline vanishes with no error.

### Two that needed a different mechanism

**`onLoad` cannot use a scroll timeline.** Above-the-fold copy is already in
view, so `entry` never happens and the element would sit at its from-state
forever. `@starting-style` runs once on arrival with no scroll involved. The
settled state is declared outside the motion query so reduced motion gets
finished content rather than nothing.

**Shared-element transitions need a name per element**, and no single CSS rule
can name N rows. `view-transition-name: entry-{chapter}-{slug}` is set inline
on the list title and on the article's own `<h1>`, so the browser morphs one
into the other across a full document load. It costs html bytes on pages that
have rows and nothing anywhere else.

### Cost

```
css     7.24 -> 7.7 KB     86% of budget (raised 8000 -> 9216, recorded there)
total  288.6 -> 289.2 KB   98% of budget
route    6.4 -> 6.4 KB     unchanged
```

Effect instances on one page: 54 on the golden path, 56 on TRACE.
