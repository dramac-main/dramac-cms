/**
 * DRAMAC Studio UI Store
 * 
 * State for UI elements: panels, zoom, breakpoint, editor mode.
 * Persists preferences to localStorage.
 * 
 * NOTE: Uses hydration-safe pattern to avoid SSR/client mismatch.
 * Components should use `useHydratedUIStore` for panel state.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
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
      // Skip hydration on server - we'll handle it manually
      skipHydration: true,
    }
  )
);

// =============================================================================
// HYDRATION HOOK
// =============================================================================

/**
 * Hydration-safe hook for UI store.
 * Prevents SSR/client mismatch by waiting for client-side hydration.
 * 
 * @returns The hydrated UI store state, or initial state during SSR
 */
export function useHydratedUIStore<T>(selector: (state: UIStore) => T): T {
  const storeValue = useUIStore(selector);
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    // Rehydrate store from localStorage on client
    useUIStore.persist.rehydrate();
    setHydrated(true);
  }, []);
  
  // During SSR or before hydration, use initial state values
  if (!hydrated) {
    // Return the selector applied to initial state
    const initialStoreState = {
      ...initialState,
      togglePanel: () => {},
      setPanelOpen: () => {},
      setAllPanels: () => {},
      setBreakpoint: () => {},
      setZoom: () => {},
      zoomIn: () => {},
      zoomOut: () => {},
      resetZoom: () => {},
      setMode: () => {},
      togglePreview: () => {},
      setDragging: () => {},
      toggleGrid: () => {},
      toggleOutlines: () => {},
      resetUI: () => {},
    } as UIStore;
    return selector(initialStoreState);
  }
  
  return storeValue;
}

/**
 * Hook to check if UI store is hydrated
 */
export function useUIStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    // Perform hydration
    useUIStore.persist.rehydrate();
    setHydrated(true);
  }, []);
  
  return hydrated;
}

// =============================================================================
// SELECTORS
// =============================================================================

export const selectBreakpoint = (state: UIStore) => state.breakpoint;
export const selectZoom = (state: UIStore) => state.zoom;
export const selectPanels = (state: UIStore) => state.panels;
export const selectMode = (state: UIStore) => state.mode;
export const selectIsDragging = (state: UIStore) => state.isDragging;
