import type { MetadataRoute } from 'next'

import { entriesForTopic, publishedEntries } from '@/lib/content/load'
import { TOPIC_IDS } from '@/lib/topics'
import { localePath, LOCALES, LOCALE_META } from '@/lib/i18n/config'
import { SECTIONS } from '@/lib/sections'
import { url } from '@/lib/site.config'

/**
 * Built from the same content the pages are built from, so a new entry is in
 * the sitemap the moment it exists. A hand-maintained list would drift on the
 * first entry someone forgot to add.
 *
 * Stays at the app root rather than moving under [lang]: there is one sitemap
 * for a site, not one per language. Each URL carries its own `alternates`
 * instead, which is what tells a crawler the two locales are the same page in
 * different languages rather than duplicate content.
 */

/** The `hreflang` map for one locale-free path. */
const languages = (path: string) =>
  Object.fromEntries(LOCALES.map((l) => [LOCALE_META[l].lang, url(localePath(l, path))]))

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((lang) => {
    const entries = publishedEntries(lang)

    const newestIn = (chapter: string): string =>
      entries.find((e) => e.chapter === chapter)?.date ?? entries[0]?.date ?? ''

    return [
      {
        url: url(localePath(lang)),
        lastModified: entries[0]?.date,
        changeFrequency: 'weekly' as const,
        priority: 1,
        alternates: { languages: languages('/') },
      },
      ...SECTIONS.map((s) => ({
        url: url(localePath(lang, `/${s.id}`)),
        lastModified: newestIn(s.id),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternates: { languages: languages(`/${s.id}`) },
      })),
      ...entries.map((e) => ({
        url: url(localePath(lang, `/${e.chapter}/${e.slug}`)),
        lastModified: e.date,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        alternates: { languages: languages(`/${e.chapter}/${e.slug}`) },
      })),
      /* Topic pages, only where there is something to show. An empty topic
         page indexed is a dead end a reader bounces off. */
      ...TOPIC_IDS.filter((tp) => entriesForTopic(tp, lang).length > 0).map((tp) => ({
        url: url(localePath(lang, `/topic/${tp}`)),
        lastModified: entriesForTopic(tp, lang)[0]?.date,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
        alternates: { languages: languages(`/topic/${tp}`) },
      })),
      // /build has no lastModified on purpose: it changes on every commit,
      // and telling a crawler that daily would be noise, not information.
      {
        url: url(localePath(lang, '/build')),
        changeFrequency: 'weekly' as const,
        priority: 0.4,
        alternates: { languages: languages('/build') },
      },
      /* Higher priority than the other two system pages, and deliberately:
         this is the one a reader is most likely to have been sent the link
         to, and the only page answering the "should we work together"
         question the archive otherwise leaves open. */
      {
        url: url(localePath(lang, '/practice')),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        alternates: { languages: languages('/practice') },
      },
      {
        url: url(localePath(lang, '/art-direction')),
        changeFrequency: 'yearly' as const,
        priority: 0.3,
        alternates: { languages: languages('/art-direction') },
      },
    ]
  })
}
