# Phase 81C: Advanced Module Development

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟠 HIGH
>
> **Estimated Time**: 12-15 hours
>
> **Status**: 📋 PLANNED
>
> **Prerequisites**: Phase 81B Complete

---

## ⚠️ CRITICAL: Phase 81B Implementation Notes

**BEFORE IMPLEMENTING THIS PHASE, READ THIS:**

### Database Schema Changes from 81B:

The `module_source` table now has these additional columns:
```sql
testing_tier TEXT CHECK (testing_tier IN ('internal', 'beta', 'public')) DEFAULT 'internal'
install_level TEXT DEFAULT 'site' CHECK (install_level IN ('agency', 'client', 'site'))
wholesale_price_monthly INTEGER DEFAULT 0
suggested_retail_monthly INTEGER DEFAULT 0
```

### FK Constraints REMOVED in 81B:
- `agency_module_subscriptions.module_id` → NO FK to `modules_v2`
- `site_module_installations.module_id` → NO FK to `modules_v2`

**Reason:** Subscriptions and installations can reference EITHER:
- `modules_v2.id` (published modules)
- `module_source.id` (testing modules)

### Module ID Confusion - IMPORTANT:
| Field | Type | Use For |
|-------|------|---------|
| `module_source.id` | UUID | Database FKs, subscriptions |
| `module_source.module_id` | TEXT | Legacy identifier, DON'T USE for FK |
| `module_source.slug` | TEXT | URLs, display |

### Code Pattern - Always Query BOTH Tables:
```typescript
// When looking up a module by ID:
const { data: v2Module } = await supabase.from("modules_v2").select("*").eq("id", id).single();
if (v2Module) return v2Module;

const { data: sourceModule } = await supabase.from("module_source").select("*").eq("id", id).single();
return sourceModule;
```

---

## 🎯 Objective

**Enable developers to create complex, production-grade modules with:**
- React components with full lifecycle
- API routes and server-side logic
- External dependencies and npm packages
- Inter-module communication
- Database access (scoped)
- File uploads and storage
- Real-time updates (WebSocket)
- Custom hooks and context

This phase transforms Module Studio from "simple widgets" to **"full applications"**.

---

## 🔍 Current Limitations

| Capability | Current | Target |
|-----------|---------|--------|
| React Components | Basic JSX only | Full React 19 |
| State Management | None | useState, useEffect, Context |
| API Calls | None | Module-scoped API routes |
| Dependencies | None | NPM packages via CDN |
| Database | None | Scoped Supabase access |
| File Storage | None | Module-specific bucket |
| Real-time | None | WebSocket support |
| Types | Basic | Full TypeScript |

---

## 🏗️ Architecture Overview

### Module Package Structure

```
module-package/
├── manifest.json           # Module manifest
├── src/
│   ├── index.tsx          # Main entry point
│   ├── components/        # React components
│   │   ├── Widget.tsx
│   │   └── Settings.tsx
│   ├── hooks/             # Custom hooks
│   │   └── useModuleData.ts
│   ├── api/               # API route handlers
│   │   ├── submit.ts
│   │   └── webhook.ts
│   └── lib/               # Utilities
│       └── utils.ts
├── styles/
│   └── main.css           # Module styles
└── assets/                # Static assets
    └── icon.svg
```

### Runtime Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Site/Portal                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │   Module A       │  │   Module B       │  │   Module C     │ │
│  │   (Sandbox)      │  │   (Sandbox)      │  │   (Sandbox)    │ │
│  │                  │  │                  │  │                │ │
│  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌────────────┐ │ │
│  │ │ React App    │ │  │ │ React App    │ │  │ │ React App  │ │ │
│  │ │ - Components │ │  │ │ - Components │ │  │ │ - Components│ │ │
│  │ │ - Hooks      │ │  │ │ - Hooks      │ │  │ │ - Hooks    │ │ │
│  │ │ - Context    │ │  │ │ - Context    │ │  │ │ - Context  │ │ │
│  │ └──────────────┘ │  │ └──────────────┘ │  │ └────────────┘ │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                     │                     │          │
│           └──────────┬──────────┴─────────────────────┘          │
│                      │                                           │
│              ┌───────▼───────┐                                   │
│              │  Module Bridge │                                   │
│              │  - API Proxy   │                                   │
│              │  - Event Bus   │                                   │
│              │  - Storage     │                                   │
│              └───────┬───────┘                                   │
│                      │                                           │
└──────────────────────┼───────────────────────────────────────────┘
                       │
               ┌───────▼───────┐
               │   Platform    │
               │   Backend     │
               │   - Supabase  │
               │   - Storage   │
               │   - Functions │
               └───────────────┘
```

---

## 📁 Files to Create/Modify

```
src/lib/modules/
├── module-runtime-v2.ts         # NEW - Advanced runtime
├── module-bridge.ts             # NEW - Platform bridge
├── module-api-proxy.ts          # NEW - API route proxy
├── module-storage.ts            # NEW - Storage access
├── module-events.ts             # NEW - Event bus
├── module-bundler.ts            # NEW - Code bundling
├── module-dependencies.ts       # NEW - NPM CDN loader

