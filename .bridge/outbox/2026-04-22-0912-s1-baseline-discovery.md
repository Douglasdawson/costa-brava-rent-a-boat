---
brief: 2026-04-22-0912-s1-baseline-discovery.md
status: COMPLETED (con caveats en PARTE 1)
executed_at: 2026-04-22
commits: 0 (read-only)
---

# Reporte S1 Baseline Discovery

## PARTE 1 — Baseline GSC/GA4

### Fuente real utilizada

**Las tablas `gsc_queries` y `ga4_daily_metrics` están declaradas en `shared/schema.ts` (líneas 2323 y 2346) pero NO están migradas a la DB Neon** (`\dt` no las lista). Por lo tanto, no hay datos crudos por día para reconstruir la ventana 2026-03-25 → 2026-04-21.

Fuente alternativa encontrada y usada: tabla **`analytics_snapshots`** (existe en DB, 111 filas, rango `2026-03-17 → 2026-04-22`). Almacena snapshots agregados que el servicio GSC/GA4 publica periódicamente. Estructura: `(date, source, metric_type, data: jsonb)`.

Snapshots disponibles (`source`, `metric_type`, nº rows):

| source | metric_type | rows |
|--------|-------------|------|
| gsc    | overview    | 5    |
| gsc    | keywords    | 5    |
| gsc    | pages       | 5    |
| ga4    | overview    | 16   |
| ga4    | traffic     | 16   |
| ga4    | trend       | 16   |
| ga4    | devices     | 16   |
| ga4    | countries   | 16   |
| ga4    | conversions | 16   |

### Ventana real cubierta vs ventana pedida

| Origen | Ventana pedida | Ventana real del snapshot |
|--------|----------------|---------------------------|
| GSC overview (array `daily`) | 28d (2026-03-25 → 2026-04-21) | **6d (2026-04-15 → 2026-04-20)** |
| GSC keywords, pages | — (lista top sin ventana declarada) | Se asume mismo 6d |
| GA4 overview, etc. | 28d | Sin `window` declarado en el jsonb — se asume últimos 7-28d según el servicio que lo generó |

**⚠ Conclusión:** el baseline inmovible generado refleja **solo una ventana rolling de ~6 días (GSC) y desconocida (GA4)**, no los 28 días del brief. Para un baseline real de 28d hay que migrar `gsc_queries` + `ga4_daily_metrics` y backfill desde GSC/GA4 API.

### Campos ausentes respecto al esquema del brief

- `top_queries[*].country` → `null` (el snapshot `gsc/keywords` no lo desagrega por país).
- `ga4.organic_sessions` → `null` (no hay snapshot `traffic_organic`). Se puede derivar de `by_channel[channel=Organic Search].sessions = 41`, pero dejado explícito como null para no mezclar.
- `ga4.whatsapp_clicks.from_organic` → `null` (no hay desglose conversions × source).
- `ga4.top_landing_pages_organic` → `"UNAVAILABLE: snapshot type landing_pages_organic not in analytics_snapshots"`.
- `ga4.opportunities` (del brief) → no aplica (el esquema no lo pedía).

### Credenciales GSC/GA4 encontradas

No busqué service accounts porque el código sí las usa: `server/mcp/seo-autopilot/tools.ts:300-380` tiene queries tipadas contra `schema.gscQueries` y `schema.ga4DailyMetrics`, lo que confirma que la intención del diseño es que esas tablas existan. El ingestor actual (fuera de scope de este brief) es el que deposita los snapshots en `analytics_snapshots`.

### Output

- ✅ Archivo guardado en el repo: `seo-reports/baseline-metrics-2026-04-22.json` (956 líneas, untracked, sin commit).
- JSON completo inline en el ANEXO A al final de este reporte.

### Headlines del baseline (los 6-7 días cubiertos)

