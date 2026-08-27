/**
 * The contrast contract for the Inverted Duotone palette.
 *
 * Hex values deliberately do NOT live here — they live once, in
 * styles/tokens.css. This file records only what each role PROMISES.
 * `pnpm check:contrast` parses the stylesheet, measures the real ratios,
 * and fails if a measured value drifts from the number recorded below.
 */

export type RoleContract = {
  /** CSS custom property, without the leading dashes. */
  readonly role: string
  /** Measured WCAG 2.2 contrast against this tone's ground. */
  readonly ratio: number
  /** Minimum this role must hold to do its job. */
  readonly min: number
  /** Why that minimum, in the language of the design system. */
  readonly usage: string
}

export const CONTRAST_CONTRACT: Readonly<
  Record<'light' | 'dark', readonly RoleContract[]>
> = {
  light: [
    { role: 'figure', ratio: 18.06, min: 7, usage: 'Body and headings — AAA' },
    { role: 'muted', ratio: 4.55, min: 4.5, usage: 'Secondary text — AA' },
    { role: 'accent', ratio: 3.05, min: 3, usage: 'Fills and marks — non-text only' },
    { role: 'accent-text', ratio: 4.53, min: 4.5, usage: 'Accent at body size — AA' },
    { role: 'on-accent', ratio: 5.91, min: 4.5, usage: 'Text on the accent fill — AA' },
    { role: 'focus', ratio: 4.53, min: 3, usage: 'Focus ring — SC 1.4.11' },
  ],
  dark: [
    { role: 'figure', ratio: 18.06, min: 7, usage: 'Body and headings — AAA' },
    { role: 'muted', ratio: 4.52, min: 4.5, usage: 'Secondary text — AA' },
    { role: 'accent', ratio: 5.91, min: 3, usage: 'Fills, marks AND text' },
    { role: 'accent-text', ratio: 5.91, min: 4.5, usage: 'Accent at body size — AA' },
    { role: 'on-accent', ratio: 5.91, min: 4.5, usage: 'Text on the accent fill — AA' },
    { role: 'focus', ratio: 3.99, min: 3, usage: 'Focus ring — SC 1.4.11' },
  ],
} as const

/** Motion vocabulary, surfaced on the art-direction page. */
export const MOTION_TOKENS = [
  { token: 'dur-instant', ms: 120, usage: 'State echo — a mark acknowledging a click' },
  { token: 'dur-quick', ms: 220, usage: 'Hover, focus, small reveals' },
  { token: 'dur-base', ms: 420, usage: 'Element entrances, the default' },
  { token: 'dur-slow', ms: 720, usage: 'Sustained reveals, scroll-linked figures' },
  { token: 'dur-invert', ms: 900, usage: 'A full ground inversion — the loudest move' },
] as const

/**
 * The roadmap, as the page shows it.
 *
 * This was written during Phase 0 and then not touched for four phases, so
 * /art-direction spent that whole time telling visitors that Phase 1 was next
 * and that 2, 3 and 4 had not started — while the repository held a commit for
 * each of them and the features were live. A roadmap that lags the work is
 * worse than no roadmap: it is the one element of the page a reader has no way
 * to check, so it is believed.
 *
 * Each entry below was checked against something that exists, not against a
 * commit subject:
 *
 *   1 Golden Path          app/[lang]/page.tsx, the four-chapter scroll
 *   2 Personal System      content/, 19 entries across 4 chapters
 *   3 Engineering Showcase app/[lang]/build, 6 gates in scripts/check-*.mjs
 *   4 Production           sitemap, robots, feed.xml, llms.txt, perf budget
 *   5 Interaction          styles/interaction.css, gated by check:motion
 *   6 Identity             lib/sigil.ts, the mark folded from the record
 *
 * Phase 7 is 'next' because it is being worked on now, not as an aspiration.
 * If it sits at 'next' with nothing moving, this comment is the evidence that
 * it should be corrected rather than left.
 */
/**
 * Declared rather than inferred. With `as const` and every phase shipped, the
 * union narrowed to 'done' | 'next' and the page's 'todo' branch became
 * provably dead code — tsc said so. Deleting that branch would have meant
 * writing it again the next time a phase is planned before it is started, so
 * the type stays open and the data is what changes.
 */
export type PhaseState = 'done' | 'next' | 'todo'

export const PHASES: readonly {
  readonly n: number
  readonly name: string
  readonly state: PhaseState
}[] = [
  { n: 0, name: 'Art Direction', state: 'done' },
  { n: 1, name: 'Golden Path', state: 'done' },
  { n: 2, name: 'Personal System', state: 'done' },
  { n: 3, name: 'Engineering Showcase', state: 'done' },
  { n: 4, name: 'Production', state: 'done' },
  { n: 5, name: 'Interaction', state: 'done' },
  { n: 6, name: 'Identity', state: 'done' },
  { n: 7, name: 'Reach', state: 'next' },
]

/**
 * The two grounds, as literals.
 *
 * These exist only because `<meta name="theme-color">` is resolved at build
 * time and cannot read a CSS custom property. They are NOT a second source
 * of truth: `pnpm check:contrast` asserts that each value here is identical
 * to `--ground` in the matching tone block of styles/tokens.css, and fails
 * the build if the two ever disagree.
 */
export const GROUND_HEX: Readonly<Record<'light' | 'dark', string>> = {
  light: '#f7f5f0',
  dark: '#0b0b0c',
} as const

/**
 * Fallback palette for the WebGL scene.
 *
 * The scene reads its colours from the live CSS custom properties, which is
 * what keeps it from drifting from the rest of the product. These literals
 * are only what it falls back to before the host element exists — and like
 * GROUND_HEX they are asserted against styles/tokens.css by
 * `pnpm check:contrast`, so a fallback cannot quietly become a fifth colour.
 */
export const SCENE_FALLBACK: Readonly<Record<string, string>> = {
  ground: '#f7f5f0',
  figure: '#0b0b0c',
  accent: '#ff4d00',
  rule: '#dbd9d5',
} as const
