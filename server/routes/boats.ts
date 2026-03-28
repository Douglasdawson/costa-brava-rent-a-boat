import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { logger } from "../lib/logger";
import { db } from "../db";
import { bookings, boats } from "@shared/schema";
import { gte, sql, and, inArray, eq, desc } from "drizzle-orm";

const checkAvailabilitySchema = z.object({
  startTime: z.string().min(1, "La hora de inicio es requerida"),
  endTime: z.string().min(1, "La hora de fin es requerida"),
});

const checkAvailabilityWithBoatSchema = checkAvailabilitySchema.extend({
  boatId: z.string().min(1, "El ID del barco es requerido"),
});

// In-memory daily view counter (resets on server restart)
const dailyViews = new Map<string, { count: number; date: string }>();

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function registerBoatRoutes(app: Express) {
  // GET /api/boats/:id/views - Get and increment view count
  app.get("/api/boats/:id/views", (req, res) => {
    const boatId = req.params.id;
    const today = getTodayStr();

    const current = dailyViews.get(boatId);
    if (!current || current.date !== today) {
      dailyViews.set(boatId, { count: 1, date: today });
    } else {
      current.count += 1;
    }

    const views = dailyViews.get(boatId)!.count;
    res.setHeader("Cache-Control", "no-cache");
    res.json({ views });
  });

  // Weekly bookings count per boat (social proof)
  app.get("/api/boats/weekly-bookings", async (req, res) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const rows = await db
        .select({
          boatId: bookings.boatId,
          count: sql<number>`count(*)::int`,
        })
        .from(bookings)
        .where(
          and(
            gte(bookings.createdAt, sevenDaysAgo),
            inArray(bookings.bookingStatus, ['confirmed', 'completed', 'pending_payment'])
          )
        )
        .groupBy(bookings.boatId);

      const result: Record<string, number> = {};
      for (const row of rows) {
        result[row.boatId] = row.count;
      }

      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.json(result);
    } catch (error: unknown) {
      logger.error("[Boats] Error fetching weekly bookings", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Recent booking activity for social proof (no PII — only boat name, people count, timestamp)
  app.get("/api/recent-activity", async (req, res) => {
    try {
      const rows = await db
        .select({
          boatName: boats.name,
          numberOfPeople: bookings.numberOfPeople,
          createdAt: bookings.createdAt,
          country: bookings.customerNationality,
        })
        .from(bookings)
        .innerJoin(boats, eq(bookings.boatId, boats.id))
        .where(
          inArray(bookings.bookingStatus, ["confirmed", "completed"])
        )
        .orderBy(desc(bookings.createdAt))
        .limit(5);

      res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600");
      res.json(rows);
    } catch (error: unknown) {
      logger.error("[Boats] Error fetching recent activity", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.json([]);
    }
  });

  // Get all active boats
  app.get("/api/boats", async (req, res) => {
    try {
      const boats = await storage.getAllBoats();
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
      res.json(boats);
    } catch (error: unknown) {
      logger.error("[Boats] Error fetching boats", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
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
    } catch (error: unknown) {
      logger.error("[Boats] Error fetching boat", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Check availability for a specific boat
  app.post("/api/boats/:id/check-availability", async (req, res) => {
    try {
      const parsed = checkAvailabilitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          available: false,
          reason: "missing_params",
          errors: parsed.error.flatten().fieldErrors,
          conflictingBookings: [],
        });
      }

      const { startTime, endTime } = parsed.data;

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
    } catch (error: unknown) {
      logger.error("[Boats] Error checking availability", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        message: "Error interno del servidor",
        available: false,
        reason: "server_error",
        conflictingBookings: [],
      });
    }
  });

  // Alternative availability check endpoint
  app.post("/api/check-availability", async (req, res) => {
    try {
      const parsed = checkAvailabilityWithBoatSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Datos invalidos",
          available: false,
          reason: "missing_params",
          errors: parsed.error.flatten().fieldErrors,
          conflictingBookings: [],
        });
      }

      const { boatId, startTime, endTime } = parsed.data;

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
    } catch (error: unknown) {
      logger.error("[Boats] Error checking availability", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        message: "Error interno del servidor",
        available: false,
        reason: "server_error",
        conflictingBookings: [],
      });
    }
  });
}
