# i18n Subdirectory Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate from `?lang=` query parameter URLs to `/:lang/slug` subdirectory URLs with translated slugs for ES/EN/FR/DE, English slugs for NL/IT/RU, and Spanish slugs for CA.

**Architecture:** A centralized slug map (`shared/i18n-routes.ts`) defines translated slugs per language. A custom wouter location hook strips the `/:lang` prefix and reverse-maps any language slug to the canonical ES route for matching. A `useLocalizedPath()` hook generates language-aware URLs for all internal links. The server's SEO injector, sitemaps, and redirect system are updated to use subdirectory URLs.

**Tech Stack:** wouter (router), React context (language), Express (server SEO/sitemaps/redirects), Drizzle (redirect DB)

---

## Task 1: Create Centralized Route Slug Map

**Files:**
- Create: `shared/i18n-routes.ts`

**Step 1: Create the slug map file**

This file exports:
1. `ROUTE_SLUGS` — maps each page key to its translated slugs per language
2. `getSlugForPage(pageKey, lang)` — returns the slug for a page in a given language
3. `resolveSlug(slug)` — reverse lookup: given any slug, returns `{ pageKey, lang }`
4. `getLocalizedPath(pageKey, lang, params?)` — returns full path like `/fr/location-bateaux-blanes`
5. `SUPPORTED_LANGS` and `isValidLang()` — language validation

