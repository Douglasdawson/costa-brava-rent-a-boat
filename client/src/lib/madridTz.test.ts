import { describe, it, expect } from "vitest";
import { parseMadridLocal } from "./madridTz";

describe("parseMadridLocal", () => {
  it("treats input as Madrid local in summer (CEST, UTC+2)", () => {
    const result = parseMadridLocal("2026-07-15T13:30:00");
    expect(result.toISOString()).toBe("2026-07-15T11:30:00.000Z");
  });

  it("treats input as Madrid local in winter (CET, UTC+1)", () => {
    const result = parseMadridLocal("2026-12-15T13:30:00");
    expect(result.toISOString()).toBe("2026-12-15T12:30:00.000Z");
  });

  it("round-trips: Madrid input → UTC → Madrid local display matches input", () => {
    const result = parseMadridLocal("2026-04-26T13:30:00");
    const madridDisplay = result.toLocaleString("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    expect(madridDisplay).toBe("2026-04-26, 13:30");
  });

  it("handles spring DST transition (last Sunday of March 2026 = Mar 29)", () => {
    // Madrid: 2026-03-29 02:00 CET → 03:00 CEST (skips 02:00-03:00)
    // 01:30 CET still has UTC+1 offset
    const before = parseMadridLocal("2026-03-29T01:30:00");
    expect(before.toISOString()).toBe("2026-03-29T00:30:00.000Z");
    // 04:00 CEST has UTC+2 offset
    const after = parseMadridLocal("2026-03-29T04:00:00");
    expect(after.toISOString()).toBe("2026-03-29T02:00:00.000Z");
  });

  it("returns Invalid Date for malformed input", () => {
    const result = parseMadridLocal("not-a-date");
    expect(isNaN(result.getTime())).toBe(true);
  });
});