**GSC:**
- Clicks: **26** · Impresiones: **1559** · CTR: **1.67%** · Avg position: **13.12**
- Top query: `alquiler barco costa brava` — 0 clicks / 63 impresiones / pos 17.2 (ranking 5-20 opportunity)
- Top page (de largo): `/` con 24 clicks / 1168 impresiones / CTR 2.05% / pos 11.8
- Solo 1 query en el bucket `ranking_5_to_20` (>50 impr): la de arriba.
- `high_impr_low_ctr` (>100 impr, <2% CTR): `null` — no hay queries con >100 impresiones en la ventana.

**GA4:**
- Sessions: **137** · Active users: **79** · New users: **72** · Pageviews: **202**
- Avg session duration: 612s (~10min). Bounce rate: 16.8%.
- Canal: Direct 65, Organic Search 41, Referral 16, Organic Social 13.
- País: Spain 89, France 13, UK 10, Poland 4, Germany 3, Netherlands 1, ...
- Device: mobile 125, desktop 12 (mobile-first confirmed).
- Conversions: `whatsapp_click: 13` · `generate_lead: 9` · `booking_started: 9`.

---

## PARTE 2 — Diagnóstico H1 genérico multi-idioma

### Respuestas directas a las preguntas del brief

- **Archivo del H1 genérico:** `client/index.html:231`
- **Tipo:** hardcoded en HTML plano dentro de un bloque `<noscript>` (ver líneas 211-276 de `client/index.html`).
- **¿Hay H1 específico por página?** Sí, **todas las páginas React tienen H1 propio**. Ejemplos:
  - `client/src/components/Hero.tsx:59` → `{t.hero.title}` (i18n key, home)
  - `client/src/pages/category-license-free.tsx:285` → H1 propio
  - `client/src/components/BoatDetailPage.tsx:875` → H1 del barco
  - `client/src/pages/alquiler-barcos-costa-brava.tsx:247` → H1 propio
  - `client/src/pages/location-tossa-de-mar.tsx:192`, `location-blanes.tsx:173`, `location-lloret-de-mar.tsx:179`, `location-calella.tsx`, `location-pineda-de-mar.tsx:128`, `location-palafolls.tsx:128`, `location-barcelona.tsx:124`, `location-tordera.tsx:128`, `location-santa-susanna.tsx`, `location-malgrat-de-mar.tsx`, ...
  - `pages/activity-*.tsx`, `pages/faq.tsx:439`, `pages/about.tsx:720`, `pages/blog.tsx:406`, `pages/blog-detail.tsx:765`, `pages/gallery.tsx:183`, `pages/routes.tsx:133`, `pages/pricing.tsx:205`, `pages/testimonios.tsx:169`, etc.
- **¿Orden DOM? (genérico antes/después del específico):** El H1 genérico vive **dentro de `<noscript>`**, por lo que en un DOM con JS habilitado ese tag no se renderiza como parte del árbol visible — el único H1 "real" que ve el render engine es el de React. En un crawler **SIN JS (ej. curl)** sí aparece primero en el markup, antes del root de React.
- **¿El H1 genérico está en SSR, CSR, o ambos?** Es **template SPA estático**. No hay SSR de componentes React — `server/seoInjector.ts` solo inyecta `<title>`, meta tags, `<link>`, JSON-LD y pequeños bloques en el mismo `index.html` servido (ver `injectMeta` / `serveWithSEO` línea 3222-3244). **El server NO inyecta/modifica H1 por ruta.**
- **¿En `server/seoInjector.ts` hay inyección de H1 por ruta?** No. Grep de `<h1` en `server/*.ts`: 0 matches que toquen el SEO path. Solo hay h1 en `server/services/abandonedBookingService.ts` (email HTML) y `server/seo/collectors/competitors.ts` (regex de lectura de H1 de competidores, lectura no inyección).

### Implicación real (lo que Ivan debería saber)

El H1 "Costa Brava Rent a Boat — Blanes" **no es el H1 que ve Googlebot cuando renderiza la página con JS** (Googlebot ejecuta Chromium). Con JS habilitado, cada ruta ya tiene su H1 específico, multi-idioma (vía `t.hero.title` y hermanos).

