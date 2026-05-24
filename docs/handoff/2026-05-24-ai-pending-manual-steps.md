# AI discoverability — pasos manuales pendientes

Tres acciones que cierran el roadmap "máximo nivel". Cada una vive en una
herramienta externa, ninguna se puede automatizar desde el repo.

---

## 1. OpenStreetMap node (~20 min)  ⭐ recomendado sobre Wikidata

**Por qué OSM y no Wikidata**: Wikidata exige notabilidad (cobertura en
prensa, libros, enciclopedias). Una empresa local pequeña sin esa
cobertura es probable que sea marcada para borrado tras crear el ítem.
OSM **sí acepta negocios locales por diseño** (operadores legítimos
verificables sobre el terreno). Y los LLMs (ChatGPT/Claude/Perplexity)
leen OSM para entity resolution de ubicaciones físicas igual que leen
Wikidata.

### Pasos

1. Cuenta en https://www.openstreetmap.org/user/new (gratis, 2 min)
2. Ir a https://www.openstreetmap.org/edit?editor=id#map=18/41.6722504/2.7978625
   (iD editor abre directamente sobre el Puerto de Blanes con zoom 18)
3. Click sobre el punto exacto de tu oficina/caseta dentro del puerto.
   Si ya hay un nodo allí, edítalo. Si no, click derecho → **Añadir nodo**.
4. Buscar la categoría **"Alquiler de barcos"** o introducir tag
   `tourism=boat_rental` manualmente.
5. Rellenar tags (todos opcionales pero recomendados):

| Tag | Valor |
|---|---|
| `tourism` | `boat_rental` |
| `name` | `Costa Brava Rent a Boat` |
| `operator` | `DAMAR COSTA BRAVA S.L.` |
| `operator:type` | `private` |
| `brand` | `Costa Brava Rent a Boat` |
| `website` | `https://www.costabravarentaboat.com` |
| `contact:phone` | `+34611500372` |
| `contact:email` | `costabravarentaboat@gmail.com` |
| `contact:instagram` | `https://www.instagram.com/costabravarentaboat/` |
| `contact:facebook` | `https://www.facebook.com/costabravarentaboat` |
| `opening_hours` | `Apr-Oct 09:00-20:00` |
| `payment:cash` | `yes` |
| `payment:cards` | `yes` |
| `description` | `Boat rental Puerto de Blanes — 9-boat fleet, license-free and licensed, fuel included` |
| `description:es` | `Alquiler de barcos en el Puerto de Blanes — flota de 9 barcos sin/con licencia, gasolina incluida` |
| `ref:vatin` | `ESB22566327` |
| `addr:street` | `Puerto de Blanes` |
| `addr:postcode` | `17300` |
| `addr:city` | `Blanes` |
| `addr:country` | `ES` |

6. **Guardar** (botón Save arriba derecha) → escribir comentario
   "Add Costa Brava Rent a Boat (DAMAR COSTA BRAVA S.L.) at Puerto de
   Blanes" → Upload.
7. Verás una URL del nodo recién creado:
   `https://www.openstreetmap.org/node/<NUMERIC_ID>`
8. **Pásame el ID numérico** (la parte `<NUMERIC_ID>`) en chat y te lo
   enchufo en `shared/businessProfile.ts` →
   `BUSINESS_OSM_TYPE = "node"` y `BUSINESS_OSM_ID = "<ID>"`.

### Tras el push

`/api/ai-context` añadirá automáticamente:
- En `identifier[]`: `{ propertyID: "openstreetmap", value: "node/<ID>" }`
- En `sameAs[]`: `https://www.openstreetmap.org/node/<ID>`
- En `/.well-known/agent.json`: campo `openstreetmap`

OSM se propaga a Mapbox, Overture, Apple Maps (parcialmente), Bing Maps
data, y se ingiere por los crawlers de ChatGPT y Claude para entity
resolution geoespacial.

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
6. Verifica:
   https://huggingface.co/datasets/costabravarentaboat/boat-rental-blanes

### Si algo falla

- `Repo create failed (409)` → ya existe, OK, sigue.
- `Upload failed (401)` → token sin scope write. Re-genera.
- `Upload failed (404)` → org name no existe. Ajusta `REPO_ID`.

