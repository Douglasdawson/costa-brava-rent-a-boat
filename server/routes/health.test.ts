import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/setup";

// Mock dependencies
const mockExecute = vi.fn();
vi.mock("../db", () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      balance: { retrieve: vi.fn().mockResolvedValue({ available: [] }) },
    })),
  };
});

import { registerHealthRoutes } from "./health";

describe("GET /api/health", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerHealthRoutes(app);
  });

  it("returns 200 with ok status when DB is healthy", async () => {
    mockExecute.mockResolvedValue([{ "?column?": 1 }]);

    const res = await request(app).get("/api/health").expect(200);

    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("services");
    expect(res.body.services.database.status).toBe("ok");
    expect(res.body.services.database).toHaveProperty("latencyMs");
  });

  it("returns 503 with degraded status when DB fails", async () => {
    mockExecute.mockRejectedValue(new Error("Connection refused"));

    const res = await request(app).get("/api/health").expect(503);

    expect(res.body.status).toBe("degraded");
    expect(res.body.services.database.status).toBe("error");
  });

  it("includes timestamp in ISO format", async () => {
    mockExecute.mockResolvedValue([{ "?column?": 1 }]);

    const res = await request(app).get("/api/health").expect(200);

    expect(() => new Date(res.body.timestamp)).not.toThrow();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it("reports sendgrid and twilio configuration status", async () => {
    mockExecute.mockResolvedValue([{ "?column?": 1 }]);

    const res = await request(app).get("/api/health").expect(200);

    expect(res.body.services).toHaveProperty("sendgrid");
    expect(res.body.services).toHaveProperty("twilio");
    // Without env vars, these should be "not_configured"
    expect(["configured", "not_configured"]).toContain(res.body.services.sendgrid.status);
    expect(["configured", "not_configured"]).toContain(res.body.services.twilio.status);
  });
});
