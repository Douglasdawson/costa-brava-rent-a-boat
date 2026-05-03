# Auditoría de diseño — críticas UX y heurísticas

**Fecha**: 2026-05-03
**Alcance**: 5 superficies públicas (Home, Booking flow, Fleet, Pricing, Boat detail)
**Metodología**: pase `$impeccable critique` — comparación contra `PRODUCT.md` (register `brand`, "The Salt Memory") y `DESIGN.md` (Named Rules)
**Doc complementario**: `2026-05-03-design-audit.md` (chequeos técnicos)

---

## Resumen ejecutivo

| Superficie | Alta | Media | Baja | Total |
|---|---|---|---|---|
| Home | 1 | 4 | 1 | 6 |
| Booking flow | 3 | 4 | 1 | 8 |
| Fleet | 4 | 3 | 1 | 8 |
| Pricing | 1 | 3 | 1 | 5 |
| Boat detail | 1 | 4 | 1 | 6 |
| **Total** | **10** | **18** | **5** | **33** |

**Severidad alta** = viola un ban absoluto, rompe principio nuclear de PRODUCT.md, o tono/copy contradice el modelo de negocio.

**Patrones cruzados** (ver sección final): One Action Rule violado en 4/5 superficies; Earned Depth violado en 3/5; tono "transactional vs. conversational" inconsistente entre Home y Payment step.

---

## Token drift (DESIGN.md vs CSS real)

Antes de leer las superficies, tres derivas del CSS real (`client/src/index.css`) frente a lo declarado en `DESIGN.md`:

1. **Focus outline color** — CSS aplica `outline: 2px solid hsl(var(--cta))` (navy), pero DESIGN.md §5 Buttons dice "Focus: 2px solid teal ring". Decidir: ¿el sistema real es navy y DESIGN.md miente, o teal y el CSS está mal? Recomendación: navy real es más coherente con la paleta restringida; actualizar DESIGN.md.
2. **Inputs rounded-md vs rounded-lg** — DESIGN.md §5 Inputs dice "rounded-md (8px)", pero `BookingFormDesktop.tsx:125` y otros usan `rounded-lg` (12px). Drift de tokens en componentes de formulario.
3. **`tracking-normal: 0em`** en CSS, pero Display dice `letter-spacing: -0.01em` en DESIGN.md — solo se aplica si el componente fija `tracking-tight`. Verificar Hero.

Estos tres no son bugs por sí mismos; pueden resolverse en un commit "doc/design-tokens-realign".

---

## Home

Entrada: `client/src/App.tsx:144` (`HomePage`). 11 secciones bajo Hero.

### Alta

- **One Action Rule violada en Hero** — `client/src/components/Hero.tsx:98-116`. Dos CTAs navy en el primer viewport ("Find Your Boat" + "View Fleet") sin jerarquía visible: ambos pesan igual. La regla exige ≤2 navy CTAs **y** un primario claro. Recomendación: degradar "View Fleet" a outline o ghost (DESIGN.md §5: "Secondary actions use outline or ghost variants").

### Media

- **Weight Ladder Rule incumplida** — `client/src/components/FleetSection.tsx:358-360`. h2 `font-semibold` (600) con subtítulo `font-light` (300) crea un salto de 300 unidades pero la sensación visual queda pobre porque light pesa demasiado poco para 1.25× del cuerpo. Subir subtítulo a `font-normal` (400) o variar tamaño.
- **Weight Ladder Rule incumplida** — `client/src/components/ContactSection.tsx:20-24`. h2 `font-semibold` vs subtítulo `text-muted-foreground font-normal`. El paso de peso es correcto, pero el muted color reduce la jerarquía percibida. Subir a `text-foreground` con tamaño claramente menor.
- **Tono editorial vs técnico** — `client/src/components/EditorialMomentSection.tsx`. La sección es la única "editorial" del Home y carga el peso de "Salt Memory". Verificar que la imagen de fondo ocupa ≥80% del viewport; si está cropeada, el momento se pierde.
- **Hardcoded fallback en español** — `client/src/components/FAQPreview.tsx:13-89`. `FALLBACK_ITEMS` con 8 Q&A en español. Aunque el override `t.faqPreview?.items` existe, si algún idioma pierde claves el fallback rompe la experiencia multi-idioma. Migrar a `t.X` puro.

### Baja

- **Trust badges hardcoded** — `client/src/components/Hero.tsx:127, 131, 135`. Literales como `'6+ años de experiencia'` deberían venir de `t.authority.X`. (Nota: este punto es i18n debt; va al audit doc también.)

---

## Booking flow

Entradas: `client/src/components/BookingFlow.tsx` + `client/src/components/booking-flow/`.

