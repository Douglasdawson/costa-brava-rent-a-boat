# Auditoría responsive completa — 2026-08-06

**Alcance**: web pública (30 rutas ES representativas de ~40 plantillas + spot-check DE) + panel CRM (19 tabs). Matriz de 9 anchos: 360, 375 (iPhone SE), 390 (iPhone 12-14), 430 (Pro Max), 744 (iPad mini), 820 (iPad Air), 1024 (iPad landscape), 1280, 1440. Overlays abiertos (menú móvil, modales, carrito, selector idioma), wizard de booking (árbol móvil y desktop, pasos 1-5 de 6), y pasada WebKit real (iPhone SE/14/15 Pro Max, iPad Mini/Pro 11) contra Chromium en las 6 superficies con controles nativos.

**Método**: detector clip-aware de la skill `/responsive-audit` con parches de este repo: neutralización del `overflow-x: hidden` de body/#root (que recorta desbordes en silencio y ciega al detector), asentado de página (el footer lleva `content-visibility: auto`), contexto táctil (`pointer: coarse`) para las reglas de móvil, y ancho real afirmado por celda. Todos los findings re-medidos antes de reportarse. Scripts y JSONs de resultados en el scratchpad de la sesión (`audit-*.mjs`, `results-*.json`, capturas en `shots/`).

**Estado general: el layout aguanta muy bien.** Cero desbordes de página en 375-1440 en toda la pública, cero en los 19 tabs del CRM en los 3 anchos, cero divergencias de geometría WebKit vs Chromium en los controles nativos (el `input[type=date]` de la ficha lleva ya el patrón de rótulo superpuesto y se ve idéntico en ambos motores). La deuda real está en **objetivos táctiles** y en tres detalles de iOS.

---

## P1 — arreglar primero

| # | Finding | Evidencia | Causa raíz | Fix propuesto |
|---|---------|-----------|-----------|---------------|
| 1 | **Botón X de cierre de Dialog: 16×16px** en todos los modales que usan el close por defecto de shadcn (BoatQuizModal, PhotoSubmissionForm de galería, JetSkiRequestModal, CommandPalette del CRM). Imposible de pulsar con el pulgar. | Medido 16×16 en todos los anchos y en ambos motores | `client/src/components/ui/dialog.tsx`: `<X className="h-4 w-4">` sin padding en el DialogClose | Añadir `p-3` (o `min-h-11 min-w-11` con flex center) al DialogClose; un cambio, arregla los 4 modales |
| 2 | **`<select>` nativos a 31-33px de alto en WebKit/iOS** (en Chromium miden 44+): hora del wizard `#wizard-time` (33px), los 3 selects de `/es/salidas-compartidas` (31px), select del form de galería (31px), select de personas del modal jet ski. Solo visible en WebKit: Chromium "aprueba" estos controles. | `results-webkit.json`, findings solo-WebKit en iPhone SE/14/15 | WebKit no respeta el alto del padding en selects sin `appearance-none` | Regla global tipo FleetSection (que ya lo hace bien): `select { min-height: 2.75rem; appearance: none }` + chevron propio, o clase compartida en los 6 selects |
| 3 | **CRM con `h-[calc(100vh-…)]`**: en Safari iOS (el dueño usa el CRM desde el iPhone en el puerto), 100vh mide con la barra de URL plegada → el fondo del panel (últimas filas, botones de acción) queda cortado cuando la barra está desplegada. | `client/src/components/crm/AdminLayout.tsx:332`, confirmado vivo en runtime | `100vh` en vez de `100dvh` | `h-[calc(100dvh-var(--trial-banner-h,0px))]` |

## P2 — vale la pena

