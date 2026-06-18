# Export de precios de alquiler de embarcaciones — Costa Brava Rent a Boat

Extracción de **solo lectura** realizada el 2026-06-14. No se modificó ningún dato. Los precios se leyeron de la **base de datos en vivo** (Neon PostgreSQL, vía `DATABASE_URL` del `.env`) y se contrastaron con el catálogo estático del código.

Moneda: **EUR (€)**. Todos los precios **incluyen IVA** y son **por embarcación completa** (no por persona). La **fianza/depósito** es aparte y NO está incluida en el precio del alquiler.

---

## 1) Dónde viven los precios (rutas de archivos y DB)

| Capa | Ubicación | Qué contiene |
|---|---|---|
| **DB en vivo (fuente autoritativa de lo que se vende hoy)** | Tabla `boats`, columna `pricing` (JSON) + `is_active` + `deposit` | Precios estacionales reales por barco; flota viva |
| Schema de la tabla | `shared/schema.ts` → `boats` (líneas 257-308) | Define columna `pricing` JSON con `BAJA/MEDIA/ALTA` |
| **Catálogo estático (semilla / fallback)** | `shared/boatData.ts` → `BOAT_DATA` | 9 barcos con precios, specs, extras. Re-siembra filas borradas |
| **Motor de precios** | `shared/pricing.ts` | Lógica de temporadas, recargo de finde, redondeo, overrides |
| Constantes de temporada | `shared/constants.ts` → `SEASON_START_MONTH`, `SEASON_END_MONTH` | Abril (4) – Octubre (10) |
| **Precios dinámicos (overrides por rango de fechas)** | Tabla `pricing_overrides` (schema `shared/schema.ts` líneas 798-818) | Recargos/descuentos por bloques de fechas. Lógica en `pricing.ts` (`selectApplicableOverride`, `applyOverrideToPrice`) |
| Storage overrides | `server/storage/pricingOverrides.ts` | Carga overrides activos para una fecha |
| API admin overrides | `server/routes/admin-pricing-overrides.ts` | CRUD de overrides |
| API pública calendario | `server/routes/pricing.ts` (`/api/pricing/calendar`) | Precio final por fecha (base + finde + override) |
| UI CRM (gestión) | `client/src/components/crm/PricingTab.tsx` (pestaña "Precios") | Edición visual |
| Regla precio Astec 400 | catálogo: Solar 450 × 0,95 (suelo 10€) | Documentado en el proyecto |

> **Dos fuentes que difieren ligeramente:** el sitio público lee la **DB en vivo**, no el catálogo `boatData.ts`. Hay pequeñas divergencias (Astec 400 desactivado y con otros precios; depósitos de Solar 450 y Astec 480). Este export usa **la DB como verdad** y lista las divergencias en la sección 6.

---

## 2) Modelo de precios de la web (con precisión)

### Dimensión "fechas": por MESES fijos agrupados en 3 temporadas con nombre
No hay rangos de fechas arbitrarios en el precio **base**. La temporada se deriva del **mes** (`getSeason()` en `shared/pricing.ts`):

| Temporada (web) | Meses | `period` en datos |
|---|---|---|
| **BAJA** | Abril, Mayo, Junio, Septiembre, Octubre | "Abril-Junio, Septiembre-Cierre" |
| **MEDIA** | Julio | "Julio" |
| **ALTA** | Agosto | "Agosto" |
| (cerrado) | Noviembre–Marzo | Fuera de temporada: la web **no acepta reservas** (lanza error) |

- **¿Cambian por año?** El precio base NO depende del año (la temporada es por mes). Lo que SÍ es específico de año son los **overrides** (rangos de fecha concretos de 2026; ver sección 5).
- **Capas que se aplican ENCIMA del precio base** (en este orden, en `calculatePricingBreakdown`):
  1. **Recargo de fin de semana +15%** (sábado y domingo), `WEEKEND_SURCHARGE_FACTOR = 1.15`. **Excepción: en agosto NO se aplica** (`shouldApplyWeekendSurcharge`).
  2. **Override dinámico** del bloque de fechas si aplica (multiplicador o € fijo, recargo o descuento).
  3. **Redondeo al múltiplo de 10 más cercano** en las salidas de finde/override (los precios base de catálogo NO se redondean).
