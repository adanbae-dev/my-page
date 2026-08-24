#!/usr/bin/env node
/**
 * Contrast guard for the Inverted Duotone palette.
 *
 * Reads the real values out of styles/tokens.css, measures WCAG 2.2
 * contrast for every semantic role against the ground it sits on, and
 * fails if either:
 *
 *   1. a role no longer clears the minimum its job requires, or
 *   2. the ratio recorded in lib/tokens.data.ts has drifted from reality.
 *
 * (2) matters because the art-direction page prints those numbers to the
 * visitor. A design system that publishes its own contrast figures has to
 * be told when it starts lying.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TOKENS_CSS = join(ROOT, 'styles', 'tokens.css')
const TOKENS_DATA = join(ROOT, 'lib', 'tokens.data.ts')

/* --- WCAG 2.2 relative luminance ---------------------------------- */

const parseHex = (h) => {
  const s = h.trim().replace('#', '')
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const channel = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

const contrast = (a, b) => {
  const la = luminance(parseHex(a))
  const lb = luminance(parseHex(b))
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/* --- Extract declarations ----------------------------------------- */

const css = readFileSync(TOKENS_CSS, 'utf8')

/** All `--name: value` pairs found inside the first block matching `selector`. */
function declarationsIn(selector) {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`selector not found in tokens.css: ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  const body = css.slice(open + 1, close)
  const out = {}
  for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim()
  }
  return out
}

const primitives = declarationsIn(':root')

/** Resolve one level of `var(--x)` indirection against :root primitives. */
function resolve(value) {
  const m = /^var\(\s*--([\w-]+)\s*\)/.exec(value)
  if (!m) return value.split(/\s+/)[0].replace(/;$/, '')
  const target = primitives[m[1]]
  if (!target) throw new Error(`unresolved var(--${m[1]})`)
  return resolve(target)
}

const tones = {
  light: declarationsIn("[data-tone='light']"),
  dark: declarationsIn("[data-tone='dark']"),
}

/* --- The contract -------------------------------------------------- */

/** against: 'ground' | 'accent' — what this role is read on top of. */
const CHECKS = [
  { role: 'figure', min: 7.0, against: 'ground', note: 'body + headings (AAA)' },
  { role: 'muted', min: 4.5, against: 'ground', note: 'secondary text (AA)' },
  { role: 'accent', min: 3.0, against: 'ground', note: 'fills / non-text (SC 1.4.11)' },
  { role: 'accent-text', min: 4.5, against: 'ground', note: 'accent at body size (AA)' },
  { role: 'on-accent', min: 4.5, against: 'accent', note: 'text on the accent fill (AA)' },
  { role: 'focus', min: 3.0, against: 'ground', note: 'focus ring (SC 1.4.11)' },
]

/** Ratios published to visitors, scraped out of the data module. */
function recordedRatios() {
  const src = readFileSync(TOKENS_DATA, 'utf8')
  const out = { light: {}, dark: {} }
  for (const tone of ['light', 'dark']) {
    const start = src.indexOf(`${tone}: [`)
    if (start === -1) throw new Error(`no ${tone} block in tokens.data.ts`)
    const body = src.slice(start, src.indexOf('],', start))
    for (const m of body.matchAll(/role:\s*'([\w-]+)'\s*,\s*ratio:\s*([\d.]+)/g)) {
      out[tone][m[1]] = Number.parseFloat(m[2])
    }
  }
  return out
}

const recorded = recordedRatios()

/* --- Run ----------------------------------------------------------- */

let failed = 0
const line = (s) => process.stdout.write(s + '\n')

line('')
line('  CONTRAST GUARD — Inverted Duotone')
line('  ' + '-'.repeat(68))

for (const tone of ['light', 'dark']) {
  const map = tones[tone]
  const ground = resolve(map['ground'])
  line('')
  line(`  data-tone="${tone}"   ground ${ground}`)

  for (const check of CHECKS) {
    const raw = map[check.role] ?? primitives[check.role]
    if (!raw) {
      line(`  ✗ --${check.role.padEnd(12)} MISSING from tokens.css`)
      failed++
      continue
    }
    const value = resolve(raw)
    const base = check.against === 'accent' ? resolve(map['accent']) : ground
    const ratio = contrast(value, base)
    const ok = ratio >= check.min

    const rec = recorded[tone][check.role]
    const drift = rec === undefined ? null : Math.abs(rec - Number(ratio.toFixed(2)))
    const driftOk = drift === null || drift < 0.011

    if (!ok) failed++
    if (!driftOk) failed++

    const mark = ok && driftOk ? '✓' : '✗'
    const cell = `${ratio.toFixed(2)}:1`.padStart(8)
    line(
      `  ${mark} --${check.role.padEnd(12)} ${value.padEnd(9)} on ${base.padEnd(9)}` +
        `${cell}  min ${String(check.min).padEnd(4)} ${check.note}`,
    )
    if (rec === undefined) {
      line(`      ! not published in lib/tokens.data.ts`)
      failed++
    } else if (!driftOk) {
      line(
        `      ! lib/tokens.data.ts publishes ${rec.toFixed(2)}:1 — measured ${ratio.toFixed(2)}:1`,
      )
    }
  }
}

/* --- The theme-color bridge ---------------------------------------- */

// GROUND_HEX exists in TypeScript only because <meta name="theme-color">
// is resolved at build time. Verify it has not drifted from the stylesheet.
{
  const src = readFileSync(TOKENS_DATA, 'utf8')
  const block = src.slice(src.indexOf('GROUND_HEX'))
  line('')
  line('  GROUND_HEX bridge (lib/tokens.data.ts -> styles/tokens.css)')
  for (const tone of ['light', 'dark']) {
    const m = new RegExp(`${tone}:\\s*'(#[0-9a-fA-F]{3,8})'`).exec(block)
    const css = resolve(tones[tone]['ground']).toLowerCase()
    if (!m) {
      line(`  \u2717 ${tone.padEnd(6)} missing from GROUND_HEX`)
      failed++
      continue
    }
    const ts = m[1].toLowerCase()
    const ok = ts === css
    if (!ok) failed++
    line(`  ${ok ? '\u2713' : '\u2717'} ${tone.padEnd(6)} ${ts} ${ok ? '==' : '!='} --ground ${css}`)
  }
}

/* --- The WebGL fallback palette ------------------------------------- */

// The scene reads live custom properties; these literals are only its
// pre-mount fallback. Assert they are still the same four colours.
{
  const src = readFileSync(TOKENS_DATA, 'utf8')
  const block = src.slice(src.indexOf('SCENE_FALLBACK'))
  const lightTone = tones['light']
  line('')
  line('  SCENE_FALLBACK (lib/tokens.data.ts -> styles/tokens.css)')
  for (const role of ['ground', 'figure', 'accent', 'rule']) {
    const m = new RegExp(`${role}:\\s*'(#[0-9a-fA-F]{3,8})'`).exec(block)
    const css = resolve(lightTone[role]).toLowerCase()
    if (!m) {
      line(`  \u2717 ${role.padEnd(7)} missing from SCENE_FALLBACK`)
      failed++
      continue
    }
    const ts = m[1].toLowerCase()
    const ok = ts === css
    if (!ok) failed++
    line(`  ${ok ? '\u2713' : '\u2717'} ${role.padEnd(7)} ${ts} ${ok ? '==' : '!='} --${role} ${css}`)
  }
}

line('')
line('  ' + '-'.repeat(68))
if (failed > 0) {
  line(`  FAIL — ${failed} contrast violation${failed === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line('  PASS — every role clears its threshold and publishes it honestly.')
line('')
