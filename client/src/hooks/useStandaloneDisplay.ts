import { useEffect, useState } from "react";

// `true` when the page is rendered inside an installed PWA window (no
// browser chrome). Watches the `(display-mode: standalone)` media query
// so the UI reacts if the user moves between standalone and a regular
// browser tab (rare but possible on iPadOS).
//
// iOS Safari historically exposes `(navigator as any).standalone` for
// home-screen apps; we also read that for older iOS releases that don't
// match the standard media query. SSR returns `false`.
export function useStandaloneDisplay(): boolean {
  const [standalone, setStandalone] = useState<boolean>(() => detect());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(display-mode: standalone)");
    const handler = () => setStandalone(detect());
    // Sync once on mount in case the media query result is fresher than
    // the value we captured during the lazy initializer.
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return standalone;
}

function detect(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari legacy fallback.
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}
