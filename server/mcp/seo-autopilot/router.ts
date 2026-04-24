/**
 * seo-autopilot MCP HTTP router.
 *
 * Mounts the Streamable HTTP transport of an McpServer behind an Express
 * router, enforcing bearer-token auth + rate limiting. Each authenticated
 * request creates a fresh McpServer + Transport (stateless mode) — the
 * MCP spec supports this and the per-request cost is negligible for the
 * expected traffic (a human-triggered Cowork session).
 *
 * All tools internally write to the audit log via the `tools.ts` helpers.
 */

import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { validateMcpToken, recordTokenUsage, type McpTokenPublic } from "../../storage/mcpTokens.js";
import { registerAutopilotTools, type ToolContext } from "./tools.js";
import { logger } from "../../lib/logger.js";

const SERVER_NAME = "costa-brava-seo-autopilot";
const SERVER_VERSION = "0.1.0";

// ---------------------------------------------------------------------------
// Bearer-token auth middleware
// ---------------------------------------------------------------------------
interface AuthedRequest extends Request {
  mcpTokenId?: number;
}

async function bearerAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  // Wrap the whole middleware in try/catch because Express 4 does NOT
  // capture rejections from async middleware — any throw here would leave
  // the request hanging until Cloud Run kills it with a generic 500.
  try {
    const header = req.headers.authorization;
    if (!header || !header.toLowerCase().startsWith("bearer ")) {
      res.status(401).json({ error: "missing_bearer_token" });
      return;
    }
    const raw = header.slice(7).trim();
    const token = await validateMcpToken(raw);
    if (!token) {
      res.status(401).json({ error: "invalid_or_revoked_token" });
      return;
    }
    req.mcpTokenId = token.id;
    // Fire-and-forget usage record
    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip || null;
    recordTokenUsage(token.id, ip).catch((err) => {
      logger.warn("MCP token usage record failed", { err: err instanceof Error ? err.message : String(err) });
    });
    next();
  } catch (err) {
    logger.error("seo-autopilot bearerAuth failed", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: "auth_check_failed" });
    }
  }
}

// ---------------------------------------------------------------------------
// Rate limit factories — instantiated per router so each createSeoAutopilotRouter()
// call gets independent state (required for clean isolation in tests).
//
// Three layers of defense:
//   1. preAuthIpLimiter (300 req/min/IP) — anti-DDoS only. Loose enough that
//      a burst of unauthenticated probes from a shared NAT cannot lock out
//      a co-located legitimate token holder.
//   2. postAuthIpLimiter (60 req/min/IP) — real per-IP quota for authenticated
//      traffic. Same effective cap as the original single limiter.
//   3. tokenLimiter (60 req/min/token) — per-token quota; a leaked token cant
//      be amplified across distinct NAT IPs.
// ---------------------------------------------------------------------------
function ipKeyOf(req: Request, prefix: string): string {
  // express-rate-limit v7+ requires piping IPs through ipKeyGenerator so
  // IPv6 addresses get truncated to their /64 subnet (prevents per-address
  // bypass). Using req.ip directly throws ValidationError on every request.
  const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip;
  if (!ip) return `${prefix}:unknown`;
  return `${prefix}:${ipKeyGenerator(ip)}`;
}

function makePreAuthIpLimiter() {
  return rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req: Request) => ipKeyOf(req, "mcp:preauth"),
    message: { error: "rate_limit_exceeded" },
  });
}

function makePostAuthIpLimiter() {
  return rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req: Request) => ipKeyOf(req, "mcp:authip"),
    message: { error: "rate_limit_exceeded" },
  });
}

function makeTokenRateLimiter() {
  return rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req: AuthedRequest): string => {
      return req.mcpTokenId != null ? `mcp:tok:${req.mcpTokenId}` : "mcp:tok:none";
    },
    message: { error: "token_rate_limit_exceeded" },
  });
}

// ---------------------------------------------------------------------------
// Per-request MCP handler
// ---------------------------------------------------------------------------
function getRequestTimeoutMs(): number {
  const raw = Number(process.env.MCP_REQUEST_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 30_000;
}

async function handleMcpRequest(req: AuthedRequest, res: Response): Promise<void> {
  const started = Date.now();
  const ctx: ToolContext = {
    tokenId: req.mcpTokenId ?? null,
    ip: (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip || null,
  };

  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerAutopilotTools(server, ctx);

  const transport = new StreamableHTTPServerTransport({
    // Stateless: no session IDs, each HTTP request is self-contained.
    sessionIdGenerator: undefined,
  });

  // Hard timeout — frees the connection if a tool hangs forever, otherwise
  // Cloud Run keeps the request alive until its own (much longer) limit.
  const timeoutMs = getRequestTimeoutMs();
  const timeout = setTimeout(() => {
    if (res.writableEnded) return;
    logger.warn("seo-autopilot MCP request timed out", {
      tokenId: ctx.tokenId,
      timeoutMs,
      elapsedMs: Date.now() - started,
    });
    if (!res.headersSent) {
      try {
        res.status(504).json({ error: "request_timeout" });
      } catch {
        /* response already partially written; fall through to destroy */
      }
    }
    res.destroy();
  }, timeoutMs);

  // Clean up timer + transport when the response closes (timeout, success, or
  // client disconnect — all paths funnel through here).
  res.on("close", () => {
    clearTimeout(timeout);
    transport.close().catch(() => undefined);
    server.close().catch(() => undefined);
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error("seo-autopilot MCP request failed", {
      error: err instanceof Error ? err.message : String(err),
      tokenId: ctx.tokenId,
      durationMs: Date.now() - started,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: "mcp_internal_error" });
    }
  }
}

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------
export function createSeoAutopilotRouter(): Router {
  const router = Router();
  const preAuthIp = makePreAuthIpLimiter();
  const postAuthIp = makePostAuthIpLimiter();
  const tokenLimiter = makeTokenRateLimiter();

  // Health check — does NOT require auth so status pages can hit it.
  router.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, server: SERVER_NAME, version: SERVER_VERSION });
  });

  // Main MCP endpoint. Streamable HTTP uses POST for all JSON-RPC messages.
  router.post("/", preAuthIp, bearerAuth, postAuthIp, tokenLimiter, handleMcpRequest);

  // GET is used by the SSE leg of Streamable HTTP.
  router.get("/", preAuthIp, bearerAuth, postAuthIp, tokenLimiter, handleMcpRequest);

  // DELETE is used to terminate sessions (no-op in stateless mode).
  router.delete("/", preAuthIp, bearerAuth, postAuthIp, tokenLimiter, (_req: Request, res: Response) => {
    res.status(204).end();
  });

  return router;
}

// Re-export for convenience — some places may want the raw types.
export type { McpTokenPublic };
