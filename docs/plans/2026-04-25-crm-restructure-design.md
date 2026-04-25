# CRM Admin Panel Restructure — Design Document

**Date**: 2026-04-25
**Status**: Approved

## Problem

The CRM has 17+ visible tabs organized in 3 groups (CRM, Flota, Negocio), with the "Negocio" group alone containing 8 tabs. The Dashboard shows financial KPIs when the owner needs an operational cockpit. Four separate tabs (SEO, SEO Engine, Autopilot, Competencia) all relate to online positioning but are disconnected.

## Design

### Navigation: 7 primary tabs + "Mas" overflow

Flat tabs, no groups. 7 is within working memory limits, groups are unnecessary.

```
[Dashboard] [Calendario] [Reservas] [Peticiones] [Flota] [SEO] [Autopilot] [Mas v]
```

**"Mas" popover** (one tap/click to open):
Clientes, Mantenimiento, Inventario, Galeria, Blog, Regalos, Descuentos, Usuarios (owner), Config (owner)

**Eliminated from main nav:**
- Reportes → absorbed into Dashboard > Reportes toggle
- SEO Engine → absorbed into SEO > Analisis sub-tab
- Competencia → absorbed into SEO > Resumen (scoreboard) + Analisis (GBP, moat)

### Dashboard: Dual-mode with "Hoy" / "Reportes" toggle

#### Mode: "Hoy" (default)

An operational cockpit for a port operator checking his phone between boat handoffs.

**Structure:**

1. **Status bar**: "3 barcos en agua · 2 libres · 1 vuelve en 40m"

2. **AHORA section**: Boats currently in water, each showing:
   - Boat name + customer name + return time with countdown
   - Time out since + duration + license type
   - One-tap [Devuelto] action button

3. **PROXIMO section**: Next upcoming booking with "en Xh Xm" countdown

4. **MAS TARDE section**: Rest of today's bookings, compact rows

5. **Peticiones preview**: 2-3 newest unconfirmed requests, compact. Link to Peticiones tab for full list.

6. **Manana summary**: One line "3 reservas · 09:00 / 10:30 / 14:00"

**Data sources:**
- Bookings for today from /api/admin/bookings with date filter
- Boat availability from /api/boats + active bookings
- Peticiones from /api/admin/inquiries with status=pending
- Tomorrow bookings from same endpoint with tomorrow's date

#### Mode: "Reportes"

Absorbs current DashboardTab analytics + current ReportsTab content:
- KPI cards (StatCard): Revenue, Bookings, Ticket Medio, Ocupacion with period comparison
- Revenue trend chart (area chart, Recharts)
- Boat performance bar chart
- Booking status distribution
- Period selector (7d/30d/season/year)

### SEO: Unified with 4 sub-tabs

```
[Resumen] [Analisis] [Campanas] [Salud]
```

**Resumen** (existing SeoDashboard):
- 3 metric cards (Posiciones, Trafico, Competidores) with click-to-explore
- Trend charts + data tables
- Competitor scoreboard already integrated

**Analisis** (absorbs AnalyticsTab / SEO Engine):
- GSC overview: clicks, impressions, CTR, avg position
- GA4: sessions, users, conversions by channel/device/country
- Keyword opportunities (low CTR, almost page 1)
- Traffic trends chart
- NEW: Competitor GBP rating + language moat section (from CompetitionTab)

**Campanas** (merges Campaigns + Experiments):
- Campaign list with progress bars
- Experiments with hypothesis/result/learning
- Combined because they're the same workflow: plan > execute > measure

**Salud** (unchanged):
- Health checks (meta, canonical, hreflang, schema)
- Core Web Vitals

### Tabs unchanged

- Calendario: no changes
- Reservas: no changes
- Peticiones: no changes
- Flota: no changes
- Autopilot: no changes (distribution tray, blog stats, tokens, logs)

### Tabs moved to "Mas" overflow

Clientes, Mantenimiento, Inventario, Galeria, Blog, Regalos, Descuentos — accessible via "Mas" popover or Cmd+K command palette. No content changes, only navigation location.

## Implementation scope

### Phase 1: Navigation restructure
- Modify AdminLayout.tsx: remove tab groups, flatten to 7 primary + Mas popover
- Remove Reportes, SEO Engine, Competencia from primary tabs
- Move 7 rarely-used tabs to Mas overflow

### Phase 2: Dashboard dual-mode
- Create "Hoy" operational cockpit view (new component)
- Move current DashboardTab content to "Reportes" mode
- Absorb ReportsTab content into Reportes mode
- Add Hoy/Reportes toggle

### Phase 3: SEO consolidation
- Rename SEO sub-tabs to Spanish (Resumen, Analisis, Campanas, Salud)
- Absorb AnalyticsTab content into "Analisis" sub-tab
- Merge Experiments into Campanas sub-tab
- Move CompetitionTab GBP/moat sections into Analisis
- Remove standalone SEO Engine and Competencia tabs

## What we are NOT building

- No changes to Calendario, Reservas, Peticiones, Flota, Autopilot content
- No new database tables
- No new API endpoints (Dashboard Hoy uses existing booking/inquiry endpoints)
- No changes to the 7 rarely-used tabs' content
