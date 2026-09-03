import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { Prose } from '@/components/Prose'
import { RegisterSwitch } from '@/components/RegisterSwitch'
import { Section } from '@/components/Section'
import { allEli5Params, getEli5, getEntry } from '@/lib/content/load'
import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { isLocale, localePath, LOCALE_META, t, type Locale } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { getSection, isSectionId } from '@/lib/sections'
import { site } from '@/lib/site.config'
import styles from '../page.module.css'

/**
 * The same entry, in plain words.
 *
 * A route rather than a control, because a register a reader can send to
 * someone else is worth a URL — see components/RegisterSwitch.tsx for why
 * this is not a toggle over two hidden copies.
 *
 * Deliberately THINNER than the entry page. The decision slab, the sigil and
 * the commit list are all provenance — the part of the page that says who
 * built this and when — and provenance does not get easier by being retold.
 * A reader who came here for shorter sentences is not helped by the same
 * apparatus in shorter sentences; they can step back to the entry, which is
 * the last link on the page.
 */

type Params = { lang: string; section: string; slug: string }

export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return allEli5Params()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lang, section, slug } = await params
  if (!isSectionId(section) || !isLocale(lang)) return {}
  const eli5 = getEli5(section, slug, lang)
  if (!eli5) return {}

  /*
   * noindex, follow.
   *
   * This page restates an entry that is already indexed at its own address,
   * in words nobody wrote by hand. Indexing it asks a search engine to
   * choose between two pages making the same claim, and the one it might
   * pick is the one this site does not stand behind — the whole premise
   * here is that the prose is the evidence. `follow` stays on so the links
   * out of it, including the one back to the entry, still carry.
   *
   * It is left out of app/sitemap.ts for the same reason. Readers reach it
   * from the switch on the entry; crawlers are told not to bother.
   */
  return {
    ...pageMetadata({
      lang,
      path: `/${section}/${slug}/eli5`,
      title: eli5.title,
      description: eli5.summary,
    }),
    robots: { index: false, follow: true },
  }
}

export default async function Eli5Page({
  params,
}: {
  params: Promise<Params>
}) {
  const { lang, section, slug } = await params
  if (!isSectionId(section) || !isLocale(lang)) notFound()
  const locale: Locale = lang
  const d = dict(locale)

  const entry = getEntry(section, slug, locale)
  const eli5 = getEli5(section, slug, locale)
  const chapter = getSection(section)
  if (!entry || !eli5 || !chapter) notFound()

  const path = `/${entry.chapter}/${entry.slug}`

  return (
    <>
      {/* Breadcrumb only. No Article schema: the entry already publishes one
          for this material, and a second would be two articles claiming the
          same date, author and subject. */}
      <JsonLd
        data={breadcrumbSchema(locale, [
          { name: site.title, path: '/' },
          { name: chapter.label, path: `/${chapter.id}` },
          { name: entry.title, path },
          { name: eli5.title, path: `${path}/eli5` },
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

          <RegisterSwitch
            locale={locale}
            path={path}
            current="eli5"
            full={d.entry.registerFull}
            plain={d.entry.registerPlain}
            label={d.entry.registerLabel}
          />

          <h1
            className={cx('h2', 'beat', styles.title)}
            lang={LOCALE_META[eli5.locale].lang}
          >
            {eli5.title}
          </h1>

          <p className="lead measure balance trail">{eli5.summary}</p>

          <p className={cx('label', styles.byline)}>
            <span>{formatDate(entry.date)}</span>
            <span>{t(d.entry.plainReadingMinutes, { n: eli5.readingMinutes })}</span>
          </p>

          {/* Said before the prose, not after it. A reader who is going to
              decide this page is not the author's writing should get to
              decide it before reading a page of it. */}
          <p className={cx('small', styles.notice)}>
            {d.entry.plainNotice}
            {!eli5.authored && ` ${d.entry.plainMachine}`}
          </p>

          {!eli5.translated && (
            <p className={cx('small', 'muted', styles.untranslated)}>
              {d.entry.untranslated}
            </p>
          )}
        </div>
      </Section>

      {/* The body. */}
      <Section tone="light" density="dense">
        <Prose source={eli5.body} />

        <div className={cx('label', styles.facts)}>
          <Link href={localePath(locale, path)}>
            {d.entry.registerFull} — {entry.title} →
          </Link>
        </div>
      </Section>
    </>
  )
}
