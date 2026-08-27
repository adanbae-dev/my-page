import Link from 'next/link'

import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import type { Entry } from '@/lib/content/schema'
import { localePath, t, type Locale } from '@/lib/i18n/config'
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
  entries: readonly Entry[]
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
          >
            <span className={cx('label', styles.meta)}>
              <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            </span>

            <span>
              <span className={styles.title} lang="ko">
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
