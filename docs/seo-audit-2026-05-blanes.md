# Auditoría SEO — Costa Brava Rent a Boat (Puerto de Blanes)

**Fecha:** 2026-05-02
**Alcance:** Inventario de la infraestructura SEO existente en el repo + identificación de gaps, como base para diseñar la estrategia de temporada.
**Branch:** `claude/boat-rental-seo-strategy-UX3p7`

---

## 1. Resumen ejecutivo

El proyecto **no parte de cero** en SEO. Ya cuenta con:

- 14 tipos de **JSON-LD** generados dinámicamente (`LocalBusiness`, `Product`, `BlogPosting` con E-E-A-T, `FAQPage`, `BreadcrumbList`, `TouristAttraction`, `Place` con GeoCoordinates, `DefinedTermSet` glosario náutico, `HowTo` reserva, `AggregateOffer`, `Service`, `Event` temporal, `WebSite`, `ItemList` flota).
- **8 idiomas** con cobertura de UI casi completa (es=3233 líneas, resto entre 3145-3205, brecha 2-3%) y slugs traducidos en `shared/i18n-routes.ts`.
- **4 sitemaps** dinámicos con `hreflang`, prioridad por idioma (es=1.0, en/fr/de/nl=0.9, ca/it/ru=0.7) y `x-default→es`.
- Un **MCP server** propio (`/api/mcp/seo-autopilot`) con 14 tools que un LLM externo puede invocar (overview, keyword radar, distribution tray, GSC queries, GA4 LP, CWV, SERP features…).
- Un **blog autopilot** que genera posts en 8 idiomas con Claude Sonnet, alimentado por conversaciones WhatsApp (90 días), analytics y keyword clusters, con scoring SEO y traducción automática.
- Tablas DB para `seoKeywords`, `seoRankings`, `seoCompetitors`, `seoSerpFeatures`, `seoCampaigns`, `seoExperiments`, `distributionTray` (11 plataformas), audit log MCP.
- Tabs CRM (`AutopilotTab`, `SeoTab`) con KPIs, alertas, distribution, audit, tokens, campaigns.

**Lo que falta es táctico, no estructural.** Los gaps Tier 1 suman aproximadamente 5-6 horas de trabajo y desbloquean rich results náuticos específicos + cierran deuda i18n. El bloqueante crítico es **externo**: la regulación que el dueño cita (RD 1188/2025) no está verificada y condiciona cómo se posiciona toda la categoría "sin licencia".

**Recomendación:** antes de diseñar la estrategia, (a) verificar el RD oficialmente, (b) aportar GSC export, GBP insights actuales y PageSpeed, y (c) decidir destino de las 3 locations skeleton (Malgrat, Santa Susanna, Calella). Con esos inputs, la estrategia de temporada se construye encima de la infra existente atacando los gaps Tier 1 + Tier 2 en orden de impacto.

---

## 2. Inventario de la infraestructura existente

### 2.1 Frontend SEO

