import type { Express } from "express";
import { storage } from "../storage";
import { insertPricingOverrideTemplateSchema } from "@shared/schema";
import { requireAdminSession, requireTabAccess } from "./auth";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";

const RESOURCE = "pricing_override_template";

const updateSchema = insertPricingOverrideTemplateSchema.partial();

export function registerAdminPricingOverrideTemplatesRoutes(app: Express) {
  // ===== LIST =====
  app.get(
    "/api/admin/pricing-override-templates",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (_req, res) => {
      try {
        const rows = await storage.listPricingOverrideTemplates();
        res.json(rows);
      } catch (error: unknown) {
        logger.error("[Admin] Error listing pricing override templates", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  // ===== CREATE =====
  app.post(
    "/api/admin/pricing-override-templates",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (req, res) => {
      try {
        const validation = insertPricingOverrideTemplateSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Datos inválidos",
            errors: validation.error.flatten().fieldErrors,
          });
        }
        const data = validation.data;
        const adjValue = parseFloat(data.adjustmentValue);
        if (data.adjustmentType === "multiplier" && (adjValue <= 0 || adjValue > 5)) {
          return res.status(400).json({
            message: "Para tipo 'multiplier', el valor debe estar entre 0.01 y 5",
          });
        }
        const created = await storage.createPricingOverrideTemplate(data);
        audit(req, "create", RESOURCE, created.id, { name: created.name });
        res.status(201).json(created);
      } catch (error: unknown) {
        logger.error("[Admin] Error creating pricing override template", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  // ===== UPDATE =====
  app.patch(
    "/api/admin/pricing-override-templates/:id",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (req, res) => {
      try {
        const validation = updateSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Datos inválidos",
            errors: validation.error.flatten().fieldErrors,
          });
        }
        const updated = await storage.updatePricingOverrideTemplate(req.params.id, validation.data);
        if (!updated) {
          return res.status(404).json({ message: "Plantilla no encontrada" });
        }
        audit(req, "update", RESOURCE, updated.id, { changes: Object.keys(validation.data) });
        res.json(updated);
      } catch (error: unknown) {
        logger.error("[Admin] Error updating pricing override template", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  // ===== SOFT DELETE =====
  app.delete(
    "/api/admin/pricing-override-templates/:id",
    requireAdminSession,
    requireTabAccess("pricing"),
    async (req, res) => {
      try {
        const deactivated = await storage.deactivatePricingOverrideTemplate(req.params.id);
        if (!deactivated) {
          return res.status(404).json({ message: "Plantilla no encontrada o ya inactiva" });
        }
        audit(req, "deactivate", RESOURCE, deactivated.id);
        res.json({ ok: true, id: deactivated.id });
      } catch (error: unknown) {
        logger.error("[Admin] Error deactivating pricing override template", {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({ message: "Error interno del servidor" });
      }
    },
  );

  logger.info("[Routes] Admin pricing override template routes registered");
}
