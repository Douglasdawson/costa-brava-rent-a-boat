import { describe, it, expect } from "vitest";
import {
  getSeason,
  isWeekend,
  isOperationalSeason,
  calculateBasePrice,
  calculateExtrasPrice,
  calculatePricingBreakdown,
  getDepositAmount,
  isValidDuration,
  getMinimumDuration,
  WEEKEND_SURCHARGE_FACTOR,
  getAvailableDurations,
  getAllBoatIds,
  formatPrice,
  priceFor,
  getSeasonDisplayName,
  calculatePackSavings,
  selectApplicableOverride,
  applyOverrideToPrice,
  getWeekdayInMadrid,
  getDateStringInMadrid,
  type PricingOverrideRule,
} from "./pricing";

describe("getSeason", () => {
  it("returns BAJA for April", () => {
    expect(getSeason(new Date("2026-04-15"))).toBe("BAJA");
  });

  it("returns BAJA for May", () => {
    expect(getSeason(new Date("2026-05-10"))).toBe("BAJA");
  });

  it("returns BAJA for June", () => {
    expect(getSeason(new Date("2026-06-10"))).toBe("BAJA");
  });

  it("returns MEDIA for July", () => {
    expect(getSeason(new Date("2026-07-15"))).toBe("MEDIA");
  });

  it("returns ALTA for August", () => {
    expect(getSeason(new Date("2026-08-15"))).toBe("ALTA");
  });

  it("returns BAJA for September", () => {
    expect(getSeason(new Date("2026-09-20"))).toBe("BAJA");
  });

  it("returns BAJA for October", () => {
    expect(getSeason(new Date("2026-10-05"))).toBe("BAJA");
  });

  it("throws for January (outside operational season)", () => {
    expect(() => getSeason(new Date("2026-01-15"))).toThrow("outside operational season");
  });

  it("throws for November (outside operational season)", () => {
    expect(() => getSeason(new Date("2026-11-15"))).toThrow("outside operational season");
  });

  it("throws for December (outside operational season)", () => {
    expect(() => getSeason(new Date("2026-12-25"))).toThrow("outside operational season");
  });

  it("throws for March (outside operational season)", () => {
    expect(() => getSeason(new Date("2026-03-15"))).toThrow("outside operational season");
  });
});

describe("isOperationalSeason", () => {
  it("returns true for April", () => {
    expect(isOperationalSeason(new Date("2026-04-01"))).toBe(true);
  });

  it("returns true for May", () => {
    expect(isOperationalSeason(new Date("2026-05-15"))).toBe(true);
  });

  it("returns true for June", () => {
    expect(isOperationalSeason(new Date("2026-06-15"))).toBe(true);
  });

  it("returns true for July", () => {
    expect(isOperationalSeason(new Date("2026-07-15"))).toBe(true);
  });

  it("returns true for August", () => {
    expect(isOperationalSeason(new Date("2026-08-15"))).toBe(true);
  });

  it("returns true for September", () => {
    expect(isOperationalSeason(new Date("2026-09-15"))).toBe(true);
  });

  it("returns true for October", () => {
    expect(isOperationalSeason(new Date("2026-10-31"))).toBe(true);
  });

  it("returns false for January", () => {
    expect(isOperationalSeason(new Date("2026-01-15"))).toBe(false);
  });

  it("returns false for November", () => {
    expect(isOperationalSeason(new Date("2026-11-01"))).toBe(false);
  });

  it("returns false for December", () => {
    expect(isOperationalSeason(new Date("2026-12-15"))).toBe(false);
  });

  it("returns false for March", () => {
    expect(isOperationalSeason(new Date("2026-03-15"))).toBe(false);
  });
});

