import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { markMessageAsRead } from "../whatsapp/metaClient";

/**
 * Meta WhatsApp Cloud API Webhook
 * Handles: verification, incoming messages, message status updates
 */
export function registerMetaWebhookRoutes(app: Express) {
  // Webhook verification (Meta sends GET to verify)
  app.get("/api/meta-whatsapp/webhook", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN;
    if (!verifyToken) {
      console.error("[Meta Webhook] META_WHATSAPP_VERIFY_TOKEN not set");
      return res.sendStatus(403);
    }

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[Meta Webhook] Verification successful");
      return res.status(200).send(challenge);
    }

    console.error("[Meta Webhook] Verification failed");
    res.sendStatus(403);
  });

  // Webhook receiver (incoming messages + status updates)
  app.post("/api/meta-whatsapp/webhook", async (req: Request, res: Response) => {
    // Always return 200 immediately to avoid Meta retries
    res.sendStatus(200);

    try {
      const body = req.body;
      if (body.object !== "whatsapp_business_account") return;

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== "messages") continue;
          const value = change.value;

          // Handle incoming messages from customers
          if (value.messages) {
            for (const message of value.messages) {
              await handleIncomingMessage(message, value.contacts?.[0]);
            }
          }

          // Handle message status updates (sent, delivered, read)
          if (value.statuses) {
            for (const status of value.statuses) {
              await handleStatusUpdate(status);
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error("[Meta Webhook] Error processing:", error instanceof Error ? error.message : String(error));
    }
  });
}

/**
 * When a customer sends a message, check if their phone matches a pending inquiry
 */
async function handleIncomingMessage(
  message: { from: string; id: string; type: string; text?: { body: string } },
  contact?: { profile?: { name: string } }
) {
  const phone = message.from; // e.g. "34611500372"
  const name = contact?.profile?.name || "Unknown";
  console.log(`[Meta Webhook] Incoming from ${phone} (${name}): ${message.text?.body?.substring(0, 50) || message.type}`);

  // Mark as read
  if (message.id) {
    markMessageAsRead(message.id).catch(() => {});
  }

  // Auto-update matching inquiries from "pending" to "contacted"
  await updateInquiryByPhone(phone);
}

/**
 * When a message status changes (sent, delivered, read), update inquiry if needed
 */
async function handleStatusUpdate(
  status: { id: string; status: string; recipient_id: string; timestamp: string }
) {
  console.log(`[Meta Webhook] Status ${status.status} for message to ${status.recipient_id}`);

  // When message is delivered or read, mark inquiry as contacted
  if (status.status === "delivered" || status.status === "read") {
    await updateInquiryByPhone(status.recipient_id);
  }
}

/**
 * Find pending inquiries matching a phone number and update to "contacted"
 */
async function updateInquiryByPhone(phone: string) {
  // Normalize: remove any non-digits
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanPhone) return;

  try {
    // Search for pending inquiries with matching phone
    const result = await storage.getPaginatedInquiries({
      page: 1,
      limit: 50,
      status: "pending",
      search: cleanPhone,
    });

    for (const inquiry of result.data) {
      // Match: inquiry phone (without prefix symbols) contains the incoming phone digits
      const inquiryPhone = `${inquiry.phonePrefix}${inquiry.phoneNumber}`.replace(/[^0-9]/g, "");
      if (inquiryPhone === cleanPhone || cleanPhone.endsWith(inquiry.phoneNumber.replace(/[^0-9]/g, ""))) {
        await storage.updateWhatsappInquiry(inquiry.id, { status: "contacted" });
        console.log(`[Meta Webhook] Auto-updated inquiry ${inquiry.id} (${inquiry.firstName} ${inquiry.lastName}) to "contacted"`);
      }
    }
  } catch (error: unknown) {
    console.error("[Meta Webhook] Error updating inquiry:", error instanceof Error ? error.message : String(error));
  }
}
