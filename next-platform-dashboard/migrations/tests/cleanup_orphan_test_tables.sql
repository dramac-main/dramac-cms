-- ============================================================================
-- Cleanup Orphaned Test Tables
-- Run this to remove all test tables created during failed test runs
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
  drop_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Searching for orphaned test tables...';
  
  -- Find all tables starting with mod_ that match the test pattern
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename ~ '^mod_[a-f0-9]{8}_test_items$'
  LOOP
    RAISE NOTICE '  Dropping: %', table_record.tablename;
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_record.tablename);
    drop_count := drop_count + 1;
  END LOOP;
  
  -- Clean up module_database_registry entries
  DELETE FROM module_database_registry 
  WHERE table_names && ARRAY(
    SELECT tablename::TEXT 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename ~ '^mod_[a-f0-9]{8}_test_items$'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CLEANUP COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Dropped % orphaned test tables', drop_count;
  RAISE NOTICE '';
END $$;
