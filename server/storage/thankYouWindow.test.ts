import { describe, it, expect } from "vitest";

/**
 * Pure-function mirror of the WHERE clause in getCompletedBookingsForThankYou()
 * from server/storage/bookings.ts. Keep this in sync with that query so we can
 * validate boundary conditions without spinning up a DB.
 */
interface BookingForPredicate {
  endTime: Date;
  emailThankYouSent: boolean;
  bookingStatus: string;
}

function isEligibleForThankYou(
  booking: BookingForPredicate,
  hoursAfter: number,
  now: Date,
): boolean {
  const windowEnd = new Date(now.getTime() - (hoursAfter - 2) * 60 * 60 * 1000);
  const windowStart = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  return (
    ["confirmed", "completed"].includes(booking.bookingStatus) &&
    booking.emailThankYouSent === false &&
    booking.endTime >= windowStart &&
    booking.endTime <= windowEnd
  );
}

/**
 * Mirror of getBookingsForReviewRequest() predicate — same 22h to 72h window,
 * different flag name and no email filter.
 */
function isEligibleForReviewRequest(
  booking: { endTime: Date; reviewRequestSent: boolean; bookingStatus: string },
  now: Date,
): boolean {
  const windowEnd = new Date(now.getTime() - 22 * 60 * 60 * 1000);
  const windowStart = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  return (
    ["completed", "confirmed"].includes(booking.bookingStatus) &&
    booking.reviewRequestSent === false &&
    booking.endTime >= windowStart &&
    booking.endTime <= windowEnd
  );
}

describe("thank-you eligibility — status filter", () => {
  const now = new Date("2026-04-22T15:00:00Z");
  const endTime = new Date("2026-04-21T13:00:00Z"); // 26h ago = inside window

  it("accepts 'confirmed' bookings (main path before auto-complete)", () => {
    expect(
      isEligibleForThankYou(
        { endTime, emailThankYouSent: false, bookingStatus: "confirmed" },
        24,
        now,
      ),
    ).toBe(true);
  });

  it("accepts 'completed' bookings (after auto-complete or retroactive admin entry)", () => {
    // REGRESSION guard: before the fix, the query excluded status='completed'
    // and the thank-you never fired for any auto-completed or retroactively-
    // created booking. This assertion pins the fix.
    expect(
      isEligibleForThankYou(
        { endTime, emailThankYouSent: false, bookingStatus: "completed" },
        24,
        now,
      ),
    ).toBe(true);
  });

  it("rejects 'draft' bookings", () => {
    expect(
      isEligibleForThankYou(
        { endTime, emailThankYouSent: false, bookingStatus: "draft" },
        24,
        now,
      ),
    ).toBe(false);
  });

  it("rejects 'cancelled' bookings", () => {
    expect(
      isEligibleForThankYou(
        { endTime, emailThankYouSent: false, bookingStatus: "cancelled" },
        24,
        now,
      ),
    ).toBe(false);
  });

  it("rejects bookings that already received the thank-you email", () => {
    expect(
      isEligibleForThankYou(
        { endTime, emailThankYouSent: true, bookingStatus: "completed" },
        24,
        now,
      ),
    ).toBe(false);
  });
});

describe("thank-you eligibility — window boundaries", () => {
  const now = new Date("2026-04-22T15:00:00Z");
  const base = { emailThankYouSent: false, bookingStatus: "completed" as const };

  it("accepts booking that ended exactly 22h ago (lower-bound edge)", () => {
    const endTime = new Date(now.getTime() - 22 * 60 * 60 * 1000);
    expect(isEligibleForThankYou({ ...base, endTime }, 24, now)).toBe(true);
  });

  it("rejects booking that ended 21h ago (inside cooling period)", () => {
    const endTime = new Date(now.getTime() - 21 * 60 * 60 * 1000);
    expect(isEligibleForThankYou({ ...base, endTime }, 24, now)).toBe(false);
  });

  it("accepts booking that ended 48h ago (scheduler outage catch-up)", () => {
    // REGRESSION guard: the old 22-26h window permanently dropped bookings
    // if the cron didn't fire in that 4-hour window. The widened 22h-72h
    // window restores catch-up on next cron fire.
    const endTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    expect(isEligibleForThankYou({ ...base, endTime }, 24, now)).toBe(true);
  });

  it("accepts booking that ended exactly 72h ago (upper-bound edge)", () => {
    const endTime = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    expect(isEligibleForThankYou({ ...base, endTime }, 24, now)).toBe(true);
  });

  it("rejects booking that ended 73h ago (too stale for automated send)", () => {
    const endTime = new Date(now.getTime() - 73 * 60 * 60 * 1000);
    expect(isEligibleForThankYou({ ...base, endTime }, 24, now)).toBe(false);
  });

  it("rejects future booking (endTime in the future)", () => {
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    expect(isEligibleForThankYou({ ...base, endTime }, 24, now)).toBe(false);
  });
});

describe("review-request eligibility — mirrors widened window", () => {
  const now = new Date("2026-04-22T15:00:00Z");
  const base = { reviewRequestSent: false, bookingStatus: "completed" as const };

  it("accepts 'completed' bookings (previously accepted — regression guard)", () => {
    const endTime = new Date(now.getTime() - 26 * 60 * 60 * 1000);
    expect(isEligibleForReviewRequest({ ...base, endTime }, now)).toBe(true);
  });

  it("accepts 48h-old booking (post-widen catch-up)", () => {
    const endTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    expect(isEligibleForReviewRequest({ ...base, endTime }, now)).toBe(true);
  });

  it("rejects 73h-old booking", () => {
    const endTime = new Date(now.getTime() - 73 * 60 * 60 * 1000);
    expect(isEligibleForReviewRequest({ ...base, endTime }, now)).toBe(false);
  });

  it("rejects already-flagged booking", () => {
    const endTime = new Date(now.getTime() - 26 * 60 * 60 * 1000);
    expect(
      isEligibleForReviewRequest(
        { ...base, endTime, reviewRequestSent: true },
        now,
      ),
    ).toBe(false);
  });
});
