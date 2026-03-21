import type { Express } from "express";
import { db } from "../db";
import {
  customers, customerUsers, bookings, crmCustomers,
  chatbotConversations, whatsappInquiries, giftCards,
  memberships, newsletterSubscribers, checkins,
  discountCodes, leadNurturingLog, testimonials, clientPhotos,
} from "@shared/schema";
import { eq, or, sql } from "drizzle-orm";
import { requireAdminSession } from "./auth";
import { logger } from "../lib/logger";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Strip internal / system columns that should never be exported. */
function stripInternal<T extends Record<string, unknown>>(
  row: T,
  extra: string[] = [],
): Record<string, unknown> {
  const skip = new Set([
    "tenantId", "cancelationToken", "sessionId", "stripePaymentIntentId",
    "stripeSubscriptionId", ...extra,
  ]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!skip.has(k)) out[k] = v;
  }
  return out;
}

// ─── registration ───────────────────────────────────────────────────────────

export function registerGdprRoutes(app: Express): void {

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/gdpr/customers/:email/export  — data portability (Art. 20 GDPR)
  // ═══════════════════════════════════════════════════════════════════════════
  app.get("/api/gdpr/customers/:email/export", requireAdminSession, async (req, res) => {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Email invalido" });
    }

    logger.info("[GDPR] Data export requested", { email, admin: (req as Record<string, unknown>).adminUser ?? "unknown" });

    try {
      // --- customer_users ---
      const userRows = await db
        .select().from(customerUsers)
        .where(eq(customerUsers.email, email));

      // --- customers ---
      const customerRows = await db
        .select().from(customers)
        .where(eq(customers.email, email));

      // --- bookings ---
      const bookingRows = await db
        .select().from(bookings)
        .where(eq(bookings.customerEmail, email));
      const bookingIds = bookingRows.map(b => b.id);

      // --- checkins (via bookings) ---
      let checkinRows: (typeof checkins.$inferSelect)[] = [];
      if (bookingIds.length > 0) {
        checkinRows = await db
          .select().from(checkins)
          .where(sql`${checkins.bookingId} IN ${bookingIds}`);
      }

      // --- crm_customers ---
      const crmRows = await db
        .select().from(crmCustomers)
        .where(eq(crmCustomers.email, email));

      // --- chatbot_conversations ---
      const chatbotRows = await db
        .select().from(chatbotConversations)
        .where(eq(chatbotConversations.customerEmail, email));

      // --- whatsapp_inquiries ---
      const inquiryRows = await db
        .select().from(whatsappInquiries)
        .where(eq(whatsappInquiries.email, email));

      // --- gift_cards ---
      const giftCardRows = await db
        .select().from(giftCards)
        .where(or(eq(giftCards.purchaserEmail, email), eq(giftCards.recipientEmail, email)));

      // --- memberships ---
      const membershipRows = await db
        .select().from(memberships)
        .where(eq(memberships.customerEmail, email));

      // --- newsletter_subscribers ---
      const newsletterRows = await db
        .select().from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email));

      // --- discount_codes ---
      const discountRows = await db
        .select().from(discountCodes)
        .where(eq(discountCodes.customerEmail, email));

      // --- lead_nurturing_log (phone match via bookings) ---
      let nurturingRows: (typeof leadNurturingLog.$inferSelect)[] = [];
      const phones = [...new Set(bookingRows.map(b => b.customerPhone).filter(Boolean))];
      if (phones.length > 0) {
        nurturingRows = await db
          .select().from(leadNurturingLog)
          .where(sql`${leadNurturingLog.phoneNumber} IN ${phones}`);
      }

      const payload = {
        exportDate: new Date().toISOString(),
        email,
        customer_users: userRows.map(r => stripInternal(r)),
        customers: customerRows.map(r => stripInternal(r)),
        bookings: bookingRows.map(r => stripInternal(r)),
        checkins: checkinRows.map(r => stripInternal(r)),
        crm_customers: crmRows.map(r => stripInternal(r)),
        chatbot_conversations: chatbotRows.map(r => stripInternal(r)),
        whatsapp_inquiries: inquiryRows.map(r => stripInternal(r)),
        gift_cards: giftCardRows.map(r => stripInternal(r)),
        memberships: membershipRows.map(r => stripInternal(r)),
        newsletter_subscribers: newsletterRows.map(r => stripInternal(r)),
        discount_codes: discountRows.map(r => stripInternal(r)),
        lead_nurturing_log: nurturingRows.map(r => stripInternal(r)),
      };

      const date = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="mis-datos-${date}.json"`);

      logger.info("[GDPR] Data export completed", {
        email,
        tables: Object.entries(payload)
          .filter(([k, v]) => k !== "exportDate" && k !== "email" && Array.isArray(v) && v.length > 0)
          .map(([k, v]) => `${k}:${(v as unknown[]).length}`),
      });

      return res.json(payload);
    } catch (error: unknown) {
      logger.error("[GDPR] Data export failed", { email, error: error instanceof Error ? error.message : String(error) });
      return res.status(500).json({ message: "Error al exportar los datos" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE /api/gdpr/customers/:email  — right to erasure (Art. 17 GDPR)
  // ═══════════════════════════════════════════════════════════════════════════
  app.delete("/api/gdpr/customers/:email", requireAdminSession, async (req, res) => {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Email invalido" });
    }

    logger.info("[GDPR] Data deletion requested", { email, admin: (req as Record<string, unknown>).adminUser ?? "unknown" });

    try {
      const summary: Record<string, number> = {};

      await db.transaction(async (tx) => {
        // 1. Collect booking IDs + phones for dependent tables
        const customerBookings = await tx
          .select({ id: bookings.id, phone: bookings.customerPhone })
          .from(bookings)
          .where(eq(bookings.customerEmail, email));

        const bookingIds = customerBookings.map(b => b.id);
        const phones = [...new Set(customerBookings.map(b => b.phone).filter(Boolean))];

        // 2. lead_nurturing_log (phone match)
        if (phones.length > 0) {
          const result = await tx
            .delete(leadNurturingLog)
            .where(sql`${leadNurturingLog.phoneNumber} IN ${phones}`);
          summary.lead_nurturing_log = result.rowCount ?? 0;
        }

        // 3. chatbot_conversations (by email + by bookingId)
        const chatResult = await tx
          .delete(chatbotConversations)
          .where(eq(chatbotConversations.customerEmail, email));
        let chatCount = chatResult.rowCount ?? 0;
        if (bookingIds.length > 0) {
          const chatByBooking = await tx
            .delete(chatbotConversations)
            .where(sql`${chatbotConversations.createdBookingId} IN ${bookingIds}`);
          chatCount += chatByBooking.rowCount ?? 0;
        }
        summary.chatbot_conversations = chatCount;

        // 4. checkins (via bookingId)
        if (bookingIds.length > 0) {
          const checkinResult = await tx
            .delete(checkins)
            .where(sql`${checkins.bookingId} IN ${bookingIds}`);
          summary.checkins = checkinResult.rowCount ?? 0;
        }

        // 5. memberships (via customerId from customers table, or email)
        const memberResult = await tx
          .delete(memberships)
          .where(eq(memberships.customerEmail, email));
        summary.memberships = memberResult.rowCount ?? 0;

        // 6. bookings — ANONYMIZE, do NOT delete (accounting/tax requirement)
        if (bookingIds.length > 0) {
          const anonResult = await tx
            .update(bookings)
            .set({
              customerName: "[ELIMINADO]",
              customerSurname: "[ELIMINADO]",
              customerPhone: "[ELIMINADO]",
              customerEmail: "deleted@deleted.com",
              customerNationality: "[ELIMINADO]",
              notes: null,
            })
            .where(eq(bookings.customerEmail, email));
          summary.bookings_anonymized = anonResult.rowCount ?? 0;
        }

        // 7. crm_customers
        const crmResult = await tx
          .delete(crmCustomers)
          .where(eq(crmCustomers.email, email));
        summary.crm_customers = crmResult.rowCount ?? 0;

        // 8. whatsapp_inquiries
        const inquiryResult = await tx
          .delete(whatsappInquiries)
          .where(eq(whatsappInquiries.email, email));
        summary.whatsapp_inquiries = inquiryResult.rowCount ?? 0;

        // 9. gift_cards (purchaser or recipient)
        const giftResult = await tx
          .delete(giftCards)
          .where(or(eq(giftCards.purchaserEmail, email), eq(giftCards.recipientEmail, email)));
        summary.gift_cards = giftResult.rowCount ?? 0;

        // 10. newsletter_subscribers
        const nlResult = await tx
          .delete(newsletterSubscribers)
          .where(eq(newsletterSubscribers.email, email));
        summary.newsletter_subscribers = nlResult.rowCount ?? 0;

        // 11. discount_codes
        const discountResult = await tx
          .delete(discountCodes)
          .where(eq(discountCodes.customerEmail, email));
        summary.discount_codes = discountResult.rowCount ?? 0;

        // 12. Anonymize PII-minor tables: testimonials, client_photos
        //     Match by customerName from the customers/crm record (best effort)
        const customerRecord = await tx
          .select({ firstName: customers.firstName, lastName: customers.lastName })
          .from(customers)
          .where(eq(customers.email, email))
          .limit(1);

        if (customerRecord.length > 0) {
          const fullName = `${customerRecord[0].firstName} ${customerRecord[0].lastName}`;
          const testiResult = await tx
            .update(testimonials)
            .set({ customerName: "[Cliente]" })
            .where(eq(testimonials.customerName, fullName));
          summary.testimonials_anonymized = testiResult.rowCount ?? 0;

          const photoResult = await tx
            .update(clientPhotos)
            .set({ customerName: "[Cliente]" })
            .where(eq(clientPhotos.customerName, fullName));
          summary.client_photos_anonymized = photoResult.rowCount ?? 0;
        }

        // 13. customers (references customer_users)
        const custResult = await tx
          .delete(customers)
          .where(eq(customers.email, email));
        summary.customers = custResult.rowCount ?? 0;

        // 14. customer_users — delete LAST (referenced by customers.userId)
        const userResult = await tx
          .delete(customerUsers)
          .where(eq(customerUsers.email, email));
        summary.customer_users = userResult.rowCount ?? 0;
      });

      // Filter out zero-count entries for cleaner response
      const affected = Object.fromEntries(
        Object.entries(summary).filter(([_, count]) => count > 0),
      );

      logger.info("[GDPR] Data deletion completed", { email, summary: affected });

      return res.json({
        success: true,
        message: `Datos del cliente ${email} eliminados/anonimizados correctamente`,
        affected,
      });
    } catch (error: unknown) {
      logger.error("[GDPR] Data deletion FAILED — transaction rolled back", {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({
        message: "Error al eliminar los datos. No se han realizado cambios (rollback completo).",
      });
    }
  });
}
