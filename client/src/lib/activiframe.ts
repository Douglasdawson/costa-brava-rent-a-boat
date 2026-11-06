import { ACTIVITATUM_DOMAIN } from "@shared/activitatumLinks";

interface ActiviframeApi {
  open: (o: { path?: string; lang?: string }) => boolean;
}

declare global {
  interface Window {
    Activiframe?: ActiviframeApi;
  }
}

// Activitatum serves es/ca/en/fr/de/it; nl and ru fall back to English there.
const LANGS = new Set(["es", "ca", "en", "fr", "de", "it"]);

let loading: Promise<ActiviframeApi> | null = null;

/** Loads Activitatum's embed loader once, on first click (never on page load). */
function load(): Promise<ActiviframeApi> {
  if (window.Activiframe) return Promise.resolve(window.Activiframe);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `${ACTIVITATUM_DOMAIN}/activiframe/v1.js`;
    s.onload = () => (window.Activiframe ? resolve(window.Activiframe) : reject(new Error("no api")));
    s.onerror = () => {
      loading = null;
      reject(new Error("load failed"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Opens an Activitatum page (e.g. /g/cbrb, which sets its own aff:guia-cbrb channel) in the overlay; falls back to the plain link if the script is blocked. */
export async function openActiviframe(path: string, lang: string, fallbackHref: string) {
  try {
    const api = await load();
    api.open({ path, lang: LANGS.has(lang) ? lang : "en" });
    // The loader caps the frame at 520px (phone column). On desktop let it grow so the
    // guide page shows its 3-column grid; below 900px keep the loader's own sizing.
    if (window.innerWidth >= 900) {
      const frame = document.querySelector<HTMLIFrameElement>('[role="dialog"][aria-label="Activitatum"] iframe');
      if (frame) frame.style.maxWidth = "min(1120px, 100%)";
    }
  } catch {
    window.open(fallbackHref, "_blank", "noopener");
  }
}
