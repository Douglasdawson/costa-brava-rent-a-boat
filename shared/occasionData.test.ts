import { describe, it, expect } from "vitest";
import { BOAT_DATA } from "./boatData";
import { OCCASION_LIST, OCCASION_IDS } from "./occasions";
import { getOccasionBoats } from "./occasionData";

describe("occasion taxonomy", () => {
  it("every recommended boat id exists in the real catalog (no typos / stale ids)", () => {
    for (const occ of OCCASION_LIST) {
      for (const boatId of occ.recommendedBoatIds) {
        expect(BOAT_DATA[boatId], `${occ.id} → ${boatId}`).toBeDefined();
      }
    }
  });

  it("getOccasionBoats resolves each occasion to at least one real boat", () => {
    for (const id of OCCASION_IDS) {
      const boats = getOccasionBoats(id);
      expect(boats.length).toBeGreaterThan(0);
      expect(boats.every((b) => b.id && b.name && b.capacity)).toBe(true);
    }
  });

  it("returns an empty list for an unknown occasion (no throw)", () => {
    expect(getOccasionBoats("nope" as never)).toEqual([]);
  });

  it("every occasion recommends at least one duration", () => {
    for (const occ of OCCASION_LIST) {
      expect(occ.recommendedDurations.length).toBeGreaterThan(0);
    }
  });
});
