# Costa Brava Rent a Boat - Contexto del Proyecto

> **Última actualización**: Febrero 2026
> **Versión**: 1.0.0
> **Dominio**: https://costabravarentaboat.app

---

## 1. Resumen Ejecutivo

### 1.1 Descripción
Plataforma full-stack de alquiler de barcos en Blanes, Costa Brava. Combina:
- **Frontend público**: Catálogo, reservas, blog, destinos
- **CRM administrativo**: Gestión de flota, reservas, clientes
- **Chatbot WhatsApp con IA**: Atención automatizada con OpenAI

### 1.2 Información del Negocio
| Campo | Valor |
|-------|-------|
| Ubicación | Puerto de Blanes, Girona, España |
| Coordenadas | 41.6667° N, 2.7833° E |
| Teléfono | +34 683 172 154 |
| Email | costabravarentboat@gmail.com |
| Temporada | Abril - Octubre |

### 1.3 Modelo de Negocio
- **Sin licencia**: Barcos hasta 15 CV (no requieren titulación)
- **Con licencia**: Requieren PER o titulación náutica
- **Duraciones**: 1h, 2h, 3h, 4h, 6h, 8h
- **Temporadas**: BAJA (abr-jun, sep-oct), MEDIA (jul), ALTA (ago)

---

## 2. Stack Tecnológico

### 2.1 Frontend
```
React 18.3 + TypeScript 5.6 + Vite 5.4
├── Routing: Wouter 3.3
├── Estado: TanStack React Query 5.60
├── UI: TailwindCSS 3.4 + Radix UI + shadcn/ui
├── Formularios: React Hook Form 7.55 + Zod
├── Animaciones: Framer Motion 11.13
└── SEO: React Helmet Async
```

### 2.2 Backend
```
Express.js 4.21 + TypeScript
├── DB: PostgreSQL 16 (Neon serverless)
├── ORM: Drizzle ORM 0.39
├── Auth: Replit Auth (OIDC) + PIN admin
├── Sesiones: express-session + connect-pg-simple
└── Compresión: Gzip level 6
```

### 2.3 Servicios Externos
| Servicio | Uso | Package |
|----------|-----|---------|
| Stripe | Pagos | stripe@18.5 |
| SendGrid | Email | @sendgrid/mail@8.1 |
| Twilio | WhatsApp | twilio@5.12 |
| OpenAI | Chatbot IA | openai@6.16 |
| Google Cloud | Storage | @google-cloud/storage@7.17 |

---

## 3. Estructura del Proyecto

```
costa-brava-rent-a-boat/
├── client/src/
│   ├── App.tsx                 # Router + providers
│   ├── components/             # React components
│   │   ├── Navigation.tsx      # Header
│   │   ├── Hero.tsx           # Landing hero
│   │   ├── FleetSection.tsx   # Grid barcos
│   │   ├── BookingFlow.tsx    # Wizard reservas
│   │   ├── BoatDetailPage.tsx # Detalle barco
│   │   ├── CRMDashboard.tsx   # Admin (114KB)
│   │   ├── SEO.tsx            # Meta tags
│   │   └── ui/                # 49 componentes shadcn
│   ├── pages/                 # Rutas (lazy-loaded)
│   ├── hooks/                 # use-language, usePrefetch
│   └── utils/                 # seo-config.ts (1118 líneas)
│
├── server/
│   ├── index.ts               # Express setup
│   ├── routes.ts              # API endpoints (2061 líneas)
│   ├── storage.ts             # Data access layer
│   ├── db.ts                  # PostgreSQL connection
│   └── whatsapp/              # Chatbot completo
│       ├── aiService.ts       # OpenAI integration
│       ├── ragService.ts      # Embeddings + búsqueda
│       ├── chatMemoryService.ts
│       └── functionCallingService.ts
│
└── shared/
    ├── schema.ts              # Drizzle schemas (593 líneas)
    ├── pricing.ts             # Cálculos precios
    └── boatData.ts            # Datos flota (481 líneas)
```

---

## 4. Base de Datos - Tablas Principales

### 4.1 boats
```sql
id: varchar PK              -- "solar-450"
name: text NOT NULL
capacity: integer NOT NULL
requiresLicense: boolean NOT NULL
deposit: decimal(10,2) NOT NULL
displayOrder: integer DEFAULT 999
imageUrl: text
imageGallery: text[]
subtitle: text
description: text
specifications: JSON        -- {model, length, beam, engine, fuel, capacity, deposit}
equipment: text[]
included: text[]
features: text[]
pricing: JSON               -- {BAJA: {period, prices}, MEDIA: {...}, ALTA: {...}}
extras: JSON[]              -- [{name, price, icon}]
isActive: boolean DEFAULT true
```

