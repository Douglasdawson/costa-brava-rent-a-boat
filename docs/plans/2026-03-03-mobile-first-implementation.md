# Mobile-First Aggressive Audit Implementation Plan

> **Status:** COMPLETED (2026-03-03)
> All 9 tasks implemented, TypeScript 0 errors, pushed to main.

**Goal:** Make every mobile interaction meet WCAG 2.1 AA (44px touch targets, proper contrast, safe areas) and feel native-app quality across all devices from iPhone SE (375px) to iPad.

**Architecture:** Bottom-up approach - fix design system tokens first (button, input, CSS utilities), then cascade fixes through navigation, hero, cards, footer, booking flow, and fixed elements. Each task is independent after Task 1.

**Tech Stack:** React, TailwindCSS, shadcn/ui components, CSS env() safe area functions

---

### Task 1: Design System Foundation - Touch Targets, Safe Areas, Viewport

**Files:**
- Modify: `client/src/components/ui/button.tsx:27-31`
- Modify: `client/src/components/ui/input.tsx:11-12`
- Modify: `client/src/index.css` (add safe area utilities after line 417)
- Modify: `client/index.html:5`

**Context:** This task is the foundation. All subsequent tasks depend on these base changes cascading through the app. WCAG 2.1 requires 44x44px minimum touch targets. Current buttons are 40px (min-h-10), inputs are 36px (h-9).

**Step 1: Update button sizes in button.tsx**

In `client/src/components/ui/button.tsx`, change the `size` variants object (lines 27-32) from:

```typescript
size: {
  default: "min-h-10 px-6 py-2.5",
  sm: "min-h-8 rounded-full px-3 text-xs",
  lg: "min-h-11 rounded-full px-8",
  icon: "h-9 w-9",
},
```

To:

```typescript
size: {
  default: "min-h-11 px-6 py-2.5",
  sm: "min-h-9 rounded-full px-3 text-xs",
  lg: "min-h-12 rounded-full px-8",
  icon: "h-11 w-11",
},
```

Rationale: `min-h-11` = 44px (WCAG minimum). `sm` goes from 32px to 36px (utility size, acceptable). `lg` goes from 44px to 48px (prominent CTAs). `icon` goes from 36px to 44px (hamburger menu, close buttons).

**Step 2: Update input height in input.tsx**

In `client/src/components/ui/input.tsx`, change line 12 from:

```typescript
"flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
```

To:

```typescript
"flex h-11 w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
```

Changes: `h-9` → `h-11` (36px → 44px), `py-2` → `py-3` (8px → 12px padding).

**Step 3: Add viewport-fit=cover to HTML**

In `client/index.html`, change line 5 from:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

To:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

This enables `env(safe-area-inset-*)` CSS functions for notch/home indicator on iOS.

**Step 4: Add safe area CSS utilities**

In `client/src/index.css`, add the following BEFORE the closing `}` of `@layer utilities` (before line 418):

```css
  /* Safe area utilities for iOS notch / home indicator */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .pt-safe {
    padding-top: env(safe-area-inset-top, 0px);
  }
  .mb-safe {
    margin-bottom: env(safe-area-inset-bottom, 0px);
  }
  .mt-safe {
    margin-top: env(safe-area-inset-top, 0px);
  }
  .bottom-safe {
    bottom: env(safe-area-inset-bottom, 0px);
  }
```

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 6: Commit**

```bash
git add client/src/components/ui/button.tsx client/src/components/ui/input.tsx client/src/index.css client/index.html
git commit -m "feat: mobile-first design system - 44px touch targets, safe area utilities, viewport-fit"
```

---

### Task 2: Navigation Mobile Polish

**Files:**
- Modify: `client/src/components/Navigation.tsx`

**Context:** The navigation hamburger button uses `size="icon"` which was 36px (now 44px from Task 1). Mobile menu links have only `py-2.5` (10px) padding - insufficient for touch targets. The menu uses `md:grid-cols-2` which creates a cramped 2-column layout on tablets. The mobile booking CTA has hardcoded `h-10` (40px) - should be 44px minimum.

