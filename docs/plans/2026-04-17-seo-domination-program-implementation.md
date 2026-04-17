# SEO Domination Program — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ejecutar los quick wins técnicos y de GMB de las semanas 1-2 del programa SEO, fijando el fundamento de tracking y las mayores filtraciones de tráfico antes de la temporada alta.

**Architecture:** Cambios quirúrgicos sobre la infraestructura SEO existente. Extendemos `seo-config.ts`, `seoInjector.ts`, el MCP server `seo-engine.ts` y añadimos un servicio nuevo de sync GMB. No tocamos la arquitectura, optimizamos ejecución.

**Tech Stack:** TypeScript strict, React + Vite, Drizzle ORM (Neon PostgreSQL), Express, GTM + GA4 + Meta Pixel + Google Ads, Google My Business API, Bing IndexNow.

**Design doc:** `docs/plans/2026-04-17-seo-domination-program-design.md`

**Fases futuras:** Las fases 2-5 tendrán planes de implementación separados. Este documento cubre solo Fase 1 (semanas 1-2 del programa de 26 semanas).

---

## Prerequisitos y secuenciación

**Usuario bloquea (debe hacer primero):**
- T0.1: Registrar Bing Webmaster Tools → obtener meta tag de verificación
- T0.2: Autorizar acceso a Google My Business API (OAuth 2.0) → obtener refresh token
- T0.3: Exportar reporte actual de GSC "Coverage" para baseline

**Claude ejecuta en paralelo (no bloqueado):**
- T1 en adelante

**Orden recomendado de ejecución:**
1. Tasks 1-2 (tracking baseline + Bing)
2. Tasks 3-7 (on-page SEO) en paralelo
3. Task 8 (redirect cleanup) tras exportar GSC
4. Tasks 9-11 (GMB) tras autorización
5. Task 12 (reporting) al final

---

## Task 1: Baseline de métricas y verificación de tracking existente

**Objetivo:** Confirmar que GA4 + Meta Pixel + Google Ads están recibiendo eventos `whatsapp_click`, y capturar la baseline pre-programa.

**Files:**
- Verify: `client/src/utils/analytics.ts:86-97` (ya existe `trackWhatsAppClick`)
- Verify: `client/src/components/WhatsAppFloatingButton.tsx:29`
- Modify: `client/src/utils/analytics.ts` (añadir contexto de página al evento)

**Step 1: Verificar evento en GTM Preview**

```bash
# Iniciar dev server
npm run dev
```

Abrir `http://localhost:5000/?gtm_debug=1` en navegador, pulsar botón WhatsApp flotante, verificar en consola que aparece `[GTM Debug] whatsapp_click`.

**Step 2: Ampliar contexto del evento WhatsApp**

Reemplazar en `client/src/utils/analytics.ts` la función `trackWhatsAppClick`:

```typescript
export function trackWhatsAppClick(source: string, utm?: UtmParams) {
  const eventId = generateEventId();
  const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';
  const pageLanguage = pagePath.match(/^\/([a-z]{2})\//)?.[1] || 'es';

  trackEvent("whatsapp_click", {
    source,
    event_id: eventId,
    page_path: pagePath,
    page_language: pageLanguage,
    ...(utm?.utm_source && { utm_source: utm.utm_source }),
    ...(utm?.utm_medium && { utm_medium: utm.utm_medium }),
    ...(utm?.utm_campaign && { utm_campaign: utm.utm_campaign }),
  });
  trackMetaContact("whatsapp", eventId);
  trackGoogleAdsConversion({ conversionLabel: 'whatsapp_click' });
}
```

**Step 3: Verificar en GA4 Realtime**

Abrir GA4 → Reports → Realtime. Debe aparecer evento `whatsapp_click` con parámetros `source`, `page_path`, `page_language`.

**Step 4: Exportar baseline desde GSC**

Usar MCP existente:

```bash
# Via servidor MCP seo-engine (si está corriendo)
# O bajar manualmente desde GSC: Performance → últimos 90 días → Export CSV
```

Guardar como `docs/seo/baseline-gsc-2026-04-17.csv` (no commitear si es sensible).

**Step 5: Commit**

```bash
git add client/src/utils/analytics.ts
git commit -m "feat(seo): add page context to whatsapp_click event"
```

**Verificación:** evento `whatsapp_click` aparece en GA4 Realtime con nuevos parámetros. Baseline CSV guardado.

---

## Task 2: Setup Bing Webmaster Tools + verificación + sitemap

**Objetivo:** Capturar tráfico de Bing/ChatGPT/Copilot/Perplexity + validar que IndexNow (ya implementado) notifica correctamente.

**Files:**
- Modify: `client/index.html` (añadir meta verificación)
- Verify: `server/seo/indexnow.ts` (ya existe)
- Verify: `server/routes/sitemaps.ts:133-140` (IndexNow key)

**Step 1: Usuario registra dominio en Bing WMT**

Usuario hace en su navegador:
1. Ir a https://www.bing.com/webmasters
2. Login con cuenta (la misma que Google si puede, o crear cuenta Microsoft)
3. Add Site → `https://www.costabravarentaboat.com`
4. Verificar vía meta tag → copiar el valor de `content`

**Step 2: Añadir meta tag de verificación**

Editar `client/index.html`, insertar tras línea 14:

```html
<meta name="msvalidate.01" content="[VALOR_DE_BING]">
<meta name="google-site-verification" content="[VALOR_DE_GSC_SI_NO_EXISTE]">
```

**Step 3: Deploy y verificar**

```bash
npm run build
# Deploy (el proceso que use Replit)
```

En Bing WMT → botón "Verify". Debe confirmar éxito.

**Step 4: Submit sitemap a Bing**

En Bing WMT → Sitemaps → Submit:
- `https://www.costabravarentaboat.com/sitemap.xml`
- `https://www.costabravarentaboat.com/sitemap-pages.xml`
- `https://www.costabravarentaboat.com/sitemap-boats.xml`
- `https://www.costabravarentaboat.com/sitemap-blog.xml`

