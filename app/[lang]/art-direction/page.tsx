import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { isLocale, localePath, LOCALES, LOCALE_META } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import Link from 'next/link'

import { Section } from '@/components/Section'
import { cx } from '@/lib/cx'
import { site } from '@/lib/site.config'
import {
  CONTRAST_CONTRACT,
  MOTION_TOKENS,
  PHASES,
  type RoleContract,
} from '@/lib/tokens.data'
import type { Tone } from '@/lib/tone'
import styles from './page.module.css'


/** hreflang for one locale-free path, built from LOCALES so it cannot drift. */
const languages = (path: string) =>
  Object.fromEntries(
    LOCALES.map((l) => [LOCALE_META[l].lang, localePath(l, path)]),
  )

const DESCRIPTION =
  'Phase 0 — Inverted Duotone: the ground, the type, the accent law and the motion vocabulary for PERSONAL INTERFACE.'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const path = '/art-direction'
  return {
    title: 'Art Direction',
    description: DESCRIPTION,
    alternates: {
      canonical: localePath(lang, path),
      languages: languages(path),
    },
    openGraph: {
      type: 'website',
      locale: LOCALE_META[lang].og,
      url: localePath(lang, path),
      title: 'Art Direction',
      description: DESCRIPTION,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Swatches                                                            */
/* ------------------------------------------------------------------ */

function chipClass(role: string): string | undefined {
  switch (role) {
    case 'figure':
      return styles.chipFigure
    case 'muted':
      return styles.chipMuted
    case 'accent':
      return styles.chipAccent
    case 'accent-text':
      return styles.chipAccentText
    case 'on-accent':
      return styles.chipOnAccent
    case 'focus':
      return styles.chipFocus
    default:
      return undefined
  }
}

function SwatchRow({ contract }: { contract: RoleContract }) {
  return (
    <li className={styles.swatchRow}>
      <span className={cx(styles.chip, chipClass(contract.role))} aria-hidden="true" />
      <span className="small">
        <code>--{contract.role}</code>
        <span className={cx('label', styles.specimenMeta)}> · {contract.usage}</span>
      </span>
      <span className={cx('label', styles.ratio)}>
        {contract.ratio.toFixed(2)}:1{' '}
        <span className={styles.pass}>≥ {contract.min}</span>
      </span>
    </li>
  )
}

function TonePanel({ tone }: { tone: Tone }) {
  const roles = CONTRAST_CONTRACT[tone]
  return (
    <div data-tone={tone} className={styles.panel}>
      <div className={styles.panelHead}>
        <p className="label">data-tone=&quot;{tone}&quot;</p>
        <p className={cx('label', styles.specimenMeta)}>
          {tone === 'light' ? 'CALM' : 'DENSE'}
        </p>
      </div>
      <ul role="list" className={styles.swatchList}>
        {roles.map((c) => (
          <SwatchRow key={c.role} contract={c} />
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Type specimen                                                       */
/* ------------------------------------------------------------------ */

const SPECIMEN = [
  { cls: 'display', name: '.display', meta: 'wdth 125 · wght 900 · lh 0.86', sample: 'Trace' },
  { cls: 'h1', name: '.h1', meta: 'wdth 125 · wght 900 · lh 0.94', sample: 'Make things' },
  { cls: 'h2', name: '.h2', meta: 'wdth 100 · wght 700 · lh 1.12', sample: 'Technology is invisible' },
  { cls: 'h3', name: '.h3', meta: 'wdth 100 · wght 700 · lh 1.12', sample: 'Interactivity must have meaning' },
  { cls: 'lead', name: '.lead', meta: 'wdth 100 · wght 400 · lh 1.35', sample: 'An interface for a life in progress.' },
  { cls: 'small', name: '.small', meta: 'wdth 100 · wght 400 · lh 1.45', sample: 'Secondary voice — captions, metadata, footnotes.' },
  { cls: 'label', name: '.label', meta: 'wdth 100 · wght 500 · tracking 0.14em', sample: '01 / THINK' },
] as const

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function ArtDirectionPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = dict(lang)

  return (
    <>
      {/* ---- 00 · CALM ------------------------------------------------ */}
      <section
        data-tone="light"
        data-density="calm"
        className={styles.hero}
        aria-labelledby="hero-title"
      >
        <div className={cx('wrap', styles.heroInner)}>
          <p className="label">
            <Link href="/">{site.title}</Link> — Phase 0 / Art Direction
          </p>

          {/* Explicit trailing spaces: JSX drops the whitespace around a <br />,
              which would otherwise fuse the accessible name into
              "An interfacefor a lifein progress". The spaces collapse at the
              end of each visual line, so nothing changes on screen. */}
          <h1 id="hero-title" className={cx('display', styles.heroTitle)} lang="en">
            {'An interface '}
            <br />
            {'for a life '}
            <br />
            <span className="accentBlock">in progress</span>
          </h1>

          <p className="lead measure">{d.site.statement}</p>

          <div className={styles.heroFoot}>
            <div className={cx('label', styles.axes)}>
              {site.sections.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            <p className="label">Inverted Duotone · one accent · grotesk only</p>
          </div>
        </div>
      </section>

      {/* ---- 01 · DENSE ----------------------------------------------- */}
      <Section tone="dark" density="dense" index="01" title="The Inversion" id="inversion">
        <div className={styles.split}>
          <div className="stack">
            <h2 className="h2">Two grounds, one accent.</h2>
            <p className="small muted measure">
              색은 하나도 직접 쓰이지 않습니다. 모든 요소는{' '}
              <code>--ground</code>, <code>--figure</code>, <code>--accent</code>{' '}
              같은 <strong>역할(role)</strong>만 참조하고, 섹션이 선언한{' '}
              <code>data-tone</code>이 그 역할을 다시 가리킵니다.
            </p>
            <p className="small muted measure">
              그래서 <em>Calm → Dense → Calm</em>은 별도 장치가 아니라 톤의
              배열 그 자체입니다. 서버에서 렌더된 속성 하나이므로{' '}
              JavaScript가 꺼져 있어도 리듬은 그대로 남습니다.
            </p>
          </div>

          <div className={styles.tonePair}>
            <TonePanel tone="light" />
            <TonePanel tone="dark" />
          </div>
        </div>
      </Section>

      {/* ---- 02 · DENSE ----------------------------------------------- */}
      <Section tone="dark" density="dense" index="02" title="Type" id="type">
        <div className="stack">
          <h2 className="h2">One family. Two widths.</h2>
          <p className="small muted measure">
            Archivo 한 종류만 씁니다. 보통 두 번째 서체가 맡는 디스플레이/본문
            대비를 <code>wdth</code> 가변 축이 대신하기 때문에, &ldquo;grotesk
            only&rdquo;가 제약이 아니라 규율로 유지됩니다. 숫자는 별도 모노
            서체 없이 <code>tabular-nums</code>로 정렬합니다.
          </p>

          <div className={styles.specimen}>
            {SPECIMEN.map((row) => (
              <div key={row.name} className={styles.specimenRow}>
                <div className={cx('label', styles.specimenMeta)}>
                  <div>{row.name}</div>
                  <div>{row.meta}</div>
                </div>
                <div className={cx(row.cls, styles.specimenSample)} lang="en">
                  {row.sample}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ---- 03 · CALM ------------------------------------------------ */}
      <Section tone="light" density="calm" index="03" title="The Accent Law" id="accent">
        <div className="stack">
          <h2 className="h2">
            The constraint <span className="accentBlock">is</span> the direction.
          </h2>
          <p className="small muted measure">
            <code>#FF4D00</code>은 종이 바탕에서 3.05:1입니다. 면과 UI에는 쓸 수
            있지만 <strong>본문 텍스트로는 쓸 수 없습니다.</strong> 잉크
            바탕에서는 5.91:1이라 텍스트로 쓸 수 있습니다. 그래서 액센트는
            밝은 쪽에서 <em>덩어리</em>로, 어두운 쪽에서 <em>글자</em>로
            나타납니다 — 대비 제약을 우회한 게 아니라, 그 제약이 반전 리듬을
            만들어 줍니다.
          </p>

          <div className={styles.lawGrid}>
            <div data-tone="light" className={styles.lawCard}>
              <p className="label">On paper — 3.05:1</p>
              <p className="h3" lang="en">
                A <span className="accentBlock">solid mark</span> only
              </p>
              <p className="small muted">
                면·규칙선·포커스링에는 사용. 본문 크기 글자에는{' '}
                <span className="accentText">--accent-text (4.53:1)</span>.
              </p>
              <p className={cx('label', styles.lawVerdict)}>
                Non-text · SC 1.4.11 pass
              </p>
            </div>

            <div data-tone="dark" className={styles.lawCard}>
              <p className="label">On ink — 5.91:1</p>
              <p className="h3">
                <span className="accentText" lang="en">
                  Text is allowed
                </span>
              </p>
              <p className="small muted">
                어두운 바탕에서는 액센트가 그대로 본문 텍스트 색이 됩니다.{' '}
                <code>--accent</code>와 <code>--accent-text</code>가 같은 값.
              </p>
              <p className={cx('label', styles.lawVerdict)}>
                Body text · SC 1.4.3 AA pass
              </p>
            </div>
          </div>

          <p className="small muted measure">
            포커스 링은 <code>#CC3E00</code> 하나로, 종이 4.53:1 · 잉크 3.99:1.
            반전이 일어나도 포커스 표시는 색을 바꿀 필요가 없습니다.
          </p>
        </div>
      </Section>

      {/* ---- 04 · CALM ------------------------------------------------ */}
      <Section tone="light" density="calm" index="04" title="Motion" id="motion">
        <div className="stack">
          <h2 className="h2">Five durations. No more.</h2>
          <p className="small muted measure">
            <code>prefers-reduced-motion</code>에서는 모든 duration이 1ms로
            접히지만 <strong>상태 변화 자체는 유지됩니다.</strong> 모션을 줄인
            방문자도 Calm → Dense → Calm 구조를 그대로 받고, 전환 대신
            컷으로 받습니다.
          </p>

          <div className={styles.motionList}>
            {MOTION_TOKENS.map((m) => (
              <div key={m.token} className={styles.motionRow}>
                <code className="label">--{m.token}</code>
                <span className={cx('label', styles.ratio)}>{m.ms}ms</span>
                <span className={styles.track}>
                  <span
                    className={styles.tick}
                    style={{ ['--sweep' as string]: `${m.ms}ms` }}
                    aria-hidden="true"
                  />
                </span>
              </div>
            ))}
          </div>
          <p className={cx('label', styles.specimenMeta)}>
            {MOTION_TOKENS.map((m) => m.usage).join(' · ')}
          </p>
        </div>
      </Section>

      {/* ---- 05 · CALM ------------------------------------------------ */}
      <Section tone="light" density="calm" index="05" title="Phases" id="phases">
        <div className={styles.roadmap}>
          {PHASES.map((p) => (
            <div key={p.n} className={styles.phaseRow}>
              <span
                className={cx(
                  'label',
                  p.state === 'todo' ? styles.phaseTodo : styles.phaseDone,
                )}
              >
                {String(p.n).padStart(2, '0')}
              </span>
              <span
                className={cx(
                  'h3',
                  p.state === 'todo' ? styles.phaseTodo : styles.phaseDone,
                )}
                lang="en"
              >
                {p.state === 'next' ? (
                  <span className="accentBlock">{p.name}</span>
                ) : (
                  p.name
                )}
              </span>
              <span className={cx('label', styles.phaseState)}>
                {p.state === 'done' ? 'DONE' : p.state === 'next' ? 'NEXT' : '—'}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.closing}>
          <p className="lead measure" lang="en">
            {site.tagline}
          </p>
          <p className={cx('label', styles.specimenMeta)}>
            {site.title} · {site.name}
          </p>
        </div>
      </Section>
    </>
  )
}
