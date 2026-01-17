# Phase 81A: Module Marketplace Integration

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 8-10 hours
>
> **Status**: 📋 PLANNED
>
> **Prerequisites**: Phase 80 Complete

---

## 🎯 Objective

**Bridge the gap between Module Studio and the Module Marketplace/Portal so that published Studio modules actually appear and can be installed.**

Currently:
- Studio modules exist in `module_source` table
- Marketplace reads from static `MODULE_CATALOG`
- Portal reads from `modules` table via `agency_module_subscriptions`
- **Result: Published modules are invisible to users!**

This phase fixes that completely.

---

## 📊 Current Architecture Analysis

### Data Sources

| Component | Current Source | Includes Studio? |
|-----------|---------------|------------------|
| Marketplace Page | `MODULE_CATALOG` (static) | ❌ NO |
| Portal Apps Browse | `modules` table | ❌ NO |
| Site Renderer | `site_modules` → `modules` | ❌ NO |
| Module Details | `MODULE_CATALOG` | ❌ NO |
| Install Flow | `modules` table | ❌ NO |

### Tables Involved

```
module_source (Studio modules)          modules (Catalog modules)
├── module_id                           ├── id
├── name                                ├── name
├── slug                                ├── slug
├── render_code                         ├── package_url
├── styles                              ├── manifest_url
├── settings_schema                     ├── wholesale_price_monthly
├── status (draft/testing/published)    ├── is_active
└── pricing_tier                        └── install_level

          ↓ NEED TO SYNC ↓

agency_module_subscriptions
├── agency_id
├── module_id → points to modules.id
└── status

site_modules
├── site_id
├── module_id → points to modules.id
└── settings
```

---

## 🔧 Solution Architecture

### Option A: Sync to `modules` Table (RECOMMENDED)

When a module is deployed to production:
1. Create/update entry in `modules` table
2. Set `source = "studio"` to identify it
3. Store `render_code` and `styles` in `module_source` (still needed)
4. Existing install flows work unchanged

**Pros**: 
- Minimal changes to existing code
- Works with all existing flows
- Agencies can immediately subscribe

**Cons**:
- Two tables to maintain
- Need sync mechanism

### Option B: Merge at Query Time

All queries hit both `modules` + `module_source` and merge results.

**Pros**: Single source of truth in `module_source`
**Cons**: Requires changing every query in the system

### Decision: **Option A - Sync to `modules` Table**

---

## 📁 Files to Create/Modify

```
src/lib/modules/
├── module-catalog-sync.ts           # NEW - Sync studio → modules
├── module-registry-server.ts        # MODIFY - Update getAllModules
├── module-deployer.ts               # MODIFY - Call sync on deploy

src/app/(dashboard)/
├── marketplace/page.tsx             # MODIFY - Use server data
├── marketplace/[moduleId]/page.tsx  # MODIFY - Support studio modules

src/app/portal/
├── apps/browse/page.tsx             # Works automatically after sync
├── apps/[slug]/page.tsx             # MODIFY - Load studio code

src/components/renderer/
├── module-injector.tsx              # NEW - Inject studio module code
├── node-renderer.tsx                # MODIFY - Support module components

Database:
└── modules table                    # ADD columns: source, render_code
```

---

## ✅ Tasks

### Task 81A.1: Extend `modules` Table Schema

Add columns to support studio modules:

```sql
-- Migration: add_studio_module_support.sql
ALTER TABLE modules ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'catalog';
-- source: 'catalog' (static) or 'studio' (built in studio)

ALTER TABLE modules ADD COLUMN IF NOT EXISTS studio_module_id UUID REFERENCES module_source(id);
-- Links back to module_source for render_code

ALTER TABLE modules ADD COLUMN IF NOT EXISTS render_code TEXT;
-- Cached render code for performance

ALTER TABLE modules ADD COLUMN IF NOT EXISTS styles TEXT;
-- Cached CSS styles

ALTER TABLE modules ADD COLUMN IF NOT EXISTS settings_schema JSONB DEFAULT '{}';
-- Settings schema for UI generation

ALTER TABLE modules ADD COLUMN IF NOT EXISTS default_settings JSONB DEFAULT '{}';
-- Default settings values

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_modules_source ON modules(source);
```

---

### Task 81A.2: Create Catalog Sync Service

