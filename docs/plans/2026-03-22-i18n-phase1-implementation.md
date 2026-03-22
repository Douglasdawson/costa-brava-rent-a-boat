# i18n Subdirectory Migration — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the i18n subdirectory migration so all pages use `/:lang/` prefix URLs with translated slugs for ES/EN/FR (other languages use EN slugs as fallback), proper canonicals, hreflang, server redirects, and sitemaps.

**Architecture:** The router (`/:lang` prefix) and slug map (`shared/i18n-routes.ts`) are already implemented. Remaining work: fix slug values, update SEO infrastructure (canonicals, hreflang, sitemaps), update Navigation/Footer/page links to use `localizedPath()`, add server-side redirects for legacy URLs, and update the SPA route validator.

**Tech Stack:** React (wouter router), Express server, Drizzle ORM (Neon PostgreSQL), TailwindCSS, `shared/i18n-routes.ts` slug system

---

## Current State

**Already implemented:**
- `shared/i18n-routes.ts` — slug map + `getSlugForPage()`, `getLocalizedPath()`, `switchLanguagePath()`, `resolveSlug()`
- `client/src/App.tsx` — Router with `/:lang` prefix, `PageResolver`, `DynamicPageResolver`
- `client/src/hooks/use-language.tsx` — reads lang from URL path, `localizedPath()` and `switchLanguageUrl()` exposed in context

**Remaining work (this plan):**
1. Fix slug values in the slug map
2. Fix hreflang code for Catalan
3. Update Navigation links
4. Update Footer links
5. Update hardcoded links in ~40 page/component files
6. Update SEO.tsx hreflang generation
7. Update server sitemaps
8. Update server SPA route validator
9. Add server-side redirects (legacy URLs + root `/` with Accept-Language)

---

### Task 1: Fix slug values in `shared/i18n-routes.ts`

**Files:**
- Modify: `shared/i18n-routes.ts`

**Step 1: Fix FR slugs — `bateaux` → `bateau` (singular)**

All French location slugs use `location-bateaux-*` but should use `location-bateau-*` (singular, matches Google France search patterns). All FR category slugs use `bateaux-*` but should use `bateau-*`.

Change every occurrence of `bateaux` to `bateau` in the FR column:
- `location-bateaux-blanes` → `location-bateau-blanes`
- `location-bateaux-lloret-de-mar` → `location-bateau-lloret-de-mar`
- (etc. for all 11 location slugs)
- `bateaux-sans-permis` → `bateau-sans-permis`
- `bateaux-avec-permis` → `bateau-avec-permis`

**Step 2: Fix ES activitySunset slug**

Currently: `sunset-boat-trip-blanes` (English, wrong)
Should be: `paseo-atardecer-barco-blanes` (Spanish, natural keyword)

**Step 3: Fix ES legal page slugs**

Currently all legal pages use English slugs for ES. Fix:
- `privacyPolicy.es`: `privacy-policy` → `politica-privacidad`
- `termsConditions.es`: `terms-conditions` → `terminos-condiciones`
- `cookiesPolicy.es`: `cookies-policy` → `politica-cookies`

**Step 4: Fix FR activity slugs per design**

- `activityFamilies.fr`: `bateau-famille-costa-brava` → `bateau-familles-costa-brava`
- `activitySunset.fr`: `croisiere-coucher-soleil-blanes` → `balade-coucher-soleil-bateau-blanes`

**Step 5: Verify and run**

Run: `npx tsc --noEmit --project tsconfig.json 2>&1 | head -20`
Expected: No errors related to i18n-routes

**Step 6: Commit**

```bash
git add shared/i18n-routes.ts
git commit -m "fix(i18n): correct FR slugs (bateau singular) and ES legal/activity slugs"
```

---

### Task 2: Fix Catalan hreflang code

**Files:**
- Modify: `shared/seoConstants.ts`

**Step 1: Change `ca-ES` → `ca`**

In `HREFLANG_CODES`, change the Catalan entry from `"ca-ES"` to `"ca"`. ISO 639-1 `ca` is cleaner and Google accepts both.

```typescript
// Before
ca: "ca-ES",
// After
ca: "ca",
```

**Step 2: Commit**

```bash
git add shared/seoConstants.ts
git commit -m "fix(seo): use ISO 639-1 'ca' for Catalan hreflang instead of 'ca-ES'"
```

---

### Task 3: Update Navigation to use localized paths

