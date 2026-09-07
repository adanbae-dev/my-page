import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { isLocale, localePath, type Locale } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { REPO, site, url } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * The privacy policy.
 *
 * WHY THIS PAGE EXISTS AT ALL, given that the site collects almost nothing.
 * Two reasons, and only one of them is legal. The first is that "almost
 * nothing" is a claim, and an unpublished claim is indistinguishable from
 * never having thought about it — a reader who wonders whether this site
 * tracks them has no way to check the repository. The second is that AdSense
 * will not review a site without one, which is a requirement Google imposes
 * rather than a statute.
 *
 * WHY THE COPY IS PLAINER THAN EVERY OTHER PAGE HERE. Someone opens this
 * page to get an answer, not to read. The register that serves an essay
 * makes a policy worse.
 *
 * WHAT THIS PAGE DELIBERATELY DOES NOT DO. It does not claim GDPR, CCPA or
 * PIPA compliance, and it names no data protection officer. Both would be
 * assertions this repository cannot check, and one of them — publishing a
 * named officer with contact details — would undo the pseudonymity that
 * lib/site.config.ts and lib/practice.data.ts both decide on purpose. The
 * contact route is the same public one the practice page offers.
 */

/**
 * When the substance of this policy last changed. ISO, formatted by
 * lib/format.ts like every other date on the site.
 *
 * HAND-WRITTEN, and not derived from git — which is the opposite of what
 * this repository does everywhere else, so here is the reason. The build
 * record can say when this FILE last changed; it cannot say whether the
 * change was a new clause or a fixed typo. A revision date is a statement
 * about the policy, and moving it because a comment was reworded would be a
 * false one. So it moves by hand, when the meaning moves.
 */
const LAST_REVISED = '2026-09-08'

const ISSUES = `${REPO.url}/issues`

/** Where a visitor can refuse ad personalisation. Google's own, then the industry's. */
const OPT_OUT = {
  google: 'https://adssettings.google.com/',
  nai: 'https://optout.networkadvertising.org/',
  adchoices: 'https://optout.aboutads.info/',
} as const

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
    path: '/privacy',
    title: d.privacy.heading,
    /* seo.privacy rather than privacy.lead, the same split the practice page
       documents: a lead is display copy and reads at whatever length reads
       well, while a description has a 160-character budget the release gate
       measures. */
    description: d.seo.privacy,
  })
}