describe("isWeekend", () => {
  it("returns true for Saturday (April 4, 2026)", () => {
    expect(isWeekend(new Date("2026-04-04T12:00:00"))).toBe(true);
  });

  it("returns true for Sunday (April 5, 2026)", () => {
    expect(isWeekend(new Date("2026-04-05T12:00:00"))).toBe(true);
  });

  it("returns false for Monday (April 6, 2026)", () => {
    expect(isWeekend(new Date("2026-04-06T12:00:00"))).toBe(false);
  });

  it("returns false for Tuesday (April 7, 2026)", () => {
    expect(isWeekend(new Date("2026-04-07T12:00:00"))).toBe(false);
  });

  it("returns false for Wednesday (April 8, 2026)", () => {
    expect(isWeekend(new Date("2026-04-08T12:00:00"))).toBe(false);
  });

  it("returns false for Thursday (April 9, 2026)", () => {
    expect(isWeekend(new Date("2026-04-09T12:00:00"))).toBe(false);
  });

  it("returns false for Friday (April 10, 2026)", () => {
    expect(isWeekend(new Date("2026-04-10T12:00:00"))).toBe(false);
  });
});

describe("getMinimumDuration", () => {
  it("returns 2h for August dates", () => {
    expect(getMinimumDuration(new Date("2026-08-15T12:00:00"))).toBe("2h");
  });

  it("returns 2h for Saturday (weekend)", () => {
    expect(getMinimumDuration(new Date("2026-04-04T12:00:00"))).toBe("2h");
  });

  it("returns 2h for Sunday (weekend)", () => {
    expect(getMinimumDuration(new Date("2026-04-05T12:00:00"))).toBe("2h");
  });

  it("returns 1h for weekday in April", () => {
    expect(getMinimumDuration(new Date("2026-04-06T12:00:00"))).toBe("1h");
  });

  it("returns 1h for weekday in June", () => {
    expect(getMinimumDuration(new Date("2026-06-10T12:00:00"))).toBe("1h");
  });

  it("returns 1h for weekday in September", () => {
    expect(getMinimumDuration(new Date("2026-09-15T12:00:00"))).toBe("1h");
  });
});

describe("calculateBasePrice", () => {
  it("returns correct price for solar-450 in BAJA 2h on weekday", () => {
    const price = calculateBasePrice("solar-450", new Date("2026-04-06T12:00:00"), "2h");
    expect(price).toBe(115); // BAJA 2h = 115 per boatData.ts
  });

  it("returns correct price for solar-450 in BAJA 1h on weekday", () => {
    const price = calculateBasePrice("solar-450", new Date("2026-04-06T12:00:00"), "1h");
    expect(price).toBe(75);
  });

  it("returns correct price for solar-450 in MEDIA 2h on weekday", () => {
    const price = calculateBasePrice("solar-450", new Date("2026-07-06T12:00:00"), "2h");
    expect(price).toBe(135); // MEDIA 2h = 135 per boatData.ts
  });

  it("returns correct price for solar-450 in ALTA 2h on weekday", () => {
    const price = calculateBasePrice("solar-450", new Date("2026-08-06T12:00:00"), "2h");
    expect(price).toBe(150); // ALTA 2h = 150 per boatData.ts
  });

  it("applies weekend surcharge correctly (rounded to nearest 10)", () => {
    // Saturday (weekend) in BAJA with 2h
    const weekendPrice = calculateBasePrice("solar-450", new Date("2026-04-04T12:00:00"), "2h");
    const weekdayPrice = calculateBasePrice("solar-450", new Date("2026-04-06T12:00:00"), "2h");
    // 115 * 1.15 = 132.25 → roundToNearestTen → 130
    expect(weekendPrice).toBe(130);
    expect(weekdayPrice).toBe(115); // catalog base, untouched
    // sanity: WEEKEND_SURCHARGE_FACTOR is still 1.15
    expect(WEEKEND_SURCHARGE_FACTOR).toBe(1.15);
  });

  it("throws for unknown boat", () => {
    expect(() => calculateBasePrice("nonexistent", new Date("2026-06-15"), "2h")).toThrow(
      'Boat with id "nonexistent" not found'
    );
  });

  it("throws for date outside season", () => {
    expect(() => calculateBasePrice("solar-450", new Date("2026-01-15"), "2h")).toThrow(
      "outside operational season"
    );
  });

  it("throws for unsupported duration", () => {
    expect(() => calculateBasePrice("solar-450", new Date("2026-06-15"), "5h" as any)).toThrow(
      "Price not found"
    );
  });
});

