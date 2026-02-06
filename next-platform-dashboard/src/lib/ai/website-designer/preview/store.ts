/**
 * PHASE AWD-08: Preview & Iteration System
 * Zustand Store for Preview State Management
 *
 * Manages the preview state, undo/redo history,
 * device selection, and iteration tracking.
 */

import { create } from "zustand";
import type {
  PreviewState,
  DeviceType,
  PreviewStoreState,
} from "./types";

/**
 * Preview Store
 * 
 * Manages:
 * - Current preview state
 * - State history for undo/redo
 * - Active device and page
 * - Refinement panel visibility
 */
export const usePreviewStore = create<PreviewStoreState>((set, get) => ({
  // Initial state
  previewState: null,
  stateHistory: [],
  currentIndex: -1,
  isRefining: false,
  activeDevice: "desktop",
  activePage: 0,
  showRefinementPanel: false,

  // Actions
  setPreviewState: (state) => {
    set({
      previewState: state,
      stateHistory: [state],
      currentIndex: 0,
      activePage: 0,
    });
  },

  setActiveDevice: (device) => {
    set({ activeDevice: device });
  },

  setActivePage: (index) => {
    set({ activePage: index });
  },

  setShowRefinementPanel: (show) => {
    set({ showRefinementPanel: show });
  },

  pushState: (state) => {
    const { stateHistory, currentIndex } = get();
    // Trim any future history (if we undid and then made changes)
    const newHistory = stateHistory.slice(0, currentIndex + 1);
    newHistory.push(state);

    set({
      previewState: state,
      stateHistory: newHistory,
      currentIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { currentIndex, stateHistory } = get();
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      set({
        previewState: stateHistory[newIndex],
        currentIndex: newIndex,
      });
    }
  },

  redo: () => {
    const { currentIndex, stateHistory } = get();
    if (currentIndex < stateHistory.length - 1) {
      const newIndex = currentIndex + 1;
      set({
        previewState: stateHistory[newIndex],
        currentIndex: newIndex,
      });
    }
  },

  setRefining: (refining) => {
    set({ isRefining: refining });
  },

  approve: () => {
    const { previewState, stateHistory, currentIndex } = get();
    if (!previewState) return null;

    const approvedState: PreviewState = {
      ...previewState,
      status: "approved",
    };

    const newHistory = [...stateHistory];
    newHistory[currentIndex] = approvedState;

    set({
      previewState: approvedState,
      stateHistory: newHistory,
    });

    return approvedState;
  },

  reset: () => {
    set({
      previewState: null,
      stateHistory: [],
      currentIndex: -1,
      isRefining: false,
      activeDevice: "desktop",
      activePage: 0,
      showRefinementPanel: false,
    });
  },
}));

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Select current preview state
 */
export const selectPreviewState = (state: PreviewStoreState) => state.previewState;

/**
 * Select if can undo
 */
export const selectCanUndo = (state: PreviewStoreState) => state.currentIndex > 0;

/**
 * Select if can redo
 */
export const selectCanRedo = (state: PreviewStoreState) =>
  state.currentIndex < state.stateHistory.length - 1;

/**
 * Select current page
 */
export const selectCurrentPage = (state: PreviewStoreState) => {
  const { previewState, activePage } = state;
  return previewState?.pages[activePage] ?? null;
};

/**
 * Select iteration count
 */
export const selectIterationCount = (state: PreviewStoreState) =>
  state.previewState?.iterations.length ?? 0;

/**
 * Select preview status
 */
export const selectStatus = (state: PreviewStoreState) =>
  state.previewState?.status ?? null;

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for undo/redo capabilities
 */
export function usePreviewHistory() {
  const canUndo = usePreviewStore(selectCanUndo);
  const canRedo = usePreviewStore(selectCanRedo);
  const undo = usePreviewStore((s) => s.undo);
  const redo = usePreviewStore((s) => s.redo);

  return { canUndo, canRedo, undo, redo };
}

/**
 * Hook for current page
 */
export function useCurrentPage() {
  return usePreviewStore(selectCurrentPage);
}

/**
 * Hook for preview status
 */
export function usePreviewStatus() {
  return usePreviewStore(selectStatus);
}
