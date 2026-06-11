# Pasada impeccable — auditoría exhaustiva de superficies públicas (2026-06-11)

Auditoría de diseño/UX con el skill impeccable sobre el dev server local (commit de main del 11-06). 6 agentes en paralelo, ~190 capturas en 390×844 y 1440×900, interacción real (wizards, modales, validaciones, focus, throttling). Solo informe: ningún fix aplicado.

## Cobertura

| Grupo | Superficies | Estado |
|---|---|---|
| G1 Funnel | Home completa, wizard modal (5 pasos sin envío), /booking, BoatQuiz | Completo |
| G2 Fichas | solar-450, pacific-craft-625, excursion-privada (galería, tabs, FAQs, stickies, calendario) | Completo |
| G3 Categorías | sin-licencia, con-licencia, 4 actividades, rutas, precios | Completo |
| G4 Locations | Las 11 (Blanes en profundidad + 10 diffs) | Completo |
| G5 Verticales | Jet ski ×3 + modal, scooters, salidas-compartidas, gift cards (API mockeada), matrix ×4 | Completo |
| G6 Transversal | Cookie banner, BoatClubModal, hamburguesa, verificador licencia, blog+2 posts, FAQ, about, galería, testimonios, glosario, destinos, 5 legales, 404, estados de carga, spot-check DE/EN | Completo |

No cubierto: envío final de formularios (veto deliberado: DB de producción), exit-intent modal sintético, dark mode, los 12 combos matrix restantes, hover desktop exhaustivo.

Capturas: `/tmp/impeccable/g{1..6}-*/` (efímeras; los scripts .mjs de reproducción están junto a las de g6).

---

## P0 — Roto / bloquea conversión

### P0.1 La sección de testimonios nunca se revela (banda blanca permanente)
**Dónde:** home `#reviews` (G1, ambos viewports) y las 3 páginas jet ski (G5, ambos). G4 observa el mismo reveal fallando en scroll rápido en locations.
**Qué:** la sección queda en `opacity-0 translate-y-8 blur-[2px]` para siempre, incluso con scroll de rueda humano + espera. Resultado: 750-1200px de blanco donde debería estar TODA la prueba social del sitio.
**Causa probable:** `useScrollReveal` (IntersectionObserver) no dispara sobre secciones con `content-visibility:auto; contain:layout style paint` (`.below-fold`, `client/src/index.css:395`).
**Fix:** corregir el trigger (rootMargin/observar wrapper sin content-visibility) o excluir `#reviews` de `.below-fold`. Verificar también jet ski.
**Archivos:** `client/src/hooks/useScrollReveal.ts`, `client/src/components/ReviewsSection.tsx:216-220`, `client/src/components/JetSkiLanding.tsx`.

---

## P1 — Drift de datos contra el canon

### P1.1 Astec 400 ausente de la DB viva → cascada de cifras rotas (G1+G3, confirmado a mano)
`/api/boats` devuelve 8 barcos + 2 jet ski. Consecuencias visibles:
- Home/FAQ/SEO: "9 embarcaciones, 5 sin licencia" pero solo 4 sin-licencia renderizan.
- `/es/precios`: "8 embarcaciones disponibles" (contradice el 9 del resto del sitio).
- `/es/barcos-sin-licencia`: "Disponemos de 5 embarcaciones" + 4 cards.
- "Desde 70€/h" (home, actividades) cuando el mínimo vivo es 75€/h (el 70 era Astec 400).
- **BoatQuiz recomienda Astec 400 como "MEJOR OPCIÓN"**: dead-end en máxima intención; su CTA abre el wizard sin barco preseleccionado y resetea pax (`client/src/components/BoatQuiz.tsx`).

**Decisión necesaria (dueño):** re-sembrar astec-400 (`server/migrations/applyBoatsSeedEnsure.ts`) o degradar el copy a 4 barcos/75€ en todas las superficies. La memoria del proyecto dice que la tabla tenía 9 filas en mayo: lo probable es que la fila se haya borrado/desactivado.

### P1.2 "Gasolina incluida" en la Excursión Privada (canon: NO incluye) — 3 superficies
- BoatCard home: "¡Gasolina incluida!" (el guard regex `/combustible\s*no/` sobre `features` no matchea lo que llega de DB) → `client/src/components/BoatCard.tsx:278-288`. Fix: flag explícito, no regex.
- Ficha excursión: chip hero "Gasolina y seguro incluidos" contradice el chip "Combustible NO incluido" de la misma página → `BoatDetailPage.tsx`.
- `/es/precios`: chip verde "Gasolina incl." + badge "Sin licencia" en la fila excursión (parece derivar de `!requiresLicense`) → `client/src/pages/pricing.tsx`.

