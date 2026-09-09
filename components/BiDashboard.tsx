'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { cx } from '@/lib/cx'
import styles from './BiDashboard.module.css'

/**
 * The filterable one. /portfolio/revenue answers nine questions its author
 * chose; this answers the question the reader chose.
 *
 * WHY IT IS A SECOND ROUTE RATHER THAN AN UPGRADE OF THE FIRST. The two
 * pages disagree about what a chart is for, and both positions are right for
 * their own page. /portfolio/revenue is an argument — nine figures in a fixed
 * order, each with a paragraph saying what it shows and why that encoding,
 * no controls, no JavaScript, and every value in a table underneath. This is
 * an instrument: no argument, one filter row, and every number recomputed
 * from whatever slice the reader asked for. Merging them would produce a page
 * that argues while its numbers move, which is the shape of most bad
 * dashboards.
 *
 * FILTERS SCOPE EVERYTHING BELOW THEM. One row, above the content, never
 * per-chart — so the tiles, the four figures and the table always describe
 * the same 1,236-complex-by-36-month rectangle. A chart with its own range
 * is a different dashboard.
 *
 * THE DATA ARRIVES AFTER PAINT. Filtering by district, size, management
 * type, service and month range cannot be precomputed — twelve controls over
 * six dimensions is not a table anybody wants to build or ship. So the
 * per-complex series is one fetched file (public/data/bi/slice.json, 45 KB
 * brotli) and the arithmetic happens here. Nothing about that counts against
 * the route's first-paint budget, which is the only reason this fits on a
 * site whose entire route JavaScript allowance is 11 KB.
 *
 * WITHOUT JAVASCRIPT the server-rendered fallback stays: the headline
 * figures for the whole window, and the table of the largest accounts. The
 * page says the controls need a script rather than showing dead selects,
 * because a filter that silently does nothing is worse than an absent one.
 */

/* ---- the shape of the fetched slice -------------------------------- */

type District = { c: string; s: number; n: string; a: number }
type Complex = {
  i: string
  n: string
  /** District index. */ d: number
  /** Tier index. */ t: number
  h: number
  y: number | null
  /** 1 when the household estimate was validated against filed buildings. */
  b: 0 | 1
  /** 1 = 자치, 0 = 위탁. Invented. */ g: 0 | 1
  /** Rep index. */ r: number
  /** First month index this complex billed. */ f: number
  /** Subscription, run-length encoded as [value, months]. */ s: [number, number][]
  u: number[]
  /** Contracts as [service, from, to]; -1 is before the window, m is open. */
  k: [number, number, number][]
}
type Slice = {
  w: { f: string; t: string }
  m: string[]
  sd: string[]
  dt: District[]
  tr: string[]
  sv: string[]
  rp: string[]
  ad: number
  cx: Complex[]
}

export type BiLabels = {
  readonly synthetic: string
  readonly loading: string
  readonly failed: string
  readonly needsScript: string
  readonly filters: string
  readonly range: string
  readonly presetAll: string
  readonly preset12: string
  readonly preset6: string
  readonly preset3: string
  readonly from: string
  readonly to: string
  readonly sido: string
  readonly tier: string
  readonly mgmt: string
  readonly mgmtDelegated: string
  readonly mgmtSelf: string
  readonly service: string
  readonly search: string
  readonly searchHint: string
  readonly reset: string
  readonly any: string
  readonly matched: string
  readonly matchedNone: string
  readonly kpiMrr: string
  readonly kpiGrowth: string
  readonly kpiComplexes: string
  readonly kpiArpu: string
  readonly kpiUsage: string
  readonly kpiChurn: string
  readonly deltaTitle: string
  readonly legendPrev: string
  readonly chipClear: string
  readonly chartSeries: string
  readonly chartSeriesNote: string
  readonly legendSub: string
  readonly legendUsage: string
  readonly chartService: string
  readonly chartTier: string
  readonly chartSido: string
  readonly tableTitle: string
  readonly tableMore: string
  readonly colName: string
  readonly colDistrict: string
  readonly colTier: string
  readonly colHouseholds: string
  readonly colMgmt: string
  readonly colServices: string
  readonly colMrr: string
  readonly colUsage: string
  readonly estimated: string
  readonly services: Readonly<Record<string, string>>
  readonly tiers: Readonly<Record<string, string>>
}

