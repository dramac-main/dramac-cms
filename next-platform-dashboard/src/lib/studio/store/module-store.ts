/**
 * DRAMAC Studio Module Store
 * 
 * Zustand store for module component loading state.
 * Manages module discovery, loading, and real-time sync.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { InstalledModuleInfo, ModuleLoaderState } from "@/types/studio-module";
import { 
  loadModuleComponents, 
  unloadModuleComponents,
  getModuleLoaderState,
  resetModuleLoaderState,
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
  
  /** Get active categories */
  getActiveCategories: () => ReturnType<typeof componentRegistry.getActiveCategories>;
  
  /** Search components */
  searchComponents: (query: string) => ReturnType<typeof componentRegistry.search>;
}

export type ModuleStore = ModuleStoreState & ModuleStoreActions;

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

        console.log(
          `[ModuleStore] Initialized with ${result.loaded.length} modules, ` +
          `${result.components.length} components`
        );

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
        // Reset loader state
        resetModuleLoaderState();
        
        // Unload all current modules
        for (const moduleId of get().loader.loadedModules) {
          unloadModuleComponents(moduleId);
        }

        // Fetch fresh module list
        const modules = await getInstalledModulesForSite(siteId);

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
      // Check if already installed
      if (get().installedModules.some(m => m.id === module.id)) {
        console.debug("[ModuleStore] Module already in list:", module.slug);
        return;
      }

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
      
      // Reset loader state
      resetModuleLoaderState();
      
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

    getActiveCategories: () => {
      return componentRegistry.getActiveCategories();
    },

    searchComponents: (query: string) => {
      return componentRegistry.search(query);
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
export const selectLoadedModules = (state: ModuleStore) => state.loader.loadedModules;
export const selectModuleSiteId = (state: ModuleStore) => state.siteId;
