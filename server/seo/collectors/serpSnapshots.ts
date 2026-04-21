// server/seo/collectors/serpSnapshots.ts
//
// Persist a full top-20 SERP snapshot per tracked keyword per day. Unlike
// collectors/serp.ts (which only tracks our own position + competitor positions),
// this captures EVERY competing result so the war-room can answer:
//   - "who showed up in the local pack for 'alquiler barco blanes'?"
//   - "what new domains entered the top 10 this week?"
//   - "what AI-overview sources are cited for our target queries?"
//
// Data source: ValueSERP by default. Adapter interface so DataForSEO can
// be swapped in later without changing callers.

import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { logger } from "../../lib/logger";
import {
  seoKeywords,
  serpSnapshots,
  type InsertSerpSnapshot,
} from "../../../shared/schema";
import { SEO_CONFIG } from "../config";
import { valueSerpBreaker } from "../../lib/circuitBreaker";

const OWN_DOMAIN_SUBSTRING = "costabravarentaboat";
const DEFAULT_LOCATION = "Girona,Catalonia,Spain";
const DEFAULT_LANGUAGE = "es";
const DEFAULT_RESULT_LIMIT = 20;

interface ValueSerpOrganicResult {
  position: number;
  link: string;
  title?: string;
  snippet?: string;
  domain?: string;
}

interface ValueSerpApiResponse {
  organic_results?: ValueSerpOrganicResult[];
  local_results?: Array<{ position?: number; title?: string; link?: string; domain?: string; address?: string }>;
  related_questions?: Array<{ question: string }>;
  ai_overview?: Record<string, unknown>;
  knowledge_graph?: Record<string, unknown>;
  inline_images?: Array<Record<string, unknown>>;
  inline_videos?: Array<Record<string, unknown>>;
}

function extractDomain(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isOwn(domain: string): boolean {
  return domain.toLowerCase().includes(OWN_DOMAIN_SUBSTRING);
}

async function fetchValueSerp(
  keyword: string,
  location: string,
  language: string,
): Promise<ValueSerpApiResponse | null> {
  const apiKey = SEO_CONFIG.valueSerpApiKey;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    api_key: apiKey,
    q: keyword,
    location,
    gl: "es",
    hl: language,
    num: String(DEFAULT_RESULT_LIMIT),
    include_ai_overview: "true",
  });

  try {
    return await valueSerpBreaker.call(async () => {
      const resp = await fetch(`https://api.valueserp.com/search?${params}`);
      if (!resp.ok) throw new Error(`ValueSERP ${resp.status}`);
      return (await resp.json()) as ValueSerpApiResponse;
    });
  } catch (error) {
    logger.error("[SEO:SERPSnap] ValueSERP request failed", {
      keyword,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function buildRows(
  keywordId: number,
  date: string,
  location: string,
  language: string,
  data: ValueSerpApiResponse,
): InsertSerpSnapshot[] {
  const rows: InsertSerpSnapshot[] = [];

  // Organic results
  const organic = data.organic_results || [];
  for (const r of organic.slice(0, DEFAULT_RESULT_LIMIT)) {
    if (!r.link || r.position == null) continue;
    const domain = r.domain || extractDomain(r.link);
    rows.push({
      keywordId,
      date,
      searchEngine: "google",
      location,
      language,
      position: r.position,
      url: r.link,
      title: r.title || null,
      description: r.snippet || null,
      domain: domain || null,
      resultType: "organic",
      isOwn: isOwn(domain),
      metadata: null,
    });
  }

  // Local pack
  const locals = data.local_results || [];
  locals.slice(0, 3).forEach((lr, idx) => {
    const domain = extractDomain(lr.link || "");
    rows.push({
      keywordId,
      date,
      searchEngine: "google",
      location,
      language,
      position: idx + 1,
      url: lr.link || "",
      title: lr.title || null,
      description: null,
      domain: domain || null,
      resultType: "local_pack",
      isOwn: isOwn((lr.title || "") + " " + domain),
      metadata: { address: lr.address || null },
    });
  });

  // Featured snippet / AI overview markers
  if (data.ai_overview) {
    const citations = (data.ai_overview as { sources?: Array<{ link?: string; title?: string }> }).sources || [];
    citations.slice(0, 10).forEach((src, idx) => {
      if (!src.link) return;
      const domain = extractDomain(src.link);
      rows.push({
        keywordId,
        date,
        searchEngine: "google",
        location,
        language,
        position: idx + 1,
        url: src.link,
        title: src.title || null,
        description: null,
        domain: domain || null,
        resultType: "ai_overview",
        isOwn: isOwn(domain),
        metadata: null,
      });
    });
  }

  // People Also Ask (keyword-level, no url)
  const paa = data.related_questions || [];
  paa.slice(0, 8).forEach((q, idx) => {
    rows.push({
      keywordId,
      date,
      searchEngine: "google",
      location,
      language,
      position: idx + 1,
      url: `paa:${q.question}`,
      title: q.question,
      description: null,
      domain: null,
      resultType: "people_also_ask",
      isOwn: false,
      metadata: null,
    });
  });

  return rows;
}

export async function collectSerpSnapshots(options?: {
  location?: string;
  language?: string;
  maxKeywords?: number;
  delayMs?: number;
}): Promise<{ keywordsTracked: number; rowsWritten: number; failures: number }> {
  const location = options?.location ?? DEFAULT_LOCATION;
  const language = options?.language ?? DEFAULT_LANGUAGE;
  const maxKeywords = options?.maxKeywords ?? SEO_CONFIG.maxSerpQueriesPerDay;
  const delay = options?.delayMs ?? 2000;

  const keywords = await db
    .select({ id: seoKeywords.id, keyword: seoKeywords.keyword })
    .from(seoKeywords)
    .where(eq(seoKeywords.tracked, true))
    .limit(maxKeywords);

  if (keywords.length === 0) {
    logger.info("[SEO:SERPSnap] no tracked keywords");
    return { keywordsTracked: 0, rowsWritten: 0, failures: 0 };
  }

  const today = new Date().toISOString().split("T")[0];
  let rowsWritten = 0;
  let failures = 0;
  let tracked = 0;

  for (const kw of keywords) {
    const data = await fetchValueSerp(kw.keyword, location, language);
    if (!data) {
      failures++;
      continue;
    }

    const rows = buildRows(kw.id, today, location, language, data);
    if (rows.length === 0) continue;

    try {
      // No unique constraint on serp_snapshots (multiple result_types per position
      // are legitimate). Clear today's rows for this keyword first, then insert.
      await db.transaction(async (tx) => {
        await tx
          .delete(serpSnapshots)
          .where(
            and(
              eq(serpSnapshots.keywordId, kw.id),
              eq(serpSnapshots.date, today),
            ),
          );
        await tx.insert(serpSnapshots).values(rows);
      });
      rowsWritten += rows.length;
      tracked++;
    } catch (error) {
      failures++;
      logger.error("[SEO:SERPSnap] insert failed", {
        keyword: kw.keyword,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  }

  logger.info(`[SEO:SERPSnap] Tracked ${tracked}/${keywords.length} keywords, ${rowsWritten} rows, ${failures} failures`);
  return { keywordsTracked: tracked, rowsWritten, failures };
}
