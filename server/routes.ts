import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertBookingExtraSchema, updateBookingSchema, bookings, insertBoatSchema, insertTestimonialSchema, insertBlogPostSchema, insertDestinationSchema } from "@shared/schema";
import { db } from "./db";
import { and, eq, lte } from "drizzle-orm";
import Stripe from "stripe";
import { setupAuth, isAuthenticated } from "./replitAuth";
import memoize from "memoizee";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// Initialize Stripe lazily with proper validation
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    if (!secretKey.startsWith('sk_')) {
      throw new Error('Invalid Stripe secret key: must start with sk_');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
    });
  }
  return stripe;
};

// Server-side extras catalog for price validation
const EXTRAS_CATALOG = {
  "parking": { name: "Parking dentro del puerto", price: 10 },
  "cooler": { name: "Nevera", price: 5 },
  "snorkel": { name: "Equipo snorkel", price: 5 },
  "paddle": { name: "Tabla de paddlesurf", price: 25 },
  "seascooter": { name: "Seascooter", price: 50 }
};

// Simple admin authentication middleware
const requireAdminAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!adminToken) {
    return res.status(503).json({ message: "Admin access not configured" });
  }
  
  if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
  next();
};

// NOTE: robots.txt is now served as a static file from /public/robots.txt
// Old dynamic generator removed in favor of static file for better SEO control

