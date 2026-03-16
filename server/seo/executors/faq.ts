// server/seo/executors/faq.ts
import { db } from "../../db";
import { seoFaqs } from "../../../shared/schema";
import { logger } from "../../lib/logger";

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

  await db.insert(seoFaqs).values({
    page: action.page,
    language: "es",
    question,
    answer,
    sortOrder: 0,
    active: true,
  });

  logger.info(`[SEO:FAQ] Added FAQ for ${action.page}: ${question}`);

  return { previousValue: "", newValue: question };
}
