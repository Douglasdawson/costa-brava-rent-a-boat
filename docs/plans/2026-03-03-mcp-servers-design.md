# MCP Servers para Costa Brava Rent a Boat

**Fecha:** 2026-03-03
**Estado:** Implementado (Fases 1-5 completadas)

## Objetivo

Implementar servidores MCP (Model Context Protocol) para mejorar el flujo de desarrollo y la gestion del negocio desde Claude Code, organizados por prioridad de impacto.

---

## Fase 1: MCPs existentes (configuracion inmediata)

### 1.1 MCP Neon Database

**Que hace:** Consultar la base de datos PostgreSQL directamente desde Claude Code.

**Casos de uso:**
- Ver reservas del dia, semana, mes
- Consultar disponibilidad de barcos
- Buscar clientes por telefono/email
- Verificar estado de pagos
- Debug de datos en produccion

**Configuracion en `~/.claude/settings.json`:**
```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon"],
      "env": {
        "NEON_API_KEY": "<neon-api-key>"
      }
    }
  }
}
```

**Alternativa (conexion directa a Postgres):**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:password@host:5432/dbname"
      ]
    }
  }
}
```

**Esfuerzo:** 15 minutos

---

### 1.2 MCP Stripe

**Que hace:** Interactuar con Stripe para ver pagos, clientes y transacciones.

**Casos de uso:**
- Ver estado de payment intents
- Consultar refunds pendientes
- Debuggear webhooks fallidos
- Ver historial de pagos de un cliente
- Consultar balances

**Configuracion:**
```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "<stripe-secret-key>"
      }
    }
  }
}
```

**Esfuerzo:** 15 minutos

---

### 1.3 MCP Sentry

**Que hace:** Acceder a errores y performance de produccion.

**Casos de uso:**
- Ver errores recientes en produccion
- Investigar stack traces
- Ver issues por frecuencia/impacto
- Consultar performance de endpoints

**Configuracion:**
```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "<sentry-auth-token>"
      }
    }
  }
}
```

**Alternativa (remote con OAuth):**
El servidor remoto de Sentry esta en `https://mcp.sentry.dev/mcp` y soporta OAuth.

**Esfuerzo:** 15 minutos

---

## Fase 2: MCP CRM/Booking custom

### 2.1 MCP Costa Brava Business

**Que hace:** Exponer la logica de negocio como herramientas MCP para gestionar el negocio hablando con Claude Code.

**Ubicacion:** `server/mcp/business-server.ts`

**Herramientas (tools):**

| Tool | Descripcion | Parametros |
|------|-------------|------------|
| `get_today_bookings` | Reservas de hoy | `status?` |
| `get_bookings_range` | Reservas en rango de fechas | `startDate, endDate, status?, boatId?` |
| `get_availability` | Disponibilidad de un barco | `boatId, date` |
| `get_fleet_status` | Estado actual de toda la flota | ninguno |
| `search_customer` | Buscar cliente | `query` (telefono, email o nombre) |
| `get_customer_history` | Historial de un cliente | `customerId` |
| `get_revenue_summary` | Resumen de facturacion | `period` (today/week/month/season) |
| `get_booking_stats` | Estadisticas de reservas | `period` |
| `get_pending_payments` | Pagos pendientes | ninguno |
| `get_upcoming_reminders` | Recordatorios proximos | `hours` (default 24) |

**Arquitectura:**
- Servidor MCP standalone que importa el storage layer existente (`server/storage.ts`)
- Reutiliza la conexion a DB existente (`server/db.ts`)
- Solo lectura (no modifica datos)
- Se ejecuta como proceso separado via `npx tsx server/mcp/business-server.ts`

**Configuracion:**
```json
{
  "mcpServers": {
    "costa-brava-business": {
      "command": "npx",
      "args": ["tsx", "server/mcp/business-server.ts"],
      "env": {
        "DATABASE_URL": "<database-url>"
      }
    }
  }
}
```

**Esfuerzo:** 1-2 sesiones de desarrollo

---

## Fase 3: MCP Knowledge Base Manager

### 3.1 MCP Chatbot Manager

**Que hace:** Gestionar y mejorar el chatbot de WhatsApp desde Claude Code.

**Ubicacion:** `server/mcp/chatbot-server.ts`

**Herramientas:**

