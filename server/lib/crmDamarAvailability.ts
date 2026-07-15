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
 * Busy Madrid-local intervals for the given CRM boat names, overlapping [rangeStart, rangeEnd).
 */
export async function getCrmDamarBusyIntervals(
  crmBoatNames: string[],
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CrmBusyInterval[]> {
  const url = process.env.CRMDAMAR_DATABASE_URL;
  if (!url || crmBoatNames.length === 0) return [];

  const cacheKey = `${crmBoatNames.join("|")}::${rangeStart.getTime()}::${rangeEnd.getTime()}`;
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

    cache.set(cacheKey, { at: Date.now(), data: intervals });
    return intervals;
  } catch (error) {
    logger.warn("[crmdamar] availability query error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return []; // fail-open: the calendar keeps working off this app's own bookings
  }
}

// Public boat catalog id -> CRM `barcos.nombre` value(s) that count as busy for that
// page. Mirrors the existing `sharedBoatIds` pattern in server/storage/bookings.ts
// (public boats that share one physical hull). Filled in by comparing `SELECT nombre
// FROM barcos` (CRM) against shared/boatData.ts (this app) — confirmed 1:1 for these;
// left out where the public page doesn't clearly map to one CRM boat name yet.
export const CRM_BOAT_NAMES_BY_PUBLIC_ID: Record<string, string[]> = {
  "astec-480": ["Astec 480"],
  "astec-400": ["Astec 400"],
  "mingolla-brava-19": ["Mingolla Brava 19"],
  "trimarchi-57s": ["Trimarchi 57S"],
  "pacific-craft-625": ["Pacific Craft 625"],
  "excursion-privada": ["Excursión Privada"],
  "solar-450": ["Solar 450 Blanca"],
  "remus-450": ["Remus Damar"], // confirmado por el dueño
  // TODO: remus-450-ii — no está claro a qué barco del CRM corresponde ("Remus",
  // inactivo, es el único nombre restante y no se ha confirmado); dejarlo sin mapear
  // hasta confirmarlo es más seguro que adivinar.
  // TODO: jetski-circuito / jetski-excursion-monitor — no hay un "barco" equivalente
  // obvio en el catálogo del CRM (posible actividad sin ficha de barco propia).
};
