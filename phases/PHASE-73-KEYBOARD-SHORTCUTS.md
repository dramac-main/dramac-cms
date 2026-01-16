# Phase 73: Keyboard Shortcuts - Editor Productivity Shortcuts

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 MEDIUM
>
> **Estimated Time**: 2-3 hours

---

## 🎯 Objective

Implement comprehensive keyboard shortcuts for the visual editor to boost power user productivity, including customizable shortcuts and a discoverable shortcut reference modal.

---

## 📋 Prerequisites

- [ ] Phase 72 Help Center completed
- [ ] Visual editor functional
- [ ] Component selection system working
- [ ] Command system in place

---

## 💼 Business Value

1. **Power User Productivity** - Faster editing for experienced users
2. **Professional Feel** - Expected in modern design tools
3. **Reduced Mouse Fatigue** - Keyboard-first workflows
4. **Competitive Feature** - Match industry standards (Figma, Canva)
5. **Accessibility** - Alternative to mouse interactions

---

## 📁 Files to Create

```
src/lib/shortcuts/
├── shortcut-types.ts            # Type definitions
├── shortcut-registry.ts         # Shortcut definitions
├── shortcut-context.tsx         # Context provider
├── shortcut-utils.ts            # Helper functions

src/components/shortcuts/
├── shortcut-modal.tsx           # Reference modal
├── shortcut-indicator.tsx       # Key display badge
├── shortcut-settings.tsx        # Customization UI

src/hooks/
├── use-shortcuts.ts             # Main shortcut hook
├── use-shortcut-registry.ts     # Registry management
```

---

## ✅ Tasks

### Task 73.1: Shortcut Types

**File: `src/lib/shortcuts/shortcut-types.ts`**

```typescript
export type ShortcutCategory =
  | "general"
  | "selection"
  | "clipboard"
  | "history"
  | "view"
  | "components"
  | "navigation";

export interface Shortcut {
  id: string;
  name: string;
  description: string;
  category: ShortcutCategory;
  keys: ShortcutKeys;
  action: () => void;
  enabled?: boolean;
  when?: ShortcutCondition;
}

export interface ShortcutKeys {
  key: string;           // The main key (lowercase)
  ctrl?: boolean;        // Ctrl on Windows/Linux, Cmd on Mac
  shift?: boolean;
  alt?: boolean;         // Alt on Windows/Linux, Option on Mac
  meta?: boolean;        // Windows key or Cmd specifically
}

export type ShortcutCondition =
  | "editorFocused"
  | "componentSelected"
  | "multipleSelected"
  | "textEditing"
  | "always";

export interface ShortcutCategoryInfo {
  id: ShortcutCategory;
  label: string;
  icon: string;
}

export interface CustomShortcut {
  shortcutId: string;
  customKeys: ShortcutKeys;
}

export interface ShortcutEvent {
  shortcutId: string;
  triggered: Date;
  keys: ShortcutKeys;
}
```

---

### Task 73.2: Shortcut Utilities

**File: `src/lib/shortcuts/shortcut-utils.ts`**

