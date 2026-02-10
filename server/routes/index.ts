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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (customer authentication)
  await setupAuth(app);

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

  // WhatsApp routes are async due to dynamic imports
  await registerWhatsAppRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
