// server/seo/executors/faq.ts
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../db";
import { seoFaqs } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { SEO_CONFIG } from "../config";
import { SUPPORTED_LANGUAGES, type LangCode } from "../../../shared/seoConstants";

const client = new Anthropic();

const LANG_NAMES: Record<LangCode, string> = {
  es: "Spanish",
  en: "English",
  ca: "Catalan",
  fr: "French",
  de: "German",
  nl: "Dutch",
  it: "Italian",
  ru: "Russian",
};

/** Target locales = every supported language except the Spanish source. */
const TARGET_LANGS = SUPPORTED_LANGUAGES.filter((l) => l !== "es") as LangCode[];

interface Translated {
  question: string;
  answer: string;
}

/**
 * Translate an ES FAQ into the 7 non-ES locales in a single model call.
 * Returns a partial map; on any failure (or no API key) returns {} so the
 * caller still persists the Spanish row — parity with the previous ES-only
 * behaviour, never worse.
 */
async function translateFaq(
  question: string,
  answer: string,
): Promise<Partial<Record<LangCode, Translated>>> {
  if (!SEO_CONFIG.anthropicApiKey) {
    logger.warn("[SEO:FAQ] No Anthropic API key — storing ES only, skipping translation");
    return {};
  }

  const targets = TARGET_LANGS.map((l) => `${l} (${LANG_NAMES[l]})`).join(", ");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content:
            `Translate this Spanish FAQ for a boat-rental business in Blanes, Costa Brava into these locales: ${targets}.\n` +
            `Keep any text inside {curly_braces} EXACTLY as-is — they are runtime variables, not words to translate.\n` +
            `Keep the tone natural, concise and commercial.\n` +
            `Return ONLY a JSON object keyed by locale code (e.g. "en", "fr"), each value an object {"question": "...", "answer": "..."}. No prose, no markdown fences.\n\n` +
            `question: ${question}\nanswer: ${answer}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No JSON object found in translation response");
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Record<
      string,
      Translated
    >;

    const out: Partial<Record<LangCode, Translated>> = {};
    for (const lang of TARGET_LANGS) {
      const t = parsed[lang];
      if (t?.question && t?.answer) {
        out[lang] = { question: t.question, answer: t.answer };
      }
    }
    return out;
  } catch (error) {
    logger.error("[SEO:FAQ] Translation failed, storing ES only", {
      error: String(error),
    });
    return {};
  }
}

export async function addFaq(action: {
  page: string;
  details: string;
  hypothesis: string;
  campaignId: number | null;
}): Promise<{ previousValue: string; newValue: string }> {
  // Parse details - expected format: "question: What is X?\nanswer: X is Y."
  const lines = action.details.split("\n");
  let question = "";
  let answer = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("question:")) {
      question = trimmed.slice("question:".length).trim();
    } else if (trimmed.toLowerCase().startsWith("answer:")) {
      answer = trimmed.slice("answer:".length).trim();
    }
  }

  if (!question || !answer) {
    throw new Error(`Invalid FAQ format. Expected "question: ...\nanswer: ...". Got: ${action.details}`);
  }

  // Build the full multi-locale row set: ES source + machine translations, so
  // the FAQ (and the FAQPage/Q&A schema built from it) exists in all 8 locales
  // instead of only Spanish. Translation failures degrade to ES-only.
  const translations = await translateFaq(question, answer);
  const rows = [
    { page: action.page, language: "es", question, answer, sortOrder: 0, active: true },
    ...TARGET_LANGS.flatMap((lang) => {
      const t = translations[lang];
      return t
        ? [{ page: action.page, language: lang, question: t.question, answer: t.answer, sortOrder: 0, active: true }]
        : [];
    }),
  ];

  await db.insert(seoFaqs).values(rows);

  logger.info(
    `[SEO:FAQ] Added FAQ for ${action.page} in ${rows.length} locale(s): ${question}`,
  );

  return { previousValue: "", newValue: question };
}
