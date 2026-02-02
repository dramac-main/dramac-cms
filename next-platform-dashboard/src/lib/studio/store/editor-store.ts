/**
 * DRAMAC Studio Editor Store
 * 
 * Main state store for page data and component mutations.
 * Uses Zustand with Immer for immutable updates and Zundo for undo/redo.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import type { 
  StudioPageData, 
  StudioComponent,
} from "@/types/studio";
import { createEmptyPageData } from "@/types/studio";
import { generateComponentId } from "../utils";

// =============================================================================
// TYPES
// =============================================================================

export interface EditorState {
  /** Current page data */
  data: StudioPageData;
  
  /** Site ID being edited */
  siteId: string | null;
  
  /** Page ID being edited */
  pageId: string | null;
  
  /** Has unsaved changes */
  isDirty: boolean;
  
  /** Is currently saving */
  isSaving: boolean;
  
  /** Last saved timestamp */
  lastSavedAt: number | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
}

export interface EditorActions {
  // Initialization
  initialize: (siteId: string, pageId: string, data: StudioPageData) => void;
  reset: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Save state
  markDirty: () => void;
  markSaved: () => void;
  setSaving: (saving: boolean) => void;
  
  // Component CRUD
  addComponent: (
    type: string,
    props: Record<string, unknown>,
    parentId: string,
    index?: number,
    zoneId?: string
  ) => string;
  
  updateComponent: (
    componentId: string,
    updates: Partial<StudioComponent>
  ) => void;
  
  updateComponentProps: (
    componentId: string,
    props: Partial<Record<string, unknown>>
  ) => void;
  
  deleteComponent: (componentId: string) => void;
  
  duplicateComponent: (componentId: string) => string | null;
  
  moveComponent: (
    componentId: string,
    newParentId: string,
    newIndex: number,
    newZoneId?: string
  ) => void;
  
  // Bulk operations
  deleteComponents: (componentIds: string[]) => void;
  
  // Root updates
  updateRootProps: (props: Partial<StudioPageData["root"]["props"]>) => void;
  
  // Data operations
  setData: (data: StudioPageData) => void;
  getData: () => StudioPageData;
}

