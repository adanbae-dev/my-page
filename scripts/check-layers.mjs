#!/usr/bin/env node
/**
 * Cascade-layer order guard.
 *
 * CSS layer order is established by FIRST APPEARANCE, not by where the
 * ordering statement sits in your source tree. If a bundler emits a
 * `@layer components { … }` block into the stylesheet before
 * `@layer reset, tokens, …;` is parsed, the declared order is silently
 * discarded and rebuilt from whatever appeared first — which can invert the
 * whole system so that the reset outranks component styles.
 *
 * That failure is invisible: nothing errors, nothing warns, a handful of
 * declarations just stop applying. This asserts, on the real built CSS in
 * link order, that:
 *
 *   1. the first @layer token is the ordering statement, and
 *   2. it declares exactly the expected order, and
 *   3. no CSS Module smuggled itself back into a layer.
 *
 * Run after `pnpm build`.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const EXPECTED = ['reset', 'tokens', 'base', 'layout', 'utilities']

/**
 * The entry document to read.
 *
 * `app/index.html` was correct until the tree moved under `app/[lang]/`;
 * there is no unprefixed home page any more. Discovered rather than named,
 * for the same reason check-budget.mjs discovers routes: a path written by
 * hand is a path that goes stale silently, and this gate failing open would
 * be worse than it failing loudly.
 */
function findEntryHtml(dir) {
  for (const candidate of ['ko.html', 'index.html']) {
    const p = join(dir, candidate)
    if (existsSync(p)) return p
  }
  const stack = [dir]
  while (stack.length) {
    const current = stack.pop()
    for (const e of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, e.name)
      if (e.isDirectory()) stack.push(full)
      else if (e.name.endsWith('.html') && !e.name.startsWith('_')) return full
    }
  }
  return null
}

const APP_DIR = join(ROOT, '.next', 'server', 'app')
const HTML = findEntryHtml(APP_DIR)
if (!HTML || !existsSync(HTML)) {
  process.stderr.write('\n  No production build found. Run `pnpm build` first.\n\n')
  process.exit(1)
}

// Concatenate the stylesheets in the order the document links them: that is
// the order the browser's parser will see.
const html = readFileSync(HTML, 'utf8')
const hrefs = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g)].map(
  (m) => m[1],
)
if (hrefs.length === 0) {
  process.stderr.write('\n  No stylesheets linked from /. Did the build change?\n\n')
  process.exit(1)
}

const line = (s) => process.stdout.write(s + '\n')
let failed = 0

line('')
line('  CASCADE LAYER GUARD')
line('  ' + '-'.repeat(64))
for (const h of hrefs) line(`    ${h}`)
line('  ' + '-'.repeat(64))

const css = hrefs
  .map((h) => readFileSync(join(ROOT, '.next', h.replace('/_next', '')), 'utf8'))
  .join('\n')

// First @layer token, statement or block.
const first = /@layer\s+([^{;]+)([{;])/.exec(css)
if (!first) {
  line('  ✗ no @layer found in the built CSS at all')
  process.exit(1)
}

const isStatement = first[2] === ';'
const names = first[1].split(',').map((s) => s.trim()).filter(Boolean)

if (!isStatement) {
  line(`  ✗ first @layer is a BLOCK (@layer ${names[0]} { … }), not the ordering statement.`)
  line(`      Layer order was rebuilt from emission order — "${names[0]}" is now the`)
  line('      lowest-priority layer. styles/layers.css must be parsed first.')
  failed++
} else {
  line('  ✓ first @layer token is the ordering statement')
}

if (isStatement) {
  const ok = names.length === EXPECTED.length && names.every((n, i) => n === EXPECTED[i])
  if (ok) {
    line(`  ✓ declared order: ${names.join(' < ')}`)
  } else {
    line(`  ✗ declared order ${names.join(', ')}`)
    line(`      expected      ${EXPECTED.join(', ')}`)
    failed++
  }
}

// CSS Modules must stay unlayered so they outrank every global rule.
const layered = [...css.matchAll(/@layer\s+([A-Za-z-]+)\s*\{/g)].map((m) => m[1])
const unexpected = [...new Set(layered)].filter((n) => !EXPECTED.includes(n))
if (unexpected.length) {
  line(`  ✗ unexpected layer block(s): ${unexpected.join(', ')}`)
  line('      CSS Modules must stay unlayered — see any *.module.css header.')
  failed++
} else {
  line('  ✓ no CSS Module re-entered a cascade layer')
}

line('  ' + '-'.repeat(64))
if (failed) {
  line(`  FAIL — ${failed} layer problem${failed === 1 ? '' : 's'}`)
  line('')
  process.exit(1)
}
line('  PASS — cascade order is what the source says it is.')
line('')
