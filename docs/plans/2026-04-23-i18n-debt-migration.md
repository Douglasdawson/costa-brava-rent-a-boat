# I18n Debt Migration — Maratón Abril 2026

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrar al sistema i18n (`client/src/i18n/es.ts` + `npm run i18n:translate`) todo el texto en castellano hardcoded que sigue viviendo en JSX, schemas SEO y páginas legales.

**Architecture:** Fuente de verdad `es.ts`; los 7 idiomas restantes (en, ca, fr, de, nl, it, ru) se generan vía `npm run i18n:translate` (usa `ANTHROPIC_API_KEY`). Validación `npm run i18n:validate` confirma 0 diffs entre idiomas. Se trabaja por olas (agrupaciones lógicas) para amortizar el coste de traducción (cada `translate` llama al API) y facilitar rollback si algún bloque sale mal.

**Tech Stack:** React 18 + TypeScript + Vite, `useLanguage` hook, `scripts/i18n-translate.ts`, `scripts/validate-translations.ts`.

---

## Sequencing y ROI

Orden optimizado por **(a) superficie SEO visible** × **(b) riesgo de regresión** × **(c) coste cognitivo mientras estoy fresco**. Bloques pequeños al principio para validar pipeline; los grandes al medio mientras aún estoy cargado de contexto; cleanup al final.

| Ola | Bloque | Archivos | Estimado | Razón orden |
|-----|--------|----------|----------|-------------|
| 1 | `location-blanes` cross-links + nearby-towns | 1 | 30 min | Calentamiento, valida pipeline, hub page |
| 2 | `seo-schemas.ts` calas TouristAttraction | 1 | 1h | SEO directo (JSON-LD), scope acotado |
| 3 | Activity pages body arrays (4 páginas) | 4 | 2.5h | Mayor superficie visible, mientras fresco |
| 4 | Narrativos tordera/palafolls/pineda | 3 | 2.25h | Plantilla repetida, inercia post-activity |
| 5 | Glosario (67 términos + UI) | 1 | 2h | Keyword density, mecánico |
| 6 | `faq.tsx` Accordion rich body | 1 | 3h | El más grande; lo dejo cuando tengo pipeline afinado |
| 7 | Blog + onboarding + gift-cards menores | 4 | 1.5h | Cleanup de cola |
| 8 | Legales (privacy/terms/cookies/accessibility) | 4 | 3h | **DECISIÓN DE NEGOCIO — preguntar antes** |

**Total estimado:** ~15.75h (olas 1-7) + 3h opcional (ola 8).

---

## Protocolo por ola (rigid)

Cada ola sigue este loop sin excepciones:

1. **Leer archivo(s) de la ola completos** (`Read`).
2. **Identificar cadenas en castellano hardcoded** visibles al usuario final (JSX content, arrays que se renderizan, schema descriptions). Ignorar `console.log`, comentarios técnicos, keys de objeto.
3. **Añadir claves a `client/src/i18n/es.ts`** bajo una ruta semántica (ej: `t.glossaryPage.terms.varadero.definition`).
4. **Reemplazar literales en el archivo fuente** por `t.ruta.clave` (via `useLanguage`).
5. **Verificar tipado**: `npm run check` (2+ min, correrlo en background).
6. **Traducir**: `npm run i18n:translate`.
7. **Validar**: `npm run i18n:validate` — debe salir 0 diffs.
8. **Revisar diffs de los 7 idiomas** rápido (sanity check de traducciones raras).
9. **Commit atómico por ola** con mensaje `feat(i18n): migrate <bloque> to live translations (<N> × 8 locales)`.

**Reglas duras:**
- NO commitear si `i18n:validate` falla.
- NO tocar `en.ts`, `ca.ts`, `fr.ts`, `de.ts`, `nl.ts`, `it.ts`, `ru.ts` a mano — los genera el script.
- NO meter emojis.
- NO cambiar estructura de `es.ts` (top-level keys) sin motivo de ola; solo añadir sub-claves.
- SI un literal es nombre propio (topónimo, marca), dejarlo literal pero envuelto en la clave (así no se traduce pero sigue en el pipeline).