### 4.2 bookings
```sql
id: UUID PK
customerId: UUID FK -> customers
boatId: varchar NOT NULL FK -> boats
bookingDate: timestamp WITH TZ NOT NULL
startTime: timestamp WITH TZ NOT NULL
endTime: timestamp WITH TZ NOT NULL
customerName: text NOT NULL
customerSurname: text NOT NULL
customerPhone: text NOT NULL
customerEmail: text
customerNationality: text NOT NULL
numberOfPeople: integer NOT NULL
totalHours: integer NOT NULL
subtotal: decimal(10,2) NOT NULL
extrasTotal: decimal(10,2) DEFAULT 0
deposit: decimal(10,2) NOT NULL
totalAmount: decimal(10,2) NOT NULL
stripePaymentIntentId: text
paymentStatus: text DEFAULT 'pending'    -- pending|completed|failed|refunded
bookingStatus: text DEFAULT 'draft'      -- draft|hold|pending_payment|confirmed|cancelled
source: text DEFAULT 'web'               -- web|admin
sessionId: text                          -- Para holds
expiresAt: timestamp WITH TZ             -- Expiración hold
notes: text
createdAt: timestamp DEFAULT now()

-- Índices importantes
INDEX booking_boat_time_idx ON (boatId, startTime, endTime)
INDEX active_bookings_idx ON (boatId, startTime, endTime)
  WHERE booking_status IN ('hold', 'pending_payment', 'confirmed')
```

### 4.3 Otras tablas
- `customers` - Perfiles extendidos
- `customer_users` - Auth (Replit OIDC)
- `booking_extras` - Extras por reserva
- `testimonials` - Opiniones verificadas
- `blog_posts` - Posts con Markdown
- `destinations` - Páginas de destinos
- `ai_chat_sessions` - Sesiones chatbot
- `ai_chat_messages` - Mensajes chatbot
- `knowledge_base` - RAG con embeddings
- `page_visits` - Analytics

---

## 5. API Endpoints Principales

### 5.1 Públicos
```
GET  /api/boats                    # Lista barcos activos
GET  /api/boats/:id                # Detalle barco
POST /api/boats/:id/check-availability
POST /api/quote                    # Cotización + hold temporal
GET  /api/bookings/:id             # Detalle reserva
POST /api/create-payment-intent    # Stripe PaymentIntent
POST /api/stripe-webhook           # Webhook Stripe
GET  /api/testimonials             # Testimonios verificados
GET  /api/blog                     # Posts publicados
GET  /api/blog/:slug               # Post por slug
GET  /api/destinations             # Destinos publicados
GET  /api/destinations/:slug       # Destino por slug
```

### 5.2 Cliente Autenticado
```
GET   /api/auth/user               # Usuario actual
POST  /api/auth/logout             # Logout
GET   /api/customer/profile        # Perfil
PATCH /api/customer/profile        # Actualizar perfil
GET   /api/customer/bookings       # Mis reservas
```

### 5.3 Admin (PIN: 0760)
```
POST   /api/admin/login            # Login con PIN
GET    /api/admin/bookings         # Todas las reservas
PATCH  /api/admin/bookings/:id     # Actualizar reserva
GET    /api/admin/customers        # Lista clientes
GET    /api/admin/stats            # Dashboard stats
POST   /api/admin/boats            # Crear barco
PATCH  /api/admin/boats/:id        # Actualizar barco
DELETE /api/admin/boats/:id        # Desactivar barco
POST   /api/admin/blog             # Crear post
PUT    /api/admin/blog/:id         # Actualizar post
DELETE /api/admin/blog/:id         # Eliminar post
```

### 5.4 WhatsApp Chatbot
```
POST /api/whatsapp/webhook         # Twilio webhook
GET  /api/whatsapp/health          # Health check
GET  /api/chatbot/analytics        # Métricas
GET  /api/chatbot/leads            # Lista leads
```

### 5.5 SEO
```
GET /sitemap.xml                   # Índice sitemaps
GET /sitemap-pages.xml             # Páginas estáticas
GET /sitemap-boats.xml             # Barcos + imágenes
GET /sitemap-blog.xml              # Blog posts
GET /sitemap-destinations.xml      # Destinos
```

---

## 6. Flota de Barcos

### 6.1 Sin Licencia
| ID | Nombre | Capacidad | Depósito | Combustible |
|----|--------|-----------|----------|-------------|
| solar-450 | Solar 450 | 5 | 250€ | Incluido |
| remus-450 | Remus 450 | 5 | 200€ | Incluido |
| astec-400 | Astec 400 | 4 | 200€ | Incluido |
| astec-450 | Astec 450 | 5 | 300€ | Incluido |

### 6.2 Con Licencia
| ID | Nombre | Capacidad | Depósito | Combustible |
|----|--------|-----------|----------|-------------|
| mingolla-brava-19 | Mingolla Brava 19 | 6 | 500€ | NO incluido |
| trimarchi-57s | Trimarchi 57S | 7 | 500€ | NO incluido |
| pacific-craft-625 | Pacific Craft 625 | 7 | 500€ | NO incluido |

