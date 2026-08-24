import Link from 'next/link'

import { SECTIONS } from '@/lib/sections'
import { cx } from '@/lib/cx'

export const metadata = { title: 'Not found' }

export default function NotFound() {
  return (
    <section data-tone="light" data-density="calm" style={{ minBlockSize: '80svh' }}>
      <div className="wrap stack" style={{ paddingBlock: 'var(--section-y)' }}>
        <p className="label muted">404</p>
        <h1 className="h1" lang="en">
          Nothing <span className="accentBlock">here</span>
        </h1>
        <p className="lead measure">
          이 주소에는 아무것도 없습니다. 아래 네 구간이 이 사이트의 전부입니다.
        </p>
        <ul role="list" className={cx('label')} style={{ display: 'flex', gap: 'var(--space-m)', flexWrap: 'wrap' }}>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link href={`/${s.id}`}>
                {s.index} {s.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="label">
          <Link href="/">← Golden path</Link>
        </p>
      </div>
    </section>
  )
}
