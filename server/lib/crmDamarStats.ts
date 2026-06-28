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
