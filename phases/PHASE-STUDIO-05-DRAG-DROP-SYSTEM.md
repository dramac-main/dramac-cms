# PHASE-STUDIO-05: Drag & Drop System

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-05 |
| Title | Drag & Drop System |
| Priority | Critical |
| Estimated Time | 8-10 hours |
| Dependencies | STUDIO-01, STUDIO-02, STUDIO-03, STUDIO-04 |
| Risk Level | Medium |

## Problem Statement

The Studio editor needs drag-and-drop functionality to:
1. Drag components from the library panel to the canvas
2. Reorder components on the canvas
3. Move components between containers
4. Provide visual feedback during drag operations

Without DnD, users cannot add or rearrange components - the editor would be non-functional.

## Goals

- [ ] Install and configure @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- [ ] Create DndContext provider wrapper
- [ ] Create draggable component items for the library
- [ ] Create droppable canvas area
- [ ] Create sortable components on the canvas
- [ ] Implement drag overlay showing component preview
- [ ] Handle drop logic (add new component / move existing)
- [ ] Provide visual feedback during drag (drop zone highlighting)
- [ ] Support keyboard accessibility (Space to pick up, Escape to cancel)

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DndContext                              │
│  ┌──────────────┐  ┌─────────────────────────────────────┐  │
│  │ Left Panel   │  │           Canvas                     │  │
│  │ ┌──────────┐ │  │  ┌───────────────────────────────┐  │  │
│  │ │Draggable │ │  │  │ SortableContext               │  │  │
│  │ │Component │─┼──┼──▶ ┌─────────┐ ┌─────────┐      │  │  │
│  │ │ Item     │ │  │  │ │Sortable │ │Sortable │      │  │  │
│  │ └──────────┘ │  │  │ │Component│ │Component│      │  │  │
│  │ ┌──────────┐ │  │  │ └─────────┘ └─────────┘      │  │  │
│  │ │Draggable │ │  │  │ ┌───────────────────────┐    │  │  │
│  │ │Component │ │  │  │ │ DroppableCanvas       │    │  │  │
│  │ │ Item     │ │  │  │ │ (empty drop zone)     │    │  │  │
│  │ └──────────┘ │  │  │ └───────────────────────┘    │  │  │
│  └──────────────┘  │  └───────────────────────────────┘  │  │
│                    └─────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  DragOverlay                          │   │
│  │  (Shows preview of dragged component)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Library Drag Start**: User drags from library → `useDraggable` → set `draggedType` in UI store
2. **Canvas Drop**: User drops on canvas → `onDragEnd` handler → call `editorStore.addComponent()`
3. **Canvas Reorder**: User drags existing → `useSortable` → call `editorStore.moveComponent()`
4. **Visual Feedback**: `DragOverlay` renders preview, drop zones highlight on hover

### Key Concepts

- **Draggable**: Library component items (create new on drop)
- **Sortable**: Canvas components (reorder on drop)
- **Droppable**: Canvas container (accepts drops from library)
- **DragOverlay**: Custom preview shown while dragging

---

## Implementation Tasks

### Task 1: Install Dependencies

**Description:** Add @dnd-kit packages to the project

**Files:**
- MODIFY: `next-platform-dashboard/package.json`

**Command:**
```bash
cd next-platform-dashboard
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Acceptance Criteria:**
- [ ] All three packages installed and in package.json
- [ ] No version conflicts with existing packages

---

### Task 2: Create DnD Types

**Description:** Add TypeScript types for drag-and-drop operations

**Files:**
- MODIFY: `src/types/studio.ts`

**Code:**

Add to end of `src/types/studio.ts`:

```typescript
// =============================================================================
// DRAG & DROP TYPES
// =============================================================================

/**
 * Identifies what type of drag operation is happening
 */
export type DragSource = "library" | "canvas";

/**
 * Data attached to draggable items from the library
 */
export interface LibraryDragData {
  source: "library";
  componentType: string;
  label: string;
  icon: string;
}

/**
 * Data attached to sortable items on the canvas
 */
export interface CanvasDragData {
  source: "canvas";
  componentId: string;
  componentType: string;
  parentId: string | null;
  index: number;
}

/**
 * Union type for all drag data
 */
export type DragData = LibraryDragData | CanvasDragData;

/**
 * Drop target information
 */