- **Duración mínima:** agosto exige mínimo **2h**; resto del año mínimo **1h** (`getMinimumDuration`).

### Tramos de duración (NO son iguales para todos los barcos)
| Tipo de barco | Duraciones ofrecidas |
|---|---|
| Sin licencia (Solar, Remus, Remus II, Astec 480, Astec 400) | **1h, 2h, 3h, 4h, 6h, 8h** |
| Con licencia (Mingolla, Trimarchi, Pacific Craft) | **2h, 4h, 8h** (no hay 1h/3h/6h) |
| Excursión privada con capitán | **2h, 3h, 4h** (no hay 1h/6h/8h) |
| Jet ski (NO son "barcos", ver sección 7) | Circuito: 15min/30min/60min · Excursión monitor: 1h/2h |

No existen tramos tipo "medio día / día completo / 90 min": el modelo es por horas exactas de la lista anterior.

### IVA, moneda, por persona, fianzas, suplementos
- **IVA:** incluido (cada barco lista "IVA" en `included`).
- **Moneda:** EUR.
- **Por persona:** NO. El precio es por barco completo.
- **Fianza (depósito):** importe aparte, NO metido en el precio. Valores en vivo: 200€ (sin licencia) / 500€ (con licencia y excursión) / 0€ (jet ski). (Nota: el catálogo estático dice 250€ Solar y 300€ Astec 480; la DB tiene 200€ en ambos — ver sección 6.)
- **Suplementos/extras:** aparte (parking 10€, nevera 5€, snorkel 7,5€, paddle 25€, seascooter 50€/60€, bebidas 2,5€/ud; packs 10/30/75€). NO están en el precio base.
- **Gasolina:** incluida SOLO en los sin licencia autopiloto; los con licencia y la excursión con capitán NO la incluyen (no afecta al número del precio, es alcance del servicio).

### Nombres EXACTOS de las embarcaciones (literales, para casar con el CRM)
Barcos (alquiler de embarcaciones):
1. `Solar 450`
2. `Remus 450`
3. `Remus 450 II`
4. `Astec 400`  ← **INACTIVO en la flota viva** (desactivado por el dueño)
5. `Astec 480`
6. `Mingolla Brava 19`
7. `Trimarchi 57S`
8. `Pacific Craft 625`
9. `Excursión Privada con Capitán`

Jet ski (NO son barcos de alquiler estándar; ver sección 7):
- `Circuito en Jet Ski`
- `Excursión en Jet Ski con Monitor`

---

## 3a) JSON RAW — fiel al modelo de la web (DB en vivo)

Estructura tal cual la guarda la web: cada barco tiene `pricing` con `BAJA/MEDIA/ALTA`, y cada temporada tiene `period` + `prices` por duración. Se incluyen `isActive`, `requiresLicense`, `licenseType` y `deposit`. Las reglas transversales (temporadas por mes, recargo finde, overrides) se documentan como metadatos.

