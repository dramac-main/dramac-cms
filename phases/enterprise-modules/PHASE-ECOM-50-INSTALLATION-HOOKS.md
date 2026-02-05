# PHASE-ECOM-50: Module Installation Hook System

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 6-8 hours
> **Prerequisites**: Waves 1-5 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a comprehensive hook system that triggers automatic site configuration when the e-commerce module is installed. This enables the module to automatically create pages, add navigation items, and apply default settings without manual user intervention, providing a seamless "install and go" experience.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing e-commerce module code (`src/modules/ecommerce/`)
- [ ] Review existing module installation code (`src/lib/modules/module-installation.ts`)
- [ ] Verify Waves 1-5 are complete
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Module Installation Flow                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Installs Module                                               │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────┐                                       │
│  │ installModuleOnSite()   │                                       │
│  └───────────┬─────────────┘                                       │
│              │                                                      │
│              ▼                                                      │
│  ┌─────────────────────────┐     ┌─────────────────────────┐      │
│  │ Module Hook Registry    │────▶│ getModuleHook(moduleId) │      │
│  └─────────────────────────┘     └───────────┬─────────────┘      │
│                                              │                      │
│              ┌───────────────────────────────┘                      │
│              ▼                                                      │
│  ┌─────────────────────────┐                                       │
│  │ executeInstallHook()    │                                       │
│  └───────────┬─────────────┘                                       │
│              │                                                      │
│    ┌─────────┼─────────┬─────────────┐                             │
│    ▼         ▼         ▼             ▼                             │
│ ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────────┐                       │
│ │Create│ │ Add  │ │  Apply   │ │  Create  │                       │
│ │Pages │ │ Nav  │ │ Settings │ │  Sample  │                       │
│ └──────┘ └──────┘ └──────────┘ └──────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/modules/hooks/types.ts` | Create | Hook type definitions |
| `src/lib/modules/hooks/module-hooks-registry.ts` | Create | Hook registration and execution |
| `src/lib/modules/hooks/index.ts` | Create | Export all hooks |
| `src/modules/ecommerce/hooks/installation-hook.ts` | Create | E-commerce specific installation hook |
| `src/modules/ecommerce/hooks/index.ts` | Modify | Add installation hook export |
| `src/lib/modules/module-installation.ts` | Modify | Integrate hook execution |

---

## 📋 Implementation Tasks

### Task 50.1: Create Hook Type Definitions

**File**: `src/lib/modules/hooks/types.ts`
**Action**: Create

**Description**: Define TypeScript interfaces for the module installation hook system.

```typescript
/**
 * Module Installation Hook Types
 * 
 * PHASE-ECOM-50: Module Installation Hook System
 * 
 * Type definitions for the module hook system that enables
 * automatic site configuration when modules are installed.
 */

// ============================================================================
// HOOK RESULT TYPES
// ============================================================================

/**
 * Result returned from an installation hook
 */
export interface InstallHookResult {
  /** Whether the hook executed successfully */
  success: boolean;
  
  /** List of page slugs created by the hook */
  pagesCreated?: string[];
  
  /** List of navigation item IDs added */
  navItemsAdded?: string[];
  
  /** Settings that were applied */
  settingsApplied?: Record<string, unknown>;
  
  /** Any errors that occurred during hook execution */
  errors?: string[];
  
  /** Additional metadata from the hook */
  metadata?: Record<string, unknown>;
}

/**
 * Result returned from an uninstallation hook
 */
export interface UninstallHookResult {
  /** Whether the hook executed successfully */
  success: boolean;
  
  /** List of page slugs removed or marked as orphaned */
  pagesRemoved?: string[];
  
  /** List of navigation item IDs removed */
  navItemsRemoved?: string[];
  
  /** Settings that were cleaned up */
  settingsCleaned?: string[];
  
  /** Any errors that occurred during hook execution */
  errors?: string[];
  
  /** Additional metadata from the hook */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

/**
 * Module installation hook interface
 * 
 * Modules implement this interface to define behavior when
 * they are installed, uninstalled, enabled, or disabled on a site.
 */
export interface ModuleInstallationHook {
  /** Module ID this hook is for */
  moduleId: string;
  
  /**
   * Called after the module is installed on a site.
   * Use this to create pages, add navigation, apply settings.
   * 
   * @param siteId - The ID of the site the module was installed on
   * @param settings - Optional initial settings passed during installation
   * @returns Result object with details of what was created
   */
  onInstall: (
    siteId: string,
    settings?: Record<string, unknown>
  ) => Promise<InstallHookResult>;
  
  /**
   * Called before the module is uninstalled from a site.
   * Use this to clean up pages, navigation, settings.
   * 
   * NOTE: Module data tables are NOT deleted by default.
   * Users must explicitly delete data if they want to remove it.
   * 
   * @param siteId - The ID of the site the module is being uninstalled from
   * @returns Result object with details of what was cleaned up
   */
  onUninstall: (siteId: string) => Promise<UninstallHookResult>;
  
