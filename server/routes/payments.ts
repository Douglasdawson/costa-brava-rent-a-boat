import type { Express } from "express";
import express from "express";
import Stripe from "stripe";
import { z } from "zod";
import { storage } from "../storage";
import { db } from "../db";
import { bookings, giftCards } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendBookingConfirmation } from "../services/emailService";
import type { Booking, Boat } from "@shared/schema";
import { requireAdminSession } from "./auth";
import { logger } from "../lib/logger";

type WaLang = "es" | "en" | "fr" | "de" | "nl" | "it" | "ru";

const WA_CONFIRMATION: Record<WaLang, {
  greeting: string; confirmed: string; boat: string; date: string;
  time: string; duration: string; meetingPoint: string; arrive: string;
  questions: string;
}> = {
  es: { greeting: "Hola", confirmed: "Tu reserva ha sido confirmada.", boat: "Barco", date: "Fecha", time: "Hora de salida", duration: "Duracion", meetingPoint: "Punto de encuentro: Puerto de Blanes.", arrive: "Llega 15 minutos antes de la hora de salida.", questions: "Ante cualquier duda" },
  en: { greeting: "Hello", confirmed: "Your booking has been confirmed.", boat: "Boat", date: "Date", time: "Departure time", duration: "Duration", meetingPoint: "Meeting point: Port of Blanes.", arrive: "Please arrive 15 minutes before departure.", questions: "For any questions" },
  fr: { greeting: "Bonjour", confirmed: "Votre réservation a été confirmée.", boat: "Bateau", date: "Date", time: "Heure de départ", duration: "Durée", meetingPoint: "Point de rendez-vous : Port de Blanes.", arrive: "Veuillez arriver 15 minutes avant le départ.", questions: "Pour toute question" },
  de: { greeting: "Hallo", confirmed: "Ihre Buchung wurde bestätigt.", boat: "Boot", date: "Datum", time: "Abfahrtszeit", duration: "Dauer", meetingPoint: "Treffpunkt: Hafen von Blanes.", arrive: "Bitte erscheinen Sie 15 Minuten vor der Abfahrt.", questions: "Bei Fragen" },
  nl: { greeting: "Hallo", confirmed: "Uw boeking is bevestigd.", boat: "Boot", date: "Datum", time: "Vertrektijd", duration: "Duur", meetingPoint: "Ontmoetingspunt: Haven van Blanes.", arrive: "Kom 15 minuten voor vertrek.", questions: "Voor vragen" },
  it: { greeting: "Ciao", confirmed: "La sua prenotazione è stata confermata.", boat: "Barca", date: "Data", time: "Ora di partenza", duration: "Durata", meetingPoint: "Punto di incontro: Porto di Blanes.", arrive: "Si presenti 15 minuti prima della partenza.", questions: "Per qualsiasi domanda" },
  ru: { greeting: "Здравствуйте", confirmed: "Ваше бронирование подтверждено.", boat: "Лодка", date: "Дата", time: "Время отправления", duration: "Длительность", meetingPoint: "Место встречи: порт Бланеса.", arrive: "Прибудьте за 15 минут до отправления.", questions: "По вопросам" },
};

async function trySendWhatsAppConfirmation(booking: Booking, boat: Boat): Promise<void> {
  try {
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../whatsapp/twilioClient");
    if (!isTwilioConfigured() || !booking.customerPhone) return;

    const lang = (booking.language || "es") as WaLang;
    const wa = WA_CONFIRMATION[lang] || WA_CONFIRMATION.es;

    const localeMap: Record<WaLang, string> = {
      es: "es-ES", en: "en-GB", fr: "fr-FR", de: "de-DE",
      nl: "nl-NL", it: "it-IT", ru: "ru-RU",
    };
    const locale = localeMap[lang] || "es-ES";

    const date = booking.startTime.toLocaleDateString(locale, {
      weekday: "long", day: "numeric", month: "long",
      timeZone: "Europe/Madrid",
    });
    const time = booking.startTime.toLocaleTimeString(locale, {
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Madrid",
    });

    const message = [
      `${wa.greeting} ${booking.customerName}! ${wa.confirmed}`,
      ``,
      `${wa.boat}: ${boat.name}`,
      `${wa.date}: ${date}`,
      `${wa.time}: ${time}`,
      `${wa.duration}: ${booking.totalHours}h`,
      ``,
      wa.meetingPoint,
      wa.arrive,
      ``,
      `${wa.questions}: +34 611 500 372`,
      `Costa Brava Rent a Boat`,
    ].join("\n");

    await sendWhatsAppMessage(booking.customerPhone, message);
    await storage.updateBookingWhatsAppStatus(booking.id, true, undefined);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error(`[Payment] WhatsApp confirmation error for booking ${booking.id}`, { error: msg });
  }
}

