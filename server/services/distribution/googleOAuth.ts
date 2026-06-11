/**
 * Google OAuth token lifecycle for the GBP connection (provider="gbp").
 *
 * Google access tokens expire after ~1 hour. The gbpAdapter publishes from a
 * cron, so it can never rely on the stored access token still being valid —
 * this helper transparently refreshes it (5-minute early window) using the
 * refresh_token captured by server/routes/oauth-gbp.ts (access_type=offline).
 */

import { logger } from "../../lib/logger";
import { oauthConnectionsRepo } from "../../storage";
import type { OAuthConnection } from "@shared/schema";

const REFRESH_EARLY_MS = 5 * 60 * 1000;

export interface FreshGbpConnection {
  accessToken: string;
  accountIdentifier: string;
  connectionId: number;
}

/**
 * Returns a connection with a guaranteed-fresh access token, refreshing it if
 * needed. Returns null (with a logged reason) when there is no usable
 * connection — callers should surface "not connected".
 */
export async function getFreshGbpConnection(): Promise<FreshGbpConnection | null> {
  const conn = await oauthConnectionsRepo.getOAuthConnection("gbp");
  if (!conn || conn.status === "revoked") {
    return null;
  }
  if (!conn.accountIdentifier) {
    logger.warn("[googleOAuth] gbp connection has no accountIdentifier (discovery failed at connect time)");
    return null;
  }

  const needsRefresh =
    !conn.expiresAt || conn.expiresAt.getTime() - Date.now() < REFRESH_EARLY_MS;

  if (!needsRefresh) {
    return {
      accessToken: conn.accessToken,
      accountIdentifier: conn.accountIdentifier,
      connectionId: conn.id,
    };
  }

  const refreshed = await refreshAccessToken(conn);
  if (!refreshed) return null;
  return {
    accessToken: refreshed.accessToken,
    accountIdentifier: conn.accountIdentifier,
    connectionId: conn.id,
  };
}

async function refreshAccessToken(conn: OAuthConnection): Promise<{ accessToken: string } | null> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!conn.refreshToken || !clientId || !clientSecret) {
    logger.warn("[googleOAuth] cannot refresh gbp token", {
      hasRefreshToken: Boolean(conn.refreshToken),
      hasClientCreds: Boolean(clientId && clientSecret),
    });
    return null;
  }

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conn.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const json = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!res.ok || !json.access_token) {
      const message = json.error_description ?? json.error ?? `HTTP ${res.status}`;
      // invalid_grant = refresh token revoked/expired → admin must reconnect.
      const status = json.error === "invalid_grant" ? "revoked" : "error";
      logger.error("[googleOAuth] gbp token refresh failed", { message, status });
      await oauthConnectionsRepo.markOAuthError(conn.id, `Token refresh failed: ${message}`, status);
      return null;
    }

    await oauthConnectionsRepo.upsertOAuthConnection({
      provider: "gbp",
      accountIdentifier: conn.accountIdentifier,
      accessToken: json.access_token,
      refreshToken: conn.refreshToken, // Google omits it on refresh; keep the original
      expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null,
      scopes: (conn.scopes as string[] | null) ?? null,
      metadata: (conn.metadata as Record<string, unknown> | null) ?? null,
    });

    logger.info("[googleOAuth] gbp access token refreshed");
    return { accessToken: json.access_token };
  } catch (err) {
    logger.error("[googleOAuth] gbp token refresh error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
