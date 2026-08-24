import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Phase 0 posture: fail the build on type errors rather than shipping a
  // portfolio with red squiggles in it. (Next 16 dropped the `eslint` key;
  // linting runs as its own `pnpm lint` step.)
  typescript: { ignoreBuildErrors: false },

  /**
   * Response headers.
   *
   * The CSP is deliberately strict about where code may come from and
   * refuses to be framed. `'unsafe-inline'` on style-src is required: React
   * emits inline styles for the few dynamic values this product sets (the
   * motion sweep duration), and nonce-ing them would mean giving up static
   * prerendering for every route. Scripts get no such exemption beyond what
   * Next's own inline bootstrap needs.
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      'upgrade-insecure-requests',
    ].join('; ')

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
