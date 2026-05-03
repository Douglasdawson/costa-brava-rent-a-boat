# Auditoría técnica de diseño — a11y, performance, responsive, i18n

**Fecha**: 2026-05-03
**Alcance**: 5 superficies públicas (Home, Booking flow, Fleet, Pricing, Boat detail)
**Metodología**: pase `$impeccable audit` — chequeos contra WCAG 2.1 AA, performance reglas (GPU-only motion), responsive 360/768/1280, i18n debt
**Doc complementario**: `2026-05-03-design-critique.md` (críticas heurísticas/UX)

---

## Resumen ejecutivo

| Superficie | Alta | Media | Baja | Total |
|---|---|---|---|---|
| Home | 4 | 4 | 3 | 11 |
| Booking flow | 2 | 3 | 4 | 9 |
| Fleet | 1 | 2 | 1 | 4 |
| Pricing | 2 | 1 | 1 | 4 |
| Boat detail | 4 | 2 | 1 | 7 |
| **Total** | **13** | **12** | **10** | **35** |

**Severidad alta** = WCAG AA roto, hardcoded copy que no se traduce a 7 idiomas, iOS auto-zoom, animación de propiedad de layout (recipe para jank en mobile), o touch-target imposible bajo el dedo.

**Top 3 prioridades transversales** (ver fin):
1. Inputs `text-sm` (14 px) en BookingFormDesktop → iOS auto-zoom on focus
2. Hardcoded Spanish strings en JSX (5/5 superficies tienen al menos un caso)
3. `grid-template-rows` animado en FleetSection (jank en move-down móviles)

---

## Verificación de tokens (drift CSS vs DESIGN.md)

Tres derivas detectadas en `client/src/index.css`. Las tres no son bugs de runtime, pero conviene reconciliar antes de auditar superficies para no doble-contar:

1. **Focus outline = navy CTA, no teal** — `index.css:175-179` aplica `outline: 2px solid hsl(var(--cta))`. DESIGN.md §5 Buttons dice "Focus: 2px solid teal ring". El sistema real es navy y funciona; actualizar DESIGN.md o cambiar CSS a `hsl(var(--ring))` (el `--ring` ya es teal).
2. **`tracking-normal: 0em` global** — `index.css:99`. Display headings que pidan `letter-spacing: -0.01em` deben aplicar `tracking-tight` explícitamente. Verificar Hero.
3. **Inputs `rounded-lg` en formularios desktop, `rounded-md` en spec** — drift de tokens. Decisión: mantener `rounded-lg` y actualizar spec, o forzar `rounded-md` en `BookingFormDesktop.tsx:125`.

---

## Home

Entrada: `client/src/App.tsx:144`. Componentes: Hero, FleetSection, EditorialMomentSection, ReviewsSection, RangeFromBlanesSection, LicenseComparisonSection, FeaturesSection, FAQPreview, ContactSection, Navigation, Footer.

### Alta

- **i18n: WhatsApp prefilled message hardcoded en español** — `client/src/components/FleetSection.tsx:740`. La cadena `"Hola! Necesito ayuda para elegir el mejor barco..."` está inline. Mover a `t.cta.whatsappPrefill` y generar las 7 traducciones con `npm run i18n:translate`.
- **i18n: FAQ fallback en español puro** — `client/src/components/FAQPreview.tsx:13-89`. `FALLBACK_ITEMS` de 8 Q&A inline en español. Mover a `t.faqPreview.items` (ya existe el override) y eliminar el fallback inline o reemplazarlo por una clave de error.
- **A11y: nested cards en ContactSection** — `client/src/components/ContactSection.tsx:30-111`. Card que contiene CardContent que contiene una segunda Card en `:116`. Refactor a Section/Div para la segunda capa (DESIGN.md ban: "Nested cards are always wrong").
- **A11y: input newsletter del footer <44px** — `client/src/components/Footer.tsx:144`. `px-4 py-3` da ~36 px de altura. Subir a `min-h-11` o `py-3 sm:py-3.5`.

### Media

