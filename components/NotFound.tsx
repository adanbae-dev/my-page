import Link from 'next/link'

import { Sigil } from '@/components/Sigil'
import { cx } from '@/lib/cx'
import { localePath, type Locale } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { SECTIONS } from '@/lib/sections'

/**
 * The 404, as a component with two callers.
 *
 * It is a component rather than a page because a static export needs the
 * same markup from two places, and copying it would put the site's most
 * neglected page in two files that drift:
 *
 *   app/[lang]/not-found.tsx   what `notFound()` renders, in dev and in
 *                              any future server deployment
 *   app/[lang]/404/page.tsx    a plain page, so `next build` writes the
 *                              markup into out/<lang>/404.html for the host
 *                              to serve on an unmatched path
 *
 * The second exists because of something measured rather than assumed. A
 * route that just calls `notFound()` exports an HTML file whose <body> is
 * 38 bytes — `<div hidden><!--$--><!--/$--></div>` — with every visible
 * string present only inside the RSC payload in a <script>. It renders
 * nothing without JavaScript. This product's claim is that navigation and
 * the whole structure work with JavaScript off, and the 404 is the page a
 * visitor is most likely to arrive at from a stale link, so a client-only
 * 404 is the wrong one to ship. Rendered as an ordinary page it
 * server-renders in full.
 */
export function NotFound({ locale }: { locale: Locale }) {
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
        {/* Sized inline because this markup has no module of its own, and a
            utility class cannot do it: `.sigil` sets its own inline-size in an
            unlayered CSS Module, which outranks every layer. */}
        <Sigil
          spin
          id="nf"
          label={d.sigil.label}
          style={{ inlineSize: 'clamp(4.5rem, 12vw, 7rem)', color: 'var(--fg)' }}
        />
        <ul
          role="list"
          className={cx('label')}
          style={{ display: 'flex', gap: 'var(--space-m)', flexWrap: 'wrap' }}
        >
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
