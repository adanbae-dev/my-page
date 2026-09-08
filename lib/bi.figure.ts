import { DISTRICTS } from './cartogram.districts.data'
import { cx0, cy0, D_CELL_PATH, D_SVG_HEIGHT, D_SVG_WIDTH, esc } from './cartogram.districts.figure'
import {
  BI_ADOPTION,
  BI_ATTACH,
  BI_COHORTS,
  BI_MONTHS,
  BI_MOVEMENT,
  BI_RATE_CARD,
  BI_REPS,
  BI_SERVICES,
  BI_TAM,
  BI_DISTRICT_PENETRATION,
  BI_TIER_ECONOMICS,
} from './bi.data'
import { ROSTER_ADDRESSABLE, ROSTER_DISTRICTS, ROSTER_TIERS } from './bi.roster.data'

/**
 * Every mark on the revenue dashboard, built at build time into strings.
 *
 * NOTHING HERE RUNS ON THE CLIENT. Eight figures over 36 months, 245
 * hexagons, 11 small multiples and a cohort triangle would be a respectable
 * charting-library bundle; as markup they are bytes the browser already knows
 * how to draw. The one thing that costs JavaScript on this page is the
 * drill-down, and it arrives as a shell around markup built here.
 *
 * THE PALETTE IS TWO COLOURS, and that is a constraint this file was designed
 * inside rather than around. `--accent` and `--decline` are the only hues the
 * site has, both measured against both grounds and both recorded in
 * lib/tokens.data.ts, and `pnpm check:contrast` fails the build if either
 * drifts. Eleven services therefore cannot be eleven hues. What they get
 * instead is eleven small multiples — one panel each, same scale, same
 * colour, direct-labelled — which is what a palette runs out of colours for.
 *
 * WHERE COLOUR IS USED IT IS USED FOR ONE JOB:
 *
 *   MAGNITUDE — penetration on the district grid, retention on the cohort
 *   grid. One hue, six steps, mixed toward the ground so the ramp inverts
 *   with the tone rather than being redrawn for dark mode.
 *
 *   POLARITY — the movement waterfall and quota attainment. Both have a real
 *   zero (money gained against money lost; above quota against below), so
 *   `--accent` and `--decline` sit on either side of it. Warm against cool,
 *   which is the pair that reads as opposite.
 *
 * Everything else is one series in one colour, or ink.
 *
 * NO CHART HERE HAS TWO Y-SCALES. Subscription and usage revenue differ by a
 * factor of thirty and share one x-axis as two stacked panels. The two rate
 * ladders differ by a factor of six and are indexed to each bundle's own list
 * price, which is also the more honest question — the ladder is not about how
 * much a bundle costs, it is about how far the price a complex actually pays
 * departs from the price list.
 *
 * EVERY FIGURE HAS A TABLE. The `*_ROWS` exports below are the text
 * alternative, server-rendered next to each figure, so no value on this page
 * is reachable only by pointing at it.
 */

/* ---- shared geometry ----------------------------------------------- */

const T = BI_MONTHS.length

/** Wide panels: one row of the dashboard grid. */
const W = 640
const H = 168
/** Inset for the axis band. The plot never overlaps its own labels. */
const PAD = { t: 10, r: 8, b: 22, l: 8 }
const PW = W - PAD.l - PAD.r
const PH = H - PAD.t - PAD.b

const r1 = (v: number) => Math.round(v * 10) / 10
const nf = (v: number) => Math.round(v).toLocaleString('en-US')
/** 억 for anything over a hundred million, 만 below. Axis labels only. */
const won = (v: number) =>
  v >= 100000000 ? `${r1(v / 100000000)}억` : v >= 10000 ? `${Math.round(v / 10000)}만` : nf(v)

const xOf = (i: number, n = T) => PAD.l + (n === 1 ? PW / 2 : (i / (n - 1)) * PW)
const bandX = (i: number, n = T) => PAD.l + (i / n) * PW
const bandW = (n = T) => PW / n

/** Month labels every six months, plus both ends. Any denser and they touch. */
const TICKS = BI_MONTHS.map((ym, i) => ({ ym, i })).filter(
  ({ i }) => i % 6 === 0 || i === T - 1,
)

const axisMonths = (n = T): string =>
  TICKS.map(
    ({ ym, i }) =>
      `<text class="tick" x="${r1(xOf(i, n))}" y="${H - 6}"` +
      ` text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">` +
      `${ym.slice(2, 4)}.${ym.slice(4)}</text>`,
  ).join('')

