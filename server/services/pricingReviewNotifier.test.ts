import { describe, it, expect } from "vitest";
import { buildPricingReminder } from "./pricingReviewNotifier";

// Season is April (4) to October (10) — see shared/constants.ts.
// The reminder fires 7 days before the 1st of each season month.
describe("buildPricingReminder", () => {
  it("fires 7 days before each season month, and only then", () => {
    // 25 Aug + 7 = 1 Sep. August has 31 days.
    expect(buildPricingReminder(new Date("2026-08-25T09:00:00Z"))?.title).toBe(
      "Precios Click&Boat: revisar septiembre",
    );
    // A day early or a day late must stay silent.
    expect(buildPricingReminder(new Date("2026-08-24T09:00:00Z"))).toBeNull();
    expect(buildPricingReminder(new Date("2026-08-26T09:00:00Z"))).toBeNull();
    expect(buildPricingReminder(new Date("2026-08-01T09:00:00Z"))).toBeNull();
  });

  it("lands on the right day for 30- and 31-day months, no per-month table", () => {
    // 24 Apr + 7 = 1 May (April has 30 days).
    expect(buildPricingReminder(new Date("2027-04-24T09:00:00Z"))?.title).toBe("Precios Click&Boat: revisar mayo");
    // 24 Sep + 7 = 1 Oct (September has 30 days).
    expect(buildPricingReminder(new Date("2026-09-24T09:00:00Z"))?.title).toBe("Precios Click&Boat: revisar octubre");
    // 25 Jul + 7 = 1 Aug (July has 31 days).
    expect(buildPricingReminder(new Date("2027-07-25T09:00:00Z"))?.title).toBe("Precios Click&Boat: revisar agosto");
  });

  it("covers every season month of next year", () => {
    const fired = [
      "2027-03-25", "2027-04-24", "2027-05-25", "2027-06-24", "2027-07-25", "2027-08-25", "2027-09-24",
    ].map((d) => buildPricingReminder(new Date(`${d}T09:00:00Z`))?.title);
    expect(fired).toEqual([
      "Precios Click&Boat: revisar abril",
      "Precios Click&Boat: revisar mayo",
      "Precios Click&Boat: revisar junio",
      "Precios Click&Boat: revisar julio",
      "Precios Click&Boat: revisar agosto",
      "Precios Click&Boat: revisar septiembre",
      "Precios Click&Boat: revisar octubre",
    ]);
  });

  it("adds the rebuild warning only for the season opener", () => {
    const abril = buildPricingReminder(new Date("2027-03-25T09:00:00Z"));
    expect(abril?.message).toMatch(/AVISO IMPORTANTE/);
    expect(abril?.message).toMatch(/sin año/); // the reason must be spelled out
    const mayo = buildPricingReminder(new Date("2027-04-24T09:00:00Z"));
    expect(mayo?.message).not.toMatch(/AVISO IMPORTANTE/);
  });

  it("lists both fleets, split by licence", () => {
    const m = buildPricingReminder(new Date("2026-08-25T09:00:00Z"))!.message;
    expect(m).toMatch(/CON LICENCIA/);
    expect(m).toMatch(/SIN LICENCIA/);
    for (const boat of ["Mingolla Brava 19", "Trimarchi 57S", "Pacific Craft 625"]) expect(m).toContain(boat);
    for (const boat of ["Solar 450", "Remus 450", "Astec 480", "Astec 400"]) expect(m).toContain(boat);
  });

  it("fires exactly once per season month over a whole year, never twice", () => {
    const hits: string[] = [];
    for (const d = new Date(Date.UTC(2027, 0, 1)); d.getUTCFullYear() === 2027; d.setUTCDate(d.getUTCDate() + 1)) {
      const r = buildPricingReminder(new Date(d.getTime() + 9 * 3600 * 1000));
      if (r) hits.push(`${d.toISOString().slice(0, 10)} ${r.title.replace("Precios Click&Boat: revisar ", "")}`);
    }
    expect(hits).toEqual([
      "2027-03-25 abril",
      "2027-04-24 mayo",
      "2027-05-25 junio",
      "2027-06-24 julio",
      "2027-07-25 agosto",
      "2027-08-25 septiembre",
      "2027-09-24 octubre",
    ]);
  });

  it("stays silent out of season", () => {
    // 24 Oct + 7 = 1 Nov, and 22 Feb + 7 = 1 Mar: both outside April-October.
    expect(buildPricingReminder(new Date("2026-10-25T09:00:00Z"))).toBeNull();
    expect(buildPricingReminder(new Date("2027-02-22T09:00:00Z"))).toBeNull();
    expect(buildPricingReminder(new Date("2026-11-24T09:00:00Z"))).toBeNull();
  });

  it("uses the Madrid date, not UTC", () => {
    // 24 Aug 23:00 UTC is already 25 Aug in Madrid (CEST, +2) → must fire.
    expect(buildPricingReminder(new Date("2026-08-24T23:00:00Z"))?.title).toBe(
      "Precios Click&Boat: revisar septiembre",
    );
  });
});