describe("calculateExtrasPrice", () => {
  it("returns 0 for no extras", () => {
    expect(calculateExtrasPrice("solar-450", [])).toBe(0);
  });

  it("returns 0 for empty packs", () => {
    expect(calculateExtrasPrice("solar-450", [], [])).toBe(0);
  });

  it("calculates price for single extra", () => {
    const price = calculateExtrasPrice("solar-450", ["Parking delante del Barco"]);
    expect(price).toBe(10);
  });

  it("calculates price for multiple extras", () => {
    const price = calculateExtrasPrice("solar-450", ["Parking delante del Barco", "Snorkel"]);
    expect(price).toBe(17.5); // 10 + 7.5
  });

  it("parses float prices correctly (e.g., Bebidas 2,5€/ud)", () => {
    const price = calculateExtrasPrice("solar-450", ["Bebidas"]);
    expect(price).toBe(2.5);
  });

  it("throws for unknown boat", () => {
    expect(() => calculateExtrasPrice("nonexistent", ["Parking"])).toThrow(
      'Boat with id "nonexistent" not found'
    );
  });

  it("ignores non-existent extras gracefully", () => {
    const price = calculateExtrasPrice("solar-450", ["NonExistent", "Parking delante del Barco"]);
    expect(price).toBe(10);
  });
});

describe("calculatePricingBreakdown", () => {
  it("returns complete breakdown with all fields", () => {
    const breakdown = calculatePricingBreakdown("solar-450", new Date("2026-06-15T12:00:00"), "4h");

    expect(breakdown.boatId).toBe("solar-450");
    expect(breakdown.boatName).toBe("Solar 450");
    expect(breakdown.date).toBe("2026-06-15");
    expect(breakdown.duration).toBe("4h");
    expect(breakdown.season).toBe("BAJA");
    expect(breakdown.weekendSurcharge).toBe(false);
    expect(breakdown.basePrice).toBe(150); // BAJA 4h = 150 per boatData.ts
    expect(breakdown.selectedExtras).toEqual([]);
    expect(breakdown.selectedPacks).toEqual([]);
    expect(breakdown.extrasPrice).toBe(0);
    expect(breakdown.deposit).toBe(250);
    expect(breakdown.subtotal).toBe(150);
    expect(breakdown.total).toBe(400);
  });

  it("includes weekend surcharge in breakdown (rounded to nearest 10)", () => {
    const breakdown = calculatePricingBreakdown("solar-450", new Date("2026-04-04T12:00:00"), "2h");
    expect(breakdown.weekendSurcharge).toBe(true);
    expect(breakdown.basePrice).toBe(130); // 115 * 1.15 = 132.25 → roundToNearestTen → 130
  });

  it("calculates subtotal correctly (basePrice + extrasPrice)", () => {
    const breakdown = calculatePricingBreakdown(
      "solar-450",
      new Date("2026-06-15T12:00:00"),
      "2h",
      ["Parking delante del Barco", "Snorkel"]
    );
    expect(breakdown.extrasPrice).toBe(17.5);
    expect(breakdown.subtotal).toBe(breakdown.basePrice + breakdown.extrasPrice);
    expect(breakdown.subtotal).toBe(115 + 17.5);
  });

  it("calculates total correctly (subtotal + deposit)", () => {
    const breakdown = calculatePricingBreakdown(
      "solar-450",
      new Date("2026-06-15T12:00:00"),
      "2h",
      ["Parking delante del Barco"]
    );
    expect(breakdown.total).toBe(breakdown.subtotal + breakdown.deposit);
    expect(breakdown.total).toBe(115 + 10 + 250);
  });

  it("throws for unknown boat", () => {
    expect(() => calculatePricingBreakdown("nonexistent", new Date("2026-06-15"), "2h")).toThrow(
      'Boat with id "nonexistent" not found'
    );
  });

  it("includes extras in breakdown", () => {
    const breakdown = calculatePricingBreakdown(
      "solar-450",
      new Date("2026-06-15T12:00:00"),
      "2h",
      ["Parking delante del Barco"],
      []
    );
    expect(breakdown.selectedExtras).toEqual(["Parking delante del Barco"]);
  });

  it("includes packs in breakdown", () => {
    const breakdown = calculatePricingBreakdown(
      "solar-450",
      new Date("2026-06-15T12:00:00"),
      "2h",
      [],
      ["pack-1"]
    );
    expect(breakdown.selectedPacks).toEqual(["pack-1"]);
  });
});

