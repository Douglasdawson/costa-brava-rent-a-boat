# SEO Ranking Improvement — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move from average Google position 17 to top 5 by enriching landing pages with 1500+ words of content and implementing Playwright-based prerendering so Google indexes full HTML immediately.

**Architecture:** Two-phase approach: (1) Enrich existing landing pages with rich, keyword-targeted content and add new English-first landing pages, (2) Implement build-time prerendering with Playwright that crawls the running app and saves static HTML files, served by Express middleware before falling back to SPA behavior.

**Tech Stack:** React (existing), Playwright (new dev dependency), Express middleware, existing i18n/SEO systems.

**Design doc:** `docs/plans/2026-03-21-seo-ranking-improvement-design.md`

---

## Phase 1: Enrich Landing Pages

The existing location-blanes.tsx has ~500 words across short card sections. Competitors have 600-1000 words on simpler pages. We need 1500+ words of unique, geographically-rich content per page to rank for target keywords.

### Task 1: Enrich location-blanes.tsx (Primary target: "alquiler barco blanes", pos 11)

**Files:**
- Modify: `client/src/pages/location-blanes.tsx`
- Modify: `client/src/i18n/es.ts` (Spanish translations)
- Modify: `client/src/i18n/en.ts` (English translations)

This is the highest-priority page. Currently ~389 lines with ~500 words. Target: 800+ lines with 1500+ words.

**Step 1: Add new content sections to location-blanes.tsx**

Add these sections BETWEEN the existing "Why Choose Blanes" card and the "Key Destinations" card:

**Section A — "Nuestra Flota en el Puerto de Blanes"** (new)
- H2 with Anchor icon
- Grid of boat cards (pull from `boatData.ts`) showing: name, capacity, license requirement, price range
- Each card links to `/barco/{slug}`
- ~200 words of intro text about the fleet

**Section B — "Guia Completa: Alquilar un Barco en Blanes"** (new)
- H2 with Ship icon
- Subsections with H3s:
  - "Requisitos para navegar sin licencia" — age, briefing, included items
  - "Temporada y horarios" — April-October, morning/afternoon slots
  - "Que incluye el alquiler" — fuel (sin licencia only), insurance, safety equipment, snorkel gear
  - "Como reservar" — WhatsApp, online form, same-day availability
- ~400 words total

**Section C — "Precios del Alquiler de Barcos en Blanes 2026"** (new)
- H2 with pricing table
- Simple responsive table: boat name | capacity | low season price | high season price
- Text explaining seasons (April-June/Sep-Oct = low, July = mid, August = high)
- Link to `/precios` for full details
- ~200 words

**Section D — "Experiencias Populares desde Blanes"** (new)
- H2 with Sun icon
- Cards for: Snorkel en Cala Brava, Sunset cruise, Excursion a Tossa, Pesca
- Each links to the corresponding activity page
- ~200 words

Add these translations to `es.ts` and `en.ts` under `locationPages.blanes.sections`.

**Step 2: Add 3 more FAQ items to the faqSchema**

Add to the existing `faqSchema.mainEntity` array:
```typescript
{
  "@type": "Question",
  "name": "¿Cuál es la mejor epoca para alquilar un barco en Blanes?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "La temporada va de abril a octubre. Junio y septiembre ofrecen los mejores precios y menos afluencia. Agosto es temporada alta con las mejores condiciones de mar pero precios más altos."
  }
},
{
  "@type": "Question",
  "name": "¿Se puede alquilar un barco en Blanes el mismo día?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "Sí, aceptamos reservas de último momento si hay disponibilidad. Contacta por WhatsApp al +34 611 500 372 para comprobar disponibilidad el mismo día."
  }
},
{
  "@type": "Question",
  "name": "¿Es seguro navegar sin licencia desde Blanes?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "Sí. Nuestros barcos sin licencia tienen un máximo de 15CV, no requieren titulación y navegan cerca de la costa. Incluimos formación de seguridad de 15 minutos, chalecos salvavidas y equipo de emergencia."
  }
}
```