| Componente | Path | Estado |
|---|---|---|
| Configuración meta + canonical + hreflang | `client/src/utils/seo-config.ts` (~1450 líneas) | 28 page keys × 8 idiomas. Helpers `generateCanonicalUrl`, `generateHreflangLinks`, `generateLocalBusinessSchema`, `generateEnhancedProductSchema`, `generateServiceSchema`, `generateWebSiteSchema`, `generateHowToBookingSchema`, `generateSeasonalEventSchema`. Año dinámico (ajusta a próxima temporada en nov-dic). |
| Generadores JSON-LD | `client/src/utils/seo-schemas.ts` (399 líneas) | 14 tipos: `ItemList`, `BlogPosting` (con Person+Publisher+E-E-A-T), `BreadcrumbList`, `FAQPage`, `Event`, `TouristAttraction`, `DefinedTermSet` (18 términos náuticos), `Place` con GeoCoordinates (8 calas), `AggregateOffer`, `Product`, `LocalBusiness` (con AggregateRating global), `Service`, `WebSite`, `HowTo`. |
| Slugs i18n por ruta | `shared/i18n-routes.ts` (182 líneas) | 8 idiomas para 10 locations + 4 activities + 2 categories + content + legal + dinámicos (boatDetail, blogDetail, destinationDetail). |
| Hreflang BCP-47 | `shared/seoConstants.ts` | es-ES, en-GB, ca, fr-FR, de-DE, nl-NL, it-IT, ru-RU. `SUPPORTED_LANGUAGES` central. |
| Renderer SEO runtime | `client/src/components/SEO.tsx` | Inserta canonical + hreflang + robots + OG en `document.head` vía `useEffect`. Auto-genera hreflang si no se pasa explícito. `OG_LOCALE_MAP` definido pero `og:locale:alternate` no emitido. |
| Sitemaps | `server/routes/sitemaps.ts` | 4 sitemaps + index. `LANG_PRIORITY_TIER` por idioma. `buildHreflangLinks()` y `buildBlogHreflangLinks()`. Páginas no-ES (boats/blog/destinations no traducidos) reciben `noindex` + canonical→ES. |
| Robots.txt | `server/routes/robots.ts` | Dinámico. Disallow `/crm`, `/admin`, `/login`, `/api/`, `/client/`. Reglas específicas para AI crawlers. Sitemap reference. |

**Cobertura i18n por archivo (líneas):**

| Idioma | Líneas | Δ vs. es |
|---|---|---|
| es | 3233 | — |
| en | 3205 | −28 |
| fr | 3146 | −87 |
| de | 3146 | −87 |
| it | 3146 | −87 |
| ca | 3145 | −88 |
| nl | 3145 | −88 |
| ru | 3145 | −88 |

Brecha mínima (2-3%). El proceso `npm run i18n:translate` (Claude) cierra automáticamente claves nuevas; `npm run i18n:validate` falla en CI si hay desincronización.

### 2.2 Backend SEO

**`server/seo/`** — motor de optimización modular:

| Subdirectorio | Función |
|---|---|
| `alerts/` | Engine de alertas + canales Telegram + WhatsApp |
| `analyzers/` | Cannibalization detector + orphans (páginas huérfanas) |
| `collectors/` | Ingesta APIs externas: GSC, GA4, PSI, SERP, CWV, linkrot, competitors, geo |
| `executors/` | Ejecutores de optimización: FAQs, freshness, internalLink, metaTags, schema |
| `feedback/` | A/B experiments + correlación con revenue |
| `reports/` | SEM reports + resúmenes semanales |
| `strategist/` | `agent.ts` (Claude) + `briefing.ts` (`SeoBriefing` con top keywords, opportunities almostThere/doorway/losing, competidores, SERP features no poseídas, campaigns, experiments) + `parser.ts` |
| `validators/` | Validación schema markup |
| `config.ts`, `worker.ts`, `monitor.ts`, `indexnow.ts` | Orquestación, scheduling, IndexNow |

**MCP `server/mcp/seo-autopilot/`** (montado en `/api/mcp/seo-autopilot`):

| Tool | Función |
|---|---|
| `autopilot_overview` | KPI snapshot (posts, distribution, audit, tokens) |
| `autopilot_keyword_radar` | Keywords con rankings, filtrable por cluster/posición |
| `autopilot_distribution_tray` | Items queued para distribución multi-plataforma |
| `autopilot_queue_distribution` | Encolar item |
| `autopilot_mark_distribution` | Marcar published/failed/discarded |
| `autopilot_alerts` | Listar alertas |
| `autopilot_audit_log` | Audit log de invocaciones MCP |
| `autopilot_blog_drafts` | Listar blog posts recientes |
| `autopilot_gsc_queries` | Top queries GSC (clicks, impressions, CTR, position) |
| `autopilot_ga4_lp` | Landing pages GA4 (sessions, engagement, conversions) |
| `autopilot_cwv_report` | Core Web Vitals por URL (field+lab; flag LCP>2.5s, CLS>0.1) |
| `autopilot_serp_features` | SERP features (AI overview, local pack, PAA, featured snippet) |
| `autopilot_gbp_insights` | **STUB** (sin OAuth implementado) |
| `autopilot_bing_queries` | **STUB** |

