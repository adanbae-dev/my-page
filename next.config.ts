import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Phase 0 posture: fail the build on type errors rather than shipping a
  // portfolio with red squiggles in it. (Next 16 dropped the `eslint` key;
  // linting runs as its own `pnpm lint` step.)
  typescript: { ignoreBuildErrors: false },
}

export default nextConfig
