# Phase 3: Availability Widget — Specification

**Created:** 2026-04-27
**Ambiguity score:** 0.15 (gate: ≤ 0.20)
**Requirements:** 11 locked

## Goal

Public route `/disponibilidad` (i18n across 8 languages) renders the full fleet for a chosen date and duration, marks each boat as free or occupied using the existing booking-conflict logic, and routes free-boat clicks to a pre-qualified WhatsApp deep link including boat, date, duration, and indicative price. The same UI ships as a reusable `<AvailabilityWidget>` component embeddable elsewhere.

## Background

Discovery (2026-04-27) confirmed:

- `server/routes/availability.ts` already exposes `GET /api/availability` (per-boat slots) and `GET /api/boats/:id/availability` (per-boat month view). **No fleet-wide endpoint exists.**
- Conflict detection lives in `server/storage/bookings.ts:81-98` (`getOverlappingBookingsWithBuffer`) — must be reused, not reimplemented. Buffer: 20min prod / 5min dev.
- `bookings` table (`shared/schema.ts:310-371`) models bookings as `startTime`/`endTime` timestamps + `bookingStatus`. The statuses that block availability are `hold | pending_payment | confirmed`.
- `client/src/components/AvailabilityCalendar.tsx` is per-boat only; CSR.
- `client/src/utils/whatsapp.ts` exports `openWhatsApp(message)` and `createBookingMessage()`. `WHATSAPP_PHONE` lives in `client/src/lib/config.ts:2`. Mobile deep-link works.
- `shared/boatData.ts` `BoatData` interface has **no** `requiresLicense` field — license info is encoded in the `subtitle` string. Pricing is stored as `€`-suffixed strings (e.g. `"75€"`).
- `shared/i18n-routes.ts` and `client/src/utils/seo-config.ts` follow a documented 5-step pattern to add a translated public route. `server/seo/translatedStaticPaths.ts` is the SEO allowlist for non-ES indexing.
- Booking model is request-based — no online payments, ever (project memory + `CLAUDE.md`).

Today, a user wanting to compare which boats are free on a date must open each boat page individually. This phase consolidates that into one fleet view that converts directly to WhatsApp.

## Requirements

1. **Fleet availability endpoint**: New backend endpoint returns the full fleet's availability for a given date + duration, with morning/afternoon slot breakdown.
   - Current: `/api/availability` and `/api/boats/:id/availability` are per-boat only; no aggregate endpoint exists.
   - Target: `GET /api/availability/fleet?date=YYYY-MM-DD&duration=<hours>` returns `{ date, duration, season, boats: [{ boatId, slug, name, image, capacity, requiresLicense, available: boolean, morningSlots: "HH:mm"[], afternoonSlots: "HH:mm"[], priceFromEUR: number }], nearbyAvailableDates?: "YYYY-MM-DD"[] }`. Morning = slots starting before 14:00; afternoon = slots starting at or after 14:00. Implementation **must** call `getOverlappingBookingsWithBuffer` for each active boat (no duplicated conflict logic).
   - Acceptance: an integration test creates a `confirmed` booking covering the full requested window for boat X and verifies the endpoint returns `available: false` with both slot arrays empty for boat X and `available: true` for an unaffected boat Y; a second test with a `confirmed` booking that blocks only morning hours returns `morningSlots: []` and a non-empty `afternoonSlots` for that boat; a third test with `date` outside operating season (April–October) returns HTTP 200 with `boats: []` and `season: "off"`.

2. **`requiresLicense` field on boatData**: Catalog gains an explicit license flag.
   - Current: `BoatData` interface (`shared/boatData.ts:4-42`) has no boolean license field; consumers parse `subtitle`.
   - Target: `requiresLicense: boolean` added to the interface and to every boat entry in `shared/boatData.ts`. No catalog entry may be undefined.
   - Acceptance: `npm run check` (tsc) passes; grep for `subtitle.*licencia` parsing in the codebase returns zero new occurrences in code added by this phase.

