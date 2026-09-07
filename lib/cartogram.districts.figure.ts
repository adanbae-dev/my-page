import {
  DISTRICTS,
  D_GRID_COLS,
  D_GRID_ROWS,
  per10k,
  type District,
} from './cartogram.districts.data'

/**
 * The district figure, assembled into strings at build time.
 *
 * WHY STRINGS AND NOT ELEMENTS — this is a measurement, not a preference.
 *
 * A Server Component's output travels twice: once as HTML for the browser to
 * paint, and once as a serialized React tree so the client can keep
 * rendering the same page. For prose the second copy is small. For 490 SVG
 * elements it is not. Measured on this route, before this file existed:
 *
 *   markup                          11.6 KB gzip
 *   serialized tree (__next_f)      26.5 KB gzip
 *   ------------------------------------------
 *   page total                      37.6 KB   against a 23.4 KB budget
 *
 * Seventy percent of the page was the copy nobody looks at. The hexagons
 * cannot change — there is no client JavaScript on this route and the data
 * is a frozen table — so React is being asked to keep five hundred objects
 * addressable for no purpose. Built here, the whole field is one string, and
 * the second copy costs about what the first one does.
 *
 * The cost of that choice is `dangerouslySetInnerHTML` at the call site, so
 * the strings are built HERE and nowhere else: every value below comes from
 * the typed table in cartogram.districts.data.ts, the two text values that
 * reach a document are escaped, and nothing crosses this module that a
 * reader could supply.
 */

/**
 * THE UNIT IS CHOSEN SO EVERY CENTRE IS A WHOLE NUMBER.
 *
 * A pointy-top hex grid steps `sqrt(3)·R` across and `1.5·R` down, and both
 * are irrational for any R worth using: at R=13 the centres came out
 * `x="417.6" y="14"`. Nine hundred and eighty numbers, each carrying a
 * decimal point and a digit that lands well below one screen pixel, and each
 * written twice — the markup and the serialized tree.
 *
 * So the grid is defined by its STEP instead of by its radius. 30 across and
 * 26 down is the same picture: 30/26 = 1.1538 against the true 1.1547, an
 * 0.08% vertical stretch across the whole map, which is a tenth of a pixel
 * at the bottom edge. In exchange every centre is a two- or three-digit
 * integer. The radius follows from the step rather than the other way round.
 */
const STEP_X = 30
const STEP_Y = 26
const R = STEP_X / Math.sqrt(3)

/** A pointy-top hexagon of the given radius, centred on the origin. */
export function hexPath(radius: number): string {
  const a = round((radius * Math.sqrt(3)) / 2)
  const h = round(radius / 2)
  const r = round(radius)
  return `M0 ${-r}L${a} ${-h}L${a} ${h}L0 ${r}L${-a} ${h}L${-a} ${-h}Z`
}

/** One decimal — a unit here is under a fifth of a rendered pixel. */
function round(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Exported, because a second map reads the same grid.
 *
 * /portfolio/prices draws price change on these 245 cells. The placement is
 * the expensive, checkable artefact — 1.2 million boundary points and a
 * Hungarian assignment — and it belongs to the grid, not to whichever value
 * happens to be painted on it. Two copies of this arithmetic would be two
 * maps of Korea that slowly stopped agreeing.
 */
export const cx0 = (d: District) =>
  d.col * STEP_X + (d.row % 2 === 1 ? STEP_X / 2 : 0) + STEP_X / 2 + 1
export const cy0 = (d: District) => d.row * STEP_Y + Math.ceil(R) + 1

/**
 * The five characters that change meaning inside markup.
 *
 * District names are Hangul and come from a government table, so none of
 * them contains one of these today. That is not a reason to skip it: this
 * module writes a document, and a function that writes a document escapes
 * what it writes, or the day the table gains a `&` is the day it stops being
 * true.
 */
export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  )

export const D_SVG_WIDTH = (D_GRID_COLS + 0.5) * STEP_X + 2
export const D_SVG_HEIGHT = Math.round((D_GRID_ROWS - 1) * STEP_Y + R * 2 + 2)

/** The reference hexagon every cell points at. */
export const D_CELL_PATH = hexPath(R)

/**
 * EIGHT CLASSES, CUT WHERE THE DATA HAS GAPS.
 *
 * Two schemes were tried before this one and both failed in a way the map
 * showed. The distribution is the reason:
 *
 *   p10   5.3    p50  13.5    p90  20.9    p95  22.7    p100  39.8
 *
 * and above p95 sit four districts of central Seoul — 중구 39.8, 강남 37.0,
 * 용산 34.0, 서초 31.3 — a tail twice as long as the body it hangs off.
 *
 *   SIZE, sqrt-scaled to the maximum. The tail set the maximum, so the
 *   middle 80% of the country landed between 0.36 and 0.72 of full radius.
 *   A two-fold radius difference across 196 touching tiles is invisible.
 *
 *   COLOUR, seven classes of equal count. The counts were perfect and the
 *   widths were not: 5.0, 3.9, 2.4, 2.1, 2.3, 2.5 — and then 20.6. The top
 *   class was wider than the other six together, so 19.3 and 39.8 were the
 *   same colour. Which is the complaint that produced this comment.
 *
 * So the breaks are NATURAL BREAKS now — Fisher-Jenks, computed exactly by
 * dynamic programming below, which places k classes so that the total
 * squared deviation inside them is as small as it can be. It is the scheme
 * that answers "where does this data actually separate" instead of imposing
 * an answer, and on these 245 rows it puts the Seoul four in a class of
 * their own and still splits the crowded middle:
 *
 *   count  41 · 27 · 46 · 56 · 43 · 23 ·  6 ·  3
 *   width 5.6 ·3.2 ·3.0 ·3.2 ·3.5 ·6.0 ·8.3 ·5.9
 *
 * WHAT IT COSTS is even counts: the top two classes are nine districts
 * between them, so nine tiles carry the two hottest colours. That is the
 * honest picture — there really are only nine — but it means area on this
 * map is not proportional to anything, and the legend has to be read rather
 * than assumed. The breaks are printed under it, and every exact number is
 * one hover away.
 */
