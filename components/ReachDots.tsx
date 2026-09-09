import { cx } from '@/lib/cx'
import { REACH_QUANTILES, REACH_RATES } from '@/lib/reach.data'
import styles from './ReachDots.module.css'

/**
 * One dot per district, on the whole axis.
 *
 * NOT A HISTOGRAM, and the reason is the one district at the far left. The
 * shares run from 18.9% to 100% with 181 of 186 above 80%, so any bin scheme
 * wide enough to make the mass legible puts everything under 80% into an
 * underflow bucket — and that bucket is where this page's only real
 * exception lives. A dot per district cannot hide it: 강진군 is a single mark
 * with an empty half-axis to its right, which is what the number means.
 *
 * THE AXIS RUNS 0 TO 100 and is not cropped to where the data is. Cropping
 * to 15–100 would have spread the hump across three times the width and made
 * it look like a distribution with a spread. It has almost none, and the
 * empty two thirds of the frame is the finding — a reader should see that
 * brokerage does not reach, before reading a word.
 *
 * STACKING IS DETERMINISTIC, not jittered. Rates are collected into
 * half-point columns and dots stack upward in each; a random offset would
 * make two builds of the same data differ, which on a static site means a
 * diff with no cause. The columns are narrower than a dot, so neighbours
 * overlap and density reads as mass.
 *
 * BUILT AS JSX, not as a build-time string. That technique was a measurement
 * on the 490-element district map, not a house style: 186 circles carrying no
 * text are a fraction of that, and this way the class names stay type
 * checked. Re-measure before assuming either way.
 */

const AXIS_W = 880
const PAD_X = 30
const PAD_TOP = 16
const LABEL_H = 26
const R = 3
const DY = 7
const COLUMN = 0.5

const x = (rate: number) => PAD_X + (rate / 100) * AXIS_W

/** Half-point columns, each holding its districts' rates in order. */
const columns = new Map<number, number>()
const stacked = REACH_RATES.map((rate) => {
  const c = Math.round(rate / COLUMN) * COLUMN
  const at = columns.get(c) ?? 0
  columns.set(c, at + 1)
  return { rate, level: at }
})
const MAX_STACK = Math.max(...columns.values())

const H = PAD_TOP + MAX_STACK * DY + LABEL_H
const W = PAD_X * 2 + AXIS_W
const BASE = PAD_TOP + MAX_STACK * DY

const TICKS = [0, 20, 40, 60, 80, 100]

export function ReachDots({
  labels,
}: {
  labels: {
    caption: string
    summary: string
    source: string
    /** "중앙값" — marks the median line. */
    median: string
    /** "{rate}%" on each dot. */
    dot: string
  }
}) {
  const medianX = x(REACH_QUANTILES.median)

  return (
    <figure className={styles.figure}>
      <p className={cx('small', styles.caption)}>{labels.caption}</p>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={labels.summary}>
        {/* Under the dots: a guide must never cover a measurement. */}
        <line className={styles.medianLine} x1={medianX} y1={PAD_TOP - 8} x2={medianX} y2={BASE} />

        <g className={styles.dots}>
          {stacked.map(({ rate, level }, i) => (
            <circle key={i} cx={x(rate)} cy={BASE - R - level * DY} r={R}>
              <title>{labels.dot.replace('{rate}', String(rate))}</title>
            </circle>
          ))}
        </g>

        <line className={styles.axis} x1={PAD_X} y1={BASE} x2={W - PAD_X} y2={BASE} />

        <text className={styles.medianLabel} x={medianX - 6} y={PAD_TOP - 2}>
          {labels.median} {REACH_QUANTILES.median}%
        </text>

        <g className={styles.ticks}>
          {TICKS.map((t) => (
            <text key={t} x={x(t)} y={H - 8}>
              {t}
            </text>
          ))}
        </g>
      </svg>

      <figcaption className={cx('small', 'muted', styles.source)}>{labels.source}</figcaption>
    </figure>
  )
}
