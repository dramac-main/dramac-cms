# PHASE-STUDIO-16: Layers & Structure Panel

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-16 |
| Title | Layers & Structure Panel |
| Priority | Medium |
| Estimated Time | 10-12 hours |
| Dependencies | STUDIO-04 (Layout Shell), STUDIO-05 (DnD), STUDIO-06 (Canvas) |
| Risk Level | Medium |

## Problem Statement

Currently, users can only select components by clicking on them in the canvas. For complex pages with many nested components, it's difficult to:
- See the full page structure at a glance
- Select deeply nested components
- Reorder components without drag-and-drop on canvas
- Protect certain components from accidental edits
- Temporarily hide components while working on others

This phase adds a **Layers Panel** (bottom panel) that shows the component tree, allowing users to:
- Click to select any component in the tree
- Drag to reorder components
- Lock components (prevent editing)
- Hide components (invisible on canvas)
- Use context menu for quick actions

## Goals

- [ ] Create bottom panel with component tree visualization
- [ ] Implement click-to-select in tree view
- [ ] Add drag-to-reorder functionality within tree
- [ ] Implement lock/unlock component functionality
- [ ] Implement hide/show component functionality
- [ ] Add context menu with common actions
- [ ] Add search/filter for components
- [ ] Support expand/collapse for nested components

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  BOTTOM PANEL (collapsible, 200px default height)              │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Search components...                    [👁 All] [🔒 All]   │
├─────────────────────────────────────────────────────────────────┤
│  📄 Page                                                        │
│  ├─ 📦 Section "Hero"                          [👁] [🔒]        │
│  │  ├─ 📝 Heading "Welcome to..."              [👁] [🔒]        │
│  │  ├─ 📝 Text "Lorem ipsum..."                [👁] [🔒]        │
│  │  └─ 🔘 Button "Get Started"                 [👁] [🔒]        │
│  ├─ 📦 Section "Features"                      [👁] [🔒]        │
│  │  └─ 📦 Container                            [👁] [🔒]        │
│  │     ├─ 🖼️ Image                             [👁] [🔒]        │
│  │     └─ 📝 Text                              [👁] [🔒]        │
│  └─ 📦 Section "Footer"                        [👁] [🔒]        │
└─────────────────────────────────────────────────────────────────┘
```

### State Management

Extend the editor store with lock/hide functionality. The layers panel reads from the components state and provides tree manipulation actions.

### DnD in Tree

Use `@dnd-kit/sortable` for reordering within the tree. When a component is dragged in the tree:
1. Show drop indicator (line above/below/inside for containers)
2. Calculate new position (before/after/child)
3. Update component's parentId and order
4. Canvas updates immediately

## Implementation Tasks

### Task 1: Extend Types for Lock/Hide

**Description:** Add locked and hidden properties to the StudioComponent type.

**Files:**
- MODIFY: `src/types/studio.ts`

**Code:**

```typescript
// Add to StudioComponent interface in src/types/studio.ts

export interface StudioComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[];
  parentId?: string;
  zoneId?: string;
  // NEW: Lock and hide state
  locked?: boolean;  // When true, component cannot be edited, deleted, or moved
  hidden?: boolean;  // When true, component is not rendered on canvas
}

// Add LayerItem type for tree rendering
export interface LayerItem {
  id: string;
  type: string;
  label: string;
  icon: string;
  children: LayerItem[];
  isLocked: boolean;
  isHidden: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  depth: number;
  parentId?: string;
}

// Layer actions
export type LayerAction = 
  | 'rename'
  | 'duplicate'
  | 'delete'
  | 'lock'
  | 'unlock'
  | 'hide'
  | 'show'
  | 'moveUp'
  | 'moveDown'
  | 'copyId';
```

**Acceptance Criteria:**
- [ ] StudioComponent has locked and hidden optional properties
- [ ] LayerItem type defined for tree rendering
- [ ] LayerAction type defined for context menu

---

### Task 2: Extend Editor Store with Lock/Hide Actions

**Description:** Add actions to lock, unlock, hide, and show components. Also add tree reordering action.

**Files:**
- MODIFY: `src/lib/studio/store/editor-store.ts`

**Code:**

```typescript
// Add to EditorState interface
interface EditorState {
  // ... existing properties
  
