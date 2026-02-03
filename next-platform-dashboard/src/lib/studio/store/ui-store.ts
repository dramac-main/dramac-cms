/**
 * DRAMAC Studio UI Store
 * 
 * State for UI elements: panels, zoom, breakpoint, editor mode.
 * Extended in PHASE-STUDIO-18 with responsive preview state.
 */

import { create } from "zustand";
import type { Breakpoint, EditorMode, PanelState, UIState } from "@/types/studio";
import { 
  getBreakpointFromWidth,
  getDevicePreset,
  DEFAULT_DEVICE_FOR_BREAKPOINT,
} from "@/lib/studio/data/device-presets";

// =============================================================================
// TYPES
// =============================================================================

export interface ResponsivePreviewState {
  /** Selected device preset ID */
  selectedDeviceId: string;
  /** Viewport width in pixels */
  viewportWidth: number;
  /** Viewport height in pixels */
  viewportHeight: number;
  /** Whether device is in landscape mode */
  isLandscape: boolean;
  /** Show device frame (bezel) */
  showDeviceFrame: boolean;
  /** Show ruler on canvas edges */
  showRuler: boolean;
}

/** PHASE-STUDIO-20: Keyboard shortcuts & Command palette state */
export interface ShortcutsState {
  /** Command palette open state */
  commandPaletteOpen: boolean;
  /** Shortcuts help panel open state */
  shortcutsPanelOpen: boolean;
  /** AI Chat panel open state */
  aiChatOpen: boolean;
  /** AI Page Generator open state */
  aiGeneratorOpen: boolean;
  /** Settings panel open state */
  settingsPanelOpen: boolean;
}

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
  
  // Responsive preview (PHASE-STUDIO-18)
  setDevice: (deviceId: string, width: number, height: number) => void;
  setViewportDimensions: (width: number, height: number) => void;
  fitToScreen: (containerWidth: number, containerHeight: number) => void;
  toggleOrientation: () => void;
  toggleDeviceFrame: () => void;
  toggleRuler: () => void;
  
  // Keyboard shortcuts & Command palette (PHASE-STUDIO-20)
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutsPanelOpen: (open: boolean) => void;
  setAIChatOpen: (open: boolean) => void;
  setAIGeneratorOpen: (open: boolean) => void;
  setSettingsPanelOpen: (open: boolean) => void;
  setDevicePreset: (presetId: string) => void;
  
  // Reset
  resetUI: () => void;
}

export type UIStore = UIState & UIActions & ResponsivePreviewState & ShortcutsState;

// =============================================================================
// CONSTANTS
// =============================================================================

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: UIState & ResponsivePreviewState & ShortcutsState = {
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
  // Responsive preview defaults (PHASE-STUDIO-18)
  selectedDeviceId: 'desktop-hd',
  viewportWidth: 1920,
  viewportHeight: 1080,
  isLandscape: false,
  showDeviceFrame: false,
  showRuler: false,
  // Shortcuts & Command palette defaults (PHASE-STUDIO-20)
  commandPaletteOpen: false,
  shortcutsPanelOpen: false,
  aiChatOpen: false,
  aiGeneratorOpen: false,
  settingsPanelOpen: false,
};

// =============================================================================
// STORE IMPLEMENTATION (NO PERSIST - FOR DEBUGGING)
// =============================================================================

export const useUIStore = create<UIStore>()((set, get) => ({
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
    // Get the default device for this breakpoint
    const defaultDeviceId = DEFAULT_DEVICE_FOR_BREAKPOINT[breakpoint];
    const preset = getDevicePreset(defaultDeviceId);
    
    if (preset) {
      // Sync device with breakpoint
      set({
        breakpoint,
        selectedDeviceId: defaultDeviceId,
        viewportWidth: preset.width,
        viewportHeight: preset.height,
      });
    } else {
      // Fallback: just set breakpoint
      set({ breakpoint });
    }
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
  // RESPONSIVE PREVIEW (PHASE-STUDIO-18)
  // ---------------------------------------------------------------------------
  
  setDevice: (deviceId, width, height) => {
    set({
      selectedDeviceId: deviceId,
      viewportWidth: width,
      viewportHeight: height,
      breakpoint: getBreakpointFromWidth(width),
    });
  },
  
  setViewportDimensions: (width, height) => {
    set({
      viewportWidth: width,
      viewportHeight: height,
      breakpoint: getBreakpointFromWidth(width),
      selectedDeviceId: 'custom',
    });
  },
  
  fitToScreen: (containerWidth, containerHeight) => {
    const { viewportWidth, viewportHeight } = get();
    const padding = 80; // Padding around canvas
    
    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;
    
    const scaleX = availableWidth / viewportWidth;
    const scaleY = availableHeight / viewportHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't exceed 100%
    
    set({ zoom: Math.max(MIN_ZOOM, Math.round(scale * 100) / 100) });
  },
  
  toggleOrientation: () => {
    const { viewportWidth, viewportHeight, isLandscape } = get();
    set({
      viewportWidth: viewportHeight,
      viewportHeight: viewportWidth,
      isLandscape: !isLandscape,
      breakpoint: getBreakpointFromWidth(viewportHeight), // Swapped
    });
  },
  
  toggleDeviceFrame: () => {
    set((state) => ({ showDeviceFrame: !state.showDeviceFrame }));
  },
  
  toggleRuler: () => {
    set((state) => ({ showRuler: !state.showRuler }));
  },

  // ---------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS & COMMAND PALETTE (PHASE-STUDIO-20)
  // ---------------------------------------------------------------------------
  
  setCommandPaletteOpen: (open) => {
    set({ commandPaletteOpen: open });
  },
  
  setShortcutsPanelOpen: (open) => {
    set({ shortcutsPanelOpen: open });
  },
  
  setAIChatOpen: (open) => {
    set({ aiChatOpen: open });
  },
  
  setAIGeneratorOpen: (open) => {
    set({ aiGeneratorOpen: open });
  },
  
  setSettingsPanelOpen: (open) => {
    set({ settingsPanelOpen: open });
  },
  
  setDevicePreset: (presetId) => {
    const preset = getDevicePreset(presetId);
    if (preset) {
      set({
        selectedDeviceId: presetId,
        viewportWidth: preset.width,
        viewportHeight: preset.height,
        breakpoint: getBreakpointFromWidth(preset.width),
      });
    }
  },

  // ---------------------------------------------------------------------------
  // RESET
  // ---------------------------------------------------------------------------
  
  resetUI: () => {
    set(initialState);
  },
}));

// =============================================================================
// SELECTORS
// =============================================================================

export const selectBreakpoint = (state: UIStore) => state.breakpoint;
export const selectZoom = (state: UIStore) => state.zoom;
export const selectPanels = (state: UIStore) => state.panels;
export const selectMode = (state: UIStore) => state.mode;
export const selectIsDragging = (state: UIStore) => state.isDragging;
export const selectViewport = (state: UIStore) => ({
  width: state.viewportWidth,
  height: state.viewportHeight,
  deviceId: state.selectedDeviceId,
  isLandscape: state.isLandscape,
});
export const selectPreviewOptions = (state: UIStore) => ({
  showDeviceFrame: state.showDeviceFrame,
  showRuler: state.showRuler,
});
