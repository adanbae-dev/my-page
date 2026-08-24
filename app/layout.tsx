import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import type { ReactNode } from 'react'

import { JsonLd } from '@/components/JsonLd'
import { Nav } from '@/components/Nav'
import { SITE_URL, site, url } from '@/lib/site.config'
import { GROUND_HEX } from '@/lib/tokens.data'
import { boundingTone, type ToneStep } from '@/lib/tone'

import '@/styles/layers.css'
import '@/styles/reset.css'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/utilities.css'
import '@/styles/interaction.css'

/**
 * One grotesk family for the whole product. The width axis carries the
 * display/body distinction that a second typeface would normally carry —
 * which is how "grotesk only" stays a discipline rather than a limitation.
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

export const metadata: Metadata = {
  // Every relative URL in every page's metadata resolves against this.
  // Without it Next warns and emits relative OpenGraph URLs, which most
  // crawlers refuse to follow.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.title} — ${site.name}`,
    // The person, not the product: an entry titled the same as the site
    // would otherwise render as "PERSONAL INTERFACE · PERSONAL INTERFACE".
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.title,
  alternates: {
    canonical: '/',
    types: { 'application/atom+xml': [{ url: '/feed.xml', title: `${site.title} — 전체 기록` }] },
  },
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: site.title,
    title: `${site.title} — ${site.name}`,
    description: site.description,
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: GROUND_HEX[ground],
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" data-tone={ground} className={archivo.variable}>
      <body>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: `${site.title} — ${site.name}`,
            description: site.description,
            url: url('/'),
            inLanguage: site.lang,
            author: {
              '@type': 'Person',
              name: site.name,
              url: url('/'),
            },
          }}
        />
        <a className="skipLink" href="#main">
          본문으로 건너뛰기
        </a>
        <Nav initialTone={ground} />
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
