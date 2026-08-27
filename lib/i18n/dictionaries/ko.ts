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
    fullBuildRecord: '전체 빌드 기록 →',
    /** Shown on an entry that exists only in another language. */
    untranslated: '이 글은 한국어로만 있습니다.',
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
  notFound: {
    title: 'Not found',
    body: '이 주소에는 아무것도 없습니다. 아래 네 구간이 이 사이트의 전부입니다.',
  },
}