```typescript
import type { ShortcutKeys } from "./shortcut-types";

// Detect if running on Mac
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

// Format shortcut for display
export function formatShortcut(keys: ShortcutKeys): string {
  const parts: string[] = [];
  const mac = isMac();
  
  if (keys.ctrl) {
    parts.push(mac ? "⌘" : "Ctrl");
  }
  if (keys.meta) {
    parts.push(mac ? "⌘" : "Win");
  }
  if (keys.alt) {
    parts.push(mac ? "⌥" : "Alt");
  }
  if (keys.shift) {
    parts.push(mac ? "⇧" : "Shift");
  }
  
  // Format key
  const keyDisplay = formatKey(keys.key);
  parts.push(keyDisplay);
  
  return parts.join(mac ? "" : "+");
}

// Format individual key
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    " ": "Space",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    backspace: "⌫",
    delete: "Del",
    enter: "↵",
    escape: "Esc",
    tab: "Tab",
  };
  
  return keyMap[key.toLowerCase()] || key.toUpperCase();
}

// Check if keyboard event matches shortcut
export function matchesShortcut(
  event: KeyboardEvent,
  keys: ShortcutKeys
): boolean {
  const mac = isMac();
  
  // Check modifiers
  const ctrlKey = mac ? event.metaKey : event.ctrlKey;
  const altKey = event.altKey;
  const shiftKey = event.shiftKey;
  
  if (keys.ctrl && !ctrlKey) return false;
  if (!keys.ctrl && ctrlKey && !keys.meta) return false;
  
  if (keys.alt && !altKey) return false;
  if (!keys.alt && altKey) return false;
  
  if (keys.shift && !shiftKey) return false;
  if (!keys.shift && shiftKey) return false;
  
  // Check key
  const eventKey = event.key.toLowerCase();
  const shortcutKey = keys.key.toLowerCase();
  
  return eventKey === shortcutKey;
}

// Parse shortcut string to keys object
export function parseShortcut(shortcut: string): ShortcutKeys {
  const parts = shortcut.toLowerCase().split("+").map((p) => p.trim());
  const keys: ShortcutKeys = { key: "" };
  
  for (const part of parts) {
    switch (part) {
      case "ctrl":
      case "cmd":
      case "command":
        keys.ctrl = true;
        break;
      case "alt":
      case "option":
        keys.alt = true;
        break;
      case "shift":
        keys.shift = true;
        break;
      case "meta":
      case "win":
        keys.meta = true;
        break;
      default:
        keys.key = part;
    }
  }
  
  return keys;
}

// Convert keys to storage format
export function keysToString(keys: ShortcutKeys): string {
  const parts: string[] = [];
  
  if (keys.ctrl) parts.push("ctrl");
  if (keys.meta) parts.push("meta");
  if (keys.alt) parts.push("alt");
  if (keys.shift) parts.push("shift");
  parts.push(keys.key);
  
  return parts.join("+");
}

// Check for shortcut conflicts
export function findConflicts(
  keys: ShortcutKeys,
  shortcuts: Array<{ id: string; keys: ShortcutKeys }>,
  excludeId?: string
): string[] {
  return shortcuts
    .filter((s) => s.id !== excludeId)
    .filter((s) => keysToString(s.keys) === keysToString(keys))
    .map((s) => s.id);
}
```

---

### Task 73.3: Shortcut Registry

**File: `src/lib/shortcuts/shortcut-registry.ts`**

