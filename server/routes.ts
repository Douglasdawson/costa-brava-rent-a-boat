import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertBookingExtraSchema, bookings } from "@shared/schema";
import { db } from "./db";
import { and, eq, lte } from "drizzle-orm";

// Server-side extras catalog for price validation
const EXTRAS_CATALOG = {
  "parking": { name: "Parking dentro del puerto", price: 10 },
  "cooler": { name: "Nevera", price: 5 },
  "snorkel": { name: "Equipo snorkel", price: 5 },
  "paddle": { name: "Tabla de paddlesurf", price: 25 },
  "seascooter": { name: "Seascooter", price: 50 }
};
import Stripe from "stripe";

// Initialize Stripe lazily only when needed
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    });
  }
  return stripe;
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

  // Admin routes for calendar/CRM - now protected
  app.get("/api/admin/bookings", requireAdminAuth, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching all bookings: " + error.message });
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
