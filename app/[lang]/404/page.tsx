import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { NotFound } from '@/components/NotFound'
import { isLocale, LOCALES } from '@/lib/i18n/config'

/**
 * The 404, baked into a file.
 *
 * `output: 'export'` writes `out/404.html` from Next's own built-in
 * not-found, never from this product's. Measured before this route existed:
 * 6,999 bytes of "404: This page could not be found." with no nav, no styles
 * and no way back — the exact page `app/[lang]/not-found.tsx` was written to
 * replace, back in front of visitors.
 *
 * The catch-all that used to cover it (`app/[lang]/[...rest]`) cannot be
 * exported at all: "every params object must include all dynamic route
 * parameters", and a catch-all cannot enumerate the URLs that do not exist.
 *
 * So one route matches nothing and renders the 404 as an ORDINARY page. Not
 * via `notFound()` — that exports a shell whose <body> is 38 bytes, with
 * every string only in the RSC payload, and renders blank without
 * JavaScript. See components/NotFound.tsx.
 *
 * Cloudflare's `not_found_handling: "404-page"` serves the NEAREST
 * `404.html`, searching upward, so `out/ko/404.html` answers `/ko/anything`
 * in Korean and `out/en/404.html` answers `/en/anything` in English. The
 * root `out/404.html` — for a path with no locale at all — is copied from
 * the default locale by `scripts/sync-404.mjs`.
 *
 * The side effect is that `/ko/404` and `/en/404` are reachable URLs showing
 * the 404 page with a 200. That is a soft 404, so it is marked noindex and
 * kept out of the sitemap; it is left addressable rather than hidden because
 * it is one more way to see a page that went unseen for most of this
 * product's life.
 */
export const dynamic = 'force-static'
export const dynamicParams = false

export const metadata: Metadata = {
  title: 'Not found',
  robots: { index: false, follow: true },
}

export function generateStaticParams(): { lang: string }[] {
  return LOCALES.map((lang) => ({ lang }))
}

export default async function NotFoundFile({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return <NotFound locale={lang} />
}
