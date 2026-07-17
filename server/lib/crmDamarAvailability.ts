import { neon } from "@neondatabase/serverless";
import { logger } from "./logger";
import { parseTripDate } from "./crmDamarStats";

// Extends the read-only CRM bridge (see crmDamarStats.ts) so the public
// availability calendar/slot-picker also blocks on REAL CRM DAMAR reservations,
// not just this app's own `bookings` table — which today rarely has confirmed
// rows, because the live booking flow hands off to WhatsApp and staff closes
// the deal inside the CRM (see BookingFormWidget: it only POSTs to
// /api/booking-inquiries, never to /api/bookings).
//
// SELECT only, same CRMDAMAR_DATABASE_URL as crmDamarStats.ts. Any non-cancelled
// rentals_real row counts as busy, regardless of estado_reserva — mirrors the
// CRM's own findRentalConflict, which doesn't filter by confirmation state either.

export interface CrmBusyInterval {
  start: Date;
  end: Date;
}

const TTL_MS = 90 * 1000; // near-real-time without hammering the CRM DB on every calendar paint
const cache = new Map<string, { at: number; data: CrmBusyInterval[] }>();

// Wall-clock (Europe/Madrid) hour/minute -> epoch ms, DST-correct. Ported from
// crmdamar's server/push-reminders.ts (madridWallToEpochMs) — same problem
// (rentals_real stores local Madrid time, the server may run in UTC).
function madridWallToEpochMs(y: number, mo: number, d: number, h: number, mi: number): number {
  const asUTC = Date.UTC(y, mo - 1, d, h, mi);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid", hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(asUTC)).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  const madridAsUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - (madridAsUTC - asUTC);
}

function parseHm(raw: string | null): { h: number; m: number } | null {
  const match = String(raw || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]) };
}

function yearsInRange(start: Date, end: Date): number[] {
  const years: number[] = [];
  for (let y = start.getUTCFullYear(); y <= end.getUTCFullYear(); y++) years.push(y);
  return years;
}

/**
 * Keeps only the stretches covered by at least `units` overlapping intervals.
 *
 * With units=1 (the default) every interval counts: the names are aliases of one hull, so
 * one booking means the boat is out. With units=2 ("Solar 450" = two interchangeable
 * hulls) a single booking leaves one free, and the product is only sold out while BOTH are
 * busy — returning the plain union there would show "busy" with a boat still available and
 * cost real bookings.
 *
 * Sweep line over the endpoints. Ties resolve ends before starts (`-1` sorts first), so
 * back-to-back bookings (10-14 and 14-18) never count as an overlap at 14:00.
 */
