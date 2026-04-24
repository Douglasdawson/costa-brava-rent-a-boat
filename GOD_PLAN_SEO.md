# GOD PLAN SEO — Costa Brava Rent a Boat

> **Objetivo unico**: Rankear #1 en Google para todas las keywords relevantes del negocio en los 8 idiomas soportados, de forma 100% automatizada.
>
> **Horizonte**: 180 dias (6 meses) — 2026-04-20 a 2026-10-20 (temporada activa completa)
> **Modelo operativo**: Autopilot-first. El propietario no ejecuta tareas SEO manuales.
> **Version**: 1.0 — 2026-04-20

---

## 0. TL;DR (que vamos a hacer)

1. **Aprovechar** la infraestructura ya construida (motor SEO, Blog Autopilot, MCPs) y elevarla a un sistema autonomo end-to-end.
2. **Atacar 5 clusters** de keywords × 8 idiomas = ~220 keywords objetivo prioritarias.
3. **Montar 11 pipelines automaticos** que cubren tecnico, contenido, links, local, GEO (citaciones IA), CRO, experimentos, reporting.
4. **Instalar un MCP `seo-autopilot`** nuevo sobre los MCPs existentes para que Claude (Cowork) pueda orquestar todo desde fuera.
5. **Anadir un Dashboard "SEO Autopilot" en el panel CRM** para visualizar estado, rankings, tareas, alertas y revenue atribuido.
6. **Programar 14 cron tasks** que cubren el ciclo completo sin intervencion manual.

---

## 1. Estado actual (inventario)

### 1.1 Lo que YA existe (no duplicar)

**Tecnico SEO**
- Sistema SEO centralizado en `client/src/utils/seo-config.ts` (titulos, descriptions, keywords por idioma y pagina)
- Hreflang + canonicals + x-default en 8 idiomas
- Schemas JSON-LD: Organization, LocalBusiness, TouristDestination, FAQPage, Product, Service
- Sitemaps modulares en `server/routes/sitemaps.ts`
- IndexNow configurado en `server/seo/indexnow.ts`
- Circuit breaker, retry queue, audit logs, logger estructurado

**Motor SEO propio (`server/seo/`)**
- `collectors/`: gsc.ts, serp.ts, competitors.ts, cwv.ts, linkrot.ts, health.ts, geo.ts (citas IA)
- `analyzers/`: cannibalization.ts, orphans.ts
- `executors/`: meta.ts, schema.ts, faq.ts, internalLink.ts, freshness.ts, runner.ts
- `strategist/`: agent.ts + briefing.ts (estrategia con Claude API)
- `alerts/`, `feedback/`, `validators/`, `worker.ts`, `quotas.ts`

**Blog Autopilot (ya operativo)**
- Expuesto via MCP `content-server.ts` con tools: `autopilot_status`, `autopilot_configure`, `autopilot_generate_now`, `autopilot_queue`, `autopilot_history`, `autopilot_refresh_post`, `autopilot_cluster_status`
- Genera posts por clusters, programa frecuencia, refresca contenido, reporta costes

**MCPs existentes (`server/mcp/`)**
- `seo-engine-server.ts` — dashboard, keywords, competitors, campaigns, experiments, geo_status, revenue, alerts
- `content-server.ts` — blog CRUD, destinations, analytics, autopilot completo
- `business-server.ts` — datos negocio
- `chatbot-server.ts`, `sendgrid-server.ts`, `twilio-server.ts`, `ads-intelligence-server.ts`

**Trabajo previo**
- Auditoria SEO 2025 (1760 lineas)
- MASTER_PLAN.md con fases priorizadas
- Changelog SEO (bloque metadata/hreflang/canonicals completado)
- Distribucion blog "Que Llevar a un Dia de Barco" (9 piezas listas en `distribucion-blog/`)
- 3 scheduled tasks activas: keyword-research (W), rank-check (W), revision SEO/CRO (M)

### 1.2 Gaps que el plan va a cerrar

