# Auditoria Visual Interactiva — Costa Brava Rent a Boat

## Objetivo
Auditar visualmente 10 tecnicas de neuro-CRO implementadas en https://www.costabravarentaboat.com. Necesito que navegues por el sitio, interactues con los elementos y documentes que ves en cada paso.

## Instrucciones generales
- Navega a https://www.costabravarentaboat.com
- Acepta las cookies cuando aparezca el banner
- Toma capturas de pantalla en cada paso
- Documenta lo que ves vs lo que deberia verse
- Si algo no aparece o se ve mal, describelo con detalle

---

## TEST 1: SensoryHeroCopy (Hero)
**Que buscar:** Un bloque de texto con fondo semi-transparente oscuro entre el subtitulo y los CTAs del hero.
**Contenido esperado segun hora del dia (Madrid):**
- Manana (6-12h): "Siente la brisa mediterranea en tu piel"
- Tarde (12-18h): "Manana, este podria ser tu atardecer"
- Noche (18-23h): "Despierta manana en el agua"
- Madrugada (23-6h): "Manana, el mar te espera"

**Linea secundaria segun temporada:**
- Marzo: "La temporada abre en abril"
- Abril-Junio: "Temporada tranquila — calas solo para ti"
- Julio: "El mejor momento del verano empieza ahora"
- Agosto: "Ultimas plazas de agosto — no esperes mas"

**Accion:** Ve a la homepage y captura el hero completo. Documenta si ves el bloque de texto sensorial.

---

## TEST 2: Emotion Tags en Boat Cards (Fleet Section)
**Que buscar:** Texto italico pequeno debajo del nombre de cada barco en la seccion de flota.
**Tags esperados:**
- Solar 450: "Para amantes del sol"
- Remus 450: "Favorito de familias"
- Remus 450 II: "Siempre disponible"
- Astec 400: "Mejor precio por persona"
- Astec 480: "Premium sin carnet"
- Mingolla Brava 19: "El explorador"
- Trimarchi 57S: "Pura adrenalina"
- Pacific Craft 625: "La experiencia de lujo"
- Excursion Privada: "VIP: Tu solo disfruta"

**Accion:** Haz scroll hasta la seccion de flota ("Elige tu barco") y verifica que cada tarjeta de barco tiene su emotion tag debajo del nombre.

---

## TEST 3: LiveInterestIndicator (Boat Detail)
**Que buscar:** Texto con un punto animado tipo "X personas han visto este barco hoy" debajo del titulo del barco.
**Condicion:** Solo aparece si hay 2+ viewers en los ultimos 2 minutos.

**Accion:** Navega a https://www.costabravarentaboat.com/es/barco/remus-450 y busca el indicador debajo del nombre del barco.

---

## TEST 4: TrustBadges (Boat Detail)
**Que buscar:** Fila de 4 badges redondeados dentro de la tarjeta de descripcion del barco:
1. "4.8 en Google" (estrella amarilla)
2. "Puerto oficial de Blanes" (icono pin azul)
3. "Seguro completo" (icono escudo azul)
4. "5 anos de experiencia" (icono premio azul)

**Accion:** En la pagina de detalle del barco, busca estos badges dentro de la seccion de "Descripcion", debajo del texto descriptivo.

---

## TEST 5: Adaptive Urgency (Boat Detail)
**Que buscar:** Un badge de urgencia con icono que varia segun escasez real e intent del usuario:
- "Barco popular esta temporada" (informativo, icono TrendingUp)
- "El mas reservado esta semana" (social, icono Users)
- "Solo quedan X horas para el [fecha]" (urgente, icono Flame)

**Accion:** Visita varias paginas de detalle de barco y documenta que badge de urgencia aparece en cada una.

---

## TEST 6: Smart Defaults en Booking Flow
**Que buscar:** Al abrir el booking flow y seleccionar fecha + barco, la hora y duracion mas populares deben estar pre-seleccionadas con un badge "Mas popular" (pill indigo).

**Accion paso a paso:**
1. Ve a https://www.costabravarentaboat.com
2. Haz scroll hasta un barco (ej: Remus 450) y click en "Reservar"
3. En el booking modal, selecciona una fecha (manana o pasado manana)
4. Selecciona un barco de la lista
5. **Observa:** Deberian aparecer los time slots con uno pre-seleccionado y marcado como "Mas popular"
6. **Observa:** Al seleccionar un time slot, deberia aparecer un grid de duraciones (no un dropdown) con una marcada como "Mas popular"
7. Captura la pantalla mostrando los badges "Mas popular"

