# AI discoverability — pasos manuales pendientes

Tres acciones que cierran el roadmap "máximo nivel". Cada una vive en una
herramienta externa, ninguna se puede automatizar desde el repo. Tiempo
total estimado: ~75 min en una sola tarde.

---

## 1. Wikidata QID (~30 min)

**Por qué importa**: Wikidata alimenta directamente el Google Knowledge
Panel, la Bing Knowledge Box y la entidad-resolución de ChatGPT / Claude
/ Perplexity. Sin QID, las IAs tienen que reconstruir la entidad cada
vez desde sameAs[] y a veces nos confunden con "Rent a Boat Blanes".

### Pasos

1. Crear cuenta en https://www.wikidata.org/wiki/Special:CreateAccount
2. Una vez logueado, ir a https://www.wikidata.org/wiki/Special:NewItem
3. **Label (en)**: `Costa Brava Rent a Boat`
4. **Label (es)**: `Costa Brava Rent a Boat`
5. **Description (en)**: `Boat rental company based at Puerto de Blanes, Costa Brava, Spain. Operates a 9-boat fleet (license-free and licensed). Operated by DAMAR COSTA BRAVA S.L.`
6. **Description (es)**: `Empresa de alquiler de barcos en el Puerto de Blanes, Costa Brava, España. Flota de 9 barcos (sin licencia y con licencia). Operada por DAMAR COSTA BRAVA S.L.`
7. Aliases (en+es): `DAMAR COSTA BRAVA S.L.`, `Costa Brava Rent a Boat Blanes`
8. **Add statement** — añade estas propiedades:

| Property | Value |
|---|---|
| P31 — instance of | Q4830453 (business) |
| P17 — country | Q29 (Spain) |
| P131 — located in admin. entity | Q15303 (Blanes) |
| P856 — official website | `https://www.costabravarentaboat.com` |
| P625 — coordinate location | `41.6722504, 2.7978625` |
| P1278 — Legal Entity Identifier (si lo tenéis) | (skip si no) |
| P2814 — CIF number (Spanish company ID) | `B22566327` |
| P969 — street address | `Puerto de Blanes, 17300 Blanes, Girona` |
| P2002 — Instagram username | `costabravarentaboat` |
| P2003 — TikTok username | `costabravarentaboat` |
| P2013 — Facebook ID | `costabravarentaboat` |
| P646 — Freebase ID (si Google KG lo tiene) | (skip — solo si conoces el `/m/xxx`) |

9. Click **Publish**. Verás el ítem en una URL tipo
   `https://www.wikidata.org/wiki/Q123456789`
10. **Copia el QID** (parte `Q123456789`) y pásamelo en chat — yo lo pongo
    en `shared/businessProfile.ts` → `BUSINESS_WIKIDATA_QID`, commit + push,
    y se propaga automáticamente a `/api/ai-context` graph (sameAs +
    identifier) y a `/.well-known/agent.json`.

### Bonus opcional

- Edita el artículo de Wikipedia https://es.wikipedia.org/wiki/Blanes
  (sección "Puerto" o "Economía") para mencionar el puerto deportivo y
  añadir referencia al QID. Backlink desde Wikipedia es señal premium.

---

## 2. Hugging Face Dataset — publish

**Por qué importa**: apostamos a aparecer en filtros de calidad estilo
FineWeb para futuros corpus de training. CC-BY-4.0 garantiza atribución.
Pionero absoluto en hospitality SMB.

### Pasos en Replit Shell (no en tu Mac — desde aquí la DB no es alcanzable)

1. Crear cuenta en https://huggingface.co/join (si no tienes)
2. Crear organización `costabravarentaboat`:
   https://huggingface.co/organizations/new
   - Si el nombre está cogido, ajustar el `REPO_ID` del script (línea 27
     de `scripts/publish-hf-dataset.ts`) a tu username personal.
3. Generar token write:
   https://huggingface.co/settings/tokens → "New token" → role: **Write**
4. **Replit** → Tools → Secrets → añadir `HF_TOKEN` = `hf_xxx`
5. Replit → Shell:
   ```bash
   HF_TOKEN=$HF_TOKEN npx tsx scripts/publish-hf-dataset.ts
   ```
   (Tarda ~10 segundos. Crea el repo si no existe, sube los 5 archivos.)
