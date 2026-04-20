/**
 * Admin API — SEO Autopilot dashboard.
 *
 * Feeds the CRM "SEO Autopilot" tab:
 *   - overview KPIs
 *   - keyword radar
 *   - distribution tray (list + mark published/failed + delete)
 *   - alerts
 *   - audit log
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAdminSession } from "./auth-middleware";
import { db } from "../db";
import * as schema from "../../shared/schema";
import {
  getOverviewData,
  getAlerts,
  getDistributionTray,
  getDistributionItemById,
  updateDistributionStatus,
  markDistributionPublished,
  markDistributionFailed,
  deleteDistributionItem,
  getAuditLog,
} from "../storage/seoAutopilot";
import { logger } from "../lib/logger";

// ===== Schemas =====
const keywordsQuerySchema = z.object({
  cluster: z.string().optional(),
  language: z.string().length(2).optional(),
  maxPosition: z.coerce.number().int().positive().max(100).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

const distributionQuerySchema = z.object({
  status: z.enum(schema.DISTRIBUTION_STATUSES).optional(),
  platform: z.enum(schema.DISTRIBUTION_PLATFORMS).optional(),
  language: z.string().length(2).optional(),
  slug: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const markDistributionBodySchema = z.object({
  result: z.enum(["published", "failed", "discarded"]),
  publishedUrl: z.string().url().optional(),
  reason: z.string().optional(),
});

const auditQuerySchema = z.object({
  tool: z.string().optional(),
  success: z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean().optional()),
  sinceHours: z.coerce.number().int().positive().max(720).optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ===========================================================================
export function registerAdminSeoAutopilotRoutes(app: Express): void {
  // --- Overview --------------------------------------------------------
  app.get("/api/admin/autopilot/overview", requireAdminSession, async (_req: Request, res: Response) => {
    try {
      const data = await getOverviewData();
      res.json(data);
    } catch (err) {
      logger.error("autopilot overview failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error obteniendo overview" });
    }
  });

  // --- Alerts ----------------------------------------------------------
  app.get("/api/admin/autopilot/alerts", requireAdminSession, async (_req: Request, res: Response) => {
    try {
      const alerts = await getAlerts();
      res.json({ alerts, count: alerts.length });
    } catch (err) {
      logger.error("autopilot alerts failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error obteniendo alertas" });
    }
  });

  // --- Keyword radar ---------------------------------------------------
  app.get("/api/admin/autopilot/keywords", requireAdminSession, async (req: Request, res: Response) => {
    const parsed = keywordsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Filtros inválidos", errors: parsed.error.issues });
      return;
    }
    try {
      const { cluster, language, maxPosition, limit } = parsed.data;
      const conditions = [] as Array<ReturnType<typeof eq>>;
      if (cluster) conditions.push(eq(schema.seoKeywords.cluster, cluster));
      if (language) conditions.push(eq(schema.seoKeywords.language, language) as never);
      if (maxPosition !== undefined) {
        conditions.push(sql`${schema.seoRankings.position} <= ${String(maxPosition)}` as never);
      }

      const rows = await db
        .select({
          keyword: schema.seoKeywords.keyword,
          language: schema.seoKeywords.language,
          cluster: schema.seoKeywords.cluster,
          intent: schema.seoKeywords.intent,
          tracked: schema.seoKeywords.tracked,
          position: schema.seoRankings.position,
          impressions: schema.seoRankings.impressions,
          clicks: schema.seoRankings.clicks,
          ctr: schema.seoRankings.ctr,
          page: schema.seoRankings.page,
          date: schema.seoRankings.date,
        })
        .from(schema.seoKeywords)
        .leftJoin(schema.seoRankings, eq(schema.seoKeywords.id, schema.seoRankings.keywordId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(schema.seoRankings.impressions))
        .limit(limit ?? 100);

      res.json({ count: rows.length, results: rows });
    } catch (err) {
      logger.error("autopilot keywords failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error obteniendo keywords" });
    }
  });

  // --- Distribution tray ----------------------------------------------
  app.get("/api/admin/autopilot/distribution", requireAdminSession, async (req: Request, res: Response) => {
    const parsed = distributionQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Filtros inválidos", errors: parsed.error.issues });
      return;
    }
    try {
      const items = await getDistributionTray(parsed.data);
      res.json({ count: items.length, items });
    } catch (err) {
      logger.error("autopilot distribution list failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error obteniendo bandeja" });
    }
  });

  app.get("/api/admin/autopilot/distribution/:id", requireAdminSession, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ message: "ID inválido" });
      return;
    }
    try {
      const item = await getDistributionItemById(id);
      if (!item) {
        res.status(404).json({ message: "Item no encontrado" });
        return;
      }
      res.json({ item });
    } catch (err) {
      logger.error("autopilot distribution detail failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error obteniendo item" });
    }
  });

  app.post("/api/admin/autopilot/distribution/:id/mark", requireAdminSession, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const parsed = markDistributionBodySchema.safeParse(req.body);
    if (!Number.isFinite(id) || id <= 0 || !parsed.success) {
      res.status(400).json({ message: "Datos inválidos", errors: parsed.success ? undefined : parsed.error.issues });
      return;
    }
    try {
      const { result, publishedUrl, reason } = parsed.data;
      let item;
      if (result === "published") {
        if (!publishedUrl) {
          res.status(400).json({ message: "publishedUrl requerido cuando result=published" });
          return;
        }
        item = await markDistributionPublished(id, publishedUrl);
      } else if (result === "failed") {
        item = await markDistributionFailed(id, reason ?? "sin detalle");
      } else {
        item = await updateDistributionStatus(id, { status: "discarded", failureReason: reason ?? null });
      }
      if (!item) {
        res.status(404).json({ message: "Item no encontrado" });
        return;
      }
      res.json({ item });
    } catch (err) {
      logger.error("autopilot distribution mark failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error marcando item" });
    }
  });

  app.delete("/api/admin/autopilot/distribution/:id", requireAdminSession, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ message: "ID inválido" });
      return;
    }
    try {
      const ok = await deleteDistributionItem(id);
      if (!ok) {
        res.status(404).json({ message: "Item no encontrado" });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      logger.error("autopilot distribution delete failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error eliminando item" });
    }
  });

  // --- Audit log -------------------------------------------------------
  app.get("/api/admin/autopilot/audit", requireAdminSession, async (req: Request, res: Response) => {
    const parsed = auditQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: "Filtros inválidos", errors: parsed.error.issues });
      return;
    }
    try {
      const entries = await getAuditLog(parsed.data);
      res.json({ count: entries.length, entries });
    } catch (err) {
      logger.error("autopilot audit failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error obteniendo auditoría" });
    }
  });
}
