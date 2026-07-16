import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../test/setup";

// Mock dependencies before importing route registration
vi.mock("../storage", () => ({
  storage: {
    getBoat: vi.fn(),
    getDailyBookings: vi.fn(),
    getMonthlyBookings: vi.fn(),
    getAllBoats: vi.fn(),
    getConfirmedBookings: vi.fn(),
  },
}));
vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { registerAvailabilityRoutes } from "./availability";
import { storage } from "../storage";

const mockedStorage = vi.mocked(storage);

describe("GET /api/availability", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerAvailabilityRoutes(app);
  });

  it("returns 400 when boatId is missing", async () => {
    const res = await request(app)
      .get("/api/availability?date=2026-07-15")
      .expect(400);
    expect(res.body.message).toBeDefined();
  });

  it("returns 400 when date is missing", async () => {
    const res = await request(app)
      .get("/api/availability?boatId=boat-1")
      .expect(400);
    expect(res.body.message).toBeDefined();
  });

  it("returns 400 when date format is invalid", async () => {
    const res = await request(app)
      .get("/api/availability?boatId=boat-1&date=15-07-2026")
      .expect(400);
    expect(res.body.message).toContain("YYYY-MM-DD");
  });

  it("returns 404 when boat does not exist", async () => {
    mockedStorage.getBoat.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/availability?boatId=nonexistent&date=2026-07-15")
      .expect(404);
    expect(res.body.message).toBe("Barco no encontrado");
  });

  it("returns all slots as unavailable for off-season dates", async () => {
    mockedStorage.getBoat.mockResolvedValue({ id: "boat-1", name: "Test Boat" } as never);

    const res = await request(app)
      .get("/api/availability?boatId=boat-1&date=2026-01-15")
      .expect(200);

    expect(res.body.availableSlots).toEqual([]);
    expect(res.body.unavailableSlots.length).toBeGreaterThan(0);
  });

  it("returns available slots with maxDuration when no bookings exist", async () => {
    mockedStorage.getBoat.mockResolvedValue({ id: "boat-1", name: "Test Boat" } as never);
    mockedStorage.getDailyBookings.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/availability?boatId=boat-1&date=2026-07-15")
      .expect(200);

    expect(res.body.availableSlots).toBeInstanceOf(Array);
    expect(res.body.unavailableSlots).toBeInstanceOf(Array);
    expect(res.body.availableSlots.length).toBeGreaterThan(0);
    // Each available slot should have time and maxDuration
    for (const slot of res.body.availableSlots) {
      expect(slot).toHaveProperty("time");
      expect(slot).toHaveProperty("maxDuration");
      expect(slot.maxDuration).toBeGreaterThanOrEqual(1);
    }
  });

  it("sets Cache-Control header", async () => {
    mockedStorage.getBoat.mockResolvedValue({ id: "boat-1", name: "Test Boat" } as never);
    mockedStorage.getDailyBookings.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/availability?boatId=boat-1&date=2026-07-15")
      .expect(200);

    expect(res.headers["cache-control"]).toContain("max-age=60");
  });

  it("marks booked slots as unavailable", async () => {
    mockedStorage.getBoat.mockResolvedValue({ id: "boat-1", name: "Test Boat" } as never);
    // Simulate a booking from 10:00 to 13:00
    mockedStorage.getDailyBookings.mockResolvedValue([
      {
        startTime: new Date(2026, 6, 15, 10, 0),
        endTime: new Date(2026, 6, 15, 13, 0),
      },
    ] as never);

    const res = await request(app)
      .get("/api/availability?boatId=boat-1&date=2026-07-15")
      .expect(200);

    // 10:00, 10:30, 11:00, 11:30, 12:00, 12:30 should be unavailable
    expect(res.body.unavailableSlots).toContain("10:00");
    expect(res.body.unavailableSlots).toContain("11:00");
    expect(res.body.unavailableSlots).toContain("12:00");
    // 13:00 should be available
    const availableTimes = res.body.availableSlots.map((s: { time: string }) => s.time);
    expect(availableTimes).toContain("13:00");
  });
});