3. **Numeric `priceFrom` helper**: Pricing exposes a typed numeric reader.
   - Current: pricing values in `shared/boatData.ts` are strings with `€` (e.g. `"75€"`); `shared/pricing.ts` exists but does not expose a "from" numeric reader.
   - Target: `getPriceFromForBoat(boat, durationHours, date): number` exported from `shared/pricing.ts`. Returns EUR as a number. Selects season automatically from date using existing season helpers.
   - Acceptance: unit test parses `"75€"` → `75` (integer EUR), and a known boat+date in high season returns the high-season tariff for the requested duration.

4. **`useFleetAvailability` hook**: Frontend gains a reusable data hook.
   - Current: `client/src/hooks/` has no fleet-availability hook; `BookingFormWidget` and `AvailabilityCalendar` each call `useQuery` inline.
   - Target: `client/src/hooks/useFleetAvailability.ts` exports `useFleetAvailability(date: string, durationHours: number)` returning `{ boats, isLoading, error, season, nearbyAvailableDates }`. queryKey `["fleet-availability", date, durationHours]`, `staleTime: 60_000`.
   - Acceptance: hook renders without crashing in an isolated test using the existing test utilities; queryKey uniqueness is verified by mounting two instances with different params and asserting independent cache entries.

5. **`/disponibilidad` page in 8 languages**: Public translated route ships with full SEO wiring.
   - Current: route does not exist; `i18n-routes.ts`, `seo-config.ts`, `translatedStaticPaths.ts`, and `App.tsx` `PAGE_COMPONENTS` have no `availability` entry.
   - Target: `availability` slug map added to `shared/i18n-routes.ts` for all 8 languages (`es: "disponibilidad", en: "availability", fr: "disponibilite", de: "verfuegbarkeit", nl: "beschikbaarheid", it: "disponibilita", ca: "disponibilitat", ru: "dostupnost"`); page component lazy-loaded in `App.tsx` and registered in `PAGE_COMPONENTS`; SEO config block added per language in `seo-config.ts`; `"/disponibilidad"` allowlisted in `translatedStaticPaths.ts` for all 8 languages.
   - Acceptance: visiting `/disponibilidad`, `/en/availability`, `/de/verfuegbarkeit`, `/fr/disponibilite` each renders the page with localized chrome; sitemap includes the route in all 8 languages; `<link rel="alternate" hreflang>` tags are present for the 8 languages and `x-default`.

6. **`<AvailabilityWidget>` reusable component**: The page UI is a standalone component, not page-bound.
   - Current: no shared availability widget exists.
   - Target: `client/src/components/AvailabilityWidget.tsx` accepts props `{ initialDate?: string; initialDuration?: number; licenseFilter?: "all" | "unlicensed" | "licensed"; onBoatSelect?: (boat) => void; hideHeader?: boolean }`. The page `/disponibilidad` mounts this component with default props. Component does not import from `wouter` or any page-only module.
   - Acceptance: a smoke test mounts the component with default props and asserts that the date picker, duration picker, license toggle, and boat grid all render; mounting it twice on the same route does not throw or share state.

7. **Pre-qualified WhatsApp message**: CTA on free boats opens WhatsApp with a complete request.
   - Current: `createBookingMessage()` uses `{boatName}` and `{price}` placeholders. There is no template that includes date and duration.
   - Target: a new exported builder (e.g. `createAvailabilityMessage({ boatName, date, durationHours, priceFromEUR, language })`) returns a localized message in the active UI language including all four fields. CTA button on each free-boat card calls `openWhatsApp(message)`.
   - Acceptance: triggering the CTA on mobile opens WhatsApp with the pre-loaded message containing the boat name, the formatted date in the active language's locale, the duration, and the indicative price; the same CTA in 8 different language sessions produces 8 distinct localized messages (verified by snapshot test against the 8 i18n bundles).

8. **i18n bundle parity**: All new UI strings live in the i18n system; no hardcoded JSX text.
   - Current: `client/src/i18n/es.ts` has no `availability` namespace.
   - Target: `availability` namespace added to `es.ts` covering page chrome, picker labels, license toggle labels, status badges (free/occupied/off-season), CTA button label, empty state, nearby-dates chips label, and the WhatsApp message template; `npm run i18n:translate` run to propagate to the 7 other languages.
   - Acceptance: `npm run i18n:validate` reports 0 differences across the 8 languages; grep across new files in this phase finds no Spanish-only literals in JSX (excluding code identifiers).

