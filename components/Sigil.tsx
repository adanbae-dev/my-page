import { commits as allCommits } from '@/lib/git/load'
import type { Commit } from '@/lib/git/schema'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n/config'
import { sigilFrom, SIGIL_SLOTS, SIGIL_VIEWBOX } from '@/lib/sigil'
import styles from './Sigil.module.css'

/** Paint order, back to front. */
const KINDS = ['tick', 'wedge', 'nub'] as const

/**
 * The generated mark. See lib/sigil.ts for what the geometry means.
 *
 * `commits` defaults to the WHOLE record on purpose. The mark's claim is that
 * it is this interface's history — handing it an arbitrary subset and calling
 * the result the site's identity would make it a decoration again. A subset
 * is still allowed, because one entry's own history is a legitimate smaller
 * version of the same claim, but the caller has to say so.
 *
 * Zero client JavaScript: three paths and a class. The dial rotation is a
 * scroll-driven CSS animation living with the other effects in
 * styles/interaction.css, so a browser without scroll timelines simply gets a
 * mark that does not turn.
 */
export function Sigil({
  commits = allCommits(),
  label,
  dial = false,
  id = 'sigil',
  className,
}: {
  commits?: readonly Commit[]
  /**
   * Required: the mark carries meaning, so it is an image, not decoration.
   *
   * A TEMPLATE, not a finished string — `{count} {used} {slots} {remaining}`
   * are filled in here. The numbers only exist after the geometry is folded,
   * and asking every caller to fold it first just to write a label would put
   * two copies of the same arithmetic in every page.
   */
  label: string
  /** Turn with the page scroll. */
  dial?: boolean
  /** Distinguishes this mark's shape ids from any other mark on the page. */
  id?: string
  className?: string
}) {
  const sigil = sigilFrom(commits)
  if (sigil.count === 0) return null

  /* Shape ids live in the document, not in the component, so two marks on one
     page would define the same id twice and the second set would be ignored.
     `id` is the caller's handle for telling them apart. */
  const idPrefix = `${id}-`

  return (
    <svg
      viewBox={`0 0 ${SIGIL_VIEWBOX} ${SIGIL_VIEWBOX}`}
      role="img"
      aria-label={t(label, {
        count: sigil.count,
        used: sigil.used,
        slots: SIGIL_SLOTS,
        remaining: sigil.remaining,
      })}
      className={cx(styles.sigil, className)}
    >
      <defs>
        {sigil.shapes.map((shape) => (
          <path key={shape.id} id={`${idPrefix}${shape.id}`} d={shape.d} />
        ))}
      </defs>
      <g className={dial ? 'sigilDial' : undefined}>
        {/* Grouped BY KIND rather than one class per element, since a CSS-
            module class name is long and there are seventy elements. Measured
            on /build's html: 21.1 KB writing every wedge out longhand, 19.8
            once they became rotated `<use>` elements, 19.5 after hoisting the
            class here and shortening the shape ids. So the shape sharing was
            worth 1.3 KB and this grouping 0.3 — kept because it also makes the
            markup legible, not because it paid for itself twice.

            Ticks are drawn first so a wedge that reaches the rim covers its
            own slot's tick rather than fighting it. */}
        {KINDS.map((kind) => {
          const of = sigil.uses.filter((u) => u.kind === kind)
          if (of.length === 0) return null
          return (
            <g key={kind} className={styles[kind]}>
              {of.map((u, i) => (
                <use
                  key={i}
                  href={`#${idPrefix}${u.id}`}
                  transform={u.angle === 0 ? undefined : `rotate(${u.angle} 100 100)`}
                />
              ))}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
