# Phase 81B Implementation Summary

**Date:** January 19, 2026
**Status:** COMPLETE

## Database Changes Made

### 1. `module_source` table enhancements:
```sql
-- Testing visibility control
testing_tier TEXT CHECK (testing_tier IN ('internal', 'beta', 'public')) DEFAULT 'internal'

-- Install level categorization  
install_level TEXT DEFAULT 'site' CHECK (install_level IN ('agency', 'client', 'site'))

-- Pricing fields for marketplace
wholesale_price_monthly INTEGER DEFAULT 0
suggested_retail_monthly INTEGER DEFAULT 0
```

### 2. FK Constraints Dropped:
```sql
-- agency_module_subscriptions.module_id NO LONGER references modules_v2
-- Reason: Subscriptions can be to testing modules (in module_source) OR published modules (in modules_v2)

-- site_module_installations.module_id NO LONGER references modules_v2  
-- Reason: Sites can install testing modules (module_source) OR published modules (modules_v2)
```

### 3. Key Architecture Decisions:

| Table | Purpose | FK to modules_v2 |
|-------|---------|------------------|
| `modules_v2` | Published module catalog | N/A |
| `module_source` | All modules (draft/testing/published) | No |
| `agency_module_subscriptions` | Agency's module subscriptions | **DROPPED** |
| `site_module_installations` | Per-site module deployments | **DROPPED** |

## Code Patterns Established

### Querying Modules (Check BOTH Tables):
```typescript
// ALWAYS query both tables for module lookup
const { data: v2Module } = await supabase
  .from("modules_v2")
  .select("*")
  .eq("id", moduleId)
  .single();

if (v2Module) return v2Module;

// Fallback to module_source
const { data: sourceModule } = await supabase
  .from("module_source")
  .select("*")
  .eq("id", moduleId)
  .single();

return sourceModule;
```

### Module ID Types:
- `modules_v2.id` = UUID (primary key)
- `module_source.id` = UUID (primary key)  
- `module_source.module_id` = TEXT (slug/identifier) - LEGACY, don't use for FK
- `module_source.slug` = TEXT (URL-safe identifier)

### Install Levels:
- `agency` = Internal agency tools, no client billing
- `client` = Deploy to client accounts, agency markup
- `site` = Deploy to websites, per-site billing with markup

### Testing Tiers:
- `internal` = Hidden from test sites, dev-only
- `beta` = Visible to test sites and beta users
- `public` = Wider testing (future use)

## Files Modified/Created

### API Routes:
- `src/app/api/modules/subscribe/route.ts` - Queries both tables
- `src/app/api/sites/[siteId]/modules/route.ts` - Queries both tables

### Pages:
- `src/app/(dashboard)/marketplace/page.tsx` - Dual-source query with deduplication
- `src/app/(dashboard)/dashboard/modules/subscriptions/page.tsx` - Enriched subscriptions
- `src/app/(dashboard)/dashboard/modules/pricing/page.tsx` - Enriched pricing
- `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx` - Added Modules tab

### Components:
- `src/components/modules/agency/subscription-list.tsx` - Testing modules section
- `src/components/sites/site-modules-tab.tsx` - Configure dialog integration
- `src/components/sites/module-configure-dialog.tsx` - NEW: Module settings

### Libraries:
- `src/lib/modules/module-deployer.ts` - Accepts installLevel, testingTier
- `src/components/admin/modules/module-deploy-dialog.tsx` - UI for tier/level selection

## Critical Notes for Future Phases

### ⚠️ When creating FK constraints:
DO NOT create FK to `modules_v2` for:
- `agency_module_subscriptions.module_id`
- `site_module_installations.module_id`
- Any table that needs to reference both testing and published modules

### ⚠️ When querying modules:
ALWAYS check both `modules_v2` AND `module_source` tables if module could be either published or testing.

### ⚠️ Module ID confusion:
- Use `module_source.id` (UUID) for database operations
- Use `module_source.slug` for URLs and display
- NEVER use `module_source.module_id` for FK relationships (it's a TEXT slug, not UUID)
