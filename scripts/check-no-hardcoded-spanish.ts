/**
 * Hardcoded Spanish lint check.
 *
 * Scans every .ts and .tsx file under client/src (excluding i18n/, tests, lib/translations.ts)
 * for string literals and JSX text that look like user-facing Spanish prose.
 *
 * Heuristic: length > 15 AND contains a common Spanish word AND not a URL/email/path/hex.
 * Output: file:line:column with the offending string preview.
 *
 * Allowlist: scripts/check-no-hardcoded-spanish.allowlist.txt
 *   Format per line: <relative-path>|<sha1-of-string-12-chars>
 *   Lines starting with # are comments.
 *
 * Each violation is hashed by its content (not line number) so refactors that
 * shift line numbers don't break the allowlist; only fixing or rewriting the
 * actual string changes the hash.
 *
 * Exit code:
 *   0 — no new violations (allowlist may contain stale entries; warned but not failed)
 *   1 — at least one violation not in the allowlist
 *
 * Usage: tsx scripts/check-no-hardcoded-spanish.ts
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC_DIR = join(ROOT, "client/src");
const ALLOWLIST_PATH = join(__dirname, "check-no-hardcoded-spanish.allowlist.txt");

const SPANISH_WORDS = [
  "que",
  "para",
  "con",
  "por",
  "del",
  "los",
  "las",
  "una",
  "este",
  "esta",
  "tiene",
  "sin",
  "más",
  "también",
  "cuando",
  "donde",
  "pero",
  "todos",
  "sólo",
  "hay",
  "necesito",
  "gracias",
  "hola",
  "ayuda",
  "elegir",
  "puedo",
  "vamos",
  "somos",
  "están",
  "reservar",
  "precios",
  "disponibilidad",
  "barco",
  "barcos",
  "asesorar",
  "asesoren",
  "asesorarme",
];

const EXCLUDE_PATTERNS: RegExp[] = [
  /\/i18n\//,
  /\.test\.tsx?$/,
  /lib\/translations\.ts$/,
  // Legal pages are intentionally Spanish-only (legal contract jurisdiction).
  /components\/CondicionesGenerales\.tsx$/,
  // SEO-specific hardcoded copy components (per-language by design, not via i18n hook).
  /components\/HomePageSEO\.tsx$/,
  // SEO meta config: per-language strings live in this file by design (Open Graph,
  // Twitter Card, structured data) — they are not user-facing UI but search-engine
  // metadata, so the i18n hook doesn't apply.
  /utils\/seo-config\.ts$/,
];

interface Match {
  file: string;
  line: number;
  col: number;
  text: string;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (!full.endsWith(".tsx") && !full.endsWith(".ts")) continue;
    const rel = relative(ROOT, full);
    if (EXCLUDE_PATTERNS.some(p => p.test(rel))) continue;
    out.push(full);
  }
  return out;
}

function isSuspicious(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 16) return false;
  // Module / import / URL / mail / tel / data paths.
  if (/^@\//.test(trimmed)) return false;
  if (/^\.\.?\//.test(trimmed)) return false;
  if (/^https?:\/\//.test(trimmed)) return false;
  if (/^(mailto|tel|data|sms|whatsapp):/.test(trimmed)) return false;
  if (/^[\w.+-]+@[\w.-]+$/.test(trimmed)) return false;
  if (/^\/[\w/${}.-]+$/.test(trimmed)) return false;
  // Hex colors and pure numeric/symbol strings.
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return false;
  if (/^[\d\s.,:€$%/-]+$/.test(trimmed)) return false;
  // CSS class-like identifiers, camelCase identifiers.
  if (/^[a-z][\w-]*$/.test(trimmed)) return false;
  // File-path-like (ends with extension).
  if (/\.(tsx?|jsx?|json|css|html|svg|png|jpg|webp|avif)$/.test(trimmed)) return false;
  // Strings dominated by interpolation slots (likely a path/url template).
  const slotCount = (trimmed.match(/\$\{[^}]+\}/g) || []).length;
  if (slotCount > 0 && trimmed.replace(/\$\{[^}]+\}/g, "").trim().length < 8) return false;

  // Match Spanish words. Require either >=2 Spanish word matches, or 1 match in a long string.
  const matches = SPANISH_WORDS.filter(w => new RegExp(`\\b${w}\\b`, "i").test(trimmed));
  if (matches.length === 0) return false;
  if (matches.length === 1 && trimmed.length < 30) return false;
  return true;
}

function extractMatches(file: string, content: string): Match[] {
  const matches: Match[] = [];
  const lines = content.split("\n");
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (inBlockComment) {
      const end = line.indexOf("*/");
      if (end < 0) continue;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    const blockStart = line.indexOf("/*");
    if (blockStart >= 0) {
      const blockEnd = line.indexOf("*/", blockStart + 2);
      if (blockEnd < 0) {
        inBlockComment = true;
        line = line.slice(0, blockStart);
      } else {
        line = line.slice(0, blockStart) + line.slice(blockEnd + 2);
      }
    }
    const lineCommentIdx = findLineCommentIndex(line);
    if (lineCommentIdx >= 0) line = line.slice(0, lineCommentIdx);

    const stringRe = /(["'`])((?:\\.|(?!\1).)*?)\1/g;
    let m: RegExpExecArray | null;
    while ((m = stringRe.exec(line)) !== null) {
      const text = m[2];
      if (text.length < 16) continue;
      matches.push({
        file,
        line: i + 1,
        col: m.index + 1,
        text,
      });
    }

    const jsxTextRe = />([^<>{}\n]{16,})</g;
    while ((m = jsxTextRe.exec(line)) !== null) {
      const text = m[1].trim();
      if (text.length < 16) continue;
      matches.push({
        file,
        line: i + 1,
        col: m.index + 2,
        text,
      });
    }
  }

  return matches;
}

