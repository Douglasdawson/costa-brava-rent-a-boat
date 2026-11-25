# Instrucciones para Claude Code

## Contexto del Proyecto
Este es un proyecto de alquiler de barcos en Blanes, Costa Brava. Lee `PROJECT_CONTEXT.md` para contexto completo.

## Idioma
- **Comunicacion**: Espanol (el usuario prefiere espanol)
- **Codigo**: Ingles (nombres de variables, funciones, comentarios tecnicos)
- **UI/Contenido**: Multi-idioma (es, en, ca, fr, de, nl, it, ru)

## Convenciones de Codigo

### TypeScript
- Strict mode habilitado
- Usar tipos explicitos, evitar `any`
- Interfaces sobre types cuando sea posible
- Usar Zod para validacion runtime

### React
- Componentes funcionales con hooks
- Nombrar componentes en PascalCase
- Usar `@/` para imports absolutos desde `client/src/`
- Lazy loading para paginas no criticas

### Estilos
- TailwindCSS exclusivamente (no CSS custom)
- Usar clases de `shadcn/ui` cuando existan
- Mobile-first responsive design
- Colores via CSS variables (ver `tailwind.config.ts`)

### API
- RESTful endpoints en `server/routes/*.ts` (49 archivos modulares)
- Rutas registradas en `server/routes/index.ts`
- Auth admin: `requireAdminSession` de `server/routes/auth-middleware.ts`
- Validacion con Zod en servidor
- Errores en espanol para usuario final
- Logs en ingles via `logger` de `server/lib/logger.ts`

### Base de Datos
- Neon PostgreSQL (connection string en `DATABASE_URL`)
- Drizzle ORM para queries
- Schemas en `shared/schema.ts`
- Storage layer en `server/storage/*.ts` (21 modulos)
- Nombres de tablas en snake_case
- Campos en camelCase en TypeScript

## Estructura del Proyecto

### Frontend (`client/src/`)
| Area | Ruta | Descripcion |
|------|------|-------------|
| Paginas publicas | `pages/*.tsx` | 39 paginas (10 locations, 4 activities, 3 jet ski, scooters, 2 categories, blog, FAQ, about, etc.) |
| Componentes | `components/*.tsx` | Componentes publicos (Hero, Fleet, Booking, Navigation, etc.) |
| Booking flow (modal del Hero) | `client/src/hooks/useBookingModal.tsx` (+ `bookingModalContext.ts`) → `BookingFormWidget.tsx` → `BookingWizardMobile.tsx` / `BookingFormDesktop.tsx` | Modal flotante con wizard de 6 steps (Cuándo, Barco [se salta con barco preseleccionado], Hora y duración, Mejora tu día, Garantías, Confirmar). Los cuerpos de los steps son COMPARTIDOS en `components/booking/Step{WhenWho,Boat,Departure,Extras,Coverages,Confirm}.tsx`: un cambio de step se hace una vez. Post-envío: `BookingConfirmation.tsx`. Es lo que abre el CTA del Hero. Detalle: docs/arquitectura-modulos.md |
| Panel admin CRM | `components/crm/` | 25+ componentes (Dashboard, Calendar, Bookings, Fleet, etc.) |
| UI base | `components/ui/` | Componentes shadcn/ui |
| Traducciones i18n | `i18n/*.ts` | 8 idiomas (es, en, ca, fr, de, nl, it, ru) |
| Hooks | `hooks/` | 20 hooks (useLanguage, useBookingModal, useFeatureFlag, etc.) |
| SEO | `utils/seo-config.ts` | Titulos, descripciones, hreflang por idioma |
| SEO schemas | `utils/seo-schemas.ts` | JSON-LD structured data |

### Backend (`server/`)
| Area | Ruta | Descripcion |
|------|------|-------------|
| Rutas API | `routes/*.ts` | 49 modulos (boats, bookings, admin-*, auth, blog, etc.) |
| Storage/DB | `storage/*.ts` | 21 modulos de acceso a datos |
| WhatsApp chatbot | `whatsapp/` | 16 archivos (AI, functions, RAG, flows, memory, etc.) |
| Servicios | `services/` | Email, analytics, blog autopilot, lead nurturing, scheduler |
| SEO engine | `seo/` | Monitorizacion, alertas, experiments, IndexNow |
| MCP servers | `mcp/` | 8 servidores: 7 stdio (business, chatbot, content, sendgrid, twilio, seo-engine, ads-intelligence) + 1 HTTP (`seo-autopilot/` con bearer auth para clientes externos) |
| Utilidades | `lib/` | Logger, circuit breaker, retry queue, audit, occupancy calculator |

