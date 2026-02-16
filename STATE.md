# NauticFlow - Estado Actual del Proyecto

Actualizado: 15 Feb 2026

---

## Estado General

| Aspecto | Estado |
|---------|--------|
| Producto original (CBRB) | En produccion |
| Transformacion SaaS | En progreso (Fase 2, Tarea 2 completada) |
| Ultimo commit | 29c989c - Sistema autenticacion multi-tenant |
| Branch | main |
| Despliegue | Replit (produccion) |
| URL produccion | https://costabravarentaboat.app |

---

## Base de Datos

### Tablas Totales: 34

**Nuevas (SaaS):**
- `tenants` - Empresas registradas (plan, status, branding, settings)
- `users` - Usuarios SaaS con roles (owner/admin/employee) por tenant
- `refresh_tokens` - Tokens de refresco con rotation y cleanup
- `password_reset_tokens` - Tokens de reset de contrasena (1h expiry)

**Existentes con `tenant_id` (22 tablas):**
boats, bookings, customers, extras, booking_extras, admin_users, employees, blog_posts, testimonials, discount_codes, gift_cards, gift_card_transactions, knowledge_base, conversations, conversation_messages, lead_scoring, gallery_photos, boat_documents, maintenance_records, inventory_items, scheduled_reminders, booking_status_history

**Existentes sin `tenant_id` (legacy/global):**
contact_messages, sessions, notification_settings, routes, route_waypoints, destinations

### Migraciones Pendientes
- Ejecutar `npm run db:push` en produccion para crear tablas users, refresh_tokens, password_reset_tokens

---

## Autenticacion

### Sistema Actual (Dual)

**Legacy (activo en produccion):**
- PIN admin (0760) via `/api/admin/login`
- Username/password via `/api/admin/login-user`
- Replit Auth OIDC para clientes

**SaaS (nuevo, listo para usar):**
- Email/password con JWT (1h access + 30d refresh)
- Registro con creacion automatica de tenant (14 dias trial)
- Token rotation en refresh
- Reset de password con token criptografico
- Resolucion de tenant: subdominio, dominio custom, header

### Endpoints Nuevos
| Endpoint | Metodo | Auth |
|----------|--------|------|
| `/api/auth/register` | POST | Publico |
| `/api/auth/login` | POST | Publico |
| `/api/auth/logout` | POST | SaaS JWT |
| `/api/auth/refresh-token` | POST | Refresh token |
| `/api/auth/me` | GET | SaaS JWT |
| `/api/auth/profile` | PATCH | SaaS JWT |
| `/api/auth/forgot-password` | POST | Publico |
| `/api/auth/reset-password` | POST | Publico + token |
| `/api/auth/migrate-admin-users` | POST | Admin JWT |

---

## Frontend

### Login Page
- 4 tabs: Email (SaaS), Equipo (legacy), PIN (legacy), Cliente (Replit)
- Formulario de registro integrado en tab Email
- Auto-refresh de access token cada 50 minutos

### Paginas: 19
HomePage, LoginPage, CRMDashboard, ClientDashboard, BoatDetailPage, BookingFlow, CondicionesGenerales, FAQ, PrivacyPolicy, TermsConditions, CookiesPolicy, LocationBlanes, LocationLloret, LocationTossa, CategoryLicenseFree, CategoryLicensed, Testimonios, Blog, BlogDetail, DestinationDetail, Gallery, Routes, GiftCards, NotFound

### Componentes: ~99 (+ 49 shadcn/ui)

---

## Integraciones Externas

| Servicio | Estado | Uso |
|----------|--------|-----|
| Stripe | Activo | Pagos de reservas |
| SendGrid | Activo | Emails transaccionales |
| Twilio | Activo | WhatsApp chatbot |
| OpenAI GPT-4o-mini | Activo | Chatbot IA + RAG |
| Google Cloud Storage | Activo | Imagenes |
| GA4 + GTM | Activo | Analytics |
| Replit Auth | Activo | Login clientes |

---

## Errores Conocidos (Pre-existentes)

21 errores de TypeScript, ninguno critico:

| Archivo | Error | Impacto |
|---------|-------|---------|
| `client/src/lib/translations.ts` | Claves de traduccion faltantes | Bajo - UI |
| `client/src/pages/testimonios.tsx` | Props .occasion y .boat no existen en tipo | Bajo - UI |
| `client/src/components/CRMDashboard.tsx` | Prop adminToken faltante | Bajo - compilacion |
| `client/src/components/crm/ReportsTab.tsx` | Tipo formatter Recharts | Bajo - compilacion |

Build de Vite funciona correctamente (los errores son solo de `tsc --noEmit`).

---

## Archivos Clave Modificados Recientemente

| Archivo | Lineas | Ultima modificacion |
|---------|--------|---------------------|
| `shared/schema.ts` | ~1280 | Tarea 2 - tablas users, tokens |
| `server/storage.ts` | ~2400 | Tarea 2 - 13 metodos nuevos |
| `server/routes/auth.ts` | ~999 | Tarea 2 - reescritura completa |
| `client/src/pages/LoginPage.tsx` | ~340 | Tarea 2 - 4 tabs login |
| `client/src/App.tsx` | ~339 | Tarea 2 - auto-refresh tokens |

---

## Para Desplegar Tarea 2 en Produccion

```bash
# En Replit
git pull origin main
npm install
npm run db:push

# Migrar usuarios admin existentes (opcional)
curl -X POST https://costabravarentaboat.app/api/auth/migrate-admin-users \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"
```

---

## Siguiente Tarea

**Fase 2 - Tarea 3: Onboarding Wizard**
- Registro guiado en 4 pasos
- Configuracion inicial de empresa
- Creacion de primer barco
- Email de bienvenida

---

## Documentos de Referencia

| Documento | Contenido |
|-----------|-----------|
| `PROJECT.md` | Documentacion tecnica completa del proyecto |
| `ROADMAP.md` | Plan de desarrollo SaaS por fases |
| `MASTER_PLAN.md` | Plan original de mejoras (10 fases, producto CBRB) |
| `GTM_SAAS_STRATEGY.md` | Estrategia go-to-market SaaS |
| `ADMIN_DESIGN_REPORT.md` | Diseno UX/UI del admin panel |
| `docs/CX_SAAS_SYSTEM_DESIGN.md` | Diseno del sistema de experiencia cliente |
| `CLAUDE.md` | Instrucciones de desarrollo para Claude Code |
