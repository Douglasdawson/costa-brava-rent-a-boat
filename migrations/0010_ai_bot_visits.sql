-- ============================================================
-- 0010_ai_bot_visits.sql
-- ============================================================
-- Persistent log of every HTTP hit from a known LLM crawler
-- (GPTBot, ClaudeBot, PerplexityBot, Meta-ExternalAgent, etc.).
-- Populated by the aiBotLogger middleware at server/lib/aiBotLogger.ts
-- and surfaced via /api/admin/seo/bot-visits.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS
-- so it can be re-applied on every server boot. Companion runner is
-- server/migrations/applyAiBotVisitsEnsure.ts, hooked from
-- server/index.ts before registerRoutes.
--
-- This file exists because Replit `Republish` wipes tables added to
-- shared/schema.ts after the last full Publish (same root cause as
-- 0007_unblock_analytics.sql, 0008_pricing_overrides.sql, and
-- 0009_seo_url_inspections.sql).
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_bot_visits (
  id          SERIAL PRIMARY KEY,
  bot_name    TEXT NOT NULL,
  user_agent  TEXT NOT NULL,
  path        TEXT NOT NULL,
  method      TEXT NOT NULL DEFAULT 'GET',
  lang        TEXT,
  status_code INTEGER,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_bot_visits_bot_name_timestamp_idx
  ON ai_bot_visits (bot_name, timestamp);

CREATE INDEX IF NOT EXISTS ai_bot_visits_path_idx
  ON ai_bot_visits (path);

CREATE INDEX IF NOT EXISTS ai_bot_visits_timestamp_idx
  ON ai_bot_visits (timestamp);