src/app/api/modules/[moduleId]/
├── proxy/route.ts               # MODIFY - Enhanced proxy
├── storage/route.ts             # NEW - Storage API
├── db/route.ts                  # NEW - Database API
├── events/route.ts              # NEW - SSE events

src/components/admin/modules/
├── advanced-editor/
│   ├── multi-file-editor.tsx    # NEW - Multi-file support
│   ├── file-tree.tsx            # NEW - File navigation
│   ├── dependency-manager.tsx   # NEW - NPM packages
│   ├── api-route-builder.tsx    # NEW - API editor
│   └── manifest-editor.tsx      # NEW - Manifest builder

Database:
├── module_files                 # NEW - Multi-file storage
├── module_dependencies          # NEW - NPM dependencies
├── module_api_routes            # NEW - API route configs
├── module_storage_buckets       # NEW - Storage quotas
```

---

## ✅ Tasks

### Task 81C.1: Multi-File Module Storage

```sql
-- Migration: create_advanced_module_tables.sql

-- Module files (multi-file support)
CREATE TABLE IF NOT EXISTS module_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  -- e.g., "src/components/Widget.tsx"
  file_type TEXT NOT NULL,
  -- typescript, javascript, css, json, markdown, image
  content TEXT,
  -- For text files
  storage_url TEXT,
  -- For binary files
  size_bytes INTEGER DEFAULT 0,
  checksum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_source_id, file_path)
);

-- Module dependencies (NPM packages)
CREATE TABLE IF NOT EXISTS module_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  version TEXT NOT NULL,
  cdn_url TEXT,
  -- esm.sh or unpkg URL
  is_dev_dependency BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_source_id, package_name)
);

-- Module API routes
CREATE TABLE IF NOT EXISTS module_api_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  route_path TEXT NOT NULL,
  -- e.g., "/submit", "/webhook"
  methods TEXT[] NOT NULL DEFAULT ARRAY['GET'],
  handler_code TEXT NOT NULL,
  requires_auth BOOLEAN DEFAULT true,
  rate_limit_requests INTEGER DEFAULT 100,
  rate_limit_window_ms INTEGER DEFAULT 60000,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_source_id, route_path)
);

-- Module storage quotas
CREATE TABLE IF NOT EXISTS module_storage_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  max_size_bytes BIGINT DEFAULT 104857600,
  -- 100MB default
  used_size_bytes BIGINT DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, site_id)
);

-- Indexes
CREATE INDEX idx_module_files_module ON module_files(module_source_id);
CREATE INDEX idx_module_deps_module ON module_dependencies(module_source_id);
CREATE INDEX idx_module_routes_module ON module_api_routes(module_source_id);
CREATE INDEX idx_module_storage_module ON module_storage_buckets(module_id, site_id);

-- ============================================================================
-- 🔗 MODULE WEBHOOKS (External integrations)
-- ============================================================================

-- Allow modules to receive external webhooks
CREATE TABLE IF NOT EXISTS module_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Webhook identification
  webhook_name TEXT NOT NULL,             -- e.g., 'stripe_payment', 'zapier_trigger'
  endpoint_path TEXT NOT NULL,            -- e.g., '/webhook/stripe'
  secret TEXT NOT NULL,                   -- For signature verification
  
  -- Configuration
  allowed_sources TEXT[] DEFAULT '{}',    -- IP whitelist (optional)
  expected_headers JSONB DEFAULT '{}',    -- Headers to verify
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  
  -- Error tracking
  last_error TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(module_source_id, site_id, endpoint_path)
);

-- Webhook event log (for debugging)
CREATE TABLE IF NOT EXISTS module_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES module_webhooks(id) ON DELETE CASCADE,
  
  -- Request details
  request_method TEXT NOT NULL,
  request_headers JSONB,
  request_body TEXT,
  request_ip TEXT,
  
  -- Response details
  response_status INTEGER,
  response_body TEXT,
  
  -- Timing
  processing_time_ms INTEGER,
  
  -- Status
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 🔄 MODULE DEPENDENCY RESOLUTION
-- ============================================================================

-- Track module inter-dependencies
CREATE TABLE IF NOT EXISTS module_dependencies_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  depends_on_module_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  
  dependency_type TEXT NOT NULL DEFAULT 'required', -- 'required', 'optional', 'peer'
  min_version TEXT,                                 -- Minimum required version
  max_version TEXT,                                 -- Maximum compatible version
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(module_source_id, depends_on_module_id),
  -- Prevent self-dependency
  CHECK (module_source_id != depends_on_module_id)
);

-- Indexes for webhooks and dependencies
CREATE INDEX idx_module_webhooks_site ON module_webhooks(site_id, is_active) WHERE is_active = true;
CREATE INDEX idx_webhook_logs_webhook ON module_webhook_logs(webhook_id, created_at DESC);
CREATE INDEX idx_module_deps_graph_module ON module_dependencies_graph(module_source_id);
CREATE INDEX idx_module_deps_graph_depends ON module_dependencies_graph(depends_on_module_id);
```

---

### Task 81C.2: Module Bridge (Platform Communication)

**File: `src/lib/modules/module-bridge.ts`**

```typescript
/**
 * Module Bridge
 * 
 * Provides a secure communication layer between modules and the platform.
 * Handles API calls, storage, database access, and inter-module events.
 */

