# Phase 73: Keyboard Shortcuts - Editor Productivity

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 LOW
>
> **Estimated Time**: 2 hours

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |
| `modules` | `modules_v2` |

---

## 🎯 Objective

Implement comprehensive keyboard shortcuts for the visual editor to boost power user productivity.

---

## 📋 Prerequisites

- [ ] Phase 72 Help Center completed
- [ ] Visual editor functional
- [ ] Craft.js editor integration working

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
  | "view";

export interface Shortcut {
  id: string;
  name: string;
  description: string;
  category: ShortcutCategory;
  keys: {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  action: () => void;
}

export interface ShortcutGroup {
  category: ShortcutCategory;
  label: string;
  shortcuts: Omit<Shortcut, "action">[];
}
```

---

### Task 73.2: Shortcut Registry

**File: `src/lib/shortcuts/shortcut-registry.ts`**

```typescript
import type { ShortcutGroup } from "./shortcut-types";

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "general",
    label: "General",
    shortcuts: [
      {
        id: "save",
        name: "Save",
        description: "Save current changes",
        keys: { key: "s", ctrl: true },
      },
      {
        id: "preview",
        name: "Toggle Preview",
        description: "Toggle preview mode",
        keys: { key: "p", ctrl: true },
      },
      {
        id: "publish",
        name: "Publish",
        description: "Publish the site",
        keys: { key: "p", ctrl: true, shift: true },
      },
      {
        id: "help",
        name: "Help",
        description: "Open help menu",
        keys: { key: "/", ctrl: true },
      },
      {
        id: "shortcuts",
        name: "Shortcuts",
        description: "Show keyboard shortcuts",
        keys: { key: "?", shift: true },
      },
    ],
  },
  {
    category: "history",
    label: "History",
    shortcuts: [
      {
        id: "undo",
        name: "Undo",
        description: "Undo last action",
        keys: { key: "z", ctrl: true },
      },
      {
        id: "redo",
        name: "Redo",
        description: "Redo last action",
        keys: { key: "z", ctrl: true, shift: true },
      },
    ],
  },
  {
    category: "clipboard",
    label: "Clipboard",
    shortcuts: [
      {
        id: "copy",
        name: "Copy",
        description: "Copy selected component",
        keys: { key: "c", ctrl: true },
      },
      {
        id: "paste",
        name: "Paste",
        description: "Paste copied component",
        keys: { key: "v", ctrl: true },
      },
      {
        id: "duplicate",
        name: "Duplicate",
        description: "Duplicate selected component",
        keys: { key: "d", ctrl: true },
      },
      {
        id: "delete",
        name: "Delete",
        description: "Delete selected component",
        keys: { key: "Backspace" },
      },
    ],
  },
  {
    category: "selection",
    label: "Selection",
    shortcuts: [
      {
        id: "selectAll",
        name: "Select All",
        description: "Select all components",
        keys: { key: "a", ctrl: true },
      },
      {
        id: "deselect",
        name: "Deselect",
        description: "Deselect component",
        keys: { key: "Escape" },
      },
      {
        id: "selectParent",
        name: "Select Parent",
        description: "Select parent component",
        keys: { key: "ArrowUp", alt: true },
      },
    ],
  },
  {
    category: "view",
    label: "View",
    shortcuts: [
      {
        id: "zoomIn",
        name: "Zoom In",
        description: "Zoom in",
        keys: { key: "=", ctrl: true },
      },
      {
        id: "zoomOut",
        name: "Zoom Out",
        description: "Zoom out",
        keys: { key: "-", ctrl: true },
      },
      {
        id: "resetZoom",
        name: "Reset Zoom",
        description: "Reset zoom to 100%",
        keys: { key: "0", ctrl: true },
      },
    ],
  },
];

export function formatShortcut(keys: {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}): string {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const parts: string[] = [];

  if (keys.ctrl) parts.push(isMac ? "⌘" : "Ctrl");
  if (keys.alt) parts.push(isMac ? "⌥" : "Alt");
  if (keys.shift) parts.push("⇧");

  // Format the key
  let key = keys.key;
  if (key === " ") key = "Space";
  if (key === "Backspace") key = "⌫";
  if (key === "Escape") key = "Esc";
  if (key === "ArrowUp") key = "↑";
  if (key === "ArrowDown") key = "↓";
  if (key.length === 1) key = key.toUpperCase();

  parts.push(key);

  return parts.join(isMac ? "" : "+");
}
```

---

### Task 73.3: useShortcuts Hook

**File: `src/hooks/use-shortcuts.ts`**

```typescript
"use client";

