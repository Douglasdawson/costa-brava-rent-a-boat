# Auditoría /impeccable — Wizards de Hero

**Fecha:** 2026-05-04
**Alcance:** los dos wizards que se disparan desde el CTA principal del Hero (`Encuentra tu barco` / `Reservar ahora`).
**Cadena auditada:** `Hero.tsx` → `BoatQuizModal` → `BookingFormWidget` (dispatcher) → `BookingWizardMobile` o `BookingFormDesktop`.
**Metodología:** runtime (Chrome DevTools MCP, mobile 375×812 + desktop 1440×900), Lighthouse a11y, screenshots por estado, i18n switch, lectura de los ~3 800 LOC.
**Decisión:** solo hallazgos. Ningún fix aplicado.

---

## Audit Health Score

| # | Dimensión | Score | Hallazgo clave |
|---|-----------|-------|---------------|
| 1 | Accessibility | 2/4 | Contrast fail sistemático (`text-muted-foreground/60` × N), `aria-busy` prohibido, heading-order h2→h4, focus inicial en Close |
| 2 | Performance | 3/4 | Lazy-loaded, `useMemo` abundante, GPU-only motion mayormente; pero 3 499 LOC duplicadas mobile/desktop |
| 3 | Theming | 1/4 | `red-500`, `green-600/700`, `amber-600` en vez de tokens. `shadow-md`/`lg` al reposo. Gradientes en pack buttons |
| 4 | Responsive Design | 2/4 | Funciona en ambos; pero touch targets <44 px múltiples y `text-[9px]` en desktop |
| 5 | Anti-Patterns | 2/4 | Gradientes decorativos, shadow al reposo, "MÁS POPULAR" dentro del label del botón, barcos como `disabled` HTML |
| **Total** | | **10/20** | **Acceptable (significant work needed)** |

Lighthouse a11y: 90/100 (mobile, step 4) · 92/100 (desktop, step 2). Reports en `screenshots/2026-05-04-wizards/report.json` y `lighthouse-desktop-step2.json`.

---

## Anti-Patterns Verdict

¿Parece generado por IA? **No al 100 %**, pero hay 4 telltales que lo bajan:

1. **Gradient on pack buttons** (`BookingFormDesktop.tsx:711`): `bg-gradient-to-br from-cta/55 via-cta/25 to-foreground/15`. DESIGN.md (línea 114, 286) prohíbe gradientes decorativos.
2. **Resting shadows**: `shadow-lg` en prefix dropdown (BookingFormDesktop.tsx:954, BookingWizardMobile.tsx:696) y `shadow-md` en pack seleccionado. Viola la **Earned Depth Rule** (DESIGN.md:184).
3. **Boats as disabled HTML buttons** en step 1 desktop: el quiz preselecciona un barco, el resto queda `<button disabled>`. Affordance rota: el usuario no puede cambiar de barco sin volver al quiz.
4. **Hardcoded translation table** dentro del componente (`BoatQuiz.tsx:20-74`) — patrón de "primero hago la lógica, luego pienso en i18n" que el código de la web evita en todo lo demás.

---

## Resumen ejecutivo

**Crítico (P0) — 7 hallazgos:**
1. Quiz solo soporta `es` y `en`. **6 idiomas (ca, fr, de, nl, it, ru) caen a español** — uno de los pilares del producto roto en el primer wizard.
2. Quiz dialog title `"Boat Quiz"` hardcoded en inglés (`BoatQuizModal.tsx:17`) — screen readers de cualquier locale leen "Boat Quiz".
3. Contrast WCAG AA fail sistemático con `text-muted-foreground/60`. Aparece **8+ veces** en step 4 mobile y similar en desktop. Contradice directamente PRODUCT.md ("high contrast critical — outdoor/sunlight usage is common", línea 49-50).
4. `aria-busy="false"` en `<button>` — atributo prohibido en `role=button` (Lighthouse `aria-prohibited-attr`).
5. Heading order roto: h2 → h4 (sin h3) en step 4.
6. Focus inicial al abrir el booking dialog cae en el botón **Close** (Radix default), no en la primera entrada del formulario ni en el heading.
7. Catálogo duplicado: `BoatQuiz.tsx:76-85` redefine la flota completa con precios hardcoded en vez de leer `shared/boatData.ts` (memory: "boatData is single source of truth, never invent").

**Mayores (P1) — 14 hallazgos.** Color tokens ignorados (`red-500`, `green-600/700`, `amber-600` en lugar de Signal Red / Sea Green / Amber Popular). Gradientes y shadows al reposo. Inconsistencia mobile/desktop (radio vs button). Date format `"9 may 2026"` con "may" hardcoded en español → se ve igual en /de/ y /fr/.

**Menores (P2) — 12 hallazgos.** Touch targets <44 px en filtros, dropdowns, duraciones. `text-[9px]/[10px]` en desktop. 65 props vía un solo `sharedProps`. Smooth-scroll en step change (layout animation prohibida).

**Polish (P3) — 4 hallazgos.** Lista de TIME_SLOTS de 21 horas sin agrupar. Validation message genérico sin `aria-live`. Quiz no muestra estado vacío si `score > 0` filtra todo.

