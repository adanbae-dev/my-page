'use client'

import { useRef, useState, type ReactNode } from 'react'

import { cx } from '@/lib/cx'

import styles from './HexTip.module.css'

type Tip = { x: number; y: number; name: string; rate: string; brokers: string; pop: string }

/**
 * The popup that follows the pointer over the district map.
 *
 * THE MAP ITSELF STAYS ON THE SERVER. This component wraps it and never
 * renders it: the hexagons arrive as `children`, already built into strings
 * at build time, and the only thing that hydrates is one empty div and two
 * listeners. That is the whole reason the tooltip is a component and not a
 * client-rendered chart — 245 hexagons through the client would cost the
 * route's entire JavaScript allowance, and they never change.
 *
 * IT READS THE MARKUP RATHER THAN A SECOND COPY OF THE DATA. Every hexagon
 * already carries a `<title>` — that is what a pointer gets with JavaScript
 * off, and it is the only text this page can offer a mouse in that state.
 * The popup takes the name and the rate straight out of it, and takes the
 * two raw counts from one `data-n`. Shipping the strings again in a props
 * object would be the same numbers a third time.
 *
 * The `<title>` is REMOVED the first time a hexagon is hovered, because the
 * browser would otherwise draw its own tooltip on top of this one a second
 * later. Removing it is safe: React does not reconcile inside
 * `dangerouslySetInnerHTML`, and the text is kept on the element first.
 */
export function HexTip({
  children,
  labels,
}: {
  children: ReactNode
  labels: { rate: string; offices: string; people: string }
}) {
  const box = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<Tip | null>(null)

  function read(el: Element): { name: string; rate: string } | null {
    const cached = (el as HTMLElement).dataset['t']
    if (cached) {
      const i = cached.lastIndexOf('·')
      return { name: cached.slice(0, i).trim(), rate: cached.slice(i + 1).trim() }
    }
    const title = el.querySelector('title')
    if (!title?.textContent) return null
    const text = title.textContent
    ;(el as HTMLElement).dataset['t'] = text
    title.remove()
    const i = text.lastIndexOf('·')
    return { name: text.slice(0, i).trim(), rate: text.slice(i + 1).trim() }
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const cell = (e.target as Element).closest('use[data-n]')
    const frame = box.current
    if (!cell || !frame) {
      setTip(null)
      return
    }
    const text = read(cell)
    if (!text) {
      setTip(null)
      return
    }
    /* One value or two. The brokerage map hands over offices and residents;
       the price map has only a pair count, and rendering a second line as
       "0" would have invented a number. */
    const parts = ((cell as HTMLElement).dataset['n'] ?? '')
      .split(',')
      .filter((x) => x !== '')
    const [brokers = '', pop = ''] = parts
    const r = frame.getBoundingClientRect()
    setTip({
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      name: text.name,
      rate: text.rate,
      brokers: brokers === '' ? '' : Number(brokers).toLocaleString(),
      pop: pop === '' ? '' : Number(pop).toLocaleString(),
    })
  }

  return (
    <div
      ref={box}
      className={styles.frame}
      onPointerMove={onMove}
      onPointerLeave={() => setTip(null)}
    >
      {children}

      {tip && (
        <div
          className={styles.tip}
          style={{ left: `${tip.x}px`, top: `${tip.y}px` }}
          /* The same facts are already in the list below, and a box that
             chases the pointer is not something a screen reader should be
             asked to follow. */
          aria-hidden="true"
        >
          <span className={styles.name}>{tip.name}</span>
          {/* A diverging map says teal for a fall; a popup that answered in
              accent orange would contradict the cell the pointer is on. The
              brokerage map never produces a negative, so this costs it
              nothing. */}
          <span className={cx(styles.rate, tip.rate.startsWith('-') && styles.negative)}>
            {tip.rate}
            <span className={styles.unit}> {labels.rate}</span>
          </span>
          <span className={styles.counts}>
            {tip.brokers}
            {labels.offices}
            {tip.pop === '' ? '' : ` · ${tip.pop}${labels.people}`}
          </span>
        </div>
      )}
    </div>
  )
}
