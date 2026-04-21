// server/seo/collectors/psi.ts
//
// Collect PageSpeed Insights (Lighthouse + CrUX) per URL + strategy.
// Stores both field data (CrUX real-user metrics) and lab data (Lighthouse
// synthetic run) in psi_measurements.
//
// Run daily on a small set of critical URLs (homepage, fleet, top booking
// landing pages, top blog posts). Each URL × strategy is one API call.
// PSI is free, no key strictly required, but using GOOGLE_SERVICE_ACCOUNT key
// avoids quota issues.

import { db } from "../../db";
import { psiMeasurements, type InsertPsiMeasurement } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { config } from "../../config";

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export type PsiStrategy = "mobile" | "desktop";

export interface PsiUrlTarget {
  url: string;
  strategies?: PsiStrategy[]; // defaults to ["mobile", "desktop"]
}

function baseUrl(): string {
  return (config.BASE_URL || "https://www.costabravarentaboat.com").replace(/\/$/, "");
}

/**
 * Default set of URLs to track. Customise by passing `urls` to collectPsi.
 */
export function defaultTargets(): PsiUrlTarget[] {
  const b = baseUrl();
  return [
    { url: `${b}/` },
    { url: `${b}/blanes` },
    { url: `${b}/tossa-de-mar` },
    { url: `${b}/lloret-de-mar` },
    { url: `${b}/blog` },
    { url: `${b}/barcos-sin-licencia` },
    { url: `${b}/barcos-con-licencia` },
    { url: `${b}/excursion-privada` },
  ];
}

interface LighthouseAudit {
  score?: number | null;
  numericValue?: number;
  displayValue?: string;
}

interface PsiResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number };
      accessibility?: { score?: number };
      "best-practices"?: { score?: number };
      seo?: { score?: number };
    };
    audits?: Record<string, LighthouseAudit>;
  };
  loadingExperience?: {
    metrics?: Record<string, { percentile?: number; category?: string }>;
  };
  originLoadingExperience?: {
    metrics?: Record<string, { percentile?: number; category?: string }>;
  };
}

function toPercent(score: number | undefined | null): number | null {
  if (score == null) return null;
  return Math.round(score * 100);
}

function safeInt(v: number | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.round(v);
}

function safeReal(v: number | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return Number(v.toFixed(3));
}

async function runPsi(url: string, strategy: PsiStrategy): Promise<PsiResponse | null> {
  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance",
  });
  for (const cat of ["accessibility", "best-practices", "seo"]) {
    params.append("category", cat);
  }

  const resp = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`PSI ${resp.status}: ${body.slice(0, 400)}`);
  }
  return (await resp.json()) as PsiResponse;
}

function buildInsert(url: string, strategy: PsiStrategy, data: PsiResponse): InsertPsiMeasurement {
  const cats = data.lighthouseResult?.categories || {};
  const audits = data.lighthouseResult?.audits || {};
  const field = data.loadingExperience?.metrics || data.originLoadingExperience?.metrics || {};

  return {
    url,
    strategy,
    performanceScore: toPercent(cats.performance?.score),
    accessibilityScore: toPercent(cats.accessibility?.score),
    bestPracticesScore: toPercent(cats["best-practices"]?.score),
    seoScore: toPercent(cats.seo?.score),

    // Field data (CrUX 28-day rolling)
    lcpMs: safeInt(field.LARGEST_CONTENTFUL_PAINT_MS?.percentile),
    clsScore: safeReal(
      field.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null
        ? field.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
        : undefined,
    ),
    inpMs: safeInt(field.INTERACTION_TO_NEXT_PAINT?.percentile),
    ttfbMs: safeInt(field.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile),
    fcpMs: safeInt(field.FIRST_CONTENTFUL_PAINT_MS?.percentile),

    // Lab data (Lighthouse synthetic run)
    labLcpMs: safeInt(audits["largest-contentful-paint"]?.numericValue),
    labClsScore: safeReal(audits["cumulative-layout-shift"]?.numericValue),
    labTbtMs: safeInt(audits["total-blocking-time"]?.numericValue),
    labFcpMs: safeInt(audits["first-contentful-paint"]?.numericValue),
    labSiMs: safeInt(audits["speed-index"]?.numericValue),

    audits: {
      opportunities: Object.entries(audits)
        .filter(([, a]) => a.score != null && a.score < 0.9 && a.numericValue && a.numericValue > 0)
        .slice(0, 20)
        .map(([id, a]) => ({ id, score: a.score, displayValue: a.displayValue })),
    },
  };
}

export async function collectPsi(options?: {
  targets?: PsiUrlTarget[];
  delayMs?: number;
}): Promise<{ measurements: number; failures: number }> {
  const targets = options?.targets ?? defaultTargets();
  const delay = options?.delayMs ?? 1500;

  let measurements = 0;
  let failures = 0;

  for (const target of targets) {
    const strategies = target.strategies ?? ["mobile", "desktop"];
    for (const strategy of strategies) {
      try {
        const data = await runPsi(target.url, strategy);
        if (!data) {
          failures++;
          continue;
        }
        const row = buildInsert(target.url, strategy, data);
        await db.insert(psiMeasurements).values(row);
        measurements++;
        logger.info(`[SEO:PSI] ${strategy} ${target.url} score=${row.performanceScore}`);
      } catch (error) {
        failures++;
        logger.error(`[SEO:PSI] Failed ${strategy} ${target.url}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      // PSI allows ~120 req/min unauthenticated; be polite.
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    }
  }

  logger.info(`[SEO:PSI] Done. Measurements: ${measurements}, failures: ${failures}`);
  return { measurements, failures };
}