```typescript
// shared/i18n-routes.ts
import type { LangCode } from "./seoConstants";
import { SUPPORTED_LANGUAGES } from "./seoConstants";

// Route slug definitions per language
// ES, EN, FR, DE have translated slugs
// CA uses ES slugs, NL/IT/RU use EN slugs
export const ROUTE_SLUGS: Record<string, Partial<Record<LangCode, string>>> = {
  home: { es: "", en: "", fr: "", de: "", ca: "", nl: "", it: "", ru: "" },

  // Location pages
  locationBlanes: {
    es: "alquiler-barcos-blanes",
    en: "boat-rental-blanes",
    fr: "location-bateaux-blanes",
    de: "bootsverleih-blanes",
  },
  locationLloret: {
    es: "alquiler-barcos-lloret-de-mar",
    en: "boat-rental-lloret-de-mar",
    fr: "location-bateaux-lloret-de-mar",
    de: "bootsverleih-lloret-de-mar",
  },
  locationTossa: {
    es: "alquiler-barcos-tossa-de-mar",
    en: "boat-rental-tossa-de-mar",
    fr: "location-bateaux-tossa-de-mar",
    de: "bootsverleih-tossa-de-mar",
  },
  locationMalgrat: {
    es: "alquiler-barcos-malgrat-de-mar",
    en: "boat-rental-malgrat-de-mar",
    fr: "location-bateaux-malgrat-de-mar",
    de: "bootsverleih-malgrat-de-mar",
  },
  locationSantaSusanna: {
    es: "alquiler-barcos-santa-susanna",
    en: "boat-rental-santa-susanna",
    fr: "location-bateaux-santa-susanna",
    de: "bootsverleih-santa-susanna",
  },
  locationCalella: {
    es: "alquiler-barcos-calella",
    en: "boat-rental-calella",
    fr: "location-bateaux-calella",
    de: "bootsverleih-calella",
  },
  locationPinedaDeMar: {
    es: "alquiler-barcos-pineda-de-mar",
    en: "boat-rental-pineda-de-mar",
    fr: "location-bateaux-pineda-de-mar",
    de: "bootsverleih-pineda-de-mar",
  },
  locationPalafolls: {
    es: "alquiler-barcos-palafolls",
    en: "boat-rental-palafolls",
    fr: "location-bateaux-palafolls",
    de: "bootsverleih-palafolls",
  },
  locationTordera: {
    es: "alquiler-barcos-tordera",
    en: "boat-rental-tordera",
    fr: "location-bateaux-tordera",
    de: "bootsverleih-tordera",
  },
  locationBarcelona: {
    es: "alquiler-barcos-cerca-barcelona",
    en: "boat-rental-near-barcelona",
    fr: "location-bateaux-pres-barcelone",
    de: "bootsverleih-nahe-barcelona",
  },
  locationCostaBrava: {
    es: "alquiler-barcos-costa-brava",
    en: "boat-rental-costa-brava",
    fr: "location-bateaux-costa-brava",
    de: "bootsverleih-costa-brava",
  },

  // Category pages
  categoryLicenseFree: {
    es: "barcos-sin-licencia",
    en: "boats-without-license",
    fr: "bateaux-sans-permis",
    de: "boote-ohne-fuehrerschein",
  },
  categoryLicensed: {
    es: "barcos-con-licencia",
    en: "boats-with-license",
    fr: "bateaux-avec-permis",
    de: "boote-mit-fuehrerschein",
  },

  // Content pages
  blog: { es: "blog", en: "blog", fr: "blog", de: "blog" },
  faq: { es: "faq", en: "faq", fr: "faq", de: "faq" },
  gallery: {
    es: "galeria",
    en: "gallery",
    fr: "galerie",
    de: "galerie",
  },
  routes: {
    es: "rutas",
    en: "routes",
    fr: "itineraires",
    de: "routen",
  },
  pricing: {
    es: "precios",
    en: "prices",
    fr: "tarifs",
    de: "preise",
  },
  testimonials: {
    es: "testimonios",
    en: "testimonials",
    fr: "temoignages",
    de: "bewertungen",
  },
  giftCards: {
    es: "tarjetas-regalo",
    en: "gift-cards",
    fr: "cartes-cadeaux",
    de: "geschenkkarten",
  },
  about: {
    es: "sobre-nosotros",
    en: "about",
    fr: "a-propos",
    de: "ueber-uns",
  },
  destinations: {
    es: "destinos",
    en: "destinations",
    fr: "destinations",
    de: "reiseziele",
  },

  // Dynamic route prefixes
  boatDetail: {
    es: "barco",
    en: "boat",
    fr: "bateau",
    de: "boot",
  },
  blogDetail: {
    es: "blog",
    en: "blog",
    fr: "blog",
    de: "blog",
  },
  destinationDetail: {
    es: "destinos",
    en: "destinations",
    fr: "destinations",
    de: "reiseziele",
  },

  // Activity pages
  activitySnorkel: {
    es: "excursion-snorkel-barco-blanes",
    en: "snorkel-boat-trip-blanes",
    fr: "excursion-snorkel-bateau-blanes",
    de: "schnorchel-bootsausflug-blanes",
  },
  activityFamilies: {
    es: "barco-familias-costa-brava",
    en: "family-boat-costa-brava",
    fr: "bateau-famille-costa-brava",
    de: "familien-boot-costa-brava",
  },
  activitySunset: {
    es: "sunset-boat-trip-blanes",
    en: "sunset-boat-trip-blanes",
    fr: "croisiere-coucher-soleil-blanes",
    de: "sonnenuntergang-bootsfahrt-blanes",
  },
  activityFishing: {
    es: "pesca-barco-blanes",
    en: "fishing-boat-blanes",
    fr: "peche-bateau-blanes",
    de: "angel-boot-blanes",
  },

  // Legal pages (no translation needed)
  privacyPolicy: { es: "privacy-policy", en: "privacy-policy", fr: "privacy-policy", de: "privacy-policy" },
  termsConditions: { es: "terms-conditions", en: "terms-conditions", fr: "terms-conditions", de: "terms-conditions" },
  cookiesPolicy: { es: "cookies-policy", en: "cookies-policy", fr: "cookies-policy", de: "cookies-policy" },
  condicionesGenerales: { es: "condiciones-generales", en: "general-conditions", fr: "conditions-generales", de: "allgemeine-bedingungen" },
  accessibility: { es: "accesibilidad", en: "accessibility", fr: "accessibilite", de: "barrierefreiheit" },

  // App pages (no public SEO, keep same slug)
  login: { es: "login", en: "login", fr: "login", de: "login" },
  crm: { es: "crm", en: "crm", fr: "crm", de: "crm" },
  myAccount: { es: "mi-cuenta", en: "my-account", fr: "mon-compte", de: "mein-konto" },
  booking: { es: "booking", en: "booking", fr: "booking", de: "booking" },
  onboarding: { es: "onboarding", en: "onboarding", fr: "onboarding", de: "onboarding" },
};

/**
 * Get the slug for a page in a specific language.
 * Falls back: CA → ES, NL/IT/RU → EN, then ES.
 */
export function getSlugForPage(pageKey: string, lang: LangCode): string {
  const slugs = ROUTE_SLUGS[pageKey];
  if (!slugs) return "";

  if (slugs[lang]) return slugs[lang]!;

  // Fallback chain
  if (lang === "ca") return slugs["es"] || "";
  if (lang === "nl" || lang === "it" || lang === "ru") return slugs["en"] || slugs["es"] || "";

  return slugs["es"] || "";
}

/**
 * Build a full localized path: /:lang/:slug
 * For dynamic routes, pass params: getLocalizedPath("boatDetail", "fr", "astec-480") → "/fr/bateau/astec-480"
 */
export function getLocalizedPath(pageKey: string, lang: LangCode, params?: string): string {
  const slug = getSlugForPage(pageKey, lang);
  let path = `/${lang}`;
  if (slug) path += `/${slug}`;
  if (params) path += `/${params}`;
  return path;
}

// Build reverse lookup map: slug → { pageKey, originalLang }
// This is used by the router to match any language slug to its page
let _reverseMap: Map<string, { pageKey: string }> | null = null;

function buildReverseMap(): Map<string, { pageKey: string }> {
  if (_reverseMap) return _reverseMap;
  _reverseMap = new Map();

  for (const [pageKey, slugs] of Object.entries(ROUTE_SLUGS)) {
    for (const [, slug] of Object.entries(slugs)) {
      if (slug && !_reverseMap.has(slug)) {
        _reverseMap.set(slug, { pageKey });
      }
    }
  }

  return _reverseMap;
}

/**
 * Resolve a slug to its page key.
 * Returns null if no match found.
 */
export function resolveSlug(slug: string): { pageKey: string } | null {
  return buildReverseMap().get(slug) || null;
}

/**
 * Convert current path slug to the equivalent in target language.
 * Used for language switching: user is on /fr/location-bateaux-blanes → switch to DE → /de/bootsverleih-blanes
 */
export function switchLanguagePath(currentPath: string, targetLang: LangCode): string {
  // Parse: /currentLang/slug/params...
  const parts = currentPath.split("/").filter(Boolean);
  if (parts.length === 0) return `/${targetLang}`;

  const currentLang = parts[0];
  if (!isValidLang(currentLang)) return `/${targetLang}`;

  if (parts.length === 1) {
    // Home page
    return `/${targetLang}`;
  }

  const slug = parts[1];
  const remainingParams = parts.slice(2).join("/");

  // Try to find the page key for this slug
  const resolved = resolveSlug(slug);
  if (resolved) {
    const targetSlug = getSlugForPage(resolved.pageKey, targetLang);
    let path = `/${targetLang}`;
    if (targetSlug) path += `/${targetSlug}`;
    if (remainingParams) path += `/${remainingParams}`;
    return path;
  }

  // Unknown slug — keep as-is with new lang prefix
  return `/${targetLang}/${parts.slice(1).join("/")}`;
}

export function isValidLang(lang: string): lang is LangCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit shared/i18n-routes.ts`

