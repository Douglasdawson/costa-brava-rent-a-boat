import { neon } from "@neondatabase/serverless";
import { logger } from "./logger";

// Read-only bridge to the operational CRM (crmdamar), where the REAL confirmed
// bookings and revenue live. This app only captures booking requests, so its own
// `bookings` table has no confirmed-with-amount rows — hence "ticket medio 0".
//
// We query crmdamar's Neon database directly (SELECT only) over the Neon HTTP
// driver, using a separate connection string (CRMDAMAR_DATABASE_URL). No data is
// written. Confirmed = estado_reserva 'reserva_pagada' and not cancelled.
// NOTE: ideally point CRMDAMAR_DATABASE_URL at a READ-ONLY Neon role.

export interface CrmDamarBookingStats {
  avgTicket: number;
  confirmedCount: number;
  totalRevenue: number;
  year: string | null;
  mode: string;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache: { at: number; data: CrmDamarBookingStats } | null = null;

export function isCrmDamarConfigured(): boolean {
  return !!process.env.CRMDAMAR_DATABASE_URL;
}

export async function getCrmDamarBookingStats(opts?: {
  year?: string;
}): Promise<CrmDamarBookingStats | null> {
  const url = process.env.CRMDAMAR_DATABASE_URL;
  if (!url) return null;

  const year = opts?.year && /^\d{4}$/.test(opts.year) ? opts.year : null;
  // Only the default (all-time) call is cached; year-specific calls bypass it.
  const useCache = !year;
  if (useCache && cache && Date.now() - cache.at < TTL_MS) return cache.data;

  try {
    const sql = neon(url);
    // rentals_real.date is text in DD/MM/YYYY, so the year filter matches the suffix.
    const rows = year
      ? await sql`
          SELECT COUNT(*)::int AS confirmed_count,
                 COALESCE(SUM(total), 0) AS total_revenue,
                 COALESCE(AVG(total), 0) AS avg_ticket
          FROM rentals_real
          WHERE estado_reserva = 'reserva_pagada'
            AND cancelled_rain = false AND cancelled_sea = false
            AND cancelled_wind = false AND cancelled_breakdown = false
            AND date LIKE ${"%/" + year}`
      : await sql`
          SELECT COUNT(*)::int AS confirmed_count,
                 COALESCE(SUM(total), 0) AS total_revenue,
                 COALESCE(AVG(total), 0) AS avg_ticket
          FROM rentals_real
          WHERE estado_reserva = 'reserva_pagada'
            AND cancelled_rain = false AND cancelled_sea = false
            AND cancelled_wind = false AND cancelled_breakdown = false`;

    const row = (rows as Array<Record<string, unknown>>)[0] || {};
    const data: CrmDamarBookingStats = {
      mode: "REAL",
      year,
      confirmedCount: Number(row.confirmed_count) || 0,
      totalRevenue: Math.round((Number(row.total_revenue) || 0) * 100) / 100,
      avgTicket: Math.round((Number(row.avg_ticket) || 0) * 100) / 100,
    };
    if (useCache) cache = { at: Date.now(), data };
    return data;
  } catch (error) {
    logger.warn("[crmdamar] stats query error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export interface MetaBookingMatch {
  matchedBookings: number;
  attributedRevenue: number;
}

// Close the loop: given the emails / last-9-digit phones of this app's
// Meta-sourced inquiries, find how many became CONFIRMED bookings in crmdamar and
// their revenue. Matches rentals_real -> clients_real (by dni) on email or phone.
export async function matchMetaBookings(
  emails: string[],
  phones9: string[]
): Promise<MetaBookingMatch> {
  const url = process.env.CRMDAMAR_DATABASE_URL;
  const empty: MetaBookingMatch = { matchedBookings: 0, attributedRevenue: 0 };
  if (!url || (emails.length === 0 && phones9.length === 0)) return empty;

  try {
    const sql = neon(url);
    const rows = await sql`
      SELECT COUNT(*)::int AS n, COALESCE(SUM(r.total), 0) AS rev
      FROM rentals_real r
      JOIN clients_real c ON c.dni = r.client_dni AND c.dni <> ''
      WHERE r.estado_reserva = 'reserva_pagada'
        AND r.cancelled_rain = false AND r.cancelled_sea = false
        AND r.cancelled_wind = false AND r.cancelled_breakdown = false
        AND (
          (c.email LIKE '%@%' AND lower(c.email) = ANY(${emails}))
          OR right(regexp_replace(c.telefono, '[^0-9]', '', 'g'), 9) = ANY(${phones9})
        )`;
    const row = (rows as Array<Record<string, unknown>>)[0] || {};
    return {
      matchedBookings: Number(row.n) || 0,
      attributedRevenue: Math.round((Number(row.rev) || 0) * 100) / 100,
    };
  } catch (error) {
    logger.warn("[crmdamar] match query error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return empty;
  }
}
