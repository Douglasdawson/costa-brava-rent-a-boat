// Embeddings de OpenAI. Nació dentro del RAG del chatbot de WhatsApp; cuando ese
// chatbot se desmanteló (jul-2026) quedó como pieza propia porque quien lo usa de
// verdad es el índice de búsqueda IA público (`services/aiSearchIndex.ts`), que
// alimenta el hub de citaciones para asistentes (GEO/SEO). Lo demás del antiguo
// ragService leía `knowledge_base`, la tabla del bot, y se fue con ella.
import OpenAI from "openai";
import { logger } from "../lib/logger";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

/** Vector de 1536 dimensiones para un texto. Devuelve [] si OpenAI falla. */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536,
    });
    return response.data[0]?.embedding || [];
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Error generating embedding", { error: errorMsg });
    return [];
  }
}