---

## 3. mcp.run registry submission (~5 min)

**Por qué importa**: mcp.run es el primer registry público vivo de MCP
servers. Estar allí significa que cualquier usuario de Claude Desktop,
Cursor o Continue puede descubrirnos.

### Pasos

1. Cuenta en https://www.mcp.run/
2. Click **"Add MCP Server"** → https://www.mcp.run/submit
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
  Public MCP server for Costa Brava Rent a Boat — the largest boat rental fleet in Blanes, Spain (9 boats, license-free and licensed). Wraps our public REST surface and exposes 9 tools agents can use natively:

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

4. Submit. Suele aprobarse en horas.

### Otros registries

- **Continue.dev** — PR a https://github.com/continuedev/continue
- **Cursor Marketplace** — aún no admite HTTP MCPs sin OAuth (rumor Q2 2026)
- **Claude Connectors Directory** — pendiente apertura a SMBs

---

## Apéndice — Wikidata (NO recomendado para SMB, pero corregido por si acaso)

Riesgo alto de borrado por política de notabilidad WD:N. Solo intentar si
encuentras cobertura significativa en prensa nacional sobre el negocio.

Si decides probar, abre https://www.wikidata.org/wiki/Special:NewItem con
estos datos VERIFICADOS (corregidos del original que tenía errores):

### Labels/descriptions/aliases (neutrales, no promocionales)

| lang | Label | Description | Aliases |
|---|---|---|---|
| es | Costa Brava Rent a Boat | Empresa de alquiler de embarcaciones recreativas con y sin titulación, con sede en el Puerto de Blanes (Girona, Cataluña, España). Nombre comercial de la sociedad DAMAR COSTA BRAVA S.L. | DAMAR COSTA BRAVA S.L.; DAMAR COSTA BRAVA; Costa Brava Rent a Boat Blanes |
| en | Costa Brava Rent a Boat | Recreational boat rental company (licensed and unlicensed boats) based at the Port of Blanes, Girona, Catalonia, Spain. Trading name of DAMAR COSTA BRAVA S.L. | DAMAR COSTA BRAVA S.L.; DAMAR COSTA BRAVA |
| ca | Costa Brava Rent a Boat | Empresa de lloguer d'embarcacions recreatives amb i sense titulació, amb seu al Port de Blanes (Girona, Catalunya). Nom comercial de la societat DAMAR COSTA BRAVA S.L. | DAMAR COSTA BRAVA S.L.; Lloguer de barques Costa Brava Blanes |
| fr | Costa Brava Rent a Boat | Société de location de bateaux de plaisance (avec et sans permis) basée au Port de Blanes (Gérone, Catalogne, Espagne). Nom commercial de DAMAR COSTA BRAVA S.L. | DAMAR COSTA BRAVA S.L.; Location de bateaux Costa Brava Blanes |

### Statements (corregidos — P/Q originales tenían errores)

| Property | Value | Notas |
|---|---|---|
| P31 instance of | Q15648901 (sociedad limitada) | Más preciso que Q4830453 |
| P17 country | Q29 (Spain) | |
| P131 located in admin entity | **Q12991 (Blanes)** | Original Q15303 era una montaña |
| P6375 street address | "Puerto de Blanes, 17300 Blanes" (lang=es) | Original P969 fue borrada |
| P625 coordinate location | 41.6722504, 2.7978625 | |
| P856 official website | https://www.costabravarentaboat.com | |
| P968 email | mailto:costabravarentaboat@gmail.com | Prefijo `mailto:` obligatorio |
| P3608 EU VAT number | ESB22566327 | Original P2814 era P-number danés |
| P452 industry | Q25384001 (boat rental) | |
| P2003 Instagram username | costabravarentaboat | Sin @ |
| P2013 Facebook username | costabravarentaboat | |
| P7085 TikTok username | costabravarentaboat | Sin @ |
| P1448 official name | "DAMAR COSTA BRAVA S.L." (lang=es) | Sustituye al P127 owned by |

**NO incluir**: P127 (owned by — circular), P2671 (Google KG ID — solo
acepta `/m/xxx`, no `ChIJ...`), año fundación (no confirmado).