  // Layer visibility state
  expandedLayers: Set<string>;
  
  // Layer actions
  lockComponent: (id: string) => void;
  unlockComponent: (id: string) => void;
  hideComponent: (id: string) => void;
  showComponent: (id: string) => void;
  toggleLayerExpanded: (id: string) => void;
  expandAllLayers: () => void;
  collapseAllLayers: () => void;
  moveComponentInTree: (
    componentId: string, 
    targetId: string, 
    position: 'before' | 'after' | 'inside'
  ) => void;
}

// Add implementations (inside create store)
export const useEditorStore = create<EditorState>()(
  temporal(
    immer((set, get) => ({
      // ... existing state
      
      expandedLayers: new Set<string>(),
      
      lockComponent: (id) => set((state) => {
        const component = state.pageData.components[id];
        if (component) {
          component.locked = true;
        }
      }),
      
      unlockComponent: (id) => set((state) => {
        const component = state.pageData.components[id];
        if (component) {
          component.locked = false;
        }
      }),
      
      hideComponent: (id) => set((state) => {
        const component = state.pageData.components[id];
        if (component) {
          component.hidden = true;
        }
        // If this component was selected, deselect it
        if (state.selectedComponentId === id) {
          state.selectedComponentId = null;
        }
      }),
      
      showComponent: (id) => set((state) => {
        const component = state.pageData.components[id];
        if (component) {
          component.hidden = false;
        }
      }),
      
      toggleLayerExpanded: (id) => set((state) => {
        const expanded = new Set(state.expandedLayers);
        if (expanded.has(id)) {
          expanded.delete(id);
        } else {
          expanded.add(id);
        }
        state.expandedLayers = expanded;
      }),
      
      expandAllLayers: () => set((state) => {
        const allIds = Object.keys(state.pageData.components);
        state.expandedLayers = new Set(allIds);
      }),
      
      collapseAllLayers: () => set((state) => {
        state.expandedLayers = new Set();
      }),
      
      moveComponentInTree: (componentId, targetId, position) => set((state) => {
        const { pageData } = state;
        const component = pageData.components[componentId];
        const target = pageData.components[targetId];
        
        if (!component || !target) return;
        if (component.locked) return; // Can't move locked components
        
        // Remove from current parent
        const oldParentId = component.parentId;
        if (oldParentId) {
          const oldParent = pageData.components[oldParentId];
          if (oldParent?.children) {
            oldParent.children = oldParent.children.filter(id => id !== componentId);
          }
        } else {
          // Remove from root
          pageData.root.children = pageData.root.children.filter(id => id !== componentId);
        }
        
        if (position === 'inside') {
          // Add as child of target
          component.parentId = targetId;
          if (!target.children) target.children = [];
          target.children.push(componentId);
        } else {
          // Add as sibling of target
          const newParentId = target.parentId;
          component.parentId = newParentId;
          
          const siblings = newParentId 
            ? pageData.components[newParentId]?.children || []
            : pageData.root.children;
          
          const targetIndex = siblings.indexOf(targetId);
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
          
          if (newParentId) {
            const parent = pageData.components[newParentId];
            if (parent?.children) {
              parent.children.splice(insertIndex, 0, componentId);
            }
          } else {
            pageData.root.children.splice(insertIndex, 0, componentId);
          }
        }
      }),
    })),
    { limit: 50 }
  )
);
```

**Acceptance Criteria:**
- [ ] lockComponent and unlockComponent work correctly
- [ ] hideComponent and showComponent work correctly
- [ ] Hidden components get deselected
- [ ] moveComponentInTree updates tree structure
- [ ] Locked components cannot be moved
- [ ] Layer expansion state is tracked

---

### Task 3: Create Layer Tree Utilities

**Description:** Create utility functions to convert flat component map to tree structure for rendering.

**Files:**
- CREATE: `src/lib/studio/utils/layer-utils.ts`

**Code:**

```typescript
// src/lib/studio/utils/layer-utils.ts
import type { StudioComponent, StudioPageData, LayerItem } from '@/types/studio';
import { getComponentDefinition } from '@/lib/studio/registry/component-registry';

/**
 * Get display label for a component
 */