---

## TEST 7: Duration Decoy Grid
**Que buscar:** En el paso anterior (dentro del booking), el selector de duracion debe ser un GRID de tarjetas (no un dropdown select). Cada tarjeta muestra:
- Duracion (ej: "2 horas")
- Precio total (ej: "115EUR")
- Precio por hora (ej: "57.50EUR/hora")
- Precio por persona por hora (ej: "12EUR/pers.")
- Badge "Mejor valor" (pill verde) en la duracion con menor precio/hora (normalmente la mas larga)

**Accion:** Dentro del booking flow, tras seleccionar fecha, barco y hora, verifica que el selector de duracion es un grid visual con precios desglosados. Captura la pantalla.

---

## TEST 8: Value Stacking en Checkout
**Que buscar:** Un bloque verde claro con titulo "Todo incluido en tu precio" y una lista de checkmarks verdes con lo que incluye la reserva. Los items varian segun tipo de barco:

**Sin licencia:** Combustible incluido, Seguro, Equipo de seguridad, Formacion 15 min, Cancelacion gratuita 48h, Pago seguro
**Con licencia:** Seguro, Equipo de seguridad, GPS y sonda, Cancelacion gratuita 48h, Pago seguro
**Excursion privada:** Patron profesional, Seguro, Equipo seguridad, Cancelacion gratuita 48h, Pago seguro

**Accion paso a paso:**
1. En el booking flow, selecciona fecha, barco, hora y duracion
2. Click "Continuar" para ir al paso 2 (Personalizar)
3. Rellena nombre, email y telefono (pueden ser ficticios)
4. Click "Continuar" para ir al paso 3 (Pago)
5. **Observa:** Encima del boton de pago debe aparecer el bloque "Todo incluido en tu precio"
6. Verifica que los items son correctos segun el tipo de barco seleccionado
7. **IMPORTANTE: NO completes el pago.** Solo verifica visualmente.

---

## TEST 9: Trust Escalation Progresiva
**Que buscar:** El banner de confianza (franja verde con checkmarks) cambia de contenido segun el paso del booking:

- **Paso 1 (Experiencia):** "Cancelacion gratuita 48h" + "Pago seguro" + "Seguro incluido"
- **Paso 2 (Personalizar):** Los 3 anteriores + "100+ familias esta temporada"
- **Paso 3 (Pago):** Maximo trust con icono de candado, seguro completo, reservas semanales, puerto oficial

**Accion:** Avanza por los 3 pasos del booking y en cada uno captura el banner verde de confianza. Compara si el contenido cambia progresivamente.

---

## TEST 10: Exit Intent Contextual
**Que buscar:** El modal que aparece al intentar salir de la pagina tiene 4 variantes segun el contexto:

**Variante "quiz"** (si no has visto barcos): Titulo "No sabes que barco elegir?" + CTA "Encontrar mi barco"
**Variante "abandoned"** (si empezaste a reservar): Titulo "Tu barco te espera" + nombre del barco + CTA con 10% descuento
**Variante "quiz-result"** (si completaste el quiz): Titulo "Gran eleccion!" + barco recomendado + 10% descuento
**Variante "default"** (fallback): Titulo generico con cupon BIENVENIDO10

**Accion para probar variante "abandoned":**
1. Abre el booking flow para un barco especifico
2. Cierra el booking sin completar
3. Mueve el raton hacia la barra de direcciones del navegador (simula salir)
4. Deberia aparecer el modal con "Tu barco te espera" y el nombre del barco

**Accion para probar variante "quiz":**
1. Abre una ventana de incognito
2. Ve a la homepage sin interactuar con ningun barco
3. Mueve el raton hacia arriba para disparar el exit intent
4. Deberia aparecer "No sabes que barco elegir?"

---

## Formato del reporte
Para cada test, documenta:
1. **Estado:** PASS / FAIL / PARCIAL
2. **Captura:** Descripcion de lo que se ve
3. **Notas:** Cualquier observacion relevante (posicion, contraste, responsive, etc.)

## Notas adicionales
- El sitio tiene 8 idiomas. Estas pruebas son en espanol (la version por defecto).
- No completes ningun pago real.
- Si el quiz se abre al click en "Reservar desde 14EUR/persona" del hero, es correcto — el booking directo se accede desde el boton "Reservar" en cada tarjeta de barco o pagina de detalle.
