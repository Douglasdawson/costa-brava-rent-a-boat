import { useEffect } from 'react';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
}

const SESSION_KEY = 'cbrab_utm';

/** Click ID parameter names that should also be stored in first-party cookies */
const CLICK_ID_KEYS = ['gclid', 'fbclid', 'msclkid'] as const;

// ---------------------------------------------------------------------------
// First-party cookie helpers for cross-session click ID attribution
// ---------------------------------------------------------------------------

function setClickIdCookie(name: string, value: string, days: number = 90): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

export function getClickIdCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Returns stored click IDs from first-party cookies.
 * Useful for attaching attribution data to conversion events.
 */
export function getStoredClickIds(): {
  gclid?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  msclkid?: string;
} {
  return {
    gclid: getClickIdCookie('_gcl_aw') || undefined,
    fbclid: getClickIdCookie('_fbc') || undefined,
    fbc: getClickIdCookie('_fbc') || undefined,
    fbp: getClickIdCookie('_fbp') || undefined,
    msclkid: getClickIdCookie('_msclkid') || undefined,
  };
}

/** Check whether the user has granted ad_storage consent */
function hasAdStorageConsent(): boolean {
  return localStorage.getItem('cookieConsent') === 'accepted';
}

/**
 * On first mount, reads UTM params and click IDs from URL and stores them.
 * - UTMs go to sessionStorage (session-scoped).
 * - Click IDs (gclid, fbclid, msclkid) go to first-party cookies with 90-day
 *   expiry for cross-session attribution — but ONLY when ad_storage consent
 *   has been granted (GDPR compliance).
 *
 * Subsequent calls are no-ops (don't overwrite on page navigation).
 * Call this once in the Router component.
 */
export function useUtmCapture(): void {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // --- UTM params (sessionStorage, captured once per session) ---
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const utm: UtmParams = {};
      const utmKeys: (keyof UtmParams)[] = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'gclid', 'fbclid', 'msclkid',
      ];
      for (const key of utmKeys) {
        const val = params.get(key);
        if (val) utm[key] = val;
      }

      if (Object.keys(utm).length > 0) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(utm));
      }
    }

    // --- Click ID cookies (only with ad_storage consent) ---
    if (!hasAdStorageConsent()) return;

    for (const key of CLICK_ID_KEYS) {
      const val = params.get(key);
      if (!val) continue;

      if (key === 'gclid') {
        setClickIdCookie('_gcl_aw', val);
      } else if (key === 'fbclid') {
        // Meta expects fbc format: fb.1.{timestamp_ms}.{fbclid}
        const fbc = `fb.1.${Date.now()}.${val}`;
        setClickIdCookie('_fbc', fbc);
      } else if (key === 'msclkid') {
        setClickIdCookie('_msclkid', val);
      }
    }
  }, []);
}

/** Returns the UTM params captured at session start, or {} if none. */
export function getStoredUtm(): UtmParams {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
