# Phase 80: Module Development Studio

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 12-15 hours

---

## 🎯 Objective

Create a comprehensive Module Development Studio for Super Admins to:
1. **Create** new modules with a visual builder
2. **Edit** existing module code and configurations
3. **Test** modules in a sandbox environment
4. **Deploy** modules to the marketplace with versioning
5. **Monitor** module usage and performance

This transforms DRAMAC from a consumer of modules to a **module creation platform**.

---

## 📋 Prerequisites

- [ ] Super Admin dashboard functional (Phase 78)
- [ ] Module architecture implemented (Phase 76A) - Database schema, installation hierarchy, LemonSqueezy billing
- [ ] Module marketplace UI (Phase 76B1, 76B2, 76B3) - Marketplace, management dashboards, pricing UI
- [ ] Supabase storage configured

> **Note**: Phase 79 (Markup Pricing) has been consolidated into Phase 76A.
> Phase 35 (Stripe Module Billing) has been deprecated in favor of LemonSqueezy in Phase 76A.

---

## 🔍 Current State Analysis

**What Exists:**
- `MODULE_CATALOG` in `module-catalog.ts` - Static list of modules
- `moduleRegistry = new Map()` - Empty runtime registry
- Basic module schema defined
- Module installation to sites works

**What's Missing:**
- No way to create new modules
- No visual module builder
- No code editor for module logic
- No testing/sandbox environment
- No deployment workflow
- No version management
- No module analytics

---

## 💼 Business Value

1. **Platform Control** - Super Admin can add features without code deploys
2. **Competitive Advantage** - Faster module creation than competitors
3. **Revenue Growth** - More modules = more revenue opportunities
4. **Agency Value** - Fresh modules for agencies to sell
5. **Ecosystem Lock-in** - Unique modules only on DRAMAC

---

## 📁 Files to Create/Modify

```
src/app/(dashboard)/admin/modules/
├── studio/
│   ├── page.tsx                    # Module studio main page
│   ├── new/page.tsx               # Create new module
│   ├── [moduleId]/page.tsx        # Edit module
│   └── [moduleId]/test/page.tsx   # Test module

src/lib/modules/
├── module-builder.ts              # Module creation logic
├── module-compiler.ts             # Compile module code
├── module-sandbox.ts              # Safe execution sandbox
├── module-deployer.ts             # Deploy to registry
├── module-versioning.ts           # Version management

src/components/admin/modules/
├── module-code-editor.tsx         # Monaco code editor
├── module-schema-builder.tsx      # Visual schema builder
├── module-config-form.tsx         # Module metadata form
├── module-preview.tsx             # Live preview
├── module-test-runner.tsx         # Run tests
├── module-deploy-dialog.tsx       # Deployment confirmation
├── module-analytics.tsx           # Usage analytics

Database:
├── module_source               # Module source code
├── module_versions             # Version history
├── module_deployments          # Deployment logs
├── module_analytics            # Usage metrics
```

---

## ✅ Tasks

### Task 80.1: Database Schema

**File: `migrations/module-studio-tables.sql`**

```sql
-- Module source code and configuration
CREATE TABLE IF NOT EXISTS module_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE,
  
  -- Module metadata
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📦',
  category TEXT DEFAULT 'other',
  
  -- Code
  render_code TEXT, -- React component code
  settings_schema JSONB DEFAULT '{}', -- JSON schema for settings
  api_routes JSONB DEFAULT '[]', -- API endpoints
  styles TEXT, -- Custom CSS
  
  -- Configuration
  default_settings JSONB DEFAULT '{}',
  required_fields TEXT[] DEFAULT '{}',
  dependencies TEXT[] DEFAULT '{}',
  
  -- Pricing reference
  pricing_tier TEXT DEFAULT 'free', -- free, starter, pro, enterprise
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, testing, published, deprecated
  published_version TEXT,
  latest_version TEXT,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Module version history
CREATE TABLE IF NOT EXISTS module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  
  -- Version info
  version TEXT NOT NULL, -- semver: 1.0.0, 1.0.1, etc.
  changelog TEXT,
  
  -- Snapshot of code at this version
  render_code TEXT,
  settings_schema JSONB,
  api_routes JSONB,
  styles TEXT,
  default_settings JSONB,
  
  -- Metadata
  is_breaking_change BOOLEAN DEFAULT FALSE,
  min_platform_version TEXT,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployment logs
CREATE TABLE IF NOT EXISTS module_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES module_versions(id) ON DELETE CASCADE,
  
  -- Deployment info
  environment TEXT NOT NULL, -- staging, production
  status TEXT DEFAULT 'pending', -- pending, deploying, success, failed, rolled_back
  
  -- Results
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Audit
  deployed_by UUID REFERENCES profiles(id)
);

-- Module analytics
CREATE TABLE IF NOT EXISTS module_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  
  -- Counts (updated periodically)
  total_installs INTEGER DEFAULT 0,
  active_installs INTEGER DEFAULT 0,
  weekly_installs INTEGER DEFAULT 0,
  uninstalls INTEGER DEFAULT 0,
  
  -- Performance
  avg_load_time_ms DECIMAL,
  error_count INTEGER DEFAULT 0,
  
  -- Revenue (cents)
  total_revenue_cents INTEGER DEFAULT 0,
  monthly_revenue_cents INTEGER DEFAULT 0,
  
  -- Period
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id)
);

-- Indexes
CREATE INDEX idx_module_source_status ON module_source(status);
CREATE INDEX idx_module_versions_source ON module_versions(module_source_id);
CREATE INDEX idx_module_deployments_source ON module_deployments(module_source_id);
```

