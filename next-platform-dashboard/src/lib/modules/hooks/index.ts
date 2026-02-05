/**
 * Module Hooks System
 * 
 * PHASE-ECOM-50: Module Installation Hook System
 * 
 * Central exports for the module hooks system.
 */

// ============================================================================
// HOOK RENDERING (Existing)
// ============================================================================

export {
  ModuleHookRenderer,
  ModuleSlot,
  FilteredContent,
  useExecuteHook,
  useModulesWithHook,
  useModuleAction,
  withModuleHook,
  applyFilters,
  doAction,
  type ModuleHookRendererProps,
  type HookExecutionResult,
  type ModuleSlotProps,
} from "./module-hook-renderer";

// ============================================================================
// INSTALLATION HOOKS (PHASE-ECOM-50)
// ============================================================================

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

// Initialization
export { initializeModuleHooks as initHooks, areHooksInitialized } from './init-hooks';