```json
{
  "_meta": {
    "fuente": "Tabla boats (DB Neon en vivo), leída 2026-06-14",
    "moneda": "EUR",
    "iva": "incluido",
    "precioPor": "embarcacion_completa",
    "temporadasPorMes": {
      "BAJA": [4, 5, 6, 9, 10],
      "MEDIA": [7],
      "ALTA": [8],
      "cerrado": [11, 12, 1, 2, 3]
    },
    "recargoFinDeSemana": { "factor": 1.15, "dias": ["sabado", "domingo"], "excepcion": "agosto_no_aplica" },
    "redondeo": "multiplo_de_10_en_salidas_de_finde_y_override",
    "duracionMinima": { "agosto": "2h", "resto": "1h" }
  },
  "barcos": [
    {
      "id": "solar-450", "name": "Solar 450", "isActive": true, "requiresLicense": false, "licenseType": "none", "deposit": 200,
      "pricing": {
        "BAJA": { "period": "Abril-Junio, Septiembre-Cierre", "prices": { "1h": 75, "2h": 115, "3h": 130, "4h": 150, "6h": 190, "8h": 220 } },
        "MEDIA": { "period": "Julio", "prices": { "1h": 85, "2h": 135, "3h": 160, "4h": 180, "6h": 230, "8h": 270 } },
        "ALTA": { "period": "Agosto", "prices": { "1h": 95, "2h": 150, "3h": 180, "4h": 210, "6h": 260, "8h": 300 } }
      }
    },
    {
      "id": "remus-450", "name": "Remus 450", "isActive": true, "requiresLicense": false, "licenseType": "none", "deposit": 200,
      "pricing": {
        "BAJA": { "period": "Abril-Junio, Septiembre-Cierre", "prices": { "1h": 75, "2h": 115, "3h": 130, "4h": 150, "6h": 190, "8h": 220 } },
        "MEDIA": { "period": "Julio", "prices": { "1h": 85, "2h": 130, "3h": 160, "4h": 180, "6h": 230, "8h": 270 } },
        "ALTA": { "period": "Agosto", "prices": { "1h": 95, "2h": 140, "3h": 170, "4h": 210, "6h": 250, "8h": 290 } }
      }
    },
    {
      "id": "remus-450-ii", "name": "Remus 450 II", "isActive": true, "requiresLicense": false, "licenseType": "none", "deposit": 200,
      "pricing": {
        "BAJA": { "period": "Abril-Junio, Septiembre-Cierre", "prices": { "1h": 75, "2h": 115, "3h": 130, "4h": 150, "6h": 190, "8h": 220 } },
        "MEDIA": { "period": "Julio", "prices": { "1h": 85, "2h": 130, "3h": 160, "4h": 180, "6h": 230, "8h": 270 } },
        "ALTA": { "period": "Agosto", "prices": { "1h": 95, "2h": 140, "3h": 170, "4h": 210, "6h": 250, "8h": 290 } }
      }
    },
    {
      "id": "astec-480", "name": "Astec 480", "isActive": true, "requiresLicense": false, "licenseType": "none", "deposit": 200,
      "pricing": {
        "BAJA": { "period": "Abril-Junio, Septiembre-Cierre", "prices": { "1h": 80, "2h": 150, "3h": 180, "4h": 200, "6h": 240, "8h": 270 } },
        "MEDIA": { "period": "Julio", "prices": { "1h": 90, "2h": 160, "3h": 200, "4h": 220, "6h": 270, "8h": 340 } },
        "ALTA": { "period": "Agosto", "prices": { "1h": 100, "2h": 180, "3h": 220, "4h": 250, "6h": 290, "8h": 370 } }
      }
    },
    {
      "id": "astec-400", "name": "Astec 400", "isActive": false, "requiresLicense": false, "licenseType": "none", "deposit": 200,
      "_aviso": "INACTIVO en la flota viva (no se vende hoy). Precios DB difieren del catalogo estatico.",
      "pricing": {
        "BAJA": { "period": "Abril-Junio, Septiembre-Cierre", "prices": { "1h": 70, "2h": 105, "3h": 120, "4h": 135, "6h": 190, "8h": 225 } },
        "MEDIA": { "period": "Julio", "prices": { "1h": 80, "2h": 120, "3h": 145, "4h": 165, "6h": 235, "8h": 280 } },
        "ALTA": { "period": "Agosto", "prices": { "1h": 90, "2h": 130, "3h": 155, "4h": 180, "6h": 245, "8h": 300 } }
      }
    },
    {
      "id": "mingolla-brava-19", "name": "Mingolla Brava 19", "isActive": true, "requiresLicense": true, "licenseType": "navegacion", "deposit": 500,
      "pricing": {
        "BAJA": { "period": "Abril-Junio, Septiembre-Cierre", "prices": { "2h": 160, "4h": 230, "8h": 280 } },
        "MEDIA": { "period": "Julio", "prices": { "2h": 180, "4h": 260, "8h": 340 } },
        "ALTA": { "period": "Agosto", "prices": { "2h": 200, "4h": 280, "8h": 390 } }
      }
    },
    {
      "id": "trimarchi-57s", "name": "Trimarchi 57S", "isActive": true, "requiresLicense": true, "licenseType": "navegacion", "deposit": 500,
      "pricing": {
        "BAJA": { "period": "Abril-Junio, Septiembre-Cierre", "prices": { "2h": 160, "4h": 240, "8h": 290 } },
        "MEDIA": { "period": "Julio", "prices": { "2h": 190, "4h": 260, "8h": 340 } },
        "ALTA": { "period": "Agosto", "prices": { "2h": 210, "4h": 290, "8h": 400 } }
      }
    },
    {
      "id": "pacific-craft-625", "name": "Pacific Craft 625", "isActive": true, "requiresLicense": true, "licenseType": "navegacion", "deposit": 500,
      "pricing": {
        "BAJA": { "period": "Abril-Junio, Septiembre-Cierre", "prices": { "2h": 180, "4h": 250, "8h": 300 } },
        "MEDIA": { "period": "Julio", "prices": { "2h": 200, "4h": 280, "8h": 360 } },
        "ALTA": { "period": "Agosto", "prices": { "2h": 220, "4h": 300, "8h": 420 } }
      }
    },
    {
      "id": "excursion-privada", "name": "Excursión Privada con Capitán", "isActive": true, "requiresLicense": false, "licenseType": "none", "deposit": 500,
      "_nota": "Con patron profesional. No requiere licencia. Combustible NO incluido.",
      "pricing": {
        "BAJA": { "period": "Abril-Junio, Septiembre-Cierre", "prices": { "2h": 240, "3h": 320, "4h": 380 } },
        "MEDIA": { "period": "Julio", "prices": { "2h": 260, "3h": 340, "4h": 400 } },
        "ALTA": { "period": "Agosto", "prices": { "2h": 280, "3h": 360, "4h": 420 } }
      }
    }
  ]
}
```

