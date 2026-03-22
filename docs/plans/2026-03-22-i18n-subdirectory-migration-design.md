# i18n URL Migration: Query Params to Subdirectories

**Date:** 2026-03-22
**Status:** Approved

## Goal

Migrate from `?lang=` query parameter URLs to language subdirectory URLs with translated slugs for SEO.

**Before:** `costabravarentaboat.com/alquiler-barcos-blanes?lang=fr`
**After:** `costabravarentaboat.com/fr/location-bateau-blanes`

## Phased Rollout

| Phase | Languages | Slug strategy |
|-------|-----------|---------------|
| 1 | ES, EN, FR | Translated slugs (SEO keywords naturales) |
| 2 | DE, NL, IT | DE translated; NL, IT fallback to EN slugs |
| 3 | CA, RU | CA fallback to ES slugs; RU fallback to EN slugs |

All 8 languages get their subdirectory from Phase 1. Non-Phase-1 languages use EN slugs as provisional fallback until their phase arrives.

## Language Strategy

| Language | Slug source | Example |
|----------|------------|---------|
| ES | Spanish (native) | `/es/alquiler-barcos-blanes` |
| EN | English (translated) | `/en/boat-rental-blanes` |
| FR | French (translated) | `/fr/location-bateau-blanes` |
| DE | English (fallback, Phase 2) | `/de/boat-rental-blanes` → later `/de/bootsverleih-blanes` |
| CA | Spanish (fallback, Phase 3) | `/ca/alquiler-barcos-blanes` |
| NL | English (fallback, Phase 2) | `/nl/boat-rental-blanes` |
| IT | English (fallback, Phase 2) | `/it/boat-rental-blanes` |
| RU | English (fallback, Phase 3) | `/ru/boat-rental-blanes` |

## Architecture

### 1. Route Slug Map (`shared/i18n-routes.ts`)

Central mapping of page keys to translated slugs. Phase 1 defines ES, EN, FR. Other languages fall back: CA → ES slugs, DE/NL/IT/RU → EN slugs.

```typescript
export const ROUTE_SLUGS: Record<string, Record<string, string>> = {
  // Generic segments (prefixes for dynamic routes)
  boat:         { es: 'barco',    en: 'boat',    fr: 'bateau' },
  blog:         { es: 'blog',     en: 'blog',    fr: 'blog' },
  destinations: { es: 'destinos', en: 'destinations', fr: 'destinations' },

  // Static pages
  home:              { es: '', en: '', fr: '' },
  licenseFree:       { es: 'barcos-sin-licencia',           en: 'boats-without-license',        fr: 'bateau-sans-permis' },
  licensed:          { es: 'barcos-con-licencia',           en: 'boats-with-license',           fr: 'bateau-avec-permis' },
  pricing:           { es: 'precios',                       en: 'prices',                       fr: 'tarifs' },
  gallery:           { es: 'galeria',                       en: 'gallery',                      fr: 'galerie' },
  faq:               { es: 'faq',                           en: 'faq',                          fr: 'faq' },
  giftCards:         { es: 'tarjetas-regalo',               en: 'gift-cards',                   fr: 'cartes-cadeaux' },
  testimonials:      { es: 'testimonios',                   en: 'testimonials',                 fr: 'temoignages' },
  about:             { es: 'sobre-nosotros',                en: 'about',                        fr: 'a-propos' },
  routes:            { es: 'rutas',                         en: 'routes',                       fr: 'itineraires' },

  // Locations — natural search keywords per language
  locationBlanes:       { es: 'alquiler-barcos-blanes',          en: 'boat-rental-blanes',          fr: 'location-bateau-blanes' },
  locationLloret:       { es: 'alquiler-barcos-lloret-de-mar',   en: 'boat-rental-lloret-de-mar',   fr: 'location-bateau-lloret-de-mar' },
  locationTossa:        { es: 'alquiler-barcos-tossa-de-mar',    en: 'boat-rental-tossa-de-mar',    fr: 'location-bateau-tossa-de-mar' },
  locationMalgrat:      { es: 'alquiler-barcos-malgrat-de-mar',  en: 'boat-rental-malgrat-de-mar',  fr: 'location-bateau-malgrat-de-mar' },
  locationSantaSusanna: { es: 'alquiler-barcos-santa-susanna',   en: 'boat-rental-santa-susanna',   fr: 'location-bateau-santa-susanna' },
  locationCalella:      { es: 'alquiler-barcos-calella',         en: 'boat-rental-calella',         fr: 'location-bateau-calella' },
  locationPineda:       { es: 'alquiler-barcos-pineda-de-mar',   en: 'boat-rental-pineda-de-mar',   fr: 'location-bateau-pineda-de-mar' },
  locationPalafolls:    { es: 'alquiler-barcos-palafolls',       en: 'boat-rental-palafolls',       fr: 'location-bateau-palafolls' },
  locationTordera:      { es: 'alquiler-barcos-tordera',         en: 'boat-rental-tordera',         fr: 'location-bateau-tordera' },
  locationBarcelona:    { es: 'alquiler-barcos-cerca-barcelona', en: 'boat-rental-near-barcelona',  fr: 'location-bateau-pres-barcelone' },
  locationCostaBrava:   { es: 'alquiler-barcos-costa-brava',     en: 'boat-rental-costa-brava',     fr: 'location-bateau-costa-brava' },

  // Activities
  activitySnorkel:  { es: 'excursion-snorkel-barco-blanes', en: 'snorkel-boat-trip-blanes',  fr: 'excursion-snorkel-bateau-blanes' },
  activityFamilies: { es: 'barco-familias-costa-brava',     en: 'family-boat-costa-brava',   fr: 'bateau-familles-costa-brava' },
  activitySunset:   { es: 'paseo-atardecer-barco-blanes',   en: 'sunset-boat-trip-blanes',   fr: 'balade-coucher-soleil-bateau-blanes' },
  activityFishing:  { es: 'pesca-barco-blanes',             en: 'fishing-boat-blanes',       fr: 'peche-bateau-blanes' },

  // Legal (no SEO optimization needed)
  privacyPolicy: { es: 'politica-privacidad',  en: 'privacy-policy',         fr: 'politique-confidentialite' },
  terms:         { es: 'terminos-condiciones', en: 'terms-conditions',       fr: 'conditions-generales' },
  cookies:       { es: 'politica-cookies',     en: 'cookies-policy',         fr: 'politique-cookies' },
  accessibility: { es: 'accesibilidad',        en: 'accessibility',          fr: 'accessibilite' },
};
```

