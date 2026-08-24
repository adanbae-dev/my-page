# Art Direction — Inverted Duotone

Phase 0 of PERSONAL INTERFACE. This document is the contract; `styles/tokens.css`
is the implementation; `pnpm check:contrast` is the enforcement.

---

## The premise

**Two grounds, one accent.** The page moves light → dark → light, and that
movement *is* the "Calm → Dense → Calm" structure from the brief. Tone is not
a theme and not a user preference — it is a compositional beat.

## The tone model

A section declares one attribute:

```tsx
<Section tone="dark" density="dense">
```

That attribute re-points every semantic role. No component ever names a colour;
components speak only in roles — `--ground`, `--figure`, `--muted`, `--rule`,
`--accent`, `--accent-text`, `--on-accent`, `--focus`.

Three consequences fall out of this, and all three are deliberate:

1. **It works with JavaScript off.** The rhythm is a server-rendered attribute,
   not client state. This is the "progressive enhancement" line of the brief
   paid for rather than asserted.
2. **`density` is orthogonal to `tone`.** A section can be dark and calm, or
   light and dense. Coupling them would have collapsed two independent axes
   into one.
3. **Tone deliberately ignores `prefers-color-scheme`.** A visitor whose OS is
   in dark mode still gets the light opening. Following the OS preference would
   destroy the light→dark→light arc — there would be nothing left to invert.
   Per-tone `color-scheme` is still declared, so form controls and scrollbars
   match the ground they sit on.

Adjacent sections sharing a tone collapse their boundary padding: only a real
inversion earns the full gap. That rule lives in `Section.module.css` rather
than `base.css` because `@layer components` beats `@layer base` — in the base
layer it loses silently.

## The palette

| Role | Light | Dark | Contrast vs ground |
|---|---|---|---|
| `--ground` | `#f7f5f0` | `#0b0b0c` | — |
| `--figure` | `#0b0b0c` | `#f7f5f0` | 18.06:1 (AAA) |
| `--muted` | `#70706e` | `#7a7977` | 4.55 / 4.52 (AA) |
| `--accent` | `#ff4d00` | `#ff4d00` | 3.05 / 5.91 |
| `--accent-text` | `#cc3e00` | `#ff4d00` | 4.53 / 5.91 (AA) |
| `--on-accent` | `#0b0b0c` | `#0b0b0c` | 5.91 on the fill |
| `--focus` | `#cc3e00` | `#cc3e00` | 4.53 / 3.99 |

None of these were picked by eye. Each was solved backwards from the contrast
target it had to hit, and `pnpm check:contrast` re-derives all twelve on every
run.

### The accent law

`#ff4d00` measures **3.05:1 on paper** and **5.91:1 on ink**. So:

- On the **light** ground the accent may be a fill, a rule or a focus ring —
  never body-size text. Accent text there uses `--accent-text` (`#cc3e00`).
- On the **dark** ground the accent *is* the text colour; `--accent` and
  `--accent-text` are the same value.

This is why the accent appears as a **block** on light and as **letters** on
dark. The constraint produced the art direction; it is not a workaround for it.

Two supporting rules:

- **Text on the accent fill is always `--on-accent` (ink), in both tones.**
  Paper on accent is 2.92:1 and white on accent is 3.33:1 — both fail. The one
  colour that works on the accent never inverts.
- **The focus ring never changes across the inversion.** `#cc3e00` clears 3:1
  on both grounds, so focus does not have to know which side it is on.

> Paper started at `#f2f0eb`, where the accent measured 2.92:1 and failed even
> the 3:1 non-text threshold. Lifting the paper to `#f7f5f0` cleared it while
> keeping `#ff4d00` exactly as chosen — the ground moved so the accent would
> not have to.

## Type

One family: **Archivo**, variable, `wght` + `wdth`. The width axis carries the
display/body distinction a second typeface would normally carry, which is how
"grotesk only" stays a discipline instead of a limitation. Numerals use
`tabular-nums` rather than a mono companion.

`--t-display` is capped at `clamp(1.75rem, 9.2vw, 9rem)`. That ceiling is
measured, not chosen: the longest headline line occupies **9.36px of width per
1px of font-size** in the real face, and the container is `100vw - 2 × gutter`.
Anything above ~10.2vw turns the controlled line breaks into an uncontrolled
wrap. `.accentBlock` is `white-space: nowrap` so the mark is a single object or
nothing — an inline-block does not break across lines, but its *content* does,
which fragments the mark into two stacked slabs.

## Motion

Five durations — 120 / 220 / 420 / 720 / 900ms — and three easings. Nothing else.

Under `prefers-reduced-motion: reduce` every duration collapses to 1ms **but
state still changes**. A visitor who asks for less motion gets the full
Calm → Dense → Calm structure as cuts instead of transitions. Nothing is hidden.

## Budget

`perf.budget.json`, enforced by `pnpm check:budget` against the production
build. Set now, while the page is nearly empty, so every later phase has to
argue for the weight it adds.

| | Used | Budget |
|---|---|---|
| html | 7.1 KB | 23.4 KB |
| css | 3.7 KB | 7.8 KB |
| js | 168.6 KB | 180.7 KB |
| font | 88.0 KB | 97.7 KB |
| **total** | **267.4 KB** | **293.0 KB** |

**JS sits at 93% of budget before a single feature ships.** That is the Next 16
+ React 19 baseline, not product code. It has a direct consequence for Phase 3:
Three.js + React Three Fiber + drei is roughly 150 KB gzipped and **cannot** be
in the initial bundle. WebGL has to be dynamically imported behind a capability
check, which the brief already anticipates ("WebGL 실패 대비").

## Verify

```bash
pnpm verify     # typecheck → lint → contrast → build → budget
```

`eslint` additionally forbids raw hex literals outside `styles/tokens.css`.
`lib/tokens.data.ts` is the one exemption, because `<meta name="theme-color">`
is resolved at build time and cannot read a custom property — and the contrast
guard asserts those literals still match the stylesheet.

## Open, deliberately

- **Korean typeface.** Archivo carries no Hangul, so Korean currently falls
  through to the platform grotesk (Pretendard → Apple SD Gothic Neo → Malgun).
  A webfont would cost real budget; deferred to Phase 4 with a measurement.
- **Mobile display treatment.** The brief says desktop and mobile are different
  experiences. Phase 0 ships one type ramp that is safe at every width; the
  divergent mobile hero belongs to Phase 1.
- **The name.** `site.name` is still `[name]`, confined to one constant in
  `lib/site.config.ts`.
