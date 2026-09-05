# PERSONAL INTERFACE

한 사람의 생각과 삶을 하나의 인터페이스로 번역하면서, 그 인터페이스를 만드는
능력까지 동시에 증명하는 개인 웹 제품.

Next.js 16 · React 19 · TypeScript · MDX · modern CSS · WebGL

---

## 시작하기

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

## 배포 전에 반드시 채워야 하는 것

```bash
pnpm release        # verify + 릴리스 게이트
```

게이트가 통과할 때까지 이 사이트는 배포 준비가 되지 않은 것입니다. 현재 남은
블로커는 **하나**입니다.

1. **이름** — `lib/site.config.ts`의 `NAME` 상수 한 줄. 사이트 전체에서
   이름이 등장하는 유일한 지점입니다.
2. **origin** — 배포 환경에 `NEXT_PUBLIC_SITE_URL=https://…` 설정.
   canonical·sitemap·feed·OpenGraph가 전부 여기서 파생됩니다.
   (`.env.example` 참고)

## 글 쓰기

```
content/<chapter>/<slug>.mdx     chapter: think | make | live | trace
```

챕터마다 프론트매터가 다릅니다 — 각 구간이 서로 다른 질문에 답하기 때문입니다.
자세한 내용은 [docs/PERSONAL-SYSTEM.md](docs/PERSONAL-SYSTEM.md).

```yaml
---
title: 제목
date: 2026-08-24        # 따옴표 불필요
summary: 한 줄 요약      # meta description 으로 재사용, 160자 이내
tags: [태그]
draft: true             # 개발 중에만 보이고 절대 배포되지 않음
---
```

프론트매터가 잘못되면 **빌드가 실패합니다.** 빈 페이지로 배포되지 않습니다.

## 검증

```bash
pnpm verify     # typecheck → lint → contrast → content → build → layers → motion → budget
pnpm release    # verify + 배포 가능 여부
```

| 스크립트 | 막는 것 |
|---|---|
| `check:contrast` | 대비 임계값 위반, 그리고 방문자에게 표시되는 수치가 실제와 어긋나는 것 |
| `check:content` | 챕터 밖 파일, URL로 못 쓸 슬러그, 미래 날짜, 너무 긴 summary |
| `check:layers` | 캐스케이드 레이어 순서가 조용히 뒤집히는 것 |
| `check:budget` | 라우트별 first-load 무게, 그리고 지연 로드가 무게를 숨기는 것 |
| `check:motion` | 스크롤 리빌이 미지원·감속모션 환경에서 콘텐츠를 영구히 숨기는 것 |
| `check:release` | 플레이스홀더·localhost URL·누락된 메타데이터가 배포되는 것 |

각 가드는 **일부러 깨뜨려 실패를 확인한 뒤** 커밋했습니다. 통과만 확인한 검증은
아무것도 보장하지 않습니다.

## 문서

| | |
|---|---|
| [BRAND.md](docs/BRAND.md) | 브랜드 — 네 챕터의 근거, 다섯 가지 약속, 공개 정책, 정정 기록 |
| [DATA-VISUALIZATION.md](docs/DATA-VISUALIZATION.md) | 방향 — 센 증거, 공공누리 라이선스 함정, 포트폴리오 셋과 페이즈 |
| [ART-DIRECTION.md](docs/ART-DIRECTION.md) | Inverted Duotone — 팔레트가 대비에서 역산된 과정, 액센트 법칙 |
| [GOLDEN-PATH.md](docs/GOLDEN-PATH.md) | 라우트 구조, 톤 리듬, 인덱스 바 |
| [PERSONAL-SYSTEM.md](docs/PERSONAL-SYSTEM.md) | 콘텐츠 모델, MDX 파이프라인, 아카이브 |
| [ENGINEERING-SHOWCASE.md](docs/ENGINEERING-SHOWCASE.md) | WebGL 필드, 지연 예산, 저하 경로 |
| [INTERACTION.md](docs/INTERACTION.md) | 스크롤·포인터 인터랙션 — JS 0바이트 |
| [PRODUCTION.md](docs/PRODUCTION.md) | SEO·헤더·측정값·배포 |
| [brief/](docs/brief/) | 원본 기획서 |
