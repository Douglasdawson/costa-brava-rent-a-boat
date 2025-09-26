-- Migration: Unify bookings and holds to prevent cross-table overlaps
-- Author: Costa Brava Rent a Boat booking system
-- Date: 2025-01-26

-- First, migrate any existing booking_holds data to bookings table as 'hold' status
INSERT INTO bookings (
  boat_id, booking_date, start_time, end_time, 
  customer_name, customer_surname, customer_phone, customer_nationality,
  number_of_people, total_hours, subtotal, extras_total, deposit, total_amount,
  booking_status, payment_status, source, notes, created_at
)
SELECT 
  boat_id, 
  date_trunc('day', start_time) as booking_date,
  start_time, 
  end_time,
  COALESCE(created_by, 'System Hold') as customer_name,
  'Hold' as customer_surname,
  'N/A' as customer_phone,
  'N/A' as customer_nationality,
  1 as number_of_people,
  EXTRACT(EPOCH FROM (end_time - start_time))/3600 as total_hours,
  0 as subtotal,
  0 as extras_total, 
  0 as deposit,
  0 as total_amount,
  'hold' as booking_status,
  'pending' as payment_status,
  'web' as source,
  CONCAT('Migrated hold. Session: ', COALESCE(session_id, 'unknown'), '. Expires: ', expires_at) as notes,
  created_at
FROM booking_holds 
WHERE NOT EXISTS (
  SELECT 1 FROM bookings b 
  WHERE b.boat_id = booking_holds.boat_id 
  AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange(booking_holds.start_time, booking_holds.end_time, '[)')
  AND b.booking_status IN ('pending_payment', 'confirmed', 'hold')
);

-- Update the exclusion constraint to include 'hold' status
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_bookings;

-- Add new exclusion constraint that includes holds
ALTER TABLE bookings 
ADD CONSTRAINT no_overlapping_bookings 
EXCLUDE USING gist (
  boat_id WITH =, 
  tstzrange(start_time, end_time, '[)') WITH &&
) 
WHERE (booking_status IN ('hold', 'pending_payment', 'confirmed'));

-- Add session_id and expires_at columns to bookings for hold functionality
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update active bookings index to include holds
DROP INDEX IF EXISTS active_bookings_idx;
CREATE INDEX active_bookings_idx ON bookings(boat_id, start_time, end_time) 
WHERE booking_status IN ('hold', 'pending_payment', 'confirmed');

-- Add index for expired holds cleanup
CREATE INDEX IF NOT EXISTS bookings_expires_at_idx ON bookings(expires_at) 
WHERE booking_status = 'hold';

-- Drop the booking_holds table (after data migration)
DROP TABLE IF EXISTS booking_holds;