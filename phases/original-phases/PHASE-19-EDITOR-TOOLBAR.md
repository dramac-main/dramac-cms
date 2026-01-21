# Phase 19: Editor Toolbar

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build the top toolbar for the editor with undo/redo, viewport controls, and save/preview functionality.

---

## 📋 Prerequisites

- [ ] Phase 1-18 completed

---

## ✅ Tasks

### Task 19.1: Editor Toolbar Component

**File: `src/components/editor/toolbar/editor-toolbar.tsx`**

```typescript
"use client";

import { useEditor } from "@craftjs/core";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Undo2,
  Redo2,
  Smartphone,
  Tablet,
  Monitor,
  Maximize,
  Eye,
  Save,
  ArrowLeft,
  Loader2,
  Grid3X3,
  Square,
} from "lucide-react";
import type { CanvasSettings } from "@/types/editor";

interface EditorToolbarProps {
  siteName: string;
  pageName: string;
  siteId: string;
  pageId: string;
  settings: CanvasSettings;
  onSettingsChange: (settings: Partial<CanvasSettings>) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

const viewportOptions = [
  { id: "mobile", icon: Smartphone, label: "Mobile", width: 375 },
  { id: "tablet", icon: Tablet, label: "Tablet", width: 768 },
  { id: "desktop", icon: Monitor, label: "Desktop", width: 1280 },
  { id: "full", icon: Maximize, label: "Full Width", width: "100%" },
] as const;

export function EditorToolbar({
  siteName,
  pageName,
  siteId,
  pageId,
  settings,
  onSettingsChange,
  onSave,
  isSaving = false,
  hasUnsavedChanges = false,
}: EditorToolbarProps) {
  const router = useRouter();
  const { canUndo, canRedo, actions, enabled } = useEditor((state, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
    enabled: state.options.enabled,
  }));

  const handlePreview = () => {
    // Open preview in new tab
    const previewUrl = `/preview/${siteId}/${pageId}`;
    window.open(previewUrl, "_blank");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-14 border-b bg-background flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/sites/${siteId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <p className="text-sm font-medium">{pageName}</p>
            <p className="text-xs text-muted-foreground">{siteName}</p>
          </div>
        </div>

        {/* Center section - History & View */}
        <div className="flex items-center gap-1">
          {/* History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!canUndo}
                onClick={() => actions.history.undo()}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!canRedo}
                onClick={() => actions.history.redo()}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Viewport */}
          <div className="flex items-center border rounded-lg p-0.5">
            {viewportOptions.map((option) => {
              const Icon = option.icon;
              const isActive = settings.width === option.id;

              return (
                <Tooltip key={option.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onSettingsChange({ width: option.id })}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {option.label}{" "}
                    {typeof option.width === "number" && `(${option.width}px)`}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* View toggles */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={settings.showOutlines ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onSettingsChange({ showOutlines: !settings.showOutlines })}
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Outlines</TooltipContent>
          </Tooltip>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview in new tab</TooltipContent>
          </Tooltip>

          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasUnsavedChanges ? "Save" : "Saved"}
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
```

### Task 19.2: Keyboard Shortcuts Hook

**File: `src/hooks/use-editor-shortcuts.ts`**

```typescript
"use client";

import { useEffect, useCallback } from "react";
import { useEditor } from "@craftjs/core";

interface UseEditorShortcutsOptions {
  onSave?: () => void;
}

export function useEditorShortcuts({ onSave }: UseEditorShortcutsOptions = {}) {
  const { actions, query, enabled } = useEditor((state, query) => ({
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
```

### Task 19.3: Breadcrumb Navigation

**File: `src/components/editor/toolbar/editor-breadcrumb.tsx`**

