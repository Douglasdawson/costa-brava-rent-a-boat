import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/setup";

vi.mock("../storage", () => ({
  storage: {
    listPricingOverrides: vi.fn(),
    getPricingOverride: vi.fn(),
    createPricingOverride: vi.fn(),
    updatePricingOverride: vi.fn(),
    deactivatePricingOverride: vi.fn(),
  },
}));
vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("../lib/audit", () => ({
  audit: vi.fn(),
}));
vi.mock("./auth", () => ({
  requireAdminSession: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
  requireTabAccess: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

import { registerAdminPricingOverridesRoutes } from "./admin-pricing-overrides";
import { storage } from "../storage";

const mockedStorage = vi.mocked(storage);

const buildOverridePayload = (overrides: Record<string, unknown> = {}) => ({
  boatId: null,
  dateStart: "2026-08-01",
  dateEnd: "2026-08-17",
  weekdayFilter: null,
  direction: "surcharge",
  adjustmentType: "multiplier",
  adjustmentValue: "0.25",
  label: "Pico agosto 2026",
  notes: null,
  priority: 10,
  isActive: true,
  tenantId: null,
  ...overrides,
});

describe("Admin pricing overrides routes", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerAdminPricingOverridesRoutes(app);
  });

  describe("POST /api/admin/pricing-overrides", () => {
    it("creates an override with valid data", async () => {
      mockedStorage.createPricingOverride.mockResolvedValue({
        id: "ov-1",
        ...buildOverridePayload(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const res = await request(app)
        .post("/api/admin/pricing-overrides")
        .send(buildOverridePayload())
        .expect(201);

      expect(res.body.id).toBe("ov-1");
      expect(mockedStorage.createPricingOverride).toHaveBeenCalledOnce();
    });

    it("rejects when dateEnd < dateStart", async () => {
      const res = await request(app)
        .post("/api/admin/pricing-overrides")
        .send(buildOverridePayload({ dateStart: "2026-08-17", dateEnd: "2026-08-01" }))
        .expect(400);

      expect(res.body.message).toMatch(/dateEnd/);
      expect(mockedStorage.createPricingOverride).not.toHaveBeenCalled();
    });

    it("rejects when adjustmentType=multiplier with value out of [0.01, 5]", async () => {
      const res = await request(app)
        .post("/api/admin/pricing-overrides")
        .send(buildOverridePayload({ adjustmentValue: "10" }))
        .expect(400);

      expect(res.body.message).toMatch(/multiplier/);
      expect(mockedStorage.createPricingOverride).not.toHaveBeenCalled();
    });

    it("rejects when label is missing", async () => {
      const res = await request(app)
        .post("/api/admin/pricing-overrides")
        .send(buildOverridePayload({ label: "" }))
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe("GET /api/admin/pricing-overrides", () => {
    it("lists overrides with filters", async () => {
      mockedStorage.listPricingOverrides.mockResolvedValue([
        { id: "ov-1", label: "Pico agosto" } as never,
      ]);

      const res = await request(app)
        .get("/api/admin/pricing-overrides")
        .query({ from: "2026-08-01", to: "2026-08-31" })
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(mockedStorage.listPricingOverrides).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "2026-08-01",
          to: "2026-08-31",
        }),
      );
    });

    it("rejects malformed date filters", async () => {
      await request(app)
        .get("/api/admin/pricing-overrides")
        .query({ from: "not-a-date" })
        .expect(400);
    });
  });

  describe("PATCH /api/admin/pricing-overrides/:id", () => {
    it("updates label", async () => {
      mockedStorage.updatePricingOverride.mockResolvedValue({
        id: "ov-1",
        label: "Pico agosto v2",
      } as never);

      const res = await request(app)
        .patch("/api/admin/pricing-overrides/ov-1")
        .send({ label: "Pico agosto v2" })
        .expect(200);

      expect(res.body.label).toBe("Pico agosto v2");
    });

    it("returns 404 when override not found", async () => {
      mockedStorage.updatePricingOverride.mockResolvedValue(undefined as never);

      await request(app)
        .patch("/api/admin/pricing-overrides/missing")
        .send({ label: "x" })
        .expect(404);
    });
  });

  describe("DELETE /api/admin/pricing-overrides/:id (soft delete)", () => {
    it("deactivates the override", async () => {
      mockedStorage.deactivatePricingOverride.mockResolvedValue({
        id: "ov-1",
        isActive: false,
      } as never);

      const res = await request(app)
        .delete("/api/admin/pricing-overrides/ov-1")
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(mockedStorage.deactivatePricingOverride).toHaveBeenCalledWith("ov-1");
    });
  });

  describe("POST /api/admin/pricing-overrides/templates/:id/apply", () => {
    it("applies the peak_august template with correct values", async () => {
      mockedStorage.createPricingOverride.mockResolvedValue({
        id: "ov-tpl-1",
        label: "Pico agosto 2026 (+25%)",
      } as never);

      const res = await request(app)
        .post("/api/admin/pricing-overrides/templates/peak_august/apply")
        .send({ year: 2026 })
        .expect(201);

      expect(res.body.label).toMatch(/Pico agosto 2026/);
      const call = mockedStorage.createPricingOverride.mock.calls[0][0];
      expect(call.dateStart).toBe("2026-08-01");
      expect(call.dateEnd).toBe("2026-08-17");
      expect(call.adjustmentType).toBe("multiplier");
      expect(call.adjustmentValue).toBe("0.25");
      expect(call.weekdayFilter).toBeNull();
    });

    it("applies the weekends_jun_jul template with correct weekday filter", async () => {
      mockedStorage.createPricingOverride.mockResolvedValue({ id: "ov-tpl-2" } as never);

      await request(app)
        .post("/api/admin/pricing-overrides/templates/weekends_jun_jul/apply")
        .send({ year: 2026 })
        .expect(201);

      const call = mockedStorage.createPricingOverride.mock.calls[0][0];
      expect(call.dateStart).toBe("2026-06-01");
      expect(call.dateEnd).toBe("2026-07-31");
      expect(call.weekdayFilter).toEqual([0, 6]);
      expect(call.adjustmentValue).toBe("0.15");
    });

    it("applies the asuncion_aug15 template (single day, +30%)", async () => {
      mockedStorage.createPricingOverride.mockResolvedValue({ id: "ov-tpl-3" } as never);

      await request(app)
        .post("/api/admin/pricing-overrides/templates/asuncion_aug15/apply")
        .send({ year: 2026 })
        .expect(201);

      const call = mockedStorage.createPricingOverride.mock.calls[0][0];
      expect(call.dateStart).toBe("2026-08-15");
      expect(call.dateEnd).toBe("2026-08-15");
      expect(call.adjustmentValue).toBe("0.30");
      expect(call.priority).toBeGreaterThanOrEqual(20);
    });

    it("returns 404 for unknown template", async () => {
      const res = await request(app)
        .post("/api/admin/pricing-overrides/templates/unknown/apply")
        .send({ year: 2026 })
        .expect(404);

      expect(res.body.availableTemplates).toContain("peak_august");
    });
  });
});
