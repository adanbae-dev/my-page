import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import type { ReactNode } from 'react'

import { Nav } from '@/components/Nav'
import { site } from '@/lib/site.config'
import { GROUND_HEX } from '@/lib/tokens.data'
import { boundingTone, type ToneStep } from '@/lib/tone'

import '@/styles/layers.css'
import '@/styles/reset.css'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/utilities.css'

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
  title: {
    default: `${site.title} — ${site.name}`,
    // The person, not the product: an entry titled the same as the site
    // would otherwise render as "PERSONAL INTERFACE · PERSONAL INTERFACE".
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.title,
}

export const viewport: Viewport = {
  themeColor: GROUND_HEX[ground],
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" data-tone={ground} className={archivo.variable}>
      <body>
        <a className="skipLink" href="#main">
          본문으로 건너뛰기
        </a>
        <Nav initialTone={ground} />
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
