/**
 * Medium adapter — creates a published story under the integration owner's account.
 *
 * Requires:
 *   MEDIUM_INTEGRATION_TOKEN  (created at https://medium.com/me/settings — Integration tokens)
 *   MEDIUM_USER_ID            (call GET /v1/me once with the token to obtain it)
 *
 * Reference: https://github.com/Medium/medium-api-docs#33-posts
 *
 * Note: Medium deprecated public access to its API in 2023 for new integration tokens.
 * If the token is invalid we surface a 503 with a clear message.
 */

import type { AdapterResult, PlatformAdapter } from "./types";
import type { DistributionTrayItem } from "@shared/schema";
import { logger } from "../../../lib/logger";

function buildBody(item: DistributionTrayItem): string {
  const parts: string[] = [item.content];
  if (item.targetUrl) {
    parts.push(`\n\n---\n\nFuente original: [${item.targetUrl}](${item.targetUrl})`);
  }
  return parts.join("");
}

export const mediumAdapter: PlatformAdapter = {
  async publish(item: DistributionTrayItem): Promise<AdapterResult> {
    const token = process.env.MEDIUM_INTEGRATION_TOKEN;
    const userId = process.env.MEDIUM_USER_ID;

    if (!token || !userId) {
      return {
        ok: false,
        statusCode: 503,
        error: "MEDIUM_INTEGRATION_TOKEN and MEDIUM_USER_ID are required",
      };
    }

    const payload = {
      title: item.title ?? `Costa Brava Rent a Boat — ${item.slug}`,
      contentFormat: "markdown" as const,
      content: buildBody(item),
      canonicalUrl: item.targetUrl ?? undefined,
      tags: ["costa brava", "blanes", "boat rental"],
      publishStatus: "public" as const,
    };

    try {
      const res = await fetch(
        `https://api.medium.com/v1/users/${encodeURIComponent(userId)}/posts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const json = (await res.json().catch(() => ({}))) as {
        data?: { id?: string; url?: string };
        errors?: Array<{ message?: string; code?: number }>;
      };

      if (!res.ok || json.errors) {
        const message = json.errors?.[0]?.message ?? `Medium returned ${res.status}`;
        logger.warn("[mediumAdapter] publish failed", { itemId: item.id, status: res.status, message });
        return { ok: false, statusCode: res.status, error: message };
      }

      const publishedUrl = json.data?.url;
      if (!publishedUrl) {
        return { ok: false, statusCode: 502, error: "Medium response missing post URL" };
      }

      return { ok: true, publishedUrl, statusCode: 201 };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown network error";
      logger.error("[mediumAdapter] network error", { itemId: item.id, message });
      return { ok: false, statusCode: 502, error: message };
    }
  },
};
