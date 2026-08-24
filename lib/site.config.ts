/**
 * Single source of truth for identity strings.
 *
 * The brief ships with the author's name unfilled. It is deliberately
 * confined to this one constant: replacing the line below is the only edit
 * required to put a real name on the product.
 */
export const site = {
  /** TODO(Phase 1): replace placeholder with the real name. */
  name: '[name]',
  title: 'PERSONAL INTERFACE',
  tagline: 'An interface for a life in progress.',
  statement:
    '한 사람의 생각과 삶을 하나의 인터페이스로 번역하면서, 그 인터페이스를 만드는 능력까지 동시에 증명하는 개인 웹 제품.',
  description:
    'PERSONAL INTERFACE — 개인 웹 제품 / FE 포트폴리오 / 인터랙티브 에디토리얼 / 라이프 아카이브.',
  sections: ['THINK', 'MAKE', 'LIVE', 'TRACE'] as const,
} as const
