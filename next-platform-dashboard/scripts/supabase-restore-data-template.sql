-- ============================================================================
-- DRAMAC CMS - DATA RESTORE TEMPLATE
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. First run: supabase-restore-schema.sql (creates empty tables)
-- 2. Then paste your exported JSON data from supabase-full-export.sql below
-- 3. Run this file to restore all your data
--
-- HOW TO USE:
-- Replace the empty arrays [] with your actual data from the export
-- ============================================================================

-- Disable triggers temporarily for faster insertion
SET session_replication_role = 'replica';

-- ============================================================================
-- PASTE YOUR DATA FROM EXPORT BELOW (in this exact order)
-- ============================================================================

-- 1. AGENCIES (must be first - other tables reference this)
-- Paste your agencies_data here:
/*
INSERT INTO public.agencies 
SELECT * FROM jsonb_populate_recordset(NULL::public.agencies, 
  '[]'::jsonb  -- <-- Replace [] with your agencies_data from export
);
*/

-- 2. PROFILES (must be after agencies)
-- Note: The user_id must exist in auth.users first!
-- Paste your profiles_data here:
/*
INSERT INTO public.profiles 
SELECT * FROM jsonb_populate_recordset(NULL::public.profiles, 
  '[]'::jsonb  -- <-- Replace [] with your profiles_data from export
);
*/

-- 3. AGENCY_MEMBERS
/*
INSERT INTO public.agency_members 
SELECT * FROM jsonb_populate_recordset(NULL::public.agency_members, 
  '[]'::jsonb  -- <-- Replace [] with your agency_members_data from export
);
*/

-- 4. CLIENTS
/*
INSERT INTO public.clients 
SELECT * FROM jsonb_populate_recordset(NULL::public.clients, 
  '[]'::jsonb  -- <-- Replace [] with your clients_data from export
);
*/

-- 5. SITES
/*
INSERT INTO public.sites 
SELECT * FROM jsonb_populate_recordset(NULL::public.sites, 
  '[]'::jsonb  -- <-- Replace [] with your sites_data from export
);
*/

-- 6. PAGES
/*
INSERT INTO public.pages 
SELECT * FROM jsonb_populate_recordset(NULL::public.pages, 
  '[]'::jsonb  -- <-- Replace [] with your pages_data from export
);
*/

-- 7. PAGE_CONTENT
/*
INSERT INTO public.page_content 
SELECT * FROM jsonb_populate_recordset(NULL::public.page_content, 
  '[]'::jsonb  -- <-- Replace [] with your page_content_data from export
);
*/

-- 8. ASSETS
/*
INSERT INTO public.assets 
SELECT * FROM jsonb_populate_recordset(NULL::public.assets, 
  '[]'::jsonb  -- <-- Replace [] with your assets_data from export
);
*/

-- 9. TEMPLATES
/*
INSERT INTO public.templates 
SELECT * FROM jsonb_populate_recordset(NULL::public.templates, 
  '[]'::jsonb  -- <-- Replace [] with your templates_data from export
);
*/

-- 10. MODULES
/*
INSERT INTO public.modules 
SELECT * FROM jsonb_populate_recordset(NULL::public.modules, 
  '[]'::jsonb  -- <-- Replace [] with your modules_data from export
);
*/

-- 11. MODULE_SUBSCRIPTIONS
/*
INSERT INTO public.module_subscriptions 
SELECT * FROM jsonb_populate_recordset(NULL::public.module_subscriptions, 
  '[]'::jsonb  -- <-- Replace [] with your module_subscriptions_data from export
);
*/

-- 12. SITE_MODULES
/*
INSERT INTO public.site_modules 
SELECT * FROM jsonb_populate_recordset(NULL::public.site_modules, 
  '[]'::jsonb  -- <-- Replace [] with your site_modules_data from export
);
*/

-- 13. AGENCY_MODULES
/*
INSERT INTO public.agency_modules 
SELECT * FROM jsonb_populate_recordset(NULL::public.agency_modules, 
  '[]'::jsonb  -- <-- Replace [] with your agency_modules_data from export
);
*/

-- 14. MODULE_USAGE
/*
INSERT INTO public.module_usage 
SELECT * FROM jsonb_populate_recordset(NULL::public.module_usage, 
  '[]'::jsonb  -- <-- Replace [] with your module_usage_data from export
);
*/

