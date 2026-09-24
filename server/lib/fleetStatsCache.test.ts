import { describe, it, expect, vi } from "vitest";

vi.mock("../storage", () => ({ storage: { getAllBoats: vi.fn(async () => []) } }));

import { getFleetStats } from "./fleetStatsCache";

describe("getFleetStats", () => {
  it("drops the licence-free boats from the public stats on 2026-10-01 without a refresh", () => {
    const sept = getFleetStats(new Date("2026-09-30T12:00:00Z"));
    const oct = getFleetStats(new Date("2026-10-01T12:00:00Z"));
    expect(sept.licenseFreeCount).toBeGreaterThan(0);
    expect(oct.licenseFreeCount).toBe(0);
    expect(oct.licensedCount).toBe(3);
    expect(oct.captainCount).toBe(1);
    expect(oct.fleetCount).toBe(4);
  });
});
