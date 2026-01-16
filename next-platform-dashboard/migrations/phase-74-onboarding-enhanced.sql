-- Phase 74: Enhanced Onboarding Fields Migration
-- Add missing columns for enhanced onboarding
-- Run this after the existing onboarding.sql migration

-- Add industry column to agencies if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'industry'
    ) THEN
        ALTER TABLE agencies ADD COLUMN industry TEXT;
    END IF;
END $$;

-- Add team_size column to agencies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'team_size'
    ) THEN
        ALTER TABLE agencies ADD COLUMN team_size TEXT;
    END IF;
END $$;

-- Add goals column to agencies (array)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'goals'
    ) THEN
        ALTER TABLE agencies ADD COLUMN goals TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Add industry column to clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'industry'
    ) THEN
        ALTER TABLE clients ADD COLUMN industry TEXT;
    END IF;
END $$;

-- Ensure onboarding_completed column exists on profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add full_name column to profiles if not exists (some use name, some full_name)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Add job_title column to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'job_title'
    ) THEN
        ALTER TABLE profiles ADD COLUMN job_title TEXT;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN agencies.industry IS 'Primary industry the agency serves';
COMMENT ON COLUMN agencies.team_size IS 'Team size category: solo, small, medium, large';
COMMENT ON COLUMN agencies.goals IS 'Array of goal IDs selected during onboarding';
COMMENT ON COLUMN clients.industry IS 'Client industry for AI content generation';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding wizard';
COMMENT ON COLUMN profiles.full_name IS 'User full name set during onboarding';
COMMENT ON COLUMN profiles.job_title IS 'User job title set during onboarding';

-- Create index for faster onboarding status checks
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON profiles(onboarding_completed) 
WHERE onboarding_completed = FALSE;

-- Create index for agency industry lookups
CREATE INDEX IF NOT EXISTS idx_agencies_industry 
ON agencies(industry) 
WHERE industry IS NOT NULL;

-- Create index for client industry lookups
CREATE INDEX IF NOT EXISTS idx_clients_industry 
ON clients(industry) 
WHERE industry IS NOT NULL;
