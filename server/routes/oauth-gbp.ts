/**
 * Google Business Profile OAuth — admin-initiated 3-legged flow that stores the
 * access/refresh token pair in `oauth_connections` (provider="gbp") and
 * auto-discovers the account/location identifier the gbpAdapter needs.
 *
 * Required env vars:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI  (must exactly match the Google Cloud OAuth client;
 *                               e.g. https://www.costabravarentaboat.com/api/admin/oauth/gbp/callback)
 *
 * The Google Cloud project must have these APIs enabled:
 *   - My Business Account Management API (account discovery)
 *   - My Business Business Information API (location discovery)
 *
 * Reference: https://developers.google.com/identity/protocols/oauth2/web-server
 */

import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { requireAdminSession } from "./auth-middleware";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";
import { oauthConnectionsRepo } from "../storage";

// business.manage covers local posts (v4) + account/location discovery (v1).
const SCOPES = ["https://www.googleapis.com/auth/business.manage"];

// Active state tokens (in-memory), same pattern as oauth-linkedin.ts.
const stateTokens = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanupExpiredStates(): void {
  const now = Date.now();
  for (const [key, ts] of stateTokens) {
    if (now - ts > STATE_TTL_MS) stateTokens.delete(key);
  }
}

function getEnv(): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

interface GbpAccount {
  name?: string; // "accounts/123456"
  accountName?: string;
  type?: string;
}

interface GbpLocation {
  name?: string; // "locations/987654" (NO account prefix in the v1 API)
  title?: string;
}

/**
 * Discover the account + location this token manages and compose the
 * "accounts/{aid}/locations/{lid}" identifier the v4 localPosts path expects
 * (see gbpAdapter.ts). Returns null when discovery fails — the connection is
 * still stored so the admin can diagnose via metadata.
 */
