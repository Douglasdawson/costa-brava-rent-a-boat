# /impeccable audit — Boat Pricing Section (delta)

**Fecha**: 2026-05-24
**Skill**: `/impeccable audit` (register: brand)
**Alcance**: sub-sección "Availability + Pricing" del detalle de barco.
**Archivos**:
- `client/src/components/BoatPricingSection.tsx`
- `client/src/components/AvailabilityCalendar.tsx`
- Claves i18n `boatDetail.{pricesForDay, specialRate, specialRateIncrease, specialRateDiscount, selectDateTitle, selectDateBody, calendarHint, noPricesForDate, loadingPrices, backToSeasonPrices, recommendedBadge, priceIncludes}` × 8 idiomas.

**Contexto**: el audit del 2026-05-23 cubrió esta sub-sección dentro del audit completo de `BoatDetailPage`. Después he hecho dos commits (`ba26e01` 6 franjas, `fce251a` affordance del calendario) — este pase evalúa el delta y el estado actual contra DESIGN.md.

**Anti-references** (PRODUCT.md): no luxury-yacht, no budget-excursion, no generic-travel. Salt Memory: cálido, libertad, seguridad.

---

## Anti-Patterns Verdict

**PASS con dos infracciones locales**. No es AI slop — usa Clash Display + Archivo (no Inter/Plus Jakarta), pill buttons, paleta navy/teal/coral del repo, copy específico de barcos. Pero hay dos tells claros:

1. **Shadow al reposo en celdas del calendar** — violación de la "Earned Depth Rule" de DESIGN.md. Introducido por mi propio commit `fce251a` al subir el contraste; añadí `shadow-sm` AL REPOSO en `AvailabilityCalendar:344, :346`. La regla del sistema es shadow solo como respuesta a interacción.
2. **Paleta del calendar hardcoded a Tailwind** — `emerald-*`, `amber-*`, `red-*`, `gray-*` directas en lugar de los tokens HSL del proyecto (`--success`, `--popular`, `--destructive`, `--muted`). El resto del repo es disciplinado; el calendar rompe la consistencia.

---

## Audit Health Score

| # | Dimensión | Score | Hallazgo clave |
|---|-----------|-------|----------------|
| 1 | Accessibility | **3** | Falta arrow-key navigation en `role="grid"` (WAI-ARIA composite widget pattern) |
| 2 | Performance | **4** | Sin tachas. React Query con `enabled`, `useMemo`, `motion-reduce` respetado. |
| 3 | Responsive | **3** | 6 cards en mobile 375px viables pero apretadas (3 filas × 2 cols). |
| 4 | Theming | **2** | Calendar palette hardcoded a Tailwind, no a tokens HSL del proyecto. |
| 5 | Anti-Patterns | **3** | `shadow-sm` al reposo en celdas (mi commit `fce251a`). |
| **Total** | | **15/20** | **Good** — address weak dimensions |

---

## Executive Summary

- **Audit Health Score: 15/20** (Good).
- **6 hallazgos no-controversiales aplicables ahora** (3 P1, 2 P2, 1 P3).
- **3 hallazgos controversiales** para decisión del usuario.
- **Top 3 críticos**:
  1. **C-tokens** (P1): migrar paleta del calendar a tokens HSL del repo.
  2. **S-shadow-rest** (P1): retirar `shadow-sm` del estado al reposo en celdas.
  3. **A-arrow-nav** (P1): añadir navegación con flechas al grid del calendar.

---

## Detailed Findings by Severity

### P1 — Major (no-controversiales, aplicar ahora)

#### [P1] S-shadow-rest — Shadow al reposo viola Earned Depth Rule
- **Categoría**: Anti-Pattern + Theming.
- **Locación**: `AvailabilityCalendar.tsx:344, :346`.
- **Detalle**: `bg-emerald-100 ... shadow-sm` y `bg-amber-100 ... shadow-sm` aplican shadow al reposo. DESIGN.md (`§ Elevation > Earned Depth Rule`) prohíbe shadows decorativos. Estructurales solo en navigation pill y stickies — celdas de calendar NO son sticky/flotantes.
- **Impacto**: Inconsistencia visible con el resto del sistema (otras celdas no tienen shadow al reposo, sticky CTAs sí). El usuario percibe que las celdas "flotan" sin razón.
- **Recommendation**: mover `shadow-sm` a `hover:shadow-sm`. El borde + tinte de fondo ya da affordance suficiente al reposo. La sombra emerge al hover.

