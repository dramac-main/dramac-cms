# Phase EM-01: Module Lifecycle Completion

> **Priority**: 🔴 CRITICAL - Must complete before any other EM phase
> **Estimated Time**: 8-10 hours
> **Prerequisites**: Current module studio functional
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Fix the broken module pipeline so that:
```
Create → Edit → Test → Deploy → INSTALL → RENDER → WORKS!
                               ↑         ↑
                          Currently    Currently
                           BROKEN      BROKEN
```

After this phase, modules created in the Module Studio will:
1. Appear in the agency marketplace
2. Be subscribable by agencies
3. Be installable on sites
4. Actually render and function on live sites

---

## 📊 Current State Analysis

### The Problem
Module Studio creates modules in `module_source` table, but:
- Marketplace reads from `MODULE_CATALOG` (static file)
- Agency subscriptions reference `modules_v2` table
- Site installations reference `modules_v2` table
- Renderer looks for module code in wrong places

### Database Tables Involved
| Table | Purpose | Status |
|-------|---------|--------|
| `module_source` | Studio development | ✅ Working |
| `module_versions` | Version history | ✅ Working |
| `modules_v2` | Published marketplace | ⚠️ Not synced |
| `agency_module_subscriptions` | Agency purchases | ✅ Schema OK |
| `site_module_installations` | Site enablement | ✅ Schema OK |

### The Fix
Two options:
1. **Option A**: Sync published `module_source` → `modules_v2` on deploy
2. **Option B**: Modify all consumers to read from `module_source` directly

**Decision**: Option A (Sync on Deploy) is cleaner because:
- Keeps separation between development and production
- Allows rollback without affecting marketplace
- Matches industry patterns

---

## 📋 Implementation Tasks

### Task 1: Module Sync Service (2 hours)

Create a service that syncs published modules from `module_source` to `modules_v2`.

#### 1.1 Create the Sync Function

