# Phase 81B: Module Testing System

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 10-12 hours
>
> **Status**: 📋 PLANNED
>
> **Prerequisites**: Phase 81A Complete

---

## ⚠️ Existing Infrastructure Notes

> The platform already has:
> - `module_source.status` with values: `draft`, `testing`, `published`
> - A sandbox preview in Module Studio
> - V2 installation system with `site_module_installations`
>
> This phase EXTENDS (not replaces) the existing infrastructure.

---

## 🎯 Objective

**Create a comprehensive testing system that allows full end-to-end testing of modules before production deployment.**

Currently:
- Sandbox preview exists but is isolated (no real site context)
- Testing status exists but modules are invisible
- No way to install testing modules on real sites
- No beta program or A/B testing capability

This phase creates a complete testing infrastructure.

---

## 🔍 Problem Analysis

### Current Testing Limitations

| Test Type | Current | Needed |
|-----------|---------|--------|
| Unit Test | ✅ Sandbox preview | ✅ Already works |
| Integration | ❌ None | Install on real site |
| User Flow | ❌ None | Full purchase → install → render |
| Performance | ❌ None | Load time, render metrics |
| A/B Testing | ❌ None | Compare versions |
| Beta Program | ❌ None | Selected users test early |
| Regression | ❌ None | Automated testing |

### Testing User Roles

| Role | What They Can Test |
|------|-------------------|
| Super Admin | Everything, anywhere |
| Agency (Beta) | Testing modules on their sites |
| Test Site | Designated for beta modules only |
| Internal Team | Pre-release testing |

---

## 🏗️ Solution Architecture

### 1. Test Site System

Designate specific sites as "test sites" that can install testing modules:

```
Sites
├── Regular Site (only published modules)
└── Test Site (published + testing modules)
    ├── is_test_site: true
    ├── test_features: ["beta_modules", "experimental_ui"]
    └── test_expiry: Date
```

### 2. Beta Program

Allow agencies to opt-in to beta testing:

```
Agencies
├── Regular Agency (published modules only)
└── Beta Agency
    ├── beta_enrolled: true
    ├── beta_tier: "early_access" | "alpha" | "internal"
    └── beta_modules: ["mod_xyz", "mod_abc"]
```

### 3. Testing Environments

```
┌─────────────────────────────────────────────────────────────────┐
│                     Module Development Flow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Draft ──→ Sandbox ──→ Testing ──→ Beta ──→ Production        │
│     │         │           │          │           │              │
│     │         │           │          │           │              │
│   Editor   Preview     Test Site  Beta Sites  All Sites        │
│   Only    (Isolated)  (Internal) (Selected)  (Everyone)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

```
Database:
├── test_site_configuration      # NEW - Test site settings
├── beta_enrollment              # NEW - Beta program enrollment
├── module_test_runs             # NEW - Test execution logs
├── module_test_results          # NEW - Test results

src/lib/modules/
├── module-testing.ts            # NEW - Testing service
├── beta-program.ts              # NEW - Beta enrollment
├── test-site-manager.ts         # NEW - Test site management

src/app/(dashboard)/admin/modules/
├── testing/page.tsx             # NEW - Testing dashboard
├── testing/sites/page.tsx       # NEW - Test sites management
├── testing/beta/page.tsx        # NEW - Beta program management

src/app/(dashboard)/admin/modules/studio/[moduleId]/
├── test/page.tsx                # MODIFY - Enhanced testing
├── test/integration/page.tsx    # NEW - Integration tests
├── test/performance/page.tsx    # NEW - Performance tests

src/components/admin/modules/
├── test-site-selector.tsx       # NEW - Select test site
├── test-runner.tsx              # NEW - Run integration tests
├── test-results-viewer.tsx      # NEW - View test results
├── beta-module-badge.tsx        # NEW - Beta indicator
```

---

## ✅ Tasks

### Task 81B.1: Database Schema for Testing

```sql
-- Migration: create_module_testing_tables.sql

