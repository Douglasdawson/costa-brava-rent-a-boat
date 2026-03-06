import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";
import { insertTestimonialSchema } from "@shared/schema";
import { logger } from "../lib/logger";

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta de nuevo mas tarde." },
});

export function registerTestimonialRoutes(app: Express) {
  // Get all verified testimonials (public)
  app.get("/api/testimonials", async (req, res) => {
    try {
      const { boatId } = req.query;

      let testimonialsData;
      if (boatId && typeof boatId === "string") {
        testimonialsData = await storage.getTestimonialsByBoat(boatId);
      } else {
        testimonialsData = await storage.getTestimonials();
      }

      res.json(testimonialsData);
    } catch (error: unknown) {
      logger.error("[Testimonials] Error fetching testimonials", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Create a new testimonial (public - will be unverified by default)
  app.post("/api/testimonials", submitLimiter, async (req, res) => {
    try {
      const parsed = insertTestimonialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      // isVerified defaults to false in database - only admins can verify
      const testimonial = await storage.createTestimonial(parsed.data);
      res.status(201).json(testimonial);
    } catch (error: unknown) {
      logger.error("[Testimonials] Error creating testimonial", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