**Step 3: Commit**

```bash
git add shared/i18n-routes.ts
git commit -m "feat(i18n): add centralized route slug map for subdirectory migration"
```

---

## Task 2: Refactor Language Hook to Read from URL Path

**Files:**
- Modify: `client/src/hooks/use-language.tsx`

**Step 1: Update LanguageProvider to read language from URL path**

The hook needs to:
1. Extract language from URL path first segment (`/fr/...` → `fr`)
2. Fall back to localStorage → browser detection (for root `/` redirect)
3. Provide `localizedPath(pageKey, params?)` helper using current language
4. Provide `switchLanguageUrl(targetLang)` for language selector

Replace the entire `use-language.tsx` with:

```typescript
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useLocation } from 'wouter';
import { trackLanguageChange } from "@/utils/analytics";
import { isValidLang, getLocalizedPath, switchLanguagePath } from "@shared/i18n-routes";
import type { LangCode } from "@shared/seoConstants";

export type Language = LangCode;

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language || navigator.languages?.[0] || 'es';
  const langCode = browserLang.toLowerCase().split('-')[0];
  return isValidLang(langCode) ? langCode : 'es';
}

function extractLangFromPath(pathname: string): Language | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length > 0 && isValidLang(parts[0])) {
    return parts[0] as Language;
  }
  return null;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
  localizedPath: (pageKey: string, params?: string) => string;
  switchLanguageUrl: (targetLang: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [language, setLanguageState] = useState<Language>('es');
  const [isLoading, setIsLoading] = useState(true);

  // Extract language from URL on mount and URL changes
  useEffect(() => {
    const pathLang = extractLangFromPath(window.location.pathname);

    if (pathLang) {
      setLanguageState(pathLang);
      localStorage.setItem('costa-brava-language', pathLang);
      setIsLoading(false);
      return;
    }

    // Legacy ?lang= support (for redirects that haven't been caught by server)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang') as Language;
    if (urlLang && isValidLang(urlLang)) {
      setLanguageState(urlLang);
      localStorage.setItem('costa-brava-language', urlLang);
      setIsLoading(false);
      return;
    }

    // No language in URL — redirect to /:lang/
    const savedLang = localStorage.getItem('costa-brava-language') as Language;
    const detectedLang = (savedLang && isValidLang(savedLang)) ? savedLang : detectBrowserLanguage();
    setLanguageState(detectedLang);
    localStorage.setItem('costa-brava-language', detectedLang);

    // Redirect root to /:lang/
    if (window.location.pathname === '/' || !pathLang) {
      setLocation(`/${detectedLang}${window.location.pathname === '/' ? '' : window.location.pathname}`);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    trackLanguageChange(language, lang);
    setLanguageState(lang);
    localStorage.setItem('costa-brava-language', lang);

    // Navigate to equivalent page in new language
    const newPath = switchLanguagePath(window.location.pathname, lang);
    setLocation(newPath);
  }, [language, setLocation]);

  const localizedPathFn = useCallback((pageKey: string, params?: string) => {
    return getLocalizedPath(pageKey, language, params);
  }, [language]);

  const switchLanguageUrlFn = useCallback((targetLang: Language) => {
    return switchLanguagePath(window.location.pathname, targetLang);
  }, []);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      isLoading,
      localizedPath: localizedPathFn,
      switchLanguageUrl: switchLanguageUrlFn,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add client/src/hooks/use-language.tsx
git commit -m "feat(i18n): refactor language hook to read from URL path"
```

