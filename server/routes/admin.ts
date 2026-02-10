import type { Express } from "express";
import { storage } from "../storage";
import { updateBookingSchema, insertBoatSchema } from "@shared/schema";
import { requireAdminSession } from "./auth";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";

export function registerAdminRoutes(app: Express) {
  // ===== BOAT MANAGEMENT =====

  app.post("/api/admin/boats", requireAdminSession, async (req, res) => {
    try {
      const validationResult = insertBoatSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos inválidos",
          errors: validationResult.error.errors,
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
      const updatedBoat = await storage.updateBoat(req.params.id, req.body);
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
      const { order } = req.body;
      if (!order || !Array.isArray(order)) {
        return res.status(400).json({ message: "Orden inválido" });
      }
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

  app.get("/api/admin/bookings", requireAdminSession, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching all bookings: " + error.message });
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
          message: "Datos inválidos",
          errors: validationResult.error.errors,
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
        period,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching dashboard stats: " + error.message });
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
}
