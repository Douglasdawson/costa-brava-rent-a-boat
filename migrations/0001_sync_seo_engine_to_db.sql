-- ============================================================
-- 0001_sync_seo_engine_to_db.sql
-- ============================================================
-- Sync prod Neon DB to shared/schema.ts for the SEO Engine tables.
--
-- Context: shared/schema.ts was refactored in 40a69e6 ("add 17 SEO
-- knowledge base tables") but `npm run db:push` was never executed.
-- After that, fa9f50e registered the admin-seo routes which now 500
-- because Drizzle queries reference columns that don't exist in DB.
-- All writers (server/seo/**) already use the new field names, so
-- they've been silently failing for ~40 days (alerts/reports/exp/...
-- tables remain empty despite cron jobs running).
--
-- Strategy:
--   Section A: tables with data → additive ALTER only (no data loss)
--   Section B: tables empty → DROP + CREATE per schema.ts (clean slate)
--   Section C: missing indexes
--
-- All operations wrapped in a transaction. Idempotent guards where
-- safe; intentionally not for DROP TABLE (rely on the empty-table
-- precondition verified by F0.1 inventory).
--
-- Pre-flight verified (2026-04-24):
--   seo_keywords      175 rows (kept, ADD language)
--   seo_rankings      512 rows (untouched, already aligned)
--   seo_competitors     5 rows (untouched, already aligned)
--   seo_redirects     141 rows (untouched, already aligned)
--   seo_cwv_metrics  2411 rows (untouched, already aligned)
--   seo_autopilot_audit 43 rows (untouched, already aligned)
--   seo_alerts          0 rows (DROP+CREATE)
--   seo_reports         0 rows (DROP+CREATE)
--   seo_experiments     0 rows (DROP+CREATE)
--   seo_learnings       0 rows (DROP+CREATE)
--   seo_conversions     0 rows (DROP+CREATE)
--   seo_geo             0 rows (DROP+CREATE)
--   seo_health_checks   0 rows (DROP+CREATE)
--   seo_engine_runs     0 rows (DROP+CREATE)
--   seo_meta            0 rows (DROP+CREATE)
--   seo_faqs            0 rows (DROP+CREATE)
--   seo_links           0 rows (DROP+CREATE)
--   seo_pages           0 rows (DROP+CREATE → adds UNIQUE on path)
-- ============================================================

BEGIN;

-- ─── Section A — Additive on populated tables ──────────────

-- seo_keywords: add language varchar(5) NOT NULL DEFAULT 'es'
-- (175 existing rows get 'es', which is the canonical language)
ALTER TABLE "seo_keywords"
  ADD COLUMN IF NOT EXISTS "language" varchar(5) NOT NULL DEFAULT 'es';

-- Add the unique index that schema.ts defines (was missing in DB)
CREATE UNIQUE INDEX IF NOT EXISTS "seo_keywords_keyword_language_idx"
  ON "seo_keywords" ("keyword", "language");

-- ─── Section B — DROP+CREATE empty tables ──────────────────

-- seo_alerts: schema diverged (DB had `resolved bool`; new schema has
-- title/status/sent_via/resolved_at). Table is empty.
DROP TABLE IF EXISTS "seo_alerts" CASCADE;
CREATE TABLE "seo_alerts" (
  "id" serial PRIMARY KEY NOT NULL,
  "type" text NOT NULL,
  "severity" text NOT NULL,
  "title" text NOT NULL,
  "message" text,
  "data" jsonb,
  "status" text,
  "sent_via" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "resolved_at" timestamp with time zone
);
CREATE INDEX "seo_alerts_type_idx" ON "seo_alerts" ("type");
CREATE INDEX "seo_alerts_severity_idx" ON "seo_alerts" ("severity");
CREATE INDEX "seo_alerts_status_idx" ON "seo_alerts" ("status");

-- seo_reports: DB had period/insights; new has period_start/period_end/
-- summary/sent_via.
DROP TABLE IF EXISTS "seo_reports" CASCADE;
CREATE TABLE "seo_reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "type" text NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "summary" text,
  "data" jsonb,
  "sent_via" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "seo_reports_type_idx" ON "seo_reports" ("type");
CREATE INDEX "seo_reports_period_idx" ON "seo_reports" ("period_start","period_end");

-- seo_experiments: DB had variant_a/variant_b/metric/winner/lift/etc;
-- new has action/previous_value/new_value/baseline_metrics/etc.
DROP TABLE IF EXISTS "seo_experiments" CASCADE;
CREATE TABLE "seo_experiments" (
  "id" serial PRIMARY KEY NOT NULL,
  "campaign_id" integer,
  "type" text,
  "page" text,
  "hypothesis" text,
  "action" text,
  "previous_value" text,
  "new_value" text,
  "status" text,
  "executed_at" timestamp with time zone,
  "measure_at" timestamp with time zone,
  "baseline_metrics" jsonb,
  "result_metrics" jsonb,
  "learning" text,
  "agent_reasoning" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "seo_experiments_campaign_id_idx" ON "seo_experiments" ("campaign_id");
CREATE INDEX "seo_experiments_status_idx" ON "seo_experiments" ("status");

-- seo_learnings: DB had type/insight/evidence/action/impact/status;
-- new has experiment_id/category/insight/confidence/applicable_to.
DROP TABLE IF EXISTS "seo_learnings" CASCADE;
CREATE TABLE "seo_learnings" (
  "id" serial PRIMARY KEY NOT NULL,
  "experiment_id" integer,
  "category" text,
  "insight" text NOT NULL,
  "confidence" decimal(3, 2),
  "applicable_to" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "seo_learnings_experiment_id_idx" ON "seo_learnings" ("experiment_id");
CREATE INDEX "seo_learnings_category_idx" ON "seo_learnings" ("category");

-- seo_conversions: DB had source/medium/campaign/sessions/bookings;
-- new has booking_id/session_id (different attribution model).
DROP TABLE IF EXISTS "seo_conversions" CASCADE;
CREATE TABLE "seo_conversions" (
  "id" serial PRIMARY KEY NOT NULL,
  "keyword_id" integer,
  "page" text,
  "booking_id" integer,
  "revenue" decimal(10, 2),
  "date" date,
  "session_id" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "seo_conversions_keyword_id_idx" ON "seo_conversions" ("keyword_id");
CREATE INDEX "seo_conversions_date_idx" ON "seo_conversions" ("date");

-- seo_geo: DB had location/keyword_id/impressions/clicks (legacy GMB-style);
-- new has query/engine/cited/mentioned_without_link/cited_url/competitors_cited
-- (Generative Engine Optimization tracking).
DROP TABLE IF EXISTS "seo_geo" CASCADE;
CREATE TABLE "seo_geo" (
  "id" serial PRIMARY KEY NOT NULL,
  "query" text NOT NULL,
  "engine" text NOT NULL,
  "date" date NOT NULL,
  "cited" boolean NOT NULL DEFAULT false,
  "mentioned_without_link" boolean NOT NULL DEFAULT false,
  "cited_url" text,
  "position" integer,
  "competitors_cited" jsonb,
  "analysis" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "seo_geo_query_engine_date_idx" ON "seo_geo" ("query","engine","date");

-- seo_health_checks: DB had check_type/score; new uses url-centric model.
DROP TABLE IF EXISTS "seo_health_checks" CASCADE;
CREATE TABLE "seo_health_checks" (
  "id" serial PRIMARY KEY NOT NULL,
  "url" text NOT NULL,
  "status" integer,
  "load_time_ms" integer,
  "has_meta_title" boolean NOT NULL DEFAULT false,
  "has_meta_description" boolean NOT NULL DEFAULT false,
  "has_canonical" boolean NOT NULL DEFAULT false,
  "has_hreflang" boolean NOT NULL DEFAULT false,
  "has_schema_org" boolean NOT NULL DEFAULT false,
  "issues" jsonb,
  "checked_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "seo_health_checks_url_idx" ON "seo_health_checks" ("url");
CREATE INDEX "seo_health_checks_checked_at_idx" ON "seo_health_checks" ("checked_at");

-- seo_engine_runs: DB had run_type/triggered_by/results/completed_at;
-- new has job_name/finished_at + simpler shape.
DROP TABLE IF EXISTS "seo_engine_runs" CASCADE;
CREATE TABLE "seo_engine_runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "job_name" text NOT NULL,
  "started_at" timestamp with time zone NOT NULL,
  "finished_at" timestamp with time zone,
  "status" text NOT NULL DEFAULT 'running',
  "error" text,
  "duration_ms" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "seo_engine_runs_job_idx" ON "seo_engine_runs" ("job_name");
CREATE INDEX "seo_engine_runs_status_idx" ON "seo_engine_runs" ("status");

-- seo_meta: DB had simple key/value; new is per-page/per-language meta tags.
DROP TABLE IF EXISTS "seo_meta" CASCADE;
CREATE TABLE "seo_meta" (
  "id" serial PRIMARY KEY NOT NULL,
  "page" text NOT NULL,
  "language" varchar(5) NOT NULL,
  "title" text,
  "description" text,
  "keywords" text,
  "updated_by" text,
  "updated_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "seo_meta_page_language_idx" ON "seo_meta" ("page","language");

-- seo_faqs: DB had cluster + nullable page; new has language + sort_order.
DROP TABLE IF EXISTS "seo_faqs" CASCADE;
CREATE TABLE "seo_faqs" (
  "id" serial PRIMARY KEY NOT NULL,
  "page" text NOT NULL,
  "language" varchar(5) NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "sort_order" integer,
  "active" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "seo_faqs_page_language_idx" ON "seo_faqs" ("page","language");

-- seo_links: DB had source_path/target_path/anchor_text/type;
-- new uses from_page/to_page + context + auto_generated.
DROP TABLE IF EXISTS "seo_links" CASCADE;
CREATE TABLE "seo_links" (
  "id" serial PRIMARY KEY NOT NULL,
  "from_page" text NOT NULL,
  "to_page" text NOT NULL,
  "anchor_text" text NOT NULL,
  "context" text,
  "auto_generated" boolean NOT NULL DEFAULT false,
  "active" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "seo_links_from_to_anchor_idx" ON "seo_links" ("from_page","to_page","anchor_text");
CREATE INDEX "seo_links_from_page_idx" ON "seo_links" ("from_page");
CREATE INDEX "seo_links_to_page_idx" ON "seo_links" ("to_page");

-- seo_pages: DB lacked UNIQUE on path. Recreate to add the constraint.
DROP TABLE IF EXISTS "seo_pages" CASCADE;
CREATE TABLE "seo_pages" (
  "id" serial PRIMARY KEY NOT NULL,
  "path" text NOT NULL UNIQUE,
  "title" text,
  "description" text,
  "word_count" integer,
  "last_crawled" timestamp with time zone,
  "last_modified" timestamp with time zone,
  "status" integer,
  "load_time_ms" integer,
  "has_schema_org" boolean NOT NULL DEFAULT false,
  "schema_types" text,
  "internal_links_in" integer,
  "internal_links_out" integer,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "seo_pages_path_idx" ON "seo_pages" ("path");

COMMIT;