**Top 5 a abordar primero (en orden):**
1. Migrar el quiz al sistema i18n del proyecto (es.ts + npm run i18n:translate). Eliminar `QUIZ_TRANSLATIONS` y `BOAT_PROFILES` hardcoded.
2. Sustituir `text-muted-foreground/60` → tokens con contraste AA.
3. Quitar `aria-busy` del button y mover a un live region; arreglar heading-order h2→h3→h4.
4. Reemplazar `red-500`/`green-X`/`amber-600` por los tokens DESIGN.md.
5. Quitar gradientes y shadows al reposo (Earned Depth Rule).

---

## Severidad y leyenda

| Tag | Significado | Acción |
|-----|-------------|--------|
| **P0** | Bloqueante / brand-contract violation / accesibilidad rota | Arreglar antes de la próxima release |
| **P1** | Mayor: WCAG AA fail, design-system breach, UX confusa | Arreglar en el siguiente sprint |
| **P2** | Menor: incomodidad, edge case | En la próxima pasada de polish |
| **P3** | Polish: nice-to-fix, sin impacto real | Si hay tiempo |

---

# Wizard A — BoatQuiz (`BoatQuiz.tsx` 308 líneas + `BoatQuizModal.tsx` 23 líneas)

3 pasos (pax → duración → presupuesto) + pantalla de resultados. Recomienda top-3 barcos con `scoreBoat`. Al pulsar "Reservar ahora" llama `onBoatSelect(boatId)` que dispara el booking modal.

## A.1 — Accessibility

### A.1.1 [P0] Quiz dialog title hardcoded en inglés
- **Location:** `client/src/components/BoatQuizModal.tsx:17`
- **Code:** `<DialogTitle>Boat Quiz</DialogTitle>` envuelto en `<VisuallyHidden>`.
- **Impact:** Screen readers anuncian "Boat Quiz" en cualquier locale (es / ca / fr / de / nl / it / ru).
- **WCAG:** SC 3.1.2 Language of Parts.
- **Recommendation:** usar `t.boatQuiz.dialogTitle` (clave nueva en `es.ts` → propagar con `npm run i18n:translate`).

### A.1.2 [P1] Botones de opción sin role="radio"
- **Location:** `BoatQuiz.tsx:225-233` (4 / 3 / 3 botones por step).
- **Code:** plain `<button onClick={handleAnswer}>`. No hay `role="radio"`, ni `aria-checked`, ni `role="radiogroup"` en el contenedor.
- **Impact:** un screen reader anuncia "botón" 4 veces seguidas en lugar de "1 de 4 opciones". El usuario no entiende que es un single-choice question.
- **WCAG:** SC 4.1.2 Name, Role, Value.
- **Recommendation:** envolver en `<div role="radiogroup" aria-labelledby="quiz-q-1">`, cambiar buttons a `<button role="radio" aria-checked={false}>`.

### A.1.3 [P1] Progress bar sin role="progressbar"
- **Location:** `BoatQuiz.tsx:212-216`.
- **Code:** 3 `<div>` decorativos con `bg-cta` / `bg-muted`. Ningún ARIA.
- **Impact:** screen readers no anuncian progreso ("paso 1 de 3").
- **Recommendation:** `<div role="progressbar" aria-valuenow={step+1} aria-valuemin={1} aria-valuemax={3} aria-label="Progreso del quiz">`.

### A.1.4 [P2] No focus management on step change
- **Location:** `BoatQuiz.tsx:144-157` (`handleAnswer`) — solo hace `setStep(prev => prev + 1)`.
- **Impact:** el foco se queda en el botón pulsado del paso anterior. Verificado runtime: tras pulsar "3-4 personas" el foco salta al botón con el mismo índice del nuevo step (ahora "3-4 horas (medio día)"). Funciona por accidente.
- **Recommendation:** mover foco al heading de la pregunta (`<h2 ref={...} tabIndex={-1}>`) tras cada `setStep`.

### A.1.5 [P2] Touch targets <44 px
- **Location:** `BoatQuiz.tsx:228` (option buttons), `BoatQuiz.tsx:237-243` (back button).
- **Code:** `px-5 py-3.5` ≈ 38-40 px de altura. Back button (`text-sm` con icono) ≈ 24 px.
- **Impact:** WCAG 2.5.5 Target Size (AAA) y la regla "Touch targets minimum 44px (already enforced)" de PRODUCT.md.
- **Recommendation:** subir a `min-h-11` (44 px).

### A.1.6 [P2] Modal no full-screen on mobile
- **Location:** `BoatQuizModal.tsx:15` — `sm:max-w-md` (≈ 448 px). En 375×812 queda con margin lateral, y los results se ven solo a media página.
- **Impact:** UX móvil: el quiz aparece flotando, no inmersivo. Compite con el background del Hero.
- **Recommendation:** misma pauta que `useBookingModal.tsx:54` (full-screen mobile, `!h-[100dvh]`, `!rounded-none md:!rounded-2xl`).

### A.1.7 [P3] Sin focus restoration al cerrar
- **Location:** Hero.tsx:146-153.
- **Code:** `setQuizOpen(false)` cierra dialog; foco vuelve a `document.body` por defecto Radix.
- **Recommendation:** Radix Dialog ya gestiona focus return si el `<DialogTrigger>` envuelve al CTA. Aquí el botón está fuera (Hero.tsx:99-106) y se usa `setQuizOpen(true)` manual. Refactorizar a trigger pattern para que Radix devuelva el foco al CTA.

