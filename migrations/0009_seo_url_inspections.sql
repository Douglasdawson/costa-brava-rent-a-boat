-- ============================================================
-- 0009_seo_url_inspections.sql
-- ============================================================
-- Indexation coverage per canonical URL, populated by the GSC URL
-- Inspection API collector at server/seo/collectors/urlInspection.ts.
-- One row per URL — re-runs upsert on (url) and overwrite the previous
-- snapshot. History is not retained because GSC's API exposes
-- last-crawl-time and the goal is current state, not trend.
--
-- Idempotent: uses CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT
-- EXISTS so it can be re-applied on every server boot. The companion
-- runner is server/migrations/applySeoUrlInspectionsEnsure.ts and is
-- hooked from server/index.ts before registerRoutes runs.
--
-- This file exists because Replit `Republish` keeps wiping tables
-- added to shared/schema.ts after the last full Publish (same root
-- cause documented in 0007_unblock_analytics.sql and
-- 0008_pricing_overrides.sql).
-- ============================================================

CREATE TABLE IF NOT EXISTS seo_url_inspections (
  id                  SERIAL PRIMARY KEY,
  url                 TEXT NOT NULL UNIQUE,
  coverage_state      TEXT,
  indexing_state      TEXT,
  page_fetch_state    TEXT,
  robots_txt_state    TEXT,
  verdict             TEXT,
  user_canonical      TEXT,
  google_canonical    TEXT,
  canonical_mismatch  BOOLEAN NOT NULL DEFAULT FALSE,
  last_crawl_time     TIMESTAMPTZ,
  crawled_as          TEXT,
  referring_sitemap   TEXT,
  raw_payload         JSONB,
  inspected_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seo_url_inspections_coverage_idx
  ON seo_url_inspections (coverage_state);

CREATE INDEX IF NOT EXISTS seo_url_inspections_verdict_idx
  ON seo_url_inspections (verdict);

CREATE INDEX IF NOT EXISTS seo_url_inspections_inspected_at_idx
  ON seo_url_inspections (inspected_at);

CREATE INDEX IF NOT EXISTS seo_url_inspections_canonical_mismatch_idx
  ON seo_url_inspections (canonical_mismatch);
