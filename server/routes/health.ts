import fs from "fs";
import path from "path";
import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

// Prerender artifact status, computed once at startup (the directory is
// produced at build time and never changes while the process lives). Lets a
// post-deploy `curl /api/health` confirm whether the prerender step actually
// shipped HTML — the deploy of 2026-06-10 silently went out without it.
function computePrerenderedStatus(): { exists: boolean; files: number } {
  try {
    // Bundled prod: import.meta.dirname = dist/ → dist/prerendered.
    // Dev (tsx): server/routes → ../../dist/prerendered.
    const candidates = [
      path.resolve(import.meta.dirname, "prerendered"),
      path.resolve(import.meta.dirname, "..", "..", "dist", "prerendered"),
    ];
    const dir = candidates.find((c) => fs.existsSync(c));
    if (!dir) return { exists: false, files: 0 };
    let count = 0;
    const walk = (d: string): void => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".html")) count++;
      }
    };
    walk(dir);
    return { exists: count > 0, files: count };
  } catch {
    return { exists: false, files: 0 };
  }
}

const PRERENDERED_STATUS = computePrerenderedStatus();

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
        prerendered: PRERENDERED_STATUS,
      });
    } catch {
      res.status(503).json({
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: { status: "error", latencyMs: Date.now() - dbStart },
        prerendered: PRERENDERED_STATUS,
      });
    }
  });
}
