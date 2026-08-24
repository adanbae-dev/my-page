import type { Density, Tone } from '@/lib/tone'

/**
 * The four chapters of the interface.
 *
 * Order is the argument: a visitor meets the thinking before the work, and
 * the life before the archive. Tone and density are fixed here rather than
 * at the call site so that the home page's score — calm, dense, dense, calm,
 * calm — is stated in one place and cannot drift between the golden path and
 * the depth routes.
 */

export const SECTION_IDS = ['think', 'make', 'live', 'trace'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export type SectionDef = {
  readonly id: SectionId
  /** Two-digit beat number shown in the index rail. */
  readonly index: string
  /** Uppercase name. Stored mixed-case-free because it IS the name. */
  readonly label: string
  /** The question this chapter answers, in one line. */
  readonly question: string
  /**
   * Display headline as discrete lines. Stored as an array rather than a
   * string with newlines so that rendering can join them with real spaces
   * for the accessible name while breaking them visually with <br />.
   */
  readonly titleLines: readonly string[]
  /** Korean body copy — the chapter's own voice. */
  readonly blurb: string
  readonly tone: Tone
  readonly density: Density
}

export const SECTIONS: readonly SectionDef[] = [
  {
    id: 'think',
    index: '01',
    label: 'THINK',
    question: '어떻게 생각하는가',
    titleLines: ['How a thing', 'is reasoned about'],
    blurb:
      '완성된 결론보다 결론에 이른 경로를 남깁니다. 무엇을 읽었고, 어디서 틀렸고, 무엇을 바꿨는지. 글과 노트, 그리고 아직 정리되지 않은 생각들.',
    tone: 'dark',
    density: 'dense',
  },
  {
    id: 'make',
    index: '02',
    label: 'MAKE',
    question: '무엇을 만들었는가',
    titleLines: ['What was', 'actually built'],
    blurb:
      '스크린샷이 아니라 결정을 보여줍니다. 어떤 제약이 있었고, 무엇을 포기했고, 무엇이 남았는지. 작업물과 그것을 만든 이유.',
    tone: 'dark',
    density: 'dense',
  },
  {
    id: 'live',
    index: '03',
    label: 'LIVE',
    question: '어떻게 사는가',
    titleLines: ['The person', 'behind the work'],
    blurb:
      '일하지 않는 시간에 무엇을 하는지. 만드는 사람은 만드는 것만으로 설명되지 않습니다.',
    tone: 'light',
    density: 'calm',
  },
  {
    id: 'trace',
    index: '04',
    label: 'TRACE',
    question: '무엇을 남겼는가',
    titleLines: ['What is left', 'when it passes'],
    blurb:
      '시간순으로 쌓이는 기록. 지나간 버전, 폐기된 시도, 바뀐 마음. 아카이브는 성공한 것만 모으는 곳이 아닙니다.',
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
