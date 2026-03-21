# Plan Temporada 2026 — Diseño

**Fecha:** 2026-03-02
**Objetivo:** Llevar Costa Brava Rent a Boat de 5.5/10 a 9.0/10 antes de la temporada de alquiler (abril 2026)
**Disponibilidad:** Full-time (~5h/día), ~28 días hasta abril
**Enfoque elegido:** Foundation → Experience → Growth → Quality

---

## Contexto

Basado en la auditoría de 7 agentes (CTO, CMO, CFO, CDO, CCO, COO, CEO) realizada el 2 de marzo de 2026. Puntuaciones actuales:

| Área | Puntuación |
|------|-----------|
| CDO — Diseño & UX | 6.4/10 |
| COO — Operaciones | 6.0/10 |
| CEO — Estrategia | 5.5/10 |
| CCO — Customer Experience | 5.4/10 |
| CTO — Tecnología | 5.1/10 |
| CFO — Finanzas | 5.1/10 |
| CMO — Marketing | 5.0/10 |
| **Media global** | **5.5/10** |

---

## Semana 1 — Foundation (Seguridad, Dinero, Emails)

**Objetivo:** Que nada falle antes de recibir el primer euro de la temporada.

### Seguridad y dinero (días 1-3)
- Recalcular precio en servidor antes de crear PaymentIntent (elimina manipulación de `totalAmount` desde cliente)
- Validar firma HMAC de Twilio en webhook WhatsApp (previene mensajes falsos)
- Corregir `currentScore = 0` hardcodeado en `aiService.ts` (lead scoring debe acumular)
- Añadir fallback IA en NL, IT y RU (hoy solo 5 idiomas, faltan 3)
- `success_url`/`cancel_url` de Stripe usando origen del servidor, no `req.headers.origin`

### Emails multiidioma (días 3-5)
- Detectar idioma del cliente (prefijo telefónico → campo `language` en booking)
- Templates de confirmación, recordatorio 24h y thank-you en ES/EN/FR/DE mínimo
- WhatsApp reminder también en el idioma del cliente

### RGPD y textos legales (días 5-7)
- Texto de consentimiento RGPD en wizard mobile y formulario desktop → sistema de traducciones
- Etiqueta de temporada ("Alta/Media/Baja") traducida según idioma del usuario
- Placeholders del formulario neutrales (no "Juan García López")

---

## Semana 2 — Experience (UX completa + Operaciones)

**Objetivo:** Que cada cliente pueda reservar perfectamente y ningún barco se doble-reserve.

### Paridad desktop/mobile en el formulario de reserva (días 1-3)
- Añadir extras, packs (Basic/Premium/Aventura) y códigos de descuento al formulario desktop
- Añadir resumen de reserva antes del botón de envío en desktop
- Canal alternativo a WhatsApp: formulario guarda solicitud en DB y envía email de confirmación inmediata

### Agent handoff real (día 3)
- Cuando cliente pide hablar con agente, enviar WhatsApp al propietario con datos del cliente

### Operaciones — disponibilidad real (días 4-5)
- Stock real de extras: decrementar al reservar, bloquear si no hay unidades disponibles
- Barcos en mantenimiento: bloquear automáticamente en el calendario de disponibilidad
- Estado "completed" en reservas: transición automática tras check-out

### Flujo de cancelación (días 6-7)
- Endpoint de cancelación accesible desde link único en email de confirmación
- Email automático de confirmación de cancelación con info de reembolso (política 48h/24h/<24h)
- Notificación al propietario cuando se cancela

---

## Semana 3 — Growth (Marketing y Visibilidad)

**Objetivo:** Que más gente encuentre el negocio y cada visita tenga más posibilidades de convertir.

### SEO técnico urgente (día 1)
- `robots.txt` con Allow/Disallow y referencia al sitemap
- Verificar Google Search Console y enviar los 4 sitemaps
- Traducir contenido visible de location pages (Blanes, Lloret, Tossa) — hoy body en español aunque hreflang apunte a 8 idiomas

### Analytics y tracking (días 1-2)
- GA4 configurado con eventos de e-commerce (purchase, booking_started, whatsapp_click)
- Pixel de Meta instalado vía GTM
- Conversiones de Google Ads configuradas
- Parámetros UTM leídos y almacenados para atribución de canal

### Email marketing (días 3-4)
- Formulario de captación de email en footer y popup de salida (exit-intent)
- Secuencia post-reserva automatizada: pre-viaje → post-viaje (reseña Google) → re-engagement 30 días
- Thank-you también por WhatsApp 24h después del servicio

### Publicidad (días 5-7)
- Primera campaña Google Ads Search: keywords principales por idioma
- Primera campaña Meta Ads: audiencia viajeros/turistas ES/FR/DE/NL
- Perfil TripAdvisor/GetYourGuide con la excursión privada con patrón

---

## Semana 4 — Quality (Solidez técnica)

**Objetivo:** Que nada se rompa silenciosamente durante la temporada.

### Monitoring y alertas (días 1-2)
- Sentry instalado para errores en producción
- Health check endpoint `/api/health` (verifica DB, Stripe, SendGrid)
- Logging estructurado con niveles (info/warn/error)

### Tests en flujos críticos (días 2-4)
- Setup Vitest + tests para `pricing.ts`
- Tests para flujo de reserva: quote → hold → payment → confirmed
- Tests para disponibilidad y solapamiento de reservas
- CI con GitHub Actions: lint + typecheck + tests en cada push

### Deuda técnica puntual (días 4-5)
- Sesiones y blacklist de tokens de memoria → PostgreSQL
- Crear tipo `AuthenticatedRequest`, eliminar `(req as any)` en rutas de auth
- Wrappers innecesarios en `App.tsx` eliminados
- Mover `remotion`, `lighthouse`, `jsdom` a devDependencies

### Chatbot y knowledge base (días 6-7)
- Sincronizar `BOAT_IDS` del chatbot con `boatData.ts`
- Validación de capacidad en `handleBookingPeopleState`
- Knowledge base ampliada: edad mínima, normas de alcohol, mascotas, drones, llegada tardía
- Knowledge base en EN, FR y DE mínimo

---

## Fuera de alcance (post-temporada)

- Transformación SaaS completa (multi-tenant real, billing)
- Paginación de endpoints de lista
- Splitting de `storage.ts` y `schema.ts`
- Video en el hero
- A/B testing infrastructure
- Row-level security PostgreSQL

---

## Resultado esperado

| Semana | Puntuación estimada |
|--------|-------------------|
| Inicio | 5.5/10 |
| Tras S1 | 7.0/10 |
| Tras S2 | 7.8/10 |
| Tras S3 | 8.4/10 |
| Tras S4 | 9.0/10 |
