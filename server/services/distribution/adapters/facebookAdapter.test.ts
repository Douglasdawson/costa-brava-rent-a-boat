import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { facebookAdapter } from "./facebookAdapter";
import type { DistributionTrayItem } from "@shared/schema";

vi.mock("../../../lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const baseItem: DistributionTrayItem = {
  id: 1,
  slug: "test-post",
  platform: "facebook",
  language: "es",
  title: "Hola Costa Brava",
  content: "Texto del post",
  targetUrl: "https://example.com/post",
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

describe("facebookAdapter", () => {
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
    delete process.env.FACEBOOK_PAGE_ID;
    delete process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    const result = await facebookAdapter.publish(baseItem);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(503);
    expect(result.error).toMatch(/FACEBOOK_PAGE_/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to Graph API and returns publishedUrl on success", async () => {
    process.env.FACEBOOK_PAGE_ID = "1234567890";
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN = "fake-token";

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "1234567890_999", post_id: "1234567890_999" }),
    });

    const result = await facebookAdapter.publish(baseItem);

    expect(result.ok).toBe(true);
    expect(result.publishedUrl).toBe("https://www.facebook.com/1234567890_999");

    const [calledUrl, calledInit] = fetchMock.mock.calls[0];
    expect(calledUrl).toContain("/v21.0/1234567890/feed");
    expect((calledInit as RequestInit).method).toBe("POST");

    const body = (calledInit as { body: URLSearchParams }).body;
    expect(body.toString()).toContain("message=");
    expect(body.toString()).toContain("access_token=fake-token");
  });

  it("returns failure when Graph API returns an error", async () => {
    process.env.FACEBOOK_PAGE_ID = "1234567890";
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN = "fake-token";

    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: "Invalid token" } }),
    });

    const result = await facebookAdapter.publish(baseItem);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.error).toBe("Invalid token");
  });

  it("returns 502 when network throws", async () => {
    process.env.FACEBOOK_PAGE_ID = "1234567890";
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN = "fake-token";

    fetchMock.mockRejectedValue(new Error("ENOTFOUND"));

    const result = await facebookAdapter.publish(baseItem);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(502);
    expect(result.error).toBe("ENOTFOUND");
  });
});
