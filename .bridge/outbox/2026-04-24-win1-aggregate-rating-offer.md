---
status: SUCCESS (delta over c824d30)
date: 2026-04-25
commit: 8aa9d8d
diff: +14 / -0 (1 file: server/seoInjector.ts)
---

# WIN #1 — AggregateRating + Offer en landings

## Status: SUCCESS (delta-only)

## Fase 1 — Descubrimiento

**Generador localizado:** `server/seoInjector.ts:1574-1598` (`buildLandingService`).
SSR @graph injection. Cliente React tiene `<SEO>` que se silencia cuando server inyecta.

**Bloque AggregateRating actual** (línea 1513-1522):
```ts
function buildAggregateRating(): object {
  const stats = getCurrentStats();
  return {
    "@type": "AggregateRating",
    ratingValue: stats.rating.toFixed(1),
    bestRating: "5",
    worstRating: "1",
    reviewCount: String(stats.userRatingCount),
  };
}
```
Datos: DB-backed (`business_stats` row, hidratado en startup, refresco horario) con fallback a `shared/businessProfile.ts` (`BUSINESS_RATING=4.8`, `BUSINESS_REVIEW_COUNT=310`).

**Bloque AggregateOffer actual** (líneas 1586-1596 de `buildLandingService`):
```ts
offers: {
  "@type": "AggregateOffer",
  lowPrice: String(priceRange.low),
  highPrice: String(priceRange.high),
  priceCurrency: "EUR",
  availability: "https://schema.org/InStock",
  availabilityStarts: `${SEASON_YEAR}-04-01`,
  availabilityEnds: `${SEASON_YEAR}-10-31`,
  priceValidUntil: `${SEASON_YEAR}-10-31`,
  seller: { "@type": "LocalBusiness", "@id": `${BASE_URL}/#organization` },
}
```

**Cifras consistentes:** 4.8★ / 310 reseñas / 70-420€ EUR. ✓
**`shared/businessProfile.ts`:** YA EXISTE (no requiere creación).

## Fase 2 — Auto-aprobación

| Check | Resultado |
|---|---|
| git log HEAD válido | ✅ c824d30 reciente |
| git status limpio | ⚠️ WIP de WIN #2 presente (validado y commiteado primero, salvaguarda 3) |
| tsc baseline (--max-old-space-size=8192) | ✅ 0 errores |
| Generador identificado | ✅ `buildLandingService` reutilizable |
| Cifras 4.8/310 confirmadas | ✅ vía `BUSINESS_RATING` constants + `getCurrentStats()` |
| Las 7 rutas emiten JSON-LD | ✅ verificado en switch principal de `seoInjector.ts` |

**Hallazgo clave:** El commit `c824d30` (2026-04-24) ya cubrió 6 de las 8 landings auditadas (Service schema con AggregateRating + AggregateOffer en `/alquiler-barcos-blanes`, `/alquiler-barcos-lloret-de-mar`, `/alquiler-barcos-tossa-de-mar`, `/barcos-sin-licencia`, `/barcos-con-licencia`, `/precios`). Como `c824d30` está en `origin/main` pero NO publicado en prod (Ivan hace Publish manual), prod aún muestra el estado pre-c824d30 que matchea exactamente la auditoría del brief.

**Verificación prod 2026-04-25 vía `curl ... | grep -oE '"AggregateRating"|"AggregateOffer"|"Offer"'`:**
| URL | Brief audit | Prod 2026-04-25 |
|---|---|---|
| /es/alquiler-barcos-blanes | ❌ ❌ | (vacío) |
| /es/alquiler-barcos-lloret-de-mar | ❌ ❌ | (vacío) |
| /es/alquiler-barcos-tossa-de-mar | ❌ ❌ | (vacío) |
| /es/barcos-sin-licencia | ❌ ✅ | Offer |
| /es/barcos-con-licencia | ❌ ✅ | Offer |
| /es/precios | ❌ ✅ | Offer |
| /en/boat-rental-costa-brava | ✅ ❌ | Rating |
| /nl/boot-zonder-vaarbewijs | ❌ ✅ | Offer |

(Coincidencia 100%, confirma que `c824d30` aún no se ha publicado.)

**Slug-resolution check:** `/nl/boot-zonder-vaarbewijs` resuelve a `metaKey=/barcos-sin-licencia` vía `shared/i18n-routes.ts:28`. Por tanto, el handler `else if (metaKey === "/barcos-sin-licencia")` (extendido por `c824d30`) ya cubre el caso NL automáticamente cuando se haga Publish.

**Decisión:** APROBADO. El delta real es 1 ruta: `/en/boat-rental-costa-brava` (necesita Offer).

## Fase 3 — Ejecución

**Cambio:** Añadir handler explícito `else if (metaKey === "/boat-rental-costa-brava")` antes del fallback final, usando `buildLandingService(name, description, { low: 70, high: 420 })`. Esto inyecta Service schema con AggregateRating + AggregateOffer en el SSR @graph.

**Ubicación:** `server/seoInjector.ts:2887-2898` (insertado entre `/precios` y `/blog`).

**Validación:**
- `npx tsc --noEmit` (heap 8GB) → 0 errores ✓
- `npm run build` → verde ✓
- Inspección de fuente: handler usa `buildLandingService(...)` que SIEMPRE incluye `aggregateRating: buildAggregateRating()` + `offers: { "@type": "AggregateOffer", ... }`. Validado por inspección porque arrancar el server local requiere DB conectada.

**Commit:** `8aa9d8d` (mensaje ajustado para reflejar que es delta sobre `c824d30`, no greenfield — el mensaje "exacto" del brief mentiría sobre el alcance real).

**Push:** `8aa9d8d → origin/main` sin drift.

## Prueba JSON-LD esperado para `/en/boat-rental-costa-brava` post-Publish

Cuando Ivan haga Publish, el SSR para esta ruta inyectará:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Boat Rental Costa Brava 2026",
      "description": "Boat rental on the Costa Brava from Blanes port. License-free boats from 70 EUR/hour (fuel included). Licensed boats and private excursions with captain available. Up to 12 people. Hidden coves, snorkel spots and medieval coastal villages.",
      "provider": { "@type": "LocalBusiness", "@id": "https://www.costabravarentaboat.com/#organization" },
      "areaServed": { ... GEO_HIERARCHY ... },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": "310"
      },
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "70",
        "highPrice": "420",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        ...
      }
    },
    { "@type": "BreadcrumbList", ... }
  ]
}
```

Ambos `AggregateRating` y `AggregateOffer` presentes ✓.

## Notas

1. El brief asumía un greenfield WIN #1 con un único commit que hace todo. La realidad es:
   - `c824d30` (24 abr) → 6 rutas
   - `8aa9d8d` (este commit) → 1 ruta más (`/en/boat-rental-costa-brava`)
   - 1 ruta cubierta automáticamente vía slug i18n routing (`/nl/boot-zonder-vaarbewijs` → `/barcos-sin-licencia`)
2. `shared/businessProfile.ts` ya existía con cifras 4.8/310 — el brief proponía crearlo "if not exists", correctamente resuelto.
3. El mensaje del commit difiere del brief literal; refleja el alcance real (delta sobre `c824d30`). Documentado en outbox para trazabilidad.
