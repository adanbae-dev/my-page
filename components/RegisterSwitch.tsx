import Link from 'next/link'

import type { Register } from '@/lib/content/load'
import { cx } from '@/lib/cx'
import { localePath, type Locale } from '@/lib/i18n/config'
import styles from './RegisterSwitch.module.css'

/**
 * The full entry ⇄ the plain retelling.
 *
 * Two real URLs, not a control. Each register is prerendered at its own
 * address, so the choice survives being shared, bookmarked and crawled, and
 * it costs no client JavaScript. The alternative — one page holding both
 * bodies with a button hiding one — ships every reader twice the prose to
 * save them one navigation, on a site with a per-route HTML budget.
 *
 * The register you are already reading is a span rather than a link to
 * itself: a segmented control that looks clickable everywhere teaches that
 * one of its halves does nothing.
 */
export function RegisterSwitch({
  locale,
  path,
  current,
  full,
  plain,
  label,
}: {
  locale: Locale
  /** Locale-free path of the entry, e.g. `/think/why-contrast-came-first`. */
  path: string
  current: Register
  /** What to call the entry as its author wrote it. */
  full: string
  /** What to call the retelling. */
  plain: string
  /** Accessible name for the pair. */
  label: string
}) {
  return (
    <nav className={cx('label', styles.switch)} aria-label={label}>
      {current === 'full' ? (
        <span className={cx(styles.option, styles.current)} aria-current="page">
          {full}
        </span>
      ) : (
        <Link href={localePath(locale, path)} className={styles.option}>
          {full}
        </Link>
      )}

      {current === 'eli5' ? (
        <span className={cx(styles.option, styles.current)} aria-current="page">
          {plain}
        </span>
      ) : (
        <Link href={localePath(locale, `${path}/eli5`)} className={styles.option}>
          {plain}
        </Link>
      )}
    </nav>
  )
}
