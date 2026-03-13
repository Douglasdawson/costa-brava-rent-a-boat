# Auditoría Completa del Codebase — Costa Brava Rent a Boat
**Fecha:** 2026-03-12
**Puntuación Global:** 4.5/10

## Puntuaciones por Área

| # | Área | Puntuación | Peso |
|---|------|:----------:|:----:|
| 1 | Autenticación y Seguridad | 5.5/10 | 2x |
| 2 | Pagos, Reservas y Lógica de Negocio | 4.5/10 | 2x |
| 3 | Schema DB y Capa de Storage | 3.5/10 | 1x |
| 4 | Fiabilidad Frontend y UX | 4.5/10 | 1x |
| 5 | Chatbot WhatsApp e Integraciones | 4.5/10 | 1x |
| 6 | MCP Servers y Admin CRM | 4.5/10 | 1x |
| 7 | SEO, Performance y Tests | 3.5/10 | 1x |

Media ponderada (áreas 1-2 peso doble): (5.5×2 + 4.5×2 + 3.5 + 4.5 + 4.5 + 4.5 + 3.5) / 9 = 4.5/10

---

## Top 10 Fixes Prioritarios

### 1. CRITICAL — Tenant Isolation Inexistente
**Áreas 3, 6** | 30+ queries sin filtro `tenantId`

Prácticamente NINGUNA función de storage filtra por `tenantId`. Un admin de tenant A ve y puede modificar datos de tenant B (bookings, barcos, clientes, analytics, inventario, audit logs).

**Fix:** Añadir `tenantId` como parámetro obligatorio en todas las funciones de storage, propagar `req.tenantId` desde middleware, añadir índices en columnas `tenantId`.

**Archivos afectados:** Todos los 17 archivos en `server/storage/`

---

### 2. CRITICAL — Cancelación No Ejecuta Reembolso Stripe
**Área 2** | `server/storage/bookings.ts:183-218`

La cancelación pública cambia `refundStatus: 'requested'` pero nunca llama a `stripe.refunds.create()`. El cliente recibe mensaje de reembolso pero el dinero nunca se devuelve.

**Fix:** Integrar `stripe.refunds.create()` en el flujo de cancelación o crear worker que procese reembolsos pendientes.

---

### 3. CRITICAL — Endpoints Analytics Chatbot Sin Autenticación
**Área 5** | `server/whatsapp/analyticsEndpoints.ts:11,31,66,123,161`

5 endpoints exponen PII de clientes (teléfonos, nombres, historial de conversaciones, leads) sin middleware de autenticación.

**Fix:** Añadir `requireAdminSession` a todos los endpoints de `analyticsEndpoints.ts`.

---

### 4. CRITICAL — Double-Submit en Pago
**Área 4** | `client/src/components/booking-flow/useBookingFlowActions.ts:140-141`

`isLoading` se resetea en `finally` antes de que termine el `setTimeout` del pago, re-habilitando el botón y permitiendo pagos duplicados.

**Fix:** Mover `setIsLoading(false)` dentro del callback del `setTimeout`, o usar estado `paymentSubmitted` permanente.

---

### 5. HIGH — Timezone Incorrecto en Disponibilidad
**Área 2** | `server/routes/availability.ts:59-61,162-163`

`getHours()` devuelve hora UTC del servidor, no hora de España. Un booking a las 10:00 CEST se interpreta como 08:00.

**Fix:** Usar `getMadridHour()` (ya existe en `bookings.ts:33-40`) en todos los cálculos de disponibilidad.

---

### 6. HIGH — 3 Horarios Operativos Diferentes
**Área 2** | `availability.ts` vs `bookings.ts`

- `/api/availability`: 08:00-19:00, slots de 30min
- `/api/boats/:id/availability`: 09:00-18:00, slots de 1h
- `/api/quote`: valida 09:00-20:00

**Fix:** Unificar en constantes compartidas `OPERATING_START_HOUR` / `OPERATING_END_HOUR`.

---

### 7. HIGH — CSRF Bypass
**Área 1** | `server/middleware/csrf.ts:32-35`

Requests sin headers Origin NI Referer pasan el middleware CSRF.

**Fix:** Rechazar con 403 requests sin Origin y sin Referer para métodos state-changing.

---

### 8. HIGH — Tests Inexistentes para Pagos y Auth
**Área 7** | 0 tests para `payments.ts` y `auth*.ts`

