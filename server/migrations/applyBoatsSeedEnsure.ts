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
import { JETSKI_PRODUCTS, buildJetSkiPricing } from "@shared/jetskiProducts";
import { audit } from "../lib/audit";

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
// Re-seeded from BOAT_DATA when missing. Keep this list in sync with the
// desired live fleet.
const CANONICAL_BOAT_IDS = new Set([
  "solar-450",
  "remus-450",
  "remus-450-ii",
  "astec-400",
  "astec-480",
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
        if (result.rowCount && result.rowCount > 0) {
          inserted++;
          audit(null, "restore", "boat", boat.id, {
            source: "boot-seeder",
            trigger: "missing-after-boot",
            fileSource: "shared/boatData.ts",
          });
        }
      }

      // Jet ski products resold from partner Jet Ski Blanes. Modelled as fleet
      // rows (so they show in the fleet section + admin) but kept OUT of the
      // per-hour pricing engine — their `pricing` JSON uses fixed slot keys and
      // they are filtered out of every hourly booking flow on the client.
      for (const product of JETSKI_PRODUCTS) {
        const displayOrder = 100 + JETSKI_PRODUCTS.indexOf(product);
        const result = await client.query(
          `INSERT INTO boats (
            id, name, capacity, requires_license, deposit, is_active,
            image_url, image_gallery, subtitle, description,
            specifications, equipment, included, features, pricing, extras,
            display_order, license_type
          ) VALUES (
            $1, $2, $3, false, '0.00', true,
            $4, $5, $6, $7,
            $8::json, $9, $10, $11, $12::json, $13::json,
            $14, 'none'
          )
          ON CONFLICT (id) DO NOTHING`,
          [
            product.id,
            product.name,
            product.capacity,
            product.image,
            [product.image],
            product.subtitle,
            product.description,
            JSON.stringify(product.specifications),
            product.features,
            product.included,
            product.features,
            JSON.stringify(buildJetSkiPricing(product)),
            JSON.stringify([]),
            displayOrder,
          ],
        );
        if (result.rowCount && result.rowCount > 0) {
          inserted++;
          audit(null, "restore", "boat", product.id, {
            source: "boot-seeder",
            trigger: "missing-after-boot",
            fileSource: "shared/jetskiProducts.ts",
          });
        }
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
