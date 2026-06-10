// server/seo/alerts/engine.ts
import { db } from "../../db";
import { seoAlerts } from "../../../shared/schema";
import { eq, isNull, or } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { sendSeoAlert } from "./whatsapp";
import { sendTelegramAlert } from "./telegram";

export async function checkAlerts(): Promise<void> {
  logger.info("[SEO:Alerts] Checking for anomalies...");

  // Process all new alerts: critical/high go via Telegram + WhatsApp,
  // low/medium dashboard only. status IS NULL is included to drain legacy
  // rows inserted without an explicit status (pre-2026-06-10 monitor bug).
  const newAlerts = await db
    .select()
    .from(seoAlerts)
    .where(or(eq(seoAlerts.status, "new"), isNull(seoAlerts.status)));

  for (const alert of newAlerts) {
    if (alert.severity === "critical" || alert.severity === "high") {
      // Telegram first (creds configured); WhatsApp kept as secondary channel.
      const telegramOk = await sendTelegramAlert(alert.title, alert.message || "", alert.severity);
      await sendSeoAlert(alert.title, alert.message || "", alert.severity);
      await db
        .update(seoAlerts)
        .set({ status: "sent", sentVia: telegramOk ? "telegram" : "whatsapp" })
        .where(eq(seoAlerts.id, alert.id));
    } else {
      // Low/medium alerts just go to dashboard
      await db
        .update(seoAlerts)
        .set({ status: "sent", sentVia: "dashboard" })
        .where(eq(seoAlerts.id, alert.id));
    }
  }

  logger.info(`[SEO:Alerts] Processed ${newAlerts.length} alerts`);
}
