import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mediumAdapter } from "./mediumAdapter";
import type { DistributionTrayItem } from "@shared/schema";

vi.mock("../../../lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const baseItem: DistributionTrayItem = {
  id: 11,
  slug: "guia-blanes",
  platform: "medium",
  language: "es",
  title: "Guía de Blanes",
  content: "## Introducción\n\nBlanes es...",
  targetUrl: "https://costabravarentaboat.com/blog/guia-blanes",
  contactEmail: null,
  metadata: null,
  status: "pending",
  scheduledFor: null,
  publishedAt: null,
  publishedUrl: null,
  failureReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("mediumAdapter", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("returns 503 when env vars missing", async () => {
    delete process.env.MEDIUM_INTEGRATION_TOKEN;
    delete process.env.MEDIUM_USER_ID;

    const result = await mediumAdapter.publish(baseItem);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(503);
    expect(result.error).toMatch(/MEDIUM_/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a published story and returns its URL", async () => {
    process.env.MEDIUM_INTEGRATION_TOKEN = "med-token";
    process.env.MEDIUM_USER_ID = "user-abc";

    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: "post-xyz", url: "https://medium.com/@cbrb/post-xyz" } }),
    });

    const result = await mediumAdapter.publish(baseItem);

    expect(result.ok).toBe(true);
    expect(result.publishedUrl).toBe("https://medium.com/@cbrb/post-xyz");

    const [calledUrl, calledInit] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain("/v1/users/user-abc/posts");
    const init = calledInit as RequestInit & { body: string };
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer med-token");

    const body = JSON.parse(init.body);
    expect(body.title).toBe("Guía de Blanes");
    expect(body.contentFormat).toBe("markdown");
    expect(body.publishStatus).toBe("public");
    expect(body.canonicalUrl).toBe("https://costabravarentaboat.com/blog/guia-blanes");
  });

  it("returns failure on Medium error response", async () => {
    process.env.MEDIUM_INTEGRATION_TOKEN = "med-token";
    process.env.MEDIUM_USER_ID = "user-abc";

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ errors: [{ message: "Token rejected", code: 6000 }] }),
    });

    const result = await mediumAdapter.publish(baseItem);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.error).toBe("Token rejected");
  });
});
