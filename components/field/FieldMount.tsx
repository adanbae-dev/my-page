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
import { t } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionary'
import { detectWebGL, type WebGLSupport } from '@/lib/webgl'
import styles from './Field.module.css'

/**
 * Only the strings, not the dictionary.
 *
 * This whole subtree is a Client Component, so nothing here can call
 * `dict()` or read `next/root-params`. `Dictionary['field']` is a plain
 * object of strings, which serialises; the dictionary itself would not have
 * to, but passing the whole thing would ship every other locale's key names
 * into the client for no reason.
 */
export type FieldLabels = Dictionary['field']

type FieldProps = {
  data: readonly FieldDatum[]
  reduced: boolean
  labels: FieldLabels
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
export function FieldMount({
  data,
  labels,
}: {
  data: readonly FieldDatum[]
  labels: FieldLabels
}) {
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
          {shown ? labels.toList : labels.toSpace}
          <span aria-hidden="true">{shown ? '↑' : '↗'}</span>
        </button>

        <p className={cx('label', styles.readout)}>
          <span>{t(labels.records, { n: data.length })}</span>
          {bytes !== null && <span>+{(bytes / 1024).toFixed(0)} KB ON DEMAND</span>}
          {shown && fps !== null && <span>{fps} FPS</span>}
          {reduced && <span>REDUCED MOTION</span>}
          {support === 'no' && <span>NO WEBGL</span>}
        </p>
      </div>

      {state === 'loading' && (
        <p className={cx('small', styles.state)}>{labels.loading}</p>
      )}

      {state === 'failed' && (
        <p className={cx('small', styles.state)}>{labels.failed}</p>
      )}

      {state === 'unsupported' && (
        <p className={cx('small', styles.state)}>{labels.unsupported}</p>
      )}

      {shown && Field && (
        <>
          <Field
            data={data}
            reduced={reduced}
            labels={labels}
            onFps={setFps}
            onContextLost={() => setState('failed')}
          />
          <p className={cx('label', styles.note)}>
            {labels.note}{' '}
            {reduced ? labels.reducedNote : labels.pointerNote}
          </p>
        </>
      )}
    </div>
  )
}
