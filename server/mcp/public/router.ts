/**
 * Public MCP HTTP router.
 *
 * Mounts the Streamable HTTP transport of an McpServer behind an Express
 * router. No auth — public surface. Rate-limited to 60 req/min/IP via
 * express-rate-limit (IPv6-safe). Each request creates a fresh McpServer +
 * Transport (stateless mode); the MCP spec supports this and the per-request
 * cost is negligible for the expected traffic (intermittent agent connects).
 */

import type { Request, Response } from "express";
import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerPublicTools, type ToolContext } from "./tools.js";
import { logger } from "../../lib/logger.js";

const SERVER_NAME = "costa-brava-public";
const SERVER_VERSION = "1.0.0";

// Generous limit — these tools are read-mostly and an agent doing
// "search 3 boats then check availability for each" hits 4 calls in <10s.
const mcpRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip;
    if (!ip) return "mcp-public:unknown";
    return `mcp-public:${ipKeyGenerator(ip)}`;
  },
  message: { error: "rate_limit_exceeded" },
});

async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const started = Date.now();
  const ctx: ToolContext = {
    ip: (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip || null,
    userAgent: req.headers["user-agent"]?.toString() ?? null,
  };

  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerPublicTools(server, ctx);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    transport.close().catch(() => undefined);
    server.close().catch(() => undefined);
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error("[mcp-public] request failed", {
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
      ua: ctx.userAgent,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: "mcp_internal_error" });
    }
  }
}

export function createPublicMcpRouter(): Router {
  const router = Router();

  // Health check — useful for status pages and uptime monitors.
  router.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, server: SERVER_NAME, version: SERVER_VERSION, auth: "none" });
  });

  router.post("/", mcpRateLimiter, handleMcpRequest);
  router.get("/", mcpRateLimiter, handleMcpRequest);
  router.delete("/", mcpRateLimiter, (_req: Request, res: Response) => {
    res.status(204).end();
  });

  return router;
}