import { createClient } from "@/lib/supabase/server";

export interface BridgeMessage {
  type: BridgeMessageType;
  moduleId: string;
  requestId: string;
  payload: unknown;
}

export type BridgeMessageType =
  // API
  | "API_REQUEST"
  | "API_RESPONSE"
  // Storage
  | "STORAGE_UPLOAD"
  | "STORAGE_DOWNLOAD"
  | "STORAGE_DELETE"
  | "STORAGE_LIST"
  | "STORAGE_RESPONSE"
  // Database
  | "DB_QUERY"
  | "DB_INSERT"
  | "DB_UPDATE"
  | "DB_DELETE"
  | "DB_RESPONSE"
  // Events
  | "EVENT_EMIT"
  | "EVENT_SUBSCRIBE"
  | "EVENT_UNSUBSCRIBE"
  | "EVENT_RECEIVED"
  // Settings
  | "SETTINGS_GET"
  | "SETTINGS_SET"
  | "SETTINGS_RESPONSE"
  // Navigation
  | "NAVIGATE"
  | "OPEN_MODAL"
  | "CLOSE_MODAL"
  // Platform
  | "GET_CONTEXT"
  | "CONTEXT_RESPONSE";

export interface ModuleContext {
  moduleId: string;
  siteId?: string;
  clientId?: string;
  agencyId?: string;
  userId?: string;
  settings: Record<string, unknown>;
  permissions: string[];
  environment: "development" | "staging" | "production";
}

/**
 * Create a module bridge instance for server-side handling
 */
export function createModuleBridge(context: ModuleContext) {
  return {
    context,
    
    /**
     * Handle incoming bridge message
     */
    async handleMessage(message: BridgeMessage): Promise<BridgeMessage> {
      const { type, payload, requestId, moduleId } = message;

      // Validate module has permission
      if (moduleId !== context.moduleId) {
        return errorResponse(requestId, moduleId, "Module mismatch");
      }

      switch (type) {
        case "API_REQUEST":
          return await handleApiRequest(payload, context, requestId, moduleId);
        
        case "STORAGE_UPLOAD":
        case "STORAGE_DOWNLOAD":
        case "STORAGE_DELETE":
        case "STORAGE_LIST":
          return await handleStorageRequest(type, payload, context, requestId, moduleId);
        
        case "DB_QUERY":
        case "DB_INSERT":
        case "DB_UPDATE":
        case "DB_DELETE":
          return await handleDatabaseRequest(type, payload, context, requestId, moduleId);
        
        case "SETTINGS_GET":
        case "SETTINGS_SET":
          return await handleSettingsRequest(type, payload, context, requestId, moduleId);
        
        case "GET_CONTEXT":
          return {
            type: "CONTEXT_RESPONSE",
            moduleId,
            requestId,
            payload: {
              success: true,
              data: {
                siteId: context.siteId,
                clientId: context.clientId,
                agencyId: context.agencyId,
                environment: context.environment,
              },
            },
          };
        
        default:
          return errorResponse(requestId, moduleId, `Unknown message type: ${type}`);
      }
    },
  };
}

/**
 * Handle API requests from module
 */
