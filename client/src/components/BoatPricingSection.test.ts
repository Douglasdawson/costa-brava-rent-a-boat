import { describe, it, expect } from "vitest";
import { occupiedRanges } from "./BoatPricingSection";

function slots(spec: Record<string, boolean>): { time: string; available: boolean }[] {
  return Object.entries(spec).map(([time, available]) => ({ time, available }));
}

describe("occupiedRanges", () => {
  it("collapses a single contiguous busy run into one range", () => {
    const result = occupiedRanges(
      slots({ "09:00": true, "10:00": false, "11:00": false, "12:00": false, "13:00": false, "14:00": true })
    );
    expect(result).toEqual(["10:00–14:00"]);
  });

  it("returns two ranges when there's a free gap in between", () => {
    const result = occupiedRanges(
      slots({ "09:00": false, "10:00": true, "11:00": false, "12:00": false, "13:00": true })
    );
    expect(result).toEqual(["09:00–10:00", "11:00–13:00"]);
  });

  it("returns [] when the whole day is free", () => {
    expect(occupiedRanges(slots({ "09:00": true, "10:00": true }))).toEqual([]);
  });

  it("closes a range that runs to the last slot", () => {
    const result = occupiedRanges(slots({ "18:00": true, "19:00": false }));
    expect(result).toEqual(["19:00–20:00"]);
  });

  it("returns [] for an empty slot list", () => {
    expect(occupiedRanges([])).toEqual([]);
  });
});