| # | Finding | Evidencia | Fix propuesto |
|---|---------|-----------|---------------|
| 4 | **Recorte invisible a 360px** (+6/+8px) en 3 plantillas: lista de blog (fila de paginación, `button-pagination-next` cortado), post de blog (breadcrumb con el slug largo), `/es/excursion-snorkel-barco-blanes` (card `.border.rounded-lg.p-6`). El `overflow-x: hidden` del body lo recorta en silencio: no hay scroll lateral, simplemente falta contenido. Solo a 360; a 375+ cabe. | `results-matrix.json` page-scroll a 360 | Paginación: permitir wrap o `overflow-x-auto` propio. Breadcrumb: `truncate` o `break-words` en el último tramo. Card snorkel: revisar padding/min-width a <375 |
| 5 | **Nav de escritorio en iPad landscape (1024px): enlaces de 20px de alto** (Inicio, Flota, Motos de agua, Scooters, Tienda, Destinos). El iPad es táctil pero recibe el diseño de ratón. | Matriz @1024, todas las rutas | Variante `pointer-coarse:py-3` en los items de `Navigation.tsx` (el diseño visual no cambia con ratón) |
| 6 | **Campos a 14px en anchos de iPad (820/1024)** → Safari iPad hace zoom a toda la página al enfocar y no lo deshace: newsletter del footer ("Tu email"), formulario completo de `/es/tarjetas-regalo` (nombre, 2 emails, textarea), selects de filtro de FleetSection. El parche global de 16px solo cubre `<md` (768). En iPhone (≤430) todo va a 16px ✓. | Matriz ios-zoom, solo 820/1024 | Extender la regla de 16px a `pointer: coarse` en vez de por ancho, o `text-base` en esos campos |
| 7 | **Familia de enlaces-CTA de texto pequeños en móvil** (16-31px de alto): "4.8 · 410 opiniones en Google" (235×16), "Ver todas las opiniones" (167×20), "Ver cómo funcionan" (153×20), cross-links "Barcos sin/con licencia" (20px), logo de nav (69×32), TOC del home en DE. Son los CTAs de prueba social, tocados a diario. | Matriz, todos los anchos ≤820 | `py-2.5`/`min-h-11` + `inline-flex items-center` en esa familia de enlaces |
| 8 | **El FAB de WhatsApp tapa la barra de resumen del wizard** en `/es/booking` a 390: el círculo verde se superpone al total ("Total: 240€" queda medio oculto). | Captura `wizard-mobile-step5.png` | Subir el FAB (`bottom` mayor) cuando el wizard está montado, u ocultarlo en `/booking` |
| 9 | **"Prefiero escribir por WhatsApp" a 308×20px** dentro del modal jet ski (el resto del modal está muy bien: campos 16px, radios 42px, CTA 44px). | `results-jetski.json` @390 | `py-3` en ese botón secundario |
| 10 | **CRM: deuda táctil transversal en móvil/tablet** (el layout no desborda nada, pero): chips de filtro/orden a 26px (estados del calendario, Fecha/Importe/Nombre en reservas, Reciente/Gasto en clientes), sub-tabs a 28-32px (autopilot, shop, mantenimiento, ES/FR/EN/DE de reservas), y **enlaces de teléfono/email a 16px de alto en Peticiones** (340×16 — es lo que el dueño pulsa para llamar a un cliente). | `results-crm.json` 390/744 | Un `pointer-coarse:min-h-11` en chips/sub-tabs compartidos del CRM + `py-2` en los enlaces tel/mailto de InquiriesTab |
| 11 | **El aviso de cookies (z-300, bottom-0) intercepta el CTA del wizard** en `/es/booking` hasta que se responde: el "Siguiente" queda debajo y el click cae en el banner. Decisión de producto (el banner exige respuesta), pero en móvil bloquea el flujo de reserva de un usuario que lo ignora. | Interceptación reproducida en automatización | Opción: en `/booking`, colocar el banner arriba o compactarlo para no cubrir el footer del wizard |

## P3 — cosmético / borderline

- **CTA "Reservar" compartido** (nav/CTA section): `scrollWidth` excede la caja en +4..8px en todos los anchos; `overflow: visible`, el texto invade el padding sin recorte visual. Revisar `px` del Button o el `gap-2` del icono.
- **Borderline 36-42px** (por debajo del mínimo Apple de 44 pero usables): acordeones de la ficha de barco (40px), radios del modal jet ski (42px), barra-resumen del wizard (390×36), flechas "Mes anterior/siguiente" del calendario de la ficha a 820 (36×36), selects de filtro del CRM (36px), paginación de descuentos (41px de ancho).
- **X del toast**: `opacity-0 group-hover:opacity-100` → invisible/inalcanzable en iOS (sin hover). Mitigado: autocierre a los 4s (`TOAST_REMOVE_DELAY`). Si algún día el delay sube, esto pasa a P1.
- **`max-h-[calc(100vh-8rem)]`** en el TOC del blog (solo desktop, benigno con scroll interno).

## WebKit vs Chromium (foco Apple)

