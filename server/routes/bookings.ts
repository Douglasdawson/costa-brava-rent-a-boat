import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { db } from "../db";
import { bookings } from "@shared/schema";
import { eq, and, gte, sql, ne } from "drizzle-orm";
import { requireAdminSession } from "./auth";
import { sendCancelationEmail } from "../services";
import { sendBookingRequestReceived, sendBookingRequestAdminNotification } from "../services/emailService";
import { getStripe } from "./payments";
import { logger } from "../lib/logger";
import { validatePromoCode, calculateDiscountAmount } from "../lib/discountValidation";
import { OPERATING_START_HOUR, OPERATING_END_HOUR } from "@shared/constants";

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
  discountCode: z.string().max(30).optional(),
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
  // Popular choices for a boat (last 30 days) — used by smart defaults in booking flow
  app.get("/api/boats/:id/popular-choices", async (req, res) => {
    try {
      const boatId = req.params.id;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const rows = await db
        .select({
          startHour: sql<string>`to_char(${bookings.startTime} AT TIME ZONE 'Europe/Madrid', 'HH24:00')`,
          totalHours: bookings.totalHours,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.boatId, boatId),
            gte(bookings.startTime, thirtyDaysAgo),
            ne(bookings.bookingStatus, "hold"),
            ne(bookings.bookingStatus, "cancelled"),
          ),
        );

      if (rows.length === 0) {
        return res.json({ popularTime: "10:00", popularDuration: "2h", sampleSize: 0 });
      }

      // Find most frequent start hour
      const timeCounts: Record<string, number> = {};
      for (const row of rows) {
        const t = row.startHour;
        timeCounts[t] = (timeCounts[t] || 0) + 1;
      }
      let popularTime = "10:00";
      let maxTimeCount = 0;
      for (const time of Object.keys(timeCounts)) {
        if (timeCounts[time] > maxTimeCount) {
          maxTimeCount = timeCounts[time];
          popularTime = time;
        }
      }

      // Find most frequent duration
      const durationCounts: Record<string, number> = {};
      for (const row of rows) {
        const d = `${row.totalHours}h`;
        durationCounts[d] = (durationCounts[d] || 0) + 1;
      }
      let popularDuration = "2h";
      let maxDurCount = 0;
      for (const dur of Object.keys(durationCounts)) {
        if (durationCounts[dur] > maxDurCount) {
          maxDurCount = durationCounts[dur];
          popularDuration = dur;
        }
      }

      res.json({ popularTime, popularDuration, sampleSize: rows.length });
    } catch (error: unknown) {
      logger.error("[Bookings] Error fetching popular choices", { error: error instanceof Error ? error.message : String(error) });
      res.json({ popularTime: "10:00", popularDuration: "2h", sampleSize: 0 });
    }
  });

  // Get bookings by date (admin only) — must be registered before :id to avoid "date" matching as an ID
  app.get("/api/bookings/date/:date", requireAdminSession, async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const bookingsList = await storage.getBookingsByDate(date);
      res.json(bookingsList);
    } catch (error: unknown) {
      logger.error("[Bookings] Error fetching bookings by date", { error: error instanceof Error ? error.message : String(error) });
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
      logger.error("[Bookings] Error fetching cancel info", { error: error instanceof Error ? error.message : String(error) });
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

      // Process Stripe refund if applicable
      if (refundAmount > 0 && booking.stripePaymentIntentId) {
        // Skip mock payment intents (dev/test) — they have no real Stripe charge
        const isMockPayment = booking.stripePaymentIntentId.startsWith("pi_mock_");

        if (!isMockPayment) {
          try {
            const stripeInstance = getStripe();

            // The deposit is collected in cash, so cap the Stripe refund
            // at whatever was actually charged online (total minus deposit)
            const depositAmount = parseFloat(booking.deposit || "0");
            const maxStripeRefundable = parseFloat(booking.totalAmount) - depositAmount;
            const stripeRefundAmount = Math.min(refundAmount, maxStripeRefundable);

            if (stripeRefundAmount > 0) {
              await db.update(bookings)
                .set({ refundStatus: "processing" })
                .where(eq(bookings.id, booking.id));

              const refund = await stripeInstance.refunds.create({
                payment_intent: booking.stripePaymentIntentId,
                amount: Math.round(stripeRefundAmount * 100),
                reason: "requested_by_customer",
              });

              await db.update(bookings)
                .set({ refundStatus: "completed", paymentStatus: "refunded" })
                .where(eq(bookings.id, booking.id));

              logger.info("Stripe refund issued for cancelled booking", {
                bookingId: booking.id,
                refundId: refund.id,
                refundAmount: stripeRefundAmount,
              });
            } else {
              // Refund amount doesn't exceed deposit — nothing to refund via Stripe
              await db.update(bookings)
                .set({ refundStatus: "completed" })
                .where(eq(bookings.id, booking.id));
            }
          } catch (stripeError: unknown) {
            const errorMsg = stripeError instanceof Error ? stripeError.message : String(stripeError);
            logger.error("Stripe refund failed for cancelled booking", {
              bookingId: booking.id,
              paymentIntentId: booking.stripePaymentIntentId,
              refundAmount,
              error: errorMsg,
            });

            // Mark as failed so admin can retry manually via the admin refund endpoint
            await db.update(bookings)
              .set({ refundStatus: "failed" })
              .where(eq(bookings.id, booking.id))
              .catch(() => {});
          }
        } else {
          // Mock payment — mark refund as completed immediately
          await db.update(bookings)
            .set({ refundStatus: "completed" })
            .where(eq(bookings.id, booking.id));
        }
      }

      // Fire-and-forget email (don't block response)
      sendCancelationEmail({ booking, refundAmount, refundPercentage }).catch((err: unknown) => {
        logger.error("[Bookings] Error sending cancelation email", { error: err instanceof Error ? err.message : String(err) });
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
      logger.error("[Bookings] Error cancelling booking", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error al cancelar la reserva" });
    }
  });

  // ─── Submit Reservation Request (no online payment) ───────────────────
  // Promotes a hold to a "requested" booking. Sends customer a confirmation
  // email ("we received your request") and Ivan an admin notification with
  // contact info so he can reach out to coordinate payment in person.
  // Replaces the obsolete mock-payment flow which 404'd in production.
  app.post("/api/bookings/submit-request", async (req, res) => {
    try {
      const schema = z.object({
        holdId: z.string().min(1, "holdId es requerido"),
        termsAccepted: z.boolean().refine(v => v === true, {
          message: "Debes aceptar los términos y condiciones",
        }),
        // Customer info — the hold was created with placeholder data
        // ("Hold Temporal"/"Sistema"/"N/A") because /api/quote doesn't accept
        // customer info. Fill in the real values now so the email and admin
        // notification have proper data.
        customerName: z.string().min(1, "Nombre requerido").max(80),
        customerSurname: z.string().min(1, "Apellidos requeridos").max(80),
        customerEmail: z.string().email("Email inválido").max(160),
        customerPhone: z.string().min(4).max(40),
        customerNationality: z.string().min(1).max(40),
        language: z.string().min(2).max(5).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { holdId } = parsed.data;
      const hold = await storage.getBookingById(holdId);
      if (!hold) {
        return res.status(404).json({ success: false, message: "Solicitud no encontrada" });
      }

      // Allow re-submission if already requested (idempotent on client retries)
      // but reject if already confirmed/cancelled — those are terminal states.
      if (["confirmed", "cancelled", "completed"].includes(hold.bookingStatus)) {
        return res.status(409).json({
          success: false,
          message: `La reserva ya está en estado "${hold.bookingStatus}"`,
          status: hold.bookingStatus,
        });
      }

      if (hold.expiresAt && new Date() > hold.expiresAt) {
        return res.status(410).json({
          success: false,
          message: "La cotización ha expirado. Vuelve a empezar.",
        });
      }

      // Promote hold → requested AND persist real customer data (replacing
      // the "Hold Temporal" placeholders that /api/quote stamped).
      const updated = await storage.updateBooking(hold.id, {
        bookingStatus: "requested",
        paymentStatus: "pending",
        customerName: parsed.data.customerName,
        customerSurname: parsed.data.customerSurname,
        customerEmail: parsed.data.customerEmail,
        customerPhone: parsed.data.customerPhone,
        customerNationality: parsed.data.customerNationality,
        ...(parsed.data.language ? { language: parsed.data.language } : {}),
      });

      if (!updated) {
        return res.status(500).json({ success: false, message: "No se pudo actualizar la reserva" });
      }

      // Fire customer + admin emails fire-and-forget (best-effort; the primary
      // notification channel is the customer-initiated WhatsApp opened on the
      // client side — see useBookingFlowActions.ts).
      const boat = await storage.getBoat(updated.boatId);
      const extras = await storage.getBookingExtras(updated.id);
      if (boat) {
        const emailData = { booking: updated, boat, extras };
        sendBookingRequestReceived(emailData).catch(err =>
          logger.error("[Bookings] Customer request email failed", { error: err instanceof Error ? err.message : String(err) }));
        sendBookingRequestAdminNotification(emailData).catch(err =>
          logger.error("[Bookings] Admin request email failed", { error: err instanceof Error ? err.message : String(err) }));
      } else {
        logger.warn("[Bookings] Boat not found, skipping request emails", { boatId: updated.boatId });
      }

      logger.info("[Bookings] Reservation request submitted", {
        bookingId: updated.id,
        boatId: updated.boatId,
        customerEmail: updated.customerEmail,
      });

      return res.json({
        success: true,
        bookingId: updated.id,
        status: "requested",
        message: "Solicitud recibida. Te contactaremos en menos de 24h.",
      });
    } catch (error: unknown) {
      logger.error("[Bookings] Error submitting reservation request", {
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
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
      logger.error("[Bookings] Error fetching booking", { error: error instanceof Error ? error.message : String(error) });
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

      const { boatId, startTime, endTime, numberOfPeople, extras, discountCode } = parsed.data;

      const start = new Date(startTime);
      const end = new Date(endTime);

      // Prevent bookings in the past
      if (start < new Date()) {
        return res.status(400).json({
          message: "No se puede reservar en una fecha pasada",
          available: false,
          reason: "past_date",
        });
      }

      if (start >= end) {
        return res.status(400).json({
          message: "La hora de inicio debe ser anterior a la hora de fin",
          available: false,
          reason: "invalid_time_range",
        });
      }

      // Validate operating hours (Spain time)
      const startHour = getMadridHour(start);
      const endHour = getMadridHour(end);
      if (startHour < OPERATING_START_HOUR) {
        return res.status(400).json({
          message: `El horario de salida mínimo es las ${String(OPERATING_START_HOUR).padStart(2, "0")}:00 (hora de España)`,
          available: false,
          reason: "before_opening",
        });
      }
      if (endHour > OPERATING_END_HOUR || (endHour === OPERATING_END_HOUR && end.getMinutes() > 0)) {
        return res.status(400).json({
          message: `El horario máximo de regreso es las ${String(OPERATING_END_HOUR).padStart(2, "0")}:00 (hora de España)`,
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

      const totalHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));

      let duration: "1h" | "2h" | "3h" | "4h" | "6h" | "8h";
      if (totalHours <= 1) duration = "1h";
      else if (totalHours <= 2) duration = "2h";
      else if (totalHours <= 3) duration = "3h";
      else if (totalHours <= 4) duration = "4h";
      else if (totalHours <= 6) duration = "6h";
      else duration = "8h";

      const pricingBreakdown = calculatePricingBreakdown(boatId, start, duration, extras || []);

      // Server-side discount/gift card validation
      let discountInfo: {
        type: "discount" | "gift_card";
        code: string;
        discountPercent?: number;
        giftCardAmount?: number;
        discountAmount: number;
      } | null = null;

      if (discountCode) {
        const promo = await validatePromoCode(discountCode);
        if (!promo.valid) {
          return res.status(400).json({
            available: false,
            reason: "invalid_discount_code",
            message: promo.error || "Codigo de descuento no valido",
          });
        }

        const discountAmount = calculateDiscountAmount(
          promo,
          pricingBreakdown.basePrice,
          pricingBreakdown.total,
        );

        discountInfo = {
          type: promo.type!,
          code: promo.code!,
          discountPercent: promo.discountPercent,
          giftCardAmount: promo.remainingAmount,
          discountAmount,
        };
      }

      // Apply discount to total if validated
      const finalTotal = discountInfo
        ? Math.max(0, pricingBreakdown.total - discountInfo.discountAmount)
        : pricingBreakdown.total;

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const sessionId =
        (req.headers["x-session-id"] as string) ||
        `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Atomic check + create to prevent TOCTOU race condition
      const result = await storage.checkAvailabilityAndCreateBooking(boatId, start, end, {
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
        totalAmount: finalTotal.toString(),
        couponCode: discountInfo?.code || null,
        bookingStatus: "hold",
        paymentStatus: "pending",
        sessionId,
        expiresAt,
        source: "web",
        notes: `Hold temporal para cotización. Expira: ${expiresAt.toISOString()}`,
      });

      if (!result.available) {
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

      const holdBooking = result.booking;

      res.status(201).json({
        success: true,
        holdId: holdBooking.id,
        quote: {
          startTime,
          endTime,
          totalHours,
          numberOfPeople,
          ...pricingBreakdown,
          // Override total with discount-adjusted amount
          total: finalTotal,
          ...(discountInfo ? {
            discount: {
              type: discountInfo.type,
              code: discountInfo.code,
              discountPercent: discountInfo.discountPercent,
              giftCardAmount: discountInfo.giftCardAmount,
              discountAmount: discountInfo.discountAmount,
            },
          } : {}),
        },
        hold: {
          id: holdBooking.id,
          sessionId,
          expiresAt,
          expiresInMinutes: 30,
        },
      });
    } catch (error: unknown) {
      logger.error("[Bookings] Error generating quote", { error: error instanceof Error ? error.message : String(error) });
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
      logger.error("[Bookings] Error cleaning expired holds", { error: error instanceof Error ? error.message : String(error) });
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
      logger.error("[Bookings] Error updating payment status", { error: error instanceof Error ? error.message : String(error) });
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
      logger.error("[Bookings] Error updating WhatsApp status", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
