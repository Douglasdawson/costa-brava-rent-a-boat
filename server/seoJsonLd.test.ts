/**
 * JSON-LD and SSR parity of the landing / location pages (what crawlers without JS read).
 *
 *  - Service/Event/LocalBusiness price ranges are derived from live boat pricing
 *    (getSegmentPriceRange), never hand-typed (160/240/420 went stale when the rate card moved).
 *  - aggregateRating lives only on LocalBusiness nodes (the GBP rating is the business's).
 *  - Tossa: native body in the 8 locales, the Blanes-Tossa crossing is 30-45 min (not "1 hour"),
 *    and the STATIC_META that the injector serves equals SEO_CONFIGS (what the client hydrates).
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
import { getSegmentPriceRange } from "./lib/fleetStatsCache";
import { SEO_CONFIGS } from "../client/src/utils/seo-config";
import { postEraMeta } from "../shared/postEraMeta";
import { getLocalizedPath, type PageKey } from "../shared/i18n-routes";
import { SUPPORTED_LANGUAGES, type LangCode } from "../shared/seoConstants";
import { BOAT_DATA } from "../shared/boatData";
import { minPriceAcrossBoats } from "../shared/pricing";
import { es as i18nEs } from "../client/src/i18n/es";
import { en as i18nEn } from "../client/src/i18n/en";
import { ca as i18nCa } from "../client/src/i18n/ca";
import { fr as i18nFr } from "../client/src/i18n/fr";
import { de as i18nDe } from "../client/src/i18n/de";
import { nl as i18nNl } from "../client/src/i18n/nl";
import { it as i18nIt } from "../client/src/i18n/it";
import { ru as i18nRu } from "../client/src/i18n/ru";

const I18N: Record<LangCode, typeof i18nEs> = {
  es: i18nEs, en: i18nEn, ca: i18nCa, fr: i18nFr, de: i18nDe, nl: i18nNl, it: i18nIt, ru: i18nRu,
};

const NOW = new Date("2026-11-24T10:00:00Z");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seojsonld-"));
fs.writeFileSync(path.join(tmp, "index.html"), '<!doctype html><html><head><title>x</title><meta name="description" content=""></head><body><div id="root"></div></body></html>');
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

function app() {
  const a = express();
  a.get("*", (req, res) => serveWithSEO(req, res, tmp));
  return a;
}

async function render(p: string): Promise<string> {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  try {
    const r = await request(app()).get(p).set("User-Agent", "GPTBot");
    expect(r.status, p).toBe(200);
    return r.text;
  } finally {
    vi.useRealTimers();
  }
}

type Node = Record<string, unknown>;

function jsonLdNodes(html: string): Node[] {
  const out: Node[] = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const parsed = JSON.parse(m[1]);
    const graph = Array.isArray(parsed["@graph"]) ? (parsed["@graph"] as Node[]) : [parsed as Node];
    out.push(...graph);
  }
  return out;
}

function typesOf(node: Node): string[] {
  const t = node["@type"];
  return Array.isArray(t) ? (t as string[]) : t ? [String(t)] : [];
}

/** Every aggregateRating found anywhere, with the @type of the node that carries it. */
function ratingOwners(value: unknown, owner: string[] = [], found: string[][] = []): string[][] {
  if (Array.isArray(value)) {
    value.forEach((v) => ratingOwners(v, owner, found));
  } else if (value && typeof value === "object") {
    const node = value as Node;
    const here = node["@type"] ? typesOf(node) : owner;
    if ("aggregateRating" in node) found.push(here);
    for (const v of Object.values(node)) ratingOwners(v, here, found);
  }
  return found;
}

const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const titleOf = (html: string) => decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "");
const descOf = (html: string) => decode(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "");

const STALE = ["160", "240", "420", "450"];

