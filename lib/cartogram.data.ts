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
 * grid map is — every published one is arranged by hand.
 *
 * They are packed so that every row is a CONTIGUOUS run of cells, with no
 * holes anywhere in the shape. An earlier version left gaps where no division
 * happened to fall and the result read as scattered confetti rather than a
 * country; the outline a reader recognises comes from the tiles touching.
 *
 * The arrangement is checkable at a glance rather than on trust. West coast
 * down the left — Incheon, Chungnam, Jeonbuk, Jeonnam-Gwangju. East coast
 * down the right — Gangwon, Gyeongbuk, Ulsan, Busan. Daejeon directly south
 * of Sejong, Daegu inside Gyeongbuk's southern half, Jeju alone off the
 * bottom. Anyone who knows the map can falsify it in seconds.
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

export const GRID_ROWS = 6
export const GRID_COLS = 5

/**
 * Ordered north-to-south, then west-to-east, so the source reads in the same
 * order the grid does and a misplaced tile is visible in the diff.
 */
export const DIVISIONS: readonly Division[] = [
  // 서해안에서 동해안으로, 북에서 남으로. 행마다 칸이 이어져 빈 구멍이 없다.
  { code: '28', abbr: '인천', row: 0, col: 1 },
  { code: '11', abbr: '서울', row: 0, col: 2 },
  { code: '41', abbr: '경기', row: 0, col: 3 },
  { code: '51', abbr: '강원', row: 0, col: 4 },

  { code: '44', abbr: '충남', row: 1, col: 0 },
  { code: '36', abbr: '세종', row: 1, col: 1 },
  { code: '43', abbr: '충북', row: 1, col: 2 },
  { code: '47', abbr: '경북', row: 1, col: 3 },

  { code: '30', abbr: '대전', row: 2, col: 1 },
  { code: '27', abbr: '대구', row: 2, col: 2 },
  { code: '31', abbr: '울산', row: 2, col: 3 },

  { code: '52', abbr: '전북', row: 3, col: 0 },
  { code: '48', abbr: '경남', row: 3, col: 1 },
  { code: '26', abbr: '부산', row: 3, col: 2 },

  { code: '12', abbr: '전남광주', row: 4, col: 0 },

  { code: '50', abbr: '제주', row: 5, col: 0 },
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
  /**
   * The sum, when summing means something — and null when it does not.
   *
   * A count of people adds up to a national total and the gate re-adds it to
   * catch a mistyped digit. A RATE does not: adding "offices per 10,000
   * residents" across sixteen provinces produces a number with no referent.
   * Null says the checksum does not apply here rather than leaving the gate
   * to invent one.
   */
  readonly total: number | null
  /** Decimal places to print. A count has none; a rate has one. */
  readonly decimals: number
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

const POPULATION: ValueLayer = {
  id: 'population',
  source: {
    name: '행정안전부 지역별(행정동) 성별 연령별 주민등록 인구수 · 2026-07-31',
    url: 'https://www.data.go.kr/data/15097972/fileData.do',
    license: '이용허락범위 제한 없음',
  },
  total: NATIONAL_TOTAL,
  decimals: 0,
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

/**
 * Offices per 10,000 residents — the layer that earns the second map.
 *
 * Drawing the raw office count would redraw the population map: 82,445
 * offices nationally, and the biggest counts sit exactly where the most
 * people do. A second cartogram that says the same thing as the first is
 * decoration.
 *
 * The rate does not. Sejong (21.5) and Jeju (21.0) come out ABOVE Seoul
 * (20.4), and Gyeonggi — which has the most offices of anywhere, 22,708 —
 * lands mid-table at 16.5. Gangwon is last at 11.4. That ordering is not
 * derivable from either input on its own, which is the whole reason to put
 * it on a map.
 *
 * Derived here from the two sources below, per province, and rounded to one
 * decimal. `total` is null: adding rates across provinces yields a number
 * that refers to nothing.
 */
const BROKERS_PER_10K: ValueLayer = {
  id: 'brokersPer10k',
  source: {
    name: '국토교통부 중개사무소 등록현황 2026-08-18 ÷ 행정안전부 주민등록인구 2026-07-31',
    url: 'https://www.data.go.kr/data/15063946/fileData.do',
    license: '이용허락범위 제한 없음',
  },
  total: null,
  decimals: 1,
  values: {
    '36': 21.5,
    '50': 21.0,
    '11': 20.4,
    '41': 16.5,
    '26': 16.2,
    '30': 16.0,
    '27': 15.4,
    '28': 14.7,
    '48': 14.5,
    '44': 14.4,
    '31': 14.3,
    '52': 14.1,
    '12': 14.1,
    '43': 13.1,
    '47': 11.8,
    '51': 11.4,
  },
}

export const VALUE_LAYERS: readonly ValueLayer[] = [POPULATION, BROKERS_PER_10K]

/** Kept for the first map, which is the one the page leads with. */
export const VALUE_LAYER: ValueLayer | null = POPULATION

/* ------------------------------------------------------------------ */
/* Derived                                                            */
/* ------------------------------------------------------------------ */

/** Tiles in reading order, for the keyboard path. */
export function tilesInReadingOrder(): readonly Division[] {
  return [...DIVISIONS].sort((a, b) => a.row - b.row || a.col - b.col)
}