Auth: bearer token. Rate limit: 60 req/min por IP, 600 req/min por token. Audit en `seoAutopilotAudit` (tokenId, tool, params, success, resultSize, durationMs, ip).

**Blog autopilot (`server/services/blogAutopilot.ts` + `blogTopicEngine.ts`):**
- Topic selection desde conversaciones WhatsApp (90 días), page visit analytics, keyword clusters, boat interest distribution.
- Categorías: Destinos, Guías, Consejos, Actividades, Costa Brava (10 categorías totales mapeadas con i18n).
- Pipeline: Claude Sonnet topic → article generation → SEO audit + score → traducción 8 idiomas → fetch Unsplash → persist `blog_posts`.
- Multi-idioma JSONB: `titleByLang`, `contentByLang`, `excerptByLang`, `metaDescByLang`, `featuredImageAltByLang`.

**Lead nurturing (`server/services/leadNurturingService.ts`):**
- HOT (score >70, idle 30min) → mensaje disponibilidad + link.
- WARM (50-70, idle 24h) → cupón 10% válido 48h.
- COLD (<30) → newsletter.
- Cron cada 2h vía `schedulerService.ts`.

**Tablas DB (`shared/schema.ts`):**

| Tabla | Función |
|---|---|
| `seoKeywords` | keyword, language, volume, intent, cluster, tracked |
| `seoRankings` | position, clicks, impressions, CTR, date, device, source |
| `seoPages` | path, title, description, wordCount, hasSchemaOrg, internalLinksIn/Out |
| `seoCompetitors` | domain, name, type, active |
| `seoCompetitorRankings` | position por keyword por fecha |
| `seoSerpFeatures` | features, ownsFaq, ownsLocalPack, ownsImages, ownsAiOverview |
| `seoCampaigns` | name, objective, cluster, status, progress, results |
| `seoExperiments` | A/B (sin runner asociado visible) |
| `distributionTray` | slug, platform (medium, linkedin, reddit, quora, google_business, tripadvisor, foro_nautico, outreach_email, twitter, instagram, facebook), language, content, status, publishedUrl, failureReason |
| `seoAutopilotAudit` | audit log MCP |
| `blogPosts` | multi-idioma JSONB, category, isAutoGenerated, seoScore |
| `destinations` | landing pages SEO por destino |

**CRM (`client/src/components/crm/`):**
- `AutopilotTab.tsx`: KPIs, distribution tray UI (filter platform/status/language, mark, delete), alerts (severity badge), audit log, token management.
- `SeoTab.tsx`: campaigns, A/B experiments, health reports, competitor tracker.

### 2.3 Cobertura de contenido público

**10 location pages** (`client/src/pages/location-*.tsx`):

| Location | Líneas | SEO | i18n |
|---|---|---|---|
| Blanes | 586 | ✅ Completo (4 schemas + breadcrumb) | ✅ Vivo 8 idiomas |
| Lloret de Mar | 463 | ✅ Completo + OG image | ✅ Vivo |
| Tossa de Mar | 534 | ✅ Completo + warning banner | ✅ Vivo |
| Barcelona | 376 | ✅ Completo (`TouristDestination`) | ✅ Vivo (41 claves) |
| Tordera | 389 | ✅ Estructura | ⚠️ Hardcoded ES (hero, bloques, FAQ body) |
| Palafolls | 388 | ✅ Estructura | ⚠️ Hardcoded ES |
| Pineda de Mar | 388 | ✅ Estructura | ⚠️ Hardcoded ES |
| Malgrat de Mar | 66 | ❌ Skeleton + placeholders | ⚠️ Skeleton |
| Santa Susanna | 66 | ❌ Skeleton + placeholders | ⚠️ Skeleton |
| Calella | 66 | ❌ Skeleton + placeholders | ⚠️ Skeleton |

**4 activity pages** (todas completas + i18n vivo + schema `TouristTrip`+`Offer`):
- snorkel, sunset, families, fishing.
- *Nota:* "Excursión Privada con Capitán" existe como entrada en `boatData.ts` (`excursion-privada`, 240€/2h) **pero no tiene activity page propia**.