**Step 1: Fix mobile menu link padding and remove 2-column grid**

In `client/src/components/Navigation.tsx`, change line 269 from:

```tsx
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
```

To:

```tsx
            <div className="grid grid-cols-1 gap-0">
```

**Step 2: Increase mobile menu link touch targets**

Change line 271 from:

```tsx
                const baseClass = "px-4 py-2.5 text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors w-full text-left font-medium block";
```

To:

```tsx
                const baseClass = "px-4 py-3.5 text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors w-full text-left font-medium block text-base";
```

Changes: `py-2.5` → `py-3.5` (10px → 14px, with text = ~44px total), added `text-base` for readable 16px text.

**Step 3: Fix mobile CTA button height**

Change line 301 from:

```tsx
                  className="bg-cta hover:bg-cta/90 text-white rounded-full px-6 py-2 text-sm font-medium shadow-none h-10"
```

To:

```tsx
                  className="bg-cta hover:bg-cta/90 text-white rounded-full px-6 py-3 text-sm font-medium shadow-none min-h-11"
```

Changes: `py-2` → `py-3`, `h-10` → `min-h-11` (44px WCAG).

**Step 4: Fix login/account button heights in mobile menu**

Change line 311 from:

```tsx
                    className="h-10 px-4"
```

To:

```tsx
                    className="min-h-11 px-4"
```

Change line 322 from:

```tsx
                    className="h-10 px-4"
```

To:

```tsx
                    className="min-h-11 px-4"
```

**Step 5: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add client/src/components/Navigation.tsx
git commit -m "fix: navigation mobile - 44px touch targets, single column menu, proper button heights"
```

---

### Task 3: Hero Section Mobile Contrast & Layout

**Files:**
- Modify: `client/src/components/Hero.tsx`

**Context:** Hero has WCAG contrast issues: subtitle at `text-white/70` and price at `text-white/60` are too faint over complex image backgrounds. Trust line uses `gap-6` which causes overflow on iPhone SE (375px). These are visibility/readability fixes, not layout changes.

**Step 1: Fix subtitle contrast**

In `client/src/components/Hero.tsx`, change line 40 from:

```tsx
            <p className="text-lg sm:text-xl text-white/70 font-light mb-8 leading-relaxed">
```

To:

```tsx
            <p className="text-lg sm:text-xl text-white/90 font-light mb-8 leading-relaxed">
```

**Step 2: Fix price text contrast and size**

Change line 45 from:

```tsx
            <p className="text-white/60 text-sm font-light mb-6">
```

To:

```tsx
            <p className="text-white/80 text-base font-light mb-6">
```

**Step 3: Fix trust line overflow on small screens**

Change line 62 from:

```tsx
            <div className="flex items-center gap-6 text-white/60 text-sm font-light">
```

To:

```tsx
            <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-6 text-white/80 text-sm font-light">
```

Changes: Added `flex-wrap`, `justify-center`, reduced `gap-3` on mobile (expands to `gap-6` on sm+), improved contrast to `/80`.

**Step 4: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add client/src/components/Hero.tsx
git commit -m "fix: hero mobile - WCAG contrast (white/80-90), trust line flex-wrap for small screens"
```

---

### Task 4: Boat Cards Mobile Typography & Touch Targets

**Files:**
- Modify: `client/src/components/BoatCard.tsx`

**Context:** BoatCard has `text-xs` (12px) on the license badge and "from" price label - too small for mobile. The "View details" link is a text-only link without padding, making it hard to tap. Image height `h-52` is excessive on narrow phones.

**Step 1: Fix license badge text size**

In `client/src/components/BoatCard.tsx`, change line 72 from:

```tsx
          <span className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-medium rounded-full px-3 py-1">
```

To:

```tsx
          <span className="bg-white/90 backdrop-blur-sm text-foreground text-sm font-medium rounded-full px-3 py-1">
```

**Step 2: Fix "from" price label**

Change line 84 from:

```tsx
            <div className="text-xs text-muted-foreground">{t.boats.from}</div>
```

To:

```tsx
            <div className="text-sm text-muted-foreground">{t.boats.from}</div>
```

**Step 3: Make "View details" link tappable**

Change lines 98-105 from:

```tsx
        <a
          href={`/barco/${id}`}
          onClick={(e) => { e.preventDefault(); handleDetails(); }}
          className="text-sm font-medium text-foreground hover:text-cta inline-flex items-center gap-1 transition-colors"
          data-testid={`button-details-${id}`}
        >
          {t.boats.viewDetails} <ArrowRight className="w-3.5 h-3.5" />
        </a>
```

To:

```tsx
        <a
          href={`/barco/${id}`}
          onClick={(e) => { e.preventDefault(); handleDetails(); }}
          className="text-sm font-medium text-foreground hover:text-cta inline-flex items-center gap-1.5 transition-colors py-2 -my-1"
          data-testid={`button-details-${id}`}
        >
          {t.boats.viewDetails} <ArrowRight className="w-4 h-4" />
        </a>
```

Changes: Added `py-2 -my-1` for touch padding without affecting layout, `gap-1.5` for spacing, arrow icon `w-4 h-4` (from 3.5).

**Step 4: Optimize image height for small phones**

Change line 57 from:

```tsx
          <div className="w-full h-52 sm:h-56 lg:h-64 flex items-center justify-center">
```

To:

```tsx
          <div className="w-full h-44 sm:h-52 lg:h-64 flex items-center justify-center">
```

Change line 66 from:

```tsx
            className="w-full h-52 sm:h-56 lg:h-64 object-cover transition-transform duration-200 group-hover:scale-[1.03]"
```

To:

```tsx
            className="w-full h-44 sm:h-52 lg:h-64 object-cover transition-transform duration-200 group-hover:scale-[1.03]"
```

**Step 5: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add client/src/components/BoatCard.tsx
git commit -m "fix: boat cards mobile - larger text, tappable details link, optimized image height"
```

---

### Task 5: Fleet Section Mobile Typography

**Files:**
- Modify: `client/src/components/FleetSection.tsx`

**Context:** FleetSection help text uses `text-xs` on mobile (12px). The WhatsApp and Phone buttons use `text-xs sm:text-sm` pattern with consistent padding, but the icons are only 16px on mobile. Help text heading is also `text-xs`.

**Step 1: Fix help text minimum size**

In `client/src/components/FleetSection.tsx`, change line 104 from:

```tsx
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-3 sm:mb-4 lg:mb-6">{t.fleet.helpText}</p>
```

To:

```tsx
          <p className="text-sm lg:text-base text-gray-600 mb-3 sm:mb-4 lg:mb-6">{t.fleet.helpText}</p>
```

**Step 2: Fix button text minimum size**

Change line 107 from:

```tsx
              className="border border-border text-foreground hover:border-foreground/30 px-6 py-3 rounded-full font-medium flex items-center justify-center transition-colors text-xs sm:text-sm lg:text-base"
```

To:

```tsx
              className="border border-border text-foreground hover:border-foreground/30 px-5 py-3 rounded-full font-medium flex items-center justify-center transition-colors text-sm lg:text-base min-h-11"
```

Changes: `text-xs sm:text-sm` → `text-sm` (always 14px min), `px-6` → `px-5` (slightly tighter on mobile), added `min-h-11`.

Change line 116 similarly from:

```tsx
              className="border border-border text-foreground hover:border-foreground/30 px-6 py-3 rounded-full font-medium flex items-center justify-center transition-colors text-xs sm:text-sm lg:text-base"
```

To:

```tsx
              className="border border-border text-foreground hover:border-foreground/30 px-5 py-3 rounded-full font-medium flex items-center justify-center transition-colors text-sm lg:text-base min-h-11"
```

**Step 3: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add client/src/components/FleetSection.tsx
git commit -m "fix: fleet section mobile - minimum text-sm, 44px button heights"
```

---

### Task 6: Footer Mobile Touch Targets & Contrast