---

## Ola 1 — `location-blanes.tsx` cross-links + nearby-towns

**Files:**
- Modify: `client/src/pages/location-blanes.tsx` (563 líneas)
- Modify: `client/src/i18n/es.ts`

**Scope:** Cross-links sections y bloque "nearby towns" narrativo. Hero y FAQ ya están migrados.

**Pasos:**
1. Leer `location-blanes.tsx` completo.
2. Localizar secciones hardcoded (cross-links, nearby-towns, cualquier narrativo suelto).
3. Mapear a `t.locationPages.blanes.sections.*` (seguir convención de tossa/lloret).
4. `npm run check` → `npm run i18n:translate` → `npm run i18n:validate`.
5. Commit: `feat(i18n): migrate location-blanes cross-links & nearby-towns (N × 8 locales)`.

---

## Ola 2 — `seo-schemas.ts` calas TouristAttraction

**Files:**
- Modify: `client/src/utils/seo-schemas.ts` (347 líneas)
- Modify: `client/src/i18n/es.ts`

**Scope:** Descripciones de calas/playas que terminan en JSON-LD `TouristAttraction`. Google las lee literal, así que cada idioma debe tener su versión.

**Reto:** `seo-schemas.ts` es estático y no tiene acceso directo a `useLanguage`. Patrón esperado: exportar factories que reciben `language` y devuelven el schema con el texto traducido. Verificar patrón existente leyendo cómo se hace hoy en `seo-schemas.ts`.

**Pasos:**
1. Leer `seo-schemas.ts` para entender estructura actual.
2. Decidir si convertir a función `(lang) => schema` o si ya lo es.
3. Extraer descripciones a `t.seoSchemas.coves.*`.
4. `check` → `translate` → `validate`.
5. Commit: `feat(i18n): localize coves TouristAttraction descriptions in JSON-LD (N × 8 locales)`.

---

## Ola 3 — Activity pages body arrays

**Files:**
- Modify: `client/src/pages/activity-families.tsx` (452 líneas)
- Modify: `client/src/pages/activity-fishing.tsx` (579 líneas)
- Modify: `client/src/pages/activity-snorkel.tsx` (476 líneas)
- Modify: `client/src/pages/activity-sunset.tsx` (467 líneas)
- Modify: `client/src/i18n/es.ts`

**Scope:** Arrays como `safetyFeatures`, `familyRoutes`, `fishSpecies`, `sunsetTimes`, `recommendedBoats` y demás bloques narrativos. Los FAQ items YA están migrados (commit ff3c203).

**Estrategia:** Una clave por array bajo `t.activityPages.<activity>.<bloque>`. Array of strings → array of objects con claves numéricas si necesario, siguiendo convención de FAQ items.

**Pasos:**
1. Leer las 4 activity pages en paralelo.
2. Auditar cada una: identificar arrays hardcoded y bloques narrativos.
3. Extraer en el mismo PR (se comparten patrones).
4. `check` → `translate` → `validate`.
5. Commit: `feat(i18n): migrate activity-pages body arrays & narratives (N × 8 locales × 4 pages)`.

---

## Ola 4 — Narrativos tordera/palafolls/pineda

**Files:**
- Modify: `client/src/pages/location-tordera.tsx` (389 líneas)
- Modify: `client/src/pages/location-palafolls.tsx` (388 líneas)
- Modify: `client/src/pages/location-pineda-de-mar.tsx` (388 líneas)
- Modify: `client/src/i18n/es.ts`

**Scope:** Hero, "Por qué Blanes desde X", attractions, "Cómo llegar", precios block, rich body. Los 3 archivos comparten plantilla casi idéntica — migración mecánica una vez establecido el primero.

**Estrategia:** Una sola ronda de `translate` para las 3. Convención: `t.locationPages.<town>.sections.*`.

**Pasos:**
1. Empezar por tordera como plantilla.
2. Replicar patrón en palafolls y pineda (solo cambia el contenido literal).
3. `check` → `translate` → `validate`.
4. Commit: `feat(i18n): migrate tordera/palafolls/pineda narratives (N × 8 locales × 3 pages)`.

