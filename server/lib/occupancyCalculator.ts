import { db } from "../db";
import { bookings } from "@shared/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { OPERATING_START_HOUR, OPERATING_END_HOUR } from "@shared/constants";

/** Default rolling window size (days) centered on the target date */
const DEFAULT_WINDOW_DAYS = 14;

/** Available operating hours per day */
const HOURS_PER_DAY = OPERATING_END_HOUR - OPERATING_START_HOUR; // 20 - 9 = 11

/**
 * Calculate the occupancy rate for a specific boat around a given date.
 *
 * Queries confirmed/hold/pending bookings within a rolling window centered
 * on `date`, then computes:
 *   occupancy = (total booked hours in window) / (total available hours in window)
 *
 * @param boatId - The boat identifier
 * @param date - The target date to evaluate occupancy around
 * @param windowDays - Size of the rolling window in days (default 14, centered on date)
 * @returns Occupancy rate between 0 and 1
 */
export async function getOccupancyRate(
  boatId: string,
  date: Date,
  windowDays: number = DEFAULT_WINDOW_DAYS,
): Promise<number> {
  const halfWindow = Math.floor(windowDays / 2);

  // Build window start/end centered on the target date
  const windowStart = new Date(date);
  windowStart.setDate(windowStart.getDate() - halfWindow);
  windowStart.setHours(0, 0, 0, 0);

  const windowEnd = new Date(date);
  windowEnd.setDate(windowEnd.getDate() + (windowDays - halfWindow));
  windowEnd.setHours(23, 59, 59, 999);

  // Total available hours in the window
  const totalAvailableHours = windowDays * HOURS_PER_DAY;

  if (totalAvailableHours <= 0) {
    return 0;
  }

  // Fetch active bookings (hold, pending_payment, confirmed) for this boat in the window
  const windowBookings = await db
    .select({
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      totalHours: bookings.totalHours,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.boatId, boatId),
        inArray(bookings.bookingStatus, ["hold", "pending_payment", "confirmed"]),
        gte(bookings.endTime, windowStart),
        lte(bookings.startTime, windowEnd),
      )
    );

  // Sum booked hours, clamping to the window boundaries
  let totalBookedHours = 0;
  for (const booking of windowBookings) {
    // Use totalHours from the booking for accuracy, but clamp bookings
    // that partially overlap the window edges
    const bookingStart = booking.startTime < windowStart ? windowStart : booking.startTime;
    const bookingEnd = booking.endTime > windowEnd ? windowEnd : booking.endTime;
    const durationMs = bookingEnd.getTime() - bookingStart.getTime();
    const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
    totalBookedHours += durationHours;
  }

  // Clamp to [0, 1]
  return Math.min(1, totalBookedHours / totalAvailableHours);
}