Helper functions:

```typescript
// Get slug for a page in a language (with fallback: CA→ES, others→EN)
export function getSlug(pageKey: string, lang: string): string;

// Reverse lookup: given a slug and language, return the page key
export function resolvePageKey(slug: string, lang: string): string | null;

// Build full path: /{lang}/{slug}
export function buildPath(pageKey: string, lang: string): string;
```

### 2. Router (`client/src/App.tsx`)

**Dynamic resolver approach.** A single `/:lang/:slug` catch-all route resolves slug → component via `resolvePageKey()`.

```
/:lang/                    → Homepage
/:lang/barco/:id           → Boat detail (generic segment translated)
/:lang/blog                → Blog listing
/:lang/blog/:slug          → Blog detail (slugByLang from DB)
/:lang/destinos/:slug      → Destination detail (geographic slug unchanged)
/:lang/{static-slug}       → Resolved via resolvePageKey() → lazy component
```

**Out of scope (no lang prefix):** `/crm`, `/login`, `/onboarding`, `/client/dashboard`, `/cancel/:token`

### 3. Language Hook (`client/src/hooks/use-language.tsx`)

Source of truth moves from localStorage to URL path.

```
Read:  extract /:lang from current path → active language
Write: setLanguage(newLang) → navigate to equivalent page in new language
       - Static pages: getSlug(currentPageKey, newLang)
       - Blog: use post.slugByLang[newLang] (fallback to original slug)
       - Boat: keep same ID, change generic segment
       - Destination: keep same slug, change generic segment
```

localStorage still used as preference hint for the root `/` redirect.

### 4. SEO

**Canonicals:** Each language version has its own self-referencing canonical.
```html
<!-- /fr/location-bateau-blanes -->
<link rel="canonical" href="https://costabravarentaboat.com/fr/location-bateau-blanes" />
```

**Hreflang:** Every page includes all 8 languages + x-default.
```html
<link rel="alternate" hreflang="es-ES" href=".../es/alquiler-barcos-blanes" />
<link rel="alternate" hreflang="en-GB" href=".../en/boat-rental-blanes" />
<link rel="alternate" hreflang="fr-FR" href=".../fr/location-bateau-blanes" />
<link rel="alternate" hreflang="de-DE" href=".../de/boat-rental-blanes" />
<link rel="alternate" hreflang="nl-NL" href=".../nl/boat-rental-blanes" />
<link rel="alternate" hreflang="it-IT" href=".../it/boat-rental-blanes" />
<link rel="alternate" hreflang="ca"    href=".../ca/alquiler-barcos-blanes" />
<link rel="alternate" hreflang="ru-RU" href=".../ru/boat-rental-blanes" />
<link rel="alternate" hreflang="x-default" href=".../es/alquiler-barcos-blanes" />
```

