import {
  db, eq, and, sql, desc,
  globalFeatureFlags, featureFlags, tenants,
  type GlobalFeatureFlag, type InsertGlobalFeatureFlag, type UpdateGlobalFeatureFlag,
  type FeatureFlag, type UpsertFeatureFlag,
} from "./base";
import { logger } from "../lib/logger";
import crypto from "crypto";

// ===== IN-MEMORY CACHE =====
// Avoids hitting DB on every feature check. Refreshes every 60 seconds.

interface CachedFlags {
  global: GlobalFeatureFlag[];
  tenantOverrides: Map<string, FeatureFlag[]>; // tenantId -> overrides
  expiresAt: number;
}

let flagsCache: CachedFlags | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

function invalidateCache(): void {
  flagsCache = null;
}

async function ensureCache(): Promise<CachedFlags> {
  const now = Date.now();
  if (flagsCache && flagsCache.expiresAt > now) {
    return flagsCache;
  }

  const [globalRows, tenantRows] = await Promise.all([
    db.select().from(globalFeatureFlags),
    db.select().from(featureFlags),
  ]);

  const tenantOverrides = new Map<string, FeatureFlag[]>();
  for (const row of tenantRows) {
    const existing = tenantOverrides.get(row.tenantId) || [];
    existing.push(row);
    tenantOverrides.set(row.tenantId, existing);
  }

  flagsCache = {
    global: globalRows,
    tenantOverrides,
    expiresAt: now + CACHE_TTL_MS,
  };

  return flagsCache;
}

// ===== CONSISTENT HASHING FOR ROLLOUT =====

/**
 * Deterministic hash-based rollout check.
 * Uses SHA-256 of (tenantId + flagName) so the same tenant always gets the same
 * result for a given flag, regardless of when/where the check happens.
 * Returns a value 0-99.
 */
function rolloutBucket(tenantId: string, flagName: string): number {
  const hash = crypto.createHash("sha256").update(`${tenantId}:${flagName}`).digest();
  // Use first 4 bytes as unsigned 32-bit integer, mod 100
  const value = hash.readUInt32BE(0);
  return value % 100;
}

// ===== PUBLIC API =====

/**
 * Get all resolved feature flags for a tenant.
 * Global flags are the base; tenant-specific overrides take priority.
 * Returns only the flags that are relevant to this tenant (plan-gated, rollout-checked).
 */
export async function getFeatureFlagsForTenant(
  tenantId: string,
): Promise<Array<{ name: string; enabled: boolean; description: string | null }>> {
  const cache = await ensureCache();

  // Look up tenant plan for plan-gating
  const [tenant] = await db.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, tenantId));
  const tenantPlan = tenant?.plan ?? "starter";

  const tenantOverrides = cache.tenantOverrides.get(tenantId) || [];
  const overrideMap = new Map<string, FeatureFlag>();
  for (const override of tenantOverrides) {
    overrideMap.set(override.name, override);
  }

  const result: Array<{ name: string; enabled: boolean; description: string | null }> = [];

  for (const globalFlag of cache.global) {
    const override = overrideMap.get(globalFlag.name);

    if (override) {
      // Tenant has an explicit override — use it (still apply rollout)
      const bucket = rolloutBucket(tenantId, globalFlag.name);
      const passesRollout = bucket < override.rolloutPercent;
      result.push({
        name: globalFlag.name,
        enabled: override.enabled && passesRollout,
        description: override.description ?? globalFlag.description,
      });
    } else {
      // Use global flag defaults — check plan gating and rollout
      const passesPlanGate =
        !globalFlag.allowedPlans ||
        globalFlag.allowedPlans.length === 0 ||
        globalFlag.allowedPlans.includes(tenantPlan);

      const bucket = rolloutBucket(tenantId, globalFlag.name);
      const passesRollout = bucket < globalFlag.rolloutPercent;

      result.push({
        name: globalFlag.name,
        enabled: globalFlag.enabled && passesPlanGate && passesRollout,
        description: globalFlag.description,
      });
    }

    // Remove from overrideMap so we can handle tenant-only flags below
    overrideMap.delete(globalFlag.name);
  }

  // Add any tenant-only flags that don't have a corresponding global flag
  overrideMap.forEach((override, name) => {
    const bucket = rolloutBucket(tenantId, name);
    const passesRollout = bucket < override.rolloutPercent;
    result.push({
      name,
      enabled: override.enabled && passesRollout,
      description: override.description,
    });
  });

  return result;
}

/**
 * Check if a specific feature is enabled for a tenant.
 * Uses in-memory cache + consistent hashing for rollout.
 */
