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

          {/* Not a map. It is on this page because it is the same source
              file read for a different question, and because a portfolio of
              one shape is a portfolio of one idea. */}
          <p className={cx('label', styles.deeper)}>
            <Link href={localePath(lang, '/portfolio/renewal')}>
              {d.renewal.heading} →
            </Link>
          </p>

          <p className={cx('label', styles.deeper)}>
            <Link href={localePath(lang, '/portfolio/direct')}>
              {d.direct.heading} →
            </Link>
          </p>

          <p className={cx('label', styles.deeper)}>
            <Link href={localePath(lang, '/portfolio/prices')}>
              {d.prices.heading} →
            </Link>
          </p>

          {/* The question this one asked got the answer no, which is why it is
              in a portfolio rather than in a drawer. It was going to be a flow
              map; the data said do not draw one, and the page publishes that
              instead of the picture. */}
          <p className={cx('label', styles.deeper)}>
            <Link href={localePath(lang, '/portfolio/reach')}>
              {d.reach.heading} →
            </Link>
          </p>

          {/* The only one of these that is not built on public filings, and
              it says so in its first line. It is here because a portfolio
              that only holds maps of open data holds one kind of problem —
              and because the revenue a product actually earns is the shape
              of question this archive otherwise has no example of. */}
          <p className={cx('label', styles.deeper)}>
            <Link href={localePath(lang, '/portfolio/revenue')}>
              {d.revenue.heading} →
            </Link>
          </p>

          {/* Same data, opposite premise. The one above is an argument in a
              fixed order with no controls; this one has no argument and
              recomputes everything against whatever the reader filters to.
              Two routes rather than one page with a toggle, because a page
              that argues while its numbers move is the commonest bad
              dashboard. */}
          <p className={cx('label', styles.deeper)}>
            <Link href={localePath(lang, '/portfolio/bi-dashboard')}>
              {d.bi.heading} →
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
