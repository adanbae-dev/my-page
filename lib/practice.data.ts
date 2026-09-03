import type { SectionId } from '@/lib/sections'

/**
 * Ten years of practice, as data.
 *
 * This file exists because the site had a hole. THINK, MAKE, LIVE and TRACE
 * serve three of the four audiences in the brand brief — someone meeting me,
 * someone building something similar, and future me. The fourth, someone
 * deciding whether to work with me, had no surface at all: nothing here
 * answered how long, what was owned, or what can be handed over on day one.
 *
 * It is NOT a résumé page, and the difference is structural rather than
 * tonal. A résumé is a list of claims with no way to check any of them. This
 * file keeps the claim and the evidence as two INDEPENDENT axes, so the page
 * can render the case where they disagree — which is the only interesting
 * case, and the one a résumé is built to hide.
 *
 * Sentences are not here. Era labels, scopes and capability names live in
 * lib/i18n/dictionaries, keyed by the ids below, for the same reason
 * lib/sections.ts keeps its chapter questions there: a sentence has a
 * language, and a Korean copy sitting next to the structure would be a
 * second source of truth for the half of this page that is prose.
 */

/* ------------------------------------------------------------------ */
/* Disclosure                                                          */
/* ------------------------------------------------------------------ */

/**
 * WHY THERE ARE NO EMPLOYER NAMES HERE.
 *
 * Not squeamishness — the entries already published would break. Both
 * `make/crm-tab-browser` and `make/work-calendar` open by promising the
 * reader that the organisation, the hosts, the member data and the
 * colleagues are excluded, and they carry real aggregate numbers on the
 * strength of that promise: 62 routes, 75,402 lines, 7 people, 18 releases
 * against 11 tasks. `make/bb-mcp-boundaries` replaces repository names with
 * `<워크스페이스>/<저장소-A>` for the same reason.
 *
 * Naming an employer on this page would retroactively attach every one of
 * those figures to a named company. That is not a decision this page gets to
 * make on its own — it would revoke a promise made at the top of three
 * entries that are already public.
 *
 * So an era carries its FUNCTION and its SCOPE, which is what a reader
 * deciding about working together actually needs, and not the name, the city
 * or the headcount of the employer. The industry is stated where the
 * published entries already reveal it and withholding it would only make the
 * page vaguer without making anything more private.
 *
 * The same rule covers what is absent by choice: no phone number, no
 * address, no email, no legal name. `lib/site.config.ts` keeps LEGAL_NAME
 * deliberately empty and this page does not reach around it. Contact is the
 * public GitHub profile in REPO.owner, which is already the one identity
 * this site publishes. `pnpm check:practice` fails the build if a phone
 * number, a street address or a blocked company name appears in this file or
 * in the practice block of either dictionary.
 */

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

/**
 * A pointer at one entry, as `chapter/slug`.
 *
 * The template literal type catches a bad chapter at compile time; the slug
 * cannot be checked by the compiler, so `pnpm check:practice` resolves every
 * reference against `content/` and fails the build when one does not exist.
 * That gate is the point of the whole file: rename an entry and this page
 * stops building rather than quietly showing a claim with a dead link under
 * it.
 */
export type EntryRef = `${SectionId}/${string}`

/* ------------------------------------------------------------------ */
/* Eras                                                               */
/* ------------------------------------------------------------------ */

export type Era = {
  readonly id: string
  /** `yyyy-mm`. Null only for the summarised early years, which have no recorded start. */
  readonly from: string | null
  /** `yyyy-mm`, or null for the current one. */
  readonly to: string | null
  /** Entries written out of this era. Empty is honest and common — most of these years predate the archive. */
  readonly evidence: readonly EntryRef[]
}

/**
 * Newest first, the way every other list on this site is ordered.
 *
 * `from: null` on the earliest era is not missing data being tolerated. The
 * source it was compiled from summarises those years without dates, and
 * inventing a start month to make the timeline tidy would be the one kind of
 * error this site cannot afford: a number nobody can check, sitting next to
 * numbers that all have gates behind them.
 */
