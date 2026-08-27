import type { Metadata } from 'next'

import {
  DEFAULT_LOCALE,
  localePath,
  LOCALES,
  LOCALE_META,
  type Locale,
} from '@/lib/i18n/config'
import { SECTIONS, type SectionId } from '@/lib/sections'
import { person, site, url } from '@/lib/site.config'

/**
 * Everything a machine reads, built in one place.
 *
 * This exists because of a bug that was invisible until it was measured. The
 * OG card image is a file convention — app/[lang]/opengraph-image.tsx — and
 * Next injects it into the `openGraph` object of the segment it sits in. A
 * deeper page that returns its OWN `openGraph` from generateMetadata replaces
 * that object wholesale, image included. So after the tree moved under
 * [lang], only the home page still had an og:image: every other page defines
 * its own title and description and therefore its own openGraph, and silently
 * dropped the card. Nothing errored. Every shared link lost its image.
 *
 * Four page types each writing their own metadata object is four chances to
 * forget one field. One builder is one chance, and `pnpm check:release`
 * checks the output rather than the intent.
 */

/**
 * The hreflang set for one locale-free path.
 *
 * Built from LOCALES so a third locale cannot leave the alternates behind.
 *
 * `x-default` points at the DEFAULT LOCALE, not at `/`. The usual advice is
 * to aim it at a language-neutral page, and this site has none: `/` is a
 * static 307 to `/ko` in next.config.ts that ignores Accept-Language —
 * measured, with `Accept-Language: en-US` still landing on `/ko`. So the
 * honest statement is "Korean is what an unmatched visitor gets", and aiming
 * x-default at a redirect instead would just ask the crawler to resolve one.
 */
export const alternateLanguages = (path: string): Record<string, string> => ({
  ...Object.fromEntries(LOCALES.map((l) => [LOCALE_META[l].lang, localePath(l, path)])),
  'x-default': localePath(DEFAULT_LOCALE, path),
})

/**
 * How many terms `keywords` may carry.
 *
 * A chapter page can derive every topic and every tag of every entry it holds,
 * which for THINK is over twenty terms. Twenty terms is not a claim about what
 * a page is about; it is a dump. Twelve is enough to name the subject and its
 * neighbours, and the order is meaningful — callers put the specific terms
 * first.
 */
const KEYWORD_MAX = 12

/** The card image for a locale. Stated once; see the note above. */
const ogImage = (lang: Locale): string => localePath(lang, '/opengraph-image')

type PageMetaArgs = {
  lang: Locale
  /** Locale-free path, e.g. `/think` or `/make/slug`. `/` for the home page. */
  path: string
  title: string
  description: string
  /**
   * Content terms for `<meta name="keywords">`.
   *
   * Derived from the page's own topics and tags, never guessed at: there is no
   * search-volume data behind this project, so a keyword here is a statement
   * about what the page contains and nothing more. Google has said since 2009
   * that it ignores this tag, and whether Naver weighs it is not something
   * this repository can verify — so it is emitted because it is cheap and true,
   * not because it is expected to move a ranking. The work that actually
   * matters is in the title and the description.
   */
  keywords?: readonly string[]
  /** An entry is an article; everything else here is a website. */
  article?: {
    publishedTime: string
    modifiedTime?: string
    tags?: readonly string[]
  }
}

export function pageMetadata({
  lang,
  path,
  title,
  description,
  keywords,
  article,
}: PageMetaArgs): Metadata {
  return {
    title,
    description,
    ...(keywords?.length ? { keywords: [...new Set(keywords)].slice(0, KEYWORD_MAX) } : {}),
    alternates: {
      canonical: localePath(lang, path),
      languages: alternateLanguages(path),
    },
    openGraph: {
      type: article ? 'article' : 'website',
      locale: LOCALE_META[lang].og,
      siteName: site.title,
      url: localePath(lang, path),
      title,
      description,
      // Explicit, because a page-level openGraph replaces the parent's.
      images: [ogImage(lang)],
      ...(article
        ? {
            publishedTime: article.publishedTime,
            ...(article.modifiedTime ? { modifiedTime: article.modifiedTime } : {}),
            ...(article.tags?.length ? { tags: [...article.tags] } : {}),
          }
        : {}),
    },
    twitter: { card: 'summary_large_image', images: [ogImage(lang)] },
  }
}

/* ------------------------------------------------------------------ */
/* Structured data                                                     */
/* ------------------------------------------------------------------ */

type Crumb = { name: string; path: string }

/**
 * BreadcrumbList.
 *
 * Answer engines use it to place a page in a hierarchy without guessing from
 * the URL, and search engines render it in place of the raw URL. It is cheap
 * and this site has a real hierarchy — home, chapter, entry — so there is
 * nothing to invent.
 */
export function breadcrumbSchema(lang: Locale, crumbs: readonly Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: url(localePath(lang, c.path)),
    })),
  }
}

/**
 * A chapter is a CollectionPage whose parts are named.
 *
 * `hasPart` is the point. A crawler that only reads the HTML has to infer
 * that this page lists entries; with hasPart it is told, with each entry's
 * own name, url and date. That is the difference between a page an answer
 * engine can cite and one it has to summarise from prose.
 */
export function collectionPageSchema(args: {
  lang: Locale
  section: SectionId
  name: string
  description: string
  parts: readonly { title: string; chapter: string; slug: string; date: string }[]
}) {
  const { lang, section, name, description, parts } = args
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: url(localePath(lang, `/${section}`)),
    inLanguage: LOCALE_META[lang].lang,
    isPartOf: { '@type': 'WebSite', name: site.title, url: url(localePath(lang)) },
    author: person(),
    hasPart: parts.map((p) => ({
      '@type': 'Article',
      headline: p.title,
      datePublished: p.date,
      url: url(localePath(lang, `/${p.chapter}/${p.slug}`)),
    })),
  }
}

/**
 * Word count, counted the way the reading estimate is.
 *
 * Korean has no spaces between words, so a whitespace split under-reports it
 * by roughly a factor of three — the same reason lib/content/schema.ts counts
 * Hangul per character. A wordCount that is wrong is worse than none, because
 * it is a claim.
 */
export function countWords(body: string): number {
  const text = body.replace(/```[\s\S]*?```/g, ' ').replace(/[#*_>`[\]()]/g, ' ')
  const hangul = (text.match(/[가-힣]/g) ?? []).length
  const latin = (text.match(/\b[A-Za-z][A-Za-z'-]*\b/g) ?? []).length
  // ~2.5 Hangul syllables per word is the usual approximation for Korean.
  return latin + Math.round(hangul / 2.5)
}

/** The four chapters, for a site-level list an answer engine can read. */
export function websiteSchema(lang: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${site.title} — ${site.name}`,
    description,
    url: url(localePath(lang)),
    inLanguage: LOCALE_META[lang].lang,
    author: person(),
    // Named parts, so the four chapters are data rather than four links a
    // crawler has to notice and classify.
    hasPart: SECTIONS.map((s) => ({
      '@type': 'CollectionPage',
      name: s.label,
      url: url(localePath(lang, `/${s.id}`)),
    })),
  }
}
