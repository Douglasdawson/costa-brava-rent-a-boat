/**
 * In-memory cache for LIVE fleet statistics (active boat count, license-free
 * count, price floor).
 *
 * Loaded at server startup from the DB `boats` table (filtered by `is_active`)
 * and refreshed hourly. Provides synchronous access for SSR meta/llms/ai
 * generators that can't await a DB lookup on every request — mirrors
 * businessStatsCache.
 *
 * Source of truth: `boats.is_active` (managed from the CRM). When the DB isn't
 * reachable we fall back to the static catalog minus BASELINE_INACTIVE_BOAT_IDS
 * (see shared/boatData.ts) so the fallback still yields the live 8/75, never the
 * catalog's 9/70.
 *
 * The cache holds the active boats, not the stats: the stats are recomputed per
 * call over the PUBLICLY LISTED subset, so the RD 1188/2025 switch on 2026-10-01
 * (licence-free boats leave public surfaces) happens at Madrid midnight without a
 * redeploy or a cache refresh.
 */

import { storage } from "../storage";
import { logger } from "./logger";
import {
  BASELINE_INACTIVE_BOAT_IDS,
  BOAT_DATA,
  boatDataRequiresLicense,
  computeFleetStats,
  isCaptainedBoat,
  isPubliclyListed,
  type FleetStats,
  type FleetStatBoat,
} from "../../shared/boatData";
import { isJetSkiProduct } from "../../shared/jetskiProducts";

// Static catalog minus the baseline-inactive hulls. The captained excursion is
// flagged as licensed (as its DB row is) so isPubliclyListed keeps it.
const FALLBACK: FleetStatBoat[] = Object.values(BOAT_DATA)
  .filter((b) => !BASELINE_INACTIVE_BOAT_IDS.includes(b.id))
  .map((b) => ({
    id: b.id,
    name: b.name,
    requiresLicense: boatDataRequiresLicense(b) || isCaptainedBoat(b.id),
    pricing: b.pricing,
  }));

let cached: FleetStatBoat[] = FALLBACK;
let lastLoadedAt = 0;
let lastAttemptAt = 0;
let loadingPromise: Promise<void> | null = null;
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const RETRY_BACKOFF_MS = 30 * 1000;

// At most one in-flight refresh, with a backoff after each attempt, so a failing DB
// isn't hammered by every SSR render (see businessStatsCache for the same pattern).
function triggerRefresh(): void {
  if (loadingPromise) return;
  lastAttemptAt = Date.now();
  loadingPromise = loadFromDb().finally(() => {
    loadingPromise = null;
  });
}

async function loadFromDb(): Promise<void> {
  try {
    const boats = await storage.getAllBoats();
    // Jet skis live in the boats table (resale products) but are NOT part of
    // the boat fleet: counting them inflated the public "X boats" copy to 10/6
    // when the canonical live fleet is 8/4.
    const active = boats.filter((b) => b.isActive && !isJetSkiProduct(b.id));
    if (active.length > 0) {
      const input: FleetStatBoat[] = active.map((b) => ({
        id: b.id,
        name: b.name,
        requiresLicense: b.requiresLicense,
        pricing: b.pricing,
      }));
      cached = input;
      const stats = statsFor(cached, new Date());
      logger.info("[fleetStatsCache] Loaded", {
        fleetCount: stats.fleetCount,
        licenseFreeCount: stats.licenseFreeCount,
        priceFloor: stats.priceFloor,
      });
    } else {
      logger.warn("[fleetStatsCache] No active boats in DB, using catalog fallback");
    }
    lastLoadedAt = Date.now();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "unknown";
    logger.error("[fleetStatsCache] Load error", { error: msg });
  }
}

/** Stats over the boats offered to the public at `now` (exported for tests). */
export function statsFor(boats: FleetStatBoat[], now: Date): FleetStats {
  return computeFleetStats(boats.filter((b) => isPubliclyListed(b, now)));
}

/**
 * Synchronous accessor for SSR generators. Computes the stats from the last
 * loaded boats (or the catalog fallback) and triggers a background refresh if stale.
 */
export function getFleetStats(now: Date = new Date()): FleetStats {
  const ts = Date.now();
  if (ts - lastLoadedAt > REFRESH_INTERVAL_MS && ts - lastAttemptAt > RETRY_BACKOFF_MS) {
    // Fire and forget — current call returns stale value, next call gets fresh.
    triggerRefresh();
  }
  return statsFor(cached, now);
}

/** Initialize the cache at server startup. Awaited from startScheduledServices. */
export async function initFleetStatsCache(): Promise<void> {
  await loadFromDb();
}
