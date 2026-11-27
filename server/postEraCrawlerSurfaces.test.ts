/**
 * RD 1188/2025: from 2026-10-01 nobody rents a motorboat without a licence, the small
 * licence-free boats leave the web and no rentable boat includes fuel. Production has no
 * prerender, so what crawlers read is the SSR shell (meta + JSON-LD + bodyFallback) and the
 * llms / ai-context endpoints. This test renders them with the clock on 2026-10-01 and fails
 * if any still promises licence-free rental or fuel included.
 *
 * Only server-built copy is checked: strings that come from client/src/i18n are rewritten
 * in place by the i18n layer, so a phrase found there is filtered out below by its i18n
 * origin (the i18n bundle is the source, not this surface). Jet ski and eFoil stay licence-free.
 */
import { describe, it, expect, vi, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

vi.mock("./storage", async () => {
  const bd = await import("../shared/boatData");
  const rows = Object.values(bd.BOAT_DATA).map((b) => ({
    ...b,
    isActive: !bd.BASELINE_INACTIVE_BOAT_IDS.includes(b.id),
    requiresLicense: bd.boatDataRequiresLicense(b) || bd.isCaptainedBoat(b.id),
    capacity: parseInt(b.specifications.capacity, 10) || 5,
    imageUrl: null,
  }));
  const handler = (k: string | symbol) => (k === "getAllBoats" ? async () => rows : async () => []);
  return {
    storage: new Proxy({}, { get: (_t, k) => handler(k) }),
    shopRepo: new Proxy({}, { get: () => async () => [] }),
  };
});
vi.mock("./db", () => ({ db: { select: () => { throw new Error("no db in tests"); } }, pool: {} }));
vi.mock("./lib/businessStatsCache", () => ({
  getCurrentStats: () => ({ rating: 4.8, userRatingCount: 300, reviews: [] }),
  getCurrentRating: () => 4.8,
  getCurrentReviewCount: () => 300,
}));
vi.mock("./seo/thinContentGuard", () => ({ shouldNoindexThinContent: async () => false }));

import express from "express";
import request from "supertest";
import { serveWithSEO } from "./seoInjector";
import { registerRobotsRoutes, applyEraBlocks } from "./routes/robots";
import { buildCoreFacts } from "../shared/aiCitationFacts";
import { getFleetStats } from "./lib/fleetStatsCache";
import { es as i18nEs } from "../client/src/i18n/es";
import { en as i18nEn } from "../client/src/i18n/en";
import { getLocalizedPath, ROUTE_SLUGS } from "../shared/i18n-routes";
import type { LangCode } from "../shared/seoConstants";

const LLMS_LOCALES = ["es", "ca", "fr", "de", "nl", "it", "ru"] as const;

const OCT_1 = new Date("2026-10-01T10:00:00Z");
const SEP_30 = new Date("2026-09-30T10:00:00Z");

// Promises that must not survive the switch (es + en, the languages of the server-built copy).
const FORBIDDEN = [
  // "sin gasolina incluida" is the TRUE statement for licensed boats (and the interpolated FAQ says it); only the promise is forbidden.
  /(?<!sin )gasolina incluida/i,
  /incluye(?:n)? (?:la )?gasolina/i,
  /fuel (?:is )?included/i,
  /includes? fuel/i,
  /barcos? sin licencia (?:desde|disponibles|que cualquier|para cualquier)/i,
  /license-free boats? (?:from|available|that anyone|for anyone)/i,
  /no license needed for boats up to 15/i,
  /no se necesita licencia para barcos de hasta 15/i,
  /alquiler de barcos sin licencia y con licencia/i,
  /license-free and licensed boat/i,
  /PRE-ERA|POST-ERA/, // era markers must never leak
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "postera-"));
fs.writeFileSync(path.join(tmp, "index.html"), '<!doctype html><html><head><title>x</title></head><body><div id="root"></div></body></html>');
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

function app() {
  const a = express();
  registerRobotsRoutes(a);
  a.get("*", (req, res) => serveWithSEO(req, res, tmp));
  return a;
}

