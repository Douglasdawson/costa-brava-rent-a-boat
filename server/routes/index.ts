import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../replitAuth";

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

  // WhatsApp routes are async due to dynamic imports
  await registerWhatsAppRoutes(app);

  // Start background scheduled services (email reminders, thank-you emails)
  startScheduledServices();

  const httpServer = createServer(app);

  return httpServer;
}
