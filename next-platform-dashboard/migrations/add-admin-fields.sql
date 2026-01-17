-- Phase 78: Super Admin Dashboard - Database Migration
-- This migration ensures the required columns and indexes exist for the admin functionality

-- ============================================
-- PROFILES TABLE ENHANCEMENTS
-- ============================================

-- Ensure role column exists with proper constraints
-- The role column should already exist, but we ensure it has the correct type
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'member';
  END IF;
END $$;

-- Add last_sign_in_at column for tracking user activity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_sign_in_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add deleted_at column for soft deletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create index for role-based queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create index for soft delete queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- AUDIT LOGS TABLE (Optional - for future use)
-- ============================================

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- RLS POLICIES FOR AUDIT LOGS
-- ============================================

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Super admins can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;

-- Super admins can read all audit logs
CREATE POLICY "Super admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- System can insert audit logs (via service role)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Update last sign in
-- ============================================

-- Function to update last_sign_in_at when user signs in
CREATE OR REPLACE FUNCTION update_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_sign_in_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger on auth.users is typically set up via Supabase dashboard
-- as it requires special permissions. Supabase also tracks last_sign_in_at
-- automatically in the auth.users table.

-- ============================================
-- AGENCIES TABLE ENHANCEMENTS (if needed)
-- ============================================

-- Add status column to agencies if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agencies' AND column_name = 'status'
  ) THEN
    ALTER TABLE agencies ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Create index for agency status queries
CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions on audit_logs to authenticated users (read via RLS)
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO service_role;

-- ============================================
-- VERIFICATION QUERIES (run manually to check)
-- ============================================

-- Check profiles table structure:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles';

-- Check for super admins:
-- SELECT id, email, name, role FROM profiles WHERE role = 'super_admin';

-- Check audit_logs table:
-- SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