| Gap | Estado actual | Gap a cerrar |
|-----|---------------|--------------|
| Distribucion de blog posts | Manual (1 vez en Mar 2026) | Pipeline automatico por cada post |
| Link building (backlinks) | Outreach puntual manual | Pipeline continuo de outreach |
| Citaciones en IA (GEO) | Collector existe, sin accion | Pipeline de optimizacion continua |
| Google Business Profile | Optimizado 1 vez Abr 2026 | Publicaciones semanales automaticas |
| Monitorizacion competidores | Collector existe, sin actuacion | Detector de oportunidades + playbook |
| Canibalizacion | Analyzer existe, sin fix | Fix automatico con aprobacion |
| Contenido programatico | Solo blog | Landing pages programaticas por ruta/cala/puerto |
| Multilingual coverage | 8 idiomas tecnicos, contenido desigual | Paridad de contenido entre idiomas |
| Reviews / UGC | Ninguna automatizacion | Pipeline de solicitud + publicacion |
| Reporting ejecutivo | Manual | Briefing semanal + mensual automatico |
| Interconexion Cowork ↔ Web | No existe | MCP `seo-autopilot` expuesto publicamente |

---

## 2. Objetivos medibles (Norte verdadero)

### 2.1 North Star Metrics
| Metrica | Actual (baseline abr 2026) | Meta 90 dias | Meta 180 dias |
|---------|---------------------------|--------------|---------------|
| Keywords en top 3 Google | a medir con `seo_dashboard` | +30 | +80 |
| Keywords en top 10 Google | a medir | +80 | +180 |
| Clicks organicos / mes (GSC) | baseline de GSC-export.md | +40% | +120% |
| Impresiones / mes (GSC) | baseline | +60% | +200% |
| Backlinks DR>30 | contar con collector | +15 | +40 |
| Citaciones en IA (Perplexity, Google AI, ChatGPT) | `seo_geo_status` | +20 | +60 |
| Revenue atribuido a organico | `seo_revenue` | +20k EUR | +45k EUR |
| Reservas originadas via SEO | logs | +25% YoY | +60% YoY |
| Core Web Vitals (pasan) | `cwv.ts` | 100% paginas | 100% paginas |

### 2.2 Keywords objetivo #1 (must-win)
Estas son las 12 keywords donde rankear #1 es innegociable. Se tratan como "hero keywords" con landing dedicada, interlinking reforzado, schema completo y refresh trimestral.

| # | Keyword | Idioma | Cluster | URL objetivo |
|---|---------|--------|---------|--------------|
| 1 | alquiler barcos Blanes | es | Local-Blanes | /alquiler-barcos-blanes |
| 2 | alquiler barco sin licencia Blanes | es | Sin-licencia | /alquiler-barcos-sin-licencia-blanes |
| 3 | alquiler barco sin licencia Costa Brava | es | Sin-licencia | /alquiler-barcos-sin-licencia-costa-brava |
| 4 | boat rental Blanes | en | Local-Blanes | /en/boat-rental-blanes |
| 5 | boat rental Costa Brava | en | Costa-Brava | /en/boat-rental-costa-brava |
| 6 | boat rental without license Spain | en | Sin-licencia | /en/boat-rental-no-license-spain |
| 7 | lloguer vaixells Blanes | ca | Local-Blanes | /ca/lloguer-vaixells-blanes |
| 8 | location bateau Blanes | fr | Local-Blanes | /fr/location-bateau-blanes |
| 9 | Bootverleih Blanes | de | Local-Blanes | /de/bootverleih-blanes |
| 10 | Barcelona boat rental day trip | en | Barcelona | /en/boat-rental-day-trip-barcelona |
| 11 | alquiler barco Barcelona un dia | es | Barcelona | /es/alquiler-barco-un-dia-barcelona |
| 12 | excursion privada barco Costa Brava | es | Excursiones | /es/excursion-privada-barco |

---

## 3. Estrategia de keywords (5 clusters × 8 idiomas)

### 3.1 Clusters

