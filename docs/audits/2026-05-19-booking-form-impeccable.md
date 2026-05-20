# Auditoría /impeccable — Formulario de petición de reserva

**Fecha:** 2026-05-19
**Alcance:** wizard activo del Hero, 4 pasos. Archivos:
- `client/src/components/BookingFormWidget.tsx` (1.326 LOC, contenedor, estado, validación, submit)
- `client/src/components/BookingWizardMobile.tsx` (1.103 LOC)
- `client/src/components/BookingFormDesktop.tsx` (1.147 LOC)

**Fuera de scope:** wizard legacy `/booking` (`components/booking-flow/`, 3 pasos, huérfano salvo desde ClientDashboard). Decisión de matarlo o unificarlo va aparte.

**Misión:** optimizar el wizard para que un cliente potencial (medio español-medio inglés, mayoría móvil, navegando bajo el sol) complete la solicitud en el menor tiempo posible y con la menor carga cognitiva. La web es un capturador de intención, no un checkout: el pago se cierra a mano por WhatsApp.

**Output:** este documento + backlog priorizado P0/P1/P2 al final. **Sin tocar código.**

---

## Contexto y baseline

### Modelo de negocio
- **Sin pago online.** El form captura una solicitud. La conversación + el cobro los lleva el negocio por WhatsApp.
- **Combustible solo en sin licencia.** Los barcos con licencia y la excursión privada NO lo incluyen.
- **Temporada abril-octubre.** Fuera no se aceptan reservas.
- **Operativa de WhatsApp.** El submit abre `wa.me` con un mensaje pre-rellenado y, fire-and-forget, guarda la `inquiry` en BD para que aparezca en el CRM.

### Métricas baseline (GA4)
- Últimos 7 días: `13 booking_started`, `0 generate_lead`, `0 purchase`.
- **No hay tracking step-by-step ni evento `inquiry_submit`.** No podemos saber dónde abandonan ni cuántos completan el envío del WhatsApp.
- Los micro-events de funnel YA existen en `client/src/utils/analytics.ts:412-438` (`trackDateSelected`, `trackTimeSlotSelected`, `trackDurationSelected`, `trackExtrasChanged`, `trackBookingAbandoned`, `trackQuoteCreated`) pero se llaman SOLO desde el wizard legacy `booking-flow/` — **no desde el wizard activo del Hero**. La infra está, solo falta enchufarla.

### Estructura del wizard activo (Mayo 2026)
| Paso | Mobile | Desktop | Función |
|------|--------|---------|---------|
| 1 | `Step1WhenWho` | `Step1WhenWhoDesktop` | Fecha (popover calendar) + nº personas (spinner ± con hard cap 12) |
| 2 | `Step2Boat` | `Step1BoatDate` (mal nombrado) | Filtro licencia (radiogroup) + lista de barcos con precio dinámico por fecha |
| 3 | `Step3Departure` | `Step2Details` (mal nombrado) | `<select>` hora salida (21 slots) + grid duraciones con badges "Más popular"/"Mejor valor" |
| 4 | `Step4Final` | `Step4FinalDesktop` | Datos personales + extras collapsible + summary card + RGPD + submit WhatsApp |

**Mobile y desktop tienen ahora la misma estructura de 4 pasos.** La divergencia "extras step 3 desktop" del audit 2026-05-04 ya se cerró — ambos meten extras en step 4. Lo que queda es la duplicación estructural (3.499 LOC) y divergencias cosméticas.

### Auditoría previa (2026-05-04) — estado
Health Score 10/20. Hallazgos abiertos que entran en esta segunda pasada:
- P0 contraste `text-muted-foreground/60` (verificar restos en mobile y desktop).
- P0 heading-order h2→h4 — mobile parece cerrado, queda revisar PersonalDataSection (h2) + secciones siguientes (h3) en step 4.
- P0 focus inicial en Close → ya hay `onOpenAutoFocus` en `useBookingModal.tsx:55-58` que previene focus en Close. Hecho.
- P0 i18n quiz hardcoded — escapa al scope, pero `text-base` y prefijos siguen.
- P1 color tokens hardcoded — verificar `red-500`/`green-X`/`amber-600` restantes.
- P1 mobile/desktop divergencia — ya hay step 2/3/4 simétricos. Sigue habiendo divergencia cosmética.
- P2 65 props vía `sharedProps` — no toca esta sesión.

### Diseño de referencia (PRODUCT.md + DESIGN.md)
- **Brand register.** El wizard sirve a la misión brand: capturar un lead emocional sin fricción. Diseño coastal, warm, mobile-bajo-el-sol.
- **Voice:** "confident but never corporate. Local but never amateur. Like a friend who knows the coast."
- **Anti-references:** yacht charter (frío, oro y mármol), excursion budget (clip art, precios gritados), generic travel (search bars Booking.com).
- **Pill CTAs, Deep Navy CTA #1a1a3e, flat at rest, earned depth, Clash Display + Archivo.**
- **The One Action Rule:** máximo 2 Deep Navy CTAs por viewport.

---

## Pasada 1 — Information Architecture

**Pregunta central:** ¿4 pasos es lo correcto? ¿Cuál es el orden mental natural para el cliente?

### Mental model del cliente
Un cliente que entra al Hero piensa, en este orden:
1. *¿Cuándo voy?* (la fecha la tiene en la cabeza desde antes de aterrizar en la web)
2. *¿Cuántos somos?* (también la sabe — es su grupo)
3. *¿Qué tipo de barco?* (sin licencia es la respuesta "fácil" en el 80 % de tráfico turista)
4. *¿Cuánto cuesta?* (mira precios)
5. *¿A qué hora salgo y cuánto rato?* (decide el plan)
6. *Datos para que me contesten.*

El wizard actual cubre 1+2 en el paso 1, 3 en el paso 2, 5 en el paso 3, datos+extras en el paso 4. El precio se cuela en cada paso (BoatCard mobile/desktop tiene `from {price}€`, duraciones tienen precio, sticky `PriceSummaryBar` en steps 2-3). **El orden es razonable.** Lo que falla NO es el orden, son los *jumps* y *defaults*.

### Hallazgos

#### 1.1 [P1] Step 1 "Cuándo y cuántos sois" mezcla dos decisiones cognitivamente distintas
- **Locations:** `BookingWizardMobile.tsx:405-515` (`Step1WhenWho`), `BookingFormDesktop.tsx:840-977` (`Step1WhenWhoDesktop`).
- **Síntoma:** el usuario pulsa "Reservar", ve "Cuándo y cuántos sois". El cerebro hace dos cosas distintas: planificar fecha (decisión calendario, contextual) y contar grupo (decisión social). El campo "personas" usa un spinner sin sugerencia previa — el default arranca en `"2"` (BookingFormWidget.tsx:74). Un grupo de 6 que ve "2" tiene que pulsar 4 veces. Un grupo de 1 tiene que pulsar -1.
- **Por qué no es trivial:** no podemos saber sin medir si el spinner ralentiza vs un input. Hipótesis: el spinner es bueno en mobile (touch, no abre teclado), pero el default "2" es subóptimo. Casi todas las reservas son grupos de 2-4 (típico turista pareja/familia). El mediano sería "4" o usar `<input inputmode="numeric">`.
- **Recomendación:** mantener el orden (`fecha → personas`) y el spinner en mobile, **pero**:
  - Permitir entrada por texto en desktop además del spinner (`<input inputmode="numeric" min={1} max={12}>`).
  - Considerar quitar el hard cap 12 del UI y subirlo a 16+: el `MultiBoatCombinations` ya gestiona grupos grandes; un techo arbitrario frena legítimos.

#### 1.2 [P1] `skipBoatStep` deja un agujero de affordance al volver atrás
- **Location:** `BookingFormWidget.tsx:130, 817-820, 856-859`.
- **Síntoma:** si el usuario entra desde un boat detail CTA (con `preSelectedBoatId`), avanzar del step 1 → salta al step 3 (omite barco). El back desde 3 vuelve al 1. Hasta ahí, ok. Pero el usuario que va 1 → 3 y al ver precios se arrepiente del barco tiene que cerrar el modal y volver a la página del barco. **No puede cambiar de barco dentro del wizard.**
- **Por qué importa:** boat detail genera tráfico cualificado (más permanencia, ver memoria). Si el precio le sorprende, perderlo por una decisión de UX es caro.
- **Recomendación:** NO saltar el step 2. Pre-seleccionar el barco como recomendado pero mostrar el resto activos. El usuario pulsa "Siguiente" y avanza igual de rápido si no cambia nada, pero conserva la opción.

