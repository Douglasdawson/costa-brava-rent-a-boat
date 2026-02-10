import type { Express } from "express";
import express from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { db } from "../db";
import { bookings } from "@shared/schema";
import { eq } from "drizzle-orm";

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
      } catch (error: any) {
        return res.status(503).json({
          message: "Servicio de pagos no disponible: " + error.message,
          success: false,
        });
      }

      const { holdId, bookingId } = req.body;
      const targetId = holdId || bookingId;

      if (!targetId) {
        return res.status(400).json({
          message: "ID de hold o booking requerido",
          success: false,
        });
      }

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

      const amount = parseFloat(hold.totalAmount);
      if (amount <= 0) {
        return res.status(400).json({ message: "Invalid booking amount" });
      }

      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "eur",
        metadata: {
          holdId: hold.id,
          sessionId: hold.sessionId || "",
          boatId: hold.boatId,
          bookingDate: hold.bookingDate.toISOString(),
          startTime: hold.startTime.toISOString(),
          endTime: hold.endTime.toISOString(),
          numberOfPeople: hold.numberOfPeople.toString(),
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
        amount: amount,
        currency: "eur",
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({
        message: "Error al crear el intent de pago: " + error.message,
        success: false,
      });
    }
  });

  // Create checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripeInstance = getStripe();
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const amount = parseFloat(booking.totalAmount);
      if (amount <= 0) {
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
                description: `Reserva para ${booking.customerName} ${booking.customerSurname} el ${booking.bookingDate.toISOString().split("T")[0]}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        cancel_url: `${req.headers.origin}/booking?step=6&booking_id=${bookingId}`,
        metadata: {
          bookingId: bookingId,
        },
      });

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating checkout session: " + error.message });
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
      const { holdId } = req.body;
      if (!holdId) {
        return res.status(400).json({ message: "ID de hold requerido", success: false });
      }

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
    } catch (error: any) {
      res.status(500).json({
        message: "Error al crear el intent de pago mock: " + error.message,
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
      const { paymentIntentId } = req.body;
      if (!paymentIntentId) {
        return res.status(400).json({ message: "PaymentIntent ID requerido", success: false });
      }

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

      await storage.updateBooking(booking[0].id, {
        bookingStatus: "confirmed",
        paymentStatus: "completed",
      });

      res.json({
        success: true,
        message: "Pago simulado exitosamente",
        bookingId: booking[0].id,
        status: "confirmed",
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Error al simular el pago: " + error.message,
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
    } catch (error: any) {
      console.error("Stripe not configured for webhook:", error.message);
      return res.status(503).json({ error: "Payment service not configured" });
    }

    if (process.env.NODE_ENV === "production" && !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET is required in production");
      return res.status(503).json({ error: "Webhook not properly configured" });
    }

    let event: Stripe.Event;
    try {
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripeInstance.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } else {
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log("Payment succeeded:", paymentIntent.id);

          const booking = await db
            .select()
            .from(bookings)
            .where(eq(bookings.stripePaymentIntentId, paymentIntent.id))
            .limit(1);

          if (booking.length > 0) {
            await storage.updateBooking(booking[0].id, {
              bookingStatus: "confirmed",
              paymentStatus: "completed",
            });
            console.log(`Booking ${booking[0].id} confirmed after successful payment`);
          } else {
            console.warn(`No booking found for payment intent ${paymentIntent.id}`);
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          console.log("Payment failed:", failedPayment.id);

          const failedBooking = await db
            .select()
            .from(bookings)
            .where(eq(bookings.stripePaymentIntentId, failedPayment.id))
            .limit(1);

          if (failedBooking.length > 0) {
            await storage.updateBooking(failedBooking[0].id, {
              paymentStatus: "failed",
            });
            console.log(`Payment failed for booking ${failedBooking[0].id}`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
