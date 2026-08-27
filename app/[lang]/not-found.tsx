import Link from 'next/link'
import { lang } from 'next/root-params'

import { cx } from '@/lib/cx'
import { DEFAULT_LOCALE, isLocale, localePath } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Not found' }

/**
 * `not-found.tsx` receives no params, so the locale comes from
 * `next/root-params` — the one API that can read a root dynamic segment from
 * anywhere on the server. It falls back to the default locale because a 404
 * can be reached for a path that never had a valid locale in it.
 */
export default async function NotFound() {
  const raw = await lang()
  const locale = raw && isLocale(raw) ? raw : DEFAULT_LOCALE
  const d = dict(locale)

  return (
    <section data-tone="light" data-density="calm" style={{ minBlockSize: '80svh' }}>
      <div className="wrap stack" style={{ paddingBlock: 'var(--section-y)' }}>
        <p className="label muted">404</p>
        <h1 className="h1" lang="en">
          Nothing <span className="accentBlock">here</span>
        </h1>
        <p className="lead measure">{d.notFound.body}</p>
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
