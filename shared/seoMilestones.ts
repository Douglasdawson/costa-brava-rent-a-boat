// shared/seoMilestones.ts
//
// Program milestones for the SEO/GEO autopilot: target-vs-actual goal tracking.
// The CRM already surfaces every raw KPI (rankings, GA4, AI citations,
// experiments) but NOT progress toward goals — this fills that gap.
//
// Milestones are config (not a DB table) so they're versioned with the code and
// need no migration. Targets here are SEASON SEED VALUES derived from the
// 2026 SEO roadmap — edit freely as the business sets real goals.

export type MilestoneMetric =
  | "ai_citation_rate" // % of AI-engine probes that cite us (higher better)
  | "top10_keywords" // # tracked keywords ranking in positions 1-10 (higher better)
  | "organic_clicks_30d" // GSC organic clicks, trailing 30d (higher better)
  | "organic_sessions_30d" // GA4 organic sessions, trailing 30d (higher better)
  | "avg_position"; // mean GSC position across tracked keywords (LOWER better)

/** gte = higher is better; lte = lower is better (e.g. search position). */
export type Comparison = "gte" | "lte";

export interface SeoMilestone {
  id: string;
  label: string; // ES — the CRM admin is Spanish-only (not i18n)
  metric: MilestoneMetric;
  target: number;
  comparison: Comparison;
  unit?: string;
  deadline: string; // YYYY-MM-DD
}

export type MilestoneStatus = "completed" | "on_track" | "at_risk";

export interface MilestoneScore {
  status: MilestoneStatus;
  progressPct: number; // 0-100, clamped
  current: number;
  daysLeft: number; // negative once the deadline has passed
}

// Seed milestones (2026 season). Edit targets/deadlines to match real goals.
export const SEO_MILESTONES: readonly SeoMilestone[] = [
  { id: "geo-citation-rate", label: "Tasa de cita en motores de IA ≥ 30%", metric: "ai_citation_rate", target: 30, comparison: "gte", unit: "%", deadline: "2026-08-31" },
  { id: "top10-keywords", label: "50+ keywords en el top 10 de Google", metric: "top10_keywords", target: 50, comparison: "gte", deadline: "2026-08-31" },
  { id: "organic-clicks", label: "1.500+ clics orgánicos / 30 días", metric: "organic_clicks_30d", target: 1500, comparison: "gte", deadline: "2026-08-31" },
  { id: "organic-sessions", label: "3.000+ sesiones orgánicas / 30 días", metric: "organic_sessions_30d", target: 3000, comparison: "gte", deadline: "2026-08-31" },
  { id: "avg-position", label: "Posición media ≤ 15", metric: "avg_position", target: 15, comparison: "lte", deadline: "2026-08-31" },
];

const DAY_MS = 86_400_000;

/**
 * Score a milestone against its current value. Pure + deterministic — `now` is
 * injected (caller passes Date.now()) so it's unit-testable.
 *
 * - completed: target met (direction-aware).
 * - at_risk:   deadline passed without completion, OR < 30 days left and < 60% progress.
 * - on_track:  everything else.
 */
export function scoreMilestone(
  m: SeoMilestone,
  current: number,
  now: number,
): MilestoneScore {
  const daysLeft = Math.ceil((new Date(m.deadline).getTime() - now) / DAY_MS);

  const met =
    m.comparison === "gte" ? current >= m.target : current > 0 && current <= m.target;

  // Progress toward target, direction-aware, clamped 0-100.
  let progressPct: number;
  if (met) {
    progressPct = 100;
  } else if (m.comparison === "gte") {
    progressPct = m.target > 0 ? (current / m.target) * 100 : 0;
  } else {
    // lower-is-better: closer current gets to (or below) target → higher %.
    progressPct = current > 0 ? (m.target / current) * 100 : 0;
  }
  progressPct = Math.max(0, Math.min(100, Math.round(progressPct)));

  let status: MilestoneStatus;
  if (met) {
    status = "completed";
  } else if (daysLeft < 0 || (daysLeft < 30 && progressPct < 60)) {
    status = "at_risk";
  } else {
    status = "on_track";
  }

  return { status, progressPct, current, daysLeft };
}
