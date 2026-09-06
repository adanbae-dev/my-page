import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { RenewalDistribution } from '@/components/RenewalDistribution'
import { cx } from '@/lib/cx'
import { isLocale, localePath } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { t } from '@/lib/i18n/config'
import { RENEWAL_INTAKE, RENEWAL_SERIES, RENEWAL_WINDOW } from '@/lib/renewal.data'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * 계약갱신청구권, on its own route.
 *
 * The first page on this site whose subject is a DISTRIBUTION rather than a
 * place. It exists because the summary statistic lies: the median renewal
 * rose 4.9% with the right invoked and 4.7% without it, and a page that
 * reported those two numbers would have said the cap does nothing. The 90th
 * percentiles are 5.0% and 15.5%.
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
    path: '/portfolio/renewal',
    title: d.renewal.heading,
    description: d.seo.renewal,
  })
}

const n = (v: number) => v.toLocaleString('en-US')

export default async function RenewalPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = dict(lang)
  const [up, down] = RENEWAL_SERIES

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(lang, [
          { name: site.title, path: '/' },
          { name: d.portfolio.heading, path: '/portfolio' },
          { name: d.renewal.heading, path: '/portfolio/renewal' },
        ])}
      />

      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="renewal-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.portfolio.heading}</Link> —{' '}
            {d.renewal.heading}
          </p>
          <h1 id="renewal-title" className={cx('display', styles.heroTitle)} lang="en">
            {up?.median?.toFixed(1)}
            <span className="accentBlock">{' vs '}</span>
            {down?.median?.toFixed(1)}
          </h1>
          <p className="lead measure">{d.renewal.lead}</p>
        </div>
      </section>

      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="chart-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="chart-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.renewal.chartHeading}
          </h2>
          <p className={cx('small', 'muted', 'measure', styles.note)}>{d.renewal.note}</p>

          <RenewalDistribution
            labels={{
              caption: t(d.renewal.caption, {
                kept: n(RENEWAL_INTAKE.kept),
                from: RENEWAL_WINDOW.from,
                to: RENEWAL_WINDOW.to,
              }),
              summary: d.renewal.summary,
              source: d.renewal.source,
              cap: d.renewal.cap,
              up: d.renewal.up,
              down: d.renewal.down,
              unit: d.renewal.unit,
              share: d.renewal.share,
            }}
          />

          {/* The table the page argues against, printed anyway — with the two
              rows that make the argument sitting under it. */}
          <div className={styles.readout}>
            <p className={cx('label', styles.readoutHead)}>{d.renewal.readoutHead}</p>
            <table className={cx('small', styles.table)}>
              <thead>
                <tr>
                  <th scope="col" />
                  <th scope="col">{d.renewal.up}</th>
                  <th scope="col">{d.renewal.down}</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['rowMedian', up?.median, down?.median, '%'],
                    ['rowP90', up?.p90, down?.p90, '%'],
                    ['rowOver', up?.overCap, down?.overCap, '%'],
                    ['rowFrozen', up?.frozen, down?.frozen, '%'],
                  ] as const
                ).map(([key, a, b, unit]) => (
                  <tr key={key} className={key === 'rowMedian' ? styles.quiet : undefined}>
                    <th scope="row">{d.renewal[key]}</th>
                    {/* One decimal on every cell. `5` next to `15.5` in the
                        same column reads as a different kind of number. */}
                    <td>
                      {a?.toFixed(1)}
                      {unit}
                    </td>
                    <td>
                      {b?.toFixed(1)}
                      {unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.limits}>
            <p className={cx('label', styles.limitsHead)}>{d.renewal.limitsHead}</p>
            <dl className={cx('small', 'measure', styles.limitList)}>
              <dt>{d.renewal.jeonseTerm}</dt>
              <dd>
                {t(d.renewal.jeonseWhy, {
                  renewals: n(RENEWAL_INTAKE.renewals),
                  mixed: n(RENEWAL_INTAKE.mixed),
                  kept: n(RENEWAL_INTAKE.kept),
                })}
              </dd>
              <dt>{d.renewal.blankTerm}</dt>
              <dd>{d.renewal.blankWhy}</dd>
              <dt>{d.renewal.filedTerm}</dt>
              <dd>{d.renewal.filedWhy}</dd>
            </dl>
          </div>
        </div>
      </section>

      <section data-tone="light" data-density="calm" className={styles.closing}>
        <div className="wrap">
          <hr className="ruleStrong" />
          <p className="label">
            <Link href={localePath(lang, '/portfolio')}>{d.renewal.back}</Link>
          </p>
        </div>
      </section>
    </>
  )
}
