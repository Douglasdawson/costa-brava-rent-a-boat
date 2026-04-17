# SEO Domination Program — Design Doc

**Fecha:** 17 abril 2026
**Autor:** Claude (con aprobación de Iván)
**Estado:** Design aprobado, pendiente plan de implementación
**Duración programa:** 26 semanas (abril 2026 → octubre 2026) + análisis offseason

---

## 1. Objetivo

Convertir costabravarentaboat.com en la referencia SEO #1 para alquiler de barcos en Costa Brava durante la temporada 2026, y construir autoridad de dominio sostenible para mantener esa posición en 2027+.

**Triple meta:**
1. **Quick wins fase crítica (abril-mayo):** impacto medible en reservas de temporada 2026.
2. **Dominio sector 12 meses:** #1-3 en queries principales (`alquiler barco costa brava`, `alquiler barco blanes`, variantes long-tail).
3. **Captación turismo internacional:** rankear en FR/DE/NL/IT para capturar tráfico peak julio-agosto.

## 2. Estado actual (auditoría 17-abril-2026)

**Fortalezas técnicas (7/10):**
- Sitemaps completos con hreflang en 8 idiomas (`server/routes/sitemaps.ts`)
- JSON-LD: LocalBusiness + Product + reviews + FAQ + Blog (`client/src/utils/seo-schemas.ts`, `server/seoInjector.ts`)
- IndexNow activo (`server/seo/indexnow.ts`)
- Core Web Vitals monitoreados (`server/seo/collectors/cwv.ts`)
- GTM + GA4 + Consent Mode v2 (`client/index.html`)
- robots.txt inteligente con allowlist de AI crawlers (`server/routes/robots.ts`)
- 29 blog posts con cross-linking a coastrent.es (`server/seeds/blogSeed.ts`)

**Debilidades de ejecución:**
- **Canibalización:** homepage rankea #9 para "alquiler barco blanes", pero `/alquiler-barcos-blanes` ni aparece. CTR 0.3%.
- **Títulos no capturan "Costa Brava"** (725 impresiones/mes perdidas).
- **GMB no sincronizado:** reviews 4.8★ hard-coded en schema, no desde API de Google.
- **Páginas ubicación genéricas:** 10 páginas con plantilla común, poca diferenciación.
- **FR/DE/NL sin optimización real:** 172+ impresiones/mes en FR sin páginas optimizadas.
- **Conversión WhatsApp no trackea:** no sabemos qué keywords traen bookings.
- **URLs Wix antiguas aún indexadas:** Google no ha re-crawleado 301s.

**Triángulo crítico confirmado activo:** Google My Business ✅, Google Search Console ✅, GA4 ✅.
**Pendiente:** Bing Webmaster Tools (registrar en semana 1).

## 3. Arquitectura del programa

6 batallas paralelas coordinadas por el MCP server `seo-engine.ts`:

```
                     [Orquestador: Claude + seo-engine MCP]
                                    │
        ┌───────────┬───────────┬───┴───┬───────────┬──────────┐
        ▼           ▼           ▼       ▼           ▼          ▼
     [1.Web]    [2.GMB]    [3.Video] [4.GEO] [5.Prog.SEO] [6.Links]
```

**Ciclos operativos:**
- **Diario:** monitor GSC + GA4 + alertas automáticas
- **Semanal:** GMB post + blog post + review responses + reporte lunes
- **Mensual:** análisis competencia + audit canibalización + link outreach

**Distribución de trabajo:**
- **Claude (autónomo):** 95% — código, contenido, análisis, schemas, orquestación
- **Iván:** ~2-3 h/semana — imágenes Nanobanana, validación, autorización accesos, vídeo en julio

## 4. Las 6 batallas — componentes clave

### Batalla 1 — Web técnica + contenido

- Reescritura titles/meta de 37 páginas (incluir "Costa Brava", power words, precio)
- Fix canibalización homepage vs páginas ubicación
- Reescritura 10 páginas ubicación con contenido único (calas, restaurantes, rutas, FAQ local)
- Nuevas páginas: Platja d'Aro, Sant Feliu, Palamós
- Rich snippets FAQ/HowTo/Speakable en todas las páginas
- Tracking conversión WhatsApp (evento GA4 + funnel)
- Content hub "Guía Costa Brava" (pillar 4000+ palabras + topic clusters)
- Core Web Vitals push: lazy loading imágenes, WebP/AVIF, preload crítico

