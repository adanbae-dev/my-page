import { SCENE_FALLBACK } from '@/lib/tokens.data'

export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png'

/** Same palette as everything else, via the one sanctioned bridge. */
export const OG = {
  paper: SCENE_FALLBACK['ground']!,
  ink: SCENE_FALLBACK['figure']!,
  accent: SCENE_FALLBACK['accent']!,
  rule: SCENE_FALLBACK['rule']!,
} as const

/**
 * Fetch just the glyphs an image actually needs.
 *
 * Google's CSS API subsets to `text=`, which turns a multi-megabyte Hangul
 * family into a few kilobytes. The old User-Agent is deliberate: with a
 * modern one the API returns woff2, which Satori cannot parse — an old one
 * gets truetype.
 *
 * Returns null rather than throwing. An OG image is worth having in a
 * fallback face; it is not worth failing a build over a network hiccup.
 */
export async function loadFontSubset(
  family: string,
  text: string,
): Promise<ArrayBuffer | null> {
  if (!text.trim()) return null
  try {
    const api = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}&text=${encodeURIComponent(text)}`
    const css = await fetch(api, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then((r) => (r.ok ? r.text() : ''))
    const match = /src:\s*url\((https:\/\/[^)]+)\)\s*format\('(?:opentype|truetype)'\)/.exec(
      css,
    )
    if (!match?.[1]) return null
    const res = await fetch(match[1])
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

/** Fonts for an image, skipping any that could not be fetched. */
export async function ogFonts(text: string) {
  const [latin, hangul] = await Promise.all([
    loadFontSubset('Archivo:wght@900', text),
    loadFontSubset('Noto Sans KR:wght@700', text),
  ])
  const fonts = []
  if (latin) fonts.push({ name: 'Archivo', data: latin, style: 'normal' as const, weight: 900 as const })
  if (hangul) fonts.push({ name: 'NotoKR', data: hangul, style: 'normal' as const, weight: 700 as const })
  return fonts
}
