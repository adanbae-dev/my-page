/**
 * Korean — the source of truth for the dictionary's SHAPE.
 *
 * `lib/i18n/dictionary.ts` derives `Dictionary` from `typeof ko` and then
 * declares `Record<Locale, Dictionary>`, so a key added here and forgotten in
 * en.ts is a type error rather than a Korean string leaking onto an English
 * page. That is the whole reason these are TypeScript modules and not the
 * JSON dictionaries the Next guide suggests: JSON cannot fail a build.
 *
 * Values are plain strings with `{name}` placeholders, filled by `t()`.
 * Never functions — three components here are Client Components and a
 * function cannot cross that boundary.
 *
 * No `as const`, deliberately. It would freeze every value into a literal
 * type and then en.ts could only satisfy `Dictionary` by repeating the Korean
 * text verbatim. What has to be enforced is which KEYS exist, not which
 * strings they hold.
 */
export const ko = {
  a11y: {
    skipToContent: '본문으로 건너뛰기',
    navLabel: '섹션 색인',
    languageLabel: '언어',
  },

  site: {
    statement:
      '한 사람의 생각과 삶을 하나의 인터페이스로 번역하면서, 그 인터페이스를 만드는 능력까지 동시에 증명하는 개인 웹 제품.',
    description:
      'PERSONAL INTERFACE — 개인 웹 제품 / FE 포트폴리오 / 인터랙티브 에디토리얼 / 라이프 아카이브.',
    feedTitle: '전체 기록',
  },

  sections: {
    think: {
      question: '어떻게 생각하는가',
      blurb:
        '완성된 결론보다 결론에 이른 경로를 남깁니다. 무엇을 읽었고, 어디서 틀렸고, 무엇을 바꿨는지. 글과 노트, 그리고 아직 정리되지 않은 생각들.',
    },
    make: {
      question: '무엇을 만들었는가',
      blurb:
        '스크린샷이 아니라 결정을 보여줍니다. 어떤 제약이 있었고, 무엇을 포기했고, 무엇이 남았는지. 작업물과 그것을 만든 이유.',
    },
    live: {
      question: '어떻게 사는가',
      blurb:
        '일하지 않는 시간에 무엇을 하는지. 만드는 사람은 만드는 것만으로 설명되지 않습니다.',
    },
    trace: {
      question: '무엇을 남겼는가',
      blurb:
        '시간순으로 쌓이는 기록. 지나간 버전, 폐기된 시도, 바뀐 마음. 아카이브는 성공한 것만 모으는 곳이 아닙니다.',
    },
  },
  home: {
    scrollHint: '스크롤 한 번이면 전부 봅니다',
    enter: '{label} 더 보기',
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
      '이 구간은 다른 세 구간에서 쌓인 기록과 이곳의 자체 기록을 하나의 시간축으로 합칩니다. 별도로 관리되는 목록이 아니라, 작업에서 파생된 흔적입니다.',
    buildLink: '아무도 쓰지 않은 기록 — BUILD →',
    prev: '{index} 이전',
    next: '{index} 다음',
    emptyArchive: '아직 기록이 없습니다.',
    emptyChapter: '{label} 구간은 아직 비어 있습니다.',
  },

  entry: {
    empty: '아직 항목이 없습니다.',
    readingMinutes: '약 {n}분',
    updatedAt: '고침 {date}',
    newer: '← 다음 글',
    older: '이전 글 →',
    decisions: 'Decisions',
    constraint: '제약',
    tradeoff: '포기한 것',
    outcome: '남은 것',
    provenance: '기록',
    bornAt: '{date}에 처음 커밋됐고,',
    untouched: '이후 손대지 않았습니다.',
    touchedAgain: '이후 {n}번 더 손댔습니다.',
    touchedAgainOne: '이후 한 번 더 손댔습니다.',
    fullBuildRecord: '전체 빌드 기록 →',
    /** Shown on an entry that exists only in another language. */
    untranslated: '이 글은 한국어로만 있습니다.',

    /* The plain register. `registerFull` names the entry as its author wrote
       it, not "the original" — the retelling is not a translation of it, and
       calling it an original invites the reader to read the pair as one. */
    registerLabel: '읽는 방식',
    registerFull: '원문',
    registerPlain: '쉽게',
    plainNotice: '이 쪽은 원문을 쉬운 말로 다시 쓴 판입니다. 저자가 쓴 문장은 원문 쪽에 있습니다.',
    plainReadingMinutes: '쉬운 판 약 {n}분',
  },

  topics: {
    label: '주제',
    all: '전체',
    filterLabel: '주제로 좁히기',
    countOf: '{n}편',
    frontend: { name: '프론트엔드', blurb: '브라우저에서 실제로 일어나는 것들 — 렌더링, 상태, 번들.' },
    architecture: { name: '구조', blurb: '무엇을 어디에 두었고 왜 그렇게 나눴는지.' },
    design: { name: '디자인', blurb: '색, 타입, 대비. 눈으로 고르지 않고 계산한 것들.' },
    tooling: { name: '도구', blurb: '만드는 것을 만드는 것. 빌드, 게이트, 스크립트.' },
    debugging: { name: '디버깅', blurb: '조용히 틀린 것을 찾아낸 기록. 가설과 반증.' },
    knowledge: { name: '지식', blurb: '읽고 정리하고 다시 찾을 수 있게 만드는 방법.' },
    process: { name: '과정', blurb: '어떻게 일하는지. 습관, 결정, 되돌린 것들.' },
    life: { name: '생활', blurb: '일하지 않는 시간. 습관, 사람, 장소.' },
  },
  logKind: {
    version: '지나간 버전',
    abandoned: '폐기된 시도',
    reconsidered: '바뀐 마음',
  },

  area: {
    app: '라우트',
    components: '컴포넌트',
    lib: '로직',
    styles: '스타일',
    content: '글',
    scripts: '게이트',
    docs: '문서',
    config: '설정',
    generated: '생성물',
  },

  eras: {
    beforeMilestone: '마일스톤이 선언되기 전',
  },

  field: {
    toSpace: '공간으로 보기',
    toList: '목록으로',
    loading: 'WebGL 씬을 불러오는 중…',
    failed: '씬을 불러오지 못했습니다. 아래 목록에 같은 기록이 전부 있습니다.',
    unsupported:
      '이 브라우저에서 WebGL을 쓸 수 없어 공간 보기를 열지 않았습니다. 아래 목록에 같은 기록이 전부 있습니다.',
    note: '막대 하나가 기록 하나입니다. 높이는 분량, 안쪽 줄은 구간, 가로축은 시간순.',
    reducedNote: '모션 설정을 존중해 카메라는 고정돼 있습니다.',
    pointerNote: '포인터를 움직이면 시점이 따라옵니다.',
    hudHint: '막대를 가리키면 제목이 나옵니다',
    noRecords: '기록 없음',
    records: '{n} RECORDS',
  },

  build: {
    description:
      '이 인터페이스가 만들어진 기록. 저장소의 커밋을 스스로 선언한 페이즈로 묶어, 각 커밋을 실제 diff로 연결합니다.',
    ogTitle: 'BUILD — 무엇을 언제 어떻게 지었는가',
    ogDescription:
      '이 인터페이스가 만들어진 기록. 직접 쓴 줄과 생성된 줄을 나눠 세고, 각 커밋을 실제 diff로 연결합니다.',
  },
  sigil: {
    heading: '인장',
    label:
      '이 저장소의 기록으로 계산한 인장. 커밋 {count}개, {slots}칸 가운데 {used}칸이 찼습니다.',
    legend:
      '칸 하나가 커밋 하나입니다. 깊이는 그 커밋이 직접 바꾼 줄 수이고, 바깥으로 튀어나온 표시는 저장소가 스스로 선언한 페이즈입니다. 비어 있는 {remaining}칸은 아직 쓰이지 않았습니다. 링이 차면 안쪽에 다음 링이 열리고 바깥 링은 그대로 굳습니다. 세 링이 모두 찰 때까지는 이미 그려진 칸이 다시 움직이지 않습니다.',
    entryLabel: '이 글의 커밋만 켜진 인장. 링은 저장소 전체 기록입니다.',
    practiceLabel: '이 페이지가 가리키는 글을 만든 커밋 {n}개가 켜진 인장. 링은 저장소 전체 기록입니다.',
    chapterLabel: '이 구간의 글을 만든 커밋 {count}개가 켜진 인장.',
    caption: '{slots}칸 중 {used}칸',
  },

  seo: {
    /* The topic pages had 22–33 character descriptions — the blurb alone. Too
       short to tell a searcher, or an answer engine, whether the page holds
       anything. Composed from what the page actually contains instead. */
    topicDescription: '{blurb} 이 주제로 분류된 글 {n}편{titles}.',
    topicDescriptionOne: '{blurb} 이 주제로 분류된 글 {n}편{titles}.',
    topicTitles: ' — {list}',
    artDirection:
      '이 인터페이스의 아트 디렉션. 두 개의 바탕과 하나의 액센트, 대비 계약, 타입 스케일, 모션 어휘, 그리고 저장소의 커밋 기록에서 계산되는 인장.',
    practice:
      '프론트엔드로 일해 온 기록을 주장과 증거 두 축으로 갈라 놓은 페이지. 이력서에 있으나 이 사이트에서 아직 증명하지 못한 것까지 그대로 표시합니다.',
    portfolio:
      '여기서 만든 것들. 대한민국 시도 타일 카토그램과, 값을 채우지 않은 채로 올린 이유.',
    direct:
      '중개사무소 밀도가 직거래율을 설명하는 것처럼 보이지만, 인구가 더 잘 설명합니다. 176개 시군구를 두 가지로 설명한 로그-로그 산점도 두 장.',
    renewal:
      '갱신요구권을 쓴 전세 갱신과 안 쓴 갱신의 보증금 인상률 분포. 중앙값은 4.9% 대 4.7%로 거의 같고, 5%를 넘는 비율은 0.2% 대 30.7%입니다.',
    prices:
      '같은 단지끼리 짝지어 잰 시군구별 아파트 가격변동. 하락과 상승이 색으로 갈리는 발산형 카토그램이고, 격자는 중개사무소 지도와 같습니다.',
    privacy:
      '이 사이트가 방문자에 대해 무엇을 알게 되고 그것이 어디로 가는지. 쿠키는 하나도 사용하지 않으며, 그 사실은 이 사이트의 소스로 확인할 수 있습니다.',
    revenue:
      '아파트 관리앱 매출 BI 대시보드. 단지 명부와 위치는 국토부 실거래가에서 온 실제 데이터이고, 계약·단가·매출·영업조직은 시드를 고정해 생성한 합성 데이터입니다.',
    bi:
      '아파트 관리앱 매출을 기간·시도·규모·관리방식·서비스·단지명으로 걸러 보는 대시보드. 필터가 지표와 도표와 표를 전부 같은 조건으로 다시 계산합니다.',
    districts:
      '대한민국 245개 시군구의 인구 1만 명당 중개사무소 수를 육각 격자 카토그램으로. 자리가 밀린 정도와 빠진 11곳까지 적어 둡니다.',
  },

  weight: {
    measured: '{date} 빌드({head}) 실측 · gzip 전송 크기',
    heading: '무게',
    table: '라우트마다 gzip 예산이 있고, 넘으면 빌드가 실패합니다.',
    row: '{key}',
    heaviest: '가장 무거운 라우트 {route}',
    named: '이 라우트만 별도 상한',
    shared: '모든 라우트가 받는 공용 JS',
    deferred: '첫 페인트에 아무 라우트도 받지 않는 청크',
  },

  colophon: {
    heading: '판권',
    commits: '커밋',
    span: '기간',
    entries: '글',
    lines: '직접 쓴 줄',
    weight: '이 페이지',
    head: '기준 커밋',
    note:
      '이 블록의 모든 숫자는 저장소에서 계산됩니다. 손으로 적은 것은 하나도 없고, 각 숫자를 만드는 게이트가 어긋나면 빌드가 실패합니다.',
  },

  /* THE PRACTICE PAGE.
     Sentences only. Structure, dates and evidence refs live in
     lib/practice.data.ts — an era's dates are a fact and its scope is a
     sentence, so they are stored apart for the same reason a chapter's
     order and its question are. `pnpm check:practice` fails the build if an
     id here loses its counterpart there, in either direction. */
  practice: {
    heading: '실무',
    lead:
      '프론트엔드로 일해 온 기록입니다. 이 쪽은 그것을 주장과 증거 두 축으로 갈라 놓은 페이지입니다 — 이력서가 감추도록 만들어진 쪽을 그대로 보여주려고요.',
    spanLabel: '실무 기간',
    spanValue: '{n}년',
    undatedNote:
      '2020년 5월 이전은 요약해 둔 자료에 날짜가 없어서 시기 하나를 날짜 없이 뒀습니다. 이 페이지의 다른 숫자는 모두 저장소에서 계산되므로, 확인할 수 없는 숫자 하나를 끼워 넣지 않았습니다.',
    orgNote:
      '회사 이름은 적지 않았습니다. 이미 공개한 글 세 편이 첫 줄에서 조직·호스트·회원 데이터를 뺀다고 약속한 채로 집계 수치를 싣고 있어서, 여기서 이름을 대면 그 약속이 소급해서 깨집니다. 역할과 책임 범위는 그대로 적었습니다.',

    erasHeading: '지나온 시기',
    scopeLabel: '맡은 것',
    changedLabel: '이 시기가 바꾼 것',
    evidenceLabel: '읽을 수 있는 것',
    present: '현재',
    undated: '날짜 미기록',

    eras: {
      'platform-lead': {
        role: '프론트엔드 파트장',
        org: '프롭테크 · 사내 플랫폼과 외부 서비스',
        scope:
          '디자인 시스템을 세워 운영했습니다 — React 컴포넌트와 아이콘 라이브러리를 패키지로 만들고 사내 레지스트리 배포를 자동화하고, 디자인 팀과 Foundation·토큰을 함께 설계했습니다. 모노레포로 신규 서비스를 올리고, 모바일 웹을 개편하고, 외부 CRM 을 새로 만들었습니다. 배포 파이프라인도 이 시기에 세웠습니다.',
        changed:
          '혼자 맞게 만드는 일에서 여럿이 틀리지 않게 만드는 일로 옮겨 왔습니다. 규약을 문서에 적고 게이트로 묶는 습관이 여기서 생겼습니다 — 조용히 틀리는 것은 리뷰로 막히지 않는다는 걸 반복해서 겪었기 때문입니다.',
      },
      'tech-lead': {
        role: '테크리드',
        org: '초기 스타트업 · 모바일 앱과 API',
        scope:
          'React Native 앱을 화면 설계부터 스토어 배포까지 맡았고, React 어드민과 NestJS REST API 를 함께 개발했습니다. OAuth 인증 흐름과 JWT 인가를 직접 설계했고, CI/CD 와 서버 운영도 이 자리에서 했습니다.',
        changed:
          '프런트만으로 끝나는 결정이 거의 없다는 것을 배웠습니다. 인증을 서버까지 직접 짜 본 뒤에야 토큰 만료를 화면에서 어떻게 감당해야 하는지 알게 됐습니다.',
      },
      'it-team-lead': {
        role: 'IT 팀리더',
        org: '물류 B2B2C · 창고 관리 시스템',
        scope:
          'B2B2C 플랫폼을 개발하면서 기존 창고 관리 시스템을 분석하고 리뉴얼 사전 설계를 했습니다. 서비스 초기 단계의 인수인계와 기술 정리가 실제 산출물이었습니다.',
        changed:
          '여덟 달 있었고 남긴 것은 코드보다 문서였습니다. 인수인계가 목적인 자리에서는 읽을 수 있는 기록이 산출물이라는 것을 처음 겪었습니다.',
      },
      'early-years': {
        role: '프론트엔드 · 앱 개발',
        org: 'SI · SM 과 초기 스타트업 (요약)',
        scope:
          'React Native 차량 공유 서비스를 만들었고, Vue 2 와 Angular 기반 어드민·서비스를 유지보수했습니다. 다수의 SI/SM 프로젝트에서 레거시 환경을 넘겨받아 다뤘습니다.',
        changed:
          '넘겨받는 일이 대부분이었습니다. 남이 쓴 코드를 먼저 읽는 습관이 이때 만들어졌고, 지금 남의 변경을 읽어 주는 도구를 만드는 이유이기도 합니다.',
      },
    },

    capabilitiesHeading: '무엇을 증명할 수 있나',
    capabilitiesNote:
      '숫자는 등급이 아니라 이 사이트에서 열어 볼 수 있는 글의 개수입니다. 0 은 감추지 않았습니다 — 이력서에는 적혀 있지만 여기서 아직 증명하지 못한 것이라는 뜻이고, 다음에 무엇을 써야 하는지이기도 합니다.',
    claimedUnproven: '이력서에 있으나 여기서 미증명',
    unclaimedProven: '이력서에 없으나 여기서 증명됨',
    evidenceCount: '{n}편',
    evidenceCountOne: '{n}편',
    noEvidence: '0편',

    groups: {
      interface: '인터페이스',
      architecture: '구조',
      verification: '검증',
      platform: '플랫폼',
      knowledge: '지식',
    },

    capabilities: {
      'react-typescript': 'React · TypeScript · Next.js',
      'css-systems': 'CSS 시스템과 디자인 토큰',
      'client-state': '클라이언트 상태 설계',
      accessibility: '접근성 — 대비와 타깃 계약',
      'app-architecture': '애플리케이션 구조',
      boundaries: '신뢰 경계 설계',
      monorepo: '모노레포 — pnpm · Turborepo',
      desktop: 'Electron 데스크톱 구조',
      testing: '테스트 — 단위와 통합',
      'build-gates': '빌드 게이트',
      measurement: '실측으로 정하기',
      diagnostics: '진단 도구',
      'release-process': '릴리스와 브랜치 전략',
      'node-tooling': 'Node 도구 제작',
      'ci-cd': 'CI/CD — Jenkins · ArgoCD',
      cloud: 'AWS — EC2 · ECR · EKS · S3 · RDS',
      auth: 'OAuth2 · JWT',
      'llm-engineering': 'LLM 엔지니어링',
      statistics: '통계와 표기',
      'writing-decisions': '결정을 글로 남기기',
    },

    studyHeading: '공부',
    study: {
      'cs-statistics': '컴퓨터공학 · 데이터통계학 복수전공 — 재학 중',
      'engineering-bs': '공학 학사 — 메카트로닉스',
    },

    contactHeading: '연락',
    contactNote:
      '연락 창구는 GitHub 하나입니다. 이 사이트가 공개하는 신원이 그것 하나여서요. 전화번호·주소·이메일은 일부러 없고, 게이트가 그 세 가지가 이 페이지에 들어오면 빌드를 실패시킵니다.',
    contactGithub: 'GitHub 프로필 →',
  },

  /* THE PORTFOLIO PAGE. Sentences only — the grid coordinates and the
     division codes live in lib/cartogram.data.ts. `pnpm check:cartogram`
     fails if a code here loses its counterpart there, in either direction. */
  portfolio: {
    heading: '포트폴리오',
    lead:
      '여기서 만든 것들입니다. 첫 번째는 카토그램인데, 값을 채우지 않은 채로 올렸습니다 — 확인할 수 없는 숫자를 넣는 것보다 비어 있는 편이 낫습니다.',

    cartogram: {
      heading: '대한민국 시도 카토그램',
      intro:
        '타일 카토그램은 모든 단위를 같은 크기로 그립니다. 실제 지도에서 서울은 점이고 경북은 거대해서, 진짜 모양으로 색을 칠하면 값을 묻는 질문에 넓이를 비교하게 됩니다. 같은 크기 타일이 그걸 없앱니다.',
      caption: '16개 시도 · 주민등록인구 2026-07-31. 격자 위치는 손으로 배치했습니다.',
      emptyLayer: '값 없음',
      summary: '대한민국 16개 시도를 육각형 격자로 그린 카토그램. 육각형이 찬 정도가 주민등록인구이고, 경기가 가장 많고 세종이 가장 적습니다. 같은 숫자가 아래 목록에 순서대로 있습니다.',
      listing: '읽는 순서대로 보기',

      layers: {
        population: {
          title: '주민등록인구',
          note: '2026-07-31 기준. 사람이 아니라 등록을 셉니다 — 거주불명자를 포함하고 외국인을 제외합니다. 공개 파일은 읍면동 3,619행이고 시도 합계가 없어서, 여기 숫자는 그 행들을 시도로 묶어 더한 값입니다.',
          caption: '{n}개 시도 · 막대 길이가 인구입니다.',
          summary: '대한민국 16개 시도의 주민등록인구를 육각형 격자로 그린 카토그램. 경기가 가장 많고 세종이 가장 적습니다. 같은 숫자가 아래 목록에 순서대로 있습니다.',
        },
        brokersPer10k: {
          title: '인구 1만 명당 중개사무소',
          note: '중개사무소 수를 그대로 그리면 인구 지도를 다시 그리게 됩니다 — 전국 82,445곳이고 많은 곳은 사람이 많은 곳입니다. 나눠 보면 순서가 바뀝니다. 세종 21.5, 제주 21.0 이 서울 20.4 보다 위이고, 사무소가 전국에서 제일 많은 경기(22,708곳)는 16.5 로 중간입니다. 강원이 11.4 로 마지막입니다.',
          caption: '{n}개 시도 · 막대 길이가 인구 1만 명당 사무소 수입니다.',
          summary: '인구 1만 명당 중개사무소 수를 육각형 격자로 그린 카토그램. 세종과 제주가 서울보다 높고 강원이 가장 낮습니다. 같은 숫자가 아래 목록에 순서대로 있습니다.',
        },
      },
      limitsHead: '여기서 멈춘 이유',
      sggTerm: '시군구 약 250',
      sggWhy:
        '타일은 예산에 들어갑니다. 위치가 들어가지 않습니다. 한눈에 검증되지 않고, 재배포가 허용되는 라이선스로 된 실제 중심좌표가 저에게 없습니다. 250개를 기억으로 놓는 것은 데이터를 지어내는 일입니다.',
      dongTerm: '읍면동 약 3,500',
      dongWhy:
        '실측: 이 라우트가 쓸 수 있는 gzip HTML 은 23.4 KB 이고 타일 3,500개는 들어가지 않습니다. 그리고 3,500칸 카토그램은 아무도 읽지 않습니다.',
      valueTerm: '값 층',
      valueWhy:
        '아직 비어 있습니다. 공공누리 제1유형이어야 하고(시각화는 2차적 저작물이라 3·4유형은 변경 금지), 라벨이 한국어와 영어 양쪽에서 성립해야 하며, 데이터가 아니라 질문이 있어야 합니다. 그 셋을 통과한 데이터셋이 아직 없습니다.',

      divisions: {
        '12': '전남광주통합특별시',
        '11': '서울특별시',
        '26': '부산광역시',
        '27': '대구광역시',
        '28': '인천광역시',
        '30': '대전광역시',
        '31': '울산광역시',
        '36': '세종특별자치시',
        '41': '경기도',
        '43': '충청북도',
        '44': '충청남도',
        '47': '경상북도',
        '48': '경상남도',
        '50': '제주특별자치도',
        '51': '강원특별자치도',
        '52': '전북특별자치도',
      },
    },

    closing:
      '이 페이지의 계획은 docs/DATA-VISUALIZATION.md 에 있습니다. 거기 적힌 것 중 끝난 것은 이 격자 하나뿐이고, 나머지는 아직 증거가 없습니다.',
  },

  direct: {
    heading: '직거래율과, 그것을 더 잘 설명한 변수',
    lead:
      '중개사무소가 많은 곳일수록 직거래가 적습니다. r = {rDensity}. 그런데 인구가 같은 값을 더 잘 설명합니다 — r = {rPop}. 그리고 두 설명은 서로 {rBoth} 로 얽혀 있습니다.',
    chartHeading: '같은 176개 시군구, 서로 다른 설명 두 개',
    note:
      '한 장이 아니라 두 장인 이유는, 이 페이지의 발견이 상관이 아니라 상관의 비교이기 때문입니다. 왼쪽만 실으면 참이면서 오해를 부릅니다. 같은 y축에 같은 점을 놓으면, 왼쪽 이야기가 오른쪽에도 그대로 살아 있는 게 보입니다 — 그게 "부분적으로 대리변수"의 모습입니다. 두 축 모두 로그입니다. 직거래율이 {minRate}%에서 {maxRate}%까지, 인구도 자릿수를 넘나들어서 선형 축에서는 한 곳이 구석에 홀로 앉고 나머지 175개가 얼룩이 됩니다. 그러면 여기 적힌 상관계수가 나라가 아니라 그 한 곳에 대한 진술이 됩니다. 추세선은 긋지 않았습니다. 선은 원인에 대한 주장처럼 보이는데, 이 페이지의 요지는 어느 쪽도 원인을 세우지 못한다는 것입니다.',
    caption: '{plotted}개 시군구 · 아파트 매매 {deals}건 · {from} ~ {to} 신고분',
    summary:
      '176개 시군구의 직거래 비율을 두 가지로 설명한 로그-로그 산점도. 왼쪽은 인구 1만 명당 중개사무소 수, 오른쪽은 인구입니다. 오른쪽의 상관이 더 강합니다.',
    source:
      '국토교통부 아파트 매매 실거래가 · 거래유형이 직거래인 건의 비율 · 중개사무소와 인구는 시군구 지도와 같은 표 · 이용허락범위 제한 없음',
    density: '인구 1만 명당 중개사무소',
    population: '주민등록인구',
    rate: '직거래 비율',
    r: 'r = {r}',

    readoutHead: '숫자로',
    rowNational: '전국 직거래 비율',
    rowMedian: '중앙 시군구',
    rowRDensity: 'r · 중개사무소 밀도 ↔ 직거래율',
    rowRPop: 'r · 인구 ↔ 직거래율',
    rowRBoth: 'r · 인구 ↔ 중개사무소 밀도',

    limitsHead: '이 그림이 감추지 않는 것',
    confoundTerm: '어느 쪽도 원인이 아니다',
    confoundWhy:
      '인구가 더 잘 설명한다고 해서 인구가 원인인 것도 아닙니다. 인구가 적은 곳은 아파트가 적고, 거래가 적고, 아는 사람끼리 파는 비율이 높고, 사무소가 유지되지 않습니다 — 전부 같이 움직입니다. 이 그림이 보여줄 수 있는 것은 "중개사무소 밀도만 적으면 설명이 끝난 것처럼 보인다"는 것뿐이고, 그게 이 페이지가 두 장인 이유입니다.',
    floorTerm: '거래가 적은 곳은 안 그렸다',
    floorWhy:
      '창에서 아파트 매매가 {floor}건이 안 되는 시군구는 점으로 찍지 않았습니다. 거래가 아홉 건인 곳은 한 건이 어느 쪽이냐에 따라 직거래율이 0%도 되고 33%도 됩니다. 거래가 있는 {districts}곳 중 {plotted}곳을 그렸고 {dropped}곳을 뺐습니다. 열한 건에 얹힌 점과 만 건에 얹힌 점은 화면에서 똑같이 생겼습니다.',
    aptTerm: '아파트만이다',
    aptWhy:
      '실거래 신고는 아파트·연립다세대·단독다가구·오피스텔·토지·상업업무용이 각각 다른 API 입니다. 아파트 하나만 받았습니다 — 여섯 유형을 다 받으면 호출이 여섯 배가 되고, 유형마다 직거래 관행이 달라서 섞으면 이 그림의 y축이 무엇인지 흐려집니다. 여기서 "직거래율"은 아파트 매매의 직거래율입니다.',

    gapTerm: '응답이 다 오지는 않았다',
    gapWhy:
      '(시군구 × 계약년월) 한 쌍마다 한 번씩 부르므로 완전한 창이면 {expected}개 응답이 와야 하는데 {responses}개가 왔습니다. {missing}개가 비었습니다 — 이 게이트웨이는 몇 분 단위로 죽었다 살아나고, 빠진 쌍은 대부분 창의 첫 달과 서울 도심 몇 개 구입니다. 그 시군구는 12개월이 아니라 11개월로 계산됐다는 뜻입니다. 채워지면 숫자가 조금 움직입니다. 그래서 이 페이지의 상관계수는 문장에 박아 넣지 않고 데이터에서 채웁니다.',

    back: '← 포트폴리오',
  },
  prices: {
    heading: '아파트 가격변동 · 시군구',
    lead:
      '같은 단지, 같은 면적대끼리 짝지어 재니 {fell}곳이 내리고 {rose}곳이 올랐습니다. 중앙값 {median}%, 범위 {min}%에서 {max}%. 0이 진짜 가운데라 이 지도는 색이 두 방향으로 갈립니다.',
    mapHeading: '{early}~{earlyEnd} 대비 {late}~{lateEnd}',
    note:
      '시군구별 중위 거래가를 그냥 비교하면 안 됩니다 — 어느 아파트가 팔렸는지만 달라져도 중위값이 움직여서, 가격이 그대로인 동네가 올라 보입니다. 그래서 비교 단위를 (시군구 · 단지 · 10㎡ 구간)으로 잡고 창의 양 끝에서 모두 거래된 것만 씁니다. 짝 {pairs}개. 각 짝이 단위면적당 가격의 변동률 하나를 내고, 시군구 값은 그 짝들의 중앙값입니다. 건물과 평형과 동네를 고정한 셈이고, 호수 식별자가 없는 신고자료에서 반복매매에 가장 가까운 방법입니다. 중개사무소 지도와 같은 245칸이고 배치도 같습니다 — 값만 다릅니다.',
    caption: '{measured}/{districts} 시군구 · 같은 단지 짝 {pairs}개 · 값은 짝별 변동률의 중앙값',
    legend: '계급 시작값과 그 계급의 시군구 수 · 0에서 색이 갈립니다',
    unmeasured: '측정 못 한 곳',
    listing: '순위대로 전부 보기',
    summary:
      '대한민국 245개 시군구를 육각형으로 채운 카토그램. 같은 단지끼리 짝지어 잰 아파트 가격변동을 색으로 표시했고, 하락은 청록, 상승은 주황, 0 근처는 바탕에 가깝습니다.',
    source:
      '국토교통부 아파트 매매 실거래가 · 같은 단지·같은 면적대의 단위면적당 가격 비교 · 격자는 시군구 지도와 동일 · 이용허락범위 제한 없음',
    tipRate: '같은 단지 기준',
    tipPairs: '쌍',

    limitsHead: '이 지도가 감추지 않는 것',
    pairsTerm: '중위가 비교가 아니다',
    pairsWhy:
      '짝 {pairs}개로 쟀습니다. 짝이 {floor}개 미만인 시군구는 값을 내지 않았습니다 — 스무 개짜리와 구백 개짜리가 화면에서 똑같은 육각형이라, 팝업에 짝 개수를 함께 넣었습니다. 놀라운 칸을 만나면 그 숫자를 먼저 보세요.',
    unmeasuredTerm: '{unmeasured}곳은 색이 없다',
    unmeasuredWhy:
      '창의 양 끝에서 같은 단지가 거래되지 않은 시군구입니다. 구멍을 뚫지 않고 중립색 칸으로 남겼습니다 — 이 지도가 읽히는 이유는 나라 모양이고, 증거가 없다는 뜻으로 칸을 비우면 "변동이 없다"로 읽힙니다. 둘은 다른 말입니다.',
    windowTerm: '1년 변동이 아니다',
    windowWhy:
      '12개월 창의 앞 3개월과 뒤 3개월을 비교한 값입니다. "{early}~{earlyEnd} 대비 {late}~{lateEnd}" 이고, 연간 상승률도 최근 추세도 아닙니다. 그리고 신고일 기준이라 계약한 달이 아니라 신고된 달로 묶였습니다.',
    divergeTerm: '색이 하나 늘었다',
    divergeWhy:
      '이 사이트의 색은 강조색 하나였습니다. 부호가 있는 값은 색상으로 방향을 읽는 것이 관례라, 하락 쪽에 색을 하나 더했습니다 — 데이터가 요구한 것이고 취향이 아닙니다. 두 끝은 대비로 맞췄습니다: 밝은 바탕에서 3.13:1 대 3.05:1, 어두운 바탕에서 5.76 대 5.91. 발산형 지도에서 한쪽이 더 크게 소리치면 그건 측정이 아니라 주장이 됩니다. 새 색도 다른 역할과 똑같이 게이트가 측정하고 /art-direction 이 게시합니다.',

    back: '← 포트폴리오',
  },
  renewal: {
    heading: '계약갱신청구권과 5% 상한',
    lead:
      '갱신요구권을 쓴 전세 갱신의 중앙 인상률은 {medianUp}%, 안 쓴 쪽은 {medianDown}%. 평균만 보면 상한이 아무 일도 안 한 것처럼 보입니다. 상한이 하는 일은 가운데가 아니라 천장에 있습니다 — 권리를 쓴 갱신은 열에 아홉이 {p90Up}% 아래인데, 안 쓴 쪽은 그 선이 {p90Down}% 입니다.',
    chartHeading: '보증금 인상률 분포 · 갱신요구권 사용 여부',
    note:
      '두 분포를 하나의 축에 위아래로 겹쳤습니다. 옆에 나란히 놓으면 비슷하게 생긴 두 모양을 머릿속에서 겹쳐야 하는데, 한 축에 붙이면 한쪽은 벽이고 한쪽은 꼬리라는 게 눈에서 끝납니다. 두 계열의 계약 수가 1만 건 넘게 차이 나므로 각자 자기 계열 대비 비율로 그렸고, 픽셀 대 퍼센트 비율은 위아래가 같습니다 — 두 배 높은 막대는 두 배 흔합니다. 위아래에 각자 축척을 주면 그림은 고르게 차지만 {peakUp}% 봉우리가 {peakDown}% 봉우리처럼 보입니다.',
    caption: '{kept}건 · 전세 → 전세 갱신 · {from} ~ {to} 신고분',
    summary:
      '계약갱신청구권을 쓴 전세 갱신과 안 쓴 전세 갱신의 보증금 인상률 분포를 한 축에 위아래로 그린 히스토그램. 사용한 쪽은 5%에서 벽처럼 끊기고, 안 쓴 쪽은 그 위로 길게 이어집니다.',
    source:
      '국토교통부 아파트 전월세 실거래가 · 계약구분이 갱신이고 종전·현재 모두 전세인 건만 · 이용허락범위 제한 없음',
    cap: '5%',
    up: '갱신요구권 사용',
    down: '사용 안 함',
    unit: '%',
    share: '{share}% / {n}건',

    readoutHead: '요약 통계 — 위 두 줄만 보면 틀립니다',
    rowMedian: '중앙 인상률',
    rowP90: '상위 10% 경계(p90)',
    rowOver: '5% 초과 비율',
    rowFrozen: '동결(0%) 비율',

    limitsHead: '이 그림이 감추지 않는 것',
    jeonseTerm: '전세만 셌다',
    jeonseWhy:
      '갱신 {renewals}건 중 {kept}건만 썼습니다. 보증금과 월세는 하나의 숫자가 아니고, 둘을 섞으려면 전월세전환율을 이 파일이 지어내야 합니다. 종전·현재 어느 쪽이든 월세가 붙은 {mixed}건을 버렸습니다. 버린 걸 숨기지 않고 세어 둡니다.',
    blankTerm: '"사용 안 함"은 미기재일 수도 있다',
    blankWhy:
      '갱신요구권 항목이 비어 있는 건을 미사용으로 셌습니다. 실제로 안 쓴 것과 기재가 안 된 것을 자료가 구분해 주지 않습니다. 만약 미기재가 상당수라면 아래쪽 분포에 사용 건이 섞여 있다는 뜻이고, 그 방향의 오차는 두 분포의 차이를 실제보다 작게 만듭니다 — 결론을 약화시키지 강화시키지 않습니다.',
    filedTerm: '계약일이 아니라 신고일이다',
    filedWhy:
      '실거래 신고는 계약 후 일정 기간 안에 하게 돼 있어서, 여기 적힌 달은 계약한 달이 아니라 신고된 달입니다. 12개월 창 전체를 보는 그림이라 이 지연은 분포의 모양을 바꾸지 않지만, 특정 달을 짚어 읽으면 안 됩니다.',

    back: '← 포트폴리오',
  },
  drill: {
    prompt: '육각형을 누르면 그 시군구의 읍면동 격자가 열립니다. 색이 죽은 칸은 읍면동이 다섯 곳 미만이라 격자가 없습니다.',
    loading: '가져오는 중…',
    error: '격자를 가져오지 못했습니다.',
    caption: '{name} · 읍면동 {cells}곳 · 사무소 {offices}',
    top: '많은 곳 · {top}',
    close: '닫기',
    unit: '곳',
    share: '이 시군구의 {share}%',
    relative:
      '색은 이 시군구 안에서의 상대값입니다 — 가장 밝은 칸이 이 시군구에서 사무소가 가장 많은 동이고, 다른 시군구의 색과는 비교할 수 없습니다.',
  },
  districts: {
    heading: '시군구 카토그램',
    lead:
      '대한민국 전도를 육각형 245개로 나눴습니다. 한 칸이 시군구 하나이고, 칸의 위치는 경계 파일에서 계산한 실제 중심점으로 정합니다. 이름은 보이지 않습니다 — 올려 보세요.',
    mapHeading: '인구 1만 명당 중개사무소 · 시군구',
    note:
      '색이 값이고, 여기까지 두 번 틀렸습니다. 처음에는 육각형 크기였는데, 상위 네 곳(중구 39.8, 강남 37.0, 용산 34.0, 서초 31.3)이 최댓값을 끌고 가는 바람에 나머지 80%가 반지름 0.36~0.72 사이에 몰려 전부 같아 보였습니다. 다음은 등량 7단계였는데 개수는 완벽하고 폭이 아니었습니다 — 5.0, 3.9, 2.4, 2.1, 2.3, 2.5 그리고 20.6. 마지막 계급이 나머지 여섯을 합친 것보다 넓어서 19.3과 39.8이 같은 색이었습니다. 지금은 자연 분급(Fisher-Jenks) 8단계입니다. 계급 안의 편차 제곱합이 최소가 되도록 끊으므로, "어디서 나뉘는가"를 정하는 게 아니라 자료에 묻습니다. 대가는 개수가 고르지 않다는 것 — 위 두 계급을 합쳐 아홉 곳뿐이라 이 지도에서 면적은 아무것에도 비례하지 않습니다. 그래서 범례에 계급별 개수까지 적었고, 정확한 숫자는 칸을 짚으면 나옵니다.',
    caption: '{n}개 시군구 · 칸 하나가 시군구 하나이고, 색이 인구 1만 명당 사무소 수입니다.',
    legend: '자연 분급 8단계 · 계급 시작값과 그 계급의 시군구 수',
    listing: '순위대로 전부 보기',
    summary:
      '대한민국 국토를 육각형 245개로 채운 카토그램. 한 칸이 시군구 하나이고, 안쪽 육각형이 클수록 인구 1만 명당 중개사무소가 많습니다. 같은 숫자가 아래 목록에 순위대로 전부 있습니다.',
    source:
      '국토교통부 중개사무소 등록현황 2026-08-18 ÷ 행정안전부 주민등록인구 2026-07-31 · 위치는 국토지리정보원 시군구 경계(2023)의 면적가중 중심점 · 모두 이용허락범위 제한 없음',

    limitsHead: '이 지도가 감추지 않는 것',
    placedTerm: '자리가 밀렸다',
    placedWhy:
      '평균 1.81칸, 약 43km 밀렸고 가장 심한 곳은 5.01칸, 137km 입니다. 가장 많이 밀린 여덟 곳이 전부 하남·구리·성남 중원·강동·성남 분당·광주·양평·중랑 — 서울 동쪽, 구가 가장 촘촘한 곳입니다. 이건 맞추기에 실패한 게 아니라 카토그램의 정의입니다. 한 칸에 시군구 하나씩 주면 모든 시군구가 같은 면적을 갖게 되므로, 수도권은 국토에서 차지하는 것보다 그림에서 더 넓은 자리를 차지해야 하고 누군가는 비켜야 합니다. 물을 건너지 못하게 막기 전에는 완도와 진도가 제주 옆에 놓였습니다 — 중심점이 틀린 게 아니라, 제주에 시군구보다 칸이 많아 남는 칸을 누군가 채워야 했고 가장 가까운 두 곳이 뽑혀 간 것입니다. 잘못된 후보 집합 위의 최적해는 여전히 틀린 답입니다.',
    tiledTerm: '국토를 칸으로 나눴다',
    tiledWhy:
      '경계 폴리곤(시군구 254개, 외곽선 4,506개, 점 120만 개)을 전부 읽어, 육각 격자에서 중심이 육지에 떨어지는 칸을 골랐습니다 — 229칸. 섬이 육각형 하나보다 작은 시군구 13곳은 제 위치에 칸을 더해 242칸. 그 다음이 중요합니다: 어떤 시군구도 물을 건너지 않습니다. 칸 뭉치를 연결 요소로 먼저 쪼개고(본토·울릉·옹진·거제·제주), 시군구는 중심점에서 가장 가까운 뭉치에 속합니다. 칸이 남는 뭉치는 아무 시군구에서도 먼 칸부터 버리고, 모자라는 뭉치는 들어오려는 시군구 쪽으로 자랍니다 — 제주가 4칸 중 2칸을 내놓고 본토가 5칸 자라 245칸에 245개, 남는 칸 없음. 배치는 뭉치별로 헝가리안 알고리즘이 제곱거리 합을 최소화합니다. 손으로 놓은 자리는 하나도 없고, 다시 돌리면 같은 파일이 나옵니다.',
    missingTerm: '11곳이 없다',
    missingWhy:
      '경계 파일은 2023 년판이고 인구·중개 자료는 2026 년판입니다. 그 사이 화성시가 4개 구로, 인천이 5개 구로, 청주시가 2개 구로 나뉘었습니다. 2024 년에 생긴 구의 2023 년 중심점은 존재하지 않습니다 — 화성 동탄·만세·병점·효행, 인천 검단·미추홀·서해·영종·제물포, 청주 서원·청원. 지어내지 않고 이름을 적어 둡니다.',
    labelsTerm: '이름이 없다',
    labelsWhy:
      '245칸에 이름을 쓸 수 없습니다. 이 지도는 "세종의 비율이 얼마인가" 가 아니라 "어디가 높은가" 에 답합니다. 이름과 숫자는 칸 위에 포인터를 올리면 팝업으로 나옵니다. 팝업에는 자바스크립트가 필요하고, 꺼져 있으면 브라우저 기본 툴팁이 같은 이름과 비율을 보여줍니다. 어느 쪽도 못 쓰는 경우를 위해 아래 목록에 순위대로 전부 적어 뒀습니다.',

    tipRate: '인구 1만 명당',
    tipOffices: '곳',
    tipPeople: '명',

    back: '← 포트폴리오',
  },

  /* THE PRIVACY POLICY.

     Plainer prose than anything else in this dictionary, and that is the
     point rather than a lapse. Every other page here is allowed a voice; a
     policy is read by someone who wants to know what happens to them, and
     the site's usual register would make them work for it.

     EVERY CLAIM HERE IS CHECKABLE AGAINST THE REPOSITORY. "No cookies" is
     true because nothing in app/, components/ or lib/ touches
     document.cookie or Web Storage — grep it. "No ad script" is true
     because lib/csp.mjs admits exactly one external origin and it is not an
     ad network. A policy that describes an intention rather than a build is
     the kind that quietly stops being true. */
  privacy: {
    heading: '개인정보처리방침',
    lead:
      '이 사이트가 방문자에 대해 무엇을 알게 되고, 그것이 어디로 가는지 적어 둡니다. 결론부터: 이 사이트는 쿠키를 하나도 쓰지 않고, 계정도 문의 폼도 없습니다.',
    updatedLabel: '최종 개정',

    scopeHeading: '적용 범위',
    scopeBody:
      'goldibug.com과 그 하위 경로에만 적용됩니다. 이 사이트에서 밖으로 나가는 링크가 가리키는 곳은 각자의 방침을 따르며, 이 문서가 통제하지 않습니다.',

    collectHeading: '무엇이 수집되는가',
    collectNote:
      '이 사이트에는 회원가입, 로그인, 댓글, 문의 폼이 없습니다. 이름·이메일·전화번호를 입력받는 칸이 한 곳도 없으므로 방문자가 직접 제공하는 개인정보는 존재하지 않습니다. 아래는 웹페이지를 여는 행위 자체에서 발생하는 것들입니다.',

    logLabel: '접속 기록',
    logBody:
      '이 사이트는 Cloudflare에서 정적 파일로 서빙되며 요청 시점에 실행되는 서버 코드가 없습니다. 전송과 보안 처리 과정에서 Cloudflare 측에 IP 주소, 요청 시각, 요청 경로, 브라우저 식별 문자열이 남습니다. 요청 단위의 원본 기록은 Cloudflare가 보관하며, 이 사이트 운영자에게 제공되는 것은 집계된 지표뿐입니다.',

    analyticsLabel: '방문 통계',
    analyticsBody:
      'Cloudflare Web Analytics를 사용합니다. 쿠키를 심지 않고 브라우저 지문도 만들지 않는 방식으로, 페이지 경로·유입 경로·브라우저와 운영체제 종류·IP에서 추정한 국가·로딩 시간이 집계됩니다. 개별 방문자를 식별하지 않고 다른 사이트로 따라가지도 않습니다. 이것을 두는 이유는 어떤 글이 읽히는지 알기 위한 것 하나입니다.',

    storageLabel: '브라우저 저장소',
    storageBody:
      '쿠키, localStorage, sessionStorage, IndexedDB를 전혀 사용하지 않습니다. 선택한 언어조차 저장하지 않고 주소로만 구분합니다. 이 문장은 취지가 아니라 확인 가능한 사실입니다 — 저장소를 건드리는 코드가 이 저장소에 한 줄도 없습니다.',

    fontLabel: '웹폰트',
    fontBody:
      '본문 서체는 Google Fonts에서 온 것이지만 빌드 시점에 내려받아 이 사이트의 도메인에서 함께 서빙됩니다. 페이지를 열 때 Google 서버로 나가는 요청이 없으므로, 서체 때문에 방문자의 IP가 Google에 전달되는 일은 없습니다.',

    thirdHeading: '데이터가 닿는 곳',
    thirdNote:
      '아래 두 곳이 전부입니다. 두 곳 모두 미국에 소재하므로, 접속 정보가 국외로 이전되는 것을 전제로 이 사이트를 이용하게 됩니다.',
    cloudflareLabel: 'Cloudflare, Inc.',
    cloudflareBody:
      '호스팅, 콘텐츠 전송, 방문 통계. 위의 접속 기록과 방문 통계가 여기에서 처리됩니다.',
    googleLabel: 'Google LLC',
    googleBody:
      '이 사이트는 Google AdSense에 등록되어 있습니다. 현재 Google에 전달되는 것은 사이트 소유를 확인하기 위한 퍼블리셔 식별자뿐이고, 방문자에 관한 데이터는 전달되지 않습니다.',

    adsHeading: '광고',
    adsStatusLabel: '현재 상태',
    adsStatusBody:
      '이 문서를 쓰는 시점에 이 사이트는 광고를 게재하지 않습니다. 어느 페이지에도 광고 스크립트가 실리지 않으며, 그 상태는 의지가 아니라 이 사이트의 Content-Security-Policy가 강제하고 있습니다: 허용된 외부 출처가 정확히 하나이고 그것은 광고 사업자가 아니므로, 광고 스크립트는 실행 자체가 차단됩니다.',
    adsFutureLabel: '게재를 시작하면',
    adsFutureBody:
      '광고를 게재하기로 하면 이 문서를 먼저 고칩니다. 그때 달라지는 것은 이렇습니다. Google과 그 광고 파트너가 쿠키 또는 그에 준하는 식별자로 광고를 선택하고 노출과 클릭을 측정하며, 그 과정에서 IP 주소, 기기와 브라우저 정보, 이 사이트에서 본 페이지, 그리고 다른 사이트에서의 활동 이력이 사용될 수 있습니다. 이 데이터는 Google이 처리하고, 이 사이트 운영자는 개별 방문자 수준의 데이터에 접근할 수 없습니다.',
    adsConsentLabel: '동의',
    adsConsentBody:
      '유럽경제지역·영국·스위스에서 접속하는 방문자에게는 Google이 요구하는 인증 동의 관리 도구를 통해 먼저 동의를 묻습니다. 그 지역 밖에서는 동의 창이 뜨지 않으며, 아래의 거부 수단이 대신 열려 있습니다.',

    rightsHeading: '거부하고 요구할 수 있는 것',
    rightsNote:
      '아래 세 가지는 이 사이트가 광고를 게재하게 될 때를 대비한 것이고, 지금 시점에도 이미 작동합니다.',
    optGoogleLabel: 'Google 광고 설정',
    optGoogleBody: 'Google 계정의 광고 설정에서 맞춤 광고를 끌 수 있습니다.',
    optNaiLabel: '업계 공동 거부',
    optNaiBody:
      'Network Advertising Initiative와 YourAdChoices에서 여러 사업자의 맞춤 광고를 한 번에 거부할 수 있습니다.',
    optBrowserLabel: '브라우저 차단',
    optBrowserBody:
      '브라우저 설정에서 제3자 쿠키를 차단하면 됩니다. 이 사이트는 쿠키를 쓰지 않으므로, 차단해도 여기서 깨지는 기능은 없습니다.',
    rightsLegalBody:
      '열람·정정·삭제·처리정지를 요구할 권리가 있습니다. 다만 이 사이트는 방문자를 식별하는 정보를 보관하지 않으므로, 특정인의 기록을 찾아 삭제할 대상이 실제로 존재하지 않습니다. 광고와 관련해 처리되는 데이터는 Google이 보유하므로 Google에 직접 행사해야 합니다.',
    remedyBody:
      '개인정보와 관련한 분쟁이나 침해가 있을 경우 개인정보보호위원회, 개인정보 분쟁조정위원회, 경찰청 국가수사본부 사이버수사국에 신고하거나 조정을 요청할 수 있습니다.',

    contactHeading: '문의',
    contactBody:
      '이 사이트는 익명으로 운영되며 공개된 이메일 주소가 없습니다. 이 방침에 대한 문의나 정정 요구는 저장소의 이슈로 남겨 주시면 됩니다. 누구나 볼 수 있는 공개 채널이라는 점을 알고 쓰셔야 합니다.',
    contactIssues: 'GitHub 이슈로 문의',

    revisionHeading: '개정',
    revisionBody:
      '이 문서가 바뀐 이력은 저장소의 커밋으로 남습니다. 내용이 실제로 달라질 때만 위의 개정일을 고치고, 오타 수정으로는 고치지 않습니다 — 바뀌지 않은 방침에 새 날짜를 붙이는 것은 사실이 아닌 진술이기 때문입니다.',
  },

  /* THE REVENUE DASHBOARD.
     Prose only. Every number the page shows is computed in lib/bi.data.ts and
     lib/bi.figure.ts, and `pnpm check:bi` fails the build if a percentage in
     a sentence here is not a value the data holds — so the sentences below
     carry no percentages at all except 100, which is the rate card's own
     baseline. The three `synthetic*` keys are the places the page says which
     half is real; the same gate fails if one of them disappears. */
  revenue: {
    heading: '아파트 관리앱 매출',
    syntheticHero: '명부와 위치는 실제 · 계약과 매출은 전부 만든 것',
    syntheticChart:
      '단지 이름·시도·시군구·법정동·준공연도는 국토교통부 아파트 실거래 신고에서 그대로 옮긴 것입니다. 세대수는 신고에 없어서 추정했습니다. 계약·단가·청구·이탈·영업조직은 시드를 고정해 생성한 것이고 어떤 실제 거래에도 대응하지 않습니다 — 관리앱이 단지에 받는 금액은 공개된 형태로 존재하지 않기 때문입니다. 그래서 침투율의 분모만이 세어 본 숫자입니다.',
    syntheticPanel: '계약·매출은 합성 · 단지와 세대수 분모는 실측·추정',
    asOf: '기준 시점',

    kpiMrr: '월 반복 매출',
    kpiGrowth: '전년 동월 대비',
    kpiPenetration: '판매가능 단지 침투율',
    kpiChurn: '매출 이탈률',
    kpiCoverage: '이탈 대비 신규',
    kpiNote: '이 대시보드의 머리 숫자 다섯 개',

    mrrTitle: '월 반복 매출',
    mrrNote:
      '선이 아니라 계단입니다. 세대당 요금 × 변하지 않는 세대수는 계약이 바뀔 때까지 매달 같은 금액이고, 점을 직선으로 이으면 회사가 청구한 적 없는 값을 지나갑니다. 성장이 서명 단위로 도착한다는 사실이 그 계단에 있습니다.',
    mrrSummary:
      '36개월 구독 매출을 계단 면적으로 그린 도표. 한 달도 내려가지 않고 오르며, 아래 별도 축에 사용량 과금을 함께 둡니다.',
    usageTitle: '사용량 과금 · 별도 축척',

    flowTitle: '매출 이동',
    flowNote:
      '위 선은 자기 모양에 대해서는 거짓말할 수 없지만 그 아래에 무엇이 있는지는 가립니다. 구독 매출은 36개월 내내 오르는데, 같은 기간에 떠난 매출은 기말 잔액의 상당 부분입니다. 신규가 매달 그것을 덮습니다. 얼마가 떠났는지는 이 기둥들이 말합니다.',
    flowSummary:
      '월별 매출 증감을 0선 위아래로 그린 기둥 도표. 위는 신규·윈백·확장, 아래는 축소·이탈입니다.',
    flowGain: '신규 · 윈백 · 확장',
    flowLoss: '축소 · 이탈',

    ladderTitle: '규모가 커지면 세대당 단가가 내려간다',
    ladderNote:
      '번들을 고정하고 세대수만 올린 것입니다. 티어별 실현 평균으로는 이 주장을 할 수 없습니다 — 그 평균은 가격 구조와 그 단지들이 마침 무엇을 쓰는지를 섞고, 최상위 티어는 계좌가 스무 개도 안 되어 한 단지가 서비스를 하나 더하면 움직입니다. 그래서 각 번들을 자기 정가로 지수화했습니다. 질문은 번들이 얼마인지가 아니라, 단지가 실제로 내는 값이 정가에서 어느 방향으로 얼마나 벗어나는지입니다.',
    ladderSummary:
      '두 개의 참조 번들을 세대수 사다리 위에서 각자의 정가 대비 비율로 그린 선 도표. 둘 다 단조 하락합니다.',
    ladderEntry: 'entry · 알림만 (정가 150원/세대)',
    ladderCore: 'core · 알림+수납+주차 (정가 950원/세대)',
    ladderFloored: '점 = 월 최소요금이 가격을 결정한 구간 · 가로축은 세대수',

    tierTitle: '티어가 실제로 청구한 것',
    tierNote:
      '왼쪽은 단지당, 오른쪽은 세대당입니다. 두 막대는 반대 방향으로 갑니다. 옆의 사다리와 어긋나는 티어는 참조 번들보다 더 사거나 덜 사고 있는 것이고, 그건 다른 발견이라 자기 표본 크기가 따로 필요합니다. 그래서 표에 단지 수를 함께 둡니다.',
    tierPerComplex: '단지당 월 매출',
    tierPerHousehold: '세대당 월 매출',

    attachTitle: '서비스별 부착율',
    attachNote:
      '색조 열한 개가 아니라 칸 열한 개입니다. 이 사이트가 가진 색은 두 개이고, 한 축에 열한 계열을 올리려면 아홉 개를 만들어야 하는데 그러면 색각 이상이나 흑백 인쇄에서 구별되지 않는 짝이 도표에 올라갑니다. 칸을 나누면 서비스끼리 한눈에 비교하는 것을 잃고 각각의 모양을 읽는 것을 얻습니다. 축척은 모든 칸이 같습니다 — 칸마다 따로 맞추면 거의 안 쓰이는 서비스와 절반 넘는 단지가 쓰는 서비스가 같은 곡선으로 그려집니다.',
    attachSummary:
      '서비스 열한 종의 부착율 추이를 같은 축척의 작은 칸 열한 개로 나눠 그린 도표.',

    penTitle: '시군구별 침투율',
    penNote:
      '중개사무소 지도와 가격 지도가 쓰는 245개 육각 격자를 그대로 가져왔습니다. 배치를 다시 계산하지 않은 이유는, 한 사이트의 두 지도에 대해 독자가 당연히 기대할 수 있는 것은 같은 모양이 같은 곳을 뜻한다는 것이기 때문입니다. 분모는 신고된 전체 단지가 아니라 관리사무소를 둘 만한 규모의 단지입니다.',
    penSummary:
      '판매가능 단지 대비 계약 단지 비율을 245개 시군구 육각 격자에 단일 색조 여섯 계급으로 그린 카토그램.',
    penLegend: '계급 경계 (%) 와 시군구 수',
    penNone: '대상 없음',

    cohortTitle: '코호트 리텐션',
    cohortNote:
      '격자가 아니라 삼각형인 이유는 데이터가 그 모양이기 때문입니다. 창이 끝나기 두 달 전에 계약한 코호트는 두 달의 이력을 가지고 그게 전부이며, 나머지를 무엇으로든 채우면 그건 만들어낸 것입니다. 왼쪽은 남아 있는 단지 비율, 오른쪽은 그 코호트의 첫 달 대비 매출입니다. 둘은 갈라집니다 — 살아남은 쪽이 더 사기 때문입니다. 그 격차가 하나의 격자에는 담기지 않습니다.',
    cohortKept: '남아 있는 단지',
    cohortValue: '첫 달 대비 매출',

    attainTitle: '영업 할당 달성',
    attainNote:
      '막대가 왼쪽 끝이 아니라 100선에서 자랍니다. 왼쪽에서 자라면 할당에 조금 못 미친 사람과 조금 넘긴 사람이 거의 같은 막대를 그리고 부호가 사라지는데, 이 도표는 그 부호만 보기 위한 것입니다.',
    attainSummary:
      '영업사원별 할당 달성률을 100% 기준선 양쪽으로 그린 막대 도표.',

    tableOpen: '숫자로 보기',
    colMonth: '월',
    colMrr: '구독 매출',
    colUsage: '사용량',
    colComplexes: '단지',
    colNew: '신규',
    colWinback: '윈백',
    colExpansion: '확장',
    colContraction: '축소',
    colChurn: '이탈',
    colHouseholds: '세대',
    colPerComplex: '단지당',
    colPerHousehold: '세대당',
    colFloored: '최소요금',
    colTier: '티어',
    colService: '서비스',
    colFirst: '처음',
    colLast: '마지막',
    colContracts: '계약',
    colDistrict: '시군구',
    colSido: '시도',
    colAddressable: '판매가능',
    colRate: '침투율',
    colCohort: '코호트',
    colSize: '규모',
    colKept: '잔존',
    colValue: '매출비',
    colRep: '담당',
    colRank: '직급',
    colRegion: '본부',
    colAccounts: '담당 단지',
    colQuota: '할당',
    colAttainment: '달성',

    services: {
      parking: '주차관제',
      visitor: '방문차량',
      access: '입주민 인증',
      cctv: 'CCTV 연동',
      billing: '관리비 수납',
      notice: '알림',
      community: '커뮤니티 예약',
      defect: '하자보수 접수',
      locker: '무인택배',
      vote: '주민투표',
      sms: 'SMS 대체발송',
    },
    tiers: {
      sub: '150세대 미만',
      small: '150–400',
      mid: '400–900',
      large: '900–2,000',
      xlarge: '2,000 이상',
    },

    back: '포토폴리오로',
  },

  /* THE FILTERABLE DASHBOARD.
     Prose and labels only. Every number is computed in the browser from
     public/data/bi/slice.json, so `pnpm check:bi` cannot check a percentage
     in a sentence here against the data — which is why there are none. */
  bi: {
    heading: '매출 대시보드 · 필터',
    scope:
      '계약 단지 {complexes}곳, {months}개월. 분모는 국토교통부에 신고된 {tam}개 단지이고 그 숫자만 세어 본 것입니다 — 계약과 매출은 시드를 고정해 생성한 것입니다.',
    static: '같은 데이터를 스크립트 없이 읽는 쪽',
    needsScript:
      '이 페이지의 필터는 자바스크립트로 동작합니다. 스크립트 없이 같은 데이터를 읽으려면 이쪽입니다 —',
    back: '포토폴리오로',

    synthetic:
      '단지 이름·시도·시군구·법정동·준공연도는 국토교통부 신고 그대로입니다. 세대수는 신고에 없어 추정했습니다. 계약·단가·청구·이탈·영업조직·관리방식은 생성한 것이고 어떤 실제 거래에도 대응하지 않습니다.',
    loading: '단지별 시계열을 받고 있습니다…',
    failed: '데이터를 받지 못했습니다. 새로 고침해 보시고, 계속 안 되면 스크립트 없는 쪽을 보세요.',

    filters: '조건',
    range: '기간',
    presetAll: '전체',
    preset12: '최근 12개월',
    preset6: '최근 6개월',
    preset3: '최근 3개월',
    from: '시작',
    to: '종료',
    sido: '시도',
    tier: '규모',
    mgmt: '관리방식',
    mgmtDelegated: '위탁',
    mgmtSelf: '자치',
    service: '서비스',
    search: '단지명 · 시군구',
    searchHint: '예: 래미안, 강남구',
    reset: '조건 초기화',
    any: '전체',
    matched: '조건에 맞는 단지 {n} / {total} · {from} ~ {to}',
    matchedNone: '조건에 맞는 단지가 없습니다. 조건을 넓혀 보세요.',

    kpiMrr: '월 반복 매출',
    kpiGrowth: '기간 내 증감',
    kpiComplexes: '마지막 달 청구 단지',
    kpiArpu: '세대당',
    kpiUsage: '사용량 비중',

    chartSeries: '구독과 사용량',
    chartSeriesNote:
      '축이 하나입니다. 사용량은 구독의 몇 퍼센트라 두 번째 축을 주면 같은 높이로 부풀어 없는 상관을 만듭니다. 그래서 작게 그려져 있고, 그게 실제 모양입니다 — 비중은 위 지표에 숫자로 있습니다. 십자선은 달에 붙으므로 선을 겨눌 필요가 없습니다.',
    legendSub: '구독',
    legendUsage: '사용량',
    chartService: '서비스 보유 단지',
    chartTier: '규모별',
    chartSido: '시도별 (상위 9)',

    tableTitle: '단지',
    tableMore: '아래로 {n}곳 더 — 조건을 좁히거나 정렬을 바꾸세요',
    colName: '단지',
    colDistrict: '시군구',
    colTier: '규모',
    colHouseholds: '세대',
    colMgmt: '관리',
    colServices: '서비스',
    colMrr: '구독',
    colUsage: '사용량 합',
    estimated: '세대수는 신고에 없어 추정한 값입니다',

    services: {
      parking: '주차관제',
      visitor: '방문차량',
      access: '입주민 인증',
      cctv: 'CCTV 연동',
      billing: '관리비 수납',
      notice: '알림',
      community: '커뮤니티 예약',
      defect: '하자보수 접수',
      locker: '무인택배',
      vote: '주민투표',
      sms: 'SMS 대체발송',
    },
    tiers: {
      sub: '150 미만',
      small: '150–400',
      mid: '400–900',
      large: '900–2,000',
      xlarge: '2,000 이상',
    },
  },

  notFound: {
    title: 'Not found',
    body: '이 주소에는 아무것도 없습니다. 아래 네 구간이 이 사이트의 전부입니다.',
  },
}