---

## Task 3: Refactor Router with Language Prefix

**Files:**
- Modify: `client/src/App.tsx`

**Step 1: Create a LanguageRouter wrapper**

The approach: use a `LanguageRouter` component that:
1. Extracts `/:lang` from the current URL path
2. Sets language context
3. Uses a `PageResolver` for slug-based route matching

Replace the `Router` component. Key changes:
- Add `<Route path="/">` that redirects to `/:defaultLang/`
- Add `<Route path="/:lang">` for the home page
- For translatable pages, use a `<Route path="/:lang/:slug*">` catch-all with a `PageResolver`
- Keep admin/auth routes under `/:lang/` prefix too, but with fixed slugs

The `BoatPage` component needs to use the language-aware boat prefix:

```typescript
// Update BoatPage to handle translated prefix
function BoatPage({ boatId }: { boatId: string }) {
  return <BoatDetailPage boatId={boatId} />;
}
```

The `PageResolver` component:

```typescript
import { resolveSlug } from "@shared/i18n-routes";

// Maps pageKey → lazy component
const PAGE_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  locationBlanes: LocationBlanesPage,
  locationLloret: LocationLloretPage,
  locationTossa: LocationTossaPage,
  // ... all other pages
};

function PageResolver() {
  const { language } = useLanguage();
  const [location] = useLocation();

  // Parse: /:lang/:slug/:params...
  const parts = location.split('/').filter(Boolean);
  const lang = parts[0];
  const slug = parts[1] || '';
  const params = parts.slice(2).join('/');

  const resolved = resolveSlug(slug);
  if (!resolved) {
    return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
  }

  // Handle dynamic routes (boat, blog, destination detail)
  if (resolved.pageKey === 'boatDetail' && params) {
    return <Suspense fallback={<MainRouteFallback />}><BoatDetailPage boatId={params} /></Suspense>;
  }
  if (resolved.pageKey === 'blogDetail' && params) {
    return <Suspense fallback={<SecondaryRouteFallback />}><BlogDetailPage /></Suspense>;
  }
  if (resolved.pageKey === 'destinationDetail' && params) {
    return <Suspense fallback={<SecondaryRouteFallback />}><DestinationDetailPage /></Suspense>;
  }

  const Component = PAGE_COMPONENTS[resolved.pageKey];
  if (!Component) {
    return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
  }

  return <Suspense fallback={<SecondaryRouteFallback />}><Component /></Suspense>;
}
```

Update the `Router` component:

```typescript
function Router() {
  useUtmCapture();
  usePageViewTracking();

  return (
    <Switch>
      {/* Root redirect */}
      <Route path="/">
        {() => {
          const lang = localStorage.getItem('costa-brava-language') || 'es';
          return <Redirect to={`/${lang}`} />;
        }}
      </Route>

      {/* Home page */}
      <Route path="/:lang">
        {(params) => {
          if (!isValidLang(params.lang)) return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
          return <HomePage />;
        }}
      </Route>

      {/* Cancel booking (special: has token param, no lang translation) */}
      <Route path="/:lang/cancel/:token">
        {() => <Suspense fallback={<MinimalRouteFallback />}><CancelBookingPage /></Suspense>}
      </Route>

      {/* CRM with optional tab */}
      <Route path="/:lang/crm/:tab?">
        {() => <Suspense fallback={<MinimalRouteFallback />}><CRMDashboardPage /></Suspense>}
      </Route>

      {/* All other routes resolved by slug */}
      <Route path="/:lang/:rest*">
        {() => <PageResolver />}
      </Route>
    </Switch>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat(i18n): refactor router with /:lang prefix and PageResolver"
```

---

## Task 4: Update Navigation and Footer Links

**Files:**
- Modify: `client/src/components/Navigation.tsx`
- Modify: `client/src/components/Footer.tsx`

**Step 1: Update Navigation.tsx**

Replace all hardcoded `href="/"` with `localizedPath("home")` from `useLanguage()`:

```typescript
const { language, localizedPath } = useLanguage();

// Replace:  href="/"
// With:     href={localizedPath("home")}

// Replace:  href="/barcos-sin-licencia"
// With:     href={localizedPath("categoryLicenseFree")}
```

All nav menu items need their `href` or `onClick(() => setLocation(...))` calls updated.

**Step 2: Update Footer.tsx**

Same pattern — replace all hardcoded paths:

```typescript
// href="/rutas"           → href={localizedPath("routes")}
// href="/blog"            → href={localizedPath("blog")}
// href="/precios"         → href={localizedPath("pricing")}
// href="/faq"             → href={localizedPath("faq")}
// href="/tarjetas-regalo" → href={localizedPath("giftCards")}
// href="/testimonios"     → href={localizedPath("testimonials")}
// href="/galeria"         → href={localizedPath("gallery")}
// href="/alquiler-barcos-blanes"        → href={localizedPath("locationBlanes")}
// href="/alquiler-barcos-lloret-de-mar" → href={localizedPath("locationLloret")}
// href="/alquiler-barcos-tossa-de-mar"  → href={localizedPath("locationTossa")}
// etc.
// href="/barcos-sin-licencia"  → href={localizedPath("categoryLicenseFree")}
// href="/barcos-con-licencia"  → href={localizedPath("categoryLicensed")}
// href="/privacy-policy"       → href={localizedPath("privacyPolicy")}
// href="/terms-conditions"     → href={localizedPath("termsConditions")}
// href="/cookies-policy"       → href={localizedPath("cookiesPolicy")}
// href="/accesibilidad"        → href={localizedPath("accessibility")}
// href="/login"                → href={localizedPath("login")}
```

**Step 3: Commit**

```bash
git add client/src/components/Navigation.tsx client/src/components/Footer.tsx
git commit -m "feat(i18n): update Navigation and Footer to use localized paths"
```

---

## Task 5: Update All Page Components with Internal Links

**Files:**
- Modify: ~40 page and component files that contain hardcoded `href="/..."` or `setLocation("/...")`

The full list from grep (182 occurrences across 45 files):

**High-priority pages (most links):**
- `client/src/pages/location-blanes.tsx` (13 links)
- `client/src/pages/boat-rental-blanes.tsx` (8)
- `client/src/pages/location-lloret-de-mar.tsx` (8)
- `client/src/pages/location-tossa-de-mar.tsx` (8)
- `client/src/pages/activity-*.tsx` (6 each × 4 = 24)
- `client/src/pages/boat-rental-costa-brava.tsx` (5)
- `client/src/pages/about.tsx` (5)
- `client/src/components/FeaturesSection.tsx` (5)

**Pattern for each file:**

1. Add `useLanguage` import if not present
2. Destructure `localizedPath` from `useLanguage()`
3. Replace each `href="/some-path"` with `href={localizedPath("pageKey")}`
4. Replace each `setLocation("/some-path")` with `setLocation(localizedPath("pageKey"))`
5. For boat detail links: `href={localizedPath("boatDetail", boatId)}`
6. For blog detail links: `href={localizedPath("blogDetail", slug)}`

**Step 1: Update all location pages**
**Step 2: Update all activity pages**
**Step 3: Update all category pages**
**Step 4: Update remaining pages (about, pricing, gallery, etc.)**
**Step 5: Update components (FeaturesSection, BoatDetailPage, BookingFlow, etc.)**
**Step 6: Commit**

```bash
git add client/src/pages/ client/src/components/
git commit -m "feat(i18n): update all internal links to use localized paths"
```

---

## Task 6: Update Server SEO Injector

**Files:**
- Modify: `server/seoInjector.ts`

This is the most critical server-side change. The SEO injector needs to:

1. Recognize `/:lang/*` URLs
2. Extract language from path instead of `?lang=` query param
3. Reverse-map any language slug to the canonical page for meta resolution
4. Generate canonical URLs with subdirectory format
5. Generate hreflang links with subdirectory format
6. Update `VALID_SPA_ROUTES` to use `/:lang/` prefixed paths
7. Update `isValidSPARoute` to handle language prefixes

**Step 1: Update `isValidSPARoute` and `VALID_SPA_ROUTES`**

