-- Verify Phase 81B tables exist
SELECT 'test_site_configuration' as table_name, COUNT(*) as row_count FROM test_site_configuration
UNION ALL
SELECT 'beta_enrollment', COUNT(*) FROM beta_enrollment
UNION ALL
SELECT 'module_test_runs', COUNT(*) FROM module_test_runs
UNION ALL
SELECT 'module_test_results', COUNT(*) FROM module_test_results;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('test_site_configuration', 'beta_enrollment', 'module_test_runs', 'module_test_results')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('test_site_configuration', 'beta_enrollment', 'module_test_runs', 'module_test_results')
ORDER BY tablename, policyname;
