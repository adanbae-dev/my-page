import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EntryList } from '@/components/EntryList'
import { FieldMount } from '@/components/field/FieldMount'
import { JsonLd } from '@/components/JsonLd'
import { Section } from '@/components/Section'
import { TopicFilter } from '@/components/TopicFilter'
import { allTopicParams, entriesForTopic, topicCounts } from '@/lib/content/load'
import { cx } from '@/lib/cx'
import { FIELD_MIN_LANES, laneCount, toField } from '@/lib/field'
import { isLocale, localePath, t } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { breadcrumbSchema, collectionPageSchema, pageMetadata } from '@/lib/seo'
import { site } from '@/lib/site.config'
import { isTopicId } from '@/lib/topics'
import styles from './page.module.css'

/**
 * A topic page.
 *
 * The chapters answer "what kind of thing is this" — a note, a case, a log.
 * A topic cuts the other way: everything about debugging, whichever chapter
 * it lives in. Both axes are needed because an entry has both properties, and
 * collapsing them would make one of the two questions unanswerable.
 *
 * Prerendered, one page per topic per locale, from the controlled vocabulary
 * in lib/topics.ts. Nothing here is dynamic and nothing is client-side.
 */

type Params = { lang: string; topic: string }

export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return allTopicParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lang, topic } = await params
  if (!isLocale(lang) || !isTopicId(topic)) return {}
  const d = dict(lang)
  const meta = d.topics[topic]
  return pageMetadata({
    lang,
    path: `/topic/${topic}`,
    title: meta.name,
    description: meta.blurb,
  })
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { lang, topic } = await params
  if (!isLocale(lang) || !isTopicId(topic)) notFound()
  const d = dict(lang)
  const meta = d.topics[topic]
  const entries = entriesForTopic(topic, lang)
  const counts = topicCounts(lang)

  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          lang,
          section: 'trace',
          name: meta.name,
          description: meta.blurb,
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
          { name: d.topics.label, path: `/topic/${topic}` },
          { name: meta.name, path: `/topic/${topic}` },
        ])}
      />

      {/* Calm — arrival */}
      <section
        data-tone="light"
        data-density="calm"
        className={styles.head}
        aria-labelledby="topic-title"
      >
        <div className="wrap">
          <p className={cx('label', styles.crumb)}>
            <Link href={localePath(lang)}>{d.nav.backToGoldenPath}</Link>
            <span>{d.topics.label}</span>
          </p>

          <h1 id="topic-title" className={cx('h1', 'arrive', 'balance', styles.title)}>
            {meta.name}
          </h1>

          <p className="lead measure balance trail">{meta.blurb}</p>
        </div>
      </section>

      {/* Dense — the entries, plus the way across to the other topics */}
      <Section tone="light" density="dense" index="—" title={d.topics.label}>
        <TopicFilter
          lang={lang}
          current={topic}
          counts={counts}
          labels={{
            all: d.topics.all,
            filterLabel: d.topics.filterLabel,
            names: Object.fromEntries(
              (Object.keys(counts) as (keyof typeof counts)[]).map((k) => [
                k,
                d.topics[k].name,
              ]),
            ),
          }}
        />

        <p className={cx('label', 'muted', styles.count)}>
          {t(d.topics.countOf, { n: entries.length })}
        </p>

        {/* The same spatial view TRACE offers, scoped to this topic — and it
            costs nothing new: it is the deferred Three.js chunk that already
            exists, behind the same button and the same capability probe. A
            topic is a slice through the timeline, which is exactly what this
            scene draws. */}
        {laneCount(entries) >= FIELD_MIN_LANES && (
          <FieldMount data={toField(entries, d, lang)} labels={d.field} />
        )}

        <EntryList entries={entries} locale={lang} showOrigin />
      </Section>
    </>
  )
}