```typescript
// Import route resolution
import { isValidLang, resolveSlug, ROUTE_SLUGS, getSlugForPage } from "../shared/i18n-routes";
import type { LangCode } from "../shared/seoConstants";

// Replace VALID_SPA_ROUTES — now matches /:lang/:slug format
export function isValidSPARoute(pathname: string): boolean {
  const cleanPath = pathname.replace(/\/$/, "") || "/";

  // Root redirect
  if (cleanPath === "/") return true;

  const parts = cleanPath.split("/").filter(Boolean);
  if (parts.length === 0) return true;

  const lang = parts[0];
  if (!isValidLang(lang)) return false;

  // /:lang (home)
  if (parts.length === 1) return true;

  const slug = parts[1];

  // Check known slugs
  if (resolveSlug(slug)) return true;

  // Dynamic patterns
  const resolved = resolveSlug(slug);
  if (resolved) {
    // boatDetail, blogDetail, destinationDetail need a param
    if (["boatDetail", "blogDetail", "destinationDetail"].includes(resolved.pageKey)) {
      return parts.length >= 3;
    }
    // crm with optional tab
    if (resolved.pageKey === "crm") return true;
  }

  // Special: cancel/:token
  if (slug === "cancel" && parts.length === 3) return true;

  return false;
}
```

**Step 2: Update `resolveMeta` to use language from path**

The `STATIC_META` keys currently use paths like `/alquiler-barcos-blanes`. They need to be updated to work with the new URL structure, OR `resolveMeta` needs to reverse-map the slug before lookup.

Best approach: keep `STATIC_META` keyed by Spanish paths, and in `resolveMeta`, convert the incoming `/:lang/:slug` path to the canonical Spanish path for lookup.

```typescript
async function resolveMeta(pathname: string, lang: LangCode): Promise<ResolvedPage | null> {
  // New: extract lang and slug from path
  const parts = pathname.split("/").filter(Boolean);
  const pathLang = parts[0];
  const slug = parts[1] || "";
  const params = parts.slice(2).join("/");

  // Map slug to canonical (Spanish) path for STATIC_META lookup
  let canonicalLookupPath = "/";
  if (slug) {
    const resolved = resolveSlug(slug);
    if (resolved) {
      const esSlug = getSlugForPage(resolved.pageKey, "es");
      canonicalLookupPath = `/${esSlug}`;
      if (params) canonicalLookupPath += `/${params}`;
    } else {
      canonicalLookupPath = `/${slug}`;
      if (params) canonicalLookupPath += `/${params}`;
    }
  }

  // Rest of existing logic uses canonicalLookupPath instead of pathname
  const pageMeta = STATIC_META[canonicalLookupPath];
  // ...
}
```

**Step 3: Update `serveWithSEO`**

Extract language from path instead of `?lang=`:

```typescript
// Replace:
// const langParam = parsedUrl.searchParams.get("lang");
// const lang = ([...SUPPORTED_LANGUAGES].includes(langParam) ? langParam : "es") as LangCode;

// With:
const parts = pathname.split("/").filter(Boolean);
const pathLang = parts[0];
const lang: LangCode = isValidLang(pathLang) ? pathLang : "es";
```

**Step 4: Update `injectMeta` for hreflang generation**

The hreflang tags in `injectMeta` currently use `?lang=` format. Update to use subdirectory format:

```typescript
// Replace hreflang generation to use getLocalizedPath
import { getLocalizedPath } from "../shared/i18n-routes";

// In the hreflang generation:
// Old: href="${BASE_URL}${canonicalUrl}?lang=${lang}"
// New: href="${BASE_URL}${getLocalizedPath(pageKey, lang, params)}"
```

**Step 5: Update canonical URL generation**

```typescript
// Old: canonical = BASE_URL + canonicalPath (always Spanish)
// New: canonical = BASE_URL + /:lang/:slug (language-specific)
```

**Step 6: Commit**

```bash
git add server/seoInjector.ts
git commit -m "feat(i18n): update SEO injector for subdirectory URLs"
```

---

## Task 7: Update Client-Side SEO Config

**Files:**
- Modify: `client/src/utils/seo-config.ts`

**Step 1: Update `generateHreflangLinks`**

```typescript
import { getLocalizedPath, ROUTE_SLUGS } from "@shared/i18n-routes";

export const generateHreflangLinks = (pageName: string, params?: string): Array<{ lang: string; url: string }> => {
  const languages: Language[] = ['es', 'en', 'ca', 'fr', 'de', 'nl', 'it', 'ru'];

  const hreflangLinks = languages.map(lang => {
    const path = getLocalizedPath(pageName, lang, params);
    return {
      lang: HREFLANG_CODES[lang],
      url: `${BASE_DOMAIN}${path}`,
    };
  });

  // x-default points to Spanish version
  const esPath = getLocalizedPath(pageName, 'es', params);
  hreflangLinks.push({
    lang: 'x-default',
    url: `${BASE_DOMAIN}${esPath}`,
  });

  return hreflangLinks;
};
```

**Step 2: Update `generateCanonicalUrl`**

```typescript
export const generateCanonicalUrl = (pageName: string, language: Language = 'es', params?: string): string => {
  return `${BASE_DOMAIN}${getLocalizedPath(pageName, language, params)}`;
};
```