- **Quiet Surface drift: cards = bg de la página** — `client/src/components/LicenseComparisonSection.tsx:74, 112`. Comparison cards usan `bg-background`, indistinguibles del page bg. Aplicar `bg-card` (que es `--card: 210 20% 97%` en CSS — el "Warm Card" de DESIGN.md).
- **Performance: animación de grid-rows en checklist** — `FleetSection.tsx:769`. Transición `grid transition-[grid-template-rows]` sobre `grid-rows-[0fr]` ↔ `grid-rows-[1fr]`. Aunque visualmente correcto, el motor renderiza re-layout completo. Sustituir por `max-height` + `overflow: hidden` con transición + suficiente max-height de seguridad, o por `transform: scaleY` con `transform-origin: top`.
- **A11y: aria-live faltante en filtros** — `FleetSection.tsx:534-548`. El mensaje "No boats available" tras filtrar no se anuncia. Wrappear en `<div role="status" aria-live="polite">`.
- **Touch target: filter view-toggle** — `FleetSection.tsx:471-475, 481-485`. Botones grid/list view con `p-2.5`. Subir a `p-3` con `h-11 w-11`.

### Baja

- **A11y: ReviewsSection arrows con label genérico** — `client/src/components/ReviewsSection.tsx:282, 296`. `aria-label="Scroll left/right"` falta contexto. Sugerir: `aria-label="Reseña anterior"` / `aria-label="Reseña siguiente"`.
- **A11y: Navigation desktop usa `<div>` y mobile usa `<nav>`** — `client/src/components/Navigation.tsx:209 vs :295`. Inconsistencia semántica. Unificar a `<nav>` con `role="navigation"` y `aria-label`.
- **i18n: Hero trust badges con literales** — `client/src/components/Hero.tsx:127, 131, 135`. (Mismo punto que en critique; aquí solo se referencia como i18n debt.)

---

## Booking flow

### Alta

- **iOS auto-zoom: inputs `text-sm` en formulario de personalize** — `client/src/components/booking-flow/BookingStepPersonalize.tsx:265` (y otros). `text-sm` = 14 px; iOS dispara auto-zoom en cualquier input <16 px. El `index.css:376-378` tiene un override `@supports (-webkit-touch-callout: none) { input { font-size: 16px !important; } }` que **debería** salvar este caso. Verificar en DevTools iOS simulado: si el `!important` gana, está OK; si Tailwind sobrescribe, hay que cambiar a `text-base`.
- **i18n: copy en español hardcoded en step "Time"** — `client/src/components/booking-flow/BookingStepTime.tsx:47, 61`. `"Recargo fin de semana"` y `"Tarifa especial"` como literales. Mover a `t.bookingTime.weekendSurcharge` y `t.bookingTime.specialRate`.

### Media

- **A11y: BookingStepExtras sin validación visible** — `client/src/components/booking-flow/BookingStepExtras.tsx`. Inconsistente con otros steps que sí muestran errores con `aria-describedby`. Aunque "extras" sea opcional, debe haber feedback de selección/deselección audible.
- **Performance: shadow-lg al reposo en dropdowns** — `BookingStepPersonalize.tsx:350, 443`. (También listado en critique.) Performance cost mínimo, pero box-shadow no es GPU-composited en algunos navegadores; confirmar con DevTools Layers.
- **A11y: contraste insuficiente en checkbox** — `BookingStepPayment.tsx:236`. `accent-foreground` puede no cumplir 3:1 con el fondo según el tema. Verificar con axe.

### Baja

- **Touch target: counter ±/– a 36 px** — `BookingStepPersonalize.tsx:220, 233`. `h-9` = 36 px. Subir a `h-11`.
- **A11y: spinner faltante mientras se crea quote** — `BookingStepPayment.tsx:198-208`. Mensaje "Creando cotización" presente pero el botón no se deshabilita visualmente. Añadir `disabled` + `aria-busy="true"`.
- **Code smell: archivos legacy no renderizados** — `BookingStepBoat.tsx`, `BookingStepDate.tsx`, `BookingStepTime.tsx`, `BookingStepCustomer.tsx`, `BookingStepExtras.tsx`. Existen pero no se renderizan (BookingFlow solo importa Experience, Personalize, Payment). Borrar o documentar como "deprecated, kept for reference".
- **A11y: "pb-safe" no es Tailwind nativo** — `BookingStepExperience.tsx:368` lo usa. Verificar que está definido en `index.css:291` como utility (sí lo está). OK funcionalmente; documentar.

---

## Fleet

### Alta

- **A11y: touch target del botón Book** — `client/src/components/BoatCard.tsx:242-248`. `px-6 py-2.5` ≈ 30-34 px. Cambiar a `h-11`. (También listado en critique medium; aquí va como audit alta porque WCAG AA.)

### Media

