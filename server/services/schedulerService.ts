import cron, { type ScheduledTask } from "node-cron";
import { storage } from "../storage";
import {
  sendBookingReminder,
  sendThankYouEmail,
  sendNewsletterEmail,
} from "./emailService";
import { processAbandonedBookings } from "./abandonedBookingService";
import { runAutopilotPipeline, publishNextDraft, getConfig, runBlogTranslationBackfill } from "./blogAutopilot.js";
import { syncAllAnalytics } from "./googleAnalyticsService";
import { syncReviewRequests, sendReferralCodes, sendEarlyBirdOffers } from "./flywheelService";
import { renderThankYouWhatsApp } from "./whatsappTemplates";
import { generateWeeklyInsights } from "./chatbotInsightsService";
import { processLeadNurturing } from "./leadNurturingService";
import { notifyAllSitemapUrls } from "../seo/indexnow";
import type { Booking, Boat, BlogPost } from "@shared/schema";
import { logger } from "../lib/logger";

const scheduledTasks: ScheduledTask[] = [];

/**
 * Try to send a WhatsApp message. Returns true if sent, false if Twilio is not configured
 * or if sending fails. Never throws.
 */
async function trySendWhatsAppReminder(booking: Booking, boat: Boat): Promise<boolean> {
  try {
    // Dynamic import to avoid crashes when Twilio is not configured
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../whatsapp/twilioClient");

    if (!isTwilioConfigured()) {
      logger.info("Twilio not configured, skipping WhatsApp reminder");
      return false;
    }

    if (!booking.customerPhone) {
      logger.info("No phone number for booking, skipping WhatsApp", { bookingId: booking.id });
      return false;
    }

    const date = booking.startTime.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const time = booking.startTime.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    });

    const message = [
      `Hola ${booking.customerName}!`,
      ``,
      `Te recordamos que tu alquiler del ${boat.name} es mañana:`,
      `Fecha: ${date}`,
      `Hora: ${time}`,
      `Duración: ${booking.totalHours}h`,
      ``,
      `Punto de encuentro: Puerto de Blanes`,
      `Llega 15 minutos antes de la hora de salida.`,
      ``,
      `Recuerda traer: protección solar, gafas de sol y ropa cómoda.`,
      ``,
      `Ante cualquier duda: +34 611 500 372`,
      ``,
      `Costa Brava Rent a Boat`,
    ].join("\n");

    await sendWhatsAppMessage(booking.customerPhone, message);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Scheduler] WhatsApp reminder error for booking ${booking.id}`, { error: message });
    return false;
  }
}

/**
 * Try to send a WhatsApp thank-you message 24h after the trip.
 * Returns true if sent, false if Twilio is not configured or if sending fails. Never throws.
 */
async function trySendWhatsAppThankYou(booking: Booking): Promise<boolean> {
  try {
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../whatsapp/twilioClient");

    if (!isTwilioConfigured()) {
      logger.info("Twilio not configured, skipping WhatsApp thank-you");
      return false;
    }

    if (!booking.customerPhone) {
      logger.info("No phone number for booking, skipping WhatsApp thank-you", { bookingId: booking.id });
      return false;
    }

    const message = renderThankYouWhatsApp({
      customerName: booking.customerName,
      language: booking.language,
    });

    await sendWhatsAppMessage(booking.customerPhone, message);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Scheduler] WhatsApp thank-you error for booking ${booking.id}`, { error: message });
    return false;
  }
}

/**
 * Process upcoming bookings and send reminder emails + WhatsApp messages.
 * Runs every hour, targets bookings starting in ~24 hours (22-26h window).
 */