#### [P1] C-calendar-palette-tokens — Calendar palette out of design tokens
- **Categoría**: Theming.
- **Locación**: `AvailabilityCalendar.tsx:340-352, :486-501` (legend).
- **Detalle**: Las clases `bg-emerald-100`, `bg-emerald-200`, `border-emerald-300`, `border-emerald-400`, `text-emerald-900`, `bg-amber-100/-200/-300/-400`, `text-amber-900`, `bg-red-100`, `text-red-400`, `bg-red-300` (legend), `bg-gray-50/-100/-300`, `text-gray-300/-400` son paleta Tailwind directa. El resto del proyecto usa tokens HSL semánticos (`--success`, `--popular`, `--destructive`, `--muted`, `--foreground`) — definidos en DESIGN.md y `client/src/index.css`.
- **Impacto**: Si DESIGN.md ajusta `--success` (memoria: ya se oscureció el `--popular` por contraste AA), el calendar no sigue. Inconsistencia sistémica.
- **Recommendation**: migrar a tokens:
  - `available`: `bg-success/15 hover:bg-success/25 border-success/30 hover:border-success/50 text-success` (sea green del brand `#16a34a`).
  - `partial`: `bg-popular/15 hover:bg-popular/25 border-popular/30 hover:border-popular/50 text-foreground` (amber del brand `#f59e0b`).
  - `booked`: `bg-destructive/10 text-destructive/60 border border-destructive/20` (no es solo "no clickable" — es "explícitamente bloqueado").
  - `off_season`: `bg-muted text-muted-foreground/60` (gris del sistema).
  - `past`: `bg-muted/50 text-muted-foreground/40` (gris aún más apagado).
  - Legend: misma migración.

#### [P1] A-grid-arrow-nav — Falta navegación con flechas en el grid
- **Categoría**: Accessibility.
- **Locación**: `AvailabilityCalendar.tsx:316-322, :425-477`.
- **Detalle**: El elemento `role="grid"` con celdas `role="gridcell"` está implementado, pero no hay `onKeyDown` handler que mueva el foco con flechas. WAI-ARIA Authoring Practices (Grid pattern) exige:
  - ↑ ↓: mover foco una celda arriba / abajo (mismo día de la semana).
  - ← →: mover foco una celda izquierda / derecha (día siguiente / anterior).
  - Home / End: primer / último día del mes.
  - PageUp / PageDown: opcional, mes anterior / siguiente.
- **WCAG / Standard**: WCAG 2.1.1 "Keyboard" — todo lo operable con ratón debe operable con teclado. Tabular grid widgets necesitan arrow nav.
- **Impacto**: Usuarios con teclado/screen reader saltan celda a celda con Tab, lo cual hace tedioso navegar un mes completo (35-42 celdas). Mata la afford del grid.
- **Recommendation**: añadir `onKeyDown` al contenedor `role="grid"` que mueva focus por dataset/index. Mantener tabIndex=0 solo en la celda con foco (roving tabindex).

### P2 — Minor (no-controversiales)

#### [P2] I-dual-hint — Dos hints duplicados sobre seleccionar fecha
- **Categoría**: i18n / Copy.
- **Locación**: `BoatPricingSection.tsx:158-161` (hint encima del calendar) + `:223-224` (empty state body).
- **Detalle**: Mi commit `fce251a` añadió `calendarHint` ("Toca un día disponible para ver los precios") encima del calendar. Pero ya existía `selectDateBody` ("Toca un día verde en el calendario para ver los precios reales y disponibilidad.") en el empty state. Mismo mensaje dos veces, en dos sitios del mismo viewport.
- **Impacto**: Ruido visual. El usuario lee lo mismo dos veces. Empty state pierde fuerza por duplicación.
- **Recommendation**: una de dos opciones simétricas:
  - **(a)** dejar SOLO el hint sobre el calendar (más cerca de la acción). Reescribir empty state body a algo más cálido y de marca: "Te decimos qué barcos quedan libres y a qué precio." (alinea con "Salt Memory"). Quitar `calendarHint` key cuando no hay dual.
  - **(b)** dejar SOLO el empty state body. Quitar el hint encima del calendar.