**Files:**
- Modify: `client/src/components/Footer.tsx`

**Context:** Footer has several mobile issues: newsletter input/button use `text-xs` and `py-2.5` (below 44px), footer legal links use `text-xs text-white/40` (fails WCAG AA contrast), navigation links use `space-y-2.5` with no padding (hard to tap), and contact items have no minimum height.

**Step 1: Fix newsletter input**

In `client/src/components/Footer.tsx`, change line 120 from:

```tsx
                    className="bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 flex-1 min-w-0"
```

To:

```tsx
                    className="bg-white/10 border border-white/20 rounded-full px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 flex-1 min-w-0"
```

Changes: `py-2.5` → `py-3`, `text-xs` → `text-sm`, placeholder `/40` → `/50`.

**Step 2: Fix newsletter button**

Change line 125 from:

```tsx
                    className="bg-cta hover:bg-cta/90 text-white rounded-full px-6 py-2.5 text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
```

To:

```tsx
                    className="bg-cta hover:bg-cta/90 text-white rounded-full px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
```

**Step 3: Fix newsletter subtitle and description text**

Change line 105 from:

```tsx
              <p className="text-xs text-white/40 mb-3">{t.locationPages.newsletter.subtitle}</p>
```

To:

```tsx
              <p className="text-sm text-white/50 mb-3">{t.locationPages.newsletter.subtitle}</p>
```

**Step 4: Fix navigation link spacing for touch targets**

Change line 140 from:

```tsx
            <ul className="space-y-2.5 text-sm">
```

To:

```tsx
            <ul className="space-y-1 text-sm">
```

And for every `<a>` inside this list and the Services list, add `py-1.5 block` to make them tappable. Change lines 142, 145, 148, 151, 154, 157, 160, 163 — update each anchor's class. For example, line 142:

```tsx
                <a href="#fleet" className="hover:text-white transition-colors py-1.5 block">{t.nav.fleet}</a>
```

Apply the same `py-1.5 block` pattern to all `<a>` tags in both lists (lines 142-164 and lines 169-170).

Also change line 168 from:

```tsx
            <ul className="space-y-2.5 text-sm">
```

To:

```tsx
            <ul className="space-y-1 text-sm">
```

**Step 5: Fix footer bottom legal links contrast and size**

Change line 238 from:

```tsx
            <div className="text-white/40 text-xs flex flex-wrap gap-4 justify-center">
```

To:

```tsx
            <div className="text-white/60 text-sm flex flex-wrap gap-2 sm:gap-4 justify-center">
```

Changes: `text-white/40` → `text-white/60` (better contrast), `text-xs` → `text-sm`, `gap-4` → `gap-2 sm:gap-4`.

**Step 6: Fix contact item helper text**

Change lines 187, 202, 219, 227 — the `text-xs text-white/40` patterns to `text-xs text-white/50`:

Line 187: `"text-xs text-white/40 mt-0.5"` → `"text-xs text-white/50 mt-0.5"`
Line 202: `"text-xs text-white/40 mt-0.5"` → `"text-xs text-white/50 mt-0.5"`
Line 219: `"text-xs text-white/40 mt-0.5"` → `"text-xs text-white/50 mt-0.5"`
Line 227: `"text-xs text-white/40 mt-0.5"` → `"text-xs text-white/50 mt-0.5"`

Note: `text-xs` is acceptable here as these are helper/secondary labels, not actionable content.

**Step 7: Fix season indicator and social spacing**

Change line 63 from:

```tsx
            <div className="flex items-center space-x-2 text-xs mb-6">
```

To:

```tsx
            <div className="flex items-center space-x-2 text-sm mb-6">
```

