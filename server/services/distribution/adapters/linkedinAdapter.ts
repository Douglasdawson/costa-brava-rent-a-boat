/**
 * LinkedIn Organization adapter — publishes text posts to a LinkedIn Company Page.
 *
 * Requires (in oauth_connections, provider="linkedin_org"):
 *   accessToken (3-legged OAuth, scope: w_organization_social, r_liteprofile)
 *   accountIdentifier = LinkedIn organization URN (e.g. "urn:li:organization:12345")
 *
 * Optional fallback envs (used only if no oauth_connections row exists):
 *   LINKEDIN_ACCESS_TOKEN
 *   LINKEDIN_ORG_ID  (numeric id; we wrap as urn:li:organization:<id>)
 *
 * Reference: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
 */

import type { AdapterResult, PlatformAdapter } from "./types";
import type { DistributionTrayItem } from "@shared/schema";
import { logger } from "../../../lib/logger";
import { oauthConnectionsRepo } from "../../../storage";

function buildText(item: DistributionTrayItem): string {
  const parts: string[] = [];
  if (item.title) parts.push(item.title);
  parts.push(item.content);
  if (item.targetUrl) parts.push(item.targetUrl);
  return parts.join("\n\n").trim();
}

async function resolveCredentials(): Promise<{ accessToken: string; orgUrn: string } | null> {
  const conn = await oauthConnectionsRepo.getOAuthConnection("linkedin_org");
  if (conn && conn.status === "active" && conn.accessToken && conn.accountIdentifier) {
    const orgUrn = conn.accountIdentifier.startsWith("urn:li:organization:")
      ? conn.accountIdentifier
      : `urn:li:organization:${conn.accountIdentifier}`;
    return { accessToken: conn.accessToken, orgUrn };
  }

  const envToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const envOrg = process.env.LINKEDIN_ORG_ID;
  if (envToken && envOrg) {
    return {
      accessToken: envToken,
      orgUrn: envOrg.startsWith("urn:li:organization:") ? envOrg : `urn:li:organization:${envOrg}`,
    };
  }

  return null;
}

export const linkedinAdapter: PlatformAdapter = {
  async publish(item: DistributionTrayItem): Promise<AdapterResult> {
    const creds = await resolveCredentials();
    if (!creds) {
      return {
        ok: false,
        statusCode: 503,
        error: "LinkedIn org credentials missing — connect via /api/admin/oauth/linkedin/start or set LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORG_ID",
      };
    }

    const payload = {
      author: creds.orgUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: buildText(item) },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    try {
      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(payload),
      });

      // LinkedIn returns x-restli-id header with the post URN, or 201 + body with id
      const postUrn = res.headers.get("x-restli-id") ?? undefined;
      const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };

      if (!res.ok) {
        const message = json.message ?? `LinkedIn returned ${res.status}`;
        logger.warn("[linkedinAdapter] publish failed", { itemId: item.id, status: res.status, message });
        return { ok: false, statusCode: res.status, error: message };
      }

      const urn = postUrn ?? json.id;
      if (!urn) {
        return { ok: false, statusCode: 502, error: "LinkedIn response missing post URN" };
      }

      // Convert urn:li:share:1234 -> https://www.linkedin.com/feed/update/urn:li:share:1234
      const publishedUrl = `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}`;
      return { ok: true, publishedUrl, statusCode: 201 };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown network error";
      logger.error("[linkedinAdapter] network error", { itemId: item.id, message });
      return { ok: false, statusCode: 502, error: message };
    }
  },
};
