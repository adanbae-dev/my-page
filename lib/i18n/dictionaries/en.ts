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
        'The path to a conclusion, kept rather than the conclusion alone. What was read, where it was wrong, what changed.',
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
        'A record that accumulates in time. Versions that passed, attempts abandoned, minds changed. Not a place for successes only.',
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

    registerLabel: 'How to read this',
    registerFull: 'As written',
    registerPlain: 'In plain words',
    plainNotice:
      'This is the entry retold in plain words. The sentences the author wrote are on the other side of the switch.',
    plainMachine: 'Nobody wrote the sentences on this page by hand.',
    plainReadingMinutes: '~{n} min plain',
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
      'One slot per commit. Depth is how many lines that commit actually changed by hand, and the marks reaching past the ring are the phases the history declared for itself. The {remaining} empty slots have not been earned yet. As a ring fills the next one opens inside it and the outer one sets for good. Until all three are full, a slot already drawn does not move again.',
    entryLabel: 'The mark with only this entry\u2019s commits lit; the ring is the whole record.',
    chapterLabel: 'The mark with this chapter\u2019s {count} commits lit.',
    caption: '{used} of {slots}',
  },

  seo: {
    topicDescription: '{blurb} {n} entries filed under this topic{titles}.',
    topicTitles: ' — {list}',
    artDirection:
      'Two grounds and one accent, a machine-checked contrast contract, the type scale, the motion vocabulary, and a mark computed from the commit record.',
    practice:
      'Front-end practice split into what is claimed and what can be shown — including the claims this site has not proven yet.',
  },

  weight: {
    measured: 'Measured on the {date} build ({head}) \u00b7 gzip transfer size',
    heading: 'Weight',
    table: 'Every route has a gzip budget, and a build that exceeds one fails.',
    row: '{key}',
    heaviest: 'Heaviest route {route}',
    shared: 'Shared JS, loaded by every route',
    deferred: 'Chunks no route loads on first paint',
  },

  colophon: {
    heading: 'Colophon',
    commits: 'Commits',
    span: 'Span',
    entries: 'Entries',
    lines: 'Lines written by hand',
    weight: 'This page',
    head: 'Measured at',
    note:
      'Every figure in this block is computed from the repository. None of it is typed by hand, and a build fails when the gate behind any of these numbers disagrees.',
  },

  /* THE PRACTICE PAGE. See the note in ko.ts — structure lives in
     lib/practice.data.ts and only sentences are here. */
  practice: {
    heading: 'Practice',
    lead:
      'A record of working as a front-end engineer. This page splits it into two axes — what is claimed and what can be shown — so it can print the case a résumé is built to hide.',
    spanLabel: 'Span with dates',
    spanValue: '{n} years',
    undatedNote:
      'The years before May 2020 are summarised without dates in the source, so one era is shown undated. Every other number on this page is computed from the repository, and one unverifiable figure was not going to be slipped in among them.',
    orgNote:
      'No employer is named. Three already-published entries open by promising the reader that the organisation, the hosts and the member data are excluded, and they carry aggregate figures on the strength of that promise — naming a company here would revoke it retroactively. The role and the scope are stated in full.',

    erasHeading: 'Where the years went',
    scopeLabel: 'Owned',
    changedLabel: 'What this era changed',
    evidenceLabel: 'What you can read',
    present: 'present',
    undated: 'no recorded start',

    eras: {
      'platform-lead': {
        role: 'Frontend part lead',
        org: 'Proptech · internal platform and customer-facing services',
        scope:
          'Built and ran the design system — React components and an icon library as packages, automated publishing to a private registry, foundations and tokens designed together with the design team. Stood up a new service on a monorepo, rebuilt the mobile web, and built an external CRM from scratch. The deployment pipeline was set up in this era too.',
        changed:
          'The work moved from getting it right alone to keeping several people from getting it wrong. The habit of writing conventions into a document and pinning them with a gate started here — because things that fail silently kept getting through review.',
      },
      'tech-lead': {
        role: 'Tech lead',
        org: 'Early-stage startup · mobile app and API',
        scope:
          'Owned a React Native app from screen design through store release, and built a React admin and a NestJS REST API alongside it. Designed the OAuth flow and JWT authorisation directly, and ran CI/CD and the servers from the same seat.',
        changed:
          'Learned that almost no decision ends at the front end. Only after writing the auth flow through to the server did it become clear what token expiry actually costs the screen.',
      },
      'it-team-lead': {
        role: 'IT team lead',
        org: 'Logistics B2B2C · warehouse management',
        scope:
          'Developed a B2B2C platform while analysing the existing warehouse management system and doing the up-front design for its rebuild. The real deliverable was the handover and the technical write-up at an early stage of the service.',
        changed:
          'Eight months, and what was left behind was documents rather than code. It was the first time the deliverable in a role built around handover turned out to be a record someone else could read.',
      },
      'early-years': {
        role: 'Frontend · app development',
        org: 'Agency and early-stage startups (summarised)',
        scope:
          'Built a React Native car-sharing service, and maintained admin tools and services on Vue 2 and Angular. Took over and worked in legacy environments across a number of agency projects.',
        changed:
          'Most of it was inherited work. The habit of reading someone else\'s code first was formed here, and it is also why the tool being built now is one that reads other people\'s changes.',
      },
    },

    capabilitiesHeading: 'What can be shown',
    capabilitiesNote:
      'The number is a count of entries you can open on this site, not a rating. The zeros are not hidden — a zero means the CV asserts it and this site has not proven it yet, which also makes it the list of what to write next.',
    claimedUnproven: 'on the CV, unproven here',
    unclaimedProven: 'not on the CV, proven here',
    evidenceCount: '{n} entries',
    noEvidence: '0 entries',

    groups: {
      interface: 'Interface',
      architecture: 'Architecture',
      verification: 'Verification',
      platform: 'Platform',
      knowledge: 'Knowledge',
    },

    capabilities: {
      'react-typescript': 'React · TypeScript · Next.js',
      'css-systems': 'CSS systems and design tokens',
      'client-state': 'Client state design',
      accessibility: 'Accessibility — contrast and target contracts',
      'app-architecture': 'Application architecture',
      boundaries: 'Trust boundaries',
      monorepo: 'Monorepo — pnpm · Turborepo',
      desktop: 'Electron desktop structure',
      testing: 'Testing — unit and integration',
      'build-gates': 'Build gates',
      measurement: 'Deciding by measurement',
      diagnostics: 'Diagnostic tooling',
      'release-process': 'Release and branching strategy',
      'node-tooling': 'Building Node tooling',
      'ci-cd': 'CI/CD — Jenkins · ArgoCD',
      cloud: 'AWS — EC2 · ECR · EKS · S3 · RDS',
      auth: 'OAuth2 · JWT',
      'llm-engineering': 'LLM engineering',
      statistics: 'Statistics and notation',
      'writing-decisions': 'Writing decisions down',
    },

    studyHeading: 'Study',
    study: {
      'cs-statistics': 'Computer science · data statistics, double major — in progress',
      'engineering-bs': 'BEng — mechatronics',
    },

    contactHeading: 'Contact',
    contactNote:
      'One channel: GitHub. It is the only identity this site publishes. There is deliberately no phone number, address or email address, and a gate fails the build if any of the three appears on this page.',
    contactGithub: 'GitHub profile →',
  },

  notFound: {
    title: 'Not found',
    body: 'There is nothing at this address. The four chapters below are the whole site.',
  },
}
