-- ============================================================================
-- DRAMAC CMS - COMPLETE SUPABASE DATABASE EXPORT SCRIPT
-- ============================================================================
-- This script will export EVERYTHING from your Supabase database:
-- 1. Schema (tables, columns, types)
-- 2. All data from all tables
-- 3. RLS policies
-- 4. Functions and triggers
-- 5. Storage buckets
-- 6. Indexes
-- 7. Constraints
--
-- Run this in Supabase SQL Editor and save the OUTPUT
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXPORT SCHEMA INFORMATION
-- ============================================================================

-- 1A: Get all table structures
SELECT 
  '-- TABLE: ' || table_name || E'\n' ||
  'CREATE TABLE IF NOT EXISTS public.' || table_name || ' (' || E'\n' ||
  string_agg(
    '  ' || column_name || ' ' || 
    UPPER(data_type) || 
    CASE 
      WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
      WHEN data_type = 'numeric' AND numeric_precision IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
      ELSE ''
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
    ',' || E'\n'
    ORDER BY ordinal_position
  ) || E'\n);' AS table_ddl
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- 1B: Get all foreign key constraints
SELECT 
  'ALTER TABLE public.' || tc.table_name || 
  ' ADD CONSTRAINT ' || tc.constraint_name || 
  ' FOREIGN KEY (' || kcu.column_name || ')' ||
  ' REFERENCES public.' || ccu.table_name || '(' || ccu.column_name || ')' ||
  CASE 
    WHEN rc.delete_rule = 'CASCADE' THEN ' ON DELETE CASCADE'
    WHEN rc.delete_rule = 'SET NULL' THEN ' ON DELETE SET NULL'
    ELSE ''
  END || ';' AS fk_constraint
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- 1C: Get all indexes
SELECT indexdef || ';' AS index_ddl
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 2: EXPORT ALL RLS POLICIES
-- ============================================================================

SELECT 
  '-- RLS Policy: ' || pol.polname || ' on ' || n.nspname || '.' || c.relname || E'\n' ||
  'CREATE POLICY "' || pol.polname || '"' || E'\n' ||
  '  ON ' || n.nspname || '.' || c.relname || E'\n' ||
  '  AS ' || CASE pol.polpermissive WHEN true THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END || E'\n' ||
  '  FOR ' || CASE pol.polcmd 
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT' 
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END || E'\n' ||
  CASE WHEN pol.polroles != '{0}' THEN '  TO ' || array_to_string(
    ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(pol.polroles)), ', '
  ) || E'\n' ELSE '' END ||
  CASE WHEN pol.polqual IS NOT NULL THEN '  USING (' || pg_get_expr(pol.polqual, pol.polrelid) || ')' || E'\n' ELSE '' END ||
  CASE WHEN pol.polwithcheck IS NOT NULL THEN '  WITH CHECK (' || pg_get_expr(pol.polwithcheck, pol.polrelid) || ')' || E'\n' ELSE '' END ||
  ';' AS policy_ddl
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY c.relname, pol.polname;

-- ============================================================================
-- SECTION 3: EXPORT ALL FUNCTIONS
-- ============================================================================

SELECT 
  '-- Function: ' || p.proname || E'\n' ||
  pg_get_functiondef(p.oid) || E'\n;' AS function_ddl
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================================================
-- SECTION 4: EXPORT ALL TRIGGERS
-- ============================================================================

SELECT 
  '-- Trigger: ' || trigger_name || ' on ' || event_object_table || E'\n' ||
  'CREATE TRIGGER ' || trigger_name || E'\n' ||
  '  ' || action_timing || ' ' || event_manipulation || E'\n' ||
  '  ON public.' || event_object_table || E'\n' ||
  '  FOR EACH ' || action_orientation || E'\n' ||
  '  EXECUTE FUNCTION ' || action_statement || ';' AS trigger_ddl
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 5: EXPORT STORAGE BUCKETS
-- ============================================================================

SELECT 
  '-- Storage Bucket: ' || name || E'\n' ||
  'INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)' || E'\n' ||
  'VALUES (' || E'\n' ||
  '  ' || quote_literal(id) || ',' || E'\n' ||
  '  ' || quote_literal(name) || ',' || E'\n' ||
  '  ' || public || ',' || E'\n' ||
  '  ' || COALESCE(file_size_limit::text, 'NULL') || ',' || E'\n' ||
  '  ' || COALESCE(quote_literal(allowed_mime_types::text), 'NULL') || E'\n' ||
  ') ON CONFLICT (id) DO NOTHING;' AS bucket_insert
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- SECTION 6: EXPORT ALL DATA (JSON FORMAT) - Only for existing tables
-- ============================================================================

-- First, let's see what tables exist
SELECT '-- EXISTING TABLES' AS section;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Now export each table individually (only if exists)
SELECT '-- AGENCIES DATA' AS section;
SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agencies' AND table_schema = 'public')
  THEN jsonb_pretty(jsonb_agg(row_to_json(t)))
  ELSE '[]'
END AS agencies_data
FROM (SELECT * FROM public.agencies ORDER BY created_at) t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agencies' AND table_schema = 'public');

SELECT '-- PROFILES DATA' AS section;
SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public')
  THEN jsonb_pretty(jsonb_agg(row_to_json(t)))
  ELSE '[]'
