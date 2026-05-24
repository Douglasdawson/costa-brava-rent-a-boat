/**
 * Admin endpoints powering the CRM "AI Mentions" sub-tab.
 *
 * Read-only aggregates over the ai_mentions table. Single composite endpoint
 * /api/admin/ai-mentions/summary is what the dashboard calls — gives
 * citation_rate per engine, competitor share-of-voice, sentiment breakdown
 * and the 50 most recent probes in one round trip.
 *
 * Also exposes /api/admin/ai-mentions/run-now (POST) so the user can trigger
 * a manual probe (useful right after deploying a citation A/B variant).
 */

import type { Express } from "express";
import { requireAdminSession } from "./auth-middleware";
import { logger } from "../lib/logger";
import {
  getCitationRateByEngine,
  getPromptStats,
  getCompetitorMentions,
  getSentimentBreakdown,
  getRecentMentions,
} from "../storage/aiMentions";

export function registerAiMentionsRoutes(app: Express): void {
  app.get("/api/admin/ai-mentions/summary", requireAdminSession, async (req, res) => {
    try {
      const days = Math.min(Math.max(parseInt((req.query.days as string) || "30", 10) || 30, 1), 365);
      const recentLimit = Math.min(Math.max(parseInt((req.query.recent as string) || "50", 10) || 50, 1), 500);

      const [byEngine, promptStats, competitors, sentiment, recent] = await Promise.allSettled([
        getCitationRateByEngine(days),
        getPromptStats(days, 100),
        getCompetitorMentions(days),
        getSentimentBreakdown(days),
        getRecentMentions(recentLimit),
      ]);

      const safe = <T>(r: PromiseSettledResult<T>, fallback: T): T => (r.status === "fulfilled" ? r.value : fallback);

      res.json({
        windowDays: days,
        byEngine: safe(byEngine, []),
        promptStats: safe(promptStats, []),
        competitors: safe(competitors, []),
        sentiment: safe(sentiment, []),
        recent: safe(recent, []),
        errors: {
          byEngine: byEngine.status === "rejected" ? String(byEngine.reason) : null,
          promptStats: promptStats.status === "rejected" ? String(promptStats.reason) : null,
          competitors: competitors.status === "rejected" ? String(competitors.reason) : null,
          sentiment: sentiment.status === "rejected" ? String(sentiment.reason) : null,
          recent: recent.status === "rejected" ? String(recent.reason) : null,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("[ai-mentions] summary failed", { error: msg });
      res.status(500).json({ message: "Error fetching AI mentions summary", error: msg });
    }
  });

  app.post("/api/admin/ai-mentions/run-now", requireAdminSession, async (req, res) => {
    try {
      // Dynamic import to keep the schedulerService module decoupled from
      // the admin routes (avoids circular dependencies at startup).
      const { runNightlyMonitor } = await import("../services/aiMentionsMonitor");
      const engines = Array.isArray(req.body?.engines)
        ? (req.body.engines as Array<"chatgpt" | "claude" | "perplexity" | "gemini">)
        : undefined;
      const langs = Array.isArray(req.body?.langs)
        ? (req.body.langs as Array<"es" | "en" | "fr" | "de">)
        : undefined;
      const maxPromptsPerEngine = typeof req.body?.maxPromptsPerEngine === "number"
        ? req.body.maxPromptsPerEngine
        : 5; // cap manual runs to keep cost trivial
      const result = await runNightlyMonitor({ engines, langs, maxPromptsPerEngine });
      res.json({ success: true, ...result });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("[ai-mentions] manual run failed", { error: msg });
      res.status(500).json({ success: false, error: msg });
    }
  });
}
