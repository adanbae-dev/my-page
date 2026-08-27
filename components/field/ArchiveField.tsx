'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import type { FieldDatum } from '@/lib/field'
import { t } from '@/lib/i18n/config'
import type { FieldLabels } from './FieldMount'
import { SCENE_FALLBACK } from '@/lib/tokens.data'
import { SECTIONS } from '@/lib/sections'
import styles from './Field.module.css'

/**
 * THE FIELD — the archive as a space you move through.
 *
 * This is the only WebGL in the product and it earns its place by drawing
 * real data: one bar per entry, ordered chronologically along X, lanes by
 * chapter along Z, height by reading estimate. Nothing decorative is added.
 *
 * Everything below is loaded on demand. It is not in any route's first
 * paint, and `pnpm check:budget` holds it to its own deferred limit so that
 * "lazy" cannot quietly mean "unbounded".
 */

const LANE_GAP = 1.05
const SPAN = 7.4
const BAR = 0.42

/**
 * The scene reads its colours out of the live CSS custom properties rather
 * than repeating hex values. The duotone tokens stay the single source of
 * truth, so the 3D view cannot drift from the rest of the product — and it
 * inverts correctly if the section it sits in ever changes tone.
 */
function useSceneColors(host: HTMLElement | null) {
  return useMemo(() => {
    const read = (name: string, fallback: string) => {
      if (!host) return new THREE.Color(fallback)
      const v = getComputedStyle(host).getPropertyValue(name).trim()
      return new THREE.Color(v || fallback)
    }
    return {
      ground: read('--ground', SCENE_FALLBACK['ground']!),
      figure: read('--figure', SCENE_FALLBACK['figure']!),
      accent: read('--accent', SCENE_FALLBACK['accent']!),
      rule: read('--rule', SCENE_FALLBACK['rule']!),
    }
  }, [host])
}

type Colors = ReturnType<typeof useSceneColors>

function Bars({
  data,
  colors,
  hovered,
  onHover,
  onSelect,
}: {
  data: readonly FieldDatum[]
  colors: Colors
  hovered: number | null
  onHover: (i: number | null) => void
  onSelect: (i: number) => void
}) {
  const maxWeight = useMemo(
    () => Math.max(...data.map((d) => d.weight), 1),
    [data],
  )

  return (
    <group>
      {data.map((d, i) => {
        const h = 0.5 + (d.weight / maxWeight) * 1.9
        const x = (d.t - 0.5) * SPAN
        const z = (d.lane - (SECTIONS.length - 1) / 2) * LANE_GAP
        const isOn = hovered === i
        return (
          <mesh
            key={`${d.chapter}/${d.slug}`}
            position={[x, h / 2, z]}
            onPointerOver={(e) => {
              e.stopPropagation()
              onHover(i)
            }}
            onPointerOut={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(i)
            }}
          >
            <boxGeometry args={[BAR, h, BAR]} />
            <meshBasicMaterial color={isOn ? colors.accent : colors.figure} />
          </mesh>
        )
      })}
    </group>
  )
}

/**
 * Lane rules — the same hairline the rest of the product draws in CSS.
 *
 * All four lanes are one `lineSegments` rather than four `line` meshes: it
 * is a single draw call, and R3F's `<line>` collides with the SVG `line`
 * element in JSX's type space, which is a trap worth stepping around rather
 * than casting past.
 */
function Lanes({ colors }: { colors: Colors }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    SECTIONS.forEach((_, lane) => {
      const z = (lane - (SECTIONS.length - 1) / 2) * LANE_GAP
      points.push(
        new THREE.Vector3(-SPAN / 2 - 0.6, 0, z),
        new THREE.Vector3(SPAN / 2 + 0.6, 0, z),
      )
    })
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={colors.rule} />
    </lineSegments>
  )
}

/**
 * Camera drift.
 *
 * Under `prefers-reduced-motion` the camera is placed once and never moves
 * again — the field stays fully interactive, it simply stops moving on its
 * own. Reduced motion removes motion, not capability.
 */
