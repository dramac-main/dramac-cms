/**
 * Module Hooks Initialization
 * 
 * PHASE-ECOM-50: Module Installation Hook System
 * 
 * Registers all module installation hooks on server startup.
 * This should be imported by the main application to ensure hooks are ready.
 */

import { registerModuleHook } from './module-hooks-registry';
import { ecommerceInstallationHook } from '@/modules/ecommerce/hooks/installation-hook';

// Track initialization state
let initialized = false;

/**
 * Initialize all module hooks
 * 
 * This function registers all module installation hooks.
 * It's idempotent - calling it multiple times has no additional effect.
 */
export function initializeModuleHooks(): void {
  if (initialized) {
    return;
  }

  console.log('[ModuleHooks] Initializing module hooks...');

  // Register e-commerce module hook (the hook contains its own moduleId)
  registerModuleHook(ecommerceInstallationHook);

  // Future: Register other module hooks here
  // registerModuleHook(blogInstallationHook);
  // registerModuleHook(crmInstallationHook);

  initialized = true;
  console.log('[ModuleHooks] Module hooks initialized');
}

/**
 * Check if hooks are initialized
 */
export function areHooksInitialized(): boolean {
  return initialized;
}

// Auto-initialize when module is imported (for server environments)
// This ensures hooks are registered before any installation happens
if (typeof window === 'undefined') {
  // We're on the server, initialize hooks
  initializeModuleHooks();
}