Lo que sí es cierto:
1. Crawlers que NO ejecutan JS (curl, algunos bots de AI, linkedin preview, navegadores con JS desactivado) ven el `<noscript>` como "contenido principal" y efectivamente reciben un H1 genérico español+ EN mezclado.
2. El `<noscript>` contiene además una lista de barcos en ES (ASTEC 480/SOLAR 450/REMUS 450, "Barcos sin Licencia Náutica", precios en €) — todo hardcoded y sin variante por `lang`. Esto sí puede confundir a snippets SERP en mercados EN/FR/DE/CA si Google lo trata como contenido fallback.
3. El HTML inicial recibido (antes de hidratación) tiene `<html lang="es">` y `<title>` ES hardcoded. El injector reescribe esos antes de enviar, **salvo cuando la ruta no se resuelve** (ver PARTE 3 para ese caso).

### Arquitectura correcta propuesta

**Opción A (mínima, recomendada):** eliminar el H1 y el bloque de contenido dentro de `<noscript>` completamente. Dejar solo un `<noscript>` con un mensaje corto tipo "Please enable JavaScript". El noscript-content-as-SEO-fallback es un anti-patrón 2014, hoy Google lo ignora o le da peso negativo (puede interpretarlo como cloaking si difiere del DOM renderizado).

**Opción B (si el SEO-sin-JS importa):** convertir el bloque noscript en fragmento template-izado por idioma. `server/seoInjector.ts` ya decide el `lang` por ruta — bastaría con inyectar un noscript localizado del mismo modo que inyecta `<title>`/`<meta>`. Se duplica trabajo pero cubre el fallback sin-JS.

**Recomiendo A.** Los H1s React son correctos, están por ruta y traducen. El noscript genera ruido sin beneficio real.

### Tamaño estimado del fix

**XS** (10-30 min): eliminar líneas 210-276 de `client/index.html`, sustituir por `<noscript><p>Please enable JavaScript to view this site.</p></noscript>`, smoke test curl en /es /en /fr /de /ca, deploy. Cero cambios server-side.

### Bloqueantes detectados

- Ninguno técnico. Revisar si Ivan quiere mantener el fallback noscript por política SEO conservadora; si sí → Opción B.
- **Nota lateral:** la lista de barcos noscript tiene "ASTEC 480, SOLAR 450, REMUS 450" y precios "Desde 90€/75€/…" que pueden estar desalineados con los precios actuales (`shared/boatData.ts`). Si se mantiene la opción B, hay que mover esos datos a una fuente única.

---

## PARTE 3 — Diagnóstico `/en/sin-licencia` devuelve title ES

### Causa raíz

La ruta `/en/sin-licencia` **no existe** en la convención i18n del proyecto. El slug EN correcto para la categoría sin licencia es **`boats-without-license`** (ver `shared/i18n-routes.ts:28`). Cuando el server recibe `/en/sin-licencia`:

