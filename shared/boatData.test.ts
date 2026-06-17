import { describe, it, expect } from "vitest";
import {
  catalogFleetStats,
  computeFleetStats,
  applyFleetStatsToText,
  boatDataRequiresLicense,
  BOAT_DATA,
  BASELINE_INACTIVE_BOAT_IDS,
  type FleetStatBoat,
} from "./boatData";

describe("computeFleetStats", () => {
  it("reports the LIVE fleet (Astec 400 deactivated) as 8 boats / 4 license-free / from 75", () => {
    const stats = catalogFleetStats(); // defaults to BASELINE_INACTIVE_BOAT_IDS
    expect(stats.fleetCount).toBe(8);
    expect(stats.licenseFreeCount).toBe(4);
    expect(stats.licensedCount).toBe(3);
    expect(stats.captainCount).toBe(1);
    expect(stats.priceFloor).toBe(75);
    expect(stats.cheapestBoatName).toBe("Solar 450");
    expect(stats.licenseFreeNames).not.toContain("Astec 400");
  });

  it("reports the full CATALOG (no exclusions) as 9 boats / 5 license-free / from 70", () => {
    const stats = catalogFleetStats([]);
    expect(stats.fleetCount).toBe(9);
    expect(stats.licenseFreeCount).toBe(5);
    expect(stats.priceFloor).toBe(70);
    expect(stats.cheapestBoatName).toBe("Astec 400");
    expect(stats.licenseFreeNames).toContain("Astec 400");
  });

  it("categorises by isCaptainedBoat + requiresLicense, not by price", () => {
    const boats: FleetStatBoat[] = [
      { id: "solar-450", name: "Solar 450", requiresLicense: false, pricing: { BAJA: { prices: { "1h": 75 } } } },
      { id: "pacific-craft-625", name: "Pacific Craft 625", requiresLicense: true, pricing: { BAJA: { prices: { "2h": 180 } } } },
      { id: "excursion-privada", name: "Excursión Privada con Capitán", requiresLicense: false, pricing: { BAJA: { prices: { "2h": 240 } } } },
    ];
    const stats = computeFleetStats(boats);
    expect(stats.fleetCount).toBe(3);
    expect(stats.licenseFreeCount).toBe(1);
    expect(stats.licensedCount).toBe(1);
    expect(stats.captainCount).toBe(1); // excursion despite requiresLicense=false
    expect(stats.priceFloor).toBe(75); // only the boat with a "1h" rate sets the floor
  });
});

describe("boatDataRequiresLicense", () => {
  it("derives license requirement from features for catalog boats", () => {
    expect(boatDataRequiresLicense(BOAT_DATA["solar-450"])).toBe(false);
    expect(boatDataRequiresLicense(BOAT_DATA["mingolla-brava-19"])).toBe(true);
    expect(boatDataRequiresLicense(BOAT_DATA["excursion-privada"])).toBe(false);
  });
});

describe("applyFleetStatsToText", () => {
  const live = catalogFleetStats(); // 8 / 4 / 75

  it("rewrites fleet count and license-free subset prose", () => {
    expect(applyFleetStatsToText("9-boat fleet: 5 license-free", live)).toBe(
      "8-boat fleet: 4 license-free",
    );
    expect(applyFleetStatsToText("9 boats with specs", live)).toBe("8 boats with specs");
    expect(applyFleetStatsToText("9 barcos disponibles", live)).toBe("8 barcos disponibles");
  });

  it("rewrites the hourly price floor only when followed by a currency token", () => {
    expect(applyFleetStatsToText("from 70€/h", live)).toBe("from 75€/h");
    expect(applyFleetStatsToText("70 EUR/hour", live)).toBe("75 EUR/hour");
    expect(applyFleetStatsToText("70-420 EUR", live)).toBe("75-420 EUR");
  });

  it("never touches numeric JSON-LD prices or capacities", () => {
    expect(applyFleetStatsToText('"price":"70"', live)).toBe('"price":"70"');
    expect(applyFleetStatsToText("hasta 5 personas", live)).toBe("hasta 5 personas");
    expect(applyFleetStatsToText("up to 7 people", live)).toBe("up to 7 people");
  });

  it("BASELINE_INACTIVE_BOAT_IDS documents the deactivated hull", () => {
    expect(BASELINE_INACTIVE_BOAT_IDS).toContain("astec-400");
  });
});