- **Performance: animación de `grid-template-rows`** — duplicado del Home (mismo `FleetSection.tsx:769`); ya contado en Home audit.
- **Responsive: comparison table image fija** — `FleetSection.tsx:606`. `w-32 h-20` (128×80 px) en una tabla que en móvil usa otro layout. Verificar que en `<lg` la tabla no aparece (ya hidden con `hidden lg:block`); si es así, no hay bug responsive, solo poco optimizada.

### Baja

- **A11y: BoatCard book button sin aria-label** — `BoatCard.tsx:241`. Tiene texto "Book" que es suficiente. OK; mencionado para completitud.

---

## Pricing

### Alta

- **i18n: em dash en `portAccessible`** — `client/src/i18n/es.ts:2869`. `'Puerto de Blanes — accesible desde'`. Sustituir por `:` o `,`. Las 7 traducciones probablemente heredan el em dash de la traducción automática; correr `npm run i18n:translate` tras corregir el español.
- **A11y: touch target de tabla desktop** — `pages/pricing.tsx:409-417`. Botones reserve con `size="sm"` → `min-h-9` = 36 px. WCAG AA Mobile recomienda 44 px incluso en desktop si el dispositivo soporta touch (laptops touch). Subir a `size="default"`.

### Media

- **Performance/i18n: currency formatting concatenado** — `pages/pricing.tsx:68-71`. `formatPrice` hardcodea `${price}€`. Dependiendo del idioma, el símbolo va antes (`€10`). Cambiar a `Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' })`. (También en critique como medium.)

### Baja

- **A11y: `tabular-nums` faltante en columnas de precios** — `pages/pricing.tsx:397-407, 482-512`. Sin `font-variant-numeric: tabular-nums`, las cifras saltan ópticamente entre filas. Añadir clase `tabular-nums`.

---

## Boat detail

### Alta

- **iOS auto-zoom: inputs `text-sm` en BookingFormDesktop** — `client/src/components/BookingFormDesktop.tsx:125`. `text-sm` (14 px) en `inputBase`. Aunque `index.css:376-378` lo intenta corregir con `!important`, este input al estar dentro del componente desktop puede que se sirva también en breakpoints móviles si el viewport pasa por el responsive limit. Verificar y fijar `text-base` como mínimo para inputs del formulario.
- **i18n: WhatsApp message hardcoded** — `BoatDetailPage.tsx:520`. `"Hola, me interesa el ${boat.name}..."`. Mover a `t.boatDetail.whatsappPrefill` con interpolación.
- **i18n: location en h1 hardcoded** — `BoatDetailPage.tsx:772`. `"— Blanes, Costa Brava"`. (Doble bug: hardcoded **y** em dash.) Mover a `t.boatDetail.locationSuffix`.
- **A11y: `--` en HoldCountdown** — `client/src/components/HoldCountdown.tsx:118`. `"Date prisa --"`. Eliminar o cambiar por punto/coma.

### Media

- **Earned Depth: gallery card y stickies con shadow al reposo** — `BoatDetailPage.tsx:816, 1366, 1394`. (Solapado con critique.) Para los stickies, decidir si se documentan como excepción estructural en DESIGN.md.
- **A11y/Token drift: inputs `rounded-lg` no `rounded-md`** — `BookingFormDesktop.tsx:125`. Drift; resolver vía decisión sobre tokens.

### Baja

- **A11y: glassmorphism backdrop-blur en hero pill** — `BoatDetailPage.tsx:777`. `bg-white/15 backdrop-blur-sm`. (Solapado con critique.) Ban absoluto, pero uso estructural. Decidir y documentar.

---

## Patrones cruzados (audit)

### 1. Hardcoded Spanish en JSX (5/5 superficies)

Inventario completo:

| Archivo | Línea | Cadena |
|---|---|---|
| `Hero.tsx` | 127, 131, 135 | Trust badges (`'6+ años...'`) |
| `FleetSection.tsx` | 740 | WhatsApp prefilled message |
| `FAQPreview.tsx` | 16-88 | 8 Q&A FALLBACK_ITEMS |
| `BookingStepTime.tsx` | 47, 61 | `"Recargo fin de semana"`, `"Tarifa especial"` |
| `BookingStepPersonalize.tsx` | 180 | `"Tarifa especial"` |
| `BoatDetailPage.tsx` | 520, 772 | WhatsApp + h1 location |

