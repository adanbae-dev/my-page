/**
 * Single source of truth for identity strings.
 *
 * The brief ships with the author's name unfilled. It is deliberately
 * confined to this one constant: replacing NAME below is the only edit
 * required to put a real name on the product — and `pnpm check:release`
 * refuses to pass while the placeholder is still here, so it cannot ship
 * by being forgotten.
 */
const NAME = '[name]'

/** True while the author's name has not been filled in. */
export const NAME_IS_PLACEHOLDER = NAME === '[name]'

/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL in the deployment environment;
 * the localhost default is a development convenience and is rejected by
 * `pnpm check:release`, so a build cannot go out advertising localhost in
 * its canonical URLs, sitemap and feed.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

export const IS_LOCAL_ORIGIN = SITE_URL.includes('localhost')

export const site = {
  name: NAME,
  title: 'PERSONAL INTERFACE',
  tagline: 'An interface for a life in progress.',
  statement:
    '한 사람의 생각과 삶을 하나의 인터페이스로 번역하면서, 그 인터페이스를 만드는 능력까지 동시에 증명하는 개인 웹 제품.',
  description:
    'PERSONAL INTERFACE — 개인 웹 제품 / FE 포트폴리오 / 인터랙티브 에디토리얼 / 라이프 아카이브.',
  locale: 'ko_KR',
  lang: 'ko',
  sections: ['THINK', 'MAKE', 'LIVE', 'TRACE'] as const,
} as const

export const url = (path = '/'): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
