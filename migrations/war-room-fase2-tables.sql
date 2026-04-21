-- War Room — Fase 2 schema
-- Crear tablas para GSC, GA4, PSI, SERP, OAuth connections y War Room suggestions.
-- Ejecutar statement by statement en Replit Production Database SQL console.

-- 1) oauth_connections
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

CREATE INDEX IF NOT EXISTS "oauth_connections_provider_idx" ON "oauth_connections" ("provider");
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_connections_provider_account_idx" ON "oauth_connections" ("provider", "account_identifier");

-- 2) gsc_queries
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

CREATE INDEX IF NOT EXISTS "gsc_queries_date_idx" ON "gsc_queries" ("date");
CREATE INDEX IF NOT EXISTS "gsc_queries_query_idx" ON "gsc_queries" ("query");
CREATE INDEX IF NOT EXISTS "gsc_queries_page_idx" ON "gsc_queries" ("page");
CREATE UNIQUE INDEX IF NOT EXISTS "gsc_queries_unique_idx" ON "gsc_queries" ("date", "query", "page", "country", "device");

-- 3) ga4_daily_metrics
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

CREATE INDEX IF NOT EXISTS "ga4_daily_date_idx" ON "ga4_daily_metrics" ("date");
CREATE INDEX IF NOT EXISTS "ga4_daily_landing_idx" ON "ga4_daily_metrics" ("landing_page");
CREATE INDEX IF NOT EXISTS "ga4_daily_source_idx" ON "ga4_daily_metrics" ("source", "medium");
CREATE UNIQUE INDEX IF NOT EXISTS "ga4_daily_unique_idx" ON "ga4_daily_metrics" ("date", "landing_page", "source", "medium", "country", "device_category");

-- 4) psi_measurements
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

CREATE INDEX IF NOT EXISTS "psi_url_idx" ON "psi_measurements" ("url");
CREATE INDEX IF NOT EXISTS "psi_measured_at_idx" ON "psi_measurements" ("measured_at");
CREATE INDEX IF NOT EXISTS "psi_url_strategy_idx" ON "psi_measurements" ("url", "strategy");

-- 5) serp_snapshots
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

CREATE INDEX IF NOT EXISTS "serp_snapshots_keyword_date_idx" ON "serp_snapshots" ("keyword_id", "date");
CREATE INDEX IF NOT EXISTS "serp_snapshots_date_idx" ON "serp_snapshots" ("date");
CREATE INDEX IF NOT EXISTS "serp_snapshots_domain_idx" ON "serp_snapshots" ("domain");

-- 6) war_room_suggestions
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