### Shared (`shared/`)
| Archivo | Contenido |
|---------|-----------|
| `schema.ts` | Schemas Drizzle de todas las tablas |
| `boatData.ts` | Datos estaticos de la flota (nombres, specs, features) |
| `pricing.ts` | Logica de precios por temporada y duracion |
| `constants.ts` | Constantes compartidas |
| `seoConstants.ts` | Idiomas soportados, hreflang codes |
| `i18n-routes.ts` | Slugs traducidos por idioma para todas las rutas |
| `routesData.ts` | Datos de rutas/excursiones maritimas |

## Archivos Importantes (referencia rapida)

| Modificacion | Archivo(s) |
|--------------|------------|
| Nueva ruta frontend | `client/src/App.tsx` + `shared/i18n-routes.ts` |
| Nuevo componente | `client/src/components/` |
| Nuevo endpoint API | `server/routes/<modulo>.ts` + registrar en `server/routes/index.ts` |
| Nuevo campo DB | `shared/schema.ts` + `npm run db:push` |
| Precios/temporadas | `shared/pricing.ts` |
| Precios dinámicos (overrides por fecha) | Tabla `pricing_overrides` + `selectApplicableOverride` en `shared/pricing.ts` + `server/storage/pricingOverrides.ts`; UI CRM `PricingTab.tsx`. Detalle: docs/arquitectura-modulos.md |
| Datos de barcos | `shared/boatData.ts` |
| SEO de pagina | `client/src/utils/seo-config.ts`. REGLA (bug Lloret 2026-06 y Maresme 2026-07): el `STATIC_META` de `server/seoInjector.ts` DEBE espejar seo-config para cada página estática; si divergen, Google ve el title viejo del SSR mientras el cliente hidrata el bueno |
| Publicar post de blog | Entrada en `server/seeds/blogSeed.ts` + `POST /api/admin/seed-blog` tras deploy (upsert por slug). OJO: `metaDescription` max 160 chars (`varchar(160)` en DB): si se pasa, el seed FALLA EN SILENCIO (created:0, error solo en logs). Alternativa sin redeploy: `POST /api/admin/blog` (login PIN + headers Origin/Referer por CSRF) |
| Stats de flota viva (conteos/floor públicos) | `server/lib/fleetStatsCache.ts` (excluye jet skis vía `isJetSkiProduct`; jamás contar filas jetski de `boats` como flota) → consumido por seoInjector `applyFleetStatsToText`, llms.txt y `/api/ai-context`. Al escribir copy nuevo server-side usar "70 EUR" como baseline: el runtime lo reescribe al floor vivo |
| Reindexación GSC automatizada | Claude-in-Chrome + `javascript_tool` (la UI de GSC nunca llega a document_idle). Propiedad `sc-domain:costabravarentaboat.com`. Técnica en memoria `geo-audit-maresme-2026-07-02`; detalle: docs/arquitectura-modulos.md |
| Slugs i18n de rutas | `shared/i18n-routes.ts` |
| Titulo/description de ficha de barco (SSR = cliente) | `shared/boatPageMeta.ts` (`buildBoatPageMeta`, precio de bloque real "desde 175 EUR / 2 h", nunca "/h" con precio de 2 h); lo consumen `seoInjector.ts` y `seo-config.ts`/`BoatDetailPage.tsx`. Test de paridad `server/boatDetailSeo.test.ts` |
| JSON-LD con precios y rating | Precios derivados de la flota viva (`getSegmentPriceRange` en `server/lib/fleetStatsCache.ts`, `priceCeilingAcrossBoats` en `shared/pricing.ts`): ningun literal 160/240/420. `aggregateRating` SOLO en el nodo LocalBusiness; nunca en Service/Product. `SEASON_YEAR` unico en `shared/constants.ts`. Test `server/seoJsonLd.test.ts` |
| Enlaces internos sin JS (bodyFallback) | `internalLinksHtml` + 5.o parametro de `buildLocationBodyFallback` en `seoInjector.ts`; todo href con `getLocalizedPath` y prefijo de idioma, nunca `/barcos`. Tossa siempre la ultima; sin enlace a categoryLicenseFree. Test `server/seoLinks.test.ts` |
| Sitemap de fichas y lastmod | `server/routes/sitemaps.ts` (4 fichas x 8 idiomas, 9 hreflang) y `shared/seoLastmod.ts`: SUBIR A MANO `BOAT_PAGES_LASTMOD` y los lastmod de landings al cambiar su contenido (la tabla `boats` no tiene `updated_at`) |
| Redirects y soft 404 | `server/seo/redirects.ts` (`retiredBoatTarget`: barcos retirados en UN salto a categoryLicensed; sin cadenas, test de ausencia de bucles) y `isValidSPARoute` + `DYNAMIC_PAGE_KEYS` (`shared/i18n-routes.ts`): `/es/barco` y `/es/<estatica>/x` dan 404. Tests `server/seoRouting.test.ts` |
| Guardian de afirmaciones prohibidas | `shared/forbiddenClaims.test.ts` (seguro "todo riesgo", PER/PNB, rango ilimitado, curso propio del titulin, excursion de 7 plazas) sobre llms*.txt post-era, CORE_FACTS, metas, i18n y seeds. Se arregla el copy, no la regla. Los grupos de bots IA de `robots.txt` repiten los `Disallow` (RFC 9309): test `server/robotsTxt.test.ts` |
| Autopilot del blog | Apagado por defecto: `publishNextDraft` exige `BLOG_AUTOPILOT_PUBLISH=1` Y `blog_autopilot_config.is_enabled`. `GET /api/blog/:slug` no sirve borradores. El prompt usa `buildBoatsInfo` (solo barcos publicables, `FLEET_MIN_LICENSE`) |
| Traducciones UI | `client/src/i18n/<idioma>.ts` |
| Carga lazy de idiomas (NO tocar a la ligera) | `client/src/i18n/loaders.ts` + `client/src/hooks/use-language.tsx` (seedInitialLanguage) + `client/src/main.tsx` (precarga el locale antes de montar React) + modulepreload por locale en `server/seoInjector.ts` |
| Rendimiento de carga (estado + reglas) | `docs/perf/2026-06-11-load-audit.md` (manualChunks, guard de prerender stale, GTM en idle, caches) |
| Service worker / PWA (config + denylist) | `vite.config.ts` (`VitePWA` workbox). REGLA: toda ruta que el SERVIDOR redirige (302/301) en vez de servir el SPA debe ir en `navigateFallbackDenylist`, si no el SW sirve el SPA y muestra su 404. Ej: enlaces vanity `/resena`,`/resenas`,`/review`,`/reviews` → Google Reviews (302 en `server/index.ts`). Detalle en `docs/perf/2026-06-11-load-audit.md` |
| Vista previa OG del enlace de reseñas | Handler `/resena` en `server/index.ts` (crawlers: OG HTML, humanos: 302) + `server/lib/reviewShareOg.ts`. Detalle: docs/arquitectura-modulos.md |
| Traducciones a11y | `client/src/lib/translations.ts` |
| Chatbot comportamiento | `server/whatsapp/aiService.ts` |
| Chatbot functions | `server/whatsapp/functionCallingService.ts` |
| Knowledge base | `server/whatsapp/seedKnowledgeBase.ts` |
| Logger estructurado | `server/lib/logger.ts` |
| Circuit breaker | `server/lib/circuitBreaker.ts` |
| Retry queue | `server/lib/retryQueue.ts` |
| Audit logs | `server/lib/audit.ts` |
| Panel admin layout | `client/src/components/crm/AdminLayout.tsx` |
| CRM tabs/componentes | `client/src/components/crm/*.tsx` |
| SEO Autopilot (MCP + admin + UI CRM) | `server/mcp/seo-autopilot/`, `server/storage/{mcpTokens,seoAutopilot}.ts`, `server/routes/admin-{mcp-tokens,seo-autopilot}.ts`, `crm/AutopilotTab.tsx`. Detalle: docs/arquitectura-modulos.md |
| Jet ski (reventa partner) | Catálogo `shared/jetskiProducts.ts` (fuente única), página `JetSkiLanding.tsx`, modal `JetSkiRequestModal.tsx`, sembrado en `boats` vía `applyBoatsSeedEnsure.ts`; excluido del wizard horario/`/api/quote`/pricing. NUNCA mostrar "partner/reventa" en superficies públicas. Detalle: docs/arquitectura-modulos.md |
| Tienda merch (colab Laura Cabanas) | Catálogo estático `shared/shopData.ts`; precio/stock/active vivos en DB (`shop_products`/`shop_variants`). Rutas `server/routes/{shop,admin-shop}.ts`, página `tienda.tsx`, webhook `metadata.type === "shop_order"` en `payments.ts`. Detalle: docs/arquitectura-modulos.md |
| Scooters (Coast Rent), página puente | `client/src/pages/scooters.tsx` + `t.scootersPage`; SEO en `seoInjector.ts` (`buildScootersStaticMeta`, bodyFallback). Dice abiertamente "operado por Coast Rent". Detalle: docs/arquitectura-modulos.md |
| Enlaces a Coast Rent (misma propiedad) | `shared/coastrentLinks.ts`: lista CERRADA de destinos (`COASTRENT_PATHS`) + `coastrentUrl(key, lang, surface)` con UTM. NUNCA armar URLs a coastrent.es a mano. `CARABELA`/`carabelaOpen()` gatean el copy de la oficina de Lloret (en Lloret NO hay barcos: se sale de Blanes). Detalle: docs/arquitectura-modulos.md |
| Cobro de señal del CRM DAMAR (Stripe) | `server/lib/crmSenal.ts` escribe DIRECTO en `rentals_real` del CRM (`paga_senal`, `paga_senal_method`, `estado_reserva`, `senal_pagada_at`: NO renombrarlas allí sin tocar esto). `POST /api/crm/senal-link` (auth `x-api-key` = `CRM_API_KEY`) + webhook `crm_senal`. Detalle: docs/arquitectura-modulos.md |

