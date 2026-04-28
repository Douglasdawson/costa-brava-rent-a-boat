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

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

// Service worker registration is handled by vite-plugin-pwa (registerType: "autoUpdate")
