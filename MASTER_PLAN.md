# PLAN MAESTRO DE MEJORAS - Costa Brava Rent a Boat

Generado: 11 Feb 2026
Basado en: Auditoria completa de 7 agentes (CEO, CTO, CMO, CDO, CCO, COO, CFO)
Validado punto por punto con el propietario

---

## RESUMEN EJECUTIVO

| Metrica | Valor |
|---------|-------|
| Revenue 2025 | 108.779 EUR (593 alquileres) |
| Costes fijos temporada | ~37.758 EUR |
| Margen bruto | ~60% |
| Break-even | 239 alquileres |
| Objetivo 2026 (realista) | 140.000 EUR (+29%) |
| Flota real | 8 barcos fisicos + Excursion Privada |

---

## FASE 1: BUGS CRITICOS Y DATOS INCORRECTOS
**Prioridad**: MAXIMA | **Esfuerzo**: 2-3 horas | **Impacto**: Correccion de datos

### 1.1 Renombrar Astec 450 a Astec 480
- **Archivo**: `shared/boatData.ts` - cambiar id, name, model, description, length a 4.8m
- **Archivos afectados**: Cualquier referencia a "astec-450" en el codebase
- **Base de datos**: Actualizar registro del barco

### 1.2 Corregir precio snorkel
- **Archivo**: `client/src/components/FeaturesSection.tsx` - cambiar 15 EUR a 7.50 EUR
- **Archivo**: Buscar "5€" o "5 EUR" para snorkel en BookingFlow y corregir a 7.50 EUR
- **Precio correcto**: 7.50 EUR (ya correcto en boatData.ts)

### 1.3 Anadir segundo Remus 450 a la flota
- **Archivo**: `shared/boatData.ts` - anadir entrada "remus-450-ii"
- **Base de datos**: Insertar nuevo barco

### 1.4 Anadir Excursion Privada como producto
- **Archivo**: `shared/boatData.ts` - anadir entrada "excursion-privada" (servicio con skipper)
- **Frontend**: Mostrar en la web como producto diferenciado
- **Base de datos**: Insertar registro

### 1.5 Unificar logica de temporadas en chatbot
- **Archivo**: `server/whatsapp/functionCallingService.ts` - usar `shared/pricing.ts` como fuente unica
- **Temporadas correctas**: BAJA (Abr-Jun, Sep-Oct), MEDIA (Jul), ALTA (Ago)

### 1.6 Corregir fechas 2024/2025 en SEO
- **Archivo**: `client/src/utils/seo-config.ts` - actualizar a 2026
- **Archivo**: `client/src/index.html` - si hay fechas hardcodeadas

---

## FASE 2: SEGURIDAD
**Prioridad**: CRITICA | **Esfuerzo**: 6-8 horas | **Impacto**: Proteccion del negocio

### 2.1 Autenticacion admin robusta
- **Archivo**: `server/routes/auth.ts`
  - Implementar JWT con tokens firmados (reemplazar prefijo "admin_")
  - Middleware `requireAdminRole` para endpoints destructivos
  - Hash de PIN con bcrypt
  - Expirar tokens (24h)
- **Archivo**: `server/routes/admin.ts` - proteger con middleware

### 2.2 Security headers
- Instalar y configurar `helmet` en `server/index.ts`
- Activar CSP (Content Security Policy)
- HSTS, X-Frame-Options, etc.

### 2.3 Rate limiting
- **Archivo**: `server/index.ts` o middleware nuevo
- Rate limit en login, formulario contacto, endpoints publicos
- Instalar `express-rate-limit`

### 2.4 Proteger endpoints expuestos
- **Archivo**: `server/routes/payments.ts` - proteger payment-status
- **Archivo**: `server/routes/admin.ts` - verificar todos los endpoints
- Anadir validacion Zod a TODOS los endpoints (inputs de usuario)

### 2.5 Fix error handler
- **Archivo**: `server/index.ts` linea ~119 - eliminar `throw err` despues de responder

