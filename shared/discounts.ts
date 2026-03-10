/**
 * Automatic discount calculation for booking flow.
 *
 * Two mutually exclusive discounts (early-bird takes priority):
 *
 * 1. Early-bird (-10%): booking 7+ days in advance, LOW season only.
 * 2. Flash deal (-10%): booking for TOMORROW with no existing bookings
 *    for that day, LOW or MID season only.
 */

import type { Season } from './pricing';

export type AutoDiscountType = 'early-bird' | 'flash-deal';

export interface AutoDiscountResult {
  type: AutoDiscountType | null;
  /** Discount percentage (0 or 10) */
  percentage: number;
  /** Absolute discount amount in euros */
  amount: number;
}

/**
 * Determine the season for a given month (1-12).
 * Returns null if the month is outside the operational season (Nov-Mar).
 */
function getSeasonForMonth(month: number): Season | null {
  if (month === 7) return 'MEDIA';
  if (month === 8) return 'ALTA';
  if (month >= 4 && month <= 6) return 'BAJA';
  if (month >= 9 && month <= 10) return 'BAJA';
  return null; // off-season
}

/**
 * Calculate the number of full days between two YYYY-MM-DD date strings.
 * Positive if bookingDate is in the future relative to today.
 */
function daysBetween(todayStr: string, bookingDateStr: string): number {
  const today = new Date(todayStr + 'T00:00:00');
  const booking = new Date(bookingDateStr + 'T00:00:00');
  const diffMs = booking.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get tomorrow's date as YYYY-MM-DD given today's date string.
 */
function getTomorrow(todayStr: string): string {
  const d = new Date(todayStr + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DISCOUNT_PERCENTAGE = 10;

export function calculateAutoDiscount(params: {
  /** Booking date in YYYY-MM-DD format */
  bookingDate: string;
  /** Today's date in YYYY-MM-DD format (caller provides for testability) */
  today: string;
  /** Base rental price in euros */
  basePrice: number;
  /** Number of existing bookings for the boat on bookingDate */
  existingBookingsForDate: number;
}): AutoDiscountResult {
  const { bookingDate, today, basePrice, existingBookingsForDate } = params;

  const noDiscount: AutoDiscountResult = { type: null, percentage: 0, amount: 0 };

  // Parse booking date month
  const bookingMonth = parseInt(bookingDate.split('-')[1], 10);
  const season = getSeasonForMonth(bookingMonth);

  // No discounts outside operational season or in ALTA
  if (!season || season === 'ALTA') return noDiscount;

  const daysInAdvance = daysBetween(today, bookingDate);

  // Early-bird: 7+ days in advance, LOW season only
  if (daysInAdvance >= 7 && season === 'BAJA') {
    const amount = Math.round((basePrice * DISCOUNT_PERCENTAGE) / 100);
    return { type: 'early-bird', percentage: DISCOUNT_PERCENTAGE, amount };
  }

  // Flash deal: booking is for tomorrow, no existing bookings, LOW or MID season
  if (bookingDate === getTomorrow(today) && existingBookingsForDate === 0) {
    if (season === 'BAJA' || season === 'MEDIA') {
      const amount = Math.round((basePrice * DISCOUNT_PERCENTAGE) / 100);
      return { type: 'flash-deal', percentage: DISCOUNT_PERCENTAGE, amount };
    }
  }

  return noDiscount;
}
