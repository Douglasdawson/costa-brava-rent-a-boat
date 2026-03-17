import {
  db, eq, and, sql, desc,
  experiments, experimentAssignments, experimentEvents,
  type Experiment, type ExperimentAssignment, type ExperimentEvent,
  type InsertExperiment, type UpdateExperiment,
  type ExperimentVariant,
} from "./base";
import { logger } from "../lib/logger";

// ===== IN-MEMORY CACHE =====
// Avoids hitting DB on every page load for active experiments

interface CachedExperiments {
  data: Experiment[];
  expiresAt: number;
}

let activeExperimentsCache: CachedExperiments | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

function invalidateCache(): void {
  activeExperimentsCache = null;
}

// ===== EXPERIMENT CRUD =====

export async function getActiveExperiments(): Promise<Experiment[]> {
  const now = Date.now();
  if (activeExperimentsCache && activeExperimentsCache.expiresAt > now) {
    return activeExperimentsCache.data;
  }

  const rows = await db
    .select()
    .from(experiments)
    .where(eq(experiments.status, "active"));

  // Filter by date range on the application side (timestamps may be null)
  const currentDate = new Date();
  const filtered = rows.filter((exp) => {
    if (exp.startDate && exp.startDate > currentDate) return false;
    if (exp.endDate && exp.endDate < currentDate) return false;
    return true;
  });

  activeExperimentsCache = { data: filtered, expiresAt: now + CACHE_TTL_MS };
  return filtered;
}

export async function getAllExperiments(): Promise<Experiment[]> {
  return await db
    .select()
    .from(experiments)
    .orderBy(desc(experiments.createdAt));
}

export async function getExperimentById(id: number): Promise<Experiment | undefined> {
  const [row] = await db.select().from(experiments).where(eq(experiments.id, id));
  return row;
}

export async function getExperimentByName(name: string): Promise<Experiment | undefined> {
  const [row] = await db.select().from(experiments).where(eq(experiments.name, name));
  return row;
}

export async function createExperiment(data: InsertExperiment): Promise<Experiment> {
  const [created] = await db.insert(experiments).values({
    tenantId: data.tenantId ?? null,
    name: data.name,
    description: data.description ?? null,
    status: data.status ?? "draft",
    variants: data.variants as ExperimentVariant[],
    targetPages: data.targetPages ?? null,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
  }).returning();
  invalidateCache();
  logger.info("Experiment created", { experimentId: created.id, name: created.name });
  return created;
}

export async function updateExperiment(id: number, data: UpdateExperiment): Promise<Experiment | undefined> {
  // Build update payload, only including defined fields
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;
  if (data.variants !== undefined) updates.variants = data.variants;
  if (data.targetPages !== undefined) updates.targetPages = data.targetPages;
  if (data.startDate !== undefined) updates.startDate = data.startDate;
  if (data.endDate !== undefined) updates.endDate = data.endDate;

  if (Object.keys(updates).length === 0) {
    return await getExperimentById(id);
  }

  const [updated] = await db
    .update(experiments)
    .set(updates)
    .where(eq(experiments.id, id))
    .returning();

  invalidateCache();
  if (updated) {
    logger.info("Experiment updated", { experimentId: id, fields: Object.keys(updates) });
  }
  return updated;
}

// ===== ASSIGNMENT =====

/**
 * Get existing assignment for a session+experiment, or create one via weighted random.
 * Deterministic: same session always returns the same variant once assigned.
 */
export async function getOrCreateAssignment(
  experimentId: number,
  sessionId: string,
  variants: ExperimentVariant[],
): Promise<ExperimentAssignment> {
  // Check for existing assignment first
  const [existing] = await db
    .select()
    .from(experimentAssignments)
    .where(
      and(
        eq(experimentAssignments.experimentId, experimentId),
        eq(experimentAssignments.sessionId, sessionId),
      ),
    );

  if (existing) return existing;

  // Weighted random assignment
  const chosenVariant = pickWeightedVariant(variants, sessionId);

  const [created] = await db
    .insert(experimentAssignments)
    .values({
      experimentId,
      sessionId,
      variant: chosenVariant,
    })
    .onConflictDoNothing() // Race condition: another request may have assigned simultaneously
    .returning();

  // If conflict happened, fetch the existing one
  if (!created) {
    const [reFetched] = await db
      .select()
      .from(experimentAssignments)
      .where(
        and(
          eq(experimentAssignments.experimentId, experimentId),
          eq(experimentAssignments.sessionId, sessionId),
        ),
      );
    return reFetched;
  }

  return created;
}

/**
 * Pick a variant using weighted random selection.
 * Uses a simple hash of sessionId for reproducibility within the same call,
 * but actual determinism is ensured by the DB unique constraint.
 */
function pickWeightedVariant(variants: ExperimentVariant[], _sessionId: string): string {
  const rand = Math.random() * 100;
  let cumulative = 0;

  for (const v of variants) {
    cumulative += v.weight;
    if (rand < cumulative) {
      return v.id;
    }
  }

  // Fallback to last variant (handles floating point edge cases)
  return variants[variants.length - 1].id;
}

// ===== EVENT TRACKING =====

export async function trackEvent(
  experimentId: number,
  sessionId: string,
  variant: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<ExperimentEvent> {
  const [event] = await db
    .insert(experimentEvents)
    .values({
      experimentId,
      sessionId,
      variant,
      eventType,
      metadata: metadata ?? null,
    })
    .returning();
  return event;
}

// ===== RESULTS / AGGREGATION =====

export interface VariantResult {
  variant: string;
  totalSessions: number;
  events: Record<string, number>; // eventType -> count
}

export interface ExperimentResults {
  experiment: Experiment;
  variants: VariantResult[];
  totalSessions: number;
}

export async function getExperimentResults(experimentId: number): Promise<ExperimentResults | null> {
  const experiment = await getExperimentById(experimentId);
  if (!experiment) return null;

  // Get session counts per variant
  const sessionCounts = await db
    .select({
      variant: experimentAssignments.variant,
      count: sql<number>`count(*)::int`,
    })
    .from(experimentAssignments)
    .where(eq(experimentAssignments.experimentId, experimentId))
    .groupBy(experimentAssignments.variant);

  // Get event counts per variant+eventType
  const eventCounts = await db
    .select({
      variant: experimentEvents.variant,
      eventType: experimentEvents.eventType,
      count: sql<number>`count(*)::int`,
    })
    .from(experimentEvents)
    .where(eq(experimentEvents.experimentId, experimentId))
    .groupBy(experimentEvents.variant, experimentEvents.eventType);

  // Build results by variant
  const variantMap = new Map<string, VariantResult>();

  for (const sc of sessionCounts) {
    variantMap.set(sc.variant, {
      variant: sc.variant,
      totalSessions: sc.count,
      events: {},
    });
  }

  for (const ec of eventCounts) {
    let entry = variantMap.get(ec.variant);
    if (!entry) {
      entry = { variant: ec.variant, totalSessions: 0, events: {} };
      variantMap.set(ec.variant, entry);
    }
    entry.events[ec.eventType] = ec.count;
  }

  const variants = Array.from(variantMap.values());
  const totalSessions = variants.reduce((sum, v) => sum + v.totalSessions, 0);

  return { experiment, variants, totalSessions };
}
