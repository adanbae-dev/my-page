/**
 * The 245 districts, placed on a hexagonal grid from real centroids.
 *
 * GENERATED, NOT AUTHORED — and that is the difference from
 * lib/cartogram.data.ts, where sixteen provinces were arranged by hand and
 * the arrangement was checkable at a glance. Two hundred and forty-five
 * cannot be checked that way, so nothing here was placed by judgement:
 *
 *   1  Boundary polygons come from 국토교통부 국토지리정보원 공간정보공동활용
 *      시군구 (WKB in a CSV, 이용허락범위 제한 없음). The area-weighted
 *      centroid of each district's largest ring was computed from them —
 *      254 of 254 parsed, zero failures.
 *   2  Longitude is scaled by cos(mean latitude) so a degree east and a
 *      degree north cover comparable ground at this latitude.
 *   3  Each centroid claims the nearest free cell, taken in a fixed order
 *      (province, then district name) so the result is deterministic and a
 *      rerun produces the same file.
 *
 * WHAT THAT COSTS. 30x35 = 1,050 cells for 245 districts. Mean displacement
 * 1.05 cells, worst 4.60 — Seoul's twenty-five districts and Cheongju's four
 * cannot all sit on their true positions when the grid is coarser than they
 * are. A denser grid improves it barely (38x44 gives 0.89) and costs bytes,
 * so 30x35 is where it stops.
 *
 * ELEVEN DISTRICTS ARE ABSENT and are not silently dropped: the boundary file
 * is 2023 and the population and brokerage files are 2026, and in between
 * Hwaseong split into four wards, Incheon reorganised into five, and Cheongju
 * into two. No 2023 centroid exists for a district created in 2024. They are
 * named on the page rather than invented here.
 *
 * THE JOIN IS BY NAME, and a name match is where this nearly went wrong. An
 * `endsWith` rule meant to fold `청주시상당구` into `상당구` also matched
 * 인천 남동구 against 남구 and 포항시북구 against 북구, which put two
 * districts in the table twice; 세종특별자치시 has no district level at all
 * in the population file and came through with a population of zero. Both
 * were caught by scripts/check-cartogram.mjs, not by reading the table. The
 * suffix rule now requires the trimmed remainder to end in 시, and 세종 takes
 * its province total.
 */

export type District = {
  readonly sido: string
  readonly sgg: string
  readonly row: number
  readonly col: number
  /** Registered brokerage offices. 국토교통부 중개사무소 등록현황, 2026-08-18. */
  readonly brokers: number
  /** Registered residents. 행정안전부 주민등록인구, 2026-07-31. */
  readonly pop: number
}

export const D_GRID_ROWS = 35
export const D_GRID_COLS = 30

/**
 * Sum of every `brokers` below. The gate re-adds the rows against it, so a
 * row edited by hand — or a regeneration that silently loses one — fails the
 * build instead of quietly changing the total on the page.
 */
export const DISTRICT_BROKER_TOTAL = 78235