**Fix transversal**: añadir un script `scripts/check-no-hardcoded-spanish.ts` que escanea componentes JSX por strings ASCII largas (>15 chars con palabras españolas comunes) fuera de `t.X` y casos permitidos (URLs, IDs). Integrar en `npm run check:all`. La deuda i18n existente ya está documentada en CLAUDE.md, pero el goteo continúa porque no hay enforcement automatizado.

### 2. Touch targets <44 px sistemáticos

| Archivo | Elemento | Tamaño actual |
|---|---|---|
| `Footer.tsx:144` | Newsletter input | ~36 px |
| `FleetSection.tsx:471-485` | View toggle buttons | ~36 px |
| `BoatCard.tsx:242-248` | Book button | ~30-34 px |
| `BookingStepPersonalize.tsx:220, 233` | Counter ± buttons | 36 px (`h-9`) |
| `pages/pricing.tsx:409-417` | Desktop table reserve | 36 px (`size="sm"`) |

**Causa raíz probable**: el componente shadcn `Button` `size="sm"` produce 36 px y se usa por reflejo. Solución: prohibir `size="sm"` en superficies primarias o redefinir su altura mínima a 44 px con padding interno menor.

### 3. Animación de propiedad de layout (`grid-template-rows`)

Una sola instancia, pero potencialmente jank visible en móviles bajos:
- `FleetSection.tsx:761-787` — checklist collapse.

Sustituir por `transform: scaleY` + `transform-origin: top` (mejor) o por `max-height` con `overflow: hidden` y un valor seguro.

### 4. iOS input auto-zoom

El CSS tiene un guard global `@supports (-webkit-touch-callout: none) { input { font-size: 16px !important; } }` (`index.css:376-378`). Cualquier input con `text-sm` debería ser salvado por `!important`. Pero conviene **no depender** del guard: cambiar `text-sm` por `text-base` en todos los inputs de formularios (BookingFormDesktop, BookingStepPersonalize) elimina el riesgo de regresión si se quita el guard global.

### 5. Em dashes / `--` en copy

| Archivo | Línea | Forma |
|---|---|---|
| `client/src/i18n/es.ts:2869` | `portAccessible` | `—` Unicode |
| `client/src/components/HoldCountdown.tsx:118` | `"Date prisa --"` | `--` ASCII |
| `client/src/components/BoatDetailPage.tsx:772` | `— Blanes, Costa Brava` | `—` Unicode (en JSX, también hardcoded) |

**Fix transversal**: añadir regla ESLint custom o un check en `i18n:validate` que falle si encuentra `—` o `--` en strings i18n o JSX.

### 6. Focus outline color drift

CSS aplica navy (`var(--cta)`) en `index.css:175-179`; DESIGN.md dice teal (`var(--ring)`). Decisión: actualizar DESIGN.md o el CSS. Recomendación: **navy** real es coherente con la paleta restringida y funciona bien sobre fondos blancos; actualizar DESIGN.md. Si se prefiere teal: cambiar `var(--cta)` → `var(--ring)` en el CSS y verificar que el contraste con todos los fondos (incluyendo cards y dark mode) se mantiene.

---

## Verificación end-to-end (cuando se aplique el polish)

Estas comprobaciones forman parte del plan en `/Users/macbookpro/.claude/plans/podr-amos-realizar-una-auditoria-keen-lamport.md` y se hacen tras cada sesión de polish:

1. **Lighthouse** (a11y, perf, best practices) en cada superficie polished, registrar deltas.
2. **Chrome DevTools MCP** a 360 / 768 / 1280 px — screenshot before/after.
3. **Tabulación de teclado** desde el primer enfocable hasta el último; todos los focus rings visibles.
4. **iOS Safari simulado** — verificar que no hay auto-zoom en focus de inputs.
5. **`npm run i18n:validate`** — 0 diferencias entre los 8 idiomas tras cualquier copy nuevo en `es.ts`.
6. **`npm run check:all`** — lint, typecheck, tests, i18n.

---

## Qué NO está en este informe

- **Bundle size analysis** — no se midió tamaño JS por superficie. Si interesa, sesión separada con `vite-bundle-visualizer`.
- **Real-device testing** — solo análisis estático. iOS auto-zoom y touch-target reales necesitan dispositivo o BrowserStack.
- **CRM admin** — fuera de alcance.
- **Componentes shadcn/ui base** — externos; se asume baseline correcto.
- **SEO** — pase aparte; ya hay `2026-03-12-codebase-audit.md` y trabajo SEO autopilot en marcha.
