import { useEffect } from 'react';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

const SESSION_KEY = 'cbrab_utm';

/**
 * On first mount, reads UTM params from URL and stores them in sessionStorage.
 * Subsequent calls are no-ops (don't overwrite on page navigation).
 * Call this once in the Router component.
 */
export function useUtmCapture(): void {
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {};
    const keys: (keyof UtmParams)[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    for (const key of keys) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }

    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(utm));
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