// Cache for last successful sitemap XML (fallback on errors)
let lastSuccessfulSitemap: string | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (customer authentication)
  await setupAuth(app);
  
  // Get base URL for SEO endpoints from request or environment
  const getBaseUrl = (req?: any) => {
    if (req) {
      const protocol = req.protocol || 'https';
      const host = req.get('host') || req.get('Host');
      if (host) {
        return `${protocol}://${host}`;
      }
    }
    return process.env.BASE_URL || 'https://costa-brava-rent-a-boat-blanes.replit.app';
  };

  // NOTE: /robots.txt is now served as a static file from /public/robots.txt
  // Dynamic robots.txt handler removed - static file provides better SEO control

  // Define supported languages
  const SUPPORTED_LANGUAGES = ['es', 'en', 'ca', 'fr', 'de', 'nl', 'it', 'ru'];

  // Helper function to generate URL entries with language variants
  const generateUrlEntry = (baseUrl: string, path: string, priority: string, now: string, changeFreq: string = 'weekly') => {
    let urls = '';
    
    // Add main URL (Spanish - default)
    urls += `  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
    
    // Add language variants
    if (path !== '/') {
      SUPPORTED_LANGUAGES.forEach(lang => {
        if (lang !== 'es') {
          urls += `  <url>
    <loc>${baseUrl}${path}?lang=${lang}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
        }
      });
    } else {
      // For home page, add language variants
      SUPPORTED_LANGUAGES.forEach(lang => {
        if (lang !== 'es') {
          urls += `  <url>
    <loc>${baseUrl}/?lang=${lang}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
        }
      });
    }
    
    return urls;
  };

  // Sitemap Index - Main entry point
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();
      
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-boats.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-destinations.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(sitemapIndex);
    } catch (error: any) {
      console.error('Error generating sitemap index:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Pages Sitemap
  app.get("/sitemap-pages.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      // Home page (highest priority)
      sitemap += generateUrlEntry(baseUrl, '/', '1.0', now, 'daily');
      
      // Location pages
      const locationSlugs = ['blanes', 'lloret-de-mar', 'tossa-de-mar'];
      locationSlugs.forEach(slug => {
        sitemap += generateUrlEntry(baseUrl, `/alquiler-barcos-${slug}`, '0.7', now);
      });
      
      // FAQ page
      sitemap += generateUrlEntry(baseUrl, '/faq', '0.6', now);
      
      // Category pages
      sitemap += generateUrlEntry(baseUrl, '/barcos-sin-licencia', '0.7', now);
      sitemap += generateUrlEntry(baseUrl, '/barcos-con-licencia', '0.7', now);
      
      // Legal pages
      sitemap += generateUrlEntry(baseUrl, '/privacy-policy', '0.3', now, 'monthly');
      sitemap += generateUrlEntry(baseUrl, '/terms-conditions', '0.3', now, 'monthly');
      sitemap += generateUrlEntry(baseUrl, '/condiciones-generales', '0.3', now, 'monthly');
      sitemap += generateUrlEntry(baseUrl, '/cookies-policy', '0.3', now, 'monthly');

      sitemap += `</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error: any) {
      console.error('Error generating pages sitemap:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Boats Sitemap with image tags
  app.get("/sitemap-boats.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();
      
      const boats = await storage.getAllBoats();
      const activeBoats = boats.filter(b => b.isActive);
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

      activeBoats.forEach(boat => {
        const boatPath = `/barco/${boat.id}`;
        
        // Add main URL with image
        sitemap += `  <url>
    <loc>${baseUrl}${boatPath}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;
        
        // Add image tag if boat has image
        if (boat.imageUrl) {
          const imageUrl = boat.imageUrl.startsWith('http') 
            ? boat.imageUrl 
            : `${baseUrl}/object-storage/${boat.imageUrl}`;
          
          sitemap += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>Alquiler barco ${boat.name} en Blanes Costa Brava - ${boat.requiresLicense ? 'Con licencia' : 'Sin licencia'}</image:caption>
      <image:title>${boat.name} - Costa Brava Rent a Boat</image:title>
    </image:image>`;
        }
        
        sitemap += `
  </url>
`;
        
        // Add language variants
        SUPPORTED_LANGUAGES.forEach(lang => {
          if (lang !== 'es') {
            sitemap += `  <url>
    <loc>${baseUrl}${boatPath}?lang=${lang}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
          }
        });
      });

      sitemap += `</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error: any) {
      console.error('Error generating boats sitemap:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Blog Sitemap
  app.get("/sitemap-blog.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();
      
      const blogPosts = await storage.getAllBlogPosts();
      const publishedBlogPosts = blogPosts.filter(post => post.isPublished);
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      // Blog listing page
      sitemap += generateUrlEntry(baseUrl, '/blog', '0.6', now);
      
      // Blog posts
      publishedBlogPosts.forEach(post => {
        sitemap += generateUrlEntry(baseUrl, `/blog/${post.slug}`, '0.7', now);
      });

      sitemap += `</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error: any) {
      console.error('Error generating blog sitemap:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Destinations Sitemap with image tags
  app.get("/sitemap-destinations.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const now = new Date().toISOString();
      
      const destinations = await storage.getAllDestinations();
      const publishedDestinations = destinations.filter(dest => dest.isPublished);
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

      publishedDestinations.forEach(destination => {
        const destPath = `/destinos/${destination.slug}`;
        
        // Add main URL with image
        sitemap += `  <url>
    <loc>${baseUrl}${destPath}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>`;
        
        // Add image tag if destination has image
        if (destination.featuredImage) {
          const imageUrl = destination.featuredImage.startsWith('http') 
            ? destination.featuredImage 
            : `${baseUrl}/object-storage/${destination.featuredImage}`;
          
          sitemap += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>${destination.name} - Destino Costa Brava cerca de Blanes</image:caption>
      <image:title>${destination.name} - Costa Brava</image:title>
    </image:image>`;
        }
        
        sitemap += `
  </url>
`;
        
        // Add language variants
        SUPPORTED_LANGUAGES.forEach(lang => {
          if (lang !== 'es') {
            sitemap += `  <url>
    <loc>${baseUrl}${destPath}?lang=${lang}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
          }
        });
      });

      sitemap += `</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error: any) {
      console.error('Error generating destinations sitemap:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>');
    }
  });

  // Boat routes
  app.get("/api/boats", async (req, res) => {
    try {
      const boats = await storage.getAllBoats();
      console.log('API /api/boats - Retrieved boats count:', boats.length);
      console.log('API /api/boats - Boats data:', JSON.stringify(boats, null, 2));
      res.json(boats);
    } catch (error: any) {
      console.error('API /api/boats - Error:', error);
      res.status(500).json({ message: "Error fetching boats: " + error.message });
    }
  });

  app.get("/api/boats/:id", async (req, res) => {
    try {
      const boat = await storage.getBoat(req.params.id);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }
      res.json(boat);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching boat: " + error.message });
    }
  });

  // Enhanced availability check with seasonal validation and conflict details
  app.post("/api/boats/:id/check-availability", async (req, res) => {
    try {
      const { startTime, endTime } = req.body;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ 
          message: "La hora de inicio y fin son obligatorias",
          available: false,
          reason: "missing_params",
          conflictingBookings: []
        });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      // Validate time range
      if (start >= end) {
        return res.status(400).json({ 
          message: "La hora de inicio debe ser anterior a la hora de fin",
          available: false,
          reason: "invalid_time_range",
          conflictingBookings: []
        });
      }

      // Check if dates are in operational season (April-October)
      const { isOperationalSeason } = await import("@shared/pricing");
      const startInSeason = isOperationalSeason(start);
      const endInSeason = isOperationalSeason(end);

      if (!startInSeason || !endInSeason) {
        return res.json({ 
          available: false,
          reason: "out_of_season",
          message: "Las reservas solo están disponibles de abril a octubre",
          conflictingBookings: []
        });
      }

      // Check boat exists
      const boat = await storage.getBoat(req.params.id);
      if (!boat) {
        return res.status(404).json({ 
          message: "Barco no encontrado",
          available: false,
          reason: "boat_not_found",
          conflictingBookings: []
        });
      }

      // Check database availability (includes hold, pending_payment, confirmed bookings)
      const isAvailable = await storage.checkAvailability(req.params.id, start, end);

      // If not available, get conflicting bookings using same buffer logic
      let conflictingBookings: any[] = [];
      if (!isAvailable) {
        conflictingBookings = await storage.getOverlappingBookingsWithBuffer(
          req.params.id, 
          start, 
          end
        );
      }

      res.json({ 
        available: isAvailable,
        reason: isAvailable ? null : "booking_conflict",
        conflictingBookings: conflictingBookings.map(booking => ({
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.bookingStatus,
          customerName: `${booking.customerName} ${booking.customerSurname ? booking.customerSurname.charAt(0) : ''}.`
        }))
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error al verificar disponibilidad: " + error.message,
        available: false,
        reason: "server_error",
        conflictingBookings: []
      });
    }
  });

  // Alternative availability endpoint for frontend compatibility
  app.post("/api/check-availability", async (req, res) => {
    try {
      const { boatId, startTime, endTime } = req.body;

      if (!boatId || !startTime || !endTime) {
        return res.status(400).json({ 
          message: "Boat ID, start time and end time are required",
          available: false,
          reason: "missing_params",
          conflictingBookings: []
        });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      // Validate time range
      if (start >= end) {
        return res.status(400).json({ 
          message: "La hora de inicio debe ser anterior a la hora de fin",
          available: false,
          reason: "invalid_time_range",
          conflictingBookings: []
        });
      }

      // Check if dates are in operational season (April-October)
      const { isOperationalSeason } = await import("@shared/pricing");
      const startInSeason = isOperationalSeason(start);
      const endInSeason = isOperationalSeason(end);

      if (!startInSeason || !endInSeason) {
        return res.json({ 
          available: false,
          reason: "out_of_season",
          message: "Las reservas solo están disponibles de abril a octubre",
          conflictingBookings: []
        });
      }

      // Check boat exists
      const boat = await storage.getBoat(boatId);
      if (!boat) {
        return res.status(404).json({ 
          message: "Barco no encontrado",
          available: false,
          reason: "boat_not_found",
          conflictingBookings: []
        });
      }

      // Check database availability (includes hold, pending_payment, confirmed bookings)
      const isAvailable = await storage.checkAvailability(boatId, start, end);

      // If not available, get conflicting bookings using same buffer logic
      let conflictingBookings: any[] = [];
      if (!isAvailable) {
        conflictingBookings = await storage.getOverlappingBookingsWithBuffer(
          boatId, 
          start, 
          end
        );
      }

      res.json({ 
        available: isAvailable,
        reason: isAvailable ? null : "booking_conflict",
        conflictingBookings: conflictingBookings.map(booking => ({
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.bookingStatus,
          customerName: `${booking.customerName} ${booking.customerSurname ? booking.customerSurname.charAt(0) : ''}.`
        }))
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error al verificar disponibilidad: " + error.message,
        available: false,
        reason: "server_error",
        conflictingBookings: []
      });
    }
  });

  // Quote endpoint - Calculate pricing and create temporary hold
  app.post("/api/quote", async (req, res) => {
    try {
      const { boatId, startTime, endTime, numberOfPeople, extras } = req.body;
      
      // Validate required fields
      if (!boatId || !startTime || !endTime || !numberOfPeople) {
        return res.status(400).json({ 
          message: "Faltan campos obligatorios: boatId, startTime, endTime, numberOfPeople",
          available: false,
          reason: "missing_fields"
        });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      // Validate time range
      if (start >= end) {
        return res.status(400).json({ 
          message: "La hora de inicio debe ser anterior a la hora de fin",
          available: false,
          reason: "invalid_time_range"
        });
      }

      // Check if dates are in operational season
      const { isOperationalSeason, calculatePricingBreakdown } = await import("@shared/pricing");
      const startInSeason = isOperationalSeason(start);
      const endInSeason = isOperationalSeason(end);

      if (!startInSeason || !endInSeason) {
        return res.status(400).json({ 
          available: false,
          reason: "out_of_season",
          message: "Las reservas solo están disponibles de abril a octubre"
        });
      }

      // Check boat exists
      const boat = await storage.getBoat(boatId);
      if (!boat) {
        return res.status(404).json({ 
          message: "Barco no encontrado",
          available: false,
          reason: "boat_not_found"
        });
      }

      // Validate capacity
      if (numberOfPeople > boat.capacity) {
        return res.status(400).json({ 
          message: `Número de personas (${numberOfPeople}) excede la capacidad del barco (${boat.capacity})`,
          available: false,
          reason: "capacity_exceeded"
        });
      }

      // Check availability before creating quote
      const isAvailable = await storage.checkAvailability(boatId, start, end);
      if (!isAvailable) {
        const conflictingBookings = await storage.getOverlappingBookingsWithBuffer(boatId, start, end);
        return res.status(409).json({ 
          message: "El barco no está disponible en el horario seleccionado",
          available: false,
          reason: "booking_conflict",
          conflictingBookings: conflictingBookings.map(booking => ({
            id: booking.id,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.bookingStatus,
            customerName: `${booking.customerName} ${booking.customerSurname ? booking.customerSurname.charAt(0) : ''}.`
          }))
        });
      }

      // Calculate rental duration in hours
      const totalHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      
      // Map total hours to valid duration
      let duration: '1h' | '2h' | '3h' | '4h' | '6h' | '8h';
      if (totalHours <= 1) duration = '1h';
      else if (totalHours <= 2) duration = '2h';
      else if (totalHours <= 3) duration = '3h';
      else if (totalHours <= 4) duration = '4h';
      else if (totalHours <= 6) duration = '6h';
      else duration = '8h';

      // Calculate pricing using the seasonal pricing system
      const pricingBreakdown = calculatePricingBreakdown(boatId, start, duration, extras || []);

      // Create temporary hold (expires in 30 minutes)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const sessionId = (req.headers['x-session-id'] as string) || `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const holdBooking = await storage.createBooking({
        boatId,
        bookingDate: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
        startTime: start,
        endTime: end,
        customerName: "Hold Temporal",
        customerSurname: "Sistema",
        customerPhone: "N/A",
        customerNationality: "N/A",
        numberOfPeople,
        totalHours,
        subtotal: pricingBreakdown.basePrice.toString(),
        extrasTotal: pricingBreakdown.extrasPrice.toString(),
        deposit: pricingBreakdown.deposit.toString(),
        totalAmount: pricingBreakdown.total.toString(),
        bookingStatus: "hold",
        paymentStatus: "pending",
        sessionId,
        expiresAt,
        source: "web",
        notes: `Hold temporal para cotización. Expira: ${expiresAt.toISOString()}`
      });

      res.status(201).json({
        success: true,
        holdId: holdBooking.id,
        quote: {
          startTime,
          endTime,
          totalHours,
          numberOfPeople,
          ...pricingBreakdown
        },
        hold: {
          id: holdBooking.id,
          sessionId,
          expiresAt,
          expiresInMinutes: 30
        }
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error al generar cotización: " + error.message,
        available: false,
        reason: "server_error"
      });
    }
  });

  // Clean up expired holds - utility endpoint
  app.post("/api/cleanup-expired-holds", async (req, res) => {
    try {
      const now = new Date();
      
      // Find expired holds
      const expiredHolds = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.bookingStatus, "hold"),
            lte(bookings.expiresAt!, now)
          )
        );

      if (expiredHolds.length === 0) {
        return res.json({ 
          message: "No hay holds expirados para limpiar",
          cleaned: 0 
        });
      }

      // Delete expired holds
      const expiredIds = expiredHolds.map(hold => hold.id);
      const deletedCount = await db
        .delete(bookings)
        .where(
          and(
            eq(bookings.bookingStatus, "hold"),
            lte(bookings.expiresAt!, now)
          )
        );

      res.json({
        message: `Se limpiaron ${expiredHolds.length} holds expirados`,
        cleaned: expiredHolds.length,
        expiredIds
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error al limpiar holds expirados: " + error.message 
      });
    }
  });

  // Stripe payment endpoint for boat bookings
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      // Validate Stripe configuration
      let stripe: Stripe;
      try {
        stripe = getStripe();
      } catch (error: any) {
        return res.status(503).json({
          message: "Servicio de pagos no disponible: " + error.message,
          success: false
        });
      }

      const { holdId } = req.body;

      if (!holdId) {
        return res.status(400).json({
          message: "ID de hold requerido",
          success: false
        });
      }

      // Find the hold
      const hold = await storage.getBookingById(holdId);
      if (!hold) {
        return res.status(404).json({
          message: "Hold no encontrado",
          success: false
        });
      }

      if (hold.bookingStatus !== "hold") {
        return res.status(400).json({
          message: "El hold ya no está disponible",
          success: false,
          status: hold.bookingStatus
        });
      }

      // Check if hold has expired
      if (hold.expiresAt && new Date() > hold.expiresAt) {
        return res.status(410).json({
          message: "El hold ha expirado",
          success: false
        });
      }

      // Create Stripe PaymentIntent with EUR currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(hold.totalAmount) * 100), // Convert to cents
        currency: "eur",
        metadata: {
          holdId: hold.id,
          sessionId: hold.sessionId || "",
          boatId: hold.boatId,
          bookingDate: hold.bookingDate.toISOString(),
          startTime: hold.startTime.toISOString(),
          endTime: hold.endTime.toISOString(),
          numberOfPeople: hold.numberOfPeople.toString()
        },
        description: `Reserva de barco ${hold.boatId} - ${hold.bookingDate.toISOString().split('T')[0]}`
      });

      // Update booking to pending_payment status with payment intent
      await storage.updateBooking(hold.id, {
        bookingStatus: "pending_payment",
        paymentStatus: "pending",
        stripePaymentIntentId: paymentIntent.id
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: Number(hold.totalAmount),
        currency: "eur"
      });

    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({
        message: "Error al crear el intent de pago: " + error.message,
        success: false
      });
    }
  });

  // Mock payment endpoint for testing when Stripe keys are not properly configured
  // Only available in development mode or with admin authentication
  app.post("/api/create-payment-intent-mock", async (req, res) => {
    // Check if we're in production mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        message: "Endpoint no disponible en producción",
        success: false
      });
    }

    try {
      const { holdId } = req.body;

      if (!holdId) {
        return res.status(400).json({
          message: "ID de hold requerido",
          success: false
        });
      }

      // Find the hold
      const hold = await storage.getBookingById(holdId);
      if (!hold) {
        return res.status(404).json({
          message: "Hold no encontrado",
          success: false
        });
      }

      if (hold.bookingStatus !== "hold") {
        return res.status(400).json({
          message: "El hold ya no está disponible",
          success: false,
          status: hold.bookingStatus
        });
      }

      // Check if hold has expired
      if (hold.expiresAt && new Date() > hold.expiresAt) {
        return res.status(410).json({
          message: "El hold ha expirado",
          success: false
        });
      }

      // Mock PaymentIntent ID
      const mockPaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Update booking to pending_payment status with mock payment intent
      await storage.updateBooking(hold.id, {
        bookingStatus: "pending_payment",
        paymentStatus: "pending",
        stripePaymentIntentId: mockPaymentIntentId
      });

      res.json({
        success: true,
        clientSecret: `${mockPaymentIntentId}_secret_mock`,
        paymentIntentId: mockPaymentIntentId,
        amount: Number(hold.totalAmount),
        currency: "eur",
        mockMode: true,
        note: "This is a mock payment for testing. Use /api/simulate-payment-success to complete the payment."
      });

    } catch (error: any) {
      console.error("Error creating mock payment intent:", error);
      res.status(500).json({
        message: "Error al crear el intent de pago mock: " + error.message,
        success: false
      });
    }
  });

  // Simulate successful payment for testing
  // Only available in development mode or with admin authentication
  app.post("/api/simulate-payment-success", async (req, res) => {
    // Check if we're in production mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        message: "Endpoint no disponible en producción",
        success: false
      });
    }

    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({
          message: "PaymentIntent ID requerido",
          success: false
        });
      }

      // Find booking by payment intent ID
      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.stripePaymentIntentId, paymentIntentId))
        .limit(1);

      if (booking.length === 0) {
        return res.status(404).json({
          message: "Reserva no encontrada para este PaymentIntent",
          success: false
        });
      }

      const bookingRecord = booking[0];

      // Update booking to confirmed status
      await storage.updateBooking(bookingRecord.id, {
        bookingStatus: "confirmed",
        paymentStatus: "completed"
      });

      res.json({
        success: true,
        message: "Pago simulado exitosamente",
        bookingId: bookingRecord.id,
        status: "confirmed"
      });

    } catch (error: any) {
      console.error("Error simulating payment success:", error);
      res.status(500).json({
        message: "Error al simular el pago: " + error.message,
        success: false
      });
    }
  });

  // Stripe webhook endpoint for payment confirmations
  app.post("/api/stripe-webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    // Validate Stripe configuration and webhook secret
    let stripe: Stripe;
    try {
      stripe = getStripe();
    } catch (error: any) {
      console.error('Stripe not configured for webhook:', error.message);
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    // In production, require webhook secret
    if (process.env.NODE_ENV === 'production' && !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is required in production');
      return res.status(503).json({ error: 'Webhook not properly configured' });
    }

    let event: Stripe.Event;

    try {
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
        // In development mode, parse the event directly
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment succeeded:', paymentIntent.id);

          // Find booking by payment intent ID
          const booking = await db
            .select()
            .from(bookings)
            .where(eq(bookings.stripePaymentIntentId, paymentIntent.id))
            .limit(1);

          if (booking.length > 0) {
            const bookingRecord = booking[0];
            
            // Update booking to confirmed status
            await storage.updateBooking(bookingRecord.id, {
              bookingStatus: "confirmed",
              paymentStatus: "completed"
            });

            console.log(`Booking ${bookingRecord.id} confirmed after successful payment`);
          } else {
            console.warn(`No booking found for payment intent ${paymentIntent.id}`);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          console.log('Payment failed:', failedPayment.id);

          // Find booking by payment intent ID
          const failedBooking = await db
            .select()
            .from(bookings)
            .where(eq(bookings.stripePaymentIntentId, failedPayment.id))
            .limit(1);

          if (failedBooking.length > 0) {
            const bookingRecord = failedBooking[0];
            
            // Update payment status to failed but keep booking as pending_payment
            // They can retry the payment
            await storage.updateBooking(bookingRecord.id, {
              paymentStatus: "failed"
            });

            console.log(`Payment failed for booking ${bookingRecord.id}`);
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // ===== WHATSAPP CHATBOT ROUTES =====
  // Import WhatsApp webhook handlers
  const { handleWhatsAppWebhook, handleWebhookValidation, handleStatusCallback } = await import("./whatsapp/webhookHandler");

  // Main webhook endpoint for incoming WhatsApp messages
  app.post("/api/whatsapp/webhook", express.urlencoded({ extended: false }), handleWhatsAppWebhook);

  // Webhook validation endpoint (GET request from Twilio)
  app.get("/api/whatsapp/webhook", handleWebhookValidation);

  // Status callback for message delivery status
  app.post("/api/whatsapp/status", express.urlencoded({ extended: false }), handleStatusCallback);

  // Health check for WhatsApp integration
  app.get("/api/whatsapp/health", async (req, res) => {
    const { isTwilioConfigured } = await import("./whatsapp/twilioClient");
    res.json({
      configured: isTwilioConfigured(),
      webhookUrl: `${process.env.BASE_URL || req.protocol + '://' + req.get('host')}/api/whatsapp/webhook`,
    });
  });

  // ===== BOOKING ROUTES =====
  // NOTE: Public booking endpoint DISABLED per SEO requirements
  // Business decision: All reservations must go through WhatsApp (no PII on server)
  // If CRM needs to create bookings, use admin-protected endpoint instead
  
  /* DISABLED - WhatsApp-only policy
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Get boat data for validation and pricing
      const boat = await storage.getBoat(bookingData.boatId);
      if (!boat) {
        return res.status(404).json({ message: "Boat not found" });
      }

      // Validate capacity
      if (bookingData.numberOfPeople > boat.capacity) {
        return res.status(400).json({ 
          message: `Number of people (${bookingData.numberOfPeople}) exceeds boat capacity (${boat.capacity})` 
        });
      }

      // Check availability before creating booking
      const isAvailable = await storage.checkAvailability(
        bookingData.boatId,
        bookingData.startTime,
        bookingData.endTime
      );

      if (!isAvailable) {
        return res.status(409).json({ message: "Boat is not available at selected time" });
      }

      // Server-side calculation of totals to prevent tampering
      const basePrice = parseFloat(boat.pricePerHour || '0');
      const hours = bookingData.totalHours;
      const subtotal = basePrice * hours;
      
      // Calculate extras total - validate against server catalog
      let extrasTotal = 0;
      if (req.body.extras && Array.isArray(req.body.extras)) {
        for (const extra of req.body.extras) {
          const catalogExtra = EXTRAS_CATALOG[extra.id as keyof typeof EXTRAS_CATALOG];
          if (!catalogExtra) {
            return res.status(400).json({ message: `Invalid extra: ${extra.id}` });
          }
          // Use server price, not client price
          extrasTotal += catalogExtra.price * (extra.quantity || 1);
        }
      }
      
      const deposit = parseFloat(boat.deposit);
      const totalAmount = subtotal + extrasTotal + deposit;

      // Create booking with server-calculated totals
      const validatedBookingData = {
        ...bookingData,
        subtotal: subtotal.toString(),
        extrasTotal: extrasTotal.toString(),
        deposit: deposit.toString(),
        totalAmount: totalAmount.toString(),
      };

      const booking = await storage.createBooking(validatedBookingData);
      
      // Create extras if provided
      if (req.body.extras && Array.isArray(req.body.extras)) {
        for (const extra of req.body.extras) {
          const catalogExtra = EXTRAS_CATALOG[extra.id as keyof typeof EXTRAS_CATALOG];
          if (catalogExtra) {
            await storage.createBookingExtra({
              bookingId: booking.id,
              extraName: catalogExtra.name,
              extraPrice: catalogExtra.price.toString(),
              quantity: extra.quantity || 1
            });
          }
        }
      }

      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating booking: " + error.message });
    }
  });
  */ // END DISABLED booking endpoint

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get extras for this booking
      const extras = await storage.getBookingExtras(booking.id);
      
      res.json({ ...booking, extras });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching booking: " + error.message });
    }
  });

  // Get bookings by date for calendar view
  app.get("/api/bookings/date/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const bookings = await storage.getBookingsByDate(date);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching bookings: " + error.message });
    }
  });

  // Stripe payment intent for booking payment + deposit
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const stripeInstance = getStripe();
      if (!stripeInstance) {
        return res.status(503).json({ message: "Payment service unavailable - Stripe not configured" });
      }

      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      // Get booking from database to verify amount
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Use server-calculated total amount from booking
      const amount = parseFloat(booking.totalAmount);
      if (amount <= 0) {
        return res.status(400).json({ message: "Invalid booking amount" });
      }

      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur", // Costa Brava uses EUR
        metadata: {
          bookingId: bookingId
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Create Stripe Checkout Session for full payment experience
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripeInstance = getStripe();
      if (!stripeInstance) {
        return res.status(503).json({ message: "Payment service unavailable - Stripe not configured" });
      }

      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      // Get booking from database to create checkout session
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const amount = parseFloat(booking.totalAmount);
      if (amount <= 0) {
        return res.status(400).json({ message: "Invalid booking amount" });
      }

      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Reserva de barco - ${booking.boatId}`,
                description: `Reserva para ${booking.customerName} ${booking.customerSurname} el ${booking.bookingDate.toISOString().split('T')[0]}`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        cancel_url: `${req.headers.origin}/booking?step=6&booking_id=${bookingId}`,
        metadata: {
          bookingId: bookingId
        }
      });

      res.json({ 
        sessionId: session.id,
        url: session.url 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating checkout session: " + error.message });
    }
  });

  // Update booking payment status
  app.post("/api/bookings/:id/payment-status", async (req, res) => {
    try {
      const { status, stripePaymentIntentId } = req.body;
      
      // Validate payment status values
      const validStatuses = ["pending", "paid", "failed", "cancelled", "refunded"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: `Invalid payment status. Must be one of: ${validStatuses.join(", ")}` 
        });
      }
      
      const updatedBooking = await storage.updateBookingPaymentStatus(
        req.params.id,
        status,
        stripePaymentIntentId
      );

      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(updatedBooking);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating payment status: " + error.message });
    }
  });

  // WhatsApp status updates
  app.post("/api/bookings/:id/whatsapp-status", async (req, res) => {
    try {
      const { confirmationSent, reminderSent } = req.body;
      
      const updatedBooking = await storage.updateBookingWhatsAppStatus(
        req.params.id,
        confirmationSent,
        reminderSent
      );

      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(updatedBooking);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating WhatsApp status: " + error.message });
    }
  });

  // ==================== Customer Auth Routes ====================
  // Get current authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getCustomerUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout endpoint - redirects to OIDC logout
  app.post('/api/auth/logout', (req: any, res) => {
    // Simply redirect to the GET /api/logout which handles OIDC logout properly
    res.json({ 
      message: "Logout initiated",
      redirectUrl: "/api/logout"
    });
  });

  // Get customer profile
  app.get('/api/customer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customer = await storage.getCustomerByUserId(userId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer profile not found" });
      }

      res.json(customer);
    } catch (error: any) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ message: "Failed to fetch customer profile" });
    }
  });

  // Update customer profile
  app.patch('/api/customer/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customer = await storage.getCustomerByUserId(userId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer profile not found" });
      }

      const updates = req.body;
      const updatedCustomer = await storage.updateCustomer(customer.id, updates);

      res.json(updatedCustomer);
    } catch (error: any) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({ message: "Failed to update customer profile" });
    }
  });

  // Get customer bookings
  app.get('/api/customer/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customer = await storage.getCustomerByUserId(userId);
      
      if (!customer) {
        return res.json([]); // Return empty array if no profile yet
      }

      // Get all bookings for this customer using customerId
      const allBookings = await storage.getAllBookings();
      const customerBookings = allBookings.filter(booking => 
        booking.customerId === customer.id ||
        // Fallback for old bookings without customerId: match by email or phone
        booking.customerEmail === customer.email ||
        booking.customerPhone === `${customer.phonePrefix}${customer.phoneNumber}`
      );

      res.json(customerBookings);
    } catch (error: any) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { pin } = req.body;
      const adminPin = process.env.ADMIN_PIN;

      if (!adminPin) {
        return res.status(503).json({ message: "Admin access not configured" });
      }

      if (pin !== adminPin) {
        return res.status(401).json({ message: "PIN incorrecto" });
      }

      // Generate a simple token (in production, use JWT)
      const token = `admin_${Date.now()}_${Math.random().toString(36)}`;
      
      res.json({ 
        success: true, 
        token,
        message: "Login successful" 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error during login: " + error.message });
    }
  });

  // Middleware to check admin token from session
  const requireAdminSession = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const token = authHeader.substring(7);
    
    // Simple token validation (starts with admin_)
    if (!token.startsWith('admin_')) {
      return res.status(401).json({ message: "Token inválido" });
    }

    next();
  };

  // Admin boat management routes (protected)
  app.post("/api/admin/boats", requireAdminSession, async (req, res) => {
    try {
      const validationResult = insertBoatSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos",
          errors: validationResult.error.errors 
        });
      }

      const newBoat = await storage.createBoat(validationResult.data);
      res.status(201).json(newBoat);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating boat: " + error.message });
    }
  });

  app.patch("/api/admin/boats/:id", requireAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      const existingBoat = await storage.getBoat(id);
      if (!existingBoat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }

      const updatedBoat = await storage.updateBoat(id, req.body);
      res.json(updatedBoat);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating boat: " + error.message });
    }
  });

  app.delete("/api/admin/boats/:id", requireAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      const existingBoat = await storage.getBoat(id);
      if (!existingBoat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }

      await storage.updateBoat(id, { isActive: false });
      res.json({ message: "Barco desactivado correctamente" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting boat: " + error.message });
    }
  });

  app.post("/api/admin/boats/reorder", requireAdminSession, async (req, res) => {
    try {
      const { order } = req.body;
      
      if (!order || !Array.isArray(order)) {
        return res.status(400).json({ message: "Orden inválido" });
      }

      // Update display order for each boat
      for (const item of order) {
        await storage.updateBoat(item.id, { displayOrder: item.displayOrder });
      }

      res.json({ message: "Orden actualizado correctamente" });
    } catch (error: any) {
      res.status(500).json({ message: "Error reordering boats: " + error.message });
    }
  });

  // Admin routes for calendar/CRM - now protected
  app.get("/api/admin/bookings", requireAdminSession, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching all bookings: " + error.message });
    }
  });

  // Update booking - full edit support with validation
  app.patch("/api/admin/bookings/:id", requireAdminSession, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate booking exists
      const existingBooking = await storage.getBooking(id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      // Validate request body with Zod schema
      const validationResult = updateBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos",
          errors: validationResult.error.errors 
        });
      }

      const validatedUpdates = validationResult.data;

      // Prepare updates with proper type conversion
      const updates: any = {};
      
      if (validatedUpdates.customerName !== undefined) updates.customerName = validatedUpdates.customerName;
      if (validatedUpdates.customerSurname !== undefined) updates.customerSurname = validatedUpdates.customerSurname;
      if (validatedUpdates.customerPhone !== undefined) updates.customerPhone = validatedUpdates.customerPhone;
      if (validatedUpdates.customerEmail !== undefined) updates.customerEmail = validatedUpdates.customerEmail;
      if (validatedUpdates.customerNationality !== undefined) updates.customerNationality = validatedUpdates.customerNationality;
      if (validatedUpdates.numberOfPeople !== undefined) updates.numberOfPeople = validatedUpdates.numberOfPeople;
      if (validatedUpdates.boatId !== undefined) updates.boatId = validatedUpdates.boatId;
      if (validatedUpdates.startTime !== undefined) updates.startTime = validatedUpdates.startTime;
      if (validatedUpdates.endTime !== undefined) updates.endTime = validatedUpdates.endTime;
      if (validatedUpdates.totalHours !== undefined) updates.totalHours = validatedUpdates.totalHours;
      if (validatedUpdates.subtotal !== undefined) updates.subtotal = validatedUpdates.subtotal.toString();
      if (validatedUpdates.extrasTotal !== undefined) updates.extrasTotal = validatedUpdates.extrasTotal.toString();
      if (validatedUpdates.deposit !== undefined) updates.deposit = validatedUpdates.deposit.toString();
      if (validatedUpdates.totalAmount !== undefined) updates.totalAmount = validatedUpdates.totalAmount.toString();
      if (validatedUpdates.bookingStatus !== undefined) updates.bookingStatus = validatedUpdates.bookingStatus;
      if (validatedUpdates.paymentStatus !== undefined) updates.paymentStatus = validatedUpdates.paymentStatus;
      if (validatedUpdates.notes !== undefined) updates.notes = validatedUpdates.notes;

      // Update booking
      const updatedBooking = await storage.updateBooking(id, updates);
      
      if (!updatedBooking) {
        return res.status(500).json({ message: "Error actualizando la reserva" });
      }

      res.json({
        success: true,
        booking: updatedBooking,
        message: "Reserva actualizada exitosamente"
      });
    } catch (error: any) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Error actualizando reserva: " + error.message });
    }
  });

  // Get all unique customers from bookings
  app.get("/api/admin/customers", requireAdminSession, async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      
      // Create a map to aggregate customer data
      const customersMap = new Map();
      
      allBookings.forEach((booking: any) => {
        const key = `${booking.customerEmail || booking.customerPhone}`;
        
        if (!customersMap.has(key)) {
          customersMap.set(key, {
            customerName: booking.customerName,
            customerSurname: booking.customerSurname,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customerNationality: booking.customerNationality,
            bookingsCount: 0,
            totalSpent: 0,
            lastBookingDate: booking.startTime,
            bookingIds: []
          });
        }
        
        const customer = customersMap.get(key);
        customer.bookingsCount += 1;
        customer.totalSpent += parseFloat(booking.totalAmount);
        customer.bookingIds.push(booking.id);
        
        // Update last booking date if this one is more recent
        if (new Date(booking.startTime) > new Date(customer.lastBookingDate)) {
          customer.lastBookingDate = booking.startTime;
        }
      });
      
      // Convert map to array and sort by total spent
      const customers = Array.from(customersMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
      
      res.json(customers);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Error fetching customers: " + error.message });
    }
  });

  // Admin dashboard stats endpoint
  app.get("/api/admin/stats", requireAdminSession, async (req, res) => {
    try {
      const { period = "today" } = req.query;
      
      const now = new Date();
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === "today") {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "week") {
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "month") {
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const stats = await storage.getDashboardStats(startDate, endDate);
      const fleet = await storage.getFleetAvailability();

      res.json({
        ...stats,
        ...fleet,
        period
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching dashboard stats: " + error.message });
    }
  });

  // Initialize boats data - temporary endpoint for setup - now protected
  app.post("/api/admin/init-boats", requireAdminSession, async (req, res) => {
    try {
      // Import boat data from shared file
      const { BOAT_DATA } = await import("@shared/boatData");
      
      const boatsToCreate = Object.values(BOAT_DATA).map((boat: any) => {
        // Extract capacity number from string like "5 Personas"
        const capacityMatch = boat.specifications.capacity.match(/(\d+)/);
        const capacity = capacityMatch ? parseInt(capacityMatch[1]) : 5;
        
        // Extract deposit number from string like "250€"
        const depositMatch = boat.specifications.deposit.match(/(\d+)/);
        const deposit = depositMatch ? depositMatch[1] : "0";
        
        // Determine if license is required based on boat ID
        const requiresLicense = ['pacific-craft-625', 'trimarchi-57s', 'mingolla-brava-19'].includes(boat.id);
        
        return {
          id: boat.id,
          name: boat.name,
          capacity: capacity,
          requiresLicense: requiresLicense,
          deposit: deposit,
          isActive: true,
          imageUrl: boat.image || null,
          imageGallery: [],
          subtitle: boat.subtitle,
          description: boat.description,
          specifications: boat.specifications,
          equipment: boat.equipment,
          included: boat.included,
          features: boat.features,
          pricing: boat.pricing,
          extras: boat.extras,
        };
      });

      const createdBoats = [];
      for (const boatData of boatsToCreate) {
        try {
          const boat = await storage.createBoat(boatData);
          createdBoats.push(boat);
        } catch (error: any) {
          console.log(`Boat ${boatData.id} might already exist:`, error.message);
        }
      }

      res.json({ 
        message: "Boats initialization completed",
        created: createdBoats.length,
        total: boatsToCreate.length
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error initializing boats: " + error.message });
    }
  });

  // ===== TESTIMONIALS ROUTES =====
  
  // Get all verified testimonials (public)
  app.get("/api/testimonials", async (req, res) => {
    try {
      const { boatId } = req.query;
      
      let testimonialsData;
      if (boatId && typeof boatId === 'string') {
        testimonialsData = await storage.getTestimonialsByBoat(boatId);
      } else {
        testimonialsData = await storage.getTestimonials();
      }
      
      res.json(testimonialsData);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching testimonials: " + error.message });
    }
  });

  // Create a new testimonial (public - will be unverified by default)
  app.post("/api/testimonials", async (req, res) => {
    try {
      const validatedData = insertTestimonialSchema.parse(req.body);
      // isVerified defaults to false in database - only admins can verify
      const testimonial = await storage.createTestimonial(validatedData);
      res.status(201).json(testimonial);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating testimonial: " + error.message });
    }
  });

  // ===== BLOG ROUTES =====
  
  // Get all published blog posts (public)
  app.get("/api/blog", async (req, res) => {
    try {
      const { category } = req.query;
      
      let posts;
      if (category && typeof category === 'string') {
        posts = await storage.getBlogPostsByCategory(category);
      } else {
        posts = await storage.getPublishedBlogPosts();
      }
      
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching blog posts: " + error.message });
    }
  });

  // Get a single blog post by slug (public)
  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching blog post: " + error.message });
    }
  });

  // Get all blog posts (admin only)
  app.get("/api/admin/blog", requireAdminSession, async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching blog posts: " + error.message });
    }
  });

  // Create a new blog post (admin only)
  app.post("/api/admin/blog", requireAdminSession, async (req, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating blog post: " + error.message });
    }
  });

  // Update a blog post (admin only)
  app.put("/api/admin/blog/:id", requireAdminSession, async (req, res) => {
    try {
      const validatedData = insertBlogPostSchema.partial().parse(req.body);
      const post = await storage.updateBlogPost(req.params.id, validatedData);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating blog post: " + error.message });
    }
  });

  // Delete a blog post (admin only)
  app.delete("/api/admin/blog/:id", requireAdminSession, async (req, res) => {
    try {
      const success = await storage.deleteBlogPost(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json({ message: "Blog post deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting blog post: " + error.message });
    }
  });

  // ===== DESTINATION ROUTES =====
  
  // Get all published destinations (public)
  app.get("/api/destinations", async (req, res) => {
    try {
      const destinations = await storage.getPublishedDestinations();
      res.json(destinations);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching destinations: " + error.message });
    }
  });

  // Get a single destination by slug (public)
  app.get("/api/destinations/:slug", async (req, res) => {
    try {
      const destination = await storage.getDestinationBySlug(req.params.slug);
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json(destination);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching destination: " + error.message });
    }
  });

  // Get all destinations (admin only)
  app.get("/api/admin/destinations", requireAdminSession, async (req, res) => {
    try {
      const destinations = await storage.getAllDestinations();
      res.json(destinations);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching destinations: " + error.message });
    }
  });

  // Create a new destination (admin only)
  app.post("/api/admin/destinations", requireAdminSession, async (req, res) => {
    try {
      const validatedData = insertDestinationSchema.parse(req.body);
      const destination = await storage.createDestination(validatedData);
      res.status(201).json(destination);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating destination: " + error.message });
    }
  });

  // Update a destination (admin only)
  app.put("/api/admin/destinations/:id", requireAdminSession, async (req, res) => {
    try {
      const validatedData = insertDestinationSchema.partial().parse(req.body);
      const destination = await storage.updateDestination(req.params.id, validatedData);
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json(destination);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating destination: " + error.message });
    }
  });

  // Delete a destination (admin only)
  app.delete("/api/admin/destinations/:id", requireAdminSession, async (req, res) => {
    try {
      const success = await storage.deleteDestination(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json({ message: "Destination deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting destination: " + error.message });
    }
  });

  // ===== OBJECT STORAGE ROUTES =====
  // Reference: javascript_object_storage blueprint integration
  
  // Endpoint to serve uploaded boat images (public access without auth)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Endpoint to get presigned upload URL for boat images (admin only)
  app.post("/api/admin/boat-images/upload", requireAdminSession, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Endpoint to normalize uploaded image URLs for boat (admin only)
  app.post("/api/admin/boat-images/normalize", requireAdminSession, async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(imageUrl);
      
      res.json({ normalizedPath });
    } catch (error: any) {
      console.error("Error normalizing image URL:", error);
      res.status(500).json({ error: "Failed to normalize image URL" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
