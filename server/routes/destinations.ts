import type { Express } from "express";
import { storage } from "../storage";
import { insertDestinationSchema } from "@shared/schema";
import { requireAdminSession } from "./auth";
import { logger } from "../lib/logger";
import { boatRoutes } from "@shared/routesData";
import type { Destination } from "@shared/schema";

// Build a synthetic Destination object from a boatRoute for fallback when DB is empty
function buildDestinationFromRoute(routeId: string): Destination | undefined {
  const route = boatRoutes.find(r => r.id === routeId);
  if (!route) return undefined;

  const desc = route.descriptions.es;
  const lastCoord = route.coordinates[route.coordinates.length - 1];

  return {
    id: route.id,
    tenantId: null,
    name: desc.name,
    slug: route.id,
    description: desc.description,
    content: `## ${desc.name}\n\n${desc.description}\n\n### Puntos de interes\n\n${desc.highlights.map(h => `- ${h}`).join("\n")}\n\n**Distancia:** ${route.distance}\n**Tiempo estimado:** ${route.estimatedTime}`,
    coordinates: { lat: lastCoord.lat, lng: lastCoord.lng },
    featuredImage: null,
    imageGallery: null,
    metaDescription: desc.description.substring(0, 155),
    nearbyAttractions: desc.highlights,
    distanceFromPort: route.distance,
    recommendedBoats: null,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function registerDestinationRoutes(app: Express) {
  // ===== PUBLIC ROUTES =====

  // Get all published destinations
  app.get("/api/destinations", async (req, res) => {
    try {
      const destinations = await storage.getPublishedDestinations();
      // Fallback to boatRoutes when no DB destinations exist
      if (destinations.length === 0) {
        const fallbackDestinations = boatRoutes
          .map(r => buildDestinationFromRoute(r.id))
          .filter((d): d is Destination => d !== undefined);
        return res.json(fallbackDestinations);
      }
      res.json(destinations);
    } catch (error: unknown) {
      logger.error("[Destinations] Error fetching destinations", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get a single destination by slug
  app.get("/api/destinations/:slug", async (req, res) => {
    try {
      const destination = await storage.getDestinationBySlug(req.params.slug);
      if (!destination) {
        // Fallback: try to match slug against boatRoutes
        const fallback = buildDestinationFromRoute(req.params.slug);
        if (fallback) {
          return res.json(fallback);
        }
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json(destination);
    } catch (error: unknown) {
      logger.error("[Destinations] Error fetching destination", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== ADMIN ROUTES =====

  // Get all destinations (admin only)
  app.get("/api/admin/destinations", requireAdminSession, async (req, res) => {
    try {
      const destinations = await storage.getAllDestinations();
      res.json(destinations);
    } catch (error: unknown) {
      logger.error("[Destinations] Error fetching destinations", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
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
    } catch (error: unknown) {
      logger.error("[Destinations] Error creating destination", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
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
    } catch (error: unknown) {
      logger.error("[Destinations] Error updating destination", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
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
    } catch (error: unknown) {
      logger.error("[Destinations] Error deleting destination", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
