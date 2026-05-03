/**
 * Admin endpoint — SEO pilot measurement history.
 *
 * GET /api/admin/seo-pilots             → list latest 50 runs
 * GET /api/admin/seo-pilots/:pilotKey   → all runs for one pilot
 * POST /api/admin/seo-pilots/run-now    → manually trigger the runner (for testing)
 *
 * Requires admin session. Reads from seo_pilot_runs (populated by the cron
 * in server/seo/worker.ts → server/seo/pilotRunner.ts).
 */

import type { Express, Request, Response } from "express";
import { eq, desc } from "drizzle-orm";
import { requireAdminSession } from "./auth-middleware";
import { db } from "../db";
import { seoPilotRuns } from "../../shared/schema";
import { logger } from "../lib/logger";

export function registerAdminSeoPilotsRoutes(app: Express): void {
  app.get("/api/admin/seo-pilots", requireAdminSession, async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(seoPilotRuns)
        .orderBy(desc(seoPilotRuns.ranAt))
        .limit(50);
      res.json({ count: rows.length, runs: rows });
    } catch (err) {
      logger.error("[admin-seo-pilots] list failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "failed to list pilot runs" });
    }
  });

  app.get("/api/admin/seo-pilots/:pilotKey", requireAdminSession, async (req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(seoPilotRuns)
        .where(eq(seoPilotRuns.pilotKey, req.params.pilotKey))
        .orderBy(desc(seoPilotRuns.scheduledFor));
      res.json({ count: rows.length, runs: rows });
    } catch (err) {
      logger.error("[admin-seo-pilots] get failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "failed to get pilot runs" });
    }
  });

  app.post("/api/admin/seo-pilots/run-now", requireAdminSession, async (_req: Request, res: Response) => {
    try {
      const { runDuePilots } = await import("../seo/pilotRunner");
      const result = await runDuePilots();
      res.json(result);
    } catch (err) {
      logger.error("[admin-seo-pilots] run-now failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "run failed" });
    }
  });
}
