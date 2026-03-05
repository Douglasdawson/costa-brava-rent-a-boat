import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SENDGRID_BASE_URL = "https://api.sendgrid.com/v3";

function getApiKey(): string | undefined {
  return process.env.SENDGRID_API_KEY;
}

function authHeaders(): Record<string, string> {
  const key = getApiKey();
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function missingKeyResponse(): string {
  return JSON.stringify(
    {
      error: "SENDGRID_API_KEY is not set",
      message:
        "Please set the SENDGRID_API_KEY environment variable to use this tool. " +
        "You can find your API key in the SendGrid dashboard under Settings > API Keys.",
    },
    null,
    2
  );
}

async function sendgridGet(
  path: string,
  params?: Record<string, string>
): Promise<unknown> {
  const url = new URL(`${SENDGRID_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `SendGrid API error ${response.status}: ${body}`
    );
  }

  return response.json();
}

/** Format a Date as YYYY-MM-DD */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Calculate start_date and end_date based on a human-readable period */
function periodToDates(period: "today" | "week" | "month"): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = formatDate(now);

  let start: Date;
  switch (period) {
    case "today":
      start = new Date(now);
      break;
    case "week":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      break;
  }

  return { startDate: formatDate(start), endDate };
}

// ── Server Setup ──────────────────────────────────────────────────────

const server = new McpServer({
  name: "sendgrid",
  version: "1.0.0",
});

// ── Tool 1: get_email_activity ────────────────────────────────────────

server.tool(
  "get_email_activity",
  "Get recent email activity from SendGrid. Returns a list of recent messages with status, subject, and timestamps.",
  {
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(20)
      .describe("Number of messages to return (default 20, max 1000)"),
    email: z
      .string()
      .email()
      .optional()
      .describe("Filter by recipient email address"),
  },
  async ({ limit, email }) => {
    if (!getApiKey()) {
      return { content: [{ type: "text", text: missingKeyResponse() }] };
    }

    try {
      const params: Record<string, string> = {
        limit: String(limit),
      };

      // The /v3/messages endpoint uses query parameter "to_email" for filtering
      if (email) {
        params.query = `to_email="${email}"`;
      }

      const data = await sendgridGet("/messages", params);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: "Failed to fetch email activity", details: message },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// ── Tool 2: get_email_stats ───────────────────────────────────────────

server.tool(
  "get_email_stats",
  "Get email sending statistics for a given period. Returns metrics: requests, delivered, bounces, opens, clicks, and spam reports.",
  {
    period: z
      .enum(["today", "week", "month"])
      .describe("Time period for statistics: today, week, or month"),
  },
  async ({ period }) => {
    if (!getApiKey()) {
      return { content: [{ type: "text", text: missingKeyResponse() }] };
    }

    try {
      const { startDate, endDate } = periodToDates(period);

      const data = (await sendgridGet("/stats", {
        start_date: startDate,
        end_date: endDate,
      })) as Array<{
        date: string;
        stats: Array<{
          metrics: {
            requests: number;
            delivered: number;
            bounces: number;
            opens: number;
            clicks: number;
            spam_reports: number;
          };
        }>;
      }>;

      // Aggregate metrics across all days in the period
      const totals = {
        period,
        startDate,
        endDate,
        requests: 0,
        delivered: 0,
        bounces: 0,
        opens: 0,
        clicks: 0,
        spam_reports: 0,
      };

      if (Array.isArray(data)) {
        for (const day of data) {
          for (const stat of day.stats) {
            totals.requests += stat.metrics.requests ?? 0;
            totals.delivered += stat.metrics.delivered ?? 0;
            totals.bounces += stat.metrics.bounces ?? 0;
            totals.opens += stat.metrics.opens ?? 0;
            totals.clicks += stat.metrics.clicks ?? 0;
            totals.spam_reports += stat.metrics.spam_reports ?? 0;
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { summary: totals, daily: data },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: "Failed to fetch email stats", details: message },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// ── Tool 3: search_emails ─────────────────────────────────────────────

server.tool(
  "search_emails",
  "Search emails by recipient address. Returns matching messages with delivery status, subject, and timestamps.",
  {
    email: z
      .string()
      .email()
      .describe("Recipient email address to search for"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(10)
      .describe("Number of results to return (default 10, max 1000)"),
  },
  async ({ email, limit }) => {
    if (!getApiKey()) {
      return { content: [{ type: "text", text: missingKeyResponse() }] };
    }

    try {
      const data = await sendgridGet("/messages", {
        query: `to_email="${email}"`,
        limit: String(limit),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: "Failed to search emails", details: message },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// ── Tool 4: get_bounces ───────────────────────────────────────────────

server.tool(
  "get_bounces",
  "Get bounced emails from SendGrid suppression list. Returns email addresses that have bounced along with bounce reason and timestamp.",
  {
    startDate: z
      .string()
      .optional()
      .describe(
        "ISO 8601 date string to filter bounces from (e.g. 2025-01-01). If omitted, returns all bounces."
      ),
  },
  async ({ startDate }) => {
    if (!getApiKey()) {
      return { content: [{ type: "text", text: missingKeyResponse() }] };
    }

    try {
      const params: Record<string, string> = {};

      if (startDate) {
        // SendGrid expects Unix timestamp for start_time
        const ts = Math.floor(new Date(startDate).getTime() / 1000);
        if (isNaN(ts)) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Invalid date format",
                    message:
                      "Please provide a valid ISO 8601 date string, e.g. 2025-01-01",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
        params.start_time = String(ts);
      }

      const data = await sendgridGet("/suppression/bounces", params);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { error: "Failed to fetch bounces", details: message },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// ── Start Server ──────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SendGrid MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting SendGrid MCP server:", error);
  process.exit(1);
});