```typescript
"use client";

import { useEditor } from "@craftjs/core";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditorBreadcrumb() {
  const { selectedNodeId, nodeAncestors, actions, query } = useEditor((state, query) => {
    const selectedId = state.events.selected.values().next().value;
    let ancestors: { id: string; name: string }[] = [];

    if (selectedId) {
      let currentId = selectedId;
      while (currentId) {
        const node = state.nodes[currentId];
        if (node) {
          ancestors.unshift({
            id: currentId,
            name: node.data.displayName || node.data.name || "Unknown",
          });
        }
        currentId = node?.data.parent || "";
      }
    }

    return {
      selectedNodeId: selectedId,
      nodeAncestors: ancestors,
    };
  });

  if (!selectedNodeId || nodeAncestors.length === 0) {
    return (
      <div className="h-10 border-b bg-muted/30 flex items-center px-4">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Home className="h-3 w-3" />
          Select an element to see its location
        </span>
      </div>
    );
  }

  return (
    <div className="h-10 border-b bg-muted/30 flex items-center px-4 overflow-x-auto">
      <nav className="flex items-center text-sm">
        {nodeAncestors.map((node, index) => {
          const isLast = index === nodeAncestors.length - 1;
          const isRoot = index === 0;

          return (
            <div key={node.id} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2",
                  isLast && "font-medium",
                  !isLast && "text-muted-foreground"
                )}
                onClick={() => {
                  actions.selectNode(node.id);
                }}
              >
                {isRoot && <Home className="h-3 w-3 mr-1" />}
                {node.name}
              </Button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
```

### Task 19.4: Status Indicator

**File: `src/components/editor/toolbar/save-status.tsx`**

```typescript
"use client";

import { Check, Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveStatusProps {
  status: "saved" | "saving" | "unsaved" | "error";
  lastSaved?: Date | null;
}

const statusConfig = {
  saved: {
    icon: Check,
    label: "All changes saved",
    color: "text-success",
  },
  saving: {
    icon: Loader2,
    label: "Saving...",
    color: "text-muted-foreground",
  },
  unsaved: {
    icon: Cloud,
    label: "Unsaved changes",
    color: "text-warning",
  },
  error: {
    icon: CloudOff,
    label: "Failed to save",
    color: "text-destructive",
  },
};

export function SaveStatus({ status, lastSaved }: SaveStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon
        className={cn(
          "h-4 w-4",
          config.color,
          status === "saving" && "animate-spin"
        )}
      />
      <span className={cn("text-muted-foreground", config.color)}>
        {config.label}
      </span>
      {status === "saved" && lastSaved && (
        <span className="text-xs text-muted-foreground">
          {formatTime(lastSaved)}
        </span>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
```

### Task 19.5: Layers Panel Toggle

**File: `src/components/editor/toolbar/layers-toggle.tsx`**

```typescript
"use client";

import { Layers } from "@craftjs/layers";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Layers as LayersIcon } from "lucide-react";

export function LayersToggle() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <LayersIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Layers</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <Layers expandRootOnLoad />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### Task 19.6: Export Toolbar Components

**File: `src/components/editor/toolbar/index.ts`**

```typescript
export * from "./editor-toolbar";
export * from "./editor-breadcrumb";
export * from "./save-status";
export * from "./layers-toggle";
```

---

## 📐 Acceptance Criteria

- [ ] Toolbar shows site/page name
- [ ] Back button navigates to site detail
- [ ] Undo/Redo buttons work with history
- [ ] Viewport toggles change canvas width
- [ ] Outline toggle shows element boundaries
- [ ] Preview opens page in new tab
- [ ] Save button saves content
- [ ] Save button disabled when no changes
- [ ] Keyboard shortcuts work (Ctrl+Z, Ctrl+Y, Ctrl+S)
- [ ] Breadcrumb shows element hierarchy
- [ ] Status indicator shows save state

---

## 📁 Files Created This Phase

```
src/components/editor/toolbar/
├── index.ts
├── editor-toolbar.tsx
├── editor-breadcrumb.tsx
├── save-status.tsx
└── layers-toggle.tsx

src/hooks/
└── use-editor-shortcuts.ts
```

---

## ➡️ Next Phase

**Phase 20: Editor Integration** - Integrate all editor components into the page editor route.
