/**
 * DRAMAC Studio Selection Store
 * 
 * Manages component selection state.
 * Supports single and multi-select modes.
 * Updated in PHASE-STUDIO-20 with keyboard navigation.
 */

import { create } from "zustand";
import type { SelectionState } from "@/types/studio";
import { useEditorStore } from "./editor-store";

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
  
  /** Select next component in tree (PHASE-STUDIO-20) */
  selectNext: () => void;
  
  /** Select previous component in tree (PHASE-STUDIO-20) */
  selectPrevious: () => void;
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

  // ---------------------------------------------------------------------------
  // KEYBOARD NAVIGATION (PHASE-STUDIO-20)
  // ---------------------------------------------------------------------------

  selectNext: () => {
    const { componentId: selectedId } = get();
    const editorState = useEditorStore.getState();
    const { data } = editorState;
    const components = data.components;
    const rootChildren = data.root.children;

    if (!selectedId) {
      // No selection, select first root child
      if (rootChildren.length > 0) {
        set({
          componentId: rootChildren[0],
          componentIds: [rootChildren[0]],
          isMultiSelect: false,
        });
      }
      return;
    }

    const current = components[selectedId];
    if (!current) return;

    // If current has children, select first child
    if (current.children && current.children.length > 0) {
      const firstChild = current.children[0];
      set({
        componentId: firstChild,
        componentIds: [firstChild],
        isMultiSelect: false,
      });
      return;
    }

    // Otherwise, try next sibling
    const parentId = current.parentId;
    const siblings = parentId
      ? components[parentId]?.children || []
      : rootChildren;

    const currentIndex = siblings.indexOf(selectedId);
    if (currentIndex < siblings.length - 1) {
      const nextSibling = siblings[currentIndex + 1];
      set({
        componentId: nextSibling,
        componentIds: [nextSibling],
        isMultiSelect: false,
      });
      return;
    }

    // No next sibling, go to parent's next sibling (recurse up)
    let parent = parentId ? components[parentId] : null;
    while (parent) {
      const parentParentId = parent.parentId;
      const parentSiblings = parentParentId
        ? components[parentParentId]?.children || []
        : rootChildren;
      
      const parentIndex = parentSiblings.indexOf(parent.id);
      if (parentIndex < parentSiblings.length - 1) {
        const nextParentSibling = parentSiblings[parentIndex + 1];
        set({
          componentId: nextParentSibling,
          componentIds: [nextParentSibling],
          isMultiSelect: false,
        });
        return;
      }
      parent = parentParentId ? components[parentParentId] : null;
    }
  },

  selectPrevious: () => {
    const { componentId: selectedId } = get();
    const editorState = useEditorStore.getState();
    const { data } = editorState;
    const components = data.components;
    const rootChildren = data.root.children;

    if (!selectedId) {
      // No selection, select last root child
      if (rootChildren.length > 0) {
        const lastChild = rootChildren[rootChildren.length - 1];
        set({
          componentId: lastChild,
          componentIds: [lastChild],
          isMultiSelect: false,
        });
      }
      return;
    }

    const current = components[selectedId];
    if (!current) return;

    const parentId = current.parentId;
    const siblings = parentId
      ? components[parentId]?.children || []
      : rootChildren;

    const currentIndex = siblings.indexOf(selectedId);

    if (currentIndex > 0) {
      // Go to previous sibling, then to its last descendant
      let target = siblings[currentIndex - 1];
      let targetComp = components[target];

      // Traverse to deepest last child
      while (targetComp?.children && targetComp.children.length > 0) {
        target = targetComp.children[targetComp.children.length - 1];
        targetComp = components[target];
      }

      set({
        componentId: target,
        componentIds: [target],
        isMultiSelect: false,
      });
      return;
    }

    // No previous sibling, go to parent
    if (parentId) {
      set({
        componentId: parentId,
        componentIds: [parentId],
        isMultiSelect: false,
      });
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