**A. Local-Blanes** (maxima intencion, competencia baja)
- alquiler barcos Blanes, puerto Blanes alquiler, barcos Blanes sin licencia, alquiler lancha Blanes, zodiac Blanes, etc.

**B. Costa-Brava** (alto volumen, competencia media-alta)
- alquiler barcos Costa Brava, boat rental Costa Brava, barcos Lloret, barcos Tossa, etc.

**C. Sin-licencia** (alta intencion transaccional, competencia media)
- alquiler barco sin licencia, barco sin carnet, navegar sin licencia, barco hasta 15 CV, 6 personas sin licencia, etc.

**D. Excursiones-rutas-actividades** (intencion informativa-transaccional, ideal contenido)
- ruta barco Tossa, excursion Cala Sant Francesc, snorkel Blanes, calas Costa Brava barco, excursion privada skipper, etc.

**E. Barcelona** (volumen altisimo, competencia alta) — nuevo tras tu respuesta
- alquiler barco Barcelona un dia, day trip boat Barcelona, escapada barco desde Barcelona, etc.
- Estrategia: contenido pilar posicionando Blanes como "salida natural desde Barcelona" (36 min en tren, playa propia, marina)

### 3.2 Paridad multilingual
- **Tier 1** (cobertura inmediata): ES, EN
- **Tier 2** (cobertura 60 dias): FR, DE, CA
- **Tier 3** (cobertura 120 dias): IT, NL, RU

Todas las URLs target se crean en los 8 idiomas. El sistema de traduccion automatizada aplica al contenido del blog y a landings programaticas.

