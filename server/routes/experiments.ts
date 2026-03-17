import type { Express } from "express";
import { storage } from "../storage";
import { logger } from "../lib/logger";
import { requireAdminSession } from "./auth-middleware";
import {
  insertExperimentSchema,
  updateExperimentSchema,
  assignExperimentSchema,
  trackExperimentEventSchema,
  type ExperimentVariant,
} from "@shared/schema";
import { z } from "zod";

export function registerExperimentRoutes(app: Express) {
  // ===== PUBLIC ENDPOINTS =====

  /**
   * GET /api/experiments/active
   * Returns all active experiments (cached in storage layer).
   * Public endpoint - used by the client to know which experiments are running.
   */
  app.get("/api/experiments/active", async (_req, res) => {
    try {
      const active = await storage.getActiveExperiments();

      // Only expose what the client needs: name, variants, targetPages
      const publicData = active.map((exp) => ({
        name: exp.name,
        variants: exp.variants,
        targetPages: exp.targetPages,
      }));

      res.set("Cache-Control", "public, max-age=60");
      res.json(publicData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Experiments] Error fetching active experiments", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * POST /api/experiments/assign
   * Assigns a visitor to a variant for a given experiment.
   * Deterministic: same sessionId always gets the same variant.
   */
  app.post("/api/experiments/assign", async (req, res) => {
    try {
      const parsed = assignExperimentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const { experimentName, sessionId } = parsed.data;

      const experiment = await storage.getExperimentByName(experimentName);
      if (!experiment || experiment.status !== "active") {
        return res.status(404).json({ message: "Experimento no encontrado o no activo" });
      }

      const variants = experiment.variants as ExperimentVariant[];
      const assignment = await storage.getOrCreateAssignment(experiment.id, sessionId, variants);

      res.json({
        experimentName: experiment.name,
        variant: assignment.variant,
        sessionId: assignment.sessionId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Experiments] Error assigning variant", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * POST /api/experiments/track
   * Track a conversion event (view, click, booking_started, booking_completed).
   */
  app.post("/api/experiments/track", async (req, res) => {
    try {
      const parsed = trackExperimentEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }

      const { experimentName, sessionId, variant, eventType, metadata } = parsed.data;

      const experiment = await storage.getExperimentByName(experimentName);
      if (!experiment) {
        return res.status(404).json({ message: "Experimento no encontrado" });
      }

      await storage.trackExperimentEvent(
        experiment.id,
        sessionId,
        variant,
        eventType,
        metadata,
      );

      // Fire-and-forget style response - don't block on success details
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Experiments] Error tracking event", { error: message });
      // Return 204 anyway to not break client-side tracking on errors
      res.status(204).send();
    }
  });

  // ===== ADMIN ENDPOINTS =====

  /**
   * GET /api/admin/experiments
   * List all experiments (any status).
   */
  app.get("/api/admin/experiments", requireAdminSession, async (_req, res) => {
    try {
      const all = await storage.getAllExperiments();
      res.json(all);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Experiments] Error listing experiments", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * POST /api/admin/experiments
   * Create a new experiment.
   */
  app.post("/api/admin/experiments", requireAdminSession, async (req, res) => {
    try {
      const parsed = insertExperimentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues.map((i) => i.message).join(", "),
        });
      }

      const created = await storage.createExperiment(parsed.data);
      res.status(201).json(created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      // Handle unique constraint violation on name
      if (message.includes("unique") || message.includes("duplicate")) {
        return res.status(409).json({ message: "Ya existe un experimento con ese nombre" });
      }
      logger.error("[Experiments] Error creating experiment", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * PUT /api/admin/experiments/:id
   * Update an experiment (name, status, variants, etc.)
   */
  app.put("/api/admin/experiments/:id", requireAdminSession, async (req, res) => {
    try {
      const id = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!id.success) {
        return res.status(400).json({ message: "ID invalido" });
      }

      const parsed = updateExperimentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.issues.map((i) => i.message).join(", "),
        });
      }

      const existing = await storage.getExperimentById(id.data);
      if (!existing) {
        return res.status(404).json({ message: "Experimento no encontrado" });
      }

      // Prevent modifying variants on an active experiment with assignments
      // (changing weights after users are assigned would skew results)
      if (parsed.data.variants && existing.status === "active") {
        return res.status(400).json({
          message: "No se pueden modificar las variantes de un experimento activo. Pausalo primero.",
        });
      }

      const updated = await storage.updateExperiment(id.data, parsed.data);
      res.json(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Experiments] Error updating experiment", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  /**
   * GET /api/admin/experiments/:id/results
   * Aggregated results by variant: sessions, event counts.
   */
  app.get("/api/admin/experiments/:id/results", requireAdminSession, async (req, res) => {
    try {
      const id = z.coerce.number().int().positive().safeParse(req.params.id);
      if (!id.success) {
        return res.status(400).json({ message: "ID invalido" });
      }

      const results = await storage.getExperimentResults(id.data);
      if (!results) {
        return res.status(404).json({ message: "Experimento no encontrado" });
      }

      res.json(results);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("[Experiments] Error fetching results", { error: message });
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
