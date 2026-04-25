# Topic Cluster Map — Costa Brava Rent a Boat

**Fecha**: 2026-04-25
**Base de datos**: 82 páginas existentes (sitemap pulled hoy) + 30 queries top GSC últimos 90 días.

---

## Estructura propuesta — 5 pilares

```
                ┌────────────────────────────────────┐
                │       HOME /es/ (Hub central)      │
                └─────────────────┬──────────────────┘
                                  │
        ┌────────────┬────────────┼────────────┬────────────┐
        ▼            ▼            ▼            ▼            ▼
   PILAR 1      PILAR 2      PILAR 3      PILAR 4      PILAR 5
   "Por          "Sin         "Por         "Por          "Info
   destino"      licencia"    barco"       experiencia"  práctica"
```

---

## Pilar 1 — Por destino / Local intent

**Pillar page**: `/es/alquiler-barcos-costa-brava`

**Supporting pages existentes** (location pages):

| Slug | Imp GSC 90d | Status |
|---|---:|---|
| /es/alquiler-barcos-blanes | 381 | ✓ Existe — alta demanda |
| /es/alquiler-barcos-lloret-de-mar | 216 | ✓ Existe — buena demanda |
| /es/alquiler-barcos-tossa-de-mar | 121 | ✓ Existe |
| /es/alquiler-barcos-malgrat-de-mar | — | ✓ Existe — bajo |
| /es/alquiler-barcos-santa-susanna | — | ✓ Existe — bajo |
| /es/alquiler-barcos-calella | — | ✓ Existe |
| /es/alquiler-barcos-pineda-de-mar | — | ✓ Existe |
| /es/alquiler-barcos-palafolls | — | ✓ Existe |
| /es/alquiler-barcos-tordera | — | ✓ Existe |
| /es/alquiler-barcos-cerca-barcelona | — | ✓ Existe — query de captura |

**🚨 Gap detectado #1: Playa de Aro**
- GSC: query `alquiler barco sin licencia platja d'aro` = **122 impresiones** en 90d
- No existe `/es/alquiler-barcos-platja-daro` ni `/es/alquiler-barcos-playa-de-aro`
- Es la **5ª localidad por demanda** y no tenemos página

**🚨 Gap detectado #2: Sant Feliu de Guíxols / Cala Sant Pol**
- Frontera norte de la zona de navegación con licencia
- Sin página

**Sub-pillar páginas existentes (calas):**
- /es/destinos/cala-bona
- /es/destinos/sa-palomera
- /es/destinos/cala-sant-francesc
- /es/destinos/cala-pola-tossa

**Internal linking propuesta**:
- Cada location page → linkea a 3-5 calas accesibles desde ahí
- Cada cala → linkea a la location page más cercana
- Pillar → todas las locations top 5 (Blanes, Lloret, Tossa, Playa de Aro, Cerca Barcelona)

---

## Pilar 2 — Sin Licencia (diferenciador clave)

**Pillar page**: `/es/barcos-sin-licencia`

**Demanda GSC top:**
- "alquiler barco sin licencia" — 452 imp
- "alquiler barco sin licencia costa brava" — 225 imp
- "alquiler barco sin licencia lloret de mar" — 161 imp
- "alquiler barco sin licencia platja d'aro" — 122 imp
- "alquiler barco sin licencia" + variantes — sumadas ~960 imp/90d

**Supporting boats (modelos sin licencia):**
- /es/barco/solar-450
- /es/barco/remus-450
- /es/barco/remus-450-ii
- /es/barco/astec-400
- /es/barco/astec-480

**Supporting blog posts (cluster sin licencia):**
- /es/blog/preguntas-frecuentes-alquiler-barco-sin-licencia
- /es/blog/guia-alquiler-barcos-sin-licencia-blanes
- /es/blog/comparativa-barcos-sin-licencia-blanes
- /es/blog/alquiler-barco-sin-licencia-blanes-guia
- /es/blog/barco-sin-licencia-vs-con-licencia-guia
- /es/blog/comparativa-barcos-con-sin-licencia-blanes

