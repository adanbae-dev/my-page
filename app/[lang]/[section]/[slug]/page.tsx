import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { Prose } from '@/components/Prose'
import { RegisterSwitch } from '@/components/RegisterSwitch'
import { Section } from '@/components/Section'
import { Sigil } from '@/components/Sigil'
import { allParams, entryNeighbours, getEntry, hasEli5, isWork } from '@/lib/content/load'
import { commits as allCommits, historyFor } from '@/lib/git/load'
import { type Entry } from '@/lib/content/schema'
import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { isLocale, localePath, LOCALE_META, t, type Locale } from '@/lib/i18n/config'
import { dict, type Dictionary } from '@/lib/i18n/dictionary'
import { breadcrumbSchema, countWords, pageMetadata } from '@/lib/seo'
import { getSection, isSectionId } from '@/lib/sections'
import { commitUrl, person, site, url } from '@/lib/site.config'
import styles from './page.module.css'

type Params = { lang: string; section: string; slug: string }

/* Next 16 requires this to be a literal boolean — a computed value is a build
   error ("Next.js can't recognize the exported `dynamicParams` field"), so the
   dev-only relaxation this route wants is not expressible. See lib/memo.ts. */
export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return allParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lang, section, slug } = await params
  if (!isSectionId(section) || !isLocale(lang)) return {}
  const entry = getEntry(section, slug, lang)
  if (!entry) return {}
  const path = `/${section}/${slug}`
  return pageMetadata({
    lang,
    path,
    title: entry.title,
    description: entry.summary,
    keywords: [
      ...entry.topics.map((tp) => dict(lang).topics[tp].name),
      ...entry.tags,
    ],
    article: {
      publishedTime: entry.date,
      ...(entry.chapter === 'think' && entry.updated
        ? { modifiedTime: entry.updated }
        : {}),
      tags: entry.tags,
    },
  })
}

/** The metadata line under the title — different per chapter, on purpose. */
function byline(entry: Entry, d: Dictionary): string[] {
  const base = [formatDate(entry.date)]
  switch (entry.chapter) {
    case 'think':
      return [
        ...base,
        ...(entry.updated
          ? [t(d.entry.updatedAt, { date: formatDate(entry.updated) })]
          : []),
        t(d.entry.readingMinutes, { n: entry.readingMinutes }),
      ]
    case 'make':
      return [...base, entry.period, entry.role]
    case 'live':
      return entry.place ? [...base, entry.place] : base
    case 'trace':
      return [...base, d.logKind[entry.kind]]
  }
}