**Step 3: Verify page renders correctly**

Run: `npm run dev`
Navigate to `http://localhost:5000/alquiler-barcos-blanes`
Expected: All new sections visible, translations working, no console errors.

**Step 4: Commit**

```bash
git add client/src/pages/location-blanes.tsx client/src/i18n/es.ts client/src/i18n/en.ts
git commit -m "feat(seo): enrich Blanes landing page with 1500+ words of content and 7 FAQ items"
```

---

### Task 2: Create boat-rental-blanes.tsx (Target: "boat rental blanes", pos ~12)

**Files:**
- Create: `client/src/pages/boat-rental-blanes.tsx`
- Modify: `client/src/App.tsx` (add route)
- Modify: `client/src/utils/seo-config.ts` (add SEO config)
- Modify: `server/seoInjector.ts` (add static meta for `/boat-rental-blanes`)

English-first landing page for international tourists searching "boat rental blanes". This is NOT a duplicate of location-blanes — it's written from an English tourist's perspective with different content focus (travel logistics, what to expect, pricing in context).

**Step 1: Create the page component**

Follow the exact pattern from `location-blanes.tsx` but:
- All content in English (hardcoded, NOT using translation system — this is an English-only page)
- H1: "Boat Rental in Blanes — Costa Brava, Spain"
- Different content sections:
  - "Why Rent a Boat in Blanes?" — port advantages, proximity to Barcelona (70km), local atmosphere
  - "Our Fleet" — boat grid with prices in EUR, capacity, license info
  - "No License Required" — explanation for international tourists unfamiliar with Spanish regulations
  - "Top Routes from Blanes" — Cala Brava, Lloret, Tossa with times and descriptions
  - "Pricing 2026" — table with low/high season
  - "How to Book" — WhatsApp, online, same-day availability
  - "Getting to Blanes" — from Barcelona airport, train, car
  - "FAQ" — 5 questions common from English-speaking tourists
  - CTA + Map
- Use `SEO` component with `en`-specific meta tags
- Canonical: `/boat-rental-blanes`
- Hreflang: link to `/alquiler-barcos-blanes` as `es` alternate
- JSON-LD: TouristDestination + FAQPage + BreadcrumbList

**Step 2: Register route in App.tsx**

```typescript
// Add lazy import (with other location pages, around line 39-67)
const BoatRentalBlanesPage = lazy(() => import("@/pages/boat-rental-blanes"));

// Add route (with other location routes, around line 382-432)
<Route path="/boat-rental-blanes">
  {() => <Suspense fallback={<SecondaryRouteFallback />}><BoatRentalBlanesPage /></Suspense>}
</Route>
```

**Step 3: Add SEO config entry**

In `client/src/utils/seo-config.ts`, add `boatRentalBlanes` key to the `en` language config:
```typescript
boatRentalBlanes: {
  title: "Boat Rental Blanes | No License Needed | From €70/h — Costa Brava",
  description: "Rent a boat in Blanes, Costa Brava. No boating license required. 9 boats for 4-12 people. From €70/hour. Explore hidden coves, snorkel spots & coastal villages.",
  keywords: "boat rental blanes, rent a boat blanes, boat hire costa brava, no license boat rental spain",
  ogTitle: "Boat Rental in Blanes — Costa Brava, Spain",
  ogDescription: "No license needed. Rent a boat from Blanes port and explore the Costa Brava coastline. From €70/hour."
}
```

Also add `boatRentalBlanes` to the `es` config (pointing users to the Spanish version):
```typescript
boatRentalBlanes: {
  title: "Alquiler de Barcos en Blanes | Sin Licencia desde 70€/h",
  description: "Alquila un barco en Blanes sin licencia. 9 embarcaciones para 4-12 personas. Desde 70€/hora. Explora calas, snorkel y pueblos costeros.",
  keywords: "alquiler barco blanes, barco sin licencia blanes",
  ogTitle: "Alquiler de Barcos en Blanes — Costa Brava",
  ogDescription: "Sin licencia necesaria. Alquila un barco desde el Puerto de Blanes."
}
```

