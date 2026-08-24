import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'

import { DisplayLines } from '@/components/DisplayLines'
import { Section } from '@/components/Section'
import { cx } from '@/lib/cx'
import { SECTIONS, getSection, neighbours } from '@/lib/sections'
import styles from './page.module.css'

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
              이 구간의 내용은 Phase 2(Personal System)에서 채웁니다. 지금은
              들어갈 자리와 그 자리가 지켜야 할 규칙만 정해져 있습니다.
            </p>
          </div>

          <div className={styles.placeholder}>
            {[1, 2, 3].map((n) => (
              <div key={n} className={cx('label', styles.slot)}>
                <span>{String(n).padStart(2, '0')}</span>
                <span>{def.label} entry — Phase 2</span>
                <span>—</span>
              </div>
            ))}
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