9. **Deterministic card ordering**: The card grid renders in a stable, user-meaningful order.
   - Current: no ordering exists because the fleet view itself does not exist.
   - Target: a pure ordering function `orderFleetForDisplay(boats)` (exported from `client/src/utils/availability.ts` or co-located with the widget) sorts: (1) `available: true` before `available: false`; (2) within each group, `priceFromEUR` ascending; (3) tiebreak by `name` ascending (locale-aware compare). The widget renders cards in this exact order. The endpoint MAY return any order; ordering is a frontend concern.
   - Acceptance: a unit test feeds a fixture of 5 boats with mixed availability and prices and asserts that the function returns them in the documented order; the smoke test for the widget mounts the same fixture and verifies card DOM order matches.

10. **"All booked" fallback with nearby dates**: When the chosen date is in season but every boat is occupied, the user sees up to 3 alternative dates instead of an empty state.
    - Current: no fallback exists; an in-season date with zero free boats would render a mute empty grid.
    - Target: when `season !== "off"` and `boats.every(b => !b.available)`, the endpoint includes `nearbyAvailableDates: "YYYY-MM-DD"[]` with up to 3 dates within ±7 days of the requested date that have ≥1 free boat (computed using `getOverlappingBookingsWithBuffer` for each candidate date), prioritizing closest dates first and preferring future over past on ties. The widget renders these as clickable chips above the empty grid; tapping a chip refetches the widget for that date. If fewer than 3 candidates exist within the window, the array is shorter; if zero exist, an empty array is returned and the widget shows a localized "no nearby availability — try a different week" empty state.
    - Acceptance: an integration test where every boat is fully booked on date X and ≥3 nearby dates have at least one free boat asserts `nearbyAvailableDates.length === 3`; a second test where only 1 nearby date qualifies asserts `length === 1`; a widget smoke test renders chips when the array is non-empty and renders the localized empty-state message when the array is empty.

11. **Card visual contract**: Each free-boat card renders a fixed set of fields with explicit visual rules.
    - Current: no card component exists.
    - Target: each free-boat card renders exactly: (1) image from `boat.image`, (2) boat name, (3) capacity formatted as "hasta N personas" (and equivalents in 7 other languages, sourced from the i18n bundle), (4) price formatted as `desde {priceFromEUR}€` (no `/h` suffix — duration is selected globally above the grid, so per-card price is total for the chosen duration; localized "desde" via i18n), (5) morning slots and afternoon slots rendered as two labeled rows of chips ("Mañana" / "Tarde" + i18n equivalents), (6) a primary CTA button labeled "Reservar por WhatsApp" (i18n) with WhatsApp brand green `#25D366` background and white text — explicitly NOT the project's corporate sky-blue (`#A8C4DD`) which is reserved for non-WhatsApp primary actions. Occupied-boat cards render the same fields but greyed-out, with no CTA button and a localized "Ocupado este día" badge instead.
    - Acceptance: a snapshot test of the card component with a free-boat fixture asserts presence of all 6 fields and the green CTA; a second snapshot with an occupied-boat fixture asserts the badge is present and the CTA is absent; manual mobile check at 375px viewport confirms the card layout does not overflow.

## Boundaries

**In scope:**
- New backend endpoint `GET /api/availability/fleet`
- Morning/afternoon slot split (before/after 14:00)
- `nearbyAvailableDates` fallback computed by the endpoint when in-season and all boats booked
- New `requiresLicense: boolean` on `BoatData` and all catalog entries
- New `getPriceFromForBoat` helper in `shared/pricing.ts`
- New `useFleetAvailability` hook
- New `/disponibilidad` page wired in all 8 languages (routing, SEO, sitemap allowlist)
- New `<AvailabilityWidget>` reusable component consumed by the page
- Pure `orderFleetForDisplay` ordering utility (frontend)
- Card visual contract: image, name, capacity, "desde X€", morning/afternoon chips, green WhatsApp CTA
- New WhatsApp message builder including date and duration
- New `availability` i18n namespace in all 8 languages
- Tests: integration tests for the fleet endpoint (booking conflict, partial-day block, off-season, all-booked fallback), unit test for the price helper, unit test for ordering, smoke + snapshot tests for the widget and card

