// server/seo/alerts/whatsapp.ts
import { logger } from "../../lib/logger";

export async function sendSeoAlert(title: string, message: string, severity: string): Promise<void> {
  try {
    // Dynamic import to avoid issues if Twilio not configured
    const twilio = await import("twilio");
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    const ownerPhone = process.env.OWNER_WHATSAPP || "+34611500372";
    const fromPhone = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    const indicator = severity === "critical" ? "[CRITICO]" : severity === "high" ? "[ALTO]" : "[SEO]";

    await client.messages.create({
      body: `${indicator} SEO Alert: ${title}\n\n${message}`,
      from: fromPhone,
      to: `whatsapp:${ownerPhone}`,
    });

    logger.info(`[SEO:WhatsApp] Alert sent: ${title}`);
  } catch (error) {
    logger.warn(`[SEO:WhatsApp] Failed to send alert: ${error}`);
  }
}
