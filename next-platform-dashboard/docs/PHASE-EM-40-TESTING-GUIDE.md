# Phase EM-40: Multi-Tenant Architecture Testing Guide

## 🧪 Testing Overview

This guide provides comprehensive testing procedures to verify the multi-tenant architecture is working correctly with your real database.

## Prerequisites

Before running tests, ensure:
- ✅ Migration `20260125_multi_tenant_foundation.sql` has been applied
- ✅ Database has at least 2 agencies with sites
- ✅ Users are members of these agencies

## Quick Test (Automated SQL Test)

### 1. Run the Automated Test Suite

```bash
psql -d your_database -f migrations/tests/20260125_test_multi_tenant.sql
```

This will automatically:
- ✅ Test all tenant context functions
- ✅ Test access verification
- ✅ Create a test module table with RLS
- ✅ Test data isolation between sites
- ✅ Verify RLS policies work
- ✅ Test cross-site access prevention
- ✅ Clean up test data

**Expected Output:**
```
NOTICE: ============================================================================
NOTICE: PHASE EM-40 MULTI-TENANT ARCHITECTURE TEST SUITE
NOTICE: ============================================================================
...
NOTICE: ALL TESTS PASSED! ✓
```

If any test fails, you'll see a clear error message indicating what went wrong.

---

## Manual Testing Steps

### Test 1: Verify Functions Exist

```sql
-- Check all new functions were created
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'set_tenant_context',
    'current_agency_id',
    'current_site_id',
    'current_user_id',
    'user_has_site_access',
    'user_in_agency',
    'get_user_agency_id',
    'get_user_agency_role',
    'create_module_table',
    'drop_module_table',
    'verify_tenant_isolation'
  )
ORDER BY p.proname;
```

**Expected:** Should return 11 functions.

### Test 2: Verify Tables Exist

```sql
-- Check new tables
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('module_access_logs')
  AND schemaname = 'public';

-- Check status column was added to module_database_registry
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'module_database_registry'
  AND column_name = 'status';
```

**Expected:** 
- `module_access_logs` exists with RLS enabled
- `status` column exists in `module_database_registry`

### Test 3: Test Tenant Context

```sql
-- Set tenant context (replace with real IDs)
SELECT set_tenant_context(
  'YOUR_AGENCY_ID'::UUID,
  'YOUR_SITE_ID'::UUID,
  'YOUR_USER_ID'::UUID
);

-- Verify context was set
SELECT 
  current_agency_id() as agency,
  current_site_id() as site,
  current_user_id() as user_id;
```

**Expected:** Should return the IDs you set.

### Test 4: Test Access Verification

```sql
-- Get test data
SELECT 
  am.user_id,
  am.agency_id,
  s.id as site_id,
  s.name as site_name
FROM agency_members am
JOIN sites s ON s.agency_id = am.agency_id
LIMIT 5;

-- Test user_has_site_access (replace with real IDs)
SELECT user_has_site_access(
  'USER_ID'::UUID,
  'SITE_ID'::UUID
) as has_access;

-- Test user_in_agency
SELECT user_in_agency(
  'USER_ID'::UUID,
  'AGENCY_ID'::UUID
) as in_agency;

-- Test get_user_agency_id
SELECT get_user_agency_id('USER_ID'::UUID) as user_agency;
```

**Expected:** Functions return appropriate boolean/UUID values.

### Test 5: Create a Test Module Table

```sql
-- Create a test module table
DO $$
DECLARE
  v_module_id UUID := gen_random_uuid();
  v_table_name TEXT := 'mod_' || substring(v_module_id::TEXT from 1 for 8) || '_test';
BEGIN
  PERFORM create_module_table(
    v_table_name,
    'name TEXT NOT NULL, value INTEGER DEFAULT 0',
    v_module_id
  );
  
  RAISE NOTICE 'Created table: %', v_table_name;
  RAISE NOTICE 'Module ID: %', v_module_id;
END $$;
```

**Expected:** Table created with RLS enabled and proper policies.

### Test 6: Verify RLS Policies

```sql
-- List policies on your test table (replace table name)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename LIKE 'mod_%_test'
ORDER BY policyname;
```

**Expected:** Should see 5 policies:
- `site_select_mod_*`
- `site_insert_mod_*`
- `site_update_mod_*`
- `site_delete_mod_*`
- `admin_all_mod_*`

### Test 7: Test Data Isolation

```sql
DO $$
DECLARE
  v_agency_id UUID;
  v_site_1_id UUID;
  v_site_2_id UUID;
  v_user_id UUID;
  v_table TEXT := 'YOUR_TEST_TABLE_NAME'; -- Replace with actual table
  v_count INTEGER;
BEGIN
  -- Get test IDs
  SELECT id INTO v_agency_id FROM agencies LIMIT 1;
  SELECT id INTO v_site_1_id FROM sites WHERE agency_id = v_agency_id LIMIT 1;
  SELECT id INTO v_site_2_id FROM sites WHERE agency_id = v_agency_id LIMIT 1 OFFSET 1;
  SELECT user_id INTO v_user_id FROM agency_members WHERE agency_id = v_agency_id LIMIT 1;
  
  -- Insert data for Site 1
  PERFORM set_tenant_context(v_agency_id, v_site_1_id, v_user_id);
  EXECUTE format('INSERT INTO %I (site_id, agency_id, name) VALUES ($1, $2, $3)', v_table)
    USING v_site_1_id, v_agency_id, 'Site 1 Item';
  
  -- Insert data for Site 2
  PERFORM set_tenant_context(v_agency_id, v_site_2_id, v_user_id);
  EXECUTE format('INSERT INTO %I (site_id, agency_id, name) VALUES ($1, $2, $3)', v_table)
    USING v_site_2_id, v_agency_id, 'Site 2 Item';
  
  -- Switch back to Site 1 - should only see 1 item
  PERFORM set_tenant_context(v_agency_id, v_site_1_id, v_user_id);
  EXECUTE format('SELECT COUNT(*) FROM %I', v_table) INTO v_count;
  
  IF v_count = 1 THEN
    RAISE NOTICE '✓ RLS working! Site 1 sees only their data (% items)', v_count;
  ELSE
    RAISE EXCEPTION '✗ RLS failed! Site 1 sees % items (expected 1)', v_count;
  END IF;
  
  -- Switch to Site 2 - should see 1 item
  PERFORM set_tenant_context(v_agency_id, v_site_2_id, v_user_id);
  EXECUTE format('SELECT COUNT(*) FROM %I', v_table) INTO v_count;
  
  IF v_count = 1 THEN
    RAISE NOTICE '✓ Data isolation working! Site 2 sees only their data (% items)', v_count;
  ELSE
    RAISE EXCEPTION '✗ Isolation failed! Site 2 sees % items (expected 1)', v_count;
  END IF;
END $$;
```

