/**
 * Idempotent runtime seed for the boats table.
 *
 * Background: Replit `Republish` periodically wipes data. The other ensure
 * runners (applyPricingOverridesEnsure, applySeoUrlInspectionsEnsure,
 * applyAiBotVisitsEnsure) recreate empty tables that were dropped wholesale.
 * This one handles the inverse case: the `boats` table survives, but rows
 * defined in `shared/boatData.ts` go missing — most recently
 * `excursion-privada`, which removed the captained-trip option from the fleet.
 *
 * This runner walks `BOAT_DATA` and inserts any row whose primary key is not
 * already present (`ON CONFLICT (id) DO NOTHING`). Existing rows — including
 * admin edits to prices, descriptions, gallery images or `display_order` —
 * are NEVER overwritten. Only missing canonical boats are restored.
 *
 * Hook from server/index.ts AFTER the schema-sync runners and BEFORE
 * registerRoutes.
 */

import type { Pool } from "@neondatabase/serverless";
import { BOAT_DATA } from "@shared/boatData";

// Distinct advisory-lock id (random 64-bit signed int — must not collide
// with the analytics, pricing, seo-url-inspections or ai_bot_visits ids).
const ADVISORY_LOCK_ID = 8843921056472194n;

// IDs that legally require a customer-held licence (no captain on board).
// `excursion-privada` is captained, so the customer does NOT need one.
const REQUIRES_LICENSE_IDS = new Set([
  "pacific-craft-625",
  "trimarchi-57s",
  "mingolla-brava-19",
]);

// Allow-list of canonical boat IDs that MUST exist in the live fleet.
// Re-seeded from BOAT_DATA when missing. We cannot auto-insert every key in
// BOAT_DATA because the file holds historical/deprecated entries (astec-480,
// remus-450-ii) that were renamed or replaced and should NOT reappear in the
// fleet. Keep this list in sync with the desired live fleet.
//
// Note: `astec-450` is present in the live DB but missing from BOAT_DATA —
// kept here for awareness, but the seeder cannot recreate it without source
// data. If a Republish ever drops it, this will be a separate cleanup task.
const CANONICAL_BOAT_IDS = new Set([
  "solar-450",
  "remus-450",
  "astec-400",
  "mingolla-brava-19",
  "trimarchi-57s",
  "pacific-craft-625",
  "excursion-privada",
]);

export async function applyBoatsSeedEnsure(pool: Pool): Promise<{
  applied: boolean;
  inserted: number;
  durationMs: number;
  error?: string;
}> {
  const started = Date.now();
  const client = await pool.connect();
  try {
    const lockRes = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1::bigint) AS locked",
      [ADVISORY_LOCK_ID.toString()],
    );
    const locked = lockRes.rows[0]?.locked === true;
    if (!locked) {
      return {
        applied: false,
        inserted: 0,
        durationMs: Date.now() - started,
        error: "lock-held-by-other-instance",
      };
    }

    try {
      let inserted = 0;
      const ids = Object.keys(BOAT_DATA).filter((id) => CANONICAL_BOAT_IDS.has(id));
      for (const id of ids) {
        const boat = BOAT_DATA[id];
        const capacityMatch = boat.specifications.capacity.match(/(\d+)/);
        const capacity = capacityMatch ? parseInt(capacityMatch[1], 10) : 5;
        const depositMatch = boat.specifications.deposit.match(/(\d+)/);
        const deposit = depositMatch ? `${depositMatch[1]}.00` : "0.00";
        const requiresLicense = REQUIRES_LICENSE_IDS.has(boat.id);
        const displayOrder = ids.indexOf(boat.id);

        const result = await client.query(
          `INSERT INTO boats (
            id, name, capacity, requires_license, deposit, is_active,
            image_url, image_gallery, subtitle, description,
            specifications, equipment, included, features, pricing, extras,
            display_order, license_type
          ) VALUES (
            $1, $2, $3, $4, $5, true,
            $6, $7, $8, $9,
            $10::json, $11, $12, $13, $14::json, $15::json,
            $16, 'none'
          )
          ON CONFLICT (id) DO NOTHING`,
          [
            boat.id,
            boat.name,
            capacity,
            requiresLicense,
            deposit,
            boat.image ?? null,
            [],
            boat.subtitle ?? null,
            boat.description ?? null,
            JSON.stringify(boat.specifications),
            boat.equipment,
            boat.included,
            boat.features,
            JSON.stringify(boat.pricing),
            JSON.stringify(boat.extras),
            displayOrder,
          ],
        );
        if (result.rowCount && result.rowCount > 0) inserted++;
      }
      return { applied: true, inserted, durationMs: Date.now() - started };
    } finally {
      await client.query("SELECT pg_advisory_unlock($1::bigint)", [
        ADVISORY_LOCK_ID.toString(),
      ]);
    }
  } catch (err) {
    return {
      applied: false,
      inserted: 0,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    client.release();
  }
}
