import { cx } from '@/lib/cx'
import {
  D_CELL_PATH,
  D_FILLS,
  D_OUTLINES,
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
 * tiles every hexagon carries its name and its number. At 245 nothing
 * legible fits inside one, so this map answers a different question: not
 * "what is Sejong's rate" but "where is the rate high". The names and the
 * numbers are in the popup, in the `<title>` behind it, and in the list
 * underneath, which is the same data in rank order.
 *
 * SIZE, NOT A BAR. The province map fills each hexagon from the bottom
 * because a bar's height compares easily and leaves the label clear. Here
 * there is no label to protect and a bar this small would be a smudge, so
 * the value scales the hexagon itself. That also makes `sqrt` the right
 * scale rather than the wrong one: this shape grows in BOTH dimensions, so
 * area is proportional to the value only if the radius follows its square
 * root. The province map's linear scale and this one's square root are not
 * an inconsistency — they encode through different properties.
 *
 * The geometry and the markup are both built at build time: three strings
 * from lib/cartogram.districts.figure.ts rather than five hundred elements,
 * because a Server Component ships its output twice and the second copy was
 * 70% of this page. The only thing that reaches the client is the popup —
 * one div and two listeners, in components/HexTip.tsx.
 */
export function DistrictCartogram({
  labels,
}: {
  labels: {
    caption: string
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

          <g className={styles.outlines} dangerouslySetInnerHTML={{ __html: D_OUTLINES }} />
          <g className={styles.fills} dangerouslySetInnerHTML={{ __html: D_FILLS }} />
        </svg>
      </HexTip>

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
