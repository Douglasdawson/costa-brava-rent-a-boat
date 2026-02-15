// RAG Service - Retrieval Augmented Generation for WhatsApp Chatbot
import OpenAI from "openai";
import { db } from "../db";
import { knowledgeBase } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Generate embedding for a text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536,
    });
    return response.data[0]?.embedding || [];
  } catch (error: any) {
    console.error("[RAG] Error generating embedding:", error.message);
    return [];
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search knowledge base using semantic similarity
export async function searchKnowledgeBase(
  query: string,
  language: string = "es",
  limit: number = 3,
  minSimilarity: number = 0.7
): Promise<Array<{ title: string; content: string; category: string; similarity: number }>> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding.length === 0) {
      return [];
    }

    // Get all active knowledge base entries for the language
    const entries = await db.select().from(knowledgeBase)
      .where(and(
        eq(knowledgeBase.isActive, true),
        eq(knowledgeBase.language, language)
      ));

    // Calculate similarities and filter
    const results = entries
      .map(entry => {
        const embedding = entry.embedding as number[] | null;
        if (!embedding || embedding.length === 0) {
          return null;
        }
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        return {
          title: entry.title,
          content: entry.content,
          category: entry.category,
          similarity,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  } catch (error: any) {
    console.error("[RAG] Error searching knowledge base:", error.message);
    return [];
  }
}

// Add entry to knowledge base with embedding
export async function addKnowledgeEntry(
  title: string,
  content: string,
  category: string,
  language: string = "es",
  keywords: string[] = [],
  priority: number = 0
): Promise<boolean> {
  try {
    // Generate embedding for the content
    const textToEmbed = `${title}\n${content}`;
    const embedding = await generateEmbedding(textToEmbed);
    
    if (embedding.length === 0) {
      console.error("[RAG] Failed to generate embedding for entry:", title);
      return false;
    }

    await db.insert(knowledgeBase).values({
      title,
      content,
      category,
      language,
      embedding,
      keywords,
      priority,
      isActive: true,
    });

    console.log(`[RAG] Added knowledge entry: ${title}`);
    return true;
  } catch (error: any) {
    console.error("[RAG] Error adding knowledge entry:", error.message);
    return false;
  }
}

// Get RAG context for a query
export async function getRAGContext(query: string, language: string = "es"): Promise<string> {
  const results = await searchKnowledgeBase(query, language, 3, 0.65);
  
  if (results.length === 0) {
    return "";
  }

  const context = results.map(r => 
    `[${r.category.toUpperCase()}] ${r.title}\n${r.content}`
  ).join("\n\n---\n\n");

  return `INFORMACION RELEVANTE DE LA BASE DE CONOCIMIENTO:\n\n${context}`;
}

// Check if knowledge base has entries
export async function hasKnowledgeEntries(): Promise<boolean> {
  try {
    const count = await db.select({ count: sql<number>`count(*)` })
      .from(knowledgeBase)
      .where(eq(knowledgeBase.isActive, true));
    return (count[0]?.count || 0) > 0;
  } catch {
    return false;
  }
}