/** One term and what is true about it. See the note in page.module.css. */
function Clause({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className={styles.clause}>
      <dt className={cx('label', styles.clauseTerm)}>{term}</dt>
      <dd className={styles.clauseBody}>
        <p className="measure">{children}</p>
      </dd>
    </div>
  )
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale: Locale = lang
  const d = dict(locale)

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: site.title, path: '/' },
          { name: d.privacy.heading, path: '/privacy' },
        ])}
      />
      {/*
        Typed as a WebPage, not a CollectionPage or an Article.
        `dateModified` carries the same date the page prints, so the machine
        reading and the human reading cannot disagree — the failure the
        practice page's structured-data note describes.
      */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: d.privacy.heading,
          description: d.seo.privacy,
          url: url(localePath(locale, '/privacy')),
          dateModified: LAST_REVISED,
          isPartOf: {
            '@type': 'WebSite',
            name: site.title,
            url: url(localePath(locale)),
          },
        }}
      />

      {/* ---- CALM ------------------------------------------------------ */}
      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="privacy-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label">
            <Link href={localePath(locale, '/')}>{site.title}</Link> — {d.privacy.heading}
          </p>

          {/* Latin and identical in both locales, like every other display
              line on this site. */}
          <h1 id="privacy-title" className={cx('display', styles.heroTitle)} lang="en">
            {'What this site '}
            <br />
            {'knows about '}
            <span className="accentBlock">you</span>
          </h1>

          <p className="lead measure">{d.privacy.lead}</p>

          <dl className={cx('label', styles.revised)}>
            <dt>{d.privacy.updatedLabel}</dt>
            <dd>
              <time dateTime={LAST_REVISED}>{formatDate(LAST_REVISED)}</time>
            </dd>
          </dl>

          <p className={cx('small', 'muted', 'measure')}>{d.privacy.scopeBody}</p>
        </div>
      </section>

      {/* ---- DENSE · WHAT IS COLLECTED -------------------------------- */}
      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="collect-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="collect-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.privacy.collectHeading}
          </h2>

          <p className={cx('small', 'muted', 'measure', styles.note)}>
            {d.privacy.collectNote}
          </p>

          <dl className={styles.clauses}>
            <Clause term={d.privacy.logLabel}>{d.privacy.logBody}</Clause>
            <Clause term={d.privacy.analyticsLabel}>{d.privacy.analyticsBody}</Clause>
            <Clause term={d.privacy.storageLabel}>{d.privacy.storageBody}</Clause>
            <Clause term={d.privacy.fontLabel}>{d.privacy.fontBody}</Clause>
          </dl>
        </div>
      </section>

      {/* ---- DENSE · THIRD PARTIES ------------------------------------ */}
      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="third-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="third-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.privacy.thirdHeading}
          </h2>

          <p className={cx('small', 'muted', 'measure', styles.note)}>
            {d.privacy.thirdNote}
          </p>

          <dl className={styles.clauses}>
            <Clause term={d.privacy.cloudflareLabel}>{d.privacy.cloudflareBody}</Clause>
            <Clause term={d.privacy.googleLabel}>{d.privacy.googleBody}</Clause>
          </dl>
        </div>
      </section>

      {/* ---- DENSE · ADVERTISING -------------------------------------- */}
      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="ads-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="ads-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.privacy.adsHeading}
          </h2>

          {/* The standing notice, on the one clause that describes a state
              rather than a practice — and the state is "not yet". */}
          <p className={cx('small', 'measure', styles.standing, styles.note)}>
            {d.privacy.adsStatusBody}
          </p>

          <dl className={styles.clauses}>
            <Clause term={d.privacy.adsFutureLabel}>{d.privacy.adsFutureBody}</Clause>
            <Clause term={d.privacy.adsConsentLabel}>{d.privacy.adsConsentBody}</Clause>
          </dl>
        </div>
      </section>

      {/* ---- DENSE · RIGHTS ------------------------------------------- */}
      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="rights-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="rights-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.privacy.rightsHeading}
          </h2>

          <p className={cx('small', 'muted', 'measure', styles.note)}>
            {d.privacy.rightsNote}
          </p>

          <dl className={styles.clauses}>
            <Clause term={d.privacy.optGoogleLabel}>
              {d.privacy.optGoogleBody}{' '}
              <a href={OPT_OUT.google} rel="noopener noreferrer">
                adssettings.google.com
              </a>
            </Clause>
            <Clause term={d.privacy.optNaiLabel}>
              {d.privacy.optNaiBody}{' '}
              <a href={OPT_OUT.nai} rel="noopener noreferrer">
                optout.networkadvertising.org
              </a>
              {' · '}
              <a href={OPT_OUT.adchoices} rel="noopener noreferrer">
                optout.aboutads.info
              </a>
            </Clause>
            <Clause term={d.privacy.optBrowserLabel}>{d.privacy.optBrowserBody}</Clause>
          </dl>

          <p className={cx('small', 'muted', 'measure', styles.closingNote)}>
            {d.privacy.rightsLegalBody}
          </p>
          <p className={cx('small', 'muted', 'measure', styles.closingNote)}>
            {d.privacy.remedyBody}
          </p>
        </div>
      </section>

      {/* ---- CALM · CONTACT AND REVISIONS ---------------------------- */}
      <section data-tone="light" data-density="calm" className={styles.closing}>
        <div className="wrap">
          <hr className="ruleStrong" />

          <div className={styles.closingGrid}>
            <div>
              <h2 className={cx('label', styles.closingHead)}>{d.privacy.contactHeading}</h2>
              <p className="measure">{d.privacy.contactBody}</p>
              <p className={cx('small', styles.closingNote)}>
                <a href={ISSUES} rel="noopener">
                  {d.privacy.contactIssues}
                </a>
              </p>
            </div>

            <div>
              <h2 className={cx('label', styles.closingHead)}>{d.privacy.revisionHeading}</h2>
              <p className="measure">{d.privacy.revisionBody}</p>
              <p className={cx('small', styles.closingNote)}>
                <Link href={localePath(locale, '/build')}>{site.title} — build</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
