import { DIRECT_POINTS, type DirectPoint } from './direct.data'

/**
 * The scatter's geometry and its 352 dots, built into strings here.
 *
 * WHY STRINGS — the same measurement that produced
 * lib/cartogram.districts.figure.ts, taken again on this page because the
 * technique is a measurement and not a house style. As plain JSX this route
 * came out at:
 *
 *   markup                           6.5 KB gzip
 *   serialized tree (__next_f)      18.2 KB gzip
 *   -------------------------------------------
 *   page total                      24.5 KB   against a 23.4 KB budget
 *
 * Seventy-four percent of the page was React keeping 352 circles
 * addressable on a route with no client JavaScript and a frozen table. The
 * histogram next door has 56 rectangles and stayed as JSX for exactly the
 * same reason this one did not.
 *
 * What stays in JSX is what carries language or structure: the two frames,
 * the tick labels, the axis titles, the r readouts. Only the dots come
 * through here, and the only text they contain is a district name and a
 * number, escaped below.
 */

const PANEL_W = 300
const PANEL_H = 250
const GUTTER = 58
const PAD_L = 46
const PAD_T = 16
const PAD_B = 34
const R = 3

export const D_W = PAD_L + PANEL_W + GUTTER + PANEL_W + 12
export const D_H = PAD_T + PANEL_H + PAD_B
export const D_PANEL = { w: PANEL_W, h: PANEL_H, padL: PAD_L, padT: PAD_T } as const
export const D_PANEL_X: readonly [number, number] = [PAD_L, PAD_L + PANEL_W + GUTTER]

const log = Math.log10

const extent = (values: readonly number[]): readonly [number, number] => {
  const lo = log(Math.min(...values))
  const hi = log(Math.max(...values))
  /* A little air, so the extreme points are not clipped by the frame they
     are the reason for. */
  const pad = (hi - lo) * 0.06
  return [lo - pad, hi + pad]
}

const RATE = extent(DIRECT_POINTS.map((p) => p.rate))
const DOMAIN = {
  density: extent(DIRECT_POINTS.map((p) => p.density)),
  pop: extent(DIRECT_POINTS.map((p) => p.pop)),
} as const

export type DirectAxis = keyof typeof DOMAIN

/**
 * Whole numbers. The viewBox is 716 units wide and renders at 56rem, so a
 * unit is a little over one CSS pixel and a rounded centre moves a dot by
 * less than half of one — under a 3px radius, and each coordinate is
 * written twice, once into the markup and once into the tree.
 */
export const dy = (rate: number): number =>
  Math.round(PAD_T + PANEL_H - ((log(rate) - RATE[0]) / (RATE[1] - RATE[0])) * PANEL_H)

export const dx = (value: number, axis: DirectAxis, panel: number): number => {
  const [lo, hi] = DOMAIN[axis]
  return Math.round((D_PANEL_X[panel] ?? PAD_L) + ((log(value) - lo) / (hi - lo)) * PANEL_W)
}

const valueOf = (p: DirectPoint, axis: DirectAxis) => (axis === 'pop' ? p.pop : p.density)

export const valueOn = valueOf

/** Powers of ten and their halves — the ticks a log axis can label. */
function ticksFor([lo, hi]: readonly [number, number]): number[] {
  const out: number[] = []
  for (let e = Math.floor(lo); e <= Math.ceil(hi); e++) {
    for (const m of [1, 2, 5]) {
      const v = m * 10 ** e
      if (log(v) >= lo && log(v) <= hi) out.push(v)
    }
  }
  return out.length > 6 ? out.filter((_, i) => i % 2 === 0) : out
}

export const D_TICKS = {
  rate: ticksFor(RATE),
  density: ticksFor(DOMAIN.density),
  pop: ticksFor(DOMAIN.pop),
} as const

/** The two ends of the shared y axis — the districts a reader looks for. */
const ranked = [...DIRECT_POINTS].sort((a, b) => b.rate - a.rate)
export const D_NAMED: readonly DirectPoint[] = [ranked[0]!, ranked[ranked.length - 1]!]

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  )

/**
 * One panel's dots.
 *
 * The `<title>` carries the PROVINCE as well as the district, because
 * thirteen of these 176 names are not unique — 중구 alone is five different
 * places. It is deliberately not the deal count: that would be a third
 * number on every one of 352 hovers to support a caveat the page already
 * states in a sentence.
 */
const dots = (axis: DirectAxis, panel: number): string =>
  DIRECT_POINTS.map(
    (p) =>
      `<circle cx="${dx(valueOf(p, axis), axis, panel)}" cy="${dy(p.rate)}" r="${R}">` +
      `<title>${esc(p.sido)} ${esc(p.sgg)} · ${p.rate}%</title></circle>`,
  ).join('')

export const D_AXES: readonly { axis: DirectAxis; panel: number }[] = [
  { axis: 'density', panel: 0 },
  { axis: 'pop', panel: 1 },
]

export const D_DOTS: readonly [string, string] = [dots('density', 0), dots('pop', 1)]
