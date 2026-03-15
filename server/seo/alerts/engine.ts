// server/seo/alerts/engine.ts
import { db } from "../../db";
import { seoAlerts } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { sendSeoAlert } from "./whatsapp";

export async function checkAlerts(): Promise<void> {
  logger.info("[SEO:Alerts] Checking for anomalies...");

  // Process all new alerts: critical/high go via WhatsApp, low/medium dashboard only
  const newAlerts = await db
    .select()
    .from(seoAlerts)
    .where(eq(seoAlerts.status, "new"));

  for (const alert of newAlerts) {
    if (alert.severity === "critical" || alert.severity === "high") {
      await sendSeoAlert(alert.title, alert.message || "", alert.severity);
      await db
        .update(seoAlerts)
        .set({ status: "sent", sentVia: "whatsapp" })
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
