import type { MetadataRoute } from 'next'

import { url } from '@/lib/site.config'

/**
 * `force-static` is required, not a hint.
 *
 * With `output: 'export'` the build REFUSES to collect this route without
 * it: "export const dynamic = \"force-static\"/export const revalidate not
 * configured on route ... with \"output: export\"". Nothing here reads the
 * request, so declaring it costs nothing and the build says so plainly.
 */
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: url('/sitemap.xml'),
    host: url('/'),
  }
}