---

### Task 80.2: Module Builder Service

**File: `src/lib/modules/module-builder.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export interface ModuleDefinition {
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  pricingTier: "free" | "starter" | "pro" | "enterprise";
  renderCode: string;
  settingsSchema: Record<string, unknown>;
  apiRoutes: Array<{
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    handler: string;
  }>;
  styles: string;
  defaultSettings: Record<string, unknown>;
  dependencies: string[];
}

export interface ModuleSource {
  id: string;
  moduleId: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  renderCode: string;
  settingsSchema: Record<string, unknown>;
  styles: string;
  defaultSettings: Record<string, unknown>;
  status: "draft" | "testing" | "published" | "deprecated";
  publishedVersion: string | null;
  latestVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createModule(
  definition: ModuleDefinition
): Promise<{ success: boolean; moduleId?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Generate module ID from slug
  const moduleId = definition.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  // Check if slug already exists
  const { data: existing } = await supabase
    .from("module_source")
    .select("id")
    .eq("slug", definition.slug)
    .single();

  if (existing) {
    return { success: false, error: "A module with this slug already exists" };
  }

  const { data, error } = await supabase
    .from("module_source")
    .insert({
      module_id: moduleId,
      name: definition.name,
      slug: definition.slug,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      pricing_tier: definition.pricingTier,
      render_code: definition.renderCode,
      settings_schema: definition.settingsSchema,
      api_routes: definition.apiRoutes,
      styles: definition.styles,
      default_settings: definition.defaultSettings,
      dependencies: definition.dependencies,
      status: "draft",
      latest_version: "0.0.1",
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("[ModuleBuilder] Create error:", error);
    return { success: false, error: "Failed to create module" };
  }

  // Create initial version
  await supabase.from("module_versions").insert({
    module_source_id: data.id,
    version: "0.0.1",
    changelog: "Initial version",
    render_code: definition.renderCode,
    settings_schema: definition.settingsSchema,
    api_routes: definition.apiRoutes,
    styles: definition.styles,
    default_settings: definition.defaultSettings,
    created_by: user.id,
  });

  return { success: true, moduleId };
}

export async function updateModule(
  moduleId: string,
  updates: Partial<ModuleDefinition>
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  if (updates.name) updateData.name = updates.name;
  if (updates.description) updateData.description = updates.description;
  if (updates.icon) updateData.icon = updates.icon;
  if (updates.category) updateData.category = updates.category;
  if (updates.pricingTier) updateData.pricing_tier = updates.pricingTier;
  if (updates.renderCode) updateData.render_code = updates.renderCode;
  if (updates.settingsSchema) updateData.settings_schema = updates.settingsSchema;
  if (updates.apiRoutes) updateData.api_routes = updates.apiRoutes;
  if (updates.styles) updateData.styles = updates.styles;
  if (updates.defaultSettings) updateData.default_settings = updates.defaultSettings;
  if (updates.dependencies) updateData.dependencies = updates.dependencies;

  const { error } = await supabase
    .from("module_source")
    .update(updateData)
    .eq("module_id", moduleId);

  if (error) {
    console.error("[ModuleBuilder] Update error:", error);
    return { success: false, error: "Failed to update module" };
  }

  return { success: true };
}

export async function getModuleSources(): Promise<ModuleSource[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("module_source")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((m) => ({
    id: m.id,
    moduleId: m.module_id,
    name: m.name,
    slug: m.slug,
    description: m.description,
    icon: m.icon,
    category: m.category,
    renderCode: m.render_code,
    settingsSchema: m.settings_schema,
    styles: m.styles,
    defaultSettings: m.default_settings,
    status: m.status,
    publishedVersion: m.published_version,
    latestVersion: m.latest_version,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }));
}

export async function getModuleSource(moduleId: string): Promise<ModuleSource | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("module_source")
    .select("*")
    .eq("module_id", moduleId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    moduleId: data.module_id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    icon: data.icon,
    category: data.category,
    renderCode: data.render_code,
    settingsSchema: data.settings_schema,
    styles: data.styles,
    defaultSettings: data.default_settings,
    status: data.status,
    publishedVersion: data.published_version,
    latestVersion: data.latest_version,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteModule(
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("module_source")
    .delete()
    .eq("module_id", moduleId);

  if (error) {
    return { success: false, error: "Failed to delete module" };
  }

  return { success: true };
}
```

