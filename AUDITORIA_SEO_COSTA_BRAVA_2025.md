# Auditoría SEO On-Page - Costa Brava Rent a Boat Blanes
## Enfoque: Optimización Google Sitelinks
**Fecha**: 12 Octubre 2025  
**Sitio**: https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/  
**Objetivo**: Auditoría completa con elementos de acción priorizados (sin implementación automática)

---

## Resumen Ejecutivo

### Estado Actual
El sitio web cuenta con una **infraestructura SEO sólida** implementada:
- Sistema de metadatos centralizado (seo-config.ts)
- Componente SEO dinámico (SEO.tsx)
- JSON-LD estructurado para LocalBusiness
- Tags hreflang para 8 idiomas (es, en, ca, fr, de, nl, it, ru)
- Sitemap.xml dinámico y robots.txt configurados
- Open Graph y Twitter Cards implementados
- Optimizaciones de rendimiento (WebP, lazy loading, code splitting)

### Hallazgos Críticos para Google Sitelinks

**ALTO IMPACTO** (Implementar inmediatamente)
1. **Estructura de URLs con parámetros de consulta** - El sitemap usa `?lang=es` en lugar de URLs limpias tipo `/es/`, lo que dificulta la indexación multiidioma y generación de Sitelinks
2. **Falta de breadcrumbs** - No hay navegación de migas de pan (crítico para Sitelinks jerárquicos)
3. **Falta de Schema.org BreadcrumbList** - Sin datos estructurados de breadcrumbs
4. **Títulos no optimizados** - Algunos títulos superan 60 caracteres o no incluyen CTAs

**MEDIO IMPACTO** (Implementar en 2-4 semanas)
5. **Schema.org Product faltante** - Las páginas de barcos individuales no tienen schema de producto
6. **FAQPage schema incompleto** - Página FAQ sin datos estructurados FAQPage
7. **Imágenes sin optimización alt** - Falta análisis de atributos alt descriptivos
8. **Falta schema.org ItemList** - Para la página de flota

**BAJO IMPACTO** (Mejora continua)
9. **Meta keywords obsoletas** - Actualmente implementadas pero Google las ignora
10. **Canonical absolutos vs relativos** - Usar siempre URLs absolutas
11. **Velocidad de carga mobile** - Monitorización constante (actualmente >90%)

### Score SEO Global Estimado
**7.5/10** - Buena base, necesita ajustes estructurales para Sitelinks óptimos

---

## Checklist de Acciones Priorizadas

### Prioridad 1 - CRÍTICO (0-2 semanas)

- [ ] **A1.1** - Implementar sistema de URLs limpias multiidioma
  - Cambiar de `/?lang=es` a `/es/` (o subdominio `es.example.com`)
  - Actualizar sitemap.xml para reflejar nueva estructura
  - Configurar redirects 301 desde URLs antiguas
  - **Impacto**: ALTO - Esencial para Sitelinks multiidioma

- [ ] **A1.2** - Implementar navegación breadcrumbs
  - Añadir componente Breadcrumbs en todas las páginas (excepto home)
  - Estilo visual: `Inicio > Barcos > Barco Solar 450`
  - **Impacto**: ALTO - Requerido para Sitelinks jerárquicos

- [ ] **A1.3** - Añadir Schema.org BreadcrumbList
  - Implementar JSON-LD BreadcrumbList en todas las páginas
  - Sincronizar con navegación breadcrumbs visual
  - **Impacto**: ALTO - Google usa esto para Sitelinks

- [ ] **A1.4** - Optimizar títulos de página
  - Reducir títulos a <60 caracteres
  - Añadir CTAs cuando sea relevante ("Reserva Ya", "Descubre")
  - **Impacto**: ALTO - CTR y Sitelinks

### Prioridad 2 - IMPORTANTE (2-4 semanas)

- [ ] **A2.1** - Implementar Schema.org Product para barcos
  - Añadir schema Product en `/barco/{id}`
  - Incluir: nombre, imagen, precio, disponibilidad, aggregateRating
  - **Impacto**: MEDIO - Rich snippets en resultados

- [ ] **A2.2** - Implementar Schema.org FAQPage
  - Añadir schema FAQPage en `/faq`
  - Estructurar preguntas y respuestas según schema.org
  - **Impacto**: MEDIO - FAQ en SERPs

- [ ] **A2.3** - Implementar Schema.org ItemList para flota
  - Añadir schema ItemList en homepage (sección flota)
  - Listar todos los barcos con enlaces
  - **Impacto**: MEDIO - Sitelinks de productos

- [ ] **A2.4** - Auditar y optimizar atributos alt de imágenes
  - Revisar todas las imágenes
  - Añadir alt descriptivos y relevantes para SEO
  - **Impacto**: MEDIO - Accesibilidad + SEO imagen

### Prioridad 3 - MEJORA CONTINUA (1-3 meses)

- [ ] **A3.1** - Eliminar meta keywords (obsoletas)
  - Remover keywords de seo-config.ts
  - Google las ignora desde 2009
  - **Impacto**: BAJO - Limpieza de código

- [ ] **A3.2** - Monitorizar Core Web Vitals
  - Configurar alertas para LCP, FID, CLS
  - Objetivo: Mantener >90% en móvil
  - **Impacto**: BAJO - Rendimiento continuo

- [ ] **A3.3** - Implementar sitemap de imágenes
  - Crear sitemap dedicado para imágenes de barcos
  - Añadir a robots.txt
  - **Impacto**: BAJO - Indexación de imágenes

---

## Análisis de Metadatos

### Títulos (Title Tags)

#### Fortalezas
- Títulos únicos por página y idioma
- Incluyen keywords principales
- Estructura consistente: `[Keyword] | Costa Brava Rent a Boat`

#### Problemas Detectados

**Títulos demasiado largos** (>60 caracteres):
```
[✗] "Alquiler de Barcos Sin Licencia en Blanes, Costa Brava | Costa Brava Rent a Boat"
   (82 caracteres - se trunca en Google)

"Barcos Sin Licencia Blanes | Alquiler Costa Brava"
   (52 caracteres - óptimo)
```

**Falta de CTAs en títulos**:
```
[✗] "Alquiler de barcos en Blanes (Costa Brava) sin licencia | Costa Brava Rent a Boat"

"Alquiler Barcos Blanes Sin Licencia - Reserva Ya | Costa Brava"
   (Incluye CTA claro y conciso)
```

