'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { cx } from '@/lib/cx'
import styles from './UmdDrill.module.css'

type Cell = { n: string; o: number; y: number; x: number }
type Grid = { r: number; c: number; cells: Cell[] }
type State =
  | { at: 'idle' }
  | { at: 'loading'; sgg: string; name: string }
  | { at: 'ready'; sgg: string; name: string; grid: Grid }
  | { at: 'error'; sgg: string; name: string }

/**
 * Click a district, get its 읍면동 grid on the same page.
 *
 * WHY NOT A ROUTE PER DISTRICT, which is where this started: measured, all
 * 215 grids inlined would be 32.8 KB gzip of markup and about as much again
 * as serialized tree, on a page already at 28.3 KB. One district is 221
 * bytes at the median. Between "too big to inline" and "too small to
 * deserve 430 pages" there was a third option — the grids are static JSON
 * under public/, and this fetches the one that was clicked.
 *
 * THE MAP STAYS ON THE SERVER. It arrives as `children`, already built into
 * strings at build time; what hydrates is this component's own listener and
 * the panel it renders. Nothing about the 245 national hexagons crosses to
 * the client.
 *
 * THE SCALE IS LOGARITHMIC, and that was the second attempt. Linear on
 * `offices / max` drew 서울 중구 as fifty-nine cells of one colour and one
 * bright one: 신당동 has 196 offices and nothing else in the district passes
 * 52, so everything but the outlier collapsed into the bottom class. It is
 * the same failure the national map had with quantiles — one district
 * owning the top of the range — and 215 grids at a median of twelve cells
 * are too small to fit natural breaks to individually.
 *
 * A log scale needs no per-district fitting, so all 215 are treated
 * identically, and it keeps magnitude meaning: a brighter cell really does
 * have more offices, not merely a higher rank. What it costs is that equal
 * colour steps are equal RATIOS — the distance from 2 to 5 looks like the
 * distance from 50 to 125. The count is on every tooltip and the top three
 * are named, because a scale like that has to be readable as a number.
 *
 * THE SCALE IS ALSO RELATIVE TO THE DISTRICT, and that is a real limitation
 * rather than an oversight. 읍면동 office counts run from 1 to a couple of
 * hundred; a national scale would leave every rural 동 the same black. So
 * the brightest cell is the busiest 동 IN THAT DISTRICT, and two districts'
 * colours cannot be compared with each other. The count is on every cell's
 * tooltip and the top three are named in the caption, because a colour that
 * only means something locally has to be readable as a number.
 *
 * WITHOUT JAVASCRIPT nothing happens on click. The page says so, and the
 * list underneath it — server-rendered — carries the same districts.
 */

/* The national map's geometry, so the child grid is visibly the same kind of
   picture rather than a different chart that happens to use hexagons. */
const STEP_X = 30
const STEP_Y = 26
const R = STEP_X / Math.sqrt(3)
const CLASSES = 6

const hexPath = (() => {
  const a = Math.round((R * Math.sqrt(3)) / 2 * 10) / 10
  const h = Math.round((R / 2) * 10) / 10
  const r = Math.round(R * 10) / 10
  return `M0 ${-r}L${a} ${-h}L${a} ${h}L0 ${r}L${-a} ${h}L${-a} ${-h}Z`
})()

