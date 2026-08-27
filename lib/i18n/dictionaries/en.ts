/**
 * English.
 *
 * Deliberately NOT a transliteration of the Korean. The Korean copy is
 * written in a particular voice — short declaratives, no marketing register —
 * and the English has to carry that voice rather than the word order.
 *
 * This file is UI chrome. The 13 entries under content/ are the author's
 * own writing and are not translated here or anywhere by machine: on this
 * site the prose IS the evidence, so a translated `constraint` line that the
 * author did not write would undermine the claim the page is making.
 */
export const en = {
  a11y: {
    skipToContent: 'Skip to content',
    navLabel: 'Section index',
    languageLabel: 'Language',
  },

  site: {
    statement:
      'A personal web product that translates one person’s thinking and life into a single interface — and proves the ability to build that interface at the same time.',
    description:
      'PERSONAL INTERFACE — a personal web product, front-end portfolio, interactive editorial and life archive.',
    feedTitle: 'Everything',
  },

  sections: {
    think: {
      question: 'How does he reason?',
      blurb:
        'The path to a conclusion, kept rather than the conclusion alone. What was read, where it was wrong, what changed. Essays, notes, and thoughts not yet sorted.',
    },
    make: {
      question: 'What was actually built?',
      blurb:
        'Decisions, not screenshots. What the constraint was, what was given up, what remains. The work and the reasons behind it.',
    },
    live: {
      question: 'How does he live?',
      blurb:
        'What happens in the hours that are not work. A person who makes things is not explained by the things alone.',
    },
    trace: {
      question: 'What is left behind?',
      blurb:
        'A record that accumulates in time. Versions that passed, attempts abandoned, minds changed. An archive is not a place for successes only.',
    },
  },
  home: {
    scrollHint: 'One scroll is the whole visit',
    enter: 'More in {label}',
    artDirection: 'Art direction',
  },

  nav: {
    goldenPath: 'Golden path',
    backToGoldenPath: '← Golden path',
  },

  chapter: {
    entries: 'ENTRIES',
    records: 'RECORDS',
    archiveNote:
      'This chapter merges what the other three accumulated with its own log, on one timeline. It is not a separately maintained list — it is a trace derived from the work.',
    buildLink: 'The record nobody wrote — BUILD →',
    prev: '{index} Previous',
    next: '{index} Next',
    emptyArchive: 'No records yet.',
    emptyChapter: '{label} is still empty.',
  },

  entry: {
    empty: 'Nothing here yet.',
    readingMinutes: '~{n} min',
    updatedAt: 'Revised {date}',
    newer: '← Newer',
    older: 'Older →',
    decisions: 'Decisions',
    constraint: 'Constraint',
    tradeoff: 'Given up',
    outcome: 'What remains',
    provenance: 'Record',
    bornAt: 'First committed {date},',
    untouched: 'and untouched since.',
    touchedAgain: 'and changed {n} times since.',
    fullBuildRecord: 'The full build record →',
    untranslated: 'This entry exists only in Korean.',
  },

  topics: {
    label: 'Topics',
    all: 'All',
    filterLabel: 'Narrow by topic',
    countOf: '{n}',
    frontend: { name: 'Frontend', blurb: 'What actually happens in a browser — rendering, state, bundles.' },
    architecture: { name: 'Architecture', blurb: 'What was put where, and why it was divided that way.' },
    design: { name: 'Design', blurb: 'Colour, type, contrast. The parts that were calculated rather than chosen by eye.' },
    tooling: { name: 'Tooling', blurb: 'The things that make the things. Builds, gates, scripts.' },
    debugging: { name: 'Debugging', blurb: 'Finding what was quietly wrong. Hypotheses and refutations.' },
    knowledge: { name: 'Knowledge', blurb: 'Reading, sorting, and making it findable again.' },
    process: { name: 'Process', blurb: 'How the work is done. Habits, decisions, and reversals.' },
    life: { name: 'Life', blurb: 'The hours that are not work. Habits, people, places.' },
  },
  logKind: {
    version: 'a version that passed',
    abandoned: 'an attempt abandoned',
    reconsidered: 'a mind changed',
  },

  area: {
    app: 'routes',
    components: 'components',
    lib: 'logic',
    styles: 'styles',
    content: 'writing',
    scripts: 'gates',
    docs: 'docs',
    config: 'config',
    generated: 'generated',
  },

  eras: {
    beforeMilestone: 'before any milestone was declared',
  },

  field: {
    toSpace: 'View as space',
    toList: 'Back to list',
    loading: 'Loading the WebGL scene…',
    failed: 'The scene did not load. Every record is in the list below.',
    unsupported:
      'This browser cannot run WebGL, so the spatial view was not opened. Every record is in the list below.',
    note: 'One bar is one record. Height is length, lanes are chapters, the horizontal axis is time.',
    reducedNote: 'The camera is fixed, respecting your motion setting.',
    pointerNote: 'Move the pointer and the view follows.',
    hudHint: 'point at a bar for its title',
    noRecords: 'No records',
    records: '{n} RECORDS',
  },

  build: {
    description:
      'The record of how this interface was built. Every commit, grouped into the phases the history itself declared, each one linked to its diff.',
    ogTitle: 'BUILD — what was built, when, and how',
    ogDescription:
      'The record of how this interface was built. Authored lines and generated lines counted separately, every commit linked to its diff.',
  },
  sigil: {
    heading: 'Sigil',
    label:
      'A mark computed from this repository\u2019s own record: {count} commits, {used} of {slots} slots filled.',
    legend:
      'One slot per commit. Depth is how many lines that commit actually changed by hand, and the marks reaching past the ring are the phases the history declared for itself. The {remaining} empty slots have not been earned yet. When they are, a new ring opens inside and the outer one sets for good — nothing already drawn ever moves again.',
    entryLabel: 'The mark with only this entry\u2019s commits lit; the ring is the whole record.',
    caption: '{used} of {slots}',
  },

  notFound: {
    title: 'Not found',
    body: 'There is nothing at this address. The four chapters below are the whole site.',
  },
}