#### Análisis por Página

| Página | Título Actual | Caracteres | Estado | Recomendación |
|--------|---------------|------------|--------|---------------|
| Home (ES) | "Alquiler de barcos en Blanes (Costa Brava) sin licencia \| Costa Brava Rent a Boat" | 82 | [✗] Largo | "Alquiler Barcos Blanes Sin Licencia \| Costa Brava" (52) |
| Booking (ES) | "Reservar Barco en Blanes \| Costa Brava Rent a Boat" | 54 | OK | Mantener |
| FAQ (ES) | "Preguntas Frecuentes (FAQ) - Alquiler de Barcos en Blanes \| Costa Brava Rent a Boat" | 89 | [✗] Muy largo | "FAQ Alquiler Barcos Blanes \| Costa Brava Rent a Boat" (53) |
| Blanes (ES) | "Alquiler de Barcos en Blanes, Costa Brava - Sin Licencia \| Costa Brava Rent a Boat" | 85 | [✗] Largo | "Barcos Blanes Puerto - Sin Licencia \| Costa Brava" (52) |
| Sin Licencia (ES) | "Alquiler de Barcos Sin Licencia en Blanes, Costa Brava \| Costa Brava Rent a Boat" | 82 | [✗] Largo | "Barcos Sin Licencia Blanes \| Alquiler Costa Brava" (52) |

### Descripciones (Meta Descriptions)

#### Fortalezas
- Descripciones únicas por página
- Incluyen keywords secundarios
- Longitud generalmente adecuada (150-160 caracteres)

#### Optimizaciones Sugeridas

**Añadir CTAs explícitos**:
```
[✗] "Alquiler de barcos sin licencia y con licencia en Blanes, Costa Brava. 
    Desde Puerto de Blanes. 7 embarcaciones para 4-7 personas."

"Alquiler de barcos sin licencia en Blanes, Costa Brava. 7 embarcaciones 
    para 4-7 personas desde 70€. Reserva por WhatsApp - Respuesta inmediata."
    (Incluye precio, CTA claro, canal de contacto)
```

**Incluir datos específicos**:
```
[✗] "Alquiler de barcos para visitar Tossa de Mar desde Puerto de Blanes."

"Alquiler de barcos a Tossa de Mar desde Blanes. 1h navegando, 70€-390€. 
    Sin licencia o con licencia. Reserva tu excursión marina."
    (Tiempo, precio, opciones, CTA)
```

### Keywords Meta Tag

#### Recomendación: ELIMINAR

**Razón**: Google ignora meta keywords desde 2009. Ocupa espacio innecesario en el código.

```html
<!-- ELIMINAR esto -->
<meta name="keywords" content="alquiler barcos blanes, barcos sin licencia...">
```

**Alternativa**: Enfocarse en keywords en:
- Títulos H1, H2, H3
- Contenido del body
- Atributos alt de imágenes
- Anchor text de enlaces internos

---

## JSON-LD y Datos Estructurados

### Schema Actual Implementado

#### LocalBusiness (index.html)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/#organization",
  "name": "Costa Brava Rent a Boat Blanes",
  "description": "Alquiler de barcos sin licencia y con licencia...",
  "url": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/",
  "telephone": "+34683172154",
  "email": "costabravarentboat@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Puerto de Blanes",
    "addressLocality": "Blanes",
    "addressRegion": "Girona",
    "addressCountry": "ES"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 41.6667,
    "longitude": 2.7833
  },
  "openingHours": "Mo-Su 09:00-20:00",
  "priceRange": "70€-390€",
  "image": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/assets/Mediterranean_coastal_hero_scene_8df465c2.webp",
  "sameAs": [
    "https://wa.me/34683172154"
  ]
}
```

**Estado**: CORRECTO
**Mejoras sugeridas**:
- Añadir `aggregateRating` si hay reseñas de clientes
- Añadir `servesCuisine: null` debería eliminarse (campo innecesario)
- Añadir redes sociales a `sameAs` (Instagram, Facebook, TikTok)

### Schema FALTANTES (Alto Impacto)

#### 1. BreadcrumbList (CRÍTICO para Sitelinks)

**Dónde**: Todas las páginas excepto home

**Ejemplo para `/barco/solar-450`**:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Barcos",
      "item": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/#fleet"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Barco Solar 450",
      "item": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/barco/solar-450"
    }
  ]
}
```

**Impacto**: Google usa esto para mostrar breadcrumbs en SERPs y generar Sitelinks jerárquicos

#### 2. Product (para páginas de barcos)

**Dónde**: `/barco/{id}` (7 páginas)

**Ejemplo para `/barco/quicksilver-455`**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Quicksilver 455",
  "description": "Barco sin licencia para 5 personas. Potencia 15CV. Incluye equipo de snorkel y paddle surf.",
  "image": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/assets/boat-quicksilver.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Quicksilver"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "70",
    "highPrice": "390",
    "availability": "https://schema.org/InStock",
    "url": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/barco/quicksilver-455"
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Capacidad",
      "value": "5 personas"
    },
    {
      "@type": "PropertyValue",
      "name": "Licencia",
      "value": "No requiere licencia"
    },
    {
      "@type": "PropertyValue",
      "name": "Potencia",
      "value": "15 CV"
    }
  ]
}
```

**Impacto**: Rich snippets con precio, disponibilidad, rating

#### 3. FAQPage (para página FAQ)

**Dónde**: `/faq`

**Ejemplo**:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Necesito licencia para alquilar un barco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No necesitas licencia para nuestros barcos de hasta 15CV. Para barcos con licencia, necesitas PER, PNB o equivalente internacional."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cuánto cuesta alquilar un barco?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Los precios van desde 70€ por hora hasta 390€ por día completo, dependiendo del barco y la duración."
      }
    }
    // ... más preguntas
  ]
}
```

**Impacto**: FAQ expandible en Google SERPs

#### 4. ItemList (para página de flota)

