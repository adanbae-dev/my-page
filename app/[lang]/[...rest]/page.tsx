import { notFound } from 'next/navigation'

/**
 * The route that exists so the 404 can.
 *
 * Every real route under [lang] pins its parameters with
 * `dynamicParams = false`, which is correct — the four chapters and the
 * entries that exist are the whole set, and an open parameter is an open
 * door. But it had a consequence nobody had checked: a URL matching none of
 * them never enters this segment at all, so `notFound()` is never called and
 * Next answers with its own bare page. Measured at /ko/does-not-exist before
 * this file existed: title "404: This page could not be found.", no nav, no
 * styles, no way back. app/[lang]/not-found.tsx had never been shown.
 *
 * A catch-all sibling is the least invasive fix. Next prefers a more specific
 * segment, so /ko/think still matches [section]; only what nothing else claims
 * arrives here. All this page does is throw, which puts the 404 INSIDE the
 * locale segment — and that is the one place app/[lang]/not-found.tsx can
 * catch it.
 *
 * The alternative was moving the root layout above [lang] so a root
 * not-found.tsx would have a document to live in. That was tried and reverted:
 * `next/root-params` only exposes the ROOT layout's dynamic segments, so
 * lifting the layout removes `lang()` — the very API the 404 uses — and takes
 * `<html lang>` down with it. A styled 404 is not worth a wrong language
 * attribute on every English page.
 */
export default async function CatchAll({
  params,
}: {
  params: Promise<{ lang: string; rest: string[] }>
}) {
  await params
  notFound()
}