**2 category pages** (completas + i18n vivo):
- `category-license-free.tsx`: keywords objetivo `barco sin licencia costa brava`, `alquiler barco sin carnet`. Posiciona "70€/h, gasolina incluida, 4-7 personas".
- `category-licensed.tsx`: keywords `barco costa brava con licencia`, `alquiler barcos LNB`. Posiciona "80-115CV, LNB o patrón incluido".

**FAQ (`client/src/pages/faq.tsx`):**
- 52 Q&A en 8 categorías (reservas, comparativas, licencias, incluye, navegación, práctica, temporada).
- JSON-LD: ✅ multi-idioma vivo desde `t.faqPage.items`.
- UI Accordion body: ⚠️ **hardcoded en español** (Google solo lee el schema, pero el usuario en otros idiomas ve mezcla). Deuda documentada en CLAUDE.md (~3h refactor).

**Blog:**
- Dinámico via `/api/blog`, multi-idioma JSONB.
- Rutas: `/blog` listado + `/blog/{slug}` detail.
- 10 categorías con traducciones i18n.
- Feed Atom: ⚠️ solo en español (`/api/blog/feed.xml`).
- `BlogPosting` schema en cada post (con E-E-A-T).

**Booking flow:**
- Wizard 8 steps en modal (`client/src/components/booking-flow/`).
- Sin checkout separado: termina en redirect a WhatsApp con mensaje pre-formateado.
- No hay página de confirmación → no hay oportunidad de `Reservation` schema post-booking.

**Datos negocio (`shared/boatData.ts`):**

| Barco | Tipo | Personas | Precio | Gasolina |
|---|---|---|---|---|
| Solar 450 | Sin licencia | 5 | 75€/h | ✅ |
| Remus 450 | Sin licencia | 5 | 75€/h | ✅ |
| Remus 450 II | Sin licencia | 5 | 75€/h | ✅ |
| Astec 400 | Sin licencia | 4 | 70€/h | ✅ |
| Astec 480 | Sin licencia | 5 | 80€/h | ✅ |
| Mingolla Brava 19 | Con licencia | 6 | 160€/2h | ❌ |
| Trimarchi 57S | Con licencia | 7 | 160€/2h | ❌ |
| Pacific Craft 625 | Con licencia | 7 | 180€/2h | ❌ |
| Excursión Privada | Con patrón | 7 | 240€/2h | ❌ |

**Rutas marítimas (`shared/routesData.ts`):** 5 rutas traducidas a 8 idiomas (Sa Palomera, Cala Sant Francesc, Blanes→Lloret, Blanes→Tossa, Tour Costa Brava). Solo se renderizan embebidas en activities — **sin landing SEO propia**.

---

## 3. Gaps priorizados

### Tier 1 — alto impacto, bajo esfuerzo (~5-6h totales)

| # | Gap | Path / Ubicación | Esfuerzo | Por qué impacta |
|---|---|---|---|---|
| 1 | 3 locations en español hardcoded | `client/src/pages/location-{tordera,palafolls,pineda-de-mar}.tsx` | ~2h (45min × 3) | Usuarios no-ES ven mezcla incoherente. Migrar a `es.ts` + `npm run i18n:translate`. |
| 2 | `Boat` schema.org type ausente | `client/src/utils/seo-schemas.ts` (añadir helper) | ~1h | Hoy se usa `Product` genérico. `Boat` específico (con `make`, `model`, `cabins`, `fuelType`, `numberOfBerths`) gana relevancia para queries náuticas. |
| 3 | `AggregateRating` por barco | `client/src/utils/seo-schemas.ts` + integrar reseñas DB en boatDetail | ~1h | Hoy el rating está solo en `LocalBusiness` global. Por barco habilita rich snippet con estrellas en SERP. |
| 4 | Blog feed Atom solo en ES | `server/routes/blog.ts` (feed.xml) | ~30min | Filtrar/duplicar por `?lang=` o emitir feed por idioma. |
| 5 | Migración FAQ body Accordion a i18n | `client/src/pages/faq.tsx` | ~3h | El JSON-LD es multi-idioma, pero el body que ve el usuario en EN/FR/DE/etc. sigue en español. Mejora UX y reduce bounce. |

