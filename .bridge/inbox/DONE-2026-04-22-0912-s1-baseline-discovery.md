---
type: read-only
priority: P0
expected_output: both
---

# S1 Baseline — GSC/GA4 snapshot + diagnóstico H1 generic + /en/sin-licencia ES leak

## Objetivo

Tres entregables, todos sin tocar código:

1. JSON baseline inmovible con métricas GSC (y GA4 si hay acceso) de los últimos 28 días — snapshot contra el que compararemos cada semana durante los 60 días hasta temporada alta.
2. Diagnóstico de por qué el H1 es genérico `"Costa Brava Rent a Boat — Blanes"` en todas las rutas multi-idioma.
3. Diagnóstico de por qué `/en/sin-licencia` devuelve title en ES aunque otras rutas `/en/*` sí traduzcan.

## Contexto

Smoke test curl del 2026-04-22 confirma:

```
/es/                                → title ES ✅, H1 "Costa Brava Rent a Boat — Blanes"
/en/                                → title EN ✅, H1 "Costa Brava Rent a Boat — Blanes"
/fr/                                → title FR ✅, H1 idem
/de/                                → title DE ✅, H1 idem
/ca/                                → title CA ✅, H1 idem
/en/sin-licencia                    → title ES ❌  ← el único /en/ que sigue leakeando
/en/barco/astec-400                 → title EN ✅, H1 genérico
/en/alquiler-barcos-tossa-de-mar    → title EN ✅, H1 genérico
/fr/barco/astec-400                 → title FR ✅, H1 genérico
/de/barco/astec-400                 → title DE ✅, H1 genérico
```

Los titles traducen bien (Round 2 + recientes). El H1 y `/en/sin-licencia` son los 2 tapones que aún bloquean ranking EN/FR/DE/CA.

## PARTE 1 — Baseline GSC/GA4

### 1.1 GSC

La tabla sync cada 6h está en el schema del proyecto. Identifícala (`gsc_data`, `search_console_data`, `seo_queries`, `seo_pages` — comprobar schema DB) y extrae:

**Ventana:** últimos 28 días → `2026-03-25` a `2026-04-21`.

Tres datasets en un único JSON (ver esquema abajo).

### 1.2 GA4

Investiga en este orden:

1. ¿Hay tabla local con eventos GA4? (`ga4_events`, `analytics_events`)
2. ¿Hay endpoint `/api/admin/analytics/ga4/*` que los sirva?
3. ¿Hay credenciales service account GA4 Reporting API? (`ga4-service-account.json`, env vars)

Si cualquiera existe → extrae según esquema. Si no, reporta `"ga4": "UNAVAILABLE: <razón>"` y continúa.

### 1.3 Esquema JSON

```json
{
  "baseline_date": "2026-04-22",
  "window": { "from": "2026-03-25", "to": "2026-04-21" },
  "gsc": {
    "totals": { "clicks": 0, "impressions": 0, "ctr": 0.0, "avg_position": 0.0 },
    "top_queries": [
      { "query": "...", "clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0, "country": "es|en|fr|de|..." }
      // top 50 por impresiones
    ],
    "top_pages": [
      { "page": "/es/...", "clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0 }
      // top 50 por clicks
    ],
    "ctr_by_position_bucket": [
      { "bucket": "1-3",   "avg_ctr": 0.0, "page_count": 0 },
      { "bucket": "4-10",  "avg_ctr": 0.0, "page_count": 0 },
      { "bucket": "11-20", "avg_ctr": 0.0, "page_count": 0 },
      { "bucket": "21-50", "avg_ctr": 0.0, "page_count": 0 }
    ],
    "opportunities": {
      "high_impr_low_ctr": [
        // queries con impresiones >100 y CTR <2% — oportunidad meta title/description
      ],
      "ranking_5_to_20": [
        // queries en posiciones 5-20 con impresiones >50 — oportunidad content boost
      ]
    }
  },
  "ga4": {
    "totals": { "sessions": 0, "users": 0, "pageviews": 0, "avg_session_duration_s": 0 },
    "organic_sessions": 0,
    "whatsapp_clicks": { "total": 0, "from_organic": 0 },
    "top_landing_pages_organic": [
      { "page": "...", "sessions": 0, "avg_duration_s": 0, "bounce_rate": 0.0, "whatsapp_click_rate": 0.0 }
      // top 30
    ],
    "conversions": {
      "booking_started": 0,
      "purchase": 0,
      "whatsapp_click": 0,
      "phone_click": 0
    },
    "by_country": [ { "country": "...", "sessions": 0 } ],
    "by_device": [ { "device": "mobile|desktop|tablet", "sessions": 0 } ]
  }
}
```

