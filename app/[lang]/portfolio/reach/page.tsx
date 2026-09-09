import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { ReachDots } from '@/components/ReachDots'
import { cx } from '@/lib/cx'
import { isLocale, localePath, t } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import {
  REACH_CO,
  REACH_DISTANCE,
  REACH_FLOOR,
  REACH_INTAKE,
  REACH_LOW,
  REACH_NATIONAL,
  REACH_QUANTILES,
  REACH_TOP_TEN,
  REACH_WINDOW,
} from '@/lib/reach.data'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * 중개 반경 — the page that was going to be a flow map and is not one.
 *
 * The third question this archive asked of the 실거래가 filings, and the one
 * whose answer was no. Every 매매 filing names the district its brokerage
 * office sits in, so the cache holds a complete origin-destination matrix
 * for a year of apartment sales, and the figure that suggests itself is arcs
 * across the country. Then you measure it: nine legs in ten never leave the
 * district, the tenth has a median distance of about nine kilometres, and
 * five thousand distinct pairs share the traffic so evenly that the ten
 * thickest carry under a tenth of it.
 *
 * SO THE PAGE PUBLISHES THE NULL RESULT. Arcs would have been five thousand
 * lines drawn to show eight percent of a phenomenon that is mostly
 * adjacency, and a reader would have come away believing they had seen
 * brokerage move around the country. A figure that is beautiful and answers
 * a question the data cannot answer is worse than no figure.
 *
 * WHAT REPLACES IT is a dot per district on a full axis, a distance table,
 * and the low twelve with the biggest inflow into each — because the
 * exceptions are the only part with any structure, and even they turn out to
 * be adjacency with exactly one exception to the exception.
 *
 * NO NUMBER FROM THE DATA IS WRITTEN INTO THIS FILE, this comment included.
 * `stats` is the only place they enter and scripts/check-reach.mjs fails the
 * build if the prose quotes one the data does not hold.
 */

const n = (v: number) => v.toLocaleString('en-US')

/* Module scope so `generateMetadata` reads the same numbers the body does. */
const stats = {
  national: REACH_NATIONAL,
  median: REACH_QUANTILES.median,
  min: REACH_QUANTILES.min,
  max: REACH_QUANTILES.max,
  p5: REACH_QUANTILES.p5,
  p95: REACH_QUANTILES.p95,
  measured: n(REACH_INTAKE.measured),
  districts: n(REACH_INTAKE.districts),
  belowFloor: n(REACH_INTAKE.belowFloor),
  noLegs: n(REACH_INTAKE.noLegs),
  records: n(REACH_INTAKE.records),
  legs: n(REACH_INTAKE.legs),
  external: n(REACH_INTAKE.external),
  externalShare: Math.round((1000 * REACH_INTAKE.external) / REACH_INTAKE.matched) / 10,
  flows: n(REACH_INTAKE.flows),
  topTen: REACH_TOP_TEN,
  floor: n(REACH_FLOOR),
  distMedian: REACH_DISTANCE.median,
  distP90: REACH_DISTANCE.p90,
  distMax: n(REACH_DISTANCE.max),
  within20: REACH_DISTANCE.bands.find((b) => b.to === 20)?.share ?? 0,
  coShare: REACH_CO.share,
  coPairs: n(REACH_CO.pairs),
  /* Counts, not a share. 12/30,329 rounds to 100.0% at one decimal and a
     rounded 100 reads as "not one of them", which is how this number was
     misreported once already. */
  coCross: n(REACH_CO.cross),
  coSame: n(REACH_CO.same),
  from: REACH_WINDOW.from,
  to: REACH_WINDOW.to,
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
    path: '/portfolio/reach',
    title: d.reach.heading,
    description: t(d.seo.reach, stats),
  })
}

