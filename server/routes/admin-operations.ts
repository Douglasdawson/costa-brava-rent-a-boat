import type { Express, Request } from "express";
import { storage } from "../storage";
import {
  insertMaintenanceLogSchema, updateMaintenanceLogSchema,
  insertBoatDocumentSchema, updateBoatDocumentSchema,
  insertInventoryItemSchema, updateInventoryItemSchema,
  insertInventoryMovementSchema,
} from "@shared/schema";
import { requireAdminSession, requireTabAccess } from "./auth";
import { logger } from "../lib/logger";

interface AuthenticatedRequest extends Request {
  adminUser?: {
    username: string;
    role?: string;
    tenantId?: string;
  };
}

export function registerAdminOperationsRoutes(app: Express) {
  // ===== MAINTENANCE LOGS =====

  app.get("/api/admin/maintenance", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const boatId = req.query.boatId as string | undefined;
      const logs = await storage.getMaintenanceLogs(boatId);
      res.json(logs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching maintenance logs", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/maintenance/upcoming", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const upcoming = await storage.getUpcomingMaintenance();
      res.json(upcoming);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching upcoming maintenance", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/maintenance", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const parsed = insertMaintenanceLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const adminUser = (req as AuthenticatedRequest).adminUser;
      const log = await storage.createMaintenanceLog({
        ...parsed.data,
        createdBy: adminUser?.username || "admin",
      });
      res.status(201).json({ success: true, log, message: "Mantenimiento registrado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error creating maintenance log", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.patch("/api/admin/maintenance/:id", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const parsed = updateMaintenanceLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const updated = await storage.updateMaintenanceLog(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Registro no encontrado" });
      res.json({ success: true, log: updated, message: "Mantenimiento actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error updating maintenance log", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/maintenance/:id", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const deleted = await storage.deleteMaintenanceLog(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Registro no encontrado" });
      res.json({ success: true, message: "Mantenimiento eliminado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error deleting maintenance log", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== BOAT DOCUMENTS =====

  app.get("/api/admin/documents", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const boatId = req.query.boatId as string | undefined;
      const docs = await storage.getBoatDocuments(boatId);
      res.json(docs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching documents", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/documents/expiring", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const expiring = await storage.getExpiringDocuments(days);
      res.json(expiring);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching expiring documents", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/documents", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const parsed = insertBoatDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const doc = await storage.createBoatDocument(parsed.data);
      res.status(201).json({ success: true, document: doc, message: "Documento registrado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error creating document", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.patch("/api/admin/documents/:id", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const parsed = updateBoatDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const updated = await storage.updateBoatDocument(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Documento no encontrado" });
      res.json({ success: true, document: updated, message: "Documento actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error updating document", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/documents/:id", requireAdminSession, requireTabAccess("maintenance"), async (req, res) => {
    try {
      const deleted = await storage.deleteBoatDocument(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Documento no encontrado" });
      res.json({ success: true, message: "Documento eliminado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error deleting document", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== INVENTORY =====

  app.get("/api/admin/inventory", requireAdminSession, requireTabAccess("inventory"), async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching inventory", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/inventory/low-stock", requireAdminSession, requireTabAccess("inventory"), async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching low stock items", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/inventory/:id", requireAdminSession, requireTabAccess("inventory"), async (req, res) => {
    try {
      const item = await storage.getInventoryItem(req.params.id);
      if (!item) return res.status(404).json({ message: "Item no encontrado" });
      res.json(item);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching inventory item", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/inventory", requireAdminSession, requireTabAccess("inventory"), async (req, res) => {
    try {
      const parsed = insertInventoryItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const item = await storage.createInventoryItem(parsed.data);
      res.status(201).json({ success: true, item, message: "Item creado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error creating inventory item", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.patch("/api/admin/inventory/:id", requireAdminSession, requireTabAccess("inventory"), async (req, res) => {
    try {
      const parsed = updateInventoryItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const updated = await storage.updateInventoryItem(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Item no encontrado" });
      res.json({ success: true, item: updated, message: "Item actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error updating inventory item", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/inventory/:id", requireAdminSession, requireTabAccess("inventory"), async (req, res) => {
    try {
      const deleted = await storage.deleteInventoryItem(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Item no encontrado" });
      res.json({ success: true, message: "Item eliminado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error deleting inventory item", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Inventory movements
  app.get("/api/admin/inventory/:id/movements", requireAdminSession, requireTabAccess("inventory"), async (req, res) => {
    try {
      const movements = await storage.getInventoryMovements(req.params.id);
      res.json(movements);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching movements", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/inventory/:id/movements", requireAdminSession, requireTabAccess("inventory"), async (req, res) => {
    try {
      const parsed = insertInventoryMovementSchema.safeParse({
        ...req.body,
        itemId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const adminUser = (req as AuthenticatedRequest).adminUser;
      const movement = await storage.createInventoryMovement({
        ...parsed.data,
        createdBy: adminUser?.username || "admin",
      });
      res.status(201).json({ success: true, movement, message: "Movimiento registrado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error creating movement", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
