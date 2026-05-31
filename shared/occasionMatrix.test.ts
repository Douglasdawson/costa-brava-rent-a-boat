import { describe, it, expect } from "vitest";
import { getSlugForPage } from "./i18n-routes";
import { OCCASION_LIST } from "./occasions";
import {
  MATRIX_LOCATION_KEYS,
  MATRIX_SIZE,
  enumerateMatrix,
} from "./occasionMatrix";

describe("occasion × location matrix", () => {
  it("enumerates occasions × eligible locations", () => {
    const combos = enumerateMatrix();
    expect(combos.length).toBe(OCCASION_LIST.length * MATRIX_LOCATION_KEYS.length);
    expect(combos.length).toBe(MATRIX_SIZE);
  });

  it("every eligible location resolves to a real ES route slug", () => {
    for (const key of MATRIX_LOCATION_KEYS) {
      const slug = getSlugForPage(key, "es");
      expect(slug, key).toBeTruthy();
    }
  });

  it("produces unique (occasion, location) pairs", () => {
    const combos = enumerateMatrix();
    const keys = new Set(combos.map((c) => `${c.occasion.id}::${c.locationKey}`));
    expect(keys.size).toBe(combos.length);
  });
});