export async function isFeatureEnabled(tenantId: string, flagName: string): Promise<boolean> {
  const cache = await ensureCache();

  const globalFlag = cache.global.find((f) => f.name === flagName);
  const tenantOverrides = cache.tenantOverrides.get(tenantId) || [];
  const override = tenantOverrides.find((f) => f.name === flagName);

  // If tenant has an explicit override, use it
  if (override) {
    if (!override.enabled) return false;
    const bucket = rolloutBucket(tenantId, flagName);
    return bucket < override.rolloutPercent;
  }

  // Fall back to global flag
  if (!globalFlag) return false;
  if (!globalFlag.enabled) return false;

  // Check plan gating
  if (globalFlag.allowedPlans && globalFlag.allowedPlans.length > 0) {
    const [tenant] = await db.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, tenantId));
    const tenantPlan = tenant?.plan ?? "starter";
    if (!globalFlag.allowedPlans.includes(tenantPlan)) return false;
  }

  // Check rollout
  const bucket = rolloutBucket(tenantId, flagName);
  return bucket < globalFlag.rolloutPercent;
}

// ===== TENANT FLAG MANAGEMENT =====

/**
 * Set a per-tenant feature flag override.
 */
export async function setFeatureFlag(
  tenantId: string,
  name: string,
  data: UpsertFeatureFlag,
): Promise<FeatureFlag> {
  const [existing] = await db
    .select()
    .from(featureFlags)
    .where(and(eq(featureFlags.tenantId, tenantId), eq(featureFlags.name, name)));

  let result: FeatureFlag;

  if (existing) {
    const [updated] = await db
      .update(featureFlags)
      .set({
        enabled: data.enabled,
        description: data.description ?? existing.description,
        rolloutPercent: data.rolloutPercent ?? existing.rolloutPercent,
        conditions: data.conditions ?? existing.conditions,
        updatedAt: sql`now()`,
      })
      .where(eq(featureFlags.id, existing.id))
      .returning();
    result = updated;
    logger.info("Feature flag updated for tenant", { tenantId, name, enabled: data.enabled });
  } else {
    const [created] = await db
      .insert(featureFlags)
      .values({
        tenantId,
        name,
        enabled: data.enabled,
        description: data.description ?? null,
        rolloutPercent: data.rolloutPercent ?? 100,
        conditions: data.conditions ?? null,
      })
      .returning();
    result = created;
    logger.info("Feature flag created for tenant", { tenantId, name, enabled: data.enabled });
  }

  invalidateCache();
  return result;
}

/**
 * Get all feature flags for a specific tenant (raw overrides, not resolved).
 */
export async function getTenantFlags(tenantId: string): Promise<FeatureFlag[]> {
  return await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.tenantId, tenantId))
    .orderBy(featureFlags.name);
}

/**
 * Delete a tenant-specific flag override (reverts to global default).
 */
export async function deleteTenantFlag(tenantId: string, name: string): Promise<boolean> {
  const result = await db
    .delete(featureFlags)
    .where(and(eq(featureFlags.tenantId, tenantId), eq(featureFlags.name, name)));

  invalidateCache();
  const deleted = (result.rowCount ?? 0) > 0;
  if (deleted) {
    logger.info("Feature flag deleted for tenant", { tenantId, name });
  }
  return deleted;
}

// ===== GLOBAL FLAG MANAGEMENT (SUPER ADMIN) =====

/**
 * Get all global feature flags.
 */
export async function getGlobalFlags(): Promise<GlobalFeatureFlag[]> {
  return await db
    .select()
    .from(globalFeatureFlags)
    .orderBy(globalFeatureFlags.name);
}

/**
 * Create a new global feature flag.
 */
export async function createGlobalFlag(data: InsertGlobalFeatureFlag): Promise<GlobalFeatureFlag> {
  const [created] = await db
    .insert(globalFeatureFlags)
    .values({
      name: data.name,
      description: data.description ?? null,
      enabled: data.enabled ?? false,
      rolloutPercent: data.rolloutPercent ?? 0,
      allowedPlans: data.allowedPlans ?? null,
    })
    .returning();

  invalidateCache();
  logger.info("Global feature flag created", { name: data.name, enabled: data.enabled });
  return created;
}

/**
 * Update an existing global feature flag.
 */
export async function updateGlobalFlag(
  name: string,
  data: UpdateGlobalFeatureFlag,
): Promise<GlobalFeatureFlag | undefined> {
  const updates: Record<string, unknown> = { updatedAt: sql`now()` };
  if (data.description !== undefined) updates.description = data.description;
  if (data.enabled !== undefined) updates.enabled = data.enabled;
  if (data.rolloutPercent !== undefined) updates.rolloutPercent = data.rolloutPercent;
  if (data.allowedPlans !== undefined) updates.allowedPlans = data.allowedPlans;

  const [updated] = await db
    .update(globalFeatureFlags)
    .set(updates)
    .where(eq(globalFeatureFlags.name, name))
    .returning();

  if (updated) {
    invalidateCache();
    logger.info("Global feature flag updated", { name, fields: Object.keys(data) });
  }

  return updated;
}

/**
 * Delete a global feature flag.
 * Also removes all tenant overrides for this flag.
 */
export async function deleteGlobalFlag(name: string): Promise<boolean> {
  // Remove tenant overrides first
  await db.delete(featureFlags).where(eq(featureFlags.name, name));

  const result = await db
    .delete(globalFeatureFlags)
    .where(eq(globalFeatureFlags.name, name));

  invalidateCache();
  const deleted = (result.rowCount ?? 0) > 0;
  if (deleted) {
    logger.info("Global feature flag deleted", { name });
  }
  return deleted;
}
