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

// Boat tipology — based on demand analysis 2020-2025 (see PDF for Damián v2).
// Used to power the "differentiated" templates: each boat type gets a different
// surcharge so we capture more revenue where demand is saturated (CORE) and
// don't push away customers where boats already linger unsold (PREMIUM, MINGOLLA).
const BOAT_GROUPS = {
  CORE: ["solar-450", "remus-450", "remus-450-ii", "astec-400", "astec-480"],
  PREMIUM: ["trimarchi-57s", "pacific-craft-625"],
  SECONDARY: ["mingolla-brava-19"],
  SPECIAL: ["excursion-privada"],
} as const;

type OverrideSpec = z.infer<typeof insertPricingOverrideSchema>;
// A template can return one or many overrides (multi-override templates power
// the differentiated strategy: a single click creates several rows in the DB).
type TemplateBuilder = (year: number) => OverrideSpec | OverrideSpec[];

const TEMPLATES: Record<string, TemplateBuilder> = {
  // ===== UNIFORM templates (one override per template) =====
  peak_august: (year) => ({
    boatId: null,
    dateStart: `${year}-08-01`,
    dateEnd: `${year}-08-17`,
    weekdayFilter: null,
    direction: "surcharge",
    adjustmentType: "multiplier",
    adjustmentValue: "0.10",
    label: `Pico agosto ${year} (+10%)`,
    notes: "Plantilla uniforme: +10% a todos los barcos durante los 17 días pico. Captura menos revenue que la diferenciada pero más simple.",
    priority: 10,
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
    adjustmentValue: "0.15",
    label: `Asunción ${year} (+15%)`,
    notes: "Plantilla uniforme: +15% a todos los barcos el 15 ago.",
    priority: 20,
    isActive: true,
    tenantId: null,
  }),

  // ===== DIFFERENTIATED templates (multi-override) =====
  // These create one override per boat with a percentage matched to its demand profile.
  peak_august_differentiated: (year) => {
    const dateStart = `${year}-08-01`;
    const dateEnd = `${year}-08-17`;
    const make = (boatId: string, value: string, suffix: string): OverrideSpec => ({
      boatId,
      dateStart,
      dateEnd,
      weekdayFilter: null,
      direction: "surcharge",
      adjustmentType: "multiplier",
      adjustmentValue: value,
      label: `Pico agosto ${year} ${suffix}`,
      notes: "Plantilla diferenciada por tipo de barco. Captura más revenue en barcos core (saturados) sin arriesgar reservas en premium / secundarios (sensibles a precio).",
      priority: 10,
      isActive: true,
      tenantId: null,
    });
    return [
      ...BOAT_GROUPS.CORE.map((id) => make(id, "0.15", "(CORE +15%)")),
      ...BOAT_GROUPS.PREMIUM.map((id) => make(id, "0.05", "(PREMIUM +5%)")),
      // SECONDARY (Mingolla) and SPECIAL (Excursión) get nothing in the peak template;
      // SPECIAL has its own permanent promo template below.
    ];
  },
  asuncion_differentiated: (year) => {
    const date = `${year}-08-15`;
    const make = (boatId: string, value: string, suffix: string): OverrideSpec => ({
      boatId,
      dateStart: date,
      dateEnd: date,
      weekdayFilter: null,
      direction: "surcharge",
      adjustmentType: "multiplier",
      adjustmentValue: value,
      label: `Asunción ${year} ${suffix}`,
      notes: "Plantilla diferenciada Asunción. Festivo top-3 del verano según los 6 años analizados.",
      priority: 25, // wins over the differentiated peak template (priority 10)
      isActive: true,
      tenantId: null,
    });
    return [
      ...BOAT_GROUPS.CORE.map((id) => make(id, "0.20", "(CORE +20%)")),
      ...BOAT_GROUPS.PREMIUM.map((id) => make(id, "0.10", "(PREMIUM +10%)")),
      ...BOAT_GROUPS.SECONDARY.map((id) => make(id, "0.05", "(SEC +5%)")),
    ];
  },

  // ===== PROMO template (discount, indefinite range) =====
  // Pacific + capitán sobra el 88% de los días pico — no es problema de precio,
  // es problema de producto. Una promo permanente del -10% por si acaso ayuda a colocar.
  pacific_capitan_promo: (year) => ({
    boatId: "excursion-privada",
    dateStart: `${year}-04-01`,
    dateEnd: `${year}-10-31`,
    weekdayFilter: null,
    direction: "discount",
    adjustmentType: "multiplier",
    adjustmentValue: "0.10",
    label: `Promo Pacific+capitán ${year} (−10%)`,
    notes: "Promoción permanente para Excursión Privada con Capitán. Sobra el 88% de días pico — bajamos precio para llenar los pocos huecos que se vendan.",
    priority: 5,
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
        const specs = Array.isArray(data) ? data : [data];
        const created: Awaited<ReturnType<typeof storage.createPricingOverride>>[] = [];
        for (const spec of specs) {
          const row = await storage.createPricingOverride(spec);
          created.push(row);
        }
        audit(req, "apply_template", RESOURCE, created.map((c) => c.id).join(","), {
          templateId: req.params.templateId,
          year,
          createdCount: created.length,
        });
        // Backwards-compatible response shape:
        // - Single-override templates return the override object directly (legacy clients).
        // - Multi-override templates return { count, overrides }.
        if (created.length === 1) {
          res.status(201).json(created[0]);
        } else {
          res.status(201).json({ count: created.length, overrides: created });
        }
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
