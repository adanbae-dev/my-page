'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { cx } from '@/lib/cx'
import {
  localePath,
  LOCALES,
  LOCALE_META,
  splitLocale,
  type Locale,
} from '@/lib/i18n/config'
import { SECTIONS } from '@/lib/sections'
import { site } from '@/lib/site.config'
import type { Tone } from '@/lib/tone'
import styles from './Nav.module.css'

type NavProps = {
  /** Ground to show before any measurement has happened, and forever if JS never runs. */
  initialTone: Tone
  locale: Locale
  /**
   * Strings, not a dictionary.
   *
   * This is a Client Component: it cannot read `next/root-params` and it
   * cannot call `dict()`. Plain strings cross the boundary; anything with a
   * function on it does not.
   */
  labels: {
    navLabel: string
    languageLabel: string
  }
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
export function Nav({ initialTone, locale, labels }: NavProps) {
  const pathname = usePathname()
  // The locale prefix has to come off before any of the path logic below.
  // Without this every check is one segment out: the golden path is `/ko`
  // rather than `/`, the current chapter reads as "ko", and an entry page
  // has three segments instead of two.
  const { rest } = splitLocale(pathname)
  const onGoldenPath = rest === '/'

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

  const currentId = onGoldenPath ? active : rest.replace(/^\//, '')

  // An entry page is the only place with enough text for progress to mean
  // anything. `/think` is a list; `/think/slug` is something you read.
  const isReading = rest.split('/').filter(Boolean).length === 2

  return (
    <nav
      ref={navRef}
      className={styles.nav}
      data-tone={tone}
      aria-label={labels.navLabel}
    >
      {/* Reading progress. Driven by the document scroll timeline, so it
          costs no JavaScript, cannot fall behind the scroll, and simply
          does not appear where the browser has no scroll timelines. */}
      {isReading && <div className={styles.progress} aria-hidden="true" />}
      <div className={cx('wrap', styles.inner)}>
        {/* Named so the bar's own mark is a persisted element rather than
            something that cross-fades with the page behind it. */}
        <Link
          href={localePath(locale)}
          className={cx('label', styles.brand)}
          style={{ viewTransitionName: 'brand' }}
        >
          {site.name} <span className={styles.brandSuffix}>· {site.title}</span>
        </Link>

        {/* One flex child, not two.
            `.inner` is `space-between` and was built for exactly two
            children: the brand goes left, this goes right. Adding the
            language control as a third child made the browser distribute
            three, which pushed the chapter rail from the right edge into the
            middle of the bar — a composition change disguised as an
            addition. Grouping restores it. */}
        <div className={styles.right}>
          <ul className={styles.list}>
            {SECTIONS.map((s) => {
              const isCurrent = s.id === currentId
              return (
                <li key={s.id}>
                  <Link
                    // On the golden path the bar moves you within the page; from a
                    // depth route it moves you between pages.
                    href={onGoldenPath ? `#${s.id}` : localePath(locale, `/${s.id}`)}
                    className={cx('label', 'accentRise', styles.item)}
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

          {/* Only the languages you are NOT reading.
              Showing the current one too meant marking it, and the bar
              already has an idiom for "current" — the solid accent block on
              the chapter you are standing in. A second, weaker marker (a
              colour change) competing with it made the bar say "current" two
              different ways. Omitting the current language removes the
              question instead of answering it twice.

              Plain anchors, not <Link>: switching locale changes a root
              dynamic param and therefore `<html lang>`, which a client-side
              navigation has no reason to get right. A full document request
              does, and it costs no JavaScript. */}
          <ul className={styles.langs} aria-label={labels.languageLabel}>
            {LOCALES.filter((l) => l !== locale).map((l) => (
              <li key={l}>
                <a
                  href={localePath(l, rest)}
                  hrefLang={LOCALE_META[l].lang}
                  // The visible text is a two-letter code; the accessible name
                  // is the endonym, written in the language it names — so
                  // `lang` marks the element for the aria-label's sake, not
                  // for the Latin code a sighted reader sees.
                  lang={LOCALE_META[l].lang}
                  aria-label={LOCALE_META[l].endonym}
                  className={cx('label', styles.lang)}
                >
                  {l.toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}
