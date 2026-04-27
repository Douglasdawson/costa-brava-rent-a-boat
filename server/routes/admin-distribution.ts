/**
 * Admin API — Distribution Engine triggers.
 *
 * Manual + on-demand publish endpoints used by the CRM Autopilot tab and by
 * the optional 6h cron job.
 */

import type { Express, Request, Response } from "express";
import { requireAdminSession } from "./auth-middleware";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";
import { publishOne, publishPending } from "../services/distribution/distributionEngine";

export function registerAdminDistributionRoutes(app: Express): void {
  // Publish a single tray item now.
  app.post("/api/admin/distribution/publish/:id", requireAdminSession, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ message: "ID inválido" });
      return;
    }

    try {
      const result = await publishOne(id);
      audit(req, "distribution.publish", "distribution_tray", id, {
        ok: result.ok,
        unsupported: result.unsupported,
        alreadyPublished: result.alreadyPublished,
        publishedUrl: result.publishedUrl,
        error: result.error,
      });

      const status = result.statusCode ?? (result.ok ? 200 : 500);
      res.status(status).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("[admin-distribution] publish failed", { itemId: id, message });
      res.status(500).json({ ok: false, itemId: id, error: message });
    }
  });

  // Publish all pending items in one shot (admin "publish all" button or cron).
  app.post("/api/admin/distribution/publish-pending", requireAdminSession, async (req: Request, res: Response) => {
    const limitRaw = Number(req.body?.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 25;

    try {
      const result = await publishPending({ limit });
      audit(req, "distribution.publishPending", "distribution_tray", "*", {
        attempted: result.attempted,
        ok: result.ok,
        failed: result.failed,
        skipped: result.skipped,
      });
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("[admin-distribution] publishPending failed", { message });
      res.status(500).json({ message });
    }
  });
}