**Step 5: Verificar IndexNow funcionando**

```bash
# Test manual IndexNow ping
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "www.costabravarentaboat.com",
    "key": "[INDEXNOW_KEY]",
    "urlList": ["https://www.costabravarentaboat.com/"]
  }'
```

Respuesta esperada: HTTP 200 o 202.

**Step 6: Commit**

```bash
git add client/index.html
git commit -m "feat(seo): add Bing Webmaster Tools verification"
```

**Verificación:** Bing WMT muestra dominio verificado. Sitemap marcado como "Success" en 24-48h.

---

## Task 3: Reescribir title/meta de homepage para capturar "Costa Brava"

**Objetivo:** Capturar las 725 impresiones/mes de "alquiler barco costa brava" que actualmente se pierden por no aparecer en el title.

**Files:**
- Modify: `client/index.html:8-10` (title base servido a crawlers sin JS)
- Modify: `client/src/utils/seo-config.ts:62-68` (home ES + todos los idiomas)

**Step 1: Cambiar title base en index.html**

Editar `client/index.html` línea 8:

```html
<title>Alquiler de Barcos Costa Brava | Sin Licencia desde 70€/h | Blanes</title>
<meta name="description" content="Alquiler de barcos sin licencia en la Costa Brava desde Puerto de Blanes. Desde 70€/h gasolina incluida, hasta 7 personas. 8 embarcaciones · Reserva por WhatsApp +34 611 500 372">
```

**Step 2: Actualizar seo-config.ts — home ES**

Editar `client/src/utils/seo-config.ts` líneas 62-68:

```typescript
home: {
  title: "Alquiler de Barcos Costa Brava | Sin Licencia desde 70€/h | Blanes",
  description: "Alquiler de barcos en la Costa Brava desde Puerto de Blanes. Sin licencia desde 70€/h, gasolina incluida, hasta 7 personas. 8 embarcaciones. Reserva por WhatsApp · Cambio fecha gratis.",
  keywords: "alquiler barco costa brava, alquiler barcos costa brava, alquiler barco blanes, alquiler barcos sin licencia blanes, alquiler embarcaciones costa brava, rent a boat costa brava, barco sin licencia costa brava",
  ogTitle: `Alquiler de Barcos Costa Brava ${SEASON_YEAR} | Sin Licencia desde 70€/h`,
  ogDescription: "Alquila barcos en la Costa Brava desde Puerto de Blanes. Sin licencia, gasolina incluida, desde 70€/h. 8 barcos disponibles."
},
```

**Step 3: Actualizar 7 idiomas restantes**

Para cada idioma (`en`, `ca`, `fr`, `de`, `nl`, `it`, `ru`) en `seo-config.ts`, actualizar el bloque `home` con versión traducida que incluya "Costa Brava". Ejemplos:

- `en.home.title`: `"Costa Brava Boat Rental | License-Free from 70€/h | Blanes"`
- `fr.home.title`: `"Location Bateau Costa Brava | Sans Permis dès 70€/h | Blanes"`
- `de.home.title`: `"Bootsverleih Costa Brava | Ohne Führerschein ab 70€/h | Blanes"`
- `it.home.title`: `"Noleggio Barca Costa Brava | Senza Patente da 70€/h | Blanes"`
- `nl.home.title`: `"Bootverhuur Costa Brava | Zonder Vaarbewijs vanaf 70€/h | Blanes"`
- `ca.home.title`: `"Lloguer de Barques Costa Brava | Sense Llicència des de 70€/h | Blanes"`
- `ru.home.title`: `"Аренда лодки Коста-Брава | Без лицензии от 70€/ч | Бланес"`

Descripciones: mantener longitud 150-160 caracteres, incluir "Costa Brava" + USP (sin licencia, gasolina incluida) + CTA.

**Step 4: Verificar en local**

```bash
npm run dev
# Abrir http://localhost:5000 y verificar <title> renderizado
# Cambiar idioma y verificar cada /en/, /fr/, /de/, etc.
```

**Step 5: Type check**

```bash
npm run check
# Esperado: 0 errores TS en seo-config.ts
```

**Step 6: Commit**

```bash
git add client/index.html client/src/utils/seo-config.ts
git commit -m "feat(seo): rewrite homepage titles to capture Costa Brava query (725 impressions/mo)"
```

**Verificación:** títulos renderizados en HTML correctamente en 8 idiomas. En 2-4 semanas GSC debe mostrar la homepage apareciendo para "alquiler barco costa brava".

---

## Task 4: Diferenciar `/alquiler-barcos-blanes` de homepage (fix canibalización)

**Objetivo:** Resolver canibalización. Homepage captura queries "costa brava" genéricas. Location Blanes captura queries hiper-locales (puerto, muelle, calas específicas).

**Files:**
- Read first: `client/src/pages/location-blanes.tsx`
- Modify: `client/src/pages/location-blanes.tsx`
- Modify: `client/src/utils/seo-config.ts:81-87` (locationBlanes ES + todos idiomas)

**Step 1: Leer página actual**

```bash
# Usar Read tool sobre client/src/pages/location-blanes.tsx
```

Identificar secciones actuales. Comparar con homepage para detectar solapamiento de contenido.

**Step 2: Re-orientar SEO de location-blanes a queries hiper-locales**

Editar `client/src/utils/seo-config.ts` bloque `locationBlanes` ES:

```typescript
locationBlanes: {
  title: `Alquiler Barco Puerto de Blanes | Amarre, Calas y Rutas ${SEASON_YEAR}`,
  description: "Alquiler de barcos directamente en el Puerto de Blanes: parking gratis, 5 min al amarre, snorkel y paddle board incluidos. Calas de Sa Palomera y Sant Francesc a 10 min navegando.",
  keywords: "alquiler barco puerto de blanes, alquiler barco muelle blanes, barcos sa palomera blanes, calas blanes barco, sant francesc blanes barco, amarre blanes, ruta barco blanes calas",
  ogTitle: `Alquiler Barco Puerto de Blanes | Directamente desde el Muelle ${SEASON_YEAR}`,
  ogDescription: "Alquila tu barco directamente en Puerto de Blanes. Parking gratis, snorkel incluido, calas locales a 10 min. 5 barcos sin licencia desde 70€/h."
},
```