- **Decisión recomendada**: opción **(a)** — el empty state recupera función de promesa de marca ("qué barcos quedan libres y a qué precio") y el hint corto cumple su función de instruir el gesto. Aplicar.

#### [P2] S-today-selected-overlap — Estilo del día actual + seleccionado se acumula
- **Categoría**: States.
- **Locación**: `AvailabilityCalendar.tsx:336-337` (selected) + `:459-461` (today).
- **Detalle**: 
  - Selected: `ring-2 ring-primary ring-offset-1 bg-primary/10 font-semibold`.
  - Today: `font-bold underline underline-offset-2`.
  - Si `info.isToday && info.isSelected`: ambas reglas se aplican (no hay if/else). El número muestra `font-bold` + `underline` + ring + bg + `font-semibold` apilados. Aspecto cargado.
- **Impacto**: Visual ruidoso cuando hoy es la fecha elegida (caso normal — la gente reserva "para hoy" o explora hoy primero). Compite con la jerarquía del estado seleccionado.
- **Recommendation**: cuando ambos: el ring del seleccionado gana, el `underline` desaparece. El día actual sigue señalado por estar dentro del ring.

### P3 — Polish

#### [P3] L-cleanup-legacy-i18n-key — Clave `specialRate` muerta
- **Categoría**: Code hygiene / i18n.
- **Locación**: `client/src/i18n/{es,en,ca,fr,de,nl,it,ru}.ts` — la clave `specialRate: "Tarifa especial"` (es:704) existía antes de la migración a `specialRateIncrease` / `specialRateDiscount`. No tiene consumidores.
- **Impacto**: Bytes muertos en 8 archivos + 1 type. Nada visible.
- **Recommendation**: borrar de los 8 ficheros + del type en `lib/translations.ts`. Sincrónico para que `i18n:validate` siga limpio.

---

## Controversiales (CV — presentar al final, no aplicar)

### [P2/CV] R-empty-panel-asymmetry — Panel derecho desproporcionado al reposo
- **Locación**: `BoatPricingSection.tsx:122` (grid `[minmax(0,28rem)_minmax(0,1fr)]`).
- **Detalle**: Cuando no hay fecha seleccionada, el calendar (~28rem) y el empty state (~1fr resto del ancho) crean un peso visual desequilibrado: el empty state ocupa más espacio del que necesita ("Selecciona una fecha" + 1 párrafo + 1 icono).
- **Opciones**:
  - **(a)** Adelgazar el panel empty state a `max-w-md` o `max-w-sm` centrado.
  - **(b)** Cambiar el grid a `[28rem_minmax(0,24rem)]` en empty mode y `[28rem_minmax(0,1fr)]` en day mode (variable según `selectedDate`).
  - **(c)** Eliminar el empty state cuando no hay fecha y dejar solo el calendar centrado, mostrando precios "desde" en cada celda al hover.
- **Decisión necesaria**: producto. (a) es mínima invasión, (c) es ambiciosa y altera la información-architectura.

### [P3/CV] E-empty-state-generic — Empty state demasiado neutro
- **Locación**: `BoatPricingSection.tsx:217-227`.
- **Detalle**: `bg-muted p-8 text-center` + icono + heading + body. Es el patrón empty state genérico de cualquier dashboard. No transmite "Salt Memory" (libertad, seguridad, memoria). Podría ser un momento de personalidad: una nota corta sobre el verano, un guiño al puerto, un microcopy más cálido.
- **Opciones**:
  - **(a)** Replace icon → un detalle ilustrado o foto miniaturizada del barco / cala.
  - **(b)** Reescribir copy con tono de marca: "El sol no espera. Elige el día y te decimos qué barcos quedan a esa hora."
  - **(c)** Eliminar la card del empty state. El calendar carga la conversación.
- **Decisión necesaria**: brand. Subjetiva.

