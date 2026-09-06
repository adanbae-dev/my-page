import { cx } from '@/lib/cx'
import { type ValueLayer } from '@/lib/cartogram.data'
import { HEX_PATH, hexLayout, RADIUS } from '@/lib/cartogram.hex'
import styles from './Cartogram.module.css'

/**
 * A hexagonal tile cartogram.
 *
 * The hexagons and the value scale come from `d3-hexbin` and `d3-scale`,
 * evaluated in `lib/cartogram.hex.ts` DURING THE BUILD. Zero bytes of D3
 * reach the browser and there is no client JavaScript here at all — see that
 * file for the measurement that forced it (6.1 KB of route JS headroom
 * against a library that unpacks to 851 KB).
 *
 * WHY HEXAGONS. Squares touch on four sides and meet at corners, so a square
 * grid implies adjacency that is not there and hides adjacency that is. Every
 * hexagon has exactly six neighbours, all sharing an edge, which is much
 * closer to how administrative divisions actually border each other.
 *
 * THE ACCESSIBLE PATH IS NOT A FALLBACK. The first version of this component
 * was a `<table>`, which was keyboard-navigable by construction. Hexagons
 * cannot be table cells, so the ordered list below carries the same numbers
 * in the same order, and it is visible rather than hidden — the entry
 * think/not-someone-who-draws-charts criticised bolting keyboard access onto
 * a visualisation afterwards, and a text equivalent rendered from the same
 * data at the same time is not that. Each hexagon additionally carries a
 * `<title>`, and the figure states its own summary.
 */
export function Cartogram({
  layer,
  names,
  labels,
}: {
  layer: ValueLayer | null
  names: Readonly<Record<string, string>>
  labels: {
    caption: string
    emptyLayer: string
    listing: string
    summary: string
  }
}) {
  const { hexes, width, height } = hexLayout(layer)
  const clipH = RADIUS * 2

  return (
    <figure className={styles.figure}>
      <p className={cx('small', styles.caption)}>
        {labels.caption}
        {!layer && <span className={styles.empty}> — {labels.emptyLayer}</span>}
      </p>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label={labels.summary}
      >
        <defs>
          {/* One clip per tile: the fill is a rectangle rising from the
              hexagon's bottom edge, clipped to the hexagon. Sharing a single
              hexagon path keeps this at one shape definition rather than
              sixteen. */}
          {hexes.map((h) => (
            <clipPath key={h.code} id={`hex-${h.code}`}>
              <path d={HEX_PATH} transform={`translate(${h.x} ${h.y})`} />
            </clipPath>
          ))}
        </defs>

        {hexes.map((h) => {
          const filled = h.fill * clipH
          return (
            <g key={h.code} className={styles.hex}>
              <title>
                {names[h.code] ?? h.abbr}
                {h.value !== undefined && ` · ${h.value.toLocaleString()}`}
              </title>

              {h.value !== undefined && filled > 0 && (
                <rect
                  x={h.x - RADIUS}
                  y={h.y + RADIUS - filled}
                  width={RADIUS * 2}
                  height={filled}
                  className={styles.fill}
                  clipPath={`url(#hex-${h.code})`}
                />
              )}

              <path
                d={HEX_PATH}
                transform={`translate(${h.x} ${h.y})`}
                className={styles.outline}
              />

              {/* Sat above centre so the fill, which rises from the bottom,
                  never reaches the label. The contract in lib/tokens.data.ts
                  governs token pairs, not text over a partial fill, so this
                  is kept clear by geometry rather than by a colour rule. */}
              <text x={h.x} y={h.y - 10} className={styles.abbr}>
                {h.abbr}
              </text>
              {h.value !== undefined && (
                <text x={h.x} y={h.y + 2} className={styles.value}>
                  {h.value.toLocaleString()}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <ol className={cx('small', styles.list)} aria-label={labels.listing}>
        {[...hexes]
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
          .map((h) => (
            <li key={h.code}>
              {names[h.code] ?? h.abbr}
              {h.value !== undefined && (
                <span className="muted"> · {h.value.toLocaleString()}</span>
              )}
            </li>
          ))}
      </ol>

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
