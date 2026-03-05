/**
 * Twilio MCP Server
 *
 * Standalone MCP server that wraps the Twilio REST API to query
 * WhatsApp message logs and delivery statistics.
 *
 * Runs as a separate process using stdio transport.
 * Requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Twilio API helpers
// ---------------------------------------------------------------------------

function getCredentials(): { accountSid: string; authToken: string } {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Missing Twilio credentials. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
    );
  }

  if (!accountSid.startsWith("AC")) {
    throw new Error("Invalid TWILIO_ACCOUNT_SID: must start with 'AC'.");
  }

  return { accountSid, authToken };
}

function buildBaseUrl(accountSid: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
}

function buildAuthHeader(accountSid: string, authToken: string): string {
  const encoded = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  return `Basic ${encoded}`;
}

interface TwilioRequestOptions {
  path: string;
  params?: Record<string, string>;
}

async function twilioGet(options: TwilioRequestOptions): Promise<unknown> {
  const { accountSid, authToken } = getCredentials();
  const baseUrl = buildBaseUrl(accountSid);

  const url = new URL(`${baseUrl}${options.path}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: buildAuthHeader(accountSid, authToken),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Twilio API error ${response.status}: ${body}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function getWhatsAppNumber(): string {
  return process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
}

function formatPhone(raw: string): string {
  return raw.replace("whatsapp:", "");
}

interface TwilioMessage {
  sid: string;
  from: string;
  to: string;
  body: string;
  status: string;
  date_sent: string | null;
  date_created: string;
  direction: string;
  price: string | null;
  price_unit: string | null;
  error_code: number | null;
  error_message: string | null;
  num_segments: string;
}

function formatMessage(msg: TwilioMessage) {
  return {
    sid: msg.sid,
    from: formatPhone(msg.from),
    to: formatPhone(msg.to),
    body: msg.body,
    status: msg.status,
    dateSent: msg.date_sent || msg.date_created,
    direction: msg.direction,
    price: msg.price ? `${msg.price} ${msg.price_unit || "USD"}` : null,
    errorCode: msg.error_code,
    errorMessage: msg.error_message,
  };
}

function getDateRange(period: "today" | "week" | "month"): {
  dateFrom: string;
  dateTo: string;
} {
  const now = new Date();
  const dateTo = new Date(now);
  dateTo.setDate(dateTo.getDate() + 1); // inclusive upper bound

  let dateFrom: Date;
  switch (period) {
    case "today":
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 7);
      break;
    case "month":
      dateFrom = new Date(now);
      dateFrom.setMonth(dateFrom.getMonth() - 1);
      break;
  }

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { dateFrom: fmt(dateFrom), dateTo: fmt(dateTo) };
}

// ---------------------------------------------------------------------------
// Tool: helper to return text content
// ---------------------------------------------------------------------------

function textResult(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(message: string): { content: Array<{ type: "text"; text: string }>; isError: true } {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: message }, null, 2),
      },
    ],
    isError: true,
  };
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "twilio-whatsapp",
  version: "1.0.0",
});

// 1. get_recent_messages
server.tool(
  "get_recent_messages",
  "Get recent WhatsApp messages. Optionally filter by direction (inbound/outbound) and limit the number of results.",
  {
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Number of messages to retrieve (1-100, default 20)"),
    direction: z
      .enum(["inbound", "outbound"])
      .optional()
      .describe("Filter by message direction: inbound or outbound"),
  },
  async ({ limit, direction }) => {
    try {
      const whatsappFrom = getWhatsAppNumber();
      const params: Record<string, string> = {
        PageSize: String(limit),
      };

      if (direction === "outbound") {
        params["From"] = whatsappFrom;
      } else if (direction === "inbound") {
        params["To"] = whatsappFrom;
      }

      const data = (await twilioGet({
        path: "/Messages.json",
        params,
      })) as { messages: TwilioMessage[] };

      const messages = (data.messages || []).map(formatMessage);

      return textResult({
        total: messages.length,
        direction: direction || "all",
        messages,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResult(message);
    }
  }
);

// 2. get_message_status
server.tool(
  "get_message_status",
  "Get the detailed status of a specific Twilio message by its SID.",
  {
    messageSid: z
      .string()
      .startsWith("SM")
      .describe("The Twilio message SID (starts with SM)"),
  },
  async ({ messageSid }) => {
    try {
      const msg = (await twilioGet({
        path: `/Messages/${messageSid}.json`,
      })) as TwilioMessage;

      return textResult(formatMessage(msg));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResult(message);
    }
  }
);

// 3. search_messages
server.tool(
  "search_messages",
  "Search WhatsApp messages by phone number. Searches both inbound and outbound messages for the given number and combines the results.",
  {
    phoneNumber: z
      .string()
      .describe(
        "Phone number to search for (E.164 format, e.g. +34611500372). The whatsapp: prefix is added automatically."
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Max messages per direction (1-100, default 20)"),
  },
  async ({ phoneNumber, limit }) => {
    try {
      const normalized = phoneNumber.startsWith("whatsapp:")
        ? phoneNumber
        : `whatsapp:${phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`}`;

      // Fetch messages sent FROM and TO this number in parallel
      const [fromData, toData] = (await Promise.all([
        twilioGet({
          path: "/Messages.json",
          params: { From: normalized, PageSize: String(limit) },
        }),
        twilioGet({
          path: "/Messages.json",
          params: { To: normalized, PageSize: String(limit) },
        }),
      ])) as [{ messages: TwilioMessage[] }, { messages: TwilioMessage[] }];

      const fromMessages = (fromData.messages || []).map(formatMessage);
      const toMessages = (toData.messages || []).map(formatMessage);

      // Deduplicate by SID and sort by date descending
      const seen = new Set<string>();
      const combined = [...fromMessages, ...toMessages].filter((m) => {
        if (seen.has(m.sid)) return false;
        seen.add(m.sid);
        return true;
      });

      combined.sort(
        (a, b) =>
          new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime()
      );

      return textResult({
        phoneNumber: formatPhone(normalized),
        total: combined.length,
        messages: combined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResult(message);
    }
  }
);

// 4. get_delivery_stats
server.tool(
  "get_delivery_stats",
  "Get WhatsApp message delivery statistics for a given period (today, week, or month). Returns counts grouped by status and direction.",
  {
    period: z
      .enum(["today", "week", "month"])
      .describe("Time period for statistics: today, week, or month"),
  },
  async ({ period }) => {
    try {
      const { dateFrom, dateTo } = getDateRange(period);

      // Twilio paginates at max 1000. We fetch up to 1000 per page and follow
      // next_page_uri to gather all messages in the period.
      const allMessages: TwilioMessage[] = [];
      let path: string | null = "/Messages.json";
      const baseParams: Record<string, string> = {
        "DateSent>": dateFrom,
        "DateSent<": dateTo,
        PageSize: "1000",
      };

      // First request uses params; subsequent ones use next_page_uri directly
      let isFirstPage = true;

      while (path) {
        let data: { messages: TwilioMessage[]; next_page_uri: string | null };

        if (isFirstPage) {
          data = (await twilioGet({ path, params: baseParams })) as typeof data;
          isFirstPage = false;
        } else {
          // next_page_uri is a full path from Twilio, but we need to call it
          // against the base API URL. It already includes the account prefix.
          const { accountSid, authToken } = getCredentials();
          const url = `https://api.twilio.com${path}`;
          const response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: buildAuthHeader(accountSid, authToken),
              Accept: "application/json",
            },
          });
          if (!response.ok) {
            break;
          }
          data = (await response.json()) as typeof data;
        }

        allMessages.push(...(data.messages || []));
        path = data.next_page_uri || null;

        // Safety: cap at 10 pages (10,000 messages) to avoid runaway pagination
        if (allMessages.length >= 10000) break;
      }

      // Aggregate stats
      const statusCounts: Record<string, number> = {};
      const directionCounts: Record<string, number> = {};
      let totalPrice = 0;
      let priceUnit = "USD";

      for (const msg of allMessages) {
        statusCounts[msg.status] = (statusCounts[msg.status] || 0) + 1;
        directionCounts[msg.direction] =
          (directionCounts[msg.direction] || 0) + 1;
        if (msg.price) {
          totalPrice += Math.abs(parseFloat(msg.price));
          if (msg.price_unit) priceUnit = msg.price_unit;
        }
      }

      return textResult({
        period,
        dateRange: { from: dateFrom, to: dateTo },
        totalMessages: allMessages.length,
        byStatus: statusCounts,
        byDirection: directionCounts,
        estimatedCost: `${totalPrice.toFixed(4)} ${priceUnit}`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResult(message);
    }
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[twilio-mcp] Server running on stdio");
}

main().catch((err) => {
  console.error("[twilio-mcp] Fatal error:", err);
  process.exit(1);
});
