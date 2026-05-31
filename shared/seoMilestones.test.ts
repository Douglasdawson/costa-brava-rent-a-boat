import { describe, it, expect } from "vitest";
import { scoreMilestone, SEO_MILESTONES, type SeoMilestone } from "./seoMilestones";

const NOW = Date.parse("2026-06-01T00:00:00Z");
const FAR = "2026-08-31"; // ~91 days out
const NEAR = "2026-06-10"; // ~9 days out
const PAST = "2026-05-01"; // already passed

const gte = (target: number, deadline: string): SeoMilestone => ({
  id: "t", label: "t", metric: "top10_keywords", target, comparison: "gte", deadline,
});
const lte = (target: number, deadline: string): SeoMilestone => ({
  id: "p", label: "p", metric: "avg_position", target, comparison: "lte", deadline,
});

describe("scoreMilestone", () => {
  it("higher-is-better: target met → completed at 100%", () => {
    const s = scoreMilestone(gte(50, FAR), 55, NOW);
    expect(s.status).toBe("completed");
    expect(s.progressPct).toBe(100);
  });

  it("higher-is-better: partial progress with time left → on_track", () => {
    const s = scoreMilestone(gte(50, FAR), 30, NOW); // 60%
    expect(s.status).toBe("on_track");
    expect(s.progressPct).toBe(60);
  });

  it("at_risk when the deadline has passed without completion", () => {
    const s = scoreMilestone(gte(50, PAST), 40, NOW);
    expect(s.status).toBe("at_risk");
    expect(s.daysLeft).toBeLessThan(0);
  });

  it("at_risk when close to deadline with low progress", () => {
    const s = scoreMilestone(gte(50, NEAR), 10, NOW); // 20%, ~9 days left
    expect(s.status).toBe("at_risk");
  });

  it("lower-is-better: at or below target → completed", () => {
    expect(scoreMilestone(lte(15, FAR), 12, NOW).status).toBe("completed");
    expect(scoreMilestone(lte(15, FAR), 15, NOW).status).toBe("completed");
  });

  it("lower-is-better: no data (current 0) is not a false completion", () => {
    const s = scoreMilestone(lte(15, FAR), 0, NOW);
    expect(s.status).not.toBe("completed");
    expect(s.progressPct).toBe(0);
  });

  it("clamps progress to 0-100", () => {
    const s = scoreMilestone(gte(50, FAR), 49, NOW);
    expect(s.progressPct).toBeGreaterThanOrEqual(0);
    expect(s.progressPct).toBeLessThanOrEqual(100);
  });

  it("ships seed milestones with valid shape", () => {
    expect(SEO_MILESTONES.length).toBeGreaterThan(0);
    for (const m of SEO_MILESTONES) {
      expect(m.id && m.label && m.metric && m.deadline).toBeTruthy();
      expect(["gte", "lte"]).toContain(m.comparison);
    }
  });
});
