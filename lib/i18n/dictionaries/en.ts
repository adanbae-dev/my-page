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
    touchedAgainOne: 'and changed once since.',
    fullBuildRecord: 'The full build record →',
    untranslated: 'This entry exists only in Korean.',

    registerLabel: 'How to read this',
    registerFull: 'As written',
    registerPlain: 'In plain words',
    plainNotice:
      'This is the entry retold in plain words. The sentences the author wrote are on the other side of the switch.',
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
    practiceLabel: 'The mark with the {n} commits behind what this page points at lit; the ring is the whole record.',
    chapterLabel: 'The mark with this chapter\u2019s {count} commits lit.',
    caption: '{used} of {slots}',
  },

  seo: {
    topicDescription: '{blurb} {n} entries filed under this topic{titles}.',
    topicDescriptionOne: '{blurb} {n} entry filed under this topic{titles}.',
    topicTitles: ' — {list}',
    artDirection:
      'Two grounds and one accent, a machine-checked contrast contract, the type scale, the motion vocabulary, and a mark computed from the commit record.',
    practice:
      'Front-end practice split into what is claimed and what can be shown — including the claims this site has not proven yet.',
    portfolio:
      'Things built here. A tile cartogram of Korea, and why it ships with its values missing.',
    districts:
      'Brokerages per 10,000 residents across 245 Korean districts as a hexagon-grid cartogram, with the displacement and the eleven absences stated.',
  },

  weight: {
    measured: 'Measured on the {date} build ({head}) \u00b7 gzip transfer size',
    heading: 'Weight',
    table: 'Every route has a gzip budget, and a build that exceeds one fails.',
    row: '{key}',
    heaviest: 'Heaviest route {route}',
    named: 'held to a limit of its own',
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
    spanLabel: 'In practice',
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
    evidenceCountOne: '{n} entry',
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

  /* THE PORTFOLIO PAGE. See the note in ko.ts. */
  portfolio: {
    heading: 'Portfolio',
    lead:
      'Things built here. The first is a cartogram, shipped with its values missing — an empty layer is better than a number nobody can check.',

    cartogram: {
      heading: 'A tile cartogram of Korea',
      intro:
        'A tile cartogram draws every unit at the same size. On a real map Seoul is a dot and Gyeongbuk is enormous, so colouring the true shapes makes the reader compare areas when the question was about the value. Equal tiles remove that.',
      caption: '16 first-level divisions · registered population, 2026-07-31. Grid positions are placed by hand.',
      emptyLayer: 'no values yet',
      summary: 'A hexagon-grid cartogram of Korea\u2019s 16 first-level divisions. How full each hexagon is shows registered population; Gyeonggi is the largest and Sejong the smallest. The same numbers are listed in order below.',
      listing: 'See them in reading order',

      layers: {
        population: {
          title: 'Registered population',
          note: 'As of 2026-07-31. It counts registrations rather than people — it includes residents whose whereabouts are unregistered and excludes foreign nationals. The published file is 3,619 rows of neighbourhoods with no province totals in it, so these numbers are those rows summed by province.',
          caption: '{n} divisions · bar length is population.',
          summary: 'A hexagon-grid cartogram of registered population across Korea\u2019s 16 first-level divisions. Gyeonggi is the largest and Sejong the smallest. The same numbers are listed in order below.',
        },
        brokersPer10k: {
          title: 'Brokerages per 10,000 residents',
          note: 'Drawing the raw office count would redraw the population map — 82,445 nationally, and the largest counts sit where the most people do. Dividing changes the order. Sejong at 21.5 and Jeju at 21.0 come out above Seoul at 20.4, and Gyeonggi, which has more offices than anywhere else at 22,708, lands mid-table at 16.5. Gangwon is last at 11.4.',
          caption: '{n} divisions · bar length is offices per 10,000 residents.',
          summary: 'A hexagon-grid cartogram of real-estate brokerages per 10,000 residents. Sejong and Jeju rank above Seoul; Gangwon is lowest. The same numbers are listed in order below.',
        },
      },
      limitsHead: 'Why it stops here',
      sggTerm: '~250 districts',
      sggWhy:
        'The tiles would fit the budget. The positions would not: they are not checkable at a glance, and I do not have real centroids under a license that permits redistribution. Placing 250 tiles from memory would be inventing data.',
      dongTerm: '~3,500 neighbourhoods',
      dongWhy:
        'Measured: this route may spend 23.4 KB of gzipped HTML, and 3,500 tiles do not fit. A 3,500-tile cartogram is also not one anybody reads.',
      valueTerm: 'The value layer',
      valueWhy:
        'Still empty. It has to be 공공누리 type 1 — a visualisation is a derivative work, and types 3 and 4 forbid modification — its labels have to work in both locales, and it has to answer a question rather than exist. No dataset has cleared all three yet.',

      divisions: {
        '12': 'Jeonnam–Gwangju',
        '11': 'Seoul',
        '26': 'Busan',
        '27': 'Daegu',
        '28': 'Incheon',
        '30': 'Daejeon',
        '31': 'Ulsan',
        '36': 'Sejong',
        '41': 'Gyeonggi',
        '43': 'Chungbuk',
        '44': 'Chungnam',
        '47': 'Gyeongbuk',
        '48': 'Gyeongnam',
        '50': 'Jeju',
        '51': 'Gangwon',
        '52': 'Jeonbuk',
      },
    },

    closing:
      'The plan this page executes against is docs/DATA-VISUALIZATION.md. One item on it is finished — this grid. The rest has no evidence yet.',
  },

  districts: {
    heading: 'District cartogram',
    lead:
      'The whole country divided into 245 hexagons — one per district, each placed from a centroid computed off the boundary file. No name is visible. Hover one.',
    mapHeading: 'Brokerages per 10,000 residents · by district',
    note:
      'Hexagon size is the value. The province map filled each hexagon from the bottom; this one scales it — there is no label to protect here, and a bar this small would be a smudge. Scaling grows the shape in both dimensions, so area tracks the value only when the radius tracks its square root. The province map\u2019s linear scale and this one\u2019s square root are not an inconsistency: they encode through different properties.',
    caption: '{n} districts · hexagon size is offices per 10,000 residents.',
    listing: 'See all of them in rank order',
    summary:
      'A cartogram that fills South Korea with 245 hexagons, one per district. The inner hexagon grows with real-estate brokerages per 10,000 residents. The same numbers are listed in rank order below.',
    source:
      'MOLIT brokerage registrations 2026-08-18 ÷ MOIS registered population 2026-07-31 · positions from area-weighted centroids of the 2023 NGII district boundaries · all under 이용허락범위 제한 없음',

    limitsHead: 'What this map does not hide',
    placedTerm: 'Tiles are displaced',
    placedWhy:
      'Mean displacement is 2.01 cells, about 47 km; the worst is 6.02 cells, 138 km. Seven of the eight worst are Hanam, Gangdong, Namyangju, Songpa, Guri, Gwangju and Jungnang — the ring east of Seoul, where districts are packed tightest. That is not a failure of the fit, it is what a cartogram is. One hexagon per district gives every district the same area, so the capital region must take more of the picture than it takes of the land, and something has to move. The previous version let a district claim the nearest free cell whether or not it was land, which halved the displacement (1.05 cells, 23 km) and drew a scatter of hexagons in the sea rather than a country.',
    tiledTerm: 'The country is the grid',
    tiledWhy:
      'All 254 district boundaries were read — 4,506 exterior rings, 1.2 million points — and a hexagon cell counts as land when its centre falls inside one of them. That is 236 cells. Ten more were added, one for each district whose island is smaller than a single hexagon, giving 246 cells for 245 districts and one empty. Which district sits in which cell is settled by the Hungarian algorithm on squared distance, so it is the optimal arrangement rather than a greedy one. Nothing was placed by hand and a rerun produces the same file.',
    missingTerm: 'Eleven are absent',
    missingWhy:
      'The boundary file is 2023 and the population and brokerage files are 2026. In between, Hwaseong split into four wards, Incheon reorganised into five and Cheongju into two. No 2023 centroid exists for a district created in 2024 — Hwaseong\u2019s Dongtan, Manse, Byeongjeom and Hyohaeng; Incheon\u2019s Geomdan, Michuhol, Seohae, Yeongjong and Jemulpo; Cheongju\u2019s Seowon and Cheongwon. They are named rather than invented.',
    labelsTerm: 'There are no labels',
    labelsWhy:
      'Names do not fit on 245 hexagons. This map answers "where is the rate high", not "what is Sejong\u2019s rate". Names and numbers appear in a popup on hover. The popup needs JavaScript; with it off, the browser\u2019s own tooltip gives the same name and rate. For anyone who has neither, the full list in rank order is below.',

    tipRate: 'per 10,000 residents',
    tipOffices: ' offices',
    tipPeople: ' people',

    back: '← Portfolio',
  },

  notFound: {
    title: 'Not found',
    body: 'There is nothing at this address. The four chapters below are the whole site.',
  },
}
