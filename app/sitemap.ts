import type { MetadataRoute } from 'next'

import { publishedEntries } from '@/lib/content/load'
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
      // /build has no lastModified on purpose: it changes on every commit,
      // and telling a crawler that daily would be noise, not information.
      {
        url: url(localePath(lang, '/build')),
        changeFrequency: 'weekly' as const,
        priority: 0.4,
        alternates: { languages: languages('/build') },
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
