import { cx } from '@/lib/cx'
import { D_CELL_PATH, D_SVG_HEIGHT, D_SVG_WIDTH } from '@/lib/cartogram.districts.figure'
import { PRICE_COUNTS, PRICE_EDGES, PRICE_INTAKE } from '@/lib/prices.data'
import { P_CELLS, P_RANKED } from '@/lib/prices.figure'
import { HexTip } from './HexTip'
import { UmdDrill } from './UmdDrill'
import styles from './PriceCartogram.module.css'

/**
 * The district grid again, carrying price change instead of brokerages.
 *
 * Same 245 cells, same popup, same rank list underneath. What changes is the
 * scale, and it changes for a reason written down in lib/prices.figure.ts:
 * this value has a sign, so its colour has a middle.
 *
 * The legend is not optional here. On the brokerage map a reader can guess
 * that brighter means more. On a diverging scale nobody can guess where zero
 * sits, and two of the eight classes are one point wide, so the edges and
 * the count in each are printed.
 */
export function PriceCartogram({
  labels,
}: {
  labels: {
    caption: string
    legend: string
    listing: string
    summary: string
    source: string
    /** The neutral class. */
    unmeasured: string
    tip: { rate: string; offices: string; people: string }
    drill: React.ComponentProps<typeof UmdDrill>['labels']
  }
}) {
  return (
    <figure className={styles.figure}>
      <p className={cx('small', styles.caption)}>{labels.caption}</p>

      <UmdDrill labels={labels.drill}>
        <HexTip labels={labels.tip}>
          <svg
          viewBox={`0 0 ${D_SVG_WIDTH} ${D_SVG_HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-label={labels.summary}
        >
          <defs>
            <path id="c" d={D_CELL_PATH} />
          </defs>
          <g className={styles.cells} dangerouslySetInnerHTML={{ __html: P_CELLS }} />
        </svg>
        </HexTip>
      </UmdDrill>

      {/* Three rows over the same eight columns: the ramp, the value each
          class starts at, and how many districts are in it. Two classes are
          a single point wide, so the count is the only way to know that a
          colour with four cells is not a rounding artefact. */}
      <div className={styles.legend}>
        <p className={cx('label', 'muted', styles.legendHead)}>{labels.legend}</p>

        <ol className={styles.ramp}>
          {Array.from({ length: PRICE_EDGES.length + 1 }, (_, i) => (
            <li key={i} className={styles[`p${i}`]} />
          ))}
        </ol>
        <span />

        <ol className={styles.scale}>
          {Array.from({ length: PRICE_EDGES.length + 1 }, (_, i) => (
            <li key={i} className="label">
              {i === 0 ? '↓' : `${PRICE_EDGES[i - 1]! > 0 ? '+' : ''}${PRICE_EDGES[i - 1]}`}
              <span className={styles.count}>{PRICE_COUNTS[i]}</span>
            </li>
          ))}
        </ol>
        <p className={cx('label', styles.legendMax)}>↑</p>

        <p className={cx('label', 'muted', styles.unmeasured)}>
          <span className={cx(styles.swatch, styles.pna)} />
          {labels.unmeasured}
          <span className="muted"> · {PRICE_INTAKE.districts - PRICE_INTAKE.measured}</span>
        </p>
      </div>

      <details className={styles.listing}>
        <summary className={cx('label', styles.summaryLine)}>{labels.listing}</summary>
        <ol
          className={cx('small', styles.list)}
          dangerouslySetInnerHTML={{ __html: P_RANKED }}
        />
      </details>

      <figcaption className={cx('small', 'muted', styles.source)}>{labels.source}</figcaption>
    </figure>
  )
}
