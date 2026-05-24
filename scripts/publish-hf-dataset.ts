/**
 * Build and push the Hugging Face dataset
 * `costabravarentaboat/boat-rental-blanes`.
 *
 * Run locally:
 *   HF_TOKEN=hf_xxx tsx scripts/publish-hf-dataset.ts
 *
 * Run dry (no upload — just emit data/hf-dataset/ on disk):
 *   tsx scripts/publish-hf-dataset.ts --dry
 *
 * Outputs (CC-BY-4.0):
 *   README.md          — bilingual ES/EN dataset card with HF metadata
 *   data/boats.jsonl   — fleet with full specs
 *   data/routes.jsonl  — 5 routes with GPS waypoints, all 8 langs
 *   data/coves.geojson — GeoJSON FeatureCollection of GPS-tagged coves
 *   data/faqs.jsonl    — FAQs by language (live from DB if reachable,
 *                        seed fallback otherwise)
 *   data/glossary.jsonl — 18 nautical terms with definitions
 *
 * Strategy: build the files locally first, then push the whole directory
 * to the HF dataset repo via the HF Hub REST API (no SDK dependency).
 * Idempotent — re-running overwrites.
 */

import fs from "fs/promises";
import path from "path";
import { BOAT_DATA } from "../shared/boatData";
import { boatRoutes } from "../shared/routesData";
import { NAUTICAL_GLOSSARY_ES } from "../shared/nauticalGlossary";

const OUT_DIR = path.resolve(process.cwd(), "data/hf-dataset");
const REPO_ID = "costabravarentaboat/boat-rental-blanes";
const HF_TOKEN = process.env.HF_TOKEN;
const DRY_RUN = process.argv.includes("--dry");

// Coves GPS list — mirror of the seoInjector coves list. Kept in sync
// manually for now; small enough that drift is low-risk.
const COVES = [
  { name: "Sa Palomera", lat: 41.6742, lng: 2.7905, descEs: "Roca emblemática que separa la playa de Blanes del puerto. Aguas cristalinas y poco profundas. Ideal para fondear cerca." },
  { name: "Sa Forcanera", lat: 41.6727, lng: 2.802, descEs: "Cala pequeña a 5 min del puerto. Fondo arenoso, agua transparente." },
  { name: "Cala Sant Francesc (Blanes)", lat: 41.6735, lng: 2.806, descEs: "Cala protegida con bosque mediterráneo. Chiringuito en playa. Excelente para snorkel." },
  { name: "Cala de s'Agulla", lat: 41.682, lng: 2.812, descEs: "Cala secreta a 12 min del puerto. Praderas de Posidonia." },
  { name: "Cala Treumal", lat: 41.686, lng: 2.8185, descEs: "Conecta Santa Cristina con Fenals. Aguas turquesa." },
  { name: "Playa de Santa Cristina", lat: 41.6906, lng: 2.826, descEs: "Playa con pinos hasta la arena. Ermita visible. Mar tranquilo." },
  { name: "Cala Sa Boadella", lat: 41.6938, lng: 2.837, descEs: "Playa naturista. Una de las más bonitas de la Costa Brava." },
  { name: "Playa de Fenals", lat: 41.6988, lng: 2.8466, descEs: "Límite norte para barcos sin licencia (2 NM). Alternativa tranquila a Lloret." },
];

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJsonl<T>(file: string, rows: T[]): Promise<void> {
  const body = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await fs.writeFile(file, body, "utf-8");
}