**Step 3: Remove or update `getPagePath`**

The old `getPagePath` function is replaced by `getSlugForPage` from `i18n-routes.ts`. Update all callers.

**Step 4: Commit**

```bash
git add client/src/utils/seo-config.ts
git commit -m "feat(i18n): update client SEO config for subdirectory URLs"
```

---

## Task 8: Update Sitemaps

**Files:**
- Modify: `server/routes/sitemaps.ts`

**Step 1: Update `buildHreflangLinks`**

```typescript
import { getLocalizedPath, getSlugForPage, resolveSlug, ROUTE_SLUGS } from "../../shared/i18n-routes";

const buildHreflangLinks = (baseUrl: string, pageKey: string, params?: string): string => {
  let links = "";

  // x-default points to Spanish version
  const esPath = getLocalizedPath(pageKey, "es", params);
  links += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${esPath}"/>\n`;

  SUPPORTED_LANGUAGES.forEach(lang => {
    const hreflangCode = HREFLANG_CODES[lang as keyof typeof HREFLANG_CODES];
    const langPath = getLocalizedPath(pageKey, lang as LangCode, params);
    links += `    <xhtml:link rel="alternate" hreflang="${hreflangCode}" href="${baseUrl}${langPath}"/>\n`;
  });

  return links;
};
```

**Step 2: Update `generateUrlEntry`**

Each page now generates separate `<url>` entries for each language, each with its own unique `<loc>`:

```typescript
const generateUrlEntry = (
  baseUrl: string,
  pageKey: string,
  priority: string,
  lastmod: string | null,
  params?: string,
  changefreq?: string
) => {
  const hreflangLinks = buildHreflangLinks(baseUrl, pageKey, params);
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  const changefreqTag = changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : "";
  let urls = "";

  SUPPORTED_LANGUAGES.forEach(lang => {
    const langPath = getLocalizedPath(pageKey, lang as LangCode, params);
    urls += `  <url>
    <loc>${baseUrl}${langPath}</loc>${lastmodTag}
    <priority>${priority}</priority>${changefreqTag}
${hreflangLinks}  </url>
`;
  });

  return urls;
};
```

**Step 3: Update all sitemap routes to use pageKey instead of path**

Replace all the hardcoded path references with page keys:

```typescript
// Old: generateUrlEntry(baseUrl, "/alquiler-barcos-blanes", "0.7", null)
// New: generateUrlEntry(baseUrl, "locationBlanes", "0.7", null)
```

**Step 4: Update boats sitemap**

```typescript
// For each boat, use the boatDetail page key:
activeBoats.forEach(boat => {
  const boatHreflang = buildHreflangLinks(baseUrl, "boatDetail", boat.id);

  SUPPORTED_LANGUAGES.forEach(lang => {
    const boatPath = getLocalizedPath("boatDetail", lang as LangCode, boat.id);
    sitemap += `  <url>
    <loc>${baseUrl}${boatPath}</loc>
    ...
${boatHreflang}  </url>`;
  });
});
```

**Step 5: Update blog and destinations sitemaps similarly**

**Step 6: Commit**

```bash
git add server/routes/sitemaps.ts
git commit -m "feat(i18n): update sitemaps for subdirectory URLs"
```

---

## Task 9: Add 301 Redirects from Old URLs

**Files:**
- Modify: `server/seo/redirects.ts`
- Modify: `server/seoInjector.ts` (redirect middleware in `serveWithSEO`)

**Step 1: Update `seedLegacyRedirects` with new migration redirects**

Add redirects for all old `?lang=` URLs to their new subdirectory equivalents. Also redirect root paths without `/:lang` to `/:lang/` versions.

```typescript
// Add to legacyRedirects in seedLegacyRedirects():
const i18nMigrationRedirects: Record<string, string> = {};

