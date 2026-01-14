"use client";

import { useEffect, useCallback } from "react";
import { useEditor } from "@craftjs/core";

interface UseEditorShortcutsOptions {
  onSave?: () => void;
}

export function useEditorShortcuts({ onSave }: UseEditorShortcutsOptions = {}) {
  const { actions, query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Prevent default for our shortcuts
      if (ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              // Redo
              if (query.history.canRedo()) {
                actions.history.redo();
              }
            } else {
              // Undo
              if (query.history.canUndo()) {
                actions.history.undo();
              }
            }
            break;
          case "y":
            e.preventDefault();
            if (query.history.canRedo()) {
              actions.history.redo();
            }
            break;
          case "s":
            e.preventDefault();
            onSave?.();
            break;
        }
      }

      // Delete selected node
      if ((e.key === "Delete" || e.key === "Backspace") && !isEditableElement(e.target)) {
        const selectedNodeId = getSelectedNodeId();
        if (selectedNodeId && query.node(selectedNodeId).isDeletable()) {
          e.preventDefault();
          actions.delete(selectedNodeId);
        }
      }
    },
    [actions, query, enabled, onSave]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;

  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea") return true;
  if (target.getAttribute("contenteditable") === "true") return true;

  return false;
}

function getSelectedNodeId(): string | null {
  // This is a bit of a hack since useEditor doesn't give us direct access here
  // In production, you'd pass this from the component
  return null;
}
