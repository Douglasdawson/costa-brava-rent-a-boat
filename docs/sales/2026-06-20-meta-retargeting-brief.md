# Brief Meta Retargeting — 2026-06-20

**Objetivo:** recuperar a quien ya visitó la web pero no dejó solicitud. Es el pago más barato y de conversión más probable (audiencia caliente, no fría). Presupuesto de arranque: **~20 €/día, 7 días (140 €)**.

**Por qué retargeting y no awareness:** los datos GA4 (1-19 jun) muestran tráfico web real con `fbclid` ya entrando, así que el Pixel está poblando audiencias. El tráfico orgánico de este nicho tiene techo (~12 clics/día); el retargeting exprime el tráfico que ya pagamos/ganamos en vez de comprar alcance frío.

**No bloquea por WhatsApp Business:** esta campaña lleva a la WEB (no a la API de WhatsApp), así que el error #2446955 (número 611 sin validar como WhatsApp Business) NO afecta. Se puede lanzar ya.

---

## Configuración (Meta Ads Manager)

- **Cuenta:** act=10212525544363556
- **Pixel:** 1435375734200141 (ya instalado; eventos ViewContent, InitiateCheckout, Purchase, Lead configurados)
- **Objetivo de campaña:** Ventas (Sales) → optimizar por **Landing Page Views** al arranque (con poco volumen, optimizar por conversión "Lead" puede no salir de fase de aprendizaje; empezar por LPV y subir a Lead cuando haya señal).
- **Presupuesto:** CBO 20 €/día, 7 días. Revisar a día 3.
- **Ubicaciones:** Advantage+ (automáticas).
- **Frequency cap:** recomendado 1/día para no quemar la audiencia pequeña.

### Audiencias
- **Incluir (Custom Audience):** visitantes de la web últimos **14 días** (Pixel: todos los eventos / PageView).
- **Excluir:**
  - quien disparó **Lead** o **Purchase** en los últimos 30 días (ya son leads, no re-impactar),
  - tráfico interno / CRM (excluir `/CRM` si hay regla).
- **Idioma/Geo:** sin restringir país de residencia (el visitante ya nos conoce), pero **priorizar entrega a quien está físicamente en España/Costa Brava** si el tamaño lo permite. Anuncios en EN como principal (turista), con variante ES.

---

## Creatividades

**Formato:** carrusel (3-4 barcos) + 1 imagen única de cala como respaldo. Reusar imágenes WebP del repo (`client/public/images/`).

### Copy EN (principal)
```
Primary text: Still thinking about that boat day in Blanes? Coves you can only reach by sea, no licence needed, fuel included. Low-season prices until 30 June.
Headline: Rent a boat in Blanes from €75/h
Description: 4.8★ on Google · 09:00–20:00 · free date change
CTA: Book Now
```

### Copy ES (variante)
```
Primary text: ¿Le sigues dando vueltas a tu día de barco en Blanes? Calas que solo se ven desde el mar, sin licencia y con gasolina incluida. Tarifa baja hasta el 30 de junio.
Headline: Alquila un barco en Blanes desde 75 €/h
Description: 4,8★ en Google · 09:00–20:00 · cambio de fecha gratis
CTA: Reservar
```

### Copy FR (opcional, segunda variante)
```
Primary text: Vous repensez à cette journée en bateau à Blanes ? Des criques accessibles seulement par la mer, sans permis, carburant inclus. Tarifs basse saison jusqu'au 30 juin.
Headline: Louez un bateau à Blanes dès 75 €/h
Description: 4,8★ sur Google · 09h–20h · changement de date gratuit
CTA: Réserver
```

**Landing (con UTM):**
- EN: `https://costabravarentaboat.com/en?utm_source=meta&utm_medium=cpc&utm_campaign=retargeting_2026-06-20`
- ES: `https://costabravarentaboat.com/es?utm_source=meta&utm_medium=cpc&utm_campaign=retargeting_2026-06-20`
- FR: `https://costabravarentaboat.com/fr?utm_source=meta&utm_medium=cpc&utm_campaign=retargeting_2026-06-20`

---

## Hechos verificados usados (no inventar)
- Precio suelo flota viva: **desde 75 €/h, sin licencia, gasolina incluida** (`shared/boatData.ts` + canon; Astec 400 off).
- Temporada BAJA hasta 30 jun, sube a MEDIA el 1 jul (`shared/pricing.ts`).
- Rating 4,8 · 334 reseñas (`shared/businessProfile.ts`).
- Ventana 09:00–20:00, sin licencia ni papeleo.
- Política: cambio de fecha gratis hasta 7 días antes; mal tiempo → reprograma o devuelve depósito (`client/src/i18n/es.ts`).

## Medición
- Revisar a día 3: CPM, CTR, coste por Landing Page View, y leads atribuidos (UTM en GA4 `autopilot_ga4_lp` source=meta).
- Éxito mínimo: que el coste por lead del retargeting sea inferior al ticket medio. Si a día 3-4 hay 0 señal, pausar y revisar tamaño de audiencia (puede ser demasiado pequeña → ampliar ventana a 30/60 días).
