import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

export function registerHealthRoutes(app: Express) {
  // Lightweight liveness probe used by deployment platform.
  // Always returns 200 while the process is alive.
  app.get("/api/health/live", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Readiness probe — only the database is a hard dependency.
  app.get("/api/health", async (_req, res) => {
    const dbStart = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: { status: "ok", latencyMs: Date.now() - dbStart },
      });
    } catch {
      res.status(503).json({
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: { status: "error", latencyMs: Date.now() - dbStart },
      });
    }
  });
}
