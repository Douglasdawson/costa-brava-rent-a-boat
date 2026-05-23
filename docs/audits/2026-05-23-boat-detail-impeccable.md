# BoatDetailPage — Auditoría /impeccable

**Fecha**: 2026-05-23
**Alcance**: `client/src/components/BoatDetailPage.tsx` (1869 líneas) + dependencias visuales directas (`BoatPricingSection.tsx`, `AvailabilityCalendar.tsx`).
**Register**: brand (`PRODUCT.md`).
**Disparador**: cierre del refactor que conecta `pricing_overrides` con el catálogo (calendar + precios en una Card 2-col en desktop). Antes de seguir construyendo, pasada de calidad antes de envío.
**Output**: este reporte + aplicación de no-controversiales en el mismo pase. Controversiales se reportan al final para decisión.

## Mapa de la página

| # | Sección | Líneas | Componente |
|---|---------|--------|------------|
| 1 | Mini-hero (back btn, license badge, h1, price pill, CTA) | 1116–1180 | inline |
| 2 | View counter ("X personas han visto…") | 1181–1190 | inline |
| 3 | Live interest indicator | 1191–1195 | `LiveInterestIndicator` |
| 4 | Image gallery + Description (2-col) | 1199–1351 | inline + `Card` + `TrustBadges` |
| 5 | Availability urgency | 1353–1357 | `AvailabilityUrgency` |
| 6 | **Disponibilidad + Precios** (nuevo) | 1358–1370 | `BoatPricingSection` |
| 7 | Reviews carousel | 1372–1374 | `BoatReviewCarousel` |
| 8 | Tabbed details (Características, Ficha, Equipamiento, Extras, Info) | 1375–1652 | inline `Tabs` |
| 9 | Related boats grid | 1654–1733 | inline |
| 10 | FAQ accordion (`<details>`) | 1734–1748 | inline |
| 11 | Footer | 1750 | `Footer` |
| 12 | Sticky mobile bottom CTA | 1752–1779 | inline |
| 13 | Sticky desktop pricing sidebar | 1781–1817 | inline |
| 14 | Lightbox | 1819–1866 | inline `Dialog` |

---

## Hallazgos

Códigos: **C** = crítico, **A** = alto, **M** = medio, **B** = bajo. **CV** = controversial, **NC** = no-controversial.

### Información perdida (cross-cutting)

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| F1 | C | CV | Info perdida | `BoatDetailPage:1163-1167` (hero pill), `1765` (sticky mobile), `1791` (sticky desktop) | Los tres muestran `{lowestPrice}€` calculado desde `boatData.pricing.BAJA.prices` y **no responden a `selectedDate`** elegida en `BoatPricingSection`. Usuario elige sábado con override "+15%" → ve `150€` en BoatPricingSection y `desde 75€` en el pill/sticky a la vez. Choque idéntico al que motivó el refactor del Pricing Section. | Tres opciones: (a) ocultar el pill cuando hay `selectedDate`, (b) sustituirlo por "Tu fecha: 150€", (c) dejarlo como "desde" pero añadir el override label. Necesita decisión arquitectónica + tocar 3 puntos. |

