# TODO - Costa Brava Rent a Boat

> Ultima actualizacion: Marzo 2026

## Prioridad Alta

### Funcionalidades Pendientes
- [ ] **Completar booking desde WhatsApp** - El chatbot no crea reservas reales
  - Archivo: `server/whatsapp/aiService.ts`
  - Crear funcion para generar booking desde conversacion
  - Integrar link de pago Stripe

- [ ] **Validar capacidad de barco en chatbot**
  - Archivo: `server/whatsapp/functionCallingService.ts`
  - Verificar que numberOfPeople <= boat.capacity

### Codigo
- [ ] **Reducir CRMDashboard.tsx** (446 lineas)
  - Ya se extrajeron 29 sub-componentes a `components/crm/`
  - Quedan oportunidades de simplificar el wrapper principal

## Prioridad Media

### SEO
- [ ] **Corregir Offer Schema**
  - Los rangos de fechas discontinuos se fusionan
  - Implementar multiples Offers para temporada BAJA

- [ ] **Anadir ReviewAggregate real**
  - Calcular rating promedio de testimonials verificados
  - Anadir a LocalBusiness schema

### UX
- [ ] **Mejorar feedback de errores**
  - Mensajes mas descriptivos en formularios
  - Toasts con acciones (retry, contact support)

### Performance
- [ ] **Implementar ISR para blog posts**
  - Cache de paginas estaticas
  - Revalidacion bajo demanda

### Testing
- [ ] **Escribir tests con Vitest**
  - Vitest ya esta instalado (v4.0.18)
  - Faltan tests reales: `shared/pricing.ts`, funciones de disponibilidad
  - Configurar coverage

## Prioridad Baja

### Internacionalizacion
- [ ] **Completar traducciones**
  - Algunas paginas faltan en idiomas no-ES
  - Revisar: `client/src/utils/seo-config.ts`

### Analytics
- [ ] **Dashboard de analytics**
  - Visualizar `page_visits` en CRM
  - Graficos de conversion

### DevOps
- [ ] **CI/CD Pipeline**
  - GitHub Actions para lint + type check
  - Deploy automatico en merge a main

## Completado

- [x] Sistema de reservas con holds temporales
- [x] Pagos Stripe integrados
- [x] Chatbot WhatsApp con OpenAI
- [x] RAG con knowledge base
- [x] Multi-idioma (8 idiomas)
- [x] SEO con JSON-LD schemas
- [x] Sitemaps dinamicos
- [x] CRM administrativo
- [x] Blog con Markdown + autopublish
- [x] Sistema de testimonios
- [x] Configurar ESLint + Prettier
- [x] Crear documentacion proyecto
- [x] **Dividir `server/routes.ts`** - 33 modulos en `server/routes/`
- [x] **Dividir `CRMDashboard.tsx`** - 29 sub-componentes en `components/crm/`
- [x] **Simplificar LoginPage** - PIN-only (123 lineas)
- [x] **Resolver errores TypeScript** - 0 errores en `tsc --noEmit`
- [x] **Instalar Vitest** (v4.0.18)
- [x] **Mejorar autenticacion admin** - Sistema SaaS JWT + PIN legacy funcional
- [x] **Sistema de newsletter** con SendGrid
- [x] **Optimizacion SEO para AI search** (llms.txt, schemas enriquecidos)
- [x] **Galerias responsive** por barco (desktop/tablet/mobile)
- [x] **Optimizacion mobile** completa para CRM
- [x] **Optimizacion de imagenes** (~5.9MB reduccion payload)
- [x] **Blog autopilot** con clusters y cola de publicacion
- [x] **MCP Servers** (5 custom + 3 externos)
- [x] Sistema de cupones/descuentos

---

## Bugs Conocidos

- [ ] **Hold expiration race condition** - Si dos usuarios intentan reservar el mismo slot simultaneamente
- [ ] **WhatsApp media URLs expiran** - Las imagenes de barcos pueden no cargar si pasa tiempo

---

## Ideas Futuras

- Integracion con Google Calendar para disponibilidad
- App movil nativa (React Native)
- Programa de fidelidad
- Integracion con meteo para recomendaciones
