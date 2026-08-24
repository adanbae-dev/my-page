import { publishedEntries } from '@/lib/content/load'
import { LOG_KIND_LABEL } from '@/lib/content/schema'
import { getSection } from '@/lib/sections'
import { SITE_URL, site, url } from '@/lib/site.config'

/**
 * Atom feed for the whole archive.
 *
 * Prerendered like every other route — there is nothing dynamic to compute,
 * so it costs one file rather than one request handler.
 */
export const dynamic = 'force-static'

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

export function GET(): Response {
  const entries = publishedEntries()
  const updated = rfc3339(entries[0]?.date ?? '1970-01-01')

  const items = entries
    .map((e) => {
      const chapter = getSection(e.chapter)
      const category = e.chapter === 'trace' ? LOG_KIND_LABEL[e.kind] : chapter?.label
      return `  <entry>
    <title type="text">${escape(e.title)}</title>
    <link rel="alternate" type="text/html" href="${url(`/${e.chapter}/${e.slug}`)}"/>
    <id>${url(`/${e.chapter}/${e.slug}`)}</id>
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
  <subtitle type="text">${escape(site.description)}</subtitle>
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