---

## FASE 3: CONVERSION WEB
**Prioridad**: ALTA | **Esfuerzo**: 4-6 horas | **Impacto**: +5.000-8.000 EUR/ano

### 3.1 Boton "Reservar" en navigation desktop
- **Archivo**: `client/src/components/Navigation.tsx`
- Boton destacado que lleve al formulario de reserva
- Visible solo en desktop (mobile ya tiene CTA)

### 3.2 Modal de reserva a pagina completa en movil
- **Archivo**: `client/src/components/BookingFormWidget.tsx`
- En mobile: renderizar como pagina completa en vez de modal
- Mantener los 10 campos obligatorios (decision del propietario)

### 3.3 Inline validation en formulario
- **Archivo**: `client/src/components/BookingFormWidget.tsx`
- Validacion en tiempo real de campos
- Mensajes de error claros

### 3.4 Boton flotante WhatsApp
- **Archivo**: Nuevo componente o en layout principal
- Boton fijo en esquina inferior para contacto rapido
- Visible en todas las paginas

### 3.5 Unificar modal de reserva (eliminar duplicacion)
- Actualmente duplicado en 4 lugares
- Crear un unico componente reutilizable

---

## FASE 4: CHATBOT INTELIGENTE
**Prioridad**: ALTA | **Esfuerzo**: 8-12 horas | **Impacto**: +3.000-5.000 EUR/ano

### 4.1 Chatbot que recopila datos de reserva
- **Archivo**: `server/whatsapp/aiService.ts`
- **Archivo**: `server/whatsapp/functionCallingService.ts`
- Flujo: Chatbot hace las mismas preguntas que el formulario web
  1. Nombre
  2. Telefono
  3. Email
  4. Barco deseado
  5. Fecha
  6. Hora inicio
  7. Duracion
  8. Numero personas
  9. Extras
  10. Ocasion/comentarios
- Al completar: muestra resumen al cliente para confirmar
- Mensaje: "Ivan lo verificara y contactara para confirmar disponibilidad"

### 4.2 Notificacion a Ivan
- **WhatsApp**: Enviar mensaje al numero de Ivan con resumen de la peticion
- **CRM**: Crear registro de solicitud pendiente en el dashboard
- Doble notificacion para no perder ninguna solicitud

### 4.3 Completar chatbot en 8 idiomas
- Actualmente 4 idiomas completos
- Completar: los 4 restantes (de los 8 soportados: es, ca, en, fr, de, nl, it, ru)
- **Archivo**: Knowledge base y prompts del chatbot

---

## FASE 5: EMAILS AUTOMATICOS Y POST-VENTA
**Prioridad**: ALTA | **Esfuerzo**: 6-8 horas | **Impacto**: +5.000-10.000 EUR/ano

### 5.1 Configurar SendGrid (ya instalado)
- **Archivo**: `server/services/emailService.ts` (crear o completar)
- Templates para cada tipo de email

### 5.2 Recordatorio 24h antes del alquiler
- Enviar automaticamente via WhatsApp/email
- Contenido: Confirmacion de hora, barco, punto de encuentro, parking, extras
- **Trigger**: Cron job o evento desde CRM

### 5.3 Agradecimiento 24h despues + link Google Reviews
- Email/WhatsApp post-servicio
- Incluir link directo a Google Reviews
- Objetivo: aumentar de 307 reviews actuales (4.8 media)

### 5.4 Descuento 10% repeat customers
- Logica: Detectar email/telefono de cliente anterior
- Generar codigo automatico 10% descuento
- Incluir en email de agradecimiento

### 5.5 Email pre-temporada
- Enviar en marzo/abril a todos los clientes anteriores
- "La temporada empieza, reserva con tu 10% de descuento"
- Usar base de datos CRM existente

---

## FASE 6: SEO Y CONTENIDO
**Prioridad**: MEDIA-ALTA | **Esfuerzo**: 8-10 horas | **Impacto**: +8.000-15.000 EUR/ano

