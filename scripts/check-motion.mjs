#!/usr/bin/env node
/**
 * Scroll-driven animation guard.
 *
 * The real hazard is not "an animation exists". It is **content that only
 * appears while an animation runs** — because a browser without scroll
 * timelines, or a visitor who asked for less motion, then looks at a page
 * with a hole in it. Nothing errors; the text is simply never there.
 *
 * So the rule is proportional to what the animation actually does:
 *
 *   every scroll-driven rule   must sit inside @supports (animation-timeline: …)
 *   rules whose from-state
 *   HIDES CONTENT              must additionally sit inside
 *                              @media (prefers-reduced-motion: no-preference)
 *
 * A from-state hides content when it sets opacity below 0.9 or clips with a
 * non-zero inset. A scroll-position indicator that grows from `scaleX(0)` —
 * a reading-progress hairline, a rule drawing itself — hides nothing, and
 * forcing it behind the motion gate would take a useful indicator away from
 * the very readers the gate exists to protect.
 *
 * Checked on the built CSS, because that is what a browser parses.
 * Run after `pnpm build`.
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const HTML = join(ROOT, '.next', 'server', 'app', 'index.html')
const line = (s) => process.stdout.write(s + '\n')

if (!existsSync(HTML)) {
  process.stderr.write('\n  No production build found. Run `pnpm build` first.\n\n')
  process.exit(1)
}

const hrefs = [
  ...readFileSync(HTML, 'utf8').matchAll(
    /<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g,
  ),
].map((m) => m[1])

const css = hrefs
  .map((h) => readFileSync(join(ROOT, '.next', h.replace('/_next', '')), 'utf8'))
  .join('\n')

/** from/0% block of a named keyframes, if it can be found. */
function fromState(name) {
  const at = css.indexOf(`@keyframes ${name}{`)
  if (at === -1) return null
  let depth = 0
  let end = at
  for (let i = css.indexOf('{', at); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  const body = css.slice(at, end)
  // The opening brace of the @keyframes block counts as a boundary too:
  // `@keyframes arrive{from{…}` has `{` before `from`, not `}` or start.
  const m = /[{}]\s*(?:from|0%)\s*\{([^}]*)\}/.exec(body)
  return m?.[1] ?? null
}

/** Does this from-state make content unreadable rather than merely unstyled? */
function hidesContent(decls) {
  if (!decls) return true // cannot prove it is safe; assume it is not
  const opacity = /opacity\s*:\s*([\d.]+)/.exec(decls)
  if (opacity && Number.parseFloat(opacity[1]) < 0.9) return true
  const clip = /clip-path\s*:\s*inset\(([^)]*)\)/.exec(decls)
  if (clip && clip[1].split(/\s+/).some((v) => (Number.parseFloat(v) || 0) > 0.5)) {
    return true
  }
  return false
}

/* --- Walk the braces, tracking the enclosing at-rule preludes ---------- */

const findings = []
const stack = []
let buf = ''

/** A declaration ends at `;` OR at the closing `}` — minified CSS omits the
 *  final semicolon, and checking only `;` silently skips the last
 *  declaration in every rule. That bug hid the reading-progress bar from an
 *  earlier version of this guard. */
function inspect(decl, context, selector) {
  if (!/animation-timeline\s*:/.test(decl)) return
  const nameMatch = /animation\s*:[^;]*?([A-Za-z_][\w-]*)\s*(?:;|$)/.exec(context.body)
  const name = nameMatch?.[1] ?? ''
  const from = fromState(name)
  const hides = hidesContent(from)
  const hasSupports = /@supports[^|]*animation-timeline/.test(context.stack)
  const hasMotion = /prefers-reduced-motion\s*:\s*no-preference/.test(context.stack)
  findings.push({ selector, name, hides, hasSupports, hasMotion })
}

let ruleBody = ''
for (let i = 0; i < css.length; i++) {
  const ch = css[i]
  if (ch === '{') {
    stack.push(buf.trim())
    buf = ''
    ruleBody = ''
    continue
  }
  if (ch === ';' || ch === '}') {
    const selector = stack[stack.length - 1] ?? '(unknown)'
    ruleBody += buf + ';'
    inspect(buf, { stack: stack.join(' | '), body: ruleBody }, selector)
    buf = ''
    if (ch === '}') {
      stack.pop()
      ruleBody = ''
    }
    continue
  }
  buf += ch
}

/* --- Report ------------------------------------------------------------ */

line('')
line('  SCROLL-DRIVEN MOTION GUARD')
line('  ' + '-'.repeat(70))

let failed = 0
if (findings.length === 0) {
  line('  no scroll-driven animations found')
}

for (const f of findings) {
  const needsMotion = f.hides
  const ok = f.hasSupports && (!needsMotion || f.hasMotion)
  if (!ok) failed++
  const what = f.hides ? 'hides content' : 'indicator only'
  line(
    `  ${ok ? '✓' : '✗'} ${(f.name || '(unnamed)').padEnd(18)} ${what.padEnd(16)} ${f.selector.slice(0, 30)}`,
  )
  if (!f.hasSupports) line('      ✗ not inside @supports (animation-timeline: …)')
  if (needsMotion && !f.hasMotion) {
    line('      ✗ from-state hides content but is not inside')
    line('        @media (prefers-reduced-motion: no-preference)')
  }
}

line('  ' + '-'.repeat(70))
if (failed > 0) {
  line(`  FAIL — ${failed} unsafe scroll-driven animation${failed === 1 ? '' : 's'}`)
  line('      Content that only appears when an animation runs is content that')
  line('      disappears for anyone the animation does not run for.')
  line('')
  process.exit(1)
}
line(`  PASS — ${findings.length} scroll-driven animation${findings.length === 1 ? '' : 's'}, each gated for what it actually does.`)
line('')
