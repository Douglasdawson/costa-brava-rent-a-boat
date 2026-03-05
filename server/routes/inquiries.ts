import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertWhatsappInquirySchema, updateWhatsappInquirySchema } from "@shared/schema";
import { requireAdminSession } from "./auth";
import { sendMetaWhatsAppMessage, isMetaWhatsAppConfigured } from "../whatsapp/metaClient";

const paginatedInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.string().optional(),
  search: z.string().optional(),
});

export function registerInquiryRoutes(app: Express) {
  // Public: save inquiry when user submits booking form
  app.post("/api/booking-inquiries", async (req, res) => {
    try {
      const parsed = insertWhatsappInquirySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const inquiry = await storage.createWhatsappInquiry(parsed.data);
      res.status(201).json({ success: true, id: inquiry.id });
    } catch (error: unknown) {
      console.error("[Inquiries] Error creating inquiry:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin: list inquiries (paginated)
  app.get("/api/admin/booking-inquiries", requireAdminSession, async (req, res) => {
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
      console.error("[Admin] Error fetching inquiries:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin: update inquiry (status, notes)
  app.patch("/api/admin/booking-inquiries/:id", requireAdminSession, async (req, res) => {
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
      console.error("[Admin] Error updating inquiry:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin: send WhatsApp message to inquiry customer via Meta API
  app.post("/api/admin/booking-inquiries/:id/send-whatsapp", requireAdminSession, async (req, res) => {
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
      console.error("[Admin] Error sending WhatsApp:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error al enviar mensaje de WhatsApp" });
    }
  });
}
