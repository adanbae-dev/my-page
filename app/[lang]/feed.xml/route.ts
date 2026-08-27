import { notFound } from 'next/navigation'

import { publishedEntries } from '@/lib/content/load'
import { isLocale, localePath, LOCALES } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { getSection } from '@/lib/sections'
import { SITE_URL, site, url } from '@/lib/site.config'

/**
 * Atom feed for the whole archive.
 *
 * Prerendered like every other route — there is nothing dynamic to compute,
 * so it costs one file rather than one request handler.
 */
export const dynamic = 'force-static'

/**
 * Without this the route sits under a dynamic segment with nothing telling
 * Next which locales exist, so `force-static` has nothing to statically
 * generate and the feed becomes a request handler. Verified by its absence
 * from the build output before this was added.
 */
export const dynamicParams = false

export function generateStaticParams(): { lang: string }[] {
  return LOCALES.map((lang) => ({ lang }))
}

const escape = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Atom demands RFC 3339. Content dates are days, so pin them to UTC noon
 *  rather than midnight: a midnight timestamp lands on the previous day in
 *  any reader west of GMT that formats it locally. */
const rfc3339 = (isoDay: string): string => `${isoDay}T12:00:00Z`

/**
 * One feed per locale.
 *
 * A Route Handler cannot read `next/root-params`, but it still receives
 * `params` — so the locale arrives the ordinary way.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
): Promise<Response> {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = dict(lang)
  const entries = publishedEntries(lang)
  const updated = rfc3339(entries[0]?.date ?? '1970-01-01')

  const items = entries
    .map((e) => {
      const chapter = getSection(e.chapter)
      const category = e.chapter === 'trace' ? d.logKind[e.kind] : chapter?.label
      return `  <entry>
    <title type="text">${escape(e.title)}</title>
    <link rel="alternate" type="text/html" href="${url(localePath(lang, `/${e.chapter}/${e.slug}`))}"/>
    <id>${url(localePath(lang, `/${e.chapter}/${e.slug}`))}</id>
    <updated>${rfc3339(e.date)}</updated>
    <published>${rfc3339(e.date)}</published>
    <summary type="text">${escape(e.summary)}</summary>
    ${category ? `<category term="${escape(category)}"/>` : ''}
  </entry>`
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${site.lang}">
  <title type="text">${escape(site.title)} — ${escape(site.name)}</title>
  <subtitle type="text">${escape(d.site.description)}</subtitle>
  <link rel="alternate" type="text/html" href="${url('/')}"/>
  <link rel="self" type="application/atom+xml" href="${url('/feed.xml')}"/>
  <id>${SITE_URL}/</id>
  <updated>${updated}</updated>
  <author><name>${escape(site.name)}</name></author>
${items}
</feed>
`

  return new Response(body, {
    headers: {
      'content-type': 'application/atom+xml; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}
