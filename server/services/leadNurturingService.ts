/**
 * Lead Nurturing Service
 *
 * Automatically follows up with WhatsApp chatbot leads based on their intent score:
 *
 * - HOT (score > 70, idle 30+ min): Send availability + booking link for the boat they asked about
 * - WARM (score 50-70, idle 24+ hours): Send a 10% discount code valid 48h
 * - COLD (score < 30, idle 24+ hours): Subscribe email to newsletter for long-term nurture
 *
 * Runs every 2 hours. Never sends more than one nurturing message per lead per 24h.
 */

import { storage } from "../storage";
import {
  getLeadsForNurturing,
  markLeadNurtured,
  wasNurturedRecently,
  isAlreadySubscribed,
} from "../storage/leadNurturing";
import { createDiscountCode } from "../storage/promotions";
import { logger } from "../lib/logger";
import type { AiChatSession, InsertLeadNurturingLog } from "@shared/schema";

// Thresholds
const HOT_SCORE_MIN = 71;
const WARM_SCORE_MIN = 50;
const WARM_SCORE_MAX = 70;
const COLD_SCORE_MAX = 29;
const HOT_IDLE_MINUTES = 30;
const WARM_IDLE_MINUTES = 24 * 60; // 24 hours
const COLD_IDLE_MINUTES = 24 * 60; // 24 hours
const COOLDOWN_HOURS = 24;

const BASE_URL = process.env.BASE_URL || "https://www.costabravarentaboat.com";

/**
 * Main entry point: process all lead tiers.
 */
export async function processLeadNurturing(): Promise<void> {
  logger.info("[LeadNurturing] Starting lead nurturing cycle");

  let hotProcessed = 0;
  let warmProcessed = 0;
  let coldProcessed = 0;

  try {
    hotProcessed = await processHotLeads();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[LeadNurturing] Error processing hot leads", { error: msg });
  }

  try {
    warmProcessed = await processWarmLeads();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[LeadNurturing] Error processing warm leads", { error: msg });
  }

  try {
    coldProcessed = await processColdLeads();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[LeadNurturing] Error processing cold leads", { error: msg });
  }

  logger.info("[LeadNurturing] Cycle complete", {
    hotProcessed,
    warmProcessed,
    coldProcessed,
  });
}

// ========== HOT LEADS ==========

