# Phase 81B Implementation Summary

> **Completed**: January 2025
> **Purpose**: Document all architectural decisions and database changes made during 81B testing

---

## Database Schema Changes

### 1. New Columns Added to `module_source`

```sql
-- Migration: phase-81b-testing-tier.sql
ALTER TABLE module_source ADD COLUMN IF NOT EXISTS testing_tier TEXT 
  CHECK (testing_tier IN ('internal', 'beta', 'public')) DEFAULT 'internal';

-- Migration: phase-81b-module-source-install-level.sql  
ALTER TABLE module_source ADD COLUMN IF NOT EXISTS install_level TEXT DEFAULT 'site' 
  CHECK (install_level IN ('agency', 'client', 'site'));
ALTER TABLE module_source ADD COLUMN IF NOT EXISTS wholesale_price_monthly INTEGER DEFAULT 0;
ALTER TABLE module_source ADD COLUMN IF NOT EXISTS suggested_retail_monthly INTEGER DEFAULT 0;
```

### 2. FK Constraints REMOVED

```sql
-- Migration: phase-81b-allow-testing-subscriptions.sql
ALTER TABLE agency_module_subscriptions DROP CONSTRAINT IF EXISTS agency_module_subscriptions_module_id_fkey;

-- Migration: phase-81b-drop-site-modules-fk.sql
ALTER TABLE site_module_installations DROP CONSTRAINT IF EXISTS site_module_installations_module_id_fkey;
```

**Reason:** Module subscriptions and installations can now reference EITHER:
- `modules_v2.id` (published/production modules)
- `module_source.id` (testing/draft modules)

---

## Module ID Confusion - CRITICAL

The module system has THREE different ID fields:

| Field | Type | Description | Use For |
|-------|------|-------------|---------|
| `module_source.id` | UUID | Primary key | Database FKs, subscriptions |
| `module_source.module_id` | TEXT | Legacy slug-like ID | **DON'T USE for FK** |
| `module_source.slug` | TEXT | URL-friendly name | URLs, display |

### The Bug We Fixed
The module registry returns `module.id` which is actually the SLUG (string), not the UUID.
When inserting subscriptions, we were using the wrong ID.

**Solution:**
```typescript
// Always prioritize the UUID from database query
const effectiveModuleId = moduleData?.id || module?.id;
```

---

## Billing Cycle Constraint

The `agency_module_subscriptions.billing_cycle` column has a CHECK constraint:

```sql
CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time'))
```

**"free" is NOT a valid value!** Use `'one_time'` with `price = 0` for free modules.

---

## Dual-Table Query Pattern

**ALWAYS check both tables when looking up modules:**

```typescript
// 1. Try modules_v2 first (published)
const { data: module } = await supabase
  .from("modules_v2")
  .select("*")
  .eq("id", moduleId)
  .single();

// 2. If not found, try module_source (testing/draft)
if (!module) {
  const { data: sourceModule } = await supabase
    .from("module_source")
    .select("*")
    .eq("id", moduleId)
    .single();
}
```

---

## Testing Tier System

Controls visibility of testing modules:

| Tier | Who Can See |
|------|------------|
| `internal` | Only platform admins |
| `beta` | Enrolled beta testers + admins |
| `public` | Everyone (but still marked as testing) |

**Implementation:** `src/components/admin/modules/module-deploy-dialog.tsx`

---

## Install Level System

Controls where modules can be deployed:

| Level | Deployment Target |
|-------|------------------|
| `agency` | Agency-wide settings (all clients/sites) |
| `client` | Client-level settings |
| `site` | Individual site settings |

**UI:** Marketplace only shows modules matching the appropriate install level for the context.

---

## Files Modified in 81B

### API Routes
- `src/app/api/modules/subscribe/route.ts` - Dual-table query, UUID priority
- `src/app/api/sites/[siteId]/modules/route.ts` - Enrichment from both tables

### Components
- `src/components/admin/modules/module-deploy-dialog.tsx` - Testing tier + install level UI
- `src/components/modules/agency/subscription-list.tsx` - Testing modules section
- `src/components/sites/site-modules-tab.tsx` - Module enable/disable for sites
- `src/components/sites/module-configure-dialog.tsx` - **NEW**: Module configuration

### Pages
- `src/app/(dashboard)/marketplace/page.tsx` - Dual-source query
- `src/app/(dashboard)/dashboard/modules/subscriptions/page.tsx` - Enriched subscriptions
- `src/app/(dashboard)/dashboard/modules/pricing/page.tsx` - Enriched pricing
- `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx` - Added Modules tab

### Lib
- `src/lib/modules/module-deployer.ts` - Accepts testingTier + installLevel

---

## Migration Files Created

Located in `next-platform-dashboard/migrations/`:

1. `phase-81b-testing-tier.sql`
2. `phase-81b-module-source-install-level.sql`
3. `phase-81b-allow-testing-subscriptions.sql`
4. `phase-81b-drop-site-modules-fk.sql`

---

## What Future Phases Must Do

### When Creating New Tables with module_id:
```sql
-- DO THIS:
module_id UUID NOT NULL,  -- No FK constraint

-- NOT THIS:
module_id UUID NOT NULL REFERENCES modules_v2(id),
```

### When Querying Modules:
Always implement the dual-table pattern shown above.

### When Inserting Subscriptions/Installations:
Always use the UUID from `module_source.id`, not the slug from `module.module_id`.

---

## Completed Test Flow

1. ✅ Admin deploys module to Staging with testing_tier='beta', install_level='site'
2. ✅ Beta-enrolled agency sees module in Marketplace
3. ✅ Agency subscribes to module
4. ✅ Module appears in Agency Subscriptions (Testing Modules section)
5. ✅ Agency deploys module to specific site
6. ✅ Site Modules tab shows module with Enable/Disable toggle
7. ✅ Configure button opens settings dialog
8. ⚠️ Module renders on live website (not fully tested)
