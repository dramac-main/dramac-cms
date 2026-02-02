# PHASE-STUDIO-07: Component Library Panel

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-07 |
| Title | Component Library Panel |
| Priority | Critical |
| Estimated Time | 6-8 hours |
| Dependencies | STUDIO-01, STUDIO-02, STUDIO-03, STUDIO-04, STUDIO-05, STUDIO-06 |
| Risk Level | Low |

## Problem Statement

Users need a way to browse, search, and drag components from a library to the canvas. The left panel currently shows a placeholder. We need to implement:

1. Searchable component list
2. Category-based organization with collapsible accordions
3. Component cards showing icon, name, and description
4. Drag-to-canvas functionality (integrates with STUDIO-05)
5. Category counts and recently used section

## Goals

- [ ] Create ComponentLibrary component with search
- [ ] Implement category accordion with expand/collapse
- [ ] Create ComponentCard showing icon, name, description
- [ ] Integrate with DraggableComponent from STUDIO-05
- [ ] Show component count per category
- [ ] Add keyboard navigation support
- [ ] Create "Recently Used" section (session-based)

## Technical Approach

### Library Panel Structure

```
┌─────────────────────────────────┐
│  COMPONENTS                [×]  │ ← Panel header with collapse
├─────────────────────────────────┤
│ 🔍 Search components...         │ ← Search input
├─────────────────────────────────┤
│                                 │
│ ▼ Recently Used (3)             │ ← Recently used section
│   ┌─────┐ ┌─────┐ ┌─────┐      │
│   │ H1  │ │ 📦  │ │ btn │      │   Small cards
│   └─────┘ └─────┘ └─────┘      │
│                                 │
│ ▼ Layout (4)                    │ ← Category accordion
│   ┌─────────────────────────┐  │
│   │ 📦  Section             │  │   Component card (draggable)
│   │     Full-width section  │  │
│   └─────────────────────────┘  │
│   ┌─────────────────────────┐  │
│   │ 📦  Container           │  │
│   │     Flexible container  │  │
│   └─────────────────────────┘  │
│                                 │
│ ▶ Typography (2)               │ ← Collapsed category
│                                 │
│ ▶ Interactive (1)              │
│                                 │
│ ▶ Media (1)                    │
│                                 │
└─────────────────────────────────┘
```

### State Management

The library panel uses local state for:
- Search query
- Expanded categories
- Recently used components (session storage)

---

## Implementation Tasks

### Task 1: Create ComponentCard

**Description:** Create the draggable component card shown in the library

**Files:**
- CREATE: `src/components/studio/panels/component-card.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Component Card
 * 
 * Displays a component in the library panel.
 * Wraps with DraggableComponent for drag functionality.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { DraggableComponent } from "@/components/studio/dnd";
import type { ComponentDefinition } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface ComponentCardProps {
  definition: ComponentDefinition;
  variant?: "default" | "compact";
  onDoubleClick?: () => void;
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

export function ComponentCard({
  definition,
  variant = "default",
  onDoubleClick,
}: ComponentCardProps) {
  const Icon = getIcon(definition.icon);
  
  // Compact variant for recently used
  if (variant === "compact") {
    return (
      <DraggableComponent
        id={`compact-${definition.type}`}
        type={definition.type}
        label={definition.label}
        icon={definition.icon}
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-md border bg-background p-2",
            "hover:border-primary hover:bg-primary/5 transition-colors",
            "cursor-grab active:cursor-grabbing",
            "w-16 h-16"
          )}
          onDoubleClick={onDoubleClick}
          title={definition.label}
        >
          <Icon className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground truncate max-w-full">
            {definition.label}
          </span>
        </div>
      </DraggableComponent>
    );
  }
  
  // Default variant - full card
  return (
    <DraggableComponent
      id={definition.type}
      type={definition.type}
      label={definition.label}
      icon={definition.icon}
    >
      <div
        className={cn(
          "flex items-start gap-3 rounded-md border bg-background p-3",
          "hover:border-primary hover:bg-primary/5 transition-colors",
          "cursor-grab active:cursor-grabbing"
        )}
        onDoubleClick={onDoubleClick}
        role="button"
        tabIndex={0}
        aria-label={`Drag ${definition.label} to canvas`}
      >
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-none">
            {definition.label}
          </h4>
          {definition.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {definition.description}
            </p>
          )}
        </div>
      </div>
    </DraggableComponent>
  );
}
```