```typescript
// src/lib/modules/module-sync-service.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/permissions'

export interface SyncResult {
  success: boolean
  moduleId?: string
  modulesV2Id?: string
  error?: string
  action: 'created' | 'updated' | 'skipped'
}

/**
 * Sync a published module_source to modules_v2 for marketplace visibility
 */
export async function syncModuleToMarketplace(
  moduleSourceId: string
): Promise<SyncResult> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Super admin required', action: 'skipped' }
  }

  const supabase = await createClient()

  // 1. Get the module_source record
  const { data: source, error: sourceError } = await supabase
    .from('module_source')
    .select('*')
    .eq('id', moduleSourceId)
    .single()

  if (sourceError || !source) {
    return { success: false, error: 'Module source not found', action: 'skipped' }
  }

  // 2. Only sync published modules
  if (source.status !== 'published') {
    return { 
      success: false, 
      error: 'Only published modules can be synced', 
      action: 'skipped' 
    }
  }

  // 3. Check if already exists in modules_v2
  const { data: existing } = await supabase
    .from('modules_v2')
    .select('id')
    .eq('studio_module_id', moduleSourceId)
    .single()

  // 4. Map module_source to modules_v2 schema
  const moduleData = {
    studio_module_id: moduleSourceId,
    slug: source.slug,
    name: source.name,
    description: source.description || '',
    long_description: source.description || '',
    icon: source.icon || '📦',
    category: source.category || 'other',
    version: source.published_version || source.latest_version || '1.0.0',
    
    // Pricing - convert pricing_tier to actual prices
    ...mapPricingTier(source.pricing_tier, source.wholesale_price_monthly, source.suggested_retail_monthly),
    
    // Features from settings or empty
    features: source.default_settings?.features || [],
    
    // Render configuration
    render_code: source.render_code,
    settings_schema: source.settings_schema,
    styles: source.styles,
    default_settings: source.default_settings,
    
    // Status
    is_active: true,
    is_featured: false,
    
    // Metadata
    install_level: source.install_level || 'site',
    source_type: 'studio', // Mark as studio-created
    
    updated_at: new Date().toISOString()
  }

  if (existing) {
    // Update existing
    const { error: updateError } = await supabase
      .from('modules_v2')
      .update(moduleData)
      .eq('id', existing.id)

    if (updateError) {
      return { success: false, error: updateError.message, action: 'skipped' }
    }

    return { 
      success: true, 
      moduleId: source.module_id,
      modulesV2Id: existing.id,
      action: 'updated' 
    }
  } else {
    // Create new
    const { data: created, error: createError } = await supabase
      .from('modules_v2')
      .insert({
        ...moduleData,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (createError) {
      return { success: false, error: createError.message, action: 'skipped' }
    }

    return { 
      success: true, 
      moduleId: source.module_id,
      modulesV2Id: created.id,
      action: 'created' 
    }
  }
}

/**
 * Sync ALL published modules to marketplace
 */
export async function syncAllPublishedModules(): Promise<{
  success: boolean
  results: SyncResult[]
  summary: { created: number; updated: number; skipped: number; errors: number }
}> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    return { 
      success: false, 
      results: [],
      summary: { created: 0, updated: 0, skipped: 0, errors: 1 }
    }
  }

  const supabase = await createClient()
  
  // Get all published modules
  const { data: publishedModules, error } = await supabase
    .from('module_source')
    .select('id')
    .eq('status', 'published')

  if (error || !publishedModules) {
    return { 
      success: false, 
      results: [],
      summary: { created: 0, updated: 0, skipped: 0, errors: 1 }
    }
  }

  const results: SyncResult[] = []
  const summary = { created: 0, updated: 0, skipped: 0, errors: 0 }

  for (const mod of publishedModules) {
    const result = await syncModuleToMarketplace(mod.id)
    results.push(result)
    
    if (result.success) {
      if (result.action === 'created') summary.created++
      if (result.action === 'updated') summary.updated++
    } else {
      if (result.action === 'skipped') summary.skipped++
      else summary.errors++
    }
  }

  return { success: true, results, summary }
}

/**
 * Remove a module from marketplace when unpublished
 */
export async function unsyncModuleFromMarketplace(
  moduleSourceId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Super admin required' }
  }

  const supabase = await createClient()

  // Soft-delete by marking inactive (preserve subscription history)
  const { error } = await supabase
    .from('modules_v2')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('studio_module_id', moduleSourceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Helper function to map pricing tiers
function mapPricingTier(
  tier: string,
  wholesalePrice?: number,
  suggestedRetail?: number
): { 
  wholesale_price_monthly: number
  suggested_retail_monthly: number
  billing_cycle: string
} {
  // If explicit prices provided, use them
  if (wholesalePrice || suggestedRetail) {
    return {
      wholesale_price_monthly: wholesalePrice || 0,
      suggested_retail_monthly: suggestedRetail || wholesalePrice || 0,
      billing_cycle: wholesalePrice === 0 ? 'one_time' : 'monthly'
    }
  }

  // Otherwise map from tier
  const tierMap: Record<string, { wholesale: number; retail: number }> = {
    'free': { wholesale: 0, retail: 0 },
    'starter': { wholesale: 500, retail: 999 },     // $5 wholesale, $9.99 retail
    'pro': { wholesale: 1500, retail: 2999 },       // $15 wholesale, $29.99 retail
    'enterprise': { wholesale: 5000, retail: 9999 } // $50 wholesale, $99.99 retail
  }

  const prices = tierMap[tier] || tierMap['free']
  
  return {
    wholesale_price_monthly: prices.wholesale,
    suggested_retail_monthly: prices.retail,
    billing_cycle: prices.wholesale === 0 ? 'one_time' : 'monthly'
  }
}
```

#### 1.2 Add modules_v2 Column for Studio Link

```sql
-- migrations/20260119000001_modules_v2_studio_link.sql

-- Add column to link modules_v2 back to module_source
ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS studio_module_id UUID REFERENCES module_source(id) ON DELETE SET NULL;

-- Add column to track source type
ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'catalog' CHECK (source_type IN ('catalog', 'studio', 'imported'));

-- Add render code columns if not present
ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS render_code TEXT;

ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS styles TEXT;

ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS settings_schema JSONB DEFAULT '{}';

ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS default_settings JSONB DEFAULT '{}';

-- Create index for studio lookups
CREATE INDEX IF NOT EXISTS idx_modules_v2_studio_id ON modules_v2(studio_module_id);
CREATE INDEX IF NOT EXISTS idx_modules_v2_source_type ON modules_v2(source_type);
```

---

### Task 2: Update Deploy to Trigger Sync (1 hour)

Modify the deployment process to automatically sync on publish.

#### 2.1 Update Deploy Function

