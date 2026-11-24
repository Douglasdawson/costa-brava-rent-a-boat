/**
 * Ola 3.1/3.2 (SEO): soft 404s, one-hop 301s and cross-language slug duplicates.
 *
 * - /es/barco and /es/barcos-con-licencia/x used to answer 200 with the SPA shell (soft 404).
 * - Retired boats, old Wix paths, bare landings and foreign-language slugs 301 in ONE hop to a
 *   final URL (301s are cached 1 year as immutable: a chain or a wrong target cannot be undone).
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
  const post = {
    slug: "post-de-prueba",
    isPublished: true,
    title: "Post de prueba",
    excerpt: "Resumen",
    content: "<p>Contenido</p>",
    category: "Navegacion",
    tags: [],
    publishedAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
  };
  const dest = { slug: "tossa-de-mar", name: "Tossa de Mar", description: "Destino", metaDescription: "Destino" };
  const handlers: Record<string, unknown> = {
    getAllBoats: async () => rows,
    getAllBlogPosts: async () => [post],
    getDestinationBySlug: async (s: string) => (s === dest.slug ? dest : undefined),
  };
  return {
    storage: new Proxy({}, { get: (_t, k) => handlers[k as string] ?? (async () => []) }),
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
import { serveWithSEO, isValidSPARoute } from "./seoInjector";
import { redirectMiddleware, retiredBoatTarget, HARDCODED_REDIRECTS } from "./seo/redirects";
import { getLocalizedPath, isForeignLanguageSlug, ROUTE_SLUGS } from "../shared/i18n-routes";
import { SUPPORTED_LANGUAGES } from "../shared/seoConstants";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seorouting-"));
fs.writeFileSync(path.join(tmp, "index.html"), '<!doctype html><html><head><title>x</title></head><body><div id="root"></div></body></html>');
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

function app() {
  const a = express();
  a.use(redirectMiddleware());
  a.get("*", (req, res) => serveWithSEO(req, res, tmp));
  return a;
}

const LICENSED_ES = getLocalizedPath("categoryLicensed", "es");
const CAPTAINED_ES = getLocalizedPath("categoryCaptained", "es");

async function redirectOf(url: string) {
  const res = await request(app()).get(url).redirects(0);
  return { status: res.status, location: res.headers.location as string | undefined };
}

describe("soft 404: isValidSPARoute", () => {
  it.each([
    "/es/barco",
    "/es/cancel",
    "/fr/bateau",
    "/es/barcos-con-licencia/x",
    "/es/alquiler-barcos-tossa-de-mar/foo",
    "/es/crm/dashboard/extra",
  ])("%s is not a page", (p) => {
    expect(isValidSPARoute(p)).toBe(false);
  });

  it.each([
    "/es/barco/mingolla-brava-19",
    "/fr/bateau/mingolla-brava-19",
    "/es/blog",
    "/es/blog/post-de-prueba",
    "/es/destinos",
    "/es/destinos/tossa-de-mar",
    "/es/cancel/abc123",
    "/es/crm",
    "/es/crm/dashboard",
    "/es/barcos-con-licencia",
    "/es/alquiler-barco-con-patron",
    "/es/",
    "/es",
    "/crm",
    "/crm/dashboard",
    "/barco/mingolla-brava-19",
    "/ai-citations",
  ])("%s stays valid", (p) => {
    expect(isValidSPARoute(p)).toBe(true);
  });

  it("every static ROUTE_SLUGS page of every language is still valid (2 segments)", () => {
    const detailOnly = new Set(["boatDetail", "cancel", "blogDetail", "destinationDetail", "home"]);
    for (const [key, slugs] of Object.entries(ROUTE_SLUGS)) {
      if (detailOnly.has(key)) continue;
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(isValidSPARoute(`/${lang}/${slugs[lang]}`), `${lang}/${slugs[lang]}`).toBe(true);
      }
    }
  });
});

describe("soft 404: HTTP status", () => {
  it("404 for /es/barco and /es/barcos-con-licencia/x", async () => {
    expect((await request(app()).get("/es/barco")).status).toBe(404);
    expect((await request(app()).get("/es/barcos-con-licencia/x")).status).toBe(404);
  });

  it.each([
    "/es/barco/mingolla-brava-19",
    "/es/blog/post-de-prueba",
    "/es/destinos/tossa-de-mar",
    "/es/cancel/abc123",
    "/es/crm/dashboard",
    "/es/barcos-con-licencia",
    "/fr/bateau-avec-permis",
  ])("200 for %s", async (p) => {
    expect((await request(app()).get(p)).status).toBe(200);
  });
});

describe("301 in one hop", () => {
  const cases: Array<[string, string]> = [
    // (a) old Wix private-excursion URLs -> captained landing, language of the URL
    ["/excursion-barco-privado", CAPTAINED_ES],
    ["/excursiones-privadas-con-patron-blanes", CAPTAINED_ES],
    ["/fr/excursion-barco-privado", getLocalizedPath("categoryCaptained", "fr")],
    // (b) retired boats -> licensed category, any prefix, any localized boat slug
    ["/barco/solar-450", LICENSED_ES],
    ["/barco/astec-450", LICENSED_ES],
    ["/es/barco/remus-450-ii", LICENSED_ES],
    ["/es/barco/astec-480", LICENSED_ES],
    ["/en/boat/astec-400", getLocalizedPath("categoryLicensed", "en")],
    ["/fr/bateau/remus-450", getLocalizedPath("categoryLicensed", "fr")],
    ["/de/boot/solar-450", getLocalizedPath("categoryLicensed", "de")],
    ["/ca/vaixell/astec-450", getLocalizedPath("categoryLicensed", "ca")],
    ["/fr/barco/solar-450", getLocalizedPath("categoryLicensed", "fr")], // foreign slug: still one hop
    ["/es/barco/solar-450/", LICENSED_ES], // trailing slash: no strip-then-redirect chain
    // (c) discontinued model
    ["/barco-mirimare-sunrise-7", LICENSED_ES],
    // (d) bare landings -> /es/
    ["/alquiler-barco-con-patron", CAPTAINED_ES],
    ["/licencia-navegacion-titulin", getLocalizedPath("navigationLicense", "es")],
    ["/alquiler-barcos-tossa-de-mar", getLocalizedPath("locationTossa", "es")],
    // legacy rows that used to chain through a retired boat page
    ["/barco/mingolla-brava-19", "/es/barco/mingolla-brava-19"],
  ];

  it.each(cases)("%s -> %s", async (from, to) => {
    const r = await redirectOf(from);
    expect(r.status).toBe(301);
    expect(r.location).toBe(to);
    // The destination must be final: serving it is not another redirect.
    const next = await redirectOf(to);
    expect(next.status, `${to} must not redirect again`).not.toBe(301);
  });

  it("keeps the query string on hardcoded redirects", async () => {
    const r = await redirectOf("/alquiler-barco-con-patron?utm_source=ads");
    expect(r.location).toBe(`${CAPTAINED_ES}?utm_source=ads`);
  });
});

describe("cross-language slug duplicates", () => {
  const cases: Array<[string, string]> = [
    ["/fr/alquiler-barcos-tossa-de-mar", getLocalizedPath("locationTossa", "fr")],
    ["/de/barco/excursion-privada", `${getLocalizedPath("boatDetail", "de")}/excursion-privada`],
    ["/en/location-bateau-blanes", getLocalizedPath("locationBlanes", "en")],
    ["/nl/bateau-avec-permis", getLocalizedPath("categoryLicensed", "nl")],
  ];

  it.each(cases)("%s -> %s", async (from, to) => {
    const r = await redirectOf(from);
    expect(r.status).toBe(301);
    expect(r.location).toBe(to);
    const next = await redirectOf(to);
    expect(next.status, `${to} must not redirect again`).not.toBe(301);
  });

  it("keeps the query string", async () => {
    const r = await redirectOf("/fr/alquiler-barcos-tossa-de-mar?utm_source=x");
    expect(r.location).toBe(`${getLocalizedPath("locationTossa", "fr")}?utm_source=x`);
  });

  it("does not touch slugs shared with the prefix language, blog, destinations, crm or unknown slugs", () => {
    for (const p of [
      "/fr/blog/post-de-prueba",
      "/de/blog",
      "/fr/destinos/tossa-de-mar",
      "/fr/crm/dashboard",
      "/nl/efoil-blanes",
      "/de/shop",
      "/fr/slug-que-no-existe",
      "/ca/barco-sin-licencia-blanes-astec-400",
      "/de/boot/solar-450",
      "/de/boot",
    ]) {
      expect(isForeignLanguageSlug(p), p).toBe(false);
    }
  });

  it("a correct URL in every language never redirects (no loops)", () => {
    for (const [key, slugs] of Object.entries(ROUTE_SLUGS)) {
      if (key === "home") continue;
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(isForeignLanguageSlug(`/${lang}/${slugs[lang]}`), `${lang}/${slugs[lang]}`).toBe(false);
      }
    }
  });

  it("every foreign-slug redirect target is itself valid in its language", () => {
    for (const [key, slugs] of Object.entries(ROUTE_SLUGS)) {
      if (key === "home") continue;
      for (const lang of SUPPORTED_LANGUAGES) {
        for (const other of SUPPORTED_LANGUAGES) {
          if (other === lang) continue;
          const url = `/${lang}/${slugs[other]}`;
          if (!isForeignLanguageSlug(url)) continue;
          // Same module the server uses to build the target.
          const target = getLocalizedPath(key as keyof typeof ROUTE_SLUGS, lang);
          expect(isForeignLanguageSlug(target), `${url} -> ${target}`).toBe(false);
        }
      }
    }
  });
});

describe("hardcoded redirect map: no chains, no loops", () => {
  const entries = Object.entries(HARDCODED_REDIRECTS);

  it("is not empty", () => {
    expect(entries.length).toBeGreaterThan(50);
  });

  it("no destination is itself a redirect source or a retired boat page", () => {
    const sources = new Set(Object.keys(HARDCODED_REDIRECTS));
    for (const [from, to] of entries) {
      expect(to, `${from} loops onto itself`).not.toBe(from);
      expect(sources.has(to), `${from} -> ${to} chains through another hardcoded redirect`).toBe(false);
      expect(retiredBoatTarget(to), `${from} -> ${to} lands on a retired boat page`).toBeNull();
      expect(to.startsWith("/"), `${from} -> ${to} must be absolute`).toBe(true);
    }
  });

  it("every retired-boat target is a final licensed category URL", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const to = retiredBoatTarget(`/${lang}/${ROUTE_SLUGS.boatDetail[lang]}/solar-450`);
      expect(to).toBe(getLocalizedPath("categoryLicensed", lang));
      expect(HARDCODED_REDIRECTS[to as string]).toBeUndefined();
    }
    expect(retiredBoatTarget("/es/barco/mingolla-brava-19")).toBeNull();
    expect(retiredBoatTarget("/es/barco/excursion-privada")).toBeNull();
  });
});
