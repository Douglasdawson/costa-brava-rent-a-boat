# NauticFlow - Roadmap de Desarrollo

Actualizado: 15 Feb 2026

---

## Vision

Transformar el sistema interno de Costa Brava Rent a Boat en **NauticFlow**, una plataforma SaaS multi-tenant para empresas de alquiler de embarcaciones.

---

## FASE 1: Producto Actual (Costa Brava Rent a Boat) - COMPLETADA

Todas las mejoras del producto original completadas entre Ene-Feb 2026.

| Tarea | Estado | Commit |
|-------|--------|--------|
| Bugs criticos: Astec 480, Remus 450 II, Excursion Privada | Completado | a4a66dc |
| Seguridad: JWT, Helmet CSP, rate limiting, Zod validation | Completado | dbdc4a5 |
| Conversion web: CTA reserva, WhatsApp button, validacion, modal unificado | Completado | e98411a |
| WhatsApp chatbot: flujo reserva completo, 8 idiomas | Completado | 8a83b55 |
| Emails automaticos, codigos descuento, recordatorios programados | Completado | 107a563 |
| GA4/GTM tracking, SEO fixes, 6 blog posts | Completado | aebdee3 |
| Gift cards, extras/packs, soporte local dev | Completado | b8200c9 |
| Seguridad JWT, paginacion, modularizacion CRM, calendario visual | Completado | e275857 |
| Dashboard KPIs con Recharts | Completado | c4f9a5a |
| CRM clientes, check-in/check-out digital | Completado | dec0a33 |
| Mantenimiento flota, inventario extras, reportes operativos | Completado | 127a938 |

---

## FASE 2: Transformacion SaaS - EN PROGRESO

### Tarea 1: Arquitectura Multi-Tenant - COMPLETADA
- Tabla `tenants` con planes (starter/pro/enterprise), estados (trial/active/suspended/cancelled)
- `tenant_id` anadido a 22 tablas existentes
- Indexes y foreign keys para aislamiento de datos
- **Commit**: 93a92b3

### Tarea 2: Sistema de Autenticacion Multi-Tenant - COMPLETADA
- Tabla `users` con roles (owner/admin/employee) y constraint unique(email, tenantId)
- Tabla `refresh_tokens` con token rotation y cleanup automatico
- Tabla `password_reset_tokens` con expiracion 1h
- JWT con `tenantId` en payload, access token 1h, refresh token 30d
- Resolucion de tenant: subdominio, dominio custom, header X-Tenant-Slug
- 8 endpoints nuevos: register, login, logout, refresh-token, me, profile, forgot-password, reset-password
- Middleware: `requireSaasAuth`, `injectTenantId`, `requireOwner` actualizado
- Frontend LoginPage con 4 tabs (Email SaaS + 3 legacy)
- Auto-refresh de tokens cada 50 minutos
- Compatibilidad total con sistema legacy
- **Commit**: 29c989c

### Tarea 3: Onboarding Wizard - COMPLETADA
- Registro en 4 pasos: datos empresa, configuracion, flota inicial, confirmacion
- Trial de 14 dias automatico
- Email de bienvenida con SendGrid (sendWelcomeEmail)
- Wizard guiado post-registro en /onboarding

### Tarea 4: Dashboard Multi-Tenant - COMPLETADA
- Nombre del tenant dinamico en header del CRM (reemplaza "CRM Costa Brava" hardcoded)
- Banner de trial con dias restantes (ambar/rojo segun urgencia) + CTA "Activar plan"
- Datos de tenant en sessionStorage: plan, status, trialEndsAt, logo
- Menus por rol: employee (3 tabs), admin (11 tabs), owner (12 tabs con Equipo)
- Datos filtrados por tenant via JWT tenantId ya implementado en servidor
- Selector de tenant para super-admin: pendiente para Tarea 6 (requiere rol nuevo)

### Tarea 5: Tenant Admin Panel - COMPLETADA
- Tab "Config" en CRM (solo visible para propietario)
- Seccion "Mi Empresa": editar nombre, email, telefono, direccion
- Seccion "Branding": logo URL, color primario/secundario con color picker
- Seccion "Usuarios": tabla de usuarios SaaS del tenant (nombre, email, rol, estado, ultimo acceso)
- Crear nuevo usuario con email, contraseña, nombre y rol (admin/empleado)
- Cambiar rol y activar/desactivar usuarios (no se puede modificar al owner)
- Backend: 5 endpoints nuevos en /api/tenant/ (settings GET/PATCH, users GET/POST/PATCH)
- Gestion de flota: ya existia en tab Flota
- Gestion de precios: ya existia en tab Flota

### Tarea 6: Super Admin Panel - PENDIENTE
- Panel para gestionar todos los tenants
- Metricas globales (tenants activos, ingresos, uso)
- Suspension/activacion de tenants
- Gestion de planes y limites

---

## FASE 3: Monetizacion - PLANIFICADA

### Tarea 1: Integracion Stripe Subscriptions
- Plans: Starter (49 EUR/mes), Pro (99 EUR/mes), Enterprise (199 EUR/mes)
- Billing portal con Stripe Customer Portal
- Webhooks para activacion/suspension automatica
- Upgrade/downgrade de planes

### Tarea 2: Feature Gating
- Limites por plan: barcos, reservas/mes, usuarios
- Features exclusivas por plan (chatbot IA, emails automaticos, reportes)
- UI de upgrade cuando se alcanzan limites

### Tarea 3: Trial Management
- Dashboard de trial (dias restantes, uso)
- Emails de conversion: dia 1, dia 7, dia 12, dia 14
- Expiracion graceful (read-only, no data loss)

---

## FASE 4: Escalabilidad - PLANIFICADA

### Tarea 1: Multi-idioma Dinamico
- Sistema de traducciones por tenant (no hardcoded)
- Panel de traduccion en admin

### Tarea 2: API Publica
- REST API con API keys por tenant
- Documentacion con OpenAPI/Swagger
- Rate limiting por plan

### Tarea 3: Integraciones
- Calendarios externos (Google Calendar, iCal)
- Pasarelas de pago adicionales
- CRM externos (HubSpot, Mailchimp)

### Tarea 4: Performance
- Cache con Redis
- CDN para assets
- Optimizacion de queries (eliminar N+1)
- Connection pooling

---

## FASE 5: Go-to-Market - PLANIFICADA

### Tarea 1: Landing Page SaaS
- nauticflow.app con pricing, features, testimonios
- Formulario de registro publico
- Demo interactiva

### Tarea 2: Documentacion
- Centro de ayuda / Knowledge base
- Video tutoriales onboarding
- API docs

### Tarea 3: Canales de Adquisicion
- SEO para "software alquiler barcos", "boat rental software"
- Google Ads en mercados clave (ES, FR, IT, GR, HR)
- Partnerships con asociaciones nauticas

---

## Metricas de Exito

| Metrica | Objetivo 6 meses | Objetivo 12 meses |
|---------|-------------------|---------------------|
| Tenants registrados | 20 | 100 |
| Tenants de pago | 5 | 30 |
| MRR | 500 EUR | 3.000 EUR |
| Churn mensual | < 5% | < 3% |
| NPS | > 40 | > 50 |

---

## Prioridades Inmediatas (Feb-Mar 2026)

1. **Tarea 3 - Onboarding Wizard** - Siguiente en cola
2. **Tarea 4 - Dashboard Multi-Tenant** - Adaptar CRM existente
3. **Tarea 5 - Tenant Admin Panel** - Gestion de equipo y configuracion
4. Desplegar en Replit y verificar Tarea 2 en produccion