**Files:**
- Modify: `client/src/components/Navigation.tsx`

**Step 1: Import `useLanguage` and update navigation items**

The hook is already imported. Change `navigationItems` (line 144) to use `localizedPath()`:

```typescript
const { language, localizedPath } = useLanguage(); // add localizedPath

const navigationItems = [
  { label: t.nav.home, href: localizedPath("home") },
  { label: t.nav.fleet, href: "#fleet" },
  { label: t.footer.destinations, href: localizedPath("routes") },
  { label: "Blog", href: localizedPath("blog") },
];
```

**Step 2: Update `isNavItemActive` to work with lang prefix**

The current check compares against hardcoded paths like `/blog`. Update to use the current lang prefix:

```typescript
const isNavItemActive = (href: string): boolean => {
  const path = window.location.pathname;
  if (href === localizedPath("home")) return path === `/${language}/` || path === `/${language}`;
  if (href === localizedPath("blog")) return path.includes("/blog");
  if (href === localizedPath("routes")) return path.includes(getSlugForPage("routes", language)) || path.includes(getSlugForPage("destinations", language));
  return false;
};
```

Import `getSlugForPage` from `@shared/i18n-routes`.

**Step 3: Update `handleNavigation` to work with localized paths**

The function has special cases for `/`, `/blog`, `#faq`. Update these to compare against localized paths instead of hardcoded strings.

**Step 4: Verify**

Run: `npm run dev` and test navigation in ES, EN, FR. Verify:
- Clicking "Blog" navigates to `/{lang}/blog`
- Clicking "Destinos/Routes/Itineraires" navigates to `/{lang}/rutas` or `/{lang}/routes` or `/{lang}/itineraires`
- Active state highlights correctly

**Step 5: Commit**

```bash
git add client/src/components/Navigation.tsx
git commit -m "feat(i18n): update Navigation links to use localizedPath()"
```

---

### Task 4: Update Footer to use localized paths

**Files:**
- Modify: `client/src/components/Footer.tsx`

**Step 1: Use `localizedPath()` from language hook**

The Footer has ~21 hardcoded links. Replace each with `localizedPath()`:

```typescript
const { localizedPath } = useLanguage();

// Navigation column
<a href={localizedPath("routes")}>{t.footer.destinations}</a>
<a href={localizedPath("blog")}>{t.footer.blog}</a>
<a href={localizedPath("pricing")}>...</a>
<a href={localizedPath("faq")}>{t.footer.faqLabel}</a>
<a href={localizedPath("giftCards")}>{t.nav.giftCards}</a>
<a href={localizedPath("testimonials")}>{t.footer.customerReviews}</a>
<a href={localizedPath("gallery")}>{t.footer.gallery}</a>

// Destinations
<a href={localizedPath("locationBlanes")}>Blanes</a>
<a href={localizedPath("locationLloret")}>Lloret de Mar</a>
<a href={localizedPath("locationTossa")}>Tossa de Mar</a>
<a href={localizedPath("locationMalgrat")}>Malgrat de Mar</a>
<a href={localizedPath("locationSantaSusanna")}>Santa Susanna</a>
<a href={localizedPath("locationCalella")}>Calella</a>

// Services
<a href={localizedPath("categoryLicenseFree")}>{t.boats.withoutLicense}</a>
<a href={localizedPath("categoryLicensed")}>{t.boats.withLicense}</a>
<a href={localizedPath("locationBarcelona")}>...</a>

// Legal
<a href={localizedPath("termsConditions")}>{t.footer.terms}</a>
<a href={localizedPath("privacyPolicy")}>{t.footer.privacy}</a>
<a href={localizedPath("cookiesPolicy")}>{t.footer.cookiesPolicy}</a>
<a href={localizedPath("accessibility")}>{t.footer.accessibility}</a>
```

Anchor links (`#fleet`, `#contact`) stay unchanged.

**Step 2: Commit**

```bash
git add client/src/components/Footer.tsx
git commit -m "feat(i18n): update Footer links to use localizedPath()"
```

---

### Task 5: Update hardcoded links in page components

**Files:**
- Modify: ~40 files in `client/src/pages/` and `client/src/components/`

This task covers ~164 hardcoded `href="/..."` links scattered across page and component files. These are internal cross-links (e.g., "See also: Boat rental Blanes", "Back to fleet", CTA buttons linking to other pages).

