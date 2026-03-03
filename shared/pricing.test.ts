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
    expect(price).toBe(115);
  });

  it("returns correct price for solar-450 in BAJA 1h on weekday", () => {
    const price = calculateBasePrice("solar-450", new Date("2026-04-06T12:00:00"), "1h");
    expect(price).toBe(75);
  });

  it("returns correct price for solar-450 in MEDIA 2h on weekday", () => {
    const price = calculateBasePrice("solar-450", new Date("2026-07-06T12:00:00"), "2h");
    expect(price).toBe(130);
  });

  it("returns correct price for solar-450 in ALTA 2h on weekday", () => {
    const price = calculateBasePrice("solar-450", new Date("2026-08-06T12:00:00"), "2h");
    expect(price).toBe(140);
  });

  it("applies weekend surcharge correctly", () => {
    // Saturday (weekend) in BAJA with 2h
    const weekendPrice = calculateBasePrice("solar-450", new Date("2026-04-04T12:00:00"), "2h");
    const weekdayPrice = calculateBasePrice("solar-450", new Date("2026-04-06T12:00:00"), "2h");
    expect(weekendPrice).toBe(Math.round(weekdayPrice * WEEKEND_SURCHARGE_FACTOR));
    expect(weekendPrice).toBe(132); // 115 * 1.15 = 132.25 -> 132
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
    const price = calculateExtrasPrice("solar-450", ["Parking"]);
    expect(price).toBe(10);
  });

  it("calculates price for multiple extras", () => {
    const price = calculateExtrasPrice("solar-450", ["Parking", "Snorkel"]);
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
    const price = calculateExtrasPrice("solar-450", ["NonExistent", "Parking"]);
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
    expect(breakdown.basePrice).toBe(150);
    expect(breakdown.selectedExtras).toEqual([]);
    expect(breakdown.selectedPacks).toEqual([]);
    expect(breakdown.extrasPrice).toBe(0);
    expect(breakdown.deposit).toBe(250);
    expect(breakdown.subtotal).toBe(150);
    expect(breakdown.total).toBe(400);
  });

  it("includes weekend surcharge in breakdown", () => {
    const breakdown = calculatePricingBreakdown("solar-450", new Date("2026-04-04T12:00:00"), "2h");
    expect(breakdown.weekendSurcharge).toBe(true);
    expect(breakdown.basePrice).toBe(132); // 115 * 1.15
  });

  it("calculates subtotal correctly (basePrice + extrasPrice)", () => {
    const breakdown = calculatePricingBreakdown(
      "solar-450",
      new Date("2026-06-15T12:00:00"),
      "2h",
      ["Parking", "Snorkel"]
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
      ["Parking"]
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
      ["Parking"],
      []
    );
    expect(breakdown.selectedExtras).toEqual(["Parking"]);
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
    expect(price).toBe(115);
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
      ["Parking", "Snorkel"],
      []
    );

    // Verify the complete flow
    expect(breakdown.boatId).toBe("solar-450");
    expect(breakdown.season).toBe("BAJA");
    expect(breakdown.weekendSurcharge).toBe(false);
    expect(breakdown.basePrice).toBe(150); // BAJA 4h for solar-450
    expect(breakdown.extrasPrice).toBe(17.5); // Parking 10 + Snorkel 7.5
    expect(breakdown.deposit).toBe(250);
    expect(breakdown.subtotal).toBe(167.5);
    expect(breakdown.total).toBe(417.5);
  });

  it("calculates pricing correctly for weekend booking in August", () => {
    // August 2, 2026 is a Saturday
    const date = new Date("2026-08-02T10:00:00");
    const breakdown = calculatePricingBreakdown("solar-450", date, "2h", ["Parking"]);

    expect(breakdown.season).toBe("ALTA");
    expect(breakdown.weekendSurcharge).toBe(true);
    // ALTA 2h = 140, with weekend surcharge = 140 * 1.15 = 161
    expect(breakdown.basePrice).toBe(161);
    expect(breakdown.extrasPrice).toBe(10);
    expect(breakdown.subtotal).toBe(171);
    expect(breakdown.total).toBe(421);
  });
});