export function getComponentLabel(component: StudioComponent): string {
  // Try to get a meaningful label from props
  const labelProps = ['title', 'text', 'label', 'heading', 'name', 'alt'];
  
  for (const prop of labelProps) {
    const value = component.props[prop];
    if (typeof value === 'string' && value.trim()) {
      // Truncate long text
      const text = value.trim();
      return text.length > 30 ? text.slice(0, 30) + '...' : text;
    }
    // Handle responsive values
    if (value && typeof value === 'object' && 'mobile' in value) {
      const mobileValue = (value as { mobile: unknown }).mobile;
      if (typeof mobileValue === 'string' && mobileValue.trim()) {
        const text = mobileValue.trim();
        return text.length > 30 ? text.slice(0, 30) + '...' : text;
      }
    }
  }
  
  // Fall back to component type
  return component.type;
}

/**
 * Get icon for a component type
 */
export function getComponentIcon(type: string): string {
  const definition = getComponentDefinition(type);
  if (definition?.icon) {
    return definition.icon;
  }
  
  // Default icons by type category
  const iconMap: Record<string, string> = {
    // Layout
    Section: 'layout',
    Container: 'square',
    Columns: 'columns',
    Grid: 'grid-3x3',
    Spacer: 'move-vertical',
    
    // Typography
    Heading: 'heading',
    Text: 'type',
    RichText: 'text',
    
    // Media
    Image: 'image',
    Video: 'video',
    Icon: 'star',
    
    // Interactive
    Button: 'mouse-pointer-click',
    Link: 'link',
    Accordion: 'chevrons-down-up',
    Tabs: 'panel-top',
    
    // Marketing
    Hero: 'sparkles',
    CTA: 'megaphone',
    Testimonial: 'quote',
    
    // E-Commerce
    ProductCard: 'shopping-bag',
    Cart: 'shopping-cart',
  };
  
  return iconMap[type] || 'component';
}

/**
 * Build tree structure from flat components
 */
export function buildLayerTree(
  pageData: StudioPageData,
  selectedComponentId: string | null,
  expandedLayers: Set<string>
): LayerItem[] {
  const { root, components } = pageData;
  
  function buildNode(componentId: string, depth: number): LayerItem | null {
    const component = components[componentId];
    if (!component) return null;
    
    const children = (component.children || [])
      .map(childId => buildNode(childId, depth + 1))
      .filter((child): child is LayerItem => child !== null);
    
    return {
      id: component.id,
      type: component.type,
      label: getComponentLabel(component),
      icon: getComponentIcon(component.type),
      children,
      isLocked: component.locked || false,
      isHidden: component.hidden || false,
      isSelected: component.id === selectedComponentId,
      isExpanded: expandedLayers.has(component.id),
      depth,
      parentId: component.parentId,
    };
  }
  
  return root.children
    .map(id => buildNode(id, 0))
    .filter((item): item is LayerItem => item !== null);
}

/**
 * Flatten tree for virtualized rendering
 */
export function flattenLayerTree(
  tree: LayerItem[],
  expandedLayers: Set<string>
): LayerItem[] {
  const result: LayerItem[] = [];
  
  function traverse(items: LayerItem[]) {
    for (const item of items) {
      result.push(item);
      if (item.children.length > 0 && expandedLayers.has(item.id)) {
        traverse(item.children);
      }
    }
  }
  
  traverse(tree);
  return result;
}

/**
 * Filter layers by search query
 */
export function filterLayers(
  layers: LayerItem[],
  query: string
): LayerItem[] {
  if (!query.trim()) return layers;
  
  const lowerQuery = query.toLowerCase();
  
  function matchesQuery(item: LayerItem): boolean {
    return (
      item.type.toLowerCase().includes(lowerQuery) ||
      item.label.toLowerCase().includes(lowerQuery)
    );
  }
  
  function filterTree(items: LayerItem[]): LayerItem[] {
    return items
      .map(item => {
        const filteredChildren = filterTree(item.children);
        if (matchesQuery(item) || filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren,
            isExpanded: true, // Expand matching items
          };
        }
        return null;
      })
      .filter((item): item is LayerItem => item !== null);
  }
  
  return filterTree(layers);
}

/**
 * Get all component IDs in tree order
 */
