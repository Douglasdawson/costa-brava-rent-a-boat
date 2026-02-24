# Design Doc: Booking Wizard Mobile

**Date:** 2026-02-23
**Status:** Approved
**Author:** CDO + Claude Code

## Problem

The BookingFormWidget renders all fields at once (~1280 lines, 9+ fields visible simultaneously) inside a full-screen modal on mobile. This single long-scroll form causes 30-50% booking abandonment on mobile devices.

## Solution

Wrap the mobile render of `BookingFormWidget` in a 4-step wizard. Desktop experience is unchanged.

## Approach: Mobile-only Wizard (Approach A)

- `BookingFormWidget.tsx` retains all state and logic (no changes to business logic)
- `useIsMobile()` hook determines render path
- Mobile → new `<BookingWizardMobile />` component (receives all state/handlers as props)
- Desktop → existing form render (untouched)

## The 4 Steps

| Step | Title | Fields | Required to advance |
|------|-------|--------|---------------------|
| 1 | Elige tu barco | License filter + boat selector + date | Boat selected + date valid |
| 2 | Tu excursión | Duration + departure time + number of people | All 3 filled |
| 3 | Tus datos | First name + last name + phone prefix + phone + email | All valid |
| 4 | Extras y confirmar | Packs + individual extras + discount code + price summary | — (submit) |

## Progress Bar

Fixed at the top of the modal (outside scrollable content area):
- 4 dots connected by lines
- Filled dot = current/completed step
- Line fills progressively as user advances

## Navigation

- "Siguiente →" button fixed at bottom of each step
- "← Atrás" button on steps 2, 3, 4
- Step 4 submit button: "Reservar por WhatsApp"
- Pressing "Siguiente" on an incomplete step shows inline field errors (does not silently block)

## State on Close/Reopen

Modal close resets to step 1 (same behavior as today via `closeBookingModal`).

## Files Affected

| File | Change |
|------|--------|
| `client/src/components/BookingFormWidget.tsx` | Add mobile branch in render, pass props to wizard |
| `client/src/components/BookingWizardMobile.tsx` | New component — 4-step wizard UI |
| `client/src/hooks/useBookingModal.tsx` | No changes needed |

## Out of Scope

- Desktop form changes
- Backend/API changes
- Animation between steps (nice to have, not required)
- Persisting wizard state across modal open/close