**Nota arquitectónica**: el flujo activo son **3 pasos** (Experience → Personalize → Payment), no 8 como sugiere la presencia de archivos `BookingStepBoat/Date/Time/Customer/Extras.tsx`. Esos archivos son legacy no renderizados. Decidir: borrarlos o consolidar el plan de eliminación.

### Alta

- **Tono frío en el último paso** — `client/src/components/booking-flow/BookingStepPayment.tsx:222-227`. El panel de éxito dice "Te abrimos WhatsApp con la solicitud preparada". Es funcional, pero PRODUCT.md §1 dice "voice: confident but never corporate. Like a friend who knows the coast and wants to share it with you." Reescribir hacia: "Te llevamos a WhatsApp. Te respondemos en cuanto leamos tu mensaje" (más cálido, menos transaccional).
- **Nombre del paso confunde** — `BookingStepPayment.tsx`. La página NO procesa pago; envía la solicitud por WhatsApp. El nombre "Payment" en código y la sensación visual de "checkout" contradicen el modelo de negocio (no online payments). Renombrar componente a `BookingStepRequest` y ajustar copy del header.
- **Em dash escrito como `--` en HoldCountdown** — `client/src/components/HoldCountdown.tsx:118`. "Date prisa --" usa doble guión, no em dash Unicode (—). Pero la regla absoluta de DESIGN.md prohíbe **ambos**. Eliminar el guión: "Date prisa".

### Media

- **Back affordance débil en paso 1** — `client/src/components/BookingFlow.tsx:18-23`. El botón Back solo aparece si `step > 1`. En el paso 1 el usuario solo puede cerrar; no hay "volver al barco anterior". Aceptable si el cierre es claro, pero el cierre es una X pequeña en la esquina; agregar un breadcrumb sutil "Cambiar barco" mejoraría el sentido de control.
- **Progress indicator sin labels en móvil** — `client/src/components/booking-flow/BookingProgressIndicator.tsx:34-46`. En móvil solo se ven barras sin nombres de paso. Screen readers oyen "Paso 1 de 3" pero el usuario visual pierde contexto. Agregar el nombre del paso actual como subtítulo.
- **Earned Depth: dropdowns con shadow al reposo** — `client/src/components/booking-flow/BookingStepPersonalize.tsx:350, 443`. Phone prefix y nationality usan `shadow-lg` montados, no en hover/focus.
- **Inconsistencia de redondeo en inputs** — `BookingStepExperience.tsx:129` usa `rounded-xl`, `BookingStepPersonalize.tsx:434` usa `rounded-lg`, time-slot pills `rounded-full`. Drift dentro de la misma superficie. Definir y aplicar `rounded-md` (8 px) para inputs no-pill, `rounded-full` para selectores tipo chip.

### Baja

- **Animación `animate-savings-pulse` en badge "Mejor valor"** — `BookingStepExperience.tsx:267`. Si la animación está bien (es opacity-based; ver `index.css:237-255`), está OK. Verificar que el ciclo (3 repeticiones de 2s) no se sienta agresivo en un paso que pide concentración.

---

## Fleet

Entradas: `client/src/components/FleetSection.tsx` + `client/src/components/BoatCard.tsx` + carrusel + urgency + quiz.

### Alta

- **One Action Rule violada en BoatCard** — `client/src/components/BoatCard.tsx:154-160, 233-241, 242-248`. Cada card tiene 3 zonas interactivas: imagen-link + "View Details" link + "Book" button (navy). En un viewport con 6 cards eso son **18 acciones** competiendo. Reducir a 1 acción primaria por card (Book) + imagen como zona ampliada que también abre detalle, sin link textual separado.
- **Earned Depth: BoatCard recomendado con shadow al reposo** — `BoatCard.tsx:149-153`. Las cards "recommended" reciben `shadow-md ring-1 ring-cta/30`. La regla dice: depth solo en hover/focus/open. Sustituir el shadow por un treatment que NO viole la regla: borde más grueso (`border-cta border-2`), tinte de fondo (`bg-cta/5`), o un icono/badge de "recomendado".
- **Earned Depth: badges con shadow al reposo** — `BoatCard.tsx:170-175, 178-183`. Popular y Recommended badges tienen `shadow-md`. Quitar shadow; los badges son label, no superficie elevada.
- **Sea sells itself violado** — `BoatCard.tsx:170-192`. Tres badges absolutos (popular, recommended, license en top-left + fuel en top-right) ocupan ~20% del top de la imagen. PRODUCT.md §3.1 "the sea sells itself; let photography do the heavy lifting". Reglas para reducir ruido: máximo 1 badge en top-left (la prioridad: recommended > popular > license-free) + el fuel badge se mueve al footer como meta junto a "incl. gasolina".

### Media

