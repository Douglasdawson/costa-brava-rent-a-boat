# Costa Brava Rent a Boat - Estado Actual del Proyecto

Actualizado: 11 Marzo 2026

---

## Estado General

| Aspecto | Estado |
|---------|--------|
| Producto (CBRB) | En produccion |
| Transformacion SaaS | Completada (multi-tenant funcional) |
| Branch | main |
| Despliegue | Replit (produccion) |
| URL produccion | https://costabravarentaboat.com |
| TypeScript | 0 errores (`tsc --noEmit` limpio) |

---

## Base de Datos

### Tablas Totales: 36

**SaaS / Auth:**
- `tenants` - Empresas registradas (plan, status, branding, settings)
- `users` - Usuarios SaaS con roles (owner/admin/employee) por tenant
- `refresh_tokens` - Tokens de refresco con rotation y cleanup
- `password_reset_tokens` - Tokens de reset de contrasena (1h expiry)
- `admin_sessions` - Sesiones de admin
- `token_blacklist` - Tokens revocados

**Core del negocio (22 tablas):**
boats, bookings, customers, crm_customers, booking_extras, admin_users, customer_users, blog_posts, blog_clusters, blog_autopilot_config, blog_autopilot_log, blog_autopilot_queue, testimonials, discount_codes, gift_cards, knowledge_base, chatbot_conversations, ai_chat_sessions, ai_chat_messages, checkins, page_visits, whatsapp_inquiries

**Operaciones:**
maintenance_logs, boat_documents, inventory_items, inventory_movements, client_photos, newsletter_subscribers

**Global/Legacy:**
sessions, destinations

---

## Autenticacion

### Sistema Actual

**Admin CRM:**
- PIN fijo via variable de entorno ADMIN_PIN
- Login en `/api/admin/login`
- Sesion basada en admin_sessions

**SaaS (disponible pero secundario):**
- Email/password con JWT (1h access + 30d refresh)
- Registro con creacion automatica de tenant
- Token rotation en refresh
- Reset de password con token criptografico

---

## Frontend

### Paginas: 22

LoginPage, OnboardingPage, ClientDashboardPage, CancelBookingPage, blog, blog-detail, faq, gallery, gift-cards, routes, testimonios, location-blanes, location-lloret-de-mar, location-tossa-de-mar, category-license-free, category-licensed, destination-detail, privacy-policy, terms-conditions, cookies-policy, accessibility-declaration, not-found

### Componentes: ~86 custom + 46 shadcn/ui

### CRM Sub-componentes: 29 (en `components/crm/`)

### Hooks personalizados: 11

---

## Backend

### Rutas: 33 modulos en `server/routes/`

El archivo `server/routes.ts` original (2061 lineas) fue dividido completamente en modulos independientes:
admin.ts, admin-bookings.ts, admin-customers.ts, admin-fleet.ts, admin-marketing.ts, admin-operations.ts, admin-stats.ts, auth.ts, auth-legacy.ts, auth-middleware.ts, auth-saas.ts, auto-discounts.ts, availability.ts, blog.ts, boats.ts, bookings.ts, destinations.ts, discounts.ts, employees.ts, gallery.ts, giftcards.ts, health.ts, imageResize.ts, inquiries.ts, metaWebhook.ts, newsletter.ts, payments.ts, sitemaps.ts, superadmin.ts, tenant.ts, testimonials.ts, whatsapp.ts

### MCP Servers: 5 custom + 3 externos

Servidores custom en `server/mcp/`:
- `business-server.ts` - CRM/booking
- `chatbot-server.ts` - WhatsApp chatbot manager
- `content-server.ts` - Blog/SEO manager
- `sendgrid-server.ts` - Email activity
- `twilio-server.ts` - WhatsApp message logs

Externos: neon, stripe, sentry

### WhatsApp Chatbot: 19 archivos en `server/whatsapp/`

---

## Integraciones Externas

| Servicio | Estado | Uso |
|----------|--------|-----|
| Stripe | Activo | Pagos de reservas |
| SendGrid | Activo | Emails transaccionales + newsletter |
| Twilio | Activo | WhatsApp chatbot |
| OpenAI GPT-4o-mini | Activo | Chatbot IA + RAG + embeddings |
| Google Cloud Storage | Activo | Imagenes |
| GA4 + GTM | Activo | Analytics |

---

## Archivos Clave

| Archivo | Lineas | Descripcion |
|---------|--------|-------------|
| `shared/schema.ts` | ~1439 | 36 tablas Drizzle + validacion Zod |
| `server/routes/` | 33 modulos | API REST modularizada |
| `client/src/components/CRMDashboard.tsx` | ~446 | Wrapper del CRM (logica en crm/) |
| `client/src/pages/LoginPage.tsx` | ~123 | Login PIN-only simplificado |
| `shared/pricing.ts` | ~210 | Logica de precios por temporada |

---

## Modificaciones Recientes

| Commit | Descripcion |
|--------|-------------|
| 9b2fc40 | Simplificar login a PIN-only |
| 9d0df06 | Fix formato deposito como string decimal |
| 6bdbc23 | Fix badge fuel included por case-sensitive |
| 487aa31 | Optimizar imagenes, fix preloads, robots.txt |
| 7306392 | Optimizacion mobile completa para rutas CRM |
| 57d9dec | Crop imagenes 4:3, filtros mobile nativos |
| d11b05b | Audit UX: wizard, hero, blog autopublish |
| 203a48a | Audit web: reviews, filtros, badges, i18n |
| 1b833bb | Galerias responsive por barco |
| e4b1a3d | SEO: renombrar imagenes, alt texts, sitemaps |
| 99e7146 | Sistema newsletter, emails mejorados |
| 66fe1e6 | Resolver errores TypeScript pre-existentes |
| 3749fe9 | SEO: optimizacion agresiva para AI search |

---

## Documentos de Referencia

| Documento | Contenido |
|-----------|-----------|
| `PROJECT.md` | Documentacion tecnica completa del proyecto |
| `TODO.md` | Tareas pendientes y completadas |
| `ROADMAP.md` | Plan de desarrollo SaaS por fases |
| `CLAUDE.md` | Instrucciones de desarrollo para Claude Code |
