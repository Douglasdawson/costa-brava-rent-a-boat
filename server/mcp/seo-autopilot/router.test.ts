import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../storage/mcpTokens", () => ({
  validateMcpToken: vi.fn(async (raw: string) =>
    raw === "good" ? ({ id: 42 } as unknown) : null,
  ),
  recordTokenUsage: vi.fn(async () => undefined),
}));

vi.mock("./tools", () => ({
  registerAutopilotTools: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => {
  class McpServer {
    async connect(): Promise<void> {}
    async close(): Promise<void> {}
  }
  return { McpServer };
});

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => {
  class StreamableHTTPServerTransport {
    constructor(_opts: unknown) {}
    async handleRequest(_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }, body: { id?: number }): Promise<void> {
      res.status(200).json({ jsonrpc: "2.0", id: body?.id ?? null, result: "ok" });
    }
    async close(): Promise<void> {}
  }
  return { StreamableHTTPServerTransport };
});

import { createSeoAutopilotRouter } from "./router";

function makeApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/mcp", createSeoAutopilotRouter());
  return app;
}

describe("seo-autopilot rate limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("limits the same token to 60 req/min regardless of IP", async () => {
    const app = makeApp();
    let last = 0;
    for (let i = 0; i < 65; i++) {
      const r = await request(app)
        .post("/mcp")
        .set("Authorization", "Bearer good")
        .set("X-Forwarded-For", `10.0.0.${i}`)
        .send({ jsonrpc: "2.0", id: i, method: "ping" });
      last = r.status;
      if (r.status === 429) break;
    }
    expect(last).toBe(429);
  });
});