Los dos flujos más críticos del negocio no tienen ningún test. 12 archivos de test para 37+ rutas.

**Fix:** Crear tests con mocks de Stripe para payment flow y tests unitarios para JWT/login/middleware.

---

### 9. HIGH — Password Reset Tokens Sin Hashear
**Área 1** | `server/storage/auth.ts:87`

Los tokens de reset se almacenan en texto plano en la DB (a diferencia de refresh tokens que usan SHA-256).

**Fix:** Aplicar `hashToken()` antes de almacenar, como se hace con refresh tokens.

---

### 10. HIGH — Descuentos Sin Validación Server-Side
**Área 2** | Ausencia de código

No hay lógica server-side para aplicar/validar descuentos ni gift cards al momento del pago. Los descuentos se manejan solo en frontend.

**Fix:** Implementar validación y aplicación de descuentos en el endpoint de quote/payment.

---

## Área 1: Autenticación, Autorización y Seguridad — 5.5/10

### Resumen
JWT bien implementado, todos los admin routes protegidos, SQL parametrizado. Sin embargo: CSRF bypass, password reset tokens sin hash, memory leaks en Maps de rate limiting, inconsistencia en bcrypt rounds.

### Hallazgos
1. `server/middleware/csrf.ts:32-35` | HIGH | CSRF bypass cuando no hay Origin ni Referer
2. `server/storage/auth.ts:87` | HIGH | Password reset tokens en texto plano en DB
3. `server/routes/auth-middleware.ts:27` | MEDIUM | loginAttempts Map sin cleanup periódico (memory leak)
4. `server/routes/gallery.ts:17` | MEDIUM | submitAttempts Map sin cleanup periódico
5. `server/routes/auth-middleware.ts:10` vs `employees.ts:10` vs `tenant.ts:9` | MEDIUM | BCRYPT_ROUNDS inconsistente (12 vs 10)
6. `server/routes/auth-saas.ts:474` | MEDIUM | Password reset token se loguea en desarrollo
7. `server/routes/admin.ts:106,125` | MEDIUM | Tenant management sin verificación de superadmin
8. `server/routes/auth-legacy.ts:162,231` | LOW | PIN y username/password login sin Zod validation

### Positivos
- JWT_SECRET requiere min 32 caracteres, sin fallback
- Token blacklisting en DB, refresh token rotation con SHA-256
- Session cookies: httpOnly, secure, sameSite: "lax"
- Error handler no expone stack traces en producción
- No hay secrets en client/src

---

## Área 2: Pagos, Reservas y Lógica de Negocio — 4.5/10

### Resumen
Base sólida en double-booking prevention (transacción atómica con SELECT FOR UPDATE) y Stripe webhook. Problemas significativos en cancelación/reembolsos, timezone, horarios inconsistentes, floating point en moneda.

### Hallazgos
1. `server/storage/bookings.ts:183-218` | CRITICAL | Cancelación no ejecuta reembolso Stripe real
2. `server/routes/availability.ts:59-61,162-163` | HIGH | Timezone: getHours() devuelve UTC, no hora España
3. `server/routes/availability.ts:7-8` vs `:161` vs `bookings.ts:192-205` | HIGH | 3 rangos horarios distintos
4. N/A (ausencia) | HIGH | Descuentos sin validación server-side, sin guard contra stacking
5. `server/routes/payments.ts:174-175` | HIGH | parseFloat en montos monetarios (floating point)
6. `server/storage/bookings.ts:189-190` | MEDIUM | Cancelación no verifica si el viaje ya comenzó
7. `server/routes/bookings.ts:82-85` | MEDIUM | Reembolso calcula sobre totalAmount incluyendo depósito cash
8. `server/routes/payments.ts:96` | MEDIUM | Idempotencia webhook en memoria (pierde con restart)
9. `server/storage/bookings.ts:532-546` | MEDIUM | Holds expirados bloquean disponibilidad hasta limpieza
10. `client/src/components/booking-flow/useBookingFlowState.ts:176` | MEDIUM | getSeason() sin try-catch en cliente

### Positivos
- Double-booking: transacción atómica con SELECT FOR UPDATE
- Stripe webhook: firma verificada, idempotencia, raw body parsing
- Precio recalculado server-side, no acepta amount del cliente

---

## Área 3: Schema DB y Capa de Storage — 3.5/10

