import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DisplayLines } from '@/components/DisplayLines'
import { Section } from '@/components/Section'
import { Sigil } from '@/components/Sigil'
import { cx } from '@/lib/cx'
import { isLocale, localePath, t } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { commits, historyForChapter, stats } from '@/lib/git/load'
import { publishedEntries } from '@/lib/content/load'
import { formatDate } from '@/lib/format'
import { KB, PCT, perf, weightOf } from '@/lib/perf'
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
  const record = stats()
  const entries = publishedEntries(lang)
  const snap = perf()
  const here = weightOf(localePath(lang, '/'))
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
              style={{ ['--fill-target' as string]: `${fill}%` }}
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

      {SECTIONS.map((s, i) => (
        <Section
          key={s.id}
          id={s.id}
          tone={s.tone}
          density={s.density}
          index={s.index}
          title={s.label}
        >
          {/* Every other beat mirrors. Four beats out of one template put the
              title on the left four times, so the eye rode a single channel
              straight down the page — the beats were distinguishable but the
              SCROLL was not. Alternating the composition makes it move side to
              side, which is what a spread does and a feed does not.

              Explicit rather than :nth-of-type: the hero is a sibling section
              too, so a structural selector would count it and flip the wrong
              half. */}
          <div className={cx(styles.chapter, i % 2 === 1 && styles.chapterFlip)}>
            <div>
              <p className={cx('label', styles.chapterQuestion)}>{d.sections[s.id].question}</p>
                {/* The shared element that carries the headline from the
                    golden path into the chapter. A plain style property, not
                    React's <ViewTransition>: react 19.2.8 exports neither
                    `ViewTransition` nor `unstable_ViewTransition`, so that
                    wrapper applied no name at all — measured by sampling the
                    DOM inside document.startViewTransition, where the only
                    named elements were `root` and `brand`. The transition ran
                    and cross-faded the whole page instead of morphing the one
                    thing it was written for. This is the form that already
                    works here, in Nav.tsx and on the entry titles. */}
                <h2
                  className={cx('h1', 'beat', 'typeScroll', 'balance', styles.chapterTitle)}
                  lang="en"
                  style={{ viewTransitionName: `chapter-${s.id}` }}
                >
                  <DisplayLines lines={s.titleLines} />
                </h2>
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

          {/*
            A COLOPHON, the way a book carries one — set at the back, in small
            type, stating how the thing in your hands was made.

            Every figure is derived. That is the only reason this block can
            exist: a site without a build record has nothing to put here and
            would have to write a paragraph about craft instead. This one can
            print numbers, and each of them has a gate behind it that fails a
            build when it stops being true.
          */}
          <dl className={cx('label', styles.colophon)}>
            <div>
              <dt>{d.colophon.commits}</dt>
              <dd>{record.count}</dd>
            </div>
            <div className={styles.colophonWide}>
              <dt>{d.colophon.span}</dt>
              <dd>
                {record.first === record.last
                  ? formatDate(record.first)
                  : `${formatDate(record.first)} — ${formatDate(record.last)}`}
              </dd>
            </div>
            <div>
              <dt>{d.colophon.entries}</dt>
              <dd>{entries.length}</dd>
            </div>
            <div>
              <dt>{d.colophon.lines}</dt>
              <dd>+{record.insertions.toLocaleString('en-US')}</dd>
            </div>
            {here && snap?.budgets['total'] !== undefined && (
              <div>
                <dt>{d.colophon.weight}</dt>
                <dd>
                  {KB(here.total)} KB · {PCT(here.total, snap.budgets['total'])}%
                </dd>
              </div>
            )}
            {record.head && (
              <div>
                <dt>{d.colophon.head}</dt>
                <dd className={styles.colophonSha}>{record.head}</dd>
              </div>
            )}
          </dl>

          <p className="small muted measure">{d.colophon.note}</p>
        </div>
      </Section>
    </>
  )
}
