# Phase EM-50 CRM Module - Critical Bug Fixes

**Date:** January 24, 2026  
**Status:** ✅ FIXED  
**Commit:** d45ba37

## Issues Reported

User tested the CRM module and found multiple critical errors:

1. **Database Schema Error (500 errors)**
   - `Error: column mod_crmmod01_pipelines.is_active does not exist`
   - Server action failing at `crm-actions.ts:410`
   - Caused 500 Internal Server Errors on all CRM routes

2. **React Component Errors**
   - Multiple `SelectItem` errors: "must have a value prop that is not an empty string"
   - Affected components:
     - `CreateContactDialog`
     - `CreateCompanyDialog`
     - `CreateDealDialog`
     - `CreateActivityDialog`

## Root Causes

### 1. Missing Database Column
The `mod_crmmod01_pipelines` table was missing the `is_active` column that the code was trying to query.

**Migration Schema (em-50-crm-module-schema.sql):**
```sql
CREATE TABLE IF NOT EXISTS mod_crmmod01_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  -- MISSING: is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Code Query (crm-actions.ts:407):**
```typescript
const { data, error } = await supabase
  .from(`${TABLE_PREFIX}_pipelines`)
  .select('*')
  .eq('site_id', siteId)
  .eq('is_active', true)  // ❌ Column doesn't exist!
  .order('name')
```

### 2. Empty String Values in Select Components
React Select components from shadcn/ui don't allow empty strings as values (by design for placeholder handling).

**Problem Code:**
```tsx
<SelectItem value="">None</SelectItem>
<SelectItem value="">Not specified</SelectItem>
```

## Solutions Implemented

### Fix 1: Added is_active Column

**Updated Schema:**
```sql
CREATE TABLE IF NOT EXISTS mod_crmmod01_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,  -- ✅ ADDED
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration Script Created:** `em-50-crm-add-is-active-column.sql`
```sql
-- Add is_active column to pipelines table
ALTER TABLE mod_crmmod01_pipelines 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mod_crmmod01_pipelines_is_active 
ON mod_crmmod01_pipelines(is_active);
```

### Fix 2: Replaced Empty String Values

**Updated Select Components:**
```tsx
// Before:
<SelectItem value="">None</SelectItem>
<SelectItem value="">Not specified</SelectItem>

// After:
<SelectItem value="none">None</SelectItem>
<SelectItem value="not_specified">Not specified</SelectItem>
```

**Updated Submit Handlers:**
```typescript
// Before:
company_id: formData.company_id || undefined,
source: formData.source || undefined,

// After:
company_id: formData.company_id && formData.company_id !== 'none' 
  ? formData.company_id 
  : undefined,
source: formData.source && formData.source !== 'not_specified' 
  ? formData.source 
  : undefined,
```

## Files Modified

1. **Database Schema:**
   - `migrations/em-50-crm-module-schema.sql` - Updated base schema
   - `migrations/em-50-crm-add-is-active-column.sql` - NEW migration fix

2. **Dialog Components (4 files):**
   - `src/modules/crm/components/dialogs/create-contact-dialog.tsx`
   - `src/modules/crm/components/dialogs/create-company-dialog.tsx`
   - `src/modules/crm/components/dialogs/create-deal-dialog.tsx`
   - `src/modules/crm/components/dialogs/create-activity-dialog.tsx`

## How to Apply Fixes

### 1. Apply Database Migration

You need to run the migration SQL in your Supabase database:

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manually in Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of migrations/em-50-crm-add-is-active-column.sql
# 3. Run the SQL
```

**Migration SQL:**
```sql
ALTER TABLE mod_crmmod01_pipelines 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_mod_crmmod01_pipelines_is_active 
ON mod_crmmod01_pipelines(is_active);
```

### 2. Code Changes (Already Applied)

The code fixes are already committed and pushed. Just pull the latest changes:

```bash
git pull origin main
```

### 3. Restart Dev Server

After applying the database migration:

```bash
# The dev server should auto-reload
# If not, restart it:
Ctrl+C
pnpm dev
```

## Testing Checklist

After applying fixes, test these scenarios:

- [ ] Navigate to CRM from sidebar (agency-level)
- [ ] Navigate to CRM from site tabs (site-level)
- [ ] Create a new contact (try "None" for company)
- [ ] Create a new company (try "Not specified" for industry)
- [ ] Create a new deal (try "None" for contact/company)
- [ ] Log a new activity (try "None" for various fields)
- [ ] Verify no console errors
- [ ] Verify no 500 server errors

## Expected Behavior After Fixes

✅ **Database Queries Work:**
- Pipelines load without errors
- All CRM views render properly
- No 500 Internal Server Errors

✅ **Select Components Work:**
- No React component errors
- "None" and "Not specified" options work
- Form submissions handle optional fields properly

✅ **User Experience:**
- Dialogs open without errors
- Forms submit successfully
- Data is saved correctly

## Error Prevention

To prevent similar issues in the future:

1. **Database Schema Validation**
   - Always check migration files match code queries
   - Test migrations in development first
   - Use TypeScript types that match database schema

2. **Component Validation**
   - Avoid empty strings in Select values
   - Use proper placeholder handling
   - Test all form states (empty, filled, errors)

3. **Code Review Checklist**
   - Verify all database columns exist before querying
   - Test all Select components with edge cases
   - Run full integration tests before deployment

## Next Steps

1. ✅ Apply database migration (see instructions above)
2. ✅ Pull latest code changes
3. ✅ Test all CRM functionality
4. 🎯 Ready to continue with next phase

---

**Status:** All fixes committed and pushed (commit d45ba37)  
**Migration:** Ready to apply (em-50-crm-add-is-active-column.sql)  
**Testing:** Awaiting user validation
