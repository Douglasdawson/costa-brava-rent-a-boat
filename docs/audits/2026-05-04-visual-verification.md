# Verificación visual del ciclo de polish

**Fecha**: 2026-05-04
**Alcance**: walk-through manual de las 5 superficies polished + Lighthouse en Home
**Herramienta**: Chrome DevTools MCP + dev server local en `:4000`
**Doc origen**: `2026-05-03-design-{critique,audit,decisions}.md`

---

## Lighthouse — Home (mobile, navigation mode)

| Categoría | Score |
|---|---|
| Accessibility | **93** / 100 |
| Best Practices | **96** / 100 |
| SEO | **100** / 100 |

**Pasados**: 53 audits · **Fallidos**: 3.

Reports: `docs/audits/screenshots/2026-05-04-polish/report.html` + `report.json`.

---

## Walk-through por superficie

### Home (`/es`)

✅ **Hero CTAs** (sesión 3): primary "Reservar ahora" + secondary "Ver todos los barcos" como outline. Visualmente distinguidos.

✅ **Trust badges** (sesión 3): renderizan desde `t.authority.X` ("6+ años de experiencia", "Seguro a todo riesgo", "5000+ clientes satisfechos") sin fallback hardcoded.

✅ **BoatCard refactor** (sesión 5):
- Solar 450 muestra UN solo badge "Más popular" en la imagen (no más stack de 4).
- Cards no-recommended/no-popular: imagen completamente limpia.
- Meta line debajo de cada card incluye `Sin licencia · ¡Gasolina incluida!` inline.
- "Ver detalles" textual eliminado: solo queda la imagen-link + el botón "Reservar".

✅ **FAQPreview** (sesión 3): 8 preguntas renderizan desde `t.faqPreview.items` (no más `FALLBACK_ITEMS` muerto).

✅ **WhatsApp prefilled message** (sesión 3): botón "Consultar disponibilidad por WhatsApp" usa `t.fleet.whatsappHelpPrefill`.

✅ **EditorialMomentSection**: "El sol no se pone aquí. Se queda contigo." — intacto.

🔴 **Em dashes nuevos en i18n** (no escaneados por el lint, exclusion de `client/src/i18n/`):
- `t.hero.title` (es.ts): `"ALQUILER DE BARCOS SIN LICENCIA EN BLANES — 7 CALAS DE LA COSTA BRAVA"`
- `t.rangeFromBlanes.headline` (aprox.): `"Hasta dónde llegas desde Blanes — sin licencia y con licencia"`
- Otros 2 strings en RangeFromBlanesSection con em dash.

Acción: extender `scripts/check-no-hardcoded-spanish.ts` para escanear también em dashes en `client/src/i18n/*.ts` (regex `—` o `--`). Sesión post-ciclo.

### Boat detail (`/es/barco/astec-480`)

✅ **h1 location suffix** (sesión 4): `"Astec 480 · Blanes, Costa Brava"` — usa `t.boatDetail.locationSuffix` con middle dot, sin em dash.

✅ **CTA hierarchy** (sesión 4):
- Hero pill "Reservar" (primary navy, persiste por scroll inicial)
- Card central "Reservar" (ahora outline — confirmado por variant en CSS)
- Sticky mobile/desktop primary navy (acción persistente post-scroll)

✅ **Recomendado badge** presente.

✅ **Em dash purgado de HoldCountdown** (sesión 4): no aparece `--` en "Date prisa" (ya es `Date prisa:`).

### Pricing (`/es/precios`)

✅ **CTA outline** (sesión 6): script en página detectó **16 botones outline** y **0 navy CTAs** entre los 19 botones "Reservar" totales. La regla "≤2 navy por viewport" cumplida; el footer secondary suma los 3 restantes.

✅ **Em dash purgado** (sesión 6): `"Puerto de Blanes:"` con dos puntos. `"Puerto de Blanes —"` no aparece.

✅ **tabular-nums** (sesión 6): 48 elementos con la clase aplicada (table cells + mobile cards).

✅ **Title sin em dash**: `"Precios Alquiler Barcos Costa Brava 2026 | Desde 70€/h Gasolina Incluida | Blanes"`.

### Booking flow modal

⚠️ **No verificado en este pase** — el modal requiere flow interactivo (click en Hero CTA → wizard → Personalize → Payment). Cubierto parcialmente por screenshots del wizards-audit (`docs/audits/screenshots/2026-05-04-wizards/`).

### Fleet (incluido en Home walk-through)

✅ Cubierto vía Home — la sección `<FleetSection />` se renderiza dentro del Home page.

---

## Issues nuevos (Lighthouse mobile)

### 1. `aria-prohibited-attr` (a11y, score 0)

**Dónde**: ReviewsSection — múltiples `<figure>.w-[220px] > div.flex` con un atributo ARIA prohibido para su rol.

