# Auditoria Visual Localhost — Booking Flow Neuro-CRO

## Objetivo
Verificar 4 tecnicas de neuro-CRO en el booking flow principal del sitio corriendo en **http://localhost:5000**. El servidor ya esta arrancado.

## Instrucciones generales
- Navega a http://localhost:5000
- Acepta las cookies cuando aparezca el banner
- Toma capturas de pantalla en cada paso
- Documenta lo que ves vs lo que deberia verse
- **NO completes ninguna reserva real** — solo verifica visualmente

---

## PASO 0: Abrir el booking flow correcto

**IMPORTANTE:** El booking flow se abre desde el boton "Reservar" en una tarjeta de barco, NO desde el boton principal del hero ("Reservar desde 14EUR/persona" abre el quiz, no el booking).

1. Ve a http://localhost:5000
2. Acepta cookies
3. Haz scroll hasta la seccion de flota ("Elige tu barco")
4. En la tarjeta del **Remus 450**, haz click en el boton azul **"Reservar"**
5. Se abrira un modal con titulo "SOLICITA TU PETICION DE RESERVA"

---

## TEST 1: Trust Escalation — Step 1 (Barco)

**Que buscar:** Una franja verde/esmeralda en la parte SUPERIOR del modal con checkmarks verdes.

**Contenido esperado en Step 1:**
- Cancelacion gratuita 48h
- Pago seguro
- Seguro incluido

**Accion:** Captura la pantalla del Step 1 mostrando la franja verde de trust. El Remus 450 deberia estar pre-seleccionado.

---

## TEST 2: Avanzar a Step 2 y verificar Trust + Duration Decoy

1. En Step 1, asegurate de que el **Remus 450** esta seleccionado (o selecciona cualquier barco sin licencia)
2. Click en **"Siguiente"** para ir al Step 2

**Que buscar en Step 2:**

### 2A. Trust Banner (debe seguir visible)
La misma franja verde debe estar presente en la parte superior del Step 2.

### 2B. Fecha
3. Selecciona una fecha en abril 2026 (ej: 4 de abril, un sabado)

### 2C. Hora
4. Selecciona una hora disponible (ej: 10:00)

### 2D. Duration Decoy — LO MAS IMPORTANTE
5. Mira la seccion de **duracion**. Deberia ser un grid de botones (no un dropdown).

**Que verificar en cada boton de duracion:**
- Nombre y precio total: "2 horas - 115EUR"
- **NUEVO: Precio por hora debajo:** algo como "58EUR/hora · 12EUR/pers."
- **NUEVO: Badge "Mejor valor"** (pill verde) en la duracion con menor precio/hora (normalmente 8h)
- **EXISTENTE: Badge "Mas popular"** (debe seguir en 4h)

Captura la seccion de duracion mostrando los precios por hora y los badges.

### 2E. Personas
6. Selecciona 2-4 personas

---

## TEST 3: Trust Escalation — Step 3 (Extras)

1. Click en **"Siguiente"** para ir al Step 3 (Extras y packs)

**Que buscar:** La franja de trust debe mostrar contenido DIFERENTE al Step 1-2.

**Contenido esperado en Step 3 (stage="step2"):**
- Cancelacion gratuita 48h
- Pago seguro
- Seguro incluido
- **NUEVO:** "100+ familias esta temporada" (cuarta linea)

Captura la franja de trust en Step 3 y verifica que tiene 4 items (uno mas que en steps 1-2).

---

## TEST 4: Value Stacking + Trust Escalation — Step 4 (Confirmacion)

1. Click en **"Siguiente"** para ir al Step 4 (datos personales + confirmacion)

**Que buscar:**

### 4A. Trust Banner en maximo nivel
La franja de trust debe mostrar el MAXIMO contenido (stage="step3"):
- Cancelacion gratuita 48h (con icono candado)
- Seguro completo embarcacion y ocupantes
- Puerto oficial de Blanes
- "X+ reservas esta semana"
- Pago seguro

### 4B. Value Stacking — "Todo incluido en tu precio"
**Que buscar:** Un bloque de color verde/esmeralda claro con un icono de regalo y el titulo **"Todo incluido en tu precio"**.

Debajo del titulo, una lista en 2 columnas con checkmarks verdes:

**Para barco SIN licencia (Remus 450):**
- Combustible incluido
- Seguro de embarcacion y ocupantes
- Equipo de seguridad completo
- Formacion de 15 min incluida
- Cancelacion gratuita 48h
- Pago seguro

**IMPORTANTE:** Si seleccionaste un barco CON licencia (Mingolla, Trimarchi, Pacific Craft), el bloque NO debe mostrar "Combustible incluido" ni "Formacion de 15 min" — en su lugar muestra "GPS y sonda incluidos".

Captura el bloque ValueStack completo.

### 4C. Boton de envio
El boton final debe ser "Enviar peticion" con icono de WhatsApp. **NO lo pulses.**

---

## TEST 5 (Opcional): Repetir con barco CON licencia

Si tienes tiempo, cierra el modal y repite el proceso seleccionando el **Pacific Craft 625** (con licencia) para verificar que:
1. El ValueStack muestra "GPS y sonda incluidos" en vez de "Combustible incluido"
2. Los precios por hora son diferentes (barco mas caro)
3. El badge "Mejor valor" aparece en la duracion de 8h

---

## Formato del reporte

Para cada test, documenta:
1. **Estado:** PASS / FAIL / PARCIAL
2. **Captura:** Descripcion de lo que se ve
3. **Notas:** Posicion, contraste, legibilidad, cualquier anomalia

## Resumen esperado

| Test | Tecnica | Que debe verse |
|------|---------|---------------|
| 1 | Trust Banner Step 1 | Franja verde, 3 items |
| 2D | Duration Decoy | Precio/hora + "Mejor valor" badge |
| 3 | Trust Banner Step 3 | Franja verde, 4 items (uno mas) |
| 4A | Trust Banner Step 4 | Franja verde, 5 items (maximo) |
| 4B | Value Stacking | Bloque verde "Todo incluido" con 6 checkmarks |
