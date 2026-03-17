CREATE TABLE "admin_sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'employee' NOT NULL,
	"display_name" text,
	"pin" text,
	"allowed_tabs" json DEFAULT '[]'::json,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "ai_chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"session_id" varchar NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"detected_intent" varchar(50),
	"detected_boat_id" varchar(50),
	"sentiment" varchar(20),
	"tokens_used" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"phone_number" varchar(20) NOT NULL,
	"language" varchar(5) DEFAULT 'es' NOT NULL,
	"profile_name" varchar(100),
	"total_messages" integer DEFAULT 0 NOT NULL,
	"intent_score" integer DEFAULT 0 NOT NULL,
	"is_lead" boolean DEFAULT false NOT NULL,
	"lead_quality" varchar(20),
	"topics_discussed" text[],
	"boats_viewed" text[],
	"first_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"source" text NOT NULL,
	"metric_type" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_snapshot_unique" UNIQUE("date","source","metric_type")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"username" varchar,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" varchar,
	"details" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_autopilot_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"cron_schedule" varchar(50) DEFAULT '0 9 * * 1,3,5' NOT NULL,
	"model" varchar(100) DEFAULT 'claude-sonnet-4-6' NOT NULL,
	"languages" text[] DEFAULT ARRAY['es','en','fr','de','it','nl','ru','ca'] NOT NULL,
	"max_posts_per_week" integer DEFAULT 3 NOT NULL,
	"season_start_month" integer DEFAULT 2 NOT NULL,
	"season_end_month" integer DEFAULT 9 NOT NULL,
	"publish_delay_hours" integer DEFAULT 24 NOT NULL,
	"min_seo_score" integer DEFAULT 90 NOT NULL,
	"refresh_ratio" integer DEFAULT 4 NOT NULL,
	"unsplash_enabled" boolean DEFAULT true NOT NULL,
	"use_whatsapp_topics" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_autopilot_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar,
	"type" varchar(20) DEFAULT 'new' NOT NULL,
	"topic_chosen" text,
	"cluster_name" varchar(255),
	"keywords_used" text[],
	"model_used" varchar(100),
	"tokens_input" integer,
	"tokens_output" integer,
	"seo_score" integer,
	"status" varchar(20) DEFAULT 'success' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_autopilot_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cluster_id" varchar,
	"topic" text NOT NULL,
	"keywords" text[],
	"type" varchar(20) DEFAULT 'satellite' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"post_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_clusters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"pillar_post_id" varchar,
	"keywords" text[],
	"planned_topics" jsonb,
	"completed_count" integer DEFAULT 0 NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"author" varchar(255) DEFAULT 'Costa Brava Rent a Boat' NOT NULL,
	"featured_image" text,
	"meta_description" varchar(160),
	"tags" text[],
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title_by_lang" jsonb,
	"content_by_lang" jsonb,
	"excerpt_by_lang" jsonb,
	"meta_desc_by_lang" jsonb,
	"featured_image_alt_by_lang" jsonb,
	"cluster_id" varchar,
	"is_auto_generated" boolean DEFAULT false NOT NULL,
	"seo_score" integer,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "boat_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"boat_id" varchar NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"file_url" text,
	"expiry_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boats" (
	"id" varchar PRIMARY KEY NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"requires_license" boolean NOT NULL,
	"price_per_hour" numeric(10, 2),
	"deposit" numeric(10, 2) NOT NULL,
	"display_order" integer DEFAULT 999,
	"image_url" text,
	"image_gallery" text[],
	"image_gallery_tablet" text[],
	"image_gallery_mobile" text[],
	"subtitle" text,
	"description" text,
	"specifications" json,
	"equipment" text[],
	"included" text[],
	"features" text[],
	"pricing" json,
	"extras" json,
	"license_type" text DEFAULT 'none',
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_extras" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"booking_id" varchar NOT NULL,
	"extra_name" text NOT NULL,
	"extra_price" numeric(10, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"customer_id" varchar,
	"boat_id" varchar NOT NULL,
	"booking_date" timestamp with time zone NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"customer_name" text NOT NULL,
	"customer_surname" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"customer_nationality" text NOT NULL,
	"number_of_people" integer NOT NULL,
	"total_hours" integer NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"extras_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"deposit" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"stripe_payment_intent_id" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"booking_status" text DEFAULT 'draft' NOT NULL,
	"source" text DEFAULT 'web' NOT NULL,
	"coupon_code" text,
	"refund_status" text,
	"refund_amount" numeric(10, 2),
	"session_id" text,
	"expires_at" timestamp with time zone,
	"whatsapp_confirmation_sent" boolean DEFAULT false NOT NULL,
	"whatsapp_reminder_sent" boolean DEFAULT false NOT NULL,
	"email_reminder_sent" boolean DEFAULT false NOT NULL,
	"email_thank_you_sent" boolean DEFAULT false NOT NULL,
	"whatsapp_thank_you_sent" boolean DEFAULT false NOT NULL,
	"review_request_sent" boolean DEFAULT false NOT NULL,
	"referral_code_sent" boolean DEFAULT false NOT NULL,
	"early_bird_offer_sent" boolean DEFAULT false NOT NULL,
	"recovery_email_sent" boolean DEFAULT false NOT NULL,
	"notes" text,
	"cancelation_token" text,
	"language" text DEFAULT 'es',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_cancelation_token_unique" UNIQUE("cancelation_token")
);
--> statement-breakpoint
CREATE TABLE "chatbot_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"phone_number" varchar(20) NOT NULL,
	"current_state" varchar(50) DEFAULT 'welcome' NOT NULL,
	"language" varchar(5) DEFAULT 'es' NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb,
	"selected_boat_id" varchar(50),
	"selected_date" timestamp with time zone,
	"selected_start_time" varchar(10),
	"selected_duration" varchar(10),
	"selected_extras" text[],
	"customer_name" varchar(100),
	"customer_email" varchar(100),
	"number_of_people" integer,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"messages_count" integer DEFAULT 0 NOT NULL,
	"created_booking_id" varchar
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"booking_id" varchar NOT NULL,
	"boat_id" varchar NOT NULL,
	"type" text NOT NULL,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"performed_by" text,
	"fuel_level" text NOT NULL,
	"condition" text NOT NULL,
	"engine_hours" numeric(10, 1),
	"notes" text,
	"photos" text[],
	"signature_url" text,
	"checklist" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_photos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"image_url" text NOT NULL,
	"caption" text,
	"customer_name" varchar(255) NOT NULL,
	"boat_name" varchar(255),
	"boat_id" varchar,
	"trip_date" timestamp with time zone,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "company_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"logo" text,
	"primary_color" varchar(7) DEFAULT '#2B3E50',
	"secondary_color" varchar(7) DEFAULT '#A8C4DD',
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"surname" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"nationality" text,
	"document_id" text,
	"notes" text,
	"segment" text DEFAULT 'new' NOT NULL,
	"tags" text[],
	"total_bookings" integer DEFAULT 0 NOT NULL,
	"total_spent" numeric(10, 2) DEFAULT '0' NOT NULL,
	"first_booking_date" timestamp with time zone,
	"last_booking_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customer_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"user_id" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone_prefix" varchar NOT NULL,
	"phone_number" varchar NOT NULL,
	"nationality" varchar NOT NULL,
	"document_type" varchar NOT NULL,
	"document_number" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"coordinates" json,
	"featured_image" text,
	"image_gallery" text[],
	"meta_description" varchar(160),
	"nearby_attractions" text[],
	"distance_from_port" varchar(100),
	"recommended_boats" text[],
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destinations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"code" varchar(30) NOT NULL,
	"discount_percent" integer NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"customer_email" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "experiment_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"variant" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exp_assign_unique" UNIQUE("experiment_id","session_id")
);
--> statement-breakpoint
CREATE TABLE "experiment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"variant" text NOT NULL,
	"event_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"variants" jsonb NOT NULL,
	"target_pages" text[],
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "experiments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"rollout_percent" integer DEFAULT 100 NOT NULL,
	"conditions" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_tenant_name" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE "gift_cards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"code" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"remaining_amount" numeric(10, 2) NOT NULL,
	"purchaser_name" text NOT NULL,
	"purchaser_email" text NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_email" text NOT NULL,
	"personal_message" text,
	"stripe_payment_intent_id" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"used_booking_id" varchar,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_cards_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "global_feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"rollout_percent" integer DEFAULT 0 NOT NULL,
	"allowed_plans" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_feature_flags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"total_stock" integer DEFAULT 0 NOT NULL,
	"available_stock" integer DEFAULT 0 NOT NULL,
	"price_per_unit" numeric(10, 2),
	"status" text DEFAULT 'available' NOT NULL,
	"min_stock_alert" integer DEFAULT 1 NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"item_id" varchar NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text,
	"booking_id" varchar,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"language" varchar(5) DEFAULT 'es' NOT NULL,
	"embedding" json,
	"keywords" text[],
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_nurturing_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"session_id" varchar NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"action" varchar(30) NOT NULL,
	"discount_code" varchar(30),
	"message_sent" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"boat_id" varchar NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"cost" numeric(10, 2),
	"date" timestamp with time zone NOT NULL,
	"next_due_date" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar,
	"customer_id" varchar,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"plan" text DEFAULT 'annual' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"stripe_subscription_id" text,
	"discount_percent" integer DEFAULT 15 NOT NULL,
	"free_hours_remaining" numeric(4, 1) DEFAULT '1' NOT NULL,
	"priority_booking" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"language" text DEFAULT 'es',
	"source" text DEFAULT 'footer',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "page_visits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"page_path" text NOT NULL,
	"user_agent" text,
	"device_type" text,
	"browser_name" text,
	"os_name" text,
	"language" text,
	"country" text,
	"city" text,
	"referrer" text,
	"session_id" text,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "seo_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"data" jsonb,
	"status" text,
	"sent_via" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "seo_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"objective" text,
	"cluster" text,
	"status" text,
	"start_date" date,
	"end_date" date,
	"weekly_action_budget" integer,
	"progress" jsonb,
	"results" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_competitor_rankings" (
	"id" serial PRIMARY KEY NOT NULL,
	"competitor_id" integer NOT NULL,
	"keyword_id" integer NOT NULL,
	"date" date NOT NULL,
	"position" numeric(5, 2),
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_competitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"name" text,
	"type" text,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_competitors_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "seo_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword_id" integer,
	"page" text,
	"booking_id" integer,
	"revenue" numeric(10, 2),
	"date" date,
	"session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_cwv_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"metric_name" text NOT NULL,
	"value" real NOT NULL,
	"rating" text,
	"sample_size" integer DEFAULT 1 NOT NULL,
	"p75" real,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_engine_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"error" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"language" varchar(5) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_geo" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"engine" text NOT NULL,
	"date" date NOT NULL,
	"cited" boolean DEFAULT false NOT NULL,
	"mentioned_without_link" boolean DEFAULT false NOT NULL,
	"cited_url" text,
	"position" integer,
	"competitors_cited" jsonb,
	"analysis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_health_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"status" integer,
	"load_time_ms" integer,
	"has_meta_title" boolean DEFAULT false NOT NULL,
	"has_meta_description" boolean DEFAULT false NOT NULL,
	"has_canonical" boolean DEFAULT false NOT NULL,
	"has_hreflang" boolean DEFAULT false NOT NULL,
	"has_schema_org" boolean DEFAULT false NOT NULL,
	"issues" jsonb,
	"checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"language" varchar(5) NOT NULL,
	"intent" text,
	"cluster" text,
	"tracked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_learnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"experiment_id" integer,
	"category" text,
	"insight" text NOT NULL,
	"confidence" numeric(3, 2),
	"applicable_to" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_page" text NOT NULL,
	"to_page" text NOT NULL,
	"anchor_text" text NOT NULL,
	"context" text,
	"auto_generated" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_meta" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"language" varchar(5) NOT NULL,
	"title" text,
	"description" text,
	"keywords" text,
	"updated_by" text,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"title" text,
	"description" text,
	"word_count" integer,
	"last_crawled" timestamp with time zone,
	"last_modified" timestamp with time zone,
	"status" integer,
	"load_time_ms" integer,
	"has_schema_org" boolean DEFAULT false NOT NULL,
	"schema_types" text,
	"internal_links_in" integer,
	"internal_links_out" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seo_pages_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "seo_rankings" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword_id" integer NOT NULL,
	"date" date NOT NULL,
	"position" numeric(5, 2),
	"clicks" integer,
	"impressions" integer,
	"ctr" numeric(5, 4),
	"page" text,
	"device" text,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"last_hit_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text DEFAULT 'system',
	CONSTRAINT "seo_redirects_from_path_unique" UNIQUE("from_path")
);
--> statement-breakpoint
CREATE TABLE "seo_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"summary" text,
	"data" jsonb,
	"sent_via" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_serp_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword_id" integer NOT NULL,
	"date" date NOT NULL,
	"features" jsonb,
	"owns_faq" boolean DEFAULT false NOT NULL,
	"owns_local_pack" boolean DEFAULT false NOT NULL,
	"owns_images" boolean DEFAULT false NOT NULL,
	"owns_ai_overview" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"domain" text,
	"logo" text,
	"primary_color" varchar(7) DEFAULT '#0077B6',
	"secondary_color" varchar(7) DEFAULT '#00B4D8',
	"email" text,
	"phone" text,
	"address" text,
	"settings" jsonb DEFAULT '{"timezone":"Europe/Madrid","currency":"EUR","languages":["es","en"]}'::jsonb,
	"plan" text DEFAULT 'starter' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"customer_name" varchar NOT NULL,
	"boat_id" varchar,
	"boat_name" varchar,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_blacklist" (
	"token" text PRIMARY KEY NOT NULL,
	"blacklisted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'employee' NOT NULL,
	"first_name" text,
	"last_name" text,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_tenant_idx" UNIQUE("email","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_inquiries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar,
	"boat_id" varchar NOT NULL,
	"boat_name" text NOT NULL,
	"booking_date" text NOT NULL,
	"preferred_time" text,
	"duration" text NOT NULL,
	"number_of_people" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone_prefix" text NOT NULL,
	"phone_number" text NOT NULL,
	"email" text,
	"extras" jsonb DEFAULT '[]'::jsonb,
	"pack_id" text,
	"coupon_code" text,
	"estimated_total" numeric(10, 2),
	"language" text DEFAULT 'es',
	"source" text DEFAULT 'desktop',
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_session_id_ai_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_documents" ADD CONSTRAINT "boat_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_documents" ADD CONSTRAINT "boat_documents_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boats" ADD CONSTRAINT "boats_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_extras" ADD CONSTRAINT "booking_extras_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_extras" ADD CONSTRAINT "booking_extras_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_created_booking_id_bookings_id_fk" FOREIGN KEY ("created_booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_photos" ADD CONSTRAINT "client_photos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_photos" ADD CONSTRAINT "client_photos_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_customer_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."customer_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_assignments" ADD CONSTRAINT "experiment_assignments_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_events" ADD CONSTRAINT "experiment_events_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_nurturing_log" ADD CONSTRAINT "lead_nurturing_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_nurturing_log" ADD CONSTRAINT "lead_nurturing_log_session_id_ai_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_visits" ADD CONSTRAINT "page_visits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_inquiries" ADD CONSTRAINT "whatsapp_inquiries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_users_tenant_id_idx" ON "admin_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_msg_session_idx" ON "ai_chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ai_msg_intent_idx" ON "ai_chat_messages" USING btree ("detected_intent");--> statement-breakpoint
CREATE INDEX "ai_msg_created_idx" ON "ai_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_chat_phone_idx" ON "ai_chat_sessions" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "ai_chat_lead_idx" ON "ai_chat_sessions" USING btree ("is_lead","intent_score");--> statement-breakpoint
CREATE INDEX "ai_chat_last_msg_idx" ON "ai_chat_sessions" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blog_published_idx" ON "blog_posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "blog_posts_category_idx" ON "blog_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "blog_posts_tenant_id_idx" ON "blog_posts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "boat_docs_boat_idx" ON "boat_documents" USING btree ("boat_id");--> statement-breakpoint
CREATE INDEX "boat_docs_type_idx" ON "boat_documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "boat_docs_expiry_idx" ON "boat_documents" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "boats_is_active_idx" ON "boats" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "boats_tenant_id_idx" ON "boats" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "booking_extras_booking_idx" ON "booking_extras" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_extras_tenant_id_idx" ON "booking_extras" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "booking_boat_time_idx" ON "bookings" USING btree ("boat_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "booking_date_idx" ON "bookings" USING btree ("booking_date");--> statement-breakpoint
CREATE INDEX "active_bookings_idx" ON "bookings" USING btree ("boat_id","start_time","end_time") WHERE booking_status IN ('hold', 'pending_payment', 'confirmed');--> statement-breakpoint
CREATE INDEX "bookings_expires_at_idx" ON "bookings" USING btree ("expires_at") WHERE booking_status = 'hold';--> statement-breakpoint
CREATE INDEX "booking_status_idx" ON "bookings" USING btree ("booking_status");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "bookings" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "customer_email_idx" ON "bookings" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "customer_phone_idx" ON "bookings" USING btree ("customer_phone");--> statement-breakpoint
CREATE INDEX "customer_id_date_idx" ON "bookings" USING btree ("customer_id","start_time");--> statement-breakpoint
CREATE INDEX "bookings_tenant_id_idx" ON "bookings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "chatbot_phone_idx" ON "chatbot_conversations" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "chatbot_state_idx" ON "chatbot_conversations" USING btree ("current_state");--> statement-breakpoint
CREATE INDEX "chatbot_last_message_idx" ON "chatbot_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "checkins_booking_idx" ON "checkins" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "checkins_boat_idx" ON "checkins" USING btree ("boat_id");--> statement-breakpoint
CREATE INDEX "checkins_type_idx" ON "checkins" USING btree ("type");--> statement-breakpoint
CREATE INDEX "client_photos_tenant_id_idx" ON "client_photos" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "crm_customers_email_idx" ON "crm_customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "crm_customers_phone_idx" ON "crm_customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "crm_customers_segment_idx" ON "crm_customers" USING btree ("segment");--> statement-breakpoint
CREATE INDEX "crm_customers_name_idx" ON "crm_customers" USING btree ("name","surname");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_customer_tenant_phone_idx" ON "crm_customers" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE INDEX "crm_customers_tenant_id_idx" ON "crm_customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "destinations_tenant_id_idx" ON "destinations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "discount_codes_tenant_id_idx" ON "discount_codes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "exp_assign_experiment_idx" ON "experiment_assignments" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "exp_assign_session_idx" ON "experiment_assignments" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "exp_events_experiment_idx" ON "experiment_events" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "exp_events_type_idx" ON "experiment_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "experiments_status_idx" ON "experiments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "experiments_tenant_idx" ON "experiments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "feature_flags_tenant_idx" ON "feature_flags" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "feature_flags_name_idx" ON "feature_flags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "gift_cards_tenant_id_idx" ON "gift_cards" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "inventory_category_idx" ON "inventory_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "inventory_status_idx" ON "inventory_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_item_name_idx" ON "inventory_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "inventory_items_tenant_id_idx" ON "inventory_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "movements_item_idx" ON "inventory_movements" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "movements_type_idx" ON "inventory_movements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "movements_booking_idx" ON "inventory_movements" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "movements_created_idx" ON "inventory_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_tenant_id_idx" ON "inventory_movements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "kb_category_idx" ON "knowledge_base" USING btree ("category");--> statement-breakpoint
CREATE INDEX "kb_language_idx" ON "knowledge_base" USING btree ("language");--> statement-breakpoint
CREATE INDEX "kb_active_idx" ON "knowledge_base" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "nurturing_phone_idx" ON "lead_nurturing_log" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "nurturing_session_idx" ON "lead_nurturing_log" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "nurturing_created_idx" ON "lead_nurturing_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "maintenance_boat_idx" ON "maintenance_logs" USING btree ("boat_id");--> statement-breakpoint
CREATE INDEX "maintenance_status_idx" ON "maintenance_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenance_date_idx" ON "maintenance_logs" USING btree ("date");--> statement-breakpoint
CREATE INDEX "maintenance_next_due_idx" ON "maintenance_logs" USING btree ("next_due_date");--> statement-breakpoint
CREATE INDEX "memberships_customer_email_idx" ON "memberships" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "memberships_status_idx" ON "memberships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "memberships_tenant_id_idx" ON "memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "memberships_end_date_idx" ON "memberships" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "page_visits_visited_at_idx" ON "page_visits" USING btree ("visited_at");--> statement-breakpoint
CREATE INDEX "page_visits_page_path_idx" ON "page_visits" USING btree ("page_path");--> statement-breakpoint
CREATE INDEX "page_visits_session_idx" ON "page_visits" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "page_visits_tenant_id_idx" ON "page_visits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "password_reset_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "seo_alerts_type_idx" ON "seo_alerts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "seo_alerts_severity_idx" ON "seo_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "seo_alerts_status_idx" ON "seo_alerts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_competitor_rankings_comp_kw_date_idx" ON "seo_competitor_rankings" USING btree ("competitor_id","keyword_id","date");--> statement-breakpoint
CREATE INDEX "seo_competitor_rankings_competitor_id_idx" ON "seo_competitor_rankings" USING btree ("competitor_id");--> statement-breakpoint
CREATE INDEX "seo_competitor_rankings_keyword_id_idx" ON "seo_competitor_rankings" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "seo_conversions_keyword_id_idx" ON "seo_conversions" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "seo_conversions_date_idx" ON "seo_conversions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "seo_cwv_page_metric_idx" ON "seo_cwv_metrics" USING btree ("page","metric_name");--> statement-breakpoint
CREATE INDEX "seo_engine_runs_job_idx" ON "seo_engine_runs" USING btree ("job_name");--> statement-breakpoint
CREATE INDEX "seo_engine_runs_status_idx" ON "seo_engine_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_experiments_campaign_id_idx" ON "seo_experiments" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "seo_experiments_status_idx" ON "seo_experiments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_faqs_page_language_idx" ON "seo_faqs" USING btree ("page","language");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_geo_query_engine_date_idx" ON "seo_geo" USING btree ("query","engine","date");--> statement-breakpoint
CREATE INDEX "seo_health_checks_url_idx" ON "seo_health_checks" USING btree ("url");--> statement-breakpoint
CREATE INDEX "seo_health_checks_checked_at_idx" ON "seo_health_checks" USING btree ("checked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_keywords_keyword_language_idx" ON "seo_keywords" USING btree ("keyword","language");--> statement-breakpoint
CREATE INDEX "seo_learnings_experiment_id_idx" ON "seo_learnings" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "seo_learnings_category_idx" ON "seo_learnings" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_links_from_to_anchor_idx" ON "seo_links" USING btree ("from_page","to_page","anchor_text");--> statement-breakpoint
CREATE INDEX "seo_links_from_page_idx" ON "seo_links" USING btree ("from_page");--> statement-breakpoint
CREATE INDEX "seo_links_to_page_idx" ON "seo_links" USING btree ("to_page");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_meta_page_language_idx" ON "seo_meta" USING btree ("page","language");--> statement-breakpoint
CREATE INDEX "seo_pages_path_idx" ON "seo_pages" USING btree ("path");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_rankings_keyword_date_device_source_idx" ON "seo_rankings" USING btree ("keyword_id","date","device","source");--> statement-breakpoint
CREATE INDEX "seo_rankings_keyword_id_idx" ON "seo_rankings" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "seo_rankings_date_idx" ON "seo_rankings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "seo_redirects_from_idx" ON "seo_redirects" USING btree ("from_path");--> statement-breakpoint
CREATE INDEX "seo_reports_type_idx" ON "seo_reports" USING btree ("type");--> statement-breakpoint
CREATE INDEX "seo_reports_period_idx" ON "seo_reports" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_serp_features_keyword_date_idx" ON "seo_serp_features" USING btree ("keyword_id","date");--> statement-breakpoint
CREATE INDEX "seo_serp_features_keyword_id_idx" ON "seo_serp_features" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_tenant_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "inquiry_status_idx" ON "whatsapp_inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inquiry_created_at_idx" ON "whatsapp_inquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inquiry_phone_idx" ON "whatsapp_inquiries" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "inquiry_email_idx" ON "whatsapp_inquiries" USING btree ("email");--> statement-breakpoint
CREATE INDEX "whatsapp_inquiries_tenant_id_idx" ON "whatsapp_inquiries" USING btree ("tenant_id");