### [P3/CV] M-mode-transition-polish — Transición Empty↔Day básica
- **Locación**: `BoatPricingSection.tsx:175, :187`.
- **Detalle**: `animate-in fade-in duration-300` simple. Para una sub-sección que es el core conversion path, vale considerar algo más memorable (slide+fade, escalonado entre precios).
- **Opciones**:
  - **(a)** Mantener fade (estado actual).
  - **(b)** Slide + fade vertical (panel sube 8px mientras aparece).
  - **(c)** Escalonado: las 6 cards de duración aparecen una a una con 50ms de delay entre cada (stagger).
- **Decisión necesaria**: motion design.

---

## Patterns & Systemic Issues

1. **Calendar como isla**: la única fuga de tokens del proyecto está en `AvailabilityCalendar.tsx`. Migrarlo cierra la última brecha de paleta inconsistente.
2. **Mi commit fce251a introdujo dos regresiones**: el shadow al reposo y el dual hint. Lección: tras el último audit (2026-05-23), añadir cambios sin checkear DESIGN.md trae deuda inmediata.
3. **A11y del grid**: el patrón está completo *salvo* arrow nav. Es el último punto crítico para hacerlo realmente "WCAG AA + nice to use con teclado".

---

## Positive Findings

- **Tipografía coherente**: `font-heading` (Clash Display) en todos los h3 + month title. Body se queda en Archivo. Cumple "Weight Ladder Rule".
- **A11y casi completa**: `aria-live="polite"` en el wrapper de modo, `aria-label` específico en cada botón de duración, `role="grid"` + `aria-selected` + `tabIndex` correcto, `motion-reduce` respetado.
- **Override headline ya diferenciado**: `specialRateIncrease` ("Tarifa especial") vs `specialRateDiscount` ("Descuento aplicado") + iconos `TrendingUp` / `TrendingDown` + colores `bg-popular/10` / `bg-success/10`. El I3 del audit anterior está cerrado.
- **Botón "Recomendado"** sigue la pauta DESIGN.md `border-2 border-cta` + chip badge. Sin shadow al reposo. Correcto.
- **Hover lift respetuoso**: `hover:-translate-y-0.5` con `motion-reduce:transform-none`. GPU-composited. Cumple "GPU only" rule.
- **Empty state copy directivo**: mi cambio reciente del body "Toca un día verde en el calendario..." es más útil que el genérico anterior.

---

## Recommended Actions

Aplicar en orden, commits temáticos `boat-pricing(impeccable): <ámbito>`:

1. **[P1] `boat-pricing(impeccable): retire calendar shadow at rest (Earned Depth Rule)`** — mover `shadow-sm` a `hover:shadow-sm` en celdas available/partial.
2. **[P1] `boat-pricing(impeccable): migrate calendar palette to HSL tokens`** — sustituir Tailwind emerald/amber/red/gray por tokens `--success`, `--popular`, `--destructive`, `--muted`, `--foreground`. Incluye celdas + leyenda.
3. **[P1] `boat-pricing(impeccable): add arrow-key navigation to calendar grid`** — `onKeyDown` con roving tabindex. Flechas + Home/End.
4. **[P2] `boat-pricing(impeccable): collapse dual hint into single signal`** — opción (a): empty state body más de marca, hint corto sobre calendar.
5. **[P2] `boat-pricing(impeccable): combine today+selected state branch`** — quitar underline cuando hoy es el seleccionado.
6. **[P3] `boat-pricing(impeccable): remove dead specialRate i18n key`** — 8 ficheros + type.

Verificación tras cada commit:
- `npm run check` (esperar 6 errores TS preexistentes documentados).
- `npm run i18n:validate` para los que tocan i18n (4 y 6).
- Chrome DevTools en `https://costabravarentaboat.com/es/barco/solar-450` para validar visualmente — recordar que es producción; los cambios solo se ven post-Replit Publish.

Antes del último commit: `npm run check:all`.

Controversiales (R-empty-panel-asymmetry, E-empty-state-generic, M-mode-transition-polish) se presentan al usuario en chat al final para decisión.

---

## Re-audit guidance

Re-correr `/impeccable audit` tras aplicar los 6 fixes para confirmar score subido a ~18-19/20. Las únicas dimensiones que pueden quedar abajo de 4 después de estos cambios son Responsive (mobile 6 cards apretado, decisión de producto) y Anti-Patterns si surge algo nuevo.
