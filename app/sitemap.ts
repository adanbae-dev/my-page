import type { MetadataRoute } from 'next'

import { publishedEntries } from '@/lib/content/load'
import { SECTIONS } from '@/lib/sections'
import { url } from '@/lib/site.config'

/**
 * Built from the same content the pages are built from, so a new entry is
 * in the sitemap the moment it exists. A hand-maintained list would drift
 * on the first entry someone forgot to add.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries = publishedEntries()

  const newestIn = (chapter: string): string =>
    entries.find((e) => e.chapter === chapter)?.date ?? entries[0]?.date ?? ''

  return [
    { url: url('/'), lastModified: entries[0]?.date, changeFrequency: 'weekly', priority: 1 },
    ...SECTIONS.map((s) => ({
      url: url(`/${s.id}`),
      lastModified: newestIn(s.id),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...entries.map((e) => ({
      url: url(`/${e.chapter}/${e.slug}`),
      lastModified: e.date,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    { url: url('/art-direction'), changeFrequency: 'yearly' as const, priority: 0.3 },
  ]
}
