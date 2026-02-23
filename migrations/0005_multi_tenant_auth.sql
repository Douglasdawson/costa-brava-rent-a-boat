-- Migration: Multi-tenant SaaS authentication foundations
-- Date: 2026-02-17

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- TENANTS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  domain TEXT,
  logo TEXT,
  primary_color VARCHAR(7) DEFAULT '#0077B6',
  secondary_color VARCHAR(7) DEFAULT '#00B4D8',
  email TEXT,
  phone TEXT,
  address TEXT,
  settings JSONB DEFAULT '{"timezone":"Europe/Madrid","currency":"EUR","languages":["es","en"]}'::jsonb,
  plan TEXT NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenants_slug_idx ON tenants(slug);
CREATE INDEX IF NOT EXISTS tenants_status_idx ON tenants(status);

-- Ensure a default tenant exists for migrated legacy data.
INSERT INTO tenants (name, slug, email, plan, status)
SELECT 'Costa Brava Rent a Boat', 'costa-brava-rent-a-boat', 'costabravarentboat@gmail.com', 'enterprise', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM tenants WHERE slug = 'costa-brava-rent-a-boat'
);

-- =========================================================
-- USERS TABLE UPGRADE TO MULTI-TENANT
-- =========================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'employee';
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill email and tenant_id for legacy rows.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    UPDATE users
    SET email = lower(trim(username)) || '@legacy.local'
    WHERE email IS NULL AND username IS NOT NULL;
  END IF;
END $$;

UPDATE users
SET email = lower(trim(email))
WHERE email IS NOT NULL;

UPDATE users u
SET tenant_id = t.id
FROM tenants t
WHERE t.slug = 'costa-brava-rent-a-boat'
  AND u.tenant_id IS NULL;

UPDATE users SET role = 'employee' WHERE role IS NULL OR role = '';
UPDATE users SET is_active = true WHERE is_active IS NULL;
UPDATE users SET created_at = now() WHERE created_at IS NULL;
UPDATE users SET updated_at = now() WHERE updated_at IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) AND NOT EXISTS (SELECT 1 FROM users WHERE email IS NULL) THEN
    ALTER TABLE users ALTER COLUMN email SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'tenant_id'
  ) AND NOT EXISTS (SELECT 1 FROM users WHERE tenant_id IS NULL) THEN
    ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_tenant_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS users_tenant_idx ON users(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_tenant_idx ON users(email, tenant_id);

-- =========================================================
-- REFRESH TOKENS
-- =========================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_idx ON refresh_tokens(expires_at);

-- =========================================================
-- PASSWORD RESET TOKENS
-- =========================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_token_idx ON password_reset_tokens(token);

-- =========================================================
-- LEGACY ADMIN USERS ALIGNMENT
-- =========================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'admin_users'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR;

    UPDATE admin_users a
    SET tenant_id = t.id
    FROM tenants t
    WHERE t.slug = 'costa-brava-rent-a-boat'
      AND a.tenant_id IS NULL;

    CREATE INDEX IF NOT EXISTS admin_users_tenant_idx ON admin_users(tenant_id);
  END IF;
END $$;
