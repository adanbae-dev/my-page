import Link from 'next/link'

import { cx } from '@/lib/cx'
import { localePath, type Locale } from '@/lib/i18n/config'
import { TOPIC_IDS, type TopicId } from '@/lib/topics'
import styles from './TopicFilter.module.css'

/**
 * The topic rail — links, one per topic that has entries.
 *
 * Server-rendered anchors rather than a control. On a topic page this IS the
 * navigation, so it has to be crawlable and it has to work with JavaScript
 * off. The instant, no-navigation version lives in TopicScope and is used
 * where a list is already on screen.
 */
export function TopicFilter({
  lang,
  current,
  counts,
  labels,
}: {
  lang: Locale
  /** Marked as current; omit on pages that are not a topic page. */
  current?: TopicId
  counts: Readonly<Record<TopicId, number>>
  labels: {
    all: string
    filterLabel: string
    names: Record<string, string>
  }
}) {
  const available = TOPIC_IDS.filter((t) => counts[t] > 0)

  return (
    <nav className={styles.rail} aria-label={labels.filterLabel}>
      <ul className={cx('label', 'focusGroup', styles.list)}>
        {available.map((topic) => {
          const isCurrent = topic === current
          return (
            <li key={topic}>
              <Link
                href={localePath(lang, `/topic/${topic}`)}
                className={cx('tilt', styles.chip, isCurrent && styles.chipCurrent)}
                {...(isCurrent ? { 'aria-current': 'page' } : {})}
              >
                {labels.names[topic]}
                {/* The count is the honest part: it says how much is behind
                    the link before anyone spends a navigation on it. */}
                <span className={styles.count}>{counts[topic]}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
