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
 * The value scale needs more precision than a coordinate does.
 *
 * It multiplies a 17-unit radius, so one decimal would quantise 245
 * districts into ten visible sizes and put banding into the picture. Two
 * decimals is a 0.17-unit step, well under a pixel. The leading zero goes —
 * SVG does not need it.
 */
const scaleNum = (n: number): string =>
  String(Math.round(n * 100) / 100).replace(/^(-?)0\./, '$1.')

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

const MAX_RATE = Math.max(...DISTRICTS.map(per10k))

/**
 * Every cell that holds a district, drawn once as an outline.
 *
 * The empty cells are not drawn at all — at this density an empty grid
 * behind the data reads as noise.
 */
export const D_OUTLINES: string = DISTRICTS.map(
  (d) => `<use href="#c" x="${cx0(d)}" y="${cy0(d)}"/>`,
).join('')

/**
 * The values, as scaled copies of the same hexagon.
 *
 * Square root: the shape grows in two dimensions, so area tracks the value
 * only when the radius tracks its root. A `scale()` on the shared reference
 * rather than a fresh `d` per district — 245 path strings said the same
 * thing 245 times.
 */
export const D_FILLS: string = DISTRICTS.map((d) => {
  const rate = per10k(d)
  const s = Math.sqrt(rate / MAX_RATE)
  if (s * R < 0.5) return ''
  return (
    `<use href="#c" transform="translate(${cx0(d)} ${cy0(d)}) scale(${scaleNum(s)})">` +
    `<title>${esc(d.sido)} ${esc(d.sgg)} · ${rate.toFixed(1)}</title></use>`
  )
}).join('')

/** The same numbers in rank order — the map's text alternative. */
export const D_RANKED: string = [...DISTRICTS]
  .sort((a, b) => per10k(b) - per10k(a))
  .map((d) => `<li>${esc(d.sgg)}<span class="muted"> · ${per10k(d).toFixed(1)}</span></li>`)
  .join('')
