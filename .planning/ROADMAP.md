# GSD Roadmap — Costa Brava Rent a Boat

**Bootstrap:** 2026-04-27 — minimal GSD structure introduced for phase 3 onward. Phases 1–2 are tracked narratively in the top-level `ROADMAP.md` (project root) and are out of scope for the GSD chain.

**Workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`

---

## Phase 3: Availability Widget

**Status:** SPEC drafted — pending discuss-phase
**Directory:** `.planning/phase-03-availability-widget/`
**Created:** 2026-04-27

**Summary:** Public `/disponibilidad` page (i18n in 8 languages) and reusable `<AvailabilityWidget>` component. Given a date and duration, displays the fleet with real-time availability, supports filtering by license requirement, and routes selections to a pre-qualified WhatsApp message. No online payments — preserves the request-based booking model.

**Goal in one sentence:** Replace the "guess and ask" flow (user opens individual boat pages to check dates) with a single-page fleet availability view that converts directly to a qualified WhatsApp lead.

**Canonical references:**
- SPEC: `.planning/phase-03-availability-widget/03-SPEC.md`
- Discovery findings (this conversation): availability backend already exposes per-boat endpoints; fleet-wide endpoint is the main new backend deliverable.

**Depends on:** None (greenfield within existing codebase).

**Blocks:** Phase 4 (TBD — likely embedding the widget on home + landing pages).

---

## Backlog (not yet specced)

- Embed `<AvailabilityWidget>` in home and location landing pages
- Multi-day / date-range availability
- Capacity and feature filters in the widget
- Internal admin notification when a CTA-tap converts to WhatsApp message

---

*GSD bootstrap commit: 2026-04-27. Earlier work tracked in `/ROADMAP.md` (project root) — not migrated.*
