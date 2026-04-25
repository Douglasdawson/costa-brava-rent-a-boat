# Cómo Google rankea — playbook 2026 + plan de automatización CBRB

**Fecha**: 2026-04-25
**Audiencia**: Ivan (owner) · Cowork (CMO)
**Propósito**: documentar las mejores prácticas que Google premia hoy y mapear cuáles podemos automatizar para que tú deriverer la operación en mí.

---

## Las 4 macro-categorías que Google evalúa

| Pilar | Peso | Qué mide |
|---|---|---|
| **1. Calidad de contenido (E-E-A-T)** | ~40% | Experiencia, autoridad, confianza |
| **2. SEO técnico** | ~25% | Velocidad, indexabilidad, schema, mobile |
| **3. SEO on-page** | ~20% | Match de intención, keywords, profundidad |
| **4. SEO off-page** | ~15% | Backlinks, menciones de marca, señales locales |

---

## 1. E-E-A-T 2.0 — lo que más ha cambiado post-Helpful Content System

Google's Helpful Content System (HCS) penaliza contenido escrito "para SEO" en lugar de para humanos. El sistema premia:

### 1.1 Experiencia first-hand
- Fotos reales (NO stock)
- Vídeos del producto en uso
- Casos reales de clientes
- Testimonios con nombre + foto

**CBRB ejemplo**: foto de Ivan dando briefing con un cliente real > foto de banco de imágenes de "barco genérico mediterráneo".

### 1.2 Autoría visible
- Cada blog firmado por persona con bio
- Bio con credenciales relevantes (años en la industria, formación)
- Foto del autor

**CBRB ejemplo**: artículos firmados por Ivan Ramírez con bio: *"Operador náutico en Costa Brava desde [año], +X reservas gestionadas, conocedor de las calas desde Blanes a Playa de Aro."*

### 1.3 Datos originales
- Estadísticas propias (% de clientes franceses, ratio licencia/sin licencia, etc.)
- Estudios pequeños del sector
- Insights únicos

### 1.4 Reviews recientes y abundantes
- Cantidad: >100
- Recencia: al menos 1/semana
- Respuesta del owner a cada una

**Estado CBRB**: 4.8★ · 310 reviews. Bien. Pero **falta cadencia de respuesta** y **frescura**.

---

## 2. SEO técnico — lo que penaliza si falla

### 2.1 Core Web Vitals (mid-2025 ya con INP)
| Métrica | Threshold "Good" |
|---|---|
| LCP (Largest Contentful Paint) | <2.5s |
| INP (Interaction to Next Paint) | <200ms |
| CLS (Cumulative Layout Shift) | <0.1 |

### 2.2 Mobile-first
- Mobile-first indexing es default desde 2023
- Si móvil es lento o roto → ranking cae

### 2.3 Schema/JSON-LD
- LocalBusiness, AggregateRating, AggregateOffer, FAQ, Service, ReserveAction
- Premia rich snippets (estrellas, precio, disponibilidad)

### 2.4 Crawlability
- Sitemap.xml actualizado
- Robots.txt limpio
- Internal linking semántico
- Canonical tags correctos
- No huérfanos (páginas sin enlaces internos)

### 2.5 Velocidad y assets
- WebP/AVIF imágenes
- Lazy loading
- Compresión Gzip/Brotli
- CDN

---

## 3. SEO on-page — lo que más mueve la aguja

### 3.1 Search intent alignment
Match exacto entre query y página:
- "alquiler barco blanes" = intención **transaccional** → página de booking
- "qué barco alquilar sin licencia" = intención **informacional** → blog post
- "costa brava rent a boat" = intención **navegacional** → home

**Mismatch = bounce rate alto = ranking cae.**

### 3.2 Topic clusters (no keyword stuffing)
- 1 página pillar (ej. "Alquiler Barco Costa Brava")
- N páginas supporting (Blanes, Lloret, Tossa, Playa de Aro, sin licencia, con licencia, packs, etc.)
- Internal links del pillar a supporting + entre supporting

### 3.3 Profundidad de contenido
- Articles ≥1500 palabras suelen rankear mejor que 500
- Tablas, FAQs, listas, imágenes
- Tiempo de lectura ≥4 min implícitamente premiado

### 3.4 Meta tags optimizados
- Title: ≤60 chars · keyword principal en primeros 30
- Meta description: 150-160 chars · CTA + USPs · social proof
- H1: keyword exacta · 1 por página
- H2/H3: variantes semánticas de la keyword

### 3.5 User engagement signals
- CTR desde SERP (premium > 5%)
- Dwell time (>2 min ideal)
- Bajo bounce rate
- No pogo-sticking (volver a SERP y elegir otro = mala señal)

---

## 4. SEO off-page — los backlinks siguen mandando

### 4.1 Cantidad × calidad × relevancia
- 1 link de TripAdvisor.com >> 50 de blogs anónimos
- Relevancia temática: links de turismo/náutica > links genéricos

