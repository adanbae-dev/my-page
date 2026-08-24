/**
 * TONE — the Inverted Duotone rhythm primitive.
 *
 * A tone is not a user preference and not a theme. It is an art-direction
 * beat: the page moves light -> dark -> light, and that movement is the
 * "Calm -> Dense -> Calm" structure from the brief made literal.
 *
 * Because a tone is expressed as a plain `data-tone` attribute on
 * server-rendered HTML, the entire rhythm survives with JavaScript off.
 */

export type Tone = 'light' | 'dark'

/** How tightly a section packs its content. Orthogonal to tone. */
export type Density = 'calm' | 'dense'

export const invert = (tone: Tone): Tone =>
  tone === 'light' ? 'dark' : 'light'

/** One beat in a page's tone score. */
export type ToneStep = {
  readonly tone: Tone
  readonly density: Density
}

/**
 * The ground shown when a visitor overscrolls past either end of the page.
 * Both ends of a well-formed score are Calm, so this is normally the
 * opening tone — but it is derived rather than assumed.
 */
export function boundingTone(score: readonly ToneStep[]): Tone {
  const first = score[0]
  const last = score[score.length - 1]
  if (!first || !last) return 'light'
  // If a score does not resolve back to its opening tone it is not a
  // Calm -> Dense -> Calm arc. Trust the closing beat in that case.
  return last.tone
}
