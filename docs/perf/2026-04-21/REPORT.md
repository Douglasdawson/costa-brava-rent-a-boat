# Lighthouse Performance — 2026-04-21 (mobile, 4x CPU throttle)

Raw JSON per page: `home.json`, `boat-detail.json`, `blog-post.json`.

## Summary scores

| Page | Perf | LCP | FCP | TBT | CLS | Speed Index | TTI |
|------|------|-----|-----|-----|-----|-------------|-----|
| `/es/` | **45** | 8.7s | 8.7s | 480ms | 0 | 8.7s | 11.1s |
| `/es/boat/astec-480` | **34** | 9.1s | 5.1s | 1,280ms | 0 | 8.0s | 10.4s |
| `/es/blog/cuanto-cuesta-alquilar-barco-blanes-precios` | **34** | 9.3s | 5.9s | 1,250ms | 0 | 7.6s | 11.3s |

Brief's Apr 13 reference was **84 perf / 3.6s LCP**. Real measurement today is
far worse on every page. The gap is plausibly lab-vs-field (Lighthouse 4x
throttle is more punishing than PageSpeed's default mobile profile) — but the
absolute numbers still point to large pre-hydration and image-discovery
problems that deserve fixing regardless of scoring methodology.

## Root causes, highest leverage first

### 1. Detail-page LCP images are not preloaded (≈ 7s of wasted time)

Boat and blog pages:

| Subpart | Boat `astec-480` | Blog post |
|---|---|---|
| Time to first byte | 403ms | 755ms |
| **Resource load delay** | **7,099ms** | **7,091ms** |
| Resource load duration | 1,559ms | 1,421ms |
| Element render delay | 19ms | 25ms |

The LCP element (hero image) only starts downloading after React hydrates and
mounts the component that references it — because `seoInjector.injectMeta()`
at `server/seoInjector.ts:1346-1350` strips the hero image preload on every
non-home route, and nothing route-specific replaces it.

**Fix sketch:** in the same non-home branch, look up the page's hero image by
resource type and emit a `<link rel="preload" as="image" href="…" fetchpriority="high">`
before `</head>`. For boats and blog posts the resolver already has access to
`boat.imageGallery[0]` / `post.featuredImage`. Expected LCP win: 5–7s on
detail pages.

### 2. Home LCP is the H1 and waits for React hydration (≈ 8s render delay)

Home:

| Subpart | Value |
|---|---|
| Time to first byte | 629ms |
| **Element render delay** | **8,060ms** |

LCP element path: `1,HTML,1,BODY,5,DIV,1,DIV,1,MAIN,0,DIV,2,DIV,0,DIV,0,DIV,0,H1`.
The hero `<h1>` is inside `#root`, so it can only paint after React hydrates.
On throttled mobile, main-thread work is 10.6s total:

- Style & Layout: 3.1s
- Script Evaluation: 2.1s
- Rendering: 1.3s
- “Other”: 3.9s (mostly waiting on main thread)

JS breakdown (home):

- `vendor-react-CPSTkeCi.js`: 1,613ms (1,290ms scripting)
- `vendor-charts-D0iml1NC.js`: 94 KB transferred, **77 KB unused** — shouldn't
  be on the home critical path at all
- GTM + gtag: 164 KB transferred, 68 KB unused
- `vendor-ui`: 35 KB transferred, 28 KB unused

**Fix sketches:**
- Move charts out of the eager vendor chunk. It is only used by CRM/admin.
  `manualChunks` in `vite.config.ts` should split it into an async chunk.
- The home hero text could be server-rendered (noscript fallback already
  exists but lacks the translated H1). A pragmatic intermediate step: mark
  the H1 as a separately-prerendered fragment or inline its translated text
  into the SSR HTML template so FCP=LCP happens without waiting for React.

### 3. Cache / unused-JS hygiene (20–30% win on repeat visits)

Failing `uses-long-cache-ttl` on the blog post (pulled from the JSON) plus the
consistent 77 KB wasted in `vendor-charts` across every public page. A single
manual-chunk split fixes both the eager load and the cache miss on revisits.

## Recommended execution order for FIX #4

Re-prioritized using the real data, not the brief's a-priori A-F list:

1. **Preload detail-page LCP images in seoInjector** (biggest single win:
   ~6s of LCP on boat/blog/destination pages). Small, isolated change in
   `server/seoInjector.ts` — the resolver already has the image URL.
2. **Split `vendor-charts` (and likely other admin-only deps) out of the
   public bundle.** Edit `vite.config.ts` `build.rollupOptions.output.manualChunks`
   to make charts an on-demand chunk. Removes 77 KB of eager JS on every
   public page. Non-trivial because we need to verify no public component
   transitively imports `recharts`; if one does, fix that first.
3. **Inline translated H1 (or pre-rendered hero fragment) in SSR HTML for
   home.** Shrinks FCP/LCP gap on home from 8s to ~2s by letting the browser
   paint the H1 before React runs. Touches `seoInjector.injectMeta()` or the
   `<noscript>`-equivalent path.
4. (Anything else) only after re-measuring post-#1+#2+#3.

Items like preconnect, font-display, or further bundle tweaks (B, C, D in the
brief's original list) are low-single-digit-percent improvements compared to
the three root causes above. Worth revisiting only once LCP is below 4s.

## Artifacts

Raw reports for diffing after each fix:

- `docs/perf/2026-04-21/home.json`
- `docs/perf/2026-04-21/boat-detail.json`
- `docs/perf/2026-04-21/blog-post.json`