export const ERAS: readonly Era[] = [
  {
    id: 'platform-lead',
    from: '2022-03',
    to: null,
    evidence: [
      'make/crm-tab-browser',
      'make/work-calendar',
      'make/bb-mcp-boundaries',
      'think/crm-sidebar-vanished',
      'think/branch-strategy',
    ],
  },
  {
    id: 'tech-lead',
    from: '2021-07',
    to: '2022-02',
    evidence: [],
  },
  {
    id: 'it-team-lead',
    from: '2020-05',
    to: '2020-12',
    evidence: [],
  },
  {
    id: 'early-years',
    from: null,
    to: '2020-04',
    evidence: [],
  },
]

/* ------------------------------------------------------------------ */
/* Capabilities                                                        */
/* ------------------------------------------------------------------ */

/**
 * One capability, on two independent axes.
 *
 * `claimed` is whether the CV this page replaces asserts it. `evidence` is
 * what this site can show for it. There is deliberately no `proven` field:
 * it would be `evidence.length > 0` restated, and a derivable fact stored
 * twice is a fact that eventually disagrees with itself.
 *
 * Keeping the axes apart is what makes the page worth building, because it
 * can then render all three states honestly:
 *
 *   claimed, with evidence      the ordinary case
 *   claimed, no evidence        asserted on the CV, unproven HERE — said so
 *   not claimed, with evidence  the site shows more than the CV thought to
 *
 * The second state is the one a skills grid is designed to conceal, and the
 * third turned out to be the more interesting finding: measurement,
 * diagnostics and build gates are the most heavily evidenced things in the
 * archive and appeared nowhere on the CV.
 *
 * No levels, no percentages, no five-star bars. A number here is a count of
 * entries a reader can open, and nothing else is on offer.
 */
export type Capability = {
  readonly id: string
  readonly group: CapabilityGroup
  /** Asserted by the CV this page replaces. */
  readonly claimed: boolean
  readonly evidence: readonly EntryRef[]
}

export const CAPABILITY_GROUPS = [
  'interface',
  'architecture',
  'verification',
  'platform',
  'knowledge',
] as const
export type CapabilityGroup = (typeof CAPABILITY_GROUPS)[number]

export const CAPABILITIES: readonly Capability[] = [
  /* interface */
  {
    id: 'react-typescript',
    group: 'interface',
    claimed: true,
    evidence: [
      'make/personal-interface',
      'make/crm-tab-browser',
      'make/gam-ml-teaching-tool',
      'think/crm-sidebar-vanished',
    ],
  },
  {
    id: 'css-systems',
    group: 'interface',
    claimed: true,
    evidence: [
      'think/why-contrast-came-first',
      'trace/cascade-layer-inversion',
      'make/personal-interface',
      'think/crm-sidebar-vanished',
    ],
  },
  {
    id: 'client-state',
    group: 'interface',
    claimed: true,
    evidence: ['make/crm-tab-browser'],
  },
  {
    id: 'accessibility',
    group: 'interface',
    claimed: false,
    evidence: ['think/why-contrast-came-first', 'make/personal-interface'],
  },

  /* architecture */
  {
    id: 'app-architecture',
    group: 'architecture',
    claimed: true,
    evidence: ['make/crm-tab-browser', 'make/personal-interface', 'make/bb-mcp-boundaries'],
  },
  {
    id: 'boundaries',
    group: 'architecture',
    claimed: false,
    evidence: ['make/bb-mcp-boundaries', 'make/crm-tab-browser'],
  },
  {
    id: 'monorepo',
    group: 'architecture',
    claimed: true,
    evidence: [],
  },
  {
    id: 'desktop',
    group: 'architecture',
    claimed: true,
    evidence: [],
  },

  /* verification */
  {
    id: 'testing',
    group: 'verification',
    claimed: true,
    evidence: [
      'think/the-guard-that-never-failed',
      'think/gates-that-passed',
      'make/bb-mcp-boundaries',
    ],
  },
  {
    id: 'build-gates',
    group: 'verification',
    claimed: false,
    evidence: [
      'make/personal-interface',
      'think/gates-that-passed',
      'think/the-guard-that-never-failed',
    ],
  },
  {
    id: 'measurement',
    group: 'verification',
    claimed: false,
    evidence: ['make/work-calendar', 'make/personal-interface', 'make/gam-ml-teaching-tool'],
  },
  {
    id: 'diagnostics',
    group: 'verification',
    claimed: false,
    evidence: ['trace/keychain-truncated-my-token', 'trace/cascade-layer-inversion'],
  },

  /* platform */
  {
    id: 'release-process',
    group: 'platform',
    claimed: true,
    evidence: ['think/branch-strategy', 'trace/git-remote-push-mistake', 'trace/typescript-7-rollback'],
  },
  {
    id: 'node-tooling',
    group: 'platform',
    claimed: true,
    evidence: ['make/work-calendar', 'make/bb-mcp-boundaries'],
  },
  {
    id: 'ci-cd',
    group: 'platform',
    claimed: true,
    evidence: [],
  },
  {
    id: 'cloud',
    group: 'platform',
    claimed: true,
    evidence: [],
  },
  {
    id: 'auth',
    group: 'platform',
    claimed: true,
    evidence: [],
  },

  /* knowledge */
  {
    id: 'llm-engineering',
    group: 'knowledge',
    claimed: true,
    evidence: [
      'make/bb-mcp-boundaries',
      'think/personal-llm-wiki',
      'think/gates-that-passed',
      'make/gam-ml-teaching-tool',
    ],
  },
  {
    id: 'statistics',
    group: 'knowledge',
    claimed: true,
    evidence: ['think/statistics-notation'],
  },
  {
    id: 'writing-decisions',
    group: 'knowledge',
    claimed: false,
    evidence: ['think/influence-in-my-own-log', 'trace/phase-0-to-1', 'make/personal-interface'],
  },
]