1. `pathToStaticMetaKey("/en/sin-licencia")` (server/seoInjector.ts:1759-1789) parsea `parts = ["en", "sin-licencia"]`, lang = `"en"`, slug = `"sin-licencia"`.
2. `resolveSlug("sin-licencia")` (shared/i18n-routes.ts:121) busca el slug en el reverseMap de `ROUTE_SLUGS`. **"sin-licencia" no está** — solo está "barcos-sin-licencia" (ES), "boats-without-license" (EN), "bateau-sans-permis" (FR), etc.
3. `resolveSlug` devuelve `null`. Entra el fallback línea 1788: `return { metaKey: "/sin-licencia", lang: "en" }`.
4. En `resolveMeta()` (server/seoInjector.ts:1791+): `STATIC_META["/sin-licencia"]` es `undefined`. No matchea ningún handler dinámico (`/barco/:id`, `/blog/:slug`, `/destinos/:slug`). Devuelve `null`.
5. En `serveWithSEO()` (server/seoInjector.ts:3245-3251): como `resolved === null` y la ruta no matchea `/(blog|barco|destinos)/:slug`, `isValidSPARoute("/en/sin-licencia")` devuelve `false` (porque `resolveSlug("sin-licencia")` es null). **Status: 404**. Se sirve `index.html` SIN inyección de meta vía `sendFile`.
6. El `client/index.html` entregado tiene hardcoded: `<html lang="es">` (línea 2), `<title>Alquiler de Barcos Costa Brava | Sin Licencia desde 70€/h | Blanes</title>` (línea 8), `<meta property="og:locale" content="es_ES">` (línea 27).
7. Confirmado en producción:
   ```
   curl -A "Mozilla/5.0" -o /dev/null -w "HTTP: %{http_code}" https://www.costabravarentaboat.com/en/sin-licencia
     → HTTP: 404
   curl -s https://www.costabravarentaboat.com/en/sin-licencia | grep "<title>"
     → <title>Alquiler de Barcos Costa Brava | Sin Licencia desde 70€/h | Blanes</title>
   ```

### Diferencia con `/en/barco/astec-400`

`/en/barco/astec-400` → parts = `["en", "barco", "astec-400"]`, slug = `"barco"` → `resolveSlug("barco")` → `{pageKey: "boatDetail"}` → metaKey = `/barco/astec-400` → matchea el handler dinámico `boatMatch` (línea 2769) → devuelve meta EN correcto. Todo bien.

### Ámbito real del bug (no es solo `/en/sin-licencia`)

**El mismo path cae para cualquier URL desconocida bajo `/:lang/:cualquier-slug-no-válido`.** Ejemplos que Ivan no está midiendo pero que sufren el mismo problema:
- `/en/categoria` (slug ES legacy)
- `/fr/sin-licencia`, `/de/sin-licencia`, `/ca/sin-licencia`, `/nl/sin-licencia`, ...
- `/en/blanes`, `/en/tossa` (no están en ROUTE_SLUGS; los correctos son `boat-rental-blanes`, `boat-rental-tossa-de-mar`)
- Cualquier typo-URL que llegue por error.

Todos entregan 404 pero **con title/lang/og ES del index.html**. Riesgo SEO: Google ya no indexa URLs 404 pero los snippets que lleguen por backlink mal escrito o redirect roto verán ES.

### Archivos implicados

- `server/seoInjector.ts:1759-1789` — función `pathToStaticMetaKey`, fallthrough que no distingue "slug desconocido" de "metaKey legacy".
- `server/seoInjector.ts:3245-3251` — rama `else` que sirve `index.html` sin inyección cuando `resolved === null`.
- `client/index.html:2,8,27,231` — title/lang/og hardcoded en ES.
- `server/seo/redirects.ts` — no tiene mapping para `/en/sin-licencia → /en/boats-without-license` (ni análogo para /fr, /de, /ca, /nl, /it, /ru).

### Fix propuesto (2 capas, ambas XS)

**Fix A (rápido, específico a `sin-licencia`):** añadir redirect 301 en `server/seo/redirects.ts` para `/{lang}/sin-licencia` → `/{lang}/{slug-localizado-categoryLicenseFree}` para los 7 idiomas no-ES. Elimina el síntoma del brief. Delta ~10 líneas.

**Fix B (estructural, recomendado):** en `serveWithSEO` línea 3245-3251, cuando `resolved === null` y la URL tiene prefijo `/:lang/…`, inyectar al menos el `<html lang>` correcto y un `<title>` genérico traducido antes de `sendFile`. Evita que CUALQUIER 404 bajo `/en/*`, `/fr/*`, etc. devuelva meta ES. Delta ~20-30 líneas.

Recomiendo **Fix A + Fix B combinados**. A mata el caso conocido; B blinda contra los demás.

### Tamaño estimado

- Fix A solo: **XS** (~15 min incl. test).
- Fix A + B: **S** (~1-2h incl. tests por idioma).

