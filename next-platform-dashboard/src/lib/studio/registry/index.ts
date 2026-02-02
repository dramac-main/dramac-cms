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
  registerCoreComponents();
  
  initialized = true;
  console.log("[Studio] Registry initialized");
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
