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
| Booking flow (modal del Hero) | `BookingFormWidget.tsx` → `BookingWizardMobile.tsx` / `BookingFormDesktop.tsx` | Wizard de 4 steps (barco / viaje / datos / confirmar). Lazy-loaded via `useBookingModal`. Es lo que abre el CTA del Hero. |
| Booking flow (ruta separada) | `components/booking-flow/` | Wizard de 3 steps (`Tu plan` / `Tus datos` / `Confirmar`) montado en `App.tsx` como ruta. NO es el del Hero. |
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
| Precios dinámicos (overrides por fecha) | Tabla `pricing_overrides` (`shared/schema.ts`) + lógica en `shared/pricing.ts` (`selectApplicableOverride`) + storage `server/storage/pricingOverrides.ts` + admin API `server/routes/admin-pricing-overrides.ts` + endpoint público `server/routes/pricing.ts` (`/api/pricing/calendar`) + UI CRM `client/src/components/crm/PricingTab.tsx` (tab "Precios") |
| Datos de barcos | `shared/boatData.ts` |
| SEO de pagina | `client/src/utils/seo-config.ts` |
| Slugs i18n de rutas | `shared/i18n-routes.ts` |
| Traducciones UI | `client/src/i18n/<idioma>.ts` |
| Carga lazy de idiomas (NO tocar a la ligera) | `client/src/i18n/loaders.ts` + `client/src/hooks/use-language.tsx` (seedInitialLanguage) + `client/src/main.tsx` (precarga el locale antes de montar React) + modulepreload por locale en `server/seoInjector.ts` |
| Rendimiento de carga (estado + reglas) | `docs/perf/2026-06-11-load-audit.md` (manualChunks, guard de prerender stale, GTM en idle, caches) |
| Service worker / PWA (config + denylist) | `vite.config.ts` (`VitePWA` workbox). REGLA: toda ruta que el SERVIDOR redirige (302/301) en vez de servir el SPA debe ir en `navigateFallbackDenylist`, si no el SW sirve el SPA y muestra su 404. Ej: enlaces vanity `/resena`,`/resenas`,`/review`,`/reviews` → Google Reviews (302 en `server/index.ts`). Detalle en `docs/perf/2026-06-11-load-audit.md` |
| Vista previa OG del enlace de reseñas | `server/index.ts` (handler `/resena`: a crawlers via `isCrawler` sirve OG HTML, a humanos 302) + `server/lib/reviewShareOg.ts` (`buildReviewShareHtml`/`buildReviewShareUrl`/`reviewShareLangForPhone`, binario es/en por prefijo +34). El CRM mete el link `/resena?l=es\|en` en el mensaje WhatsApp via `reviewUrl` de `renderThankYouWhatsApp` (`server/services/whatsappTemplates.ts`), llamado desde `admin-flywheel.ts` y `schedulerService.ts`. Imagen `client/public/og-image.webp` |
| Traducciones a11y | `client/src/lib/translations.ts` |
| Chatbot comportamiento | `server/whatsapp/aiService.ts` |
| Chatbot functions | `server/whatsapp/functionCallingService.ts` |
| Knowledge base | `server/whatsapp/seedKnowledgeBase.ts` |
| Logger estructurado | `server/lib/logger.ts` |
| Circuit breaker | `server/lib/circuitBreaker.ts` |
| Retry queue | `server/lib/retryQueue.ts` |
| Audit logs | `server/lib/audit.ts` |
| Booking flow (wizard) | `client/src/components/booking-flow/` |
| Panel admin layout | `client/src/components/crm/AdminLayout.tsx` |
| CRM tabs/componentes | `client/src/components/crm/*.tsx` |
| SEO Autopilot MCP server | `server/mcp/seo-autopilot/{index,router,tools}.ts` (montado en `/api/mcp/seo-autopilot`) |
| SEO Autopilot storage | `server/storage/{mcpTokens,seoAutopilot}.ts` |
| SEO Autopilot admin API | `server/routes/admin-{mcp-tokens,seo-autopilot}.ts` |
| SEO Autopilot UI (CRM tab) | `client/src/components/crm/AutopilotTab.tsx` |
| Jet ski (reventa partner) — catálogo | `shared/jetskiProducts.ts` (fuente única: 2 productos Circuito + Excursión, franjas/precios, helpers). NUNCA mostrar "partner/reventa" en superficies públicas |
| Jet ski — flota + petición | Sembrado en `boats` vía `server/migrations/applyBoatsSeedEnsure.ts`; modal `client/src/components/JetSkiRequestModal.tsx` (WhatsApp prerrellenado + `/api/booking-inquiries` + `/api/jetski-booking` estado `requested`). Excluido del wizard horario/`/api/quote`/pricing |
| Jet ski — páginas dedicadas | `client/src/components/JetSkiLanding.tsx` + `client/src/pages/jet-ski-{circuito,excursion}.tsx`; rutas `jetskiCircuito`/`jetskiExcursion` en `shared/i18n-routes.ts`; i18n bloque `jetskiLanding` (8 idiomas) |
| Jet ski — SEO/GEO | `server/seoInjector.ts` (STATIC_META+resolveMeta SSR), `server/routes/robots.ts` + `server/services/aiSearchIndex.ts` (ai-context/feed-llms/ai-search), `client/public/llms*.txt`, `translatedStaticPaths.ts`+`sitemaps.ts` |
| Tienda merch (colab Laura Cabanas) | Catálogo estático `shared/shopData.ts` (SKUs, colores, tallas, imágenes); precio/stock/active vivos en DB (`shop_products`/`shop_variants`, seed `server/migrations/applyShopSeedEnsure.ts`). Rutas públicas `server/routes/shop.ts` (catalog + checkout Stripe hosted + order-status con fallback si el webhook no llega), admin `server/routes/admin-shop.ts`, storage `server/storage/shop.ts`, strings server-side (Stripe+emails) `server/lib/shopStrings.ts`. Webhook: branch `metadata.type === "shop_order"` en `payments.ts`. Página `client/src/pages/tienda.tsx` + carrito `useShopCart` (localStorage) + CRM `crm/ShopTab.tsx` (tab "shop"). i18n bloque `shopPage` (8 idiomas). Entrega: recogida puerto (0 EUR) o envío España (`SHOP_SHIPPING_FLAT_CENTS`, default 495) |
| Scooters (Coast Rent) — página puente | `client/src/pages/scooters.tsx` (ruta `scooters` en `shared/i18n-routes.ts`, copy `t.scootersPage` 8 idiomas, CTA dofollow a `coastrent.es/{lang}`). SEO: `buildScootersStaticMeta` en `seoInjector.ts` + `translatedStaticPaths.ts` + `sitemaps.ts` + `llms*.txt`. A diferencia del jet ski, la página dice abiertamente "operado por Coast Rent" (empresa de Lloret recomendada, mismo entorno de propietarios) |

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

