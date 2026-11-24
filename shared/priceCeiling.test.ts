import { describe, it, expect } from "vitest";
import { BOAT_DATA } from "./boatData";
import { priceCeilingAcrossBoats } from "./pricing";

describe("priceCeilingAcrossBoats", () => {
  it("takes the highest active price over every season and duration", () => {
    const boats = [
      { pricing: { BAJA: { prices: { "2h": 175, "4h": 255 } }, ALTA: { prices: { "8h": 420, "6h": 0 } } } },
      { pricing: { ALTA: { prices: { "8h": 460 } } } },
      null,
    ];
    expect(priceCeilingAcrossBoats(boats)).toBe(460);
  });

  it("returns null when nothing is priced", () => {
    expect(priceCeilingAcrossBoats([{ pricing: null }, undefined])).toBeNull();
  });

  it("is 460 for the licensed boats and the captained excursion of the catalog", () => {
    const ids = ["mingolla-brava-19", "trimarchi-57s", "pacific-craft-625", "excursion-privada"];
    expect(priceCeilingAcrossBoats(ids.map((id) => BOAT_DATA[id]))).toBe(460);
  });
});