### 1.4 Output

Guardar en el repo:

```
seo-reports/baseline-metrics-2026-04-22.json
```

NO hacer commit. El archivo queda untracked; Cowork lo copiará a `.bridge/outbox/` o a `/mnt/COSTA BRAVA RENT A BOAT/seo-reports/` después.

Pegar también el JSON completo en el reporte en outbox (para que Cowork lo lea sin ir al repo).

## PARTE 2 — Diagnóstico H1 genérico multi-idioma

### Preguntas

1. ¿Qué componente React emite el H1 `"Costa Brava Rent a Boat — Blanes"`? Path exacto + línea.
2. ¿Es hardcoded en JSX, viene de una prop, o de una i18n key? Si es prop → ¿quién la pasa?
3. En las páginas específicas (boat detail, location, blog, category) ¿existe un H1 propio en el body que Google ignora porque está después del genérico en el DOM? ¿O directamente no hay H1 específico?
4. En `server/seoInjector.ts` — ¿hay inyección de H1 por ruta o solo meta tags?
5. ¿El H1 genérico está en SSR, CSR, o ambos?

### Formato del reporte

```
- Archivo del H1 genérico: <path>:<línea>
- Tipo: hardcoded | prop | i18n key
- ¿Hay H1 específico por página? sí/no — si sí, dar 3 ejemplos con path+línea
- ¿Orden DOM? (genérico antes/después del específico)
- Arquitectura correcta propuesta: <qué cambiar y dónde>
- Tamaño estimado del fix: XS | S | M | L
- Bloqueantes detectados: <cualquiera>
```

## PARTE 3 — Diagnóstico `/en/sin-licencia` devuelve title ES

### Contexto

```
curl https://www.costabravarentaboat.com/en/sin-licencia
→ <title>Alquiler de Barcos Costa Brava | Sin Licencia desde 70€/h | Blanes</title>
```

Otras rutas `/en/*` funcionan bien. Solo esta falla.

### Preguntas

1. ¿Hay entrada en `TRANSLATED_STATIC_PATHS` / allowlist SEO que cubra `/sin-licencia` pero no su variante `/en/sin-licencia`?
2. En `server/seoInjector.ts` — ¿cómo matchea la ruta? ¿metaKey `/sin-licencia` ignora el prefijo de idioma?
3. ¿Hay fallthrough a meta ES por defecto para esta ruta específicamente?
4. ¿Qué tiene diferente `/en/sin-licencia` de `/en/barco/astec-400` (que sí traduce)?

### Formato del reporte

```
- Causa raíz: <explicación técnica en 1-3 frases>
- Archivos implicados: <path>:<línea> × N
- Fix propuesto: <delta de código mínimo>
- Tamaño estimado: XS | S | M | L
- Riesgo de regresión en otras rutas: none | low | med | high
```

## Reglas

- **No hacer commits, no push, no editar archivos fuera de** `seo-reports/baseline-metrics-2026-04-22.json`.
- Si algo falla (ej. GA4 sin acceso), dilo explícito. No inventar números.
- Un único reporte en `outbox/` con las 3 partes en el orden PARTE 1 → PARTE 2 → PARTE 3.
- Si PARTE 1 tarda (queries grandes), reporta primero PARTE 2 + PARTE 3 y luego amplía con PARTE 1 — no bloquees el diagnóstico por esperar la extracción.
