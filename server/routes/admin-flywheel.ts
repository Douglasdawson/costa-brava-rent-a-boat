import type { Express } from "express";
import { storage } from "../storage";
import { requireAdminSession } from "./auth-middleware";
import { logger } from "../lib/logger";
import { renderThankYouWhatsApp } from "../services/whatsappTemplates";
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
}
