/**
 * i18n Auto-Translation Script
 *
 * Compares each target language against es.ts (reference) and fills in missing
 * keys by translating the Spanish values with Claude. Existing translations in
 * the target language are preserved — nothing gets overwritten.
 *
 * Usage:   npx tsx scripts/i18n-translate.ts [--dry-run] [--only=<lang>]
 *          npm run i18n:translate
 *
 * Requires: ANTHROPIC_API_KEY in .env
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

import { es } from "../client/src/i18n/es";
import { en } from "../client/src/i18n/en";
import { ca } from "../client/src/i18n/ca";
import { fr } from "../client/src/i18n/fr";
import { de } from "../client/src/i18n/de";
import { nl } from "../client/src/i18n/nl";
import { it } from "../client/src/i18n/it";
import { ru } from "../client/src/i18n/ru";

type Lang = "en" | "ca" | "fr" | "de" | "nl" | "it" | "ru";

const LANGS: Record<Lang, { obj: Record<string, unknown>; name: string }> = {
  en: { obj: en, name: "English" },
  ca: { obj: ca, name: "Catalan" },
  fr: { obj: fr, name: "French" },
  de: { obj: de, name: "German" },
  nl: { obj: nl, name: "Dutch" },
  it: { obj: it, name: "Italian" },
  ru: { obj: ru, name: "Russian" },
};

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const onlyArg = args.find((a) => a.startsWith("--only="));
const ONLY: Lang | null = onlyArg ? (onlyArg.split("=")[1] as Lang) : null;

const anthropic = new Anthropic();

function extractKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== "object" || Array.isArray(obj)) return [prefix];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      keys.push(...extractKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

function getNested(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const p of path.split(".")) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/** Find every missing leaf-key in `target` compared to `es`. */
function findMissing(targetObj: unknown): string[] {
  const reference = extractKeys(es);
  return reference.filter((k) => getNested(targetObj, k) === undefined);
}

/**
 * Group missing leaf keys by their top-level root key. We always re-serialize
 * the entire root block (preserving existing translations, filling gaps), so
 * the file diff stays contained and predictable.
 */
function groupByRoot(missing: string[]): Set<string> {
  return new Set(missing.map((k) => k.split(".")[0]));
}

/** Collect the full ES value for a root key so we can translate the gaps only. */
function getEsRoot(rootKey: string): unknown {
  return (es as Record<string, unknown>)[rootKey];
}

async function translateRootBlock(
  rootKey: string,
  esValue: unknown,
  existingValue: unknown,
  lang: Lang,
  langName: string,
): Promise<unknown> {
  // Identify which leaves are missing under this root
  const esLeaves = extractKeys(esValue);
  const missingLeaves = esLeaves.filter((k) => getNested(existingValue, k) === undefined);
  if (missingLeaves.length === 0) return existingValue;

  // Build a "to translate" object mirroring only the missing paths
  const toTranslate: Record<string, unknown> = {};
  for (const leafPath of missingLeaves) {
    const parts = leafPath.split(".");
    let cur = toTranslate;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = (cur[parts[i]] as Record<string, unknown>) ?? {};
      cur = cur[parts[i]] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = getNested(esValue, leafPath);
  }

  const prompt = `You are translating UI copy for a boat rental website in Blanes, Costa Brava. The business is family-run, friendly but professional. Translate the Spanish values in the JSON below to ${langName}.

Rules:
- Keep the JSON structure EXACTLY the same (same keys, same nesting).
- Translate ONLY string values, not keys.
- Preserve placeholder tokens like {count}, {boat}, {date}, {name}, {price}. Do not translate what is inside curly braces.
- Preserve HTML tags and attributes (e.g. <a href="...">) as-is, translate only the visible text between them.
- Keep numbers, urls, emojis, and brand names unchanged.
- Use natural, idiomatic ${langName} — do not calque Spanish word order.
- Return ONLY valid JSON. No markdown fences, no prose, no explanations.

Context: these values live under the top-level key "${rootKey}" of the i18n dictionary.

Input (Spanish):
${JSON.stringify(toTranslate, null, 2)}`;

  // Stream so long responses don't hit the 10-minute undici socket idle timeout.
  // Retry up to 3 times for transient network hiccups.
  let text = "";
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    text = "";
    try {
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 32000,
        messages: [{ role: "user", content: prompt }],
      });
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          text += event.delta.text;
        }
      }
      lastErr = undefined;
      break;
    } catch (err) {
      lastErr = err;
      if (attempt < 3) {
        console.log(`[${lang}] attempt ${attempt} for "${rootKey}" failed, retrying...`);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }
  if (lastErr) throw lastErr;
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  let translated: unknown;
  try {
    translated = JSON.parse(cleaned);
  } catch (err) {
    console.error(`[${lang}] Failed to parse Claude response for "${rootKey}":`);
    console.error(cleaned);
    throw err;
  }

  // Deep-merge: existing target values win; translated fills the gaps.
  return deepMergePreferFirst(existingValue, translated, esValue);
}

