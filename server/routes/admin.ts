import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import {
  updateBookingSchema, insertBookingSchema, insertBoatSchema,
  updateCrmCustomerSchema, insertCheckinSchema,
  insertMaintenanceLogSchema, updateMaintenanceLogSchema,
  insertBoatDocumentSchema, updateBoatDocumentSchema,
  insertInventoryItemSchema, updateInventoryItemSchema,
  insertInventoryMovementSchema,
  insertTenantSchema, updateTenantSchema,
} from "@shared/schema";
import { requireAdminSession } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";
import { format } from "date-fns";

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

const paginatedCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  search: z.string().optional(),
  segment: z.string().optional(),
  nationality: z.string().optional(),
  sortBy: z.enum(["name", "totalBookings", "totalSpent", "lastBookingDate", "createdAt"]).optional().default("lastBookingDate"),
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

  // ===== CRM CUSTOMER MANAGEMENT =====

  // Paginated customers list with search and filters
  app.get("/api/admin/customers", requireAdminSession, async (req, res) => {
    try {
      const queryParsed = paginatedCustomersQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        return res.status(400).json({
          message: "Parametros invalidos",
          errors: queryParsed.error.flatten().fieldErrors,
        });
      }

      const result = await storage.getPaginatedCrmCustomers(queryParsed.data);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching customers:", message);
      res.status(500).json({ message: "Error fetching customers: " + message });
    }
  });

  // Get single customer profile with booking history
  app.get("/api/admin/customers/:id", requireAdminSession, async (req, res) => {
    try {
      const result = await storage.getCrmCustomerById(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching customer: " + message });
    }
  });

  // Update customer (notes, tags, nationality, documentId, etc.)
  app.patch("/api/admin/customers/:id", requireAdminSession, async (req, res) => {
    try {
      const parsed = updateCrmCustomerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const updated = await storage.updateCrmCustomer(req.params.id, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      res.json({ success: true, customer: updated, message: "Cliente actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error updating customer: " + message });
    }
  });

  // Sync all customers from bookings data
  app.post("/api/admin/customers/sync", requireAdminSession, async (req, res) => {
    try {
      const result = await storage.syncAllCustomersFromBookings();
      res.json({
        success: true,
        message: `Sincronizacion completada: ${result.created} creados, ${result.updated} actualizados`,
        ...result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error syncing customers: " + message });
    }
  });

  // Export customers as CSV
  app.get("/api/admin/customers/export", requireAdminSession, async (req, res) => {
    try {
      const result = await storage.getPaginatedCrmCustomers({
        page: 1,
        limit: 10000,
        sortBy: "totalSpent",
        sortOrder: "desc",
      });

      const headers = [
        "Nombre", "Apellidos", "Email", "Telefono", "Nacionalidad",
        "Documento", "Segmento", "Total Reservas", "Total Gastado",
        "Primera Reserva", "Ultima Reserva", "Notas", "Tags"
      ];

      const rows = result.data.map((c) => [
        c.name,
        c.surname,
        c.email || "",
        c.phone,
        c.nationality || "",
        c.documentId || "",
        c.segment,
        String(c.totalBookings),
        c.totalSpent,
        c.firstBookingDate ? format(new Date(c.firstBookingDate), "dd/MM/yyyy") : "",
        c.lastBookingDate ? format(new Date(c.lastBookingDate), "dd/MM/yyyy") : "",
        (c.notes || "").replace(/"/g, '""'),
        (c.tags || []).join(", "),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
      ].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=clientes_${format(new Date(), "yyyy-MM-dd")}.csv`);
      res.send("\uFEFF" + csvContent);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error exporting customers: " + message });
    }
  });

  // ===== CHECK-IN / CHECK-OUT =====

  // Create check-in or check-out
  app.post("/api/admin/checkins", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertCheckinSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      // Verify booking exists
      const booking = await storage.getBooking(parsed.data.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      // Check for duplicates
      const existing = await storage.getLatestCheckin(parsed.data.bookingId, parsed.data.type);
      if (existing) {
        return res.status(409).json({
          message: `Ya existe un ${parsed.data.type === "checkin" ? "check-in" : "check-out"} para esta reserva`,
        });
      }

      // Set performedBy from JWT token
      const adminUser = (req as unknown as Record<string, unknown>).adminUser as { username: string } | undefined;
      const checkinData = {
        ...parsed.data,
        performedBy: adminUser?.username || "admin",
      };

      const newCheckin = await storage.createCheckin(checkinData);

      res.status(201).json({
        success: true,
        checkin: newCheckin,
        message: `${parsed.data.type === "checkin" ? "Check-in" : "Check-out"} registrado correctamente`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error creating checkin:", message);
      res.status(500).json({ message: "Error creating checkin: " + message });
    }
  });

  // Get check-ins for a booking
  app.get("/api/admin/checkins/booking/:bookingId", requireAdminSession, async (req, res) => {
    try {
      const checkinsList = await storage.getCheckinsByBooking(req.params.bookingId);
      res.json(checkinsList);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching checkins: " + message });
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

  // ===== MAINTENANCE LOGS =====

  app.get("/api/admin/maintenance", requireAdminSession, async (req, res) => {
    try {
      const boatId = req.query.boatId as string | undefined;
      const logs = await storage.getMaintenanceLogs(boatId);
      res.json(logs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching maintenance logs: " + message });
    }
  });

  app.get("/api/admin/maintenance/upcoming", requireAdminSession, async (req, res) => {
    try {
      const upcoming = await storage.getUpcomingMaintenance();
      res.json(upcoming);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching upcoming maintenance: " + message });
    }
  });

  app.post("/api/admin/maintenance", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertMaintenanceLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const adminUser = (req as unknown as Record<string, unknown>).adminUser as { username: string } | undefined;
      const log = await storage.createMaintenanceLog({
        ...parsed.data,
        createdBy: adminUser?.username || "admin",
      });
      res.status(201).json({ success: true, log, message: "Mantenimiento registrado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error creating maintenance log: " + message });
    }
  });

  app.patch("/api/admin/maintenance/:id", requireAdminSession, async (req, res) => {
    try {
      const parsed = updateMaintenanceLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const updated = await storage.updateMaintenanceLog(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Registro no encontrado" });
      res.json({ success: true, log: updated, message: "Mantenimiento actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error updating maintenance log: " + message });
    }
  });

  app.delete("/api/admin/maintenance/:id", requireAdminSession, async (req, res) => {
    try {
      const deleted = await storage.deleteMaintenanceLog(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Registro no encontrado" });
      res.json({ success: true, message: "Mantenimiento eliminado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error deleting maintenance log: " + message });
    }
  });

  // ===== BOAT DOCUMENTS =====

  app.get("/api/admin/documents", requireAdminSession, async (req, res) => {
    try {
      const boatId = req.query.boatId as string | undefined;
      const docs = await storage.getBoatDocuments(boatId);
      res.json(docs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching documents: " + message });
    }
  });

  app.get("/api/admin/documents/expiring", requireAdminSession, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const expiring = await storage.getExpiringDocuments(days);
      res.json(expiring);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching expiring documents: " + message });
    }
  });

  app.post("/api/admin/documents", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertBoatDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const doc = await storage.createBoatDocument(parsed.data);
      res.status(201).json({ success: true, document: doc, message: "Documento registrado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error creating document: " + message });
    }
  });

  app.patch("/api/admin/documents/:id", requireAdminSession, async (req, res) => {
    try {
      const parsed = updateBoatDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const updated = await storage.updateBoatDocument(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Documento no encontrado" });
      res.json({ success: true, document: updated, message: "Documento actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error updating document: " + message });
    }
  });

  app.delete("/api/admin/documents/:id", requireAdminSession, async (req, res) => {
    try {
      const deleted = await storage.deleteBoatDocument(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Documento no encontrado" });
      res.json({ success: true, message: "Documento eliminado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error deleting document: " + message });
    }
  });

  // ===== INVENTORY =====

  app.get("/api/admin/inventory", requireAdminSession, async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching inventory: " + message });
    }
  });

  app.get("/api/admin/inventory/low-stock", requireAdminSession, async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching low stock items: " + message });
    }
  });

  app.get("/api/admin/inventory/:id", requireAdminSession, async (req, res) => {
    try {
      const item = await storage.getInventoryItem(req.params.id);
      if (!item) return res.status(404).json({ message: "Item no encontrado" });
      res.json(item);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching inventory item: " + message });
    }
  });

  app.post("/api/admin/inventory", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertInventoryItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const item = await storage.createInventoryItem(parsed.data);
      res.status(201).json({ success: true, item, message: "Item creado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error creating inventory item: " + message });
    }
  });

  app.patch("/api/admin/inventory/:id", requireAdminSession, async (req, res) => {
    try {
      const parsed = updateInventoryItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const updated = await storage.updateInventoryItem(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Item no encontrado" });
      res.json({ success: true, item: updated, message: "Item actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error updating inventory item: " + message });
    }
  });

  app.delete("/api/admin/inventory/:id", requireAdminSession, async (req, res) => {
    try {
      const deleted = await storage.deleteInventoryItem(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Item no encontrado" });
      res.json({ success: true, message: "Item eliminado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error deleting inventory item: " + message });
    }
  });

  // Inventory movements
  app.get("/api/admin/inventory/:id/movements", requireAdminSession, async (req, res) => {
    try {
      const movements = await storage.getInventoryMovements(req.params.id);
      res.json(movements);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching movements: " + message });
    }
  });

  app.post("/api/admin/inventory/:id/movements", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertInventoryMovementSchema.safeParse({
        ...req.body,
        itemId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
      }
      const adminUser = (req as unknown as Record<string, unknown>).adminUser as { username: string } | undefined;
      const movement = await storage.createInventoryMovement({
        ...parsed.data,
        createdBy: adminUser?.username || "admin",
      });
      res.status(201).json({ success: true, movement, message: "Movimiento registrado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error creating movement: " + message });
    }
  });

  // ===== REPORTS =====

  app.get("/api/admin/reports/fleet-utilization", requireAdminSession, async (req, res) => {
    try {
      const period = (req.query.period as string) || "season";
      const performance = await storage.getBoatsPerformance(period as "month" | "season" | "year");
      const maintenanceLogs = await storage.getMaintenanceLogs();
      const maintenanceCosts = new Map<string, number>();
      for (const log of maintenanceLogs) {
        const cost = parseFloat(log.cost || "0");
        maintenanceCosts.set(log.boatId, (maintenanceCosts.get(log.boatId) || 0) + cost);
      }

      const data = performance.map(boat => ({
        ...boat,
        maintenanceCost: Math.round((maintenanceCosts.get(boat.boatId) || 0) * 100) / 100,
        netRevenue: Math.round((boat.revenue - (maintenanceCosts.get(boat.boatId) || 0)) * 100) / 100,
      }));

      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error generating fleet report: " + message });
    }
  });

  app.get("/api/admin/reports/maintenance-summary", requireAdminSession, async (req, res) => {
    try {
      const logs = await storage.getMaintenanceLogs();
      const completed = logs.filter(l => l.status === "completed");
      const scheduled = logs.filter(l => l.status === "scheduled");
      const inProgress = logs.filter(l => l.status === "in_progress");
      const totalCost = completed.reduce((sum, l) => sum + parseFloat(l.cost || "0"), 0);
      const byType = {
        preventive: logs.filter(l => l.type === "preventive").length,
        corrective: logs.filter(l => l.type === "corrective").length,
        inspection: logs.filter(l => l.type === "inspection").length,
      };

      res.json({
        total: logs.length,
        completed: completed.length,
        scheduled: scheduled.length,
        inProgress: inProgress.length,
        totalCost: Math.round(totalCost * 100) / 100,
        byType,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error generating maintenance report: " + message });
    }
  });

  app.get("/api/admin/reports/top-customers", requireAdminSession, async (req, res) => {
    try {
      const result = await storage.getPaginatedCrmCustomers({
        page: 1,
        limit: 20,
        sortBy: "totalSpent",
        sortOrder: "desc",
      });
      res.json(result.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching top customers: " + message });
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

  // ===== TENANT MANAGEMENT =====

  // Seed default tenant and migrate existing data
  app.post("/api/admin/seed-tenant", requireAdminSession, async (req, res) => {
    try {
      const tenant = await storage.seedDefaultTenant();
      res.json({
        success: true,
        tenant,
        message: "Tenant creado y datos migrados correctamente",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error seeding tenant: " + message });
    }
  });

  // Get all tenants
  app.get("/api/admin/tenants", requireAdminSession, async (req, res) => {
    try {
      const allTenants = await storage.getAllTenants();
      res.json(allTenants);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching tenants: " + message });
    }
  });

  // Get tenant by ID
  app.get("/api/admin/tenants/:id", requireAdminSession, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.params.id);
      if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
      res.json(tenant);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error fetching tenant: " + message });
    }
  });

  // Create tenant
  app.post("/api/admin/tenants", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const tenant = await storage.createTenant(parsed.data);
      res.status(201).json({ success: true, tenant, message: "Tenant creado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error creating tenant: " + message });
    }
  });

  // Update tenant
  app.patch("/api/admin/tenants/:id", requireAdminSession, async (req, res) => {
    try {
      const parsed = updateTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      const updated = await storage.updateTenant(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Tenant no encontrado" });
      res.json({ success: true, tenant: updated, message: "Tenant actualizado" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error updating tenant: " + message });
    }
  });
}
