import type { Metadata } from 'next'
import Link from 'next/link'

import { DisplayLines } from '@/components/DisplayLines'
import { Section } from '@/components/Section'
import { cx } from '@/lib/cx'
import { isLocale, localePath, LOCALES, LOCALE_META } from '@/lib/i18n/config'
import { dict } from '@/lib/i18n/dictionary'
import { formatDate } from '@/lib/format'
import { eras, stats } from '@/lib/git/load'
import { AREA_LABEL, type Commit } from '@/lib/git/schema'
import { commitUrl, REPO } from '@/lib/site.config'
import styles from './page.module.css'

/**
 * THE BUILD RECORD — this interface's own history, drawn from its repository.
 *
 * TRACE promises "지나간 버전, 폐기된 시도, 바뀐 마음" and keeps that promise
 * with hand-written entries. This is the half nobody writes: every commit,
 * grouped into the phases the history itself declared, with each sha linked
 * to its diff. A build record whose claims cannot be checked is a claim.
 *
 * Zero client JavaScript. There is no state here, nothing to defer and
 * nothing to hydrate — the whole page is a projection of build-time data, so
 * making it interactive would cost weight and buy nothing.
 */


/** hreflang for one locale-free path, built from LOCALES so it cannot drift. */
const languages = (path: string) =>
  Object.fromEntries(
    LOCALES.map((l) => [LOCALE_META[l].lang, localePath(l, path)]),
  )

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const d = dict(lang)
  const path = '/build'
  return {
    title: 'BUILD',
    description: d.build.description,
    alternates: {
      canonical: localePath(lang, path),
      languages: languages(path),
    },
    openGraph: {
      type: 'website',
      locale: LOCALE_META[lang].og,
      url: localePath(lang, path),
      title: d.build.ogTitle,
      description: d.build.ogDescription,
    },
  }
}

const n = (v: number): string => v.toLocaleString('en-US')

/**
 * How many commit rows this page will draw.
 *
 * MEASURED, not guessed. Every route has a 24 KB gzip html budget, and this
 * page's rows compress to roughly 0.14 KB each once gzip has seen a few:
 *
 *     7 commits    7.7 KB   32% of budget
 *   150 commits   26.2 KB  112% of budget   <- build fails
 *
 * So an uncapped build record is a landmine that detonates in about a year
 * of ordinary committing, and it detonates as a failed deploy rather than as
 * a slow page. `deferred` exists in perf.budget.json for exactly this reason:
 * without a limit, "it just grows" becomes a place to hide unbounded weight.
 *
 * Eras are NEVER dropped — every phase keeps its header and its totals, so
 * the shape of the record stays complete. Only individual rows past the cap
 * are omitted, and the page says how many.
 */
const ROW_BUDGET = 90

/**
 * Bar length is LOG-scaled, for the same reason lib/field.ts positions by
 * rank instead of by raw date: one outlier otherwise eats the layout. The
 * first commit of this repository is an order of magnitude larger than a
 * later fix, and a linear bar would render every fix as an invisible sliver.
 */
function scaler(max: number): (v: number) => number {
  const ceiling = Math.log1p(Math.max(1, max))
  return (v) => (Math.log1p(Math.max(0, v)) / ceiling) * 100
}

