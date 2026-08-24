/**
 * Dates are formatted by hand rather than through Intl.
 *
 * Every page is prerendered at build time and hydrated in an unknown
 * timezone. Passing an ISO date through `new Date()` shifts it across the
 * midnight boundary for anyone west of the build machine, which silently
 * renames "2026-08-24" to the 23rd. Splitting the string cannot drift.
 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${y}.${m}.${d}`
}

export function formatYear(iso: string): string {
  return iso.slice(0, 4)
}
