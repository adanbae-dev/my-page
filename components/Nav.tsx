'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { cx } from '@/lib/cx'
import { SECTIONS } from '@/lib/sections'
import { site } from '@/lib/site.config'
import type { Tone } from '@/lib/tone'
import styles from './Nav.module.css'

type NavProps = {
  /** Ground to show before any measurement has happened, and forever if JS never runs. */
  initialTone: Tone
}

/**
 * The index bar.
 *
 * Two behaviours, both enhancements on top of markup that already works:
 *
 *   1. It adopts the tone of whatever section is directly beneath it, so one
 *      figure colour and one accent stay legible across the whole inversion.
 *   2. On the golden path it marks which chapter you are standing in.
 *
 * With JavaScript off you still get four labelled links to four real routes
 * on the server-rendered ground. Nothing here is load-bearing for navigation.
 */
export function Nav({ initialTone }: NavProps) {
  const pathname = usePathname()
  const onGoldenPath = pathname === '/'

  const [tone, setTone] = useState<Tone>(initialTone)
  const [active, setActive] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('main [data-tone]'),
    )
    if (sections.length === 0) return

    const navHeight = navRef.current?.getBoundingClientRect().height ?? 0
    const observers: IntersectionObserver[] = []

    // (1) TONE — a 1px band immediately below the bar. Whatever crosses it is
    // what the bar is standing on.
    const band = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const t = (e.target as HTMLElement).dataset['tone']
          if (t === 'light' || t === 'dark') setTone(t)
        }
      },
      {
        rootMargin: `-${Math.round(navHeight)}px 0px -${Math.max(
          0,
          Math.round(window.innerHeight - navHeight - 1),
        )}px 0px`,
      },
    )
    sections.forEach((s) => band.observe(s))
    observers.push(band)

    // (2) ACTIVE CHAPTER — whichever chapter occupies the middle of the screen.
    //
    // An observer callback reports only the entries that CHANGED, and it can
    // report several at once while crossing a boundary. Taking "the last one
    // that said it was intersecting" therefore depends on callback ordering
    // and marks the wrong chapter. Keep the live set instead and resolve it
    // in document order, so entering a chapter wins over leaving one.
    if (onGoldenPath) {
      const inBand = new Set<string>()
      const middle = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const id = e.target.id
            if (!id) continue
            if (e.isIntersecting) inBand.add(id)
            else inBand.delete(id)
          }
          const first = sections.find((s) => s.id && inBand.has(s.id))
          setActive(first?.id ?? null)
        },
        { rootMargin: '-45% 0px -50% 0px' },
      )
      sections.filter((s) => s.id).forEach((s) => middle.observe(s))
      observers.push(middle)
    }

    return () => observers.forEach((o) => o.disconnect())
    // Re-measure when the route changes: a different page has different sections.
  }, [pathname, onGoldenPath])

  const currentId = onGoldenPath ? active : pathname.replace(/^\//, '')

  // An entry page is the only place with enough text for progress to mean
  // anything. `/think` is a list; `/think/slug` is something you read.
  const isReading = pathname.split('/').filter(Boolean).length === 2

  return (
    <nav
      ref={navRef}
      className={styles.nav}
      data-tone={tone}
      aria-label="섹션 색인"
    >
      {/* Reading progress. Driven by the document scroll timeline, so it
          costs no JavaScript, cannot fall behind the scroll, and simply
          does not appear where the browser has no scroll timelines. */}
      {isReading && <div className={styles.progress} aria-hidden="true" />}
      <div className={cx('wrap', styles.inner)}>
        <Link href="/" className={cx('label', styles.brand)}>
          {site.name} <span className={styles.brandSuffix}>· {site.title}</span>
        </Link>

        <ul className={styles.list}>
          {SECTIONS.map((s) => {
            const isCurrent = s.id === currentId
            return (
              <li key={s.id}>
                <Link
                  // On the golden path the bar moves you within the page; from a
                  // depth route it moves you between pages.
                  href={onGoldenPath ? `#${s.id}` : `/${s.id}`}
                  className={cx('label', styles.item)}
                  {...(isCurrent
                    ? { 'aria-current': onGoldenPath ? 'true' : 'page' }
                    : {})}
                >
                  <span className={styles.num}>{s.index}</span>
                  <span className={styles.itemName}>{s.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
