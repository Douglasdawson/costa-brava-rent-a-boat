import type { Express } from "express";
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
        const slots: { time: string; available: boolean }[] = [];
        let bookedSlots = 0;
        const totalSlots = OPERATING_END_HOUR - OPERATING_START_HOUR; // one slot per hour

        for (let hour = OPERATING_START_HOUR; hour <= OPERATING_END_HOUR - 1; hour++) {
          const slotStart = new Date(year, monthNum - 1, day, hour, 0, 0);
          const slotEnd = new Date(year, monthNum - 1, day, hour + 1, 0, 0);

          const isBooked = bookings.some((booking) => {
            const bStart = new Date(booking.startTime);
            const bEnd = new Date(booking.endTime);
            return bStart < slotEnd && bEnd > slotStart;
          });

          slots.push({
            time: `${String(hour).padStart(2, "0")}:00`,
            available: !isBooked,
          });

          if (isBooked) bookedSlots++;
        }

        let status: string;
        if (bookedSlots === 0) {
          status = "available";
        } else if (bookedSlots >= totalSlots) {
          status = "booked";
        } else {
          status = "partial";
        }

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

  // Fleet-wide scarcity data for the next Saturday (used by boat cards)
  app.get("/api/fleet-availability", async (req, res) => {
    try {
      // Find next Saturday (in Spain timezone)
      const now = new Date();
      const madridDate = new Date(
        now.toLocaleString("en-US", { timeZone: "Europe/Madrid" })
      );
      const dayOfWeek = madridDate.getDay(); // 0=Sun, 6=Sat
      const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
      const nextSaturday = new Date(madridDate);
      nextSaturday.setDate(madridDate.getDate() + daysUntilSaturday);
      nextSaturday.setHours(0, 0, 0, 0);

      const dateStr = `${nextSaturday.getFullYear()}-${String(nextSaturday.getMonth() + 1).padStart(2, "0")}-${String(nextSaturday.getDate()).padStart(2, "0")}`;

      // Off-season check
      const month = nextSaturday.getMonth() + 1;
      if (month < SEASON_START_MONTH || month > SEASON_END_MONTH) {
        return res.json({ date: dateStr, boats: {} });
      }

      // Get all active boats
      const allBoats = await storage.getAllBoats();
      const activeBoats = allBoats.filter((b) => b.isActive);

      const boatsAvailability: Record<string, { availableSlots: number; totalSlots: number }> = {};

      for (const boat of activeBoats) {
        const dayBookings = await storage.getDailyBookings(boat.id, nextSaturday);

        // Build booked intervals in Madrid timezone
        const bookedIntervals = dayBookings.map((b) => {
          const startMadrid = getMadridTime(new Date(b.startTime));
          const endMadrid = getMadridTime(new Date(b.endTime));
          return {
            start: startMadrid.hours + startMadrid.minutes / 60,
            end: endMadrid.hours + endMadrid.minutes / 60,
          };
        });

        // Count available start slots (reuse same logic as /api/availability)
        let availableCount = 0;
        for (const slot of ALL_START_SLOTS) {
          const slotHour = slotToHours(slot);
          const isBooked = bookedIntervals.some(
            (interval) => slotHour >= interval.start && slotHour < interval.end
          );
          if (!isBooked) {
            // Check there's at least 1 hour of availability
            let maxEnd = OPERATING_END_HOUR;
            for (const interval of bookedIntervals) {
              if (interval.start > slotHour && interval.start < maxEnd) {
                maxEnd = interval.start;
              }
            }
            if (Math.floor(maxEnd - slotHour) >= 1) {
              availableCount++;
            }
          }
        }

        boatsAvailability[boat.id] = {
          availableSlots: availableCount,
          totalSlots: ALL_START_SLOTS.length,
        };
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

      if (!token || token !== expectedToken) {
        return res.status(401).json({ message: "Token inválido" });
      }

      const confirmedBookings = await storage.getConfirmedBookings();

      const boats = await storage.getAllBoats();
      const boatMap = new Map(boats.map((b) => [b.id, b.name]));

      // Build iCal content
      let ical = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Costa Brava Rent a Boat//Bookings//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Costa Brava Rent a Boat - Reservas\r\nX-WR-TIMEZONE:Europe/Madrid\r\n`;

      for (const booking of confirmedBookings) {
        const boatName = boatMap.get(booking.boatId) || booking.boatId;
        const start = formatICalDate(new Date(booking.startTime));
        const end = formatICalDate(new Date(booking.endTime));
        const created = formatICalDate(new Date(booking.createdAt));
        const uid = `booking-${booking.id}@costabravarentaboat.com`;

        ical += `BEGIN:VEVENT\r\n`;
        ical += `UID:${uid}\r\n`;
        ical += `DTSTART:${start}\r\n`;
        ical += `DTEND:${end}\r\n`;
        ical += `DTSTAMP:${created}\r\n`;
        ical += `SUMMARY:${boatName} - ${booking.customerName} ${booking.customerSurname}\r\n`;
        ical += `DESCRIPTION:Cliente: ${booking.customerName} ${booking.customerSurname}\\nPersonas: ${booking.numberOfPeople}\\nTotal: ${booking.totalAmount}€\r\n`;
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

function formatICalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}
