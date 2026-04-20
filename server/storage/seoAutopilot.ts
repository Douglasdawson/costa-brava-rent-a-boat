/**
 * SEO Autopilot Storage
 *
 * Data access for the "SEO Autopilot" admin dashboard and the
 * seo-autopilot MCP server. Handles:
 *   - Distribution tray (content ready to publish on external platforms)
 *   - Audit log of tool invocations
 *   - Aggregated overview/KPI queries used by the dashboard
 */

import {
  db, eq, and, desc, sql, gte, inArray,
  distributionTray, seoAutopilotAudit, blogPosts,
  type DistributionTrayItem, type InsertDistributionTrayItem,
  type DistributionPlatform, type DistributionStatus,
  type SeoAutopilotAudit, type InsertSeoAutopilotAudit,
} from "./base";
import { logger } from "../lib/logger";

// ================================================================
// DISTRIBUTION TRAY
// ================================================================

export interface DistributionTrayFilters {
  status?: DistributionStatus | DistributionStatus[];
  platform?: DistributionPlatform | DistributionPlatform[];
  language?: string;
  slug?: string;
  limit?: number;
  offset?: number;
}

export async function createDistributionItem(
  data: InsertDistributionTrayItem,
): Promise<DistributionTrayItem> {
  const [row] = await db.insert(distributionTray).values(data).returning();
  logger.info("Distribution item queued", {
    id: row.id, slug: row.slug, platform: row.platform, language: row.language,
  });
  return row;
}

export async function createDistributionItemsBatch(
  items: InsertDistributionTrayItem[],
): Promise<DistributionTrayItem[]> {
  if (items.length === 0) return [];
  const rows = await db.insert(distributionTray).values(items).returning();
  logger.info("Distribution batch queued", { count: rows.length });
  return rows;
}

export async function getDistributionTray(
  filters: DistributionTrayFilters = {},
): Promise<DistributionTrayItem[]> {
  const conditions = [] as Array<ReturnType<typeof eq>>;

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      if (filters.status.length > 0) conditions.push(inArray(distributionTray.status, filters.status) as never);
    } else {
      conditions.push(eq(distributionTray.status, filters.status));
    }
  }
  if (filters.platform) {
    if (Array.isArray(filters.platform)) {
      if (filters.platform.length > 0) conditions.push(inArray(distributionTray.platform, filters.platform) as never);
    } else {
      conditions.push(eq(distributionTray.platform, filters.platform));
    }
  }
  if (filters.language) conditions.push(eq(distributionTray.language, filters.language));
  if (filters.slug) conditions.push(eq(distributionTray.slug, filters.slug));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select()
    .from(distributionTray)
    .where(whereClause as never)
    .orderBy(desc(distributionTray.createdAt))
    .limit(Math.min(filters.limit ?? 100, 500))
    .offset(filters.offset ?? 0);

  return await query;
}

export async function getDistributionItemById(id: number): Promise<DistributionTrayItem | undefined> {
  const [row] = await db.select().from(distributionTray).where(eq(distributionTray.id, id));
  return row;
}

export async function updateDistributionStatus(
  id: number,
  patch: {
    status?: DistributionStatus;
    publishedUrl?: string | null;
    publishedAt?: Date | null;
    failureReason?: string | null;
    scheduledFor?: Date | null;
  },
): Promise<DistributionTrayItem | undefined> {
  const updates: Record<string, unknown> = { updatedAt: sql`now()` };
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.publishedUrl !== undefined) updates.publishedUrl = patch.publishedUrl;
  if (patch.publishedAt !== undefined) updates.publishedAt = patch.publishedAt;
  if (patch.failureReason !== undefined) updates.failureReason = patch.failureReason;
  if (patch.scheduledFor !== undefined) updates.scheduledFor = patch.scheduledFor;

  const [row] = await db
    .update(distributionTray)
    .set(updates)
    .where(eq(distributionTray.id, id))
    .returning();
  return row;
}

export async function markDistributionPublished(
  id: number,
  publishedUrl: string,
): Promise<DistributionTrayItem | undefined> {
  return updateDistributionStatus(id, {
    status: "published",
    publishedUrl,
    publishedAt: new Date(),
    failureReason: null,
  });
}

