import { cx } from '@/lib/cx'
import {
  ATTACH_MAX,
  ATTACH_PANELS,
  ATTACH_ROWS,
  ATTAIN_BARS,
  ATTAIN_ROWS,
  COHORT_H,
  COHORT_KEPT,
  COHORT_ROWS,
  COHORT_VALUE,
  COHORT_W,
  FIG,
  FLOW_BARS,
  KPI,
  LADDER,
  LADDER_ROWS,
  MRR_AREA,
  MONTH_ROWS,
  PEN_CELLS,
  PEN_CLASS_COUNTS,
  PEN_CLASSES,
  PEN_EDGES,
  PEN_FLOOR,
  PEN_ROWS,
  PEN_SVG,
  TIER_PER_COMPLEX,
  TIER_PER_HOUSEHOLD,
  TIER_ROWS,
  USAGE_LINE,
} from '@/lib/bi.figure'
import { BI_WINDOW } from '@/lib/bi.data'
import { ROSTER_INTAKE } from '@/lib/bi.roster.data'
import styles from './RevenueBoard.module.css'

/**
 * The whole route is this board. No hero, no closing essay.
 *
 * Every other page on this site is a scroll — a calm opening, a dense middle
 * that carries one figure, a quiet close. This one is not, and the difference
 * is the subject rather than a change of mind. A dashboard is a thing people
 * OPEN, several times a week, to answer a question they already have. The
 * argument for it is not made by a paragraph above it; it is made by whether
 * the nine figures on it can be read together. So the page opens on the
 * numbers, at the density they are actually used at.
 *
 * WHAT REPLACES THE ESSAY is the band across the top. A revenue dashboard
 * built on invented revenue has exactly one way to be dishonest, and it is
 * not the charts — it is going quiet about which half is real. The band is at
 * the top, in the caption of the two figures that name complexes, and inside
 * the drill-down panel. `pnpm check:bi` fails the build if any of the three
 * strings goes missing from either locale.
 *
 * NO CLIENT JAVASCRIPT. Nine figures, 245 hexagons, 11 small multiples and a
 * cohort triangle are all markup built at build time in lib/bi.figure.ts.
 * Values are reachable three ways without a script: printed beside the marks
 * that matter, in the SVG `<title>` of every mark the pointer can reach, and
 * in a table under each figure. The tables are `<details>` rather than always
 * open, which is a disclosure widget the browser implements — the page's
 * route budget is 11 KB of gzip JavaScript and none of it is spent here.
 */

export type RevenueLabels = {
  /** The three places the page says what is real. Gated. */
  readonly syntheticHero: string
  readonly syntheticChart: string
  readonly syntheticPanel: string
  readonly asOf: string
  readonly kpiMrr: string
  readonly kpiGrowth: string
  readonly kpiPenetration: string
  readonly kpiChurn: string
  readonly kpiCoverage: string
  readonly kpiNote: string
  readonly mrrTitle: string
  readonly mrrNote: string
  readonly mrrSummary: string
  readonly usageTitle: string
  readonly flowTitle: string
  readonly flowNote: string
  readonly flowSummary: string
  readonly flowGain: string
  readonly flowLoss: string
  readonly ladderTitle: string
  readonly ladderNote: string
  readonly ladderSummary: string
  readonly ladderFloored: string
  readonly ladderEntry: string
  readonly ladderCore: string
  readonly tierTitle: string
  readonly tierNote: string
  readonly tierPerComplex: string
  readonly tierPerHousehold: string
  readonly attachTitle: string
  readonly attachNote: string
  readonly attachSummary: string
  readonly penTitle: string
  readonly penNote: string
  readonly penSummary: string
  readonly penLegend: string
  readonly penNone: string
  readonly cohortTitle: string
  readonly cohortNote: string
  readonly cohortKept: string
  readonly cohortValue: string
  readonly attainTitle: string
  readonly attainNote: string
  readonly attainSummary: string
  readonly tableOpen: string
  readonly colMonth: string
  readonly colMrr: string
  readonly colUsage: string
  readonly colComplexes: string
  readonly colNew: string
  readonly colWinback: string
  readonly colExpansion: string
  readonly colContraction: string
  readonly colChurn: string
  readonly colHouseholds: string
  readonly colPerComplex: string
  readonly colPerHousehold: string
  readonly colFloored: string
  readonly colTier: string
  readonly colService: string
  readonly colFirst: string
  readonly colLast: string
  readonly colContracts: string
  readonly colDistrict: string
  readonly colSido: string
  readonly colAddressable: string
  readonly colRate: string
  readonly colCohort: string
  readonly colSize: string
  readonly colKept: string
  readonly colValue: string
  readonly colRep: string
  readonly colRank: string
  readonly colRegion: string
  readonly colAccounts: string
  readonly colQuota: string
  readonly colAttainment: string
  readonly services: Readonly<Record<string, string>>
  readonly tiers: Readonly<Record<string, string>>
}

