-- ============================================================
-- 0007_unblock_analytics.sql
-- ============================================================
-- Unblocks the SEO autopilot analytics tools that have been
-- failing since approx. 2026-04-12 (cron stopped writing).
--
-- Background: at some point between 2026-04-21 (last known good
-- query of seo_keywords with `language` column) and 2026-04-25
-- (queries started failing), prod schema reverted. Mechanism still
-- unconfirmed (Replit Database snapshot restore? deploy-time
-- drizzle-kit push? cross-project DATABASE_URL collision?).
--
-- This migration is fully idempotent and double-defensive:
--   1. CREATE TABLE IF NOT EXISTS — handles the case where the table
--      was dropped entirely.
--   2. ALTER TABLE ADD COLUMN IF NOT EXISTS — handles the case where
--      the table still exists but lost columns.
--
-- It is safe to re-run any number of times. After every run, the
-- schema converges to the shape that shared/schema.ts expects.
--
-- Tables touched:
--   - seo_keywords        (additive ALTER: language)
--   - oauth_connections   (CREATE + ADD COLUMN guards)
--   - gsc_queries         (CREATE + indexes)
--   - ga4_daily_metrics   (CREATE + indexes)
--   - psi_measurements    (CREATE + indexes)
--   - serp_snapshots      (CREATE + indexes)
--   - war_room_suggestions(CREATE + indexes)
--
-- Run via Replit prod DB SQL console:
--   \i migrations/0007_unblock_analytics.sql
-- Or:
--   psql "$DATABASE_URL" -f migrations/0007_unblock_analytics.sql
--
-- Verification: see the SELECT ... LIMIT 1 statements at the bottom.
-- They should all return either an empty result or a sample row,
-- not an error. If any errors, the table still has a problem.
-- ============================================================

BEGIN;

-- ─── 1) seo_keywords: ensure `language` column exists ─────────────
-- (the 0001_sync migration added this; if revert dropped it, restore here)

ALTER TABLE IF EXISTS "seo_keywords"
  ADD COLUMN IF NOT EXISTS "language" varchar(5) NOT NULL DEFAULT 'es';

CREATE UNIQUE INDEX IF NOT EXISTS "seo_keywords_keyword_language_idx"
  ON "seo_keywords" ("keyword", "language");


-- ─── 2) oauth_connections ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "oauth_connections" (
  "id" serial PRIMARY KEY NOT NULL,
  "provider" varchar(40) NOT NULL,
  "account_identifier" text,
  "access_token" text NOT NULL,
  "refresh_token" text,
  "expires_at" timestamp with time zone,
  "scopes" jsonb,
  "metadata" jsonb,
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "last_refreshed_at" timestamp with time zone,
  "last_error_at" timestamp with time zone,
  "last_error_message" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Re-add columns in case table existed with legacy shape
ALTER TABLE "oauth_connections" ADD COLUMN IF NOT EXISTS "scopes" jsonb;
ALTER TABLE "oauth_connections" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE "oauth_connections" ADD COLUMN IF NOT EXISTS "last_refreshed_at" timestamp with time zone;
ALTER TABLE "oauth_connections" ADD COLUMN IF NOT EXISTS "last_error_at" timestamp with time zone;
ALTER TABLE "oauth_connections" ADD COLUMN IF NOT EXISTS "last_error_message" text;

CREATE INDEX IF NOT EXISTS "oauth_connections_provider_idx"
  ON "oauth_connections" ("provider");
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_connections_provider_account_idx"
  ON "oauth_connections" ("provider", "account_identifier");


-- ─── 3) gsc_queries ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "gsc_queries" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" date NOT NULL,
  "query" text NOT NULL,
  "page" text,
  "country" varchar(3),
  "device" varchar(12),
  "clicks" integer NOT NULL DEFAULT 0,
  "impressions" integer NOT NULL DEFAULT 0,
  "ctr" decimal(6,5),
  "position" decimal(6,2),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "gsc_queries" ADD COLUMN IF NOT EXISTS "country" varchar(3);