export interface DropTarget {
  parentId: string; // "root" or component ID
  index: number;
  zoneId?: string;
}

/**
 * Type guard for library drag
 */
export function isLibraryDrag(data: DragData): data is LibraryDragData {
  return data.source === "library";
}

/**
 * Type guard for canvas drag
 */
export function isCanvasDrag(data: DragData): data is CanvasDragData {
  return data.source === "canvas";
}
```

**Acceptance Criteria:**
- [ ] Types compile without errors
- [ ] Type guards work correctly

---

### Task 3: Create DnD Context Provider

**Description:** Create the DnD context wrapper that provides drag-and-drop functionality to the entire editor

**Files:**
- CREATE: `src/components/studio/dnd/dnd-provider.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio DnD Provider
 * 
 * Wraps the editor with drag-and-drop context.
 * Handles drag start, drag end, and provides collision detection.
 */

"use client";

import React, { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  UniqueIdentifier,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useEditorStore, useUIStore, useSelectionStore } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { DragOverlayContent } from "./drag-overlay";
import type { DragData, LibraryDragData, CanvasDragData, isLibraryDrag } from "@/types/studio";

// =============================================================================
// COLLISION DETECTION
// =============================================================================

/**
 * Custom collision detection that prioritizes sortable items,
 * then falls back to canvas drop zone
 */
const customCollisionDetection: CollisionDetection = (args) => {
  // First, try closest center for sortable items
  const closestCenterCollisions = closestCenter(args);
  if (closestCenterCollisions.length > 0) {
    return closestCenterCollisions;
  }
  
  // Fall back to pointer within for the canvas container
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  
  // Last resort: rect intersection
  return rectIntersection(args);
};

// =============================================================================
// TYPES
// =============================================================================

interface DndProviderProps {
  children: React.ReactNode;
}