## A.2 — Theming / Color

### A.2.1 [P1] Botón "Reservar ahora" usa `text-white` literal
- **Location:** `BoatQuiz.tsx:278, 287`.
- **Code:** `bg-cta text-white hover:bg-cta/90`.
- **Impact:** DESIGN.md ban: "Don't use `#000` o `#fff` anywhere" (línea 289). El token correcto es `text-cta-foreground`.
- **Recommendation:** `text-cta-foreground` en ambos.

### A.2.2 [P2] `bg-cta/5` muy sutil sobre `bg-card`
- **Location:** `BoatQuiz.tsx:261` — `border-cta bg-cta/5`.
- **Impact:** la card "Mejor opción" apenas se distingue de las otras dos. La diferencia vive solo en `border-cta` (1 px) + un pequeño tinte.
- **Recommendation:** subir a `bg-cta/10` o aplicar el patrón "borde fino + badge superpuesto" descrito en DESIGN.md:218-230 (recomendación canónica).

## A.3 — i18n (la sección más rota del quiz)

### A.3.1 [P0] Solo soporta `es` y `en`
- **Location:** `BoatQuiz.tsx:20-74` (`QUIZ_TRANSLATIONS` con dos claves), `BoatQuiz.tsx:140` (`t = QUIZ_TRANSLATIONS[language] || QUIZ_TRANSLATIONS.es`).
- **Impact:** confirmado runtime — entrando a `/de/`, el quiz se renderiza completamente en español ("¿Cuántas personas sois?", "2 personas", "Reservar ahora", "Tu barco ideal es..."). 6 de los 8 idiomas oficiales del producto rotos.
- **WCAG:** SC 3.1.2 Language of Parts (texto en idioma distinto al `<html lang>`).
- **Recommendation:** mover todas las claves a `client/src/i18n/es.ts` bajo `t.boatQuiz`, ejecutar `npm run i18n:translate` para propagar a los 7 idiomas. Eliminar `QUIZ_TRANSLATIONS` del componente.

### A.3.2 [P0] Boat reasons hardcoded en es / en
- **Location:** `BoatQuiz.tsx:113-135` (`getReasonText`).
- **Code:** mismo patrón que A.3.1 pero para descripciones de barcos.
- **Recommendation:** mover a `t.boatQuiz.reasons.{boatId}` y traducir.

### A.3.3 [P0] Catálogo de barcos duplicado
- **Location:** `BoatQuiz.tsx:76-85` — `BOAT_PROFILES` con 8 barcos, ids, capacidades, precios.
- **Impact:** duplica `shared/boatData.ts`. Si el negocio sube precios, el quiz queda desincronizado. Memory: *"Never invent products/prices/packs not in shared/boatData.ts. It's the single source of truth"*.
- **Recommendation:** importar de `shared/boatData.ts`. Derivar `score-relevant fields` (capacity, license, budget bucket, duration bucket) de los datos reales. Eliminar `BOAT_PROFILES`.

## A.4 — Anti-patterns

### A.4.1 [P2] Magic numbers en `scoreBoat`
- **Location:** `BoatQuiz.tsx:87-110`.
- **Code:** `+3`, `+2`, `-10`, `+1` sin constants nombradas.
- **Impact:** lógica de recomendación opaca. Cualquier ajuste de negocio requiere leer el algoritmo entero.
- **Recommendation:** extraer a un objeto con keys narrativas (`SCORE.capacityMatch = 3`, `SCORE.capacityOverflow = -10`, `SCORE.preferNoLicense = 1`).

### A.4.2 [P3] Estado vacío no manejado
- **Location:** `BoatQuiz.tsx:172` — `.filter(r => r.score > 0)`.
- **Impact:** si las respuestas dan ≤0 a todos los barcos, la pantalla de resultados queda en blanco. No aparecerá en la práctica con la flota actual, pero no hay safety net.
- **Recommendation:** ramificar a un mensaje "No encontramos un barco que coincida exactamente — escríbenos por WhatsApp" + CTA al chat.

## A.5 — Performance / Motion

### A.5.1 [P3] Sin transiciones entre pasos
- **Location:** `BoatQuiz.tsx:194-247` — render condicional sin animation.
- **Impact:** los pasos cambian de golpe. Para un quiz "delight-driven", se queda corto. PRODUCT.md hablaba de *"warmth over polish"* — pero aquí no hay ni una ni la otra.
- **Recommendation:** opcional. Fade + slide-up de 200 ms con `transform`/`opacity`. Compatible con `prefers-reduced-motion`.

---

# Wizard B — Booking (`BookingFormWidget.tsx` 1 249 + `BookingWizardMobile.tsx` 1 103 + `BookingFormDesktop.tsx` 1 147)

4 pasos: barco → fecha/hora/duración/personas → datos personales → confirmar. `BookingFormWidget` orquesta y delega a la variante mobile o desktop según `useIsMobile()`.

## B.1 — Accessibility

### B.1.1 [P0] Contrast fail con `text-muted-foreground/60`
- **Location:** múltiples — verificado por Lighthouse:
  - Mobile step 4: 8+ ocurrencias (`<p class="text-sm text-muted-foreground/60">`, `<p class="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide">`, varios `<span class="text-muted-foreground/60">`).
  - Desktop step 4: agravado por tamaño — `<p class="text-[10px] text-muted-foreground/60">` y `<p class="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">`.
