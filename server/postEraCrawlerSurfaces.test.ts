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

const OCT_1 = new Date("2026-10-01T10:00:00Z");
const SEP_30 = new Date("2026-09-30T10:00:00Z");

// Promises that must not survive the switch (es + en, the languages of the server-built copy).
const FORBIDDEN = [
  /gasolina incluida/i,
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
