import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'

import { DisplayLines } from '@/components/DisplayLines'
import { Section } from '@/components/Section'
import { Sigil } from '@/components/Sigil'
import { Weight } from '@/components/Weight'
import { cx } from '@/lib/cx'
import { isLocale, localePath, t } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { commits, historyForChapter } from '@/lib/git/load'
import { SECTIONS } from '@/lib/sections'
import { sigilFrom, SIGIL_SLOTS } from '@/lib/sigil'
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

  /* The headline already said "in progress". The record already knew how far
     along it is. They were two separate claims on one screen until this made
     them the same one. */
  const all = commits()
  const mark = sigilFrom(all)
  const fill = Math.round((mark.used / SIGIL_SLOTS) * 1000) / 10

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
            <span
              className={cx('accentBlock', 'markWipe', styles.gauge)}
              style={{ ['--fill' as string]: `${fill}%` }}
            >
              in progress
            </span>
          </h1>

          <p className="lead measure balance trail">{d.site.statement}</p>

          <div className={styles.heroFoot}>
            {/* Axes and hint are ONE child. `justify-content: space-between`
                counts children, not meanings, so a third one here would push
                this pair off the edges — which is exactly what a third child
                did to the nav rail before it was grouped. */}
            <div className={styles.heroMeta}>
              <div className={cx('label', 'focusGroup', 'onLoad', styles.axes)}>
                {SECTIONS.map((s) => (
                  <a key={s.id} href={`#${s.id}`}>
                    {s.index} {s.label}
                  </a>
                ))}
              </div>
              <p className="label onLoad">{d.home.scrollHint}</p>
            </div>

            {/* A seal at the foot of the first screen. It is computed from the
                repository, so it is the one element of this page that nobody
                else could put on theirs. */}
            <Sigil
              spin
              label={d.sigil.label}
              className={cx('onLoad', styles.heroSeal)}
            />
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
              {/* Each beat carries the work that went into it. Four beats
                  from one template read as four copies of one beat; the marks
                  are the only thing on this page that differs between them
                  because of something real. Static, not spinning: the wedge
                  positions are the claim. */}
              <Sigil
                id={`ch-${s.id}`}
                commits={historyForChapter(s.id)}
                within={all}
                label={d.sigil.chapterLabel}
                className={styles.chapterMark}
              />

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

          {/* The last line of the page is what the page cost. The budget was
              an internal gate nobody reading the site could see; this is the
              same number, published. */}
          <Weight route={localePath(lang, '/')} template={d.weight.thisPage} />
        </div>
      </Section>
    </>
  )
}
