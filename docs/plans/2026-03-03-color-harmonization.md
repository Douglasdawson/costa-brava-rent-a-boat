# Navy Monocromático + Coral — Color Harmonization Plan

> **Status:** COMPLETED (2026-03-03)
> All 15 tasks implemented across 5 parallel agents, TypeScript 0 errors, pushed to main.

**Goal:** Eliminate all hardcoded Tailwind color classes (blue-*, green-*, purple-*, yellow-*, amber-*, slate-*, indigo-*) and replace with the navy+coral design system. Only 2 exceptions: WhatsApp brand green (#25D366) and red destructive states.

**Architecture:** Global replace-all per color class pattern, file by file. Navy (`text-primary`, `bg-primary/5`, `bg-primary/10`) replaces blues/purples/greens for info/icons. Coral (`text-cta`, `bg-cta/10`) replaces accent highlights. Gray classes (`text-gray-*`) map to semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`).

**Tech Stack:** TailwindCSS, CSS custom properties via HSL

**Color Mapping Reference:**

| Old class | New class | Usage |
|-----------|-----------|-------|
| `bg-blue-50` | `bg-primary/5` | Info backgrounds |
| `bg-blue-100` | `bg-primary/10` | Stronger info backgrounds |
| `text-blue-600` | `text-primary` | Info icons, accents |
| `text-blue-800` / `text-blue-900` | `text-foreground` | Dark text on info bg |
| `bg-blue-600` / `hover:bg-blue-700` | `bg-primary hover:bg-primary/90` | Action buttons |
| `bg-green-50` | `bg-primary/5` | Success/available backgrounds |
| `text-green-600` / `text-green-700` | `text-primary` | Success icons |
| `text-green-800` | `text-foreground` | Dark text on success bg |
| `bg-green-100` | `bg-primary/10` | CRM confirmed status |
| `bg-green-500` (availability dot) | `bg-primary` | Available indicator |
| `hover:bg-green-600` | `hover:bg-primary/80` | Hover on available |
| `border-green-200` | `border-primary/20` | Success borders |
| `border-green-500` / `border-green-600` | `border-primary` | Strong success borders |
| `bg-purple-50` | `bg-primary/5` | Was wrong color entirely |
| `text-purple-600` | `text-primary` | Was wrong color entirely |
| `bg-yellow-50` / `bg-yellow-100` | `bg-cta/10` | Warning/caution |
| `text-yellow-600` / `text-yellow-800` | `text-cta` | Warning text |
| `text-yellow-500 fill-yellow-500` (stars) | `text-cta fill-cta` | Star ratings |
| `border-yellow-300` / `border-yellow-500` | `border-cta/30` / `border-cta` | Warning borders |
| `bg-slate-100` | `bg-muted` | Completed/inactive |
| `text-slate-700` | `text-muted-foreground` | Completed text |
| `border-slate-400` | `border-border` | Completed borders |
| `bg-indigo-100` | `bg-primary/10` | Was wrong color |
| `text-indigo-600` | `text-primary` | Was wrong color |
| `text-gray-900` | `text-foreground` | Primary text |
| `text-gray-800` | `text-foreground` | Primary text |
| `text-gray-700` | `text-foreground` | Primary text |
| `text-gray-600` | `text-muted-foreground` | Secondary text |
| `text-gray-500` | `text-muted-foreground` | Muted text |
| `text-gray-400` | `text-muted-foreground/70` | Very muted text |
| `bg-gray-50` | `bg-card` | Light backgrounds |
| `bg-gray-100` | `bg-muted` | Muted backgrounds |
| `bg-gray-200` | `bg-muted` | Skeleton/placeholder |
| `bg-gray-300` | `bg-border` | Disabled dots |
| `border-gray-200` | `border-border` | Borders |
| `border-gray-100` | `border-border` | Light borders |
| `text-[#143352]` | `text-foreground` | Hardcoded navy variant |
| `bg-[#1A2B4A]` | `bg-foreground` | Footer navy |

**Exceptions (DO NOT CHANGE):**
- `bg-[#25D366]` / `hover:bg-[#128C7E]` — WhatsApp brand
- `text-[#25D366]` — WhatsApp icon
- `bg-red-*` / `text-red-*` — Destructive/error states (keep as-is or map to `--destructive`)
- `bg-white` — Keep as-is (it IS the design system background)

---

### Task 1: ContactSection — Eliminate blue/green/purple icon boxes

**Files:**
- Modify: `client/src/components/ContactSection.tsx`

**Changes:**

Line 18: `text-[#143352]` → `text-foreground`
Line 127: `bg-blue-50` → `bg-primary/5`
Line 128: `text-blue-600` → `text-primary`
Line 166: `bg-green-50` → `bg-primary/5`
Line 167: `text-green-600` → `text-primary`
Line 205: `bg-purple-50` → `bg-primary/5`
Line 206: `text-purple-600` → `text-primary`
Line 244: `bg-blue-50` → `bg-primary/5`
Line 245: `text-blue-600` → `text-primary`

Also replace all `text-gray-900` with `text-foreground`, `text-gray-600` with `text-muted-foreground`, `bg-gray-100` with `bg-muted`, `text-gray-700` with `text-foreground`.

Commit: `style: ContactSection - navy monochrome icons, eliminate blue/green/purple`

---

### Task 2: RelatedLocationsSection — Navy icons

**Files:**
- Modify: `client/src/components/RelatedLocationsSection.tsx`

**Changes:**

Line 42: `color: "text-blue-600"` → `color: "text-primary"`
Line 43: `bgColor: "bg-blue-50"` → `bgColor: "bg-primary/5"`
Line 54: `bgColor: "bg-green-50"` → `bgColor: "bg-primary/5"`
Line 53: `color: "text-green-600"` → `color: "text-primary"` (check exact line)
Line 64: `color: "text-purple-600"` → `color: "text-primary"`
Line 65: `bgColor: "bg-purple-50"` → `bgColor: "bg-primary/5"`
Line 87: `color: "text-blue-600"` → `color: "text-primary"`
Line 88: `bgColor: "bg-blue-50"` → `bgColor: "bg-primary/5"`

Also replace `text-gray-*` → `text-foreground` or `text-muted-foreground` as appropriate.

Commit: `style: RelatedLocationsSection - navy monochrome, remove purple/green/blue`

---

### Task 3: CondicionesGenerales — Navy info box

**Files:**
- Modify: `client/src/components/CondicionesGenerales.tsx`

**Changes:**

Line 190: `bg-blue-50 border-blue-200` → `bg-primary/5 border-primary/20`
Line 193: `text-blue-900` → `text-foreground`
Line 194: `text-blue-800` → `text-foreground`
Line 198: `bg-blue-600 hover:bg-blue-700` → `bg-primary hover:bg-primary/90`

Also replace `text-gray-*` patterns.

Commit: `style: CondicionesGenerales - navy info box, remove blue`

---

### Task 4: BoatDetailPage — Navy accents

**Files:**
- Modify: `client/src/components/BoatDetailPage.tsx`

**Changes:**

Line 266: `bg-blue-500/90` → `bg-primary/90`
Line 267: `bg-green-500/90` → `bg-primary/80`
Line 415: `bg-green-50` → `bg-primary/5`
Line 483: `hover:bg-blue-50` → `hover:bg-primary/5`
Line 623: `text-blue-600` → `text-primary`
Line 676: `bg-blue-50` → `bg-primary/5`
Line 677: `text-blue-800` → `text-foreground`
Line 690: `text-blue-800 cursor-pointer hover:text-blue-600` → `text-primary cursor-pointer hover:text-primary/80`

Also replace `text-green-600` → `text-primary`, `text-gray-*` patterns.

Commit: `style: BoatDetailPage - navy monochrome accents`

---

### Task 5: BoatCard — Navy availability dot

**Files:**
- Modify: `client/src/components/BoatCard.tsx`

**Changes:**

Line 77: `bg-green-500` → `bg-primary` and `bg-gray-300` → `bg-muted-foreground/30`

Commit: `style: BoatCard - navy availability dot`

---

### Task 6: AvailabilityCalendar — Navy available dates

**Files:**
- Modify: `client/src/components/AvailabilityCalendar.tsx`

**Changes:**

Line 151: `bg-yellow-100 border border-yellow-300` → `bg-cta/10 border border-cta/30`
Line 182-183: `bg-green-50 text-green-700 border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600` → `bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-primary`

Also fix the non-interactive variant on line 183.

Commit: `style: AvailabilityCalendar - navy available, coral partial`

---

### Task 7: BookingFormDesktop + BookingFlow — Navy status colors

**Files:**
- Modify: `client/src/components/BookingFormDesktop.tsx`
- Modify: `client/src/components/BookingFlow.tsx`

**Changes in BookingFormDesktop:**

Line 519: `bg-green-50 border border-green-200` → `bg-primary/5 border border-primary/20`
All `text-green-600` → `text-primary`
All `text-gray-*` → appropriate design system tokens

**Changes in BookingFlow:**

Line 1336: `bg-green-50` → `bg-primary/5`
All `text-green-*` → `text-primary`
All `text-gray-*` → design system tokens

Commit: `style: booking forms - navy status colors`

---

### Task 8: FAQ page — Navy info boxes

**Files:**
- Modify: `client/src/pages/faq.tsx`

**Changes:**

Lines 324, 519, 636: `bg-blue-50` → `bg-primary/5`
Lines 520, 637: `text-blue-600` → `text-primary`
Lines 381, 555, 705: `bg-green-50` → `bg-primary/5`
Lines 325, 382, 556, 706: `text-green-600` → `text-primary`
Line 671: `bg-yellow-50` → `bg-cta/10`
Line 672: `text-yellow-600` → `text-cta`

Commit: `style: FAQ - navy info boxes, coral warnings`

---

### Task 9: Location pages (blanes, lloret, tossa) — Navy icons

**Files:**
- Modify: `client/src/pages/location-blanes.tsx`
- Modify: `client/src/pages/location-lloret-de-mar.tsx`
- Modify: `client/src/pages/location-tossa-de-mar.tsx`

**Changes (all 3 files follow same pattern):**

All `text-green-600` → `text-primary` (icon colors)
All `text-yellow-500` → `text-cta` (star ratings)
All `bg-blue-100` → `bg-primary/10` (icon backgrounds in lloret)
All `text-blue-600` → `text-primary` (icon colors in lloret)
All `text-gray-*` → design system tokens

Commit: `style: location pages - navy monochrome icons`

---

### Task 10: Category pages (licensed, license-free) — Navy accents

**Files:**
- Modify: `client/src/pages/category-licensed.tsx`
- Modify: `client/src/pages/category-license-free.tsx`

**Changes in category-licensed.tsx:**

All ~15 instances of `text-blue-600` → `text-primary`
Line 161: `text-blue-600 border-blue-600` → `text-primary border-primary`
Line 186: `text-blue-500` → `text-primary`

**Changes in category-license-free.tsx:**

Same pattern — all colored accents → `text-primary`

Commit: `style: category pages - navy monochrome accents`

---

### Task 11: Testimonios + Gift Cards + Routes — Coral stars, navy accents

**Files:**
- Modify: `client/src/pages/testimonios.tsx`
- Modify: `client/src/pages/gift-cards.tsx`
- Modify: `client/src/pages/routes.tsx`

**Changes in testimonios.tsx:**

Line 108: `text-yellow-500 fill-yellow-500` → `text-cta fill-cta` (star ratings)

**Changes in gift-cards.tsx:**

Line 106: `text-green-600` → `text-primary`

**Changes in routes.tsx:**

Line 16: `bg-green-100 text-green-800` → `bg-primary/10 text-primary`
Line 17: `bg-yellow-100 text-yellow-800` → `bg-cta/10 text-cta`

Commit: `style: testimonials/gifts/routes - coral stars, navy accents`

---

### Task 12: CRM — CalendarTab status colors

**Files:**
- Modify: `client/src/components/crm/CalendarTab.tsx`

**Changes:**

Find `STATUS_COLORS` object and replace entirely:
```typescript
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  confirmed: { bg: "bg-primary/10", border: "border-primary", text: "text-primary" },
  hold: { bg: "bg-primary/5", border: "border-primary/40", text: "text-primary" },
  pending_payment: { bg: "bg-cta/10", border: "border-cta", text: "text-cta" },
  draft: { bg: "bg-muted", border: "border-border", text: "text-muted-foreground" },
  cancelled: { bg: "bg-red-50", border: "border-red-400", text: "text-red-700" },
  completed: { bg: "bg-muted", border: "border-border", text: "text-muted-foreground" },
};
```

Find `STATUS_DOT_COLORS` and replace:
```typescript
const STATUS_DOT_COLORS: Record<string, string> = {
  confirmed: "bg-primary",
  hold: "bg-primary/60",
  pending_payment: "bg-cta",
  draft: "bg-muted-foreground/40",
  cancelled: "bg-red-400",
  completed: "bg-muted-foreground/40",
};
```

Also replace all loose `bg-blue-*`, `text-blue-*`, `bg-green-*`, `text-green-*`, `bg-yellow-*`, `text-yellow-*`, `bg-slate-*`, `text-slate-*` throughout the file.

Commit: `style: CRM CalendarTab - navy/coral status system`

---

### Task 13: CRM — SuperAdminTab + DashboardTab + other CRM files

**Files:**
- Modify: `client/src/components/crm/SuperAdminTab.tsx`
- Modify: `client/src/components/crm/DashboardTab.tsx`
- Modify: `client/src/components/crm/CheckinForm.tsx`
- Modify: `client/src/components/crm/TenantAdminTab.tsx`
- Modify: `client/src/components/crm/AdminLayout.tsx`

**Changes:**

All `bg-indigo-100` → `bg-primary/10`
All `text-indigo-600` → `text-primary`
All `text-amber-600` / `text-amber-400` → `text-cta`
All `text-green-*` → `text-primary`
All `bg-green-*` → `bg-primary/5` or `bg-primary/10`
All `text-gray-*` → design system tokens
All `bg-gray-*` → design system tokens

Commit: `style: CRM admin panels - navy/coral design system`

---

### Task 14: Remaining pages — OnboardingPage, CancelBookingPage, legal pages

**Files:**
- Modify: `client/src/pages/OnboardingPage.tsx`
- Modify: `client/src/pages/CancelBookingPage.tsx`
- Modify: `client/src/pages/accessibility-declaration.tsx`
- Modify: `client/src/pages/blog.tsx`
- Modify: `client/src/pages/gallery.tsx`
- Modify: `client/src/pages/not-found.tsx`

**Changes:**

OnboardingPage: `text-blue-600` → `text-primary`, `text-green-600` → `text-primary`, `text-green-500` → `text-primary`
CancelBookingPage: `text-green-600` → `text-primary`, `text-green-800` → `text-foreground`, `text-yellow-800` → `text-cta`
All other files: Replace `text-gray-*` / `bg-gray-*` with design system tokens

Commit: `style: remaining pages - navy/coral harmonization`

---

### Task 15: Miscellaneous components

**Files:**
- Modify: `client/src/components/CookieBanner.tsx`
- Modify: `client/src/components/LanguageSelector.tsx`
- Modify: `client/src/components/FAQPreview.tsx`
- Modify: `client/src/components/DestinationsSection.tsx`

**Changes:**

Replace all `text-gray-*` → design system tokens
Replace any remaining colored classes → navy/coral equivalents

Commit: `style: misc components - consistent navy/coral tokens`

---

## Verification

After all tasks:

1. `npx tsc --noEmit` — 0 errors
2. Grep verification — should return ZERO results:
   ```bash
   grep -r "bg-blue-\|text-blue-\|bg-green-[0-5]\|text-green-\|bg-purple-\|text-purple-\|bg-indigo-\|text-indigo-\|bg-yellow-\|text-yellow-\|bg-amber-\|text-amber-\|bg-slate-\|text-slate-" client/src/ --include="*.tsx" | grep -v "#25D366" | grep -v "bg-red-\|text-red-"
   ```
3. Visual check in browser: all icons should be navy, all CTAs coral, no rainbow buttons
