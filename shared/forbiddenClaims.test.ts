import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CORE_FACTS } from "./aiCitationFacts";
import { POST_ERA_META } from "./postEraMeta";
import { SEO_CONFIGS } from "../client/src/utils/seo-config";
import { es } from "../client/src/i18n/es";
import { en } from "../client/src/i18n/en";
import { ca } from "../client/src/i18n/ca";
import { fr } from "../client/src/i18n/fr";
import { de } from "../client/src/i18n/de";
import { nl } from "../client/src/i18n/nl";
import { it as itLocale } from "../client/src/i18n/it";
import { ru } from "../client/src/i18n/ru";

/**
 * Guardian for claims that were published and were false (audit 2026-11-24).
 * It covers the surfaces that AI crawlers and search engines read and that no other
 * guardian reaches: llms*.txt, atomic facts, SEO meta, the i18n bundles and the blog seeds.
 *
 * Each rule says WHY it exists. Do not loosen a rule to make a test pass: fix the copy.
 */
const RULES: Array<{ name: string; re: RegExp }> = [
  // Insurance: only INSURANCE_SCOPE_ES may be promised (art. 61.2 TRLGDCU makes it enforceable).
  { name: "seguro todo riesgo / full insurance", re: /todo riesgo|fully insured|full insurance|seguro completo|comprehensive insurance|tous risques|vollkasko|all[- ]risk/i },
  // The Navigation Licence (titulin) covers the 3 licensed boats; PER/PNB or unlimited range is wrong.
  { name: "PER o PNB / rango ilimitado", re: /\bPER (o|or|ou|oder|of|e|и|i) PNB\b|Range:\s*Unlimited/i },
  // The sister school is not authorised and does not sell: the titulin is information, not our course.
  { name: "curso propio del titulin", re: /we arrange the (1-day )?course|te organizamos el curso|te lo sacamos en 1 d[ií]a|Licence in 1 Day/i },
];

// "Curso de 1 dia" describes the national course in blog/i18n prose (fine), but in titles, meta,
// llms and AI facts the engines attributed that course to us. Only those surfaces get this rule.
const ONE_DAY_COURSE: Array<{ name: string; re: RegExp }> = [
  { name: "curso de 1 dia en superficie de metas/IA", re: /Curso de 1 d[ií]a|1[- ]day (licen[cs]e )?course/i },
];

const PRIVATE_EXCURSION_WRONG: Array<{ name: string; re: RegExp }> = [
  { name: "excursion privada de 7 plazas", re: /excursi[oó]n[^.\n]{0,80}\b7 (personas|people|pax)|private excursion[^.\n]{0,80}\b7 (people|pax)/i },
];

const ROOT = join(__dirname, "..");
const read = (p: string): string => readFileSync(join(ROOT, p), "utf8");

/** Post-era view of an llms file: keep POST-ERA blocks, drop PRE-ERA ones. */
function postEraView(raw: string): string {
  return raw
    .replace(/<!--PRE-ERA-->[\s\S]*?<!--\/PRE-ERA-->/g, "")
    .replace(/<!--\/?POST-ERA-->/g, "");
}

function collectStrings(value: unknown, path: string, out: Array<{ path: string; text: string }>): void {
  if (typeof value === "string") out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) collectStrings(v, path ? `${path}.${k}` : k, out);
  }
}

function violations(text: string, rules = RULES): string[] {
  return rules.filter((r) => r.re.test(text)).map((r) => r.name);
}

describe("forbidden claims: llms files (post-era)", () => {
  const files = ["llms.txt", "llms-full.txt", ...["es", "ca", "fr", "de", "nl", "it", "ru"].map((l) => `${l}/llms.txt`)];
  for (const f of files) {
    it(`client/public/${f}`, () => {
      const p = `client/public/${f}`;
      expect(existsSync(join(ROOT, p))).toBe(true);
      const text = postEraView(read(p));
      expect(violations(text, [...RULES, ...ONE_DAY_COURSE, ...PRIVATE_EXCURSION_WRONG])).toEqual([]);
    });
  }
});

describe("forbidden claims: atomic facts and SEO meta", () => {
  it("CORE_FACTS", () => {
    for (const f of CORE_FACTS) {
      expect({ id: f.id, v: violations(JSON.stringify(f), [...RULES, ...ONE_DAY_COURSE]) }).toEqual({ id: f.id, v: [] });
    }
  });

  it("POST_ERA_META", () => {
    expect(violations(JSON.stringify(POST_ERA_META), [...RULES, ...ONE_DAY_COURSE])).toEqual([]);
  });

  it("SEO_CONFIGS (client meta, 8 languages)", () => {
    const strings: Array<{ path: string; text: string }> = [];
    collectStrings(SEO_CONFIGS, "SEO_CONFIGS", strings);
    const bad = strings.filter((s) => violations(s.text, [...RULES, ...ONE_DAY_COURSE]).length > 0).map((s) => s.path);
    expect(bad).toEqual([]);
  });
});

describe("forbidden claims: i18n bundles", () => {
  const bundles: Record<string, unknown> = { es, en, ca, fr, de, nl, it: itLocale, ru };
  for (const [lang, bundle] of Object.entries(bundles)) {
    it(lang, () => {
      const strings: Array<{ path: string; text: string }> = [];
      collectStrings(bundle, lang, strings);
      const bad = strings.filter((s) => violations(s.text).length > 0).map((s) => `${s.path}: ${violations(s.text).join(",")}`);
      expect(bad).toEqual([]);
    });
  }
});

describe("forbidden claims: blog seeds", () => {
  const seedDir = join(ROOT, "server/seeds");
  const seeds = readdirSync(seedDir).filter((f) => /^blog.*Seed\.ts$/.test(f));
  it("finds the blog seeds", () => expect(seeds.length).toBeGreaterThan(0));
  for (const f of seeds) {
    it(f, () => {
      const text = readFileSync(join(seedDir, f), "utf8");
      expect(violations(text, [...RULES, ...PRIVATE_EXCURSION_WRONG])).toEqual([]);
    });
  }
});
