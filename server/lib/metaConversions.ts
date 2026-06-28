import { createHash } from "crypto";
import type { Request } from "express";
import { logger } from "./logger";
import { config } from "../config";

// Server-side Meta Conversions API (CAPI) sender.
//
// Why this exists: the client only fires a Pixel "Lead" mid-wizard (before the
// lead is actually submitted), and the homepage inquiry form fires NO Meta event
// at all — so Meta reported 0 leads despite real traffic. This sends the "Lead"
// straight from the server when an inquiry is persisted, surviving cookie-consent
// denial and ad blockers, mirroring the existing server-side GA4 events.
//
// Reuses the same Graph API shape as the client-triggered endpoint in
// server/routes/meta-capi.ts (same Pixel id + CAPI token), but fires server-side.

const API_VERSION = "v21.0";

function hashNormalized(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// Meta wants phone numbers as digits only (with country code), then hashed.
function hashPhone(value: string): string {
  const digits = value.replace(/[^0-9]/g, "");
  return createHash("sha256").update(digits).digest("hex");
}

export function isMetaCapiConfigured(): boolean {
  return !!(process.env.META_PIXEL_ID && process.env.META_CAPI_ACCESS_TOKEN);
}

// Pull the Meta browser cookies (_fbp / _fbc) so server events match the same
// user as client Pixel events. No cookie-parser dependency assumed.
export function getMetaBrowserIds(req: Request): { fbp?: string; fbc?: string } {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const out: { fbp?: string; fbc?: string } = {};
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (name === "_fbp") out.fbp = val;
    else if (name === "_fbc") out.fbc = val;
  }
  return out;
}

export interface MetaConversionParams {
  eventName: "Lead" | "Purchase" | "InitiateCheckout" | "Contact";
  /** Stable id for dedup/idempotency (e.g. `lead-inquiry-<id>`). */
  eventId: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  sourceUrl?: string;
}

export async function sendMetaConversion(params: MetaConversionParams): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return; // silently no-op when not configured

  const user_data: Record<string, unknown> = {};
  if (params.email) user_data.em = [hashNormalized(params.email)];
  if (params.phone) user_data.ph = [hashPhone(params.phone)];
  if (params.country) user_data.country = [hashNormalized(params.country)];
  if (params.clientIp) user_data.client_ip_address = params.clientIp;
  if (params.userAgent) user_data.client_user_agent = params.userAgent;
  if (params.fbp) user_data.fbp = params.fbp;
  if (params.fbc) user_data.fbc = params.fbc;

  const event: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    action_source: "website",
    event_source_url: params.sourceUrl || config.BASE_URL,
    user_data,
  };

  const custom_data: Record<string, unknown> = {};
  if (params.value != null) custom_data.value = params.value;
  if (params.currency) custom_data.currency = params.currency;
  if (params.contentIds?.length) {
    custom_data.content_ids = params.contentIds;
    custom_data.content_type = "product";
  }
  if (Object.keys(custom_data).length > 0) event.custom_data = custom_data;

  try {
    const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event], access_token: token }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      logger.error("[Meta CAPI] server event rejected", {
        eventName: params.eventName,
        status: response.status,
        body,
      });
      return;
    }
    logger.info("[Meta CAPI] server event sent", {
      eventName: params.eventName,
      eventId: params.eventId,
    });
  } catch (error) {
    logger.error("[Meta CAPI] server event error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
