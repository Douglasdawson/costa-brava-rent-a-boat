# NauticFlow - Plataforma SaaS de Gestion Nautica

## Vision

NauticFlow es una plataforma SaaS multi-tenant para empresas de alquiler de embarcaciones. Nacio como el sistema interno de **Costa Brava Rent a Boat** (Blanes, Girona) y se esta transformando en un producto SaaS completo.

## Negocio Original

| Dato | Valor |
|------|-------|
| Empresa | Costa Brava Rent a Boat |
| Ubicacion | Puerto de Blanes, Girona, Espana |
| Temporada | Abril - Octubre |
| Telefono | +34 611 500 372 |
| Email | costabravarentboat@gmail.com |
| Flota | 7 barcos (4 sin licencia, 3 con licencia) |
| Modelo | Reservas via WhatsApp + web (sin pagos online obligatorios) |

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
- **JWT** (jsonwebtoken) + bcrypt (auth)
- **Zod** (validacion server-side)

### Integraciones Externas
| Servicio | Uso |
|----------|-----|
| **Stripe** | Procesamiento de pagos |
| **SendGrid** | Emails transaccionales |
| **Twilio** | WhatsApp chatbot |
| **OpenAI** | GPT-4o-mini para chatbot IA + embeddings RAG |
| **Google Cloud Storage** | Almacenamiento de imagenes |
| **Replit Auth** | OIDC para clientes |

### Base de Datos
- **PostgreSQL** (Neon serverless)
- **31 tablas** (ver schema.ts)
- **Drizzle Kit** para migraciones

## Estructura del Proyecto

```
├── client/src/
│   ├── components/     # 99 componentes React
│   │   ├── crm/        # 17 sub-componentes CRM
│   │   └── ui/         # 49 componentes shadcn/ui
│   ├── pages/          # 19 paginas lazy-loaded
│   ├── hooks/          # 8 hooks personalizados
│   ├── utils/          # SEO config, helpers
│   └── lib/            # Traducciones, queryClient
│
├── server/
│   ├── routes/         # 16 modulos de rutas (~127 endpoints)
│   ├── storage.ts      # Capa de acceso a datos (2332 lineas)
│   ├── whatsapp/       # 17 archivos para chatbot IA
│   └── services/       # Email, scheduler
│
├── shared/
│   ├── schema.ts       # Schemas Drizzle (1220 lineas)
│   ├── boatData.ts     # Catalogo de barcos
│   └── pricing.ts      # Logica de precios
```

## Features Implementadas

### Sistema de Reservas
- Flujo completo: draft → hold (30 min) → pending_payment → confirmed → cancelled
- Calendario de disponibilidad en tiempo real
- Buffer de seguridad entre reservas (20 min produccion, 5 min dev)
- Extras opcionales (parking, nevera, snorkel, paddle board, etc.)
- Codigos de descuento y tarjetas regalo

### CRM Admin
- Dashboard con KPIs y graficos (Recharts)
- Gestion de reservas con busqueda y filtros
- Base de datos de clientes con segmentacion (new/returning/VIP)
- Calendario visual de reservas
- Check-in/check-out digital
- Mantenimiento de flota con alertas
- Inventario de extras/equipamiento
- Documentos de barcos con control de vencimiento
- Gestion de empleados
- Blog y testimonios
- Galeria de fotos con moderacion
- Reportes: utilizacion flota, top clientes, mantenimiento

### WhatsApp Chatbot IA
- Motor: OpenAI GPT-4o-mini con function calling
- RAG con knowledge base y embeddings
- Deteccion de idioma automatica (8 idiomas)
- Lead scoring por intencion
- Flujo completo: listar barcos → disponibilidad → reservar
- Memoria de conversacion persistente

### SEO
- 8 idiomas (ES, EN, CA, FR, DE, NL, IT, RU)
- JSON-LD schemas (LocalBusiness, Service, FAQ, etc.)
- Sitemaps dinamicos
- Landing pages por ubicacion y categoria
- Blog con markdown

### Emails Automaticos
- Confirmacion de reserva
- Recordatorio 24h antes
- Thank-you post-reserva
- Cron jobs con node-cron

## Variables de Entorno

```bash
# Requeridas
DATABASE_URL=postgresql://...
JWT_SECRET=...
ADMIN_PIN=0760

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
ISSUER_URL=https://replit.com/auth/oauth
REPLIT_DOMAINS=...

# Opcional
NODE_ENV=production|development
PORT=3000
BASE_URL=https://costabravarentaboat.app
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
```
