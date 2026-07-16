import type { Express } from "express";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { logger } from "../lib/logger";
import { OPERATING_START_HOUR, OPERATING_END_HOUR, SEASON_START_MONTH, SEASON_END_MONTH } from "@shared/constants";

/** Extract hours and minutes in Europe/Madrid timezone */
function getMadridTime(date: Date): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hours = parseInt(parts.find((p) => p.type === "hour")!.value);
  const minutes = parseInt(parts.find((p) => p.type === "minute")!.value);
  return { hours, minutes };
}

/** Madrid-local calendar date (YYYY-MM-DD) + wall-clock hours/minutes for an instant. */
function getMadridDateTime(date: Date): { dateStr: string; hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hourRaw = get("hour");
  const hours = parseInt(hourRaw === "24" ? "00" : hourRaw, 10);
  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    hours,
    minutes: parseInt(get("minute"), 10),
  };
}

// All possible half-hour start slots (matching the frontend TIME_SLOTS)
// Last departure slot is 1 hour before closing (minimum rental = 1h)
const ALL_START_SLOTS: string[] = [];
for (let h = OPERATING_START_HOUR; h <= OPERATING_END_HOUR - 1; h++) {
  ALL_START_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < OPERATING_END_HOUR - 1) ALL_START_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

/** Parse "HH:MM" to fractional hours from midnight (e.g. "09:30" -> 9.5) */
function slotToHours(slot: string): number {
  const [h, m] = slot.split(":").map(Number);
  return h + m / 60;
}

/**
 * Hourly-slot day status for one boat+day, given its booked intervals (fractional
 * Madrid hours). Shared by /api/boats/:id/availability (one boat, whole month) and
 * /api/fleet-availability (whole fleet, one day) so "available/partial/booked" means
 * exactly the same thing in both — the calendar and the booking wizard's boat list.
 */
function computeDayStatus(bookedIntervals: { start: number; end: number }[]): {
  status: "available" | "partial" | "booked";
  availableSlots: number;
  totalSlots: number;
} {
  const totalSlots = OPERATING_END_HOUR - OPERATING_START_HOUR;
  let bookedSlots = 0;
  for (let hour = OPERATING_START_HOUR; hour <= OPERATING_END_HOUR - 1; hour++) {
    const isBooked = bookedIntervals.some((iv) => hour < iv.end && hour + 1 > iv.start);
    if (isBooked) bookedSlots++;
  }
  const availableSlots = totalSlots - bookedSlots;
  const status = bookedSlots === 0 ? "available" : bookedSlots >= totalSlots ? "booked" : "partial";
  return { status, availableSlots, totalSlots };
}

