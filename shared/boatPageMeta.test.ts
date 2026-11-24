import { describe, it, expect } from "vitest";
import { BOAT_DATA, boatDataRequiresLicense, isCaptainedBoat, isPubliclyListed } from "./boatData";
import { buildBoatOffer, buildBoatPageMeta, boatFromPriceLabel, getBoatFromBlock, type BoatPageMetaInput } from "./boatPageMeta";
import { getSEOConfig, boatDetailSEOData, generateEnhancedProductSchema } from "../client/src/utils/seo-config";
import { translateBoatText } from "./boatTextTranslations";

const LANGS = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] as const;
const PRE_ERA = new Date("2026-08-01T10:00:00Z");
const POST_ERA = new Date("2026-10-15T10:00:00Z");

const asInput = (id: string): BoatPageMetaInput => {
  const b = BOAT_DATA[id];
  return {
    id,
    name: b.name,
    capacity: parseInt(b.specifications.capacity, 10),
    requiresLicense: boatDataRequiresLicense(b) || isCaptainedBoat(id),
    pricing: b.pricing,
  };
};

// What a visitor can see after 2026-10-01 (hulls without licence are retired) and before it.
const listed = (now: Date) =>
  Object.keys(BOAT_DATA).filter((id) =>
    isPubliclyListed({ id, requiresLicense: asInput(id).requiresLicense && !isCaptainedBoat(id), isActive: true }, now),
  );

// Same rules as shared/forbiddenClaims.test.ts (RULES + ONE_DAY_COURSE + PRIVATE_EXCURSION_WRONG);
// they are not exported from a test file, so they are mirrored here.
const FORBIDDEN: RegExp[] = [
  /todo riesgo|fully insured|full insurance|seguro completo|comprehensive insurance|tous risques|vollkasko|all[- ]risk/i,
  /\bPER (o|or|ou|oder|of|e|и|i) PNB\b|Range:\s*Unlimited/i,
  /we arrange the (1-day )?course|te organizamos el curso|te lo sacamos en 1 d[ií]a|Licence in 1 Day/i,
  /Curso de 1 d[ií]a|1[- ]day (licen[cs]e )?course/i,
  /excursi[oó]n[^.\n]{0,80}\b7 (personas|people|pax)|private excursion[^.\n]{0,80}\b7 (people|pax)/i,
];
// A 2 h price must never be written per hour, and the 8-language "licence-free" promise is off after the era.
const PER_HOUR = /\/\s?h\b|€\s?\/\s?(h|ч|uur|Std)|EUR\/h|per hour/i;
const LICENSE_FREE =
  /sin licencia|sin t[ií]tulo|sense llic[eè]ncia|sans permis|ohne Lizenz|Kein Bootsf|zonder vaarbewijs|senza patente|без лицензии|without licen[cs]e|no licen[cs]e/i;
const FUEL_INCLUDED = /gasolina inclu|gasolina inclosa|fuel included|carburant inclus|Kraftstoff inklusive|brandstof inbegrepen|carburante incluso|топливо включено/i;
const EM_DASH = /—/;

