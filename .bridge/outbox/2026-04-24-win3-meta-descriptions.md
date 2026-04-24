---
status: SUCCESS
date: 2026-04-25
commit: d5a48e5
diff: +7 / -7 (1 file: server/seoInjector.ts)
---

# WIN #3 — Meta descriptions EN/NL/DE/FR

## Status: SUCCESS

## Fase 1 — Descubrimiento

**Fuente única de meta descriptions:** `server/seoInjector.ts` constante `STATIC_META` (líneas 119+). Cada metaKey tiene 8 idiomas con `title`, `description`, opcionalmente `ogTitle` / `ogDescription`. SSR-injected directamente en el HTML.

**Slug-resolution para URLs no-ES:** vía `shared/i18n-routes.ts` — `pathToStaticMetaKey('/nl/boot-zonder-vaarbewijs')` → `metaKey=/barcos-sin-licencia, lang=nl`. Edita el bloque `nl` del metaKey base.

**Mapeo URLs → metaKey + lang:**
| URL del brief | metaKey | lang |
|---|---|---|
| /en/boat-rental-costa-brava | /boat-rental-costa-brava | en (+ es fallback) |
| /nl/boot-zonder-vaarbewijs | /barcos-sin-licencia | nl |
| /nl/boot-huren-tossa-de-mar | /alquiler-barcos-tossa-de-mar | nl |
| /nl/boot-huren-lloret-de-mar | /alquiler-barcos-lloret-de-mar | nl |
| /de/ home | / | de |
| /fr/ home | / | fr |

## Fase 2 — Auto-aprobación

| Check | Resultado |
|---|---|
| Fuente única localizada | ✅ `STATIC_META` en `seoInjector.ts` |
| Modificación bulk sin duplicación | ✅ (ediciones puntuales, sin lógica nueva) |
| tsc verde | ✅ |
| Diff <50 líneas | ✅ (14 líneas, 7 cambios) |

## Fase 3 — Ejecución

**Compresión a ≤160 chars** — 3 propuestas del brief excedían:
| URL | Brief len | Final len | Ajuste |
|---|---|---|---|
| /en/boat-rental-costa-brava | 150 | 150 | sin cambio |
| /nl/boot-zonder-vaarbewijs | 165 | 158 | quitar "Google" antes de reviews |
| /nl/boot-huren-tossa-de-mar | 151 | 151 | sin cambio |
| /nl/boot-huren-lloret-de-mar | 156 | 156 | sin cambio |
| /de/ home | 175 | 155 | quitar ", Costa Brava" + "Google-" prefix |
| /fr/ home | 177 | 154 | quitar ", Costa Brava" + "Google" + "de" antes briefing |

**Estrategia de compresión** (siguiendo el brief: "comprime manteniendo 4.8★ + precio + CTA"):
- Quitar redundancia geográfica cuando "Blanes" ya está en la string
- Mantener todos los social-proof signals (4.8★ + 310 reviews)
- Mantener price anchor (€70/h o €70/u)
- Mantener CTA local-idiomático

**Descripciones finales aplicadas:**

```
en/boat-rental-costa-brava (150ch):
"Rent a boat in Blanes, Costa Brava from €70/h. License-free, fuel included, up to 7 people. 4.8★ · 310 Google reviews · 15 min training · book online."

nl/boot-zonder-vaarbewijs (158ch):
"Huur een boot zonder vaarbewijs in Blanes, Costa Brava vanaf €70/u. Brandstof inbegrepen, tot 7 personen. 4.8★ · 310 reviews · 15 min training. Online boeken."

nl/boot-huren-tossa-de-mar (151ch):
"Vaar naar Tossa de Mar vanaf Blanes. Boot huren zonder vaarbewijs vanaf €70/u. Brandstof inbegrepen, tot 7 personen. 4.8★ · 310 reviews. Online boeken."

nl/boot-huren-lloret-de-mar (156ch):
"Vaar naar Lloret de Mar vanaf Blanes. 7 cala's op de route. Boot huren zonder vaarbewijs vanaf €70/u. Brandstof inbegrepen. 4.8★ · 310 reviews. Boek online."

de/home (155ch):
"Bootsverleih Hafen Blanes — ohne Führerschein ab 70€/h. Kraftstoff inklusive, bis zu 7 Personen. 4.8★ · 310 Bewertungen · 15 Min Einweisung. Online buchen."

fr/home (154ch):
"Location de bateau au Port de Blanes — sans permis dès 70€/h. Carburant inclus, jusqu'à 7 personnes. 4.8★ · 310 avis · 15 min briefing. Réservez en ligne."
```

**Validación:**
- `npx tsc --noEmit` (heap 8GB) → 0 errores ✓
- `npm run build` → verde ✓
- `grep` confirma 7 ocurrencias de las 6 nuevas descripciones (la 7ª es el fallback `es` de `/boat-rental-costa-brava` que duplicaba la `en`).

**Commit:** `d5a48e5` — mensaje exacto del brief WIN #3.
**Push:** `8aa9d8d..d5a48e5` sin drift.

## Diff stat

```
1 file changed, 7 insertions(+), 7 deletions(-)
```

## Notas

- 7 líneas modificadas para 6 URLs porque `/boat-rental-costa-brava` tiene `en` y `es` con la misma description (la `es` es el fallback que se usa cuando alguien acceda a esa ruta con lang=es por algún edge case). Se actualizan ambas para consistencia.
- No se aplicó a "i18n equivalentes" más allá de las 6 URLs del brief — el brief es preciso en qué páginas tienen impressions sin clicks. Otros idiomas (CA, IT, RU) ya tenían descriptions decentes con 4.8★ + precio para esos metaKeys.
- Strings idiomáticas verificadas: "Online boeken" (NL CTA estándar), "Online buchen" (DE), "Réservez en ligne" (FR), "book online" (EN).