const createPaymentIntentSchema = z.object({
  holdId: z.string().optional(),
  bookingId: z.string().optional(),
}).refine(data => data.holdId || data.bookingId, {
  message: "holdId o bookingId es requerido",
});

const createCheckoutSessionSchema = z.object({
  bookingId: z.string().min(1, "Booking ID es requerido"),
});

const mockPaymentIntentSchema = z.object({
  holdId: z.string().min(1, "ID de hold requerido"),
});

const simulatePaymentSchema = z.object({
  paymentIntentId: z.string().min(1, "PaymentIntent ID requerido"),
});

// Deduplicate webhook events — track processed event IDs for 24h
const processedEvents = new Map<string, number>();
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  processedEvents.forEach((ts, id) => {
    if (ts < cutoff) processedEvents.delete(id);
  });
}, 60 * 60 * 1000);

// Initialize Stripe lazily
let stripe: Stripe | null = null;
export const getStripe = () => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    if (!secretKey.startsWith("sk_")) {
      throw new Error("Invalid Stripe secret key: must start with sk_");
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
    });
  }
  return stripe;
};

export function registerPaymentRoutes(app: Express) {
  // Create payment intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      let stripeInstance: Stripe;
      try {
        stripeInstance = getStripe();
      } catch (error: unknown) {
        logger.error("[Payments] Stripe not configured", { error: error instanceof Error ? error.message : String(error) });
        return res.status(503).json({
          message: "Servicio de pagos no disponible",
          success: false,
        });
      }

      const parsed = createPaymentIntentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { holdId, bookingId } = parsed.data;
      const targetId = (holdId || bookingId) as string;

      const hold = await storage.getBookingById(targetId);
      if (!hold) {
        return res.status(404).json({
          message: "Hold/Booking no encontrado",
          success: false,
        });
      }

      if (holdId && hold.bookingStatus !== "hold") {
        return res.status(400).json({
          message: "El hold ya no está disponible",
          success: false,
          status: hold.bookingStatus,
        });
      }

      if (hold.expiresAt && new Date() > hold.expiresAt) {
        return res.status(410).json({
          message: "El hold ha expirado",
          success: false,
        });
      }

      // Charge only service amount (subtotal + extras) via Stripe.
      // Deposit is collected in cash at the port — not charged online.
      const depositAmount = parseFloat(hold.deposit || "0");
      const serviceAmount = parseFloat(hold.totalAmount) - depositAmount;
      if (serviceAmount <= 0) {
        return res.status(400).json({ message: "Invalid booking amount" });
      }

      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(serviceAmount * 100),
        currency: "eur",
        metadata: {
          holdId: hold.id,
          sessionId: hold.sessionId || "",
          boatId: hold.boatId,
          bookingDate: hold.bookingDate.toISOString(),
          startTime: hold.startTime.toISOString(),
          endTime: hold.endTime.toISOString(),
          numberOfPeople: hold.numberOfPeople.toString(),
          depositAmount: depositAmount.toString(),
          depositCollectionMethod: "cash_on_site",
        },
        description: `Reserva de barco ${hold.boatId} - ${hold.bookingDate.toISOString().split("T")[0]}`,
      });

      await storage.updateBooking(hold.id, {
        bookingStatus: "pending_payment",
        paymentStatus: "pending",
        stripePaymentIntentId: paymentIntent.id,
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: serviceAmount,
        currency: "eur",
      });
    } catch (error: unknown) {
      logger.error("[Payments] Error creating payment intent", { error: error instanceof Error ? error.message : error });
      res.status(500).json({
        message: "Error interno del servidor",
        success: false,
      });
    }
  });

  // Create checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripeInstance = getStripe();

      const parsed = createCheckoutSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { bookingId } = parsed.data;

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Deposit collected in cash on site — only charge service amount via Stripe
      const depositAmt = parseFloat(booking.deposit || "0");
      const serviceAmt = parseFloat(booking.totalAmount) - depositAmt;
      if (serviceAmt <= 0) {
        return res.status(400).json({ message: "Invalid booking amount" });
      }

      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `Reserva de barco - ${booking.boatId}`,
                description: `Reserva para ${booking.customerName} ${booking.customerSurname} el ${booking.bookingDate.toISOString().split("T")[0]}. Depósito ${depositAmt}€ a pagar en efectivo en el puerto.`,
              },
              unit_amount: Math.round(serviceAmt * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL || 'https://costabravarentaboat.com'}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        cancel_url: `${process.env.APP_URL || 'https://costabravarentaboat.com'}/booking?step=6&booking_id=${bookingId}`,
        metadata: {
          bookingId: bookingId,
        },
      });

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: unknown) {
      logger.error("[Payments] Error creating checkout session", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Mock payment intent (development only)
  app.post("/api/create-payment-intent-mock", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({
        message: "Endpoint no disponible en producción",
        success: false,
      });
    }

    try {
      const parsed = mockPaymentIntentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { holdId } = parsed.data;

      const hold = await storage.getBookingById(holdId);
      if (!hold) {
        return res.status(404).json({ message: "Hold no encontrado", success: false });
      }

      if (hold.bookingStatus !== "hold") {
        return res.status(400).json({
          message: "El hold ya no está disponible",
          success: false,
          status: hold.bookingStatus,
        });
      }

      if (hold.expiresAt && new Date() > hold.expiresAt) {
        return res.status(410).json({ message: "El hold ha expirado", success: false });
      }

      const mockPaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      await storage.updateBooking(hold.id, {
        bookingStatus: "pending_payment",
        paymentStatus: "pending",
        stripePaymentIntentId: mockPaymentIntentId,
      });

      res.json({
        success: true,
        clientSecret: `${mockPaymentIntentId}_secret_mock`,
        paymentIntentId: mockPaymentIntentId,
        amount: Number(hold.totalAmount),
        currency: "eur",
        mockMode: true,
        note: "This is a mock payment for testing. Use /api/simulate-payment-success to complete the payment.",
      });
    } catch (error: unknown) {
      logger.error("[Payments] Error creating mock payment intent", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        message: "Error interno del servidor",
        success: false,
      });
    }
  });

  // Simulate payment success (development only)
  app.post("/api/simulate-payment-success", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({
        message: "Endpoint no disponible en producción",
        success: false,
      });
    }

    try {
      const parsed = simulatePaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { paymentIntentId } = parsed.data;

      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.stripePaymentIntentId, paymentIntentId))
        .limit(1);

      if (booking.length === 0) {
        return res.status(404).json({
          message: "Reserva no encontrada para este PaymentIntent",
          success: false,
        });
      }

      const confirmedBooking = await storage.updateBooking(booking[0].id, {
        bookingStatus: "confirmed",
        paymentStatus: "completed",
      });

      // Send confirmation email + WhatsApp
      if (confirmedBooking) {
        const boat = await storage.getBoat(confirmedBooking.boatId);
        if (boat) {
          const extras = await storage.getBookingExtras(confirmedBooking.id);
          if (confirmedBooking.customerEmail) {
            sendBookingConfirmation({ booking: confirmedBooking, boat, extras }).catch(
              (err: unknown) => logger.error("[SimulatePayment] Error sending confirmation email", { error: err instanceof Error ? err.message : String(err) })
            );
          }
          trySendWhatsAppConfirmation(confirmedBooking, boat).catch(() => {});
        }

        // Decrement extras inventory stock (fire-and-forget)
        storage.decrementExtrasStock(confirmedBooking.id).catch((err: unknown) => {
          logger.error(`[Payments] Failed to decrement extras stock for booking ${confirmedBooking.id}`, { error: err instanceof Error ? err.message : String(err) });
        });
      }

      res.json({
        success: true,
        message: "Pago simulado exitosamente",
        bookingId: booking[0].id,
        status: "confirmed",
      });
    } catch (error: unknown) {
      logger.error("[Payments] Error simulating payment", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        message: "Error interno del servidor",
        success: false,
      });
    }
  });

  // Stripe webhook
  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    let stripeInstance: Stripe;
    try {
      stripeInstance = getStripe();
    } catch (error: unknown) {
      logger.error("Stripe not configured for webhook", { error: error instanceof Error ? error.message : String(error) });
      return res.status(503).json({ error: "Payment service not configured" });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured — rejecting webhook");
      return res.status(503).json({ error: "Webhook not configured" });
    }

    let event: Stripe.Event;
    try {
      event = stripeInstance.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("[Webhook] Signature verification failed", { error: errMsg });
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // Idempotency: skip already-processed events
    if (processedEvents.has(event.id)) {
      return res.json({ received: true });
    }
    processedEvents.set(event.id, Date.now());

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logger.info("Payment succeeded", { paymentIntentId: paymentIntent.id });

          // Check if this is a gift card payment
          if (paymentIntent.metadata?.type === "gift_card" && paymentIntent.metadata?.giftCardId) {
            const giftCardId = paymentIntent.metadata.giftCardId;
            await storage.updateGiftCard(giftCardId, {
              paymentStatus: "completed",
              status: "active",
            });
            logger.info("Gift card activated after successful payment", { giftCardId });
            break;
          }

          // Otherwise, it's a booking payment
          const booking = await db
            .select()
            .from(bookings)
            .where(eq(bookings.stripePaymentIntentId, paymentIntent.id))
            .limit(1);

          if (booking.length > 0) {
            const confirmedBooking = await storage.updateBooking(booking[0].id, {
              bookingStatus: "confirmed",
              paymentStatus: "completed",
            });
            logger.info("Booking confirmed after successful payment", { bookingId: booking[0].id });

            // Send confirmation email + WhatsApp (fire-and-forget, never blocks webhook response)
            if (confirmedBooking) {
              const boat = await storage.getBoat(confirmedBooking.boatId);
              if (boat) {
                const extras = await storage.getBookingExtras(confirmedBooking.id);
                if (confirmedBooking.customerEmail) {
                  sendBookingConfirmation({ booking: confirmedBooking, boat, extras }).catch(
                    (err: unknown) => logger.error("[Payment] Error sending confirmation email", { error: err instanceof Error ? err.message : String(err) })
                  );
                }
                trySendWhatsAppConfirmation(confirmedBooking, boat).catch(() => {});
              }

              // Decrement extras inventory stock (fire-and-forget)
              storage.decrementExtrasStock(confirmedBooking.id).catch((err: unknown) => {
                logger.error(`[Payments] Failed to decrement extras stock for booking ${confirmedBooking.id}`, { error: err instanceof Error ? err.message : String(err) });
              });
            }
          } else {
            logger.warn(`No booking found for payment intent ${paymentIntent.id}`);
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          logger.warn("Payment failed", { paymentIntentId: failedPayment.id });

          const failedBooking = await db
            .select()
            .from(bookings)
            .where(eq(bookings.stripePaymentIntentId, failedPayment.id))
            .limit(1);

          if (failedBooking.length > 0) {
            await storage.updateBooking(failedBooking[0].id, {
              paymentStatus: "failed",
            });
            logger.warn("Payment failed for booking", { bookingId: failedBooking[0].id });
          }
          break;
        }

        default:
          logger.debug("Unhandled webhook event type", { eventType: event.type });
      }

      res.json({ received: true });
    } catch (error: unknown) {
      logger.error("Error processing webhook", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Issue a Stripe refund for a confirmed booking (admin only)
  app.post("/api/admin/bookings/:id/refund", requireAdminSession, async (req, res) => {
    try {
      let stripeInstance: Stripe;
      try {
        stripeInstance = getStripe();
      } catch (error: unknown) {
        logger.error("[Payments] Stripe not configured for refund", { error: error instanceof Error ? error.message : String(error) });
        return res.status(503).json({ message: "Servicio de pagos no disponible" });
      }

      const refundSchema = z.object({
        amount: z.number().positive("El importe debe ser positivo"),
        reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
      });

      const parsed = refundSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }
      if (!booking.stripePaymentIntentId) {
        return res.status(400).json({ message: "Esta reserva no tiene pago Stripe asociado" });
      }
      if (booking.refundStatus === "completed") {
        return res.status(409).json({ message: "Esta reserva ya ha sido reembolsada" });
      }

      const { amount, reason } = parsed.data;
      const maxRefundable = parseFloat(booking.totalAmount) - parseFloat(booking.deposit || "0");
      if (amount > maxRefundable) {
        return res.status(400).json({
          message: `El importe máximo reembolsable es ${maxRefundable}€ (sin depósito)`,
        });
      }

      await db.update(bookings).set({ refundStatus: "processing" }).where(eq(bookings.id, booking.id));

      const refund = await stripeInstance.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
        amount: Math.round(amount * 100),
        reason: reason || "requested_by_customer",
      });

      await db.update(bookings).set({
        refundStatus: "completed",
        refundAmount: amount.toString(),
        paymentStatus: "refunded",
        bookingStatus: "cancelled",
      }).where(eq(bookings.id, booking.id));

      logger.info("Refund issued for booking", { refundId: refund.id, amount, bookingId: booking.id });
      res.json({
        success: true,
        refundId: refund.id,
        amount,
        bookingId: booking.id,
      });
    } catch (error: unknown) {
      await db.update(bookings).set({ refundStatus: "requested" }).where(eq(bookings.id, req.params.id)).catch(() => {});
      logger.error("[Payments] Refund error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