/* eslint-disable react-hooks/immutability --
 * React Compiler is right in general and wrong here. `camera` is not React
 * state: it is a live three.js object the renderer owns, and R3F's entire
 * programming model is imperative mutation of that scene graph between
 * frames. Moving the camera by assigning to `camera.position` is the
 * supported API, not an escape from one — there is no setState equivalent
 * to migrate to. The rule stays enabled everywhere else in the codebase;
 * this is the one boundary where React's model and three.js's disagree.
 */
function Rig({ reduced }: { reduced: boolean }) {
  const { camera, pointer } = useThree()
  const target = useRef(new THREE.Vector3(0, 0.62, 0))

  useEffect(() => {
    camera.position.set(0, 2.5, 5.5)
    camera.lookAt(target.current)
  }, [camera])

  useFrame(() => {
    if (reduced) return
    const x = pointer.x * 1.4
    const y = 2.5 + pointer.y * 0.8
    camera.position.x += (x - camera.position.x) * 0.05
    camera.position.y += (y - camera.position.y) * 0.05
    camera.lookAt(target.current)
  })

  return null
}
/* eslint-enable react-hooks/immutability */

/** Frames per second, sampled once a second. */
function FpsProbe({ onSample }: { onSample: (fps: number) => void }) {
  const frames = useRef(0)
  const since = useRef(0)
  useFrame((state) => {
    frames.current += 1
    const t = state.clock.elapsedTime
    if (since.current === 0) since.current = t
    if (t - since.current >= 1) {
      onSample(Math.round(frames.current / (t - since.current)))
      frames.current = 0
      since.current = t
    }
  })
  return null
}

export default function ArchiveField({
  data,
  reduced,
  labels,
  onFps,
  onContextLost,
}: {
  data: readonly FieldDatum[]
  reduced: boolean
  labels: FieldLabels
  onFps: (fps: number) => void
  onContextLost: () => void
}) {
  const router = useRouter()
  const hostRef = useRef<HTMLDivElement>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => setHost(hostRef.current), [])
  const colors = useSceneColors(host)

  const select = useCallback(
    (i: number) => {
      const d = data[i]
      if (d) router.push(d.href)
    },
    [data, router],
  )

  const active = hovered === null ? null : data[hovered]
  const first = data[0]
  const last = data[data.length - 1]

  return (
    <div ref={hostRef} className={styles.stage}>
      <Canvas
        className={styles.canvas}
        dpr={[1, 1.75]}
        // The scene is static geometry with basic materials: rendering on
        // demand instead of every frame keeps an idle tab at zero GPU work.
        frameloop={reduced ? 'demand' : 'always'}
        gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
        onCreated={({ gl, scene }) => {
          scene.background = colors.ground
          // A lost context is normal — tab backgrounded, GPU reset, driver
          // recovery. Say so and fall back rather than leaving a dead canvas.
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            onContextLost()
          })
        }}
      >
        <Rig reduced={reduced} />
        <FpsProbe onSample={onFps} />
        <Lanes colors={colors} />
        <Bars
          data={data}
          colors={colors}
          hovered={hovered}
          onHover={setHovered}
          onSelect={select}
        />
      </Canvas>

      <div className={`label ${styles.axis}`} aria-hidden="true">
        {SECTIONS.map((s) => (
          <span key={s.id}>
            {s.index} {s.label}
          </span>
        ))}
      </div>

      {/* The readable half of the view lives in the DOM, not in the canvas:
          text drawn into WebGL is invisible to assistive technology and
          blurry at every scale the canvas is not. */}
      <div className={styles.hud} aria-live="polite">
        {active ? (
          <>
            <span className={styles.hudTitle}>{active.title}</span>
            <span className={`label ${styles.hudMeta}`}>
              {active.date} · {active.chapter.toUpperCase()}
              {active.meta ? ` · ${active.meta}` : ''}
            </span>
          </>
        ) : (
          <span className={`label ${styles.hudMeta}`}>
            {first && last
              ? `${
                  // A range whose ends are equal is not a range. Say the one
                  // date instead of printing it twice with a dash between.
                  first.date === last.date
                    ? first.date
                    : `${first.date} — ${last.date}`
                } · ${t(labels.records, { n: data.length })} · ${labels.hudHint}`
              : labels.noRecords}
          </span>
        )}
      </div>
    </div>
  )
}