### Tier 2 — alto impacto, esfuerzo medio

| # | Gap | Path / Ubicación | Esfuerzo | Decisión que requiere |
|---|---|---|---|---|
| 6 | 3 locations skeleton (Malgrat, Santa Susanna, Calella) | `client/src/pages/location-{malgrat-de-mar,santa-susanna,calella}.tsx` | ~3h si se completan; 0 si se eliminan | Decidir: ¿hay demanda real de búsqueda local? Si no, eliminar de navegación + sitemap evita "thin content" penalty. |
| 7 | Landings SEO para rutas marítimas | Nuevo template + 5 páginas dinámicas alimentadas por `routesData.ts` | ~3h | Búsquedas tipo "tour barco blanes tossa" o "ruta sa palomera" no tienen landing dedicada. |
| 8 | Landing dedicada "Excursión Privada con Capitán" | Nueva activity reutilizando template existente | ~1h | Producto de mayor margen (240€/2h) hoy enterrado en category-licensed. |
| 9 | Schema `RentalBusiness` reemplazando `LocalBusiness` genérico | `client/src/utils/seo-config.ts` (`generateLocalBusinessSchema`) | ~30min | `RentalBusiness` es subtipo más específico — mejor matching de intent comercial. |

### Tier 3 — impacto medio, esfuerzo medio-alto

| # | Gap | Path / Ubicación | Notas |
|---|---|---|---|
| 10 | `Reservation` JSON-LD post-booking | Sería nuevo si se crea página de confirmación | Hoy se redirige a WhatsApp → no hay landing donde emitirlo. |
| 11 | `ContactPoint` schema | `client/src/utils/seo-config.ts` (extender LocalBusiness) | WhatsApp/teléfono/email estructurados. |
| 12 | `VideoObject` si hay videos en galería | `client/src/utils/seo-schemas.ts` | Verificar primero si hay videos. |
| 13 | `og:locale:alternate` no emitido | `client/src/components/SEO.tsx:12` (`OG_LOCALE_MAP` definido sin renderizar) | 15 min. |
| 14 | Internal link analyzer sin trigger automático | `server/seo/executors/internalLink.ts` + `server/seo/analyzers/orphans.ts` | Falta scheduler / cron asociado. |
| 15 | Content freshness scheduler sin cron | `server/seo/executors/freshness.ts` | Detecta páginas estancadas pero no se dispara automáticamente. |
| 16 | A/B experiments sin runner ni analyzer | tabla `seoExperiments` | Hay schema, falta motor. |
| 17 | IndexNow per-URL real-time | `server/seo/indexnow.ts` | Hoy solo `notifyAllSitemapUrls`. Mejor: ping al publicar/editar. |
| 18 | Audit log sin retention policy | `seoAutopilotAudit` | Crecimiento ilimitado. |
| 19 | GBP integration es stub | `server/mcp/seo-autopilot/tools.ts:497-568` (`autopilot_gbp_insights`) | OAuth + Google Business Profile API. ~1d. |
| 20 | Bing Webmaster Tools stub | mismo archivo | Bajo impacto en este vertical (Google domina). |

---

## 4. Bloqueantes externos / supuestos no verificados

### 4.1 Regulación citada (RD 1188/2025)

El dueño afirma:
> "RD 1188/2025 restringe la exención de titulación para barcos <5m a uso privado desde octubre 2026, lo que afecta cómo posicionar las páginas de barcos sin licencia."

**Este equipo no ha verificado esa regulación.** Antes de incorporarla a la estrategia se necesita:

1. **Texto oficial completo del RD** (BOE, no resumen de terceros).
2. **Confirmación del alcance**: ¿afecta a alquiler comercial supervisado, o solo a uso privado/recreativo?
3. **Fecha de entrada en vigor exacta**.
4. **Posición del operador** (Capitanía Marítima de Blanes / DGMM): ¿qué directrices aplican al alquiler turístico con instructor/responsable en muelle?