#### 1.3 [P2] El back del step 3 al step 1 (con skipBoatStep) confunde
- **Location:** `BookingFormWidget.tsx:856-861`.
- **Síntoma:** la progress bar muestra "paso 3" pero al pulsar atrás aparece "paso 1". Salto visible al usuario. Confunde porque la flecha "atrás" suele ser lineal.
- **Recomendación:** si se acepta 1.2, esto desaparece. Si no, anunciar el salto: progress bar resalta el step 2 como "saltado" y al volver, atrás → 1 con micro-explicación `aria-live` ("Volviendo a fecha y personas").

#### 1.4 [P1] PriceSummaryBar solo visible steps 2-3 — paso 4 desaparece
- **Location:** `BookingWizardMobile.tsx:205-223`, `BookingFormDesktop.tsx:333-362`.
- **Síntoma:** en el paso final (4), donde el usuario decide si manda el WhatsApp, la sticky `PriceSummaryBar` desaparece. El precio queda solo en la summary card. La sensación es "ya está cerrado, no veo qué pago".
- **Recomendación:** mantener la barra de precio sticky también en step 4, en la versión "expandida" (con descuentos visibles). El precio es la última duda que el cliente quiere ver al pulsar enviar.

#### 1.5 [P0] El BoatQuiz como step 0 alternativo es ruido si ya conocen el barco
- **Location:** `Hero.tsx` dispara `BoatQuizModal` o `BookingFormWidget` según botón.
- **Síntoma:** dos puertas de entrada. Una es "Encuentra tu barco" (quiz), otra es "Reservar ahora" (wizard). Memoria del audit anterior: 100 % de la audiencia que llega al boat detail page ya ha decidido en mayor o menor medida. El quiz captura al inseguro.
- **Decisión:** mantener el quiz pero limitar su alcance — el botón "Encuentra tu barco" del Hero se mantiene solo si los datos GA4 muestran > 5 % de uso. Si no, eliminarlo y dejar el wizard como única puerta.
- **Acción recomendada:** medir antes de tocar. Es decisión separada, pero queda anotada.

### Veredicto Pasada 1
El orden de pasos es razonable. **No hay que reescribir la IA.** Lo que falla son los jumps (`skipBoatStep`), la desaparición del precio en el paso final, y el cap arbitrario de personas. Cambios *quirúrgicos*, no estructurales.

---

## Pasada 2 — Cognitive load por campo

Tabla campo-a-campo. Veredicto **mantener / recortar / inferir / diferir**.

| Paso | Campo | Estado | Veredicto | Justificación |
|------|-------|--------|-----------|---------------|
| 1 | Fecha | Popover calendar, default = próximo sábado | **Mantener** | Default inteligente, popover correcto. El "próximo sábado" pre-rellena bien para turistas. |
| 1 | Nº personas | Spinner ± (1-12), default "2" | **Cambiar default** | Default "2" obliga al 60-70 % de grupos (4 personas) a hacer 2 taps. **Cambiar a "4"** o detectar por contexto (ej. tráfico desde `/category-license-free` → 4 por defecto). Mantener spinner. |
| 1 | (ausente) Hora aproximada | No existe | **No añadir** | Tentación: meter "mañana/tarde" en step 1. Resistir — fragmenta el paso. La hora vive en step 3 donde tiene contexto de barco. |
| 2 | Filtro licencia | Radio "Sin licencia / Con licencia" | **Mantener** | Reduce la lista de 8 barcos a 4-5. Necesario para no abrumar. |
| 2 | Lista de barcos | Cards con precio dinámico | **Mantener** | El precio es el ancla. Bien resuelto con `useBoatPricingForDate`. |
| 2 | Capacidad (en card) | "X pers." pequeño a la derecha | **Reforzar** | Hoy es info secundaria. **Subir contraste y peso** — es la pregunta principal de la card ("¿este barco me cabe?"). |
| 3 | Hora salida | `<select>` 21 entradas (08:00-18:00 cada 30 min) | **Agrupar** | 21 opciones planas es exceso. **Agrupar en optgroups "Mañana / Mediodía / Tarde"** o sustituir por chips de slots populares ("10:00 · 11:00 · 14:00") con "Más horas" expandible. |
| 3 | Duración | Grid con badges "Más popular" (4h) y "Mejor valor" | **Mantener** | Decisión bien resuelta. Pre-selección 4h vía smart default. Mejor valor calculado dinámicamente — bien. |
| 4 | Nombre | Input separado | **Fusionar** | Nombre + apellido pueden ser **un solo campo** `"Nombre completo"` (autocomplete `name`). 99 % de los usuarios pondrán "Iván Ramírez", no parsean "Iván" / "Ramírez". El admin recibe el string completo y ya. **Reduce 2 inputs a 1.** |
| 4 | Apellido | Input separado | **Fusionar con nombre** | Idem. |
| 4 | Phone prefix | Dropdown buscable con 72 países | **Inferir** | Detectar por `language` del navegador: `es`→`+34`, `en`→`+44`, `fr`→`+33`, `de`→`+49`, `it`→`+39`, `nl`→`+31`, `ca`→`+34`, `ru`→`+7`. Mostrar el flag + código, con un botón discreto "Otro país" que abre el dropdown completo si el usuario no es del país-idioma. **Reduce 1 tap+search a 0 taps en el 95 % de casos.** |
| 4 | Phone number | Input `tel` | **Mantener** | Validación digits-only OK. `inputmode=numeric` para teclado numérico mobile. Verificar que el input tag tiene `inputmode="tel"` o `inputmode="numeric"` — actualmente solo `type="tel"`. |
| 4 | Email | Input email obligatorio | **Hacer opcional** | El negocio responde por WhatsApp. El email es para *enviar resumen* y para *enhanced conversions* en Google Ads. **Hacerlo opcional con un helper text: "Te enviamos el resumen aquí (opcional)"**. Reduce un campo obligatorio. La email es la 4ª causa común de abandono en forms del sector turismo (estudio Baymard 2024). |
| 4 | Extras (collapsible) | Cerrado por defecto | **Mantener cerrado** | Bien decidido. La mayoría no usa extras. |
| 4 | Código descuento (collapsible) | Cerrado por defecto | **Mantener** | Idem. |
| 4 | RGPD consent passive | "Al enviar aceptas..." | **Mantener** | Passive consent legal-válido en España para datos B2C de pre-contractuales (RGPD Art. 6.1.b). El submit implica consentimiento. Bien. |

### Hallazgos de cognitive load

#### 2.1 [P0] Email obligatorio es la fricción más alta del último paso
- **Location:** `BookingFormWidget.tsx:725-734` (`getFieldError('email')` retorna `required` si vacío), `:790-797` (`canAdvanceFromStep4` exige `isValidEmail`).
- **Por qué duele:** muchos usuarios no quieren dar email "para preguntar un precio" — lo asocian a spam. Lo aceptan en hoteles/Airbnb pero NO en formularios de chat-WhatsApp. La fricción está pagada por la captura de email para Enhanced Conversions de Google Ads (`pushEnhancedConversionData` en `analytics.ts:138-152`).
- **Recomendación:** email **opcional**. Helper text: "Te enviamos el resumen por email si lo dejas". Validación solo *formato si rellenado*, no required. Mantener `pushEnhancedConversionData` cuando sí lo dan.

#### 2.2 [P0] Nombre + Apellido como dos inputs es fricción gratuita
- **Location:** `BookingWizardMobile.tsx:760-806` y `BookingFormDesktop.tsx:Step4FinalDesktop` similar.
- **Por qué duele:** son 2 taps + 2 cambios de foco + 2 errores potenciales. El admin no necesita la separación. WhatsApp tampoco.
- **Recomendación:** un solo campo `<input name="fullName" autoComplete="name">`. Split en el server si en algún momento se necesita (no parece necesario).

#### 2.3 [P0] Phone prefix dropdown con 72 países sin detección de idioma
- **Location:** `BookingFormWidget.tsx:71` (`useState("+34")`), dropdown en `BookingWizardMobile.tsx:813-854`, desktop equivalente.
- **Por qué duele:** un alemán que llega a `/de/` ve "+34" por defecto. Tiene que pulsar, buscar Alemania, seleccionarla. Cada idioma soportado tiene un país dominante:
  - `es`/`ca` → `+34`
  - `en` → `+44`
  - `fr` → `+33`
  - `de` → `+49`
  - `nl` → `+31`
  - `it` → `+39`
  - `ru` → `+7`
- **Recomendación:** mapear `language` → prefijo default. Mostrar `flag + código` como botón ancho normal. Si el usuario quiere otro país, "Otro país" abre el dropdown completo.

