import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n/config'
import { KB, PCT, perf, weightOf } from '@/lib/perf'

/**
 * What this page weighs, stated on the page.
 *
 * Not a badge. The number is the same one `pnpm check:budget` fails the build
 * over, read from a committed snapshot, and it is placed where the page is
 * already talking about itself. A visitor can check it: the figure is a gzip
 * transfer size and a browser's network panel will agree with it.
 *
 * Styled with the global label utilities only — no module of its own. The CSS
 * budget was at 93% when this was written and a readout of five numbers is not
 * worth the last 0.7 KB of it.
 */
export function Weight({
  route,
  /** `{kb} {limit} {pct} {date} {head}` are filled in. */
  template,
  className,
}: {
  /** The full route path, locale included, e.g. `/ko/build`. */
  route: string
  template: string
  className?: string
}) {
  const snap = perf()
  const weight = weightOf(route)
  if (!snap || !weight) return null

  const limit = snap.budgets['total']
  if (limit === undefined) return null

  return (
    <p className={cx('label', 'muted', className)}>
      {t(template, {
        kb: KB(weight.total),
        limit: KB(limit),
        pct: PCT(weight.total, limit),
        date: snap.generatedAt,
        head: snap.head,
      })}
    </p>
  )
}