export function intervalsCoveredAtLeast(intervals: CrmBusyInterval[], units: number): CrmBusyInterval[] {
  if (units <= 1) return intervals;
  const events: Array<[number, number]> = [];
  for (const i of intervals) {
    events.push([i.start.getTime(), 1]);
    events.push([i.end.getTime(), -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const out: CrmBusyInterval[] = [];
  let depth = 0;
  let openedAt: number | null = null;
  for (const [t, delta] of events) {
    const before = depth;
    depth += delta;
    if (before < units && depth >= units) openedAt = t;
    else if (before >= units && depth < units && openedAt !== null) {
      if (t > openedAt) out.push({ start: new Date(openedAt), end: new Date(t) });
      openedAt = null;
    }
  }
  return out;
}

/**
 * Busy Madrid-local intervals for the given CRM boat names, overlapping [rangeStart, rangeEnd).
 * `units` = how many interchangeable hulls the names stand for (see intervalsCoveredAtLeast).
 */
export async function getCrmDamarBusyIntervals(
  crmBoatNames: string[],
  rangeStart: Date,
  rangeEnd: Date,
  units = 1,
): Promise<CrmBusyInterval[]> {
  const url = process.env.CRMDAMAR_DATABASE_URL;
  if (!url || crmBoatNames.length === 0) return [];

  const cacheKey = `${crmBoatNames.join("|")}::${units}::${rangeStart.getTime()}::${rangeEnd.getTime()}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  try {
    const sql = neon(url);
    // rentals_real.date is mixed DD/MM/YYYY / ISO text (see crmDamarStats.ts) — narrow by
    // year with LIKE (cheap, index-friendly enough at this row count) then filter the
    // exact range in JS once dates/times are parsed.
    const yearPatterns = yearsInRange(rangeStart, rangeEnd).flatMap((y) => [`%/${y}`, `${y}-%`]);

    const rows = (await sql`
      SELECT date, start_time, end_time
      FROM rentals_real
      WHERE boat_type = ANY(${crmBoatNames})
        AND cancelled_rain = false AND cancelled_sea = false
        AND cancelled_wind = false AND cancelled_breakdown = false
        AND cancelled_overbooking = false
        AND date LIKE ANY(${yearPatterns})
    `) as Array<{ date: string; start_time: string; end_time: string }>;

    const rangeStartMs = rangeStart.getTime();
    const rangeEndMs = rangeEnd.getTime();
    const intervals: CrmBusyInterval[] = [];

    for (const r of rows) {
      const day = parseTripDate(r.date);
      const startHm = parseHm(r.start_time);
      const endHm = parseHm(r.end_time);
      if (!day || !startHm || !endHm) continue;

      // parseTripDate builds Date.UTC(y, m-1, d) — reading the UTC fields back is a
      // lossless round trip to the plain y/mo/d the Madrid conversion needs.
      const y = day.getUTCFullYear();
      const mo = day.getUTCMonth() + 1;
      const d = day.getUTCDate();
      const startMs = madridWallToEpochMs(y, mo, d, startHm.h, startHm.m);
      const endMs = madridWallToEpochMs(y, mo, d, endHm.h, endHm.m);
      if (endMs <= startMs) continue;
      if (endMs <= rangeStartMs || startMs >= rangeEndMs) continue;

      intervals.push({ start: new Date(startMs), end: new Date(endMs) });
    }

    const result = intervalsCoveredAtLeast(intervals, units);
    cache.set(cacheKey, { at: Date.now(), data: result });
    return result;
  } catch (error) {
    logger.warn("[crmdamar] availability query error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return []; // fail-open: the calendar keeps working off this app's own bookings
  }
}

// Public boat catalog id -> CRM `barcos.nombre` value(s) that count as busy for that page.
//
// ⚠️ These names MUST come from the CRM's PRODUCTION database (Neon). The first version of
// this map was filled in against the CRM's DEV database, whose boats have different names
// ("Remus Damar" vs "Remus 450", "Pacific Craft 625" vs "Pacific Craft 625 Open"…). Five of
// eight entries matched nothing in production, and a name that matches nothing makes the
// query return zero rows — which this calendar reads as "everything free". It failed
// silently for months: the Remus page showed 15 free days with 12 bookings in the CRM.
// To re-check: `SELECT nombre FROM barcos ORDER BY orden` against PRODUCTION, never dev.
//
// A slug maps to SEVERAL names in two very different cases, so mind which one you have:
//   · Aliases of ONE hull (a rename, or a service sold on another boat) → busy if ANY is
//     busy. That's the default, and it's what `sharedBoatIds` does for pacific/excursión.
//   · SEVERAL interchangeable hulls sold as one product (see CRM_FLEET_UNITS) → busy only
//     when ALL of them are.
export const CRM_BOAT_NAMES_BY_PUBLIC_ID: Record<string, string[]> = {
  "astec-480": ["Astec 480"],
  "mingolla-brava-19": ["Mingolla Brava"],
  "trimarchi-57s": ["Trimarchi 57S"],
  // The Pacific Craft hull is sold under three CRM names: the boat itself, the private
  // excursion and the Blanes-fireworks trip (all share casco_id in the CRM, 17 jul 2026).
  // "Fuegos Blanes" has no public page here, but a fireworks booking still takes the hull,
  // so it must block the Pacific and excursion pages — hence it rides on this entry.
  // (excursion-privada also pulls the Pacific via sharedBoatIds in bookings.ts.)
  "pacific-craft-625": ["Pacific Craft 625 Open", "Fuegos Blanes"],
  "excursion-privada": ["Excursión Privada"],
  "remus-450": ["Remus 450"],
  "remus-450-ii": ["REMUS (2) 450"],
  // Two real hulls sold as one product: whichever is free goes out (owner, 17 jul 2026).
  // Needs CRM_FLEET_UNITS below, or the page would show "busy" with a solar still free.
  "solar-450": ["Solar Mercury", "Solar Yamaha"],
  // jetski-circuito / jetski-excursion-monitor: no CRM boat — the owner books them outside
  // the CRM (17 jul 2026), so there's nothing to read. Their calendar stays always-free.
};

// How many INTERCHANGEABLE hulls sit behind a public slug. Default 1 (the names above are
// aliases of the same hull). With >1 the slug is only busy once ALL of them are.
export const CRM_FLEET_UNITS: Record<string, number> = {
  "solar-450": 2,
};