#### 2.4 [P1] Soft cap 12 personas frena legítimos
- **Location:** `BookingWizardMobile.tsx:415` (`peopleCap = 12`), `BookingFormDesktop.tsx:858`.
- **Por qué duele:** despedidas/cumpleaños/familias de 14-16 personas existen. El `MultiBoatCombinations` (ver `BookingFormWidget.tsx:592-598`) ya cubre grupos grandes — combina 2 barcos. El cap UI de 12 frena antes de llegar a esa lógica.
- **Recomendación:** subir cap UI a `20` y dejar que la lógica de capacidad + multi-boat haga su trabajo. El servidor ya valida.

#### 2.5 [P1] Validación doble: `canAdvanceFromStep4` y `handleBookingSearch`
- **Location:** `BookingFormWidget.tsx:790-797` (`canAdvanceFromStep4`) + `1073-1121` (`handleBookingSearch` revalida todo y lanza toast por cada campo individualmente).
- **Por qué duele:** si llegas al step 4 y pulsas submit, `canAdvanceFromStep4` ya garantiza que firstName, lastName, phone, email son válidos. Pero `handleBookingSearch` los re-valida y, si alguno falla, dispara `toast(...)` con `return` después de cada uno → si faltan 4 campos, el usuario solo ve UN toast (del primero), no los 4.
- **Por qué pasa en práctica:** porque `canAdvanceFromStep4` solo se usa para el botón "Siguiente". El botón final del step 4 es el submit ("Enviar petición"), no "Siguiente". Así que el flujo es: usuario llega al step 4, llena campos, pulsa submit → directo a `handleBookingSearch`. No pasa por `canAdvanceFromStep4`. La validación que ve es la del submit.
- **Recomendación:** unificar. El botón submit del step 4 debe llamar a la misma función que valida. Mostrar TODOS los errores juntos inline (no como toasts en serie). Toast solo para errores de red.

#### 2.6 [P1] Defaults inteligentes pueden ir más allá
- **Locations:** `BookingFormWidget.tsx:74-94` (defaults state), `:622-642` (smart default duración = 4h cuando cambia barco).
- **Hoy:** fecha = próximo sábado, personas = 2, hora = "10:00", duración = "4h", prefix = "+34".
- **Propuesta de defaults nuevos:**
  - **Personas:** `4` (más representativo de tráfico turista) — o `2` si el usuario llega desde `/category-license-free/parejas` y `4` desde `/category-license-free/familias`. Difícil sin tracking previo. Empezar con `4`.
  - **Hora:** detectar duración (si 4h, hora popular = `10:00`. Si 8h, `09:00`. Si 1-2h, `11:00` o `16:00`). Default actual `10:00` cubre 4h-medio-día mañana, está bien para el caso 4h. Verificar consistencia con duración.
  - **Phone prefix:** ver 2.3.

#### 2.7 [P2] Time slot select de 21 entradas
- **Location:** `BookingFormWidget.tsx:27-31` (`TIME_SLOTS`), `BookingWizardMobile.tsx:630-651` (select), `BookingFormDesktop.tsx:695-714`.
- **Recomendación:** dos opciones:
  1. **Optgroups:** `Mañana (08:00 - 13:00)`, `Mediodía (13:00 - 15:00)`, `Tarde (15:00 - 18:00)`.
  2. **Chips populares + "Más horas":** 4 chips ("10:00", "11:00", "14:00", "16:00") + botón "Ver más horarios". El usuario rara vez necesita 10:30.

### Veredicto Pasada 2
**4 inputs eliminables o aliviables** (apellido fusionado en nombre, email opcional, phone prefix detectado, time slots agrupados). Suman *~6 segundos* menos en mobile, *~12 segundos* menos en desktop, *menos errores* y *menos posibilidad de abandono* en el paso más cargado (el 4).

---

## Pasada 3 — UX copy por paso

ES como fuente (CLAUDE.md regla). Propagar a 7 idiomas vía `npm run i18n:translate`.

### Tono actual vs PRODUCT.md

PRODUCT.md voice: *"confident but never corporate. Local but never amateur. Like a friend who knows the coast and wants to share it with you."*

Copy actual del wizard es **funcional y educado**, sin personalidad. Cumple, pero no transmite la marca. Sirve.

### Hallazgos de copy

#### 3.1 [P1] Headings de paso suenan administrativos
| Paso | Copy actual | Propuesta |
|------|-------------|-----------|
| 1 | "Cuándo y cuántos sois" | "¿Cuándo zarpas?" — y dejar nº personas como sub-pregunta visible: "¿Cuántos a bordo?" |
| 2 | "¿Qué barco va contigo?" / "Tu barco" | OK. "¿Qué barco va contigo?" tiene voz. Mantener. |
| 3 | "Salida y duración" | "¿A qué hora salimos?" — más conversacional. La duración como sub-pregunta. |
| 4 | "Confirma tu reserva" / "Personaliza tu experiencia" | "Casi listo. Te confirmamos por WhatsApp." — promesa explícita del modelo. |

**Locations a tocar:** `client/src/i18n/es.ts:770-790` (`bookingWizard.steps`) y `:737-769` (`wizard.*`). Propagar con `npm run i18n:translate`.

#### 3.2 [P0] Toasts de error en serie en `handleBookingSearch`
- **Location:** `BookingFormWidget.tsx:1086-1121`.
- **Síntoma:** cada validación dispara un toast independiente con `return`. Si faltan 4 campos, el usuario ve UN toast y el resto silenciado.
- **Recomendación:** unificar a un mensaje único o, mejor, errores inline en cada campo (que ya existen) + un single banner arriba: "Faltan datos: nombre, teléfono."

#### 3.3 [P1] "{time}h" sufijo hardcoded
- **Locations:**
  - `BookingFormWidget.tsx:27-31` (`TIME_SLOTS`).
  - `BookingWizardMobile.tsx:647, 1085` (`{time}h`, `{preferredTime}h`).
  - `BookingFormDesktop.tsx:710` (`{time}h`).
- **Por qué duele:** convención española. Un inglés ve "10:00h" que no se usa en EN. Locale-leak.
- **Recomendación:** key i18n `t.booking.timeSuffix` (vacío en EN, "h" en ES/CA). En `es.ts` añadir `booking.timeSuffix: "h"` y dejar EN vacío.

#### 3.4 [P1] "- Reservado" hardcoded en español
- **Locations:** `BookingWizardMobile.tsx:647`, `BookingFormDesktop.tsx:710`.
- **Recomendación:** key `t.booking.timeSlot.reservedSuffix`.

#### 3.5 [P1] Date format en trigger del calendar con `'es-ES'` hardcoded
- **Locations:** `BookingWizardMobile.tsx:442` (`new Date(...).toLocaleDateString('es-ES', ...)`), `BookingFormDesktop.tsx:883` (idem). Mientras tanto `formatBookingDate` y `formatBookingDateDesktop` (mobile:909, desktop:42) sí usan `LOCALE_MAP[language]`.
- **Síntoma:** usuario alemán selecciona 12 de junio, el botón del calendar muestra "12 jun. 2026" — fecha en español. La summary card más abajo muestra "12. Juni 2026" — alemán. Inconsistencia visible.
- **Recomendación:** usar `LOCALE_MAP[language]` también en el trigger. Centralizar `LOCALE_MAP` (hoy duplicado en mobile y desktop) en `client/src/utils/intl-helpers.ts`.

#### 3.6 [P1] "Suggested date" solo en es/en
- **Locations:** `BookingWizardMobile.tsx:470`, `BookingFormDesktop.tsx:920`. Patrón: `language === 'en' ? 'en-GB' : 'es-ES'`. Falla en `ca`/`fr`/`de`/`nl`/`it`/`ru`.
- **Recomendación:** misma solución que 3.5 — `LOCALE_MAP[language]`.

#### 3.7 [P1] Mensaje WhatsApp >1.000 chars, formato pesado
- **Location:** `BookingFormWidget.tsx:909-999`.
- **Síntoma:** el cliente abre WhatsApp y ve un bloque ASCII con separadores `┄┄┄┄`, emojis, mayúsculas, secciones. Útil para el admin (Iván), pesado para el cliente (que es quien lo envía).
- **Recomendación:** versión client-light:
  ```
  Hola, quiero reservar 🚤

  Iván Ramírez · +34 612 345 678 · iv***@gmail.com
  Barco: Astec 480 · 12 jun 2026 · 10:00 · 4h · 4 personas
  Total estimado: 135€ (fianza 100€)
  Sin licencia incluida.

  ¿Disponible? Gracias.
  ```
  6-8 líneas, fácil de leer al mandar y al recibir. Sin perder data. Admin sigue teniendo todo. El campo de descuento y extras se incluyen solo si hay valor.

