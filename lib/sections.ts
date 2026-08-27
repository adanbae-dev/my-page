import type { Density, Tone } from '@/lib/tone'

/**
 * The four chapters of the interface.
 *
 * Order is the argument: a visitor meets the thinking before the work, and
 * the life before the archive. Tone and density are fixed here rather than
 * at the call site so that the home page's score — calm, dense, dense, calm,
 * calm — is stated in one place and cannot drift between the golden path and
 * the depth routes.
 *
 * What is here is what does NOT change with language: order, tone, density,
 * the two-digit beat and the display headline (already Latin). The chapter's
 * question and its body copy moved to lib/i18n — they are sentences, and a
 * sentence has a language.
 */

export const SECTION_IDS = ['think', 'make', 'live', 'trace'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export type SectionDef = {
  readonly id: SectionId
  /** Two-digit beat number shown in the index rail. */
  readonly index: string
  /** Uppercase name. Stored mixed-case-free because it IS the name. */
  readonly label: string
  /**
   * Display headline as discrete lines. Stored as an array rather than a
   * string with newlines so that rendering can join them with real spaces
   * for the accessible name while breaking them visually with <br />.
   */
  readonly titleLines: readonly string[]
  readonly tone: Tone
  readonly density: Density
}

export const SECTIONS: readonly SectionDef[] = [
  {
    id: 'think',
    index: '01',
    label: 'THINK',
    titleLines: ['How a thing', 'is reasoned about'],
    tone: 'dark',
    density: 'dense',
  },
  {
    id: 'make',
    index: '02',
    label: 'MAKE',
    titleLines: ['What was', 'actually built'],
    tone: 'dark',
    density: 'dense',
  },
  {
    id: 'live',
    index: '03',
    label: 'LIVE',
    titleLines: ['The person', 'behind the work'],
    tone: 'light',
    density: 'calm',
  },
  {
    id: 'trace',
    index: '04',
    label: 'TRACE',
    titleLines: ['What is left', 'when it passes'],
    tone: 'light',
    density: 'calm',
  },
]

const BY_ID = new Map<string, SectionDef>(SECTIONS.map((s) => [s.id, s]))

export function getSection(id: string): SectionDef | undefined {
  return BY_ID.get(id)
}

export function isSectionId(id: string): id is SectionId {
  return BY_ID.has(id)
}

/** The chapter before and after this one, for end-of-page continuation. */
export function neighbours(id: SectionId): {
  prev: SectionDef | undefined
  next: SectionDef | undefined
} {
  const i = SECTIONS.findIndex((s) => s.id === id)
  return { prev: SECTIONS[i - 1], next: SECTIONS[i + 1] }
}
