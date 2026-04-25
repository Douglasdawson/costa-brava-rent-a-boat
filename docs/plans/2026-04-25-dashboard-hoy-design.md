# Dashboard "Hoy" — Design Document

**Date**: 2026-04-25
**Status**: Approved

## Problem

The dashboard opens with KPI charts and revenue trends. Ivan needs to see what's happening RIGHT NOW at the port: which boats are out, who's coming next, and new booking requests.

## Design

### Toggle: Hoy / Reportes

Two modes in the dashboard, toggled via pill buttons at the top.

- **Hoy** (default): Operational cockpit for port use
- **Reportes**: Current DashboardTab content (KPIs, charts, activity feed)

### "Hoy" view structure

#### 1. Status bar (always visible)
Single line: `{n} en agua · {n} libres · {n} reservas hoy`

Derived from:
- "en agua": confirmed bookings where now() is between startTime and endTime
- "libres": total boats minus boats currently in agua
- "reservas hoy": all confirmed + pending_payment bookings for today

#### 2. EN AGUA section
Each boat currently out, showing:
- Boat name + customer name + return time with relative countdown ("vuelve en Xm")
- [Devuelto] button: one tap, changes booking status to "completed" instantly. Shows toast "Barco devuelto". No confirmation dialog (speed is critical in high season).

If no boats are out: "Todos los barcos en puerto"

#### 3. SIGUIENTE section
Next upcoming booking (not yet started). Shows:
- "en Xh Xm" relative time
- Time + customer + boat + duration

If nothing upcoming: hidden

#### 4. MAS TARDE section
Remaining bookings for the day after SIGUIENTE. Compact rows:
- Time + customer + boat + duration

If nothing: hidden

#### 5. PETICIONES section
Latest 2-3 unconfirmed inquiries with [Ver todas] link to Peticiones tab.
- Customer name + requested date

If none: hidden

#### 6. MANANA summary
One line: "MANANA · {n} reservas · {times}"

If no bookings tomorrow: hidden

### Data sources (all existing endpoints)

- Bookings today: `GET /api/admin/bookings?status=confirmed,pending_payment&date=today`
- Bookings tomorrow: same with tomorrow's date
- Inquiries: `GET /api/admin/inquiries?status=pending&limit=3`
- Boats: `GET /api/boats` (for total count and names)
- Mark completed: `PATCH /api/admin/bookings/:id` with `{ status: "completed" }`

### "Reportes" view

Exactly the current DashboardTab content:
- Period selector
- Upcoming bookings (now first)
- KPI StatCards (Ingresos, Reservas, Ticket Medio, Ocupacion)
- Activity feed
- Charts (Revenue, Boat performance, Status distribution)

### Boat "en agua" logic

A booking is "en agua" when:
- `bookingStatus` is "confirmed"
- `new Date(startTime) <= now`
- `new Date(endTime) >= now`

### Countdown logic

- "vuelve en Xm": `endTime - now`, formatted as minutes or hours+minutes
- "en Xh Xm": `startTime - now` for SIGUIENTE
- Updates on component mount and every 60 seconds (setInterval)
- Static time shown alongside relative: "vuelve 11:30 (en 40m)"

### Component architecture

```
DashboardTab.tsx (existing, modified)
  |-- mode state: "hoy" | "reportes"
  |-- mode === "hoy":
  |     |-- DashboardHoy.tsx (NEW)
  |           |-- StatusBar
  |           |-- EnAguaSection (with [Devuelto] buttons)
  |           |-- SiguienteSection
  |           |-- MasTardeSection
  |           |-- PeticionesPreview
  |           |-- MananaResumen
  |-- mode === "reportes":
  |     |-- (current DashboardTab content, extracted to DashboardReportes or inline)
```

### What we are NOT building

- No new API endpoints
- No real-time WebSocket updates (polling every 60s is sufficient)
- No drag-and-drop reordering of bookings
- No inline editing of booking details (tap opens the detail modal)
