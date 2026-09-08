import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BiDashboard } from '@/components/BiDashboard'
import { JsonLd } from '@/components/JsonLd'
import { cx } from '@/lib/cx'
import { BI_INTAKE, BI_MONTHS, BI_TAM } from '@/lib/bi.data'
import { isLocale, localePath } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * The second dashboard, and the first page on this site that needs a script.
 *
 * /portfolio/revenue and this route hold the same data and disagree about
 * what a chart is for. That one is an ARGUMENT: nine figures in a fixed
 * order, a paragraph under each saying what it shows and why that encoding,
 * no controls, no JavaScript, every value in a table underneath. This is an
 * INSTRUMENT: no argument, one filter row, and every number recomputed from
 * whatever slice the reader asks for. Both positions are right for their own
 * page and merging them would produce the commonest bad dashboard — one that
 * argues while its numbers move.
 *
 * WITHOUT JAVASCRIPT this page has no fallback of its own, and that is a
 * decision rather than an omission. The honest fallback for "you cannot run
 * the filters" is not a frozen copy of one arbitrary slice — it is the route
 * that answers the same questions with no script at all, which exists, is
 * complete, and is linked from the `noscript` below. Shipping a static
 * imitation of an interactive page would double this page's markup to
 * describe a filter state nobody chose.
 *
 * THE DATA IS FETCHED. public/data/bi/slice.json is 45 KB brotli and arrives
 * after first paint, the same arrangement the district drill-down uses. That
 * is the only reason a client-side dashboard fits here: this site's entire
 * per-route JavaScript allowance is 11 KB, and a dataset in the bundle would
 * have spent it before the first control was written.
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
    path: '/portfolio/bi-dashboard',
    title: d.bi.heading,
    description: d.seo.bi,
  })
}

export default async function BiDashboardPage({
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
          { name: d.bi.heading, path: '/portfolio/bi-dashboard' },
        ])}
      />

      <section
        data-tone="light"
        data-density="dense"
        className={styles.route}
        aria-labelledby="bi-title"
      >
        <header className={styles.head}>
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.portfolio.heading}</Link> —{' '}
            {d.bi.heading}
          </p>
          <h1 id="bi-title" className={cx('h2', styles.title)}>
            {d.bi.heading}
          </h1>
          <p className={cx('small', styles.scope)}>
            {d.bi.scope
              .replace('{complexes}', BI_INTAKE.customers.toLocaleString('en-US'))
              .replace('{months}', String(BI_MONTHS.length))
              .replace('{tam}', BI_TAM.complexes.toLocaleString('en-US'))}
          </p>
          {/* The other route, named up front rather than only in the
              noscript: a reader who wants the argument instead of the
              instrument should not have to fail at the instrument first. */}
          <p className="label">
            <Link href={localePath(lang, '/portfolio/revenue')}>{d.bi.static} →</Link>
          </p>
        </header>

        <noscript>
          <p className={cx('small', styles.noscript)}>
            {d.bi.needsScript}{' '}
            <Link href={localePath(lang, '/portfolio/revenue')}>{d.bi.static}</Link>
          </p>
        </noscript>

        <BiDashboard labels={d.bi} src="/data/bi/slice.json" />

        <footer className={styles.foot}>
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.bi.back}</Link>
          </p>
        </footer>
      </section>
    </>
  )
}
