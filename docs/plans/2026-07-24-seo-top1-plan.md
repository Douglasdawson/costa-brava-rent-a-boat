# Plan SEO "aparecer los primeros" — 2026-07-24

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para ejecutar tarea a tarea.

**Goal:** Convertir las posiciones top-2 que ya tenemos en clics y leads: subir CTR de la home, recuperar el cluster "sin licencia" (pos 5-12), dominar el map pack via GBP, y vaciar la bandeja de distribución.

**Criterio de "hecho":** cambios en prod verificados (SSR sirve los meta nuevos, rutas clave 200), landing sin licencia reforzada + reindexada en GSC, bandeja de distribución a 0 (publicado, descartado o entregado a Ivan como checklist copy-paste), checklist GBP entregada con los 3 gestos que solo Ivan puede hacer.

**Contexto (datos 26 jun - 24 jul):** home pos 1,4-1,9 en las queries grandes pero CTR 1,7%; "alquiler barco costa brava por horas" pos 1,9 con CTR 0,7%; cluster "sin licencia" pos 5,6-12 y cayendo; GBP 4,8★/381 reseñas con OAuth sin conectar; 22 distribuciones pendientes + 5 fallidas (todas por gesto/permiso, no por contenido).

**Diagnóstico previo que NO se toca:** hreflang y el split `/` vs `/es/` (lag de Google), infraestructura SEO (completa), volumen de blog (49 publicados; primero distribuir).

---

## Fase 1 — CTR quirúrgico en meta descriptions/titles (código, autónomo)

Los titles ya llevan precio + ★4.8 (reescritura 2026-06-10, respetar la des-canibalización: "sin licencia" NO vuelve al title de la home). El margen está en descriptions y en la query "por horas".

### Task 1.1: atacar "por horas" sin romper la des-canibalización
**Files:** `client/src/utils/seo-config.ts` (home + pricing, 8 idiomas), `server/seoInjector.ts` (STATIC_META espejo — regla bug Lloret/Maresme)
- Meta description de la home (8 idiomas): incluir "por horas, medio día o día completo" + CTA de reserva. NO tocar el title de la home.
- Title de pricing: ya dice "Precios... Desde 75€/h" — añadir "por Horas" ("Precios Alquiler Barcos por Horas Costa Brava {AÑO}...").
- Espejar cada cambio en `STATIC_META` de `server/seoInjector.ts`.
- Precio floor: usar 75 €/h (flota viva actual); el runtime server-side reescribe baseline via fleetStatsCache — no hardcodear conteos nuevos.

### Task 1.2: verificar
- `npm run check` + `npm run i18n:validate`.
- Grep: ningún title/description nuevo contradice hechos canónicos (2 millas, gasolina solo sin-licencia, política cancelación).

### Task 1.3: commit
`fix(seo): descriptions con "por horas" + espejo SSR (CTR pos 1-2)`

## Fase 2 — Recuperar cluster "sin licencia" (código + contenido, autónomo)

### Task 2.1: reforzar `/es/barcos-sin-licencia`
**Files:** `client/src/pages/category-license-free.tsx`, `client/src/i18n/es.ts` (+ `npm run i18n:translate`; items de array a mano en los 7 locales), `server/seoInjector.ts`
- Añadir bloque FAQ (schema + visible) atacando las formulaciones exactas: "¿qué barco puedo llevar sin licencia?" (<5m y ≤15cv, RD 875/2014), "¿hasta dónde puedo navegar?" (2 millas náuticas, 3,7 km), "¿cuánto cuesta por horas?".
- Fuentes: `shared/boatData.ts`, `shared/nauticalLicenseRules.ts`. Nada inventado.

### Task 2.2: interlinking hacia la landing
**Files:** home (sección relevante), posts de blog en `server/seeds/blogSeed.ts` que tocan el tema
- Anchors exactos "alquiler barco sin licencia costa brava" / "barcos sin licencia en Blanes" desde ≥3 superficies.

### Task 2.3: publicar los 4 blog drafts pendientes
**Files:** `blog-drafts/2026-06-30-*.md`, `2026-07-07-*`, `2026-07-09-*`, `2026-07-14-*` → entradas en `server/seeds/blogSeed.ts` (los `_insert_*.mjs` ya existen para 3 de ellos)
- OJO: `metaDescription` ≤160 chars o el seed falla EN SILENCIO.
- El POST `/api/admin/seed-blog` va tras el deploy (Fase 5).

### Task 2.4: check:all + commit
`feat(seo): FAQ + interlinking cluster sin licencia + 4 posts blog`

## Fase 3 — GBP / map pack (preparo yo, publica Ivan)

El map pack sale por encima del #1 orgánico: es la vía real de "aparecer primero" en local. Publicar en GBP exige gesto humano (isTrusted) — bloqueo real conocido.

### Task 3.1 (yo): regenerar el post semanal GBP de la semana actual
El pendiente de la bandeja es de la semana 2026-07-13 (caducado). Redactar el de la semana 20-27 jul aprovechando Festa Major + Fuegos de Blanes, enlazando la landing `/es/fuegos-blanes`. Guardar en `gbp/` + encolar en la bandeja.

### Task 3.2 (yo): checklist única para Ivan (artifact)
1. Publicar respuestas a las reseñas 5★ (las 128 ya redactadas, artifact del 07-08 con botón copiar).
2. Publicar el post GBP semanal (texto + foto sugerida, copy-paste).
3. Conectar OAuth GBP en `/crm/autopilot#connect-gbp` (desbloquea métricas de llamadas/rutas).

## Fase 4 — Vaciar bandeja de distribución (triage yo, gestos Ivan)

### Task 4.1: triage de los 22 pendientes + 5 fallidos
- Descartar caducados (posts semanales viejos) via `autopilot_mark_distribution` → `discarded`.
- Lo vigente: agrupar por plataforma en la misma checklist de Task 3.2 (GBP/Facebook/LinkedIn = copy-paste de Ivan; Medium/Quora/Reddit = puedo intentar yo con browser si hay sesión).
- Marcar `published` con URL al confirmarse.

## Fase 5 — Ship + verificación + medición

### Task 5.1: `/ship`
Ojo: el working tree ya trae cambios de la sesión anterior (fuegos-blanes, translations). Commits separados si mezclan temas.

### Task 5.2 (Ivan): Republish en Replit
### Task 5.3 (yo, post-Publish): verificar prod
- `curl` a `/es/`, `/es/precios-alquiler-barcos`, `/es/barcos-sin-licencia`: meta nuevos en SSR, 200.
- `POST /api/admin/seed-blog` y confirmar created > 0.
- Reindex GSC de las 3+4 URLs tocadas (Claude-in-Chrome + javascript_tool, técnica memoria geo-audit).

### Task 5.4: medición a 14 días (2026-08-07)
- CTR "alquiler barco costa brava" (home) > 3% · cluster "sin licencia" de vuelta a top-3 · métricas GBP visibles (OAuth conectado).