### P1.3 Terminología de licencia fragmentada y sobre-exigente (canon: la Licencia de Navegación basta)
- `/es/barcos-con-licencia`: hero "Requiere titulación náutica PER, PNB o superior"; lista "Titulaciones Aceptadas" NO incluye la LN → `es.ts` (~categoryLicensed) + `category-licensed.tsx`.
- Ficha Pacific Craft: 4 términos en una página ("PER/PNB", "Licencia Básica requerida", "LNB", "licencia de navegación") → `es.ts`, `shared/boatData.ts` features, `shared/boatFaqBuilder.ts`.
- Tossa/Lloret: exigen "LNB" (H1 de Tossa incluido) → `location-tossa-de-mar.tsx`, `location-lloret-de-mar.tsx`, `shared/nauticalGlossary.ts:27`.
- `/es/precios` lo hace BIEN ("La Licencia de Navegación basta"): usar como referencia.

### P1.4 FAQ y bloque de ventajas con plantilla equivocada en la Excursión Privada (G2)
"El combustible está incluido", "recibirás una formación de 15 minutos sobre el manejo" (el cliente NO pilota) y bloque "Ventajas de los Barcos Sin Licencia" en una ficha con patrón → rama propia en `shared/boatFaqBuilder.ts` + condicional en `BoatDetailPage.tsx`.

### P1.5 Solar 450: fila DB desincronizada de boatData
FAQ de ficha: "3h desde 150€, 4h desde 180€" (canon baja: 130/150) y "Fianza: 200€" (canon: 250€) → resincronizar seed (`applyBoatsSeedEnsure.ts`).

### P1.6 Tiempos y alcances erróneos (G4)
- "Tossa de Mar: 1h desde Blanes" en cards Destinos + chips (canon: 30-45 min con licencia) → `client/src/components/RelatedLocationsSection.tsx:79`, `es.ts:725,2434,2540,2646`.
- costa-brava: "Blanes-Tossa… licencia **recomendada**" (es requisito legal) y "Blanes-Lloret: 30 min, **sin licencia**" (la playa de Lloret queda fuera de las 2 millas; la propia página de Lloret lo explica bien) → `es.ts:2280,2283`.
- "Sin límite distancia" / "mar abierto sin límites" (chips RelatedLocations + costa-brava): sobrepromesa legal → `RelatedLocationsSection.tsx:175`, `es.ts:2304`.

### P1.7 Capacidades infladas para sin-licencia (máx real 5 pax)
- "ideales para 2-7 personas" + chip "4-7 personas" (PopularBoatsSection intro en lloret/malgrat/santa-susanna/calella + cards Tipos de Embarcación) → `es.ts:672,676,680,684`, `RelatedLocationsSection.tsx:166`.
- Hero `/es/barcos-sin-licencia`: "Hasta 7 personas, sin carnet" + badge "4-7 personas".
- costa-brava: "Hasta 12 personas a bordo" y "De 40 a 150 CV" (canon: 7 pax / 115cv) → `es.ts:2302-2303`.

### P1.8 "7 embarcaciones" en malgrat/santa-susanna/calella (canon 9) → `es.ts:1986-1987,2116,2154,2208,2246`.

### P1.9 Política de cancelación no canónica
Tabla comparativa de `/es/barcos-sin-licencia`: "Flexible hasta 48h antes" → texto canónico → `es.ts`. (`/es/precios` "Información importante" además omite mal tiempo y no-reembolsable: completar, P3.)

### P1.10 Confianza fabricada (cluster)
- Contador "N personas han visto este barco hoy" aleatorio por carga (7→13 en una sesión) → `BoatDetailPage.tsx`.
- Reviews internas con specs falsas: Pacific "150CV es una bestia", "con cabina" (canon: 115cv, open); "Primer verano de esta empresa" junto al badge "5 años de experiencia".
- Testimonio sintético "Familia García, Madrid" en sin-licencia (mismo patrón que la review fabricada retirada el 10-06).
- "/es/booking": trust chip "12+ reservas esta semana" sin fuente.
- `/es/precios`: "Confirmación inmediata" (modelo de solicitudes; sobrepromesa) → `es.ts:4520`.
- Doble rating sin etiquetar en fichas: "4,8 · 323 reseñas en Google" vs "4.7 (262 opiniones)"; about "300+" vs footer "334+"; rating por barco "4.6 (261)" no verificable → unificar a `shared/businessProfile.ts`.

