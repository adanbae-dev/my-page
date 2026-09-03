import type { NextConfig } from 'next'

import { contentSecurityPolicy } from './lib/csp.mjs'
import { DEFAULT_LOCALE } from './lib/i18n/config'

/**
 * `next dev` sets this to 'development' and `next build` to 'production'.
 *
 * The two config blocks below are DEV-ONLY, and the reason is mechanical:
 * `output: 'export'` does not support `headers` or `redirects` and does not
 * fail over them — it prints a warning and drops them. Leaving them declared
 * would put two ignored warnings on every single build, which is how a real
 * warning later goes unread. Their production counterparts are
 * `public/_headers` (generated) and `public/_redirects` (written).
 *
 * Keeping them in dev is not symmetry for its own sake. The dev server is
 * where a CSP violation is worth discovering, and `/` has to redirect
 * somewhere on localhost too.
 */
const dev = process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  /**
   * Static export — BUILD ONLY, and the split is measured rather than tidy.
   *
   * Every route in this product is already prerendered: `dynamicParams` is
   * false everywhere and the route handlers are `force-static`, so nothing
   * runs at request time. Exporting makes that explicit and lets the site be
   * served as plain assets, which is the posture the redirect note below
   * describes — no edge function on any request.
   *
   * Setting it unconditionally also changes `next dev`, which is not what
   * anyone wants. Measured on this repository:
   *
   *   Content-Security-Policy on a dev response   1 header  ->  0
   *   /ko/nope (a URL matching no entry)          404       ->  500
   *   warnings printed on every dev start         0         ->  2
   *
   * The 500 is `Page "/[lang]/[section]/page" is missing param ... which is
   * required with "output: export"`. Development is where a CSP violation is
   * worth catching and where a 404 should look like a 404, so the export and
   * the two config blocks it forbids are split by mode instead.
   *
   * See docs/PRODUCTION.md for the four things the export cost, each of
   * which the build refused to proceed without.
   */
  ...(dev ? {} : { output: 'export' as const }),

  reactStrictMode: true,
  poweredByHeader: false,

  // Phase 0 posture: fail the build on type errors rather than shipping a
  // portfolio with red squiggles in it. (Next 16 dropped the `eslint` key;
  // linting runs as its own `pnpm lint` step.)
  typescript: { ignoreBuildErrors: false },

  /**
   * `/` has no language, so it cannot render.
   *
   * A static redirect rather than a proxy.ts that reads Accept-Language:
   * this product's posture is that every route is prerendered with no runtime
   * cost, and a proxy turns every request into an edge function invocation.
   * What that gives up is automatic language detection — a visitor landing on
   * `/` gets Korean and can switch. Adding proxy.ts later changes nothing
   * else.
   */
  ...(dev && {
  async redirects() {
    return [
      { source: '/', destination: `/${DEFAULT_LOCALE}`, permanent: false },
      // The feed and the chapter paths were unprefixed before this change.
      { source: '/feed.xml', destination: `/${DEFAULT_LOCALE}/feed.xml`, permanent: true },
    ]
  },

  /**
   * Response headers. The policy itself lives in lib/csp.mjs so that the
   * release gate can assert, mechanically, that the production build never
   * ships 'unsafe-eval'.
   */
  async headers() {
    const csp = contentSecurityPolicy({
      dev: process.env.NODE_ENV !== 'production',
    })

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Content-hashed assets never change under the same name.
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
  }),
}

export default nextConfig
