---
type: edit
priority: P0
expected_output: both
---

# SEO SPRINT PHASE 1 — Multi-stream

## Objetivo

Sprint masivo SEO de máxima palanca antes de temporada peak (37 días). 4 streams simultáneos, todos con commits separados pero ejecutados en una sola sesión.

## Streams

### Stream A — Title + Meta optimization (top 20 páginas ES)
### Stream B — Schema/JSON-LD completion (FAQ + AggregateOffer + Service)
### Stream C — Crear página `/es/alquiler-barcos-platja-daro`
### Stream D — Internal linking matrix (subset 30 páginas más importantes)

---

## STREAM A — Title + Meta optimization

### Fase 1 — Discovery

```bash
# Top 20 páginas ES por impresiones GSC (últimos 90d):
1.  /es/                                              # 16k+ imp, home
2.  /es/alquiler-barcos-blanes                        # alta demanda local
3.  /es/alquiler-barcos-lloret-de-mar                 
4.  /es/alquiler-barcos-tossa-de-mar
5.  /es/alquiler-barcos-costa-brava                   # pillar
6.  /es/barcos-sin-licencia                           # pillar diferenciador
7.  /es/barco/solar-450
8.  /es/barco/remus-450
9.  /es/barco/astec-400
10. /es/barco/pacific-craft-625
11. /es/precios
12. /es/rutas
13. /es/faq
14. /es/sobre-nosotros
15. /es/blog/alquiler-barco-sin-licencia-blanes-guia
16. /es/blog/cuanto-cuesta-alquilar-barco-blanes-precios
17. /es/blog/comparativa-barcos-sin-licencia-blanes
18. /es/blog/preguntas-frecuentes-alquiler-barco-sin-licencia
19. /es/blog/mejores-calas-costa-brava-en-barco
20. /es/blog/rutas-barco-desde-blanes
```

Para cada una, extraer:
- `<title>` actual
- `<meta name="description">` actual
- H1 actual
- Top 3 queries GSC que la dirigen

Reportar tabla con la situación actual.

### Fase 2 — Reglas de optimización a aplicar

**Title (≤60 chars):**
- Keyword principal en primeros 30 chars
- Incluir señal social: `4.8★` o `Reseñas Google`
- CTA implícito: `Reserva` / `desde 70€/h`
- Patrón master: `[Keyword principal] · [Señal social/precio] · CBRB`

**Meta description (150-160 chars):**
- Hook keyword en primer 1/3
- USP central: sin licencia / hasta 7 personas / 4.8★
- CTA: `Reserva online` / `Confirmación inmediata`
- Localización si aplica

**H1 (1 por página, ≤70 chars):**
- Coincidir 1:1 con keyword principal
- Evitar duplicados con title

### Fase 3 — Aplicar cambios

Aplicar las nuevas titles/metas/H1 según las reglas. NO dejar duplicados entre páginas.

**Validación:**
- `npx tsc --noEmit` → 0
- Build verde
- Cada title <60, meta <160, H1 <70

**Commit:**
```
feat(seo): optimize titles + metas + H1 for top 20 ES pages

GSC 90d showed top pages with high impressions but suboptimal CTR
(many <3% at positions 1-15). Optimizations:

- Title pattern: [Keyword] · 4.8★ · [Differentiator]
- Meta hooks: 4.8★ · 310 reseñas · sin licencia · CTA
- H1 1:1 keyword match

Char limits enforced (title <60, meta <160, H1 <70).

Expected: +1-2pp CTR within 2-3 weeks once Google re-crawls.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

## STREAM B — Schema/JSON-LD completion

### Fase 1 — Audit current schemas

```bash
grep -rn "application/ld+json\|JSON-LD\|JsonLd\|@type" client/src/ server/seo/ shared/ --include="*.ts" --include="*.tsx" | head -50
```

Reportar qué páginas tienen qué schemas hoy.

### Fase 2 — Schemas mínimos por tipo de página

| Tipo | Schemas obligatorios |
|---|---|
| Home `/es/` | LocalBusiness · AggregateRating · AggregateOffer · FAQPage · Service |
| Location pages | LocalBusiness · GeoCoordinates · AggregateOffer · TouristAttraction |
| Boat detail | Product · Offer · AggregateRating |
| Blog posts | Article · Author · BreadcrumbList |
| FAQ page | FAQPage |
| Pricing page | OfferCatalog · AggregateOffer |

### Fase 3 — Aplicar schemas faltantes

Generar JSON-LD según la lista. Reusar `shared/seoSchemas.ts` o equivalente.

**Importante**: incluir custom dimensions que ya añadimos a GA4 si aplica:
- license_type: "sin_licencia" / "con_licencia" en Service/Offer
- price: 70/85/180 según boat

**Commit:**
```
feat(seo): complete JSON-LD schemas across page types