function CommitRow({
  commit,
  width,
}: {
  commit: Commit
  /** Percentage of the bar track this commit's authored churn occupies. */
  width: number
}) {
  const churn = commit.insertions + commit.deletions
  // Split the row's own bar by its insertion/deletion ratio. A commit that
  // only deletes still gets a bar; it is simply all of one colour.
  const addShare = churn === 0 ? 0 : (commit.insertions / churn) * 100

  return (
    <li className={cx('settle', styles.row)}>
      <p className={cx('label', styles.rowMeta)}>
        <a
          href={commitUrl(commit.sha)}
          className={styles.sha}
          rel="noreferrer"
        >
          {commit.sha}
        </a>
        <time dateTime={commit.date}>{formatDate(commit.date)}</time>
      </p>

      <div className={styles.rowBody}>
        <p className={styles.subject} lang="en">
          {commit.subject}
        </p>

        <p className={cx('label', styles.areas)}>
          {commit.areas.map((a) => (
            <span key={a} className={styles.chip} data-area={a}>
              {AREA_LABEL[a]}
            </span>
          ))}
        </p>

        {/* The commits that produced the writing, linked to the writing.
            This is the join the repository can make and a CMS cannot. */}
        {commit.entries.length > 0 && (
          <p className={cx('small', styles.touched)}>
            <span className="label muted">이 커밋이 쓴 글</span>
            {commit.entries.map((e) => (
              <Link key={`${e.chapter}/${e.slug}`} href={`/${e.chapter}/${e.slug}`}>
                {e.chapter}/{e.slug}
              </Link>
            ))}
          </p>
        )}
      </div>

      <p className={cx('label', styles.rowStat)}>
        <span className={styles.churn}>
          <span className={styles.add}>+{n(commit.insertions)}</span>{' '}
          <span className={styles.del}>−{n(commit.deletions)}</span>
        </span>

        {/* Decorative: the numbers beside it say the same thing, exactly. */}
        <span className={styles.track} aria-hidden="true">
          <span className={styles.bar} style={{ inlineSize: `${width}%` }}>
            <span className={styles.barAdd} style={{ inlineSize: `${addShare}%` }} />
          </span>
        </span>

        <span className={cx('muted', styles.files)}>
          {commit.files}개 파일
          {commit.generated > 0 && ` · 생성물 ${n(commit.generated)}줄`}
        </span>
      </p>
    </li>
  )
}

