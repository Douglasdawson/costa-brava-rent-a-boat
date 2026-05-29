# Auditoría profunda SEO + GEO — 29 mayo 2026

**Autor:** Claude (Opus 4.8), con encargo de Iván
**Alcance:** todo el sistema SEO y GEO de costabravarentaboat.com
**Objetivo:** máxima exigencia — detectar toda mejora (por pequeña que sea), explorar frentes no
atacados y trazar un roadmap para ser imbatible ante la competencia.
**Método:** lectura directa del código (no asunciones). Cada hallazgo cita archivo/evidencia.
**Programa de referencia:** `docs/plans/2026-04-17-seo-domination-program-design.md` (26 semanas, 6 batallas).

---

## 1. Resumen ejecutivo

**Veredicto:** el sistema NO tiene un problema de infraestructura. La capa técnica es **A+** y la
superficie GEO va **por delante** de toda la competencia local. El problema es de **activación,
profundidad de contenido y ejecución de batallas pendientes** del programa de abril. Dicho claro:
tienes un Ferrari con medio depósito y dos marchas sin estrenar.

Las tres palancas, por orden de retorno:

1. **Activación (máximo ROI, casi sin código).** Faltan credenciales en producción que dejan
   dormidos: SERP tracking, intel de competidores, detección de AI-overview, **monitorización GEO
   (Perplexity)** e IndexNow. Encenderlas convierte el sistema de "ciego" a "instrumentado" en días.
2. **Contenido (alto).** Páginas finas (rutas, precios), FAQs poco citables, y **fuga internacional**
   (3 páginas de ubicación con español hardcoded + prerender solo-ES + FAQ autogeneradas solo-ES).
3. **Frontera (medio-alto).** Batallas enteras del programa sin construir: **Programmatic SEO** y
   **Video**; y schemas que las IAs adoran y aún no emitimos (HowTo, Trip, Q&A, Review granular).

### Scorecard por área

| Área | Nota | Veredicto |
|---|---|---|
| Técnico (crawl, render, sitemaps, hreflang, CWV) | **9/10** | Excelente. Único pero: prerender solo-ES. |
| Datos / Autopilot (ingest, MCP, clustering) | **8/10** | Arquitectura sólida; mitad dormida por credenciales. |
| GEO (superficie + instrumentación) | **8/10** técnico / **5/10** contenido | Plumbing de élite; contenido no optimizado para cita. |
| Contenido on-page | **6/10** | Bien estructurado pero fino donde más importa. |
| Internacional (FR/DE/NL/IT) | **5/10** | Pico de turismo desatendido: render + i18n + FAQ. |
| Autoridad / off-page | **5/10** | Semi-manual; pipeline existe (`distribution_tray`), poco usado. |
| Capa autónoma | **7/10** | Potente y EN VIVO; faltan gates de gobernanza y cierre de loop. |

---

## 2. Inventario de activos (lo que NO hay que reconstruir)

**Técnico.** Sitemaps dinámicos index + pages/boats/blog/destinations con hreflang 8 idiomas y
x-default→es (`server/routes/sitemaps.ts`); `robots.txt` dinámico con allowlist explícito de ~23
crawlers IA (`server/routes/robots.ts`); canonical self-ref + hreflang inyectados server-side
(`server/seoInjector.ts`); prerender Playwright (`scripts/prerender.ts` + middleware
`server/prerenderedMiddleware.ts`); IndexNow multi-motor Bing/Yandex/seznam + WebSub
(`server/seo/indexnow.ts`); CWV real-user `/api/cwv-beacon` + PSI lab; scheduler con ~12 jobs
(`server/services/schedulerService.ts`, `server/seo/worker.ts`).

**Datos / Autopilot.** MCP `seo-autopilot` con 14 tools + auth por token + audit
(`server/mcp/seo-autopilot/tools.ts`); colectores GSC, GSC-queries, GA4 daily + conversions, SERP +
snapshots + features (incl. AI-overview), competidores, CWV, PSI, URL-inspection
(`server/seo/collectors/*`); **clustering + intent rule-based multiidioma** (`collectors/gsc.ts`);
GBP rating/reviews vía Places API (`server/services/gbpSync.ts`).