## P1 — Bans absolutos y bugs de marca

### P1.11 Em dashes en copy visible: 54 líneas en `es.ts` (+ JSX y SSR)
Instancias confirmadas en: home (rango ×5), wizard paso 1 ("Sin pago online — te confirmamos…"), error de email, H1 de Lloret y Tossa, kicker "TRAMO SIN LICENCIA — 25 MIN", sin-licencia (H1, tabla, FAQ), atardecer ×2, rutas, matrix snorkel/familias (+title SSR), blog index ×4, destinos ×2, política privacidad ×5. Purga global de "—" en `es.ts` + componentes + meta SSR, propagando a los 7 idiomas.

### P1.12 Contrastes ilegibles (AA roto)
- Home, bloque mapa "Nos encontramos en el Puerto de Blanes": texto casi blanco sobre facade gris ≈1.1:1; el mapa nunca carga → fondo navy o imagen estática.
- Footer badge "Operador propio · Puerto de Blanes": navy sobre navy/10 sobre footer oscuro, <1.5:1 → `Footer.tsx`.
- Gift cards: subtítulo hero ≈1.04:1 (invisible) y H1 teal pálido borderline sobre blanco → `gift-cards` page.

### P1.13 Gift cards: página entera necesita rescate (G5)
Texto sin tildes ni ñ ("Por que regalar…", "cumpleanos"), "válidas para nuestros **10** barcos" (canon 9), CTA "Comprar tarjeta regalo" + "¡Compra realizada!" sin que exista pago online ni mención de cómo se paga, importes "50EUR", foto hero del skyline de Barcelona (W Hotel). Reformular a "Solicitar" + explicar siguiente paso + i18n correcto + foto local.

### P1.14 Cookie banner hardcoded en castellano (G6)
En `/en/` y `/de/` la primera interacción del sitio sale en español → `client/src/components/CookieBanner.tsx:65-105` → `es.ts` + `i18n:translate`.

### P1.15 Wizard: precio inconsistente intermitente (G1)
Paso hora/duración muestra Solar 450 4h = 200€, paso Confirmar muestra "4h · Total: 180€" (precio 3h) para la misma selección; otra pasada idéntica dio 200€. Race en el recálculo del quote → `BookingWizardMobile.tsx` / lógica de quote.

### P1.16 "/es/booking" dice "Continuar al pago" (modelo sin pago) → `es.ts:337`. La página además no tiene nav/logo/escape, fecha "mm/dd/yyyy", CTA "Obtener Cotización" (latinoamericanismo), validación muda (botón apagado sin mensajes). Valorar si esta ruta secundaria debe seguir publicada.

### P1.17 RelatedLocationsSection: triple grid de cards idénticas + sin i18n (G4)
~6 pantallas de scroll móvil con 11 cards icon+título+chip+texto+CTA repetidas (patrón banned), icono de coche ×6. Además TODO hardcoded en español (sale en castellano en /de y /en; no estaba en la lista de deuda i18n de CLAUDE.md) y con erratas ("Alojado en la costa del Maresme?" sin ¿, "parking facil", "excursion"). Colapsar Pueblos Cercanos a lista compacta + migrar a i18n → `RelatedLocationsSection.tsx`.

### P1.18 Hero móvil de locations sin CTA de reserva (G4)
Primera acción de reserva a ~13 pantallas (nav colapsada). Botón pill navy en hero móvil (sería el único navy del viewport: One Action Rule OK) → `LocationTemplate.tsx` / `location-blanes.tsx`.

### P1.19 Alemán defectuoso (G6)
"Ohne Fuehrerschein", "Oeffnungszeiten" (sin umlauts), "5 Personas" (castellano) en location DE; card jet ski de home DE íntegra en castellano (descripciones en `shared/jetskiProducts.ts`, fuera de i18n); mezcla du/Sie en el wizard; stepper DE desbordado a 390px ("Zeit und DaueMach den Tag besser") → `de.ts` + `jetskiProducts.ts` → i18n.

---

## P2 — Pulido con impacto (deduplicado)