/** Solid hairlines, one shade off the surface. Never dashed. */
const gridY = (fracs: readonly number[]): string =>
  fracs
    .map((f) => {
      const y = r1(PAD.t + PH * (1 - f))
      return `<line class="gridline" x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}"/>`
    })
    .join('')

/* ---- 1. MRR, as the step function it is ---------------------------- */

const MRR = BI_MOVEMENT.map((m) => m.end)
const USAGE = BI_MOVEMENT.map((m) => m.usage)
const mrrMax = Math.max(...MRR)

/**
 * A STEP, not a line, and this is the whole reason the figure is shaped this
 * way. Subscription revenue is a per-household fee times a household count
 * that does not change: it holds one value all month and jumps when a
 * contract does. Joining the monthly points with straight segments would draw
 * a smooth climb through values the business never billed, and would hide
 * exactly the thing worth seeing — that growth arrives in discrete signings
 * rather than accruing.
 */
export const MRR_AREA: string = (() => {
  const y = (v: number) => r1(PAD.t + PH * (1 - v / mrrMax))
  const pts: string[] = [`M ${PAD.l} ${y(MRR[0]!)}`]
  for (let i = 0; i < T; i++) {
    const x1 = r1(bandX(i) + bandW())
    pts.push(`L ${x1} ${y(MRR[i]!)}`)
    if (i + 1 < T) pts.push(`L ${x1} ${y(MRR[i + 1]!)}`)
  }
  const line = pts.join(' ')
  const fill = `${line} L ${W - PAD.r} ${PAD.t + PH} L ${PAD.l} ${PAD.t + PH} Z`
  return (
    gridY([0.25, 0.5, 0.75, 1]) +
    `<path class="mrrFill" d="${fill}"/>` +
    `<path class="mrrLine" d="${line}"/>` +
    /* One label, at the end. A number on every month would be unreadable and
       the table underneath carries all 36. */
    `<text class="lead" x="${W - PAD.r}" y="${y(MRR[T - 1]!) - 6}" text-anchor="end">` +
    `${won(MRR[T - 1]!)}</text>` +
    axisMonths() +
    `<text class="tick" x="${PAD.l}" y="${PAD.t + 8}">${won(mrrMax)}</text>`
  )
})()

/** Usage, on its own panel — a thirtieth of the scale, and not a step. */
const UH = 64
export const USAGE_LINE: string = (() => {
  const uMax = Math.max(...USAGE)
  const y = (v: number) => r1(6 + (UH - 24) * (1 - v / uMax))
  const d = USAGE.map((v, i) => `${i ? 'L' : 'M'} ${r1(xOf(i))} ${y(v)}`).join(' ')
  /* The two months usage triples in. Labelled because the seasonality IS the
     finding: 입주자대표회의 elections are held in late autumn. */
  const peak = USAGE.indexOf(uMax)
  return (
    `<path class="usageLine" d="${d}"/>` +
    `<circle class="usageDot" cx="${r1(xOf(peak))}" cy="${y(uMax)}" r="4"/>` +
    `<text class="tick" x="${r1(xOf(peak))}" y="${y(uMax) - 7}" text-anchor="middle">` +
    `${BI_MONTHS[peak]!.slice(4)}월 ${won(uMax)}</text>`
  )
})()

/**
 * One monthly table, not two.
 *
 * The MRR figure and the movement figure are the same 36 months read two
 * ways, so two tables under them repeated 36 row headers and 36 month labels
 * to no purpose. Both panels open the same table; the columns are the union.
 */
export const MONTH_ROWS: string = BI_MOVEMENT.map(
  (m) =>
    `<tr><th scope="row">${m.month}</th><td>${nf(m.end)}</td><td>${nf(m.usage)}</td>` +
    `<td>${m.complexes}</td><td>${nf(m.new)}</td><td>${nf(m.winback)}</td>` +
    `<td>${nf(m.expansion)}</td><td>${nf(m.contraction)}</td><td>${nf(m.churn)}</td></tr>`,
).join('')

/* ---- 2. the movement waterfall ------------------------------------ */