export function UmdDrill({
  children,
  labels,
}: {
  children: ReactNode
  labels: {
    /** Carries `{name}`. */
    prompt: string
    loading: string
    error: string
    /** Carries `{name}`, `{cells}`, `{offices}`. */
    caption: string
    /** Carries `{top}` — the three busiest, already formatted. */
    top: string
    close: string
    unit: string
    relative: string
  }
}) {
  const [state, setState] = useState<State>({ at: 'idle' })
  const cache = useRef(new Map<string, Grid>())
  const box = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  /* On a narrow screen the panel is under a map nine hundred pixels tall, so
     opening it without moving the viewport looks like nothing happened. Only
     when it is NOT sticky beside the map — otherwise scrolling away from the
     country the reader is choosing from would be the rude thing. */
  useEffect(() => {
    if (state.at !== 'ready') return
    const el = panel.current
    if (!el || window.matchMedia('(min-width: 64rem)').matches) return
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [state])

  const open = useCallback(async (sgg: string, name: string) => {
    const had = cache.current.get(sgg)
    if (had) {
      setState({ at: 'ready', sgg, name, grid: had })
      return
    }
    setState({ at: 'loading', sgg, name })
    try {
      const res = await fetch(`/data/umd/${sgg}.json`)
      if (!res.ok) throw new Error(String(res.status))
      const grid: Grid = await res.json()
      cache.current.set(sgg, grid)
      setState({ at: 'ready', sgg, name, grid })
    } catch {
      setState({ at: 'error', sgg, name })
    }
  }, [])

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    const cell = (e.target as Element).closest<SVGElement>('use[data-sgg]')
    if (!cell) return
    const sgg = cell.dataset['sgg']
    if (!sgg) return
    e.preventDefault()
    /* The district's own label, read off the markup rather than shipped
       again as a 215-entry lookup. */
    const name = cell.querySelector('title')?.textContent?.split('·')[0]?.trim() ?? sgg
    void open(sgg, name)
    if (typeof history !== 'undefined') {
      history.replaceState(null, '', `#d=${sgg}`)
    }
  }

  /* A shared link opens the district it names. Read once, on mount: this is
     a convenience for a copied URL, not a router. */
  useEffect(() => {
    const m = /^#d=(\d{5})$/.exec(window.location.hash)
    if (!m) return
    const cell = box.current?.querySelector<SVGElement>(`use[data-sgg="${m[1]}"]`)
    const name = cell?.querySelector('title')?.textContent?.split('·')[0]?.trim() ?? m[1]!
    void open(m[1]!, name)
  }, [open])

  const grid = state.at === 'ready' ? state.grid : null
  const max = grid ? Math.max(...grid.cells.map((c) => c.o)) : 1
  const span = Math.log(max)
  /* Every 동 the same count leaves no scale to draw — say "all equal" with
     one colour rather than dividing by zero. */
  const classOf = (o: number) =>
    span <= 0
      ? CLASSES - 1
      : Math.min(CLASSES - 1, Math.max(0, Math.floor((Math.log(o) / span) * CLASSES)))
  const width = grid ? Math.round((grid.c + 0.5) * STEP_X + 2) : 0
  const height = grid ? Math.round((grid.r - 1) * STEP_Y + R * 2 + 2) : 0
  const top = grid
    ? [...grid.cells]
        .sort((a, b) => b.o - a.o)
        .slice(0, 3)
        .map((c) => `${c.n} ${c.o}${labels.unit}`)
        .join(' · ')
    : ''

  return (
    <div ref={box} className={styles.frame} onClick={onClick}>
      {children}

      {state.at !== 'idle' && (
        <div ref={panel} className={styles.panel} aria-live="polite">
          <div className={styles.head}>
            <p className={cx('label', styles.name)}>{state.name}</p>
            <button type="button" className={cx('label', styles.close)} onClick={() => setState({ at: 'idle' })}>
              {labels.close}
            </button>
          </div>

          {state.at === 'loading' && <p className={cx('small', 'muted')}>{labels.loading}</p>}
          {state.at === 'error' && <p className={cx('small', 'muted')}>{labels.error}</p>}

          {grid && (
            <>
              <div className={styles.mapBox}>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className={styles.svg}
                /* The grid's shape, handed to CSS so one hexagon can be a
                   fixed size instead of the whole map being one. */
                style={{ '--umd-cols': grid.c } as React.CSSProperties}
                role="img"
                aria-label={labels.caption
                  .replace('{name}', state.name)
                  .replace('{cells}', String(grid.cells.length))
                  .replace('{offices}', String(grid.cells.reduce((a, c) => a + c.o, 0)))}
              >
                <defs>
                  <path id="u" d={hexPath} />
                </defs>
                <g className={styles.cells}>
                  {grid.cells.map((c) => (
                    <use
                      key={c.n + c.y + c.x}
                      href="#u"
                      x={Math.round(c.x * STEP_X + (c.y % 2 ? STEP_X / 2 : 0) + STEP_X / 2 + 1)}
                      y={Math.round(c.y * STEP_Y + Math.ceil(R) + 1)}
                      className={styles[`s${classOf(c.o)}`]}
                    >
                      <title>
                        {c.n} · {c.o}
                        {labels.unit}
                      </title>
                    </use>
                  ))}
                </g>
              </svg>
              </div>

              <p className={cx('small', 'muted', styles.caption)}>
                {labels.caption
                  .replace('{name}', state.name)
                  .replace('{cells}', String(grid.cells.length))
                  .replace('{offices}', grid.cells.reduce((a, c) => a + c.o, 0).toLocaleString('en-US'))}
              </p>
              <p className={cx('small', styles.top)}>{labels.top.replace('{top}', top)}</p>
              <p className={cx('label', 'muted', styles.relative)}>{labels.relative}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