### Resumen
Problema sistémico: NINGUNA query filtra por tenantId. Ausencia de onDelete cascade en FK. Timestamps inconsistentes. MCP pool sin límites.

### Hallazgos
1. 30 funciones en 17 archivos de storage | CRITICAL | Queries sin filtro tenantId (tenant isolation inexistente)
2. `shared/schema.ts` (múltiples líneas) | HIGH | 8+ FK sin onDelete cascade → orphan records
3. `shared/schema.ts:222,234-235,251-252` | MEDIUM | Timestamps sin withTimezone: true
4. `server/mcp/shared/db.ts:14` | MEDIUM | Pool MCP sin max/timeout config
5. `server/storage/tenants.ts:96-103`, `auth.ts:123-167`, `customers.ts:275-331` | MEDIUM | N+1 queries
6. `shared/schema.ts` (múltiples tablas) | MEDIUM | Indexes faltantes en columnas tenantId
7. `server/storage/inventory.ts:374` | MEDIUM | Enum inconsistency: "OUT" vs "out"
8. `shared/schema.ts:1299-1359` | LOW | Tablas blog autopilot sin tenantId
9. `shared/schema.ts` (múltiples insert schemas) | LOW | Zod insert schemas sin tenantId
10. `server/storage/boats.ts:8-21` | LOW | Cache de boats sin tenant awareness

---

## Área 4: Fiabilidad Frontend y UX — 4.5/10

### Resumen
Lazy loading y estructura de booking flow razonables. Problemas críticos en double-submit de pago, checkbox de términos decorativo, strings hardcodeados en español.

### Hallazgos
1. `useBookingFlowActions.ts:140-141` | CRITICAL | Double-submit en pago (isLoading resetea prematuramente)
2. `BookingStepPayment.tsx:168` | CRITICAL | Checkbox de términos decorativo (sin estado React, sin validación)
3. `App.tsx:78-105` | HIGH | ErrorBoundary único sin recovery, texto hardcoded en español
4. `useBookingFlowActions.ts:43-60` | HIGH | 12+ toasts hardcodeados en español
5. `useBookingFlowState.ts:11-31` | HIGH | Lista de 170 nacionalidades en español sin i18n
6. `useBookingFlowActions.ts:108,149` | HIGH | setTimeout sin cleanup (memory leak)
7. `BookingStepCustomer.tsx:166-175` | MEDIUM | Sin validación de formato de teléfono
8. `BookingStepCustomer.tsx:112-119` | MEDIUM | Sin validación de formato de email
9. `BoatDetailPage.tsx:535,156,506` | MEDIUM | Strings hardcodeados en español
10. `SeasonBanner.tsx:150-173`, `SocialProofToast.tsx:23-29`, `FAQPreview.tsx:7-68` | MEDIUM | Más strings sin i18n
11. `useBookingFlowState.ts:85-89,106-108` | MEDIUM | useQuery sin manejo de isError
12. `BookingStepExtras.tsx:31-36` | LOW | Botones +/- sin aria-label

### Positivos
- 24 rutas con React.lazy y Suspense
- Cleanup correcto en la mayoría de useEffect (addEventListener, setInterval)
- Mobile-first responsive design

---

## Área 5: Chatbot WhatsApp e Integraciones Externas — 4.5/10

### Resumen
Verificación de firma Twilio/Meta correcta. Circuit breakers en integraciones. Problemas graves: endpoints analytics sin auth, prompt injection, PII en logs, sin rate limiting en webhooks.

### Hallazgos
1. `analyticsEndpoints.ts:11,31,66,123,161` | CRITICAL | 5 endpoints sin autenticación exponen PII
2. `webhookHandler.ts:44` | HIGH | Teléfonos y mensajes completos en logs sin enmascarar
3. `aiService.ts:231-253` | HIGH | Prompt injection sin mitigación
4. `whatsapp.ts:41-46`, `metaWebhook.ts:54` | HIGH | Sin rate limiting en webhooks
5. `sessionManager.ts:17,62` | MEDIUM | 2 `any` types
6. `webhookHandler.ts:36-41` | MEDIUM | Mensajes no textuales ignorados sin respuesta
7. `whatsapp.ts:9-12` | MEDIUM | Bypass verificación Twilio en dev (next() sin auth token)
8. `aiService.ts:256` | MEDIUM | Sin fallback inteligente con circuit breaker abierto
9. `retryQueue.ts:32-35` | MEDIUM | Sin dead letter queue ni persistencia
10. `schedulerService.ts:257-267` | LOW | Cron jobs sin mutex
11. `emailService.ts:451` | LOW | HTML injection menor en templates email

