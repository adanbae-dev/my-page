import { cx } from '@/lib/cx'
import {
  RENEWAL_BIN_FROM,
  RENEWAL_BIN_TO,
  RENEWAL_CAP,
  RENEWAL_SERIES,
  type RenewalSeries,
} from '@/lib/renewal.data'
import styles from './RenewalDistribution.module.css'

/**
 * Two histograms of the same thing, mirrored across one axis.
 *
 * WHY MIRRORED AND NOT SIDE BY SIDE. The finding is that the two
 * distributions agree in the middle and disagree at the top: the medians sit
 * within a point of each other and the 90th percentiles are three times
 * apart. Side by side that is two similar-looking shapes a reader has to hold
 * in their head. Across one axis it is a single silhouette — a wall on one
 * side and a tail on the other — and the comparison happens in the eye
 * rather than in memory.
 *
 * NO FIGURE FROM THE DATA IS QUOTED IN THIS COMMENT, and that is a
 * correction rather than a style. It used to name both medians, both 90th
 * percentiles, both series sizes and both peaks. Every one of those six
 * numbers moved when 광주·전남 filings arrived — 27 districts that had been
 * queried under region codes the API had retired — and the comment went on
 * asserting the old ones. A stale comment beside correct code is worse than
 * no comment: it is the version a reader believes.
 *
 * ONE SCALE, NOT TWO. The two series have different sizes, so both are drawn
 * as a share of their own series; and both use the same pixels-per-point, so
 * a bar twice as tall is twice as common. Giving each half its own scale
 * would have filled the picture more evenly and made the smaller series'
 * spike look like the larger one's.
 *
 * NOT BUILT AS A STRING, unlike the district map next door. That one was 490
 * elements and the serialized copy of it cost more than the markup; this is
 * 56 rectangles. The technique was a measurement, not a house style, and it
 * does not pay here.
 */

const BIN_W = 24
const BAR_W = 21
const PAD_X = 34
const PX_PER_PCT = 4.4
const LABEL_H = 26

const BINS = RENEWAL_SERIES[0]!.bins.length
const [UP, DOWN] = RENEWAL_SERIES as readonly [RenewalSeries, RenewalSeries]

const upH = Math.ceil(Math.max(...UP.bins) * PX_PER_PCT)
const downH = Math.ceil(Math.max(...DOWN.bins) * PX_PER_PCT)
/* The bars sit ON the axis. An earlier version left an 8px gap on each side
   and the near-empty bins, drawn at a 0.6px minimum, lined up into what
   looked like a second axis. */
const AXIS = upH
const W = PAD_X * 2 + BINS * BIN_W
const H = AXIS + downH + LABEL_H

/** Bin index -> the increase it holds. 0 is the underflow, last the overflow. */
const lowerEdge = (i: number) => RENEWAL_BIN_FROM + i - 1
const binX = (i: number) => PAD_X + i * BIN_W + (BIN_W - BAR_W) / 2
/**
 * The cap sits at the LEFT edge of its bin: an increase of exactly 5% falls
 * in the bin labelled 5, so the statutory line is that bin's opening edge.
 * The axis is therefore labelled at bin EDGES rather than bin centres — on a
 * histogram a tick is a boundary, and centring them would have put the "5"
 * half a bin away from the line it names.
 */
const edgeX = (value: number) => PAD_X + (value - RENEWAL_BIN_FROM + 1) * BIN_W
const capX = edgeX(RENEWAL_CAP)

function binLabel(i: number, unit: string): string {
  if (i === 0) return `< ${RENEWAL_BIN_FROM}${unit}`
  if (i === BINS - 1) return `> ${RENEWAL_BIN_TO}${unit}`
  const lo = lowerEdge(i)
  return `${lo}–${lo + 1}${unit}`
}

export function RenewalDistribution({
  labels,
}: {
  labels: {
    caption: string
    summary: string
    source: string
    cap: string
    up: string
    down: string
    /** "%p" — the unit an increase is measured in. */
    unit: string
    /** "{share}% of {n} contracts" */
    share: string
  }
}) {
  const ticks = [-5, 0, 5, 10, 15, 20].filter(
    (t) => t >= RENEWAL_BIN_FROM && t <= RENEWAL_BIN_TO,
  )

  return (
    <figure className={styles.figure}>
      <p className={cx('small', styles.caption)}>{labels.caption}</p>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={labels.summary}>
        {/* Under the bars, so the rule never hides a measurement. */}
        <line className={styles.capLine} x1={capX} y1={0} x2={capX} y2={AXIS + downH} />

        <g className={styles.up}>
          {UP.bins.map((v, i) => v === 0 ? null : (
            <rect
              key={i}
              x={binX(i)}
              y={AXIS - v * PX_PER_PCT}
              width={BAR_W}
              height={Math.max(0.6, v * PX_PER_PCT)}
            >
              <title>
                {labels.up} · {binLabel(i, labels.unit)} · {v}%
              </title>
            </rect>
          ))}
        </g>

        <g className={styles.down}>
          {DOWN.bins.map((v, i) => v === 0 ? null : (
            <rect
              key={i}
              x={binX(i)}
              y={AXIS}
              width={BAR_W}
              height={Math.max(0.6, v * PX_PER_PCT)}
            >
              <title>
                {labels.down} · {binLabel(i, labels.unit)} · {v}%
              </title>
            </rect>
          ))}
        </g>

        <line className={styles.axis} x1={PAD_X} y1={AXIS} x2={W - PAD_X} y2={AXIS} />

        {/* Last, so nothing paints over the one number the rule is about.
            To the right of the tallest bar, which is the bar it explains. */}
        <text className={styles.capLabel} x={capX + BIN_W + 6} y={13}>
          {labels.cap}
        </text>

        <g className={styles.ticks}>
          {ticks.map((t) => (
            <text key={t} x={edgeX(t)} y={H - 8}>
              {t}
            </text>
          ))}
          <text x={PAD_X + BAR_W / 2} y={H - 8} className={styles.edge}>
            ←
          </text>
          <text x={binX(BINS - 1) + BAR_W / 2} y={H - 8} className={styles.edge}>
            →
          </text>
        </g>
      </svg>

      <ul className={cx('label', styles.legend)}>
        <li>
          <span className={cx(styles.swatch, styles.swatchUp)} />
          {labels.up}
          <span className="muted"> · {UP.n.toLocaleString('en-US')}</span>
        </li>
        <li>
          <span className={cx(styles.swatch, styles.swatchDown)} />
          {labels.down}
          <span className="muted"> · {DOWN.n.toLocaleString('en-US')}</span>
        </li>
      </ul>

      <figcaption className={cx('small', 'muted', styles.source)}>{labels.source}</figcaption>
    </figure>
  )
}