async function discoverAccountIdentifier(accessToken: string): Promise<{
  accountIdentifier: string | null;
  locationTitle: string | null;
  discovery: Record<string, unknown>;
}> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const discovery: Record<string, unknown> = {};

  const accountsRes = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers },
  );
  const accountsJson = (await accountsRes.json().catch(() => ({}))) as {
    accounts?: GbpAccount[];
    error?: { message?: string };
  };
  discovery.accountsStatus = accountsRes.status;
  if (!accountsRes.ok || !accountsJson.accounts?.length) {
    discovery.accountsError = accountsJson.error?.message ?? `HTTP ${accountsRes.status}`;
    return { accountIdentifier: null, locationTitle: null, discovery };
  }
  discovery.accounts = accountsJson.accounts.map((a) => ({ name: a.name, accountName: a.accountName }));

  // The Places-verified listing lives under a personal/organization account;
  // walk each account until one returns locations.
  for (const account of accountsJson.accounts) {
    if (!account.name) continue;
    const locRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title&pageSize=100`,
      { headers },
    );
    const locJson = (await locRes.json().catch(() => ({}))) as {
      locations?: GbpLocation[];
      error?: { message?: string };
    };
    if (!locRes.ok || !locJson.locations?.length) {
      discovery[`locations:${account.name}`] = locJson.error?.message ?? `HTTP ${locRes.status} / empty`;
      continue;
    }
    discovery[`locations:${account.name}`] = locJson.locations.map((l) => ({ name: l.name, title: l.title }));

    // Prefer the listing whose title matches the brand; fall back to the first.
    const match =
      locJson.locations.find((l) => /costa brava rent a boat/i.test(l.title ?? "")) ??
      locJson.locations[0];
    if (!match?.name) continue;

    // v1 returns "locations/{lid}" without the account prefix; the v4 localPosts
    // endpoint needs "accounts/{aid}/locations/{lid}".
    const locationId = match.name.replace(/^locations\//, "");
    return {
      accountIdentifier: `${account.name}/locations/${locationId}`,
      locationTitle: match.title ?? null,
      discovery,
    };
  }

  return { accountIdentifier: null, locationTitle: null, discovery };
}

export function registerGbpOAuthRoutes(app: Express): void {
  // Step 1: redirect admin to the Google consent screen.
  app.get("/api/admin/oauth/gbp/start", requireAdminSession, (req: Request, res: Response) => {
    const env = getEnv();
    if (!env) {
      res.status(503).send(
        "Google OAuth not configured. Required env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI.",
      );
      return;
    }

    cleanupExpiredStates();
    const state = crypto.randomBytes(24).toString("hex");
    stateTokens.set(state, Date.now());

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", env.clientId);
    authUrl.searchParams.set("redirect_uri", env.redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", SCOPES.join(" "));
    // offline + consent guarantee a refresh_token on every (re)connect; without
    // them Google only issues a 1h access token and the adapter would die hourly.
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    audit(req, "oauth.gbp.start", "oauth_connections", "gbp");
    res.redirect(authUrl.toString());
  });

  // Step 2: exchange code → tokens, discover account/location, persist.
  app.get("/api/admin/oauth/gbp/callback", requireAdminSession, async (req: Request, res: Response) => {
    const env = getEnv();
    if (!env) {
      res.status(503).send("Google OAuth not configured.");
      return;
    }

    const { code, state, error, error_description } = req.query as Record<string, string | undefined>;

    if (error) {
      logger.warn("[oauth-gbp] consent denied", { error, error_description });
      res.status(400).send(`Google consent denied: ${error_description ?? error}`);
      return;
    }

    if (!code || !state) {
      res.status(400).send("Missing code or state");
      return;
    }

    cleanupExpiredStates();
    if (!stateTokens.has(state)) {
      logger.warn("[oauth-gbp] invalid or expired state", { state });
      res.status(400).send("Invalid or expired state token");
      return;
    }
    stateTokens.delete(state);

    try {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: env.redirectUri,
        client_id: env.clientId,
        client_secret: env.clientSecret,
      });

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const json = (await tokenRes.json().catch(() => ({}))) as {
        access_token?: string;
        expires_in?: number;
        refresh_token?: string;
        scope?: string;
        error?: string;
        error_description?: string;
      };

      if (!tokenRes.ok || !json.access_token) {
        const message = json.error_description ?? json.error ?? `Google returned ${tokenRes.status}`;
        logger.error("[oauth-gbp] token exchange failed", { status: tokenRes.status, message });
        res.status(502).send(`Token exchange failed: ${message}`);
        return;
      }

      const expiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null;

      const { accountIdentifier, locationTitle, discovery } = await discoverAccountIdentifier(
        json.access_token,
      );

      await oauthConnectionsRepo.upsertOAuthConnection({
        provider: "gbp",
        accountIdentifier,
        accessToken: json.access_token,
        refreshToken: json.refresh_token ?? null,
        expiresAt,
        scopes: json.scope ? json.scope.split(" ") : SCOPES,
        metadata: { locationTitle, discovery },
      });

      audit(req, "oauth.gbp.callback", "oauth_connections", "gbp", {
        accountIdentifier,
        locationTitle,
        hasRefreshToken: Boolean(json.refresh_token),
        expiresAt: expiresAt?.toISOString() ?? null,
      });

      if (!accountIdentifier) {
        logger.warn("[oauth-gbp] connected but location discovery failed", { discovery });
        res.send(`
          <html>
            <head><title>Google Business conectado (incompleto)</title></head>
            <body style="font-family:system-ui;padding:2rem;max-width:500px;margin:auto">
              <h1>⚠ Token guardado, pero no se pudo detectar la ficha</h1>
              <p>El token está en <code>oauth_connections</code> (provider=gbp), pero la
              detección de cuenta/ficha falló. Causa habitual: las APIs "My Business
              Account Management" y "My Business Business Information" no están
              habilitadas (o aprobadas) en el proyecto de Google Cloud.</p>
              <p>Detalle técnico guardado en <code>metadata.discovery</code>.</p>
            </body>
          </html>
        `);
        return;
      }

      res.send(`
        <html>
          <head><title>Google Business conectado</title></head>
          <body style="font-family:system-ui;padding:2rem;max-width:500px;margin:auto">
            <h1>✓ Google Business conectado</h1>
            <p>Ficha: <strong>${locationTitle ?? accountIdentifier}</strong></p>
            <p>El token está guardado en <code>oauth_connections</code> (provider=gbp).
            La distribución automática a Google Business ya puede publicar.</p>
            <p>Ya puedes cerrar esta pestaña y volver al CRM.</p>
          </body>
        </html>
      `);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("[oauth-gbp] callback error", { message });
      res.status(500).send(`Internal error: ${message}`);
    }
  });
}
