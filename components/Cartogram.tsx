import { cx } from '@/lib/cx'
import {
  DIVISIONS,
  GRID_COLS,
  GRID_ROWS,
  tilesInReadingOrder,
  type ValueLayer,
} from '@/lib/cartogram.data'
import styles from './Cartogram.module.css'

/**
 * A tile cartogram, rendered as a table.
 *
 * NOT an <svg>. Every other figure on this site is inline SVG, and this one
 * deliberately is not — a cartogram is a grid of labelled cells with values,
 * which is what a table IS. Rendered as a table it arrives with row and
 * column semantics, cell headers, and a caption for free, and a screen reader
 * announces "행 3, 열 5, 대구" without a single ARIA attribute being invented
 * for it.
 *
 * The published entry think/not-someone-who-draws-charts admitted that the
 * one visualisation on this site cannot be reached from a keyboard, and said
 * that debt gets paid before new work starts. This is the new work, so the
 * accessible path is the structure rather than an addition to it: the tiles
 * are real table cells, they are in the tab order in reading order, and there
 * is nothing to bolt on later.
 *
 * Zero client JavaScript. A table does not need any.
 */
export function Cartogram({
  layer,
  names,
  labels,
}: {
  /** Null until a dataset clears the licensing bar. The grid still renders. */
  layer: ValueLayer | null
  /** Division code -> full name, from the dictionary. */
  names: Readonly<Record<string, string>>
  labels: {
    caption: string
    emptyLayer: string
    rowHeader: string
    colHeader: string
  }
}) {
  /* Highest value sets the fill scale. Computed here rather than stored, so a
     value can never disagree with the scale drawn against it. */
  const max = layer ? Math.max(...Object.values(layer.values)) : 0

  const at = (row: number, col: number) =>
    DIVISIONS.find((d) => d.row === row && d.col === col)

  return (
    <figure className={styles.figure}>
      <table className={styles.grid}>
        <caption className={cx('small', styles.caption)}>
          {labels.caption}
          {!layer && <span className={styles.empty}> — {labels.emptyLayer}</span>}
        </caption>
        <tbody>
          {Array.from({ length: GRID_ROWS }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: GRID_COLS }, (_, col) => {
                const d = at(row, col)
                if (!d) {
                  /* An empty cell is not a division. Marked presentational so
                     a screen reader walks 17 tiles, not 42 cells. */
                  return <td key={col} className={styles.blank} aria-hidden="true" />
                }
                const value = layer?.values[d.code]
                /* `--fill` drives the tile's ink. Without a layer every tile
                   is drawn at the same weight, which is the honest picture:
                   the grid exists, the variable does not. */
                const fill = layer && value !== undefined ? value / max : 0
                return (
                  <td key={col} className={styles.cell}>
                    <div
                      className={styles.tile}
                      style={{ '--fill': `${Math.round(fill * 100)}%` } as React.CSSProperties}
                    >
                      {/* Focusable, in reading order, with the full name as
                          the accessible label — the two-letter tile text is a
                          visual abbreviation and should not be what a screen
                          reader announces. */}
                      <span className={styles.tileInner} tabIndex={0}>
                        <span className={styles.abbr} aria-hidden="true">
                          {d.abbr}
                        </span>
                        <span className="visuallyHidden">{names[d.code] ?? d.abbr}</span>
                        {value !== undefined && (
                          <span className={cx('label', styles.value)}>
                            {value.toLocaleString()}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* The list is not a fallback. It is the same data in the order a
          keyboard walks it, so the tab path has a visible counterpart. */}
      <details className={styles.listing}>
        <summary className={cx('label', styles.summary)}>{labels.rowHeader}</summary>
        <ol className={cx('small', styles.list)}>
          {tilesInReadingOrder().map((d) => (
            <li key={d.code}>
              {names[d.code] ?? d.abbr}
              {layer?.values[d.code] !== undefined && (
                <span className="muted"> · {layer.values[d.code]!.toLocaleString()}</span>
              )}
            </li>
          ))}
        </ol>
      </details>

      {layer && (
        <figcaption className={cx('small', 'muted', styles.source)}>
          {layer.source.name} · {layer.source.license} ·{' '}
          <a href={layer.source.url} rel="noopener">
            {layer.source.url}
          </a>
        </figcaption>
      )}
    </figure>
  )
}
