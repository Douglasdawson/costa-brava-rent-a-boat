# Mobile-First Aggressive Audit - Design Document

> **Goal:** Make every interaction on mobile feel native-app quality. WCAG 2.1 AA compliance, 44px touch targets, safe area support, and polished UX across iPhone SE to iPad.

**Approach:** Bottom-Up Systematic - fix design system tokens first, then cascade fixes through components.

**Target devices:** Full range - iPhone SE (375px) to iPad (1024px), Android mid-range, modern iPhones with notch/dynamic island.

---

## Section 1: Design System Mobile Tokens

### Touch Targets (WCAG 2.1 - 44px minimum)
- `button.tsx`: all variants get `min-h-11` (44px) on mobile
- `input.tsx`: `h-9` (36px) → `h-11` (44px), padding `py-3`
- Links used as actions: minimum `py-2 px-3` padding

### Safe Area Support
- `index.css`: add `env(safe-area-inset-*)` utilities
- `.pb-safe`, `.pt-safe` classes for fixed/sticky elements
- `viewport-fit=cover` in HTML meta viewport

### Typography Floor
- Minimum readable content: `text-sm` (14px)
- `text-xs` (12px) reserved for decorative badges/labels only
- Hero text contrast: minimum `text-white/80` over images

---

## Section 2: Navigation & Footer

### Navigation.tsx
- Hamburger: icon stays `w-6 h-6`, button wrapper gets `min-h-11 min-w-11`
- Mobile menu: single column until `lg` (remove `md:grid-cols-2`)
- Menu links: `py-3` padding for 44px+ touch targets
- CTA in menu: full-width, `min-h-12` (48px), prominent coral
- Safe area: `pt-safe` on fixed header

### Footer.tsx
- Newsletter input: `text-sm`, `py-3` (44px height)
- Newsletter button: same sizing
- Legal links: `text-sm text-white/60` (contrast fix from `text-xs text-white/40`)
- Nav links: add `py-2` vertical padding
- Contact items: convert to tappable `min-h-11` elements

---

## Section 3: Hero & Content

### Hero.tsx
- Subtitle: `text-white/90` (from `/70`)
- Price: `text-white/80 text-base` (from `/60 text-sm`)
- Trust line: `flex-wrap gap-3 sm:gap-6` (prevent overflow on 375px)

### BoatCard.tsx
- License badge: `text-sm` (from `text-xs`)
- Price label: `text-sm` (from `text-xs`)
- "View details" link: add `py-2 px-3`, `min-h-11`
- Image height: `h-44 sm:h-52 lg:h-64` (better ratio on small phones)

---

## Section 4: Booking Flow (Critical Conversion)

### BookingWizardMobile.tsx + BookingFormDesktop.tsx
- All inputs: inherit `h-11` from design system
- Phone dropdown: `w-full max-w-72`, `max-h-80`
- Modal height: account for safe areas instead of raw `100dvh`
- Step buttons: `min-h-11` with responsive padding
- Progress bar: `overflow-hidden` (no horizontal scroll)

### BoatDetailPage.tsx
- Sticky CTA bar: add `pb-safe` for iOS home indicator
- Specs grid: proper touch targets
- Gallery: touch-optimized

---

## Section 5: Fixed Elements & Safe Areas

### All `fixed bottom-*` elements
- WhatsAppFloatingButton: safe area bottom offset
- BoatDetailPage sticky CTA: safe area bottom
- Z-index coordination: nav(50) > WhatsApp(40) > sticky CTA(30)

### Scroll & Overflow
- Remove accidental horizontal scroll
- Footer bottom links: `gap-2 sm:gap-4`

---

**Status:** COMPLETED
**Date:** 2026-03-03
