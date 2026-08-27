import type { NextConfig } from 'next'

import { contentSecurityPolicy } from './lib/csp.mjs'
import { DEFAULT_LOCALE } from './lib/i18n/config'

const nextConfig: NextConfig = {
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
}

export default nextConfig