- **Sin divergencias de ancho intrínseco** en date/tel/number/select entre motores en las 6 superficies × 5 dispositivos. El bug clásico del `input[type=date]` desbordando en Safari **no** se da: la ficha de barco ya implementa rótulo superpuesto ("Elige fecha y verás los precios") y el render es idéntico (capturas `barco-date-{webkit,chromium}-*.png`).
- **La única divergencia real es el alto de los `<select>`** (P1 #2): Chromium 44px, WebKit 31-33px.
- Sin scroll horizontal en ningún dispositivo Apple emulado (home, faq, precios + las 6 superficies).

## Falsos positivos descartados (no perseguir en próximas pasadas)

- `a"Saltar al contenido" 1×1px`: skip-link accesible, visible solo con foco. Por diseño.
- Leaflet en `/es/rutas` (svg `leaflet-zoom-animated`, atribuciones): panel interno del mapa.
- Campos a 14px del form de galería **a 1280** (puntero fino, no hay zoom iOS con ratón).
- `ol.max-h-screen` (ToastViewport), `div.min-h-screen` (wrappers): usos benignos de vh.
- Contenedores `fixed` que "desbordan" en las celdas con page-scroll: siguen el arrastre, no lo causan (las hojas culpables son las del P2 #4).
- `/es/tienda` +585px intermitente (documentado en memoria): no reproducido tras asentar; era el `content-visibility` del footer.

## Cobertura y huecos honestos

- ~~**Wizard paso 6/6 (datos + confirmar) sin recorrer**~~ **Cerrado el mismo día** (ver addendum): no era validación asíncrona, era el diálogo interstitial de la garantía de mal tiempo + un `aria-label` que no coincidía con el texto visible.
- **Lightbox de galería sin auditar**: `/api/gallery` devuelve `[]` en esta BD (sin fotos). Hallazgo de código, no reproducible con datos actuales.
- **`/es/destinos/:slug` sin auditar** (DB-backed, sin seed).
- **Input de importe de tarjetas-regalo**: no visible sin interacción previa (el resto de la página sí auditado).
- Toasts no disparados en vivo (análisis de código del X arriba).

## Incidencias de ejecución

- El dev server se quedó colgado a mitad (`/api/boats` en timeout infinito mientras `/api/boats/:id` respondía) → reinicio y re-audit. Las fichas de barco y `/es/booking` además **no montan vía pushState** (rutas lazy): auditadas con goto directo.
- Login del CRM: el middleware CSRF devuelve 403 sin `Origin`/`Referer` — resuelto añadiendo cabeceras; 1 solo intento de PIN consumido.

## Datos

- Celdas medidas: 275 (matriz) + 27 (re-audit fichas) + 30 (overlays ×2 pasadas) + 11 (wizard) + 90 (WebKit/Chromium) + 59 (CRM) ≈ **490**, ancho real afirmado en cada una.
- Resultados crudos y capturas: scratchpad de la sesión (`results-{matrix,unpainted,overlays,overlays2,jetski,wizard,webkit,crm}.json`, `shots/*.png`).

---

## Addendum (2026-08-06, misma tarde): P1 arreglados y paso 6 cerrado

**Los 3 P1 están aplicados y re-verificados en ambos motores** (sin commitear aún):

1. **X del Dialog** (`ui/dialog.tsx`): `p-3.5` + reposicionado `right-0.5 top-0.5` (el icono queda visualmente donde estaba). Medido 44×44 en Chromium táctil @390; un solo edit cubre los 4 modales.
2. **Selects nativos en WebKit** (`index.css`): el hallazgo de la mañana se quedaba corto — WebKit no solo ignora el padding, **ignora `min-height` incluso inline** en selects con apariencia nativa (solo respeta `height` explícito o `appearance: none`). Fix global bajo `@media (pointer: coarse)`: `appearance: none` + chevron propio en data-URI + `padding-right !important` (las utilidades `px-*` ganan al selector de elemento), excluyendo `select.appearance-none` (FleetSection) para no duplicar chevrones. Re-medido: salidas-compartidas 31→50px, jetski 50px, todo ≥44 en WebKit iPhone SE; Chromium sin regresión.
3. **CRM `100vh`** (`AdminLayout.tsx:332`): → `100dvh`. Utilidad generada por Tailwind confirmada en el CSS servido.

**Paso 6/6 del wizard: recorrido y auditado en los dos árboles.** El "no avanza en headless" tenía dos causas, ninguna era un bug funcional:

- Al pulsar "Continuar sin coberturas" sin la garantía, el wizard abre **a propósito** el diálogo interstitial "¿Seguir sin la garantía de mal tiempo?" (`handleNextStep` → `setShowWeatherWarning`, `BookingFormWidget.tsx:1459`). Solo avanza al responder "Añadir por X€" o "Continuar sin garantía". La automatización esperaba la transición 5→6 y no miraba el diálogo.
- **Bug real de accesibilidad (arreglado)**: el botón de avance móvil llevaba `aria-label="Siguiente: …"` fijo aunque el texto visible fuera "Continuar sin coberturas" (`BookingWizardMobile.tsx:365`) — incumplía WCAG 2.5.3 (label in name: control por voz roto) y hacía que cualquier walker por rol accesible clicara "Siguiente" sin saber que abría el diálogo. Fix: el aria-label ahora empieza por `nextLabel`. El árbol desktop no tenía aria-label (nombre = texto visible), estaba bien.

Resultado del paso 6 (390 táctil y 1280): campos `fullname/phone/email` a 46px de alto y 16px de fuente (sin zoom iOS), sin desbordes. Menores nuevos para la lista P2/P3: botón "Editar" del resumen 71×26, chip "Fianza reducida" 326×32, flecha "Atrás" 42×44 (borderline), y el FAB de WhatsApp vuelve a tapar la barra de total (mismo P2 #8). El diálogo de aviso de garantía en sí está limpio (solo la barra-resumen de 36px ya conocida). El CTA final es "Pedir por WhatsApp" (no se pulsó: freno anti-submit).
