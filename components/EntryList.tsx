import Link from 'next/link'

import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import type { Entry } from '@/lib/content/schema'
import { LOG_KIND_LABEL } from '@/lib/content/schema'
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
function trailing(entry: Entry): string {
  switch (entry.chapter) {
    case 'make':
      return entry.role
    case 'trace':
      return LOG_KIND_LABEL[entry.kind]
    case 'live':
      return entry.place ?? ''
    case 'think':
      return `약 ${entry.readingMinutes}분`
  }
}

type EntryListProps = {
  entries: readonly Entry[]
  /** Show which chapter each entry came from — used by the archive. */
  showOrigin?: boolean
  emptyMessage?: string
}

export function EntryList({
  entries,
  showOrigin = false,
  emptyMessage = '아직 항목이 없습니다.',
}: EntryListProps) {
  if (entries.length === 0) {
    return <p className={cx('small', styles.empty)}>{emptyMessage}</p>
  }

  return (
    <div className={styles.list}>
      {entries.map((entry) => {
        const origin = getSection(entry.chapter)
        return (
          <Link
            key={`${entry.chapter}/${entry.slug}`}
            href={`/${entry.chapter}/${entry.slug}`}
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
              {showOrigin && trailing(entry) ? ' ' : ''}
              {trailing(entry)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
