import { describe, it, expect } from "vitest";
import { formatPersonName, isLicenseFreeEraActive, LICENSE_FREE_LAST_DAY } from "./constants";

describe("isLicenseFreeEraActive (RD 1188/2025)", () => {
  it("is active until Madrid midnight on the last legal day", () => {
    // 21:00 UTC is 23:00 in Madrid (CEST): still Sep 30 locally.
    expect(isLicenseFreeEraActive(new Date("2026-09-30T21:00:00Z"))).toBe(true);
  });

  it("is off from Madrid midnight on October 1, not UTC midnight", () => {
    expect(isLicenseFreeEraActive(new Date("2026-10-01T00:00:00+02:00"))).toBe(false);
    // 23:00 UTC on Sep 30 is already Oct 1 in Madrid — the switch must follow Madrid.
    expect(isLicenseFreeEraActive(new Date("2026-09-30T23:00:00Z"))).toBe(false);
  });

  it("is active today (peak season 2026)", () => {
    expect(isLicenseFreeEraActive(new Date("2026-08-16T12:00:00Z"))).toBe(true);
  });

  it("pins the regulatory date", () => {
    expect(LICENSE_FREE_LAST_DAY).toBe("2026-09-30");
  });
});

describe("formatPersonName", () => {
  it("normalizes shouted names", () => {
    expect(formatPersonName("Raul RIVELLES GARCIA")).toBe("Raul Rivelles Garcia");
  });

  it("handles lowercase, extra spaces, hyphens and apostrophes", () => {
    expect(formatPersonName("  maría   josé garcía-lópez ")).toBe("María José García-López");
    expect(formatPersonName("o'brien")).toBe("O'Brien");
  });

  it("passes caseless scripts through", () => {
    expect(formatPersonName("刘诗琪")).toBe("刘诗琪");
  });
});