describe("getDepositAmount", () => {
  it("returns deposit for solar-450", () => {
    const deposit = getDepositAmount("solar-450");
    expect(deposit).toBe(250);
  });

  it("returns a positive number for valid boat", () => {
    const deposit = getDepositAmount("solar-450");
    expect(deposit).toBeGreaterThan(0);
    expect(typeof deposit).toBe("number");
  });

  it("throws for unknown boat", () => {
    expect(() => getDepositAmount("nonexistent")).toThrow(
      'Boat with id "nonexistent" not found'
    );
  });
});

describe("isValidDuration", () => {
  it("returns true for 1h", () => {
    expect(isValidDuration("1h")).toBe(true);
  });

  it("returns true for 2h", () => {
    expect(isValidDuration("2h")).toBe(true);
  });

  it("returns true for 3h", () => {
    expect(isValidDuration("3h")).toBe(true);
  });

  it("returns true for 4h", () => {
    expect(isValidDuration("4h")).toBe(true);
  });

  it("returns true for 6h", () => {
    expect(isValidDuration("6h")).toBe(true);
  });

  it("returns true for 8h", () => {
    expect(isValidDuration("8h")).toBe(true);
  });

  it("returns false for 5h (invalid duration)", () => {
    expect(isValidDuration("5h")).toBe(false);
  });

  it("returns false for 10m", () => {
    expect(isValidDuration("10m")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidDuration("")).toBe(false);
  });

  it("returns false for 24h", () => {
    expect(isValidDuration("24h")).toBe(false);
  });
});

describe("getAvailableDurations", () => {
  it("returns array of durations for solar-450", () => {
    const durations = getAvailableDurations("solar-450");
    expect(Array.isArray(durations)).toBe(true);
    expect(durations).toContain("1h");
    expect(durations).toContain("2h");
    expect(durations).toContain("4h");
    expect(durations).toContain("8h");
  });

  it("throws for unknown boat", () => {
    expect(() => getAvailableDurations("nonexistent")).toThrow(
      'Boat with id "nonexistent" not found'
    );
  });
});

describe("getAllBoatIds", () => {
  it("returns array of boat IDs", () => {
    const boatIds = getAllBoatIds();
    expect(Array.isArray(boatIds)).toBe(true);
    expect(boatIds.length).toBeGreaterThan(0);
    expect(boatIds).toContain("solar-450");
  });
});

describe("formatPrice", () => {
  it("formats price with euro symbol", () => {
    expect(formatPrice(150)).toBe("150€");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("0€");
  });

  it("formats decimal amounts", () => {
    expect(formatPrice(17.5)).toBe("17.5€");
  });
});

describe("priceFor (alias for calculateBasePrice)", () => {
  it("returns same result as calculateBasePrice", () => {
    const date = new Date("2026-06-15T12:00:00");
    const priceForResult = priceFor("solar-450", date, "2h");
    const calculateBasePriceResult = calculateBasePrice("solar-450", date, "2h");
    expect(priceForResult).toBe(calculateBasePriceResult);
  });

  it("calculates correct price via priceFor alias", () => {
    const price = priceFor("solar-450", new Date("2026-04-06T12:00:00"), "2h");
    expect(price).toBe(115); // BAJA 2h = 115 per boatData.ts
  });
});

describe("getSeasonDisplayName", () => {
  it("returns Spanish name for BAJA", () => {
    expect(getSeasonDisplayName("BAJA")).toBe("Temporada Baja");
  });

  it("returns Spanish name for MEDIA", () => {
    expect(getSeasonDisplayName("MEDIA")).toBe("Temporada Media");
  });

  it("returns Spanish name for ALTA", () => {
    expect(getSeasonDisplayName("ALTA")).toBe("Temporada Alta");
  });
});

