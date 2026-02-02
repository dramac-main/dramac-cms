# PHASE-STUDIO-02: Editor State Management

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-02 |
| Title | Editor State Management |
| Priority | Critical |
| Estimated Time | 4-5 hours |
| Dependencies | PHASE-STUDIO-01 (Project Setup) |
| Risk Level | Low |

## Problem Statement

The Studio editor needs a robust state management system to handle:
- Page data (components, structure, properties)
- UI state (panels, zoom, breakpoint, mode)
- Selection (currently selected component)
- History (undo/redo with zundo)

This phase implements all Zustand stores with proper TypeScript typing, undo/redo support, and state persistence.

## Goals

- [ ] Create main editor store with page data and mutations
- [ ] Create UI store for panel states, zoom, breakpoint
- [ ] Create selection store for component selection
- [ ] Implement undo/redo using zundo middleware
- [ ] Create custom hooks for state access
- [ ] Implement state persistence for UI preferences

## Technical Approach

1. **Zustand + Immer**: Use immer middleware for immutable updates to complex nested state
2. **Zundo Middleware**: Wrap editor store with temporal middleware for undo/redo
3. **Separate Stores**: Split into focused stores (editor, UI, selection) for better performance
4. **Persistence**: Use localStorage for UI preferences (panels, zoom)
5. **TypeScript**: Full type safety with proper generics

---

## Implementation Tasks

### Task 1: Create Editor Store

**Description:** Main store for page data with all mutation actions. Uses immer for immutable updates and zundo for undo/redo.

**File:** `src/lib/studio/store/editor-store.ts`

```tsx
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
  ComponentDefinition,
} from "@/types/studio";
import { 
  generateComponentId,
  createEmptyPageData,
} from "../utils";

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
```

**Acceptance Criteria:**
- [ ] Store creates successfully
- [ ] All CRUD operations work (add, update, delete, move components)
- [ ] Undo/redo functions correctly
- [ ] State is properly typed

---

### Task 2: Create UI Store

**Description:** Store for UI state including panels, zoom, breakpoint, and mode.

**File:** `src/lib/studio/store/ui-store.ts`

