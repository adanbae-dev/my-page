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

/**
 * The ONLY external origin this policy admits.
 *
 * Cloudflare Web Analytics is how this site learns which pages are read and
 * how many people arrive in a day. Its beacon is injected at the edge, so it
 * arrives as a script this site did not write and `script-src 'self'` refuses
 * it.
 *
 * WHY THIS IS A HOLE WORTH OPENING, STATED PLAINLY. It is a third-party
 * script on every page. The trade is that the alternative — a first-party
 * beacon posting to a Worker on `/api/*`, which `connect-src 'self'` already
 * permits — means building and operating an analytics system, and this site
 * needs a page-view count, not an analytics product.
 *
 * WHAT KEEPS IT FROM GROWING. `pnpm check:release` asserts that the set of
 * external origins in the production policy is EXACTLY this one. A second
 * host cannot be added without that gate failing, which is the whole point:
 * the first exception is a decision, and every one after it would be a
 * habit.
 *
 * `connect-src` deliberately gets nothing. Under Cloudflare's AUTOMATIC
 * injection the beacon reports to the site's own domain, which `'self'`
 * already covers. Manual embedding would report to `cloudflareinsights.com`
 * and need a second hole — so automatic injection is not a convenience here,
 * it is the reason the second hole stays shut.
 *
 * A CSP that blocks the beacon does NOT remove it: the script tag is still
 * injected and still fetched. Blocking it is therefore the worst of both —
 * visitors pay for the request and no data arrives. That is why this is
 * opened rather than left to fail quietly.
 *
 * HOST ONLY, NO PATH — and that is not laziness.
 *
 * Cloudflare's own documentation says to allow
 * `.../beacon.min.js`. Measured against the live site, what it actually
 * serves is
 *
 *   https://static.cloudflareinsights.com/beacon.min.js/v31edd6df95cf4e85…
 *
 * a VERSIONED path. In CSP a source whose path does not end in `/` must
 * match the URL path exactly, so `/beacon.min.js` does not match
 * `/beacon.min.js/v31edd…`. The first version of this constant carried the
 * documented path and the browser refused the script:
 *
 *   Loading the script … violates the following Content Security Policy
 *   LOADING FAILED: csp
 *
 * Caught in a real browser, not by reading. `curl` never saw it, because
 * Cloudflare only injects the beacon for requests that look like a browser —
 * three checks with a default curl User-Agent all reported no beacon at all
 * and led to the wrong conclusion twice.
 *
 * A trailing slash would also work for today's URL and would break the day
 * Cloudflare serves the unversioned file again. The host is the stable
 * thing, so the host is what is allowed.
 */
export const ANALYTICS_SCRIPT = 'https://static.cloudflareinsights.com'

export function contentSecurityPolicy({ dev = false } = {}) {
  const script = ["'self'", "'unsafe-inline'"]
  const connect = ["'self'"]

  /* Production only. The dev server has no beacon to load, and admitting the
     host there would put an external origin in the policy that developers
     read most often. */
  if (!dev) script.push(ANALYTICS_SCRIPT)

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
