import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DisplayLines } from '@/components/DisplayLines'
import { JsonLd } from '@/components/JsonLd'
import { Section } from '@/components/Section'
import { Sigil } from '@/components/Sigil'
import { cx } from '@/lib/cx'
import { isLocale, localePath, t, type Locale } from '@/lib/i18n/config'
import { breadcrumbSchema, pageMetadata } from '@/lib/seo'
import { dict } from '@/lib/i18n/dictionary'
import { formatDate } from '@/lib/format'
import { publishedEntries } from '@/lib/content/load'
import { heaviest, KB, PCT, perf, PERF_KEYS } from '@/lib/perf'
import { commits, eras, stats } from '@/lib/git/load'
import { AREA_LABEL, type Commit } from '@/lib/git/schema'
import { sigilFrom, SIGIL_SLOTS } from '@/lib/sigil'
import { commitUrl, REPO, site } from '@/lib/site.config'
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



export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const d = dict(lang)
  const path = '/build'
  return pageMetadata({
    lang,
    path,
    title: 'BUILD',
    description: d.build.description,
  })
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
 * LOWERED 90 -> 64. The cap was set when this page was lighter, and it had
 * quietly become unreachable: at 52 commits the page measures 21.45 KB of a
 * 23.4 KB budget, which leaves 1.95 KB, which at ~0.13 KB a row is about
 * fifteen more commits. The html gate would have failed the build at roughly
 * 67 commits — before the cap ever engaged. A limit that cannot be reached
 * before the thing it protects against happens is not a limit; it is a
 * comment.
 *
 * The page grew because it now publishes two things it did not: the generated
 * mark and the site's own measured weight. Both were measured before being
 * kept — the weight readout costs 0.20 KB gzip here, which was worth checking
 * because two guesses about where the kilobyte went were both wrong.
 *
 * 64 has no meaning beyond fitting; it is not the sigil's 64 slots wearing a
 * different hat.
 *
 * Eras are NEVER dropped — every phase keeps its header and its totals, so
 * the shape of the record stays complete. Only individual rows past the cap
 * are omitted, and the page says how many.
 */
const ROW_BUDGET = 64

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
  locale,
  live,
}: {
  commit: Commit
  /** Percentage of the bar track this commit's authored churn occupies. */
  width: number
  /**
   * REQUIRED, and required for the same reason lib/field.ts made it required:
   * every route on this site lives under /{lang}, so a link built without it
   * is a 404. This row's entry links were exactly that — `/make/personal-
   * interface` returned 404, measured — and the type is the only thing that
   * makes forgetting it impossible rather than merely unlikely.
   */
  locale: Locale
  /**
   * Entry keys (`chapter/slug`) that still exist.
   *
   * A commit's entry list is a fact about the past and stays in the record
   * whatever happens to the file afterwards. But `live/placeholder` was
   * deleted during this project's own history, and the row went on linking to
   * it — measured: /ko/live/placeholder returned 404 from this page. So the
   * reference survives as text and only a readable entry becomes a link. The
   * record keeps its claim; it just stops pretending you can follow it.
   */
  live: ReadonlySet<string>
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
              live.has(`${e.chapter}/${e.slug}`) ? (
                <Link
                  key={`${e.chapter}/${e.slug}`}
                  href={localePath(locale, `/${e.chapter}/${e.slug}`)}
                >
                  {e.chapter}/{e.slug}
                </Link>
              ) : (
                <span key={`${e.chapter}/${e.slug}`} className={styles.gone}>
                  {e.chapter}/{e.slug}
                </span>
              )
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

export default async function BuildPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = dict(lang)

  const s = stats()
  /* Folded here as well as inside <Sigil>, so the legend can name the numbers
     it is describing. Two passes over 64 slots is not worth an API that makes
     every caller thread geometry through its props. */
  const mark = sigilFrom(commits())
  /* Built once and threaded down, rather than looked up per row: the answer is
     identical for every row and the lookup reads the whole content tree. */
  const weight = perf()
  const worst = heaviest()
  const live: ReadonlySet<string> = new Set(
    publishedEntries(lang).map((e) => `${e.chapter}/${e.slug}`),
  )
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
      <JsonLd
        data={breadcrumbSchema(lang, [
          { name: site.title, path: '/' },
          { name: 'BUILD', path: '/build' },
        ])}
      />

      {/* Calm — arrival */}
      <section
        data-tone="light"
        data-density="calm"
        className={styles.head}
        aria-labelledby="build-title"
      >
        <div className="wrap">
          <p className={cx('label', styles.crumb)}>
            <Link href={localePath(lang, '/trace')}>← 04 / TRACE</Link>
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

            {mark.count > 0 && (
              <div className={styles.sigilBlock}>
                <Sigil spin label={d.sigil.label} className={styles.sigilMark} />
                <div className={styles.sigilText}>
                  <p className="label">{d.sigil.heading}</p>
                  <p className="small muted measure">
                    {t(d.sigil.legend, {
                      remaining: mark.remaining,
                      used: mark.used,
                      slots: SIGIL_SLOTS,
                      count: mark.count,
                    })}
                  </p>
                </div>
              </div>
            )}

            {weight && worst && (
              <div className={styles.sigilBlock}>
                <p className="label">{d.weight.heading}</p>
                {/* MEASURED, because the first guess was wrong. Trimming the
                    seven-row breakdown to three saved 0.2 KB gzip: rows are
                    near-identical markup and gzip eats them. The cost was the
                    prose — Next embeds the RSC payload in the same document, so
                    every Korean sentence here is paid for twice, and unique
                    Hangul compresses badly. So the breakdown stays, because it
                    is the informative part and it is nearly free, and the
                    explanatory paragraph went instead. */}
                <dl className={cx('label', styles.readout)}>
                  {PERF_KEYS.map((k) => {
                    const limit = weight.budgets[k]
                    return (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>
                          {KB(worst.weight[k])} KB
                          {limit === undefined
                            ? ''
                            : ` / ${KB(limit)} · ${PCT(worst.weight[k], limit)}%`}
                        </dd>
                      </div>
                    )
                  })}
                  <div>
                    <dt>{d.weight.shared}</dt>
                    <dd>{KB(weight.shared)} KB</dd>
                  </div>
                  <div>
                    <dt>{d.weight.deferred}</dt>
                    <dd>{KB(weight.deferred)} KB</dd>
                  </div>
                </dl>
                <p className={cx('label', 'muted')}>
                  {t(d.weight.heaviest, { route: worst.route })} ·{' '}
                  {t(d.weight.measured, { date: weight.generatedAt, head: weight.head })}
                </p>
              </div>
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
                      locale={lang}
                      live={live}
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
          <Link href={localePath(lang, '/trace')} className={styles.step}>
            <span className="label muted">← 04 손으로 쓴 기록</span>
            <span className="h3" lang="en">
              TRACE
            </span>
          </Link>
          <Link
            href={localePath(lang, '/make/personal-interface')}
            className={cx(styles.step, styles.stepNext)}
          >
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
