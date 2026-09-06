import { cx } from '@/lib/cx'
import {
  D_BREAKS,
  D_CELLS,
  D_CELL_PATH,
  D_CLASSES,
  D_RANKED,
  D_SVG_HEIGHT,
  D_SVG_WIDTH,
} from '@/lib/cartogram.districts.figure'
import { HexTip } from './HexTip'
import styles from './DistrictCartogram.module.css'

/**
 * 245 districts as a hexagon tiling of the country.
 *
 * A DIFFERENT KIND OF PICTURE FROM THE PROVINCE MAP, on purpose. At sixteen
 * tiles every hexagon carries its name, its number and a bar that fills from
 * the bottom. At 245 none of that survives: nothing legible fits inside a
 * cell, and a bar this small is a smudge. So the two maps encode through
 * different channels — the province map through length, this one through
 * colour — and the reason is in lib/cartogram.districts.figure.ts, where the
 * size encoding this replaced is written down next to the distribution that
 * defeated it.
 *
 * The legend is not decoration here. Quantile classes cannot be read off a
 * ramp the way an even scale can, so the breaks are printed.
 *
 * The geometry and the markup are both built at build time: two strings from
 * that same module rather than five hundred elements, because a Server
 * Component ships its output twice and the second copy was 70% of this page.
 * The only thing that reaches the client is the popup — one div and two
 * listeners, in components/HexTip.tsx.
 */
export function DistrictCartogram({
  labels,
}: {
  labels: {
    caption: string
    legend: string
    listing: string
    summary: string
    source: string
    tip: { rate: string; offices: string; people: string }
  }
}) {
  return (
    <figure className={styles.figure}>
      <p className={cx('small', styles.caption)}>{labels.caption}</p>

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
          <g className={styles.cells} dangerouslySetInnerHTML={{ __html: D_CELLS }} />
        </svg>
      </HexTip>

      <div className={styles.legend}>
        <p className={cx('label', 'muted', styles.legendHead)}>{labels.legend}</p>
        <ol className={styles.ramp}>
          {Array.from({ length: D_CLASSES }, (_, i) => (
            <li key={i} className={styles[`q${i}`]}>
              <span className={cx('label', styles.tick)}>{D_BREAKS[i]?.toFixed(1)}</span>
            </li>
          ))}
        </ol>
        <p className={cx('label', 'muted', styles.legendMax)}>{D_BREAKS[D_CLASSES]?.toFixed(1)}</p>
      </div>

      <details className={styles.listing}>
        <summary className={cx('label', styles.summaryLine)}>{labels.listing}</summary>
        <ol
          className={cx('small', styles.list)}
          dangerouslySetInnerHTML={{ __html: D_RANKED }}
        />
      </details>

      <figcaption className={cx('small', 'muted', styles.source)}>{labels.source}</figcaption>
    </figure>
  )
}