(Homepage ataca "Costa Brava" + "Blanes". Location Blanes ataca "Puerto de Blanes" + "Sa Palomera" + "calas Blanes". Sin solapamiento.)

**Step 3: Rewriteur contenido de location-blanes.tsx**

Añadir secciones únicas (que NO existen en homepage):

- **Sección "El Puerto de Blanes"**: historia breve, amarres, servicios del puerto, cómo llegar, parking
- **Sección "Calas locales a <10 min navegando"**: Sa Palomera (ES+localizada), Sant Francesc, Cala Bona con fotos y coordenadas
- **Sección "Ruta recomendada desde Blanes"**: itinerario 4h con stops
- **FAQ local**: 8-10 preguntas específicas de Blanes (parking, distancia calas, servicios cercanos)
- **Mapa del puerto** embedido

Generar el texto con Claude (copy original, no copypaste de homepage).

**Step 4: Repetir para 7 idiomas en seo-config.ts**

Actualizar `en.locationBlanes`, `fr.locationBlanes`, etc. con angle hiper-local traducido.

**Step 5: Validar canibalización resuelta**

```bash
# Buscar duplicación entre homepage y location-blanes
# Grep por frases clave: si una frase de 10+ palabras aparece en ambas, reescribir
grep -l "palabra_unica_de_homepage" client/src/pages/location-blanes.tsx
```

**Step 6: Type check + tests**

```bash
npm run check
npm test
```

**Step 7: Commit**

```bash
git add client/src/pages/location-blanes.tsx client/src/utils/seo-config.ts
git commit -m "fix(seo): differentiate location-blanes from homepage to resolve cannibalization"
```

**Verificación:** en 4-6 semanas, GSC muestra `/alquiler-barcos-blanes` rankeando para "puerto de blanes" y "sa palomera barco" mientras homepage mantiene "costa brava" y "alquiler barco blanes".

---

## Task 5: Reescribir titles de 9 páginas de ubicación restantes

**Objetivo:** Cada página ubicación captura long-tail `[keyword] + [city]` sin competir con homepage.

**Files:**
- Modify: `client/src/utils/seo-config.ts` (bloques `locationLloret`, `locationTossa`, `locationPalafolls`, `locationTordera`, `locationPineda`, `locationMalgrat`, `locationCalella`, `locationSantaSusanna`, `locationBarcelona`) × 8 idiomas

**Step 1: Template de título por ubicación**

Patrón:
```
Alquiler Barco <Ciudad> | <USP local específica> | Desde Blanes ${SEASON_YEAR}
```

Ejemplos:

| Ubicación | Title ES propuesto |
|-----------|-------------------|
| Lloret de Mar | `Alquiler Barco Lloret de Mar | Cala Banys y Santa Cristina en Barco desde Blanes` |
| Tossa de Mar | `Alquiler Barco Tossa de Mar | Vila Vella y Mar d'en Roig desde Blanes` |
| Calella | `Alquiler Barco Calella | Costa Norte de Barcelona en Barco desde Blanes` |
| Santa Susanna | `Alquiler Barco Santa Susanna | 15 min desde Puerto Blanes` |
| Malgrat de Mar | `Alquiler Barco Malgrat de Mar | 10 min desde Blanes | Sin Licencia` |
| Pineda de Mar | `Alquiler Barco Pineda de Mar | Playas Vírgenes desde Blanes` |
| Palafolls | `Alquiler Barco Palafolls | Costa Brava Sur desde Blanes` |
| Tordera | `Alquiler Barco Tordera | Delta del Tordera en Barco` |
| Barcelona | `Alquiler Barco Barcelona | Alternativa sin Tráfico desde Blanes ${SEASON_YEAR}` |

**Step 2: Actualizar cada bloque en seo-config.ts**

Para cada ubicación y cada idioma: título, description (150-160 chars), keywords (long-tail específicas), ogTitle, ogDescription.

**Step 3: Type check**

```bash
npm run check
```

**Step 4: Commit**

```bash
git add client/src/utils/seo-config.ts
git commit -m "feat(seo): rewrite titles for 9 location pages with hyper-local angle"
```

**Verificación:** cada location page tiene título distintivo sin overlap. Search Console debería mostrar nuevas queries long-tail rankeando en 4-8 semanas.

---

## Task 6: Reescribir titles de páginas restantes (activities, categories, about, etc.)

**Objetivo:** Optimizar 17 páginas restantes con queries comerciales claras.

**Files:**
- Modify: `client/src/utils/seo-config.ts` (resto de bloques)

**Step 1: Páginas a actualizar**

