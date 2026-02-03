# PHASE-STUDIO-14: Module Component Loader

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-14 |
| Title | Module Component Loader |
| Priority | High |
| Estimated Time | 10-12 hours |
| Dependencies | STUDIO-01, STUDIO-02, STUDIO-03, STUDIO-07 |
| Risk Level | Medium |

## Problem Statement

DRAMAC Studio currently only supports core components. When a site has modules installed (E-Commerce, CRM, Booking, etc.), those modules cannot provide their own Studio components. This means:

1. Module-specific UI blocks (Product Card, Event Calendar, Contact Form) aren't available in the editor
2. Users must manually code module integrations instead of drag-and-drop
3. The full power of the module marketplace isn't leveraged in the visual builder
4. AI page generation can't include module components

This phase implements dynamic module component discovery and loading, allowing any installed module to contribute components to the Studio editor.

## Goals

- [ ] Create module component discovery system that scans installed modules
- [ ] Implement dynamic import of module Studio exports
- [ ] Extend component registry to handle module components
- [ ] Update left panel to show module components with badges
- [ ] Implement real-time module change detection (install/uninstall)
- [ ] Ensure module components work with all Studio features (DnD, AI, responsive)
- [ ] Handle graceful degradation when modules are uninstalled

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STUDIO EDITOR                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐     ┌──────────────────────────────────────┐      │
│  │  Left Panel     │     │          Component Registry           │      │
│  │                 │     │  ┌────────────┬───────────────────┐   │      │
│  │  ▼ Layout       │◄────│  │ Core       │ Module Components │   │      │
│  │  ▼ Typography   │     │  │ Components │                   │   │      │
│  │  ▼ E-Commerce ◄─┼─────│  │            │ • ProductCard     │   │      │
│  │    Product Card │     │  │            │ • CartWidget      │   │      │
│  │    Cart Widget  │     │  │            │ • BookingForm     │   │      │
│  │                 │     │  └────────────┴───────────────────┘   │      │
│  └─────────────────┘     │                 ▲                     │      │
│                          │                 │                     │      │
│                          └─────────────────┼─────────────────────┘      │
│                                            │                            │
│  ┌─────────────────────────────────────────┼───────────────────────┐   │
│  │              Module Loader               │                       │   │
│  │  ┌───────────────────┐   ┌─────────────┴─────────────┐         │   │
│  │  │ getInstalledModules│   │ Dynamic Import Modules   │         │   │
│  │  │ (site_modules)    │   │ • /modules/ecommerce      │         │   │
│  │  │                   │   │ • /modules/booking        │         │   │
│  │  └───────────────────┘   │ • /modules/crm            │         │   │
│  │          │               └───────────────────────────┘         │   │
│  │          ▼                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │                    Supabase Database                       │ │   │
│  │  │                                                            │ │   │
│  │  │  site_modules: [{ site_id, module_id, status, ... }]      │ │   │
│  │  │                                                            │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Module Studio Export Interface

Each module can export Studio components via a standardized interface:

```typescript
// src/modules/[moduleId]/studio/index.ts
export const studioComponents: Record<string, ComponentDefinition> = {
  ProductCard: { ... },
  CartWidget: { ... },
};

export const studioFields: Record<string, CustomFieldEditor> = {
  'product-selector': ProductSelectorField,
};
```

### Loading Flow

1. Studio editor mounts for a site
2. Query `site_modules` for installed, active modules
3. For each module, attempt dynamic import of `studio/index.ts`
4. Extract `studioComponents` and `studioFields` exports
5. Register to component/field registries with module metadata
6. Update component library to show new components
7. Subscribe to real-time changes for module installations

## Implementation Tasks

### Task 1: Define Module Studio Types

**Description:** Create TypeScript interfaces for module Studio exports.

**Files:**
- CREATE: `src/types/studio-module.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio Module Types
 * 
 * Types for module Studio integration - components and custom fields.
 */

import type { ComponentType } from "react";
import type { ComponentDefinition, FieldDefinition, FieldRenderProps } from "./studio";

// =============================================================================
// MODULE STUDIO EXPORTS
// =============================================================================

/**
 * Custom field editor component props
 */
export interface CustomFieldEditorProps extends FieldRenderProps {
  /** Site ID for fetching module-specific data */
  siteId: string;
  /** Module ID this field belongs to */
  moduleId: string;
}

/**
 * Custom field editor component type
 */
export type CustomFieldEditor = ComponentType<CustomFieldEditorProps>;

/**
 * What a module exports for Studio integration
 */
export interface ModuleStudioExports {
  /** Component definitions for the editor */
  studioComponents?: Record<string, Omit<ComponentDefinition, "module">>;
  
  /** Custom field type editors */
  studioFields?: Record<string, CustomFieldEditor>;
  
  /** Module metadata (optional, can be inferred) */
  studioMetadata?: {
    name: string;
    icon?: string;
    category?: string;
  };
}

// =============================================================================
// INSTALLED MODULE INFO
// =============================================================================

/**
 * Installed module info from database
 */
export interface InstalledModuleInfo {
  /** Module ID (from modules_v2 or module_source) */
  id: string;
  
  /** Module display name */
  name: string;
  
  /** Module slug for imports */
  slug: string;
  
  /** Installation status */
  status: "active" | "inactive" | "suspended";
  
  /** Module version */
  version: string;
  
  /** Module category */
  category?: string;
  
  /** Module icon */
  icon?: string;
  
  /** Has Studio components */
  hasStudioComponents?: boolean;
}

// =============================================================================
// LOADER STATE
// =============================================================================

/**
 * Module loader state
 */
export interface ModuleLoaderState {
  /** Loading status */
  isLoading: boolean;
  
  /** Loaded module IDs */
  loadedModules: string[];
  
  /** Failed module IDs with errors */
  failedModules: Record<string, string>;
  
  /** Last load timestamp */
  lastLoadTime: number | null;
}

// =============================================================================
// MODULE COMPONENT METADATA
// =============================================================================

/**
 * Extended component info when from a module
 */
export interface ModuleComponentInfo {
  /** The component definition */
  definition: ComponentDefinition;
  
  /** Source module */
  moduleId: string;
  moduleName: string;
  moduleIcon?: string;
  
  /** Whether module is currently active */
  isActive: boolean;
}
```

