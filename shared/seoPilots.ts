/**
 * SEO pilot configurations.
 *
 * Each pilot represents a hypothesis we shipped (a code/content change to
 * measure SEO impact of) with a scheduled measurement date. The cron in
 * server/seo/worker.ts runs hourly, finds pilots whose scheduledFor has
 * passed and not yet been measured, and writes a row to seo_pilot_runs.
 *
 * Adding a new pilot:
 * 1. Append to PILOTS below with: key, scheduledFor, baseline, queries, slugs.
 * 2. Deploy. The cron runs the measurement on or after scheduledFor.
 * 3. Read result via GET /api/admin/seo-pilots.
 *
 * Lifecycle:
 * - Pilots stay in this file forever (history). Once measured, the cron
 *   skips them on subsequent runs (idempotency via unique pilotKey + scheduledFor
 *   composite check).
 * - To re-measure (e.g. T+42d), add a new entry with same key but later date.
 */

export interface PilotBaseline {
  /** GSC position of the dedicated landing for the primary query, pre-fix. */
  dedicatedPositionPre: number;
  /** GSC position of the home for the primary query, pre-fix. */
  homePositionPre: number;
  /** Number of URLs (out of `slugs.length`) that had Soft 404 / no data pre-fix. */
  preFixSoft404Count: number;
  /** Notes for human readers of the run record. */
  notes: string;
}

export interface PilotConfig {
  /** Stable identifier; never change once a pilot has run. */
  key: string;
  /** Human-friendly title for reports. */
  name: string;
  /** When to run the measurement. The cron picks it up on or after this. */
  scheduledFor: Date;
  /** GSC queries to inspect. The first is the primary KPI. */
  queries: string[];
  /** Substring match for url_inspections (e.g. "costa-brava"). */
  pathPrefix: string;
  /** The 8 (or N) language slugs of the landing — used to identify "dedicated" pages in GSC results. */
  slugs: string[];
  /** Baseline data captured pre-fix; cron compares run results against this. */
  baseline: PilotBaseline;
  /** Verdict thresholds — applied as: dedicated.position <= top → VERDE; <= mid → AMBAR; else ROJO. */
  thresholds: {
    /** dedicated landing avg_position must be ≤ this to be VERDE */
    greenPositionMax: number;
    /** dedicated landing avg_position must be ≤ this to be at least AMBAR */
    amberPositionMax: number;
  };
}

/**
 * Active pilots. Past pilots stay here for history; the cron is idempotent.
 */
export const PILOTS: PilotConfig[] = [
  {
    key: "costa-brava-ssr-multilang",
    name: "Costa Brava SSR multilang body fallback",
    // T+21d from 2026-05-03 deploy. 09:00 Madrid = 07:00 UTC.
    scheduledFor: new Date("2026-05-24T07:00:00Z"),
    queries: [
      "alquiler barcos costa brava",
      "alquilar barco costa brava",
      "alquiler barco costa brava",
      "rent boat costa brava",
      "boat rental costa brava",
    ],
    pathPrefix: "costa-brava",
    slugs: [
      "alquiler-barcos-costa-brava",
      "boat-rental-costa-brava",
      "location-bateau-costa-brava",
      "boot-mieten-costa-brava",
      "boot-huren-costa-brava",
      "noleggio-barca-costa-brava",
      "lloguer-vaixell-costa-brava",
      "arenda-lodki-costa-brava",
    ],
    baseline: {
      dedicatedPositionPre: 76,
      homePositionPre: 10,
      preFixSoft404Count: 7,
      notes: "Pre-fix /es/alquiler-barcos-costa-brava ranked pos 76 vs home pos 10 for the primary query. The 7 non-ES variants were Soft 404 / noindex due to translation duplicate detection. Fix shipped 2026-05-03 (commits 0021b58 + 93acc58): SSR body fallback per-locale + indexable allowlist.",
    },
    thresholds: {
      greenPositionMax: 20,
      amberPositionMax: 50,
    },
  },
];

/**
 * Find pilots that should be measured: scheduledFor has passed AND we haven't
 * already measured this exact (key, scheduledFor) tuple. Idempotency check is
 * done in the runner via DB.
 */
export function pilotsDueAt(now: Date): PilotConfig[] {
  return PILOTS.filter((p) => p.scheduledFor.getTime() <= now.getTime());
}