### Batalla 2 — Google My Business

- Auditoría + completar ficha (categorías 2ª, service areas, atributos)
- Posts semanales automatizados (MCP + scheduler + Nanobanana images)
- Q&A seed program (30-50 preguntas + respuestas keyword-rich)
- Review acquisition engine (WhatsApp follow-up 24h post-uso)
- Review response automation (respuesta en 24h con tono humano)
- Sync GMB API → schema JSON-LD dinámico

### Batalla 3 — Video SEO / YouTube (híbrida)

- **Fase A (abril-junio):** Canal YouTube + 10-15 vídeos slideshow cinemático (Nanobanana images + música) con VideoObject schema
- **Fase B (julio-agosto):** Grabación móvil orgánica cuando Iván esté en el puerto
- Guiones por Claude (30 vídeos totales plan 12 meses)
- Subtítulos en 4 idiomas (es, en, fr, de)
- Embed estratégico en páginas de barcos y rutas
- Derivados Shorts/Reels para TikTok e Instagram

### Batalla 4 — Generative Engine Optimization (GEO)

- Implementar `llms.txt` + `llms-full.txt` (nuevo estándar)
- FAQ schema en todas las páginas con preguntas long-tail
- Datos factuales con unidades en todo contenido
- Entidades Wikipedia/Wikidata (cuando haya notoriedad)
- Author/captain bio pages (E-E-A-T)
- Date stamps visibles "actualizado en [mes año]"

### Batalla 5 — Programmatic SEO

- Template alta calidad (NO boilerplate, data real DB + copy contextual)
- Matriz: `boat × location × duration × occasion × language`
- Research 300-500 queries long-tail desde GSC + keyword tools
- Sprint mayo: generar 150-200 páginas en batches validados
- Internal linking cluster desde pillar pages
- Monitoring anti-spam: noindex automático si bounce >80% o tiempo <10s

### Batalla 6 — Link building orgánico (sin OTAs, decisión del negocio)