Add the page key to `generateHreflangLinks` and `generateCanonicalUrl` URL mappings.

**Step 4: Add static meta to seoInjector.ts**

In `server/seoInjector.ts`, add `/boat-rental-blanes` to the `STATIC_META` object with the en/es meta data matching seo-config.ts.

**Step 5: Add cross-linking**

In `location-blanes.tsx`, add a link in the "Related Services" card:
```tsx
<a href="/boat-rental-blanes" className="text-primary hover:underline flex items-center gap-1">
  <ChevronRight className="w-4 h-4" />
  Boat Rental in Blanes (English)
</a>
```

In `boat-rental-blanes.tsx`, add a link:
```tsx
<a href="/alquiler-barcos-blanes" className="text-primary hover:underline flex items-center gap-1">
  <ChevronRight className="w-4 h-4" />
  Versión en español
</a>
```

**Step 6: Verify and commit**

Run: `npm run dev`
Navigate to `http://localhost:5000/boat-rental-blanes`
Verify: page renders, SEO component shows correct title/description, hreflang links present.

```bash
git add client/src/pages/boat-rental-blanes.tsx client/src/App.tsx client/src/utils/seo-config.ts server/seoInjector.ts client/src/pages/location-blanes.tsx
git commit -m "feat(seo): add English boat-rental-blanes landing page targeting 'boat rental blanes'"
```

---

### Task 3: Create boat-rental-costa-brava.tsx (Target: "boat rental costa brava", pos 11.7)

**Files:**
- Create: `client/src/pages/boat-rental-costa-brava.tsx`
- Modify: `client/src/App.tsx` (add route)
- Modify: `client/src/utils/seo-config.ts` (add SEO config)
- Modify: `server/seoInjector.ts` (add static meta)

Same pattern as Task 2 but broader geographic scope. Follow the structure of `alquiler-barcos-costa-brava.tsx` (373 lines) but in English with richer content.

**Key differences from boat-rental-blanes:**
- H1: "Boat Rental Costa Brava — Explore Spain's Most Beautiful Coastline"
- Broader geographic content: Blanes as home port + all reachable destinations
- "The Costa Brava by Boat" section — what makes it special, GIF-worthy coves, marine life
- "Departure from Blanes" — why Blanes is the ideal base
- Cross-links to boat-rental-blanes and all location pages
- FAQ: "Can I rent a boat without a license in Spain?", "How far can I go?", etc.

**Steps:** Same as Task 2 — create component, register route, add SEO config, add seoInjector meta, cross-link, verify, commit.

Route: `/boat-rental-costa-brava`
Hreflang alternate: `/alquiler-barcos-costa-brava` (es)

```bash
git commit -m "feat(seo): add English boat-rental-costa-brava landing page"
```

---

### Task 4: Enrich alquiler-barcos-costa-brava.tsx (Target: "alquilar barco costa brava", pos 23.8)

**Files:**
- Modify: `client/src/pages/alquiler-barcos-costa-brava.tsx`
- Modify: `client/src/i18n/es.ts`
- Modify: `client/src/i18n/en.ts`

Same approach as Task 1 — add content sections to reach 1500+ words. This page currently has 373 lines. Add:

- "Guia de Navegacion por la Costa Brava" — routes, distances, difficulty levels
- "Tipos de Barcos para la Costa Brava" — sin licencia vs con licencia comparison
- "Las Mejores Calas de la Costa Brava en Barco" — top 5 with descriptions
- "Precios Alquiler Barco Costa Brava 2026" — pricing table
- Expanded FAQ schema (add 4 more questions specific to Costa Brava)
- Cross-link to `/boat-rental-costa-brava` (English version)

```bash
git commit -m "feat(seo): enrich Costa Brava landing page with 1500+ words and expanded FAQ"
```

