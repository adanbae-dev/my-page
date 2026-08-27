import { publishedEntries } from '@/lib/content/load'
import { DEFAULT_LOCALE, localePath, LOCALES, LOCALE_META } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { SECTIONS } from '@/lib/sections'
import { site, url } from '@/lib/site.config'

/**
 * /llms.txt — the site, in the form an answer engine can read in one request.
 *
 * The premise is the same one behind sitemap.xml and feed.xml here: it is
 * DERIVED, so it cannot drift. A hand-written summary of a site is out of date
 * the first time someone publishes without remembering it exists.
 *
 * Why it is worth having at all: an answer engine that wants to cite this site
 * otherwise has to fetch 41 pages and infer the structure from prose. This
 * says the structure once — what the site is, what the four chapters are for,
 * and every entry with its own one-line summary and canonical URL in both
 * languages. That is the difference between being summarised and being cited.
 *
 * Stays at the app root, like robots.txt and sitemap.xml: there is one of
 * these for a site. The locale lives in the URLs it lists, not in its path.
 */
export const dynamic = 'force-static'

const d = dict(DEFAULT_LOCALE)

export function GET(): Response {
  const lines: string[] = []

  lines.push(`# ${site.title} — ${site.name}`)
  lines.push('')
  lines.push(`> ${d.site.description}`)
  lines.push('')
  lines.push(site.tagline)
  lines.push('')
  lines.push(
    `Available in ${LOCALES.length} languages: ${LOCALES.map(
      (l) => `${LOCALE_META[l].endonym} (${url(localePath(l))})`,
    ).join(', ')}.`,
  )
  lines.push('')

  /* The chapters, with the question each one answers. The question is the
     part that makes the chapter legible without reading it. */
  lines.push('## Chapters')
  lines.push('')
  for (const s of SECTIONS) {
    const { question, blurb } = d.sections[s.id]
    lines.push(`- [${s.label}](${url(localePath(DEFAULT_LOCALE, `/${s.id}`))}) — ${question}. ${blurb}`)
  }
  lines.push('')

  /* Every entry, newest first, with its summary. Both locale URLs are given
     because an entry may exist in one language only, and saying so is more
     useful than silently offering a URL that serves the original. */
  const entries = publishedEntries(DEFAULT_LOCALE)
  lines.push('## Entries')
  lines.push('')
  for (const e of entries) {
    const path = `/${e.chapter}/${e.slug}`
    lines.push(
      `- [${e.title}](${url(localePath(DEFAULT_LOCALE, path))}) — ${e.chapter.toUpperCase()}, ${e.date}. ${e.summary}`,
    )
  }
  lines.push('')

  lines.push('## Machine-readable')
  lines.push('')
  lines.push(`- [Sitemap](${url('/sitemap.xml')})`)
  for (const l of LOCALES) {
    lines.push(`- [Atom feed, ${LOCALE_META[l].endonym}](${url(localePath(l, '/feed.xml'))})`)
  }
  lines.push(
    `- Structured data: WebSite, CollectionPage and Article as JSON-LD on every page, with BreadcrumbList on chapters and entries.`,
  )
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Same posture as every other derived file here: cheap to regenerate,
      // so it does not need a long cache.
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