- **Impact:** WCAG SC 1.4.3 Contrast (Minimum) AA. Texto a 60 % opacidad sobre `muted-foreground` no llega a 4.5:1. PRODUCT.md línea 49: *"High contrast ratios critical — outdoor/sunlight usage is common"*. Esta es **la regla más explícita del producto** y se viola en la pantalla de confirmación de reserva.
- **Recommendation:** subir a `text-muted-foreground` plano (sin /60) o, si hace falta tono más bajo, definir un token `text-muted-foreground-2` validado para AA.

### B.1.2 [P0] `aria-busy="false"` en `<button>`
- **Location:** `<button aria-label="Enviar solicitud de reserva por WhatsApp" aria-busy="false">` (BookingWizardMobile.tsx:249).
- **Code/Impact:** `aria-busy` solo se permite en role `application`, `composite`, `region`, `scrollbar`, `select`, `progressbar`, `searchbox` y un pequeño set más. **NO en `button`**. Lighthouse lo reporta como `aria-prohibited-attr`.
- **WCAG:** SC 4.1.2.
- **Recommendation:** quitar `aria-busy` del botón. Si se quiere anunciar "enviando…", añadir `<div role="status" aria-live="polite">` que cambie a "Enviando solicitud…" cuando `isSubmitting === true`.

### B.1.3 [P0] Heading order roto h2 → h4
- **Location:** dialog title h2 "PETICIÓN DE RESERVA" → step 4 h2 "Personaliza tu experiencia" → h4 "Todo incluido en tu precio". Salta h3.
- **Impact:** SC 1.3.1 Info and Relationships + AAA SC 2.4.10. Screen readers no pueden navegar por outline.
- **Recommendation:** bajar h4 a h3, o promover el bloque "RESUMEN DE TU RESERVA" a h3 visible.

### B.1.4 [P0] Focus inicial cae en Close
- **Location:** `useBookingModal.tsx` Dialog (Radix) y `BoatQuizModal.tsx` Dialog. Verificado runtime: tras abrir el booking dialog, `Close button` queda con `focusable focused`.
- **Impact:** SC 2.4.3 Focus Order. Radix por defecto lleva el foco al primer focusable; en estos dialogs, el primer focusable visible es el botón de cierre (top-right). El usuario que presione Enter sin querer cierra el modal.
- **Recommendation:** `autoFocus` en el primer input/heading del step actual, o `<Dialog.Content onOpenAutoFocus={(e) => { e.preventDefault(); headingRef.current?.focus(); }}>`.

### B.1.5 [P0] Submit button label-content mismatch
- **Location:** mobile step 4 — `<button aria-label="Enviar solicitud de reserva por WhatsApp">…</button>` con texto visible distinto. Lighthouse `label-content-name-mismatch`.
- **Impact:** voice control users que dicen "Enviar" no encuentran el botón porque la primera palabra del aria-label coincide pero el texto visible empieza con otra palabra.
- **Recommendation:** alinear: si el visible es "Enviar petición", el aria-label debe empezar con "Enviar petición…".

### B.1.6 [P1] Inconsistencia mobile vs desktop en boat selection
- **Location:** mobile BookingWizardMobile.tsx:341-352 (`role="radio"` + `aria-checked` + `role="radiogroup"`) vs desktop BookingFormDesktop.tsx:394-401 (plain `<button>` + `disabled` HTML).
- **Impact:** mismo control conceptual, dos implementaciones. Tests automáticos rotan; usuarios con misma a11y stack se llevan experiencias distintas.
- **Recommendation:** unificar como `<button role="radio" aria-checked={...}>` en ambos. Quitar `disabled` HTML — usar `aria-disabled` si hace falta señalar bloqueo.

### B.1.7 [P1] Boats no recomendados quedan `<button disabled>` en step 1 desktop
- **Location:** BookingFormDesktop.tsx step 1 — verificado runtime: tras venir del quiz, los 4 barcos no recomendados están en `disabled: true` HTML real.
- **Impact:** affordance rota. El usuario que tras el quiz cambia de opinión y quiere otro barco no puede — tiene que cerrar el dialog y volver al quiz. El botón Atrás del wizard solo lo lleva al step 1, donde sigue todo deshabilitado.
- **Recommendation:** preseleccionar el barco recomendado pero permitir cambio. Mostrar el resto disponibles con un visual "Recomendado para ti" sobre el preseleccionado.

### B.1.8 [P2] Touch targets <44 px
- **Location:**
  - Prefix dropdown items: `p-2.5` (mobile, BookingWizardMobile.tsx:715) y `p-2` (desktop, BookingFormDesktop.tsx:968). 24-32 px.
  - License filter buttons: `py-3` mobile / `py-2.5` desktop. 36-40 px.
  - Boat selection: `p-3` ambos. 36-40 px.
  - Duration buttons: `py-3 px-2` desktop. 36-40 px.
  - Code input + validate button: `py-2.5` desktop. ~38 px.
  - "Modificar" link en review summary: `text-xs` sin `min-h`. ~24 px.
- **Recommendation:** auditar con regla "todos los interactivos públicos `min-h-11`". Aplicar de raíz al `Button` shadcn (ya está hecho según DESIGN.md:194 — Decisión 2026-05-03). Faltan los componentes que NO usan `Button`.

