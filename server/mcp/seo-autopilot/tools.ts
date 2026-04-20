/**
 * seo-autopilot MCP tool registrations.
 *
 * Tools are kept small, read-mostly, and backed by the existing storage layer
 * and SEO tables. Every call writes an entry to the audit log.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
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
}