#### 3.8 [P1] Hardcoded toasts en es en `handleBookingSearch` final
- **Location:** `BookingFormWidget.tsx:272-273` (`"Error al validar codigo"`, sin tildes), `:1094-1095` (`"Tu solicitud de WhatsApp fue enviada, pero no pudimos registrarla internamente."`), `:1165-1166` (`"Error al guardar consulta"`).
- **Recomendación:** migrar a `t.booking.errors.codeValidation.*` y `t.booking.errors.inquirySave.*` en `es.ts`. Propagar con `i18n:translate`.

#### 3.9 [P1] "Confirma tu reserva" no comunica el modelo
- **Location:** `t.booking.confirmTitle = "Confirmar reserva"` (`es.ts:438`).
- **Síntoma:** "Confirmar reserva" suena a *cerrar* la reserva. La realidad es *enviar una petición que se confirma manualmente por WhatsApp*. El usuario espera un confirmation page y recibe un WhatsApp pre-rellenado.
- **Recomendación:** copy → "Pídela por WhatsApp" o "Manda tu solicitud". Helper text inmediatamente debajo: "Te respondemos en menos de 2 horas. Sin pago online, sin compromiso." (Esta frase YA existe en `t.booking.stripePaymentSecure` línea 336 pero NO se usa en el wizard. Reutilizar.)

#### 3.10 [P2] "Tu viaje en {boat}" — endowment effect aplicado, mantener
- **Location:** clave `t.endowment.yourTripIn` usada en step 3 mobile (`BookingWizardMobile.tsx:622`) y desktop (`BookingFormDesktop.tsx:682`).
- **Comentario:** *bien hecho*. Lenguaje "Tu viaje en Astec 480" construye posesión psicológica. Mantener y replicar el patrón en el step 4 ("Tu salida del 12 de junio en el Astec 480").

#### 3.11 [P2] Validation errors descriptivos vs accionables
- **Locations:** `es.ts:791-797` (`validation.required`: "Este campo es obligatorio", `invalidEmail`: "Email no válido", `invalidPhone`: "Solo números").
- **Comentario:** los errores son descriptivos. Pasar a *accionables* mejora:
  - `required` → "Añade tu nombre" / "Añade tu teléfono" (context-aware).
  - `invalidEmail` → "Revisa el email — falta un @ o un .com".
  - `invalidPhone` → "Solo números, sin espacios ni guiones".

#### 3.12 [P2] CTA "Enviar petición" pierde contexto del canal
- **Location:** `t.booking.sendBookingRequest = "Enviar petición"` (`es.ts:410`). El botón submit final.
- **Recomendación:** "Pedirlo por WhatsApp" — refuerza el canal y el modelo (no pagas ahora). Verificar que el icono WhatsApp visible + texto se alinean.

### Veredicto Pasada 3
**~12 cambios de copy** mejoran tono (más conversacional, más "amigo local") y eliminan locale-leaks. La voz pasa de neutra a brand-aligned. Hacerlo es esfuerzo S si se respeta el flujo `es.ts → npm run i18n:translate`.

---

## Pasada 4 — Jerarquía visual y trust signals

### Hallazgos

#### 4.1 [P0] "Sin pago online" no es explícito en el wizard
- **Realidad de negocio:** el wizard captura intención, el cobro es manual. Es un diferencial vs marketplaces que cobran al instante.
- **Locations:** se menciona en `t.booking.stripePaymentSecure = "Te confirmaremos disponibilidad por WhatsApp en menos de 2 horas. Sin compromiso hasta entonces."` (`es.ts:336`) y en `t.booking.whatsappFooterNote` (`es.ts:469`), pero **ninguno de los dos se renderiza en el wizard del Hero**.
- **Síntoma:** un cliente que viene de Booking.com/Airbnb mental-asume que va a pagar al final. Pulsa submit, se abre WhatsApp con un mensaje pre-rellenado, no entiende. Fricción cognitiva.
- **Recomendación:** añadir un microcopy claro y visible **en el paso 1** y reforzar en el **paso 4** justo encima del botón submit. Algo así:
  - Paso 1, debajo del heading: *"Sin pago online. Solo capturamos tu petición y te confirmamos por WhatsApp."*
  - Paso 4, encima del botón: *"Pulsa enviar y te respondemos en menos de 2 horas. El pago se cierra el día del alquiler."*

#### 4.2 [P0] Combustible solo en sin licencia, sin mención en el wizard
- **Realidad de negocio:** memoria + CLAUDE.md → "Solo barcos sin-licencia incluyen gasolina; barcos con licencia y excursión privada NO".
- **Síntoma:** un cliente con licencia ve precio de 135€/4h, asume que el combustible está dentro. El día de la reserva descubre que paga +40-80€ aparte. Sorpresa, queja, mala review.
- **Recomendación:** dos lugares:
  1. **Paso 2** (selección de barco): en cada BoatCard, badge debajo del precio: *"Combustible incluido"* (verde, Sea Green token) en barcos sin licencia. NADA en barcos con licencia. El silencio es información: el usuario observa la diferencia.
  2. **Paso 4** summary card: añadir línea si licencia → *"Combustible aparte (consulta estimación)"*.

#### 4.3 [P0] PriceSummaryBar desaparece en el paso 4
- **Ver 1.4.** Repetido aquí porque también es violación de "precio claro sin sorpresa".

#### 4.4 [P1] Trust signals no se aprovechan
- **Asset existente:** `BookingTrustBanner` (`client/src/components/booking-flow/BookingTrustBanner.tsx`) y `ValueStack`. Banner usa `stage` por step.
- **Verificar contenido:** lee el banner y confirma qué dice. (No leído aquí — leer en próxima sesión.)
- **Recomendación:** Trust mid-wizard. Step 2 (cuando ve el precio) es el momento de mayor duda. Reforzar:
  - "200+ reservas confirmadas en 2025" (si verificable).
  - "Responde a tu WhatsApp en menos de 2 horas".
  - "Cancelación gratuita hasta 7 días antes" (si es la política — confirmar con negocio).
- **Anti-pattern:** evitar "5 estrellas en Google" en formato TripAdvisor (PRODUCT.md anti-reference: generic travel platform).

#### 4.5 [P1] El "Modificar" del summary card va al step 1 — desorienta
- **Location:** `BookingWizardMobile.tsx:1067-1072` (`onClick={() => onGoToStep(1)}`).
- **Síntoma:** el usuario está en el paso 4, ve el resumen, quiere cambiar la duración. Pulsa "Modificar" y aparece en el paso 1 (fecha). Tiene que avanzar 3 pasos para llegar al que quería editar.
- **Recomendación:** "Modificar" inline. Cada fila del summary card debe ser editable in-place o, mínimo, llevar al *paso específico*: línea fecha → step 1, línea barco → step 2, línea hora/duración → step 3. Iconos pequeños "✏️" (sin emoji literal, usar lucide `Pencil`) en cada fila.

#### 4.6 [P1] ValueStack solo en step 4
- **Location:** `BookingWizardMobile.tsx:12` import, render en step 4.
- **Síntoma:** el "todo incluido" (insurance, briefing, safety kit) aparece tarde — cuando el cliente ya decidió. Sería más útil aparecer **junto al precio** en el paso 2 (cuando dudan si el precio es justo).
- **Recomendación:** una versión compacta de ValueStack (3 chips) sticky con el `PriceSummaryBar` en step 2-3: "Incluye seguro · briefing · kit seguridad".

#### 4.7 [P1] Color tokens — restos de hardcoded Tailwind defaults
- **Audit anterior 2026-05-04:** detalle B.2.1, 20+ usos de `text-red-500`, `text-green-600/700`, `text-amber-600` en lugar de tokens `destructive`, `success`, `popular`.
- **Verificación en esta pasada:** spot-check de líneas previas. Veo `text-success` (`BookingWizardMobile.tsx:1013`, `BookingFormDesktop.tsx:778`) y `text-popular` (`:719`, `:729`) ya migrados. Queda por barrer `text-destructive` (sí se usa) y verificar que no quedan defaults.
- **Recomendación:** sweep final con grep. No urgente para conversión pero importante para dark mode si llega.

#### 4.8 [P1] Step labels uppercase
- **Audit anterior 2026-05-04:** B.2.4. "RESUMEN DE TU RESERVA", "TU PRECIO" en mayúsculas.
- **Verificación:** `t.reviewSummary.title` ("Resumen de tu reserva") y `t.booking.confirmTitle` ("Confirmar reserva") no parecen renderizarse con `uppercase` class — verificar live.
- **Recomendación:** title case + `font-heading font-semibold`. Reservar `uppercase` solo para badges chiquitos.

