// server/seo/reports/weekly.ts
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../db";
import { seoReports } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { buildBriefing } from "../strategist/briefing";
import { sendSeoAlert } from "../alerts/whatsapp";

const client = new Anthropic();

export async function generateWeeklyReport(): Promise<void> {
  const briefing = await buildBriefing();

  logger.info("[SEO:Reports] Generating weekly report...");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Generate a concise weekly SEO report in Spanish for the business owner. Include:
1. Top 5 keywords and their position changes
2. Actions taken this week and their results
3. Active campaigns and progress
4. Top opportunities for next week
5. Any alerts or issues

Keep it short and actionable (max 500 words). Use plain text, no markdown.

Data:\n${JSON.stringify(briefing, null, 2)}`,
      }],
    });

    const summary = response.content[0].type === "text" ? response.content[0].text : "";

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    await db.insert(seoReports).values({
      type: "weekly",
      periodStart: weekAgo.toISOString().split("T")[0],
      periodEnd: now.toISOString().split("T")[0],
      summary,
      data: briefing,
      sentVia: "whatsapp",
    });

    // Send via WhatsApp
    await sendSeoAlert(
      "Informe SEO Semanal",
      summary,
      "low",
    );

    logger.info("[SEO:Reports] Weekly report generated and sent");
  } catch (error) {
    logger.error("[SEO:Reports] Failed to generate weekly report", { error: String(error) });
  }
}