### B.1.9 [P2] Validation error genérico sin live region
- **Location:** "Este campo es obligatorio" inline en step 2.
- **Impact:** se renderiza inline pero no se anuncia. `aria-live` está en el contenedor del step (BookingWizardMobile.tsx:187-188) pero el error aparece dentro de un sub-render que puede no disparar el anuncio.
- **Recommendation:** envolver los mensajes de error en `<p role="alert">` o `<p aria-live="polite">` propios.

## B.2 — Theming (sección con más violaciones)

### B.2.1 [P1] Colores Tailwind hardcoded en lugar de tokens
| Color | Token correcto (DESIGN.md) | Usos |
|-------|---------------------------|------|
| `text-red-500` | Signal Red `#bf1a1a` | BookingFormWidget.tsx:378, 426, 455, 477, 491, 560, 602, 651, 675, 743, 768. BookingFormDesktop.tsx:375, 512, 545, 610, 646, 919, 932, 989, 1003, 1062. |
| `border-red-400` | Signal Red border | BookingFormDesktop.tsx:126 (constante `inputError`) |
| `text-green-700 bg-green-50` | Sea Green | BookingWizardMobile.tsx:538. BookingFormDesktop.tsx:590. |
| `text-amber-600` | Amber Popular | BookingWizardMobile.tsx:550. BookingFormDesktop.tsx:596. |
| `text-green-600` | Sea Green | BookingWizardMobile.tsx:879. BookingFormDesktop.tsx:1093. |
| `bg-green-100 text-green-700`, `bg-orange-100 text-orange-700` | Sea Green / Amber | BookingWizardMobile.tsx:975-976. BookingFormDesktop.tsx:1088-1089. |
- **Impact:** dark mode roto (los Tailwind defaults no cambian con `--cta-dark`). Cualquier rebranding requiere find-and-replace masivo.
- **Recommendation:** definir tokens semánticos en `tailwind.config.ts` y usarlos. Migrar incrementalmente.

### B.2.2 [P1] Decorative shadow at rest
- **Location:**
  - BookingWizardMobile.tsx:696 — prefix dropdown `shadow-lg` (sin estado hover).
  - BookingFormDesktop.tsx:711 — pack buttons `shadow-md` al estar selected.
  - BookingFormDesktop.tsx:954 — prefix dropdown `shadow-lg` (sin estado hover).
- **Impact:** viola la **Earned Depth Rule** (DESIGN.md:184). Dropdowns y pack buttons están en estado reposo.
- **Recommendation:** quitar shadow al reposo. Solo `shadow-sm` en `:hover`/`:focus-visible`.

### B.2.3 [P1] Gradient en pack buttons
- **Location:** BookingFormDesktop.tsx:711 — `bg-gradient-to-br from-cta/55 via-cta/25 to-foreground/15`.
- **Impact:** DESIGN.md:286 Don't list: "Don't use gradient text" + filosofía de paleta restrained. Los pack buttons son interactivos, no decorativos — el gradiente confunde sobre cuál es el estado activo.
- **Recommendation:** sustituir por el patrón "borde fino de color + badge superpuesto" descrito en DESIGN.md:218-230. Background plano `bg-cta/5` o `bg-warm-card`.

### B.2.4 [P2] Step labels en CAPS LOCK con `uppercase`
- **Location:** "RESUMEN DE TU RESERVA", "TU PRECIO", "CONFIRMA TU RESERVA", "ENVIAR PETICIÓN" en desktop. Mismo patrón mobile.
- **Impact:** legibilidad reducida en castellano (especialmente con `ñ`, tildes). Tipografía Clash Display ya es geométrica y confiada — el uppercase añade ruido sin valor.
- **Recommendation:** Title case ("Resumen de tu reserva") + tipografía `font-heading font-semibold`. Mantener uppercase solo en badges chiquitos (DESIGN.md:204) — no en headers de sección.

## B.3 — Responsive

### B.3.1 [P2] `text-[9px]` y `text-[10px]` en desktop
- **Location:** BookingFormDesktop.tsx — verificado runtime en step 4: `<p class="text-[10px] text-muted-foreground/60">` (×4) y `<p class="text-[9px] ...">`.
- **Impact:** baseline de DESIGN.md es 0.75 rem (12 px) para `label`, 1 rem (16 px) para `body`. 9-10 px solo se justifica en labels muy auxiliares — y aquí coincide con `text-muted-foreground/60` (B.1.1) duplicando la violación.
- **Recommendation:** subir a `text-xs` (12 px) mínimo.

### B.3.2 [P3] Time slots en lista plana de 21 entradas
- **Location:** BookingFormWidget.tsx:27-31 — `TIME_SLOTS` 08:00 → 18:00 cada 30 min.
- **Impact:** combobox con 21 opciones es alto en móvil y obliga a scrollear. Cognitive load: el usuario casi siempre quiere mañana o tarde, no 11:30.
- **Recommendation:** dividir en grupos visuales ("Mañana 08-13" / "Tarde 13-18") o ofrecer atajos rápidos ("Mañana / Mediodía / Tarde").

## B.4 — Anti-patterns