```typescript
import type { Shortcut, ShortcutCategory, ShortcutCategoryInfo } from "./shortcut-types";

export const SHORTCUT_CATEGORIES: ShortcutCategoryInfo[] = [
  { id: "general", label: "General", icon: "⚙️" },
  { id: "selection", label: "Selection", icon: "👆" },
  { id: "clipboard", label: "Clipboard", icon: "📋" },
  { id: "history", label: "History", icon: "🕐" },
  { id: "view", label: "View", icon: "👁️" },
  { id: "components", label: "Components", icon: "🧩" },
  { id: "navigation", label: "Navigation", icon: "🧭" },
];

// Default shortcuts - actions will be bound in context
export const DEFAULT_SHORTCUTS: Omit<Shortcut, "action">[] = [
  // General
  {
    id: "save",
    name: "Save",
    description: "Save the current page",
    category: "general",
    keys: { key: "s", ctrl: true },
    when: "editorFocused",
  },
  {
    id: "help",
    name: "Show Shortcuts",
    description: "Open keyboard shortcuts reference",
    category: "general",
    keys: { key: "/", ctrl: true },
    when: "always",
  },
  {
    id: "preview",
    name: "Preview",
    description: "Toggle preview mode",
    category: "general",
    keys: { key: "p", ctrl: true },
    when: "editorFocused",
  },
  {
    id: "publish",
    name: "Publish",
    description: "Publish the site",
    category: "general",
    keys: { key: "p", ctrl: true, shift: true },
    when: "editorFocused",
  },
  
  // Selection
  {
    id: "selectAll",
    name: "Select All",
    description: "Select all components",
    category: "selection",
    keys: { key: "a", ctrl: true },
    when: "editorFocused",
  },
  {
    id: "deselect",
    name: "Deselect",
    description: "Clear selection",
    category: "selection",
    keys: { key: "Escape" },
    when: "componentSelected",
  },
  {
    id: "selectParent",
    name: "Select Parent",
    description: "Select the parent component",
    category: "selection",
    keys: { key: "[", ctrl: true },
    when: "componentSelected",
  },
  {
    id: "selectChild",
    name: "Select First Child",
    description: "Select the first child component",
    category: "selection",
    keys: { key: "]", ctrl: true },
    when: "componentSelected",
  },
  
  // Clipboard
  {
    id: "copy",
    name: "Copy",
    description: "Copy selected component",
    category: "clipboard",
    keys: { key: "c", ctrl: true },
    when: "componentSelected",
  },
  {
    id: "cut",
    name: "Cut",
    description: "Cut selected component",
    category: "clipboard",
    keys: { key: "x", ctrl: true },
    when: "componentSelected",
  },
  {
    id: "paste",
    name: "Paste",
    description: "Paste copied component",
    category: "clipboard",
    keys: { key: "v", ctrl: true },
    when: "editorFocused",
  },
  {
    id: "duplicate",
    name: "Duplicate",
    description: "Duplicate selected component",
    category: "clipboard",
    keys: { key: "d", ctrl: true },
    when: "componentSelected",
  },
  
  // History
  {
    id: "undo",
    name: "Undo",
    description: "Undo last action",
    category: "history",
    keys: { key: "z", ctrl: true },
    when: "editorFocused",
  },
  {
    id: "redo",
    name: "Redo",
    description: "Redo last undone action",
    category: "history",
    keys: { key: "z", ctrl: true, shift: true },
    when: "editorFocused",
  },
  
  // View
  {
    id: "zoomIn",
    name: "Zoom In",
    description: "Increase zoom level",
    category: "view",
    keys: { key: "=", ctrl: true },
    when: "editorFocused",
  },
  {
    id: "zoomOut",
    name: "Zoom Out",
    description: "Decrease zoom level",
    category: "view",
    keys: { key: "-", ctrl: true },
    when: "editorFocused",
  },
  {
    id: "zoomReset",
    name: "Reset Zoom",
    description: "Reset to 100% zoom",
    category: "view",
    keys: { key: "0", ctrl: true },
    when: "editorFocused",
  },
  {
    id: "toggleLayers",
    name: "Toggle Layers",
    description: "Show/hide layers panel",
    category: "view",
    keys: { key: "l", ctrl: true, alt: true },
    when: "editorFocused",
  },
  {
    id: "toggleSettings",
    name: "Toggle Settings",
    description: "Show/hide settings panel",
    category: "view",
    keys: { key: "i", ctrl: true, alt: true },
    when: "editorFocused",
  },
  {
    id: "fullscreen",
    name: "Fullscreen",
    description: "Toggle fullscreen mode",
    category: "view",
    keys: { key: "f", ctrl: true, shift: true },
    when: "editorFocused",
  },
  
  // Components
  {
    id: "deleteComponent",
    name: "Delete",
    description: "Delete selected component",
    category: "components",
    keys: { key: "Backspace" },
    when: "componentSelected",
  },
  {
    id: "deleteComponentAlt",
    name: "Delete (Alt)",
    description: "Delete selected component",
    category: "components",
    keys: { key: "Delete" },
    when: "componentSelected",
  },
  {
    id: "moveUp",
    name: "Move Up",
    description: "Move component up in order",
    category: "components",
    keys: { key: "ArrowUp", ctrl: true },
    when: "componentSelected",
  },
  {
    id: "moveDown",
    name: "Move Down",
    description: "Move component down in order",
    category: "components",
    keys: { key: "ArrowDown", ctrl: true },
    when: "componentSelected",
  },
  {
    id: "bringToFront",
    name: "Bring to Front",
    description: "Move component to front",
    category: "components",
    keys: { key: "]", ctrl: true, shift: true },
    when: "componentSelected",
  },
  {
    id: "sendToBack",
    name: "Send to Back",
    description: "Move component to back",
    category: "components",
    keys: { key: "[", ctrl: true, shift: true },
    when: "componentSelected",
  },
  {
    id: "groupComponents",
    name: "Group",
    description: "Group selected components",
    category: "components",
    keys: { key: "g", ctrl: true },
    when: "multipleSelected",
  },
  {
    id: "ungroupComponents",
    name: "Ungroup",
    description: "Ungroup selected group",
    category: "components",
    keys: { key: "g", ctrl: true, shift: true },
    when: "componentSelected",
  },
  
  // Navigation
  {
    id: "nextPage",
    name: "Next Page",
    description: "Go to next page",
    category: "navigation",
    keys: { key: "ArrowRight", ctrl: true, alt: true },
    when: "editorFocused",
  },
  {
    id: "prevPage",
    name: "Previous Page",
    description: "Go to previous page",
    category: "navigation",
    keys: { key: "ArrowLeft", ctrl: true, alt: true },
    when: "editorFocused",
  },
  {
    id: "goToPages",
    name: "Pages List",
    description: "Open pages list",
    category: "navigation",
    keys: { key: "o", ctrl: true },
    when: "editorFocused",
  },
];

// Get shortcuts by category
export function getShortcutsByCategory(
  category: ShortcutCategory,
  shortcuts: Omit<Shortcut, "action">[] = DEFAULT_SHORTCUTS
): Omit<Shortcut, "action">[] {
  return shortcuts.filter((s) => s.category === category);
}
```

