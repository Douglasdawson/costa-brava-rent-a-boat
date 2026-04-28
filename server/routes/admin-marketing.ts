import type { Express } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "./auth";
import { storage } from "../storage";
import { sendNewsletterEmail } from "../services/emailService";
import { generateGBPPosts, getSeasonalGBPPost, generateGBPPostFromBlog } from "../services/gbpService";
import { translatePostFields } from "../services/blogAutopilot";
import type { BlogPost } from "@shared/schema";
import { db } from "../db";
import { blogPosts } from "@shared/schema";
import { logger } from "../lib/logger";

const TRANSLATION_TARGET_LANGS = ["en", "fr", "de", "nl"] as const;
type TranslationLang = typeof TRANSLATION_TARGET_LANGS[number];

function findMissingLangs(
  post: { titleByLang: unknown; contentByLang: unknown }
): TranslationLang[] {
  const titleByLang = (post.titleByLang ?? {}) as Record<string, string>;
  const contentByLang = (post.contentByLang ?? {}) as Record<string, string>;
  return TRANSLATION_TARGET_LANGS.filter((lang) => {
    const t = titleByLang[lang]?.trim();
    const c = contentByLang[lang]?.trim();
    return !t || !c;
  });
}

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

  // ===== BLOG TRANSLATION BACKFILL =====
  // Audit endpoint: list posts missing translations in en/fr/de/nl.
  app.get("/api/admin/blog/translation-status", requireAdminSession, async (_req, res) => {
    try {
      const posts = await db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          title: blogPosts.title,
          titleByLang: blogPosts.titleByLang,
          contentByLang: blogPosts.contentByLang,
          isPublished: blogPosts.isPublished,
        })
        .from(blogPosts);

      const summary = posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        isPublished: p.isPublished,
        missingLangs: findMissingLangs(p),
      }));

      const totals = {
        totalPosts: posts.length,
        published: posts.filter((p) => p.isPublished).length,
        fullyTranslated: summary.filter((s) => s.missingLangs.length === 0).length,
        missingAtLeastOne: summary.filter((s) => s.missingLangs.length > 0).length,
        byLang: TRANSLATION_TARGET_LANGS.reduce<Record<string, number>>((acc, lang) => {
          acc[lang] = summary.filter((s) => s.missingLangs.includes(lang)).length;
          return acc;
        }, {}),
      };

      res.json({ totals, posts: summary });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error in translation-status", { error: msg });
      res.status(500).json({ message: "Error" });
    }
  });

  // Backfill endpoint: translates the next N posts that are missing translations,
  // for the missing langs only. Idempotent. Body params: { limit?: number,
  // model?: string, slug?: string }. If slug is provided, processes just that post.
  app.post("/api/admin/blog/backfill-translations", requireAdminSession, async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ message: "ANTHROPIC_API_KEY not configured" });
    }

    const { limit = 1, model = "claude-sonnet-4-20250514", slug } = req.body ?? {};
    const safeLimit = Math.max(1, Math.min(10, Number(limit) || 1));

    try {
      const allPosts = await db
        .select({
          id: blogPosts.id,
          slug: blogPosts.slug,
          title: blogPosts.title,
          content: blogPosts.content,
          excerpt: blogPosts.excerpt,
          metaDescription: blogPosts.metaDescription,
          titleByLang: blogPosts.titleByLang,
          contentByLang: blogPosts.contentByLang,
          excerptByLang: blogPosts.excerptByLang,
          metaDescByLang: blogPosts.metaDescByLang,
        })
        .from(blogPosts);

      const candidates = (slug ? allPosts.filter((p) => p.slug === slug) : allPosts)
        .map((p) => ({ post: p, missing: findMissingLangs(p) }))
        .filter((x) => x.missing.length > 0)
        .slice(0, safeLimit);

      if (candidates.length === 0) {
        return res.json({
          ok: true,
          processed: 0,
          message: "No posts needing translation found.",
        });
      }

      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const results: Array<{ slug: string; langs: string[]; tokensIn: number; tokensOut: number }> = [];

      for (const { post, missing } of candidates) {
        try {
          const tr = await translatePostFields(
            client,
            {
              title: post.title,
              content: post.content,
              excerpt: post.excerpt ?? "",
              metaDescription: post.metaDescription ?? "",
            },
            missing,
            model
          );

          // Merge: keep existing translations, add the new ones
          const existingTitleByLang = (post.titleByLang ?? {}) as Record<string, string>;
          const existingContentByLang = (post.contentByLang ?? {}) as Record<string, string>;
          const existingExcerptByLang = (post.excerptByLang ?? {}) as Record<string, string>;
          const existingMetaByLang = (post.metaDescByLang ?? {}) as Record<string, string>;

          const mergedTitle = { ...existingTitleByLang, ...tr.titleByLang };
          const mergedContent = { ...existingContentByLang, ...tr.contentByLang };
          const mergedExcerpt = { ...existingExcerptByLang, ...tr.excerptByLang };
          const mergedMeta = { ...existingMetaByLang, ...tr.metaDescByLang };

          await db
            .update(blogPosts)
            .set({
              titleByLang: mergedTitle,
              contentByLang: mergedContent,
              excerptByLang: mergedExcerpt,
              metaDescByLang: mergedMeta,
              updatedAt: new Date(),
            })
            .where(eq(blogPosts.id, post.id));

          results.push({
            slug: post.slug,
            langs: missing,
            tokensIn: tr.tokensIn,
            tokensOut: tr.tokensOut,
          });
          logger.info("[BlogBackfill] Translated", { slug: post.slug, langs: missing });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          logger.error("[BlogBackfill] Failed", { slug: post.slug, error: msg });
          results.push({ slug: post.slug, langs: [], tokensIn: 0, tokensOut: 0 });
        }
      }

      const totalIn = results.reduce((s, r) => s + r.tokensIn, 0);
      const totalOut = results.reduce((s, r) => s + r.tokensOut, 0);
      res.json({
        ok: true,
        processed: results.length,
        results,
        totals: { tokensIn: totalIn, tokensOut: totalOut },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Admin] Error in backfill-translations", { error: msg });
      res.status(500).json({ message: "Error" });
    }
  });
}
