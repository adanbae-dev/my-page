# Production — Phase 4

Everything a published site needs, and a gate that refuses to let it out
half-finished.

---

## Measured

Lighthouse, mobile, navigation mode, against the production build:

| Route | A11y | Best Practices | SEO | Agentic |
|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 |
| `/trace` | 100 | 100 | 100 | 100 |

51 audits passed, 0 failed, on both.

Performance trace of `/`: **LCP 179 ms** (TTFB 28 ms, render delay 151 ms),
**CLS 0.00**. Measured on localhost with no throttling, so treat the LCP as a
best case — the CLS is not, and zero is the number that matters there.

Weight, per route, gzip:

```
✓ shared    174.8 KB /   178.0 KB   framework + shared app code, every route
✓ route       1.7 KB /     6.0 KB   worst single route
✓ deferred  228.9 KB /   240.0 KB   Three.js, behind a button
✓ font       88.0 KB /    97.7 KB
```

## The Korean typeface question, closed

Open since Phase 0. Settled by measurement rather than preference.

Bundling Noto Sans KR through `next/font/google`:

| | before | with Korean webfont |
|---|---|---|
| font | 88.0 KB | **113.5 KB — 116% of budget** |
| css | 5.4 KB | **57.4 KB** |
| total | 271 KB | **351 KB** |
| woff2 on disk | 90 KB | **3.7 MB** across ~100 subset files |

The CSS explosion is the part that is easy to miss: `next/font` emits one
`@font-face` rule per unicode-range subset, and Hangul has about a hundred.

**Decision: no bundled Korean webfont.** Korean falls through to the platform
grotesk — Pretendard where a reader has it, then Apple SD Gothic Neo, then
Malgun Gothic. Latin display type, which is where the art direction actually
lives, keeps Archivo.

## SEO and syndication

Everything is derived from the content, so nothing can drift:

- `app/sitemap.ts` — built from `publishedEntries()`. A new entry is in the
  sitemap the moment it exists; a hand-kept list would break on the first one
  someone forgot.
- `app/robots.ts`
- `app/feed.xml/route.ts` — Atom, prerendered (`force-static`). Dates are
  pinned to **UTC noon**, not midnight: a midnight timestamp lands on the
  previous day in any reader west of GMT that formats it locally.
- `metadataBase` + per-route `canonical` and OpenGraph.
- JSON-LD: `WebSite` + `Person` on the shell, `Article` on every entry. Output
  is escaped for `</script>` — a title containing that sequence would
  otherwise close the tag.

### OG image and icon

`app/opengraph-image.tsx` renders the duotone layout with the accent block,
using **font subsets fetched at build time**. Google's CSS API subsets to the
exact glyphs via `text=`, which turns a multi-megabyte Hangul family into a
few kilobytes; the request deliberately sends an old User-Agent, because a
modern one returns woff2 and Satori cannot parse it.

The fetch returns `null` rather than throwing. An OG image is worth having in
a fallback face; it is not worth failing a build over a network hiccup.

`app/icon.tsx` is pure geometry — the accent block itself — so it needs no
font and cannot fail to render. At 16 px a letterform in this face would be
unreadable anyway.

## Headers

CSP, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`,
`Permissions-Policy`, HSTS, and immutable caching for content-hashed assets.

`style-src` carries `'unsafe-inline'` and that is a real, stated concession:
React emits inline styles for the few dynamic values this product sets, and
nonce-ing them would mean giving up static prerendering on every route.
Scripts get no exemption beyond Next's own bootstrap.

## The release gate

`pnpm check:release` is deliberately **not** part of `pnpm verify`. `verify`
answers "is the code correct?" and should be green all day. The gate answers
"is this allowed to be published?"

It reads the **built output**, not the source, because what ships is the
output — a canonical URL that is right in the config and wrong in the HTML is
still wrong. It checks:

- the author's name is no longer `[name]`
- `NEXT_PUBLIC_SITE_URL` is set and is a public https origin
- sitemap, robots and feed exist in the build
- every page has a title, a meta description and a canonical link
- **no localhost URL is baked into any shipped HTML** — the classic
  "worked on my machine" deploy, which crawlers happily follow to nothing
- remaining placeholder entries (warning, not a blocker)

With a real origin supplied, 15 of the 16 blockers clear immediately. **One
remains, and only the author can clear it:**

```
✗ site.name is still the placeholder "[name]" — set NAME in lib/site.config.ts
```

That is the correct final state for this handover. The gate is not broken; it
is doing the one job nobody else can do.

## Open, deliberately

- **LIVE** is still a placeholder entry. What someone does outside work is
  the one thing only they can write.
- **Keyboard access to the WebGL field.** The list is the accessible path;
  roving tabindex over the bars is worth doing and is not done.
- **CrUX field data** — none, because the site has never been published.
  Re-measure LCP against a real origin and real throttling after deploy.
