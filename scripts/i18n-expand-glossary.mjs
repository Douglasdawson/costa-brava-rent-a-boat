// One-shot helper: deletes the `glossaryPage.terms` array from the 7 non-ES
// locale files so the next `npm run i18n:translate` regenerates each one as a
// FULL translation of the (now larger) es.ts array.
//
// Why this exists: i18n:translate fills MISSING keys but does not grow an
// existing array element-by-element (arrays are treated as single leaf keys).
// When es.ts grows its glossary (e.g. 18 → 56 terms), the only way to propagate
// the new entries is to drop the stale array in each locale and re-translate.
//
// Usage (run immediately BEFORE translating):
//   node scripts/i18n-expand-glossary.mjs && npm run i18n:translate && npm run i18n:validate
//
// Idempotent: if a locale's terms array is already absent, it is skipped.

import { readFileSync, writeFileSync } from "node:fs";

const LANGS = ["en", "ca", "fr", "de", "nl", "it", "ru"];

let changed = 0;
for (const lang of LANGS) {
  const file = `client/src/i18n/${lang}.ts`;
  const lines = readFileSync(file, "utf8").split("\n");

  const gpIdx = lines.findIndex((l) => l === "  glossaryPage: {");
  if (gpIdx < 0) {
    console.log(`[${lang}] no glossaryPage block — skipped`);
    continue;
  }
  const openIdx = lines.findIndex((l, i) => i > gpIdx && l === "    terms: [");
  if (openIdx < 0) {
    console.log(`[${lang}] glossaryPage.terms already absent — skipped`);
    continue;
  }
  const closeIdx = lines.findIndex((l, i) => i > openIdx && l === "    ],");
  if (closeIdx < 0) {
    console.error(`[${lang}] found 'terms: [' but no closing '    ],' — left untouched`);
    process.exitCode = 1;
    continue;
  }

  // Remove the whole `terms: [ ... ],` block (inclusive).
  const result = [...lines.slice(0, openIdx), ...lines.slice(closeIdx + 1)].join("\n");
  writeFileSync(file, result);
  console.log(`[${lang}] removed glossaryPage.terms (lines ${openIdx + 1}-${closeIdx + 1}) → will be re-translated`);
  changed++;
}

console.log(`\nDone. ${changed} locale file(s) updated. Now run: npm run i18n:translate && npm run i18n:validate`);