/* ---- small helpers ------------------------------------------------- */

const KRW = (v: number) =>
  v >= 100000000
    ? `${Math.round(v / 10000000) / 10}억`
    : v >= 10000
      ? `${Math.round(v / 10000).toLocaleString('en-US')}만`
      : Math.round(v).toLocaleString('en-US')
const NUM = (v: number) => Math.round(v).toLocaleString('en-US')
const PCT = (v: number) => `${Math.round(v * 10) / 10}%`
const ym = (s: string) => `${s.slice(2, 4)}.${s.slice(4)}`

/** RLE back to a dense array. Done once per complex, not per render. */
function expand(pairs: [number, number][]): number[] {
  const out: number[] = []
  for (const [v, n] of pairs) for (let i = 0; i < n; i++) out.push(v)
  return out
}

type Row = Complex & { sub: number[] }

/* ---- the board ----------------------------------------------------- */

export function BiDashboard({ labels: d, src }: { labels: BiLabels; src: string }) {
  const [slice, setSlice] = useState<Slice | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    fetch(src)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Slice) => { if (live) setSlice(j) })
      .catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [src])

  /* Filter state. `to` and `from` are month indices; -1 on tier/sido/etc is
     "any", which keeps every control a single number and the reset trivial. */
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(-1)
  const [sido, setSido] = useState(-1)
  const [tier, setTier] = useState(-1)
  const [mgmt, setMgmt] = useState(-1)
  const [svc, setSvc] = useState(-1)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'mrr' | 'hh' | 'name'>('mrr')

  const rows = useMemo<Row[]>(
    () => (slice ? slice.cx.map((c) => ({ ...c, sub: expand(c.s) })) : []),
    [slice],
  )

  const T = slice?.m.length ?? 0
  const hi = to < 0 ? T - 1 : Math.min(to, T - 1)
  const lo = Math.min(from, hi)

  const reset = () => {
    setFrom(0); setTo(-1); setSido(-1); setTier(-1); setMgmt(-1); setSvc(-1); setQ('')
  }

  /* ---- the slice ---------------------------------------------------- */

  const matched = useMemo(() => {
    if (!slice) return []
    const needle = q.trim().toLowerCase()
    return rows.filter((c) => {
      const home = slice.dt[c.d]
      if (!home) return false
      if (sido >= 0 && home.s !== sido) return false
      if (tier >= 0 && c.t !== tier) return false
      if (mgmt >= 0 && c.g !== mgmt) return false
      if (needle && !c.n.toLowerCase().includes(needle) && !home.n.toLowerCase().includes(needle)) {
        return false
      }
      /* A service filter asks "held at any point IN THE RANGE", not "holds
         today" — otherwise narrowing the range to a past quarter would
         return nothing for a service every account has since dropped. */
      if (svc >= 0) {
        const held = c.k.some(([s, a, b]) => s === svc && a <= hi && (b < 0 ? true : b > lo))
        if (!held) return false
      }
      /* And it has to have billed something inside the range. */
      for (let m = lo; m <= hi; m++) {
        const at = m - c.f
        if (at >= 0 && at < c.sub.length && (c.sub[at]! > 0 || (c.u[at] ?? 0) > 0)) return true
      }
      return false
    })
  }, [rows, slice, sido, tier, mgmt, svc, q, lo, hi])

  /* ---- aggregates over the slice ----------------------------------- */

  const agg = useMemo(() => {
    const n = hi - lo + 1
    const sub = new Array(n).fill(0)
    const use = new Array(n).fill(0)
    const live = new Array(n).fill(0)
    for (const c of matched) {
      for (let m = lo; m <= hi; m++) {
        const at = m - c.f
        if (at < 0 || at >= c.sub.length) continue
        const s = c.sub[at]!
        const u = c.u[at] ?? 0
        if (s === 0 && u === 0) continue
        sub[m - lo] += s
        use[m - lo] += u
        live[m - lo] += 1
      }
    }
    /* Households and departures per month, so every tile can carry its own
       shape rather than a single number. `gone` counts accounts that billed
       last month and not this one — churn inside the filtered set. */
    const hh = new Array(n).fill(0)
    const gone = new Array(n).fill(0)
    for (const c of matched) {
      for (let m = lo; m <= hi; m++) {
        const at = m - c.f
        const on = at >= 0 && at < c.sub.length && (c.sub[at]! > 0 || (c.u[at] ?? 0) > 0)
        if (on) hh[m - lo] += c.h
        const was = m - 1 - c.f
        const before = was >= 0 && was < c.sub.length && (c.sub[was]! > 0 || (c.u[was] ?? 0) > 0)
        if (before && !on && m > lo) gone[m - lo] += 1
      }
    }
    const arpu = sub.map((v, i) => (hh[i] > 0 ? v / hh[i] : 0))
    const share = sub.map((v, i) => (v + use[i] > 0 ? (use[i] / (v + use[i])) * 100 : 0))
    return { n, sub, use, live, hh, gone, arpu, share }
  }, [matched, lo, hi])

  /**
   * The same complexes, the window before this one.
   *
   * Every delta on this page is like-for-like: the previous period is scored
   * over the CURRENT filter's complexes, not over whoever happened to match
   * back then. Re-filtering would mix a change in the business with a change
   * in the composition of the set, which is the same error
   * scripts/build-prices.mjs refuses when it pairs complexes instead of
   * comparing medians. Null when there is not a full window behind this one —
   * a partial comparison is worse than none.
   */
  const prev = useMemo(() => {
    const n = hi - lo + 1
    const plo = lo - n
    if (plo < 0) return null
    const sub = new Array(n).fill(0)
    const use = new Array(n).fill(0)
    const live = new Array(n).fill(0)
    const hh = new Array(n).fill(0)
    for (const c of matched) {
      for (let m = plo; m < lo; m++) {
        const at = m - c.f
        if (at < 0 || at >= c.sub.length) continue
        const sv = c.sub[at]!
        const uv = c.u[at] ?? 0
        if (sv === 0 && uv === 0) continue
        sub[m - plo] += sv
        use[m - plo] += uv
        live[m - plo] += 1
        hh[m - plo] += c.h
      }
    }
    const last = n - 1
    return {
      sub,
      endSub: sub[last] ?? 0,
      endLive: live[last] ?? 0,
      arpu: (hh[last] ?? 0) > 0 ? (sub[last] ?? 0) / hh[last]! : 0,
      share: (sub[last] ?? 0) + (use[last] ?? 0) > 0 ? ((use[last] ?? 0) / ((sub[last] ?? 0) + (use[last] ?? 0))) * 100 : 0,
      gone: 0,
    }
  }, [matched, lo, hi])

  const byService = useMemo(() => {
    if (!slice) return []
    return slice.sv
      .map((id, s) => ({
        id,
        n: matched.filter((c) => c.k.some(([k, a, b]) => k === s && a <= hi && (b < 0 ? true : b > lo))).length,
      }))
      .sort((a, b) => b.n - a.n)
  }, [slice, matched, lo, hi])

  const byTier = useMemo(() => {
    if (!slice) return []
    return slice.tr.map((id, t) => {
      const list = matched.filter((c) => c.t === t)
      const rev = list.reduce((sum, c) => {
        const at = hi - c.f
        return at >= 0 && at < c.sub.length ? sum + c.sub[at]! : sum
      }, 0)
      const hh = list.reduce((sum, c) => sum + c.h, 0)
      return { id, n: list.length, rev, per: hh > 0 ? rev / hh : 0 }
    })
  }, [slice, matched, hi])

  const bySido = useMemo(() => {
    if (!slice) return []
    const acc = new Map<number, number>()
    for (const c of matched) {
      const home = slice.dt[c.d]
      if (!home) continue
      acc.set(home.s, (acc.get(home.s) ?? 0) + 1)
    }
    return [...acc.entries()]
      .map(([s, n]) => ({ id: slice.sd[s] ?? '', n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 9)
  }, [slice, matched])

  const table = useMemo(() => {
    const withMrr = matched.map((c) => {
      const at = hi - c.f
      const mrr = at >= 0 && at < c.sub.length ? c.sub[at]! : 0
      let usage = 0
      for (let m = lo; m <= hi; m++) {
        const k = m - c.f
        if (k >= 0 && k < c.u.length) usage += c.u[k] ?? 0
      }
      const held = c.k.filter(([, a, b]) => a <= hi && (b < 0 ? true : b > hi)).length
      return { c, mrr, usage, held }
    })
    withMrr.sort((a, b) =>
      sort === 'name'
        ? a.c.n.localeCompare(b.c.n)
        : sort === 'hh'
          ? b.c.h - a.c.h
          : b.mrr - a.mrr,
    )
    return withMrr
  }, [matched, lo, hi, sort])

  /* ---- render ------------------------------------------------------- */

  if (failed) return <p className={cx('small', styles.state)}>{d.failed}</p>
  if (!slice) return <p className={cx('small', 'muted', styles.state)}>{d.loading}</p>

  const months = slice.m.slice(lo, hi + 1)
  const preset = (back: number) => () => { setFrom(Math.max(0, T - back)); setTo(-1) }

  return (
    <div className={styles.board}>
      {/* ---- one filter row, above everything it scopes ------------- */}
      <form
        className={styles.filters}
        aria-label={d.filters}
        onSubmit={(e) => e.preventDefault()}
      >
        <div className={styles.presets} role="group" aria-label={d.range}>
          {([[d.presetAll, T], [d.preset12, 12], [d.preset6, 6], [d.preset3, 3]] as const).map(
            ([text, back]) => {
              const on = lo === Math.max(0, T - back) && to < 0
              return (
                <button
                  key={text}
                  type="button"
                  className={cx('label', styles.preset, on && styles.presetOn)}
                  aria-pressed={on}
                  onClick={preset(back)}
                >
                  {text}
                </button>
              )
            },
          )}
        </div>

        <label className={styles.field}>
          <span className={cx('label', 'muted')}>{d.from}</span>
          <select
            value={lo}
            onChange={(e) => setFrom(Number(e.target.value))}
            className={styles.select}
          >
            {slice.m.map((m, i) => (
              <option key={m} value={i} disabled={i > hi}>{ym(m)}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={cx('label', 'muted')}>{d.to}</span>
          <select
            value={hi}
            onChange={(e) => setTo(Number(e.target.value))}
            className={styles.select}
          >
            {slice.m.map((m, i) => (
              <option key={m} value={i} disabled={i < lo}>{ym(m)}</option>
            ))}
          </select>
        </label>

        <Pick label={d.sido} any={d.any} value={sido} onChange={setSido} options={slice.sd} />
        <Pick
          label={d.tier}
          any={d.any}
          value={tier}
          onChange={setTier}
          options={slice.tr.map((t) => d.tiers[t] ?? t)}
        />
        <Pick
          label={d.mgmt}
          any={d.any}
          value={mgmt}
          onChange={setMgmt}
          options={[d.mgmtDelegated, d.mgmtSelf]}
        />
        <Pick
          label={d.service}
          any={d.any}
          value={svc}
          onChange={setSvc}
          options={slice.sv.map((s) => d.services[s] ?? s)}
        />

        <label className={cx(styles.field, styles.searchField)}>
          <span className={cx('label', 'muted')}>{d.search}</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={d.searchHint}
            className={styles.input}
          />
        </label>

        <button type="button" className={cx('label', styles.reset)} onClick={reset}>
          {d.reset}
        </button>
      </form>

      {/* ---- what is actually applied, and how to drop it ---------- */}
      {/**
        * Six controls is enough that a reader loses track of what is on. A
        * chip per active filter says the state in one line and clears that
        * one filter on click — the row of selects can say what a filter IS
        * but not, at a glance, which ones are doing anything.
        *
        * The range is deliberately not a chip. It is always set to something,
        * so a chip for it would never be dismissable and would only ever add
        * a permanent object to a row whose whole job is to be empty when
        * nothing is applied.
        */}
      {(() => {
        const chips: { key: string; text: string; clear: () => void }[] = []
        if (sido >= 0) chips.push({ key: 's', text: slice.sd[sido] ?? '', clear: () => setSido(-1) })
        if (tier >= 0) {
          const id = slice.tr[tier] ?? ''
          chips.push({ key: 't', text: d.tiers[id] ?? id, clear: () => setTier(-1) })
        }
        if (mgmt >= 0) {
          chips.push({ key: 'm', text: mgmt === 1 ? d.mgmtSelf : d.mgmtDelegated, clear: () => setMgmt(-1) })
        }
        if (svc >= 0) {
          const id = slice.sv[svc] ?? ''
          chips.push({ key: 'v', text: d.services[id] ?? id, clear: () => setSvc(-1) })
        }
        if (q.trim()) chips.push({ key: 'q', text: `“${q.trim()}”`, clear: () => setQ('') })
        if (!chips.length) return null
        return (
          <ul className={styles.chips} aria-label={d.filters}>
            {chips.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  className={cx('label', styles.chip)}
                  onClick={c.clear}
                  aria-label={`${d.chipClear} ${c.text}`}
                >
                  {c.text}
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        )
      })()}

      <p className={cx('small', styles.matched)} role="status">
        {matched.length > 0
          ? d.matched
              .replace('{n}', NUM(matched.length))
              .replace('{total}', NUM(slice.cx.length))
              .replace('{from}', ym(slice.m[lo]!))
              .replace('{to}', ym(slice.m[hi]!))
          : d.matchedNone}
      </p>

      {matched.length === 0 ? null : (
        <>
          {/* ---- the readout: one hero, four beside it --------------- */}
          {/**
            * NOT FIVE EQUAL TILES, which is what this was and what made it
            * read as a report rather than an instrument. A dashboard is
            * scanned, and scanning needs somewhere to land first — so MRR is
            * large, wears the accent as letters, and carries its own 36-point
            * shape; the other four sit beside it at a size that says
            * "secondary" without saying it in words.
            *
            * EVERY TILE HAS A SPARKLINE AND A DELTA. A number alone answers
            * "how much" and nothing else; the same number with its own trend
            * beside it answers "and is that unusual", which is the question
            * somebody actually opened this page with.
            */}
          <div className={styles.readoutGrid}>
            <Tile
              lead
              term={d.kpiMrr}
              value={KRW(agg.sub[agg.n - 1] ?? 0)}
              series={agg.sub}
              now={agg.sub[agg.n - 1] ?? 0}
              was={prev?.endSub}
              labels={d}
            />
            <div className={styles.tileGrid}>
              <Tile
                term={d.kpiComplexes}
                value={NUM(agg.live[agg.n - 1] ?? 0)}
                series={agg.live}
                now={agg.live[agg.n - 1] ?? 0}
                was={prev?.endLive}
                labels={d}
              />
              <Tile
                term={d.kpiArpu}
                value={`${NUM(agg.arpu[agg.n - 1] ?? 0)}원`}
                series={agg.arpu}
                now={agg.arpu[agg.n - 1] ?? 0}
                was={prev?.arpu}
                labels={d}
              />
              <Tile
                term={d.kpiUsage}
                value={PCT(agg.share[agg.n - 1] ?? 0)}
                series={agg.share}
                now={agg.share[agg.n - 1] ?? 0}
                was={prev?.share}
                labels={d}
              />
              <Tile
                term={d.kpiChurn}
                value={NUM(agg.gone.reduce((t, v) => t + v, 0))}
                series={agg.gone}
                labels={d}
                /* Departures have no like-for-like previous figure: the
                   comparison window is scored over complexes the current
                   filter selected, and a complex that left before the window
                   is not in that set. A delta here would be an artefact. */
              />
            </div>
          </div>

          <Series
            labels={d}
            months={months}
            sub={agg.sub}
            use={agg.use}
            ghost={prev?.sub}
          />

          <div className={styles.trio}>
            <Bars
              title={d.chartService}
              rows={byService.map((r) => ({
                key: r.id,
                name: d.services[r.id] ?? r.id,
                value: r.n,
                text: `${NUM(r.n)} · ${PCT((r.n / matched.length) * 100)}`,
              }))}
            />
            <Bars
              title={d.chartTier}
              rows={byTier.map((r) => ({
                key: r.id,
                name: d.tiers[r.id] ?? r.id,
                value: r.n,
                text: `${NUM(r.n)} · ${NUM(r.per)}원/세대`,
              }))}
            />
            <Bars
              title={d.chartSido}
              rows={bySido.map((r) => ({ key: r.id, name: r.id, value: r.n, text: NUM(r.n) }))}
            />
          </div>

          {/* ---- the table. the reason this page exists ------------ */}
          <section className={styles.tableBlock} aria-labelledby="bi-table">
            <h2 id="bi-table" className={cx('label', styles.blockTitle)}>
              {d.tableTitle}
            </h2>
            <div className={styles.tableScroll}>
              <table className={cx('small', styles.table)}>
                <thead>
                  <tr>
                    <th scope="col">
                      <button
                        type="button"
                        className={styles.sortBtn}
                        aria-pressed={sort === 'name'}
                        onClick={() => setSort('name')}
                      >
                        {d.colName}
                      </button>
                    </th>
                    <th scope="col">{d.colDistrict}</th>
                    <th scope="col">{d.colTier}</th>
                    <th scope="col" className={styles.num}>
                      <button
                        type="button"
                        className={styles.sortBtn}
                        aria-pressed={sort === 'hh'}
                        onClick={() => setSort('hh')}
                      >
                        {d.colHouseholds}
                      </button>
                    </th>
                    <th scope="col">{d.colMgmt}</th>
                    <th scope="col" className={styles.num}>{d.colServices}</th>
                    <th scope="col" className={styles.num}>
                      <button
                        type="button"
                        className={styles.sortBtn}
                        aria-pressed={sort === 'mrr'}
                        onClick={() => setSort('mrr')}
                      >
                        {d.colMrr}
                      </button>
                    </th>
                    <th scope="col" className={styles.num}>{d.colUsage}</th>
                  </tr>
                </thead>
                <tbody>
                  {table.slice(0, 60).map(({ c, mrr, usage, held }) => (
                    <tr key={c.i}>
                      {/* The name is the one untrusted string on this page —
                          it came out of a filing. React escapes it; it is
                          never concatenated into markup. */}
                      <th scope="row" className={styles.nameCell}>{c.n}</th>
                      <td>{slice.dt[c.d]?.n}</td>
                      <td>{d.tiers[slice.tr[c.t] ?? ''] ?? ''}</td>
                      <td className={styles.num}>
                        {NUM(c.h)}
                        {c.b === 0 ? <abbr title={d.estimated}>*</abbr> : null}
                      </td>
                      <td>{c.g === 1 ? d.mgmtSelf : d.mgmtDelegated}</td>
                      <td className={styles.num}>{held}</td>
                      <td className={styles.num}>{NUM(mrr)}</td>
                      <td className={styles.num}>{NUM(usage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {table.length > 60 ? (
              <p className={cx('label', 'muted', styles.foot)}>
                {d.tableMore.replace('{n}', NUM(table.length - 60))}
              </p>
            ) : null}
            <p className={cx('label', 'muted', styles.foot)}>* {d.estimated}</p>
          </section>
        </>
      )}

      <p className={cx('small', 'muted', styles.foot)}>{d.synthetic}</p>
    </div>
  )
}

/* ---- controls and figures ------------------------------------------ */

function Pick({
  label, any, value, onChange, options,
}: {
  label: string
  any: string
  value: number
  onChange: (v: number) => void
  options: readonly string[]
}) {
  return (
    <label className={styles.field}>
      <span className={cx('label', 'muted')}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.select}
      >
        <option value={-1}>{any}</option>
        {options.map((o, i) => (
          <option key={o} value={i}>{o}</option>
        ))}
      </select>
    </label>
  )
}

/**
 * A figure, its own shape, and what it was.
 *
 * The sparkline is a path and nothing else — no axis, no labels, no
 * interaction. At this size a tick would be noise and a tooltip would
 * compete with the chart below it, which carries the same series properly.
 * What it is for is the one question a bare number cannot answer: whether
 * the value arrived smoothly or jumped.
 */
function Tile({
  term, value, series, now, was, lead, labels: d,
}: {
  term: string
  value: string
  series: readonly number[]
  now?: number
  was?: number
  lead?: boolean
  labels: BiLabels
}) {
  const delta = now !== undefined && was !== undefined && was !== 0
    ? ((now - was) / was) * 100
    : null
  return (
    <div className={cx(styles.tile, lead && styles.tileLead)}>
      <dt className={cx('label', 'muted', styles.tileTerm)}>{term}</dt>
      <dd className={styles.tileBody}>
        <span className={styles.tileValue}>{value}</span>
        {delta === null ? null : (
          <span
            className={cx('label', styles.delta, delta < 0 && styles.deltaDown)}
            title={d.deltaTitle}
          >
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '·'}
            {Math.abs(Math.round(delta * 10) / 10)}%
          </span>
        )}
      </dd>
      <Spark values={series} tall={lead} />
    </div>
  )
}

function Spark({ values, tall }: { values: readonly number[]; tall?: boolean }) {
  const n = values.length
  if (n < 2) return null
  const w = 100
  const h = tall ? 28 : 18
  const top = Math.max(...values)
  const bottom = Math.min(0, ...values)
  const span = top - bottom || 1
  const x = (i: number) => (i / (n - 1)) * w
  const y = (v: number) => h - ((v - bottom) / span) * h
  const line = values.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  return (
    <svg
      className={styles.spark}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={`${line} L ${w} ${h} L 0 ${h} Z`} className={styles.sparkFill} />
      <path d={line} className={styles.sparkLine} />
    </svg>
  )
}

const W = 720
const H = 200
const PAD = { t: 12, r: 10, b: 24, l: 10 }

/**
 * Subscription as a step, usage as a line, one x-axis and one y-scale.
 *
 * NOT TWO Y-SCALES. Usage is a few per cent of subscription, so a second
 * axis would inflate it to the same height and invent a correlation. It is
 * drawn against the same scale and is therefore SMALL — which is the true
 * shape, and the tile above says the share as a number for anyone who wants
 * it larger than three pixels.
 *
 * The crosshair snaps to the nearest month, so the reader aims at a date
 * rather than at a two-pixel line, and the readout lists both series at that
 * date — the pointer never has to land on a mark to get a value.
 */
function Series({
  labels: d, months, sub, use, ghost,
}: {
  labels: BiLabels
  months: string[]
  sub: number[]
  use: number[]
  /** The same complexes over the preceding window, or undefined. */
  ghost?: readonly number[]
}) {
  const [at, setAt] = useState<number | null>(null)
  const box = useRef<SVGSVGElement>(null)
  const n = months.length
  const pw = W - PAD.l - PAD.r
  const ph = H - PAD.t - PAD.b
  const top = Math.max(1, ...sub, ...use, ...(ghost ?? []))
  const bw = pw / n
  const x = (i: number) => PAD.l + i * bw
  const y = (v: number) => PAD.t + ph * (1 - v / top)

  const step: string[] = [`M ${PAD.l} ${y(sub[0] ?? 0)}`]
  for (let i = 0; i < n; i++) {
    step.push(`L ${(x(i) + bw).toFixed(1)} ${y(sub[i] ?? 0).toFixed(1)}`)
    if (i + 1 < n) step.push(`L ${(x(i) + bw).toFixed(1)} ${y(sub[i + 1] ?? 0).toFixed(1)}`)
  }
  const line = step.join(' ')
  const useLine = use
    .map((v, i) => `${i ? 'L' : 'M'} ${(x(i) + bw / 2).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(' ')

  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    const i = Math.floor(((clientX - r.left) / r.width) * W - PAD.l) / bw
    setAt(Math.max(0, Math.min(n - 1, Math.floor(i))))
  }

  const tickEvery = Math.max(1, Math.ceil(n / 7))

  return (
    <section className={styles.seriesBlock} aria-labelledby="bi-series">
      <h2 id="bi-series" className={cx('label', styles.blockTitle)}>{d.chartSeries}</h2>
      <p className={cx('small', 'muted', styles.blockNote)}>{d.chartSeriesNote}</p>
      <ul className={cx('label', styles.legend)}>
        <li><span className={cx(styles.key, styles.keySub)} />{d.legendSub}</li>
        <li><span className={cx(styles.key, styles.keyUse)} />{d.legendUsage}</li>
        {ghost ? (
          <li><span className={cx(styles.key, styles.keyGhost)} />{d.legendPrev}</li>
        ) : null}
      </ul>
      <svg
        ref={box}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={`${d.chartSeries} ${months[0]} – ${months[n - 1]}`}
        onPointerMove={(e) => move(e.clientX)}
        onPointerLeave={() => setAt(null)}
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            className={styles.gridline}
            x1={PAD.l}
            y1={y(top * f)}
            x2={W - PAD.r}
            y2={y(top * f)}
          />
        ))}
        {/* The preceding window, behind. Dashed and dim so it reads as a
            reference rather than a second measurement — and drawn first, so
            the current series is never obscured by its own history. */}
        {ghost && ghost.length === n ? (
          <path
            className={styles.ghostLine}
            d={ghost
              .map((v, i) => `${i ? 'L' : 'M'} ${(x(i) + bw / 2).toFixed(1)} ${y(v).toFixed(1)}`)
              .join(' ')}
          />
        ) : null}
        <path className={styles.subFill} d={`${line} L ${W - PAD.r} ${PAD.t + ph} L ${PAD.l} ${PAD.t + ph} Z`} />
        <path className={styles.subLine} d={line} />
        <path className={styles.useLine} d={useLine} />
        {at !== null ? (
          <>
            <line
              className={styles.cross}
              x1={x(at) + bw / 2}
              y1={PAD.t}
              x2={x(at) + bw / 2}
              y2={PAD.t + ph}
            />
            <circle className={styles.dotSub} cx={x(at) + bw / 2} cy={y(sub[at] ?? 0)} r={4} />
            <circle className={styles.dotUse} cx={x(at) + bw / 2} cy={y(use[at] ?? 0)} r={4} />
          </>
        ) : null}
        {months.map((m, i) =>
          i % tickEvery === 0 || i === n - 1 ? (
            <text
              key={m}
              className={styles.tick}
              x={x(i) + bw / 2}
              y={H - 8}
              textAnchor="middle"
            >
              {ym(m)}
            </text>
          ) : null,
        )}
        <text className={styles.tick} x={PAD.l} y={PAD.t + 8} textAnchor="start">
          {KRW(top)}
        </text>
      </svg>
      {/* The readout is text, outside the SVG, so it is selectable and
          reachable by a screen reader as a live region. */}
      <p className={cx('small', styles.readout)} role="status">
        {at === null
          ? ' '
          : `${months[at]} · ${d.legendSub} ${NUM(sub[at] ?? 0)}원 · ${d.legendUsage} ${NUM(use[at] ?? 0)}원`}
      </p>
    </section>
  )
}

/**
 * One series, one colour, ordered bars.
 *
 * Colouring each bar by its own length would double-encode what the length
 * already says and spend the only free channel on nothing. Values are direct
 * labelled because there are never more than eleven rows.
 */
function Bars({
  title, rows,
}: {
  title: string
  rows: readonly { key: string; name: string; value: number; text: string }[]
}) {
  const top = Math.max(1, ...rows.map((r) => r.value))
  return (
    <section className={styles.barsBlock}>
      <h2 className={cx('label', styles.blockTitle)}>{title}</h2>
      <ol className={styles.bars}>
        {rows.map((r) => (
          <li key={r.key} className={styles.bar}>
            <span className={cx('label', styles.barName)}>{r.name}</span>
            <span className={styles.barTrack}>
              <span
                className={styles.barFill}
                style={{ width: `${Math.max(1, (r.value / top) * 100)}%` }}
              />
            </span>
            <span className={cx('label', 'muted', styles.barValue)}>{r.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
