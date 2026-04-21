/**
 * seo-autopilot MCP tool registrations.
 *
 * Tools are kept small, read-mostly, and backed by the existing storage layer
 * and SEO tables. Every call writes an entry to the audit log.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eq, desc, asc, and, sql, gte, lte } from "drizzle-orm";
import { db } from "../shared/db.js";
import * as schema from "../../../shared/schema.js";
import * as seoAutopilot from "../../storage/seoAutopilot.js";
import type { DistributionPlatform } from "../../../shared/schema.js";

const TEXT = (obj: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }],
});

export interface ToolContext {
  tokenId: number | null;
  ip?: string | null;
}

// ---------------------------------------------------------------------------
// audit wrapper — every tool is wrapped so success/failure are recorded
// ---------------------------------------------------------------------------
async function withAudit<T>(
  ctx: ToolContext,
  tool: string,
  params: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    const resultSize = typeof result === "string" ? result.length : JSON.stringify(result ?? null).length;
    await seoAutopilot.recordAudit({
      tokenId: ctx.tokenId ?? null,
      tool,
      params,
      success: true,
      resultSize,
      durationMs: Date.now() - started,
      ip: ctx.ip ?? null,
    });
    return result;
  } catch (err) {
    await seoAutopilot.recordAudit({
      tokenId: ctx.tokenId ?? null,
      tool,
      params,
      success: false,
      durationMs: Date.now() - started,
      errorMessage: err instanceof Error ? err.message : String(err),
      ip: ctx.ip ?? null,
    });
    throw err;
  }
}

// ===========================================================================
export function registerAutopilotTools(server: McpServer, ctx: ToolContext): void {
  // -------------------------------------------------------------------------
  // 1) autopilot_overview — single-call KPI snapshot
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_overview",
    "Get a KPI snapshot: blog posts, distribution tray stats, audit activity, token status.",
    {},
    async () => {
      return TEXT(await withAudit(ctx, "autopilot_overview", {}, () =>
        seoAutopilot.getOverviewData(),
      ));
    },
  );

  // -------------------------------------------------------------------------
  // 2) autopilot_keyword_radar — keyword rankings filtered by cluster/position
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_keyword_radar",
    "List tracked keywords with their latest rankings. Filterable by cluster, language, position range.",
    {
      cluster: z.string().optional().describe("Cluster name, e.g. 'blanes-local' or 'costa-brava-broad'"),
      language: z.string().length(2).optional().describe("ISO 2-letter language code"),
      maxPosition: z.number().int().positive().max(100).optional(),
      limit: z.number().int().positive().max(200).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_keyword_radar", args, async () => {
        const conditions = [] as Array<ReturnType<typeof eq>>;
        if (args.cluster) conditions.push(eq(schema.seoKeywords.cluster, args.cluster));
        if (args.language) conditions.push(eq(schema.seoKeywords.language, args.language) as never);
        if (args.maxPosition !== undefined) {
          conditions.push(sql`${schema.seoRankings.position} <= ${String(args.maxPosition)}` as never);
        }

        const rows = await db
          .select()
          .from(schema.seoKeywords)
          .leftJoin(schema.seoRankings, eq(schema.seoKeywords.id, schema.seoRankings.keywordId))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schema.seoRankings.impressions))
          .limit(args.limit ?? 50);

        return { count: rows.length, results: rows };
      }));
    },
  );

  // -------------------------------------------------------------------------
  // 3) autopilot_distribution_tray — list queued/published items
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_distribution_tray",
    "List content items queued for distribution to external platforms (Medium, LinkedIn, Reddit, etc.).",
    {
      status: z.enum(schema.DISTRIBUTION_STATUSES).optional(),
      platform: z.enum(schema.DISTRIBUTION_PLATFORMS).optional(),
      language: z.string().length(2).optional(),
      slug: z.string().optional(),
      limit: z.number().int().positive().max(500).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_distribution_tray", args, () =>
        seoAutopilot.getDistributionTray(args),
      ));
    },
  );

  // -------------------------------------------------------------------------
  // 4) autopilot_queue_distribution — enqueue a new item
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_queue_distribution",
    "Queue a content item for distribution on a specific platform. Content must already be adapted for that platform.",
    {
      slug: z.string().min(1).describe("Source blog post slug"),
      platform: z.enum(schema.DISTRIBUTION_PLATFORMS),
      language: z.string().length(2).default("es"),
      title: z.string().optional(),
      content: z.string().min(1),
      targetUrl: z.string().url().optional(),
      contactEmail: z.string().email().optional(),
      scheduledFor: z.string().datetime().optional().describe("ISO date-time; omit for immediate pending."),
      metadata: z.record(z.unknown()).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_queue_distribution", args, async () => {
        const row = await seoAutopilot.createDistributionItem({
          slug: args.slug,
          platform: args.platform as DistributionPlatform,
          language: args.language,
          title: args.title ?? null,
          content: args.content,
          targetUrl: args.targetUrl ?? null,
          contactEmail: args.contactEmail ?? null,
          scheduledFor: args.scheduledFor ? new Date(args.scheduledFor) : null,
          metadata: args.metadata ?? null,
          status: args.scheduledFor ? "scheduled" : "pending",
        });
        return { id: row.id, status: row.status, createdAt: row.createdAt };
      }));
    },
  );

  // -------------------------------------------------------------------------
  // 5) autopilot_mark_distribution — mark an item as published or failed
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_mark_distribution",
    "Mark a distribution item as published (with resulting URL) or failed (with reason).",
    {
      id: z.number().int().positive(),
      result: z.enum(["published", "failed", "discarded"]),
      publishedUrl: z.string().url().optional(),
      reason: z.string().optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_mark_distribution", args, async () => {
        if (args.result === "published") {
          if (!args.publishedUrl) throw new Error("publishedUrl is required when result=published");
          const row = await seoAutopilot.markDistributionPublished(args.id, args.publishedUrl);
          return { ok: !!row, item: row ?? null };
        }
        if (args.result === "failed") {
          const row = await seoAutopilot.markDistributionFailed(args.id, args.reason ?? "unspecified");
          return { ok: !!row, item: row ?? null };
        }
        const row = await seoAutopilot.updateDistributionStatus(args.id, {
          status: "discarded",
          failureReason: args.reason ?? null,
        });
        return { ok: !!row, item: row ?? null };
      }));
    },
  );

  // -------------------------------------------------------------------------
  // 6) autopilot_alerts — derived alerts (failed dist, high error rate)
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_alerts",
    "List current alerts: failed distributions, elevated MCP error rate, etc.",
    {},
    async () => {
      return TEXT(await withAudit(ctx, "autopilot_alerts", {}, () =>
        seoAutopilot.getAlerts(),
      ));
    },
  );

  // -------------------------------------------------------------------------
  // 7) autopilot_audit_log — recent tool invocations
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_audit_log",
    "Read the recent audit log of MCP tool invocations.",
    {
      tool: z.string().optional(),
      success: z.boolean().optional(),
      sinceHours: z.number().int().positive().max(720).optional(),
      limit: z.number().int().positive().max(500).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_audit_log", args, () =>
        seoAutopilot.getAuditLog(args),
      ));
    },
  );

  // -------------------------------------------------------------------------
  // 8) autopilot_blog_drafts — preview pending/draft blog posts
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_blog_drafts",
    "List the most recent blog posts (published or draft) for quick triage.",
    {
      onlyDrafts: z.boolean().optional().describe("If true, only unpublished posts."),
      limit: z.number().int().positive().max(100).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_blog_drafts", args, async () => {
        const conditions = [] as Array<ReturnType<typeof eq>>;
        if (args.onlyDrafts) conditions.push(eq(schema.blogPosts.isPublished, false) as never);
        const rows = await db
          .select({
            id: schema.blogPosts.id,
            slug: schema.blogPosts.slug,
            title: schema.blogPosts.title,
            titleByLang: schema.blogPosts.titleByLang,
            category: schema.blogPosts.category,
            isPublished: schema.blogPosts.isPublished,
            isAutoGenerated: schema.blogPosts.isAutoGenerated,
            seoScore: schema.blogPosts.seoScore,
            clusterId: schema.blogPosts.clusterId,
            createdAt: schema.blogPosts.createdAt,
          })
          .from(schema.blogPosts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schema.blogPosts.createdAt))
          .limit(args.limit ?? 20);
        return { count: rows.length, results: rows };
      }));
    },
  );

  // =========================================================================
  // WAR ROOM — FASE 2 TOOLS (data surfaces for the SEO war machine)
  // =========================================================================

  // -------------------------------------------------------------------------
  // 9) autopilot_gsc_queries — top GSC queries by clicks / impressions / CTR
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_gsc_queries",
    "Top Google Search Console queries in a date range, aggregated. Identify click winners, impression-heavy / low-CTR opportunities, and position-3-to-5 queries to push to top 1.",
    {
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("YYYY-MM-DD, defaults to 7 days ago"),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("YYYY-MM-DD, defaults to today"),
      sortBy: z.enum(["clicks", "impressions", "ctr", "position"]).optional(),
      minImpressions: z.number().int().nonnegative().optional(),
      device: z.enum(["MOBILE", "DESKTOP", "TABLET"]).optional(),
      country: z.string().length(3).optional().describe("ISO-3 country code"),
      pageContains: z.string().optional().describe("Substring filter on page URL"),
      limit: z.number().int().positive().max(500).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_gsc_queries", args, async () => {
        const end = args.endDate || new Date().toISOString().split("T")[0];
        const defaultStart = new Date();
        defaultStart.setDate(defaultStart.getDate() - 7);
        const start = args.startDate || defaultStart.toISOString().split("T")[0];
        const sortBy = args.sortBy || "clicks";

        const conditions: unknown[] = [
          gte(schema.gscQueries.date, start),
          lte(schema.gscQueries.date, end),
        ];
        if (args.device) conditions.push(eq(schema.gscQueries.device, args.device));
        if (args.country) conditions.push(eq(schema.gscQueries.country, args.country));
        if (args.pageContains) {
          conditions.push(sql`${schema.gscQueries.page} ILIKE ${`%${args.pageContains}%`}`);
        }
        if (args.minImpressions != null) {
          conditions.push(sql`${schema.gscQueries.impressions} >= ${args.minImpressions}`);
        }

        const rows = await db
          .select({
            query: schema.gscQueries.query,
            page: schema.gscQueries.page,
            clicks: sql<number>`SUM(${schema.gscQueries.clicks})::int`.as("clicks"),
            impressions: sql<number>`SUM(${schema.gscQueries.impressions})::int`.as("impressions"),
            ctr: sql<number>`CASE WHEN SUM(${schema.gscQueries.impressions}) > 0 THEN SUM(${schema.gscQueries.clicks})::float / SUM(${schema.gscQueries.impressions}) ELSE 0 END`.as("ctr"),
            avgPosition: sql<number>`AVG(${schema.gscQueries.position})`.as("avg_position"),
          })
          .from(schema.gscQueries)
          .where(and(...(conditions as ReturnType<typeof eq>[])))
          .groupBy(schema.gscQueries.query, schema.gscQueries.page)
          .orderBy(sortBy === "position" ? asc(sql`avg_position`) : desc(sql.identifier(sortBy === "ctr" ? "ctr" : sortBy)))
          .limit(args.limit ?? 100);

        return {
          startDate: start,
          endDate: end,
          count: rows.length,
          results: rows,
        };
      }));
    },
  );

  // -------------------------------------------------------------------------
  // 10) autopilot_ga4_lp — top landing pages with sessions + conversions
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_ga4_lp",
    "Top landing pages from GA4 with sessions, engagement, and conversions. Slice by source/medium to find channels where a page wins or loses.",
    {
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      source: z.string().optional().describe("e.g. 'google', 'direct', 'instagram'"),
      medium: z.string().optional().describe("e.g. 'organic', 'cpc', 'social'"),
      country: z.string().length(3).optional(),
      sortBy: z.enum(["sessions", "totalUsers", "conversions", "engagementRate"]).optional(),
      limit: z.number().int().positive().max(500).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_ga4_lp", args, async () => {
        const end = args.endDate || new Date().toISOString().split("T")[0];
        const defaultStart = new Date();
        defaultStart.setDate(defaultStart.getDate() - 7);
        const start = args.startDate || defaultStart.toISOString().split("T")[0];
        const sortBy = args.sortBy || "sessions";

        const conditions: unknown[] = [
          gte(schema.ga4DailyMetrics.date, start),
          lte(schema.ga4DailyMetrics.date, end),
        ];
        if (args.source) conditions.push(eq(schema.ga4DailyMetrics.source, args.source));
        if (args.medium) conditions.push(eq(schema.ga4DailyMetrics.medium, args.medium));
        if (args.country) conditions.push(eq(schema.ga4DailyMetrics.country, args.country));

        const rows = await db
          .select({
            landingPage: schema.ga4DailyMetrics.landingPage,
            sessions: sql<number>`SUM(${schema.ga4DailyMetrics.sessions})::int`.as("sessions"),
            totalUsers: sql<number>`SUM(${schema.ga4DailyMetrics.totalUsers})::int`.as("total_users"),
            newUsers: sql<number>`SUM(${schema.ga4DailyMetrics.newUsers})::int`.as("new_users"),
            engagedSessions: sql<number>`SUM(${schema.ga4DailyMetrics.engagedSessions})::int`.as("engaged_sessions"),
            engagementRate: sql<number>`CASE WHEN SUM(${schema.ga4DailyMetrics.sessions}) > 0 THEN SUM(${schema.ga4DailyMetrics.engagedSessions})::float / SUM(${schema.ga4DailyMetrics.sessions}) ELSE 0 END`.as("engagement_rate"),
            conversions: sql<number>`SUM(${schema.ga4DailyMetrics.conversions})::int`.as("conversions"),
            revenue: sql<number>`COALESCE(SUM(${schema.ga4DailyMetrics.totalRevenue}), 0)`.as("revenue"),
          })
          .from(schema.ga4DailyMetrics)
          .where(and(...(conditions as ReturnType<typeof eq>[])))
          .groupBy(schema.ga4DailyMetrics.landingPage)
          .orderBy(desc(sql.identifier(
            sortBy === "totalUsers" ? "total_users" :
            sortBy === "engagementRate" ? "engagement_rate" :
            sortBy,
          )))
          .limit(args.limit ?? 50);

        return { startDate: start, endDate: end, count: rows.length, results: rows };
      }));
    },
  );

  // -------------------------------------------------------------------------
  // 11) autopilot_cwv_report — CWV summary from psi_measurements
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_cwv_report",
    "Latest Core Web Vitals per URL (field + lab). Flags URLs breaching CWV thresholds (LCP>2.5s, CLS>0.1, INP>200ms).",
    {
      urlContains: z.string().optional(),
      strategy: z.enum(["mobile", "desktop"]).optional(),
      limit: z.number().int().positive().max(200).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_cwv_report", args, async () => {
        const conditions: unknown[] = [];
        if (args.strategy) conditions.push(eq(schema.psiMeasurements.strategy, args.strategy));
        if (args.urlContains) {
          conditions.push(sql`${schema.psiMeasurements.url} ILIKE ${`%${args.urlContains}%`}`);
        }

        // Latest measurement per (url, strategy) using DISTINCT ON
        const rows = await db.execute(sql`
          SELECT DISTINCT ON (url, strategy)
            url, strategy, performance_score, accessibility_score, seo_score,
            lcp_ms, cls_score, inp_ms, ttfb_ms, fcp_ms,
            lab_lcp_ms, lab_cls_score, lab_tbt_ms, lab_fcp_ms, lab_si_ms,
            measured_at
          FROM psi_measurements
          ${conditions.length > 0 ? sql`WHERE ${and(...(conditions as ReturnType<typeof eq>[]))}` : sql``}
          ORDER BY url, strategy, measured_at DESC
          LIMIT ${args.limit ?? 50}
        `);

        const measurements = (rows as { rows?: unknown[] }).rows ?? rows;
        const flagged = (measurements as Array<Record<string, number | null>>).filter((m) =>
          (m.lcp_ms != null && m.lcp_ms > 2500) ||
          (m.cls_score != null && m.cls_score > 0.1) ||
          (m.inp_ms != null && m.inp_ms > 200),
        );

        return {
          count: (measurements as unknown[]).length,
          flaggedCount: flagged.length,
          results: measurements,
          flagged,
        };
      }));
    },
  );

  // -------------------------------------------------------------------------
  // 12) autopilot_serp_features — SERP feature occurrences from snapshots
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_serp_features",
    "Which SERP features appeared in snapshots (AI overview, local pack, PAA, featured snippet). Useful to target features we don't own.",
    {
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("YYYY-MM-DD, defaults to latest captured"),
      resultType: z.enum(["organic", "local_pack", "featured_snippet", "video", "images", "ai_overview", "people_also_ask"]).optional(),
      onlyNotOwned: z.boolean().optional().describe("If true, exclude features we already own"),
      limit: z.number().int().positive().max(500).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_serp_features", args, async () => {
        let date = args.date;
        if (!date) {
          const latest = await db
            .select({ d: sql<string>`MAX(${schema.serpSnapshots.date})::text` })
            .from(schema.serpSnapshots);
          date = latest[0]?.d || new Date().toISOString().split("T")[0];
        }

        const conditions: unknown[] = [eq(schema.serpSnapshots.date, date)];
        if (args.resultType) conditions.push(eq(schema.serpSnapshots.resultType, args.resultType));
        if (args.onlyNotOwned) conditions.push(eq(schema.serpSnapshots.isOwn, false));

        const rows = await db
          .select({
            keywordId: schema.serpSnapshots.keywordId,
            keyword: schema.seoKeywords.keyword,
            date: schema.serpSnapshots.date,
            position: schema.serpSnapshots.position,
            url: schema.serpSnapshots.url,
            title: schema.serpSnapshots.title,
            domain: schema.serpSnapshots.domain,
            resultType: schema.serpSnapshots.resultType,
            isOwn: schema.serpSnapshots.isOwn,
          })
          .from(schema.serpSnapshots)
          .leftJoin(schema.seoKeywords, eq(schema.serpSnapshots.keywordId, schema.seoKeywords.id))
          .where(and(...(conditions as ReturnType<typeof eq>[])))
          .orderBy(desc(schema.serpSnapshots.keywordId), asc(schema.serpSnapshots.position))
          .limit(args.limit ?? 200);

        return { date, count: rows.length, results: rows };
      }));
    },
  );

  // -------------------------------------------------------------------------
  // 13) autopilot_gbp_insights — Google Business Profile (OAuth-gated stub)
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_gbp_insights",
    "Google Business Profile reviews, posts, and insight metrics for the boat rental location. Returns status:'not_configured' until OAuth is completed.",
    {
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_gbp_insights", args, async () => {
        const conn = await db
          .select()
          .from(schema.oauthConnections)
          .where(and(
            eq(schema.oauthConnections.provider, "gbp"),
            eq(schema.oauthConnections.status, "active"),
          ))
          .limit(1);
        if (conn.length === 0) {
          return {
            status: "not_configured",
            message: "Connect Google Business Profile via OAuth to populate this tool.",
            setupPath: "/crm/autopilot#connect-gbp",
          };
        }
        // Placeholder — full integration lives behind OAuth. Returning shape
        // keeps the contract stable for consumers.
        return {
          status: "pending_implementation",
          account: conn[0].accountIdentifier,
          note: "GBP API fetch is not yet wired. Reviews, posts, and insights will appear here once collectGbp() runs.",
        };
      }));
    },
  );

  // -------------------------------------------------------------------------
  // 14) autopilot_bing_queries — Bing Webmaster Tools (OAuth-gated stub)
  // -------------------------------------------------------------------------
  server.tool(
    "autopilot_bing_queries",
    "Top Bing / Copilot search queries from Bing Webmaster Tools. Returns status:'not_configured' until API credentials are set.",
    {
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      limit: z.number().int().positive().max(500).optional(),
    },
    async (args) => {
      return TEXT(await withAudit(ctx, "autopilot_bing_queries", args, async () => {
        const conn = await db
          .select()
          .from(schema.oauthConnections)
          .where(and(
            eq(schema.oauthConnections.provider, "bing_webmaster"),
            eq(schema.oauthConnections.status, "active"),
          ))
          .limit(1);
        if (conn.length === 0) {
          return {
            status: "not_configured",
            message: "Add your Bing Webmaster API key to enable this tool.",
            setupPath: "/crm/autopilot#connect-bing",
          };
        }
        return {
          status: "pending_implementation",
          note: "Bing Webmaster ingest is not yet wired. Queries will appear here after the collector runs.",
        };
      }));
    },
  );
}
