import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { eq, desc, gte, and, sql, count } from "drizzle-orm";
import { db } from "./shared/db.js";
import * as schema from "../../shared/schema.js";

const server = new McpServer({
  name: "costa-brava-seo-engine",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// 1. seo_dashboard
// ---------------------------------------------------------------------------
server.tool(
  "seo_dashboard",
  "Get current SEO metrics overview: top keywords, positions, active campaigns, recent alerts",
  {},
  async () => {
    const topKeywords = await db
      .select()
      .from(schema.seoRankings)
      .innerJoin(schema.seoKeywords, eq(schema.seoRankings.keywordId, schema.seoKeywords.id))
      .orderBy(desc(schema.seoRankings.impressions))
      .limit(20);

    const activeCampaigns = await db
      .select()
      .from(schema.seoCampaigns)
      .where(eq(schema.seoCampaigns.status, "active"));

    const recentAlerts = await db
      .select()
      .from(schema.seoAlerts)
      .orderBy(desc(schema.seoAlerts.createdAt))
      .limit(5);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ topKeywords, activeCampaigns, recentAlerts }, null, 2),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 2. seo_keywords
// ---------------------------------------------------------------------------
server.tool(
  "seo_keywords",
  "Get keyword rankings with optional filters by cluster, position range, and limit",
  {
    cluster: z.string().optional().describe("Filter by keyword cluster"),
    minPosition: z.number().optional().describe("Minimum position (e.g., 1)"),
    maxPosition: z.number().optional().describe("Maximum position (e.g., 10)"),
    limit: z.number().optional().describe("Max results (default 50)"),
  },
  async ({ cluster, minPosition, maxPosition, limit }) => {
    const conditions = [];

    if (cluster) {
      conditions.push(eq(schema.seoKeywords.cluster, cluster));
    }
    if (minPosition !== undefined) {
      conditions.push(gte(schema.seoRankings.position, String(minPosition)));
    }
    if (maxPosition !== undefined) {
      conditions.push(
        sql`${schema.seoRankings.position} <= ${String(maxPosition)}`,
      );
    }

    const results = await db
      .select()
      .from(schema.seoKeywords)
      .innerJoin(schema.seoRankings, eq(schema.seoKeywords.id, schema.seoRankings.keywordId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.seoRankings.impressions))
      .limit(limit || 50);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: results.length, results }, null, 2),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 3. seo_competitors
// ---------------------------------------------------------------------------
server.tool(
  "seo_competitors",
  "Get competitor comparison report with their latest rankings",
  {},
  async () => {
    const competitors = await db.select().from(schema.seoCompetitors);
    const rankings = await db
      .select()
      .from(schema.seoCompetitorRankings)
      .innerJoin(
        schema.seoCompetitors,
        eq(schema.seoCompetitorRankings.competitorId, schema.seoCompetitors.id),
      )
      .innerJoin(
        schema.seoKeywords,
        eq(schema.seoCompetitorRankings.keywordId, schema.seoKeywords.id),
      )
      .orderBy(desc(schema.seoCompetitorRankings.date))
      .limit(100);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ competitors, rankings }, null, 2),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 4. seo_campaigns
// ---------------------------------------------------------------------------
server.tool(
  "seo_campaigns",
  "Get active campaigns with progress and results",
  {},
  async () => {
    const campaigns = await db
      .select()
      .from(schema.seoCampaigns)
      .orderBy(desc(schema.seoCampaigns.createdAt));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: campaigns.length, campaigns }, null, 2),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 5. seo_experiments
// ---------------------------------------------------------------------------
server.tool(
  "seo_experiments",
  "Get experiment history with results and learnings",
  {
    status: z
      .string()
      .optional()
      .describe("Filter by status: running, measuring, success, failure, inconclusive"),
    limit: z.number().optional().describe("Max results (default 20)"),
  },
  async ({ status, limit }) => {
    const conditions = [];
    if (status) {
      conditions.push(eq(schema.seoExperiments.status, status));
    }

    const experiments = await db
      .select()
      .from(schema.seoExperiments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.seoExperiments.executedAt))
      .limit(limit || 20);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: experiments.length, experiments }, null, 2),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 6. seo_geo_status
// ---------------------------------------------------------------------------
server.tool(
  "seo_geo_status",
  "Get AI citation status across engines (Perplexity, Google AI, ChatGPT)",
  {},
  async () => {
    const geoData = await db
      .select()
      .from(schema.seoGeo)
      .orderBy(desc(schema.seoGeo.date))
      .limit(50);

    const citedCount = geoData.filter((g) => g.cited).length;
    const totalChecks = geoData.length;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              summary: {
                totalChecks,
                cited: citedCount,
                citationRate: totalChecks > 0 ? (citedCount / totalChecks * 100).toFixed(1) + "%" : "N/A",
              },
              data: geoData,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 7. seo_revenue
// ---------------------------------------------------------------------------
server.tool(
  "seo_revenue",
  "Get revenue attribution by keyword from organic search conversions",
  {},
  async () => {
    const conversions = await db
      .select()
      .from(schema.seoConversions)
      .innerJoin(schema.seoKeywords, eq(schema.seoConversions.keywordId, schema.seoKeywords.id))
      .orderBy(desc(schema.seoConversions.revenue))
      .limit(50);

    const totalRevenue = conversions.reduce(
      (sum, c) => sum + Number(c.seo_conversions.revenue || 0),
      0,
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              totalRevenue: totalRevenue.toFixed(2),
              conversions: conversions.length,
              data: conversions,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// 8. seo_force_analysis
// ---------------------------------------------------------------------------
server.tool(
  "seo_force_analysis",
  "Trigger immediate SEO strategist analysis (runs Claude API call). Use sparingly - costs API tokens.",
  {},
  async () => {
    try {
      const { runDailyAnalysis } = await import("../seo/strategist/agent.js");
      const decisions = await runDailyAnalysis();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: true, decisions }, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error running analysis: ${message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// 9. seo_alerts
// ---------------------------------------------------------------------------
server.tool(
  "seo_alerts",
  "Get SEO alerts with optional status filter",
  {
    status: z
      .string()
      .optional()
      .describe("Filter by status: new, sent, acknowledged, resolved"),
  },
  async ({ status }) => {
    const conditions = [];
    if (status) {
      conditions.push(eq(schema.seoAlerts.status, status));
    }

    const alerts = await db
      .select()
      .from(schema.seoAlerts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.seoAlerts.createdAt))
      .limit(20);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: alerts.length, alerts }, null, 2),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Costa Brava SEO Engine MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