---

### Task 73.4: Shortcut Context Provider

**File: `src/lib/shortcuts/shortcut-context.tsx`**

```tsx
"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { DEFAULT_SHORTCUTS } from "./shortcut-registry";
import { matchesShortcut, keysToString } from "./shortcut-utils";
import type { Shortcut, ShortcutKeys, CustomShortcut } from "./shortcut-types";

interface ShortcutContextValue {
  shortcuts: Shortcut[];
  registerAction: (id: string, action: () => void) => void;
  unregisterAction: (id: string) => void;
  setCustomShortcut: (id: string, keys: ShortcutKeys) => void;
  resetShortcut: (id: string) => void;
  resetAllShortcuts: () => void;
  isShortcutModalOpen: boolean;
  openShortcutModal: () => void;
  closeShortcutModal: () => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export function useShortcutContext() {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error("useShortcutContext must be used within ShortcutProvider");
  }
  return context;
}

interface ShortcutProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "shortcut-customizations";

export function ShortcutProvider({ children }: ShortcutProviderProps) {
  const [actions, setActions] = useState<Record<string, () => void>>({});
  const [customShortcuts, setCustomShortcuts] = useState<CustomShortcut[]>([]);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // Load custom shortcuts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCustomShortcuts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse custom shortcuts", e);
      }
    }
  }, []);

  // Save custom shortcuts to localStorage
  useEffect(() => {
    if (customShortcuts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customShortcuts));
    }
  }, [customShortcuts]);

  // Build shortcuts with actions and customizations
  const shortcuts = useMemo(() => {
    return DEFAULT_SHORTCUTS.map((shortcut) => {
      const custom = customShortcuts.find((c) => c.shortcutId === shortcut.id);
      const action = actions[shortcut.id] || (() => {});
      
      return {
        ...shortcut,
        keys: custom?.customKeys || shortcut.keys,
        action,
      };
    });
  }, [actions, customShortcuts]);

  // Register action handler
  const registerAction = useCallback((id: string, action: () => void) => {
    setActions((prev) => ({ ...prev, [id]: action }));
  }, []);

  // Unregister action handler
  const unregisterAction = useCallback((id: string) => {
    setActions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Set custom shortcut
  const setCustomShortcut = useCallback((id: string, keys: ShortcutKeys) => {
    setCustomShortcuts((prev) => {
      const existing = prev.find((c) => c.shortcutId === id);
      if (existing) {
        return prev.map((c) =>
          c.shortcutId === id ? { ...c, customKeys: keys } : c
        );
      }
      return [...prev, { shortcutId: id, customKeys: keys }];
    });
  }, []);

  // Reset single shortcut to default
  const resetShortcut = useCallback((id: string) => {
    setCustomShortcuts((prev) => prev.filter((c) => c.shortcutId !== id));
  }, []);

  // Reset all shortcuts to defaults
  const resetAllShortcuts = useCallback(() => {
    setCustomShortcuts([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Global keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow some shortcuts even in inputs
        const allowedInInput = ["save", "help"];
        const matchedShortcut = shortcuts.find(
          (s) => allowedInInput.includes(s.id) && matchesShortcut(event, s.keys)
        );
        if (!matchedShortcut) return;
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;
        
        if (matchesShortcut(event, shortcut.keys)) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);

  // Register help shortcut
  useEffect(() => {
    registerAction("help", () => setIsShortcutModalOpen(true));
    return () => unregisterAction("help");
  }, [registerAction, unregisterAction]);

  const value: ShortcutContextValue = {
    shortcuts,
    registerAction,
    unregisterAction,
    setCustomShortcut,
    resetShortcut,
    resetAllShortcuts,
    isShortcutModalOpen,
    openShortcutModal: () => setIsShortcutModalOpen(true),
    closeShortcutModal: () => setIsShortcutModalOpen(false),
    enabled,
    setEnabled,
  };

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
}
```

