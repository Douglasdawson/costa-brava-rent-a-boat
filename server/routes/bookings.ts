import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAdminSession } from "./auth";

const quoteSchema = z.object({
  boatId: z.string().min(1, "boatId es requerido"),
  startTime: z.string().min(1, "startTime es requerido"),
  endTime: z.string().min(1, "endTime es requerido"),
  numberOfPeople: z.number().int().min(1, "Minimo 1 persona").max(20, "Maximo 20 personas"),
  extras: z.array(z.string()).optional(),
});

const paymentStatusSchema = z.object({
  status: z.enum(["pending", "paid", "failed", "cancelled", "refunded"], {
    errorMap: () => ({ message: "Estado de pago invalido" }),
  }),
  stripePaymentIntentId: z.string().optional(),
});

const whatsappStatusSchema = z.object({
  confirmationSent: z.boolean().optional(),
  reminderSent: z.boolean().optional(),
});

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
      const parsed = quoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          available: false,
          reason: "missing_fields",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { boatId, startTime, endTime, numberOfPeople, extras } = parsed.data;

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

  // Clean up expired holds (admin only) - also runs automatically every 5 min via scheduler
  app.post("/api/cleanup-expired-holds", requireAdminSession, async (req, res) => {
    try {
      const cleaned = await storage.cleanupExpiredHolds();
      res.json({
        message: cleaned > 0
          ? `Se limpiaron ${cleaned} holds expirados`
          : "No hay holds expirados para limpiar",
        cleaned,
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Error al limpiar holds expirados: " + error.message,
      });
    }
  });

  // Update booking payment status (admin only)
  app.post("/api/bookings/:id/payment-status", requireAdminSession, async (req, res) => {
    try {
      const parsed = paymentStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { status, stripePaymentIntentId } = parsed.data;

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

  // Update WhatsApp status (admin only)
  app.post("/api/bookings/:id/whatsapp-status", requireAdminSession, async (req, res) => {
    try {
      const parsed = whatsappStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { confirmationSent, reminderSent } = parsed.data;

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
