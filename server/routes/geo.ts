import type { Express, Request } from "express";
import geoip from "geoip-lite";
import { logger } from "../lib/logger";

// Best-effort client country detection for client-side personalization
// (license verifier prefills, language hints, etc.).
//
// Why this is a server endpoint and not a client lookup:
// 1. Browser geolocation needs a permission prompt — too intrusive for a
//    default prefill.
// 2. Public IP geo APIs (ipapi.co, ip-api.com) cost rate limits and add
//    cross-origin requests. Doing the lookup with `geoip-lite` against the
//    request IP is offline, key-less, and never leaks the user's IP.
//
// Header preference order is conservative: if the deploy ever moves behind
// Cloudflare or Vercel the canonical header wins; otherwise we trust the
// proxy chain through `req.ip` (Express is configured with trust proxy = 2).

const COUNTRY_REGEX = /^[A-Za-z]{2}$/;

function extractIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  if (req.ip) return req.ip;
  return req.socket?.remoteAddress ?? null;
}

function lookupCountry(req: Request): string | null {
  const headerCountry =
    (req.headers["cf-ipcountry"] as string | undefined) ??
    (req.headers["x-vercel-ip-country"] as string | undefined);
  if (headerCountry && COUNTRY_REGEX.test(headerCountry) && headerCountry !== "XX") {
    return headerCountry.toUpperCase();
  }
  const ip = extractIp(req);
  if (!ip) return null;
  // Local / private addresses can't be located — short-circuit so the lookup
  // doesn't waste cycles in dev.
  if (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.")
  ) {
    return null;
  }
  try {
    const match = geoip.lookup(ip);
    return match?.country ?? null;
  } catch (err) {
    logger.warn("[geo] lookup failed", {
      ip,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export function registerGeoRoutes(app: Express) {
  app.get("/api/geo", (req, res) => {
    const country = lookupCountry(req);
    // Edge cache so this is essentially free at scale; the client also caches
    // per session via the verifier hook.
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    res.setHeader("Vary", "X-Forwarded-For, CF-IPCountry");
    res.json({ country });
  });
}
