// Link rot detector -- finds broken links in blog content
import { db } from "../../db";
import { blogPosts, seoAlerts } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

interface BrokenLink {
  page: string;
  url: string;
  status: number | null;
  error?: string;
}

// Extract all links from HTML content
function extractLinks(html: string): string[] {
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  return Array.from(new Set(links));
}

// Check a single URL
async function checkUrl(url: string): Promise<{ status: number | null; error?: string }> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "SEO-Engine-LinkCheck/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    return { status: response.status };
  } catch {
    // Try GET as fallback (some servers don't support HEAD)
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "SEO-Engine-LinkCheck/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      return { status: response.status };
    } catch (e) {
      return { status: null, error: e instanceof Error ? e.message : String(e) };
    }
  }
}

// Scan all published blog posts for broken links
export async function detectLinkRot(): Promise<BrokenLink[]> {
  const posts = await db
    .select({ slug: blogPosts.slug, content: blogPosts.content })
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true));

  const brokenLinks: BrokenLink[] = [];
  let totalChecked = 0;

  for (const post of posts) {
    if (!post.content) continue;

    const links = extractLinks(post.content);
    const pagePath = `/blog/${post.slug}`;

    for (const url of links) {
      // Skip internal links and known safe domains
      if (url.includes("costabravarentaboat.com")) continue;
      if (url.includes("google.com") || url.includes("facebook.com")) continue;

      const result = await checkUrl(url);
      totalChecked++;

      if (result.status === null || result.status >= 400) {
        brokenLinks.push({
          page: pagePath,
          url,
          status: result.status,
          error: result.error,
        });
      }

      // Rate limit: 200ms between checks
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Create alerts for broken links
  if (brokenLinks.length > 0) {
    const summary = brokenLinks.slice(0, 5).map(l => `${l.page}: ${l.url} (${l.status || l.error})`).join("; ");
    await db.insert(seoAlerts).values({
      type: "link_rot",
      severity: "medium",
      title: `${brokenLinks.length} enlaces rotos detectados`,
      message: summary,
    });
  }

  logger.info(`[SEO:LinkRot] Checked ${totalChecked} links, found ${brokenLinks.length} broken`);
  return brokenLinks;
}
