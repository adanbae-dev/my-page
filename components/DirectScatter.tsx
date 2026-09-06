import { cx } from '@/lib/cx'
import { DIRECT_R } from '@/lib/direct.data'
import {
  D_AXES,
  D_DOTS,
  D_H,
  D_NAMED,
  D_PANEL,
  D_PANEL_X,
  D_TICKS,
  D_W,
  dx,
  dy,
  valueOn,
} from '@/lib/direct.figure'
import styles from './DirectScatter.module.css'

/**
 * The same 176 districts plotted twice, against two different explanations.
 *
 * WHY TWO PANELS AND NOT ONE. The page's finding is not a correlation, it is
 * a COMPARISON of correlations: broker density explains the direct-deal rate
 * at r = -0.581 and population explains it better at -0.633, while the two
 * explanations correlate with each other at +0.545. One scatter would have
 * been the flattering half of that. Side by side, with the same y axis and
 * the same points, the reader can see the left panel's story survive into
 * the right one — which is what "partly a proxy" looks like.
 *
 * BOTH AXES ARE LOGARITHMIC, and the data forced it. The rate runs from 1.7%
 * to 84.6% and the population across an order of magnitude; on linear axes
 * one district sits alone in a corner and the other 175 pile into a smudge,
 * and every correlation quoted becomes a statement about that district. The
 * ticks carry the real numbers, so the compression is visible.
 *
 * There is no trend line. A line would read as a claim about cause, and the
 * point of the page is that neither panel establishes one.
 *
 * The dots arrive as two strings from lib/direct.figure.ts — 352 circles
 * were 74% of this page once React had serialized them. Everything that
 * carries language stays here as elements.
 */
export function DirectScatter({
  labels,
}: {
  labels: {
    caption: string
    summary: string
    source: string
    /** Panel titles — what each x axis is. */
    density: string
    population: string
    /** The shared y axis. */
    rate: string
    /** Carries `{r}`. */
    r: string
  }
}) {
  const short = (v: number) =>
    v >= 1_000_000 ? `${v / 1_000_000}M` : v >= 1000 ? `${v / 1000}k` : String(v)

  return (
    <figure className={styles.figure}>
      <p className={cx('small', styles.caption)}>{labels.caption}</p>

      <svg
        viewBox={`0 0 ${D_W} ${D_H}`}
        className={styles.svg}
        role="img"
        aria-label={labels.summary}
      >
        {D_AXES.map(({ axis, panel }) => (
          <g key={axis}>
            <rect
              className={styles.frame}
              x={D_PANEL_X[panel]}
              y={D_PANEL.padT}
              width={D_PANEL.w}
              height={D_PANEL.h}
            />

            <g className={styles.ticks}>
              {D_TICKS[axis].map((t) => (
                <text key={t} x={dx(t, axis, panel)} y={D_PANEL.padT + D_PANEL.h + 15}>
                  {axis === 'pop' ? short(t) : t}
                </text>
              ))}
            </g>

            <text className={styles.axisTitle} x={D_PANEL_X[panel]} y={D_H - 4}>
              {axis === 'pop' ? labels.population : labels.density}
            </text>

            <text
              className={styles.r}
              x={(D_PANEL_X[panel] ?? 0) + D_PANEL.w - 8}
              y={D_PANEL.padT + 17}
            >
              {labels.r.replace('{r}', String(axis === 'pop' ? DIRECT_R.pop : DIRECT_R.density))}
            </text>

            <g className={styles.dots} dangerouslySetInnerHTML={{ __html: D_DOTS[panel] ?? '' }} />

            {/* Only the two ends of the y axis are named. More would need
                leader lines, and every district is on hover already. */}
            <g className={styles.named}>
              {D_NAMED.map((p) => (
                <text
                  key={p.sgg}
                  x={dx(valueOn(p, axis), axis, panel) + 7}
                  y={dy(p.rate) + 3}
                >
                  {p.sgg}
                </text>
              ))}
            </g>
          </g>
        ))}

        <g className={cx(styles.ticks, styles.yTicks)}>
          {D_TICKS.rate.map((t) => (
            <text key={t} x={D_PANEL.padL - 8} y={dy(t) + 3}>
              {t}%
            </text>
          ))}
        </g>
        <text
          className={styles.axisTitle}
          transform={`translate(12 ${D_PANEL.padT + D_PANEL.h}) rotate(-90)`}
        >
          {labels.rate}
        </text>
      </svg>

      <figcaption className={cx('small', 'muted', styles.source)}>{labels.source}</figcaption>
    </figure>
  )
}
