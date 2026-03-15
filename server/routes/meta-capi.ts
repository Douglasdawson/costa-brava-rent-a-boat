import type { Express } from "express";
import { createHash } from "crypto";
import { logger } from "../lib/logger";
import { config } from "../config";

// Meta Conversion API endpoint
// Sends server-side events to Meta for better attribution (bypasses ad blockers)

interface CAPIEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: "website";
  user_data: {
    em?: string[];
    ph?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
    country?: string[];
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_type?: string;
    content_name?: string;
    order_id?: string;
  };
}

function sha256Hash(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function registerMetaCAPIRoutes(app: Express) {
  // POST /api/meta-capi/event - Receive events from client and forward to Meta
  app.post("/api/meta-capi/event", async (req, res) => {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      // Silently accept if not configured - don't break the flow
      return res.json({ success: true, queued: false, reason: "not_configured" });
    }

    try {
      const { eventName, eventId, sourceUrl, userData, customData } = req.body;

      if (!eventName || !eventId) {
        return res.status(400).json({ success: false, error: "eventName and eventId are required" });
      }

      const event: CAPIEvent = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: sourceUrl || config.BASE_URL,
        action_source: "website",
        user_data: {
          client_ip_address: req.ip || req.socket.remoteAddress || "",
          client_user_agent: req.get("user-agent") || "",
          ...(userData?.email && { em: [sha256Hash(userData.email)] }),
          ...(userData?.phone && { ph: [sha256Hash(userData.phone)] }),
          ...(userData?.fbc && { fbc: userData.fbc }),
          ...(userData?.fbp && { fbp: userData.fbp }),
          ...(userData?.country && { country: [sha256Hash(userData.country)] }),
        },
        ...(customData && { custom_data: customData }),
      };

      // Send to Meta Conversion API
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${pixelId}/events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [event],
            access_token: accessToken,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        logger.error("[Meta CAPI] API error", { status: response.status, result });
        return res.json({ success: false, error: result });
      }

      logger.info("[Meta CAPI] Event sent", { eventName, eventId });
      res.json({ success: true, queued: true });
    } catch (error) {
      logger.error("[Meta CAPI] Error sending event", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.json({ success: false, error: "internal" });
    }
  });
}
