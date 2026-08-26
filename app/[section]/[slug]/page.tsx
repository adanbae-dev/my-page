import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { Prose } from '@/components/Prose'
import { Section } from '@/components/Section'
import { allParams, entryNeighbours, getEntry, isWork } from '@/lib/content/load'
import { historyFor } from '@/lib/git/load'
import { LOG_KIND_LABEL, type Entry } from '@/lib/content/schema'
import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { getSection, isSectionId } from '@/lib/sections'
import { commitUrl, person, site, url } from '@/lib/site.config'
import styles from './page.module.css'

type Params = { section: string; slug: string }

export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return allParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { section, slug } = await params
  if (!isSectionId(section)) return {}
  const entry = getEntry(section, slug)
  if (!entry) return {}
  return {
    title: entry.title,
    description: entry.summary,
    alternates: { canonical: `/${section}/${slug}` },
    openGraph: {
      type: 'article',
      url: `/${section}/${slug}`,
      title: entry.title,
      description: entry.summary,
      publishedTime: entry.date,
      ...(entry.chapter === 'think' && entry.updated
        ? { modifiedTime: entry.updated }
        : {}),
      tags: [...entry.tags],
    },
  }
}

/** The metadata line under the title — different per chapter, on purpose. */
function byline(entry: Entry): string[] {
  const base = [formatDate(entry.date)]
  switch (entry.chapter) {
    case 'think':
      return [
        ...base,
        ...(entry.updated ? [`고침 ${formatDate(entry.updated)}`] : []),
        `약 ${entry.readingMinutes}분`,
      ]
    case 'make':
      return [...base, entry.period, entry.role]
    case 'live':
      return entry.place ? [...base, entry.place] : base
    case 'trace':
      return [...base, LOG_KIND_LABEL[entry.kind]]
  }
}

export default async function EntryPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { section, slug } = await params
  if (!isSectionId(section)) notFound()

  const entry = getEntry(section, slug)
  const chapter = getSection(section)
  if (!entry || !chapter) notFound()

  const { newer, older } = entryNeighbours(section, slug)

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
          inLanguage: site.lang,
          keywords: entry.tags.join(', '),
          articleSection: chapter.label,
          mainEntityOfPage: url(`/${entry.chapter}/${entry.slug}`),
          author: person(),
          publisher: person(),
        }}
      />
      {/* Calm — arrival */}
      <Section tone="light" density="calm">
        <div className={styles.head}>
          <p className={cx('label', styles.crumb)}>
            <Link href={`/${chapter.id}`}>
              ← {chapter.index} {chapter.label}
            </Link>
            <span>{chapter.question}</span>
          </p>

          <h1 className={cx('h2', styles.title)} lang="ko">
            {entry.title}
          </h1>

          <p className="lead measure">{entry.summary}</p>

          <p className={cx('label', styles.byline)}>
            {byline(entry).map((bit) => (
              <span key={bit}>{bit}</span>
            ))}
          </p>
        </div>
      </Section>

      {/* Dense — the decisions. Only MAKE carries the full slab; the fields
          exist because the brief promised decisions rather than screenshots. */}
      {isWork(entry) && (
        <Section tone="dark" density="dense" index={chapter.index} title="Decisions">
          <div className={styles.decisions}>
            <div className={styles.decision}>
              <p className={cx('label', styles.decisionLabel)}>제약</p>
              <p className="small">{entry.constraint}</p>
            </div>
            <div className={styles.decision}>
              <p className={cx('label', styles.decisionLabel)}>포기한 것</p>
              <p className="small">{entry.tradeoff}</p>
            </div>
            <div className={styles.decision}>
              <p className={cx('label', styles.decisionLabel)}>남은 것</p>
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
            <p className={cx('label', styles.provenanceHead)}>기록</p>

            <p className="small">
              {formatDate(born.date)}에 처음 커밋됐고,{' '}
              {history.length === 1
                ? '이후 손대지 않았습니다.'
                : `이후 ${history.length - 1}번 더 손댔습니다.`}
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
              <Link href="/build">전체 빌드 기록 →</Link>
            </p>
          </div>
        )}
      </Section>

      {/* Calm — departure */}
      <Section tone="light" density="calm">
        <hr className="ruleStrong" />
        <div className={styles.foot}>
          {newer && (
            <Link href={`/${newer.chapter}/${newer.slug}`} className={styles.step}>
              <span className="label muted">← 다음 글</span>
              <span className={styles.stepTitle}>{newer.title}</span>
            </Link>
          )}
          {older && (
            <Link
              href={`/${older.chapter}/${older.slug}`}
              className={cx(styles.step, styles.stepOlder)}
            >
              <span className="label muted">이전 글 →</span>
              <span className={styles.stepTitle}>{older.title}</span>
            </Link>
          )}
        </div>
      </Section>
    </>
  )
}