```typescript
// src/lib/modules/module-deployer.ts - UPDATE existing function

import { syncModuleToMarketplace, unsyncModuleFromMarketplace } from './module-sync-service'

// ... existing code ...

/**
 * Deploy module to marketplace (enhanced)
 */
export async function deployModule(
  moduleSourceId: string,
  version: string,
  changelog: string
): Promise<{ success: boolean; error?: string; syncResult?: any }> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Super admin required' }
  }

  const supabase = await createClient()
  const userId = await getCurrentUserId()

  try {
    // 1. Update module_source status to published
    const { error: updateError } = await supabase
      .from('module_source')
      .update({
        status: 'published',
        published_version: version,
        published_at: new Date().toISOString(),
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleSourceId)

    if (updateError) throw updateError

    // 2. Create version record
    const { data: source } = await supabase
      .from('module_source')
      .select('*')
      .eq('id', moduleSourceId)
      .single()

    if (source) {
      await supabase.from('module_versions').insert({
        module_source_id: moduleSourceId,
        version,
        changelog,
        render_code: source.render_code,
        settings_schema: source.settings_schema,
        api_routes: source.api_routes,
        styles: source.styles,
        default_settings: source.default_settings,
        is_breaking_change: false,
        created_by: userId
      })

      // 3. Create deployment record
      const { data: versionRecord } = await supabase
        .from('module_versions')
        .select('id')
        .eq('module_source_id', moduleSourceId)
        .eq('version', version)
        .single()

      if (versionRecord) {
        await supabase.from('module_deployments').insert({
          module_source_id: moduleSourceId,
          version_id: versionRecord.id,
          environment: 'production',
          status: 'success',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          deployed_by: userId
        })
      }
    }

    // 4. 🆕 SYNC TO MARKETPLACE
    const syncResult = await syncModuleToMarketplace(moduleSourceId)
    
    if (!syncResult.success) {
      console.error('[Deploy] Sync failed:', syncResult.error)
      // Don't fail deploy, but log warning
    }

    return { success: true, syncResult }

  } catch (error) {
    console.error('[Deploy] Error:', error)
    return { success: false, error: 'Deployment failed' }
  }
}

/**
 * Unpublish module (enhanced)
 */
export async function unpublishModule(
  moduleSourceId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Super admin required' }
  }

  const supabase = await createClient()

  // 1. Update module_source status
  const { error } = await supabase
    .from('module_source')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('id', moduleSourceId)

  if (error) {
    return { success: false, error: error.message }
  }

  // 2. 🆕 REMOVE FROM MARKETPLACE
  await unsyncModuleFromMarketplace(moduleSourceId)

  return { success: true }
}
```

---

### Task 3: Update Marketplace to Show Studio Modules (2 hours)

#### 3.1 Update Marketplace Data Fetching

