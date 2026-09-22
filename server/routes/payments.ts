import type { Express } from "express";
import express from "express";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import { createHash, timingSafeEqual } from "crypto";
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
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../messaging/twilioClient");
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

// CRM DAMAR asks for a señal payment link with this contract (see lib/crmSenal.ts).
// dateLabel is the CRM's canonical DD/MM/YYYY, passed through as display text.
const crmSenalLinkSchema = z.object({
  rentalId: z.number().int().positive(),
  amountCents: z.number().int().min(100).max(500000),
  boatName: z.string().min(1).max(80),
  dateLabel: z.string().min(1).max(20),
  lang: z.enum(["es", "en"]),
  clientName: z.string().min(1).max(80),
  clientEmail: z.string().email().max(120).optional().or(z.literal("")),
  previousLinkId: z.string().regex(/^plink_/).max(80).optional(),
  siblingLinkId: z.string().regex(/^plink_/).max(80).optional(),
});

const crmSenalDeactivateSchema = z.object({
  linkIds: z.array(z.string().regex(/^plink_/).max(80)).min(1).max(4),
});

const crmSenalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Intenta de nuevo en unos minutos." },
});

// Constant-time comparison over digests so length differences leak nothing.
const sha256 = (value: string) => createHash("sha256").update(value).digest();
const safeKeyEquals = (a: string, b: string) => timingSafeEqual(sha256(a), sha256(b));

// Deduplicate webhook events — track processed event IDs for 24h
const processedEvents = new Map<string, number>();
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  processedEvents.forEach((ts, id) => {
    if (ts < cutoff) processedEvents.delete(id);
  });
}, 60 * 60 * 1000).unref();

// Initialize Stripe lazily
let stripe: Stripe | null = null;
export const getStripe = () => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    // Accepts standard secret keys (sk_) and restricted keys (rk_). Restricted
    // keys are what Stripe recommends for server integrations, and the shop only
    // needs Checkout scopes. Still rejects a pasted publishable key (pk_).
    if (!secretKey.startsWith("sk_") && !secretKey.startsWith("rk_")) {
      throw new Error("Invalid Stripe secret key: must start with sk_ or rk_");
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
    });
  }
  return stripe;
};