**Step 8: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add client/src/components/Footer.tsx
git commit -m "fix: footer mobile - WCAG contrast, 44px newsletter inputs, tappable nav links"
```

---

### Task 7: Booking Modal & Sticky CTA Safe Areas

**Files:**
- Modify: `client/src/hooks/useBookingModal.tsx:54`
- Modify: `client/src/components/BoatDetailPage.tsx:708-720`
- Modify: `client/src/components/WhatsAppFloatingButton.tsx:24-25`

**Context:** The booking modal uses `!h-[100dvh]` which leaves no space for iOS browser chrome and safe areas. The boat detail sticky CTA bar sits at `bottom-0` with no safe area padding, overlapping the iOS home indicator. The WhatsApp floating button has `bottom-6` which doesn't account for safe area.

**Step 1: Fix booking modal height**

In `client/src/hooks/useBookingModal.tsx`, change line 54 from:

```tsx
        <DialogContent className="!max-w-none md:!max-w-2xl lg:!max-w-3xl !w-full md:!w-[720px] lg:!w-[860px] !h-[100dvh] md:!h-[88vh] !rounded-none md:!rounded-xl !p-0 !flex !flex-col overflow-hidden !left-0 md:!left-1/2 !top-0 md:!top-1/2 !translate-x-0 md:!-translate-x-1/2 !translate-y-0 md:!-translate-y-1/2">
```

To:

```tsx
        <DialogContent className="!max-w-none md:!max-w-2xl lg:!max-w-3xl !w-full md:!w-[720px] lg:!w-[860px] !h-[100dvh] md:!h-[88vh] !rounded-none md:!rounded-xl !p-0 !flex !flex-col overflow-hidden !left-0 md:!left-1/2 !top-0 md:!top-1/2 !translate-x-0 md:!-translate-x-1/2 !translate-y-0 md:!-translate-y-1/2 pt-safe pb-safe">
```

Changes: Added `pt-safe pb-safe` classes (from Task 1) to respect iOS safe areas inside the modal.

**Step 2: Fix boat detail sticky CTA bar**

In `client/src/components/BoatDetailPage.tsx`, change line 708 from:

```tsx
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
```

To:

```tsx
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe">
```

**Step 3: Fix WhatsApp floating button positioning**

In `client/src/components/WhatsAppFloatingButton.tsx`, change lines 24-25 from:

```tsx
      className={`fixed right-4 z-50 items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg transition-all hover:scale-110 animate-bounce-once ${
        isBoatDetailPage ? "hidden md:flex md:bottom-6" : "flex bottom-6"
      }`}
```

To:

```tsx
      className={`fixed right-4 z-50 items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg transition-all hover:scale-110 animate-bounce-once ${
        isBoatDetailPage ? "hidden md:flex md:bottom-6" : "flex bottom-8 mb-safe"
      }`}
```

Changes: `bottom-6` → `bottom-8 mb-safe` (32px + safe area for home indicator).

**Step 4: Fix phone prefix dropdown size**

In `client/src/components/BookingWizardMobile.tsx`, change line 628 from:

```tsx
              <div className="absolute top-full left-0 mt-1 w-64 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
```

To:

```tsx
              <div className="absolute top-full left-0 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
```

Changes: `w-64` → `w-72` (more room for country names), `max-h-60` → `max-h-80` (more scrollable area).

**Step 5: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add client/src/hooks/useBookingModal.tsx client/src/components/BoatDetailPage.tsx client/src/components/WhatsAppFloatingButton.tsx client/src/components/BookingWizardMobile.tsx
git commit -m "fix: safe areas for iOS - booking modal, sticky CTA, WhatsApp button, phone dropdown"
```

---

### Task 8: Booking Wizard Mobile Text Size Audit

**Files:**
- Modify: `client/src/components/BookingWizardMobile.tsx`