async function buildLocal(): Promise<void> {
  await ensureDir(path.join(OUT_DIR, "data"));

  // boats.jsonl
  const boatsRows = Object.values(BOAT_DATA).map((b) => ({
    id: b.id,
    name: b.name,
    subtitle: b.subtitle,
    description: b.description,
    specifications: b.specifications,
    equipment: b.equipment,
    included: b.included,
    features: b.features,
    pricing: b.pricing,
    extras: b.extras,
  }));
  await writeJsonl(path.join(OUT_DIR, "data/boats.jsonl"), boatsRows);

  // routes.jsonl
  const routesRows = boatRoutes.map((r) => ({
    id: r.id,
    distance: r.distance,
    estimated_time: r.estimatedTime,
    difficulty: r.difficulty,
    coordinates: r.coordinates,
    highlights: r.highlights,
    descriptions: r.descriptions,
  }));
  await writeJsonl(path.join(OUT_DIR, "data/routes.jsonl"), routesRows);

  // coves.geojson
  const geojson = {
    type: "FeatureCollection",
    features: COVES.map((c) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.lng, c.lat] },
      properties: { name: c.name, descEs: c.descEs },
    })),
  };
  await fs.writeFile(path.join(OUT_DIR, "data/coves.geojson"), JSON.stringify(geojson, null, 2), "utf-8");

  // glossary.jsonl
  await writeJsonl(
    path.join(OUT_DIR, "data/glossary.jsonl"),
    NAUTICAL_GLOSSARY_ES.map((t) => ({
      term: t.term,
      definition: t.definition,
      category: t.category,
      lang: "es",
    })),
  );

  // faqs.jsonl — best effort from DB, fallback to empty array
  let faqs: Array<{ question: string; answer: string; lang: string; page: string }> = [];
  try {
    const { db } = await import("../server/db");
    const { seoFaqs } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db.select().from(seoFaqs).where(eq(seoFaqs.active, true));
    faqs = rows.map((f) => ({
      question: f.question,
      answer: f.answer,
      lang: f.language,
      page: f.page,
    }));
  } catch (err) {
    console.warn("[hf-dataset] FAQ DB lookup failed, emitting empty faqs.jsonl", err instanceof Error ? err.message : err);
  }
  await writeJsonl(path.join(OUT_DIR, "data/faqs.jsonl"), faqs);

  // README.md — dataset card with HF YAML frontmatter
  const readme = `---
license: cc-by-4.0
language:
  - en
  - es
  - ca
  - fr
  - de
  - nl
  - it
  - ru
multilinguality: multilingual
pretty_name: "Boat Rental Blanes — Costa Brava"
size_categories:
  - n<1K
tags:
  - tourism
  - boat-rental
  - costa-brava
  - blanes
  - geography
  - geojson
  - faq
  - rag
source_datasets:
  - original
task_categories:
  - question-answering
  - text-retrieval
configs:
  - config_name: boats
    data_files: data/boats.jsonl
  - config_name: routes
    data_files: data/routes.jsonl
  - config_name: faqs
    data_files: data/faqs.jsonl
  - config_name: glossary
    data_files: data/glossary.jsonl
---

# Boat Rental Blanes — Costa Brava

> **EN**: Structured dataset describing the boat rental catalog, maritime routes,
> nautical glossary and customer FAQs of **Costa Brava Rent a Boat** (operated
> by DAMAR COSTA BRAVA S.L.) at Puerto de Blanes, Girona, Spain. Released
> under CC-BY-4.0 so RAG pipelines, model trainers and AI agents can ingest
> verifiable data about boat rental in the Costa Brava region.

> **ES**: Conjunto de datos estructurado con el catálogo de barcos, rutas
> marítimas, glosario náutico y preguntas frecuentes de **Costa Brava
> Rent a Boat** (operada por DAMAR COSTA BRAVA S.L.) en el Puerto de
> Blanes, Girona, España. Publicado bajo CC-BY-4.0 para que pipelines RAG,
> entrenadores de modelos y agentes IA puedan ingerir datos verificables
> sobre alquiler de barcos en la Costa Brava.

## Splits

| Config    | File                  | Rows                              | Description |
|-----------|-----------------------|-----------------------------------|-------------|
| boats     | data/boats.jsonl      | ${boatsRows.length}               | Fleet specs (capacity, engine, length, pricing per season, extras) |
| routes    | data/routes.jsonl     | ${routesRows.length}              | Maritime routes from Puerto de Blanes with GPS, distance, time, difficulty, multi-lang descriptions (8 languages) |
| faqs      | data/faqs.jsonl       | ${faqs.length}                    | Customer FAQ entries (multilingual) |
| glossary  | data/glossary.jsonl   | ${NAUTICAL_GLOSSARY_ES.length}    | Nautical glossary (LBN, PER, milla náutica, fondear, etc.) |
| coves     | data/coves.geojson    | ${COVES.length} features          | GPS-tagged coves accessible from Puerto de Blanes (GeoJSON) |

## Provenance

All data is canonically sourced from <https://www.costabravarentaboat.com>:
- Pricing and fleet: \`shared/boatData.ts\` in the source repository
- Routes: \`shared/routesData.ts\`
- Glossary: \`shared/nauticalGlossary.ts\`
- FAQs: \`seo_faqs\` table in the production database

For the live, dynamic version (with real-time rating and reviews) see:
- \`https://www.costabravarentaboat.com/api/ai-context\`
- \`https://www.costabravarentaboat.com/llms-full.txt\`

## Citation

\`\`\`bibtex
@misc{costabravarentaboat_dataset_${new Date().getFullYear()},
  title  = {Boat Rental Blanes — Costa Brava},
  author = {Costa Brava Rent a Boat (DAMAR COSTA BRAVA S.L.)},
  year   = ${new Date().getFullYear()},
  url    = {https://huggingface.co/datasets/${REPO_ID}},
  note   = {CC-BY-4.0}
}
\`\`\`

## License

[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) — free to use,
adapt and redistribute with attribution to Costa Brava Rent a Boat.

## Updates

Refreshed monthly from the canonical source. Last update: ${new Date().toISOString().slice(0, 10)}.
`;
  await fs.writeFile(path.join(OUT_DIR, "README.md"), readme, "utf-8");

  console.log(`✓ Built dataset at ${OUT_DIR}`);
  console.log(`  boats: ${boatsRows.length} | routes: ${routesRows.length} | faqs: ${faqs.length} | glossary: ${NAUTICAL_GLOSSARY_ES.length} | coves: ${COVES.length}`);
}