describe("GET /api/boats/:id/availability", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerAvailabilityRoutes(app);
  });

  it("returns 400 when month format is invalid", async () => {
    const res = await request(app)
      .get("/api/boats/boat-1/availability?month=July2026")
      .expect(400);
    expect(res.body.message).toContain("YYYY-MM");
  });

  it("returns 400 when month is missing", async () => {
    const res = await request(app)
      .get("/api/boats/boat-1/availability")
      .expect(400);
    expect(res.body.message).toContain("YYYY-MM");
  });

  it("returns 404 when boat does not exist", async () => {
    mockedStorage.getBoat.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/boats/nonexistent/availability?month=2026-07")
      .expect(404);
    expect(res.body.message).toBe("Barco no encontrado");
  });

  it("returns off_season status for winter months", async () => {
    mockedStorage.getBoat.mockResolvedValue({ id: "boat-1", name: "Test Boat" } as never);
    mockedStorage.getMonthlyBookings.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/boats/boat-1/availability?month=2026-01")
      .expect(200);

    expect(res.body.boatId).toBe("boat-1");
    expect(res.body.month).toBe("2026-01");
    // All days should be off_season
    for (const day of Object.values(res.body.days) as Array<{ status: string }>) {
      expect(day.status).toBe("off_season");
    }
  });

  it("returns expected response shape for in-season month", async () => {
    mockedStorage.getBoat.mockResolvedValue({ id: "boat-1", name: "Test Boat" } as never);
    mockedStorage.getMonthlyBookings.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/boats/boat-1/availability?month=2027-07")
      .expect(200);

    expect(res.body).toHaveProperty("boatId");
    expect(res.body).toHaveProperty("month");
    expect(res.body).toHaveProperty("days");
    // July has 31 days
    expect(Object.keys(res.body.days)).toHaveLength(31);
  });
});

describe("GET /api/fleet-availability", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    registerAvailabilityRoutes(app);
  });

  it("returns 400 when date format is invalid", async () => {
    const res = await request(app)
      .get("/api/fleet-availability?date=15-07-2026")
      .expect(400);
    expect(res.body.message).toContain("YYYY-MM-DD");
  });

  it("returns the requested date and per-boat status for an in-season date", async () => {
    mockedStorage.getAllBoats.mockResolvedValue([
      { id: "boat-1", isActive: true },
      { id: "boat-2", isActive: true },
    ] as never);
    mockedStorage.getDailyBookings.mockImplementation(async (boatId: string) =>
      boatId === "boat-1"
        ? [{ startTime: new Date(2026, 6, 25, 10, 0), endTime: new Date(2026, 6, 25, 14, 0) }]
        : []
    );

    const res = await request(app)
      .get("/api/fleet-availability?date=2026-07-25")
      .expect(200);

    expect(res.body.date).toBe("2026-07-25");
    expect(res.body.boats["boat-1"].status).toBe("partial");
    expect(res.body.boats["boat-2"].status).toBe("available");
  });

  it("reports a fully-booked boat as booked", async () => {
    mockedStorage.getAllBoats.mockResolvedValue([{ id: "boat-1", isActive: true }] as never);
    mockedStorage.getDailyBookings.mockResolvedValue([
      { startTime: new Date(2026, 6, 25, 9, 0), endTime: new Date(2026, 6, 25, 20, 0) },
    ] as never);

    const res = await request(app)
      .get("/api/fleet-availability?date=2026-07-25")
      .expect(200);

    expect(res.body.boats["boat-1"].status).toBe("booked");
    expect(res.body.boats["boat-1"].availableSlots).toBe(0);
  });

  it("excludes inactive boats", async () => {
    mockedStorage.getAllBoats.mockResolvedValue([
      { id: "boat-1", isActive: true },
      { id: "boat-2", isActive: false },
    ] as never);
    mockedStorage.getDailyBookings.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/fleet-availability?date=2026-07-25")
      .expect(200);

    expect(res.body.boats).toHaveProperty("boat-1");
    expect(res.body.boats).not.toHaveProperty("boat-2");
  });

  it("returns an empty boats map for off-season dates", async () => {
    mockedStorage.getAllBoats.mockResolvedValue([{ id: "boat-1", isActive: true }] as never);

    const res = await request(app)
      .get("/api/fleet-availability?date=2026-01-15")
      .expect(200);

    expect(res.body.boats).toEqual({});
  });

  it("defaults to today when no date is given", async () => {
    mockedStorage.getAllBoats.mockResolvedValue([]);

    const res = await request(app).get("/api/fleet-availability").expect(200);
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