### 3.3 Landing pages programaticas a crear
Plantilla unica × dimensiones:
- 10 locations (ya existen): Blanes, Lloret, Tossa, S'Agaro, Palamos, Cadaques, etc.
- 4 activities (ya existen): snorkel, sunset, day, ruta
- 2 categories (ya existen): sin-licencia, con-licencia
- **Nuevo**: 10 rutas/calas individuales (Cala Sant Francesc, Cala Giverola, Cala Treumal, Pola, Cala Canyet, Cala Futadera, Cala Vallpresona, Platja Forcadella, Castell de Cap Roig, Illes Formigues)
- **Nuevo**: 6 puertos cercanos (Blanes, Lloret, Tossa, Palamos, Sant Feliu, Port d'Aro)
- **Nuevo**: 4 paginas "desde" (desde Barcelona, desde Girona, desde Francia, desde cruceros)

Total nuevas URLs a generar: 20 × 8 idiomas = 160 paginas programaticas adicionales.

---

## 4. Arquitectura del sistema autonomo

### 4.1 Capas

```
┌──────────────────────────────────────────────────────────┐
│  CAPA 4 — ORQUESTACION (Claude en Cowork)                │
│  Tareas programadas (scheduled-tasks MCP) que llaman a:  │
│  MCPs del negocio via el nuevo seo-autopilot-mcp         │
└───────────────┬──────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────┐
│  CAPA 3 — MCP PUBLICO (nuevo)                            │
│  seo-autopilot-mcp: wrapper unificado expuesto por HTTP  │
│  SSE sobre los MCPs internos (seo-engine, content,       │
│  business) + nuevas tools (outreach, distribution, GBP)  │
└───────────────┬──────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────┐
│  CAPA 2 — MCPs INTERNOS (ya existentes)                  │
│  seo-engine-server.ts, content-server.ts,                │
│  business-server.ts, sendgrid-server.ts, etc.            │
└───────────────┬──────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────┐
│  CAPA 1 — MOTOR SEO + DB                                 │
│  server/seo/* + Drizzle + Neon PostgreSQL                │
│  tablas: seoKeywords, seoRankings, seoCampaigns,         │
│  seoExperiments, seoAlerts, seoGeoCitations, ...         │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Flujo de un ciclo autonomo (ejemplo: blog post nuevo)

1. **Lunes 9:00** — Cron `seo-weekly-brief` ejecuta en Cowork → llama a `seo_dashboard` + `autopilot_status` → briefing semanal.
2. **Lunes 10:00** — Cron `autopilot-blog-weekly` → `autopilot_generate_now` crea borrador en la web.
3. **Revision automatica** — hook en el motor SEO valida: schema, hreflang, links internos, longitud, keyword density. Si falla → alerta → intento 2.
4. **Publicacion** — publica + manda `indexnow` + crea internal links desde cluster → articulo.
5. **Martes** — Cron `content-distribution` lee el nuevo post y ejecuta skill `seo-content-distributor` → genera 9 piezas (Medium, LinkedIn, Reddit, Quora, GBP, TripAdvisor, foro, outreach).
6. **Publicacion tier-1** (automatizable via APIs): Medium (Medium API), LinkedIn (LinkedIn API con token del usuario), Google Business Profile (Google Business Profile API).
7. **Publicacion tier-2** (semi-auto): Reddit y Quora requieren accion manual pero con cuentas pre-creadas — las piezas se guardan en una "bandeja de publicacion" con botones en el dashboard.
8. **Outreach emails** — se envian via SendGrid MCP con remitente `seo@costabravarentaboat.com` y tracking de respuestas.
9. **Miercoles** — Cron `keyword-research` (ya existe) busca nuevas oportunidades y las mete en el queue del autopilot.
10. **Jueves** — Cron `seo-experiments` lanza A/B de titulos o metas en paginas candidatas.
11. **Domingo 20:00** — Cron `weekly-seo-rank-check` (ya existe) compara rankings.
12. **Lunes siguiente** — el briefing incluye victorias, drops, oportunidades. Loop.

### 4.3 Hooks de calidad (guardrails)
- **No-publish guard**: si un borrador tiene <900 palabras, <3 H2, 0 imagenes o keyword density <0.5% → se rechaza.
- **Plagio guard**: comparacion contra piezas de distribucion previas (minimo 30% diferente).
- **Cannibalization guard**: antes de publicar, `cannibalization.ts` compara contra corpus. Si hay overlap >70% con URL existente → se consolida en vez de publicar.
- **CWV guard**: si core web vitals de la pagina caen >10% tras deploy → rollback automatico.
- **Budget guard**: quota en `quotas.ts` corta llamadas a Claude API si pasamos de X EUR/mes.

---

## 5. Roadmap 180 dias — 5 fases

### FASE 0 — BOOTSTRAP (dias 1-7)
**Meta**: dejar el sistema autonomo operativo.

| # | Accion | Owner | Status |
|---|--------|-------|--------|
| 0.1 | Crear MCP `seo-autopilot-mcp` (HTTP+SSE) | Claude Code en la web | Pending |
| 0.2 | Anadir tab "SEO Autopilot" en Admin CRM | Claude Code en la web | Pending |
| 0.3 | Programar las 14 scheduled tasks (Cowork) | Claude (Cowork) | Pending |
| 0.4 | Conectar Cowork → MCP publico con token | Usuario + Claude | Pending |
| 0.5 | Baseline rankings (snapshot) y seed de keywords | Motor SEO | Auto |
| 0.6 | Validar hooks de calidad en entorno staging | Claude Code | Pending |
| 0.7 | Documentar runbook de fallback | Claude | Pending |

### FASE 1 — QUICK WINS TECNICOS Y DE CONTENIDO (dias 8-30)
**Meta**: arreglar lo que ya rankea y subirlo + acelerar primeras victorias.

- 1.1 Fix de canibalizacion detectadas (auto + aprobacion)
- 1.2 Refresh de los 15 blog posts con mas impresiones pero CTR<2% (meta reescritas)
- 1.3 Internal linking masivo: cluster hub ↔ spokes, minimo 5 links internos nuevos por pagina hero
- 1.4 Fix de orphan pages detectadas por `analyzers/orphans.ts`
- 1.5 Schema JSON-LD reforzado (BoatService + Offer + AggregateRating + Product)
- 1.6 Freshness: anadir ultima-actualizacion visible + dateModified en schema
- 1.7 Generar 20 paginas programaticas nuevas (rutas/calas/puertos) en ES+EN
- 1.8 Seed de 120 keywords adicionales en el cluster D y E

### FASE 2 — CONTENIDO A ESCALA + DISTRIBUCION (dias 31-90)
**Meta**: duplicar el volumen de contenido indexado y backlinks.

- 2.1 Autopilot blog: 3 posts/semana en ES + 2/semana traducidos EN
- 2.2 Distribucion automatica de cada post (11 plataformas)
- 2.3 Programa de outreach: 50 emails/semana a sitios relevantes (blogs turismo, portales Costa Brava, asociaciones)
- 2.4 Guest posts: 2/mes en sitios DA>40
- 2.5 Publicaciones semanales en GBP (4/mes)
- 2.6 Reviews campaign: trigger post-reserva → solicitud con skill automatizada
- 2.7 Traducir contenido a FR, DE, CA (tier 2)
- 2.8 UGC: pipeline de fotos reales de clientes con consentimiento → publicacion en landings

### FASE 3 — AUTORIDAD, LINKS Y GEO (dias 91-150)
**Meta**: consolidar autoridad tematica.

- 3.1 Link building ofensivo: podcasts, entrevistas, participacion en foros nauticos
- 3.2 Collaboraciones: hoteles, restaurantes, paquetes combinados en Blanes
- 3.3 Datos propios: publicar "Informe anual del alquiler nautico en Costa Brava" con datos reales (baits para backlinks editoriales)
- 3.4 GEO: optimizar paginas para que Perplexity / ChatGPT / Google AI citen el sitio
- 3.5 Knowledge Graph: solicitar a Google entidad propia
- 3.6 Paridad IT+NL+RU (tier 3)
- 3.7 Experimentos CRO: test de CTA en landing hero, formulario reserva, precios visibles

### FASE 4 — DOMINIO Y DEFENSA (dias 151-180)
**Meta**: cerrar la temporada 2026 liderando los clusters.

- 4.1 Defensa de rankings: alertas 24/7 con playbooks de respuesta
- 4.2 Contenido evergreen refresh trimestral automatico
- 4.3 Expansion a keywords de "low-hanging fruit" detectadas por el strategist
- 4.4 Informe de temporada 2026 + plan 2027 generado automaticamente
- 4.5 Auditoria externa independiente (humano opcional) para validar

---

## 6. Catalogo de tareas programadas (14 crons)

> Se crearan via `mcp__scheduled-tasks__create_scheduled_task`. Prompts ya escritos en la seccion siguiente.

| # | taskId | Cron (local) | Proposito |
|---|--------|--------------|-----------|
| 1 | seo-monday-briefing | `0 8 * * 1` | Briefing ejecutivo semanal: estado, victorias, drops, acciones |
| 2 | keyword-research (YA EXISTE) | `0 9 * * 3` | Mantener — investigacion semanal de oportunidades |
| 3 | weekly-seo-rank-check (YA EXISTE) | `0 9 * * 1` | Mantener — tracking semanal de posiciones |
| 4 | autopilot-blog-weekly | `0 10 * * 2,4` | Trigger 2x/semana de blog autopilot |
| 5 | content-distribution-weekly | `0 11 * * 3` | Distribuir cada post nuevo a 11 plataformas |
| 6 | gbp-weekly-post | `0 10 * * 1` | Publicar en Google Business Profile (local signals) |
| 7 | outreach-wave | `0 10 * * 1,4` | Enviar 25 emails outreach cada lunes y jueves |
| 8 | geo-citations-check | `0 15 * * 2` | Verificar citas en Perplexity/Google AI/ChatGPT y optimizar |
| 9 | cannibalization-sweep | `0 3 * * 6` | Detectar y proponer fixes de canibalizacion |
| 10 | cwv-healthcheck | `0 5 * * *` | Core Web Vitals diario + rollback si degradacion |
| 11 | competitor-watch | `0 7 * * 2,5` | Escanear 5 competidores: nuevo contenido, cambios, backlinks |
| 12 | reviews-request-wave | `0 18 * * 5` | Trigger de solicitud de review a reservas finalizadas esta semana |
| 13 | freshness-refresh | `0 4 1 * *` | Mensual: identificar 10 articulos "decaying" y refrescar |
| 14 | seo-monthly-report | `0 9 1 * *` | Reporte ejecutivo mensual (docx) enviado por email |

### Tareas one-time iniciales (kickoff)
| taskId | Cuando | Proposito |
|--------|--------|-----------|
| seo-bootstrap-fase-0 | Proximo dia laborable 9:00 | Ejecutar fase 0 (bootstrap) en 1 sesion |
| seo-fase-1-audit-inicial | T+2 dias | Auditoria tecnica previa a fase 1 |

---

## 7. MCP `seo-autopilot-mcp` (nuevo) — especificacion

Ubicacion propuesta: `server/mcp/seo-autopilot-server.ts` + expuesto via HTTP SSE en `/api/mcp/seo-autopilot` con auth por token.

### 7.1 Tools que expone

**Dashboard**
- `dashboard_summary()` — agrega `seo_dashboard` + `autopilot_status` + `seo_geo_status` + revenue
- `weekly_briefing()` — genera markdown briefing semanal

**Contenido**
- `blog_generate(cluster?, keyword?)` — wrapper de `autopilot_generate_now`
- `blog_refresh(slug)` — `autopilot_refresh_post`
- `blog_distribute(slug, platforms[])` — nuevo: genera las 9 piezas + publica donde se pueda

**Tecnico**
- `technical_audit()` — corre collectors + analyzers + devuelve lista priorizada
- `fix_cannibalization(urls[])` — aplica fix (redirect/consolidate) con aprobacion
- `fix_orphans(urls[])` — anade internal links desde candidates

**Keywords**
- `keywords_add(keywords[], cluster, language)` — mete en queue
- `keywords_top_opportunities(limit?)` — top oportunidades (pos 4-15, alto volumen)

**Links / Outreach**
- `outreach_send_batch(targets[])` — usa sendgrid MCP + plantillas
- `backlinks_audit()` — nuevos/perdidos backlinks desde coleccion GSC + Ahrefs export si disponible

**Local / GBP**
- `gbp_publish(post)` — publica post en Google Business Profile via API
- `gbp_reviews_fetch()` — pull de reviews nuevas

**GEO (IA)**
- `geo_optimize(url)` — anade FAQ, definiciones, data tables para ser citado por LLMs
- `geo_prompts_sweep()` — corre 50 prompts contra Perplexity/ChatGPT y registra citas

**Experimentos**
- `experiment_create(type, url, variants[])` — A/B titulo/meta/CTA
- `experiment_conclude(id)` — decide ganador por CTR/rank delta

### 7.2 Seguridad
- Autenticacion: Bearer token con rotacion mensual, var env `SEO_MCP_TOKEN`
- Rate limit: 60 req/min por token
- Audit trail: toda invocacion se loguea en `audit.ts`
- No-destructive default: mutaciones requieren `confirm: true` o flag `autoApprove` configurado

### 7.3 Conectar Cowork → MCP
Flow:
1. Usuario genera token desde el dashboard CRM (boton "Generar token MCP").
2. En Cowork: `mcp-registry` → instalar MCP con URL `https://costabravarentaboat.com/api/mcp/seo-autopilot` y token.
3. A partir de ahi, todas las scheduled tasks lo usan.

---

## 8. Dashboard "SEO Autopilot" — especificacion UI

Nueva tab en `client/src/components/crm/` siguiendo el patron de `AdminLayout.tsx`.

### 8.1 Secciones
1. **Overview** — tarjetas KPI: keywords top 3, top 10, clicks/imp mes, revenue atribuido, citas IA
2. **Keyword Radar** — tabla de keywords con filtros por cluster/idioma/posicion + sparklines
3. **Pipeline de contenido** — queue del autopilot (proximos 4 posts) + historial
4. **Distribution tray** — piezas generadas pendientes de publicar en plataformas no-API (Reddit/Quora) con boton "copiar" y "marcar como publicado"
5. **Outreach** — campana activa, emails enviados, respuestas, backlinks conseguidos
6. **Local (GBP)** — proximo post, reviews, insights
7. **GEO (IA)** — citas por engine, prompts que nos mencionan, tasa de cita
8. **Experimentos** — A/B activos + conclusos con learnings
9. **Alertas** — drops de ranking, errores del motor, penalizaciones potenciales
10. **Logs** — audit trail de acciones del autopilot

### 8.2 Componentes a crear
- `client/src/components/crm/SeoAutopilotTab.tsx`
- `client/src/components/crm/seo-autopilot/KeywordRadar.tsx`
- `client/src/components/crm/seo-autopilot/ContentPipeline.tsx`
- `client/src/components/crm/seo-autopilot/DistributionTray.tsx`
- `client/src/components/crm/seo-autopilot/OutreachPanel.tsx`
- `client/src/components/crm/seo-autopilot/GeoPanel.tsx`
- `client/src/components/crm/seo-autopilot/ExperimentsPanel.tsx`
- `client/src/components/crm/seo-autopilot/AlertsFeed.tsx`
- `client/src/components/crm/seo-autopilot/AuditLog.tsx`

### 8.3 Endpoints nuevos
- `GET /api/admin/seo-autopilot/overview`
- `GET /api/admin/seo-autopilot/keywords`
- `GET /api/admin/seo-autopilot/queue`
- `POST /api/admin/seo-autopilot/distribute/:slug`
- `GET /api/admin/seo-autopilot/outreach`
- `POST /api/admin/seo-autopilot/outreach/send`
- `GET /api/admin/seo-autopilot/alerts`
- `POST /api/admin/seo-autopilot/experiment/:id/conclude`
- `GET /api/admin/seo-autopilot/token` (generar/rotar token MCP)

Todos requieren `requireAdminSession`.

---

## 9. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
|--------|---------|------------|
| Google penaliza por volumen de contenido IA | Alto | Guardrails calidad + 30% review manual + E-E-A-T signals (author, real photos) |
| APIs Reddit/Quora no permiten auto-post | Medio | Quedan en "Distribution tray" con accion semi-manual |
| Coste Claude API sube | Medio | `quotas.ts` con presupuesto mensual + alertas al 75% |
| Cambio algoritmo Google | Alto | Monitorizacion diaria + pausa automatica de experimentos si drop >20% |
| Token MCP comprometido | Critico | Rotacion mensual + IP allowlist + rate limit |
| Contenido traducido de mala calidad | Alto | Revision humana una vez en Fase 2 + feedback loop |
| Datos insuficientes en baseline | Medio | Snapshot inicial amplio (Fase 0.5) + 30 dias para maduracion |

---

## 10. Presupuesto estimado

| Partida | Mes | 6 meses |
|---------|-----|---------|
| Claude API (autopilot + strategist + distribution) | 80-120 EUR | 500-700 EUR |
| SERP API (tracking rankings) | 20 EUR | 120 EUR |
| SendGrid (outreach) | 15 EUR | 90 EUR |
| Herramientas opcionales (Ahrefs lite, etc.) | 50 EUR | 300 EUR |
| **Total operativo** | **~165-205 EUR** | **~1.000-1.210 EUR** |

ROI esperado: +45.000 EUR revenue organico en 180 dias. ROI = 37×-45×.

---

## 11. Siguientes pasos (que hacemos ya)

1. Confirmar este plan (esta tarea).
2. Programar las 14 crons (1 sesion, 10-15 min) — Cowork.
3. Generar las 2 tareas one-time kickoff.
4. Iniciar desarrollo del MCP publico + dashboard CRM — proxima sesion de Claude Code en la web.
5. Primera ejecucion end-to-end en staging.
6. Deploy a produccion + primer ciclo completo.

---

**Version control**
- v1.0 — 2026-04-20 — Documento inicial
