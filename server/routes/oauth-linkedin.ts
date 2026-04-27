/**
 * LinkedIn OAuth — admin-initiated 3-legged flow that stores the org access
 * token in `oauth_connections` (provider="linkedin_org").
 *
 * Required env vars:
 *   LINKEDIN_CLIENT_ID
 *   LINKEDIN_CLIENT_SECRET
 *   LINKEDIN_REDIRECT_URI    (must exactly match the LinkedIn app config; e.g.
 *                             https://costabravarentaboat.com/api/admin/oauth/linkedin/callback)
 *   LINKEDIN_ORG_ID          (numeric organization id this token can post to)
 *
 * Reference: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 */

import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { requireAdminSession } from "./auth-middleware";
import { logger } from "../lib/logger";
import { audit } from "../lib/audit";
import { oauthConnectionsRepo } from "../storage";

const SCOPES = ["w_organization_social", "r_organization_social", "rw_organization_admin"];

// Active state tokens (in-memory). LinkedIn OAuth state token lives <10 min.
// Keyed by state value; value is the timestamp of issuance.
const stateTokens = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanupExpiredStates(): void {
  const now = Date.now();
  for (const [key, ts] of stateTokens) {
    if (now - ts > STATE_TTL_MS) stateTokens.delete(key);
  }
}

function getEnv(): { clientId: string; clientSecret: string; redirectUri: string; orgId: string } | null {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const orgId = process.env.LINKEDIN_ORG_ID;
  if (!clientId || !clientSecret || !redirectUri || !orgId) return null;
  return { clientId, clientSecret, redirectUri, orgId };
}

export function registerLinkedinOAuthRoutes(app: Express): void {
  // Step 1: redirect admin to LinkedIn consent screen.
  app.get("/api/admin/oauth/linkedin/start", requireAdminSession, (req: Request, res: Response) => {
    const env = getEnv();
    if (!env) {
      res.status(503).send(
        "LinkedIn OAuth not configured. Required env vars: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI, LINKEDIN_ORG_ID.",
      );
      return;
    }

    cleanupExpiredStates();
    const state = crypto.randomBytes(24).toString("hex");
    stateTokens.set(state, Date.now());

    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", env.clientId);
    authUrl.searchParams.set("redirect_uri", env.redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", SCOPES.join(" "));

    audit(req, "oauth.linkedin.start", "oauth_connections", "linkedin_org");
    res.redirect(authUrl.toString());
  });

  // Step 2: exchange code → access token, persist in oauth_connections.
  app.get("/api/admin/oauth/linkedin/callback", requireAdminSession, async (req: Request, res: Response) => {
    const env = getEnv();
    if (!env) {
      res.status(503).send("LinkedIn OAuth not configured.");
      return;
    }

    const { code, state, error, error_description } = req.query as Record<string, string | undefined>;

    if (error) {
      logger.warn("[oauth-linkedin] consent denied", { error, error_description });
      res.status(400).send(`LinkedIn consent denied: ${error_description ?? error}`);
      return;
    }

    if (!code || !state) {
      res.status(400).send("Missing code or state");
      return;
    }

    cleanupExpiredStates();
    if (!stateTokens.has(state)) {
      logger.warn("[oauth-linkedin] invalid or expired state", { state });
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

      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
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
        const message = json.error_description ?? json.error ?? `LinkedIn returned ${tokenRes.status}`;
        logger.error("[oauth-linkedin] token exchange failed", { status: tokenRes.status, message });
        res.status(502).send(`Token exchange failed: ${message}`);
        return;
      }

      const expiresAt = json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null;

      await oauthConnectionsRepo.upsertOAuthConnection({
        provider: "linkedin_org",
        accountIdentifier: env.orgId,
        accessToken: json.access_token,
        refreshToken: json.refresh_token ?? null,
        expiresAt,
        scopes: json.scope ? json.scope.split(" ") : SCOPES,
        metadata: { organization_urn: `urn:li:organization:${env.orgId}` },
      });

      audit(req, "oauth.linkedin.callback", "oauth_connections", "linkedin_org", {
        scopes: json.scope, expiresAt: expiresAt?.toISOString() ?? null,
      });

      res.send(`
        <html>
          <head><title>LinkedIn conectado</title></head>
          <body style="font-family:system-ui;padding:2rem;max-width:500px;margin:auto">
            <h1>✓ LinkedIn conectado</h1>
            <p>El token está guardado en <code>oauth_connections</code> (provider=linkedin_org).</p>
            <p>Ya puedes cerrar esta pestaña y volver al CRM.</p>
          </body>
        </html>
      `);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("[oauth-linkedin] callback error", { message });
      res.status(500).send(`Internal error: ${message}`);
    }
  });
}
