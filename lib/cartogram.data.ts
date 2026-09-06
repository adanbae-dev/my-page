/**
 * A tile cartogram of Korea's 16 first-level divisions.
 *
 * SIXTEEN, NOT SEVENTEEN — and the data said so, not me.
 *
 * The first version of this file listed 17 with Gwangju (29) and Jeonnam (46)
 * as separate tiles, written from memory. The 2026-07-31 registration figures
 * carry neither: they carry `전남광주통합특별시` under a new code, `12`, with
 * 3,157,777 residents across 27 districts. The two merged.
 *
 * An English-language summary had already said "Jeonnam-Gwangju" and it was
 * dismissed as a garbled table extraction, because the memory was more
 * confident than the evidence. The codes below are read out of the dataset
 * rather than recalled.
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
 * WHY THIS STOPS AT 16.
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
export const GRID_COLS = 5

/**
 * Ordered north-to-south, then west-to-east, so the source reads in the same
 * order the grid does and a misplaced tile is visible in the diff.
 */
export const DIVISIONS: readonly Division[] = [
  { code: '41', abbr: '경기', row: 0, col: 2 },
  { code: '51', abbr: '강원', row: 0, col: 3 },
  { code: '28', abbr: '인천', row: 1, col: 1 },
  { code: '11', abbr: '서울', row: 1, col: 2 },
  { code: '44', abbr: '충남', row: 2, col: 1 },
  { code: '36', abbr: '세종', row: 2, col: 2 },
  { code: '43', abbr: '충북', row: 2, col: 3 },
  { code: '47', abbr: '경북', row: 2, col: 4 },
  { code: '30', abbr: '대전', row: 3, col: 2 },
  { code: '27', abbr: '대구', row: 3, col: 4 },
  { code: '52', abbr: '전북', row: 4, col: 1 },
  { code: '31', abbr: '울산', row: 4, col: 4 },
  { code: '12', abbr: '전남광주', row: 5, col: 1 },
  { code: '48', abbr: '경남', row: 5, col: 2 },
  { code: '26', abbr: '부산', row: 5, col: 3 },
  { code: '50', abbr: '제주', row: 6, col: 1 },
]

/* ------------------------------------------------------------------ */
/* The value layer                                                     */
/* ------------------------------------------------------------------ */

/**
 * A variable painted onto the grid.
 *
 * `source` is required, not optional. A number on a page with nothing behind
 * it is a rumour, and this site's fifth brand promise is that its claims can
 * be checked — so the type will not let a value layer exist without saying
 * where it came from and under what terms.
 */
export type ValueLayer = {
  /** Dictionary key for the label, e.g. 'population'. */
  readonly id: string
  /** Where the numbers came from. Required. */
  readonly source: { readonly name: string; readonly url: string; readonly license: string }
  /** Division code -> value. Every code in DIVISIONS must be present. */
  readonly values: Readonly<Record<string, number>>
}

/**
 * What each tile encodes.
 *
 * Registered resident population, 2026-07-31. Not a census — this is
 * 주민등록인구, which counts registrations rather than people: it includes
 * residents whose whereabouts are unregistered and excludes foreign
 * nationals. The dataset says so and so does this comment, because the two
 * numbers differ and a reader comparing this against a census figure should
 * know which one they are looking at.
 *
 * DERIVED, AND THE DERIVATION IS THE PART TO CHECK. The published file is
 * per 읍면동 — 3,619 rows — with no province totals in it. These sixteen
 * numbers are sums this repository computed over the `계` column grouped by
 * `시도명`. `NATIONAL_TOTAL` below is the sum of the sums, and
 * `pnpm check:cartogram` fails if the sixteen stop adding up to it, which is
 * what catches a mistyped digit.
 *
 * The licence is the reason this dataset is here rather than a better-known
 * one: `이용허락범위 제한 없음` — no restriction — which clears the bar in
 * docs/DATA-VISUALIZATION.md without needing to argue about 공공누리 types.
 * KOSIS and the ministry's own portal both sit behind a login; this file
 * downloads without one.
 */
export const NATIONAL_TOTAL = 51_088_284

export const VALUE_LAYER: ValueLayer | null = {
  id: 'population',
  source: {
    name: '행정안전부 지역별(행정동) 성별 연령별 주민등록 인구수 · 2026-07-31',
    url: 'https://www.data.go.kr/data/15097972/fileData.do',
    license: '이용허락범위 제한 없음',
  },
  values: {
    '41': 13_768_157,
    '11': 9_284_263,
    '26': 3_230_982,
    '48': 3_193_742,
    '12': 3_157_777,
    '28': 3_063_730,
    '47': 2_494_470,
    '27': 2_347_389,
    '44': 2_138_955,
    '52': 1_717_841,
    '43': 1_601_156,
    '51': 1_507_224,
    '30': 1_442_190,
    '31': 1_086_756,
    '50': 662_680,
    '36': 390_972,
  },
}

/* ------------------------------------------------------------------ */
/* Derived                                                            */
/* ------------------------------------------------------------------ */

/** Tiles in reading order, for the keyboard path. */
export function tilesInReadingOrder(): readonly Division[] {
  return [...DIVISIONS].sort((a, b) => a.row - b.row || a.col - b.col)
}
