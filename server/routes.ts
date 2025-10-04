import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertBookingExtraSchema, bookings } from "@shared/schema";
import { db } from "./db";
import { and, eq, lte } from "drizzle-orm";
import Stripe from "stripe";

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

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  // SEO routes - Must be first to avoid being caught by Vite middleware
  app.get("/robots.txt", (req, res) => {
    const baseUrl = getBaseUrl(req);
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /crm/
Disallow: /crm/*
Disallow: /api/
Disallow: /api/*
Disallow: /booking/confirmation
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml`;

    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Sitemap.xml endpoint
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = getBaseUrl(req);
    const now = new Date().toISOString();
    
    // Define all boats IDs (from the boat data)
    const boatIds = [
      'solar-450', 'remus-450', 'astec-400', 'astec-450', 
      'pacific-craft-625', 'trimarchi-57s', 'mingolla-brava-19'
    ];
    
    // Define location slugs
    const locationSlugs = ['blanes', 'lloret-de-mar', 'tossa-de-mar'];
    
    // Define supported languages
    const languages = ['es', 'en', 'ca', 'fr', 'de', 'nl', 'it', 'ru'];
    
    // Helper function to generate URL entries with language variants
    const generateUrlEntry = (path: string, priority: string, changeFreq: string = 'weekly') => {
      let urls = '';
      
      // Add main URL (Spanish - default)
      urls += `  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
      
      // Add language variants for non-home pages
      if (path !== '/') {
        languages.forEach(lang => {
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
        languages.forEach(lang => {
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

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Home page (highest priority)
    sitemap += generateUrlEntry('/', '1.0', 'daily');
    
    // Boat detail pages
    boatIds.forEach(boatId => {
      sitemap += generateUrlEntry(`/barco/${boatId}`, '0.8');
    });
    
    // Location pages  
    locationSlugs.forEach(slug => {
      sitemap += generateUrlEntry(`/alquiler-barcos-${slug}`, '0.7');
    });
    
    // FAQ page
    sitemap += generateUrlEntry('/faq', '0.6');
    
    // Category pages
    sitemap += generateUrlEntry('/barcos-sin-licencia', '0.7');
    sitemap += generateUrlEntry('/barcos-con-licencia', '0.7');
    
    // Legal pages
    sitemap += generateUrlEntry('/privacy-policy', '0.3', 'monthly');
    sitemap += generateUrlEntry('/terms-conditions', '0.3', 'monthly');
    sitemap += generateUrlEntry('/condiciones-generales', '0.3', 'monthly');

    sitemap += `</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Boat routes
  app.get("/api/boats", async (req, res) => {
    try {
      const boats = await storage.getAllBoats();
      res.json(boats);
    } catch (error: any) {
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

  // Booking routes
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
      const basePrice = parseFloat(boat.pricePerHour);
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

  // Admin routes for calendar/CRM - now protected
  app.get("/api/admin/bookings", requireAdminSession, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching all bookings: " + error.message });
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
  app.post("/api/admin/init-boats", requireAdminAuth, async (req, res) => {
    try {
      // Import SERVER_BOAT_DATA from server-specific file (no PNG imports)
      const { SERVER_BOAT_DATA } = await import("./boatData");
      
      const boatsToCreate = [
        {
          id: "solar-450",
          name: "Solar 450",
          capacity: 5,
          requiresLicense: false,
          pricePerHour: "75", // Base price from BAJA season
          deposit: "250",
          specifications: {
            model: "Solar 450",
            length: "4,50m",
            beam: "1,50m",
            engine: "Mercury 15cv 4t",
            fuel: "Gasolina 30L",
          },
          equipment: ["Toldo", "Arranque eléctrico", "Gran solárium de proa", "Escalera de baño", "Equipo de seguridad y salvamento"]
        },
        {
          id: "remus-450",
          name: "Remus 450",
          capacity: 5,
          requiresLicense: false,
          pricePerHour: "75",
          deposit: "200",
          specifications: {
            model: "Remus 450",
            length: "4,5m",
            beam: "1,6m",
            engine: "Suzuki 15cv 4t",
            fuel: "Gasolina 25L",
          },
          equipment: ["Toldo Bi Mini", "Solárium amplio", "Escalera de baño", "Equipo de seguridad y salvamento"]
        },
        {
          id: "astec-400",
          name: "Astec 400",
          capacity: 5,
          requiresLicense: false,
          pricePerHour: "75",
          deposit: "250",
          specifications: {
            model: "Astec 400",
            length: "4,00m",
            beam: "1,50m",
            engine: "Mercury 15cv 4t",
            fuel: "Gasolina 20L",
          },
          equipment: ["Toldo", "Solárium", "Escalera de baño", "Equipo de seguridad y salvamento"]
        },
        {
          id: "astec-450",
          name: "Astec 450",
          capacity: 6,
          requiresLicense: false,
          pricePerHour: "85",
          deposit: "300",
          specifications: {
            model: "Astec 450",
            length: "4,50m",
            beam: "1,80m",
            engine: "Mercury 20cv 4t",
            fuel: "Gasolina 30L",
          },
          equipment: ["Toldo", "Gran solárium", "Escalera de baño", "Equipo de seguridad y salvamento"]
        },
        {
          id: "pacific-craft-625",
          name: "Pacific Craft 625",
          capacity: 7,
          requiresLicense: true,
          pricePerHour: "120",
          deposit: "400",
          specifications: {
            model: "Pacific Craft 625",
            length: "6,25m",
            beam: "2,40m",
            engine: "Mercury 115cv 4t",
            fuel: "Gasolina 150L",
          },
          equipment: ["Toldo Bimini", "Solárium proa y popa", "Escalera de baño", "Equipo de navegación", "Equipo de seguridad"]
        },
        {
          id: "trimarchi-57s",
          name: "Trimarchi 57S",
          capacity: 8,
          requiresLicense: true,
          pricePerHour: "140",
          deposit: "500",
          specifications: {
            model: "Trimarchi 57S",
            length: "5,70m",
            beam: "2,30m",
            engine: "Mercury 100cv 4t",
            fuel: "Gasolina 120L",
          },
          equipment: ["Toldo Bimini", "Solárium delantero", "Mesa central", "Escalera de baño", "Equipo de navegación"]
        },
        {
          id: "mingolla-brava-19",
          name: "Mingolla Brava 19",
          capacity: 8,
          requiresLicense: true,
          pricePerHour: "150",
          deposit: "600",
          specifications: {
            model: "Mingolla Brava 19",
            length: "5,80m",
            beam: "2,50m",
            engine: "Mercury 150cv 4t",
            fuel: "Gasolina 180L",
          },
          equipment: ["Toldo eléctrico", "Solárium de proa", "Mesa convertible", "Ducha", "Escalera de baño", "GPS"]
        }
      ];

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

  const httpServer = createServer(app);

  return httpServer;
}