async function processHotLeads(): Promise<number> {
  const leads = await getLeadsForNurturing(HOT_SCORE_MIN, 100, HOT_IDLE_MINUTES);
  let processed = 0;

  for (const { session } of leads) {
    try {
      // Skip if nurtured recently
      if (await wasNurturedRecently(session.id, COOLDOWN_HOURS)) {
        continue;
      }

      // Build and send the message
      const sent = await sendHotLeadMessage(session);
      if (sent) {
        processed++;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("[LeadNurturing] Hot lead error", {
        sessionId: session.id,
        phone: session.phoneNumber,
        error: msg,
      });
    }
  }

  return processed;
}

async function sendHotLeadMessage(session: AiChatSession): Promise<boolean> {
  // Try to find the boat they were interested in
  const boatSlug = session.boatsViewed?.[session.boatsViewed.length - 1];
  let boatName = "nuestros barcos";
  let bookingUrl = `${BASE_URL}/boats`;

  if (boatSlug) {
    const boat = await storage.getBoat(boatSlug);
    if (boat) {
      boatName = boat.name;
      bookingUrl = `${BASE_URL}/boats/${boat.slug || boat.id}`;
    }
  }

  const name = session.profileName || "amigo/a";

  const message = [
    `Hola ${name}!`,
    ``,
    `Veo que estas interesado/a en ${boatName}. Tenemos disponibilidad esta semana!`,
    ``,
    `Reserva directamente aqui: ${bookingUrl}`,
    ``,
    `Si necesitas ayuda, estamos en el +34 611 500 372.`,
    ``,
    `Costa Brava Rent a Boat`,
  ].join("\n");

  const sent = await trySendWhatsApp(session.phoneNumber, message);

  await markLeadNurtured({
    sessionId: session.id,
    phoneNumber: session.phoneNumber,
    action: "hot_availability",
    messageSent: message,
    success: sent,
    errorMessage: sent ? undefined : "WhatsApp send failed or not configured",
    ...(session.tenantId ? { tenantId: session.tenantId } : {}),
  });

  if (sent) {
    logger.info("[LeadNurturing] Hot lead nurtured", {
      phone: session.phoneNumber,
      score: session.intentScore,
    });
  }

  return sent;
}

// ========== WARM LEADS ==========

async function processWarmLeads(): Promise<number> {
  const leads = await getLeadsForNurturing(WARM_SCORE_MIN, WARM_SCORE_MAX, WARM_IDLE_MINUTES);
  let processed = 0;

  for (const { session } of leads) {
    try {
      if (await wasNurturedRecently(session.id, COOLDOWN_HOURS)) {
        continue;
      }

      const sent = await sendWarmLeadMessage(session);
      if (sent) {
        processed++;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("[LeadNurturing] Warm lead error", {
        sessionId: session.id,
        phone: session.phoneNumber,
        error: msg,
      });
    }
  }

  return processed;
}

async function sendWarmLeadMessage(session: AiChatSession): Promise<boolean> {
  // Generate a unique 10% discount code valid 48h
  const codeStr = generateNurturingCode(session.phoneNumber);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  let discountCode: string = codeStr;
  try {
    const created = await createDiscountCode({
      code: codeStr,
      discountPercent: 10,
      maxUses: 1,
      customerEmail: null,
      isActive: true,
      expiresAt,
      ...(session.tenantId ? { tenantId: session.tenantId } : {}),
    });
    discountCode = created.code;
  } catch (error: unknown) {
    // Code collision — append timestamp fragment
    const fallback = `${codeStr}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
    try {
      const created = await createDiscountCode({
        code: fallback,
        discountPercent: 10,
        maxUses: 1,
        customerEmail: null,
        isActive: true,
        expiresAt,
        ...(session.tenantId ? { tenantId: session.tenantId } : {}),
      });
      discountCode = created.code;
    } catch {
      logger.error("[LeadNurturing] Failed to create discount code", { phone: session.phoneNumber });
      discountCode = codeStr; // use original even if not saved
    }
  }

  const name = session.profileName || "amigo/a";

  const message = [
    `Hola ${name}!`,
    ``,
    `Aun pensando en tu escapada en barco por la Costa Brava?`,
    ``,
    `Tenemos un 10% de descuento especial para ti!`,
    `Codigo: ${discountCode}`,
    `Valido hasta manana.`,
    ``,
    `Reserva en: ${BASE_URL}/boats`,
    ``,
    `Costa Brava Rent a Boat`,
  ].join("\n");

  const sent = await trySendWhatsApp(session.phoneNumber, message);

  await markLeadNurtured({
    sessionId: session.id,
    phoneNumber: session.phoneNumber,
    action: "warm_discount",
    discountCode,
    messageSent: message,
    success: sent,
    errorMessage: sent ? undefined : "WhatsApp send failed or not configured",
    ...(session.tenantId ? { tenantId: session.tenantId } : {}),
  });

  if (sent) {
    logger.info("[LeadNurturing] Warm lead nurtured with discount", {
      phone: session.phoneNumber,
      score: session.intentScore,
      discountCode,
    });
  }

  return sent;
}

// ========== COLD LEADS ==========

async function processColdLeads(): Promise<number> {
  const leads = await getLeadsForNurturing(0, COLD_SCORE_MAX, COLD_IDLE_MINUTES);
  let processed = 0;

  for (const { session } of leads) {
    try {
      if (await wasNurturedRecently(session.id, COOLDOWN_HOURS)) {
        continue;
      }

      const added = await addColdLeadToNewsletter(session);
      if (added) {
        processed++;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("[LeadNurturing] Cold lead error", {
        sessionId: session.id,
        phone: session.phoneNumber,
        error: msg,
      });
    }
  }

  return processed;
}

/**
 * For cold leads: if we have an email from the chatbot conversation, subscribe to newsletter.
 * No WhatsApp follow-up to avoid spamming.
 */
async function addColdLeadToNewsletter(session: AiChatSession): Promise<boolean> {
  // We need an email from the chatbot conversation to subscribe to newsletter.
  // The chatbotConversations table has customerEmail; check both tables.
  let email: string | null = null;

  // First try the chatbot conversation table (structured flow collects email)
  const chatConvo = await storage.getChatbotConversation(session.phoneNumber);
  if (chatConvo?.customerEmail) {
    email = chatConvo.customerEmail;
  }

  if (!email) {
    // No email available — log and mark so we don't retry
    await markLeadNurtured({
      sessionId: session.id,
      phoneNumber: session.phoneNumber,
      action: "cold_newsletter",
      success: false,
      errorMessage: "No email available for newsletter subscription",
      ...(session.tenantId ? { tenantId: session.tenantId } : {}),
    });
    return false;
  }

  // Check if already subscribed
  const alreadySubscribed = await isAlreadySubscribed(email);
  if (alreadySubscribed) {
    // Mark as nurtured so we don't keep checking
    await markLeadNurtured({
      sessionId: session.id,
      phoneNumber: session.phoneNumber,
      action: "cold_newsletter",
      success: true,
      messageSent: `Already subscribed: ${email}`,
      ...(session.tenantId ? { tenantId: session.tenantId } : {}),
    });
    return true;
  }

  // Subscribe to newsletter
  try {
    await storage.createNewsletterSubscriber(
      email,
      session.language || "es",
      "chatbot_nurturing",
    );
  } catch {
    // Unique constraint violation means already subscribed
    logger.info("[LeadNurturing] Newsletter subscription failed (likely duplicate)", { email });
  }

  await markLeadNurtured({
    sessionId: session.id,
    phoneNumber: session.phoneNumber,
    action: "cold_newsletter",
    success: true,
    messageSent: `Subscribed ${email} to newsletter`,
    ...(session.tenantId ? { tenantId: session.tenantId } : {}),
  });

  logger.info("[LeadNurturing] Cold lead added to newsletter", {
    phone: session.phoneNumber,
    email,
  });

  return true;
}

// ========== HELPERS ==========

/**
 * Try to send a WhatsApp message. Returns true if sent, false if Twilio is not configured
 * or if sending fails. Never throws.
 */
async function trySendWhatsApp(to: string, body: string): Promise<boolean> {
  try {
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../whatsapp/twilioClient");

    if (!isTwilioConfigured()) {
      logger.info("[LeadNurturing] Twilio not configured, skipping WhatsApp send");
      return false;
    }

    await sendWhatsAppMessage(to, body);
    return true;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[LeadNurturing] WhatsApp send error", { to, error: msg });
    return false;
  }
}

/**
 * Generate a deterministic but unique discount code for a phone number.
 * Format: NURTURE-XXXXXX
 */
function generateNurturingCode(phone: string): string {
  const hash = phone.split("").reduce((h, c) => {
    return ((h << 5) - h + c.charCodeAt(0)) | 0;
  }, 0);
  const hashStr = Math.abs(hash).toString(36).toUpperCase().slice(0, 6).padEnd(6, "X");
  // Add date component so same phone gets different codes on different days
  const dayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "").slice(-4);
  return `NURTURE-${hashStr}${dayStr}`;
}
