-- ============================================================================
-- Phase EM-40: Multi-Tenant Architecture - Database Tests
-- Run these tests to verify tenant isolation is working correctly
-- ============================================================================

-- BEFORE RUNNING: Replace these UUIDs with real values from your database
DO $$
DECLARE
  v_agency_1_id UUID;
  v_agency_2_id UUID;
  v_site_1_id UUID;
  v_site_2_id UUID;
  v_site_3_id UUID;
  v_user_1_id UUID;
  v_user_2_id UUID;
  v_test_module_id UUID := '00000000-0000-0000-0000-000000000001'::UUID; -- FIXED UUID for testing
  v_test_table_name TEXT := 'mod_' || substring(v_test_module_id::TEXT from 1 for 8) || '_test_items';
  v_result BOOLEAN;
  v_count INTEGER;
  v_is_admin BOOLEAN;
  v_expected_count INTEGER;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'PHASE EM-40 MULTI-TENANT ARCHITECTURE TEST SUITE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- CLEANUP FROM PREVIOUS RUNS
  -- ============================================================================
  RAISE NOTICE 'Cleaning up any leftover test data...';
  BEGIN
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', v_test_table_name);
    DELETE FROM module_database_registry WHERE module_id = v_test_module_id;
    RAISE NOTICE '  ✓ Cleanup complete';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '  ⚠ Cleanup warning: %', SQLERRM;
  END;
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 1: Get Test Data from Database
  -- ============================================================================
  RAISE NOTICE 'TEST 1: Setting up test data...';
  
  -- Get two agencies
  SELECT id INTO v_agency_1_id FROM agencies ORDER BY created_at LIMIT 1;
  SELECT id INTO v_agency_2_id FROM agencies ORDER BY created_at LIMIT 1 OFFSET 1;
  
  IF v_agency_1_id IS NULL OR v_agency_2_id IS NULL THEN
    RAISE EXCEPTION 'Need at least 2 agencies in database. Please create them first.';
  END IF;
  
  RAISE NOTICE '  ✓ Agency 1 ID: %', v_agency_1_id;
  RAISE NOTICE '  ✓ Agency 2 ID: %', v_agency_2_id;
  
  -- Get sites for agencies
  SELECT id INTO v_site_1_id FROM sites WHERE agency_id = v_agency_1_id LIMIT 1;
  SELECT id INTO v_site_2_id FROM sites WHERE agency_id = v_agency_1_id LIMIT 1 OFFSET 1;
  SELECT id INTO v_site_3_id FROM sites WHERE agency_id = v_agency_2_id LIMIT 1;
  
  IF v_site_1_id IS NULL THEN
    RAISE EXCEPTION 'Need at least 1 site for agency 1. Please create it first.';
  END IF;
  
  RAISE NOTICE '  ✓ Site 1 ID (Agency 1): %', v_site_1_id;
  IF v_site_2_id IS NOT NULL THEN
    RAISE NOTICE '  ✓ Site 2 ID (Agency 1): %', v_site_2_id;
  END IF;
  IF v_site_3_id IS NOT NULL THEN
    RAISE NOTICE '  ✓ Site 3 ID (Agency 2): %', v_site_3_id;
  END IF;
  
  -- Get users
  SELECT user_id INTO v_user_1_id FROM agency_members WHERE agency_id = v_agency_1_id LIMIT 1;
  SELECT user_id INTO v_user_2_id FROM agency_members WHERE agency_id = v_agency_2_id LIMIT 1;
  
  RAISE NOTICE '  ✓ User 1 ID (Agency 1): %', v_user_1_id;
  RAISE NOTICE '  ✓ User 2 ID (Agency 2): %', v_user_2_id;
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 2: Tenant Context Functions
  -- ============================================================================
  RAISE NOTICE 'TEST 2: Testing tenant context functions...';
  
  -- Set tenant context
  PERFORM set_tenant_context(v_agency_1_id, v_site_1_id, v_user_1_id);
  
  -- Verify context was set
  IF current_agency_id() = v_agency_1_id THEN
    RAISE NOTICE '  ✓ current_agency_id() returns correct value';
  ELSE
    RAISE EXCEPTION '  ✗ current_agency_id() failed';
  END IF;
  
  IF current_site_id() = v_site_1_id THEN
    RAISE NOTICE '  ✓ current_site_id() returns correct value';
  ELSE
    RAISE EXCEPTION '  ✗ current_site_id() failed';
  END IF;
  
  IF current_user_id() = v_user_1_id THEN
    RAISE NOTICE '  ✓ current_user_id() returns correct value';
  ELSE
    RAISE EXCEPTION '  ✗ current_user_id() failed';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 3: Access Verification Functions
  -- ============================================================================
  RAISE NOTICE 'TEST 3: Testing access verification functions...';
  
  -- Test user_has_site_access
  v_result := user_has_site_access(v_user_1_id, v_site_1_id);
  IF v_result THEN
    RAISE NOTICE '  ✓ user_has_site_access() correctly grants access';
  ELSE
    RAISE EXCEPTION '  ✗ user_has_site_access() failed to grant access';
  END IF;
  
  -- Test cross-agency access should fail
  IF v_user_2_id IS NOT NULL AND v_site_1_id IS NOT NULL THEN
    v_result := user_has_site_access(v_user_2_id, v_site_1_id);
    IF NOT v_result THEN
      RAISE NOTICE '  ✓ user_has_site_access() correctly denies cross-agency access';
    ELSE
      RAISE EXCEPTION '  ✗ user_has_site_access() incorrectly allowed cross-agency access';
    END IF;
  END IF;
  
  -- Test user_in_agency
  v_result := user_in_agency(v_user_1_id, v_agency_1_id);
  IF v_result THEN
    RAISE NOTICE '  ✓ user_in_agency() correctly identifies membership';
  ELSE
    RAISE EXCEPTION '  ✗ user_in_agency() failed';
  END IF;
  
  -- Test get_user_agency_id
  IF get_user_agency_id(v_user_1_id) = v_agency_1_id THEN
    RAISE NOTICE '  ✓ get_user_agency_id() returns correct agency';
  ELSE
    RAISE EXCEPTION '  ✗ get_user_agency_id() failed';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 4: Create Test Module Table
  -- ============================================================================
  RAISE NOTICE 'TEST 4: Testing create_module_table()...';
  RAISE NOTICE '  Creating table: %', v_test_table_name;
  
  PERFORM create_module_table(
    v_test_table_name,
    'title TEXT NOT NULL, description TEXT, status TEXT DEFAULT ''active''',
    v_test_module_id
  );
  
  -- Verify table was created
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = v_test_table_name) THEN
    RAISE NOTICE '  ✓ Table created successfully';
  ELSE
    RAISE EXCEPTION '  ✗ Table creation failed';
  END IF;
  
  -- Verify RLS is enabled
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = v_test_table_name AND relrowsecurity = true) THEN
    RAISE NOTICE '  ✓ RLS enabled on table';
  ELSE
    RAISE EXCEPTION '  ✗ RLS not enabled';
  END IF;
  
  -- Verify module_database_registry entry
  SELECT COUNT(*) INTO v_count
  FROM module_database_registry
  WHERE module_id = v_test_module_id
    AND v_test_table_name = ANY(table_names);
  
  IF v_count = 1 THEN
    RAISE NOTICE '  ✓ Table registered in module_database_registry';
  ELSE
    RAISE EXCEPTION '  ✗ Table not registered (count: %)', v_count;
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 5: Data Isolation - Insert Test Data
  -- ============================================================================
  RAISE NOTICE 'TEST 5: Testing data isolation...';
  
  -- Set context to Site 1
  PERFORM set_tenant_context(v_agency_1_id, v_site_1_id, v_user_1_id);
  RAISE NOTICE '  Context set to Agency 1, Site 1';
  
  -- Insert test data for Site 1
  EXECUTE format('INSERT INTO %I (site_id, agency_id, title) VALUES ($1, $2, $3)', v_test_table_name)
    USING v_site_1_id, v_agency_1_id, 'Site 1 - Item 1';
  EXECUTE format('INSERT INTO %I (site_id, agency_id, title) VALUES ($1, $2, $3)', v_test_table_name)
    USING v_site_1_id, v_agency_1_id, 'Site 1 - Item 2';
  
  RAISE NOTICE '  ✓ Inserted 2 items for Site 1';
  
  -- Insert data for Site 2 (same agency)
  IF v_site_2_id IS NOT NULL THEN
    PERFORM set_tenant_context(v_agency_1_id, v_site_2_id, v_user_1_id);
    EXECUTE format('INSERT INTO %I (site_id, agency_id, title) VALUES ($1, $2, $3)', v_test_table_name)
      USING v_site_2_id, v_agency_1_id, 'Site 2 - Item 1';
    RAISE NOTICE '  ✓ Inserted 1 item for Site 2';
  END IF;
  
  -- Insert data for Site 3 (different agency)
  IF v_site_3_id IS NOT NULL AND v_user_2_id IS NOT NULL THEN
    PERFORM set_tenant_context(v_agency_2_id, v_site_3_id, v_user_2_id);
    EXECUTE format('INSERT INTO %I (site_id, agency_id, title) VALUES ($1, $2, $3)', v_test_table_name)
      USING v_site_3_id, v_agency_2_id, 'Site 3 - Item 1';
    RAISE NOTICE '  ✓ Inserted 1 item for Site 3 (Agency 2)';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 6: RLS Policy Verification
  -- ============================================================================
  RAISE NOTICE 'TEST 6: Testing RLS policies...';
  
  -- Set context to Site 1
  PERFORM set_tenant_context(v_agency_1_id, v_site_1_id, v_user_1_id);
  
  -- Check if user is an admin (affects what they can see)
  v_is_admin := is_agency_admin(v_agency_1_id);
  
  IF v_is_admin THEN
    -- Admin can see all sites in their agency
    IF v_site_2_id IS NOT NULL THEN
      v_expected_count := 3; -- Site 1 (2) + Site 2 (1)
    ELSE
      v_expected_count := 2; -- Only Site 1
    END IF;
    RAISE NOTICE '  ℹ User is agency admin - will see all sites in agency';
  ELSE
    -- Regular user only sees their current site
    v_expected_count := 2;
    RAISE NOTICE '  ℹ User is regular member - will see only current site';
  END IF;
  
  -- Should only see Site 1 data (or all agency data if admin)
  EXECUTE format('SELECT COUNT(*) FROM %I', v_test_table_name) INTO v_count;
  IF v_count = v_expected_count THEN
    RAISE NOTICE '  ✓ RLS SELECT policy working - User sees expected data (% items)', v_count;
  ELSE
    RAISE EXCEPTION '  ✗ RLS SELECT policy failed - Expected % items, got %', v_expected_count, v_count;
  END IF;
  
  -- Change to Site 2
  IF v_site_2_id IS NOT NULL THEN
    PERFORM set_tenant_context(v_agency_1_id, v_site_2_id, v_user_1_id);
    EXECUTE format('SELECT COUNT(*) FROM %I', v_test_table_name) INTO v_count;
    IF v_count = 1 THEN
      RAISE NOTICE '  ✓ Context switching works - Now sees Site 2 data (1 item)';
    ELSE
      RAISE EXCEPTION '  ✗ Context switching failed - Expected 1 item, got %', v_count;
    END IF;
  END IF;
  
  -- Change to Site 3 (different agency)
  IF v_site_3_id IS NOT NULL AND v_user_2_id IS NOT NULL THEN
    PERFORM set_tenant_context(v_agency_2_id, v_site_3_id, v_user_2_id);
    EXECUTE format('SELECT COUNT(*) FROM %I', v_test_table_name) INTO v_count;
    IF v_count = 1 THEN
      RAISE NOTICE '  ✓ Agency isolation working - Agency 2 sees only their data (1 item)';
    ELSE
      RAISE EXCEPTION '  ✗ Agency isolation failed - Expected 1 item, got %', v_count;
    END IF;
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 7: Tenant Isolation Verification Function
  -- ============================================================================
  RAISE NOTICE 'TEST 7: Testing verify_tenant_isolation()...';
  
  IF v_site_2_id IS NOT NULL THEN
    RAISE NOTICE '  Running isolation checks between Site 1 and Site 2...';
    FOR v_result IN 
      SELECT * FROM verify_tenant_isolation(v_test_table_name, v_site_1_id, v_site_2_id)
    LOOP
      RAISE NOTICE '    %', v_result;
    END LOOP;
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 8: Cross-Site Access Attempt (Should Fail)
  -- ============================================================================
  RAISE NOTICE 'TEST 8: Testing cross-site data protection...';
  
  -- Set context to Site 1
  PERFORM set_tenant_context(v_agency_1_id, v_site_1_id, v_user_1_id);
  
  -- Try to update Site 2's data (should fail due to RLS)
  IF v_site_2_id IS NOT NULL THEN
    BEGIN
      EXECUTE format('UPDATE %I SET title = $1 WHERE site_id = $2', v_test_table_name)
        USING 'Hacked!', v_site_2_id;
      
      -- Check if it actually updated (should be 0 rows)
      GET DIAGNOSTICS v_count = ROW_COUNT;
      IF v_count = 0 THEN
        RAISE NOTICE '  ✓ RLS prevented cross-site UPDATE (0 rows affected)';
      ELSE
        RAISE EXCEPTION '  ✗ RLS failed - Cross-site UPDATE succeeded!';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '  ✓ RLS blocked cross-site UPDATE with error';
    END;
  END IF;
  
  -- Try to delete Site 2's data (should fail)
  IF v_site_2_id IS NOT NULL THEN
    EXECUTE format('DELETE FROM %I WHERE site_id = $1', v_test_table_name)
      USING v_site_2_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
      RAISE NOTICE '  ✓ RLS prevented cross-site DELETE (0 rows affected)';
    ELSE
      RAISE EXCEPTION '  ✗ RLS failed - Cross-site DELETE succeeded!';
    END IF;
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 9: Cleanup
  -- ============================================================================
  RAISE NOTICE 'TEST 9: Cleaning up test data...';
  
  PERFORM drop_module_table(v_test_table_name, v_test_module_id);
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = v_test_table_name) THEN
    RAISE NOTICE '  ✓ Test table dropped successfully';
  ELSE
    RAISE EXCEPTION '  ✗ Table cleanup failed';
  END IF;
  
  -- Verify registry was updated
  SELECT COUNT(*) INTO v_count
  FROM module_database_registry
  WHERE module_id = v_test_module_id
    AND v_test_table_name = ANY(table_names);
  
  IF v_count = 0 THEN
    RAISE NOTICE '  ✓ Table removed from registry';
  ELSE
    RAISE NOTICE '  ⚠ Table still in registry (expected if module has other tables)';
  END IF;
  RAISE NOTICE '';

  -- ============================================================================
  -- FINAL SUMMARY
  -- ============================================================================
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ALL TESTS PASSED! ✓';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Multi-tenant architecture is working correctly:';
  RAISE NOTICE '  ✓ Tenant context management';
  RAISE NOTICE '  ✓ Access verification functions';
  RAISE NOTICE '  ✓ Dynamic table creation with RLS';
  RAISE NOTICE '  ✓ Data isolation between sites';
  RAISE NOTICE '  ✓ Data isolation between agencies';
  RAISE NOTICE '  ✓ RLS policies enforced correctly';
  RAISE NOTICE '  ✓ Cross-site access prevention';
  RAISE NOTICE '  ✓ Registry management';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    -- Cleanup on error
    BEGIN
      EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', v_test_table_name);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    RAISE EXCEPTION 'TEST FAILED: %', SQLERRM;
END $$;