### 6.1 Instalar GA4 + GTM
- **Archivo**: `client/src/index.html` o componente SEO
- Configurar eventos de conversion (formulario enviado, WhatsApp click)

### 6.2 Corregir robots.txt
- **Archivo**: `public/robots.txt`
- Verificar rutas correctas

### 6.3 Traducir landing pages
- **Archivos**: Todos los `location-*.tsx` y `category-*.tsx`
- Hardcodeados en espanol actualmente
- Minimo: espanol + ingles + frances

### 6.4 Blog auto-publishing con Claude Code
- Implementar sistema de publicacion automatica
- Objetivo: 6+ posts antes de temporada
- Keywords: "mejores calas costa brava", "que hacer en blanes", "boat rental costa brava", etc.

### 6.5 Optimizar Google My Business
- Aprovechar las 307 reviews (4.8 media) como activo principal
- Fotos actualizadas, horarios, servicios

### 6.6 SEO tecnico
- Corregir sameAs faltante en schema dinamico
- Corregir lastmod en sitemaps (usar fechas reales)
- Verificar URLs multiidioma

---

## FASE 7: EXTRAS Y DIVERSIFICACION DE INGRESOS
**Prioridad**: MEDIA | **Esfuerzo**: 4-6 horas | **Impacto**: +3.000-5.000 EUR/ano

### 7.1 Packs de extras
- **Archivo**: `shared/boatData.ts` - anadir packs
- Pack Basic: Nevera + Snorkel = 10 EUR (vs 12.50 por separado)
- Pack Premium: Nevera + Snorkel + Paddle Surf = 30 EUR (vs 37.50)
- Pack Aventura: Todo incluido (Nevera + Snorkel + Paddle Surf + Seascooter) = 75 EUR (vs 87.50)

### 7.2 Explotar gift cards
- Ya implementadas (Bloque 5 del plan anterior)
- Mejorar visibilidad en la web
- SEO para "tarjeta regalo alquiler barco"
- Campana navidades / San Valentin / Dia del Padre

### 7.3 GetYourGuide / Civitatis
- Registrarse como proveedor
- Crear listings para barcos sin licencia + Excursion Privada
- Comision 20-25% pero canal nuevo sin coste inicial

---

## FASE 8: CRM Y OPERACIONES
**Prioridad**: MEDIA | **Esfuerzo**: 10-14 horas | **Impacto**: Eficiencia operativa

### 8.1 Vista timeline/calendario en CRM
- Reemplazar dependencia de Apple Calendar
- Vista semanal/diaria con barcos en filas y horas en columnas
- Drag & drop para mover reservas

### 8.2 Digitalizar inventario de extras
- Registro de extras disponibles (cuantos snorkels, paddle surfs, etc.)
- Control de stock por dia

### 8.3 Check-in / Check-out digital
- Formulario de entrega: estado del barco, extras entregados, hora
- Formulario de devolucion: estado, combustible, danos, hora
- Fotos antes/despues (opcional)

### 8.4 Paginacion en CRM
- Tablas de reservas y clientes con paginacion
- Actualmente carga todo de golpe

### 8.5 Selector de barco mejorado en formulario CRM
- Cambiar input de texto por dropdown con barcos reales
- Evitar errores de escritura

---

## FASE 9: DEUDA TECNICA
**Prioridad**: BAJA-MEDIA | **Esfuerzo**: 12-16 horas | **Impacto**: Mantenibilidad

### 9.1 Eliminar dependencias no usadas
- `i18next`, `react-i18next` - usar custom translations
- `react-router-dom` - usar wouter
- `lighthouse` - no necesario en produccion

### 9.2 Logger profesional
- Reemplazar 34 `console.log` por Pino logger
- Niveles: info, warn, error
- Formato estructurado para produccion

### 9.3 TypeScript strict
- Eliminar 61 usos de `any`
- Tipos explicitos en todo el codebase