### B.4.1 [P1] Smooth-scroll en step change (mobile)
- **Location:** BookingWizardMobile.tsx:138 — `scrollTo({ behavior: 'smooth' })` tras cambiar step.
- **Impact:** DESIGN.md:115 — *"GPU-composited motion only. Transform and opacity. Nothing else animates."* Smooth scroll es animación de `scrollTop` (layout). Además, en pantallas con `prefers-reduced-motion` puede provocar mareo.
- **Recommendation:** scroll instantáneo (`behavior: 'instant'`) o sustituir por animación de `transform: translateY()` del contenedor, respetando reduced-motion.

### B.4.2 [P2] Badge "MÁS POPULAR" / "Mejor valor" dentro del label del button
- **Location:** Step 2, duration buttons. Verificado runtime: aria-label dice `"4 horas · Media día MÁS POPULAR 34/hora · 9/persona 135€"` — todo en un solo string.
- **Impact:** screen reader lee el badge como parte del nombre del botón, en mayúsculas. Voice control falla porque "Cuatro horas" no coincide con el comienzo del label.
- **Recommendation:** badge separado vía `<span class="sr-only">Más popular: </span>` o usar `aria-describedby` que apunte al badge.

### B.4.3 [P1] 3 499 LOC duplicadas mobile/desktop
- **Location:** BookingWizardMobile.tsx (1 103) + BookingFormDesktop.tsx (1 147) + BookingFormWidget.tsx (1 249, ~95 % del cual es state shared).
- **Impact:** mantenimiento. Cualquier bugfix hay que hacerlo dos veces. Las divergencias detectadas (color tokens, ARIA roles, easing) son síntomas, no causas.
- **Recommendation:** extraer steps a componentes mobile-agnostic + un thin layout layer mobile/desktop. Patrón sugerido: `<BookingStep1Boat layout={isMobile ? 'stack' : 'grid-2col'} />`.

### B.4.4 [P2] 65 props vía `sharedProps` object
- **Location:** BookingFormWidget.tsx:1142-1208 — un objeto con 65 keys spreaded a hijos.
- **Impact:** prop drilling extremo, debugging difícil, props "lost" si se renombra una.
- **Recommendation:** Context provider para state derivado (selección actual, validación, hold timer). Mantener handlers como props si se quiere claridad de control flow.

## B.5 — i18n

### B.5.1 [P1] Date format con mes hardcoded en español
- **Location:** verificado runtime en `/de/` — fecha aparece como `"09 may 2026"` (mes "may" español, abreviatura de mayo). Probable fuente: BookingFormDesktop.tsx:836-837 o equivalente — uso de `LOCALE_MAP` parcial o de `formatDate` con locale fijo.
- **Impact:** usuarios alemanes ven "may" en lugar de "Mai", franceses verían "may" en lugar de "mai" (con letra minúscula). Se rompe la promesa multilingüe.
- **Recommendation:** usar `Intl.DateTimeFormat(language, {...})` con `language` viniendo de `useLanguage()`. Verificar `LOCALE_MAP` (BookingWizardMobile.tsx:775-778) y reemplazarlo por el patrón Intl.

### B.5.2 [P1] Hardcoded Spanish strings en JSX
- **Location:** BookingFormWidget.tsx:272, 273, 1094, 1095 (toast errors). BookingWizardMobile.tsx:410 (`'Tu viaje en {boat}'`), 485 (`" - Reservado"`). BookingFormDesktop.tsx:540 (`" - Reservado"`), 682-685 (`"No hay extras disponibles para este barco."`, `"Puedes continuar al siguiente paso."`).
- **Impact:** strings que se ven solo en errores o en condiciones específicas no traducidos. Usuario alemán que tiene un fallo de red ve un toast en español.
- **Recommendation:** migrar al sistema `t.*` y propagar.

### B.5.3 [P3] "h" suffix en time slots
- **Location:** BookingFormWidget.tsx:27-31 — `"08:00h"`, `"08:30h"`, etc.
- **Impact:** convención española. En inglés se usa "08:00 AM" o "20:00", no "08:00h".
- **Recommendation:** localizar el suffix vía `t.booking.timeSuffix`.

## B.6 — Performance

### B.6.1 [P3] Step components no memoizados
- **Location:** BookingWizardMobile.tsx Step1Boat, Step2Trip, Step3PersonalData, Step4Confirm. BookingFormDesktop.tsx idem.
- **Impact:** cada cambio de state (input typing, dropdown abierto) re-renderiza todos los steps que están en el árbol aunque no sean visibles.
- **Recommendation:** `React.memo` en cada step component + `useCallback` en los handlers que se les pasan.

---

# Hallazgos compartidos (sistémicos)

## C.1 [P0] Sistema i18n violado en ambos wizards
- **Quiz:** tabla de traducciones dentro del componente, solo es/en.
- **Booking:** strings dispersos en JSX y en mensajes de toast/error.
- **CLAUDE.md** (proyecto-wide rule): *"nunca añadir texto visible al usuario directamente en JSX/JSON-LD; siempre meterlo primero en `es.ts`"*.
- **Recommendation:** migración orquestada. Crear `t.boatQuiz.*` (~25 claves) y `t.booking.errors.*` (~6 claves) en `es.ts`, ejecutar `npm run i18n:translate`, eliminar fuentes hardcoded.

## C.2 [P1] Focus inicial sistemático en Close
- Patrón Radix por defecto en ambos dialogs (quiz y booking). Documentado en B.1.4. Aplica también al quiz.
- **Recommendation:** crear un util `useDialogInitialFocus(ref)` y aplicarlo en los dos.

