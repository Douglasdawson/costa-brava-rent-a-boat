import type { Express } from "express";
import { storage } from "../storage";
import { insertBlogPostSchema } from "@shared/schema";
import { requireAdminSession, requireTabAccess } from "./auth";
import { logger } from "../lib/logger";

export function registerBlogRoutes(app: Express) {
  // ===== PUBLIC ROUTES =====

  // Get all published blog posts
  app.get("/api/blog", async (req, res) => {
    try {
      const { category } = req.query;

      let posts;
      if (category && typeof category === "string") {
        posts = await storage.getBlogPostsByCategory(category);
      } else {
        posts = await storage.getPublishedBlogPosts();
      }

      res.json(posts);
    } catch (error: unknown) {
      logger.error("[Blog] Error fetching blog posts", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get a single blog post by slug
  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error: unknown) {
      logger.error("[Blog] Error fetching blog post", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // ===== ADMIN ROUTES =====

  // Get all blog posts (admin only)
  app.get("/api/admin/blog", requireAdminSession, requireTabAccess("blog"), async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error: unknown) {
      logger.error("[Blog] Error fetching blog posts", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Create a new blog post (admin only)
  app.post("/api/admin/blog", requireAdminSession, requireTabAccess("blog"), async (req, res) => {
    try {
      // Coerce publishedAt from string to Date if needed
      const body = { ...req.body };
      if (typeof body.publishedAt === "string") {
        body.publishedAt = new Date(body.publishedAt);
      }
      const parsed = insertBlogPostSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const post = await storage.createBlogPost(parsed.data);
      res.status(201).json(post);
    } catch (error: unknown) {
      logger.error("[Blog] Error creating blog post", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update a blog post (admin only)
  app.put("/api/admin/blog/:id", requireAdminSession, requireTabAccess("blog"), async (req, res) => {
    try {
      // Coerce publishedAt from string to Date if needed
      const body = { ...req.body };
      if (typeof body.publishedAt === "string") {
        body.publishedAt = new Date(body.publishedAt);
      }
      const parsed = insertBlogPostSchema.partial().safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const post = await storage.updateBlogPost(req.params.id, parsed.data);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error: unknown) {
      logger.error("[Blog] Error updating blog post", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Delete a blog post (admin only)
  app.delete("/api/admin/blog/:id", requireAdminSession, requireTabAccess("blog"), async (req, res) => {
    try {
      const success = await storage.deleteBlogPost(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json({ message: "Blog post deleted successfully" });
    } catch (error: unknown) {
      logger.error("[Blog] Error deleting blog post", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