-- 15. BILLING_CUSTOMERS
/*
INSERT INTO public.billing_customers 
SELECT * FROM jsonb_populate_recordset(NULL::public.billing_customers, 
  '[]'::jsonb  -- <-- Replace [] with your billing_customers_data from export
);
*/

-- 16. BILLING_SUBSCRIPTIONS
/*
INSERT INTO public.billing_subscriptions 
SELECT * FROM jsonb_populate_recordset(NULL::public.billing_subscriptions, 
  '[]'::jsonb  -- <-- Replace [] with your billing_subscriptions_data from export
);
*/

-- 17. BILLING_INVOICES
/*
INSERT INTO public.billing_invoices 
SELECT * FROM jsonb_populate_recordset(NULL::public.billing_invoices, 
  '[]'::jsonb  -- <-- Replace [] with your billing_invoices_data from export
);
*/

-- 18. BILLING_USAGE
/*
INSERT INTO public.billing_usage 
SELECT * FROM jsonb_populate_recordset(NULL::public.billing_usage, 
  '[]'::jsonb  -- <-- Replace [] with your billing_usage_data from export
);
*/

-- 19. BACKUPS
/*
INSERT INTO public.backups 
SELECT * FROM jsonb_populate_recordset(NULL::public.backups, 
  '[]'::jsonb  -- <-- Replace [] with your backups_data from export
);
*/

-- 20. SUBSCRIPTIONS (LemonSqueezy)
/*
INSERT INTO public.subscriptions 
SELECT * FROM jsonb_populate_recordset(NULL::public.subscriptions, 
  '[]'::jsonb  -- <-- Replace [] with your subscriptions_data from export
);
*/

-- 21. INVOICES (LemonSqueezy)
/*
INSERT INTO public.invoices 
SELECT * FROM jsonb_populate_recordset(NULL::public.invoices, 
  '[]'::jsonb  -- <-- Replace [] with your invoices_data from export
);
*/

-- 22. NOTIFICATIONS
/*
INSERT INTO public.notifications 
SELECT * FROM jsonb_populate_recordset(NULL::public.notifications, 
  '[]'::jsonb  -- <-- Replace [] with your notifications_data from export
);
*/

-- 23. ACTIVITY_LOG
/*
INSERT INTO public.activity_log 
SELECT * FROM jsonb_populate_recordset(NULL::public.activity_log, 
  '[]'::jsonb  -- <-- Replace [] with your activity_log_data from export
);
*/

-- 24. NOTIFICATION_PREFERENCES
/*
INSERT INTO public.notification_preferences 
SELECT * FROM jsonb_populate_recordset(NULL::public.notification_preferences, 
  '[]'::jsonb  -- <-- Replace [] with your notification_preferences_data from export
);
*/

-- 25. RATE_LIMITS
/*
INSERT INTO public.rate_limits 
SELECT * FROM jsonb_populate_recordset(NULL::public.rate_limits, 
  '[]'::jsonb  -- <-- Replace [] with your rate_limits_data from export
);
*/

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT 'Data restoration complete!' AS status;

SELECT 
  'agencies' as table_name, COUNT(*) as row_count FROM public.agencies UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles UNION ALL
SELECT 'agency_members', COUNT(*) FROM public.agency_members UNION ALL
SELECT 'clients', COUNT(*) FROM public.clients UNION ALL
SELECT 'sites', COUNT(*) FROM public.sites UNION ALL
SELECT 'pages', COUNT(*) FROM public.pages UNION ALL
SELECT 'page_content', COUNT(*) FROM public.page_content UNION ALL
SELECT 'assets', COUNT(*) FROM public.assets UNION ALL
SELECT 'templates', COUNT(*) FROM public.templates UNION ALL
SELECT 'modules', COUNT(*) FROM public.modules UNION ALL
SELECT 'module_subscriptions', COUNT(*) FROM public.module_subscriptions UNION ALL
SELECT 'site_modules', COUNT(*) FROM public.site_modules UNION ALL
SELECT 'notifications', COUNT(*) FROM public.notifications UNION ALL
SELECT 'activity_log', COUNT(*) FROM public.activity_log
ORDER BY table_name;