---

### Task 73.5: Use Shortcuts Hook

**File: `src/hooks/use-shortcuts.ts`**

```typescript
"use client";

import { useEffect, useCallback } from "react";
import { useShortcutContext } from "@/lib/shortcuts/shortcut-context";

interface ShortcutActions {
  [key: string]: () => void;
}

export function useShortcuts(actions: ShortcutActions) {
  const { registerAction, unregisterAction } = useShortcutContext();

  useEffect(() => {
    // Register all actions
    Object.entries(actions).forEach(([id, action]) => {
      registerAction(id, action);
    });

    // Cleanup
    return () => {
      Object.keys(actions).forEach((id) => {
        unregisterAction(id);
      });
    };
  }, [actions, registerAction, unregisterAction]);
}

// Hook for single shortcut
export function useShortcut(id: string, action: () => void) {
  const { registerAction, unregisterAction } = useShortcutContext();

  useEffect(() => {
    registerAction(id, action);
    return () => unregisterAction(id);
  }, [id, action, registerAction, unregisterAction]);
}

// Hook for getting shortcut display
export function useShortcutDisplay(id: string): string | null {
  const { shortcuts } = useShortcutContext();
  const shortcut = shortcuts.find((s) => s.id === id);
  
  if (!shortcut) return null;
  
  const { formatShortcut } = require("@/lib/shortcuts/shortcut-utils");
  return formatShortcut(shortcut.keys);
}
```

---

### Task 73.6: Shortcut Indicator Component

**File: `src/components/shortcuts/shortcut-indicator.tsx`**

```tsx
"use client";

import { formatShortcut } from "@/lib/shortcuts/shortcut-utils";
import type { ShortcutKeys } from "@/lib/shortcuts/shortcut-types";
import { cn } from "@/lib/utils";

interface ShortcutIndicatorProps {
  keys: ShortcutKeys;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ShortcutIndicator({
  keys,
  className,
  size = "md",
}: ShortcutIndicatorProps) {
  const formatted = formatShortcut(keys);
  const parts = formatted.split(/(?=[⌘⌥⇧↑↓←→⌫↵])|(?<=[⌘⌥⇧↑↓←→⌫↵])|\+/);
  
  const sizeClasses = {
    sm: "text-[10px] px-1 py-0.5 min-w-[16px]",
    md: "text-xs px-1.5 py-0.5 min-w-[20px]",
    lg: "text-sm px-2 py-1 min-w-[24px]",
  };
  
  return (
    <kbd className={cn("inline-flex items-center gap-0.5", className)}>
      {parts.filter(Boolean).map((part, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center justify-center rounded bg-muted border border-muted-foreground/20 font-mono",
            sizeClasses[size]
          )}
        >
          {part}
        </span>
      ))}
    </kbd>
  );
}

// Simple text display
interface ShortcutTextProps {
  shortcutId: string;
  className?: string;
}

export function ShortcutText({ shortcutId, className }: ShortcutTextProps) {
  const { shortcuts } = require("@/lib/shortcuts/shortcut-context").useShortcutContext();
  const shortcut = shortcuts.find((s: any) => s.id === shortcutId);
  
  if (!shortcut) return null;
  
  return (
    <span className={cn("text-muted-foreground text-xs", className)}>
      {formatShortcut(shortcut.keys)}
    </span>
  );
}
```