```tsx
/**
 * DRAMAC Studio UI Store
 * 
 * State for UI elements: panels, zoom, breakpoint, editor mode.
 * Persists preferences to localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Breakpoint, EditorMode, PanelState, UIState } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

export interface UIActions {
  // Panels
  togglePanel: (panel: keyof PanelState) => void;
  setPanelOpen: (panel: keyof PanelState, open: boolean) => void;
  setAllPanels: (panels: PanelState) => void;
  
  // Breakpoint
  setBreakpoint: (breakpoint: Breakpoint) => void;
  
  // Zoom
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  
  // Mode
  setMode: (mode: EditorMode) => void;
  togglePreview: () => void;
  
  // Drag state
  setDragging: (isDragging: boolean, draggedType?: string | null) => void;
  
  // Display options
  toggleGrid: () => void;
  toggleOutlines: () => void;
  
  // Reset
  resetUI: () => void;
}

export type UIStore = UIState & UIActions;

// =============================================================================
// CONSTANTS
// =============================================================================

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: UIState = {
  breakpoint: "desktop",
  zoom: DEFAULT_ZOOM,
  panels: {
    left: true,
    right: true,
    bottom: false,
  },
  mode: "edit",
  isDragging: false,
  draggedType: null,
  showGrid: false,
  showOutlines: true,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // ---------------------------------------------------------------------------
      // PANELS
      // ---------------------------------------------------------------------------
      
      togglePanel: (panel) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [panel]: !state.panels[panel],
          },
        }));
      },

      setPanelOpen: (panel, open) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [panel]: open,
          },
        }));
      },

      setAllPanels: (panels) => {
        set({ panels });
      },

      // ---------------------------------------------------------------------------
      // BREAKPOINT
      // ---------------------------------------------------------------------------
      
      setBreakpoint: (breakpoint) => {
        set({ breakpoint });
      },

      // ---------------------------------------------------------------------------
      // ZOOM
      // ---------------------------------------------------------------------------
      
      setZoom: (zoom) => {
        const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
        set({ zoom: clampedZoom });
      },

      zoomIn: () => {
        const currentZoom = get().zoom;
        const nextLevel = ZOOM_LEVELS.find((z) => z > currentZoom);
        if (nextLevel) {
          set({ zoom: nextLevel });
        }
      },

      zoomOut: () => {
        const currentZoom = get().zoom;
        const prevLevel = [...ZOOM_LEVELS].reverse().find((z) => z < currentZoom);
        if (prevLevel) {
          set({ zoom: prevLevel });
        }
      },

      resetZoom: () => {
        set({ zoom: DEFAULT_ZOOM });
      },

      // ---------------------------------------------------------------------------
      // MODE
      // ---------------------------------------------------------------------------
      
      setMode: (mode) => {
        set({ mode });
      },

      togglePreview: () => {
        set((state) => ({
          mode: state.mode === "preview" ? "edit" : "preview",
        }));
      },

      // ---------------------------------------------------------------------------
      // DRAG STATE
      // ---------------------------------------------------------------------------
      
      setDragging: (isDragging, draggedType = null) => {
        set({ isDragging, draggedType });
      },

      // ---------------------------------------------------------------------------
      // DISPLAY OPTIONS
      // ---------------------------------------------------------------------------
      
      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }));
      },

      toggleOutlines: () => {
        set((state) => ({ showOutlines: !state.showOutlines }));
      },

      // ---------------------------------------------------------------------------
      // RESET
      // ---------------------------------------------------------------------------
      
      resetUI: () => {
        set(initialState);
      },
    }),
    {
      name: "dramac-studio-ui",
      // Only persist these fields
      partialize: (state) => ({
        panels: state.panels,
        zoom: state.zoom,
        showGrid: state.showGrid,
        showOutlines: state.showOutlines,
      }),
    }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectBreakpoint = (state: UIStore) => state.breakpoint;
export const selectZoom = (state: UIStore) => state.zoom;
export const selectPanels = (state: UIStore) => state.panels;
export const selectMode = (state: UIStore) => state.mode;
export const selectIsDragging = (state: UIStore) => state.isDragging;
```

**Acceptance Criteria:**
- [ ] Panel toggle/open/close works
- [ ] Zoom in/out/reset works with proper clamping
- [ ] Breakpoint changes correctly
- [ ] Mode toggle works
- [ ] Preferences persist to localStorage

---

### Task 3: Create Selection Store

**Description:** Store for managing component selection state, including multi-select.

**File:** `src/lib/studio/store/selection-store.ts`

