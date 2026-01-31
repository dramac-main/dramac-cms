/**
 * Editor Keyboard Shortcuts
 * 
 * Comprehensive keyboard shortcuts system for the Puck editor.
 * Provides a shortcuts panel and hook for managing editor shortcuts.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Keyboard,
  X,
  Save,
  Eye,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Plus,
  HelpCircle,
  Command,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Shortcut definitions
export interface KeyboardShortcut {
  id: string;
  keys: string[];
  label: string;
  description?: string;
  icon?: React.ReactNode;
  category: ShortcutCategory;
  action?: () => void;
}

type ShortcutCategory = 
  | "file" 
  | "edit" 
  | "view" 
  | "canvas" 
  | "components" 
  | "navigation";

const categoryLabels: Record<ShortcutCategory, string> = {
  file: "File",
  edit: "Edit",
  view: "View",
  canvas: "Canvas",
  components: "Components",
  navigation: "Navigation",
};

const categoryIcons: Record<ShortcutCategory, React.ReactNode> = {
  file: <Save className="w-4 h-4" />,
  edit: <Scissors className="w-4 h-4" />,
  view: <Eye className="w-4 h-4" />,
  canvas: <Maximize2 className="w-4 h-4" />,
  components: <Plus className="w-4 h-4" />,
  navigation: <Search className="w-4 h-4" />,
};

// Default editor shortcuts
export const defaultEditorShortcuts: KeyboardShortcut[] = [
  // File operations
  {
    id: "save",
    keys: ["Ctrl", "S"],
    label: "Save",
    description: "Save current changes",
    icon: <Save className="w-4 h-4" />,
    category: "file",
  },
  {
    id: "preview",
    keys: ["Ctrl", "P"],
    label: "Preview",
    description: "Toggle preview mode",
    icon: <Eye className="w-4 h-4" />,
    category: "file",
  },
  
  // Edit operations
  {
    id: "undo",
    keys: ["Ctrl", "Z"],
    label: "Undo",
    description: "Undo last action",
    icon: <Undo2 className="w-4 h-4" />,
    category: "edit",
  },
  {
    id: "redo",
    keys: ["Ctrl", "Shift", "Z"],
    label: "Redo",
    description: "Redo last action",
    icon: <Redo2 className="w-4 h-4" />,
    category: "edit",
  },
  {
    id: "copy",
    keys: ["Ctrl", "C"],
    label: "Copy",
    description: "Copy selected component",
    icon: <Copy className="w-4 h-4" />,
    category: "edit",
  },
  {
    id: "cut",
    keys: ["Ctrl", "X"],
    label: "Cut",
    description: "Cut selected component",
    icon: <Scissors className="w-4 h-4" />,
    category: "edit",
  },
  {
    id: "paste",
    keys: ["Ctrl", "V"],
    label: "Paste",
    description: "Paste component",
    icon: <Clipboard className="w-4 h-4" />,
    category: "edit",
  },
  {
    id: "delete",
    keys: ["Delete"],
    label: "Delete",
    description: "Delete selected component",
    icon: <Trash2 className="w-4 h-4" />,
    category: "edit",
  },
  {
    id: "duplicate",
    keys: ["Ctrl", "D"],
    label: "Duplicate",
    description: "Duplicate selected component",
    icon: <Copy className="w-4 h-4" />,
    category: "edit",
  },
  
  // View operations
  {
    id: "zoom-in",
    keys: ["Ctrl", "+"],
    label: "Zoom In",
    description: "Increase canvas zoom",
    icon: <ZoomIn className="w-4 h-4" />,
    category: "view",
  },
  {
    id: "zoom-out",
    keys: ["Ctrl", "-"],
    label: "Zoom Out",
    description: "Decrease canvas zoom",
    icon: <ZoomOut className="w-4 h-4" />,
    category: "view",
  },
  {
    id: "zoom-fit",
    keys: ["Ctrl", "0"],
    label: "Fit to Screen",
    description: "Reset zoom to fit canvas",
    icon: <Maximize2 className="w-4 h-4" />,
    category: "view",
  },
  {
    id: "fullscreen",
    keys: ["F11"],
    label: "Fullscreen",
    description: "Toggle fullscreen mode",
    icon: <Maximize2 className="w-4 h-4" />,
    category: "view",
  },
  
  // Canvas
  {
    id: "select-all",
    keys: ["Ctrl", "A"],
    label: "Select All",
    description: "Select all components",
    category: "canvas",
  },
  {
    id: "deselect",
    keys: ["Escape"],
    label: "Deselect",
    description: "Deselect current component",
    category: "canvas",
  },
  
  // Components
  {
    id: "add-component",
    keys: ["Ctrl", "Shift", "A"],
    label: "Add Component",
    description: "Open component picker",
    icon: <Plus className="w-4 h-4" />,
    category: "components",
  },
  {
    id: "search-components",
    keys: ["Ctrl", "K"],
    label: "Search Components",
    description: "Quick search for components",
    icon: <Search className="w-4 h-4" />,
    category: "components",
  },
  
  // Navigation
  {
    id: "help",
    keys: ["?"],
    label: "Help",
    description: "Show keyboard shortcuts",
    icon: <HelpCircle className="w-4 h-4" />,
    category: "navigation",
  },
  {
    id: "settings",
    keys: ["Ctrl", ","],
    label: "Settings",
    description: "Open editor settings",
    icon: <Settings className="w-4 h-4" />,
    category: "navigation",
  },
];

/**
 * Single key badge component
 */