/**
 * Money in above the line, money out below it, one column per month.
 *
 * THIS FIGURE EXISTS BECAUSE THE MRR LINE CANNOT LIE ABOUT ITS OWN SHAPE BUT
 * CAN HIDE WHAT IS UNDER IT. Subscription MRR rises in all 36 months without
 * exception; cumulative churn over the same window is a fifth of where it
 * ended. New business covers the loss every month, so a reader looking at one
 * ascending line would conclude nothing is leaving. The columns below say how
 * much did.
 *
 * `--accent` gains, `--decline` losses, and zero is the axis rather than the
 * bottom of the plot — the one arrangement where the colour means the sign.
 */
const gains = BI_MOVEMENT.map((m) => m.new + m.winback + m.expansion)
const losses = BI_MOVEMENT.map((m) => m.contraction + m.churn)
const flowMax = Math.max(...gains, ...losses)

export const FLOW_BARS: string = (() => {
  const zero = PAD.t + PH / 2
  const half = PH / 2 - 4
  const w = r1(bandW() - 2)
  /* 2px of surface between adjacent columns rather than a stroke around each. */
  const col = (i: number, v: number, up: boolean, cls: string) => {
    const h = Math.max(1, r1((v / flowMax) * half))
    const y = up ? zero - h : zero
    return `<rect class="${cls}" x="${r1(bandX(i) + 1)}" y="${r1(y)}" width="${w}" height="${h}" rx="1"/>`
  }
  return (
    `<line class="zero" x1="${PAD.l}" y1="${zero}" x2="${W - PAD.r}" y2="${zero}"/>` +
    BI_MOVEMENT.map((_, i) => col(i, gains[i]!, true, 'gain') + col(i, losses[i]!, false, 'loss')).join('') +
    axisMonths() +
    `<text class="tick" x="${PAD.l}" y="${PAD.t + 8}">+${won(flowMax)}</text>` +
    `<text class="tick" x="${PAD.l}" y="${PAD.t + PH - 2}">−${won(flowMax)}</text>`
  )
})()

/* ---- 3. the rate ladder — finding 1 ------------------------------- */

/**
 * Both bundles as a percentage of their own list price.
 *
 * INDEXED RATHER THAN PLOTTED IN WON, and not to avoid a second axis — though
 * it does that too. The question is not what a bundle costs. It is how far
 * what a complex actually pays departs from what the price list says, and in
 * which direction. Indexed, a small complex sits at 333% of list because the
 * monthly floor is what it really pays, and a very large one sits at 86%
 * because of the volume bands. Two curves, one axis, one hundred as the line
 * they cross.
 */
const LADDER_W = 300
const LADDER_H = 168
export const LADDER: string = (() => {
  const rows = BI_RATE_CARD[0]!.rows
  const xs = rows.map((_, i) => 16 + (i / (rows.length - 1)) * (LADDER_W - 40))
  const all = BI_RATE_CARD.flatMap((b) => b.rows.map((r) => (r.perHousehold / b.list) * 100))
  const top = Math.max(...all)
  const y = (v: number) => r1(12 + (LADDER_H - 44) * (1 - (v - 80) / (top - 80)))
  const hundred = y(100)
  return (
    `<line class="gridline" x1="16" y1="${hundred}" x2="${LADDER_W - 24}" y2="${hundred}"/>` +
    `<text class="tick" x="${LADDER_W - 24}" y="${hundred - 4}" text-anchor="end">정가 100</text>` +
    BI_RATE_CARD.map((b, k) => {
      const pts = b.rows.map((r, i) => `${i ? 'L' : 'M'} ${r1(xs[i]!)} ${y((r.perHousehold / b.list) * 100)}`)
      const first = b.rows[0]!
      return (
        `<path class="ladder l${k}" d="${pts.join(' ')}"/>` +
        b.rows
          .filter((r) => r.floored)
          .map((r) => {
            const at = b.rows.indexOf(r)
            return `<circle class="ladderDot floored" cx="${r1(xs[at]!)}" cy="${y((r.perHousehold / b.list) * 100)}" r="4"><title>${esc(b.id)} · ${nf(r.households)}세대 · 최소요금 적용</title></circle>`
          })
          .join('') +
        /* LABELLED AT THE LEFT, WHERE THE TWO CURVES ARE FAR APART.
           They were labelled at the right end until a geometry audit of the
           built markup caught it: indexing each bundle to its own list price
           makes both land on the same number — 86% of list at 6,000
           households — so the two labels sat on top of each other and one ran
           off the right edge. At the first rung they are 233 points apart.
           The offset is signed by which side of the plot the point is on, so
           a label at the very top drops below its own line instead of out of
           the frame. */
        `<text class="ladderLabel l${k}" x="${r1(xs[0]!) + 4}" y="${y((first.perHousehold / b.list) * 100) + (k === 0 ? 12 : -5)}">` +
        `${esc(b.id)}</text>`
      )
    }).join('') +
    [0, 4, rows.length - 1]
      .map(
        (i) =>
          `<text class="tick" x="${r1(xs[i]!)}" y="${LADDER_H - 8}" text-anchor="${i === 0 ? 'start' : i === rows.length - 1 ? 'end' : 'middle'}">` +
          `${nf(rows[i]!.households)}</text>`,
      )
      .join('')
  )
})()