**Dónde**: Homepage (sección #fleet)

**Ejemplo**:
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/barco/solar-450",
      "name": "Barco Solar 450"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "url": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/barco/remus-450",
      "name": "Barco Remus 450"
    }
    // ... resto de barcos
  ]
}
```

**Impacto**: Sitelinks de lista de productos

### Validación de Schemas

**Herramientas recomendadas**:
1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/
3. **Google Search Console** → Mejoras → Datos estructurados

---

## Navegación y Estructura de Enlaces

### Estructura de Navegación Actual

#### Header Navigation (Desktop)
```
[Logo] - Inicio - Flota - Contacto - FAQ - [Idioma] - [Mi Cuenta]
```

#### Mobile Navigation (Hamburger)
```
- Inicio
- Flota (#fleet scroll)
- Contacto (#contact scroll)
- FAQ (página /faq)
- [Reservar Ahora] (modal)
```

#### Footer Navigation
```
Columna 1: Empresa
- Descripción
- Estado operativo (Abril-Octubre)

Columna 2: Contacto
- Teléfono
- Email
- Ubicación

Columna 3: Horarios y Legal
- Horarios
- Política de Privacidad
- Términos y Condiciones
- Condiciones Generales

Columna 4: Redes Sociales
- Instagram
- Facebook
- TikTok
```

### Problemas de Navegación para Sitelinks

#### 1. Falta de Breadcrumbs (CRÍTICO)

**Problema**: No hay navegación de migas de pan visual ni en código

**Impacto**: Google no puede entender la jerarquía del sitio para Sitelinks

**Solución**:
```tsx
// Ejemplo de implementación en página de barco
<nav aria-label="Breadcrumb" className="mb-4">
  <ol className="flex items-center space-x-2 text-sm">
    <li>
      <Link href="/" className="text-primary hover:underline">
        Inicio
      </Link>
    </li>
    <li className="text-gray-400">/</li>
    <li>
      <Link href="/#fleet" className="text-primary hover:underline">
        Barcos
      </Link>
    </li>
    <li className="text-gray-400">/</li>
    <li className="text-gray-600" aria-current="page">
      Barco Solar 450
    </li>
  </ol>
</nav>
```

**Páginas que necesitan breadcrumbs**:
- `/faq` → Inicio > FAQ
- `/barco/{id}` → Inicio > Barcos > {Nombre Barco}
- `/alquiler-barcos-blanes` → Inicio > Ubicaciones > Blanes
- `/alquiler-barcos-lloret-de-mar` → Inicio > Ubicaciones > Lloret de Mar
- `/alquiler-barcos-tossa-de-mar` → Inicio > Ubicaciones > Tossa de Mar
- `/barcos-sin-licencia` → Inicio > Categorías > Sin Licencia
- `/barcos-con-licencia` → Inicio > Categorías > Con Licencia
- `/privacy-policy` → Inicio > Legal > Política de Privacidad
- `/terms-conditions` → Inicio > Legal > Términos y Condiciones
- `/condiciones-generales` → Inicio > Legal > Condiciones Generales

#### 2. Enlaces Internos Débiles

**Problema**: Falta de enlaces contextuales entre páginas relacionadas

**Ejemplo actual**:
- Página de barco Solar 450 NO enlaza a:
  - Otros barcos similares (sin licencia)
  - Página de categoría "Barcos sin licencia"
  - Página de ubicación "Blanes"

**Solución sugerida**:
```tsx
// En página de barco individual
<section className="related-boats">
  <h2>Barcos Similares</h2>
  <ul>
    <li><Link href="/barco/remus-450">Remus 450 (Sin licencia)</Link></li>
    <li><Link href="/barco/astec-400">Astec 400 (Sin licencia)</Link></li>
  </ul>
</section>

<section className="related-categories">
  <p>
    Ver todos los <Link href="/barcos-sin-licencia">barcos sin licencia</Link> 
    disponibles en <Link href="/alquiler-barcos-blanes">Blanes</Link>
  </p>
</section>
```

#### 3. Anchor Links en Navegación

**Problema**: Uso de anchor links (#fleet, #contact) en lugar de páginas dedicadas

**Impacto**: Google prefiere páginas independientes para Sitelinks

**Análisis**:
```
Actual:
/#fleet → Scroll a sección flota en home
/#contact → Scroll a sección contacto en home

Recomendado (opcional):
/flota → Página dedicada con galería completa de barcos
/contacto → Página dedicada con formulario y mapa
```

**Decisión**: Mantener anchor links SI:
- La página home es el contenido principal
- Se añaden páginas de categoría y ubicación (ya existen)
- Se implementan breadcrumbs (pendiente)

### Estructura de Enlaces Recomendada para Sitelinks

```
Nivel 1 (Home):
└── costa-brava-rent-a-boat-web-ivanrd9.replit.app/

Nivel 2 (Categorías principales):
├── /barcos-sin-licencia
├── /barcos-con-licencia
├── /faq
└── /contacto (considerar crear si se separa del home)

Nivel 3 (Ubicaciones):
├── /alquiler-barcos-blanes
├── /alquiler-barcos-lloret-de-mar
└── /alquiler-barcos-tossa-de-mar

Nivel 3 (Barcos individuales):
├── /barco/solar-450
├── /barco/remus-450
├── /barco/astec-400
├── /barco/astec-450
├── /barco/pacific-craft-625
├── /barco/trimarchi-57s
└── /barco/mingolla-brava-19

Nivel 4 (Legal):
├── /privacy-policy
├── /terms-conditions
└── /condiciones-generales
```

### Análisis de Anchor Text

#### Buenas prácticas actuales:
- Anchor text descriptivo en footer ("Política de Privacidad", "FAQ")
- Uso de iconos + texto en enlaces de contacto

#### Mejoras sugeridas:
```
[✗] "Click aquí" o "Ver más"
"Ver barcos sin licencia en Blanes"

[✗] "Reservar" (genérico)
"Reservar Barco Solar 450"

[✗] "Leer más"
"Leer condiciones de alquiler"
```

---

## Sitemap.xml y Robots.txt

### Robots.txt - Análisis

#### Configuración Actual (CORRECTA)
```
User-agent: *
Allow: /
Disallow: /crm/
Disallow: /crm/*
Disallow: /api/
Disallow: /api/*
Disallow: /booking/confirmation
Disallow: /admin/

Sitemap: https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/sitemap.xml
```

**Estado**: ÓPTIMO

**Fortalezas**:
- Bloquea correctamente rutas privadas (CRM, API, Admin)
- Bloquea páginas de confirmación (evita contenido duplicado)
- Incluye referencia al sitemap

**Mejoras opcionales**:
```
# Añadir crawl-delay si hay problemas de carga
User-agent: *
Crawl-delay: 1

# Permitir explícitamente Googlebot para imágenes
User-agent: Googlebot-Image
Allow: /assets/
```

### Sitemap.xml - Análisis

#### Configuración Actual (NECESITA MEJORAS)

**Problema Principal**: Uso de parámetros de consulta para idiomas

```xml
<!-- [✗] ACTUAL -->
<url>
  <loc>https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/</loc>
  <lastmod>2025-10-12T12:27:08.152Z</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>
<url>
  <loc>https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/?lang=en</loc>
  <lastmod>2025-10-12T12:27:08.152Z</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>
<url>
  <loc>https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/?lang=ca</loc>
  ...
</url>
```

**Impacto**: ALTO
- Google puede ignorar parámetros de consulta
- Dificulta la indexación multiidioma
- Sitelinks por idioma no se generan correctamente

#### Solución Recomendada: URLs Limpias

**Opción A: Subcarpetas (RECOMENDADO)**
```xml
<!-- RECOMENDADO -->
<url>
  <loc>https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/</loc>
  <xhtml:link 
    rel="alternate" 
    hreflang="es" 
    href="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/"/>
  <xhtml:link 
    rel="alternate" 
    hreflang="en" 
    href="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/en/"/>
  <xhtml:link 
    rel="alternate" 
    hreflang="ca" 
    href="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/ca/"/>
  <!-- ... más idiomas -->
  <lastmod>2025-10-12T12:27:08.152Z</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>

<url>
  <loc>https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/en/</loc>
  <xhtml:link 
    rel="alternate" 
    hreflang="es" 
    href="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/"/>
  <xhtml:link 
    rel="alternate" 
    hreflang="en" 
    href="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/en/"/>
  <!-- ... -->
  <lastmod>2025-10-12T12:27:08.152Z</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>
```

**Opción B: Subdominios** (alternativa)
```
es.costabravarentaboat.com (español - default)
en.costabravarentaboat.com (inglés)
ca.costabravarentaboat.com (catalán)
```

**Opción C: Dominios ccTLD** (ideal pero costoso)
```
costabravarentaboat.es (español)
costabravarentaboat.co.uk (inglés UK)
costabravarentaboat.fr (francés)
```

#### Contenido del Sitemap - Análisis Completo

**URLs incluidas** (correctamente):
```
Homepage: /
Barcos (7): /barco/{solar-450, remus-450, astec-400, astec-450, pacific-craft-625, trimarchi-57s, mingolla-brava-19}
Ubicaciones (3): /alquiler-barcos-{blanes, lloret-de-mar, tossa-de-mar}
FAQ: /faq
Categorías (2): /barcos-sin-licencia, /barcos-con-licencia
Legal (3): /privacy-policy, /terms-conditions, /condiciones-generales
```

**Total URLs**: 17 páginas × 8 idiomas = **136 URLs en sitemap**

**Prioridades asignadas**:
```
1.0 → Homepage (correcto)
0.8 → Páginas de barcos (correcto)
0.7 → Ubicaciones y categorías (correcto)
0.6 → FAQ (correcto)
0.3 → Legal (correcto)
```

#### [NUEVO] URLs Faltantes (considerar añadir)

```
[✗] /client/dashboard → NO debe incluirse (requiere login)
[✗] /login → NO debe incluirse (funcionalidad, no contenido)
[✗] /booking → CONSIDERAR (¿es indexable?)
[✗] /crm/* → NO incluir (bloqueado en robots.txt)

Posibles páginas futuras:
- /blog (si se añade contenido)
- /testimonios (reseñas de clientes)
- /galeria (fotos de excursiones)
```

#### ⏰ Frecuencias de Actualización

**Actual**:
```xml
<changefreq>daily</changefreq>  <!-- Para todo -->
<changefreq>weekly</changefreq> <!-- Para algunas -->
<changefreq>monthly</changefreq> <!-- Para legal -->
```

**Recomendación ajustada**:
```
Homepage: daily (correcto - puede cambiar disponibilidad)
Barcos: weekly (información estable)
Ubicaciones: monthly (contenido estático)
FAQ: monthly (cambios ocasionales)
Legal: yearly (cambios muy infrecuentes)
```

### Implementación de Sitemap de Imágenes (Opcional)

**Beneficio**: Mejora indexación de imágenes de barcos

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/barco/solar-450</loc>
    <image:image>
      <image:loc>https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/assets/boat-solar-450.jpg</image:loc>
      <image:title>Barco Solar 450 - Alquiler sin licencia Blanes</image:title>
      <image:caption>Barco Solar 450 capacidad 5 personas, 15CV, sin licencia</image:caption>
    </image:image>
  </url>
</urlset>
```

### Validación de Sitemap

**Herramientas**:
1. **Google Search Console** → Sitemaps → Enviar sitemap
2. **XML Sitemap Validator**: https://www.xml-sitemaps.com/validate-xml-sitemap.html
3. **Sitemap Checker**: https://websiteseochecker.com/sitemap-validator/

**Métricas a monitorizar**:
- Páginas enviadas vs indexadas
- Errores de crawling
- Tiempo promedio de indexación

---

## Rendimiento y Core Web Vitals

### Estado Actual (según replit.md)

#### Optimizaciones Implementadas

**Imágenes**:
- Conversión a WebP (88.7% reducción de peso)
- Lazy loading para imágenes below-the-fold
- Preload de imagen hero (LCP optimization)

**JavaScript**:
- Code splitting
- Lazy loading de rutas no críticas (React.lazy)
- Prefetching inteligente de chunks críticos

**Fuentes**:
- Preconnect a Google Fonts
- Async font loading
- Font display: swap

**Server**:
- Gzip compression (nivel 6)
- HTTP caching headers (ETag, Cache-Control)
- In-memory caching (boat queries, SEO endpoints)

**PWA**:
- Service Worker con cache-first para assets
- Network-first con fallback para API

**Database**:
- Indexación para queries frecuentes

#### Core Web Vitals - Objetivos

**Métricas objetivo** (según Google):
```
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
```

**Estado actual estimado** (según replit.md):
```
Performance Score: 90%+ en todas las páginas
Mobile-first approach implementado
```

### Recomendaciones Adicionales

#### 1. Monitorización Continua

**Google Search Console**:
- Activar informes de Core Web Vitals
- Configurar alertas para degradación de métricas

**Herramientas de testing**:
```
- PageSpeed Insights: https://pagespeed.web.dev/
- WebPageTest: https://www.webpagetest.org/
- Lighthouse CI: Integración en pipeline de deployment
```

#### 2. Optimizaciones Avanzadas (si score < 90%)

**Resource Hints**:
```html
<!-- Ya implementados -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="https://api.whatsapp.com">

<!-- Considerar añadir -->
<link rel="prefetch" href="/assets/boat-images.webp">
<link rel="modulepreload" href="/src/utils/seo-config.js">
```

**Critical CSS Inlining**:
```html
<!-- Ya implementado en index.html -->
<style>
  :root{--background:200 20% 98%;...}
  *,::before,::after{box-sizing:border-box;...}
  ...
</style>
```

**Image Optimization**:
```
- Responsive images con srcset
- Art direction con <picture>
- Tamaños específicos para móvil/desktop
```

#### 3. Servidor y Hosting

**Actual**: Replit Autoscale Deployment
- Auto-scaling
- 99.95% uptime
- HTTPS/TLS automático

**Mejoras sugeridas**:
```
- Considerar CDN para assets estáticos (Cloudflare, Fastly)
- HTTP/2 server push para recursos críticos
- Brotli compression (mejor que Gzip)
```

#### 4. Métricas Mobile-Specific

**Prioridades para móvil**:
```
Viewport configurado: <meta name="viewport" content="width=device-width, initial-scale=1.0">
Touch-friendly buttons (min 48x48px)
Responsive images
Verificar: Tap targets separados >48px
Verificar: Texto legible sin zoom (min 16px)
```

### Performance Budget (sugerido)

**Límites recomendados**:
```
JavaScript total: < 300 KB (gzipped)
CSS total: < 50 KB (gzipped)
Imágenes por página: < 1 MB (WebP)
Total page weight: < 2 MB
Requests: < 50
```

**Monitorizar con**:
```bash
# Bundle size analysis
npm run build -- --mode=production
npx vite-bundle-visualizer

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/
```

---

## Diffs Propuestos (Ejemplos de Implementación)

### 1. Sistema de URLs Limpias Multiidioma

#### Archivo: `server/routes.ts`

**ANTES (actual - usa query params)**:
```typescript
const generateSitemapXml = memoize(
  (baseUrl: string): string => {
    // ...
    languages.forEach(lang => {
      if (lang !== 'es') {
        urls += `  <url>
    <loc>${baseUrl}/?lang=${lang}</loc>
    // ...
```

**DESPUÉS (recomendado - URLs limpias)**:
```typescript
const generateSitemapXml = memoize(
  (baseUrl: string): string => {
    const now = new Date().toISOString();
    const languages = ['es', 'en', 'ca', 'fr', 'de', 'nl', 'it', 'ru'];
    
    // Helper para generar hreflang alternates
    const generateHreflangLinks = (path: string) => {
      let links = '';
      languages.forEach(lang => {
        const langPath = lang === 'es' ? path : `/${lang}${path}`;
        links += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${langPath}"/>\n`;
      });
      // x-default para idioma por defecto
      links += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}"/>\n`;
      return links;
    };

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Homepage con hreflang
    sitemap += `  <url>
    <loc>${baseUrl}/</loc>
${generateHreflangLinks('/')}    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Para cada idioma
    languages.forEach(lang => {
      if (lang !== 'es') {
        const langPath = `/${lang}/`;
        sitemap += `  <url>
    <loc>${baseUrl}${langPath}</loc>
${generateHreflangLinks('/')}    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
      }
    });

    // Barcos con variantes de idioma
    boatIds.forEach(boatId => {
      const path = `/barco/${boatId}`;
      sitemap += `  <url>
    <loc>${baseUrl}${path}</loc>
${generateHreflangLinks(path)}    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

      // Versiones traducidas
      languages.forEach(lang => {
        if (lang !== 'es') {
          const langPath = `/${lang}/barco/${boatId}`;
          sitemap += `  <url>
    <loc>${baseUrl}${langPath}</loc>
${generateHreflangLinks(path)}    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }
      });
    });

    // ... resto de URLs
    sitemap += `</urlset>`;
    return sitemap;
  },
  { maxAge: 60 * 60 * 1000 }
);
```

**NOTA**: Esto también requiere cambios en routing del frontend (App.tsx)

---

### 2. Componente Breadcrumbs

#### Nuevo archivo: `client/src/components/Breadcrumbs.tsx`

```typescript
import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "@/lib/translations";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const t = useTranslations();
  
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
      <ol className="flex items-center space-x-2">
        {/* Home siempre primero */}
        <li className="flex items-center">
          <Link href="/" className="text-primary hover:underline flex items-center">
            <Home className="w-4 h-4 mr-1" />
            {t.breadcrumbs?.home || "Inicio"}
          </Link>
        </li>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
              {isLast ? (
                <span className="text-gray-600 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href!} className="text-primary hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

#### Uso en página de barco: `client/src/pages/boat-detail.tsx`

```typescript
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { generateBreadcrumbSchema } from "@/utils/seo-schemas";

export default function BoatDetailPage() {
  const boat = /* ... obtener datos del barco */;
  const t = useTranslations();
  
  // Breadcrumbs data
  const breadcrumbItems = [
    { label: t.breadcrumbs?.boats || "Barcos", href: "/#fleet" },
    { label: boat.name } // último sin href
  ];

  // Schema JSON-LD
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs?.home || "Inicio", url: "/" },
    { name: t.breadcrumbs?.boats || "Barcos", url: "/#fleet" },
    { name: boat.name, url: `/barco/${boat.id}` }
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs visuales */}
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />
      
      {/* SEO con schema */}
      <SEO
        title={/* ... */}
        description={/* ... */}
        jsonLd={breadcrumbSchema}
      />
      
      {/* Resto del contenido */}
    </div>
  );
}
```

---

### 3. Schema.org BreadcrumbList Helper

#### Nuevo archivo: `client/src/utils/seo-schemas.ts`

```typescript
import { BASE_DOMAIN } from "./seo-config";

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${BASE_DOMAIN}${item.url}`
    }))
  };
}

