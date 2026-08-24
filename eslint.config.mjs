import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

/**
 * Flat config. `core-web-vitals` already bundles the base Next rules plus
 * next/typescript, and promotes the perf-sensitive rules from warn to error
 * — which is the right posture for a product whose premise is that the
 * person who built it knows how to build it.
 */
const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'scripts/**'] },
  ...nextCoreWebVitals,
  {
    rules: {
      // Raw colour values are forbidden outside styles/tokens.css. The
      // stylesheet is the palette; components speak only in roles.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3}){1,2}$/]",
          message:
            'No raw hex in components. Use a semantic role token (--figure, --accent, …) from styles/tokens.css.',
        },
      ],
    },
  },
  {
    // The one sanctioned bridge between the stylesheet and the type system.
    // It may hold literals precisely because `pnpm check:contrast` asserts
    // they still match styles/tokens.css on every run.
    files: ['lib/tokens.data.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
]

export default config
