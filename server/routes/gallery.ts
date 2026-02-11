import type { Express } from "express";
import { storage } from "../storage";
import { requireAdminSession, requireAdminRole } from "./auth";

// Simple rate limiting for photo submissions
const submitAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_SUBMIT_ATTEMPTS = 5;
const SUBMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function registerGalleryRoutes(app: Express) {
  // Public: get approved photos
  app.get("/api/gallery", async (_req, res) => {
    try {
      const photos = await storage.getApprovedPhotos();
      res.json(photos);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching gallery: " + message });
    }
  });

  // Public: submit a photo (rate limited)
  app.post("/api/gallery/submit", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";

      // Rate limit check
      const attempts = submitAttempts.get(clientIp);
      if (attempts) {
        if (Date.now() - attempts.firstAttempt > SUBMIT_WINDOW_MS) {
          submitAttempts.delete(clientIp);
        } else if (attempts.count >= MAX_SUBMIT_ATTEMPTS) {
          return res.status(429).json({ message: "Demasiados envíos. Intenta de nuevo más tarde." });
        }
      }

      const { imageUrl, caption, customerName, boatName, boatId, tripDate } = req.body;

      if (!imageUrl || !customerName) {
        return res.status(400).json({ message: "La imagen y el nombre son requeridos" });
      }

      const photo = await storage.createClientPhoto({
        imageUrl,
        caption: caption || null,
        customerName,
        boatName: boatName || null,
        boatId: boatId || null,
        tripDate: tripDate ? new Date(tripDate) : null,
      });

      // Track submission
      const current = submitAttempts.get(clientIp);
      if (current) {
        current.count++;
      } else {
        submitAttempts.set(clientIp, { count: 1, firstAttempt: Date.now() });
      }

      res.status(201).json({
        success: true,
        photo,
        message: "Foto enviada. Será revisada antes de publicarse.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error submitting photo: " + message });
    }
  });

  // Public: get upload URL for image
  app.post("/api/gallery/upload-url", async (_req, res) => {
    try {
      const { ObjectStorageService } = await import("../objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error generating upload URL: " + message });
    }
  });

  // Admin: get all photos (including unapproved)
  app.get("/api/admin/gallery", requireAdminSession, async (_req, res) => {
    try {
      const photos = await storage.getAllPhotos();
      res.json(photos);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching gallery: " + message });
    }
  });

  // Admin: approve photo
  app.patch("/api/admin/gallery/:id/approve", requireAdminSession, async (req, res) => {
    try {
      const updated = await storage.updateClientPhoto(req.params.id, {
        isApproved: true,
        approvedAt: new Date(),
      });
      if (!updated) {
        return res.status(404).json({ message: "Foto no encontrada" });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error approving photo: " + message });
    }
  });

  // Admin: reject photo (set as not approved)
  app.patch("/api/admin/gallery/:id/reject", requireAdminSession, async (req, res) => {
    try {
      const updated = await storage.updateClientPhoto(req.params.id, {
        isApproved: false,
        approvedAt: null,
      });
      if (!updated) {
        return res.status(404).json({ message: "Foto no encontrada" });
      }
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error rejecting photo: " + message });
    }
  });

  // Admin: delete photo
  app.delete("/api/admin/gallery/:id", requireAdminSession, requireAdminRole, async (req, res) => {
    try {
      const deleted = await storage.deleteClientPhoto(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Foto no encontrada" });
      }
      res.json({ message: "Foto eliminada correctamente" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error deleting photo: " + message });
    }
  });
}
