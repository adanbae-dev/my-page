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

const cx0 = (d: District) =>
  d.col * STEP_X + (d.row % 2 === 1 ? STEP_X / 2 : 0) + STEP_X / 2 + 1
const cy0 = (d: District) => d.row * STEP_Y + Math.ceil(R) + 1

/**
 * The five characters that change meaning inside markup.
 *
 * District names are Hangul and come from a government table, so none of
 * them contains one of these today. That is not a reason to skip it: this
 * module writes a document, and a function that writes a document escapes
 * what it writes, or the day the table gains a `&` is the day it stops being
 * true.
 */
const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  )

export const D_SVG_WIDTH = (D_GRID_COLS + 0.5) * STEP_X + 2
export const D_SVG_HEIGHT = Math.round((D_GRID_ROWS - 1) * STEP_Y + R * 2 + 2)

/** The reference hexagon every cell points at. */
export const D_CELL_PATH = hexPath(R)

/**
 * SEVEN CLASSES OF EQUAL COUNT, and the reason is the shape of the data.
 *
 * The first version of this map encoded the rate as the SIZE of the hexagon,
 * scaled by square root against the maximum. It did not read. Measured on
 * the same 245 rows:
 *
 *   p10   5.3      p50  13.5      p90  20.9      p100  39.8
 *
 * The top of the range belongs to four districts in central Seoul, and
 * scaling to 39.8 squeezed the middle eighty percent of the country into
 * radii between 0.36 and 0.72 of full — a two-fold difference in radius
 * spread across 196 districts, next to each other, at forty pixels each.
 * Everything looked the same because, on that scale, everything was.
 *
 * Colour replaces it, and the classes are QUANTILES: 35 districts per class,
 * so each step of the ramp is the same amount of country. That guarantees
 * the picture uses its whole range no matter how the values bunch, and it
 * costs the reader the ability to read magnitude off the ramp — a class is
 * "the next 35 districts up", not "five more per ten thousand". The breaks
 * are therefore printed under the map rather than left implicit, and the
 * exact number for any one district is in its popup.
 *
 * Size is gone as a channel. At 245 tiles it was never going to beat colour,
 * and dropping it lets every hexagon reach its neighbours — which is what
 * makes the country read as a country rather than as 245 dots.
 */
export const D_CLASSES = 7

const rates = DISTRICTS.map(per10k).sort((a, b) => a - b)

/** Lower bound of each class, then the maximum. `D_CLASSES + 1` numbers. */
export const D_BREAKS: readonly number[] = [
  ...Array.from({ length: D_CLASSES }, (_, i) => rates[Math.floor((i * rates.length) / D_CLASSES)]!),
  rates[rates.length - 1]!,
]

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