async function handleApiRequest(
  payload: any,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  const { endpoint, method, data, headers } = payload;

  // Check permission
  if (!context.permissions.includes("api:call")) {
    return errorResponse(requestId, moduleId, "Permission denied: api:call");
  }

  try {
    // Route to module's API handler
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/modules/${moduleId}${endpoint}`,
      {
        method: method || "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Module-Context": JSON.stringify({
            siteId: context.siteId,
            clientId: context.clientId,
            agencyId: context.agencyId,
          }),
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      }
    );

    const result = await response.json();

    return {
      type: "API_RESPONSE",
      moduleId,
      requestId,
      payload: {
        success: response.ok,
        status: response.status,
        data: result,
      },
    };
  } catch (error) {
    return errorResponse(requestId, moduleId, error instanceof Error ? error.message : "API call failed");
  }
}

/**
 * Handle storage requests from module
 */
async function handleStorageRequest(
  type: BridgeMessageType,
  payload: any,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  // Check permission
  const requiredPermission = type === "STORAGE_LIST" || type === "STORAGE_DOWNLOAD" 
    ? "storage:read" 
    : "storage:write";
  
  if (!context.permissions.includes(requiredPermission)) {
    return errorResponse(requestId, moduleId, `Permission denied: ${requiredPermission}`);
  }

  const supabase = await createClient();
  const bucketName = `module-${moduleId}-${context.siteId}`;

  try {
    switch (type) {
      case "STORAGE_LIST": {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list(payload.path || "");
        
        if (error) throw error;
        
        return {
          type: "STORAGE_RESPONSE",
          moduleId,
          requestId,
          payload: { success: true, data },
        };
      }
      
      case "STORAGE_UPLOAD": {
        const { path, file, contentType } = payload;
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(path, file, { contentType });
        
        if (error) throw error;
        
        return {
          type: "STORAGE_RESPONSE",
          moduleId,
          requestId,
          payload: { success: true, data },
        };
      }
      
      case "STORAGE_DOWNLOAD": {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(payload.path);
        
        if (error) throw error;
        
        return {
          type: "STORAGE_RESPONSE",
          moduleId,
          requestId,
          payload: { success: true, data },
        };
      }
      
      case "STORAGE_DELETE": {
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([payload.path]);
        
        if (error) throw error;
        
        return {
          type: "STORAGE_RESPONSE",
          moduleId,
          requestId,
          payload: { success: true },
        };
      }
      
      default:
        return errorResponse(requestId, moduleId, "Unknown storage operation");
    }
  } catch (error) {
    return errorResponse(requestId, moduleId, error instanceof Error ? error.message : "Storage operation failed");
  }
}

/**
 * Handle database requests from module
 */
async function handleDatabaseRequest(
  type: BridgeMessageType,
  payload: any,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  // Check permission
  const requiredPermission = type === "DB_QUERY" ? "db:read" : "db:write";
  
  if (!context.permissions.includes(requiredPermission)) {
    return errorResponse(requestId, moduleId, `Permission denied: ${requiredPermission}`);
  }

  const supabase = await createClient();
  const db = supabase as any;

  // Modules can only access their own data table
  const tableName = `module_data_${moduleId.replace(/-/g, "_")}`;

  try {
    switch (type) {
      case "DB_QUERY": {
        const { filters, select, orderBy, limit } = payload;
        
        let query = db.from(tableName).select(select || "*");
        
        // Apply filters (scoped to site)
        query = query.eq("site_id", context.siteId);
        
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
        }
        
        if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending });
        if (limit) query = query.limit(limit);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return {
          type: "DB_RESPONSE",
          moduleId,
          requestId,
          payload: { success: true, data },
        };
      }
      
      case "DB_INSERT": {
        const { data: insertData } = payload;
        
        // Auto-inject site_id
        const record = {
          ...insertData,
          site_id: context.siteId,
          module_id: moduleId,
          created_at: new Date().toISOString(),
        };
        
        const { data, error } = await db.from(tableName).insert(record).select();
        if (error) throw error;
        
        return {
          type: "DB_RESPONSE",
          moduleId,
          requestId,
          payload: { success: true, data },
        };
      }
      
      case "DB_UPDATE": {
        const { id, data: updateData } = payload;
        
        const { data, error } = await db
          .from(tableName)
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("site_id", context.siteId) // Scope to site
          .select();
        
        if (error) throw error;
        
        return {
          type: "DB_RESPONSE",
          moduleId,
          requestId,
          payload: { success: true, data },
        };
      }
      
      case "DB_DELETE": {
        const { id } = payload;
        
        const { error } = await db
          .from(tableName)
          .delete()
          .eq("id", id)
          .eq("site_id", context.siteId);
        
        if (error) throw error;
        
        return {
          type: "DB_RESPONSE",
          moduleId,
          requestId,
          payload: { success: true },
        };
      }
      
      default:
        return errorResponse(requestId, moduleId, "Unknown database operation");
    }
  } catch (error) {
    return errorResponse(requestId, moduleId, error instanceof Error ? error.message : "Database operation failed");
  }
}

/**
 * Handle settings requests from module
 */
async function handleSettingsRequest(
  type: BridgeMessageType,
  payload: any,
  context: ModuleContext,
  requestId: string,
  moduleId: string
): Promise<BridgeMessage> {
  const supabase = await createClient();
  const db = supabase as any;

  try {
    if (type === "SETTINGS_GET") {
      // Return current settings
      return {
        type: "SETTINGS_RESPONSE",
        moduleId,
        requestId,
        payload: {
          success: true,
          data: context.settings,
        },
      };
    }
    
    if (type === "SETTINGS_SET") {
      // Check write permission
      if (!context.permissions.includes("settings:write")) {
        return errorResponse(requestId, moduleId, "Permission denied: settings:write");
      }
      
      const { settings } = payload;
      
      // Update site_modules settings
      const { error } = await db
        .from("site_modules")
        .update({
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq("site_id", context.siteId)
        .eq("module_id", moduleId);
      
      if (error) throw error;
      
      return {
        type: "SETTINGS_RESPONSE",
        moduleId,
        requestId,
        payload: { success: true },
      };
    }
    
    return errorResponse(requestId, moduleId, "Unknown settings operation");
  } catch (error) {
    return errorResponse(requestId, moduleId, error instanceof Error ? error.message : "Settings operation failed");
  }
}

function errorResponse(requestId: string, moduleId: string, message: string): BridgeMessage {
  return {
    type: "API_RESPONSE",
    moduleId,
    requestId,
    payload: {
      success: false,
      error: message,
    },
  };
}
```

---

### Task 81C.3: Dependency Manager (NPM via CDN)

**File: `src/lib/modules/module-dependencies.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

// Popular CDNs for ES modules
const CDN_PROVIDERS = {
  esm: "https://esm.sh",
  unpkg: "https://unpkg.com",
  skypack: "https://cdn.skypack.dev",
};

// Allowed packages (whitelist for security)
const ALLOWED_PACKAGES = new Set([
  // UI Libraries
  "react", "react-dom", "lucide-react", "@radix-ui/*",
  "framer-motion", "tailwind-merge", "clsx", "class-variance-authority",
  
  // Data
  "axios", "swr", "react-query", "@tanstack/react-query",
  "date-fns", "dayjs", "lodash", "lodash-es",
  
  // Forms
  "react-hook-form", "zod", "@hookform/resolvers", "yup",
  
  // Charts
  "recharts", "chart.js", "react-chartjs-2", "victory",
  
  // Maps
  "leaflet", "react-leaflet", "mapbox-gl",
  
  // Utilities
  "uuid", "nanoid", "immer", "zustand", "jotai",
  
  // Rich Text
  "@tiptap/*", "slate", "slate-react", "quill", "react-quill",
  
  // Media
  "react-player", "react-dropzone", "react-image-crop",
]);

export interface ModuleDependency {
  id: string;
  packageName: string;
  version: string;
  cdnUrl: string;
  isDevDependency: boolean;
}

/**
 * Add a dependency to a module
 */
export async function addDependency(
  moduleSourceId: string,
  packageName: string,
  version: string = "latest"
): Promise<{ success: boolean; dependency?: ModuleDependency; error?: string }> {
  // Check if package is allowed
  if (!isPackageAllowed(packageName)) {
    return { 
      success: false, 
      error: `Package "${packageName}" is not in the allowed list. Contact support to request adding it.` 
    };
  }

  const supabase = await createClient();
  const db = supabase as any;

  // Resolve version and get CDN URL
  const cdnUrl = buildCdnUrl(packageName, version);

  // Verify package exists by fetching
  try {
    const response = await fetch(cdnUrl, { method: "HEAD" });
    if (!response.ok) {
      return { success: false, error: `Package not found: ${packageName}@${version}` };
    }
  } catch {
    return { success: false, error: `Failed to verify package: ${packageName}` };
  }

  const { data, error } = await db
    .from("module_dependencies")
    .upsert({
      module_source_id: moduleSourceId,
      package_name: packageName,
      version,
      cdn_url: cdnUrl,
    }, { onConflict: "module_source_id,package_name" })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    dependency: {
      id: data.id,
      packageName: data.package_name,
      version: data.version,
      cdnUrl: data.cdn_url,
      isDevDependency: data.is_dev_dependency,
    },
  };
}

/**
 * Remove a dependency
 */
export async function removeDependency(
  moduleSourceId: string,
  packageName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const db = supabase as any;

  const { error } = await db
    .from("module_dependencies")
    .delete()
    .eq("module_source_id", moduleSourceId)
    .eq("package_name", packageName);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all dependencies for a module
 */
export async function getDependencies(moduleSourceId: string): Promise<ModuleDependency[]> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data } = await db
    .from("module_dependencies")
    .select("*")
    .eq("module_source_id", moduleSourceId)
    .order("package_name");

  return (data || []).map((d: any) => ({
    id: d.id,
    packageName: d.package_name,
    version: d.version,
    cdnUrl: d.cdn_url,
    isDevDependency: d.is_dev_dependency,
  }));
}

/**
 * Generate import map for a module's dependencies
 */
export async function generateImportMap(
  moduleSourceId: string
): Promise<Record<string, string>> {
  const deps = await getDependencies(moduleSourceId);
  
  const importMap: Record<string, string> = {
    // Always include React
    "react": "https://esm.sh/react@18",
    "react-dom": "https://esm.sh/react-dom@18",
    "react-dom/client": "https://esm.sh/react-dom@18/client",
  };

  for (const dep of deps) {
    importMap[dep.packageName] = dep.cdnUrl;
  }

  return importMap;
}

/**
 * Search for packages (uses npm registry API)
 */
export async function searchPackages(query: string): Promise<{
  name: string;
  version: string;
  description: string;
  allowed: boolean;
}[]> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=20`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.objects || []).map((obj: any) => ({
      name: obj.package.name,
      version: obj.package.version,
      description: obj.package.description || "",
      allowed: isPackageAllowed(obj.package.name),
    }));
  } catch {
    return [];
  }
}