**Approach:** Systematically update each file. For each:
1. Add `const { localizedPath } = useLanguage();` if not already present (most pages already import `useLanguage`)
2. Replace hardcoded `href="/path"` with `href={localizedPath("pageKey")}`
3. For dynamic routes (boat detail links), use `localizedPath("boatDetail", boatSlug)`

**Mapping reference (hardcoded path → localizedPath call):**

| Hardcoded path | Replacement |
|---------------|-------------|
| `/alquiler-barcos-blanes` | `localizedPath("locationBlanes")` |
| `/alquiler-barcos-lloret-de-mar` | `localizedPath("locationLloret")` |
| `/alquiler-barcos-tossa-de-mar` | `localizedPath("locationTossa")` |
| `/alquiler-barcos-costa-brava` | `localizedPath("locationCostaBrava")` |
| `/barcos-sin-licencia` | `localizedPath("categoryLicenseFree")` |
| `/barcos-con-licencia` | `localizedPath("categoryLicensed")` |
| `/barco/{slug}` | `localizedPath("boatDetail", "{slug}")` |
| `/blog` | `localizedPath("blog")` |
| `/blog/{slug}` | `localizedPath("blogDetail", "{slug}")` |
| `/precios` | `localizedPath("pricing")` |
| `/rutas` | `localizedPath("routes")` |
| `/faq` | `localizedPath("faq")` |
| `/galeria` | `localizedPath("gallery")` |
| `/testimonios` | `localizedPath("testimonials")` |
| `/tarjetas-regalo` | `localizedPath("giftCards")` |
| `/sobre-nosotros` or `/about` | `localizedPath("about")` |
| `/destinos/{slug}` | `localizedPath("destinationDetail", "{slug}")` |
| `/privacy-policy` | `localizedPath("privacyPolicy")` |
| `/terms-conditions` | `localizedPath("termsConditions")` |
| `/cookies-policy` | `localizedPath("cookiesPolicy")` |

**Files with highest link counts (prioritize):**
- `location-blanes.tsx` (13 links)
- `boat-rental-blanes.tsx` (8)
- `location-lloret-de-mar.tsx` (8)
- `location-tossa-de-mar.tsx` (8)
- `activity-*.tsx` (6 each)
- `about.tsx` (5)
- `boat-rental-costa-brava.tsx` (5)

**Components (non-page files):**
- `FeaturesSection.tsx` (5)
- `LicenseComparisonSection.tsx` (2)
- `BookingFormDesktop.tsx` (2)
- `DestinationsSection.tsx` (2)
- `CookieBanner.tsx` (2)
- `BookingWizardMobile.tsx` (2)
- `FAQPreview.tsx` (1)
- `ReviewsSection.tsx` (1)
- `BoatDetailPage.tsx` (1)
- `GiftCardBanner.tsx` (1)
- `booking-flow/BookingStepPayment.tsx` (1)

**Also update `RelatedLocationsSection.tsx` and `RelatedContent.tsx`** — these contain hardcoded URL arrays that need localization.

**Step: Commit after each batch of ~5-10 files**

```bash
git commit -m "feat(i18n): update hardcoded links in location pages to use localizedPath()"
git commit -m "feat(i18n): update hardcoded links in activity pages to use localizedPath()"
git commit -m "feat(i18n): update hardcoded links in component files to use localizedPath()"
```

---

### Task 6: Update SEO.tsx hreflang generation

**Files:**
- Modify: `client/src/components/SEO.tsx` (lines 159-190)

**Step 1: Replace `?lang=` hreflang with subdirectory URLs**

The current auto-generation (lines 170-173) appends `?lang=` query params. Replace with subdirectory-based hreflang using `getLocalizedPath()` and `getSlugForPage()`.

The SEO component needs to know the current `pageKey` to generate correct hreflang URLs for all 8 languages. Two options:
- **Option A:** Add `pageKey` as a required prop on `<SEO>`
- **Option B:** Resolve `pageKey` from current URL path using `resolveSlug()`

Use **Option B** (resolve from URL) to minimize changes across all page components:

```typescript
import { resolveSlug, getLocalizedPath, isValidLang } from "@shared/i18n-routes";
import { SUPPORTED_LANGUAGES, HREFLANG_CODES } from "@shared/seoConstants";

// Inside the useEffect:
// Resolve current page key from URL
const segments = window.location.pathname.split('/').filter(Boolean);
const lang = segments[0];
const slug = segments[1] || '';
const resolved = slug ? resolveSlug(slug) : { pageKey: 'home' };
const pageKey = resolved?.pageKey || null;

if (pageKey && isValidLang(lang)) {
  // Generate hreflang for all 8 languages
  SUPPORTED_LANGUAGES.forEach(targetLang => {
    const hreflangUrl = `${getBaseUrl()}${getLocalizedPath(pageKey, targetLang)}`;
    const hreflangCode = HREFLANG_CODES[targetLang];
    // create <link rel="alternate" hreflang="..." href="...">
  });
  // x-default → /es/ version
  const xDefaultUrl = `${getBaseUrl()}${getLocalizedPath(pageKey, 'es')}`;
}
```

**Step 2: Handle dynamic routes**

For blog detail (`/es/blog/my-slug`), the hreflang should use `slugByLang`. Since SEO.tsx doesn't have access to blog post data, the blog detail page should pass explicit `hreflang` prop to `<SEO>`. Same for destination detail.

For boat detail (`/es/barco/remus-450`), only the generic prefix changes — hreflang can be auto-generated by detecting the dynamic param and appending it.

**Step 3: Update canonical generation**

Each language version gets self-referencing canonical:
```typescript
// canonical should be the full subdirectory URL, not the old path
const canonicalUrl = `${getBaseUrl()}/${lang}/${slug}${dynamicParam ? '/' + dynamicParam : ''}`;
```

**Step 4: Commit**

```bash
git add client/src/components/SEO.tsx
git commit -m "feat(i18n): update SEO hreflang and canonical to use subdirectory URLs"
```

---

### Task 7: Update server sitemaps

**Files:**
- Modify: `server/routes/sitemaps.ts`

**Step 1: Update `buildHreflangLinks()` (line 48)**

Replace `?lang=` URL generation with subdirectory URLs:

```typescript
import { getLocalizedPath, getSlugForPage } from "../../shared/i18n-routes";
import type { PageKey } from "../../shared/i18n-routes";

const buildHreflangLinks = (baseUrl: string, pageKey: PageKey): string => {
  let links = "";
  // x-default → Spanish version
  links += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${getLocalizedPath(pageKey, 'es')}"/>\n`;
  SUPPORTED_LANGUAGES.forEach(lang => {
    const code = HREFLANG_CODES[lang as keyof typeof HREFLANG_CODES];
    const path = getLocalizedPath(pageKey, lang);
    links += `    <xhtml:link rel="alternate" hreflang="${code}" href="${baseUrl}${path}"/>\n`;
  });
  return links;
};
```

**Step 2: Update `generateUrlEntry()` (line 65)**

Generate one `<url>` per language per page, each with its own `<loc>` using the translated slug:

```typescript
const generateUrlEntry = (baseUrl: string, pageKey: PageKey, priority: string, lastmod: string | null, changefreq?: string) => {
  const hreflangLinks = buildHreflangLinks(baseUrl, pageKey);
  let urls = "";
  SUPPORTED_LANGUAGES.forEach(lang => {
    const path = getLocalizedPath(pageKey, lang);
    urls += `  <url>\n    <loc>${baseUrl}${path}</loc>\n`;
    if (lastmod) urls += `    <lastmod>${lastmod}</lastmod>\n`;
    urls += `    <priority>${priority}</priority>\n`;
    if (changefreq) urls += `    <changefreq>${changefreq}</changefreq>\n`;
    urls += hreflangLinks;
    urls += `  </url>\n`;
  });
  return urls;
};
```

**Step 3: Update static page sitemap entries (line ~193)**

Replace hardcoded paths with page key references:

```typescript
// Before: generateUrlEntry(BASE_URL, "/alquiler-barcos-blanes", "0.7", ...)
// After:  generateUrlEntry(BASE_URL, "locationBlanes", "0.7", ...)
```

**Step 4: Update boat sitemap**

For each boat, generate 8 URLs with translated generic segment:
- `/es/barco/{slug}`, `/en/boat/{slug}`, `/fr/bateau/{slug}`, etc.

**Step 5: Update blog sitemap**

For each blog post, generate 8 URLs using `slugByLang` when available:
- `/es/blog/{esSlug}`, `/en/blog/{enSlug}`, `/fr/blog/{frSlug}`, etc.
- Hreflang links point to each language's version with its own slug

**Step 6: Update destination sitemap**

For each destination, generate 8 URLs with translated prefix:
- `/es/destinos/{slug}`, `/en/destinations/{slug}`, `/fr/destinations/{slug}`, etc.

**Step 7: Commit**

```bash
git add server/routes/sitemaps.ts
git commit -m "feat(i18n): update sitemaps to use subdirectory URLs with translated slugs"
```

---

### Task 8: Update server SPA route validator

**Files:**
- Modify: `server/seoInjector.ts` (lines 2508-2556)

**Step 1: Update `VALID_SPA_ROUTES` and `VALID_DYNAMIC_PATTERNS`**

The current validator uses hardcoded Spanish-only paths. Replace with pattern-based validation that supports `/:lang/` prefix:

```typescript
import { isValidLang, resolveSlug } from "../shared/i18n-routes";