- Citations locales: Tripadvisor, Yelp, Foursquare, Turisme Blanes/Girona, Costa Brava Pirineu, Ports de Catalunya, Federació Catalana Vela
- Partnerships hoteles (30-50 Blanes/Lloret/Tossa/Platja d'Aro) — recomendación cruzada
- Partnerships restaurantes puerto + chiringuitos — contenido bidireccional
- Digital PR: 3-4 historias/año en medios locales (Diari de Girona, El Punt Avui, Catalunya Comarcal)
- Guest posts: 5-10 en blogs viajes/lifestyle Catalunya
- Blogger outreach: experiencia gratis a 20 creators a cambio de post honesto
- Refuerzo sister site coastrent.es con bundles cross-sell
- HARO/press requests monitoring

## 5. Flujo de datos

```
GSC ──► Análisis mensual ──► Prioridades contenido
 ▲                                   │
 │                                   ▼
Indexación ◄── IndexNow ◄── Nuevas páginas + blog
 ▲                                   │
 │                                   ▼
Web live ◄── Schema dinámico ◄── Reviews GMB API
 ▲                                   ▲
 │                                   │
Bookings ──► WhatsApp follow-up ──► Review requests
 │
 ▼
GA4 funnel ──► Reporte semanal ──► Acciones recomendadas
```

Todo coordinado por MCP server `seo-engine.ts` (extendemos con módulos nuevos).

## 6. KPIs y medición

**Leading indicators (semanal):**
| Métrica | Objetivo | Threshold alerta |
|---------|----------|------------------|
| Impresiones GSC | +30% vs 2025 | Caída >15% |
| CTR medio | 3%+ | <1% en top 20 |
| GMB views + actions | +40% vs baseline | Caída >10% |
| Posiciones keywords target | Top 10 → Top 3 | Pérdida de top 10 |

**Lagging indicators (mensual):**
| Métrica | Objetivo 2026 |
|---------|---------------|
| Booking requests orgánicos | +40% vs 2025 |
| Conversión visit→WhatsApp | 2.5%+ |
| Reviews Google nuevas | +10/mes |
| Rating medio | Mantener ≥4.8 |

Dashboard consolidado cada lunes con 3 acciones recomendadas para la semana.

## 7. Calendario estacional

| Semanas | Fase | Foco | Deliverables críticos |
|---------|------|------|----------------------|
| 1-2 (abr) | Quick Wins | Batallas 1+2 | Title homepage, fix canibalización, tracking WA, Bing WMT, GMB audit + primeros 3 posts |
| 3-6 (may) | Expansión | +Batallas 4+6 | Páginas ubicación 2.0, rich snippets everywhere, review engine, 20 posts GMB, outreach 50 hoteles, llms.txt |
| 7-10 (jun) | Sprint Programmatic | +Batallas 3+5 | 150-200 páginas long-tail, traducciones reales FR/DE/NL, primeros 10 vídeos slideshow |
| 11-22 (jul-sep) | Peak season | Mantener | Monitor, ajuste CTR, recogida reviews masiva, blog continuo, GMB semanal, vídeo orgánico móvil |
| 23-26 (oct) | Offseason | Análisis + link building | Audit completo 12m, digital PR, prep 2027, guest posts ofensivos |

## 8. Gestión de riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Google algorithm update | Alto | Diversificación multi-superficie — si cae una batalla, 5 sostienen |
| Programmatic detectado como thin | Alto | Monitoring automático + noindex si bounce >80% |
| Manual action por links | Crítico | Solo outreach orgánico. Zero compras, zero PBNs |
| Presión peak season | Medio | Frontload críticos abril-mayo. Jul-ago = solo mantenimiento |
| API limits GMB/Bing | Medio | Retry queue + circuit breaker existentes |
| Traducciones débiles | Alto | Validación nativa vía Claude con prompts específicos, no auto-translate |
| Reviews negativas crisis | Medio | Response automation 24h + escalación manual si >2★ |
| Imágenes Nanobanana inconsistentes | Bajo | Prompts templated + style guide |

## 9. Decisiones cerradas

| Decisión | Resolución |
|----------|-----------|
| OTAs (Samboat, Click&Boat) | **NO.** Solo link building orgánico. Proteger margen. |
| Bing Webmaster Tools | Registrar semana 1 |
| Video strategy | Híbrida: slideshow Nanobanana abril-jun, orgánico móvil jul-ago |
| Autonomía Claude | Total. Iván valida y provee imágenes/vídeo ocasional |
| Alcance mercado | ES prioritario + FR/DE/NL/IT para peak turismo |
| Secuenciación | Batallas 1+2 → 4+6 → 5+3 (no todo en paralelo desde día 1) |

## 10. Criterios de éxito

**Milestone 1 (fin mayo):**
- Title homepage actualizado y rankeando #1-5 para "alquiler barco costa brava"
- CTR medio >2%
- Tracking WhatsApp funcionando con funnel completo
- 10 páginas ubicación rewriteadas
- GMB con 4+ posts/semana, categorías completas

**Milestone 2 (fin julio — peak season):**
- Booking requests orgánicos +30% vs jul-2025
- 150+ páginas programmatic live con >10 bookings atribuidos
- 15+ vídeos en YouTube
- 5+ partnerships hoteles activos con links
- FR/DE/NL rankean top 20 para queries principales

**Milestone 3 (fin octubre — cierre 2026):**
- #1-3 para "alquiler barco costa brava" y "alquiler barcos blanes"
- Booking requests orgánicos 2026 +40% vs 2025
- DA (Domain Authority) +10 puntos
- 300+ reviews Google totales
- Menciones editoriales en 3+ medios

## 11. Implementación

Este design doc se traduce en un plan de implementación (fase por fase con tareas atómicas) en documento separado: `docs/plans/2026-04-17-seo-domination-program-implementation.md`.

Cada fase tendrá su propia sesión de ejecución con verificación antes de pasar a la siguiente.
