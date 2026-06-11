/**
 * Google Business Profile adapter — publishes a Local Post to the connected location.
 *
 * Requires (in oauth_connections, provider="gbp"):
 *   accessToken (Google OAuth, scope: https://www.googleapis.com/auth/business.manage)
 *   accountIdentifier = "accounts/{accountId}/locations/{locationId}"
 *
 * Reference: https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts/create
 */

import type { AdapterResult, PlatformAdapter } from "./types";
import type { DistributionTrayItem } from "@shared/schema";
import { logger } from "../../../lib/logger";
import { oauthConnectionsRepo } from "../../../storage";
import { getFreshGbpConnection } from "../googleOAuth";

function buildSummary(item: DistributionTrayItem): string {
  const parts: string[] = [];
  if (item.title) parts.push(item.title);
  parts.push(item.content);
  // GBP limit: 1500 chars
  return parts.join("\n\n").trim().slice(0, 1500);
}

export const gbpAdapter: PlatformAdapter = {
  async publish(item: DistributionTrayItem): Promise<AdapterResult> {
    // getFreshGbpConnection transparently refreshes the 1h Google access token
    // (the cron publishes long after connect time, so the stored token is
    // almost always stale by the time this runs).
    const conn = await getFreshGbpConnection();
    if (!conn) {
      return {
        ok: false,
        statusCode: 503,
        error: "Google Business Profile not connected — set up oauth_connections.gbp",
      };
    }

    const locationPath = conn.accountIdentifier;
    const url = `https://mybusiness.googleapis.com/v4/${locationPath}/localPosts`;

    const payload: Record<string, unknown> = {
      languageCode: item.language || "es",
      summary: buildSummary(item),
      topicType: "STANDARD",
    };

    if (item.targetUrl) {
      payload.callToAction = {
        actionType: "LEARN_MORE",
        url: item.targetUrl,
      };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${conn.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => ({}))) as {
        name?: string;
        searchUrl?: string;
        error?: { message?: string; code?: number };
      };

      if (!res.ok || json.error) {
        const message = json.error?.message ?? `GBP returned ${res.status}`;
        logger.warn("[gbpAdapter] publish failed", { itemId: item.id, status: res.status, message });
        if (res.status === 401 || res.status === 403) {
          await oauthConnectionsRepo.markOAuthError(conn.connectionId, message, "expired");
        }
        return { ok: false, statusCode: res.status, error: message };
      }

      const publishedUrl = json.searchUrl ?? `https://business.google.com/${json.name ?? ""}`;
      return { ok: true, publishedUrl, statusCode: 200 };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown network error";
      logger.error("[gbpAdapter] network error", { itemId: item.id, message });
      return { ok: false, statusCode: 502, error: message };
    }
  },
};
