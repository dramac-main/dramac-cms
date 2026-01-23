# Phase 81B Testing Script

## Prerequisites ✅
- [x] Test site created
- [x] Agency enrolled in beta program
- [ ] Module in "testing" status exists

## 🚨 CRITICAL: How to Put Module in Testing Status

**You don't need SQL!** Use the built-in Deploy feature:

1. **Go to Module Studio** → Edit your module
2. **Click "Deploy" button** (top-right toolbar)
3. **Select "Staging" environment** (NOT Production!)
4. **Add changelog** (e.g., "Beta testing release")
5. **Click "Deploy to Staging"**

**Result:** Module status automatically changes to `testing` ✅

**Key Discovery:** 
- **Staging Deploy** = Testing/Beta status
- **Production Deploy** = Published status

See [HOW-TO-DEPLOY-MODULE-TO-BETA.md](./HOW-TO-DEPLOY-MODULE-TO-BETA.md) for complete guide.

---

## Test 1: Test Site Module Visibility

### What to Test
Verify that test sites can see testing modules while regular sites cannot.

### Steps
1. **Go to your test site's module marketplace**
   - Navigate to: `/sites/[test-site-slug]/modules`
   - Should see both published AND testing modules
   - Testing modules should have a "BETA" or "TESTING" badge

2. **Go to a regular (non-test) site's marketplace**
   - Navigate to: `/sites/[regular-site-slug]/modules`
   - Should ONLY see published modules
   - Testing modules should NOT appear

### Expected Result
- ✅ Test site shows testing modules
- ✅ Regular site hides testing modules
- ✅ Badge/indicator shows module status

### SQL to Verify
```sql
-- Check if site is configured as test site
SELECT * FROM test_site_configuration 
WHERE site_id = 'YOUR_TEST_SITE_ID' AND is_active = true;

-- Should return: is_active=true, allowed_module_statuses includes 'testing'
```

---

## Test 2: Module Installation on Test Site

### What to Test
Install a testing module on the test site and verify it works.