Added missing schemas to maximize rich snippets in SERP:
- LocalBusiness + AggregateRating + AggregateOffer on home + locations
- Product + Offer + AggregateRating on /barco/* pages
- FAQPage on /faq + relevant blog posts
- Article + Author + BreadcrumbList on /blog/* posts
- TouristAttraction on /destinos/*

Expected: rich snippets (stars, price, FAQ accordions) visible in SERP within 1-2 weeks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

## STREAM C — Crear `/es/alquiler-barcos-platja-daro`

### Justificación
- GSC 90d: query "alquiler barco sin licencia platja d'aro" = 122 impresiones / 0 clics
- No existe página → captura 0% de esa demanda
- Competidores rankean para ello → cedemos terreno

### Fase 1 — Modelo de página

Reusar template de `/es/alquiler-barcos-tossa-de-mar` (página existente similar) como base estructural.

### Fase 2 — Contenido

**URL:** `/es/alquiler-barcos-platja-daro` (+ versiones EN/FR/DE/NL/IT/CA/RU según multi-idioma actual)

**H1:** `Alquiler de Barco en Platja d'Aro · Sin Licencia desde 70€/h`

**Meta title:** `Alquiler Barco Platja d'Aro · 4.8★ · Sin Licencia 70€/h`

**Meta description:** `Alquila tu barco sin licencia rumbo a Platja d'Aro desde Blanes. 70€/h, hasta 7 personas, 4.8★ Google. Reserva online en 2 minutos.`

**Estructura del contenido (~1500 palabras):**

1. **Hero**: foto barco navegando + H1 + CTA reservar
2. **Distancia y tiempo de navegación desde Blanes a Platja d'Aro** (~17 km, ~45 min en barco sin licencia)
3. **¿Es accesible Platja d'Aro sin licencia?** — explicar rango (límite oficial es Playa de Aro a 5 millas náuticas, justo en el borde — confirmar con Ivan)
4. **Calas y atractivos por la ruta** — Cala Sant Pol, Cala dels Frares, Cala Sa Cova, Platja d'Aro
5. **Recomendaciones de duración**: 4h mínimo recomendado, 8h ideal
6. **Barcos compatibles** (linkear a 3-4 boats sin licencia con la autonomía suficiente)
7. **FAQ específicas**:
   - ¿Cuánto cuesta llegar a Platja d'Aro en barco?
   - ¿Hay que tener licencia para llegar?
   - ¿Cuánto se tarda?
   - ¿Hay restaurantes accesibles?
8. **Booking widget embebido**
9. **Testimonios** (reusar 2-3 existentes filtrados por destino si los hay)

### Fase 3 — Schemas + multi-idioma

- LocalBusiness + AggregateRating
- TouristTrip schema
- Multi-idioma versiones (EN/FR/DE/NL/IT/CA/RU) según patrón actual de location pages

**⚠️ Importante**: confirmar con Ivan ANTES de publicar — Platja d'Aro está justo en el límite del rango sin licencia. Si la realidad es que necesita licencia, ajustar copy. Memoria dice rango sin licencia = "hasta Fenals (Lloret)", con licencia "no pasar de Playa de Aro". Por tanto Platja d'Aro = **con licencia** o pack especial.

→ El brief asume la página vende **alquiler de barco con licencia** para Platja d'Aro, no sin licencia. Re-orientar el contenido a reflejar eso.

**Commit:**
```
feat(seo): create /es/alquiler-barcos-platja-daro page (+i18n)

GSC 90d showed 122 impressions for "alquiler barco platja d'aro"
queries with no landing page existing. Created location page targeting
that demand with proper schema, ~1500 words content, and booking CTA.

Notes:
- Platja d'Aro is within range only with license OR via 8h pack
- Page emphasizes con-licencia and charter options
- TouristTrip schema for ride from Blanes
- Multi-idioma versions added (EN/FR/DE/NL/IT/CA/RU)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

## STREAM D — Internal linking matrix (subset 30 páginas)

### Fase 1 — Implementar reglas de linking

Por cada page, asegurar:

**Location pages (`/es/alquiler-barcos-{ciudad}`):**
- Link a 3-5 calas accesibles
- Link a 2 boats compatibles
- Link a 1 blog post de ruta sugerida
- Link al pillar `/es/alquiler-barcos-costa-brava`

**Boat detail pages (`/es/barco/*`):**
- Link a `/es/barcos-sin-licencia` o `/es/barcos-con-licencia` según corresponda
- Link a 2 location pages compatibles
- Link a 1 experience page
- Link a 1 boat hermano comparable

**Blog posts (`/es/blog/*`):**
- Link a 1 service/money page (la más relevante)
- Link a 2 blog posts hermanos del cluster
- Link a 1 boat page si hay match

**Pillar pages:**
- Link a top 5 supporting cada uno

### Fase 2 — Anchor text reglas

- NO usar "click aquí" / "más info"
- USAR keywords semánticas: "alquiler barco sin licencia", "barcos para 7 personas", "Solar 450 sin licencia"
- Variar anchor text para evitar over-optimization (Google penaliza)

### Fase 3 — Implementación

Crear `shared/internalLinks.ts` (o equivalente) con la matriz de linking.
Aplicar via component o markdown rendering.

**Commit:**
```
feat(seo): internal linking matrix across 30 priority pages

Added semantic internal links to top 30 ES pages following cluster
structure (5 pillars: destino, sin licencia, barco, experiencia, info).

Linking rules:
- Location pages → 3-5 calas + 2 boats + 1 blog ruta + pillar
- Boat pages → license type + 2 locations + 1 experience + 1 hermano
- Blog posts → 1 money page + 2 hermanos + 1 boat (if match)
- Pillars → top 5 supporting each

Anchor text varied with semantic keywords to avoid over-optimization.

Expected: improved crawl depth + topical authority over 4-8 weeks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

## Reglas globales del sprint

- 4 commits separados (uno por stream)
- Cada commit pasa tsc + build
- Push a main al final
- NO publicar (Ivan hace Republish manual)
- Si encuentras config previa que contradice esto, PARA y reporta

## Reporte esperado al terminar

```markdown
# Outbox — SEO Sprint Phase 1

## Status: SUCCESS | PARTIAL | BLOCKED

## Stream A — Title/Meta
- Páginas optimizadas: N
- Commit hash: <hash>
- Char limit violations: 0

## Stream B — Schema
- Schemas añadidos: N
- Tipos cubiertos: <lista>
- Commit hash: <hash>

## Stream C — Playa de Aro
- Página creada: ✓
- Idiomas: 7
- Commit hash: <hash>

## Stream D — Internal linking
- Páginas tocadas: N
- Links añadidos totales: N
- Commit hash: <hash>

## Push a main: ✓
## Pendiente Republish: Ivan
```

---

## Tiempo estimado: 90-120 min de trabajo Claude Code