interface ActiveDragState {
  id: UniqueIdentifier;
  data: DragData;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DndProvider({ children }: DndProviderProps) {
  // Stores
  const addComponent = useEditorStore((s) => s.addComponent);
  const moveComponent = useEditorStore((s) => s.moveComponent);
  const data = useEditorStore((s) => s.data);
  const setDragging = useUIStore((s) => s.setDragging);
  const selectComponent = useSelectionStore((s) => s.select);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  
  // Local state
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  
  // =============================================================================
  // SENSORS
  // =============================================================================
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require 8px movement before starting drag
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      // Require 8px movement and 250ms delay on touch
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // =============================================================================
  // HANDLERS
  // =============================================================================
  
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current as DragData;
    
    setActiveDrag({
      id: active.id,
      data: dragData,
    });
    
    // Update UI store
    if (dragData.source === "library") {
      setDragging(true, dragData.componentType);
    } else {
      setDragging(true, dragData.componentType);
    }
    
    // Clear selection when starting to drag
    clearSelection();
  }, [setDragging, clearSelection]);
  
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id ?? null);
  }, []);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset state
    setActiveDrag(null);
    setOverId(null);
    setDragging(false, null);
    
    // No drop target
    if (!over) return;
    
    const dragData = active.data.current as DragData;
    
    // ==========================================================================
    // HANDLE LIBRARY DROP (Add new component)
    // ==========================================================================
    
    if (dragData.source === "library") {
      const { componentType } = dragData as LibraryDragData;
      
      // Get component definition for default props
      const definition = componentRegistry.get(componentType);
      if (!definition) {
        console.error(`[DnD] Unknown component type: ${componentType}`);
        return;
      }
      
      // Get default props
      const defaultProps = componentRegistry.getDefaultProps(componentType);
      
      // Determine drop location
      let parentId = "root";
      let index = data.root.children.length; // Default to end
      
      // If dropped on a specific component, insert after it
      const overId = over.id.toString();
      if (overId !== "canvas-drop-zone" && overId !== "root") {
        // Check if over a container component
        const overComponent = data.components[overId];
        if (overComponent) {
          const overDefinition = componentRegistry.get(overComponent.type);
          
          if (overDefinition?.acceptsChildren || overDefinition?.isContainer) {
            // Drop inside the container
            parentId = overId;
            index = overComponent.children?.length ?? 0;
          } else {
            // Drop after this component
            parentId = overComponent.parentId ?? "root";
            const siblings = overComponent.parentId
              ? data.components[overComponent.parentId]?.children ?? []
              : data.root.children;
            index = siblings.indexOf(overId) + 1;
          }
        }
      }
      
      // Add the component
      const newId = addComponent(componentType, defaultProps, parentId, index);
      
      // Select the new component
      selectComponent(newId);
      
      console.debug(`[DnD] Added ${componentType} to ${parentId} at index ${index}`);
      return;
    }
    
    // ==========================================================================
    // HANDLE CANVAS REORDER (Move existing component)
    // ==========================================================================
    
    if (dragData.source === "canvas") {
      const { componentId, parentId: oldParentId } = dragData as CanvasDragData;
      
      // Same position - no change
      if (active.id === over.id) return;
      
      const overId = over.id.toString();
      
      // Determine new position
      let newParentId = "root";
      let newIndex = 0;
      
      if (overId === "canvas-drop-zone" || overId === "root") {
        // Dropped at end of canvas
        newParentId = "root";
        newIndex = data.root.children.length;
      } else {
        // Dropped on/near another component
        const overComponent = data.components[overId];
        if (overComponent) {
          const overDefinition = componentRegistry.get(overComponent.type);
          
          if (overDefinition?.acceptsChildren || overDefinition?.isContainer) {
            // Drop inside container
            newParentId = overId;
            newIndex = overComponent.children?.length ?? 0;
          } else {
            // Drop as sibling (after)
            newParentId = overComponent.parentId ?? "root";
            const siblings = overComponent.parentId
              ? data.components[overComponent.parentId]?.children ?? []
              : data.root.children;
            newIndex = siblings.indexOf(overId) + 1;
            
            // Adjust index if moving within same parent
            if (oldParentId === newParentId) {
              const oldIndex = siblings.indexOf(componentId);
              if (oldIndex < newIndex) {
                newIndex -= 1;
              }
            }
          }
        }
      }
      
      // Move the component
      moveComponent(componentId, newParentId, newIndex);
      
      // Select the moved component
      selectComponent(componentId);
      
      console.debug(`[DnD] Moved ${componentId} to ${newParentId} at index ${newIndex}`);
    }
  }, [data, addComponent, moveComponent, selectComponent, setDragging]);
  
  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
    setOverId(null);
    setDragging(false, null);
  }, [setDragging]);
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      
      {/* Drag Overlay - shows preview while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <DragOverlayContent data={activeDrag.data} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

**Acceptance Criteria:**
- [ ] DndContext wraps children correctly
- [ ] Mouse, touch, and keyboard sensors configured
- [ ] onDragStart sets active drag state
- [ ] onDragEnd adds new components or moves existing
- [ ] DragOverlay shows during drag

---

### Task 4: Create Drag Overlay Component

**Description:** Create the visual overlay shown while dragging

**Files:**
- CREATE: `src/components/studio/dnd/drag-overlay.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Drag Overlay
 * 
 * Shows a preview of the component being dragged.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import * as LucideIcons from "lucide-react";
import type { DragData, LibraryDragData, CanvasDragData } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface DragOverlayContentProps {
  data: DragData;
}

// =============================================================================
// HELPER
// =============================================================================

function getIcon(iconName: string) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return Icon || LucideIcons.Box;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DragOverlayContent({ data }: DragOverlayContentProps) {
  if (data.source === "library") {
    return <LibraryDragOverlay data={data as LibraryDragData} />;
  }
  
  return <CanvasDragOverlay data={data as CanvasDragData} />;
}

// =============================================================================
// LIBRARY DRAG OVERLAY
// =============================================================================

function LibraryDragOverlay({ data }: { data: LibraryDragData }) {
  const Icon = getIcon(data.icon);
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-lg",
        "border-primary/50 bg-primary/5"
      )}
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">{data.label}</span>
    </div>
  );
}

// =============================================================================
// CANVAS DRAG OVERLAY
// =============================================================================

function CanvasDragOverlay({ data }: { data: CanvasDragData }) {
  const definition = componentRegistry.get(data.componentType);
  const Icon = getIcon(definition?.icon ?? "Box");
  const label = definition?.label ?? data.componentType;
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-lg",
        "border-blue-500/50 bg-blue-500/5"
      )}
    >
      <Icon className="h-4 w-4 text-blue-500" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">(moving)</span>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Library items show with icon and label
- [ ] Canvas items show with "(moving)" indicator
- [ ] Styling matches design system

---

### Task 5: Create Draggable Component Item

**Description:** Create the draggable wrapper for library items

**Files:**
- CREATE: `src/components/studio/dnd/draggable-component.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Draggable Component
 * 
 * Wraps component library items to make them draggable.
 */

"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { LibraryDragData } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface DraggableComponentProps {
  id: string;
  type: string;
  label: string;
  icon: string;
  children: React.ReactNode;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DraggableComponent({
  id,
  type,
  label,
  icon,
  children,
  disabled = false,
}: DraggableComponentProps) {
  const dragData: LibraryDragData = {
    source: "library",
    componentType: type,
    label,
    icon,
  };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `library-${id}`,
    data: dragData,
    disabled,
  });
  
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        disabled && "cursor-not-allowed opacity-50"
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Items become draggable when wrapped
- [ ] Drag data includes component type and metadata
- [ ] Visual feedback on drag (opacity)
- [ ] Disabled state works