**Out of scope:**
- Online payments / Stripe — booking model is request-based (preserved indefinitely; see project memory)
- Creating real `bookings` rows from the widget — CTA only opens WhatsApp; no DB writes from this UI
- Modifying `BookingFormWidget` or `AvailabilityCalendar` behavior — both remain untouched
- Embedding `<AvailabilityWidget>` on home, location, or boat-detail pages — separate backlog item, deliberately deferred so this phase ships behind a single URL first
- Multi-day or date-range availability — single date, single duration only
- Filters beyond duration + license (e.g. capacity, features, price ceiling) — backlog
- Changing `getOverlappingBookingsWithBuffer` or the `no_overlapping_bookings` Postgres constraint — reuse only
- Admin notifications when a CTA-tap occurs — backlog
- A/B testing the widget — backlog
- Migrating existing `subtitle`-based license parsing across the codebase — only the new code uses the new flag; existing code stays as-is
- Per-hour pricing display ("X€/h") — phase ships with total-for-selected-duration only because the duration picker lives above the grid; per-hour is a backlog item if user feedback demands it

## Constraints

- **Performance:** fleet endpoint must respond in <300ms p95 for the existing fleet (~10 boats) with cache; cache TTL aligned with the existing 60s in `availability.ts`. The `nearbyAvailableDates` computation widens the work by up to 14 candidate dates × N boats — must stay under the same budget via cache or single SQL query.
- **Operating season:** Apr–Oct only; off-season requests return an empty fleet with `season: "off"` and the UI renders the empty state rather than a partial list. `nearbyAvailableDates` is never populated when `season === "off"`.
- **Booking buffer:** 20min prod / 5min dev — inherited from `getOverlappingBookingsWithBuffer`; the widget MUST NOT reapply the buffer in client code.
- **Mobile-first:** layout must function at viewport ≥375px; CTA tap on iOS/Android must open WhatsApp via `wa.me` deep link with pre-loaded text.
- **Languages:** es, en, ca, fr, de, nl, it, ru — all 8 must reach parity before ship.
- **TypeScript:** strict mode; no `any`. Drizzle for any new DB query (none expected — endpoint reuses existing storage).
- **Styles:** TailwindCSS only; reuse `shadcn/ui` primitives where they exist. WhatsApp CTA uses the WhatsApp brand green `#25D366`, NOT the project's corporate sky-blue (which stays for non-WhatsApp primary actions).
- **Auth:** route is public — no admin guard.
- **No new dependencies** unless justified in plan-phase.

## Acceptance Criteria