---

### Task 80.3: Module Versioning Service

**File: `src/lib/modules/module-versioning.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export interface ModuleVersion {
  id: string;
  moduleSourceId: string;
  version: string;
  changelog: string;
  isBreakingChange: boolean;
  createdAt: string;
  createdBy: string;
}

function incrementVersion(
  currentVersion: string,
  type: "major" | "minor" | "patch"
): string {
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

export async function createVersion(
  moduleId: string,
  versionType: "major" | "minor" | "patch",
  changelog: string
): Promise<{ success: boolean; version?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Get current module
  const { data: module } = await supabase
    .from("module_source")
    .select("*")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return { success: false, error: "Module not found" };
  }

  const newVersion = incrementVersion(
    module.latest_version || "0.0.0",
    versionType
  );

  // Create version snapshot
  const { error } = await supabase.from("module_versions").insert({
    module_source_id: module.id,
    version: newVersion,
    changelog,
    render_code: module.render_code,
    settings_schema: module.settings_schema,
    api_routes: module.api_routes,
    styles: module.styles,
    default_settings: module.default_settings,
    is_breaking_change: versionType === "major",
    created_by: user.id,
  });

  if (error) {
    console.error("[Versioning] Create version error:", error);
    return { success: false, error: "Failed to create version" };
  }

  // Update latest version on module
  await supabase
    .from("module_source")
    .update({
      latest_version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("module_id", moduleId);

  return { success: true, version: newVersion };
}

export async function getModuleVersions(moduleId: string): Promise<ModuleVersion[]> {
  const supabase = await createClient();

  // First get module source ID
  const { data: module } = await supabase
    .from("module_source")
    .select("id")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return [];
  }

  const { data, error } = await supabase
    .from("module_versions")
    .select("*")
    .eq("module_source_id", module.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((v) => ({
    id: v.id,
    moduleSourceId: v.module_source_id,
    version: v.version,
    changelog: v.changelog || "",
    isBreakingChange: v.is_breaking_change,
    createdAt: v.created_at,
    createdBy: v.created_by,
  }));
}

export async function rollbackToVersion(
  moduleId: string,
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Get version data
  const { data: version } = await supabase
    .from("module_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (!version) {
    return { success: false, error: "Version not found" };
  }

  // Update module with version's code
  const { error } = await supabase
    .from("module_source")
    .update({
      render_code: version.render_code,
      settings_schema: version.settings_schema,
      api_routes: version.api_routes,
      styles: version.styles,
      default_settings: version.default_settings,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("module_id", moduleId);

  if (error) {
    return { success: false, error: "Failed to rollback" };
  }

  return { success: true };
}
```

---

### Task 80.4: Module Deployer Service

