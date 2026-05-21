# Click&Boat — Sincronización de precios 2026-05-21

## Estado

Fuente de verdad: web `costabravarentaboat.com` (`shared/boatData.ts` + `shared/pricing.ts`).

Auditoría completa hecha sobre los 6 listings activos en Click&Boat (de los 9 del catálogo web; ausentes: Remus 450 II, Astec 400, Excursión Privada con Capitán).

Decisiones estratégicas tomadas:

- **Comisión real C&B**: ~21% sobre precio cliente. El campo que se edita en el portal es el **precio cliente**; C&B muestra entre paréntesis el net armador.
- **Temporada alta (Jul/Ago)**: **NO se toca**. Pricing premium consciente para gestionar sobredemanda. Igualar a la web sería bajar margen sin justificación.
- **Trimarchi 57S Apr-Jun**: se mantiene en €250/€350 (premium consciente, alineado con competencia Quicksilver).
- **Pacific Craft 625**: bajado a precio web (€250/€300) en BAJA y Sep-Oct (estaba sobreinflado).
- **Sin licencia Apr-Jun y Sep-Oct**: alinear a precio web.
- **Findes Jul/Ago con licencia +15%**: aplazado (27 periodos custom, demasiado pesado vía MCP, mejor sesión dedicada).

## Hecho hoy en C&B (6 ediciones aplicadas y verificadas)

| Listing | Periodo | Antes | Después | Estado |
|---|---|---|---|---|
| Astec 480 #183678 | 01 Apr - 30 Jun | half €180 | **half €200** | ✅ persistido |
| Pacific Craft 625 #183672 | 01 Apr - 30 Jun | half €280 · 1day €350 | **half €250 · 1day €300** | ✅ persistido |
| Pacific Craft 625 #183672 | 01 Sep - 31 Oct | half €300 · 1day €420 | **half €250 · 1day €300** | ✅ persistido |
| Remus 450 #183677 | 01 Sep - 31 Oct | (no existía) | **half €150 · 1day €220** | ✅ creado y persistido |
| Astec 480 #183678 | 01 Sep - 31 Oct | (no existía) | **half €200 · 1day €270** | ✅ creado y persistido |
| Mingolla Brava 19 #183710 | 01 Sep - 31 Oct | (no existía) | **half €230 · 1day €280** | ✅ creado y persistido |

**Nota técnica**: el portal de Click&Boat usa un componente DatePicker React controlado por estado interno. Inyectar fechas en los `<input readonly>` no funciona — hay que disparar clicks sintéticos (MouseEvent bubbling) sobre el input + el botón Next + el día. La navegación finalmente se automatizó con `evaluate_script` y waits de 150ms entre clicks. Truco aplicable a futuras ediciones.

## ✅ Hecho en sesión 2 (Fase 3 parcial)

- **Astec 480 #183678**: modelo renombrado de "Astec 450" → **"Astec 480"** (problema nominal arreglado).
- **Astec 480 #183678**: confirmado Instant Booking activado + Cancellation Flexible activada (ya estaban OK).

## ✅ Hecho en sesión 3 (Fase 3a + 3b — fuel cost + depósitos)

### Fuel cost (3 sin licencia) — todos a "Included in rental price"

| Listing | Antes | Después | Verificado |
|---|---|---|---|
| Astec 480 #183678 | Excluded | **Included** | ✅ persistido |
| Remus 450 #183677 | Excluded | **Included** | ✅ persistido |
| Solar 450 #183671 | Excluded | **Included** | ✅ persistido |

Ubicación del campo: pestaña **Booking** (`:4`), dropdown "Fuel cost". Click en el componente → seleccionar opción → Save (botón inferior). Save redirige automáticamente a la pestaña Extras (`:10`); persistencia confirmada al volver a `:4`.

### Depósitos (6 listings, en pestaña Documents `:6`)

Campo "Amount of security deposit" — input `<input name="deposit">` estándar (no React custom). Cambio con fill + Save.

| Listing | Antes | Después | Web objetivo | Verificado |
|---|---|---|---|---|
| Astec 480 #183678 | 250 ❌ | **300** | 300 | ✅ |
| Solar 450 #183671 | 200 ❌ | **250** | 250 | ✅ |
| Remus 450 #183677 | (vacío) ❌❌ | **200** | 200 | ✅ |
| Mingolla #183710 | 500 | 500 | 500 | ✅ ya OK |
| Trimarchi #183704 | 500 | 500 | 500 | ✅ ya OK |
| Pacific Craft #183672 | 500 | 500 | 500 | ✅ ya OK |