### Deuda i18n pendiente

Los siguientes archivos **todavía tienen texto visible en español hardcoded** en JSX que no se propaga al cambiar a otros idiomas. Migrar a `es.ts` + `npm run i18n:translate` cuando se toquen:

| Archivo | Qué mover | Tamaño |
|---------|-----------|--------|
| `client/src/pages/faq.tsx` | Los `AccordionItem` del body (contenido narrativo rico con listas, CTAs, botones, notas internas). El JSON-LD schema YA está en i18n vía `t.faqPage.items`; los Accordion siguen hardcoded pero Google solo lee el schema. | Grande (~3h) |
| Páginas de ubicación (todas) — props `title`/`description` de `<PopularBoatsSection>` | Cross-cutting: el heading + intro de la sección "Barcos populares" se pasan como literales en español en `location-tordera/palafolls/pineda/barcelona/tossa/lloret.tsx`. El componente espera strings ya localizados; hay que crear claves i18n por página y pasarlas. | Pequeño (~30min total) |
| `client/src/components/FAQPreview.tsx` | `FALLBACK_ITEMS` (8 Q&A — ya hay `t.faqPreview?.items` como override que cubre los 8 idiomas; el fallback solo se mostraría si algún idioma perdiera los items) | Pequeño (safety-net, baja prioridad) |