**Acceptance Criteria:**
- [ ] Types compile without errors
- [ ] Types are exported from main types index
- [ ] Types match the module export interface described in master prompt

---

### Task 2: Create Module Discovery Service

**Description:** Create server-side functions to discover installed modules for a site.

**Files:**
- CREATE: `src/lib/studio/registry/module-discovery.ts`

**Code:**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import type { InstalledModuleInfo } from "@/types/studio-module";

/**
 * Get installed modules for a site
 * 
 * Queries site_modules table and joins with module info.
 */
export async function getInstalledModulesForSite(
  siteId: string
): Promise<InstalledModuleInfo[]> {
  const supabase = await createClient();
  
  // Query site_modules with module details
  const { data, error } = await supabase
    .from("site_modules")
    .select(`
      id,
      status,
      installed_at,
      settings,
      module:modules_v2 (
        id,
        name,
        slug,
        current_version,
        category,
        icon,
        has_studio_components
      )
    `)
    .eq("site_id", siteId)
    .in("status", ["active", "installed"]);

  if (error) {
    console.error("[ModuleDiscovery] Failed to fetch installed modules:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Transform to InstalledModuleInfo
  const modules: InstalledModuleInfo[] = [];

  for (const row of data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = row.module as any;
    
    if (!mod) continue;

    modules.push({
      id: mod.id,
      name: mod.name,
      slug: mod.slug,
      status: row.status as "active" | "inactive" | "suspended",
      version: mod.current_version || "1.0.0",
      category: mod.category,
      icon: mod.icon,
      hasStudioComponents: mod.has_studio_components ?? true, // Assume true if not specified
    });
  }

  return modules;
}

/**
 * Check if a specific module is installed on a site
 */
export async function isModuleInstalled(
  siteId: string,
  moduleId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("site_modules")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .in("status", ["active", "installed"]);

  if (error) {
    console.error("[ModuleDiscovery] Failed to check module installation:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Get module info by ID
 */
export async function getModuleInfo(
  moduleId: string
): Promise<InstalledModuleInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("modules_v2")
    .select(`
      id,
      name,
      slug,
      current_version,
      category,
      icon,
      has_studio_components
    `)
    .eq("id", moduleId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    status: "active",
    version: data.current_version || "1.0.0",
    category: data.category,
    icon: data.icon,
    hasStudioComponents: data.has_studio_components ?? true,
  };
}

/**
 * Get known module slugs mapped to their IDs
 * Used for development modules in src/modules/
 */
export const KNOWN_MODULE_SLUGS: Record<string, string> = {
  ecommerce: "ecommerce",
  booking: "booking",
  crm: "crm",
  automation: "automation",
  "social-media": "social-media",
};

/**
 * Get module import path from slug
 */
export function getModuleImportPath(slug: string): string {
  // Local modules are in src/modules/
  return `@/modules/${slug}/studio`;
}
```

**Acceptance Criteria:**
- [ ] Can query installed modules for a site
- [ ] Returns correct InstalledModuleInfo structure
- [ ] Handles database errors gracefully
- [ ] Works with existing site_modules table

---

### Task 3: Create Module Component Loader

**Description:** Create the dynamic loader that imports module Studio exports.

**Files:**
- CREATE: `src/lib/studio/registry/module-loader.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio Module Component Loader
 * 
 * Dynamically loads Studio components from installed modules.
 */

import type { ComponentDefinition } from "@/types/studio";
import type { 
  ModuleStudioExports, 
  InstalledModuleInfo,
  CustomFieldEditor,
  ModuleLoaderState 
} from "@/types/studio-module";
import { componentRegistry } from "./component-registry";
import { fieldRegistry } from "./field-registry";

// =============================================================================
// MODULE IMPORT REGISTRY
// =============================================================================

/**
 * Registry of module dynamic imports
 * 
 * Maps module slugs to their dynamic import functions.
 * This allows webpack to create chunks for each module.
 */
const MODULE_IMPORTS: Record<string, () => Promise<ModuleStudioExports>> = {
  ecommerce: () => import("@/modules/ecommerce/studio").then(m => m as ModuleStudioExports).catch(() => ({})),
  booking: () => import("@/modules/booking/studio").then(m => m as ModuleStudioExports).catch(() => ({})),
  crm: () => import("@/modules/crm/studio").then(m => m as ModuleStudioExports).catch(() => ({})),
  automation: () => import("@/modules/automation/studio").then(m => m as ModuleStudioExports).catch(() => ({})),
  "social-media": () => import("@/modules/social-media/studio").then(m => m as ModuleStudioExports).catch(() => ({})),
};

// =============================================================================
// LOADER STATE
// =============================================================================

let loaderState: ModuleLoaderState = {
  isLoading: false,
  loadedModules: [],
  failedModules: {},
  lastLoadTime: null,
};

/**
 * Get current loader state
 */
export function getModuleLoaderState(): ModuleLoaderState {
  return { ...loaderState };
}

// =============================================================================
// MAIN LOADER FUNCTION
// =============================================================================

/**
 * Load Studio components from installed modules
 * 
 * @param modules - List of installed modules for the site
 * @returns Object containing loaded components and custom fields
 */
export async function loadModuleComponents(
  modules: InstalledModuleInfo[]
): Promise<{
  components: ComponentDefinition[];
  fields: Record<string, CustomFieldEditor>;
  loaded: string[];
  failed: Record<string, string>;
}> {
  loaderState = {
    isLoading: true,
    loadedModules: [],
    failedModules: {},
    lastLoadTime: null,
  };

  const allComponents: ComponentDefinition[] = [];
  const allFields: Record<string, CustomFieldEditor> = {};
  const loaded: string[] = [];
  const failed: Record<string, string> = {};

  for (const module of modules) {
    // Skip inactive modules
    if (module.status !== "active") {
      console.debug(`[ModuleLoader] Skipping inactive module: ${module.slug}`);
      continue;
    }

    // Skip if module doesn't have Studio components flag
    if (module.hasStudioComponents === false) {
      console.debug(`[ModuleLoader] Module ${module.slug} has no Studio components`);
      continue;
    }

    try {
      // Check if we have a registered import for this module
      const importFn = MODULE_IMPORTS[module.slug];
      
      if (!importFn) {
        console.debug(`[ModuleLoader] No import registered for module: ${module.slug}`);
        continue;
      }

      // Dynamic import
      const exports = await importFn();

      // Process studio components
      if (exports.studioComponents) {
        const componentDefs = processModuleComponents(
          exports.studioComponents,
          module
        );
        allComponents.push(...componentDefs);
        
        // Register each component
        for (const def of componentDefs) {
          componentRegistry.register(def, "module", module.id);
        }
      }

      // Process custom fields
      if (exports.studioFields) {
        for (const [fieldType, editor] of Object.entries(exports.studioFields)) {
          // Prefix with module ID to avoid collisions
          const prefixedType = `${module.slug}:${fieldType}`;
          allFields[prefixedType] = editor;
          fieldRegistry.registerCustomRenderer(prefixedType, editor);
        }
      }

      loaded.push(module.id);
      console.log(`[ModuleLoader] Loaded module: ${module.name} (${Object.keys(exports.studioComponents || {}).length} components)`);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failed[module.id] = message;
      console.warn(`[ModuleLoader] Failed to load module ${module.slug}:`, message);
    }
  }

  loaderState = {
    isLoading: false,
    loadedModules: loaded,
    failedModules: failed,
    lastLoadTime: Date.now(),
  };

  return {
    components: allComponents,
    fields: allFields,
    loaded,
    failed,
  };
}

/**
 * Process module component definitions
 * 
 * Adds module metadata and validates definitions.
 */
function processModuleComponents(
  components: Record<string, Omit<ComponentDefinition, "module">>,
  module: InstalledModuleInfo
): ComponentDefinition[] {
  const processed: ComponentDefinition[] = [];

  for (const [key, def] of Object.entries(components)) {
    // Validate required fields
    if (!def.type || !def.label || !def.render) {
      console.warn(`[ModuleLoader] Invalid component definition: ${key} in ${module.slug}`);
      continue;
    }

    // Add module metadata
    const fullDef: ComponentDefinition = {
      ...def,
      // Use module category or default to "module"
      category: def.category || "module",
      // Add module source
      module: {
        id: module.id,
        name: module.name,
        icon: module.icon,
      },
      // Add search keywords including module name
      keywords: [
        ...(def.keywords || []),
        module.name.toLowerCase(),
        module.slug,
      ],
    };

    processed.push(fullDef);
  }

  return processed;
}

// =============================================================================
// UNLOAD MODULE
// =============================================================================

/**
 * Unload components from a specific module
 * 
 * Called when a module is uninstalled or deactivated.
 */
export function unloadModuleComponents(moduleId: string): void {
  componentRegistry.unregisterModule(moduleId);
  
  // Update loader state
  loaderState = {
    ...loaderState,
    loadedModules: loaderState.loadedModules.filter(id => id !== moduleId),
  };

  console.log(`[ModuleLoader] Unloaded module: ${moduleId}`);
}

// =============================================================================
// RELOAD MODULE
// =============================================================================

/**
 * Reload a specific module's components
 */
export async function reloadModuleComponents(
  module: InstalledModuleInfo
): Promise<void> {
  // First unload
  unloadModuleComponents(module.id);
  
  // Then reload
  await loadModuleComponents([module]);
}

// =============================================================================
// REGISTER EXTERNAL MODULE
// =============================================================================

/**
 * Register a dynamic import for an external module
 * 
 * Used for marketplace modules that aren't in src/modules/
 */
export function registerModuleImport(
  slug: string,
  importFn: () => Promise<ModuleStudioExports>
): void {
  MODULE_IMPORTS[slug] = importFn;
}
```

**Acceptance Criteria:**
- [ ] Can dynamically import module Studio exports
- [ ] Registers components to component registry with module metadata
- [ ] Handles import failures gracefully
- [ ] Supports unloading modules
- [ ] Works with existing module structure

---

### Task 4: Create Module Loader Zustand Store

**Description:** Create a Zustand store to manage module loading state in the editor.

**Files:**
- CREATE: `src/lib/studio/store/module-store.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio Module Store
 * 
 * Zustand store for module component loading state.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { InstalledModuleInfo, ModuleLoaderState } from "@/types/studio-module";
import { 
  loadModuleComponents, 
  unloadModuleComponents,
  getModuleLoaderState 
} from "../registry/module-loader";
import { getInstalledModulesForSite } from "../registry/module-discovery";
import { componentRegistry } from "../registry/component-registry";

// =============================================================================
// TYPES
// =============================================================================

interface ModuleStoreState {
  /** Current site ID */
  siteId: string | null;
  
  /** Installed modules for current site */
  installedModules: InstalledModuleInfo[];
  
  /** Loader state */
  loader: ModuleLoaderState;
  
  /** Whether initial load is complete */
  isInitialized: boolean;
  
  /** Error message if initialization failed */
  initError: string | null;
}

interface ModuleStoreActions {
  /** Initialize module loading for a site */
  initialize: (siteId: string) => Promise<void>;
  
  /** Reload all modules */
  reloadModules: () => Promise<void>;
  
  /** Handle module installed */
  onModuleInstalled: (module: InstalledModuleInfo) => Promise<void>;
  
  /** Handle module uninstalled */
  onModuleUninstalled: (moduleId: string) => void;
  
  /** Handle module status change */
  onModuleStatusChange: (moduleId: string, status: InstalledModuleInfo["status"]) => Promise<void>;
  
  /** Reset store */
  reset: () => void;
  
  /** Get all components (core + module) */
  getAllComponents: () => ReturnType<typeof componentRegistry.getAll>;
  
  /** Get components grouped by category */
  getGroupedComponents: () => ReturnType<typeof componentRegistry.getGroupedByCategory>;
  
  /** Get module component count */
  getModuleComponentCount: () => number;
}

type ModuleStore = ModuleStoreState & ModuleStoreActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: ModuleStoreState = {
  siteId: null,
  installedModules: [],
  loader: {
    isLoading: false,
    loadedModules: [],
    failedModules: {},
    lastLoadTime: null,
  },
  isInitialized: false,
  initError: null,
};

// =============================================================================
// STORE
// =============================================================================

export const useModuleStore = create<ModuleStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // -------------------------------------------------------------------------
    // INITIALIZE
    // -------------------------------------------------------------------------
    
    initialize: async (siteId: string) => {
      // Skip if already initialized for this site
      if (get().siteId === siteId && get().isInitialized) {
        console.debug("[ModuleStore] Already initialized for site:", siteId);
        return;
      }

      set({ 
        siteId, 
        isInitialized: false, 
        initError: null,
        loader: { ...initialState.loader, isLoading: true },
      });

      try {
        // Fetch installed modules
        const modules = await getInstalledModulesForSite(siteId);
        
        set({ installedModules: modules });

        // Load module components
        const result = await loadModuleComponents(modules);

        set({
          loader: getModuleLoaderState(),
          isInitialized: true,
        });

        console.log(`[ModuleStore] Initialized with ${result.loaded.length} modules, ${result.components.length} components`);

      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load modules";
        set({
          loader: { ...initialState.loader, isLoading: false },
          isInitialized: true,
          initError: message,
        });
        console.error("[ModuleStore] Initialization failed:", error);
      }
    },

    // -------------------------------------------------------------------------
    // RELOAD
    // -------------------------------------------------------------------------
    
    reloadModules: async () => {
      const { siteId } = get();
      if (!siteId) return;

      set({ 
        loader: { ...get().loader, isLoading: true },
      });

      try {
        // Fetch fresh module list
        const modules = await getInstalledModulesForSite(siteId);
        
        // Unload all current modules
        for (const moduleId of get().loader.loadedModules) {
          unloadModuleComponents(moduleId);
        }

        // Load fresh
        const result = await loadModuleComponents(modules);

        set({
          installedModules: modules,
          loader: getModuleLoaderState(),
        });

        console.log(`[ModuleStore] Reloaded ${result.loaded.length} modules`);

      } catch (error) {
        set({
          loader: { ...get().loader, isLoading: false },
        });
        console.error("[ModuleStore] Reload failed:", error);
      }
    },

    // -------------------------------------------------------------------------
    // MODULE EVENTS
    // -------------------------------------------------------------------------
    
    onModuleInstalled: async (module: InstalledModuleInfo) => {
      // Add to installed list
      set({
        installedModules: [...get().installedModules, module],
      });

      // Load components
      await loadModuleComponents([module]);

      set({
        loader: getModuleLoaderState(),
      });
    },

    onModuleUninstalled: (moduleId: string) => {
      // Unload components
      unloadModuleComponents(moduleId);

      // Remove from installed list
      set({
        installedModules: get().installedModules.filter(m => m.id !== moduleId),
        loader: getModuleLoaderState(),
      });
    },

    onModuleStatusChange: async (moduleId: string, status: InstalledModuleInfo["status"]) => {
      const module = get().installedModules.find(m => m.id === moduleId);
      if (!module) return;

      // Update status in list
      set({
        installedModules: get().installedModules.map(m =>
          m.id === moduleId ? { ...m, status } : m
        ),
      });

      if (status === "active") {
        // Load components
        await loadModuleComponents([{ ...module, status }]);
      } else {
        // Unload components
        unloadModuleComponents(moduleId);
      }

      set({
        loader: getModuleLoaderState(),
      });
    },

    // -------------------------------------------------------------------------
    // RESET
    // -------------------------------------------------------------------------
    
    reset: () => {
      // Unload all module components
      for (const moduleId of get().loader.loadedModules) {
        unloadModuleComponents(moduleId);
      }
      
      set(initialState);
    },

    // -------------------------------------------------------------------------
    // GETTERS
    // -------------------------------------------------------------------------
    
    getAllComponents: () => {
      return componentRegistry.getAll();
    },

    getGroupedComponents: () => {
      return componentRegistry.getGroupedByCategory();
    },

    getModuleComponentCount: () => {
      return componentRegistry.moduleCount;
    },
  }))
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectIsLoadingModules = (state: ModuleStore) => state.loader.isLoading;
export const selectInstalledModules = (state: ModuleStore) => state.installedModules;
export const selectModuleLoadErrors = (state: ModuleStore) => state.loader.failedModules;
export const selectIsModuleInitialized = (state: ModuleStore) => state.isInitialized;
```

**Acceptance Criteria:**
- [ ] Store initializes module loading for a site
- [ ] Tracks loading state
- [ ] Handles module install/uninstall events
- [ ] Provides component accessors
- [ ] Supports reload functionality

---

### Task 5: Create Real-time Module Sync Hook

**Description:** Create a hook that subscribes to module changes via Supabase realtime.

**Files:**
- CREATE: `src/lib/studio/hooks/use-module-sync.ts`

**Code:**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useModuleStore } from "../store/module-store";
import { getModuleInfo } from "../registry/module-discovery";
import type { InstalledModuleInfo } from "@/types/studio-module";

/**
 * Hook to sync module changes in real-time
 * 
 * Subscribes to site_modules table changes and updates the module store.
 */
export function useModuleSync(siteId: string | null) {
  const { 
    onModuleInstalled, 
    onModuleUninstalled, 
    onModuleStatusChange,
    isInitialized,
  } = useModuleStore();
  
  const subscriptionRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!siteId || !isInitialized) return;

    const supabase = createClient();

    // Create channel for this site's module changes
    const channel = supabase
      .channel(`site-modules-${siteId}`)
      .on<{
        id: string;
        site_id: string;
        module_id: string;
        status: string;
      }>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "site_modules",
          filter: `site_id=eq.${siteId}`,
        },
        async (payload) => {
          console.log("[ModuleSync] Module installed:", payload.new.module_id);
          
          // Fetch full module info
          const moduleInfo = await getModuleInfo(payload.new.module_id);
          
          if (moduleInfo) {
            const installed: InstalledModuleInfo = {
              ...moduleInfo,
              status: payload.new.status as InstalledModuleInfo["status"],
            };
            onModuleInstalled(installed);
          }
        }
      )
      .on<{
        id: string;
        site_id: string;
        module_id: string;
        status: string;
      }>(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "site_modules",
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          console.log("[ModuleSync] Module uninstalled:", payload.old.module_id);
          onModuleUninstalled(payload.old.module_id);
        }
      )
      .on<{
        id: string;
        site_id: string;
        module_id: string;
        status: string;
      }>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_modules",
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          
          if (oldStatus !== newStatus) {
            console.log("[ModuleSync] Module status changed:", payload.new.module_id, newStatus);
            onModuleStatusChange(
              payload.new.module_id, 
              newStatus as InstalledModuleInfo["status"]
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[ModuleSync] Subscribed to module changes for site:", siteId);
        }
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [siteId, isInitialized, onModuleInstalled, onModuleUninstalled, onModuleStatusChange]);
}

/**
 * Hook to initialize modules on editor mount
 */
export function useModuleInitialization(siteId: string | null) {
  const { initialize, reset, isInitialized, loader } = useModuleStore();

  useEffect(() => {
    if (!siteId) return;

    initialize(siteId);

    return () => {
      // Don't reset immediately - allows for navigation between pages
    };
  }, [siteId, initialize]);

  return {
    isLoading: loader.isLoading,
    isInitialized,
    loadedModules: loader.loadedModules,
    failedModules: loader.failedModules,
  };
}
```

**Acceptance Criteria:**
- [ ] Subscribes to site_modules changes via Supabase realtime
- [ ] Handles INSERT (module installed)
- [ ] Handles DELETE (module uninstalled)
- [ ] Handles UPDATE (status change)
- [ ] Cleans up subscription on unmount

---

### Task 6: Update Left Panel for Module Components

**Description:** Modify the left panel to show module components with badges.

**Files:**
- MODIFY: `src/components/studio/panels/left-panel.tsx`

**Code Changes:**

Add module badge to component items and update to use module store:

```typescript
// Add to imports at top
import { useModuleStore, selectIsLoadingModules } from "@/lib/studio/store/module-store";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";

// Update component to use module store
export function LeftPanel({ className }: LeftPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { leftPanelTab, setLeftPanelTab } = useUIStore();
  const isLoadingModules = useModuleStore(selectIsLoadingModules);
  const getAllComponents = useModuleStore(state => state.getAllComponents);
  const getGroupedComponents = useModuleStore(state => state.getGroupedComponents);
  
  // Get all components including module components
  const allComponents = getAllComponents();
  const groupedComponents = getGroupedComponents();
  
  // ... rest of component

  // Update ComponentItem to show module badge
  const ComponentItemWithBadge = ({ 
    component, 
    isDragging 
  }: { 
    component: ComponentDefinition; 
    isDragging: boolean;
  }) => (
    <div className="flex items-center gap-2 w-full">
      <ComponentIcon icon={component.icon} />
      <span className="flex-1 truncate">{component.label}</span>
      {component.module && (
        <Badge 
          variant="secondary" 
          className="text-[10px] px-1 py-0 h-4 flex-shrink-0"
        >
          <Package className="h-2.5 w-2.5 mr-0.5" />
          {component.module.name}
        </Badge>
      )}
    </div>
  );

  // Add loading indicator when modules are loading
  if (isLoadingModules) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading modules...</span>
      </div>
    );
  }

  // ... rest of render
}
```

**Acceptance Criteria:**
- [ ] Module components show with module name badge
- [ ] Loading state shows when modules are loading
- [ ] Components are grouped correctly by category
- [ ] Search works for module components (including module name)

---

### Task 7: Update Studio Provider for Module Initialization

**Description:** Ensure modules are initialized when Studio mounts.

**Files:**
- MODIFY: `src/components/studio/core/studio-provider.tsx`

**Code Changes:**

```typescript
// Add to imports
import { useModuleInitialization, useModuleSync } from "@/lib/studio/hooks/use-module-sync";

// Add to StudioProvider component body (before other hooks)
export function StudioProvider({ children, siteId, pageId }: StudioProviderProps) {
  // Initialize modules for this site
  const { isLoading: isLoadingModules, isInitialized: modulesInitialized } = 
    useModuleInitialization(siteId);
  
  // Subscribe to real-time module changes
  useModuleSync(siteId);

  // ... existing code

  // Optionally block render until modules are loaded
  // (or show a skeleton/loading state)
  // You may want to allow rendering even if modules aren't loaded
  
  return (
    <StudioContext.Provider value={contextValue}>
      {children}
    </StudioContext.Provider>
  );
}
```

**Acceptance Criteria:**
- [ ] Modules initialize when Studio mounts
- [ ] Real-time sync is active
- [ ] Editor remains functional while modules load
- [ ] Module changes reflect in component library

---

### Task 8: Create Example Module Studio Exports (E-Commerce)

**Description:** Create a sample Studio export for the E-Commerce module as a reference implementation.

**Files:**
- CREATE: `src/modules/ecommerce/studio/index.ts`
- CREATE: `src/modules/ecommerce/studio/components/product-card-block.tsx`
- CREATE: `src/modules/ecommerce/studio/components/product-grid-block.tsx`

**Code for `src/modules/ecommerce/studio/index.ts`:**

```typescript
/**
 * E-Commerce Module - Studio Integration
 * 
 * Exports Studio components and custom fields for the visual editor.
 */

import type { ModuleStudioExports } from "@/types/studio-module";
import { ProductCardBlock, productCardDefinition } from "./components/product-card-block";
import { ProductGridBlock, productGridDefinition } from "./components/product-grid-block";

// =============================================================================
// STUDIO COMPONENTS
// =============================================================================

export const studioComponents: ModuleStudioExports["studioComponents"] = {
  EcommerceProductCard: {
    ...productCardDefinition,
    render: ProductCardBlock,
  },
  EcommerceProductGrid: {
    ...productGridDefinition,
    render: ProductGridBlock,
  },
};

// =============================================================================
// CUSTOM FIELDS (defined in Phase 15)
// =============================================================================

export const studioFields: ModuleStudioExports["studioFields"] = {
  // Will be added in Phase 15
  // 'product-selector': ProductSelectorField,
  // 'category-selector': CategorySelectorField,
};

// =============================================================================
// METADATA
// =============================================================================

export const studioMetadata: ModuleStudioExports["studioMetadata"] = {
  name: "E-Commerce",
  icon: "ShoppingCart",
  category: "ecommerce",
};
```

**Code for `src/modules/ecommerce/studio/components/product-card-block.tsx`:**

```typescript
/**
 * E-Commerce Product Card - Studio Block
 * 
 * Displays a product from the store catalog.
 */

"use client";

import type { ComponentDefinition } from "@/types/studio";
import type { ResponsiveValue } from "@/types/studio";
import { ShoppingBag, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface ProductCardProps {
  // Product selection
  productId: string | null;
  productData?: {
    name: string;
    price: number;
    image?: string;
    rating?: number;
    reviewCount?: number;
  };
  
  // Display options
  showPrice: boolean;
  showRating: boolean;
  showButton: boolean;
  buttonText: string;
  
  // Layout
  variant: "card" | "horizontal" | "minimal";
  imageAspect: "square" | "portrait" | "landscape";
  
  // Responsive
  padding: ResponsiveValue<string>;
  borderRadius: ResponsiveValue<string>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductCardBlock({
  productId,
  productData,
  showPrice = true,
  showRating = true,
  showButton = true,
  buttonText = "Add to Cart",
  variant = "card",
  imageAspect = "square",
  padding = { mobile: "16px" },
  borderRadius = { mobile: "8px" },
}: ProductCardProps) {
  // Demo data for editor preview
  const product = productData || {
    name: productId ? "Loading product..." : "Select a product",
    price: 99.99,
    image: "/api/placeholder/400/400",
    rating: 4.5,
    reviewCount: 128,
  };

  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  if (variant === "minimal") {
    return (
      <div 
        className="group cursor-pointer"
        style={{ 
          padding: padding.mobile,
          borderRadius: borderRadius.mobile,
        }}
      >
        <div className={cn("relative overflow-hidden", aspectClasses[imageAspect])}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="mt-3">
          <h3 className="font-medium truncate">{product.name}</h3>
          {showPrice && (
            <p className="text-primary font-semibold mt-1">
              ${product.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div 
        className="flex gap-4 bg-card border rounded-lg overflow-hidden"
        style={{ padding: padding.mobile }}
      >
        <div className="w-32 h-32 flex-shrink-0">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="font-medium">{product.name}</h3>
          {showRating && product.rating && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2">
            {showPrice && (
              <p className="text-lg font-semibold text-primary">
                ${product.price.toFixed(2)}
              </p>
            )}
            {showButton && (
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                {buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div 
      className="bg-card border rounded-lg overflow-hidden group"
      style={{ borderRadius: borderRadius.mobile }}
    >
      <div className={cn("relative overflow-hidden", aspectClasses[imageAspect])}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>
      <div style={{ padding: padding.mobile }}>
        <h3 className="font-medium truncate">{product.name}</h3>
        
        {showRating && product.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{product.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3">
          {showPrice && (
            <p className="text-lg font-semibold text-primary">
              ${product.price.toFixed(2)}
            </p>
          )}
          {showButton && (
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// DEFINITION
// =============================================================================

export const productCardDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceProductCard",
  label: "Product Card",
  description: "Display a product with image, title, price, and buy button",
  category: "ecommerce",
  icon: "ShoppingBag",
  
  fields: {
    productId: {
      type: "custom" as const,
      label: "Product",
      description: "Select a product from your catalog",
      // Custom field type defined in Phase 15
      // For now, fallback to text input
    },
    showPrice: {
      type: "toggle",
      label: "Show Price",
      defaultValue: true,
    },
    showRating: {
      type: "toggle",
      label: "Show Rating",
      defaultValue: true,
    },
    showButton: {
      type: "toggle",
      label: "Show Button",
      defaultValue: true,
    },
    buttonText: {
      type: "text",
      label: "Button Text",
      defaultValue: "Add to Cart",
    },
    variant: {
      type: "select",
      label: "Layout",
      options: [
        { label: "Card", value: "card" },
        { label: "Horizontal", value: "horizontal" },
        { label: "Minimal", value: "minimal" },
      ],
      defaultValue: "card",
    },
    imageAspect: {
      type: "select",
      label: "Image Aspect",
      options: [
        { label: "Square", value: "square" },
        { label: "Portrait", value: "portrait" },
        { label: "Landscape", value: "landscape" },
      ],
      defaultValue: "square",
    },
    padding: {
      type: "text",
      label: "Padding",
      defaultValue: "16px",
      responsive: true,
    },
    borderRadius: {
      type: "text",
      label: "Border Radius",
      defaultValue: "8px",
      responsive: true,
    },
  },
  
  defaultProps: {
    productId: null,
    showPrice: true,
    showRating: true,
    showButton: true,
    buttonText: "Add to Cart",
    variant: "card",
    imageAspect: "square",
    padding: { mobile: "16px" },
    borderRadius: { mobile: "8px" },
  },
  
  ai: {
    description: "Product card displaying an e-commerce product with customizable display options",
    canModify: ["showPrice", "showRating", "showButton", "buttonText", "variant", "imageAspect"],
    suggestions: [
      "Show product without price",
      "Use horizontal layout",
      "Change button text to Buy Now",
      "Make it minimal",
    ],
  },
  
  keywords: ["product", "shop", "buy", "cart", "ecommerce", "store"],
};
```

**Code for `src/modules/ecommerce/studio/components/product-grid-block.tsx`:**

```typescript
/**
 * E-Commerce Product Grid - Studio Block
 * 
 * Displays a grid of products from the store catalog.
 */

"use client";

import type { ComponentDefinition } from "@/types/studio";
import type { ResponsiveValue } from "@/types/studio";
import { ShoppingBag } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface ProductGridProps {
  // Grid settings
  columns: ResponsiveValue<number>;
  gap: ResponsiveValue<string>;
  
  // Product source
  source: "category" | "featured" | "new" | "sale" | "custom";
  categoryId: string | null;
  productIds: string[];
  limit: number;
  
  // Display options
  showPrice: boolean;
  showRating: boolean;
  cardVariant: "card" | "minimal";
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductGridBlock({
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = { mobile: "16px" },
  source = "featured",
  categoryId,
  productIds = [],
  limit = 8,
  showPrice = true,
  showRating = true,
  cardVariant = "card",
}: ProductGridProps) {
  // Demo products for editor preview
  const demoProducts = Array.from({ length: limit }, (_, i) => ({
    id: `demo-${i + 1}`,
    name: `Product ${i + 1}`,
    price: 49.99 + i * 10,
    image: `/api/placeholder/400/400?text=Product${i + 1}`,
    rating: 4 + Math.random(),
  }));

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
    gap: gap.mobile,
  };

  return (
    <div 
      className="product-grid"
      style={gridStyle}
    >
      {demoProducts.map((product) => (
        <div 
          key={product.id}
          className="bg-card border rounded-lg overflow-hidden group"
        >
          <div className="aspect-square relative overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-medium truncate">{product.name}</h3>
            {showPrice && (
              <p className="text-primary font-semibold mt-1">
                ${product.price.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      ))}
      
      {/* Add CSS for responsive columns */}
      <style jsx>{`
        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(${columns.tablet || columns.mobile}, 1fr);
            gap: ${gap.tablet || gap.mobile};
          }
        }
        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(${columns.desktop || columns.tablet || columns.mobile}, 1fr);
            gap: ${gap.desktop || gap.tablet || gap.mobile};
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// DEFINITION
// =============================================================================

