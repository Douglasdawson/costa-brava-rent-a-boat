import { describe, it, expect } from "vitest";
import {
  calculateDynamicPrice,
  DEFAULT_DYNAMIC_PRICING_CONFIG,
  type DynamicPricingConfig,
} from "./pricing";

// Use solar-450 BAJA weekday 2h = 115 as the reference base price
const BOAT_ID = "solar-450";
const WEEKDAY_BAJA = new Date("2026-04-06T12:00:00"); // Monday in April
const DURATION = "2h" as const;
const BASE_PRICE = 115;

describe("calculateDynamicPrice", () => {
  describe("normal demand (between thresholds)", () => {
    it("returns base price at 50% occupancy (mid-range)", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.50);
      expect(result.adjustedPrice).toBe(BASE_PRICE);
      expect(result.adjustmentFactor).toBe(1);
      expect(result.reason).toBe("normal");
    });

    it("returns base price at 31% occupancy (just above low threshold)", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.31);
      expect(result.adjustedPrice).toBe(BASE_PRICE);
      expect(result.reason).toBe("normal");
    });

    it("returns base price at 74% occupancy (just below high threshold)", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.74);
      expect(result.adjustedPrice).toBe(BASE_PRICE);
      expect(result.reason).toBe("normal");
    });
  });

  describe("high demand (above highDemandThreshold)", () => {
    it("applies no surcharge exactly at the threshold", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.75);
      expect(result.adjustedPrice).toBe(BASE_PRICE);
      expect(result.adjustmentFactor).toBe(1);
      expect(result.reason).toBe("high_demand");
    });

    it("applies full maxSurcharge at 100% occupancy", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 1.0);
      // 115 * 1.25 = 143.75 -> 144
      expect(result.adjustedPrice).toBe(144);
      expect(result.adjustmentFactor).toBe(1.25);
      expect(result.reason).toBe("high_demand");
    });

    it("applies proportional surcharge at midpoint (87.5%)", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.875);
      // progress = (0.875 - 0.75) / (1 - 0.75) = 0.125 / 0.25 = 0.5
      // factor = 1 + 0.25 * 0.5 = 1.125
      // 115 * 1.125 = 129.375 -> 129
      expect(result.adjustmentFactor).toBeCloseTo(1.125, 5);
      expect(result.adjustedPrice).toBe(129);
      expect(result.reason).toBe("high_demand");
    });

    it("applies surcharge at 90% occupancy", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.90);
      // progress = (0.90 - 0.75) / 0.25 = 0.6
      // factor = 1 + 0.25 * 0.6 = 1.15
      // 115 * 1.15 = 132.25 -> 132
      expect(result.adjustmentFactor).toBeCloseTo(1.15, 5);
      expect(result.adjustedPrice).toBe(132);
      expect(result.reason).toBe("high_demand");
    });
  });

  describe("low demand (below lowDemandThreshold)", () => {
    it("applies no discount exactly at the threshold", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.30);
      expect(result.adjustedPrice).toBe(BASE_PRICE);
      expect(result.adjustmentFactor).toBe(1);
      expect(result.reason).toBe("low_demand");
    });

    it("applies full maxDiscount at 0% occupancy", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.0);
      // 115 * 0.75 = 86.25 -> 86
      expect(result.adjustedPrice).toBe(86);
      expect(result.adjustmentFactor).toBe(0.75);
      expect(result.reason).toBe("low_demand");
    });

    it("applies proportional discount at midpoint (15%)", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.15);
      // progress = (0.30 - 0.15) / 0.30 = 0.5
      // factor = 1 - 0.25 * 0.5 = 0.875
      // 115 * 0.875 = 100.625 -> 101
      expect(result.adjustmentFactor).toBeCloseTo(0.875, 5);
      expect(result.adjustedPrice).toBe(101);
      expect(result.reason).toBe("low_demand");
    });

    it("applies discount at 10% occupancy", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.10);
      // progress = (0.30 - 0.10) / 0.30 = 0.6667
      // factor = 1 - 0.25 * 0.6667 = 0.8333
      // 115 * 0.8333 = 95.83 -> 96
      expect(result.adjustmentFactor).toBeCloseTo(0.8333, 3);
      expect(result.adjustedPrice).toBe(96);
      expect(result.reason).toBe("low_demand");
    });
  });

  describe("result structure", () => {
    it("includes basePrice from calculateBasePrice", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.50);
      expect(result.basePrice).toBe(BASE_PRICE);
    });

    it("includes the clamped occupancy rate", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.50);
      expect(result.occupancyRate).toBe(0.50);
    });

    it("returns all expected fields", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.50);
      expect(result).toHaveProperty("basePrice");
      expect(result).toHaveProperty("adjustedPrice");
      expect(result).toHaveProperty("adjustmentFactor");
      expect(result).toHaveProperty("occupancyRate");
      expect(result).toHaveProperty("reason");
    });
  });

  describe("edge cases and clamping", () => {
    it("clamps occupancy above 1 to 1", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 1.5);
      expect(result.occupancyRate).toBe(1);
      expect(result.adjustedPrice).toBe(144); // same as 100%
      expect(result.reason).toBe("high_demand");
    });

    it("clamps occupancy below 0 to 0", () => {
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, -0.5);
      expect(result.occupancyRate).toBe(0);
      expect(result.adjustedPrice).toBe(86); // same as 0%
      expect(result.reason).toBe("low_demand");
    });

    it("works with weekend surcharge (base already includes +15%)", () => {
      // Saturday in BAJA, 2h: 115 * 1.15 = 132.25 -> 132
      const saturday = new Date("2026-04-04T12:00:00");
      const result = calculateDynamicPrice(BOAT_ID, saturday, DURATION, 1.0);
      // 132 * 1.25 = 165
      expect(result.basePrice).toBe(132);
      expect(result.adjustedPrice).toBe(165);
      expect(result.reason).toBe("high_demand");
    });

    it("works with ALTA season pricing", () => {
      // August weekday 2h = 150
      const augustDate = new Date("2026-08-06T12:00:00");
      const result = calculateDynamicPrice(BOAT_ID, augustDate, DURATION, 1.0);
      // 150 * 1.25 = 187.5 -> 188
      expect(result.basePrice).toBe(150);
      expect(result.adjustedPrice).toBe(188);
    });

    it("throws for invalid boat ID", () => {
      expect(() =>
        calculateDynamicPrice("nonexistent", WEEKDAY_BAJA, DURATION, 0.50)
      ).toThrow('Boat with id "nonexistent" not found');
    });

    it("throws for date outside operational season", () => {
      expect(() =>
        calculateDynamicPrice(BOAT_ID, new Date("2026-01-15"), DURATION, 0.50)
      ).toThrow("outside operational season");
    });
  });

  describe("custom config", () => {
    it("respects custom thresholds", () => {
      const config: DynamicPricingConfig = {
        highDemandThreshold: 0.60,
        lowDemandThreshold: 0.40,
        maxSurcharge: 0.10,
        maxDiscount: 0.10,
      };

      // 50% is between 0.40 and 0.60 -> normal
      const normalResult = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.50, config);
      expect(normalResult.reason).toBe("normal");
      expect(normalResult.adjustedPrice).toBe(BASE_PRICE);

      // 80% -> high demand, progress = (0.80 - 0.60) / (1 - 0.60) = 0.5
      // factor = 1 + 0.10 * 0.5 = 1.05
      // 115 * 1.05 = 120.75 -> 121
      const highResult = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.80, config);
      expect(highResult.reason).toBe("high_demand");
      expect(highResult.adjustmentFactor).toBeCloseTo(1.05, 5);
      expect(highResult.adjustedPrice).toBe(121);
    });

    it("handles zero-width high demand range (threshold = 1)", () => {
      const config: DynamicPricingConfig = {
        highDemandThreshold: 1.0,
        lowDemandThreshold: 0.30,
        maxSurcharge: 0.25,
        maxDiscount: 0.25,
      };
      // At 100%, range = 0, so progress = 1, factor = 1.25
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 1.0, config);
      expect(result.adjustmentFactor).toBe(1.25);
    });

    it("handles zero-width low demand range (threshold = 0)", () => {
      const config: DynamicPricingConfig = {
        highDemandThreshold: 0.75,
        lowDemandThreshold: 0.0,
        maxSurcharge: 0.25,
        maxDiscount: 0.25,
      };
      // At 0%, threshold = 0, range = 0, progress = 1, factor = 0.75
      const result = calculateDynamicPrice(BOAT_ID, WEEKDAY_BAJA, DURATION, 0.0, config);
      expect(result.adjustmentFactor).toBe(0.75);
    });
  });
});

