import "dotenv/config";
import { writeFileSync } from "node:fs";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Align the deposit of every licence-free boat with what the CRM actually
 * charges: 200€ across the board (500€ only for boats requiring a licence).
 *
 * Why it was needed (2026-07-26): the funnel's `boats` rows had drifted from
 * production. `solar-450` announced 250€ and `excursion-privada` 500€, while
 * the CRM's `barcos` table holds 200€ for both. The static catalog
 * (shared/boatData.ts) was already correct, so only the database was stale —
 * which is why the earlier fix to boatData.ts did not change what visitors saw.
 *
 * Jet skis are skipped: they carry no deposit ("—") and do not exist in the
 * CRM's boat table, so writing 200€ there would invent a charge.
 *
 * Dry run by default. `--commit` applies and writes a JSON backup first.
 */
const COMMIT = process.argv.includes("--commit");
const TARGET = "200€";

const rows = (
  await db.execute(sql`
    SELECT id, name, requires_license, specifications->>'deposit' AS deposit
    FROM boats
    ORDER BY requires_license, id;
  `)
).rows as Array<{ id: string; name: string; requires_license: boolean; deposit: string | null }>;

const skipped = rows.filter(
  (r) => !r.requires_license && (!r.deposit || r.deposit === "—")
);
const changes = rows.filter(
  (r) => !r.requires_license && r.deposit && r.deposit !== "—" && r.deposit !== TARGET
);

console.log("=== boats ===");
for (const r of rows) {
  const mark = changes.includes(r) ? "  <-- CAMBIA" : skipped.includes(r) ? "  (sin fianza, se omite)" : "";
  console.log(`  lic=${String(r.requires_license).padEnd(5)} | ${String(r.deposit).padEnd(6)} | ${r.id}${mark}`);
}

if (changes.length === 0) {
  console.log("\nNada que cambiar.");
  process.exit(0);
}

console.log(`\n=== ${changes.length} cambio(s) ===`);
for (const r of changes) console.log(`  ${r.id}: ${r.deposit} -> ${TARGET}`);

if (!COMMIT) {
  console.log("\nDry run. Repite con --commit para aplicar.");
  process.exit(0);
}

const backup = `/tmp/boats-deposit-backup-${rows.length}.json`;
writeFileSync(backup, JSON.stringify(changes, null, 2));
console.log(`\nBackup: ${backup}`);

for (const r of changes) {
  await db.execute(sql`
    UPDATE boats
    SET specifications = jsonb_set(specifications::jsonb, '{deposit}', ${JSON.stringify(TARGET)}::jsonb)
    WHERE id = ${r.id};
  `);
  console.log(`  ✔ ${r.id}`);
}

const after = (
  await db.execute(sql`
    SELECT id, specifications->>'deposit' AS deposit
    FROM boats WHERE requires_license = false ORDER BY id;
  `)
).rows;
console.log("\n=== después ===");
console.table(after);
process.exit(0);
