import { DISTRICTS } from './cartogram.districts.data'
import { cx0, cy0, esc } from './cartogram.districts.figure'
import { PRICE_EDGES, PRICE_VALUES } from './prices.data'

/**
 * Price change on the district grid.
 *
 * THE GRID IS BORROWED, NOT COPIED. Placement comes from
 * cartogram.districts.figure.ts — the same 245 cells, from the same 1.2
 * million boundary points and the same Hungarian assignment. Two maps of
 * Korea built from two copies of that arithmetic would slowly stop agreeing,
 * and the one thing a reader should be able to assume about two maps on one
 * site is that the shapes mean the same places.
 *
 * WHAT IS NOT BORROWED is the encoding, and that is the whole reason this is
 * a second file. The brokerage map runs one hue from dark to bright: more is
 * brighter, and there is no such thing as negative. Price change has a
 * middle. 42 districts fell and 118 rose, so zero is a real boundary, and a
 * sequential ramp would have to place it somewhere arbitrary inside its own
 * lightness range — leaving the reader to work out from the legend whether a
 * mid-dark cell is a small rise or a large fall.
 *
 * So this scale diverges, with `--decline` on the falling side. That is a
 * second colour in a palette that had exactly one, and it was added on the
 * data's terms rather than the design's: registered in lib/tokens.data.ts,
 * measured by scripts/check-contrast.mjs against both grounds (3.13:1 and
 * 5.76:1, against the accent's 3.05 and 5.91, so neither half of the scale
 * shouts louder than the other) and published on /art-direction like every
 * other role.
 *
 * UNMEASURED IS A CLASS, NOT A HOLE. Districts with no complex trading at
 * both ends of the window keep their hexagon in a neutral fill. The
 * country's outline is what makes this map readable at all, and punching
 * holes in it to mean "no evidence" would read as "no change".
 */

const byName = new Map(PRICE_VALUES.map((v) => [`${v.sido}\t${v.sgg}`, v]))

/** Class index, or `null` for a district with too few pairs. */
export function priceClass(change: number | null): number | null {
  if (change === null) return null
  for (let i = PRICE_EDGES.length - 1; i >= 0; i--) {
    if (change >= PRICE_EDGES[i]!) return i + 1
  }
  return 0
}

export const P_CLASSES = PRICE_EDGES.length + 1

const signed = (v: number) => `${v > 0 ? '+' : ''}${v}%`

/**
 * Every district, once.
 *
 * `data-n` carries the pair count, which is the one thing a reader needs in
 * order to judge a cell that surprises them: a district resting on twenty
 * pairs and one resting on nine hundred draw the same hexagon.
 */
export const P_CELLS: string = DISTRICTS.map((d) => {
  const hit = byName.get(`${d.sido}\t${d.sgg}`)
  const cls = priceClass(hit?.change ?? null)
  const value = hit ? signed(hit.change) : '—'
  return (
    `<use href="#c" x="${cx0(d)}" y="${cy0(d)}" class="${cls === null ? 'pna' : `p${cls}`}"` +
    ` data-n="${hit?.pairs ?? 0}">` +
    `<title>${esc(d.sido)} ${esc(d.sgg)} · ${value}</title></use>`
  )
}).join('')

/** The same numbers in rank order — the map's text alternative. */
export const P_RANKED: string = PRICE_VALUES.map(
  (v) => `<li>${esc(v.sgg)}<span class="muted"> · ${signed(v.change)}</span></li>`,
).join('')
