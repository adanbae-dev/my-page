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
 * Seven were what the first thirteen entries supported at two or more each,
 * and all seven were about the craft. `life` is the eighth and it exists
 * because LIVE had nothing to be filed under: its one entry had been given
 * `process`, a work topic, which is how a taxonomy starts lying. Adding a
 * topic still means having something to put in it — check:content blocks a
 * topic with no entries.
 */

export const TOPIC_IDS = [
  'frontend',
  'architecture',
  'design',
  'tooling',
  'debugging',
  'knowledge',
  'process',
  'life',
] as const

export type TopicId = (typeof TOPIC_IDS)[number]

export const isTopicId = (v: string): v is TopicId =>
  (TOPIC_IDS as readonly string[]).includes(v)
