/**
 * DRAMAC Studio - Component Variations Store
 * 
 * Manages component variations and cloning.
 * Allows users to save components as reusable variations and create new instances.
 * 
 * @phase STUDIO-30 - Component Superpowers
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { StudioComponent } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

/** A saved component variation */
export interface ComponentVariation {
  id: string;
  name: string;
  description?: string;
  componentType: string;
  props: Record<string, unknown>;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

/** State for the variations store */
interface VariationsState {
  /** All saved variations */
  variations: Record<string, ComponentVariation>;
  
  /** Recently used variation IDs */
  recentVariations: string[];
  
  /** Maximum recent items to keep */
  maxRecent: number;
}

/** Actions for the variations store */
interface VariationsActions {
  // CRUD operations
  saveVariation: (
    name: string, 
    component: StudioComponent, 
    options?: { description?: string; category?: string; tags?: string[] }
  ) => string;
  updateVariation: (id: string, updates: Partial<Omit<ComponentVariation, "id" | "createdAt">>) => void;
  deleteVariation: (id: string) => void;
  
  // Queries
  getVariation: (id: string) => ComponentVariation | null;
  getVariationsForType: (componentType: string) => ComponentVariation[];
  getVariationsByCategory: (category: string) => ComponentVariation[];
  searchVariations: (query: string) => ComponentVariation[];
  
  // Usage
  createFromVariation: (variationId: string) => StudioComponent | null;
  cloneComponent: (component: StudioComponent) => StudioComponent;
  recordUsage: (variationId: string) => void;
  
  // Recent
  getRecentVariations: () => ComponentVariation[];
  clearRecent: () => void;
  
  // Bulk operations
  importVariations: (variations: ComponentVariation[]) => void;
  exportVariations: () => ComponentVariation[];
  clearAll: () => void;
}

export type VariationsStore = VariationsState & VariationsActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: VariationsState = {
  variations: {},
  recentVariations: [],
  maxRecent: 10,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useVariationsStore = create<VariationsStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // ---------------------------------------------------------------------
        // CRUD OPERATIONS
        // ---------------------------------------------------------------------
        
        saveVariation: (name, component, options = {}) => {
          const id = nanoid();
          const now = new Date().toISOString();
          
          const variation: ComponentVariation = {
            id,
            name,
            description: options.description,
            componentType: component.type,
            props: { ...component.props },
            category: options.category,
            tags: options.tags,
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
          };
          
          set((state) => ({
            variations: { ...state.variations, [id]: variation },
          }));
          
          return id;
        },
        
        updateVariation: (id, updates) => {
          set((state) => {
            const existing = state.variations[id];
            if (!existing) return state;
            
            return {
              variations: {
                ...state.variations,
                [id]: {
                  ...existing,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                },
              },
            };
          });
        },
        
        deleteVariation: (id) => {
          set((state) => {
            const { [id]: removed, ...rest } = state.variations;
            return { 
              variations: rest,
              recentVariations: state.recentVariations.filter((v) => v !== id),
            };
          });
        },
        
        // ---------------------------------------------------------------------
        // QUERIES
        // ---------------------------------------------------------------------
        
        getVariation: (id) => {
          return get().variations[id] || null;
        },
        
        getVariationsForType: (componentType) => {
          const { variations } = get();
          return Object.values(variations)
            .filter((v) => v.componentType === componentType)
            .sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
        },
        
        getVariationsByCategory: (category) => {
          const { variations } = get();
          return Object.values(variations)
            .filter((v) => v.category === category)
            .sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
        },
        
        searchVariations: (query) => {
          const { variations } = get();
          const lowerQuery = query.toLowerCase();
          
          return Object.values(variations)
            .filter((v) => 
              v.name.toLowerCase().includes(lowerQuery) ||
              v.description?.toLowerCase().includes(lowerQuery) ||
              v.componentType.toLowerCase().includes(lowerQuery) ||
              v.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
            )
            .sort((a, b) => b.usageCount - a.usageCount);
        },
        
        // ---------------------------------------------------------------------
        // USAGE
        // ---------------------------------------------------------------------
        
        createFromVariation: (variationId) => {
          const variation = get().variations[variationId];
          if (!variation) return null;
          
          // Record usage
          get().recordUsage(variationId);
          
          return {
            id: nanoid(),
            type: variation.componentType,
            props: { ...variation.props },
          };
        },
        
        cloneComponent: (component) => {
          return {
            ...component,
            id: nanoid(),
            props: JSON.parse(JSON.stringify(component.props)), // Deep clone
            children: component.children ? [...component.children] : undefined,
          };
        },
        
        recordUsage: (variationId) => {
          set((state) => {
            const variation = state.variations[variationId];
            if (!variation) return state;
            
            // Update usage count
            const updatedVariation = {
              ...variation,
              usageCount: variation.usageCount + 1,
              updatedAt: new Date().toISOString(),
            };
            
            // Update recent list
            const recentWithoutCurrent = state.recentVariations.filter(
              (id) => id !== variationId
            );
            const newRecent = [variationId, ...recentWithoutCurrent].slice(
              0,
              state.maxRecent
            );
            
            return {
              variations: {
                ...state.variations,
                [variationId]: updatedVariation,
              },
              recentVariations: newRecent,
            };
          });
        },
        
        // ---------------------------------------------------------------------
        // RECENT
        // ---------------------------------------------------------------------
        
        getRecentVariations: () => {
          const { variations, recentVariations } = get();
          return recentVariations
            .map((id) => variations[id])
            .filter((v): v is ComponentVariation => v !== undefined);
        },
        
        clearRecent: () => {
          set({ recentVariations: [] });
        },
        
        // ---------------------------------------------------------------------
        // BULK OPERATIONS
        // ---------------------------------------------------------------------
        
        importVariations: (importedVariations) => {
          set((state) => {
            const newVariations = { ...state.variations };
            
            for (const variation of importedVariations) {
              // Generate new ID to avoid conflicts
              const newId = nanoid();
              newVariations[newId] = {
                ...variation,
                id: newId,
                updatedAt: new Date().toISOString(),
              };
            }
            
            return { variations: newVariations };
          });
        },
        
        exportVariations: () => {
          return Object.values(get().variations);
        },
        
        clearAll: () => {
          set(initialState);
        },
      }),
      {
        name: "dramac-variations-store",
        version: 1,
        partialize: (state) => ({
          variations: state.variations,
          recentVariations: state.recentVariations,
        }),
      }
    ),
    { name: "dramac-variations-store" }
  )
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all unique categories from variations
 */
export function getVariationCategories(): string[] {
  const variations = useVariationsStore.getState().variations;
  const categories = new Set<string>();
  
  Object.values(variations).forEach((v) => {
    if (v.category) categories.add(v.category);
  });
  
  return Array.from(categories).sort();
}

/**
 * Get all unique tags from variations
 */
export function getVariationTags(): string[] {
  const variations = useVariationsStore.getState().variations;
  const tags = new Set<string>();
  
  Object.values(variations).forEach((v) => {
    v.tags?.forEach((t) => tags.add(t));
  });
  
  return Array.from(tags).sort();
}

/**
 * Get variation count by component type
 */
export function getVariationCountsByType(): Record<string, number> {
  const variations = useVariationsStore.getState().variations;
  const counts: Record<string, number> = {};
  
  Object.values(variations).forEach((v) => {
    counts[v.componentType] = (counts[v.componentType] || 0) + 1;
  });
  
  return counts;
}