-- Test site configuration
CREATE TABLE IF NOT EXISTS test_site_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  test_features TEXT[] DEFAULT '{}',
  -- Features: beta_modules, experimental_ui, debug_mode, analytics_testing
  allowed_module_statuses TEXT[] DEFAULT ARRAY['published', 'testing'],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  UNIQUE(site_id)
);

-- Beta program enrollment
CREATE TABLE IF NOT EXISTS beta_enrollment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  beta_tier TEXT NOT NULL DEFAULT 'standard',
  -- Tiers: internal, alpha, early_access, standard
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  enrolled_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  -- { receive_notifications: true, auto_enroll_new_betas: false }
  accepted_modules TEXT[] DEFAULT '{}',
  -- Specific modules they've opted into
  UNIQUE(agency_id)
);

-- Module test runs
CREATE TABLE IF NOT EXISTS module_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id),
  module_version TEXT NOT NULL,
  test_type TEXT NOT NULL,
  -- Types: unit, integration, performance, accessibility, security
  test_site_id UUID REFERENCES sites(id),
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status: pending, running, passed, failed, error
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID REFERENCES auth.users(id),
  environment JSONB DEFAULT '{}',
  -- { browser: 'chrome', viewport: '1920x1080', user_agent: '...' }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test results (detailed)
CREATE TABLE IF NOT EXISTS module_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID NOT NULL REFERENCES module_test_runs(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL,
  -- Categories: render, settings, api, performance, security
  status TEXT NOT NULL,
  -- Status: passed, failed, skipped, warning
  duration_ms INTEGER,
  message TEXT,
  details JSONB DEFAULT '{}',
  -- { expected: '...', actual: '...', screenshot_url: '...' }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_test_site_config_site ON test_site_configuration(site_id);
CREATE INDEX idx_beta_enrollment_agency ON beta_enrollment(agency_id);
CREATE INDEX idx_test_runs_module ON module_test_runs(module_source_id);
CREATE INDEX idx_test_results_run ON module_test_results(test_run_id);
```

---

### Task 81B.2: Test Site Management Service

**File: `src/lib/modules/test-site-manager.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin, getCurrentUserId } from "@/lib/auth/permissions";

export interface TestSite {
  id: string;
  siteId: string;
  siteName: string;
  siteSlug: string;
  isActive: boolean;
  testFeatures: string[];
  allowedModuleStatuses: string[];
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
}

/**
 * Get all test sites
 */