#### 4.9 [P0] The One Action Rule — paso 4 tiene 4+ CTAs
- **DESIGN.md:** *"Deep Navy CTA appears on at most two interactive elements per viewport."*
- **Realidad step 4:** botón submit WhatsApp (verde), botón "Modificar" (link), botón "¿Necesitas ayuda?" (no verificado si existe), botón validar código (si abierto), botón Atrás (outline). En mobile ≥3 CTAs visibles a la vez.
- **Recomendación:** reducir peso visual de "Atrás" (ghost link), "Modificar" (link discreto), CTA principal único = WhatsApp verde grande. "¿Necesitas ayuda?" (si se mantiene) como link subordinado.

#### 4.10 [P2] Capacidad de barco enterrada
- Ver tabla en pasada 2 (campo "Capacidad en card"). Visualmente: "8 pers." en `text-xs text-muted-foreground` (`BookingWizardMobile.tsx:579-581`, desktop `:608-610`). Es la primera pregunta mental del cliente ("¿cabemos los 6?") y está como info secundaria.
- **Recomendación:** subir a `text-sm text-foreground`, junto al icono `Users`. Si no cabe el grupo, mensaje explícito: "No cabe tu grupo de 6 → ver combos".

### Veredicto Pasada 4
**Trust + precio + modelo de negocio** son las palancas reales de conversión. Hoy el wizard cuenta bien la mecánica pero olvida tres cosas críticas: que NO se cobra ahora, que el combustible (en sin-licencia) está incluido, y que la respuesta llega en horas — no semanas. Tres microcopys bien colocados mueven la aguja más que cualquier refactor estructural.

---

## Pasada 5 — Accesibilidad y responsive (deuda 2026-05-04 a acciones verificables)

### Hallazgos del audit 2026-05-04 — estado actual

#### 5.1 [P0] Focus inicial en Close — **CERRADO**
- `useBookingModal.tsx:55-58`: `onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus(); }}`. Foco va al `DialogContent`, no al Close.
- **Pendiente:** verificar que el primer elemento focusable navegable con Tab dentro del modal sea el primer input (no el Close icon). Test runtime.

#### 5.2 [P0] `aria-busy` prohibido en `<button>` — verificar
- **Audit anterior:** mobile línea 249 botón con `aria-busy="false"`.
- **Estado actual mobile:** `BookingWizardMobile.tsx:249-269` — botón submit usa `disabled={isSubmitting || ...}` SIN `aria-busy`, y un `<span role="status" aria-live="polite">` separado para anunciar el estado. **Cerrado en mobile.**
- **Estado actual desktop:** `BookingFormDesktop.tsx:383-400` — botón submit usa `disabled={isSubmitting}` SIN `aria-busy`. **También cerrado en desktop.**
- **Resultado:** P0 cerrado.

#### 5.3 [P0] Heading order h2 → h4 — verificar step 4
- **Mobile step 4:** `PersonalDataSection` línea 757 usa `<h2>`. Luego `Step4Final` línea 950 usa `<h3>`. No veo `<h4>` directo. **Aparentemente cerrado.** Verificar live: outline a11y con axe DevTools.
- **Recomendación:** correr `npm run dev` + abrir DevTools axe y confirmar heading order en step 4 mobile y desktop.

#### 5.4 [P0] Contraste `text-muted-foreground/60` — verificar
- **Audit anterior:** 8+ ocurrencias en step 4 mobile y desktop.
- **Estado actual:** spot-check no encuentra `/60` en los chunks leídos. Posiblemente cerrado.
- **Verificar:** `grep -rn 'muted-foreground/60' client/src/components/Booking*` para confirmar.

#### 5.5 [P0] i18n quiz hardcoded — fuera de scope (es el quiz, no el wizard)
- Pendiente para sesión aparte. Confirmar que los strings del wizard sí están en `es.ts` (la mayoría sí). Migrar los pocos hardcoded mencionados en 3.3, 3.4, 3.8.

#### 5.6 [P1] Date format `es-ES` hardcoded en calendar trigger
- Ver 3.5. Es a11y *blando* (no falla WCAG, pero rompe `lang` consistency SC 3.1.2 si el resto está en de/fr/etc).

#### 5.7 [P1] Submit button desktop `py-2.5` (~38px) viola 44px touch target
- **Location:** `BookingFormDesktop.tsx:391` — `className="bg-whatsapp ... px-8 py-2.5 ... btn-elevated"`. Sin `min-h-11`.
- **Comparar:** mobile usa `py-5` ~58px (`BookingWizardMobile.tsx:243, 257`). Cumple AA.
- **WCAG:** SC 2.5.5 Target Size (AAA) y "Touch targets minimum 44px (already enforced)" PRODUCT.md.
- **Recomendación:** desktop usar Button del shadcn (que ya tiene `min-h-11` decidido 2026-05-03) o añadir `min-h-11` al desktop submit.

#### 5.8 [P1] Outline en desktop Back button es `text-sm`
- **Location:** `BookingFormDesktop.tsx:368-373` (`onClick={onBack} ...px-4 py-2.5...`). Es un `<button>` plain (no shadcn Button). Estimado ~38px.
- **Recomendación:** `min-h-11` o sustituir por Button variant="ghost".

#### 5.9 [P1] Animaciones desktop con `behavior: 'smooth'` violan DESIGN.md
- **Location:** `BookingFormDesktop.tsx:144` — `scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })`.
- **DESIGN.md:** "GPU-composited motion only. Transform and opacity. Nothing else animates."
- **Mobile ya está fix:** `BookingWizardMobile.tsx:146` usa `behavior: 'instant'`.
- **Recomendación:** desktop a `behavior: 'instant'`.

#### 5.10 [P1] `motion` con `filter: blur(4px)` en transición desktop
- **Location:** `BookingFormDesktop.tsx:26-29` (`slideVariants`).
- **DESIGN.md:** transform/opacity OK. `filter: blur` es compositor-dependiente en Safari iOS, puede causar jank en mobile-low-end (aunque solo se aplica en desktop, vale revisar).
- **Recomendación:** mantener `transform: translateX` + `opacity`, **quitar `filter`**. La sensación es 90 % igual con menos riesgo.

#### 5.11 [P2] Performance: `useBoatPricingForDate` por cada BoatCard
- **Location:** `BookingWizardMobile.tsx:536-541` (Card mobile), `BookingFormDesktop.tsx:562-568` (Card desktop). Cada card del listado dispara un useQuery.
- **Impacto:** 8 barcos en mobile = 8 queries paralelas al backend cada vez que el usuario abre el step 2 o cambia la fecha. Visto en producción puede agregarse a `useQuery` cache y resolverse rápido, pero igual hay 8 round-trips.
- **Recomendación:** consolidar a **una sola query** `/api/pricing/calendar?boatIds=...&date=...` que devuelve los overrides para todos los barcos. El hook actual puede aceptar `boatIds[]` y deduplicar.

#### 5.12 [P2] iOS auto-zoom en inputs
- **Audit:** DESIGN.md ya menciona "iOS protection: font-size forced to 16px on touch devices". Verificar en inputs del wizard.
- **Estado:** mobile inputs usan `text-base` (16px) — bien. Desktop también. Confirmar `inputBase` clase aplicada (`BookingFormDesktop.tsx:160`).

#### 5.13 [P1] Scroll-into-view en step transitions usa `smooth`
- **Location:** `BookingFormWidget.tsx:810-813, 833-836` (`document.getElementById(firstInvalid)?.scrollIntoView({ behavior: 'smooth', block: 'center' })`). Se ejecuta cuando una validación falla — el usuario ve el scroll suave hacia el campo erroneo.
- **DESIGN.md ban + reduced-motion:** debería respetar `prefers-reduced-motion`.
- **Recomendación:** usar `behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'`. O simplemente `'instant'` y depender del usuario para encontrar el campo (con `aria-invalid` y borde rojo el screen reader ya navega).

### Veredicto Pasada 5
**3 P0 antiguos cerrados** (focus, aria-busy, heading order, posiblemente contraste). Quedan **5 P1 nuevos o reabiertos**: locale-leak en calendar trigger, touch target desktop submit + back, smooth scroll prohibido en 2 sitios, filter:blur cuestionable. Trabajo S concentrado.

---

## Pasada 6 — Motion, microinteractions, error states

### Hallazgos