| Página | Title propuesto |
|--------|----------------|
| `about` | `Sobre Nosotros · Costa Brava Rent a Boat | 15 Años en Blanes` |
| `faq` | `FAQ Alquiler Barcos Costa Brava | Licencia, Precios, Combustible` |
| `pricing` | `Precios Alquiler Barcos Costa Brava | Desde 70€/h Gasolina Incluida` |
| `gallery` | `Galería Barcos y Rutas Costa Brava | Fotos Reales de Clientes` |
| `testimonios` | `Opiniones Clientes · 4.8★ · Costa Brava Rent a Boat Blanes` |
| `blog` | `Blog Costa Brava Náutica | Rutas, Calas y Consejos de Navegación` |
| `routes` | `Rutas en Barco Costa Brava | Itinerarios desde Blanes ${SEASON_YEAR}` |
| `giftCards` | `Tarjetas Regalo Alquiler Barco Costa Brava | Experiencias Únicas` |
| `categoryLicenseFree` | `Barcos Sin Licencia Costa Brava | 70€/h Gasolina Incluida | Blanes` |
| `categoryLicensed` | `Barcos con Licencia Costa Brava | PER · Larga Distancia desde Blanes` |
| `activitySnorkel` | `Snorkel en Barco Costa Brava | Calas Vírgenes desde Blanes ${SEASON_YEAR}` |
| `activityFishing` | `Pesca Deportiva Costa Brava | Alquiler Barco con Cañas Incluidas` |
| `activitySunset` | `Atardecer en Barco Costa Brava | Rutas Sunset desde Blanes` |
| `activityFamilies` | `Barco Familiar Costa Brava | Perfecto Niños y Niñas desde 70€/h` |
| `alquilerCostaBrava` | `Alquiler Barcos Costa Brava ${SEASON_YEAR} | Guía Completa + Precios` |
| `privacyPolicy` | `Política de Privacidad | Costa Brava Rent a Boat` |
| `termsConditions` | `Términos y Condiciones | Costa Brava Rent a Boat Blanes` |

**Step 2: Actualizar en 8 idiomas**

Traducciones localizadas para cada uno.

**Step 3: Type check + commit**

```bash
npm run check
git add client/src/utils/seo-config.ts
git commit -m "feat(seo): rewrite titles for 17 remaining pages (activities, categories, info)"
```

---

## Task 7: Expandir FAQ schema a las 10 páginas de ubicación

**Objetivo:** Rich snippets FAQ en SERPs (ocupa el doble de altura → +30% CTR).

**Files:**
- Modify: `client/src/utils/seo-schemas.ts` (añadir generador `buildLocationFaqSchema`)
- Modify: 10 páginas location-*.tsx o LocationTemplate.tsx

**Step 1: Leer implementación FAQ actual**

```bash
# Leer client/src/utils/seo-schemas.ts completo
```

Identificar cómo se construyen los schemas FAQ y cómo se inyectan.

**Step 2: Crear generador FAQ por ubicación**

Añadir a `client/src/utils/seo-schemas.ts`:

```typescript
export interface LocationFaqItem {
  question: string;
  answer: string;
}

export function buildLocationFaqSchema(
  cityName: string,
  items: LocationFaqItem[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  };
}
```

**Step 3: Crear datos FAQ por ubicación**

Nuevo archivo `client/src/data/locationFaqs.ts`:

```typescript
import type { Language } from "@/hooks/use-language";
import type { LocationFaqItem } from "@/utils/seo-schemas";

type LocationKey = "blanes" | "lloret" | "tossa" | "calella" /* ...etc */;

export const LOCATION_FAQS: Record<Language, Record<LocationKey, LocationFaqItem[]>> = {
  es: {
    blanes: [
      {
        question: "¿Dónde está exactamente el Puerto de Blanes?",
        answer: "El Puerto de Blanes está en el paseo marítimo de Blanes, Girona. Coordenadas: 41.6751°N, 2.7934°E. Hay parking público a 100m y la estación de tren Renfe R1 está a 10 min andando.",
      },
      {
        question: "¿Cuánto tarda llegar a Cala Sa Palomera desde el Puerto de Blanes en barco?",
        answer: "Cala Sa Palomera está a 8-12 minutos de navegación desde el Puerto de Blanes a velocidad crucero. Es la cala más cercana y perfecta para snorkel sin licencia náutica.",
      },
      // ... 8-10 preguntas más
    ],
    lloret: [/* ... */],
    // ... resto ubicaciones
  },
  en: { /* traducidas */ },
  // ... resto idiomas
};
```

**Step 4: Inyectar FAQ schema en cada location page**

Patrón en cada `location-*.tsx`:

```typescript
import { buildLocationFaqSchema } from "@/utils/seo-schemas";
import { LOCATION_FAQS } from "@/data/locationFaqs";
import SEO from "@/components/SEO";

export default function LocationBlanesPage() {
  const { language } = useLanguage();
  const faqs = LOCATION_FAQS[language].blanes;
  const faqSchema = buildLocationFaqSchema("Blanes", faqs);

  return (
    <>
      <SEO pageKey="locationBlanes" structuredData={faqSchema} />
      {/* resto del contenido incluyendo FAQ visible */}
    </>
  );
}
```

**Step 5: Validar con Google Rich Results Test**

Deploy y validar cada URL en https://search.google.com/test/rich-results:
- `https://www.costabravarentaboat.com/alquiler-barcos-blanes`
- `https://www.costabravarentaboat.com/alquiler-barcos-lloret-de-mar`
- etc.

Esperado: "FAQ" marcado como "Valid" sin errores.

**Step 6: Commit**

```bash
git add client/src/utils/seo-schemas.ts client/src/data/locationFaqs.ts client/src/pages/location-*.tsx
git commit -m "feat(seo): add FAQ schema to all 10 location pages for rich snippets"
```

**Verificación:** Google Rich Results Test muestra FAQ válido. En 2-4 semanas, las URLs deberían mostrar FAQ expandido en SERPs.

---

## Task 8: Auditoría y fix URLs antiguas de Wix indexadas

**Objetivo:** Google indexa URLs de la estructura vieja Wix. Verificar que tienen 301 al equivalente actual.

**Files:**
- Verify: `server/seo/redirects.ts`
- Query DB: tabla `seoRedirects`
- Tool: admin UI en `/admin/seo/redirects` (si existe)

**Step 1: Exportar URLs antiguas desde GSC**

Usuario exporta desde Google Search Console:
1. Coverage → Excluded → `Redirect error` y `Not found (404)` y `Crawled - currently not indexed`
2. Export CSV
3. Filtrar URLs que son de la era Wix (patrones viejos)

Guardar como `docs/seo/wix-legacy-urls-2026-04-17.csv`.

**Step 2: Diff contra redirects existentes**

Query BD:

```sql
SELECT from_path FROM seo_redirects;
```