/**
 * Check if a package is in the allowed list
 */
function isPackageAllowed(packageName: string): boolean {
  // Direct match
  if (ALLOWED_PACKAGES.has(packageName)) return true;
  
  // Wildcard match (e.g., "@radix-ui/*")
  for (const allowed of ALLOWED_PACKAGES) {
    if (allowed.endsWith("/*")) {
      const prefix = allowed.slice(0, -2);
      if (packageName.startsWith(prefix)) return true;
    }
  }
  
  return false;
}

/**
 * Build CDN URL for a package
 */
function buildCdnUrl(packageName: string, version: string): string {
  const versionPart = version === "latest" ? "" : `@${version}`;
  return `${CDN_PROVIDERS.esm}/${packageName}${versionPart}?bundle`;
}

/**
 * Request to add a new package to allowed list
 */
export async function requestPackage(
  packageName: string,
  reason: string
): Promise<{ success: boolean }> {
  // Would create a support ticket or notification
  console.log(`Package request: ${packageName} - ${reason}`);
  return { success: true };
}
```

---

### Task 81C.3.5: Module Dependency Resolution Service

**File: `src/lib/modules/module-dependency-resolver.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export interface DependencyNode {
  moduleId: string;
  moduleName: string;
  version: string;
  status: 'installed' | 'available' | 'missing' | 'version_mismatch';
}

