# Drift Sweep — 2026-05-27

> Auditoría sistemática de **drift de hechos** en la web (mismo dato dicho de manera distinta en varios sitios). Disparada por una incidencia con la política de cancelación; ampliada a 4 rondas que cerraron ~40 inconsistencias.

## Contexto

El sitio tenía la misma información declarada de formas contradictorias en distintas capas:

- i18n (8 idiomas)
- SEO metadata (`seo-config.ts`, `seoInjector.ts`)
- JSON-LD schemas
- Componentes JSX hardcoded
- Email templates (8 idiomas)
- WhatsApp knowledge base
- Blog seed data
- Páginas legales (`CondicionesGenerales.tsx`)
- Service descriptions (`businessProfile.ts`, MCP servers)

Cuando un hecho cambia (precio, flota, capacidad, política), no se propaga automáticamente. Resultado: contradicciones legales/operativas/comerciales que afectan SEO, CRO y confianza.

## Fuente de verdad por dominio

Quedó claro en la auditoría qué archivos son canónicos y deben gobernar el resto:

| Dominio | Fuente |
|---|---|
| Catálogo de barcos (nombre, capacidad, eslora, motor, fianza, modelo) | `shared/boatData.ts` |
| Precios por temporada/duración | `shared/pricing.ts` |
| Reglas de licencia náutica (thresholds eslora/CV, distancia legal) | `shared/nauticalLicenseRules.ts` + `shared/nauticalGlossary.ts` |
| Rating + review count (Google Business Profile) | `shared/businessProfile.ts` (`BUSINESS_RATING_STR`, `BUSINESS_REVIEW_COUNT_STR`) |
| Texto legal (condiciones de alquiler) | `client/src/components/CondicionesGenerales.tsx` |
| Política de cancelación (texto único multi-idioma) | `client/src/i18n/es.ts` → propaga vía `npm run i18n:translate` |

Cualquier otro archivo (i18n de otros idiomas, SEO meta, emails, blog) **debe derivar** de los canónicos. Si no se puede importar la constante, replicar el valor exacto y dejar comentario apuntando a la fuente.

## Rondas ejecutadas

### Ronda 1 — Política de cancelación unificada (`83de9eb`)

**Problema:** Dos políticas conviviendo:
- Legacy: "no reembolsable, cambio fecha 7d antelación, mal tiempo = reprogramar"
- Tier-based: "100% / 50% / 0% según horas a la salida"

El tier-based era código fantasma — la web no cobra online (modelo request-based), así que los porcentajes nunca se materializaban.

**Cierre:** Una sola política para toda la flota: *"Cambio de fecha gratuito hasta 7 días antes de la salida (sujeto a disponibilidad). Mal tiempo: reprogramamos sin coste o devolvemos el depósito íntegro. Las reservas confirmadas con depósito no son reembolsables fuera del supuesto de mal tiempo."*

- 8 idiomas i18n actualizados (sección "7. Política de cancelación" + FAQ corta + FAQ por barco + clave nominal `cancelacion` + FAQ "mal tiempo")
- `CondicionesGenerales.tsx`: bloque "CANCELACIONES Y CAMBIOS" reescrito en card SIN TITULACIÓN y **añadido** al card CON TITULACIÓN (antes no existía)
- Backend: `cancelBookingByToken` ya no calcula tramos %. Devuelve siempre `refundAmount: 0, refundPercentage: 0`
- `CancelBookingPage.tsx`: bloque condicional de 3 ramas colapsado a uno
- Email `sendCancelationEmail`: línea de reembolso fija con la política
- `seoInjector.ts`, `seedKnowledgeBase.ts`, `blogSeed.ts`, `seo-config.ts` actualizados
- Tests del endpoint /cancel actualizados (8/8 pasan)

### Ronda 2 — Fleet count + capacidades (`f11764c`, hereda de `826215b`)

**Problema:** Remus 450 II promovido a barco real el 2026-05-25 (9 barcos ahora, antes 8). Múltiples surfaces decían "8 boats". Además:
- Pacific Craft 625 declarado como "hasta 8 personas" — real = **7** (`boatData.ts:493`)
- Excursión Privada declarada "hasta 10 personas" — real = **6** (`boatData.ts:561`)
- Mingolla Brava 19 listado dentro de "barcos sin licencia" en respuesta de FAQ — real = **requiere licencia** (`boatData.ts:354`)
- "5 barcos sin licencia para hasta 5 personas" — Astec 400 es **4 personas**, no 5

**Cierre:**
- i18n `faqGroupSizeAnswer` reescrita con desglose correcto sin-licencia/con-licencia
- 8 idiomas alineados a "9 barcos / 9 boats / 9 barques / ..."
- `seo-config.ts` BUSINESS_INFO + 4 landing pages × ES/EN actualizadas
- `alquiler-barcos-costa-brava.tsx` schema description
- Blog post de comparación: tabla de capacidad + Pacific Craft + recomendación grupos grandes
- Chatbot KB + mensaje de error "capacidad máxima"

### Ronda 3 — Distancia navegación + review count (`cabecf4`, `28879d5`)

