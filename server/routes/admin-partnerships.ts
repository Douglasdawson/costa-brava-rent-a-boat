import type { Express } from "express";
import { requireAdminSession } from "./auth";
import { db } from "../db";
import { partnershipContacts, PARTNERSHIP_TOWNS, PARTNERSHIP_STATUSES } from "@shared/schema";
import type { PartnershipTown, PartnershipStatus } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { logger } from "../lib/logger";
import { sendPartnershipProposal } from "../services/emailService";
import crypto from "crypto";

// HMAC token for unsubscribe links
function generateUnsubToken(email: string): string {
  const secret = process.env.JWT_SECRET || "partnership-unsub-secret";
  return crypto.createHmac("sha256", secret).update(email).digest("hex").slice(0, 16);
}

const contactSchema = z.object({
  hotelName: z.string().min(1),
  email: z.string().email(),
  town: z.enum(PARTNERSHIP_TOWNS),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

const importSchema = z.array(contactSchema);

export function registerPartnershipRoutes(app: Express) {
  // ===== PUBLIC: Unsubscribe =====
  app.get("/api/partnerships/unsubscribe", async (req, res) => {
    try {
      const email = req.query.email as string;
      const token = req.query.token as string;
      if (!email || !token || generateUnsubToken(email) !== token) {
        return res.status(400).send("<html><body><h2>Enlace no valido</h2></body></html>");
      }
      await db.update(partnershipContacts)
        .set({ status: "unsubscribed", updatedAt: new Date() })
        .where(eq(partnershipContacts.email, email));
      res.send(`<html><body style="font-family:Arial;text-align:center;padding:60px;">
        <h2>Has sido dado de baja</h2>
        <p>No recibiras mas correos de colaboracion de Costa Brava Rent a Boat.</p>
      </body></html>`);
    } catch (error) {
      logger.error("[Partnerships] Unsubscribe error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send("<html><body><h2>Error</h2></body></html>");
    }
  });

  // ===== ADMIN: List contacts =====
  app.get("/api/admin/partnerships", requireAdminSession, async (req, res) => {
    try {
      const { town, status } = req.query;
      const conditions = [];
      if (town && PARTNERSHIP_TOWNS.includes(town as PartnershipTown)) {
        conditions.push(eq(partnershipContacts.town, town as string));
      }
      if (status && (PARTNERSHIP_STATUSES as readonly string[]).includes(status as string)) {
        conditions.push(eq(partnershipContacts.status, status as string));
      }

      const contacts = await db.select().from(partnershipContacts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(partnershipContacts.createdAt));
      res.json(contacts);
    } catch (error) {
      logger.error("[Partnerships] List error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== ADMIN: Create single contact =====
  app.post("/api/admin/partnerships", requireAdminSession, async (req, res) => {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const [contact] = await db.insert(partnershipContacts)
        .values(parsed.data)
        .returning();
      res.status(201).json(contact);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        return res.status(409).json({ message: "Este email ya existe en la lista" });
      }
      logger.error("[Partnerships] Create error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== ADMIN: Import contacts (JSON array) =====
  app.post("/api/admin/partnerships/import", requireAdminSession, async (req, res) => {
    try {
      const parsed = importSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten() });
      }

      let imported = 0;
      let duplicates = 0;
      const errors: string[] = [];

      for (const contact of parsed.data) {
        try {
          await db.insert(partnershipContacts).values(contact);
          imported++;
        } catch (e: unknown) {
          if (e instanceof Error && e.message.includes("duplicate")) {
            duplicates++;
          } else {
            errors.push(`${contact.email}: ${e instanceof Error ? e.message : "unknown error"}`);
          }
        }
      }

      res.json({ imported, duplicates, errors, total: parsed.data.length });
    } catch (error) {
      logger.error("[Partnerships] Import error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== ADMIN: Update contact =====
  app.put("/api/admin/partnerships/:id", requireAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalido" });

      const updateData = { ...req.body, updatedAt: new Date() };
      delete updateData.id;
      delete updateData.createdAt;

      const [updated] = await db.update(partnershipContacts)
        .set(updateData)
        .where(eq(partnershipContacts.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "Contacto no encontrado" });
      res.json(updated);
    } catch (error) {
      logger.error("[Partnerships] Update error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== ADMIN: Delete contact =====
  app.delete("/api/admin/partnerships/:id", requireAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "ID invalido" });

      const [deleted] = await db.delete(partnershipContacts)
        .where(eq(partnershipContacts.id, id))
        .returning();

      if (!deleted) return res.status(404).json({ message: "Contacto no encontrado" });
      res.json({ message: "Contacto eliminado" });
    } catch (error) {
      logger.error("[Partnerships] Delete error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== ADMIN: Send campaign =====
  app.post("/api/admin/partnerships/send", requireAdminSession, async (req, res) => {
    try {
      const { town, contactIds } = req.body as { town?: string; contactIds?: number[] };

      const conditions = [eq(partnershipContacts.status, "pending")];
      if (town && PARTNERSHIP_TOWNS.includes(town as PartnershipTown)) {
        conditions.push(eq(partnershipContacts.town, town));
      }

      let contacts;
      if (contactIds && contactIds.length > 0) {
        contacts = await db.select().from(partnershipContacts)
          .where(and(
            eq(partnershipContacts.status, "pending"),
            sql`${partnershipContacts.id} = ANY(${contactIds})`
          ));
      } else {
        contacts = await db.select().from(partnershipContacts)
          .where(and(...conditions));
      }

      if (contacts.length === 0) {
        return res.json({ sent: 0, failed: 0, message: "No hay contactos pendientes de envio" });
      }

      // Limit to 100 per batch
      const batch = contacts.slice(0, 100);
      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      const appUrl = process.env.APP_URL || "https://www.costabravarentaboat.com";

      for (const contact of batch) {
        const unsubToken = generateUnsubToken(contact.email);
        const unsubUrl = `${appUrl}/api/partnerships/unsubscribe?email=${encodeURIComponent(contact.email)}&token=${unsubToken}`;

        const result = await sendPartnershipProposal({
          email: contact.email,
          hotelName: contact.hotelName,
          contactName: contact.contactName || undefined,
          town: contact.town,
          unsubscribeUrl: unsubUrl,
        });

        if (result.success) {
          await db.update(partnershipContacts)
            .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
            .where(eq(partnershipContacts.id, contact.id));
          sent++;
        } else {
          failed++;
          errors.push(`${contact.email}: ${result.error}`);
        }

        // Rate limit: 1 second between emails
        if (batch.indexOf(contact) < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      res.json({ sent, failed, errors, total: batch.length });
    } catch (error) {
      logger.error("[Partnerships] Send error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== ADMIN: Stats =====
  app.get("/api/admin/partnerships/stats", requireAdminSession, async (_req, res) => {
    try {
      const stats = await db.select({
        town: partnershipContacts.town,
        status: partnershipContacts.status,
        count: sql<number>`count(*)::int`,
      })
        .from(partnershipContacts)
        .groupBy(partnershipContacts.town, partnershipContacts.status);

      const totals = await db.select({
        total: sql<number>`count(*)::int`,
        sent: sql<number>`count(*) filter (where ${partnershipContacts.status} = 'sent')::int`,
        pending: sql<number>`count(*) filter (where ${partnershipContacts.status} = 'pending')::int`,
        replied: sql<number>`count(*) filter (where ${partnershipContacts.status} = 'replied')::int`,
        converted: sql<number>`count(*) filter (where ${partnershipContacts.status} = 'converted')::int`,
        unsubscribed: sql<number>`count(*) filter (where ${partnershipContacts.status} = 'unsubscribed')::int`,
      })
        .from(partnershipContacts);

      res.json({ byTown: stats, totals: totals[0] });
    } catch (error) {
      logger.error("[Partnerships] Stats error", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
