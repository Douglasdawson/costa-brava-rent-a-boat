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
import { registerSuperAdminRoutes } from "./superadmin";
import { registerNewsletterRoutes } from "./newsletter";
import { registerInquiryRoutes } from "./inquiries";
import { registerMetaWebhookRoutes } from "./metaWebhook";
import { registerHealthRoutes } from "./health";
import { startScheduledServices } from "../services";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (customer authentication) — skip in local development
  if (process.env.REPLIT_DOMAINS) {
    await setupAuth(app);
  }

  // Register all route modules
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
  registerSuperAdminRoutes(app);
  registerNewsletterRoutes(app);
  registerInquiryRoutes(app);
  registerMetaWebhookRoutes(app);
  registerHealthRoutes(app);

  // WhatsApp routes are async due to dynamic imports
  await registerWhatsAppRoutes(app);

  // Social proof / FOMO notifications (lightweight, public, cached)
  app.get("/api/social-proof", async (_req, res) => {
    try {
      const [recentBookings, allBoats] = await Promise.all([
        storage.getRecentSocialProofBookings(),
        storage.getAllBoats(),
      ]);

      const boatNameMap = new Map(allBoats.map((b) => [b.id, b.name]));
      const now = Date.now();

      const activities = recentBookings.map((b) => ({
        name: b.customerName.split(" ")[0],
        nationality: b.customerNationality,
        boatName: boatNameMap.get(b.boatId) ?? b.boatId,
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

  const httpServer = createServer(app);

  return httpServer;
}