**Capa autónoma.** `server/seo/strategist/` (agent/briefing/parser) genera decisiones diarias vía
Claude; `server/seo/executors/` las **aplica en vivo** (meta, FAQ, internal-link, schema, freshness);
`analyzers/` (cannibalization, orphans); `feedback/` (experiments, revenue); `pilotRunner.ts` (A/B);
`alerts/` (engine + Telegram + WhatsApp).

**GEO (por delante del sector).** `/llms.txt` + localizados + `/llms-full.txt`; `ai-citations.tsx`
(58 facts anclables con #id); `/api/ai-context`, `/api/ai-search`, `/api/ai-glossary`; MCP público +
`/openapi.json` + `/.well-known/agent.json`; `/feed-llms.json`; **logging de visitas de bots IA**
(`server/storage/aiBotVisits.ts`, `server/lib/aiBotLogger.ts`, `aiBotRateLimit.ts`);
`server/services/aiMentionsMonitor.ts` + `citationExperiments.ts`; 12 tipos de JSON-LD
(`client/src/utils/seo-schemas.ts`).

---

## 3. Hallazgos por severidad

### 🔴 CRÍTICO

> **Actualización 29-may (auditoría de Secrets de Replit, Workspace ↔ Deployment):** la paridad
> resultó **mejor de lo previsto**. GA4 (`GA4_MEASUREMENT_ID` + `GA4_API_SECRET`), PSI
> (`PAGESPEED_API_KEY`), Google SA, GSC y Places están presentes en **ambos** entornos. El gap real
> se reduce a **3 claves ausentes en los dos entornos**: `VALUESERP_API_KEY`, `PERPLEXITY_API_KEY`,
> `INDEXNOW_KEY`.

**C1 — Tres pipes dormidos por claves de API ausentes.** Faltan (en Workspace y Deployment):
- `VALUESERP_API_KEY` → sin él: **cero** SERP tracking, rankings de competidores y detección de
  AI-overview. (Cuenta de pago en valueserp.com.)
- `PERPLEXITY_API_KEY` → sin él: **GEO sin medición** (`aiMentionsMonitor` + `citationExperiments`
  inertes). (API de pago en perplexity.ai.)
- `INDEXNOW_KEY` → sin él: indexación lenta. **Es gratis**: poner cualquier UUID/hex de 32 chars y el
  servidor ya publica `/<clave>.txt` automáticamente (`server/routes/sitemaps.ts:185`,
  `server/seo/indexnow.ts:41`). Win inmediato de cero coste.

*Acción:* añadir las 3 a Workspace **y** Deployment. IndexNow ahora mismo; las otras dos cuando se
decidan los proveedores de pago.

**C2 — RESUELTO a nivel de entorno; pendiente confirmar disparo.** Los eventos server-side
`generate_lead` y `booking_request_submitted` (`server/lib/analyticsServer.ts`) ya tienen
`GA4_MEASUREMENT_ID` + `GA4_API_SECRET` en producción. Queda **verificar que disparan de verdad** vía
GA4 DebugView / Realtime con una reserva de prueba (env presente ≠ evento llegando).

### 🟠 ALTO

**A1 — Fuga internacional triple en el pico de turismo.** El programa prioriza FR/DE/NL/IT para
julio-agosto, pero:
- `location-tordera.tsx`, `location-palafolls.tsx`, `location-pineda-de-mar.tsx` tienen **español
  hardcoded en JSX** (deuda i18n documentada en CLAUDE.md) → no se propaga a otros idiomas.
- El **prerender cubre solo ES + 2 slugs EN** (`scripts/prerender-manifest.json`, 24 entradas): las
  páginas de ubicación/categoría/actividad ahora indexables en 8 idiomas **no se prerenderan** y
  dependen del render JS del bot.
- El executor `addFaq` **hardcodea `language: "es"`** (`server/seo/executors/faq.ts`): toda FAQ
  autogenerada es solo española.

**A2 — Thin content en páginas de intención.** `routes.tsx` es casi solo mapa Leaflet sin prosa;
`pricing.tsx` es tabla sin narrativa (por qué varían temporadas, cómo elegir); FAQs con respuestas
de 1-3 líneas. Estas son páginas con intención transaccional/informacional alta.

**A3 — Batallas del programa sin construir.** **Programmatic SEO (batalla 5):** no existe matriz
`boat × location × duration × occasion × language` → long-tail masivo sin atacar. **Video/YouTube
(batalla 3):** solo referencias a VideoObject en config, sin canal ni páginas.

### 🟡 MEDIO

**M1 — GEO: contenido no optimizado para cita.** Superficie técnica excelente pero faltan los schemas
que las IAs citan: **Q&A conversacional, HowTo, Trip/Itinerary (rutas), Review granular**. Los FAQs no
son atómicos/conversacionales. `seo-schemas.ts` cubre 12 tipos pero ninguno de estos.

**M2 — Instrumentación GEO dormida.** `aiMentionsMonitor.ts` + `citationExperiments.ts` existen pero
necesitan `PERPLEXITY_API_KEY` (ver C1). Activarlos da el **KPI real de GEO**: share-of-voice en
respuestas de IA — métrica que ningún competidor local mide.

**M3 — Gobernanza de la capa autónoma.** `executors/runner.ts` aplica cambios **en vivo a la DB**
(meta/FAQ/schema/links) con cap semanal pero **sin gate de aprobación humana ni rollback visible** más
allá de la tabla de experiments. Riesgo: cambios automáticos no supervisados en SEO de producción.
*Acción:* añadir modo dry-run/aprobación + log de rollback.

**M4 — Pipes secundarios sin cablear.** GBP Performance (views/calls/directions): solo scaffold OAuth.
Bing Webmaster: scaffold OAuth, ingest no cableado (era item de semana 1 del programa).

**M5 — Clústeres topicales falsos.** `RelatedContent.tsx` es un dict manual, no un clúster
pillar/topic real con jerarquía. Los enlaces internos existen pero no forman autoridad topical.

### 🟢 BAJO

**B1 — Calidad editorial del blog autopilot.** Generación 100% IA sin garantía de originalidad
investigativa; riesgo de contenido genérico/duplicable a escala.

**B2 — Glosario `DefinedTermSet` corto** (18 términos). Ampliable a 50+ para más cobertura citable.

**B3 — Sellos `dateModified` visibles** y bios de patrón (E-E-A-T) ausentes en páginas clave.

---

## 4. Gap de ejecución vs. SEO Domination Program (abril 2026)

| Batalla | Estado | Evidencia |
|---|---|---|
| 1 — Web técnica + contenido | **Parcial** | Titles/meta y fix canibalización hechos; thin content y i18n de 3 ubicaciones pendientes (A1, A2). |
| 2 — Google My Business | **Parcial** | Rating/reviews vía Places ✅; Performance API y posts/Q&A/review-engine pendientes (M4). |
| 3 — Video / YouTube | **No iniciado** | Solo VideoObject en config (A3). |
| 4 — GEO | **Avanzado** | Superficie técnica completa; falta capa de contenido citable + activar medición (M1, M2). |
| 5 — Programmatic SEO | **No iniciado** | Sin matriz de páginas (A3). |
| 6 — Link building | **Parcial/manual** | `distribution_tray` disponible, ejecución semi-manual por verificar. |

---

## 5. Frontera no atacada (oportunidades nuevas)

- **GEO share-of-voice como disciplina.** Medir y optimizar citaciones en ChatGPT/Perplexity/AI
  Overviews con `aiMentionsMonitor` + `citationExperiments`. Foso defendible — nadie local lo hace.
- **Programmatic de calas y rutas reales.** Cada cala (`generateCovesItemListSchema` ya tiene coords,
  distancia, tiempo) puede ser página con Trip/Place schema → captura "ruta en barco a [cala]".
- **Schemas premium:** HowTo ("cómo alquilar sin licencia paso a paso"), Trip/Itinerary por ruta,
  Review individual + AggregateRating granular, Event de salidas/disponibilidad.
- **Entidad / Knowledge Graph:** `businessProfile.ts` ya tiene Wikidata QID/OSM — reforzar señales de
  entidad (`sameAs`, `knowsAbout`) para que Google/IA reconozcan la marca como entidad náutica local.
- **Prerender internacional:** extender `prerender-manifest.json` a los 8 idiomas de las páginas
  indexables → HTML completo para todo bot, no solo los que renderizan JS.

---

## 6. Roadmap secuenciado (impacto / esfuerzo)

**Fase 0 — Activación y verdad (semana 1, ~0 código).**
*Estado tras auditoría de Secrets (29-may):* GA4/PSI/Google ya presentes en prod. Quedan **3 claves**:
añadir `INDEXNOW_KEY` ya (gratis); decidir y añadir `VALUESERP_API_KEY` + `PERPLEXITY_API_KEY`.
Confirmar disparo de eventos GA4 lead+booking en prod (DebugView). Cablear Bing WMT + GBP Performance
(OAuth). Correr `analyzers/cannibalization.ts` + `orphans.ts` y actuar. Snapshot baseline de KPIs.
→ *Desbloquea toda la medición + intel de competencia + GEO.* Aborda C1, C2, M4.

**Fase 1 — Quick wins on-page (semanas 1-2).**
Terminar migración i18n de tordera/palafolls/pineda → `es.ts` + `npm run i18n:translate`. Extender
prerender a 8 idiomas. Hacer el executor `addFaq` multiidioma. Enriquecer `routes.tsx` (prosa + Trip
schema) y `pricing.tsx` (narrativa estacional). Profundizar FAQs a respuestas atómicas + schema
Q&A/Speakable. Aborda A1, A2.

**Fase 2 — Capa de contenido GEO (semanas 2-5).**
Fact-hub conversacional ampliado; schemas HowTo / Trip-Itinerary / Review granular; E-E-A-T (bios de
patrón + `dateModified` visible); glosario a 50+ términos. **Activar `aiMentionsMonitor` +
`citationExperiments`** para medir share-of-voice IA. Aborda M1, M2, B2, B3.

**Fase 3 — Programmatic + clústeres (semanas 4-8).**
Matriz programmatic de alta calidad (batalla 5) con guardrails anti-thin (noindex auto si bounce>80%
o tiempo<10s); pillar/cluster topical real; cobertura del executor `internalLink`. Aborda A3
(programmatic), M5.

**Fase 4 — Autoridad + video (continuo).**
Pipeline citations/partnerships vía `distribution_tray`; vídeo slideshow + VideoObject (batalla 3);
motor de captación de reviews (depende de activar WhatsApp/email — ambos dormidos; cross-ref, no
reconstruir). Aborda A3 (video), batalla 6.

**Fase 5 — Endurecer loop autónomo + KPIs (continuo).**
Añadir gate dry-run/aprobación + rollback a `executors/` (M3); cerrar atribución `feedback/revenue.ts`
(ranking→reserva); briefing semanal del strategist vivo; verificar routing de alertas Telegram/WhatsApp;
dashboard de KPIs vs milestones del programa.

---

## 7. KPIs y verificación

**KPIs (vs milestones del programa de abril).** Impresiones/CTR GSC; posiciones de keywords target
(top10→top3); **GEO share-of-voice** (nuevo, vía `aiMentionsMonitor`); booking-requests orgánicos
atribuidos; views/actions GBP; reviews/mes; rating ≥4.8.

**Verificación técnica.**
- *Datos:* `POST /api/admin/autopilot/collect/{gsc-queries,ga4-daily,serp-snapshots,psi}` → comprobar
  que pueblan tablas; tools MCP `autopilot_overview` / `autopilot_serp_features`.
- *Schema:* Google Rich Results Test + validator de Schema.org sobre el JSON-LD nuevo.
- *GEO:* `curl` con UA de bot a `/llms.txt`, `/api/ai-context`, `/feed-llms.json`; confirmar HTML
  prerenderizado por idioma; revisar `aiBotVisits` para tráfico de crawlers IA.
- *Rendimiento:* PSI/Lighthouse mobile+desktop home + ubicaciones; `GET /api/admin/cwv-summary`.
- *Código:* `npm run check` (~2 min), `npm test`, `npm run i18n:validate` tras tocar `es.ts`.

---

*Próximo paso recomendado: Fase 0 (activación). Es la de mayor retorno y casi sin código — solo
depende de rellenar credenciales en Replit y verificar disparos. Sin ella, el resto se ejecuta a
ciegas.*
