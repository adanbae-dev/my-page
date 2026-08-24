'use client'

import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from 'react'

import { cx } from '@/lib/cx'
import type { FieldDatum } from '@/lib/field'
import { detectWebGL, type WebGLSupport } from '@/lib/webgl'
import styles from './Field.module.css'

type FieldProps = {
  data: readonly FieldDatum[]
  reduced: boolean
  onFps: (fps: number) => void
  onContextLost: () => void
}

type State = 'idle' | 'loading' | 'ready' | 'unsupported' | 'failed'

/**
 * `prefers-reduced-motion` is an external store, so it is read as one.
 *
 * The obvious version — read it in an effect and setState — makes React
 * render twice on every mount and is exactly what
 * `react-hooks/set-state-in-effect` warns about. useSyncExternalStore reads
 * it during render on the client, returns the safe default on the server,
 * and keeps up when the visitor changes the setting mid-visit.
 */
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

const readReducedMotion = () => window.matchMedia(REDUCED_QUERY).matches
const readReducedMotionOnServer = () => false

/**
 * The opt-in boundary for the only heavy thing in this product.
 *
 * Three.js and React Three Fiber are roughly the size of the entire rest of
 * the site. They are behind a button, behind a capability probe, and behind
 * a dynamic import — so a visitor who never asks pays nothing, and a visitor
 * whose browser cannot run it is told, rather than shown a blank rectangle.
 *
 * The list underneath is never removed. This view is an addition, not a
 * replacement: keyboard and screen-reader users always have the archive.
 */
export function FieldMount({ data }: { data: readonly FieldDatum[] }) {
  const [state, setState] = useState<State>('idle')
  const [support, setSupport] = useState<WebGLSupport>('unknown')
  const [Field, setField] = useState<ComponentType<FieldProps> | null>(null)
  const [bytes, setBytes] = useState<number | null>(null)
  const [fps, setFps] = useState<number | null>(null)
  const loading = useRef(false)

  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    readReducedMotionOnServer,
  )

  const open = useCallback(async () => {
    if (loading.current) return

    // Probed on click rather than on mount. Detection costs a throwaway
    // WebGL context, and contexts are a limited resource — spending one on
    // every page view to answer a question nobody asked is the wrong trade.
    const webgl = detectWebGL()
    setSupport(webgl)
    if (webgl === 'no') {
      setState('unsupported')
      return
    }

    loading.current = true
    setState('loading')

    const startedAt = performance.now()
    try {
      const mod = await import('./ArchiveField')
      // Measure what that import actually cost, in compressed bytes on the
      // wire. A showcase that cannot state its own weight is a demo.
      const downloaded = performance
        .getEntriesByType('resource')
        .filter(
          (e): e is PerformanceResourceTiming =>
            e.startTime >= startedAt && 'encodedBodySize' in e,
        )
        .reduce((sum, e) => sum + (e.encodedBodySize || 0), 0)
      setBytes(downloaded || null)
      setField(() => mod.default as ComponentType<FieldProps>)
      setState('ready')
    } catch {
      setState('failed')
    } finally {
      loading.current = false
    }
  }, [])

  const close = useCallback(() => setState('idle'), [])

  const shown = state === 'ready' && Field !== null
  const disabled = state === 'loading' || state === 'unsupported'

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <button
          type="button"
          className={cx('label', styles.toggle)}
          aria-pressed={shown}
          disabled={disabled}
          onClick={shown ? close : open}
        >
          {shown ? '목록으로' : '공간으로 보기'}
          <span aria-hidden="true">{shown ? '↑' : '↗'}</span>
        </button>

        <p className={cx('label', styles.readout)}>
          <span>{data.length} RECORDS</span>
          {bytes !== null && <span>+{(bytes / 1024).toFixed(0)} KB ON DEMAND</span>}
          {shown && fps !== null && <span>{fps} FPS</span>}
          {reduced && <span>REDUCED MOTION</span>}
          {support === 'no' && <span>NO WEBGL</span>}
        </p>
      </div>

      {state === 'loading' && (
        <p className={cx('small', styles.state)}>WebGL 씬을 불러오는 중…</p>
      )}

      {state === 'failed' && (
        <p className={cx('small', styles.state)}>
          씬을 불러오지 못했습니다. 아래 목록에 같은 기록이 전부 있습니다.
        </p>
      )}

      {state === 'unsupported' && (
        <p className={cx('small', styles.state)}>
          이 브라우저에서 WebGL을 쓸 수 없어 공간 보기를 열지 않았습니다.
          아래 목록에 같은 기록이 전부 있습니다.
        </p>
      )}

      {shown && Field && (
        <>
          <Field
            data={data}
            reduced={reduced}
            onFps={setFps}
            onContextLost={() => setState('failed')}
          />
          <p className={cx('label', styles.note)}>
            막대 하나가 기록 하나입니다. 높이는 분량, 안쪽 줄은 구간, 가로축은
            시간순. {reduced ? '모션 설정을 존중해 카메라는 고정돼 있습니다.' : '포인터를 움직이면 시점이 따라옵니다.'}
          </p>
        </>
      )}
    </div>
  )
}