```typescript
// src/lib/modules/marketplace-service.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { MODULE_CATALOG } from './module-catalog'
import type { ModuleDefinition } from './module-types'

/**
 * Get all marketplace modules (catalog + studio published)
 */
export async function getMarketplaceModules(): Promise<ModuleDefinition[]> {
  const supabase = await createClient()
  
  // 1. Get published studio modules from modules_v2
  const { data: studioModules } = await supabase
    .from('modules_v2')
    .select('*')
    .eq('is_active', true)
    .eq('source_type', 'studio')

  // 2. Convert to ModuleDefinition format
  const studioConverted: ModuleDefinition[] = (studioModules || []).map(m => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    description: m.description || '',
    longDescription: m.long_description || '',
    version: m.version || '1.0.0',
    icon: m.icon || '📦',
    screenshots: m.screenshots || [],
    category: m.category || 'other',
    tags: m.tags || [],
    author: {
      name: 'DRAMAC Studio',
      verified: true
    },
    pricing: {
      type: m.billing_cycle === 'one_time' && m.suggested_retail_monthly === 0 
        ? 'free' 
        : 'monthly',
      amount: m.suggested_retail_monthly || 0,
      currency: 'USD'
    },
    features: m.features || [],
    status: 'active',
    rating: m.rating || 0,
    reviewCount: m.review_count || 0,
    installCount: m.install_count || 0,
    createdAt: new Date(m.created_at),
    updatedAt: new Date(m.updated_at),
    // Studio-specific
    source: 'studio',
    renderCode: m.render_code,
    styles: m.styles,
    settingsSchema: m.settings_schema,
    defaultSettings: m.default_settings
  }))

  // 3. Merge with static catalog
  // Catalog modules that aren't overridden by studio
  const studioSlugs = new Set(studioConverted.map(m => m.slug))
  const catalogFiltered = MODULE_CATALOG.filter(m => !studioSlugs.has(m.slug))

  // 4. Return combined list
  return [...studioConverted, ...catalogFiltered]
}

/**
 * Get single module by ID or slug
 */
export async function getModuleByIdOrSlug(
  idOrSlug: string
): Promise<ModuleDefinition | null> {
  const supabase = await createClient()
  
  // Check if UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  
  if (isUUID) {
    // Try modules_v2 first
    const { data } = await supabase
      .from('modules_v2')
      .select('*')
      .eq('id', idOrSlug)
      .eq('is_active', true)
      .single()
    
    if (data) {
      return convertToModuleDefinition(data)
    }
  }
  
  // Try by slug
  const { data } = await supabase
    .from('modules_v2')
    .select('*')
    .eq('slug', idOrSlug)
    .eq('is_active', true)
    .single()
  
  if (data) {
    return convertToModuleDefinition(data)
  }
  
  // Fall back to catalog
  return MODULE_CATALOG.find(m => m.id === idOrSlug || m.slug === idOrSlug) || null
}

function convertToModuleDefinition(m: any): ModuleDefinition {
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    description: m.description || '',
    longDescription: m.long_description || '',
    version: m.version || '1.0.0',
    icon: m.icon || '📦',
    screenshots: m.screenshots || [],
    category: m.category || 'other',
    tags: m.tags || [],
    author: { name: 'DRAMAC Studio', verified: true },
    pricing: {
      type: m.billing_cycle === 'one_time' && m.suggested_retail_monthly === 0 ? 'free' : 'monthly',
      amount: m.suggested_retail_monthly || 0,
      currency: 'USD'
    },
    features: m.features || [],
    status: 'active',
    rating: m.rating || 0,
    reviewCount: m.review_count || 0,
    installCount: m.install_count || 0,
    createdAt: new Date(m.created_at),
    updatedAt: new Date(m.updated_at),
    source: m.source_type || 'catalog',
    renderCode: m.render_code,
    styles: m.styles,
    settingsSchema: m.settings_schema,
    defaultSettings: m.default_settings
  }
}
```

#### 3.2 Update Marketplace Page to Use Server Action

```tsx
// src/app/(dashboard)/marketplace/page.tsx - UPDATE

import { getMarketplaceModules } from '@/lib/modules/marketplace-service'

export default async function MarketplacePage() {
  // Use server action instead of static registry
  const modules = await getMarketplaceModules()
  
  // ... rest of component using `modules`
}
```

---

### Task 4: Update Module Renderer (2 hours)

Make the site renderer capable of loading and executing Studio module code.

#### 4.1 Create Studio Module Loader

```typescript
// src/lib/modules/studio-module-loader.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export interface LoadedStudioModule {
  id: string
  name: string
  slug: string
  renderCode: string
  styles: string
  settingsSchema: Record<string, unknown>
  defaultSettings: Record<string, unknown>
  version: string
}

/**
 * Load a studio module's render code for execution
 */
export async function loadStudioModuleForRender(
  moduleId: string
): Promise<LoadedStudioModule | null> {
  const supabase = await createClient()
  
  // Try modules_v2 first (published)
  const { data: module } = await supabase
    .from('modules_v2')
    .select(`
      id,
      name,
      slug,
      render_code,
      styles,
      settings_schema,
      default_settings,
      version,
      studio_module_id
    `)
    .eq('id', moduleId)
    .eq('is_active', true)
    .single()

  if (module?.render_code) {
    return {
      id: module.id,
      name: module.name,
      slug: module.slug,
      renderCode: module.render_code,
      styles: module.styles || '',
      settingsSchema: module.settings_schema || {},
      defaultSettings: module.default_settings || {},
      version: module.version || '1.0.0'
    }
  }

  // If no render_code in modules_v2, check module_source directly
  // (This handles testing modules)
  const { data: source } = await supabase
    .from('module_source')
    .select(`
      id,
      name,
      slug,
      render_code,
      styles,
      settings_schema,
      default_settings,
      latest_version
    `)
    .eq('id', moduleId)
    .single()

  if (source?.render_code) {
    return {
      id: source.id,
      name: source.name,
      slug: source.slug,
      renderCode: source.render_code,
      styles: source.styles || '',
      settingsSchema: source.settings_schema || {},
      defaultSettings: source.default_settings || {},
      version: source.latest_version || '1.0.0'
    }
  }

  return null
}

/**
 * Get all enabled modules for a site with their render code
 */
export async function loadSiteModulesForRender(
  siteId: string
): Promise<LoadedStudioModule[]> {
  const supabase = await createClient()
  
  // Get installed modules for the site
  const { data: installations } = await supabase
    .from('site_module_installations')
    .select(`
      module_id,
      settings,
      is_enabled
    `)
    .eq('site_id', siteId)
    .eq('is_enabled', true)

  if (!installations || installations.length === 0) {
    return []
  }

  // Load each module's render code
  const loadedModules: LoadedStudioModule[] = []
  
  for (const install of installations) {
    const module = await loadStudioModuleForRender(install.module_id)
    if (module) {
      // Merge installation settings with defaults
      loadedModules.push({
        ...module,
        defaultSettings: {
          ...module.defaultSettings,
          ...(install.settings as Record<string, unknown>)
        }
      })
    }
  }

  return loadedModules
}
```