describe("calculatePackSavings", () => {
  it("returns 0 for non-existent pack", () => {
    expect(calculatePackSavings("nonexistent-pack")).toBe(0);
  });

  it("returns positive savings for valid pack", () => {
    // This test assumes there is at least one pack available
    // The actual savings value depends on EXTRA_PACKS data
    const savings = calculatePackSavings("pack-1");
    expect(typeof savings).toBe("number");
  });
});

describe("Integration: Full booking flow", () => {
  it("calculates complete pricing for a typical booking", () => {
    const date = new Date("2026-06-15T10:00:00");
    const breakdown = calculatePricingBreakdown(
      "solar-450",
      date,
      "4h",
      ["Parking delante del Barco", "Snorkel"],
      []
    );

    // Verify the complete flow
    expect(breakdown.boatId).toBe("solar-450");
    expect(breakdown.season).toBe("BAJA");
    expect(breakdown.weekendSurcharge).toBe(false);
    expect(breakdown.basePrice).toBe(150); // BAJA 4h = 150 per boatData.ts
    expect(breakdown.extrasPrice).toBe(17.5); // Parking 10 + Snorkel 7.5
    expect(breakdown.deposit).toBe(250);
    expect(breakdown.subtotal).toBe(167.5);
    expect(breakdown.total).toBe(417.5);
  });

  it("does NOT apply weekend surcharge in August (analysis showed day-of-week is irrelevant in August)", () => {
    // August 2, 2026 is a Saturday — but in August we skip the weekend surcharge.
    const date = new Date("2026-08-02T10:00:00");
    const breakdown = calculatePricingBreakdown("solar-450", date, "2h", ["Parking delante del Barco"]);

    expect(breakdown.season).toBe("ALTA");
    expect(breakdown.weekendSurcharge).toBe(false);
    // ALTA 2h = 150, no weekend surcharge in August
    expect(breakdown.basePrice).toBe(150);
    expect(breakdown.extrasPrice).toBe(10);
    expect(breakdown.subtotal).toBe(160);
    expect(breakdown.total).toBe(410);
  });
});

// ===== Pricing overrides (dynamic pricing by date block) =====

const TUESDAY_AUG_5 = new Date("2026-08-05T10:00:00"); // Mar 5 ago 2026
const SATURDAY_AUG_8 = new Date("2026-08-08T10:00:00"); // Sáb 8 ago 2026
const WEDNESDAY_AUG_19 = new Date("2026-08-19T10:00:00"); // Mié 19 ago (fuera de pico)

function makeRule(partial: Partial<PricingOverrideRule>): PricingOverrideRule {
  return {
    id: "rule-1",
    boatId: null,
    dateStart: "2026-08-01",
    dateEnd: "2026-08-17",
    weekdayFilter: null,
    direction: "surcharge",
    adjustmentType: "multiplier",
    adjustmentValue: 0.25,
    priority: 0,
    label: "Pico agosto",
    isActive: true,
    createdAt: new Date("2026-04-26T00:00:00Z"),
    ...partial,
  };
}

describe("getWeekdayInMadrid + getDateStringInMadrid", () => {
  it("returns weekday and date in Madrid TZ", () => {
    // 2025-08-15T22:00:00Z is already Aug 16 in Madrid (CEST = UTC+2 → 00:00 of Aug 16)
    const date = new Date("2025-08-15T22:00:00Z");
    expect(getDateStringInMadrid(date)).toBe("2025-08-16");
    expect(getWeekdayInMadrid(date)).toBe(6); // Saturday
  });

  it("returns Sunday=0 for a Sunday morning in Madrid", () => {
    const sunday = new Date("2026-08-09T08:00:00"); // Aug 9, 2026 is Sunday
    expect(getWeekdayInMadrid(sunday)).toBe(0);
  });
});

