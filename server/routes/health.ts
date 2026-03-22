import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import * as Sentry from "@sentry/node";

export function registerHealthRoutes(app: Express) {
  // Lightweight liveness probe used by deployment platform.
  // Always returns 200 while the process is alive.
  app.get("/api/health/live", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Readiness probe — only the database is a hard dependency.
  // Third-party services (Stripe, SendGrid, Twilio, Sentry) are informational
  // only and never cause a 503, because their availability at startup time
  // is not required for the application to serve requests.
  app.get("/api/health", async (_req, res) => {
    const services: Record<string, { status: string; latencyMs?: number }> = {};

    // ── Database (only hard dependency) ──────────────────────────────────────
    const dbStart = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      services.database = { status: "ok", latencyMs: Date.now() - dbStart };
    } catch {
      services.database = { status: "error", latencyMs: Date.now() - dbStart };
    }

    // ── Third-party integrations (informational — no API calls) ──────────────
    services.stripe = {
      status: process.env.STRIPE_SECRET_KEY ? "configured" : "not_configured",
    };

    services.sendgrid = {
      status: process.env.SENDGRID_API_KEY ? "configured" : "not_configured",
    };

    services.twilio = {
      status:
        process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
          ? "configured"
          : "not_configured",
    };

    services.sentry = {
      status: Sentry.getClient() ? "ok" : "not_configured",
    };

    // Only treat the database being down as a hard failure.
    const dbOk = services.database.status === "ok";

    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services,
    });
  });
}
