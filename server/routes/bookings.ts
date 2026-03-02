import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAdminSession } from "./auth";
import { sendCancelationEmail } from "../services";

const isoDateString = z
  .string()
  .min(1)
  .refine((val) => !isNaN(Date.parse(val)), { message: "Fecha/hora inválida (formato ISO requerido)" });

const quoteSchema = z.object({
  boatId: z.string().min(1, "boatId es requerido").max(64, "boatId demasiado largo"),
  startTime: isoDateString,
  endTime: isoDateString,
  numberOfPeople: z.number().int().min(1, "Minimo 1 persona").max(20, "Maximo 20 personas"),
  extras: z.array(z.string().max(64)).max(10).optional(),
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

function getMadridHour(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  return parseInt(parts.find((p) => p.type === "hour")!.value);
}

export function registerBookingRoutes(app: Express) {
  // Get bookings by date (admin only) — must be registered before :id to avoid "date" matching as an ID
  app.get("/api/bookings/date/:date", requireAdminSession, async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const bookingsList = await storage.getBookingsByDate(date);
      res.json(bookingsList);
    } catch (error: unknown) {
      console.error("[Bookings] Error fetching bookings by date:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Public cancel info endpoint — no auth required, uses token
  app.get("/api/bookings/cancel-info/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!token || !uuidRegex.test(token)) {
        return res.status(400).json({ message: "Token inválido" });
      }

      const booking = await storage.getBookingByCancelationToken(token);
      if (!booking) {
        return res.status(404).json({ message: "Reserva no encontrada o token inválido" });
      }

      if (booking.bookingStatus === 'cancelled') {
        return res.status(410).json({ message: "Esta reserva ya ha sido cancelada" });
      }

      if (!['confirmed', 'pending_payment'].includes(booking.bookingStatus)) {
        return res.status(422).json({ message: "Esta reserva no puede cancelarse en su estado actual" });
      }

      const hoursUntilStart = (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
      let refundPercentage = 0;
      if (hoursUntilStart >= 48) refundPercentage = 100;
      else if (hoursUntilStart >= 24) refundPercentage = 50;

      const totalAmount = parseFloat(booking.totalAmount);
      let refundAmount = 0;
      if (refundPercentage === 100) refundAmount = totalAmount;
      else if (refundPercentage === 50) refundAmount = Math.round(totalAmount * 0.5 * 100) / 100;

      const boat = await storage.getBoat(booking.boatId);

      res.json({
        booking: {
          id: booking.id,
          customerName: booking.customerName,
          customerSurname: booking.customerSurname,
          startTime: booking.startTime,
          endTime: booking.endTime,
          totalAmount: booking.totalAmount,
          bookingStatus: booking.bookingStatus,
          boatName: boat?.name ?? "Embarcación desconocida",
          language: booking.language,
        },
        refundPolicy: {
          hoursUntilStart: Math.max(0, hoursUntilStart),
          refundPercentage,
          refundAmount,
        },
      });
    } catch (error: unknown) {
      console.error("[Bookings] Error fetching cancel info:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Public cancel endpoint — no auth required, uses token
  app.post("/api/bookings/cancel/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!token || !uuidRegex.test(token)) {
        return res.status(400).json({ message: "Token inválido" });
      }

      const result = await storage.cancelBookingByToken(token);
      if (!result) {
        return res.status(404).json({ message: "Reserva no encontrada, ya cancelada, o no cancelable" });
      }

      const { booking, refundAmount, refundPercentage } = result;

      // Fire-and-forget email (don't block response)
      sendCancelationEmail({ booking, refundAmount, refundPercentage }).catch((err: unknown) => {
        console.error("[Bookings] Error sending cancelation email:", err instanceof Error ? err.message : String(err));
      });

      res.json({
        success: true,
        refundAmount,
        refundPercentage,
        message: refundAmount > 0
          ? `Reserva cancelada. Reembolso de ${refundAmount.toFixed(2)}EUR (${refundPercentage}%) en proceso.`
          : "Reserva cancelada. No aplica reembolso según la política de cancelación.",
      });
    } catch (error: unknown) {
      console.error("[Bookings] Error cancelling booking:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error al cancelar la reserva" });
    }
  });

  // Get booking by ID (admin only)
  app.get("/api/bookings/:id", requireAdminSession, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const extras = await storage.getBookingExtras(booking.id);
      res.json({ ...booking, extras });
    } catch (error: unknown) {
      console.error("[Bookings] Error fetching booking:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error interno del servidor" });
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

      // Validate operating hours 09:00-20:00 Spain time
      const startHour = getMadridHour(start);
      const endHour = getMadridHour(end);
      if (startHour < 9) {
        return res.status(400).json({
          message: "El horario de salida mínimo es las 09:00 (hora de España)",
          available: false,
          reason: "before_opening",
        });
      }
      if (endHour > 20 || (endHour === 20 && end.getMinutes() > 0)) {
        return res.status(400).json({
          message: "El horario máximo de regreso es las 20:00 (hora de España)",
          available: false,
          reason: "after_closing",
        });
      }

      const { isOperationalSeason, calculatePricingBreakdown, getMinimumDuration } = await import("@shared/pricing");
      if (!isOperationalSeason(start) || !isOperationalSeason(end)) {
        return res.status(400).json({
          available: false,
          reason: "out_of_season",
          message: "Las reservas solo están disponibles de abril a octubre",
        });
      }

      // Validate minimum duration (2h in Temporada Alta and weekends)
      const totalRequestedHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const minDuration = getMinimumDuration(start);
      const minHours = parseInt(minDuration);
      if (totalRequestedHours < minHours) {
        const isAugust = start.getMonth() + 1 === 8;
        const reason = isAugust ? "temporada alta" : "fines de semana";
        return res.status(400).json({
          available: false,
          reason: "below_minimum_duration",
          message: `La duración mínima en ${reason} es de ${minHours} horas`,
          minimumDuration: minDuration,
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
    } catch (error: unknown) {
      console.error("[Bookings] Error generating quote:", error instanceof Error ? error.message : String(error));
      res.status(500).json({
        message: "Error al generar cotización",
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
    } catch (error: unknown) {
      console.error("[Bookings] Error cleaning expired holds:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error al limpiar holds expirados" });
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
    } catch (error: unknown) {
      console.error("[Bookings] Error updating payment status:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error interno del servidor" });
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
    } catch (error: unknown) {
      console.error("[Bookings] Error updating WhatsApp status:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
