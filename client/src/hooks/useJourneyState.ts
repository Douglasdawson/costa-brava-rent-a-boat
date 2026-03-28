import { useEffect, useCallback } from "react";

const STORAGE_KEYS = {
  lastVisit: "cbrb_lastVisit",
  lastBoat: "cbrb_lastBoat",
  lastBoatName: "cbrb_lastBoatName",
  bookingCompleted: "cbrb_bookingCompleted",
  bannerDismissed: "cbrb_bannerDismissed", // sessionStorage
} as const;

/** Minimum gap (ms) before a visitor is considered "returning" — 1 day */
const MIN_RETURN_GAP_MS = 1 * 24 * 60 * 60 * 1000;
/** Maximum gap (ms) to still show the banner — 14 days */
const MAX_RETURN_GAP_MS = 14 * 24 * 60 * 60 * 1000;

function safeGetItem(key: string, storage: Storage = localStorage): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string, storage: Storage = localStorage): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage full or blocked — fail silently
  }
}

export interface LastViewedBoat {
  id: string;
  name: string;
}

export function getLastViewedBoat(): LastViewedBoat | null {
  const id = safeGetItem(STORAGE_KEYS.lastBoat);
  const name = safeGetItem(STORAGE_KEYS.lastBoatName);
  if (!id || !name) return null;
  return { id, name };
}

export function saveLastViewedBoat(boatId: string, boatName: string): void {
  safeSetItem(STORAGE_KEYS.lastBoat, boatId);
  safeSetItem(STORAGE_KEYS.lastBoatName, boatName);
}

export function isReturnVisitor(): boolean {
  const lastVisitStr = safeGetItem(STORAGE_KEYS.lastVisit);
  if (!lastVisitStr) return false;

  const lastVisit = parseInt(lastVisitStr, 10);
  if (isNaN(lastVisit)) return false;

  const gap = Date.now() - lastVisit;
  if (gap < MIN_RETURN_GAP_MS || gap > MAX_RETURN_GAP_MS) return false;

  // Don't show if they already completed a booking
  const completed = safeGetItem(STORAGE_KEYS.bookingCompleted);
  if (completed === "true") return false;

  return true;
}

export function isBannerDismissed(): boolean {
  return safeGetItem(STORAGE_KEYS.bannerDismissed, sessionStorage) === "true";
}

export function markBannerDismissed(): void {
  safeSetItem(STORAGE_KEYS.bannerDismissed, "true", sessionStorage);
}

export function markBookingCompleted(): void {
  safeSetItem(STORAGE_KEYS.bookingCompleted, "true");
}

/**
 * Hook that records the current visit timestamp on mount.
 * Should be called once at app-level (e.g., in App or Router).
 */
export function useJourneyState() {
  useEffect(() => {
    // Record this visit — but only AFTER reading the previous value
    // so that isReturnVisitor() checks the *previous* visit, not the current one.
    const alreadyRecordedThisSession = safeGetItem("cbrb_sessionRecorded", sessionStorage);
    if (!alreadyRecordedThisSession) {
      // Delay the write so that banner logic reads the OLD timestamp first
      const timer = setTimeout(() => {
        safeSetItem(STORAGE_KEYS.lastVisit, String(Date.now()));
        safeSetItem("cbrb_sessionRecorded", "true", sessionStorage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveBoat = useCallback((boatId: string, boatName: string) => {
    saveLastViewedBoat(boatId, boatName);
  }, []);

  return {
    getLastViewedBoat,
    saveLastViewedBoat: saveBoat,
    isReturnVisitor,
    isBannerDismissed,
    markBannerDismissed,
    markBookingCompleted,
  };
}
