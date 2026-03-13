import { logger } from "../lib/logger";
import { getActiveNewsletterSubscribers } from "../storage/content";
import { sendNewsletterEmail } from "./emailService";

interface BlogPostNotification {
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: string;
}

/**
 * Notify all active newsletter subscribers about a newly published blog post.
 * This function is designed to be called fire-and-forget (don't await in route handlers).
 * Failures are logged but never bubble up to the caller.
 */
export async function notifySubscribersOfNewPost(post: BlogPostNotification): Promise<void> {
  try {
    const subscribers = await getActiveNewsletterSubscribers();

    if (subscribers.length === 0) {
      logger.info("[BlogNotifier] No active subscribers to notify");
      return;
    }

    logger.info("[BlogNotifier] Sending blog notification", {
      slug: post.slug,
      subscriberCount: subscribers.length,
    });

    const newsletterPost = {
      title: post.title,
      excerpt: post.excerpt || post.title,
      slug: post.slug,
      featuredImage: post.featuredImage,
    };

    let sent = 0;
    let failed = 0;

    // Send emails sequentially to avoid SendGrid rate limits
    for (const subscriber of subscribers) {
      const result = await sendNewsletterEmail(
        subscriber.email,
        subscriber.language || "es",
        [newsletterPost],
      );

      if (result.success) {
        sent++;
      } else {
        failed++;
        // If SendGrid is not configured, stop immediately — no point continuing
        if (result.error === "SendGrid not configured") {
          logger.warn("[BlogNotifier] SendGrid not configured, skipping all notifications");
          return;
        }
      }
    }

    logger.info("[BlogNotifier] Blog notification complete", {
      slug: post.slug,
      sent,
      failed,
      total: subscribers.length,
    });
  } catch (error: unknown) {
    logger.error("[BlogNotifier] Unexpected error notifying subscribers", {
      slug: post.slug,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