**Problema:**
- `CondicionesGenerales.tsx` decía "una milla desde la costa (1.8 km)" para SIN LICENCIA. El RD 875/2014 art. 6.2 permite hasta **2 millas náuticas (3,7 km)** para embarcaciones exentas. El resto del sitio (gloss, blog, SEO, i18n) ya decía 2nm — `CondicionesGenerales` contradecía la ley y el marketing.
- Misma cláusula "una milla" copy-pasted en card CON LICENCIA — totalmente fuera de lugar (los licenciados pueden ir mucho más lejos).
- 7 metas hardcoded con "310 reviews" en lugar de leer del canónico `BUSINESS_REVIEW_COUNT = 323` (`shared/businessProfile.ts`).
- 15 metas residuales con "8 boats / barques / Boote / ..." en CA/FR/DE/NL/IT/RU que la ronda 2 no pilló (solo cubrió ES/EN).

**Cierre:**
- `CondicionesGenerales.tsx:131` (SIN licencia): "1 milla / 1.8 km" → **"2 millas náuticas / 3,7 km"**
- `CondicionesGenerales.tsx:45` (CON licencia, commit `28879d5`): cláusula "1 milla" reemplazada por referencia a "los límites legales de la titulación náutica del patrón y la zona de navegación indicada en la sección «ZONA DE NAVEGACIÓN»"
- 7 metas SEO con "310 reviews" → `${BUSINESS_REVIEW_COUNT_STR}` (template literal)
- 15 metas SEO con "8 boats" / "8 barques" / "8 Boote" / etc. corregidas: clasificadas en total fleet → 9 vs. subset sin-licencia → 5 según contexto del calificador

### Ronda 4 — Componentes + páginas no auditadas (`a5edd9a`)

**Problema:** Las 3 rondas previas solo auditaron i18n/SEO/blog/templates. Quedaron 5 hits en componentes JSX y una page específica:
- `RelatedLocationsSection.tsx:44`: tag "8 barcos"
- `RelatedContent.tsx:67`: card description "8 barcos disponibles en Blanes"
- `location-barcelona.tsx:312`: hero "(5 de los 8 barcos)"
- `emailService.ts:1491`: email de partnership lista "8 barcos (con y sin licencia) para 4-7 personas"
- `seo-config.ts:468`: EN meta "8 no-license boats"

**Cierre:** Todos a 9 (total flota) o 5 (subset sin-licencia) según calificador. Verificación `rg` final: 0 hits.

## Bonus — GA4 server-side (`ae7edc0`)

No es drift sino una brecha de instrumentación destapada durante el sweep: GA4 reportaba 0 conversiones en mayo pero la BD tenía 79 inquiries + 28 booking requests. Cookie consent denial + script blockers se comen los eventos client-side.

- Nuevo helper `server/lib/analyticsServer.ts` (GA4 Measurement Protocol v1, lee cookie `_ga` para continuidad de sesión)
- Eventos disparados desde el server: `generate_lead` (inquiries) + `booking_request_submitted` (bookings)
- Gate de activación: `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` en Replit (pendiente)

## Commits

| Commit | Ronda | Files | LOC |
|---|---|---|---|
| `83de9eb` | 1 — política cancelación | 19 | +111 / -209 |
| `826215b` | 2a — fleet 8→9 (Replit sync) | 8 | n/a |
| `f11764c` | 2b — capacities + chatbot KB | 14 | +35 / -35 |
| `cabecf4` | 3a — nav distance + reviews | 3 | +29 / -29 |
| `28879d5` | 3b — line 45 CON licencia | 1 | +1 / -1 |
| `a5edd9a` | 4 — componentes residuales | 5 | +5 / -5 |
| `ae7edc0` | bonus — GA4 server-side | 3 | +120 |

## Verificaciones de no-regresión

```bash
# Ningún "8 barcos / 8 boats / ..." residual
rg -i '\b8 (barcos|boats|barques|bateaux|Boote|boten|barche|лодок|embarcaciones)\b' client/src server/ shared/

# Ningún "hasta 8 personas / hasta 10 personas"
rg -i 'hasta (8|10) personas' client/src server/ shared/

# Ningún tier de cancelación residual
rg -i '(reembolso del (100|50)|24-?48 ?h|menos de 24h)' client/src server/ shared/

# Distancia náutica consistente
rg 'una milla|1 milla|2 millas' client/src/components/CondicionesGenerales.tsx shared/nauticalGlossary.ts

# Review count usa constante
rg '310 review' server/seoInjector.ts client/src/utils/seo-config.ts
```

Las 5 checks deben dar **0 hits** (excepto comentarios históricos en `seo-config.ts:975`, `businessProfile.ts:53`, `whatsappTemplates.test.ts:10` — audit trail).

## Recomendaciones para prevenir drift futuro

1. **Cuando cambies un hecho canónico** (capacity, fleet count, review count, política), grep el código entero buscando el valor viejo antes del commit. Las constantes en `shared/` ayudan pero no todas las menciones derivan de ellas.
2. **Prefiere template literals con constantes** (`${BUSINESS_REVIEW_COUNT_STR}`) sobre valores hardcoded en strings — sobreviven al siguiente cambio.
3. **Las páginas legales** (`CondicionesGenerales.tsx`) son las que más drift acumulan porque están aisladas del flujo i18n. Auditar manualmente cuando cambia una regla legal/operativa.
4. **`npm run i18n:translate`** solo rellena claves *faltantes*. Cuando MODIFIQUES una clave existente en `es.ts`, hay que propagar manualmente o borrar la clave en los 7 idiomas y re-ejecutar.
5. **SEO meta descriptions** (en `seo-config.ts` y `seoInjector.ts`) son el sitio con más densidad de cifras hardcoded. Ahí buscar primero.