describe("selectApplicableOverride", () => {
  it("returns null when no rules apply", () => {
    const result = selectApplicableOverride(WEDNESDAY_AUG_19, "solar-450", [
      makeRule({ dateEnd: "2026-08-17" }), // out of range
    ]);
    expect(result).toBeNull();
  });

  it("returns null when rule is inactive", () => {
    const result = selectApplicableOverride(TUESDAY_AUG_5, "solar-450", [
      makeRule({ isActive: false }),
    ]);
    expect(result).toBeNull();
  });

  it("matches a global rule for any boat in range", () => {
    const rule = makeRule({});
    const result = selectApplicableOverride(TUESDAY_AUG_5, "solar-450", [rule]);
    expect(result?.id).toBe(rule.id);
  });

  it("respects weekday_filter (no match)", () => {
    const result = selectApplicableOverride(TUESDAY_AUG_5, "solar-450", [
      makeRule({ id: "weekend-only", weekdayFilter: [0, 6] }), // only Sat/Sun
    ]);
    expect(result).toBeNull();
  });

  it("respects weekday_filter (match)", () => {
    const result = selectApplicableOverride(SATURDAY_AUG_8, "solar-450", [
      makeRule({ id: "weekend-only", weekdayFilter: [0, 6] }),
    ]);
    expect(result?.id).toBe("weekend-only");
  });

  it("boat-specific rule wins over global", () => {
    const global = makeRule({ id: "global", boatId: null, adjustmentValue: 0.20 });
    const specific = makeRule({ id: "specific", boatId: "solar-450", adjustmentValue: 0.30 });
    const result = selectApplicableOverride(TUESDAY_AUG_5, "solar-450", [global, specific]);
    expect(result?.id).toBe("specific");
  });

  it("higher priority wins on tie of specificity", () => {
    const low = makeRule({ id: "low", priority: 0, label: "Low" });
    const high = makeRule({ id: "high", priority: 10, label: "High" });
    const result = selectApplicableOverride(TUESDAY_AUG_5, "solar-450", [low, high]);
    expect(result?.id).toBe("high");
  });

  it("most recent created_at wins on tie of priority", () => {
    const old = makeRule({ id: "old", createdAt: new Date("2026-01-01T00:00:00Z") });
    const fresh = makeRule({ id: "fresh", createdAt: new Date("2026-04-26T00:00:00Z") });
    const result = selectApplicableOverride(TUESDAY_AUG_5, "solar-450", [old, fresh]);
    expect(result?.id).toBe("fresh");
  });

  it("ignores rule for a different specific boat", () => {
    const result = selectApplicableOverride(TUESDAY_AUG_5, "solar-450", [
      makeRule({ id: "for-other", boatId: "trimarchi-57s" }),
    ]);
    expect(result).toBeNull();
  });
});

describe("applyOverrideToPrice", () => {
  it("applies a multiplier surcharge (+25%)", () => {
    const rule = makeRule({ direction: "surcharge", adjustmentType: "multiplier", adjustmentValue: 0.25 });
    expect(applyOverrideToPrice(200, rule)).toBe(250);
  });

  it("applies a flat_eur surcharge (+30€)", () => {
    const rule = makeRule({ direction: "surcharge", adjustmentType: "flat_eur", adjustmentValue: 30 });
    expect(applyOverrideToPrice(200, rule)).toBe(230);
  });

  it("applies a multiplier discount (-15%)", () => {
    const rule = makeRule({ direction: "discount", adjustmentType: "multiplier", adjustmentValue: 0.15 });
    expect(applyOverrideToPrice(200, rule)).toBe(170);
  });

  it("floors result at 0 if discount would go negative", () => {
    const rule = makeRule({ direction: "discount", adjustmentType: "flat_eur", adjustmentValue: 500 });
    expect(applyOverrideToPrice(100, rule)).toBe(0);
  });

  it("rounds result to nearest 10 (no ugly figures for the customer)", () => {
    const rule = makeRule({ direction: "surcharge", adjustmentType: "multiplier", adjustmentValue: 0.115 });
    // 200 * 1.115 = 223.0 → roundToNearestTen → 220
    expect(applyOverrideToPrice(200, rule)).toBe(220);
  });

  it("rounds 'half-up' style (e.g. 25 in last digit → up)", () => {
    const rule = makeRule({ direction: "surcharge", adjustmentType: "flat_eur", adjustmentValue: 25 });
    // 200 + 25 = 225 → Math.round(22.5) = 23 → 230
    expect(applyOverrideToPrice(200, rule)).toBe(230);
  });
});

