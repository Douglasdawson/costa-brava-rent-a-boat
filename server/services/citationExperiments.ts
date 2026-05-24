/**
 * Citation A/B testing framework.
 *
 * Sits on top of T1.3's AI Mentions Monitor. Each experiment defines a set
 * of `variants` for a single `target` (e.g. the llms.txt intro paragraph,
 * the /api/ai-context disambiguatingDescription). Variants are assigned
 * deterministically per probe so the citation_rate delta is interpretable:
 *
 *   variant_id = sha1(experimentId + prompt.id + dateBucket)
 *
 * (dateBucket = day-of-year, so a single 24h window is consistent across
 * engines — re-running the monitor twice the same day picks the same
 * variant.)
 *
 * Stats: a simple two-proportion z-test per variant pair, threshold
 * p < 0.05, minimum 100 probes per variant × 14 day window. Below those
 * thresholds we surface "more data needed" instead of declaring a winner.
 */

import { db } from "../db";
import { citationExperiments, aiMentions, type CitationExperiment, type InsertCitationExperiment } from "../../shared/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import crypto from "crypto";

export interface Variant {
  id: string;
  label: string;
  content: string;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listExperiments(): Promise<CitationExperiment[]> {
  return await db.select().from(citationExperiments).orderBy(desc(citationExperiments.createdAt));
}

export async function getActiveExperimentForTarget(target: string): Promise<CitationExperiment | null> {
  const rows = await db
    .select()
    .from(citationExperiments)
    .where(and(eq(citationExperiments.target, target), eq(citationExperiments.status, "running")))
    .orderBy(desc(citationExperiments.startedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function createExperiment(input: {
  name: string;
  hypothesis?: string;
  target: string;
  variants: Variant[];
  startImmediately?: boolean;
}): Promise<CitationExperiment> {
  if (input.variants.length < 2) {
    throw new Error("An experiment needs at least 2 variants (use 'control' + one alternative).");
  }
  const insert: InsertCitationExperiment = {
    name: input.name,
    hypothesis: input.hypothesis ?? null,
    target: input.target,
    variants: input.variants,
    status: input.startImmediately ? "running" : "draft",
    startedAt: input.startImmediately ? new Date() : null,
  };
  const [row] = await db.insert(citationExperiments).values(insert).returning();
  return row;
}

export async function startExperiment(id: number): Promise<CitationExperiment | null> {
  const [row] = await db
    .update(citationExperiments)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(citationExperiments.id, id))
    .returning();
  return row ?? null;
}

export async function endExperiment(id: number, status: "completed" | "cancelled" = "completed"): Promise<CitationExperiment | null> {
  const [row] = await db
    .update(citationExperiments)
    .set({ status, endedAt: new Date() })
    .where(eq(citationExperiments.id, id))
    .returning();
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Deterministic variant assignment
// ---------------------------------------------------------------------------

function dateBucket(d = new Date()): string {
  // YYYY-DDD (day of year) — consistent within a single UTC day.
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = d.getTime() - start;
  const dayOfYear = Math.floor(diff / 86_400_000);
  return `${d.getUTCFullYear()}-${dayOfYear}`;
}

export function assignVariant(experimentId: number, key: string, variants: Variant[]): Variant {
  if (variants.length === 0) throw new Error("No variants to assign");
  if (variants.length === 1) return variants[0];
  const hash = crypto.createHash("sha1").update(`${experimentId}:${key}:${dateBucket()}`).digest();
  const bucket = hash.readUInt32BE(0) % variants.length;
  return variants[bucket];
}

/**
 * Resolve the content to serve for a given target. Returns the active
 * experiment's chosen variant when one exists, otherwise the supplied
 * fallback. Use `key` to distinguish multiple "axes" of variant
 * assignment (e.g. one variant per prompt id in the monitor).
 */
export async function resolveVariantContent(target: string, key: string, fallback: string): Promise<{
  content: string;
  variantId: string | null;
  experimentId: number | null;
}> {
  try {
    const exp = await getActiveExperimentForTarget(target);
    if (!exp) return { content: fallback, variantId: null, experimentId: null };
    const variants = exp.variants as Variant[];
    const v = assignVariant(exp.id, key, variants);
    return { content: v.content, variantId: v.id, experimentId: exp.id };
  } catch (err) {
    logger.warn("[citation-experiments] resolveVariantContent fallback", {
      error: err instanceof Error ? err.message : String(err),
      target,
    });
    return { content: fallback, variantId: null, experimentId: null };
  }
}

// ---------------------------------------------------------------------------
// Stats — per-variant citation rate within the experiment window
// ---------------------------------------------------------------------------

interface VariantResult {
  variantId: string;
  totalProbes: number;
  citations: number;
  citationRate: number;
  /** 95% Wilson confidence interval (lower, upper). */
  ciLower: number;
  ciUpper: number;
}

interface ExperimentResults {
  experiment: CitationExperiment;
  results: VariantResult[];
  pairwise: Array<{ a: string; b: string; zScore: number; pValue: number; winner: string | null }>;
  recommendation: string;
}

function wilsonInterval(p: number, n: number, z = 1.96): { lower: number; upper: number } {
  if (n === 0) return { lower: 0, upper: 0 };
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const radius = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { lower: Math.max(0, center - radius), upper: Math.min(1, center + radius) };
}

function twoProportionZ(s1: number, n1: number, s2: number, n2: number): number {
  if (n1 === 0 || n2 === 0) return 0;
  const p1 = s1 / n1;
  const p2 = s2 / n2;
  const pPool = (s1 + s2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return 0;
  return (p1 - p2) / se;
}

function zToTwoSidedPValue(z: number): number {
  // erf approximation (Abramowitz & Stegun 7.1.26) — accurate to 1e-7
  const x = Math.abs(z) / Math.sqrt(2);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  const oneSided = 0.5 * (1 - erf);
  return 2 * oneSided;
}

export async function getExperimentResults(id: number): Promise<ExperimentResults | null> {
  const [exp] = await db.select().from(citationExperiments).where(eq(citationExperiments.id, id));
  if (!exp) return null;
  const variants = exp.variants as Variant[];
  const since = exp.startedAt ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      variantId: aiMentions.variantId,
      totalProbes: sql<number>`count(*) filter (where ${aiMentions.errorMessage} is null)::int`.as("totalProbes"),
      citations: sql<number>`count(*) filter (where ${aiMentions.citedUs} = true)::int`.as("citations"),
    })
    .from(aiMentions)
    .where(gte(aiMentions.ranAt, since))
    .groupBy(aiMentions.variantId);

  const byId = new Map(rows.map((r) => [r.variantId ?? "", r]));
  const results: VariantResult[] = variants.map((v) => {
    const row = byId.get(v.id);
    const totalProbes = row?.totalProbes ?? 0;
    const citations = row?.citations ?? 0;
    const rate = totalProbes > 0 ? citations / totalProbes : 0;
    const ci = wilsonInterval(rate, totalProbes);
    return { variantId: v.id, totalProbes, citations, citationRate: rate, ciLower: ci.lower, ciUpper: ci.upper };
  });

  // Pairwise comparisons — only meaningful when both variants have ≥100 probes
  const pairwise: ExperimentResults["pairwise"] = [];
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const a = results[i];
      const b = results[j];
      const z = twoProportionZ(a.citations, a.totalProbes, b.citations, b.totalProbes);
      const p = zToTwoSidedPValue(z);
      const sigSampleOk = a.totalProbes >= 100 && b.totalProbes >= 100;
      const winner = sigSampleOk && p < 0.05 ? (a.citationRate > b.citationRate ? a.variantId : b.variantId) : null;
      pairwise.push({ a: a.variantId, b: b.variantId, zScore: z, pValue: p, winner });
    }
  }

  // Recommendation: pick the variant that beat every other at p<0.05; else
  // surface "needs more data" with the count short of 100 per variant.
  let recommendation = "Insufficient data — keep collecting (target ≥100 probes per variant × 14 days).";
  if (results.every((r) => r.totalProbes >= 100)) {
    const winner = results.reduce((best, cur) => (cur.citationRate > best.citationRate ? cur : best));
    const beatsAll = pairwise
      .filter((p) => p.a === winner.variantId || p.b === winner.variantId)
      .every((p) => p.winner === winner.variantId);
    if (beatsAll) {
      recommendation = `Promote variant '${winner.variantId}' (citation rate ${(winner.citationRate * 100).toFixed(1)}%, beats all alternatives at p<0.05).`;
    } else {
      recommendation = "Sample size sufficient but no statistically significant winner. Consider running longer or rewriting variants further apart.";
    }
  }

  return { experiment: exp, results, pairwise, recommendation };
}
