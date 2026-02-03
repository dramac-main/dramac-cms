/**
 * DRAMAC Studio Shortcuts Hook
 * 
 * Main hook that registers all keyboard shortcuts for the editor.
 * Uses react-hotkeys-hook for cross-platform key binding.
 * 
 * @phase STUDIO-20
 */

"use client";

import { useCallback } from "react";
import { useHotkeys, Options } from "react-hotkeys-hook";
import { useEditorStore, useUIStore, useSelectionStore, undo, redo } from "@/lib/studio/store";
import { copyToClipboard, getClipboardData, hasClipboardData } from "@/lib/studio/clipboard";
import { toast } from "sonner";

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Check if an input or editable element is focused
 * When true, shortcuts should not fire (let user type normally)
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();

  // Check standard form elements
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }

  // Check contenteditable
  if (activeElement.getAttribute("contenteditable") === "true") {
    return true;
  }

  // Check if inside a TipTap/ProseMirror editor
  if (activeElement.closest(".ProseMirror")) {
    return true;
  }

  // Check Radix focus guards (modals, dialogs)
  if (activeElement.closest("[data-radix-focus-guard]")) {
    return true;
  }

  // Check Command palette input
  if (activeElement.closest("[cmdk-input]")) {
    return true;
  }

  return false;
}

// =============================================================================
// TYPES
// =============================================================================

