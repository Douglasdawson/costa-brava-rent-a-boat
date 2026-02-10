import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { bookings } from "@shared/schema";
import { and, eq, lte } from "drizzle-orm";

export function registerBookingRoutes(app: Express) {
  // Get booking by ID
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const extras = await storage.getBookingExtras(booking.id);
      res.json({ ...booking, extras });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching booking: " + error.message });
    }
  });

  // Get bookings by date
  app.get("/api/bookings/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const bookingsList = await storage.getBookingsByDate(date);
      res.json(bookingsList);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching bookings: " + error.message });
    }
  });

  // Quote endpoint - Calculate pricing and create temporary hold
  app.post("/api/quote", async (req, res) => {
    try {
      const { boatId, startTime, endTime, numberOfPeople, extras } = req.body;

      if (!boatId || !startTime || !endTime || !numberOfPeople) {
        return res.status(400).json({
          message: "Faltan campos obligatorios: boatId, startTime, endTime, numberOfPeople",
          available: false,
          reason: "missing_fields",
        });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return res.status(400).json({
          message: "La hora de inicio debe ser anterior a la hora de fin",
          available: false,
          reason: "invalid_time_range",
        });
      }

      const { isOperationalSeason, calculatePricingBreakdown } = await import("@shared/pricing");
      if (!isOperationalSeason(start) || !isOperationalSeason(end)) {
        return res.status(400).json({
          available: false,
          reason: "out_of_season",
          message: "Las reservas solo están disponibles de abril a octubre",
        });
      }

      const boat = await storage.getBoat(boatId);
      if (!boat) {
        return res.status(404).json({
          message: "Barco no encontrado",
          available: false,
          reason: "boat_not_found",
        });
      }

      if (numberOfPeople > boat.capacity) {
        return res.status(400).json({
          message: `Número de personas (${numberOfPeople}) excede la capacidad del barco (${boat.capacity})`,
          available: false,
          reason: "capacity_exceeded",
        });
      }

      const isAvailable = await storage.checkAvailability(boatId, start, end);
      if (!isAvailable) {
        const conflictingBookings = await storage.getOverlappingBookingsWithBuffer(boatId, start, end);
        return res.status(409).json({
          message: "El barco no está disponible en el horario seleccionado",
          available: false,
          reason: "booking_conflict",
          conflictingBookings: conflictingBookings.map(booking => ({
            id: booking.id,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.bookingStatus,
            customerName: `${booking.customerName} ${booking.customerSurname ? booking.customerSurname.charAt(0) : ""}.`,
          })),
        });
      }

      const totalHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));

      let duration: "1h" | "2h" | "3h" | "4h" | "6h" | "8h";
      if (totalHours <= 1) duration = "1h";
      else if (totalHours <= 2) duration = "2h";
      else if (totalHours <= 3) duration = "3h";
      else if (totalHours <= 4) duration = "4h";
      else if (totalHours <= 6) duration = "6h";
      else duration = "8h";

      const pricingBreakdown = calculatePricingBreakdown(boatId, start, duration, extras || []);

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const sessionId =
        (req.headers["x-session-id"] as string) ||
        `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const holdBooking = await storage.createBooking({
        boatId,
        bookingDate: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
        startTime: start,
        endTime: end,
        customerName: "Hold Temporal",
        customerSurname: "Sistema",
        customerPhone: "N/A",
        customerNationality: "N/A",
        numberOfPeople,
        totalHours,
        subtotal: pricingBreakdown.basePrice.toString(),
        extrasTotal: pricingBreakdown.extrasPrice.toString(),
        deposit: pricingBreakdown.deposit.toString(),
        totalAmount: pricingBreakdown.total.toString(),
        bookingStatus: "hold",
        paymentStatus: "pending",
        sessionId,
        expiresAt,
        source: "web",
        notes: `Hold temporal para cotización. Expira: ${expiresAt.toISOString()}`,
      });

      res.status(201).json({
        success: true,
        holdId: holdBooking.id,
        quote: {
          startTime,
          endTime,
          totalHours,
          numberOfPeople,
          ...pricingBreakdown,
        },
        hold: {
          id: holdBooking.id,
          sessionId,
          expiresAt,
          expiresInMinutes: 30,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Error al generar cotización: " + error.message,
        available: false,
        reason: "server_error",
      });
    }
  });

  // Clean up expired holds
  app.post("/api/cleanup-expired-holds", async (req, res) => {
    try {
      const now = new Date();

      const expiredHolds = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.bookingStatus, "hold"), lte(bookings.expiresAt!, now)));

      if (expiredHolds.length === 0) {
        return res.json({
          message: "No hay holds expirados para limpiar",
          cleaned: 0,
        });
      }

      const expiredIds = expiredHolds.map(hold => hold.id);
      await db
        .delete(bookings)
        .where(and(eq(bookings.bookingStatus, "hold"), lte(bookings.expiresAt!, now)));

      res.json({
        message: `Se limpiaron ${expiredHolds.length} holds expirados`,
        cleaned: expiredHolds.length,
        expiredIds,
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Error al limpiar holds expirados: " + error.message,
      });
    }
  });

  // Update booking payment status
  app.post("/api/bookings/:id/payment-status", async (req, res) => {
    try {
      const { status, stripePaymentIntentId } = req.body;
      const validStatuses = ["pending", "paid", "failed", "cancelled", "refunded"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid payment status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const updatedBooking = await storage.updateBookingPaymentStatus(
        req.params.id,
        status,
        stripePaymentIntentId
      );

      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(updatedBooking);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating payment status: " + error.message });
    }
  });

  // Update WhatsApp status
  app.post("/api/bookings/:id/whatsapp-status", async (req, res) => {
    try {
      const { confirmationSent, reminderSent } = req.body;

      const updatedBooking = await storage.updateBookingWhatsAppStatus(
        req.params.id,
        confirmationSent,
        reminderSent
      );

      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(updatedBooking);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating WhatsApp status: " + error.message });
    }
  });
}
