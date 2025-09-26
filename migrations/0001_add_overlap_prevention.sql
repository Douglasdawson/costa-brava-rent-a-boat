-- Migration: Add overlap prevention constraints for bookings and holds
-- Author: Costa Brava Rent a Boat booking system
-- Date: 2025-01-26

-- Enable btree_gist extension for range operations (idempotent)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping bookings for the same boat
-- Only applies to active bookings (pending_payment, confirmed)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'no_overlapping_bookings'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT no_overlapping_bookings 
    EXCLUDE USING gist (
      boat_id WITH =, 
      tstzrange(start_time, end_time, '[)') WITH &&
    ) 
    WHERE (booking_status IN ('pending_payment', 'confirmed'));
  END IF;
END $$;

-- Add exclusion constraint to prevent overlapping holds for the same boat
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'no_overlapping_holds'
  ) THEN
    ALTER TABLE booking_holds 
    ADD CONSTRAINT no_overlapping_holds 
    EXCLUDE USING gist (
      boat_id WITH =, 
      tstzrange(start_time, end_time, '[)') WITH &&
    );
  END IF;
END $$;

-- Add check constraints for time validation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_time_order_check'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_time_order_check 
    CHECK (start_time < end_time);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'holds_time_order_check'
  ) THEN
    ALTER TABLE booking_holds 
    ADD CONSTRAINT holds_time_order_check 
    CHECK (start_time < end_time);
  END IF;
END $$;

-- Note: stripe_intent_id_unique_idx created in 0000_initial.sql