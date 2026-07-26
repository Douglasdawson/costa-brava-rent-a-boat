import "dotenv/config";
import { writeFileSync } from "node:fs";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { JETSKI_PRODUCTS, buildJetSkiPricing } from "../shared/jetskiProducts";

/**
 * Pushes the jet ski slot prices from the catalogue into the `boats` rows.
 *
 * `shared/jetskiProducts.ts` is the single source of truth, but the seeder
 * (server/migrations/applyBoatsSeedEnsure.ts) inserts with `ON CONFLICT (id) DO
 * NOTHING`, so it only ever creates the rows — editing a slot or adding one
 * never reaches an existing row. Without this, a new slot lives in the code and
 * the fleet card keeps quoting the old "desde X€".
 *
 * Dry run by default. `--commit` applies after writing a JSON backup.
 */
const COMMIT = process.argv.includes("--commit");
const BACKUP = "/tmp/jetski-pricing-backup.json";

const before = (
  await db.execute(sql`SELECT id, pricing FROM boats WHERE id = ANY(${sql.raw(
    `ARRAY[${JETSKI_PRODUCTS.map(p => `'${p.id}'`).join(",")}]`
  )});`)
).rows as Array<{ id: string; pricing: unknown }>;

const plan = JETSKI_PRODUCTS.map(p => {
  const current = before.find(b => b.id === p.id);
  const next = buildJetSkiPricing(p);
  const currentPrices = (current?.pricing as any)?.BAJA?.prices ?? {};
  const nextPrices = next.BAJA.prices;
  const changed =
    JSON.stringify(currentPrices) !== JSON.stringify(nextPrices);
  return { id: p.id, currentPrices, nextPrices, next, changed, exists: !!current };
});

for (const p of plan) {
  console.log(`\n${p.id}${p.exists ? "" : "  (NO EXISTE la fila)"}`);
  console.log(`  antes:  ${JSON.stringify(p.currentPrices)}`);
  console.log(`  ahora:  ${JSON.stringify(p.nextPrices)}`);
  console.log(`  ${p.changed ? "-> CAMBIA" : "sin cambios"}`);
}

const changes = plan.filter(p => p.changed && p.exists);
if (!changes.length) {
  console.log("\nNada que cambiar.");
  process.exit(0);
}
if (!COMMIT) {
  console.log("\nDry run. Repite con --commit para aplicar.");
  process.exit(0);
}

writeFileSync(BACKUP, JSON.stringify(before, null, 2));
console.log(`\nBackup: ${BACKUP}`);
for (const c of changes) {
  await db.execute(sql`UPDATE boats SET pricing = ${JSON.stringify(c.next)}::json WHERE id = ${c.id};`);
  console.log(`  ✔ ${c.id}`);
}
process.exit(0);
