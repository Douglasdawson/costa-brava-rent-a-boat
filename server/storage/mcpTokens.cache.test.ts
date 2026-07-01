import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  __resetTokenCache,
  __cacheStats,
  __cachePut,
  __cacheGet,
} from "./mcpTokens";
import type { McpToken } from "./base";

describe("mcp token cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetTokenCache();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns cached row within TTL", () => {
    const row = { id: 1 } as McpToken;
    __cachePut("hash-a", row);
    expect(__cacheGet("hash-a")).toBe(row);
  });

  it("expires after 60s", () => {
    __cachePut("hash-a", { id: 1 } as McpToken);
    vi.advanceTimersByTime(61_000);
    expect(__cacheGet("hash-a")).toBeUndefined();
  });

  it("caches null (negative result) so unknown tokens dont hit DB", () => {
    __cachePut("hash-bad", null);
    expect(__cacheGet("hash-bad")).toBeNull();
  });

  it("evicts oldest when over capacity", () => {
    for (let i = 0; i < 600; i++) {
      __cachePut(`h${i}`, { id: i } as McpToken);
    }
    expect(__cacheStats().size).toBeLessThanOrEqual(512);
    expect(__cacheGet("h0")).toBeUndefined();
  });
});