**Hallazgo crítico**: el Remus 450 tenía el campo depósito VACÍO. Significa que C&B no había cobrado fianza al cliente por reservas del Remus en C&B hasta hoy.

### Hallazgo lateral

Solar 450 tiene en C&B la opción skipper "With or without skipper" (no "Without skipper" como Astec/Remus). Esto permite ofrecer la "excursión privada con capitán" via este listing, aunque en `shared/boatData.ts` el barco está como sin licencia. **No tocado — revisar si es deliberado**.

## ✅ Hecho en sesión 4 (Fase 0 + Fase 4)

### Fase 0 — Análisis de reservas 2025

Extraído Apple Calendar local via AppleScript/JXA (722 eventos → 669 reservas válidas). **Hipótesis confirmada con datos**:
- Sin licencia (Solar/Remus/Astec): 524 reservas, solo 4.8% C&B
- Con licencia (Mingolla/Trimarchi/Pacific): 144 reservas, 20.1% C&B
- Trimarchi 41/42% C&B en Jul/Ago, Mingolla 55% C&B en Jul
- Pacific Craft 1% C&B / 67 reservas — problema de visibilidad/ranking grave

Reporte completo: `docs/handoff/2026-05-21-clickboat-bookings-2025.md`

### Fase 4 — Visibilidad/ranking con licencia (descripciones)

Re-escrito Title + Description en **EN + ES + FR** para los 3 listings con licencia, con tono comercial alineado con la web (`shared/boatData.ts`). El placeholder de C&B dice literalmente "length & quality of description impacts positioning in search results".

| Listing | Tono | EN | ES | FR |
|---|---|---|---|---|
| Pacific Craft 625 #183672 | Premium + lujo exclusivo | 1842 chars ✅ | 1975 ✅ | 2065 ✅ |
| Mingolla Brava 19 #183710 | Sport + exploración + GPS | 1701 ✅ | 1820 ✅ | 1857 ✅ |
| Trimarchi 57S #183704 | Adrenalina + diseño italiano | 1934 ✅ | 2033 ✅ | 2121 ✅ |

### Fase 5 — Descripciones sin licencia (coherencia de marca)

Re-escrito Title + Description en **EN + ES + FR** para los 3 listings sin licencia. Tonos diferenciados por barco:

| Listing | Tono / angle | EN | ES | FR |
|---|---|---|---|---|
| Solar 450 #183671 | Sol + solárium acolchado más amplio + gasolina incluida | 1600 ✅ | 1789 ✅ | 1892 ✅ |
| Remus 450 #183677 | Más alquilado + familias + Bi Mini + estabilidad | 1825 ✅ | 1973 ✅ | 2078 ✅ |
| Astec 480 #183678 | Premium sin licencia + bluetooth + 50L (doble depósito) | 1878 ✅ | 1971 ✅ | 2079 ✅ |

**Total Fase 4 + 5**: los **6 listings** activos en C&B tienen ahora descripciones comerciales coherentes con la web, en EN/ES/FR (3 idiomas que cubren ~80% del tráfico Costa Brava en C&B).

### Fase 1 — Precios disuasorios + bloqueo findes Jul/Ago sin licencia

**Precios subidos suaves (+10-15%)** — usuario eligió variante moderada en lugar del +22-31% del plan original:

| Listing | Jul antes → después | Ago antes → después |
|---|---|---|
| Solar 450 #183671 | 220/340 → **250/390** (+14%/+15%) | 260/380 → **295/440** (+13%/+16%) |
| Remus 450 #183677 | 220/340 → **250/390** | 260/380 → **295/440** |
| Astec 480 #183678 | 260/370 → **295/425** (+13%/+15%) | 320/430 → **370/495** (+16%/+15%) |

**Bloqueo de findes Jul/Ago 2026** — 9 findes por barco × 3 barcos = **27 bloqueos aplicados** (Jul 4-5, 11-12, 18-19, 25-26; Ago 1-2, 8-9, 15-16, 22-23, 29-30). Reason: "Unavailable". Usuario asume riesgo doble-booking si C&B no sincroniza con CRM — recordar revisar cada lunes.

**Nota técnica calendar UI**: la interfaz de bloqueo usa jQuery UI datepicker readonly + dropdown custom para Reason. `$(input).datepicker('setDate', ...)` no dispara la validación interna ("Required field"); hay que **clicar el popup datepicker día a día**. Solución batch: async loop con `navigateAndPickDay(input, mes, año, día)` → click popup .ui-datepicker-next hasta el mes objetivo, click `a.ui-state-default` con el número del día, `await sleep(200)`. Para Reason: `$('li[data-value="Unavailable"]').trigger('click')` antes de Add. El contador `li.availability` se infla durante el batch (artifact DOM intermedio), pero tras reload el estado persistente es correcto.