```tsx
/**
 * DRAMAC Studio Selection Store
 * 
 * Manages component selection state.
 * Supports single and multi-select modes.
 */

import { create } from "zustand";
import type { SelectionState } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

export interface SelectionActions {
  /** Select a single component */
  select: (componentId: string) => void;
  
  /** Toggle selection (for multi-select) */
  toggleSelect: (componentId: string) => void;
  
  /** Add to multi-selection */
  addToSelection: (componentId: string) => void;
  
  /** Remove from selection */
  removeFromSelection: (componentId: string) => void;
  
  /** Select multiple components */
  selectMultiple: (componentIds: string[]) => void;
  
  /** Clear all selection */
  clearSelection: () => void;
  
  /** Check if component is selected */
  isSelected: (componentId: string) => boolean;
  
  /** Enable/disable multi-select mode */
  setMultiSelect: (enabled: boolean) => void;
}

export type SelectionStore = SelectionState & SelectionActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: SelectionState = {
  componentId: null,
  componentIds: [],
  isMultiSelect: false,
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  // State
  ...initialState,

  // ---------------------------------------------------------------------------
  // SELECTION ACTIONS
  // ---------------------------------------------------------------------------
  
  select: (componentId) => {
    set({
      componentId,
      componentIds: [componentId],
      isMultiSelect: false,
    });
  },

  toggleSelect: (componentId) => {
    const { componentIds, isMultiSelect } = get();
    
    if (!isMultiSelect) {
      // Start multi-select with this component
      set({
        componentId,
        componentIds: [componentId],
        isMultiSelect: true,
      });
      return;
    }
    
    // Toggle in multi-select mode
    if (componentIds.includes(componentId)) {
      const newIds = componentIds.filter((id) => id !== componentId);
      set({
        componentId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
        componentIds: newIds,
      });
    } else {
      set({
        componentId,
        componentIds: [...componentIds, componentId],
      });
    }
  },

  addToSelection: (componentId) => {
    const { componentIds } = get();
    if (!componentIds.includes(componentId)) {
      set({
        componentId,
        componentIds: [...componentIds, componentId],
        isMultiSelect: true,
      });
    }
  },

  removeFromSelection: (componentId) => {
    const { componentIds } = get();
    const newIds = componentIds.filter((id) => id !== componentId);
    set({
      componentId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
      componentIds: newIds,
      isMultiSelect: newIds.length > 1,
    });
  },

  selectMultiple: (componentIds) => {
    set({
      componentId: componentIds.length > 0 ? componentIds[componentIds.length - 1] : null,
      componentIds,
      isMultiSelect: componentIds.length > 1,
    });
  },

  clearSelection: () => {
    set(initialState);
  },

  isSelected: (componentId) => {
    return get().componentIds.includes(componentId);
  },

  setMultiSelect: (enabled) => {
    const { componentId } = get();
    if (!enabled && componentId) {
      // Exit multi-select, keep only the last selected
      set({
        componentIds: [componentId],
        isMultiSelect: false,
      });
    } else {
      set({ isMultiSelect: enabled });
    }
  },
}));

// =============================================================================
// SELECTORS
// =============================================================================

export const selectSelectedId = (state: SelectionStore) => state.componentId;
export const selectSelectedIds = (state: SelectionStore) => state.componentIds;
export const selectIsMultiSelect = (state: SelectionStore) => state.isMultiSelect;
export const selectHasSelection = (state: SelectionStore) => state.componentId !== null;
```

**Acceptance Criteria:**
- [ ] Single selection works
- [ ] Multi-select toggle works
- [ ] Clear selection works
- [ ] `isSelected` check works

---

### Task 4: Create Combined Store Exports and Hooks

**Description:** Create the main index file that exports all stores and provides convenient hooks.

**File:** `src/lib/studio/store/index.ts`