## Patrones Comunes

### Crear nuevo endpoint API
```typescript
// 1. Crear o editar server/routes/<modulo>.ts
import { requireAdminSession } from "./auth-middleware";

export function registerMyRoutes(app: Express, storage: IStorage) {
  // Endpoint publico
  app.get("/api/mi-endpoint", async (req, res) => {
    try {
      const data = await storage.getData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error: " + (error instanceof Error ? error.message : "unknown") });
    }
  });

  // Endpoint admin (requiere sesion)
  app.get("/api/admin/mi-endpoint", requireAdminSession, async (req, res) => {
    // ...
  });
}

// 2. Registrar en server/routes/index.ts:
//    import { registerMyRoutes } from "./mi-modulo";
//    registerMyRoutes(app, storage);
```

### Crear nuevo componente
```typescript
// client/src/components/MiComponente.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

export function MiComponente() {
  const { language } = useLanguage();
  // ...
}
```

### Anadir campo a tabla existente
```typescript
// 1. Modificar shared/schema.ts
export const miTabla = pgTable("mi_tabla", {
  // campos existentes...
  nuevoCampo: text("nuevo_campo"),
});

// 2. Ejecutar: npm run db:push
```

### Query con Drizzle
```typescript
// SELECT con filtros
const results = await db
  .select()
  .from(bookings)
  .where(
    and(
      eq(bookings.boatId, boatId),
      gte(bookings.startTime, startDate)
    )
  );

// INSERT
const [newRecord] = await db
  .insert(bookings)
  .values(bookingData)
  .returning();

// UPDATE
const [updated] = await db
  .update(bookings)
  .set({ status: "confirmed" })
  .where(eq(bookings.id, id))
  .returning();
```

