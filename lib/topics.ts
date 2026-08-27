/**
 * The browsable axis.
 *
 * `tags` already existed and could not carry this: 27 distinct tags across 13
 * entries, 22 of them used exactly once. Tag pages built on that would be 22
 * dead ends — and, with two locales, 44 near-empty pages, which is thin
 * content rather than navigation.
 *
 * So there are two axes now, and they answer different questions:
 *
 *   topics  CONTROLLED and small. What a reader browses by, what gets its own
 *           page, what the filter offers. Validated in lib/content/schema.ts,
 *           so an entry cannot invent one — an uncontrolled vocabulary is
 *           exactly how the tags got here.
 *   tags    Free-form. Displayed on the entry, and fed to JSON-LD `keywords`
 *           where specificity is the point (`nextjs`, `sqlite`, `rsc`).
 *
 * Seven, because seven is what the existing thirteen entries actually
 * support at two or more each. Adding an eighth means having something to
 * put in it.
 */

export const TOPIC_IDS = [
  'frontend',
  'architecture',
  'design',
  'tooling',
  'debugging',
  'knowledge',
  'process',
] as const

export type TopicId = (typeof TOPIC_IDS)[number]

export const isTopicId = (v: string): v is TopicId =>
  (TOPIC_IDS as readonly string[]).includes(v)
