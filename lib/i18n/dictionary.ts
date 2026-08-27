import { en } from './dictionaries/en'
import { ko } from './dictionaries/ko'
import type { Locale } from './config'

/**
 * The dictionary's shape is Korean's shape.
 *
 * `Record<Locale, Dictionary>` below is the whole mechanism: adding a key to
 * ko.ts and forgetting it in en.ts fails `pnpm typecheck`. There is no
 * runtime fallback to Korean, because a silent fallback is how an English
 * page ends up with one Korean sentence in it that nobody notices.
 */
export type Dictionary = typeof ko

const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = { ko, en }

/**
 * Synchronous, unlike the Next guide's dynamic-import pattern.
 *
 * That pattern exists to keep translation files out of the client bundle.
 * Here every route is a statically prerendered Server Component and the
 * dictionary never crosses to the client at all, so the async machinery
 * would buy nothing and cost a await at every call site.
 */
export const dict = (locale: Locale): Dictionary => DICTIONARIES[locale]