---

### Task 6: Create Sortable Component Wrapper

**Description:** Create the sortable wrapper for canvas components

**Files:**
- CREATE: `src/components/studio/dnd/sortable-component.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Sortable Component
 * 
 * Wraps canvas components to make them sortable/reorderable.
 */

"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { CanvasDragData } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface SortableComponentProps {
  id: string;
  componentType: string;
  parentId: string | null;
  index: number;
  children: React.ReactNode;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SortableComponent({
  id,
  componentType,
  parentId,
  index,
  children,
  disabled = false,
}: SortableComponentProps) {
  const dragData: CanvasDragData = {
    source: "canvas",
    componentId: id,
    componentType,
    parentId,
    index,
  };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    data: dragData,
    disabled,
  });
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Maintain the element in flow but make it invisible when dragging
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isOver && "ring-2 ring-primary ring-offset-2",
        disabled && "pointer-events-none"
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Canvas components become sortable
- [ ] Drag data includes current position info
- [ ] Visual feedback when being dragged over
- [ ] Smooth transition animations

---

### Task 7: Create Droppable Canvas Area

**Description:** Create the droppable zone for the canvas

**Files:**
- CREATE: `src/components/studio/dnd/droppable-canvas.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Droppable Canvas
 * 
 * The main drop zone for the canvas.
 * Accepts drops from the library to add new components.
 */

