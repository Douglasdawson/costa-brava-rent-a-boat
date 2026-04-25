# CRM Sidebar Navigation — Design Document

**Date**: 2026-04-25
**Status**: Approved

## Problem

The CRM uses a top tab bar that takes ~200px of vertical space and doesn't scale well. Converting to a sidebar follows the standard admin panel pattern (Linear, Stripe, Notion) and frees vertical space for content.

## Design

### Desktop (>768px): Fixed sidebar, always expanded

**Layout:** `flex` row — sidebar `w-56` (224px) + content `flex-1`. Full viewport height.

**Sidebar structure (top to bottom):**
1. **Header**: Anchor icon + "Costa Brava Rent a Boat" + Cmd+K trigger
2. **Separator** (border-b)
3. **Primary nav** (7 items): Dashboard, Calendario, Reservas, Peticiones, Flota, SEO, Autopilot
   - Each: icon (w-4 h-4) + label (text-sm font-medium)
   - Active: `bg-primary text-white rounded-lg`
   - Hover: `bg-muted rounded-lg`
   - Padding: `py-2 px-3`
   - Min height: 44px (touch target)
4. **Separator**
5. **"Mas" accordion**: Clickable header that expands/collapses 7 secondary tabs inline (Clientes, Mantenimiento, Inventario, Galeria, Blog, Regalos, Descuentos) + owner tabs (Usuarios, Config)
6. **Spacer** (flex-grow pushes footer down)
7. **Footer**: Username + role line, then action buttons (Nueva Reserva, Exportar, Logout)

**Style (Stripe-inspired):**
- `bg-card border-r border-border` — white background with right border
- No shadow (separation via border)
- `h-screen sticky top-0` — stays fixed while content scrolls

### Mobile (<768px): Hamburger + overlay sidebar

**Header bar**: `[hamburger] Costa Brava Rent a Boat [+Nueva] [Search]`
- Fixed at top
- Compact: ~56px height

**Sidebar overlay**:
- Slides in from left with `transform translateX` transition (200ms ease-out)
- Semi-transparent backdrop behind, tap to close
- Same content as desktop sidebar
- Auto-closes on tab selection

### Tab content area

- `flex-1 overflow-y-auto` — takes remaining width, scrolls independently
- Padding: `p-2 sm:p-3 md:p-5 lg:p-6` (same as current)
- Trial banner renders above the flex row (full width)

### What changes

- AdminLayout.tsx: complete rewrite of the layout structure
- Horizontal tab bars (primary + secondary) → sidebar
- Popovers for overflow → inline accordion in sidebar
- Header with logo+tabs → split into sidebar header + mobile header

### What stays the same

- Tab IDs, permissions, canSeeTab logic
- All tab content components (children)
- Command palette (Cmd+K)
- Trial banner
- All action handlers (onLogout, onExportCSV, onNewBooking)
