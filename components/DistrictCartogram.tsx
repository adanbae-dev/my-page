import { cx } from '@/lib/cx'
import {
  D_CELL_PATH,
  D_FILLS,
  D_OUTLINES,
  D_RANKED,
  D_SVG_HEIGHT,
  D_SVG_WIDTH,
} from '@/lib/cartogram.districts.figure'
import styles from './DistrictCartogram.module.css'

/**
 * 245 districts as a hexagon field.
 *
 * A DIFFERENT KIND OF PICTURE FROM THE PROVINCE MAP, on purpose. At sixteen
 * tiles every hexagon carries its name and its number. At 245 the radius is
 * 13px and nothing legible fits inside one, so this map answers a different
 * question: not "what is Sejong's rate" but "where is the rate high". Names
 * and numbers live in the `<title>` and in the list underneath, which is the
 * same data in rank order.
 *
 * SIZE, NOT A BAR. The province map fills each hexagon from the bottom
 * because a bar's height compares easily and leaves the label clear. Here
 * there is no label to protect and a 13px bar would be a smudge, so the value
 * scales the hexagon itself. That also makes `sqrt` the right scale rather
 * than the wrong one: this shape grows in BOTH dimensions, so area is
 * proportional to the value only if the radius follows its square root. The
 * province map's linear scale and this one's square root are not an
 * inconsistency — they encode through different properties.
 *
 * Zero client JavaScript. The geometry is computed at build time, and so is
 * the markup: three strings from lib/cartogram.districts.figure.ts rather
 * than five hundred elements, because a Server Component ships its output
 * twice and the second copy was 70% of this page. The measurement and the
 * reasoning are in that file; this component only places the strings.
 */
export function DistrictCartogram({
  labels,
}: {
  labels: {
    caption: string
    listing: string
    summary: string
    source: string
  }
}) {
  return (
    <figure className={styles.figure}>
      <p className={cx('small', styles.caption)}>{labels.caption}</p>

      <svg
        viewBox={`0 0 ${D_SVG_WIDTH} ${D_SVG_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={labels.summary}
      >
        <defs>
          <path id="c" d={D_CELL_PATH} />
        </defs>

        <g className={styles.outlines} dangerouslySetInnerHTML={{ __html: D_OUTLINES }} />
        <g className={styles.fills} dangerouslySetInnerHTML={{ __html: D_FILLS }} />
      </svg>

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
