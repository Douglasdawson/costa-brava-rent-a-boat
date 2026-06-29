-- Idempotent re-add of the marketing attribution columns on whatsapp_inquiries.
--
-- These four columns (utm_source / utm_medium / utm_campaign / fbclid) were
-- originally added with `drizzle-kit push` (db:push style), so they never made
-- it into a journaled migration. The drizzle meta journal only knows up to
-- 0001, so Replit's Publish DB step keeps diffing a stale schema against the
-- live DB and proposing to DROP these columns -- and a Republish occasionally
-- wipes them outright (same root cause as 0008/0009/0010 and the applyXEnsure
-- runners). Without this guard the lead -> booking attribution capture in
-- server/routes/* silently breaks after a redeploy until a manual ALTER.
--
-- Re-applied on every boot by server/migrations/applyAttributionColumnsEnsure.ts.
-- Fully idempotent (ADD COLUMN IF NOT EXISTS), safe to run any number of times.
-- NOTE: this restores the column STRUCTURE if dropped; the per-row values for
-- existing rows cannot be recovered, so the destructive Publish prompt must
-- still be declined to preserve the data.
ALTER TABLE "whatsapp_inquiries" ADD COLUMN IF NOT EXISTS "utm_source" text;
ALTER TABLE "whatsapp_inquiries" ADD COLUMN IF NOT EXISTS "utm_medium" text;
ALTER TABLE "whatsapp_inquiries" ADD COLUMN IF NOT EXISTS "utm_campaign" text;
ALTER TABLE "whatsapp_inquiries" ADD COLUMN IF NOT EXISTS "fbclid" text;
