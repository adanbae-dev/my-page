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
  /* `statement` and `description` used to live here. They are sentences, and
     a sentence has a language — they moved to lib/i18n. Leaving a Korean copy
     behind would have made this file a second source of truth for the two
     strings that appear in every page's <meta> and every feed's <subtitle>. */
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

/**
 * The AdSense publisher ID.
 *
 * WHY IT LIVES IN THIS FILE. It is an identity string — the one value that
 * tells an ad network which account a page belongs to — and this file is
 * where identity strings live. It appears in two places that a machine
 * reads: the `google-adsense-account` meta tag emitted by the root layout,
 * and `public/ads.txt`. Those two disagreeing is the exact failure this
 * product's gates exist to catch, so `pnpm check:release` asserts that the
 * ads.txt line carries THIS value. A typo in either one then fails a
 * release rather than failing site verification silently, weeks later,
 * with nothing in the build to say why.
 *
 * NOT A SECRET. Both surfaces are public files by design — ads.txt is
 * specified to be world-readable, and the meta tag ships in every page's
 * <head>. There is nothing here to keep out of the repository.
 *
 * WHAT THIS DOES NOT DO. It loads no script and admits no external origin,
 * so the Content-Security-Policy in lib/csp.mjs is untouched. Serving
 * actual ads is a separate decision with a real cost — see docs and the
 * `frame-src` note there — and this constant does not pre-empt it.
 */
export const ADSENSE_CLIENT = 'ca-pub-6830017278110885'
