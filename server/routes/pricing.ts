import type { Express } from "express";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { storage } from "../storage";
import {
  calculatePricingBreakdown,
  COVERAGE_PRICES_FALLBACK,
  type CoveragePrices,
  type Duration,
} from "@shared/pricing";
import { logger } from "../lib/logger";

const VALID_DURATIONS: Duration[] = ["1h", "2h", "3h", "4h", "6h", "8h"];

// Coverage prices are owned by the CRM (configuracion_general, clave/valor) so
// the owner edits them in one place instead of two deploys. Read-only over the
// same connection string as the availability bridge, cached, and any failure
// silently yields the shared fallback — the wizard must never wait on the CRM.
type NumericCoverageField = "weatherPrice" | "depositPriceSL" | "depositAmountSL" | "depositPriceCL" | "depositAmountCL";
const COVERAGE_KEY_FIELD: Record<string, NumericCoverageField> = {
  GARANTIA_METEO_PRECIO: "weatherPrice",
  FIANZA_REDUCIDA_PRECIO_SL: "depositPriceSL",
  FIANZA_REDUCIDA_IMPORTE_SL: "depositAmountSL",
  FIANZA_REDUCIDA_PRECIO_CL: "depositPriceCL",
  FIANZA_REDUCIDA_IMPORTE_CL: "depositAmountCL",
};
const COVERAGE_TTL_MS = 5 * 60 * 1000;
let coverageCache: { at: number; data: CoveragePrices } | null = null;

async function getCoveragePrices(): Promise<CoveragePrices> {
  if (coverageCache && Date.now() - coverageCache.at < COVERAGE_TTL_MS) return coverageCache.data;

  const data: CoveragePrices = { ...COVERAGE_PRICES_FALLBACK };
  const url = process.env.CRMDAMAR_DATABASE_URL;
  if (url) {
    try {
      const sql = neon(url);
      const rows = (await sql`
        SELECT clave, valor FROM configuracion_general
        WHERE clave = ANY(${Object.keys(COVERAGE_KEY_FIELD)})`) as Array<Record<string, unknown>>;
      for (const row of rows) {
        const field = COVERAGE_KEY_FIELD[String(row.clave)];
        const value = Number(String(row.valor ?? "").replace(",", "."));
        if (field && Number.isFinite(value) && value >= 0) data[field] = value;
      }

      // Standard deposit straight from the CRM fleet, not from the funnel's
      // static catalog: shared/boatData.ts still carries 250€/300€ figures that
      // production replaced with a flat 200€ (and boat names that no longer
      // match), so quoting it would show the customer a deposit different from
      // the one they sign for. Same failure mode as the availability name drift.
      const deposits = (await sql`
        SELECT requiere_licencia, MIN(deposito) AS min, MAX(deposito) AS max
        FROM barcos WHERE activo = true GROUP BY requiere_licencia`) as Array<Record<string, unknown>>;
      for (const row of deposits) {
        const min = Number(row.min);
        const max = Number(row.max);
        if (!Number.isFinite(min) || !Number.isFinite(max)) continue;
        const label = min === max ? `${min}€` : `${min}-${max}€`;
        if (row.requiere_licencia) data.depositStandardCL = label;
        else data.depositStandardSL = label;
      }
    } catch (error) {
      logger.warn("[pricing] coverage prices query error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  coverageCache = { at: Date.now(), data };
  return data;
}

const calendarQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from debe ser YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to debe ser YYYY-MM-DD"),
  boatId: z.string().min(1, "boatId requerido"),
  duration: z.enum(["1h", "2h", "3h", "4h", "6h", "8h"]),
});

const MAX_RANGE_DAYS = 120; // sensible cap to avoid huge responses

export function registerPricingRoutes(app: Express) {
  app.get("/api/coverage-prices", async (_req, res) => {
    res.json(await getCoveragePrices());
  });

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