### Steps
1. **Create a testing module** (if you don't have one)
   
   **RECOMMENDED: Use Deploy Button**
   - Go to Module Studio → Select module
   - Click "Deploy" button
   - Choose "Staging" environment
   - Add changelog
   - Deploy ✅
   
   **Alternative: SQL (not recommended)**
   ```sql
   -- Manual override (bypasses version control)
   UPDATE module_source 
   SET status = 'testing'
   WHERE slug = 'your-module-slug';
   ```

2. **Install on test site**
   - Go to test site modules page
   - Click "Install" on a testing module
   - Configure settings if any
   - Save installation

3. **Verify installation**
   - Check `site_module_installations` table
   - Module should appear in site's installed modules list
   - Module should be renderable in editor

4. **Try installing on regular site**
   - Should fail or not show the option
   - Testing modules should be filtered out

### Expected Result
- ✅ Testing module installs on test site
- ✅ Installation persists in database
- ✅ Module appears in site's module list
- ❌ Testing module NOT available on regular sites

### SQL to Verify
```sql
-- Check installation
SELECT smi.*, ms.status, s.name as site_name
FROM site_module_installations smi
JOIN module_source ms ON ms.id = smi.module_source_id
JOIN sites s ON s.id = smi.site_id
WHERE ms.status = 'testing'
ORDER BY smi.installed_at DESC;
```

---

## Test 3: Run All Test Types

### What to Test
Execute each test type and verify results are captured.

### Steps (via API or Testing Dashboard)

#### 3A. Run Unit Tests
```typescript
// Call this function or use the testing UI
import { runModuleTests } from '@/lib/modules/module-testing';

const result = await runModuleTests('module-id', 'unit');
console.log('Unit test results:', result);
```

**Expected checks:**
- ✅ Has export statement
- ✅ Balanced braces
- ✅ No console logs (warning)
- ✅ Valid settings schema
- ✅ Has description

#### 3B. Run Integration Tests
```typescript
const result = await runModuleTests('module-id', 'integration', 'test-site-id');
```

**Expected checks:**
- ✅ Module installation
- ✅ Settings persistence
- ✅ Module renders

#### 3C. Run Performance Tests
```typescript
const result = await runModuleTests('module-id', 'performance');
```

**Expected checks:**
- ✅ Code size < 50KB
- ✅ CSS size < 20KB
- ✅ Dependencies < 5

#### 3D. Run Accessibility Tests
```typescript
const result = await runModuleTests('module-id', 'accessibility');
```

**Expected checks:**
- ✅ Alt attributes on images
- ✅ ARIA labels
- ✅ Semantic HTML

#### 3E. Run Security Tests
```typescript
const result = await runModuleTests('module-id', 'security');
```

**Expected checks:**
- ✅ No eval()
- ✅ No innerHTML
- ✅ No document.write
- ✅ HTTPS URLs

### Expected Result
- ✅ Each test type executes without errors
- ✅ Results are logical and accurate
- ✅ Status is "passed", "failed", or "warning"
- ✅ All results saved to database

### SQL to Verify
```sql
-- Check test runs
SELECT 
  mtr.*,
  ms.name as module_name,
  (SELECT COUNT(*) FROM module_test_results WHERE test_run_id = mtr.id) as result_count
FROM module_test_runs mtr
JOIN module_source ms ON ms.id = mtr.module_source_id
ORDER BY mtr.started_at DESC
LIMIT 10;

-- Check individual test results
SELECT * FROM module_test_results
WHERE test_run_id = 'your-test-run-id'
ORDER BY category, test_name;
```

---

## Test 4: Beta Agency Permissions

### What to Test
Verify beta tier permissions work correctly.

### Steps

#### 4A. Test "Internal" Tier
```sql
-- Set agency to internal tier
UPDATE beta_enrollment 
SET beta_tier = 'internal'
WHERE agency_id = 'YOUR_AGENCY_ID';
```

- Login as user from this agency
- Should see ALL testing modules immediately
- No opt-in required

#### 4B. Test "Alpha" Tier
```sql
UPDATE beta_enrollment 
SET beta_tier = 'alpha'
WHERE agency_id = 'YOUR_AGENCY_ID';
```

- Should see ALL testing modules
- Similar to internal but different badge

#### 4C. Test "Early Access" Tier
```sql
UPDATE beta_enrollment 
SET beta_tier = 'early_access'
WHERE agency_id = 'YOUR_AGENCY_ID';
```

- With auto_enroll_new_betas = true: See all testing modules
- With auto_enroll_new_betas = false: Must opt-in per module

#### 4D. Test "Standard" Tier
```sql
UPDATE beta_enrollment 
SET beta_tier = 'standard'
WHERE agency_id = 'YOUR_AGENCY_ID';
```

- Must opt-in to each module individually
- Only opted-in modules visible

### Expected Result
- ✅ Internal/Alpha: All testing modules visible
- ✅ Early Access: Respects auto_enroll preference
- ✅ Standard: Only opted-in modules visible
- ✅ Non-beta agencies: No testing modules visible

---

## Test 5: Module Opt-In Flow

### What to Test
Agency can opt-in to specific testing modules.

### Steps
1. **Set agency to standard beta tier**
   ```sql
   UPDATE beta_enrollment 
   SET beta_tier = 'standard',
       preferences = '{"receiveNotifications": true, "autoEnrollNewBetas": false}'
   WHERE agency_id = 'YOUR_AGENCY_ID';
   ```

2. **Opt into a module**
   ```typescript
   import { optIntoModule } from '@/lib/modules/beta-program';
   
   const result = await optIntoModule('agency-id', 'module-slug');
   console.log('Opt-in result:', result);
   ```

3. **Verify module now visible**
   - Login as user from agency
   - Module should now appear in marketplace
   - Other testing modules still hidden

4. **Opt into another module**
   - Repeat process
   - Both modules now visible

### Expected Result
- ✅ Module appears after opt-in
- ✅ Other testing modules remain hidden
- ✅ Can opt-in to multiple modules
- ✅ Opted modules persist in database

### SQL to Verify
```sql
SELECT 
  agency_id,
  beta_tier,
  array_length(accepted_modules, 1) as opted_module_count,
  accepted_modules
FROM beta_enrollment
WHERE agency_id = 'YOUR_AGENCY_ID';
```

---

## Test 6: Test Results Persistence

### What to Test
Test results are saved and can be retrieved.

### Steps
1. **Run multiple tests on same module**
   ```typescript
   await runModuleTests('module-id', 'unit');
   await runModuleTests('module-id', 'integration', 'test-site-id');
   await runModuleTests('module-id', 'performance');
   ```

2. **Retrieve test history**
   ```typescript
   import { getModuleTestHistory } from '@/lib/modules/module-testing';
   
   const history = await getModuleTestHistory('module-id', 10);
   console.log('Test history:', history);
   ```

3. **Verify in database**
   ```sql
   -- Check runs
   SELECT * FROM module_test_runs
   WHERE module_source_id = 'module-id'
   ORDER BY started_at DESC;
   
   -- Check results for a specific run
   SELECT * FROM module_test_results
   WHERE test_run_id = 'run-id';
   ```

### Expected Result
- ✅ All test runs stored
- ✅ Each run has results
- ✅ History ordered by date (newest first)
- ✅ Can retrieve by module ID

---

## Test 7: Complete End-to-End Flow

### Scenario
Module developer creates testing module → Beta agency tests → Module goes live

### Steps

1. **Create module in testing status**
   - Build module in Module Studio
   - Set status to "testing"
   - Module NOT visible to regular users

2. **Assign test site**
   - Configure site as test site
   - Verify module appears in test site marketplace

3. **Install on test site**
   - Install module
   - Configure settings
   - Test in visual editor

4. **Run automated tests**
   - Execute all 5 test types
   - Review results
   - Fix any failures

5. **Beta agency access**
   - Enroll agency in beta (standard tier)
   - Agency opts into module
   - Agency installs on their site

6. **Collect feedback**
   - Beta users test module
   - Report issues if any
   - Developer fixes issues

7. **Publish module**
   ```sql
   UPDATE module_source 
   SET status = 'published'
   WHERE slug = 'module-slug';
   ```

8. **Verify production access**
   - Module now visible to ALL agencies
   - Can be installed on any site
   - Test site no longer special

### Expected Result
- ✅ Complete workflow executes smoothly
- ✅ Access control works at each stage
- ✅ Testing catches issues before production
- ✅ Published module available to everyone

---

## Test 8: Edge Cases

### What to Test
Unusual scenarios and error handling.

### Test Cases

#### 8A. Expired Test Site
```sql
-- Set test site to expire yesterday
UPDATE test_site_configuration 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE site_id = 'YOUR_TEST_SITE_ID';
```
- ✅ Testing modules should no longer be visible
- ✅ Site behaves like regular site

#### 8B. Deactivated Beta Enrollment
```sql
UPDATE beta_enrollment 
SET is_active = false
WHERE agency_id = 'YOUR_AGENCY_ID';
```
- ✅ Agency loses access to testing modules
- ✅ Published modules still visible

#### 8C. Module Deleted During Testing
```sql
-- Delete module that has active test runs
DELETE FROM module_source WHERE id = 'module-id';
```
- ✅ Test runs cascade delete (or remain as orphans)
- ✅ No errors thrown

#### 8D. Non-Beta Agency Tries to Access Testing Module
- Direct URL navigation attempt
- ✅ Should be blocked
- ✅ Proper error message

---

## Test 9: UI/Dashboard Tests

### What to Test
Testing dashboard interface works correctly.

### Steps
1. **Visit testing dashboard**
   - Navigate to: `/admin/modules/testing`
   - Should only work for super admins

2. **Test Sites Tab**
   - View list of test sites
   - Add new test site
   - Edit test site configuration
   - Remove test site

3. **Beta Enrollments Tab**
   - View enrolled agencies
   - Change beta tier
   - View opted-in modules
   - Enroll new agency

4. **Test Results Tab** (if implemented)
   - View recent test runs
   - Filter by module
   - Filter by test type
   - View detailed results

### Expected Result
- ✅ UI loads without errors
- ✅ All actions persist changes
- ✅ Real-time updates work
- ✅ Proper access control

---

## Test 10: Performance & Scale

### What to Test
System performs well under load.

### Test Cases

1. **Multiple test runs simultaneously**
   ```typescript
   // Run 10 tests concurrently
   const promises = Array(10).fill(0).map((_, i) => 
     runModuleTests(`module-${i}`, 'unit')
   );
   await Promise.all(promises);
   ```
   - ✅ All complete successfully
   - ✅ No race conditions
   - ✅ Results all persist

2. **Large module test**
   - Create module with 100KB+ code
   - Run all test types
   - ✅ Performance tests flag large size
   - ✅ Tests complete in reasonable time

3. **Many beta enrollments**
   ```sql
   -- Enroll 100 agencies
   INSERT INTO beta_enrollment (agency_id, beta_tier)
   SELECT id, 'standard' FROM agencies LIMIT 100;
   ```
   - ✅ Dashboard loads quickly
   - ✅ Queries remain fast

---

## Verification SQL Queries

Run these to verify the system is working:

```sql
-- Overview of test system
SELECT 
  (SELECT COUNT(*) FROM test_site_configuration WHERE is_active = true) as active_test_sites,
  (SELECT COUNT(*) FROM beta_enrollment WHERE is_active = true) as beta_agencies,
  (SELECT COUNT(*) FROM module_source WHERE status = 'testing') as testing_modules,
  (SELECT COUNT(*) FROM module_test_runs) as total_test_runs,
  (SELECT COUNT(*) FROM module_test_runs WHERE status = 'passed') as passed_runs,
  (SELECT COUNT(*) FROM module_test_runs WHERE status = 'failed') as failed_runs;

-- Recent test activity
SELECT 
  ms.name as module_name,
  mtr.test_type,
  mtr.status,
  mtr.started_at,
  (SELECT COUNT(*) FROM module_test_results WHERE test_run_id = mtr.id) as test_count
FROM module_test_runs mtr
JOIN module_source ms ON ms.id = mtr.module_source_id
ORDER BY mtr.started_at DESC
LIMIT 20;

-- Beta agency access
SELECT 
  a.name as agency_name,
  be.beta_tier,
  be.enrolled_at,
  array_length(be.accepted_modules, 1) as opted_modules,
  be.is_active
FROM beta_enrollment be
JOIN agencies a ON a.id = be.agency_id
ORDER BY be.enrolled_at DESC;

-- Test site configurations
SELECT 
  s.name as site_name,
  s.slug,
  tsc.test_features,
  tsc.allowed_module_statuses,
  tsc.expires_at,
  tsc.is_active
FROM test_site_configuration tsc
JOIN sites s ON s.id = tsc.site_id
WHERE tsc.is_active = true;
```

---

## Success Criteria

Phase 81B is fully tested when:

- ✅ All 10 test sections pass
- ✅ No errors in test execution
- ✅ Test site isolation works
- ✅ Beta program permissions work
- ✅ All 5 test types execute successfully
- ✅ Results persist and are retrievable
- ✅ UI/Dashboard fully functional
- ✅ Edge cases handled gracefully
- ✅ Performance acceptable
- ✅ SQL verification queries show expected data

---

## Common Issues & Solutions

### Issue: Testing modules visible to everyone
**Solution:** Check `module_source.status` is "testing" not "published"

### Issue: Test site can't see testing modules
**Solution:** Verify `test_site_configuration.allowed_module_statuses` includes "testing"

### Issue: Beta agency can't access modules
**Solution:** Check `beta_enrollment.is_active = true` and tier permissions

### Issue: Tests not running
**Solution:** Check `module_test_runs` table exists and server actions work

### Issue: Test results not persisting
**Solution:** Verify `module_test_results` foreign key and permissions

---

## Next Steps After Testing

Once Phase 81B is fully tested:

1. **Document findings** - Note any bugs or improvements needed
2. **Fix critical issues** - Address show-stoppers before proceeding
3. **Optimize performance** - Improve any slow queries or operations
4. **Move to Phase 81C** - Advanced module development features
5. **Establish testing process** - Make this part of standard workflow

---

## Questions to Validate

- [ ] Can multiple test sites exist simultaneously?
- [ ] Can an agency be in multiple beta tiers? (No - should be one tier)
- [ ] What happens if module is published while tests are running?
- [ ] Can test results be deleted? (Should be retained for audit)
- [ ] Do test site configurations inherit? (e.g., from agency to sites)
- [ ] Should there be test expiry? (e.g., module must publish within 30 days)

---

## Automated Testing Script

```typescript
// test-phase-81b.ts
// Run all tests programmatically

import { runModuleTests, getModuleTestHistory } from '@/lib/modules/module-testing';
import { canSiteUseTestingModules } from '@/lib/modules/test-site-manager';
import { canAgencyAccessModule } from '@/lib/modules/beta-program';

async function runComprehensiveTests() {
  console.log('🧪 Starting Phase 81B Comprehensive Tests...\n');
  
  const moduleId = 'YOUR_MODULE_ID';
  const testSiteId = 'YOUR_TEST_SITE_ID';
  const agencyId = 'YOUR_AGENCY_ID';
  
  // Test 1: Test site check
  console.log('Test 1: Checking test site configuration...');
  const canUseTestingModules = await canSiteUseTestingModules(testSiteId);
  console.log(canUseTestingModules ? '✅ PASS' : '❌ FAIL');
  
  // Test 2: Agency access
  console.log('\nTest 2: Checking agency beta access...');
  const canAccess = await canAgencyAccessModule(agencyId, 'test-module', 'testing');
  console.log(canAccess ? '✅ PASS' : '❌ FAIL');
  
  // Test 3: Unit tests
  console.log('\nTest 3: Running unit tests...');
  const unitResults = await runModuleTests(moduleId, 'unit');
  console.log(unitResults.status === 'passed' ? '✅ PASS' : '❌ FAIL');
  
  // Test 4: Integration tests
  console.log('\nTest 4: Running integration tests...');
  const integrationResults = await runModuleTests(moduleId, 'integration', testSiteId);
  console.log(integrationResults.status === 'passed' ? '✅ PASS' : '❌ FAIL');
  
  // Test 5: Performance tests
  console.log('\nTest 5: Running performance tests...');
  const perfResults = await runModuleTests(moduleId, 'performance');
  console.log(perfResults.status === 'passed' ? '✅ PASS' : '❌ FAIL');
  
  // Test 6: Accessibility tests
  console.log('\nTest 6: Running accessibility tests...');
  const a11yResults = await runModuleTests(moduleId, 'accessibility');
  console.log(a11yResults.status === 'passed' ? '✅ PASS' : '❌ FAIL');
  
  // Test 7: Security tests
  console.log('\nTest 7: Running security tests...');
  const secResults = await runModuleTests(moduleId, 'security');
  console.log(secResults.status === 'passed' ? '✅ PASS' : '❌ FAIL');
  
  // Test 8: Test history
  console.log('\nTest 8: Retrieving test history...');
  const history = await getModuleTestHistory(moduleId);
  console.log(history.length > 0 ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n🎉 Testing complete!');
}

// Run: npx tsx scripts/test-phase-81b.ts
runComprehensiveTests();
```

---

**Happy Testing! 🧪**
