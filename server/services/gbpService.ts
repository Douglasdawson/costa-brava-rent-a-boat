/**
 * Google Business Profile Content Generator
 *
 * Generates optimized GBP posts from blog content and seasonal promotions.
 * Posts are stored in DB and can be auto-published when GBP API credentials are configured.
 * Without credentials, posts are generated for manual copy/paste into GBP dashboard.
 */

import { storage } from "../storage";
import type { BlogPost } from "@shared/schema";
import { logger } from "../lib/logger";

const BASE_URL = process.env.APP_URL || "https://costabravarentaboat.com";

interface GBPPost {
  type: "UPDATE" | "OFFER" | "EVENT";
  title: string;
  summary: string;
  callToAction: { type: string; url: string };
  mediaUrl?: string;
  scheduledFor?: string;
}

/**
 * Generate a GBP "What's New" post from a blog article.
 */
function blogToGBPPost(post: BlogPost): GBPPost {
  // GBP posts have a 1500 char limit on summary
  const excerpt = post.excerpt || post.content.slice(0, 300);
  const summary = excerpt.length > 300 ? excerpt.slice(0, 297) + "..." : excerpt;

  return {
    type: "UPDATE",
    title: post.title.slice(0, 58), // GBP title max ~58 chars
    summary: `${summary}\n\nLee el articulo completo en nuestro blog.`,
    callToAction: { type: "LEARN_MORE", url: `${BASE_URL}/blog/${post.slug}` },
    mediaUrl: post.featuredImage || undefined,
  };
}

/**
 * Generate a seasonal promotion GBP post.
 */
function buildSeasonalOffer(): GBPPost {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) {
    // Pre-season / early season
    return {
      type: "OFFER",
      title: "Temporada 2026 - Reserva anticipada",
      summary: "La nueva temporada de alquiler de barcos en Blanes ya esta aqui. Reserva con antelacion y asegura tu fecha preferida. Barcos sin licencia desde 70 EUR. Salidas desde el Puerto de Blanes, Costa Brava.",
      callToAction: { type: "BOOK", url: `${BASE_URL}/#booking` },
    };
  } else if (month >= 6 && month <= 8) {
    // Peak season
    return {
      type: "OFFER",
      title: "Alquiler de barcos en Costa Brava",
      summary: "Vive el verano en la Costa Brava. Alquila un barco en Blanes y descubre calas escondidas, aguas cristalinas y paisajes unicos. Sin licencia desde 70 EUR. Reserva online ahora.",
      callToAction: { type: "BOOK", url: `${BASE_URL}/#booking` },
    };
  } else if (month >= 9 && month <= 10) {
    // Late season
    return {
      type: "OFFER",
      title: "Ultimas semanas de temporada",
      summary: "Aprovecha los ultimos dias de la temporada de navegacion en Blanes. Temperaturas agradables, menos gente y la misma Costa Brava espectacular. Barcos disponibles hasta octubre.",
      callToAction: { type: "BOOK", url: `${BASE_URL}/#booking` },
    };
  }
  // Off-season
  return {
    type: "UPDATE",
    title: "Nos vemos en abril 2027",
    summary: "La temporada 2026 ha terminado. Gracias a todos los que habeis navegado con nosotros. Ya estamos preparando la proxima temporada. Reservas abiertas pronto.",
    callToAction: { type: "LEARN_MORE", url: BASE_URL },
  };
}

/**
 * Generate a batch of GBP posts from recent blog content.
 */
export async function generateGBPPosts(): Promise<GBPPost[]> {
  const posts: GBPPost[] = [];

  // Seasonal promotion post
  posts.push(buildSeasonalOffer());

  // Convert recent blog posts to GBP format (max 4)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const recentBlogs = await storage.getRecentPublishedBlogPosts(since);

  for (const blog of recentBlogs.slice(0, 4)) {
    posts.push(blogToGBPPost(blog));
  }

  logger.info("[GBP] Generated posts", { count: posts.length });
  return posts;
}

/**
 * Generate a single GBP post for a specific blog article.
 */
export function generateGBPPostFromBlog(post: BlogPost): GBPPost {
  return blogToGBPPost(post);
}

/**
 * Get the current seasonal offer post.
 */
export function getSeasonalGBPPost(): GBPPost {
  return buildSeasonalOffer();
}
