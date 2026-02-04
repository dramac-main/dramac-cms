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
  KNOWN_MODULE_SLUGS,
  getModuleImportPath,
} from "./module-constants";

export {
  loadModuleComponents,
  unloadModuleComponents,
  reloadModuleComponents,
  getModuleLoaderState,
  resetModuleLoaderState,
  hasModuleImport,
} from "./module-loader";

// Phase STUDIO-30: Enhanced AI Configurations
export {
  AI_COMPONENT_CONFIGS,
  getAIConfig,
  getAvailableActions,
  getSuggestions,
  getActionableSuggestions,
  buildAIPrompt,
  hasAICapabilities,
  getAIEnabledComponentTypes,
  type AICapabilityLevel,
  type AIActionType,
  type AIActionConfig,
  type AISuggestion,
  type AIGenerationTemplate,
  type AIComponentConfig,
} from "./ai-configs";

// Phase STUDIO-30: Universal Props System
export {
  UNIVERSAL_FIELDS,
  UNIVERSAL_GROUPS,
  HOVER_EFFECTS,
  animationFieldOptions,
  hoverFieldOptions,
  delayFieldOptions,
  getUniversalClasses,
  getUniversalStyles,
  extractUniversalProps,
  hasUniversalProps,
  type UniversalProps,
  type HoverEffect,
} from "./universal-props";

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
