import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'

import { DisplayLines } from '@/components/DisplayLines'
import { Section } from '@/components/Section'
import { cx } from '@/lib/cx'
import { isLocale, localePath, t } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { SECTIONS } from '@/lib/sections'
import { site } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * THE GOLDEN PATH.
 *
 * Scrolling this page once is a complete visit: a reader who never clicks
 * anything has still met the whole person. The four depth routes are an
 * offer, not a requirement — which is why each chapter states its own case
 * here and only then points inward.
 *
 * The tone score is calm → dense → dense → calm → calm, taken from
 * lib/sections.ts so the golden path and the depth routes cannot drift.
 */
export default async function GoldenPath({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = dict(lang)

  return (
    <>
      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="hero-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label onLoad">{site.title}</p>

          <h1
            id="hero-title"
            className={cx('display', 'type', styles.heroTitle)}
            lang="en"
          >
            <DisplayLines lines={['An interface', 'for a life']} />
            <br />
            <span className="accentBlock markWipe">in progress</span>
          </h1>

          <p className="lead measure balance trail">{d.site.statement}</p>

          <div className={styles.heroFoot}>
            <div className={cx('label', 'focusGroup', 'onLoad', styles.axes)}>
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`}>
                  {s.index} {s.label}
                </a>
              ))}
            </div>
            <p className="label onLoad">{d.home.scrollHint}</p>
          </div>
        </div>
      </section>

      {SECTIONS.map((s) => (
        <Section
          key={s.id}
          id={s.id}
          tone={s.tone}
          density={s.density}
          index={s.index}
          title={s.label}
        >
          <div className={styles.chapter}>
            <div>
              <p className={cx('label', styles.chapterQuestion)}>{d.sections[s.id].question}</p>
              {/* Named so the browser can carry this headline into the depth
                  route instead of cutting to an unrelated page. */}
              <ViewTransition name={`chapter-${s.id}`}>
                <h2 className="h1 typeScroll balance" lang="en">
                  <DisplayLines lines={s.titleLines} />
                </h2>
              </ViewTransition>
            </div>

            <div className={styles.chapterAside}>
              <p className="small muted trail">{d.sections[s.id].blurb}</p>
              <Link
                href={localePath(lang, `/${s.id}`)}
                className={cx('label', 'accentRise', styles.enter)}
              >
                <span className={styles.enterLabel}>{t(d.home.enter, { label: s.label })}</span>
                <span className={styles.enterArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </Section>
      ))}

      <Section tone="light" density="calm">
        <div className={styles.closing}>
          <hr className="ruleStrong" />
          <p className="lead measure" lang="en">
            {site.tagline}
          </p>
          <p className="label muted">
            {site.title} · {site.name} ·{' '}
            <Link href={localePath(lang, '/art-direction')}>{d.home.artDirection}</Link>
          </p>
        </div>
      </Section>
    </>
  )
}
