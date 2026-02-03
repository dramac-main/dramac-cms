/**
 * DRAMAC Studio Module Component Loader
 * 
 * Dynamically loads Studio components from installed modules.
 * Handles registration, unregistration, and reloading of module components.
 */

import type React from "react";
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
 * 
 * Each import returns ModuleStudioExports or empty object on failure.
 */
const MODULE_IMPORTS: Record<string, () => Promise<ModuleStudioExports>> = {
  ecommerce: () => 
    import("@/modules/ecommerce/studio")
      .then(m => m as ModuleStudioExports)
      .catch((e) => {
        console.debug("[ModuleLoader] E-Commerce studio not found:", e.message);
        return {};
      }),
  booking: () => 
    import("@/modules/booking/studio")
      .then(m => m as ModuleStudioExports)
      .catch((e) => {
        console.debug("[ModuleLoader] Booking studio not found:", e.message);
        return {};
      }),
  crm: () => 
    import("@/modules/crm/studio")
      .then(m => m as ModuleStudioExports)
      .catch((e) => {
        console.debug("[ModuleLoader] CRM studio not found:", e.message);
        return {};
      }),
  automation: () => 
    import("@/modules/automation/studio")
      .then(m => m as ModuleStudioExports)
      .catch((e) => {
        console.debug("[ModuleLoader] Automation studio not found:", e.message);
        return {};
      }),
  "social-media": () => 
    import("@/modules/social-media/studio")
      .then(m => m as ModuleStudioExports)
      .catch((e) => {
        console.debug("[ModuleLoader] Social Media studio not found:", e.message);
        return {};
      }),
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

/**
 * Reset loader state
 */
export function resetModuleLoaderState(): void {
  loaderState = {
    isLoading: false,
    loadedModules: [],
    failedModules: {},
    lastLoadTime: null,
  };
}

// =============================================================================
// MAIN LOADER FUNCTION
// =============================================================================

/**
 * Load Studio components from installed modules
 * 
 * @param modules - List of installed modules for the site
 * @returns Object containing loaded components, fields, and status
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
    loadedModules: [...loaderState.loadedModules], // Keep existing
    failedModules: { ...loaderState.failedModules },
    lastLoadTime: null,
  };

  const allComponents: ComponentDefinition[] = [];
  const allFields: Record<string, CustomFieldEditor> = {};
  const loaded: string[] = [];
  const failed: Record<string, string> = {};

  for (const moduleInfo of modules) {
    // Skip already loaded modules
    if (loaderState.loadedModules.includes(moduleInfo.id)) {
      console.debug(`[ModuleLoader] Module already loaded: ${moduleInfo.slug}`);
      continue;
    }

    // Skip inactive modules
    if (moduleInfo.status !== "active") {
      console.debug(`[ModuleLoader] Skipping inactive module: ${moduleInfo.slug}`);
      continue;
    }

    // Skip if module doesn't have Studio components flag
    if (moduleInfo.hasStudioComponents === false) {
      console.debug(`[ModuleLoader] Module ${moduleInfo.slug} has no Studio components`);
      continue;
    }

    try {
      // Check if we have a registered import for this module
      const importFn = MODULE_IMPORTS[moduleInfo.slug];
      
      if (!importFn) {
        console.debug(`[ModuleLoader] No import registered for module: ${moduleInfo.slug}`);
        continue;
      }

      // Dynamic import
      const exports = await importFn();

      // Check if exports are empty (module doesn't have studio exports yet)
      if (!exports.studioComponents && !exports.studioFields) {
        console.debug(`[ModuleLoader] Module ${moduleInfo.slug} has no studio exports`);
        continue;
      }

      // Process studio components
      if (exports.studioComponents) {
        const componentDefs = processModuleComponents(
          exports.studioComponents,
          moduleInfo
        );
        allComponents.push(...componentDefs);
        
        // Register each component
        for (const def of componentDefs) {
          componentRegistry.register(def, "module", moduleInfo.id);
        }
      }

      // Process custom fields
      if (exports.studioFields) {
        for (const [fieldType, editor] of Object.entries(exports.studioFields)) {
          // Prefix with module slug to avoid collisions
          const prefixedType = `${moduleInfo.slug}:${fieldType}`;
          allFields[prefixedType] = editor;
          // Cast to ComponentType since our CustomFieldEditor is compatible
          fieldRegistry.registerCustomRenderer(prefixedType, editor as React.ComponentType<import("@/types/studio").FieldRenderProps>);
        }
      }

      loaded.push(moduleInfo.id);
      console.log(
        `[ModuleLoader] Loaded module: ${moduleInfo.name} (${
          Object.keys(exports.studioComponents || {}).length
        } components, ${Object.keys(exports.studioFields || {}).length} fields)`
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failed[moduleInfo.id] = message;
      console.warn(`[ModuleLoader] Failed to load module ${moduleInfo.slug}:`, message);
    }
  }

  // Update loader state
  loaderState = {
    isLoading: false,
    loadedModules: [...loaderState.loadedModules, ...loaded],
    failedModules: { ...loaderState.failedModules, ...failed },
    lastLoadTime: Date.now(),
  };

  return {
    components: allComponents,
    fields: allFields,
    loaded,
    failed,
  };
}

// =============================================================================
// PROCESS MODULE COMPONENTS
// =============================================================================

/**
 * Process module component definitions
 * 
 * Adds module metadata and validates definitions.
 */
function processModuleComponents(
  components: Record<string, Omit<ComponentDefinition, "module">>,
  moduleInfo: InstalledModuleInfo
): ComponentDefinition[] {
  const processed: ComponentDefinition[] = [];

  for (const [key, def] of Object.entries(components)) {
    // Validate required fields
    if (!def.type || !def.label || !def.render) {
      console.warn(`[ModuleLoader] Invalid component definition: ${key} in ${moduleInfo.slug}`);
      continue;
    }

    // Map module category to component category
    const category = mapModuleCategory(moduleInfo.category, def.category);

    // Add module metadata
    const fullDef: ComponentDefinition = {
      ...def,
      category,
      // Add module source
      module: {
        id: moduleInfo.id,
        name: moduleInfo.name,
        icon: moduleInfo.icon,
      },
      // Add search keywords including module name
      keywords: [
        ...(def.keywords || []),
        moduleInfo.name.toLowerCase(),
        moduleInfo.slug,
      ],
    };

    processed.push(fullDef);
  }

  return processed;
}

/**
 * Map module category to component category
 */
function mapModuleCategory(
  moduleCategory: string | undefined,
  componentCategory: string | undefined
): ComponentDefinition["category"] {
  // If component specifies its category, use it
  if (componentCategory) {
    return componentCategory as ComponentDefinition["category"];
  }
  
  // Map module categories to component categories
  const categoryMap: Record<string, ComponentDefinition["category"]> = {
    "e-commerce": "ecommerce",
    "ecommerce": "ecommerce",
    "booking": "interactive",
    "crm": "forms",
    "automation": "interactive",
    "social": "marketing",
    "social-media": "marketing",
  };
  
  return categoryMap[moduleCategory || ""] || "module";
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
    failedModules: Object.fromEntries(
      Object.entries(loaderState.failedModules).filter(([id]) => id !== moduleId)
    ),
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

/**
 * Check if a module import is registered
 */
export function hasModuleImport(slug: string): boolean {
  return slug in MODULE_IMPORTS;
}

/**
 * Get list of registered module import slugs
 */
export function getRegisteredModuleSlugs(): string[] {
  return Object.keys(MODULE_IMPORTS);
}
