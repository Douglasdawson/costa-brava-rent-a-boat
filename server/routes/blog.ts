import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertBlogPostSchema } from "@shared/schema";
import { requireAdminSession, requireTabAccess } from "./auth";
import { logger } from "../lib/logger";
import { notifySubscribersOfNewPost } from "../services/blogNotifier";
import { notifyIndexNow } from "../seo/indexnow";
import { fetchUnsplashImage } from "../services/blogAutopilot";

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
  // Canonical path: /api/blog/feed.xml
  // Convention aliases: /feed.xml, /rss.xml (crawlers and AI bots check root)
  const atomFeedHandler = async (req: Request, res: Response) => {
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
  };
  app.get("/api/blog/feed.xml", atomFeedHandler);
  app.get("/feed.xml", atomFeedHandler);
  app.get("/rss.xml", atomFeedHandler);

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

  // Fix blog post images — maps broken image URLs to actual files on disk
  app.post("/api/admin/blog/fix-images", requireAdminSession, async (req, res) => {
    const IMAGE_MAP: Record<string, string> = {
      "mejores-calas-costa-brava-en-barco.jpg": "calas-costa-brava.jpg",
      "alquiler-barco-sin-licencia-blanes-guia.jpg": "barco-mar.jpg",
      "que-hacer-en-blanes-verano.jpg": "puerto-barcos.jpg",
      "boat-rental-costa-brava-english-guide.jpg": "barco-mar.jpg",
      "rutas-barco-desde-blanes.jpg": "ruta-costera.jpg",
      "consejos-primera-vez-alquilar-barco.jpg": "barco-mar.jpg",
      "navegar-con-ninos-costa-brava-guia-familias.jpg": "familias-barco.jpg",
      "seguridad-navegacion-mar-guia.jpg": "seguridad-barco.jpg",
      "gastronomia-marinera-blanes.jpg": "gastronomia-marina.jpg",
      "fauna-marina-costa-brava-barco.jpg": "snorkel-mar.jpg",
      "historia-maritima-blanes.jpg": "puerto-barcos.jpg",
      "snorkel-buceo-costa-brava-barco.jpg": "snorkel-mar.jpg",
      "cuanto-cuesta-alquilar-barco-blanes-precios.jpg": "barco-mar.jpg",
      "comparativa-barcos-sin-licencia-blanes.jpg": "barco-mar.jpg",
      "costa-brava-septiembre-mejor-mes-navegar.jpg": "calas-costa-brava.jpg",
      "preguntas-frecuentes-alquiler-barco-sin-licencia.jpg": "barco-mar.jpg",
      "excursiones-barco-grupos-eventos-blanes.jpg": "grupos-barco.jpg",
      "atardeceres-mar-rutas-sunset-costa-brava.jpg": "atardecer-mar.jpg",
      "excursion-barco-tossa-de-mar.jpg": "ruta-costera.jpg",
      "barco-sin-licencia-vs-con-licencia-guia.jpg": "barco-mar.jpg",
      "que-llevar-barco-alquiler-checklist.jpg": "seguridad-barco.jpg",
      "alquiler-barco-familias-costa-brava.jpg": "familias-barco.jpg",
      "mejores-calas-blanes-accesibles-en-barco.jpg": "calas-costa-brava.jpg",
      "sunset-boat-trip-blanes-costa-brava.jpg": "atardecer-mar.jpg",
    };
    try {
      const posts = await storage.getAllBlogPosts();
      let fixed = 0;
      for (const post of posts) {
        const img = post.featuredImage as string | null;
        if (!img) continue;
        const filename = img.split("/").pop() || "";
        if (IMAGE_MAP[filename]) {
          await storage.updateBlogPost(post.id, { featuredImage: `/images/blog/${IMAGE_MAP[filename]}` });
          fixed++;
        }
      }
      res.json({ message: `Fixed ${fixed} blog post images`, total: posts.length });
    } catch (error: unknown) {
      logger.error("[Blog] Error fixing images", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error fixing blog images" });
    }
  });

  // Refresh blog images: replace local stock images with unique Unsplash photos
  app.post("/api/admin/blog/refresh-images", requireAdminSession, async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      let updated = 0;
      let skipped = 0;
      const localImagePrefix = "/images/blog/";

      for (const post of posts) {
        const img = post.featuredImage as string | null;
        // Replace local stock images and posts without any image; skip existing Unsplash URLs
        const isLocalStock = img && img.startsWith(localImagePrefix);
        const hasNoImage = !img;
        if (!isLocalStock && !hasNoImage) {
          skipped++;
          continue;
        }

        // Extract keywords from the post title for a relevant search
        const titleWords = (post.title as string || "").split(/\s+/).slice(0, 3);
        const newImage = await fetchUnsplashImage(titleWords);
        if (newImage) {
          await storage.updateBlogPost(post.id, { featuredImage: newImage });
          updated++;
          logger.info("[Blog] Refreshed image", { postId: post.id, title: post.title });
        }

        // Respect Unsplash rate limits (50 req/hour on free tier)
        await new Promise((r) => setTimeout(r, 1500));
      }

      res.json({ message: `Refreshed ${updated} images, skipped ${skipped}`, total: posts.length });
    } catch (error: unknown) {
      logger.error("[Blog] Error refreshing images", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error refreshing blog images" });
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
