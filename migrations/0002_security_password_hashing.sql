-- Migration: Fix password security - rename password to password_hash
-- Author: Costa Brava Rent a Boat booking system  
-- Date: 2025-01-26

-- Rename password column to password_hash to enforce application-level hashing (idempotent)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='password'
  ) THEN
    ALTER TABLE users RENAME COLUMN password TO password_hash;
  END IF;
END $$;

-- Add comment to clarify this should store hashed passwords only (idempotent)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='password_hash'
  ) THEN
    COMMENT ON COLUMN users.password_hash IS 'Stores bcrypt hashed passwords only - never plaintext';
  END IF;
END $$;