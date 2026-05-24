import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Lightweight CSRF protection via Origin/Referer validation.
 * Only applied to state-changing methods (POST, PUT, PATCH, DELETE).
 * JWT-authenticated APIs are already CSRF-safe (token in Authorization header),
 * but cookie-based auth (Replit Auth sessions) needs this protection.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Only check state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip for Stripe/Twilio webhooks (they use signature verification)
  if (req.path === "/api/stripe-webhook" || req.path === "/api/whatsapp" || req.path === "/api/whatsapp/status" || req.path === "/api/meta-whatsapp/webhook") {
    return next();
  }

  // Skip for the public MCP server — clients are Claude Desktop / Cursor /
  // LangGraph / etc., which do not send Origin headers on JSON-RPC POSTs.
  // CSRF protection is unnecessary here because:
  //   • The MCP server has its own per-IP rate limit (60 req/min)
  //   • All read tools have no state to corrupt
  //   • The single write tool (request_booking_hold) creates an expirable
  //     30-min hold; conversion to a real booking still requires customer
  //     email+phone via the regular web form
  if (req.path === "/api/mcp/public" || req.path.startsWith("/api/mcp/public/")) {
    return next();
  }

  // If request has Authorization header with Bearer token, it's API-authenticated (CSRF-safe)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return next();
  }

  // For cookie-based auth: validate Origin or Referer
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  if (!origin && !referer) {
    // No origin/referer on a state-changing request — block it
    logger.warn("CSRF: missing Origin and Referer on state-changing request", { path: req.path, method: req.method });
    res.status(403).json({ message: "Forbidden: missing origin" });
    return;
  }

  const allowedOrigin = origin || (referer ? new URL(referer).origin : null);
  if (allowedOrigin && host) {
    const expectedOrigins = [
      `https://${host}`,
      `http://${host}`,
      // Allow localhost in development
      ...(process.env.NODE_ENV === "development" ? ["http://localhost:5173", "http://localhost:3000"] : []),
    ];

    if (!expectedOrigins.some(expected => allowedOrigin.startsWith(expected))) {
      logger.warn("CSRF: origin mismatch", { origin: allowedOrigin, host });
      res.status(403).json({ message: "Forbidden: origin mismatch" });
      return;
    }
  }

  next();
}
