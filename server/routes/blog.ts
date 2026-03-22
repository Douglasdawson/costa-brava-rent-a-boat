import type { Express } from "express";
import { storage } from "../storage";
import { insertBlogPostSchema } from "@shared/schema";
import { requireAdminSession, requireTabAccess } from "./auth";
import { logger } from "../lib/logger";
import { notifySubscribersOfNewPost } from "../services/blogNotifier";
import { notifyIndexNow } from "../seo/indexnow";

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

  // Atom feed for published blog posts
  app.get("/api/blog/feed.xml", async (req, res) => {
    try {
      const posts = await storage.getPublishedBlogPosts();
      const siteUrl = "https://www.costabravarentaboat.com";

      // Determine feed-level updated date from the most recently updated post
      const feedUpdated = posts.length > 0
        ? new Date(Math.max(...posts.map(p => {
            const d = p.updatedAt ?? p.publishedAt ?? p.createdAt;
            return d ? new Date(d).getTime() : 0;
          }))).toISOString()
        : new Date().toISOString();

      const escapeXml = (str: string): string =>
        str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");

      const entries = posts.map(post => {
        const postUrl = `${siteUrl}/blog/${post.slug}`;
        const published = post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : new Date(post.createdAt!).toISOString();
        const updated = post.updatedAt
          ? new Date(post.updatedAt).toISOString()
          : published;
        const summary = post.excerpt || post.metaDescription || "";
        const categoryTag = post.category
          ? `\n      <category term="${escapeXml(post.category)}" />`
          : "";

        const contentHtml = post.content ? `\n      <content type="html">${escapeXml(post.content)}</content>` : "";

        return `  <entry>
      <title>${escapeXml(post.title)}</title>
      <link href="${escapeXml(postUrl)}" rel="alternate" type="text/html" />
      <id>${escapeXml(postUrl)}</id>
      <published>${published}</published>
      <updated>${updated}</updated>
      <author><name>${escapeXml(post.author || "Costa Brava Rent a Boat")}</name></author>
      <summary type="text">${escapeXml(summary)}</summary>${contentHtml}${categoryTag}
    </entry>`;
      }).join("\n");

      const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Costa Brava Rent a Boat - Blog</title>
  <subtitle>Noticias y guias sobre alquiler de barcos en Blanes, Costa Brava</subtitle>
  <link href="${siteUrl}/blog" rel="alternate" type="text/html" />
  <link href="${siteUrl}/api/blog/feed.xml" rel="self" type="application/atom+xml" />
  <id>${siteUrl}/blog</id>
  <updated>${feedUpdated}</updated>
  <author><name>Costa Brava Rent a Boat</name></author>
${entries}
</feed>`;

      res.set("Content-Type", "application/atom+xml; charset=utf-8");
      res.send(atom);
    } catch (error: unknown) {
      logger.error("[Blog] Error generating Atom feed", { error: error instanceof Error ? error.message : String(error) });
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

      // Notify newsletter subscribers if the post is published on creation
      if (post.isPublished) {
        notifySubscribersOfNewPost({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage,
          category: post.category,
        }).catch(() => {
          // Already logged inside notifySubscribersOfNewPost
        });

        // Notify search engines via IndexNow for faster indexing
        notifyIndexNow([`/blog/${post.slug}`]).catch(err =>
          logger.warn({ err, slug: post.slug }, "[Blog] IndexNow notification failed")
        );
      }

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

      // Check if the post was previously unpublished (to detect first-time publish)
      const existingPost = await storage.getBlogPost(req.params.id);
      const wasPublished = existingPost?.isPublished ?? false;

      const post = await storage.updateBlogPost(req.params.id, parsed.data);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // Notify subscribers only when publishing for the first time
      if (post.isPublished && !wasPublished) {
        notifySubscribersOfNewPost({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage,
          category: post.category,
        }).catch(() => {
          // Already logged inside notifySubscribersOfNewPost
        });
      }

      // Notify IndexNow on publish or update of published posts
      if (post.isPublished) {
        notifyIndexNow([`/blog/${post.slug}`]).catch(err =>
          logger.warn({ err, slug: post.slug }, "[Blog] IndexNow notification failed")
        );
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
