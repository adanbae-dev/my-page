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

export const PHASES = [
  { n: 0, name: 'Art Direction', state: 'done' },
  { n: 1, name: 'Golden Path', state: 'next' },
  { n: 2, name: 'Personal System', state: 'todo' },
  { n: 3, name: 'Engineering Showcase', state: 'todo' },
  { n: 4, name: 'Production', state: 'todo' },
] as const

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
