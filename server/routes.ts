/**
 * Routes Module
 *
 * This file re-exports the modular route structure from ./routes/index.ts
 *
 * The routes are organized in the following modules:
 * - boats.ts: Boat CRUD and availability endpoints
 * - bookings.ts: Booking management, quotes, holds
 * - payments.ts: Stripe payment integration
 * - auth.ts: Customer auth, admin login
 * - admin.ts: Admin-only endpoints (boats, bookings, customers, stats)
 * - blog.ts: Blog posts (public + admin)
 * - destinations.ts: Destinations (public + admin)
 * - testimonials.ts: Testimonials (public)
 * - whatsapp.ts: WhatsApp chatbot integration
 * - sitemaps.ts: SEO sitemaps
 */

export { registerRoutes } from "./routes/index";