---

### Task 5: Enrich category-license-free.tsx (Target: "alquiler barco blanes sin licencia", pos 7)

**Files:**
- Modify: `client/src/pages/category-license-free.tsx`
- Modify: `client/src/i18n/es.ts`
- Modify: `client/src/i18n/en.ts`

This page is already at position 7 — needs a small push to top 3. Currently 436 lines. Add:

- "Normativa de Navegacion sin Licencia en España" — legal framework, 15CV limit, distance limits
- "Comparativa: Nuestros 5 Barcos sin Licencia" — detailed comparison table
- "Testimonios de Clientes" — 3-4 real customer quotes
- 3 more FAQ items specific to license-free boating
- Cross-link to location pages

```bash
git commit -m "feat(seo): enrich license-free category page for top-3 keyword push"
```

---

### Task 6: Update sitemaps to include new pages

**Files:**
- Modify: `server/routes/sitemaps.ts`

Add new pages to the static pages sitemap:
- `/boat-rental-blanes` (priority 0.8, changefreq monthly)
- `/boat-rental-costa-brava` (priority 0.8, changefreq monthly)

These should include hreflang alternates pointing to their Spanish counterparts.

**Step 1: Add pages to sitemap generation**

Find the static pages array in `server/routes/sitemaps.ts` and add the new URLs with proper hreflang alternates.

**Step 2: Verify sitemap**

Run: `npm run dev`
Fetch: `curl http://localhost:5000/sitemap-pages.xml | grep boat-rental`
Expected: Both new URLs appear with hreflang alternates.

```bash
git add server/routes/sitemaps.ts
git commit -m "feat(seo): add English landing pages to sitemap with hreflang"
```

---

### Task 7: Update noscript fallback in index.html

**Files:**
- Modify: `client/index.html`

The `<noscript>` block (lines 213-354) contains static content that non-JS crawlers see. While Googlebot ignores it (runs JS), other crawlers (Bing partially, social bots) may use it. Update it to include links to the new English pages and any new content sections.

Keep changes minimal — just add links to `/boat-rental-blanes` and `/boat-rental-costa-brava` in the noscript nav.

```bash
git add client/index.html
git commit -m "feat(seo): update noscript fallback with new landing page links"
```

---

## Phase 2: Playwright Prerendering

### Task 8: Install Playwright

**Step 1: Install as dev dependency**

```bash
npm install -D playwright
npx playwright install chromium
```

**Step 2: Verify installation**

```bash
npx playwright --version
```
Expected: Version number printed.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Playwright as dev dependency for prerendering"
```

---

### Task 9: Create prerender manifest

**Files:**
- Create: `scripts/prerender-manifest.json`

This file lists all URLs to prerender. Structure:

```json
{
  "baseUrl": "http://localhost:5000",
  "outputDir": "dist/prerendered",
  "routes": [
    { "path": "/", "langs": ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] },
    { "path": "/alquiler-barcos-blanes", "langs": ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] },
    { "path": "/alquiler-barcos-costa-brava", "langs": ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] },
    { "path": "/alquiler-barcos-lloret-de-mar", "langs": ["es", "en"] },
    { "path": "/alquiler-barcos-tossa-de-mar", "langs": ["es", "en"] },
    { "path": "/barcos-sin-licencia", "langs": ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] },
    { "path": "/barcos-con-licencia", "langs": ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] },
    { "path": "/boat-rental-blanes", "langs": ["en"] },
    { "path": "/boat-rental-costa-brava", "langs": ["en"] },
    { "path": "/faq", "langs": ["es", "en"] },
    { "path": "/about", "langs": ["es", "en"] },
    { "path": "/precios", "langs": ["es", "en"] },
    { "path": "/galeria", "langs": ["es", "en"] },
    { "path": "/blog", "langs": ["es"] },
    { "path": "/testimonios", "langs": ["es", "en"] },
    { "path": "/rutas-maritimas", "langs": ["es", "en"] },
    { "path": "/gift-cards", "langs": ["es", "en"] }
  ],
  "dynamicRoutes": {
    "boats": { "apiEndpoint": "/api/boats", "pathTemplate": "/barco/{slug}", "langs": ["es", "en", "fr", "de"] },
    "blog": { "apiEndpoint": "/api/blog/posts?status=published", "pathTemplate": "/blog/{slug}", "langs": ["es"] },
    "destinations": { "apiEndpoint": "/api/destinations?status=published", "pathTemplate": "/destinos/{slug}", "langs": ["es", "en"] }
  },
  "waitForSelector": "#root > div",
  "waitTimeout": 10000,
  "concurrency": 4
}
```

```bash
git add scripts/prerender-manifest.json
git commit -m "feat(seo): add prerender route manifest"
```

---

### Task 10: Create prerender script

**Files:**
- Create: `scripts/prerender.ts`

This script:
1. Reads the manifest
2. Starts the Express server (or connects to a running one)
3. Launches Playwright Chromium
4. For each route × language combination:
   - Navigates to the URL (with `?lang=xx` for non-ES)
   - Waits for `#root > div` to appear (React rendered)
   - Waits for `networkidle`
   - Extracts the full HTML
   - Saves to `dist/prerendered/{path}/index.html` (ES) or `dist/prerendered/{path}__lang_{lang}/index.html`