export function isValidSPARoute(pathname: string): boolean {
  const cleanPath = pathname.replace(/\/$/, "") || "/";

  // Root is always valid
  if (cleanPath === "/") return true;

  const segments = cleanPath.split("/").filter(Boolean);

  // Must start with valid lang code
  if (segments.length === 0 || !isValidLang(segments[0])) {
    // Check legacy routes (for redirect middleware to handle)
    return LEGACY_ROUTES.has(cleanPath) || LEGACY_DYNAMIC_PATTERNS.some(p => p.test(cleanPath));
  }

  // /:lang/ (home)
  if (segments.length === 1) return true;

  const slug = segments[1];

  // Try to resolve as a known page
  const resolved = resolveSlug(slug);
  if (resolved) {
    // Static page: /:lang/:slug
    if (segments.length === 2) return true;
    // Dynamic page: /:lang/:slug/:param (blog detail, boat detail, etc.)
    if (segments.length === 3) return true;
    // CRM: /:lang/crm/:tab
    if (slug === "crm" && segments.length <= 3) return true;
  }

  return false;
}
```

Keep the `LEGACY_ROUTES` set (old paths without prefix) so the redirect middleware can catch them before they 404.

**Step 2: Update `STATIC_META` for `getInjectedMeta()` if needed**

The `STATIC_META` object (lines 92+) maps old paths to per-language meta. This needs updating to use `/:lang/:slug` paths instead, or the lookup function needs to extract the page key and lang from the new URL format.

**Step 3: Commit**

```bash
git add server/seoInjector.ts
git commit -m "feat(i18n): update SPA route validator for subdirectory URL patterns"
```

---

### Task 9: Server-side redirects and root redirect

**Files:**
- Modify: `server/seo/redirects.ts` (lines 103-156)
- Modify: `server/index.ts` (around line 315)

**Step 1: Update legacy redirect targets**

All existing legacy redirects in `seedLegacyRedirects()` currently point to old paths (e.g., `/alquiler-barcos-blanes`). Update them to point to new subdirectory URLs using `getLocalizedPath()`:

```typescript
import { getLocalizedPath } from "../../shared/i18n-routes";

