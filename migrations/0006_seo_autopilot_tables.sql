-- SEO Autopilot tables: MCP tokens, distribution tray, audit log.
-- Applied manually on 2026-04-20 via psql before this file existed.
-- Uses IF NOT EXISTS to be idempotent across Replit deploys.

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

DO $$ BEGIN
	ALTER TABLE "seo_autopilot_audit"
		ADD CONSTRAINT "seo_autopilot_audit_token_id_mcp_tokens_id_fk"
		FOREIGN KEY ("token_id") REFERENCES "public"."mcp_tokens"("id")
		ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "distribution_tray_slug_idx" ON "distribution_tray" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "distribution_tray_platform_idx" ON "distribution_tray" USING btree ("platform");
CREATE INDEX IF NOT EXISTS "distribution_tray_status_idx" ON "distribution_tray" USING btree ("status");
CREATE INDEX IF NOT EXISTS "distribution_tray_created_idx" ON "distribution_tray" USING btree ("created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "mcp_tokens_hash_idx" ON "mcp_tokens" USING btree ("token_hash");
CREATE INDEX IF NOT EXISTS "mcp_tokens_active_idx" ON "mcp_tokens" USING btree ("revoked_at");

CREATE INDEX IF NOT EXISTS "seo_autopilot_audit_token_idx" ON "seo_autopilot_audit" USING btree ("token_id");
CREATE INDEX IF NOT EXISTS "seo_autopilot_audit_tool_idx" ON "seo_autopilot_audit" USING btree ("tool");
CREATE INDEX IF NOT EXISTS "seo_autopilot_audit_created_idx" ON "seo_autopilot_audit" USING btree ("created_at");
