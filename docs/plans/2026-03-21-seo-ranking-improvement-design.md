# SEO Ranking Improvement — Design Document

**Date:** 2026-03-21
**Status:** Approved
**Goal:** Move from average Google position 17 to top 5 for key boat rental keywords

## Current State

- **Average position:** 17.4 (GSC, last 7 days)
- **Near page 1:** "alquiler barco blanes" (pos 11), "boat rental costa brava" (pos 11.7), "costa brava boat" (pos 7)
- **Dragging average down:** Keywords at 20+ with no dedicated landing pages
- **Architecture:** React SPA, body is empty `<div id="root">` without JS. seoInjector only modifies `<head>`.
- **Competitors:** Blanes Boats, Eric Boats, Rent a Boat Blanes — all serve static HTML or WordPress SSR

## Root Cause Analysis

| Problem | Impact | Evidence |
|---------|--------|----------|
| No dedicated landing pages for target keywords | 33% of organic local ranking | Homepage tries to rank for everything, ranks well for nothing |
| Empty HTML body without JS | 9x crawl budget, delayed indexing | seoInjector only touches `<head>`, `<body>` is `<div id="root">` |
| No GBP optimization | 32% of Local Pack ranking | Not part of current SEO strategy |
| Younger domain, fewer backlinks | 24% of organic local ranking | Competitors have 8-10 years of backlinks |

## Strategy (6 Phases)

### Phase 1: Keyword-Targeted Landing Pages (code)

Create dedicated pages with 1500+ words of unique, geographically-rich content for each high-value keyword cluster.

**Pages to create:**

| URL | Target keyword | Current pos | Language |
|-----|---------------|-------------|----------|
| `/alquiler-barcos-blanes` | alquiler barco blanes | 11.0 | ES |
| `/alquiler-barcos-costa-brava` | alquiler barco costa brava | 23.8 | ES |
| `/alquiler-barcos-sin-licencia-blanes` | alquiler barco blanes sin licencia | 7.0 | ES |
| `/boat-rental-blanes` | boat rental blanes | ~12 | EN |
| `/boat-rental-costa-brava` | boat rental costa brava | 11.7 | EN |
| `/location-bateau-costa-brava` | location bateau costa brava | ~30 | FR |

Note: `/alquiler-barcos-blanes` already exists as a route. We need to verify its content depth and optimize it.
Also check existing location pages (blanes, lloret, tossa) for content depth.

**Content structure per page:**
- H1 with primary keyword + geographic modifier
- 1500+ words of unique content (local knowledge, practical info, boat types, pricing overview)
- Internal links to individual boat pages
- FAQ section with schema markup
- CTA to booking flow
- Customer testimonials relevant to that location/service
- Nearby attractions / what to do section

### Phase 2: Prerendering with Playwright (code)

Render all key routes to static HTML at build time so Google gets full content immediately.

**Implementation:**
1. Build script (`scripts/prerender.ts`) that:
   - Starts Express server locally
   - Launches Playwright
   - Visits each route from a manifest
   - Waits for content to render (networkidle + specific selectors)
   - Saves rendered HTML to `dist/prerendered/`
2. Express middleware (`server/prerenderedMiddleware.ts`) that:
   - Checks if a prerendered file exists for the current route
   - If yes, serves it (with seoInjector head modifications applied)
   - If no, falls back to current SPA behavior
3. Route manifest (`prerender-manifest.json`):
   - All landing pages × 8 languages
   - All boat detail pages × 8 languages
   - Blog posts (Spanish only, or top languages)
   - Static pages (FAQ, about, gallery, pricing) × 8 languages
   - ~300 total URLs

**Build integration:**
- Added to `npm run build` pipeline
- Takes ~10 minutes (300 pages × 2s each)
- Rebuilds on deploy

**Cache strategy:**
- Prerendered HTML served with `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
- Rebuild on content changes (new boats, blog posts, price changes)

### Phase 3: Google Business Profile Optimization (marketing, no code)

- Verify primary category: "Boat Rental Service"
- Add secondary categories: "Fishing Charter", "Boat Tour Agency"
- Weekly GBP posts with seasonal offers
- Upload 10+ high-quality photos (boats, customers, views)
- Add Q&A section with common questions
- Ensure NAP (Name, Address, Phone) consistency across all citations
- Add attributes: wheelchair accessible, languages spoken, payment methods

### Phase 4: Review Strategy (marketing, no code)

- Implement systematic post-trip review request (WhatsApp message 24h after trip)
- Respond to ALL existing reviews (positive and negative)
- Target: 50+ new Google reviews in next 3 months
- Cross-promote TripAdvisor reviews (already 307 at 4.8★)

### Phase 5: Local Link Building (marketing, no code)

Priority directories:
- blanescostabrava.cat (official Blanes tourism)
- costabrava.org (Costa Brava tourism board)
- GetYourGuide, Viator, Civitatis listings
- Spanish nautical directories
- Local business associations

Target: 15-20 quality local backlinks in 3 months.

### Phase 6: Path-Based i18n (code, lower priority)

Change from `?lang=en` to `/en/boat-rental-blanes`:
- Each language version gets its own distinct URL
- Better crawl efficiency
- Cleaner URL structure
- 301 redirects from `?lang=` URLs
- Update sitemaps, hreflang, canonical URLs

This is a larger architectural change. Can be deferred to after Phases 1-2 show results.

## Expected Impact

| Phase | Timeline | Position impact |
|-------|----------|-----------------|
| 1 (Landing pages) | 1-2 weeks code, 2-4 weeks indexing | Top keywords from 11-12 → 5-7 |
| 2 (Prerendering) | 1 week code | Faster indexing, +1-2 positions across the board |
| 3 (GBP) | Ongoing | Local Pack visibility (currently not optimized) |
| 4 (Reviews) | Ongoing | Local Pack +20% signal weight |
| 5 (Links) | 2-3 months | +2-3 positions organic |
| 6 (i18n paths) | 2 weeks code | +1-2 positions, better crawl efficiency |
| **Combined (3 months)** | | **Average position 17 → 3-5** |

## What We Code (Phases 1-2)

### Phase 1 deliverables:
- New/enhanced landing pages with rich content
- FAQ schema markup per page
- Internal linking improvements
- Content in both ES and EN minimum

### Phase 2 deliverables:
- `scripts/prerender.ts` — Playwright-based prerender script
- `prerender-manifest.json` — route manifest
- `server/prerenderedMiddleware.ts` — Express middleware to serve prerendered HTML
- Updated `npm run build` to include prerender step
- Verification: `curl` homepage shows full HTML content without JS

## Success Criteria

1. All target keywords on page 1 (position ≤ 10) within 8 weeks
2. Average position ≤ 8 within 12 weeks
3. Organic clicks increase 3x (from 18/week to 54/week)
4. 100% of key pages indexed within 48 hours of publish
5. AI crawlers (GPTBot, etc.) can read full page content

## Risks

- Google re-crawl timing: new content may take 2-4 weeks to affect rankings
- Competitor response: they may also improve
- Prerender build time may grow as pages increase (mitigated by manifest)
- Content quality must be genuinely useful, not keyword-stuffed

## Competitor Reference

| Competitor | Stack | Domain age | Why they rank |
|-----------|-------|------------|---------------|
| Blanes Boats | Static HTML | 8-10 years | Instant indexing, established backlinks, "blanes" in domain |
| Eric Boats | WordPress SSR | 5-7 years | SSR, blog content, "blanes" in domain |
| Rent a Boat Blanes | Static HTML | 8-10 years | Instant indexing, exact-match domain |