**File: `src/lib/modules/module-deployer.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createVersion } from "./module-versioning";

export interface DeploymentResult {
  success: boolean;
  deploymentId?: string;
  version?: string;
  error?: string;
}

export interface Deployment {
  id: string;
  moduleId: string;
  version: string;
  environment: "staging" | "production";
  status: "pending" | "deploying" | "success" | "failed" | "rolled_back";
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  deployedBy: string;
}

export async function deployModule(
  moduleId: string,
  environment: "staging" | "production",
  versionType: "major" | "minor" | "patch",
  changelog: string
): Promise<DeploymentResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Get module source
  const { data: module } = await supabase
    .from("module_source")
    .select("*")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return { success: false, error: "Module not found" };
  }

  // Create new version
  const versionResult = await createVersion(moduleId, versionType, changelog);
  if (!versionResult.success) {
    return { success: false, error: versionResult.error };
  }

  // Get version ID
  const { data: versionData } = await supabase
    .from("module_versions")
    .select("id")
    .eq("module_source_id", module.id)
    .eq("version", versionResult.version!)
    .single();

  if (!versionData) {
    return { success: false, error: "Failed to find created version" };
  }

  // Create deployment record
  const { data: deployment, error } = await supabase
    .from("module_deployments")
    .insert({
      module_source_id: module.id,
      version_id: versionData.id,
      environment,
      status: "deploying",
      deployed_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Failed to create deployment" };
  }

  try {
    // Simulate deployment process
    // In production, this would:
    // 1. Validate the module code
    // 2. Bundle/compile if needed
    // 3. Update the module registry
    // 4. Clear caches
    // 5. Notify dependent sites

    // Update module status based on environment
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (environment === "production") {
      updateData.status = "published";
      updateData.published_version = versionResult.version;
      updateData.published_at = new Date().toISOString();
    } else {
      updateData.status = "testing";
    }

    await supabase
      .from("module_source")
      .update(updateData)
      .eq("module_id", moduleId);

    // Update deployment status
    await supabase
      .from("module_deployments")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
      })
      .eq("id", deployment.id);

    // If production, also add to MODULE_CATALOG synchronization
    if (environment === "production") {
      await syncModuleToCatalog(module);
    }

    return {
      success: true,
      deploymentId: deployment.id,
      version: versionResult.version,
    };
  } catch (error) {
    // Mark deployment as failed
    await supabase
      .from("module_deployments")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", deployment.id);

    return { success: false, error: "Deployment failed" };
  }
}

async function syncModuleToCatalog(module: Record<string, unknown>): Promise<void> {
  // In production, this would update the module catalog
  // For now, this is a placeholder that logs the sync
  console.log(`[Deployer] Syncing module ${module.module_id} to catalog`);
  
  // The module would be added to a dynamic modules table or
  // trigger a rebuild of the module catalog
}

export async function getDeployments(moduleId: string): Promise<Deployment[]> {
  const supabase = await createClient();

  const { data: module } = await supabase
    .from("module_source")
    .select("id")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return [];
  }

  const { data, error } = await supabase
    .from("module_deployments")
    .select(`
      *,
      version:module_versions(version)
    `)
    .eq("module_source_id", module.id)
    .order("started_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((d) => ({
    id: d.id,
    moduleId,
    version: (d.version as { version: string })?.version || "unknown",
    environment: d.environment,
    status: d.status,
    startedAt: d.started_at,
    completedAt: d.completed_at,
    errorMessage: d.error_message,
    deployedBy: d.deployed_by,
  }));
}

export async function rollbackDeployment(
  deploymentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get deployment
  const { data: deployment } = await supabase
    .from("module_deployments")
    .select(`
      *,
      module:module_source(module_id),
      version:module_versions(*)
    `)
    .eq("id", deploymentId)
    .single();

  if (!deployment) {
    return { success: false, error: "Deployment not found" };
  }

  // Mark as rolled back
  await supabase
    .from("module_deployments")
    .update({ status: "rolled_back" })
    .eq("id", deploymentId);

  // Find previous successful deployment
  const { data: previousDeployment } = await supabase
    .from("module_deployments")
    .select("version_id")
    .eq("module_source_id", deployment.module_source_id)
    .eq("status", "success")
    .neq("id", deploymentId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (previousDeployment) {
    // Restore previous version's code
    const { data: prevVersion } = await supabase
      .from("module_versions")
      .select("*")
      .eq("id", previousDeployment.version_id)
      .single();

    if (prevVersion) {
      await supabase
        .from("module_source")
        .update({
          render_code: prevVersion.render_code,
          settings_schema: prevVersion.settings_schema,
          api_routes: prevVersion.api_routes,
          styles: prevVersion.styles,
          default_settings: prevVersion.default_settings,
          published_version: prevVersion.version,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deployment.module_source_id);
    }
  }

  return { success: true };
}
```

---

### Task 80.5: Module Code Editor Component

**File: `src/components/admin/modules/module-code-editor.tsx`**

```tsx
"use client";

import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Check, AlertCircle } from "lucide-react";

interface ModuleCodeEditorProps {
  renderCode: string;
  styles: string;
  settingsSchema: string;
  onRenderCodeChange: (code: string) => void;
  onStylesChange: (styles: string) => void;
  onSettingsSchemaChange: (schema: string) => void;
  onValidate?: () => Promise<{ valid: boolean; errors: string[] }>;
}

export function ModuleCodeEditor({
  renderCode,
  styles,
  settingsSchema,
  onRenderCodeChange,
  onStylesChange,
  onSettingsSchemaChange,
  onValidate,
}: ModuleCodeEditorProps) {
  const [activeTab, setActiveTab] = useState("render");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
  } | null>(null);

  const handleValidate = useCallback(async () => {
    if (!onValidate) return;

    setValidating(true);
    const result = await onValidate();
    setValidationResult(result);
    setValidating(false);
  }, [onValidate]);

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on" as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
  };

  return (
    <Card className="h-full">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Module Code</CardTitle>
          <div className="flex items-center gap-2">
            {validationResult && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  validationResult.valid
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                {validationResult.valid ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {validationResult.valid
                  ? "Valid"
                  : `${validationResult.errors.length} errors`}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={validating}
            >
              {validating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Validate
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-[600px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="w-full justify-start rounded-none border-b px-2">
            <TabsTrigger value="render">Render (TSX)</TabsTrigger>
            <TabsTrigger value="styles">Styles (CSS)</TabsTrigger>
            <TabsTrigger value="schema">Settings Schema</TabsTrigger>
          </TabsList>

          <TabsContent value="render" className="h-[calc(100%-48px)] m-0">
            <Editor
              height="100%"
              language="typescript"
              theme="vs-dark"
              value={renderCode}
              onChange={(value) => onRenderCodeChange(value || "")}
              options={editorOptions}
            />
          </TabsContent>

          <TabsContent value="styles" className="h-[calc(100%-48px)] m-0">
            <Editor
              height="100%"
              language="css"
              theme="vs-dark"
              value={styles}
              onChange={(value) => onStylesChange(value || "")}
              options={editorOptions}
            />
          </TabsContent>

          <TabsContent value="schema" className="h-[calc(100%-48px)] m-0">
            <Editor
              height="100%"
              language="json"
              theme="vs-dark"
              value={settingsSchema}
              onChange={(value) => onSettingsSchemaChange(value || "")}
              options={editorOptions}
            />
          </TabsContent>
        </Tabs>

        {validationResult && !validationResult.valid && (
          <div className="absolute bottom-0 left-0 right-0 bg-destructive/10 border-t border-destructive p-3">
            <h4 className="font-medium text-destructive mb-2">Validation Errors:</h4>
            <ul className="text-sm text-destructive space-y-1">
              {validationResult.errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Task 80.6: Module Config Form Component

**File: `src/components/admin/modules/module-config-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ModuleConfigFormProps {
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  pricingTier: string;
  dependencies: string[];
  onChange: (field: string, value: unknown) => void;
  isNew?: boolean;
}

