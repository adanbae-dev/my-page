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

**Where they are served from depends on the mode**, and the split is not
cosmetic. `next.config.ts` declares `headers()` for `next dev` only;
production serves them from `public/_headers`, generated from the same
`lib/csp.mjs` by `scripts/sync-headers.mjs`. `output: 'export'` cannot do
`headers()` and drops them with a warning rather than an error — see
[Deploying — Cloudflare](#deploying--cloudflare) for why that is the most
dangerous item on this page.

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

## Deploying — Cloudflare

Static export onto Workers Static Assets. Nothing runs at request time, which
is the same posture the `redirects()` note in `next.config.ts` describes: this
product refused a `proxy.ts` because it would put an edge function on every
request, and both of Cloudflare's server-side options for Next — **vinext**
(their current default recommendation) and **`@opennextjs/cloudflare`** —
reintroduce exactly that cost for a site where 100% of routes are already
prerendered.

### What the export cost

`output: 'export'` does not fail on the features it cannot do. It prints a
warning and drops them. Four things had to change, and the build refused to
proceed without the first three:

| | Problem | Fix |
|---|---|---|
| 1 | `Page "/[lang]/[...rest]" returned incomplete params` | catch-all deleted; a catch-all cannot enumerate URLs that do not exist |
| 2 | `dynamic = "force-static" not configured on route "/sitemap.xml"` | declared on `sitemap.ts`, `robots.ts`, `icon.tsx`, `opengraph-image.tsx` |
| 3 | 404 came out as the framework default, 6,999 bytes | `app/[lang]/404/page.tsx` + `scripts/sync-404.mjs` |
| 4 | `headers` and `redirects` silently dropped — **warning only** | `public/_headers` (generated) and `public/_redirects` |

Item 4 is the dangerous one. The build succeeds; the site ships with no
Content-Security-Policy; nothing says so.

### Why the 404 needed a route of its own

`out/404.html` is written from Next's built-in not-found, never from this
product's. The catch-all that used to cover an unmatched URL cannot be
exported at all, so `app/[lang]/404/page.tsx` renders the 404 as an ORDINARY
page instead.

Not via `notFound()`. Measured: a route that only calls `notFound()` exports
an HTML file whose `<body>` is **38 bytes** — `<div hidden><!--$--><!--/$--></div>`
— with every visible string present only inside the RSC payload in a
`<script>`. It renders blank with JavaScript off, which is the one thing this
product claims it does not do. As a plain page the body is 11,260 bytes of
server-rendered markup.

The markup lives in `components/NotFound.tsx` so that this route and
`app/[lang]/not-found.tsx` cannot drift.

Cloudflare's `not_found_handling: "404-page"` serves the **nearest**
`404.html`, searching upward, which makes the 404 bilingual for free:
`out/ko/404.html` answers `/ko/anything` and `out/en/404.html` answers
`/en/anything`. `scripts/sync-404.mjs` copies the default locale's copy to
`out/404.html` for a path with no locale in it, and **fails the build** if
that file is missing or too small to hold the rendered page.

### Why `_headers` is generated, not written

`check:release` imports `contentSecurityPolicy` from `lib/csp.mjs` and asserts
that the production policy has no `'unsafe-eval'` and does carry
`frame-ancestors`, `object-src`, `base-uri` and `upgrade-insecure-requests`.
A hand-copied CSP in `_headers` would leave that gate checking a string
nothing serves — passing while the deployed policy drifted.
`scripts/sync-headers.mjs` reads the same function, `pnpm build` runs it
first, and it fails on Cloudflare's limits (100 rules, 2,000 chars per line).

It also sets `Content-Type: image/png` for `/icon` and `/*/opengraph-image`.
`next/og` writes those as real PNGs **with no file extension** — confirmed
with `file --mime-type` on a real export — and a static host types a response
from its extension, so without those two rules the favicon and every social
card are served as an octet-stream and silently do not render.

### Why the export is build-only

`output: 'export'` set unconditionally also changes `next dev`. Measured:

| dev behaviour | unconditional | build-only |
|---|---|---|
| CSP header on a dev response | 0 | 1 |
| `/ko/nope` | 500 | 404 |
| warnings on dev start | 2 | 0 |

The 500 is `Page "/[lang]/[section]/page" is missing param ... required with
"output: export"`. So `output` is production-only and `headers`/`redirects`
are dev-only — each mode gets the half it can use, and no build prints a
warning it is meant to ignore.

One dev-only loss remains and is deliberate: with the catch-all gone, an
unmatched URL in `next dev` shows the framework 404 rather than this one.
`/ko/404` and `/en/404` are real routes, so the page is one click away.

### Deploying

The domain is **goldibug.com**, and half the setup is already done. Measured
with `dig`: the zone is on Cloudflare nameservers (`sima` and
`gordon.ns.cloudflare.com`) and holds **no records at all** — no A, AAAA,
CNAME, MX or TXT. Registration and zone creation are finished; nothing has
ever been served from it.

That empty state is what a Custom Domain wants. Cloudflare refuses to create
one "on a hostname with an existing CNAME DNS record", and there is none.

```bash
pnpm add -D wrangler                                        # done
npx wrangler login                                          # OAuth in the browser
npx wrangler whoami                                         # confirm the account

NEXT_PUBLIC_SITE_URL=https://goldibug.com pnpm build         # writes ./out
NEXT_PUBLIC_SITE_URL=https://goldibug.com pnpm check:release # must say READY
pnpm deploy                                                  # wrangler deploy
```

`wrangler login` opens a browser and grants the CLI a token through
Cloudflare's own screen — no API token is pasted into a terminal or a file.
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are the alternative and
are what CI would use; a token belongs in the CI secret store, never in this
repository.

`NEXT_PUBLIC_SITE_URL` is not optional. Unset, `check:release` reports 77
blockers — one for the variable and one per route with `localhost` baked into
its canonical URL. With a real origin the same gate reports **READY**.

`wrangler.jsonc` declares no Worker script: `assets.directory` is the whole
deployment, so asset requests never reach or bill for a Worker. Its `routes`
entry with `custom_domain: true` makes Cloudflare create the DNS record and
issue the certificate; nothing needs to be added by hand in the DNS tab.

### www, and why it is not in wrangler.jsonc

A Custom Domain matches the hostname **exactly**. A Worker on `goldibug.com`
does not receive `www.goldibug.com`, and adding both as Custom Domains would
publish the site at two canonical origins — which every `<link rel="canonical">`
on the site would then contradict.

So the apex is the site and www redirects to it. That is two things in the
dashboard, not in this repository:

1. **DNS** → add a **proxied** `AAAA` record for `www` pointing at `100::`.
   A placeholder address, proxied, so the request reaches Cloudflare's edge
   at all — there is nothing behind it.
2. **Rules → Redirect Rules** → `www.goldibug.com/*` → `https://goldibug.com/$1`,
   301, preserving path and query.

### Email

`docs/BRAND.md` §19-b says this site publishes no email address, and that
stays true of the pages. A domain mailbox is a separate thing and Cloudflare
does it on the same zone: **Compute → Email Service → Email Routing →
Onboard Domain**. It adds the MX record plus SPF and DKIM TXT records, and
forwards to a mailbox you already have, after that mailbox verifies itself
by clicking a link Cloudflare mails it.

It is **receive-only forwarding**. Sending *from* the address is a separate
feature and is not part of onboarding.

The MX and TXT records do not collide with the Worker's Custom Domain —
different record types on the same zone — so the order of the two does not
matter.

### Check on the first deploy

One thing is not verifiable locally. This export writes both
`out/ko/practice.html` and `out/ko/practice/` — the second holding the RSC
payload for client navigation — and Cloudflare's documentation does not cover
that shape. `html_handling: "auto-trailing-slash"` should serve the flat file
at `/ko/practice`; confirm it is a 200 and not a 307 loop.

| Request | Expected |
|---|---|
| `/` | 302 → `/ko` |
| `/ko/practice` | 200, not a redirect loop |
| `/ko/nope` | 404 with this site's 404, in Korean |
| `/en/nope` | 404 with this site's 404, in English |
| `/nope` | 404, Korean |
| `/icon` | `content-type: image/png` |
| any page | `content-security-policy` present |
| `/ko/feed.xml` | `application/atom+xml` |
| client navigation | the `.txt` RSC payload returns 200 |

If the last two rows fail, `trailingSlash: true` moves the export to
`out/ko/practice/index.html` and is the alternative — it changes the shape of
every internal link, so it is a decision, not a toggle.

---

## Open, deliberately

- **LIVE** is still a placeholder entry. What someone does outside work is
  the one thing only they can write.
- **Keyboard access to the WebGL field.** The list is the accessible path;
  roving tabindex over the bars is worth doing and is not done.
- **CrUX field data** — none, because the site has never been published.
  Re-measure LCP against a real origin and real throttling after deploy.
