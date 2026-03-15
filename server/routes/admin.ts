import type { Express } from "express";
import { storage } from "../storage";
import { insertTenantSchema, updateTenantSchema } from "@shared/schema";
import { requireAdminSession } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";
import { registerAdminFleetRoutes } from "./admin-fleet";
import { registerAdminBookingRoutes } from "./admin-bookings";
import { registerAdminCustomerRoutes } from "./admin-customers";
import { registerAdminStatsRoutes } from "./admin-stats";
import { registerAdminOperationsRoutes } from "./admin-operations";
import { registerAdminMarketingRoutes } from "./admin-marketing";
import { registerSeoRoutes } from "./admin-seo";
import { logger } from "../lib/logger";

export function registerAdminRoutes(app: Express) {
  // Delegate to domain-specific route modules
  registerAdminFleetRoutes(app);
  registerAdminBookingRoutes(app);
  registerAdminCustomerRoutes(app);
  registerAdminStatsRoutes(app);
  registerAdminOperationsRoutes(app);
  registerAdminMarketingRoutes(app);
  registerSeoRoutes(app);

  // ===== OBJECT STORAGE =====

  app.get("/objects/:objectPath(*)", requireAdminSession, async (req, res) => {
    const objectPath = req.params.objectPath;
    // Reject path traversal attempts
    if (objectPath.includes('..') || objectPath.includes('\0')) {
      return res.status(400).json({ message: "Ruta no valida" });
    }

    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      logger.error("Error serving object", { error: error instanceof Error ? error.message : String(error) });
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // ===== BLOG SEED =====

  app.post("/api/admin/seed-blog", requireAdminSession, async (req, res) => {
    try {
      const { seedBlogPosts } = await import("../seeds/blogSeed");
      const created = await seedBlogPosts(storage);
      res.json({
        message: "Blog seed completed",
        created,
        total: 6,
      });
    } catch (error: unknown) {
      logger.error("[Admin] Error seeding blog posts", { error: error instanceof Error ? error.message : error });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== TENANT MANAGEMENT =====

  // Seed default tenant and migrate existing data
  app.post("/api/admin/seed-tenant", requireAdminSession, async (req, res) => {
    try {
      const tenant = await storage.seedDefaultTenant();
      res.json({
        success: true,
        tenant,
        message: "Tenant creado y datos migrados correctamente",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error seeding tenant", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get all tenants
  app.get("/api/admin/tenants", requireAdminSession, async (req, res) => {
    try {
      const allTenants = await storage.getAllTenants();
      res.json(allTenants);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching tenants", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get tenant by ID
  app.get("/api/admin/tenants/:id", requireAdminSession, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.params.id);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
      res.json(tenant);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching tenant", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Create tenant
  app.post("/api/admin/tenants", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const tenant = await storage.createTenant(parsed.data);
      res.status(201).json({ success: true, tenant, message: "Tenant creado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error creating tenant", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update tenant
  app.patch("/api/admin/tenants/:id", requireAdminSession, async (req, res) => {
    try {
      const parsed = updateTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const updated = await storage.updateTenant(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Tenant no encontrado" });
      res.json({ success: true, tenant: updated, message: "Tenant actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error updating tenant", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