---

## Ola 5 — Glosario

**Files:**
- Modify: `client/src/pages/glosario.tsx` (220 líneas)
- Modify: `client/src/i18n/es.ts`

**Scope:** 67 términos náuticos + UI del glosario (headings, categorías, CTAs).

**Estrategia:** `t.glossaryPage.terms` como objeto `{ termId: { name, definition, category? } }`. UI en `t.glossaryPage.ui.*`.

**Cuidado:** los términos son náuticos — algunos son topónimos o nombres propios que NO hay que traducir (ej: "proa" → "bow" en EN sí, pero "Costa Brava" queda igual). Revisar diffs cuidadosamente.

---

## Ola 6 — `faq.tsx` Accordion rich body

**Files:**
- Modify: `client/src/pages/faq.tsx` (1383 líneas)
- Modify: `client/src/i18n/es.ts`

**Scope:** El contenido narrativo rico de los `AccordionItem` (con listas, CTAs, botones, links internos). El JSON-LD schema y categorías ya están en `t.faqPage` (92 claves).

**Reto:** los bodies contienen JSX anidado (listas, links, `<button>`). Opciones:
- (A) Extraer solo texto plano a i18n y dejar estructura JSX en componente.
- (B) Extraer markdown/HTML y renderizar con `dangerouslySetInnerHTML` (rechazado — XSS).
- (C) Usar un componente `<Trans>` con slots para las partes interactivas.

**Decisión provisional:** (A) — máxima seguridad y previsibilidad. Cada item del Accordion tendrá claves granulares (`title`, `intro`, `points[]`, `cta`, `note`).

---

## Ola 7 — Blog + onboarding + gift-cards menores

**Files:**
- Modify: `client/src/pages/blog.tsx` (637 líneas) — UI menor, cards, filtros
- Modify: `client/src/pages/blog-detail.tsx` (984 líneas) — UI menor, CTAs, no-content strings
- Modify: `client/src/pages/OnboardingPage.tsx` (377 líneas) — wizard labels
- Modify: `client/src/pages/gift-cards.tsx` (387 líneas) — descripciones residuales
- Modify: `client/src/i18n/es.ts`

**Scope:** Solo strings hardcoded residuales. Blog posts (contenido) NO — ese contenido viene de DB/markdown con su propio sistema.

---

## Ola 8 — Legales (CONDICIONAL)

**Files:**
- Modify: `client/src/pages/privacy-policy.tsx` (270 líneas)
- Modify: `client/src/pages/terms-conditions.tsx` (345 líneas)
- Modify: `client/src/pages/cookies-policy.tsx` (235 líneas)
- Modify: `client/src/pages/accessibility-declaration.tsx` (176 líneas)

**STOP — decisión de negocio antes de empezar:**
- ¿Se traducen o se mantienen en castellano (por seguridad jurídica / AEPD / LOPD)?
- Algunas empresas mantienen legales solo ES porque:
  - El fuero es España.
  - Cualquier ambigüedad en la traducción puede ser una vulnerabilidad legal.
  - Los términos técnicos jurídicos (AEPD, LOPD-GDD, RGPD) no siempre tienen equivalente limpio en otros idiomas.
- Otras empresas traducen para UX/claridad y añaden un disclaimer "versión en castellano prevalece".

**Preguntar al usuario antes de empezar esta ola.**

---

## Rollback / safety

- Commits atómicos por ola → `git revert <hash>` rollback quirúrgico.
- Si `i18n:validate` falla post-`translate`, NO committear. Revisar el archivo del idioma que falló (típicamente json malformado) y regenerar.
- Si tsc falla, probablemente metí una key en `es.ts` que no se referencia con tipos correctos en `useLanguage`. Arreglar antes de translate.

---

## Execution model

Dado el volumen (15+ horas) y que cada ola es atómica y secuencial, ejecuto inline en esta sesión, ola por ola, commiteando entre cada una. No vale la pena spawn de subagents — el trabajo es lineal y necesita contexto acumulado del usuario.
