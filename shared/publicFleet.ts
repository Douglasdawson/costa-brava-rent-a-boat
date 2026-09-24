import { boatDataRequiresLicense, isCaptainedBoat, isPubliclyListed, type BoatData } from "./boatData";

/**
 * {@link isPubliclyListed} for static BOAT_DATA entries, which carry no
 * `requiresLicense` flag. The captained excursion counts as licensed (the
 * captain holds it), mirroring its DB row.
 */
export function isCatalogBoatPubliclyListed(boat: BoatData, now: Date = new Date()): boolean {
  return isPubliclyListed(
    { id: boat.id, requiresLicense: boatDataRequiresLicense(boat) || isCaptainedBoat(boat.id) },
    now,
  );
}

/**
 * Whether a PUBLIC request (quote, booking, inquiry) may target this boat for a
 * rental on `date`: listed today AND on the rental day, so a licence-free boat
 * can't be booked in September for an October outing. `date` may be a
 * YYYY-MM-DD string; an unparseable one falls back to the check on `now`.
 */
export function isBookableOn(
  boat: { id: string; requiresLicense?: boolean | null; isActive?: boolean | null },
  date: Date | string,
  now: Date = new Date(),
): boolean {
  const day = typeof date === "string" ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00Z` : date) : date;
  return isPubliclyListed(boat, now) && (Number.isNaN(day.getTime()) || isPubliclyListed(boat, day));
}

/** Spanish message returned to the public when {@link isBookableOn} fails. */
export const BOAT_NOT_BOOKABLE_MESSAGE = "Este barco ya no está disponible para alquiler.";