describe("landing and location JSON-LD", () => {
  const keys: PageKey[] = [
    "home", "locationBlanes", "locationLloret", "locationTossa", "locationMalgrat", "locationSantaSusanna",
    "locationCalella", "locationPinedaDeMar", "locationPalafolls", "locationTordera", "locationCostaBrava",
    "categoryLicenseFree", "categoryLicensed", "categoryCaptained", "navigationLicense", "pricing",
    "activitySunset", "activityFishing", "activityFamilies", "activitySnorkel",
  ];

  it.each(keys)("%s: derived price ranges and rating only on LocalBusiness", async (key) => {
    const html = await render(getLocalizedPath(key, "es"));
    const nodes = jsonLdNodes(html);
    expect(nodes.length, key).toBeGreaterThan(0);

    const ranges = (["fleet", "licensed", "captained"] as const).map((s) => getSegmentPriceRange(s, NOW));
    const lows = new Set(ranges.map((r) => String(r.low)));
    const highs = new Set(ranges.map((r) => String(r.high)));

    for (const node of nodes) {
      const types = typesOf(node);
      if (types.includes("Service") || types.includes("Event")) {
        const offers = node.offers as { lowPrice?: string; highPrice?: string } | undefined;
        if (offers?.lowPrice === undefined) continue;
        expect(lows.has(String(offers.lowPrice)), `${key} ${types} lowPrice ${offers.lowPrice}`).toBe(true);
        expect(highs.has(String(offers.highPrice)), `${key} ${types} highPrice ${offers.highPrice}`).toBe(true);
        expect(STALE, `${key} lowPrice`).not.toContain(String(offers.lowPrice));
        expect(STALE, `${key} highPrice`).not.toContain(String(offers.highPrice));
      }
      if (types.includes("HowTo")) {
        const cost = (node.estimatedCost as { value?: string } | undefined)?.value;
        expect(STALE, `${key} HowTo estimatedCost`).not.toContain(String(cost));
      }
      if (types.includes("LocalBusiness") && typeof node.priceRange === "string") {
        expect(node.priceRange, `${key} priceRange`).not.toMatch(/\b(?:70|160|240|420|450)\b/);
      }
    }

    for (const owner of ratingOwners(nodes)) {
      expect(owner, `${key}: aggregateRating on ${owner.join("/")}`).toContain("LocalBusiness");
    }
  });
});

describe("Tossa de Mar", () => {
  const slugPath = (lang: LangCode) => getLocalizedPath("locationTossa", lang);

  it.each([...SUPPORTED_LANGUAGES])("%s: native SSR body, 30-45 min and a coherent excursion price", async (lang) => {
    const html = await render(slugPath(lang));
    const tossa = I18N[lang].locationPages.tossa;
    const text = decode(html);

    expect(text).toContain("Tossa");
    expect(text).toContain(decode(tossa.hero.title));
    expect(text).toContain(decode(tossa.hero.subtitle));
    // The Blanes-Tossa crossing is 30-45 min with a licensed boat, never "1 hour".
    expect(text).not.toMatch(/\b1 (?:hora|hour|heure|Stunde|uur|ora|час)\b/i);
    expect(text).not.toMatch(/45 (?:minutos|minutes|minuten|minuti|minuts|мин)\w* (?:y|and|et|und|en|e|i|и) 1 /i);
    // The legal licence-free zone is not a present-tense offer.
    expect(text).not.toMatch(/2[- ]mile zone for license-free|zona de 2 millas para barcos sin licencia/i);
    // 265 is the 2 h excursion price: wherever it appears it must say so.
    for (const m of text.matchAll(/265\s?(?:€|EUR)/g)) {
      expect(text.slice(m.index!, m.index! + 14), `265 near "${text.slice(m.index!, m.index! + 14)}"`).toMatch(/2 ?[huч]/);
    }
  });

  it("the excursion floor quoted in the meta is boatData's 2 h BAJA price", () => {
    expect(minPriceAcrossBoats([BOAT_DATA["excursion-privada"]], "2h", "BAJA")).toBe(265);
    expect(
      minPriceAcrossBoats(
        Object.values(BOAT_DATA).filter((b) => ["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625"].includes(b.id)),
        "2h",
        "BAJA",
      ),
    ).toBe(175);
  });

  it.each([...SUPPORTED_LANGUAGES])("%s: STATIC_META equals SEO_CONFIGS (title, description <= 160, no licence-free promise)", async (lang) => {
    const html = await render(slugPath(lang));
    const cfg = postEraMeta("/alquiler-barcos-tossa-de-mar", lang, SEO_CONFIGS[lang].locationTossa, NOW);
    expect(titleOf(html)).toBe(cfg.title);
    expect(descOf(html)).toBe(cfg.description);
    expect(cfg.description.length).toBeLessThanOrEqual(160);
    expect(`${cfg.title} ${cfg.description} ${cfg.ogDescription ?? ""}`).not.toMatch(
      /sin licencia|no licen[cs]e|license-free|sans permis|ohne führerschein|zonder vaarbewijs|senza patente|sense llic|без лиценз|без прав/i,
    );
    expect(cfg.title).toMatch(/Tossa|Тосса/);
  });
});