export const LADDER_ROWS: string = BI_RATE_CARD[0]!.rows
  .map((_, i) => {
    const cells = BI_RATE_CARD.map((b) => {
      const r = b.rows[i]!
      return `<td>${r.perHousehold}${r.floored ? '<abbr title="최소요금 적용">*</abbr>' : ''}</td>`
    }).join('')
    return `<tr><th scope="row">${nf(BI_RATE_CARD[0]!.rows[i]!.households)}</th>${cells}</tr>`
  })
  .join('')

/* ---- 4. realised economics per tier ------------------------------- */

/**
 * Two bars per tier, and they run in opposite directions.
 *
 * ONE SERIES PER PANEL, ONE COLOUR. Colouring five tiers five ways would
 * double-encode bar length as hue and spend the only free channel on
 * information the bars already carry. The tiers are ordered, so what they get
 * instead is order.
 *
 * `n` sits on every row because the top tier holds eighteen accounts and the
 * bottom holds hundreds. An average over eighteen moves when one complex adds
 * a service, which is why the realised numbers are read against the rate
 * ladder rather than instead of it.
 */
const TIER_W = 300
const TIER_H = 168
const tiersOrdered = ROSTER_TIERS.map((t) => BI_TIER_ECONOMICS.find((e) => e.tier === t.id)!).filter(Boolean)

const tierPanel = (pick: (e: (typeof BI_TIER_ECONOMICS)[number]) => number, fmt: (v: number) => string) => {
  const max = Math.max(...tiersOrdered.map(pick))
  const rowH = (TIER_H - 26) / tiersOrdered.length
  return tiersOrdered
    .map((e, i) => {
      const w = Math.max(2, r1((pick(e) / max) * (TIER_W - 112)))
      const y = r1(8 + i * rowH)
      return (
        `<text class="tick tierName" x="0" y="${r1(y + rowH / 2 + 3)}">${esc(e.tier)}</text>` +
        `<rect class="tierBar" x="52" y="${y + 2}" width="${w}" height="${r1(rowH - 6)}" rx="4">` +
        `<title>${esc(e.tier)} · ${fmt(pick(e))} · ${e.complexes}개 단지</title></rect>` +
        `<text class="tick tierValue" x="${52 + w + 6}" y="${r1(y + rowH / 2 + 3)}">${fmt(pick(e))}</text>`
      )
    })
    .join('')
}

export const TIER_PER_COMPLEX: string = tierPanel((e) => e.perComplex, (v) => won(v))
export const TIER_PER_HOUSEHOLD: string = tierPanel((e) => e.perHousehold, (v) => `${r1(v)}원`)

export const TIER_ROWS: string = tiersOrdered
  .map(
    (e) =>
      `<tr><th scope="row">${esc(e.tier)}</th><td>${e.complexes}</td><td>${nf(e.households)}</td>` +
      `<td>${nf(e.perComplex)}</td><td>${r1(e.perHousehold)}</td><td>${e.floored}</td></tr>`,
  )
  .join('')

/* ---- 5. attach rate, as eleven small multiples -------------------- */

/**
 * Eleven panels rather than eleven hues.
 *
 * The site has two colours. Eleven series on one axis would need nine more,
 * and generating them would put pairs on the chart that a colourblind reader
 * — or a monochrome printer — cannot separate. Faceting costs the ability to
 * read one service against another at a glance and buys the ability to read
 * each one's shape at all, which is the better trade when the shapes differ:
 * some of these climb steadily, one falls the whole window.
 *
 * SAME SCALE IN EVERY PANEL, 0 to the highest attach rate any service
 * reaches. Per-panel scaling would make a 2% service and a 57% service draw
 * identical curves, which is the small-multiple mistake.
 */
