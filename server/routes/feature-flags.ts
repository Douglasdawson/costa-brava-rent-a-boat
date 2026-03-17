import type { Express } from "express";
import { storage } from "../storage";
import { logger } from "../lib/logger";
import { requireSaasAuth, requireOwner } from "./auth-middleware";
import type { AuthenticatedRequest } from "../types";
import {
  insertGlobalFeatureFlagSchema,
  updateGlobalFeatureFlagSchema,
  upsertFeatureFlagSchema,
} from "@shared/schema";
import { z } from "zod";

export function registerFeatureFlagRoutes(app: Express) {
  // ===== PUBLIC / TENANT ENDPOINTS =====

  /**
   * GET /api/features
   * Returns resolved feature flags for the current tenant (from JWT).
   * Public endpoint but requires SaaS auth to identify the tenant.
   * Cached on server side (60s TTL) and client side (Cache-Control).
   */
  app.get("/api/features", requireSaasAuth, async (req, res) => {
    try {
      const { tenantId } = req as AuthenticatedRequest;
      if (!tenantId) {
        return res.status(400).json({ message: "No se pudo determinar el tenant" });
      }

      const flags = await storage.getFeatureFlagsForTenant(tenantId);

      // Only return enabled/disabled state and name (lean payload)
      const result = flags.map((f) => ({
        name: f.name,
        enabled: f.enabled,
      }));

      res.set("Cache-Control", "private, max-age=60");
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[FeatureFlags] Error fetching features for tenant", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * GET /api/features/:name
   * Check if a specific feature is enabled for the current tenant.
   */
  app.get("/api/features/:name", requireSaasAuth, async (req, res) => {
    try {
      const { tenantId } = req as AuthenticatedRequest;
      if (!tenantId) {
        return res.status(400).json({ message: "No se pudo determinar el tenant" });
      }

      const nameParam = z.string().min(1).max(100).safeParse(req.params.name);
      if (!nameParam.success) {
        return res.status(400).json({ message: "Nombre de flag invalido" });
      }

      const enabled = await storage.isFeatureEnabled(tenantId, nameParam.data);

      res.set("Cache-Control", "private, max-age=60");
      res.json({ name: nameParam.data, enabled });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[FeatureFlags] Error checking feature", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== ADMIN ENDPOINTS (Tenant admins) =====

  /**
   * GET /api/admin/features
   * List all flags for the current tenant (global + overrides, fully resolved).
   */
  app.get("/api/admin/features", requireSaasAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.tenantId) {
        return res.status(400).json({ message: "No se pudo determinar el tenant" });
      }

      // Only admin/owner can view all flags
      if (authReq.saasUser?.role !== "admin" && authReq.saasUser?.role !== "owner") {
        return res.status(403).json({ message: "Se requiere rol de administrador" });
      }

      const [resolved, overrides, globalFlags] = await Promise.all([
        storage.getFeatureFlagsForTenant(authReq.tenantId),
        storage.getTenantFlags(authReq.tenantId),
        storage.getGlobalFlags(),
      ]);

      // Build enriched view: resolved state + whether there's a tenant override
      const overrideMap = new Map(overrides.map((o) => [o.name, o]));
      const globalMap = new Map(globalFlags.map((g) => [g.name, g]));

      const enriched = resolved.map((flag) => ({
        name: flag.name,
        enabled: flag.enabled,
        description: flag.description,
        hasOverride: overrideMap.has(flag.name),
        override: overrideMap.get(flag.name) ?? null,
        global: globalMap.get(flag.name) ?? null,
      }));

      res.json(enriched);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[FeatureFlags] Error listing admin features", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * PUT /api/admin/features/:name
   * Create or update a per-tenant feature flag override.
   */
  app.put("/api/admin/features/:name", requireSaasAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.tenantId) {
        return res.status(400).json({ message: "No se pudo determinar el tenant" });
      }

      if (authReq.saasUser?.role !== "admin" && authReq.saasUser?.role !== "owner") {
        return res.status(403).json({ message: "Se requiere rol de administrador" });
      }

      const nameParam = z.string().min(1).max(100).safeParse(req.params.name);
      if (!nameParam.success) {
        return res.status(400).json({ message: "Nombre de flag invalido" });
      }

      const parsed = upsertFeatureFlagSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues.map((i) => i.message).join(", "),
        });
      }

      const result = await storage.setFeatureFlag(authReq.tenantId, nameParam.data, parsed.data);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[FeatureFlags] Error setting feature flag", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * DELETE /api/admin/features/:name
   * Remove a tenant-specific override (reverts to global default).
   */
  app.delete("/api/admin/features/:name", requireSaasAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.tenantId) {
        return res.status(400).json({ message: "No se pudo determinar el tenant" });
      }

      if (authReq.saasUser?.role !== "admin" && authReq.saasUser?.role !== "owner") {
        return res.status(403).json({ message: "Se requiere rol de administrador" });
      }

      const nameParam = z.string().min(1).max(100).safeParse(req.params.name);
      if (!nameParam.success) {
        return res.status(400).json({ message: "Nombre de flag invalido" });
      }

      const deleted = await storage.deleteTenantFlag(authReq.tenantId, nameParam.data);
      if (!deleted) {
        return res.status(404).json({ message: "Override no encontrado" });
      }

      res.json({ message: "Override eliminado, se usara el valor global" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[FeatureFlags] Error deleting feature flag override", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== SUPER ADMIN ENDPOINTS (Platform owner) =====

  /**
   * GET /api/super-admin/features
   * List all global feature flags.
   */
  app.get("/api/super-admin/features", requireOwner, async (_req, res) => {
    try {
      const flags = await storage.getGlobalFlags();
      res.json(flags);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[FeatureFlags] Error listing global flags", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * POST /api/super-admin/features
   * Create a new global feature flag.
   */
  app.post("/api/super-admin/features", requireOwner, async (req, res) => {
    try {
      const parsed = insertGlobalFeatureFlagSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues.map((i) => i.message).join(", "),
        });
      }

      const created = await storage.createGlobalFlag(parsed.data);
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("unique") || message.includes("duplicate")) {
        return res.status(409).json({ message: "Ya existe un flag global con ese nombre" });
      }
      logger.error("[FeatureFlags] Error creating global flag", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * PUT /api/super-admin/features/:name
   * Update an existing global feature flag.
   */
  app.put("/api/super-admin/features/:name", requireOwner, async (req, res) => {
    try {
      const nameParam = z.string().min(1).max(100).safeParse(req.params.name);
      if (!nameParam.success) {
        return res.status(400).json({ message: "Nombre de flag invalido" });
      }

      const parsed = updateGlobalFeatureFlagSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues.map((i) => i.message).join(", "),
        });
      }

      const updated = await storage.updateGlobalFlag(nameParam.data, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Flag global no encontrado" });
      }

      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[FeatureFlags] Error updating global flag", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * DELETE /api/super-admin/features/:name
   * Delete a global feature flag and all tenant overrides.
   */
  app.delete("/api/super-admin/features/:name", requireOwner, async (req, res) => {
    try {
      const nameParam = z.string().min(1).max(100).safeParse(req.params.name);
      if (!nameParam.success) {
        return res.status(400).json({ message: "Nombre de flag invalido" });
      }

      const deleted = await storage.deleteGlobalFlag(nameParam.data);
      if (!deleted) {
        return res.status(404).json({ message: "Flag global no encontrado" });
      }

      res.json({ message: "Flag global y todas las overrides eliminadas" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[FeatureFlags] Error deleting global flag", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
