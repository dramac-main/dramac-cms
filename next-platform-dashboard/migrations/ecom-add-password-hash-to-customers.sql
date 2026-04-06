-- Migration: Add password_hash column to customers table
-- Purpose: Replace Supabase auth.users dependency with bcrypt-based passwords
--          stored directly on the multi-tenant customers table.
--          This allows the same email to register independently on different sites.
--
-- Applied via Supabase MCP as: add_password_hash_to_customers

ALTER TABLE mod_ecommod01_customers
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Migrate existing registered users' bcrypt hashes from auth.users
UPDATE mod_ecommod01_customers c
SET password_hash = u.encrypted_password
FROM auth.users u
WHERE u.id = c.auth_user_id::uuid
  AND c.auth_user_id IS NOT NULL
  AND c.password_hash IS NULL;
