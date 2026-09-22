import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/setup";

// Mock dependencies
vi.mock("../storage", () => ({
  storage: {
    getDiscountCodeByCode: vi.fn(),
    createDiscountCode: vi.fn(async (data: Record<string, unknown>) => ({ id: "uuid", ...data })),
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

/**
 * El telefono es lo unico que ata un codigo a una persona: `validatePromoCode`
 * compara sus ultimos 9 digitos contra el que el cliente teclea en el wizard.
 * Hasta el 22-sep-2026 el panel no lo exponia —solo email, que no se valida en
 * ningun sitio—, asi que desde ahi era imposible crear un codigo realmente
 * personal. Si alguien quita el campo del zod, esto lo caza: el codigo volveria
 * a guardarse sin telefono y seria canjeable por cualquiera, en silencio.
 */
describe("POST /api/admin/discounts — el telefono que ata el codigo", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedStorage.getDiscountCodeByCode.mockResolvedValue(undefined);
    app = createTestApp();
    registerDiscountRoutes(app);
  });

  const crear = (body: Record<string, unknown>) =>
    request(app)
      .post("/api/admin/discounts")
      .send({ code: "PRUEBA-1", discountPercent: 10, maxUses: 1, ...body });

  it("persiste el telefono cuando se manda", async () => {
    const res = await crear({ customerPhone: "+34 611 500 372" });
    expect(res.status).toBe(200);
    expect(mockedStorage.createDiscountCode).toHaveBeenCalledWith(
      expect.objectContaining({ customerPhone: "+34 611 500 372" }),
    );
  });

  it("sin telefono lo guarda como null, no como cadena vacia", async () => {
    const res = await crear({});
    expect(res.status).toBe(200);
    expect(mockedStorage.createDiscountCode).toHaveBeenCalledWith(
      expect.objectContaining({ customerPhone: null }),
    );
  });

  it("rechaza un telefono demasiado corto para ser uno", async () => {
    const res = await crear({ customerPhone: "123" });
    expect(res.status).toBe(400);
    expect(mockedStorage.createDiscountCode).not.toHaveBeenCalled();
  });

  it("el email sigue guardandose en minusculas, y no limita nada", async () => {
    const res = await crear({ customerEmail: "Maria@Ejemplo.COM" });
    expect(res.status).toBe(200);
    expect(mockedStorage.createDiscountCode).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: "maria@ejemplo.com", customerPhone: null }),
    );
  });
});