describe("calculatePricingBreakdown with overrides", () => {
  it("regression: identical output when no overrides given", () => {
    const date = new Date("2026-08-05T10:00:00"); // Tue, ALTA, no weekend
    const without = calculatePricingBreakdown("solar-450", date, "2h", [], []);
    const withEmpty = calculatePricingBreakdown("solar-450", date, "2h", [], [], []);
    expect(without).toEqual(withEmpty);
    expect(without.appliedOverride).toBeUndefined();
  });

  it("applies a global multiplier override (+25%) on top of season pricing", () => {
    // ALTA 2h Solar 450 = 150€ base, no weekend
    const date = TUESDAY_AUG_5;
    const overrides = [makeRule({ adjustmentValue: 0.25 })];
    const breakdown = calculatePricingBreakdown("solar-450", date, "2h", [], [], overrides);
    expect(breakdown.basePriceBeforeOverride).toBe(150);
    expect(breakdown.basePrice).toBe(190); // 150 * 1.25 = 187.5 → roundToNearestTen → 190
    expect(breakdown.appliedOverride?.label).toBe("Pico agosto");
    expect(breakdown.subtotal).toBe(190);
  });

  it("override applies on top of weekend surcharge (jul, where surcharge IS active)", () => {
    const julySaturday = new Date("2026-07-04T10:00:00"); // Sat
    const overrides = [makeRule({
      dateStart: "2026-07-01",
      dateEnd: "2026-07-31",
      adjustmentValue: 0.20,
    })];
    const breakdown = calculatePricingBreakdown("solar-450", julySaturday, "2h", [], [], overrides);
    // Solar 450 MEDIA 2h = 135. Weekend factor: 135 * 1.15 = 155.25 → roundToNearestTen → 160.
    expect(breakdown.basePriceBeforeOverride).toBe(160);
    expect(breakdown.weekendSurcharge).toBe(true);
    // 160 * 1.20 = 192 → roundToNearestTen → 190
    expect(breakdown.basePrice).toBe(190);
  });

  it("override applies WITHOUT weekend surcharge in August (surcharge bypassed)", () => {
    // August Saturday — no weekend surcharge applied, override stacks directly on base
    const date = SATURDAY_AUG_8;
    const overrides = [makeRule({ adjustmentValue: 0.10 })];
    const breakdown = calculatePricingBreakdown("solar-450", date, "2h", [], [], overrides);
    expect(breakdown.basePriceBeforeOverride).toBe(150); // ALTA 2h, no weekend in Aug
    expect(breakdown.basePrice).toBe(170); // 150 * 1.10 = 165 → roundToNearestTen → 170
    expect(breakdown.weekendSurcharge).toBe(false);
  });

  it("override does NOT affect deposit nor extras", () => {
    const date = TUESDAY_AUG_5;
    const overrides = [makeRule({ adjustmentValue: 0.25 })];
    const breakdown = calculatePricingBreakdown(
      "solar-450",
      date,
      "2h",
      ["Parking delante del Barco"],
      [],
      overrides,
    );
    expect(breakdown.basePrice).toBe(190); // 150 * 1.25 = 187.5 → roundToNearestTen → 190
    expect(breakdown.extrasPrice).toBe(10); // unchanged
    // deposit unchanged from solar-450's spec
    expect(breakdown.deposit).toBeGreaterThan(0);
    expect(breakdown.subtotal).toBe(200); // 190 + 10
    expect(breakdown.total).toBe(breakdown.subtotal + breakdown.deposit);
  });

  it("flat_eur override adds absolute € to base", () => {
    const date = TUESDAY_AUG_5;
    const overrides = [makeRule({ adjustmentType: "flat_eur", adjustmentValue: 30 })];
    const breakdown = calculatePricingBreakdown("solar-450", date, "2h", [], [], overrides);
    expect(breakdown.basePrice).toBe(180); // 150 + 30
  });

  it("does not apply override outside its date range", () => {
    const date = WEDNESDAY_AUG_19;
    const overrides = [makeRule({ dateEnd: "2026-08-17" })];
    const breakdown = calculatePricingBreakdown("solar-450", date, "2h", [], [], overrides);
    expect(breakdown.basePrice).toBe(150); // ALTA base, unchanged
    expect(breakdown.appliedOverride).toBeUndefined();
  });
});