---

## 3b) JSON MAPEADO al formato del CRM (`precios_barcos`)

Las 3 temporadas de la web encajan **directamente** con las 3 del CRM (Agosto = `temporadaAlta`, Julio = `temporadaMedia`, resto = `temporadaBaja`). El mapeo es 1:1 en nombres de temporada.

> **Estos valores son el PRECIO BASE** (entre semana, sin recargo de finde y sin overrides dinámicos), porque el modelo de 3 temporadas fijas del CRM **no puede representar** ni el +15% de fin de semana ni los recargos por rango de fechas (ver avisos en secciones 4 y 5). Las duraciones no ofrecidas van a `null` (ver huecos en sección 4).

```json
[
  { "barco": "Solar 450", "temporada": "temporadaBaja", "precio1h": 75, "precio2h": 115, "precio3h": 130, "precio4h": 150, "precio6h": 190, "precio8h": 220 },
  { "barco": "Solar 450", "temporada": "temporadaMedia", "precio1h": 85, "precio2h": 135, "precio3h": 160, "precio4h": 180, "precio6h": 230, "precio8h": 270 },
  { "barco": "Solar 450", "temporada": "temporadaAlta", "precio1h": 95, "precio2h": 150, "precio3h": 180, "precio4h": 210, "precio6h": 260, "precio8h": 300 },

  { "barco": "Remus 450", "temporada": "temporadaBaja", "precio1h": 75, "precio2h": 115, "precio3h": 130, "precio4h": 150, "precio6h": 190, "precio8h": 220 },
  { "barco": "Remus 450", "temporada": "temporadaMedia", "precio1h": 85, "precio2h": 130, "precio3h": 160, "precio4h": 180, "precio6h": 230, "precio8h": 270 },
  { "barco": "Remus 450", "temporada": "temporadaAlta", "precio1h": 95, "precio2h": 140, "precio3h": 170, "precio4h": 210, "precio6h": 250, "precio8h": 290 },

  { "barco": "Remus 450 II", "temporada": "temporadaBaja", "precio1h": 75, "precio2h": 115, "precio3h": 130, "precio4h": 150, "precio6h": 190, "precio8h": 220 },
  { "barco": "Remus 450 II", "temporada": "temporadaMedia", "precio1h": 85, "precio2h": 130, "precio3h": 160, "precio4h": 180, "precio6h": 230, "precio8h": 270 },
  { "barco": "Remus 450 II", "temporada": "temporadaAlta", "precio1h": 95, "precio2h": 140, "precio3h": 170, "precio4h": 210, "precio6h": 250, "precio8h": 290 },

  { "barco": "Astec 480", "temporada": "temporadaBaja", "precio1h": 80, "precio2h": 150, "precio3h": 180, "precio4h": 200, "precio6h": 240, "precio8h": 270 },
  { "barco": "Astec 480", "temporada": "temporadaMedia", "precio1h": 90, "precio2h": 160, "precio3h": 200, "precio4h": 220, "precio6h": 270, "precio8h": 340 },
  { "barco": "Astec 480", "temporada": "temporadaAlta", "precio1h": 100, "precio2h": 180, "precio3h": 220, "precio4h": 250, "precio6h": 290, "precio8h": 370 },

  { "barco": "Astec 400", "temporada": "temporadaBaja", "precio1h": 70, "precio2h": 105, "precio3h": 120, "precio4h": 135, "precio6h": 190, "precio8h": 225 },
  { "barco": "Astec 400", "temporada": "temporadaMedia", "precio1h": 80, "precio2h": 120, "precio3h": 145, "precio4h": 165, "precio6h": 235, "precio8h": 280 },
  { "barco": "Astec 400", "temporada": "temporadaAlta", "precio1h": 90, "precio2h": 130, "precio3h": 155, "precio4h": 180, "precio6h": 245, "precio8h": 300 },

  { "barco": "Mingolla Brava 19", "temporada": "temporadaBaja", "precio1h": null, "precio2h": 160, "precio3h": null, "precio4h": 230, "precio6h": null, "precio8h": 280 },
  { "barco": "Mingolla Brava 19", "temporada": "temporadaMedia", "precio1h": null, "precio2h": 180, "precio3h": null, "precio4h": 260, "precio6h": null, "precio8h": 340 },
  { "barco": "Mingolla Brava 19", "temporada": "temporadaAlta", "precio1h": null, "precio2h": 200, "precio3h": null, "precio4h": 280, "precio6h": null, "precio8h": 390 },

  { "barco": "Trimarchi 57S", "temporada": "temporadaBaja", "precio1h": null, "precio2h": 160, "precio3h": null, "precio4h": 240, "precio6h": null, "precio8h": 290 },
  { "barco": "Trimarchi 57S", "temporada": "temporadaMedia", "precio1h": null, "precio2h": 190, "precio3h": null, "precio4h": 260, "precio6h": null, "precio8h": 340 },
  { "barco": "Trimarchi 57S", "temporada": "temporadaAlta", "precio1h": null, "precio2h": 210, "precio3h": null, "precio4h": 290, "precio6h": null, "precio8h": 400 },

  { "barco": "Pacific Craft 625", "temporada": "temporadaBaja", "precio1h": null, "precio2h": 180, "precio3h": null, "precio4h": 250, "precio6h": null, "precio8h": 300 },
  { "barco": "Pacific Craft 625", "temporada": "temporadaMedia", "precio1h": null, "precio2h": 200, "precio3h": null, "precio4h": 280, "precio6h": null, "precio8h": 360 },
  { "barco": "Pacific Craft 625", "temporada": "temporadaAlta", "precio1h": null, "precio2h": 220, "precio3h": null, "precio4h": 300, "precio6h": null, "precio8h": 420 },

  { "barco": "Excursión Privada con Capitán", "temporada": "temporadaBaja", "precio1h": null, "precio2h": 240, "precio3h": 320, "precio4h": 380, "precio6h": null, "precio8h": null },
  { "barco": "Excursión Privada con Capitán", "temporada": "temporadaMedia", "precio1h": null, "precio2h": 260, "precio3h": 340, "precio4h": 400, "precio6h": null, "precio8h": null },
  { "barco": "Excursión Privada con Capitán", "temporada": "temporadaAlta", "precio1h": null, "precio2h": 280, "precio3h": 360, "precio4h": 420, "precio6h": null, "precio8h": null }
]
```

