import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { storage } from "../storage";
import { isJetSkiProduct, getJetSkiProduct } from "@shared/jetskiProducts";
import type { InsertBooking } from "@shared/schema";
import { logger } from "../lib/logger";

// Jet ski requests are resold partner leads. They are logged as inquiries via
// /api/booking-inquiries (CRM → Inquiries) AND, through this endpoint, mirrored
// as a "requested" booking (CRM → Bookings) so the team manages them in the same
// place as boat requests. They never occupy availability/calendar slots: the
// "requested" status is excluded from the active-bookings overlap checks, and the
// time is a placeholder the team confirms with the partner.

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta de nuevo mas tarde." },
});

const schema = z.object({
  boatId: z.string().min(1).max(64),
  slotId: z.string().min(1).max(32),
  bookingDate: z.string().max(40).optional().nullable(), // YYYY-MM-DD, "" or "Flexible"
  numberOfPeople: z.coerce.number().int().min(1).max(2),
  firstName: z.string().min(1).max(120),
  lastName: z.string().max(120).optional().nullable(),
  phonePrefix: z.string().max(8),
  phoneNumber: z.string().min(3).max(32),
  email: z.string().max(160).optional().nullable(),
  language: z.string().max(5).optional(),
  website: z.string().optional(), // honeypot
});

/** Build a placeholder start Date (noon) from a YYYY-MM-DD; tomorrow if absent. */
function resolveStartDate(dateStr?: string | null): Date {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(`${dateStr}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(12, 0, 0, 0);
  return t;
}

export function registerJetskiRoutes(app: Express) {
  // Mirror a jet ski request into the bookings table as a "requested" lead.
  // Best-effort companion to /api/booking-inquiries (which the client also calls).
  app.post("/api/jetski-booking", limiter, async (req, res) => {
    try {
      if (req.body.website) return res.json({ success: true }); // honeypot

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const d = parsed.data;

      if (!isJetSkiProduct(d.boatId)) {
        return res.status(400).json({ message: "Producto no valido" });
      }
      const product = getJetSkiProduct(d.boatId)!;
      const slot = product.slots.find((s) => s.id === d.slotId) ?? product.slots[0];
      // Per-person price for slots that have it (15-min circuit: 65€/1, 80€/2).
      const price = d.numberOfPeople >= 2 && slot.price2 ? slot.price2 : slot.price;

      const startTime = resolveStartDate(d.bookingDate);
      const endTime = new Date(startTime.getTime() + Math.max(slot.minutes, 30) * 60 * 1000);
      const totalHours = Math.max(1, Math.ceil(slot.minutes / 60));

      const booking = await storage.createBooking({
        boatId: d.boatId,
        bookingDate: startTime,
        startTime,
        endTime,
        customerName: d.firstName.trim(),
        customerSurname: (d.lastName || "-").trim() || "-",
        customerPhone: `${d.phonePrefix}${d.phoneNumber}`.trim(),
        customerEmail: d.email?.trim() || undefined,
        customerNationality: "No indicado",
        numberOfPeople: d.numberOfPeople,
        totalHours,
        subtotal: String(price),
        extrasTotal: "0",
        deposit: "0",
        totalAmount: String(price),
        // "requested" matches how boat leads appear in the Bookings list and is
        // excluded from availability/overlap checks. Cast: the column is free
        // text but the insert schema enum doesn't list it (same as bookings.ts).
        bookingStatus: "requested" as unknown as InsertBooking["bookingStatus"],
        paymentStatus: "pending",
        // Free-text column; the insert schema enum doesn't list it (cast as above).
        source: "jetski" as unknown as InsertBooking["source"],
        language: d.language || "es",
      });

      res.status(201).json({ success: true, id: booking.id });
    } catch (error: unknown) {
      logger.error("[Jetski] Error creating booking", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