export const DISTRICTS: readonly District[] = [
  { sido: '강원특별자치도', sgg: '고성군', row: 0, col: 18, brokers: 28, pop: 27190 },
  { sido: '서울특별시', sgg: '종로구', row: 1, col: 9, brokers: 415, pop: 136139 },
  { sido: '서울특별시', sgg: '성북구', row: 1, col: 10, brokers: 649, pop: 421289 },
  { sido: '서울특별시', sgg: '도봉구', row: 1, col: 11, brokers: 382, pop: 298067 },
  { sido: '서울특별시', sgg: '은평구', row: 1, col: 12, brokers: 804, pop: 453056 },
  { sido: '강원특별자치도', sgg: '철원군', row: 1, col: 13, brokers: 29, pop: 39665 },
  { sido: '강원특별자치도', sgg: '화천군', row: 1, col: 14, brokers: 14, pop: 22773 },
  { sido: '강원특별자치도', sgg: '양구군', row: 1, col: 16, brokers: 6, pop: 20372 },
  { sido: '강원특별자치도', sgg: '속초시', row: 1, col: 18, brokers: 142, pop: 78976 },
  { sido: '서울특별시', sgg: '서대문구', row: 2, col: 9, brokers: 527, pop: 299531 },
  { sido: '서울특별시', sgg: '노원구', row: 2, col: 10, brokers: 569, pop: 480549 },
  { sido: '서울특별시', sgg: '강북구', row: 2, col: 11, brokers: 446, pop: 277695 },
  { sido: '경기도', sgg: '연천군', row: 2, col: 12, brokers: 64, pop: 43107 },
  { sido: '경기도', sgg: '포천시', row: 2, col: 13, brokers: 254, pop: 140454 },
  { sido: '서울특별시', sgg: '동대문구', row: 2, col: 14, brokers: 684, pop: 353070 },
  { sido: '강원특별자치도', sgg: '인제군', row: 2, col: 17, brokers: 19, pop: 30778 },
  { sido: '강원특별자치도', sgg: '양양군', row: 2, col: 19, brokers: 28, pop: 27310 },
  { sido: '인천광역시', sgg: '옹진군', row: 3, col: 0, brokers: 18, pop: 19327 },
  { sido: '인천광역시', sgg: '강화군', row: 3, col: 7, brokers: 186, pop: 69556 },
  { sido: '서울특별시', sgg: '마포구', row: 3, col: 8, brokers: 915, pop: 356154 },
  { sido: '경기도', sgg: '파주시', row: 3, col: 9, brokers: 725, pop: 534503 },
  { sido: '경기도', sgg: '양주시', row: 3, col: 10, brokers: 395, pop: 297352 },
  { sido: '경기도', sgg: '동두천시', row: 3, col: 11, brokers: 115, pop: 86186 },
  { sido: '경기도', sgg: '의정부시', row: 3, col: 12, brokers: 580, pop: 461879 },
  { sido: '서울특별시', sgg: '강남구', row: 3, col: 13, brokers: 2046, pop: 552631 },
  { sido: '강원특별자치도', sgg: '춘천시', row: 3, col: 14, brokers: 356, pop: 284853 },
  { sido: '서울특별시', sgg: '중랑구', row: 3, col: 15, brokers: 559, pop: 376282 },
  { sido: '인천광역시', sgg: '부평구', row: 4, col: 7, brokers: 701, pop: 487661 },
  { sido: '서울특별시', sgg: '동작구', row: 4, col: 8, brokers: 636, pop: 371543 },
  { sido: '경기도', sgg: '김포시', row: 4, col: 9, brokers: 840, pop: 483964 },
  { sido: '경기도', sgg: '고양시일산동구', row: 4, col: 10, brokers: 535, pop: 298158 },
  { sido: '경기도', sgg: '안양시동안구', row: 4, col: 11, brokers: 641, pop: 328098 },
  { sido: '경기도', sgg: '안양시만안구', row: 4, col: 12, brokers: 377, pop: 234045 },
  { sido: '경기도', sgg: '남양주시', row: 4, col: 13, brokers: 1019, pop: 727373 },
  { sido: '경기도', sgg: '가평군', row: 4, col: 14, brokers: 93, pop: 62048 },
  { sido: '서울특별시', sgg: '광진구', row: 4, col: 15, brokers: 691, pop: 330802 },
  { sido: '강원특별자치도', sgg: '홍천군', row: 4, col: 16, brokers: 77, pop: 65810 },
  { sido: '강원특별자치도', sgg: '강릉시', row: 4, col: 20, brokers: 252, pop: 205593 },
  { sido: '서울특별시', sgg: '양천구', row: 5, col: 7, brokers: 735, pop: 420595 },
  { sido: '서울특별시', sgg: '강서구', row: 5, col: 8, brokers: 957, pop: 548268 },
  { sido: '경기도', sgg: '고양시일산서구', row: 5, col: 9, brokers: 424, pop: 276159 },
  { sido: '경기도', sgg: '고양시덕양구', row: 5, col: 10, brokers: 721, pop: 482849 },
  { sido: '경기도', sgg: '부천시오정구', row: 5, col: 11, brokers: 272, pop: 148710 },
  { sido: '경기도', sgg: '구리시', row: 5, col: 12, brokers: 339, pop: 188040 },
  { sido: '경기도', sgg: '용인시수지구', row: 5, col: 13, brokers: 489, pop: 368881 },
  { sido: '경기도', sgg: '하남시', row: 5, col: 14, brokers: 627, pop: 327423 },
  { sido: '서울특별시', sgg: '성동구', row: 5, col: 15, brokers: 622, pop: 274346 },
  { sido: '강원특별자치도', sgg: '평창군', row: 5, col: 18, brokers: 45, pop: 39865 },
  { sido: '인천광역시', sgg: '계양구', row: 6, col: 7, brokers: 358, pop: 276125 },
  { sido: '서울특별시', sgg: '구로구', row: 6, col: 8, brokers: 609, pop: 382531 },
  { sido: '경기도', sgg: '시흥시', row: 6, col: 9, brokers: 992, pop: 514996 },
  { sido: '경기도', sgg: '부천시소사구', row: 6, col: 10, brokers: 316, pop: 224007 },
  { sido: '경기도', sgg: '과천시', row: 6, col: 11, brokers: 164, pop: 81008 },
  { sido: '경기도', sgg: '성남시분당구', row: 6, col: 12, brokers: 888, pop: 467039 },
  { sido: '경기도', sgg: '광주시', row: 6, col: 13, brokers: 618, pop: 400323 },
  { sido: '경기도', sgg: '양평군', row: 6, col: 14, brokers: 272, pop: 126995 },
  { sido: '서울특별시', sgg: '강동구', row: 6, col: 15, brokers: 949, pop: 498701 },
  { sido: '강원특별자치도', sgg: '횡성군', row: 6, col: 16, brokers: 66, pop: 45521 },
  { sido: '강원특별자치도', sgg: '동해시', row: 6, col: 21, brokers: 43, pop: 85577 },
  { sido: '경상북도', sgg: '울릉군', row: 6, col: 29, brokers: 5, pop: 8780 },
  { sido: '서울특별시', sgg: '영등포구', row: 7, col: 7, brokers: 829, pop: 371691 },
  { sido: '서울특별시', sgg: '관악구', row: 7, col: 8, brokers: 677, pop: 477503 },
  { sido: '경기도', sgg: '부천시원미구', row: 7, col: 9, brokers: 709, pop: 382134 },
  { sido: '경기도', sgg: '광명시', row: 7, col: 10, brokers: 525, pop: 303726 },
  { sido: '경기도', sgg: '군포시', row: 7, col: 11, brokers: 379, pop: 249253 },
  { sido: '경기도', sgg: '성남시수정구', row: 7, col: 12, brokers: 473, pop: 234987 },
  { sido: '경기도', sgg: '성남시중원구', row: 7, col: 13, brokers: 437, pop: 199084 },
  { sido: '경기도', sgg: '여주시', row: 7, col: 14, brokers: 176, pop: 113383 },
  { sido: '강원특별자치도', sgg: '원주시', row: 7, col: 15, brokers: 539, pop: 365218 },
  { sido: '강원특별자치도', sgg: '정선군', row: 7, col: 19, brokers: 14, pop: 35144 },
  { sido: '강원특별자치도', sgg: '삼척시', row: 7, col: 21, brokers: 34, pop: 60139 },
  { sido: '인천광역시', sgg: '연수구', row: 8, col: 7, brokers: 646, pop: 410280 },
  { sido: '서울특별시', sgg: '금천구', row: 8, col: 8, brokers: 450, pop: 222421 },
  { sido: '경기도', sgg: '안산시단원구', row: 8, col: 9, brokers: 523, pop: 288378 },
  { sido: '경기도', sgg: '수원시장안구', row: 8, col: 10, brokers: 400, pop: 269791 },
  { sido: '경기도', sgg: '수원시권선구', row: 8, col: 11, brokers: 525, pop: 360118 },
  { sido: '경기도', sgg: '수원시영통구', row: 8, col: 12, brokers: 606, pop: 362098 },
  { sido: '경기도', sgg: '오산시', row: 8, col: 13, brokers: 290, pop: 254747 },
  { sido: '경기도', sgg: '용인시처인구', row: 8, col: 14, brokers: 542, pop: 287270 },
  { sido: '서울특별시', sgg: '송파구', row: 8, col: 15, brokers: 1303, pop: 649715 },
  { sido: '강원특별자치도', sgg: '영월군', row: 8, col: 18, brokers: 24, pop: 35685 },
  { sido: '강원특별자치도', sgg: '태백시', row: 8, col: 21, brokers: 9, pop: 36755 },
  { sido: '서울특별시', sgg: '중구', row: 9, col: 8, brokers: 468, pop: 117493 },
  { sido: '경기도', sgg: '의왕시', row: 9, col: 9, brokers: 234, pop: 165701 },
  { sido: '경기도', sgg: '안산시상록구', row: 9, col: 10, brokers: 398, pop: 320505 },
  { sido: '경기도', sgg: '수원시팔달구', row: 9, col: 11, brokers: 411, pop: 193325 },
  { sido: '경기도', sgg: '안성시', row: 9, col: 12, brokers: 346, pop: 199314 },
  { sido: '경기도', sgg: '용인시기흥구', row: 9, col: 13, brokers: 555, pop: 434408 },
  { sido: '경기도', sgg: '이천시', row: 9, col: 14, brokers: 358, pop: 225911 },
  { sido: '충청북도', sgg: '충주시', row: 9, col: 15, brokers: 282, pop: 205872 },
  { sido: '충청북도', sgg: '제천시', row: 9, col: 16, brokers: 127, pop: 128043 },
  { sido: '충청북도', sgg: '단양군', row: 9, col: 17, brokers: 23, pop: 26552 },
  { sido: '인천광역시', sgg: '남동구', row: 10, col: 9, brokers: 631, pop: 478762 },
  { sido: '서울특별시', sgg: '용산구', row: 10, col: 10, brokers: 678, pop: 199575 },
  { sido: '경기도', sgg: '평택시', row: 10, col: 11, brokers: 1349, pop: 620754 },
  { sido: '서울특별시', sgg: '서초구', row: 10, col: 12, brokers: 1296, pop: 414616 },
  { sido: '충청남도', sgg: '천안시서북구', row: 10, col: 13, brokers: 829, pop: 402701 },
  { sido: '충청북도', sgg: '음성군', row: 10, col: 14, brokers: 139, pop: 96036 },
  { sido: '경상북도', sgg: '영주시', row: 10, col: 19, brokers: 86, pop: 96345 },
  { sido: '경상북도', sgg: '봉화군', row: 10, col: 20, brokers: 14, pop: 28076 },
  { sido: '경상북도', sgg: '울진군', row: 10, col: 22, brokers: 20, pop: 46216 },
  { sido: '충청남도', sgg: '태안군', row: 11, col: 7, brokers: 70, pop: 59005 },
  { sido: '충청남도', sgg: '서산시', row: 11, col: 8, brokers: 236, pop: 171093 },
  { sido: '충청남도', sgg: '당진시', row: 11, col: 9, brokers: 269, pop: 172472 },
  { sido: '충청남도', sgg: '예산군', row: 11, col: 10, brokers: 82, pop: 78168 },
  { sido: '충청남도', sgg: '아산시', row: 11, col: 11, brokers: 631, pop: 364270 },
  { sido: '충청남도', sgg: '천안시동남구', row: 11, col: 12, brokers: 390, pop: 263741 },
  { sido: '충청북도', sgg: '진천군', row: 11, col: 13, brokers: 94, pop: 85590 },
  { sido: '충청북도', sgg: '증평군', row: 11, col: 14, brokers: 39, pop: 36758 },
  { sido: '충청북도', sgg: '괴산군', row: 11, col: 15, brokers: 32, pop: 37267 },
  { sido: '경상북도', sgg: '문경시', row: 11, col: 16, brokers: 70, pop: 64662 },
  { sido: '경상북도', sgg: '영양군', row: 11, col: 21, brokers: 3, pop: 15973 },
  { sido: '충청남도', sgg: '홍성군', row: 12, col: 10, brokers: 91, pop: 101743 },
  { sido: '충청북도', sgg: '청주시흥덕구', row: 12, col: 12, brokers: 542, pop: 293157 },
  { sido: '세종특별자치시', sgg: '세종시', row: 12, col: 13, brokers: 840, pop: 390972 },
  { sido: '충청북도', sgg: '청주시상당구', row: 12, col: 14, brokers: 233, pop: 192850 },
  { sido: '경상북도', sgg: '예천군', row: 12, col: 18, brokers: 41, pop: 53340 },
  { sido: '경상북도', sgg: '안동시', row: 12, col: 20, brokers: 109, pop: 151584 },
  { sido: '충청남도', sgg: '보령시', row: 13, col: 9, brokers: 74, pop: 91144 },
  { sido: '충청남도', sgg: '청양군', row: 13, col: 10, brokers: 19, pop: 30032 },
  { sido: '충청남도', sgg: '공주시', row: 13, col: 11, brokers: 138, pop: 99619 },
  { sido: '대전광역시', sgg: '유성구', row: 13, col: 12, brokers: 707, pop: 371855 },
  { sido: '대전광역시', sgg: '대덕구', row: 13, col: 13, brokers: 206, pop: 163823 },
  { sido: '충청북도', sgg: '보은군', row: 13, col: 14, brokers: 23, pop: 31480 },
  { sido: '경상북도', sgg: '상주시', row: 13, col: 16, brokers: 75, pop: 89070 },
  { sido: '경상북도', sgg: '영덕군', row: 13, col: 22, brokers: 19, pop: 32536 },
  { sido: '충청남도', sgg: '부여군', row: 14, col: 11, brokers: 33, pop: 57687 },
  { sido: '충청남도', sgg: '계룡시', row: 14, col: 12, brokers: 46, pop: 45983 },
  { sido: '대전광역시', sgg: '서구', row: 14, col: 13, brokers: 786, pop: 464428 },
  { sido: '대전광역시', sgg: '동구', row: 14, col: 14, brokers: 307, pop: 218050 },
  { sido: '충청북도', sgg: '옥천군', row: 14, col: 15, brokers: 16, pop: 50660 },
  { sido: '경상북도', sgg: '의성군', row: 14, col: 19, brokers: 27, pop: 47920 },
  { sido: '경상북도', sgg: '청송군', row: 14, col: 21, brokers: 18, pop: 24437 },
  { sido: '충청남도', sgg: '서천군', row: 15, col: 10, brokers: 26, pop: 46635 },
  { sido: '충청남도', sgg: '논산시', row: 15, col: 12, brokers: 90, pop: 105815 },
  { sido: '대전광역시', sgg: '중구', row: 15, col: 13, brokers: 302, pop: 224034 },
  { sido: '충청북도', sgg: '영동군', row: 15, col: 15, brokers: 25, pop: 43029 },
  { sido: '경상북도', sgg: '김천시', row: 15, col: 16, brokers: 146, pop: 132550 },
  { sido: '경상북도', sgg: '구미시', row: 15, col: 17, brokers: 579, pop: 402691 },
  { sido: '대구광역시', sgg: '서구', row: 15, col: 18, brokers: 197, pop: 163456 },
  { sido: '대구광역시', sgg: '군위군', row: 15, col: 19, brokers: 33, pop: 22552 },
  { sido: '경상북도', sgg: '포항시북구', row: 15, col: 21, brokers: 419, pop: 275509 },
  { sido: '전북특별자치도', sgg: '군산시', row: 16, col: 10, brokers: 445, pop: 255537 },
  { sido: '전북특별자치도', sgg: '익산시', row: 16, col: 11, brokers: 292, pop: 266707 },
  { sido: '충청남도', sgg: '금산군', row: 16, col: 14, brokers: 51, pop: 48847 },
  { sido: '전북특별자치도', sgg: '무주군', row: 16, col: 15, brokers: 12, pop: 23412 },
  { sido: '대구광역시', sgg: '중구', row: 16, col: 17, brokers: 245, pop: 101815 },
  { sido: '경상북도', sgg: '칠곡군', row: 16, col: 18, brokers: 156, pop: 103539 },
  { sido: '대구광역시', sgg: '동구', row: 16, col: 19, brokers: 498, pop: 338544 },
  { sido: '대구광역시', sgg: '북구', row: 16, col: 20, brokers: 544, pop: 406587 },
  { sido: '경상북도', sgg: '영천시', row: 16, col: 21, brokers: 113, pop: 93847 },
  { sido: '경상북도', sgg: '포항시남구', row: 16, col: 23, brokers: 240, pop: 211509 },
  { sido: '전북특별자치도', sgg: '김제시', row: 17, col: 10, brokers: 56, pop: 81665 },
  { sido: '전북특별자치도', sgg: '전주시덕진구', row: 17, col: 11, brokers: 642, pop: 306845 },
  { sido: '전북특별자치도', sgg: '완주군', row: 17, col: 12, brokers: 119, pop: 100378 },
  { sido: '전북특별자치도', sgg: '진안군', row: 17, col: 13, brokers: 9, pop: 24855 },
  { sido: '경상북도', sgg: '성주군', row: 17, col: 17, brokers: 38, pop: 40374 },
  { sido: '대구광역시', sgg: '남구', row: 17, col: 18, brokers: 200, pop: 141659 },
  { sido: '경상북도', sgg: '경산시', row: 17, col: 19, brokers: 442, pop: 263171 },
  { sido: '대구광역시', sgg: '수성구', row: 17, col: 20, brokers: 803, pop: 407820 },
  { sido: '경상북도', sgg: '경주시', row: 17, col: 21, brokers: 256, pop: 242880 },
  { sido: '전북특별자치도', sgg: '부안군', row: 18, col: 10, brokers: 47, pop: 46926 },
  { sido: '전북특별자치도', sgg: '정읍시', row: 18, col: 11, brokers: 61, pop: 100632 },
  { sido: '전북특별자치도', sgg: '전주시완산구', row: 18, col: 12, brokers: 641, pop: 313004 },
  { sido: '전북특별자치도', sgg: '장수군', row: 18, col: 14, brokers: 10, pop: 21180 },
  { sido: '경상남도', sgg: '거창군', row: 18, col: 16, brokers: 40, pop: 58760 },
  { sido: '경상북도', sgg: '고령군', row: 18, col: 18, brokers: 28, pop: 29472 },
  { sido: '대구광역시', sgg: '달서구', row: 18, col: 19, brokers: 736, pop: 512963 },
  { sido: '경상북도', sgg: '청도군', row: 18, col: 20, brokers: 33, pop: 39989 },
  { sido: '울산광역시', sgg: '중구', row: 18, col: 22, brokers: 237, pop: 202823 },
  { sido: '울산광역시', sgg: '북구', row: 18, col: 23, brokers: 229, pop: 213512 },
  { sido: '전북특별자치도', sgg: '고창군', row: 19, col: 9, brokers: 40, pop: 50006 },
  { sido: '전북특별자치도', sgg: '임실군', row: 19, col: 12, brokers: 10, pop: 25308 },
  { sido: '경상남도', sgg: '함양군', row: 19, col: 14, brokers: 22, pop: 35121 },
  { sido: '경상남도', sgg: '합천군', row: 19, col: 16, brokers: 21, pop: 38812 },
  { sido: '대구광역시', sgg: '달성군', row: 19, col: 17, brokers: 370, pop: 251993 },
  { sido: '경상남도', sgg: '창녕군', row: 19, col: 18, brokers: 63, pop: 54321 },
  { sido: '경상남도', sgg: '밀양시', row: 19, col: 19, brokers: 145, pop: 98498 },
  { sido: '울산광역시', sgg: '울주군', row: 19, col: 21, brokers: 327, pop: 218370 },
  { sido: '울산광역시', sgg: '남구', row: 19, col: 22, brokers: 649, pop: 304418 },
  { sido: '울산광역시', sgg: '동구', row: 19, col: 23, brokers: 113, pop: 147633 },
  { sido: '전남광주통합특별시', sgg: '장성군', row: 20, col: 10, brokers: 43, pop: 43130 },
  { sido: '전북특별자치도', sgg: '순창군', row: 20, col: 12, brokers: 3, pop: 27642 },
  { sido: '전북특별자치도', sgg: '남원시', row: 20, col: 13, brokers: 43, pop: 73744 },
  { sido: '경상남도', sgg: '산청군', row: 20, col: 16, brokers: 30, pop: 32634 },
  { sido: '경상남도', sgg: '의령군', row: 20, col: 17, brokers: 10, pop: 24516 },
  { sido: '경상남도', sgg: '함안군', row: 20, col: 18, brokers: 96, pop: 56737 },
  { sido: '경상남도', sgg: '창원시의창구', row: 20, col: 19, brokers: 340, pop: 209814 },
  { sido: '부산광역시', sgg: '북구', row: 20, col: 20, brokers: 276, pop: 260432 },
  { sido: '경상남도', sgg: '양산시', row: 20, col: 21, brokers: 603, pop: 361264 },
  { sido: '부산광역시', sgg: '기장군', row: 20, col: 22, brokers: 287, pop: 175402 },
  { sido: '부산광역시', sgg: '해운대구', row: 20, col: 23, brokers: 680, pop: 370275 },
  { sido: '전남광주통합특별시', sgg: '영광군', row: 21, col: 8, brokers: 24, pop: 53752 },
  { sido: '전남광주통합특별시', sgg: '북구', row: 21, col: 10, brokers: 718, pop: 416780 },
  { sido: '전남광주통합특별시', sgg: '담양군', row: 21, col: 11, brokers: 48, pop: 43972 },
  { sido: '전남광주통합특별시', sgg: '곡성군', row: 21, col: 12, brokers: 14, pop: 27663 },
  { sido: '전남광주통합특별시', sgg: '구례군', row: 21, col: 13, brokers: 13, pop: 24576 },
  { sido: '경상남도', sgg: '진주시', row: 21, col: 16, brokers: 636, pop: 334360 },
  { sido: '경상남도', sgg: '창원시마산회원구', row: 21, col: 18, brokers: 213, pop: 173916 },
  { sido: '경상남도', sgg: '창원시성산구', row: 21, col: 19, brokers: 466, pop: 245097 },
  { sido: '경상남도', sgg: '김해시', row: 21, col: 20, brokers: 913, pop: 532758 },
  { sido: '부산광역시', sgg: '금정구', row: 21, col: 21, brokers: 347, pop: 205483 },
  { sido: '부산광역시', sgg: '동래구', row: 21, col: 22, brokers: 495, pop: 270741 },
  { sido: '전남광주통합특별시', sgg: '신안군', row: 22, col: 8, brokers: 10, pop: 42387 },
  { sido: '전남광주통합특별시', sgg: '함평군', row: 22, col: 9, brokers: 18, pop: 29651 },
  { sido: '전남광주통합특별시', sgg: '광산구', row: 22, col: 10, brokers: 802, pop: 382841 },
  { sido: '전남광주통합특별시', sgg: '남구', row: 22, col: 11, brokers: 328, pop: 205428 },
  { sido: '전남광주통합특별시', sgg: '동구', row: 22, col: 12, brokers: 273, pop: 105344 },
  { sido: '경상남도', sgg: '하동군', row: 22, col: 15, brokers: 33, pop: 39539 },
  { sido: '경상남도', sgg: '사천시', row: 22, col: 16, brokers: 134, pop: 107838 },
  { sido: '경상남도', sgg: '창원시마산합포구', row: 22, col: 18, brokers: 240, pop: 174360 },
  { sido: '부산광역시', sgg: '사하구', row: 22, col: 19, brokers: 343, pop: 281665 },
  { sido: '경상남도', sgg: '창원시진해구', row: 22, col: 20, brokers: 226, pop: 182750 },
  { sido: '부산광역시', sgg: '강서구', row: 22, col: 21, brokers: 438, pop: 154119 },
  { sido: '부산광역시', sgg: '남구', row: 22, col: 22, brokers: 387, pop: 254774 },
  { sido: '부산광역시', sgg: '연제구', row: 22, col: 23, brokers: 378, pop: 211580 },
  { sido: '전남광주통합특별시', sgg: '무안군', row: 23, col: 8, brokers: 136, pop: 95598 },
  { sido: '전남광주통합특별시', sgg: '나주시', row: 23, col: 10, brokers: 153, pop: 116699 },
  { sido: '전남광주통합특별시', sgg: '서구', row: 23, col: 11, brokers: 650, pop: 274408 },
  { sido: '전남광주통합특별시', sgg: '화순군', row: 23, col: 12, brokers: 63, pop: 59820 },
  { sido: '전남광주통합특별시', sgg: '순천시', row: 23, col: 13, brokers: 365, pop: 273733 },
  { sido: '전남광주통합특별시', sgg: '광양시', row: 23, col: 14, brokers: 183, pop: 155979 },
  { sido: '경상남도', sgg: '고성군', row: 23, col: 17, brokers: 39, pop: 46771 },
  { sido: '부산광역시', sgg: '사상구', row: 23, col: 19, brokers: 241, pop: 192275 },
  { sido: '부산광역시', sgg: '동구', row: 23, col: 20, brokers: 114, pop: 83146 },
  { sido: '부산광역시', sgg: '부산진구', row: 23, col: 21, brokers: 594, pop: 364481 },
  { sido: '부산광역시', sgg: '수영구', row: 23, col: 22, brokers: 373, pop: 168955 },
  { sido: '전남광주통합특별시', sgg: '목포시', row: 24, col: 8, brokers: 269, pop: 199230 },
  { sido: '전남광주통합특별시', sgg: '영암군', row: 24, col: 10, brokers: 26, pop: 50027 },
  { sido: '전남광주통합특별시', sgg: '보성군', row: 24, col: 12, brokers: 11, pop: 38101 },
  { sido: '전남광주통합특별시', sgg: '여수시', row: 24, col: 14, brokers: 210, pop: 260190 },
  { sido: '경상남도', sgg: '남해군', row: 24, col: 16, brokers: 28, pop: 41116 },
  { sido: '경상남도', sgg: '통영시', row: 24, col: 18, brokers: 105, pop: 115867 },
  { sido: '경상남도', sgg: '거제시', row: 24, col: 19, brokers: 229, pop: 228893 },
  { sido: '부산광역시', sgg: '중구', row: 24, col: 20, brokers: 85, pop: 36203 },
  { sido: '부산광역시', sgg: '서구', row: 24, col: 21, brokers: 104, pop: 101028 },
  { sido: '부산광역시', sgg: '영도구', row: 24, col: 22, brokers: 104, pop: 100423 },
  { sido: '전남광주통합특별시', sgg: '강진군', row: 25, col: 10, brokers: 13, pop: 31644 },
  { sido: '전남광주통합특별시', sgg: '장흥군', row: 25, col: 11, brokers: 15, pop: 33906 },
  { sido: '전남광주통합특별시', sgg: '고흥군', row: 25, col: 12, brokers: 21, pop: 58991 },
  { sido: '전남광주통합특별시', sgg: '진도군', row: 26, col: 8, brokers: 11, pop: 27841 },
  { sido: '전남광주통합특별시', sgg: '해남군', row: 26, col: 9, brokers: 37, pop: 61992 },
  { sido: '전남광주통합특별시', sgg: '완도군', row: 27, col: 9, brokers: 10, pop: 44094 },
  { sido: '제주특별자치도', sgg: '제주시', row: 33, col: 9, brokers: 1100, pop: 484111 },
  { sido: '제주특별자치도', sgg: '서귀포시', row: 34, col: 9, brokers: 290, pop: 178569 },
]

/**
 * Offices per 10,000 residents — derived here, never stored.
 *
 * Two stored numbers and a division. Writing the quotient into the table too
 * would be a third number that has to agree with the other two forever, and
 * this repository has spent enough commits on facts kept in two places.
 */
export const per10k = (d: District): number =>
  d.pop > 0 ? (d.brokers / d.pop) * 10_000 : 0