- [ ] `GET /api/availability/fleet?date=&duration=` returns 200 with the documented JSON shape and reuses `getOverlappingBookingsWithBuffer`
- [ ] A `confirmed` booking covering the full queried window flips that boat's `available` to `false` with both slot arrays empty
- [ ] A `confirmed` booking blocking only morning hours returns `morningSlots: []` and a non-empty `afternoonSlots` for that boat
- [ ] An off-season date returns `boats: []`, `season: "off"`, and no `nearbyAvailableDates`
- [ ] When in-season and every boat is booked on date X, `nearbyAvailableDates` contains up to 3 dates within ±7 days that have ≥1 free boat
- [ ] `BoatData.requiresLicense` exists and is set on every catalog entry
- [ ] `getPriceFromForBoat(boat, duration, date)` returns a number (EUR) and is unit-tested
- [ ] `useFleetAvailability` hook exists with queryKey `["fleet-availability", date, durationHours]`, `staleTime: 60_000`, and exposes `nearbyAvailableDates`
- [ ] `/disponibilidad` (and the 7 translated equivalents) render the widget; sitemap includes all 8; hreflang tags are present
- [ ] `<AvailabilityWidget>` mounts standalone with default props and emits `onBoatSelect` when a free-boat CTA is tapped
- [ ] `orderFleetForDisplay` unit-tested: available before occupied, then `priceFromEUR` ascending, then `name`; widget DOM order matches
- [ ] Card snapshot test asserts free-boat layout has image, name, capacity, "desde X€", morning/afternoon chips, and the green `#25D366` WhatsApp CTA; occupied-boat layout has the "Ocupado" badge and no CTA
- [ ] WhatsApp CTA opens `wa.me/<phone>?text=...` with a localized message containing boat name, date, duration, and indicative price — verified on a real mobile device
- [ ] `npm run i18n:validate` returns 0 differences; no Spanish-only literals in new JSX
- [ ] `npm run check:all` passes (tsc + lint + i18n:validate + tests)
- [ ] Lighthouse SEO score ≥ 90 on `/disponibilidad`

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                                 |
|--------------------|-------|------|--------|-----------------------------------------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | Page + reusable component; ordering, fallback, and card contract locked |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | Explicit out-of-scope list with reasoning per item, including per-hour pricing |
| Constraint Clarity | 0.75  | 0.65 | ✓      | Perf, mobile, i18n, season, buffer, auth, brand color all locked      |
| Acceptance Criteria| 0.88  | 0.70 | ✓      | 16 pass/fail checkboxes covering each requirement and edge cases       |
| **Ambiguity**      | 0.15  | ≤0.20| ✓      | Gate met after user verification round                                |

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective     | Question summary                              | Decision locked                                                                                       |
|-------|-----------------|-----------------------------------------------|-------------------------------------------------------------------------------------------------------|
| 0     | Researcher      | What backend exists today for availability?   | Per-boat endpoints exist; no fleet-wide endpoint — that becomes R1                                    |
| 0     | Researcher      | What's the conflict-detection ground truth?   | `getOverlappingBookingsWithBuffer` in `server/storage/bookings.ts:81-98` — reuse only, no rewrite     |
| 0     | Researcher      | Is `requiresLicense` modelled in catalog?     | No — encoded in `subtitle`. R2 introduces explicit boolean flag                                       |
| 0     | Simplifier      | Minimum viable scope for the widget?          | Single date + single duration, fleet view, WhatsApp CTA — defer multi-day, capacity filters, embeds   |
| 0     | Boundary Keeper | What is explicitly NOT this phase?            | Online payments, real bookings, modifying existing widgets, multi-day, embeds, admin notifications    |
| 0     | Failure Analyst | What would make a verifier reject this?       | Duplicating conflict logic; off-season handling missing; non-localized WhatsApp text; SEO gaps        |
| 0     | Seed Closer     | What's deferred but should be flagged?        | Embedding the widget across home/landings is the obvious next phase; called out in Boundaries        |
| 1     | User Verifier   | Are ordering, fallback, and card contract specified? | Gaps confirmed → R1 amended (morning/afternoon split), R9 (ordering), R10 (nearby dates fallback), R11 (card visual contract with green WhatsApp CTA) added |
| 1     | User Verifier   | Is the license filter ternary?                | Confirmed: `"all" \| "unlicensed" \| "licensed"` in R6 — no change needed                              |
| 1     | User Verifier   | Are 8 languages in acceptance criteria?       | Confirmed: triple coverage via R5, R7, R8 acceptance lines — no change needed                          |

*Auto-mode: round 0 collapsed because discovery (parallel Explore agents earlier in this conversation) had already surfaced answers across all four dimensions. Round 1 was a user-driven verification pass that surfaced 3 gaps and locked R9, R10, R11 plus the R1 morning/afternoon amendment.*

---

*Phase: 03-availability-widget*
*Spec created: 2026-04-27*
*Spec amended: 2026-04-27 (user verification round)*
*Next step: /gsd-discuss-phase 3 — implementation decisions (endpoint shape details, widget layout, license-toggle UX, season handling, message template wording per language, exact morning/afternoon cutoff edge cases)*
