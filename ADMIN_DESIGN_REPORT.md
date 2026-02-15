# Informe de Diseno: Admin/CRM de Clase Mundial para Costa Brava Rent a Boat

**Autor:** CDO - Costa Brava Rent a Boat
**Fecha:** 15 de febrero de 2026
**Version:** 1.0
**Estado:** Propuesta de diseno

---

## Tabla de Contenidos

1. [Benchmarking: Los Mejores Dashboards del Mercado](#1-benchmarking)
2. [Analisis del Admin Actual](#2-analisis-del-admin-actual)
3. [Arquitectura del Admin Ideal](#3-arquitectura-del-admin-ideal)
4. [Sistema de Diseno Admin](#4-sistema-de-diseno-admin)
5. [Wireframes Conceptuales por Seccion](#5-wireframes-conceptuales)
6. [Plan de Implementacion](#6-plan-de-implementacion)
7. [Colaboracion Requerida](#7-colaboracion-requerida)

---

## 1. Benchmarking

### 1.1 Stripe Dashboard - Patron de Referencia

**Lo que hace bien:**
- Sidebar colapsable con iconos + texto, siempre visible
- Metricas en tiempo real con sparklines integrados en cada KPI card
- Filtrado temporal unificado en la parte superior (hoy / 7d / 4w / 3m / 12m / personalizado)
- Tablas con columnas ordenables, busqueda instantanea, y paginacion
- Detalle de transaccion en panel lateral deslizante (no modal bloqueante)
- Breadcrumbs claros para navegacion jerarquica
- Uso excelente de color: minimalista, con color solo para estados y acciones

**Adaptable a nuestro caso:**
- Panel lateral deslizante para detalle de reserva (reemplazar el Dialog modal actual)
- Sparklines en KPI cards para mostrar tendencia semanal
- Filtro temporal unificado que afecte a toda la vista
- Tabla de reservas con ordenamiento por columna

### 1.2 Shopify Admin

**Lo que hace bien:**
- "Home" inteligente con tarjetas de accion contextual ("Tienes 3 pedidos pendientes")
- Timeline de actividad reciente con iconos por tipo de evento
- Sistema de notificaciones con badge de conteo en sidebar
- Cards de resumen con acciones inline (no hay que navegar para confirmar un pedido)
- Busqueda global (Cmd+K) que busca en pedidos, clientes, productos

**Adaptable a nuestro caso:**
- Dashboard "inteligente" con acciones pendientes priorizadas
- Busqueda global con Command Palette (Cmd+K)
- Timeline de actividad: "Juan reservo Solar 450 hace 5 min", "Pago recibido de Maria"
- Tarjetas de accion: "3 reservas pendientes de confirmacion", "1 barco necesita revision"

### 1.3 HubSpot CRM

**Lo que hace bien:**
- Vista de pipeline visual (kanban) para deals/oportunidades
- Perfil de contacto 360 grados: todas las interacciones en un timeline
- Filtros avanzados guardables ("mis filtros")
- Integracion de comunicaciones: email, llamada, WhatsApp desde el mismo perfil

**Adaptable a nuestro caso:**
- Kanban de reservas por estado (Borrador > Pendiente > Confirmada > Completada)
- Perfil de cliente con timeline: reservas pasadas, mensajes WhatsApp, pagos
- Accion de WhatsApp integrada directamente en cada contexto relevante

### 1.4 Linear

**Lo que hace bien:**
- Velocidad brutal: todo se siente instantaneo
- Atajos de teclado para todo
- Interfaz limpia con mucho espacio en blanco
- Transiciones suaves y feedback visual inmediato
- Vista de lista ultra-densa cuando se necesita

**Adaptable a nuestro caso:**
- Optimistic updates para todas las mutaciones
- Atajos de teclado: N (nueva reserva), / (buscar), E (editar seleccionada)
- Transiciones con Framer Motion para cambios de vista
- Modo compacto para la tabla de reservas

### 1.5 Patrones Universales Identificados

| Patron | Descripcion | Prioridad |
|--------|------------|-----------|
| Sidebar persistente | Navegacion siempre visible, colapsable a iconos | CRITICA |
| Command Palette | Busqueda global con Cmd+K | ALTA |
| Panel lateral (Sheet) | Detalle sin perder contexto de la lista | CRITICA |
| KPI con tendencia | Metricas con sparkline o delta porcentual | ALTA |
| Acciones contextuales | Las acciones mas comunes a 1 clic | CRITICA |
| Filtros persistentes | Los filtros se mantienen al navegar | MEDIA |
| Notificaciones | Badge con conteo de items pendientes | MEDIA |
| Atajos de teclado | Para usuarios avanzados | BAJA |
| Vista calendario | Indispensable para negocios con slots temporales | CRITICA |
| Busqueda en tiempo real | Sin boton "buscar", filtrado mientras se escribe | ALTA |

---

## 2. Analisis del Admin Actual

### 2.1 Inventario de Archivos

```
client/src/components/
  CRMDashboard.tsx          (1780 lineas - componente monolitico)
  crm/
    index.ts                (re-exports)
    types.ts                (schemas Zod + tipos)
    constants.ts            (opciones de equipamiento)
    FleetManagement.tsx     (1431 lineas - gestion de barcos)
    EmployeeManagement.tsx  (327 lineas)
    GalleryManagement.tsx   (194 lineas)
    GiftCardManagement.tsx  (255 lineas)
    DiscountManagement.tsx  (490 lineas)
```

**Total: ~4,477 lineas de codigo CRM**

### 2.2 Problemas de Usabilidad Criticos

#### P1: Navegacion por tabs horizontales (CRITICO)

**Problema:** La navegacion actual usa tabs horizontales con scroll horizontal en movil.

```tsx
// CRMDashboard.tsx linea 591-620
<div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 overflow-x-auto pb-2 -mx-4 px-4">
  {[
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "bookings", label: "Reservas", icon: Calendar },
    // ... hasta 8 tabs
  ].map((tab) => ( ... ))}
</div>
```

**Impacto:** En movil (60%+ del trafico admin), el usuario no ve todas las opciones. Las tabs "Regalos", "Descuentos", "Equipo" quedan ocultas fuera de pantalla. No hay indicacion visual de que hay mas tabs a la derecha.

**Solucion:** Sidebar persistente con `SidebarProvider` de shadcn/ui (ya instalado en `client/src/components/ui/sidebar.tsx`). En movil, colapsa a Sheet lateral activable con hamburger.

#### P2: Componente monolitico (CRITICO)

**Problema:** `CRMDashboard.tsx` tiene 1,780 lineas con toda la logica de dashboard, bookings, customers, y el modal de detalle/edicion/creacion embebidos en un solo componente.

**Impacto:**
- 15 hooks useState en un solo componente
- 6 queries de react-query
- 4 mutations
- Re-render completo del admin al cambiar cualquier estado
- Imposible de mantener o extender

**Solucion:** Arquitectura modular con React Router/layouts anidados. Cada seccion es su propia ruta y componente.

#### P3: Modal bloqueante para detalle de reserva (ALTO)

**Problema:** Al hacer clic en "Ver" reserva, se abre un Dialog modal centrado que:
- Bloquea la interaccion con la tabla de fondo
- Obliga a cerrar para ver otra reserva
- No permite comparar reservas
- El formulario de edicion reutiliza el mismo modal, creando confusion entre "ver" y "editar"

```tsx
// CRMDashboard.tsx linea 1356-1776
<Dialog open={showBookingDetails} onOpenChange={...}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    {/* 420 lineas de contenido mezclando vista y edicion */}
  </DialogContent>
</Dialog>
```

**Solucion:** Usar shadcn/ui `Sheet` como panel lateral derecho (patron Stripe). La tabla sigue visible y navegable. Vista y edicion son estados separados con transicion animada.

#### P4: Sin vista de calendario (CRITICO)

**Problema:** Para un negocio de alquiler por horas, la vista de calendario es la herramienta principal. Actualmente solo hay tabla y lista. El operador en el puerto necesita ver de un vistazo "que barcos salen hoy y a que hora".

**Solucion:** Calendario interactivo como vista principal del dashboard con:
- Vista dia: timeline por barco (filas) x horas (columnas)
- Vista semana: grid compacto
- Vista mes: resumen con indicador de ocupacion

#### P5: KPIs sin contexto (MEDIO)

**Problema:** Las 4 metricas (Reservas, Ingresos, Barcos disponibles, Tasa ocupacion) muestran solo el valor actual sin comparativa.

```tsx
// Solo muestra el numero crudo
<div className="text-2xl font-bold">
  {statsLoading ? "..." : stats?.bookingsCount ?? 0}
</div>
<p className="text-xs text-muted-foreground">Hoy</p>
```

**Solucion:** Anadir delta porcentual vs periodo anterior y mini sparkline. "12 reservas (+33% vs semana pasada)".

#### P6: Sin paginacion en tablas (MEDIO)

**Problema:** Las tablas de reservas y clientes cargan TODOS los registros de una vez. Con crecimiento de datos, esto degradara performance.

**Solucion:** Paginacion server-side con `limit` / `offset`, con controles de pagina al pie de tabla.

#### P7: Filtro duplicado en tabla de reservas (BAJO)

**Problema:** El filtrado de la tabla de reservas se implementa dos veces: una para desktop (dentro de `<Table>`) y otra para movil (dentro del mapa de cards). Ambos usan IIFEs inline que recalculan los filtros.

```tsx
// Linea 891-978: Filtrado desktop
{(() => {
  let filteredBookings = bookingsData || [];
  if (statusFilter !== "all") { ... }
  if (searchQuery) { ... }
  // ...render table rows
})()}

// Linea 1003-1087: Filtrado movil (DUPLICADO)
{(() => {
  let filteredBookings = bookingsData || [];
  if (statusFilter !== "all") { ... }
  if (searchQuery) { ... }
  // ...render cards
})()}
```

**Solucion:** Hook `useFilteredBookings(bookingsData, { status, search })` que retorna datos filtrados, compartido entre ambas vistas.

### 2.3 Lo que Funciona Bien

| Aspecto | Detalle |
|---------|---------|
| Mobile cards | La vista de cards para movil es buena y clara |
| WhatsApp integrado | El boton de WhatsApp en cada reserva/cliente es util |
| Toast notifications | Feedback claro en acciones |
| Drag & drop en flota | La reordenacion de barcos con @dnd-kit funciona bien |
| Exportar CSV | Funcionalidad util que debe mantenerse |
| Roles admin/employee | La logica de permisos por rol esta bien planteada |
| Manejo de errores 401 | El auto-logout por sesion expirada es correcto |

### 2.4 Metricas de Tamano y Complejidad

| Metrica | Valor | Evaluacion |
|---------|-------|------------|
| Lineas totales CRM | ~4,500 | Manejable pero monolitico |
| Componentes CRM | 6 | Insuficiente (deberian ser 15-20) |
| Queries react-query | 6 en un componente | Demasiadas para un componente |
| Estados useState | 15 en CRMDashboard | Necesita useReducer o separacion |
| Secciones admin | 8 tabs | Correcto, pero mal organizadas |
| Vistas responsive | 2 (table + cards) | Bien, mantener patron |

---

## 3. Arquitectura del Admin Ideal

### 3.1 Estructura de Navegacion

```
/crm                          -> Redirige a /crm/dashboard
/crm/dashboard                -> Vista principal con KPIs y actividad
/crm/calendario               -> Vista calendario dia/semana/mes
/crm/reservas                 -> Lista/tabla de reservas
/crm/reservas/:id             -> Detalle de reserva (Sheet lateral)
/crm/clientes                 -> Lista de clientes
/crm/clientes/:phone          -> Perfil de cliente
/crm/flota                    -> Gestion de barcos
/crm/flota/:id                -> Detalle/edicion de barco
/crm/marketing                -> Sub-secciones agrupadas:
/crm/marketing/descuentos     ->   Codigos de descuento
/crm/marketing/regalos        ->   Tarjetas regalo
/crm/marketing/campanas       ->   Campanas email/WhatsApp
/crm/galeria                  -> Moderacion de fotos
/crm/configuracion            -> Settings:
/crm/configuracion/equipo     ->   Gestion de empleados
/crm/configuracion/negocio    ->   Datos del negocio
/crm/configuracion/emails     ->   Templates de email
```

### 3.2 Layout Principal: Sidebar + Contenido

```
+------------------+------------------------------------------------+
|                  |                                                |
|   SIDEBAR        |   CONTENT AREA                                |
|                  |                                                |
|   [Logo]         |   [Breadcrumb: CRM > Reservas]                |
|                  |   [Page Title]  [Actions: + Nueva, Export]     |
|   Dashboard      |                                                |
|   Calendario     |   +--KPI Cards--------------------------------+|
|   Reservas  (5)  |   | Reservas | Ingresos | Ocupacion | Pend.  ||
|   Clientes       |   +------------------------------------------+|
|   Flota          |                                                |
|                  |   +--Content-----------------------------------+|
|   --- Marketing  |   |                                           ||
|   Descuentos     |   |  [Tabla / Calendario / Cards]             ||
|   Regalos        |   |                                           ||
|                  |   |                                           ||
|   --- Ajustes    |   |                                           ||
|   Galeria        |   |                                           ||
|   Equipo         |   |                                           ||
|   Config         |   +-------------------------------------------+|
|                  |                                                |
|   [User: Ivan]   |                                                |
|   [Cerrar sesion]|                                                |
+------------------+------------------------------------------------+
     240px (16rem)              Resto del viewport
```

**En movil (< 768px):**
```
+------------------------------------------------+
| [=] CRM Costa Brava            [+] [Bell] [?]  |
+------------------------------------------------+
|                                                 |
|   CONTENT AREA (full width)                     |
|                                                 |
|   +--KPI Cards (horizontal scroll)----------+   |
|   | Reservas 12 | Ingresos 2.4k | Ocup. 85% |  |
|   +------------------------------------------+  |
|                                                 |
|   +--Content (cards view)--------------------+  |
|   |  [Card reserva 1]                        |  |
|   |  [Card reserva 2]                        |  |
|   |  [Card reserva 3]                        |  |
|   +------------------------------------------+  |
|                                                 |
+------------------------------------------------+
| [Home] [Cal] [Reservas] [Clientes] [Mas...]    |  <- Bottom tab bar
+------------------------------------------------+
```

### 3.3 Estructura de Componentes Propuesta

```
client/src/
  components/
    admin/                          # Nuevo directorio admin
      AdminLayout.tsx               # SidebarProvider + Sidebar + main content
      AdminSidebar.tsx              # Sidebar con navegacion
      AdminHeader.tsx               # Header con breadcrumbs y acciones
      AdminBottomNav.tsx            # Navegacion inferior para movil

      dashboard/
        DashboardPage.tsx           # Pagina principal
        KPICard.tsx                 # Card de metrica reutilizable
        KPIGrid.tsx                 # Grid de 4 KPIs
        ActivityFeed.tsx            # Timeline de actividad reciente
        TodaySchedule.tsx           # Resumen visual del dia
        ActionCards.tsx             # "3 reservas pendientes" con CTA
        RevenueChart.tsx            # Grafico de ingresos (recharts)

      calendar/
        CalendarPage.tsx            # Vista calendario
        DayView.tsx                 # Vista dia: timeline por barco
        WeekView.tsx                # Vista semana
        MonthView.tsx               # Vista mes
        CalendarEvent.tsx           # Bloque de reserva en calendario
        CalendarToolbar.tsx         # Controles fecha + vista

      bookings/
        BookingsPage.tsx            # Lista de reservas
        BookingsTable.tsx           # Tabla desktop
        BookingCards.tsx            # Cards movil
        BookingSheet.tsx            # Panel lateral detalle (Sheet)
        BookingForm.tsx             # Formulario crear/editar
        BookingStatusBadge.tsx      # Badge de estado unificado
        BookingFilters.tsx          # Barra de filtros
        BookingKanban.tsx           # Vista kanban opcional

      customers/
        CustomersPage.tsx           # Lista de clientes
        CustomersTable.tsx          # Tabla
        CustomerProfile.tsx         # Perfil detallado con timeline
        CustomerSheet.tsx           # Panel lateral

      fleet/
        FleetPage.tsx               # Vista general de flota
        BoatCard.tsx                # Card de barco (admin)
        BoatForm.tsx                # Formulario crear/editar
        BoatSheet.tsx               # Panel lateral detalle
        MaintenanceLog.tsx          # Log de mantenimiento (futuro)

      marketing/
        DiscountsPage.tsx           # Codigos de descuento
        GiftCardsPage.tsx           # Tarjetas regalo
        CampaignsPage.tsx           # Campanas (futuro)

      gallery/
        GalleryPage.tsx             # Moderacion de fotos
        PhotoCard.tsx               # Card de foto individual

      settings/
        SettingsPage.tsx            # Pagina de configuracion
        TeamSection.tsx             # Gestion de equipo
        BusinessSection.tsx         # Datos del negocio

      shared/
        DataTable.tsx               # Tabla generica con sort + paginacion
        EmptyState.tsx              # Estado vacio reutilizable
        LoadingState.tsx            # Skeleton loading reutilizable
        SearchInput.tsx             # Input de busqueda con debounce
        StatusBadge.tsx             # Badge de estado generico
        CommandPalette.tsx          # Busqueda global Cmd+K
        DateRangePicker.tsx         # Selector de rango de fechas
        StatCard.tsx                # Card de estadistica generica

    hooks/
      useAdminAuth.ts              # Hook de autenticacion admin
      useFilteredData.ts           # Hook generico de filtrado
      useBookingActions.ts         # Acciones de reserva (mutations)
      useCommandPalette.ts         # Estado del Command Palette
      useCalendarView.ts           # Estado y logica del calendario
```

**Estimacion: ~35 componentes vs los 6 actuales. Cada uno con < 200 lineas.**

### 3.4 Flujos de Usuario Principales

#### Flujo 1: Dia Normal en el Puerto (el mas critico)

```
1. Ivan abre /crm en el movil a las 8:00
2. Ve el Dashboard con "Resumen de Hoy":
   - 6 reservas programadas para hoy
   - Timeline visual: 10:00 Solar 450 (Juan), 10:00 Astec 480 (Maria), ...
   - 1 reserva pendiente de pago (banner naranja)
   - Ingresos de hoy: 840 EUR
3. Toca "Calendario" en la nav inferior
4. Ve el dia de hoy con barcos en filas y horas en columnas
5. Los bloques de color muestran que barcos estan ocupados y cuando
6. Toca un bloque -> Se abre Sheet lateral con detalle de la reserva
7. Puede confirmar, llamar al cliente por WhatsApp, o editar desde ahi
8. Un cliente llega al puerto sin reserva
9. Ivan toca [+] Nueva Reserva
10. Formulario rapido: elige barco, hora, datos minimos -> Confirmar
```

#### Flujo 2: Revision de Fin de Semana

```
1. Ivan abre /crm/dashboard en desktop el lunes
2. Cambia filtro temporal a "Ultima semana"
3. Ve KPIs: 28 reservas, 4.200 EUR, ocupacion 78%
4. Grafico de ingresos muestra pico el sabado
5. Navega a "Clientes" para ver nuevos clientes del fin de semana
6. Identifica 3 clientes repetidores -> puede enviarles descuento
7. Va a "Marketing > Descuentos" y crea codigos personalizados
8. Exporta reporte CSV para contabilidad
```

#### Flujo 3: Gestion de Reserva Problematica

```
1. Llega un email de cancelacion
2. Ivan busca la reserva con Cmd+K (o barra de busqueda)
3. Escribe el nombre del cliente
4. Aparece la reserva en resultados instantaneos
5. Clic -> Sheet lateral con todos los detalles
6. Clic "Cancelar Reserva" -> Confirmacion con dialogo
7. Sistema automaticamente: marca como cancelada, libera slot
8. Ivan toca "WhatsApp" para confirmar la cancelacion al cliente
```

---

## 4. Sistema de Diseno Admin

### 4.1 Paleta de Colores Admin

El admin usa una paleta diferenciada pero coherente con la marca. Mas profesional, menos "vacacional" que el sitio publico.

```css
/* Admin-specific tokens (se anaden a :root o via clase .admin) */

/* Fondo admin: ligeramente mas frio que el sitio publico */
--admin-bg: 210 15% 97%;              /* Gris azulado muy claro */
--admin-surface: 0 0% 100%;           /* Blanco puro para cards */
--admin-surface-hover: 210 10% 98%;   /* Hover sutil */

/* Sidebar */
--admin-sidebar-bg: 215 25% 15%;      /* Azul muy oscuro (casi negro) */
--admin-sidebar-text: 210 15% 75%;    /* Gris claro */
--admin-sidebar-active: 210 85% 25%;  /* Primary como fondo activo */
--admin-sidebar-active-text: 0 0% 100%; /* Blanco */
--admin-sidebar-hover: 215 20% 20%;   /* Hover sutil */

/* Estados semanticos (ya definidos pero reforzados para admin) */
--admin-success: 142 71% 45%;         /* Verde */
--admin-warning: 38 92% 50%;          /* Ambar */
--admin-error: 0 84% 60%;             /* Rojo */
--admin-info: 210 85% 25%;            /* Primary */

/* Colores de estado de reserva */
--booking-draft: 210 10% 65%;         /* Gris neutro */
--booking-hold: 38 92% 50%;           /* Ambar */
--booking-pending: 25 95% 53%;        /* Naranja */
--booking-confirmed: 142 71% 45%;     /* Verde */
--booking-cancelled: 0 84% 60%;       /* Rojo */
--booking-completed: 210 85% 25%;     /* Azul primary */

/* Colores de barco (para calendario) - 7 barcos = 7 colores */
--boat-solar-450: 210 85% 45%;        /* Azul */
--boat-astec-480: 142 60% 40%;        /* Verde */
--boat-voraz-500: 25 90% 50%;         /* Naranja */
--boat-mareti-585: 280 65% 50%;       /* Purpura */
--boat-bwa-19: 185 75% 40%;           /* Turquesa */
--boat-flyer-747: 350 75% 55%;        /* Rosa/Rojo */
--boat-quicksilver: 45 85% 50%;       /* Dorado */
```

### 4.2 Tipografia Admin

```css
/* Titulos de pagina */
.admin-page-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;       /* 24px */
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: hsl(var(--foreground));
}

/* Titulos de seccion/card */
.admin-section-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;          /* 16px */
  font-weight: 600;
  color: hsl(var(--foreground));
}

/* KPI numeros grandes */
.admin-kpi-value {
  font-family: 'Inter', sans-serif;
  font-size: 1.875rem;      /* 30px */
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

/* Texto de tabla */
.admin-table-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;      /* 14px */
  font-weight: 400;
  color: hsl(var(--foreground));
}

/* Labels y metadata */
.admin-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;       /* 12px */
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### 4.3 Espaciado y Layout

```
Sidebar ancho:           16rem (256px) expandido, 3rem (48px) colapsado
Padding de pagina:       1.5rem (24px) en desktop, 1rem (16px) en movil
Gap entre cards:         1.5rem (24px) en desktop, 0.75rem (12px) en movil
Padding interno card:    1.5rem (24px)
Border radius cards:     0.5rem (8px) - var(--radius)
Sheet lateral ancho:     28rem (448px) en desktop, 100% en movil
Bottom nav altura:       4rem (64px) solo en movil
Header altura:           3.5rem (56px)
Tabla fila altura:       3rem (48px) para densidad optima
```

### 4.4 Iconografia

Se usa **Lucide React** exclusivamente (ya es dependencia del proyecto). Iconos para cada seccion:

```typescript
const ADMIN_NAV_ICONS = {
  dashboard:    LayoutDashboard,   // Vista general
  calendar:     CalendarDays,      // Calendario
  bookings:     ClipboardList,     // Reservas
  customers:    Users,             // Clientes
  fleet:        Ship,              // Flota (cambiar Anchor -> Ship)
  discounts:    Percent,           // Descuentos
  giftCards:    Gift,              // Tarjetas regalo
  gallery:      Image,             // Galeria
  team:         UserCog,           // Equipo
  settings:     Settings,          // Configuracion
  search:       Search,            // Busqueda
  notifications: Bell,             // Notificaciones
  whatsapp:     MessageCircle,     // WhatsApp (ya usado)
  export:       Download,          // Exportar
  newBooking:   Plus,              // Nueva reserva
};
```

### 4.5 Componentes Base Reutilizables

#### StatCard (KPI)

```
+-----------------------------------------------+
|  [Icon]  Reservas Hoy                         |
|                                                |
|  12          +33%  [mini sparkline ~~~~]       |
|  vs 9 ayer                                    |
+-----------------------------------------------+

Tailwind: rounded-lg border bg-card p-6 shadow-sm
Variantes: default, highlight (borde primary para metricas clave)
```

#### StatusBadge

```typescript
// Mapeo unificado de colores por estado
const STATUS_STYLES = {
  draft:           "bg-gray-100 text-gray-700 border-gray-200",
  hold:            "bg-amber-50 text-amber-700 border-amber-200",
  pending_payment: "bg-orange-50 text-orange-700 border-orange-200",
  confirmed:       "bg-green-50 text-green-700 border-green-200",
  cancelled:       "bg-red-50 text-red-700 border-red-200",
  completed:       "bg-blue-50 text-blue-700 border-blue-200",
} as const;
```

#### DataTable

```
+-----------------------------------------------+
| [Search input]   [Status filter v]  [Export]  |
+-----------------------------------------------+
| Fecha  | Cliente  | Barco | Total | Estado  |>|
|--------|----------|-------|-------|---------|--|
| 15/02  | Juan G.  | Solar | 120   | [Conf]  | |
| 15/02  | Maria L. | Astec | 180   | [Pend]  | |
| 14/02  | Peter K. | BWA   | 350   | [Conf]  | |
|--------|----------|-------|-------|---------|--|
| Mostrando 1-25 de 142        [<] [1] [2] [>] |
+-----------------------------------------------+

Caracteristicas:
- Columnas ordenables (clic en header)
- Clic en fila -> abre Sheet lateral
- Checkbox para seleccion multiple (acciones masivas futuras)
- Paginacion server-side
- Responsive: tabla en desktop, cards en movil
```

#### BookingSheet (Panel Lateral)

```
+---------------------------+
| [<- Cerrar]   Reserva #42 |
+---------------------------+
|                           |
|  Juan Garcia              |
|  +34 612 345 678          |
|  juan@email.com           |
|                           |
|  [WhatsApp] [Llamar]     |
|                           |
|  --- Reserva ---          |
|  Barco: Solar 450         |
|  Fecha: 15/02/2026        |
|  Hora: 10:00 - 12:00      |
|  Personas: 4              |
|  Estado: [Confirmada]     |
|                           |
|  --- Pago ---             |
|  Subtotal:    120.00      |
|  Extras:       20.00      |
|  Total:       140.00      |
|  Estado pago: [Pagado]    |
|  Stripe: pi_xxx...        |
|                           |
|  --- Notas ---            |
|  "Cliente habitual, le    |
|   gusta la cala de Sa..." |
|                           |
|  [Editar] [Cancelar]     |
+---------------------------+

Tailwind del Sheet:
- Desktop: fixed right-0 w-[28rem] h-full border-l shadow-xl
- Movil: full screen (Sheet de shadcn/ui)
```

---

## 5. Wireframes Conceptuales

### 5.1 Dashboard Principal (`/crm/dashboard`)

```
+--[Sidebar]--+--[Content]--------------------------------------+
|             |                                                  |
| [Logo]      |  Dashboard                                       |
|             |  Hoy, 15 de febrero 2026                         |
| Dashboard * |                                                  |
| Calendario  |  +--Alertas------------------------------------+ |
| Reservas(3) |  | [!] 3 reservas pendientes de confirmacion    | |
| Clientes    |  | [!] 1 pago fallido requiere atencion         | |
| Flota       |  +--------------------------------------------+ |
|             |                                                  |
| Marketing > |  +--KPIs--------------------------------------+ |
| Galeria     |  | Reservas  | Ingresos   | Ocupacion | Pend.  | |
| Equipo      |  | 12        | 1,840 EUR  | 85%       | 3      | |
|             |  | +33% hoy  | +12% sem   | ~~~~~     | -2     | |
| [Ivan]      |  +--------------------------------------------+ |
| [Logout]    |                                                  |
|             |  +--Hoy-------+--Actividad Reciente-----------+ |
|             |  | 10:00      | [*] Juan reservo Solar 450    | |
|             |  |  Solar 450 |     hace 15 min, 120 EUR      | |
|             |  |  Juan G.   | [*] Pago recibido Maria L.    | |
|             |  | 10:00      |     140 EUR via Stripe         | |
|             |  |  Astec 480 | [*] Cancelacion Peter K.       | |
|             |  |  Maria L.  |     BWA 19, 350 EUR            | |
|             |  | 12:00      | [*] Nueva reserva web          | |
|             |  |  BWA 19    |     Astec 480, manana 10:00    | |
|             |  |  (libre)   |                                 | |
|             |  | 14:00      |                                 | |
|             |  |  Solar 450 |                                 | |
|             |  |  Ana R.    |                                 | |
|             |  +------------+---------------------------------+ |
|             |                                                  |
|             |  +--Ingresos Semana (grafico)-------------------+ |
|             |  |      ___                                      | |
|             |  |   __/   \___                                  | |
|             |  |  /          \___                              | |
|             |  | L   M   X   J   V   S   D                    | |
|             |  +----------------------------------------------+ |
+-------------+--------------------------------------------------+
```

**Jerarquia de informacion:**
1. Alertas/acciones pendientes (lo mas urgente arriba)
2. KPIs del periodo seleccionado
3. Resumen del dia actual (lado izquierdo) + Actividad reciente (lado derecho)
4. Grafico de tendencia semanal

### 5.2 Vista Calendario (`/crm/calendario`)

```
+--[Sidebar]--+--[Content]--------------------------------------+
|             |                                                  |
|             |  Calendario   [< Hoy >]   [Dia|Semana|Mes]      |
|             |                                                  |
|             |  Sabado, 15 de febrero 2026                      |
|             |                                                  |
|             |  Barco     | 09  | 10  | 11  | 12  | 13  | 14  |
|             |  ----------|-----|-----|-----|-----|-----|------|
|             |  Solar 450 | ... |=Juan G.===| ... |==Ana R.==||
|             |  Astec 480 | ... |==Maria L.========| ........||
|             |  Voraz 500 | ... | ... | ... | ... |=Pedro K.=||
|             |  Mareti585 | ... | ... |===Reserva Web===| ...||
|             |  BWA 19    | ... | ... | ... | ... | ... | ...||
|             |  Flyer 747 | ... |==Laura S.==| ... | ... | ..||
|             |  Quicksilv | MANTENIMIENTO =====================|
|             |            |     |     |     |     |     |     |
|             |  ----------|-----|-----|-----|-----|-----|------|
|             |                                                  |
|             |  Leyenda:                                        |
|             |  [====] Confirmada  [----] Pendiente             |
|             |  [....] Disponible  [XXXX] Mantenimiento         |
|             |                                                  |
+-------------+--------------------------------------------------+

Interacciones:
- Clic en bloque de reserva -> Sheet lateral con detalle
- Clic en slot vacio -> Crear reserva para ese barco/hora
- Drag en slot vacio -> Crear reserva con rango de horas
- Los bloques tienen color asignado por barco
- Hover muestra tooltip: "Juan Garcia, 2h, 120 EUR, Confirmada"
```

### 5.3 Reservas (`/crm/reservas`)

```
+--[Sidebar]--+--[Content]------------------+--[Sheet]---------+
|             |                              |                  |
|             |  Reservas  [+ Nueva Reserva] | Reserva #42      |
|             |                              |                  |
|             |  [Search...] [Estado v]      | Juan Garcia      |
|             |  [Fecha desde] [Fecha hasta] | +34 612 345 678  |
|             |                              | [WA] [Llamar]    |
|             |  +--Tabla------------------+ |                  |
|             |  | Fecha  Cli. Barco Total | | --- Detalle ---  |
|             |  |--------|-----|-----|----| | Solar 450        |
|             |  | 15/02  Juan  Sol  120  >| | 15/02 10-12h     |
|             |  | 15/02  Mari  Ast  180   | | 4 personas       |
|             |  | 14/02  Pete  BWA  350   | | [Confirmada]     |
|             |  | 14/02  Laur  Fly  200   | |                  |
|             |  | 13/02  Ana   Mar  280   | | --- Pago ---     |
|             |  | 13/02  Carl  Vora 150   | | Total: 140 EUR   |
|             |  | 12/02  Sofi  Sol  120   | | [Pagado]         |
|             |  |                         | |                  |
|             |  | Pag 1 de 6  [<] [>]     | | [Editar]         |
|             |  +-------------------------+ | [Cancelar]       |
|             |                              |                  |
+-------------+------------------------------+------------------+

Interacciones:
- Clic en fila -> abre Sheet lateral sin perder la tabla
- Flechas arriba/abajo -> navegar entre reservas
- Enter -> abrir detalle
- E -> modo edicion
- Esc -> cerrar Sheet
```

### 5.4 Gestion de Flota (`/crm/flota`)

```
+--[Sidebar]--+--[Content]--------------------------------------+
|             |                                                  |
|             |  Flota  [+ Nuevo Barco]  [Importar]              |
|             |                                                  |
|             |  +--Grid de Barcos (3 columnas)----------------+ |
|             |  |                                              | |
|             |  | +----------+ +----------+ +----------+      | |
|             |  | | [Foto]   | | [Foto]   | | [Foto]   |      | |
|             |  | | Solar 450| | Astec 480| | Voraz 500|      | |
|             |  | | 5 pers.  | | 6 pers.  | | 5 pers.  |      | |
|             |  | | Sin lic. | | Sin lic. | | Sin lic. |      | |
|             |  | |          | |          | |          |      | |
|             |  | | Estado:  | | Estado:  | | Estado:  |      | |
|             |  | | [Activo] | | [Activo] | | [Manten] |      | |
|             |  | |          | |          | |          |      | |
|             |  | | Prox:    | | Prox:    | | Prox:    |      | |
|             |  | | Hoy 10h  | | Hoy 10h  | | --       |      | |
|             |  | |          | |          | |          |      | |
|             |  | | [Editar] | | [Editar] | | [Editar] |      | |
|             |  | | [Drag]   | | [Drag]   | | [Drag]   |      | |
|             |  | +----------+ +----------+ +----------+      | |
|             |  |                                              | |
|             |  | +----------+ +----------+ +----------+      | |
|             |  | | Mareti   | | BWA 19   | | Flyer    |      | |
|             |  | | ...      | | ...      | | ...      |      | |
|             |  | +----------+ +----------+ +----------+      | |
|             |  +----------------------------------------------+ |
|             |                                                  |
+-------------+--------------------------------------------------+

Mejoras sobre el actual:
- Vista de grid con fotos (no solo tabla)
- Indicador de proxima reserva en cada card
- Estado de mantenimiento visible
- Drag & drop para reordenar (mantener funcionalidad actual)
- Clic en card -> Sheet lateral con detalle completo
```

### 5.5 Perfil de Cliente (`/crm/clientes/:phone`)

```
+--[Sidebar]--+--[Content]--------------------------------------+
|             |                                                  |
|             |  [< Clientes]  Juan Garcia                       |
|             |                                                  |
|             |  +--Info------+--Estadisticas------------------+ |
|             |  |            |                                 | |
|             |  | Juan Garcia|  Total gastado: 1.240 EUR       | |
|             |  | ES         |  Reservas: 8                    | |
|             |  | +34 612... |  Ultima: hace 3 dias            | |
|             |  | juan@...   |  Barco favorito: Solar 450      | |
|             |  |            |  Cliente desde: Junio 2025      | |
|             |  | [WhatsApp] |                                 | |
|             |  | [Email]    |  [Crear Descuento Especial]     | |
|             |  +------------+---------------------------------+ |
|             |                                                  |
|             |  +--Timeline de Reservas-----------------------+ |
|             |  |                                              | |
|             |  |  [*] 12/02/2026 - Solar 450                  | |
|             |  |      2h, 120 EUR, Confirmada                 | |
|             |  |      "Todo perfecto, muy contentos"           | |
|             |  |                                              | |
|             |  |  [*] 28/01/2026 - Astec 480                  | |
|             |  |      4h, 240 EUR, Completada                 | |
|             |  |                                              | |
|             |  |  [*] 15/08/2025 - Solar 450                  | |
|             |  |      2h, 140 EUR, Completada                 | |
|             |  |      Uso descuento VERANO-25                 | |
|             |  |                                              | |
|             |  +----------------------------------------------+ |
|             |                                                  |
+-------------+--------------------------------------------------+
```

### 5.6 Movil: Admin desde el Puerto

```
Vista principal movil (Dashboard):

+------------------------------------------------+
| [=]  CRM Costa Brava              [Bell(2)] [+]|
+------------------------------------------------+
|                                                 |
|  +--Alertas (deslizable horizontal)-----------+ |
|  | [!] 3 reservas pendientes                   | |
|  +--------------------------------------------+ |
|                                                 |
|  +--KPIs (deslizable horizontal)--------------+ |
|  | Reservas | Ingresos | Ocupacion             | |
|  |    12    | 1,840EUR |   85%                  | |
|  +--------------------------------------------+ |
|                                                 |
|  HOY - 15 de febrero                            |
|                                                 |
|  10:00 - 12:00                                  |
|  +-------------------------------------------+ |
|  | Solar 450 - Juan Garcia         [Conf] >  | |
|  | 4 personas, 120 EUR                        | |
|  +-------------------------------------------+ |
|  +-------------------------------------------+ |
|  | Astec 480 - Maria Lopez         [Pend] >  | |
|  | 6 personas, 180 EUR                        | |
|  +-------------------------------------------+ |
|                                                 |
|  12:00 - 14:00                                  |
|  +-------------------------------------------+ |
|  | BWA 19 - Peter Klein            [Conf] >  | |
|  | 3 personas, 350 EUR                        | |
|  +-------------------------------------------+ |
|                                                 |
|  14:00 - 16:00                                  |
|  +-------------------------------------------+ |
|  | Solar 450 - Ana Rodriguez       [Conf] >  | |
|  | 5 personas, 200 EUR                        | |
|  +-------------------------------------------+ |
|                                                 |
+------------------------------------------------+
| [Home] [Calendario] [Reservas] [Clientes] [+]  |
+------------------------------------------------+

Touch targets: minimo 44x44px para todos los elementos interactivos
Cards: bordes redondeados, sombra sutil, padding 16px
Bottom nav: 5 items con icono + label, item activo en primary
```

```
Vista Calendario movil (dia):

+------------------------------------------------+
| [<] Hoy, 15 Feb [>]        [Dia|Sem]          |
+------------------------------------------------+
|                                                 |
|  HORA  | BARCOS OCUPADOS                        |
|  ------|---------------------------------------  |
|  09:00 | (vacio)                                 |
|  ------|---------------------------------------  |
|  10:00 | [Solar: Juan] [Astec: Maria]            |
|  ------|---------------------------------------  |
|  11:00 | [Solar: Juan] [Astec: Maria]            |
|  ------|---------------------------------------  |
|  12:00 | [BWA: Peter]  [Astec: Maria]            |
|  ------|---------------------------------------  |
|  13:00 | [BWA: Peter]                            |
|  ------|---------------------------------------  |
|  14:00 | [Solar: Ana]  [Flyer: Laura]            |
|  ------|---------------------------------------  |
|  15:00 | [Solar: Ana]  [Flyer: Laura]            |
|  ------|---------------------------------------  |
|  16:00 | (vacio)                                 |
|                                                 |
|  Resumen: 5/7 barcos usados hoy                |
|  Ingresos estimados: 1,390 EUR                  |
|                                                 |
+------------------------------------------------+
| [Home] [Calendario] [Reservas] [Clientes] [+]  |
+------------------------------------------------+

Chips de barco: coloreados por barco, tappable -> Sheet detalle
```

---

## 6. Plan de Implementacion

### 6.1 Fases

#### Fase 1: Fundacion (Prioridad CRITICA) - Estimacion: 3-4 dias

1. **AdminLayout** con SidebarProvider de shadcn/ui
   - Sidebar con navegacion completa
   - Bottom nav para movil
   - Header con breadcrumbs
   - Responsive breakpoints

2. **Refactor CRMDashboard -> componentes modulares**
   - Extraer DashboardPage, BookingsPage, CustomersPage
   - Cada uno como componente independiente
   - Crear rutas `/crm/*` en App.tsx

3. **BookingSheet** (panel lateral)
   - Reemplazar Dialog modal por Sheet lateral
   - Vista detalle y modo edicion separados
   - Acciones contextuales (confirmar, cancelar, WhatsApp)

#### Fase 2: Calendario (Prioridad CRITICA) - Estimacion: 2-3 dias

4. **CalendarPage** con vista dia
   - Timeline por barco (filas) x horas (columnas)
   - Bloques coloreados por barco
   - Clic en bloque -> Sheet detalle
   - Clic en vacio -> nueva reserva
   - API endpoint para obtener disponibilidad del dia

5. **Vista semana y mes**
   - Semana: grid compacto
   - Mes: indicadores de ocupacion por dia

#### Fase 3: Mejoras de Dashboard (Prioridad ALTA) - Estimacion: 2 dias

6. **KPI Cards mejorados**
   - Delta porcentual vs periodo anterior
   - Mini sparklines con recharts
   - Tarjetas de accion contextual

7. **ActivityFeed**
   - Timeline de eventos recientes
   - API endpoint para actividad

8. **TodaySchedule**
   - Resumen visual del dia agrupado por hora

#### Fase 4: CRM de Clientes (Prioridad ALTA) - Estimacion: 2 dias

9. **CustomerProfile**
   - Perfil 360 grados con timeline de reservas
   - Estadisticas del cliente
   - Acciones directas (WhatsApp, crear descuento)

10. **DataTable generico**
    - Ordenamiento por columnas
    - Paginacion server-side
    - Responsive (tabla desktop, cards movil)

#### Fase 5: Pulido (Prioridad MEDIA) - Estimacion: 2-3 dias

11. **CommandPalette** (Cmd+K)
    - Busqueda global en reservas, clientes, barcos
    - Usando shadcn/ui `Command` component (ya instalado)

12. **Mejoras de flota**
    - Vista grid con fotos
    - Indicador de proxima reserva
    - Estado de mantenimiento

13. **Marketing agrupado**
    - Descuentos + Regalos bajo seccion "Marketing"
    - UI consistente entre ambas

### 6.2 Prioridades de Implementacion

| # | Tarea | Impacto | Esfuerzo | Prioridad |
|---|-------|---------|----------|-----------|
| 1 | AdminLayout + Sidebar | Fundacional | Alto | P0 |
| 2 | Modularizar CRMDashboard | Fundacional | Alto | P0 |
| 3 | BookingSheet (panel lateral) | UX critica | Medio | P0 |
| 4 | Vista calendario dia | Feature critica | Alto | P0 |
| 5 | KPIs mejorados | UX | Bajo | P1 |
| 6 | DataTable generico | Reutilizable | Medio | P1 |
| 7 | CustomerProfile | CRM value | Medio | P1 |
| 8 | Bottom nav movil | Mobile UX | Bajo | P1 |
| 9 | ActivityFeed | UX | Medio | P2 |
| 10 | CommandPalette | Power users | Medio | P2 |
| 11 | Vista grid flota | UX visual | Bajo | P2 |
| 12 | Marketing agrupado | Organizacion | Bajo | P3 |
| 13 | Calendario semana/mes | Feature | Alto | P3 |
| 14 | Atajos de teclado | Power users | Bajo | P3 |

### 6.3 Dependencias Tecnicas

**Ya disponibles en el proyecto (no requieren instalacion):**
- `shadcn/ui Sidebar` - Componente completo ya instalado en `client/src/components/ui/sidebar.tsx`
- `shadcn/ui Sheet` - Para paneles laterales (ya en `client/src/components/ui/sheet.tsx`)
- `shadcn/ui Command` - Para Command Palette (ya en `client/src/components/ui/command.tsx`)
- `shadcn/ui Tabs` - Para sub-navegacion (ya en `client/src/components/ui/tabs.tsx`)
- `shadcn/ui Skeleton` - Para loading states
- `@tanstack/react-query` - Para data fetching (ya usado)
- `date-fns` - Para formateo de fechas (ya usado)
- `lucide-react` - Para iconos (ya usado)
- `react-hook-form` + `zod` - Para formularios (ya usado)
- `@dnd-kit` - Para drag & drop (ya usado en FleetManagement)
- `tailwindcss-animate` - Para animaciones
- `@tailwindcss/typography` - Para contenido formateado

**Requieren instalacion:**
- `recharts` - Para graficos de ingresos y sparklines (ligero, bien integrado con React)
- Alternativa: se podrian usar SVG paths manuales para sparklines simples

**No se requiere router adicional.** El proyecto ya usa `wouter` que soporta rutas anidadas suficientes para `/crm/*`.

---

## 7. Colaboracion Requerida

### Del CTO (Codigo/Backend)

1. **Nuevos endpoints API necesarios:**
   - `GET /api/admin/calendar?date=2026-02-15` - Reservas del dia agrupadas por barco y hora
   - `GET /api/admin/activity?limit=20` - Feed de actividad reciente (ultimas reservas, pagos, cancelaciones)
   - `GET /api/admin/stats/comparison?period=week` - Stats con comparativa vs periodo anterior
   - `GET /api/admin/bookings?page=1&limit=25&sort=date&order=desc` - Paginacion server-side
   - `GET /api/admin/customers/:phone/profile` - Perfil completo de cliente con historial

2. **Refactor de rutas frontend:**
   - Convertir `/crm` de ruta unica a layout con sub-rutas en `wouter`
   - Patron: `/crm` como layout wrapper, `/crm/dashboard`, `/crm/reservas`, etc.

3. **WebSocket o polling para actualizaciones en tiempo real:**
   - Notificar nueva reserva web al admin que esta en el CRM
   - Actualizar calendario cuando llega un pago
   - No es critico para MVP pero si para la experiencia ideal

### Del CMO (Contenido/Copy)

1. **Labels y microcopy del admin:**
   - Textos de estados vacios ("No hay reservas para hoy. Buen momento para revisar la flota.")
   - Mensajes de confirmacion ("Esta seguro de cancelar la reserva de Juan Garcia?")
   - Tooltips para funcionalidades nuevas
   - Textos del onboarding (primera vez que se abre el nuevo admin)

2. **Nombres de metricas:**
   - Revisar si "Tasa de ocupacion" es el termino correcto para el negocio
   - Definir que significa exactamente cada KPI y su periodo de calculo

---

## Apendice A: Archivos Clave del Proyecto Actual

| Archivo | Lineas | Funcion |
|---------|--------|---------|
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/CRMDashboard.tsx` | 1780 | Componente monolitico principal |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/crm/FleetManagement.tsx` | 1431 | Gestion de flota |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/crm/DiscountManagement.tsx` | 490 | Codigos de descuento |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/crm/EmployeeManagement.tsx` | 327 | Gestion de equipo |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/crm/GiftCardManagement.tsx` | 255 | Tarjetas regalo |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/crm/GalleryManagement.tsx` | 194 | Moderacion de galeria |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/crm/types.ts` | 111 | Tipos y schemas |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/crm/index.ts` | 8 | Re-exports |
| `/Users/macbookpro/costa-brava-rent-a-boat/shared/schema.ts` | 681 | Schemas de base de datos |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/App.tsx` | 305 | Router principal |
| `/Users/macbookpro/costa-brava-rent-a-boat/tailwind.config.ts` | 116 | Configuracion Tailwind |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/index.css` | 419 | CSS variables y utilidades |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/ui/sidebar.tsx` | ~500 | Sidebar shadcn/ui (disponible) |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/ui/sheet.tsx` | ~150 | Sheet shadcn/ui (disponible) |
| `/Users/macbookpro/costa-brava-rent-a-boat/client/src/components/ui/command.tsx` | ~150 | Command palette shadcn/ui (disponible) |

## Apendice B: Impacto Esperado en Metricas

| Metrica | Actual (estimado) | Objetivo | Mejora |
|---------|-------------------|----------|--------|
| Tiempo para encontrar reserva | ~15 seg | ~3 seg | 80% |
| Tiempo para confirmar reserva | ~30 seg (3 clics) | ~5 seg (1 clic) | 83% |
| Tiempo para crear reserva manual | ~2 min | ~45 seg | 62% |
| Visibilidad de disponibilidad | Nula (sin calendario) | Instantanea | Infinita |
| Errores de doble reserva | Posible | Prevenido por calendario | 100% |
| Accesibilidad movil en puerto | Funcional pero lenta | Optimizada | Significativa |
| Numero de secciones accesibles sin scroll | 3 de 8 (movil) | 5 de 8 (bottom nav) | 67% |

---

**Conclusion:** El admin actual es funcional pero no esta a la altura del resto de la plataforma. La inversion principal es en la Fase 1 (Layout + Modularizacion + Sheet lateral) y la Fase 2 (Calendario). Estas dos fases transforman la experiencia del operador en el puerto, que es el usuario mas critico del sistema. El resto de fases son mejoras incrementales que se pueden implementar segun prioridad del negocio.

La buena noticia es que shadcn/ui ya tiene instalados los componentes criticos necesarios (Sidebar, Sheet, Command, Tabs), y la arquitectura con react-query y Zod es solida. No se necesitan librerias pesadas nuevas. El trabajo es principalmente de refactoring y diseno de componentes.