async function processReminders(): Promise<void> {
  try {
    const upcomingBookings = await storage.getUpcomingBookingsForReminder(24);

    if (upcomingBookings.length === 0) {
      return;
    }

    logger.info("Found bookings needing reminders", { count: upcomingBookings.length });

    for (const booking of upcomingBookings) {
      try {
        // Fetch boat details and extras for the email template
        const boat = await storage.getBoat(booking.boatId);
        if (!boat) {
          logger.error(`[Scheduler] Boat ${booking.boatId} not found for booking ${booking.id}`);
          continue;
        }

        const extras = await storage.getBookingExtras(booking.id);
        const emailData = { booking, boat, extras };

        // Send reminder email (if customer has email)
        let emailSent = false;
        if (booking.customerEmail) {
          const emailResult = await sendBookingReminder(emailData);
          emailSent = emailResult.success;
          if (!emailResult.success) {
            logger.error(`[Scheduler] Email reminder failed for booking ${booking.id}`, { error: emailResult.error ?? "unknown" });
          }
        }

        // Send WhatsApp reminder (if not already sent)
        let whatsappSent = booking.whatsappReminderSent;
        if (!booking.whatsappReminderSent) {
          whatsappSent = await trySendWhatsAppReminder(booking, boat);
        }

        // Mark as sent even if only one channel succeeded, to avoid spamming
        // If both failed, we still mark to prevent retries every hour
        await storage.updateBookingEmailStatus(booking.id, true, undefined);

        if (whatsappSent && !booking.whatsappReminderSent) {
          await storage.updateBookingWhatsAppStatus(booking.id, undefined, true);
        }

        logger.info("Reminder processed for booking", { bookingId: booking.id, emailSent, whatsappSent });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error(`[Scheduler] Error processing reminder for booking ${booking.id}`, { error: msg });
        // Continue with next booking
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Scheduler] Error in processReminders", { error: msg });
  }
}

/**
 * Process completed bookings and send thank-you emails with review request + discount code.
 * Runs every hour, targets bookings that ended ~24 hours ago (22-26h window).
 */
async function processThankYou(): Promise<void> {
  try {
    const completedBookings = await storage.getCompletedBookingsForThankYou(24);

    if (completedBookings.length === 0) {
      return;
    }

    logger.info("Found bookings needing thank-you emails", { count: completedBookings.length });

    for (const booking of completedBookings) {
      try {
        // Attempt WhatsApp thank-you regardless of email availability
        let waThankYouSentThisRun = false;
        if (!booking.whatsappThankYouSent) {
          waThankYouSentThisRun = await trySendWhatsAppThankYou(booking);
          if (waThankYouSentThisRun) {
            await storage.updateBookingWhatsAppThankYouStatus(booking.id, true);
          }
        }

        // Skip email if no address, but WhatsApp was already attempted above
        if (!booking.customerEmail) {
          await storage.updateBookingEmailStatus(booking.id, undefined, true);
          continue;
        }

        // Fetch boat details and extras for the email template
        const boat = await storage.getBoat(booking.boatId);
        if (!boat) {
          logger.error(`[Scheduler] Boat ${booking.boatId} not found for booking ${booking.id}`);
          continue;
        }

        const extras = await storage.getBookingExtras(booking.id);
        const emailData = { booking, boat, extras };

        // Generate the discount code in DB first, then pass to email
        let discountCode = "REPEAT-GIFT";
        try {
          const codeRecord = await storage.generateRepeatCustomerCode(booking.customerEmail, booking.id);
          discountCode = codeRecord.code;
        } catch (discountError: unknown) {
          const msg = discountError instanceof Error ? discountError.message : "Unknown error";
          logger.error(`[Scheduler] Error generating discount code for ${booking.customerEmail}`, { error: msg });
        }

        // Send thank-you email with the real discount code
        const emailResult = await sendThankYouEmail(emailData, discountCode);

        if (!emailResult.success) {
          logger.error(`[Scheduler] Thank-you email failed for booking ${booking.id}`, { error: emailResult.error ?? "unknown" });
        }

        // Mark email as sent regardless to prevent retries
        await storage.updateBookingEmailStatus(booking.id, undefined, true);

        logger.info("Thank-you processed for booking", { bookingId: booking.id, emailSent: emailResult.success, whatsappSent: waThankYouSentThisRun });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error(`[Scheduler] Error processing thank-you for booking ${booking.id}`, { error: msg });
        // Continue with next booking
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Scheduler] Error in processThankYou", { error: msg });
  }
}

/**
 * Start all scheduled cron jobs.
 * Call this once during server startup.
 */
export function startScheduler(): void {
  logger.info("Starting scheduled services");

  // Reminder job: run every hour at minute 0
  // Checks for confirmed bookings starting in 22-26 hours
  scheduledTasks.push(cron.schedule("0 * * * *", async () => {
    logger.info("Running reminder job");
    await processReminders();
  }));

  // Thank-you job: run every hour at minute 30
  // Checks for confirmed bookings that ended 22-26 hours ago
  scheduledTasks.push(cron.schedule("30 * * * *", async () => {
    logger.info("Running thank-you job");
    await processThankYou();
  }));

  // Cleanup expired holds every 5 minutes to free blocked availability
  scheduledTasks.push(cron.schedule("*/5 * * * *", async () => {
    try {
      const cleaned = await storage.cleanupExpiredHolds();
      if (cleaned > 0) {
        logger.info("Cleaned up expired holds", { count: cleaned });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Error cleaning expired holds", { error: msg });
    }
  }));

  // Abandoned booking recovery: every 30 minutes at :15 and :45
  // Sends recovery emails with 5% discount to cancelled/expired bookings
  scheduledTasks.push(cron.schedule("15,45 * * * *", async () => {
    try {
      await processAbandonedBookings();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Abandoned booking recovery error", { error: msg });
    }
  }));

  // Auto-complete confirmed bookings whose end time has passed (every hour at :45)
  // Runs after the thank-you job (:30) so thank-you emails are sent before status changes
  scheduledTasks.push(cron.schedule("45 * * * *", async () => {
    try {
      const count = await storage.autoCompleteBookings();
      if (count > 0) {
        logger.info("Auto-completed bookings", { count });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Auto-complete error", { error: message });
    }
  }));

  // Blog autopilot: generate new posts (schedule from config, default: Mon/Wed/Fri 9am)
  (async () => {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        logger.info("ANTHROPIC_API_KEY not set, blog autopilot disabled");
        return;
      }
      const config = await getConfig();
      if (!config.isEnabled) {
        logger.info("Blog autopilot is disabled in config");
        return;
      }
      scheduledTasks.push(cron.schedule(config.cronSchedule, async () => {
        logger.info("Running blog autopilot");
        const result = await runAutopilotPipeline();
        if (result.success) {
          logger.info("Blog autopilot success", { topic: result.topic, seoScore: result.seoScore });
        } else {
          logger.info("Blog autopilot skipped/failed", { error: result.error });
        }
      }));
      logger.info("Blog autopilot scheduled", { cronSchedule: config.cronSchedule });
    } catch (error) {
      logger.error("[Scheduler] Failed to initialize blog autopilot", { error: error instanceof Error ? error.message : String(error) });
    }
  })();

  // Blog: publish 1 draft every Monday at 9am
  scheduledTasks.push(cron.schedule("0 9 * * 1", async () => {
    try {
      const published = await publishNextDraft();
      if (published > 0) {
        logger.info("Weekly blog draft published");
      }
    } catch (error) {
      logger.error("[Scheduler] Blog publish error", { error: error instanceof Error ? error.message : String(error) });
    }
  }));

  // Blog translation backfill: every 20 min, processes up to 3 posts that
  // have missing en/fr/de/nl translations. Idempotent — once all posts are
  // fully translated this becomes a no-op. Cost: ~$0.03-0.05 per post per
  // missing lang. Estimated total to backfill ~45 existing posts: ~$2-3
  // (eventually completes in ~5 hours of cycles).
  scheduledTasks.push(cron.schedule("*/20 * * * *", async () => {
    try {
      const summary = await runBlogTranslationBackfill({ limit: 3 });
      if (summary.processed > 0 || summary.failed > 0) {
        logger.info("[Scheduler] Blog translation backfill", summary);
      }
    } catch (error) {
      logger.error("[Scheduler] Blog backfill error", { error: error instanceof Error ? error.message : String(error) });
    }
  }));

  // Run once shortly after boot so we don't wait the full 20 min for first
  // batch (gives Replit Republish a head start on convergence).
  setTimeout(() => {
    runBlogTranslationBackfill({ limit: 3 })
      .then((summary) => {
        if (summary.processed > 0 || summary.candidates > 0) {
          logger.info("[Scheduler] Blog backfill (boot run)", summary);
        }
      })
      .catch((err) => {
        logger.error("[Scheduler] Blog backfill (boot run) error", { error: err instanceof Error ? err.message : String(err) });
      });
  }, 60_000); // 1 min after startScheduler() — let DB pool warm up first

  // IndexNow sitemap-wide notify: daily at 04:30 UTC, plus once shortly after
  // boot. Notifies Bing/Yandex/Seznam/Naver about every URL in the sitemap.
  // Idempotent (these endpoints accept repeat pings without rate limit).
  // Google ignores IndexNow but the others combined cover ~5-15% of search
  // traffic for international markets — small but free.
  scheduledTasks.push(cron.schedule("30 4 * * *", async () => {
    try {
      const summary = await notifyAllSitemapUrls();
      logger.info("[Scheduler] IndexNow daily notify", summary);
    } catch (err) {
      logger.error("[Scheduler] IndexNow daily error", { error: err instanceof Error ? err.message : String(err) });
    }
  }));

  // Boot run (delayed 90s so server fully ready before crawling sitemaps)
  setTimeout(() => {
    notifyAllSitemapUrls()
      .then((summary) => {
        logger.info("[Scheduler] IndexNow boot run", summary);
      })
      .catch((err) => {
        logger.error("[Scheduler] IndexNow boot run error", { error: err instanceof Error ? err.message : String(err) });
      });
  }, 90_000);

  // Google Analytics sync: every 6 hours at :15 past the hour
  scheduledTasks.push(cron.schedule("15 */6 * * *", async () => {
    logger.info("[Scheduler] Running Google Analytics sync");
    try {
      await syncAllAnalytics();
    } catch (error) {
      logger.error("[Scheduler] Analytics sync failed", { error: error instanceof Error ? error.message : String(error) });
    }
  }));

  // Newsletter: send monthly digest on 1st of each month at 10am
  scheduledTasks.push(cron.schedule("0 10 1 * *", async () => {
    try {
      logger.info("Running monthly newsletter job");
      await processNewsletter();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Newsletter error", { error: msg });
    }
  }));

  // ===== POST-RENTAL FLYWHEEL =====
  // Three stages run hourly at :10 to avoid overlap with thank-you (:30) and reminders (:00)

  // Flywheel step 1: Sync review request flags (+24h, piggybacks on thank-you email)
  scheduledTasks.push(cron.schedule("10 * * * *", async () => {
    try {
      await syncReviewRequests();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Flywheel review sync error", { error: msg });
    }
  }));

  // Flywheel step 2: Send referral codes (+3 days after trip)
  scheduledTasks.push(cron.schedule("10 * * * *", async () => {
    try {
      await sendReferralCodes();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Flywheel referral error", { error: msg });
    }
  }));

  // Flywheel step 3: Send early bird offers (+7 days after trip)
  scheduledTasks.push(cron.schedule("10 * * * *", async () => {
    try {
      await sendEarlyBirdOffers();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Flywheel early bird error", { error: msg });
    }
  }));

  // ===== CHATBOT SELF-IMPROVEMENT =====
  // Weekly insights report: every Monday at 06:00
  scheduledTasks.push(cron.schedule("0 6 * * 1", async () => {
    try {
      logger.info("[Scheduler] Running chatbot weekly insights");
      await generateWeeklyInsights();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Chatbot insights error", { error: msg });
    }
  }));

  // ===== GOOGLE BUSINESS PROFILE SYNC =====
  // Sync rating + review count + recent reviews from Google Places API.
  // Sundays at 03:00 UTC. Cost: ~$0.005/run × 52 runs/year ≈ $0.26/year.
  scheduledTasks.push(cron.schedule("0 3 * * 0", async () => {
    try {
      logger.info("[Scheduler] Running GBP weekly sync");
      const { syncGbpStats } = await import("./gbpSync");
      const result = await syncGbpStats();
      if (result.success) {
        logger.info("[Scheduler] GBP sync OK", {
          rating: result.rating,
          userRatingCount: result.userRatingCount,
        });
      } else {
        logger.warn("[Scheduler] GBP sync failed", { error: result.error });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] GBP sync crash", { error: msg });
    }
  }));

  // ===== LEAD NURTURING =====
  // Process chatbot leads every 2 hours at :20 (avoids overlap with other jobs)
  scheduledTasks.push(cron.schedule("20 */2 * * *", async () => {
    try {
      logger.info("[Scheduler] Running lead nurturing");
      await processLeadNurturing();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] Lead nurturing error", { error: msg });
    }
  }));

  // ===== SEO WAR ROOM — FASE 2 COLLECTORS =====
  // GSC query-level extract (full fidelity). Runs twice daily to absorb the
  // 3-day GSC reporting delay across re-runs.
  scheduledTasks.push(cron.schedule("30 2,14 * * *", async () => {
    try {
      const { collectGscQueries } = await import("../seo/collectors/gscQueries");
      logger.info("[Scheduler] Running GSC queries ETL");
      await collectGscQueries();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] GSC queries ETL error", { error: msg });
    }
  }));

  // GA4 daily landing-page metrics. Runs once a day after GA4 data stabilises.
  scheduledTasks.push(cron.schedule("45 3 * * *", async () => {
    try {
      const { collectGa4Daily } = await import("../seo/collectors/ga4Daily");
      logger.info("[Scheduler] Running GA4 daily ETL");
      await collectGa4Daily();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] GA4 daily ETL error", { error: msg });
    }
  }));

  // GA4 per-event conversion counts (booking_started, whatsapp_click, etc.).
  // Runs right after the aggregate GA4 ETL so both land in the same batch window.
  scheduledTasks.push(cron.schedule("55 3 * * *", async () => {
    try {
      const { collectGa4ConversionEvents } = await import("../seo/collectors/ga4ConversionEvents");
      logger.info("[Scheduler] Running GA4 conversion events ETL");
      await collectGa4ConversionEvents();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] GA4 conversion events ETL error", { error: msg });
    }
  }));

  // PageSpeed Insights (CWV + lab) for critical URLs. Daily.
  scheduledTasks.push(cron.schedule("15 4 * * *", async () => {
    try {
      const { collectPsi } = await import("../seo/collectors/psi");
      logger.info("[Scheduler] Running PSI collector");
      await collectPsi();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] PSI collector error", { error: msg });
    }
  }));

  // SERP snapshots (top-20 results per tracked keyword). Daily.
  scheduledTasks.push(cron.schedule("30 5 * * *", async () => {
    try {
      const { collectSerpSnapshots } = await import("../seo/collectors/serpSnapshots");
      logger.info("[Scheduler] Running SERP snapshots collector");
      await collectSerpSnapshots();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Scheduler] SERP snapshots error", { error: msg });
    }
  }));

  // Distribution engine: auto-publish pending tray items every 6h at :05.
  // Disabled by default — opt in by setting DISTRIBUTION_AUTO_PUBLISH=true
  // once you've validated the on-demand flow end-to-end.
  if (process.env.DISTRIBUTION_AUTO_PUBLISH === "true") {
    scheduledTasks.push(cron.schedule("5 */6 * * *", async () => {
      try {
        const { publishPending } = await import("./distribution/distributionEngine");
        logger.info("[Scheduler] Running distribution auto-publish");
        const result = await publishPending({ limit: 25 });
        logger.info("[Scheduler] distribution auto-publish completed", {
          attempted: result.attempted, ok: result.ok, failed: result.failed, skipped: result.skipped,
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error("[Scheduler] distribution auto-publish error", { error: msg });
      }
    }));
    logger.info("[Scheduler] Distribution auto-publish ENABLED (every 6h at :05)");
  }

  logger.info("Scheduled services started: reminders (:00), flywheel (:10), thank-you (:30), hold cleanup (every 5min), abandoned recovery (:15/:45), auto-complete (:45), blog autopilot (config), blog publish (Mon 9am), analytics sync (every 6h), newsletter (1st of month 10am), chatbot insights (Mon 6am), lead nurturing (every 2h at :20), GSC queries ETL (02:30/14:30), GA4 daily ETL (03:45), PSI collector (04:15), SERP snapshots (05:30)");
}

/**
 * Stop all scheduled cron jobs. Called during graceful shutdown.
 */
export function stopScheduler(): void {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.length = 0;
  logger.info("All scheduled tasks stopped");
}

/**
 * Send monthly newsletter with recent blog posts to all active subscribers.
 * Groups subscribers by language and sends localized content.
 */
async function processNewsletter(): Promise<void> {
  const subscribers = await storage.getActiveNewsletterSubscribers();
  if (subscribers.length === 0) {
    logger.info("[Newsletter] No active subscribers, skipping");
    return;
  }

  // Get posts published in the last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const recentPosts = await storage.getRecentPublishedBlogPosts(since);

  if (recentPosts.length === 0) {
    logger.info("[Newsletter] No recent posts to send");
    return;
  }

  // Group subscribers by language
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
    // Build localized post list (max 5 posts)
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
      if (result.success) {
        totalSent++;
      } else {
        totalFailed++;
      }
    }
  }

  logger.info("[Newsletter] Monthly digest sent", { totalSent, totalFailed, subscriberCount: subscribers.length, postsIncluded: Math.min(recentPosts.length, 5) });
}
