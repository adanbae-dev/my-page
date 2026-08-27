import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'

import { DisplayLines } from '@/components/DisplayLines'
import { EntryList } from '@/components/EntryList'
import { FieldMount } from '@/components/field/FieldMount'
import { JsonLd } from '@/components/JsonLd'
import { TopicScope } from '@/components/TopicScope'
import { Section } from '@/components/Section'
import { archive, entriesFor, topicCounts } from '@/lib/content/load'
import { toField } from '@/lib/field'
import { cx } from '@/lib/cx'
import { isLocale, localePath, LOCALES, t } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { site } from '@/lib/site.config'
import { breadcrumbSchema, collectionPageSchema, pageMetadata } from '@/lib/seo'
import { SECTIONS, getSection, neighbours } from '@/lib/sections'
import styles from './page.module.css'


/*
 * FieldMount is imported statically even though only TRACE renders it.
 *
 * next/dynamic was tried and MEASURED WORSE: the loader machinery it adds to
 * the route bundle (+0.9 KB) costs more than the 1.7 KB component it defers.
 * Below a certain size, deferring a component is a net loss — the heavy
 * thing here is Three.js, and that is deferred inside FieldMount itself.
 */

type Params = { lang: string; section: string }

/** Only the four chapters exist. Anything else is a 404, not a blank page. */
export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return LOCALES.flatMap((lang) => SECTIONS.map((s) => ({ lang, section: s.id })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lang, section } = await params
  const def = getSection(section)
  if (!def || !isLocale(lang)) return {}
  const d = dict(lang)
  const { question, blurb } = d.sections[def.id]
  const description = `${question} — ${blurb}`
  const path = `/${def.id}`
  return pageMetadata({
    lang,
    path,
    title: def.label,
    description,
  })
}

/**
 * A depth route.
 *
 * It performs the same Calm → Dense → Calm arc as the golden path rather
 * than dropping straight into the chapter's ground: the arc is a property of
 * the product, not of one page. Where the chapter's own tone is already
 * light (LIVE, TRACE) the middle beat is carried by density instead — which
 * is the whole reason tone and density are separate axes.
 */
export default async function SectionPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { lang, section } = await params
  const def = getSection(section)
  if (!def || !isLocale(lang)) notFound()
  const d = dict(lang)

  const { prev, next } = neighbours(def.id)

  // TRACE is the archive of everything, not a fifth pile of posts: it merges
  // every chapter's entries with its own logs into one chronological stream.
  const isArchive = def.id === 'trace'
  const entries = isArchive ? archive(lang) : entriesFor(def.id, lang)

  /* Counts are for THIS list, not the whole site: a filter offering a topic
     that would empty the list is a control that lies about what it does. */
  const counts = topicCounts(lang)
  const scoped = Object.fromEntries(
    (Object.keys(counts) as (keyof typeof counts)[]).map((k) => [
      k,
      entries.filter((e) => e.topics.includes(k)).length,
    ]),
  ) as typeof counts

  return (
    <>
      {/* A chapter is a list, so it says so in a form a machine can read:
          CollectionPage with every entry named in hasPart. Without it a
          crawler has to infer from prose that this page indexes work. */}
      <JsonLd
        data={collectionPageSchema({
          lang,
          section: def.id,
          name: `${def.label} — ${d.sections[def.id].question}`,
          description: isArchive ? d.chapter.archiveNote : d.sections[def.id].blurb,
          parts: entries.map((e) => ({
            title: e.title,
            chapter: e.chapter,
            slug: e.slug,
            date: e.date,
          })),
        })}
      />
      <JsonLd
        data={breadcrumbSchema(lang, [
          { name: site.title, path: '/' },
          { name: def.label, path: `/${def.id}` },
        ])}
      />

      {/* Calm — arrival */}
      <section
        data-tone="light"
        data-density="calm"
        className={styles.head}
        aria-labelledby="chapter-title"
      >
        <div className="wrap">
          <p className={cx('label', styles.crumb)}>
            <Link href={localePath(lang)}>{d.nav.backToGoldenPath}</Link>
            <span>
              {def.index} / {def.label}
            </span>
          </p>

          {/* Same name as the heading on the golden path, so the browser
              carries it across the navigation instead of cutting. */}
          <ViewTransition name={`chapter-${def.id}`}>
            <h1 id="chapter-title" className={cx('h1', 'arrive', styles.title)} lang="en">
              <DisplayLines lines={def.titleLines} />
            </h1>
          </ViewTransition>

          <p className="lead measure">{d.sections[def.id].blurb}</p>
        </div>
      </section>

      {/* Dense — the chapter's own ground */}
      <Section
        tone={def.tone}
        density="dense"
        index={def.index}
        title={def.label}
      >
        <div className={styles.body}>
          <div className="stack">
            <h2 className="h3">{d.sections[def.id].question}</h2>
            <p className="small muted measure">
              {isArchive ? d.chapter.archiveNote : d.sections[def.id].blurb}
            </p>
            <p className={cx('label', styles.count)}>
              {entries.length} {isArchive ? d.chapter.records : d.chapter.entries}
            </p>

            {/* The machine-written half of the same promise. It lives on its
                own route rather than in the chapter list because it is not an
                entry — nobody wrote it. */}
            {isArchive && (
              <p className="label">
                <Link href={localePath(lang, '/build')}>{d.chapter.buildLink}</Link>
              </p>
            )}
          </div>

          <div>
            {isArchive && <FieldMount data={toField(entries, d)} labels={d.field} />}
            <TopicScope
              counts={scoped}
              labels={{
                all: d.topics.all,
                filterLabel: d.topics.filterLabel,
                names: Object.fromEntries(
                  (Object.keys(scoped) as (keyof typeof scoped)[]).map((k) => [
                    k,
                    d.topics[k].name,
                  ]),
                ),
              }}
            >
              <EntryList
                entries={entries}
                locale={lang}
                showOrigin={isArchive}
                emptyMessage={
                  isArchive
                    ? d.chapter.emptyArchive
                    : t(d.chapter.emptyChapter, { label: def.label })
                }
              />
            </TopicScope>
          </div>
        </div>
      </Section>

      {/* Calm — departure */}
      <Section tone="light" density="calm">
        <hr className="ruleStrong" />
        <div className={styles.foot} style={{ marginBlockStart: 'var(--space-m)' }}>
          {prev && (
            <Link href={localePath(lang, `/${prev.id}`)} className={styles.step}>
              <span className="label muted">
                ← {t(d.chapter.prev, { index: prev.index })}
              </span>
              <span className="h3" lang="en">
                {prev.label}
              </span>
            </Link>
          )}
          {next && (
            <Link
              href={localePath(lang, `/${next.id}`)}
              className={cx(styles.step, styles.stepNext)}
            >
              <span className="label muted">
                {t(d.chapter.next, { index: next.index })} →
              </span>
              <span className="h3" lang="en">
                {next.label}
              </span>
            </Link>
          )}
        </div>
      </Section>
    </>
  )
}
