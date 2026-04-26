# Operational Notes

Living document of non-obvious operational facts about this project.
These are things you would only learn by stumbling into them — captured
here so the next person (or LLM) does not waste cycles re-discovering.

Last updated: 2026-04-26.

---

## Deploy mechanism — manual via Replit Publish

Deploys to production at `https://www.costabravarentaboat.com` are
**manual**. They are NOT triggered by `git push origin main`.

- Pushing to `main` runs GitHub Actions CI (`.github/workflows/ci.yml`)
  but does not deploy.
- Production deploy = pulse **Publish** / **Deploy** in the Replit UI.
  Replit auto-creates a `Published your App` commit each time, with the
  parent SHA being the live revision.
- `.replit` config has `[deployment]` block with explicit
  `build = ["npm", "run", "build"]` and `run = ["npm", "run", "start"]`.
  No webhook between GitHub and Replit.

**When to remember this:** every time someone pushes a user-facing fix
to `main` and asks "is this live?" — the answer is NO until they pulse
Publish. To verify what is currently live, look at the latest
`Published your App` commit's parent SHA.

---

## DB invariant — `no_overlapping_bookings` EXCLUDE constraint

The `bookings` table has a Postgres EXCLUDE gist constraint that is
**not visible in `shared/schema.ts` Drizzle definitions**. It lives only
in raw migrations and the live DB.

```sql
EXCLUDE USING gist (
  boat_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
)
WHERE (booking_status IN ('hold', 'pending_payment', 'confirmed'))
```

Sources: `migrations/0001_add_overlap_prevention.sql` and
`migrations/0003_unify_bookings_and_holds.sql`.

It enforces TWO invariants simultaneously:

1. No overlapping active bookings on the same boat (the gist exclusion).
2. `start_time <= end_time` — because `tstzrange` itself rejects
   inverted ranges with `range lower bound must be less than or equal
   to range upper bound`.

**When admin actions hit `500` with that range error or
`no_overlapping_bookings`**, this constraint is the cause — not Zod.

**To save `end < start` temporarily** (e.g., to repair corrupt data),
set `bookingStatus` to `draft`/`cancelled`/`completed` in the same
PATCH. The constraint's WHERE clause excludes those statuses, so the
row bypasses the check.

**Discovery query:**

```bash
psql "$DATABASE_URL" -c \
  "SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint WHERE conrelid = 'bookings'::regclass;"
```

---

## CI known failures (preexisting, do not chase)

The GitHub Actions CI on this repo fails consistently. As of 2026-04-26,
the failures predate any work-in-progress and are NOT regressions:

- `server/routes/auth.test.ts`,
  `server/routes/bookings.test.ts`,
  `server/lib/discountValidation.test.ts` — `0 tests` load because
  `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PIN` are not set in GitHub
  Actions secrets and `validateEnv` aborts on import.
- `server/routes/availability.test.ts:119` — assertion failure:
  expected slot list to include `'10:00'`.
- `server/routes/health.test.ts:36, 47, 64` — 3 failures
  (`services.database` undefined, `services.sendgrid` undefined).

**When CI shows red after pushing**, first verify whether the failures
match the list above. If yes, the push is fine — proceed to Replit
Publish. Don't waste cycles debugging these unless you are explicitly
fixing CI infra (a separate PR that needs configuring repo secrets and
auditing the broken assertions).

Verified preexisting via `git stash` + running CI tests on a clean
`main` — same failures appear.
