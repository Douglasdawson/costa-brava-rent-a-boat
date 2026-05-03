# Decisiones cruzadas de diseño — 2026-05-03

**Contexto**: tras la auditoría del 2026-05-03 (`design-critique.md` + `design-audit.md`) detectamos 4 patrones que se repetían en varias superficies. En lugar de re-litigarlos en cada sesión de polish, se tomaron decisiones binding como apéndice. Las sesiones 3-7 las consumen sin re-discusión.

---

## Decisión 1 — Focus outline color

**Pregunta**: el CSS real (`client/src/index.css:175-179`) aplica `outline: 2px solid hsl(var(--cta))` (navy), pero `DESIGN.md` §5 Buttons decía "Focus: 2px solid teal ring". ¿Cuál es el sistema?

**Opciones consideradas**:

- A) Mantener navy (CSS actual), actualizar DESIGN.md.
- B) Cambiar CSS a teal (`var(--ring)`) como dice spec.
- C) Mixto: navy en pointer, teal en keyboard (`:focus-visible`).

**Decisión**: **A** — navy.

**Motivo**: coherente con el principio de paleta restringida ("un solo color de commitment" en DESIGN.md §2 The Salt Palette). El navy contrasta bien sobre fondos blancos y warm-card, los dos contextos dominantes del site. Cero cambio de código; solo ajuste de spec. La opción C era over-engineering para un beneficio marginal.

**Findings que resuelve**:

- `design-audit.md#token-drift` — punto 1 del drift CSS vs DESIGN.md.

**Aplicación**: ya implementada vía edición de `DESIGN.md` §5 Buttons.

---

## Decisión 2 — Cómo destacar cards "recomendadas" sin shadow

**Pregunta**: la Earned Depth Rule prohíbe `shadow-md`/`shadow-lg` al reposo, pero hay 3 superficies que necesitan señalar una card destacada (BoatCard recommended, Booking duration "Mejor valor", Pricing tier futuro). ¿Qué patrón canónico sustituye al shadow?

**Opciones consideradas**:

- A) Borde fino + badge superpuesto (`border-2 border-cta` + chip "Recomendado").
- B) Solo tinte de fondo (`bg-cta/5`).
- C) Solo badge, card neutra.
- D) Mantener shadow y documentar excepción.

**Decisión**: **A** — borde fino + badge superpuesto.

**Motivo**: señal arquitectónica fuerte (visible al primer vistazo) sin requerir relayout ni competir con la fotografía. La opción B (tinte solo) corre riesgo de invisibilidad bajo sol — PRODUCT.md exige "móvil bajo el sol". La C (solo badge) es minimalista pero la card no se "siente" cliqueable. La D abre la puerta a más excepciones por reflejo.

**Findings que resuelve**:

- `design-critique.md#fleet` — alta: BoatCard recomendado con `shadow-md` al reposo.
- `design-critique.md#fleet` — alta: badges popular/recommended con `shadow-md`.
- `design-critique.md#patrones-cruzados` — patrón #2 (Earned Depth en cards destacadas).

**Aplicación**: spec documentada en `DESIGN.md` § "Cómo destacar sin shadow". Implementación en BoatCard pendiente (sesión 5: Fleet polish).

---

## Decisión 3 — Política de `Button size="sm"`

**Pregunta**: el componente `Button` con `size="sm"` produce 36 px de altura, debajo del touch target WCAG AA de 44 px. Aparece en 5 superficies: BoatCard Book button, Pricing desktop reserve, BookingStepPersonalize ±/–, Footer email, FleetSection view-toggle.

**Opciones consideradas**:

- A) Redefinir `sm` a `min-h-11` (44 px) globalmente.
- B) Prohibir `sm` en superficies públicas; permitir solo en CRM admin.
- C) Mantener `sm` y cambiar caso por caso los flagged.

**Decisión**: **A** — redefinir globalmente.

**Motivo**: un único cambio en `client/src/components/ui/button.tsx` arregla los 5 sitios sin tocarlos. Reduce padding interno (`px-3 → px-4`) para mantener proporción visual. El CRM admin (30 usos de `sm`) recibe el cambio sin riesgo: sus botones también se benefician del touch target en laptops touch. Las opciones B y C dejan la trampa abierta para futuras regresiones.

**Findings que resuelve**:

- `design-audit.md#fleet` — alta: BoatCard Book button <44 px.
- `design-audit.md#pricing` — alta: desktop table reserve `size="sm"` 36 px.
- `design-audit.md#booking-flow` — baja: counter ±/– `h-9` (36 px).
- `design-audit.md#home` — alta: Footer newsletter input <44 px (este se cierra en sesión 3, no por `sm`).
- `design-audit.md#patrones-cruzados` — patrón #2 (touch targets sistemáticos).

