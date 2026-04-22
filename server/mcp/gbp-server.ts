/**
 * Google Business Profile MCP server.
 *
 * Exposes the cached GBP stats (rating, review count, recent reviews) as MCP
 * tools so Claude Code can consult the live values when editing copy/schemas
 * without hitting Google Places API directly.
 *
 * Data source: `business_stats` singleton table, refreshed weekly by
 * server/services/gbpSync.ts via Places API (New).
 *
 * Tools:
 *   - get_business_stats: rating, count, last sync, business info
 *   - get_recent_reviews: up to 5 most recent reviews with author + text
 *   - check_last_sync: freshness diagnostic (when was last sync, is stale?)
 *   - force_sync: trigger a fresh Places API call (uses billed API quota)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { db } from "./shared/db";
import * as schema from "../../shared/schema";
import {
  BUSINESS_RATING,
  BUSINESS_REVIEW_COUNT,
} from "../../shared/businessProfile";

const server = new McpServer({
  name: "cbrb-gbp",
  version: "1.0.0",
});

async function getStatsRow() {
  const rows = await db.select().from(schema.businessStats).limit(1);
  return rows[0] ?? null;
}

function formatStaleness(lastSyncedAt: Date | null): {
  ageHours: number;
  isStale: boolean;
  freshness: "fresh" | "ok" | "stale" | "very_stale" | "unknown";
} {
  if (!lastSyncedAt) {
    return { ageHours: -1, isStale: true, freshness: "unknown" };
  }
  const ageMs = Date.now() - new Date(lastSyncedAt).getTime();
  const ageHours = Math.round(ageMs / (1000 * 60 * 60));
  let freshness: "fresh" | "ok" | "stale" | "very_stale";
  if (ageHours < 24) freshness = "fresh";
  else if (ageHours < 7 * 24) freshness = "ok";
  else if (ageHours < 30 * 24) freshness = "stale";
  else freshness = "very_stale";
  return { ageHours, isStale: ageHours > 7 * 24, freshness };
}

// ---------------------------------------------------------------------------
// 1. get_business_stats
// ---------------------------------------------------------------------------

server.tool(
  "get_business_stats",
  "Get the current Google Business Profile stats (rating, review count, business info, last sync). Use this when editing copy or schemas to ensure consistency with the actual GMB values.",
  {},
  async () => {
    const row = await getStatsRow();
    if (!row) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "no_data",
                fallback: { rating: BUSINESS_RATING, userRatingCount: BUSINESS_REVIEW_COUNT },
                message: "No DB row yet. Run force_sync to populate.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
    const staleness = formatStaleness(row.lastSyncedAt);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              rating: row.rating,
              userRatingCount: row.userRatingCount,
              displayName: row.displayName,
              phone: row.internationalPhoneNumber,
              website: row.websiteUri,
              hours: row.weekdayHours,
              placeId: row.placeId,
              lastSyncedAt: row.lastSyncedAt,
              staleness,
              syncSource: row.syncSource,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 2. get_recent_reviews
// ---------------------------------------------------------------------------

server.tool(
  "get_recent_reviews",
  "Get the most recent Google Business Profile reviews (up to 5, from last weekly sync). Useful for content ideas, FAQ inspiration, or when responding to common feedback themes.",
  {
    limit: z.number().int().min(1).max(5).optional().describe("Max reviews to return (1-5)"),
  },
  async ({ limit = 5 }) => {
    const row = await getStatsRow();
    if (!row || !Array.isArray(row.recentReviews)) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ status: "no_data", reviews: [] }, null, 2),
          },
        ],
      };
    }
    const reviews = (row.recentReviews as Array<Record<string, unknown>>).slice(0, limit);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              total: reviews.length,
              lastSyncedAt: row.lastSyncedAt,
              reviews,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 3. check_last_sync
// ---------------------------------------------------------------------------

server.tool(
  "check_last_sync",
  "Diagnostic check: when was the last successful Places API sync, and is the cache stale? Cache is considered stale after 7 days (weekly cron).",
  {},
  async () => {
    const row = await getStatsRow();
    if (!row) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "no_data",
                recommendation: "Run force_sync tool to populate initial data.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
    const staleness = formatStaleness(row.lastSyncedAt);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              lastSyncedAt: row.lastSyncedAt,
              staleness,
              recommendation: staleness.isStale
                ? "Stale — consider running force_sync (or wait for next weekly cron)."
                : "Fresh — no action needed.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// 4. force_sync
// ---------------------------------------------------------------------------

server.tool(
  "force_sync",
  "Force an immediate sync from Google Places API. Uses billed API quota (~$0.005 per call). Only use when needed (after key rotation, after GBP info changes, or when data looks stale).",
  {},
  async () => {
    // Dynamic import so MCP server doesn't pull the whole gbpSync chain at startup
    const { syncGbpStats } = await import("../services/gbpSync");
    const result = await syncGbpStats();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CBRB GBP MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
