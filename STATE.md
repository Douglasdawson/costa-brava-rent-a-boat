# Costa Brava Rent a Boat - Estado Actual del Proyecto

Actualizado: 16 Abril 2026

---

## Estado General

| Aspecto | Estado |
|---------|--------|
| Producto (CBRB) | En produccion |
| Transformacion SaaS | Completada (multi-tenant funcional) |
| Branch | main |
| Despliegue | Replit (produccion) |
| URL produccion | https://costabravarentaboat.com |
| TypeScript | 86 errores pre-existentes (ninguno en archivos core) |

---

## Base de Datos

### Tablas Totales: 67

**SaaS / Auth (6):**
tenants, users, refresh_tokens, password_reset_tokens, admin_sessions, token_blacklist

**Core del negocio (22):**
boats, bookings, customers, crm_customers, booking_extras, admin_users, customer_users, blog_posts, blog_clusters, blog_autopilot_config, blog_autopilot_log, blog_autopilot_queue, testimonials, discount_codes, gift_cards, knowledge_base, chatbot_conversations, ai_chat_sessions, ai_chat_messages, checkins, page_visits, whatsapp_inquiries

**Operaciones (8):**
maintenance_logs, boat_documents, inventory_items, inventory_movements, client_photos, newsletter_subscribers, company_config, lead_nurturing_log

**SEO Engine (18):**
seo_keywords, seo_rankings, seo_campaigns, seo_competitors, seo_competitor_rankings, seo_experiments, seo_alerts, seo_engine_runs, seo_health_checks, seo_pages, seo_meta, seo_links, seo_faqs, seo_conversions, seo_cwv_metrics, seo_geo, seo_serp_features, seo_reports, seo_redirects, seo_learnings

**Experiments & Features (5):**
experiments, experiment_assignments, experiment_events, feature_flags, global_feature_flags

**Analytics (2):**
analytics_snapshots, audit_logs

**Partnerships (1):**
partnership_contacts

**Memberships (1):**
memberships

**Global/Legacy (2):**
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

### Paginas: 37

LoginPage, OnboardingPage, ClientDashboardPage, CancelBookingPage, blog, blog-detail, faq, gallery, gift-cards, routes, testimonios, about, pricing, location-blanes, location-lloret-de-mar, location-tossa-de-mar, location-malgrat-de-mar, location-santa-susanna, location-calella, location-pineda-de-mar, location-palafolls, location-tordera, location-barcelona, alquiler-barcos-costa-brava, category-license-free, category-licensed, activity-families, activity-fishing, activity-snorkel, activity-sunset, destination-detail, privacy-policy, terms-conditions, cookies-policy, accessibility-declaration, not-found, LocationTemplate

### Componentes: ~96 custom + 46 shadcn/ui

### CRM Sub-componentes: 30 (en `components/crm/`) + 12 booking-flow

### Hooks personalizados: 20

---

## Backend

### Rutas: 49 modulos en `server/routes/`

El archivo `server/routes.ts` original (2061 lineas) fue dividido completamente en modulos independientes:
admin.ts, admin-analytics.ts, admin-bookings.ts, admin-customers.ts, admin-fleet.ts, admin-marketing.ts, admin-operations.ts, admin-partnerships.ts, admin-seo.ts, admin-stats.ts, auth.ts, auth-legacy.ts, auth-middleware.ts, auth-saas.ts, auto-discounts.ts, availability.ts, blog.ts, boats.ts, bookings.ts, company.ts, destinations.ts, discounts.ts, employees.ts, experiments.ts, feature-flags.ts, gallery.ts, gdpr.ts, giftcards.ts, health.ts, imageResize.ts, index.ts, inquiries.ts, memberships.ts, meta-capi.ts, metaWebhook.ts, newsletter.ts, payments.ts, robots.ts, sitemaps.ts, tenant.ts, tenant-metrics.ts, testimonials.ts, whatsapp.ts (plus test files)

### MCP Servers: 7 custom + 3 externos

Servidores custom en `server/mcp/`:
- `business-server.ts` - CRM/booking
- `chatbot-server.ts` - WhatsApp chatbot manager
- `content-server.ts` - Blog/SEO manager
- `sendgrid-server.ts` - Email activity
- `twilio-server.ts` - WhatsApp message logs
- `seo-engine-server.ts` - SEO engine
- `ads-intelligence-server.ts` - Ads intelligence

Externos: neon, stripe, sentry

### WhatsApp Chatbot: 15 archivos en `server/whatsapp/`

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
| `shared/schema.ts` | ~2172 | 67 tablas Drizzle + validacion Zod |
| `server/routes/` | 49 modulos | API REST modularizada |
| `client/src/components/CRMDashboard.tsx` | ~471 | Wrapper del CRM (logica en crm/) |
| `client/src/pages/LoginPage.tsx` | ~131 | Login PIN-only simplificado |
| `shared/pricing.ts` | ~424 | Logica de precios por temporada |

---

## Modificaciones Recientes

| Commit | Descripcion |
|--------|-------------|
| 4e3d803 | Actualizar CLAUDE.md con estructura completa |
| 64db612 | Corregir acentos/ortografia en 8 idiomas |
| dca745d | Auditoria mobile completa del CRM: 30 fixes |
| ed84d43 | Hardening de seguridad: auth, CSRF, headers |
| 303066c | Convertir peticion WhatsApp en reserva calendario |
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