  /**
   * Called when the module is enabled on a site.
   * The module remains installed but was previously disabled.
   * 
   * @param siteId - The ID of the site
   */
  onEnable?: (siteId: string) => Promise<void>;
  
  /**
   * Called when the module is disabled on a site.
   * The module remains installed but becomes inactive.
   * 
   * @param siteId - The ID of the site
   */
  onDisable?: (siteId: string) => Promise<void>;
}

// ============================================================================
// HOOK OPTIONS
// ============================================================================

/**
 * Options for hook execution
 */
export interface HookExecutionOptions {
  /** Skip page creation even if hook defines pages */
  skipPageCreation?: boolean;
  
  /** Skip navigation modification even if hook defines nav items */
  skipNavigation?: boolean;
  
  /** Skip settings application */
  skipSettings?: boolean;
  
  /** Include sample/demo data */
  includeSampleData?: boolean;
  
  /** Custom data to pass to the hook */
  customData?: Record<string, unknown>;
}

// ============================================================================
// PAGE TEMPLATE TYPES
// ============================================================================

/**
 * Page template definition for auto-creation
 */
export interface PageTemplate {
  /** URL slug for the page */
  slug: string;
  
  /** Page title */
  title: string;
  
  /** SEO meta title */
  metaTitle?: string;
  
  /** SEO meta description */
  metaDescription?: string;
  
  /** Page status after creation */
  status?: 'draft' | 'published';
  
  /** DRAMAC Studio content structure */
  content: StudioPageTemplate;
  
  /** Whether this is a dynamic route (e.g., /products/[slug]) */
  isDynamic?: boolean;
  
  /** Dynamic route pattern */
  dynamicPattern?: string;
}

/**
 * Studio page template content structure
 */
export interface StudioPageTemplate {
  /** Schema version */
  version: '1.0';
  
  /** Root configuration */
  root: {
    id: 'root';
    type: 'Root';
    props: {
      title?: string;
      description?: string;
      styles?: {
        backgroundColor?: string;
        maxWidth?: string;
        padding?: string;
      };
    };
    children: string[];
  };
  
  /** Components indexed by ID */
  components: Record<string, StudioComponentTemplate>;
}

/**
 * Studio component template structure
 */
export interface StudioComponentTemplate {
  /** Component unique ID */
  id: string;
  
  /** Component type (matches registry) */
  type: string;
  
  /** Component properties */
  props: Record<string, unknown>;
  
  /** Child component IDs */
  children?: string[];
  
  /** Parent component ID */
  parentId?: string;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

/**
 * Navigation item definition for auto-addition
 */
export interface NavigationItemTemplate {
  /** Unique identifier for the nav item */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Link href */
  href: string;
  
  /** Optional icon name (Lucide icon) */
  icon?: string;
  
  /** Position in navigation */
  position: 'main' | 'utility' | 'footer';
  
  /** Sort order within position */
  sortOrder?: number;
  
  /** Child navigation items */
  children?: NavigationItemTemplate[];
  
  /** Dynamic badge (e.g., cart count) */
  badge?: string;
  
  /** CSS class for styling */
  className?: string;
}

// ============================================================================
// SAMPLE DATA TYPES
// ============================================================================

/**
 * Sample data definition for optional demo content
 */
export interface SampleDataDefinition {
  /** Sample categories to create */
  categories?: Array<{
    name: string;
    slug: string;
    description?: string;
  }>;
  
