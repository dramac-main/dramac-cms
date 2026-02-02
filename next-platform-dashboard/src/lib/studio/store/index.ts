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
  useHydratedUIStore,
  useUIStoreHydrated,
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
import type { StudioComponent } from "@/types/studio";

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
  const temporal = useEditorStore.temporal.getState();
  
  return {
    canUndo: temporal.pastStates.length > 0,
    canRedo: temporal.futureStates.length > 0,
    undoCount: temporal.pastStates.length,
    redoCount: temporal.futureStates.length,
  };
}