### Positivos
- Verificación de firma HMAC (Twilio) y timingSafeEqual (Meta)
- Circuit breakers en todas las integraciones externas
- Sesiones persistidas en DB, no en memoria
- maskPhone() implementado en sessionManager

---

## Área 6: MCP Servers y Admin CRM — 4.5/10

### Resumen
Auth básica sólida (JWT + requireAdminSession + requireTabAccess). Problemas: tenant isolation IDOR, MCP tools sin try/catch, audit log sin userId, marketing routes sin tab access.

### Hallazgos
1. Storage layer completo | CRITICAL | IDOR por falta de filtro tenantId (confirma Área 3)
2. `business-server.ts`, `chatbot-server.ts` | HIGH | 18 tool handlers sin try/catch
3. `server/lib/audit.ts:14-18` | HIGH | Audit log no registra userId/username (siempre NULL)
4. `server/mcp/shared/db.ts:13-14` | HIGH | Pool MCP sin límites de conexiones
5. Múltiples rutas admin | MEDIUM | Acciones sensibles sin audit log (crear booking, update boat, gestión tenants)
6. `admin-fleet.ts:81` y otros | MEDIUM | Hard-delete en todo, sin soft-delete
7. `admin-marketing.ts:13,25,87,99,111` | MEDIUM | Sin requireTabAccess("marketing")
8. `admin-bookings.ts:126` | LOW | `any` type
9. MCP servers | LOW | Sin rate limiting (bajo riesgo por stdio transport)

### Positivos
- JWT obligatorio en todas las rutas admin
- requireTabAccess implementado en la mayoría de módulos
- Zod validation consistente en inputs admin
- Logger estructurado usado correctamente (solo 2 console.log en server, ambos intencionados)

---

## Área 7: SEO, Performance y Cobertura de Tests — 3.5/10

### Resumen
SEO ambicioso y bien implementado (hreflang 8 idiomas, 10+ JSON-LD schemas, sitemaps completos, server-side injection). Problemas serios en cobertura de tests y performance.

### Hallazgos
1. `payments.ts` | CRITICAL | 0 tests para flujo de pagos Stripe
2. `auth*.ts` | CRITICAL | 0 tests para autenticación
3. `availability.ts:231-232` | HIGH | N+1 query en fleet-availability (N getDailyBookings por barco)
4. `auth-middleware.ts:196` | HIGH | getAllTenants() por cada request para resolver domain
5. `SEO.tsx:48-173` | MEDIUM | SEO client-side via DOM manipulation (no funciona sin JS)
6. `sitemaps.ts:313` | MEDIUM | Blog sitemap image injection con regex frágil

### Positivos
- Bundle splitting excelente: react, radix, icons, tanstack, recharts, date-fns, stripe, framer-motion en chunks separados
- 24 rutas con React.lazy()
- Sitemaps completos: 4 índices con variantes en 8 idiomas
- JSON-LD: LocalBusiness, Product, FAQPage, BlogPosting, ItemList, Event, WebSite, HowTo, BreadcrumbList, TouristAttraction
- Caching headers apropiados en todos los niveles
- Imágenes con loading="lazy", srcset, dimensiones explícitas

---

## Fortalezas Globales del Codebase
- Double-booking prevention con SELECT FOR UPDATE en transacción atómica
- JWT bien implementado con refresh token rotation y blacklisting
- Stripe webhook con verificación de firma e idempotencia
- Precio recalculado server-side (no confía en cliente)
- SQL parametrizado en todo el codebase (sin inyección)
- Bundle splitting excelente con 24 rutas lazy-loaded
- SEO ambicioso: 10+ JSON-LD schemas, hreflang 8 idiomas, sitemaps completos
- Circuit breakers en integraciones externas
- Logger estructurado usado correctamente

## Debilidades Sistémicas
1. **Tenant isolation inexistente** — afecta a todo el sistema (30+ queries)
2. **Flujo de cancelación/reembolso incompleto** — no ejecuta Stripe refund
3. **Cobertura de tests muy baja** — 12 tests para 37+ rutas
4. **Internacionalización incompleta** — strings hardcodeados en español en booking flow
5. **Timezone inconsistente** — UTC vs Europe/Madrid en cálculos de disponibilidad
