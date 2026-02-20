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
import { createClient } from '@/lib/supabase/server';

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

/**
 * Resolve a module ID (UUID or slug) to the hook-registered slug.
 * Hooks are registered by slug (e.g., 'ecommerce'), but module installations
 * use UUIDs. This resolves UUIDs to slugs by querying the database.
 */
async function resolveModuleSlug(moduleIdOrSlug: string): Promise<string> {
  // If it's already a slug that matches a registered hook, return as-is
  if (moduleHooks.has(moduleIdOrSlug)) {
    return moduleIdOrSlug;
  }
  
  // It's likely a UUID — look up the slug from the database
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    
    // Try modules_v2 first
    const { data: m2 } = await db
      .from('modules_v2')
      .select('slug')
      .eq('id', moduleIdOrSlug)
      .single();
    
    if (m2?.slug && moduleHooks.has(m2.slug)) {
      return m2.slug;
    }
    
    // Try module_source
    const { data: ms } = await db
      .from('module_source')
      .select('slug')
      .eq('id', moduleIdOrSlug)
      .single();
    
    if (ms?.slug && moduleHooks.has(ms.slug)) {
      return ms.slug;
    }
  } catch (err) {
    console.warn('[ModuleHooksRegistry] Failed to resolve module slug:', err);
  }
  
  return moduleIdOrSlug;
}

// ============================================================================
// HOOK EXECUTION
// ============================================================================

/**
 * Execute a module's installation hook
 * 
 * @param moduleId - The module ID (UUID or slug)
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
  // Resolve UUID to slug if needed
  const resolvedId = await resolveModuleSlug(moduleId);
  const hook = moduleHooks.get(resolvedId);
  
  if (!hook) {
    console.log(
      `[ModuleHooksRegistry] No hook registered for module: ${moduleId} (resolved: ${resolvedId}), skipping`
    );
    return {
      success: true,
      metadata: { noHookRegistered: true },
    };
  }
  
  console.log(
    `[ModuleHooksRegistry] Executing install hook for module: ${resolvedId} on site: ${siteId}`
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
  const resolvedId = await resolveModuleSlug(moduleId);
  const hook = moduleHooks.get(resolvedId);
  
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
 * Result from enable/disable hooks
 */
export interface ToggleHookResult {
  success: boolean;
  error?: string;
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
): Promise<ToggleHookResult> {
  const resolvedId = await resolveModuleSlug(moduleId);
  const hook = moduleHooks.get(resolvedId);
  
  if (!hook?.onEnable) {
    return { success: true };
  }
  
  console.log(
    `[ModuleHooksRegistry] Executing enable hook for module: ${moduleId} on site: ${siteId}`
  );
  
  try {
    await hook.onEnable(siteId);
    console.log(`[ModuleHooksRegistry] Enable hook completed for ${moduleId}`);
    return { success: true };
  } catch (error) {
    console.error(
      `[ModuleHooksRegistry] Enable hook failed for ${moduleId}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
): Promise<ToggleHookResult> {
  const resolvedId = await resolveModuleSlug(moduleId);
  const hook = moduleHooks.get(resolvedId);
  
  if (!hook?.onDisable) {
    return { success: true };
  }
  
  console.log(
    `[ModuleHooksRegistry] Executing disable hook for module: ${moduleId} on site: ${siteId}`
  );
  
  try {
    await hook.onDisable(siteId);
    console.log(`[ModuleHooksRegistry] Disable hook completed for ${moduleId}`);
    return { success: true };
  } catch (error) {
    console.error(
      `[ModuleHooksRegistry] Disable hook failed for ${moduleId}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
