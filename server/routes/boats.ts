import type { Express } from "express";
import { storage } from "../storage";

export function registerBoatRoutes(app: Express) {
  // Get all active boats
  app.get("/api/boats", async (req, res) => {
    try {
      const boats = await storage.getAllBoats();
      console.log("API /api/boats - Retrieved boats count:", boats.length);
      res.json(boats);
    } catch (error: any) {
      console.error("API /api/boats - Error:", error);
      res.status(500).json({ message: "Error fetching boats: " + error.message });
    }
  });

  // Get single boat by ID
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

  // Check availability for a specific boat
  app.post("/api/boats/:id/check-availability", async (req, res) => {
    try {
      const { startTime, endTime } = req.body;

      if (!startTime || !endTime) {
        return res.status(400).json({
          message: "La hora de inicio y fin son obligatorias",
          available: false,
          reason: "missing_params",
          conflictingBookings: [],
        });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return res.status(400).json({
          message: "La hora de inicio debe ser anterior a la hora de fin",
          available: false,
          reason: "invalid_time_range",
          conflictingBookings: [],
        });
      }

      const { isOperationalSeason } = await import("@shared/pricing");
      const startInSeason = isOperationalSeason(start);
      const endInSeason = isOperationalSeason(end);

      if (!startInSeason || !endInSeason) {
        return res.json({
          available: false,
          reason: "out_of_season",
          message: "Las reservas solo están disponibles de abril a octubre",
          conflictingBookings: [],
        });
      }

      const boat = await storage.getBoat(req.params.id);
      if (!boat) {
        return res.status(404).json({
          message: "Barco no encontrado",
          available: false,
          reason: "boat_not_found",
          conflictingBookings: [],
        });
      }

      const isAvailable = await storage.checkAvailability(req.params.id, start, end);

      let conflictingBookings: any[] = [];
      if (!isAvailable) {
        conflictingBookings = await storage.getOverlappingBookingsWithBuffer(req.params.id, start, end);
      }

      res.json({
        available: isAvailable,
        reason: isAvailable ? null : "booking_conflict",
        conflictingBookings: conflictingBookings.map(booking => ({
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.bookingStatus,
          customerName: `${booking.customerName} ${booking.customerSurname ? booking.customerSurname.charAt(0) : ""}.`,
        })),
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Error al verificar disponibilidad: " + error.message,
        available: false,
        reason: "server_error",
        conflictingBookings: [],
      });
    }
  });

  // Alternative availability check endpoint
  app.post("/api/check-availability", async (req, res) => {
    try {
      const { boatId, startTime, endTime } = req.body;

      if (!boatId || !startTime || !endTime) {
        return res.status(400).json({
          message: "Boat ID, start time and end time are required",
          available: false,
          reason: "missing_params",
          conflictingBookings: [],
        });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return res.status(400).json({
          message: "La hora de inicio debe ser anterior a la hora de fin",
          available: false,
          reason: "invalid_time_range",
          conflictingBookings: [],
        });
      }

      const { isOperationalSeason } = await import("@shared/pricing");
      if (!isOperationalSeason(start) || !isOperationalSeason(end)) {
        return res.json({
          available: false,
          reason: "out_of_season",
          message: "Las reservas solo están disponibles de abril a octubre",
          conflictingBookings: [],
        });
      }

      const boat = await storage.getBoat(boatId);
      if (!boat) {
        return res.status(404).json({
          message: "Barco no encontrado",
          available: false,
          reason: "boat_not_found",
          conflictingBookings: [],
        });
      }

      const isAvailable = await storage.checkAvailability(boatId, start, end);

      let conflictingBookings: any[] = [];
      if (!isAvailable) {
        conflictingBookings = await storage.getOverlappingBookingsWithBuffer(boatId, start, end);
      }

      res.json({
        available: isAvailable,
        reason: isAvailable ? null : "booking_conflict",
        conflictingBookings: conflictingBookings.map(booking => ({
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.bookingStatus,
          customerName: `${booking.customerName} ${booking.customerSurname ? booking.customerSurname.charAt(0) : ""}.`,
        })),
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Error al verificar disponibilidad: " + error.message,
        available: false,
        reason: "server_error",
        conflictingBookings: [],
      });
    }
  });
}
