import type { ReactNode } from 'react'
import type { Density, Tone } from '@/lib/tone'
import styles from './Section.module.css'

type SectionProps = {
  /** Which side of the inversion this beat sits on. */
  tone: Tone
  /** Calm sections breathe; dense sections pack. Independent of tone. */
  density?: Density
  /** Two-digit beat number, e.g. "01". */
  index?: string
  /** Short uppercase name shown beside the index. */
  title?: string
  id?: string
  children: ReactNode
}

export function Section({
  tone,
  density = 'calm',
  index,
  title,
  id,
  children,
}: SectionProps) {
  const hasHead = Boolean(index ?? title)

  return (
    <section
      id={id}
      data-tone={tone}
      data-density={density}
      className={styles.section}
      {...(title ? { 'aria-label': title } : {})}
    >
      <div className="wrap">
        {hasHead && (
          <div className={styles.head}>
            <hr className="rule" />
            <div className={styles.headRow}>
              <p className={`label ${styles.title}`}>{title}</p>
              {index && <p className={`label ${styles.index}`}>{index}</p>}
            </div>
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