export function getAllLayerIds(pageData: StudioPageData): string[] {
  const result: string[] = [];
  
  function traverse(componentId: string) {
    result.push(componentId);
    const component = pageData.components[componentId];
    if (component?.children) {
      component.children.forEach(traverse);
    }
  }
  
  pageData.root.children.forEach(traverse);
  return result;
}
```

**Acceptance Criteria:**
- [ ] buildLayerTree creates proper tree structure
- [ ] getComponentLabel extracts meaningful labels
- [ ] getComponentIcon returns appropriate icons
- [ ] filterLayers filters by search query
- [ ] flattenLayerTree works with virtualization

---

### Task 4: Create Layer Row Component

**Description:** Create the individual layer row component with icons, toggle buttons, and interaction handlers.

**Files:**
- CREATE: `src/components/studio/features/layer-row.tsx`

**Code:**

```typescript
// src/components/studio/features/layer-row.tsx
'use client';

import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ChevronRight, 
  ChevronDown,
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  GripVertical,
  Component
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LayerItem } from '@/types/studio';
import { useEditorStore } from '@/lib/studio/store/editor-store';

// Dynamic icon component using lucide-react
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  layout: require('lucide-react').LayoutGrid,
  square: require('lucide-react').Square,
  columns: require('lucide-react').Columns,
  'grid-3x3': require('lucide-react').Grid3X3,
  'move-vertical': require('lucide-react').MoveVertical,
  heading: require('lucide-react').Heading,
  type: require('lucide-react').Type,
  text: require('lucide-react').FileText,
  image: require('lucide-react').Image,
  video: require('lucide-react').Video,
  star: require('lucide-react').Star,
  'mouse-pointer-click': require('lucide-react').MousePointerClick,
  link: require('lucide-react').Link,
  'chevrons-down-up': require('lucide-react').ChevronsDownUp,
  'panel-top': require('lucide-react').PanelTop,
  sparkles: require('lucide-react').Sparkles,
  megaphone: require('lucide-react').Megaphone,
  quote: require('lucide-react').Quote,
  'shopping-bag': require('lucide-react').ShoppingBag,
  'shopping-cart': require('lucide-react').ShoppingCart,
  component: Component,
};