// For each page in ROUTE_SLUGS:
for (const [pageKey, slugs] of Object.entries(ROUTE_SLUGS)) {
  const esSlug = slugs.es;
  if (!esSlug) continue;

  // Old Spanish URL without lang prefix → /es/slug
  i18nMigrationRedirects[`/${esSlug}`] = `/es/${esSlug}`;

  // Old ?lang=XX URLs → /XX/translated-slug
  // These are handled by middleware, not static redirects
}
```

**Step 2: Add query-param redirect middleware**

In `serveWithSEO` or as a separate middleware, before serving content:

```typescript
// If URL has ?lang= parameter, redirect to subdirectory equivalent
if (langParam && isValidLang(langParam) && !pathname.match(/^\/(es|en|fr|de|ca|nl|it|ru)\//)) {
  // Resolve the old Spanish path to a page key
  const resolved = resolveSlug(pathname.replace(/^\//, ''));
  if (resolved) {
    const newPath = getLocalizedPath(resolved.pageKey, langParam);
    return res.redirect(301, newPath);
  }
  // Fallback: just add lang prefix
  return res.redirect(301, `/${langParam}${pathname}`);
}
```

**Step 3: Update existing legacy redirects to point to new subdirectory URLs**

```typescript
// Old: "/ca/barco-sin-licencia-blanes-astec-400": "/barco/astec-400?lang=ca"
// New: "/ca/barco-sin-licencia-blanes-astec-400": "/ca/barco/astec-400" (wait — this is an old Wix URL)
// Actually these old Wix redirects should now point to /es/barco/astec-400 or /ca/boot/astec-400

// Update all targets that use ?lang= to use subdirectory format
```

**Step 4: Handle root `/` redirect**

Add to `serveWithSEO`:

```typescript
if (pathname === "/") {
  // Read preferred language from cookie/header, default to ES
  const acceptLang = req.get("Accept-Language");
  const preferred = detectPreferredLanguage(acceptLang) || "es";
  return res.redirect(302, `/${preferred}/`); // 302 because it depends on user
}
```

**Step 5: Commit**

```bash
git add server/seo/redirects.ts server/seoInjector.ts
git commit -m "feat(i18n): add 301 redirects from old ?lang= URLs to subdirectory URLs"
```

---

## Task 10: Update Language Selector Component

**Files:**
- Modify: `client/src/components/LanguageSelector.tsx` (or wherever the language selector is)

**Step 1: Update language switching**

The language selector should now navigate to the equivalent page in the target language:

```typescript
const { setLanguage } = useLanguage();

// setLanguage already handles navigation via switchLanguagePath
// No additional changes needed if Task 2 was implemented correctly
```

Verify the selector uses `setLanguage()` which now triggers navigation.

**Step 2: Commit**

```bash
git add client/src/components/LanguageSelector.tsx
git commit -m "feat(i18n): update language selector for subdirectory navigation"
```

---

## Task 11: Update SEO Component (Client-Side Meta Tags)

**Files:**
- Modify: `client/src/components/SEO.tsx`

**Step 1: Update canonical and hreflang injection**

The `SEO.tsx` component manages runtime meta tags. Update it to generate canonical URLs and hreflang with subdirectory format, using the new `generateCanonicalUrl` and `generateHreflangLinks` from the updated `seo-config.ts`.

**Step 2: Commit**

```bash
git add client/src/components/SEO.tsx
git commit -m "feat(i18n): update SEO component for subdirectory canonical/hreflang"
```

---

## Task 12: Update Prerendering System

**Files:**
- Modify: `server/prerenderedMiddleware.ts`
- Modify: prerendering script (if exists)

**Step 1: Update prerendered file naming**

The prerendered middleware currently maps `/?lang=fr` to `index__lang_fr.html`. Update to handle `/:lang/` paths:

```typescript
// New: /fr/location-bateaux-blanes → prerendered/fr/location-bateaux-blanes.html
const routePath = parsedPre.pathname;
const candidate = path.join(prerenderedDir, `${routePath}.html`);
```

**Step 2: Commit**

```bash
git add server/prerenderedMiddleware.ts
git commit -m "feat(i18n): update prerendering for subdirectory URLs"
```

---

## Task 13: Smoke Test and Verification

**Step 1: Run type check**

```bash
npm run check
```
Expected: No TypeScript errors

**Step 2: Run tests**

```bash
npm test
```
Expected: All tests pass (update test fixtures if needed)

**Step 3: Start dev server and manually verify**

```bash
npm run dev
```

Verify:
- [ ] `/` redirects to `/es/`
- [ ] `/es/` shows Spanish home page
- [ ] `/en/` shows English home page
- [ ] `/fr/location-bateaux-blanes` shows Blanes location page in French
- [ ] `/de/bootsverleih-blanes` shows Blanes location page in German
- [ ] `/nl/boat-rental-blanes` shows Blanes location page in Dutch (English slug)
- [ ] `/ca/alquiler-barcos-blanes` shows Blanes location page in Catalan (Spanish slug)
- [ ] Language selector navigates to correct translated URL
- [ ] `/alquiler-barcos-blanes?lang=fr` redirects to `/fr/location-bateaux-blanes`
- [ ] `/?lang=en` redirects to `/en/`
- [ ] Canonical URLs are language-specific
- [ ] Hreflang tags point to subdirectory URLs
- [ ] All internal links use translated paths
- [ ] Sitemap shows subdirectory URLs
- [ ] Blog, boat detail, and destination pages work with `/:lang/` prefix

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(i18n): complete migration from ?lang= to subdirectory URLs"
```