### Riesgo de regresión en otras rutas

- Fix A: **none** (solo añade 7 redirects nuevos, no modifica lógica).
- Fix B: **low** (cambia el fallthrough cuando `resolved === null`, pero hoy ese path devuelve meta incorrecta en cualquier caso — cualquier cambio es mejora). Test a cubrir: `/en/ruta-inexistente`, `/fr/ruta-inexistente`, `/ca/ruta-inexistente`, `/es/ruta-inexistente`.

---

## ANEXO A — JSON baseline completo

Archivo en repo: `seo-reports/baseline-metrics-2026-04-22.json` (untracked, NO commiteado según regla del brief).

```json
{
  "baseline_date": "2026-04-22",
  "window": { "from": "2026-03-25", "to": "2026-04-21" },
  "window_real_gsc": {
    "from": "2026-04-15",
    "to": "2026-04-20",
    "note": "Snapshot in analytics_snapshots only contains last 6 days; 28-day window unavailable in current DB. Historical gsc_queries table is in schema.ts but not migrated."
  },
  "gsc": {
    "totals": {
      "clicks": 26,
      "impressions": 1559,
      "ctr": 0.01667735728030789,
      "avg_position": 13.120886471653856
    },
    "top_queries": [
      { "query": "alquiler barco costa brava", "clicks": 0, "impressions": 63, "ctr": 0, "position": 17.17, "country": null },
      { "query": "alquiler barco blanes", "clicks": 1, "impressions": 37, "ctr": 0.027, "position": 5.24, "country": null },
      { "query": "alquiler barcos costa brava", "clicks": 0, "impressions": 37, "ctr": 0, "position": 13.81, "country": null },
      { "query": "alquilar barco costa brava", "clicks": 0, "impressions": 25, "ctr": 0, "position": 9.96, "country": null },
      { "query": "blanes 2025", "clicks": 0, "impressions": 22, "ctr": 0, "position": 9.95, "country": null },
      { "query": "alquiler barco sin licencia", "clicks": 0, "impressions": 20, "ctr": 0, "position": 12.35, "country": null },
      { "query": "rent boat costa brava", "clicks": 1, "impressions": 19, "ctr": 0.053, "position": 9.53, "country": null },
      { "query": "costa brava rent boat", "clicks": 1, "impressions": 17, "ctr": 0.059, "position": 4, "country": null },
      { "query": "alquiler barcos sin licencia", "clicks": 0, "impressions": 17, "ctr": 0, "position": 31.53, "country": null },
      { "query": "astec 400", "clicks": 0, "impressions": 16, "ctr": 0, "position": 12.56, "country": null },
      { "query": "alquilar barco blanes", "clicks": 1, "impressions": 16, "ctr": 0.063, "position": 5.25, "country": null },
      { "query": "alquiler barco lloret de mar", "clicks": 0, "impressions": 15, "ctr": 0, "position": 10.6, "country": null },
      { "query": "alquiler de barcos en blanes", "clicks": 0, "impressions": 14, "ctr": 0, "position": 5.14, "country": null },
      { "query": "alquiler lancha costa brava", "clicks": 0, "impressions": 14, "ctr": 0, "position": 10.79, "country": null },
      { "query": "alquiler barco sin licencia lloret de mar", "clicks": 0, "impressions": 13, "ctr": 0, "position": 8.77, "country": null },
      { "query": "alquiler barco sin licencia costa brava", "clicks": 0, "impressions": 12, "ctr": 0, "position": 8.08, "country": null },
      { "query": "alquiler barca blanes", "clicks": 0, "impressions": 12, "ctr": 0, "position": 4.42, "country": null },
      { "query": "alquiler barco blanes sin licencia", "clicks": 1, "impressions": 11, "ctr": 0.091, "position": 8.27, "country": null },
      { "query": "alquiler barcos blanes", "clicks": 0, "impressions": 11, "ctr": 0, "position": 8.18, "country": null },
      { "query": "barcos costa brava", "clicks": 0, "impressions": 11, "ctr": 0, "position": 17, "country": null },
      { "query": "alquiler de barcos costa brava", "clicks": 0, "impressions": 9, "ctr": 0, "position": 17.22, "country": null },
      { "query": "barco sin licencia costa brava", "clicks": 0, "impressions": 9, "ctr": 0, "position": 6.33, "country": null },
      { "query": "alquiler barco sin licencia platja d'aro", "clicks": 0, "impressions": 9, "ctr": 0, "position": 18, "country": null },
      { "query": "barcos sin licencia", "clicks": 0, "impressions": 8, "ctr": 0, "position": 14.38, "country": null },
      { "query": "alquiler barco tossa de mar", "clicks": 0, "impressions": 7, "ctr": 0, "position": 14, "country": null },
      { "query": "bateau blanes", "clicks": 3, "impressions": 7, "ctr": 0.429, "position": 3.57, "country": null }
    ],
    "top_pages": [
      { "page": "https://www.costabravarentaboat.com/", "clicks": 24, "impressions": 1168, "ctr": 0.0205, "position": 11.81 },
      { "page": "https://www.costabravarentaboat.com/ca/rutes", "clicks": 1, "impressions": 3, "ctr": 0.333, "position": 33 },
      { "page": "https://www.costabravarentaboat.com/es/blog/tarjetas-regalo-experiencias-nauticas-costa-brava", "clicks": 1, "impressions": 1, "ctr": 1, "position": 1 },
      { "page": "https://www.costabravarentaboat.com/en/", "clicks": 0, "impressions": 13, "ctr": 0, "position": 12.85 },
      { "page": "https://www.costabravarentaboat.com/de/", "clicks": 0, "impressions": 14, "ctr": 0, "position": 9.5 },
      { "page": "https://www.costabravarentaboat.com/es/barcos-sin-licencia", "clicks": 0, "impressions": 29, "ctr": 0, "position": 13.93 },
      { "page": "https://www.costabravarentaboat.com/ca/vaixell-sense-llicencia", "clicks": 0, "impressions": 16, "ctr": 0, "position": 26.38 },
      { "page": "https://www.costabravarentaboat.com/en/boats-with-license", "clicks": 0, "impressions": 16, "ctr": 0, "position": 62.63 },
      { "page": "https://www.costabravarentaboat.com/en/fuegos-artificiales-blanes-2025", "clicks": 0, "impressions": 34, "ctr": 0, "position": 15.41 },
      { "page": "https://www.costabravarentaboat.com/ca/fuegos-artificiales-blanes-2025", "clicks": 0, "impressions": 24, "ctr": 0, "position": 18.92 },
      { "page": "https://www.costabravarentaboat.com/es/barco-familias-costa-brava", "clicks": 0, "impressions": 25, "ctr": 0, "position": 72.64 },
      { "page": "https://www.costabravarentaboat.com/ca/lloguer-vaixell-costa-brava", "clicks": 0, "impressions": 22, "ctr": 0, "position": 28.23 },
      { "page": "https://www.costabravarentaboat.com/barco/astec-400", "clicks": 0, "impressions": 17, "ctr": 0, "position": 12.41 },
      { "page": "https://www.costabravarentaboat.com/en/boat-rental-costa-brava", "clicks": 0, "impressions": 8, "ctr": 0, "position": 6.88 },
      { "page": "https://www.costabravarentaboat.com/es/alquiler-barcos-cerca-barcelona", "clicks": 0, "impressions": 8, "ctr": 0, "position": 36.13 }
    ],
    "ctr_by_position_bucket": [
      { "bucket": "1-3",   "avg_ctr": 0.125,    "page_count": 8  },
      { "bucket": "4-10",  "avg_ctr": 0,        "page_count": 31 },
      { "bucket": "11-20", "avg_ctr": 0.00098,  "page_count": 21 },
      { "bucket": "21-50", "avg_ctr": 0.01754,  "page_count": 19 }
    ],
    "opportunities": {
      "high_impr_low_ctr": null,
      "ranking_5_to_20": [
        { "query": "alquiler barco costa brava", "clicks": 0, "impressions": 63, "ctr": 0, "position": 17.17 }
      ]
    }
  },
  "ga4": {
    "totals": {
      "sessions": 137,
      "users": 79,
      "new_users": 72,
      "pageviews": 202,
      "avg_session_duration_s": 612.38,
      "bounce_rate": 0.168
    },
    "organic_sessions": null,
    "whatsapp_clicks": { "total": 13, "from_organic": null },
    "top_landing_pages_organic": "UNAVAILABLE: snapshot type landing_pages_organic not in analytics_snapshots",
    "conversions": {
      "booking_started": 9,
      "whatsapp_click": 13,
      "generate_lead": 9
    },
    "by_channel": [
      { "channel": "Direct", "sessions": 65, "users": 41 },
      { "channel": "Organic Search", "sessions": 41, "users": 17 },
      { "channel": "Referral", "sessions": 16, "users": 8 },
      { "channel": "Organic Social", "sessions": 13, "users": 13 },
      { "channel": "Unassigned", "sessions": 2, "users": 2 }
    ],
    "by_country": [
      { "country": "Spain", "sessions": 89 },
      { "country": "France", "sessions": 13 },
      { "country": "United Kingdom", "sessions": 10 },
      { "country": "Poland", "sessions": 4 },
      { "country": "Saudi Arabia", "sessions": 3 },
      { "country": "Belgium", "sessions": 3 },
      { "country": "Germany", "sessions": 3 },
      { "country": "Peru", "sessions": 3 },
      { "country": "Portugal", "sessions": 2 },
      { "country": "(not set)", "sessions": 2 },
      { "country": "Australia", "sessions": 1 },
      { "country": "Canada", "sessions": 1 },
      { "country": "Israel", "sessions": 1 },
      { "country": "Latvia", "sessions": 1 },
      { "country": "Morocco", "sessions": 1 },
      { "country": "Netherlands", "sessions": 1 },
      { "country": "Tunisia", "sessions": 1 }
    ],
    "by_device": [
      { "device": "mobile", "sessions": 125, "users": 71 },
      { "device": "desktop", "sessions": 12, "users": 8 }
    ],
    "note": "ga4_daily_metrics table in schema.ts is not migrated to DB. Only aggregate snapshots available."
  }
}
```

