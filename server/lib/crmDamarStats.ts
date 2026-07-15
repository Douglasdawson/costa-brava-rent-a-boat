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
    // rentals_real.date is text with MIXED formats: DD/MM/YYYY (bulk of rows),
    // plus some YYYY-MM-DD / ISO timestamps. Match the year in either shape so
    // the year filter (and the annual ticket medio) doesn't silently drop rows.
    const rows = year
      ? await sql`
          SELECT COUNT(*)::int AS confirmed_count,
                 COALESCE(SUM(total), 0) AS total_revenue,
                 COALESCE(AVG(total), 0) AS avg_ticket
          FROM rentals_real
          WHERE estado_reserva = 'reserva_pagada'
            AND cancelled_rain = false AND cancelled_sea = false
            AND cancelled_wind = false AND cancelled_breakdown = false
            AND (date LIKE ${"%/" + year} OR date LIKE ${year + "-%"})`
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

// ── Attributed bookings, per-lead with a time window ─────────────────────────
// A lead (this app's inquiry, carrying utm/fbclid) is contact-matched against
// crmdamar's confirmed bookings by email or last-9-digit phone. Because
// rentals_real has NO creation timestamp (only `date` = trip day) we anchor the
// window on clients_real.fecha_registro (customer sign-up) OR the trip date, so
// a recurring customer's OLD booking isn't credited to a brand-new lead.

export interface LeadForMatch {
  inquiryId: string; // whatsapp_inquiries.id is a varchar/uuid, not a serial
  createdAt: Date;
  email: string | null;
  phone9: string | null;
}

export interface MatchedBooking {
  inquiryId: string;
  tripDate: string; // raw rentals_real.date (mixed formats)
  total: number;
  boatType: string | null;
  clientRegisteredAt: string | null;
}

// Parse rentals_real.date across its mixed shapes → a UTC Date (or null).
export function parseTripDate(raw: string | null): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); // DD/MM/YYYY
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); // YYYY-MM-DD or ISO
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return null;
}

/**
 * Match a batch of attributed leads against confirmed crmdamar bookings.
 * Applies the time window and deduplicates a booking that several inquiries of
 * the same person would otherwise multiply. Read-only.
 */
export async function matchAttributedBookings(
  leads: LeadForMatch[]
): Promise<MatchedBooking[]> {
  const url = process.env.CRMDAMAR_DATABASE_URL;
  if (!url || leads.length === 0) return [];

  const emails = [
    ...new Set(
      leads.map(l => l.email?.toLowerCase()).filter((e): e is string => !!e && e.includes("@"))
    ),
  ];
  const phones9 = [
    ...new Set(leads.map(l => l.phone9).filter((p): p is string => !!p && p.length >= 7)),
  ];
  if (emails.length === 0 && phones9.length === 0) return [];

  try {
    const sql = neon(url);
    // Pull candidate bookings with the client's contact + sign-up date, then
    // match/window/dedupe in JS (clearer than a lateral SQL join on text keys).
    const rows = (await sql`
      SELECT r.id AS rental_id, r.date AS trip_date, r.total, r.boat_type,
             lower(c.email) AS c_email,
             right(regexp_replace(c.telefono, '[^0-9]', '', 'g'), 9) AS c_phone9,
             c.fecha_registro AS registered_at
      FROM rentals_real r
      JOIN clients_real c ON c.dni = r.client_dni AND c.dni <> '' AND c.dni <> 'PENDIENTE'
      WHERE r.estado_reserva = 'reserva_pagada'
        AND r.cancelled_rain = false AND r.cancelled_sea = false
        AND r.cancelled_wind = false AND r.cancelled_breakdown = false
        AND (
          (c.email LIKE '%@%' AND lower(c.email) = ANY(${emails}))
          OR right(regexp_replace(c.telefono, '[^0-9]', '', 'g'), 9) = ANY(${phones9})
        )`) as Array<Record<string, unknown>>;

    const WINDOW_MS = 2 * 24 * 60 * 60 * 1000; // sign-up up to 2 days before the lead
    const out: MatchedBooking[] = [];
    const seenBooking = new Set<string>(); // dedupe by rentals_real.id

    for (const lead of leads) {
      const em = lead.email?.toLowerCase() || null;
      const ph = lead.phone9 && lead.phone9.length >= 7 ? lead.phone9 : null;
      for (const b of rows) {
        const bEmail = (b.c_email as string) || "";
        const bPhone = (b.c_phone9 as string) || "";
        const contactHit = (em && em.includes("@") && bEmail === em) || (ph && bPhone === ph);
        if (!contactHit) continue;

        const reg = b.registered_at ? new Date(String(b.registered_at)) : null;
        const trip = parseTripDate(b.trip_date as string);
        // Window: client signed up around/after the lead, OR trip is on/after the lead day.
        const leadDay = Date.UTC(
          lead.createdAt.getUTCFullYear(),
          lead.createdAt.getUTCMonth(),
          lead.createdAt.getUTCDate()
        );
        const regOk = reg ? reg.getTime() >= leadDay - WINDOW_MS : false;
        const tripOk = trip ? trip.getTime() >= leadDay : false;
        if (!regOk && !tripOk) continue;

        const bookingKey = String(b.rental_id);
        if (seenBooking.has(bookingKey)) continue;
        seenBooking.add(bookingKey);

        out.push({
          inquiryId: lead.inquiryId,
          tripDate: String(b.trip_date),
          total: Math.round((Number(b.total) || 0) * 100) / 100,
          boatType: (b.boat_type as string) || null,
          clientRegisteredAt: b.registered_at ? String(b.registered_at) : null,
        });
      }
    }
    return out;
  } catch (error) {
    logger.warn("[crmdamar] attributed match query error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