### 4.2 Brand mentions sin link
- Google detecta menciones contextuales aunque no haya hipervínculo
- Suman a autoridad

### 4.3 Local citations (NAP)
- Nombre + Dirección + Teléfono coherente en todos los directorios
- Yelp, Páginas Amarillas, Foursquare, Trivago, Tripadvisor, etc.

### 4.4 Social signals
- Indirecto pero correlacionado
- Engagement en Facebook/Instagram aumenta tráfico → señal

---

## Lo que es ESPECÍFICO para tu negocio (Local SEO)

Costa Brava Rent a Boat es **negocio local** + **e-commerce** + **stagional**. Pesos especiales:

### Google Business Profile (GBP)
- Posts semanales (eventos, fotos, ofertas)
- Q&A activa
- Photo updates
- Hours updated
- Categorías correctas

**Estado actual**: existe, falta cadencia de posts.

### Local content
- Páginas con contenido sobre la zona (calas, rutas, restaurantes)
- Mapas embebidos
- Direcciones precisas

### Reviews velocity
- Google premia ratio reviews/mes vs competidores
- Si competidor tiene 5/mes y tú 1/mes → ellos suben

### Local backlinks
- Ayuntamiento Blanes
- Costa Brava Tourism
- Hoteles de la zona
- Influencers locales

---

## Mapa de automatización: qué puedo hacer YO vs qué necesita tu intervención

| Práctica | Estado CBRB | Auto por mí | Necesitas tú |
|---|---|---|---|
| Blog publishing (1/día) | ✓ Cron activo | ✓ Sí | — |
| Distribución 6 plataformas | ✓ Tray activa | ✓ Sí | Aprobar piezas |
| Schema/JSON-LD generation | ✓ Parcial | ✓ Sí (vía Claude Code) | — |
| Meta tags optimization | ✓ Parcial | ✓ Sí | — |
| Internal linking semántico | ❌ | ✓ Sí (audit + propuesta) | Aprobar |
| Topic cluster mapping | ❌ | ✓ Sí | Aprobar prioridades |
| Keyword research mensual | ❌ | ✓ Sí (vía GSC + Keyword Planner) | — |
| Backlink outreach drafting | ❌ | ✓ Sí (drafts emails) | Tú envías + relación |
| GBP posts | ❌ | ✓ Sí (drafts) | Tú publicas |
| Reviews response | ❌ | ⚠ Drafts | Tú firmas |
| Foto/video real | — | ❌ No | Tú produces |
| Author bio con credenciales | ❌ | ✓ Sí (drafts) | Tú revisas |
| Casos de cliente reales | ❌ | ⚠ Plantillas | Tú aportas relatos |
| Original data/research | ❌ | ⚠ Análisis sobre tus datos | Tú validas |
| Core Web Vitals mejora | ⚠ | ✓ Sí (briefs Claude Code) | — |
| Local citations consistency | ❌ | ⚠ Audit | Tú correciones manuales |
| Competitor monitoring | ❌ | ✓ Sí (semanal) | — |
| Rank tracking | ✓ GSC + autopilot | ✓ Sí | — |

---

## 90-day plan automatizable — qué te propongo

### Mes 1 — Foundations (gaps críticos)
1. Topic cluster map completo (pillar + supporting + interlinks)
2. Schema/JSON-LD audit y completion (todas las páginas)
3. Meta tags optimization (top 20 páginas con mayor impresiones)
4. Author bio + credenciales (página /sobre-nosotros)
5. GBP posting cadence semanal (drafts pre-aprobados)

### Mes 2 — Content depth
6. Blog calendar 4-6 artículos/semana (cluster topics)
7. Distribución a 6 plataformas auto
8. Backlink outreach (10 contactos/semana drafted)
9. Internal linking audit + ejecución
10. Reviews response system (drafts)

### Mes 3 — Authority signals
11. Casos de cliente (template + 1 real/mes)
12. Local backlinks (ayuntamiento, turismo, hoteles)
13. Original research (publicar stats propias)
14. Competitor benchmarking dashboard
15. Rank tracking semanal con alertas

---

## Lo que necesito de ti (mínimo)

1. **Aprobar el plan** o pedir modificaciones
2. **Decidir prioridades** si hay que elegir
3. **Aportar relatos reales** de clientes (1-2 frases por cliente, yo monto el caso)
4. **Producir 1 foto/video al mes** (móvil basta)
5. **Firmar reviews response** (yo redacto)
6. **Aprobar GBP posts** antes de publicar

Todo lo demás lo automatizo yo (vía briefs a Claude Code, autopilot MCP, distribución tray, etc.).

---

## Decisión

¿Quieres que prepare el primer brief concreto para arrancar el Mes 1? Empezaría por el **topic cluster map** porque es la base sobre la que se apoya todo el contenido posterior.