/** Both monthly panels open the same table. See MONTH_ROWS in bi.figure.ts. */
const MONTH_COLS = (d: RevenueLabels) => [
  d.colMonth,
  d.colMrr,
  d.colUsage,
  d.colComplexes,
  d.colNew,
  d.colWinback,
  d.colExpansion,
  d.colContraction,
  d.colChurn,
]

const nf = (v: number) => v.toLocaleString('en-US')
const won = (v: number) =>
  v >= 100000000 ? `${Math.round(v / 10000000) / 10}억` : `${Math.round(v / 10000)}만`

/** A figure and its table, which is the only shape on this page. */
function Panel({
  id,
  title,
  note,
  wide,
  children,
  table,
  columns,
  rows,
  open,
}: {
  id: string
  title: string
  note?: string
  wide?: boolean
  children: React.ReactNode
  table: string
  columns: readonly string[]
  rows: string
  open: string
}) {
  return (
    <section
      className={cx(styles.panel, wide && styles.wide)}
      aria-labelledby={`${id}-t`}
    >
      <h2 id={`${id}-t`} className={cx('label', styles.panelTitle)}>
        {title}
      </h2>
      {note ? <p className={cx('small', 'muted', styles.panelNote)}>{note}</p> : null}
      {children}
      <details className={styles.table}>
        <summary className={cx('label', styles.tableSummary)}>{open}</summary>
        <div className={styles.tableScroll}>
          <table className={cx('small', styles.dataTable)}>
            <caption className="visuallyHidden">{table}</caption>
            <thead>
              <tr>
                {columns.map((c, i) => (
                  <th key={c} scope="col" className={i === 0 ? undefined : styles.num}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody dangerouslySetInnerHTML={{ __html: rows }} />
          </table>
        </div>
      </details>
    </section>
  )
}

export function RevenueBoard({ labels: d }: { labels: RevenueLabels }) {
  return (
    <div className={styles.board}>
      {/* ---- what is real, first and largest ------------------------ */}
      <aside className={styles.banner} aria-labelledby="synthetic-t">
        <p id="synthetic-t" className={cx('label', styles.bannerHead)}>
          {d.syntheticHero}
        </p>
        <p className={cx('small', styles.bannerBody)}>{d.syntheticChart}</p>
      </aside>

      {/* ---- the five numbers -------------------------------------- */}
      <section className={styles.tiles} aria-label={d.kpiNote}>
        <p className={cx('label', 'muted', styles.asOf)}>{d.asOf}</p>
        <dl className={styles.tileRow}>
          {(
            [
              [d.kpiMrr, won(KPI.mrr), `${BI_WINDOW.to.slice(0, 4)}.${BI_WINDOW.to.slice(4)}`],
              [d.kpiGrowth, `${KPI.mrrYoY > 0 ? '+' : ''}${KPI.mrrYoY}%`, 'YoY'],
              [
                d.kpiPenetration,
                `${KPI.penetrationAddressable}%`,
                `${nf(KPI.complexes)} / ${nf(KPI.tamAddressable)}`,
              ],
              [d.kpiChurn, `${KPI.churnRate}%`, '12M'],
              [d.kpiCoverage, `×${KPI.coverage}`, '12M'],
            ] as const
          ).map(([term, value, foot]) => (
            <div key={term} className={styles.tile}>
              <dt className={cx('label', 'muted', styles.tileTerm)}>{term}</dt>
              <dd className={styles.tileValue}>{value}</dd>
              <p className={cx('label', 'muted', styles.tileFoot)}>{foot}</p>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- the month, three ways over one axis -------------------- */}
      {/**
        * ONE PANEL, NOT TWO. The movement columns exist to be read against
        * the MRR step directly above them — the line rises in all 36 months
        * and the columns say how much left while it did, which is only an
        * argument if both are in view. Split into two panels they were also
        * two copies of the same 36-row table, which was 288 table cells of
        * duplicate markup on a page already over its budget.
        */}
      <Panel
        id="month"
        wide
        title={d.mrrTitle}
        note={d.mrrNote}
        open={d.tableOpen}
        table={d.mrrSummary}
        columns={MONTH_COLS(d)}
        rows={MONTH_ROWS}
      >
        <svg
          viewBox={`0 0 ${FIG.w} ${FIG.h}`}
          className={styles.svg}
          role="img"
          aria-label={d.mrrSummary}
          dangerouslySetInnerHTML={{ __html: MRR_AREA }}
        />

        <p className={cx('label', 'muted', styles.subTitle)}>{d.usageTitle}</p>
        <svg
          viewBox={`0 0 ${FIG.w} ${FIG.uh}`}
          className={styles.svgShort}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: USAGE_LINE }}
        />

        <h3 className={cx('label', styles.subHead)}>{d.flowTitle}</h3>
        <p className={cx('small', 'muted', styles.panelNote)}>{d.flowNote}</p>
        <ul className={cx('label', styles.legend)}>
          <li>
            <span className={cx(styles.key, styles.keyGain)} />
            {d.flowGain}
          </li>
          <li>
            <span className={cx(styles.key, styles.keyLoss)} />
            {d.flowLoss}
          </li>
        </ul>
        <svg
          viewBox={`0 0 ${FIG.w} ${FIG.h}`}
          className={styles.svg}
          role="img"
          aria-label={d.flowSummary}
          dangerouslySetInnerHTML={{ __html: FLOW_BARS }}
        />
      </Panel>

      {/* ---- finding 1: the rate ladder ---------------------------- */}
      <Panel
        id="ladder"
        title={d.ladderTitle}
        note={d.ladderNote}
        open={d.tableOpen}
        table={d.ladderSummary}
        columns={[d.colHouseholds, 'entry', 'core']}
        rows={LADDER_ROWS}
      >
        {/* Two series, so a legend is not optional — and the two are one
            colour apart only by dash, which is exactly the case a legend has
            to carry. The direct labels at each line's left end are the
            second path to the same identity. */}
        <ul className={cx('label', styles.legend)}>
          <li>
            <span className={cx(styles.key, styles.keyEntry)} />
            {d.ladderEntry}
          </li>
          <li>
            <span className={cx(styles.key, styles.keyCore)} />
            {d.ladderCore}
          </li>
        </ul>
        <svg
          viewBox={`0 0 ${FIG.ladderW} ${FIG.ladderH}`}
          className={styles.svg}
          role="img"
          aria-label={d.ladderSummary}
          dangerouslySetInnerHTML={{ __html: LADDER }}
        />
        <p className={cx('label', 'muted', styles.footNote)}>{d.ladderFloored}</p>
      </Panel>

      {/* ---- and what the tiers actually billed -------------------- */}
      <Panel
        id="tier"
        title={d.tierTitle}
        note={d.tierNote}
        open={d.tableOpen}
        table={d.tierTitle}
        columns={[
          d.colTier,
          d.colComplexes,
          d.colHouseholds,
          d.colPerComplex,
          d.colPerHousehold,
          d.colFloored,
        ]}
        rows={TIER_ROWS}
      >
        <div className={styles.pair}>
          <div>
            <p className={cx('label', 'muted', styles.subTitle)}>{d.tierPerComplex}</p>
            <svg
              viewBox={`0 0 ${FIG.tierW} ${FIG.tierH}`}
              className={styles.svg}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: TIER_PER_COMPLEX }}
            />
          </div>
          <div>
            <p className={cx('label', 'muted', styles.subTitle)}>{d.tierPerHousehold}</p>
            <svg
              viewBox={`0 0 ${FIG.tierW} ${FIG.tierH}`}
              className={styles.svg}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: TIER_PER_HOUSEHOLD }}
            />
          </div>
        </div>
      </Panel>

      {/* ---- eleven services, eleven panels ------------------------ */}
      <Panel
        id="attach"
        wide
        title={d.attachTitle}
        note={d.attachNote}
        open={d.tableOpen}
        table={d.attachSummary}
        columns={[d.colService, d.colFirst, d.colLast, d.colContracts]}
        rows={ATTACH_ROWS}
      >
        <ol className={styles.multiples} aria-label={d.attachSummary}>
          {ATTACH_PANELS.map((p) => (
            <li key={p.id} className={styles.multiple}>
              <p className={cx('label', styles.mName)}>{d.services[p.id] ?? p.id}</p>
              <svg
                viewBox={`0 0 ${FIG.smW} ${FIG.smH}`}
                className={styles.smSvg}
                role="img"
                aria-label={`${d.services[p.id] ?? p.id} ${p.first}% → ${p.last}%`}
                dangerouslySetInnerHTML={{ __html: p.path }}
              />
              <p className={cx('label', 'muted', styles.mValue)}>{p.last}%</p>
            </li>
          ))}
        </ol>
        <p className={cx('label', 'muted', styles.footNote)}>0 – {ATTACH_MAX}%</p>
      </Panel>

      {/* ---- the market, on the grid the other maps use ------------ */}
      <Panel
        id="pen"
        title={d.penTitle}
        note={d.penNote}
        open={d.tableOpen}
        table={d.penSummary}
        columns={[d.colDistrict, d.colSido, d.colAddressable, d.colRate]}
        rows={PEN_ROWS}
      >
        <svg
          viewBox={`0 0 ${PEN_SVG.w} ${PEN_SVG.h}`}
          className={styles.map}
          role="img"
          aria-label={d.penSummary}
        >
          <defs>
            <path id="bicell" d={PEN_SVG.cell} />
          </defs>
          <g className={styles.cells} dangerouslySetInnerHTML={{ __html: PEN_CELLS }} />
        </svg>
        <div className={styles.rampBlock}>
          <p className={cx('label', 'muted', styles.footNote)}>{d.penLegend}</p>
          <ol className={styles.ramp}>
            {Array.from({ length: PEN_CLASSES }, (_, i) => (
              <li key={i} className={styles[`b${i}`]} />
            ))}
            <li className={styles.bna} />
          </ol>
          <ol className={cx('label', styles.rampScale)}>
            <li>0</li>
            {PEN_EDGES.map((e) => (
              <li key={e}>{e}</li>
            ))}
            <li>{d.penNone}</li>
          </ol>
          <ol className={cx('label', 'muted', styles.rampScale)}>
            {PEN_CLASS_COUNTS.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ol>
        </div>
        <p className={cx('label', 'muted', styles.footNote)}>
          {d.syntheticPanel} · ≥{PEN_FLOOR}
        </p>
      </Panel>

      {/* ---- cohorts, twice ---------------------------------------- */}
      <Panel
        id="cohort"
        title={d.cohortTitle}
        note={d.cohortNote}
        open={d.tableOpen}
        table={d.cohortTitle}
        columns={[d.colCohort, d.colSize, d.colKept, d.colValue]}
        rows={COHORT_ROWS}
      >
        <div className={styles.pair}>
          <div>
            <p className={cx('label', 'muted', styles.subTitle)}>{d.cohortKept}</p>
            <svg
              viewBox={`0 0 ${COHORT_W} ${COHORT_H}`}
              className={styles.grid}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: COHORT_KEPT }}
            />
          </div>
          <div>
            <p className={cx('label', 'muted', styles.subTitle)}>{d.cohortValue}</p>
            <svg
              viewBox={`0 0 ${COHORT_W} ${COHORT_H}`}
              className={styles.grid}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: COHORT_VALUE }}
            />
          </div>
        </div>
      </Panel>

      {/* ---- the sales floor --------------------------------------- */}
      <Panel
        id="attain"
        wide
        title={d.attainTitle}
        note={d.attainNote}
        open={d.tableOpen}
        table={d.attainSummary}
        columns={[
          d.colRep,
          d.colRank,
          d.colRegion,
          d.colAccounts,
          d.colQuota,
          d.colAttainment,
        ]}
        rows={ATTAIN_ROWS}
      >
        <svg
          viewBox={`0 0 ${FIG.w} ${FIG.attH}`}
          className={styles.svg}
          role="img"
          aria-label={d.attainSummary}
          dangerouslySetInnerHTML={{ __html: ATTAIN_BARS }}
        />
      </Panel>

      <p className={cx('small', 'muted', styles.provenance)}>
        {d.syntheticHero} · {nf(ROSTER_INTAKE.complexes)} · {ROSTER_INTAKE.covered}/
        {ROSTER_INTAKE.districts} · {BI_WINDOW.from}–{BI_WINDOW.to}
      </p>
    </div>
  )
}