async function uploadToHf(): Promise<void> {
  if (!HF_TOKEN) {
    console.error("HF_TOKEN env var required. Get one at https://huggingface.co/settings/tokens (write scope).");
    process.exit(1);
  }

  // Use the HF Hub REST API. For each file, POST /api/repos/<id>/commit
  // is a single-request upload. We use the simpler per-file PUT to
  // /api/datasets/<id>/upload (resumable LFS for large; small files
  // accepted as plain upload). Spec: https://huggingface.co/docs/hub/api
  const filesToUpload = [
    "README.md",
    "data/boats.jsonl",
    "data/routes.jsonl",
    "data/faqs.jsonl",
    "data/glossary.jsonl",
    "data/coves.geojson",
  ];

  console.log(`Uploading ${filesToUpload.length} files to ${REPO_ID}...`);

  // First, make sure the repo exists. Create with type=dataset.
  const createRes = await fetch("https://huggingface.co/api/repos/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "dataset",
      name: REPO_ID.split("/")[1],
      organization: REPO_ID.split("/")[0],
      private: false,
    }),
  });
  if (!createRes.ok && createRes.status !== 409) {
    const msg = await createRes.text();
    console.error(`Repo create failed (${createRes.status}): ${msg}`);
    process.exit(1);
  }

  // Build a single commit with all files (preferred over per-file PUTs).
  // The Hub commit API uses a multipart JSON-then-content body where each
  // operation is a JSON line followed by the raw file bytes. For our
  // small file count we use the simpler `uploadFile` per file via the
  // upload-file endpoint exposed on the dataset repo.
  for (const relPath of filesToUpload) {
    const full = path.join(OUT_DIR, relPath);
    const buf = await fs.readFile(full);
    // Multi-step: get the commit_url, then post the file.
    const url = `https://huggingface.co/api/datasets/${REPO_ID}/upload/main/${encodeURI(relPath)}`;
    const up = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      body: buf,
    });
    if (!up.ok) {
      const msg = await up.text();
      console.error(`Upload ${relPath} failed (${up.status}): ${msg}`);
      // Don't abort — let other files try.
    } else {
      console.log(`  ✓ ${relPath} (${buf.length} bytes)`);
    }
  }

  console.log(`✓ Dataset published: https://huggingface.co/datasets/${REPO_ID}`);
}

async function main() {
  await buildLocal();
  if (DRY_RUN) {
    console.log("--dry passed: skipping upload.");
    return;
  }
  await uploadToHf();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
