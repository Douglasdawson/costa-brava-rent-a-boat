/**
 * Idempotent runtime schema sync + seed for the merch shop tables.
 *
 * Background: Replit `Republish` wipes tables added to shared/schema.ts after
 * the last full Publish (same root cause as applyPricingOverridesEnsure).
 * The shop tables (`shop_products`, `shop_variants`, `shop_orders`,
 * `shop_order_items`) are new, so this runner both re-creates them (DDL is
 * fully idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS)
 * and re-seeds the catalogue rows from `shared/shopData.ts` with
 * `ON CONFLICT DO NOTHING` — CRM edits to price/stock/active are NEVER
 * overwritten; only missing rows are restored (with default seed stock).
 *
 * Hook from server/index.ts next to applyBoatsSeedEnsure, BEFORE
 * registerRoutes.
 */

import type { Pool } from "@neondatabase/serverless";
import { SHOP_PRODUCTS, DEFAULT_INITIAL_STOCK } from "@shared/shopData";
import { audit } from "../lib/audit";

// Distinct advisory-lock id (random 64-bit signed int — must not collide
// with the analytics, pricing, seo-url-inspections, ai_bot_visits or boats ids).
const ADVISORY_LOCK_ID = 7731504298156237n;

const DDL = `
CREATE TABLE IF NOT EXISTS shop_products (
  id varchar PRIMARY KEY,
  price_cents integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_variants (
  sku varchar PRIMARY KEY,
  product_id varchar NOT NULL REFERENCES shop_products(id),
  color varchar(20),
  size varchar(5),
  stock integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS shop_variants_product_id_idx ON shop_variants (product_id);

CREATE TABLE IF NOT EXISTS shop_orders (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id varchar NOT NULL UNIQUE,
  stripe_payment_intent_id varchar,
  customer_name text,
  customer_email text,
  delivery_method varchar(20) NOT NULL DEFAULT 'pickup_port',
  shipping_address jsonb,
  subtotal_cents integer NOT NULL,
  shipping_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  status varchar(12) NOT NULL DEFAULT 'pending',
  language varchar(5) NOT NULL DEFAULT 'es',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  fulfilled_at timestamptz
);
CREATE INDEX IF NOT EXISTS shop_orders_status_idx ON shop_orders (status);

CREATE TABLE IF NOT EXISTS shop_order_items (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id varchar NOT NULL REFERENCES shop_orders(id),
  sku varchar NOT NULL,
  product_id varchar NOT NULL,
  quantity integer NOT NULL,
  unit_price_cents integer NOT NULL
);
CREATE INDEX IF NOT EXISTS shop_order_items_order_id_idx ON shop_order_items (order_id);

-- Widen delivery_method for the two pickup points (pickup_port / pickup_laura);
-- idempotent, covers tables created before the third option was added.
ALTER TABLE shop_orders ALTER COLUMN delivery_method TYPE varchar(20);
ALTER TABLE shop_orders ALTER COLUMN delivery_method SET DEFAULT 'pickup_port';
`;

export async function applyShopSeedEnsure(pool: Pool): Promise<{
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
      await client.query(DDL);

      let inserted = 0;
      for (const product of SHOP_PRODUCTS) {
        const productRes = await client.query(
          `INSERT INTO shop_products (id, price_cents, active)
           VALUES ($1, $2, true)
           ON CONFLICT (id) DO NOTHING`,
          [product.id, product.defaultPriceCents],
        );
        if (productRes.rowCount && productRes.rowCount > 0) {
          inserted++;
          audit(null, "restore", "shop_product", product.id, {
            source: "boot-seeder",
            trigger: "missing-after-boot",
            fileSource: "shared/shopData.ts",
          });
        }

        for (const variant of product.variants) {
          const stock = DEFAULT_INITIAL_STOCK[variant.sku] ?? 0;
          const variantRes = await client.query(
            `INSERT INTO shop_variants (sku, product_id, color, size, stock, active)
             VALUES ($1, $2, $3, $4, $5, true)
             ON CONFLICT (sku) DO NOTHING`,
            [variant.sku, product.id, variant.color, variant.size ?? null, stock],
          );
          if (variantRes.rowCount && variantRes.rowCount > 0) inserted++;
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
