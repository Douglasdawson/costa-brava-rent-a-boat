import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { updateBookingSchema, insertBookingSchema, insertBoatSchema } from "@shared/schema";
import { requireAdminSession } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";

const boatReorderSchema = z.object({
  order: z.array(z.object({
    id: z.string().min(1),
    displayOrder: z.number().int().min(0),
  })).min(1, "Orden requerido"),
});

const normalizeImageSchema = z.object({
  imageUrl: z.string().min(1, "imageUrl es requerido"),
});

const adminStatsQuerySchema = z.object({
  period: z.enum(["today", "week", "month", "season", "year"]).optional().default("today"),
});

const revenueTrendQuerySchema = z.object({
  period: z.enum(["30d", "90d", "365d"]).optional().default("30d"),
});

const boatsPerformanceQuerySchema = z.object({
  period: z.enum(["month", "season", "year"]).optional().default("month"),
});

const statusDistributionQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const calendarBookingsQuerySchema = z.object({
  startDate: z.coerce.date({ required_error: "startDate es requerido" }),
  endDate: z.coerce.date({ required_error: "endDate es requerido" }),
  boatId: z.string().optional(),
});

const paginatedBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["startTime", "createdAt", "bookingDate"]).optional().default("startTime"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export function registerAdminRoutes(app: Express) {
  // ===== BOAT MANAGEMENT =====

  app.post("/api/admin/boats", requireAdminSession, async (req, res) => {
    try {
      const validationResult = insertBoatSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: validationResult.error.flatten().fieldErrors,
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
      const existingBoat = await storage.getBoat(req.params.id);
      if (!existingBoat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }
      const parsed = insertBoatSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const updatedBoat = await storage.updateBoat(req.params.id, parsed.data);
      res.json(updatedBoat);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating boat: " + error.message });
    }
  });

  app.delete("/api/admin/boats/:id", requireAdminSession, async (req, res) => {
    try {
      const existingBoat = await storage.getBoat(req.params.id);
      if (!existingBoat) {
        return res.status(404).json({ message: "Barco no encontrado" });
      }
      await storage.updateBoat(req.params.id, { isActive: false });
      res.json({ message: "Barco desactivado correctamente" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting boat: " + error.message });
    }
  });

  app.post("/api/admin/boats/reorder", requireAdminSession, async (req, res) => {
    try {
      const parsed = boatReorderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { order } = parsed.data;
      for (const item of order) {
        await storage.updateBoat(item.id, { displayOrder: item.displayOrder });
      }
      res.json({ message: "Orden actualizado correctamente" });
    } catch (error: any) {
      res.status(500).json({ message: "Error reordering boats: " + error.message });
    }
  });

  app.post("/api/admin/init-boats", requireAdminSession, async (req, res) => {
    try {
      const { BOAT_DATA } = await import("@shared/boatData");

      const boatsToCreate = Object.values(BOAT_DATA).map((boat: any) => {
        const capacityMatch = boat.specifications.capacity.match(/(\d+)/);
        const capacity = capacityMatch ? parseInt(capacityMatch[1]) : 5;
        const depositMatch = boat.specifications.deposit.match(/(\d+)/);
        const deposit = depositMatch ? depositMatch[1] : "0";
        const requiresLicense = ["pacific-craft-625", "trimarchi-57s", "mingolla-brava-19"].includes(
          boat.id
        );

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
        total: boatsToCreate.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error initializing boats: " + error.message });
    }
  });

  // ===== BOOKING MANAGEMENT =====

  // Create a new booking manually (from CRM)
  app.post("/api/admin/bookings", requireAdminSession, async (req, res) => {
    try {
      const bookingData = {
        ...req.body,
        source: "admin",
      };

      const validationResult = insertBookingSchema.safeParse(bookingData);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const newBooking = await storage.createBooking(validationResult.data);

      res.status(201).json({
        success: true,
        booking: newBooking,
        message: "Reserva creada exitosamente",
      });
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Error creando reserva: " + error.message });
    }
  });

  // Calendar bookings: all bookings in a date range (no pagination)
  app.get("/api/admin/bookings/calendar", requireAdminSession, async (req, res) => {
    try {
      const queryParsed = calendarBookingsQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Parametros invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const { startDate, endDate, boatId } = queryParsed.data;

      const calendarBookings = await storage.getBookingsForCalendar({
        startDate,
        endDate,
        boatId,
      });

      res.json(calendarBookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching calendar bookings: " + error.message });
    }
  });

  app.get("/api/admin/bookings", requireAdminSession, async (req, res) => {
    try {
      const queryParsed = paginatedBookingsQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Parametros invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const { page, limit, status, search, sortBy, sortOrder } = queryParsed.data;

      const result = await storage.getPaginatedBookings({
        page,
        limit,
        status,
        search,
        sortBy,
        sortOrder,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching bookings: " + error.message });
    }
  });

  app.patch("/api/admin/bookings/:id", requireAdminSession, async (req, res) => {
    try {
      const existingBooking = await storage.getBooking(req.params.id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      const validationResult = updateBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const validatedUpdates = validationResult.data;
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

      const updatedBooking = await storage.updateBooking(req.params.id, updates);

      if (!updatedBooking) {
        return res.status(500).json({ message: "Error actualizando la reserva" });
      }

      res.json({
        success: true,
        booking: updatedBooking,
        message: "Reserva actualizada exitosamente",
      });
    } catch (error: any) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Error actualizando reserva: " + error.message });
    }
  });

  // ===== CUSTOMER MANAGEMENT =====

  app.get("/api/admin/customers", requireAdminSession, async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
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
            bookingIds: [],
          });
        }

        const customer = customersMap.get(key);
        customer.bookingsCount += 1;
        customer.totalSpent += parseFloat(booking.totalAmount);
        customer.bookingIds.push(booking.id);

        if (new Date(booking.startTime) > new Date(customer.lastBookingDate)) {
          customer.lastBookingDate = booking.startTime;
        }
      });

      const customers = Array.from(customersMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
      res.json(customers);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Error fetching customers: " + error.message });
    }
  });

  // ===== DASHBOARD STATS =====

  app.get("/api/admin/stats", requireAdminSession, async (req, res) => {
    try {
      const queryParsed = adminStatsQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const { period } = queryParsed.data;

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
      } else if (period === "season") {
        // Season: April 1 to October 31 of current year
        startDate = new Date(now.getFullYear(), 3, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      const stats = await storage.getDashboardStatsEnhanced(startDate, endDate);
      const fleet = await storage.getFleetAvailability();

      res.json({
        ...stats,
        ...fleet,
        period,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching dashboard stats: " + error.message });
    }
  });

  // Revenue trend for charts
  app.get("/api/admin/stats/revenue-trend", requireAdminSession, async (req, res) => {
    try {
      const queryParsed = revenueTrendQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }
      const trend = await storage.getRevenueTrend(queryParsed.data.period);
      res.json(trend);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching revenue trend: " + error.message });
    }
  });

  // Boats performance comparison
  app.get("/api/admin/stats/boats-performance", requireAdminSession, async (req, res) => {
    try {
      const queryParsed = boatsPerformanceQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }
      const performance = await storage.getBoatsPerformance(queryParsed.data.period);
      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching boats performance: " + error.message });
    }
  });

  // Status distribution
  app.get("/api/admin/stats/status-distribution", requireAdminSession, async (req, res) => {
    try {
      const queryParsed = statusDistributionQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const now = new Date();
      const startDate = queryParsed.data.startDate || new Date(now.getFullYear(), 0, 1);
      const endDate = queryParsed.data.endDate || now;

      const distribution = await storage.getStatusDistribution(startDate, endDate);
      res.json(distribution);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching status distribution: " + error.message });
    }
  });

  // ===== IMAGE UPLOAD =====

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

  app.post("/api/admin/boat-images/normalize", requireAdminSession, async (req, res) => {
    try {
      const parsed = normalizeImageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { imageUrl } = parsed.data;
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(imageUrl);
      res.json({ normalizedPath });
    } catch (error: any) {
      console.error("Error normalizing image URL:", error);
      res.status(500).json({ error: "Failed to normalize image URL" });
    }
  });

  // ===== BLOG SEED =====

  app.post("/api/admin/seed-blog", requireAdminSession, async (req, res) => {
    try {
      const { seedBlogPosts } = await import("../seeds/blogSeed");
      const created = await seedBlogPosts(storage);
      res.json({
        message: "Blog seed completed",
        created,
        total: 6,
      });
    } catch (error: any) {
      console.error("Error seeding blog posts:", error);
      res.status(500).json({ message: "Error seeding blog posts: " + error.message });
    }
  });
}