**Acceptance Criteria:**
- [ ] Card shows icon, name, description
- [ ] Card is draggable (integrates with DnD)
- [ ] Compact variant for recently used
- [ ] Hover effect shows primary border
- [ ] Double-click handler works

---

### Task 2: Create CategoryAccordion

**Description:** Create the accordion for component categories

**Files:**
- CREATE: `src/components/studio/panels/category-accordion.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Category Accordion
 * 
 * Collapsible category section for the component library.
 */

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { ComponentCard } from "./component-card";
import type { ComponentDefinition } from "@/types/studio";
import type { CategoryInfo } from "@/lib/studio/registry/component-registry";

// =============================================================================
// TYPES
// =============================================================================

interface CategoryAccordionProps {
  category: CategoryInfo;
  components: ComponentDefinition[];
  defaultOpen?: boolean;
  onComponentDoubleClick?: (type: string) => void;
}

// =============================================================================
// HELPER
// =============================================================================

function getCategoryIcon(iconName: string) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return Icon || LucideIcons.Folder;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CategoryAccordion({
  category,
  components,
  defaultOpen = false,
  onComponentDoubleClick,
}: CategoryAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const CategoryIcon = getCategoryIcon(category.icon);
  
  if (components.length === 0) {
    return null;
  }
  
  return (
    <div className="border-b border-border last:border-b-0">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2.5 text-left",
          "hover:bg-muted/50 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        )}
        aria-expanded={isOpen}
        aria-controls={`category-${category.id}`}
      >
        {/* Expand/Collapse Icon */}
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        
        {/* Category Icon */}
        <CategoryIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        
        {/* Category Name */}
        <span className="flex-1 text-sm font-medium">
          {category.label}
        </span>
        
        {/* Count Badge */}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {components.length}
        </span>
      </button>
      
      {/* Content */}
      {isOpen && (
        <div
          id={`category-${category.id}`}
          className="space-y-2 px-3 pb-3"
        >
          {components.map((definition) => (
            <ComponentCard
              key={definition.type}
              definition={definition}
              onDoubleClick={() => onComponentDoubleClick?.(definition.type)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Category expands/collapses on click
- [ ] Shows category icon and name
- [ ] Shows component count badge
- [ ] Keyboard accessible (Enter/Space to toggle)
- [ ] Components render inside when expanded

---

### Task 3: Create RecentlyUsed Section

**Description:** Create the recently used components section

**Files:**
- CREATE: `src/components/studio/panels/recently-used.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Recently Used Section
 * 
 * Shows recently used components for quick access.
 * Stored in session storage.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { ComponentCard } from "./component-card";
import { componentRegistry } from "@/lib/studio/registry/component-registry";

// =============================================================================
// TYPES
// =============================================================================

