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
    direct:
      'Brokerage density appears to explain the direct-deal rate; population explains it better. Two log-log scatter plots of 176 Korean districts against two competing explanations.',
    renewal:
      'How jeonse deposits moved on renewal, with and without the statutory renewal right. The medians are 4.9% and 4.7%; the shares above the 5% cap are 0.2% and 30.7%.',
    prices:
      'Apartment price change by district, measured between matched complexes. A diverging cartogram on the same grid as the brokerage map.',
    privacy:
      'What this site learns about a visitor and where it goes. It sets no cookies at all, and that claim is checkable against the source rather than asserted.',
    revenue:
      'A BI dashboard for apartment management app revenue. The complex roster and its geography are real filings; every contract, price, invoice and salesperson is generated from a fixed seed.',
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

  direct: {
    heading: 'Direct deals, and the better explanation',
    lead:
      'Districts with more brokerage offices per resident have fewer sales done without a broker. r = {rDensity}. But population explains the same rate better — r = {rPop} — and the two explanations are tangled with each other at {rBoth}.',
    chartHeading: 'The same 176 districts, two different explanations',
    note:
      'Two panels rather than one, because the finding is not a correlation but a comparison of correlations. Publishing the left panel alone would be true and misleading. With the same y axis and the same points, the left panel\u2019s story is visibly still there in the right one — which is what "partly a proxy" looks like. Both axes are logarithmic. The rate runs from {minRate}% to {maxRate}% and the population across an order of magnitude, so on linear axes one district sits alone in a corner and the other 175 pile into a smudge, and every correlation quoted becomes a statement about that district rather than about the country. There is no trend line: a line would read as a claim about cause, and the point of the page is that neither panel establishes one.',
    caption: '{plotted} districts · {deals} apartment sales · filed {from} – {to}',
    summary:
      'Two log-log scatter plots of the direct-deal rate across 176 Korean districts. The left explains it by brokerage offices per 10,000 residents, the right by population. The right correlation is the stronger one.',
    source:
      'MOLIT apartment sale transactions · share filed as a direct deal · office and population counts from the same table as the district map · 이용허락범위 제한 없음',
    density: 'Offices per 10,000 residents',
    population: 'Registered population',
    rate: 'Direct-deal share',
    r: 'r = {r}',

    readoutHead: 'In numbers',
    rowNational: 'National direct-deal share',
    rowMedian: 'Median district',
    rowRDensity: 'r · office density ↔ direct rate',
    rowRPop: 'r · population ↔ direct rate',
    rowRBoth: 'r · population ↔ office density',

    limitsHead: 'What this figure does not hide',
    confoundTerm: 'Neither panel is a cause',
    confoundWhy:
      'That population explains it better does not make population the cause either. Places with fewer people have fewer apartments, fewer sales, more transactions between people who already know each other, and no market for an office to survive in — all of it moves together. What the figure can show is that quoting the office-density number alone would look like a finished explanation, and that is why there are two panels.',
    floorTerm: 'Thin districts are not plotted',
    floorWhy:
      'A district with fewer than {floor} apartment sales in the window is counted but not drawn. Where there were nine sales, one transaction either way is the difference between a 0% and a 33% direct rate. Of the {districts} districts with any sales, {plotted} are plotted and {dropped} are not. A dot resting on eleven deals looks exactly like one resting on eleven thousand.',
    aptTerm: 'Apartments only',
    aptWhy:
      'Transaction filings are separate APIs for apartments, row houses, detached houses, officetels, land and commercial property. Only apartments were fetched — six types would be six times the calls, and each type has its own brokerage habits, so mixing them would blur what the y axis measures. "Direct-deal rate" here means the direct-deal rate on apartment sales.',

    gapTerm: 'Not every response arrived',
    gapWhy:
      'The API is called once per (district, month), so a complete window is {expected} responses. {responses} came back and {missing} did not — this gateway goes down in bursts of minutes, and the missing pairs are mostly the first month of the window for a few central Seoul districts. Those districts are computed over eleven months rather than twelve. Filling them will move the numbers slightly, which is why the correlations on this page are filled in from the data rather than written into the sentences.',

    back: '← Portfolio',
  },
  prices: {
    heading: 'Apartment price change · by district',
    lead:
      'Matched by complex and by size band, {fell} districts fell and {rose} rose. The median is {median}%, the range {min}% to {max}%. Zero is a real middle, so this map splits its colour in two directions.',
    mapHeading: '{late}–{lateEnd} against {early}–{earlyEnd}',
    note:
      'A district\u2019s median sale price is the wrong thing to compare — it moves when the mix of what sold moves, so a neighbourhood that did not change appears to rise. The unit here is a (district, complex, 10 m² band) that traded at both ends of the window: {pairs} of them. Each contributes one percentage change of its price per unit area, and the district is the median of its pairs. That holds the building, the size class and the neighbourhood fixed, which is as close to repeat sales as filings without a unit identifier allow. Same 245 cells as the brokerage map, same placement — only the value differs.',
    caption: '{measured}/{districts} districts · {pairs} matched pairs · median of per-pair change',
    legend: 'Where each class starts, and how many districts are in it · colour splits at zero',
    unmeasured: 'Not measurable',
    listing: 'See all of them in rank order',
    summary:
      'A cartogram filling South Korea with 245 hexagons, coloured by apartment price change measured between matched complexes. Falls are teal, rises orange, and cells near zero sit close to the background.',
    source:
      'MOLIT apartment sale transactions · price per unit area compared within the same complex and size band · grid identical to the district map · 이용허락범위 제한 없음',
    tipRate: 'same complexes',
    tipPairs: ' pairs',

    limitsHead: 'What this map does not hide',
    pairsTerm: 'Not a comparison of medians',
    pairsWhy:
      'Measured across {pairs} pairs. Districts with fewer than {floor} are left without a value — a district resting on twenty pairs and one resting on nine hundred draw the same hexagon, so the popup carries the pair count. When a cell surprises you, read that number first.',
    unmeasuredTerm: '{unmeasured} districts have no colour',
    unmeasuredWhy:
      'No complex in them traded at both ends of the window. They keep a hexagon in a neutral fill rather than becoming a hole: the country\u2019s outline is why this map is readable, and an empty cell meaning "no evidence" reads as "no change". Those are different statements.',
    windowTerm: 'Not an annual figure',
    windowWhy:
      'The first three months of a twelve-month window against the last three — "{late}–{lateEnd} against {early}–{earlyEnd}". It is neither a yearly rate nor a recent trend. And the months are filing months, not signing months.',
    divergeTerm: 'A second colour',
    divergeWhy:
      'This site had exactly one colour. A signed value is read by hue — that is the convention, and a reader should not have to consult a legend to learn which way a cell points — so the falling half got one of its own. It was added on the data\u2019s terms: the two ends are matched on contrast, 3.13:1 against 3.05:1 on paper and 5.76 against 5.91 on ink, because on a diverging scale a half that shouts louder is an argument rather than a measurement. The new role is measured by the same gate and published on /art-direction like every other one.',

    back: '← Portfolio',
  },
  renewal: {
    heading: 'The renewal right and the 5% cap',
    lead:
      'The median jeonse renewal rose {medianUp}% when the tenant invoked their renewal right and {medianDown}% when they did not. On the averages the cap appears to do nothing. What it does is not in the middle — it is in the ceiling: nine in ten invoked renewals stayed under {p90Up}%, and for the rest that line sits at {p90Down}%.',
    chartHeading: 'Deposit increase · by whether the renewal right was invoked',
    note:
      'Two distributions across one axis instead of side by side. Side by side they are two similar-looking shapes a reader has to overlay in their head; across one axis they are a single silhouette — a wall on one side, a tail on the other — and the comparison happens in the eye. The two groups differ by more than ten thousand contracts, so each is drawn as a share of itself, and both use the same pixels per point: a bar twice as tall is twice as common. Giving each half its own scale would have filled the picture more evenly and made the {peakUp}% spike look like the {peakDown}% one.',
    caption: '{kept} renewals · jeonse to jeonse · filed {from} – {to}',
    summary:
      'Two histograms of deposit increases on jeonse renewals, mirrored across one axis: renewals where the tenant invoked the statutory renewal right above, and renewals where they did not below. The invoked side stops dead at 5%; the other continues well past it.',
    source:
      'MOLIT apartment rental transactions · renewals where both the previous and the new contract were jeonse · 이용허락범위 제한 없음',
    cap: '5%',
    up: 'Right invoked',
    down: 'Not invoked',
    unit: '%',
    share: '{share}% of {n}',

    readoutHead: 'Summary statistics — the first two rows are the trap',
    rowMedian: 'Median increase',
    rowP90: '90th percentile',
    rowOver: 'Share above 5%',
    rowFrozen: 'Share held flat',

    limitsHead: 'What this figure does not hide',
    jeonseTerm: 'Jeonse only',
    jeonseWhy:
      'Of {renewals} renewals, {kept} were used. A deposit and a monthly rent are not one number, and combining them needs a conversion rate this page would have to invent. The {mixed} renewals with a monthly rent on either side were dropped. What was dropped is counted rather than quietly disappeared.',
    blankTerm: '"Not invoked" may mean "not recorded"',
    blankWhy:
      'A blank renewal-right field is counted as not invoked. The filing does not distinguish a right that was not used from one that was not written down. If blanks are common, the lower distribution contains some invoked renewals — and that error makes the two distributions look MORE alike than they are. It weakens the finding rather than manufacturing it.',
    filedTerm: 'Filed, not signed',
    filedWhy:
      'A transaction is filed within a window after the contract is signed, so the month here is the month it was reported, not the month it was agreed. Across a twelve-month window that lag does not change the shape of the distribution, but no single month should be read off it.',

    back: '← Portfolio',
  },
  drill: {
    prompt: 'Click a hexagon to open that district\u2019s 읍면동 grid. A dimmed cell has fewer than five 읍면동 with an office, so there is no grid behind it.',
    loading: 'Loading…',
    error: 'Could not load that grid.',
    caption: '{name} · {cells} 읍면동 · {offices} offices',
    top: 'Busiest · {top}',
    close: 'Close',
    unit: '',
    share: '{share}% of the district',
    relative:
      'Colour is relative to this district — the brightest cell is its busiest 동, and the colours cannot be compared with another district\u2019s.',
  },
  districts: {
    heading: 'District cartogram',
    lead:
      'The whole country divided into 245 hexagons — one per district, each placed from a centroid computed off the boundary file. No name is visible. Hover one.',
    mapHeading: 'Brokerages per 10,000 residents · by district',
    note:
      'Colour is the value, and it took two wrong answers to get here. Hexagon size came first: four districts in central Seoul (Jung-gu 39.8, Gangnam 37.0, Yongsan 34.0, Seocho 31.3) own the top of the range, which squeezed the other eighty percent of the country into radii between 0.36 and 0.72 of full \u2014 invisible across 196 touching tiles. Seven classes of equal count came next. The counts were perfect and the widths were not: 5.0, 3.9, 2.4, 2.1, 2.3, 2.5 \u2014 and then 20.6, a top class wider than the other six together, which is why 19.3 and 39.8 were the same colour. These are natural breaks now (Fisher-Jenks, eight classes), cut so that the squared deviation inside each class is as small as it can be \u2014 asking the data where it separates instead of telling it. What that costs is even counts: the top two classes hold nine districts between them, so area on this map is proportional to nothing. The legend therefore prints the count in each class, and every exact number is one hover away.',
    caption: '{n} districts · one cell per district, coloured by offices per 10,000 residents.',
    legend: 'Eight natural-break classes · start value, then count',
    listing: 'See all of them in rank order',
    summary:
      'A cartogram that fills South Korea with 245 hexagons, one per district. The inner hexagon grows with real-estate brokerages per 10,000 residents. The same numbers are listed in rank order below.',
    source:
      'MOLIT brokerage registrations 2026-08-18 ÷ MOIS registered population 2026-07-31 · positions from area-weighted centroids of the 2023 NGII district boundaries · all under 이용허락범위 제한 없음',

    limitsHead: 'What this map does not hide',
    placedTerm: 'Tiles are displaced',
    placedWhy:
      'Mean displacement is 1.81 cells, about 43 km; the worst is 5.01 cells, 137 km. All eight of the worst are Hanam, Guri, Seongnam Jungwon, Gangdong, Seongnam Bundang, Gwangju, Yangpyeong and Jungnang — the ring east of Seoul, where districts are packed tightest. That is not a failure of the fit, it is what a cartogram is. One hexagon per district gives every district the same area, so the capital region must take more of the picture than it takes of the land, and something has to move. Before districts were stopped from crossing water, Wando and Jindo sat beside Jeju: nothing was wrong with their centroids, but Jeju had more cells than districts, the surplus had to be filled, and the two nearest candidates were taken. A global optimum over the wrong feasible set is still the wrong answer.',
    tiledTerm: 'The country is the grid',
    tiledWhy:
      'All 254 district boundaries were read — 4,506 exterior rings, 1.2 million points — and a hexagon cell counts as land when its centre falls inside one of them. That is 229 cells, plus 13 added at their own position for districts whose island is smaller than a single hexagon: 242. Then the part that matters: no district crosses water. The mask is split into connected components first — mainland, Ulleung, Ongjin, Geoje, Jeju — and a district belongs to the one nearest its centroid. A component with cells to spare drops the ones furthest from any district; one that is short grows toward the districts that want in. Jeju gave up two of its four, the mainland gained five, and 245 cells hold 245 districts with none left over. Inside each component the Hungarian algorithm on squared distance settles the rest, so it is the optimal arrangement rather than a greedy one. Nothing was placed by hand and a rerun produces the same file.',
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

  /* THE PRIVACY POLICY. See the note in ko.ts — this reads plainer than the
     rest of the dictionary on purpose, and every claim in it is checkable
     against the repository rather than asserted. */
  privacy: {
    heading: 'Privacy',
    lead:
      'What this site learns about a visitor, and where that goes. The short answer: it sets no cookies at all, and there is no account and no contact form.',
    updatedLabel: 'Last revised',

    scopeHeading: 'Scope',
    scopeBody:
      'This covers goldibug.com and the paths under it. Anywhere a link from this site points to keeps its own policy, which this document does not govern.',

    collectHeading: 'What is collected',
    collectNote:
      'There is no sign-up, no login, no comment thread and no contact form here. Not one field asks for a name, an email address or a phone number, so there is no visitor-supplied personal data to hold. What follows is what opening a web page produces on its own.',

    logLabel: 'Request records',
    logBody:
      'This site is served as static files by Cloudflare and runs no code at request time. Delivering and protecting a request leaves an IP address, a timestamp, the requested path and a browser identification string with Cloudflare. Cloudflare holds the per-request records; what reaches this site’s operator is aggregate figures.',

    analyticsLabel: 'Visit counts',
    analyticsBody:
      'Cloudflare Web Analytics. It plants no cookie and builds no browser fingerprint; what it aggregates is the page path, the referrer, the browser and operating-system family, a country inferred from the IP address, and load timings. It does not identify an individual visitor and does not follow anyone to another site. It is here for one reason: to know which pieces get read.',

    storageLabel: 'Browser storage',
    storageBody:
      'No cookies, no localStorage, no sessionStorage, no IndexedDB. Not even the chosen language is stored — the address carries it. That sentence is a checkable fact rather than an intention: no line in this repository touches browser storage.',

    fontLabel: 'Web fonts',
    fontBody:
      'The typeface comes from Google Fonts, but it is downloaded at build time and served from this site’s own domain. Opening a page makes no request to a Google server, so the typeface never hands a visitor’s IP address to Google.',

    thirdHeading: 'Where the data goes',
    thirdNote:
      'These two, and nothing else. Both are US companies, so using this site means accepting that connection data crosses borders.',
    cloudflareLabel: 'Cloudflare, Inc.',
    cloudflareBody:
      'Hosting, content delivery and visit counts. The request records and the analytics above are processed here.',
    googleLabel: 'Google LLC',
    googleBody:
      'This site is registered with Google AdSense. As it stands, the only thing that reaches Google is the publisher identifier that proves who owns the site — no visitor data.',

    adsHeading: 'Advertising',
    adsStatusLabel: 'As of now',
    adsStatusBody:
      'This site serves no ads. No ad script loads on any page, and that is enforced rather than intended: this site’s Content-Security-Policy admits exactly one external origin and it is not an ad network, so an ad script cannot execute at all.',
    adsFutureLabel: 'If that changes',
    adsFutureBody:
      'This document gets revised before any ad appears, not after. What would change: Google and its advertising partners would use cookies or equivalent identifiers to select ads and measure impressions and clicks, and that can draw on an IP address, device and browser details, which pages were read here, and activity on other sites. Google processes that data; this site’s operator cannot see it at the level of an individual visitor.',
    adsConsentLabel: 'Consent',
    adsConsentBody:
      'Visitors in the European Economic Area, the UK and Switzerland would be asked first, through the certified consent tool Google requires. Outside those places no consent dialog appears, and the refusals below stand in its place.',

    rightsHeading: 'What can be refused, and asked for',
    rightsNote:
      'The three below are here against the day this site carries ads. All three already work today.',
    optGoogleLabel: 'Google ad settings',
    optGoogleBody: 'Personalised ads can be turned off in a Google account’s ad settings.',
    optNaiLabel: 'Industry-wide opt-out',
    optNaiBody:
      'The Network Advertising Initiative and YourAdChoices opt a browser out of personalised advertising across many companies at once.',
    optBrowserLabel: 'Block it in the browser',
    optBrowserBody:
      'Blocking third-party cookies in browser settings is enough. This site uses no cookies, so blocking them breaks nothing here.',
    rightsLegalBody:
      'You have the right to access, correct, delete and halt the processing of your personal data. What complicates that here is that this site holds nothing which identifies a visitor, so there is no record to find and erase. Data processed for advertising is held by Google and has to be claimed from Google directly.',
    remedyBody:
      'Under Korean law a dispute or an infringement can be reported to the Personal Information Protection Commission, taken to the Personal Information Dispute Mediation Committee, or reported to the National Office of Investigation’s cyber bureau.',

    contactHeading: 'Contact',
    contactBody:
      'This site is run pseudonymously and publishes no email address. Questions about this policy, and requests to correct it, belong in an issue on the repository. It is a public channel, and that is worth knowing before writing in it.',
    contactIssues: 'Ask on GitHub',

    revisionHeading: 'Revisions',
    revisionBody:
      'Every change to this document is a commit in the repository. The date above moves only when the substance changes, never for a typo — putting a new date on an unchanged policy is a false statement about it.',
  },

  /* THE REVENUE DASHBOARD. See the note in ko.ts — the same gate reads both
     locales, and it fails the build if a percentage here is not a value the
     data holds or if one of the three `synthetic*` keys goes missing. */
  revenue: {
    heading: 'Apartment management app revenue',
    syntheticHero: 'The roster and its geography are real. The contracts and the revenue are not.',
    syntheticChart:
      'Complex names, provinces, districts, 법정동 and completion years are copied from 국토교통부 apartment transaction filings. Household counts are not in the filings and are estimated. Contracts, prices, invoices, cancellations and the sales organisation are generated from a fixed seed and correspond to nothing that happened — what a management app charges a complex does not exist in public form. Which is why the denominator of the penetration rate is the one figure here that was counted.',
    syntheticPanel: 'Contracts and revenue are generated; the complexes and the household denominator are filed and estimated',
    asOf: 'As of',

    kpiMrr: 'Monthly recurring revenue',
    kpiGrowth: 'Year over year',
    kpiPenetration: 'Penetration of addressable',
    kpiChurn: 'Gross revenue churn',
    kpiCoverage: 'New against churned',
    kpiNote: 'The five headline figures',

    mrrTitle: 'Monthly recurring revenue',
    mrrNote:
      'A step, not a line. A per-household fee times a household count that does not change is the same number every month until the contract changes, and joining the points with straight segments draws a climb through values the business never billed. That growth arrives in discrete signings is what the step carries.',
    mrrSummary:
      'Thirty-six months of subscription revenue as a stepped area. It rises in every month, with usage billings on their own scale beneath it.',
    usageTitle: 'Usage billings, on their own scale',

    flowTitle: 'Revenue movement',
    flowNote:
      'The line above cannot lie about its own shape but it can hide what is under it. Subscription revenue rises in all thirty-six months while a substantial share of the closing balance left over the same window. New business covers it every month. How much left is what these columns say.',
    flowSummary:
      'Monthly revenue movement as columns above and below zero: gains above, contraction and churn below.',
    flowGain: 'New · winback · expansion',
    flowLoss: 'Contraction · churn',

    ladderTitle: 'Price per household falls as complexes grow',
    ladderNote:
      'The bundle is held fixed and only household count varies. The realised tier averages cannot carry this claim: they mix the price structure with whatever those complexes happen to hold, and the largest tier has fewer than twenty accounts, so its average moves when one complex adds a service. Each bundle is therefore indexed to its own list price. The question is not what a bundle costs; it is how far, and in which direction, what a complex actually pays departs from the price list.',
    ladderSummary:
      'Two reference bundles priced up a household ladder, each as a share of its own list rate. Both fall monotonically.',
    ladderEntry: 'entry · notices only (list 150/household)',
    ladderCore: 'core · notices, collection, parking (list 950/household)',
    ladderFloored: 'Dots mark where the monthly floor, not the rate card, set the price · x-axis is households',

    tierTitle: 'What the tiers actually billed',
    tierNote:
      'Per complex on the left, per household on the right. The two run in opposite directions. A tier that departs from the ladder beside it is buying more or less than the reference bundle, which is a different finding and needs its own sample size — so the account count sits in the table.',
    tierPerComplex: 'Monthly revenue per complex',
    tierPerHousehold: 'Monthly revenue per household',

    attachTitle: 'Attach rate by service',
    attachNote:
      'Eleven panels rather than eleven hues. The site has two colours; eleven series on one axis would need nine more, and generating them puts pairs on the chart that a colourblind reader — or a monochrome printer — cannot separate. Faceting costs the ability to read one service against another at a glance and buys the ability to read each shape at all. The scale is the same in every panel: per-panel scaling would make a service almost nobody holds and one that more than half of them hold draw identical curves.',
    attachSummary:
      'Attach rate over time for eleven services, faceted into eleven small panels on one shared scale.',

    penTitle: 'Penetration by district',
    penNote:
      'The same 245 hexagons the brokerage and price maps use, borrowed rather than recomputed: the one thing a reader should be able to assume about two maps on one site is that the same shape means the same place. The denominator is not every filed complex but the ones large enough to have a management office.',
    penSummary:
      'Contracted complexes as a share of the addressable market, on a 245-cell hexagon cartogram in one hue and six classes.',
    penLegend: 'Class edges (%) and districts in each',
    penNone: 'None to sell to',

    cohortTitle: 'Cohort retention',
    cohortNote:
      'A triangle rather than a grid, because that is the shape of the data: a cohort that signed two months before the window ends has two months of history and no more, and filling the rest with anything would invent it. Complexes still billing on the left; revenue against the cohort\'s own first month on the right. The two come apart, because the survivors buy more, and one grid cannot hold that gap.',
    cohortKept: 'Complexes still billing',
    cohortValue: 'Revenue against first month',

    attainTitle: 'Quota attainment',
    attainNote:
      'The bars grow from the 100 line rather than from the left edge. From the left edge a rep just short of quota and one just past it draw almost the same bar and the sign disappears, which is the only thing the chart is for.',
    attainSummary:
      'Quota attainment per salesperson, as bars either side of the 100 per cent line.',

    tableOpen: 'Read as numbers',
    colMonth: 'Month',
    colMrr: 'Subscription',
    colUsage: 'Usage',
    colComplexes: 'Complexes',
    colNew: 'New',
    colWinback: 'Winback',
    colExpansion: 'Expansion',
    colContraction: 'Contraction',
    colChurn: 'Churn',
    colHouseholds: 'Households',
    colPerComplex: 'Per complex',
    colPerHousehold: 'Per household',
    colFloored: 'Floored',
    colTier: 'Tier',
    colService: 'Service',
    colFirst: 'First',
    colLast: 'Last',
    colContracts: 'Contracts',
    colDistrict: 'District',
    colSido: 'Province',
    colAddressable: 'Addressable',
    colRate: 'Rate',
    colCohort: 'Cohort',
    colSize: 'Size',
    colKept: 'Kept',
    colValue: 'Value',
    colRep: 'Rep',
    colRank: 'Rank',
    colRegion: 'Region',
    colAccounts: 'Accounts',
    colQuota: 'Quota',
    colAttainment: 'Attainment',

    services: {
      parking: 'Parking control',
      visitor: 'Visitor vehicles',
      access: 'Resident access',
      cctv: 'CCTV feed',
      billing: 'Fee collection',
      notice: 'Notices',
      community: 'Facility booking',
      defect: 'Defect intake',
      locker: 'Parcel lockers',
      vote: 'Resident voting',
      sms: 'SMS fallback',
    },
    tiers: {
      sub: 'Under 150',
      small: '150–400',
      mid: '400–900',
      large: '900–2,000',
      xlarge: '2,000 and over',
    },

    back: 'Back to the portfolio',
  },

  notFound: {
    title: 'Not found',
    body: 'There is nothing at this address. The four chapters below are the whole site.',
  },
}
