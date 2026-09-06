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

  notFound: {
    title: 'Not found',
    body: '이 주소에는 아무것도 없습니다. 아래 네 구간이 이 사이트의 전부입니다.',
  },
}