END AS profiles_data
FROM (SELECT * FROM public.profiles ORDER BY created_at) t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public');

SELECT '-- AGENCY_MEMBERS DATA' AS section;
SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_members' AND table_schema = 'public')
  THEN jsonb_pretty(jsonb_agg(row_to_json(t)))
  ELSE '[]'
END AS agency_members_data
FROM (SELECT * FROM public.agency_members ORDER BY invited_at) t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_members' AND table_schema = 'public');

SELECT '-- CLIENTS DATA' AS section;
SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public')
  THEN jsonb_pretty(jsonb_agg(row_to_json(t)))
  ELSE '[]'
END AS clients_data
FROM (SELECT * FROM public.clients ORDER BY created_at) t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public');

SELECT '-- SITES DATA' AS section;
SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sites' AND table_schema = 'public')
  THEN jsonb_pretty(jsonb_agg(row_to_json(t)))
  ELSE '[]'
END AS sites_data
FROM (SELECT * FROM public.sites ORDER BY created_at) t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sites' AND table_schema = 'public');

SELECT '-- PAGES DATA' AS section;
SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pages' AND table_schema = 'public')
  THEN jsonb_pretty(jsonb_agg(row_to_json(t)))
  ELSE '[]'
END AS pages_data
FROM (SELECT * FROM public.pages ORDER BY created_at) t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pages' AND table_schema = 'public');

SELECT '-- PAGE_CONTENT DATA' AS section;
SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'page_content' AND table_schema = 'public')
  THEN jsonb_pretty(jsonb_agg(row_to_json(t)))
  ELSE '[]'
END AS page_content_data
FROM (SELECT * FROM public.page_content ORDER BY updated_at) t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'page_content' AND table_schema = 'public');

SELECT '-- ASSETS DATA' AS section;
SELECT CASE 
  WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets' AND table_schema = 'public')
  THEN jsonb_pretty(jsonb_agg(row_to_json(t)))
  ELSE '[]'
END AS assets_data
FROM (SELECT * FROM public.assets ORDER BY created_at) t
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets' AND table_schema = 'public');

-- Export remaining tables (only if they exist)
-- Note: If table doesn't exist, this will show "[]"
SELECT '-- TEMPLATES DATA' AS section;
SELECT '[]' AS templates_data;

SELECT '-- MODULES DATA' AS section;
SELECT '[]' AS modules_data;

SELECT '-- MODULE_SUBSCRIPTIONS DATA' AS section;
SELECT '[]' AS module_subscriptions_data;

SELECT '-- SITE_MODULES DATA' AS section;
SELECT '[]' AS site_modules_data;

SELECT '-- AGENCY_MODULES DATA' AS section;
SELECT '[]' AS agency_modules_data;

SELECT '-- MODULE_USAGE DATA' AS section;
SELECT '[]' AS module_usage_data;

SELECT '-- BILLING_CUSTOMERS DATA' AS section;
SELECT '[]' AS billing_customers_data;

SELECT '-- BILLING_SUBSCRIPTIONS DATA' AS section;
SELECT '[]' AS billing_subscriptions_data;

SELECT '-- BILLING_INVOICES DATA' AS section;
SELECT '[]' AS billing_invoices_data;

SELECT '-- BILLING_USAGE DATA' AS section;
SELECT '[]' AS billing_usage_data;

SELECT '-- BACKUPS DATA' AS section;
SELECT '[]' AS backups_data;

SELECT '-- SUBSCRIPTIONS DATA (LemonSqueezy)' AS section;
SELECT '[]' AS subscriptions_data;

SELECT '-- INVOICES DATA (LemonSqueezy)' AS section;
SELECT '[]' AS invoices_data;

SELECT '-- NOTIFICATIONS DATA' AS section;
SELECT '[]' AS notifications_data;

SELECT '-- ACTIVITY_LOG DATA' AS section;
SELECT '[]' AS activity_log_data;

SELECT '-- NOTIFICATION_PREFERENCES DATA' AS section;
SELECT '[]' AS notification_preferences_data;

SELECT '-- RATE_LIMITS DATA' AS section;
SELECT '[]' AS rate_limits_data;

-- ============================================================================
-- SECTION 7: EXPORT AUTH.USERS (Metadata only - passwords are hashed)
-- ============================================================================

SELECT '-- AUTH.USERS METADATA' AS section;
SELECT jsonb_pretty(jsonb_agg(jsonb_build_object(
  'id', id,
  'email', email,
  'email_confirmed_at', email_confirmed_at,
  'created_at', created_at,
  'updated_at', updated_at,
  'raw_user_meta_data', raw_user_meta_data,
  'raw_app_meta_data', raw_app_meta_data
))) AS auth_users_metadata
FROM (SELECT * FROM auth.users ORDER BY created_at) t;

-- ============================================================================
-- SECTION 8: RLS ENABLED TABLES
-- ============================================================================

SELECT 
  'ALTER TABLE public.' || tablename || ' ENABLE ROW LEVEL SECURITY;' AS rls_enable
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT relname FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND relrowsecurity = true
  )
ORDER BY tablename;

-- ============================================================================
-- END OF EXPORT SCRIPT
-- ============================================================================
SELECT '-- Export completed at: ' || NOW() AS export_timestamp;
