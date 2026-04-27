-- ============================================================
-- 0008_pricing_overrides.sql
-- ============================================================
-- Adds the pricing_overrides table for the dynamic pricing MVP
-- (date-block surcharges/discounts on top of seasonal pricing).
--
-- Background: analysis of 2.333 historical bookings (2020-2025,
-- 367k€ revenue) showed:
--   - In August, day-of-week is irrelevant (Mon = Sat in revenue).
--     The current WEEKEND_SURCHARGE_FACTOR (+15% Sat/Sun) leaves
--     money on the table on weekdays in August.
--   - Real peak: 1-17 August (1.7-2.5x more revenue than the
--     second half), consistent across all 6 years.
--   - 96% of bookings are direct (no marketplace constraints).
--
-- This table lets the admin define overrides by date range, with
-- optional weekday filter, optional boat scope, and configurable
-- adjustment (multiplier or flat €). Resolution rules are enforced
-- in the application layer (shared/pricing.ts):
--   1. active=true and date in [date_start, date_end]
--   2. weekday_filter null OR contains target weekday
--   3. boat_id matches OR boat_id IS NULL
--   4. specificity wins (boat_id NOT NULL > NULL)
--   5. higher priority wins on tie
--   6. most recent created_at wins on final tie
--
-- Direction column is wired for v2 (discounts/promotions). MVP
-- form only exposes 'surcharge'; queries filter accordingly.
--
-- Idempotent. Safe to re-run.

CREATE TABLE IF NOT EXISTS pricing_overrides (
  id              VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       VARCHAR REFERENCES tenants(id),
  boat_id         VARCHAR REFERENCES boats(id),
  date_start      DATE NOT NULL,
  date_end        DATE NOT NULL,
  weekday_filter  JSONB,
  direction       TEXT NOT NULL DEFAULT 'surcharge',
  adjustment_type TEXT NOT NULL,
  adjustment_value DECIMAL(10,4) NOT NULL,
  label           TEXT NOT NULL,
  notes           TEXT,
  priority        INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CHECK constraints (idempotent via DO blocks)
DO $$ BEGIN
  ALTER TABLE pricing_overrides
    ADD CONSTRAINT pricing_overrides_direction_check
    CHECK (direction IN ('surcharge', 'discount'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE pricing_overrides
    ADD CONSTRAINT pricing_overrides_type_check
    CHECK (adjustment_type IN ('multiplier', 'flat_eur'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE pricing_overrides
    ADD CONSTRAINT pricing_overrides_value_positive_check
    CHECK (adjustment_value > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE pricing_overrides
    ADD CONSTRAINT pricing_overrides_date_range_check
    CHECK (date_end >= date_start);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes (idempotent — IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS pricing_overrides_active_date_idx
  ON pricing_overrides (is_active, date_start, date_end);

CREATE INDEX IF NOT EXISTS pricing_overrides_boat_idx
  ON pricing_overrides (boat_id) WHERE boat_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS pricing_overrides_tenant_idx
  ON pricing_overrides (tenant_id);
