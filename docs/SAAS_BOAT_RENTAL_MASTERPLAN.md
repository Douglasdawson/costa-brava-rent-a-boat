# MASTER PLAN: SaaS de Administracion/CRM para Alquiler de Embarcaciones

**Nombre de producto propuesto: NauticFlow (o BoatDesk)**
*"Built by boat rental operators, for boat rental operators"*

**Fecha:** 15 de febrero de 2026
**Empresa base:** Costa Brava Rent a Boat (Blanes, Costa Brava, Espana)

---

## INDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Vision del Producto y Mercado (CEO)](#2-vision-del-producto-y-mercado)
3. [Arquitectura Tecnica (CTO)](#3-arquitectura-tecnica)
4. [Diseno UX/UI (CDO)](#4-diseno-uxui)
5. [Experiencia de Cliente (CCO)](#5-experiencia-de-cliente)
6. [Funcionalidades Operativas (COO)](#6-funcionalidades-operativas)
7. [Modelo Financiero (CFO)](#7-modelo-financiero)
8. [Estrategia Go-to-Market (CMO)](#8-estrategia-go-to-market)
9. [Roadmap Unificado](#9-roadmap-unificado)
10. [Proximos Pasos Inmediatos](#10-proximos-pasos-inmediatos)

---

## 1. RESUMEN EJECUTIVO

### La Oportunidad

El mercado europeo de alquiler de embarcaciones cuenta con 25.000-40.000 negocios, la mayoria gestionados con WhatsApp + Apple Calendar + hojas de calculo. No existe un SaaS especializado que combine gestion de reservas, CRM de clientes, chatbot WhatsApp con IA y operaciones de flota en una sola plataforma.

### Nuestro Punto de Partida

Costa Brava Rent a Boat ya opera con un admin/CRM funcional construido en React + Express + PostgreSQL que gestiono 593 alquileres y 108.779 EUR en 2025. El sistema incluye un chatbot WhatsApp con IA (OpenAI), emails automaticos, gestion de flota, descuentos y gift cards. **Ningun competidor tiene WhatsApp + IA integrado nativamente.**

### Estrategia en Dos Fases

| Fase | Objetivo | Plazo |
|------|----------|-------|
| **Fase 1** | Perfeccionar el admin para Costa Brava Rent a Boat | Meses 1-2 |
| **Fase 2** | Convertirlo en SaaS multi-tenant vendible | Meses 3-6 |

### Numeros Clave

| Metrica | Valor |
|---------|-------|
| **TAM Europa** | 30.000 negocios x 99 EUR/mes = ~35.6M EUR/ano |
| **SAM Mediterraneo** | 8.000 negocios = ~9.5M EUR/ano |
| **Inversion desarrollo** | ~340 horas (~27.200 EUR si se externaliza) |
| **Break-even SaaS** | ~30 clientes de pago (mes 8-10) |
| **MRR proyectado mes 12** | 4.000-7.800 EUR (escenario conservador-moderado) |
| **Competidores directos con WhatsApp+IA** | 0 (ninguno) |
| **Pricing** | Starter 49 EUR/mes - Pro 99 EUR/mes - Enterprise 249 EUR/mes |

### Por Que Proceder

1. La inversion es minima (el desarrollo se hace internamente con Claude Code)
2. El producto ya existe al 60% y esta probado en produccion real
3. No existe competencia directa con WhatsApp + IA en este nicho
4. El peor escenario (0 clientes SaaS) deja un CRM perfecto para el propio negocio
5. El negocio de alquiler financia el desarrollo del SaaS

---

## 2. VISION DEL PRODUCTO Y MERCADO

### 2.1 Que hace que un admin de alquiler de barcos sea "el mejor"

Un CRM de alquiler de barcos superior debe resolver un problema fundamental: **la mayoria de negocios de 1-15 embarcaciones gestionan todo con WhatsApp, una libreta y Excel.** Los software existentes estan disenados para flotas de yates de lujo o grandes operadores con 50+ barcos.

El mejor CRM de este nicho debe ser:

1. **WhatsApp-first**: El 80%+ de las reservas mediterraneas se gestionan por WhatsApp
2. **Operativamente simple**: Ver en 2 segundos que barcos hay libres manana a las 10:00
3. **Multiidioma nativo**: El turismo costero implica clientes en 6-8 idiomas
4. **Estacional**: El negocio opera 7 meses al ano. Temporadas, precios dinamicos, apertura/cierre
5. **Mobile-first para el operador**: El dueno esta en el puerto, no en una oficina

### 2.2 Pain Points Validados (negocio real)

| Pain Point | Gravedad | Solucion actual tipica |
|---|---|---|
| Gestion manual de disponibilidad | CRITICA | Apple Calendar + memoria |
| Perdida de solicitudes por WhatsApp | CRITICA | Revisar chats manualmente |
| No saber cuantos extras quedan disponibles | ALTA | Conteo manual |
| No tener historial de clientes | ALTA | Buscar en chats antiguos |
| No enviar recordatorios automaticos | ALTA | Acordarse o no |
| No poder delegar operaciones a empleados | MEDIA | Solo el dueno sabe todo |
| Precios estacionales dificiles de comunicar | MEDIA | Tabla por WhatsApp |
| No tener metricas del negocio | BAJA | Intuicion |

### 2.3 Analisis de Competidores

| Competidor | Precio | Fortaleza | Debilidad |
|---|---|---|---|
| Nautic Manager | ~60-150 EUR/mes | Contratos, firma electronica | No WhatsApp, mercado frances |
| Let's Book | $25-150/mes + tx fee | Widget booking, IoT | No WhatsApp-first |
| Bokun (Viator) | Desde $49/mes | 2600+ OTAs, marketplace | Generico, no nautico |
| Booking Manager | No publico | 12000 yates, 1300 operadores | Complejo para 5-10 barcos |
| Booqable | ~$29/mes | Buena UX | Generico, no entiende temporadas |
| Peek Pro | 6-8% por tx | Sin coste fijo | Caro a escala, generico |

**Ningun competidor ofrece chatbot WhatsApp con IA integrado.**

### 2.4 Tamano del Mercado

| Segmento | Negocios estimados |
|---|---|
| Espana | 3.000-5.000 |
| Francia + Italia + Grecia + Croacia | 15.000-25.000 |
| Europa total | 25.000-40.000 |
| Global | 50.000-80.000 |

### 2.5 Ventaja Competitiva (Moat)

1. **WhatsApp + IA (diferenciador #1)**: Chatbot con RAG, function calling, lead scoring, 8 idiomas. No existe en ningun competidor.
2. **Built by operators**: Cada decision validada con negocio real (593 alquileres, 307 reviews Google, 4.8 media).
3. **Pricing estacional nativo**: Sistema BAJA/MEDIA/ALTA implementado exactamente como opera el sector.
4. **Switching cost**: Una vez migrado historico de reservas y clientes, cambiar es doloroso.

### 2.6 Modelo de Negocio: Pricing Tiers

| | Starter (49 EUR/mes) | Pro (99 EUR/mes) | Enterprise (249 EUR/mes) |
|---|---|---|---|
| Barcos | Hasta 5 | Hasta 15 | Ilimitados |
| Usuarios | 2 | 5 | Ilimitados |
| Reservas | Ilimitadas | Ilimitadas | Ilimitadas |
| Dashboard + KPIs | Si | Si | Si |
| Calendario visual | Si | Si | Si |
| CRM clientes | Basico | Completo | Completo + avanzado |
| WhatsApp chatbot IA | No | Si (500 msgs/mes) | Si (ilimitado) |
| Recordatorios auto | Email | Email + WhatsApp | Email + WhatsApp + SMS |
| Check-in/out digital | No | Si | Si |
| Inventario extras | No | Si | Si |
| Reportes | Basico | Avanzado + CSV/PDF | Avanzado + API |
| White-label | No | No | Si |
| Soporte | Email (48h) | Email+Chat (24h) | Prioritario (4h) |
| Booking fee adicional | 2% | 1% | 0% |
| Precio anual (-20%) | 470 EUR/ano | 950 EUR/ano | 2.390 EUR/ano |

---

## 3. ARQUITECTURA TECNICA

### 3.1 Inventario del Sistema Actual

**Frontend CRM** (`CRMDashboard.tsx` - 1.779 lineas):
- Dashboard con 4 KPIs, filtro temporal, reservas recientes
- Tabla de reservas con busqueda, filtros, CRUD completo
- Clientes agregados desde reservas (sin tabla propia)
- Exportacion CSV

**Modulos CRM** (`client/src/components/crm/`):
- FleetManagement.tsx (~1.430 lineas): CRUD barcos, drag & drop, galeria, precios
- EmployeeManagement.tsx: CRUD usuarios admin
- GalleryManagement.tsx, GiftCardManagement.tsx, DiscountManagement.tsx

**Backend** (`server/routes/`):
- Admin: CRUD barcos, reservas, clientes, stats, imagenes
- Auth: Login PIN (owner) + usuario/password (empleados), JWT 24h, rate limiting
- Bookings: quote con hold temporal (30min), cleanup automatico
- WhatsApp: 18 archivos - AI chatbot con OpenAI, RAG, function calling, 4 idiomas

**Base de datos** (`shared/schema.ts` - 681 lineas):
- 14 tablas: adminUsers, sessions, boats, bookings, bookingExtras, customers, testimonials, blogPosts, destinations, clientPhotos, giftCards, discountCodes, chatbotConversations, knowledgeBase, etc.

**Servicios automaticos** (`server/services/`):
- Scheduler: reminders email/WhatsApp 24h antes, thank-you 24h despues, cleanup holds cada 5min
- Email: SendGrid con templates de confirmacion, recordatorio, agradecimiento

### 3.2 Deuda Tecnica Critica

| ID | Problema | Severidad |
|---|---|---|
| DT-1 | CRMDashboard.tsx monolito de 1.779 lineas | ALTA |
| DT-2 | `getAllBookings()` sin paginacion (SELECT * sin LIMIT) | ALTA |
| DT-3 | Clientes sin tabla propia (se agregan ad-hoc de bookings) | ALTA |
| DT-4 | Token blacklist y sesiones en memoria (Map/Set) | ALTA |
| DT-5 | Precios doblemente definidos (boatData.ts + boats.pricing JSON) | MEDIA |
| DT-6 | Uso de `any` en 15+ lugares del CRM | MEDIA |
| DT-7 | `sharedBoatIds` hardcoded en storage.ts | MEDIA |
| DT-8 | Filtrado de reservas duplicado en frontend | MEDIA |
| DT-9 | Sin transacciones en operaciones criticas (createBooking + extras) | ALTA |
| DT-10 | JWT_SECRET con fallback hardcoded | CRITICA |

### 3.3 Arquitectura Multi-Tenant: Schema Compartido + RLS

**Estrategia elegida: Schema compartido con `tenant_id` + Row-Level Security (RLS) de PostgreSQL.**

Razones:
1. Neon PostgreSQL soporta RLS nativo
2. Un solo deployment sirve a todos los tenants
3. Migraciones se aplican una sola vez
4. Aislamiento garantizado a nivel de BD
5. Estandar de la industria para SaaS B2B <10.000 tenants

**Nuevas tablas core:**

```
tenants
  id, name, slug, domain, plan, settings, branding, timezone, currency,
  stripe_account_id, twilio_config, is_active, trial_ends_at

tenant_users (reemplaza admin_users)
  id, tenant_id, email, password_hash, role (owner/admin/operator/viewer),
  permissions (JSONB granular), is_active, last_login_at

tenant_invitations
  id, tenant_id, email, role, token, expires_at, accepted_at
```

**Tablas existentes modificadas:** Todas reciben `tenant_id` FK (boats, bookings, customers, etc.)

**Nuevas tablas funcionales:**
- `boat_maintenance` - Tracking mantenimiento preventivo/correctivo
- `boat_documents` - Seguros, ITV, licencias con alertas de vencimiento
- `seasons` - Reemplaza temporadas hardcoded en pricing.ts
- `pricing_rules` - Reemplaza JSON en boats.pricing
- `audit_logs` - Registro de acciones del admin
- `notifications` - Sistema de notificaciones in-app

**Implementacion RLS:**

```sql
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON boats
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

```typescript
// Middleware Express: en cada request
export function setTenantContext(tenantId: string) {
  return db.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
}
```

### 3.4 Sistema de Roles y Permisos

```
owner:    TODO (billing, eliminar tenant, transferir propiedad)
admin:    gestionar equipo, configuracion, reportes, CRUD completo
operator: gestionar reservas, clientes, ver flota (no modificar precios)
viewer:   solo lectura

Permisos granulares JSONB:
{
  "bookings.create": true, "bookings.edit": true, "bookings.delete": false,
  "fleet.edit": false, "fleet.pricing": false,
  "customers.view": true, "customers.edit": false,
  "reports.view": true, "settings.edit": false,
  "team.manage": false, "billing.manage": false
}
```

### 3.5 Stack Tecnologico

**Mantener:** React 18, TypeScript, Tailwind + shadcn/ui, Express.js, PostgreSQL (Neon), Drizzle ORM, TanStack Query, Zod, Twilio, OpenAI, SendGrid

**Anadir:**

| Tecnologia | Para que | Prioridad |
|---|---|---|
| **Redis (Upstash)** | Cache sesiones, rate limiting, token blacklist, pub/sub | P0 |
| **BullMQ** | Colas: emails, WhatsApp, PDF, webhooks | P0 |
| **Recharts** | Graficos en dashboard y reportes | P1 |
| **@fullcalendar/react** | Calendario visual de reservas | P1 |
| **Sentry** | Monitoring de errores produccion | P0 |
| **GitHub Actions** | CI/CD: lint, type-check, build, deploy | P1 |
| **SSE** | Notificaciones real-time sin WebSocket | P2 |

### 3.6 Estimacion de Esfuerzo

| Modulo | Dias |
|---|---|
| Resolver deuda tecnica | 8-10 |
| Multi-tenancy core (schema, RLS, auth, middleware) | 12-15 |
| Sistema de roles y permisos | 5-6 |
| Dashboard mejorado (graficos, real-time) | 6-8 |
| Calendario visual reservas | 8-10 |
| CRM clientes real | 8-10 |
| Reportes y analytics | 10-12 |
| Configuracion dinamica (temporadas, precios, extras) | 6-8 |
| Chatbot configurable por tenant | 8-10 |
| Mantenimiento de flota | 5-6 |
| Notificaciones y audit log | 5-6 |
| Facturacion y billing SaaS | 10-12 |
| Onboarding y self-service | 6-8 |
| Testing + CI/CD | 11-14 |
| **TOTAL** | **~100-125 dias** |

### 3.7 Decision Critica: Migrar, No Reescribir

El codigo actual tiene buena estructura modular. Una reescritura tiraria a la basura el chatbot WhatsApp funcional (18 archivos, 2000+ lineas), el sistema de emails, las integraciones probadas. La estrategia correcta:

1. Anadir `tenant_id` a todas las tablas existentes
2. Crear tenant "Costa Brava Rent a Boat" como tenant #1
3. Refactorizar modulo por modulo sin romper funcionalidad
4. Cada nuevo modulo se construye directamente multi-tenant

---

## 4. DISENO UX/UI

### 4.1 Diagnostico del Admin Actual

Tras analizar ~4.500 lineas del CRM actual, los problemas criticos:

1. **Monolito UI**: `CRMDashboard.tsx` (1.780 lineas) con 15 estados, 6 queries, 4 mutations en un solo componente
2. **Navegacion por tabs horizontales**: En movil, tabs como "Regalos", "Descuentos", "Equipo" quedan ocultas fuera de pantalla
3. **Modal bloqueante para detalle de reserva**: Dialog de 420 lineas bloquea la tabla, impide comparar reservas
4. **Sin vista calendario**: Para un negocio de alquiler por horas, esto es critico
5. **Filtrado duplicado**: El filtrado se implementa dos veces identicas (desktop tabla + mobile cards)

### 4.2 Benchmarking: Patrones a Copiar

| Patron | Fuente | Aplicacion |
|---|---|---|
| Sidebar persistente + colapsable | Stripe, Shopify, Linear | Navegacion principal del admin |
| Sheet/Panel lateral deslizante | Stripe, Linear | Detalle de reserva (reemplaza modal) |
| Command Palette (Cmd+K) | Linear, Vercel, GitHub | Busqueda global rapida |
| KPIs con delta % y sparklines | Stripe, Shopify | Dashboard principal |
| Timeline de recursos | Google Calendar, Calendly | Calendario barcos x horas |
| Activity Feed | GitHub, HubSpot | Panel de actividad reciente |

### 4.3 Estructura de Navegacion Propuesta

**Sidebar persistente (desktop) + Bottom tab bar (mobile):**

```
Dashboard       - KPIs, graficos, actividad reciente, reservas del dia
Calendario      - Vista dia/semana/mes, timeline barcos x horas
Reservas        - Tabla paginada, filtros avanzados, panel lateral detalle
Clientes        - Perfiles, historial, segmentacion, tags
Flota           - Cards con foto/estado, mantenimiento, documentos
Inventario      - Extras, stock, packs
Reportes        - Utilizacion, financiero, estacional, comparativas
Configuracion   - Precios, temporadas, equipo, integraciones, branding
```

### 4.4 Diseno del Admin Ideal

**Dashboard principal:**
- 4 KPI cards con delta % vs periodo anterior y sparkline
- Grafico de ingresos (ultimos 30 dias, linea con Recharts)
- Reservas del dia: timeline visual con bloques coloreados
- Activity feed: ultimas acciones (nueva reserva, cancelacion, WhatsApp lead)
- Alertas: documentos por vencer, mantenimiento pendiente, stock bajo

**Calendario de reservas:**
- Vista dia (defecto): filas = barcos, columnas = horas (08:00-20:00)
- Bloques coloreados por estado (azul=hold, amarillo=pending, verde=confirmed, rojo=cancelled, gris=bloqueo)
- Click en bloque -> Sheet lateral con detalle
- Click en slot vacio -> crear reserva rapida
- Drag & drop para mover/extender reservas
- Barcos que comparten casco agrupados visualmente

**Panel lateral de reserva (Sheet, no Modal):**
- Header: nombre cliente + estado con badge + acciones rapidas
- Datos de reserva: barco, fecha, hora, personas, extras
- Datos cliente: telefono (click = WhatsApp), email, historial
- Timeline de cambios (audit log)
- Acciones: confirmar, cancelar, editar, enviar mensaje

**Gestion de flota:**
- Cards con foto del barco, nombre, estado (semaforo), proxima reserva
- Click -> panel detallado: specs, mantenimiento, documentos, calendario individual
- Estados: disponible (verde), reservado (azul), mantenimiento (amarillo), fuera de servicio (rojo)

**CRM clientes:**
- DataTable con busqueda, filtros por segmento (nuevo/recurrente/VIP)
- Perfil 360: datos, historial reservas, total gastado, nacionalidad, notas, tags
- Timeline de interacciones (reservas + emails + WhatsApp)

### 4.5 Sistema de Diseno

- Base: shadcn/ui (ya instalado, componentes criticos disponibles pero sin usar: Sidebar, Sheet, Command)
- Paleta admin: fondo slate-50, sidebar slate-900, accent blue-600, destructive red-600
- Iconografia: Lucide React (ya instalado)
- Graficos: Recharts (a instalar)
- Unica dependencia nueva potencial: recharts

### 4.6 Modularizacion: de 1 componente a ~35

El CRMDashboard.tsx monolitico se descompone en:

```
admin/
  layout/
    AdminLayout.tsx, AdminSidebar.tsx, AdminHeader.tsx, MobileTabBar.tsx
  dashboard/
    DashboardPage.tsx, KPICards.tsx, RevenueChart.tsx, TodaySchedule.tsx, ActivityFeed.tsx
  bookings/
    BookingsPage.tsx, BookingsTable.tsx, BookingSheet.tsx, BookingForm.tsx, BookingFilters.tsx
  calendar/
    CalendarPage.tsx, DayTimeline.tsx, WeekView.tsx, MonthView.tsx, BookingBlock.tsx
  customers/
    CustomersPage.tsx, CustomersTable.tsx, CustomerProfile.tsx
  fleet/
    FleetPage.tsx, BoatCard.tsx, BoatDetail.tsx, MaintenanceLog.tsx
  reports/
    ReportsPage.tsx, UtilizationReport.tsx, RevenueReport.tsx, SeasonalReport.tsx
  settings/
    SettingsPage.tsx (tabs: Precios, Temporadas, Equipo, Integraciones)
```

### 4.7 Impacto Esperado

| Metrica | Antes | Despues |
|---|---|---|
| Tiempo para encontrar reserva | ~15 seg | ~3 seg (-80%) |
| Tiempo para confirmar reserva | ~30 seg (3 clics) | ~5 seg (1 clic, -83%) |
| Visibilidad de disponibilidad | Inexistente | Instantanea (calendario) |
| Secciones accesibles sin scroll (mobile) | 3/8 | 5/8 |

### 4.8 Plan de Implementacion UI

| Fase | Contenido | Tiempo |
|---|---|---|
| Fase 1 (P0) | AdminLayout + Sidebar, modularizar CRM, BookingSheet lateral | 3-4 dias |
| Fase 2 (P0) | Vista calendario dia con timeline barco/hora | 2-3 dias |
| Fase 3 (P1) | KPIs mejorados, ActivityFeed, TodaySchedule | 2 dias |
| Fase 4 (P1) | CustomerProfile 360, DataTable generico paginado | 2 dias |

---

## 5. EXPERIENCIA DE CLIENTE

### 5.1 Chatbot WhatsApp: Estado Actual y Gaps para SaaS

**Lo que funciona bien (a preservar):**
- Arquitectura modular (18 archivos especializados)
- RAG con embeddings (text-embedding-3-small) y knowledge base
- Function calling para disponibilidad/precios en tiempo real
- Lead scoring automatico con persistencia
- Deteccion de idioma por prefijo telefonico (8 idiomas)
- Memoria de conversacion persistente

**8 puntos de acoplamiento que bloquean el SaaS:**

| # | Archivo | Problema |
|---|---|---|
| 1 | `aiService.ts` (lineas 27-70) | BUSINESS_CONTEXT hardcoded (nombre, telefono, email, web, servicios) |
| 2 | `twilioClient.ts` | Un unico par de credenciales Twilio |
| 3 | `messageRouter.ts` (linea 476) | Numero propietario +34611500372 hardcoded |
| 4 | `shared/schema.ts` | Ninguna tabla de chatbot tiene `tenantId` |
| 5 | `messageRouter.ts` (lineas 518-527) | Array BOAT_IDS hardcoded |
| 6 | `seedKnowledgeBase.ts` | 14 entradas solo en espanol, especificas de Blanes |
| 7 | `functionCallingService.ts` | `storage.getAllBoats()` sin filtro de tenant |
| 8 | `translations.ts` | Extras con precios identicos en 8 idiomas |

### 5.2 Chatbot Multi-Tenant: Arquitectura Propuesta

**Configuracion por tenant (`tenant_chatbot_config`):**

```
tenant_id, whatsapp_number, twilio_sid, twilio_auth_token,
business_name, business_location, business_phone, business_email,
bot_personality ('professional' | 'friendly' | 'casual' | 'luxury'),
welcome_message, operating_hours, languages_enabled,
auto_reply_outside_hours, handoff_enabled, handoff_phone
```

**Sistema de prompts con placeholders:**

```
"Eres el asistente virtual de {{business_name}}, ubicado en {{location}}.
Nuestro horario es {{operating_hours}}.
Respondemos en: {{languages}}.
{{custom_instructions}}"
```

**Knowledge base por tenant:**
- Cada tenant tiene sus propias entradas en `knowledge_base` filtradas por `tenant_id`
- Editor CRUD en el admin para gestionar la base de conocimiento
- Import de FAQs desde Google My Business

### 5.3 Experiencia B2B (Clientes del SaaS)

**Onboarding en 5 pasos (<30 minutos):**

1. Registro: nombre negocio, email, ubicacion, web
2. Configurar flota: anadir barcos (nombre, foto, capacidad, con/sin licencia)
3. Definir precios: temporadas + tabla de precios por barco x duracion
4. Conectar WhatsApp: vincular numero via Twilio
5. Personalizar: logo, colores, idiomas, mensaje de bienvenida

**Centro de ayuda:**
- Knowledge base con 5 secciones (Inicio rapido, Reservas, Flota, WhatsApp, Reportes)
- 6 tours interactivos in-app con triggers contextuales
- Video tutoriales por funcionalidad
- Chat de soporte integrado

### 5.4 Experiencia B2C (Clientes Finales del Alquiler)

**Flujo de reserva optimizado via WhatsApp:**
- Reducir de 22 mensajes a 6 usando capacidad de la IA para extraer multiples datos de un solo mensaje
- Timeline automatizada: confirmacion -> recordatorio 48h -> recordatorio 2h -> follow-up -> fidelizacion

**Programa de fidelizacion (3 niveles):**

| Nivel | Requisito | Beneficio |
|---|---|---|
| Marinero | 1 alquiler | 5% descuento siguiente |
| Capitan | 3 alquileres | 10% descuento + extra gratis |
| Almirante | 5+ alquileres | 15% descuento + upgrade barco |

### 5.5 Sistema de Soporte para Clientes SaaS

**SLAs por plan:**

| Plan | Primera respuesta | Resolucion | Canal |
|---|---|---|---|
| Starter | 48h | 5 dias | Email |
| Pro | 24h | 3 dias | Email + Chat |
| Enterprise | 4h | 1 dia | Prioritario + telefono |

**Sistema de tickets:**
- Tablas: `support_tickets`, `ticket_messages`
- 4 niveles de escalado: L1 (bot) -> L2 (soporte) -> L3 (senior) -> L4 (ingenieria)
- Escalado automatico por reglas (tiempo sin respuesta, severidad, plan)

### 5.6 Feedback y Mejora Continua

- Widget de feedback contextual in-app
- Encuestas NPS cada 90 dias con clasificacion automatica (detractores/pasivos/promotores)
- Portal de feature requests con votacion publica y estados de desarrollo

---

## 6. FUNCIONALIDADES OPERATIVAS

### 6.1 Gestion de Flota Avanzada

**Nuevas tablas:**

```
boat_maintenance
  id, boat_id, type (preventive/corrective/inspection),
  category (engine/hull/safety/electronics/general),
  title, description, scheduled_date, completed_date,
  status (pending/in_progress/completed), priority,
  estimated_cost, actual_cost, vendor, engine_hours_at_service,
  photos[], documents[], performed_by, notes

boat_documents
  id, boat_id, type (insurance/itv/registration/license/safety_certificate),
  title, document_number, issued_date, expiry_date,
  alert_days_before (default 30), alert_sent, file_url,
  provider, cost, notes
```

**Extension tabla `boats`:**
- `boat_status`: available / maintenance / out_of_service / winterized
- `total_engine_hours`, `next_maintenance_hours` (alerta cuando se alcanza)
- `physical_hull_id`: reemplazar el hardcode de sharedBoatIds en storage.ts

**Panel de alertas:**
- Documentos que vencen en 30/15/7 dias (semaforo verde/amarillo/rojo)
- Mantenimientos pendientes o atrasados
- Barcos que alcanzan umbral de horas de motor
- Cron job diario a las 08:00 para revisar y enviar resumen por email

### 6.2 Sistema de Reservas Avanzado

**Calendario visual:**
- Vista dia: timeline vertical 08:00-20:00, columnas por barco
- Vista semana: 7 columnas, filas por barco, bloques proporcionales
- Vista mes: grid clasico con dots coloreados
- Colores: azul=hold, amarillo=pending, verde=confirmed, rojo=cancelled, gris=bloqueo
- Implementacion: `@fullcalendar/react` con plugins resource-timeline + interaction

**Drag & drop:**
- Mover reserva (cambiar hora o barco)
- Extender duracion (drag borde derecho)
- Validacion en tiempo real de disponibilidad
- Undo con snackbar 30 segundos

**Bloqueos manuales (nueva tabla `booking_blocks`):**
- Motivos: mal tiempo, mantenimiento, privado, evento
- Por barco individual o todos los barcos
- Soporte para bloqueos recurrentes (mantenimiento semanal)
- Integracion con checkAvailability()

**Lista de espera (nueva tabla `waitlist`):**
- Cliente solicita fecha no disponible -> se ofrece lista de espera
- Al cancelarse una reserva, notificar automaticamente al primer candidato por WhatsApp
- Ventana de 2 horas para confirmar, sino pasa al siguiente

### 6.3 Gestion de Extras e Inventario

**Nuevas tablas:**

```
inventory_items
  id, name, category (water_sports/comfort/safety/consumable),
  total_quantity, available_quantity, min_stock_alert,
  track_individually (bool), unit_price, cost_price, image_url

inventory_units (para items caros como paddle surf, seascooter)
  id, item_id, serial_number, status (available/reserved/in_use/repair/retired),
  condition (new/good/fair/poor), purchase_date

inventory_bookings (relacion reserva-inventario)
  id, booking_id, item_id, unit_id, quantity,
  status (reserved/delivered/returned/damaged/lost),
  delivered_at, returned_at, return_condition, damage_notes
```

**Inventario inicial estimado:**

| Item | Cantidad | Track individual | Alerta stock |
|---|---|---|---|
| Kit Snorkel | 10 | No | <= 2 |
| Paddle Surf | 3 | Si | <= 0 |
| Seascooter | 2 | Si | <= 0 |
| Nevera portatil | 8 | No | <= 1 |
| Kit Bebidas | 50 | No | <= 10 |

### 6.4 Check-in / Check-out Digital

**Nueva tabla `rental_sessions`:**

```
id, booking_id, boat_id,

// Check-in
check_in_at, check_in_by, check_in_notes, check_in_photos[],
check_in_fuel_level, check_in_engine_hours,
delivery_checklist (JSON), safety_briefing_completed,
waiver_signed, waiver_signature_url, waiver_document_url,
deposit_method, deposit_collected, deposit_amount,

// Check-out
check_out_at, check_out_by, check_out_notes, check_out_photos[],
check_out_fuel_level, check_out_engine_hours,
return_checklist (JSON), return_condition,
deposit_returned, deposit_returned_amount, deposit_deduction_reason,
navigation_hours,

status: pending -> checked_in -> active -> checked_out -> completed
```

**Flujo check-in (mobile-first, para usar en el puerto):**
1. Buscar reserva (nombre/telefono o QR del email)
2. Verificar datos (nombre, personas, barco, extras)
3. Firma digital del waiver (canvas HTML5)
4. Briefing de seguridad (checklist interactivo)
5. Checklist del barco (con fotos donde necesario)
6. Confirmar deposito
7. Registrar horas motor
8. Boton "Iniciar alquiler"

**Flujo check-out:**
1. Buscar sesion activa
2. Registrar horas motor finales
3. Checklist devolucion con fotos
4. Comparativa fotos antes/despues
5. Incidencias si aplica (con fotos y coste estimado)
6. Devolucion deposito (total o parcial)
7. Verificar extras devueltos
8. Cierre + trigger thank-you email

**Tabla `rental_incidents`:**
- Tipos: damage, breakdown, late_return, fuel_shortage, lost_equipment, accident
- Severidad: minor, moderate, major, critical
- Fotos, coste estimado/real, resolucion, vinculacion con mantenimiento

### 6.5 Reportes Operativos

**A. Utilizacion de flota:**
- % horas reservadas vs disponibles por barco y periodo
- Heatmap de ocupacion (barco x dia)
- Ranking de barcos mas/menos utilizados
- Patrones de demanda (pico vs valle)

**B. Horas de navegacion:**
- Horas acumuladas por barco (de rental_sessions)
- Media por alquiler, tendencia mensual
- Alerta proximo mantenimiento

**C. Incidencias y costes mantenimiento:**
- Total incidencias por tipo
- Coste mantenimiento por barco
- ROI por barco: ingresos - costes

**D. Rendimiento estacional:**
- Comparativa BAJA vs MEDIA vs ALTA: ingresos, ocupacion, precio medio
- Barcos mas demandados por temporada

**E. Comparativa ano vs ano:**
- Revenue, bookings, utilizacion YoY
- Crecimiento mensual comparado

**Exportacion:** CSV + PDF con rango de fechas configurable

### 6.6 Resumen de Nuevas Tablas: 9

1. `boat_maintenance` - Mantenimiento preventivo/correctivo
2. `boat_documents` - Seguros, ITV, licencias
3. `booking_blocks` - Bloqueos manuales
4. `waitlist` - Lista de espera
5. `inventory_items` - Stock de extras
6. `inventory_units` - Tracking individual de items caros
7. `inventory_bookings` - Relacion reserva-inventario
8. `rental_sessions` - Check-in/check-out digital
9. `rental_incidents` - Incidencias de alquiler

---

## 7. MODELO FINANCIERO

### 7.1 Datos del Negocio Actual (2025)

| Metrica | Valor |
|---|---|
| Ingresos totales | 108.779 EUR |
| Alquileres totales | 593 |
| Valor medio por reserva | 183,44 EUR |
| Costes fijos temporada | ~37.758 EUR |
| Margen bruto | ~60% (65.267 EUR) |
| Break-even | 239 alquileres |
| Flota | 8 barcos |
| Temporada | Abril-Octubre (7 meses) |

**Tasa de utilizacion real 2025:** 108.779 / 633.930 (capacidad teorica) = **17,2%**. Hay enorme potencial de crecimiento por mejora de utilizacion.

### 7.2 Funcionalidades Financieras Fase 1

**Lo que falta en el codigo actual:**
- Sin tracking de gastos (no hay tabla de expenses)
- Sin reportes por barco individual
- Sin reportes por temporada
- Sin tracking de canal mas alla de 'web' vs 'admin'
- Sin forecasting
- Sin calculo de margen bruto
- Descuentos solo validados client-side (riesgo financiero)

**Propuesta:**
- Dashboard financiero: ingresos por dia/semana/mes + comparativa con periodo anterior
- Reportes por barco: revenue, utilizacion, horas, coste, margen, ranking rentabilidad
- Reportes por temporada: revenue BAJA/MEDIA/ALTA, comparativas
- Reportes por canal: ampliar `source` a web/admin/whatsapp/phone/marketplace
- Tabla de gastos: combustible, mantenimiento, seguros, amarre, tech, marketing, personal
- Forecasting basico: proyeccion por mes basada en historico + reservas confirmadas futuras

### 7.3 Funcionalidades Financieras Fase 2 (SaaS)

- **Stripe Billing**: suscripciones, Customer Portal, webhooks
- **Gestion suscripciones**: trial 14 dias -> Starter/Pro/Enterprise, upgrades prorateados
- **Dunning**: cobro fallido -> reintento 3d -> aviso 7d -> suspension 14d -> cancelacion 30d
- **Dashboard interno SaaS**: MRR, churn, NRR, LTV, CAC, expansion MRR

### 7.4 Proyeccion Financiera del SaaS

**Costes de desarrollo:**

| Fase | Horas | Coste (80 EUR/h) |
|---|---|---|
| Fase 1: Dashboard financiero | 86h | 6.880 EUR |
| Fase 2: Multi-tenant + billing | 254h | 20.320 EUR |
| **Total** | **340h** | **27.200 EUR** |

**Costes operativos mensuales:**

| Concepto | 10 clientes | 50 clientes | 100 clientes |
|---|---|---|---|
| Hosting | 50 | 150 | 300 |
| BD Neon | 30 | 80 | 150 |
| OpenAI API | 100 | 400 | 800 |
| Twilio WhatsApp | 60 | 250 | 500 |
| SendGrid | 20 | 50 | 100 |
| Soporte | 200 | 800 | 1.500 |
| **Total** | **475** | **1.790** | **3.470** |

**Proyeccion 12 meses (escenario moderado: 4-6 clientes nuevos/mes):**

| Mes | Clientes acumulados | MRR |
|---|---|---|
| 3 | 18 | 1.170 EUR |
| 6 | 42 | 3.318 EUR |
| 9 | 68 | 5.576 EUR |
| 12 | 95 | 7.835 EUR |
| **Revenue total ano 1** | | **~54.000 EUR** |

**Escenarios break-even:**

| Escenario | Revenue ano 1 | Break-even |
|---|---|---|
| Conservador (2-3/mes) | 29.715 EUR | Mes 18-20 |
| Moderado (4-6/mes) | 54.000 EUR | Mes 10-12 |
| Optimista (8-12/mes) | 102.000 EUR | Mes 6-8 |

**Revenue adicional por booking fees:** En escenario moderado, las comisiones por transaccion (1-2%) podrian generar ~10.000 EUR/mes adicionales, duplicando el revenue del SaaS.

### 7.5 Metricas a Trackear

**Negocio de alquiler:**
- Revenue total, revenue/barco/mes, valor medio reserva
- Utilizacion flota (%), attach rate extras, repeat rate
- CAC, LTV, NPS

**SaaS:**
- MRR, ARR, Churn Rate (<5%), Net Revenue Retention (>100%)
- LTV (>1.800 EUR), CAC (<200 EUR), LTV:CAC (>3:1)
- ARPU (>82 EUR), Trial-to-paid (>15%), Gross Margin (>70%)
- Payback period (<6 meses)

---

## 8. ESTRATEGIA GO-TO-MARKET

### 8.1 Posicionamiento

**Naming recomendado:** NauticFlow (separado de Costa Brava Rent a Boat)
- Dominio: nauticflow.io o nauticflow.app
- Tagline: *"The AI-powered operating system for boat rental businesses"*
- En espanol: *"El sistema operativo con IA para negocios de alquiler de barcos"*

**Propuesta de valor unica:** "Built by boat rental operators, for boat rental operators" + WhatsApp AI chatbot integrado que ningun competidor ofrece.

### 8.2 Target Customer (ICP)

| Atributo | Perfil ideal |
|---|---|
| Tamano flota | 3-20 barcos |
| Tipo | Alquiler sin/con licencia, charter dia, excursiones |
| Geografia inicial | Espana (Costa Brava, Baleares, Costa del Sol, Canarias) |
| Fase 2 | Mediterraneo (Italia, Grecia, Croacia, Francia) |
| Facturacion | 30.000-500.000 EUR/temporada |
| Pain principal | Gestion manual WhatsApp + calendario |
| Decision | Dueno del negocio (1-3 socios) |

**Mercado accesible:**
- Espana: 3.000-5.000 operadores
- Mediterraneo total: ~6.000 operadores de 3-20 barcos

### 8.3 Canales de Adquisicion

**1. SEO (P0 - coste bajo, alto ROI a medio plazo):**
- Keywords target: "software alquiler barcos", "boat rental management software", "gestion charter nautico"
- 20 blog posts estrategicos para duenos de negocios nauticos
- Competencia SEO baja en este nicho

**2. Puerta fria + networking local (P0 - coste cero):**
- El propietario de CBRB conoce personalmente a operadores en Blanes, Lloret, Tossa, Estartit
- Visita presencial a 20 negocios en Costa Brava
- Demo en vivo en el puerto

**3. Content marketing (P1):**
- Caso de estudio: "Como Costa Brava Rent a Boat gestiona 593 alquileres con NauticFlow"
- Lead magnet: "Guia para digitalizar tu negocio de alquiler de barcos"
- Webinars mensuales sobre gestion nautica

**4. Partnerships (P1):**
- Asociaciones nauticas (ANEN, Federacion Espanola de Puertos Deportivos)
- Puertos deportivos (ofrecer NauticFlow a sus concesionarios)
- Fabricantes de barcos (incluir NauticFlow en el paquete de venta)

**5. Publicidad pagada (P2):**
- Google Ads: "software alquiler barcos" (500-1.000 EUR/mes)
- LinkedIn Ads: targeting propietarios de negocios nauticos
- Revistas nauticas especializadas

**6. Marketplaces de software (P2):**
- Capterra, G2, GetApp - categorias de boat rental software

**7. Referral program (P2):**
- 2 meses gratis por cada cliente referido que se convierta en pago

**8. Ferias nauticas (P3):**
- Salon Nautico Barcelona (Octubre 2026)
- Boot Dusseldorf (Enero 2027)

### 8.4 Estrategia de Lanzamiento

| Fase | Periodo | Acciones |
|---|---|---|
| **Pre-lanzamiento** | Feb-Mar 2026 | Registrar dominio, crear landing page, caso de estudio CBRB, identificar 20 operadores beta |
| **Beta cerrada** | Abr-May 2026 | 5-10 operadores gratis, feedback intensivo, iterar producto |
| **Lanzamiento publico** | Jun 2026 | Product Hunt + Hacker News, PR en medios nauticos, activar Google Ads |
| **Crecimiento** | Jul-Dic 2026 | Content scaling, partnerships, expansion a Baleares/Costa del Sol, Salon Nautico BCN |

**Pricing de lanzamiento:** Early adopter 40% descuento de por vida (29/59/149 EUR/mes)

### 8.5 Presupuesto Marketing Ano 1

| Concepto | Coste anual |
|---|---|
| Dominio + hosting landing | 200 EUR |
| Google Ads | 6.000-12.000 EUR |
| LinkedIn Ads | 2.000-4.000 EUR |
| Content creation | 2.000 EUR |
| Salon Nautico BCN (stand basico) | 3.000-5.000 EUR |
| Materiales (tarjetas, flyers) | 500 EUR |
| **Total** | **~15.000-25.000 EUR** |

---

## 9. ROADMAP UNIFICADO

### Fase 1: Admin Perfecto para CBRB (Meses 1-2, Febrero-Marzo 2026)

**Objetivo:** Que Costa Brava Rent a Boat use el CRM como unica herramienta, eliminando Calendar y Excel.

| Semana | Modulo | Esfuerzo |
|---|---|---|
| 1-2 | Resolver deuda tecnica critica (DT-1 a DT-10) | 8-10 dias |
| | - Modularizar CRMDashboard.tsx (1780 lineas -> ~35 componentes) | |
| | - AdminLayout con Sidebar persistente + BookingSheet lateral | |
| | - Paginacion server-side en bookings y clientes | |
| | - Fix JWT_SECRET, transacciones, sesiones en Redis | |
| 3-4 | Calendario visual de reservas (dia/semana/mes) | 5-6 dias |
| | Dashboard mejorado con graficos (Recharts) | 3-4 dias |
| 5-6 | CRM clientes real con perfiles y segmentacion | 4-5 dias |
| | Check-in/check-out digital mobile-first | 4-5 dias |
| 7-8 | Registro de mantenimiento + documentos con alertas | 4-5 dias |
| | Inventario de extras con stock | 3-4 dias |
| | Reportes basicos (utilizacion, financiero, estacional) | 3-4 dias |

**Entregable:** CRM completo usado al 100% durante temporada 2026 (abril-octubre).

### Fase 2: Arquitectura Multi-Tenant (Meses 3-4, Abril-Mayo 2026)

**Objetivo:** El sistema soporta multiples negocios con aislamiento total.

| Semana | Modulo | Esfuerzo |
|---|---|---|
| 9-10 | Multi-tenancy core: tabla tenants, tenant_id en todas las tablas, RLS | 6-7 dias |
| | Migrar datos CBRB a primer tenant | 2 dias |
| 11-12 | Nuevo sistema de auth: email/password, roles, permisos granulares | 5-6 dias |
| | Onboarding wizard para nuevos tenants | 4-5 dias |
| 13-14 | Chatbot WhatsApp configurable por tenant | 5-6 dias |
| | Configuracion dinamica (temporadas, precios en BD, no hardcoded) | 3-4 dias |
| 15-16 | Billing con Stripe Subscriptions | 5-6 dias |
| | Branding basico por tenant (logo, colores) | 2-3 dias |

### Fase 3: Lanzamiento Beta SaaS (Meses 5-6, Junio-Julio 2026)

**Objetivo:** Primeros 10 clientes de pago.

| Semana | Modulo | Esfuerzo |
|---|---|---|
| 17-18 | Landing page NauticFlow + caso de estudio CBRB | 3-4 dias |
| | Panel super-admin (gestionar tenants, metricas SaaS) | 3-4 dias |
| 19-20 | Reportes avanzados + exportacion CSV/PDF | 4-5 dias |
| | Audit log + notificaciones in-app | 3-4 dias |
| 21-22 | Testing e2e + CI/CD con GitHub Actions | 4-5 dias |
| | Centro de ayuda + tours in-app | 3-4 dias |
| 23-24 | Beta cerrada con 5-10 operadores | Feedback + iteracion |
| | Lanzamiento publico + Product Hunt | Marketing |

### Fase 4: Crecimiento (Meses 7-12)

| Mes | Actividades |
|---|---|
| 7-8 | Google Ads activo, expansion a Baleares, primeros 25 clientes |
| 9-10 | Salon Nautico Barcelona, partnerships con puertos deportivos |
| 11-12 | Expansion a Costa del Sol/Canarias, 40-95 clientes, API publica |

---

## 10. PROXIMOS PASOS INMEDIATOS

### Esta Semana (17-21 Febrero 2026)

| # | Accion | Responsable | Prioridad |
|---|---|---|---|
| 1 | **Resolver DT-10**: Eliminar JWT_SECRET fallback hardcoded | CTO | CRITICA |
| 2 | **Modularizar CRMDashboard.tsx**: Extraer AdminLayout + Sidebar + BookingSheet | CTO | ALTA |
| 3 | **Registrar dominio** nauticflow.io / nauticflow.app | CEO | ALTA |
| 4 | **Instalar Recharts** y crear primer grafico de ingresos en dashboard | CTO | MEDIA |
| 5 | **Anadir paginacion** server-side a `getAllBookings()` | CTO | ALTA |
| 6 | **Validar naming** "NauticFlow" con 3-5 operadores conocidos | CEO/CMO | MEDIA |

### Semana 2 (24-28 Febrero 2026)

| # | Accion | Responsable | Prioridad |
|---|---|---|---|
| 7 | **Calendario visual**: instalar FullCalendar, implementar vista dia | CTO | ALTA |
| 8 | **BookingSheet lateral**: reemplazar modal bloqueante | CTO/CDO | ALTA |
| 9 | **Tabla de gastos**: crear schema + CRUD basico | CTO/CFO | MEDIA |
| 10 | **Identificar 20 operadores** target para beta en Costa Brava | CEO/CMO | MEDIA |

### Semana 3-4 (Marzo 2026)

| # | Accion | Responsable | Prioridad |
|---|---|---|---|
| 11 | **CRM clientes**: tabla propia con perfiles, historial, segmentacion | CTO | ALTA |
| 12 | **Check-in/out digital**: schema + UI mobile-first | CTO/COO | ALTA |
| 13 | **Dashboard financiero**: reportes por barco y temporada | CTO/CFO | MEDIA |
| 14 | **Landing page** NauticFlow (single page con caso de estudio) | CDO/CMO | MEDIA |
| 15 | **physicalHullId**: eliminar hardcode de sharedBoatIds | CTO | BAJA |

---

## APENDICE A: Archivos Clave del Codebase

| Archivo | Funcion |
|---|---|
| `shared/schema.ts` (681 lineas) | Modelo de datos completo, base para multi-tenant |
| `shared/boatData.ts` (647 lineas) | Datos de flota con pricing estacional |
| `shared/pricing.ts` (241 lineas) | Motor de precios por temporada |
| `client/src/components/CRMDashboard.tsx` (1.779 lineas) | Dashboard principal del CRM |
| `client/src/components/crm/FleetManagement.tsx` (~1.430 lineas) | Gestion de flota |
| `server/routes/admin.ts` (390 lineas) | Endpoints admin CRUD |
| `server/routes/auth.ts` (380 lineas) | Autenticacion y roles |
| `server/storage.ts` | Data access layer completo |
| `server/whatsapp/aiService.ts` | Chatbot IA con OpenAI |
| `server/whatsapp/functionCallingService.ts` | Function calling para disponibilidad |
| `server/services/schedulerService.ts` | Cron jobs (reminders, thank-you, cleanup) |
| `server/services/emailService.ts` | Templates y envio de emails |

## APENDICE B: Competidores Analizados

| Competidor | URL | Modelo |
|---|---|---|
| Nautic Manager | nauticmanager.com | Suscripcion ~60-150 EUR/mes |
| Let's Book | lets-book.com | $25-150/mes + tx fee |
| Bokun (Viator) | bokun.io | Freemium + comision |
| Booking Manager | booking-manager.com | Enterprise (grandes flotas) |
| FOMCS | fomcs.com | ERP yachting profesional |
| Booqable | booqable.com | ~$29/mes (generico rental) |
| Peek Pro | peekpro.com | 6-8% por transaccion |
| TopRentApp | toprentapp.com | No publico (generico) |
| RENTALL | rentallsoftware.com | No publico (generico) |

## APENDICE C: Glosario SaaS

| Metrica | Definicion |
|---|---|
| MRR | Monthly Recurring Revenue - ingresos mensuales recurrentes |
| ARR | Annual Recurring Revenue - MRR x 12 |
| Churn | Tasa de clientes que cancelan por mes |
| LTV | Lifetime Value - valor total de un cliente durante su vida |
| CAC | Customer Acquisition Cost - coste de adquirir un cliente |
| NRR | Net Revenue Retention - retencion incluyendo expansion |
| ARPU | Average Revenue Per User - ingreso medio por usuario |
| TAM | Total Addressable Market - mercado total direccionable |
| SAM | Serviceable Available Market - mercado alcanzable |
| SOM | Serviceable Obtainable Market - mercado obtenible realista |

---

*Documento generado el 15 de febrero de 2026 por el equipo de direccion de Costa Brava Rent a Boat.*
*Analisis realizados por: CEO, CTO, CDO, CCO, COO, CFO, CMO.*