const SM_W = 118
const SM_H = 46
const attachSeries = BI_SERVICES.map((s) => ({
  id: s.id,
  rates: (BI_ATTACH[s.id] ?? []).map((v, i) => (BI_ADOPTION[i]!.complexes ? (v / BI_ADOPTION[i]!.complexes) * 100 : 0)),
}))
const attachMax = Math.max(...attachSeries.flatMap((s) => s.rates))

export const ATTACH_PANELS: readonly { id: string; path: string; first: number; last: number }[] =
  attachSeries.map((s) => {
    const y = (v: number) => r1(4 + (SM_H - 16) * (1 - v / attachMax))
    const x = (i: number) => r1(2 + (i / (T - 1)) * (SM_W - 4))
    const line = s.rates.map((v, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(v)}`).join(' ')
    return {
      id: s.id,
      path:
        `<path class="smFill" d="${line} L ${x(T - 1)} ${SM_H - 12} L ${x(0)} ${SM_H - 12} Z"/>` +
        `<path class="smLine" d="${line}"/>`,
      first: r1(s.rates[0] ?? 0),
      last: r1(s.rates[T - 1] ?? 0),
    }
  })

export const ATTACH_MAX = r1(attachMax)

export const ATTACH_ROWS: string = attachSeries
  .map(
    (s) =>
      `<tr><th scope="row">${esc(s.id)}</th><td>${r1(s.rates[0] ?? 0)}</td>` +
      `<td>${r1(s.rates[T - 1] ?? 0)}</td><td>${BI_ATTACH[s.id]?.[T - 1] ?? 0}</td></tr>`,
  )
  .join('')

/* ---- 6. penetration on the district grid -------------------------- */

/**
 * The same 245 hexagons the brokerage and price maps use.
 *
 * THE GRID IS BORROWED, NOT COPIED — placement comes from
 * cartogram.districts.figure.ts, from the same 1.2 million boundary points
 * and the same Hungarian assignment. Three maps of Korea built from three
 * copies of that arithmetic would slowly stop agreeing, and the one thing a
 * reader should be able to assume about two maps on one site is that the
 * shapes mean the same places.
 *
 * THE DENOMINATOR IS THE ADDRESSABLE MARKET, not every filed complex. A
 * district's colour is contracted complexes over complexes at or above
 * ROSTER_ADDRESSABLE households, because a rate computed against buildings
 * with no management office says more about the housing stock than about the
 * sales team.
 *
 * BOTH HALVES ARE PER DISTRICT. The first version of this map had only a
 * provincial numerator and spread it over each province's districts by their
 * share of the market — 245 cells carrying sixteen values, claiming a
 * resolution the data did not have. Two districts in one province would have
 * differed on the map because of arithmetic. BI_DISTRICT_PENETRATION counts
 * the billing complexes in each district directly, which was always possible:
 * a complex id is its district's code and an index.
 *
 * SIX CLASSES, and the top one is open. Quantiles on a distribution this
 * skewed would put four classes inside the capital region; the edges are
 * chosen round numbers so a reader can hold them. Districts with no
 * addressable complexes keep their hexagon in a neutral fill — the country's
 * outline is what makes the map readable, and punching holes in it to mean
 * "nothing to sell to" would read as "no sales".
 */
export const PEN_FLOOR = ROSTER_ADDRESSABLE

export const PEN_EDGES: readonly number[] = [0.5, 2, 5, 10, 20]
export const PEN_CLASSES = PEN_EDGES.length + 1

const signedByCode = new Map(BI_DISTRICT_PENETRATION.map((d) => [d.code, d.signed]))
const contractedBySgg = new Map<string, number>()
for (const d of ROSTER_DISTRICTS) {
  const key = `${d.sido}\t${d.sgg}`
  contractedBySgg.set(key, d.addressable > 0 ? ((signedByCode.get(d.code) ?? 0) / d.addressable) * 100 : -1)
}

export function penClass(rate: number): number | null {
  if (rate < 0) return null
  for (let i = PEN_EDGES.length - 1; i >= 0; i--) if (rate >= PEN_EDGES[i]!) return i + 1
  return 0
}

export const PEN_CELLS: string = DISTRICTS.map((d) => {
  const rate = contractedBySgg.get(`${d.sido}\t${d.sgg}`) ?? -1
  const cls = penClass(rate)
  return (
    `<use href="#bicell" x="${cx0(d)}" y="${cy0(d)}" class="${cls === null ? 'bna' : `b${cls}`}">` +
    `<title>${esc(d.sido)} ${esc(d.sgg)} · ${cls === null ? '판매 대상 없음' : `${r1(rate)}%`}</title></use>`
  )
}).join('')

export const PEN_CLASS_COUNTS: readonly number[] = (() => {
  const counts = new Array(PEN_CLASSES).fill(0)
  let none = 0
  for (const d of DISTRICTS) {
    const cls = penClass(contractedBySgg.get(`${d.sido}\t${d.sgg}`) ?? -1)
    if (cls === null) none++
    else counts[cls]++
  }
  return [...counts, none]
})()

export const PEN_ROWS: string = [...ROSTER_DISTRICTS]
  .filter((d) => d.addressable > 0)
  .map((d) => ({ ...d, rate: contractedBySgg.get(`${d.sido}\t${d.sgg}`) ?? -1 }))
  .sort((a, b) => b.rate - a.rate || (a.sgg < b.sgg ? -1 : 1))
  .slice(0, 40)
  .map(
    (d) =>
      `<tr><th scope="row">${esc(d.sgg)}</th><td>${esc(d.sido)}</td><td>${d.addressable}</td>` +
      `<td>${r1(d.rate)}</td></tr>`,
  )
  .join('')

export const PEN_SVG = { w: D_SVG_WIDTH, h: D_SVG_HEIGHT, cell: D_CELL_PATH }

/* ---- 7. cohort retention ------------------------------------------ */

/**
 * A triangle, because that is the shape of the data.
 *
 * A cohort that signed two months before the window ends has two months of
 * history and no more; filling the rest with anything at all would invent it.
 * So the grid is ragged on the right and every cell that exists is a
 * measurement.
 *
 * TWO GRIDS, NOT ONE. `kept` is the share of the cohort still billing and
 * `value` is its revenue against its own first month, and they come apart:
 * value stays near or above 100 while kept falls, because the survivors buy
 * more. That gap is the second finding, and one grid cannot hold it.
 */
/**
 * QUARTERLY, and the cells are big enough to point at because of it.
 *
 * Monthly cohorts drew 1,433 rectangles across the two grids and put this
 * route at 264% of its markup budget — and each cell rested on about
 * twenty-five accounts, so the curves stepped four points whenever one
 * complex left. Twelve quarters of about seventy-five accounts draw an eighth
 * of the marks and each observation carries three times the evidence. The
 * cell went from 13 to 22 units with the room that freed, which is what makes
 * the tooltip reachable without a script.
 *
 * `index` rather than a lookup: a cohort's row is its quarter's position in
 * the window, so the triangle's left edge is the diagonal and a cohort that
 * signed in the last quarter is one cell wide.
 */
const CELL = 22
const cohortsShown = BI_COHORTS
export const COHORT_W = 2 + Math.max(...cohortsShown.map((c) => c.kept.length)) * CELL
export const COHORT_H = 2 + cohortsShown.length * CELL

const cohortGrid = (pick: (c: (typeof BI_COHORTS)[number]) => readonly number[], cap: number) =>
  cohortsShown
    .map((c, row) =>
      pick(c)
        .map((v, col) => {
          const cls = Math.min(PEN_CLASSES - 1, Math.floor((v / cap) * PEN_CLASSES))
          return (
            `<rect class="b${cls}" x="${1 + col * CELL}" y="${1 + row * CELL}"` +
            ` width="${CELL - 2}" height="${CELL - 2}" rx="1">` +
            `<title>${c.period} · +${col}Q · ${r1(v)}%</title></rect>`
          )
        })
        .join(''),
    )
    .join('')

export const COHORT_KEPT: string = cohortGrid((c) => c.kept, 100)
export const COHORT_VALUE: string = cohortGrid(
  (c) => c.value,
  Math.max(100, ...cohortsShown.flatMap((c) => [...c.value])),
)

export const COHORT_ROWS: string = cohortsShown
  .map(
    (c) =>
      `<tr><th scope="row">${c.period}</th><td>${c.size}</td>` +
      `<td>${r1(c.kept[c.kept.length - 1] ?? 0)}</td>` +
      `<td>${r1(c.value[c.value.length - 1] ?? 0)}</td></tr>`,
  )
  .join('')

/* ---- 8. quota attainment ------------------------------------------ */

/**
 * Nineteen people against 100%, which is a real zero.
 *
 * Above quota and below quota are opposite states, not more and less of one
 * thing, so this is the second place the diverging pair is used. The bars
 * grow from the 100 line rather than from the left edge — from the left edge
 * a rep at 98% and one at 102% draw almost the same bar and the sign
 * disappears, which is the only thing the chart is for.
 */
const ATT_H = 168
const attSorted = [...BI_REPS].sort((a, b) => b.attainment - a.attainment)
const attSpan = Math.max(...attSorted.map((r) => Math.abs(r.attainment - 100)), 10)

export const ATTAIN_BARS: string = (() => {
  const mid = PW / 2 + PAD.l
  const rowH = (ATT_H - 24) / attSorted.length
  return (
    `<line class="zero" x1="${r1(mid)}" y1="8" x2="${r1(mid)}" y2="${ATT_H - 16}"/>` +
    attSorted
      .map((rep, i) => {
        const delta = rep.attainment - 100
        const w = Math.max(1, r1((Math.abs(delta) / attSpan) * (PW / 2 - 30)))
        const y = r1(8 + i * rowH)
        const x = delta >= 0 ? mid : mid - w
        return (
          `<rect class="${delta >= 0 ? 'gain' : 'loss'}" x="${r1(x)}" y="${y + 1}"` +
          ` width="${w}" height="${r1(rowH - 3)}" rx="1">` +
          `<title>${esc(rep.id)} · ${esc(rep.rank)} · 달성 ${r1(rep.attainment)}%</title></rect>`
        )
      })
      .join('') +
    `<text class="tick" x="${r1(mid)}" y="${ATT_H - 4}" text-anchor="middle">할당 100%</text>` +
    `<text class="tick" x="${PAD.l}" y="${ATT_H - 4}">−${Math.round(attSpan)}</text>` +
    `<text class="tick" x="${W - PAD.r}" y="${ATT_H - 4}" text-anchor="end">+${Math.round(attSpan)}</text>`
  )
})()

export const ATTAIN_ROWS: string = attSorted
  .map(
    (r) =>
      `<tr><th scope="row">${esc(r.id)}</th><td>${esc(r.rank)}</td><td>${esc(r.region)}</td>` +
      `<td>${r.accounts}</td><td>${nf(r.quota)}</td><td>${r1(r.attainment)}</td></tr>`,
  )
  .join('')

/* ---- headline figures --------------------------------------------- */

/**
 * The five numbers the dashboard opens with.
 *
 * Stat tiles rather than a chart, because each one is a single value and a
 * one-bar bar chart is not a chart. The comparison each needs is a
 * month-ago or a market total, and that fits in a line of text under the
 * figure.
 */
const lastAdopt = BI_ADOPTION[T - 1]!
const prev12 = BI_MOVEMENT[T - 13] ?? BI_MOVEMENT[0]!
const last = BI_MOVEMENT[T - 1]!
const churn12 = BI_MOVEMENT.slice(-12).reduce((s, m) => s + m.churn, 0)
const gain12 = BI_MOVEMENT.slice(-12).reduce((s, m) => s + m.new + m.winback + m.expansion, 0)

export const KPI = {
  mrr: last.end,
  mrrYoY: r1(((last.end - prev12.end) / prev12.end) * 100),
  usageShare: r1((last.usage / (last.end + last.usage)) * 100),
  complexes: last.complexes,
  penetration: r1((lastAdopt.complexes / BI_TAM.complexes) * 100),
  penetrationAddressable: r1((lastAdopt.addressable / BI_TAM.addressable) * 100),
  households: lastAdopt.households,
  /** Gross revenue churn over the last twelve months, against the MRR it left. */
  churnRate: r1((churn12 / prev12.end) * 100),
  /** New and expansion against what left. Above 1 and the book is growing. */
  coverage: r1(gain12 / churn12),
  tam: BI_TAM.complexes,
  tamAddressable: BI_TAM.addressable,
} as const

export const FIG = { w: W, h: H, uh: UH, ladderW: LADDER_W, ladderH: LADDER_H, tierW: TIER_W, tierH: TIER_H, smW: SM_W, smH: SM_H, attH: ATT_H } as const
