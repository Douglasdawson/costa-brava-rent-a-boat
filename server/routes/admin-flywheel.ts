import type { Express } from "express";
import { storage } from "../storage";
import { requireAdminSession } from "./auth-middleware";
import { logger } from "../lib/logger";
import { renderThankYouWhatsApp } from "../services/whatsappTemplates";
import { sendThankYouEmail } from "../services/emailService";
import { audit } from "../lib/audit";

/**
 * Admin-only endpoints to manually trigger the post-rental flywheel for a
 * specific booking. Used to back-fill bookings that missed the scheduler
 * window (e.g., scheduler was down, booking created retroactively with
 * status=completed, etc.).
 */
export function registerAdminFlywheelRoutes(app: Express) {
  // Force-send WhatsApp review request for a specific booking, bypassing the
  // time-window filters. Idempotent-safe: marks the booking flags after send
  // so subsequent calls short-circuit.
  app.post(
    "/api/admin/flywheel/review-request/:bookingId",
    requireAdminSession,
    async (req, res) => {
      const { bookingId } = req.params;

      try {
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ message: "Reserva no encontrada" });
        }

        if (!booking.customerPhone || booking.customerPhone === "N/A") {
          return res.status(400).json({
            message: "La reserva no tiene teléfono válido para WhatsApp",
          });
        }

        if (booking.whatsappThankYouSent && booking.reviewRequestSent) {
          return res.status(200).json({
            success: true,
            skipped: true,
            message: "Ya se envió el review request para esta reserva",
          });
        }

        const { isTwilioConfigured, sendWhatsAppMessage } = await import(
          "../whatsapp/twilioClient"
        );
        if (!isTwilioConfigured()) {
          return res.status(503).json({
            message: "Twilio no está configurado en este entorno",
          });
        }

        const message = renderThankYouWhatsApp({
          customerName: booking.customerName,
          language: booking.language,
        });

        await sendWhatsAppMessage(booking.customerPhone, message);

        await storage.updateBookingWhatsAppThankYouStatus(booking.id, true);
        await storage.markFlywheelStepSent(booking.id, "reviewRequestSent");

        audit(req, "flywheel.review_request_sent", "booking", booking.id, {
          channel: "whatsapp",
        });

        logger.info("[AdminFlywheel] Review request WhatsApp sent", {
          bookingId: booking.id,
          language: booking.language,
        });

        res.json({
          success: true,
          bookingId: booking.id,
          channel: "whatsapp",
          language: booking.language ?? "es",
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("[AdminFlywheel] review-request error", {
          bookingId,
          error: msg,
        });
        res.status(500).json({ message: "Error: " + msg });
      }
    },
  );

  // List bookings that are eligible for a manual review-request back-fill.
  // Useful for the CRM to surface missed ones in a list.
  app.get(
    "/api/admin/flywheel/review-request/pending",
    requireAdminSession,
    async (_req, res) => {
      try {
        // Pull recent completed bookings that haven't had either flag set.
        // Last 30 days is a reasonable ceiling — older than that, the customer
        // experience is stale and asking for a review feels off.
        const all = await storage.getAllBookings();
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        const pending = all.filter((b) => {
          if (!b.endTime) return false;
          const end = new Date(b.endTime).getTime();
          if (now - end > thirtyDaysMs) return false;
          if (now - end < 22 * 60 * 60 * 1000) return false;
          if (b.reviewRequestSent && b.whatsappThankYouSent) return false;
          if (!["completed", "confirmed"].includes(b.bookingStatus)) return false;
          if (!b.customerPhone || b.customerPhone === "N/A") return false;
          return true;
        }).map((b) => ({
          id: b.id,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          language: b.language,
          endTime: b.endTime,
          bookingStatus: b.bookingStatus,
          whatsappThankYouSent: b.whatsappThankYouSent,
          reviewRequestSent: b.reviewRequestSent,
          emailThankYouSent: b.emailThankYouSent,
        }));

        res.json({ count: pending.length, bookings: pending });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("[AdminFlywheel] pending list error", { error: msg });
        res.status(500).json({ message: "Error: " + msg });
      }
    },
  );

  // Force-send thank-you email for a specific booking, bypassing the time-window
  // and idempotency filters of the cron job. Accepts an optional `overrideEmail`
  // in the body to retarget the test to an arbitrary inbox without persisting
  // changes to the booking's customer record. Useful as a smoke test after
  // configuring SendGrid in a new environment.
  app.post(
    "/api/admin/flywheel/thank-you-email/:bookingId",
    requireAdminSession,
    async (req, res) => {
      const { bookingId } = req.params;
      const overrideEmailRaw = req.body?.overrideEmail;
      const overrideEmail = typeof overrideEmailRaw === "string" && overrideEmailRaw.trim()
        ? overrideEmailRaw.trim()
        : undefined;

      try {
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ message: "Reserva no encontrada" });
        }

        const targetEmail = overrideEmail || booking.customerEmail;
        if (!targetEmail) {
          return res.status(400).json({
            message:
              "La reserva no tiene email de cliente. Pasa overrideEmail en el body para forzar destino.",
          });
        }

        const boat = await storage.getBoat(booking.boatId);
        if (!boat) {
          return res.status(404).json({ message: "Barco no encontrado" });
        }

        const extras = await storage.getBookingExtras(booking.id);

        let discountCode = "TEST-DISCOUNT-CODE";
        if (!overrideEmail && booking.customerEmail) {
          try {
            const codeRecord = await storage.generateRepeatCustomerCode(
              booking.customerEmail,
              booking.id,
            );
            discountCode = codeRecord.code;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.warn("[AdminFlywheel] could not generate discount code", { error: msg });
            discountCode = "REPEAT-GIFT";
          }
        }

        const bookingForSend = overrideEmail
          ? { ...booking, customerEmail: overrideEmail }
          : booking;

        const result = await sendThankYouEmail(
          { booking: bookingForSend, boat, extras },
          discountCode,
        );

        if (!result.success) {
          return res.status(503).json({
            success: false,
            message: result.error || "Error enviando email",
          });
        }

        // Only mark the real booking as sent when we used the customer's
        // actual email — override sends are treated as throwaway tests.
        if (!overrideEmail) {
          await storage.updateBookingEmailStatus(booking.id, undefined, true);
        }

        audit(req, "flywheel.thank_you_email_sent", "booking", booking.id, {
          channel: "email",
          target: targetEmail,
          override: Boolean(overrideEmail),
        });

        logger.info("[AdminFlywheel] Thank-you email sent", {
          bookingId: booking.id,
          target: targetEmail,
          language: booking.language,
          override: Boolean(overrideEmail),
        });

        res.json({
          success: true,
          bookingId: booking.id,
          channel: "email",
          target: targetEmail,
          language: booking.language ?? "es",
          discountCode,
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("[AdminFlywheel] thank-you-email error", {
          bookingId,
          error: msg,
        });
        res.status(500).json({ message: "Error: " + msg });
      }
    },
  );
}