## C.3 [P1] Progress indicator implementado 3 veces
- Quiz: 3 div decorativos sin ARIA (`BoatQuiz.tsx:212-216`).
- Mobile booking: `BookingProgressBar` con role + aria correcto.
- Desktop booking: distinto layout, mismo `BookingProgressBar`.
- **Recommendation:** un único `<WizardProgress total={N} current={i} labels={[...]} />` reusable.

## C.4 [P2] CLAUDE.md desactualizado: "8 steps" del booking
- **Location:** `CLAUDE.md` línea 54 — *"Booking flow split en 8 steps"*.
- **Realidad:** el wizard activo (BookingFormWidget) tiene 4 steps. El "8 steps" probablemente refería al `booking-flow/` directory que tiene 8 ficheros pero NO es lo que el Hero abre.
- **Recommendation:** corregir CLAUDE.md a *"BookingFormWidget: 4 steps (barco / viaje / datos / confirmar)"*.

## C.5 [P2] Dead code en `booking-flow/`
- **Location:** `client/src/components/booking-flow/BookingStepExtras.tsx`, `BookingStepTime.tsx`, `BookingStepCustomer.tsx`. Verificado: no hay importadores fuera de su propio archivo.
- **Impact:** confusión para nuevos contributors. Tree shake debería eliminarlos del bundle, pero el ruido en el repo persiste.
- **Recommendation:** borrar estos 3 archivos.

---

# Patterns & Systemic Issues

1. **Dos sistemas de tokens conviviendo:** los tokens de DESIGN.md están definidos pero no se usan en los componentes nuevos del booking. Cada vez que alguien añade UI, mete `red-500`/`green-X`/`amber-X` directamente. Necesita un linter (Stylelint plugin o ESLint custom rule) que prohíba Tailwind defaults para `red-*`/`green-*`/`amber-*`/`blue-*` en componentes.
2. **Mobile y desktop como ramas paralelas:** el patrón "useIsMobile() ? <Mobile/> : <Desktop/>" lleva a duplicación masiva. Un equipo de 2 personas no puede mantener esto. Patrón "una sola implementación + responsive tokens" es más sostenible.
3. **i18n como afterthought:** el `i18n-translate` script existe (CLAUDE.md:120-128), pero los componentes nuevos siguen sin usarlo. El pre-commit hook `i18n:validate` no captura strings hardcoded en JSX (sólo verifica que `es.ts` esté completo en otros idiomas). Necesita un hook nuevo: detect Spanish strings in JSX.
4. **Radix dialogs sin focus initial fijo:** dos sitios reproducen el mismo bug. Util compartido pendiente.
5. **Lighthouse CI ausente:** estos hallazgos a11y se hubieran capturado con `lhci` en GitHub Actions. Las prácticas del proyecto incluyen `npm run check:all` pero no a11y runtime.

---

# Positive Findings (para mantener)

- ✅ **Lazy loading del booking modal** (`useBookingModal.tsx:18`) — el bundle del booking (1 250 LOC) no entra en el initial.
- ✅ **`useMemo` abundante** en los flujos críticos (BookingFormWidget tiene 9 `useMemo` para precios derivados, time slot Sets, mapas de duración).
- ✅ **GPU-composited motion** mayoritario — `transform`, `opacity`, `animate-pulse`, `animate-spin`. Salvo el smooth-scroll de B.4.1, no hay layout animations.
- ✅ **Honeypot field** anti-spam (BookingFormWidget.tsx:1227) con `tabIndex={-1}`.
- ✅ **SessionStorage persistence con TTL** (30 min, BookingFormWidget.tsx:142). Recupera state si el usuario cierra el tab por accidente.
- ✅ **Hold timer para barcos con licencia** — UX honesta: "te reservamos por 15 min mientras completas".
- ✅ **`aria-live` en step content wrapper** (BookingWizardMobile.tsx:187-188) — los cambios de step se anuncian.
- ✅ **`aria-required` + `aria-describedby`** linking errors en form fields del booking — patrón correcto, solo falta en algunos campos (date, time).
- ✅ **`role="form"` + `aria-label`** en mobile (BookingWizardMobile.tsx:155) — semantic correcto.
- ✅ **Framer Motion en desktop** con `transform`, `opacity` y `filter: blur()` — todos GPU. Easing `easeInOut` 300 ms — alineado con DESIGN.md.

---

# Anexos

## Anexo A — Hardcoded strings → migrar a `client/src/i18n/es.ts`

