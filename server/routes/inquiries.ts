import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { storage } from "../storage";
import { insertWhatsappInquirySchema, updateWhatsappInquirySchema } from "@shared/schema";
import { requireAdminSession, requireTabAccess } from "./auth";
import { sendMetaWhatsAppMessage, isMetaWhatsAppConfigured } from "../whatsapp/metaClient";
import { logger } from "../lib/logger";
import { sendGA4Event, deriveClientIdFromRequest } from "../lib/analyticsServer";
import { sendMetaConversion, getMetaBrowserIds } from "../lib/metaConversions";
import { sendInquiryAdminNotification } from "../services/emailService";

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta de nuevo mas tarde." },
});

const paginatedInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.string().optional(),
  search: z.string().optional(),
});

export function registerInquiryRoutes(app: Express) {
  // Public: save inquiry when user submits booking form
  app.post("/api/booking-inquiries", submitLimiter, async (req, res) => {
    try {
      // Honeypot anti-bot check
      if (req.body.website) {
        return res.json({ success: true });
      }

      const parsed = insertWhatsappInquirySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const inquiry = await storage.createWhatsappInquiry(parsed.data);

      // Safety-net admin notification: the wizard's only ping to the team was
      // the customer-initiated WhatsApp. A visitor who fills the form but never
      // hits send in WhatsApp left a warm lead unseen in the CRM. Fire-and-forget
      // and best-effort (no-ops if SendGrid isn't configured) so it never blocks
      // or fails the response.
      void sendInquiryAdminNotification(inquiry).catch(err =>
        logger.error("[Inquiries] Admin notification failed", {
          error: err instanceof Error ? err.message : String(err),
        })
      );

      // Server-side GA4 event — sobrevive a cookie consent denial y race conditions del cliente.
      void sendGA4Event(
        "generate_lead",
        {
          currency: "EUR",
          value: Number(inquiry.estimatedTotal) || 0,
          source: "booking_inquiry_form",
          boat_id: inquiry.boatId,
          inquiry_id: inquiry.id,
          language: inquiry.language || "es",
        },
        {
          clientId: deriveClientIdFromRequest(req),
          userAgent: req.headers["user-agent"],
        }
      );

      // Server-side Meta CAPI "Lead" — the single source of truth for Meta.
      // Every lead (homepage form AND the wizard's safety-net) funnels through an
      // inquiry, so firing here once per inquiry means exactly one Meta Lead per
      // real lead. Stable event_id keeps it idempotent. Survives ad blockers and
      // cookie-consent denial; before this, Meta saw 0 leads from these forms.
      const fb = getMetaBrowserIds(req);
      void sendMetaConversion({
        eventName: "Lead",
        eventId: `lead-inquiry-${inquiry.id}`,
        email: inquiry.email,
        phone: `${inquiry.phonePrefix}${inquiry.phoneNumber}`,
        value: Number(inquiry.estimatedTotal) || 0,
        currency: "EUR",
        contentIds: inquiry.boatId ? [inquiry.boatId] : undefined,
        clientIp: req.ip,
        userAgent: req.headers["user-agent"],
        fbp: fb.fbp,
        fbc: fb.fbc,
        sourceUrl: typeof req.headers.referer === "string" ? req.headers.referer : undefined,
      }).catch(err =>
        logger.error("[Inquiries] Meta CAPI lead failed", {
          error: err instanceof Error ? err.message : String(err),
        })
      );

      res.status(201).json({ success: true, id: inquiry.id });
    } catch (error: unknown) {
      logger.error("[Inquiries] Error creating inquiry", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin: warm leads still waiting for the team. Channel-independent safety net
  // (works even if the SendGrid email + Twilio WhatsApp notifications are down):
  // booking requests in "requested" status + inquiries in "pending" status.
  app.get("/api/admin/unattended-leads", requireAdminSession, async (_req, res) => {
    try {
      const [bookingRequests, pendingInquiries] = await Promise.all([
        storage.getUnattendedBookingRequests({ sinceDays: 30, limit: 50 }),
        storage.getPendingInquiries({ sinceDays: 30, limit: 50 }),
      ]);

      res.set("Cache-Control", "no-store");
      res.json({
        counts: {
          bookingRequests: bookingRequests.length,
          pendingInquiries: pendingInquiries.length,
          total: bookingRequests.length + pendingInquiries.length,
        },
        bookingRequests: bookingRequests.map(b => ({
          id: b.id,
          customerName: [b.customerName, b.customerSurname].filter(Boolean).join(" ").trim(),
          boatId: b.boatId,
          bookingDate: b.bookingDate,
          startTime: b.startTime,
          totalAmount: b.totalAmount,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          language: b.language,
          createdAt: b.createdAt,
        })),
        pendingInquiries: pendingInquiries.map(i => ({
          id: i.id,
          customerName: [i.firstName, i.lastName].filter(Boolean).join(" ").trim(),
          boatName: i.boatName,
          phone: `${i.phonePrefix ?? ""}${i.phoneNumber ?? ""}`.trim(),
          email: i.email,
          language: i.language,
          createdAt: i.createdAt,
        })),
      });
    } catch (error: unknown) {
      logger.error("[Admin] Error fetching unattended leads", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin: list inquiries (paginated)
  app.get(
    "/api/admin/booking-inquiries",
    requireAdminSession,
    requireTabAccess("inquiries"),
    async (req, res) => {
      try {
        const queryParsed = paginatedInquiriesQuerySchema.safeParse(req.query);
        if (!queryParsed.success) {
          return res.status(400).json({
            message: "Parametros invalidos",
            errors: queryParsed.error.flatten().fieldErrors,
          });
        }
        const result = await storage.getPaginatedInquiries(queryParsed.data);
        res.json(result);
      } catch (error: unknown) {
        logger.error("[Admin] Error fetching inquiries", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  );

  // Admin: update inquiry (status, notes)
  app.patch(
    "/api/admin/booking-inquiries/:id",
    requireAdminSession,
    requireTabAccess("inquiries"),
    async (req, res) => {
      try {
        const parsed = updateWhatsappInquirySchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            message: "Datos invalidos",
            errors: parsed.error.flatten().fieldErrors,
          });
        }
        const updated = await storage.updateWhatsappInquiry(req.params.id, parsed.data);
        if (!updated) {
          return res.status(404).json({ message: "Peticion no encontrada" });
        }
        res.json({ success: true, inquiry: updated });
      } catch (error: unknown) {
        logger.error("[Admin] Error updating inquiry", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  );

  // Admin: delete inquiry
  app.delete(
    "/api/admin/booking-inquiries/:id",
    requireAdminSession,
    requireTabAccess("inquiries"),
    async (req, res) => {
      try {
        const deleted = await storage.deleteWhatsappInquiry(req.params.id);
        if (!deleted) {
          return res.status(404).json({ message: "Peticion no encontrada" });
        }
        res.json({ success: true });
      } catch (error: unknown) {
        logger.error("[Admin] Error deleting inquiry", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  );

  // Admin: send WhatsApp message to inquiry customer via Meta API
  app.post(
    "/api/admin/booking-inquiries/:id/send-whatsapp",
    requireAdminSession,
    requireTabAccess("inquiries"),
    async (req, res) => {
      try {
        const { message } = req.body;
        if (!message || typeof message !== "string") {
          return res.status(400).json({ message: "Mensaje requerido" });
        }

        if (!isMetaWhatsAppConfigured()) {
          return res.status(503).json({ message: "WhatsApp API no configurada" });
        }

        const inquiry = await storage.getWhatsappInquiry(req.params.id);
        if (!inquiry) {
          return res.status(404).json({ message: "Peticion no encontrada" });
        }

        const phone = `${inquiry.phonePrefix}${inquiry.phoneNumber}`;
        const result = await sendMetaWhatsAppMessage(phone, message);

        // Auto-update status to contacted
        if (inquiry.status === "pending") {
          await storage.updateWhatsappInquiry(inquiry.id, { status: "contacted" });
        }

        res.json({ success: true, messageId: result.messageId });
      } catch (error: unknown) {
        logger.error("[Admin] Error sending WhatsApp", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error al enviar mensaje de WhatsApp" });
      }
    }
  );
}
