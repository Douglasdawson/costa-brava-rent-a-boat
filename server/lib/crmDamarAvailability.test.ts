import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSql = vi.fn();
vi.mock("@neondatabase/serverless", () => ({
  neon: () => mockSql,
}));
vi.mock("./logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getCrmDamarBusyIntervals, CRM_BOAT_NAMES_BY_PUBLIC_ID, CRM_FLEET_UNITS, intervalsCoveredAtLeast } from "./crmDamarAvailability";
import { logger } from "./logger";

const OLD_ENV = process.env.CRMDAMAR_DATABASE_URL;

beforeEach(() => {
  mockSql.mockReset();
  process.env.CRMDAMAR_DATABASE_URL = "postgresql://user:pass@fake.neon.tech/db";
});

afterEach(() => {
  process.env.CRMDAMAR_DATABASE_URL = OLD_ENV;
});

describe("getCrmDamarBusyIntervals", () => {
  it("converts a Madrid wall-clock rental (CEST, UTC+2) into the correct UTC instants", async () => {
    mockSql.mockResolvedValueOnce([
      { date: "20/07/2026", start_time: "10:00", end_time: "14:00" },
    ]);

    const result = await getCrmDamarBusyIntervals(
      ["Astec 480"],
      new Date("2026-07-01T00:00:00Z"),
      new Date("2026-07-31T23:59:59Z"),
    );

    expect(result).toHaveLength(1);
    expect(result[0].start.toISOString()).toBe("2026-07-20T08:00:00.000Z");
    expect(result[0].end.toISOString()).toBe("2026-07-20T12:00:00.000Z");
  });

  it("filters out rentals outside the requested range", async () => {
    mockSql.mockResolvedValueOnce([
      { date: "20/07/2026", start_time: "10:00", end_time: "14:00" },
    ]);

    const result = await getCrmDamarBusyIntervals(
      ["Astec 480"],
      new Date("2026-08-01T00:00:00Z"),
      new Date("2026-08-31T23:59:59Z"),
    );

    expect(result).toEqual([]);
  });

  it("skips a cancelled/malformed row instead of throwing", async () => {
    // Distinct range from the other tests — the 90s in-memory cache is keyed by
    // (boat names, range) and persists across test cases within this file.
    mockSql.mockResolvedValueOnce([
      { date: "bogus-date", start_time: "10:00", end_time: "14:00" },
    ]);

    const result = await getCrmDamarBusyIntervals(
      ["Astec 480"],
      new Date("2026-09-01T00:00:00Z"),
      new Date("2026-09-30T23:59:59Z"),
    );

    expect(result).toEqual([]);
  });

  it("returns [] without querying when CRMDAMAR_DATABASE_URL is unset", async () => {
    delete process.env.CRMDAMAR_DATABASE_URL;

    const result = await getCrmDamarBusyIntervals(
      ["Astec 480"],
      new Date("2026-07-01T00:00:00Z"),
      new Date("2026-07-31T23:59:59Z"),
    );

    expect(result).toEqual([]);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("returns [] without querying when no CRM boat names are given", async () => {
    const result = await getCrmDamarBusyIntervals(
      [],
      new Date("2026-07-01T00:00:00Z"),
      new Date("2026-07-31T23:59:59Z"),
    );

    expect(result).toEqual([]);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("fails open (returns [], logs a warning) when the CRM query errors", async () => {
    mockSql.mockRejectedValueOnce(new Error("connection reset"));

    const result = await getCrmDamarBusyIntervals(
      ["Astec 480"],
      new Date("2026-10-01T00:00:00Z"),
      new Date("2026-10-31T23:59:59Z"),
    );

    expect(result).toEqual([]);
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe("CRM_BOAT_NAMES_BY_PUBLIC_ID", () => {
  // These are the names in the CRM's PRODUCTION catalog (SELECT nombre FROM barcos).
  // The first version of this map used the CRM's DEV names — five of eight matched nothing
  // in production, and a name that matches nothing reads as "everything free". Guard the
  // exact strings: a typo here is invisible in the UI, it just shows a free calendar.
  it("maps public boat ids to the PRODUCTION CRM boat names", () => {
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["astec-480"]).toEqual(["Astec 480"]);
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["remus-450"]).toEqual(["Remus 450"]);
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["remus-450-ii"]).toEqual(["REMUS (2) 450"]);
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["pacific-craft-625"]).toEqual(["Pacific Craft 625 Open", "Fuegos Blanes"]);
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["mingolla-brava-19"]).toEqual(["Mingolla Brava"]);
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["trimarchi-57s"]).toEqual(["Trimarchi 57S"]);
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["excursion-privada"]).toEqual(["Excursión Privada"]);
  });

  it("sells Solar 450 as two interchangeable hulls", () => {
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["solar-450"]).toEqual(["Solar Mercury", "Solar Yamaha"]);
    expect(CRM_FLEET_UNITS["solar-450"]).toBe(2);
  });

  it("leaves the jet skis unmapped (the owner books them outside the CRM)", () => {
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["jetski-circuito"]).toBeUndefined();
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["jetski-excursion-monitor"]).toBeUndefined();
  });
});

describe("intervalsCoveredAtLeast", () => {
  const iv = (from: string, to: string) => ({ start: new Date(from), end: new Date(to) });

  it("units=1: every booking blocks (aliases of one hull)", () => {
    const one = [iv("2026-07-19T08:00:00Z", "2026-07-19T12:00:00Z")];
    expect(intervalsCoveredAtLeast(one, 1)).toEqual(one);
  });

  it("units=2: one booking leaves the other hull free → nothing blocked", () => {
    const one = [iv("2026-07-19T08:00:00Z", "2026-07-19T12:00:00Z")];
    expect(intervalsCoveredAtLeast(one, 2)).toEqual([]);
  });

  it("units=2: blocks only the stretch where BOTH hulls are out", () => {
    const two = [
      iv("2026-07-19T08:00:00Z", "2026-07-19T12:00:00Z"),
      iv("2026-07-19T10:00:00Z", "2026-07-19T14:00:00Z"),
    ];
    // Both busy only between 10:00 and 12:00; 08-10 and 12-14 still have a free boat.
    expect(intervalsCoveredAtLeast(two, 2)).toEqual([
      iv("2026-07-19T10:00:00Z", "2026-07-19T12:00:00Z"),
    ]);
  });

  it("units=2: back-to-back bookings are not an overlap", () => {
    const backToBack = [
      iv("2026-07-19T08:00:00Z", "2026-07-19T12:00:00Z"),
      iv("2026-07-19T12:00:00Z", "2026-07-19T16:00:00Z"),
    ];
    expect(intervalsCoveredAtLeast(backToBack, 2)).toEqual([]);
  });

  it("units=2: two bookings on different days never overlap", () => {
    const apart = [
      iv("2026-07-19T08:00:00Z", "2026-07-19T12:00:00Z"),
      iv("2026-07-20T08:00:00Z", "2026-07-20T12:00:00Z"),
    ];
    expect(intervalsCoveredAtLeast(apart, 2)).toEqual([]);
  });
});