---

### Task 73.7: Shortcut Modal Component

**File: `src/components/shortcuts/shortcut-modal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShortcutContext } from "@/lib/shortcuts/shortcut-context";
import { SHORTCUT_CATEGORIES, getShortcutsByCategory } from "@/lib/shortcuts/shortcut-registry";
import { ShortcutIndicator } from "./shortcut-indicator";

export function ShortcutModal() {
  const {
    shortcuts,
    isShortcutModalOpen,
    closeShortcutModal,
    resetAllShortcuts,
  } = useShortcutContext();
  const [search, setSearch] = useState("");

  const filteredShortcuts = search
    ? shortcuts.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase())
      )
    : shortcuts;

  return (
    <Dialog open={isShortcutModalOpen} onOpenChange={closeShortcutModal}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Keyboard Shortcuts</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllShortcuts}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset All
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shortcuts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[60vh] pr-4">
          {search ? (
            // Search results
            <div className="space-y-2">
              {filteredShortcuts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No shortcuts found for "{search}"
                </p>
              ) : (
                filteredShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                ))
              )}
            </div>
          ) : (
            // Grouped by category
            <div className="space-y-6">
              {SHORTCUT_CATEGORIES.map((category) => {
                const categoryShortcuts = shortcuts.filter(
                  (s) => s.category === category.id
                );
                
                if (categoryShortcuts.length === 0) return null;
                
                return (
                  <div key={category.id}>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.label}
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut) => (
                        <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Press <ShortcutIndicator keys={{ key: "/", ctrl: true }} size="sm" /> to open this menu
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShortcutRowProps {
  shortcut: {
    id: string;
    name: string;
    description: string;
    keys: any;
  };
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
      <div>
        <p className="font-medium text-sm">{shortcut.name}</p>
        <p className="text-xs text-muted-foreground">{shortcut.description}</p>
      </div>
      <ShortcutIndicator keys={shortcut.keys} />
    </div>
  );
}
```

---

### Task 73.8: Shortcut Settings Component

**File: `src/components/shortcuts/shortcut-settings.tsx`**