| Origen | Tipo | Clave i18n sugerida |
|--------|------|---------------------|
| BoatQuizModal.tsx:17 | `<DialogTitle>` "Boat Quiz" | `t.boatQuiz.dialogTitle` |
| BoatQuiz.tsx:20-74 | Tabla `QUIZ_TRANSLATIONS` (es/en, 13 keys × 2 = 26 strings) | `t.boatQuiz.{title, subtitle, q1, q1options[], q2, q2options[], q3, q3options[], result, bestMatch, alsoConsider, bookNow, viewDetails, back, restart, people}` |
| BoatQuiz.tsx:113-135 | Tabla `getReasonText` (es/en, 8 boats × 2 = 16 strings) | `t.boatQuiz.reasons.{boatId}` |
| BookingFormWidget.tsx:272-273 | Toast "Error al validar codigo" / "No se pudo verificar el codigo de descuento. Intentalo de nuevo." | `t.booking.errors.codeValidation.{title, description}` |
| BookingFormWidget.tsx:1094-1095 | Toast "Error al guardar consulta" / "Tu solicitud de WhatsApp fue enviada, pero no pudimos registrarla internamente." | `t.booking.errors.inquirySave.{title, description}` |
| BookingWizardMobile.tsx:410 | `'Tu viaje en {boat}'` fallback | `t.booking.steps.trip.heading` |
| BookingWizardMobile.tsx:485, BookingFormDesktop.tsx:540 | `' - Reservado'` | `t.booking.timeSlot.reservedSuffix` |
| BookingFormDesktop.tsx:682-685 | "No hay extras disponibles para este barco." / "Puedes continuar al siguiente paso." | `t.booking.extras.empty.{title, description}` |
| BookingFormWidget.tsx:27-31 | `TIME_SLOTS` con suffix "h" | `t.booking.timeSuffix` |

Estimación: ~58 strings nuevos en `es.ts`. Tras `npm run i18n:translate` se propagan a en/ca/fr/de/nl/it/ru.

## Anexo B — Dead code candidate

| Archivo | Razón | Acción |
|---------|-------|--------|
| `client/src/components/booking-flow/BookingStepExtras.tsx` | No tiene importadores fuera de sí mismo | Borrar |
| `client/src/components/booking-flow/BookingStepTime.tsx` | Idem | Borrar |
| `client/src/components/booking-flow/BookingStepCustomer.tsx` | Idem | Borrar |

(Confirmar antes de borrar: `grep -rn "BookingStepExtras\|BookingStepTime\|BookingStepCustomer" client/ shared/ server/`.)

## Anexo C — Discrepancia CLAUDE.md vs realidad

- **CLAUDE.md línea 54:** "Booking flow split en 8 steps".
- **Realidad:**
  - `BookingFormWidget` (lo que abre el Hero): 4 steps (barco / viaje / datos / confirmar).
  - `booking-flow/index.tsx` (montado en `App.tsx:199`, ruta separada): 3 steps (Tu plan / Tus datos / Confirmar).
- **Acción:** corregir CLAUDE.md para distinguir los dos wizards y sus tamaños reales.

## Anexo D — Tabla resumen Lighthouse a11y

| Test | Mobile (step 4) | Desktop (step 2) |
|------|-----------------|------------------|
| Accessibility score | 90 / 100 | 92 / 100 |
| `aria-prohibited-attr` | FAIL (1 elemento: button con aria-busy) | FAIL (1 elemento: button con aria-busy) |
| `color-contrast` | FAIL (10+ elementos con `text-muted-foreground/60`) | FAIL (8+ elementos con `text-muted-foreground/60` + tamaños text-[9px]/[10px]) |
| `heading-order` | FAIL (h2 → h4) | PASS |
| `label-content-name-mismatch` | FAIL (button WhatsApp) | PASS |
| `aria-required-attr`, `aria-valid-attr-value`, `button-name`, `dialog-name`, `link-name` | PASS | PASS |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

Reports: `screenshots/2026-05-04-wizards/report.json` (mobile step 4, último), `lighthouse-desktop-step2.json` (desktop step 2).

---

# Recommended Actions

Comandos `/impeccable` propuestos en orden de severidad. Cada uno se puede pedir uno-a-uno (o todos juntos, si quieres autonomía). El skill `/impeccable` admite los siguientes sub-comandos relevantes aquí:

1. **[P0] `$impeccable harden`** — migrar i18n de los dos wizards (Anexo A), arreglar `aria-busy`, heading-order, focus inicial y label-content-name-mismatch. (Findings A.1.1, A.3.1-3, B.1.1-5, C.1)
2. **[P0] `$impeccable colorize`** — sustituir `red-500`/`green-X`/`amber-X` por tokens DESIGN.md y reparar contraste de `text-muted-foreground/60`. (B.2.1, B.1.1)
3. **[P1] `$impeccable distill`** — quitar gradientes y shadows al reposo de pack buttons + dropdowns. Sustituir por el patrón "borde fino + badge" de DESIGN.md:218. (B.2.2, B.2.3)
4. **[P1] `$impeccable adapt`** — unificar mobile/desktop boat selection (radio en ambos), eliminar `<button disabled>` de barcos no recomendados, abrir modales fullscreen en mobile (ya hecho en booking, falta en quiz). (B.1.6, B.1.7, A.1.6)
5. **[P2] `$impeccable typeset`** — quitar uppercase de section headers, subir `text-[9px]/[10px]` a `text-xs`. (B.2.4, B.3.1)
6. **[P2] `$impeccable critique`** — revisión UX de la duplicación mobile/desktop (3 499 LOC) y de los 65 props de prop drilling. Propondría refactor estructural. (B.4.3, B.4.4)
7. **[P3] `$impeccable polish`** — pasada final tras los anteriores. Animaciones del quiz (A.5.1), agrupar time slots (B.3.2), memoizar steps (B.6.1).

> Puedes pedirme estos uno a uno, todos juntos, o en el orden que prefieras.
>
> Re-ejecuta `/impeccable` audit tras los fixes para ver el score subir.