**Ya migrados (100 % vivos):**
- `pricing.tsx` → `t.pricingPage` (54 claves)
- `category-licensed.tsx` → `t.categoryLicensed`
- `faq.tsx` JSON-LD schema + hero + categorías → `t.faqPage` (92 claves)
- `location-barcelona.tsx` → `t.locationBarcelona` (41 claves)
- `location-tossa-de-mar.tsx` warning + cross-links + related → `t.locationPages.tossa.sections` (9 claves nuevas)
- `location-lloret-de-mar.tsx` cross-links + related → `t.locationPages.lloret.sections` (6 claves nuevas)
- `location-malgrat-de-mar.tsx` / `santa-susanna.tsx` / `calella.tsx` → FAQ placeholders procesados por `LocationTemplate`
- `location-tordera.tsx` / `location-palafolls.tsx` / `location-pineda-de-mar.tsx` → cuerpo completo vía `t.locationPages.<town>.sections` + `faqItems` (i18n-complete en los 8 idiomas, confirmado 2026-05-29; ver `server/seo/translatedStaticPaths.ts`). Pendiente solo las props de `PopularBoatsSection` (arriba)

Cuando añadas texto nuevo a cualquiera de los archivos pendientes, **aprovecha para migrarlo al sistema i18n** en el mismo commit.

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
| Rating + review count (Google Business Profile) | `shared/businessProfile.ts` -- usa `BUSINESS_RATING_STR` y `BUSINESS_REVIEW_COUNT_STR` en template literals; los displays de rating enlazan al perfil con `GBP_PROFILE_URL` |
| Gasolina incluida / barco con patron | `boatIncludesFuel()` / `isCaptainedBoat()` en `shared/boatData.ts` -- NUNCA derivar de `!requiresLicense` ni de regex sobre features (la excursion privada tiene requiresLicense=false y NO incluye gasolina) |
| Flota viva (que barcos se venden hoy) | columna `is_active` de la tabla `boats` (se gestiona desde el CRM); el catalogo completo vive en `shared/boatData.ts` y `applyBoatsSeedEnsure` re-siembra filas BORRADAS pero jamas reactiva desactivadas |
| Texto legal (condiciones de alquiler) | `client/src/components/CondicionesGenerales.tsx` |
| Politica de cancelacion (texto unico multi-idioma) | `client/src/i18n/es.ts` -> propaga via `npm run i18n:translate` |
| Datos de scooters Coast Rent (precios, vehiculos, condiciones) | Web en vivo `coastrent.es` (negocio externo) -> reflejado en `t.scootersPage`. Verificar contra su web antes de tocar; NO inventar precios por modelo |

Politica de cancelacion (texto literal a usar en cualquier surface nueva):
> Cambio de fecha gratuito hasta 7 dias antes de la salida (sujeto a disponibilidad). Mal tiempo: reprogramamos sin coste o devolvemos el deposito integro. Las reservas confirmadas con deposito no son reembolsables fuera del supuesto de mal tiempo.

Distancia maxima de navegacion sin licencia: **2 millas nauticas (3,7 km)** -- RD 875/2014 art. 6.2. No reintroducir "1 milla".

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
- **Analytics**: GA4 server-side (Measurement Protocol) instrumentado para `generate_lead` (inquiries) y `booking_request_submitted` (bookings) -- requiere `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` en env. Helper: `server/lib/analyticsServer.ts`

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