6. Verifica:
   https://huggingface.co/datasets/costabravarentaboat/boat-rental-blanes

### Refresco mensual (opcional)

Puedes meter una tarea cron Replit que ejecute el script el día 1 de
cada mes. Coste ~$0 — el upload es gratis.

### Si algo falla

- `Repo create failed (409)` → el repo ya existe, eso es OK, sigue.
- `Upload failed (401)` → el token no tiene scope write. Re-genera.
- `Upload failed (404)` → el organization name no existe. Ajusta `REPO_ID`.

---

## 3. mcp.run registry submission (~5 min)

**Por qué importa**: mcp.run es el primer registry público vivo de MCP
servers. Estar allí significa que cualquier usuario de Claude Desktop,
Cursor o Continue puede descubrirnos cuando busca herramientas para
"boat rental" o "tourism".

### Pasos

1. Cuenta en https://www.mcp.run/
2. Click **"Add MCP Server"** o ir a https://www.mcp.run/submit
3. Rellena con este texto literal:

```
Name:
  Costa Brava Rent a Boat

Server URL:
  https://www.costabravarentaboat.com/api/mcp/public

Transport:
  HTTP (Streamable)

Authentication:
  None

Description (short, max 200 chars):
  Boat rental Puerto de Blanes (Costa Brava, Spain). 9-tool MCP for searching boats, checking availability, getting prices, and creating booking holds. Operated by DAMAR COSTA BRAVA S.L.

Description (long):
  Public MCP server for Costa Brava Rent a Boat — the largest boat rental fleet in Blanes, Spain (9 boats, license-free and licensed). The server wraps our public REST surface and exposes 9 tools agents can use natively:

  • search_boats(query, capacity, license, max_price) — filter the fleet
  • check_availability(boatId, date) — real-time slot availability
  • get_pricing_calendar(boatId, from, to, duration) — seasonal pricing with overrides
  • list_routes() — 5 maritime routes from Blanes with GPS waypoints
  • get_faq(query, lang) — multilingual FAQ search
  • search_knowledge(query) — hybrid BM25 + dense embedding search across boats, FAQs, routes, glossary, blog
  • get_business_info(lang) — canonical Schema.org JSON-LD business context
  • get_glossary() — 18 nautical terms (LBN, PER, fondear, milla náutica, etc.)
  • request_booking_hold(boatId, startTime, endTime, numberOfPeople, extras) — create a 30-minute expirable booking hold

  Public, no authentication, rate-limited to 60 req/min/IP. The single write tool only creates expirable holds — converting to a real booking still requires customer email+phone via the web form, so the abuse surface is bounded.

Tags:
  tourism, boat-rental, booking, availability, costa-brava, spain, blanes, mcp, multilingual

Languages supported:
  Spanish, English, Catalan, French, German, Dutch, Italian, Russian

Example prompts:
  • Find me a license-free boat in Blanes for 5 people in July
  • Compare prices for the Remus 450 in low season vs August
  • Can I reach Tossa de Mar without a boating license?
  • Create a booking hold for the Pacific Craft 625 on 2026-07-15 from 10:00 to 18:00 for 7 people

Documentation URLs:
  https://www.costabravarentaboat.com/openapi.json
  https://www.costabravarentaboat.com/.well-known/agent.json
  https://www.costabravarentaboat.com/.well-known/skills/booking.skill.json
  https://www.costabravarentaboat.com/llms-full.txt

Logo:
  https://www.costabravarentaboat.com/og-image.webp

Publisher contact:
  costabravarentaboat@gmail.com
```

4. Submit. Suele aprobarse en horas (revisión humana ligera).

### Otros registries

- **Continue.dev** — PR a https://github.com/continuedev/continue
  añadiendo entrada al registro de MCP servers. Igual texto que arriba.
- **Cursor Marketplace** — aún no admite HTTP MCPs sin OAuth. Cuando lo
  hagan (rumor Q2 2026), mismo texto.
- **Claude Connectors Directory** — pendiente apertura a SMBs.