### Color & tokens

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| C1 | A | NC | Tokens (ban `#000`) | `BoatDetailPage:1127` | Hero overlay `bg-gradient-to-t from-black/80 via-black/50 to-black/20` — DESIGN.md prohíbe `#000` puro en favor de `foreground` tintado. | Cambiar a `from-foreground/80 via-foreground/50 to-foreground/20`. |
| C2 | M | NC | Tokens | `BoatDetailPage:1821` | Lightbox `bg-slate-950/95` — `slate-950` no es navy tintado del design system. | `bg-foreground/95`. |
| C3 | A | CV | Diferenciación | `BoatDetailPage:1146-1150` (hero), `1705-1709` (related cards) | Badge "Con licencia" vs "Sin licencia" usa **mismo tono base** (`bg-primary/90` vs `bg-primary/80` en hero; `bg-primary/10 text-primary` en ambos casos en related). No hay diferencia visual. Reduce "confidence through clarity". | Diferenciar con un token. Opciones: (a) usar `bg-primary` vs `bg-secondary`; (b) usar `bg-primary` vs outline. Decisión visual. |
| C4 | M | NC | Glassmorphism | `BoatDetailPage:1164` | Hero price pill usa `bg-white/15 backdrop-blur-sm rounded-full`. DESIGN.md sólo permite glass en Navigation (estructural). Aquí decora. | `bg-foreground/40 rounded-full` sin blur (legibilidad sobre foto se mantiene por la opacidad). |
| C5 | M | NC | Tokens | `BoatPricingSection:287` | `bg-popular/10 border-popular/30` con texto `text-foreground` — verificar contraste sobre fondo amber suave. Probable AA OK por baja saturación del fondo, pero `bg-popular/15` y `text-foreground` confirma legibilidad. | Validar visualmente. Si no, subir a `/15`. |

### Tipografía & jerarquía

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| T1 | A | NC | i18n / capitalize | `BoatPricingSection:271` | `<h3 className="… capitalize">` sobre `pricesForDay` cuyo `{day}` viene de `Intl.DateTimeFormat`. En castellano genera "Sábado, 26 De Mayo" (mal). En ruso fuerza primera-letra-de-palabra (no idiomático). | Quitar `capitalize`. `Intl` ya produce la forma idiomática correcta. |
| T2 | M | NC | Hierarchy | `BoatDetailPage:1153-1158` | El "·" separador del subtítulo "Solar 450 · Blanes, Costa Brava" cae en `font-normal text-white/80`. Lee débil. | `mx-2 text-white/60` y mantener tamaño. O cambiar a salto de línea en mobile. |
| T3 | M | CV | Hierarchy / Redundancia | `BoatPricingSection:55-57` | Card title `"Comprueba disponibilidad"` con icono + sub-header en columna derecha `"Precios por Temporada"` / `"Precios para [día]"`. El sub-header repite contexto. | Eliminar el Card title (que el sub-header haga de heading) o hacerlo dinámico también. Decisión IA. |
| T4 | M | NC | Weight ladder | `BoatDetailPage:1435, 1607` | h4 con `font-semibold text-sm text-foreground/80` aparece tras un h2 grande sin transición de peso/tamaño suficiente. Salto > 1.25 pero la opacidad del color lo debilita más. | Subir a `font-bold text-foreground` (sin reducción de opacidad). |

### A11y

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| A1 | A | NC | aria-label | `BoatPricingSection:321-330` | Botones de duración leen "150€ 4h Recomendado". Insuficiente. | `aria-label={\`Reservar ${duration} por ${finalPrice} euros${isRecommended ? ', opción recomendada' : ''}\`}`. |
| A2 | M | NC | aria-live | `BoatPricingSection:73-92` | Al cambiar de SeasonPricingMode a DayPricingMode no hay announcement. | `aria-live="polite"` en el wrapper de la columna derecha. |
| A3 | M | NC | aria-label | `BoatPricingSection:48` (botón ✕) | Botón "Ver precios por temporada" tiene texto pero el icono ✕ sin contexto puede confundir screen reader. | El texto del botón ya es descriptivo, no requiere `aria-label`. ✓ Sin acción. |
| A4 | M | NC | Focus visible | `BoatDetailPage:1131-1139` (back btn), `1758-1777` (sticky CTAs) | Botones nativos `<button>` con clases custom — no usan `<Button>` ni tienen `focus-visible` explícito. | Migrar a `<Button>` para heredar foco; o añadir `focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2`. |
| A5 | B | NC | Touch target | `BoatDetailPage:1282-1290` (mobile dots) | Botones de paginación de imagen son `h-3` (12px). AA exige 44x44 área de toque. | `h-3 w-3` visualmente, pero envolver con padding o `min-h-11 min-w-11` con el dot centrado. |