interface RecentlyUsedProps {
  componentTypes: string[];
  onComponentDoubleClick?: (type: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RecentlyUsed({
  componentTypes,
  onComponentDoubleClick,
}: RecentlyUsedProps) {
  if (componentTypes.length === 0) {
    return null;
  }
  
  // Get definitions for the types
  const definitions = componentTypes
    .map((type) => componentRegistry.get(type))
    .filter((d): d is NonNullable<typeof d> => d !== undefined)
    .slice(0, 6); // Max 6 recent items
  
  if (definitions.length === 0) {
    return null;
  }
  
  return (
    <div className="border-b border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium">Recently Used</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {definitions.length}
        </span>
      </div>
      
      {/* Compact component cards */}
      <div className="flex flex-wrap gap-2 px-3 pb-3">
        {definitions.map((definition) => (
          <ComponentCard
            key={definition.type}
            definition={definition}
            variant="compact"
            onDoubleClick={() => onComponentDoubleClick?.(definition.type)}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// HOOK FOR MANAGING RECENTLY USED
// =============================================================================

const STORAGE_KEY = "studio-recently-used";
const MAX_RECENT = 10;

export function useRecentlyUsed() {
  const [recentTypes, setRecentTypes] = React.useState<string[]>([]);
  
  // Load from session storage on mount
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentTypes(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  }, []);
  
  // Add a type to recently used
  const addRecent = React.useCallback((type: string) => {
    setRecentTypes((prev) => {
      // Remove if already exists, add to front
      const filtered = prev.filter((t) => t !== type);
      const updated = [type, ...filtered].slice(0, MAX_RECENT);
      
      // Save to session storage
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore errors
      }
      
      return updated;
    });
  }, []);
  
  // Clear recently used
  const clearRecent = React.useCallback(() => {
    setRecentTypes([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }, []);
  
  return {
    recentTypes,
    addRecent,
    clearRecent,
  };
}
```

**Acceptance Criteria:**
- [ ] Shows up to 6 recent components
- [ ] Uses compact card variant
- [ ] Persists in session storage
- [ ] Hook manages recent types list
- [ ] New additions move to front

---

### Task 4: Create ComponentLibrary Panel

**Description:** Create the main library panel that combines all pieces

**Files:**
- CREATE: `src/components/studio/panels/component-library.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Component Library
 * 
 * The left panel showing all available components.
 * Supports search, categories, and drag-to-canvas.
 */

"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelHeader } from "@/components/studio/layout/panel-header";
import { CategoryAccordion } from "./category-accordion";
import { RecentlyUsed, useRecentlyUsed } from "./recently-used";
import { ComponentCard } from "./component-card";
import { componentRegistry, CATEGORIES } from "@/lib/studio/registry/component-registry";
import { useUIStore, useEditorStore, useSelectionStore } from "@/lib/studio/store";
import { Layers } from "lucide-react";
import type { ComponentDefinition, ComponentCategory } from "@/types/studio";

// =============================================================================
// COMPONENT
// =============================================================================

export function ComponentLibrary() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["layout", "typography"]) // Default expanded
  );
  
  // Recently used
  const { recentTypes, addRecent } = useRecentlyUsed();
  
  // Stores
  const togglePanel = useUIStore((s) => s.togglePanel);
  const addComponent = useEditorStore((s) => s.addComponent);
  const selectComponent = useSelectionStore((s) => s.select);
  
  // Get all components grouped by category
  const groupedComponents = useMemo(() => {
    return componentRegistry.getGroupedByCategory();
  }, []);
  
  // Get active categories (only those with components)
  const activeCategories = useMemo(() => {
    return componentRegistry.getActiveCategories();
  }, []);
  
  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) {
      return null; // Show categories when not searching
    }
    return componentRegistry.search(searchQuery);
  }, [searchQuery]);
  
  // Handle component double-click (quick add)
  const handleQuickAdd = useCallback((type: string) => {
    const definition = componentRegistry.get(type);
    if (!definition) return;
    
    // Get default props
    const defaultProps = componentRegistry.getDefaultProps(type);
    
    // Add to canvas
    const newId = addComponent(type, defaultProps, "root");
    
    // Select the new component
    selectComponent(newId);
    
    // Add to recently used
    addRecent(type);
  }, [addComponent, selectComponent, addRecent]);
  
  // Handle category toggle
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);
  
