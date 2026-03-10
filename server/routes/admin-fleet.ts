import type { Express } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { storage } from "../storage";
import { insertBoatSchema, updateBoatSchema, boats } from "@shared/schema";
import { requireAdminSession } from "./auth";
import { ObjectStorageService } from "../objectStorage";
import { logger } from "../lib/logger";
import { db } from "../db";

const boatReorderSchema = z.object({
  order: z.array(z.object({
    id: z.string().min(1),
    displayOrder: z.number().int().min(0),
  })).min(1, "Orden requerido"),
});

const normalizeImageSchema = z.object({
  imageUrl: z.string().min(1, "imageUrl es requerido"),
});

export function registerAdminFleetRoutes(app: Express) {
  // ===== BOAT MANAGEMENT =====

  // Get ALL boats (including inactive) for CRM
  app.get("/api/admin/boats", requireAdminSession, async (req, res) => {
    try {
      const allBoats = await db.select().from(boats).orderBy(boats.displayOrder);
      res.json(allBoats);
    } catch (error: unknown) {
      logger.error("[Admin] Error fetching all boats", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/boats", requireAdminSession, async (req, res) => {
    try {
      const validationResult = insertBoatSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }
      const newBoat = await storage.createBoat(validationResult.data);
      res.status(201).json(newBoat);
    } catch (error: unknown) {
      logger.error("[Admin] Error creating boat", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.patch("/api/admin/boats/:id", requireAdminSession, async (req, res) => {
    try {
      const existingBoat = await storage.getBoat(req.params.id);
      if (!existingBoat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }
      const parsed = updateBoatSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const updatedBoat = await storage.updateBoat(req.params.id, parsed.data);
      res.json(updatedBoat);
    } catch (error: unknown) {
      logger.error("[Admin] Error updating boat", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/boats/:id", requireAdminSession, async (req, res) => {
    try {
      const existingBoat = await storage.getBoat(req.params.id);
      if (!existingBoat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }
      await db.delete(boats).where(eq(boats.id, req.params.id));
      res.json({ message: "Barco eliminado correctamente" });
    } catch (error: unknown) {
      logger.error("[Admin] Error deleting boat", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/boats/reorder", requireAdminSession, async (req, res) => {
    try {
      const parsed = boatReorderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { order } = parsed.data;
      for (const item of order) {
        await storage.updateBoat(item.id, { displayOrder: item.displayOrder });
      }
      res.json({ message: "Orden actualizado correctamente" });
    } catch (error: unknown) {
      logger.error("[Admin] Error reordering boats", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/init-boats", requireAdminSession, async (req, res) => {
    try {
      const { BOAT_DATA } = await import("@shared/boatData");

      const boatsToCreate = Object.values(BOAT_DATA).map((boat: any) => {
        const capacityMatch = boat.specifications.capacity.match(/(\d+)/);
        const capacity = capacityMatch ? parseInt(capacityMatch[1]) : 5;
        const depositMatch = boat.specifications.deposit.match(/(\d+)/);
        const deposit = depositMatch ? `${depositMatch[1]}.00` : "0.00";
        const requiresLicense = ["pacific-craft-625", "trimarchi-57s", "mingolla-brava-19"].includes(
          boat.id
        );

        return {
          id: boat.id,
          name: boat.name,
          capacity: capacity,
          requiresLicense: requiresLicense,
          deposit: deposit,
          isActive: true,
          imageUrl: boat.image || null,
          imageGallery: [],
          subtitle: boat.subtitle,
          description: boat.description,
          specifications: boat.specifications,
          equipment: boat.equipment,
          included: boat.included,
          features: boat.features,
          pricing: boat.pricing,
          extras: boat.extras,
        };
      });

      const createdBoats = [];
      for (const boatData of boatsToCreate) {
        try {
          const boat = await storage.createBoat(boatData);
          createdBoats.push(boat);
        } catch (error: unknown) {
          logger.warn("Boat might already exist", { boatId: boatData.id, error: error instanceof Error ? error.message : String(error) });
        }
      }

      res.json({
        message: "Boats initialization completed",
        created: createdBoats.length,
        total: boatsToCreate.length,
      });
    } catch (error: unknown) {
      logger.error("[Admin] Error initializing boats", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== IMAGE UPLOAD =====

  app.post("/api/admin/boat-images/upload", requireAdminSession, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: unknown) {
      logger.error("Error generating upload URL", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/admin/boat-images/normalize", requireAdminSession, async (req, res) => {
    try {
      const parsed = normalizeImageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { imageUrl } = parsed.data;
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(imageUrl);
      res.json({ normalizedPath });
    } catch (error: unknown) {
      logger.error("Error normalizing image URL", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Failed to normalize image URL" });
    }
  });
}