### Spacing, layout, alineación

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| L1 | A | NC | Rounded consistency | `BoatDetailPage:1202` | Image gallery wrapper usa `rounded-xl` (12px) mientras la `Card` adyacente y resto del system usan `rounded-2xl` (16px). Asimetría visible cuando ambas cards van lado a lado. | `rounded-2xl`. |
| L2 | M | NC | Items alignment | `BoatDetailPage:1425, 1451, 1469, 1528, 1613` | Mezcla de `items-center` y `items-start` para listas con icono + texto, sin patrón. | Unificar a `items-start` cuando hay texto multi-línea, `items-center` cuando es single-line. Revisar línea a línea. |
| L3 | B | NC | Spacing tokens | `BoatDetailPage:1117` (mini-hero `h-64 sm:h-80`) | Alturas hardcoded en hero — consistente con escala Tailwind, OK. ✓ Sin acción. | — |

### Elevación / shadows

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| E1 | M | NC | Earned Depth Rule | `BoatDetailPage:1675` | Related boats cards: `shadow-sm hover:shadow-md`. La regla dice **no shadow en reposo**. | `shadow-none hover:shadow-md`. |
| E2 | A | OK | Shadow estructural | `BoatDetailPage:1757` (sticky mobile), `1787` (sticky desktop) | `shadow-lg` y `shadow-xl` — DESIGN.md los lista como excepciones estructurales explícitas. ✓ Sin acción. | — |

### Microcopy / i18n

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| I1 | A | NC | Ban absoluto (em-dash) | `client/src/i18n/es.ts:16, 86, 88, 194, 657` | 5 strings visibles al usuario contienen "—" (em-dash). Shared design law: "No em dashes. Use commas, colons, semicolons, periods, or parentheses." | Sustituir: SEO titles → `:` o `|`; bullets → `,`; mensajes → `,` o `.`. Sólo en `es.ts`; la propagación a 7 idiomas queda pendiente (requiere `npm run i18n:translate` con API key). |
| I2 | M | CV | i18n migration | `BoatDetailPage:1186, 1323, 1452 (translate("Recomendado"))`, `1702 ("pax")` | Múltiples strings vía `translateBoatText("...", language)` o hardcoded en lugar de keys i18n estructuradas. Deuda histórica documentada. | Mover a `t.boatDetail.*` y propagar. Trabajo de migración, no fix puntual. |
| I3 | M | CV | Microcopy | `BoatPricingSection:289` | "Tarifa especial" para todo override, positivo o negativo. No distingue subida vs descuento. | Cambiar a `t.boatDetail.specialRate + label` donde label venga del CRM con signo. O dos keys: `priceIncreaseLabel` / `priceDiscountLabel`. |

### Anti-patterns

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| P1 | M | CV | Identical card grid | `BoatDetailPage:1661-1729` | Related boats: grid 1/2/3 col con cards idénticas image+name+capacity+price+viewDetails. Brand ban: "Identical card grids: same-sized cards with icon + heading + text". | Romper monotonía: tamaños asimétricos, o mostrar 2 grandes + 1 lista compacta. Diseño nuevo. |
| P2 | M | CV | Identical card grid | `BoatDetailPage:1543-1576` (Tab Extras) | Extras renderizados como grid 2/3/4 col, cards idénticas icon+name+price. Mismo anti-pattern. | Convertir a tabla compacta o lista con icono. Cambio de patrón. |
| P3 | M | CV | Modal first thought | `BoatDetailPage:1820-1866` (Lightbox) | Modal para ver imagen más grande. Para galerías de imágenes el modal es uno de los pocos lugares donde está justificado (mismo patrón Lightbox-de-galería universal). ✓ Sin acción. | — |

### Motion

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| M1 | M | CV | Transición de modo | `BoatPricingSection:73-92` | Cambio SeasonMode ↔ DayMode es mount/unmount abrupto. | Wrapper con `transition-opacity` y `key={selectedDate ? 'day' : 'season'}` para fade suave. |
| M2 | B | OK | Hover lift | `BoatDetailPage:1688` (related img) | `group-hover:scale-105 transition-transform duration-300` — coherente con DESIGN.md ("Hover: translateY/scale, GPU-composited"). ✓ Sin acción. | — |

