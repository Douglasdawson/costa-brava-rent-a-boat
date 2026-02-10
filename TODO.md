# TODO - Costa Brava Rent a Boat

> Última actualización: Febrero 2026

## Prioridad Alta

### Funcionalidades Pendientes
- [ ] **Completar booking desde WhatsApp** - El chatbot no crea reservas reales
  - Archivo: `server/whatsapp/aiService.ts`
  - Crear función para generar booking desde conversación
  - Integrar link de pago Stripe

- [ ] **Validar capacidad de barco en chatbot**
  - Archivo: `server/whatsapp/functionCallingService.ts`
  - Verificar que numberOfPeople <= boat.capacity

### Seguridad
- [ ] **Mejorar autenticación admin**
  - Actualmente: PIN fijo (0760)
  - Implementar: JWT con refresh tokens o session-based auth

### Código
- [ ] **Dividir `server/routes.ts`** (2061 líneas)
  - Crear: `server/routes/boats.ts`
  - Crear: `server/routes/bookings.ts`
  - Crear: `server/routes/admin.ts`
  - Crear: `server/routes/blog.ts`
  - Crear: `server/routes/destinations.ts`
  - Crear: `server/routes/whatsapp.ts`
  - Crear: `server/routes/sitemaps.ts`

- [ ] **Dividir `CRMDashboard.tsx`** (114KB)
  - Crear: `components/crm/BookingsTable.tsx`
  - Crear: `components/crm/BoatManagement.tsx`
  - Crear: `components/crm/CustomerList.tsx`
  - Crear: `components/crm/DashboardStats.tsx`
  - Crear: `components/crm/BlogEditor.tsx`

## Prioridad Media

### Testing
- [ ] **Configurar Vitest**
  - Setup básico para unit tests
  - Tests para `shared/pricing.ts`
  - Tests para funciones de disponibilidad

### SEO
- [ ] **Corregir Offer Schema**
  - Los rangos de fechas discontinuos se fusionan
  - Implementar múltiples Offers para temporada BAJA

- [ ] **Añadir ReviewAggregate real**
  - Calcular rating promedio de testimonials verificados
  - Añadir a LocalBusiness schema

### UX
- [ ] **Mejorar feedback de errores**
  - Mensajes más descriptivos en formularios
  - Toasts con acciones (retry, contact support)

### Performance
- [ ] **Implementar ISR para blog posts**
  - Cache de páginas estáticas
  - Revalidación bajo demanda

## Prioridad Baja

### Internacionalización
- [ ] **Completar traducciones**
  - Algunas páginas faltan en idiomas no-ES
  - Revisar: `client/src/utils/seo-config.ts`

### Analytics
- [ ] **Dashboard de analytics**
  - Visualizar `page_visits` en CRM
  - Gráficos de conversión

### DevOps
- [ ] **CI/CD Pipeline**
  - GitHub Actions para lint + type check
  - Deploy automático en merge a main

## Completado

- [x] Sistema de reservas con holds temporales
- [x] Pagos Stripe integrados
- [x] Chatbot WhatsApp con OpenAI
- [x] RAG con knowledge base
- [x] Multi-idioma (8 idiomas)
- [x] SEO con JSON-LD schemas
- [x] Sitemaps dinámicos
- [x] CRM administrativo
- [x] Blog con Markdown
- [x] Sistema de testimonios
- [x] Autenticación cliente (Replit Auth)
- [x] Configurar ESLint + Prettier
- [x] Crear documentación proyecto

---

## Notas de Implementación

### Para dividir routes.ts
```typescript
// server/routes/index.ts
import { boatRoutes } from "./boats";
import { bookingRoutes } from "./bookings";
// ...

export function registerAllRoutes(app: Express) {
  boatRoutes(app);
  bookingRoutes(app);
  // ...
}
```

### Para dividir CRMDashboard
```typescript
// Crear context para estado compartido
const CRMContext = createContext<CRMState>(null);

// Componentes hijos usan el context
function BookingsTable() {
  const { bookings, updateBooking } = useCRMContext();
}
```

---

## Bugs Conocidos

- [ ] **Hold expiration race condition** - Si dos usuarios intentan reservar el mismo slot simultáneamente
- [ ] **WhatsApp media URLs expiran** - Las imágenes de barcos pueden no cargar si pasa tiempo

---

## Ideas Futuras

- Integración con Google Calendar para disponibilidad
- App móvil nativa (React Native)
- Sistema de cupones/descuentos
- Programa de fidelidad
- Integración con meteo para recomendaciones
