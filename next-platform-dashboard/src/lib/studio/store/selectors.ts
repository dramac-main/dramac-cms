/**
 * DRAMAC Studio Optimized Selectors
 * 
 * Pre-built selectors using shallow comparison to prevent unnecessary re-renders.
 * Based on actual store structures from editor-store, selection-store, ui-store.
 * 
 * @phase STUDIO-21
 */

"use client";

import { useShallow } from "zustand/react/shallow";
import { useEditorStore } from "./editor-store";
import { useSelectionStore } from "./selection-store";
import { useUIStore } from "./ui-store";
import type { StudioComponent } from "@/types/studio";

// =============================================================================
// EDITOR STORE SELECTORS
// =============================================================================

/**
 * Get page data state (commonly used together)
 */
export function usePageDataState() {
  return useEditorStore(
    useShallow((state) => ({
      data: state.data,
      pageId: state.pageId,
      siteId: state.siteId,
      isDirty: state.isDirty,
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
}

/**
 * Get component operations
 */
export function useComponentOperations() {
  return useEditorStore(
    useShallow((state) => ({
      addComponent: state.addComponent,
      updateComponent: state.updateComponent,
      updateComponentProps: state.updateComponentProps,
      deleteComponent: state.deleteComponent,
      duplicateComponent: state.duplicateComponent,
      moveComponent: state.moveComponent,
      deleteComponents: state.deleteComponents,
    }))
  );
}

/**
 * Get a single component by ID - optimized for single component access
 */
export function useComponentById(id: string): StudioComponent | undefined {
  return useEditorStore((state) => state.data.components[id]);
}

/**
 * Get root children IDs
 */
export function useRootChildrenIds(): string[] {
  return useEditorStore((state) => state.data.root.children);
}

/**
 * Get all components as array (for lists)
 */
export function useComponentsArray(): StudioComponent[] {
  return useEditorStore((state) => Object.values(state.data.components));
}

/**
 * Get component count (for virtualization decisions)
 */
export function useComponentCount(): number {
  return useEditorStore((state) => Object.keys(state.data.components).length);
}

/**
 * Get editor save state
 */
export function useSaveState() {
  return useEditorStore(
    useShallow((state) => ({
      isDirty: state.isDirty,
      isSaving: state.isSaving,
      lastSavedAt: state.lastSavedAt,
      markDirty: state.markDirty,
      markSaved: state.markSaved,
      setSaving: state.setSaving,
    }))
  );
}

/**
 * Get zone children
 */
export function useZoneChildrenIds(zoneId: string): string[] {
  return useEditorStore((state) => state.data.zones?.[zoneId] ?? []);
}

/**
 * Get page initialization actions
 */
export function useEditorInitActions() {
  return useEditorStore(
    useShallow((state) => ({
      initialize: state.initialize,
      reset: state.reset,
      setLoading: state.setLoading,
      setError: state.setError,
    }))
  );
}

// =============================================================================
// SELECTION STORE SELECTORS
// =============================================================================

/**
 * Get selection state
 */
export function useSelectionState() {
  return useSelectionStore(
    useShallow((state) => ({
      componentId: state.componentId,
      componentIds: state.componentIds,
      isMultiSelect: state.isMultiSelect,
    }))
  );
}

/**
 * Get selection actions only
 */
export function useSelectionActions() {
  return useSelectionStore(
    useShallow((state) => ({
      select: state.select,
      toggleSelect: state.toggleSelect,
      addToSelection: state.addToSelection,
      removeFromSelection: state.removeFromSelection,
      selectMultiple: state.selectMultiple,
      clearSelection: state.clearSelection,
      isSelected: state.isSelected,
      setMultiSelect: state.setMultiSelect,
      selectNext: state.selectNext,
      selectPrevious: state.selectPrevious,
    }))
  );
}

/**
 * Check if a specific component is selected
 */
export function useIsSelected(id: string): boolean {
  return useSelectionStore((state) => state.componentIds.includes(id));
}

/**
 * Get primary selected component ID
 */
export function usePrimarySelectedId(): string | null {
  return useSelectionStore((state) => state.componentId);
}

/**
 * Get selected component IDs
 */
export function useSelectedComponentIds(): string[] {
  return useSelectionStore((state) => state.componentIds);
}

// =============================================================================
// UI STORE SELECTORS
// =============================================================================

/**
 * Get panel visibility state
 */
export function usePanelVisibility() {
  return useUIStore(
    useShallow((state) => ({
      panels: state.panels,
      togglePanel: state.togglePanel,
      setPanelOpen: state.setPanelOpen,
    }))
  );
}

/**
 * Get zoom state
 */
export function useZoomState() {
  return useUIStore(
    useShallow((state) => ({
      zoom: state.zoom,
      setZoom: state.setZoom,
      zoomIn: state.zoomIn,
      zoomOut: state.zoomOut,
      resetZoom: state.resetZoom,
    }))
  );
}

/**
 * Get breakpoint/viewport state (PHASE-STUDIO-18)
 */
export function useViewportState() {
  return useUIStore(
    useShallow((state) => ({
      breakpoint: state.breakpoint,
      setBreakpoint: state.setBreakpoint,
      selectedDeviceId: state.selectedDeviceId,
      viewportWidth: state.viewportWidth,
      viewportHeight: state.viewportHeight,
      isLandscape: state.isLandscape,
      showDeviceFrame: state.showDeviceFrame,
      showRuler: state.showRuler,
      setDevice: state.setDevice,
      setViewportDimensions: state.setViewportDimensions,
      toggleOrientation: state.toggleOrientation,
      toggleDeviceFrame: state.toggleDeviceFrame,
      toggleRuler: state.toggleRuler,
    }))
  );
}

/**
 * Get editor mode state
 */
export function useModeState() {
  return useUIStore(
    useShallow((state) => ({
      mode: state.mode,
      setMode: state.setMode,
      togglePreview: state.togglePreview,
    }))
  );
}

/**
 * Get modal/dialog state (PHASE-STUDIO-20)
 */
export function useDialogState() {
  return useUIStore(
    useShallow((state) => ({
      commandPaletteOpen: state.commandPaletteOpen,
      shortcutsPanelOpen: state.shortcutsPanelOpen,
      aiChatOpen: state.aiChatOpen,
      aiGeneratorOpen: state.aiGeneratorOpen,
      settingsPanelOpen: state.settingsPanelOpen,
      setCommandPaletteOpen: state.setCommandPaletteOpen,
      setShortcutsPanelOpen: state.setShortcutsPanelOpen,
      setAIChatOpen: state.setAIChatOpen,
      setAIGeneratorOpen: state.setAIGeneratorOpen,
      setSettingsPanelOpen: state.setSettingsPanelOpen,
    }))
  );
}

/**
 * Get drag state
 */
export function useDragState() {
  return useUIStore(
    useShallow((state) => ({
      isDragging: state.isDragging,
      draggedType: state.draggedType,
      setDragging: state.setDragging,
    }))
  );
}

/**
 * Get display options
 */
export function useDisplayOptions() {
  return useUIStore(
    useShallow((state) => ({
      showGrid: state.showGrid,
      showOutlines: state.showOutlines,
      toggleGrid: state.toggleGrid,
      toggleOutlines: state.toggleOutlines,
    }))
  );
}

// =============================================================================
// COMBINED SELECTORS
// =============================================================================

/**
 * Get selected component data (combines editor + selection stores)
 */
export function useSelectedComponent(): StudioComponent | null {
  const componentId = useSelectionStore((state) => state.componentId);
  
  return useEditorStore((state) => {
    if (!componentId) return null;
    return state.data.components[componentId] ?? null;
  });
}

/**
 * Get all selected components
 */
export function useSelectedComponents(): StudioComponent[] {
  const componentIds = useSelectionStore((state) => state.componentIds);
  
  return useEditorStore((state) =>
    componentIds
      .map((id) => state.data.components[id])
      .filter((c): c is StudioComponent => c !== undefined)
  );
}

/**
 * Check if editor has any components
 */
export function useHasComponents(): boolean {
  return useEditorStore((state) => Object.keys(state.data.components).length > 0);
}

/**
 * Check if anything is selected
 */
export function useHasSelection(): boolean {
  return useSelectionStore((state) => state.componentIds.length > 0);
}

/**
 * Check if editor is ready (not loading, no error)
 */
export function useIsEditorReady(): boolean {
  return useEditorStore((state) => !state.isLoading && !state.error);
}
