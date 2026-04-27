import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { calculatePricingBreakdown, type Duration } from "@shared/pricing";
import { logger } from "../lib/logger";

const VALID_DURATIONS: Duration[] = ["1h", "2h", "3h", "4h", "6h", "8h"];

const calendarQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from debe ser YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to debe ser YYYY-MM-DD"),
  boatId: z.string().min(1, "boatId requerido"),
  duration: z.enum(["1h", "2h", "3h", "4h", "6h", "8h"]),
});

const MAX_RANGE_DAYS = 120; // sensible cap to avoid huge responses

export function registerPricingRoutes(app: Express) {
  app.get("/api/pricing/calendar", async (req, res) => {
    try {
      const validation = calendarQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          message: "Parámetros inválidos",
          errors: validation.error.flatten().fieldErrors,
        });
      }
      const { from, to, boatId, duration } = validation.data;

      const fromDate = new Date(`${from}T00:00:00Z`);
      const toDate = new Date(`${to}T00:00:00Z`);
      if (toDate < fromDate) {
        return res.status(400).json({ message: "to debe ser igual o posterior a from" });
      }
      const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
      if (rangeDays > MAX_RANGE_DAYS) {
        return res.status(400).json({
          message: `Rango demasiado grande (${rangeDays} días). Máximo permitido: ${MAX_RANGE_DAYS}.`,
        });
      }

      // Load all overrides that overlap [from, to] for this boat (single query)
      const overrides = await storage.loadActiveOverridesForRange(from, to, boatId);

      const days: Array<{
        date: string;
        basePrice: number;
        finalPrice: number;
        hasOverride: boolean;
        overrideLabel?: string;
      }> = [];

      for (let i = 0; i < rangeDays; i++) {
        const day = new Date(fromDate.getTime() + i * 86400000);
        const dateStr = day.toISOString().slice(0, 10);
        try {
          const breakdown = calculatePricingBreakdown(boatId, day, duration as Duration, [], [], overrides);
          days.push({
            date: dateStr,
            basePrice: breakdown.basePriceBeforeOverride ?? breakdown.basePrice,
            finalPrice: breakdown.basePrice,
            hasOverride: !!breakdown.appliedOverride,
            ...(breakdown.appliedOverride ? { overrideLabel: breakdown.appliedOverride.label } : {}),
          });
        } catch {
          // Out of operational season or unknown boat → skip
        }
      }

      res.set("Cache-Control", "public, max-age=300");
      res.json({ boatId, duration, days });
    } catch (error: unknown) {
      logger.error("[Public] Error computing pricing calendar", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  logger.info("[Routes] Public pricing routes registered");
}