Comparar CSV vs DB. Identificar URLs en GSC que NO tienen redirect.

**Step 3: Script de validación automática**

Crear `scripts/audit-wix-redirects.ts`:

```typescript
import { readFileSync } from "fs";
import { db } from "../server/db";
import { seoRedirects } from "../shared/schema";

const csv = readFileSync("docs/seo/wix-legacy-urls-2026-04-17.csv", "utf-8");
const gscUrls = csv.split("\n").slice(1).map(line => {
  const url = line.split(",")[0]?.replace(/"/g, "").trim();
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}).filter(Boolean) as string[];

const existingRedirects = await db.select({ from: seoRedirects.fromPath }).from(seoRedirects);
const existingSet = new Set(existingRedirects.map(r => r.from));

const missing = gscUrls.filter(path => !existingSet.has(path));
console.log(`Missing redirects (${missing.length}):`);
missing.forEach(p => console.log(`  ${p}`));
```

Ejecutar:

```bash
npx tsx scripts/audit-wix-redirects.ts > docs/seo/missing-redirects-2026-04-17.txt
```

**Step 4: Añadir redirects faltantes**

Mapear manualmente cada URL faltante a su equivalente actual. Insertar vía admin UI o endpoint API. Patrón común:
- `/barco-sin-licencia-blanes-astec-450` → `/barcos/astec-450`
- `/alquiler-blanes` → `/alquiler-barcos-blanes`
- etc.

**Step 5: Solicitar re-crawl en GSC**

Para URLs críticas, usuario usa la herramienta "URL Inspection" en GSC → "Request Indexing" → acelera re-crawl.

**Step 6: Commit**

```bash
git add scripts/audit-wix-redirects.ts
git commit -m "feat(seo): add Wix legacy URL redirect audit script"
```

**Verificación:** en 2-8 semanas, Google reemplaza URLs antiguas en SERPs con las nuevas canonicalizadas.

---

## Task 9: Auditoría y completion de ficha Google My Business

**Objetivo:** Dominar el Local Pack completando la ficha al 100%.

**Files:**
- No code. Trabajo en interfaz GMB + coordinación con usuario.

**Step 1: Auditoría actual**

Claude solicita al usuario screenshot de GMB en:
- https://business.google.com/locations
- Revisar: categoría primaria, categorías secundarias, atributos, horarios, service areas, fotos

**Step 2: Completar categorías secundarias**

Añadir (además de la primaria "Yacht Club" o similar):
- Boat Rental Service
- Tourist Attraction
- Boat Tour Agency

**Step 3: Completar service areas**

Añadir ciudades a las que llegas en barco:
- Blanes, Lloret de Mar, Tossa de Mar, Calella, Santa Susanna, Malgrat de Mar, Pineda de Mar, Palafolls, Tordera, Platja d'Aro, Sant Feliu de Guíxols, Palamós

**Step 4: Completar atributos**

Marcar todos los aplicables:
- Family-friendly ✅
- Free parking ✅
- Wheelchair accessible (si aplica)
- LGBTQ+ friendly ✅
- Accepts credit cards, cash
- Appointment required (para reservas)
- Online appointments ✅

**Step 5: Horarios especiales temporada**

Configurar "Opening hours" = April-October 9:00-20:00 + "Temporarily closed" Nov-Mar.

**Step 6: Subir primer lote de 10 fotos nuevas**

Categorizadas:
- 3 exterior barcos
- 3 clientes (con permiso)
- 2 interior/equipamiento
- 2 atardeceres/experiencias

**Step 7: Claude genera 3 primeros posts semanales GMB**

Posts con keyword objetivo + CTA WhatsApp + imagen Nanobanana. Primer post:
- Título: "Temporada 2026 abierta en Puerto de Blanes"
- Cuerpo: 200 chars con "Alquiler barco Costa Brava sin licencia desde 70€/h, gasolina incluida"
- CTA: "Reserva por WhatsApp"
- Imagen: prompt Nanobanana (Claude proporciona)

Usuario publica manualmente este lote inicial. Task 10 automatizará los siguientes.

**Verificación:** GMB muestra ficha 100% completa. Insights GMB muestra aumento en "searches" y "actions" en 2-4 semanas.

---

## Task 10: Integración GMB API para sync de reviews

**Objetivo:** Reemplazar reviews hard-coded (4.8★, 307 reviews) por datos dinámicos desde Google My Business API.

**Files:**
- Create: `server/services/gmbSync.ts`
- Create: `shared/schema.ts` (añadir tabla `gmbReviewsCache`)
- Modify: `server/seoInjector.ts` (leer de cache en vez de hard-coded)
- Create: `server/routes/admin-gmb.ts` (endpoints admin para ver estado)
- Modify: `server/routes/index.ts` (registrar nueva ruta)
- Modify: `server/mcp/business-server.ts` o crear `server/mcp/gmb-server.ts`

**Step 1: Añadir tabla cache reviews**

Editar `shared/schema.ts`:

```typescript
export const gmbReviewsCache = pgTable("gmb_reviews_cache", {
  id: serial("id").primaryKey(),
  reviewId: text("review_id").unique().notNull(),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  language: text("language"),
  createdAt: timestamp("created_at").notNull(),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
  responded: boolean("responded").default(false),
  responseText: text("response_text"),
  respondedAt: timestamp("responded_at"),
});

export const gmbStatsCache = pgTable("gmb_stats_cache", {
  id: serial("id").primaryKey(),
  averageRating: real("average_rating").notNull(),
  totalReviews: integer("total_reviews").notNull(),
  distribution: jsonb("distribution"), // {1: 2, 2: 3, 3: 5, 4: 50, 5: 247}
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});
```

Ejecutar migración:

```bash
npm run db:push
```

**Step 2: Servicio GMB sync**

Crear `server/services/gmbSync.ts`:

```typescript
import { google } from "googleapis";
import { db } from "../db";
import { gmbReviewsCache, gmbStatsCache } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const GMB_ACCOUNT_ID = process.env.GMB_ACCOUNT_ID!;
const GMB_LOCATION_ID = process.env.GMB_LOCATION_ID!;

async function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMB_CLIENT_ID,
    process.env.GMB_CLIENT_SECRET,
    process.env.GMB_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GMB_REFRESH_TOKEN });
  return oauth2Client;
}

export async function syncGmbReviews(): Promise<{ synced: number; errors: number }> {
  try {
    const auth = await getAuthClient();
    const mybusiness = google.mybusinessaccountmanagement({ version: "v1", auth });
    // ...

    // Fetch reviews (Google My Business API v4 reviews endpoint)
    const accessToken = (await auth.getAccessToken()).token;
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${GMB_ACCOUNT_ID}/locations/${GMB_LOCATION_ID}/reviews`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const { reviews, averageRating, totalReviewCount } = await response.json();

    let synced = 0;
    for (const r of reviews ?? []) {
      await db.insert(gmbReviewsCache).values({
        reviewId: r.reviewId,
        authorName: r.reviewer.displayName,
        rating: starRatingToInt(r.starRating),
        comment: r.comment ?? null,
        language: detectLanguage(r.comment),
        createdAt: new Date(r.createTime),
      }).onConflictDoUpdate({
        target: gmbReviewsCache.reviewId,
        set: { syncedAt: new Date() },
      });
      synced++;
    }

    // Update stats cache
    await db.delete(gmbStatsCache);
    await db.insert(gmbStatsCache).values({
      averageRating,
      totalReviews: totalReviewCount,
      distribution: computeDistribution(reviews ?? []),
    });

    logger.info("[GMB:Sync] Reviews synced", { synced, total: totalReviewCount, averageRating });
    return { synced, errors: 0 };
  } catch (error) {
    logger.error("[GMB:Sync] Sync failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { synced: 0, errors: 1 };
  }
}

function starRatingToInt(rating: string): number {
  return { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[rating] ?? 5;
}

function detectLanguage(text: string | null | undefined): string | null {
  // Simple heuristic; Claude can extend later
  if (!text) return null;
  if (/[ñ¿¡]/.test(text)) return "es";
  if (/\b(the|and|with)\b/i.test(text)) return "en";
  if (/\b(le|la|et|avec)\b/i.test(text)) return "fr";
  return null;
}

function computeDistribution(reviews: any[]): Record<string, number> {
  const dist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const r of reviews) {
    const stars = starRatingToInt(r.starRating);
    dist[String(stars)] = (dist[String(stars)] ?? 0) + 1;
  }
  return dist;
}
```

**Step 3: Job scheduled diario**

Editar `server/services/scheduler.ts` (o donde esté el scheduler), añadir:

```typescript
import { syncGmbReviews } from "./gmbSync";
import cron from "node-cron";

// Sync GMB reviews diariamente a las 03:00 Europe/Madrid
cron.schedule("0 3 * * *", async () => {
  await syncGmbReviews();
}, { timezone: "Europe/Madrid" });
```

**Step 4: Actualizar seoInjector.ts para usar cache**

Editar `server/seoInjector.ts` donde se construye `AggregateRating` hard-coded:

```typescript
import { db } from "./db";
import { gmbStatsCache } from "../shared/schema";

async function getAggregateRating() {
  const [stats] = await db.select().from(gmbStatsCache).limit(1);
  return {
    ratingValue: stats?.averageRating?.toFixed(1) ?? "4.8",
    reviewCount: stats?.totalReviews ?? 307,
  };
}

// Usar en schema builder:
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": (await getAggregateRating()).ratingValue,
  "reviewCount": (await getAggregateRating()).reviewCount,
  "bestRating": "5"
}
```

**Step 5: Test**

```bash
# Correr sync manualmente
npx tsx -e "import {syncGmbReviews} from './server/services/gmbSync'; syncGmbReviews().then(console.log)"
```

Verificar en DB:

```sql
SELECT COUNT(*) FROM gmb_reviews_cache;
SELECT * FROM gmb_stats_cache;
```

**Step 6: Variables de entorno**

Añadir a `.env` (usuario provee):
- `GMB_CLIENT_ID`
- `GMB_CLIENT_SECRET`
- `GMB_REDIRECT_URI`
- `GMB_REFRESH_TOKEN`
- `GMB_ACCOUNT_ID`
- `GMB_LOCATION_ID`

**Step 7: Commit**

```bash
git add server/services/gmbSync.ts shared/schema.ts server/seoInjector.ts server/services/scheduler.ts
git commit -m "feat(seo): sync GMB reviews to schema JSON-LD dynamically"
```

**Verificación:** HTML inyectado muestra rating real desde cache (no más 4.8★ hard-coded). Cache se actualiza diariamente.

---

## Task 11: Review acquisition vía WhatsApp automation

**Objetivo:** Tras cada booking completado, pedir review en Google/Tripadvisor 24h después.

**Files:**
- Create: `server/services/reviewRequest.ts`
- Modify: `server/services/scheduler.ts`
- Create: `server/whatsapp/templates/reviewRequest.ts`

**Step 1: Template multi-idioma**

Crear `server/whatsapp/templates/reviewRequest.ts`:

```typescript
export function getReviewRequestMessage(
  customerName: string,
  language: string
): string {
  const templates: Record<string, string> = {
    es: `Hola ${customerName}! Esperamos que hayas disfrutado del barco 🌊 ¿Nos dejarías una reseña en Google? Solo 30 segundos: [GOOGLE_REVIEW_LINK]\n\nCualquier duda o feedback, aquí estamos.`,
    en: `Hi ${customerName}! Hope you enjoyed the boat 🌊 Would you leave us a Google review? Just 30 seconds: [GOOGLE_REVIEW_LINK]\n\nAny questions or feedback, we're here.`,
    fr: `Bonjour ${customerName}! Nous espérons que vous avez apprécié le bateau 🌊 Pourriez-vous nous laisser un avis Google? 30 secondes: [GOOGLE_REVIEW_LINK]`,
    de: `Hallo ${customerName}! Wir hoffen, dir hat das Boot gefallen 🌊 Würdest du uns eine Google-Bewertung hinterlassen? Nur 30 Sekunden: [GOOGLE_REVIEW_LINK]`,
    nl: `Hallo ${customerName}! We hopen dat je genoten hebt van de boot 🌊 Zou je ons een Google-review willen geven? 30 seconden: [GOOGLE_REVIEW_LINK]`,
    it: `Ciao ${customerName}! Speriamo ti sia piaciuta la barca 🌊 Lasceresti una recensione su Google? Solo 30 secondi: [GOOGLE_REVIEW_LINK]`,
    ca: `Hola ${customerName}! Esperem que hagis gaudit de la barca 🌊 Ens deixaries una ressenya a Google? 30 segons: [GOOGLE_REVIEW_LINK]`,
    ru: `Здравствуйте, ${customerName}! Надеемся, вам понравилась лодка 🌊 Оставите отзыв на Google? Всего 30 секунд: [GOOGLE_REVIEW_LINK]`,
  };

  const link = "https://g.page/r/CXXXXXXXXXXXXXXX/review"; // Real GMB review link
  return (templates[language] ?? templates.es).replace("[GOOGLE_REVIEW_LINK]", link);
}
```

**Step 2: Servicio de envío**

Crear `server/services/reviewRequest.ts`:

```typescript
import { db } from "../db";
import { bookings } from "../../shared/schema";
import { and, eq, lt, isNull } from "drizzle-orm";
import { sendWhatsAppMessage } from "../whatsapp/sendMessage";
import { getReviewRequestMessage } from "../whatsapp/templates/reviewRequest";
import { logger } from "../lib/logger";