1. **BoatClubModal demasiado agresivo** (reportado por 5 grupos): dispara a ~2,5s en TODAS las páginas, sin scroll previo; tapa fichas de barco en plena decisión, la confirmación de gift cards y el hub jet ski; X=36px y "Ahora no"=33px (<44). Fix: gate por engagement (scroll 50% o 2ª página), excluir money pages (/barco/*, confirmaciones, verticales de conversión), min-h-11 en cierres → `BoatClubModal.tsx`.
2. **Stack inferior derecho móvil roto** (G1/G2/G5): FAB WhatsApp tapa scroll-to-top, solapa CTA inferior de /booking y pill del hero de salidas; duplica el botón WhatsApp del sticky de ficha; sticky sin `env(safe-area-inset-bottom)`. Orquestar visibilidad FAB + safe areas.
3. **Verificador de licencia no descubrible** (G2/G3): cero enlaces desde la ficha licensed ni la categoría licensed (el momento exacto de la duda). Además overlay del panel mid-scroll: botones se superponen al listado → `LicenseVerifierPanel.tsx`.
4. **Fichas: una sola foto, sin lightbox** (G2): hero y card repiten la misma imagen, no clicable; "Ver galería" saca de la money page. La mayor carencia emocional ("la fotografía manda").
5. **Cards de flota sin foto ni link** en categorías (G3) y locations (G4): bloques de texto dead-end en las páginas cuyo trabajo es empujar a la ficha.
6. **Wizard**: inputs pill (regla: rounded-md), fecha nativa "mm/dd/yyyy", decimales "2.50" vs "2,5", heading "PERSONALIZA TU EXPERIENCIA" sobre el resumen del paso Confirmar, "en minutos" vs "menos de 2 horas".
7. **One Action Rule en home desktop** (G1): 3 "Reservar" navy de cards + nav = 4 por viewport → outline en cards no destacadas.
8. **Quiz sin entrada visible** (G1): solo exit-intent; el bloque "¿No sabes cuál elegir?" lleva a WhatsApp. Copy del resultado contradice respuestas ("Perfecto para parejas" tras marcar 3-4 pax).
9. **Combustible NO incluido descubierto tarde** en fichas licensed (solo chip de tab + FAQ; sidebar/hero callan; en Solar la sidebar SÍ dice "Gasolina incluida") → nota bajo el precio.
10. **Legibilidad larga**: blog post y FAQ a 92-104ch (tope 75ch); post de calas de 10.000px sin una sola imagen inline; FAQ intro duplicada y sin buscador (40 preguntas).
11. **Fotos no pertinentes**: Hotel W de Barcelona en atardecer ("sin edificios, solo el mar") y gift cards; buceo con botella + raya gigante en snorkel; misma foto de ambiente en Blanes y Malgrat.
12. **Secciones huecas**: "Artículos del blog" con 1 link y cero posts en lloret/tossa/barcelona; hueco blanco ~1 pantalla en costa-brava (imagen lazy sin altura reservada); párrafo de 50 palabras renderizado como h2 display en /rutas.
13. **Formularios menores**: newsletter con validación nativa del navegador ("Please fill out this field."); salidas-compartidas con error global sin marcar campos; tabla precios Blanes sin columna de temporada media.
14. **Técnicos visibles**: cookie banner `aria-modal` sin focus trap; warning React de prop inválida en lloret/tossa; 3 errores 403 en consola en cada carga; condiciones-generales sin fecha de versión; FAQ de ficha "Seguro… Seguro" duplicado.
15. **Salidas compartidas**: hero "4 horas · 40€/persona + Plazas limitadas" sin la coletilla "compartiendo el barco" (el reaseguro está solo en la FAQ del fondo).

## P3 — Pulido fino

Banderas emoji en prefijo telefónico y selector de idioma (ban de emojis; bandera de Català sale negra), Title Case anglosajón sistemático, "EUR" vs "€" (actividades, gift cards, DE), tap targets <44px en links de footer/cross-links/tabla de flota, hamburguesa no cierra con Escape, "20 vs 25 min" a Lloret entre páginas, strip de tabs cortado sin fade en fichas móvil, "el Excursión Privada" (género) ×5 en FAQ, título truncado en sidebar sticky, semáforo rojo para temporada alta en /precios, leyenda de política incompleta en /precios, pills de blog con capitalización mixta, hero desktop línea de precio ~11px sobre foto.

---

## Positivo (mantener)

- **Paso de datos del wizard**: valle de ansiedad ejemplar (resumen editable, "sin pago online, sin compromiso", fianza explicada, errores inline útiles). Defaults inteligentes.
- **Política de cancelación canónica** literal en las 3 fichas, condiciones-generales y términos. "Dos millas náuticas (3,7 km)" correcto en legales.
- **Jet ski limpio**: cero "partner/reventa" en el innerText de las 6 vistas; precios exactos a `jetskiProducts.ts`. Scooters = página puente ejemplar.
- **Matrix no son doorways**: calas con nombre, recomendación de barco legalmente correcta por distancia, CTA funcional.
- **Tossa warning** y **Barcelona framing** honestos; FAQs locales únicas por pueblo.
- **A11y base sólida**: focus ring navy doble visible en todo el tab-order, skip-link, CLS 0.000 con red lenta, skeletons en blog/calendario, cero overflow horizontal en todo lo auditado, /precios clava la decisión binding (CTAs outline) y Earned Depth verificado por DOM en categorías.
- **404 y verificador de licencia** muy bien resueltos.

---

## Tandas de fix propuestas

**Tanda 1 — P0 + confianza del funnel** (mayor impacto/esfuerzo):
P0.1 reveal de testimonios · P1.1 decisión Astec 400 + cascada de cifras · P1.2 gasolina excursión (3 superficies) · P1.3 unificación licencia a LN · P1.15 race de precio del wizard · P1.16 "Continuar al pago" · P1.10 confianza fabricada · P1.12 contrastes · P1.11 purga de em dashes.

**Tanda 2 — datos restantes + i18n**:
P1.4-P1.9 (FAQ excursión, Solar DB, tiempos, capacidades, "7 embarcaciones", cancelación 48h) · P1.13 rescate gift cards · P1.14 cookie banner i18n · P1.17 RelatedLocationsSection · P1.18 CTA hero móvil locations · P1.19 alemán.

**Tanda 3 — P2 UX**: BoatClubModal, stack FAB, verificador descubrible, wizard (inputs/fecha/decimales), fotos+lightbox fichas, cards con link, quiz, legibilidad blog/FAQ, fotos no pertinentes, secciones huecas.

**Tanda 4 — P3 pulido fino.**

Notas operativas: los cambios de copy van SIEMPRE por `es.ts` + `npm run i18n:translate` (API con crédito a partir del 2026-07-01; hasta entonces, traducción manual de los 7 idiomas como en junio). P1.1 y P1.5 requieren decisión/acceso a DB del dueño. Tras cada tanda: re-captura de páginas tocadas + `npm run check:all`.

---

## Estado de ejecución (2026-06-11, misma jornada)

Las 4 tandas se ejecutaron en 8 commits (`2a39a8f..6e9ff31`, local sin push):

- **Tanda 1** (`2a39a8f`, `c43b17d`, `c445046`, `4a51d75`): P0.1 reveal corregido y verificado; Astec 400 NO se reactivó (lo desactivó el owner vía CRM el 2026-05-29, audit log) — copy alineado a flota viva 8/4/75€ y quiz filtrando por flota activa; P1.2/P1.3/P1.10-P1.12/P1.15/P1.16 cerrados; dataset de ~2.370 reseñas sintéticas RETIRADO por decisión del owner (incluido el JSON-LD que las emitía y /testimonios reescrita sobre reseñas reales de GBP).
- **Tanda 2** (`240d152`): P1.4-P1.9, P1.13, P1.14, P1.17-P1.19 cerrados; DB de producción resincronizada (Solar 450 130/150/fianza 250€ — era el origen del "180€" del wizard — y features LN en los 3 con licencia).
- **Tanda 3** (`1ed9ce7`, `b1935d6`): popup con gate de engagement + exclusión de money pages, FAB/scroll-to-top sin solapes, verificador descubrible (inline en ficha y categoría), quiz con entrada visible, legibilidad prose, formularios con validación propia, fecha en condiciones, warning React y CORS del beacon.
- **Tanda 4** (`6e9ff31`): banderas SVG, EUR→€, tiempos "menos de 2 horas", 25 min a Lloret, tap targets, Escape, fade tabs, semáforo, hero desktop.

**No ejecutado (consciente):**
- Inputs pill del paso datos del wizard y decimales mixtos de extras (P2.6 parcial): micro-polish pendiente de localizar el componente exacto.
- Fotos no pertinentes (W Hotel en atardecer, buceo en snorkel, P2.11): requiere assets nuevos del owner.
- Posts de blog sin imágenes inline (P2.10 parcial): contenido en DB, no UI.
- `/es/booking` como ruta secundaria (P1.16 resto): renombrado el CTA, pero la decisión de despublicar la ruta o darle identidad completa es del owner.
- El formato de fecha nativo "mm/dd/yyyy" se descartó como no-bug (depende del locale del navegador del usuario).
- 6 errores tsc + 1 error lint (robots.ts) preexistentes en main, fuera del alcance.