- **Touch target del botón Book** — `BoatCard.tsx:242-248`. `px-6 py-2.5` da ~30-34px de altura, por debajo de 44 px. Cambiar a `h-11 px-6` o `py-3`.
- **Animación de la grid-row del checklist** — `FleetSection.tsx:761-787`. La animación de colapso usa `grid-template-rows: 0fr → 1fr`, una propiedad de layout (DESIGN.md ban: "Don't animate CSS layout properties"). Sustituir por `max-height` con `overflow: hidden` + `transition: max-height` o por `transform: scaleY` con `transform-origin: top`.
- **Fake urgency posible** — `client/src/components/AvailabilityUrgency.tsx:143-148`. Si `scarcity.bookedToday === 0` pero `isWeekendDate === true`, muestra un fallback "highDemandWeekend". Eso es urgencia narrativa sin dato real. PRODUCT.md exige "no surprises, transparente". Quitar el fallback: si no hay reservas reales hoy, no mostrar nada.

### Baja

- **DialogTitle visualmente oculto en BoatQuizModal** — `client/src/components/BoatQuizModal.tsx:16-18`. Radix Dialog requiere DialogTitle accesible; `VisuallyHidden` cumple a11y, pero pierde un anchor visual. Considerar título visible "¿Qué barco te encaja?".

---

## Pricing

Entrada: `client/src/pages/pricing.tsx` (i18n vivo via `t.pricingPage`).

### Alta

- **Em dash en string i18n** — `client/src/i18n/es.ts:2869`. `portAccessible: 'Puerto de Blanes — accesible desde'`. Regla absoluta de DESIGN.md: "Don't use em dashes in copy". Sustituir por dos puntos o coma: `'Puerto de Blanes: accesible desde'`. Verificar las 7 traducciones — si vienen del `npm run i18n:translate`, tendrán el mismo em dash heredado.

### Media

- **One Action Rule violada en móvil** — `pages/pricing.tsx:514-521 + 581-589`. En la vista móvil (cards apiladas), cada barco renderiza un botón "Reservar" navy + el footer tiene un CTA sticky. Con 3 barcos visibles a la vez = 4 navy CTAs. Soluciones: degradar el CTA por-barco a outline + mantener el footer CTA navy como única acción dominante; o eliminar el CTA del card individual (la fila entera abre el booking modal).
- **Identical card grid (móvil)** — `pages/pricing.tsx:434`. Cards de barcos con `className="bg-background rounded-2xl border border-border p-5"` idéntica. Lo que diferencia es el contenido (precio, capacidad), no el tratamiento. No es ban absoluto si las fotos varían, pero está cerca. Variar densidad (cards más anchos para barcos premium, p.ej. con eslora >5m).
- **Currency formatting concatenado** — `pages/pricing.tsx:68-71`. `formatPrice` concatena `${price}€`. Para 8 idiomas (algunos ponen el símbolo antes), usar `Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' })`. No es bug en castellano, pero rompe la consistencia internacional.

### Baja

- **Hero con gradient sutil** — `pages/pricing.tsx:215`. `bg-gradient-to-br from-primary/5 to-primary/10`. Es sutil y no es "hero-metric template". Aceptable; podría sustituirse por color sólido de la paleta Salt Mist para mayor coherencia con el resto del site.

---

## Boat detail

Entrada: `client/src/components/BoatDetailPage.tsx` + `AvailabilityCalendar` + `HoldCountdown` + `BookingFormDesktop/Widget`.

### Alta

- **One Action Rule violada (4-5 navy CTAs simultáneos)** — `BoatDetailPage.tsx:783, 973, 1368, 1407`. Hero tiene CTA Reserve + card central tiene CTA Book + sticky mobile + sticky desktop sidebar. Si el usuario hace scroll, ve 3 navy CTAs a la vez. Solución: el sticky es la acción persistente; los otros CTAs deben ser outline/ghost que reflujan al sticky. O eliminar el CTA del hero y dejar que el primer CTA aparezca al hacer scroll (sticky).

### Media

- **Earned Depth: gallery card y stickies con shadow al reposo** — `BoatDetailPage.tsx:816 (shadow-lg), 1366 (shadow-lg), 1394 (shadow-xl)`. Los stickies son estructurales (legibilidad sobre contenido scroll), justifica un shadow estructural — pero entonces documentarlo como excepción en DESIGN.md (igual que se documentó el backdrop-blur de Navigation). Para la gallery card: quitar el shadow al reposo, dejar `hover:shadow-lg`.
- **Glassmorphism fuera de Navigation** — `BoatDetailPage.tsx:777`. `backdrop-blur-sm` en pill de precio sobre la imagen del hero. Es legibilidad estructural (texto sobre foto), no decorativo, pero la regla solo exime Navigation. Dos opciones: documentar la excepción o sustituir por una caja sólida con `bg-foreground/80 text-background`.
- **Hardcoded "Blanes, Costa Brava" en h1** — `BoatDetailPage.tsx:772`. Localización hardcoded en el título principal. Mover a `t.boatDetail.locationSuffix`.
- **WhatsApp message hardcoded en español** — `BoatDetailPage.tsx:520`. `"Hola, me interesa el ${boat.name}..."`. Mover a `t.X` con interpolación. Crítico para usuarios ingleses/franceses/alemanes que esperan WhatsApp en su idioma.

