import { describe, it, expect } from "vitest";
import {
  evaluateThinContent,
  isThinGuardExempt,
  MIN_SESSIONS_TO_JUDGE,
  MAX_BOUNCE_PERCENT,
  MIN_AVG_DURATION_SECONDS,
  type EngagementMetrics,
} from "./thinContentGuard";

const base: EngagementMetrics = {
  sessions: MIN_SESSIONS_TO_JUDGE + 20,
  engagedSessions: MIN_SESSIONS_TO_JUDGE,
  bouncePercent: 40,
  avgSessionDurationSeconds: 60,
};

describe("evaluateThinContent", () => {
  it("never noindexes when metrics are missing", () => {
    expect(evaluateThinContent(null).noindex).toBe(false);
  });

  it("never noindexes below the minimum-sessions threshold (not enough signal)", () => {
    const m: EngagementMetrics = {
      sessions: MIN_SESSIONS_TO_JUDGE - 1,
      engagedSessions: 0,
      bouncePercent: 100, // terrible, but not enough traffic to judge
      avgSessionDurationSeconds: 1,
    };
    expect(evaluateThinContent(m).noindex).toBe(false);
  });

  it("noindexes a high-bounce page with enough traffic", () => {
    const m = { ...base, bouncePercent: MAX_BOUNCE_PERCENT + 5 };
    const r = evaluateThinContent(m);
    expect(r.noindex).toBe(true);
    expect(r.reason).toContain("bounce");
  });

  it("noindexes a page where users barely stay", () => {
    const m = { ...base, avgSessionDurationSeconds: MIN_AVG_DURATION_SECONDS - 1 };
    const r = evaluateThinContent(m);
    expect(r.noindex).toBe(true);
    expect(r.reason).toContain("avg");
  });

  it("keeps a healthy, well-trafficked page indexable", () => {
    expect(evaluateThinContent(base).noindex).toBe(false);
  });

  it("treats the thresholds as strict boundaries (exactly at limit = keep)", () => {
    expect(evaluateThinContent({ ...base, bouncePercent: MAX_BOUNCE_PERCENT }).noindex).toBe(false);
    expect(evaluateThinContent({ ...base, avgSessionDurationSeconds: MIN_AVG_DURATION_SECONDS }).noindex).toBe(false);
  });
});

describe("isThinGuardExempt — money pages are never auto-noindexed", () => {
  it("exempts the home and core money metaKeys", () => {
    expect(isThinGuardExempt("/")).toBe(true);
    expect(isThinGuardExempt("/barcos")).toBe(true);
    expect(isThinGuardExempt("/barcos-sin-licencia")).toBe(true);
    expect(isThinGuardExempt("/barcos-con-licencia")).toBe(true);
    expect(isThinGuardExempt("/precios")).toBe(true);
  });

  it("exempts all location landings and boat detail pages by prefix", () => {
    expect(isThinGuardExempt("/alquiler-barcos-blanes")).toBe(true);
    expect(isThinGuardExempt("/alquiler-barcos-malgrat-de-mar")).toBe(true);
    expect(isThinGuardExempt("/barco/solar-450")).toBe(true);
  });

  it("does NOT exempt long-tail / programmatic pages (the guard's real target)", () => {
    expect(isThinGuardExempt("/blog/algun-post")).toBe(false);
    expect(isThinGuardExempt("/destinos/cala-sant-francesc")).toBe(false);
    expect(isThinGuardExempt("/faq")).toBe(false);
  });
});
