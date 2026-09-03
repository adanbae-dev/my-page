# Brand — GOLDIBUG

브랜드 문서. 이 문서가 계약이고, 구현은 `lib/sections.ts`·`lib/sigil.ts`·
`styles/tokens.css` 이며, 집행은 `pnpm check:contrast`·`check:content`·
`check:practice` 다.

> **A personal interface for a life in progress.**

원본은 사이트가 Phase 0 에 있을 때 쓰였다. 그 뒤 여섯 페이즈가 지나갔고,
문서가 코드에 추월당한 대목이 여럿 생겼다. 무엇이 왜 바뀌었는지는 맨 끝
[정정 기록](#정정-기록)에 있다. 이 문서 자체가 TRACE 의 대상이다.

Goldibug는 특정 서비스나 제품을 판매하기 위한 브랜드가 아니라, 한 사람이
**생각하고(THINK), 만들고(MAKE), 살아가고(LIVE), 지나온 흔적을
남기는(TRACE)** 과정을 하나의 인터페이스로 보여주는 개인 브랜드다.

------------------------------------------------------------------------

## 1. Brand Definition

### 1.1 Brand Name

**GOLDIBUG**

이름의 출발점은 가족 안에서 사용하던 아이의 태명 **"금똥이"**다.

-   금똥이 → Goldi
-   개발자라는 정체성 → Bug
-   Goldi + Bug → Goldibug

중요한 점은 이 이야기를 브랜드 전면에 과도하게 설명하지 않는 것이다.

처음 보는 사람에게는 독립적인 이름처럼 보여야 하고, 브랜드의 배경을 알게
되었을 때 이름에 개인적인 의미가 더해지는 구조를 만든다.

### 1.2 Brand Category

**Personal Brand / Personal Interface / Digital Garden / Maker Archive**

Goldibug는 전형적인:

-   개발자 포트폴리오
-   기술 블로그
-   개인 이력서
-   스타트업 랜딩페이지
-   육아·교육 사이트

중 어느 하나에도 종속되지 않는다.

그 대신 **"한 사람을 인터페이스로 번역한 개인 웹 제품"**을 지향한다.

------------------------------------------------------------------------

# 2. Brand Core

## 2.1 Core Idea

> **One person, continuously becoming.**

Goldibug의 핵심은 완성된 사람을 전시하는 것이 아니라 **계속 만들어지고
변화하는 사람의 상태**를 보여주는 것이다.

따라서 완벽하게 정리된 포트폴리오보다 다음과 같은 흐름이 중요하다.

``` text
Think
  ↓
Make
  ↓
Live
  ↓
Trace
  ↺
```

생각은 만들기로 이어지고, 만든 것은 삶의 일부가 되고, 그 과정은 다시
흔적으로 남는다.

------------------------------------------------------------------------

## 2.2 Brand Promise

Goldibug를 방문한 사람은 다음 네 가지를 느껴야 한다.

1.  **이 사람은 생각한다.**
2.  **이 사람은 실제로 만든다.**
3.  **이 사람에게는 일이 아닌 삶이 있다.**
4.  **이 사람은 지나온 과정을 숨기지 않는다.**
5.  **이 사람의 주장은 검증할 수 있다.**

앞의 넷은 전부 "보여준다"다. 다섯 번째만 성질이 다르고, 실제로 이 사이트를
다른 개인 사이트와 갈라 놓는 것은 그 하나다.

-   `/build` 가 커밋마다 실제 diff 로 링크된다
-   판권면의 모든 숫자가 저장소에서 계산된다 — 손으로 적은 것은 없다
-   예산을 넘기면 **빌드가 실패**한다. 대비 계약을 깨도, 레이어가 역전돼도,
    `/practice` 의 증거 링크가 죽어도 실패한다
-   `/practice` 는 이력서가 주장하지만 이 사이트가 증명하지 못한 것을
    **미증명이라고 표시**한다

보여주기는 흔하고 검증 가능성은 흔하지 않다. §20 Identity 가드레일
("이것이 Goldibug만의 것인가?")을 통과하는 항목이 이것 하나다.

즉, 결과물만 보여주는 브랜드가 아니라 **사람과 과정까지 보여주고, 그것을
확인할 수단까지 같이 내놓는 브랜드**다.

------------------------------------------------------------------------

# 3. Brand Positioning

## 3.1 Positioning Statement

> **Goldibug is a personal interface for the things I think, make, live,
> and trace.**

한국어로는:

> **Goldibug는 내가 생각하고, 만들고, 살아가고, 기록해온 것을 하나의
> 인터페이스로 보여주는 개인 공간이다.**

------------------------------------------------------------------------

## 3.2 What Goldibug Is

-   Personal interface
-   Maker archive
-   Experimental playground
-   Thinking space
-   Life archive
-   Engineering showcase
-   Continuous work-in-progress

## 3.3 What Goldibug Is Not

-   단순한 개발자 이력서
-   기술만 보여주는 포트폴리오
-   SEO용 블로그
-   기업형 브랜드 사이트
-   육아/교육 전문 서비스
-   과도하게 감성적인 개인 홈페이지
-   화려한 UI를 보여주기 위한 디자인 쇼케이스

------------------------------------------------------------------------

# 4. Brand Personality

Goldibug의 성격은 다음 다섯 가지의 균형으로 정의한다.

| Attribute | Meaning |
|---|---|
| Curious | 계속 질문하고 탐구한다 |
| Technical | 기술을 실제 문제 해결에 사용한다 |
| Human | 사람과 삶을 중심에 둔다 |
| Experimental | 실패와 실험을 숨기지 않는다 |
| Quietly confident | 과시하지 않지만 결과물로 증명한다 |

### 핵심 원칙

**Smart, not clever.**

똑똑해 보이려고 하지 않는다.

**Personal, not sentimental.**

개인적이지만 감상적으로 흘러가지 않는다.

**Technical, not corporate.**

기술적이지만 회사 소개서처럼 보이지 않는다.

**Experimental, not chaotic.**

실험적이지만 무질서하지 않는다.

------------------------------------------------------------------------

# 5. Brand Voice

## 5.1 Voice

Goldibug의 말투는:

-   짧다.
-   명확하다.
-   관찰적이다.
-   약간의 호기심을 남긴다.
-   과장하지 않는다.
-   전문가인 척하지 않는다.
-   실패를 숨기지 않는다.

### 좋은 표현

> I wondered if this could work.

> I built this to find out.

> It didn't work.

> So I changed it.

> This is what I learned.

### 피해야 할 표현

> Revolutionary AI-powered platform.

> The ultimate developer experience.

> Cutting-edge next-generation solution.

> 세계 최고의 혁신적인 기술.

Goldibug는 **마케팅 언어보다 관찰자의 언어**를 사용한다.

------------------------------------------------------------------------

# 6. Information Architecture

Goldibug의 브랜드 구조는 레포의 네 가지 Chapter와 직접 연결한다.

``` text
                    GOLDIBUG
                        │
       ┌────────────────┼────────────────┐
       │                │                │
     THINK             MAKE             LIVE
       │                │                │
   생각/글/노트      프로젝트/코드       삶/가족/관심
       │                │                │
       └────────────────┼────────────────┘
                        │
                      TRACE
                        │
                  시간 / 변화 / 흔적
```

## THINK

**What I think about.**

글, 노트, 질문, 공부, 관찰, 아이디어.

핵심은 "정답"보다 **생각이 형성되는 과정**이다.

## MAKE

**What I build.**

프로젝트, 제품, 실험, 코드, 디자인, 기술적 의사결정.

각 프로젝트는 가능하면 다음 구조를 갖는다.

-   Problem
-   Constraint
-   Decision
-   Trade-off
-   Result
-   What changed

## LIVE

**What life looks like outside work.**

가족, 일상, 독서, 여행, 취향, 관심사 등.

단, 사적인 정보를 무조건 많이 공개하는 것이 목적은 아니다.

**공개할 가치가 있는 경험만 큐레이션한다.**

## TRACE

**What changed.**

시간순으로 이어지는 전체 기록.

완성된 결과만 보여주는 것이 아니라:

-   이전 버전
-   버린 아이디어
-   실패한 접근
-   다시 생각한 결정
-   오래된 프로젝트
-   변경된 관점

을 포함한다.

TRACE는 Goldibug를 일반적인 포트폴리오와 구별하는 핵심 장치다.

------------------------------------------------------------------------

# 7. Visual Brand Strategy

## 7.1 Visual Principle

### Inverted Duotone

Goldibug의 기본 시각 언어는 **두 개의 Ground와 하나의 Accent**를
중심으로 한다.

``` text
LIGHT
#f7f5f0
    ↓
DARK
#0b0b0c
    ↓
LIGHT
#f7f5f0
```

페이지의 분위기도:

``` text
Calm → Dense → Calm
```

으로 움직인다.

------------------------------------------------------------------------

## 7.2 Color System

| Role | Light | Dark |
|---|---|---|
| Ground | `#f7f5f0` | `#0b0b0c` |
| Figure | `#0b0b0c` | `#f7f5f0` |
| Muted | `#70706e` | `#7a7977` |
| Accent | `#ff4d00` | `#ff4d00` |
| Accent Text | `#cc3e00` | `#ff4d00` |
| On Accent | `#0b0b0c` | `#0b0b0c` |
| Focus | `#cc3e00` | `#cc3e00` |

이 값들은 이 문서의 소유가 아니다. 단일 출처는 `styles/tokens.css` 이고,
여기 적힌 것은 사본이다. **역할마다 약속한 대비가 있고
`pnpm check:contrast` 가 실제 비율을 측정해 어긋나면 빌드를 실패시킨다** —
`lib/tokens.data.ts` 의 `CONTRAST_CONTRACT` 가 그 약속이다. 팔레트가 대비에서
역산된 과정은 `docs/ART-DIRECTION.md` 에 있다.

### Accent Rule

Orange는 브랜드 전체를 장식하는 색이 아니다.

**Accent는 시스템 안의 "예외"다.**

따라서:

-   중요한 상태
-   현재 Chapter
-   Focus
-   CTA
-   작은 포인트
-   데이터/변화 표시

등에 제한적으로 사용한다.

Light 배경에서 `#ff4d00`을 본문 텍스트로 사용하지 않는다.

------------------------------------------------------------------------

# 8. Logo Strategy

## 8.1 Fundamental Decision

Goldibug는 **곤충 캐릭터를 로고로 만들지 않는다.**

Bug는 시각적인 벌레가 아니라 **개발자의 bug**라는 개념으로 해석한다.

``` text
Bug
 ↓
Unexpected
 ↓
Notice
 ↓
Understand
 ↓
Fix
 ↓
Improve
```

이 개념은 Goldibug의:

-   MAKE
-   TRACE
-   실험
-   실패
-   개선

과 자연스럽게 연결된다.

------------------------------------------------------------------------

## 8.2 Wordmark First

브랜드의 1차 식별자는 심볼이 아니라:

> **GOLDIBUG**

워드마크다.

이유:

1.  이름 자체가 독특하다.
2.  개인 브랜드이므로 기업형 심볼이 필요하지 않다.
3.  이름의 스토리가 브랜드 자산이다.
4.  지나치게 디자인된 심볼은 오히려 흔해질 수 있다.

### Logo Direction

-   Typographic
-   Editorial
-   Minimal
-   Slightly irregular
-   Systematic
-   Non-corporate

### 이 절은 인장이 나오기 전에 쓰였다

원본은 "워드마크가 1차 식별자이고 심볼은 필요 없다"로 끝난다. 그 판단
자체는 여전히 맞지만, 그 뒤에 심볼이 하나 생겼고 그것은 디자인된 심볼이
아니라 **계산되는** 마크다 — `lib/sigil.ts`.

-   칸 하나가 커밋 하나. 깊이는 그 커밋이 직접 바꾼 줄 수
-   64칸 × 3링 = 192칸. 링이 차면 안쪽에 다음 링이 열린다
-   바깥으로 튀어나온 표시는 저장소가 스스로 선언한 페이즈
-   `app/icon.tsx` 의 favicon 과 OG 이미지가 같은 계산에서 나온다

원본 §8.1 의 "금색 로고·벌레 캐릭터·GB 모노그램을 피한다"를 이 마크가
자동으로 만족한다. 그릴 수 있는 모양이 아니라 저장소의 상태이기 때문이다.
**아무도 다른 사람의 사이트에 붙일 수 없다** — §20 Personal 가드레일을
통과하는 유일한 시각 요소다.

워드마크는 그대로 1차 식별자다. 인장은 2차이고, 둘 사이의 위계는 바뀌지
않았다.

### Avoid

-   금색 로고
-   벌레 캐릭터
-   더듬이
-   눈 모양
-   일반적인 GB 모노그램
-   AI 스타트업 스타일 심볼
-   과도한 gradient
-   3D 로고

------------------------------------------------------------------------

# 9. "Bug" as a Brand Device

Bug를 로고가 아니라 **Brand Behavior**로 사용한다.

예:

``` text
Normal
──────────────

Goldibug
───────────•──
```

정돈된 시스템 안에 작은 변화가 존재한다.

이 작은 deviation을 다음 요소에서 반복적으로 활용할 수 있다.

-   Grid
-   Timeline
-   Typography
-   Cursor
-   Divider
-   Navigation
-   Loading
-   Hover
-   Micro interaction

중요한 것은 **항상 같은 모양으로 반복하지 않는 것**이다.

Bug는 하나의 아이콘이 아니라 **규칙에서 벗어나는 작은 사건**이어야 한다.

### 이건 이미 구현됐다

원본은 이 절을 앞으로 할 일로 적었는데, 인장의 **페이즈 틱**이 정확히 이
장치다. 정돈된 링 위에서 어떤 칸 하나가 바깥으로 튀어나오고, 그 위치는
저장소가 스스로 선언한 페이즈가 결정한다. 디자이너가 고른 자리가 아니다.

같은 원리가 다른 데도 있다.

| 요소 | 규칙 | 벗어나는 사건 |
|---|---|---|
| 인장 | 링 위에 고른 간격의 칸 | 페이즈 틱이 링 밖으로 |
| 홈 게이지 | 비어 있는 트랙 | 도착하면서 실제로 채워진다 |
| 인덱스 바 | 네 개의 같은 라벨 | 서 있는 챕터만 액센트 블록 |
| 챕터 비트 | 같은 템플릿 넷 | 밀도가 폭과 트래킹까지 다르게 연주 |

넷 다 모양이 다르다. 원본이 요구한 "같은 모양으로 반복하지 않는 것"이
설계가 아니라 결과로 지켜졌다 — 각 요소가 자기 데이터에서 모양을
가져오기 때문이다.

------------------------------------------------------------------------

# 10. Interaction Strategy

Goldibug의 인터랙션은 "멋있음"보다 **발견의 즐거움**을 목표로 한다.

## 10.1 Principle

> **Nothing should move without a reason.**

애니메이션은 다음 세 가지 중 하나의 목적을 가져야 한다.

1.  상태를 전달한다.
2.  구조를 이해시킨다.
3.  숨겨진 정보를 발견하게 한다.

------------------------------------------------------------------------

## 10.2 Micro Interaction

예:

-   hover → 작은 deviation
-   navigation → 현재 Chapter가 accent block으로 변환
-   scroll → light/dark ground 전환
-   timeline → 과거와 현재 연결
-   project card → 결과보다 process 노출
-   cursor → 아주 미세한 response

------------------------------------------------------------------------

# 11. Content Strategy

Goldibug의 콘텐츠는 **완성된 결과물만 생산하지 않는다.**

콘텐츠를 세 가지 레벨로 나눈다.

## Level 1 --- Artifact

완성된 것.

-   프로젝트
-   글
-   코드
-   결과물

## Level 2 --- Process

만드는 과정.

-   왜 만들었는가
-   어떤 선택을 했는가
-   무엇이 실패했는가
-   무엇을 바꾸었는가

## Level 3 --- Trace

시간이 지나면서 바뀐 것.

-   이전 생각
-   이전 버전
-   버린 아이디어
-   다시 살린 아이디어
-   관점의 변화

Goldibug의 장기적인 차별점은 **Level 3**에서 만들어진다.

## 레벨은 축 하나가 아니다

원본은 콘텐츠를 세 레벨로만 나눴다. 실제 모델에는 축이 셋 있고, 나중에
붙은 둘은 원본에 없다.

```text
레벨    Artifact · Process · Trace       무엇을 말하는가
레지스터  원문 · 쉬운 말                    어떤 어휘로 말하는가
로케일   ko · en                        어떤 언어로 말하는가
```

파일로는 형제 파일 넷이 되고, 로케일이 **바깥**이라 한 규칙으로 갈린다.

```text
content/think/why-contrast-came-first.mdx           원문 ko
content/think/why-contrast-came-first.en.mdx        원문 en
content/think/why-contrast-came-first.eli5.mdx      쉬운 말 ko
content/think/why-contrast-came-first.eli5.en.mdx   쉬운 말 en
```

두 축을 왜 붙였는지가 브랜드와 직접 닿는다.

-   **레지스터** — §5 Brand Voice 는 "전문가인 척하지 않는다"를 요구한다.
    같은 글을 쉬운 말로 다시 쓸 수 있다는 것이 그 주장의 유일한 증거다.
    쉬운 판은 사실을 복제하지 않는다. 날짜·주제·태그와 MAKE 의 결정
    필드는 원문에서 읽는다 — 두 벌이면 언젠가 한 벌이 틀린다.
-   **`authored` 필드에 기본값이 없다.** 사람이 쓰지 않은 판은 페이지에
    그렇다고 적어야 한다. 이 사이트의 주장이 "문장이 증거"이므로, 라벨
    없는 기계 문장이 통과되는 것이 이 필드가 막는 단 하나의 실패다.
-   **로케일** — §13 의 Tertiary("비슷한 것을 만드는 사람")는 한국어
    화자로 한정되지 않는다.

현재 상태: 원문 22편 전부 네 판을 갖췄다. 커버리지는 손으로 세지 않고
`pnpm check:content` 가 보고한다.

------------------------------------------------------------------------

# 12. Project Storytelling

모든 프로젝트를 단순한 카드 형태로 나열하지 않는다.

가능하면:

``` text
WHY
↓
CONSTRAINT
↓
DECISION
↓
BUILD
↓
FAILURE
↓
RESULT
↓
WHAT CHANGED
```

의 흐름을 보여준다.

이는 단순히 "무엇을 만들었는가"보다 **어떻게 생각하고 만들었는가**를
증명한다.

------------------------------------------------------------------------

# 13. Audience

Goldibug의 핵심 방문자는 특정 직군 하나가 아니다.

### Primary

**나를 처음 알게 된 사람**

나의 프로젝트와 생각을 빠르게 이해할 수 있어야 한다.

### Secondary

**함께 일할 가능성이 있는 사람**

개발 역량뿐 아니라 문제를 바라보는 방식과 커뮤니케이션 방식을 이해할 수
있어야 한다.

> 넷 가운데 **이 독자만 오래 표면이 없었다.** THINK·MAKE·LIVE·TRACE 는
> Primary·Tertiary·Personal 을 받지만, "얼마나 오래 했고, 무엇을
> 책임졌고, 지금 무엇을 맡길 수 있나"에 답하는 곳이 사이트에 없었다.
>
> `/practice` 가 그 자리다. 이력서 페이지가 아니고, 차이는 어투가 아니라
> 구조다 — 주장(claimed)과 증거(evidence)를 독립된 두 축으로 들고 있어서
> **둘이 어긋나는 경우를 그대로 렌더한다.** 이력서에 있으나 이 사이트가
> 증명하지 못한 것은 미증명이라고 표시되고, 이력서에 없는데 증명되는
> 것에는 액센트 표시가 붙는다.
>
> 그 목록이 §11 의 다음 할 일이기도 하다.

### Tertiary

**비슷한 것을 만드는 사람**

프로젝트와 기록에서 실제적인 인사이트를 얻을 수 있어야 한다.

### Personal

**미래의 나**

TRACE가 중요한 이유다.

몇 년 뒤 다시 봤을 때:

> "내가 이렇게 생각했었구나."

를 발견할 수 있어야 한다.

------------------------------------------------------------------------

# 14. Brand Differentiation

Goldibug가 경쟁하는 것은 다른 개인 홈페이지가 아니다.

실제로는 다음과 같은 generic personal-brand 패턴과 거리를 둔다.

``` text
Developer
      ↓
Skills
      ↓
Projects
      ↓
Resume
      ↓
Contact
```

Goldibug는:

``` text
Person
  ↓
Think
  ↓
Make
  ↓
Live
  ↓
Trace
```

다르다.

**Portfolio가 아니라 Personal Interface다.**

------------------------------------------------------------------------

# 15. Homepage Strategy

홈페이지는 정보를 모두 설명하는 페이지가 아니라 **한 사람을 한 번
경험하게 만드는 페이지**여야 한다.

현재 레포의 Golden Path를 기본 전략으로 유지한다.

``` text
HERO
  ↓
THINK
  ↓
MAKE
  ↓
LIVE
  ↓
TRACE
```

핵심 원칙:

> **A reader who never clicks anything has still met the whole person.**

즉, 사용자가 메뉴를 하나도 클릭하지 않아도 Goldibug의 전체적인 인상을
이해할 수 있어야 한다.

------------------------------------------------------------------------

# 16. Brand Messaging

## Primary

> **An interface for a life in progress.**

현재 사이트의 중심 문장으로 사용한다.

## Secondary

> **I think. I make. I live. I trace.**

Goldibug의 구조를 가장 간결하게 설명한다.

## Supporting

> **Things I think about. Things I build. Things I live. Things I leave
> behind.**

콘텐츠/섹션 설명에 사용할 수 있다.

## Brand Philosophy

> **Make things. Keep wondering.**

브랜드의 행동 원칙으로 사용할 수 있지만, 사이트의 H1과 동일한 위계로
사용하지 않는다.

------------------------------------------------------------------------

# 17. Brand Architecture

``` text
GOLDIBUG
│
├── THINK
│   ├── Essays
│   ├── Notes
│   ├── Questions
│   └── Learning
│
├── MAKE
│   ├── Projects
│   ├── Experiments
│   ├── Code
│   └── Builds
│
├── LIVE
│   ├── Life
│   ├── Family
│   ├── Books
│   └── Interests
│
└── TRACE
    ├── Timeline
    ├── Versions
    ├── Abandoned
    └── Reconsidered
```

네 챕터 밖에 **시스템 페이지**가 셋 있다. 챕터가 아니므로 위 구조를
건드리지 않고, 셋 다 자기 주장을 스스로 계산한다.

| 라우트 | 무엇을 문서화하나 | 계산 출처 | 집행 |
|---|---|---|---|
| `/art-direction` | 팔레트·대비 계약·타입·모션·인장 | `lib/tokens.data.ts` | `check:contrast` |
| `/build` | 커밋 기록, 직접 쓴 줄과 생성된 줄 | `lib/git.data.json` | `sync:git` |
| `/practice` | 실무 — 주장과 증거 두 축 | `lib/practice.data.ts` | `check:practice` |

새 페이지를 이 목록에 넣기 전에 §20 가드레일을 통과해야 하고, 특히
**주장을 계산할 출처와 그것을 지키는 게이트가 있어야 한다.** 그게 없으면
그 페이지는 다섯 번째 약속을 깨는 첫 페이지가 된다.

------------------------------------------------------------------------

# 18. Growth Strategy

Goldibug는 처음부터 콘텐츠를 많이 만들 필요가 없다.

오히려 **적은 수의 깊은 기록**이 중요하다.

> **주의 — 이 로드맵은 저장소의 빌드 페이즈와 다른 축이다.**
> `lib/tokens.data.ts` 의 `PHASES`(0 Art Direction … 6 Identity, 7 Reach)는
> 무엇을 지었는지를 세고, 아래는 콘텐츠가 얼마나 쌓였는지를 센다. 두
> 목록을 같은 것으로 읽으면 둘 다 틀리게 읽힌다.

### Phase 1 --- Identity — 닫힘

-   ~~워드마크 확정~~ · ~~디자인 시스템 정리~~ · ~~홈페이지 완성~~
-   ~~THINK / MAKE / LIVE / TRACE 구조 확정~~ — `lib/sections.ts`

### Phase 2 --- Evidence — 닫힘

-   ~~대표 프로젝트 3\~5개~~ — MAKE 5편
-   ~~좋은 글 5\~10개~~ — THINK 8편
-   ~~실험 기록~~ · ~~TRACE 타임라인~~ — TRACE 5편, `/build`

수치는 `pnpm check:content` 가 보고한다. 이 문서에 손으로 적힌 숫자는
읽는 시점에 이미 틀려 있을 수 있고, 그래서 세는 곳을 같이 적었다.

### Phase 3 --- Network — 현재 위치

-   ~~GitHub 연결~~ — 저장소 공개, `/build` 가 커밋마다 diff 로 링크
-   프로젝트 공유 · 글 공유 — **아직**
-   오픈소스/개인 실험 공개 — 이 사이트 자체가 첫 번째

Phase 3 을 막고 있는 것은 콘텐츠가 아니라 배포다. 다만 그 상태가 바뀌었다 —
**`goldibug.com` 은 등록돼 있고 이미 Cloudflare 네임서버를 쓴다**
(`sima`/`gordon.ns.cloudflare.com`). 존은 만들어져 있고 레코드가 하나도
없다. 남은 것은 배포 자체와 `NEXT_PUBLIC_SITE_URL` 설정이고, 그때까지
`pnpm check:release` 는 76개 라우트에 localhost 가 박혀 있다고 막는다.
절차는 `docs/PRODUCTION.md` 의 "Deploying — Cloudflare" 에 있다.

### Phase 4 --- Ecosystem

Goldibug 자체가 여러 프로젝트를 담는 **개인 브랜드 플랫폼**으로
성장한다.

``` text
Goldibug
   │
   ├── Personal Site
   ├── Experiments
   ├── Open Source
   ├── Writing
   ├── Tools
   └── Future Projects
```

------------------------------------------------------------------------

# 19. Social / External Identity

모든 외부 채널에서 동일한 브랜드 원칙을 유지한다.

## GitHub

-   Goldibug를 개인 브랜드의 상위 identity로 사용
-   프로젝트는 각각 독립적인 이름을 가질 수 있음
-   README에서 Goldibug의 개인 인터페이스와 연결

## LinkedIn

회사형 자기소개보다:

-   What I build
-   What I think about
-   What I'm exploring

중심으로 표현한다.

## Open Graph

단순한 로고 이미지보다:

``` text
GOLDIBUG

An interface for a life in progress.
```

와 같은 editorial composition을 사용한다.

------------------------------------------------------------------------

# 19-b. 공개 정책

원본에는 이 절이 없다. §"LIVE"가 *"공개할 가치가 있는 경험만
큐레이션한다"* 고만 적어 두고 **선을 긋지 않았다.** 저장소가 공개이므로
선이 없으면 매번 즉석에서 판단하게 되고, 즉석 판단은 되돌릴 수 없는 쪽으로
한 번만 틀리면 된다.

## 선

| 공개한다 | 공개하지 않는다 |
|---|---|
| 구(區) 단위 지역 | 주소, 동·호수 |
| 역할·책임 범위·기간 | 재직사·학교 이름 |
| 집계 수치 (라우트 62개, 팀 7명) | 조직 식별 정보, 호스트, 계정 |
| 워드마크 GOLDIBUG | 실명 — `LEGAL_NAME` 은 의도적으로 비어 있다 |
| GitHub 프로필 | 전화번호, 이메일 |
| 가족의 존재 | 이름, 사진, 생년월일, 어린이집·학교 |

`LEGAL_NAME` 이 코드에 자리로 존재하는 이유가 여기 있다. 워드마크는
읽는 사람이 보는 것이고 실명은 기계가 이 사이트를 사람에게 연결하는
것이며, **둘을 한 필드로 합치면 둘 중 하나를 잃는다.** 비어 있는 것이
유효한 상태이고, `alternateName` 은 구조화 데이터에서 통째로 빠진다.

## 이름 하나가 지역 결정이 아니다

가장 실질적인 규칙은 이것이다. 이미 발행한 글 세 편이 첫 줄에서 조직·
호스트·회원 데이터를 뺀다고 약속한 채로 집계 수치를 싣고 있다 — 라우트
62개, 75,402행, 팀원 A~G, 배포 18건. bb-mcp 는 저장소 이름을
`<워크스페이스>/<저장소-A>` 로 치환했다.

여기서 회사 이름을 한 번 대면 **그 수치들이 소급해서 특정 회사에
붙는다.** 새 페이지 하나의 결정이 아니라 이미 공개된 글 세 편의 약속을
깨는 결정이다.

## 게이트

선을 문서에만 두면 지켜지지 않는다.

-   `check:release` — `lib/git.data.json` 에 이메일이 있으면 **blocker**.
    파서가 저자를 수집하지 않지만, 한 번이라도 섞이면 정적 HTML 로 나간다
-   `check:release` — `NAME` 이 플레이스홀더인 채로는 통과하지 않는다
-   `check:practice` — 전화번호·국제전화·상세주소·이메일 **패턴**과
    조직 이름을 검사한다

마지막 항목에 배운 것이 하나 있다. 첫 판은 회사 이름 여덟 개를 **평문
정규식**으로 들고 있었고, 그 이름들은 이 저장소 어디에도 없었다. 게이트를
올리는 순간 저자가 민감하게 보는 조직 목록을 한 줄에 모아 처음으로
공개하는 것이었다.

> **패턴 블록리스트는 공개할 수 있고, 값 블록리스트는 공개할 수 없다.**

전화번호와 주소는 형태를 기술하므로 이 저자에 대해 아무것도 노출하지
않는다. 회사 이름은 값이다. 지금은 절단된 SHA-256 다이제스트로 들고
있는데, 해시는 **이미 그 이름을 가진 사람에게만** 확인해 준다 — 저장소를
읽는 사람이 가져오지 않은 것은 알려 주지 않는다. 비밀이라는 주장이 아니라
공개하지 않는다는 주장이고, 그 한계는 게이트 주석에 적혀 있다.

------------------------------------------------------------------------

# 20. Brand Guardrails

앞으로 새로운 디자인이나 기능을 추가할 때 다음 질문을 통과해야 한다.

### Identity

> 이것이 Goldibug만의 것인가?

### Personal

> 다른 개발자의 포트폴리오에 그대로 붙여도 이상하지 않은가?

그렇다면 제거하거나 다시 생각한다.

### System

> 기존 THINK / MAKE / LIVE / TRACE 구조와 연결되는가?

### Restraint

> 더 넣는 것이 정말 필요한가?

### Meaning

> 이 장식이나 인터랙션에 이유가 있는가?

### Longevity

> 3년 후에도 촌스럽지 않을 것인가?

### Verifiable

> 이 페이지의 주장을 무엇이 계산하고, 무엇이 지키는가?

다섯 번째 약속(§2.2)의 가드레일이다. 계산 출처와 게이트가 없는 주장을
페이지에 올리면 그 페이지가 약속을 깨는 첫 페이지가 된다. §17 의 시스템
페이지 셋은 전부 이 질문에 답이 있다.

### Disclosed

> 이것이 이미 공개된 것보다 더 많이 말하는가? 되돌릴 수 있는가?

§19-b 의 가드레일이다. 되돌릴 수 없는 쪽(주소·전화번호)은 게이트가 막고,
되돌릴 수 있는 쪽은 판단한다.

------------------------------------------------------------------------

# 21. Anti-Pattern

Goldibug에서 의도적으로 피해야 할 것들:

-   🐛 literal bug mascot
-   gold / luxury aesthetic
-   generic GB monogram
-   AI startup gradient
-   excessive glassmorphism
-   excessive 3D
-   oversized skill badges
-   meaningless particle effects
-   excessive orange
-   motivational quotes
-   generic "Full-stack developer" hero
-   fake metrics
-   unnecessary awards/badges
-   template-like project cards
-   모든 것을 애니메이션화하기

------------------------------------------------------------------------

# 22. Success Criteria

Goldibug의 브랜딩이 성공했다고 판단하는 기준:

### 5초

처음 방문했을 때:

> "이건 개인 사이트구나."

### 15초

조금 더 보면:

> "개발자이면서 뭔가 직접 만드는 사람이구나."

### 30초

더 보면:

> "일뿐 아니라 자기 삶과 생각도 기록하는 사람이구나."

### 1분

사이트를 경험한 뒤:

> "이 사람의 방식이 있네."

### 최종

사이트를 떠난 뒤에도:

> **GOLDIBUG라는 이름이 기억난다.**

이것이 가장 중요한 KPI다.

------------------------------------------------------------------------

# 23. Final Brand Definition

## One sentence

> **Goldibug is a personal interface for a life in progress.**

## One idea

> **A person is not a finished product.**

## Four chapters

> **THINK · MAKE · LIVE · TRACE**

## One visual principle

> **Calm system + small deviation.**

## One behavioral principle

> **Make things. Keep wondering.**

## One brand attitude

> **Quietly curious. Technically capable. Personally human.**

------------------------------------------------------------------------

# 24. Immediate Next Actions

브랜딩 전략 확정 이후의 우선순위는 다음과 같다.

원본 목록 열 개 가운데 여덟은 이미 끝났다. 무엇이 그것을 끝냈는지 같이
적는다 — 끝난 항목을 목록에 남겨 두면 로드맵이 거짓말을 시작한다.

| | 원본 항목 | 상태 |
|---|---|---|
| 1 | 워드마크 재설계 | **닫힘** — 워드마크 유지, 심볼 자리는 `lib/sigil.ts` 가 채웠다 |
| 2 | 로고 light/dark 규칙 | **닫힘** — 마크가 `currentColor` 를 쓰므로 반전을 자동으로 따라간다 |
| 3 | favicon / avatar 시스템 | **닫힘** — `app/icon.tsx`, `opengraph-image.tsx` 가 같은 계산에서 나온다 |
| 4 | 도메인 header identity | **남음** — 도메인·존은 준비됨(goldibug.com). 배포와 `NEXT_PUBLIC_SITE_URL` 만 남았다 |
| 5 | Hero 카피 확정 | **닫힘** — `site.tagline`, 게이지로 렌더 |
| 6 | 챕터별 visual language | **닫힘** — `tone`·`density` 가 폭·트래킹까지 연주 |
| 7 | 프로젝트 상세 템플릿 | **닫힘** — `Work` 타입의 constraint/tradeoff/outcome |
| 8 | TRACE timeline UX | **닫힘** — WebGL 필드 + 목록 폴백 |
| 9 | OG / GitHub identity | **닫힘** — Satori OG, `REPO` 단일 출처 |
| 10 | design tokens 통합 | **닫힘** — `styles/tokens.css` 단일 출처, `check:contrast` 집행 |

### 실제로 남은 것

1.  **도메인 등록과 `NEXT_PUBLIC_SITE_URL` 설정.** §18 Phase 3 전체가 이
    하나에 막혀 있다.
2.  **AI 크롤러 정책 결정.** `app/robots.ts` 가 아직 미결이다. §13 에
    Personal("미래의 나")까지 독자로 적어 둔 브랜드가 학습 크롤러를 어떻게
    대할지는 브랜드 결정이지 기술 결정이 아니다.
3.  **`/practice` 의 미증명 5개 가운데 쓸 수 있는 것 쓰기.** 그 목록이
    그대로 다음 콘텐츠 백로그다.
4.  **`10년차` 와 `13년` 가운데 무엇을 말할 것인지 정하기.** 첫 직장 입사
    연월은 2013-01 로 확인돼 `lib/practice.data.ts` 의 `early-years` 에 들어
    갔고, `/practice` 는 거기서 파생한 `실무 기간 13년` 을 렌더한다. 원자료는
    저자를 `10년차` 라고 쓴다. 둘 다 참일 수 있다 — `N년차` 는 고용된 모든
    해가 아니라 해당 분야의 해로 세는 것이 보통이다. 좁은 쪽을 말하려면
    고칠 곳은 **시기 경계**이고, 사전의 리터럴이 아니다. 게이트가 검사할 수
    없는 숫자를 페이지에 두지 않는다는 것이 이 문서 §2.2 의 다섯 번째
    약속이다.

------------------------------------------------------------------------

## Brand North Star

> **Don't present a finished self.**
>
> **Show the interface of becoming.**

------------------------------------------------------------------------

# 정정 기록

원본은 사이트가 Phase 0 에 있을 때 쓰였다. 아래는 그 뒤 코드가 문서를
추월한 대목과, 원본에 아예 없던 대목이다.

`lib/tokens.data.ts` 의 `PHASES` 가 네 페이즈 동안 방치돼 방문자에게
"Phase 1 이 다음"이라고 말하고 있었던 일이 있었다. **로드맵이 작업을
뒤처지면 없는 로드맵보다 나쁘다** — 독자가 확인할 수단이 없는 유일한
요소라서 그대로 믿긴다. 이 문서도 같은 위험에 있으므로 정정을 지운 것이
아니라 기록으로 남긴다.

## 코드가 문서를 추월한 것

| 절 | 원본이 말한 것 | 실제 |
|---|---|---|
| §8 Logo | "심볼은 필요 없다, 워드마크가 1차" | 워드마크는 그대로. 심볼 자리를 `lib/sigil.ts` 의 **계산되는** 마크가 채웠다 |
| §9 Bug Device | 앞으로 할 일로 적힘 | **이미 구현됨** — 인장의 페이즈 틱이 그 장치다 |
| §11 Content | 레벨 3개 | 축이 셋 — 레벨 × 레지스터 × 로케일 |
| §13 Audience | 넷 다 대응된다고 암시 | Secondary 만 표면이 없었다. `/practice` 가 그 자리 |
| §17 Architecture | 챕터 4개 | 챕터 밖에 시스템 페이지 셋 |
| §18 Growth | Phase 1 이 다음 | Phase 1·2 닫힘, 현재 3, blocker 는 도메인 |
| §24 Next | 10개 전부 미착수 | 8개 닫힘. 남은 것은 도메인·크롤러 정책·백로그·입사연월 |

## 원본에 없던 것

-   **§2.2 다섯 번째 약속 — 검증 가능성.** 앞의 넷은 전부 "보여준다"이고,
    이 사이트를 실제로 갈라 놓는 것은 주장이 게이트로 묶여 있다는 것이다.
    §20 Identity 가드레일을 통과하는 항목이 이것 하나다.
-   **§19-b 공개 정책.** 원본은 "큐레이션한다"고만 적고 선을 긋지 않았다.
    저장소가 공개이므로 선이 없으면 매번 즉석 판단이 된다.
-   **§20 Verifiable · Disclosed 가드레일.** 위 둘의 집행 질문.

## 옮긴 뒤에 고친 것

-   **§24-4** — 옮긴 당일 낡았다. 입사 연월이 2013-01 로 확인되면서
    `PRACTICE_START` 가 불필요해지고 파생 값이 `6년` 에서 `13년` 으로
    바뀌었는데, 문서는 아직 "미확인, 6년"이라고 말하고 있었다. 이 문서가
    경고하는 바로 그 상태였다.

## 이 문서가 옮겨진 이유

`~/Downloads` 에 있는 동안은 저장소의 어떤 게이트도 이 문서를 보지 못했고,
`docs/` 의 다른 여섯 문서와 달리 무엇이 구현이고 무엇이 집행인지 적혀
있지 않았다. 계약이라면 코드와 같은 곳에 있어야 하고, 틀렸을 때 고쳐졌다는
기록이 남아야 한다.