ALTER TABLE "gsc_queries" ADD COLUMN IF NOT EXISTS "device" varchar(12);

CREATE INDEX IF NOT EXISTS "gsc_queries_date_idx" ON "gsc_queries" ("date");
CREATE INDEX IF NOT EXISTS "gsc_queries_query_idx" ON "gsc_queries" ("query");
CREATE INDEX IF NOT EXISTS "gsc_queries_page_idx" ON "gsc_queries" ("page");
CREATE UNIQUE INDEX IF NOT EXISTS "gsc_queries_unique_idx"
  ON "gsc_queries" ("date", "query", "page", "country", "device");


-- ─── 4) ga4_daily_metrics ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ga4_daily_metrics" (
  "id" serial PRIMARY KEY NOT NULL,
  "date" date NOT NULL,
  "landing_page" text,
  "source" text,
  "medium" text,
  "country" varchar(3),
  "device_category" varchar(12),
  "sessions" integer NOT NULL DEFAULT 0,
  "total_users" integer NOT NULL DEFAULT 0,
  "new_users" integer NOT NULL DEFAULT 0,
  "engaged_sessions" integer NOT NULL DEFAULT 0,
  "engagement_rate" decimal(6,5),
  "average_session_duration" decimal(10,2),
  "screen_page_views_per_session" decimal(8,2),
  "conversions" integer NOT NULL DEFAULT 0,
  "total_revenue" decimal(12,2),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "ga4_daily_metrics" ADD COLUMN IF NOT EXISTS "country" varchar(3);
ALTER TABLE "ga4_daily_metrics" ADD COLUMN IF NOT EXISTS "device_category" varchar(12);
ALTER TABLE "ga4_daily_metrics" ADD COLUMN IF NOT EXISTS "engagement_rate" decimal(6,5);
ALTER TABLE "ga4_daily_metrics" ADD COLUMN IF NOT EXISTS "average_session_duration" decimal(10,2);
ALTER TABLE "ga4_daily_metrics" ADD COLUMN IF NOT EXISTS "screen_page_views_per_session" decimal(8,2);
ALTER TABLE "ga4_daily_metrics" ADD COLUMN IF NOT EXISTS "conversions" integer NOT NULL DEFAULT 0;
ALTER TABLE "ga4_daily_metrics" ADD COLUMN IF NOT EXISTS "total_revenue" decimal(12,2);

CREATE INDEX IF NOT EXISTS "ga4_daily_date_idx" ON "ga4_daily_metrics" ("date");
CREATE INDEX IF NOT EXISTS "ga4_daily_landing_idx" ON "ga4_daily_metrics" ("landing_page");
CREATE INDEX IF NOT EXISTS "ga4_daily_source_idx" ON "ga4_daily_metrics" ("source", "medium");
CREATE UNIQUE INDEX IF NOT EXISTS "ga4_daily_unique_idx"
  ON "ga4_daily_metrics" ("date", "landing_page", "source", "medium", "country", "device_category");


