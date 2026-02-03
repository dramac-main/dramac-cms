/**
 * DRAMAC Studio Symbol Store
 * 
 * Zustand store for managing reusable component symbols.
 * Handles CRUD operations, search, and instance management.
 * 
 * Phase: STUDIO-25 Symbols & Reusable Components
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type {
  StudioSymbol,
  SymbolInstance,
  SymbolOverrides,
  CreateSymbolData,
  UpdateSymbolData,
  SymbolSyncStatus,
} from '@/types/studio-symbols';
import type { StudioComponent } from '@/types/studio';
import { generateComponentId } from '../utils';

// =============================================================================
// TYPES
// =============================================================================

export interface SymbolState {
  /** All available symbols */
  symbols: StudioSymbol[];
  
  /** Currently selected symbol (for editing) */
  selectedSymbolId: string | null;
  
  /** Search query */
  searchQuery: string;
  
  /** Active category filter */
  categoryFilter: string | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Symbol instances on current page (tracked for sync) */
  pageInstances: Map<string, SymbolInstance>;
}

export interface SymbolActions {
  // CRUD Operations
  createSymbol: (data: CreateSymbolData) => StudioSymbol;
  updateSymbol: (symbolId: string, data: UpdateSymbolData) => void;
  deleteSymbol: (symbolId: string) => void;
  duplicateSymbol: (symbolId: string, newName: string) => StudioSymbol | null;
  
  // Symbol retrieval
  getSymbol: (symbolId: string) => StudioSymbol | undefined;
  getSymbolsByCategory: (category: string) => StudioSymbol[];
  getFilteredSymbols: () => StudioSymbol[];
  
  // Search & Filter
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  setSelectedSymbol: (symbolId: string | null) => void;
  
  // Instance management
  createInstance: (symbolId: string) => SymbolInstance | null;
  updateInstanceOverrides: (instanceId: string, overrides: Partial<SymbolOverrides>) => void;
  detachInstance: (instanceId: string) => StudioComponent[] | null;
  syncInstance: (instanceId: string) => void;
  checkSyncStatus: (instanceId: string) => SymbolSyncStatus | null;
  
  // Page instance tracking
  registerPageInstance: (instance: SymbolInstance) => void;
  unregisterPageInstance: (instanceId: string) => void;
  clearPageInstances: () => void;
  getPageInstances: () => SymbolInstance[];
  
  // Bulk operations
  syncAllInstances: () => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Import/Export
  importSymbols: (symbols: StudioSymbol[]) => void;
  exportSymbols: (symbolIds?: string[]) => StudioSymbol[];
}