export default function BuildPage() {
  const s = stats()
  const groups = eras()

  const widthOf = scaler(
    Math.max(
      1,
      ...groups.flatMap((era) =>
        era.commits.map((c) => c.insertions + c.deletions),
      ),
    ),
  )

  /*
   * Rows are spent newest-first, so the cap costs the OLDEST history its
   * detail rather than the most recent work.
   *
   * Written without a running accumulator on purpose: React Compiler rejects
   * reassigning a captured variable inside a render-phase callback, and it is
   * right to. Counting the commits in the eras before this one is equivalent
   * — allocation is greedy, so every earlier era was either drawn in full or
   * the budget was already exhausted.
   */
  const rendered = groups.map((era, i) => {
    const spent = groups
      .slice(0, i)
      .reduce((total, e) => total + e.commits.length, 0)
    const rows = era.commits.slice(0, Math.max(0, ROW_BUDGET - spent))
    return { era, rows, hidden: era.commits.length - rows.length }
  })
  const hiddenTotal = rendered.reduce((sum, g) => sum + g.hidden, 0)

  return (
    <>
      {/* Calm — arrival */}
      <section
        data-tone="light"
        data-density="calm"
        className={styles.head}
        aria-labelledby="build-title"
      >
        <div className="wrap">
          <p className={cx('label', styles.crumb)}>
            <Link href="/trace">← 04 / TRACE</Link>
            <span>BUILD</span>
          </p>

          <h1 id="build-title" className={cx('h1', 'arrive', styles.title)} lang="en">
            <DisplayLines lines={['How this', 'was built']} />
          </h1>

          <p className="lead measure">
            TRACE는 손으로 쓴 기록입니다. 이곳은 아무도 쓰지 않은 기록 —
            저장소가 스스로 남긴 것입니다. 커밋 하나하나가 실제 diff로
            연결되므로, 여기 적힌 숫자는 확인할 수 있는 주장입니다.
          </p>
        </div>
      </section>

      {/* Dense — the record */}
      <Section tone="dark" density="dense" index="—" title="BUILD">
        <div className={styles.body}>
          <div className="stack">
            <h2 className="h3">무엇을 언제 어떻게 지었는가</h2>

            <p className="small muted measure">
              막대와 <span className={styles.add}>+</span>
              <span className={styles.del}>−</span> 수치는 <strong>직접 쓴 줄만</strong>{' '}
              반영합니다. lockfile과 바이너리는 이 저장소 전체 삽입의 절반에
              가까워서, 함께 세면 <code>pnpm install</code>을 실행한 커밋이 가장 큰
              작업으로 보입니다. 산술적으로는 맞고 완전히 오해를 부르는 그림이라,
              따로 세되 숨기지 않았습니다.
            </p>

            {s.count > 0 ? (
              <dl className={cx('label', styles.readout)}>
                <div>
                  <dt>커밋</dt>
                  <dd>{n(s.count)}</dd>
                </div>
                <div>
                  <dt>기간</dt>
                  <dd>
                    {s.first === s.last
                      ? formatDate(s.first)
                      : `${formatDate(s.first)} — ${formatDate(s.last)}`}
                  </dd>
                </div>
                <div>
                  <dt>직접 쓴 줄</dt>
                  <dd>
                    <span className={styles.add}>+{n(s.insertions)}</span>{' '}
                    <span className={styles.del}>−{n(s.deletions)}</span>
                  </dd>
                </div>
                <div>
                  <dt>생성된 줄</dt>
                  <dd className="muted">{n(s.generated)}</dd>
                </div>
                <div>
                  <dt>출처</dt>
                  {/* The page states which of the two sources it was built
                      from, because they are not equally current and pretending
                      otherwise is the one thing a build record must not do. */}
                  <dd>
                    {s.source === 'live' ? 'LIVE GIT' : 'SNAPSHOT'} · {s.head}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="small muted">
                이 빌드는 저장소 기록에 접근할 수 없었습니다.
              </p>
            )}

            <p className={cx('small', 'muted', 'measure', styles.note)}>
              {s.source === 'snapshot' ? (
                <>
                  이 빌드는 커밋된 스냅샷
                  {s.generatedAt ? ` (${formatDate(s.generatedAt)})` : ''}을 읽었습니다.
                  스냅샷은 자신을 추가하는 커밋을 담을 수 없어 구조적으로 최소 한
                  커밋 뒤처집니다. CI가 얕은 클론을 하기 때문에, 잘린 기록을
                  완전한 것처럼 보여주는 대신 정직하게 뒤처진 기록을 씁니다.
                </>
              ) : (
                <>
                  이 빌드는 저장소를 직접 읽었습니다. 배포 환경에서 클론이 얕으면
                  잘린 기록을 완전한 것처럼 보여주는 대신 커밋된 스냅샷으로
                  전환합니다.
                </>
              )}{' '}
              <a href={REPO.url} rel="noreferrer">
                {REPO.owner}/{REPO.name} ↗
              </a>
            </p>
          </div>

          <div className={styles.eras}>
            {hiddenTotal > 0 && (
              <p className={cx('small', 'muted', styles.capped)}>
                최근 {n(ROW_BUDGET)}개 커밋만 개별 행으로 그립니다. 아래
                페이즈별 합계에는 생략된 {n(hiddenTotal)}개가 모두 포함되어
                있고, 전체는 저장소에서 볼 수 있습니다. 이 상한은 라우트당
                html 24 KB 예산에서 나온 실측값입니다.
              </p>
            )}

            {rendered.map(({ era, rows, hidden }) => (
              <section key={era.key} className={styles.era} aria-label={era.label}>
                <div className={styles.eraHead}>
                  <hr className="rule draw" />
                  <div className={styles.eraRow}>
                    <p className={cx('label', styles.eraLabel)}>{era.label}</p>
                    <p className={cx('label', 'muted', styles.eraStat)}>
                      {era.commits.length} COMMITS ·{' '}
                      <span className={styles.add}>+{n(era.insertions)}</span>{' '}
                      <span className={styles.del}>−{n(era.deletions)}</span>
                    </p>
                  </div>
                  {era.title && (
                    <p className={cx('h3', styles.eraTitle)} lang="en">
                      {era.title}
                    </p>
                  )}
                </div>

                <ol className={styles.rows}>
                  {rows.map((c) => (
                    <CommitRow
                      key={c.sha}
                      commit={c}
                      width={widthOf(c.insertions + c.deletions)}
                    />
                  ))}
                </ol>

                {hidden > 0 && (
                  <p className={cx('label', 'muted', styles.omitted)}>
                    + {n(hidden)}개 커밋 행 생략 · 위 합계에는 포함됨
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </Section>

      {/* Calm — departure */}
      <Section tone="light" density="calm">
        <hr className="ruleStrong" />
        <div className={styles.foot} style={{ marginBlockStart: 'var(--space-m)' }}>
          <Link href="/trace" className={styles.step}>
            <span className="label muted">← 04 손으로 쓴 기록</span>
            <span className="h3" lang="en">
              TRACE
            </span>
          </Link>
          <Link href="/make/personal-interface" className={cx(styles.step, styles.stepNext)}>
            <span className="label muted">이 제품의 결정들 →</span>
            <span className="h3" lang="en">
              THE CASE
            </span>
          </Link>
        </div>
      </Section>
    </>
  )
}