-- ─── 5) psi_measurements ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "psi_measurements" (
  "id" serial PRIMARY KEY NOT NULL,
  "url" text NOT NULL,
  "strategy" varchar(10) NOT NULL,
  "performance_score" integer,
  "accessibility_score" integer,
  "best_practices_score" integer,
  "seo_score" integer,
  "lcp_ms" integer,
  "cls_score" real,
  "inp_ms" integer,
  "ttfb_ms" integer,
  "fcp_ms" integer,
  "lab_lcp_ms" integer,
  "lab_cls_score" real,
  "lab_tbt_ms" integer,
  "lab_fcp_ms" integer,
  "lab_si_ms" integer,
  "audits" jsonb,
  "measured_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "performance_score" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "accessibility_score" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "best_practices_score" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "seo_score" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "lcp_ms" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "cls_score" real;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "inp_ms" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "ttfb_ms" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "fcp_ms" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "lab_lcp_ms" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "lab_cls_score" real;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "lab_tbt_ms" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "lab_fcp_ms" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "lab_si_ms" integer;
ALTER TABLE "psi_measurements" ADD COLUMN IF NOT EXISTS "audits" jsonb;

CREATE INDEX IF NOT EXISTS "psi_url_idx" ON "psi_measurements" ("url");
CREATE INDEX IF NOT EXISTS "psi_measured_at_idx" ON "psi_measurements" ("measured_at");
CREATE INDEX IF NOT EXISTS "psi_url_strategy_idx" ON "psi_measurements" ("url", "strategy");


-- ─── 6) serp_snapshots ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "serp_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "keyword_id" integer NOT NULL,
  "date" date NOT NULL,
  "search_engine" varchar(20) NOT NULL DEFAULT 'google',
  "location" text,
  "language" varchar(5),
  "position" integer NOT NULL,
  "url" text NOT NULL,
  "title" text,
  "description" text,
  "domain" text,
  "result_type" varchar(30),
  "is_own" boolean NOT NULL DEFAULT false,
  "metadata" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "serp_snapshots" ADD COLUMN IF NOT EXISTS "search_engine" varchar(20) NOT NULL DEFAULT 'google';
ALTER TABLE "serp_snapshots" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "serp_snapshots" ADD COLUMN IF NOT EXISTS "language" varchar(5);
ALTER TABLE "serp_snapshots" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "serp_snapshots" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "serp_snapshots" ADD COLUMN IF NOT EXISTS "domain" text;
ALTER TABLE "serp_snapshots" ADD COLUMN IF NOT EXISTS "result_type" varchar(30);
ALTER TABLE "serp_snapshots" ADD COLUMN IF NOT EXISTS "is_own" boolean NOT NULL DEFAULT false;
ALTER TABLE "serp_snapshots" ADD COLUMN IF NOT EXISTS "metadata" jsonb;

CREATE INDEX IF NOT EXISTS "serp_snapshots_keyword_date_idx"
  ON "serp_snapshots" ("keyword_id", "date");
CREATE INDEX IF NOT EXISTS "serp_snapshots_date_idx" ON "serp_snapshots" ("date");
CREATE INDEX IF NOT EXISTS "serp_snapshots_domain_idx" ON "serp_snapshots" ("domain");


-- ─── 7) war_room_suggestions ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "war_room_suggestions" (
  "id" serial PRIMARY KEY NOT NULL,
  "category" varchar(40) NOT NULL,
  "priority" varchar(10) NOT NULL,
  "estimated_impact" varchar(20),
  "title" text NOT NULL,
  "rationale" text NOT NULL,
  "data" jsonb,
  "recommended_actions" jsonb,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "snooze_until" timestamp with time zone,
  "approved_by" text,
  "executed_at" timestamp with time zone,
  "execution_result" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "war_room_suggestions_status_idx" ON "war_room_suggestions" ("status");
CREATE INDEX IF NOT EXISTS "war_room_suggestions_priority_idx" ON "war_room_suggestions" ("priority");
CREATE INDEX IF NOT EXISTS "war_room_suggestions_category_idx" ON "war_room_suggestions" ("category");
CREATE INDEX IF NOT EXISTS "war_room_suggestions_created_idx" ON "war_room_suggestions" ("created_at");


-- ─── Verification block — should all succeed without error ────────

DO $$
DECLARE
  rec record;
  tbl text;
  tables text[] := ARRAY['seo_keywords', 'oauth_connections', 'gsc_queries',
    'ga4_daily_metrics', 'psi_measurements', 'serp_snapshots', 'war_room_suggestions'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('SELECT 1 FROM %I LIMIT 1', tbl);
    RAISE NOTICE 'OK: % is queryable', tbl;
  END LOOP;
END $$;

COMMIT;

-- ─── Done. Re-run autopilot tools to confirm. ─────────────────────