**File: `src/lib/modules/module-catalog-sync.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/permissions";

export interface SyncResult {
  success: boolean;
  moduleId?: string;
  action?: "created" | "updated";
  error?: string;
}

/**
 * Sync a published studio module to the modules table
 * Called automatically on production deployment
 */
export async function syncStudioModuleToCatalog(
  studioModuleId: string
): Promise<SyncResult> {
  const supabase = await createClient();
  const db = supabase as any;

  // Get studio module data
  const { data: studioModule, error: fetchError } = await db
    .from("module_source")
    .select("*")
    .eq("module_id", studioModuleId)
    .eq("status", "published")
    .single();

  if (fetchError || !studioModule) {
    return { 
      success: false, 
      error: "Studio module not found or not published" 
    };
  }

  // Check if already exists in modules table
  const { data: existingModule } = await db
    .from("modules")
    .select("id")
    .eq("slug", studioModule.slug)
    .single();

  const moduleData = {
    slug: studioModule.slug,
    name: studioModule.name,
    description: studioModule.description,
    icon: studioModule.icon,
    category: studioModule.category,
    version: studioModule.published_version || "1.0.0",
    
    // Studio-specific fields
    source: "studio",
    studio_module_id: studioModule.id,
    render_code: studioModule.render_code,
    styles: studioModule.styles,
    settings_schema: studioModule.settings_schema,
    default_settings: studioModule.default_settings,
    
    // Pricing from tier
    install_level: "site", // Studio modules are site-level by default
    wholesale_price_monthly: getPriceFromTier(studioModule.pricing_tier),
    
    is_active: true,
    is_featured: false,
    updated_at: new Date().toISOString(),
  };

  if (existingModule) {
    // Update existing
    const { error: updateError } = await db
      .from("modules")
      .update(moduleData)
      .eq("id", existingModule.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { 
      success: true, 
      moduleId: existingModule.id, 
      action: "updated" 
    };
  } else {
    // Create new
    const { data: newModule, error: insertError } = await db
      .from("modules")
      .insert({
        ...moduleData,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { 
      success: true, 
      moduleId: newModule.id, 
      action: "created" 
    };
  }
}

/**
 * Remove a deprecated module from the catalog
 */
export async function removeFromCatalog(slug: string): Promise<SyncResult> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin required" };
  }

  const supabase = await createClient();
  const db = supabase as any;

  const { error } = await db
    .from("modules")
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .eq("source", "studio");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Sync ALL published studio modules (bulk operation)
 */
export async function syncAllStudioModules(): Promise<{
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, synced: 0, failed: 0, errors: ["Super admin required"] };
  }

  const supabase = await createClient();
  const db = supabase as any;

  const { data: publishedModules, error } = await db
    .from("module_source")
    .select("module_id")
    .eq("status", "published");

  if (error || !publishedModules) {
    return { success: false, synced: 0, failed: 0, errors: [error?.message || "Failed to fetch"] };
  }

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const module of publishedModules) {
    const result = await syncStudioModuleToCatalog(module.module_id);
    if (result.success) {
      synced++;
    } else {
      failed++;
      errors.push(`${module.module_id}: ${result.error}`);
    }
  }

  return {
    success: failed === 0,
    synced,
    failed,
    errors,
  };
}

// Helper: Convert pricing tier to wholesale price in cents
function getPriceFromTier(tier: string): number {
  const tierPrices: Record<string, number> = {
    free: 0,
    starter: 999,      // $9.99
    pro: 2499,         // $24.99
    enterprise: 9999,  // $99.99
  };
  return tierPrices[tier] || 0;
}
```

---

### Task 81A.3: Update Module Deployer

**File: `src/lib/modules/module-deployer.ts`**

Update the `deployModule` function to call sync:

```typescript
// Add import at top
import { syncStudioModuleToCatalog } from "./module-catalog-sync";

// In deployModule function, after successful production deployment:
if (environment === "production") {
  updateData.status = "published";
  updateData.published_version = versionResult.version;
  updateData.published_at = new Date().toISOString();
  
  // NEW: Sync to modules catalog
  const syncResult = await syncStudioModuleToCatalog(moduleId);
  if (!syncResult.success) {
    console.error("[Deployer] Catalog sync failed:", syncResult.error);
    // Don't fail deployment, but log warning
  } else {
    console.log(`[Deployer] Module synced to catalog: ${syncResult.action}`);
  }
}
```

---

### Task 81A.4: Update Marketplace to Fetch Dynamic Modules

**File: `src/app/(dashboard)/marketplace/page.tsx`**

Convert from client component to server component that fetches all modules:

```typescript
import { getAllModules } from "@/lib/modules/module-registry-server";
import { MarketplaceClient } from "@/components/marketplace/marketplace-client";

export default async function MarketplacePage() {
  // Fetch all modules including studio modules
  const modules = await getAllModules();
  
  // Separate featured modules
  const featuredModules = modules
    .filter(m => m.rating && m.rating >= 4.5)
    .slice(0, 4);

  return (
    <MarketplaceClient 
      initialModules={modules}
      featuredModules={featuredModules}
    />
  );
}
```

Create new client component for interactivity:

**File: `src/components/marketplace/marketplace-client.tsx`**

```typescript
"use client";

// Move all the client-side filtering/sorting logic here
// Accept initialModules as prop instead of loading from static registry
```

---

### Task 81A.5: Support Studio Modules in Module Detail Page

**File: `src/app/(dashboard)/marketplace/[moduleId]/page.tsx`**

Update to load from database:

```typescript
import { getModuleById } from "@/lib/modules/module-registry-server";

export default async function ModuleDetailPage({ params }) {
  const { moduleId } = await params;
  
  // This now returns both catalog AND studio modules
  const module = await getModuleById(moduleId);
  
  if (!module) {
    notFound();
  }

  // Check if it's a studio module for special handling
  const isStudioModule = module.source === "studio";

  return (
    <ModuleDetailClient 
      module={module}
      isStudioModule={isStudioModule}
    />
  );
}
```

---

### Task 81A.6: Module Renderer Integration

Create a component to inject studio module code into rendered sites:

**File: `src/components/renderer/module-injector.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server";

interface ModuleInjectorProps {
  siteId: string;
}

export async function ModuleInjector({ siteId }: ModuleInjectorProps) {
  const supabase = await createClient();
  
  // Get all enabled modules for this site
  const { data: siteModules } = await supabase
    .from("site_modules")
    .select(`
      settings,
      module:modules(
        id, 
        slug, 
        source, 
        render_code, 
        styles,
        settings_schema
      )
    `)
    .eq("site_id", siteId)
    .eq("is_enabled", true);

  if (!siteModules?.length) return null;

  // Separate studio modules from external modules
  const studioModules = siteModules.filter(
    sm => sm.module?.source === "studio"
  );

  if (!studioModules.length) return null;

  // Collect all styles and scripts
  const styles = studioModules
    .map(sm => sm.module?.styles)
    .filter(Boolean)
    .join("\n");

  const scripts = studioModules
    .map(sm => {
      const mod = sm.module;
      const settings = sm.settings || {};
      return `
        (function() {
          const moduleSettings = ${JSON.stringify(settings)};
          const moduleId = "${mod?.slug}";
          ${mod?.render_code}
        })();
      `;
    })
    .join("\n");

  return (
    <>
      {styles && (
        <style 
          dangerouslySetInnerHTML={{ __html: styles }} 
          data-modules="studio"
        />
      )}
      {scripts && (
        <script
          dangerouslySetInnerHTML={{ __html: scripts }}
          data-modules="studio"
        />
      )}
    </>
  );
}
```

Update Site Renderer to include module injection:

**File: `src/components/renderer/site-renderer.tsx`**

```typescript
import { ModuleInjector } from "./module-injector";

export function SiteRenderer({ site, page }: SiteRendererProps) {
  const content = renderCraftJSON(page.content);

  return (
    <>
      <SiteHead site={site} />
      <SiteStyles site={site} />
      
      {/* Inject studio module code */}
      <ModuleInjector siteId={site.id} />
      
      <div className="site-content" data-site-id={site.id} data-page-id={page.id}>
        {content || /* ... */}
      </div>
    </>
  );
}
```

---

### Task 81A.7: Admin Sync Dashboard

Add a sync management section in Super Admin:

**File: `src/app/(dashboard)/admin/modules/studio/sync/page.tsx`**

```typescript
import { syncAllStudioModules } from "@/lib/modules/module-catalog-sync";
import { SyncDashboard } from "@/components/admin/modules/sync-dashboard";

export default async function SyncPage() {
  return <SyncDashboard />;
}
```

**File: `src/components/admin/modules/sync-dashboard.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, Check, AlertTriangle } from "lucide-react";

export function SyncDashboard() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    synced: number;
    failed: number;
    errors: string[];
  } | null>(null);

  async function handleSyncAll() {
    setSyncing(true);
    try {
      const response = await fetch("/api/admin/modules/sync", {
        method: "POST",
      });
      const result = await response.json();
      setLastResult(result);
      
      if (result.success) {
        toast.success(`Synced ${result.synced} modules`);
      } else {
        toast.error(`Failed to sync ${result.failed} modules`);
      }
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Module Catalog Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sync all published Studio modules to the marketplace catalog.
            This happens automatically on deployment but can be triggered manually.
          </p>
          
          <Button onClick={handleSyncAll} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync All Modules"}
          </Button>

          {lastResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {lastResult.failed === 0 ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium">
                  Synced: {lastResult.synced} | Failed: {lastResult.failed}
                </span>
              </div>
              {lastResult.errors.length > 0 && (
                <ul className="text-sm text-red-500 list-disc list-inside">
                  {lastResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Create module in Studio
- [ ] Deploy to production
- [ ] Verify module appears in `/marketplace`
- [ ] Verify module appears in portal `/apps/browse`
- [ ] Agency can subscribe to module
- [ ] Client can install module
- [ ] Module renders on site
- [ ] Module settings work
- [ ] Manual sync works
- [ ] Deprecation removes from catalog

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Published modules visible in marketplace | 100% |
| Install flow completion rate | >90% |
| Sync latency | <2 seconds |
| Zero data loss on sync | 100% |

---

## 🔗 Dependencies

- Phase 80 (Module Studio core)
- `modules` table exists
- `site_modules` table exists
- `agency_module_subscriptions` table exists

---

## ⏭️ Next Phase

**Phase 81B**: Module Testing System - Test sites, beta programs, staging environments