export async function markDistributionFailed(
  id: number,
  reason: string,
): Promise<DistributionTrayItem | undefined> {
  return updateDistributionStatus(id, {
    status: "failed",
    failureReason: reason,
  });
}

export async function deleteDistributionItem(id: number): Promise<boolean> {
  const result = await db.delete(distributionTray).where(eq(distributionTray.id, id));
  return (result.rowCount ?? 0) > 0;
}

export interface DistributionTrayStats {
  pending: number;
  scheduled: number;
  published: number;
  failed: number;
  discarded: number;
  total: number;
  byPlatform: Record<string, number>;
}

export async function getDistributionTrayStats(): Promise<DistributionTrayStats> {
  const rows = await db
    .select({
      status: distributionTray.status,
      platform: distributionTray.platform,
      count: sql<number>`count(*)::int`,
    })
    .from(distributionTray)
    .groupBy(distributionTray.status, distributionTray.platform);

  const stats: DistributionTrayStats = {
    pending: 0, scheduled: 0, published: 0, failed: 0, discarded: 0,
    total: 0, byPlatform: {},
  };

  for (const r of rows) {
    const status = r.status as DistributionStatus;
    const c = Number(r.count) || 0;
    stats.total += c;
    if (status in stats) {
      (stats as unknown as Record<string, number>)[status] += c;
    }
    stats.byPlatform[r.platform] = (stats.byPlatform[r.platform] ?? 0) + c;
  }

  return stats;
}

// ================================================================
// AUDIT LOG
// ================================================================

export interface RecordAuditParams {
  tokenId?: number | null;
  tool: string;
  params?: Record<string, unknown> | null;
  success: boolean;
  resultSize?: number | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  ip?: string | null;
}

export async function recordAudit(entry: RecordAuditParams): Promise<SeoAutopilotAudit> {
  const values: InsertSeoAutopilotAudit = {
    tokenId: entry.tokenId ?? null,
    tool: entry.tool,
    params: entry.params ?? null,
    success: entry.success,
    resultSize: entry.resultSize ?? null,
    durationMs: entry.durationMs ?? null,
    errorMessage: entry.errorMessage ?? null,
    ip: entry.ip ?? null,
  };
  const [row] = await db.insert(seoAutopilotAudit).values(values).returning();
  return row;
}

export interface AuditLogFilters {
  tool?: string;
  success?: boolean;
  tokenId?: number;
  sinceHours?: number;
  limit?: number;
  offset?: number;
}