Hipótesis a contrastar con la realidad regulatoria:

| Hipótesis | Implicación SEO si es cierta |
|---|---|
| H1: La exención sigue vigente para alquiler comercial supervisado | No hay cambio. Mantener positioning actual. |
| H2: La exención se restringe también para alquiler comercial | Reposicionar `category-license-free` antes de oct/2026: foco en "experiencia turística sin requisito previo de titulación, dentro del marco de alquiler supervisado", crear página explicativa, comunicación proactiva al usuario. |
| H3: Fase transitoria con condiciones intermedias | Página explicativa + FAQ específica + actualización dinámica según fecha. |

**Hasta tener H1/H2/H3 confirmada con texto oficial, NO incorporar contenido legal específico al sitio** — el riesgo de desinformación en una página comercial es alto.

### 4.2 Datos no aportados al brief original

El prompt mencionaba "adjuntos" que no están en el repo ni se han pegado:

| Input mencionado | Estado | Cómo aportarlo |
|---|---|---|
| GSC export | ❌ No aportado | Export CSV o invocar `autopilot_gsc_queries` MCP si los datos ya están en DB |
| Ficha GBP actual | ❌ No aportado | Screenshot del dashboard + URL pública + categorías actuales |
| Análisis 4 competidores | ❌ No aportado | URLs + lo que se quiere comparar (rankings, schema, contenido, GBP) |
| PageSpeed actual | ❌ No aportado | Run en PSI o invocar `autopilot_cwv_report` MCP |
| Catálogo de barcos | ✅ Disponible | `shared/boatData.ts` (8 barcos) |
| Stack del sitio | ✅ Disponible | CLAUDE.md + repo |

### 4.3 Otros supuestos

- **Estacionalidad mayo-septiembre fuerte**: hoy 2 mayo, la temporada ya empezó. El framing original del prompt ("quick wins antes de temporada") ya no aplica — se reformula como "captura del pico junio-agosto".
- **Décibles "barco sin licencia" como demanda dominante**: no verificado sin GSC. Podría ser que las queries con licencia aporten más conversiones de mayor ticket.
- **Capacidad de captar reseñas**: la estrategia de `AggregateRating` por barco depende de tener un volumen suficiente de reseñas reales. Verificar cuántas hay en DB.
- **Idiomas con mejor ROI**: `LANG_PRIORITY_TIER` en sitemaps (es=1.0, en/fr/de/nl=0.9, ca/it/ru=0.7) refleja un supuesto del proyecto. Validar con datos reales de tráfico GA4 antes de invertir más en contenido CA/IT/RU.

---

## 5. Inputs que se piden antes de diseñar la estrategia

Para que el segundo turno produzca una estrategia accionable y no genérica, se necesita:

1. **Texto oficial del RD 1188/2025** o autorización para verificarlo vía WebFetch.
2. **Top 50 queries GSC últimas 16 semanas** con clicks, impressions, CTR, position, página de aterrizaje.
3. **Captura de la ficha GBP**: categorías, atributos, número de reseñas, rating medio, fotos, posts, productos.
4. **Lista de 4 competidores** con URLs (para comparar schema, contenido, GBP).
5. **Output de PageSpeed / CWV** (mobile + desktop) para 5 URLs clave: home, location-blanes, category-license-free, category-licensed, un boat detail.
6. **Volumen de reseñas reales** en DB (para decidir si `AggregateRating` por barco es viable).
7. **Decisión sobre 3 locations skeleton** (Malgrat, Santa Susanna, Calella): completar o eliminar.
8. **Política i18n para nuevas landings** (rutas marítimas, excursión privada): 8 idiomas completos o ES+EN+FR primero.

---

## 6. Anexo: matriz de páginas SEO

