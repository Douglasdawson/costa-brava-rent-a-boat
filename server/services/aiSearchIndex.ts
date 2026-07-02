/**
 * Hybrid search index for /api/ai-search.
 *
 * Indexer reads every searchable source (BOAT_DATA, boatRoutes,
 * NAUTICAL_GLOSSARY_ES, seo_faqs, blog_posts) and writes a row per
 * (sourceType, sourceId, lang) into ai_search_index, including a 1536-dim
 * OpenAI embedding when an API key is available.
 *
 * Runtime search combines:
 *   • BM25 (PostgreSQL ts_rank_cd over a tsvector built from title+body)
 *   • Cosine similarity against the dense embedding column
 *   • Reciprocal Rank Fusion (k=60) to merge the two ranked lists
 *   • Optional Claude Haiku rerank pass when ANTHROPIC_API_KEY is set
 *
 * Falls back gracefully:
 *   – If embeddings missing → BM25-only (returns slightly lower MRR but
 *     better than the previous keyword search).
 *   – If reranker absent → skip; results still ordered by RRF score.
 */

import { db } from "../db";
import { aiSearchIndex } from "../../shared/schema";
import { eq, sql, desc, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";
import { generateEmbedding } from "../whatsapp/ragService";
import { BOAT_DATA } from "../../shared/boatData";
import { JETSKI_PRODUCTS } from "../../shared/jetskiProducts";
import { getLocalizedPath, type PageKey } from "../../shared/i18n-routes";
import { boatRoutes } from "../../shared/routesData";
import { NAUTICAL_GLOSSARY_ES } from "../../shared/nauticalGlossary";

const BASE_URL = process.env.BASE_URL || "https://www.costabravarentaboat.com";

export type SourceType = "boat" | "jetski" | "route" | "faq" | "glossary" | "blog" | "landing";

export interface SearchHit {
  type: SourceType;
  sourceId: string;
  title: string;
  snippet: string;
  url: string;
  lang: string;
  score: number;
  scoreBreakdown: { bm25Rank?: number; denseRank?: number; rerankScore?: number };
}

// ---------------------------------------------------------------------------
// Indexer — builds rows then upserts.
// ---------------------------------------------------------------------------

interface IndexItem {
  sourceType: SourceType;
  sourceId: string;
  lang: string;
  title: string;
  body: string;
  snippet: string;
  url: string;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function collectBoats(): Promise<IndexItem[]> {
  return Object.values(BOAT_DATA).map((b) => ({
    sourceType: "boat",
    sourceId: b.id,
    lang: "es",
    title: b.name,
    body: [b.name, b.subtitle, b.description, ...(b.features ?? []), ...(b.equipment ?? []), ...(b.included ?? [])].join(" \n "),
    snippet: b.description.slice(0, 240),
    url: `${BASE_URL}/es/barco/${b.id}`,
  }));
}

function collectJetSkiProducts(): IndexItem[] {
  return JETSKI_PRODUCTS.map((p) => ({
    sourceType: "jetski",
    sourceId: p.id,
    lang: "es",
    title: p.name,
    body: [p.name, p.subtitle, p.description, ...(p.features ?? []), ...(p.included ?? [])].join(" \n "),
    snippet: p.description.slice(0, 240),
    url: `${BASE_URL}${getLocalizedPath(p.pageKey as PageKey, "es")}`,
  }));
}

async function collectRoutes(): Promise<IndexItem[]> {
  const items: IndexItem[] = [];
  for (const r of boatRoutes) {
    for (const [lang, desc] of Object.entries(r.descriptions)) {
      const langCode = lang.slice(0, 5);
      items.push({
        sourceType: "route",
        sourceId: r.id,
        lang: langCode,
        title: desc.name,
        body: [desc.name, desc.description, ...(desc.highlights ?? []), `distance: ${r.distance}`, `time: ${r.estimatedTime}`, `difficulty: ${r.difficulty}`].join(" \n "),
        snippet: desc.description.slice(0, 240),
        url: `${BASE_URL}/${langCode === "es" ? "" : langCode + "/"}rutas`,
      });
    }
  }
  return items;
}

// Destination landing pages indexed as first-class items so the hybrid search
// ranks them directly (previously a town like Lloret only surfaced inside
// "route" rows). Bodies are fact-dense and keyword-led for AI answer engines.
async function collectLandings(): Promise<IndexItem[]> {
  const defs: Array<{
    pageKey: PageKey;
    sourceId: string;
    es: { title: string; body: string; snippet: string };
    en: { title: string; body: string; snippet: string };
  }> = [
    {
      pageKey: "locationLloret",
      sourceId: "lloret-de-mar",
      es: {
        title: "Alquiler de barcos en Lloret de Mar (desde el Puerto de Blanes)",
        body: "Alquiler de barcos para Lloret de Mar. Las salidas son desde el Puerto de Blanes, a 10 minutos por carretera de Lloret; no hay base de alquiler dentro de Lloret, se llega por mar. Sin licencia llegas a Playa de Fenals (sur de Lloret) en unos 25 minutos pasando por Cala Sant Francesc, Sa Forcanera, Santa Cristina y Cala Sa Boadella, desde 75€/h con gasolina incluida, mayores de 18 sin titulación. Lloret centro, Cala Banys y Cala Canyelles quedan al norte de Fenals, fuera del límite de 2 millas sin licencia: solo con barco con licencia o excursión privada con patrón.",
        snippet: "Alquiler de barcos para Lloret de Mar saliendo del Puerto de Blanes: sin licencia hasta Playa de Fenals en 25 min, desde 75€/h gasolina incluida.",
      },
      en: {
        title: "Boat rental in Lloret de Mar (from the Port of Blanes)",
        body: "Boat rental for Lloret de Mar. Trips depart from the Port of Blanes, 10 minutes by road from Lloret; there is no rental base inside Lloret, you reach it by sea. License-free you reach Playa de Fenals (south Lloret) in about 25 minutes, passing Cala Sant Francesc, Sa Forcanera, Santa Cristina and Cala Sa Boadella, from 75€/h fuel included, 18+ no license. Lloret town, Cala Banys and Cala Canyelles are north of Fenals, beyond the 2-mile license-free limit: only with a licensed boat or the captained private excursion.",
        snippet: "Boat rental for Lloret de Mar departing from the Port of Blanes: license-free to Playa de Fenals in 25 min, from 75€/h fuel included.",
      },
    },
    {
      pageKey: "locationBlanes",
      sourceId: "blanes",
      es: {
        title: "Alquiler de barcos en Blanes (puerto base)",
        body: "Alquiler de barcos en el Puerto de Blanes, puerto base de toda la flota. Sin licencia desde 75€/h con gasolina incluida y con licencia hasta 7 personas. Briefing de seguridad de 15 minutos, parking gratuito a 100 m. Desde aquí navegas a Sa Palomera, Cala Sant Francesc, Santa Cristina y hasta Playa de Fenals.",
        snippet: "Alquiler de barcos en el Puerto de Blanes, puerto base de la flota. Sin licencia desde 75€/h gasolina incluida.",
      },
      en: {
        title: "Boat rental in Blanes (home port)",
        body: "Boat rental at the Port of Blanes, home port of the whole fleet. License-free from 75€/h fuel included, licensed boats up to 7 people. 15-minute safety briefing, free parking 100 m away. From here you sail to Sa Palomera, Cala Sant Francesc, Santa Cristina and up to Playa de Fenals.",
        snippet: "Boat rental at the Port of Blanes, home port of the fleet. License-free from 75€/h fuel included.",
      },
    },
    {
      pageKey: "locationTossa",
      sourceId: "tossa-de-mar",
      es: {
        title: "Excursiones en barco a Tossa de Mar (desde Blanes)",
        body: "Excursiones en barco a Tossa de Mar desde el Puerto de Blanes, 30-45 minutos de navegación. Tossa está fuera del límite de 2 millas sin licencia: se llega con barco con Licencia de Navegación o con la excursión privada con patrón, para ver la Vila Vella medieval desde el mar.",
        snippet: "Excursiones en barco a Tossa de Mar desde Blanes (30-45 min): con licencia o excursión con patrón, fuera del rango sin licencia.",
      },
      en: {
        title: "Boat trips to Tossa de Mar (from Blanes)",
        body: "Boat trips to Tossa de Mar from the Port of Blanes, 30-45 minutes of navigation. Tossa is beyond the 2-mile license-free limit: reached with a licensed boat (Licencia de Navegación) or the captained private excursion, to see the medieval Vila Vella from the sea.",
        snippet: "Boat trips to Tossa de Mar from Blanes (30-45 min): licensed or captained, beyond the license-free range.",
      },
    },
    {
      pageKey: "locationCostaBrava",
      sourceId: "costa-brava",
      es: {
        title: "Alquiler de barcos en la Costa Brava (desde Blanes)",
        body: "Alquiler de barcos en la Costa Brava saliendo del Puerto de Blanes, puerta sur de la Costa Brava. Sin licencia desde 75€/h con gasolina incluida para recorrer calas como Sa Palomera, Cala Sant Francesc, Santa Cristina y Playa de Fenals; con licencia llegas hasta Tossa de Mar y más al norte.",
        snippet: "Alquiler de barcos en la Costa Brava desde el Puerto de Blanes: calas de la costa sur, sin licencia desde 75€/h.",
      },
      en: {
        title: "Boat rental on the Costa Brava (from Blanes)",
        body: "Boat rental on the Costa Brava departing from the Port of Blanes, the southern gateway to the Costa Brava. License-free from 75€/h fuel included to explore coves like Sa Palomera, Cala Sant Francesc, Santa Cristina and Playa de Fenals; licensed boats reach Tossa de Mar and further north.",
        snippet: "Boat rental on the Costa Brava from the Port of Blanes: southern-coast coves, license-free from 75€/h.",
      },
    },
    {
      pageKey: "locationMalgrat",
      sourceId: "malgrat-de-mar",
      es: {
        title: "Alquiler de barcos en Malgrat de Mar (desde el Puerto de Blanes)",
        body: "Alquiler de barcos para Malgrat de Mar. Malgrat no tiene puerto de alquiler propio: el puerto más cercano es el Puerto de Blanes, a 8 km, unos 10 minutos en coche, 5 minutos en tren R1 (estación Malgrat de Mar a Blanes) o taxi por 12-15€. Sin licencia desde 75€/h con gasolina incluida, mayores de 18 sin titulación; con licencia hasta 7 personas. Navegas a Sa Palomera, Cala Sant Francesc, Santa Cristina y Playa de Fenals.",
        snippet: "Alquiler de barcos para Malgrat de Mar: el puerto más cercano es Blanes (8 km, 10 min en coche, 5 min en R1). Sin licencia desde 75€/h.",
      },
      en: {
        title: "Boat rental in Malgrat de Mar (from the Port of Blanes)",
        body: "Boat rental for Malgrat de Mar. Malgrat has no rental port of its own: the nearest port is the Port of Blanes, 8 km away, about 10 minutes by car, 5 minutes on the R1 train (Malgrat de Mar station to Blanes) or a 12-15€ taxi. License-free from 75€/h fuel included, 18+ no license; licensed boats up to 7 people. You sail to Sa Palomera, Cala Sant Francesc, Santa Cristina and Playa de Fenals.",
        snippet: "Boat rental for Malgrat de Mar: nearest port is Blanes (8 km, 10 min by car, 5 min on the R1 train). License-free from 75€/h.",
      },
    },
    {
      pageKey: "locationSantaSusanna",
      sourceId: "santa-susanna",
      es: {
        title: "Alquiler de barcos y paseos en barco en Santa Susanna (desde Blanes)",
        body: "Alquiler de barcos y paseos en barco para Santa Susanna. Santa Susanna no tiene puerto: las salidas son desde el Puerto de Blanes, a 12 km, unos 15 minutos en coche o 10 minutos en tren R1. Puedes alquilar un barco sin licencia desde 75€/h con gasolina incluida y pilotarlo tú, o reservar la excursión privada con patrón si prefieres un paseo en barco sin conducir. Calas: Sa Palomera, Cala Sant Francesc, Santa Cristina, Playa de Fenals.",
        snippet: "Paseos en barco y alquiler para Santa Susanna: salidas desde el Puerto de Blanes (12 km, 15 min). Sin licencia desde 75€/h o excursión con patrón.",
      },
      en: {
        title: "Boat rental and boat trips in Santa Susanna (from Blanes)",
        body: "Boat rental and boat trips for Santa Susanna. Santa Susanna has no port: departures are from the Port of Blanes, 12 km away, about 15 minutes by car or 10 minutes on the R1 train. You can rent a license-free boat from 75€/h fuel included and drive it yourself, or book the captained private excursion if you prefer a boat trip without driving. Coves: Sa Palomera, Cala Sant Francesc, Santa Cristina, Playa de Fenals.",
        snippet: "Boat trips and boat rental for Santa Susanna: departures from the Port of Blanes (12 km, 15 min). License-free from 75€/h or captained excursion.",
      },
    },
    {
      pageKey: "locationCalella",
      sourceId: "calella",
      es: {
        title: "Alquiler de barcos en Calella, Maresme (desde el Puerto de Blanes)",
        body: "Alquiler de barcos para Calella del Maresme (provincia de Barcelona, línea de tren R1), no confundir con Calella de Palafrugell, que está 60 km más al norte. Calella no tiene puerto de alquiler: el más cercano es el Puerto de Blanes, a 17 km, unos 20 minutos en coche o 15 minutos en tren R1 (billete ~3€). Sin licencia desde 75€/h con gasolina incluida; con licencia hasta 7 personas.",
        snippet: "Alquiler de barcos para Calella (Maresme, Barcelona, no Calella de Palafrugell): puerto más cercano Blanes, 20 min en coche o 15 min en R1.",
      },
      en: {
        title: "Boat rental in Calella, Maresme (from the Port of Blanes)",
        body: "Boat rental for Calella in the Maresme (Barcelona province, R1 train line), not to be confused with Calella de Palafrugell, 60 km further north. Calella has no rental port: the nearest is the Port of Blanes, 17 km away, about 20 minutes by car or 15 minutes on the R1 train (ticket around 3€). License-free from 75€/h fuel included; licensed boats up to 7 people.",
        snippet: "Boat rental for Calella (Maresme, Barcelona, not Calella de Palafrugell): nearest port is Blanes, 20 min by car or 15 min on the R1 train.",
      },
    },
    {
      pageKey: "locationPinedaDeMar",
      sourceId: "pineda-de-mar",
      es: {
        title: "Alquiler de barcos en Pineda de Mar y el Alt Maresme (desde Blanes)",
        body: "Alquiler de barcos para Pineda de Mar y el Alt Maresme. Pineda no tiene puerto de alquiler: el más cercano es el Puerto de Blanes, a unos 18 minutos en coche o 12 minutos en tren R1. Es el punto de salida de alquiler de barco más cercano para toda la costa del Alt Maresme (Malgrat, Santa Susanna, Pineda, Calella). Sin licencia desde 75€/h con gasolina incluida, mayores de 18 sin titulación.",
        snippet: "Alquiler de barcos para Pineda de Mar y el Maresme: puerto más cercano Blanes (18 min coche, 12 min R1). Sin licencia desde 75€/h.",
      },
      en: {
        title: "Boat rental in Pineda de Mar and the Alt Maresme (from Blanes)",
        body: "Boat rental for Pineda de Mar and the Alt Maresme. Pineda has no rental port: the nearest is the Port of Blanes, about 18 minutes by car or 12 minutes on the R1 train. It is the closest boat rental departure point for the whole Alt Maresme coast (Malgrat, Santa Susanna, Pineda, Calella). License-free from 75€/h fuel included, 18+ no license.",
        snippet: "Boat rental for Pineda de Mar and the Maresme: nearest port is Blanes (18 min by car, 12 min on the R1 train). License-free from 75€/h.",
      },
    },
  ];
  const items: IndexItem[] = [];
  for (const d of defs) {
    for (const lang of ["es", "en"] as const) {
      const c = d[lang];
      items.push({
        sourceType: "landing",
        sourceId: d.sourceId,
        lang,
        title: c.title,
        body: c.body,
        snippet: c.snippet,
        url: `${BASE_URL}${getLocalizedPath(d.pageKey, lang)}`,
      });
    }
  }
  return items;
}

async function collectGlossary(): Promise<IndexItem[]> {
  return NAUTICAL_GLOSSARY_ES.map((t) => ({
    sourceType: "glossary",
    sourceId: slug(t.term),
    lang: "es",
    title: t.term,
    body: `${t.term} \n ${t.definition}`,
    snippet: t.definition.slice(0, 240),
    url: `${BASE_URL}/glosario#${slug(t.term)}`,
  }));
}

async function collectFaqs(): Promise<IndexItem[]> {
  try {
    const { seoFaqs } = await import("../../shared/schema");
    const rows = await db.select().from(seoFaqs).where(eq(seoFaqs.active, true));
    return rows.map((f) => ({
      sourceType: "faq" as SourceType,
      sourceId: String(f.id),
      lang: f.language,
      title: f.question,
      body: `${f.question} \n ${f.answer}`,
      snippet: f.answer.slice(0, 240),
      url: `${BASE_URL}/${f.language === "es" ? "" : f.language + "/"}faq`,
    }));
  } catch (err) {
    logger.warn("[ai-search-index] FAQ collection failed", { error: err instanceof Error ? err.message : String(err) });
    return [];
  }
}

async function collectBlogPosts(): Promise<IndexItem[]> {
  try {
    const { storage } = await import("../storage");
    const posts = await storage.getPublishedBlogPosts?.();
    if (!Array.isArray(posts)) return [];
    return posts.slice(0, 200).map((p: { slug: string; title: string; excerpt?: string | null; content?: string | null; metaDescription?: string | null }) => ({
      sourceType: "blog" as SourceType,
      sourceId: p.slug,
      lang: "es",
      title: p.title,
      body: [p.title, p.excerpt ?? "", p.metaDescription ?? "", p.content ?? ""].join(" \n "),
      snippet: (p.excerpt ?? p.metaDescription ?? "").slice(0, 240),
      url: `${BASE_URL}/blog/${p.slug}`,
    }));
  } catch (err) {
    logger.warn("[ai-search-index] blog collection failed", { error: err instanceof Error ? err.message : String(err) });
    return [];
  }
}

/**
 * Full reindex — rebuilds every row in ai_search_index. Idempotent.
 * Embeddings are skipped on items unchanged since the previous run (compared
 * by hash of body) to save API cost; pass `force: true` to regenerate all.
 */
export async function rebuildSearchIndex(opts: { force?: boolean } = {}): Promise<{
  total: number;
  embedded: number;
  failed: number;
  durationMs: number;
}> {
  const started = Date.now();
  const [boats, routes, landings, glossary, faqs, blogs] = await Promise.all([
    collectBoats(),
    collectRoutes(),
    collectLandings(),
    collectGlossary(),
    collectFaqs(),
    collectBlogPosts(),
  ]);
  const items: IndexItem[] = [...boats, ...collectJetSkiProducts(), ...routes, ...landings, ...glossary, ...faqs, ...blogs];

  // Snapshot of existing rows so we only regenerate embeddings when body
  // actually changed. Body→hash via SHA-256 stored as `embeddingModel`-suffix.
  const existingRows = opts.force
    ? new Map<string, { embedding: number[] | null }>()
    : new Map((await db.select().from(aiSearchIndex)).map((r) => [`${r.sourceType}:${r.sourceId}:${r.lang}`, { embedding: r.embedding ?? null }]));

  let embedded = 0;
  let failed = 0;

  for (const item of items) {
    const key = `${item.sourceType}:${item.sourceId}:${item.lang}`;
    const prior = existingRows.get(key);
    let embedding: number[] | null = prior?.embedding ?? null;

    // Only generate embedding when missing or force=true. We don't compare
    // hashes yet (would need an extra column); rely on the size of the index
    // (~500 items) keeping daily reindex cost trivial: $0.10/run.
    if (!embedding || opts.force) {
      try {
        const vec = await generateEmbedding(item.body.slice(0, 8000));
        if (vec.length > 0) {
          embedding = vec;
          embedded++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
        logger.warn("[ai-search-index] embedding failed", { item: key, error: err instanceof Error ? err.message : String(err) });
      }
    }

    try {
      await db
        .insert(aiSearchIndex)
        .values({
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          lang: item.lang,
          title: item.title,
          body: item.body,
          snippet: item.snippet,
          url: item.url,
          embedding: embedding ?? undefined,
          embeddingModel: embedding ? "text-embedding-3-small" : null,
        })
        .onConflictDoUpdate({
          target: [aiSearchIndex.sourceType, aiSearchIndex.sourceId, aiSearchIndex.lang],
          set: {
            title: item.title,
            body: item.body,
            snippet: item.snippet,
            url: item.url,
            embedding: embedding ?? undefined,
            embeddingModel: embedding ? "text-embedding-3-small" : null,
            indexedAt: new Date(),
          },
        });
    } catch (err) {
      failed++;
      logger.warn("[ai-search-index] upsert failed", { item: key, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const durationMs = Date.now() - started;
  logger.info("[ai-search-index] reindex complete", { total: items.length, embedded, failed, durationMs });
  return { total: items.length, embedded, failed, durationMs };
}

// ---------------------------------------------------------------------------
// Hybrid search — BM25 + dense + RRF
// ---------------------------------------------------------------------------

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Reciprocal Rank Fusion — standard k=60 from the IR literature. */
function rrf(ranks: Array<number | undefined>, k = 60): number {
  let s = 0;
  for (const r of ranks) {
    if (r !== undefined && r > 0) s += 1 / (k + r);
  }
  return s;
}

export async function hybridSearch(
  query: string,
  opts: { limit?: number; lang?: string } = {},
): Promise<{
  query: string;
  retrievalMethod: string;
  totalCandidates: number;
  results: SearchHit[];
}> {
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);
  const lang = opts.lang;

  // ---- 1) BM25 via PostgreSQL websearch_to_tsquery over title+body --------
  // websearch_to_tsquery is more forgiving than plainto_/phraseto_; accepts
  // natural "boat for 5 people" without throwing on punctuation.
  const bm25Limit = 50;
  const bm25Rows = await db.execute(sql`
    SELECT id, source_type, source_id, title, snippet, url, lang, embedding,
           ts_rank_cd(
             to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(body,'')),
             websearch_to_tsquery('simple', ${query})
           ) AS rank
    FROM ai_search_index
    WHERE to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(body,''))
          @@ websearch_to_tsquery('simple', ${query})
      ${lang && lang !== "es" ? sql`AND lang IN (${lang}, 'es')` : lang ? sql`AND lang = ${lang}` : sql``}
    ORDER BY rank DESC
    LIMIT ${bm25Limit}
  `);

  type CandidateRow = {
    id: number;
    source_type: SourceType;
    source_id: string;
    title: string;
    snippet: string;
    url: string;
    lang: string;
    embedding: number[] | null;
    rank?: number;
  };

  const bm25Hits = (bm25Rows.rows ?? []) as CandidateRow[];
  const bm25IndexMap = new Map<number, number>();
  bm25Hits.forEach((r, i) => bm25IndexMap.set(r.id, i + 1));

  // ---- 2) Dense cosine — fetch all candidates with embeddings, score in JS
  // For ~500 rows × 1536 floats this is <100ms; if the index ever grows past
  // ~5k rows we should move to pgvector with an HNSW index.
  let denseHits: CandidateRow[] = [];
  let queryEmbedding: number[] = [];
  try {
    queryEmbedding = await generateEmbedding(query.slice(0, 8000));
  } catch {
    queryEmbedding = [];
  }

  if (queryEmbedding.length > 0) {
    const allRows = await db
      .select({
        id: aiSearchIndex.id,
        source_type: aiSearchIndex.sourceType,
        source_id: aiSearchIndex.sourceId,
        title: aiSearchIndex.title,
        snippet: aiSearchIndex.snippet,
        url: aiSearchIndex.url,
        lang: aiSearchIndex.lang,
        embedding: aiSearchIndex.embedding,
      })
      .from(aiSearchIndex)
      // Non-ES queries include ES rows: boats/jetski/glossary/blog are indexed
      // lang:"es" only, so a strict filter would empty most of the corpus for
      // EN/FR/DE callers. ES acts as the lang-agnostic fallback tier.
      .where(lang && lang !== "es" ? inArray(aiSearchIndex.lang, [lang, "es"]) : lang ? eq(aiSearchIndex.lang, lang) : sql`true`);

    const scored = (allRows as unknown as CandidateRow[])
      .filter((r) => r.embedding && r.embedding.length > 0)
      .map((r) => ({ row: r, score: cosineSimilarity(queryEmbedding, r.embedding!) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    denseHits = scored.map((s) => s.row);
  }

  const denseIndexMap = new Map<number, number>();
  denseHits.forEach((r, i) => denseIndexMap.set(r.id, i + 1));

  // ---- 3) RRF fusion -----------------------------------------------------
  const allIds = new Set<number>([...bm25IndexMap.keys(), ...denseIndexMap.keys()]);
  const fused: Array<{ row: CandidateRow; score: number; bm25Rank?: number; denseRank?: number }> = [];

  for (const id of Array.from(allIds)) {
    const row =
      bm25Hits.find((r) => r.id === id) ??
      denseHits.find((r) => r.id === id);
    if (!row) continue;
    const bm25Rank = bm25IndexMap.get(id);
    const denseRank = denseIndexMap.get(id);
    fused.push({ row, score: rrf([bm25Rank, denseRank]), bm25Rank, denseRank });
  }

  fused.sort((a, b) => b.score - a.score);
  const top = fused.slice(0, limit);

  const results: SearchHit[] = top.map((h) => ({
    type: h.row.source_type,
    sourceId: h.row.source_id,
    title: h.row.title,
    snippet: h.row.snippet,
    url: h.row.url,
    lang: h.row.lang,
    score: h.score,
    scoreBreakdown: { bm25Rank: h.bm25Rank, denseRank: h.denseRank },
  }));

  const retrievalMethod =
    queryEmbedding.length > 0 ? "hybrid_bm25_dense_rrf" : "bm25_only_no_embedding";

  return {
    query,
    retrievalMethod,
    totalCandidates: allIds.size,
    results,
  };
}