describe("boatPageMeta: title and description of a boat page", () => {
  for (const [label, now] of [["post-era", POST_ERA], ["pre-era", PRE_ERA]] as const) {
    for (const id of listed(now)) {
      for (const lang of LANGS) {
        it(`${label} ${id} ${lang}`, () => {
          const m = buildBoatPageMeta(asInput(id), lang, now);
          const text = `${m.title}\n${m.description}`;
          expect(m.title.length).toBeGreaterThan(10);
          expect(m.description.length).toBeGreaterThan(40);
          expect(m.description.length).toBeLessThanOrEqual(160);
          expect(text).not.toMatch(PER_HOUR);
          expect(text).not.toMatch(EM_DASH);
          expect(text).not.toMatch(/\.\.|[,;]\s*\./); // no stray punctuation from joined fragments
          expect(text).not.toMatch(/70 EUR|9 (barcos|boats)/);
          for (const re of FORBIDDEN) expect(text).not.toMatch(re);
          // Price is the real minimum block: "175 € / 2 h", never a bare per-hour figure.
          const block = getBoatFromBlock(id, BOAT_DATA[id].pricing)!;
          expect(m.title).toContain(`${block.price} € / ${block.hours} `);
          if (now === POST_ERA) {
            expect(text).not.toMatch(LICENSE_FREE);
            expect(text).not.toMatch(FUEL_INCLUDED);
          }
          if (isCaptainedBoat(id)) {
            expect(text).not.toMatch(LICENSE_FREE);
            expect(text).not.toMatch(FUEL_INCLUDED);
          }
        });
      }
    }
  }

  it("min block of the real boats: licensed 175 € / 2 h, excursion 265 € / 2 h", () => {
    expect(getBoatFromBlock("mingolla-brava-19", BOAT_DATA["mingolla-brava-19"].pricing)).toEqual({ price: 175, hours: 2 });
    expect(boatFromPriceLabel("excursion-privada", BOAT_DATA["excursion-privada"].pricing, "es")).toBe("desde 265 € / 2 h");
  });

  it("ignores 0 placeholders and returns null without pricing", () => {
    expect(getBoatFromBlock("x", { BAJA: { prices: { "1h": 0, "2h": 120 } } })).toEqual({ price: 120, hours: 2 });
    expect(getBoatFromBlock("x", null)).toBeNull();
    expect(boatFromPriceLabel("x", undefined, "es")).toBe("");
  });

  it("licence-free era keeps the fuel claim only for the self-drive boats", () => {
    const m = buildBoatPageMeta(asInput("solar-450"), "es", PRE_ERA);
    expect(m.description).toMatch(/sin licencia/);
    expect(m.description).toMatch(/gasolina incluida/);
  });
});

describe("parity: client getSEOConfig === shared template (what the SSR shell renders)", () => {
  for (const id of listed(POST_ERA)) {
    for (const lang of LANGS) {
      it(`${id} ${lang}`, () => {
        const input = asInput(id);
        const shared = buildBoatPageMeta(input, lang);
        const key = id === "excursion-privada" ? "excursionDetail" : "boatDetail";
        const client = getSEOConfig(key, lang, boatDetailSEOData(input, lang));
        expect(client.title).toBe(shared.title);
        expect(client.description).toBe(shared.description);
      });
    }
  }
});

describe("Product offers", () => {
  it("one price is an Offer, several are an AggregateOffer with the real low/high", () => {
    const opts = { seasonYear: 2027, sellerId: "x#o", sellerName: "x" };
    expect(buildBoatOffer("x", { BAJA: { prices: { "2h": 100, "4h": 0 } } }, opts)).toMatchObject({ "@type": "Offer", price: 100 });
    const agg = buildBoatOffer("mingolla-brava-19", BOAT_DATA["mingolla-brava-19"].pricing, opts) as Record<string, unknown>;
    expect(agg["@type"]).toBe("AggregateOffer");
    expect(agg.lowPrice).toBe(175);
    expect(agg.highPrice).toBe(420);
    expect(agg.offerCount).toBe(9);
    expect(agg).not.toHaveProperty("priceSpecification");
    expect(buildBoatOffer("x", null, opts)).toBeNull();
  });

  it("licence-free boats are capped at 4 h in the range", () => {
    const opts = { seasonYear: 2027, sellerId: "x#o", sellerName: "x" };
    const agg = buildBoatOffer("solar-450", BOAT_DATA["solar-450"].pricing, opts) as Record<string, unknown>;
    expect(agg.highPrice).toBe(240);
  });

  it("client Product schema: no aggregateRating, no per-hour price", () => {
    const s = generateEnhancedProductSchema(
      { id: "mingolla-brava-19", name: "Mingolla Brava 19", description: "d", capacity: 6, power: 80, pricing: BOAT_DATA["mingolla-brava-19"].pricing },
      "es",
    );
    expect(s).not.toHaveProperty("aggregateRating");
    expect(JSON.stringify(s)).not.toMatch(/UnitPriceSpecification|"unitText":"hour"/);
    expect(s.offers).toMatchObject({ "@type": "AggregateOffer", lowPrice: 175, highPrice: 420 });
  });

  it("translateBoatText is what the template uses for the name", () => {
    const input = asInput("excursion-privada");
    expect(translateBoatText(input.name, "en")).toBeTruthy();
  });
});
