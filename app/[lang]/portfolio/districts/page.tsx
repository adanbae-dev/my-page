import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DistrictCartogram } from '@/components/DistrictCartogram'
import { JsonLd } from '@/components/JsonLd'
import { cx } from '@/lib/cx'
import { DISTRICTS } from '@/lib/cartogram.districts.data'
import { isLocale, localePath } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * The district map, on its own route — and the reason is a measurement.
 *
 * It was built to live under /portfolio beside the province maps. It does not
 * fit: that page had 7.1 KB of its 23.4 KB HTML budget left and this figure
 * costs 8.0 KB gzipped even after the cheapest encoding was chosen. A
 * separate route gets its own budget, so the province page keeps its labels
 * and this one gets its density.
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
    path: '/portfolio/districts',
    title: d.districts.heading,
    description: d.seo.districts,
  })
}

export default async function DistrictsPage({
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
          { name: d.districts.heading, path: '/portfolio/districts' },
        ])}
      />

      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="districts-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.portfolio.heading}</Link> —{' '}
            {d.districts.heading}
          </p>
          <h1 id="districts-title" className={cx('display', styles.heroTitle)} lang="en">
            {'Two hundred '}
            <span className="accentBlock">forty-five</span>
          </h1>
          <p className="lead measure">{d.districts.lead}</p>
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
            {d.districts.mapHeading}
          </h2>
          <p className={cx('small', 'muted', 'measure', styles.note)}>{d.districts.note}</p>

          <DistrictCartogram
            labels={{
              caption: d.districts.caption.replace('{n}', String(DISTRICTS.length)),
              listing: d.districts.listing,
              summary: d.districts.summary,
              source: d.districts.source,
            }}
          />

          <div className={styles.limits}>
            <p className={cx('label', styles.limitsHead)}>{d.districts.limitsHead}</p>
            <dl className={cx('small', 'measure', styles.limitList)}>
              <dt>{d.districts.placedTerm}</dt>
              <dd>{d.districts.placedWhy}</dd>
              <dt>{d.districts.missingTerm}</dt>
              <dd>{d.districts.missingWhy}</dd>
              <dt>{d.districts.labelsTerm}</dt>
              <dd>{d.districts.labelsWhy}</dd>
            </dl>
          </div>
        </div>
      </section>

      <section data-tone="light" data-density="calm" className={styles.closing}>
        <div className="wrap">
          <hr className="ruleStrong" />
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.districts.back}</Link>
          </p>
        </div>
      </section>
    </>
  )
}
