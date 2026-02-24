# Costa Brava Rent a Boat - Roadmap de Desarrollo

Actualizado: 24 Feb 2026

---

## Vision

Sistema de gestion interno para Costa Brava Rent a Boat: reservas, flota, clientes, chatbot WhatsApp y CRM completo. Uso personal.

---

## FASE 1: Producto Base - COMPLETADA

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

## FASE 2: Arquitectura Multi-Tenant - COMPLETADA

Infraestructura multi-tenant implementada (preparacion para uso futuro o expansion).

### Tarea 1: Arquitectura Multi-Tenant - COMPLETADA
- Tabla `tenants` con planes y estados
- `tenant_id` anadido a 22 tablas existentes
- Indexes y foreign keys para aislamiento de datos
- **Commit**: 93a92b3

### Tarea 2: Sistema de Autenticacion Multi-Tenant - COMPLETADA
- Tabla `users` con roles (owner/admin/employee)
- Tabla `refresh_tokens` con token rotation y cleanup automatico
- JWT con `tenantId` en payload, access token 1h, refresh token 30d
- 8 endpoints nuevos: register, login, logout, refresh-token, me, profile, forgot-password, reset-password
- Compatibilidad total con sistema legacy
- **Commit**: 29c989c

### Tarea 3: Onboarding Wizard - COMPLETADA
- Registro en 4 pasos: datos empresa, configuracion, flota inicial, confirmacion
- Trial de 14 dias automatico
- Email de bienvenida con SendGrid

### Tarea 4: Dashboard Multi-Tenant - COMPLETADA
- Nombre del tenant dinamico en header del CRM
- Banner de trial con dias restantes
- Menus por rol: employee / admin / owner

### Tarea 5: Tenant Admin Panel - COMPLETADA
- Tab "Config": editar nombre, email, telefono, direccion, branding
- Gestion de usuarios del tenant: crear, cambiar rol, activar/desactivar
- Backend: 5 endpoints en /api/tenant/

### Tarea 6: Super Admin Panel - COMPLETADA
- Tab "Platform" para admin legacy (Ivan via PIN)
- Stats globales de tenants, tabla completa, gestion de estado/plan
- Backend: 3 endpoints en /api/superadmin/

---

## Proximas Mejoras - PENDIENTE

Ideas para mejorar el producto existente:

- Mejoras UX en formulario de reserva movil
- Optimizacion de queries lentas
- Mejoras en el chatbot WhatsApp
- Cualquier bug o mejora que surja en uso real
