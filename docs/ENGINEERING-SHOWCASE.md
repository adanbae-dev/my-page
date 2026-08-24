# Engineering Showcase — Phase 3

The archive, rendered as a space you move through. One WebGL scene, opt-in,
and a budget model that stops "lazy" from meaning "free".

---

## What it draws

Real data. One bar per entry: chronological order along X, chapter lanes
along Z, height from the reading estimate. Hovering a bar names it; clicking
opens it. Nothing decorative was added to make it look busier than the
archive actually is.

The design principle was **"Interactivity must have meaning."** A shader blob
would have failed it. Seven bars of true data pass it, and the same scene
still reads at seven hundred.

Position is by **rank, not raw date**. Mapping dates linearly looks correct
until a real archive arrives: a week of entries collapses onto one pixel and
a single old entry stretches everything else into nothing.

## What it costs, and where that cost lives

| | |
|---|---|
| First paint, every route | unchanged |
| Deferred chunk | **228.8 KB** gzip (three + R3F) |
| Measured on click | **+229.6 KB**, nothing before |
| Idle GPU work under reduced motion | zero |

Three.js and React Three Fiber together are larger than the entire rest of
the site. They sit behind a button, behind a capability probe, and behind a
dynamic import.

**`drei` was not installed.** It is the conventional companion to R3F and the
brief lists it, but the scene needs a camera rig and a line — writing those
directly costs a few dozen lines, and shipping a ~100 KB helper library for
them would contradict every other decision in this project.

## The budget hole this phase closed

A dynamic import does not appear in the initial HTML, so a route can pass its
first-load budget while pulling half a megabyte the moment someone clicks.
Lazy is weight **moved**, not weight removed.

`pnpm check:budget` now measures a `deferred` category — every chunk no
prerendered route loads on first paint — and holds it to its own limit.

It also splits `js` into **shared** and **route**:

```
✓ shared    174.2 KB /   178.0 KB   framework + shared app code, every route
✓ route       1.7 KB /     6.0 KB   worst single route
✓ deferred  232.4 KB /   240.0 KB
```

One `js` number conflated the framework baseline — which we do not write —
with our own client code, which we choose every time. Reported together, the
framework hid our growth: 96% of budget looked alarming when 92 points of it
were Next and React. Split, the budget binds hardest on the half we control.

## Measured, and rejected

**`next/dynamic` on the toggle component made things worse.** Deferring the
1.7 KB `FieldMount` added 0.9 KB of loader machinery to the route bundle —
a net loss. Below a certain size, deferring a component costs more than
shipping it. The import is static, with the measurement recorded in the code
so nobody re-tries it. The heavy thing is Three.js, and that is deferred
*inside* FieldMount.

## Degradation, verified rather than asserted

| Condition | Behaviour | How it was checked |
|---|---|---|
| No JavaScript | The archive list is the page. The field is an addition that never arrives. | Server-rendered HTML |
| No WebGL | Toggle explains and stays closed; list untouched. | Capability probe returns `no` |
| `prefers-reduced-motion` | Camera fixed, hover and click still work. | Canvas pixel-identical across 900 ms idle |
| Context lost | Falls back with a message rather than a dead canvas. | `webglcontextlost` handler |
| 390 px viewport | Stage 347×439, page overflow 0. | Measured |

Reduced motion removes **motion**, not capability — and `frameloop: 'demand'`
means an idle tab does zero GPU work, which is the part a visitor who asked
for less motion actually feels.

The **list is never removed**. The field is layered above it, so keyboard and
screen-reader users always have the archive. Text lives in the DOM, not in
the canvas: text drawn into WebGL is invisible to assistive technology and
blurry at every scale the canvas is not.

## Colours come from the stylesheet

The scene reads `--ground`, `--figure`, `--accent` and `--rule` off the live
computed style rather than repeating hex values, so the 3D view cannot drift
from the design system and inverts correctly if its section ever changes
tone. The pre-mount fallbacks live in `lib/tokens.data.ts` — the one
sanctioned bridge — and `pnpm check:contrast` asserts all four still match
`styles/tokens.css`.

## One lint rule is disabled, on purpose

`react-hooks/immutability` is switched off for the camera rig and nowhere
else. React Compiler is right in general and wrong there: `camera` is a live
three.js object the renderer owns, not React state, and R3F's entire
programming model is imperative mutation of that scene graph between frames.
There is no `setState` equivalent to migrate to. The disable is scoped to one
component and carries the reason.

The other two compiler findings were **real** and were fixed rather than
silenced: `prefers-reduced-motion` is now read with `useSyncExternalStore`
instead of setState-in-an-effect, and the WebGL probe moved to the click
handler — detection costs a throwaway WebGL context, and contexts are a
limited resource that no page should spend answering a question nobody asked.

## Also fixed

`aspect-ratio` with a `min-block-size` is a trap. When the minimum height
wins, the ratio drives the **width** up to satisfy it: a 20rem minimum became
a 569 px box inside a 390 px screen and pushed 200 px of horizontal overflow
onto the page. The stage now takes its height from the viewport and lets
width simply fill the column.

## Open, deliberately

- **Keyboard access to the field.** Bars are pointer-only. The list is the
  accessible path today; roving-tabindex over the bars is worth doing and is
  not done.
- **Touch.** Hover has no touch equivalent; tapping navigates directly.
- **Scale.** Seven bars are seven draw calls. Past a few hundred entries this
  wants instancing — the geometry is already uniform, so the change is local.