5. For dynamic routes, fetches the API to get slugs, then prerenders each
6. Reports stats: total pages, time elapsed, any failures

```typescript
// scripts/prerender.ts
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";

interface ManifestRoute {
  path: string;
  langs: string[];
}

interface DynamicRouteConfig {
  apiEndpoint: string;
  pathTemplate: string;
  langs: string[];
}

interface Manifest {
  baseUrl: string;
  outputDir: string;
  routes: ManifestRoute[];
  dynamicRoutes: Record<string, DynamicRouteConfig>;
  waitForSelector: string;
  waitTimeout: number;
  concurrency: number;
}

async function fetchDynamicSlugs(baseUrl: string, apiEndpoint: string): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}${apiEndpoint}`);
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.posts || data.boats || data.destinations || []);
    return items.map((item: Record<string, string>) => item.slug || item.id?.toString()).filter(Boolean);
  } catch {
    console.warn(`  Warning: Could not fetch ${apiEndpoint}`);
    return [];
  }
}

function routeToFilePath(outputDir: string, routePath: string, lang: string): string {
  const cleanPath = routePath === "/" ? "/index" : routePath;
  const langSuffix = lang === "es" ? "" : `__lang_${lang}`;
  return path.join(outputDir, `${cleanPath}${langSuffix}.html`);
}

