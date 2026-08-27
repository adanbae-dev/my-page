import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { Nav } from '@/components/Nav'
import {
  isLocale,
  localePath,
  LOCALES,
  LOCALE_META,
  type Locale,
} from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { alternateLanguages, websiteSchema } from '@/lib/seo'
import { SITE_URL, site } from '@/lib/site.config'
import { GROUND_HEX } from '@/lib/tokens.data'
import { boundingTone, type ToneStep } from '@/lib/tone'

import '@/styles/layers.css'
import '@/styles/reset.css'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/utilities.css'
import '@/styles/interaction.css'

/**
 * The root layout, nested under [lang].
 *
 * Next supports moving it here, and it has to move: `<html lang>` is not a
 * detail — it is what a screen reader uses to pick a voice and what a
 * browser uses to pick hyphenation. A single hardcoded `lang="ko"` above a
 * multilingual tree would be wrong on every English page.
 */

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-archivo',
  fallback: ['Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
})

/**
 * Every page in the product performs the same Calm → Dense → Calm arc, so
 * every page opens and closes on the light ground. That is what makes the
 * browser canvas — the colour revealed by overscroll, and the colour behind
 * the address bar — a single unambiguous value.
 */
const ROOT_SCORE: readonly ToneStep[] = [
  { tone: 'light', density: 'calm' },
  { tone: 'light', density: 'calm' },
]

const ground = boundingTone(ROOT_SCORE)

type Params = { lang: string }

/** Both locales are prerendered. Anything else is a 404, not a guess. */
export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const d = dict(lang)

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${site.title} — ${site.name}`,
      // The person, not the product: an entry titled the same as the site
      // would otherwise render as "PERSONAL INTERFACE · PERSONAL INTERFACE".
      template: `%s · ${site.name}`,
    },
    description: d.site.description,
    applicationName: site.title,
    alternates: {
      canonical: localePath(lang),
      languages: alternateLanguages('/'),
      types: {
        'application/atom+xml': [
          {
            url: localePath(lang, '/feed.xml'),
            title: `${site.title} — ${d.site.feedTitle}`,
          },
        ],
      },
    },
    openGraph: {
      type: 'website',
      locale: LOCALE_META[lang].og,
      siteName: site.title,
      title: `${site.title} — ${site.name}`,
      description: d.site.description,
      url: localePath(lang),
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  }
}

export const viewport: Viewport = {
  themeColor: GROUND_HEX[ground],
  colorScheme: 'light dark',
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<Params>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale: Locale = lang
  const d = dict(locale)

  return (
    <html lang={LOCALE_META[locale].lang} data-tone={ground} className={archivo.variable}>
      <body>
        <JsonLd
          data={websiteSchema(locale, d.site.description)}
        />
        <a className="skipLink" href="#main">
          {d.a11y.skipToContent}
        </a>
        {/* Nav is a Client Component, so it cannot read next/root-params and
            cannot call dict(). Both arrive as plain serializable props. */}
        <Nav
          initialTone={ground}
          locale={locale}
          labels={{
            navLabel: d.a11y.navLabel,
            languageLabel: d.a11y.languageLabel,
          }}
        />
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
