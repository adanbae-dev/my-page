#!/usr/bin/env node
/**
 * The figures' geometry, measured on the built markup.
 *
 * WHY THIS EXISTS. Every other gate here checks numbers: that an aggregate
 * re-derives from its rows, that a colour clears its contrast threshold, that
 * a sentence's percentage is a value the data holds. None of them can see a
 * chart. A figure whose arithmetic is perfect can still ship with two labels
 * on top of each other, or a label off the right edge, or a mark outside its
 * own viewBox — and on a page of nine server-rendered figures nobody is going
 * to notice by looking, because there is nothing to look at until it is
 * built.
 *
 * IT CAUGHT SOMETHING ON ITS FIRST RUN. The rate-ladder figure indexes each
 * bundle to its own list price, which is the honest question and also means
 * both curves converge on the same number at the right-hand end — 86% of list
 * at 6,000 households. Both series were direct-labelled at their last point.
 * So the two labels sat on each other and one ran past the frame. The fix was
 * to label at the first rung, where the curves are 233 points apart; the
 * check is what turned an invisible defect into a build failure.
 *
 * WHAT IT CANNOT DO. Text width is estimated from character count, because
 * the real answer needs the font. The estimate is deliberately generous
 * (0.58em per character against a variable face that averages nearer 0.5), so
 * it reports collisions that are not quite collisions rather than missing
 * ones that are. A false alarm here costs a label nudge; a miss ships a
 * broken figure.
 *
 * Run after `pnpm build`.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const line = (s) => process.stdout.write(s + '\n')
const problems = []

/**
 * Routes whose figures are built as markup rather than drawn by a script.
 *
 * /portfolio/bi-dashboard IS ABSENT ON PURPOSE and the gap is worth naming.
 * Its charts are React elements rendered in the browser after the data
 * arrives, so the built HTML holds no geometry for this gate to measure —
 * there is nothing in `out/` to read. What protects that page instead is the
 * compiler: its marks are JSX with hashed CSS Module classes, so a class
 * that stops existing is a type error rather than a silent no-op, which is
 * the failure this gate exists to catch on the string-built figures. Label
 * collisions there are not covered by anything, and that is a real hole
 * rather than a solved problem.
 */
const PAGES = [
  'ko/portfolio/revenue.html',
  'en/portfolio/revenue.html',
  'ko/portfolio/districts.html',
  'ko/portfolio/prices.html',
  'ko/portfolio/renewal.html',
  'ko/portfolio/direct.html',
]

/** Slack, in user units. A hairline may sit on the frame. */
const EDGE = 2

/**
 * Type metrics, read from the built stylesheet rather than assumed.
 *
 * THE FIRST VERSION ASSUMED, and reported a defect that was not there. It
 * read `text-anchor` and `font-size` off the SVG element's attributes and
 * fell back to `start` and 9px — but DirectScatter sets both in CSS, so its
 * correlation label came out 75 units wide anchored the wrong way and looked
 * like it ran off the frame. It is comfortably inside.
 *
 * A gate cannot know a figure's geometry from its markup when the markup
 * styles itself through a class. So the class is looked up, the same way
 * scripts/check-contrast.mjs parses the stylesheet instead of trusting the
 * token file. Keyed by the LAST class in each selector, which covers both
 * hashed CSS Module names on real elements and the bare `:global` names on
 * markup built into strings at build time.
 */
function typeMetrics() {
  /* Discovered, not named. Turbopack emits stylesheets under chunks/ with
     hashed filenames, and a path written by hand here would go stale on the
     next bundler change without the gate failing — it would simply find no
     rules and measure everything at its fallback, which is the version of
     this check that reported a defect that was not there. */
  const dir = join(ROOT, 'out', '_next', 'static')
  const byClass = new Map()
  if (!existsSync(dir)) return byClass
  const files = []
  const walk = (at) => {
    for (const e of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith('.css')) files.push(full)
    }
  }
  walk(dir)
  for (const f of files) {
    const css = readFileSync(f, 'utf8')
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const body = m[2]
      const size = /font-size:\s*([\d.]+)px/.exec(body)?.[1]
      const anchor = /text-anchor:\s*(start|middle|end)/.exec(body)?.[1]
      if (!size && !anchor) continue
      for (const sel of m[1].split(',')) {
        const classes = [...sel.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((c) => c[1])
        const key = classes[classes.length - 1]
        if (!key) continue
        const cur = byClass.get(key) ?? {}
        if (size) cur.size = +size
        if (anchor) cur.anchor = anchor
        byClass.set(key, cur)
      }
    }
  }
  return byClass
}

const METRICS = typeMetrics()
if (METRICS.size === 0) {
  process.stderr.write('\n  x no built CSS under out/_next/static — run pnpm build first\n\n')
  process.exit(1)
}

/**
 * Attributes win over the stylesheet, which is how SVG resolves them too.
 *
 * `known` matters more than the values. When neither the markup nor the
 * stylesheet says how a label is anchored, this gate does not get to guess:
 * assuming `start` for a label that is actually `end` shifts it a full label
 * width to the right and invents an overflow, which is exactly the false
 * alarm the first version of this file raised. An unanchored label is
 * therefore measured in all three positions and only reported if it leaves
 * the frame in every one of them.
 */
