/**
 * Admin API — MCP token lifecycle.
 *
 * Protected by requireAdminSession. The raw token value is returned only
 * once, on creation. After that, only the prefix is visible.
 */

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { requireAdminSession } from "./auth-middleware";
import {
  createMcpToken,
  listMcpTokens,
  getMcpTokenById,
  revokeMcpToken,
  toPublic,
} from "../storage/mcpTokens";
import { logger } from "../lib/logger";

const createBodySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  expiresAt: z.string().datetime().optional().nullable(),
  scopes: z.array(z.string()).optional(),
});

export function registerAdminMcpTokensRoutes(app: Express): void {
  // GET /api/admin/mcp-tokens
  app.get("/api/admin/mcp-tokens", requireAdminSession, async (_req: Request, res: Response) => {
    try {
      const rows = await listMcpTokens();
      res.json({ tokens: rows.map(toPublic) });
    } catch (err) {
      logger.error("list mcp-tokens failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error listando tokens" });
    }
  });

  // POST /api/admin/mcp-tokens — returns raw token ONCE
  app.post("/api/admin/mcp-tokens", requireAdminSession, async (req: Request, res: Response) => {
    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
      return;
    }
    try {
      const createdBy = (req as Request & { admin?: { username?: string; id?: string } }).admin?.username
        ?? (req as Request & { admin?: { username?: string; id?: string } }).admin?.id
        ?? null;
      const { record, rawToken } = await createMcpToken({
        name: parsed.data.name,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        scopes: parsed.data.scopes,
        createdBy,
      });
      res.status(201).json({
        token: toPublic(record),
        rawToken,
        notice: "Este token no volverá a mostrarse. Guárdalo en un gestor de contraseñas.",
      });
    } catch (err) {
      logger.error("create mcp-token failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error creando token" });
    }
  });

  // GET /api/admin/mcp-tokens/:id
  app.get("/api/admin/mcp-tokens/:id", requireAdminSession, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ message: "ID inválido" });
      return;
    }
    try {
      const row = await getMcpTokenById(id);
      if (!row) {
        res.status(404).json({ message: "Token no encontrado" });
        return;
      }
      res.json({ token: toPublic(row) });
    } catch (err) {
      logger.error("get mcp-token failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error obteniendo token" });
    }
  });

  // POST /api/admin/mcp-tokens/:id/revoke
  app.post("/api/admin/mcp-tokens/:id/revoke", requireAdminSession, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ message: "ID inválido" });
      return;
    }
    try {
      const revoked = await revokeMcpToken(id);
      if (!revoked) {
        res.status(404).json({ message: "Token no encontrado o ya revocado" });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      logger.error("revoke mcp-token failed", { err: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ message: "Error revocando token" });
    }
  });
}
