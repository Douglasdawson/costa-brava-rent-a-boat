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
| Paginas publicas | `pages/*.tsx` | 37 paginas (10 locations, 4 activities, 2 categories, blog, FAQ, about, etc.) |
| Componentes | `components/*.tsx` | Componentes publicos (Hero, Fleet, Booking, Navigation, etc.) |
| Booking flow | `components/booking-flow/` | Wizard de reserva split en 8 steps |
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
| Datos de barcos | `shared/boatData.ts` |
| SEO de pagina | `client/src/utils/seo-config.ts` |
| Slugs i18n de rutas | `shared/i18n-routes.ts` |
| Traducciones UI | `client/src/i18n/<idioma>.ts` |
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
| `client/src/pages/location-tordera.tsx` | Hero, "Por qué Blanes desde Tordera", attractions, "Cómo llegar", precios block, FAQ rich body | Medio (~45min) |
| `client/src/pages/location-palafolls.tsx` | Ídem tordera — misma plantilla, contenido específico de Palafolls | Medio (~45min) |
| `client/src/pages/location-pineda-de-mar.tsx` | Ídem tordera — misma plantilla, contenido específico de Pineda de Mar | Medio (~45min) |
| `client/src/components/FAQPreview.tsx` | `FALLBACK_ITEMS` (8 Q&A — ya hay `t.faqPreview?.items` como override que cubre los 8 idiomas; el fallback solo se mostraría si algún idioma perdiera los items) | Pequeño (safety-net, baja prioridad) |

**Ya migrados (100 % vivos):**
- `pricing.tsx` → `t.pricingPage` (54 claves)
- `category-licensed.tsx` → `t.categoryLicensed`
- `faq.tsx` JSON-LD schema + hero + categorías → `t.faqPage` (92 claves)
- `location-barcelona.tsx` → `t.locationBarcelona` (41 claves)
- `location-tossa-de-mar.tsx` warning + cross-links + related → `t.locationPages.tossa.sections` (9 claves nuevas)
- `location-lloret-de-mar.tsx` cross-links + related → `t.locationPages.lloret.sections` (6 claves nuevas)
- `location-malgrat-de-mar.tsx` / `santa-susanna.tsx` / `calella.tsx` → FAQ placeholders procesados por `LocationTemplate`

Cuando añadas texto nuevo a cualquiera de los archivos pendientes, **aprovecha para migrarlo al sistema i18n** en el mismo commit.

## Cosas a Evitar

- NO crear archivos `.md` nuevos sin que el usuario lo pida
- NO anadir emojis al codigo o UI
- NO usar `console.log` en produccion -- usar `logger` de `server/lib/logger.ts`
- NO commitear cambios sin que el usuario lo solicite
- NO modificar `package.json` sin explicar por que
- NO usar `any` en TypeScript
- NO sugerir Stripe como solucion de pago -- la web captura solicitudes de reserva, el pago es manual
- Tests con Vitest: `npm test` para correr, archivos `*.test.ts` junto al codigo que testean

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
- **Ubicacion**: Puerto de Blanes, Girona, Espana
- **Telefono**: +34 611 500 372
- **Email**: costabravarentaboat@gmail.com
- **PIN Admin CRM**: variable de entorno `ADMIN_PIN`
- **JWT Secret**: variable de entorno `JWT_SECRET` (min 32 caracteres)
- **Modelo**: Sin pagos online -- la web captura solicitudes de reserva, el pago se gestiona manualmente
- **Combustible**: Solo barcos sin-licencia incluyen gasolina; barcos con licencia y excursion privada NO

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