  // Listen for component drops to add to recently used
  // This is handled via the DnD system, but we can also track double-clicks
  
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <PanelHeader
        title="Components"
        icon={Layers}
        position="left"
        onCollapse={() => togglePanel("left")}
      />
      
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Component List */}
      <ScrollArea className="flex-1">
        {filteredComponents !== null ? (
          // Search results
          <div className="p-3">
            {filteredComponents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No components found for &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {filteredComponents.length} result{filteredComponents.length !== 1 ? "s" : ""}
                </p>
                {filteredComponents.map((definition) => (
                  <ComponentCard
                    key={definition.type}
                    definition={definition}
                    onDoubleClick={() => handleQuickAdd(definition.type)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Category view
          <div>
            {/* Recently Used */}
            <RecentlyUsed
              componentTypes={recentTypes}
              onComponentDoubleClick={handleQuickAdd}
            />
            
            {/* Categories */}
            {activeCategories.map((category) => {
              const components = groupedComponents.get(category.id) || [];
              return (
                <CategoryAccordion
                  key={category.id}
                  category={category}
                  components={components}
                  defaultOpen={expandedCategories.has(category.id)}
                  onComponentDoubleClick={handleQuickAdd}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>
      
      {/* Footer - Component count */}
      <div className="border-t border-border p-2 text-center">
        <p className="text-xs text-muted-foreground">
          {componentRegistry.count} components available
        </p>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Search filters components by name/description
- [ ] Categories show in accordion format
- [ ] Recently used section appears when not empty
- [ ] Double-click adds component to canvas
- [ ] Component count shows in footer
- [ ] Clear search button works
- [ ] Categories remember expand state

---

### Task 5: Create Panels Barrel Export

**Description:** Export all panel components

**Files:**
- CREATE: `src/components/studio/panels/index.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio Panel Components
 */

export { ComponentLibrary } from "./component-library";
export { ComponentCard } from "./component-card";
export { CategoryAccordion } from "./category-accordion";
export { RecentlyUsed, useRecentlyUsed } from "./recently-used";
```

---

### Task 6: Update StudioEditor to Use ComponentLibrary

**Description:** Replace the left panel placeholder with ComponentLibrary

**Files:**
- MODIFY: `src/components/studio/studio-editor.tsx`

**Code changes:**

Add import:
```tsx
import { ComponentLibrary } from "@/components/studio/panels";
```

Replace in return:
```tsx
// Replace:
leftPanel={<ComponentListPlaceholder />}

// With:
leftPanel={<ComponentLibrary />}
```

Also remove the `ComponentListPlaceholder` function since it's no longer needed.

**Acceptance Criteria:**
- [ ] Left panel shows ComponentLibrary
- [ ] Old placeholder removed
- [ ] No TypeScript errors

---

### Task 7: Track Component Drops for Recently Used

**Description:** Add recently used tracking when components are dropped

**Files:**
- MODIFY: `src/components/studio/dnd/dnd-provider.tsx`

**Code changes:**

In the `handleDragEnd` function, after successfully adding a component:

```tsx
// At the top of the file, add:
// This requires passing the addRecent function down or using a different approach

// Alternative: Create a custom event that the library can listen to
// After addComponent succeeds:
if (typeof window !== "undefined") {
  window.dispatchEvent(new CustomEvent("studio:component-dropped", {
    detail: { type: componentType }
  }));
}
```

Then in `ComponentLibrary`:

```tsx
// Listen for drops to track recently used
useEffect(() => {
  const handleDrop = (e: CustomEvent<{ type: string }>) => {
    addRecent(e.detail.type);
  };
  
  window.addEventListener("studio:component-dropped", handleDrop as EventListener);
  return () => {
    window.removeEventListener("studio:component-dropped", handleDrop as EventListener);
  };
}, [addRecent]);
```

**Acceptance Criteria:**
- [ ] Dropping a component adds it to recently used
- [ ] Recently used updates in real-time

---

### Task 8: Add Keyboard Navigation

**Description:** Add keyboard support for the component library

**Files:**
- MODIFY: `src/components/studio/panels/component-library.tsx`

**Code changes:**

Add keyboard handler for the search input:

```tsx
// Handle keyboard navigation
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  // Escape clears search
  if (e.key === "Escape" && searchQuery) {
    e.preventDefault();
    clearSearch();
  }
}, [searchQuery, clearSearch]);

// Add to Input:
onKeyDown={handleKeyDown}
```

Also ensure all interactive elements are focusable and respond to Enter/Space.

**Acceptance Criteria:**
- [ ] Escape clears search
- [ ] Tab navigates through components
- [ ] Enter/Space on component card drags or adds

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | src/components/studio/panels/component-card.tsx | Draggable component card |
| CREATE | src/components/studio/panels/category-accordion.tsx | Category accordion |
| CREATE | src/components/studio/panels/recently-used.tsx | Recently used section + hook |
| CREATE | src/components/studio/panels/component-library.tsx | Main library panel |
| CREATE | src/components/studio/panels/index.ts | Panel exports |
| MODIFY | src/components/studio/studio-editor.tsx | Use ComponentLibrary |
| MODIFY | src/components/studio/dnd/dnd-provider.tsx | Track drops for recently used |

---

## Testing Requirements

### Manual Testing

1. **Search**
   - [ ] Type in search → filters components
   - [ ] Clear button appears when text entered
   - [ ] Escape clears search
   - [ ] "No results" message shows for bad search
   
2. **Categories**
   - [ ] Click category → expands/collapses
   - [ ] Count badge shows correct number
   - [ ] Default categories expanded on load
   
3. **Component Cards**
   - [ ] Shows icon, name, description
   - [ ] Hover shows primary border
   - [ ] Drag starts on mousedown + move
   - [ ] Double-click adds to canvas
   
4. **Recently Used**
   - [ ] Empty initially
   - [ ] Shows after dropping/double-clicking
   - [ ] Persists in session storage
   - [ ] Max 6 items shown
   - [ ] New items appear first
   
5. **Keyboard**
   - [ ] Tab through components
   - [ ] Escape clears search
   - [ ] Enter/Space on component triggers action

---

## Success Criteria

- [ ] Component library panel fully functional
- [ ] Search filters components in real-time
- [ ] Categories expand/collapse correctly
- [ ] Components are draggable to canvas
- [ ] Double-click quick-adds components
- [ ] Recently used tracks component usage
- [ ] Component count accurate
- [ ] Keyboard navigation works
- [ ] TypeScript compiles with zero errors
- [ ] Panel scrolls properly with many components