const CATEGORIES = [
  { value: "analytics", label: "Analytics & Tracking" },
  { value: "seo", label: "SEO & Marketing" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "forms", label: "Forms & Lead Gen" },
  { value: "chat", label: "Chat & Support" },
  { value: "social", label: "Social Media" },
  { value: "content", label: "Content & Media" },
  { value: "security", label: "Security & Privacy" },
  { value: "performance", label: "Performance" },
  { value: "integration", label: "Integrations" },
  { value: "other", label: "Other" },
];

const PRICING_TIERS = [
  { value: "free", label: "Free", color: "bg-green-100 text-green-800" },
  { value: "starter", label: "Starter ($5-$15/mo)", color: "bg-blue-100 text-blue-800" },
  { value: "pro", label: "Pro ($20-$50/mo)", color: "bg-purple-100 text-purple-800" },
  { value: "enterprise", label: "Enterprise ($100+/mo)", color: "bg-amber-100 text-amber-800" },
];

const ICON_SUGGESTIONS = [
  "📊", "📈", "🔍", "💬", "📧", "🛒", "💳", "🔒", "⚡",
  "🎨", "📱", "🌐", "📝", "🔗", "🎯", "📢", "💡", "🚀"
];

export function ModuleConfigForm({
  name,
  slug,
  description,
  icon,
  category,
  pricingTier,
  dependencies,
  onChange,
  isNew = false,
}: ModuleConfigFormProps) {
  const [newDep, setNewDep] = useState("");

  const addDependency = () => {
    if (newDep && !dependencies.includes(newDep)) {
      onChange("dependencies", [...dependencies, newDep]);
      setNewDep("");
    }
  };

  const removeDependency = (dep: string) => {
    onChange("dependencies", dependencies.filter((d) => d !== dep));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Configuration</CardTitle>
        <CardDescription>
          Basic settings and metadata for your module
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Name & Slug */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Module Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="My Awesome Module"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL-friendly ID)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => onChange("slug", e.target.value)}
              placeholder="my-awesome-module"
              disabled={!isNew}
            />
            {!isNew && (
              <p className="text-xs text-muted-foreground">
                Slug cannot be changed after creation
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Describe what your module does..."
            rows={3}
          />
        </div>

        {/* Icon Selection */}
        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="flex items-center gap-2">
            <div className="text-4xl border rounded-lg p-2">{icon || "📦"}</div>
            <div className="flex flex-wrap gap-1">
              {ICON_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`text-xl p-1 rounded hover:bg-muted ${
                    icon === emoji ? "bg-primary/20 ring-1 ring-primary" : ""
                  }`}
                  onClick={() => onChange("icon", emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category & Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => onChange("category", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pricing Tier</Label>
            <Select
              value={pricingTier}
              onValueChange={(v) => onChange("pricingTier", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pricing" />
              </SelectTrigger>
              <SelectContent>
                {PRICING_TIERS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dependencies */}
        <div className="space-y-2">
          <Label>Dependencies (other modules required)</Label>
          <div className="flex gap-2">
            <Input
              value={newDep}
              onChange={(e) => setNewDep(e.target.value)}
              placeholder="module-id"
              onKeyDown={(e) => e.key === "Enter" && addDependency()}
            />
            <Button type="button" variant="outline" onClick={addDependency}>
              Add
            </Button>
          </div>
          {dependencies.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {dependencies.map((dep) => (
                <Badge key={dep} variant="secondary" className="gap-1">
                  {dep}
                  <button
                    type="button"
                    onClick={() => removeDependency(dep)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 80.7: Module Deploy Dialog Component

**File: `src/components/admin/modules/module-deploy-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Rocket, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deployModule } from "@/lib/modules/module-deployer";

interface ModuleDeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  currentVersion: string;
  onSuccess?: (version: string) => void;
}

export function ModuleDeployDialog({
  open,
  onOpenChange,
  moduleId,
  moduleName,
  currentVersion,
  onSuccess,
}: ModuleDeployDialogProps) {
  const [environment, setEnvironment] = useState<"staging" | "production">("staging");
  const [versionType, setVersionType] = useState<"patch" | "minor" | "major">("patch");
  const [changelog, setChangelog] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    version?: string;
    error?: string;
  } | null>(null);

  const getNextVersion = () => {
    const [major, minor, patch] = currentVersion.split(".").map(Number);
    switch (versionType) {
      case "major":
        return `${major + 1}.0.0`;
      case "minor":
        return `${major}.${minor + 1}.0`;
      case "patch":
        return `${major}.${minor}.${patch + 1}`;
    }
  };

  const handleDeploy = async () => {
    if (!changelog.trim()) {
      setResult({ success: false, error: "Please provide a changelog" });
      return;
    }

    setDeploying(true);
    setResult(null);

    const deployResult = await deployModule(
      moduleId,
      environment,
      versionType,
      changelog
    );

    setDeploying(false);
    setResult(deployResult);

    if (deployResult.success && onSuccess) {
      onSuccess(deployResult.version!);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Deploy {moduleName}
          </DialogTitle>
          <DialogDescription>
            Current version: {currentVersion} → Next: {getNextVersion()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Environment */}
          <div className="space-y-3">
            <Label>Environment</Label>
            <RadioGroup
              value={environment}
              onValueChange={(v) => setEnvironment(v as typeof environment)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="staging"
                className={`flex flex-col p-4 border rounded-lg cursor-pointer ${
                  environment === "staging"
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <RadioGroupItem value="staging" id="staging" className="sr-only" />
                <span className="font-medium">Staging</span>
                <span className="text-sm text-muted-foreground">
                  Test before going live
                </span>
              </Label>

              <Label
                htmlFor="production"
                className={`flex flex-col p-4 border rounded-lg cursor-pointer ${
                  environment === "production"
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <RadioGroupItem value="production" id="production" className="sr-only" />
                <span className="font-medium">Production</span>
                <span className="text-sm text-muted-foreground">
                  Live to all users
                </span>
              </Label>
            </RadioGroup>
          </div>

          {/* Version Type */}
          <div className="space-y-3">
            <Label>Version Bump</Label>
            <RadioGroup
              value={versionType}
              onValueChange={(v) => setVersionType(v as typeof versionType)}
              className="grid grid-cols-3 gap-3"
            >
              <Label
                htmlFor="patch"
                className={`flex flex-col p-3 border rounded-lg cursor-pointer text-center ${
                  versionType === "patch" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="patch" id="patch" className="sr-only" />
                <span className="font-medium">Patch</span>
                <span className="text-xs text-muted-foreground">Bug fixes</span>
              </Label>

              <Label
                htmlFor="minor"
                className={`flex flex-col p-3 border rounded-lg cursor-pointer text-center ${
                  versionType === "minor" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="minor" id="minor" className="sr-only" />
                <span className="font-medium">Minor</span>
                <span className="text-xs text-muted-foreground">New features</span>
              </Label>

              <Label
                htmlFor="major"
                className={`flex flex-col p-3 border rounded-lg cursor-pointer text-center ${
                  versionType === "major" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="major" id="major" className="sr-only" />
                <span className="font-medium">Major</span>
                <span className="text-xs text-muted-foreground">Breaking changes</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Changelog */}
          <div className="space-y-2">
            <Label htmlFor="changelog">Changelog</Label>
            <Textarea
              id="changelog"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="Describe what changed in this version..."
              rows={3}
            />
          </div>

          {/* Warnings */}
          {environment === "production" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will deploy to production and affect all sites using this module.
              </AlertDescription>
            </Alert>
          )}

          {/* Result */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.success
                  ? `Successfully deployed version ${result.version}`
                  : result.error || "Deployment failed"}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deploying}
          >
            Cancel
          </Button>
          <Button onClick={handleDeploy} disabled={deploying}>
            {deploying ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Deploy to {environment}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 80.8: Module Studio Main Page

**File: `src/app/(dashboard)/admin/modules/studio/page.tsx`**

```tsx
import Link from "next/link";
import { Plus, Code, Package, Rocket, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getModuleSources } from "@/lib/modules/module-builder";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  testing: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  deprecated: "bg-red-100 text-red-800",
};

export default async function ModuleStudioPage() {
  const modules = await getModuleSources();

  const draftCount = modules.filter((m) => m.status === "draft").length;
  const testingCount = modules.filter((m) => m.status === "testing").length;
  const publishedCount = modules.filter((m) => m.status === "published").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6" />
            Module Development Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and deploy modules for the marketplace
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/modules/studio/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Module
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Modules</span>
            </div>
            <p className="text-3xl font-bold mt-2">{modules.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-muted-foreground">Draft</span>
            </div>
            <p className="text-3xl font-bold mt-2">{draftCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Testing</span>
            </div>
            <p className="text-3xl font-bold mt-2">{testingCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Published</span>
            </div>
            <p className="text-3xl font-bold mt-2">{publishedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Modules</CardTitle>
          <CardDescription>
            Manage modules you've created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No modules yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first module to get started
              </p>
              <Button asChild>
                <Link href="/admin/modules/studio/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Module
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.moduleId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{module.icon}</span>
                        <div>
                          <p className="font-medium">{module.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {module.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{module.category}</span>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                        {module.latestVersion || "0.0.1"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[module.status as keyof typeof statusColors]}
                      >
                        {module.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(module.updatedAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/modules/studio/${module.moduleId}`}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 80.9: Create New Module Page

**File: `src/app/(dashboard)/admin/modules/studio/new/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleConfigForm } from "@/components/admin/modules/module-config-form";
import { ModuleCodeEditor } from "@/components/admin/modules/module-code-editor";
import { createModule } from "@/lib/modules/module-builder";
import { toast } from "sonner";
import Link from "next/link";

const DEFAULT_RENDER_CODE = `// Module Render Component
// This code runs inside the Craft.js editor

import { useNode } from "@craftjs/core";

export function ModuleComponent({ settings }) {
  const { connectors: { connect, drag } } = useNode();
  
  return (
    <div ref={(ref) => connect(drag(ref))} className="p-4">
      <h3>{settings.title || "My Module"}</h3>
      <p>{settings.description || "Module content here"}</p>
    </div>
  );
}

ModuleComponent.craft = {
  displayName: "My Module",
  props: {},
  rules: {
    canDrag: () => true,
  },
};

export default ModuleComponent;
`;

const DEFAULT_SETTINGS_SCHEMA = `{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "title": "Title",
      "default": "My Module"
    },
    "description": {
      "type": "string",
      "title": "Description",
      "default": "Module content here"
    }
  }
}`;

const DEFAULT_STYLES = `/* Module Custom Styles */
.module-container {
  padding: 1rem;
  border-radius: 0.5rem;
}
`;

export default function CreateModulePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [category, setCategory] = useState("other");
  const [pricingTier, setPricingTier] = useState("free");
  const [dependencies, setDependencies] = useState<string[]>([]);

  // Code state
  const [renderCode, setRenderCode] = useState(DEFAULT_RENDER_CODE);
  const [styles, setStyles] = useState(DEFAULT_STYLES);
  const [settingsSchema, setSettingsSchema] = useState(DEFAULT_SETTINGS_SCHEMA);

  const handleFieldChange = (field: string, value: unknown) => {
    switch (field) {
      case "name":
        setName(value as string);
        // Auto-generate slug from name
        if (!slug || slug === generateSlug(name)) {
          setSlug(generateSlug(value as string));
        }
        break;
      case "slug":
        setSlug(value as string);
        break;
      case "description":
        setDescription(value as string);
        break;
      case "icon":
        setIcon(value as string);
        break;
      case "category":
        setCategory(value as string);
        break;
      case "pricingTier":
        setPricingTier(value as string);
        break;
      case "dependencies":
        setDependencies(value as string[]);
        break;
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSave = async () => {
    if (!name || !slug) {
      toast.error("Please provide a name and slug");
      return;
    }

    setSaving(true);

    try {
      // Parse settings schema
      let parsedSchema = {};
      try {
        parsedSchema = JSON.parse(settingsSchema);
      } catch {
        toast.error("Invalid settings schema JSON");
        setSaving(false);
        return;
      }

      const result = await createModule({
        name,
        slug,
        description,
        icon,
        category,
        pricingTier: pricingTier as "free" | "starter" | "pro" | "enterprise",
        renderCode,
        settingsSchema: parsedSchema,
        apiRoutes: [],
        styles,
        defaultSettings: {},
        dependencies,
      });

      if (result.success) {
        toast.success("Module created successfully");
        router.push(`/admin/modules/studio/${result.moduleId}`);
      } else {
        toast.error(result.error || "Failed to create module");
      }
    } catch (error) {
      toast.error("Failed to create module");
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/modules/studio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Module</h1>
            <p className="text-muted-foreground">
              Build a new module for the marketplace
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Module
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <ModuleConfigForm
          name={name}
          slug={slug}
          description={description}
          icon={icon}
          category={category}
          pricingTier={pricingTier}
          dependencies={dependencies}
          onChange={handleFieldChange}
          isNew
        />

        {/* Right: Code Editor */}
        <ModuleCodeEditor
          renderCode={renderCode}
          styles={styles}
          settingsSchema={settingsSchema}
          onRenderCodeChange={setRenderCode}
          onStylesChange={setStyles}
          onSettingsSchemaChange={setSettingsSchema}
        />
      </div>
    </div>
  );
}
```

---

### Task 80.10: Edit Module Page

**File: `src/app/(dashboard)/admin/modules/studio/[moduleId]/page.tsx`**

```tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Rocket, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleConfigForm } from "@/components/admin/modules/module-config-form";
import { ModuleCodeEditor } from "@/components/admin/modules/module-code-editor";
import { ModuleDeployDialog } from "@/components/admin/modules/module-deploy-dialog";
import {
  getModuleSource,
  updateModule,
  deleteModule,
  type ModuleSource,
} from "@/lib/modules/module-builder";
import { getModuleVersions, type ModuleVersion } from "@/lib/modules/module-versioning";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = use(params);
  const router = useRouter();

  const [module, setModule] = useState<ModuleSource | null>(null);
  const [versions, setVersions] = useState<ModuleVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [category, setCategory] = useState("other");
  const [pricingTier, setPricingTier] = useState("free");
  const [dependencies, setDependencies] = useState<string[]>([]);

  // Code state
  const [renderCode, setRenderCode] = useState("");
  const [styles, setStyles] = useState("");
  const [settingsSchema, setSettingsSchema] = useState("{}");

  useEffect(() => {
    loadModule();
  }, [moduleId]);

  const loadModule = async () => {
    setLoading(true);
    const data = await getModuleSource(moduleId);
    const versionData = await getModuleVersions(moduleId);

    if (data) {
      setModule(data);
      setName(data.name);
      setDescription(data.description);
      setIcon(data.icon);
      setCategory(data.category);
      setRenderCode(data.renderCode);
      setStyles(data.styles);
      setSettingsSchema(JSON.stringify(data.settingsSchema, null, 2));
    }

    setVersions(versionData);
    setLoading(false);
  };

  const handleFieldChange = (field: string, value: unknown) => {
    switch (field) {
      case "name":
        setName(value as string);
        break;
      case "description":
        setDescription(value as string);
        break;
      case "icon":
        setIcon(value as string);
        break;
      case "category":
        setCategory(value as string);
        break;
      case "pricingTier":
        setPricingTier(value as string);
        break;
      case "dependencies":
        setDependencies(value as string[]);
        break;
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      let parsedSchema = {};
      try {
        parsedSchema = JSON.parse(settingsSchema);
      } catch {
        toast.error("Invalid settings schema JSON");
        setSaving(false);
        return;
      }

      const result = await updateModule(moduleId, {
        name,
        description,
        icon,
        category,
        pricingTier: pricingTier as "free" | "starter" | "pro" | "enterprise",
        renderCode,
        settingsSchema: parsedSchema,
        styles,
        dependencies,
      });

      if (result.success) {
        toast.success("Module saved");
        loadModule();
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save module");
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    const result = await deleteModule(moduleId);
    if (result.success) {
      toast.success("Module deleted");
      router.push("/admin/modules/studio");
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">Module not found</h2>
        <Button asChild className="mt-4">
          <Link href="/admin/modules/studio">Back to Studio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/modules/studio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{name}</h1>
                <Badge variant="secondary">{module.status}</Badge>
              </div>
              <p className="text-muted-foreground">
                v{module.latestVersion || "0.0.1"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Module?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{name}" and all its versions.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="outline" onClick={() => setDeployOpen(true)}>
            <Rocket className="h-4 w-4 mr-2" />
            Deploy
          </Button>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <ModuleConfigForm
            name={name}
            slug={module.slug}
            description={description}
            icon={icon}
            category={category}
            pricingTier={pricingTier}
            dependencies={dependencies}
            onChange={handleFieldChange}
          />

          {/* Version History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No versions yet</p>
              ) : (
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-start justify-between text-sm"
                    >
                      <div>
                        <code className="bg-muted px-1.5 py-0.5 rounded">
                          v{v.version}
                        </code>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {v.changelog}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Code Editor */}
        <div className="lg:col-span-2">
          <ModuleCodeEditor
            renderCode={renderCode}
            styles={styles}
            settingsSchema={settingsSchema}
            onRenderCodeChange={setRenderCode}
            onStylesChange={setStyles}
            onSettingsSchemaChange={setSettingsSchema}
          />
        </div>
      </div>

      {/* Deploy Dialog */}
      <ModuleDeployDialog
        open={deployOpen}
        onOpenChange={setDeployOpen}
        moduleId={moduleId}
        moduleName={name}
        currentVersion={module.latestVersion || "0.0.0"}
        onSuccess={() => loadModule()}
      />
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Module creation saves correctly
- [ ] Module updates save correctly
- [ ] Version incrementing works
- [ ] Code validation catches errors

### Integration Tests
- [ ] Create → Edit → Deploy workflow
- [ ] Version rollback works
- [ ] Module appears in catalog after deploy
- [ ] Code editor saves on change

### E2E Tests
- [ ] Super admin can access studio
- [ ] Create new module with code
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Module appears in marketplace

---

## ✅ Completion Checklist

- [ ] Database schema for module source/versions
- [ ] Module builder service
- [ ] Module versioning service
- [ ] Module deployer service
- [ ] Code editor component (Monaco)
- [ ] Config form component
- [ ] Deploy dialog component
- [ ] Studio listing page
- [ ] Create module page
- [ ] Edit module page
- [ ] Monaco editor package installed
- [ ] Tests passing

---

**Next Phase**: Identify remaining gaps and create additional phases
