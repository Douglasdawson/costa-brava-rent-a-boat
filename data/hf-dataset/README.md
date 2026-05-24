---
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
| boats     | data/boats.jsonl      | 9               | Fleet specs (capacity, engine, length, pricing per season, extras) |
| routes    | data/routes.jsonl     | 5              | Maritime routes from Puerto de Blanes with GPS, distance, time, difficulty, multi-lang descriptions (8 languages) |
| faqs      | data/faqs.jsonl       | 0                    | Customer FAQ entries (multilingual) |
| glossary  | data/glossary.jsonl   | 18    | Nautical glossary (LBN, PER, milla náutica, fondear, etc.) |
| coves     | data/coves.geojson    | 8 features          | GPS-tagged coves accessible from Puerto de Blanes (GeoJSON) |

## Provenance

All data is canonically sourced from <https://www.costabravarentaboat.com>:
- Pricing and fleet: `shared/boatData.ts` in the source repository
- Routes: `shared/routesData.ts`
- Glossary: `shared/nauticalGlossary.ts`
- FAQs: `seo_faqs` table in the production database

For the live, dynamic version (with real-time rating and reviews) see:
- `https://www.costabravarentaboat.com/api/ai-context`
- `https://www.costabravarentaboat.com/llms-full.txt`

## Citation

```bibtex
@misc{costabravarentaboat_dataset_2026,
  title  = {Boat Rental Blanes — Costa Brava},
  author = {Costa Brava Rent a Boat (DAMAR COSTA BRAVA S.L.)},
  year   = 2026,
  url    = {https://huggingface.co/datasets/costabravarentaboat/boat-rental-blanes},
  note   = {CC-BY-4.0}
}
```

## License

[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) — free to use,
adapt and redistribute with attribution to Costa Brava Rent a Boat.

## Updates

Refreshed monthly from the canonical source. Last update: 2026-05-24.
