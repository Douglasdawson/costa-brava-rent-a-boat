/**
 * AI Mentions Monitor — nightly job that probes the 4 major answer engines
 * with our curated prompt set and records every response so we can measure
 * citation_rate (% of answers where we appear), share-of-voice vs competitors,
 * and sentiment.
 *
 * Engines:
 *   - chatgpt    → OpenAI Responses API with web_search tool
 *   - claude     → Anthropic Messages API with web_search server tool
 *   - perplexity → Perplexity Chat Completions (online model, returns citations)
 *   - gemini     → Google Generative AI with google_search grounding
 *
 * Each engine call is wrapped to gracefully degrade when the API key is
 * missing — the corresponding prompts simply don't run. Cost reference (Dec
 * 2026 prices): ~$0.003-0.005 per prompt across all engines combined.
 *
 * Sentiment classification uses a small Anthropic Haiku call (1 token output)
 * per non-error response. Skipped if ANTHROPIC_API_KEY is missing.
 *
 * Cron from server/services/schedulerService.ts.
 */

import { db } from "../db";
import { aiMentions, type InsertAiMention } from "../../shared/schema";
import { logger } from "../lib/logger";
import {
  ALL_PROMPTS,
  COMPETITORS,
  OUR_BRAND_ALIASES,
  type MonitorPrompt,
  type PromptLang,
} from "./aiMentionsPrompts";

const OUR_DOMAIN = "costabravarentaboat.com";

type EngineId = "chatgpt" | "claude" | "perplexity" | "gemini";

interface EngineResponse {
  text: string;
  citations?: string[];        // URLs surfaced by the engine
  tokensUsed?: number;
  model?: string;
}

// ---------------------------------------------------------------------------
// Detection — given a response text and the engine's surfaced citations,
// determine whether we were cited and which competitors were mentioned.
// ---------------------------------------------------------------------------
function detectCitations(text: string, citations: string[] | undefined): {
  citedUs: boolean;
  citationUrl: string | null;
  competitorsMentioned: string[];
} {
  const lower = text.toLowerCase();

  let citedUs = false;
  let citationUrl: string | null = null;

  // Domain match in any citation URL is the strongest signal.
  if (citations) {
    for (const c of citations) {
      const lc = c.toLowerCase();
      if (lc.includes(OUR_DOMAIN)) {
        citedUs = true;
        citationUrl = c;
        break;
      }
    }
  }
  // Fallback: brand-name substring in the answer body. Less reliable but
  // catches engines that don't surface citations explicitly (or surface them
  // hidden inside footnotes the SDK doesn't expose).
  if (!citedUs) {
    for (const alias of OUR_BRAND_ALIASES) {
      if (lower.includes(alias)) {
        citedUs = true;
        break;
      }
    }
  }

  const competitorsMentioned: string[] = [];
  for (const comp of COMPETITORS) {
    if (comp.aliases.some((a) => lower.includes(a))) {
      competitorsMentioned.push(comp.canonical);
    }
  }

  return { citedUs, citationUrl, competitorsMentioned };
}

// ---------------------------------------------------------------------------
// Engine adapters — each returns EngineResponse or throws.
// Missing API key → throws "MISSING_API_KEY", caller catches and skips.
// ---------------------------------------------------------------------------

async function callChatGpt(prompt: MonitorPrompt): Promise<EngineResponse> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("MISSING_API_KEY");
  // gpt-4o-search-preview is OpenAI's GA web-search model as of late 2026.
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-search-preview",
      web_search_options: {},
      messages: [{ role: "user", content: prompt.text }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  // OpenAI surfaces citations inside annotations on each message.
  const annotations = data.choices?.[0]?.message?.annotations ?? [];
  const citations = annotations
    .filter((a: { type?: string; url_citation?: { url?: string } }) => a.type === "url_citation")
    .map((a: { url_citation?: { url?: string } }) => a.url_citation?.url)
    .filter((u: string | undefined): u is string => !!u);
  return {
    text,
    citations,
    tokensUsed: data.usage?.total_tokens,
    model: data.model ?? "gpt-4o-search-preview",
  };
}

async function callClaude(prompt: MonitorPrompt): Promise<EngineResponse> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("MISSING_API_KEY");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      messages: [{ role: "user", content: prompt.text }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  // Collect text from all text blocks; citations may be embedded as web_search
  // result blocks or as `citations` arrays on text blocks.
  let text = "";
  const citations: string[] = [];
  for (const block of data.content ?? []) {
    if (block.type === "text") {
      text += block.text;
      for (const c of block.citations ?? []) {
        if (c.url) citations.push(c.url);
      }
    } else if (block.type === "web_search_tool_result") {
      for (const r of block.content ?? []) {
        if (r.url) citations.push(r.url);
      }
    }
  }
  return {
    text,
    citations,
    tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    model: data.model ?? "claude-sonnet-4-6",
  };
}