> **Nota sobre `Astec 400`:** incluido por completitud, pero está **INACTIVO** (no se vende hoy). Decide si lo importas o lo marcas como inactivo en el CRM.
> **Jet skis excluidos** de este array: no son alquiler de embarcaciones estándar y no encajan en las columnas 1h-8h (ver sección 7).

---

## 4) HUECOS (barco × duración × temporada sin precio)

Son huecos **estructurales** (esas duraciones no se ofrecen para ese tipo de barco), iguales en las 3 temporadas:

| Barco | Duraciones SIN precio (en BAJA, MEDIA y ALTA) | Motivo |
|---|---|---|
| Mingolla Brava 19 | 1h, 3h, 6h | Barco con licencia: solo 2h/4h/8h |
| Trimarchi 57S | 1h, 3h, 6h | Barco con licencia: solo 2h/4h/8h |
| Pacific Craft 625 | 1h, 3h, 6h | Barco con licencia: solo 2h/4h/8h |
| Excursión Privada con Capitán | 1h, 6h, 8h | Excursión con patrón: solo 2h/3h/4h |
| Solar 450, Remus 450, Remus 450 II, Astec 480, Astec 400 | (ninguno) | Ofrecen las 6 duraciones |

Total de celdas vacías en el array CRM: 4 barcos × 3 huecos × 3 temporadas = **36 celdas `null`** (todas estructurales, no son datos que falten por error).