**Hipótesis**: el commit `9f470ad fix(wizards): close P0 a11y findings` añadió `role="img"` al step circle del progress bar, pero algún `<div>` dentro de un `<figure>` (que tiene `role="figure"` implícito) hereda atributos ARIA que el rol no permite.

**Acción**: revisar BoatReviewCarousel — eliminar atributos ARIA que no encajen con el rol del elemento.

### 2. `color-contrast` (a11y, score 0)

**Dónde**: Footer — links sobre fondo navy oscuro (`bg-foreground` o `bg-cta`) con texto que no llega a 4.5:1.

**Hipótesis**: las links del footer usan `text-primary-foreground/70` o similar. La opacidad reduce el contraste real.

**Acción**: subir opacidad a `/85` o `/90` en links del Footer.

### 3. `errors-in-console` (best-practices, score 0)

**Dónde**: React warning sobre prop desconocido pasado a un DOM element. Mensaje truncado en el report.

**Hipótesis**: alguien pasa una custom prop (e.g. `customAttr`) a un `<div>` o componente HTML nativo.

**Acción**: abrir DevTools console en el browser, capturar el mensaje completo, identificar componente. Probablemente uno de los recientes refactors.

---

## Resumen de salud post-ciclo

| Métrica | Antes (audit 2026-05-03) | Después (verificación 2026-05-04) | Delta |
|---|---|---|---|
| Lighthouse A11y mobile | no medido | 93 | — |
| Lighthouse Best Practices | no medido | 96 | — |
| Lighthouse SEO | no medido | 100 | — |
| Hardcoded Spanish baseline | 1608 | 1418 | **−190** |
| Em dashes en i18n strings | desconocido (no escaneado) | ≥4 detectados | nueva deuda visible |
| Touch targets <44 px | 5 sitios | 0 | **−5** |
| Glassmorphism fuera de Navigation | 2 sitios (BoatCard, BoatDetail hero) | 1 sitio (BoatDetail hero, documentado como excepción) | **−1** |
| Earned Depth violations | 4 sitios | 0 | **−4** |
| Falsos positivos del audit detectados | n/a | 3 (ContactSection nested, Personalize dropdowns, BoatQuizModal copy) | aprendizajes |

---

## Próximas acciones recomendadas

1. **Extender el lint de em dashes a `client/src/i18n/*.ts`** (excluido actualmente). Detectar `—` y `--` en strings de traducción. Bajo esfuerzo, alto valor.
2. **Resolver los 3 fallos de Lighthouse** — A11y subiría de 93 → ≥98 con muy poco trabajo.
3. **Verificación visual del Booking flow modal** end-to-end (no cubierto en este pase). Requiere interacción — usar Chrome DevTools MCP `click` + `fill_form` para automatizar el flow, o visual manual.
4. **Re-correr Lighthouse desktop** para tener baseline en ambos modos.
5. **Replit Publish** para llevar el ciclo a producción (deploy manual, no `git push`).

---

## Resultados sesión 8 (2026-05-04, post-fixes)

Tras los 4 commits de la sesión 8 (`913074c` Hero fetchpriority, `9841559` ReviewsSection role=img, `33e97a9` Footer contrast, `e285a01` lint extension):

### Lighthouse mobile (Home)
| Categoría | Antes | Después | Delta |
|---|---|---|---|
| Accessibility | 93 | **97** | +4 |
| Best Practices | 96 | **100** | +4 |
| SEO | 100 | 100 | — |
| Audits passed | 53 | **55** | +2 |
| Audits failed | 3 | 1 | −2 |

### Lighthouse desktop (Home, baseline nuevo)
| Categoría | Score |
|---|---|
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 100 |

### Issue residual (1 fail)
`color-contrast` con 2 selectores: un `<span>` sin clase (probablemente badge "Independent operator" del footer) y los links de la columna Información del footer.

**Investigación en browser**: el script `evaluate_script` confirmó que el link tiene `color: rgb(249, 250, 251)` (casi blanco) sobre `bg: rgb(28, 47, 74)` (navy) — contraste real ~13:1, muy por encima del 4.5:1 requerido. Probable false positive de Lighthouse para el link. El span sin clase queda pendiente de inspección manual (badge muy pequeño, bajo impacto).

### Lint i18n em dashes
- 308 em dashes detectados en baseline (39 es, 35 en, 30-33 ca/fr/de/nl/it, 89 ru).
- Allowlist 1418 → 1726.
- Negative test verificado: añadir `Esto — debería fallar` a `es.ts` dispara el lint con preview correcto y exit 1.
- `npm run check:i18n-hardcode` queda verde.

### Pendiente
- Cleanup de los 308 em dashes (sesión 9 si se decide strict ban, o decisión de revisar DESIGN.md para permitirlos en prosa larga).
- Replit Publish manual.