### Baja

- **Verificar copy de fuel** — `BoatDetailPage.tsx:947`. La lógica `fuelIncluded = !requiresLicense && !fuelNotIncluded` es correcta, pero confirmar que la string `t.boatDetail.fuelIncluded` dice "Incluye gasolina" y no la negación. (Nota memoria: solo sin-licencia incluye fuel.)

---

## Patrones cruzados (lo que se repite en varias superficies)

### 1. One Action Rule sistemáticamente violada (4/5 superficies)

Home (Hero), Fleet (BoatCard ×n), Pricing (cards + footer), Boat detail (4 navy a la vez).

**Hipótesis raíz**: el componente `Button` con `variant="default"` (que mapea a `bg-cta`) se usa por reflejo siempre que algo es "importante". Falta un patrón de "secondary CTA" claramente outlined/ghost que se use con disciplina.

**Fix transversal**: en sesión 2 (Home polish), establecer una convención local — primer CTA de cada card es `outline`; el sticky/footer CTA es el único `default`. Documentar como Named Rule en DESIGN.md.

### 2. Earned Depth violado en cards "destacadas" (3/5)

Fleet (BoatCard recomendado), Booking flow (dropdowns), Boat detail (gallery + stickies).

**Patrón sospechoso**: el equipo añade `shadow-md`/`shadow-lg` para "destacar" en lugar de usar las herramientas que la paleta ofrece (tinte de fondo, borde de color). El shadow se ha convertido en el comodín.

**Fix transversal**: catálogo de "cómo destacar sin shadow" en DESIGN.md (background tint con `bg-cta/5`, border de color `border-cta`, badge superior).

### 3. Hardcoded Spanish en JSX y en strings i18n (5/5)

Hero (trust badges), FleetSection (WhatsApp), FAQPreview (FALLBACK_ITEMS), BookingStepTime (etiquetas precio), BookingStepPersonalize ("Tarifa especial"), BoatDetailPage (WhatsApp + h1), Pricing (em dash en es.ts).

**Fix transversal**: lo cubre el audit doc con prioridad. La deuda i18n ya está documentada en CLAUDE.md, pero el goteo continúa. Considerar un lint check (`scripts/check-no-hardcoded-spanish.ts`) que falle CI si encuentra strings ASCII largas dentro de JSX en componentes.

### 4. Tono frío en momentos críticos

Aparece en BookingStepPayment ("Te abrimos WhatsApp...") y en algunos labels técnicos del flow (e.g., "Personalize", "Configurar reserva"). PRODUCT.md exige "warmth over polish" y "like a friend".

**Fix transversal**: copy review específico tras el polish técnico (sesión 7 opcional) por persona nativa española con orientación de marca, no por developer.

### 5. Touch targets <44px en botones secundarios

Fleet (Book button px-6 py-2.5), Pricing (size="sm" en tabla desktop), Booking flow (counter ±/–), Home (Footer email, FleetSection view toggle).

**Fix transversal**: auditar el componente `Button` `size="sm"`. Si genera 36px, restringir su uso a contextos NO-touch (toolbars desktop) o aumentar la altura mínima a 44px y dejar el padding interno menor.

---

## Recomendación de orden para sesiones de polish

1. **Home** (sesión 2) — el hero One Action es el cambio de mayor impacto/visibilidad. Establece el patrón "primer CTA outline" que se replica en otras superficies.
2. **Boat detail** (sesión 3) — el sticky vs hero CTA es la decisión arquitectónica más interesante; al resolverla se aprende la regla para Pricing también.
3. **Fleet / BoatCard** (sesión 4) — refactor del badge stack es trabajo visual fino; conviene tras decidir el "cómo destacar sin shadow" en sesión 2.
4. **Pricing** (sesión 5) — em dash en es.ts es un fix de 5 minutos, los demás son consecuencia de los patrones ya resueltos.
5. **Booking flow** (sesión 6) — tono y archivos legacy. El más conversacional; necesita revisión de copy con marca, no solo CSS.

---

## Qué NO está en este informe

- CRM admin (otro register, fuera de alcance del plan)
- Páginas de location/activity (fuera del top 5; revisar si se quiere extender el plan)
- Blog (fuera del top 5)
- Performance Lighthouse — eso va al audit doc
- Componentes shadcn/ui base — son externos, se asume que están bien
