/**
 * Facebook Page adapter — publishes text posts to a Facebook Page using the Graph API.
 *
 * Requires:
 *   FACEBOOK_PAGE_ID
 *   FACEBOOK_PAGE_ACCESS_TOKEN  (long-lived page token, NOT user token)
 *
 * Reference: https://developers.facebook.com/docs/pages-api/posts
 */

import type { AdapterResult, PlatformAdapter } from "./types";
import type { DistributionTrayItem } from "@shared/schema";
import { logger } from "../../../lib/logger";

const GRAPH_API_VERSION = "v21.0";

function buildMessage(item: DistributionTrayItem): string {
  const parts: string[] = [];
  if (item.title) parts.push(item.title);
  parts.push(item.content);
  if (item.targetUrl) parts.push(item.targetUrl);
  return parts.join("\n\n").trim();
}

export const facebookAdapter: PlatformAdapter = {
  async publish(item: DistributionTrayItem): Promise<AdapterResult> {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !token) {
      return {
        ok: false,
        statusCode: 503,
        error: "FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN are required",
      };
    }

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(pageId)}/feed`;
    const body = new URLSearchParams({
      message: buildMessage(item),
      access_token: token,
    });

    try {
      const res = await fetch(url, { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as {
        id?: string;
        post_id?: string;
        error?: { message?: string; code?: number };
      };

      if (!res.ok || json.error) {
        const message = json.error?.message ?? `Facebook returned ${res.status}`;
        logger.warn("[facebookAdapter] publish failed", { itemId: item.id, status: res.status, message });
        return { ok: false, statusCode: res.status, error: message };
      }

      const postId = json.post_id ?? json.id;
      if (!postId) {
        return { ok: false, statusCode: 502, error: "Facebook response missing post id" };
      }

      // post_id format: "{pageId}_{postId}" — usable in https://www.facebook.com/{post_id}
      const publishedUrl = `https://www.facebook.com/${postId}`;
      return { ok: true, publishedUrl, statusCode: 200 };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown network error";
      logger.error("[facebookAdapter] network error", { itemId: item.id, message });
      return { ok: false, statusCode: 502, error: message };
    }
  },
};