export interface DependencyResolutionResult {
  success: boolean;
  canInstall: boolean;
  required: DependencyNode[];
  optional: DependencyNode[];
  conflicts: Array<{
    moduleId: string;
    reason: string;
    resolution?: string;
  }>;
  installOrder: string[]; // Module IDs in correct install order
}

/**
 * Resolve all dependencies for a module before installation
 * Returns install order and identifies any conflicts
 */
export async function resolveDependencies(
  moduleId: string,
  siteId: string
): Promise<DependencyResolutionResult> {
  const supabase = await createClient();
  const db = supabase as any;

  const result: DependencyResolutionResult = {
    success: true,
    canInstall: true,
    required: [],
    optional: [],
    conflicts: [],
    installOrder: [],
  };

  // Get the module's dependencies
  const { data: deps, error } = await db
    .from("module_dependencies_graph")
    .select(`
      *,
      depends_on:depends_on_module_id (
        id, module_id, name, published_version, status
      )
    `)
    .eq("module_source_id", moduleId);

  if (error) {
    return {
      ...result,
      success: false,
      canInstall: false,
      conflicts: [{ moduleId, reason: "Failed to load dependencies" }],
    };
  }

  // Check installed modules on the site
  const { data: installedModules } = await db
    .from("site_module_installations")
    .select("module_id, version")
    .eq("site_id", siteId)
    .eq("status", "active");

  const installedMap = new Map(
    (installedModules || []).map((m: any) => [m.module_id, m.version])
  );

  // Process each dependency
  for (const dep of deps || []) {
    const depModule = dep.depends_on;
    const isInstalled = installedMap.has(depModule.module_id);
    const installedVersion = installedMap.get(depModule.module_id);

    const node: DependencyNode = {
      moduleId: depModule.module_id,
      moduleName: depModule.name,
      version: depModule.published_version,
      status: 'available',
    };

    // Check if dependency is published
    if (depModule.status !== 'published') {
      node.status = 'missing';
      result.conflicts.push({
        moduleId: depModule.module_id,
        reason: `Required module "${depModule.name}" is not published`,
      });
      result.canInstall = dep.dependency_type !== 'required';
    }
    // Check version compatibility
    else if (isInstalled) {
      if (dep.min_version && compareVersions(installedVersion, dep.min_version) < 0) {
        node.status = 'version_mismatch';
        result.conflicts.push({
          moduleId: depModule.module_id,
          reason: `Installed version ${installedVersion} is below minimum ${dep.min_version}`,
          resolution: `Update to version ${dep.min_version} or higher`,
        });
        result.canInstall = dep.dependency_type !== 'required';
      } else {
        node.status = 'installed';
      }
    }

    if (dep.dependency_type === 'required') {
      result.required.push(node);
    } else {
      result.optional.push(node);
    }
  }

  // Build installation order (topological sort)
  result.installOrder = await buildInstallOrder(moduleId, deps || []);

  return result;
}

/**
 * Build correct installation order using topological sort
 */
async function buildInstallOrder(
  targetModuleId: string,
  deps: any[]
): Promise<string[]> {
  const order: string[] = [];
  const visited = new Set<string>();

  function visit(moduleId: string) {
    if (visited.has(moduleId)) return;
    visited.add(moduleId);

    // Find deps for this module
    const moduleDeps = deps.filter(d => 
      d.module_source_id === moduleId && d.dependency_type === 'required'
    );

    for (const dep of moduleDeps) {
      visit(dep.depends_on_module_id);
    }

    order.push(moduleId);
  }

  // Start with the target module
  visit(targetModuleId);

  return order;
}

/**
 * Simple semver comparison
 */
function compareVersions(a: string, b: string): number {
  const aParts = (a || '0.0.0').split('.').map(Number);
  const bParts = (b || '0.0.0').split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (aParts[i] > bParts[i]) return 1;
    if (aParts[i] < bParts[i]) return -1;
  }
  return 0;
}

/**
 * Check for circular dependencies
 */
export async function checkCircularDependencies(
  moduleId: string
): Promise<{ hasCircular: boolean; cycle?: string[] }> {
  const supabase = await createClient();
  const db = supabase as any;

  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  async function dfs(currentId: string): Promise<boolean> {
    if (stack.has(currentId)) {
      // Found a cycle
      path.push(currentId);
      return true;
    }
    if (visited.has(currentId)) return false;

    visited.add(currentId);
    stack.add(currentId);
    path.push(currentId);

    const { data: deps } = await db
      .from("module_dependencies_graph")
      .select("depends_on_module_id")
      .eq("module_source_id", currentId);

    for (const dep of deps || []) {
      if (await dfs(dep.depends_on_module_id)) {
        return true;
      }
    }

    stack.delete(currentId);
    path.pop();
    return false;
  }

  const hasCircular = await dfs(moduleId);
  return { hasCircular, cycle: hasCircular ? path : undefined };
}
```

---

### Task 81C.4: Multi-File Editor Component

**File: `src/components/admin/modules/advanced-editor/multi-file-editor.tsx`**

```typescript
"use client";