// Sentences that come verbatim from the i18n bundles are owned by the i18n layer.
const I18N_TEXT = JSON.stringify([i18nEs, i18nEn]);
function offending(text: string): string[] {
  const plain = text.replace(/<[^>]+>/g, "\n").replace(/\\n/g, "\n");
  return plain
    .split(/\n|"(?:,|:|\})|(?<=[.!?])\s+| — /)
    .map((t) => t.trim())
    .filter((t) => t.length > 5 && FORBIDDEN.some((re) => re.test(t)))
    .filter((t) => !/jet ?ski|moto de agua|e-?foil/i.test(t))
    .filter((t) => !I18N_TEXT.includes(t.replace(/^"/, "").slice(0, 60)));
}

describe("crawler surfaces after the licence-free era (2026-10-01)", () => {
  const paths = [
    "/es/",
    "/en/",
    "/es/alquiler-barcos-blanes",
    "/en/boat-rental-blanes",
    "/es/barcos-sin-licencia",
    "/es/alquiler-barcos-lloret-de-mar",
    "/es/alquiler-barcos-malgrat-de-mar",
    "/es/alquiler-barcos-santa-susanna",
    "/es/alquiler-barcos-calella",
    "/es/alquiler-barcos-pineda-de-mar",
    "/es/alquiler-barcos-costa-brava",
    "/es/precios",
    "/es/rutas",
    "/es/barco/astec-400",
    "/llms.txt",
    "/llms-full.txt",
    ...["en", ...LLMS_LOCALES].map((l) => `/${l}/llms.txt`),
    "/api/ai-context",
    "/.well-known/agent.json",
  ];

  it.each(paths)("%s promises neither licence-free rental nor fuel included", async (p) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(OCT_1);
    try {
      const r = await request(app()).get(p).set("User-Agent", "GPTBot");
      expect(r.status).toBe(200);
      expect(offending(r.text || JSON.stringify(r.body))).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("the home keeps today's licence-free offer on 2026-09-30 (the switch is by date)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(SEP_30);
    try {
      const r = await request(app()).get("/es/").set("User-Agent", "GPTBot");
      expect(r.text).toMatch(/Hasta el 30 de septiembre de 2026, sí/);
    } finally {
      vi.useRealTimers();
    }
  });

  it("citation facts switch on the same clock", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(OCT_1);
      const post = buildCoreFacts(getFleetStats()).map((f) => f.value).join("\n");
      expect(post).not.toMatch(/Included for all license-free boats|fuel included/i);
      vi.setSystemTime(SEP_30);
      const pre = buildCoreFacts(getFleetStats()).map((f) => f.value).join("\n");
      expect(pre).toMatch(/Included for all license-free boats/);
    } finally {
      vi.useRealTimers();
    }
  });

  it("applyEraBlocks keeps one side and strips every marker", () => {
    const raw = "a<!--PRE-ERA-->old<!--/PRE-ERA--><!--POST-ERA-->new<!--/POST-ERA-->b";
    expect(applyEraBlocks(raw, SEP_30)).toBe("aoldb");
    expect(applyEraBlocks(raw, OCT_1)).toBe("anewb");
  });
});

// Claims that no surface may make on any date (fabricated cover, the wrong licence, a course we do not sell).
const FORBIDDEN_CLAIMS =
  /fully insured|full insurance|todo riesgo|sin franquicia|Range:\s*Unlimited|PER (?:o|or) PNB|we arrange the (?:1-day )?course|te lo sacamos|te organizamos el curso|Licence in 1 Day|Curso de 1 d[ií]a/i;

const ROUTE_SLUGS_BY_LANG = (lang: LangCode) => Object.values(ROUTE_SLUGS).map((m) => (m as Record<string, string>)[lang]);

async function getAt(p: string, when: Date): Promise<string> {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(when);
  try {
    const r = await request(app()).get(p).set("User-Agent", "GPTBot");
    expect(r.status).toBe(200);
    return r.text || JSON.stringify(r.body);
  } finally {
    vi.useRealTimers();
  }
}

describe("llms and agent surfaces make no forbidden claim on either side of the switch", () => {
  const surfaces = ["/llms.txt", "/llms-full.txt", "/.well-known/agent.json", ...["en", ...LLMS_LOCALES].map((l) => `/${l}/llms.txt`)];
  it.each(surfaces)("%s", async (p) => {
    for (const when of [SEP_30, OCT_1]) {
      expect((await getAt(p, when)).match(FORBIDDEN_CLAIMS)).toBeNull();
    }
  });

  it("llms-full carries the canonical excursion facts and no obsolete price ceiling", async () => {
    const t = await getAt("/llms-full.txt", OCT_1);
    expect(t).toMatch(/Capacity\*\*: 6 people \(the skipper does not take one of your seats\)/);
    expect(t).toMatch(/\*\*Private excursion\*\*: 200 EUR refundable deposit/);
    expect(t).toMatch(/\*\*Price range\*\*: 175-460 EUR/);
    expect(t).not.toMatch(/Price range[^\n]*420/);
    expect(t).not.toMatch(/From 240 EUR|7 people\n- Boat: Pacific|from 150 EUR/);
  });

  it("agent.json lists /en/llms.txt and the real captained price", async () => {
    const m = JSON.parse(await getAt("/.well-known/agent.json", OCT_1));
    expect(m.localized_llms_txt.en).toMatch(/\/en\/llms\.txt$/);
    const captained = m.key_pages.find((k: { url: string }) => /alquiler-barco-con-patron/.test(k.url));
    expect(captained.topic).toMatch(/from 265 EUR\/2h/);
    expect(captained.topic).not.toMatch(/240/);
  });

  it("/en/llms.txt is the canonical root file", async () => {
    expect(await getAt("/en/llms.txt", OCT_1)).toBe(await getAt("/llms.txt", OCT_1));
  });
});

// Per-language leftovers of the licence-free era in the localized llms.txt (the es/en FORBIDDEN list cannot see them).
const LOCALIZED_ERA_LEFTOVERS: Record<(typeof LLMS_LOCALES)[number], RegExp> = {
  es: /gasolina incluida|barcos sin licencia \(no requieren|curso de 1 d[ií]a|organizamos el curso|0 sin licencia/i,
  ca: /benzina inclosa|gasolina inclosa|vaixells sense llicència \(no requereixen|curs d'1 dia|organitzem el curs|0 sense llicència/i,
  fr: /carburant inclus sur tous|bateaux sans permis \(aucune|cours d une journée|nous organisons le cours|0 sans permis/i,
  de: /kraftstoff bei allen booten ohne|boote ohne bootsführerschein \(keine|eintageskurs|0 ohne bootsführerschein/i,
  it: /carburante incluso su tutte|barche senza patente nautica \(nessuna|corso di 1 giorno|0 senza patente/i,
  nl: /brandstof inbegrepen bij alle boten|boten zonder vaarbewijs \(geen|cursus van 1 dag|0 zonder vaarbewijs/i,
  ru: /топливо включено на всех лодках|лодки без лицензии \(удостоверение|курс на 1 день|0 без лицензии/i,
};
// Spanish words that must not leak into the other six files (URLs and proper nouns stripped first).
const SPANISH_LEAK = /\b(desde|personas|alquiler|tarifas|embarcaciones|reserva instant[aá]nea)/i;

describe("localized llms.txt after 2026-10-01", () => {
  it.each(LLMS_LOCALES)("%s drops the licence-free era and links the real localized pages", async (l) => {
    const t = await getAt(`/${l}/llms.txt`, OCT_1);
    expect(t).not.toMatch(LOCALIZED_ERA_LEFTOVERS[l]);
    expect(t).not.toMatch(/<!--\/?(?:PRE|POST)-ERA|<!--\/?FLEET/);

    const lang = l as LangCode;
    for (const key of ["categoryLicensed", "categoryCaptained", "navigationLicense"] as const) {
      expect(t, `${l} ${key}`).toContain(getLocalizedPath(key, lang));
    }
    expect(t).not.toContain(getLocalizedPath("categoryLicenseFree", lang));
    // every internal link is /{lang}/<real slug of that language>, never /{lang}/barcos or another language's slug
    const links = [...t.matchAll(/https:\/\/www\.costabravarentaboat\.com(\/[^\s)\]]*)/g)].map((m) => m[1]);
    for (const u of links) {
      const seg = u.split("?")[0].split("/").filter(Boolean);
      if (!seg.length || ["llms.txt", "llms-full.txt", "api", "openapi.json", ".well-known", "ai-citations", "feed-llms.json", "sitemap.xml"].includes(seg[0])) continue;
      if (seg[0] !== l && seg[1] === "llms.txt") continue;
      expect(seg[0], u).toBe(l);
      if (seg.length > 1 && seg[1] !== "llms.txt") expect(Object.values(ROUTE_SLUGS_BY_LANG(lang)), u).toContain(seg[1]);
    }
    if (l !== "es") {
      const plain = t.replace(/https?:\/\/\S+/g, "").replace(/\[coastrent\.es\]/g, "");
      expect(plain.match(SPANISH_LEAK), `${l} Spanish leak`).toBeNull();
    }
  });

  it.each(LLMS_LOCALES)("%s still carries the licence-free offer on 2026-09-30", async (l) => {
    const t = await getAt(`/${l}/llms.txt`, SEP_30);
    expect(t).toMatch(LOCALIZED_ERA_LEFTOVERS[l]);
  });

  it.each(LLMS_LOCALES)("%s price range comes from the live fleet", async (l) => {
    expect(await getAt(`/${l}/llms.txt`, OCT_1)).toMatch(/175-460 EUR/);
  });
});
