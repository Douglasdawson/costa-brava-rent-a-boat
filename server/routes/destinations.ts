import type { Express } from "express";
import { storage } from "../storage";
import { insertDestinationSchema } from "@shared/schema";
import { requireAdminSession } from "./auth";

export function registerDestinationRoutes(app: Express) {
  // ===== PUBLIC ROUTES =====

  // Get all published destinations
  app.get("/api/destinations", async (req, res) => {
    try {
      const destinations = await storage.getPublishedDestinations();
      res.json(destinations);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching destinations: " + error.message });
    }
  });

  // Get a single destination by slug
  app.get("/api/destinations/:slug", async (req, res) => {
    try {
      const destination = await storage.getDestinationBySlug(req.params.slug);
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json(destination);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching destination: " + error.message });
    }
  });

  // ===== ADMIN ROUTES =====

  // Get all destinations (admin only)
  app.get("/api/admin/destinations", requireAdminSession, async (req, res) => {
    try {
      const destinations = await storage.getAllDestinations();
      res.json(destinations);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching destinations: " + error.message });
    }
  });

  // Create a new destination (admin only)
  app.post("/api/admin/destinations", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertDestinationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const destination = await storage.createDestination(parsed.data);
      res.status(201).json(destination);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating destination: " + error.message });
    }
  });

  // Update a destination (admin only)
  app.put("/api/admin/destinations/:id", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertDestinationSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const destination = await storage.updateDestination(req.params.id, parsed.data);
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json(destination);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating destination: " + error.message });
    }
  });

  // Delete a destination (admin only)
  app.delete("/api/admin/destinations/:id", requireAdminSession, async (req, res) => {
    try {
      const success = await storage.deleteDestination(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json({ message: "Destination deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting destination: " + error.message });
    }
  });
}
