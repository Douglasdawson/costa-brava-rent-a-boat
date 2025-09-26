-- Migration: Initial database setup for Costa Brava Rent a Boat booking system
-- Author: Costa Brava Rent a Boat booking system
-- Date: 2025-01-26

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

-- Create boats table  
CREATE TABLE IF NOT EXISTS boats (
  id VARCHAR PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  requires_license BOOLEAN NOT NULL,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  deposit DECIMAL(10, 2) NOT NULL,
  specifications JSON,
  equipment JSON,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create bookings table with enhanced status management
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id VARCHAR NOT NULL REFERENCES boats(id),
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_surname TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_nationality TEXT NOT NULL,
  number_of_people INTEGER NOT NULL,
  total_hours INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  extras_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deposit DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  booking_status TEXT NOT NULL DEFAULT 'draft',
  source TEXT NOT NULL DEFAULT 'web',
  coupon_code TEXT,
  refund_status TEXT,
  refund_amount DECIMAL(10, 2),
  whatsapp_confirmation_sent BOOLEAN NOT NULL DEFAULT false,
  whatsapp_reminder_sent BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_holds table for temporary reservations
CREATE TABLE IF NOT EXISTS booking_holds (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id VARCHAR NOT NULL REFERENCES boats(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  session_id TEXT,
  created_by TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_extras table
CREATE TABLE IF NOT EXISTS booking_extras (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  extra_name TEXT NOT NULL,
  extra_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS booking_boat_time_idx ON bookings(boat_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS booking_date_idx ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS active_bookings_idx ON bookings(boat_id, start_time, end_time) 
  WHERE booking_status IN ('pending_payment', 'confirmed');

CREATE INDEX IF NOT EXISTS hold_boat_time_idx ON booking_holds(boat_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS hold_expires_at_idx ON booking_holds(expires_at);

-- Create partial unique index on stripe_payment_intent_id (excluding NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS stripe_intent_id_unique_idx 
ON bookings (stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;