### Anadir traduccion a un nuevo idioma
```typescript
// 1. Archivo de traducciones: client/src/i18n/<idioma>.ts
// 2. SEO config: client/src/utils/seo-config.ts
// 3. Hreflang: shared/seoConstants.ts (HREFLANG_CODES)
// 4. Slugs de rutas: shared/i18n-routes.ts
// 5. Sitemaps: server/routes/sitemaps.ts
```

## Traducciones i18n (sincronización viva)

Fuente de verdad: `client/src/i18n/es.ts`. Los otros 7 idiomas (en, ca, fr, de, nl, it, ru) deben reflejarla al 100%.

**Flujo cuando añades o cambias una clave en `es.ts`:**
1. Edita `es.ts` con el nuevo texto.
2. Ejecuta `npm run i18n:translate` — Claude traduce automáticamente las claves faltantes a los 7 idiomas.
3. Ejecuta `npm run i18n:validate` para confirmar 0 diferencias.
4. Revisa los diffs en los archivos `<lang>.ts` y ajusta si alguna traducción suena rara (revisión humana opcional).
5. Commit + push.

`npm run check:all` incluye `i18n:validate` — CI falla si algún idioma queda desincronizado. Requiere `ANTHROPIC_API_KEY` en `.env`.

**Regla**: nunca añadir texto visible al usuario directamente en JSX/JSON-LD; siempre meterlo primero en `es.ts` y luego ejecutar `i18n:translate`.

