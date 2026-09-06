/**
 * A tile cartogram of Korea's 17 first-level divisions.
 *
 * WHAT A TILE CARTOGRAM IS, AND WHY THE POSITIONS ARE HAND-PLACED.
 *
 * A tile grid map gives every unit the same size and drops geographic
 * accuracy on purpose: on a real map Seoul is a dot and Gyeongbuk is enormous,
 * so a choropleth of the real shapes makes the reader compare areas when the
 * question was about the value. Equal tiles remove that.
 *
 * The (row, col) below are DESIGNED, not measured, and that is what a tile
 * grid map is — every published one is arranged by hand. It is checkable at a
 * glance rather than on trust: Gangwon is north-east, Jeju is off the
 * south-west corner, Busan and Ulsan are south-east, Gwangju sits inside
 * Jeonnam. Anyone who knows the map can falsify it in seconds.
 *
 * WHY THIS STOPS AT 17.
 *
 * The obvious next levels do not follow, and for two different reasons:
 *
 *   시군구  ~250 units. The tiles would fit the budget, but their positions
 *           would not be checkable at a glance and I do not have real
 *           centroids under a license that permits redistribution. Placing
 *           250 tiles from memory would be inventing data, which is the one
 *           thing this site is built not to do.
 *   읍면동  ~3,500 units. Measured: this route may spend 23.4 KB of gzipped
 *           HTML, and 3,500 tiles do not fit. A 3,500-tile cartogram is also
 *           not a cartogram anyone reads.
 *
 * See docs/DATA-VISUALIZATION.md for the licensing rule this obeys: 공공누리
 * type 1 only, because a visualisation is a derivative work and types 3 and 4
 * forbid modification.
 */

export type Division = {
  /** Statistical code prefix for the division. Two digits, stable. */
  readonly code: string
  /** Two-letter tile label. The full name comes from lib/i18n. */
  readonly abbr: string
  /** Row in the schematic grid, 0 at the top. */
  readonly row: number
  /** Column in the schematic grid, 0 at the left. */
  readonly col: number
}

export const GRID_ROWS = 7
export const GRID_COLS = 6

/**
 * Ordered north-to-south, then west-to-east, so the source reads in the same
 * order the grid does and a misplaced tile is visible in the diff.
 */
export const DIVISIONS: readonly Division[] = [
  { code: '41', abbr: '경기', row: 0, col: 3 },
  { code: '51', abbr: '강원', row: 0, col: 4 },
  { code: '28', abbr: '인천', row: 1, col: 2 },
  { code: '11', abbr: '서울', row: 1, col: 3 },
  { code: '44', abbr: '충남', row: 2, col: 2 },
  { code: '36', abbr: '세종', row: 2, col: 3 },
  { code: '43', abbr: '충북', row: 2, col: 4 },
  { code: '47', abbr: '경북', row: 2, col: 5 },
  { code: '30', abbr: '대전', row: 3, col: 3 },
  { code: '27', abbr: '대구', row: 3, col: 5 },
  { code: '52', abbr: '전북', row: 4, col: 2 },
  { code: '31', abbr: '울산', row: 4, col: 5 },
  { code: '29', abbr: '광주', row: 5, col: 1 },
  { code: '46', abbr: '전남', row: 5, col: 2 },
  { code: '48', abbr: '경남', row: 5, col: 3 },
  { code: '26', abbr: '부산', row: 5, col: 4 },
  { code: '50', abbr: '제주', row: 6, col: 0 },
]

/* ------------------------------------------------------------------ */
/* The value layer                                                     */
/* ------------------------------------------------------------------ */

/**
 * What each tile encodes — and it is empty on purpose.
 *
 * A cartogram with no variable is a labelled grid, not a visualisation. This
 * slot is where the variable goes, and it is null because no dataset has
 * cleared the bar in docs/DATA-VISUALIZATION.md yet: 공공누리 type 1, labels
 * that work in both locales, and a question rather than "look at this data".
 *
 * Printing a number I could not cite would be worse than printing none. The
 * page says the layer is missing rather than filling it with something that
 * looks authoritative — `pnpm check:cartogram` fails if a value appears
 * without a source recorded beside it.
 */
export type ValueLayer = {
  /** Dictionary key for the label, e.g. 'population'. */
  readonly id: string
  /** Where the numbers came from. Required — a number with no source is a rumour. */
  readonly source: { readonly name: string; readonly url: string; readonly license: string }
  /** Division code -> value. Every code in DIVISIONS must be present. */
  readonly values: Readonly<Record<string, number>>
}

export const VALUE_LAYER: ValueLayer | null = null

/* ------------------------------------------------------------------ */
/* Derived                                                            */
/* ------------------------------------------------------------------ */

/** Tiles in reading order, for the keyboard path. */
export function tilesInReadingOrder(): readonly Division[] {
  return [...DIVISIONS].sort((a, b) => a.row - b.row || a.col - b.col)
}
