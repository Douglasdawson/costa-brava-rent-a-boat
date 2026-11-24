/**
 * RFC 9309: a crawler obeys only the most specific group that names it and ignores "*".
 * The AI crawler groups used to say just "Allow: /", which silently lifted every Disallow of "*"
 * (/crm, /admin, /api/, ...) for GPTBot, ClaudeBot and the rest. Each group must repeat them.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("./storage", () => ({
  storage: new Proxy({}, { get: () => async () => [] }),
  shopRepo: new Proxy({}, { get: () => async () => [] }),
}));
vi.mock("./db", () => ({ db: { select: () => { throw new Error("no db in tests"); } }, pool: {} }));
vi.mock("./lib/businessStatsCache", () => ({
  getCurrentStats: () => ({ rating: 4.8, userRatingCount: 300, reviews: [] }),
  getCurrentRating: () => 4.8,
  getCurrentReviewCount: () => 300,
}));

import express from "express";
import request from "supertest";
import { registerRobotsRoutes, DISALLOWED_PATHS, AI_ALLOWED_API_PATHS } from "./routes/robots";
import { AI_CRAWLER_NAMES } from "./seo/constants";

async function robots(): Promise<string> {
  const a = express();
  registerRobotsRoutes(a);
  const r = await request(a).get("/robots.txt");
  expect(r.status).toBe(200);
  return r.text;
}

function groups(body: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const block of body.split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    const agents = lines.filter((l) => /^User-agent:/i.test(l)).map((l) => l.replace(/^User-agent:\s*/i, ""));
    for (const agent of agents) out.set(agent, lines.filter((l) => !/^User-agent:/i.test(l)));
  }
  return out;
}

describe("/robots.txt", () => {
  it.each(AI_CRAWLER_NAMES)("%s repeats every Disallow of the * group", async (bot) => {
    const g = groups(await robots());
    const group = g.get(bot);
    expect(group, `group for ${bot}`).toBeDefined();
    expect(group).toContain("Allow: /");
    for (const p of DISALLOWED_PATHS) expect(group, `${bot} ${p}`).toContain(`Disallow: ${p}`);
    for (const p of AI_ALLOWED_API_PATHS) expect(group, `${bot} ${p}`).toContain(`Allow: ${p}`);
  });

  it("the AI groups add no Disallow beyond the * group", async () => {
    const g = groups(await robots());
    const star = new Set(g.get("*")!.filter((l) => l.startsWith("Disallow:")));
    for (const bot of AI_CRAWLER_NAMES) {
      for (const l of g.get(bot)!.filter((x) => x.startsWith("Disallow:"))) expect(star.has(l), `${bot} ${l}`).toBe(true);
    }
  });

  it("announces the sitemap once and points to llms.txt", async () => {
    const body = await robots();
    expect(body.match(/^Sitemap:/gm)).toHaveLength(1);
    expect(body).toMatch(/# llms\.txt: \S*\/llms\.txt/);
  });
});
