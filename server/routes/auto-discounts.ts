import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { logger } from "../lib/logger";
import { calculateAutoDiscount } from "@shared/discounts";

const checkDiscountSchema = z.object({
  boatId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  price: z.coerce.number().positive(),
});

/**
 * Get today's date in YYYY-MM-DD format using Spain timezone.
 */
function getTodaySpain(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function registerAutoDiscountRoutes(app: Express) {
  app.get("/api/auto-discount/check", async (req, res) => {
    try {
      const parsed = checkDiscountSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const { boatId, date, price } = parsed.data;

      // Validate boat exists
      const boat = await storage.getBoat(boatId);
      if (!boat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }

      // Count existing bookings for this boat on the given date
      const [y, m, d] = date.split("-").map(Number);
      const requestDate = new Date(y, m - 1, d);
      const dayBookings = await storage.getDailyBookings(boatId, requestDate);

      const today = getTodaySpain();

      const result = calculateAutoDiscount({
        bookingDate: date,
        today,
        basePrice: price,
        existingBookingsForDate: dayBookings.length,
      });

      // Cache briefly to reduce load on repeated checks
      res.set("Cache-Control", "public, max-age=30");
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[AutoDiscount] Error checking discount", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
