import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({
  isEnabled: true,
  updateCalls: 0,
}));

vi.mock("../mcp/shared/db.js", () => {
  // Thenable chain: select().from().where().orderBy().limit() / select().from().limit()
  const rows = () =>
    Promise.resolve([{ id: "p1", title: "Draft", isEnabled: state.isEnabled }]);
  const chain: Record<string, unknown> = {};
  for (const m of ["from", "where", "orderBy", "limit"]) chain[m] = () => chain;
  chain.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => rows().then(res, rej);
  const updateChain = {
    set: () => ({
      where: () => {
        state.updateCalls++;
        return Promise.resolve();
      },
    }),
  };
  return { db: { select: () => chain, update: () => updateChain, insert: () => ({ values: () => ({ returning: rows }) }) } };
});
vi.mock("./blogTopicEngine.js", () => ({
  selectNextTopic: vi.fn(),
  findPostToRefresh: vi.fn(),
  generateTopicQueue: vi.fn(),
  SUPPORTED_LANGUAGES: [],
}));

import { publishNextDraft, buildBoatsInfo } from "./blogAutopilot";

describe("publishNextDraft gate", () => {
  beforeEach(() => {
    state.isEnabled = true;
    state.updateCalls = 0;
  });
  afterEach(() => {
    delete process.env.BLOG_AUTOPILOT_PUBLISH;
  });

  it("publishes nothing by default (env var unset)", async () => {
    expect(await publishNextDraft()).toBe(0);
    expect(state.updateCalls).toBe(0);
  });

  it("publishes nothing when config.is_enabled is false, even with the env var", async () => {
    process.env.BLOG_AUTOPILOT_PUBLISH = "1";
    state.isEnabled = false;
    expect(await publishNextDraft()).toBe(0);
    expect(state.updateCalls).toBe(0);
  });

  it("publishes when env var is 1 and config is enabled", async () => {
    process.env.BLOG_AUTOPILOT_PUBLISH = "1";
    expect(await publishNextDraft()).toBe(1);
    expect(state.updateCalls).toBe(1);
  });
});

describe("buildBoatsInfo (prompt context)", () => {
  const info = buildBoatsInfo(new Date("2026-11-24T10:00:00Z"));

  it("lists only publicly listed boats after 2026-10-01", () => {
    expect(info).toContain("/barco/mingolla-brava-19");
    expect(info).toContain("/barco/excursion-privada");
    expect(info).not.toContain("/barco/solar-450");
    expect(info).not.toContain("/barco/astec-400");
  });

  it("never promises licence-free rental or PER/PNB", () => {
    expect(info).not.toMatch(/sin licencia|PER\b|PNB/i);
    expect(info).toContain("Licencia de Navegacion");
  });

  it("excursion has captain and no fuel; licensed boats have no fuel", () => {
    for (const line of info.split("\n")) expect(line).toContain("gasolina NO incluida");
    expect(info.split("\n").find((l) => l.includes("excursion-privada"))).toContain("patron");
  });
});