```tsx
"use client";

import { useState, useCallback } from "react";
import { RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useShortcutContext } from "@/lib/shortcuts/shortcut-context";
import { SHORTCUT_CATEGORIES, DEFAULT_SHORTCUTS } from "@/lib/shortcuts/shortcut-registry";
import { formatShortcut, findConflicts, keysToString } from "@/lib/shortcuts/shortcut-utils";
import { ShortcutIndicator } from "./shortcut-indicator";
import type { ShortcutKeys } from "@/lib/shortcuts/shortcut-types";

export function ShortcutSettings() {
  const {
    shortcuts,
    setCustomShortcut,
    resetShortcut,
    resetAllShortcuts,
  } = useShortcutContext();
  
  const [editing, setEditing] = useState<string | null>(null);
  const [pendingKeys, setPendingKeys] = useState<ShortcutKeys | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const handleStartEdit = (id: string) => {
    setEditing(id);
    setPendingKeys(null);
    setConflicts([]);
  };

  const handleKeyCapture = useCallback(
    (event: React.KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (event.key === "Escape") {
        setEditing(null);
        return;
      }
      
      // Build keys object
      const keys: ShortcutKeys = {
        key: event.key,
        ctrl: event.ctrlKey || event.metaKey,
        alt: event.altKey,
        shift: event.shiftKey,
      };
      
      // Check for conflicts
      const conflictIds = findConflicts(
        keys,
        shortcuts.map((s) => ({ id: s.id, keys: s.keys })),
        editing!
      );
      
      setConflicts(conflictIds);
      setPendingKeys(keys);
    },
    [editing, shortcuts]
  );

  const handleSave = () => {
    if (editing && pendingKeys) {
      setCustomShortcut(editing, pendingKeys);
      setEditing(null);
      setPendingKeys(null);
      setConflicts([]);
    }
  };

  const handleReset = (id: string) => {
    resetShortcut(id);
  };

  const isCustomized = (id: string): boolean => {
    const defaultShortcut = DEFAULT_SHORTCUTS.find((s) => s.id === id);
    const current = shortcuts.find((s) => s.id === id);
    
    if (!defaultShortcut || !current) return false;
    
    return keysToString(defaultShortcut.keys) !== keysToString(current.keys);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Keyboard Shortcuts</h2>
        <Button variant="outline" size="sm" onClick={resetAllShortcuts}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All to Defaults
        </Button>
      </div>

      {SHORTCUT_CATEGORIES.map((category) => {
        const categoryShortcuts = shortcuts.filter(
          (s) => s.category === category.id
        );
        
        if (categoryShortcuts.length === 0) return null;
        
        return (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>{category.icon}</span>
                {category.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{shortcut.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shortcut.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(shortcut.id)}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <ShortcutIndicator keys={shortcut.keys} />
                      </button>
                      
                      {isCustomized(shortcut.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleReset(shortcut.id)}
                          title="Reset to default"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Edit dialog */}
      <Dialog open={editing !== null} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Shortcut: {shortcuts.find((s) => s.id === editing)?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="py-8 text-center">
            <div
              tabIndex={0}
              onKeyDown={handleKeyCapture}
              className="inline-flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg focus:border-primary focus:outline-none"
            >
              {pendingKeys ? (
                <ShortcutIndicator keys={pendingKeys} size="lg" />
              ) : (
                <span className="text-muted-foreground">
                  Press a key combination...
                </span>
              )}
              <p className="text-xs text-muted-foreground">
                Click here and press your desired shortcut
              </p>
            </div>
          </div>

          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This shortcut conflicts with:{" "}
                {conflicts
                  .map((id) => shortcuts.find((s) => s.id === id)?.name)
                  .join(", ")}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!pendingKeys || conflicts.length > 0}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

### Task 73.9: Editor Integration Example

**File: `src/components/editor/editor-shortcuts.tsx`**

```tsx
"use client";

import { useCallback } from "react";
import { useEditor } from "@craftjs/core";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EditorShortcutsProps {
  pageId: string;
  siteId: string;
  onSave: () => Promise<void>;
  onPreview: () => void;
  onPublish: () => void;
}

export function EditorShortcuts({
  pageId,
  siteId,
  onSave,
  onPreview,
  onPublish,
}: EditorShortcutsProps) {
  const router = useRouter();
  const { actions, query, selected } = useEditor((state) => ({
    selected: state.events.selected,
  }));

  // Define all shortcut actions
  const shortcutActions = {
    // General
    save: useCallback(async () => {
      try {
        await onSave();
        toast.success("Saved");
      } catch (error) {
        toast.error("Failed to save");
      }
    }, [onSave]),
    
    preview: useCallback(() => {
      onPreview();
    }, [onPreview]),
    
    publish: useCallback(() => {
      onPublish();
    }, [onPublish]),
    
    // Selection
    selectAll: useCallback(() => {
      // Select all root level nodes
      const nodes = query.getNodes();
      const rootId = query.node("ROOT").get().data.nodes || [];
      actions.setSelectedNodeIds(rootId);
    }, [actions, query]),
    
    deselect: useCallback(() => {
      actions.clearEvents();
    }, [actions]),
    
    selectParent: useCallback(() => {
      if (selected.size !== 1) return;
      const nodeId = Array.from(selected)[0];
      const parent = query.node(nodeId).get()?.data?.parent;
      if (parent && parent !== "ROOT") {
        actions.selectNode(parent);
      }
    }, [actions, query, selected]),
    
    // Clipboard
    copy: useCallback(() => {
      if (selected.size !== 1) return;
      const nodeId = Array.from(selected)[0];
      const serialized = query.serialize();
      localStorage.setItem("craft-clipboard", JSON.stringify({
        nodeId,
        data: serialized,
      }));
      toast.success("Copied");
    }, [query, selected]),
    
    duplicate: useCallback(() => {
      if (selected.size !== 1) return;
      const nodeId = Array.from(selected)[0];
      const node = query.node(nodeId).get();
      const parent = node?.data?.parent;
      
      if (parent) {
        // Clone node logic here
        toast.success("Duplicated");
      }
    }, [query, selected]),
    
    // History
    undo: useCallback(() => {
      if (query.history.canUndo()) {
        actions.history.undo();
      }
    }, [actions, query]),
    
    redo: useCallback(() => {
      if (query.history.canRedo()) {
        actions.history.redo();
      }
    }, [actions, query]),
    
    // Components
    deleteComponent: useCallback(() => {
      if (selected.size === 0) return;
      selected.forEach((nodeId) => {
        if (nodeId !== "ROOT") {
          actions.delete(nodeId);
        }
      });
    }, [actions, selected]),
    
    deleteComponentAlt: useCallback(() => {
      // Same as deleteComponent
      if (selected.size === 0) return;
      selected.forEach((nodeId) => {
        if (nodeId !== "ROOT") {
          actions.delete(nodeId);
        }
      });
    }, [actions, selected]),
    
    // View
    zoomIn: useCallback(() => {
      // Implement zoom
      toast.info("Zoom in");
    }, []),
    
    zoomOut: useCallback(() => {
      // Implement zoom
      toast.info("Zoom out");
    }, []),
    
    zoomReset: useCallback(() => {
      // Implement zoom reset
      toast.info("Zoom reset to 100%");
    }, []),
    
    // Navigation
    goToPages: useCallback(() => {
      router.push(`/sites/${siteId}/pages`);
    }, [router, siteId]),
  };

  // Register all shortcuts
  useShortcuts(shortcutActions);

  return null; // This is a logic-only component
}
```

---

### Task 73.10: Usage in Editor Layout

**File: `src/app/(dashboard)/sites/[siteId]/editor/[pageId]/layout.tsx` (partial)**

```tsx
// Add to existing editor layout