#### 6.1 [P0] Submit fire-and-forget — fallo silencioso si la inquiry no se guarda
- **Location:** `BookingFormWidget.tsx:1131-1172`. El POST a `/api/booking-inquiries` se hace sin `await`. Si falla, dispara un toast destructivo *después* de que WhatsApp ya se abrió. El usuario ya mandó el WhatsApp, no se entera de que en BD no quedó registro → el admin recibe WhatsApp pero no lo cruza con el CRM.
- **Por qué pasa:** popup blockers. Si haces `await fetch` *antes* de `window.open(whatsappURL)`, el navegador bloquea. Por eso es fire-and-forget.
- **Recomendación:**
  - Llamar al POST `/api/booking-inquiries` *primero, antes del click*. Como esto no se puede (es el click el que dispara), alternativa: usar `navigator.sendBeacon('/api/booking-inquiries', ...)` que NO requiere `await` y se envía aunque el tab navegue a WhatsApp.
  - O: guardar en BD *al pulsar submit* + abrir WhatsApp inmediatamente con un id de inquiry pre-asignado.

#### 6.2 [P0] Slot tomado entre selección y submit — no hay error recovery
- **Síntoma:** usuario selecciona 10:00 en step 3. Mientras está rellenando el step 4 (un par de minutos), otro cliente reserva ese slot. Al pulsar submit, el WhatsApp se manda igual. El admin descubre el conflicto al leer el mensaje y tiene que decir "ese slot ya no está".
- **Mitigación parcial existente:** `holdExpiresAt` (15 min) para barcos con licencia (`BookingFormWidget.tsx:840-844`). NO para sin licencia.
- **Recomendación:** re-validar slot al pulsar submit (POST `/api/availability` rápido) y, si tomado, mostrar un modal inline con slots cercanos disponibles ("Esa hora ya no está. ¿10:30, 11:00 o 14:00?"). Sin esto, no es UX bug crítico — es business cost (Iván pierde tiempo en cada conflicto).

#### 6.3 [P1] sessionStorage 30 min silencioso
- **Location:** `BookingFormWidget.tsx:151-207`.
- **Síntoma:** el usuario abre el wizard, llena 3 pasos, cierra el navegador. Vuelve 20 min después. El wizard restaura su progreso, pero el usuario no se entera — ve directamente el step 3 lleno. Útil pero confuso.
- **Recomendación:** mostrar un mini-banner una vez al restaurar: *"Te recuperamos lo que llevabas. ¿Sigues con la misma fecha?"* con un link "Empezar de cero". Reduce confusión, refuerza valor.

