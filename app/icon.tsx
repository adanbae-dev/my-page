import { ImageResponse } from 'next/og'

import { OG } from '@/lib/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/**
 * The mark is the accent block itself — pure geometry, so the icon needs no
 * font and cannot fail to render. At 16px a letterform in this face would be
 * unreadable anyway; a solid orange field with an ink bar is not.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          background: OG.accent,
        }}
      >
        <div style={{ width: '100%', height: '34%', background: OG.ink }} />
      </div>
    ),
    size,
  )
}
