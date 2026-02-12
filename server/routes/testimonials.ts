import type { Express } from "express";
import { storage } from "../storage";
import { insertTestimonialSchema } from "@shared/schema";

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
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching testimonials: " + error.message });
    }
  });

  // Create a new testimonial (public - will be unverified by default)
  app.post("/api/testimonials", async (req, res) => {
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
    } catch (error: any) {
      res.status(500).json({ message: "Error creating testimonial: " + error.message });
    }
  });
}
