# Semana 4 — Quality (Solidez Técnica) Design

**Fecha:** 2026-03-03
**Objetivo:** Que nada se rompa silenciosamente durante la temporada.

---

## Bloque 1: Monitoring y Alertas

### Sentry
- Instalar `@sentry/node`
- Integrar en `server/index.ts` como primer middleware
- DSN via `SENTRY_DSN` env var (sin var = disabled)
- Captura automática de errores con contexto de request

### Health Check — `GET /api/health`
- DB: `SELECT 1` via Drizzle
- Stripe: `stripe.balance.retrieve()` (verifica API key válida)
- SendGrid: solo chequea presencia de `SENDGRID_API_KEY`
- Retorna `200 { status: "ok", services: { db, stripe, sendgrid } }` o `503`

### Logging Estructurado
- Helper `server/lib/logger.ts` con métodos `info/warn/error`
- Output JSON: `{ timestamp, level, message, context }`
- Reemplazar `console.log/error` en archivos críticos: scheduler, payments, whatsapp

---

## Bloque 2: Tests + CI

### Vitest Setup
- Instalar `vitest` como devDependency
- Config en `vitest.config.ts` con alias `@/` para shared/
- Script `"test"` en package.json

### Tests Críticos
1. **`pricing.ts`**: cálculo de precios por temporada, extras, packs, descuentos
2. **Disponibilidad**: solapamiento de reservas (unit test con mock)
3. **Flujo de reserva**: quote → hold → payment → confirmed

### GitHub Actions CI
- `.github/workflows/ci.yml`
- Triggers: push a main, pull requests
- Jobs: lint → typecheck → test
- Node 20, PostgreSQL service container para tests de integración

---

## Bloque 3: Deuda Técnica

### AuthenticatedRequest
- Crear tipo `AuthenticatedRequest` que extiende `Request`
- Incluir `adminUser?: AdminJwtPayload` y `saasUser?: SaasJwtPayload`
- Eliminar 34 usos de `(req as any)` en server/routes/

### Sesiones a PostgreSQL
- Crear tabla `admin_sessions` con: id, userId, token, createdAt, expiresAt
- Crear tabla `token_blacklist` con: token, blacklistedAt, expiresAt
- Reemplazar `Map<string, TokenMeta>` y `Set<string>` en `auth.ts`
- Cleanup job: eliminar tokens expirados cada hora

### devDependencies
- Mover `remotion`, `lighthouse`, `jsdom` de dependencies a devDependencies

### App.tsx Cleanup
- Eliminar los ~8 wrapper components innecesarios
- Usar lazy imports directos en las rutas

---

## Bloque 4: Chatbot y Knowledge Base

### Knowledge Base Multiidioma
- Traducir 14 entradas existentes (ES) a: CA, EN, FR, DE, NL, IT, RU
- Total: 14 × 8 idiomas = 112 entradas en la base
- Actualizar `seedKnowledgeBase.ts` para sembrar todos los idiomas

### Validación de Capacidad
- En el chatbot, cuando el usuario indica número de personas > capacidad del barco seleccionado, responder con sugerencia de barco adecuado
- Añadir check en `functionCallingService.ts`

---

## Items Descartados (Ya Resueltos)

- **Sincronizar BOAT_IDS del chatbot**: ya usa queries dinámicos desde DB
- **Knowledge base base**: ya tiene 14 entradas completas en ES con RAG

---

## Orden de Ejecución

1. Monitoring (independiente)
2. Deuda técnica — AuthenticatedRequest + sesiones PG (antes de tests)
3. Tests + CI (necesita deuda técnica resuelta para tests limpios)
4. Chatbot + Knowledge base (independiente)
