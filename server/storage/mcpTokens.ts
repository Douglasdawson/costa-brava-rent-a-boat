/**
 * MCP Tokens Storage
 *
 * Manages bearer tokens used to authenticate public-facing MCP clients
 * against the seo-autopilot MCP server.
 *
 * Security notes:
 * - Tokens are stored as SHA-256(rawToken + salt) — never in plaintext.
 * - Raw token is only returned once at creation time.
 * - Prefix (first 8 chars) is stored for display so the admin can identify
 *   which token is which without revealing the secret.
 * - Revoked tokens are kept in the table (revokedAt set) so audit logs
 *   can still reference them via tokenId.
 */

import crypto from "crypto";
import {
  db, eq, and, desc, sql, isNull,
  mcpTokens,
  type McpToken, type InsertMcpToken,
} from "./base";
import { logger } from "../lib/logger";

// ===== TOKEN GENERATION & HASHING =====

const TOKEN_SALT = process.env.MCP_TOKEN_SALT ?? "costa-brava-mcp-default-salt-change-me";
const TOKEN_BYTES = 32; // 256 bits of entropy

export interface GeneratedToken {
  record: McpToken;
  rawToken: string;     // ONLY available here — never persisted in plaintext
}

function generateRawToken(): string {
  // "cbrb_" prefix makes the token visually identifiable
  const buf = crypto.randomBytes(TOKEN_BYTES);
  return "cbrb_" + buf.toString("base64url");
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw + TOKEN_SALT).digest("hex");
}

function prefixOf(raw: string): string {
  return raw.slice(0, 8);
}

// ===== TOKEN VALIDATION CACHE =====
// In-memory cache to skip hash + DB lookup on every request.
// 60s TTL keeps revocation latency bounded; revokeMcpToken also evicts.
const TOKEN_CACHE_TTL_MS = 60_000;
const TOKEN_CACHE_MAX = 512;

interface CacheEntry {
  value: McpToken | null;
  expiresAt: number;
}

const tokenCache = new Map<string, CacheEntry>();

export function __cachePut(hash: string, value: McpToken | null): void {
  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    const oldest = tokenCache.keys().next().value;
    if (oldest !== undefined) tokenCache.delete(oldest);
  }
  tokenCache.set(hash, { value, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
}

export function __cacheGet(hash: string): McpToken | null | undefined {
  const e = tokenCache.get(hash);
  if (!e) return undefined;
  if (e.expiresAt <= Date.now()) {
    tokenCache.delete(hash);
    return undefined;
  }
  return e.value;
}

export function __resetTokenCache(): void {
  tokenCache.clear();
}

export function __cacheStats(): { size: number } {
  return { size: tokenCache.size };
}

// ===== CRUD =====

export async function createMcpToken(params: {
  name: string;
  expiresAt?: Date | null;
  scopes?: string[];
  createdBy?: string | null;
}): Promise<GeneratedToken> {
  const raw = generateRawToken();
  const values: InsertMcpToken = {
    name: params.name,
    tokenHash: hashToken(raw),
    tokenPrefix: prefixOf(raw),
    scopes: params.scopes ?? [],
    createdBy: params.createdBy ?? null,
    expiresAt: params.expiresAt ?? null,
  };

  const [record] = await db.insert(mcpTokens).values(values).returning();
  logger.info("MCP token created", { id: record.id, name: record.name, prefix: record.tokenPrefix });
  return { record, rawToken: raw };
}

export async function listMcpTokens(): Promise<McpToken[]> {
  return await db.select().from(mcpTokens).orderBy(desc(mcpTokens.createdAt));
}

export async function getMcpTokenById(id: number): Promise<McpToken | undefined> {
  const [row] = await db.select().from(mcpTokens).where(eq(mcpTokens.id, id));
  return row;
}

/**
 * Validate a raw token coming from an Authorization: Bearer header.
 * Returns the token row only if it exists, is not revoked, and is not expired.
 */
export async function validateMcpToken(rawToken: string): Promise<McpToken | null> {
  if (!rawToken || typeof rawToken !== "string") return null;
  if (rawToken.length < 10 || rawToken.length > 200) return null;

  const hash = hashToken(rawToken);
  const cached = __cacheGet(hash);
  if (cached !== undefined) return cached;

  const [row] = await db
    .select()
    .from(mcpTokens)
    .where(and(eq(mcpTokens.tokenHash, hash), isNull(mcpTokens.revokedAt)));

  if (!row) {
    __cachePut(hash, null);
    return null;
  }
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    __cachePut(hash, null);
    return null;
  }
  __cachePut(hash, row);
  return row;
}

export async function recordTokenUsage(id: number, ip?: string | null): Promise<void> {
  await db
    .update(mcpTokens)
    .set({
      lastUsedAt: sql`now()`,
      lastUsedIp: ip ?? null,
      callCount: sql`${mcpTokens.callCount} + 1`,
    })
    .where(eq(mcpTokens.id, id));
}

export async function revokeMcpToken(id: number): Promise<boolean> {
  const result = await db
    .update(mcpTokens)
    .set({ revokedAt: sql`now()` })
    .where(and(eq(mcpTokens.id, id), isNull(mcpTokens.revokedAt)));

  const revoked = (result.rowCount ?? 0) > 0;
  if (revoked) {
    for (const [h, e] of tokenCache) {
      if (e.value?.id === id) tokenCache.delete(h);
    }
    logger.info("MCP token revoked", { id });
  }
  return revoked;
}

/**
 * Safe DTO for public admin listing — never exposes the hash.
 */
export interface McpTokenPublic {
  id: number;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  createdBy: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  revokedAt: Date | null;
  callCount: number;
  active: boolean;
}

export function toPublic(row: McpToken): McpTokenPublic {
  const now = Date.now();
  const expired = row.expiresAt ? row.expiresAt.getTime() <= now : false;
  const active = row.revokedAt === null && !expired;
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.tokenPrefix,
    scopes: row.scopes ?? [],
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastUsedAt,
    lastUsedIp: row.lastUsedIp,
    revokedAt: row.revokedAt,
    callCount: row.callCount,
    active,
  };
}
