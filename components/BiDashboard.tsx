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
    const endSub = sub[n - 1] ?? 0
    const startSub = sub[0] ?? 0
    const endLive = live[n - 1] ?? 0
    const hhAt = matched.reduce((t, c) => {
      const at = hi - c.f
      return at >= 0 && at < c.sub.length && c.sub[at]! > 0 ? t + c.h : t
    }, 0)
    return {
      n, sub, use, live,
      endSub, endLive,
      growth: startSub > 0 ? ((endSub - startSub) / startSub) * 100 : 0,
      arpu: hhAt > 0 ? endSub / hhAt : 0,
      usageShare: endSub + (use[n - 1] ?? 0) > 0 ? ((use[n - 1] ?? 0) / (endSub + (use[n - 1] ?? 0))) * 100 : 0,
      households: hhAt,
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
          {/* ---- tiles, recomputed --------------------------------- */}
          <dl className={styles.tiles}>
            {(
              [
                [d.kpiMrr, KRW(agg.endSub)],
                [d.kpiGrowth, `${agg.growth > 0 ? '+' : ''}${Math.round(agg.growth * 10) / 10}%`],
                /* NOT the same number as the match count above it, and the
                   labels say so. `matched` is "billed anything at any point
                   in the range"; this is "billing in the range's LAST month".
                   With the full window they differ by about 280 — the
                   accounts that churned somewhere in three years — and two
                   counts on one screen that mean different things have to be
                   named differently or the reader assumes one is wrong. */
                [d.kpiComplexes, NUM(agg.endLive)],
                [d.kpiArpu, `${NUM(agg.arpu)}원`],
                [d.kpiUsage, PCT(agg.usageShare)],
              ] as const
            ).map(([term, value]) => (
              <div key={term} className={styles.tile}>
                <dt className={cx('label', 'muted')}>{term}</dt>
                <dd className={styles.tileValue}>{value}</dd>
              </div>
            ))}
          </dl>

          <Series
            labels={d}
            months={months}
            sub={agg.sub}
            use={agg.use}
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
  labels: d, months, sub, use,
}: {
  labels: BiLabels
  months: string[]
  sub: number[]
  use: number[]
}) {
  const [at, setAt] = useState<number | null>(null)
  const box = useRef<SVGSVGElement>(null)
  const n = months.length
  const pw = W - PAD.l - PAD.r
  const ph = H - PAD.t - PAD.b
  const top = Math.max(1, ...sub, ...use)
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