---

## 5) AVISOS: lo que el modelo de 3 temporadas del CRM NO puede representar

1. **Recargo de fin de semana +15%** (sáb/dom, salvo agosto). En la web, el precio de finde es ~+15% sobre el de entre semana (redondeado a múltiplos de 10). El CRM con 3 temporadas por mes **no distingue día de la semana** → el mapeo usa el **precio base (entre semana)**. Si el CRM necesita el precio de finde, hay que calcularlo aparte (base × 1,15 redondeado a 10, excepto agosto).

2. **Overrides dinámicos por rango de fechas (15 activos, temporada 2026).** Son ajustes que la web aplica sobre el precio base en bloques de fechas concretos. **No caben en 3 temporadas fijas.** El CRM, tal como lo describes, no tiene esta dimensión. Resumen de los 15 overrides activos (todos multiplicadores; "global" = todos los barcos):

   | Rango fechas | Barco | Días | Ajuste | Etiqueta |
   |---|---|---|---|---|
   | 2026-06-16 → 06-30 | global | todos | **+20%** | Junio 2ª quincena (pre-temporada alta) |
   | 2026-06-15 → 06-30 | Astec 480 | L-V | +10% | (gana al global para este barco) |
   | 2026-06-15 → 06-30 | Astec 480 | S-D | +5% | (sobre finde nativo) |
   | 2026-06-01 → 06-15 | Solar 450 | L-V | +20% | Junio 1ª quincena · entre semana |
   | 2026-06-01 → 06-15 | Solar 450 | S-D | +20% | Junio · Fin de semana de temporada alta |
   | 2026-06-01 → 06-15 | Remus 450 | L-V | +20% | Junio 1ª quincena · entre semana |
   | 2026-06-01 → 06-15 | Remus 450 | S-D | +20% | Junio · Fin de semana de temporada alta |
   | 2026-06-01 → 06-15 | Remus 450 II | L-V | +20% | Junio 1ª quincena · entre semana |
   | 2026-06-01 → 06-15 | Remus 450 II | S-D | +20% | Junio · Fin de semana de temporada alta |
   | 2026-08-01 → 08-15 | Solar 450 | L-V | **−5%** (descuento) | Agosto 1ª quincena · entre semana |
   | 2026-08-01 → 08-15 | Solar 450 | S-D | +5% | Agosto 1ª quincena · fin de semana |
   | 2026-08-01 → 08-15 | Remus 450 | L-V | **−5%** (descuento) | Agosto 1ª quincena · entre semana |
   | 2026-08-01 → 08-15 | Remus 450 | S-D | +5% | Agosto 1ª quincena · fin de semana |
   | 2026-08-01 → 08-15 | Remus 450 II | L-V | **−5%** (descuento) | Agosto 1ª quincena · entre semana |
   | 2026-08-01 → 08-15 | Remus 450 II | S-D | +5% | Agosto 1ª quincena · fin de semana |

   Reglas de resolución: override boat-specific gana al global; mayor prioridad gana; el recargo de finde nativo +15% **apila** sobre el override. Si el CRM debe replicar esto, necesitará una tabla aparte de ajustes por rango de fechas; no es mapeable a `precios_barcos`.

