import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { gbpAdapter } from "./gbpAdapter";
import type { DistributionTrayItem } from "@shared/schema";

vi.mock("../../../lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const getOAuthConnectionMock = vi.fn();
const markOAuthErrorMock = vi.fn();
vi.mock("../../../storage", () => ({
  oauthConnectionsRepo: {
    getOAuthConnection: (...args: unknown[]) => getOAuthConnectionMock(...args),
    markOAuthError: (...args: unknown[]) => markOAuthErrorMock(...args),
  },
}));

const baseItem: DistributionTrayItem = {
  id: 31,
  slug: "gbp-update",
  platform: "google_business",
  language: "es",
  title: "Novedad",
  content: "Estamos abiertos para la temporada",
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

describe("gbpAdapter", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    getOAuthConnectionMock.mockReset();
    markOAuthErrorMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 503 when GBP not connected", async () => {
    getOAuthConnectionMock.mockResolvedValue(undefined);

    const result = await gbpAdapter.publish(baseItem);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(503);
    expect(result.error).toMatch(/not connected/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("publishes a localPost when token present", async () => {
    getOAuthConnectionMock.mockResolvedValue({
      id: 5,
      provider: "gbp",
      accessToken: "google-token",
      accountIdentifier: "accounts/abc/locations/xyz",
      status: "active",
    });

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ name: "accounts/abc/locations/xyz/localPosts/post1", searchUrl: "https://posts.gle/abc" }),
    });

    const result = await gbpAdapter.publish(baseItem);

    expect(result.ok).toBe(true);
    expect(result.publishedUrl).toBe("https://posts.gle/abc");

    const [calledUrl, calledInit] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("https://mybusiness.googleapis.com/v4/accounts/abc/locations/xyz/localPosts");
    const init = calledInit as RequestInit & { body: string };
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer google-token");

    const body = JSON.parse(init.body);
    expect(body.languageCode).toBe("es");
    expect(body.summary).toContain("Estamos abiertos para la temporada");
    expect(body.callToAction).toEqual({ actionType: "LEARN_MORE", url: "https://costabravarentaboat.com" });
  });

  it("marks token expired on 401 from GBP", async () => {
    getOAuthConnectionMock.mockResolvedValue({
      id: 5,
      provider: "gbp",
      accessToken: "google-token",
      accountIdentifier: "accounts/abc/locations/xyz",
      status: "active",
    });

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "Auth expired" } }),
    });

    const result = await gbpAdapter.publish(baseItem);

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(markOAuthErrorMock).toHaveBeenCalledWith(5, "Auth expired", "expired");
  });
});
