/**
 * DRAMAC Studio Component Registry
 * 
 * Central exports for the component registry system.
 */

export {
  componentRegistry,
  defineComponent,
  registerComponent,
  getComponent,
  CATEGORIES,
  type ComponentRegistryEntry,
  type CategoryInfo,
} from "./component-registry";

export {
  fieldRegistry,
  commonFields,
  presetOptions,
  validateNumber,
  validateText,
  type FieldTypeDefinition,
} from "./field-registry";

export { registerCoreComponents } from "./core-components";

export {
  registerPremiumComponents,
  getPremiumComponents,
  getPremiumComponentTypes,
} from "./premium-components";

export {
  getInstalledModulesForSite,
  isModuleInstalled,
  getModuleInfo,
} from "./module-discovery";

export {
  loadModuleComponents,
  unloadModuleComponents,
  reloadModuleComponents,
  getModuleLoaderState,
  resetModuleLoaderState,
  hasModuleImport,
} from "./module-loader";

export * from "./hooks";

// =============================================================================
// INITIALIZATION
// =============================================================================

let initialized = false;

/**
 * Initialize the Studio component registry
 * Call this once at app startup
 */
export function initializeRegistry(): void {
  if (initialized) {
    console.warn("[Studio] Registry already initialized");
    return;
  }

  // Import dynamically to avoid circular dependencies
  const { registerCoreComponents } = require("./core-components");
  const { registerPremiumComponents } = require("./premium-components");
  
  registerCoreComponents();
  registerPremiumComponents();
  
  initialized = true;
  console.log("[Studio] Registry initialized with core and premium components");
}

/**
 * Check if registry is initialized
 */
export function isRegistryInitialized(): boolean {
  return initialized;
}

/**
 * Reset registry (for testing)
 */
export function resetRegistry(): void {
  initialized = false;
}