async function callPerplexity(prompt: MonitorPrompt): Promise<EngineResponse> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error("MISSING_API_KEY");
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt.text }],
      return_citations: true,
    }),
  });
  if (!res.ok) throw new Error(`Perplexity HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    citations: data.citations ?? [],
    tokensUsed: data.usage?.total_tokens,
    model: data.model ?? "sonar-pro",
  };
}

async function callGemini(prompt: MonitorPrompt): Promise<EngineResponse> {
  const key = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key) throw new Error("MISSING_API_KEY");
  const model = "gemini-2.5-pro";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt.text }] }],
        tools: [{ google_search: {} }],
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text: string = (candidate?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("");
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const citations: string[] = groundingChunks
    .map((c: { web?: { uri?: string } }) => c.web?.uri)
    .filter((u: string | undefined): u is string => !!u);
  return {
    text,
    citations,
    tokensUsed: data.usageMetadata?.totalTokenCount,
    model,
  };
}

const ENGINES: Record<EngineId, (p: MonitorPrompt) => Promise<EngineResponse>> = {
  chatgpt: callChatGpt,
  claude: callClaude,
  perplexity: callPerplexity,
  gemini: callGemini,
};

// ---------------------------------------------------------------------------
// Sentiment classifier — Claude Haiku, 1 token decision.
// Returns null on error so it never blocks a monitor run.
// ---------------------------------------------------------------------------
async function classifySentiment(
  prompt: string,
  response: string,
): Promise<"positive" | "neutral" | "negative" | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !response.trim()) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4,
        messages: [
          {
            role: "user",
            content: `Question: ${prompt}\n\nAnswer: ${response.slice(0, 2000)}\n\nClassify the answer's tone toward "Costa Brava Rent a Boat" or the wider Blanes boat-rental market. Reply with EXACTLY one word: positive, neutral, or negative.`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = (data.content?.[0]?.text ?? "").trim().toLowerCase();
    if (raw.startsWith("pos")) return "positive";
    if (raw.startsWith("neg")) return "negative";
    return "neutral";
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Single (engine, prompt) probe → DB row.
// ---------------------------------------------------------------------------
async function probeOne(
  engine: EngineId,
  prompt: MonitorPrompt,
  variantId: string | null,
): Promise<void> {
  const started = Date.now();
  const adapter = ENGINES[engine];
  const row: InsertAiMention = {
    engine,
    prompt: prompt.text,
    promptCategory: prompt.category,
    promptLang: prompt.lang,
    citedUs: false,
    variantId: variantId ?? null,
  };
  try {
    const res = await adapter(prompt);
    const det = detectCitations(res.text, res.citations);
    row.model = res.model;
    row.responseText = res.text;
    row.citedUs = det.citedUs;
    row.citationUrl = det.citationUrl;
    row.competitorsMentioned = det.competitorsMentioned;
    row.tokensUsed = res.tokensUsed;
    row.latencyMs = Date.now() - started;
    row.sentiment = await classifySentiment(prompt.text, res.text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    row.errorMessage = msg;
    row.latencyMs = Date.now() - started;
    if (msg !== "MISSING_API_KEY") {
      logger.warn("[ai-mentions] probe failed", { engine, promptId: prompt.id, error: msg });
    }
  }
  try {
    await db.insert(aiMentions).values(row);
  } catch (dbErr) {
    logger.error("[ai-mentions] insert failed", {
      error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      engine,
      promptId: prompt.id,
    });
  }
}

// ---------------------------------------------------------------------------
// Public entry point — call from cron once a night.
// ---------------------------------------------------------------------------
export interface MonitorRunOptions {
  /** Restrict to a subset of engines (default: all 4). */
  engines?: EngineId[];
  /** Restrict to a subset of languages. */
  langs?: PromptLang[];
  /** Maximum prompts per engine (defensive cap). */
  maxPromptsPerEngine?: number;
  /** Active A/B variant id, if any. Persisted on each row for T3.3 analysis. */
  variantId?: string | null;
}

export async function runNightlyMonitor(opts: MonitorRunOptions = {}): Promise<{
  totalRuns: number;
  byEngine: Record<string, number>;
  activeExperiments: number;
  durationMs: number;
}> {
  const started = Date.now();
  const engines: EngineId[] = opts.engines ?? ["chatgpt", "claude", "perplexity", "gemini"];
  const prompts = ALL_PROMPTS.filter((p) => !opts.langs || opts.langs.includes(p.lang));
  const perEngineCap = opts.maxPromptsPerEngine ?? prompts.length;
  const counts: Record<string, number> = {};

  // Discover active citation A/B experiments. For each (prompt, engine) we
  // assign a variant deterministically so the citation_rate delta is
  // attributable. Multiple experiments can run in parallel for different
  // targets; we stamp the first matching variantId on the row.
  let assignVariantFn: ((promptId: string) => string | null) | null = null;
  try {
    const { getActiveExperimentForTarget, assignVariant } = await import("./citationExperiments");
    // The "monitor" target is a meta-target that simply tags every probe so
    // we can A/B test e.g. llms.txt variants by toggling them server-side.
    const exp = await getActiveExperimentForTarget("llms_txt_intro");
    if (exp) {
      const variants = exp.variants as Array<{ id: string; label: string; content: string }>;
      assignVariantFn = (promptId: string) => {
        try {
          return assignVariant(exp.id, promptId, variants).id;
        } catch {
          return null;
        }
      };
      logger.info("[ai-mentions] active experiment detected", { experimentId: exp.id, name: exp.name, variants: variants.length });
    }
  } catch (err) {
    logger.warn("[ai-mentions] experiment lookup failed (continuing without variants)", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Run engines concurrently, but probes within an engine sequentially to
  // respect per-API rate limits. Failures inside probeOne are swallowed so
  // a single engine outage never aborts the whole nightly run.
  await Promise.all(
    engines.map(async (engine) => {
      counts[engine] = 0;
      const slice = prompts.slice(0, perEngineCap);
      for (const p of slice) {
        const variantId = opts.variantId ?? assignVariantFn?.(p.id) ?? null;
        await probeOne(engine, p, variantId);
        counts[engine]++;
      }
    }),
  );

  const totalRuns = Object.values(counts).reduce((s, n) => s + n, 0);
  const durationMs = Date.now() - started;
  const activeExperiments = assignVariantFn ? 1 : 0;
  logger.info("[ai-mentions] nightly monitor complete", { totalRuns, byEngine: counts, activeExperiments, durationMs });
  return { totalRuns, byEngine: counts, activeExperiments, durationMs };
}