export async function sendPendingReviewRequests(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

  const completedBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "completed"),
        lt(bookings.endTime, cutoff),
        isNull(bookings.reviewRequestSentAt)
      )
    );

  for (const b of completedBookings) {
    try {
      const msg = getReviewRequestMessage(b.customerName ?? "amigo", b.language ?? "es");
      await sendWhatsAppMessage(b.phone, msg);

      await db
        .update(bookings)
        .set({ reviewRequestSentAt: new Date() })
        .where(eq(bookings.id, b.id));

      logger.info("[ReviewRequest] Sent", { bookingId: b.id, phone: b.phone });
    } catch (error) {
      logger.error("[ReviewRequest] Failed", {
        bookingId: b.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
```

**Step 3: Añadir campo DB**

Editar `shared/schema.ts`:

```typescript
export const bookings = pgTable("bookings", {
  // ... campos existentes
  reviewRequestSentAt: timestamp("review_request_sent_at"),
});
```

Migración:

```bash
npm run db:push
```

**Step 4: Schedule**

En `server/services/scheduler.ts`:

```typescript
import { sendPendingReviewRequests } from "./reviewRequest";

cron.schedule("0 10 * * *", async () => {
  await sendPendingReviewRequests();
}, { timezone: "Europe/Madrid" });
```

**Step 5: Tests**

Crear `server/services/reviewRequest.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { sendPendingReviewRequests } from "./reviewRequest";

describe("reviewRequest", () => {
  it("sends review request for completed bookings ended >24h ago", async () => {
    // Mock db + sendWhatsAppMessage
    // Arrange booking 25h ago, status completed, no reviewRequestSentAt
    // Act sendPendingReviewRequests()
    // Assert sendWhatsAppMessage called with correct phone + es message
  });

  it("does not re-send if reviewRequestSentAt is set", async () => {
    // ...
  });

  it("uses customer language for template", async () => {
    // ...
  });
});
```

Correr:

```bash
npm test server/services/reviewRequest.test.ts
```

**Step 6: Commit**

```bash
git add server/services/reviewRequest.ts server/whatsapp/templates/reviewRequest.ts shared/schema.ts server/services/scheduler.ts server/services/reviewRequest.test.ts
git commit -m "feat(seo): automated review request via WhatsApp 24h post-booking"
```

**Verificación:** En temporada real (primer booking completado), evento dispara WhatsApp. En GMB Insights, "reviews in last 7 days" debe subir.

---

## Task 12: Reporte SEO semanal automatizado

**Objetivo:** Lunes 9:00 AM email a Iván con estado de KPIs + 3 acciones recomendadas.

**Files:**
- Create: `server/services/weeklySeoReport.ts`
- Modify: `server/services/scheduler.ts`
- Modify: `server/mcp/seo-engine.ts` (añadir tool `generate_weekly_report`)

**Step 1: Estructura del reporte**

Crear `server/services/weeklySeoReport.ts`:

```typescript
import { db } from "../db";
import { seoGscSnapshots, gmbStatsCache } from "../../shared/schema";
import { sendEmail } from "./email";
import { logger } from "../lib/logger";

interface WeeklyReportData {
  gsc: {
    impressions: { current: number; prev: number; delta: number };
    clicks: { current: number; prev: number; delta: number };
    ctr: { current: number; prev: number; delta: number };
    position: { current: number; prev: number; delta: number };
    topGainers: Array<{ query: string; deltaPos: number }>;
    topLosers: Array<{ query: string; deltaPos: number }>;
  };
  gmb: {
    totalReviews: number;
    newReviews: number;
    averageRating: number;
  };
  ga4: {
    organicSessions: { current: number; prev: number; delta: number };
    whatsappClicks: { current: number; prev: number; delta: number };
    conversionRate: { current: number; prev: number };
  };
  recommendations: string[];
}

export async function generateWeeklyReport(): Promise<WeeklyReportData> {
  // ... queries a DB + GSC/GA4 APIs
}

export function formatReportHtml(data: WeeklyReportData): string {
  return `
    <h1>Reporte SEO Semanal — ${new Date().toLocaleDateString("es-ES")}</h1>
    <h2>Search Console</h2>
    <ul>
      <li>Impresiones: ${data.gsc.impressions.current.toLocaleString()} (${data.gsc.impressions.delta >= 0 ? "+" : ""}${data.gsc.impressions.delta}%)</li>
      <li>Clicks: ${data.gsc.clicks.current.toLocaleString()} (${data.gsc.clicks.delta >= 0 ? "+" : ""}${data.gsc.clicks.delta}%)</li>
      <li>CTR: ${(data.gsc.ctr.current * 100).toFixed(2)}%</li>
      <li>Posición media: ${data.gsc.position.current.toFixed(1)}</li>
    </ul>

    <h2>Google My Business</h2>
    <ul>
      <li>Reviews totales: ${data.gmb.totalReviews}</li>
      <li>Nuevas esta semana: ${data.gmb.newReviews}</li>
      <li>Rating medio: ${data.gmb.averageRating.toFixed(1)}★</li>
    </ul>

    <h2>Top Gainers (keywords que suben)</h2>
    <ul>${data.gsc.topGainers.map(g => `<li>${g.query} (+${g.deltaPos} posiciones)</li>`).join("")}</ul>

    <h2>Top Losers (keywords que bajan — ATENCIÓN)</h2>
    <ul>${data.gsc.topLosers.map(l => `<li>${l.query} (${l.deltaPos} posiciones)</li>`).join("")}</ul>

    <h2>🎯 3 Acciones recomendadas esta semana</h2>
    <ol>${data.recommendations.map(r => `<li>${r}</li>`).join("")}</ol>
  `;
}

export async function sendWeeklyReport(): Promise<void> {
  const data = await generateWeeklyReport();
  const html = formatReportHtml(data);

  await sendEmail({
    to: "costabravarentaboat@gmail.com",
    subject: `Reporte SEO Semanal — ${data.gsc.clicks.current} clicks esta semana`,
    html,
  });

  logger.info("[WeeklyReport] Sent", { clicks: data.gsc.clicks.current });
}
```

**Step 2: Generador de recomendaciones**

Las 3 recomendaciones se generan por reglas + LLM call (Claude tiene contexto del estado):

```typescript
function generateRecommendations(data: WeeklyReportData): string[] {
  const recs: string[] = [];

  // Regla 1: CTR bajo en posiciones top
  if (data.gsc.ctr.current < 0.02 && data.gsc.position.current <= 10) {
    recs.push("CTR bajo (<2%) en posiciones top 10 — revisar meta descriptions y rich snippets");
  }

  // Regla 2: Pérdida de posición crítica
  if (data.gsc.topLosers.some(l => Math.abs(l.deltaPos) > 5)) {
    const worst = data.gsc.topLosers[0];
    recs.push(`Keyword "${worst.query}" cayó ${worst.deltaPos} posiciones — investigar SERP y contenido`);
  }

  // Regla 3: Pocas reviews nuevas
  if (data.gmb.newReviews < 3) {
    recs.push("Pocas reviews nuevas esta semana — verificar que review request automation está disparando");
  }

  // Fallback
  if (recs.length === 0) {
    recs.push("Todo en orden. Seguir con plan de contenido programado.");
  }

  return recs.slice(0, 3);
}
```

**Step 3: Schedule**

En `scheduler.ts`:

```typescript
import { sendWeeklyReport } from "./weeklySeoReport";

// Lunes 09:00 Europe/Madrid
cron.schedule("0 9 * * 1", async () => {
  await sendWeeklyReport();
}, { timezone: "Europe/Madrid" });
```

**Step 4: Exponer como MCP tool**

Editar `server/mcp/seo-engine.ts`, añadir tool `generate_weekly_report` que permite llamar manualmente el reporte y devolverlo estructurado (para Claude usarlo en conversaciones).

**Step 5: Test**

```bash
# Dispatch manual
npx tsx -e "import {sendWeeklyReport} from './server/services/weeklySeoReport'; sendWeeklyReport()"
```

Verificar email recibido.

**Step 6: Commit**

```bash
git add server/services/weeklySeoReport.ts server/services/scheduler.ts server/mcp/seo-engine.ts
git commit -m "feat(seo): automated weekly SEO report via email with recommendations"
```

**Verificación:** Email llega cada lunes 9 AM con KPIs + 3 recomendaciones.

---

## Checklist pre-cierre Fase 1

- [ ] Task 1: Tracking WhatsApp verificado con contexto de página
- [ ] Task 2: Bing WMT verificado + sitemap submitted
- [ ] Task 3: Title homepage rewriteado en 8 idiomas
- [ ] Task 4: Location-blanes diferenciado de homepage
- [ ] Task 5: 9 páginas ubicación con titles hiper-locales
- [ ] Task 6: 17 páginas restantes con titles optimizados
- [ ] Task 7: FAQ schema en 10 páginas ubicación
- [ ] Task 8: URLs antiguas Wix auditadas y 301s añadidos
- [ ] Task 9: GMB ficha al 100% completa + primeros posts
- [ ] Task 10: GMB reviews sync automatizado
- [ ] Task 11: Review request WhatsApp automatizado
- [ ] Task 12: Reporte semanal funcionando

## Success criteria Fase 1 (fin de semana 2)

- Homepage rankea #1-10 para "alquiler barco costa brava" (era invisible)
- CTR medio global >2%
- GMB ficha al 100%, al menos 3 posts/semana publicados
- Review request automation procesa al menos 5 bookings
- Primer reporte semanal enviado
- Sin regresiones: no page pierde >30% tráfico orgánico

## Handoff a Fase 2

Una vez Fase 1 completa, crear nuevo plan:
`docs/plans/2026-05-01-seo-phase2-expansion-implementation.md`

Fase 2 cubre semanas 3-6: reescritura contenido páginas ubicación, reviews engine completo, rich snippets everywhere, primeros 20 posts GMB semanales automatizados, outreach 50 hoteles, `llms.txt`.