/**
 * Merge three layers:
 *   - `primary`  (existing target translations — always wins when present)
 *   - `fallback` (freshly translated values from Claude)
 *   - `skeleton` (es reference — defines the expected shape)
 * Returns an object with exactly the keys of `skeleton`.
 */
function deepMergePreferFirst(primary: unknown, fallback: unknown, skeleton: unknown): unknown {
  if (typeof skeleton !== "object" || skeleton === null || Array.isArray(skeleton)) {
    // Leaf: prefer primary if defined, otherwise fallback, otherwise skeleton.
    if (primary !== undefined && primary !== null) return primary;
    if (fallback !== undefined && fallback !== null) return fallback;
    return skeleton;
  }
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(skeleton as Record<string, unknown>)) {
    const pv = (primary as Record<string, unknown> | null | undefined)?.[k];
    const fv = (fallback as Record<string, unknown> | null | undefined)?.[k];
    const sv = (skeleton as Record<string, unknown>)[k];
    out[k] = deepMergePreferFirst(pv, fv, sv);
  }
  return out;
}

/** Render an object as a multi-line TS literal, indented under 2 spaces at root. */
function renderValue(v: unknown, indent = 2): string {
  const pad = " ".repeat(indent);
  const padInner = " ".repeat(indent + 2);
  if (v === null) return "null";
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (typeof v === "string") {
    const escaped = v
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `'${escaped}'`;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    const items = v.map((x) => `${padInner}${renderValue(x, indent + 2)}`).join(",\n");
    return `[\n${items},\n${pad}]`;
  }
  // Object
  const entries = Object.entries(v as Record<string, unknown>);
  if (entries.length === 0) return "{}";
  const rendered = entries
    .map(([k, val]) => {
      const keyRender = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      return `${padInner}${keyRender}: ${renderValue(val, indent + 2)}`;
    })
    .join(",\n");
  return `{\n${rendered},\n${pad}}`;
}

/** Render a top-level root block (key + value) as two lines of TS source. */
function renderRootBlock(key: string, value: unknown): string {
  return `  ${key}: ${renderValue(value, 2)},`;
}

/**
 * Remove any existing occurrence of `  ${rootKey}: { ... },` from `source` —
 * handles both one-liners and multi-line blocks by scanning for brace balance.
 */
function removeRoot(source: string, rootKey: string): string {
  // Find anchor: start of line + 2-space indent + rootKey + ":"
  const anchor = new RegExp(`\\n  ${rootKey}:\\s*\\{`, "m");
  const m = source.match(anchor);
  if (!m || m.index === undefined) return source;
  const startLine = m.index; // includes the preceding \n
  let i = m.index + m[0].length; // right after the opening "{"
  let depth = 1;
  let inString: string | null = null;
  let escape = false;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (escape) {
      escape = false;
    } else if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === inString) inString = null;
    } else if (ch === "'" || ch === '"' || ch === "`") {
      inString = ch;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
    }
    i++;
  }
  // Consume trailing comma and newline(s)
  if (source[i] === ",") i++;
  if (source[i] === "\n") i++;
  return source.slice(0, startLine + 1) + source.slice(i);
}

/** Insert a rendered block right before the final `};` of the file. */
function insertBeforeEnd(source: string, blockSource: string): string {
  const endRegex = /\n\};\s*$/;
  if (!endRegex.test(source)) {
    throw new Error("Could not find closing `};` — aborting to avoid corruption.");
  }
  return source.replace(endRegex, `\n${blockSource}\n};\n`);
}

async function processLang(lang: Lang): Promise<void> {
  const { obj, name } = LANGS[lang];
  const filePath = resolve(`client/src/i18n/${lang}.ts`);

  const missing = findMissing(obj);
  if (missing.length === 0) {
    console.log(`[${lang}] already complete — no action`);
    return;
  }
  const roots = groupByRoot(missing);
  console.log(`[${lang}] ${missing.length} missing leaf-keys across ${roots.size} root block(s): ${[...roots].join(", ")}`);

  let source = readFileSync(filePath, "utf-8");
  let touched = 0;

  for (const rootKey of roots) {
    const esValue = getEsRoot(rootKey);
    if (esValue === undefined) {
      console.warn(`[${lang}] skipping "${rootKey}" — not in es.ts`);
      continue;
    }
    const existing = (obj as Record<string, unknown>)[rootKey];
    const merged = await translateRootBlock(rootKey, esValue, existing, lang, name);
    source = removeRoot(source, rootKey);
    source = insertBeforeEnd(source, renderRootBlock(rootKey, merged));
    touched++;
  }

  if (DRY_RUN) {
    console.log(`[${lang}] (dry-run) would rewrite ${touched} block(s) in ${filePath}`);
    return;
  }

  writeFileSync(filePath, source);
  console.log(`[${lang}] rewrote ${touched} block(s) in ${filePath}`);
}

async function main() {
  const targets = ONLY ? [ONLY] : (Object.keys(LANGS) as Lang[]);
  for (const lang of targets) {
    await processLang(lang);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
