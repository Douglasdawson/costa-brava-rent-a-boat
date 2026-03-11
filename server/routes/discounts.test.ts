import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/setup";

// Mock dependencies
vi.mock("../storage", () => ({
  storage: {
    getDiscountCodeByCode: vi.fn(),
  },
}));
vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("./auth", () => ({
  requireAdminSession: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
  requireTabAccess: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

import { registerDiscountRoutes } from "./discounts";
import { storage } from "../storage";

const mockedStorage = vi.mocked(storage);

describe("POST /api/discounts/validate", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerDiscountRoutes(app);
  });

  it("returns invalid when code is empty", async () => {
    const res = await request(app)
      .post("/api/discounts/validate")
      .send({ code: "" })
      .expect(400);
    expect(res.body.valid).toBe(false);
  });

  it("returns invalid when code is missing", async () => {
    const res = await request(app)
      .post("/api/discounts/validate")
      .send({})
      .expect(400);
    expect(res.body.valid).toBe(false);
  });

  it("returns invalid when code does not exist", async () => {
    mockedStorage.getDiscountCodeByCode.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/discounts/validate")
      .send({ code: "NONEXISTENT" })
      .expect(200);

    expect(res.body.valid).toBe(false);
    expect(res.body.error).toContain("no valido");
  });

  it("returns invalid when code is expired", async () => {
    mockedStorage.getDiscountCodeByCode.mockResolvedValue({
      id: "dc-1",
      code: "EXPIRED",
      discountPercent: 10,
      maxUses: 5,
      currentUses: 0,
      isActive: true,
      expiresAt: new Date("2020-01-01"),
      customerEmail: null,
    } as never);

    const res = await request(app)
      .post("/api/discounts/validate")
      .send({ code: "EXPIRED" })
      .expect(200);

    expect(res.body.valid).toBe(false);
    expect(res.body.error).toContain("expirado");
  });

  it("returns invalid when max uses reached", async () => {
    mockedStorage.getDiscountCodeByCode.mockResolvedValue({
      id: "dc-1",
      code: "MAXED",
      discountPercent: 10,
      maxUses: 1,
      currentUses: 1,
      isActive: true,
      expiresAt: null,
      customerEmail: null,
    } as never);

    const res = await request(app)
      .post("/api/discounts/validate")
      .send({ code: "MAXED" })
      .expect(200);

    expect(res.body.valid).toBe(false);
    expect(res.body.error).toContain("utilizado");
  });

  it("returns invalid when code is not active", async () => {
    mockedStorage.getDiscountCodeByCode.mockResolvedValue({
      id: "dc-1",
      code: "INACTIVE",
      discountPercent: 10,
      maxUses: 5,
      currentUses: 0,
      isActive: false,
      expiresAt: null,
      customerEmail: null,
    } as never);

    const res = await request(app)
      .post("/api/discounts/validate")
      .send({ code: "INACTIVE" })
      .expect(200);

    expect(res.body.valid).toBe(false);
    expect(res.body.error).toContain("no esta activo");
  });

  it("returns valid with discountPercent for a valid code", async () => {
    mockedStorage.getDiscountCodeByCode.mockResolvedValue({
      id: "dc-1",
      code: "SUMMER20",
      discountPercent: 20,
      maxUses: 10,
      currentUses: 3,
      isActive: true,
      expiresAt: new Date("2030-12-31"),
      customerEmail: null,
    } as never);

    const res = await request(app)
      .post("/api/discounts/validate")
      .send({ code: "summer20" }) // lowercase to test normalization
      .expect(200);

    expect(res.body.valid).toBe(true);
    expect(res.body.discountPercent).toBe(20);
  });
});
