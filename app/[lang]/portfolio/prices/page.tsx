import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { PriceCartogram } from '@/components/PriceCartogram'
import { cx } from '@/lib/cx'
import { isLocale, localePath, t } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { PRICE_FLOOR, PRICE_INTAKE, PRICE_STATS, PRICE_WINDOW } from '@/lib/prices.data'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * Price change on the same 245 hexagons the brokerage map uses.
 *
 * A separate route rather than a second layer on /portfolio/districts, and
 * the reason is measured: the two maps answer different questions — "where
 * are the offices" and "where did prices move" — and the two variables
 * correlate at only +0.29. A bivariate encoding earns its complexity when
 * two things co-occur; these do not, so what a reader needs is each map read
 * cleanly rather than both squeezed into one cell.
 *
 * The grid is imported, not rebuilt. Same boundary polygons, same Hungarian
 * assignment, same cells. Only the scale belongs to this page.
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
    path: '/portfolio/prices',
    title: d.prices.heading,
    description: d.seo.prices,
  })
}

const n = (v: number) => v.toLocaleString('en-US')
const ym = (s: string) => `${s.slice(0, 4)}-${s.slice(4)}`

export default async function PricesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = dict(lang)

  /* Filled in, not written into the sentences. Another month of filings
     moves every one of these. */
  const stats = {
    fell: n(PRICE_STATS.fell),
    rose: n(PRICE_STATS.rose),
    median: PRICE_STATS.median,
    min: PRICE_STATS.min,
    max: PRICE_STATS.max,
    pairs: n(PRICE_INTAKE.pairs),
    measured: n(PRICE_INTAKE.measured),
    districts: n(PRICE_INTAKE.districts),
    unmeasured: n(PRICE_INTAKE.districts - PRICE_INTAKE.measured),
    /* Two reasons a district has no colour, kept apart: too few matched
       pairs, and none at all. The second one used to include 27 districts
       whose region code the API had retired, and the page called that a
       thin market. */
    thin: n(PRICE_INTAKE.thin),
    nopairs: n(PRICE_INTAKE.nopairs),
    floor: n(PRICE_FLOOR),
    early: ym(PRICE_WINDOW.early),
    earlyEnd: ym(PRICE_WINDOW.earlyEnd),
    late: ym(PRICE_WINDOW.late),
    lateEnd: ym(PRICE_WINDOW.lateEnd),
  }

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(lang, [
          { name: site.title, path: '/' },
          { name: d.portfolio.heading, path: '/portfolio' },
          { name: d.prices.heading, path: '/portfolio/prices' },
        ])}
      />

      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="prices-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.portfolio.heading}</Link> —{' '}
            {d.prices.heading}
          </p>
          <h1 id="prices-title" className={cx('display', styles.heroTitle)} lang="en">
            {PRICE_STATS.fell}
            <span className="accentBlock">{' / '}</span>
            {PRICE_STATS.rose}
          </h1>
          <p className="lead measure">{t(d.prices.lead, stats)}</p>
        </div>
      </section>

      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="map-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="map-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.prices.mapHeading}
          </h2>
          <p className={cx('small', 'muted', 'measure', styles.note)}>
            {t(d.prices.note, stats)}
          </p>

          <p className={cx('label', 'muted', styles.drillNote)}>{d.drill.prompt}</p>

          <PriceCartogram
            labels={{
              caption: t(d.prices.caption, stats),
              legend: d.prices.legend,
              listing: d.prices.listing,
              summary: d.prices.summary,
              source: d.prices.source,
              unmeasured: d.prices.unmeasured,
              drill: d.drill,
              tip: {
                rate: d.prices.tipRate,
                offices: d.prices.tipPairs,
                people: '',
              },
            }}
          />

          <div className={styles.limits}>
            <p className={cx('label', styles.limitsHead)}>{d.prices.limitsHead}</p>
            <dl className={cx('small', 'measure', styles.limitList)}>
              <dt>{d.prices.pairsTerm}</dt>
              <dd>{t(d.prices.pairsWhy, stats)}</dd>
              <dt>{d.prices.unmeasuredTerm}</dt>
              <dd>{t(d.prices.unmeasuredWhy, stats)}</dd>
              <dt>{d.prices.windowTerm}</dt>
              <dd>{t(d.prices.windowWhy, stats)}</dd>
              <dt>{d.prices.divergeTerm}</dt>
              <dd>{d.prices.divergeWhy}</dd>
            </dl>
          </div>

          <p className={cx('label', styles.sibling)}>
            <Link href={localePath(lang, '/portfolio/districts')}>
              {d.districts.heading} →
            </Link>
          </p>
        </div>
      </section>

      <section data-tone="light" data-density="calm" className={styles.closing}>
        <div className="wrap">
          <hr className="ruleStrong" />
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.prices.back}</Link>
          </p>
        </div>
      </section>
    </>
  )
}