export function registerPaymentRoutes(app: Express) {
  // El pago con tarjeta de una RESERVA de barco no existe, y es a proposito.
  //
  // Aqui vivian cuatro handlers publicos y sin autenticacion —create-payment-intent,
  // create-checkout-session, su gemelo -mock y simulate-payment-success— que
  // creaban PaymentIntents y Checkout Sessions reales para una reserva. No los
  // llamaba NADIE desde client/ (el wizard acaba en /api/booking-inquiries, o sea
  // en WhatsApp) y contradecian la regla del CLAUDE.md de este repo: la web capta
  // solicitudes y el cobro es en persona, en el pantalan.
  //
  // Se borraron el 22-sep-2026 tras comprobarlo en produccion: de 74 reservas,
  // UNA tenia stripePaymentIntentId —ya resuelta—, cero holds vivos y cero pagos
  // pendientes. Ademas arrastraban un bug latente: revalidaban el cupon con
  // validatePromoCode(hold.couponCode) SIN contexto, y como el hold se crea con
  // customerPhone: "N/A" (server/routes/bookings.ts, /api/quote no persiste el
  // telefono), cualquier codigo ligado a un telefono —los de alumno de la escuela
  // nautica— habria fallado con phone_mismatch justo al pagar.
  //
  // Si algun dia se activa el pago online de la senal, hay que reintroducirlo
  // pasando el telefono y el barco a validatePromoCode, y persistir el telefono
  // real en el hold: sin eso, los codigos personales se rompen en el ultimo paso.
  //
  // Lo que SIGUE vivo en este fichero: el webhook (gift cards y la senal del CRM
  // DAMAR), los dos endpoints de senal del CRM y el refund de admin. La tienda
  // cobra por su propio flujo, /api/shop/*.
  // CRM DAMAR: mint a single-use señal payment link for a rental. Server-to-server
  // only, authenticated with the CRM_API_KEY the two apps already share (the CRM
  // resolves it via getCrmApiKey). Listed in the CSRF skip-list: no browser cookie
  // is involved, so Origin/Referer checks do not apply.
  app.post("/api/crm/senal-link", crmSenalLimiter, async (req, res) => {
    const configuredKey = process.env.CRM_API_KEY;
    const providedKey = req.headers["x-api-key"];
    if (!configuredKey || typeof providedKey !== "string" || !safeKeyEquals(providedKey, configuredKey)) {
      return res.status(401).json({ message: "No autorizado" });
    }

    let stripeInstance: Stripe;
    try {
      stripeInstance = getStripe();
    } catch (error: unknown) {
      logger.error("[CrmSenal] Stripe not configured", { error: error instanceof Error ? error.message : String(error) });
      return res.status(503).json({ message: "Servicio de pagos no disponible" });
    }

    const parsed = crmSenalLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Datos invalidos",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const { createSenalPaymentLink } = await import("../lib/crmSenal");
      const { linkId, url } = await createSenalPaymentLink(stripeInstance, {
        ...parsed.data,
        clientEmail: parsed.data.clientEmail || undefined,
      });
      res.json({ linkId, url });
    } catch (error: unknown) {
      logger.error("[CrmSenal] Error creating payment link", {
        rentalId: parsed.data.rentalId,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(502).json({ message: "No se pudo crear el link de pago en Stripe" });
    }
  });

  // CRM DAMAR: kill switch de links de señal (al borrar una pre-reserva o vencer el
  // plazo). Anula el link Y expira sus sesiones de pago abiertas, para que nadie pueda
  // pagar una franja que ya no se vende (un cobro reembolsado pierde la comisión).
  app.post("/api/crm/senal-link/deactivate", crmSenalLimiter, async (req, res) => {
    const configuredKey = process.env.CRM_API_KEY;
    const providedKey = req.headers["x-api-key"];
    if (!configuredKey || typeof providedKey !== "string" || !safeKeyEquals(providedKey, configuredKey)) {
      return res.status(401).json({ message: "No autorizado" });
    }

    let stripeInstance: Stripe;
    try {
      stripeInstance = getStripe();
    } catch (error: unknown) {
      logger.error("[CrmSenal] Stripe not configured", { error: error instanceof Error ? error.message : String(error) });
      return res.status(503).json({ message: "Servicio de pagos no disponible" });
    }

    const parsed = crmSenalDeactivateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
    }

    const { deactivateSenalLink } = await import("../lib/crmSenal");
    for (const linkId of parsed.data.linkIds) {
      await deactivateSenalLink(stripeInstance, linkId);
    }
    res.json({ success: true, deactivated: parsed.data.linkIds.length });
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

    // Idempotency: skip already-processed events. The event is only marked as
    // processed AFTER the handler completes successfully (see below), so a handler
    // that throws returns 500 and Stripe safely retries the same event.id.
    if (processedEvents.has(event.id)) {
      return res.json({ received: true });
    }

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

        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          logger.info("Checkout session completed", { sessionId: session.id });

          // Merch shop orders are finalized in their own module
          if (session.metadata?.type === "shop_order") {
            const { handleShopCheckoutCompleted } = await import("./shop");
            await handleShopCheckoutCompleted(session);
            break;
          }

          // Señal cobrada desde el CRM DAMAR (payment link): records into rentals_real
          if (session.metadata?.type === "crm_senal") {
            const { handleCrmSenalPaid } = await import("../lib/crmSenal");
            await handleCrmSenalPaid(session, stripeInstance);
            break;
          }

          const bookingId = session.metadata?.bookingId;
          if (!bookingId) {
            logger.debug("Checkout session has no bookingId metadata, skipping", { sessionId: session.id });
            break;
          }

          // Look up booking by ID (checkout sessions store their ID in stripePaymentIntentId)
          const csBooking = await storage.getBooking(bookingId);
          if (!csBooking) {
            logger.warn("No booking found for checkout session", { sessionId: session.id, bookingId });
            break;
          }

          // Update the stripePaymentIntentId to the actual PaymentIntent for refund support
          const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

          const confirmedCsBooking = await storage.updateBooking(csBooking.id, {
            bookingStatus: "confirmed",
            paymentStatus: "completed",
            ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
          });
          logger.info("Booking confirmed via checkout session", { bookingId: csBooking.id, sessionId: session.id });

          // Send confirmation email + WhatsApp (fire-and-forget)
          if (confirmedCsBooking) {
            const csBoat = await storage.getBoat(confirmedCsBooking.boatId);
            if (csBoat) {
              const csExtras = await storage.getBookingExtras(confirmedCsBooking.id);
              if (confirmedCsBooking.customerEmail) {
                sendBookingConfirmation({ booking: confirmedCsBooking, boat: csBoat, extras: csExtras }).catch(
                  (err: unknown) => logger.error("[Payment] Error sending confirmation email for checkout session", { error: err instanceof Error ? err.message : String(err) })
                );
              }
              trySendWhatsAppConfirmation(confirmedCsBooking, csBoat).catch(() => {});
            }

            storage.decrementExtrasStock(confirmedCsBooking.id).catch((err: unknown) => {
              logger.error(`[Payments] Failed to decrement extras stock for booking ${confirmedCsBooking.id}`, { error: err instanceof Error ? err.message : String(err) });
            });
          }
          break;
        }

        case "checkout.session.expired": {
          const expiredSession = event.data.object as Stripe.Checkout.Session;
          if (expiredSession.metadata?.type === "shop_order") {
            const { handleShopCheckoutExpired } = await import("./shop");
            await handleShopCheckoutExpired(expiredSession);
          }
          break;
        }

        // Async payment methods (e.g. bank debits) complete the session before the
        // money exists; handleCrmSenalPaid ignores unpaid sessions, and this event
        // routes the confirmation back once payment_status is "paid".
        case "checkout.session.async_payment_succeeded": {
          const asyncSession = event.data.object as Stripe.Checkout.Session;
          if (asyncSession.metadata?.type === "crm_senal") {
            const { handleCrmSenalPaid } = await import("../lib/crmSenal");
            await handleCrmSenalPaid(asyncSession, stripeInstance);
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

      // Only now, after the handler succeeded, mark the event as processed so a
      // failed handler (500) is retried by Stripe instead of being swallowed.
      if (processedEvents.size < 10000) {
        processedEvents.set(event.id, Date.now());
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
      // Guard against double refunds: reject if a refund is already completed or in flight.
      if (booking.refundStatus === "completed" || booking.refundStatus === "processing") {
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

      // Idempotency key ties the Stripe refund to this booking: even if the call is
      // retried (network blip, redeploy, admin double-click), Stripe returns the same
      // refund instead of creating a second one.
      const refund = await stripeInstance.refunds.create(
        {
          payment_intent: booking.stripePaymentIntentId,
          amount: Math.round(amount * 100),
          reason: reason || "requested_by_customer",
        },
        { idempotencyKey: `refund-${booking.id}` }
      );

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
      // Leave the booking in "processing" (not back to "requested"): if the Stripe
      // refund already succeeded but the DB write failed, the guard above now blocks
      // any retry, and the idempotencyKey prevents a second real refund either way.
      await db.update(bookings)
        .set({ refundStatus: "processing" })
        .where(eq(bookings.id, req.params.id))
        .catch(() => {});
      logger.error("[Payments] Refund error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
