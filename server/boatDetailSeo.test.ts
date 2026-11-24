/**
 * SSR shell of a boat page: its <title>/description must equal what the client hydrates
 * (shared/boatPageMeta.ts via getSEOConfig) in the 8 languages, and its JSON-LD must be the
 * Product + BreadcrumbList + FAQPage graph with real prices and no aggregateRating.
 * Harness copied from server/postEraCrawlerSurfaces.test.ts.
 */
import { describe, it, expect, vi, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

// vitest sets BASE_URL="/" (vite base); the injector reads it for absolute URLs.
vi.hoisted(() => {
  process.env.BASE_URL = "https://www.costabravarentaboat.com";
});

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
import { BOAT_DATA, boatDataRequiresLicense, isCaptainedBoat } from "../shared/boatData";
import { buildBoatPageMeta } from "../shared/boatPageMeta";
import { getLocalizedPath } from "../shared/i18n-routes";
import { getSEOConfig, boatDetailSEOData } from "../client/src/utils/seo-config";
import type { LangCode } from "../shared/seoConstants";

const LANGS: LangCode[] = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"];
const OCT_15 = new Date("2026-10-15T10:00:00Z");
// Publicly listed after the licence-free era: the three licensed hulls and the captained excursion.
const BOATS = ["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "boatseo-"));
fs.writeFileSync(path.join(tmp, "index.html"), '<!doctype html><html><head><title>x</title><meta name="description" content="x"></head><body><div id="root"></div></body></html>');
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

function app() {
  const a = express();
  a.get("*", (req, res) => serveWithSEO(req, res, tmp));
  return a;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function render(id: string, lang: LangCode): Promise<string> {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(OCT_15);
  try {
    const r = await request(app()).get(getLocalizedPath("boatDetail", lang, { slug: id })).set("User-Agent", "GPTBot");
    expect(r.status).toBe(200);
    return r.text;
  } finally {
    vi.useRealTimers();
  }
}

function graphOf(html: string): Array<Record<string, any>> {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const withGraph = blocks.find((b) => Array.isArray(b["@graph"]) && b["@graph"].some((n: any) => n["@type"] === "Product"));
  expect(withGraph, "boat @graph present").toBeTruthy();
  return withGraph!["@graph"];
}

describe("boat page SSR: title parity with the client in 8 languages", () => {
  for (const id of BOATS) {
    for (const lang of LANGS) {
      it(`${id} ${lang}`, async () => {
        const b = BOAT_DATA[id];
        const input = {
          id,
          name: b.name,
          capacity: parseInt(b.specifications.capacity, 10) || 5,
          requiresLicense: boatDataRequiresLicense(b) || isCaptainedBoat(id),
          pricing: b.pricing,
        };
        const client = getSEOConfig(id === "excursion-privada" ? "excursionDetail" : "boatDetail", lang, boatDetailSEOData(input, lang));
        const html = await render(id, lang);
        const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)![1]);
        const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)![1]);
        expect(title).toContain(client.title);
        expect(title).toContain(buildBoatPageMeta(input, lang).title);
        expect(desc).toBe(client.description);
      });
    }
  }
});

describe("boat page SSR: JSON-LD", () => {
  for (const id of BOATS) {
    it(`${id}: Product with real range, breadcrumb and FAQ, no aggregateRating`, async () => {
      const html = await render(id, "en");
      const graph = graphOf(html);
      const types = graph.map((n) => n["@type"]);
      expect(types).toEqual(["Product", "BreadcrumbList", "FAQPage"]);
      const product = graph[0];
      const b = BOAT_DATA[id];
      const prices = Object.values(b.pricing)
        .flatMap((s) => Object.values(s.prices))
        .filter((p) => p > 0);
      expect(product.offers["@type"]).toBe("AggregateOffer");
      expect(product.offers.lowPrice).toBe(Math.min(...prices));
      expect(product.offers.highPrice).toBe(Math.max(...prices));
      expect(product.offers.offerCount).toBe(prices.length);
      expect(product.url).toBe(`https://www.costabravarentaboat.com${getLocalizedPath("boatDetail", "en", { slug: id })}`);
      expect(product.sku).toBe(id);
      expect(product.category).not.toMatch(/License-Free/i);
      expect(html).not.toContain("aggregateRating");
      expect(JSON.stringify(graph)).not.toMatch(/UnitPriceSpecification/);
      expect(graph[2].mainEntity.length).toBeGreaterThanOrEqual(5);
      expect(JSON.stringify(graph[2])).not.toMatch(/todo riesgo|fully insured|all[- ]risk/i);
    });
  }

  it("captained excursion category", async () => {
    const graph = graphOf(await render("excursion-privada", "es"));
    expect(graph[0].category).toBe("Private boat excursion with skipper");
  });
});
