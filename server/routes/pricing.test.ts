import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/setup";
import type { PricingOverrideRule } from "@shared/pricing";

vi.mock("../storage", () => ({
  storage: {
    loadActiveOverridesForRange: vi.fn(),
  },
}));
vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { registerPricingRoutes } from "./pricing";
import { storage } from "../storage";

const mockedStorage = vi.mocked(storage);

describe("GET /api/pricing/calendar", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerPricingRoutes(app);
  });

  it("returns base prices for every day in range when no overrides apply", async () => {
    mockedStorage.loadActiveOverridesForRange.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/pricing/calendar")
      .query({ from: "2026-08-04", to: "2026-08-06", boatId: "solar-450", duration: "2h" })
      .expect(200);

    expect(res.body.boatId).toBe("solar-450");
    expect(res.body.duration).toBe("2h");
    expect(res.body.days).toHaveLength(3);
    res.body.days.forEach((d: { hasOverride: boolean; basePrice: number; finalPrice: number }) => {
      expect(d.hasOverride).toBe(false);
      expect(d.basePrice).toBe(d.finalPrice);
    });
  });

  it("marks days with override and returns adjusted finalPrice", async () => {
    const rule: PricingOverrideRule = {
      id: "ov-1",
      boatId: null,
      dateStart: "2026-08-01",
      dateEnd: "2026-08-17",
      weekdayFilter: null,
      direction: "surcharge",
      adjustmentType: "multiplier",
      adjustmentValue: 0.25,
      priority: 10,
      label: "Pico agosto 2026",
      isActive: true,
      createdAt: new Date("2026-04-26T00:00:00Z"),
    };
    mockedStorage.loadActiveOverridesForRange.mockResolvedValue([rule]);

    const res = await request(app)
      .get("/api/pricing/calendar")
      .query({ from: "2026-08-05", to: "2026-08-07", boatId: "solar-450", duration: "2h" })
      .expect(200);

    expect(res.body.days).toHaveLength(3);
    const day1 = res.body.days[0];
    expect(day1.hasOverride).toBe(true);
    expect(day1.overrideLabel).toBe("Pico agosto 2026");
    // ALTA 2h Solar 450 = 150€ base, +25% = 188€ (rounded)
    expect(day1.basePrice).toBe(150);
    expect(day1.finalPrice).toBe(188);
  });

  it("rejects malformed date params", async () => {
    await request(app)
      .get("/api/pricing/calendar")
      .query({ from: "bad", to: "2026-08-07", boatId: "solar-450", duration: "2h" })
      .expect(400);
  });

  it("rejects invalid duration enum", async () => {
    await request(app)
      .get("/api/pricing/calendar")
      .query({ from: "2026-08-05", to: "2026-08-07", boatId: "solar-450", duration: "5h" })
      .expect(400);
  });

  it("rejects when range is too large", async () => {
    await request(app)
      .get("/api/pricing/calendar")
      .query({ from: "2026-04-01", to: "2026-12-31", boatId: "solar-450", duration: "2h" })
      .expect(400);
  });

  it("rejects when to < from", async () => {
    await request(app)
      .get("/api/pricing/calendar")
      .query({ from: "2026-08-10", to: "2026-08-05", boatId: "solar-450", duration: "2h" })
      .expect(400);
  });

  it("sets cache-control header", async () => {
    mockedStorage.loadActiveOverridesForRange.mockResolvedValue([]);
    const res = await request(app)
      .get("/api/pricing/calendar")
      .query({ from: "2026-08-04", to: "2026-08-04", boatId: "solar-450", duration: "2h" })
      .expect(200);
    expect(res.headers["cache-control"]).toContain("max-age=300");
  });
});