```tsx
/**
 * DRAMAC Studio State Management
 * 
 * Central exports for all Zustand stores and hooks.
 */

// =============================================================================
// STORE EXPORTS
// =============================================================================

export {
  useEditorStore,
  useEditorHistory,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
  type EditorState,
  type EditorActions,
  type EditorStore,
} from "./editor-store";

export {
  useUIStore,
  selectBreakpoint,
  selectZoom,
  selectPanels,
  selectMode,
  selectIsDragging,
  type UIActions,
  type UIStore,
} from "./ui-store";

export {
  useSelectionStore,
  selectSelectedId,
  selectSelectedIds,
  selectIsMultiSelect,
  selectHasSelection,
  type SelectionActions,
  type SelectionStore,
} from "./selection-store";

// =============================================================================
// COMBINED HOOKS
// =============================================================================

import { useEditorStore } from "./editor-store";
import { useUIStore } from "./ui-store";
import { useSelectionStore } from "./selection-store";
import type { StudioComponent, ComponentDefinition } from "@/types/studio";

/**
 * Hook to get the currently selected component data
 */
export function useSelectedComponent(): StudioComponent | null {
  const componentId = useSelectionStore((s) => s.componentId);
  const components = useEditorStore((s) => s.data.components);
  
  if (!componentId) return null;
  return components[componentId] || null;
}

/**
 * Hook to get multiple selected components
 */
export function useSelectedComponents(): StudioComponent[] {
  const componentIds = useSelectionStore((s) => s.componentIds);
  const components = useEditorStore((s) => s.data.components);
  
  return componentIds
    .map((id) => components[id])
    .filter((c): c is StudioComponent => c !== undefined);
}

/**
 * Hook to check if there are unsaved changes
 */
export function useHasUnsavedChanges(): boolean {
  return useEditorStore((s) => s.isDirty);
}

/**
 * Hook to get editor loading state
 */
export function useEditorLoading(): boolean {
  return useEditorStore((s) => s.isLoading);
}

/**
 * Hook to get current breakpoint with width
 */
export function useBreakpoint() {
  const breakpoint = useUIStore((s) => s.breakpoint);
  const widths = {
    mobile: 375,
    tablet: 768,
    desktop: 1280,
  };
  
  return {
    breakpoint,
    width: widths[breakpoint],
  };
}

/**
 * Hook to get canvas dimensions based on zoom and breakpoint
 */
export function useCanvasDimensions() {
  const { width } = useBreakpoint();
  const zoom = useUIStore((s) => s.zoom);
  
  return {
    width: width * zoom,
    zoom,
    scale: `scale(${zoom})`,
  };
}

/**
 * Hook to manage component props updates
 */
export function useComponentProps(componentId: string | null) {
  const component = useEditorStore((s) => 
    componentId ? s.data.components[componentId] : null
  );
  const updateProps = useEditorStore((s) => s.updateComponentProps);
  
  const setProps = (props: Partial<Record<string, unknown>>) => {
    if (componentId) {
      updateProps(componentId, props);
    }
  };
  
  const setProp = (key: string, value: unknown) => {
    if (componentId) {
      updateProps(componentId, { [key]: value });
    }
  };
  
  return {
    props: component?.props || {},
    setProps,
    setProp,
  };
}

/**
 * Hook to get children of a component or root
 */
export function useComponentChildren(parentId: string = "root"): string[] {
  const rootChildren = useEditorStore((s) => s.data.root.children);
  const components = useEditorStore((s) => s.data.components);
  
  if (parentId === "root") {
    return rootChildren;
  }
  
  return components[parentId]?.children || [];
}

/**
 * Hook to get zone children
 */
export function useZoneChildren(zoneId: string): string[] {
  const zones = useEditorStore((s) => s.data.zones);
  return zones?.[zoneId] || [];
}

/**
 * Hook for undo/redo state
 */
export function useHistoryState() {
  const temporal = useEditorStore.temporal;
  
  // Subscribe to temporal store changes
  const pastLength = temporal((s) => s.pastStates.length);
  const futureLength = temporal((s) => s.futureStates.length);
  
  return {
    canUndo: pastLength > 0,
    canRedo: futureLength > 0,
    undoCount: pastLength,
    redoCount: futureLength,
  };
}
```

**Acceptance Criteria:**
- [ ] All stores exported correctly
- [ ] Custom hooks work as expected
- [ ] No circular dependencies
- [ ] TypeScript types are correct

---

### Task 5: Create Studio Provider Component

**Description:** Create a provider component that initializes stores and provides context.

**File:** `src/components/studio/core/studio-provider.tsx`

