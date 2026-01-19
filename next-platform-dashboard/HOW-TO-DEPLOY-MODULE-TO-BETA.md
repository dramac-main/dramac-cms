# 🚀 How to Deploy a Module to Beta (Testing Status)

## ✅ Good News: The System Already Exists!

The deployment workflow is **already built** and working. Here's how to use it:

---

## 🎯 The Complete Workflow

```
Draft → Testing (Beta) → Published (Production)
  │         │                    │
  │         │                    │
Studio   Staging Deploy      Production Deploy
         (Beta Testing)       (Everyone)
```

---

## 📋 Step-by-Step: Deploy Module to Beta

### Step 1: Create/Edit Your Module in Studio

1. Go to: `/admin/modules/studio`
2. Create new module or edit existing one
3. Build your module:
   - Name, description, icon
   - Render code (React component)
   - Settings schema (JSON)
   - Styles (CSS)
4. **Save** your changes

### Step 2: Deploy to Staging (Beta/Testing)

1. **Click the "Deploy" button** in Module Studio
   - It's in the top-right toolbar next to "Save Changes"
   
2. **In the Deploy Dialog:**
   - **Environment**: Select **"Staging"** ⚠️ (this is the beta testing environment)
   - **Version Type**: Choose patch/minor/major
   - **Changelog**: Describe what changed (required!)
   - Click **"Deploy to Staging"**

3. **What Happens Automatically:**
   - ✅ Creates a new version
   - ✅ Changes module status to **"testing"**
   - ✅ Module becomes visible to:
     - Test sites (configured in beta system)
     - Beta enrolled agencies
   - ❌ Module NOT visible to regular users yet

### Step 3: Test with Beta Users

Now your module is in beta! It's available to:
- **Test sites** you've configured
- **Beta agencies** that are enrolled
- **Super admins** (always see everything)

### Step 4: Deploy to Production (Publish)

Once testing is complete and you're ready for everyone:

1. **Click "Deploy" again**
2. **In the Deploy Dialog:**
   - **Environment**: Select **"Production"** 🌍
   - **Version Type**: Usually patch (unless major changes)
   - **Changelog**: Document the release
   - Click **"Deploy to Production"**

3. **What Happens Automatically:**
   - ✅ Creates a new version
   - ✅ Changes module status to **"published"**
   - ✅ **Syncs to catalog** (marketplace)
   - ✅ Module visible to EVERYONE
   - ✅ Available on ALL sites

---

## 🔍 Behind the Scenes: What Each Deploy Does

### Staging Deploy (Beta)
```typescript
// From module-deployer.ts line 110-117
if (environment === "production") {
  updateData.status = "published";  // ❌ Not staging
} else {
  updateData.status = "testing";    // ✅ Sets to testing!
}
```

**Result:**
- Status: `draft` → `testing`
- Visible to: Test sites + Beta agencies
- Marketplace: NOT synced yet

### Production Deploy (Publish)
```typescript
// From module-deployer.ts line 110-117
if (environment === "production") {
  updateData.status = "published";      // ✅ Sets to published!
  updateData.published_version = version;
  updateData.published_at = new Date();
}
```

**Result:**
- Status: `testing` → `published`
- Visible to: EVERYONE
- Marketplace: ✅ Synced to catalog
- Available: All sites can install

---

## 📊 Module Status Flow Chart

```
┌─────────────────────────────────────────────────────────────┐
│                      Module Lifecycle                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CREATE MODULE                                               │
│       │                                                      │
│       ▼                                                      │
│   [draft] ──────────────────────────────────────────┐       │
│       │                                              │       │
│       │ Deploy to Staging                            │       │
│       ▼                                              │       │
│   [testing] ◄─── Beta/Test Sites Only               │       │
│       │          Beta Agencies Only                  │       │
│       │          NOT in marketplace                  │       │
│       │                                              │       │
│       │ Deploy to Production                         │       │
│       ▼                                              │       │
│   [published] ◄── Everyone can see                  │       │
│       │           In marketplace                     │       │
│       │           All sites can install              │       │
│       │                                              │       │
│       │ Mark as old                                  │       │
│       ▼                                              │       │
│   [deprecated] ◄─ Still visible but not recommended │       │
│                                                              │
│  MANUAL OVERRIDE (SQL):                                     │
│  You can also update status directly in database           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Your Beta Module

### Who Can See Testing Modules?

```sql
-- Check who can see your testing module
SELECT 
  'Test Sites' as access_type,
  s.name,
  tsc.test_features,
  tsc.allowed_module_statuses
FROM test_site_configuration tsc
JOIN sites s ON s.id = tsc.site_id
WHERE tsc.is_active = true
  AND 'testing' = ANY(tsc.allowed_module_statuses)

UNION ALL

SELECT 
  'Beta Agencies' as access_type,
  a.name,
  be.beta_tier,
  be.accepted_modules
FROM beta_enrollment be
JOIN agencies a ON a.id = be.agency_id
WHERE be.is_active = true;
```

### Test Installation Flow

1. **Login as beta user** (or use test site)
2. **Go to module marketplace**
   - Testing modules should appear with "BETA" badge
3. **Install the module** on a site
4. **Test all functionality:**
   - Settings panel works
   - Renders correctly
   - No console errors
5. **Run automated tests** (if needed):
   - Unit tests
   - Integration tests
   - Performance tests

---

## 🛠️ Manual Status Override (If Needed)

If you need to manually change a module's status:

```sql
-- Move to testing status
UPDATE module_source 
SET 
  status = 'testing',
  updated_at = NOW()
WHERE module_id = 'your-module-id';

-- Move to published status
UPDATE module_source 
SET 
  status = 'published',
  published_at = NOW(),
  published_version = '1.0.0',
  updated_at = NOW()