export const productGridDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceProductGrid",
  label: "Product Grid",
  description: "Display a grid of products from your catalog",
  category: "ecommerce",
  icon: "LayoutGrid",
  
  fields: {
    columns: {
      type: "number",
      label: "Columns",
      defaultValue: 4,
      min: 1,
      max: 6,
      responsive: true,
    },
    gap: {
      type: "text",
      label: "Gap",
      defaultValue: "16px",
      responsive: true,
    },
    source: {
      type: "select",
      label: "Product Source",
      options: [
        { label: "Featured Products", value: "featured" },
        { label: "New Arrivals", value: "new" },
        { label: "On Sale", value: "sale" },
        { label: "From Category", value: "category" },
        { label: "Custom Selection", value: "custom" },
      ],
      defaultValue: "featured",
    },
    categoryId: {
      type: "custom" as const,
      label: "Category",
      description: "Select a category",
      // Shows only when source is "category"
    },
    limit: {
      type: "number",
      label: "Product Limit",
      defaultValue: 8,
      min: 1,
      max: 24,
    },
    showPrice: {
      type: "toggle",
      label: "Show Price",
      defaultValue: true,
    },
    showRating: {
      type: "toggle",
      label: "Show Rating",
      defaultValue: true,
    },
    cardVariant: {
      type: "select",
      label: "Card Style",
      options: [
        { label: "Card", value: "card" },
        { label: "Minimal", value: "minimal" },
      ],
      defaultValue: "card",
    },
  },
  
  defaultProps: {
    columns: { mobile: 2, tablet: 3, desktop: 4 },
    gap: { mobile: "16px" },
    source: "featured",
    categoryId: null,
    productIds: [],
    limit: 8,
    showPrice: true,
    showRating: true,
    cardVariant: "card",
  },
  
  ai: {
    description: "Grid displaying multiple products from the e-commerce catalog",
    canModify: ["columns", "limit", "showPrice", "showRating", "cardVariant"],
    suggestions: [
      "Show 4 columns",
      "Display 12 products",
      "Hide ratings",
      "Use minimal card style",
    ],
  },
  
  keywords: ["products", "grid", "catalog", "shop", "store", "ecommerce", "collection"],
};
```

**Acceptance Criteria:**
- [ ] E-Commerce module exports studioComponents
- [ ] ProductCardBlock renders correctly
- [ ] ProductGridBlock renders correctly
- [ ] Components have proper field definitions
- [ ] AI configuration is complete
- [ ] Components work with responsive values

---

### Task 9: Update Exports and Index Files

**Description:** Update index files to export new modules and types.

**Files:**
- MODIFY: `src/types/index.ts` (or create if doesn't exist)
- MODIFY: `src/lib/studio/registry/index.ts`
- MODIFY: `src/lib/studio/store/index.ts`
- MODIFY: `src/lib/studio/hooks/index.ts` (or create)

**Code for `src/lib/studio/registry/index.ts`:**

```typescript
// Existing exports
export * from "./component-registry";
export * from "./core-components";
export * from "./field-registry";
export * from "./hooks";