**LIMITACIÓN (descubierta 2026-07-02)**: `i18n:translate` solo detecta claves hoja NUEVAS; los items añadidos a un array existente (p.ej. `faqItems`) NO se detectan y `i18n:validate` tampoco compara longitudes de arrays: pasa en verde con los idiomas desincronizados. Al añadir items a un array, tradúcelos a mano en los 7 locales en el mismo commit y verifica contando `question:` (o equivalente) por idioma.

### Deuda i18n pendiente

Quedan textos en español hardcoded en `faq.tsx` (AccordionItem del body), en las props `title`/`description` de `<PopularBoatsSection>` de las páginas de ubicación y en el `FALLBACK_ITEMS` de `FAQPreview.tsx`. Al tocar cualquiera, migra el texto a `es.ts` + `npm run i18n:translate` en el mismo commit. Lista completa y qué está ya migrado: docs/pendiente-i18n.md.

## Cosas a Evitar

- NO crear archivos `.md` nuevos sin que el usuario lo pida
- NO anadir emojis al codigo o UI
- NO usar `console.log` en produccion -- usar `logger` de `server/lib/logger.ts`
- NO commitear cambios sin que el usuario lo solicite
- NO modificar `package.json` sin explicar por que
- NO usar `any` en TypeScript
- NO sugerir Stripe como solucion de pago -- la web captura solicitudes de reserva, el pago es manual
- NO inventar variantes de la politica de cancelacion (ver "Hechos canonicos" abajo). Texto unico para toda la flota desde 2026-05-26
- NO citar capacidades/eslora/motor sin leer `shared/boatData.ts` primero. Astec 400 es 4 pax, Pacific Craft 625 es 7 pax, Excursion Privada es 6 pax. CATALOGO = 9 barcos en boatData; FLOTA VIVA = filas con `is_active` en DB (el owner desactivo el Astec 400 via CRM el 2026-05-29: hoy 8 vivos = 4 sin licencia + 3 con licencia + 1 excursion). El copy publico sigue la flota viva (8 / 4 / desde 75 EUR/h); si el owner reactiva el Astec, hay que revertir ese copy (grep "8 embarcaciones|4 barcos|75")
- NO reintroducir resenas/testimonios fabricados en ninguna superficie ni JSON-LD. El dataset sintetico de ~2.370 resenas por barco se elimino el 2026-06-11 por decision del owner; la unica prueba social valida es la de Google Business Profile (`/api/business-stats` + `shared/businessProfile.ts`, perfil enlazado via `GBP_PROFILE_URL`)
- NO importar bundles i18n estaticamente en codigo cliente (`import { es } from ...` prohibido): desde 2026-06-11 TODOS los locales son chunks lazy via `client/src/i18n/loaders.ts`; `main.tsx` precarga el del idioma activo antes de montar React y el fallback castellano se registra con `registerEsFallback`
- NO usar em dashes en copy visible de UI/i18n (regla del design system): coma, dos puntos, punto y coma o parentesis
- Tests con Vitest: `npm test` para correr, archivos `*.test.ts` junto al codigo que testean

## Hechos canonicos (fuentes de verdad)

Cuando un hecho aparece en varias capas (i18n, SEO, blog, JSX, emails, KB chatbot, schema.org, legales), respeta la fuente unica. Drift previo se cerro el 2026-05-27 (ver `docs/audits/2026-05-27-drift-sweep.md`).