WHERE module_id = 'your-module-id';

-- Move back to draft
UPDATE module_source 
SET 
  status = 'draft',
  updated_at = NOW()
WHERE module_id = 'your-module-id';
```

**⚠️ Warning:** Manual SQL changes bypass:
- Version control
- Deployment history
- Catalog sync
- Analytics updates

**Use the Deploy button instead when possible!**

---

## 🔐 Access Control Rules

| User Type | Draft | Testing | Published |
|-----------|-------|---------|-----------|
| Super Admin | ✅ All | ✅ All | ✅ All |
| Test Site | ❌ | ✅ Yes | ✅ Yes |
| Beta Agency (Internal) | ❌ | ✅ All testing | ✅ Yes |
| Beta Agency (Standard) | ❌ | ✅ Opted-in only | ✅ Yes |
| Regular Agency | ❌ | ❌ | ✅ Yes |

---

## 📝 Quick Reference Commands

### Check Module Status
```sql
SELECT 
  name,
  slug,
  status,
  latest_version,
  published_version,
  published_at,
  updated_at
FROM module_source
WHERE slug = 'your-module-slug';
```

### Check Deployment History
```sql
SELECT 
  md.*,
  ms.name as module_name,
  mv.version
FROM module_deployments md
JOIN module_source ms ON ms.id = md.module_source_id
JOIN module_versions mv ON mv.id = md.version_id
WHERE ms.slug = 'your-module-slug'
ORDER BY md.started_at DESC
LIMIT 10;
```

### Check Who Can Access
```sql
-- Check test sites
SELECT COUNT(*) as test_site_count
FROM test_site_configuration
WHERE is_active = true
  AND 'testing' = ANY(allowed_module_statuses);

-- Check beta agencies
SELECT COUNT(*) as beta_agency_count
FROM beta_enrollment
WHERE is_active = true;
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Module not visible after staging deploy"
**Solution:** 
- Check module status is "testing"
- Verify test site configuration exists
- Confirm beta enrollment is active
- Check site is designated as test site

### Issue 2: "Deploy button is disabled"
**Solution:**
- Save your changes first (must save before deploy)
- Module must have valid code
- Must be super admin

### Issue 3: "Testing module visible to everyone"
**Solution:**
- Check status - it might be "published" not "testing"
- Check if catalog sync happened (should only sync on production deploy)
- Verify marketplace is filtering correctly

### Issue 4: "Can't deploy to staging"
**Solution:**
- Deploy dialog always works
- "Staging" option should be available
- Check console for errors
- Verify you're super admin

---

## 🎯 Best Practices

### 1. **Always Use Staging First**
```
✅ Draft → Staging Deploy → Test → Production Deploy
❌ Draft → Production Deploy (skip testing)
```

### 2. **Write Good Changelogs**
```
✅ "Added image carousel support with swipe gestures"
❌ "Updated module"
```

### 3. **Version Appropriately**
- **Patch (0.0.X)**: Bug fixes, minor tweaks
- **Minor (0.X.0)**: New features, backwards compatible
- **Major (X.0.0)**: Breaking changes, major overhaul

### 4. **Test Before Publishing**
- Install on test site
- Run automated tests
- Get beta user feedback
- Fix any issues
- Deploy new staging version
- Repeat until stable

### 5. **Document Breaking Changes**
If deploying a major version:
```markdown
## Changelog v2.0.0

⚠️ BREAKING CHANGES:
- Settings schema changed
- Existing installations will need reconfiguration
- Old API endpoints removed

New Features:
- Added XYZ
- Improved performance
```

---

## 🔄 Complete Example: Deploying a New Module

### Scenario: Creating a "Testimonial Carousel" Module

```typescript
// 1. Create module in Studio
Module Studio → New Module
  Name: "Testimonial Carousel"
  Slug: testimonial-carousel
  Status: draft (automatic)

// 2. Build the module
- Write React component
- Define settings schema
- Add CSS styles
- Test in sandbox preview

// 3. Save
Click "Save Changes"
Status: draft

// 4. Deploy to Beta (Staging)
Click "Deploy"
  Environment: Staging
  Version: 0.1.0
  Changelog: "Initial beta release for testing"
Click "Deploy to Staging"

Status: draft → testing ✅

// 5. Test with Beta Users
- Configure test site
- Install on test site
- Beta agencies opt-in
- Gather feedback
- Fix bugs

// 6. Deploy updated beta
Click "Deploy"
  Environment: Staging
  Version: 0.1.1 (patch)
  Changelog: "Fixed carousel animation bug"
  
Status: testing (stays testing)

// 7. Ready for Production
Click "Deploy"
  Environment: Production
  Version: 1.0.0 (major - first public release)
  Changelog: "Public release - carousel with 5 layout options"

Status: testing → published ✅
Catalog: Synced to marketplace ✅
Available: All sites can install ✅
```

---

## 🎉 Summary

**You found the system working correctly!** 

The deployment workflow is:

1. **Build** in Studio (draft status)
2. **Deploy to Staging** (changes to testing status) ← **THIS IS BETA!**
3. **Test** with test sites & beta agencies
4. **Deploy to Production** (changes to published status)

The key insight: **"Staging" = "Testing/Beta"**

The Deploy button automatically:
- ✅ Creates versions
- ✅ Changes status
- ✅ Controls visibility
- ✅ Syncs to catalog (only on production)
- ✅ Updates analytics

**No flaw found - system is working as designed!** 🎊

---

## 📞 Need Help?

- Check deployment history: `/admin/modules/studio/[moduleId]` → Deploys tab
- View test results: `/admin/modules/studio/[moduleId]/test`
- Manage beta program: `/admin/modules/testing`
- Check module status: SQL queries above

Happy deploying! 🚀
