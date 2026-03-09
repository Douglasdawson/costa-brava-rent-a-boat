/**
 * Blog Autopilot Service
 *
 * Orchestrates the full pipeline: topic selection -> article generation ->
 * self-review -> SEO audit -> translation -> Unsplash image -> save to DB.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createApi } from "unsplash-js";
import { eq, desc, sql, and, gte, count } from "drizzle-orm";
import { db } from "../mcp/shared/db.js";
import * as schema from "../../shared/schema.js";
import {
  selectNextTopic,
  findPostToRefresh,
  generateTopicQueue,
  SUPPORTED_LANGUAGES,
} from "./blogTopicEngine.js";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PipelineOptions {
  forceGeneration?: boolean;
  type?: "new" | "refresh" | "manual";
}

interface PipelineResult {
  success: boolean;
  postId?: string;
  topic?: string;
  seoScore?: number;
  tokensInput?: number;
  tokensOutput?: number;
  error?: string;
  type?: "new" | "refresh";
}

interface GeneratedArticle {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  category: string;
  tags: string[];
  keywords: string[];
}

interface ArticleGenerationResult {
  article: GeneratedArticle;
  tokensIn: number;
  tokensOut: number;
}

interface SeoAuditResult {
  score: number;
  issues: string[];
}

interface TranslationResult {
  titleByLang: Record<string, string>;
  contentByLang: Record<string, string>;
  excerptByLang: Record<string, string>;
  metaDescByLang: Record<string, string>;
  tokensIn: number;
  tokensOut: number;
}

// ---------------------------------------------------------------------------
// Internal: Clients
// ---------------------------------------------------------------------------

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function getUnsplashClient(): ReturnType<typeof createApi> | null {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;
  return createApi({ accessKey });
}

// ---------------------------------------------------------------------------
// Exported: getConfig
// ---------------------------------------------------------------------------

export async function getConfig(): Promise<schema.BlogAutopilotConfig> {
  const rows = await db
    .select()
    .from(schema.blogAutopilotConfig)
    .limit(1);

  if (rows.length > 0) {
    return rows[0];
  }

  // Create singleton config with defaults
  const [newConfig] = await db
    .insert(schema.blogAutopilotConfig)
    .values({})
    .returning();

  return newConfig;
}

// ---------------------------------------------------------------------------
// Internal: Season check
// ---------------------------------------------------------------------------

function isInSeason(config: schema.BlogAutopilotConfig): boolean {
  const currentMonth = new Date().getMonth(); // 0-indexed
  const start = config.seasonStartMonth; // Already 0-indexed in the config (2 = March)
  const end = config.seasonEndMonth;       // 9 = October

  if (start <= end) {
    return currentMonth >= start && currentMonth <= end;
  }
  // Wrapping case (e.g., start=10, end=2)
  return currentMonth >= start || currentMonth <= end;
}

// ---------------------------------------------------------------------------
// Internal: Weekly post count
// ---------------------------------------------------------------------------

async function getPostsThisWeek(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await db
    .select({ total: count() })
    .from(schema.blogAutopilotLog)
    .where(
      and(
        eq(schema.blogAutopilotLog.status, "success"),
        gte(schema.blogAutopilotLog.createdAt, sevenDaysAgo)
      )
    );

  return result[0]?.total ?? 0;
}

// ---------------------------------------------------------------------------
// Internal: Business context for article generation
// ---------------------------------------------------------------------------

async function getBusinessContext(): Promise<{
  boatsInfo: string;
  destinationsInfo: string;
  existingPostsInfo: string;
}> {
  // Import real boat data from boatData.ts (source of truth)
  const { BOAT_DATA } = await import("../../shared/boatData.js");

  const [destinationsList, posts] = await Promise.all([
    db
      .select({
        name: schema.destinations.name,
        slug: schema.destinations.slug,
      })
      .from(schema.destinations)
      .where(eq(schema.destinations.isPublished, true)),
    db
      .select({
        title: schema.blogPosts.title,
        slug: schema.blogPosts.slug,
        category: schema.blogPosts.category,
      })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.isPublished, true))
      .orderBy(desc(schema.blogPosts.createdAt))
      .limit(30),
  ]);

  // Build detailed boat info from boatData.ts (source of truth for all boat details)
  const boatsInfo = Object.values(BOAT_DATA)
    .map((b) => {
      const licencia = b.features.some(f => f.toLowerCase().includes("sin licencia"))
        ? "NO necesaria"
        : "necesaria (PER/PNB)";
      const gasolina = b.included.some(i => i.toLowerCase().includes("carburante"))
        ? "incluida"
        : "NO incluida";
      const lowestPrice = Math.min(...Object.values(b.pricing.BAJA.prices));
      return `- ${b.name}: ${b.specifications.capacity}, eslora ${b.specifications.length}, motor ${b.specifications.engine}, licencia ${licencia}, gasolina ${gasolina}, deposito ${b.specifications.deposit}, desde ${lowestPrice}EUR (temp. baja). Incluye: ${b.included.join(", ")}. URL: /barco/${b.id}`;
    })
    .join("\n");

  const destinationsInfo = destinationsList
    .map((d) => `- ${d.name} (URL: /destinos/${d.slug})`)
    .join("\n");

  const existingPostsInfo = posts
    .map((p) => `- "${p.title}" (URL: /blog/${p.slug}, categoria: ${p.category})`)
    .join("\n");

  return { boatsInfo, destinationsInfo, existingPostsInfo };
}

// ---------------------------------------------------------------------------
// Internal: Generate article with Claude
// ---------------------------------------------------------------------------

async function generateArticle(
  client: Anthropic,
  topic: string,
  keywords: string[],
  category: string,
  clusterCtx: string,
  businessCtx: { boatsInfo: string; destinationsInfo: string; existingPostsInfo: string },
  model: string
): Promise<ArticleGenerationResult> {
  const prompt = `Eres un redactor experto en SEO para un negocio de alquiler de barcos en Blanes, Costa Brava, Espana.

INFORMACION DEL NEGOCIO (DATOS REALES - usar siempre estos datos, no inventar):
- Ubicacion: Puerto de Blanes, Costa Brava, Girona, Espana
- Telefono/WhatsApp: +34 611 500 372
- Email: costabravarentaboat@gmail.com
- Barcos sin licencia: para mayores de 18 anos, sin titulacion nautica, briefing de 15 min incluido
- Barcos con licencia: requieren PER o PNB vigente
- Duraciones de alquiler SIN licencia: 1h, 2h, 3h, 4h, 6h, 8h
- Duraciones de alquiler CON licencia: 2h, 4h, 8h
- 3 temporadas: baja (abril-junio, septiembre), media (julio), alta (agosto)
- Barcos SIN licencia incluyen: IVA, gasolina, amarre, limpieza, seguro embarcacion y ocupantes
- Barcos CON licencia incluyen: IVA, amarre, limpieza, seguro (gasolina NO incluida)
- Deposito: entre 200 y 500 EUR segun barco (se devuelve integro)
- Temporada: abril a octubre
- Extras: snorkel (7,50EUR), paddle surf (25EUR), nevera (5EUR), bebidas (2,50EUR/ud), seascooter (50EUR), parking (10EUR)
- Packs: Basic (nevera+snorkel 10EUR), Premium (+paddle 30EUR), Aventura (+seascooter 75EUR)

REGLA CRITICA: Usa SOLO los barcos listados abajo. NO inventes nombres de barcos. Las URLs de barcos son /barco/{id} (ej: /barco/solar-450).

BARCOS DISPONIBLES (para enlaces internos):
${businessCtx.boatsInfo || "No hay barcos en la base de datos"}

DESTINOS PUBLICADOS (para enlaces internos):
${businessCtx.destinationsInfo || "No hay destinos publicados"}

POSTS EXISTENTES (para enlaces internos, evita duplicar temas):
${businessCtx.existingPostsInfo || "No hay posts publicados"}

CONTEXTO DEL CLUSTER:
${clusterCtx}

TAREA:
Escribe un articulo de blog en ESPANOL sobre: "${topic}"
- Categoria: ${category}
- Keywords SEO objetivo: ${keywords.join(", ")}

REQUISITOS:
1. Entre 800 y 1500 palabras
2. Formato Markdown
3. Incluye al menos 2 enlaces internos a barcos, destinos u otros posts (formato: [texto](/ruta))
4. Incluye al menos 2 subtitulos H2 y algun H3 si corresponde
5. Incluye un CTA natural invitando a reservar en costabravarentaboat.app
6. Tono informativo, cercano pero profesional
7. NO uses emojis
8. El contenido debe ser original, util y orientado a SEO
9. El slug debe ser corto, descriptivo y en espanol

Responde UNICAMENTE con un objeto JSON (sin markdown, sin backticks):
{
  "title": "Titulo del articulo (30-70 caracteres idealmente)",
  "slug": "slug-url-amigable",
  "content": "Contenido completo en Markdown...",
  "excerpt": "Resumen de 1-2 frases para la tarjeta del blog (max 200 caracteres)",
  "metaDescription": "Meta description SEO (120-160 caracteres)",
  "category": "${category}",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude during article generation");
  }

  const article: GeneratedArticle = JSON.parse(textBlock.text);

  return {
    article,
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
  };
}

// ---------------------------------------------------------------------------
// Internal: Self-review article with Claude
// ---------------------------------------------------------------------------

async function selfReviewArticle(
  client: Anthropic,
  article: GeneratedArticle,
  model: string
): Promise<{ improved: GeneratedArticle; tokensIn: number; tokensOut: number }> {
  const prompt = `Eres un editor jefe revisando un articulo de blog para un negocio de alquiler de barcos en Blanes, Costa Brava.

ARTICULO A REVISAR:
Titulo: ${article.title}
Contenido:
${article.content}

TAREAS DE REVISION:
1. Mejora la claridad y fluidez del texto
2. Corrige errores gramaticales u ortograficos
3. Asegurate de que los enlaces internos (formato [texto](/ruta)) estan bien formados
4. Mejora las transiciones entre secciones
5. Verifica que el CTA es natural y no agresivo
6. Asegurate de que el tono es informativo y profesional
7. NO cambies la estructura general ni el slug
8. NO uses emojis
9. Si el articulo ya es bueno, haz solo cambios menores

Responde UNICAMENTE con un objeto JSON (sin markdown, sin backticks):
{
  "title": "${article.title}",
  "slug": "${article.slug}",
  "content": "Contenido mejorado en Markdown...",
  "excerpt": "Excerpt mejorado (max 200 caracteres)",
  "metaDescription": "Meta description mejorada (120-160 caracteres)",
  "category": "${article.category}",
  "tags": ${JSON.stringify(article.tags)},
  "keywords": ${JSON.stringify(article.keywords)}
}`;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude during self-review");
  }

  const improved: GeneratedArticle = JSON.parse(textBlock.text);

  return {
    improved,
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
  };
}

// ---------------------------------------------------------------------------
// Internal: SEO audit (local, no AI)
// ---------------------------------------------------------------------------

function runSeoAudit(article: GeneratedArticle): SeoAuditResult {
  let score = 100;
  const issues: string[] = [];

  // Title length: 30-70 chars
  if (article.title.length < 30) {
    score -= 10;
    issues.push(`Title too short (${article.title.length} chars, min 30)`);
  } else if (article.title.length > 70) {
    score -= 5;
    issues.push(`Title too long (${article.title.length} chars, max 70)`);
  }

  // Meta description: 120-160 chars
  if (!article.metaDescription) {
    score -= 15;
    issues.push("Missing meta description");
  } else if (article.metaDescription.length < 120) {
    score -= 10;
    issues.push(`Meta description too short (${article.metaDescription.length} chars, min 120)`);
  } else if (article.metaDescription.length > 160) {
    score -= 5;
    issues.push(`Meta description too long (${article.metaDescription.length} chars, max 160)`);
  }

  // Word count: >300
  const wordCount = article.content.split(/\s+/).length;
  if (wordCount < 300) {
    score -= 20;
    issues.push(`Word count too low (${wordCount}, min 300)`);
  } else if (wordCount < 600) {
    score -= 10;
    issues.push(`Word count below ideal (${wordCount}, aim for 800+)`);
  }

  // Has H2 headings
  const h2Count = (article.content.match(/^## /gm) || []).length;
  if (h2Count === 0) {
    score -= 15;
    issues.push("No H2 headings found");
  } else if (h2Count < 2) {
    score -= 5;
    issues.push(`Only ${h2Count} H2 heading(s), aim for 2+`);
  }

  // Has H3 headings
  const h3Count = (article.content.match(/^### /gm) || []).length;
  if (h3Count === 0) {
    score -= 5;
    issues.push("No H3 headings found (recommended for longer articles)");
  }

  // Has internal links (paths starting with /)
  const internalLinks = (article.content.match(/\]\(\//g) || []).length;
  if (internalLinks === 0) {
    score -= 15;
    issues.push("No internal links found");
  } else if (internalLinks < 2) {
    score -= 5;
    issues.push(`Only ${internalLinks} internal link(s), aim for 2+`);
  }

  // Has excerpt
  if (!article.excerpt || article.excerpt.length < 20) {
    score -= 10;
    issues.push("Missing or too short excerpt");
  }

  // Has at least 3 tags
  if (!article.tags || article.tags.length < 3) {
    score -= 10;
    issues.push(`Only ${article.tags?.length ?? 0} tag(s), aim for 3+`);
  }

  return { score: Math.max(0, score), issues };
}

// ---------------------------------------------------------------------------
// Internal: Translate article
// ---------------------------------------------------------------------------

async function translateArticle(
  client: Anthropic,
  article: GeneratedArticle,
  targetLanguages: string[],
  model: string
): Promise<TranslationResult> {
  // Filter out Spanish (source language)
  const langsToTranslate = targetLanguages.filter((l) => l !== "es");

  const titleByLang: Record<string, string> = { es: article.title };
  const contentByLang: Record<string, string> = { es: article.content };
  const excerptByLang: Record<string, string> = { es: article.excerpt };
  const metaDescByLang: Record<string, string> = { es: article.metaDescription };

  let totalTokensIn = 0;
  let totalTokensOut = 0;

  // Process in batches of 3 to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < langsToTranslate.length; i += batchSize) {
    const batch = langsToTranslate.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (lang) => {
        const langNames: Record<string, string> = {
          en: "English",
          fr: "French",
          de: "German",
          it: "Italian",
          nl: "Dutch",
          ru: "Russian",
          ca: "Catalan",
        };

        const prompt = `Translate the following blog article content from Spanish to ${langNames[lang] ?? lang}.

RULES:
1. Adapt naturally - do NOT translate word by word
2. Keep all Markdown formatting exactly as is (headers, bold, links, etc.)
3. Keep all internal links unchanged (e.g., [text](/path) - translate "text" but keep "/path")
4. Keep proper nouns unchanged (Blanes, Costa Brava, Puerto de Blanes, etc.)
5. Keep the same tone: informative, professional, friendly
6. Do NOT add emojis

SOURCE CONTENT:
Title: ${article.title}
Excerpt: ${article.excerpt}
Meta Description: ${article.metaDescription}

Content:
${article.content}

Respond with ONLY a JSON object (no markdown, no backticks):
{
  "title": "Translated title",
  "content": "Translated content in Markdown",
  "excerpt": "Translated excerpt",
  "metaDescription": "Translated meta description (120-160 chars)"
}`;

        const response = await client.messages.create({
          model,
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });

        const textBlock = response.content.find((b) => b.type === "text");
        if (!textBlock || textBlock.type !== "text") {
          throw new Error(`No text response for translation to ${lang}`);
        }

        const translated = JSON.parse(textBlock.text) as {
          title: string;
          content: string;
          excerpt: string;
          metaDescription: string;
        };

        return {
          lang,
          translated,
          tokensIn: response.usage.input_tokens,
          tokensOut: response.usage.output_tokens,
        };
      })
    );

    for (const result of batchResults) {
      titleByLang[result.lang] = result.translated.title;
      contentByLang[result.lang] = result.translated.content;
      excerptByLang[result.lang] = result.translated.excerpt;
      metaDescByLang[result.lang] = result.translated.metaDescription;
      totalTokensIn += result.tokensIn;
      totalTokensOut += result.tokensOut;
    }

    // Small delay between batches to be respectful of rate limits
    if (i + batchSize < langsToTranslate.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return {
    titleByLang,
    contentByLang,
    excerptByLang,
    metaDescByLang,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
  };
}

// ---------------------------------------------------------------------------
// Internal: Fetch Unsplash image
// ---------------------------------------------------------------------------

async function fetchUnsplashImage(keywords: string[]): Promise<string | null> {
  const unsplash = getUnsplashClient();
  if (!unsplash) return null;

  try {
    const query = [...keywords.slice(0, 2), "boat sea"].join(" ");
    const result = await unsplash.search.getPhotos({
      query,
      perPage: 1,
      orientation: "landscape",
    });

    if (result.response && result.response.results.length > 0) {
      const photo = result.response.results[0];
      // Use regular size (1080px wide) with UTM attribution as required by Unsplash
      return `${photo.urls.regular}&utm_source=costabravarentaboat&utm_medium=referral`;
    }

    return null;
  } catch (error) {
    logger.warn("BlogAutopilot Unsplash fetch error", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal: Refresh pipeline (rewrite existing post)
// ---------------------------------------------------------------------------

async function runRefreshPipeline(
  client: Anthropic,
  config: schema.BlogAutopilotConfig,
  post: { postId: string; title: string; slug: string }
): Promise<PipelineResult> {
  let totalTokensIn = 0;
  let totalTokensOut = 0;

  try {
    // Get the full existing post
    const [existingPost] = await db
      .select()
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.id, post.postId))
      .limit(1);

    if (!existingPost) {
      throw new Error(`Post ${post.postId} not found`);
    }

    const businessCtx = await getBusinessContext();

    // Rewrite the article
    const rewritePrompt = `Eres un redactor SEO experto. Tu tarea es reescribir y mejorar un articulo de blog existente para un negocio de alquiler de barcos en Blanes, Costa Brava.

ARTICULO ORIGINAL:
Titulo: ${existingPost.title}
Contenido:
${existingPost.content}

BARCOS DISPONIBLES (para enlaces internos):
${businessCtx.boatsInfo || "No hay barcos"}

DESTINOS PUBLICADOS (para enlaces internos):
${businessCtx.destinationsInfo || "No hay destinos"}

OTROS POSTS (para enlaces internos):
${businessCtx.existingPostsInfo || "No hay otros posts"}

TAREA:
1. Reescribe el articulo mejorando la calidad, profundidad y SEO
2. Actualiza informacion que pueda estar desactualizada
3. Anade o mejora los enlaces internos
4. Mejora los subtitulos y estructura
5. Mantiene el mismo tema y slug
6. Entre 800 y 1500 palabras
7. NO uses emojis

Responde UNICAMENTE con un objeto JSON (sin markdown, sin backticks):
{
  "title": "Titulo mejorado (30-70 caracteres)",
  "slug": "${existingPost.slug}",
  "content": "Contenido reescrito en Markdown...",
  "excerpt": "Excerpt mejorado (max 200 chars)",
  "metaDescription": "Meta description mejorada (120-160 chars)",
  "category": "${existingPost.category}",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const rewriteResponse = await client.messages.create({
      model: config.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: rewritePrompt }],
    });

    const textBlock = rewriteResponse.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response for refresh rewrite");
    }

    const rewrittenArticle: GeneratedArticle = JSON.parse(textBlock.text);
    totalTokensIn += rewriteResponse.usage.input_tokens;
    totalTokensOut += rewriteResponse.usage.output_tokens;

    // Self-review
    const reviewResult = await selfReviewArticle(client, rewrittenArticle, config.model);
    const finalArticle = reviewResult.improved;
    totalTokensIn += reviewResult.tokensIn;
    totalTokensOut += reviewResult.tokensOut;

    // SEO audit
    const seoResult = runSeoAudit(finalArticle);

    // Translate
    const languages = config.languages ?? [...SUPPORTED_LANGUAGES];
    const translations = await translateArticle(client, finalArticle, languages, config.model);
    totalTokensIn += translations.tokensIn;
    totalTokensOut += translations.tokensOut;

    // Fetch new image if enabled
    let featuredImage = existingPost.featuredImage;
    if (config.unsplashEnabled) {
      const newImage = await fetchUnsplashImage(finalArticle.keywords);
      if (newImage) featuredImage = newImage;
    }

    // Update the existing post
    const [updatedPost] = await db
      .update(schema.blogPosts)
      .set({
        title: finalArticle.title.slice(0, 255),
        content: finalArticle.content,
        excerpt: finalArticle.excerpt,
        metaDescription: finalArticle.metaDescription?.slice(0, 160) || null,
        tags: finalArticle.tags,
        featuredImage,
        titleByLang: translations.titleByLang,
        contentByLang: translations.contentByLang,
        excerptByLang: translations.excerptByLang,
        metaDescByLang: translations.metaDescByLang,
        seoScore: seoResult.score,
        updatedAt: new Date(),
      })
      .where(eq(schema.blogPosts.id, post.postId))
      .returning();

    // Log execution
    await db.insert(schema.blogAutopilotLog).values({
      postId: updatedPost.id,
      type: "refresh",
      topicChosen: finalArticle.title,
      modelUsed: config.model,
      tokensInput: totalTokensIn,
      tokensOutput: totalTokensOut,
      seoScore: seoResult.score,
      status: "success",
    });

    return {
      success: true,
      postId: updatedPost.id,
      topic: finalArticle.title,
      seoScore: seoResult.score,
      tokensInput: totalTokensIn,
      tokensOutput: totalTokensOut,
      type: "refresh",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await db.insert(schema.blogAutopilotLog).values({
      postId: post.postId,
      type: "refresh",
      topicChosen: post.title,
      modelUsed: config.model,
      tokensInput: totalTokensIn,
      tokensOutput: totalTokensOut,
      status: "error",
      errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
      tokensInput: totalTokensIn,
      tokensOutput: totalTokensOut,
      type: "refresh",
    };
  }
}

// ---------------------------------------------------------------------------
// Exported: runAutopilotPipeline
// ---------------------------------------------------------------------------

export async function runAutopilotPipeline(
  options?: PipelineOptions
): Promise<PipelineResult> {
  const config = await getConfig();
  const client = getAnthropicClient();

  if (!client) {
    return { success: false, error: "ANTHROPIC_API_KEY is not configured" };
  }

  // Season check (skippable with forceGeneration)
  if (!options?.forceGeneration && !isInSeason(config)) {
    return { success: false, error: "Out of season - autopilot is paused" };
  }

  // Weekly limit check (skippable with forceGeneration)
  if (!options?.forceGeneration) {
    const postsThisWeek = await getPostsThisWeek();
    if (postsThisWeek >= config.maxPostsPerWeek) {
      return {
        success: false,
        error: `Weekly limit reached (${postsThisWeek}/${config.maxPostsPerWeek})`,
      };
    }
  }

  // Decide: refresh or new?
  // Every N successful runs (refreshRatio), do a refresh instead
  let shouldRefresh = false;
  if (options?.type !== "manual") {
    const totalSuccessful = await db
      .select({ total: count() })
      .from(schema.blogAutopilotLog)
      .where(eq(schema.blogAutopilotLog.status, "success"));

    const totalCount = totalSuccessful[0]?.total ?? 0;
    if (config.refreshRatio > 0 && totalCount > 0 && totalCount % config.refreshRatio === 0) {
      shouldRefresh = true;
    }
  }

  if (options?.type === "refresh") {
    shouldRefresh = true;
  } else if (options?.type === "new") {
    shouldRefresh = false;
  }

  // Handle refresh pipeline
  if (shouldRefresh) {
    const postToRefresh = await findPostToRefresh();
    if (postToRefresh) {
      return runRefreshPipeline(client, config, postToRefresh);
    }
    // No post to refresh, fall through to new article generation
  }

  // --- New article generation pipeline ---
  let totalTokensIn = 0;
  let totalTokensOut = 0;

  try {
    // Step 1: Select topic
    const apiKey = process.env.ANTHROPIC_API_KEY!;
    const topic = await selectNextTopic(apiKey);

    // Step 2: Get business context
    const businessCtx = await getBusinessContext();

    // Build cluster context string
    const clusterCtx = `Cluster: "${topic.clusterName}" | Type: ${topic.type} | Keywords: ${topic.keywords.join(", ")}`;

    // Step 3: Generate article
    const genResult = await generateArticle(
      client,
      topic.topic,
      topic.keywords,
      topic.category,
      clusterCtx,
      businessCtx,
      config.model
    );
    totalTokensIn += genResult.tokensIn;
    totalTokensOut += genResult.tokensOut;

    // Step 4: Self-review
    const reviewResult = await selfReviewArticle(client, genResult.article, config.model);
    let finalArticle = reviewResult.improved;
    totalTokensIn += reviewResult.tokensIn;
    totalTokensOut += reviewResult.tokensOut;

    // Step 5: SEO audit
    let seoResult = runSeoAudit(finalArticle);

    // Step 6: If SEO score too low, retry generation once
    if (seoResult.score < config.minSeoScore) {
      logger.info("BlogAutopilot SEO score below minimum, retrying", {
        score: seoResult.score,
        minScore: config.minSeoScore,
        issues: seoResult.issues,
      });

      const retryResult = await generateArticle(
        client,
        topic.topic,
        topic.keywords,
        topic.category,
        clusterCtx + `\n\nPREVIOUS ATTEMPT HAD THESE SEO ISSUES: ${seoResult.issues.join("; ")}. Please fix them.`,
        businessCtx,
        config.model
      );
      totalTokensIn += retryResult.tokensIn;
      totalTokensOut += retryResult.tokensOut;

      const retryReview = await selfReviewArticle(client, retryResult.article, config.model);
      finalArticle = retryReview.improved;
      totalTokensIn += retryReview.tokensIn;
      totalTokensOut += retryReview.tokensOut;

      seoResult = runSeoAudit(finalArticle);
    }

    // Step 7: Translate to all configured languages
    const languages = config.languages ?? [...SUPPORTED_LANGUAGES];
    const translations = await translateArticle(client, finalArticle, languages, config.model);
    totalTokensIn += translations.tokensIn;
    totalTokensOut += translations.tokensOut;

    // Step 8: Fetch Unsplash image
    let featuredImage: string | null = null;
    if (config.unsplashEnabled) {
      featuredImage = await fetchUnsplashImage(finalArticle.keywords);
    }

    // Step 9: Create or find cluster in DB
    let clusterId: string | null = null;
    const existingClusters = await db
      .select()
      .from(schema.blogClusters)
      .where(eq(schema.blogClusters.name, topic.clusterName))
      .limit(1);

    if (existingClusters.length > 0) {
      clusterId = existingClusters[0].id;
    } else {
      const [newCluster] = await db
        .insert(schema.blogClusters)
        .values({
          name: topic.clusterName,
          keywords: topic.keywords,
          plannedTopics: [{ topic: topic.topic, type: topic.type }],
          completedCount: 0,
        })
        .returning();
      clusterId = newCluster.id;
    }

    // Step 10: Save post as draft
    const [newPost] = await db
      .insert(schema.blogPosts)
      .values({
        title: finalArticle.title.slice(0, 255),
        slug: finalArticle.slug.slice(0, 255),
        content: finalArticle.content,
        excerpt: finalArticle.excerpt,
        metaDescription: finalArticle.metaDescription?.slice(0, 160) || null,
        category: finalArticle.category,
        tags: finalArticle.tags,
        author: "Costa Brava Rent a Boat",
        featuredImage,
        isPublished: false,
        isAutoGenerated: true,
        clusterId,
        seoScore: seoResult.score,
        titleByLang: translations.titleByLang,
        contentByLang: translations.contentByLang,
        excerptByLang: translations.excerptByLang,
        metaDescByLang: translations.metaDescByLang,
      })
      .returning();

    // Update cluster: increment completedCount, set pillar if applicable
    const updateValues: Record<string, unknown> = {
      completedCount: sql`${schema.blogClusters.completedCount} + 1`,
      updatedAt: new Date(),
    };
    if (topic.type === "pillar") {
      updateValues.pillarPostId = newPost.id;
    }
    await db
      .update(schema.blogClusters)
      .set(updateValues)
      .where(eq(schema.blogClusters.id, clusterId));

    // Step 11: Log execution
    await db.insert(schema.blogAutopilotLog).values({
      postId: newPost.id,
      type: "new",
      topicChosen: finalArticle.title,
      clusterName: topic.clusterName,
      keywordsUsed: finalArticle.keywords,
      modelUsed: config.model,
      tokensInput: totalTokensIn,
      tokensOutput: totalTokensOut,
      seoScore: seoResult.score,
      status: "success",
    });

    return {
      success: true,
      postId: newPost.id,
      topic: finalArticle.title,
      seoScore: seoResult.score,
      tokensInput: totalTokensIn,
      tokensOutput: totalTokensOut,
      type: "new",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log the failure
    await db.insert(schema.blogAutopilotLog).values({
      type: options?.type ?? "new",
      modelUsed: config.model,
      tokensInput: totalTokensIn,
      tokensOutput: totalTokensOut,
      status: "error",
      errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
      tokensInput: totalTokensIn,
      tokensOutput: totalTokensOut,
    };
  }
}

// ---------------------------------------------------------------------------
// Exported: publishMatureDrafts
// ---------------------------------------------------------------------------

export async function publishMatureDrafts(): Promise<number> {
  const config = await getConfig();
  const delayMs = (config.publishDelayHours ?? 24) * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - delayMs);

  const drafts = await db
    .select({ id: schema.blogPosts.id })
    .from(schema.blogPosts)
    .where(
      and(
        eq(schema.blogPosts.isPublished, false),
        eq(schema.blogPosts.isAutoGenerated, true),
        sql`${schema.blogPosts.createdAt} <= ${cutoff}`
      )
    );

  if (drafts.length === 0) return 0;

  const draftIds = drafts.map((d) => d.id);

  for (const draftId of draftIds) {
    await db
      .update(schema.blogPosts)
      .set({
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.blogPosts.id, draftId));
  }

  logger.info("BlogAutopilot published mature drafts", { count: draftIds.length });
  return draftIds.length;
}
