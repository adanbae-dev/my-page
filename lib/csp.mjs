/**
 * Content Security Policy.
 *
 * Lives in its own module, in plain ESM, so that `next.config.ts` and
 * `scripts/check-release.mjs` read the SAME function. The rule that
 * `'unsafe-eval'` must never reach production is then machine-checked
 * rather than merely intended — a comment saying "dev only" is not a
 * mechanism.
 *
 * Two concessions are real and stated rather than hidden:
 *
 *  script-src 'unsafe-inline'  Next inlines its bootstrap and the flight
 *                              payload into every prerendered page. Nonces
 *                              would require rendering each request
 *                              dynamically, which would give up static
 *                              prerendering on every route.
 *  style-src  'unsafe-inline'  React emits inline styles for the few dynamic
 *                              values this product sets. Same trade.
 *
 *  script-src 'unsafe-eval'    DEVELOPMENT ONLY. React's dev build uses
 *                              eval() to reconstruct call stacks and drive
 *                              other debugging features; without it the dev
 *                              server logs a console error on every load.
 *                              React never uses eval() in production.
 */
export function contentSecurityPolicy({ dev = false } = {}) {
  const script = ["'self'", "'unsafe-inline'"]
  const connect = ["'self'"]

  if (dev) {
    script.push("'unsafe-eval'")
    // Hot reload talks over a websocket to the dev server.
    connect.push('ws:', 'wss:')
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `script-src ${script.join(' ')}`,
    `connect-src ${connect.join(' ')}`,
  ]

  // Pointless on http://localhost and it breaks nothing to omit it there.
  if (!dev) directives.push('upgrade-insecure-requests')

  return directives.join('; ')
}