function findLineCommentIndex(line: string): number {
  let inString: string | null = null;
  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    if (inString) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === "/" && line[i + 1] === "/") return i;
  }
  return -1;
}

function hashString(s: string): string {
  return createHash("sha1").update(s).digest("hex").slice(0, 12);
}

function loadAllowlist(): Set<string> {
  try {
    const content = readFileSync(ALLOWLIST_PATH, "utf8");
    return new Set(
      content
        .split("\n")
        .map(l => l.trim())
        .filter(l => l && !l.startsWith("#"))
    );
  } catch {
    return new Set<string>();
  }
}

/**
 * Scan i18n/*.ts files for em dashes (— U+2014 and ASCII --).
 * DESIGN.md bans em dashes in copy. The main loop above excludes i18n/ to avoid
 * false positives in localized prose; this loop covers the gap with a literal
 * character search instead of the Spanish-word heuristic.
 */
function findEmDashes(): { key: string; preview: string; loc: string }[] {
  const I18N_DIR = join(SRC_DIR, "i18n");
  const files: string[] = [];
  for (const entry of readdirSync(I18N_DIR)) {
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      files.push(join(I18N_DIR, entry));
    }
  }
  const results: { key: string; preview: string; loc: string }[] = [];
  const stringRe = /(["'`])((?:\\.|(?!\1).)*?)\1/g;
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    let inBlockComment = false;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (inBlockComment) {
        const end = line.indexOf("*/");
        if (end < 0) continue;
        line = line.slice(end + 2);
        inBlockComment = false;
      }
      const blockStart = line.indexOf("/*");
      if (blockStart >= 0) {
        const blockEnd = line.indexOf("*/", blockStart + 2);
        if (blockEnd < 0) {
          inBlockComment = true;
          line = line.slice(0, blockStart);
        } else {
          line = line.slice(0, blockStart) + line.slice(blockEnd + 2);
        }
      }
      const lineCommentIdx = findLineCommentIndex(line);
      if (lineCommentIdx >= 0) line = line.slice(0, lineCommentIdx);

      let m: RegExpExecArray | null;
      stringRe.lastIndex = 0;
      while ((m = stringRe.exec(line)) !== null) {
        const text = m[2];
        if (!text.includes("—") && !text.includes("--")) continue;
        const rel = relative(ROOT, file);
        const key = `${rel}|emdash:${hashString(text)}`;
        const preview = text.length > 80 ? text.slice(0, 80) + "..." : text;
        results.push({ key, preview, loc: `${rel}:${i + 1}:${m.index + 1}` });
      }
    }
  }
  return results;
}

function main(): void {
  const files = walk(SRC_DIR);
  const allowlist = loadAllowlist();
  const violations: string[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const matches = extractMatches(file, content);
    for (const { line, col, text } of matches) {
      if (!isSuspicious(text)) continue;
      const rel = relative(ROOT, file);
      const key = `${rel}|${hashString(text)}`;
      seen.add(key);
      if (allowlist.has(key)) continue;
      const preview = text.length > 80 ? text.slice(0, 80) + "..." : text;
      violations.push(`  ${rel}:${line}:${col}  "${preview}"  [${key.split("|")[1]}]`);
    }
  }

  // Em-dash check on i18n files (separate scope, separate hash prefix `emdash:`).
  const emDashHits = findEmDashes();
  const emDashViolations: string[] = [];
  for (const hit of emDashHits) {
    seen.add(hit.key);
    if (allowlist.has(hit.key)) continue;
    emDashViolations.push(`  ${hit.loc}  "${hit.preview}"  [${hit.key.split("|")[1]}]`);
  }

  const stale = [...allowlist].filter(a => !seen.has(a));

  if (violations.length > 0) {
    console.error(
      `\n✗ ${violations.length} hardcoded Spanish string(s) found in JSX (not in allowlist):\n`
    );
    console.error(violations.join("\n"));
    console.error(
      `\nFix: move the string to client/src/i18n/es.ts (use t.X in the component) and run npm run i18n:translate.`
    );
    console.error(
      `If intentional (e.g., a brand name or technical literal), append the line shown in [brackets] to scripts/check-no-hardcoded-spanish.allowlist.txt with format <path>|<hash>.`
    );
    process.exit(1);
  }

  if (emDashViolations.length > 0) {
    console.error(
      `\n✗ ${emDashViolations.length} em dash(es) found in client/src/i18n/ (not in allowlist):\n`
    );
    console.error(emDashViolations.join("\n"));
    console.error(
      `\nFix: replace — (U+2014) or -- with : , ; . · or ( ) per DESIGN.md. If intentional, append <path>|emdash:<hash> to the allowlist.`
    );
    process.exit(1);
  }

  if (stale.length > 0) {
    console.warn(
      `\n⚠ ${stale.length} stale entry/entries in allowlist (string no longer matches):\n`
    );
    stale.forEach(s => console.warn(`  ${s}`));
    console.warn(
      `\nRemove these from scripts/check-no-hardcoded-spanish.allowlist.txt — the violations they covered are gone.`
    );
  }

  console.log(
    `✓ No new hardcoded Spanish strings (${allowlist.size} known violation${allowlist.size === 1 ? "" : "s"} in allowlist${stale.length > 0 ? `, ${stale.length} stale` : ""}).`
  );
}

main();