export type SymbolStore = SymbolState & SymbolActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: SymbolState = {
  symbols: [],
  selectedSymbolId: null,
  searchQuery: '',
  categoryFilter: null,
  isLoading: false,
  error: null,
  pageInstances: new Map(),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique symbol ID
 */
function generateSymbolId(): string {
  return `symbol-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a unique instance ID
 */
function generateInstanceId(): string {
  return `instance-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Deep clone components with new IDs
 */
function cloneComponentsWithNewIds(
  components: StudioComponent[],
  idMap: Map<string, string> = new Map()
): { components: StudioComponent[]; idMap: Map<string, string> } {
  // First pass: generate new IDs
  for (const component of components) {
    idMap.set(component.id, generateComponentId());
  }
  
  // Second pass: clone with new IDs and fixed references
  const cloned = components.map((component) => {
    const newId = idMap.get(component.id)!;
    return {
      ...component,
      id: newId,
      parentId: component.parentId ? idMap.get(component.parentId) : undefined,
      children: component.children?.map((childId) => idMap.get(childId) ?? childId),
    };
  });
  
  return { components: cloned, idMap };
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useSymbolStore = create<SymbolStore>()(
  persist(
    immer((set, get) => ({
      // State
      ...initialState,

      // -------------------------------------------------------------------------
      // CRUD OPERATIONS
      // -------------------------------------------------------------------------

      createSymbol: (data) => {
        const symbolId = generateSymbolId();
        const now = new Date().toISOString();
        
        // Find root component (component without parent)
        const rootComponent = data.components.find((c) => !c.parentId);
        
        const symbol: StudioSymbol = {
          id: symbolId,
          name: data.name,
          description: data.description,
          category: data.category,
          tags: data.tags || [],
          components: data.components,
          rootComponentId: rootComponent?.id || data.components[0]?.id || '',
          version: 1,
          createdAt: now,
          updatedAt: now,
          isGlobal: data.isGlobal ?? false,
          siteId: data.siteId,
        };
        
        set((state) => {
          state.symbols.push(symbol);
        });
        
        return symbol;
      },

      updateSymbol: (symbolId, data) => {
        set((state) => {
          const index = state.symbols.findIndex((s) => s.id === symbolId);
          if (index !== -1) {
            const symbol = state.symbols[index];
            Object.assign(symbol, {
              ...data,
              version: symbol.version + 1,
              updatedAt: new Date().toISOString(),
            });
            
            // If components were updated, find new root
            if (data.components) {
              const rootComponent = data.components.find((c) => !c.parentId);
              symbol.rootComponentId = rootComponent?.id || data.components[0]?.id || '';
            }
          }
        });
      },

      deleteSymbol: (symbolId) => {
        set((state) => {
          state.symbols = state.symbols.filter((s) => s.id !== symbolId);
          if (state.selectedSymbolId === symbolId) {
            state.selectedSymbolId = null;
          }
        });
      },

      duplicateSymbol: (symbolId, newName) => {
        const original = get().getSymbol(symbolId);
        if (!original) return null;
        
        // Clone components with new IDs
        const { components } = cloneComponentsWithNewIds(original.components);
        
        // Create new symbol
        return get().createSymbol({
          name: newName,
          description: original.description,
          category: original.category,
          tags: [...original.tags],
          components,
          isGlobal: original.isGlobal,
          siteId: original.siteId,
        });
      },

      // -------------------------------------------------------------------------
      // SYMBOL RETRIEVAL
      // -------------------------------------------------------------------------

      getSymbol: (symbolId) => {
        return get().symbols.find((s) => s.id === symbolId);
      },

      getSymbolsByCategory: (category) => {
        return get().symbols.filter((s) => s.category === category);
      },

      getFilteredSymbols: () => {
        const { symbols, searchQuery, categoryFilter } = get();
        
        let result = symbols;
        
        // Apply category filter
        if (categoryFilter) {
          result = result.filter((s) => s.category === categoryFilter);
        }
        
        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          result = result.filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              s.description?.toLowerCase().includes(query) ||
              s.tags.some((tag) => tag.toLowerCase().includes(query))
          );
        }
        
        return result;
      },

      // -------------------------------------------------------------------------
      // SEARCH & FILTER
      // -------------------------------------------------------------------------

      setSearchQuery: (query) => {
        set((state) => {
          state.searchQuery = query;
        });
      },

      setCategoryFilter: (category) => {
        set((state) => {
          state.categoryFilter = category;
        });
      },

      setSelectedSymbol: (symbolId) => {
        set((state) => {
          state.selectedSymbolId = symbolId;
        });
      },

      // -------------------------------------------------------------------------
      // INSTANCE MANAGEMENT
      // -------------------------------------------------------------------------

      createInstance: (symbolId) => {
        const symbol = get().getSymbol(symbolId);
        if (!symbol) return null;
        
        const instance: SymbolInstance = {
          id: generateInstanceId(),
          symbolId,
          overrides: { props: {} },
          syncedVersion: symbol.version,
          isDetached: false,
        };
        
        return instance;
      },

      updateInstanceOverrides: (instanceId, overrides) => {
        set((state) => {
          const instance = state.pageInstances.get(instanceId);
          if (instance) {
            instance.overrides = {
              props: {
                ...instance.overrides.props,
                ...overrides.props,
              },
              styles: {
                ...instance.overrides.styles,
                ...overrides.styles,
              },
              visibility: {
                ...instance.overrides.visibility,
                ...overrides.visibility,
              },
            };
          }
        });
      },

      detachInstance: (instanceId) => {
        const { pageInstances, symbols } = get();
        const instance = pageInstances.get(instanceId);
        if (!instance) return null;
        
        const symbol = symbols.find((s) => s.id === instance.symbolId);
        if (!symbol) return null;
        
        // Clone the symbol's components with new IDs
        const { components } = cloneComponentsWithNewIds(symbol.components);
        
        // Mark instance as detached
        set((state) => {
          const inst = state.pageInstances.get(instanceId);
          if (inst) {
            inst.isDetached = true;
          }
        });
        
        return components;
      },

      syncInstance: (instanceId) => {
        set((state) => {
          const instance = state.pageInstances.get(instanceId);
          if (instance) {
            const symbol = state.symbols.find((s) => s.id === instance.symbolId);
            if (symbol) {
              instance.syncedVersion = symbol.version;
            }
          }
        });
      },

      checkSyncStatus: (instanceId) => {
        const { pageInstances, symbols } = get();
        const instance = pageInstances.get(instanceId);
        if (!instance) return null;
        
        const symbol = symbols.find((s) => s.id === instance.symbolId);
        if (!symbol) return null;
        
        return {
          instanceId,
          symbolId: instance.symbolId,
          isUpToDate: instance.syncedVersion === symbol.version,
          currentVersion: instance.syncedVersion,
          latestVersion: symbol.version,
          hasOverrides: Object.keys(instance.overrides.props).length > 0,
        };
      },

      // -------------------------------------------------------------------------
      // PAGE INSTANCE TRACKING
      // -------------------------------------------------------------------------

      registerPageInstance: (instance) => {
        set((state) => {
          state.pageInstances.set(instance.id, instance);
        });
      },

      unregisterPageInstance: (instanceId) => {
        set((state) => {
          state.pageInstances.delete(instanceId);
        });
      },

      clearPageInstances: () => {
        set((state) => {
          state.pageInstances.clear();
        });
      },

      getPageInstances: () => {
        return Array.from(get().pageInstances.values());
      },

      // -------------------------------------------------------------------------
      // BULK OPERATIONS
      // -------------------------------------------------------------------------

      syncAllInstances: () => {
        const { pageInstances, symbols } = get();
        
        set((state) => {
          for (const [instanceId, instance] of state.pageInstances) {
            const symbol = symbols.find((s) => s.id === instance.symbolId);
            if (symbol) {
              instance.syncedVersion = symbol.version;
            }
          }
        });
      },

      // -------------------------------------------------------------------------
      // LOADING STATES
      // -------------------------------------------------------------------------

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
          state.isLoading = false;
        });
      },

      // -------------------------------------------------------------------------
      // IMPORT/EXPORT
      // -------------------------------------------------------------------------

      importSymbols: (symbols) => {
        set((state) => {
          // Merge symbols, avoiding duplicates by ID
          const existingIds = new Set(state.symbols.map((s) => s.id));
          const newSymbols = symbols.filter((s) => !existingIds.has(s.id));
          state.symbols.push(...newSymbols);
        });
      },

      exportSymbols: (symbolIds) => {
        const { symbols } = get();
        if (symbolIds) {
          return symbols.filter((s) => symbolIds.includes(s.id));
        }
        return [...symbols];
      },
    })),
    {
      name: 'dramac-studio-symbols',
      partialize: (state) => ({
        symbols: state.symbols,
      }),
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/**
 * Get a specific symbol by ID
 */
export function useSymbol(symbolId: string | null) {
  return useSymbolStore((state) => 
    symbolId ? state.symbols.find((s) => s.id === symbolId) : undefined
  );
}

/**
 * Get filtered symbols
 */
export function useFilteredSymbols() {
  return useSymbolStore((state) => state.getFilteredSymbols());
}

/**
 * Get symbols by category
 */
export function useSymbolsByCategory(category: string) {
  return useSymbolStore((state) => 
    state.symbols.filter((s) => s.category === category)
  );
}
