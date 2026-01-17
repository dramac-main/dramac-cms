-- Migration: Fix incorrect super_admin roles
-- Date: 2026-01-17
-- Problem: The signup function was incorrectly assigning 'super_admin' role to all new users
-- Solution: Reset all users to 'member' role, then manually promote actual super admins

-- IMPORTANT: Before running this migration:
-- 1. Note down the email(s) of your actual super admin(s)
-- 2. After running this, use the promote script to set them back to super_admin

-- Step 1: See who currently has super_admin role (run this first to identify actual admins)
-- SELECT id, email, name, role, created_at FROM profiles WHERE role = 'super_admin' ORDER BY created_at;

-- Step 2: Reset ALL users to 'member' role
-- WARNING: This will demote everyone including actual admins!
UPDATE profiles
SET role = 'member'
WHERE role = 'super_admin';

-- Step 3: After running the above, use one of these methods to restore actual super admin(s):

-- Option A: Via SQL (replace with actual admin email)
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'your-admin@email.com';

-- Option B: Via CLI script (recommended)
-- cd next-platform-dashboard
-- pnpm admin:create your-admin@email.com

-- Verify the changes
-- SELECT id, email, name, role FROM profiles ORDER BY role DESC, created_at;
