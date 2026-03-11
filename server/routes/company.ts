import type { Express } from "express";
import { requireAdminSession, requireOwner } from "./auth-middleware";
import { getCompanyConfig, updateCompanyConfig } from "../storage/company";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  logo: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export function registerCompanyRoutes(app: Express) {
  app.get("/api/admin/company", requireAdminSession, requireOwner, async (_req, res) => {
    try {
      const config = await getCompanyConfig();
      res.json(config);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error loading company config: " + message });
    }
  });

  app.patch("/api/admin/company", requireAdminSession, requireOwner, async (req, res) => {
    try {
      const parsed = updateSchema.parse(req.body);
      const updated = await updateCompanyConfig(parsed);
      res.json(updated);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos invalidos", errors: error.errors });
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Error updating company config: " + message });
    }
  });
}