interface LayerRowProps {
  item: LayerItem;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleLock: (id: string, locked: boolean) => void;
  onToggleVisibility: (id: string, hidden: boolean) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export const LayerRow = memo(function LayerRow({
  item,
  onSelect,
  onToggleExpand,
  onToggleLock,
  onToggleVisibility,
  onContextMenu,
}: LayerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: item.isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = iconComponents[item.icon] || Component;
  const hasChildren = item.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(item.id);
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(item.id, !item.isLocked);
  };

  const handleVisibilityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility(item.id, !item.isHidden);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center h-8 px-2 gap-1 rounded-md cursor-pointer',
        'hover:bg-accent/50 transition-colors',
        item.isSelected && 'bg-primary/10 hover:bg-primary/15',
        item.isHidden && 'opacity-50',
        isDragging && 'opacity-50 bg-accent'
      )}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, item.id)}
    >
      {/* Indent based on depth */}
      <div style={{ width: item.depth * 16 }} className="shrink-0" />
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'shrink-0 cursor-grab active:cursor-grabbing',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          item.isLocked && 'cursor-not-allowed opacity-30'
        )}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      
      {/* Expand/Collapse button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-5 w-5 shrink-0 p-0',
          !hasChildren && 'invisible'
        )}
        onClick={handleExpandClick}
      >
        {item.isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </Button>
      
      {/* Component icon */}
      <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
      
      {/* Label */}
      <span className={cn(
        'flex-1 text-sm truncate',
        item.isSelected && 'font-medium'
      )}>
        {item.label}
      </span>
      
      {/* Type badge (subtle) */}
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
        {item.type}
      </span>
      
      {/* Lock toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-5 w-5 shrink-0 p-0',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          item.isLocked && 'opacity-100'
        )}
        onClick={handleLockClick}
        title={item.isLocked ? 'Unlock' : 'Lock'}
      >
        {item.isLocked ? (
          <Lock className="h-3 w-3 text-amber-500" />
        ) : (
          <Unlock className="h-3 w-3 text-muted-foreground" />
        )}
      </Button>
      
      {/* Visibility toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-5 w-5 shrink-0 p-0',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          item.isHidden && 'opacity-100'
        )}
        onClick={handleVisibilityClick}
        title={item.isHidden ? 'Show' : 'Hide'}
      >
        {item.isHidden ? (
          <EyeOff className="h-3 w-3 text-muted-foreground" />
        ) : (
          <Eye className="h-3 w-3 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
});
```

**Acceptance Criteria:**
- [ ] Layer row shows icon, label, type
- [ ] Indent correctly based on depth
- [ ] Expand/collapse chevron for containers
- [ ] Lock/unlock button toggles state
- [ ] Visibility button toggles hidden state
- [ ] Drag handle appears on hover
- [ ] Selected state highlighted
- [ ] Right-click triggers context menu

---

### Task 5: Create Layer Context Menu

**Description:** Create the context menu for layer actions (duplicate, delete, lock, hide, etc.).

**Files:**
- CREATE: `src/components/studio/features/layer-context-menu.tsx`

**Code:**

```typescript
// src/components/studio/features/layer-context-menu.tsx
'use client';

import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Clipboard,
  Edit3,
} from 'lucide-react';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { toast } from 'sonner';

interface LayerContextMenuProps {
  componentId: string;
  isLocked: boolean;
  isHidden: boolean;
  children: React.ReactNode;
}

export function LayerContextMenu({
  componentId,
  isLocked,
  isHidden,
  children,
}: LayerContextMenuProps) {
  const {
    duplicateComponent,
    deleteComponent,
    lockComponent,
    unlockComponent,
    hideComponent,
    showComponent,
    pageData,
  } = useEditorStore();

  const component = pageData.components[componentId];
  if (!component) return <>{children}</>;

  const handleDuplicate = () => {
    if (isLocked) {
      toast.error('Cannot duplicate locked component');
      return;
    }
    duplicateComponent(componentId);
    toast.success('Component duplicated');
  };

  const handleDelete = () => {
    if (isLocked) {
      toast.error('Cannot delete locked component');
      return;
    }
    deleteComponent(componentId);
    toast.success('Component deleted');
  };

  const handleToggleLock = () => {
    if (isLocked) {
      unlockComponent(componentId);
      toast.success('Component unlocked');
    } else {
      lockComponent(componentId);
      toast.success('Component locked');
    }
  };

  const handleToggleVisibility = () => {
    if (isHidden) {
      showComponent(componentId);
    } else {
      hideComponent(componentId);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(componentId);
    toast.success('Component ID copied');
  };

  const handleMoveUp = () => {
    if (isLocked) {
      toast.error('Cannot move locked component');
      return;
    }
    // Find siblings and move up
    const parentId = component.parentId;
    const siblings = parentId 
      ? pageData.components[parentId]?.children || []
      : pageData.root.children;
    
    const currentIndex = siblings.indexOf(componentId);
    if (currentIndex > 0) {
      const targetId = siblings[currentIndex - 1];
      useEditorStore.getState().moveComponentInTree(componentId, targetId, 'before');
    }
  };

  const handleMoveDown = () => {
    if (isLocked) {
      toast.error('Cannot move locked component');
      return;
    }
    // Find siblings and move down
    const parentId = component.parentId;
    const siblings = parentId 
      ? pageData.components[parentId]?.children || []
      : pageData.root.children;
    
    const currentIndex = siblings.indexOf(componentId);
    if (currentIndex < siblings.length - 1) {
      const targetId = siblings[currentIndex + 1];
      useEditorStore.getState().moveComponentInTree(componentId, targetId, 'after');
    }
  };

  return (
    <ContextMenu>
      {children}
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleDuplicate} disabled={isLocked}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleDelete} disabled={isLocked} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleToggleLock}>
          {isLocked ? (
            <>
              <Unlock className="mr-2 h-4 w-4" />
              Unlock
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Lock
            </>
          )}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleToggleVisibility}>
          {isHidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Show
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide
            </>
          )}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleMoveUp} disabled={isLocked}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Move Up
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleMoveDown} disabled={isLocked}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Move Down
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleCopyId}>
          <Clipboard className="mr-2 h-4 w-4" />
          Copy ID
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

**Acceptance Criteria:**
- [ ] Context menu appears on right-click
- [ ] Duplicate creates copy of component
- [ ] Delete removes component
- [ ] Lock/Unlock toggles state
- [ ] Hide/Show toggles visibility
- [ ] Move Up/Down reorders component
- [ ] Copy ID copies to clipboard
- [ ] Locked components show disabled state for protected actions

---

### Task 6: Create Layers Panel Component

**Description:** Create the main layers panel that renders in the bottom panel with search, tree view, and bulk actions.

**Files:**
- CREATE: `src/components/studio/features/layers-panel.tsx`

**Code:**

```typescript
// src/components/studio/features/layers-panel.tsx
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Search, Eye, EyeOff, Lock, Unlock, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ContextMenuTrigger } from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { 
  buildLayerTree, 
  flattenLayerTree, 
  filterLayers,
  getAllLayerIds,
} from '@/lib/studio/utils/layer-utils';
import { LayerRow } from './layer-row';
import { LayerContextMenu } from './layer-context-menu';
import type { LayerItem } from '@/types/studio';

export function LayersPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const {
    pageData,
    selectedComponentId,
    selectComponent,
    expandedLayers,
    toggleLayerExpanded,
    expandAllLayers,
    collapseAllLayers,
    lockComponent,
    unlockComponent,
    hideComponent,
    showComponent,
    moveComponentInTree,
  } = useEditorStore();

  // Build tree structure
  const layerTree = useMemo(() => {
    return buildLayerTree(pageData, selectedComponentId, expandedLayers);
  }, [pageData, selectedComponentId, expandedLayers]);

  // Filter tree if searching
  const filteredTree = useMemo(() => {
    return filterLayers(layerTree, searchQuery);
  }, [layerTree, searchQuery]);

  // Flatten for rendering (respecting collapsed state)
  const flatLayers = useMemo(() => {
    const searchExpanded = searchQuery 
      ? new Set(getAllLayerIds(pageData)) // Expand all when searching
      : expandedLayers;
    return flattenLayerTree(filteredTree, searchExpanded);
  }, [filteredTree, expandedLayers, searchQuery, pageData]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Determine drop position based on cursor position relative to target
    // For simplicity, always drop 'after' the target
    moveComponentInTree(activeId, overId, 'after');
  }, [moveComponentInTree]);

  const handleSelect = useCallback((id: string) => {
    selectComponent(id);
  }, [selectComponent]);

  const handleToggleExpand = useCallback((id: string) => {
    toggleLayerExpanded(id);
  }, [toggleLayerExpanded]);

  const handleToggleLock = useCallback((id: string, locked: boolean) => {
    if (locked) {
      lockComponent(id);
    } else {
      unlockComponent(id);
    }
  }, [lockComponent, unlockComponent]);

  const handleToggleVisibility = useCallback((id: string, hidden: boolean) => {
    if (hidden) {
      hideComponent(id);
    } else {
      showComponent(id);
    }
  }, [hideComponent, showComponent]);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    // Context menu is handled by LayerContextMenu wrapper
  }, []);

  // Bulk actions
  const handleShowAll = useCallback(() => {
    Object.keys(pageData.components).forEach(id => {
      showComponent(id);
    });
  }, [pageData.components, showComponent]);

  const handleUnlockAll = useCallback(() => {
    Object.keys(pageData.components).forEach(id => {
      unlockComponent(id);
    });
  }, [pageData.components, unlockComponent]);

  const componentCount = Object.keys(pageData.components).length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Layers</span>
          <span className="text-xs text-muted-foreground">
            ({componentCount})
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={expandAllLayers}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand All</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={collapseAllLayers}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collapse All</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleShowAll}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show All</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleUnlockAll}
                >
                  <Unlock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Unlock All</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="pl-8 h-8"
          />
        </div>
      </div>
      
      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {flatLayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              {searchQuery ? (
                <>
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No components match "{searchQuery}"</p>
                </>
              ) : (
                <>
                  <Layers className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No components on page</p>
                  <p className="text-xs mt-1">Drag components from the library</p>
                </>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={flatLayers.map(l => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {flatLayers.map((item) => (
                  <LayerContextMenu
                    key={item.id}
                    componentId={item.id}
                    isLocked={item.isLocked}
                    isHidden={item.isHidden}
                  >
                    <ContextMenuTrigger>
                      <LayerRow
                        item={item}
                        onSelect={handleSelect}
                        onToggleExpand={handleToggleExpand}
                        onToggleLock={handleToggleLock}
                        onToggleVisibility={handleToggleVisibility}
                        onContextMenu={handleContextMenu}
                      />
                    </ContextMenuTrigger>
                  </LayerContextMenu>
                ))}
              </SortableContext>
              
              <DragOverlay>
                {activeDragId && (
                  <div className="bg-background border rounded-md shadow-lg px-3 py-2 text-sm">
                    {pageData.components[activeDragId]?.type || 'Component'}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Panel shows component tree hierarchy
- [ ] Search filters components in real-time
- [ ] Expand/collapse all buttons work
- [ ] Show all and unlock all buttons work
- [ ] Empty state shown when no components
- [ ] Drag and drop reorders components
- [ ] Component count displayed in header

---

### Task 7: Update Bottom Panel to Include Layers

**Description:** Update the bottom panel component to render the LayersPanel.

**Files:**
- MODIFY: `src/components/studio/panels/bottom-panel.tsx`

**Code:**

```typescript
// src/components/studio/panels/bottom-panel.tsx
'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { LayersPanel } from '@/components/studio/features/layers-panel';

export function BottomPanel() {
  const { panelVisibility, togglePanel } = useUIStore();
  const isVisible = panelVisibility.bottom;

  return (
    <div
      className={cn(
        'border-t bg-background transition-all duration-200',
        isVisible ? 'h-[200px]' : 'h-8'
      )}
    >
      {/* Toggle bar */}
      <div className="flex items-center justify-between h-8 px-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1"
          onClick={() => togglePanel('bottom')}
        >
          {isVisible ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
          <span className="text-xs">Layers</span>
        </Button>
      </div>
      
      {/* Panel content */}
      {isVisible && (
        <div className="h-[calc(100%-32px)]">
          <LayersPanel />
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Bottom panel shows toggle bar
- [ ] Clicking toggle expands/collapses panel
- [ ] LayersPanel renders when visible
- [ ] Smooth height transition

---

### Task 8: Update Canvas to Respect Lock/Hide

**Description:** Modify the component wrapper to respect locked and hidden states.

**Files:**
- MODIFY: `src/components/studio/core/component-wrapper.tsx`

**Code:**

```typescript
// Add to component-wrapper.tsx - update the component to handle locked/hidden

// In the component wrapper, add these checks:

// 1. Don't render hidden components
if (component.hidden) {
  return null;
}

// 2. Show lock indicator and disable interactions for locked components
const isLocked = component.locked || false;

// In the wrapper JSX:
<div
  className={cn(
    'relative group',
    isSelected && 'ring-2 ring-primary',
    isHovered && !isSelected && 'ring-1 ring-primary/50',
    isLocked && 'cursor-not-allowed'
  )}
  onClick={(e) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      toast.info('Component is locked');
      return;
    }
    handleClick(e);
  }}
>
  {/* Lock indicator */}
  {isLocked && (
    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600">
      <Lock className="h-3 w-3" />
      <span className="text-xs font-medium">Locked</span>
    </div>
  )}
  
  {/* Component content */}
  {children}
</div>
```

**Acceptance Criteria:**
- [ ] Hidden components don't render on canvas
- [ ] Locked components show lock indicator
- [ ] Clicking locked component shows toast message
- [ ] Locked components can't be selected from canvas

---

### Task 9: Add Keyboard Shortcuts for Layers

**Description:** Add keyboard shortcuts for lock/hide in the studio editor.

**Files:**
- MODIFY: `src/components/studio/studio-editor.tsx`

**Code:**

```typescript
// Add to existing keyboard shortcuts in studio-editor.tsx

// Lock selected component - Ctrl/Cmd + L
useHotkeys('mod+l', (e) => {
  e.preventDefault();
  const { selectedComponentId, pageData, lockComponent, unlockComponent } = useEditorStore.getState();
  if (!selectedComponentId) return;
  
  const component = pageData.components[selectedComponentId];
  if (component?.locked) {
    unlockComponent(selectedComponentId);
    toast.success('Component unlocked');
  } else {
    lockComponent(selectedComponentId);
    toast.success('Component locked');
  }
}, []);

// Hide selected component - Ctrl/Cmd + H
useHotkeys('mod+h', (e) => {
  e.preventDefault();
  const { selectedComponentId, pageData, hideComponent, showComponent } = useEditorStore.getState();
  if (!selectedComponentId) return;
  
  const component = pageData.components[selectedComponentId];
  if (component?.hidden) {
    showComponent(selectedComponentId);
  } else {
    hideComponent(selectedComponentId);
  }
}, []);
```

**Acceptance Criteria:**
- [ ] Ctrl/Cmd + L toggles lock on selected component
- [ ] Ctrl/Cmd + H toggles hide on selected component
- [ ] Toast notifications confirm actions

---

### Task 10: Create Index Export

**Description:** Export all new layer components.

**Files:**
- MODIFY: `src/components/studio/features/index.ts`

**Code:**

```typescript
// src/components/studio/features/index.ts
export { LayersPanel } from './layers-panel';
export { LayerRow } from './layer-row';
export { LayerContextMenu } from './layer-context-menu';
```

**Acceptance Criteria:**
- [ ] All layer components exported

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | `src/types/studio.ts` | Add locked, hidden props and LayerItem type |
| MODIFY | `src/lib/studio/store/editor-store.ts` | Add lock/hide/tree actions |
| CREATE | `src/lib/studio/utils/layer-utils.ts` | Tree building utilities |
| CREATE | `src/components/studio/features/layer-row.tsx` | Individual layer row component |
| CREATE | `src/components/studio/features/layer-context-menu.tsx` | Right-click context menu |
| CREATE | `src/components/studio/features/layers-panel.tsx` | Main layers panel |
| MODIFY | `src/components/studio/panels/bottom-panel.tsx` | Integrate LayersPanel |
| MODIFY | `src/components/studio/core/component-wrapper.tsx` | Respect lock/hide states |
| MODIFY | `src/components/studio/studio-editor.tsx` | Add keyboard shortcuts |
| MODIFY | `src/components/studio/features/index.ts` | Export new components |

## Testing Requirements

### Unit Tests
- [ ] buildLayerTree creates correct tree from flat data
- [ ] filterLayers filters by type and label
- [ ] flattenLayerTree respects expanded state
- [ ] lockComponent/unlockComponent update state correctly
- [ ] hideComponent/showComponent update state correctly
- [ ] moveComponentInTree reorders correctly

### Integration Tests
- [ ] Clicking layer selects component in canvas
- [ ] Dragging layer reorders in canvas
- [ ] Lock prevents canvas interaction
- [ ] Hide removes from canvas

### Manual Testing
- [ ] Create page with nested components
- [ ] Verify tree structure matches canvas
- [ ] Search for components by name
- [ ] Lock component and try to edit
- [ ] Hide component and verify not visible
- [ ] Right-click context menu works
- [ ] Keyboard shortcuts work (Cmd+L, Cmd+H)
- [ ] Expand/collapse tree nodes
- [ ] Drag to reorder in tree
- [ ] Bulk show all / unlock all

## Dependencies to Install

```bash
# No new dependencies needed - uses existing @dnd-kit packages
```

## Rollback Plan

1. Remove new files in `src/components/studio/features/`
2. Remove `src/lib/studio/utils/layer-utils.ts`
3. Revert changes to editor-store.ts
4. Revert changes to component-wrapper.tsx
5. Revert changes to bottom-panel.tsx

## Success Criteria

- [ ] Bottom panel shows collapsible layers view
- [ ] Component tree displays all page components hierarchically
- [ ] Click layer to select component in canvas
- [ ] Drag layers to reorder (updates canvas immediately)
- [ ] Lock toggle prevents editing/deleting component
- [ ] Hide toggle hides component from canvas
- [ ] Context menu provides quick actions
- [ ] Search filters components by name/type
- [ ] Keyboard shortcuts work (Cmd+L, Cmd+H)
- [ ] Bulk actions (show all, unlock all) work
- [ ] Performance acceptable with 50+ components