export default async function EntryPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { lang, section, slug } = await params
  if (!isSectionId(section) || !isLocale(lang)) notFound()
  const locale: Locale = lang
  const d = dict(locale)

  const entry = getEntry(section, slug, locale)
  const chapter = getSection(section)
  if (!entry || !chapter) notFound()

  const { newer, older } = entryNeighbours(section, slug, locale)

  /* Offered only where a retelling exists. A switch with one working half is
     a promise the archive cannot keep — most entries have no plain version
     and some never will. */
  const plain = hasEli5(section, slug, locale)

  /*
   * Provenance, from the repository.
   *
   * Deliberately NOT merged into the `updated` frontmatter field, and the
   * temptation to do so is exactly why this comment exists. They are
   * different facts: `updated` is the author saying "I revised this",
   * while a commit is any change at all — a rename, a lint fix, a typo.
   * Collapsing them would derive an authored claim from a mechanical one
   * and produce the same drift the content model exists to prevent.
   */
  const history = historyFor(section, slug)
  const born = history[history.length - 1]

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: entry.title,
          description: entry.summary,
          datePublished: entry.date,
          dateModified:
            entry.chapter === 'think' && entry.updated ? entry.updated : entry.date,
          inLanguage: LOCALE_META[entry.locale].lang,
          keywords: entry.tags.join(', '),
          // Counted the way the reading estimate is: Hangul per character,
          // because a whitespace split under-reports Korean threefold.
          wordCount: countWords(entry.body),
          timeRequired: `PT${entry.readingMinutes}M`,
          articleSection: chapter.label,
          mainEntityOfPage: url(localePath(locale, `/${entry.chapter}/${entry.slug}`)),
          author: person(),
          publisher: person(),
        }}
      />
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: site.title, path: '/' },
          { name: chapter.label, path: `/${chapter.id}` },
          { name: entry.title, path: `/${entry.chapter}/${entry.slug}` },
        ])}
      />

      {/* Calm — arrival */}
      <Section tone="light" density="calm">
        <div className={styles.head}>
          <p className={cx('label', styles.crumb)}>
            <Link href={localePath(locale, `/${chapter.id}`)}>
              ← {chapter.index} {chapter.label}
            </Link>
            <span>{d.sections[chapter.id].question}</span>
          </p>

          {plain && (
            <RegisterSwitch
              locale={locale}
              path={`/${entry.chapter}/${entry.slug}`}
              current="full"
              full={d.entry.registerFull}
              plain={d.entry.registerPlain}
              label={d.entry.registerLabel}
            />
          )}

          {/* Paired with the same title in the list it was clicked from. */}
          <h1
            className={cx('h2', 'beat', styles.title)}
            lang={LOCALE_META[entry.locale].lang}
            style={{ viewTransitionName: `entry-${entry.chapter}-${entry.slug}` }}
          >
            {entry.title}
          </h1>

          <p className="lead measure balance trail">{entry.summary}</p>

          <p className={cx('label', styles.byline)}>
            {byline(entry, d).map((bit) => (
              <span key={bit}>{bit}</span>
            ))}
          </p>

          {/* The entry exists; its translation does not. Said plainly rather
              than hidden — an archive that shrinks per language is a filtered
              view, not a trace. */}
          {!entry.translated && (
            <p className={cx('small', 'muted', styles.untranslated)}>
              {d.entry.untranslated}
            </p>
          )}
        </div>
      </Section>

      {/* Dense — the decisions. Only MAKE carries the full slab; the fields
          exist because the brief promised decisions rather than screenshots. */}
      {isWork(entry) && (
        <Section tone="dark" density="dense" index={chapter.index} title={d.entry.decisions}>
          <div className={cx("layIn", styles.decisions)}>
            <div className={styles.decision}>
              <p className={cx('label', styles.decisionLabel)}>{d.entry.constraint}</p>
              <p className="small">{entry.constraint}</p>
            </div>
            <div className={styles.decision}>
              <p className={cx('label', styles.decisionLabel)}>{d.entry.tradeoff}</p>
              <p className="small">{entry.tradeoff}</p>
            </div>
            <div className={styles.decision}>
              <p className={cx('label', styles.decisionLabel)}>{d.entry.outcome}</p>
              <p className="small">{entry.outcome}</p>
            </div>
          </div>

          <div className={cx('label', styles.facts)}>
            <span className={styles.stack}>
              {entry.stack.map((s) => (
                <span key={s} className={styles.chip}>
                  {s}
                </span>
              ))}
            </span>
          </div>
        </Section>
      )}

      {/* The body. Long-form stays on the light ground: reading is the job
          here, and sustained reading on the dark ground costs more than the
          rhythm gains. Density carries the beat instead. */}
      <Section tone="light" density="dense">
        <Prose source={entry.body} />

        {/* Topics are links; tags below are not. That is the distinction:
            a topic is somewhere you can go, a tag is a fact about this
            entry. */}
        <div className={cx('label', styles.facts)}>
          {entry.topics.map((tp) => (
            <Link
              key={tp}
              href={localePath(locale, `/topic/${tp}`)}
              className={cx(styles.chip, styles.topicChip)}
            >
              {d.topics[tp].name}
            </Link>
          ))}
        </div>

        {entry.tags.length > 0 && (
          <div className={cx('label', styles.facts)}>
            {entry.tags.map((t) => (
              <span key={t} className={styles.chip}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* What the repository knows about this file. Nothing here is
            authored; it is all derived, the way the reading estimate is. */}
        {born && (
          <div className={styles.provenance}>
            <p className={cx('label', styles.provenanceHead)}>{d.entry.provenance}</p>

            {/* The site's mark with only this entry's commits lit. It sits
                here rather than in the header because it is a reading of the
                list below it, not a badge on the article. */}
            <Sigil
              id="prov"
              commits={history}
              within={allCommits()}
              label={d.sigil.entryLabel}
              className={styles.provenanceMark}
            />

            <p className="small">
              {t(d.entry.bornAt, { date: formatDate(born.date) })}{' '}
              {history.length === 1
                ? d.entry.untouched
                : t(d.entry.touchedAgain, { n: history.length - 1 })}
            </p>

            <ul className={styles.commits}>
              {history.map((c) => (
                <li key={c.sha}>
                  <a href={commitUrl(c.sha)} className={styles.sha} rel="noreferrer">
                    {c.sha}
                  </a>
                  <time className="label muted" dateTime={c.date}>
                    {formatDate(c.date)}
                  </time>
                  <span className="small">{c.subject}</span>
                </li>
              ))}
            </ul>

            <p className="label">
              <Link href={localePath(locale, '/build')}>
                {d.entry.fullBuildRecord}
              </Link>
            </p>
          </div>
        )}
      </Section>

      {/* Calm — departure */}
      <Section tone="light" density="calm">
        <hr className="ruleStrong" />
        <div className={styles.foot}>
          {newer && (
            <Link
              href={localePath(locale, `/${newer.chapter}/${newer.slug}`)}
              className={styles.step}
            >
              <span className="label muted">{d.entry.newer}</span>
              <span className={styles.stepTitle}>{newer.title}</span>
            </Link>
          )}
          {older && (
            <Link
              href={localePath(locale, `/${older.chapter}/${older.slug}`)}
              className={cx(styles.step, styles.stepOlder)}
            >
              <span className="label muted">{d.entry.older}</span>
              <span className={styles.stepTitle}>{older.title}</span>
            </Link>
          )}
        </div>
      </Section>
    </>
  )
}
