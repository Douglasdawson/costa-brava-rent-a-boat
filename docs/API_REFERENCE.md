# API Reference - Costa Brava Rent a Boat

> Ultima actualizacion: Marzo 2026
> Base URL: `https://costabravarentaboat.app`

## Tabla de Contenidos

- [Autenticacion](#autenticacion)
- [Rate Limiting](#rate-limiting)
- [1. Publicas - Barcos](#1-publicas---barcos)
- [2. Publicas - Disponibilidad](#2-publicas---disponibilidad)
- [3. Publicas - Reservas](#3-publicas---reservas)
- [4. Publicas - Blog](#4-publicas---blog)
- [5. Publicas - Destinos](#5-publicas---destinos)
- [6. Publicas - Testimonios](#6-publicas---testimonios)
- [7. Publicas - Galeria](#7-publicas---galeria)
- [8. Publicas - Tarjetas Regalo](#8-publicas---tarjetas-regalo)
- [9. Publicas - Descuentos](#9-publicas---descuentos)
- [10. Publicas - Newsletter](#10-publicas---newsletter)
- [11. Publicas - Social Proof](#11-publicas---social-proof)
- [12. Publicas - Consultas (Booking Inquiries)](#12-publicas---consultas-booking-inquiries)
- [13. Publicas - SEO y Sitemaps](#13-publicas---seo-y-sitemaps)
- [14. Publicas - Imagenes](#14-publicas---imagenes)
- [15. Publicas - Descuentos Automaticos](#15-publicas---descuentos-automaticos)
- [16. Pagos - Stripe](#16-pagos---stripe)
- [17. Auth SaaS (Email + Password)](#17-auth-saas-email--password)
- [18. Auth Legacy (PIN + Username/Password)](#18-auth-legacy-pin--usernamepassword)
- [19. Auth Cliente (Replit Auth)](#19-auth-cliente-replit-auth)
- [20. Admin - Flota](#20-admin---flota)
- [21. Admin - Reservas](#21-admin---reservas)
- [22. Admin - Clientes](#22-admin---clientes)
- [23. Admin - Estadisticas y Reportes](#23-admin---estadisticas-y-reportes)
- [24. Admin - Mantenimiento](#24-admin---mantenimiento)
- [25. Admin - Documentos de Barcos](#25-admin---documentos-de-barcos)
- [26. Admin - Inventario](#26-admin---inventario)
- [27. Admin - Blog](#27-admin---blog)
- [28. Admin - Destinos](#28-admin---destinos)
- [29. Admin - Galeria](#29-admin---galeria)
- [30. Admin - Tarjetas Regalo](#30-admin---tarjetas-regalo)
- [31. Admin - Descuentos](#31-admin---descuentos)
- [32. Admin - Empleados](#32-admin---empleados)
- [33. Admin - Marketing (Newsletter y GBP)](#33-admin---marketing-newsletter-y-gbp)
- [34. Admin - Consultas (Inquiries)](#34-admin---consultas-inquiries)
- [35. Admin - Tenants](#35-admin---tenants)
- [36. Admin - Utilidades](#36-admin---utilidades)
- [37. Tenant (Multi-tenant SaaS)](#37-tenant-multi-tenant-saas)
- [38. Super Admin (Plataforma)](#38-super-admin-plataforma)
- [39. WhatsApp - Twilio Webhooks](#39-whatsapp---twilio-webhooks)
- [40. WhatsApp - Meta Cloud API Webhooks](#40-whatsapp---meta-cloud-api-webhooks)
- [41. Chatbot Analytics](#41-chatbot-analytics)
- [42. iCal - Calendario](#42-ical---calendario)
- [43. Health Check](#43-health-check)

---

## Autenticacion

El sistema soporta multiples metodos de autenticacion:

| Metodo | Header | Obtencion | Duracion |
|--------|--------|-----------|----------|
| Admin (PIN legacy) | `Authorization: Bearer <token>` | `POST /api/admin/login` | 24h |
| Admin (user/pass legacy) | `Authorization: Bearer <token>` | `POST /api/admin/login-user` | 24h |
| SaaS (email/pass) | `Authorization: Bearer <accessToken>` | `POST /api/auth/login` | 24h (refresh 30d) |
| Super Admin | `Authorization: Bearer <token>` | Token legacy sin `tenantId` | 24h |
| Cliente (Replit Auth) | Cookie de sesion | Replit OIDC | Sesion |

Todos los tokens JWT se firman con `JWT_SECRET` (minimo 32 caracteres).

## Rate Limiting

| Endpoint | Limite | Ventana |
|----------|--------|---------|
| `POST /api/admin/login` | 5 intentos | 15 minutos |
| `POST /api/admin/login-user` | 5 intentos | 15 minutos |
| `POST /api/auth/login` | 5 intentos | 15 minutos |
| `POST /api/testimonials` | 5 envios | 1 hora |
| `POST /api/newsletter/subscribe` | 5 envios | 1 hora |
| `POST /api/booking-inquiries` | 5 envios | 1 hora |
| `POST /api/gallery/submit` | 5 envios | 1 hora |

---

## 1. Publicas - Barcos

### `GET /api/boats`

Obtiene todos los barcos activos.

- **Autenticacion:** Ninguna
- **Cache:** `max-age=60`
- **Respuesta:** `200 OK`

```json
[
  {
    "id": "astec-400",
    "name": "Astec 400",
    "capacity": 5,
    "requiresLicense": false,
    "deposit": "200.00",
    "isActive": true,
    "imageUrl": "/images/boats/astec-400/photo.webp",
    "imageGallery": ["/images/boats/astec-400/gallery1.webp"],
    "subtitle": "Barco compacto y agil",
    "description": "...",
    "specifications": { "capacity": "5 personas", "deposit": "200EUR" },
    "equipment": ["GPS", "Toldo"],
    "included": ["Combustible", "Seguro"],
    "features": ["Sin licencia"],
    "pricing": { "1h": 80, "2h": 140 },
    "extras": [{ "id": "snorkel", "name": "Kit snorkel", "price": 10 }],
    "displayOrder": 0
  }
]
```

---

### `GET /api/boats/:id`

Obtiene un barco por su ID.

- **Autenticacion:** Ninguna
- **Parametros URL:** `id` - ID del barco (ej: `astec-400`)
- **Respuesta:** `200 OK` - Objeto barco (mismo formato que el array anterior)
- **Errores:**
  - `404` - `{ "message": "Boat not found" }`

---

### `GET /api/boats/weekly-bookings`

Reservas de la ultima semana por barco (social proof para tarjetas de barcos).

- **Autenticacion:** Ninguna
- **Cache:** `max-age=300`
- **Respuesta:** `200 OK`

```json
{
  "astec-400": 3,
  "remus-450": 5,
  "solar-450": 2
}
```

---

### `POST /api/boats/:id/check-availability`

Verifica disponibilidad de un barco para un rango horario.

- **Autenticacion:** Ninguna
- **Parametros URL:** `id` - ID del barco
- **Body:**

```json
{
  "startTime": "2026-07-15T10:00:00.000Z",
  "endTime": "2026-07-15T13:00:00.000Z"
}
```

- **Respuesta (disponible):** `200 OK`

```json
{
  "available": true,
  "reason": null,
  "conflictingBookings": []
}
```

- **Respuesta (no disponible):** `200 OK`

```json
{
  "available": false,
  "reason": "booking_conflict",
  "conflictingBookings": [
    {
      "id": "abc123",
      "startTime": "2026-07-15T09:00:00.000Z",
      "endTime": "2026-07-15T12:00:00.000Z",
      "status": "confirmed",
      "customerName": "Juan G."
    }
  ]
}
```

- **Razones posibles de `reason`:** `missing_params`, `invalid_time_range`, `out_of_season`, `boat_not_found`, `booking_conflict`, `server_error`
- **Errores:**
  - `400` - Datos invalidos o rango horario incorrecto
  - `404` - Barco no encontrado

---

### `POST /api/check-availability`

Alternativa al anterior, con `boatId` en el body.

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "boatId": "astec-400",
  "startTime": "2026-07-15T10:00:00.000Z",
  "endTime": "2026-07-15T13:00:00.000Z"
}
```

- **Respuesta:** Identica a `POST /api/boats/:id/check-availability`

---

## 2. Publicas - Disponibilidad

### `GET /api/availability`

Disponibilidad por slots de media hora para un barco en una fecha.

- **Autenticacion:** Ninguna
- **Cache:** `max-age=60`
- **Query params:**
  - `boatId` (string, requerido) - ID del barco
  - `date` (string, requerido) - Formato `YYYY-MM-DD`
- **Respuesta:** `200 OK`

```json
{
  "availableSlots": [
    { "time": "09:00", "maxDuration": 4 },
    { "time": "09:30", "maxDuration": 3 },
    { "time": "14:00", "maxDuration": 5 }
  ],
  "unavailableSlots": ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"]
}
```

- **Errores:**
  - `400` - Formato de fecha o parametros invalidos
  - `404` - Barco no encontrado

---

### `GET /api/boats/:id/availability`

Disponibilidad mensual de un barco (para calendario).

- **Autenticacion:** Ninguna
- **Parametros URL:** `id` - ID del barco
- **Query params:** `month` (string, requerido) - Formato `YYYY-MM`
- **Respuesta:** `200 OK`

```json
{
  "boatId": "astec-400",
  "month": "2026-07",
  "days": {
    "2026-07-01": {
      "status": "available",
      "slots": [
        { "time": "09:00", "available": true },
        { "time": "10:00", "available": true }
      ]
    },
    "2026-07-15": {
      "status": "partial",
      "slots": [
        { "time": "09:00", "available": false },
        { "time": "14:00", "available": true }
      ]
    }
  }
}
```

- **Valores de `status`:** `available`, `partial`, `booked`, `off_season`, `past`

---

### `GET /api/fleet-availability`

Disponibilidad de toda la flota para el proximo sabado (indicador de escasez).

- **Autenticacion:** Ninguna
- **Cache:** `max-age=300`
- **Respuesta:** `200 OK`

```json
{
  "date": "2026-07-18",
  "boats": {
    "astec-400": { "availableSlots": 15, "totalSlots": 21 },
    "remus-450": { "availableSlots": 8, "totalSlots": 21 },
    "solar-450": { "availableSlots": 21, "totalSlots": 21 }
  }
}
```

---

## 3. Publicas - Reservas

### `POST /api/quote`

Genera una cotizacion de precio y crea un hold temporal (30 min).

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "boatId": "astec-400",
  "startTime": "2026-07-15T10:00:00.000Z",
  "endTime": "2026-07-15T13:00:00.000Z",
  "numberOfPeople": 4,
  "extras": ["snorkel", "cooler"]
}
```

- **Validaciones:**
  - Hora de inicio >= 09:00 y fin <= 20:00 (hora de Espana)
  - Solo temporada abril-octubre
  - Duracion minima: 2h en temporada alta y fines de semana
  - Personas <= capacidad del barco
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "holdId": "uuid-del-hold",
  "quote": {
    "startTime": "2026-07-15T10:00:00.000Z",
    "endTime": "2026-07-15T13:00:00.000Z",
    "totalHours": 3,
    "numberOfPeople": 4,
    "basePrice": 210,
    "extrasPrice": 20,
    "deposit": 200,
    "total": 430
  },
  "hold": {
    "id": "uuid-del-hold",
    "sessionId": "quote-1234567890-abc123",
    "expiresAt": "2026-07-15T10:30:00.000Z",
    "expiresInMinutes": 30
  }
}
```

- **Errores:**
  - `400` - Datos invalidos, fuera de horario, fuera de temporada, capacidad excedida
  - `404` - Barco no encontrado
  - `409` - Conflicto de disponibilidad (incluye `conflictingBookings`)

---

### `GET /api/bookings/cancel-info/:token`

Obtiene informacion de cancelacion para un booking (enlace publico).

- **Autenticacion:** Ninguna (usa token UUID de cancelacion)
- **Parametros URL:** `token` - UUID de cancelacion
- **Respuesta:** `200 OK`

```json
{
  "booking": {
    "id": "uuid",
    "customerName": "Juan",
    "customerSurname": "Garcia",
    "startTime": "2026-07-15T10:00:00.000Z",
    "endTime": "2026-07-15T13:00:00.000Z",
    "totalAmount": "430.00",
    "bookingStatus": "confirmed",
    "boatName": "Astec 400",
    "language": "es"
  },
  "refundPolicy": {
    "hoursUntilStart": 72.5,
    "refundPercentage": 100,
    "refundAmount": 430
  }
}
```

- **Politica de reembolso:**
  - >= 48h antes: 100%
  - >= 24h antes: 50%
  - < 24h: 0%
- **Errores:**
  - `400` - Token invalido
  - `404` - Reserva no encontrada
  - `410` - Ya cancelada
  - `422` - Estado no cancelable

---

### `POST /api/bookings/cancel/:token`

Cancela una reserva via token publico.

- **Autenticacion:** Ninguna (usa token UUID)
- **Parametros URL:** `token` - UUID de cancelacion
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "refundAmount": 430,
  "refundPercentage": 100,
  "message": "Reserva cancelada. Reembolso de 430.00EUR (100%) en proceso."
}
```

- **Errores:**
  - `400` - Token invalido
  - `404` - No encontrada, ya cancelada, o no cancelable

---

## 4. Publicas - Blog

### `GET /api/blog`

Lista todos los posts publicados del blog.

- **Autenticacion:** Ninguna
- **Query params:** `category` (string, opcional) - Filtrar por categoria
- **Respuesta:** `200 OK` - Array de posts

```json
[
  {
    "id": "uuid",
    "title": "Las mejores calas de la Costa Brava",
    "slug": "mejores-calas-costa-brava",
    "excerpt": "Descubre las calas...",
    "content": "...",
    "category": "destinos",
    "featuredImage": "/images/blog/calas.webp",
    "isPublished": true,
    "publishedAt": "2026-03-01T00:00:00.000Z",
    "titleByLang": { "en": "Best coves in Costa Brava", "fr": "..." },
    "excerptByLang": { "en": "Discover the coves...", "fr": "..." }
  }
]
```

---

### `GET /api/blog/:slug`

Obtiene un post de blog por su slug.

- **Autenticacion:** Ninguna
- **Parametros URL:** `slug` - Slug del post
- **Respuesta:** `200 OK` - Objeto post
- **Errores:**
  - `404` - `{ "message": "Blog post not found" }`

---

## 5. Publicas - Destinos

### `GET /api/destinations`

Lista todos los destinos publicados.

- **Autenticacion:** Ninguna
- **Respuesta:** `200 OK` - Array de destinos

```json
[
  {
    "id": "uuid",
    "name": "Cala Sant Francesc",
    "slug": "cala-sant-francesc",
    "description": "...",
    "featuredImage": "/images/destinations/sant-francesc.webp",
    "isPublished": true
  }
]
```

---

### `GET /api/destinations/:slug`

Obtiene un destino por su slug.

- **Autenticacion:** Ninguna
- **Parametros URL:** `slug` - Slug del destino
- **Respuesta:** `200 OK` - Objeto destino
- **Errores:**
  - `404` - `{ "message": "Destination not found" }`

---

## 6. Publicas - Testimonios

### `GET /api/testimonials`

Lista testimonios verificados.

- **Autenticacion:** Ninguna
- **Query params:** `boatId` (string, opcional) - Filtrar por barco
- **Respuesta:** `200 OK` - Array de testimonios

---

### `POST /api/testimonials`

Envia un nuevo testimonio (no verificado por defecto).

- **Autenticacion:** Ninguna
- **Rate limit:** 5/hora por IP
- **Body:** Segun `insertTestimonialSchema`
- **Respuesta:** `201 Created` - Objeto testimonio creado
- **Errores:**
  - `400` - Datos invalidos
  - `429` - Demasiadas solicitudes

---

## 7. Publicas - Galeria

### `GET /api/gallery`

Obtiene fotos aprobadas de la galeria de clientes.

- **Autenticacion:** Ninguna
- **Respuesta:** `200 OK` - Array de fotos aprobadas

---

### `POST /api/gallery/submit`

Envia una foto de cliente para revision.

- **Autenticacion:** Ninguna
- **Rate limit:** 5/hora por IP
- **Body:**

```json
{
  "imageUrl": "https://storage.example.com/photo.jpg",
  "caption": "Dia increible en la Costa Brava",
  "customerName": "Maria",
  "boatName": "Astec 400",
  "boatId": "astec-400",
  "tripDate": "2026-07-15"
}
```

- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "photo": { "id": "uuid", "...": "..." },
  "message": "Foto enviada. Sera revisada antes de publicarse."
}
```

- **Errores:**
  - `400` - Datos invalidos
  - `429` - Demasiadas solicitudes

---

### `POST /api/gallery/upload-url`

Obtiene una URL de subida para Object Storage.

- **Autenticacion:** Ninguna
- **Respuesta:** `200 OK`

```json
{
  "uploadURL": "https://storage.example.com/upload?token=..."
}
```

---

## 8. Publicas - Tarjetas Regalo

### `POST /api/gift-cards/purchase`

Compra una tarjeta regalo (crea PaymentIntent de Stripe).

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "amount": 100,
  "purchaserName": "Juan Garcia",
  "purchaserEmail": "juan@example.com",
  "recipientName": "Maria Lopez",
  "recipientEmail": "maria@example.com",
  "personalMessage": "Feliz cumpleanos!"
}
```

- **Validaciones:** Importe entre 10 y 1000 EUR
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "giftCardId": "uuid",
  "clientSecret": "pi_xxx_secret_yyy",
  "code": "CB-A3B5K7M2"
}
```

- **Errores:**
  - `400` - Datos invalidos
  - `503` - Stripe no disponible

---

### `POST /api/gift-cards/validate`

Valida un codigo de tarjeta regalo.

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "code": "CB-A3B5K7M2"
}
```

- **Respuesta (valida):** `200 OK`

```json
{
  "valid": true,
  "code": "CB-A3B5K7M2",
  "remainingAmount": "100.00",
  "recipientName": "Maria Lopez",
  "expiresAt": "2027-03-11T00:00:00.000Z"
}
```

- **Respuesta (invalida):** `200 OK`

```json
{
  "valid": false,
  "message": "Esta tarjeta regalo ha expirado"
}
```

---

## 9. Publicas - Descuentos

### `POST /api/discounts/validate`

Valida un codigo de descuento.

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "code": "SPRING-ABC123-2026"
}
```

- **Respuesta (valido):** `200 OK`

```json
{
  "valid": true,
  "discountPercent": 10
}
```

- **Respuesta (invalido):** `200 OK`

```json
{
  "valid": false,
  "error": "Este codigo de descuento ha expirado"
}
```

---

## 10. Publicas - Newsletter

### `POST /api/newsletter/subscribe`

Suscripcion al newsletter.

- **Autenticacion:** Ninguna
- **Rate limit:** 5/hora por IP
- **Body:**

```json
{
  "email": "usuario@example.com",
  "language": "es",
  "source": "footer"
}
```

- **Valores de `source`:** `footer`, `popup`
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "id": "uuid"
}
```

- **Errores:**
  - `400` - Email invalido
  - `409` - Email ya suscrito
  - `429` - Demasiadas solicitudes

---

### `GET /api/newsletter/unsubscribe`

Cancela suscripcion (enlace en emails).

- **Autenticacion:** Ninguna
- **Query params:** `email` (string, requerido)
- **Respuesta:** `200 OK` - Pagina HTML de confirmacion

---

## 11. Publicas - Social Proof

### `GET /api/social-proof`

Reservas recientes para notificaciones FOMO.

- **Autenticacion:** Ninguna
- **Cache:** `max-age=300`
- **Respuesta:** `200 OK`

```json
{
  "activities": [
    {
      "name": "Juan",
      "nationality": "ES",
      "boatName": "Astec 400",
      "people": 4,
      "hours": 3,
      "date": "2026-07-15",
      "minutesAgo": 45
    }
  ]
}
```

---

## 12. Publicas - Consultas (Booking Inquiries)

### `POST /api/booking-inquiries`

Guarda una consulta de reserva desde el formulario web.

- **Autenticacion:** Ninguna
- **Rate limit:** 5/hora por IP
- **Body:** Segun `insertWhatsappInquirySchema`
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "id": "uuid"
}
```

---

## 13. Publicas - SEO y Sitemaps

### `GET /sitemap.xml`

Indice de sitemaps.

- **Autenticacion:** Ninguna
- **Content-Type:** `application/xml`
- **Cache:** `max-age=3600`

### `GET /sitemap-pages.xml`

Sitemap de paginas estaticas (con hreflang para 8 idiomas).

### `GET /sitemap-boats.xml`

Sitemap de barcos activos (con image tags y hreflang).

### `GET /sitemap-blog.xml`

Sitemap de posts de blog publicados (con image tags).

### `GET /sitemap-destinations.xml`

Sitemap de destinos publicados (con image tags y hreflang).

### `GET /llms.txt`

Archivo de texto plano para crawlers de IA.

- **Content-Type:** `text/plain`
- **Cache:** `max-age=86400`

---

## 14. Publicas - Imagenes

### `GET /img/resize`

Redimensiona y convierte imagenes a WebP con cache en memoria.

- **Autenticacion:** Ninguna
- **Query params:**
  - `file` (string, requerido) - Nombre del archivo
  - `w` (number, opcional) - Ancho en px (100-2000, default: 800)
  - `q` (number, opcional) - Calidad (10-100, default: 80)
- **Cache:** `max-age=31536000, immutable`
- **Content-Type:** `image/webp`
- **Errores:**
  - `400` - Parametro `file` faltante o ruta invalida
  - `404` - Imagen no encontrada
  - `500` - Error al procesar la imagen

---

## 15. Publicas - Descuentos Automaticos

### `GET /api/auto-discount/check`

Calcula descuentos automaticos basados en fecha y ocupacion.

- **Autenticacion:** Ninguna
- **Cache:** `max-age=30`
- **Query params:**
  - `boatId` (string, requerido)
  - `date` (string, requerido) - Formato `YYYY-MM-DD`
  - `price` (number, requerido) - Precio base
- **Respuesta:** `200 OK`

```json
{
  "hasDiscount": true,
  "discountPercent": 15,
  "discountedPrice": 178.50,
  "reason": "last_minute"
}
```

---

## 16. Pagos - Stripe

### `POST /api/create-payment-intent`

Crea un Stripe PaymentIntent para un hold o booking.

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "holdId": "uuid-del-hold"
}
```

O alternativamente:

```json
{
  "bookingId": "uuid-del-booking"
}
```

- **Nota:** Solo se cobra el importe del servicio (subtotal + extras). El deposito se cobra en efectivo en el puerto.
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx",
  "amount": 230,
  "currency": "eur"
}
```

- **Errores:**
  - `400` - Datos invalidos, hold no disponible, importe invalido
  - `404` - Hold/booking no encontrado
  - `410` - Hold expirado
  - `503` - Stripe no configurado

---

### `POST /api/create-checkout-session`

Crea una sesion de Stripe Checkout.

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "bookingId": "uuid"
}
```

- **Respuesta:** `200 OK`

```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_xxx"
}
```

---

### `POST /api/stripe-webhook`

Webhook de Stripe (payment_intent.succeeded, payment_intent.payment_failed).

- **Autenticacion:** Firma HMAC de Stripe (`STRIPE_WEBHOOK_SECRET`)
- **Content-Type:** `application/json` (raw body)
- **Eventos procesados:**
  - `payment_intent.succeeded` - Confirma booking y activa gift cards
  - `payment_intent.payment_failed` - Marca pago como fallido
- **Respuesta:** `200 OK` - `{ "received": true }`

---

### `POST /api/create-payment-intent-mock` (Solo desarrollo)

Crea un PaymentIntent mock para testing.

- **Autenticacion:** Ninguna
- **Solo disponible:** `NODE_ENV !== "production"`
- **Body:**

```json
{
  "holdId": "uuid-del-hold"
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "clientSecret": "pi_mock_xxx_secret_mock",
  "paymentIntentId": "pi_mock_xxx",
  "amount": 430,
  "currency": "eur",
  "mockMode": true,
  "note": "This is a mock payment for testing. Use /api/simulate-payment-success to complete the payment."
}
```

---

### `POST /api/simulate-payment-success` (Solo desarrollo)

Simula un pago exitoso.

- **Autenticacion:** Ninguna
- **Solo disponible:** `NODE_ENV !== "production"`
- **Body:**

```json
{
  "paymentIntentId": "pi_mock_xxx"
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "message": "Pago simulado exitosamente",
  "bookingId": "uuid",
  "status": "confirmed"
}
```

---

## 17. Auth SaaS (Email + Password)

### `POST /api/auth/register`

Crea una nueva cuenta con tenant en periodo de prueba (14 dias).

- **Autenticacion:** Ninguna
- **Rate limit:** 5 intentos / 15 min
- **Body:**

```json
{
  "email": "usuario@empresa.com",
  "password": "minimo8chars",
  "firstName": "Juan",
  "lastName": "Garcia",
  "companyName": "Mi Empresa Nautica"
}
```

- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "accessToken": "eyJhb...",
  "refreshToken": "abc123hex...",
  "user": {
    "id": "uuid",
    "email": "usuario@empresa.com",
    "firstName": "Juan",
    "lastName": "Garcia",
    "role": "owner"
  },
  "tenant": {
    "id": "uuid",
    "name": "Mi Empresa Nautica",
    "slug": "mi-empresa-nautica",
    "plan": "starter",
    "status": "trial",
    "trialEndsAt": "2026-03-25T00:00:00.000Z"
  },
  "message": "Cuenta creada exitosamente"
}
```

- **Errores:**
  - `400` - Datos invalidos
  - `409` - Ya existe una empresa con ese nombre

---

### `POST /api/auth/login`

Login con email y contrasena.

- **Autenticacion:** Ninguna
- **Rate limit:** 5 intentos / 15 min
- **Body:**

```json
{
  "email": "usuario@empresa.com",
  "password": "minimo8chars",
  "tenantSlug": "mi-empresa-nautica"
}
```

- **Nota:** `tenantSlug` es opcional. Si no se proporciona, se resuelve por subdominio o busqueda automatica.
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "accessToken": "eyJhb...",
  "refreshToken": "abc123hex...",
  "user": {
    "id": "uuid",
    "email": "usuario@empresa.com",
    "firstName": "Juan",
    "lastName": "Garcia",
    "role": "owner",
    "avatarUrl": null
  },
  "tenant": {
    "id": "uuid",
    "name": "Mi Empresa Nautica",
    "slug": "mi-empresa-nautica",
    "plan": "starter",
    "status": "trial",
    "logo": null,
    "primaryColor": null,
    "trialEndsAt": "2026-03-25T00:00:00.000Z"
  },
  "message": "Login exitoso"
}
```

- **Errores:**
  - `400` - Email pertenece a varias empresas (requiere `tenantSlug`)
  - `401` - Credenciales incorrectas
  - `403` - Empresa suspendida
  - `429` - Demasiados intentos

---

### `POST /api/auth/logout`

Invalida tokens (blacklist de access token + borrado de refresh token).

- **Autenticacion:** Bearer token (opcional, se invalida si presente)
- **Body (opcional):**

```json
{
  "refreshToken": "abc123hex..."
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "message": "Sesion cerrada correctamente"
}
```

---

### `POST /api/auth/refresh-token`

Obtiene un nuevo access token (rotacion de refresh token).

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "refreshToken": "abc123hex..."
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "accessToken": "eyJhb...(nuevo)",
  "refreshToken": "def456hex...(nuevo)"
}
```

- **Errores:**
  - `400` - Refresh token requerido
  - `401` - Token invalido o expirado

---

### `GET /api/auth/me`

Obtiene el usuario actual con info del tenant.

- **Autenticacion:** SaaS Bearer token (requireSaasAuth)
- **Respuesta:** `200 OK`

```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@empresa.com",
    "firstName": "Juan",
    "lastName": "Garcia",
    "role": "owner",
    "avatarUrl": null,
    "lastLoginAt": "2026-03-11T10:00:00.000Z",
    "createdAt": "2026-03-01T00:00:00.000Z"
  },
  "tenant": {
    "id": "uuid",
    "name": "Mi Empresa Nautica",
    "slug": "mi-empresa-nautica",
    "plan": "starter",
    "status": "trial",
    "logo": null,
    "primaryColor": null,
    "secondaryColor": null,
    "trialEndsAt": "2026-03-25T00:00:00.000Z"
  }
}
```

---

### `PATCH /api/auth/profile`

Actualiza el perfil del usuario actual.

- **Autenticacion:** SaaS Bearer token
- **Body:**

```json
{
  "firstName": "Juan Carlos",
  "lastName": "Garcia Lopez",
  "avatarUrl": "https://..."
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "user": { "id": "uuid", "email": "...", "firstName": "...", "lastName": "...", "role": "owner", "avatarUrl": "..." },
  "message": "Perfil actualizado"
}
```

---

### `POST /api/auth/forgot-password`

Solicita restablecimiento de contrasena (envia email).

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "email": "usuario@empresa.com"
}
```

- **Respuesta:** `200 OK` (siempre, para prevenir enumeracion de emails)

```json
{
  "success": true,
  "message": "Si el email existe, recibiras instrucciones para restablecer tu contrasena"
}
```

---

### `POST /api/auth/reset-password`

Restablece la contrasena con token del email.

- **Autenticacion:** Ninguna
- **Body:**

```json
{
  "token": "hex_token_del_email",
  "password": "nuevacontrasena123"
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "message": "Contrasena restablecida exitosamente"
}
```

- **Errores:**
  - `400` - Token invalido, expirado, o datos invalidos

---

### `POST /api/auth/migrate-admin-users`

Migra usuarios admin legacy a la tabla `users` (SaaS).

- **Autenticacion:** Admin Bearer token
- **Body (opcional):**

```json
{
  "tenantId": "uuid"
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "migrated": 3,
  "skipped": 1,
  "message": "Migracion completada"
}
```

---

## 18. Auth Legacy (PIN + Username/Password)

### `POST /api/admin/login`

Login con PIN (propietario).

- **Autenticacion:** Ninguna
- **Rate limit:** 5 intentos / 15 min
- **Body:**

```json
{
  "pin": "123456"
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "token": "eyJhb...",
  "role": "admin",
  "username": "ivan",
  "displayName": "Ivan",
  "message": "Login successful"
}
```

- **Errores:**
  - `401` - PIN incorrecto
  - `429` - Demasiados intentos
  - `503` - Admin no configurado

---

### `POST /api/admin/login-user`

Login con usuario y contrasena (empleados).

- **Autenticacion:** Ninguna
- **Rate limit:** 5 intentos / 15 min
- **Body:**

```json
{
  "username": "empleado1",
  "password": "contrasena123"
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "token": "eyJhb...",
  "role": "employee",
  "username": "empleado1",
  "displayName": "Carlos Martinez",
  "message": "Login successful"
}
```

- **Errores:**
  - `400` - Usuario y contrasena requeridos
  - `401` - Credenciales incorrectas
  - `429` - Demasiados intentos

---

### `GET /api/admin/me`

Info del admin actual (soporta tokens legacy y SaaS).

- **Autenticacion:** Admin Bearer token
- **Respuesta (legacy):** `200 OK`

```json
{
  "username": "ivan",
  "role": "admin"
}
```

- **Respuesta (SaaS):** `200 OK`

```json
{
  "username": "usuario@empresa.com",
  "role": "owner",
  "firstName": "Juan",
  "lastName": "Garcia",
  "tenantName": "Mi Empresa",
  "tenantSlug": "mi-empresa"
}
```

---

### `POST /api/admin/logout`

Cierra sesion admin (blacklist del token).

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "message": "Sesion cerrada correctamente"
}
```

---

## 19. Auth Cliente (Replit Auth)

### `GET /api/auth/user`

Obtiene el usuario cliente autenticado via Replit Auth.

- **Autenticacion:** Replit Auth (cookie de sesion)
- **Respuesta:** `200 OK` - Objeto usuario

---

### `GET /api/customer/profile`

Obtiene el perfil del cliente.

- **Autenticacion:** Replit Auth
- **Respuesta:** `200 OK` - Objeto cliente
- **Errores:**
  - `404` - Perfil no encontrado

---

### `PATCH /api/customer/profile`

Actualiza el perfil del cliente.

- **Autenticacion:** Replit Auth
- **Body:**

```json
{
  "firstName": "Maria",
  "lastName": "Lopez",
  "email": "maria@example.com",
  "phonePrefix": "+34",
  "phoneNumber": "611500372",
  "nationality": "ES",
  "preferredLanguage": "es"
}
```

---

### `GET /api/customer/bookings`

Obtiene las reservas del cliente autenticado.

- **Autenticacion:** Replit Auth
- **Respuesta:** `200 OK` - Array de bookings del cliente

---

## 20. Admin - Flota

### `GET /api/admin/boats`

Lista todos los barcos (incluidos inactivos) para el CRM.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de todos los barcos ordenados por `displayOrder`

---

### `POST /api/admin/boats`

Crea un nuevo barco.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertBoatSchema`
- **Respuesta:** `201 Created` - Objeto barco creado
- **Errores:**
  - `400` - Datos invalidos

---

### `PATCH /api/admin/boats/:id`

Actualiza un barco existente.

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `id` - ID del barco
- **Body:** Segun `updateBoatSchema` (campos parciales)
- **Respuesta:** `200 OK` - Objeto barco actualizado
- **Errores:**
  - `400` - Datos invalidos
  - `404` - Barco no encontrado

---

### `DELETE /api/admin/boats/:id`

Elimina un barco.

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `id` - ID del barco
- **Respuesta:** `200 OK`

```json
{
  "message": "Barco eliminado correctamente"
}
```

- **Errores:**
  - `404` - Barco no encontrado

---

### `POST /api/admin/boats/reorder`

Reordena los barcos (drag & drop en CRM).

- **Autenticacion:** Admin Bearer token
- **Body:**

```json
{
  "order": [
    { "id": "astec-400", "displayOrder": 0 },
    { "id": "remus-450", "displayOrder": 1 },
    { "id": "solar-450", "displayOrder": 2 }
  ]
}
```

- **Respuesta:** `200 OK`

```json
{
  "message": "Orden actualizado correctamente"
}
```

---

### `POST /api/admin/boats/:id/rename`

Renombra el ID (clave primaria) de un barco.

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `id` - ID actual del barco
- **Body:**

```json
{
  "newId": "nuevo-id-barco"
}
```

- **Respuesta:** `200 OK`

```json
{
  "message": "Boat ID renamed from viejo-id to nuevo-id-barco"
}
```

---

### `POST /api/admin/init-boats`

Inicializa los barcos desde `BOAT_DATA` (seeding).

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "message": "Boats initialization completed",
  "created": 7,
  "total": 7
}
```

---

### `POST /api/admin/boat-images/upload`

Genera una URL de subida para imagenes de barcos.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "uploadURL": "https://storage.example.com/upload?token=..."
}
```

---

### `POST /api/admin/boat-images/normalize`

Normaliza una URL de imagen del Object Storage.

- **Autenticacion:** Admin Bearer token
- **Body:**

```json
{
  "imageUrl": "https://storage.example.com/raw/image.jpg"
}
```

- **Respuesta:** `200 OK`

```json
{
  "normalizedPath": "boats/image.jpg"
}
```

---

## 21. Admin - Reservas

### `POST /api/admin/bookings`

Crea una reserva manualmente desde el CRM.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertBookingSchema` (se agrega `source: "admin"` automaticamente)
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "booking": { "id": "uuid", "...": "..." },
  "message": "Reserva creada exitosamente"
}
```

---

### `GET /api/admin/bookings`

Lista reservas paginadas con filtros.

- **Autenticacion:** Admin Bearer token
- **Query params:**
  - `page` (number, default: 1)
  - `limit` (number, default: 25, max: 100)
  - `status` (string, opcional) - Filtrar por estado
  - `search` (string, opcional) - Busqueda por nombre/telefono
  - `sortBy` (string, default: `startTime`) - Valores: `startTime`, `createdAt`, `bookingDate`, `customerName`, `boatId`, `totalAmount`, `bookingStatus`
  - `sortOrder` (string, default: `desc`) - `asc` o `desc`
- **Respuesta:** `200 OK`

```json
{
  "data": [{ "id": "uuid", "customerName": "Juan", "...": "..." }],
  "total": 150,
  "page": 1,
  "limit": 25,
  "totalPages": 6
}
```

---

### `GET /api/admin/bookings/calendar`

Reservas para vista de calendario (sin paginacion).

- **Autenticacion:** Admin Bearer token
- **Query params:**
  - `startDate` (date, requerido)
  - `endDate` (date, requerido)
  - `boatId` (string, opcional)
- **Respuesta:** `200 OK` - Array de bookings en el rango

---

### `GET /api/bookings/date/:date`

Reservas de una fecha especifica.

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `date` - Fecha (parseable por `Date()`)
- **Respuesta:** `200 OK` - Array de bookings

---

### `GET /api/bookings/:id`

Obtiene una reserva por ID (incluye extras).

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `id` - ID de la reserva
- **Respuesta:** `200 OK` - Objeto booking con extras
- **Errores:**
  - `404` - `{ "message": "Booking not found" }`

---

### `PATCH /api/admin/bookings/:id`

Actualiza una reserva.

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `id` - ID de la reserva
- **Body:** Segun `updateBookingSchema` (campos parciales)
- **Campos actualizables:** `customerName`, `customerSurname`, `customerPhone`, `customerEmail`, `customerNationality`, `numberOfPeople`, `boatId`, `startTime`, `endTime`, `totalHours`, `subtotal`, `extrasTotal`, `deposit`, `totalAmount`, `bookingStatus`, `paymentStatus`, `notes`
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "booking": { "id": "uuid", "...": "..." },
  "message": "Reserva actualizada exitosamente"
}
```

---

### `POST /api/bookings/:id/payment-status`

Actualiza el estado de pago de una reserva.

- **Autenticacion:** Admin Bearer token
- **Body:**

```json
{
  "status": "paid",
  "stripePaymentIntentId": "pi_xxx"
}
```

- **Valores de `status`:** `pending`, `paid`, `failed`, `cancelled`, `refunded`

---

### `POST /api/bookings/:id/whatsapp-status`

Actualiza el estado de notificaciones WhatsApp.

- **Autenticacion:** Admin Bearer token
- **Body:**

```json
{
  "confirmationSent": true,
  "reminderSent": false
}
```

---

### `POST /api/cleanup-expired-holds`

Limpia holds temporales expirados.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "message": "Se limpiaron 5 holds expirados",
  "cleaned": 5
}
```

---

### `POST /api/admin/bookings/:id/refund`

Emite un reembolso via Stripe.

- **Autenticacion:** Admin Bearer token
- **Body:**

```json
{
  "amount": 230,
  "reason": "requested_by_customer"
}
```

- **Valores de `reason`:** `duplicate`, `fraudulent`, `requested_by_customer`
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "refundId": "re_xxx",
  "amount": 230,
  "bookingId": "uuid"
}
```

- **Errores:**
  - `400` - Sin pago Stripe, importe excede maximo
  - `404` - Reserva no encontrada
  - `409` - Ya reembolsada
  - `503` - Stripe no disponible

---

## 22. Admin - Clientes

### `GET /api/admin/customers`

Lista clientes paginados con busqueda y filtros.

- **Autenticacion:** Admin Bearer token
- **Query params:**
  - `page` (number, default: 1)
  - `limit` (number, default: 25, max: 100)
  - `search` (string, opcional)
  - `segment` (string, opcional)
  - `nationality` (string, opcional)
  - `sortBy` (string, default: `lastBookingDate`) - Valores: `name`, `totalBookings`, `totalSpent`, `lastBookingDate`, `createdAt`
  - `sortOrder` (string, default: `desc`)
- **Respuesta:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Juan",
      "surname": "Garcia",
      "email": "juan@example.com",
      "phone": "+34611500372",
      "nationality": "ES",
      "segment": "vip",
      "totalBookings": 5,
      "totalSpent": "2150.00",
      "firstBookingDate": "2025-06-15",
      "lastBookingDate": "2026-07-10",
      "notes": "Cliente frecuente",
      "tags": ["vip", "familia"]
    }
  ],
  "total": 85,
  "page": 1,
  "limit": 25,
  "totalPages": 4
}
```

---

### `GET /api/admin/customers/:id`

Obtiene un cliente con historial de reservas.

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `id` - ID del cliente
- **Respuesta:** `200 OK` - Objeto cliente con bookings
- **Errores:**
  - `404` - Cliente no encontrado

---

### `PATCH /api/admin/customers/:id`

Actualiza datos del cliente (notas, tags, etc.).

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `updateCrmCustomerSchema`
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "customer": { "id": "uuid", "...": "..." },
  "message": "Cliente actualizado"
}
```

---

### `POST /api/admin/customers/sync`

Sincroniza clientes desde datos de reservas.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "message": "Sincronizacion completada: 10 creados, 5 actualizados",
  "created": 10,
  "updated": 5
}
```

---

### `GET /api/admin/customers/export`

Exporta clientes como CSV.

- **Autenticacion:** Admin Bearer token
- **Content-Type:** `text/csv; charset=utf-8`
- **Content-Disposition:** `attachment; filename=clientes_YYYY-MM-DD.csv`
- **Columnas:** Nombre, Apellidos, Email, Telefono, Nacionalidad, Documento, Segmento, Total Reservas, Total Gastado, Primera Reserva, Ultima Reserva, Notas, Tags

---

### `POST /api/admin/checkins`

Registra un check-in o check-out.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertCheckinSchema`
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "checkin": { "id": "uuid", "type": "checkin", "...": "..." },
  "message": "Check-in registrado correctamente"
}
```

- **Errores:**
  - `404` - Reserva no encontrada
  - `409` - Ya existe un check-in/checkout para esta reserva

---

### `GET /api/admin/checkins/booking/:bookingId`

Obtiene check-ins de una reserva.

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `bookingId` - ID de la reserva
- **Respuesta:** `200 OK` - Array de check-ins

---

## 23. Admin - Estadisticas y Reportes

### `GET /api/admin/stats`

Dashboard con metricas principales.

- **Autenticacion:** Admin Bearer token
- **Query params:** `period` - Valores: `today` (default), `week`, `month`, `season`, `year`
- **Respuesta:** `200 OK`

```json
{
  "totalBookings": 25,
  "totalRevenue": 12500,
  "averageBookingValue": 500,
  "occupancyRate": 0.72,
  "activeBoats": 7,
  "boatsInMaintenance": 1,
  "period": "month"
}
```

---

### `GET /api/admin/stats/revenue-trend`

Tendencia de ingresos para graficos.

- **Autenticacion:** Admin Bearer token
- **Query params:** `period` - Valores: `30d` (default), `90d`, `365d`
- **Respuesta:** `200 OK` - Array de { date, revenue }

---

### `GET /api/admin/stats/boats-performance`

Rendimiento comparativo de barcos.

- **Autenticacion:** Admin Bearer token
- **Query params:** `period` - Valores: `month` (default), `season`, `year`
- **Respuesta:** `200 OK` - Array de rendimiento por barco

---

### `GET /api/admin/stats/status-distribution`

Distribucion de estados de reservas.

- **Autenticacion:** Admin Bearer token
- **Query params:**
  - `startDate` (date, opcional, default: 1 enero del ano)
  - `endDate` (date, opcional, default: hoy)
- **Respuesta:** `200 OK` - Objeto con conteos por estado

---

### `GET /api/admin/reports/fleet-utilization`

Reporte de utilizacion de flota con costes de mantenimiento.

- **Autenticacion:** Admin Bearer token
- **Query params:** `period` - Valores: `month`, `season` (default), `year`
- **Respuesta:** `200 OK`

```json
[
  {
    "boatId": "astec-400",
    "boatName": "Astec 400",
    "totalBookings": 45,
    "revenue": 8500,
    "maintenanceCost": 350,
    "netRevenue": 8150
  }
]
```

---

### `GET /api/admin/reports/maintenance-summary`

Resumen de mantenimiento.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "total": 15,
  "completed": 10,
  "scheduled": 3,
  "inProgress": 2,
  "totalCost": 2500.50,
  "byType": {
    "preventive": 8,
    "corrective": 5,
    "inspection": 2
  }
}
```

---

### `GET /api/admin/reports/top-customers`

Top 20 clientes por gasto.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de los 20 mejores clientes

---

## 24. Admin - Mantenimiento

### `GET /api/admin/maintenance`

Lista registros de mantenimiento.

- **Autenticacion:** Admin Bearer token
- **Query params:** `boatId` (string, opcional) - Filtrar por barco
- **Respuesta:** `200 OK` - Array de logs de mantenimiento

---

### `GET /api/admin/maintenance/upcoming`

Mantenimientos programados proximos.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de mantenimientos pendientes

---

### `POST /api/admin/maintenance`

Crea un registro de mantenimiento.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertMaintenanceLogSchema`
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "log": { "id": "uuid", "...": "..." },
  "message": "Mantenimiento registrado"
}
```

---

### `PATCH /api/admin/maintenance/:id`

Actualiza un registro de mantenimiento.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `updateMaintenanceLogSchema`
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "log": { "id": "uuid", "...": "..." },
  "message": "Mantenimiento actualizado"
}
```

- **Errores:**
  - `404` - Registro no encontrado

---

### `DELETE /api/admin/maintenance/:id`

Elimina un registro de mantenimiento.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - `{ "success": true, "message": "Mantenimiento eliminado" }`
- **Errores:**
  - `404` - Registro no encontrado

---

## 25. Admin - Documentos de Barcos

### `GET /api/admin/documents`

Lista documentos de barcos (seguros, ITB, matriculas).

- **Autenticacion:** Admin Bearer token
- **Query params:** `boatId` (string, opcional)
- **Respuesta:** `200 OK` - Array de documentos

---

### `GET /api/admin/documents/expiring`

Documentos que expiran pronto.

- **Autenticacion:** Admin Bearer token
- **Query params:** `days` (number, default: 30) - Ventana de dias
- **Respuesta:** `200 OK` - Array de documentos proximos a expirar

---

### `POST /api/admin/documents`

Crea un documento.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertBoatDocumentSchema`
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "document": { "id": "uuid", "...": "..." },
  "message": "Documento registrado"
}
```

---

### `PATCH /api/admin/documents/:id`

Actualiza un documento.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `updateBoatDocumentSchema`
- **Respuesta:** `200 OK`
- **Errores:** `404` - Documento no encontrado

---

### `DELETE /api/admin/documents/:id`

Elimina un documento.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - `{ "success": true, "message": "Documento eliminado" }`
- **Errores:** `404` - Documento no encontrado

---

## 26. Admin - Inventario

### `GET /api/admin/inventory`

Lista todos los items del inventario.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de items

---

### `GET /api/admin/inventory/low-stock`

Items con stock bajo.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de items con bajo stock

---

### `GET /api/admin/inventory/:id`

Obtiene un item del inventario.

- **Autenticacion:** Admin Bearer token
- **Errores:** `404` - Item no encontrado

---

### `POST /api/admin/inventory`

Crea un item de inventario.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertInventoryItemSchema`
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "item": { "id": "uuid", "...": "..." },
  "message": "Item creado"
}
```

---

### `PATCH /api/admin/inventory/:id`

Actualiza un item de inventario.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `updateInventoryItemSchema`
- **Errores:** `404` - Item no encontrado

---

### `DELETE /api/admin/inventory/:id`

Elimina un item de inventario.

- **Autenticacion:** Admin Bearer token
- **Errores:** `404` - Item no encontrado

---

### `GET /api/admin/inventory/:id/movements`

Historial de movimientos de un item.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de movimientos

---

### `POST /api/admin/inventory/:id/movements`

Registra un movimiento de inventario.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertInventoryMovementSchema` (el `itemId` se toma del URL)
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "movement": { "id": "uuid", "...": "..." },
  "message": "Movimiento registrado"
}
```

---

## 27. Admin - Blog

### `GET /api/admin/blog`

Lista todos los posts (incluidos borradores).

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de posts

---

### `POST /api/admin/blog`

Crea un post de blog.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertBlogPostSchema`
- **Respuesta:** `201 Created` - Objeto post

---

### `PUT /api/admin/blog/:id`

Actualiza un post de blog.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertBlogPostSchema` (parcial)
- **Respuesta:** `200 OK` - Objeto post actualizado
- **Errores:** `404` - Post no encontrado

---

### `DELETE /api/admin/blog/:id`

Elimina un post de blog.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - `{ "message": "Blog post deleted successfully" }`
- **Errores:** `404` - Post no encontrado

---

## 28. Admin - Destinos

### `GET /api/admin/destinations`

Lista todos los destinos (incluidos no publicados).

- **Autenticacion:** Admin Bearer token

---

### `POST /api/admin/destinations`

Crea un destino.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertDestinationSchema`
- **Respuesta:** `201 Created`

---

### `PUT /api/admin/destinations/:id`

Actualiza un destino.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertDestinationSchema` (parcial)
- **Errores:** `404` - Destino no encontrado

---

### `DELETE /api/admin/destinations/:id`

Elimina un destino.

- **Autenticacion:** Admin Bearer token
- **Errores:** `404` - Destino no encontrado

---

## 29. Admin - Galeria

### `GET /api/admin/gallery`

Lista todas las fotos (incluidas no aprobadas).

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de fotos

---

### `PATCH /api/admin/gallery/:id/approve`

Aprueba una foto.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Foto actualizada
- **Errores:** `404` - Foto no encontrada

---

### `PATCH /api/admin/gallery/:id/reject`

Rechaza una foto.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Foto actualizada
- **Errores:** `404` - Foto no encontrada

---

### `DELETE /api/admin/gallery/:id`

Elimina una foto.

- **Autenticacion:** Admin Bearer token + rol admin
- **Respuesta:** `200 OK` - `{ "message": "Foto eliminada correctamente" }`
- **Errores:** `404` - Foto no encontrada

---

## 30. Admin - Tarjetas Regalo

### `GET /api/admin/gift-cards`

Lista todas las tarjetas regalo.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de gift cards

---

### `PATCH /api/admin/gift-cards/:id`

Actualiza estado de una tarjeta regalo.

- **Autenticacion:** Admin Bearer token + rol admin
- **Body:**

```json
{
  "status": "active",
  "paymentStatus": "completed"
}
```

- **Valores de `status`:** `pending`, `active`, `used`, `expired`, `cancelled`
- **Valores de `paymentStatus`:** `pending`, `completed`, `failed`, `refunded`
- **Errores:** `404` - Tarjeta no encontrada

---

## 31. Admin - Descuentos

### `GET /api/admin/discounts`

Lista todos los codigos de descuento.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de codigos

---

### `POST /api/admin/discounts`

Crea un codigo de descuento.

- **Autenticacion:** Admin Bearer token
- **Body:**

```json
{
  "code": "VERANO-2026",
  "discountPercent": 15,
  "maxUses": 50,
  "customerEmail": null,
  "expiresAt": "2026-10-31T23:59:59+02:00"
}
```

- **Validaciones:** Codigo solo mayusculas, numeros y guiones (2-30 chars)
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "discountCode": { "id": "uuid", "code": "VERANO-2026", "...": "..." }
}
```

- **Errores:**
  - `409` - Codigo ya existe

---

### `DELETE /api/admin/discounts/:id`

Desactiva un codigo de descuento (soft delete).

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "message": "Codigo de descuento desactivado",
  "discountCode": { "...": "..." }
}
```

---

### `POST /api/admin/discounts/pre-season-campaign`

Genera codigos de descuento pre-temporada (10%) para todos los clientes con email.

- **Autenticacion:** Admin Bearer token
- **Formato del codigo:** `SPRING-{hash_md5_email}-{anio}`
- **Expiracion:** 30 de junio del ano actual
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "customersFound": 85,
  "codesGenerated": 85,
  "codes": [
    {
      "email": "juan@example.com",
      "name": "Juan Garcia",
      "code": "SPRING-A3B5C7-2026",
      "discountPercent": 10
    }
  ]
}
```

---

## 32. Admin - Empleados

### `GET /api/admin/employees`

Lista todos los empleados.

- **Autenticacion:** Admin Bearer token + propietario (requireOwner)
- **Respuesta:** `200 OK` - Array de empleados (sin `passwordHash`)

---

### `POST /api/admin/employees`

Crea un empleado.

- **Autenticacion:** Admin Bearer token + propietario
- **Body:**

```json
{
  "username": "carlos",
  "password": "minimo6chars",
  "displayName": "Carlos Martinez",
  "role": "employee"
}
```

- **Valores de `role`:** `admin`, `employee`
- **Respuesta:** `201 Created` - Objeto empleado (sin `passwordHash`)
- **Errores:**
  - `409` - Username ya existe

---

### `PATCH /api/admin/employees/:id`

Actualiza un empleado.

- **Autenticacion:** Admin Bearer token + propietario
- **Body:**

```json
{
  "displayName": "Carlos M.",
  "role": "admin",
  "password": "nuevacontrasena",
  "isActive": true
}
```

- **Errores:** `404` - Empleado no encontrado

---

### `DELETE /api/admin/employees/:id`

Desactiva un empleado (soft delete).

- **Autenticacion:** Admin Bearer token + propietario
- **Respuesta:** `200 OK` - `{ "message": "Empleado desactivado correctamente" }`
- **Errores:** `404` - Empleado no encontrado

---

## 33. Admin - Marketing (Newsletter y GBP)

### `GET /api/admin/newsletter/subscribers`

Lista suscriptores activos del newsletter.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de suscriptores

---

### `POST /api/admin/newsletter/send`

Envia newsletter manualmente con posts recientes.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "message": "Newsletter enviado a 42 suscriptores",
  "sent": 42,
  "failed": 3,
  "postsIncluded": 5
}
```

---

### `GET /api/admin/gbp/posts`

Genera posts para Google Business Profile.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de posts GBP

---

### `GET /api/admin/gbp/seasonal`

Obtiene post promocional estacional para GBP.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Objeto post GBP

---

### `GET /api/admin/gbp/from-blog/:slug`

Genera post GBP a partir de un post del blog.

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `slug` - Slug del post de blog
- **Errores:** `404` - Post no encontrado

---

## 34. Admin - Consultas (Inquiries)

### `GET /api/admin/booking-inquiries`

Lista consultas de reserva paginadas.

- **Autenticacion:** Admin Bearer token
- **Query params:**
  - `page` (number, default: 1)
  - `limit` (number, default: 25, max: 100)
  - `status` (string, opcional)
  - `search` (string, opcional)
- **Respuesta:** `200 OK` - Paginado con `data`, `total`, `page`, `limit`, `totalPages`

---

### `PATCH /api/admin/booking-inquiries/:id`

Actualiza una consulta (estado, notas).

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `updateWhatsappInquirySchema`
- **Errores:** `404` - Peticion no encontrada

---

### `DELETE /api/admin/booking-inquiries/:id`

Elimina una consulta.

- **Autenticacion:** Admin Bearer token
- **Errores:** `404` - Peticion no encontrada

---

### `POST /api/admin/booking-inquiries/:id/send-whatsapp`

Envia mensaje WhatsApp al cliente de una consulta via Meta API.

- **Autenticacion:** Admin Bearer token
- **Body:**

```json
{
  "message": "Hola! Hemos recibido tu consulta..."
}
```

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "messageId": "wamid.xxx"
}
```

- **Errores:**
  - `400` - Mensaje requerido
  - `404` - Consulta no encontrada
  - `503` - WhatsApp API no configurada

---

## 35. Admin - Tenants

### `POST /api/admin/seed-tenant`

Crea el tenant por defecto y migra datos existentes.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "tenant": { "id": "uuid", "name": "Costa Brava Rent a Boat", "...": "..." },
  "message": "Tenant creado y datos migrados correctamente"
}
```

---

### `GET /api/admin/tenants`

Lista todos los tenants.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK` - Array de tenants

---

### `GET /api/admin/tenants/:id`

Obtiene un tenant por ID.

- **Autenticacion:** Admin Bearer token
- **Errores:** `404` - Tenant no encontrado

---

### `POST /api/admin/tenants`

Crea un nuevo tenant.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `insertTenantSchema`
- **Respuesta:** `201 Created`

```json
{
  "success": true,
  "tenant": { "id": "uuid", "...": "..." },
  "message": "Tenant creado"
}
```

---

### `PATCH /api/admin/tenants/:id`

Actualiza un tenant.

- **Autenticacion:** Admin Bearer token
- **Body:** Segun `updateTenantSchema`
- **Errores:** `404` - Tenant no encontrado

---

## 36. Admin - Utilidades

### `POST /api/admin/seed-blog`

Puebla el blog con posts iniciales.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "message": "Blog seed completed",
  "created": 6,
  "total": 6
}
```

---

### `GET /objects/:objectPath(*)`

Descarga un archivo del Object Storage.

- **Autenticacion:** Admin Bearer token
- **Parametros URL:** `objectPath` - Ruta del objeto (ej: `boats/photo.webp`)
- **Validacion:** Rechaza path traversal (`..` y `\0`)
- **Errores:**
  - `400` - Ruta no valida
  - `404` - Objeto no encontrado

---

## 37. Tenant (Multi-tenant SaaS)

### `GET /api/tenant/settings`

Obtiene la configuracion del tenant actual.

- **Autenticacion:** SaaS Bearer token (requireSaasAuth)
- **Respuesta:** `200 OK`

```json
{
  "tenant": {
    "id": "uuid",
    "name": "Mi Empresa",
    "slug": "mi-empresa",
    "email": "info@miempresa.com",
    "phone": "+34611500372",
    "logo": null,
    "primaryColor": "#0077B6",
    "secondaryColor": "#A8C4DD"
  }
}
```

---

### `PATCH /api/tenant/settings`

Actualiza configuracion del tenant (solo propietario).

- **Autenticacion:** SaaS Bearer token (role: `owner`)
- **Body:**

```json
{
  "name": "Nuevo Nombre",
  "email": "nuevo@email.com",
  "phone": "+34600000000",
  "logo": "https://...",
  "primaryColor": "#0077B6",
  "secondaryColor": "#A8C4DD",
  "settings": {
    "timezone": "Europe/Madrid",
    "currency": "EUR",
    "languages": ["es", "en", "fr"]
  }
}
```

- **Errores:** `403` - Solo el propietario puede modificar

---

### `GET /api/tenant/users`

Lista usuarios del tenant.

- **Autenticacion:** SaaS Bearer token (role: `owner` o `admin`)
- **Respuesta:** `200 OK` - Array de usuarios (sin `passwordHash`)

---

### `POST /api/tenant/users`

Crea un nuevo miembro del equipo (solo propietario).

- **Autenticacion:** SaaS Bearer token (role: `owner`)
- **Body:**

```json
{
  "email": "empleado@empresa.com",
  "password": "minimo8chars",
  "firstName": "Carlos",
  "lastName": "Martinez",
  "role": "employee"
}
```

- **Valores de `role`:** `admin`, `employee`
- **Respuesta:** `201 Created`
- **Errores:**
  - `403` - Solo el propietario puede invitar
  - `409` - Email ya existe en el tenant

---

### `PATCH /api/tenant/users/:id`

Actualiza rol/estado de un miembro (solo propietario).

- **Autenticacion:** SaaS Bearer token (role: `owner`)
- **Body:**

```json
{
  "role": "admin",
  "isActive": true,
  "firstName": "Carlos",
  "lastName": "Martinez"
}
```

- **Errores:**
  - `400` - No puedes modificar tu propio usuario
  - `403` - Solo propietario / no se puede modificar al propietario
  - `404` - Usuario no encontrado

---

## 38. Super Admin (Plataforma)

Estos endpoints son exclusivos del administrador de plataforma (token legacy sin `tenantId`).

### `GET /api/superadmin/stats`

Metricas globales de la plataforma.

- **Autenticacion:** Super Admin token
- **Respuesta:** `200 OK`

```json
{
  "totalTenants": 12,
  "byStatus": { "trial": 3, "active": 7, "suspended": 1, "cancelled": 1 },
  "byPlan": { "starter": 5, "pro": 5, "enterprise": 2 },
  "mrrEstimate": 1443
}
```

- **Precios por plan:** starter: 49EUR, pro: 99EUR, enterprise: 199EUR

---

### `GET /api/superadmin/tenants`

Lista todos los tenants con conteo de usuarios.

- **Autenticacion:** Super Admin token
- **Respuesta:** `200 OK`

```json
[
  {
    "id": "uuid",
    "name": "Mi Empresa",
    "slug": "mi-empresa",
    "email": "info@miempresa.com",
    "plan": "pro",
    "status": "active",
    "trialEndsAt": null,
    "createdAt": "2026-01-15T00:00:00.000Z",
    "usersCount": 4
  }
]
```

---

### `PATCH /api/superadmin/tenants/:id`

Actualiza estado o plan de un tenant.

- **Autenticacion:** Super Admin token
- **Body:**

```json
{
  "status": "suspended",
  "plan": "enterprise"
}
```

- **Valores de `status`:** `trial`, `active`, `suspended`, `cancelled`
- **Valores de `plan`:** `starter`, `pro`, `enterprise`
- **Errores:** `404` - Tenant no encontrado

---

## 39. WhatsApp - Twilio Webhooks

### `POST /api/whatsapp/webhook`

Webhook principal de WhatsApp via Twilio.

- **Autenticacion:** Firma HMAC de Twilio (`TWILIO_AUTH_TOKEN`)
- **Content-Type:** `application/x-www-form-urlencoded`
- **Procesamiento:** Recibe mensajes entrantes de clientes y genera respuestas con IA (GPT-4o-mini + RAG)

---

### `GET /api/whatsapp/webhook`

Validacion del webhook (verificacion de Twilio).

- **Autenticacion:** Ninguna (verificacion del servicio)

---

### `POST /api/whatsapp/status`

Callback de estado de mensajes (enviado, entregado, leido).

- **Autenticacion:** Firma HMAC de Twilio
- **Content-Type:** `application/x-www-form-urlencoded`

---

### `GET /api/whatsapp/health`

Estado de salud de la integracion WhatsApp.

- **Autenticacion:** Admin Bearer token
- **Respuesta:** `200 OK`

```json
{
  "configured": true,
  "aiEnabled": true,
  "webhookUrl": "https://costabravarentaboat.app/api/whatsapp/webhook",
  "diagnostics": {
    "twilio": {
      "hasAccountSid": true,
      "hasAuthToken": true,
      "hasFromNumber": true
    },
    "openai": {
      "hasApiKey": true
    },
    "nodeEnv": "production"
  }
}
```

---

## 40. WhatsApp - Meta Cloud API Webhooks

### `GET /api/meta-whatsapp/webhook`

Verificacion del webhook de Meta.

- **Autenticacion:** `hub.verify_token` debe coincidir con `META_WHATSAPP_VERIFY_TOKEN`
- **Query params:**
  - `hub.mode` - Debe ser `subscribe`
  - `hub.verify_token` - Token de verificacion
  - `hub.challenge` - Challenge a devolver
- **Respuesta:** `200 OK` - Devuelve `hub.challenge`

---

### `POST /api/meta-whatsapp/webhook`

Recibe mensajes entrantes y actualizaciones de estado via Meta Cloud API.

- **Autenticacion:** Ninguna (responde 200 inmediatamente)
- **Procesamiento:**
  - Mensajes entrantes: Marca como leido y actualiza inquiries matching por telefono
  - Status updates (delivered, read): Auto-actualiza inquiries a "contacted"

---

## 41. Chatbot Analytics

Estos endpoints no requieren autenticacion admin actualmente (considerar agregar).

### `GET /api/chatbot/analytics`

Resumen de analiticas del chatbot.

- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalSessions": 150,
    "totalMessages": 1200,
    "averageMessagesPerSession": 8,
    "frequentIntents": [
      { "intent": "pricing", "count": 45 },
      { "intent": "availability", "count": 38 }
    ]
  }
}
```

---

### `GET /api/chatbot/leads`

Leads potenciales del chatbot para CRM.

- **Query params:**
  - `limit` (number, default: 20)
  - `quality` (string, opcional) - Valores: `hot`, `warm`, `cold`
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "phoneNumber": "+34611234567",
      "profileName": "Juan",
      "intentScore": 85,
      "leadQuality": "hot",
      "totalMessages": 12,
      "topicsDiscussed": ["pricing", "availability"],
      "boatsViewed": ["astec-400", "remus-450"],
      "lastMessageAt": "2026-03-11T10:00:00.000Z",
      "firstMessageAt": "2026-03-10T15:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/chatbot/conversations`

Lista conversaciones recientes.

- **Query params:** `limit` (number, default: 50)
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "phoneNumber": "+34611234567",
      "profileName": "Juan",
      "language": "es",
      "intentScore": 85,
      "leadQuality": "hot",
      "isLead": true,
      "totalMessages": 12,
      "lastMessageAt": "2026-03-11T10:00:00.000Z",
      "firstMessageAt": "2026-03-10T15:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/chatbot/conversations/:phoneNumber`

Historial de conversacion de un numero especifico.

- **Parametros URL:** `phoneNumber` - Numero de telefono (URL encoded)
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "phoneNumber": "+34611234567",
      "profileName": "Juan",
      "language": "es",
      "intentScore": 85,
      "leadQuality": "hot",
      "totalMessages": 12,
      "topicsDiscussed": ["pricing"],
      "boatsViewed": ["astec-400"],
      "firstMessageAt": "...",
      "lastMessageAt": "..."
    },
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "Hola, quiero alquilar un barco",
        "detectedIntent": "general_inquiry",
        "detectedBoatId": null,
        "sentiment": "positive",
        "createdAt": "..."
      }
    ]
  }
}
```

- **Errores:** `404` - Conversacion no encontrada

---

### `GET /api/chatbot/knowledge`

Entradas de la base de conocimiento del chatbot.

- **Query params:**
  - `category` (string, opcional)
  - `language` (string, default: `es`)
- **Respuesta:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Horario de operacion",
      "content": "Los barcos operan de 09:00 a 20:00...",
      "category": "business",
      "language": "es",
      "keywords": ["horario", "horas"],
      "priority": 10,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## 42. iCal - Calendario

### `GET /api/calendar/feed.ics`

Feed iCal de reservas confirmadas (para Google Calendar, Apple Calendar, etc.).

- **Autenticacion:** Token secreto via query param
- **Query params:** `token` - Debe coincidir con `ICAL_FEED_TOKEN` (variable de entorno)
- **Content-Type:** `text/calendar; charset=utf-8`
- **Content-Disposition:** `attachment; filename=bookings.ics`
- **Respuesta:** Archivo `.ics` con todas las reservas confirmadas
- **Errores:**
  - `401` - Token invalido
  - `503` - Feed no configurado

---

## 43. Health Check

### `GET /api/health`

Estado de salud de todos los servicios.

- **Autenticacion:** Ninguna
- **Respuesta:** `200 OK` (todos ok) o `503 Service Unavailable` (degradado)

```json
{
  "status": "ok",
  "timestamp": "2026-03-11T10:00:00.000Z",
  "services": {
    "database": { "status": "ok", "latencyMs": 12 },
    "stripe": { "status": "ok", "latencyMs": 245 },
    "sendgrid": { "status": "configured" },
    "twilio": { "status": "configured" }
  }
}
```

- **Valores de `status` por servicio:** `ok`, `configured`, `not_configured`, `error`

---

## Codigos de Error Comunes

| Codigo | Significado |
|--------|-------------|
| `400` | Datos invalidos (incluye `errors` con detalle por campo) |
| `401` | No autorizado / Token invalido o expirado |
| `403` | Sin permisos suficientes |
| `404` | Recurso no encontrado |
| `409` | Conflicto (duplicado, ya existe) |
| `410` | Recurso expirado (hold expirado, booking cancelado) |
| `422` | Estado no procesable |
| `429` | Rate limit excedido |
| `500` | Error interno del servidor |
| `503` | Servicio no disponible (Stripe, WhatsApp, etc.) |

## Formato de Error Estandar

```json
{
  "message": "Descripcion del error en espanol",
  "errors": {
    "campo1": ["Error de validacion"],
    "campo2": ["Otro error"]
  }
}
```
