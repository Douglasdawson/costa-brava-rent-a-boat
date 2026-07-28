// Meta WhatsApp Cloud API Client
import { logger } from "../lib/logger";
import { metaBreaker } from "../lib/circuitBreaker";

const GRAPH_API_VERSION = "v25.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getConfig() {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    throw new Error("Meta WhatsApp not configured. Set META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_ID.");
  }
  return { token, phoneId };
}

export function isMetaWhatsAppConfigured(): boolean {
  return !!(process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_ID);
}

/**
 * Normalize phone number to E.164 without + prefix
 * e.g. "+34611500372" → "34611500372"
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * Send a text message via Meta WhatsApp Cloud API
 */
export async function sendMetaWhatsAppMessage(
  to: string,
  body: string
): Promise<{ messageId: string }> {
  const { token, phoneId } = getConfig();
  const toNumber = normalizePhone(to);

  const result = await metaBreaker.call(async () => {
    const res = await fetch(`${GRAPH_API_BASE}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: { body },
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      logger.error("Meta WhatsApp send error", { toNumber, error });
      throw new Error(`Meta WhatsApp API error: ${res.status}`);
    }

    return res.json();
  });

  const messageId = result.messages?.[0]?.id || "";
  logger.info("Meta WhatsApp message sent", { toNumber, messageId });
  return { messageId };
}

/**
 * Send a template message (required for initiating conversations)
 */
export async function sendMetaTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = "es"
): Promise<{ messageId: string }> {
  const { token, phoneId } = getConfig();
  const toNumber = normalizePhone(to);

  const result = await metaBreaker.call(async () => {
    const res = await fetch(`${GRAPH_API_BASE}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
        },
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      logger.error("Meta WhatsApp template send error", { toNumber, templateName, error });
      throw new Error(`Meta WhatsApp API error: ${res.status}`);
    }

    return res.json();
  });

  const messageId = result.messages?.[0]?.id || "";
  logger.info("Meta WhatsApp template sent", { templateName, toNumber, messageId });
  return { messageId };
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  const { token, phoneId } = getConfig();

  await fetch(`${GRAPH_API_BASE}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  }).catch((err) => {
    logger.error("Meta WhatsApp error marking read", { error: err.message });
  });
}
