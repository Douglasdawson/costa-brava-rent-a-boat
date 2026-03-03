import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import Stripe from "stripe";

export function registerHealthRoutes(app: Express) {
  app.get("/api/health", async (_req, res) => {
    const services: Record<string, { status: string; latencyMs?: number }> = {};

    // Check DB
    const dbStart = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      services.database = { status: "ok", latencyMs: Date.now() - dbStart };
    } catch {
      services.database = { status: "error", latencyMs: Date.now() - dbStart };
    }

    // Check Stripe
    const stripeStart = Date.now();
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        services.stripe = { status: "not_configured" };
      } else {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.balance.retrieve();
        services.stripe = { status: "ok", latencyMs: Date.now() - stripeStart };
      }
    } catch {
      services.stripe = { status: "error", latencyMs: Date.now() - stripeStart };
    }

    // Check SendGrid (just verify env var presence)
    services.sendgrid = {
      status: process.env.SENDGRID_API_KEY ? "configured" : "not_configured",
    };

    // Check Twilio
    services.twilio = {
      status: process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
        ? "configured"
        : "not_configured",
    };

    const allOk = Object.values(services).every(
      (s) => s.status === "ok" || s.status === "configured" || s.status === "not_configured"
    );

    res.status(allOk ? 200 : 503).json({
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services,
    });
  });
}