import { ShortcutProvider } from "@/lib/shortcuts/shortcut-context";
import { ShortcutModal } from "@/components/shortcuts/shortcut-modal";
import { EditorShortcuts } from "@/components/editor/editor-shortcuts";

export default function EditorLayout({ children, params }) {
  const { siteId, pageId } = params;

  return (
    <ShortcutProvider>
      {/* Shortcut modal - always available */}
      <ShortcutModal />
      
      {/* Editor shortcuts - binds actions to shortcuts */}
      <EditorShortcuts
        pageId={pageId}
        siteId={siteId}
        onSave={handleSave}
        onPreview={handlePreview}
        onPublish={handlePublish}
      />
      
      {children}
    </ShortcutProvider>
  );
}
```

---

### Task 73.11: Shortcut Button for Toolbar

**File: `src/components/shortcuts/shortcut-button.tsx`**

```tsx
"use client";

import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useShortcutContext } from "@/lib/shortcuts/shortcut-context";
import { ShortcutIndicator } from "./shortcut-indicator";

export function ShortcutButton() {
  const { openShortcutModal } = useShortcutContext();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={openShortcutModal}
          className="h-9 w-9"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>Keyboard Shortcuts</span>
        <ShortcutIndicator keys={{ key: "/", ctrl: true }} size="sm" />
      </TooltipContent>
    </Tooltip>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Key matching works correctly
- [ ] Mac/Windows detection works
- [ ] Shortcut formatting displays correctly
- [ ] Conflict detection works

### Integration Tests
- [ ] Shortcuts trigger actions
- [ ] Custom shortcuts persist
- [ ] Shortcuts modal opens/closes
- [ ] Editor integration works

### E2E Tests
- [ ] User can save with Ctrl+S
- [ ] User can undo with Ctrl+Z
- [ ] User can open shortcuts modal
- [ ] Custom shortcuts work after refresh

---

## ✅ Completion Checklist

- [ ] Shortcut types defined
- [ ] Shortcut utilities created
- [ ] Shortcut registry populated
- [ ] Context provider working
- [ ] useShortcuts hook created
- [ ] Shortcut indicator component created
- [ ] Shortcut modal component created
- [ ] Shortcut settings component created
- [ ] Editor integration completed
- [ ] Shortcut button for toolbar created
- [ ] Tests passing

---

**Phase Complete**: All 16 improvements from the initial audit have now been documented with comprehensive implementation phases (58-73).
