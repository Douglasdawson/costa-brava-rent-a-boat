CREATE TABLE IF NOT EXISTS "business_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"rating" real NOT NULL,
	"user_rating_count" integer NOT NULL,
	"display_name" text,
	"international_phone_number" text,
	"website_uri" text,
	"weekday_hours" jsonb,
	"recent_reviews" jsonb,
	"raw_payload" jsonb,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sync_source" varchar(30) DEFAULT 'places_api_new' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_stats_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating" real NOT NULL,
	"user_rating_count" integer NOT NULL,
	"delta_rating" real,
	"delta_review_count" integer,
	"is_significant_change" boolean DEFAULT false NOT NULL,
	"raw_payload" jsonb,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "distribution_tray" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"platform" varchar(30) NOT NULL,
	"language" varchar(5) DEFAULT 'es' NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"target_url" text,
	"contact_email" text,
	"metadata" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"published_url" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ga4_conversion_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"event_name" varchar(60) NOT NULL,
	"landing_page" text,
	"source" text,
	"medium" text,
	"event_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ga4_daily_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"landing_page" text,
	"source" text,
	"medium" text,
	"channel_group" varchar(40),
	"country" varchar(3),
	"device_category" varchar(12),
	"sessions" integer DEFAULT 0 NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"new_users" integer DEFAULT 0 NOT NULL,
	"engaged_sessions" integer DEFAULT 0 NOT NULL,
	"engagement_rate" numeric(6, 5),
	"average_session_duration" numeric(10, 2),
	"screen_page_views_per_session" numeric(8, 2),
	"conversions" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gsc_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"query" text NOT NULL,
	"page" text,
	"country" varchar(3),
	"device" varchar(12),
	"clicks" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"ctr" numeric(6, 5),
	"position" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mcp_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" varchar(8) NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"last_used_ip" varchar(64),
	"revoked_at" timestamp with time zone,
	"call_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(40) NOT NULL,
	"account_identifier" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"scopes" jsonb,
	"metadata" jsonb,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_refreshed_at" timestamp with time zone,
	"last_error_at" timestamp with time zone,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partnership_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_name" text NOT NULL,
	"contact_name" text,
	"email" text NOT NULL,
	"phone" text,
	"town" text NOT NULL,
	"website" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"campaign_id" text,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"replied_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seo_autopilot_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_id" integer,
	"tool" varchar(80) NOT NULL,
	"params" jsonb,
	"success" boolean NOT NULL,
	"result_size" integer,
	"duration_ms" integer,
	"error_message" text,
	"ip" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "serp_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword_id" integer NOT NULL,
	"date" date NOT NULL,
	"search_engine" varchar(20) DEFAULT 'google' NOT NULL,
	"location" text,
	"language" varchar(5),
	"position" integer NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"description" text,
	"domain" text,
	"result_type" varchar(30),
	"is_own" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "war_room_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(40) NOT NULL,
	"priority" varchar(10) NOT NULL,
	"estimated_impact" varchar(20),
	"title" text NOT NULL,
	"rationale" text NOT NULL,
	"data" jsonb,
	"recommended_actions" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"snooze_until" timestamp with time zone,
	"approved_by" text,
	"executed_at" timestamp with time zone,
	"execution_result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_cwv_metrics" ADD COLUMN IF NOT EXISTS "device_type" text;--> statement-breakpoint
ALTER TABLE "seo_cwv_metrics" ADD COLUMN IF NOT EXISTS "navigation_type" text;--> statement-breakpoint
ALTER TABLE "seo_cwv_metrics" ADD COLUMN IF NOT EXISTS "connection_type" text;--> statement-breakpoint
ALTER TABLE "seo_keywords" ADD COLUMN IF NOT EXISTS "volume" integer;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seo_autopilot_audit_token_id_mcp_tokens_id_fk'
  ) THEN
    ALTER TABLE "seo_autopilot_audit" ADD CONSTRAINT "seo_autopilot_audit_token_id_mcp_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."mcp_tokens"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_stats_history_synced_idx" ON "business_stats_history" USING btree ("synced_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_stats_history_significant_idx" ON "business_stats_history" USING btree ("is_significant_change");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "distribution_tray_slug_idx" ON "distribution_tray" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "distribution_tray_platform_idx" ON "distribution_tray" USING btree ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "distribution_tray_status_idx" ON "distribution_tray" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "distribution_tray_created_idx" ON "distribution_tray" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ga4_conv_events_date_event_idx" ON "ga4_conversion_events" USING btree ("date","event_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ga4_conv_events_landing_idx" ON "ga4_conversion_events" USING btree ("landing_page");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ga4_conv_events_unique_idx" ON "ga4_conversion_events" USING btree ("date","event_name","landing_page","source","medium");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ga4_daily_date_idx" ON "ga4_daily_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ga4_daily_landing_idx" ON "ga4_daily_metrics" USING btree ("landing_page");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ga4_daily_source_idx" ON "ga4_daily_metrics" USING btree ("source","medium");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ga4_daily_channel_idx" ON "ga4_daily_metrics" USING btree ("channel_group");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ga4_daily_unique_idx" ON "ga4_daily_metrics" USING btree ("date","landing_page","source","medium","country","device_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gsc_queries_date_idx" ON "gsc_queries" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gsc_queries_query_idx" ON "gsc_queries" USING btree ("query");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gsc_queries_page_idx" ON "gsc_queries" USING btree ("page");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gsc_queries_unique_idx" ON "gsc_queries" USING btree ("date","query","page","country","device");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mcp_tokens_hash_idx" ON "mcp_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_tokens_active_idx" ON "mcp_tokens" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_connections_provider_idx" ON "oauth_connections" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_connections_provider_account_idx" ON "oauth_connections" USING btree ("provider","account_identifier");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "partnership_email_idx" ON "partnership_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partnership_town_idx" ON "partnership_contacts" USING btree ("town");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partnership_status_idx" ON "partnership_contacts" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "psi_url_idx" ON "psi_measurements" USING btree ("url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "psi_measured_at_idx" ON "psi_measurements" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "psi_url_strategy_idx" ON "psi_measurements" USING btree ("url","strategy");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_autopilot_audit_token_idx" ON "seo_autopilot_audit" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_autopilot_audit_tool_idx" ON "seo_autopilot_audit" USING btree ("tool");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seo_autopilot_audit_created_idx" ON "seo_autopilot_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serp_snapshots_keyword_date_idx" ON "serp_snapshots" USING btree ("keyword_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serp_snapshots_date_idx" ON "serp_snapshots" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "serp_snapshots_domain_idx" ON "serp_snapshots" USING btree ("domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "war_room_suggestions_status_idx" ON "war_room_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "war_room_suggestions_priority_idx" ON "war_room_suggestions" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "war_room_suggestions_category_idx" ON "war_room_suggestions" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "war_room_suggestions_created_idx" ON "war_room_suggestions" USING btree ("created_at");