| Página | Ruta | SEO completo | i18n vivo | Notas |
|---|---|---|---|---|
| Home | `/` | ✅ | ✅ | Schema LocalBusiness + WebSite |
| Location Blanes | `/alquiler-barcos-blanes` | ✅ | ✅ | 4 schemas + FAQ |
| Location Lloret | `/alquiler-barcos-lloret-de-mar` | ✅ | ✅ | OG image + cross-links |
| Location Tossa | `/alquiler-barcos-tossa-de-mar` | ✅ | ✅ | Warning banner + cross-links |
| Location Barcelona | `/alquiler-barcos-barcelona` | ✅ | ✅ | TouristDestination |
| Location Tordera | `/alquiler-barcos-tordera` | ✅ estructura | ⚠️ ES hardcoded | Migrar a i18n |
| Location Palafolls | `/alquiler-barcos-palafolls` | ✅ estructura | ⚠️ ES hardcoded | Migrar a i18n |
| Location Pineda | `/alquiler-barcos-pineda-de-mar` | ✅ estructura | ⚠️ ES hardcoded | Migrar a i18n |
| Location Malgrat | `/alquiler-barcos-malgrat-de-mar` | ❌ skeleton | ⚠️ skeleton | Decidir: completar o eliminar |
| Location Sta Susanna | `/alquiler-barcos-santa-susanna` | ❌ skeleton | ⚠️ skeleton | Decidir |
| Location Calella | `/alquiler-barcos-calella` | ❌ skeleton | ⚠️ skeleton | Decidir |
| Activity Snorkel | `/excursion-snorkel-barco-blanes` | ✅ | ✅ | TouristTrip + Offer |
| Activity Sunset | (slug i18n) | ✅ | ✅ | TouristTrip + Offer |
| Activity Families | (slug i18n) | ✅ | ✅ | TouristTrip + Offer |
| Activity Fishing | (slug i18n) | ✅ | ✅ | TouristTrip + Offer + 5 spots |
| Excursión Privada | — | ❌ no existe | — | Crear (Tier 2 #8) |
| Category License-Free | `/barcos-sin-licencia` | ✅ | ✅ | Reposicionar pendiente RD |
| Category Licensed | `/barcos-con-licencia` | ✅ | ✅ | Schema oferta |
| FAQ | `/preguntas-frecuentes` | ✅ JSON-LD | ⚠️ body ES | Migrar Accordion |
| Blog listing | `/blog` | ✅ | ✅ | Multi-idioma JSONB |
| Blog detail | `/blog/{slug}` | ✅ | ✅ | BlogPosting + E-E-A-T |
| Routes (rutas marítimas) | — | ❌ no existen landings | — | Crear (Tier 2 #7) |
| Pricing | `/precios` | ✅ | ✅ | 54 claves i18n |
| Gallery | `/galeria` | ✅ | ✅ | — |
| Testimonios | `/testimonios` | ✅ | ✅ | — |
| Glossary | `/glosario-nautico` | ✅ | ✅ | DefinedTermSet 18 términos |
| About | `/sobre-nosotros` | ✅ | ✅ | — |
| Gift Cards | `/tarjetas-regalo` | ✅ | ✅ | — |
| Legal (5 páginas) | varios | ✅ | ✅ | Robots: index,nofollow |
| Login / Dashboard / Onboarding / Cancel | — | ❌ | — | `noindex` correcto |

**Totales:**
- Páginas públicas con SEO completo + i18n vivo: **20/30**
- Con SEO completo, deuda i18n: **4/30** (3 locations + FAQ body)
- Skeleton / sin contenido: **3/30** (Malgrat, Sta Susanna, Calella)
- Faltan crear: **2** (Excursión Privada, landings de rutas marítimas)
- `noindex` correcto: **5+** (login, dashboard, onboarding, etc.)

---

## 7. Próximos pasos

1. **El dueño aporta los 8 inputs** del apartado 5.
2. **Verificación del RD 1188/2025** (obligatorio antes de tocar `category-license-free`).
3. **Decisiones tácticas** sobre 3 locations skeleton + i18n para nuevas landings.
4. **Segundo turno**: diseño de estrategia priorizada de temporada (junio-septiembre) que ataque Tier 1 + Tier 2 con los inputs reales, no con supuestos. Incluirá calendario editorial blog (aprovechando blog autopilot existente), priorización GBP/Map Pack, plan de link building local, y critique final con supuestos y dependencias.