**Aplicación**: implementada en `client/src/components/ui/button.tsx:29` (`min-h-11 rounded-full px-4 text-xs`).

**Verificación pendiente**: capturar screenshot de un tab CRM denso (Bookings o Calendar) en sesión 3 para confirmar que el cambio no rompe densidad. Si rompe, ajustar padding interno.

---

## Decisión 4 — Enforcement de hardcoded Spanish

**Pregunta**: 5/5 superficies tienen al menos un string en español inline en JSX (no via `t.X`). La auditoría detectó 1.608 violaciones reales (más que las ~7 esperadas inicialmente — la deuda histórica es mayor). ¿Cómo paramos la sangría sin obligar a fix-all-now?

**Opciones consideradas**:

- A) Lint check como `error` en `npm run check:all`, con allowlist baseline de 1.608 entradas.
- B) Lint como `warn` (visible pero no blocker).
- C) Disciplina manual + revisión humana en PRs.
- D) Solo arreglar los flagged ahora, sin enforcement.

**Decisión**: **A** — lint como `error` con allowlist baseline.

**Motivo**: la deuda crece con cada commit nuevo si no hay gate automatizado. La opción C es como hemos llegado aquí. La B (warn) se ignora. La D no resuelve el patrón. La allowlist hace el cambio aceptable: snapshot del estado actual; las nuevas violaciones se bloquean. La deuda histórica se cierra incrementalmente — cada sesión de polish elimina líneas de la allowlist al fixar.

**Findings que resuelve**:

- `design-audit.md#patrones-cruzados` — patrón #1 (hardcoded Spanish en 5/5).
- Inventario completo: ver tabla en `design-audit.md` y la allowlist generada.

**Aplicación**: implementada vía:

- `scripts/check-no-hardcoded-spanish.ts` (heurística + dedupe por sha1 del string)
- `scripts/check-no-hardcoded-spanish.allowlist.txt` (1.608 entradas baseline)
- `package.json` — script `check:i18n-hardcode` wireado en `check:all`

**Heurística** (resumen): string >15 chars, contiene ≥2 palabras españolas comunes (o 1 si len >30), no es URL/email/path/hex/identifier. Excluye `client/src/i18n/`, tests, `lib/translations.ts`, `CondicionesGenerales.tsx` (legal Spanish-only por diseño), `HomePageSEO.tsx` (SEO per-language hardcoded).

**Falsos negativos conocidos**: legal copy en `CondicionesGenerales` (intencional, excluido). SEO meta hardcoded por idioma (intencional, excluido).

**Falsos positivos esperados** (~10-50 entradas en la allowlist): identificadores SEO largos, brand names. Conviene revisar la allowlist y purgar entradas que no son español genuino, pero no es bloqueante.

---

## Convención de aplicación a futuro

Cada sesión de polish (3-7) consume estas decisiones:

1. **Sesión 3 — Home polish**: aplica decisión 1 (DESIGN.md ya actualizado), decisión 3 (Button sm beneficia automáticamente FleetSection toggles + Footer input).
2. **Sesión 4 — Boat detail polish**: aplica decisión 2 (si el sticky CTA o las duration cards necesitan destacar).
3. **Sesión 5 — Fleet polish**: aplica decisión 2 (refactor de BoatCard recommended).
4. **Sesión 6 — Pricing polish**: aplica decisión 2 (tier destacado), decisión 3 (botón sm desktop ya beneficiado).
5. **Sesión 7 — Booking flow polish**: aplica decisión 2 (duration "Mejor valor"), decisión 3 (counter ±/–).

A medida que cada sesión migra strings españolas hardcoded a `t.X`, **elimina las líneas correspondientes de la allowlist**. La meta es vaciarla completamente al cierre de sesión 7 y cerrar la deuda i18n del top 5.

---

## Decisiones que NO se tomaron (deferred)

Pendientes para sesiones futuras o ciclo siguiente:

- **Inputs `rounded-lg` vs `rounded-md`**: drift menor, decisión cuando se toquen los formularios en sesión 4 (Boat detail) o 7 (Booking flow).
- **Backdrop-blur exception fuera de Navigation**: caso a caso (Boat detail hero pill) en sesión 4.
- **Sticky CTA shadow estructural**: caso a caso (Boat detail) en sesión 4.
- **`Intl.NumberFormat` para currency**: en sesión 6 (Pricing) si se decide.
- **Borrar archivos legacy de booking-flow** (`BookingStepBoat.tsx`, etc.): en sesión 7.
