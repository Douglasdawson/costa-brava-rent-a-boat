import type { Express } from "express";
import { requireAdminSession } from "./auth";
import { storage } from "../storage";
import { sendNewsletterEmail } from "../services/emailService";
import { generateGBPPosts, getSeasonalGBPPost, generateGBPPostFromBlog } from "../services/gbpService";
import type { BlogPost } from "@shared/schema";
import { logger } from "../lib/logger";

export function registerAdminMarketingRoutes(app: Express) {
  // ===== NEWSLETTER =====

  // Get all subscribers
  app.get("/api/admin/newsletter/subscribers", requireAdminSession, async (_req, res) => {
    try {
      const subscribers = await storage.getActiveNewsletterSubscribers();
      res.json(subscribers);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error fetching subscribers", { error: msg });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Manually trigger newsletter send
  app.post("/api/admin/newsletter/send", requireAdminSession, async (_req, res) => {
    try {
      const subscribers = await storage.getActiveNewsletterSubscribers();
      if (subscribers.length === 0) {
        return res.json({ message: "No hay suscriptores activos", sent: 0 });
      }

      const since = new Date();
      since.setDate(since.getDate() - 30);
      const recentPosts = await storage.getRecentPublishedBlogPosts(since);

      if (recentPosts.length === 0) {
        return res.json({ message: "No hay posts recientes para enviar", sent: 0 });
      }

      // Group by language
      const byLang = new Map<string, string[]>();
      for (const sub of subscribers) {
        const lang = sub.language || "es";
        const list = byLang.get(lang) || [];
        list.push(sub.email);
        byLang.set(lang, list);
      }

      let totalSent = 0;
      let totalFailed = 0;

      for (const [lang, emails] of Array.from(byLang.entries())) {
        const localizedPosts = recentPosts.slice(0, 5).map((post: BlogPost) => {
          const titleByLang = post.titleByLang as Record<string, string> | null;
          const excerptByLang = post.excerptByLang as Record<string, string> | null;
          return {
            title: titleByLang?.[lang] || post.title,
            excerpt: excerptByLang?.[lang] || post.excerpt || "",
            slug: post.slug,
            featuredImage: post.featuredImage,
          };
        });

        for (const email of emails) {
          const result = await sendNewsletterEmail(email, lang, localizedPosts);
          if (result.success) totalSent++;
          else totalFailed++;
        }
      }

      res.json({
        message: `Newsletter enviado a ${totalSent} suscriptores`,
        sent: totalSent,
        failed: totalFailed,
        postsIncluded: Math.min(recentPosts.length, 5),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error sending newsletter", { error: msg });
      res.status(500).json({ message: "Error al enviar newsletter" });
    }
  });

  // ===== GOOGLE BUSINESS PROFILE =====

  // Generate all GBP posts (seasonal + blog)
  app.get("/api/admin/gbp/posts", requireAdminSession, async (_req, res) => {
    try {
      const posts = await generateGBPPosts();
      res.json(posts);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error generating GBP posts", { error: msg });
      res.status(500).json({ message: "Error generando posts GBP" });
    }
  });

  // Get seasonal promotion post
  app.get("/api/admin/gbp/seasonal", requireAdminSession, async (_req, res) => {
    try {
      const post = getSeasonalGBPPost();
      res.json(post);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error getting seasonal GBP post", { error: msg });
      res.status(500).json({ message: "Error generando post estacional" });
    }
  });

  // Generate GBP post from a specific blog post
  app.get("/api/admin/gbp/from-blog/:slug", requireAdminSession, async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Post no encontrado" });
      }
      const gbpPost = generateGBPPostFromBlog(post);
      res.json(gbpPost);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error generating GBP post from blog", { error: msg });
      res.status(500).json({ message: "Error generando post GBP" });
    }
  });
}