**Context:** The booking wizard has ~25 instances of `text-xs` for error messages, section headers, price labels, etc. Error messages at 12px are critical for form UX. Section headers like "Packs" and "Individual" are also `text-xs`. We need to selectively upgrade: error messages stay `text-xs` (they're secondary feedback), but section headers and price labels should be `text-sm`.

**Step 1: Fix section headers in extras step**

Change line 807 from:

```tsx
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.booking.extrasSection.packs}</p>
```

To:

```tsx
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.booking.extrasSection.packs}</p>
```

Change line 848 from:

```tsx
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.booking.extrasSection.individual}</p>
```

To:

```tsx
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.booking.extrasSection.individual}</p>
```

**Step 2: Fix extra item names**

Change line 871 from:

```tsx
                          <p className="text-xs font-medium text-gray-800 truncate">{extra.name}</p>
```

To:

```tsx
                          <p className="text-sm font-medium text-gray-800 truncate">{extra.name}</p>
```

**Step 3: Fix summary bar text**

Change line 196 from:

```tsx
          <div className="border-t border-gray-100 bg-primary/5 px-4 py-2 flex items-center justify-between text-xs">
```

To:

```tsx
          <div className="border-t border-gray-100 bg-primary/5 px-4 py-2.5 flex items-center justify-between text-sm">
```

**Step 4: Fix discount and price confirmation text**

Change line 960 from:

```tsx
            <p className="text-xs opacity-75 mt-1">{t.booking.discountApplied}: -{discount}€</p>
```

To:

```tsx
            <p className="text-sm opacity-75 mt-1">{t.booking.discountApplied}: -{discount}€</p>
```

Change line 962 from:

```tsx
          <p className="text-xs opacity-60 mt-1">{t.booking.priceConfirmedWhatsApp}</p>
```

To:

```tsx
          <p className="text-sm opacity-60 mt-1">{t.booking.priceConfirmedWhatsApp}</p>
```

**Step 5: Fix privacy consent text**

Change line 975 from:

```tsx
        <span className="text-xs text-gray-600" id="wizard-privacy-consent-label">
```

To:

```tsx
        <span className="text-sm text-gray-600" id="wizard-privacy-consent-label">
```

**Step 6: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add client/src/components/BookingWizardMobile.tsx
git commit -m "fix: booking wizard mobile - upgrade text-xs to text-sm for readability"
```

---

### Task 9: Desktop Booking Form Input Heights

**Files:**
- Modify: `client/src/components/BookingFormDesktop.tsx`

**Context:** BookingFormDesktop uses custom input styling with `p-2.5` which is below the 44px WCAG standard. These custom inputs bypass the design system `Input` component and need manual fixes.

**Step 1: Find and fix the inputBase constant**

Search for the `inputBase` constant in `client/src/components/BookingFormDesktop.tsx` and change from:

```typescript
const inputBase = "w-full p-2.5 border-2 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2"
```

To:

```typescript
const inputBase = "w-full p-3 border-2 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2 min-h-[44px]"
```

Changes: `p-2.5` → `p-3`, added `min-h-[44px]` to enforce WCAG minimum.

**Step 2: Fix sticky section headers**

Search for `sticky top-0` instances in BookingFormDesktop.tsx and change from:

```tsx
className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white pt-1 pb-1"
```

To:

```tsx
className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white pt-1.5 pb-1.5"
```

Apply this to ALL instances of sticky section headers in the file.

**Step 3: Verify and commit**

Run: `npx tsc --noEmit`

```bash
git add client/src/components/BookingFormDesktop.tsx
git commit -m "fix: desktop booking form - 44px input height, readable section headers"
```

---

## Verification Checklist

After all tasks are complete:

1. **TypeScript**: `npx tsc --noEmit` — 0 errors
2. **Visual check mobile (375px)**: Chrome DevTools → iPhone SE
   - Navigation hamburger is easily tappable (44px)
   - Hero text is readable, trust line wraps cleanly
   - Boat cards show clearly with tappable "Ver detalles"
   - Footer links are tappable, legal links are readable
   - Newsletter input is large enough to type in
3. **Visual check tablet (768px)**: Chrome DevTools → iPad Mini
   - Navigation menu is single column
   - Cards grid is 2 columns, properly spaced
4. **Booking flow on mobile**: Open booking modal
   - All inputs are 44px+ height
   - Phone prefix dropdown is large enough
   - Modal doesn't clip on iOS (safe areas)
5. **Fixed elements**: Check boat detail page
   - Sticky CTA has padding below (home indicator)
   - WhatsApp button doesn't overlap CTA
