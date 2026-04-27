import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertPricingOverrideSchema } from "@shared/schema";
import { requireAdminSession, requireTabAccess } from "./auth";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";

const RESOURCE = "pricing_override";

const listFiltersSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  boatId: z.string().min(1).optional(),
  includeInactive: z.union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
});

const updatePricingOverrideSchema = insertPricingOverrideSchema.partial();

const applyTemplateSchema = z.object({
  year: z.number().int().min(2024).max(2099).optional(),
});

type TemplateBuilder = (year: number) => z.infer<typeof insertPricingOverrideSchema>;

const TEMPLATES: Record<string, TemplateBuilder> = {
  peak_august: (year) => ({
    boatId: null,
    dateStart: `${year}-08-01`,
    dateEnd: `${year}-08-17`,
    weekdayFilter: null,
    direction: "surcharge",
    adjustmentType: "multiplier",
    adjustmentValue: "0.25",
    label: `Pico agosto ${year} (+25%)`,
    notes: "Plantilla automática basada en el análisis 2020-2025: la 1ª-2ª semana de agosto concentra el pico real de demanda.",
    priority: 10,
    isActive: true,
    tenantId: null,
  }),
  weekends_jun_jul: (year) => ({
    boatId: null,
    dateStart: `${year}-06-01`,
    dateEnd: `${year}-07-31`,
    weekdayFilter: [0, 6], // Sun + Sat
    direction: "surcharge",
    adjustmentType: "multiplier",
    adjustmentValue: "0.15",
    label: `Findes junio-julio ${year} (+15%)`,
    notes: "Plantilla automática: en jun/jul los findes venden 1.7-5.7x más que entresemana (datos 2020-2025).",
    priority: 5,
    isActive: true,
    tenantId: null,
  }),
  asuncion_aug15: (year) => ({
    boatId: null,
    dateStart: `${year}-08-15`,
    dateEnd: `${year}-08-15`,
    weekdayFilter: null,
    direction: "surcharge",
    adjustmentType: "multiplier",
    adjustmentValue: "0.30",
    label: `Asunción ${year} (+30%)`,
    notes: "Festivo nacional. Día con consistente alta demanda los 6 años analizados (top 3 del verano).",
    priority: 20,
    isActive: true,
    tenantId: null,
  }),
};

export function registerAdminPricingOverridesRoutes(app: Express) {
  // ===== LIST =====
  app.get(
    "/api/admin/pricing-overrides",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (req, res) => {
      try {
        const validation = listFiltersSchema.safeParse(req.query);
        if (!validation.success) {
          return res.status(400).json({
            message: "Parámetros inválidos",
            errors: validation.error.flatten().fieldErrors,
          });
        }
        const overrides = await storage.listPricingOverrides(validation.data);
        res.json(overrides);
      } catch (error: unknown) {
        logger.error("[Admin] Error listing pricing overrides", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  // ===== GET ONE =====
  app.get(
    "/api/admin/pricing-overrides/:id",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (req, res) => {
      try {
        const row = await storage.getPricingOverride(req.params.id);
        if (!row) {
          return res.status(404).json({ message: "Override no encontrado" });
        }
        res.json(row);
      } catch (error: unknown) {
        logger.error("[Admin] Error fetching pricing override", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  // ===== CREATE =====
  app.post(
    "/api/admin/pricing-overrides",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (req, res) => {
      try {
        const validation = insertPricingOverrideSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Datos inválidos",
            errors: validation.error.flatten().fieldErrors,
          });
        }
        const data = validation.data;

        // Business rules
        if (new Date(data.dateEnd) < new Date(data.dateStart)) {
          return res.status(400).json({
            message: "dateEnd debe ser igual o posterior a dateStart",
          });
        }
        const adjValue = parseFloat(data.adjustmentValue);
        if (data.adjustmentType === "multiplier" && (adjValue <= 0 || adjValue > 5)) {
          return res.status(400).json({
            message: "Para tipo 'multiplier', el valor debe estar entre 0.01 y 5",
          });
        }

        const created = await storage.createPricingOverride(data);
        audit(req, "create", RESOURCE, created.id, { label: created.label });
        res.status(201).json(created);
      } catch (error: unknown) {
        logger.error("[Admin] Error creating pricing override", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  // ===== UPDATE =====
  app.patch(
    "/api/admin/pricing-overrides/:id",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (req, res) => {
      try {
        const validation = updatePricingOverrideSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Datos inválidos",
            errors: validation.error.flatten().fieldErrors,
          });
        }
        const updated = await storage.updatePricingOverride(req.params.id, validation.data);
        if (!updated) {
          return res.status(404).json({ message: "Override no encontrado" });
        }
        audit(req, "update", RESOURCE, updated.id, { changes: Object.keys(validation.data) });
        res.json(updated);
      } catch (error: unknown) {
        logger.error("[Admin] Error updating pricing override", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  // ===== SOFT DELETE =====
  app.delete(
    "/api/admin/pricing-overrides/:id",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (req, res) => {
      try {
        const deactivated = await storage.deactivatePricingOverride(req.params.id);
        if (!deactivated) {
          return res.status(404).json({ message: "Override no encontrado" });
        }
        audit(req, "deactivate", RESOURCE, deactivated.id);
        res.json({ ok: true, id: deactivated.id });
      } catch (error: unknown) {
        logger.error("[Admin] Error deactivating pricing override", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  // ===== APPLY TEMPLATE =====
  app.post(
    "/api/admin/pricing-overrides/templates/:templateId/apply",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (req, res) => {
      try {
        const builder = TEMPLATES[req.params.templateId];
        if (!builder) {
          return res.status(404).json({
            message: `Plantilla desconocida: ${req.params.templateId}`,
            availableTemplates: Object.keys(TEMPLATES),
          });
        }
        const validation = applyTemplateSchema.safeParse(req.body ?? {});
        if (!validation.success) {
          return res.status(400).json({
            message: "Datos inválidos",
            errors: validation.error.flatten().fieldErrors,
          });
        }
        const year = validation.data.year ?? new Date().getFullYear();
        const data = builder(year);
        const created = await storage.createPricingOverride(data);
        audit(req, "apply_template", RESOURCE, created.id, {
          templateId: req.params.templateId,
          year,
        });
        res.status(201).json(created);
      } catch (error: unknown) {
        logger.error("[Admin] Error applying pricing override template", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  logger.info("[Routes] Admin pricing overrides routes registered");
}
