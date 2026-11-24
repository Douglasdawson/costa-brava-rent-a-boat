import { describe, it, expect, vi } from "vitest";

const posts = vi.hoisted(() => ({
  pub: { slug: "pub", isPublished: true, publishedAt: new Date("2026-01-01") },
  draft: { slug: "draft", isPublished: false, publishedAt: null },
  future: { slug: "future", isPublished: true, publishedAt: new Date("2999-01-01") },
}));

vi.mock("../storage", () => ({
  storage: {
    getBlogPostBySlug: async (slug: string) => (posts as Record<string, unknown>)[slug],
  },
}));
vi.mock("./auth", () => ({
  requireAdminSession: (_q: unknown, _r: unknown, n: () => void) => n(),
  requireTabAccess: () => (_q: unknown, _r: unknown, n: () => void) => n(),
}));
vi.mock("../services/blogNotifier", () => ({ notifySubscribersOfNewPost: vi.fn() }));
vi.mock("../seo/indexnow", () => ({ notifyIndexNow: vi.fn() }));
vi.mock("../services/blogAutopilot", () => ({ fetchUnsplashImage: vi.fn() }));

import express from "express";
import request from "supertest";
import { registerBlogRoutes } from "./blog";

const app = express();
registerBlogRoutes(app);

describe("GET /api/blog/:slug", () => {
  it("serves a published post", async () => {
    expect((await request(app).get("/api/blog/pub")).status).toBe(200);
  });
  it("404s drafts, scheduled posts and unknown slugs", async () => {
    for (const slug of ["draft", "future", "nope"]) {
      expect((await request(app).get(`/api/blog/${slug}`)).status).toBe(404);
    }
  });
});
