---
target: páginas GEO (localidades + blog Maresme)
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-07-02T13-49-51Z
slug: client-src-pages-locationtemplate-tsx
---
# Critique: páginas GEO (localidades Maresme/Blanes/Lloret + posts blog)

## Design Health Score (Nielsen) — 29/40 (Good)

| # | Heurística | Punt. | Hallazgo clave |
|---|-----------|:---:|----------------|
| 1 | Visibilidad de estado | 3 | Progress bar + reveals OK; CTA de reserva sin estado loading |
| 2 | Sistema/mundo real | 4 | "Puerto Blanes a 10 min", minutos y trenes concretos |
| 3 | Control y libertad | 3 | TOC + prev/next; modal de reserva sin escape obvio |
| 4 | Consistencia | 3 | Pineda/Blanes con hero de gradiente vs Malgrat con foto |
| 5 | Prevención de errores | 3 | Newsletter con honeypot; superficie de bajo riesgo |
| 6 | Reconocer > recordar | 3 | TOC sticky en desktop; en móvil se pierde tras colapsar |
| 7 | Flexibilidad | 3 | 3 rutas a conversión (hero, sticky, banner) |
| 8 | Estética/minimalista | 2 | 11-14 H2 por localidad; 3 feature-grids idénticos |
| 9 | Recuperación de errores | 2 | 404 blog decente; fallo de red del modal sin verificar |
| 10 | Ayuda | 3 | FAQ rica y contextual por localidad |

## Veredicto anti-patrones
- LLM: slop moderado y salvable. Tells: grid de iconos-en-círculo repetido 3 veces por página (26 círculos en Pineda), badges hero-metric bajo cada H1, y (lo peor para esta marca) Pineda y Blanes sin fotografía en el hero.
- Detector determinista: LIMPIO (0 hallazgos en 10 archivos). Falsos positivos descartados: border-l-2 del TOC, animate-pulse del skeleton, backdrop-blur de badges sobre foto.
- Overlay de navegador: no aplicable (target de producción; sin live-server local). Señal de fallback: greps + inspección DOM en prod.

## Issues prioritarios
- [P1] Touch targets de badges de destino a 34px en móvil (LocationTemplate.tsx:595-628). Usuario con el pulgar al sol; chips adyacentes = toques errados. Fix: min-h-11 + py-2.5 o lista táctil.
- [P1] PopularBoatsSection recomienda el Astec 400 (barco DESACTIVADO por el owner) en Malgrat/Santa Susanna/Calella; cards salen del catálogo estático, no de la flota viva. Además cards de barco SIN foto de barco (marca: "el mar se vende solo") y badge sin-licencia derivado de regex sobre features (contra canon boatData).
- [P2] Hero de gradiente sin foto en Pineda y Blanes (la página insignia). Contradice el principio nº1 de marca. Fix: heroImage.basePath con activos existentes.
- [P2] Tres feature-grids de iconos consecutivos aplanan el tramo medio (valle emocional). Fix: diferenciar tratamiento del bloque "Cómo llegar" (lista/timeline) y podar H2.
- [P2] Rating 4,8 (única prueba social válida) no visible en el cuerpo; vive solo en el title. Fix: rating + enlace GBP junto al CTA del hero.
- [P3] Alt de imágenes en inglés en páginas ES (defaults de LocationTemplate) y alt del featured image del blog = título duplicado. Fix: localizar alts vía i18n y poblar featuredImageAltByLang en los 4 posts.
- [P3] Cuerpo del blog CSR-only (SSR sirve fallback de 1,8KB sin tablas); crawlers sin JS no ven las tablas comparativas. Mitigado por el fallback y el JSON-LD; mejora futura: render markdown server-side.

## Red flags por persona
- Jordan (primeriza): en Pineda ve gradiente + 11 secciones sin foto ni rating; duda de si la empresa es real.
- Casey (móvil): falla el toque en "Lloret de Mar - 25 min" (34px entre chips pegados).
- Riley (stress): TOC móvil colapsado sin re-anclaje; 3 grids clónicos; sticky CTA tapa el pie del artículo.

## Fortalezas
- Contraste real para sol: 6,72:1 y 13,51:1 — AA holgado (principio "móvil bajo el sol" cumplido).
- Cero overflow horizontal a 390px; las tablas markdown comprimen dentro de su wrapper.
- RelatedLocationsSection ya poda el slop (lista compacta en vez de tercer grid de cards).

## Observaciones menores
- Fallback muerto "desde 70€/hora" en BlogConversionBanner (i18n ya dice 75; higiene).
- H1 "cerca de Malgrat" honesto pero sin gancho; precio 75€/h no visible antes del primer CTA en las páginas de gradiente.
- Verificar altura del sticky CTA móvil del blog (medición anómala 215px).

## Preguntas
1. Si el principio nº1 es "el mar se vende solo", ¿por qué las dos páginas de mayor intención (Blanes, Pineda) son las únicas sin foto?
2. ¿Qué manda cuando la densidad óptima para un LLM (14 H2) es la que aplana la experiencia humana?
3. El 4,8 es la única prueba social real; ¿qué frena ponerlo junto al CTA?
