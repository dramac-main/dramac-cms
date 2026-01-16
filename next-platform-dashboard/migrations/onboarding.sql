-- Phase 56: User Journey Gap Fixes
-- Add onboarding tracking columns to profiles and agencies

-- Add onboarding_completed column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
    END IF;
END $$;

-- Add job_title column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'job_title'
    ) THEN
        ALTER TABLE profiles ADD COLUMN job_title text;
    END IF;
END $$;

-- Add description column to agencies if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'description'
    ) THEN
        ALTER TABLE agencies ADD COLUMN description text;
    END IF;
END $$;

-- Add website column to agencies if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'website'
    ) THEN
        ALTER TABLE agencies ADD COLUMN website text;
    END IF;
END $$;

-- Create index for onboarding status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON profiles(onboarding_completed) 
WHERE onboarding_completed = false;

-- Update existing users who have agencies to mark them as onboarded
UPDATE profiles
SET onboarding_completed = true
WHERE agency_id IS NOT NULL
AND onboarding_completed IS NULL OR onboarding_completed = false;

-- Comment to document the migration
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether the user has completed the onboarding flow';
COMMENT ON COLUMN profiles.job_title IS 'User job title set during onboarding';
COMMENT ON COLUMN agencies.description IS 'Agency description set during onboarding';
COMMENT ON COLUMN agencies.website IS 'Agency website URL';
