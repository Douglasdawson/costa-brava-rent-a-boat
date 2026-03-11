# Audit Round 2 — Testing, Accessibility, Reduced Motion

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Raise audit score by adding API integration tests (testing 6→8), translating hardcoded Spanish aria-labels (a11y 8→9), and adding prefers-reduced-motion support (UX 8→9).

**Architecture:** Three independent work streams: (1) Install supertest and write API route tests for critical public endpoints, (2) Create an `a11y` translation section and replace 30+ hardcoded Spanish strings, (3) Add a single `@media (prefers-reduced-motion: reduce)` block plus component-level fixes.

**Tech Stack:** Vitest, supertest, Express, React, TailwindCSS, i18n system (custom hook-based)

---

## Stream A: API Integration Tests

### Task A1: Install supertest

**Files:**
- Modify: `package.json`

**Step 1:** Install supertest as dev dependency

```bash
npm install -D supertest @types/supertest
```

**Step 2:** Verify install succeeded

```bash
npx tsc --noEmit 2>&1 | grep supertest || echo "No supertest errors"
```

**Step 3:** Commit

```bash
git add package.json package-lock.json
git commit -m "chore: add supertest for API integration tests"
```

---

### Task A2: Create test helper for Express app

**Files:**
- Create: `server/test/setup.ts`

The app setup in `server/index.ts` is wrapped in an IIFE that calls `server.listen()`. We need a way to get the Express app without starting the server. We'll create a minimal test app that registers routes.

**Step 1:** Create test setup file

```typescript
import express from "express";
import type { Express } from "express";

/**
 * Create a lightweight Express app for testing.
 * Registers JSON parsing and the route under test.
 */
export function createTestApp(registerRoutes: (app: Express) => void): Express {
  const app = express();
  app.use(express.json());
  return app;
}
```

Note: Each test file will import the specific route registration function and mount only the routes it needs, keeping tests isolated and fast.

**Step 2:** Commit

```bash
git add server/test/setup.ts
git commit -m "test: add Express test helper for API integration tests"
```

---

### Task A3: Test availability endpoints

**Files:**
- Create: `server/routes/availability.test.ts`
- Reference: `server/routes/availability.ts` (read to understand endpoints and Zod schemas)
- Reference: `server/storage/bookings.ts` (understand what storage methods are called)

**Step 1:** Read `server/routes/availability.ts` to understand:
- `GET /api/availability?boatId=X&date=YYYY-MM-DD` — returns time slots
- `GET /api/fleet-availability?date=YYYY-MM-DD` — returns availability for all boats
- Input validation schemas
- What storage methods are called

**Step 2:** Write tests

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// We'll need to mock the storage module
vi.mock("../storage", () => ({
  storage: {
    getBoat: vi.fn(),
    getAllBoats: vi.fn(),
    getBookingsForDate: vi.fn(),
    getBookingsByBoatAndDateRange: vi.fn(),
  },
}));

// Mock logger to avoid noise
vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { storage } from "../storage";
// Import the route registration function from availability.ts