Note: Catalan uses `ca` (not `ca-ES`) per ISO 639-1.

**SEO component simplification:**
```tsx
<SEO pageKey="locationBlanes" />
// Infers lang from context, generates canonical + hreflang + og:url automatically
```

**Blog hreflang:** Uses `slugByLang` from each post. Falls back to original slug if translation missing.

### 5. Sitemaps (`server/routes/sitemaps.ts`)

Structure unchanged (sitemap index + 4 sub-sitemaps). Content updated to use subdirectory URLs.

Each `<url>` entry includes `<xhtml:link>` alternates for all 8 languages + x-default.

One `<url>` per language per page:
- ~30 static pages x 8 = ~240 URLs in `sitemap-pages.xml`
- ~10 boats x 8 = ~80 URLs in `sitemap-boats.xml`
- ~20 posts x 8 = ~160 URLs in `sitemap-blog.xml`
- Total: ~500 URLs

### 6. Server Redirects (`server/routes.ts`)

**Root `/` redirect (302, not 301):**
Priority order for language detection:
1. `Accept-Language` header (auto-detect visitor language)
2. Language preference cookie (returning visitor)
3. Fallback to `/es/`

**Legacy URL redirects (301):**
All old URLs without lang prefix get 301 to their new equivalent. The middleware:
1. Checks if URL has `?lang=` param → extract target language
2. If no `?lang=`, target language = `es`
3. Resolves the pageKey from the old slug
4. Redirects to `/{lang}/{getSlug(pageKey, lang)}`

Known indexed URLs to cover:
- `/` → detected language homepage
- `/precios` → `/es/precios`
- `/extras` → `/es/extras`
- `/privacy-policy` → `/es/politica-privacidad`
- `/nota-legal` → `/es/nota-legal`
- `/destinos/blanes-lloret` → `/es/destinos/blanes-lloret`
- `/alquiler-barcos-blanes` → `/es/alquiler-barcos-blanes`
- `/condiciones-de-reserva` → `/es/condiciones-de-reserva`
- `/terms-conditions?lang=en` → `/en/terms-conditions`
- `/?lang=it` → `/it/`
- `/boat-rental-blanes` → `/en/boat-rental-blanes`
- `/boat-rental-costa-brava` → `/en/boat-rental-costa-brava`

### 7. Dynamic Routes

| Route type | Generic segment | Slug | Example |
|-----------|----------------|------|---------|
| Boat detail | Translated (`barco`/`boat`/`bateau`) | Unchanged (brand name) | `/fr/bateau/remus-450` |
| Blog listing | Universal (`blog`) | N/A | `/fr/blog` |
| Blog detail | Universal (`blog`) | `slugByLang` from DB | `/fr/blog/location-bateau-blanes-guide` |
| Destination | Translated (`destinos`/`destinations`) | Unchanged (geographic) | `/fr/destinations/blanes-lloret` |

### 8. Language Selector

Shows all 8 languages. On click, navigates to equivalent page in target language using the correct translated slug. No change to visual design.

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `shared/i18n-routes.ts` | Slug map + helper functions |
| Modify | `client/src/App.tsx` | Router with `/:lang` prefix + resolver |
| Modify | `client/src/hooks/use-language.tsx` | Read lang from URL, navigate on switch |
| Modify | `client/src/components/SEO.tsx` | Canonical + hreflang with subdirectory URLs |
| Modify | `client/src/utils/seo-config.ts` | Refactor `generateHreflangLinks()`, `generateCanonicalUrl()` |
| Modify | `client/src/components/LanguageSelector.tsx` | Navigate to translated slug on language change |
| Modify | `client/src/components/Navigation.tsx` | Links use `buildPath()` |
| Modify | `client/src/components/Footer.tsx` | Links use `buildPath()` |
| Modify | `server/routes.ts` | Root redirect + legacy URL 301s + SPA catch-all for `/:lang/*` |
| Modify | `server/routes/sitemaps.ts` | Subdirectory URLs in all sitemaps |
| Modify | `shared/seoConstants.ts` | Update `ca-ES` → `ca` in HREFLANG_CODES |

## Implementation Order (Phase 1)

1. Create `shared/i18n-routes.ts` with slug map + helpers
2. Refactor `use-language.tsx` to read from URL path
3. Update `App.tsx` router with `/:lang` prefix + dynamic resolver
4. Update `LanguageSelector.tsx` to navigate with translated slugs
5. Update `Navigation.tsx` and `Footer.tsx` links
6. Update SEO: canonicals, hreflang, og:url in `SEO.tsx` + `seo-config.ts`
7. Update server: root redirect, legacy 301s, SPA catch-all
8. Update sitemaps with subdirectory URLs