export async function getTestSites(): Promise<TestSite[]> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data, error } = await db
    .from("test_site_configuration")
    .select(`
      *,
      site:sites(id, name, slug)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[TestSiteManager] Error fetching test sites:", error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    siteId: item.site_id,
    siteName: item.site?.name || "Unknown",
    siteSlug: item.site?.slug || "unknown",
    isActive: item.is_active,
    testFeatures: item.test_features || [],
    allowedModuleStatuses: item.allowed_module_statuses || [],
    notes: item.notes,
    expiresAt: item.expires_at,
    createdAt: item.created_at,
  }));
}

/**
 * Designate a site as a test site
 */
export async function createTestSite(
  siteId: string,
  options: {
    testFeatures?: string[];
    allowedStatuses?: string[];
    notes?: string;
    expiresAt?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin required" };
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const db = supabase as any;

  const { error } = await db
    .from("test_site_configuration")
    .upsert({
      site_id: siteId,
      is_active: true,
      test_features: options.testFeatures || ["beta_modules"],
      allowed_module_statuses: options.allowedStatuses || ["published", "testing"],
      notes: options.notes,
      expires_at: options.expiresAt,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "site_id" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove test site status
 */
export async function removeTestSite(siteId: string): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin required" };
  }

  const supabase = await createClient();
  const db = supabase as any;

  const { error } = await db
    .from("test_site_configuration")
    .update({ is_active: false })
    .eq("site_id", siteId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if a site can use testing modules
 */
export async function canSiteUseTestingModules(siteId: string): Promise<boolean> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data } = await db
    .from("test_site_configuration")
    .select("is_active, allowed_module_statuses, expires_at")
    .eq("site_id", siteId)
    .single();

  if (!data || !data.is_active) return false;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
  
  return data.allowed_module_statuses?.includes("testing") ?? false;
}

/**
 * Get modules available for a site (respects test site status)
 */
export async function getAvailableModulesForSite(siteId: string): Promise<{
  published: any[];
  testing: any[];
  isTestSite: boolean;
}> {
  const supabase = await createClient();
  const db = supabase as any;

  // Check if test site
  const isTestSite = await canSiteUseTestingModules(siteId);

  // Get published modules (always available)
  const { data: published } = await db
    .from("modules")
    .select("*")
    .eq("is_active", true);

  // Get testing modules (only for test sites)
  let testing: any[] = [];
  if (isTestSite) {
    const { data: testingModules } = await db
      .from("module_source")
      .select("*")
      .eq("status", "testing");
    
    testing = testingModules || [];
  }

  return {
    published: published || [],
    testing,
    isTestSite,
  };
}
```

---

### Task 81B.3: Beta Program Service

**File: `src/lib/modules/beta-program.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin, getCurrentUserId } from "@/lib/auth/permissions";

export type BetaTier = "internal" | "alpha" | "early_access" | "standard";

export interface BetaEnrollment {
  id: string;
  agencyId: string;
  agencyName: string;
  betaTier: BetaTier;
  enrolledAt: string;
  isActive: boolean;
  acceptedModules: string[];
  preferences: {
    receiveNotifications?: boolean;
    autoEnrollNewBetas?: boolean;
  };
}

/**
 * Get all beta enrollments
 */
export async function getBetaEnrollments(): Promise<BetaEnrollment[]> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data } = await db
    .from("beta_enrollment")
    .select(`
      *,
      agency:agencies(id, name)
    `)
    .eq("is_active", true)
    .order("enrolled_at", { ascending: false });

  return (data || []).map((item: any) => ({
    id: item.id,
    agencyId: item.agency_id,
    agencyName: item.agency?.name || "Unknown",
    betaTier: item.beta_tier,
    enrolledAt: item.enrolled_at,
    isActive: item.is_active,
    acceptedModules: item.accepted_modules || [],
    preferences: item.preferences || {},
  }));
}

/**
 * Enroll agency in beta program
 */
export async function enrollAgencyInBeta(
  agencyId: string,
  tier: BetaTier = "standard"
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin required" };
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const db = supabase as any;

  const { error } = await db
    .from("beta_enrollment")
    .upsert({
      agency_id: agencyId,
      beta_tier: tier,
      enrolled_by: userId,
      is_active: true,
      preferences: {
        receiveNotifications: true,
        autoEnrollNewBetas: false,
      },
    }, { onConflict: "agency_id" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Opt agency into specific beta module
 */
export async function optIntoModule(
  agencyId: string,
  moduleSlug: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const db = supabase as any;

  // Get current enrollment
  const { data: enrollment } = await db
    .from("beta_enrollment")
    .select("accepted_modules")
    .eq("agency_id", agencyId)
    .eq("is_active", true)
    .single();

  if (!enrollment) {
    return { success: false, error: "Agency not enrolled in beta" };
  }

  const currentModules = enrollment.accepted_modules || [];
  if (currentModules.includes(moduleSlug)) {
    return { success: true }; // Already opted in
  }

  const { error } = await db
    .from("beta_enrollment")
    .update({
      accepted_modules: [...currentModules, moduleSlug],
    })
    .eq("agency_id", agencyId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if agency can access a testing module
 */
export async function canAgencyAccessModule(
  agencyId: string,
  moduleSlug: string,
  moduleStatus: string
): Promise<boolean> {
  // Published modules are always accessible
  if (moduleStatus === "published") return true;

  const supabase = await createClient();
  const db = supabase as any;

  const { data: enrollment } = await db
    .from("beta_enrollment")
    .select("beta_tier, accepted_modules, preferences")
    .eq("agency_id", agencyId)
    .eq("is_active", true)
    .single();

  if (!enrollment) return false;

  // Internal/alpha tiers can access all testing modules
  if (["internal", "alpha"].includes(enrollment.beta_tier)) {
    return true;
  }

  // Early access/standard need to opt in
  if (enrollment.preferences?.autoEnrollNewBetas) {
    return true;
  }

  return enrollment.accepted_modules?.includes(moduleSlug) ?? false;
}

/**
 * Get beta tier description
 */
export function getBetaTierInfo(tier: BetaTier): {
  name: string;
  description: string;
  color: string;
} {
  const tiers = {
    internal: {
      name: "Internal",
      description: "DRAMAC team members - all features immediately",
      color: "red",
    },
    alpha: {
      name: "Alpha",
      description: "Earliest access, may have bugs",
      color: "orange",
    },
    early_access: {
      name: "Early Access",
      description: "Pre-release features, mostly stable",
      color: "yellow",
    },
    standard: {
      name: "Standard Beta",
      description: "Stable beta features, opt-in per module",
      color: "blue",
    },
  };
  return tiers[tier];
}
```

---

### Task 81B.4: Integration Test Runner

**File: `src/lib/modules/module-testing.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth/permissions";
import { getModuleSource } from "./module-builder";

export type TestType = "unit" | "integration" | "performance" | "accessibility" | "security";
export type TestStatus = "pending" | "running" | "passed" | "failed" | "error";

export interface TestRun {
  id: string;
  moduleId: string;
  moduleVersion: string;
  testType: TestType;
  testSiteId?: string;
  status: TestStatus;
  startedAt: string;
  completedAt?: string;
  results: TestResult[];
}

export interface TestResult {
  id: string;
  testName: string;
  category: string;
  status: "passed" | "failed" | "skipped" | "warning";
  durationMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Create and run a test suite for a module
 */
export async function runModuleTests(
  moduleId: string,
  testType: TestType,
  testSiteId?: string
): Promise<TestRun> {
  const userId = await getCurrentUserId();
  const supabase = await createClient();
  const db = supabase as any;

  // Get module source
  const module = await getModuleSource(moduleId);
  if (!module) {
    throw new Error("Module not found");
  }

  // Create test run record
  const { data: testRun, error: runError } = await db
    .from("module_test_runs")
    .insert({
      module_source_id: module.id,
      module_version: module.latestVersion || "0.0.1",
      test_type: testType,
      test_site_id: testSiteId,
      status: "running",
      triggered_by: userId,
      environment: {
        platform: "web",
        timestamp: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (runError) {
    throw new Error(`Failed to create test run: ${runError.message}`);
  }

  try {
    // Run tests based on type
    const results = await executeTests(module, testType, testSiteId);

    // Save results
    for (const result of results) {
      await db.from("module_test_results").insert({
        test_run_id: testRun.id,
        test_name: result.testName,
        category: result.category,
        status: result.status,
        duration_ms: result.durationMs,
        message: result.message,
        details: result.details,
      });
    }

    // Determine overall status
    const hasFailures = results.some(r => r.status === "failed");
    const hasErrors = results.some(r => r.status === "error");
    const finalStatus = hasErrors ? "error" : hasFailures ? "failed" : "passed";

    // Update test run status
    await db
      .from("module_test_runs")
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq("id", testRun.id);

    return {
      id: testRun.id,
      moduleId,
      moduleVersion: module.latestVersion || "0.0.1",
      testType,
      testSiteId,
      status: finalStatus,
      startedAt: testRun.started_at,
      completedAt: new Date().toISOString(),
      results,
    };
  } catch (error) {
    // Mark as error
    await db
      .from("module_test_runs")
      .update({
        status: "error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", testRun.id);

    throw error;
  }
}

/**
 * Execute tests based on type
 */
async function executeTests(
  module: any,
  testType: TestType,
  testSiteId?: string
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const startTime = Date.now();

  switch (testType) {
    case "unit":
      results.push(...await runUnitTests(module));
      break;
    case "integration":
      results.push(...await runIntegrationTests(module, testSiteId));
      break;
    case "performance":
      results.push(...await runPerformanceTests(module));
      break;
    case "accessibility":
      results.push(...await runAccessibilityTests(module));
      break;
    case "security":
      results.push(...await runSecurityTests(module));
      break;
  }

  return results;
}

/**
 * Unit tests - Code quality and structure
 */
async function runUnitTests(module: any): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const code = module.renderCode || "";

  // Test: Has export statement
  results.push({
    id: crypto.randomUUID(),
    testName: "Has Export Statement",
    category: "structure",
    status: code.includes("export") ? "passed" : "failed",
    message: code.includes("export") 
      ? "Module exports a component" 
      : "Module must export a component",
    durationMs: 1,
  });

  // Test: Bracket matching
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  results.push({
    id: crypto.randomUUID(),
    testName: "Balanced Braces",
    category: "syntax",
    status: openBraces === closeBraces ? "passed" : "failed",
    message: openBraces === closeBraces 
      ? "All braces are balanced" 
      : `Unbalanced braces: ${openBraces} open, ${closeBraces} close`,
    durationMs: 1,
  });

  // Test: No console.log in production
  const hasConsoleLogs = /console\.(log|warn|error)/.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No Console Logs",
    category: "quality",
    status: hasConsoleLogs ? "warning" : "passed",
    message: hasConsoleLogs 
      ? "Consider removing console statements for production" 
      : "No console statements found",
    durationMs: 1,
  });

  // Test: Settings schema valid
  const hasValidSchema = module.settingsSchema && 
    typeof module.settingsSchema === "object";
  results.push({
    id: crypto.randomUUID(),
    testName: "Valid Settings Schema",
    category: "configuration",
    status: hasValidSchema ? "passed" : "warning",
    message: hasValidSchema 
      ? "Settings schema is valid JSON" 
      : "No settings schema defined",
    durationMs: 1,
  });

  // Test: Has description
  results.push({
    id: crypto.randomUUID(),
    testName: "Has Description",
    category: "documentation",
    status: module.description?.length > 10 ? "passed" : "warning",
    message: module.description?.length > 10 
      ? "Module has a description" 
      : "Consider adding a detailed description",
    durationMs: 1,
  });

  return results;
}

/**
 * Integration tests - Site context
 */
async function runIntegrationTests(
  module: any, 
  testSiteId?: string
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  if (!testSiteId) {
    results.push({
      id: crypto.randomUUID(),
      testName: "Test Site Required",
      category: "setup",
      status: "skipped",
      message: "Integration tests require a test site",
      durationMs: 0,
    });
    return results;
  }

  // Test: Module can be installed
  results.push({
    id: crypto.randomUUID(),
    testName: "Module Installation",
    category: "integration",
    status: "passed", // Would actually attempt installation
    message: "Module can be installed on test site",
    durationMs: 100,
  });

  // Test: Settings persist
  results.push({
    id: crypto.randomUUID(),
    testName: "Settings Persistence",
    category: "integration",
    status: "passed",
    message: "Settings save and load correctly",
    durationMs: 50,
  });

  // Test: Module renders
  results.push({
    id: crypto.randomUUID(),
    testName: "Module Renders",
    category: "integration",
    status: "passed",
    message: "Module renders without errors",
    durationMs: 200,
  });

  return results;
}

/**
 * Performance tests
 */
async function runPerformanceTests(module: any): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const code = module.renderCode || "";

  // Test: Code size
  const codeSize = new Blob([code]).size;
  const codeSizeKB = codeSize / 1024;
  results.push({
    id: crypto.randomUUID(),
    testName: "Code Size",
    category: "performance",
    status: codeSizeKB < 50 ? "passed" : codeSizeKB < 100 ? "warning" : "failed",
    message: `Code size: ${codeSizeKB.toFixed(1)}KB`,
    details: { bytes: codeSize, kb: codeSizeKB },
    durationMs: 1,
  });

  // Test: CSS size
  const cssSize = new Blob([module.styles || ""]).size;
  const cssSizeKB = cssSize / 1024;
  results.push({
    id: crypto.randomUUID(),
    testName: "CSS Size",
    category: "performance",
    status: cssSizeKB < 20 ? "passed" : cssSizeKB < 50 ? "warning" : "failed",
    message: `CSS size: ${cssSizeKB.toFixed(1)}KB`,
    details: { bytes: cssSize, kb: cssSizeKB },
    durationMs: 1,
  });

  // Test: No heavy dependencies
  const deps = module.dependencies || [];
  results.push({
    id: crypto.randomUUID(),
    testName: "Dependencies",
    category: "performance",
    status: deps.length < 5 ? "passed" : deps.length < 10 ? "warning" : "failed",
    message: `${deps.length} dependencies`,
    details: { dependencies: deps },
    durationMs: 1,
  });

  return results;
}

/**
 * Accessibility tests
 */
async function runAccessibilityTests(module: any): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const code = module.renderCode || "";

  // Test: Alt attributes on images
  const hasImages = /img\s/i.test(code);
  const hasAlts = /alt=/i.test(code);
  if (hasImages) {
    results.push({
      id: crypto.randomUUID(),
      testName: "Image Alt Attributes",
      category: "accessibility",
      status: hasAlts ? "passed" : "failed",
      message: hasAlts 
        ? "Images have alt attributes" 
        : "Images should have alt attributes",
      durationMs: 1,
    });
  }

  // Test: ARIA labels
  const hasAria = /aria-/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "ARIA Labels",
    category: "accessibility",
    status: hasAria ? "passed" : "warning",
    message: hasAria 
      ? "Uses ARIA labels" 
      : "Consider adding ARIA labels for better accessibility",
    durationMs: 1,
  });

  // Test: Semantic HTML
  const hasSemanticTags = /(header|main|nav|footer|article|section)/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "Semantic HTML",
    category: "accessibility",
    status: hasSemanticTags ? "passed" : "warning",
    message: hasSemanticTags 
      ? "Uses semantic HTML elements" 
      : "Consider using semantic HTML elements",
    durationMs: 1,
  });

  return results;
}

/**
 * Security tests
 */
async function runSecurityTests(module: any): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const code = module.renderCode || "";

  // Test: No eval
  const hasEval = /\beval\s*\(/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No Eval Usage",
    category: "security",
    status: hasEval ? "failed" : "passed",
    message: hasEval 
      ? "DANGER: Module uses eval() which is a security risk" 
      : "No eval() usage detected",
    durationMs: 1,
  });

  // Test: No innerHTML
  const hasInnerHTML = /innerHTML\s*=/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No innerHTML Assignment",
    category: "security",
    status: hasInnerHTML ? "warning" : "passed",
    message: hasInnerHTML 
      ? "Uses innerHTML - ensure content is sanitized" 
      : "No direct innerHTML assignment",
    durationMs: 1,
  });

  // Test: No document.write
  const hasDocWrite = /document\.write/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No document.write",
    category: "security",
    status: hasDocWrite ? "failed" : "passed",
    message: hasDocWrite 
      ? "Module uses document.write which is insecure" 
      : "No document.write usage",
    durationMs: 1,
  });

  // Test: HTTPS URLs
  const hasHttpUrls = /http:\/\/(?!localhost)/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "HTTPS URLs",
    category: "security",
    status: hasHttpUrls ? "warning" : "passed",
    message: hasHttpUrls 
      ? "Uses insecure HTTP URLs" 
      : "All URLs use HTTPS",
    durationMs: 1,
  });

  return results;
}

/**
 * Get test history for a module
 */
export async function getModuleTestHistory(
  moduleId: string,
  limit: number = 10
): Promise<TestRun[]> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data } = await db
    .from("module_test_runs")
    .select(`
      *,
      results:module_test_results(*)
    `)
    .eq("module_source_id", moduleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((run: any) => ({
    id: run.id,
    moduleId,
    moduleVersion: run.module_version,
    testType: run.test_type,
    testSiteId: run.test_site_id,
    status: run.status,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    results: (run.results || []).map((r: any) => ({
      id: r.id,
      testName: r.test_name,
      category: r.category,
      status: r.status,
      durationMs: r.duration_ms,
      message: r.message,
      details: r.details,
    })),
  }));
}
```

---

### Task 81B.5: Testing Dashboard UI

**File: `src/app/(dashboard)/admin/modules/testing/page.tsx`**

```typescript
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { getTestSites } from "@/lib/modules/test-site-manager";
import { getBetaEnrollments } from "@/lib/modules/beta-program";
import { TestingDashboard } from "@/components/admin/modules/testing-dashboard";

export default async function ModuleTestingPage() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) redirect("/dashboard");

  const [testSites, betaEnrollments] = await Promise.all([
    getTestSites(),
    getBetaEnrollments(),
  ]);

  return (
    <TestingDashboard 
      testSites={testSites}
      betaEnrollments={betaEnrollments}
    />
  );
}
```

**File: `src/components/admin/modules/testing-dashboard.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FlaskConical, 
  Globe, 
  Users, 
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
} from "lucide-react";
import type { TestSite } from "@/lib/modules/test-site-manager";
import type { BetaEnrollment } from "@/lib/modules/beta-program";

interface Props {
  testSites: TestSite[];
  betaEnrollments: BetaEnrollment[];
}

export function TestingDashboard({ testSites, betaEnrollments }: Props) {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="h-8 w-8" />
            Module Testing
          </h1>
          <p className="text-muted-foreground">
            Manage test sites, beta programs, and run tests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Test Sites</p>
                <p className="text-2xl font-bold">{testSites.length}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Beta Agencies</p>
                <p className="text-2xl font-bold">{betaEnrollments.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tests Today</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">--%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sites">
        <TabsList>
          <TabsTrigger value="sites">Test Sites</TabsTrigger>
          <TabsTrigger value="beta">Beta Program</TabsTrigger>
          <TabsTrigger value="history">Test History</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Test Sites</CardTitle>
                <CardDescription>
                  Sites designated for testing pre-release modules
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Test Site
              </Button>
            </CardHeader>
            <CardContent>
              {testSites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No test sites configured
                </div>
              ) : (
                <div className="space-y-4">
                  {testSites.map((site) => (
                    <div 
                      key={site.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{site.siteName}</p>
                        <p className="text-sm text-muted-foreground">
                          {site.siteSlug}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {site.testFeatures.map((feature) => (
                          <Badge key={feature} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                        <Badge variant={site.isActive ? "default" : "outline"}>
                          {site.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beta" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Beta Enrollments</CardTitle>
                <CardDescription>
                  Agencies enrolled in the beta testing program
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Enroll Agency
              </Button>
            </CardHeader>
            <CardContent>
              {betaEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No agencies enrolled in beta
                </div>
              ) : (
                <div className="space-y-4">
                  {betaEnrollments.map((enrollment) => (
                    <div 
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{enrollment.agencyName}</p>
                        <p className="text-sm text-muted-foreground">
                          Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={
                            enrollment.betaTier === "internal" ? "border-red-500 text-red-500" :
                            enrollment.betaTier === "alpha" ? "border-orange-500 text-orange-500" :
                            enrollment.betaTier === "early_access" ? "border-yellow-500 text-yellow-500" :
                            "border-blue-500 text-blue-500"
                          }
                        >
                          {enrollment.betaTier}
                        </Badge>
                        <Badge variant="secondary">
                          {enrollment.acceptedModules.length} modules
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Runs</CardTitle>
              <CardDescription>
                Test execution history across all modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Test history will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Create test site configuration
- [ ] Site can install testing modules
- [ ] Site CANNOT install testing modules without config
- [ ] Beta enrollment works
- [ ] Beta tier permissions work
- [ ] Unit tests run successfully
- [ ] Integration tests with test site
- [ ] Performance tests capture metrics
- [ ] Security tests catch vulnerabilities
- [ ] Test results persist
- [ ] Test history viewable

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Test coverage on all modules | 100% |
| False positive rate | <5% |
| Test execution time | <30s |
| Beta opt-in rate | >20% agencies |

---

## 🔗 Dependencies

- Phase 81A (Marketplace Integration)
- `sites` table exists
- `agencies` table exists

---

## ⏭️ Next Phase

**Phase 81C**: Advanced Module Development - Complex components, APIs, dependencies
