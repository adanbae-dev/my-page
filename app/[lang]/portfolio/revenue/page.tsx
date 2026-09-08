import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { RevenueBoard } from '@/components/RevenueBoard'
import { cx } from '@/lib/cx'
import { isLocale, localePath } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * The one route on this site that is not an essay.
 *
 * Every other page is a column with a beat: a calm opening, a dense middle
 * carrying one figure, a quiet close. This route opens on nine figures at the
 * density they are used at, because a dashboard is a thing people OPEN rather
 * than read — the question is usually "is anything off", and that is answered
 * by seeing the figures together, not by arriving at each in turn. So there
 * is no hero, no lead paragraph and no closing note. The page is the board.
 *
 * WHAT THE PAGE MUST NEVER STOP SAYING. The revenue here is invented. The
 * complexes are not — name, province, district, 법정동 and completion year
 * come from 국토교통부 filings, which is what gives the penetration rate a
 * denominator nobody had to make up. That split is stated in three places
 * (the band at the top, the map's caption, the provenance line at the
 * bottom), and `pnpm check:bi` fails the build if any of the three strings
 * goes missing from either locale. A dashboard on generated revenue has
 * exactly one way to be dishonest and it is not the charts.
 *
 * NO CLIENT JAVASCRIPT. See components/RevenueBoard.tsx — the figures are
 * markup built at build time in lib/bi.figure.ts, and the tables under them
 * are `<details>`.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const d = dict(lang)
  return pageMetadata({
    lang,
    path: '/portfolio/revenue',
    title: d.revenue.heading,
    description: d.seo.revenue,
  })
}

export default async function RevenuePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = dict(lang)

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(lang, [
          { name: site.title, path: '/' },
          { name: d.portfolio.heading, path: '/portfolio' },
          { name: d.revenue.heading, path: '/portfolio/revenue' },
        ])}
      />

      {/* One tone for the whole route. The board's own rules and ramp carry
          the structure; alternating grounds down a dashboard would section a
          page whose whole argument is that the figures are read together. */}
      <section
        data-tone="light"
        data-density="dense"
        className={styles.route}
        aria-labelledby="revenue-title"
      >
        <header className={styles.head}>
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.portfolio.heading}</Link> —{' '}
            {d.revenue.heading}
          </p>
          {/* The h1 is the dashboard's name and nothing else. A display-scale
              headline here would be a title card in front of the thing the
              reader came for. */}
          <h1 id="revenue-title" className={cx('h2', styles.title)}>
            {d.revenue.heading}
          </h1>
        </header>

        <RevenueBoard labels={d.revenue} />

        <footer className={styles.foot}>
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.revenue.back}</Link>
          </p>
        </footer>
      </section>
    </>
  )
}