### 9.4 Fix staleTime
- **Archivo**: `client/src/lib/queryClient.ts`
- Cambiar `staleTime: Infinity` a `staleTime: 5 * 60 * 1000` (5 minutos)

### 9.5 Fix N+1 queries
- **Archivo**: `server/routes/auth.ts` linea ~166
- **Archivo**: `server/routes/admin.ts` linea ~217
- Usar JOINs o batch queries

### 9.6 Eliminar endpoint duplicado de disponibilidad
- **Archivo**: `server/routes/boats.ts`

### 9.7 CI/CD con GitHub Actions
- Pipeline: lint + typecheck + build
- Deploy automatico a produccion
- Migraciones DB controladas (no db:push en prod)

---

## FASE 10: MARKETING EXTERNO (No-codigo)
**Prioridad**: MEDIA | **Esfuerzo**: Continuo | **Inversion**: Variable

### 10.1 Google Ads
- Brand campaigns (proteger marca)
- Search ES + EN (keywords principales)
- Expansion a FR, DE, NL en temporada alta
- Presupuesto recomendado: 1.500-2.000 EUR/mes en temporada

### 10.2 Redes sociales
- Empezar a crear contenido para Instagram/TikTok esta temporada
- Fotos y videos de clientes (con permiso)
- Galeria de fotos ya implementada (Bloque 3 plan anterior)

### 10.3 GetYourGuide / Civitatis
- Dar de alta los productos
- Excursion Privada como producto estrella

### 10.4 Email marketing pre-temporada
- Campana marzo: "La temporada empieza"
- Campana especial: gift cards Navidad / San Valentin

---

## DECISIONES DEL PROPIETARIO (REGISTRO)

Estas decisiones fueron tomadas durante la revision punto por punto:

| Decision | Motivo |
|----------|--------|
| Mantener 10 campos en formulario | Optimizar tiempo de Ivan, gestionar hasta 4 reservas/barco/dia |
| WhatsApp manual (no pago online) | Control total del scheduling y confirmacion personal |
| "CBRB" en mobile navigation | Preferencia de marca |
| Chatbot recopila datos (no redirige a web) | Mejor experiencia conversacional |
| Doble notificacion (WhatsApp + CRM) | No perder solicitudes |
| Implementar las 4 propuestas post-venta | Reminder, thank you + reviews, repeat discount, pre-season email |
| Mantenimiento NO es prioridad | Decision operativa |
| Verificacion licencia presencial | Preferencia de seguridad |
| Precios: pendiente de decision | El propietario necesita meditar la subida |
| GetYourGuide/Civitatis: si | Canal nuevo sin inversion inicial |
| Digitalizar extras + check-in/out | Mejorar operaciones |

---

## CALENDARIO SUGERIDO

### Febrero - Marzo 2026 (Pre-temporada)
- FASE 1: Bugs criticos y datos (2-3h)
- FASE 2: Seguridad (6-8h)
- FASE 3: Conversion web (4-6h)
- FASE 5: Emails automaticos (6-8h)
- FASE 6: SEO (parcial: GA4, robots, fechas)

### Abril 2026 (Inicio temporada)
- FASE 4: Chatbot inteligente (8-12h)
- FASE 6: Blog + contenido
- FASE 7: Extras packs + gift cards
- FASE 10: Google Ads

### Mayo - Octubre 2026 (Durante temporada)
- FASE 8: CRM y operaciones (10-14h)
- FASE 9: Deuda tecnica (12-16h)
- FASE 10: Marketing continuo

### Esfuerzo total estimado: 70-95 horas de desarrollo

---

## NOTAS

- Los precios nuevos se decidiran mas adelante (pendiente de reflexion del propietario)
- Las fases 1-3 son prioritarias y deben completarse antes de temporada
- Los bloques ya implementados (calendario disponibilidad, cuentas empleados, galeria fotos, rutas, gift cards) NO estan incluidos aqui
- Este plan NO incluye tests automatizados (sin setup de testing)
