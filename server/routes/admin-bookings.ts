import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { updateBookingSchema, insertBookingSchema } from "@shared/schema";
import { requireAdminSession, requireTabAccess } from "./auth";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";
import { sendGA4Event } from "../lib/analyticsServer";

// CRM-created/confirmed bookings were analytics-blind (May 2026: 28 real
// bookings, 0 GA4 events). booking_confirmed is its own event — NOT
// booking_request_submitted, which means "customer asked" rather than
// "team confirmed". Fire-and-forget; sendGA4Event never throws.
function trackBookingConfirmed(booking: { id: string; boatId: string; totalAmount?: string | null }): void {
  void sendGA4Event("booking_confirmed", {
    currency: "EUR",
    value: booking.totalAmount ? Number(booking.totalAmount) : undefined,
    booking_id: booking.id,
    boat_id: booking.boatId,
    source: "crm",
  });
}

const calendarBookingsQuerySchema = z.object({
  startDate: z.coerce.date({ required_error: "startDate es requerido" }),
  endDate: z.coerce.date({ required_error: "endDate es requerido" }),
  boatId: z.string().optional(),
});

const paginatedBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["startTime", "createdAt", "bookingDate", "customerName", "boatId", "totalAmount", "bookingStatus"]).optional().default("startTime"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export function registerAdminBookingRoutes(app: Express) {
  // ===== BOOKING MANAGEMENT =====

  // Create a new booking manually (from CRM)
  app.post("/api/admin/bookings", requireAdminSession, requireTabAccess("bookings"), async (req, res) => {
    try {
      const bookingData = {
        ...req.body,
        source: "admin",
      };

      const validationResult = insertBookingSchema.safeParse(bookingData);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const newBooking = await storage.createBooking(validationResult.data);

      if (newBooking.bookingStatus === "confirmed") {
        trackBookingConfirmed(newBooking);
      }

      res.status(201).json({
        success: true,
        booking: newBooking,
        message: "Reserva creada exitosamente",
      });
    } catch (error: unknown) {
      logger.error("[Admin] Error creating booking", { error: error instanceof Error ? error.message : error });
      // Turn the two common DB failures into actionable messages instead of a
      // generic 500 (the CRM toast shows error.message verbatim). Postgres error
      // codes via the @neondatabase/serverless driver.
      const pgCode = (error as { code?: string })?.code;
      if (pgCode === "23P01") {
        // Exclusion constraint no_overlapping_bookings
        return res.status(409).json({
          message: "Ya hay una reserva que se solapa con ese horario para ese barco. Elige otra hora.",
        });
      }
      if (pgCode === "23503") {
        // Foreign key violation on boat_id (boat not in the active fleet)
        return res.status(400).json({
          message: "El barco de esta petición no está en la flota; selecciona otro barco.",
        });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Calendar bookings: all bookings in a date range (no pagination)
  app.get("/api/admin/bookings/calendar", requireAdminSession, requireTabAccess("bookings"), async (req, res) => {
    try {
      const queryParsed = calendarBookingsQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Parametros invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const { startDate, endDate, boatId } = queryParsed.data;

      const calendarBookings = await storage.getBookingsForCalendar({
        startDate,
        endDate,
        boatId,
      });

      res.json(calendarBookings);
    } catch (error: unknown) {
      logger.error("[Admin] Error fetching calendar bookings", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/bookings", requireAdminSession, requireTabAccess("bookings"), async (req, res) => {
    try {
      const queryParsed = paginatedBookingsQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Parametros invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const { page, limit, status, search, sortBy, sortOrder } = queryParsed.data;

      const result = await storage.getPaginatedBookings({
        page,
        limit,
        status,
        search,
        sortBy,
        sortOrder,
      });

      res.json(result);
    } catch (error: unknown) {
      logger.error("[Admin] Error fetching bookings", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.patch("/api/admin/bookings/:id", requireAdminSession, requireTabAccess("bookings"), async (req, res) => {
    try {
      const existingBooking = await storage.getBooking(req.params.id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      const validationResult = updateBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const validatedUpdates = validationResult.data;
      const updates: any = {};

      if (validatedUpdates.customerName !== undefined) updates.customerName = validatedUpdates.customerName;
      if (validatedUpdates.customerSurname !== undefined) updates.customerSurname = validatedUpdates.customerSurname;
      if (validatedUpdates.customerPhone !== undefined) updates.customerPhone = validatedUpdates.customerPhone;
      if (validatedUpdates.customerEmail !== undefined) updates.customerEmail = validatedUpdates.customerEmail;
      if (validatedUpdates.customerNationality !== undefined) updates.customerNationality = validatedUpdates.customerNationality;
      if (validatedUpdates.numberOfPeople !== undefined) updates.numberOfPeople = validatedUpdates.numberOfPeople;
      if (validatedUpdates.boatId !== undefined) updates.boatId = validatedUpdates.boatId;
      if (validatedUpdates.startTime !== undefined) updates.startTime = validatedUpdates.startTime;
      if (validatedUpdates.endTime !== undefined) updates.endTime = validatedUpdates.endTime;
      if (validatedUpdates.totalHours !== undefined) updates.totalHours = validatedUpdates.totalHours;
      if (validatedUpdates.subtotal !== undefined) updates.subtotal = validatedUpdates.subtotal.toString();
      if (validatedUpdates.extrasTotal !== undefined) updates.extrasTotal = validatedUpdates.extrasTotal.toString();
      if (validatedUpdates.deposit !== undefined) updates.deposit = validatedUpdates.deposit.toString();
      if (validatedUpdates.totalAmount !== undefined) updates.totalAmount = validatedUpdates.totalAmount.toString();
      if (validatedUpdates.bookingStatus !== undefined) updates.bookingStatus = validatedUpdates.bookingStatus;
      if (validatedUpdates.paymentStatus !== undefined) updates.paymentStatus = validatedUpdates.paymentStatus;
      if (validatedUpdates.notes !== undefined) updates.notes = validatedUpdates.notes;

      const updatedBooking = await storage.updateBooking(req.params.id, updates);

      if (!updatedBooking) {
        return res.status(500).json({ message: "Error actualizando la reserva" });
      }

      if (validatedUpdates.bookingStatus === "cancelled") {
        audit(req, "cancel", "booking", req.params.id, { previousStatus: existingBooking.bookingStatus });
      }

      // Fire only on the TRANSITION into confirmed (editing an already-
      // confirmed booking must not double-count the conversion).
      if (
        validatedUpdates.bookingStatus === "confirmed" &&
        existingBooking.bookingStatus !== "confirmed"
      ) {
        trackBookingConfirmed(updatedBooking);
      }

      res.json({
        success: true,
        booking: updatedBooking,
        message: "Reserva actualizada exitosamente",
      });
    } catch (error: unknown) {
      logger.error("[Admin] Error updating booking", { error: error instanceof Error ? error.message : error });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