"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface DroppableCanvasProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DroppableCanvas({
  id = "canvas-drop-zone",
  children,
  className,
}: DroppableCanvasProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id,
  });
  
  // Check if we're dragging from library
  const isDraggingFromLibrary = active?.data.current?.source === "library";
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-h-full transition-colors duration-200",
        // Show drop indicator when dragging from library
        isDraggingFromLibrary && "bg-primary/5",
        isDraggingFromLibrary && isOver && "bg-primary/10 ring-2 ring-inset ring-primary/30",
        className
      )}
    >
      {children}
      
      {/* Empty state indicator when dragging */}
      {isDraggingFromLibrary && !children && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg border-2 border-dashed border-primary/30 p-8 text-center">
            <p className="text-sm font-medium text-primary/60">
              Drop component here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Canvas accepts drops
- [ ] Visual feedback when hovering with draggable
- [ ] Shows "Drop here" message when empty

---

### Task 8: Create SortableContext Wrapper

**Description:** Create the sortable context for canvas component ordering

**Files:**
- CREATE: `src/components/studio/dnd/sortable-context.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Sortable Context
 * 
 * Provides sortable context for a list of components.
 */

"use client";

import React from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// =============================================================================
// TYPES
// =============================================================================

interface StudioSortableContextProps {
  items: string[];
  children: React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StudioSortableContext({
  items,
  children,
}: StudioSortableContextProps) {
  return (
    <SortableContext
      items={items}
      strategy={verticalListSortingStrategy}
    >
      {children}
    </SortableContext>
  );
}
```

**Acceptance Criteria:**
- [ ] Provides sorting context for items
- [ ] Uses vertical list strategy

---

### Task 9: Create Barrel Export

**Description:** Export all DnD components from a single index file

**Files:**
- CREATE: `src/components/studio/dnd/index.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio DnD Components
 */

export { DndProvider } from "./dnd-provider";
export { DragOverlayContent } from "./drag-overlay";
export { DraggableComponent } from "./draggable-component";
export { SortableComponent } from "./sortable-component";
export { DroppableCanvas } from "./droppable-canvas";
export { StudioSortableContext } from "./sortable-context";
```

**Acceptance Criteria:**
- [ ] All DnD components exported
- [ ] Clean import from "@/components/studio/dnd"

---

### Task 10: Update UI Store for Drag State

**Description:** Ensure UI store properly tracks drag state

**Files:**
- VERIFY: `src/lib/studio/store/ui-store.ts`

The UI store already has `isDragging` and `draggedType` state. Verify the store has these actions:

```typescript
// Already exists in ui-store.ts:
setDragging: (isDragging: boolean, draggedType?: string | null) => void;
```

**Acceptance Criteria:**
- [ ] UI store tracks isDragging state
- [ ] UI store tracks draggedType for visual feedback

---

### Task 11: Add DndProvider to StudioEditor

**Description:** Wrap the StudioEditor with DndProvider

**Files:**
- MODIFY: `src/components/studio/studio-editor.tsx`

**Code changes:**

Add import at top:
```tsx
import { DndProvider } from "@/components/studio/dnd";
```

Wrap the return content with DndProvider. The return statement should become:

```tsx
return (
  <DndProvider>
    <StudioLayout
      toolbar={
        <StudioToolbar
          // ... existing props
        />
      }
      leftPanel={<ComponentListPlaceholder />}
      canvas={<CanvasPlaceholder />}
      rightPanel={<PropertiesPanelPlaceholder />}
      bottomPanel={<BottomPanelPlaceholder />}
    />
  </DndProvider>
);
```

**Acceptance Criteria:**
- [ ] DndProvider wraps the entire editor
- [ ] No breaking changes to existing functionality

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| INSTALL | package.json | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |
| MODIFY | src/types/studio.ts | Add DnD type definitions |
| CREATE | src/components/studio/dnd/dnd-provider.tsx | Main DnD context provider |
| CREATE | src/components/studio/dnd/drag-overlay.tsx | Drag preview overlay |
| CREATE | src/components/studio/dnd/draggable-component.tsx | Library item wrapper |
| CREATE | src/components/studio/dnd/sortable-component.tsx | Canvas component wrapper |
| CREATE | src/components/studio/dnd/droppable-canvas.tsx | Canvas drop zone |
| CREATE | src/components/studio/dnd/sortable-context.tsx | Sortable context wrapper |
| CREATE | src/components/studio/dnd/index.ts | Barrel exports |
| MODIFY | src/components/studio/studio-editor.tsx | Add DndProvider wrapper |

---

## Testing Requirements

### Manual Testing

1. **Library Drag Start**
   - [ ] Hover over component in library → cursor changes to grab
   - [ ] Start dragging → cursor changes to grabbing
   - [ ] DragOverlay appears showing component name and icon
   - [ ] Original item becomes semi-transparent

2. **Canvas Drop**
   - [ ] Drag library item over canvas → canvas highlights
   - [ ] Drop on empty canvas → component added
   - [ ] Drop on existing component → component added after
   - [ ] Drop on container → component added inside container

3. **Canvas Reorder**
   - [ ] Drag existing canvas component → becomes sortable
   - [ ] Move up/down → other components shift
   - [ ] Drop → component in new position

4. **Keyboard Navigation**
   - [ ] Focus component → press Space → starts drag
   - [ ] Arrow keys → move between positions
   - [ ] Space → drop at new position
   - [ ] Escape → cancel drag

5. **State Updates**
   - [ ] Drop updates editorStore.data
   - [ ] Undo after drop reverts change
   - [ ] Redo after undo re-applies change

---

## Dependencies to Install

```bash
cd next-platform-dashboard
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Rollback Plan

1. Remove DndProvider wrapper from StudioEditor
2. Delete `src/components/studio/dnd/` folder
3. Remove DnD types from studio.ts
4. Run `pnpm remove @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

---

## Success Criteria

- [ ] @dnd-kit packages installed and working
- [ ] DndProvider wraps the editor
- [ ] Draggable components work from library
- [ ] Sortable components work on canvas
- [ ] Drop adds new components to editorStore
- [ ] Reorder moves components in editorStore
- [ ] DragOverlay shows preview
- [ ] Visual feedback during drag operations
- [ ] Keyboard accessibility works
- [ ] Undo/redo works with drag operations
- [ ] TypeScript compiles with zero errors
- [ ] No console errors during drag operations
