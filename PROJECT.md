# Costa Brava Rent a Boat - Plataforma de Gestion Nautica

Actualizado: 11 Marzo 2026

## Vision

Plataforma web completa para la gestion de alquiler de embarcaciones. Nacio como el sistema interno de **Costa Brava Rent a Boat** (Blanes, Girona) e incluye capacidades multi-tenant SaaS.

## Negocio

| Dato | Valor |
|------|-------|
| Empresa | Costa Brava Rent a Boat |
| Ubicacion | Puerto de Blanes, Girona, Espana |
| Temporada | Abril - Octubre |
| Telefono | +34 611 500 372 |
| Email | costabravarentaboat@gmail.com |
| Flota | 7 barcos (4 sin licencia, 3 con licencia) |

## Stack Tecnologico

### Frontend
- **React 18.3** + TypeScript 5.6
- **Vite 5** (build tool)
- **Wouter** (routing)
- **TanStack React Query** (data fetching)
- **TailwindCSS 3.4** + shadcn/ui (UI)
- **Framer Motion** (animaciones)
- **React Hook Form + Zod** (formularios)
- **Recharts** (graficos)
- **react-helmet-async** (SEO)

### Backend
- **Express 4.21** + TypeScript
- **Drizzle ORM 0.39** + PostgreSQL (Neon serverless)
- **JWT** (jsonwebtoken) + bcrypt (auth SaaS)
- **Zod** (validacion server-side)
- **Vitest 4.0** (testing)

### Integraciones Externas
| Servicio | Uso |
|----------|-----|
| **Stripe** | Procesamiento de pagos |
| **SendGrid** | Emails transaccionales + newsletter |
| **Twilio** | WhatsApp chatbot |
| **OpenAI** | GPT-4o-mini para chatbot IA + embeddings RAG |
| **Google Cloud Storage** | Almacenamiento de imagenes |

### Base de Datos
- **PostgreSQL** (Neon serverless)
- **36 tablas** (ver schema.ts)
- **Drizzle Kit** para migraciones

## Estructura del Proyecto

```
client/src/
    components/     # 86 componentes React custom
        crm/        # 29 sub-componentes CRM
        ui/         # 46 componentes shadcn/ui
    pages/          # 22 paginas lazy-loaded
    hooks/          # 11 hooks personalizados
    utils/          # SEO config, helpers
    lib/            # Traducciones, queryClient

server/
    routes/         # 33 modulos de rutas
    mcp/            # 5 MCP servers custom
    whatsapp/       # 19 archivos para chatbot IA
    services/       # Email, scheduler

shared/
    schema.ts       # Schemas Drizzle (1439 lineas, 36 tablas)
    boatData.ts     # Catalogo de barcos
    pricing.ts      # Logica de precios
```

## Features Implementadas

### Sistema de Reservas
- Flujo completo: draft -> hold (30 min) -> pending_payment -> confirmed -> cancelled
- Calendario de disponibilidad en tiempo real
- Buffer de seguridad entre reservas (20 min produccion, 5 min dev)
- Extras opcionales (parking, nevera, snorkel, paddle board, etc.)
- Codigos de descuento y tarjetas regalo
- Descuentos automaticos configurables

### CRM Admin
- Dashboard con KPIs y graficos (Recharts)
- Gestion de reservas con busqueda y filtros
- Base de datos de clientes con segmentacion (new/returning/VIP)
- Calendario visual de reservas
- Check-in/check-out digital
- Mantenimiento de flota con alertas
- Inventario de extras/equipamiento con movimientos
- Documentos de barcos con control de vencimiento
- Gestion de empleados
- Blog con autopublish y clusters SEO
- Testimonios
- Galeria de fotos con moderacion
- Sistema de newsletter
- Reportes: utilizacion flota, top clientes, mantenimiento
- Super admin tab para configuracion avanzada

### WhatsApp Chatbot IA
- Motor: OpenAI GPT-4o-mini con function calling
- RAG con knowledge base y embeddings
- Deteccion de idioma automatica (8 idiomas)
- Lead scoring por intencion
- Flujo: listar barcos -> disponibilidad -> reservar
- Memoria de conversacion persistente
- Registro de inquiries para seguimiento

### SEO
- 8 idiomas (ES, EN, CA, FR, DE, NL, IT, RU)
- JSON-LD schemas (LocalBusiness, Service, FAQ, VideoObject, Event, Review, etc.)
- Sitemaps dinamicos
- Landing pages por ubicacion y categoria
- Blog con markdown
- Optimizacion para AI search (llms.txt, entity stacking, schemas enriquecidos)

### Emails Automaticos
- Confirmacion de reserva
- Recordatorio 24h antes
- Thank-you post-reserva mejorado
- Newsletter
- Cron jobs con node-cron

### MCP Servers
5 servidores MCP custom para integracion con herramientas de desarrollo:
- business-server (CRM/booking)
- chatbot-server (WhatsApp)
- content-server (Blog/SEO)
- sendgrid-server (Email)
- twilio-server (WhatsApp logs)

### Multi-tenant SaaS
- Sistema de tenants con planes y branding
- Auth JWT con refresh tokens y rotation
- Registro con creacion automatica de tenant
- Resolucion de tenant por subdominio/dominio/header
- Onboarding wizard

## Autenticacion

**Admin CRM (produccion):** PIN fijo via variable de entorno ADMIN_PIN

**SaaS (disponible):** Email/password con JWT (1h access + 30d refresh), token rotation, reset de password

## Variables de Entorno

```bash
# Requeridas
DATABASE_URL=postgresql://...
JWT_SECRET=...
ADMIN_PIN=<pin-seguro>

# Pagos
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=...

# WhatsApp
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+...

# IA
OPENAI_API_KEY=sk-...

# Auth
SESSION_SECRET=...

# Opcional
NODE_ENV=production|development
PORT=3000
BASE_URL=https://costabravarentaboat.com
```

## Comandos

```bash
npm run dev          # Desarrollo (localhost:5173)
npm run build        # Build produccion
npm run start        # Arrancar produccion
npm run check        # TypeScript check
npm run db:push      # Aplicar migraciones
npm run lint         # ESLint
npm run format       # Prettier
npm run test:watch   # Vitest en modo watch
```