#### 4.2 Update Module Injector Component

```tsx
// src/components/modules/module-injector.tsx - UPDATE

'use client'

import { useEffect, useState } from 'react'
import { LoadedStudioModule } from '@/lib/modules/studio-module-loader'

interface ModuleInjectorProps {
  module: LoadedStudioModule
  settings?: Record<string, unknown>
  onError?: (error: Error) => void
}

export function StudioModuleInjector({ 
  module, 
  settings = {},
  onError 
}: ModuleInjectorProps) {
  const [html, setHtml] = useState<string>('')
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      // Merge settings
      const mergedSettings = { ...module.defaultSettings, ...settings }
      
      // Generate the module HTML with injected settings
      const moduleHtml = generateModuleHtml(module, mergedSettings)
      setHtml(moduleHtml)
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to render module')
      setError(err)
      onError?.(err)
    }
  }, [module, settings, onError])

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600 text-sm">Module failed to load: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="studio-module-container">
      {/* Inject module styles */}
      {module.styles && (
        <style dangerouslySetInnerHTML={{ __html: module.styles }} />
      )}
      
      {/* Render module in sandboxed iframe */}
      <iframe
        srcDoc={html}
        className="w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        style={{ minHeight: '200px' }}
      />
    </div>
  )
}

function generateModuleHtml(
  module: LoadedStudioModule, 
  settings: Record<string, unknown>
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; }
    ${module.styles || ''}
  </style>
</head>
<body>
  <div id="module-root"></div>
  <script>
    // Inject settings as global
    window.MODULE_SETTINGS = ${JSON.stringify(settings)};
    window.MODULE_ID = "${module.id}";
    window.MODULE_VERSION = "${module.version}";
  </script>
  <script type="text/javascript">
    ${transpileForBrowser(module.renderCode)}
    
    // Mount component
    try {
      const root = ReactDOM.createRoot(document.getElementById('module-root'));
      const Component = typeof ModuleComponent !== 'undefined' ? ModuleComponent : 
                       typeof exports !== 'undefined' && exports.default ? exports.default :
                       () => React.createElement('div', null, 'Module loaded');
      root.render(React.createElement(Component, { settings: window.MODULE_SETTINGS }));
    } catch (e) {
      console.error('Module render error:', e);
      document.getElementById('module-root').innerHTML = '<p style="color:red">Module error: ' + e.message + '</p>';
    }
  </script>
</body>
</html>
`
}

// Simple transpilation for browser (removes TS syntax)
function transpileForBrowser(code: string): string {
  return code
    // Remove TypeScript annotations
    .replace(/:\s*\w+(\[\])?\s*([,\)=;])/g, '$2')
    // Remove interface/type declarations
    .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
    // Remove import statements (we inject globals)
    .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '')
    // Remove export default
    .replace(/export\s+default\s+/g, 'var ModuleComponent = ')
    // Remove named exports
    .replace(/export\s+(const|function|class)/g, '$1')
}
```

---

### Task 5: Test The Complete Flow (2 hours)

#### 5.1 Create Integration Test Page

```tsx
// src/app/(dashboard)/admin/modules/studio/integration-test/page.tsx