describe("GET /api/availability", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    // Register availability routes on the test app
  });

  it("returns 400 when boatId is missing", async () => {
    const res = await request(app)
      .get("/api/availability?date=2026-06-15")
      .expect(400);
    expect(res.body.message).toBeDefined();
  });

  it("returns 400 when date format is invalid", async () => {
    const res = await request(app)
      .get("/api/availability?boatId=1&date=not-a-date")
      .expect(400);
    expect(res.body.message).toBeDefined();
  });

  it("returns 404 when boat does not exist", async () => {
    (storage.getBoat as any).mockResolvedValue(null);
    const res = await request(app)
      .get("/api/availability?boatId=999&date=2026-06-15")
      .expect(404);
    expect(res.body.message).toBeDefined();
  });

  it("returns time slots for a valid boat and date", async () => {
    (storage.getBoat as any).mockResolvedValue({ id: 1, name: "Test Boat" });
    (storage.getBookingsForDate as any).mockResolvedValue([]);
    const res = await request(app)
      .get("/api/availability?boatId=1&date=2026-06-15")
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

Adapt the mocks and assertions based on the actual route code. The key is testing:
- Input validation (missing params, bad formats)
- 404 for nonexistent resources
- Happy path returns expected shape
- Cache-Control headers are set

**Step 3:** Run tests

```bash
npx vitest run server/routes/availability.test.ts
```

**Step 4:** Commit

```bash
git add server/routes/availability.test.ts
git commit -m "test: add API integration tests for availability endpoints"
```

---

### Task A4: Test bookings public endpoints

**Files:**
- Create: `server/routes/bookings.test.ts`
- Reference: `server/routes/bookings.ts`

**Step 1:** Read `server/routes/bookings.ts` to understand public endpoints:
- `GET /api/bookings/cancel-info/:token` — public cancel info by token
- `POST /api/bookings/cancel/:token` — public cancel action
- `GET /api/bookings/:id` — booking detail (admin)

**Step 2:** Write tests focusing on:
- Cancel info with valid/invalid/expired token
- Cancel action refund tier calculation
- Input validation (bad UUID format for token)
- 404 for nonexistent bookings

**Step 3:** Run and commit

```bash
npx vitest run server/routes/bookings.test.ts
git add server/routes/bookings.test.ts
git commit -m "test: add API integration tests for bookings endpoints"
```

---

### Task A5: Test health endpoint

**Files:**
- Create: `server/routes/health.test.ts`
- Reference: `server/routes/health.ts`

**Step 1:** Read health route, write tests for:
- Returns 200 with status "ok" when DB is healthy
- Returns degraded status when DB query fails
- Response includes expected fields (uptime, timestamp, db latency)

**Step 2:** Run and commit

```bash
npx vitest run server/routes/health.test.ts
git add server/routes/health.test.ts
git commit -m "test: add API integration tests for health endpoint"
```

---

### Task A6: Test discount API endpoint

**Files:**
- Create: `server/routes/discounts.test.ts`
- Reference: `server/routes/discounts.ts` (or wherever discount endpoint is)

**Step 1:** Read the discount route, write tests for:
- Returns correct discount for early-bird LOW season
- Returns no discount for HIGH season
- Returns flash deal when applicable
- Input validation

**Step 2:** Run and commit

```bash
npx vitest run server/routes/discounts.test.ts
git add server/routes/discounts.test.ts
git commit -m "test: add API integration tests for discount endpoint"
```

---

## Stream B: Translate Hardcoded Spanish aria-labels

### Task B1: Add a11y translation section to all 8 languages

**Files:**
- Modify: `client/src/i18n/es.ts` (reference language)
- Modify: `client/src/i18n/en.ts`
- Modify: `client/src/i18n/ca.ts`
- Modify: `client/src/i18n/fr.ts`
- Modify: `client/src/i18n/de.ts`
- Modify: `client/src/i18n/nl.ts`
- Modify: `client/src/i18n/it.ts`
- Modify: `client/src/i18n/ru.ts`
- Modify: `client/src/lib/translations.ts` (add a11y to Translations interface)

**Step 1:** Read `client/src/i18n/es.ts` to understand the translation object structure.

**Step 2:** Add `a11y` section to the Translations interface in `client/src/lib/translations.ts`:

```typescript
a11y: {
  goToHomePage: string;
  bookBoatNow: string;
  accessMyAccount: string;
  openNavMenu: string;
  closeNavMenu: string;
  mobileNavMenu: string;
  switchToLightMode: string;
  switchToDarkMode: string;
  decreasePeople: string;
  increasePeople: string;
  remove: string;
  bookingForm: string;
  goBackToStep: string;
  continueToStep: string;
  submitBookingWhatsApp: string;
  filterByLicense: string;
  phonePrefix: string;
  scrollToTop: string;
  close: string;
  callPhone: string;
  sendEmail: string;
  viewOnMap: string;
  checkWhatsApp: string;
  viewBoatDetails: string;
  stepOf: string;
};
```

**Step 3:** Add Spanish translations in `es.ts`:

```typescript
a11y: {
  goToHomePage: "Ir a la pagina principal de Costa Brava Rent a Boat",
  bookBoatNow: "Reservar barco ahora",
  accessMyAccount: "Acceder a mi cuenta de cliente",
  openNavMenu: "Abrir menu de navegacion",
  closeNavMenu: "Cerrar menu de navegacion",
  mobileNavMenu: "Menu de navegacion movil",
  switchToLightMode: "Cambiar a modo claro",
  switchToDarkMode: "Cambiar a modo oscuro",
  decreasePeople: "Reducir numero de personas",
  increasePeople: "Aumentar numero de personas",
  remove: "Eliminar",
  bookingForm: "Formulario de reserva",
  goBackToStep: "Volver al paso anterior",
  continueToStep: "Continuar al siguiente paso",
  submitBookingWhatsApp: "Enviar solicitud de reserva por WhatsApp",
  filterByLicense: "Filtrar por licencia nautica",
  phonePrefix: "Prefijo de telefono",
  scrollToTop: "Volver arriba",
  close: "Cerrar",
  callPhone: "Llamar al telefono",
  sendEmail: "Enviar email a",
  viewOnMap: "Ver ubicacion en Google Maps",
  checkWhatsApp: "Consultar disponibilidad por WhatsApp",
  viewBoatDetails: "Ver detalles del barco",
  stepOf: "de",
},
```

**Step 4:** Add English translations in `en.ts`:

```typescript
a11y: {
  goToHomePage: "Go to Costa Brava Rent a Boat homepage",
  bookBoatNow: "Book a boat now",
  accessMyAccount: "Access my customer account",
  openNavMenu: "Open navigation menu",
  closeNavMenu: "Close navigation menu",
  mobileNavMenu: "Mobile navigation menu",
  switchToLightMode: "Switch to light mode",
  switchToDarkMode: "Switch to dark mode",
  decreasePeople: "Decrease number of people",
  increasePeople: "Increase number of people",
  remove: "Remove",
  bookingForm: "Booking form",
  goBackToStep: "Go back to previous step",
  continueToStep: "Continue to next step",
  submitBookingWhatsApp: "Submit booking request via WhatsApp",
  filterByLicense: "Filter by boating license",
  phonePrefix: "Phone prefix",
  scrollToTop: "Scroll to top",
  close: "Close",
  callPhone: "Call phone number",
  sendEmail: "Send email to",
  viewOnMap: "View location on Google Maps",
  checkWhatsApp: "Check availability via WhatsApp",
  viewBoatDetails: "View boat details",
  stepOf: "of",
},
```

**Step 5:** Add translations for remaining 6 languages (ca, fr, de, nl, it, ru) following the same pattern. Use accurate translations for each language.

**Step 6:** Run validation

```bash
npx tsx scripts/validate-translations.ts
```

**Step 7:** Commit

```bash
git add client/src/i18n/*.ts client/src/lib/translations.ts
git commit -m "i18n: add a11y translation section for all 8 languages"
```

---

### Task B2: Replace hardcoded aria-labels in Navigation.tsx

**Files:**
- Modify: `client/src/components/Navigation.tsx`

**Step 1:** Read Navigation.tsx. Replace these hardcoded strings:

| Line | Current | Replacement |
|------|---------|-------------|
| ~177 | `"Ir a la pagina principal..."` | `t.a11y.goToHomePage` |
| ~233 | `"Reservar barco ahora"` | `t.a11y.bookBoatNow` |
| ~243 | `"Acceder a mi cuenta de cliente"` | `t.a11y.accessMyAccount` |
| ~259 | `"Cerrar/Abrir menu de navegacion"` | `isMenuOpen ? t.a11y.closeNavMenu : t.a11y.openNavMenu` |
| ~270 | `"Menu de navegacion movil"` | `t.a11y.mobileNavMenu` |

Also update the dark mode toggle aria-label (from task 5 in previous wave) to use `theme === 'dark' ? t.a11y.switchToLightMode : t.a11y.switchToDarkMode`.

Ensure `useTranslations()` is imported and `const t = useTranslations()` is available.

**Step 2:** Commit

```bash
git add client/src/components/Navigation.tsx
git commit -m "a11y: translate Navigation aria-labels to use i18n system"
```

---

### Task B3: Replace hardcoded aria-labels in BookingFormDesktop.tsx

**Files:**
- Modify: `client/src/components/BookingFormDesktop.tsx`

**Step 1:** Replace:
- `"Reducir numero de personas"` → `t.a11y.decreasePeople`
- `"Aumentar numero de personas"` → `t.a11y.increasePeople`
- `"Eliminar"` → `t.a11y.remove`

**Step 2:** Commit

```bash
git add client/src/components/BookingFormDesktop.tsx
git commit -m "a11y: translate BookingFormDesktop aria-labels"
```

---

### Task B4: Replace hardcoded aria-labels in BookingWizardMobile.tsx

**Files:**
- Modify: `client/src/components/BookingWizardMobile.tsx`

**Step 1:** Replace:
- `"Formulario de reserva"` → `t.a11y.bookingForm`
- `"Volver al paso anterior (${currentStep - 1} de 4)"` → `` `${t.a11y.goBackToStep} (${currentStep - 1} ${t.a11y.stepOf} 4)` ``
- `"Continuar al paso ${currentStep + 1} de 4"` → `` `${t.a11y.continueToStep} (${currentStep + 1} ${t.a11y.stepOf} 4)` ``
- `"Enviar solicitud de reserva por WhatsApp"` → `t.a11y.submitBookingWhatsApp`
- `"Filtrar por licencia nautica"` (both aria-label and legend) → `t.a11y.filterByLicense`
- `"Reducir numero de personas"` → `t.a11y.decreasePeople`
- `"Aumentar numero de personas"` → `t.a11y.increasePeople`
- `"Prefijo de telefono: ${phonePrefix}"` → `` `${t.a11y.phonePrefix}: ${phonePrefix}` ``

**Step 2:** Commit

```bash
git add client/src/components/BookingWizardMobile.tsx
git commit -m "a11y: translate BookingWizardMobile aria-labels"
```

---

### Task B5: Replace hardcoded aria-labels in remaining components

**Files:**
- Modify: `client/src/components/ScrollToTop.tsx`
- Modify: `client/src/components/SeasonBanner.tsx`
- Modify: `client/src/components/ExitIntentModal.tsx`
- Modify: `client/src/components/ContactSection.tsx`
- Modify: `client/src/components/Footer.tsx`
- Modify: `client/src/components/BoatCard.tsx`
- Modify: `client/src/components/FleetSection.tsx`

**Step 1:** Read each file first, then replace hardcoded Spanish aria-labels with `t.a11y.*` equivalents. Each file needs:
- Import `useTranslations` if not already imported
- Add `const t = useTranslations()` if not already present
- Replace hardcoded strings

Key replacements:
- ScrollToTop: `"Volver arriba"` → `t.a11y.scrollToTop`
- SeasonBanner/ExitIntentModal: `"Cerrar"` → `t.a11y.close`
- ContactSection: phone/email/map/whatsapp labels → `t.a11y.callPhone`, `t.a11y.sendEmail`, etc.
- Footer: similar social/contact labels
- BoatCard: `"Ver detalles del barco ${name}"` → `` `${t.a11y.viewBoatDetails} ${name}` ``
- FleetSection: WhatsApp/phone help links

**Step 2:** Run i18n validation

```bash
npx tsx scripts/validate-translations.ts
```

**Step 3:** Commit

```bash
git add client/src/components/ScrollToTop.tsx client/src/components/SeasonBanner.tsx client/src/components/ExitIntentModal.tsx client/src/components/ContactSection.tsx client/src/components/Footer.tsx client/src/components/BoatCard.tsx client/src/components/FleetSection.tsx
git commit -m "a11y: translate remaining component aria-labels to i18n"
```

---

## Stream C: Reduced Motion Support

### Task C1: Add prefers-reduced-motion CSS block

**Files:**
- Modify: `client/src/index.css`

**Step 1:** Read `client/src/index.css` to locate all animations. Add a `@media (prefers-reduced-motion: reduce)` block at the end (before the existing `@media print`):

```css
/* Reduced motion — disable animations for users with vestibular disorders */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .animate-bounce,
  .animate-pulse,
  .animate-spin {
    animation: none !important;
  }
}
```

This is the nuclear approach — it disables ALL animations and transitions globally when the user has requested reduced motion. This is the recommended WCAG approach and works with both custom CSS animations and Tailwind utility classes.

**Step 2:** Also update the `html` smooth scroll to respect the preference:

Find:
```css
html {
  scroll-behavior: smooth;
}
```

Replace with:
```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

Note: If the scroll-behavior is inside a larger block, adjust accordingly. The global `@media` block above already handles this via the `*` selector, but being explicit for `html` is clearer.

**Step 3:** Commit

```bash
git add client/src/index.css
git commit -m "a11y: add prefers-reduced-motion support for all animations"
```

---

### Task C2: Update SocialProofToast inline styles

**Files:**
- Modify: `client/src/components/SocialProofToast.tsx`

**Step 1:** Read SocialProofToast.tsx. It uses inline `style={{ transition: '...' }}` which the CSS media query won't override. Wrap the transition in a check:

Find the inline style with `transition: 'all 0.4s cubic-bezier(...)'` or similar. Either:
- Move the transition to a CSS class so the media query can override it, OR
- Add a simple check: use `window.matchMedia('(prefers-reduced-motion: reduce)').matches` to skip animation

The simplest approach: add a CSS class `.social-proof-toast` in index.css with the transition, and use it instead of inline styles. The global reduced-motion media query will then apply.

**Step 2:** Commit

```bash
git add client/src/components/SocialProofToast.tsx client/src/index.css
git commit -m "a11y: respect reduced-motion in SocialProofToast"
```

---

## Verification

After all tasks:

```bash
# TypeScript
npx tsc --noEmit

# Tests (should now have 6+ test files, 170+ tests)
npx vitest run

# i18n validation
npx tsx scripts/validate-translations.ts

# Dev server starts
npm run dev
```

---

## Summary

| Stream | Tasks | Impact |
|--------|-------|--------|
| A: API Tests | A1-A6 | Testing 6→8 |
| B: Translate aria-labels | B1-B5 | Accessibility 8→9 |
| C: Reduced Motion | C1-C2 | UX Quality 8→9 |
| **Total** | **13 tasks** | **+3 points across 3 categories** |
