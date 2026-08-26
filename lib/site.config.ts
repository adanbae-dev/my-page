/**
 * Single source of truth for identity strings.
 *
 * The brief ships with the author's name unfilled. It is deliberately
 * confined to this one constant: replacing NAME below is the only edit
 * required to put a real name on the product — and `pnpm check:release`
 * refuses to pass while the placeholder is still here, so it cannot ship
 * by being forgotten.
 */
const NAME = 'GOLDIBUG'

/**
 * The author's legal name — structured data only, never displayed.
 *
 * NAME above is the WORDMARK: what a reader sees, invariant across every
 * locale. This answers a different question — how a machine connects this
 * site to a résumé. They are separate fields because a pseudonymous
 * wordmark and a findable identity are both wanted, and collapsing them
 * loses one or the other.
 *
 * Empty is a valid, deliberate state. `alternateName` is omitted from the
 * structured data entirely rather than published blank, so this site stays
 * pseudonymous until someone decides otherwise on purpose.
 */
const LEGAL_NAME = ''

/* There is deliberately no `NAME_IS_PLACEHOLDER` export here.
   One existed, was never imported anywhere, and broke the build the moment
   NAME was filled in: `NAME === '[name]'` is a comparison between two
   literal types with no overlap, which TypeScript rejects. The check it
   claimed to provide is real but lives in scripts/check-release.mjs, which
   greps this file's source — a gate that keeps working precisely because it
   does not depend on the value being comparable at the type level. */

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

/**
 * The repository this product is built from.
 *
 * Public on purpose. `/build` links every commit to its own diff, and a
 * build record whose claims cannot be checked is not a record — it is a
 * claim. The one-line cost of that decision is that the owner and name
 * live here rather than being derived from the git remote: a remote is a
 * local development detail and can be an SSH URL, which is not a link.
 */
export const REPO = {
  owner: 'adanbae-dev',
  name: 'my-page',
  url: 'https://github.com/adanbae-dev/my-page',
} as const

export const commitUrl = (sha: string): string => `${REPO.url}/commit/${sha}`

/**
 * The one Person object, for every piece of structured data on the site.
 *
 * Built here rather than at the three call sites it had — the WebSite author
 * and an entry's author and publisher. Three literals meant `alternateName`
 * could land on an article byline and be missing from the site itself, which
 * is exactly the kind of drift this file exists to prevent.
 */
export const person = () => ({
  '@type': 'Person' as const,
  name: NAME,
  ...(LEGAL_NAME ? { alternateName: LEGAL_NAME } : {}),
  url: url('/'),
})