export type EditorStore = EditorState & EditorActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: EditorState = {
  data: createEmptyPageData(),
  siteId: null,
  pageId: null,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  isLoading: true,
  error: null,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useEditorStore = create<EditorStore>()(
  temporal(
    immer((set, get) => ({
      // State
      ...initialState,

      // ---------------------------------------------------------------------------
      // INITIALIZATION
      // ---------------------------------------------------------------------------
      
      initialize: (siteId, pageId, data) => {
        set((state) => {
          state.siteId = siteId;
          state.pageId = pageId;
          state.data = data;
          state.isDirty = false;
          state.isLoading = false;
          state.error = null;
          state.lastSavedAt = Date.now();
        });
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },

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

      // ---------------------------------------------------------------------------
      // SAVE STATE
      // ---------------------------------------------------------------------------
      
      markDirty: () => {
        set((state) => {
          state.isDirty = true;
        });
      },

      markSaved: () => {
        set((state) => {
          state.isDirty = false;
          state.lastSavedAt = Date.now();
        });
      },

      setSaving: (saving) => {
        set((state) => {
          state.isSaving = saving;
        });
      },

      // ---------------------------------------------------------------------------
      // COMPONENT CRUD
      // ---------------------------------------------------------------------------
      
      addComponent: (type, props, parentId, index, zoneId) => {
        const id = generateComponentId();
        
        set((state) => {
          // Create the component
          const component: StudioComponent = {
            id,
            type,
            props,
            children: [],
            parentId: parentId === "root" ? undefined : parentId,
            zoneId,
            locked: false,
            hidden: false,
          };
          
          // Add to components map
          state.data.components[id] = component;
          
          // Add to parent's children or zone
          if (zoneId) {
            // Add to zone
            if (!state.data.zones) {
              state.data.zones = {};
            }
            if (!state.data.zones[zoneId]) {
              state.data.zones[zoneId] = [];
            }
            const zoneChildren = state.data.zones[zoneId];
            if (index !== undefined && index >= 0 && index <= zoneChildren.length) {
              zoneChildren.splice(index, 0, id);
            } else {
              zoneChildren.push(id);
            }
          } else if (parentId === "root") {
            // Add to root children
            const children = state.data.root.children;
            if (index !== undefined && index >= 0 && index <= children.length) {
              children.splice(index, 0, id);
            } else {
              children.push(id);
            }
          } else {
            // Add to parent component's children
            const parent = state.data.components[parentId];
            if (parent) {
              if (!parent.children) {
                parent.children = [];
              }
              if (index !== undefined && index >= 0 && index <= parent.children.length) {
                parent.children.splice(index, 0, id);
              } else {
                parent.children.push(id);
              }
            }
          }
          
          state.isDirty = true;
        });
        
        return id;
      },

      updateComponent: (componentId, updates) => {
        set((state) => {
          const component = state.data.components[componentId];
          if (component) {
            Object.assign(component, updates);
            state.isDirty = true;
          }
        });
      },

      updateComponentProps: (componentId, props) => {
        set((state) => {
          const component = state.data.components[componentId];
          if (component) {
            component.props = { ...component.props, ...props };
            state.isDirty = true;
          }
        });
      },

      deleteComponent: (componentId) => {
        set((state) => {
          const component = state.data.components[componentId];
          if (!component) return;
          
          // Recursively collect all descendant IDs
          const collectDescendants = (id: string): string[] => {
            const comp = state.data.components[id];
            if (!comp?.children) return [id];
            return [id, ...comp.children.flatMap(collectDescendants)];
          };
          
          const idsToDelete = collectDescendants(componentId);
          
          // Remove from parent's children
          if (component.zoneId && state.data.zones?.[component.zoneId]) {
            const zoneChildren = state.data.zones[component.zoneId];
            const index = zoneChildren.indexOf(componentId);
            if (index > -1) {
              zoneChildren.splice(index, 1);
            }
          } else if (component.parentId) {
            const parent = state.data.components[component.parentId];
            if (parent?.children) {
              const index = parent.children.indexOf(componentId);
              if (index > -1) {
                parent.children.splice(index, 1);
              }
            }
          } else {
            // Top-level component
            const index = state.data.root.children.indexOf(componentId);
            if (index > -1) {
              state.data.root.children.splice(index, 1);
            }
          }
          
          // Delete all descendants from components map
          for (const id of idsToDelete) {
            delete state.data.components[id];
          }
          
          state.isDirty = true;
        });
      },

      duplicateComponent: (componentId) => {
        const state = get();
        const component = state.data.components[componentId];
        if (!component) return null;
        
        // Deep clone the component and its descendants
        const cloneWithDescendants = (
          id: string,
          newParentId?: string
        ): { newId: string; components: Record<string, StudioComponent> } => {
          const original = state.data.components[id];
          if (!original) {
            return { newId: "", components: {} };
          }
          
          const newId = generateComponentId();
          const cloned: StudioComponent = {
            ...original,
            id: newId,
            parentId: newParentId,
            children: [],
          };
          
          const allComponents: Record<string, StudioComponent> = { [newId]: cloned };
          
          // Clone children recursively
          if (original.children) {
            for (const childId of original.children) {
              const result = cloneWithDescendants(childId, newId);
              cloned.children!.push(result.newId);
              Object.assign(allComponents, result.components);
            }
          }
          
          return { newId, components: allComponents };
        };
        
        const result = cloneWithDescendants(componentId, component.parentId);
        
        set((draft) => {
          // Add all cloned components
          Object.assign(draft.data.components, result.components);
          
          // Add to parent's children right after original
          if (component.zoneId && draft.data.zones?.[component.zoneId]) {
            const zoneChildren = draft.data.zones[component.zoneId];
            const index = zoneChildren.indexOf(componentId);
            zoneChildren.splice(index + 1, 0, result.newId);
          } else if (component.parentId) {
            const parent = draft.data.components[component.parentId];
            if (parent?.children) {
              const index = parent.children.indexOf(componentId);
              parent.children.splice(index + 1, 0, result.newId);
            }
          } else {
            const index = draft.data.root.children.indexOf(componentId);
            draft.data.root.children.splice(index + 1, 0, result.newId);
          }
          
          draft.isDirty = true;
        });
        
        return result.newId;
      },

      moveComponent: (componentId, newParentId, newIndex, newZoneId) => {
        set((state) => {
          const component = state.data.components[componentId];
          if (!component) return;
          
          // Remove from current parent
          if (component.zoneId && state.data.zones?.[component.zoneId]) {
            const zoneChildren = state.data.zones[component.zoneId];
            const index = zoneChildren.indexOf(componentId);
            if (index > -1) {
              zoneChildren.splice(index, 1);
            }
          } else if (component.parentId) {
            const parent = state.data.components[component.parentId];
            if (parent?.children) {
              const index = parent.children.indexOf(componentId);
              if (index > -1) {
                parent.children.splice(index, 1);
              }
            }
          } else {
            const index = state.data.root.children.indexOf(componentId);
            if (index > -1) {
              state.data.root.children.splice(index, 1);
            }
          }
          
          // Add to new parent
          if (newZoneId) {
            if (!state.data.zones) {
              state.data.zones = {};
            }
            if (!state.data.zones[newZoneId]) {
              state.data.zones[newZoneId] = [];
            }
            state.data.zones[newZoneId].splice(newIndex, 0, componentId);
            component.zoneId = newZoneId;
            component.parentId = undefined;
          } else if (newParentId === "root") {
            state.data.root.children.splice(newIndex, 0, componentId);
            component.parentId = undefined;
            component.zoneId = undefined;
          } else {
            const newParent = state.data.components[newParentId];
            if (newParent) {
              if (!newParent.children) {
                newParent.children = [];
              }
              newParent.children.splice(newIndex, 0, componentId);
              component.parentId = newParentId;
              component.zoneId = undefined;
            }
          }
          
          state.isDirty = true;
        });
      },

      // ---------------------------------------------------------------------------
      // BULK OPERATIONS
      // ---------------------------------------------------------------------------
      
      deleteComponents: (componentIds) => {
        for (const id of componentIds) {
          get().deleteComponent(id);
        }
      },

      // ---------------------------------------------------------------------------
      // ROOT UPDATES
      // ---------------------------------------------------------------------------
      
      updateRootProps: (props) => {
        set((state) => {
          state.data.root.props = { ...state.data.root.props, ...props };
          state.isDirty = true;
        });
      },

      // ---------------------------------------------------------------------------
      // DATA OPERATIONS
      // ---------------------------------------------------------------------------
      
      setData: (data) => {
        set((state) => {
          state.data = data;
          state.isDirty = true;
        });
      },

      getData: () => {
        return get().data;
      },
    })),
    {
      // Zundo options - what to track in history
      partialize: (state) => ({
        data: state.data,
      }),
      // Limit history size
      limit: 50,
    }
  )
);

// =============================================================================
// HISTORY HELPERS
// =============================================================================

/**
 * Get the temporal store for undo/redo
 */
export const useEditorHistory = () => {
  return useEditorStore.temporal;
};

/**
 * Undo the last action
 */
export const undo = () => {
  useEditorStore.temporal.getState().undo();
};

/**
 * Redo the last undone action
 */
export const redo = () => {
  useEditorStore.temporal.getState().redo();
};

/**
 * Check if undo is available
 */
export const canUndo = () => {
  return useEditorStore.temporal.getState().pastStates.length > 0;
};

/**
 * Check if redo is available
 */
export const canRedo = () => {
  return useEditorStore.temporal.getState().futureStates.length > 0;
};

/**
 * Clear history
 */
export const clearHistory = () => {
  useEditorStore.temporal.getState().clear();
};