| Dominio | Fuente de verdad |
|---|---|
| Catalogo flota (nombre, capacidad, eslora, motor, fianza, modelo) | `shared/boatData.ts` |
| Precios por temporada/duracion | `shared/pricing.ts` |
| Overrides dinamicos de precio | tabla `pricing_overrides` + `selectApplicableOverride()` en `shared/pricing.ts` |
| Reglas licencia nautica (thresholds eslora/CV, distancias legales) | `shared/nauticalLicenseRules.ts` + `shared/nauticalGlossary.ts` |
| Verificador de licencia extranjera (catalogo de paises + equivalencias ES) | `shared/nauticalLicenseRules.ts`: `COUNTRY_LICENSES` (11 paises curados: ES, FR, IT, DE, GB, PT, NL, BE, PL, AT, HR), `verifyLicense()`, `FLEET_MIN_LICENSE`. REGLA: solo equivalencias respaldadas, no inventar (RD 875/2014). Ciudadano EEE no curado + "Otra" -> `probably_valid` por reciprocidad EEE (Orden FOM/3200/2007 disp. final 3.a), nunca `not_recognized`. UI: `client/src/components/booking/LicenseVerifierPanel.tsx` (usa solo `status`, no `reasonKey`). Doc: `docs/features/2026-05-21-license-verifier.md`. Tests: `shared/nauticalLicenseRules.test.ts` |
| Rating + review count (Google Business Profile) | `shared/businessProfile.ts` -- usa `BUSINESS_RATING_STR` y `BUSINESS_REVIEW_COUNT_STR` en template literals; los displays de rating enlazan al perfil con `GBP_PROFILE_URL` |
| Gasolina incluida / barco con patron | `boatIncludesFuel()` / `isCaptainedBoat()` en `shared/boatData.ts` -- NUNCA derivar de `!requiresLicense` ni de regex sobre features (la excursion privada tiene requiresLicense=false y NO incluye gasolina) |
| Alcance del seguro (que se puede prometer) | `INSURANCE_SCOPE_ES` + `INSURANCE_SEATS_LIMIT_ES` en `shared/businessProfile.ts`. Cada casco lleva RC obligatoria (RD 607/1999) + RC voluntaria por los danos a TERCEROS, y "Accidentes Personales Ocupantes" que paga sin discutir responsabilidad; cuatro cascos llevan ademas el Seguro Obligatorio de Viajeros de FIATC. REGLAS: se puede decir "cobertura de accidentes para los ocupantes"; NO citar el SOV como universal (solo 4 de 7 cascos), NO poner capitales concretos (12.000 en Allianz vs 36.060 en FIATC, y se renuevan), NUNCA "todo riesgo". Mencionar siempre el limite de plazas: la poliza declara los ocupantes casco por casco y uno de mas deja la salida sin cobertura. El art. 61.2 TRLGDCU hace exigible lo publicado, asi que una cifra vieja es una promesa que paga la empresa |
| Flota viva (que barcos se venden hoy) | columna `is_active` de la tabla `boats` (se gestiona desde el CRM); el catalogo completo vive en `shared/boatData.ts` y `applyBoatsSeedEnsure` re-siembra filas BORRADAS pero jamas reactiva desactivadas |
| Texto legal (condiciones de alquiler) | `client/src/components/CondicionesGenerales.tsx` |
| Politica de cancelacion (texto unico multi-idioma) | `client/src/i18n/es.ts` -> propaga via `npm run i18n:translate` |
| Datos de scooters Coast Rent (precios, vehiculos, condiciones) | Web en vivo `coastrent.es` (negocio externo) -> reflejado en `t.scootersPage`. Verificar contra su web antes de tocar; NO inventar precios por modelo |

Politica de cancelacion: si la EMPRESA suspende por mal tiempo, el cliente elige SIEMPRE entre nueva fecha, bono de 12 meses o devolucion integra, con o sin garantia. La Garantia de mal tiempo cubre otra cosa (cancela el CLIENTE con devolucion integra menos la garantia si la prevision AEMET de la vispera da aviso costero o >=15 nudos). Texto canonico: `CANCELLATION_POLICY_ES` y `CANCELLATION_TERMS_BULLETS_ES` en `shared/businessProfile.ts` (cualquier surface nueva los referencia, no copia); desarrollo en `t.garantiasPage` y clausula 7 de `t.legalPages.terms`. Criterio de suspension = aviso costero AEMET en la franja del alquiler, viento sostenido o rachas >20 nudos, o decision del personal (`garantiasPage.criteria`); no se mezcla con el umbral de la garantia. NUNCA volver a "sin garantia solo bono, no se devuelve en dinero" (clausula abusiva). La Garantia de mal tiempo y la Fianza reducida son garantias comerciales, NUNCA un seguro, en ningun idioma. Historia: docs/bitacora.md.

