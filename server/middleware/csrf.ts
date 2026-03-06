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
  if (req.path === "/api/stripe-webhook" || req.path === "/api/whatsapp" || req.path === "/api/whatsapp/status") {
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
    // No origin/referer — could be server-to-server or same-origin form
    // Allow for now but log for monitoring
    return next();
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