/* ------------------------------------------------------------------ */
/* Study                                                              */
/* ------------------------------------------------------------------ */

/**
 * Education, reduced to what a reader can use.
 *
 * Institution names are absent on the same rule as employer names, with one
 * asymmetry worth stating: the current degree is already public — the
 * reading list in `live/off-hours` names the textbooks — and the earlier one
 * is not mentioned anywhere on this site. So the current study appears as a
 * field and a state, and the earlier degree as a field alone.
 */
export type Study = {
  readonly id: string
  readonly from: string
  readonly to: string | null
}

export const STUDY: readonly Study[] = [
  { id: 'cs-statistics', from: '2024-07', to: null },
  { id: 'engineering-bs', from: '2004-03', to: '2012-12' },
]

/* There is deliberately no AWARDS export. One exists on the source CV — an
   internal employee-of-the-year — and it fails two tests at once: naming it
   requires naming the employer, and the brand brief lists
   "unnecessary awards/badges" as an anti-pattern. An award nobody outside
   the company can verify is decoration, which is exactly what this page is
   built to not be. */

/* ------------------------------------------------------------------ */
/* Derived                                                            */
/* ------------------------------------------------------------------ */

/** Every reference on the page, for the gate to resolve. */
export function allRefs(): readonly EntryRef[] {
  return [...ERAS.flatMap((e) => e.evidence), ...CAPABILITIES.flatMap((c) => c.evidence)]
}

/**
 * The span the timeline can actually account for.
 *
 * Named for what it measures, not for what the source CV asserts. That CV
 * says ten years; the years before 2020-05 are summarised there with no
 * dates, so ten is a figure this file cannot derive and will not print. What
 * it can print is the span it holds dates for, labelled as exactly that,
 * with the undated era shown beside it rather than folded into it.
 *
 * Set PRACTICE_START to the first job's start month to make the fuller
 * figure derivable. Until someone confirms that month it stays null, because
 * the one number a reader is most likely to check against the timeline
 * directly below it is the worst possible place to guess.
 */
export const PRACTICE_START: string | null = null

export function datedSpanYears(now = new Date()): number {
  const dated = ERAS.map((e) => e.from).filter((f): f is string => f !== null)
  const earliest = (PRACTICE_START ? [PRACTICE_START, ...dated] : dated).sort()[0]
  if (!earliest) return 0
  const [y, m] = earliest.split('-').map(Number)
  const months = (now.getFullYear() - y!) * 12 + (now.getMonth() + 1 - m!)
  return Math.floor(months / 12)
}

/** Whether the timeline has an era it cannot date — the page says so if it does. */
export function hasUndatedEra(): boolean {
  return ERAS.some((e) => e.from === null)
}