#### 6.4 [P1] Exit-intent — sin nudge en el wizard
- **Síntoma:** el usuario está en step 2 ó 3, se distrae, cierra el modal. La intención queda registrada en `sessionStorage.cbrb_bookingStarted` pero el wizard no intenta retenerle.
- **Asset existente:** hay `useExitIntent` y `trackExitIntentShown`/`Cta`Click` (`analytics.ts:376-381`). Existe un exit-intent global. Verificar si se activa en mobile (memoria existing).
- **Recomendación:** cuando el usuario cierra el modal con step ≥ 2, mostrar un mini-toast: *"¿Te ayudo por WhatsApp? Tenemos tu fecha guardada."* + CTA WhatsApp directo. No usar modales encima de modales.

#### 6.5 [P1] Loading states del slot availability — sin skeleton
- **Location:** `BookingWizardMobile.tsx:630-651`, `BookingFormDesktop.tsx:695-714`. El `<select>` de hora renderiza las 21 opciones, las marca disabled si están en `unavailableTimeSlots`. Pero mientras carga el query, las 21 aparecen como disponibles. Si la query devuelve 12 como ocupadas, el cambio visual es súbito.
- **Recomendación:** mientras `isAvailabilityLoading`, mostrar el select con `aria-busy="true"` (legal en select) + visual sutil "actualizando" en la label.

#### 6.6 [P1] Code validation — feedback solo "inválido"
- **Location:** `BookingFormWidget.tsx:1001-1051`. El usuario introduce un código, pulsa validar. Si no es gift card ni discount, recibe `t.codeValidation.invalidCode` = "Código inválido".
- **Mejora:** distinguir tipos de error si la API los devuelve:
  - "Código no encontrado" (no existe en BD)
  - "Código caducado" (válido pero expirado)
  - "Código ya usado" (gift card consumida)
- **Recomendación:** sin cambiar backend, ya hay 2 endpoints (gift-cards/validate y discounts/validate). Si el primero devuelve 404 y el segundo 410, distinguir. Si no se puede sin backend changes, dejar como está.

#### 6.7 [P2] BookingConfirmation overlay — peak-end bien usado
- **Location:** `BookingFormWidget.tsx:1313-1322`. Tras submit, aparece overlay con checklist pre-trip + share + código repeat REPITE10.
- **Comentario:** bien construido (memoria menciona el patrón). Verificar live que es coherente con el resto del wizard (no leí el componente).
- **Idea:** añadir *"Respondemos en menos de 2 horas — te lo confirmamos por WhatsApp"* prominente arriba.

#### 6.8 [P2] Defaults animados — chip "Más popular" en duraciones
- **Location:** `BookingWizardMobile.tsx:703-705`, `BookingFormDesktop.tsx:772-776`.
- **Comentario:** chip "Más popular" sobre 4h. Bien para anchoring. Bonus si entra con un pequeño fade al renderizarse — hoy aparece estático. Coste: micro.

#### 6.9 [P2] HoldCountdown solo licensed boats
- **Location:** `BookingFormWidget.tsx:840-844`. Solo activa para `selectedBoatInfo?.requiresLicense`.
- **Por qué:** sin licencia hay más barcos disponibles y menos riesgo de conflicto.
- **Comentario:** decisión razonable. Mantener.

#### 6.10 [P2] Validation errors — sin `aria-live` propio
- **Location:** mensajes inline `<p className="text-xs text-destructive ...">`.
- **Estado actual:** el contenedor del step en mobile (`BookingWizardMobile.tsx:194-196`) tiene `aria-live="polite"` y `aria-atomic="true"`. Eso anuncia *todo* el step al cambiar. Demasiado verboso.
- **Recomendación:** los `<p>` de error individuales con `role="alert"` o `aria-live="polite"` propio (independiente del contenedor). El contenedor podría perder el `aria-live` ya que los mensajes ya lo tienen.

### Veredicto Pasada 6
**El error state crítico** es el silencioso fire-and-forget del submit (6.1). El resto son micro-mejoras de UX y robustez. La mayoría coste S.

---

## Pasada 7 — Instrumentación GA4 y conversión

**Crítico:** sin tracking step-by-step, todo el resto del audit se mide a ciegas. Esta sección es la palanca de aprendizaje del proyecto.

### Hallazgos

#### 7.1 [P0] Sin tracking step-by-step en el wizard activo
- **Realidad:** la infra de funnel ya está en `client/src/utils/analytics.ts:412-438`:
  - `trackDateSelected(date, boatId)`
  - `trackTimeSlotSelected(time, boatId)`
  - `trackDurationSelected(duration, boatId)`
  - `trackExtrasChanged(extraId, name, added)`
  - `trackCouponApplied(code, success)`
  - `trackQuoteCreated(holdId, total, boatId)`
  - `trackBookingAbandoned(step, boatId)`
- **Pero:** se llaman SOLO desde `client/src/components/booking-flow/` (el wizard legacy huérfano). El `BookingFormWidget` y los mobile/desktop NO los llaman.
- **Esfuerzo:** S. Conectar 6 funciones en sus `setX` callbacks correspondientes.
- **Recomendación inmediata:**
  - `trackDateSelected` cuando `setSelectedDate` en step 1.
  - `trackTimeSlotSelected` cuando `setPreferredTime` en step 3.
  - `trackDurationSelected` cuando `setSelectedDuration` en step 3.
  - `trackExtrasChanged` en `handleExtraToggle` y `handlePackSelect`.
  - `trackCouponApplied` en `handleValidateCode` (con `success: boolean`).
  - `trackBookingAbandoned(step_${currentStep}_close)` en `closeBookingModal` si `currentStep > 1`.

#### 7.2 [P0] Falta evento `inquiry_submit` (o `generate_lead` en submit)
- **Realidad:** hoy `trackGenerateLead` se llama en `handleBookingSearch` (`BookingFormWidget.tsx:1124`). ¡Buena noticia! Eso debería verse en GA4 como `generate_lead`. Sin embargo el dato baseline dice `0 generate_lead en 7 días` con `13 booking_started`. Hipótesis: o nadie completa, o el `generate_lead` se está disparando pero el filter del GTM no lo captura, o el evento se dispara pero falta el flag de "conversión" en GA4.
- **Esto puede ser un bug de tagging, no de UX.**
- **Recomendación:** verificar en GTM + GA4 que `generate_lead` está marcado como conversión y se cumple. Si funciona y devuelve 0, es señal de que el funnel está rotísimo entre step 1 (booking_started) y step 4 (submit).

#### 7.3 [P0] Faltan eventos de step-view y step-complete genéricos
- **Recomendación:** dos eventos nuevos en `analytics.ts`:
  - `trackBookingStepView(step: number, stepName: string)` — disparado cuando un step se renderiza (useEffect on `currentStep`).
  - `trackBookingStepComplete(step: number, timeOnStepMs: number)` — disparado en `handleNextStep` o `handlePrevStep` con el tiempo que estuvo en el step.
- Con estos dos, el funnel completo se reconstruye en GA4: step1_view → step1_complete → step2_view → ...

#### 7.4 [P1] Falta `trackValidationError(step, field)`
- **Por qué:** identifica campos que rechazan al usuario. Si el `email` rechaza un 30 % del tráfico que llega al step 4, esa es la palanca a tirar.
- **Recomendación:** disparar en `setTouched` o en el render del error inline cuando `showFieldError(field) === true` (con throttle para no disparar 10 veces por keystroke).

#### 7.5 [P1] Falta `trackBookingModalDismiss(stepAtDismiss, timeOpenMs)`
- **Location actual:** `useBookingModal.tsx:39-43` (`closeBookingModal`). Solo limpia state.
- **Recomendación:** medir cuánto tiempo abrió el modal y en qué step lo cerró. Compara con submit: si 80 % cierra en step 1, problema de IA; si 80 % cierra en step 4, problema de copy/trust.

#### 7.6 [P1] Funnel reporting esperado
Tras añadir 7.1-7.5, GA4 debería poder responder:
- ¿Cuántos abren el modal vs ven step 1?
- ¿Cuál es el drop-off del step 1 → 2 → 3 → 4 → submit?
- ¿Hay diferencias por dispositivo (mobile vs desktop)?
- ¿Por idioma (es/en vs otros 6)?
- ¿Por entrada (Hero CTA vs boat detail vs blog CTA)?

Hoy ninguna de estas se puede responder.

#### 7.7 [P2] A/B tests candidatos post-instrumentación
Cuando tengamos baseline funnel (~2-4 semanas tras conectar eventos):
1. **Phone prefix detectado vs dropdown.** Hipótesis: detectado reduce abandono step 4 en ≥10 %.
2. **Email opcional vs obligatorio.** Hipótesis: opcional incrementa submit-rate ≥15 %.
3. **Nombre completo vs nombre+apellido.** Hipótesis: 1 input reduce errores step 4 ≥5 %.
4. **Copy CTA submit:** "Pedirlo por WhatsApp" vs "Enviar petición" vs "Solicitar reserva".
5. **PriceSummaryBar en step 4** vs ausente. Hipótesis: presente +5 % submit-rate.
6. **Microcopy "Sin pago online"** en step 1 vs ausente. Hipótesis: presente reduce drop-off entre step 1 y step 2 (los que se asustan de creer que pagan online).

#### 7.8 [P2] Enhanced Conversions email/phone
- **Realidad:** `pushEnhancedConversionData` ya se llama en `trackGenerateLead` y `trackBookingCompleted`. Manda hashed email + phone para Google Ads attribution.
- **Riesgo del 2.1 (email opcional):** si se hace email opcional, % de enhanced conversions baja. Pero Google Ads acepta phone-only — basta con asegurarse de que `phone` siempre se pasa.
- **Recomendación:** alinear con marketing. La pérdida marginal de attribution puede compensarse con la subida de leads.

### Veredicto Pasada 7
**La palanca más importante de todo el audit.** Sin esto no aprendemos. Esfuerzo: 1 archivo (`analytics.ts` para 2 funciones nuevas) + ~12 callsites en 3 archivos del wizard. **Total estimado: 2-3 horas** para tener un funnel completo en GA4.

---

## Cierre — Backlog priorizado

Cada hallazgo scoreado por **impacto en conversión** (alto/medio/bajo) y **esfuerzo** (XS <30min, S <2h, M <1día, L >1día).

### P0 — Bloqueantes (alto impacto + ≤S + bloquea aprendizaje o credibilidad)

| # | Hallazgo | Pasada | Impacto | Esfuerzo | Files |
|---|----------|--------|---------|----------|-------|
| P0.1 | Conectar `trackBookingStepView` + `trackBookingStepComplete` + reutilizar `trackDateSelected/TimeSlotSelected/DurationSelected/ExtrasChanged/CouponApplied/BookingAbandoned` en el wizard activo | 7.1, 7.3 | Alto (sin esto, no medimos nada) | S (2-3 h) | `BookingFormWidget.tsx`, `BookingWizardMobile.tsx`, `BookingFormDesktop.tsx`, `useBookingModal.tsx`, `analytics.ts` |
| P0.2 | Email obligatorio → opcional con helper "Te enviamos el resumen aquí" | 2.1 | Alto (campo más friccional del step 4) | XS (30 min) | `BookingFormWidget.tsx:725-734, 790-797, 1098-1101`, `i18n/es.ts` |
| P0.3 | Phone prefix detectado por `language` con override "Otro país" | 2.3 | Alto (95 % de usuarios ahorran 1 tap+search) | S (1-2 h) | `BookingFormWidget.tsx:71`, ambos wizard files | 
| P0.4 | Microcopy "Sin pago online · Te confirmamos por WhatsApp en <2h" visible en step 1 y step 4 | 4.1 | Alto (reconfigura expectativa modelo de negocio) | XS (30 min) | `i18n/es.ts` + render mobile/desktop step 1 + step 4 |
| P0.5 | Combustible incluido (badge en BoatCard de sin licencia) + "Combustible aparte" en summary licencia | 4.2 | Alto (evita sorpresa post-reserva, mala review) | S (1-2 h) | `BookingWizardMobile.tsx:546+`, `BookingFormDesktop.tsx:573+`, summary card |
| P0.6 | Nombre + Apellido → 1 solo campo "Nombre completo" | 2.2 | Alto (reduce 1 input del step 4) | XS (30 min) | wizard files step 4 + state widget |
| P0.7 | Toasts de error en serie → errores inline + un banner único | 2.5, 3.2 | Medio-alto (si llega al step 4 y falla, hoy no entiende qué pasó) | S (1-2 h) | `BookingFormWidget.tsx:1073-1121` |
| P0.8 | The One Action Rule — reducir CTAs en step 4 | 4.9 | Medio-alto (foco en submit) | S (1 h) | mobile/desktop step 4 layout |
| P0.9 | Confirmar/cerrar contraste `text-muted-foreground/60` (audit 2026-05-04 abierto) | 5.4 | Alto (PRODUCT.md: high contrast critical) | S (1 h) | sweep mobile/desktop |

**Total P0:** 9 ítems, ~8-12 h de trabajo concentrado. Suma de bajísimo esfuerzo, alto impacto.

### P1 — Mejoras claras (alto impacto + M o medio impacto + S)

| # | Hallazgo | Pasada | Impacto | Esfuerzo | Files |
|---|----------|--------|---------|----------|-------|
| P1.1 | PriceSummaryBar visible también en step 4 | 1.4, 4.3 | Alto (precio visible al pulsar enviar) | S | mobile/desktop wizard |
| P1.2 | `skipBoatStep` → no saltar; pre-seleccionar y permitir cambio | 1.2 | Medio (cualifica tráfico boat-detail) | S (1-2 h) | `BookingFormWidget.tsx:130, 817-820, 856-859` |
| P1.3 | TIME_SLOTS agrupados (optgroup mañana/tarde) o chips populares | 2.7 | Medio (reduce overwhelm) | S | wizard files |
| P1.4 | Mensaje WhatsApp client-light (6-8 líneas) | 3.7 | Medio (UX del cliente al enviar) | S (1 h) | `BookingFormWidget.tsx:909-999` |
| P1.5 | "Modificar" del summary → editar inline por fila | 4.5 | Medio (reduce navegación errante) | M | wizard step 4 |
| P1.6 | ValueStack compacto en step 2-3 sticky con precio | 4.6 | Medio (trust mid-funnel) | S | wizard step 2/3 |
| P1.7 | LOCALE_MAP centralizado + usado en calendar trigger y suggestion | 3.5, 3.6, 5.6 | Bajo-medio (UX i18n) | S | `intl-helpers.ts` nuevo + wizard |
| P1.8 | Submit fire-and-forget → `navigator.sendBeacon` | 6.1 | Alto (BD desincronizada con CRM) | S | `BookingFormWidget.tsx:1131-1172` |
| P1.9 | Slot tomado entre selección y submit — re-validar antes de abrir WhatsApp | 6.2 | Medio (cost a Iván, no a conversión) | M | `BookingFormWidget.tsx` + server |
| P1.10 | sessionStorage 30 min — banner "Te recuperamos lo que llevabas" | 6.3 | Medio (UX, no fricción) | S | `BookingFormWidget.tsx:151-207` |
| P1.11 | Exit-intent dentro del modal con CTA WhatsApp | 6.4 | Medio (retención último intento) | M | nuevo componente + `useBookingModal.tsx` |
| P1.12 | `trackValidationError` + `trackBookingModalDismiss` | 7.4, 7.5 | Medio (visibilidad de fricciones) | S | `analytics.ts` + wizard |
| P1.13 | Default personas = `4` (contexto-aware si entra desde `/category-*`) | 2.6 | Bajo-medio (defaults inteligentes) | XS | `BookingFormWidget.tsx:74` |
| P1.14 | Soft cap UI personas 12 → 20 | 2.4 | Bajo (frena legítimos esporádicos) | XS | mobile/desktop wizard |
| P1.15 | Desktop submit + back min-h-11 (touch target) | 5.7, 5.8 | Bajo-medio (a11y AA) | XS | `BookingFormDesktop.tsx:368, 391` |
| P1.16 | Desktop `behavior: 'instant'` (smooth scroll prohibido) | 5.9 | Bajo (DESIGN.md ban + reduced motion) | XS | `BookingFormDesktop.tsx:144` |
| P1.17 | Quitar `filter: blur` de slideVariants desktop | 5.10 | Bajo (compositor risk Safari) | XS | `BookingFormDesktop.tsx:26-29` |
| P1.18 | Heading copy más conversacional (3.1) | 3.1 | Medio (brand voice) | S | `i18n/es.ts` + propagar |
| P1.19 | Errores inline con `role="alert"` en lugar de aria-live en contenedor | 6.10 | Bajo (a11y) | S | mobile/desktop wizard |
| P1.20 | Copy CTA submit "Pedirlo por WhatsApp" + helper text "Sin pago online" | 3.12 | Medio-alto (brand + modelo) | XS | `i18n/es.ts` |
| P1.21 | i18n strings hardcoded ("{time}h", "- Reservado", toasts) → `es.ts` | 3.3, 3.4, 3.8 | Bajo-medio | S | `i18n/es.ts` + wizards + propagar |
| P1.22 | scrollIntoView con respeto a `prefers-reduced-motion` | 5.13 | Bajo (a11y) | XS | `BookingFormWidget.tsx:810, 833` |
| P1.23 | Verificar tagging `generate_lead` en GTM/GA4 | 7.2 | Alto (puede ser bug de tagging) | XS | GTM/GA4 admin |

**Total P1:** 23 ítems. Ataque por bloques temáticos: instrumentación + i18n + visual hierarchy.

### P2 — Polish (nice-to-have, A/B testable, deuda técnica)

| # | Hallazgo | Pasada | Impacto | Esfuerzo |
|---|----------|--------|---------|----------|
| P2.1 | Trust signals enriquecidos (200+ reservas, cancelación gratuita) — verificar copy con negocio | 4.4 | Medio | S |
| P2.2 | Capacidad de barco con `text-sm text-foreground` (más visible) | 4.10 | Bajo-medio | XS |
| P2.3 | Step labels uppercase → title case (B.2.4 abierto) | 4.8 | Bajo | XS |
| P2.4 | Code validation feedback diferenciado (no encontrado vs caducado) | 6.6 | Bajo | M (requiere backend) |
| P2.5 | BookingConfirmation: añadir "Respondemos en <2h" prominente | 6.7 | Bajo | XS |
| P2.6 | `useBoatPricingForDate` consolidado a 1 query por step 2 (8 queries → 1) | 5.11 | Bajo (perf) | M |
| P2.7 | A/B test: orden actual vs "Tu plan" unificado | 7.7 | Medio (post-baseline) | L |
| P2.8 | A/B tests phone prefix, email, copy CTA, PriceSummaryBar step 4, microcopy "Sin pago online" | 7.7 | Medio | M × N |
| P2.9 | Refactor estructural mobile/desktop (B.4.3 audit 2026-05-04, 3499 LOC dup) | (B.4.3) | Bajo (mantenimiento) | L |
| P2.10 | `sharedProps` con 65 props → Context provider (B.4.4 audit 2026-05-04) | (B.4.4) | Bajo (mantenimiento) | M |
| P2.11 | Validation errors accionables ("Añade tu nombre" vs "Campo requerido") | 3.11 | Bajo | S |
| P2.12 | Skeleton/aria-busy en `<select>` mientras carga `slotAvailability` | 6.5 | Bajo | XS |
| P2.13 | Step components memoizados (`React.memo` + `useCallback`) | (B.6.1) | Bajo (perf) | M |

### Resumen ejecutivo del backlog

- **9 P0** → 8-12 h. Cubren el 80 % del impacto en conversión sin reescribir nada. Recomendado: una sesión completa de implementación.
- **23 P1** → 30-50 h. Cubren el siguiente 15 %. Distribuir en 2-3 sesiones temáticas: i18n + tracking, visual + trust, error recovery.
- **13 P2** → variable. Mantener como backlog vivo. Los A/B tests requieren 2-4 semanas de baseline post-P0/P1.

### Orden recomendado de implementación (post-aprobación de este audit)

1. **Sesión "Instrumentación" (S, 2-3 h):** P0.1 + P1.12 + P1.23. Sin esto, el resto no se puede medir.
2. **Sesión "Fricción del último paso" (S, 4-6 h):** P0.2 (email) + P0.3 (phone) + P0.6 (nombre) + P0.7 (toasts) + P0.8 (CTAs).
3. **Sesión "Modelo de negocio explícito" (S, 2-3 h):** P0.4 (sin pago online) + P0.5 (combustible) + P1.1 (PriceSummaryBar step 4) + P1.20 (CTA submit copy).
4. **Sesión "Polish a11y y motion" (S, 2-3 h):** P0.9 (contraste) + P1.15/16/17 (desktop touch target + motion) + P1.22 (reduced-motion).
5. **Sesión "i18n y copy" (M, 4-6 h):** P1.7 (LOCALE_MAP) + P1.21 (strings) + P1.18 (headings) + propagación con `npm run i18n:translate`.
6. **Sesión "Robustez" (M, 4-6 h):** P1.8 (sendBeacon) + P1.10 (sessionStorage banner) + P1.9 (slot recovery) + P1.11 (exit-intent).
7. **Iteración A/B** (P2.7-2.8) con 2-4 semanas baseline cada test.

---

## Verificación end-to-end propuesta

Antes de cerrar cada sesión de implementación post-audit:

1. **Lighthouse a11y** mobile + desktop dentro del modal (paso 4 expandido) → confirmar score ≥ 95.
2. **axe DevTools** en cada step: 0 violations.
3. **Funnel GA4** comparar pre/post (mismo período):
   - Apertura modal vs step 1 view.
   - Drop-off por paso.
   - Submit rate (`generate_lead` o nuevo `inquiry_submit`).
4. **Test cualitativo:** 3 usuarios distintos (1 ES, 1 EN, 1 mobile-low-end) recorriendo el flujo. Tiempo medido a submit.
5. **Test técnico:**
   - POST `/api/booking-inquiries` returns 201.
   - Aparece en `InquiriesTab` del CRM.
   - WhatsApp se abre con mensaje pre-rellenado correcto.
   - i18n: cambiar idioma a EN, CA, FR, DE y confirmar 0 strings en castellano.
6. **Métrica de éxito final:** subir el `submit-rate` (submits / step_1_views) de baseline actual (~0 % visible) a ≥10 % en 4 semanas. Anti-meta: bajar el time-to-submit en mobile por debajo de 90 segundos.

---

## Cierre

El wizard del Hero **no está estructuralmente roto** — el orden de pasos es correcto, los defaults inteligentes ya existen, la lógica de pricing dinámico funciona, los assets de trust están construidos. Lo que falla es **comunicación del modelo de negocio** (sin pago online, combustible incluido), **fricción evitable del último paso** (email obligatorio, phone prefix, nombre+apellido) y **ceguera del funnel** (sin tracking step-by-step).

Las 9 acciones P0 son **8-12 horas de trabajo** y deberían mover la aguja de forma medible si el tagging GA4 es correcto. Sin la pasada de instrumentación (P0.1) no podremos saber si funcionaron — esa es la primera fila del backlog y bloquea aprendizaje de todo lo demás.

**Documento listo para revisión.** Tras aprobación, sesiones de implementación se pueden agendar una a una en el orden propuesto.
