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
  
  // Register module components as built-in fallbacks
  // This ensures booking/ecommerce components always render on public sites
  // even if site_module_installations has no rows for the site.
  // When loadModuleComponents() runs later with actual module data, it will
  // simply overwrite these entries (componentRegistry.register uses Map.set).
  registerBuiltInModuleComponents();
  
  initialized = true;
  console.log("[Studio] Registry initialized with core, premium, and built-in module components");
}

/**
 * Register built-in module components (booking, ecommerce) as fallbacks.
 * These render on public sites without requiring site_module_installations rows.
 */
function registerBuiltInModuleComponents(): void {
  try {
    // Booking module components
    const bookingStudio = require("@/modules/booking/studio");
    if (bookingStudio?.studioComponents) {
      const { componentRegistry: registry } = require("./component-registry");
      let count = 0;
      for (const [_key, def] of Object.entries(bookingStudio.studioComponents)) {
        const compDef = def as import("@/types/studio").ComponentDefinition;
        if (compDef?.type && compDef?.render) {
          registry.register(compDef, "module", "built-in-booking");
          count++;
        }
      }
      console.log(`[Studio] Registered ${count} booking module components as built-in`);
    }
  } catch (e) {
    console.debug("[Studio] Booking module not available for built-in registration:", (e as Error).message);
  }

  try {
    // E-commerce module components
    const ecomStudio = require("@/modules/ecommerce/studio");
    if (ecomStudio?.studioComponents) {
      const { componentRegistry: registry } = require("./component-registry");
      let count = 0;
      for (const [_key, def] of Object.entries(ecomStudio.studioComponents)) {
        const compDef = def as import("@/types/studio").ComponentDefinition;
        if (compDef?.type && compDef?.render) {
          registry.register(compDef, "module", "built-in-ecommerce");
          count++;
        }
      }
      console.log(`[Studio] Registered ${count} ecommerce module components as built-in`);
    }
  } catch (e) {
    console.debug("[Studio] Ecommerce module not available for built-in registration:", (e as Error).message);
  }
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
