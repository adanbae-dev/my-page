import { hexbin as d3Hexbin } from 'd3-hexbin'
import { scaleLinear } from 'd3-scale'

import { DIVISIONS, type Division, type ValueLayer } from '@/lib/cartogram.data'

/**
 * Hexagon geometry for the cartogram, computed with D3 — AT BUILD TIME.
 *
 * WHY D3 IS HERE AND WHY IT COSTS NOTHING.
 *
 * `think/branch-strategy` rejected mermaid because it bundles d3 and dagre
 * past 500KB gzipped, and `think/not-someone-who-draws-charts` said the
 * lesson does not transfer: weight is the right measure, but the budget's
 * denominator is different when the chart IS the product rather than an
 * illustration beside prose.
 *
 * Measured on this route before adding anything: 174.6 KB of JS against a
 * 180.7 KB limit — **6.1 KB of headroom**, and `d3` unpacks to 851 KB with
 * `d3-scale` alone at 170 KB. D3 does not fit in the client bundle and never
 * will.
 *
 * It does not need to. Every route here is prerendered by `output: 'export'`,
 * so this module runs in Node during `next build` and emits static SVG path
 * data. `d3-hexbin` and `d3-scale` are devDependencies; **zero bytes of D3
 * reach the browser.** That is not a workaround for a static site — it is
 * where a layout library belongs when the layout never changes after build.
 */

/** Distance from a hexagon's centre to a vertex. */
const RADIUS = 34

/**
 * The tallest a value band may rise, as a fraction of the hexagon's height.
 *
 * Not a style choice — it is what keeps the two text labels on the ground
 * their contrast was measured against. See the note on the scale below.
 */
const MAX_FILL = 0.42

/**
 * Pointy-top hexagons in an odd-row-offset layout.
 *
 * d3-hexbin draws a flat-top hexagon and lays out on its own axes. This grid
 * is authored as (row, col) integers, so the centres are placed here and only
 * the SHAPE comes from d3 — a hexagon path is trigonometry, and taking it
 * from the library that will also scale the values keeps one source for both.
 */
const hex = d3Hexbin().radius(RADIUS)

/** The hexagon outline, centred on the origin. Identical for every tile. */
export const HEX_PATH: string = hex.hexagon()

const DX = RADIUS * Math.sqrt(3)
const DY = RADIUS * 1.5

export type PlacedHex = Division & {
  readonly x: number
  readonly y: number
  /** 0–1. How much of the hexagon the value fills, from the bottom. */
  readonly fill: number
  readonly value: number | undefined
}

export type HexLayout = {
  readonly hexes: readonly PlacedHex[]
  readonly width: number
  readonly height: number
}

export function hexLayout(layer: ValueLayer | null): HexLayout {
  const values = layer ? Object.values(layer.values) : []
  /**
   * Linear, capped — and the first version of this was wrong.
   *
   * It used `scaleSqrt`, justified in a comment that said area grows with the
   * square of a linear fill so the square root corrects it. That reasoning is
   * sound for a shape scaled in BOTH dimensions — a circle, a scaled-down
   * hexagon — and this is not that. The value is painted as a band rising
   * from the hexagon's bottom edge, and the area of such a band is not the
   * square of its height: a hexagon is narrow at the bottom, widest in the
   * middle and narrow again at the top, so the relationship is not a power
   * law at all. Applying a square root to it corrected nothing and inflated
   * every small division.
   *
   * A band's HEIGHT is what the eye reads, and height maps linearly. So the
   * scale is linear, the caption says the bar is the population, and that
   * sentence is true as written.
   *
   * `MAX_FILL` keeps the band clear of the labels. The square-tile version of
   * this component learned it the hard way: at a full fill the largest
   * division became solid accent with accent-grey digits on top of it,
   * unreadable. The contrast contract in lib/tokens.data.ts governs token
   * pairs, not text composited over a partial fill, so `check:contrast` had
   * nothing to say — geometry keeps the labels legible instead of a colour
   * rule.
   */
  const scale = scaleLinear()
    .domain([0, values.length ? Math.max(...values) : 1])
    .range([0, MAX_FILL])

  const hexes = DIVISIONS.map((d) => {
    const value = layer?.values[d.code]
    return {
      ...d,
      /* Odd rows shift half a column — that is what makes them interlock. */
      x: d.col * DX + (d.row % 2 === 1 ? DX / 2 : 0) + DX / 2 + 2,
      y: d.row * DY + RADIUS + 2,
      fill: value === undefined ? 0 : scale(value),
      value,
    }
  })

  const maxCol = Math.max(...DIVISIONS.map((d) => d.col))
  const maxRow = Math.max(...DIVISIONS.map((d) => d.row))
  return {
    hexes,
    width: Math.round((maxCol + 1.5) * DX + 4),
    height: Math.round(maxRow * DY + RADIUS * 2 + 4),
  }
}

export { RADIUS }
