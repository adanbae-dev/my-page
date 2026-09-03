import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { Sigil } from '@/components/Sigil'
import { cx } from '@/lib/cx'
import { getEntry } from '@/lib/content/load'
import { commits as allCommits, historyFor } from '@/lib/git/load'
import type { Commit } from '@/lib/git/schema'
import { isLocale, localePath, tn, type Locale } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import {
  allRefs,
  CAPABILITIES,
  CAPABILITY_GROUPS,
  datedSpanYears,
  ERAS,
  hasUndatedEra,
  STUDY,
  type Capability,
  type EntryRef,
} from '@/lib/practice.data'
import type { SectionId } from '@/lib/sections'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { person, REPO, site, url } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * The practice page — the fourth audience.
 *
 * See lib/practice.data.ts for why this is not a résumé page. What that file
 * decides, this one renders, and the rendering carries the argument: a claim
 * with no evidence behind it appears AS a claim with no evidence, in the same
 * list as the proven ones, at the same size. A skills grid is built to make
 * every row look equally solid; this one is built to make the difference
 * visible without editorialising about it.
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
    path: '/practice',
    title: d.practice.heading,
    /* seo.practice, not practice.lead. The lead is display copy and reads at
       whatever length reads well; a description has a 160-character budget
       the release gate enforces. Serving one string as both put a 172-char
       description on /en/practice — the gate caught it. */
    description: d.seo.practice,
  })
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const splitRef = (ref: EntryRef): { chapter: SectionId; slug: string } => {
  const i = ref.indexOf('/')
  return { chapter: ref.slice(0, i) as SectionId, slug: ref.slice(i + 1) }
}

/**
 * The commits behind everything this page points at.
 *
 * Deduplicated by sha because one commit routinely touches several entries,
 * and the mark counts slots rather than mentions — a commit lit twice would
 * inflate the only number on this page that is not a plain count.
 */
function evidenceCommits(): readonly Commit[] {
  const bySha = new Map<string, Commit>()
  for (const ref of allRefs()) {
    const { chapter, slug } = splitRef(ref)
    for (const c of historyFor(chapter, slug)) bySha.set(c.sha, c)
  }
  return [...bySha.values()]
}

/** `2022-03` -> `2022.03`. The site writes dates with dots everywhere else. */
const dot = (ym: string): string => ym.replace('-', '.')