### Estados

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| S1 | M | NC | Loading state | `BoatPricingSection:294-310` | Skeleton dimensions OK (min-w-[100px], h-7/h-4). Pero `bg-muted animate-pulse` dentro de un contenedor `bg-muted` → pierde contraste, casi invisible. | Cambiar fondo interno a `bg-background` para que el skeleton resalte. |
| S2 | B | OK | Empty | `BoatPricingSection:313` | `noPricesForDate` claro. ✓ | — |

### Responsive

| # | Sev | CV/NC | Dimensión | Ubicación | Hallazgo | Sugerencia |
|---|-----|-------|-----------|-----------|----------|------------|
| R1 | M | CV | Tablet gap | `BoatPricingSection:62` | Layout 2-col se activa a `lg:` (1024px). Entre 768–1024px el calendar y los precios siguen apilados, pero con la card ya ancha — la columna derecha luce vacía. | Adelantar a `md:` (768px) o ajustar el contenido del calendario. Decisión visual. |

---

## Resumen ejecutivo

- **Total hallazgos**: 26
- **No-controversiales aplicables ahora**: 13 (C1, C2, C4, C5, T1, T2, T4, A1, A2, A4, A5, L1, L2, E1, S1, I1) — incluyen los más visibles (em-dashes, capitalize, tokens hardcoded, aria-labels, alineación, shadow de related boats).
- **Controversiales para decisión**: 13 (F1, C3, T3, P1, P2, M1, R1, I2, I3, etc.). El crítico **F1** (precio del hero/sticky no responde a fecha) merece decisión prioritaria.

## Plan de aplicación en este pase

Commits temáticos `boat-detail(impeccable):`:

1. **`tokens`**: C1, C2, C4 — sustituir `black/slate-950` por `foreground`, quitar `backdrop-blur` decorativo del pill.
2. **`typography`**: T1, T2, T4 — quitar `capitalize`, ajustar separador, peso del h4.
3. **`a11y`**: A1, A2, A4 — `aria-label` en duraciones, `aria-live` en wrapper de modo, focus visible en botones nativos.
4. **`spacing`**: L1, L2, E1 — `rounded-2xl` en image gallery, unificar items alignment, quitar shadow en reposo de related boats.
5. **`loading`**: S1 — fondo del skeleton.
6. **`copy`**: I1 — em-dashes en `es.ts` (5 strings). Anotar follow-up para propagación 7 idiomas.

Tras cada commit: `npm run check` rápido. Antes del último: `npm run check:all`.

## Controversiales — para decisión del usuario

(Se mantienen en este reporte y se presentan en chat al final.)

1. **F1** — desincronización del precio del hero/sticky con `selectedDate`. Impacto: el problema original que motivó el refactor sigue parcialmente vivo en otros tres puntos de la página.
2. **C3** — diferenciación visual de badge con-licencia / sin-licencia.
3. **T3** — eliminar Card title redundante de BoatPricingSection.
4. **P1, P2** — anti-pattern de "identical card grids" en related boats y tab Extras.
5. **M1** — transición de fade entre Season ↔ Day pricing.
6. **R1** — adelantar el grid 2-col de `lg:` a `md:`.
7. **I2, I3** — migración i18n y diferenciación de override positivo/negativo.

## Follow-ups documentados

- Propagar la sustitución de em-dashes (I1) a `en, ca, fr, de, nl, it, ru` cuando `ANTHROPIC_API_KEY` esté disponible (`.env`).
- Re-auditar `BoatReviewCarousel`, `LiveInterestIndicator`, `TrustBadges`, `AvailabilityUrgency` por separado — fuera del scope de este pase.
- Considerar mover la dedup/normalización del array `included` (visible en captura "Seguro embarcación y ocupantes" + "Seguro" coexistían) al storage layer o a un `boatData.normalize()`. Fuera de scope visual.
