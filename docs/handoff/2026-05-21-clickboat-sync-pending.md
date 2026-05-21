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

## Hecho hoy en C&B (3 ediciones aplicadas y verificadas)

| Listing | Periodo | Antes | Después | Estado |
|---|---|---|---|---|
| Astec 480 #183678 | 01 Apr - 30 Jun | half €180 | **half €200** | ✅ persistido |
| Pacific Craft 625 #183672 | 01 Apr - 30 Jun | half €280 · 1day €350 | **half €250 · 1day €300** | ✅ persistido |
| Pacific Craft 625 #183672 | 01 Sep - 31 Oct | half €300 · 1day €420 | **half €250 · 1day €300** | ✅ persistido |

## Pendiente (3 periodos Sep-Oct a crear MANUALMENTE)

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