import { useEffect, useCallback } from "react";

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  preventDefault?: boolean;
}

export function useShortcuts(shortcuts: ShortcutHandler[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
```

---

### Task 73.4: Shortcuts Modal

**File: `src/components/shortcuts/shortcuts-modal.tsx`**

```typescript
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SHORTCUT_GROUPS, formatShortcut } from "@/lib/shortcuts/shortcut-registry";

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <span className="font-medium">{shortcut.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {shortcut.description}
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {formatShortcut(shortcut.keys)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 73.5: Keyboard Shortcut Indicator

**File: `src/components/shortcuts/shortcut-badge.tsx`**

```typescript
"use client";

import { Badge } from "@/components/ui/badge";
import { formatShortcut } from "@/lib/shortcuts/shortcut-registry";

interface ShortcutBadgeProps {
  keys: {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  className?: string;
}

export function ShortcutBadge({ keys, className }: ShortcutBadgeProps) {
  return (
    <Badge variant="outline" className={`font-mono text-xs ${className}`}>
      {formatShortcut(keys)}
    </Badge>
  );
}
```

---

### Task 73.6: Editor Shortcuts Integration

**File: `src/components/editor/editor-shortcuts.tsx`**

```typescript
"use client";

import { useState, useCallback } from "react";
import { useEditor } from "@craftjs/core";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { ShortcutsModal } from "@/components/shortcuts/shortcuts-modal";
import { toast } from "sonner";

interface EditorShortcutsProps {
  onSave?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
}

export function EditorShortcuts({
  onSave,
  onPreview,
  onPublish,
}: EditorShortcutsProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { actions, query } = useEditor();

  const shortcuts = [
    // General
    {
      key: "s",
      ctrl: true,
      action: () => {
        onSave?.();
        toast.success("Saved");
      },
    },
    {
      key: "p",
      ctrl: true,
      action: () => onPreview?.(),
    },
    {
      key: "p",
      ctrl: true,
      shift: true,
      action: () => onPublish?.(),
    },
    {
      key: "?",
      shift: true,
      action: () => setShowShortcuts(true),
    },

    // History
    {
      key: "z",
      ctrl: true,
      action: () => {
        if (query.history.canUndo()) {
          actions.history.undo();
        }
      },
    },
    {
      key: "z",
      ctrl: true,
      shift: true,
      action: () => {
        if (query.history.canRedo()) {
          actions.history.redo();
        }
      },
    },

    // Selection
    {
      key: "Escape",
      action: () => actions.selectNode(null),
    },
    {
      key: "Backspace",
      action: () => {
        const selectedNodeId = query.getEvent("selected").first();
        if (selectedNodeId && selectedNodeId !== "ROOT") {
          actions.delete(selectedNodeId);
        }
      },
    },
  ];

  useShortcuts(shortcuts);

  return <ShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />;
}
```

---

## ✅ Completion Checklist

- [ ] Shortcut types defined
- [ ] Shortcut registry with all shortcuts
- [ ] useShortcuts hook working
- [ ] Shortcuts modal displays all shortcuts
- [ ] ShortcutBadge component for tooltips
- [ ] Editor shortcuts integrated
- [ ] Tested Ctrl+S saves
- [ ] Tested Ctrl+Z/Ctrl+Shift+Z undo/redo
- [ ] Tested Shift+? shows shortcuts modal
- [ ] Tested shortcuts don't fire in text inputs

---

## 📝 Notes for AI Agent

1. **MAC SUPPORT** - Use ⌘ instead of Ctrl on Mac
2. **INPUT CHECK** - Don't trigger in inputs/textareas
3. **PREVENT DEFAULT** - Prevent browser defaults (Ctrl+S)
4. **CRAFT.JS** - Use Craft.js actions for undo/redo
5. **MODAL** - Shift+? should show all shortcuts