export const D_CLASSES = 8

/**
 * Fisher-Jenks, exact.
 *
 * O(k·n²) with n = 245 and k = 8 — about half a million cheap iterations,
 * once, at build time. The greedy approximation usually quoted for this is
 * not needed at this size, and an approximation would make the breaks depend
 * on the starting guess rather than on the data.
 *
 * The within-class sum of squares comes from prefix sums, so `sse` is O(1)
 * and the whole thing stays a triple loop rather than a quadruple one.
 */
function naturalBreaks(sorted: readonly number[], k: number): number[] {
  const n = sorted.length
  const s1 = new Float64Array(n + 1)
  const s2 = new Float64Array(n + 1)
  for (let i = 0; i < n; i++) {
    s1[i + 1] = s1[i]! + sorted[i]!
    s2[i + 1] = s2[i]! + sorted[i]! * sorted[i]!
  }
  /** Squared deviation of sorted[i..j). */
  const sse = (i: number, j: number): number => {
    const m = j - i
    if (m <= 0) return 0
    const sum = s1[j]! - s1[i]!
    return s2[j]! - s2[i]! - (sum * sum) / m
  }

  const INF = Number.POSITIVE_INFINITY
  let prev = new Float64Array(n + 1).fill(INF)
  prev[0] = 0
  const back: number[][] = []
  for (let c = 1; c <= k; c++) {
    const cur = new Float64Array(n + 1).fill(INF)
    const from = new Int32Array(n + 1)
    for (let j = c; j <= n; j++) {
      for (let i = c - 1; i < j; i++) {
        if (prev[i] === INF) continue
        const t = prev[i]! + sse(i, j)
        if (t < cur[j]!) {
          cur[j] = t
          from[j] = i
        }
      }
    }
    back.push(Array.from(from))
    prev = cur
  }

  const starts: number[] = []
  let j = n
  for (let c = k; c >= 1; c--) {
    const i = back[c - 1]![j]!
    starts.push(i)
    j = i
  }
  return starts.reverse().map((i) => sorted[i]!)
}

const rates = DISTRICTS.map(per10k).sort((a, b) => a - b)

/** Lower bound of each class, then the maximum. `D_CLASSES + 1` numbers. */
export const D_BREAKS: readonly number[] = [
  ...naturalBreaks(rates, D_CLASSES),
  rates[rates.length - 1]!,
]

/** How many districts fall in each class — the thing Jenks does not equalise. */
export const D_CLASS_COUNTS: readonly number[] = D_BREAKS.slice(0, D_CLASSES).map(
  (lo, i) => {
    const hi = i + 1 < D_CLASSES ? D_BREAKS[i + 1]! : Number.POSITIVE_INFINITY
    return rates.filter((v) => v >= lo && v < hi).length
  },
)

const classOf = (v: number): number => {
  for (let i = D_CLASSES - 1; i > 0; i--) if (v >= D_BREAKS[i]!) return i
  return 0
}

/**
 * Every district, once.
 *
 * This used to be two layers — a full-size outline for the silhouette and a
 * scaled fill for the value — which meant 490 elements and every centre
 * written twice. With the value in the fill colour the two collapse into
 * one, and the page lost about four kilobytes for a picture that reads
 * better.
 *
 * The class goes on as a plain `class` attribute rather than a colour: seven
 * distinct strings compress to nothing, and the palette stays in CSS where
 * the tone tokens live. `<title>` is what a pointer gets with JavaScript
 * off, and it is also where components/HexTip.tsx reads the name and the
 * rate from, so the two can never disagree. `data-n` carries the only two
 * facts the popup needs that the title does not already say.
 */
export const D_CELLS: string = DISTRICTS.map((d) => {
  const rate = per10k(d)
  return (
    `<use href="#c" x="${cx0(d)}" y="${cy0(d)}" class="q${classOf(rate)}"` +
    ` data-n="${d.brokers},${d.pop}">` +
    `<title>${esc(d.sido)} ${esc(d.sgg)} · ${rate.toFixed(1)}</title></use>`
  )
}).join('')

/** The same numbers in rank order — the map's text alternative. */
export const D_RANKED: string = [...DISTRICTS]
  .sort((a, b) => per10k(b) - per10k(a))
  .map((d) => `<li>${esc(d.sgg)}<span class="muted"> · ${per10k(d).toFixed(1)}</span></li>`)
  .join('')
