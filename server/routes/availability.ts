import type { Express } from "express";
import { storage } from "../storage";

export function registerAvailabilityRoutes(app: Express) {
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

      // Season: April (4) - October (10)
      const isOffSeason = monthNum < 4 || monthNum > 10;

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

        // Generate hourly slots from 09:00 to 18:00
        const slots: { time: string; available: boolean }[] = [];
        let bookedSlots = 0;
        const totalSlots = 10; // 09:00 to 18:00 (one slot per hour)

        for (let hour = 9; hour <= 18; hour++) {
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
      res.status(500).json({ message: "Error fetching availability: " + message });
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

      const allBookings = await storage.getAllBookings();
      const confirmedBookings = allBookings.filter(
        (b) => b.bookingStatus === "confirmed"
      );

      const boats = await storage.getAllBoats();
      const boatMap = new Map(boats.map((b) => [b.id, b.name]));

      // Build iCal content
      let ical = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Costa Brava Rent a Boat//Bookings//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Costa Brava Rent a Boat - Reservas\r\nX-WR-TIMEZONE:Europe/Madrid\r\n`;

      for (const booking of confirmedBookings) {
        const boatName = boatMap.get(booking.boatId) || booking.boatId;
        const start = formatICalDate(new Date(booking.startTime));
        const end = formatICalDate(new Date(booking.endTime));
        const created = formatICalDate(new Date(booking.createdAt));
        const uid = `booking-${booking.id}@costabravarentaboat.app`;

        ical += `BEGIN:VEVENT\r\n`;
        ical += `UID:${uid}\r\n`;
        ical += `DTSTART:${start}\r\n`;
        ical += `DTEND:${end}\r\n`;
        ical += `DTSTAMP:${created}\r\n`;
        ical += `SUMMARY:${boatName} - ${booking.customerName} ${booking.customerSurname}\r\n`;
        ical += `DESCRIPTION:Cliente: ${booking.customerName} ${booking.customerSurname}\\nTel: ${booking.customerPhone}\\nPersonas: ${booking.numberOfPeople}\\nTotal: ${booking.totalAmount}€\r\n`;
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
      res.status(500).json({ message: "Error generating iCal feed: " + message });
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
