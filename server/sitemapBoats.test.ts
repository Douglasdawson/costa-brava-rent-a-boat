/**
 * Ola 3.5 (SEO): sitemap-boats.xml announces the 4 publishable boat pages in the 8 languages
 * (each with 9 hreflang: 8 languages + x-default), no retired boat, neutral image captions and
 * a lastmod on the boat pages and on the 4 segment landings (sitemap-pages.xml).
 * Harness copied from server/seoLinks.test.ts.
 */
import { describe, it, expect, vi, afterAll, beforeAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

vi.hoisted(() => {
  process.env.BASE_URL = "https://www.costabravarentaboat.com";
});

vi.mock("./storage", async () => {
  const bd = await import("../shared/boatData");
  const rows = Object.values(bd.BOAT_DATA).map((b) => ({
    ...b,
    isActive: !bd.BASELINE_INACTIVE_BOAT_IDS.includes(b.id),
    requiresLicense: bd.boatDataRequiresLicense(b),
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
vi.mock("./routes/auth-middleware", () => ({ requireAdminSession: (_q: unknown, _r: unknown, next: () => void) => next() }));
vi.mock("./seo/thinContentGuard", () => ({ shouldNoindexThinContent: async () => false }));

import express from "express";
import request from "supertest";
import { serveWithSEO } from "./seoInjector";
import { registerSitemapRoutes } from "./routes/sitemaps";
import { BOAT_DATA } from "../shared/boatData";
import { getLocalizedPath } from "../shared/i18n-routes";
import { SUPPORTED_LANGUAGES } from "../shared/seoConstants";
import { BOAT_PAGES_LASTMOD } from "../shared/seoLastmod";

const BASE = "https://www.costabravarentaboat.com";
const PUBLISHABLE = ["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"];
const OCT_15 = new Date("2026-10-15T10:00:00Z");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sitemapboats-"));
fs.writeFileSync(path.join(tmp, "index.html"), '<!doctype html><html><head><title>x</title></head><body><div id="root"></div></body></html>');
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

async function fetchXml(url: string): Promise<string> {
  const a = express();
  registerSitemapRoutes(a);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(OCT_15);
  try {
    const r = await request(a).get(url);
    expect(r.status).toBe(200);
    return r.text;
  } finally {
    vi.useRealTimers();
  }
}

const entries = (xml: string) => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
const locOf = (e: string) => e.match(/<loc>([^<]+)<\/loc>/)![1];

let boatsXml = "";
let pagesXml = "";
beforeAll(async () => {
  boatsXml = await fetchXml("/sitemap-boats.xml");
  pagesXml = await fetchXml("/sitemap-pages.xml");
});

describe("sitemap-boats.xml", () => {
  it("lists the 4 publishable boats x 8 languages = 32 URLs, no retired boat", () => {
    const locs = entries(boatsXml).map(locOf);
    const expected = PUBLISHABLE.flatMap((id) =>
      SUPPORTED_LANGUAGES.map((l) => `${BASE}${getLocalizedPath("boatDetail", l, { slug: id })}`),
    );
    expect(locs).toHaveLength(32);
    expect([...locs].sort()).toEqual([...expected].sort());
    const retired = Object.keys(BOAT_DATA).filter((id) => !PUBLISHABLE.includes(id));
    for (const id of retired) expect(locs.some((l) => l.endsWith(`/${id}`)), id).toBe(false);
  });

  it("each URL carries 9 hreflang (8 languages + x-default) with its own slug", () => {
    for (const e of entries(boatsXml)) {
      const slug = locOf(e).split("/").pop()!;
      const alts = [...e.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)];
      expect(alts, locOf(e)).toHaveLength(9);
      expect(alts.some((a) => a[1] === "x-default")).toBe(true);
      for (const a of alts) expect(a[2].endsWith(`/${slug}`)).toBe(true);
    }
  });

  it("every <loc> serves 200 (no redirect, no soft 404)", async () => {
    const a = express();
    a.get("*", (req, res) => serveWithSEO(req, res, tmp));
    for (const e of entries(boatsXml)) {
      const p = locOf(e).replace(BASE, "");
      const r = await request(a).get(p).set("User-Agent", "GPTBot").redirects(0);
      expect(r.status, p).toBe(200);
    }
  });

  it("image captions never promise 'sin licencia' (excursion included)", () => {
    const captions = [...boatsXml.matchAll(/<image:caption>([^<]*)<\/image:caption>/g)].map((m) => m[1]);
    expect(captions.length).toBeGreaterThan(0);
    for (const c of captions) expect(c.toLowerCase()).not.toContain("sin licencia");
    const exc = entries(boatsXml).find((e) => locOf(e).endsWith("/excursion-privada"))!;
    expect(exc).toMatch(/<lastmod>/);
  });

  it("has a lastmod on every boat page", () => {
    for (const e of entries(boatsXml)) {
      expect(e).toContain(`<lastmod>${BOAT_PAGES_LASTMOD}</lastmod>`);
    }
  });
});

describe("sitemap-pages.xml: segment landings carry lastmod", () => {
  it.each(["categoryLicensed", "categoryCaptained", "navigationLicense", "locationTossa"] as const)(
    "%s has lastmod in every language entry",
    (key) => {
      const locs = SUPPORTED_LANGUAGES.map((l) => `${BASE}${getLocalizedPath(key, l)}`);
      const mine = entries(pagesXml).filter((e) => locs.includes(locOf(e)));
      expect(mine.length).toBeGreaterThan(0);
      for (const e of mine) expect(e).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    },
  );
});
