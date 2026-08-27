/**
 * The locale table.
 *
 * Every locale is PREFIXED, including the default: `/ko/think`, `/en/think`.
 * The alternative — an unprefixed default — needs either a duplicated route
 * tree or a rewrite in proxy.ts, and a rewrite turns every request into an
 * edge function invocation. This product's stated posture is that every
 * route is statically prerendered with no runtime cost (docs/PRODUCTION.md),
 * so `/` is a static redirect declared in next.config.ts instead.
 *
 * What that trades away is automatic Accept-Language detection. A visitor
 * landing on `/` gets Korean and can click through. That is a smaller loss
 * than an edge function on every page view, and proxy.ts can be added later
 * without changing anything here.
 */

export const LOCALES = ['ko', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ko'

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value)

type LocaleMeta = {
  /** BCP 47, for <html lang> and JSON-LD inLanguage. */
  readonly lang: string
  /** OpenGraph's own underscored form. */
  readonly og: string
  /** The language's name IN that language — what a switcher should say. */
  readonly endonym: string
}

export const LOCALE_META: Readonly<Record<Locale, LocaleMeta>> = {
  ko: { lang: 'ko', og: 'ko_KR', endonym: '한국어' },
  en: { lang: 'en', og: 'en_US', endonym: 'English' },
}

/** `/ko`, `/en/think`, `/ko/make/slug`. */
export const localePath = (locale: Locale, path = '/'): string =>
  `/${locale}${path === '/' ? '' : path.startsWith('/') ? path : `/${path}`}`

/**
 * Strip the locale from a pathname, returning the locale-free remainder.
 *
 * Needed by the nav, which is a Client Component and therefore cannot read
 * `next/root-params` — it only has `usePathname()`.
 */
export function splitLocale(pathname: string): {
  locale: Locale | null
  rest: string
} {
  const [, first = '', ...others] = pathname.split('/')
  if (!isLocale(first)) return { locale: null, rest: pathname }
  return { locale: first, rest: `/${others.join('/')}`.replace(/\/$/, '') || '/' }
}

/**
 * Fill `{name}` placeholders.
 *
 * Dictionary values are plain strings rather than functions on purpose:
 * three components in this product are Client Components, and a function
 * cannot cross that boundary. Strings can.
 */
export const t = (
  template: string,
  vars: Readonly<Record<string, string | number>> = {},
): string => template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