```tsx
/**
 * DRAMAC Studio Provider
 * 
 * Wraps the editor with necessary providers and initializes state.
 */

"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useEditorStore,
  useUIStore,
  useSelectionStore,
  clearHistory,
} from "@/lib/studio/store";
import type { StudioPageData } from "@/types/studio";
import { createEmptyPageData, validatePageData, migrateFromPuckFormat } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

export interface StudioProviderProps {
  children: ReactNode;
  siteId: string;
  pageId: string;
  siteName: string;
  pageName: string;
  initialData?: unknown;
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export function StudioProvider({
  children,
  siteId,
  pageId,
  siteName,
  pageName,
  initialData,
}: StudioProviderProps) {
  const router = useRouter();
  
  // Store actions
  const initialize = useEditorStore((s) => s.initialize);
  const reset = useEditorStore((s) => s.reset);
  const setError = useEditorStore((s) => s.setError);
  const isDirty = useEditorStore((s) => s.isDirty);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const resetUI = useUIStore((s) => s.resetUI);

  // Initialize editor on mount
  useEffect(() => {
    let data: StudioPageData;

    try {
      if (!initialData) {
        // No data - create empty page
        data = createEmptyPageData();
        data.root.props.title = pageName;
      } else if (validatePageData(initialData)) {
        // Already in Studio format
        data = initialData;
      } else if (
        typeof initialData === "object" &&
        initialData !== null &&
        "content" in initialData
      ) {
        // Puck format - migrate
        data = migrateFromPuckFormat(initialData as any);
        console.log("Migrated from Puck format to Studio format");
      } else {
        // Unknown format
        console.warn("Unknown page data format, creating empty page");
        data = createEmptyPageData();
        data.root.props.title = pageName;
      }

      initialize(siteId, pageId, data);
      clearHistory();
    } catch (error) {
      console.error("Error initializing editor:", error);
      setError("Failed to load page data");
      toast.error("Failed to load page. Please try again.");
    }

    // Cleanup on unmount
    return () => {
      reset();
      clearSelection();
    };
  }, [siteId, pageId, initialData, pageName, initialize, reset, setError, clearSelection]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Handle keyboard shortcuts for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        // TODO: Implement save action in later phase
        toast.info("Save functionality coming in Phase STUDIO-06");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return <>{children}</>;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default StudioProvider;
```

**File:** `src/components/studio/core/index.ts` (Update)

```tsx
/**
 * Studio Core Components
 * 
 * Central exports for all core Studio components.
 */

export { StudioProvider, type StudioProviderProps } from "./studio-provider";

// Placeholder exports for later phases
// export { StudioCanvas } from "./studio-canvas";
// export { StudioFrame } from "./studio-frame";
// export { ComponentWrapper } from "./component-wrapper";
```

**Acceptance Criteria:**
- [ ] Provider initializes stores correctly
- [ ] Handles Puck data migration
- [ ] Warns before leaving with unsaved changes
- [ ] Cleanup on unmount works

---

### Task 6: Update Studio Page to Use Provider

**Description:** Update the studio page component to use the new provider.

**File:** `src/app/studio/[siteId]/[pageId]/page.tsx` (Update)

```tsx
/**
 * DRAMAC Studio Editor Page
 * 
 * Full-screen website editor at /studio/[siteId]/[pageId]
 * This is the main entry point for the visual page builder.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudioProvider } from "@/components/studio/core";
import { StudioEditorPlaceholder } from "./studio-editor-placeholder";

interface StudioPageProps {
  params: Promise<{
    siteId: string;
    pageId: string;
  }>;
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { siteId, pageId } = await params;
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Verify site access
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, agency_id")
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    redirect("/dashboard/sites");
  }

  // Verify page exists and get content
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id, name, slug, content")
    .eq("id", pageId)
    .eq("site_id", siteId)
    .single();

  if (pageError || !page) {
    redirect(`/dashboard/sites/${siteId}/pages`);
  }

  return (
    <StudioProvider
      siteId={siteId}
      pageId={pageId}
      siteName={site.name}
      pageName={page.name}
      initialData={page.content}
    >
      <StudioEditorPlaceholder
        siteName={site.name}
        pageName={page.name}
        siteId={siteId}
        pageId={pageId}
      />
    </StudioProvider>
  );
}
```

**File:** `src/app/studio/[siteId]/[pageId]/studio-editor-placeholder.tsx`

