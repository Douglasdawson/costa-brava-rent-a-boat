import { describe, it, expect } from "vitest";
import {
  resolveMatrixCombo,
  indexableLangsForCombo,
  comboId,
  matrixSlug,
  matrixPath,
  matrixSlugCollisions,
  enumerateMatrixSitemapEntries,
} from "./occasionMatrixPage";
import { enumerateMatrix, MATRIX_LOCATION_KEYS } from "./occasionMatrix";
import { OCCASIONS } from "./occasions";
import type { LangCode } from "./seoConstants";

describe("occasionMatrixPage", () => {
  it("resolves every enumerated combo to structural data", () => {
    for (const combo of enumerateMatrix()) {
      const data = resolveMatrixCombo(combo);
      expect(data).not.toBeNull();
      expect(data!.comboId).toBe(`${combo.occasion.id}__${combo.locationKey}`);
      expect(data!.occasionRouteKey).toBe(combo.occasion.routeKey);
      expect(data!.boats.length).toBeGreaterThan(0);
      expect(data!.durations.length).toBeGreaterThan(0);
    }
  });

  it("resolved boats all carry name + capacity (no broken ids)", () => {
    const data = resolveMatrixCombo({ occasion: OCCASIONS.snorkel, locationKey: "locationTossa" });
    expect(data).not.toBeNull();
    for (const b of data!.boats) {
      expect(b.id).toBeTruthy();
      expect(b.name).toBeTruthy();
      expect(b.capacity).toBeTruthy();
    }
  });

  it("comboId is stable and unique across the matrix", () => {
    const ids = enumerateMatrix().map((c) => comboId(c.occasion.id, c.locationKey));
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe("indexableLangsForCombo", () => {
    it("returns only langs where BOTH occasion and location are indexable (intersection)", () => {
      const combo = { occasion: OCCASIONS.snorkel, locationKey: MATRIX_LOCATION_KEYS[0] };
      // occasion indexable in es+en, location only in es → intersection = es only
      const stub = (metaKey: string, lang: LangCode): boolean => {
        if (metaKey.includes("snorkel")) return lang === "es" || lang === "en";
        return lang === "es"; // location
      };
      expect(indexableLangsForCombo(combo, stub).sort()).toEqual(["es"]);
    });

    it("returns empty when the location is not indexable anywhere", () => {
      const combo = { occasion: OCCASIONS.fishing, locationKey: MATRIX_LOCATION_KEYS[0] };
      const occasionOnly = (metaKey: string): boolean => metaKey.includes("pesca");
      expect(indexableLangsForCombo(combo, occasionOnly)).toEqual([]);
    });

    it("returns all 8 langs when both parents are fully translated", () => {
      const combo = { occasion: OCCASIONS.sunset, locationKey: MATRIX_LOCATION_KEYS[1] };
      const allTrue = () => true;
      expect(indexableLangsForCombo(combo, allTrue).length).toBe(8);
    });
  });

  describe("slugs", () => {
    it("builds the localized composite slug + path", () => {
      expect(matrixSlug("snorkel", "locationTossa", "es")).toBe("snorkel-tossa-de-mar");
      expect(matrixSlug("snorkel", "locationTossa", "de")).toBe("schnorcheln-tossa-de-mar");
      expect(matrixPath("fishing", "locationLloret", "fr")).toBe("/fr/peche-lloret-de-mar");
    });

    it("every matrix slug is unique per language (no two combos share a slug)", () => {
      const langs = ["es", "en", "fr", "de", "ca", "nl", "it", "ru"] as const;
      for (const lang of langs) {
        const slugs = enumerateMatrix().map((c) => matrixSlug(c.occasion.id, c.locationKey, lang));
        expect(new Set(slugs).size).toBe(slugs.length);
      }
    });

    it("no matrix slug collides with an existing ROUTE_SLUGS slug", () => {
      expect(matrixSlugCollisions(enumerateMatrix())).toEqual([]);
    });
  });

  describe("sitemap entries", () => {
    it("emits one entry per combo with all 8 alternates when fully indexable", () => {
      const entries = enumerateMatrixSitemapEntries(enumerateMatrix(), () => true);
      expect(entries.length).toBe(enumerateMatrix().length);
      for (const e of entries) {
        expect(e.alternates.length).toBe(8);
        expect(e.alternates.every((a) => a.path.startsWith("/"))).toBe(true);
      }
    });

    it("drops combos with no indexable language", () => {
      const entries = enumerateMatrixSitemapEntries(enumerateMatrix(), () => false);
      expect(entries).toEqual([]);
    });

    it("restricts alternates to indexable langs only (ES-only parents → ES-only entry)", () => {
      const esOnly = (_m: string, lang: string) => lang === "es";
      const entries = enumerateMatrixSitemapEntries(enumerateMatrix(), esOnly);
      expect(entries.length).toBeGreaterThan(0);
      for (const e of entries) {
        expect(e.alternates.map((a) => a.lang)).toEqual(["es"]);
      }
    });
  });
});
