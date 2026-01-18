-- ============================================
-- RLS DEBUG SCRIPT
-- Run these queries in Supabase SQL Editor
-- ============================================

-- 1. Check if auth.uid() returns anything (should be NULL in SQL Editor)
SELECT auth.uid() as current_user_id;

-- 2. Verify drakemacchiko@gmail.com exists and has super_admin role
SELECT id, email, role 
FROM profiles 
WHERE email = 'drakemacchiko@gmail.com';

-- 3. Manually test the function logic with the known user ID
SELECT EXISTS (
  SELECT 1 
  FROM public.profiles 
  WHERE id = 'e9270737-2278-4693-8cbf-b84a44ea736e'::uuid
  AND role = 'super_admin'
) as should_be_true;

-- 4. Check the actual role column type
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'role';

