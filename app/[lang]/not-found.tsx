import { lang } from 'next/root-params'

import { NotFound } from '@/components/NotFound'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config'

export const metadata = { title: 'Not found' }

/**
 * What `notFound()` renders.
 *
 * This file's comment used to claim it sat at the ROOT and that "that
 * position is the whole point". It never did. Lifting the root layout above
 * `[lang]` to make that possible fails the build — `next/root-params` only
 * exposes the ROOT layout's dynamic segments, so `lang()` stops existing —
 * and the change was reverted. The comment describing the move stayed for
 * several commits, which made this file assert a structure the repository
 * did not have.
 *
 * What actually covers an unmatched URL is `app/[lang]/404/page.tsx`, which
 * bakes the same markup into `out/<lang>/404.html` for the host to serve.
 * This file covers the other case: a `notFound()` thrown from inside the
 * locale segment.
 *
 * It receives no params either way, so the locale comes from
 * `next/root-params` — the one API that reads a root dynamic segment from
 * anywhere on the server — and falls back to the default when the path never
 * had a valid locale in it.
 */
export default async function NotFoundBoundary() {
  const raw = await lang()
  const locale = raw && isLocale(raw) ? raw : DEFAULT_LOCALE
  return <NotFound locale={locale} />
}