**🚨 Gap detectado #3**: faltan páginas LOCALES sin licencia
- "alquiler barco sin licencia lloret" → existe blog pero no página de servicio
- "alquiler barco sin licencia tossa" → no existe
- "alquiler barco sin licencia playa de aro" → no existe (× 2 con gap #1)

Recomendación: páginas híbridas tipo `/es/alquiler-barco-sin-licencia-lloret-de-mar` que combinan los 2 cluster (sin licencia + lloret).

**Internal linking propuesta**:
- Pillar → 5 boats sin licencia + 6 posts cluster
- Cada boat sin licencia → pillar + 2 posts cluster
- Cada post cluster → pillar + 2 posts hermanos

---

## Pilar 3 — Por barco (modelo)

**Pillar page**: opción `/es/flota` o reusar `/es/galeria` como hub.

**Supporting pages existentes** (barcos):

| Modelo | Tipo | Slug |
|---|---|---|
| Solar 450 | Sin licencia | /es/barco/solar-450 |
| Remus 450 | Sin licencia | /es/barco/remus-450 |
| Remus 450 II | Sin licencia | /es/barco/remus-450-ii |
| Astec 400 | Sin licencia | /es/barco/astec-400 |
| Astec 480 | Sin licencia | /es/barco/astec-480 |
| Pacific Craft 625 | Con licencia | /es/barco/pacific-craft-625 |
| Mingolla Brava 19 | Con licencia | /es/barco/mingolla-brava-19 |
| Trimarchi 57S | Con licencia | /es/barco/trimarchi-57s |
| Excursión privada | Con capitán | /es/barco/excursion-privada |

**Demanda GSC sobre modelos:**
- "astec 400" — 215 imp ⚠️ alta demanda branded
- "remus 450" — 138 imp ⚠️ alta demanda branded

**🚨 Gap detectado #4**: Las páginas de barco están genéricas, no optimizan suficiente la búsqueda branded "Astec 400" o "Remus 450". Estos modelos tienen búsqueda directa.

**Propuesta**: añadir contenido tipo "Astec 400 vs Remus 450" + "Por qué elegir Solar 450 para familias" tipo comparativas.

**Internal linking**:
- Pillar (flota) → todos los barcos
- Cada barco → comparable hermano + experience pages relevantes
- Cada barco → location pages más relevantes

---

## Pilar 4 — Por experiencia / Caso de uso

**Sub-pillars existentes:**
- /es/excursion-snorkel-barco-blanes
- /es/barco-familias-costa-brava
- /es/paseo-atardecer-barco-blanes
- /es/pesca-barco-blanes

**Supporting blog posts:**
- /es/blog/alquiler-barco-familias-costa-brava
- /es/blog/navegar-con-ninos-costa-brava-guia-familias
- /es/blog/atardeceres-mar-rutas-sunset-costa-brava
- /es/blog/snorkel-buceo-costa-brava-barco
- /es/blog/aventura-costa-brava-mar-snorkel-kayak-barco-blanes
- /es/blog/excursiones-barco-grupos-eventos-blanes
- /es/blog/alquiler-barco-cumpleanos-despedida-costa-brava

**🚨 Gap detectado #5**: faltan service pages para 3 segmentos:
- **Despedidas / cumpleaños** (existe blog pero no service page)
- **Eventos corporativos** (no existe)
- **Excursiones románticas / aniversarios** (no existe pero hay blog)

**Internal linking propuesta**:
- Pillar (¿/es/experiencias?) → 4 service pages + 7 posts
- Cada experience page → boats compatibles + locations + 2 blog posts cluster

---

## Pilar 5 — Información práctica / Top of funnel

**Supporting pages existentes:**
- /es/precios — pillar de precios
- /es/rutas — pillar de rutas
- /es/faq — pillar de FAQ
- /es/testimonios — social proof
- /es/sobre-nosotros — E-E-A-T

**Supporting blog posts (cluster info):**
- /es/blog/cuanto-cuesta-alquilar-barco-blanes-precios
- /es/blog/que-llevar-barco-alquiler-checklist
- /es/blog/consejos-primera-vez-alquilar-barco
- /es/blog/seguridad-alquiler-barcos-consejos
- /es/blog/seguridad-navegacion-mar-guia
- /es/blog/mejor-epoca-alquilar-barco-blanes
- /es/blog/costa-brava-septiembre-mejor-mes-navegar
- /es/blog/que-hacer-en-blanes-en-barco
- /es/blog/que-hacer-en-blanes-verano
- /es/blog/historia-maritima-blanes
- /es/blog/gastronomia-marinera-blanes
- /es/blog/gastronomia-marinera-blanes-puerto-plato-costa-brava
- /es/blog/fauna-marina-costa-brava-barco
- /es/blog/guia-blanes-pueblo-costa-brava-que-ver-hacer
- /es/blog/colaboradores-costa-brava
- /es/blog/vacaciones-familia-costa-brava-plan-5-dias

---

## Resumen — gaps prioritarios por impacto SEO

| # | Gap | Demanda GSC 90d | Acción |
|---|---|---:|---|
| 1 | Playa de Aro location page | 122 imp | Crear `/es/alquiler-barcos-platja-daro` |
| 2 | Sin licencia + Lloret/Tossa hybrid | ~280 imp | Crear 2 páginas híbridas |
| 3 | Modelos barco branded (Astec, Remus) | 350 imp | Mejorar páginas /barco/* con keyword headers + comparativas |
| 4 | Service page despedidas/eventos | TBC | Crear 2 service pages |
| 5 | Sant Feliu de Guíxols | TBC | Crear si confirmamos demanda |

---

## Internal linking — matriz simplificada

Reglas a aplicar via brief Claude Code:

1. **Cada blog post** debe linkear a:
   - 1 service page relevante (la "money page" de su tema)
   - 2 blog posts hermanos del mismo cluster
   - 1 boat page si el contenido es relevante

2. **Cada location page** debe linkear a:
   - 3-5 calas accesibles desde ahí
   - 2 boats compatibles con ese trayecto
   - 1 blog post con ruta sugerida

3. **Cada boat page** debe linkear a:
   - 1 página de licencia (sin/con)
   - 2 location pages donde se opera
   - 1 experience page compatible (familia, snorkel, etc.)
   - 1 boat hermano comparable

4. **Cada experience page** debe linkear a:
   - Boats compatibles
   - Blog posts del cluster
   - 1-2 location pages

5. **Cada service page (precios, faq, rutas)** debe linkear a:
   - Pillar de cluster donde aplica
   - 2-3 blog posts del cluster

---

## Recomendación de ejecución (orden por impacto × esfuerzo)

### Mes 1 — Gaps críticos
1. Crear página Playa de Aro + Sin licencia × 2 ubicaciones híbridas (~3 páginas, alta demanda)
2. Audit + ejecución internal linking (Claude Code brief)
3. Optimizar páginas de barco branded (Astec, Remus, Solar)

### Mes 2 — Profundización
4. Crear service pages despedidas + eventos
5. Author bios en blog posts (E-E-A-T)
6. Comparativas barco vs barco (cluster sin licencia)

### Mes 3 — Authority
7. Original research / data publicada
8. Casos de cliente con foto + nombre
9. Guías ultra-completas (long-form 3000+ palabras) por cluster

---

## Lo que necesito de ti para arrancar

**1 decisión**: empezamos por el gap #1 (Playa de Aro) o por #3 (internal linking — afecta a todas las páginas existentes)?

Mi recomendación: **#3 internal linking**. Razón: es un cambio de máximo apalancamiento que mejora TODAS las páginas existentes en una sola intervención. Crear Playa de Aro es +1 página, internal linking es +82 páginas mejoradas.