describe("DEFAULT_DYNAMIC_PRICING_CONFIG", () => {
  it("has valid threshold values", () => {
    expect(DEFAULT_DYNAMIC_PRICING_CONFIG.highDemandThreshold).toBe(0.75);
    expect(DEFAULT_DYNAMIC_PRICING_CONFIG.lowDemandThreshold).toBe(0.30);
    expect(DEFAULT_DYNAMIC_PRICING_CONFIG.highDemandThreshold).toBeGreaterThan(
      DEFAULT_DYNAMIC_PRICING_CONFIG.lowDemandThreshold
    );
  });

  it("has valid adjustment bounds", () => {
    expect(DEFAULT_DYNAMIC_PRICING_CONFIG.maxSurcharge).toBe(0.25);
    expect(DEFAULT_DYNAMIC_PRICING_CONFIG.maxDiscount).toBe(0.25);
    expect(DEFAULT_DYNAMIC_PRICING_CONFIG.maxSurcharge).toBeGreaterThan(0);
    expect(DEFAULT_DYNAMIC_PRICING_CONFIG.maxDiscount).toBeGreaterThan(0);
    expect(DEFAULT_DYNAMIC_PRICING_CONFIG.maxSurcharge).toBeLessThanOrEqual(1);
    expect(DEFAULT_DYNAMIC_PRICING_CONFIG.maxDiscount).toBeLessThanOrEqual(1);
  });
});