Retraso en la devolucion: tarifa horaria vigente del barco +50 % por cada fraccion de 30 minutos (barcos sin precio de 1 h: la mitad del de 2 h). Nunca un importe fijo desproporcionado.

Distancia de navegacion sin licencia: hay DOS limites y son ejes distintos, no se contradicen.

- **Limite legal, mar adentro: 2 millas nauticas (3,7 km)** -- RD 875/2014 art. 6.2. Es lo que se cita en copy comercial, FAQ, blog y `aiCitationFacts.ts` cuando se explica que permite la ley.
- **Limite propio mar adentro**: barcos SIN licencia (contrato SL, era historica): 1 milla (1,8 km). Barcos CON licencia (contrato CL): **2 millas** (decision del dueno 2026-11-06). Es lo que debe aparecer en `CondicionesGenerales.tsx`, que es el espejo del contrato.
- **Limite a lo largo de la costa: del rio Tordera (sur) al final de la playa de Fenals (norte)**. Es otro eje: los argumentos de tipo "Tossa queda fuera de las 2 millas" hablan de alcance costero, no de distancia mar adentro, y por eso NO hay que convertirlos a 1 milla.

Antes de tocar cualquiera de las tres cifras, lee el PDF del contrato: la web es su espejo, no al reves.

**RD 1188/2025 (BOE 30-dic-2025): fin del alquiler sin titulacion.** Desde el **1-oct-2026** el arrendatario de cualquier embarcacion a motor debe tener titulo nautico (la exencion 5m/15CV queda restringida al uso privado). Reglas para copy nuevo:

- Cualquier texto que prometa "alquiler sin licencia" lleva marco temporal o el framing "titulin en 1 dia". El copy dual (titulacion primero + oferta sin licencia datada) se gobierna con `isLicenseFreeEraActive()` de `shared/constants.ts` (`LICENSE_FREE_LAST_DAY = "2026-09-30"`, Europe/Madrid), no con un feature flag; lo consumen `Hero.tsx` y `LicenseComparisonSection.tsx`.
- "Con el titulin llevas la flota" cubre los tres barcos con licencia. La eslora de matriculacion del Pacific Craft 625 son 5,90 m (el "625" es nombre comercial): **nunca infieras una eslora del nombre del modelo**. Guarda: `shared/gemela.test.ts`.
- Pagina pilar `/es/licencia-navegacion-titulin` (clave i18n `navigationLicensePage`), post `fin-alquiler-barcos-sin-licencia-2026`, FAQ `normativa2026`/`titulin`, facts `license-free-rental-end-date`/`navigation-license-course`.

⚠️ **El 1-oct-2026 hay que REDESPLEGAR aunque no cambie ni una linea de codigo** para que el copy datado se regenere.

**Escuela nautica hermana (`escolanauticablanes`)**: esta web rankea y parte va a los crawlers de IA por `/api/ai-context`, asi que lo que diga de la escuela se publica con autoridad que ella aun no tiene. Reglas: (1) nada en PRESENTE (futuro: "Impartira" / "Will teach", con el estado delante); (2) ninguna FECHA DE APERTURA; (3) ningun precio que la escuela no publique (ni curso ni reconocimiento psicofisico). Guardianes: `shared/escolaNauticaLinks.test.ts` (incluye `robots.ts`) y `shared/gemela.test.ts` (lee los ficheros de la hermana del disco; se salta si no estan). Historia y detalle: docs/bitacora.md.

⚠️ **El deploy NO arregla el contenido YA PUBLICADO: vive en la BD.** Las fichas salen de `/api/boats` (tabla `boats`) y los posts de `blog_posts`; `applyBoatsSeedEnsure` es `ON CONFLICT DO NOTHING` y nunca pisa filas existentes. Corregir `boatData.ts` o `blogSeed.ts` cambia lo que se sembrara, no lo sembrado (la descripcion se salva por el i18n `t.boatDescriptions`; la **eslora no**). Detalle: docs/bitacora.md.

## Prerender: NO corre en produccion, y es a proposito

Coolify usa `npm run build`, que borra `dist/prerendered`: produccion sirve siempre el shell SSR de `seoInjector` con su `bodyFallback`. **No lo "arregles" cambiando el build command a `build:deploy`**: el prerender necesita `DATABASE_URL`, `JWT_SECRET` y `ADMIN_PIN` en build (0 variables build-time en Coolify) y obligaria a exponer Neon PROD en la imagen.

