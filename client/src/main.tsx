import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./hooks/use-theme";
import "./index.css";

// Remove SSR body fallback (injected by server/seoInjector.ts on boat detail
// pages so crawlers see semantic content even without JS). Removing it BEFORE
// createRoot avoids React hydration mismatch warnings — the root container is
// empty when React mounts, exactly as it expects.
const seoFallback = document.getElementById("seo-fallback");
if (seoFallback) seoFallback.remove();

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
  window.matchMedia?.("(display-mode: standalone)").addEventListener("change", () => apply(detect()));
})();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

// Service worker registration is handled by vite-plugin-pwa (registerType: "autoUpdate")