3. **Redondeo:** la web redondea a múltiplos de 10 solo las salidas de finde/override; los precios base no. Si el CRM recalcula, replicar el redondeo para no divergir en céntimos.

4. **Cobertura de fechas de `temporadaBaja`:** en el CRM, "resto del año = temporadaBaja" incluye **Nov-Marzo**; en la web esos meses están **cerrados** (no se reserva). Los números mapeados a `temporadaBaja` son los de Abril-Junio/Sep-Oct. Si el CRM vende en invierno, aplicará precios de temporada baja que la web nunca cobra.

5. **Duración mínima:** agosto exige 2h mínimo; resto 1h. El precio de 1h existe igualmente en agosto en los datos, pero la web no deja reservarlo. El CRM no modela mínimos por temporada.

---

## 6) Divergencias DB (en vivo) vs catálogo estático (`shared/boatData.ts`)

Este export usa la **DB** (verdad de lo que se vende). Diferencias detectadas con el catálogo estático:

| Barco | Campo | DB en vivo (usado aquí) | Catálogo `boatData.ts` |
|---|---|---|---|
| Astec 400 | estado | **inactivo** (`is_active=false`) | (catálogo no tiene flag; se considera activo) |
| Astec 400 | precios | BAJA 2h 105 / 4h 135 / 8h 225; MEDIA 3h 145 / 4h 165 / 6h 235; ALTA 2h 130 / 4h 180 / 6h 245 / 8h 300 (regla Solar×0,95) | BAJA 2h 100 / 4h 140 / 8h 200; MEDIA 3h 150 / 4h 170 / 6h 210 / 8h 250; ALTA 2h 140 / 4h 190 / 6h 240 / 8h 280 |
| Solar 450 | depósito | **200€** | 250€ |
| Astec 480 | depósito | **200€** | 300€ |

El resto de barcos coinciden DB ↔ catálogo. (Los depósitos no forman parte del modelo `precios_barcos`, son informativos.)

---

## 7) Jet skis (NO son alquiler de embarcaciones estándar)

Están en la tabla `boats` y activos, pero el proyecto los trata como **producto de reventa** aparte: NO pasan por el motor de precios ni por el wizard horario, usan tramos de duración distintos y precio **plano todo el año** (sin temporadas). **No encajan en `precios_barcos`** (columnas 1h-8h). Se documentan aquí por transparencia:

```json
[
  { "id": "jetski-circuito", "name": "Circuito en Jet Ski", "isActive": true, "deposito": 0, "precioPlanoTodoElAnio": { "15min": 65, "30min": 110, "60min": 190 } },
  { "id": "jetski-excursion-monitor", "name": "Excursión en Jet Ski con Monitor", "isActive": true, "deposito": 0, "precioPlanoTodoElAnio": { "1h": 190, "2h": 330 } }
]
```

Avisos: el "Circuito" usa minutos (15/30/60), incompatible con las columnas horarias. La "Excursión con Monitor" sí tiene 1h y 2h, pero plano (mismo precio en baja/media/alta) y sin 3h/4h/6h/8h.

---

## 8) Resumen de procedencia de los datos

- **Precios base, flota viva, depósitos, estado activo, jet skis:** leídos de la **DB Neon en vivo** (tabla `boats`) el 2026-06-14 mediante consultas `SELECT` de solo lectura.
- **Overrides dinámicos:** leídos de la tabla `pricing_overrides` (15 filas activas).
- **Reglas del modelo** (temporadas por mes, recargo finde, redondeo, mínimos): de `shared/pricing.ts`.
- **Contraste de catálogo:** `shared/boatData.ts`.
- No se modificó ningún dato ni archivo del proyecto (scripts de lectura temporales creados y eliminados; árbol git limpio).
```

---

## 9) Configuración aplicada en Click&Boat (2026-06-18)

Se replicaron los precios de la web en la cuenta de **Click&Boat** (C&B) operando el panel de
propietario. Decisiones y límites de la plataforma:

- **Mapeo**: `media jornada` = **4h** de la web · `día completo` = **8h** de la web.
- **Se usa el precio ENTRE SEMANA (L-V)** de la web en cada periodo. C&B no permite precio por
  día de la semana (su calendario solo bloquea disponibilidad), así que el **recargo de finde
  +15% NO es representable**; el precio del periodo es el de L-V (nunca cobra de más).
- **Comisión**: el cliente paga lo mismo que en la web; el dueño absorbe la comisión de C&B
  (~21%). Decisión confirmada por el dueño: "exactamente los mismos precios que la web".
- **Cobertura**: 6 de los 8 barcos de la flota viva. **NO listados en C&B**: Remus 450 II y
  Excursión Privada con Capitán. **Astec 400**: sigue *Online* en C&B aunque está desactivado
  en la web (pendiente decisión de despublicar).
- El "Precio de referencia" (01 ene-31 dic) de cada anuncio se dejó intacto (solo aplica fuera
  de temporada).

Periodos configurados por barco (media jornada / día, EUR), verificados tras recargar:

| Barco (listing C&B) | abr | jun (split) | jul | agosto | sep-oct |
|---|---|---|---|---|---|
| Solar 450 (183671) | abr1-may31 150/220 | jun1-30 180/260 | 180/270 | ago1-15 200/290 · ago16-31 210/300 | 150/220 |
| Remus 450 (183677) | abr1-may31 150/220 | jun1-30 180/260 | 180/270 | ago1-15 200/280 · ago16-31 210/290 | 150/220 |
| Astec 480 (183678) | abr1-jun14 200/270 | jun15-30 220/300 | 220/340 | ago1-31 250/370 | 200/270 |
| Mingolla Brava 19 (183710) | abr1-jun15 230/280 | jun16-30 280/340 | 260/340 | ago1-31 280/390 | 230/280 |
| Trimarchi 57S (183704) | abr1-jun15 240/290 | jun16-30 290/350 | 260/340 | ago1-31 290/400 | 240/290 |
| Pacific Craft 625 (183672) | abr1-jun15 250/300 | jun16-30 300/360 | 280/360 | ago1-31 300/420 | 250/300 |

Origen de los números: precio efectivo (base estacional + finde + overrides 2026 + redondeo)
calculado con `calculatePricingBreakdown` de `shared/pricing.ts` sobre la flota viva, tomando el
valor de L-V de cada regimen de fechas. Nota: este export (secciones 1-8) listó 15 overrides el
2026-06-14; al ejecutar la configuración la tabla `pricing_overrides` tenía **12 activos**.
