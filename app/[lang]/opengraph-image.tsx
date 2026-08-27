import { ImageResponse } from 'next/og'

import { commits } from '@/lib/git/load'
import { LOCALES } from '@/lib/i18n/config'
import { OG, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from '@/lib/og'
import { sigilFrom, sigilSvgMarkup } from '@/lib/sigil'
import { site } from '@/lib/site.config'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * Without this the image route sits under a dynamic segment with nothing
 * saying which locales exist, and the build marks it `ƒ` — a function invoked
 * on every social crawler fetch. Measured: it was `○ /opengraph-image` before
 * the tree moved and `ƒ /[lang]/opengraph-image` after, until this was added.
 */
export function generateStaticParams(): { lang: string }[] {
  return LOCALES.map((lang) => ({ lang }))
}
export const alt = `${site.title} — ${site.tagline}`

export default async function OpenGraphImage() {
  /* Data URI rather than a component: Satori rasterises an `<img>`, and it
     does not run the CSS that resolves `currentColor`. Base64 rather than a
     percent-encoded URI because the markup contains `#` twice per colour and
     one unescaped `#` truncates the whole document at the fragment. */
  const mark = sigilFrom(commits())
  const seal =
    mark.count > 0
      ? `data:image/svg+xml;base64,${Buffer.from(
          sigilSvgMarkup(mark, { wedge: OG.ink, tick: OG.rule, nub: OG.accent }),
          'utf8',
        ).toString('base64')}`
      : null

  const line1 = 'An interface'
  const line2 = 'for a life'
  const line3 = 'in progress'
  /**
   * Every character this image actually DRAWS, in every case it draws it in.
   *
   * The old version listed the title, the name and the three headline lines
   * — and missed two things. It omitted the section labels entirely, and it
   * ignored that the layout uppercases the title with `.toUpperCase()` and
   * the headline with `textTransform`. Google's `text=` subsetting is
   * case-sensitive, so the glyphs it never asked for came back missing and
   * Satori quietly substituted its default face for them.
   *
   * Measured: H, K, M and V always fell back — visible as a lighter
   * `THINK MAKE LIVE TRACE`. And with a non-Latin `site.name` the subset
   * also lost G, which broke `IN PROGRESS`: the loudest element on the card,
   * degraded by an unrelated change to the author's name.
   *
   * Asking for both cases of everything drawn costs nothing — the subset is
   * a few kilobytes either way — and removes the coupling.
   */
  const drawn = `${site.title}${site.name}${line1}${line2}${line3}${site.sections.join('')}`
  const text = `${drawn}${drawn.toUpperCase()}`

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4 }}>
            {site.title.toUpperCase()}
          </div>
          {/* The generated mark, stamped on the card. This is the one element
              of the image that cannot be copied from anyone else's template:
              it is folded from this repository's commit record at build time.
              Only on the card, not on the favicon — sixty-four wedges are
              legible at 150px and mush at 16, which is why app/icon.tsx keeps
              its geometric block. */}
          {/* Satori renders this, not a browser, so next/image does not apply
              and the no-img-element rule does not fire here. */}
          {seal ? <img src={seal} width={150} height={150} alt="" /> : null}
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
