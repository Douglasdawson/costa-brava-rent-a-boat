import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../replitAuth";
import { storage } from "../storage";

// Import route modules
import { registerBoatRoutes } from "./boats";
import { registerBookingRoutes } from "./bookings";
import { registerPaymentRoutes } from "./payments";
import { registerAuthRoutes } from "./auth";
import { registerAdminRoutes } from "./admin";
import { registerSitemapRoutes } from "./sitemaps";
import { registerBlogRoutes } from "./blog";
import { registerDestinationRoutes } from "./destinations";
import { registerTestimonialRoutes } from "./testimonials";
import { registerWhatsAppRoutes } from "./whatsapp";
import { registerAvailabilityRoutes } from "./availability";
import { registerEmployeeRoutes } from "./employees";
import { registerGalleryRoutes } from "./gallery";
import { registerGiftCardRoutes } from "./giftcards";
import { registerDiscountRoutes } from "./discounts";
import { registerImageResizeRoutes } from "./imageResize";
import { registerTenantRoutes } from "./tenant";
import { registerNewsletterRoutes } from "./newsletter";
import { registerInquiryRoutes } from "./inquiries";
import { registerMetaWebhookRoutes } from "./metaWebhook";
import { registerHealthRoutes } from "./health";
import { registerAutoDiscountRoutes } from "./auto-discounts";
import { registerCompanyRoutes } from "./company";
import { registerAnalyticsRoutes } from "./admin-analytics";
import { registerMetaCAPIRoutes } from "./meta-capi";
import { registerMembershipRoutes } from "./memberships";
import { registerExperimentRoutes } from "./experiments";
import { registerFeatureFlagRoutes } from "./feature-flags";
import { registerTenantMetricsRoutes } from "./tenant-metrics";
import { registerPartnershipRoutes } from "./admin-partnerships";
import { registerGdprRoutes } from "./gdpr";
import { registerAdminMcpTokensRoutes } from "./admin-mcp-tokens";
import { registerSeoRoutes } from "./admin-seo";
import { registerAdminSeoAutopilotRoutes } from "./admin-seo-autopilot";
import { registerBusinessStatsRoutes } from "./business-stats";
import { registerAdminFlywheelRoutes } from "./admin-flywheel";
import { createSeoAutopilotRouter } from "../mcp/seo-autopilot";
import { startScheduledServices } from "../services";

export async function registerRoutes(app: Express, existingServer?: Server): Promise<Server> {
  // Setup Replit Auth (customer authentication) — non-blocking: fire-and-forget so it
  // doesn't delay the server listening during deployment health checks.
  if (process.env.REPLIT_DOMAINS) {
    setupAuth(app).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Startup] Replit Auth setup deferred error: ${msg}`);
    });
  }

  // Register all route modules (synchronous — fast)
  registerSitemapRoutes(app);
  registerBoatRoutes(app);
  registerBookingRoutes(app);
  registerPaymentRoutes(app);
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerBlogRoutes(app);
  registerDestinationRoutes(app);
  registerTestimonialRoutes(app);
  registerAvailabilityRoutes(app);
  registerEmployeeRoutes(app);
  registerGalleryRoutes(app);
  registerGiftCardRoutes(app);
  registerDiscountRoutes(app);
  registerImageResizeRoutes(app);
  registerTenantRoutes(app);
  registerNewsletterRoutes(app);
  registerInquiryRoutes(app);
  registerMetaWebhookRoutes(app);
  registerHealthRoutes(app);
  registerAutoDiscountRoutes(app);
  registerCompanyRoutes(app);
  registerAnalyticsRoutes(app);
  registerMetaCAPIRoutes(app);
  registerMembershipRoutes(app);
  registerExperimentRoutes(app);
  registerFeatureFlagRoutes(app);
  registerTenantMetricsRoutes(app);
  registerPartnershipRoutes(app);
  registerGdprRoutes(app);

  // SEO Autopilot — admin routes (dashboard APIs + token management)
  registerAdminMcpTokensRoutes(app);
  registerSeoRoutes(app);
  registerAdminSeoAutopilotRoutes(app);

  // Google Business Profile stats (rating + reviews, weekly cron sync)
  registerBusinessStatsRoutes(app);

  // Post-rental flywheel admin endpoints (manual back-fill of missed review requests)
  registerAdminFlywheelRoutes(app);

  // SEO Autopilot — public MCP server (bearer-token auth, rate-limited).
  // Mounted at /api/mcp/seo-autopilot — external MCP clients connect here.
  app.use("/api/mcp/seo-autopilot", createSeoAutopilotRouter());

  // WhatsApp routes — fire-and-forget: dynamic AI imports can be slow.
  // The webhook endpoints will be available once the import resolves (<5s typically).
  registerWhatsAppRoutes(app).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Startup] WhatsApp routes init error: ${msg}`);
  });

  // Social proof / FOMO notifications (lightweight, public, cached)
  app.get("/api/social-proof", async (_req, res) => {
    try {
      const recentBookings = await storage.getRecentSocialProofBookings();
      const now = Date.now();

      const activities = recentBookings.map((b) => ({
        name: b.customerName.split(" ")[0],
        nationality: b.customerNationality,
        boatName: b.boatName ?? b.boatId,
        people: b.numberOfPeople,
        hours: b.totalHours,
        date: b.bookingDate.toISOString().split("T")[0],
        minutesAgo: Math.floor((now - b.createdAt.getTime()) / 60000),
      }));

      res.set("Cache-Control", "public, max-age=300");
      res.json({ activities });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching social proof: " + message });
    }
  });

  // Start background scheduled services (email reminders, thank-you emails)
  startScheduledServices();

  // Return existing server if provided (pre-created in index.ts for early listening),
  // otherwise create a new one.
  const httpServer = existingServer ?? createServer(app);

  return httpServer;
}