const legacyRedirects: Record<string, string> = {
  // Old paths → new ES subdirectory
  "/destino/blanes": getLocalizedPath("locationBlanes", "es"),
  "/destino/lloret-de-mar": getLocalizedPath("locationLloret", "es"),
  // ... etc

  // Old ?lang= paths (handled separately, see Step 2)

  // Old Wix paths with /fr/, /en/, /ca/ prefix
  "/fr/excursion-barco-privado": getLocalizedPath("categoryLicensed", "fr"),
  "/en/barco-sin-licencia-blanes-solar-450": getLocalizedPath("boatDetail", "en") + "/solar-450",
  // ... etc
};
```

**Step 2: Add query-param redirect middleware**

Add middleware BEFORE the existing redirect middleware in `server/index.ts` to handle `?lang=` URLs:

```typescript
// Redirect ?lang= URLs to subdirectory equivalents
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();

  const lang = req.query.lang as string;
  if (!lang || !isValidLang(lang)) return next();

  // Resolve the path to a page key
  const pathWithoutQuery = req.path;
  // ... resolve and redirect to /{lang}/{translatedSlug}

  const slug = pathWithoutQuery.replace(/^\//, '');
  const resolved = resolveSlug(slug);
  if (resolved) {
    const newPath = getLocalizedPath(resolved.pageKey, lang);
    return res.redirect(301, newPath);
  }

  // Fallback: just prefix with lang
  return res.redirect(301, `/${lang}${pathWithoutQuery}`);
});
```

**Step 3: Add bare path redirects (no `?lang=`)**

Paths without lang prefix and without `?lang=` should redirect to ES version:

```typescript
// Add to legacyRedirects or as separate middleware
"/alquiler-barcos-blanes": "/es/alquiler-barcos-blanes",
"/precios": "/es/precios",
"/blog": "/es/blog",
// ... all currently-indexed URLs
```

Known indexed URLs to cover:
- `/`, `/precios`, `/extras`, `/privacy-policy`, `/nota-legal`
- `/destinos/blanes-lloret`, `/alquiler-barcos-blanes`
- `/condiciones-de-reserva`, `/terms-conditions`, `/boat-rental-blanes`
- `/boat-rental-costa-brava`, `/barcos-sin-licencia`, `/barcos-con-licencia`
- `/blog`, `/faq`, `/galeria`, `/rutas`, `/testimonios`
- `/tarjetas-regalo`, `/sobre-nosotros`, `/accesibilidad`

**Step 4: Server-side root `/` redirect with Accept-Language**

Add middleware for root path with language detection priority:
1. `Accept-Language` header → detect best matching language
2. Cookie `costa-brava-language` → saved preference
3. Fallback → `es`

```typescript
app.get("/", (req, res) => {
  // 1. Check Accept-Language header
  const acceptLang = req.headers["accept-language"];
  if (acceptLang) {
    const preferred = parseAcceptLanguage(acceptLang); // extract best match
    if (preferred && isValidLang(preferred)) {
      return res.redirect(302, `/${preferred}/`);
    }
  }

  // 2. Check language cookie
  const cookieLang = req.cookies?.["costa-brava-language"];
  if (cookieLang && isValidLang(cookieLang)) {
    return res.redirect(302, `/${cookieLang}/`);
  }

  // 3. Fallback
  return res.redirect(302, "/es/");
});
```

Note: Root redirect is **302** (temporary) not 301, because the destination depends on the visitor.

**Step 5: Set language cookie on navigation**

When the client calls `setLanguage()`, also set a cookie so the server can read it for the root redirect:

```typescript
// In use-language.tsx setLanguage():
document.cookie = `costa-brava-language=${lang};path=/;max-age=31536000;SameSite=Lax`;
```

**Step 6: Commit**

```bash
git add server/seo/redirects.ts server/index.ts client/src/hooks/use-language.tsx
git commit -m "feat(i18n): add server-side redirects for legacy URLs and Accept-Language root redirect"
```

---

### Task 10: Verify end-to-end

**Step 1: Run type check**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | head -30
```

**Step 2: Run tests**

```bash
npm test 2>&1 | tail -20
```

**Step 3: Manual verification checklist**

Run `npm run dev` and verify:

- [ ] `/` redirects to `/{detected-lang}/`
- [ ] `/es/` shows Spanish homepage
- [ ] `/en/` shows English homepage
- [ ] `/fr/` shows French homepage
- [ ] `/es/alquiler-barcos-blanes` loads Blanes page in Spanish
- [ ] `/en/boat-rental-blanes` loads Blanes page in English
- [ ] `/fr/location-bateau-blanes` loads Blanes page in French
- [ ] `/de/boat-rental-blanes` loads Blanes page in German (EN slug fallback)
- [ ] Language selector switches to correct translated URL
- [ ] Navigation links use correct lang prefix
- [ ] Footer links use correct lang prefix
- [ ] View source: canonical points to self (`/fr/location-bateau-blanes` has canonical to itself)
- [ ] View source: hreflang includes all 8 languages with correct subdirectory URLs
- [ ] View source: x-default points to `/es/` version
- [ ] `/alquiler-barcos-blanes` (no prefix) → 301 to `/es/alquiler-barcos-blanes`
- [ ] `/alquiler-barcos-blanes?lang=fr` → 301 to `/fr/location-bateau-blanes`
- [ ] `/boat-rental-blanes` → 301 to `/en/boat-rental-blanes`
- [ ] `/sitemap-pages.xml` shows subdirectory URLs with hreflang alternates
- [ ] Blog detail page: `/es/blog/{slug}` with `slugByLang` in hreflang
- [ ] Boat detail: `/fr/bateau/remus-450` loads correctly

**Step 4: Final commit**

```bash
git commit -m "feat(i18n): complete Phase 1 — subdirectory URLs with translated slugs for ES/EN/FR"
```
