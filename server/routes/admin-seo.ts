import type { Express } from "express";
import { logger } from "../lib/logger";
import { db } from "../db";
import { getSeoTrends, getCompetitorTrends } from "../storage/seoAutopilot";
import {
  seoKeywords,
  seoRankings,
  seoCompetitors,
  seoCompetitorRankings,
  seoSerpFeatures,
  seoCampaigns,
  seoExperiments,
  seoConversions,
  seoLearnings,
  seoAlerts,
  seoReports,
  seoGeo,
  seoHealthChecks,
} from "../../shared/schema";
import { eq, desc, gte, and, sql, count } from "drizzle-orm";
import { requireAdminSession } from "./auth-middleware";

export function registerSeoRoutes(app: Express): void {
  // Dashboard overview
  app.get("/api/admin/seo/dashboard", requireAdminSession, async (_req, res) => {
    try {
      const [keywordCount] = await db.select({ count: count() }).from(seoKeywords);
      const [campaignCount] = await db
        .select({ count: count() })
        .from(seoCampaigns)
        .where(eq(seoCampaigns.status, "active"));
      const [experimentCount] = await db
        .select({ count: count() })
        .from(seoExperiments)
        .where(eq(seoExperiments.status, "running"));
      const [alertCount] = await db
        .select({ count: count() })
        .from(seoAlerts)
        .where(eq(seoAlerts.status, "new"));

      const topKeywords = await db
        .select()
        .from(seoRankings)
        .innerJoin(seoKeywords, eq(seoRankings.keywordId, seoKeywords.id))
        .orderBy(desc(seoRankings.impressions))
        .limit(10);

      res.json({
        stats: {
          trackedKeywords: keywordCount.count,
          activeCampaigns: campaignCount.count,
          runningExperiments: experimentCount.count,
          pendingAlerts: alertCount.count,
        },
        topKeywords,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching SEO dashboard" });
    }
  });

  // Trends (ranking charts + competitor comparison)
  app.get("/api/admin/seo/trends", requireAdminSession, async (req, res) => {
    try {
      const days = Math.max(1, Math.min(Number(req.query.days) || 30, 365));
      const [rankings, competitors] = await Promise.all([
        getSeoTrends(days),
        getCompetitorTrends(days),
      ]);
      res.json({ rankings, competitors });
    } catch (error) {
      logger.error("Failed to fetch SEO trends", { error });
      res.status(500).json({ message: "Error al cargar tendencias SEO" });
    }
  });

  // Keywords
  app.get("/api/admin/seo/keywords", requireAdminSession, async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 50;
      const keywords = await db
        .select()
        .from(seoKeywords)
        .innerJoin(seoRankings, eq(seoKeywords.id, seoRankings.keywordId))
        .orderBy(desc(seoRankings.impressions))
        .limit(limit);
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching keywords" });
    }
  });

  // Campaigns
  app.get("/api/admin/seo/campaigns", requireAdminSession, async (_req, res) => {
    try {
      const campaigns = await db
        .select()
        .from(seoCampaigns)
        .orderBy(desc(seoCampaigns.createdAt));
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaigns" });
    }
  });

  // Experiments
  app.get("/api/admin/seo/experiments", requireAdminSession, async (_req, res) => {
    try {
      const experiments = await db
        .select()
        .from(seoExperiments)
        .orderBy(desc(seoExperiments.executedAt))
        .limit(50);
      res.json(experiments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching experiments" });
    }
  });

  // Competitors
  app.get("/api/admin/seo/competitors", requireAdminSession, async (_req, res) => {
    try {
      const competitors = await db.select().from(seoCompetitors);
      res.json(competitors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching competitors" });
    }
  });

  // Alerts
  app.get("/api/admin/seo/alerts", requireAdminSession, async (_req, res) => {
    try {
      const alerts = await db
        .select()
        .from(seoAlerts)
        .orderBy(desc(seoAlerts.createdAt))
        .limit(50);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching alerts" });
    }
  });

  // Acknowledge alert
  app.post("/api/admin/seo/alerts/:id/acknowledge", requireAdminSession, async (req, res) => {
    try {
      const [alert] = await db
        .update(seoAlerts)
        .set({ status: "acknowledged" })
        .where(eq(seoAlerts.id, Number(req.params.id)))
        .returning();

      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Error acknowledging alert" });
    }
  });

  // Reports
  app.get("/api/admin/seo/reports", requireAdminSession, async (_req, res) => {
    try {
      const reports = await db
        .select()
        .from(seoReports)
        .orderBy(desc(seoReports.createdAt))
        .limit(20);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reports" });
    }
  });

  // Manual SEM report trigger
  app.post("/api/admin/seo/sem-report", requireAdminSession, async (_req, res) => {
    try {
      const { generateSemReport } = await import("../seo/reports/sem");
      await generateSemReport();
      res.json({ message: "SEM report generated and sent" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("[SEM] Report generation failed", { error: msg });
      res.status(500).json({ message: "Error generating SEM report", error: msg });
    }
  });

  // GEO status
  app.get("/api/admin/seo/geo", requireAdminSession, async (_req, res) => {
    try {
      const geo = await db
        .select()
        .from(seoGeo)
        .orderBy(desc(seoGeo.date))
        .limit(50);
      res.json(geo);
    } catch (error) {
      res.status(500).json({ message: "Error fetching GEO status" });
    }
  });

  // Health checks
  app.get("/api/admin/seo/health", requireAdminSession, async (_req, res) => {
    try {
      const checks = await db
        .select()
        .from(seoHealthChecks)
        .orderBy(desc(seoHealthChecks.checkedAt))
        .limit(50);
      res.json(checks);
    } catch (error) {
      res.status(500).json({ message: "Error fetching health checks" });
    }
  });

  // Revenue attribution
  app.get("/api/admin/seo/revenue", requireAdminSession, async (_req, res) => {
    try {
      const revenue = await db
        .select()
        .from(seoConversions)
        .innerJoin(seoKeywords, eq(seoConversions.keywordId, seoKeywords.id))
        .orderBy(desc(seoConversions.revenue))
        .limit(50);
      res.json(revenue);
    } catch (error) {
      res.status(500).json({ message: "Error fetching revenue data" });
    }
  });

  // Learnings
  app.get("/api/admin/seo/learnings", requireAdminSession, async (_req, res) => {
    try {
      const learnings = await db
        .select()
        .from(seoLearnings)
        .orderBy(desc(seoLearnings.confidence))
        .limit(50);
      res.json(learnings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching learnings" });
    }
  });
}
