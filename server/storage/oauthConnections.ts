/**
 * OAuth Connections Storage
 *
 * Persists access/refresh tokens for third-party APIs (LinkedIn org, GBP, etc.).
 * Schema lives in shared/schema.ts as `oauthConnections`.
 */

import {
  db, eq, and, sql,
  oauthConnections,
  type OAuthConnection, type InsertOAuthConnection,
} from "./base";
import { logger } from "../lib/logger";

export async function getOAuthConnection(
  provider: string,
  accountIdentifier?: string | null,
): Promise<OAuthConnection | undefined> {
  const conditions = [eq(oauthConnections.provider, provider)] as Array<ReturnType<typeof eq>>;
  if (accountIdentifier !== undefined && accountIdentifier !== null) {
    conditions.push(eq(oauthConnections.accountIdentifier, accountIdentifier));
  }
  const [row] = await db
    .select()
    .from(oauthConnections)
    .where(and(...conditions) as never)
    .limit(1);
  return row;
}

export async function upsertOAuthConnection(data: {
  provider: string;
  accountIdentifier?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes?: string[] | null;
  metadata?: Record<string, unknown> | null;
}): Promise<OAuthConnection> {
  const existing = await getOAuthConnection(data.provider, data.accountIdentifier ?? null);

  if (existing) {
    const updates: Record<string, unknown> = {
      accessToken: data.accessToken,
      status: "active",
      lastRefreshedAt: new Date(),
      lastErrorAt: null,
      lastErrorMessage: null,
      updatedAt: sql`now()`,
    };
    if (data.refreshToken !== undefined) updates.refreshToken = data.refreshToken;
    if (data.expiresAt !== undefined) updates.expiresAt = data.expiresAt;
    if (data.scopes !== undefined) updates.scopes = data.scopes;
    if (data.metadata !== undefined) updates.metadata = data.metadata;

    const [row] = await db
      .update(oauthConnections)
      .set(updates)
      .where(eq(oauthConnections.id, existing.id))
      .returning();
    logger.info("OAuth connection refreshed", { provider: data.provider, id: row.id });
    return row;
  }

  const insert: InsertOAuthConnection = {
    provider: data.provider,
    accountIdentifier: data.accountIdentifier ?? null,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? null,
    expiresAt: data.expiresAt ?? null,
    scopes: data.scopes ?? null,
    metadata: data.metadata ?? null,
    status: "active",
    lastRefreshedAt: new Date(),
  };
  const [row] = await db.insert(oauthConnections).values(insert).returning();
  logger.info("OAuth connection created", { provider: data.provider, id: row.id });
  return row;
}

export async function markOAuthError(
  id: number,
  message: string,
  status: "expired" | "revoked" | "error" = "error",
): Promise<void> {
  await db
    .update(oauthConnections)
    .set({
      status,
      lastErrorAt: new Date(),
      lastErrorMessage: message,
      updatedAt: sql`now()`,
    })
    .where(eq(oauthConnections.id, id));
  logger.warn("OAuth connection error", { id, status, message });
}