| Tool | Descripcion | Parametros |
|------|-------------|------------|
| `get_recent_conversations` | Ver conversaciones recientes | `limit?, language?, date?` |
| `get_conversation_detail` | Detalle de una conversacion | `conversationId` |
| `get_intent_stats` | Estadisticas de intents detectados | `period` |
| `get_unanswered_questions` | Preguntas sin respuesta satisfactoria | `limit?` |
| `update_knowledge_base` | Actualizar entrada de KB | `topic, content, language` |
| `add_knowledge_entry` | Anadir nueva entrada a KB | `topic, content, language, category` |
| `get_knowledge_base` | Ver entradas actuales | `category?, language?` |
| `get_chatbot_performance` | Metricas del chatbot | `period` |

**Arquitectura:**
- Servidor MCP que importa storage + WhatsApp services
- Lectura + escritura limitada (solo knowledge base)
- Reutiliza `server/whatsapp/ragService.ts` y `server/storage.ts`

**Esfuerzo:** 1 sesion de desarrollo

---

## Fase 4: MCP Content/SEO Manager

### 4.1 MCP Content Manager

**Que hace:** Gestionar blog posts, destinos y SEO desde Claude Code.

**Ubicacion:** `server/mcp/content-server.ts`

**Herramientas:**

| Tool | Descripcion | Parametros |
|------|-------------|------------|
| `list_blog_posts` | Listar posts del blog | `status?, language?` |
| `create_blog_post` | Crear nuevo post | `title, content, language, slug, seoTitle?, seoDescription?` |
| `update_blog_post` | Actualizar post existente | `postId, fields...` |
| `list_destinations` | Listar destinos/rutas | `status?` |
| `create_destination` | Crear nuevo destino | `name, description, language...` |
| `get_page_visits` | Visitas por pagina | `page?, period?` |
| `get_seo_audit` | Auditar SEO de una pagina | `path` |

**Esfuerzo:** 1 sesion de desarrollo

---

## Fase 5: MCPs wrapper de servicios externos

### 5.1 MCP SendGrid

**Que hace:** Ver estado de emails enviados y metricas.

**Ubicacion:** `server/mcp/sendgrid-server.ts`

**Herramientas:**
- `get_email_activity` — emails recientes enviados
- `get_email_stats` — tasas de apertura, bounce, delivery
- `search_emails` — buscar por destinatario
- `get_bounces` — emails rebotados

**Esfuerzo:** 1 sesion

### 5.2 MCP Twilio/WhatsApp

**Que hace:** Ver logs de mensajes WhatsApp directamente.

**Ubicacion:** `server/mcp/twilio-server.ts`

**Herramientas:**
- `get_recent_messages` — mensajes recientes
- `get_message_status` — estado de un mensaje
- `search_messages` — buscar por numero/contenido
- `get_delivery_stats` — metricas de entrega

**Esfuerzo:** 1 sesion

---

## Fase 6: MCP Server embebido en la app

### 6.1 Express MCP Endpoint

**Que hace:** Exponer la app como servidor MCP remoto para que agentes externos interactuen.

**Endpoint:** `POST /api/mcp` (Streamable HTTP)

**Casos de uso futuros:**
- Agentes autonomos que gestionan reservas
- Integraciones con Claude Desktop
- Automatizaciones externas via MCP

**Esfuerzo:** 2-3 sesiones

---

## Stack tecnico para MCPs custom

- **Runtime:** Node.js + TypeScript (mismo que el proyecto)
- **SDK:** `@modelcontextprotocol/sdk` (SDK oficial de MCP)
- **Transporte:** stdio (para Claude Code local)
- **DB:** Reutilizar `server/db.ts` (conexion Drizzle/Neon existente)
- **Validacion:** Zod (consistente con el proyecto)

## Estructura de archivos

```
server/mcp/
  business-server.ts    # Fase 2 - CRM/Booking
  chatbot-server.ts     # Fase 3 - Knowledge Base
  content-server.ts     # Fase 4 - Blog/SEO
  sendgrid-server.ts    # Fase 5 - Email
  twilio-server.ts      # Fase 5 - WhatsApp logs
  shared/
    db.ts               # Conexion DB compartida para MCPs
    auth.ts             # Autenticacion MCP (para fase 6)
```

## Orden de implementacion

1. Configurar Neon + Stripe + Sentry (45 min total)
2. Crear MCP Business/CRM (1-2 sesiones)
3. Crear MCP Chatbot Manager (1 sesion)
4. Crear MCP Content Manager (1 sesion)
5. Crear MCP SendGrid wrapper (1 sesion)
6. Crear MCP Twilio wrapper (1 sesion)
7. MCP Server embebido (2-3 sesiones)
