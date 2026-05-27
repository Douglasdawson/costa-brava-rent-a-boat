import { randomUUID } from "crypto";
import type { Request } from "express";
import { logger } from "./logger";

const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;
const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";

let warnedMissingConfig = false;

type GA4EventValue = string | number | boolean | null | undefined;

interface SendGA4Options {
  clientId?: string;
  userId?: string;
  userAgent?: string;
  ipOverride?: string;
}

function extractClientIdFromGaCookie(cookieValue: string | undefined | null): string | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length < 4) return null;
  return `${parts[2]}.${parts[3]}`;
}

export function deriveClientIdFromRequest(req: Request): string {
  const gaCookie = req.cookies?._ga as string | undefined;
  const fromCookie = extractClientIdFromGaCookie(gaCookie);
  if (fromCookie) return fromCookie;
  return randomUUID();
}

export async function sendGA4Event(
  eventName: string,
  params: Record<string, GA4EventValue>,
  options: SendGA4Options = {},
): Promise<void> {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    if (!warnedMissingConfig) {
      logger.warn(
        "[Analytics] GA4 Measurement Protocol no configurado — eventos server-side desactivados. Define GA4_MEASUREMENT_ID y GA4_API_SECRET en .env.",
      );
      warnedMissingConfig = true;
    }
    return;
  }

  const cleanedParams: Record<string, GA4EventValue> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      cleanedParams[key] = value;
    }
  }

  const body = {
    client_id: options.clientId || randomUUID(),
    ...(options.userId ? { user_id: options.userId } : {}),
    events: [{ name: eventName, params: cleanedParams }],
  };

  try {
    const url = `${GA4_ENDPOINT}?measurement_id=${encodeURIComponent(GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(GA4_API_SECRET)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": options.userAgent || "costabravarentaboat-server",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      logger.warn("[Analytics] GA4 MP devolvió status no-2xx", {
        eventName,
        status: res.status,
      });
    }
  } catch (err: unknown) {
    logger.error("[Analytics] Error enviando evento GA4 MP", {
      eventName,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