async function main() {
  const manifestPath = path.resolve("scripts/prerender-manifest.json");
  const manifest: Manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));

  const { baseUrl, outputDir, waitForSelector, waitTimeout, concurrency } = manifest;

  // Collect all URLs to prerender
  const urls: Array<{ url: string; filePath: string }> = [];

  for (const route of manifest.routes) {
    for (const lang of route.langs) {
      const queryParam = lang === "es" ? "" : `?lang=${lang}`;
      urls.push({
        url: `${baseUrl}${route.path}${queryParam}`,
        filePath: routeToFilePath(outputDir, route.path, lang),
      });
    }
  }

  // Resolve dynamic routes
  for (const [, config] of Object.entries(manifest.dynamicRoutes)) {
    const slugs = await fetchDynamicSlugs(baseUrl, config.apiEndpoint);
    for (const slug of slugs) {
      const routePath = config.pathTemplate.replace("{slug}", slug);
      for (const lang of config.langs) {
        const queryParam = lang === "es" ? "" : `?lang=${lang}`;
        urls.push({
          url: `${baseUrl}${routePath}${queryParam}`,
          filePath: routeToFilePath(outputDir, routePath, lang),
        });
      }
    }
  }

  console.log(`Prerendering ${urls.length} pages (concurrency: ${concurrency})...`);

  const browser = await chromium.launch({ headless: true });
  let completed = 0;
  let failed = 0;
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async ({ url, filePath }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: waitTimeout });
          await page.waitForSelector(waitForSelector, { timeout: waitTimeout });
          // Give React a moment to fully hydrate
          await page.waitForTimeout(1000);

          const html = await page.content();

          // Ensure directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, html, "utf-8");
          completed++;

          if (completed % 20 === 0) {
            console.log(`  Progress: ${completed}/${urls.length}`);
          }
        } catch (err) {
          failed++;
          console.error(`  FAIL: ${url} — ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          await context.close();
        }
      })
    );
  }

  await browser.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nPrerendering complete:`);
  console.log(`  ${completed} pages rendered, ${failed} failed`);
  console.log(`  Time: ${elapsed}s`);
  console.log(`  Output: ${outputDir}/`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Prerender script failed:", err);
  process.exit(1);
});
```

**Verify:**
```bash
npx tsx scripts/prerender.ts
```
Expected: Script runs and generates HTML files in `dist/prerendered/`. (Requires `npm run build && npm start` running in another terminal first.)

```bash
git add scripts/prerender.ts
git commit -m "feat(seo): add Playwright prerender build script"
```

---

### Task 11: Create prerender Express middleware

**Files:**
- Create: `server/prerenderedMiddleware.ts`
- Modify: `server/vite.ts` (use middleware in production)

The middleware checks if a prerendered HTML file exists for the current request. If yes, serve it. If no, fall through to the existing `serveWithSEO`.

```typescript
// server/prerenderedMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const SUPPORTED_LANGS = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"];

export function prerenderedMiddleware(prerenderedDir: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip non-GET requests
    if (req.method !== "GET") return next();

    // Skip API routes, assets, admin
    if (req.path.startsWith("/api/") || req.path.startsWith("/assets/") || req.path.startsWith("/crm")) {
      return next();
    }

    const parsedUrl = new URL(req.originalUrl, "http://localhost");
    const routePath = parsedUrl.pathname === "/" ? "/index" : parsedUrl.pathname;
    const lang = parsedUrl.searchParams.get("lang");
    const langSuffix = lang && SUPPORTED_LANGS.includes(lang) && lang !== "es" ? `__lang_${lang}` : "";
    const filePath = path.join(prerenderedDir, `${routePath}${langSuffix}.html`);

    if (fs.existsSync(filePath)) {
      const effectiveLang = lang && SUPPORTED_LANGS.includes(lang) ? lang : "es";
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Content-Language", effectiveLang);
      res.set("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
      res.set("X-Prerendered", "true");
      return res.sendFile(filePath);
    }

    // No prerendered file — fall through to SPA/seoInjector
    next();
  };
}
```

**Integrate in `server/vite.ts`** — add BEFORE the `serveWithSEO` catch-all (around line 112):

```typescript
import { prerenderedMiddleware } from "./prerenderedMiddleware";

// In serveStatic() function, before the catch-all:
const prerenderedDir = path.join(distPath, "..", "prerendered");
if (fs.existsSync(prerenderedDir)) {
  app.use(prerenderedMiddleware(prerenderedDir));
}

// Existing catch-all (keep as fallback):
app.use("*", (req, res) => {
  serveWithSEO(req, res, distPath);
});
```

**Verify:**
```bash
# With prerendered files in place and server running:
curl -s http://localhost:5000/ -H "Accept: text/html" | head -50
# Should contain full HTML with rendered content (not empty div#root)
# Check header:
curl -sI http://localhost:5000/ | grep X-Prerendered
# Expected: X-Prerendered: true
```

```bash
git add server/prerenderedMiddleware.ts server/vite.ts
git commit -m "feat(seo): add prerendered HTML middleware with SPA fallback"
```

---

### Task 12: Integrate prerendering into build pipeline

**Files:**
- Modify: `package.json` (add scripts)

Add new scripts:

```json
{
  "scripts": {
    "prerender": "tsx scripts/prerender.ts",
    "build:full": "npm run build && npm run prerender"
  }
}
```

Note: `prerender` requires the built app to be running. The script should start the server internally or the CI pipeline should start it before running prerender. For simplicity, the prerender script can be updated to:
1. Start the server in background
2. Wait for it to be ready
3. Run prerendering
4. Kill the server

Add to the top of `scripts/prerender.ts`:

```typescript
import { spawn } from "child_process";

