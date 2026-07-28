import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./hooks/use-theme";
import { detectInitialLanguage, seedInitialLanguage } from "./hooks/use-language";
import { langLoaders } from "./i18n/loaders";
import { captureAttribution } from "./utils/attribution";
import "./index.css";

// Capture marketing attribution (utm_*, fbclid) from the landing URL once, before
// the SPA strips it through navigation. Rides along on booking-inquiry submits.
captureAttribution();

// Expose installed-PWA state via a data attribute so components and CSS can
// hook into it without each one importing useStandaloneDisplay. Initial state
// + reactive updates if the user moves between standalone and a regular tab
// (rare but possible on iPadOS). iOS Safari's legacy `navigator.standalone`
// is read as a fallback for older releases.
(() => {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const apply = (on: boolean) => {
    if (on) root.dataset.pwaStandalone = "true";
    else delete root.dataset.pwaStandalone;
  };
  const detect = () => {
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
    return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  };
  apply(detect());
  window
    .matchMedia?.("(display-mode: standalone)")
    .addEventListener("change", () => apply(detect()));
})();

// Locale bundles are lazy chunks since the 2026-06-11 load audit (A2): fetch
// the active one BEFORE mounting so the first React commit already has its
// translations. The SSR fallback injected by server/seoInjector.ts stays
// visible during the fetch (the server emits a modulepreload for the chunk,
// so this is one already-in-flight request, not an extra round trip) and the
// swap fallback → app happens in a single commit: no blank frame, no CLS.
const initialLang = detectInitialLanguage();
const loadBundle = langLoaders[initialLang] ?? langLoaders.es;
loadBundle()
  .then(bundle => [initialLang, bundle] as const)
  // If the locale chunk fails to load (a stale service-worker precache after a
  // deploy still points at the previous hashed file), fall back to Spanish AND
  // seed it AS SPANISH. Seeding the Spanish bundle under `initialLang` filled
  // the provider's cache with a lie: it then considered the locale loaded and
  // never retried, so the page stayed on Spanish copy with English dates
  // ("Precios para Wed, Jul 29") until the user cleared the cache. Seeded as
  // "es", the provider sees the requested locale missing and re-fetches it.
  .catch(() => langLoaders.es().then(bundle => ["es", bundle] as const))
  .then(([seededLang, bundle]) => {
    seedInitialLanguage(seededLang, bundle);
    const seoFallback = document.getElementById("seo-fallback");
    if (seoFallback) seoFallback.remove();
    createRoot(document.getElementById("root")!).render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
  });

// Service worker registration is handled by vite-plugin-pwa (registerType: "autoUpdate")