export function registerAvailabilityRoutes(app: Express) {
  // Real-time slot availability for booking form
  app.get("/api/availability", async (req, res) => {
    try {
      const schema = z.object({
        boatId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha: YYYY-MM-DD"),
      });
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const { boatId, date: dateStr } = parsed.data;
      const [y, m, d] = dateStr.split("-").map(Number);
      const requestDate = new Date(y, m - 1, d);

      // Validate boat exists
      const boat = await storage.getBoat(boatId);
      if (!boat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }

      // Off-season check
      if (m < SEASON_START_MONTH || m > SEASON_END_MONTH) {
        return res.json({ availableSlots: [], unavailableSlots: ALL_START_SLOTS.slice() });
      }

      // Fetch active bookings for this boat+date
      const dayBookings = await storage.getDailyBookings(boatId, requestDate);

      // Build list of booked intervals as fractional hours [start, end) in Madrid timezone
      const bookedIntervals = dayBookings.map((b) => {
        const startMadrid = getMadridTime(new Date(b.startTime));
        const endMadrid = getMadridTime(new Date(b.endTime));
        return {
          start: startMadrid.hours + startMadrid.minutes / 60,
          end: endMadrid.hours + endMadrid.minutes / 60,
        };
      });

      const availableSlots: { time: string; maxDuration: number }[] = [];
      const unavailableSlots: string[] = [];

      for (const slot of ALL_START_SLOTS) {
        const slotHour = slotToHours(slot);

        // Check if this slot overlaps with any existing booking
        const isBooked = bookedIntervals.some(
          (interval) => slotHour >= interval.start && slotHour < interval.end
        );

        if (isBooked) {
          unavailableSlots.push(slot);
          continue;
        }

        // Calculate max duration: time until operating end or next booking, whichever is sooner
        let maxEnd = OPERATING_END_HOUR;
        for (const interval of bookedIntervals) {
          if (interval.start > slotHour && interval.start < maxEnd) {
            maxEnd = interval.start;
          }
        }

        const maxDuration = Math.floor(maxEnd - slotHour);
        if (maxDuration < 1) {
          unavailableSlots.push(slot);
        } else {
          availableSlots.push({ time: slot, maxDuration });
        }
      }

      // Cache for 60 seconds to reduce DB load
      res.set("Cache-Control", "public, max-age=60");
      res.json({ availableSlots, unavailableSlots });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Availability] Error fetching slot availability", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get monthly availability for a specific boat
  app.get("/api/boats/:id/availability", async (req, res) => {
    try {
      const { id } = req.params;
      const { month } = req.query; // Expected format: YYYY-MM

      if (!month || typeof month !== "string" || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: "Formato de mes inválido. Use YYYY-MM" });
      }

      const boat = await storage.getBoat(id);
      if (!boat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }

      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr);
      const monthNum = parseInt(monthStr);

      // Validate month range
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "Mes inválido" });
      }

      // Season check
      const isOffSeason = monthNum < SEASON_START_MONTH || monthNum > SEASON_END_MONTH;

      const bookings = await storage.getMonthlyBookings(id, year, monthNum);

      // Group booked intervals by their Madrid calendar date and express them as
      // fractional Madrid hours [start, end). Comparing raw instants against slots built
      // with new Date(y,m,d,hour) used the SERVER timezone (UTC on Replit), shifting the
      // whole grid by the Madrid offset and mislabelling booked/free slots. This mirrors
      // the daily endpoint's Madrid-wall-clock logic.
      const bookedByDate = new Map<string, { start: number; end: number }[]>();
      for (const b of bookings) {
        const s = getMadridDateTime(new Date(b.startTime));
        const e = getMadridDateTime(new Date(b.endTime));
        // If the booking ends on a later Madrid day (crosses midnight, unusual for 09-20h),
        // clamp the end to the close of the start day so it still blocks that day's slots.
        const endHour = e.dateStr === s.dateStr ? e.hours + e.minutes / 60 : OPERATING_END_HOUR;
        const arr = bookedByDate.get(s.dateStr) ?? [];
        arr.push({ start: s.hours + s.minutes / 60, end: endHour });
        bookedByDate.set(s.dateStr, arr);
      }

      // Build day-by-day availability
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const days: Record<string, { status: string; slots: { time: string; available: boolean }[] }> = {};

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const date = new Date(year, monthNum - 1, day);

        if (isOffSeason) {
          days[dateStr] = { status: "off_season", slots: [] };
          continue;
        }

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          days[dateStr] = { status: "past", slots: [] };
          continue;
        }

        // Generate hourly slots from opening to 1 hour before closing
        const dayIntervals = bookedByDate.get(dateStr) ?? [];
        const slots: { time: string; available: boolean }[] = [];
        for (let hour = OPERATING_START_HOUR; hour <= OPERATING_END_HOUR - 1; hour++) {
          const isBooked = dayIntervals.some((iv) => hour < iv.end && hour + 1 > iv.start);
          slots.push({
            time: `${String(hour).padStart(2, "0")}:00`,
            available: !isBooked,
          });
        }

        const { status } = computeDayStatus(dayIntervals);
        days[dateStr] = { status, slots };
      }

      res.json({
        boatId: id,
        month,
        days,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const stack = error instanceof Error ? error.stack : "";
      logger.error("[Availability] Error fetching availability", { error: message, stack });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Fleet-wide day status for every active boat — defaults to today (Spain timezone)
  // if no ?date= is given. Used by the booking wizard's boat-selection step so the
  // customer sees available/partial/booked BEFORE picking a boat, not after.
  app.get("/api/fleet-availability", async (req, res) => {
    try {
      const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha: YYYY-MM-DD").optional();
      const parsed = dateSchema.safeParse(req.query.date);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      let requestDate: Date;
      let dateStr: string;
      if (parsed.data) {
        const [y, m, d] = parsed.data.split("-").map(Number);
        requestDate = new Date(y, m - 1, d);
        dateStr = parsed.data;
      } else {
        const madridDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
        requestDate = new Date(madridDate.getFullYear(), madridDate.getMonth(), madridDate.getDate());
        dateStr = `${requestDate.getFullYear()}-${String(requestDate.getMonth() + 1).padStart(2, "0")}-${String(requestDate.getDate()).padStart(2, "0")}`;
      }

      // Off-season check
      const month = requestDate.getMonth() + 1;
      if (month < SEASON_START_MONTH || month > SEASON_END_MONTH) {
        return res.json({ date: dateStr, boats: {} });
      }

      // Get all active boats
      const allBoats = await storage.getAllBoats();
      const activeBoats = allBoats.filter((b) => b.isActive);

      const boatsAvailability: Record<string, { status: string; availableSlots: number; totalSlots: number }> = {};

      for (const boat of activeBoats) {
        const dayBookings = await storage.getDailyBookings(boat.id, requestDate);

        // Build booked intervals in Madrid timezone
        const bookedIntervals = dayBookings.map((b) => {
          const startMadrid = getMadridTime(new Date(b.startTime));
          const endMadrid = getMadridTime(new Date(b.endTime));
          return {
            start: startMadrid.hours + startMadrid.minutes / 60,
            end: endMadrid.hours + endMadrid.minutes / 60,
          };
        });

        boatsAvailability[boat.id] = computeDayStatus(bookedIntervals);
      }

      // Cache for 5 minutes
      res.set("Cache-Control", "public, max-age=300");
      res.json({ date: dateStr, boats: boatsAvailability });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Availability] Error fetching fleet availability", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Scarcity data for a single boat+date (used by adaptive urgency component)
  app.get("/api/availability/scarcity", async (req, res) => {
    try {
      const schema = z.object({
        boatId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha: YYYY-MM-DD"),
      });
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const { boatId, date: dateStr } = parsed.data;
      const [y, m, d] = dateStr.split("-").map(Number);
      const requestDate = new Date(y, m - 1, d);

      // Validate boat exists
      const boat = await storage.getBoat(boatId);
      if (!boat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }

      // Operating hours: each hour is one slot (9:00-19:00 = 10 slots when end is 20)
      const totalSlots = OPERATING_END_HOUR - OPERATING_START_HOUR;

      // Off-season: all slots available (no urgency)
      if (m < SEASON_START_MONTH || m > SEASON_END_MONTH) {
        return res.json({ remainingSlots: totalSlots, totalSlots, bookedToday: 0 });
      }

      const dayBookings = await storage.getDailyBookings(boatId, requestDate);

      // Count booked hourly slots by checking each hour against booking intervals
      const bookedIntervals = dayBookings.map((b) => {
        const startMadrid = getMadridTime(new Date(b.startTime));
        const endMadrid = getMadridTime(new Date(b.endTime));
        return {
          start: startMadrid.hours + startMadrid.minutes / 60,
          end: endMadrid.hours + endMadrid.minutes / 60,
        };
      });

      let bookedSlotCount = 0;
      for (let hour = OPERATING_START_HOUR; hour < OPERATING_END_HOUR; hour++) {
        const isBooked = bookedIntervals.some(
          (interval) => hour >= interval.start && hour < interval.end
        );
        if (isBooked) bookedSlotCount++;
      }

      const remainingSlots = totalSlots - bookedSlotCount;

      // Cache for 2 minutes
      res.set("Cache-Control", "public, max-age=120");
      res.json({
        remainingSlots,
        totalSlots,
        bookedToday: dayBookings.length,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Availability] Error fetching scarcity data", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // iCal feed for confirmed bookings (protected by token)
  app.get("/api/calendar/feed.ics", async (req, res) => {
    try {
      const { token } = req.query;
      const expectedToken = process.env.ICAL_FEED_TOKEN;

      if (!expectedToken) {
        return res.status(503).json({ message: "iCal feed not configured" });
      }

      if (!token || typeof token !== "string" || token.length !== expectedToken.length ||
          !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
        return res.status(401).json({ message: "Token inválido" });
      }

      const confirmedBookings = await storage.getConfirmedBookings();

      const boats = await storage.getAllBoats();
      const boatMap = new Map(boats.map((b) => [b.id, b.name]));

      // Build iCal content
      let ical = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Costa Brava Rent a Boat//Bookings//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Costa Brava Rent a Boat - Reservas\r\nX-WR-TIMEZONE:Europe/Madrid\r\n`;

      for (const booking of confirmedBookings) {
        // Escape all free-text (RFC 5545) so a name containing CRLF or ; , \ cannot
        // inject extra iCal properties/VEVENTs into the owner's calendar.
        const boatName = escapeICalText(boatMap.get(booking.boatId) || booking.boatId);
        const customerName = escapeICalText(booking.customerName ?? "");
        const customerSurname = escapeICalText(booking.customerSurname ?? "");
        const start = formatICalDate(new Date(booking.startTime));
        const end = formatICalDate(new Date(booking.endTime));
        const created = formatICalDate(new Date(booking.createdAt));
        const uid = `booking-${booking.id}@costabravarentaboat.com`;

        ical += `BEGIN:VEVENT\r\n`;
        ical += `UID:${uid}\r\n`;
        ical += `DTSTART:${start}\r\n`;
        ical += `DTEND:${end}\r\n`;
        ical += `DTSTAMP:${created}\r\n`;
        ical += `SUMMARY:${boatName} - ${customerName} ${customerSurname}\r\n`;
        ical += `DESCRIPTION:Cliente: ${customerName} ${customerSurname}\\nPersonas: ${booking.numberOfPeople}\\nTotal: ${booking.totalAmount}€\r\n`;
        ical += `LOCATION:Puerto de Blanes\\, Girona\\, Spain\r\n`;
        ical += `STATUS:CONFIRMED\r\n`;
        ical += `END:VEVENT\r\n`;
      }

      ical += `END:VCALENDAR\r\n`;

      res.set("Content-Type", "text/calendar; charset=utf-8");
      res.set("Content-Disposition", "attachment; filename=bookings.ics");
      res.send(ical);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Availability] Error generating iCal feed", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}

// RFC 5545 text escaping: backslash, semicolon, comma, and newlines.
function escapeICalText(value: string): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

function formatICalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}
