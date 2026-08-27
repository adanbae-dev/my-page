import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'
import { TOPIC_IDS, type TopicId } from '@/lib/topics'
import styles from './TopicScope.module.css'

/**
 * Narrow a list by topic, instantly, with no JavaScript.
 *
 * A radio group and `:has()`. Checking a radio makes the wrapper match
 * `:has(input[value="x"]:checked)`, and one static rule per topic hides the
 * rows whose `data-topics` does not contain x. The browser does the work the
 * frame it happens — nothing to hydrate, nothing to load, and it keeps
 * working if scripting is off.
 *
 * A JavaScript filter was not an option and that turned out to be the right
 * constraint, the same way it was for the scroll animations. The shared
 * bundle has about 3 KB of headroom and the route total is at 98% of budget,
 * so a search index plus a runtime would not have fitted. What would have
 * fitted is worse than this: this cannot fall out of sync with the markup,
 * because the markup is the state.
 *
 * The rules are static because the vocabulary is CONTROLLED — seven topics,
 * declared in lib/topics.ts. With free-form tags this would have had to be
 * generated per page into an inline <style>, which is exactly the kind of
 * thing that grows without anyone noticing.
 *
 * It is a filter, not navigation: the topic pages are the crawlable,
 * linkable version. This is for a list already on screen.
 */
export function TopicScope({
  counts,
  labels,
  children,
}: {
  counts: Readonly<Record<TopicId, number>>
  labels: {
    all: string
    filterLabel: string
    names: Record<string, string>
  }
  /** The list to narrow. Rows must carry `data-topics`. */
  children: ReactNode
}) {
  const available = TOPIC_IDS.filter((t) => counts[t] > 0)
  if (available.length === 0) return <>{children}</>

  return (
    <div className={styles.scope}>
      <fieldset className={styles.set}>
        <legend className={cx('label', styles.legend)}>{labels.filterLabel}</legend>

        <div className={cx('label', styles.options)}>
          {/* `all` is a real radio rather than a reset button: with no
              JavaScript, returning to the unfiltered list has to be a state
              the form can hold. */}
          <input
            type="radio"
            name="topic-scope"
            id="topic-scope-all"
            value="all"
            defaultChecked
            className={styles.input}
          />
          <label htmlFor="topic-scope-all" className={styles.option}>
            {labels.all}
          </label>

          {available.map((topic) => (
            <span key={topic} className={styles.pair}>
              <input
                type="radio"
                name="topic-scope"
                id={`topic-scope-${topic}`}
                value={topic}
                className={styles.input}
              />
              <label htmlFor={`topic-scope-${topic}`} className={styles.option}>
                {labels.names[topic]}
                <span className={styles.count}>{counts[topic]}</span>
              </label>
            </span>
          ))}
        </div>
      </fieldset>

      <div className={styles.body}>{children}</div>
    </div>
  )
}
