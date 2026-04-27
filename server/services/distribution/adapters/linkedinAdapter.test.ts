import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { linkedinAdapter } from "./linkedinAdapter";
import type { DistributionTrayItem } from "@shared/schema";

vi.mock("../../../lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const getOAuthConnectionMock = vi.fn();
vi.mock("../../../storage", () => ({
  oauthConnectionsRepo: {
    getOAuthConnection: (...args: unknown[]) => getOAuthConnectionMock(...args),
  },
}));

const baseItem: DistributionTrayItem = {
  id: 21,
  slug: "linkedin-post",
  platform: "linkedin",
  language: "en",
  title: null,
  content: "Looking forward to the season!",
  targetUrl: "https://costabravarentaboat.com",
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

describe("linkedinAdapter", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    getOAuthConnectionMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("returns 503 when no OAuth connection nor env fallback", async () => {
    getOAuthConnectionMock.mockResolvedValue(undefined);
    delete process.env.LINKEDIN_ACCESS_TOKEN;
    delete process.env.LINKEDIN_ORG_ID;

    const result = await linkedinAdapter.publish(baseItem);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses oauth_connections token when available", async () => {
    getOAuthConnectionMock.mockResolvedValue({
      id: 1,
      provider: "linkedin_org",
      accessToken: "oauth-token",
      accountIdentifier: "98765",
      status: "active",
    });

    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: (h: string) => (h === "x-restli-id" ? "urn:li:share:7000" : null) },
      json: async () => ({}),
    });

    const result = await linkedinAdapter.publish(baseItem);

    expect(result.ok).toBe(true);
    expect(result.publishedUrl).toContain("urn%3Ali%3Ashare%3A7000");

    const [calledUrl, calledInit] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("https://api.linkedin.com/v2/ugcPosts");
    const init = calledInit as RequestInit & { body: string };
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer oauth-token");

    const body = JSON.parse(init.body);
    expect(body.author).toBe("urn:li:organization:98765");
    expect(body.lifecycleState).toBe("PUBLISHED");
    expect(body.specificContent["com.linkedin.ugc.ShareContent"].shareCommentary.text).toContain("Looking forward to the season!");
  });

  it("falls back to env vars when no oauth row exists", async () => {
    getOAuthConnectionMock.mockResolvedValue(undefined);
    process.env.LINKEDIN_ACCESS_TOKEN = "env-token";
    process.env.LINKEDIN_ORG_ID = "11111";

    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: () => "urn:li:share:9999" },
      json: async () => ({}),
    });

    const result = await linkedinAdapter.publish(baseItem);

    expect(result.ok).toBe(true);
    const init = fetchMock.mock.calls[0][1] as RequestInit & { body: string };
    expect(JSON.parse(init.body).author).toBe("urn:li:organization:11111");
  });

  it("returns failure on 401 from LinkedIn", async () => {
    getOAuthConnectionMock.mockResolvedValue({
      id: 1,
      provider: "linkedin_org",
      accessToken: "oauth-token",
      accountIdentifier: "98765",
      status: "active",
    });

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => null },
      json: async () => ({ message: "Token expired" }),
    });

    const result = await linkedinAdapter.publish(baseItem);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.error).toBe("Token expired");
  });
});
