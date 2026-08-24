import { ImageResponse } from 'next/og'

import { OG, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from '@/lib/og'
import { site } from '@/lib/site.config'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `${site.title} — ${site.tagline}`

export default async function OpenGraphImage() {
  const line1 = 'An interface'
  const line2 = 'for a life'
  const line3 = 'in progress'
  const text = `${site.title}${site.name}${line1}${line2}${line3}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: OG.paper,
          color: OG.ink,
          padding: 64,
          fontFamily: 'Archivo, NotoKR, sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4 }}>
          {site.title.toUpperCase()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.88 }}>
          <div style={{ display: 'flex', fontSize: 108, textTransform: 'uppercase' }}>
            {line1}
          </div>
          <div style={{ display: 'flex', fontSize: 108, textTransform: 'uppercase' }}>
            {line2}
          </div>
          {/* The accent as a solid mark — the one treatment legal on paper. */}
          <div
            style={{
              display: 'flex',
              fontSize: 108,
              textTransform: 'uppercase',
              background: OG.accent,
              color: OG.ink,
              padding: '4px 16px',
              alignSelf: 'flex-start',
              marginTop: 8,
            }}
          >
            {line3}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 22,
            letterSpacing: 4,
            borderTop: `1px solid ${OG.rule}`,
            paddingTop: 20,
          }}
        >
          <div style={{ display: 'flex' }}>{site.sections.join('   ')}</div>
          <div style={{ display: 'flex' }}>{site.name}</div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts(text) },
  )
}
