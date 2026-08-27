import Link from 'next/link'

import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import type { LocalisedEntry } from '@/lib/content/load'
import type { Entry } from '@/lib/content/schema'
import { localePath, LOCALE_META, t, type Locale } from '@/lib/i18n/config'
import { dict, type Dictionary } from '@/lib/i18n/dictionary'
import { getSection } from '@/lib/sections'
import styles from './EntryList.module.css'

/**
 * What each chapter puts in its trailing column.
 *
 * A single "posted on" list would have flattened four different kinds of
 * record into one. The chapter decides what is worth knowing before you
 * click: a work is identified by its role, a log by what kind of change it
 * was, a note by how long it takes to read.
 */
function trailing(entry: Entry, d: Dictionary): string {
  switch (entry.chapter) {
    case 'make':
      return entry.role
    case 'trace':
      return d.logKind[entry.kind]
    case 'live':
      return entry.place ?? ''
    case 'think':
      return t(d.entry.readingMinutes, { n: entry.readingMinutes })
  }
}

type EntryListProps = {
  entries: readonly LocalisedEntry[]
  locale: Locale
  /** Show which chapter each entry came from — used by the archive. */
  showOrigin?: boolean
  emptyMessage?: string
}

export function EntryList({
  entries,
  locale,
  showOrigin = false,
  emptyMessage,
}: EntryListProps) {
  const d = dict(locale)
  if (entries.length === 0) {
    return (
      <p className={cx('small', styles.empty)}>{emptyMessage ?? d.entry.empty}</p>
    )
  }

  return (
    <div className={styles.list}>
      {entries.map((entry) => {
        const origin = getSection(entry.chapter)
        return (
          <Link
            key={`${entry.chapter}/${entry.slug}`}
            href={localePath(locale, `/${entry.chapter}/${entry.slug}`)}
            className={cx('settle', styles.row)}
            // The row's own topics, space-separated, so TopicScope can filter
            // on them with `[data-topics~="x"]` and no JavaScript.
            data-topics={entry.topics.join(' ')}
          >
            <span className={cx('label', styles.meta)}>
              <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            </span>

            <span>
              {/* The entry's OWN language, not the page's. An untranslated
                  entry shows its Korean title on an English page, and a
                  screen reader has to be told that or it reads Hangul with an
                  English voice. This is why `locale` travels with the entry. */}
              {/* The same name on the article's own <h1>, so the browser
                  MORPHS this title into that one across the navigation
                  instead of cross-fading two unrelated pages. A name has to
                  be unique per document, and a slug already is.

                  Inline rather than in the stylesheet because the value is
                  data: there is no way to write one CSS rule that names N
                  rows. It costs html bytes on pages that have rows, and
                  nothing anywhere else. */}
              <span
                className={cx('rowMark', styles.title)}
                lang={LOCALE_META[entry.locale].lang}
                style={{ viewTransitionName: `entry-${entry.chapter}-${entry.slug}` }}
              >
                {entry.title}
              </span>
              <span className={cx('small', styles.summary)} style={{ display: 'block' }}>
                {entry.summary}
              </span>
            </span>

            <span className={cx('label', styles.trailing)}>
              {showOrigin && origin && (
                <span className={styles.origin}>{origin.label}</span>
              )}
              {showOrigin && trailing(entry, d) ? ' ' : ''}
              {trailing(entry, d)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