import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/auth/permissions'
import { syncAllPublishedModules } from '@/lib/modules/module-sync-service'
import { getMarketplaceModules } from '@/lib/modules/marketplace-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function IntegrationTestPage() {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) redirect('/dashboard')

  const modules = await getMarketplaceModules()
  const studioModules = modules.filter(m => m.source === 'studio')
  const catalogModules = modules.filter(m => m.source !== 'studio')

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold">Module Integration Test</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Studio Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studioModules.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Catalog Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{catalogModules.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{modules.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Studio Modules in Marketplace:</h2>
        {studioModules.length === 0 ? (
          <p className="text-muted-foreground">
            No studio modules synced. Deploy a module to see it here.
          </p>
        ) : (
          <ul className="space-y-2">
            {studioModules.map(m => (
              <li key={m.id} className="flex items-center gap-2">
                <span>{m.icon}</span>
                <span className="font-medium">{m.name}</span>
                <span className="text-sm text-muted-foreground">v{m.version}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={async () => {
        'use server'
        await syncAllPublishedModules()
      }}>
        <Button type="submit">Force Sync All Published Modules</Button>
      </form>
    </div>
  )
}
```

---

### Task 6: Update Module Install Flow (1 hour)

#### 6.1 Update Site Module Installation

```typescript
// src/lib/modules/module-installation.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth/permissions'

/**
 * Install a module on a site
 * Works for both catalog and studio modules
 */
export async function installModuleOnSite(
  siteId: string,
  moduleId: string,
  initialSettings?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()
  
  if (!userId) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify the module exists (in modules_v2 or module_source)
  let moduleExists = false
  let defaultSettings = {}

  // Check modules_v2
  const { data: m2 } = await supabase
    .from('modules_v2')
    .select('id, default_settings')
    .eq('id', moduleId)
    .eq('is_active', true)
    .single()

  if (m2) {
    moduleExists = true
    defaultSettings = m2.default_settings || {}
  } else {
    // Check module_source (for testing modules)
    const { data: ms } = await supabase
      .from('module_source')
      .select('id, default_settings')
      .eq('id', moduleId)
      .in('status', ['published', 'testing'])
      .single()
    
    if (ms) {
      moduleExists = true
      defaultSettings = ms.default_settings || {}
    }
  }

  if (!moduleExists) {
    return { success: false, error: 'Module not found or not available' }
  }

  // Check if already installed
  const { data: existing } = await supabase
    .from('site_module_installations')
    .select('id')
    .eq('site_id', siteId)
    .eq('module_id', moduleId)
    .single()

  if (existing) {
    return { success: false, error: 'Module already installed on this site' }
  }

  // Install
  const { error } = await supabase
    .from('site_module_installations')
    .insert({
      site_id: siteId,
      module_id: moduleId,
      settings: { ...defaultSettings, ...initialSettings },
      is_enabled: true,
      installed_at: new Date().toISOString(),
      installed_by: userId
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Uninstall a module from a site
 */
export async function uninstallModuleFromSite(
  siteId: string,
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('site_module_installations')
    .delete()
    .eq('site_id', siteId)
    .eq('module_id', moduleId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update module settings on a site
 */
export async function updateModuleSettings(
  siteId: string,
  moduleId: string,
  settings: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('site_module_installations')
    .update({ 
      settings,
      updated_at: new Date().toISOString()
    })
    .eq('site_id', siteId)
    .eq('module_id', moduleId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
```

---

## ✅ Verification Checklist

After implementing all tasks, verify:

- [ ] Module created in Studio appears in module_source table
- [ ] After deployment, module appears in modules_v2 table
- [ ] Marketplace page shows studio modules
- [ ] Module can be subscribed by agency
- [ ] Module can be installed on site
- [ ] Site renderer loads module code
- [ ] Module renders correctly on live site
- [ ] Module settings persist and apply

---

## 🔄 Migration Script

If you have existing published modules that need syncing:

```sql
-- One-time migration to sync all published modules
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT id FROM module_source WHERE status = 'published'
  LOOP
    -- Trigger sync via application code
    -- This is a placeholder - run syncAllPublishedModules() from app
    RAISE NOTICE 'Module % needs sync', rec.id;
  END LOOP;
END $$;
```

---

## 📝 Next Phase

After completing EM-01, proceed to **PHASE-EM-02-MARKETPLACE-ENHANCEMENT.md** to add:
- Module search and filtering
- Category browsing
- Featured modules
- Reviews and ratings