export default async function ReachPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = dict(lang)

  /* The worst district is the page's one real exception, so it gets a
     sentence of its own rather than a row a reader has to notice. */
  const worst = REACH_LOW[0]

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(lang, [
          { name: site.title, path: '/' },
          { name: d.portfolio.heading, path: '/portfolio' },
          { name: d.reach.heading, path: '/portfolio/reach' },
        ])}
      />

      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="reach-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.portfolio.heading}</Link> —{' '}
            {d.reach.heading}
          </p>
          <h1 id="reach-title" className={cx('display', styles.heroTitle)} lang="en">
            {REACH_NATIONAL}
            <span className="accentBlock">%</span>
          </h1>
          <p className="lead measure">{t(d.reach.lead, stats)}</p>
        </div>
      </section>

      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="dots-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="dots-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.reach.dotsHeading}
          </h2>
          <p className={cx('small', 'muted', 'measure', styles.note)}>{t(d.reach.note, stats)}</p>

          <ReachDots
            labels={{
              caption: t(d.reach.caption, stats),
              summary: t(d.reach.summary, stats),
              source: d.reach.source,
              median: d.reach.medianLabel,
              dot: d.reach.dot,
            }}
          />

          <h3 className={cx('h3', styles.subheading)}>{d.reach.distanceHeading}</h3>
          <p className={cx('small', 'muted', 'measure', styles.note)}>
            {t(d.reach.distanceWhy, stats)}
          </p>

          <table className={cx('small', styles.bands)}>
            <caption className={cx('label', styles.tableCaption)}>
              {t(d.reach.bandsCaption, stats)}
            </caption>
            <thead>
              <tr>
                <th scope="col">{d.reach.bandTerm}</th>
                <th scope="col">{d.reach.bandShare}</th>
              </tr>
            </thead>
            <tbody>
              {REACH_DISTANCE.bands.map((b) => (
                <tr key={b.to}>
                  <th scope="row">{t(d.reach.bandRow, { to: b.to })}</th>
                  <td>
                    {/* The bar IS the cell, so there is no figure here for a
                        screen reader to be locked out of. */}
                    <span className={styles.bar} style={{ inlineSize: `${b.share}%` }} />
                    <span className={styles.barValue}>{b.share}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className={cx('h3', styles.subheading)}>{d.reach.lowHeading}</h3>
          <p className={cx('small', 'muted', 'measure', styles.note)}>
            {t(d.reach.lowWhy, {
              ...stats,
              sgg: worst?.sgg ?? '',
              rate: worst?.rate ?? 0,
              origin: worst?.origin ?? '',
              originShare: worst?.originShare ?? 0,
              originKm: n(worst?.originKm ?? 0),
            })}
          </p>

          <table className={cx('small', styles.low)}>
            <caption className={cx('label', styles.tableCaption)}>
              {t(d.reach.lowCaption, stats)}
            </caption>
            <thead>
              <tr>
                <th scope="col">{d.reach.colDistrict}</th>
                <th scope="col">{d.reach.colRate}</th>
                <th scope="col">{d.reach.colLegs}</th>
                <th scope="col">{d.reach.colOrigin}</th>
                <th scope="col">{d.reach.colKm}</th>
              </tr>
            </thead>
            <tbody>
              {REACH_LOW.map((r) => (
                <tr key={`${r.sido} ${r.sgg}`}>
                  <th scope="row">
                    {r.sgg}
                    <span className="muted"> · {r.sido}</span>
                  </th>
                  <td className={styles.num}>{r.rate}%</td>
                  <td className={styles.num}>{n(r.legs)}</td>
                  <td>
                    {r.origin}
                    <span className="muted"> · {r.originShare}%</span>
                  </td>
                  <td className={styles.num}>{r.originKm}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.limits}>
            <p className={cx('label', styles.limitsHead)}>{d.reach.limitsHead}</p>
            <dl className={cx('small', 'measure', styles.limitList)}>
              <dt>{d.reach.arcTerm}</dt>
              <dd>{t(d.reach.arcWhy, stats)}</dd>
              <dt>{d.reach.coTerm}</dt>
              <dd>{t(d.reach.coWhy, stats)}</dd>
              <dt>{d.reach.legTerm}</dt>
              <dd>{t(d.reach.legWhy, stats)}</dd>
              <dt>{d.reach.floorTerm}</dt>
              <dd>{t(d.reach.floorWhy, stats)}</dd>
              <dt>{d.reach.centroidTerm}</dt>
              <dd>{t(d.reach.centroidWhy, stats)}</dd>
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
            <Link href={localePath(lang, '/portfolio')}>{d.reach.back}</Link>
          </p>
        </div>
      </section>
    </>
  )
}
