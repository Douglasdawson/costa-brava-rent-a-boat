# SEO Pilot Measurements

Automated system for measuring the impact of SEO changes (pilots) at scheduled checkpoints.

## How it works

1. **Define a pilot** in `shared/seoPilots.ts` — add an entry to `PILOTS` with:
   - `key` (stable id), `name`, `scheduledFor` (Date), `queries`, `pathPrefix`, `slugs`, `baseline`, `thresholds`
2. **Deploy** (Replit Publish).
3. **Wait** — the cron `seo-pilots` (in `server/seo/worker.ts`) runs hourly. On or after `scheduledFor`, it:
   - Queries `gsc_queries` for each pilot query (last 30 days).
   - Queries `seo_url_inspections` for URLs matching `pathPrefix` (filtered to `slugs`).
   - Computes a verdict (VERDE / AMBAR / ROJO) using `thresholds` + baseline.
   - Writes a row to `seo_pilot_runs`.
   - Optionally posts to a webhook (`SEO_PILOT_WEBHOOK_URL` env var, Discord/Slack format).
4. **Read results:**
   - Admin endpoint: `GET /api/admin/seo-pilots` (latest 50) or `GET /api/admin/seo-pilots/:pilotKey` (one pilot).
   - Manual trigger for testing: `POST /api/admin/seo-pilots/run-now`.

## Idempotency

Each pilot is identified by `(key, scheduledFor)`. The cron skips any pilot that already has a row for that tuple. To re-measure (e.g. T+42d), add a new entry with the same `key` but a later `scheduledFor`.

## Verdict logic

- **VERDE**: dedicated landing position ≤ `thresholds.greenPositionMax` AND all `slugs` indexed in GSC.
- **ROJO**: dedicated position dropped > 5 vs `baseline.dedicatedPositionPre`.
- **AMBAR**: anything in between.

Tune thresholds per pilot to match the hypothesis.

## Notification (optional)

Set `SEO_PILOT_WEBHOOK_URL` in Replit Secrets to receive a push when a pilot finishes:
- Discord incoming webhook: `https://discord.com/api/webhooks/...`
- Slack incoming webhook: `https://hooks.slack.com/services/...`
- Generic: any HTTP POST endpoint accepting `{content, text}` JSON body.

If unset, results stay in DB only — read via the admin endpoint.

## Files

- `shared/seoPilots.ts` — pilot config + types.
- `server/seo/pilotRunner.ts` — measurement logic.
- `server/seo/worker.ts` — cron registration (`seo-pilots`, hourly).
- `server/routes/admin-seo-pilots.ts` — admin endpoints.
- `shared/schema.ts` → `seoPilotRuns` table.
