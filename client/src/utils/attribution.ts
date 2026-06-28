// First-touch marketing attribution. Captures utm_* and fbclid from the landing
// URL once and keeps them in sessionStorage so they survive SPA navigation, then
// rides along on every booking-inquiry submit. The server stores them on the
// inquiry, which later lets us match a lead back to a confirmed booking (ROAS).

const KEY = "cb_attribution";

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fbclid?: string;
}

// Call once on app mount. First-touch wins: we never overwrite an earlier source.
export function captureAttribution(): void {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const p = new URLSearchParams(window.location.search);
    const attr: Attribution = {};
    const s = p.get("utm_source");
    const m = p.get("utm_medium");
    const c = p.get("utm_campaign");
    const f = p.get("fbclid");
    if (s) attr.utmSource = s.slice(0, 120);
    if (m) attr.utmMedium = m.slice(0, 120);
    if (c) attr.utmCampaign = c.slice(0, 200);
    if (f) attr.fbclid = f.slice(0, 255);
    if (Object.keys(attr).length > 0) sessionStorage.setItem(KEY, JSON.stringify(attr));
  } catch {
    // sessionStorage unavailable (private mode, etc.) — attribution is best-effort.
  }
}

// Returns the stored attribution, ready to spread into an inquiry POST body.
export function getAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") as Attribution;
  } catch {
    return {};
  }
}
