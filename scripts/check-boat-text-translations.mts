import "dotenv/config";
import { readFileSync } from "node:fs";
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { BOAT_DATA } from "../shared/boatData";

/**
 * Lists the boat texts that reach the page untranslated.
 *
 * `translateBoatText` (client/src/components/BoatDetailPage.tsx) is an
 * exact-match dictionary keyed by the Spanish string. The equipment and
 * features it translates do NOT live in the code: they are rows in `boats`,
 * edited from the CRM. So every item somebody adds there shows up in Spanish
 * in the other 7 languages, silently, and nobody finds out.
 *
 * Read-only. Run it after touching the fleet from the CRM:
 *   npx tsx scripts/check-boat-text-translations.mts
 * Exits 1 when something is missing, so it can gate a release.
 */
const DICT_FILE = "client/src/components/BoatDetailPage.tsx";
const src = readFileSync(DICT_FILE, "utf-8");
const dict = src.slice(
  src.indexOf("const boatTextTranslations"),
  src.indexOf("function translateBoatText")
);

/**
 * Same normalisation the component applies (normalizeBoatTextKey): the lookup
 * ignores case and accents, so a checker matching literally would report
 * failures that do not exist and miss the ones that do.
 */
const normalize = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");

/** Dictionary keys as written in the source: quoted, or bare identifiers. */
const dictKeys = new Set(
  [...dict.matchAll(/^\s{2}(?:"([^"]+)"|([A-Za-zÀ-ÿ][\wÀ-ÿ]*))\s*:\s*\{/gm)].map(m =>
    normalize(m[1] ?? m[2])
  )
);

const isTranslated = (text: string) => dictKeys.has(normalize(text));

const rows = (
  await db.execute(sql`SELECT id, equipment, features FROM boats ORDER BY id;`)
).rows as Array<{ id: string; equipment: string[] | null; features: string[] | null }>;

/** Where each string comes from, so a fix can be aimed at the right place. */
const seen = new Map<string, Set<string>>();
const add = (text: string, where: string) => {
  if (!text || text === "—") return;
  if (!seen.has(text)) seen.set(text, new Set());
  seen.get(text)!.add(where);
};

for (const r of rows) {
  for (const v of r.equipment ?? []) add(v, `db:${r.id}`);
  for (const v of r.features ?? []) add(v, `db:${r.id}`);
}
for (const [id, b] of Object.entries(BOAT_DATA)) {
  for (const v of b.equipment ?? []) add(v, `catalogo:${id}`);
  for (const v of b.features ?? []) add(v, `catalogo:${id}`);
}

const missing = [...seen.entries()].filter(([text]) => !isTranslated(text)).sort();

console.log(`Textos distintos: ${seen.size} · sin traducir: ${missing.length}\n`);
for (const [text, where] of missing) {
  console.log(`  "${text}"`);
  console.log(`      ${[...where].join(", ")}`);
}

// Near-duplicates: the same idea entered twice with different wording bloats the
// list the customer reads and doubles the translation work.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const byBoat = rows.map(r => ({
  id: r.id,
  dupes: (r.equipment ?? []).filter((v, _i, arr) =>
    arr.some(o => o !== v && (norm(o).includes(norm(v)) || norm(v).includes(norm(o))))
  ),
})).filter(b => b.dupes.length);

if (byBoat.length) {
  console.log("\n=== equipamiento repetido en la misma ficha ===");
  for (const b of byBoat) console.log(`  ${b.id}: ${b.dupes.join(" | ")}`);
}

process.exit(missing.length ? 1 : 0);