function EvidenceLinks({
  refs,
  locale,
}: {
  refs: readonly EntryRef[]
  locale: Locale
}) {
  /* Titles come from the entries themselves, not from this file. A title
     copied here would be a second source of truth that silently goes stale
     the moment an entry is retitled — and the gate cannot catch that,
     because the slug would still resolve. */
  const found = refs
    .map((ref) => {
      const { chapter, slug } = splitRef(ref)
      const entry = getEntry(chapter, slug, locale)
      return entry ? { chapter, slug, title: entry.title } : null
    })
    .filter((x): x is { chapter: SectionId; slug: string; title: string } => x !== null)

  if (found.length === 0) return null

  return (
    <ul className={cx('small', styles.evidence)}>
      {found.map((e) => (
        <li key={`${e.chapter}/${e.slug}`}>
          <Link href={localePath(locale, `/${e.chapter}/${e.slug}`)}>{e.title}</Link>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function PracticePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale: Locale = lang
  const d = dict(locale)

  const years = datedSpanYears()
  const evidence = evidenceCommits()

  /* Only the evidenced capabilities reach the structured data. The page says
     out loud that five of these are unproven here; asserting them to a
     machine at the same time would make the two readings of this page
     disagree, and the machine-readable one is the copy nobody proofreads. */
  const provenSkills = CAPABILITIES.filter((c) => c.evidence.length > 0).map(
    (c) => d.practice.capabilities[c.id as keyof typeof d.practice.capabilities],
  )

  const byGroup = CAPABILITY_GROUPS.map((group) => ({
    group,
    items: CAPABILITIES.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0)

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: site.title, path: '/' },
          { name: d.practice.heading, path: '/practice' },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          url: url(localePath(locale, '/practice')),
          mainEntity: {
            ...person(),
            /* No `telephone`, no `address`, no `email`. The absence is the
               policy, not an omission — see the disclosure note in
               lib/practice.data.ts. `sameAs` carries the one identity this
               site publishes. */
            sameAs: [`https://github.com/${REPO.owner}`],
            hasOccupation: {
              '@type': 'Occupation',
              name: 'Frontend Engineer',
              skills: provenSkills.join(', '),
            },
          },
        }}
      />

      {/* ---- CALM ------------------------------------------------------ */}
      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="practice-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label">
            <Link href={localePath(locale, '/')}>{site.title}</Link> — {d.practice.heading}
          </p>

          {/* The two axes, as the headline. Latin and identical in both
              locales, like every other display line on this site. */}
          <h1 id="practice-title" className={cx('display', styles.heroTitle)} lang="en">
            {'What is claimed '}
            <br />
            {'and what is '}
            <span className="accentBlock">shown</span>
          </h1>

          <p className="lead measure">{d.practice.lead}</p>

          <div className={styles.heroFoot}>
            <dl className={cx('label', styles.span)}>
              <dt>{d.practice.spanLabel}</dt>
              <dd>{d.practice.spanValue.replace('{n}', String(years))}</dd>
            </dl>

            {/* The mark, lit by the commits behind what this page points at.
            
                `within` is required for a subset, and passing `undefined`
                was wrong: it makes the mark claim that these commits ARE the
                record, so the unearned slots render as ticks and the arc
                reads as "this is the whole history". Handing it the full
                record instead lights the subset at the slots the record gave
                them, with the rest stated as a ring — which is the true
                claim, and the same idiom an entry page uses for its own
                history. */}
            <Sigil
              commits={evidence}
              within={allCommits()}
              id="practice-sigil"
              label={d.sigil.practiceLabel.replace('{n}', String(evidence.length))}
              className={styles.mark}
            />
          </div>

          {hasUndatedEra() && (
            <p className={cx('small', 'measure', styles.notice)}>{d.practice.undatedNote}</p>
          )}
        </div>
      </section>

      {/* ---- DENSE · ERAS --------------------------------------------- */}
      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="eras-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="eras-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.practice.erasHeading}
          </h2>

          <p className={cx('small', 'muted', 'measure', styles.orgNote)}>
            {d.practice.orgNote}
          </p>

          <ol className={styles.eras}>
            {ERAS.map((era) => {
              const copy = d.practice.eras[era.id as keyof typeof d.practice.eras]
              const from = era.from ? dot(era.from) : d.practice.undated
              const to = era.to ? dot(era.to) : d.practice.present
              return (
                <li key={era.id} className={styles.era}>
                  <p className={cx('label', styles.period)}>
                    {/* An undated start reads as "no recorded start — 2020.04"
                        rather than as a dash into nothing. */}
                    {from} — {to}
                  </p>

                  <div className={styles.eraBody}>
                    <h3 className={cx('h3', styles.eraRole)}>{copy.role}</h3>
                    <p className={cx('label', 'muted', styles.eraOrg)}>{copy.org}</p>

                    <p className={cx('label', styles.fieldLabel)}>{d.practice.scopeLabel}</p>
                    <p className="measure">{copy.scope}</p>

                    {/* The column no résumé has. It is the reason this page
                        is in the same product as TRACE. */}
                    <p className={cx('label', styles.fieldLabel)}>{d.practice.changedLabel}</p>
                    <p className={cx('measure', styles.changed)}>{copy.changed}</p>

                    {era.evidence.length > 0 && (
                      <>
                        <p className={cx('label', styles.fieldLabel)}>
                          {d.practice.evidenceLabel}
                        </p>
                        <EvidenceLinks refs={era.evidence} locale={locale} />
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ---- DENSE · CAPABILITIES ------------------------------------- */}
      <section
        data-tone="dark"
        data-density="dense"
        className={styles.beat}
        aria-labelledby="caps-title"
      >
        <div className="wrap">
          <hr className="rule draw" />
          <h2 id="caps-title" className={cx('h2', 'beat', styles.beatTitle)}>
            {d.practice.capabilitiesHeading}
          </h2>

          <p className={cx('small', 'muted', 'measure', styles.orgNote)}>
            {d.practice.capabilitiesNote}
          </p>

          {byGroup.map(({ group, items }) => (
            <section key={group} className={styles.group} aria-labelledby={`group-${group}`}>
              <h3 id={`group-${group}`} className={cx('label', styles.groupName)}>
                {d.practice.groups[group]}
              </h3>

              <ul className={styles.caps}>
                {items.map((c) => (
                  <CapabilityRow key={c.id} c={c} locale={locale} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      {/* ---- CALM · STUDY AND CONTACT --------------------------------- */}
      <section data-tone="light" data-density="calm" className={styles.closing}>
        <div className="wrap">
          <hr className="ruleStrong" />

          <div className={styles.closingGrid}>
            <div>
              <h2 className={cx('label', styles.closingHead)}>{d.practice.studyHeading}</h2>
              <ul className={styles.study}>
                {STUDY.map((s) => (
                  <li key={s.id}>
                    <p className={cx('label', 'muted', styles.period)}>
                      {dot(s.from)} — {s.to ? dot(s.to) : d.practice.present}
                    </p>
                    <p>{d.practice.study[s.id as keyof typeof d.practice.study]}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className={cx('label', styles.closingHead)}>{d.practice.contactHeading}</h2>
              <p className="measure">
                <a href={`https://github.com/${REPO.owner}`} rel="me noopener">
                  {d.practice.contactGithub}
                </a>
              </p>
              <p className={cx('small', 'muted', 'measure', styles.contactNote)}>
                {d.practice.contactNote}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* One capability                                                      */
/* ------------------------------------------------------------------ */

/**
 * A row that states its own standing.
 *
 * Three visual states, and the marked two are the point of the page:
 *
 *   proven    a count and the entries behind it
 *   unproven  claimed on the CV, nothing here — struck count, named as such
 *   surplus   not on the CV, evidenced here — accent mark
 *
 * The count is a count. There is no bar, no percentage and no level, because
 * every one of those would be a number with nothing behind it sitting beside
 * numbers that all link to something.
 */
function CapabilityRow({ c, locale }: { c: Capability; locale: Locale }) {
  const d = dict(locale)
  const n = c.evidence.length
  const unproven = c.claimed && n === 0
  const surplus = !c.claimed && n > 0

  return (
    <li
      className={cx(
        styles.cap,
        unproven && styles.capUnproven,
        surplus && styles.capSurplus,
      )}
    >
      <div className={styles.capHead}>
        <p className={styles.capName}>
          {d.practice.capabilities[c.id as keyof typeof d.practice.capabilities]}
        </p>
        <p className={cx('label', styles.capCount)}>
          {n === 0
            ? d.practice.noEvidence
            : tn(d.practice.evidenceCountOne, d.practice.evidenceCount, n)}
        </p>
      </div>

      {unproven && (
        <p className={cx('small', styles.capNote)}>{d.practice.claimedUnproven}</p>
      )}
      {surplus && (
        <p className={cx('small', styles.capNote)}>{d.practice.unclaimedProven}</p>
      )}

      <EvidenceLinks refs={c.evidence} locale={locale} />
    </li>
  )
}