export interface UseStudioShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Callback when save is triggered */
  onSave?: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useStudioShortcuts(options: UseStudioShortcutsOptions = {}) {
  const { enabled = true, onSave } = options;

  // Editor store
  const components = useEditorStore((s) => s.data.components);
  const deleteComponent = useEditorStore((s) => s.deleteComponent);
  const duplicateComponent = useEditorStore((s) => s.duplicateComponent);
  const addComponent = useEditorStore((s) => s.addComponent);

  // Selection store
  const selectedId = useSelectionStore((s) => s.componentId);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  // UI store
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setShortcutsPanelOpen = useUIStore((s) => s.setShortcutsPanelOpen);
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);
  const zoomIn = useUIStore((s) => s.zoomIn);
  const zoomOut = useUIStore((s) => s.zoomOut);
  const resetZoom = useUIStore((s) => s.resetZoom);
  const setZoom = useUIStore((s) => s.setZoom);
  const viewportWidth = useUIStore((s) => s.viewportWidth);
  const viewportHeight = useUIStore((s) => s.viewportHeight);
  const setAIChatOpen = useUIStore((s) => s.setAIChatOpen);

  // Base options for all hotkeys
  const baseOptions: Options = {
    enabled,
    preventDefault: true,
  };

  // ---------------------------------------------------------------------------
  // SAVE (Cmd+S / Ctrl+S)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+s",
    (e) => {
      e.preventDefault();
      if (onSave) {
        toast.promise(onSave(), {
          loading: "Saving...",
          success: "Page saved",
          error: "Failed to save",
        });
      } else {
        toast.info("Save handler not configured");
      }
    },
    { ...baseOptions, enableOnFormTags: true }
  );

  // ---------------------------------------------------------------------------
  // UNDO (Cmd+Z / Ctrl+Z)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+z",
    (e) => {
      if (isInputFocused()) return;
      e.preventDefault();
      undo();
      toast.success("Undo", { duration: 1500 });
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // REDO (Cmd+Shift+Z / Ctrl+Shift+Z / Cmd+Y / Ctrl+Y)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+shift+z, mod+y",
    (e) => {
      if (isInputFocused()) return;
      e.preventDefault();
      redo();
      toast.success("Redo", { duration: 1500 });
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // DELETE (Delete / Backspace)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "delete, backspace",
    (e) => {
      if (isInputFocused()) return;
      if (!selectedId) return;

      const component = components[selectedId];
      if (!component) return;

      if (component.locked) {
        toast.error("Component is locked");
        return;
      }

      e.preventDefault();
      deleteComponent(selectedId);
      toast.success("Component deleted", { duration: 1500 });
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // DUPLICATE (Cmd+D / Ctrl+D)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+d",
    (e) => {
      if (isInputFocused()) return;
      if (!selectedId) {
        toast.error("Select a component to duplicate");
        return;
      }

      e.preventDefault();
      const newId = duplicateComponent(selectedId);
      if (newId) {
        toast.success("Component duplicated", { duration: 1500 });
      }
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // COPY (Cmd+C / Ctrl+C)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+c",
    (e) => {
      if (isInputFocused()) return;
      if (!selectedId) return;

      const component = components[selectedId];
      if (!component) return;

      e.preventDefault();
      copyToClipboard(component, components);
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // PASTE (Cmd+V / Ctrl+V)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+v",
    (e) => {
      if (isInputFocused()) return;
      if (!hasClipboardData()) {
        toast.info("Nothing to paste");
        return;
      }

      e.preventDefault();

      const clipboardContent = getClipboardData();
      if (!clipboardContent) return;

      const { component, children } = clipboardContent;

      // Add main component to root or selected container
      const parentId = selectedId || "root";
      const newId = addComponent(component.type, component.props, parentId);

      // Add children to the store directly
      if (children.length > 0) {
        const store = useEditorStore.getState();
        for (const child of children) {
          // Update child's parent to point to new component
          const updatedChild = {
            ...child,
            parentId: child.parentId === clipboardContent.component.id ? newId : child.parentId,
          };
          store.data.components[updatedChild.id] = updatedChild;
        }
      }

      toast.success("Component pasted", { duration: 1500 });
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // DESELECT / ESCAPE
  // ---------------------------------------------------------------------------
  useHotkeys(
    "escape",
    () => {
      const uiState = useUIStore.getState();

      // Close command palette first
      if (uiState.commandPaletteOpen) {
        setCommandPaletteOpen(false);
        return;
      }

      // Close shortcuts panel
      if (uiState.shortcutsPanelOpen) {
        setShortcutsPanelOpen(false);
        return;
      }

      // Close AI chat
      if (uiState.aiChatOpen) {
        setAIChatOpen(false);
        return;
      }

      // Exit preview mode
      if (mode === "preview") {
        setMode("edit");
        toast.success("Edit mode", { duration: 1500 });
        return;
      }

      // Deselect component
      if (selectedId) {
        clearSelection();
      }
    },
    { ...baseOptions, enableOnFormTags: true }
  );

  // ---------------------------------------------------------------------------
  // COMMAND PALETTE (Cmd+K / Ctrl+K)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+k",
    (e) => {
      e.preventDefault();
      setCommandPaletteOpen(true);
    },
    { ...baseOptions, enableOnFormTags: true }
  );

  // ---------------------------------------------------------------------------
  // SHORTCUTS HELP (Cmd+? / Ctrl+Shift+/)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+shift+/",
    (e) => {
      e.preventDefault();
      setShortcutsPanelOpen(true);
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // ZOOM IN (Cmd++ / Ctrl++)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+=, mod+plus",
    (e) => {
      e.preventDefault();
      zoomIn();
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // ZOOM OUT (Cmd+- / Ctrl+-)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+-",
    (e) => {
      e.preventDefault();
      zoomOut();
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // RESET ZOOM (Cmd+0 / Ctrl+0)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+0",
    (e) => {
      e.preventDefault();
      resetZoom();
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // FIT TO SCREEN (Cmd+1 / Ctrl+1)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+1",
    (e) => {
      e.preventDefault();
      // Calculate fit zoom based on current container
      const canvasContainer = document.querySelector("[data-studio-canvas-container]");
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect();
        useUIStore.getState().fitToScreen(rect.width, rect.height);
      }
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // TOGGLE PREVIEW (Cmd+P / Ctrl+P)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+p",
    (e) => {
      e.preventDefault();
      const newMode = mode === "preview" ? "edit" : "preview";
      setMode(newMode);
      toast.success(newMode === "preview" ? "Preview mode" : "Edit mode", { duration: 1500 });
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // AI CHAT (Cmd+/ / Ctrl+/)
  // ---------------------------------------------------------------------------
  useHotkeys(
    "mod+/",
    (e) => {
      if (isInputFocused()) return;
      if (!selectedId) {
        toast.error("Select a component first");
        return;
      }
      e.preventDefault();
      setAIChatOpen(true);
    },
    baseOptions
  );

  // ---------------------------------------------------------------------------
  // ARROW KEY NAVIGATION
  // ---------------------------------------------------------------------------
  useHotkeys(
    "up",
    (e) => {
      if (isInputFocused()) return;
      e.preventDefault();
      useSelectionStore.getState().selectPrevious();
    },
    baseOptions
  );

  useHotkeys(
    "down",
    (e) => {
      if (isInputFocused()) return;
      e.preventDefault();
      useSelectionStore.getState().selectNext();
    },
    baseOptions
  );
}

// =============================================================================
// SHORTCUT DEFINITIONS (For Help Panel)
// =============================================================================

export interface ShortcutDefinition {
  keys: string[];
  description: string;
}

export interface ShortcutGroup {
  category: string;
  shortcuts: ShortcutDefinition[];
}

export const SHORTCUT_DEFINITIONS: ShortcutGroup[] = [
  {
    category: "General",
    shortcuts: [
      { keys: ["⌘/Ctrl", "S"], description: "Save page" },
      { keys: ["⌘/Ctrl", "Z"], description: "Undo" },
      { keys: ["⌘/Ctrl", "Shift", "Z"], description: "Redo" },
      { keys: ["⌘/Ctrl", "K"], description: "Open command palette" },
      { keys: ["⌘/Ctrl", "?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Deselect / Close panel" },
    ],
  },
  {
    category: "Components",
    shortcuts: [
      { keys: ["Delete"], description: "Delete selected component" },
      { keys: ["⌘/Ctrl", "D"], description: "Duplicate selected" },
      { keys: ["⌘/Ctrl", "C"], description: "Copy component" },
      { keys: ["⌘/Ctrl", "V"], description: "Paste component" },
      { keys: ["↑"], description: "Select previous component" },
      { keys: ["↓"], description: "Select next component" },
    ],
  },
  {
    category: "View",
    shortcuts: [
      { keys: ["⌘/Ctrl", "P"], description: "Toggle preview mode" },
      { keys: ["⌘/Ctrl", "+"], description: "Zoom in" },
      { keys: ["⌘/Ctrl", "-"], description: "Zoom out" },
      { keys: ["⌘/Ctrl", "0"], description: "Reset zoom to 100%" },
      { keys: ["⌘/Ctrl", "1"], description: "Fit to screen" },
    ],
  },
  {
    category: "AI",
    shortcuts: [
      { keys: ["⌘/Ctrl", "/"], description: "Open AI chat for selected" },
    ],
  },
  {
    category: "Panels",
    shortcuts: [
      { keys: ["⌘/Ctrl", "\\"], description: "Toggle left panel" },
      { keys: ["⌘/Ctrl", "Shift", "\\"], description: "Toggle right panel" },
      { keys: ["⌘/Ctrl", "J"], description: "Toggle bottom panel" },
    ],
  },
];