**Nota técnica**: el listing C&B ya tenía 11 idiomas pre-creados (FR/EN/ES/IT/DE/NL/PL/EL/RU/PT/SV) con contenido viejo plano. Los inputs tienen IDs `title[N]` / `description[N]` (N = ID de idioma: 1=FR, 2=EN, 3=ES, 4=IT, 6=DE, 7=NL...). Para escribir en React inputs hay que usar el setter nativo del prototipo (`Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set`) + dispatch `input` + `change` events, sino React lo ignora. Otros 8 idiomas (IT/DE/NL/PL/EL/RU/PT/SV) quedan con contenido viejo plano — no críticos (tráfico Costa Brava EN/ES/FR cubre 80%+).

## 📋 Pendiente para próxima sesión

### Calendario refresh (boost recency)

Banner en C&B dice "A frequently updated calendar boosts your listing in the results". Pendiente porque:
- Tocar calendario afecta operativa de booking → riesgo doble booking si se desincroniza con CRM interno
- Decisión: confirmar con usuario antes de ejecutar

### Fase 5 — Descripciones sin licencia (coherencia de marca)

Solar 450, Remus 450, Remus 450 II, Astec 480 — re-escribir descripciones con mismo tono. No mueve volumen (canal residual), pero refuerza marca. ~30 min via el mismo patrón `evaluate_script` + React setter.

### Fase 1 — Precios disuasorios + bloqueo findes sin licencia Jul/Ago

Confirmado por datos: impacto perdido máximo ~25 reservas/año (5% del total sin licencia). Aplicar cuando el usuario decida.

### Fase 2 — Crear Astec 400 (PARCIAL — bloqueado en Step 1)

**Estado**: probado el wizard `/en/register-my-boat`. Step 1 ("Your yacht") rellenado completo (Type=Boat without licence, City=Blanes, Harbour=Other → "Puerto de Blanes", Manufacturer=Astec, Model=Astec 400, Skipper=Without skipper, Capacity=4, Length=4m, Company=Costa Brava Rent a Boat Blanes). **7 fotos JPG subidas** (Cover + 6 fotos del Astec 400).

**Bloqueo**: tras click Save+Continue, el wizard no avanza ni persiste. Hipótesis: Manufacturer es **autocomplete del catálogo oficial de C&B** y "Astec" no aparece — se marca "Unknown manufacturer" y bloquea la creación. Solución mejor manual:
1. Ir a https://www.clickandboat.com/en/register-my-boat
2. Escribir "Astec" en Manufacturer y **esperar dropdown de sugerencias**. Si no aparece, probar variantes ("Generic", "Other") o el nombre del fabricante real ("Astec" es una marca menor; el fabricante puede ser "Other" en C&B).
3. Mismo con Model.
4. Rellenar resto + subir fotos.
5. **Fotos JPG listas** en `/tmp/astec-400-jpg/` (00-cover.jpg + 01-06 numeradas, 7 fotos ~2.4 MB total). Si necesitas re-convertir desde el repo: `for f in client/public/images/boats/astec-400/*.webp; do sips -s format jpeg "$f" --out "/tmp/$(basename ${f%.webp}).jpg"; done`.

Tiempo estimado manual: ~10-15 min una vez localizado el Manufacturer correcto.

### Fotos Pacific Craft

Pacific Craft tiene solo 6 fotos en C&B (Felix ~12-15). Material disponible en `client/public/images/boats/pacific-craft-625/`. Decidir cuándo subir más.

## Plan para próximas sesiones

Ver `/Users/macbookpro/.claude/plans/actualmente-estoy-dado-de-glistening-wreath.md`. Fases pendientes:
- Fase 0: análisis del .ics
- Fase 4: visibilidad/ranking con licencia
- Fase 5: descripciones consistentes con web
- Fase 1: precios disuasorios + bloqueo findes sin licencia Jul/Ago
- Fase 2: crear listing Astec 400

## ~~Pendiente~~ (cerrado) — los 3 periodos Sep-Oct

Estos 3 cambios requieren usar el **datepicker** del portal (la creación de periodo nuevo no se puede automatizar con JS porque las fechas las gestiona un componente React controlado, no un `<input>` estándar).

### Guion paso a paso

