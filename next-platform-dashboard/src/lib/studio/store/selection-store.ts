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