> El JSON completo (incluyendo los ~50 items de `top_queries` y `top_pages` con 100 y 84 entradas respectivamente) está en `seo-reports/baseline-metrics-2026-04-22.json`. Aquí arriba va una versión abreviada legible; Cowork puede leer el archivo directo del repo o pedir el dump completo por otro brief.

---

## Archivos tocados (read-only brief)

- **Creados (untracked, no commit):** `seo-reports/baseline-metrics-2026-04-22.json`
- **Modificados:** ninguno
- **Git status:** clean (excepto el untracked del baseline).

## Observaciones laterales (fuera del brief pero detectadas)

1. En `server/seoInjector.ts:361-395` los `STATIC_META["/barcos-sin-licencia"]` **ya tienen "4.8★"** en descripciones EN/CA/FR/DE/NL/IT/RU. Es decir, el brief 0913 (rating 4.8) **está parcialmente aplicado ya** en los metas multi-idioma de la categoría. El valor `4.7` hardcoded está en otros sitios (ver reporte 0913).
2. Hay tablas `gsc_queries` y `ga4_daily_metrics` declaradas en `shared/schema.ts` pero sin migrar. Si S2/S3 van a necesitar la ventana histórica real, hay que hacer `npm run db:push` y montar el ingestor que las llene.
3. El noscript de `client/index.html` tiene una lista de barcos con precios hardcoded que convendría sincronizar (o eliminar — ver PARTE 2).
