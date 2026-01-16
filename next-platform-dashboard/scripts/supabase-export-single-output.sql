-- ============================================================================
-- DRAMAC CMS - SINGLE OUTPUT DATABASE EXPORT
-- ============================================================================
-- This script outputs EVERYTHING in ONE result you can copy/paste
-- ============================================================================

WITH export_data AS (
  SELECT 
    '=== DRAMAC CMS DATABASE EXPORT ===' || E'\n' ||
    'Exported at: ' || NOW()::text || E'\n\n' ||
    
    -- SECTION 1: EXISTING TABLES
    '=== EXISTING TABLES ===' || E'\n' ||
    (SELECT string_agg(tablename, ', ' ORDER BY tablename) FROM pg_tables WHERE schemaname = 'public') || E'\n\n' ||
    
    -- SECTION 2: TABLE COUNT
    '=== TABLE ROW COUNTS ===' || E'\n' ||
    (SELECT string_agg(
      tablename || ': ' || 
      (SELECT COUNT(*)::text FROM (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = pt.tablename LIMIT 1) x),
      E'\n'
      ORDER BY tablename
    ) FROM pg_tables pt WHERE schemaname = 'public') || E'\n\n' ||
    
    -- SECTION 3: AGENCIES DATA
    '=== AGENCIES DATA ===' || E'\n' ||
    COALESCE((SELECT jsonb_pretty(jsonb_agg(row_to_json(t))) FROM (SELECT * FROM public.agencies ORDER BY created_at) t), '[]') || E'\n\n' ||
    
    -- SECTION 4: PROFILES DATA
    '=== PROFILES DATA ===' || E'\n' ||
    COALESCE((SELECT jsonb_pretty(jsonb_agg(row_to_json(t))) FROM (SELECT * FROM public.profiles ORDER BY created_at) t), '[]') || E'\n\n' ||
    
    -- SECTION 5: AGENCY_MEMBERS DATA
    '=== AGENCY_MEMBERS DATA ===' || E'\n' ||
    COALESCE((SELECT jsonb_pretty(jsonb_agg(row_to_json(t))) FROM (SELECT * FROM public.agency_members ORDER BY invited_at) t), '[]') || E'\n\n' ||
    
    -- SECTION 6: CLIENTS DATA
    '=== CLIENTS DATA ===' || E'\n' ||
    COALESCE((SELECT jsonb_pretty(jsonb_agg(row_to_json(t))) FROM (SELECT * FROM public.clients ORDER BY created_at) t), '[]') || E'\n\n' ||
    
    -- SECTION 7: SITES DATA
    '=== SITES DATA ===' || E'\n' ||
    COALESCE((SELECT jsonb_pretty(jsonb_agg(row_to_json(t))) FROM (SELECT * FROM public.sites ORDER BY created_at) t), '[]') || E'\n\n' ||
    
    -- SECTION 8: PAGES DATA
    '=== PAGES DATA ===' || E'\n' ||
    COALESCE((SELECT jsonb_pretty(jsonb_agg(row_to_json(t))) FROM (SELECT * FROM public.pages ORDER BY created_at) t), '[]') || E'\n\n' ||
    
    -- SECTION 9: PAGE_CONTENT DATA
    '=== PAGE_CONTENT DATA ===' || E'\n' ||
    COALESCE((SELECT jsonb_pretty(jsonb_agg(row_to_json(t))) FROM (SELECT * FROM public.page_content ORDER BY updated_at) t), '[]') || E'\n\n' ||
    
    -- SECTION 10: ASSETS DATA
    '=== ASSETS DATA ===' || E'\n' ||
    COALESCE((SELECT jsonb_pretty(jsonb_agg(row_to_json(t))) FROM (SELECT * FROM public.assets ORDER BY created_at) t), '[]') || E'\n\n' ||
    
    -- SECTION 11: AUTH USERS
    '=== AUTH.USERS METADATA ===' || E'\n' ||
    COALESCE((SELECT jsonb_pretty(jsonb_agg(jsonb_build_object(
      'id', id,
      'email', email,
      'email_confirmed_at', email_confirmed_at,
      'created_at', created_at,
      'updated_at', updated_at
    ))) FROM (SELECT * FROM auth.users ORDER BY created_at) t), '[]') || E'\n\n' ||
    
    '=== END OF EXPORT ===' AS export_result
)
SELECT export_result FROM export_data;

-- Instructions:
-- 1. Run this query
-- 2. Copy the ENTIRE text output
-- 3. Save to a file like "dramac-backup-2026-01-16.txt"
-- 4. Keep this safe - it's your complete database state!
