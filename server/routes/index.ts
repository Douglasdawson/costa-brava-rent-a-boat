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
import { registerGeoRoutes } from "./geo";
import { registerBlogRoutes } from "./blog";
import { registerDestinationRoutes } from "./destinations";
import { registerTestimonialRoutes } from "./testimonials";
import { registerWhatsAppRoutes } from "./whatsapp";
import { registerAvailabilityRoutes } from "./availability";
import { registerEmployeeRoutes } from "./employees";
import { registerGalleryRoutes } from "./gallery";
import { registerGiftCardRoutes } from "./giftcards";
import { registerShopRoutes } from "./shop";
import { registerAdminShopRoutes } from "./admin-shop";
import { registerDiscountRoutes } from "./discounts";
import { registerImageResizeRoutes } from "./imageResize";
import { registerTenantRoutes } from "./tenant";
import { registerNewsletterRoutes } from "./newsletter";
import { registerInquiryRoutes } from "./inquiries";
import { registerJetskiRoutes } from "./jetski";
import { registerMetaWebhookRoutes } from "./metaWebhook";
import { registerHealthRoutes } from "./health";
import { registerAdminIntegrationsRoutes, logIntegrationsHealthOnStartup } from "./admin-integrations";
import { registerCompanyRoutes } from "./company";
import { registerAnalyticsRoutes } from "./admin-analytics";
import { registerAdsRoutes } from "./admin-ads";
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
import { registerPublicSeoSnapshotRoutes } from "./public-seo-snapshot";
import { registerAdminSeoPilotsRoutes } from "./admin-seo-pilots";
import { registerAdminDistributionRoutes } from "./admin-distribution";
import { registerLinkedinOAuthRoutes } from "./oauth-linkedin";
import { registerGbpOAuthRoutes } from "./oauth-gbp";
import { registerBusinessStatsRoutes } from "./business-stats";
import { registerAdminFlywheelRoutes } from "./admin-flywheel";
import { registerAdminPricingOverridesRoutes } from "./admin-pricing-overrides";
import { registerAdminPricingOverrideTemplatesRoutes } from "./admin-pricing-override-templates";
import { registerPricingRoutes } from "./pricing";
import { registerOpenApiRoutes } from "./openapi";
import { registerAiMentionsRoutes } from "./admin-ai-mentions";
import { registerCitationExperimentsRoutes } from "./admin-citation-experiments";
import { createSeoAutopilotRouter } from "../mcp/seo-autopilot";
import { createPublicMcpRouter } from "../mcp/public";
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
  registerGeoRoutes(app);
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
  registerShopRoutes(app);
  registerAdminShopRoutes(app);
  registerDiscountRoutes(app);
  registerImageResizeRoutes(app);
  registerTenantRoutes(app);
  registerNewsletterRoutes(app);
  registerInquiryRoutes(app);
  registerJetskiRoutes(app);
  registerMetaWebhookRoutes(app);
  registerHealthRoutes(app);
  registerAdminIntegrationsRoutes(app);
  registerCompanyRoutes(app);
  registerAnalyticsRoutes(app);
  registerAdsRoutes(app);
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

  // Public read-only SEO snapshot (key-protected, for external observability agents)
  registerPublicSeoSnapshotRoutes(app);

  // SEO pilots — measurement history + manual trigger (admin-only)
  registerAdminSeoPilotsRoutes(app);

  // Distribution Engine — on-demand publish + LinkedIn OAuth
  registerAdminDistributionRoutes(app);
  registerLinkedinOAuthRoutes(app);
  registerGbpOAuthRoutes(app);

  // Google Business Profile stats (rating + reviews, weekly cron sync)
  registerBusinessStatsRoutes(app);

  // Post-rental flywheel admin endpoints (manual back-fill of missed review requests)
  registerAdminFlywheelRoutes(app);

  // Dynamic pricing — admin overrides + public calendar endpoint
  registerAdminPricingOverridesRoutes(app);
  registerAdminPricingOverrideTemplatesRoutes(app);
  registerPricingRoutes(app);

  // OpenAPI 3.1 spec at /openapi.json — for SDK generation, agent discovery
  // and Swagger UI rendering. Documents every public endpoint here.
  registerOpenApiRoutes(app);

  // AI Mentions Monitor — admin dashboard endpoints (citation rate, share of
  // voice, sentiment). Cron in schedulerService runs the nightly probe.
  registerAiMentionsRoutes(app);

  // Citation A/B testing — admin CRUD over citation_experiments, plus a
  // results endpoint that runs a two-proportion z-test per variant pair.
  registerCitationExperimentsRoutes(app);

  // SEO Autopilot — internal MCP server (bearer-token auth, rate-limited).
  // Mounted at /api/mcp/seo-autopilot — only external clients holding a token.
  app.use("/api/mcp/seo-autopilot", createSeoAutopilotRouter());

  // Public MCP server — NO authentication required. Mounted at /api/mcp/public.
  // Designed for Claude Desktop / Cursor / Continue / LangGraph etc. to connect
  // and use the read-mostly tools (search_boats, check_availability,
  // get_pricing_calendar, etc.). Rate-limited to 60 req/min/IP.
  app.use("/api/mcp/public", createPublicMcpRouter());

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

  // Log a one-line verdict on revenue-critical integrations so a deploy that
  // silently lost an env var (e.g. SENDGRID_API_KEY -> no lead notifications) is
  // visible in the logs without anyone hitting the diagnostic endpoint.
  logIntegrationsHealthOnStartup();

  // Return existing server if provided (pre-created in index.ts for early listening),
  // otherwise create a new one.
  const httpServer = existingServer ?? createServer(app);

  return httpServer;
}
