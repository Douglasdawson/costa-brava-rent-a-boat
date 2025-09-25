import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertBookingExtraSchema } from "@shared/schema";
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
  const adminToken = process.env.ADMIN_TOKEN || "admin-secret-2024";
  
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

  // Availability check
  app.post("/api/boats/:id/check-availability", async (req, res) => {
    try {
      const { startTime, endTime } = req.body;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ message: "Start time and end time are required" });
      }

      const isAvailable = await storage.checkAvailability(
        req.params.id,
        new Date(startTime),
        new Date(endTime)
      );

      res.json({ available: isAvailable });
    } catch (error: any) {
      res.status(500).json({ message: "Error checking availability: " + error.message });
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
      
      // Calculate extras total
      let extrasTotal = 0;
      if (req.body.extras && Array.isArray(req.body.extras)) {
        for (const extra of req.body.extras) {
          extrasTotal += extra.price * (extra.quantity || 1);
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
          await storage.createBookingExtra({
            bookingId: booking.id,
            extraName: extra.name,
            extraPrice: extra.price.toString(),
            quantity: extra.quantity || 1
          });
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

      const { amount, bookingId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur", // Costa Brava uses EUR
        metadata: {
          bookingId: bookingId || "unknown"
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

  // Update booking payment status
  app.post("/api/bookings/:id/payment-status", async (req, res) => {
    try {
      const { status, stripePaymentIntentId } = req.body;
      
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
      // Import BOAT_DATA from shared file
      const { BOAT_DATA } = await import("@shared/boatData");
      
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
