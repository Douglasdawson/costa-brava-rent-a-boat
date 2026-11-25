/**
 * After a deploy the installed service worker still serves the previous shell once; the new worker installs in
 * the background and takes over (skipWaiting + clientsClaim), but nothing reloaded the page, so visitors kept the
 * old build until their next visit (and a half-updated one broke: old HTML pointing at purged hashed chunks).
 * This reloads onto the new build by itself, without anyone clearing cache.
 *
 * Safeguards: first-ever install is ignored (nothing stale to replace), a reload is never forced while the
 * booking modal is open or a field has focus (it waits until the tab is hidden), and one reload per minute at most.
 */

const RELOAD_KEY = "sw-auto-reload-at";
const MIN_GAP_MS = 60_000;
const CHECK_GAP_MS = 5 * 60_000;

const isBusy = (): boolean => {
  if (document.querySelector(".booking-modal, [role=dialog][data-state=open]")) return true;
  const tag = document.activeElement?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

/** Returns whether it actually reloaded (false when the once-per-minute guard held it back). */
const reloadOnce = (): boolean => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < MIN_GAP_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage blocked (private mode): reload anyway, controllerchange fires once per worker swap.
  }
  window.location.reload();
  return true;
};

export function initSwAutoUpdate(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const sw = navigator.serviceWorker;
  let pending = false;

  const onNewWorker = () => {
    if (isBusy()) pending = true;
    else reloadOnce();
  };
  // Very first visit: the worker is registered after this runs and clientsClaim fires one controllerchange that is
  // not an update. Any later swap (also on a page that started with no controller, e.g. after a hard reload) is.
  let ignoreFirstClaim = false;
  void sw
    .getRegistration()
    .then(reg => {
      ignoreFirstClaim = !reg;
    })
    .catch(() => {});
  sw.addEventListener("controllerchange", () => {
    if (ignoreFirstClaim) {
      ignoreFirstClaim = false;
      return;
    }
    onNewWorker();
  });

  let lastCheck = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      // Hidden is not "done": the user may have just switched to WhatsApp mid-booking. Still busy = keep waiting.
      if (pending && !isBusy()) {
        pending = false;
        reloadOnce();
      }
    } else if (Date.now() - lastCheck > CHECK_GAP_MS) {
      // A tab kept alive for days (iOS keeps them) only checks for a new worker on navigation; ask again on return.
      lastCheck = Date.now();
      void sw
        .getRegistration()
        .then(reg => reg?.update())
        .catch(() => {});
    }
  });

  // A lazy chunk 404s when a deploy purged it from under an open page: the page can't recover by itself.
  window.addEventListener("vite:preloadError", event => {
    // Swallow the error only when we really reload: otherwise let it throw, or React.lazy gets `undefined`.
    if (reloadOnce()) event.preventDefault();
  });
}
