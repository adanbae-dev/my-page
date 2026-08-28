import Link from 'next/link'
import { lang } from 'next/root-params'

import { Sigil } from '@/components/Sigil'
import { cx } from '@/lib/cx'
import { DEFAULT_LOCALE, isLocale, localePath } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Not found' }

/**
 * The 404, at the ROOT — and that position is the whole point.
 *
 * It used to sit at app/[lang]/not-found.tsx, where it caught a notFound()
 * thrown inside the locale segment and nothing else. The commonest 404 of all,
 * a URL that matches no route, never enters that segment, so Next answered it
 * with its own bare page. Measured before the move: /ko/does-not-exist
 * returned title "404: This page could not be found." with no nav, no styles
 * and no way back. This page had never been shown to anyone.
 *
 * From the root it covers both: an unmatched URL, and a notFound() from
 * anywhere below. It receives no params either way, so the locale comes from
 * `next/root-params` — the one API that reads a root dynamic segment from
 * anywhere on the server — and falls back to the default when the path never
 * had a valid locale in it.
 */
export default async function NotFound() {
  const raw = await lang()
  const locale = raw && isLocale(raw) ? raw : DEFAULT_LOCALE
  const d = dict(locale)

  return (
    <section data-tone="light" data-density="calm" style={{ minBlockSize: '80svh' }}>
      <div className="wrap stack" style={{ paddingBlock: 'var(--section-y)' }}>
        <p className="label muted">404</p>
        <h1 className={cx('h1', 'beat')} lang="en">
          Nothing <span className="accentBlock">here</span>
        </h1>
        <p className="lead measure">{d.notFound.body}</p>

        {/* The one page a visitor reaches by accident is the one page with
            nothing of its own to show, which makes it the right place for the
            mark: whatever they were looking for, this is still the same
            record. Spinning, because nothing here points at a slot. */}
        {/* Sized inline because this page has no module of its own, and a
            utility class cannot do it: `.sigil` sets its own inline-size in an
            unlayered CSS Module, which outranks every layer. */}
        <Sigil
          spin
          id="nf"
          label={d.sigil.label}
          style={{ inlineSize: 'clamp(4.5rem, 12vw, 7rem)', color: 'var(--fg)' }}
        />
        <ul role="list" className={cx('label')} style={{ display: 'flex', gap: 'var(--space-m)', flexWrap: 'wrap' }}>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link href={localePath(locale, `/${s.id}`)}>
                {s.index} {s.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="label">
          <Link href={localePath(locale)}>{d.nav.backToGoldenPath}</Link>
        </p>
      </div>
    </section>
  )
}
