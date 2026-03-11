/**
 * Translation Validation Script
 *
 * Compares all i18n language files against Spanish (es) as the reference.
 * Reports missing or empty keys per language.
 * Exit code 1 if problems are found.
 *
 * Usage: npx tsx scripts/validate-translations.ts
 */

import { es } from "../client/src/i18n/es";
import { ca } from "../client/src/i18n/ca";
import { en } from "../client/src/i18n/en";
import { fr } from "../client/src/i18n/fr";
import { de } from "../client/src/i18n/de";
import { nl } from "../client/src/i18n/nl";
import { it } from "../client/src/i18n/it";
import { ru } from "../client/src/i18n/ru";

type TranslationObject = Record<string, unknown>;

const languages: Record<string, TranslationObject> = { ca, en, fr, de, nl, it, ru };

function extractKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== "object" || Array.isArray(obj)) return [prefix];

  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj as TranslationObject)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValue(obj: unknown, path: string): unknown {
  let current: unknown = obj;
  for (const part of path.split(".")) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as TranslationObject)[part];
  }
  return current;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// Extract all keys from Spanish (reference)
const referenceKeys = extractKeys(es);

let totalProblems = 0;

console.log(`Reference language: es (${referenceKeys.length} keys)\n`);

for (const [langCode, langData] of Object.entries(languages)) {
  const missing: string[] = [];
  const empty: string[] = [];

  for (const key of referenceKeys) {
    const value = getNestedValue(langData, key);
    if (value === undefined) {
      missing.push(key);
    } else if (isEmpty(value)) {
      empty.push(key);
    }
  }

  const langKeys = extractKeys(langData);
  const extra = langKeys.filter((k) => !referenceKeys.includes(k));

  const problems = missing.length + empty.length;
  totalProblems += problems;

  if (problems === 0 && extra.length === 0) {
    console.log(`[${langCode}] OK (${langKeys.length} keys)`);
  } else {
    console.log(`[${langCode}] ${problems} problem(s), ${extra.length} extra key(s)`);
    if (missing.length > 0) {
      console.log(`  Missing (${missing.length}):`);
      for (const key of missing) {
        console.log(`    - ${key}`);
      }
    }
    if (empty.length > 0) {
      console.log(`  Empty (${empty.length}):`);
      for (const key of empty) {
        console.log(`    - ${key}`);
      }
    }
    if (extra.length > 0) {
      console.log(`  Extra keys not in reference (${extra.length}):`);
      for (const key of extra) {
        console.log(`    + ${key}`);
      }
    }
  }
  console.log();
}

if (totalProblems > 0) {
  console.log(`\nTotal: ${totalProblems} problem(s) found across ${Object.keys(languages).length} languages.`);
  process.exit(1);
} else {
  console.log(`\nAll ${Object.keys(languages).length} languages are complete.`);
  process.exit(0);
}