```tsx
/**
 * Studio Editor Placeholder
 * 
 * Temporary component showing store state until full UI is built in Phase STUDIO-04.
 */

"use client";

import { useEditorStore, useUIStore, useSelectionStore, useHistoryState, undo, redo } from "@/lib/studio/store";
import Link from "next/link";
import { ArrowLeft, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudioEditorPlaceholderProps {
  siteName: string;
  pageName: string;
  siteId: string;
  pageId: string;
}

export function StudioEditorPlaceholder({
  siteName,
  pageName,
  siteId,
  pageId,
}: StudioEditorPlaceholderProps) {
  // Store state
  const data = useEditorStore((s) => s.data);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isLoading = useEditorStore((s) => s.isLoading);
  const error = useEditorStore((s) => s.error);
  
  const breakpoint = useUIStore((s) => s.breakpoint);
  const zoom = useUIStore((s) => s.zoom);
  const panels = useUIStore((s) => s.panels);
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);
  const zoomIn = useUIStore((s) => s.zoomIn);
  const zoomOut = useUIStore((s) => s.zoomOut);
  
  const selectedId = useSelectionStore((s) => s.componentId);
  
  const { canUndo, canRedo, undoCount, redoCount } = useHistoryState();
  
  // Test actions
  const addComponent = useEditorStore((s) => s.addComponent);
  const deleteComponent = useEditorStore((s) => s.deleteComponent);
  const select = useSelectionStore((s) => s.select);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-destructive">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
          <Link href={`/dashboard/sites/${siteId}/pages`}>
            <Button className="mt-4">Back to Pages</Button>
          </Link>
        </div>
      </div>
    );
  }

  const componentCount = Object.keys(data.components).length;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top toolbar */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Link href={`/dashboard/sites/${siteId}/pages`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        
        <div className="flex-1">
          <span className="font-medium">{siteName}</span>
          <span className="text-muted-foreground mx-2">/</span>
          <span>{pageName}</span>
          {isDirty && <span className="text-orange-500 ml-2">●</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => undo()} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => redo()} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4">DRAMAC Studio - State Debug</h1>
            <p className="text-muted-foreground mb-4">
              Phase STUDIO-02 complete! Stores are working. Phase STUDIO-04 will add the full UI.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-muted rounded">
                <p className="text-muted-foreground">Components</p>
                <p className="text-2xl font-bold">{componentCount}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-muted-foreground">Breakpoint</p>
                <p className="text-2xl font-bold capitalize">{breakpoint}</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-muted-foreground">Zoom</p>
                <p className="text-2xl font-bold">{Math.round(zoom * 100)}%</p>
              </div>
              <div className="p-3 bg-muted rounded">
                <p className="text-muted-foreground">History</p>
                <p className="text-2xl font-bold">{undoCount}/{redoCount}</p>
              </div>
            </div>
          </div>

          {/* Test controls */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Test Store Actions</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                size="sm"
                onClick={() => {
                  const id = addComponent("Heading", { text: "New Heading" }, "root");
                  select(id);
                }}
              >
                Add Heading
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const id = addComponent("Text", { text: "New paragraph" }, "root");
                  select(id);
                }}
              >
                Add Text
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (selectedId) {
                    deleteComponent(selectedId);
                    clearSelection();
                  }
                }}
                disabled={!selectedId}
              >
                Delete Selected
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={zoomIn}>Zoom In</Button>
              <Button size="sm" variant="outline" onClick={zoomOut}>Zoom Out</Button>
              <Button size="sm" variant="outline" onClick={() => setBreakpoint("mobile")}>Mobile</Button>
              <Button size="sm" variant="outline" onClick={() => setBreakpoint("tablet")}>Tablet</Button>
              <Button size="sm" variant="outline" onClick={() => setBreakpoint("desktop")}>Desktop</Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Selected: {selectedId || "None"}</p>
              <p>Panels: L:{panels.left ? "✓" : "✗"} R:{panels.right ? "✓" : "✗"} B:{panels.bottom ? "✓" : "✗"}</p>
            </div>
          </div>

          {/* Component list */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Components ({componentCount})</h2>
            {data.root.children.length === 0 ? (
              <p className="text-muted-foreground">No components yet. Click "Add Heading" to test.</p>
            ) : (
              <ul className="space-y-2">
                {data.root.children.map((id) => {
                  const comp = data.components[id];
                  return (
                    <li
                      key={id}
                      className={`p-2 rounded cursor-pointer ${
                        selectedId === id ? "bg-primary/10 border border-primary" : "bg-muted"
                      }`}
                      onClick={() => select(id)}
                    >
                      <span className="font-medium">{comp.type}</span>
                      <span className="text-muted-foreground ml-2">
                        {JSON.stringify(comp.props).slice(0, 50)}...
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Raw data */}
          <details className="bg-card border rounded-lg">
            <summary className="p-4 cursor-pointer font-semibold">Raw Page Data</summary>
            <pre className="p-4 text-xs overflow-auto max-h-96 border-t">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Page loads without errors
- [ ] Store state is displayed
- [ ] Add/delete component actions work
- [ ] Undo/redo works
- [ ] Zoom and breakpoint changes work

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/lib/studio/store/editor-store.ts` | Main editor state with undo/redo |
| CREATE | `src/lib/studio/store/ui-store.ts` | UI state (panels, zoom, breakpoint) |
| CREATE | `src/lib/studio/store/selection-store.ts` | Component selection state |
| UPDATE | `src/lib/studio/store/index.ts` | Export all stores and hooks |
| CREATE | `src/components/studio/core/studio-provider.tsx` | Provider component |
| UPDATE | `src/components/studio/core/index.ts` | Export provider |
| UPDATE | `src/app/studio/[siteId]/[pageId]/page.tsx` | Use provider |
| CREATE | `src/app/studio/[siteId]/[pageId]/studio-editor-placeholder.tsx` | Debug UI |