**Expected:** Both RAISE NOTICE messages with ✓ checkmarks.

---

## Integration Tests (TypeScript/Application Level)

### Test 1: Tenant Context in API Routes

Create a test file: `src/app/api/test-tenant/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/multi-tenant/tenant-context';

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext();
    
    if (!context) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      context: {
        userId: context.userId,
        agencyId: context.agencyId,
        siteId: context.siteId,
        role: context.role
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
```

**Test:** 
```bash
curl http://localhost:3000/api/test-tenant
```

**Expected:** Returns tenant context JSON.

### Test 2: Tenant Data Access

Create: `src/app/api/test-module-data/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/multi-tenant/tenant-context';
import { createTenantDataAccess } from '@/lib/modules/database';

export async function GET() {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: 'No context' }, { status: 403 });
    }
    
    // This would use your actual module prefix
    const dataAccess = createTenantDataAccess('test_mod', context);
    
    // Try to query (will fail if no table exists, which is fine for testing)
    try {
      const records = await dataAccess.from('items').selectAll();
      return NextResponse.json({ 
        success: true, 
        recordCount: records.length,
        context: { siteId: context.siteId }
      });
    } catch (err) {
      return NextResponse.json({ 
        success: true,
        message: 'No table yet, but tenant context works!',
        context: { siteId: context.siteId }
      });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown' 
    }, { status: 500 });
  }
}
```

### Test 3: React Hook Usage

Create a test page: `src/app/(dashboard)/test-tenant-hook/page.tsx`

```typescript
'use client';

import { useTenant } from '@/lib/multi-tenant/hooks';

export default function TestTenantHookPage() {
  const { 
    agencyId, 
    siteId, 
    role, 
    isLoading, 
    error 
  } = useTenant();
  
  if (isLoading) return <div>Loading tenant context...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tenant Context Test</h1>
      <div className="space-y-2">
        <p><strong>Agency ID:</strong> {agencyId}</p>
        <p><strong>Site ID:</strong> {siteId || 'None selected'}</p>
        <p><strong>Role:</strong> {role}</p>
      </div>
    </div>
  );
}
```

**Test:** Navigate to `/test-tenant-hook` in your dashboard.

**Expected:** Shows your tenant context data.

---

## Cleanup Test Data

After running manual tests, clean up:

```sql
-- Drop any test tables you created
DROP TABLE IF EXISTS mod_XXXXXXXX_test CASCADE;

-- Remove from registry
DELETE FROM module_database_registry 
WHERE module_id = 'YOUR_TEST_MODULE_ID';
```

---

## ✅ Success Criteria

Your multi-tenant architecture is working if:

1. ✅ All functions exist and execute without errors
2. ✅ Tenant context can be set and retrieved
3. ✅ RLS policies prevent cross-site data access
4. ✅ Users can only see data for their current site
5. ✅ Agency admins can see all sites in their agency
6. ✅ Different agencies cannot see each other's data
7. ✅ TypeScript code compiles without errors
8. ✅ API routes can access tenant context
9. ✅ React hooks provide tenant information

---

## 🐛 Troubleshooting

### Issue: "No tenant context found"

**Cause:** User not logged in or no agency membership

**Fix:** Ensure user has completed onboarding and is member of an agency

### Issue: "RLS policy blocked operation"

**Cause:** Trying to access data without setting tenant context

**Fix:** Call `setDatabaseContext()` or use tenant-aware data access layers

### Issue: "Function doesn't exist"

**Cause:** Migration not run or partially failed

**Fix:** Re-run migration: `psql -d db -f migrations/20260125_multi_tenant_foundation.sql`

### Issue: "Cross-site data visible"

**Cause:** RLS not enabled or policies not created

**Fix:** Check `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and policy creation

---

## 📊 Performance Testing

Check RLS overhead:

```sql
EXPLAIN ANALYZE
SELECT * FROM your_module_table
WHERE site_id = 'YOUR_SITE_ID';
```

Compare with RLS context:

```sql
SELECT set_tenant_context('AGENCY_ID', 'SITE_ID', 'USER_ID');

EXPLAIN ANALYZE
SELECT * FROM your_module_table;
```

**Expected:** Minimal overhead (<10% slower with RLS).

---

## Next Steps

Once all tests pass:
1. ✅ Mark EM-40 as fully tested and verified
2. ✅ Update existing modules to use tenant-aware data access
3. ✅ Document migration path for existing module data
4. 🚀 Move to EM-41: Versioning & Rollback
