import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Cartogram } from '@/components/Cartogram'
import { JsonLd } from '@/components/JsonLd'
import { cx } from '@/lib/cx'
import { DIVISIONS, VALUE_LAYERS } from '@/lib/cartogram.data'
import { isLocale, localePath } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * The portfolio page.
 *
 * Separate from `/practice`, and the split is not cosmetic. `/practice` is
 * about work already done and links to entries as evidence. This is where
 * things get BUILT — the first of them is the cartogram below, and it is
 * deliberately shipped with its value layer missing rather than filled with a
 * number nobody could check.
 *
 * docs/DATA-VISUALIZATION.md is the plan this page executes against.
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
    path: '/portfolio',
    title: d.portfolio.heading,
    description: d.seo.portfolio,
  })
}

export default async function PortfolioPage({
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
        ])}
      />

      {/* ---- CALM ------------------------------------------------------ */}
      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="portfolio-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label">
            <Link href={localePath(lang, '/')}>{site.title}</Link> — {d.portfolio.heading}
          </p>

          <h1 id="portfolio-title" className={cx('display', styles.heroTitle)} lang="en">
            {'Built to be '}
            <span className="accentBlock">checked</span>
          </h1>

          <p className="lead measure">{d.portfolio.lead}</p>
        </div>
      </section>

      {/* ---- DENSE · THE CARTOGRAM ------------------------------------ */}
      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="cartogram-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="cartogram-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.portfolio.cartogram.heading}
          </h2>

          <p className={cx('small', 'muted', 'measure', styles.note)}>
            {d.portfolio.cartogram.intro}
          </p>

          {/* Two maps, not a toggle. A switcher would need client JavaScript
              and this page ships none; more to the point, the argument is the
              COMPARISON — the second map is only interesting while the first
              is still on screen. */}
          {VALUE_LAYERS.map((layer) => {
            const copy = d.portfolio.cartogram.layers[
              layer.id as keyof typeof d.portfolio.cartogram.layers
            ]
            return (
              <div key={layer.id} className={styles.mapBlock}>
                <h3 className={cx('h3', styles.mapTitle)}>{copy.title}</h3>
                <p className={cx('small', 'muted', 'measure', styles.mapNote)}>{copy.note}</p>
                <Cartogram
                  layer={layer}
                  names={d.portfolio.cartogram.divisions}
                  labels={{
                    caption: copy.caption.replace('{n}', String(DIVISIONS.length)),
                    emptyLayer: d.portfolio.cartogram.emptyLayer,
                    listing: d.portfolio.cartogram.listing,
                    summary: copy.summary,
                  }}
                />
              </div>
            )
          })}

          {/* Why it stops at 17. Stated on the page, not only in the source —
              a reader who wonders where 시군구 went should not have to read
              the repository to find out. */}
          <p className={cx('label', styles.deeper)}>
            <Link href={localePath(lang, '/portfolio/districts')}>
              {d.districts.heading} →
            </Link>
          </p>

          <div className={styles.limits}>
            <p className={cx('label', styles.limitsHead)}>
              {d.portfolio.cartogram.limitsHead}
            </p>
            <dl className={cx('small', 'measure', styles.limitList)}>
              <dt>{d.portfolio.cartogram.sggTerm}</dt>
              <dd>{d.portfolio.cartogram.sggWhy}</dd>
              <dt>{d.portfolio.cartogram.dongTerm}</dt>
              <dd>{d.portfolio.cartogram.dongWhy}</dd>
              <dt>{d.portfolio.cartogram.valueTerm}</dt>
              <dd>{d.portfolio.cartogram.valueWhy}</dd>
            </dl>
          </div>
        </div>
      </section>

      {/* ---- CALM ------------------------------------------------------ */}
      <section data-tone="light" data-density="calm" className={styles.closing}>
        <div className="wrap">
          <hr className="ruleStrong" />
          <p className={cx('small', 'muted', 'measure', styles.closingNote)}>
            {d.portfolio.closing}
          </p>
        </div>
      </section>
    </>
  )
}