### 6.3 Precios (Ejemplo: Solar 450)
| Temporada | 1h | 2h | 3h | 4h | 6h | 8h |
|-----------|----|----|----|----|----|----|
| BAJA | 75€ | 115€ | 130€ | 150€ | 190€ | 220€ |
| MEDIA | 85€ | 130€ | 160€ | 180€ | 230€ | 270€ |
| ALTA | 95€ | 140€ | 170€ | 195€ | 240€ | 290€ |

### 6.4 Extras Disponibles
| Extra | Precio |
|-------|--------|
| Parking | 10€ |
| Nevera | 5€ |
| Bebidas | 2,5€/ud |
| Snorkel | 7,5€ |
| Paddle Surf | 25€ |
| Seascooter | 50€ |

---

## 7. Sistema de Reservas

### 7.1 Estados
```
draft → hold → pending_payment → confirmed
                     ↓
                 cancelled
```

### 7.2 Flujo
1. Usuario selecciona barco, fecha, duración
2. `POST /api/quote` → Crea hold temporal (30 min)
3. Usuario completa datos personales
4. `POST /api/create-payment-intent` → Stripe
5. Usuario paga
6. Stripe webhook → `confirmed`

### 7.3 Buffer de Disponibilidad
- Desarrollo: 5 minutos
- Producción: 20 minutos

---

## 8. Chatbot WhatsApp

### 8.1 Stack
- **LLM**: OpenAI gpt-4o-mini
- **Embeddings**: text-embedding-3-small
- **RAG**: Knowledge base con búsqueda semántica
- **Function Calling**: Disponibilidad y precios en tiempo real

### 8.2 Lead Scoring
| Intent | Puntos |
|--------|--------|
| booking_request | +30 |
| availability | +20 |
| price_inquiry | +15 |
| boat_info | +10 |

### 8.3 Detección de Idioma
```
+34 → es    +33 → fr    +49 → de
+31 → nl    +39 → it    +7  → ru
```

---

## 9. SEO

### 9.1 Idiomas Soportados
es, en, ca, fr, de, nl, it, ru (8 idiomas)

### 9.2 JSON-LD Schemas
- LocalBusiness, Service, Product
- BreadcrumbList, FAQPage, ItemList
- Article, Place/TouristAttraction

### 9.3 Sitemaps
- `/sitemap.xml` - Índice
- `/sitemap-pages.xml` - ~80 URLs
- `/sitemap-boats.xml` - ~56 URLs con imágenes
- `/sitemap-blog.xml` - Variable
- `/sitemap-destinations.xml` - Variable

---

## 10. Variables de Entorno

```bash
# Base de datos
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG....

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# OpenAI
OPENAI_API_KEY=sk-...

# Admin
ADMIN_TOKEN=your-secure-token
ADMIN_PIN=0760

# Replit Auth
ISSUER_URL=https://replit.com/auth/oauth
```

---

## 11. Rutas Frontend

### Públicas
| Ruta | Descripción |
|------|-------------|
| `/` | Home |
| `/barco/:id` | Detalle barco |
| `/blog` | Lista posts |
| `/blog/:slug` | Post individual |
| `/destinos/:slug` | Destino |
| `/testimonios` | Opiniones |
| `/faq` | FAQ |
| `/alquiler-barcos-blanes` | Landing Blanes |
| `/alquiler-barcos-lloret-de-mar` | Landing Lloret |
| `/alquiler-barcos-tossa-de-mar` | Landing Tossa |
| `/barcos-sin-licencia` | Categoría |
| `/barcos-con-licencia` | Categoría |

### Autenticadas
| Ruta | Auth |
|------|------|
| `/login` | - |
| `/mi-cuenta` | Customer |
| `/crm` | Admin (PIN) |

---

## 12. Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm run start

# Type check
npm run check

# Database push
npm run db:push
```

---

## 13. Limitaciones Conocidas

- ⚠️ Sin tests automatizados
- ⚠️ Sin ESLint/Prettier configurado
- ⚠️ Archivos grandes: CRMDashboard.tsx (114KB), routes.ts (70KB)
- ⚠️ PIN admin fijo (0760)
- ⚠️ Booking desde WhatsApp no crea reserva real
- ⚠️ Offer Schema SEO: rangos discontinuos se fusionan

---

## 14. Archivos Clave para Modificaciones

| Área | Archivo |
|------|---------|
| Rutas frontend | `client/src/App.tsx` |
| Componentes UI | `client/src/components/` |
| API endpoints | `server/routes.ts` |
| Schemas DB | `shared/schema.ts` |
| Precios | `shared/pricing.ts` |
| Datos barcos | `shared/boatData.ts` |
| SEO config | `client/src/utils/seo-config.ts` |
| Chatbot IA | `server/whatsapp/aiService.ts` |
| Data access | `server/storage.ts` |

---

## 15. Contacto y Recursos

- **Dominio**: https://costabravarentaboat.app
- **Repositorio**: costa-brava-rent-a-boat
- **Documentación adicional**:
  - `replit.md` - Arquitectura sistema
  - `design_guidelines.md` - Guías diseño
  - `AUDITORIA_SEO_COSTA_BRAVA_2025.md` - SEO detallado