**Consecuencia practica:** el `bodyFallback` de `resolveMeta` NO es una red de seguridad, es **lo unico que ven los crawlers sin JS** (GPTBot, ClaudeBot, PerplexityBot, bots sociales). Al tocar el copy de una pagina, el bodyFallback importa tanto como el JSX: si un enlace o un hecho solo existe tras hidratar, para esos bots no existe. Detalle: docs/bitacora.md.

## Flujo de Trabajo Recomendado

1. **Antes de modificar**: Leer el archivo completo con `Read`
2. **Cambios pequenos**: Usar `Edit` con old_string/new_string
3. **Archivos nuevos**: Usar `Write`
4. **Verificar sintaxis**: `npm run check` (tsc tarda 2+ min en este proyecto)
5. **Tests**: `npm test`
6. **Lint**: `npm run lint`
7. **Format**: `npm run format:check`
8. **Todo junto**: `npm run check:all`
9. **Probar**: `npm run dev`

## Informacion de Negocio

- **Temporada**: Abril - Octubre (fuera de temporada no se aceptan reservas)
- **Horario operativo**: 09:00 - 20:00 (Madrid time) -- 11h de ventana diaria
- **Ubicacion**: Puerto de Blanes, Girona, Espana
- **Telefono**: +34 611 500 372
- **Email**: costabravarentaboat@gmail.com
- **PIN Admin CRM**: variable de entorno `ADMIN_PIN`
- **JWT Secret**: variable de entorno `JWT_SECRET` (min 32 caracteres)
- **Modelo**: Sin pagos online -- la web captura solicitudes de reserva, el pago se gestiona manualmente
- **Flota**: catalogo de 9 barcos en `shared/boatData.ts`; flota VIVA = `is_active` en DB (2026-06: 8 activos, Astec 400 desactivado por el owner). Copy publico alineado a la flota viva
- **Combustible**: Solo barcos sin-licencia incluyen gasolina; barcos con licencia y excursion privada NO
- **Analytics**: GA4 server-side (Measurement Protocol) instrumentado para `generate_lead` (inquiries) y `booking_request_submitted` (solo lo emite `POST /api/bookings/submit-request`, que el navegador ya no llama: el flujo real es `BookingFormWidget` a `/api/booking-inquiries`, que emite `generate_lead`; NO añadir el evento en inquiries, `admin-ads.ts` lo contaría doble) -- requiere `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` en env. Helper: `server/lib/analyticsServer.ts`

## Preguntas Frecuentes del Desarrollo

**Como anadir un nuevo barco?**
1. Anadir datos en `shared/boatData.ts`
2. Insertar en DB via CRM o `POST /api/admin/boats`

**Como cambiar precios?**
1. Modificar `pricing` en `shared/boatData.ts`
2. Actualizar barco en DB

**Como anadir nuevo idioma SEO?**
1. Anadir traducciones en `client/src/i18n/<idioma>.ts`
2. Anadir SEO config en `client/src/utils/seo-config.ts`
3. Anadir hreflang en `shared/seoConstants.ts`
4. Anadir slugs de rutas en `shared/i18n-routes.ts`
5. Actualizar sitemaps en `server/routes/sitemaps.ts`

**Como modificar el chatbot?**
1. Comportamiento IA: `server/whatsapp/aiService.ts`
2. Functions: `server/whatsapp/functionCallingService.ts`
3. Knowledge base: `server/whatsapp/seedKnowledgeBase.ts`
4. Flujos de conversacion: `server/whatsapp/flows/`
5. Deteccion de idioma: `server/whatsapp/languageDetector.ts`
6. Memoria de chat: `server/whatsapp/chatMemoryService.ts`

**Como anadir una nueva pagina publica?**
1. Crear pagina en `client/src/pages/<nombre>.tsx`
2. Anadir ruta en `client/src/App.tsx`
3. Anadir slugs i18n en `shared/i18n-routes.ts`
4. Anadir SEO config en `client/src/utils/seo-config.ts`

**Como modificar el panel admin CRM?**
1. Layout y navegacion: `client/src/components/crm/AdminLayout.tsx`
2. Tabs: `client/src/components/crm/<NombreTab>.tsx`
3. Tipos y schemas: `client/src/components/crm/types.ts`
4. Constantes (colores, labels): `client/src/components/crm/constants.ts`
5. Componentes compartidos: `client/src/components/crm/shared/`