export async function getAuditLog(filters: AuditLogFilters = {}): Promise<SeoAutopilotAudit[]> {
  const conditions = [] as Array<ReturnType<typeof eq>>;
  if (filters.tool) conditions.push(eq(seoAutopilotAudit.tool, filters.tool));
  if (filters.success !== undefined) conditions.push(eq(seoAutopilotAudit.success, filters.success) as never);
  if (filters.tokenId !== undefined) conditions.push(eq(seoAutopilotAudit.tokenId, filters.tokenId));
  if (filters.sinceHours && filters.sinceHours > 0) {
    const cutoff = new Date(Date.now() - filters.sinceHours * 3600_000);
    conditions.push(gte(seoAutopilotAudit.createdAt, cutoff) as never);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select()
    .from(seoAutopilotAudit)
    .where(whereClause as never)
    .orderBy(desc(seoAutopilotAudit.createdAt))
    .limit(Math.min(filters.limit ?? 200, 1000))
    .offset(filters.offset ?? 0);
}

// ================================================================
// OVERVIEW (dashboard KPIs)
// ================================================================

export interface AutopilotOverview {
  blogPosts: { total: number; published: number; last30d: number };
  distribution: DistributionTrayStats;
  audit: { last24h: number; last24hErrors: number; topTools: Array<{ tool: string; count: number }> };
  tokens: { active: number; revoked: number };
  generatedAt: string;
}

export async function getOverviewData(): Promise<AutopilotOverview> {
  const since24h = new Date(Date.now() - 24 * 3600_000);
  const since30d = new Date(Date.now() - 30 * 24 * 3600_000);

  const [blogTotals, blogLast30, distStats, auditLast24, auditErr24, topTools, tokenCounts] = await Promise.all([
    db.select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where ${blogPosts.isPublished} = true)::int`,
    }).from(blogPosts),

    db.select({ c: sql<number>`count(*)::int` })
      .from(blogPosts)
      .where(gte(blogPosts.createdAt, since30d)),

    getDistributionTrayStats(),

    db.select({ c: sql<number>`count(*)::int` })
      .from(seoAutopilotAudit)
      .where(gte(seoAutopilotAudit.createdAt, since24h)),

    db.select({ c: sql<number>`count(*)::int` })
      .from(seoAutopilotAudit)
      .where(and(
        gte(seoAutopilotAudit.createdAt, since24h),
        eq(seoAutopilotAudit.success, false),
      )),

    db.select({
      tool: seoAutopilotAudit.tool,
      count: sql<number>`count(*)::int`,
    })
      .from(seoAutopilotAudit)
      .where(gte(seoAutopilotAudit.createdAt, since24h))
      .groupBy(seoAutopilotAudit.tool)
      .orderBy(sql`count(*) desc`)
      .limit(5),

    db.execute(sql`
      select
        count(*) filter (where revoked_at is null and (expires_at is null or expires_at > now()))::int as active,
        count(*) filter (where revoked_at is not null)::int as revoked
      from mcp_tokens
    `),
  ]);

  const tokenRow = ((tokenCounts as unknown as { rows?: Array<{ active: number; revoked: number }> }).rows ?? [])[0] ?? { active: 0, revoked: 0 };

  return {
    blogPosts: {
      total: Number(blogTotals[0]?.total ?? 0),
      published: Number(blogTotals[0]?.published ?? 0),
      last30d: Number(blogLast30[0]?.c ?? 0),
    },
    distribution: distStats,
    audit: {
      last24h: Number(auditLast24[0]?.c ?? 0),
      last24hErrors: Number(auditErr24[0]?.c ?? 0),
      topTools: topTools.map(t => ({ tool: t.tool, count: Number(t.count) })),
    },
    tokens: {
      active: Number(tokenRow.active ?? 0),
      revoked: Number(tokenRow.revoked ?? 0),
    },
    generatedAt: new Date().toISOString(),
  };
}

// ================================================================
// ALERTS (derived, lightweight)
// ================================================================

export interface AutopilotAlert {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  detail: string;
  createdAt: string;
}

export async function getAlerts(): Promise<AutopilotAlert[]> {
  const alerts: AutopilotAlert[] = [];

  // 1) Failed distribution items in the last 24h
  const since24h = new Date(Date.now() - 24 * 3600_000);
  const failed = await db
    .select({
      id: distributionTray.id,
      slug: distributionTray.slug,
      platform: distributionTray.platform,
      reason: distributionTray.failureReason,
      createdAt: distributionTray.updatedAt,
    })
    .from(distributionTray)
    .where(and(
      eq(distributionTray.status, "failed"),
      gte(distributionTray.updatedAt, since24h),
    ))
    .orderBy(desc(distributionTray.updatedAt))
    .limit(20);

  for (const f of failed) {
    alerts.push({
      id: `dist-failed-${f.id}`,
      severity: "error",
      title: `Distribución fallida: ${f.platform}`,
      detail: `${f.slug} — ${f.reason ?? "sin detalle"}`,
      createdAt: (f.createdAt ?? new Date()).toISOString(),
    });
  }

  // 2) Excess error rate in audit log (last 24h > 20%)
  const auditAgg = await db
    .select({
      total: sql<number>`count(*)::int`,
      errors: sql<number>`count(*) filter (where success = false)::int`,
    })
    .from(seoAutopilotAudit)
    .where(gte(seoAutopilotAudit.createdAt, since24h));

  const total = Number(auditAgg[0]?.total ?? 0);
  const errors = Number(auditAgg[0]?.errors ?? 0);
  if (total >= 10 && errors / total > 0.2) {
    alerts.push({
      id: "audit-error-rate",
      severity: "warning",
      title: "Tasa de errores MCP elevada",
      detail: `${errors}/${total} llamadas han fallado en las últimas 24h (${Math.round((errors / total) * 100)}%).`,
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}