import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { 
  File, 
  Folder, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  FileCode,
  FileJson,
  FileType,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

interface ModuleFile {
  id: string;
  path: string;
  type: "typescript" | "javascript" | "css" | "json" | "markdown";
  content: string;
}

interface MultiFileEditorProps {
  files: ModuleFile[];
  onFileChange: (fileId: string, content: string) => void;
  onFileCreate: (path: string, type: ModuleFile["type"]) => void;
  onFileDelete: (fileId: string) => void;
  onFileRename: (fileId: string, newPath: string) => void;
}

export function MultiFileEditor({
  files,
  onFileChange,
  onFileCreate,
  onFileDelete,
  onFileRename,
}: MultiFileEditorProps) {
  const [activeFileId, setActiveFileId] = useState<string | null>(
    files[0]?.id || null
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src"])
  );
  const [newFileName, setNewFileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [creatingInPath, setCreatingInPath] = useState("");

  const activeFile = files.find((f) => f.id === activeFileId);

  // Build folder tree from flat file list
  const buildTree = useCallback(() => {
    const tree: Record<string, any> = {};

    for (const file of files) {
      const parts = file.path.split("/");
      let current = tree;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = { __isFolder: true, __path: parts.slice(0, i + 1).join("/") };
        }
        current = current[part];
      }

      const fileName = parts[parts.length - 1];
      current[fileName] = { __isFile: true, __file: file };
    }

    return tree;
  }, [files]);

  const tree = buildTree();

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileIcon = (type: ModuleFile["type"]) => {
    switch (type) {
      case "typescript":
      case "javascript":
        return <FileCode className="h-4 w-4 text-blue-500" />;
      case "json":
        return <FileJson className="h-4 w-4 text-yellow-500" />;
      case "css":
        return <FileType className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getLanguage = (type: ModuleFile["type"]) => {
    switch (type) {
      case "typescript":
        return "typescript";
      case "javascript":
        return "javascript";
      case "json":
        return "json";
      case "css":
        return "css";
      case "markdown":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  const renderTree = (node: any, depth: number = 0) => {
    return Object.entries(node)
      .filter(([key]) => !key.startsWith("__"))
      .sort(([, a]: any, [, b]: any) => {
        // Folders first, then files
        if (a.__isFolder && !b.__isFolder) return -1;
        if (!a.__isFolder && b.__isFolder) return 1;
        return 0;
      })
      .map(([name, value]: [string, any]) => {
        if (value.__isFolder) {
          const isExpanded = expandedFolders.has(value.__path);
          return (
            <div key={value.__path}>
              <ContextMenu>
                <ContextMenuTrigger>
                  <div
                    className={cn(
                      "flex items-center gap-1 py-1 px-2 hover:bg-muted rounded cursor-pointer",
                      "select-none"
                    )}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => toggleFolder(value.__path)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Folder className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{name}</span>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => {
                      setCreatingInPath(value.__path);
                      setIsCreating(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New File
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
              {isExpanded && renderTree(value, depth + 1)}
            </div>
          );
        } else if (value.__isFile) {
          const file = value.__file as ModuleFile;
          return (
            <ContextMenu key={file.id}>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "flex items-center gap-2 py-1 px-2 hover:bg-muted rounded cursor-pointer",
                    "select-none",
                    activeFileId === file.id && "bg-muted"
                  )}
                  style={{ paddingLeft: `${depth * 12 + 24}px` }}
                  onClick={() => setActiveFileId(file.id)}
                >
                  {getFileIcon(file.type)}
                  <span className="text-sm">{name}</span>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => onFileDelete(file.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        }
        return null;
      });
  };

  const handleCreateFile = () => {
    if (!newFileName) return;
    
    const path = creatingInPath 
      ? `${creatingInPath}/${newFileName}` 
      : newFileName;
    
    // Determine type from extension
    let type: ModuleFile["type"] = "typescript";
    if (newFileName.endsWith(".css")) type = "css";
    else if (newFileName.endsWith(".json")) type = "json";
    else if (newFileName.endsWith(".js")) type = "javascript";
    else if (newFileName.endsWith(".md")) type = "markdown";
    
    onFileCreate(path, type);
    setNewFileName("");
    setIsCreating(false);
    setCreatingInPath("");
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* File Tree */}
      <div className="w-64 border-r bg-background overflow-auto">
        <div className="p-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium">Files</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {isCreating && (
          <div className="p-2 flex gap-2">
            <Input
              size={1}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.tsx"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewFileName("");
                }
              }}
              autoFocus
            />
          </div>
        )}
        
        <div className="p-2">
          {renderTree(tree)}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguage(activeFile.type)}
            value={activeFile.content}
            onChange={(value) => onFileChange(activeFile.id, value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              tabSize: 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a file to edit
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 81C.5: API Route Builder

**File: `src/components/admin/modules/advanced-editor/api-route-builder.tsx`**

```typescript
"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Plus, Trash2, Play, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ApiRoute {
  id: string;
  path: string;
  methods: ("GET" | "POST" | "PUT" | "DELETE")[];
  handlerCode: string;
  requiresAuth: boolean;
  rateLimitRequests: number;
  rateLimitWindowMs: number;
  isEnabled: boolean;
}

interface ApiRouteBuilderProps {
  moduleId: string;
  routes: ApiRoute[];
  onRouteChange: (routeId: string, route: Partial<ApiRoute>) => void;
  onRouteCreate: () => void;
  onRouteDelete: (routeId: string) => void;
  onRouteTest: (routeId: string) => void;
}

const defaultHandlerCode = `// API Route Handler
// Available: request, context, supabase

export default async function handler(request, context) {
  const { method } = request;
  const { siteId, clientId } = context;
  
  if (method === "GET") {
    // Handle GET request
    return Response.json({ message: "Hello from module API!" });
  }
  
  if (method === "POST") {
    const body = await request.json();
    // Handle POST request
    return Response.json({ received: body });
  }
  
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
`;

export function ApiRouteBuilder({
  moduleId,
  routes,
  onRouteChange,
  onRouteCreate,
  onRouteDelete,
  onRouteTest,
}: ApiRouteBuilderProps) {
  const [activeRouteId, setActiveRouteId] = useState<string | null>(
    routes[0]?.id || null
  );

  const activeRoute = routes.find((r) => r.id === activeRouteId);

  const toggleMethod = (routeId: string, method: ApiRoute["methods"][0]) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;

    const methods = route.methods.includes(method)
      ? route.methods.filter((m) => m !== method)
      : [...route.methods, method];

    if (methods.length === 0) return; // Must have at least one method

    onRouteChange(routeId, { methods });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">API Routes</h3>
          <p className="text-sm text-muted-foreground">
            Create server-side endpoints for your module
          </p>
        </div>
        <Button onClick={onRouteCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Route
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Route List */}
        <div className="space-y-2">
          {routes.map((route) => (
            <Card
              key={route.id}
              className={`cursor-pointer transition-colors ${
                activeRouteId === route.id ? "border-primary" : ""
              }`}
              onClick={() => setActiveRouteId(route.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm">{route.path || "/new"}</span>
                  {!route.isEnabled && (
                    <Badge variant="outline">Disabled</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {route.methods.map((method) => (
                    <Badge
                      key={method}
                      variant="secondary"
                      className="text-xs"
                    >
                      {method}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Route Editor */}
        <div className="col-span-3">
          {activeRoute ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Edit Route: {activeRoute.path || "/new"}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRouteTest(activeRoute.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRouteDelete(activeRoute.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Path */}
                <div className="space-y-2">
                  <Label>Route Path</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      /api/modules/{moduleId}
                    </span>
                    <Input
                      value={activeRoute.path}
                      onChange={(e) =>
                        onRouteChange(activeRoute.id, { path: e.target.value })
                      }
                      placeholder="/submit"
                      className="w-48"
                    />
                  </div>
                </div>

                {/* Methods */}
                <div className="space-y-2">
                  <Label>HTTP Methods</Label>
                  <div className="flex gap-2">
                    {(["GET", "POST", "PUT", "DELETE"] as const).map((method) => (
                      <Button
                        key={method}
                        size="sm"
                        variant={
                          activeRoute.methods.includes(method)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => toggleMethod(activeRoute.id, method)}
                      >
                        {method}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Requires Authentication</Label>
                    <Switch
                      checked={activeRoute.requiresAuth}
                      onCheckedChange={(checked) =>
                        onRouteChange(activeRoute.id, { requiresAuth: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Enabled</Label>
                    <Switch
                      checked={activeRoute.isEnabled}
                      onCheckedChange={(checked) =>
                        onRouteChange(activeRoute.id, { isEnabled: checked })
                      }
                    />
                  </div>
                </div>

                {/* Rate Limiting */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate Limit (requests)</Label>
                    <Input
                      type="number"
                      value={activeRoute.rateLimitRequests}
                      onChange={(e) =>
                        onRouteChange(activeRoute.id, {
                          rateLimitRequests: parseInt(e.target.value) || 100,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Window (ms)</Label>
                    <Input
                      type="number"
                      value={activeRoute.rateLimitWindowMs}
                      onChange={(e) =>
                        onRouteChange(activeRoute.id, {
                          rateLimitWindowMs: parseInt(e.target.value) || 60000,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Handler Code */}
                <div className="space-y-2">
                  <Label>Handler Code</Label>
                  <div className="h-[400px] border rounded-lg overflow-hidden">
                    <Editor
                      height="100%"
                      language="typescript"
                      value={activeRoute.handlerCode || defaultHandlerCode}
                      onChange={(value) =>
                        onRouteChange(activeRoute.id, {
                          handlerCode: value || "",
                        })
                      }
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        tabSize: 2,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[600px] text-muted-foreground">
                <div className="text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a route to edit or create a new one</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

- [ ] Multi-file modules save correctly
- [ ] File tree navigation works
- [ ] Dependencies install via CDN
- [ ] Import map generates correctly
- [ ] API routes execute
- [ ] Database access is scoped
- [ ] Storage works with quotas
- [ ] Settings persist
- [ ] Module bridge communication works
- [ ] Security: eval blocked, scope enforced

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Complex module creation | ≤30 min |
| API response time | <200ms |
| CDN dependency load | <1s |
| Code editor performance | 60 FPS |

---

## 🔗 Dependencies

- Phase 81A (Marketplace Integration)
- Phase 81B (Testing System)
- Monaco Editor
- Supabase Storage

---

## ⏭️ Next Phase

**Phase 81D**: Module Analytics & Monitoring - Real-time metrics, error tracking, performance monitoring
