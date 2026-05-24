/**
 * Admin CRUD for citation A/B experiments.
 *
 * Routes
 *   GET    /api/admin/citation-experiments              — list all
 *   POST   /api/admin/citation-experiments              — create
 *   POST   /api/admin/citation-experiments/:id/start    — flip to running
 *   POST   /api/admin/citation-experiments/:id/end      — completed | cancelled
 *   GET    /api/admin/citation-experiments/:id/results  — citation_rate per variant + z-test
 */

import type { Express } from "express";
import { z } from "zod";
import { requireAdminSession } from "./auth-middleware";
import { logger } from "../lib/logger";
import {
  listExperiments,
  createExperiment,
  startExperiment,
  endExperiment,
  getExperimentResults,
} from "../services/citationExperiments";

const variantSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  content: z.string().min(1).max(8000),
});

const createSchema = z.object({
  name: z.string().min(1).max(100),
  hypothesis: z.string().max(500).optional(),
  target: z.enum([
    "llms_txt_intro",
    "ai_context_disambiguation",
    "ai_citations_facts_order",
    "ai_context_description",
  ]),
  variants: z.array(variantSchema).min(2).max(6),
  startImmediately: z.boolean().optional(),
});

export function registerCitationExperimentsRoutes(app: Express): void {
  app.get("/api/admin/citation-experiments", requireAdminSession, async (_req, res) => {
    try {
      const rows = await listExperiments();
      res.json({ experiments: rows });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("[citation-experiments] list failed", { error: msg });
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/admin/citation-experiments", requireAdminSession, async (req, res) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
      }
      const exp = await createExperiment(parsed.data);
      res.json({ experiment: exp });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("[citation-experiments] create failed", { error: msg });
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/admin/citation-experiments/:id/start", requireAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const row = await startExperiment(id);
      if (!row) return res.status(404).json({ error: "Experiment not found" });
      res.json({ experiment: row });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/admin/citation-experiments/:id/end", requireAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const status = req.body?.status === "cancelled" ? "cancelled" : "completed";
      const row = await endExperiment(id, status);
      if (!row) return res.status(404).json({ error: "Experiment not found" });
      res.json({ experiment: row });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/admin/citation-experiments/:id/results", requireAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
      const results = await getExperimentResults(id);
      if (!results) return res.status(404).json({ error: "Experiment not found" });
      res.json(results);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });
}
