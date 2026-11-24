/**
 * Ola 3.7 (SEO): the home bodyFallback is the only home text GPTBot/ClaudeBot/PerplexityBot and
 * Googlebot-without-JS read (production does not prerender, see CLAUDE.md). It must be native in
 * the 8 languages (it used to be es/en ternaries), come from the locale bundles, link to the
 * localised money pages and carry at least as much text as the Spanish body had on 2026-11-24.
 * Harness copied from server/seoLinks.test.ts.
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
import { serveWithSEO } from "./seoInjector";
import { redirectMiddleware } from "./seo/redirects";
import { getLocalizedPath } from "../shared/i18n-routes";
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "homessr-"));
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

// Same three rules as shared/forbiddenClaims.test.ts (insurance, PER/PNB, own course); the home
// must never regress into them.
const FORBIDDEN: RegExp[] = [
  /todo riesgo|fully insured|full insurance|seguro completo|comprehensive insurance|tous risques|vollkasko|all[- ]risk/i,
  /\bPER (o|or|ou|oder|of|e|и|i) PNB\b|Range:\s*Unlimited/i,
  /we arrange the (1-day )?course|te organizamos el curso|te lo sacamos en 1 d[ií]a|Licence in 1 Day/i,
];

// Words of the Spanish home body on 2026-11-24 (before this change): the floor for every language.
const MIN_WORDS = 225;

describe("home bodyFallback is native in 8 languages", () => {
  for (const lang of LANGS) {
    it(lang, async () => {
      const r = await get(getLocalizedPath("home", lang));
      expect(r.status).toBe(200);
      const body = fallbackOf(r.text);
      const text = decode(body.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
      const t = BUNDLES[lang];

      // native copy from this language's bundle
      expect(decode(body.match(/<h1>([\s\S]*?)<\/h1>/)![1])).toBe(t.hero.title);
      for (const s of [t.hero.specsLine, t.hero.licenseNote, t.homeSsr.hours, t.homeSsr.coves, t.boatDetail.ssrInsurance, t.navigationLicensePage.fleet.body]) {
        expect(text, `missing "${s.slice(0, 40)}"`).toContain(s);
      }
      expect(wordCount(body)).toBeGreaterThanOrEqual(MIN_WORDS);

      // no Spanish leaking into the other languages (Catalan shares words, so compare whole strings)
      if (lang !== "es") {
        for (const s of [es.hero.specsLine, es.homeSsr.hours, es.homeSsr.coves, es.features.withLicense.description, es.captainedPage.heroDescription]) {
          expect(text).not.toContain(s);
        }
        expect(text).not.toMatch(/[¿¡]|Reserva por WhatsApp|Respuesta inmediata|titulación/);
      }

      // internal links: localised, no bare /barcos or /faq, no licence-free landing
      const links = internalPaths(body);
      expect(links.length).toBeGreaterThanOrEqual(7);
      expect(links).not.toContain("/barcos");
      expect(links).not.toContain("/faq");
      for (const l of links) expect(l.startsWith(`/${lang}/`), `${l} must start with /${lang}/`).toBe(true);
      for (const key of ["categoryLicensed", "categoryCaptained", "navigationLicense", "pricing", "faq"] as const) {
        expect(links).toContain(getLocalizedPath(key, lang));
      }
      expect(links).not.toContain(getLocalizedPath("categoryLicenseFree", lang));

      // claims, style and the school (only es/ca/en handoff, never a link here)
      for (const re of FORBIDDEN) expect(text).not.toMatch(re);
      expect(text).not.toMatch(/—|–/);
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(hrefs(body).filter((h) => /escolanautica/i.test(h))).toEqual([]);
      // no literal fleet count or price for applyFleetStatsToText to chase
      expect(text).not.toMatch(/\b9 (barcos|boats|bateaux|boote|boten|barche|embarcacions)\b|\b70 ?(EUR|€)/i);
    });
  }
});