export function generateProductSchema(boat: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": boat.name,
    "description": boat.description,
    "image": `${BASE_DOMAIN}${boat.imageUrl}`,
    "brand": {
      "@type": "Brand",
      "name": boat.brand || "Costa Brava Rent a Boat"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "EUR",
      "lowPrice": boat.minPrice || "70",
      "highPrice": boat.maxPrice || "390",
      "availability": "https://schema.org/InStock",
      "url": `${BASE_DOMAIN}/barco/${boat.id}`
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Capacidad",
        "value": `${boat.capacity} personas`
      },
      {
        "@type": "PropertyValue",
        "name": "Licencia",
        "value": boat.requiresLicense ? "Requiere licencia náutica" : "No requiere licencia"
      },
      {
        "@type": "PropertyValue",
        "name": "Potencia",
        "value": `${boat.power} CV`
      }
    ]
  };
}

export function generateFAQPageSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function generateItemListSchema(boats: any[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": boats.map((boat, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${BASE_DOMAIN}/barco/${boat.id}`,
      "name": boat.name
    }))
  };
}
```

---

### 4. Optimización de Títulos

#### Archivo: `client/src/utils/seo-config.ts`

**ANTES (títulos largos)**:
```typescript
home: {
  title: "Alquiler de barcos en Blanes (Costa Brava) sin licencia | Costa Brava Rent a Boat",
  description: "...",
  keywords: "..."
}
```

**DESPUÉS (títulos optimizados <60 caracteres)**:
```typescript
es: {
  home: {
    title: "Alquiler Barcos Blanes Sin Licencia | Costa Brava",  // 52 caracteres
    description: "Alquiler de barcos sin licencia en Blanes, Costa Brava. 7 embarcaciones para 4-7 personas desde 70€. Reserva por WhatsApp - Respuesta inmediata.",
    // keywords: "..." // ELIMINAR - obsoleto
  },
  booking: {
    title: "Reservar Barco Blanes | Costa Brava Rent a Boat",  // 48 caracteres
    description: "Completa el formulario para reservar tu barco en Blanes. Barcos sin licencia y con licencia. Respuesta rápida por WhatsApp.",
  },
  faq: {
    title: "FAQ Alquiler Barcos Blanes | Costa Brava",  // 42 caracteres
    description: "Resuelve todas tus dudas sobre el alquiler de barcos en Blanes. Precios desde 70€, requisitos, qué incluye, políticas de cancelación.",
  },
  locationBlanes: {
    title: "Barcos Blanes Puerto - Sin Licencia | Costa Brava",  // 52 caracteres
    description: "Alquiler de barcos en Puerto de Blanes. Embarcaciones sin licencia para 4-7 personas. Explora las calas de la Costa Brava desde 70€/hora.",
  },
  categoryLicenseFree: {
    title: "Barcos Sin Licencia Blanes | Alquiler Costa Brava",  // 52 caracteres
    description: "Alquiler de barcos sin licencia en Blanes. Hasta 15CV, 4-7 personas. No necesitas titulación. Desde 70€. Incluye snorkel y paddle surf.",
  },
  // ...
}
```

---

### 5. Añadir Schema.org a LocalBusiness (mejorado)

#### Archivo: `client/index.html`

**ANTES**:
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Costa Brava Rent a Boat Blanes",
  "description": "Alquiler de barcos sin licencia y con licencia...",
  "url": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/",
  "telephone": "+34683172154",
  "email": "costabravarentboat@gmail.com",
  // ...
  "sameAs": [
    "https://wa.me/34683172154"
  ]
}
```

