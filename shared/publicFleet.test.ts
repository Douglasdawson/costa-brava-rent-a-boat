import { describe, it, expect } from "vitest";
import { BOAT_DATA } from "./boatData";
import { isBookableOn, isCatalogBoatPubliclyListed } from "./publicFleet";

const SEPT = new Date("2026-09-30T20:00:00Z"); // 22:00 Madrid, still Sept 30
const OCT = new Date("2026-09-30T22:30:00Z"); // 00:30 Madrid, Oct 1
const free = { id: "solar-450", requiresLicense: false, isActive: true };
const licensed = { id: "mingolla-brava-19", requiresLicense: true, isActive: true };

describe("isCatalogBoatPubliclyListed", () => {
  it("hides the static licence-free boats from Oct 1 and keeps licensed + excursion", () => {
    const listed = (now: Date) =>
      Object.values(BOAT_DATA).filter((b) => isCatalogBoatPubliclyListed(b, now)).map((b) => b.id);
    expect(listed(SEPT)).toContain("solar-450");
    expect(listed(OCT)).not.toContain("solar-450");
    expect(listed(OCT)).toEqual(
      expect.arrayContaining(["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"]),
    );
    expect(listed(OCT)).toHaveLength(4);
  });
});

describe("isBookableOn", () => {
  it("rejects a licence-free boat for an October rental even when asked in September", () => {
    expect(isBookableOn(free, "2026-09-30", SEPT)).toBe(true);
    expect(isBookableOn(free, "2026-10-02", SEPT)).toBe(false);
    expect(isBookableOn(free, new Date("2026-10-02T10:00:00Z"), SEPT)).toBe(false);
    expect(isBookableOn(free, "2026-10-02", OCT)).toBe(false);
  });

  it("keeps licensed boats bookable and falls back to `now` on an unparseable date", () => {
    expect(isBookableOn(licensed, "2026-10-02", OCT)).toBe(true);
    // The live DB row has requiresLicense=false for the captained excursion.
    expect(isBookableOn({ id: "excursion-privada", requiresLicense: false, isActive: true }, "2026-10-02", OCT)).toBe(true);
    expect(isBookableOn(free, "Flexible", SEPT)).toBe(true);
    expect(isBookableOn(free, "Flexible", OCT)).toBe(false);
  });
});
