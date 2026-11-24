/**
 * Ola 3.3/3.4 (SEO): what a crawler WITHOUT JS reads in the SSR shell (production does not
 * prerender, see CLAUDE.md). The segment landings and the four boat pages must carry real
 * internal links (anchor text from i18n, /{lang}/{slug of that lang}) and the boat pages
 * 300+ words of visible text in the 8 languages, with the insurance wording of
 * INSURANCE_SCOPE_ES (seats limit included) localised, never the Spanish line.
 * Harness copied from server/boatDetailSeo.test.ts + server/seoRouting.test.ts.
 */
import { describe, it, expect, vi, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

vi.hoisted(() => {
  process.env.BASE_URL = "https://www.costabravarentaboat.com";
});

// Production semantics: the captained excursion row has requiresLicense=false (CLAUDE.md).
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
vi.mock("./seo/thinContentGuard", () => ({ shouldNoindexThinContent: async () => false }));

import express from "express";
import request from "supertest";
import { serveWithSEO, LICENSED_BOAT_IDS, CAPTAINED_BOAT_ID } from "./seoInjector";
import { redirectMiddleware } from "./seo/redirects";
import { getLocalizedPath } from "../shared/i18n-routes";
import { INSURANCE_SCOPE_ES } from "../shared/businessProfile";
import { es } from "../client/src/i18n/es";
import { en } from "../client/src/i18n/en";
import { ca } from "../client/src/i18n/ca";
import { fr } from "../client/src/i18n/fr";
import { de } from "../client/src/i18n/de";
import { nl } from "../client/src/i18n/nl";
import { it as itLocale } from "../client/src/i18n/it";
import { ru } from "../client/src/i18n/ru";
import type { LangCode } from "../shared/seoConstants";

const LANGS: LangCode[] = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"];
const BUNDLES: Record<LangCode, typeof es> = { es, en, ca, fr, de, nl, it: itLocale, ru } as Record<LangCode, typeof es>;
const OCT_15 = new Date("2026-10-15T10:00:00Z");
const BOATS = [...LICENSED_BOAT_IDS, CAPTAINED_BOAT_ID];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seolinks-"));
fs.writeFileSync(path.join(tmp, "index.html"), '<!doctype html><html><head><title>x</title><meta name="description" content="x"></head><body><div id="root"></div></body></html>');
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

function app() {
  const a = express();
  a.use(redirectMiddleware());
  a.get("*", (req, res) => serveWithSEO(req, res, tmp));
  return a;
}

const cache = new Map<string, { status: number; text: string }>();
async function get(url: string): Promise<{ status: number; text: string }> {
  const hit = cache.get(url);
  if (hit) return hit;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(OCT_15);
  try {
    const r = await request(app()).get(url).set("User-Agent", "GPTBot").redirects(0);
    const out = { status: r.status, text: r.text ?? "" };
    cache.set(url, out);
    return out;
  } finally {
    vi.useRealTimers();
  }
}

/** The JS-less body: the content of #seo-fallback. */
function fallbackOf(html: string): string {
  const m = html.match(/<div id="seo-fallback"[^>]*>([\s\S]*?)<\/div><\/div>/);
  expect(m, "seo-fallback present").toBeTruthy();
  return m![1];
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function hrefs(body: string): string[] {
  return [...body.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => decode(m[1]));
}

/** Internal = same site: relative or absolute on our own host. */
function internalPaths(body: string): string[] {
  return hrefs(body)
    .filter((h) => h.startsWith("/") || h.startsWith("https://www.costabravarentaboat.com"))
    .map((h) => h.replace("https://www.costabravarentaboat.com", ""));
}

function wordCount(body: string): number {
  const text = decode(body.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

// Minimum internal links per page, as built in server/seoInjector.ts (Ola 3.3).
const PAGES: Array<{ name: string; path: (l: LangCode) => string; min: number }> = [
  { name: "barcos-con-licencia", path: (l) => getLocalizedPath("categoryLicensed", l), min: 9 },
  { name: "alquiler-con-patron", path: (l) => getLocalizedPath("categoryCaptained", l), min: 7 },
  { name: "titulin", path: (l) => getLocalizedPath("navigationLicense", l), min: 6 },
  ...LICENSED_BOAT_IDS.map((id) => ({ name: id, path: (l: LangCode) => getLocalizedPath("boatDetail", l, { slug: id }), min: 8 })),
  { name: CAPTAINED_BOAT_ID, path: (l) => getLocalizedPath("boatDetail", l, { slug: CAPTAINED_BOAT_ID }), min: 6 },
];

describe("fleet ids", () => {
  it("3 self-drive licensed boats + 1 captained excursion, no jet ski, no retired hull", () => {
    expect([...LICENSED_BOAT_IDS].sort()).toEqual(["mingolla-brava-19", "pacific-craft-625", "trimarchi-57s"]);
    expect(CAPTAINED_BOAT_ID).toBe("excursion-privada");
  });
});

describe("internal links in the SSR body (8 languages)", () => {
  for (const page of PAGES) {
    for (const lang of LANGS) {
      it(`${page.name} ${lang}`, async () => {
        const r = await get(page.path(lang));
        expect(r.status).toBe(200);
        const links = internalPaths(fallbackOf(r.text));
        expect(links.length).toBeGreaterThanOrEqual(page.min);
        for (const l of links) expect(l.startsWith(`/${lang}/`), `${l} must start with /${lang}/`).toBe(true);
        // the retired licence-free landing is never linked from here
        expect(links).not.toContain(getLocalizedPath("categoryLicenseFree", lang));
        // the sister school only through its handoff (es/ca/en), never as another link
        const external = hrefs(fallbackOf(r.text)).filter((h) => /escolanautica/i.test(h));
        if (!["es", "ca", "en"].includes(lang)) expect(external).toEqual([]);
        // Tossa closes the list: it is never the first link of the block
        expect(links[0]).not.toBe(getLocalizedPath("locationTossa", lang));
      });
    }
  }

  it("every linked destination answers 200 (no soft 404, no redirect hop)", async () => {
    const targets = new Set<string>();
    for (const page of PAGES) {
      for (const lang of LANGS) {
        const r = await get(page.path(lang));
        for (const l of internalPaths(fallbackOf(r.text))) targets.add(l.split("#")[0]);
      }
    }
    expect(targets.size).toBeGreaterThan(40);
    const bad: string[] = [];
    for (const t of targets) {
      const r = await get(t);
      if (r.status !== 200) bad.push(`${t} -> ${r.status}`);
    }
    expect(bad).toEqual([]);
  }, 120_000);
});

describe("home bodyFallback", () => {
  for (const lang of LANGS) {
    it(`${lang}: no bare /barcos or /faq, links the three money pages`, async () => {
      const r = await get(getLocalizedPath("home", lang));
      expect(r.status).toBe(200);
      const links = internalPaths(fallbackOf(r.text));
      expect(links).not.toContain("/barcos");
      expect(links).not.toContain("/faq");
      for (const l of links) expect(l.startsWith(`/${lang}/`), `${l} must start with /${lang}/`).toBe(true);
      expect(links).toContain(getLocalizedPath("categoryLicensed", lang));
      expect(links).toContain(getLocalizedPath("categoryCaptained", lang));
      expect(links).toContain(getLocalizedPath("navigationLicense", lang));
      expect(links).not.toContain(getLocalizedPath("categoryLicenseFree", lang));
    });
  }
});

describe("boat pages: 300+ words and localised insurance/fuel text", () => {
  for (const id of BOATS) {
    for (const lang of LANGS) {
      it(`${id} ${lang}`, async () => {
        const r = await get(getLocalizedPath("boatDetail", lang, { slug: id }));
        const body = fallbackOf(r.text);
        const text = decode(body);
        expect(wordCount(body)).toBeGreaterThanOrEqual(300);

        const t = BUNDLES[lang];
        // insurance: the localised INSURANCE_SCOPE_ES formula incl. the seats limit, nothing else
        expect(text).toContain(t.boatDetail.ssrInsurance);
        expect(text).not.toMatch(/todo riesgo|fully insured|full insurance/i);
        expect(text).not.toContain("Incluye: IVA, amarre");
        // the "included" items are translated and the insurance item is not repeated in looser words
        expect(text).not.toMatch(/Seguro de responsabilidad/);
        if (lang !== "es") expect(text).not.toMatch(/Amarre|Limpieza|Patrón profesional/);
        if (lang !== "es") expect(text).not.toContain(es.boatDetail.ssrInsurance);
        if (lang !== "es") expect(text).not.toContain(es.boatDetail.ssrBookingNote);
        // fuel: never claimed for these four boats; the not-included note is the localised one
        expect(text).not.toContain(t.boatDetail.fuelIncludedShort);
        expect(text).toContain(t.boatDetail.fuelNotIncludedNote);
        if (lang !== "es") expect(text).not.toContain(es.boatDetail.fuelNotIncludedNote);
        // booking cap: the captained excursion is capped at 4 h, licensed boats are not
        const cap = t.boatDetail.ssrMaxDuration.replace("{hours}", "4");
        if (id === CAPTAINED_BOAT_ID) expect(text).toContain(cap);
        else expect(text).not.toContain(cap);
        // the excursion is never "sin licencia" nor a 15 HP titulin boat
        if (id === CAPTAINED_BOAT_ID) {
          expect(text).not.toMatch(/sin licencia|without licen[cs]e|sans permis|ohne Lizenz|zonder vaarbewijs|senza patente|sense llicència|без лицензии|hasta 15 CV/i);
        }
      });
    }
  }

  it("the Spanish insurance line is the INSURANCE_SCOPE_ES formula (RC obligatoria + voluntaria + accidentes + plazas)", () => {
    const s = es.boatDetail.ssrInsurance;
    expect(INSURANCE_SCOPE_ES).toMatch(/Responsabilidad Civil/);
    expect(s).toMatch(/Responsabilidad Civil obligatorio \(RD 607\/1999\)/);
    expect(s).toMatch(/voluntaria/);
    expect(s).toMatch(/accidentes para los ocupantes/);
    expect(s).toMatch(/plazas homologado/);
    expect(s).not.toMatch(/todo riesgo/i);
  });
});