**DESPUÉS (añadir redes sociales)**:
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/#organization",
  "name": "Costa Brava Rent a Boat Blanes",
  "description": "Alquiler de barcos sin licencia y con licencia en Blanes, Costa Brava. Embarcaciones para 4-7 personas.",
  "url": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/",
  "telephone": "+34683172154",
  "email": "costabravarentboat@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Puerto de Blanes",
    "addressLocality": "Blanes",
    "addressRegion": "Girona",
    "postalCode": "17300",
    "addressCountry": "ES"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 41.6667,
    "longitude": 2.7833
  },
  "openingHours": "Mo-Su 09:00-20:00",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ],
    "opens": "09:00",
    "closes": "20:00",
    "validFrom": "2025-04-01",
    "validThrough": "2025-10-31"
  },
  "priceRange": "70€-390€",
  "image": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/assets/Mediterranean_coastal_hero_scene_8df465c2.webp",
  "sameAs": [
    "https://wa.me/34683172154",
    "https://www.instagram.com/costabravarentaboat/",
    "https://www.facebook.com/costabravarentaboat/",
    "https://www.tiktok.com/@costabravarentaboat"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

**NOTA**: Añadir aggregateRating solo si hay reseñas reales verificables

---

## Guía de Configuración Google Search Console

### 1. Verificación del Sitio

#### Métodos de Verificación Recomendados

**Opción A: Etiqueta HTML (Recomendado)**
```html
<!-- Añadir en client/index.html dentro de <head> -->
<meta name="google-site-verification" content="TU_CODIGO_AQUI" />
```

**Opción B: Archivo HTML**
```
1. Descargar archivo googleXXXXXXXX.html desde Search Console
2. Subir a carpeta /public/
3. Verificar acceso: https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/googleXXXXXXXX.html
```

**Opción C: Google Analytics**
```
Si ya usas GA4, verificar automáticamente usando esa propiedad
```

**Opción D: Google Tag Manager**
```
Si usas GTM, verificar con el contenedor existente
```

### 2. Envío de Sitemap

**Pasos**:
```
1. Ir a Search Console → Sitemaps
2. Añadir nuevo sitemap
3. URL: https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/sitemap.xml
4. Enviar
5. Esperar 24-48h para procesamiento
```

**Monitorizar**:
- Páginas descubiertas
- Páginas indexadas
- Errores de crawling

### 3. Configuración de Propiedades Internacionales

**Opciones de configuración**:

**Opción A: Etiquetas hreflang (ACTUAL - ya implementado)**
```html
<link rel="alternate" hreflang="es" href="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/" />
<link rel="alternate" hreflang="en" href="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/en/" />
<link rel="alternate" hreflang="ca" href="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/ca/" />
<!-- ... -->
<link rel="alternate" hreflang="x-default" href="https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/" />
```

**Opción B: Segmentación geográfica (si se usan subdominios)**
```
Search Console → Configuración → Segmentación internacional
- es.costabravarentaboat.com → España
- en.costabravarentaboat.com → Internacional
- fr.costabravarentaboat.com → Francia
```

### 4. Mejoras - Datos Estructurados

**Verificación**:
```
Search Console → Mejoras → Datos estructurados
```

**Schemas esperados** (después de implementar recomendaciones):
- LocalBusiness
- BreadcrumbList (en todas las páginas internas)
- Product (en 7 páginas de barcos)
- FAQPage (en /faq)
- ItemList (en homepage)

**Resolver errores**:
- Campos obligatorios faltantes
- Valores inválidos
- URLs incorrectas

### 5. Core Web Vitals

**Monitorización**:
```
Search Console → Experiencia → Core Web Vitals
```

**Métricas a revisar**:
- URLs con LCP bueno/necesita mejorar/pobre
- URLs con FID bueno/necesita mejorar/pobre
- URLs con CLS bueno/necesita mejorar/pobre

**Objetivo**: 75% de URLs en "Bueno" (verde)

### 6. Indexación y Cobertura

**Revisar regularmente**:
```
Search Console → Indexación → Páginas
```

**Problemas comunes**:
- [✗] "Descubierta, actualmente sin indexar" → Mejorar calidad del contenido
- [✗] "Rastreada, actualmente sin indexar" → Añadir enlaces internos
- [✗] "Bloqueada por robots.txt" → Verificar que no bloqueas páginas importantes
- [✗] "Redireccionada" → Verificar que redirects son intencionales

**Acciones**:
- Solicitar indexación manual para URLs importantes
- Verificar que URLs clave están en sitemap
- Revisar canonical tags

### 7. Enlaces Internos

**Análisis**:
```
Search Console → Enlaces → Enlaces internos
```

**Verificar**:
- Páginas más enlazadas (debe incluir home, categorías, barcos populares)
- Páginas sin enlaces internos (PROBLEMA - añadir enlaces)
- Distribución de PageRank interno

**Objetivo**: Todas las páginas públicas deben tener al menos 2-3 enlaces internos

### 8. Rendimiento de Búsqueda

**Métricas clave**:
```
Search Console → Rendimiento
```

**Analizar**:
- Consultas principales (keywords que traen tráfico)
- Páginas con más impresiones
- CTR promedio (objetivo >3% para posiciones top 5)
- Posición promedio (objetivo top 10 para keywords principales)

**Filtros útiles**:
- Por tipo de búsqueda (web, imagen)
- Por dispositivo (móvil vs desktop)
- Por país (España, Francia, UK, etc.)
- Por query (comparar keywords)

### 9. Acciones Manuales y Penalizaciones

**Verificar**:
```
Search Console → Seguridad y Acciones manuales
```

**Debe estar**:
- "No se han detectado problemas"

**Si hay problemas**:
- Leer descripción de la penalización
- Corregir el problema
- Solicitar revisión

### 10. Configuración de Usuarios y Permisos

**Añadir colaboradores**:
```
Search Console → Configuración → Usuarios y permisos
```

**Roles**:
- **Propietario**: Control total (cambiar propietarios, eliminar propiedad)
- **Propietario delegado**: Todo excepto añadir propietarios
- **Acceso completo**: Ver todos los datos y realizar acciones
- **Acceso restringido**: Solo ver la mayoría de datos

### 11. Integraciones Útiles

**Google Analytics 4**:
```
Search Console → Configuración → Asociaciones
→ Vincular con propiedad de Google Analytics
```

**Beneficios**:
- Datos de Search Console en GA4
- Mejor análisis de conversión desde búsqueda orgánica

**Looker Studio** (antes Data Studio):
```
Crear dashboards personalizados con datos de Search Console
```

### 12. Alertas y Notificaciones

**Configurar**:
```
Search Console → Configuración → Usuarios y permisos → Tu usuario → Preferencias de email
```

**Activar alertas para**:
- Errores críticos de sitemap
- Acciones manuales
- Problemas de seguridad
- Picos de errores de rastreo
- [✗] Desactivar: Avisos de mejoras menores (puede generar spam)

### 13. Checklist Post-Implementación

**Después de implementar cambios SEO**:
```
□ 1. Verificar sitemap actualizado en /sitemap.xml
□ 2. Solicitar re-rastreo de sitemap en Search Console
□ 3. Verificar hreflang en Configuración Internacional
□ 4. Validar schemas en Rich Results Test
□ 5. Solicitar indexación de URLs clave modificadas
□ 6. Monitorizar errores de rastreo durante 1 semana
□ 7. Revisar posiciones de keywords objetivo después de 2-4 semanas
□ 8. Analizar Core Web Vitals semanalmente
```

### 14. Herramientas Complementarias

**Testing antes de enviar a Search Console**:
- **Rich Results Test**: https://search.google.com/test/rich-results
- **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly
- **PageSpeed Insights**: https://pagespeed.web.dev/

**Validación de implementaciones**:
- **Schema Markup Validator**: https://validator.schema.org/
- **Hreflang Tags Testing Tool**: https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/

---

## Cronograma de Implementación Sugerido

### Semana 1-2: CRÍTICO (Fundamentos Sitelinks)
- [ ] Día 1-3: Implementar URLs limpias multiidioma (subcarpetas /es/, /en/, etc.)
- [ ] Día 4-5: Crear componente Breadcrumbs y añadir a todas las páginas
- [ ] Día 6-7: Implementar Schema.org BreadcrumbList
- [ ] Día 8-10: Optimizar títulos de página (<60 caracteres)
- [ ] Día 11-14: Testing completo y corrección de errores

### Semana 3-4: IMPORTANTE (Rich Snippets)
- [ ] Día 15-17: Implementar Schema.org Product para barcos
- [ ] Día 18-20: Implementar Schema.org FAQPage
- [ ] Día 21-22: Implementar Schema.org ItemList para flota
- [ ] Día 23-24: Optimizar meta descriptions con CTAs y precios
- [ ] Día 25-28: Auditar atributos alt de imágenes y optimizar

### Semana 5-6: MEJORAS (Optimización Continua)
- [ ] Día 29-31: Eliminar meta keywords obsoletas
- [ ] Día 32-34: Configurar Google Search Console completo
- [ ] Día 35-36: Implementar sitemap de imágenes
- [ ] Día 37-38: Configurar monitorización Core Web Vitals
- [ ] Día 39-42: Revisión final y documentación

### Mes 2-3: MONITORIZACIÓN
- [ ] Semana 7-8: Analizar primeros datos de Search Console
- [ ] Semana 9-10: Ajustar estrategia según métricas reales
- [ ] Semana 11-12: Optimización de contenido según queries de búsqueda

---

## Checklist Final de Verificación

### Antes de Implementar Cambios
- [ ] Hacer backup completo del sitio actual
- [ ] Documentar configuración actual de URLs
- [ ] Exportar datos actuales de Google Analytics/Search Console
- [ ] Planificar redirects 301 para cambios de URL

### Durante la Implementación
- [ ] Implementar cambios en entorno de staging primero
- [ ] Testing exhaustivo en múltiples dispositivos y navegadores
- [ ] Validar todos los schemas con herramientas oficiales
- [ ] Verificar que no hay enlaces rotos

### Post-Implementación
- [ ] Configurar redirects 301 desde URLs antiguas
- [ ] Enviar nuevo sitemap a Google Search Console
- [ ] Solicitar re-indexación de páginas clave
- [ ] Monitorizar errores de rastreo durante 2 semanas
- [ ] Verificar que Core Web Vitals se mantienen >90%

### Validación de Sitelinks (4-8 semanas post-implementación)
- [ ] Buscar marca en Google: "Costa Brava Rent a Boat Blanes"
- [ ] Verificar que aparecen Sitelinks en resultados
- [ ] Confirmar que Sitelinks son relevantes y útiles
- [ ] Analizar CTR de Sitelinks en Search Console

---

## KPIs de Éxito SEO

### Métricas a Monitorizar (mensualmente)

**Indexación**:
- URLs indexadas: Objetivo 100% de páginas públicas (17 páginas × 8 idiomas = 136)
- Tiempo promedio de indexación: <7 días para contenido nuevo

**Posicionamiento**:
- Keywords en top 10: Objetivo +50% en 3 meses
- Keywords principales objetivo:
  - "alquiler barcos blanes" → Top 3
  - "barcos sin licencia costa brava" → Top 5
  - "rent a boat blanes" → Top 5
  - "alquiler embarcaciones blanes" → Top 10

**Tráfico Orgánico**:
- Sesiones orgánicas: Objetivo +100% en 6 meses
- CTR promedio: >3% para posiciones top 5
- Tasa de rebote: <50% desde búsqueda orgánica

**Sitelinks**:
- Aparición de Sitelinks: Sí/No (validar en 8 semanas)
- Número de Sitelinks mostrados: 4-8 (ideal)
- CTR de Sitelinks: >5% (mejor que resultado principal)

**Core Web Vitals**:
- LCP: <2.5s (100% de URLs)
- FID: <100ms (100% de URLs)
- CLS: <0.1 (100% de URLs)

**Conversiones desde SEO**:
- Leads generados desde orgánico: Objetivo +200% en 6 meses
- Reservas desde orgánico: Medir con UTM tags

---

## Conclusiones y Próximos Pasos

### Resumen de Hallazgos

**Fortalezas Actuales** [✓]:
1. Infraestructura SEO técnica sólida (metadatos, JSON-LD, hreflang)
2. Excelente rendimiento (>90% score)
3. Sitemap y robots.txt bien configurados
4. Optimizaciones de velocidad implementadas

**Debilidades Críticas** [CRÍTICO]:
1. **URLs con query params** (?lang=) en lugar de subcarpetas (/es/)
2. **Sin breadcrumbs** (visual ni schema)
3. **Títulos demasiado largos** (>60 caracteres)
4. **Schemas faltantes** (Product, FAQPage, BreadcrumbList, ItemList)

### Impacto Esperado Post-Implementación

**Corto Plazo** (1-2 meses):
- 100% de URLs correctamente indexadas
- Rich snippets en resultados de búsqueda (Product, FAQ)
- Mejor CTR en SERPs (+20-30%)

**Medio Plazo** (3-6 meses):
- Aparición de Google Sitelinks en búsquedas de marca
- +100% tráfico orgánico
- Keywords principales en top 5-10

**Largo Plazo** (6-12 meses):
- Posicionamiento dominante en "alquiler barcos blanes" y variantes
- Autoridad de dominio consolidada
- Conversión de SEO como canal principal de leads

### Priorización Final

**HACER AHORA** (Semana 1-2):
1. URLs limpias multiidioma
2. Breadcrumbs (visual + schema)
3. Optimizar títulos

**HACER PRONTO** (Semana 3-4):
4. Schema Product, FAQPage, ItemList
5. Meta descriptions con CTAs

**HACER DESPUÉS** (Mes 2-3):
6. Auditoría de imágenes y alt tags
7. Monitorización y ajustes

---

## Recursos y Documentación

### Documentación Oficial
- **Google Search Central**: https://developers.google.com/search
- **Schema.org**: https://schema.org/
- **Hreflang Guide**: https://developers.google.com/search/docs/specialty/international/localized-versions

### Herramientas de Testing
- **Rich Results Test**: https://search.google.com/test/rich-results
- **PageSpeed Insights**: https://pagespeed.web.dev/
- **Schema Validator**: https://validator.schema.org/
- **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly

### Monitorización
- **Google Search Console**: https://search.google.com/search-console
- **Google Analytics 4**: https://analytics.google.com/
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci

### Comunidad y Soporte
- **Google Search Central Help**: https://support.google.com/webmasters/
- **Stack Overflow [seo]**: https://stackoverflow.com/questions/tagged/seo
- **Reddit r/TechSEO**: https://www.reddit.com/r/TechSEO/

---

**Fin del Informe de Auditoría SEO**

*Última actualización: 12 Octubre 2025*  
*Próxima revisión recomendada: 12 Enero 2026 (post-implementación)*