function KeyBadge({ keyName }: { keyName: string }) {
  // Convert key names to symbols where appropriate
  const displayKey = (() => {
    switch (keyName.toLowerCase()) {
      case "ctrl":
        return "⌃";
      case "cmd":
      case "meta":
        return "⌘";
      case "shift":
        return "⇧";
      case "alt":
        return "⌥";
      case "enter":
        return "↵";
      case "escape":
        return "Esc";
      case "delete":
        return "Del";
      case "backspace":
        return "⌫";
      case "tab":
        return "⇥";
      case "space":
        return "Space";
      default:
        return keyName;
    }
  })();

  return (
    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-medium bg-muted border border-border rounded shadow-sm">
      {displayKey}
    </span>
  );
}

/**
 * Key combination display
 */
export function KeyCombination({ 
  keys, 
  size = "default" 
}: { 
  keys: string[];
  size?: "sm" | "default";
}) {
  return (
    <div className={cn(
      "inline-flex items-center",
      size === "sm" ? "gap-0.5" : "gap-1"
    )}>
      {keys.map((key, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {i > 0 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
          <KeyBadge keyName={key} />
        </span>
      ))}
    </div>
  );
}

/**
 * Shortcut item row
 */
function ShortcutItem({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {shortcut.icon && (
          <span className="text-muted-foreground">{shortcut.icon}</span>
        )}
        <div>
          <p className="text-sm font-medium">{shortcut.label}</p>
          {shortcut.description && (
            <p className="text-xs text-muted-foreground">{shortcut.description}</p>
          )}
        </div>
      </div>
      <KeyCombination keys={shortcut.keys} />
    </div>
  );
}

/**
 * Keyboard shortcuts panel/modal
 */
interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
}

export function KeyboardShortcutsPanel({
  isOpen,
  onClose,
  shortcuts = defaultEditorShortcuts,
}: KeyboardShortcutsPanelProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<ShortcutCategory, KeyboardShortcut[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] z-50 mx-auto max-w-3xl overflow-hidden rounded-xl border bg-card shadow-2xl md:inset-x-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Keyboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                  <p className="text-sm text-muted-foreground">
                    Speed up your workflow with these shortcuts
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(100% - 80px)" }}>
              <div className="grid gap-6 md:grid-cols-2">
                {(Object.keys(groupedShortcuts) as ShortcutCategory[]).map((category) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                      {categoryIcons[category]}
                      <span>{categoryLabels[category]}</span>
                    </div>
                    <div className="space-y-1">
                      {groupedShortcuts[category].map((shortcut) => (
                        <ShortcutItem key={shortcut.id} shortcut={shortcut} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="mt-8 rounded-lg bg-muted/50 p-4">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Command className="w-4 h-4" />
                  Pro Tips
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Press <KeyBadge keyName="?" /> anytime to show this panel</li>
                  <li>• Use <KeyCombination keys={["Ctrl", "K"]} size="sm" /> for quick component search</li>
                  <li>• Hold <KeyBadge keyName="Shift" /> while dragging to snap to grid</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Floating shortcut hint
 */
export function ShortcutHint({
  keys,
  label,
  className,
}: {
  keys: string[];
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      {label && <span>{label}:</span>}
      <KeyCombination keys={keys} size="sm" />
    </div>
  );
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useEditorShortcuts({
  onSave,
  onUndo,
  onRedo,
  onTogglePreview,
  onDelete,
  onDuplicate,
  onShowShortcuts,
  enabled = true,
}: {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onTogglePreview?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onShowShortcuts?: () => void;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      
      // Don't trigger shortcuts when typing in inputs
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Still allow save
        if (isCtrlOrCmd && e.key === "s") {
          e.preventDefault();
          onSave?.();
        }
        return;
      }

      // Save: Ctrl/Cmd + S
      if (isCtrlOrCmd && e.key === "s") {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((isCtrlOrCmd && e.key === "z" && e.shiftKey) || (isCtrlOrCmd && e.key === "y")) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Preview: Ctrl/Cmd + P
      if (isCtrlOrCmd && e.key === "p") {
        e.preventDefault();
        onTogglePreview?.();
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        onDelete?.();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (isCtrlOrCmd && e.key === "d") {
        e.preventDefault();
        onDuplicate?.();
        return;
      }

      // Show shortcuts: ?
      if (e.key === "?" && !isCtrlOrCmd) {
        e.preventDefault();
        onShowShortcuts?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onSave, onUndo, onRedo, onTogglePreview, onDelete, onDuplicate, onShowShortcuts]);
}

export default KeyboardShortcutsPanel;