  /** Sample products to create */
  products?: Array<{
    name: string;
    slug: string;
    description?: string;
    price: number;
    images?: string[];
    categorySlug?: string;
  }>;
}
```

---

### Task 50.2: Create Module Hooks Registry

**File**: `src/lib/modules/hooks/module-hooks-registry.ts`
**Action**: Create

**Description**: Create the central registry for module hooks with registration and execution functions.

```typescript
/**
 * Module Hooks Registry
 * 
 * PHASE-ECOM-50: Module Installation Hook System
 * 
 * Central registry for module installation hooks.
 * Hooks are registered here and executed during module install/uninstall.
 */

import type {
  ModuleInstallationHook,
  InstallHookResult,
  UninstallHookResult,
  HookExecutionOptions,
} from './types';

// ============================================================================
// REGISTRY
// ============================================================================

/**
 * Map of module IDs to their installation hooks
 */
const moduleHooks = new Map<string, ModuleInstallationHook>();

/**
 * Register a module installation hook
 * 
 * @param hook - The hook to register
 * @throws Error if a hook is already registered for the module
 */
export function registerModuleHook(hook: ModuleInstallationHook): void {
  if (moduleHooks.has(hook.moduleId)) {
    console.warn(
      `[ModuleHooksRegistry] Overwriting existing hook for module: ${hook.moduleId}`
    );
  }
  
  moduleHooks.set(hook.moduleId, hook);
  console.log(`[ModuleHooksRegistry] Registered hook for module: ${hook.moduleId}`);
}

/**
 * Unregister a module installation hook
 * 
 * @param moduleId - The module ID to unregister
 * @returns True if a hook was removed, false otherwise
 */
export function unregisterModuleHook(moduleId: string): boolean {
  const existed = moduleHooks.has(moduleId);
  moduleHooks.delete(moduleId);
  
  if (existed) {
    console.log(`[ModuleHooksRegistry] Unregistered hook for module: ${moduleId}`);
  }
  
  return existed;
}

/**
 * Get a module's installation hook
 * 
 * @param moduleId - The module ID to get the hook for
 * @returns The hook if registered, undefined otherwise
 */
export function getModuleHook(moduleId: string): ModuleInstallationHook | undefined {
  return moduleHooks.get(moduleId);
}

/**
 * Check if a module has a registered hook
 * 
 * @param moduleId - The module ID to check
 * @returns True if the module has a registered hook
 */
export function hasModuleHook(moduleId: string): boolean {
  return moduleHooks.has(moduleId);
}

/**
 * Get all registered module IDs
 * 
 * @returns Array of module IDs with registered hooks
 */
export function getRegisteredModuleIds(): string[] {
  return Array.from(moduleHooks.keys());
}

// ============================================================================
// HOOK EXECUTION
// ============================================================================

/**
 * Execute a module's installation hook
 * 
 * @param moduleId - The module ID
 * @param siteId - The site ID where module is being installed
 * @param settings - Optional initial settings
 * @param options - Optional execution options
 * @returns The hook result, or a "no hook" result if no hook is registered
 */
export async function executeInstallHook(
  moduleId: string,
  siteId: string,
  settings?: Record<string, unknown>,
  options?: HookExecutionOptions
): Promise<InstallHookResult> {
  const hook = moduleHooks.get(moduleId);
  
  if (!hook) {
    console.log(
      `[ModuleHooksRegistry] No hook registered for module: ${moduleId}, skipping`
    );
    return {
      success: true,
      metadata: { noHookRegistered: true },
    };
  }
  
  console.log(
    `[ModuleHooksRegistry] Executing install hook for module: ${moduleId} on site: ${siteId}`
  );
  
  try {
    // Merge options with settings if needed
    const mergedSettings = options?.customData
      ? { ...settings, __hookOptions: options }
      : settings;
    
    const result = await hook.onInstall(siteId, mergedSettings);
    
    console.log(
      `[ModuleHooksRegistry] Install hook completed for ${moduleId}:`,
      {
        success: result.success,
        pagesCreated: result.pagesCreated?.length || 0,
        navItemsAdded: result.navItemsAdded?.length || 0,
        errors: result.errors?.length || 0,
      }
    );
    
    return result;
  } catch (error) {
    console.error(
      `[ModuleHooksRegistry] Install hook failed for ${moduleId}:`,
      error
    );
    
    return {
      success: false,
      errors: [
        error instanceof Error
          ? error.message
          : 'Unknown error during hook execution',
      ],
    };
  }
}

/**
 * Execute a module's uninstallation hook
 * 
 * @param moduleId - The module ID
 * @param siteId - The site ID where module is being uninstalled
 * @returns The hook result, or a "no hook" result if no hook is registered
 */
export async function executeUninstallHook(
  moduleId: string,
  siteId: string
): Promise<UninstallHookResult> {
  const hook = moduleHooks.get(moduleId);
  
  if (!hook) {
    console.log(
      `[ModuleHooksRegistry] No hook registered for module: ${moduleId}, skipping uninstall hook`
    );
    return {
      success: true,
      metadata: { noHookRegistered: true },
    };
  }
  
  console.log(
    `[ModuleHooksRegistry] Executing uninstall hook for module: ${moduleId} on site: ${siteId}`
  );
  
  try {
    const result = await hook.onUninstall(siteId);
    
    console.log(
      `[ModuleHooksRegistry] Uninstall hook completed for ${moduleId}:`,
      {
        success: result.success,
        pagesRemoved: result.pagesRemoved?.length || 0,
        navItemsRemoved: result.navItemsRemoved?.length || 0,
        errors: result.errors?.length || 0,
      }
    );
    
    return result;
  } catch (error) {
    console.error(
      `[ModuleHooksRegistry] Uninstall hook failed for ${moduleId}:`,
      error
    );
    
    return {
      success: false,
      errors: [
        error instanceof Error
          ? error.message
          : 'Unknown error during hook execution',
      ],
    };
  }
}

/**
 * Execute a module's enable hook
 * 
 * @param moduleId - The module ID
 * @param siteId - The site ID where module is being enabled
 */
export async function executeEnableHook(
  moduleId: string,
  siteId: string
): Promise<void> {
  const hook = moduleHooks.get(moduleId);
  
  if (!hook?.onEnable) {
    return;
  }
  
  console.log(
    `[ModuleHooksRegistry] Executing enable hook for module: ${moduleId} on site: ${siteId}`
  );
  
  try {
    await hook.onEnable(siteId);
    console.log(`[ModuleHooksRegistry] Enable hook completed for ${moduleId}`);
  } catch (error) {
    console.error(
      `[ModuleHooksRegistry] Enable hook failed for ${moduleId}:`,
      error
    );
    throw error;
  }
}

/**
 * Execute a module's disable hook
 * 
 * @param moduleId - The module ID
 * @param siteId - The site ID where module is being disabled
 */
export async function executeDisableHook(
  moduleId: string,
  siteId: string
): Promise<void> {
  const hook = moduleHooks.get(moduleId);
  
  if (!hook?.onDisable) {
    return;
  }
  
  console.log(
    `[ModuleHooksRegistry] Executing disable hook for module: ${moduleId} on site: ${siteId}`
  );
  
  try {
    await hook.onDisable(siteId);
    console.log(`[ModuleHooksRegistry] Disable hook completed for ${moduleId}`);
  } catch (error) {
    console.error(
      `[ModuleHooksRegistry] Disable hook failed for ${moduleId}:`,
      error
    );
    throw error;
  }
}

// ============================================================================
// AUTO-REGISTRATION
// ============================================================================

/**
 * Initialize all module hooks
 * 
 * This function imports and registers all known module hooks.
 * Call this during application startup.
 */
export async function initializeModuleHooks(): Promise<void> {
  console.log('[ModuleHooksRegistry] Initializing module hooks...');
  
  try {
    // Import e-commerce hook
    const { ecommerceInstallationHook } = await import(
      '@/modules/ecommerce/hooks/installation-hook'
    );
    registerModuleHook(ecommerceInstallationHook);
    
    // Future modules can be added here:
    // const { crmInstallationHook } = await import('@/modules/crm/hooks/installation-hook');
    // registerModuleHook(crmInstallationHook);
    
    console.log(
      `[ModuleHooksRegistry] Initialized ${moduleHooks.size} module hooks`
    );
  } catch (error) {
    console.error('[ModuleHooksRegistry] Failed to initialize hooks:', error);
    // Don't throw - hooks are optional
  }
}
```

---

### Task 50.3: Create Hooks Index Export

**File**: `src/lib/modules/hooks/index.ts`
**Action**: Create

**Description**: Export all hooks functionality from a single entry point.

```typescript
/**
 * Module Hooks System
 * 
 * PHASE-ECOM-50: Module Installation Hook System
 * 
 * Central exports for the module hooks system.
 */

// Types
export type {
  ModuleInstallationHook,
  InstallHookResult,
  UninstallHookResult,
  HookExecutionOptions,
  PageTemplate,
  StudioPageTemplate,
  StudioComponentTemplate,
  NavigationItemTemplate,
  SampleDataDefinition,
} from './types';

// Registry functions
export {
  registerModuleHook,
  unregisterModuleHook,
  getModuleHook,
  hasModuleHook,
  getRegisteredModuleIds,
  executeInstallHook,
  executeUninstallHook,
  executeEnableHook,
  executeDisableHook,
  initializeModuleHooks,
} from './module-hooks-registry';
```

---

### Task 50.4: Create E-Commerce Installation Hook

**File**: `src/modules/ecommerce/hooks/installation-hook.ts`
**Action**: Create

**Description**: Create the e-commerce specific installation hook that auto-configures sites.

```typescript
/**
 * E-Commerce Module Installation Hook
 * 
 * PHASE-ECOM-50: Module Installation Hook System
 * 
 * Handles automatic site configuration when the e-commerce module
 * is installed, including page creation, navigation setup, and
 * default settings application.
 */

import type {
  ModuleInstallationHook,
  InstallHookResult,
  UninstallHookResult,
} from '@/lib/modules/hooks/types';
import { createEcommercePages, deletePagesCreatedByModule } from '../actions/auto-setup-actions';
import { addEcommerceNavigation, removeEcommerceNavigation } from '../actions/auto-setup-actions';
import { applyDefaultEcommerceSettings, clearEcommerceSetupData } from '../actions/auto-setup-actions';

// ============================================================================
// E-COMMERCE INSTALLATION HOOK
// ============================================================================

/**
 * E-commerce module installation hook
 * 
 * When the e-commerce module is installed on a site, this hook:
 * 1. Creates default e-commerce pages (Shop, Cart, Checkout, etc.)
 * 2. Adds navigation items (Shop link, Cart icon)
 * 3. Applies default store settings
 * 4. Optionally creates sample data for demo purposes
 */
export const ecommerceInstallationHook: ModuleInstallationHook = {
  moduleId: 'ecommerce',
  
  /**
   * Handle module installation
   */
  async onInstall(
    siteId: string,
    settings?: Record<string, unknown>
  ): Promise<InstallHookResult> {
    console.log(`[EcommerceHook] Installing e-commerce on site: ${siteId}`);
    
    const result: InstallHookResult = {
      success: true,
      pagesCreated: [],
      navItemsAdded: [],
      settingsApplied: {},
      errors: [],
    };
    
    // Extract hook options if provided
    const hookOptions = settings?.__hookOptions as {
      skipPageCreation?: boolean;
      skipNavigation?: boolean;
      skipSettings?: boolean;
      includeSampleData?: boolean;
    } | undefined;
    
    // 1. Create default e-commerce pages
    if (!hookOptions?.skipPageCreation) {
      try {
        const pagesResult = await createEcommercePages(siteId);
        
        if (pagesResult.success) {
          result.pagesCreated = pagesResult.pages.map(p => p.slug);
          console.log(
            `[EcommerceHook] Created ${result.pagesCreated.length} pages`
          );
        } else {
          result.errors?.push(...(pagesResult.errors || ['Failed to create pages']));
        }
      } catch (error) {
        console.error('[EcommerceHook] Page creation failed:', error);
        result.errors?.push(
          error instanceof Error ? error.message : 'Page creation failed'
        );
      }
    }
    
    // 2. Add navigation items
    if (!hookOptions?.skipNavigation) {
      try {
        const navResult = await addEcommerceNavigation(siteId);
        
        if (navResult.success) {
          result.navItemsAdded = navResult.itemsAdded;
          console.log(
            `[EcommerceHook] Added ${result.navItemsAdded.length} nav items`
          );
        } else {
          result.errors?.push('Failed to add navigation items');
        }
      } catch (error) {
        console.error('[EcommerceHook] Navigation setup failed:', error);
        result.errors?.push(
          error instanceof Error ? error.message : 'Navigation setup failed'
        );
      }
    }
    
    // 3. Apply default settings
    if (!hookOptions?.skipSettings) {
      try {
        const settingsResult = await applyDefaultEcommerceSettings(siteId, settings);
        
        if (settingsResult.success) {
          result.settingsApplied = settingsResult.settings;
          console.log('[EcommerceHook] Applied default settings');
        } else {
          result.errors?.push('Failed to apply default settings');
        }
      } catch (error) {
        console.error('[EcommerceHook] Settings application failed:', error);
        result.errors?.push(
          error instanceof Error ? error.message : 'Settings application failed'
        );
      }
    }
    
    // 4. Create sample data if requested
    if (hookOptions?.includeSampleData) {
      try {
        // Sample data creation would go here
        // This is handled by the onboarding wizard in PHASE-ECOM-53
        console.log('[EcommerceHook] Sample data creation delegated to onboarding');
      } catch (error) {
        console.error('[EcommerceHook] Sample data creation failed:', error);
        // Non-critical, don't add to errors
      }
    }
    
    // Determine overall success
    // We consider it successful if at least pages or nav were set up
    const hasCreations = 
      (result.pagesCreated?.length || 0) > 0 ||
      (result.navItemsAdded?.length || 0) > 0;
    
    result.success = hasCreations || (result.errors?.length || 0) === 0;
    
    console.log(`[EcommerceHook] Installation complete:`, {
      success: result.success,
      pages: result.pagesCreated?.length,
      nav: result.navItemsAdded?.length,
      errors: result.errors?.length,
    });
    
    return result;
  },
  
  /**
   * Handle module uninstallation
   */
  async onUninstall(siteId: string): Promise<UninstallHookResult> {
    console.log(`[EcommerceHook] Uninstalling e-commerce from site: ${siteId}`);
    
    const result: UninstallHookResult = {
      success: true,
      pagesRemoved: [],
      navItemsRemoved: [],
      settingsCleaned: [],
      errors: [],
    };
    
    // 1. Remove or mark pages as orphaned
    try {
      const pagesResult = await deletePagesCreatedByModule(siteId, 'ecommerce');
      
      if (pagesResult.success) {
        result.pagesRemoved = pagesResult.pagesRemoved;
        console.log(
          `[EcommerceHook] Removed/orphaned ${result.pagesRemoved.length} pages`
        );
      } else {
        result.errors?.push(...(pagesResult.errors || ['Failed to remove pages']));
      }
    } catch (error) {
      console.error('[EcommerceHook] Page removal failed:', error);
      result.errors?.push(
        error instanceof Error ? error.message : 'Page removal failed'
      );
    }
    
    // 2. Remove navigation items
    try {
      const navResult = await removeEcommerceNavigation(siteId);
      
      if (navResult.success) {
        result.navItemsRemoved = navResult.itemsRemoved;
        console.log(
          `[EcommerceHook] Removed ${result.navItemsRemoved.length} nav items`
        );
      } else {
        result.errors?.push('Failed to remove navigation items');
      }
    } catch (error) {
      console.error('[EcommerceHook] Navigation cleanup failed:', error);
      result.errors?.push(
        error instanceof Error ? error.message : 'Navigation cleanup failed'
      );
    }
    
    // 3. Clean up setup data (but NOT product data)
    try {
      const cleanupResult = await clearEcommerceSetupData(siteId);
      
      if (cleanupResult.success) {
        result.settingsCleaned = cleanupResult.settingsCleaned;
        console.log('[EcommerceHook] Cleaned up setup data');
      }
    } catch (error) {
      console.error('[EcommerceHook] Setup data cleanup failed:', error);
      // Non-critical
    }
    
    // NOTE: We intentionally do NOT delete:
    // - Products
    // - Categories
    // - Orders
    // - Customers
    // - Quotes
    // These are user data and should only be deleted explicitly by the user
    
    result.success = (result.errors?.length || 0) === 0;
    
    console.log(`[EcommerceHook] Uninstallation complete:`, {
      success: result.success,
      pagesRemoved: result.pagesRemoved?.length,
      navRemoved: result.navItemsRemoved?.length,
      errors: result.errors?.length,
    });
    
    return result;
  },
  
  /**
   * Handle module enable
   */
  async onEnable(siteId: string): Promise<void> {
    console.log(`[EcommerceHook] Enabling e-commerce on site: ${siteId}`);
    
    // Re-add navigation items if they were removed
    try {
      await addEcommerceNavigation(siteId);
    } catch (error) {
      console.error('[EcommerceHook] Failed to restore navigation on enable:', error);
    }
  },
  
  /**
   * Handle module disable
   */
  async onDisable(siteId: string): Promise<void> {
    console.log(`[EcommerceHook] Disabling e-commerce on site: ${siteId}`);
    
    // Optionally hide navigation items
    // We don't remove pages since they might have SEO value
    try {
      await removeEcommerceNavigation(siteId);
    } catch (error) {
      console.error('[EcommerceHook] Failed to remove navigation on disable:', error);
    }
  },
};
```

---

### Task 50.5: Update E-Commerce Hooks Index

**File**: `src/modules/ecommerce/hooks/index.ts`
**Action**: Modify

**Description**: Add the installation hook export to the existing hooks index.

```typescript
/**
 * E-Commerce Module Hooks
 * 
 * Central exports for all e-commerce hooks.
 */

// ============================================================================
// STOREFRONT HOOKS (Existing - Waves 1-5)
// ============================================================================

export { useStorefrontProducts } from './useStorefrontProducts';
export { useStorefrontCart } from './useStorefrontCart';
export { useStorefrontCategories } from './useStorefrontCategories';
export { useStorefrontSearch } from './useStorefrontSearch';
export { useStorefrontWishlist } from './useStorefrontWishlist';
export { useCheckout } from './useCheckout';
export { useQuotations } from './useQuotations';
export { useRecentlyViewed } from './useRecentlyViewed';

// ============================================================================
// MOBILE HOOKS (Wave 4)
// ============================================================================

export { useMobile } from './useMobile';
export { useSwipeGesture } from './useSwipeGesture';
export { useHapticFeedback } from './useHapticFeedback';
export { useKeyboardVisible } from './useKeyboardVisible';

// ============================================================================
// FILTER & ANALYTICS HOOKS (Waves 3-5)
// ============================================================================

export { useProductFilters } from './useProductFilters';
export { useAnalytics } from './use-analytics';
export { useMarketing } from './use-marketing';
export { useIntegrations } from './use-integrations';

// ============================================================================
// INSTALLATION HOOK (Wave 6 - PHASE-ECOM-50)
// ============================================================================

export { ecommerceInstallationHook } from './installation-hook';
```

---

### Task 50.6: Modify Module Installation to Execute Hooks

**File**: `src/lib/modules/module-installation.ts`
**Action**: Modify

**Description**: Update the existing module installation functions to call hooks.

Find and replace the `installModuleOnSite` function (around lines 38-117):

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth/permissions";
import {
  executeInstallHook,
  executeUninstallHook,
  executeEnableHook,
  executeDisableHook,
} from './hooks';

// ============================================================
// TYPES
// ============================================================

export interface InstallModuleOnSiteParams {
  siteId: string;
  moduleId: string;
  initialSettings?: Record<string, unknown>;
}

export interface InstallResult {
  success: boolean;
  error?: string;
  installationId?: string;
  hookResult?: {
    pagesCreated?: string[];
    navItemsAdded?: string[];
    settingsApplied?: Record<string, unknown>;
  };
}

export interface UninstallResult {
  success: boolean;
  error?: string;
  hookResult?: {
    pagesRemoved?: string[];
    navItemsRemoved?: string[];
  };
}

export interface UpdateSettingsResult {
  success: boolean;
  error?: string;
}

// ============================================================
// INSTALL MODULE ON SITE
// ============================================================

/**
 * Install a module on a site.
 * Works for both catalog and studio modules.
 * 
 * This is a simplified installation for site-level modules that doesn't
 * require agency subscription checks (for free modules or direct installs).
 * 
 * PHASE-ECOM-50: Now executes installation hooks after successful installation.
 */
export async function installModuleOnSite(
  siteId: string,
  moduleId: string,
  initialSettings?: Record<string, unknown>
): Promise<InstallResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the site exists and user has access
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, agency_id, client_id")
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    return { success: false, error: "Site not found" };
  }

  // Verify the module exists and is available
  let moduleExists = false;
  let defaultSettings: Record<string, unknown> = {};
  let moduleName = "";

  // Check modules_v2 first (published marketplace modules)
  const { data: m2 } = await db
    .from("modules_v2")
    .select("id, default_settings, name, status")
    .eq("id", moduleId)
    .single();

  if (m2 && m2.status === "active") {
    moduleExists = true;
    defaultSettings = m2.default_settings || {};
    moduleName = m2.name;
  } else {
    // Check module_source (for testing/development modules)
    const { data: ms } = await db
      .from("module_source")
      .select("id, default_settings, name, status")
      .eq("id", moduleId)
      .single();

    if (ms && (ms.status === "published" || ms.status === "testing")) {
      moduleExists = true;
      defaultSettings = ms.default_settings || {};
      moduleName = ms.name;
    }
  }

  if (!moduleExists) {
    return { success: false, error: "Module not found or not available" };
  }

  // Check if already installed
  const { data: existing } = await db
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Module already installed on this site" };
  }

  // Merge default settings with initial settings
  const mergedSettings = { ...defaultSettings, ...initialSettings };

  // Install the module
  const { data: installation, error: installError } = await db
    .from("site_module_installations")
    .insert({
      site_id: siteId,
      module_id: moduleId,
      settings: mergedSettings,
      is_enabled: true,
      installed_at: new Date().toISOString(),
      installed_by: userId,
      enabled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (installError) {
    console.error("[ModuleInstallation] Install error:", installError);
    return { success: false, error: installError.message };
  }

  console.log(`[ModuleInstallation] Installed ${moduleName} on site ${siteId}`);

  // PHASE-ECOM-50: Execute installation hook
  let hookResult: InstallResult['hookResult'] = undefined;
  
  try {
    const hookResponse = await executeInstallHook(
      moduleId,
      siteId,
      mergedSettings
    );
    
    if (!hookResponse.success) {
      // Hook failed - log but don't rollback the installation
      // The user can manually set up pages/nav if needed
      console.warn(
        `[ModuleInstallation] Hook execution had errors for ${moduleName}:`,
        hookResponse.errors
      );
    }
    
    hookResult = {
      pagesCreated: hookResponse.pagesCreated,
      navItemsAdded: hookResponse.navItemsAdded,
      settingsApplied: hookResponse.settingsApplied,
    };
  } catch (hookError) {
    console.error(
      `[ModuleInstallation] Hook execution failed for ${moduleName}:`,
      hookError
    );
    // Don't fail the installation if hook fails
    // The core installation succeeded
  }

  return { 
    success: true, 
    installationId: installation.id,
    hookResult,
  };
}

// ============================================================
// UNINSTALL MODULE FROM SITE
// ============================================================

/**
 * Uninstall a module from a site.
 * 
 * PHASE-ECOM-50: Now executes uninstallation hooks before removal.
 */
export async function uninstallModuleFromSite(
  siteId: string,
  moduleId: string
): Promise<UninstallResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the installation exists
  const { data: installation, error: findError } = await db
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (findError || !installation) {
    return { success: false, error: "Installation not found" };
  }

  // PHASE-ECOM-50: Execute uninstallation hook BEFORE deletion
  let hookResult: UninstallResult['hookResult'] = undefined;
  
  try {
    const hookResponse = await executeUninstallHook(moduleId, siteId);
    
    if (!hookResponse.success) {
      console.warn(
        `[ModuleInstallation] Uninstall hook had errors for ${moduleId}:`,
        hookResponse.errors
      );
    }
    
    hookResult = {
      pagesRemoved: hookResponse.pagesRemoved,
      navItemsRemoved: hookResponse.navItemsRemoved,
    };
  } catch (hookError) {
    console.error(
      `[ModuleInstallation] Uninstall hook failed for ${moduleId}:`,
      hookError
    );
    // Continue with uninstallation even if hook fails
  }

  // Delete the installation
  const { error: deleteError } = await db
    .from("site_module_installations")
    .delete()
    .eq("id", installation.id);

  if (deleteError) {
    console.error("[ModuleInstallation] Uninstall error:", deleteError);
    return { success: false, error: deleteError.message };
  }

  console.log(`[ModuleInstallation] Uninstalled module ${moduleId} from site ${siteId}`);

  return { success: true, hookResult };
}

// ============================================================
// ENABLE/DISABLE MODULE
// ============================================================

/**
 * Enable a module on a site.
 * 
 * PHASE-ECOM-50: Now executes enable hooks.
 */
export async function enableModuleOnSite(
  siteId: string,
  moduleId: string
): Promise<UpdateSettingsResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await db
    .from("site_module_installations")
    .update({
      is_enabled: true,
      enabled_at: new Date().toISOString(),
    })
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Execute enable hook
  try {
    await executeEnableHook(moduleId, siteId);
  } catch (hookError) {
    console.error(`[ModuleInstallation] Enable hook failed:`, hookError);
  }

  return { success: true };
}

/**
 * Disable a module on a site.
 * 
 * PHASE-ECOM-50: Now executes disable hooks.
 */
export async function disableModuleOnSite(
  siteId: string,
  moduleId: string
): Promise<UpdateSettingsResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await db
    .from("site_module_installations")
    .update({
      is_enabled: false,
      disabled_at: new Date().toISOString(),
    })
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Execute disable hook
  try {
    await executeDisableHook(moduleId, siteId);
  } catch (hookError) {
    console.error(`[ModuleInstallation] Disable hook failed:`, hookError);
  }

  return { success: true };
}

// ============================================================
// UPDATE MODULE SETTINGS
// ============================================================

/**
 * Update module settings on a site.
 */
export async function updateModuleSettings(
  siteId: string,
  moduleId: string,
  settings: Record<string, unknown>
): Promise<UpdateSettingsResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Get current settings
  const { data: installation, error: findError } = await db
    .from("site_module_installations")
    .select("settings")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (findError || !installation) {
    return { success: false, error: "Installation not found" };
  }

  // Merge settings
  const mergedSettings = {
    ...(installation.settings || {}),
    ...settings,
  };

  const { error } = await db
    .from("site_module_installations")
    .update({
      settings: mergedSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================
// GET MODULE SETTINGS
// ============================================================

/**
 * Get module settings for a site.
 */
export async function getModuleSettings(
  siteId: string,
  moduleId: string
): Promise<{ success: boolean; settings?: Record<string, unknown>; error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("site_module_installations")
    .select("settings, is_enabled")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Module not installed on this site" };
  }

  return { 
    success: true, 
    settings: {
      ...data.settings,
      is_enabled: data.is_enabled,
    },
  };
}
```

---

## 🗄️ Database Migrations

No new database tables required for this phase. The hook system uses existing tables:
- `site_module_installations` - Already exists
- `pages` - Already exists
- `sites` - Already exists (for navigation settings)

---

## 🔧 Type Definitions

All types are defined in Task 50.1 (`src/lib/modules/hooks/types.ts`).

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors: `npx eslint src/lib/modules/hooks/`
- [ ] Hook registry tests:
  - [ ] Can register a hook
  - [ ] Can get registered hook
  - [ ] Can execute install hook
  - [ ] Can execute uninstall hook
- [ ] E-commerce hook tests:
  - [ ] Hook registers correctly on app startup
  - [ ] Install hook is called when module is installed
  - [ ] Uninstall hook is called when module is removed
- [ ] Integration test:
  - [ ] Install e-commerce module on a test site
  - [ ] Verify installation succeeds
  - [ ] Verify hookResult is returned with page/nav info

---

## 🔄 Rollback Plan

If issues occur:

1. **Revert hook integration in module-installation.ts**:
   - Remove hook execution calls
   - Return to original simple installation flow

2. **Keep hook registry files but don't call them**:
   - Files remain for future use
   - No impact on existing functionality

3. **Run TypeScript check**:
   ```bash
   npx tsc --noEmit
   ```

4. **Test module installation**:
   - Verify modules can still be installed without hooks
   - Verify existing sites are unaffected

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add PHASE-ECOM-50 completion note
- `progress.md`: Update Wave 6 section with completion status

---

## ✨ Success Criteria

- [ ] Hook type definitions are complete and exported
- [ ] Hook registry supports register, get, execute operations
- [ ] E-commerce hook is registered on app initialization
- [ ] Module installation calls install hook after DB insert
- [ ] Module uninstallation calls uninstall hook before DB delete
- [ ] Enable/disable operations call respective hooks
- [ ] Hook errors are logged but don't fail the core operation
- [ ] All TypeScript compiles without errors
- [ ] Hook results are included in installation response

---

## 📚 Related Phases

- **PHASE-ECOM-51**: Auto-Page Generation & Templates (creates the pages)
- **PHASE-ECOM-52**: Navigation & Widget Auto-Setup (adds nav items)
- **PHASE-ECOM-53**: Onboarding Wizard & Configuration (guides first-time setup)

This phase creates the hook infrastructure that the subsequent phases will utilize.
