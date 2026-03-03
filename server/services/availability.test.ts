import { describe, it, expect } from "vitest";

// Test the overlap detection logic directly
// Two time ranges overlap if: startA < endB AND endA > startB
function hasTimeOverlap(
  startA: Date, endA: Date,
  startB: Date, endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

describe("booking time overlap detection", () => {
  it("detects overlapping bookings", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    const bookingB = { start: new Date("2026-06-15T12:00"), end: new Date("2026-06-15T16:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(true);
  });

  it("detects booking fully contained within another", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T18:00") };
    const bookingB = { start: new Date("2026-06-15T12:00"), end: new Date("2026-06-15T14:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(true);
  });

  it("allows adjacent bookings (no gap needed)", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    const bookingB = { start: new Date("2026-06-15T14:00"), end: new Date("2026-06-15T18:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(false);
  });

  it("allows non-overlapping bookings", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T12:00") };
    const bookingB = { start: new Date("2026-06-15T14:00"), end: new Date("2026-06-15T16:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(false);
  });

  it("detects same start time as overlap", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T12:00") };
    const bookingB = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(true);
  });

  it("detects same time range as overlap", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    const bookingB = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(true);
  });
});
