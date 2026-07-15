import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSql = vi.fn();
vi.mock("@neondatabase/serverless", () => ({
  neon: () => mockSql,
}));
vi.mock("./logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getCrmDamarBusyIntervals, CRM_BOAT_NAMES_BY_PUBLIC_ID } from "./crmDamarAvailability";
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
  it("only maps public boat ids confirmed 1:1 against the CRM catalog", () => {
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["astec-480"]).toEqual(["Astec 480"]);
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["remus-450"]).toEqual(["Remus Damar"]);
    // remus-450-ii is intentionally unmapped (ambiguous vs. CRM's remaining "Remus",
    // inactive, unconfirmed) — see TODO in crmDamarAvailability.ts.
    expect(CRM_BOAT_NAMES_BY_PUBLIC_ID["remus-450-ii"]).toBeUndefined();
  });
});