Para cada uno de los 3 listings, repetir el mismo proceso:

1. Login en https://www.clickandboat.com/ (cuenta Ivan Ramirez).
2. Ir a `Listings` → seleccionar barco.
3. Pestaña `Price`.
4. Bajar hasta el final, click `+ Create a new price period`.
5. Click sobre el campo `start date` → en el datepicker emergente:
   - Click `Next` hasta llegar a **September** (8 clicks desde enero).
   - Click día **1**.
6. Click sobre el campo `end date` → en el datepicker:
   - Click `Next` 1 vez (de septiembre a octubre).
   - Click día **31**.
7. Rellenar `Price /day` con el valor "1 day" de la tabla.
8. Click `Advanced pricing options` para expandir.
9. Rellenar `1 half day` con el valor de la tabla.
10. Click `Confirm and close`.
11. Click `Save`.
12. Confirmar cualquier modal que aparezca.
13. Recargar página para verificar que aparece el periodo "01 September - 31 October" con los precios.

### Valores a introducir

| Listing | URL directa a página `Price` | half day (€) | 1 day (€) |
|---|---|---|---|
| **Remus 450** #183677 | `/en/account/listing/edit/183677:5` | **150** | **220** |
| **Astec 480** #183678 | `/en/account/listing/edit/183678:5` | **200** | **270** |
| **Mingolla Brava 19** #183710 | `/en/account/listing/edit/183710:5` | **230** | **280** |

Tiempo estimado: ~3-5 min por barco × 3 = **10-15 min total**.

## Fase 3 aplazada (findes Jul/Ago premium con licencia, +15%)

Recargo +15% sobre los findes de Jul/Ago para los 3 barcos con licencia. Para cada barco, **9 periodos custom**: 4 findes Jul (5-6, 12-13, 19-20, 26-27) + 5 findes Ago (2-3, 9-10, 16-17, 23-24, 30-31).

**Total: 27 periodos custom × ~10 clicks cada uno = ~270 interacciones.**

Recomendación: bloquear ~1.5-2h en una sesión dedicada, usar el datepicker manualmente. Si es operativamente inviable, alternativa más simple: subir todo el periodo Jul completo +5% y todo el periodo Ago completo +5% (12 ediciones de precio en lugar de 27 periodos nuevos).

### Valores objetivo +15% finde (si se ejecuta)

Aplicar al precio actual de Jul/Ago de cada barco. `roundToNearestTen()` para presentación limpia.

| Listing | Periodo actual | finde +15% half | finde +15% 1day |
|---|---|---|---|
| Mingolla Brava 19 #183710 | Jul half=240 · 1day=300 | **280** | **350** |
| Mingolla Brava 19 #183710 | Aug half=250 · 1day=390 | **290** | **450** |
| Trimarchi 57S #183704 | Jul half=250 · 1day=350 | **290** | **400** |
| Trimarchi 57S #183704 | Aug half=250 · 1day=390 | **290** | **450** |
| Pacific Craft 625 #183672 | Jul half=360 · 1day=450 | **410** | **520** |
| Pacific Craft 625 #183672 | Aug half=400 · 1day=500 | **460** | **580** |

## Barcos del catálogo web NO listados en C&B

Si interesa publicarlos:
- **Remus 450 II** (duplicado intencional del Remus para disponibilidad extra) — replicaría al Remus 450 actual
- **Astec 400** — barco económico sin licencia (4 personas, web BAJA 8h=225)
- **Excursión Privada con Capitán** — paquete VIP con patrón profesional

## Anclas de competencia (Click&Boat Blanes)

**Sin licencia** (6 listings totales en Blanes):
- 3× Voraz 450 de Felix: From €195/día · Super owner · 53+29+26 reseñas. Líder histórico desde 2017.
- Cobra 480 Sport: From €320/día (sin reseñas, sospecho mal puesto)
- Tu Remus 450: From €220/día · 0 reseñas
- Tu Astec 480: From €270/día · 0 reseñas

**Con licencia** (6 listings en Blanes):
- Quicksilver Activ 605: €340-380/día
- Quicksilver 675 BRW: €380/día
- Maxima 730: €380/día
- Beneteau Flyer 8.8 (super premium): €650/día
- Tu Trimarchi 57S: €350/día
- Tu Mingolla Brava 19, Pacific Craft 625: no aparecen en listing principal de Blanes (problema de visibilidad/ranking)

Tus precios con licencia están POR DEBAJO de la competencia tipo Quicksilver → margen para subir en el futuro cuando acumules reseñas.
