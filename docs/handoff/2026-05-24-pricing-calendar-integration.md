# Handoff — Pricing Calendar admin (Fase 3) integration pending

**Fecha**: 2026-05-24
**Estado**: componente nuevo creado, integración en PricingTab pendiente.
**Plan origen**: `/Users/macbookpro/.claude/plans/me-gustar-a-revisar-la-splendid-zephyr.md`

## Lo que se ha hecho

- ✅ **Nuevo componente** `client/src/components/crm/pricing/PricingCalendar.tsx` (commit pendiente).
  - Grid mensual 7×6 con headers Lu–Do.
  - Lee `/api/admin/pricing-overrides` y `/api/admin/boats` via `useQuery` (deduplicado con OverridesList).
  - Por cada día computa los overrides aplicables con la misma predicación que `selectApplicableOverride` en `shared/pricing.ts` — sin endpoint backend nuevo.
  - Cada celda:
    - Color de fondo según polaridad: `popular/10` (recargo), `success/10` (descuento), `muted` (mixto), `background` (sin override).
    - Hasta 2 badges con el ajuste (`+15%`, `−10€`); si hay más, `+N` indicador.
    - Hoy marcado con `ring-2 ring-cta`.
  - Click en día con overrides → `Popover` con la lista detallada + botón "Crear otro override para este día". Cada item del popover es clickable y dispara `onEditOverride(override)`.
  - Click en día sin overrides → dispara `onCreateForDay(dayKey)` (callback para abrir el modal con date_start = date_end = day).
  - Filtro por barco arriba: select con "Todos" + los barcos del catálogo. Filtra globales + específicos del barco elegido.
  - Navegación de mes (< > + botón "Hoy") y contador en el título.
  - Leyenda de colores debajo.
- ✅ **TS limpio** en `BoatPricingSection`, `PricingTab`, `pricing/*`. El nuevo `PricingCalendar.tsx` no está aún importado en ningún sitio — TS y ESLint lo tratan como módulo no-usado pero NO falla `npm run check`.

## Lo que queda

1. **Integrar `PricingCalendar` en `PricingTab.tsx`** con un toggle:
   ```tsx
   import { PricingCalendar } from "./pricing/PricingCalendar";
   import { List, CalendarRange } from "lucide-react";

   const [view, setView] = useState<"list" | "calendar">("list");
   const [prefillDate, setPrefillDate] = useState<string | null>(null);

   const openCreateForDay = (dayKey: string) => {
     setEditingOverride(null);
     setPrefillDate(dayKey);
     setModalOpen(true);
   };

   const openEdit = (override: PricingOverride) => {
     setEditingOverride(override);
     setPrefillDate(null);
     setModalOpen(true);
   };
   ```
   Y un toggle en la cabecera, junto al botón "Nuevo override":
   ```tsx
   <div className="flex gap-1 border rounded-md p-0.5">
     <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")}>
       <List className="w-4 h-4 mr-1.5" /> Lista
     </Button>
     <Button variant={view === "calendar" ? "default" : "ghost"} size="sm" onClick={() => setView("calendar")}>
       <CalendarRange className="w-4 h-4 mr-1.5" /> Calendario
     </Button>
   </div>
   ```
   Render condicional debajo del `PricingTemplatesPanel`:
   ```tsx
   {view === "list" ? (
     <PricingOverridesList onEdit={openEdit} />
   ) : (
     <PricingCalendar onCreateForDay={openCreateForDay} onEditOverride={openEdit} />
   )}
   ```

2. **Extender `PricingOverrideModal` para aceptar `prefillDate`**:
   - Añadir prop `prefillDate?: string | null` a `PricingOverrideModalProps` (línea 37-41).
   - En el `useEffect` que setea `form` (línea 65-85), cuando `!override && prefillDate`, inicializar `dateStart` y `dateEnd` con `prefillDate` en lugar de `todayISO()`.
   - Pasar la prop desde `PricingTab`:
     ```tsx
     <PricingOverrideModal
       open={modalOpen}
       onOpenChange={setModalOpen}
       override={editingOverride}
       prefillDate={prefillDate}
     />
     ```

3. **Type-check + commit**:
   ```
   npm run check
   git add client/src/components/crm/pricing/PricingCalendar.tsx \
           client/src/components/crm/PricingTab.tsx \
           client/src/components/crm/pricing/PricingOverrideModal.tsx \
           docs/handoff/2026-05-24-pricing-calendar-integration.md
   ```
   Commit mensaje sugerido: `crm-pricing(calendar): wire PricingCalendar into PricingTab with view toggle`.

## Verificación cuando esté integrado

- Abrir `/admin` → tab Precios → toggle Lista/Calendario visible.
- Calendario muestra mes actual con overrides existentes pintados.
- Click en día con override → popover con la lista, click en uno → modal de editar abre el override correcto.
- Click en día sin overrides → modal de crear abre con `dateStart` y `dateEnd` = ese día.
- Cambiar filtro de barco → solo overrides aplicables visibles.
- Crear un override desde el calendar → al guardar, el calendar lo refleja sin recargar (React Query invalidación automática).

## Referencias

- Componente nuevo: `client/src/components/crm/pricing/PricingCalendar.tsx`
- Tab a modificar: `client/src/components/crm/PricingTab.tsx`
- Modal a extender: `client/src/components/crm/pricing/PricingOverrideModal.tsx`
- Lógica de predicación que ya replica: `shared/pricing.ts:99-127` (`selectApplicableOverride`)

## Follow-ups que quedan después de la integración

Documentados en el plan original (`/Users/macbookpro/.claude/plans/me-gustar-a-revisar-la-splendid-zephyr.md`):
- **Bulk actions** (gap #4 del audit).
- **Templates custom guardadas** (gap #6).
- **Audit log visible en UI** (gap #7).
