import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'

import { DisplayLines } from '@/components/DisplayLines'
import { EntryList } from '@/components/EntryList'
import { FieldMount } from '@/components/field/FieldMount'
import { Section } from '@/components/Section'
import { archive, entriesFor } from '@/lib/content/load'
import { toField } from '@/lib/field'
import { cx } from '@/lib/cx'
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

type Params = { section: string }

/** Only the four chapters exist. Anything else is a 404, not a blank page. */
export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return SECTIONS.map((s) => ({ section: s.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { section } = await params
  const def = getSection(section)
  if (!def) return {}
  return {
    title: def.label,
    description: `${def.question} — ${def.blurb}`,
  }
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
  const { section } = await params
  const def = getSection(section)
  if (!def) notFound()

  const { prev, next } = neighbours(def.id)

  // TRACE is the archive of everything, not a fifth pile of posts: it merges
  // every chapter's entries with its own logs into one chronological stream.
  const isArchive = def.id === 'trace'
  const entries = isArchive ? archive() : entriesFor(def.id)

  return (
    <>
      {/* Calm — arrival */}
      <section
        data-tone="light"
        data-density="calm"
        className={styles.head}
        aria-labelledby="chapter-title"
      >
        <div className="wrap">
          <p className={cx('label', styles.crumb)}>
            <Link href="/">← Golden path</Link>
            <span>
              {def.index} / {def.label}
            </span>
          </p>

          {/* Same name as the heading on the golden path, so the browser
              carries it across the navigation instead of cutting. */}
          <ViewTransition name={`chapter-${def.id}`}>
            <h1 id="chapter-title" className={cx('h1', styles.title)} lang="en">
              <DisplayLines lines={def.titleLines} />
            </h1>
          </ViewTransition>

          <p className="lead measure">{def.blurb}</p>
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
            <h2 className="h3">{def.question}</h2>
            <p className="small muted measure">
              {isArchive
                ? '이 구간은 다른 세 구간에서 쌓인 기록과 이곳의 자체 기록을 하나의 시간축으로 합칩니다. 별도로 관리되는 목록이 아니라, 작업에서 파생된 흔적입니다.'
                : def.blurb}
            </p>
            <p className={cx('label', styles.count)}>
              {entries.length} {isArchive ? 'RECORDS' : 'ENTRIES'}
            </p>
          </div>

          <div>
            {isArchive && <FieldMount data={toField(entries)} />}
            <EntryList
              entries={entries}
              showOrigin={isArchive}
              emptyMessage={
                isArchive
                  ? '아직 기록이 없습니다.'
                  : `${def.label} 구간은 아직 비어 있습니다.`
              }
            />
          </div>
        </div>
      </Section>

      {/* Calm — departure */}
      <Section tone="light" density="calm">
        <hr className="ruleStrong" />
        <div className={styles.foot} style={{ marginBlockStart: 'var(--space-m)' }}>
          {prev && (
            <Link href={`/${prev.id}`} className={styles.step}>
              <span className="label muted">← {prev.index} 이전</span>
              <span className="h3" lang="en">
                {prev.label}
              </span>
            </Link>
          )}
          {next && (
            <Link href={`/${next.id}`} className={cx(styles.step, styles.stepNext)}>
              <span className="label muted">{next.index} 다음 →</span>
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
