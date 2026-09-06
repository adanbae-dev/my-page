#!/usr/bin/env node
/**
 * Cartogram invariants.
 *
 * A tile cartogram fails in ways nothing else on this site fails in, and all
 * of them are silent — the grid still renders, it is just wrong:
 *
 *   two tiles on one cell   one division draws over another and vanishes
 *   a tile off the grid     it is simply not painted, with no error
 *   a code with no name     the cell renders its two-letter abbreviation and
 *                           a screen reader announces nothing useful
 *   a value with no source  a number on a page with nothing behind it, which
 *                           is the one thing this site is built not to ship
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(ROOT, 'lib', 'cartogram.data.ts'), 'utf8')

const out = []
const line = (s) => out.push(s)
const problems = []

const rows = Number(/export const GRID_ROWS = (\d+)/.exec(src)?.[1])
const cols = Number(/export const GRID_COLS = (\d+)/.exec(src)?.[1])
if (!rows || !cols) problems.push('could not read GRID_ROWS / GRID_COLS')

const tiles = [
  ...src.matchAll(/\{ code: '(\d+)', abbr: '([^']+)', row: (\d+), col: (\d+) \}/g),
].map((m) => ({ code: m[1], abbr: m[2], row: Number(m[3]), col: Number(m[4]) }))

if (tiles.length === 0) problems.push('no tiles parsed from lib/cartogram.data.ts')

/* 1. One tile per cell, and every tile on the grid. */
const seen = new Map()
for (const t of tiles) {
  if (t.row >= rows || t.col >= cols) {
    problems.push(`${t.abbr} sits at (${t.row},${t.col}), outside the ${rows}x${cols} grid`)
  }
  const cell = `${t.row},${t.col}`
  if (seen.has(cell)) {
    problems.push(`${t.abbr} and ${seen.get(cell)} both claim cell (${cell}) — one would draw over the other`)
  }
  seen.set(cell, t.abbr)
}

/* 1b. Every row is a contiguous run of columns.
      A hole inside the shape makes the cartogram read as scattered tiles
      rather than a country — the outline a reader recognises comes from the
      tiles touching. This is the invariant that keeps a future edit from
      quietly reintroducing one. */
{
  const byRow = new Map()
  for (const t of tiles) {
    if (!byRow.has(t.row)) byRow.set(t.row, [])
    byRow.get(t.row).push(t.col)
  }
  for (const [row, cols] of [...byRow].sort((a, b) => a[0] - b[0])) {
    const sorted = [...cols].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        problems.push(`row ${row} skips column ${sorted[i - 1] + 1} — a hole inside the shape`)
      }
    }
  }
}

/* 2. Codes are unique. A duplicate silently drops a division from the map. */
const byCode = new Map()
for (const t of tiles) {
  if (byCode.has(t.code)) problems.push(`code ${t.code} used twice (${byCode.get(t.code)}, ${t.abbr})`)
  byCode.set(t.code, t.abbr)
}

/* 3. Every code has a name in EVERY locale. A missing one renders the
      two-letter abbreviation to a screen reader, which is not a name. */
const LOCALES = ['ko', 'en']
for (const loc of LOCALES) {
  const dict = readFileSync(join(ROOT, 'lib', 'i18n', 'dictionaries', `${loc}.ts`), 'utf8')
  const block = /divisions: \{[\s\S]*?\n      \},/.exec(dict)?.[0]
  if (!block) {
    problems.push(`${loc}.ts has no portfolio.cartogram.divisions block`)
    continue
  }
  for (const t of tiles) {
    if (!new RegExp(`'${t.code}':`).test(block)) {
      problems.push(`${loc}.ts — no name for division ${t.code} (${t.abbr})`)
    }
  }
  const named = [...block.matchAll(/'(\d+)':/g)].map((m) => m[1])
  for (const code of named) {
    if (!byCode.has(code)) problems.push(`${loc}.ts names division ${code}, which is not on the grid`)
  }
}

/* 4. Every value layer is complete, sourced, and adds up.

      Checked per layer, not once: the second layer was added months after the
      first and a check written for "the value layer" would have kept passing
      while the new one went unverified. */
const layers = [...src.matchAll(/const ([A-Z_0-9]+): ValueLayer = \{([\s\S]*?)\n\}/g)]
if (layers.length === 0) {
  notes.push('no value layers — the grid renders as labels only')
}
for (const [, name, body] of layers) {
  const codes = [...body.matchAll(/'(\d+)':\s*[\d_.]+/g)].map((m) => m[1])
  for (const t of tiles) {
    if (!codes.includes(t.code)) problems.push(`${name} has no entry for ${t.abbr} (${t.code})`)
  }
  for (const key of ['name:', 'url:', 'license:']) {
    if (!body.includes(key)) {
      problems.push(`${name} is missing source.${key.slice(0, -1)} — a number with no source is a rumour`)
    }
  }
  if (!/total:/.test(body)) problems.push(`${name} does not declare a total (a number, or null when summing is meaningless)`)
  const declared = /total: ([\d_]+)/.exec(body)?.[1]
  if (declared) {
    /* CHECKSUM. These numbers are sums this repository computed over
       thousands of published rows; nothing about them is self-evident. A
       mistyped digit still draws a map, one bar is just the wrong height. */
    const want = Number(declared.replace(/_/g, ''))
    const got = [...body.matchAll(/'\d+':\s*([\d_.]+)/g)].reduce(
      (a, m) => a + Number(m[1].replace(/_/g, '')),
      0,
    )
    if (Math.abs(got - want) > 0.5) {
      problems.push(`${name} values add up to ${got.toLocaleString()} but total says ${want.toLocaleString()}`)
    }
  }
}

line('')
line('  CARTOGRAM')
line('  ' + '-'.repeat(70))
line(`  ${tiles.length} tiles on a ${rows}x${cols} grid · ${seen.size} cells used`)
line(`  value layers: ${layers.length} · ${layers.map((l) => l[1]).join(', ')}`)
for (const p of problems) line(`  ✗ ${p}`)
line('  ' + '-'.repeat(70))
if (problems.length) {
  line(`  FAIL — ${problems.length} cartogram problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.stdout.write(out.join('\n') + '\n')
  process.exit(1)
}
line('  PASS — every tile has a cell, a code and a name in both locales.')
line('')
process.stdout.write(out.join('\n') + '\n')
