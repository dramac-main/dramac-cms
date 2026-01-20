"use client";

import { useEditor } from "@craftjs/core";

/**
 * Custom hook to detect if the component is being rendered in edit mode or view mode.
 * 
 * When enabled=true (editor mode), links should be prevented from navigating.
 * When enabled=false (preview/published mode), links should work normally.
 * 
 * @returns boolean - true if in edit mode, false if in view/published mode
 */
export function useIsEditorEnabled(): boolean {
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return enabled;
}

/**
 * Returns a click handler that prevents navigation only in editor mode.
 * In published/preview mode, allows normal link behavior.
 */
export function usePreventEditorNavigation() {
  const isEditorEnabled = useIsEditorEnabled();

  return (e: React.MouseEvent) => {
    if (isEditorEnabled) {
      e.preventDefault();
    }
  };
}