async function startServer(port: number): Promise<ReturnType<typeof spawn>> {
  const server = spawn("node", ["dist/index.js"], {
    env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
    stdio: "pipe",
  });

  // Wait for server to be ready
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/api/health`);
      if (res.ok) return server;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server failed to start within 30 seconds");
}
```

Then in `main()`:
```typescript
const port = 5111; // Use non-standard port to avoid conflicts
const server = await startServer(port);
// ... prerender with baseUrl = `http://localhost:${port}`
// ... at the end:
server.kill();
```

**Verify:**

```bash
npm run build
npm run prerender
ls dist/prerendered/
```
Expected: HTML files for all manifest routes.

```bash
git add package.json scripts/prerender.ts
git commit -m "feat(seo): integrate prerendering into build pipeline"
```

---

### Task 13: Add dist/prerendered to .gitignore

**Files:**
- Modify: `.gitignore`

Add:
```
dist/prerendered/
```

```bash
git add .gitignore
git commit -m "chore: ignore prerendered output directory"
```

---

### Task 14: End-to-end verification

**Step 1: Full build + prerender**

```bash
npm run build:full
```
Expected: Build succeeds, prerendering generates 100+ HTML files.

**Step 2: Start production server**

```bash
npm start
```

**Step 3: Verify prerendered HTML is served**

```bash
# Homepage (Spanish, default)
curl -s http://localhost:5000/ | grep -c "<h1"
# Expected: 1 (H1 tag visible in HTML, not requiring JS)

# Blanes landing (Spanish)
curl -s http://localhost:5000/alquiler-barcos-blanes | grep "Puerto de Blanes"
# Expected: Content visible

# Blanes landing (English)
curl -s "http://localhost:5000/boat-rental-blanes" | grep "Boat Rental"
# Expected: Content visible

# Check X-Prerendered header
curl -sI http://localhost:5000/alquiler-barcos-blanes | grep X-Prerendered
# Expected: X-Prerendered: true

# Fallback for non-prerendered route
curl -sI http://localhost:5000/some-unknown-page | grep X-Prerendered
# Expected: No X-Prerendered header (falls through to seoInjector)
```

**Step 4: Verify SPA still works**

Open `http://localhost:5000/` in browser:
- Page should load with full content (prerendered HTML)
- React should hydrate (interactive elements work: booking buttons, navigation, etc.)
- Client-side navigation should work (clicking links loads new pages via React router)
- No console hydration errors

**Step 5: Final commit**

```bash
git commit --allow-empty -m "verify: end-to-end prerendering working correctly"
```

---

## Post-Implementation Checklist

After deploying:

1. **Request indexing** — In Google Search Console, submit the new URLs for indexing:
   - `/boat-rental-blanes`
   - `/boat-rental-costa-brava`
   - Re-submit `/alquiler-barcos-blanes` (enriched content)
   - Re-submit sitemap.xml

2. **Monitor in GSC** — Check positions weekly for target keywords:
   - "alquiler barco blanes" (target: top 5)
   - "boat rental costa brava" (target: top 5)
   - "boat rental blanes" (target: top 5)
   - "alquiler barco costa brava" (target: top 10)

3. **Verify with Google's URL Inspection Tool** — Check that Google renders the new pages correctly and sees full content.

4. **Phase 3-5 (marketing, no code):**
   - Optimize Google Business Profile
   - Implement review strategy
   - Start local link building campaign
