# Golden Path — Phase 1

The first complete journey through the product, and the route structure the
remaining phases hang content on.

---

## The shape

Hybrid. Scrolling `/` once is a complete visit; the four depth routes are an
offer, not a requirement.

```
/                       ← the whole argument, in one scroll
├─ hero        light · calm
├─ #think      dark  · dense   ──→ /think
├─ #make       dark  · dense   ──→ /make
├─ #live       light · calm    ──→ /live
└─ #trace      light · calm    ──→ /trace
```

A reader who never clicks anything has still met the whole person. That is
why each chapter states its own case on the golden path *before* it points
inward — the depth route is where the evidence lives, not where the claim is
first made.

## Route inventory

| Route | Rendering | Purpose |
|---|---|---|
| `/` | static | the golden path |
| `/think` `/make` `/live` `/trace` | SSG via `generateStaticParams` | depth |
| `/art-direction` | static | the Phase 0 design-system proof, kept as reference |
| `/_not-found` | static | 404, on-brand, lists the four chapters |

`dynamicParams = false`, so anything outside the four chapters is a real 404
rather than a blank rendered shell.

## Every page performs the same arc

A depth route does **not** drop straight onto its chapter's ground. It opens
light and calm, inverts into the chapter's own tone, and closes light and
calm — the same Calm → Dense → Calm arc as the golden path. The arc is a
property of the product, not of one page.

Where a chapter's own tone is already light (LIVE, TRACE) the middle beat is
carried by **density** instead of tone. That is the entire reason tone and
density are separate axes in `lib/tone.ts`.

## The index bar

`components/Nav.tsx`. Two behaviours, both enhancements over markup that
already works:

1. **It adopts the ground beneath it.** An IntersectionObserver watches a 1px
   band immediately below the bar; whichever section crosses that band sets
   the bar's `data-tone`. One figure colour and one accent therefore stay
   legible across the whole inversion without the bar ever restyling itself.
2. **It marks the chapter you are standing in** — a different question from
   (1), and measured against a different band (the middle 5% of the viewport).

   The observer keeps a live set of what is in the band and resolves it in
   document order. Taking "the last entry that reported intersecting" instead
   depends on callback ordering and marks the wrong chapter while crossing a
   boundary — it did, until it was measured.

The current chapter is marked as a **solid accent block with ink on top**,
which is the one accent treatment legal on both grounds. Below `40rem` the
index numbers are dropped and the **names** are kept: a number is ornament,
the name is the only part that says where the link goes.

Targets are 44px, above the 24×24 CSS px of WCAG 2.2 SC 2.5.8.

## View transitions

The chapter headline on the golden path and the page headline on the depth
route share a `<ViewTransition name={`chapter-${id}`}>`, so the browser
carries the heading across the navigation instead of cutting to an unrelated
page. Verified in the browser: `document.startViewTransition` fires once per
navigation and `chapter-think` is live on the element mid-flight.

Without browser support the navigation simply happens. Nothing depends on it.

## Progressive enhancement — verified, not asserted

Fetched from the production server with no JavaScript involved, `/` contains:
8 tone-bearing sections, all four in-page anchors, all four depth-route links,
the labelled `<nav>`, the skip link, and an `<h1>` whose accessible name reads
"An interface for a life in progress". Depth routes render in full. `/nope`
returns 404.

## Budget after Phase 1

| | `/` | limit |
|---|---|---|
| html | 4.4 KB | 23.4 KB |
| css | 4.4 KB | 7.8 KB |
| js | **173.7 KB** | 180.7 KB |
| font | 88.0 KB | 97.7 KB |
| total | 270.4 KB | 293.0 KB |

The budget is now enforced **per route** — a budget checked only on the home
page stops being a budget the moment a second page exists.

Phase 1 spent **5.1 KB** of JS on the entire navigation system (tone
mirroring, scroll-spy, route awareness). That leaves **7 KB of headroom**, and
Phase 2 will hit it. The three honest options at that point, in order of
preference:

1. Replace the client component with a ~1 KB vanilla enhancement — loses
   `usePathname`, gains ~4 KB.
2. Split the budget into `js.baseline` (framework; a tripwire for Next/React
   upgrades) and `js.app` (our client code). More binding on the part we
   actually control, not less.
3. Raise the limit with a written justification.

Raising it *without* one turns the budget into a suggestion.

## Fixed in this phase

A cascade-layer inversion. `@layer` order is established by **first
appearance**, and the bundler emitted a `@layer components { … }` block into
the stylesheet before `styles/layers.css` was parsed. The declared order was
silently discarded and rebuilt from emission order, which put `components`
*below* `reset` — so `* { margin: 0 }` was quietly beating component styles.
Nothing errored; a handful of declarations just stopped applying, including
the hero spacing on the Phase 0 page.

CSS Modules are now deliberately **unlayered** (they are already scoped, and
unlayered rules outrank every layered one), and `pnpm check:layers` asserts on
the real built CSS that the first `@layer` token is the ordering statement,
that the order is what the source says, and that no module has re-entered a
layer.

## Open, deliberately

- **Chapter content.** Every depth route ships the shape and states plainly
  that it is a shape. Phase 2 fills it.
- **Scrollytelling.** The golden path is currently a well-set document, not a
  scroll-driven narrative. Motion on scroll is Phase 2/3 work and has to be
  argued against the JS budget above.
- **Mobile divergence.** The brief says desktop and mobile are different
  experiences. Both currently share one responsive layout.
- **The name.** Still `[name]`, in `lib/site.config.ts`.