function resolve(attrs) {
  const classes = /class="([^"]*)"/.exec(attrs)?.[1]?.split(/\s+/) ?? []
  let size = 9
  let anchor = 'start'
  let known = false
  for (const c of classes) {
    const hit = METRICS.get(c)
    if (!hit) continue
    if (hit.size !== undefined) { size = hit.size; known = true }
    if (hit.anchor !== undefined) { anchor = hit.anchor; known = true }
  }
  const attrAnchor = /text-anchor="(\w+)"/.exec(attrs)?.[1]
  const attrSize = /font-size="([\d.]+)/.exec(attrs)?.[1]
  if (attrAnchor) anchor = attrAnchor
  if (attrSize) size = +attrSize
  return { size, anchor, known: known || Boolean(attrAnchor) || Boolean(attrSize) }
}

let svgCount = 0
let textCount = 0
let unstyled = 0

for (const rel of PAGES) {
  const path = join(ROOT, 'out', rel)
  if (!existsSync(path)) {
    process.stderr.write(`\n  x out/${rel} is missing — run pnpm build first\n\n`)
    process.exit(1)
  }
  const html = readFileSync(path, 'utf8')
  const svgs = [
    ...html.matchAll(/<svg[^>]*viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*>([\s\S]*?)<\/svg>/g),
  ]
  if (!svgs.length) problems.push(`${rel}: viewBox 를 가진 svg 가 없습니다`)

  svgs.forEach(([, w, h, body], k) => {
    svgCount++
    const W = +w
    const H = +h
    const where = `${rel} svg#${k} (${W}×${H})`

    /* --- 1. every mark inside its own frame ------------------------- */
    const outside = []
    for (const m of body.matchAll(/<(rect|circle|use|line)\b([^>]*)>/g)) {
      const [, tag, attrs] = m
      const at = (n) => {
        const hit = new RegExp(`${n}="(-?[\\d.]+)"`).exec(attrs)
        return hit ? +hit[1] : null
      }
      const box = []
      if (tag === 'rect') {
        const x = at('x')
        const y = at('y')
        if (x !== null && y !== null) box.push([x, y], [x + (at('width') ?? 0), y + (at('height') ?? 0)])
      } else if (tag === 'circle') {
        const x = at('cx')
        const y = at('cy')
        const r = at('r') ?? 0
        if (x !== null && y !== null) box.push([x - r, y - r], [x + r, y + r])
      } else if (tag === 'line') {
        box.push([at('x1'), at('y1')], [at('x2'), at('y2')])
      } else {
        box.push([at('x'), at('y')])
      }
      for (const [x, y] of box) {
        if (x === null || y === null) continue
        if (x < -EDGE || x > W + EDGE || y < -EDGE || y > H + EDGE) outside.push(`${tag}(${x},${y})`)
      }
    }
    if (outside.length) {
      problems.push(`${where}: ${outside.length}개 마크가 프레임 밖 — ${outside.slice(0, 3).join(', ')}`)
    }

    /* --- 2. labels: collisions, and the frame ----------------------- */
    const texts = [...body.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)].map((m) => {
      const attrs = m[1]
      const at = (n) => {
        const hit = new RegExp(`${n}="(-?[\\d.]+)"`).exec(attrs)
        return hit ? +hit[1] : null
      }
      const { size, anchor, known } = resolve(attrs)
      if (!known) unstyled++
      const label = m[2].replace(/&[a-z]+;|&#\d+;/g, 'x')
      const width = label.length * size * 0.58
      const x = at('x') ?? 0
      const boxFor = (a) => {
        const left = a === 'end' ? x - width : a === 'middle' ? x - width / 2 : x
        return [left, left + width]
      }
      const [x0, x1] = boxFor(anchor)
      /* Every position this label could be in, when nothing says which. */
      const spans = known ? [[x0, x1]] : ['start', 'middle', 'end'].map(boxFor)
      return { x0, x1, spans, y: at('y') ?? 0, label, size }
    })
    textCount += texts.length

    const hits = []
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i]
        const b = texts[j]
        /* Same baseline, within four fifths of a line. Two labels a full line
           apart are stacked, not colliding. */
        if (Math.abs(a.y - b.y) > Math.max(a.size, b.size) * 0.8) continue
        if (a.x1 > b.x0 + 1 && b.x1 > a.x0 + 1) hits.push(`"${a.label}" / "${b.label}"`)
      }
    }
    if (hits.length) {
      problems.push(`${where}: 라벨 ${hits.length}쌍이 겹칩니다 — ${hits.slice(0, 3).join(' · ')}`)
    }

    /* Off the frame in EVERY position it could occupy. A label whose anchor
       is stated is checked in the one place it actually sits. */
    const off = texts.filter((t) =>
      t.spans.every(([a, b]) => b > W + EDGE || a < -EDGE),
    )
    if (off.length) {
      problems.push(
        `${where}: 라벨 ${off.length}개가 프레임을 벗어납니다 — ${off.slice(0, 3).map((t) => `"${t.label}"`).join(', ')}`,
      )
    }
  })
}

line('')
line('  FIGURE GEOMETRY')
line('  ' + '-'.repeat(70))
line(`  ${PAGES.length} routes · ${svgCount} figures · ${textCount} labels · ${METRICS.size} styled classes read`)
if (unstyled) {
  line(`  ${unstyled} labels carried no size or anchor anywhere — measured at 9px, start`)
}
line('  ' + '-'.repeat(70))
if (problems.length) {
  for (const p of problems) line(`  ✗ ${p}`)
  line('')
  line(`  FAIL — ${problems.length} problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line('  PASS — 모든 마크가 프레임 안에 있고, 겹치는 라벨이 없습니다.')
line('')
