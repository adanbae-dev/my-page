import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DirectScatter } from '@/components/DirectScatter'
import { JsonLd } from '@/components/JsonLd'
import { cx } from '@/lib/cx'
import { isLocale, localePath, t } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import {
  DIRECT_FLOOR,
  DIRECT_INTAKE,
  DIRECT_MEDIAN,
  DIRECT_NATIONAL,
  DIRECT_R,
  DIRECT_RATE_RANGE,
  DIRECT_WINDOW,
} from '@/lib/direct.data'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * 직거래율, and the explanation that beat the one this page set out to test.
 *
 * It began as a follow-up to the district map: if a place has more brokerage
 * offices per resident, are fewer of its sales done without a broker? Yes,
 * and the page exists because that is not the best available answer.
 * Population predicts the same rate more strongly, and population and broker
 * density move together, so part of what the first correlation measures is
 * broker density standing in for "small town".
 *
 * Publishing the second scatter next to the first is the whole product.
 *
 * THE THREE COEFFICIENTS ARE NOT WRITTEN DOWN ANYWHERE IN THIS FILE, this
 * comment included. All three moved when 광주·전남 filings arrived — 27
 * districts that had been queried under codes the API had retired — and the
 * district count moved with them. Everything the prose quotes comes from
 * `stats`, and scripts/check-direct.mjs recomputes the coefficients from the
 * published points and fails the build if a sentence holds a number the data
 * does not.
 */

/* Filled in rather than written into the sentence: the three correlations,
   the observed range and the number of districts on the chart are all
   regenerated whenever another month of filings lands. Module scope so
   `generateMetadata` reads the same numbers the body does — the search
   description used to carry its own district count, and that count was
   fifteen districts stale. */
const stats = {
  rDensity: DIRECT_R.density,
  rPop: DIRECT_R.pop,
  rBoth: `+${DIRECT_R.both}`,
  minRate: DIRECT_RATE_RANGE.min,
  maxRate: DIRECT_RATE_RANGE.max,
  plotted: DIRECT_INTAKE.plotted,
  /* "the other N": every plotted district but the one in the corner. */
  others: DIRECT_INTAKE.plotted - 1,
}

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
    path: '/portfolio/direct',
    title: d.direct.heading,
    description: t(d.seo.direct, stats),
  })
}

const n = (v: number) => v.toLocaleString('en-US')

export default async function DirectPage({
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
          { name: d.direct.heading, path: '/portfolio/direct' },
        ])}
      />

      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="direct-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.portfolio.heading}</Link> —{' '}
            {d.direct.heading}
          </p>
          <h1 id="direct-title" className={cx('display', styles.heroTitle)} lang="en">
            {DIRECT_R.density}
            <span className="accentBlock">{' vs '}</span>
            {DIRECT_R.pop}
          </h1>
          <p className="lead measure">{t(d.direct.lead, stats)}</p>
        </div>
      </section>

      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="scatter-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="scatter-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.direct.chartHeading}
          </h2>
          <p className={cx('small', 'muted', 'measure', styles.note)}>
            {t(d.direct.note, stats)}
          </p>

          <DirectScatter
            labels={{
              caption: t(d.direct.caption, {
                plotted: n(DIRECT_INTAKE.plotted),
                deals: n(DIRECT_INTAKE.deals),
                from: DIRECT_WINDOW.from,
                to: DIRECT_WINDOW.to,
              }),
              summary: d.direct.summary,
              source: d.direct.source,
              density: d.direct.density,
              population: d.direct.population,
              rate: d.direct.rate,
              r: d.direct.r,
            }}
          />

          <div className={styles.readout}>
            <p className={cx('label', styles.readoutHead)}>{d.direct.readoutHead}</p>
            <table className={cx('small', styles.table)}>
              <tbody>
                <tr>
                  <th scope="row">{d.direct.rowNational}</th>
                  <td>{DIRECT_NATIONAL}%</td>
                </tr>
                <tr>
                  <th scope="row">{d.direct.rowMedian}</th>
                  <td>{DIRECT_MEDIAN}%</td>
                </tr>
                <tr>
                  <th scope="row">{d.direct.rowRDensity}</th>
                  <td>{DIRECT_R.density}</td>
                </tr>
                <tr>
                  <th scope="row">{d.direct.rowRPop}</th>
                  <td>{DIRECT_R.pop}</td>
                </tr>
                <tr>
                  <th scope="row">{d.direct.rowRBoth}</th>
                  <td>{DIRECT_R.both}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.limits}>
            <p className={cx('label', styles.limitsHead)}>{d.direct.limitsHead}</p>
            <dl className={cx('small', 'measure', styles.limitList)}>
              <dt>{d.direct.confoundTerm}</dt>
              <dd>{d.direct.confoundWhy}</dd>
              <dt>{d.direct.floorTerm}</dt>
              <dd>
                {t(d.direct.floorWhy, {
                  floor: n(DIRECT_FLOOR),
                  districts: n(DIRECT_INTAKE.districts),
                  plotted: n(DIRECT_INTAKE.plotted),
                  dropped: n(DIRECT_INTAKE.belowFloor),
                })}
              </dd>
              <dt>{d.direct.aptTerm}</dt>
              <dd>{d.direct.aptWhy}</dd>
              <dt>{d.direct.gapTerm}</dt>
              <dd>
                {t(d.direct.gapWhy, {
                  responses: n(DIRECT_INTAKE.responses),
                  expected: n(DIRECT_INTAKE.expected),
                  missing: n(DIRECT_INTAKE.expected - DIRECT_INTAKE.responses),
                })}
              </dd>
            </dl>
          </div>
        </div>
      </section>

      <section data-tone="light" data-density="calm" className={styles.closing}>
        <div className="wrap">
          <hr className="ruleStrong" />
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.direct.back}</Link>
          </p>
        </div>
      </section>
    </>
  )
}
