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
      const validatedData = insertTestimonialSchema.parse(req.body);
      // isVerified defaults to false in database - only admins can verify
      const testimonial = await storage.createTestimonial(validatedData);
      res.status(201).json(testimonial);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating testimonial: " + error.message });
    }
  });
}