// New exports for module loading
export * from "./module-discovery";
export * from "./module-loader";
```

**Code for `src/lib/studio/store/index.ts`:**

```typescript
// Existing exports
export * from "./editor-store";
export * from "./ui-store";
export * from "./selection-store";
export * from "./history-store";
export * from "./ai-store";

// New export
export * from "./module-store";
```

**Code for `src/lib/studio/hooks/index.ts`:**

```typescript
/**
 * DRAMAC Studio Hooks
 */

export * from "./use-module-sync";
```

**Acceptance Criteria:**
- [ ] All new modules are properly exported
- [ ] No circular dependency issues
- [ ] TypeScript compiles without errors

---

### Task 10: Handle Component Placeholder for Uninstalled Modules

**Description:** Create a placeholder component that renders when a module component is used but the module is no longer installed.

**Files:**
- CREATE: `src/components/studio/core/module-placeholder.tsx`
- MODIFY: `src/components/studio/core/component-wrapper.tsx`

**Code for `src/components/studio/core/module-placeholder.tsx`:**

```typescript
/**
 * Module Placeholder Component
 * 
 * Displayed when a component from an uninstalled module is encountered.
 */

"use client";

import { AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModulePlaceholderProps {
  componentType: string;
  moduleName?: string;
  moduleId?: string;
}

export function ModulePlaceholder({
  componentType,
  moduleName,
  moduleId,
}: ModulePlaceholderProps) {
  return (
    <div className="border-2 border-dashed border-yellow-500/50 rounded-lg p-6 bg-yellow-50/50 dark:bg-yellow-950/20">
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        
        <h3 className="font-semibold text-foreground mb-2">
          Module Component Unavailable
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          The <code className="px-1 py-0.5 bg-muted rounded text-xs">{componentType}</code> component 
          requires the <strong>{moduleName || "unknown"}</strong> module.
        </p>
        
        <p className="text-xs text-muted-foreground mb-4">
          This component will not render on the live site until the module is installed.
        </p>
        
        {moduleId && (
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            onClick={() => {
              // Navigate to module installation
              window.open(`/dashboard/modules/${moduleId}`, "_blank");
            }}
          >
            <Download className="h-4 w-4" />
            Install Module
          </Button>
        )}
      </div>
    </div>
  );
}
```

**Code changes for `src/components/studio/core/component-wrapper.tsx`:**

```typescript
// Add import
import { ModulePlaceholder } from "./module-placeholder";
import { componentRegistry } from "@/lib/studio/registry/component-registry";

// In the render section, add check for missing component:
export function ComponentWrapper({ component, ...props }: ComponentWrapperProps) {
  const definition = componentRegistry.get(component.type);
  
  // Handle missing component (uninstalled module)
  if (!definition) {
    // Try to extract module info from component type
    const isModuleComponent = component.type.includes("Ecommerce") || 
                              component.type.includes("Booking") ||
                              component.type.includes("Crm");
    
    return (
      <div 
        className="studio-component-wrapper"
        data-component-id={component.id}
        data-component-type={component.type}
      >
        <ModulePlaceholder
          componentType={component.type}
          moduleName={isModuleComponent ? component.type.split(/(?=[A-Z])/)[0] : undefined}
        />
      </div>
    );
  }
  
  // Continue with normal rendering...
  const Component = definition.render;
  
  return (
    // ... existing wrapper code
  );
}
```

**Acceptance Criteria:**
- [ ] Placeholder renders for missing components
- [ ] Shows component type and module name
- [ ] Provides link to install module
- [ ] Doesn't break editor when module is uninstalled

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/types/studio-module.ts` | Module Studio integration types |
| CREATE | `src/lib/studio/registry/module-discovery.ts` | Server-side module discovery |
| CREATE | `src/lib/studio/registry/module-loader.ts` | Dynamic module component loader |
| CREATE | `src/lib/studio/store/module-store.ts` | Zustand store for module state |
| CREATE | `src/lib/studio/hooks/use-module-sync.ts` | Real-time module sync hook |
| CREATE | `src/modules/ecommerce/studio/index.ts` | E-Commerce Studio exports |
| CREATE | `src/modules/ecommerce/studio/components/product-card-block.tsx` | Product Card component |
| CREATE | `src/modules/ecommerce/studio/components/product-grid-block.tsx` | Product Grid component |
| CREATE | `src/components/studio/core/module-placeholder.tsx` | Placeholder for missing modules |
| MODIFY | `src/components/studio/panels/left-panel.tsx` | Add module badges and loading state |
| MODIFY | `src/components/studio/core/studio-provider.tsx` | Initialize modules on mount |
| MODIFY | `src/components/studio/core/component-wrapper.tsx` | Handle missing components |
| MODIFY | `src/lib/studio/registry/index.ts` | Export new module functions |
| MODIFY | `src/lib/studio/store/index.ts` | Export module store |
| CREATE | `src/lib/studio/hooks/index.ts` | Export hooks |

## Testing Requirements

### Unit Tests

- [ ] Module discovery returns correct modules for a site
- [ ] Module loader handles import failures gracefully
- [ ] Module store initializes correctly
- [ ] Module store handles install/uninstall events
- [ ] Component registry includes module components after loading

### Integration Tests

- [ ] Installing a module adds components to library
- [ ] Uninstalling a module removes components from library
- [ ] Module components can be dragged to canvas
- [ ] Module components render correctly
- [ ] AI works with module components

### Manual Testing

- [ ] Open Studio for a site with E-Commerce module installed
- [ ] Verify "E-Commerce" category appears in left panel
- [ ] Verify Product Card and Product Grid are available
- [ ] Drag Product Card to canvas - renders correctly
- [ ] Edit Product Card properties - updates correctly
- [ ] Test AI: "Hide the price" - updates showPrice prop
- [ ] Uninstall E-Commerce module (in another tab)
- [ ] Verify component library updates (after refresh)
- [ ] Verify existing Product Card shows placeholder

## Dependencies to Install

```bash
# No new dependencies required - uses existing packages
```

## Environment Variables

```env
# No new environment variables required
```

## Database Changes

```sql
-- Add has_studio_components column to modules_v2 if not exists
ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS has_studio_components BOOLEAN DEFAULT true;

-- Update existing modules
UPDATE modules_v2 SET has_studio_components = true WHERE slug IN ('ecommerce', 'booking', 'crm');
```

## Rollback Plan

1. Remove module initialization from StudioProvider
2. Revert left-panel.tsx to use core components only
3. Delete new files:
   - `src/types/studio-module.ts`
   - `src/lib/studio/registry/module-discovery.ts`
   - `src/lib/studio/registry/module-loader.ts`
   - `src/lib/studio/store/module-store.ts`
   - `src/lib/studio/hooks/use-module-sync.ts`
   - `src/modules/ecommerce/studio/` folder
4. Editor continues working with core components only

## Success Criteria

- [ ] Module components appear in component library when module is installed
- [ ] Module components have a visible badge showing module name
- [ ] Module components can be dragged and dropped like core components
- [ ] Module components render correctly on canvas
- [ ] Module component props are editable in properties panel
- [ ] AI integration works with module components
- [ ] Real-time sync: installing module updates library without refresh
- [ ] Real-time sync: uninstalling module removes components
- [ ] Placeholder shown for components from uninstalled modules
- [ ] Multiple modules can be loaded simultaneously
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Build succeeds (`pnpm build`)