---

## Testing Requirements

### Manual Testing
- [ ] Navigate to `/studio/[valid-site-id]/[valid-page-id]`
- [ ] Add components using test buttons - verify they appear
- [ ] Delete selected component - verify removal
- [ ] Click undo - verify component returns
- [ ] Click redo - verify component removed again
- [ ] Change zoom - verify value updates
- [ ] Change breakpoint - verify value updates
- [ ] Refresh page - verify UI preferences persist (zoom, panels)

### Store Testing
- [ ] `addComponent` creates component with unique ID
- [ ] `deleteComponent` removes component and updates parent
- [ ] `moveComponent` updates parent references correctly
- [ ] `duplicateComponent` creates deep copy with new IDs
- [ ] History tracks all mutations
- [ ] Selection store handles single and multi-select

---

## Dependencies to Install

```bash
# These should already be installed from Phase STUDIO-01
# pnpm add immer zundo
```

If not installed:
```bash
cd next-platform-dashboard
pnpm add immer zundo
```

---

## Environment Variables

No new environment variables required for this phase.

---

## Database Changes

No database changes required for this phase.

---

## Rollback Plan

1. Delete created store files
2. Revert page.tsx to placeholder version
3. Remove provider imports

---

## Success Criteria

- [ ] Editor store created with all CRUD operations
- [ ] UI store created with panel/zoom/breakpoint management
- [ ] Selection store created with single/multi-select support
- [ ] Undo/redo works using zundo middleware
- [ ] State persistence works for UI preferences
- [ ] Provider initializes stores correctly
- [ ] Data migration from Puck format works
- [ ] Debug page shows all store state correctly
- [ ] `npx tsc --noEmit` returns zero errors

---

## Notes for Implementation

1. **Immer Integration**: The editor store uses `immer` middleware for simpler mutation syntax while maintaining immutability.

2. **Zundo Configuration**: History is limited to 50 entries and only tracks `data` changes (not UI state).

3. **Persistence**: Only UI preferences (panels, zoom, grid) are persisted. Page data is saved via explicit save action (later phase).

4. **Component IDs**: Use `nanoid` for generating unique component IDs with `comp_` prefix.

5. **Provider Pattern**: The provider handles initialization, data migration, and cleanup on unmount.

6. **Temporal Store**: Access undo/redo via `useEditorStore.temporal` - it's a separate Zustand store created by zundo.
