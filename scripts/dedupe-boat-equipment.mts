import "dotenv/config";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Removes the duplicated equipment entries from the fleet.
 *
 * At some point a generic batch was appended to the tail of every boat —
 * "Toldo Bimini", "Equipo de seguridad", "Solárium proa y popa", "Equipo de
 * música", "Equipo de navegación", "Ducha de agua dulce" — on top of the more
 * specific entries each boat already had. The private excursion and the jet
 * skis were not part of it, which is what gives the batch away.
 *
 * It stayed invisible because one of each pair reached the customer
 * untranslated, so the two versions did not look like the same item. Once the
 * dictionary was fixed (2026-07-26) they became literal repeats: "Bimini-
 * Verdeck" twice in a row on the German page.
 *
 * Each removal below is either a spelling variant of an entry that stays, or a
 * generic restatement of something more specific that stays. The two factual
 * calls — whether the small boats have a stern sundeck, and whether the Solar
 * 450's awning is a bimini — were answered by the owner: bow only, and yes.
 *
 * Dry run by default. `--commit` applies after writing a JSON backup.
 * `--rollback` restores that backup.
 */
const COMMIT = process.argv.includes("--commit");
const ROLLBACK = process.argv.includes("--rollback");
const BACKUP = "/tmp/boats-equipment-backup.json";

/**
 * `boats.equipment` is `text[]`, NOT jsonb — unlike `specifications`, which is
 * json and is why the first version of this script tried a ::jsonb cast and was
 * rejected by Postgres. Build a proper array literal instead.
 */
const arrayLiteral = (values: string[]) =>
  `{${values.map(v => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;

/** Exact strings to drop, per boat. Everything else is left untouched. */
const DROP: Record<string, string[]> = {
  // Small licence-free boats: the batch duplicated their awning, their safety
  // kit and their sundeck. "Toldo Bi Mini" is a misspelling of the one that
  // stays; the sundeck is bow-only per the owner.
  "astec-400": ["Toldo Bi Mini", "Equipo de seguridad", "Solárium proa y popa"],
  "astec-480": ["Toldo Bi Mini", "Equipo de seguridad", "Solárium proa y popa", "Equipo de música"],
  "remus-450": ["Toldo Bi Mini", "Equipo de seguridad", "Solárium proa y popa"],
  "remus-450-ii": ["Toldo Bi Mini", "Equipo de seguridad", "Solárium proa y popa"],
  // Solar 450: its awning IS a bimini (owner), so the bare "Toldo" goes.
  "solar-450": ["Toldo", "Equipo de seguridad", "Solárium proa y popa"],
  // Licensed boats: "Ducha" is covered by "Ducha de agua dulce", the music kit
  // by "Radio bluetooth" + "Altavoces", navigation by "Sonda" + "GPS", and the
  // appended "Toldo Bimini" repeats their own "Toldo bimini".
  "mingolla-brava-19": ["Ducha", "Toldo Bimini", "Equipo de música", "Equipo de navegación"],
  "trimarchi-57s": ["Ducha", "Toldo Bimini", "Equipo de música", "Equipo de navegación"],
  // Pacific Craft: keeps the more specific "Toldo bimini inox" and its own
  // "Solárium en proa y popa"; the batch versions go.
  "pacific-craft-625": ["Toldo Bimini", "Solárium proa y popa", "Equipo de música"],
};

const rows = (
  await db.execute(sql`SELECT id, equipment FROM boats ORDER BY id;`)
).rows as Array<{ id: string; equipment: string[] | null }>;

if (ROLLBACK) {
  if (!existsSync(BACKUP)) {
    console.error(`No hay backup en ${BACKUP}`);
    process.exit(1);
  }
  const saved = JSON.parse(readFileSync(BACKUP, "utf-8")) as Array<{ id: string; equipment: string[] }>;
  for (const b of saved) {
    await db.execute(sql`UPDATE boats SET equipment = ${arrayLiteral(b.equipment)}::text[] WHERE id = ${b.id};`);
    console.log(`  restaurado ${b.id} (${b.equipment.length})`);
  }
  process.exit(0);
}

const plan = rows
  .filter(r => DROP[r.id]?.length && r.equipment)
  .map(r => {
    const before = r.equipment!;
    const drop = DROP[r.id].filter(d => before.includes(d));
    const after = before.filter(v => !drop.includes(v));
    return { id: r.id, before, after, drop, missing: DROP[r.id].filter(d => !before.includes(d)) };
  });

console.log("=== plan ===");
for (const p of plan) {
  console.log(`\n${p.id}: ${p.before.length} -> ${p.after.length}`);
  for (const d of p.drop) console.log(`   - ${d}`);
  for (const m of p.missing) console.log(`   ! no estaba, se ignora: ${m}`);
}

// Safety net: no boat should end up with a repeat under the same normalisation
// the page uses to translate, or we have only moved the problem.
const norm = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
let leftovers = 0;
for (const p of plan) {
  const keys = p.after.map(norm);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) {
    console.log(`\n  !! ${p.id} sigue con repetidos: ${dupes.join(", ")}`);
    leftovers++;
  }
}
console.log(`\nBarcos afectados: ${plan.length} · entradas fuera: ${plan.reduce((n, p) => n + p.drop.length, 0)}`);

if (!COMMIT) {
  console.log("\nDry run. Repite con --commit para aplicar.");
  process.exit(0);
}
if (leftovers) {
  console.error("\nAbortado: quedarían duplicados.");
  process.exit(1);
}

writeFileSync(BACKUP, JSON.stringify(plan.map(p => ({ id: p.id, equipment: p.before })), null, 2));
console.log(`\nBackup: ${BACKUP}  (revertir: --rollback)`);

for (const p of plan) {
  await db.execute(sql`UPDATE boats SET equipment = ${arrayLiteral(p.after)}::text[] WHERE id = ${p.id};`);
  console.log(`  ✔ ${p.id}`);
}
process.exit(0);
