import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import type { ReactNode } from 'react'
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

/** The score this shell opens and closes on. Kept in sync with app/page.tsx. */
const ROOT_SCORE: readonly ToneStep[] = [
  { tone: 'light', density: 'calm' },
  { tone: 'light', density: 'calm' },
]

const ground = boundingTone(ROOT_SCORE)

export const metadata: Metadata = {
  title: {
    default: `${site.title} — ${site.name}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.title,
}

export const viewport: Viewport = {
  // Matches the ground the page opens and closes on, so the browser chrome
  // never disagrees with the first and last thing the visitor sees.
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
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
