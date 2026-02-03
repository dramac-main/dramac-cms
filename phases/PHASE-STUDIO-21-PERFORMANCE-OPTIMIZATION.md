# PHASE-STUDIO-21: Performance Optimization

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-21 |
| Title | Performance Optimization |
| Priority | Medium |
| Estimated Time | 10-12 hours |
| Dependencies | STUDIO-04 (Layout), STUDIO-06 (Canvas), STUDIO-07 (Library) |
| Risk Level | Medium |

## Problem Statement

As DRAMAC Studio scales to handle complex pages with hundreds of components, performance becomes critical. Currently:

- Component library re-renders on every store update
- Large component lists (200+) cause scroll lag
- All panels load upfront, blocking initial render
- AI features loaded even when not used
- No performance monitoring to catch regressions

This phase implements **performance optimizations**:
- Virtualization for long lists
- Memoization to prevent unnecessary re-renders
- Code splitting for lazy panel loading
- Debounced store updates
- Performance metrics for monitoring

## Goals

- [ ] Virtualize component library and layers panel lists
- [ ] Memoize component wrappers with custom comparison
- [ ] Debounce prop updates to reduce re-renders
- [ ] Code-split all panels for lazy loading
- [ ] Lazy load AI features only when needed
- [ ] Create performance measurement utilities
- [ ] Optimize Zustand selectors to minimize re-renders
- [ ] Achieve smooth 60fps scrolling with 500+ components

## Technical Approach

### Performance Strategy Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  PERFORMANCE OPTIMIZATION LAYERS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. VIRTUALIZATION (@tanstack/react-virtual)                    │
│     ├── Component Library (left panel)                          │
│     ├── Layers Panel (bottom panel)                             │
│     └── History List (history panel)                            │
│                                                                  │
│  2. MEMOIZATION (React.memo + useMemo)                          │
│     ├── ComponentWrapper - custom shallow compare               │
│     ├── LayerRow - props comparison                             │
│     ├── FieldRenderer - field-specific memoization              │
│     └── ComponentItem - registry lookup caching                 │
│                                                                  │
│  3. CODE SPLITTING (next/dynamic)                               │
│     ├── LeftPanel (lazy)                                        │
│     ├── RightPanel (lazy)                                       │
│     ├── BottomPanel (lazy)                                      │
│     ├── AIComponentChat (lazy, prefetch on hover)               │
│     └── AIPageGenerator (lazy)                                  │
│                                                                  │
│  4. DEBOUNCING (lodash-es debounce)                             │
│     ├── setComponentProps → 100ms debounce                      │
│     ├── Search filters → 200ms debounce                         │
│     └── Auto-save → 1000ms debounce                             │
│                                                                  │
│  5. SELECTORS (zustand shallow)                                 │
│     ├── Only subscribe to needed state slices                   │
│     └── Use shallow equality for object selections              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load | < 2s to interactive | Lighthouse TTI |
| List Scroll | 60fps | DevTools Performance |
| Component Selection | < 50ms | Performance.now() |
| Prop Update Render | < 16ms | React DevTools Profiler |
| Memory (500 components) | < 100MB | DevTools Memory |

## Implementation Tasks

### Task 1: Install Virtualization Library

**Description:** Add @tanstack/react-virtual for efficient list rendering.

**Files:**
- MODIFY: `next-platform-dashboard/package.json`

**Commands:**
```bash
cd next-platform-dashboard
pnpm add @tanstack/react-virtual
```

**Acceptance Criteria:**
- [ ] Package installed
- [ ] Types available

---

### Task 2: Create Virtualized Component List

**Description:** Virtualize the component library in the left panel.

**Files:**
- CREATE: `src/components/studio/panels/virtualized-component-list.tsx`
- MODIFY: `src/components/studio/panels/left-panel.tsx`

**Code:**
```typescript
// src/components/studio/panels/virtualized-component-list.tsx

'use client';

import { useRef, useMemo, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ComponentDefinition } from '@/types/studio';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface VirtualizedComponentListProps {
  components: ComponentDefinition[];
  className?: string;
}

export function VirtualizedComponentList({ 
  components, 
  className 
}: VirtualizedComponentListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: components.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Each component item is ~48px tall
    overscan: 5, // Render 5 extra items above/below viewport
  });
  
  const virtualItems = virtualizer.getVirtualItems();
  
  return (
    <div 
      ref={parentRef}
      className={cn("h-full overflow-auto", className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const component = components[virtualItem.index];
          
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <VirtualizedComponentItem component={component} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Memoized component item
const VirtualizedComponentItem = memo(function VirtualizedComponentItem({
  component,
}: {
  component: ComponentDefinition;
}) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    isDragging 
  } = useDraggable({
    id: `library-${component.type}`,
    data: {
      type: 'library-item',
      componentType: component.type,
    },
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center gap-3 px-3 py-2 mx-2",
        "rounded-md cursor-grab",
        "hover:bg-muted transition-colors",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
      style={style}
    >
      <span className="text-lg">{component.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{component.label}</p>
        {component.description && (
          <p className="text-xs text-muted-foreground truncate">
            {component.description}
          </p>
        )}
      </div>
    </div>
  );
});

// Use in left panel when component count > threshold
export function shouldVirtualize(count: number): boolean {
  return count > 30;
}
```

**Left Panel Integration:**
```typescript
// src/components/studio/panels/left-panel.tsx

import { VirtualizedComponentList, shouldVirtualize } from './virtualized-component-list';

// In component:
const filteredComponents = useComponentSearch(searchTerm);

// Render:
{shouldVirtualize(filteredComponents.length) ? (
  <VirtualizedComponentList 
    components={filteredComponents}
    className="flex-1"
  />
) : (
  <div className="space-y-1 px-2">
    {filteredComponents.map((comp) => (
      <ComponentItem key={comp.type} component={comp} />
    ))}
  </div>
)}
```

**Acceptance Criteria:**
- [ ] Component list virtualizes for 30+ items
- [ ] Smooth scrolling with 200+ components
- [ ] Drag and drop still works
- [ ] No visual artifacts during scroll

---

### Task 3: Virtualize Layers Panel

**Description:** Apply virtualization to the layers tree for large pages.

**Files:**
- MODIFY: `src/components/studio/features/layers-panel.tsx`

**Code:**
```typescript
// src/components/studio/features/layers-panel.tsx

import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { flattenTree } from '@/lib/studio/utils/layer-utils';

interface LayersPanelProps {
  // ...existing props
}

export function LayersPanel({ rootChildren, components }: LayersPanelProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Flatten tree for virtualization (respecting collapsed state)
  const flatLayers = useMemo(() => {
    return flattenTree(rootChildren, components, collapsedIds);
  }, [rootChildren, components, collapsedIds]);
  
  const virtualizer = useVirtualizer({
    count: flatLayers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const layer = flatLayers[index];
      // Zones are slightly shorter
      return layer.isZone ? 32 : 36;
    },
    overscan: 10,
  });
  
  const virtualItems = virtualizer.getVirtualItems();
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const layer = flatLayers[virtualItem.index];
          
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <LayerRow
                layer={layer}
                depth={layer.depth}
                isSelected={layer.id === selectedId}
                isCollapsed={collapsedIds.has(layer.id)}
                onToggleCollapse={() => toggleCollapse(layer.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Add to layer-utils.ts
export interface FlatLayer {
  id: string;
  type: string;
  label: string;
  depth: number;
  hasChildren: boolean;
  isZone: boolean;
  parentId?: string;
}

export function flattenTree(
  rootChildren: string[],
  components: Record<string, StudioComponent>,
  collapsedIds: Set<string>,
  depth = 0
): FlatLayer[] {
  const result: FlatLayer[] = [];
  
  for (const id of rootChildren) {
    const component = components[id];
    if (!component) continue;
    
    const hasChildren = (component.children?.length || 0) > 0;
    
    result.push({
      id: component.id,
      type: component.type,
      label: getComponentLabel(component),
      depth,
      hasChildren,
      isZone: false,
      parentId: component.parentId,
    });
    
    // If not collapsed, add children
    if (hasChildren && !collapsedIds.has(component.id)) {
      const childLayers = flattenTree(
        component.children!,
        components,
        collapsedIds,
        depth + 1
      );
      result.push(...childLayers);
    }
  }
  
  return result;
}
```

**Acceptance Criteria:**
- [ ] Layers panel virtualizes for large trees
- [ ] Collapse/expand works correctly
- [ ] Selection highlighting works
- [ ] Indentation preserved

---

### Task 4: Memoize Component Wrapper

**Description:** Add React.memo with custom comparison to prevent unnecessary re-renders.

**Files:**
- MODIFY: `src/components/studio/core/component-wrapper.tsx`

**Code:**
```typescript
// src/components/studio/core/component-wrapper.tsx

import { memo, useMemo, useCallback } from 'react';
import { StudioComponent } from '@/types/studio';
import { useComponentRegistry } from '@/lib/studio/registry/component-registry';
import { useSelectionStore } from '@/lib/studio/store/selection-store';
import { cn } from '@/lib/utils';

interface ComponentWrapperProps {
  component: StudioComponent;
  isSelected: boolean;
  isHovered: boolean;
  previewMode: boolean;
}

// Custom comparison function
function arePropsEqual(
  prevProps: ComponentWrapperProps,
  nextProps: ComponentWrapperProps
): boolean {
  // Fast path: check reference equality first
  if (prevProps.component === nextProps.component) {
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isHovered === nextProps.isHovered &&
      prevProps.previewMode === nextProps.previewMode
    );
  }
  
  // Deep comparison for component
  if (prevProps.component.id !== nextProps.component.id) return false;
  if (prevProps.component.type !== nextProps.component.type) return false;
  if (prevProps.component.locked !== nextProps.component.locked) return false;
  if (prevProps.component.hidden !== nextProps.component.hidden) return false;
  
  // Compare props object (shallow for performance)
  const prevPropsKeys = Object.keys(prevProps.component.props);
  const nextPropsKeys = Object.keys(nextProps.component.props);
  
  if (prevPropsKeys.length !== nextPropsKeys.length) return false;
  
  for (const key of prevPropsKeys) {
    if (prevProps.component.props[key] !== nextProps.component.props[key]) {
      return false;
    }
  }
  
  // Compare other props
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.previewMode === nextProps.previewMode
  );
}

export const ComponentWrapper = memo(function ComponentWrapper({
  component,
  isSelected,
  isHovered,
  previewMode,
}: ComponentWrapperProps) {
  // Get component definition
  const definition = useComponentRegistry(
    useCallback(s => s.getComponent(component.type), [component.type])
  );
  
  // Memoize render component reference
  const RenderComponent = useMemo(() => {
    return definition?.render;
  }, [definition]);
  
  // Memoize effective props
  const effectiveProps = useMemo(() => {
    return {
      ...component.props,
      'data-component-id': component.id,
      'data-component-type': component.type,
    };
  }, [component.props, component.id, component.type]);
  
  // Skip render for hidden components in edit mode
  if (component.hidden && !previewMode) {
    return (
      <div 
        className="opacity-30 pointer-events-none"
        data-hidden="true"
      >
        <RenderComponent {...effectiveProps} />
      </div>
    );
  }
  
  if (!RenderComponent) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive text-sm rounded">
        Unknown component: {component.type}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        'relative transition-shadow duration-150',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isHovered && !isSelected && 'ring-1 ring-primary/50',
        component.locked && 'cursor-not-allowed',
      )}
      data-component-id={component.id}
      data-selected={isSelected}
    >
      <RenderComponent {...effectiveProps} />
      
      {/* Selection overlay */}
      {isSelected && !previewMode && (
        <ComponentSelectionOverlay 
          component={component}
          definition={definition}
        />
      )}
    </div>
  );
}, arePropsEqual);

// Also memoize selection overlay
const ComponentSelectionOverlay = memo(function ComponentSelectionOverlay({
  component,
  definition,
}: {
  component: StudioComponent;
  definition: ComponentDefinition | undefined;
}) {
  return (
    <div className="absolute -top-6 left-0 flex items-center gap-1 z-10">
      <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded">
        {definition?.label || component.type}
      </span>
      {component.locked && (
        <span className="px-1 py-0.5 bg-muted text-muted-foreground text-xs rounded">
          🔒
        </span>
      )}
    </div>
  );
});
```

**Acceptance Criteria:**
- [ ] Components don't re-render unless props change
- [ ] Selection changes are fast
- [ ] Hidden components render differently
- [ ] React DevTools shows reduced renders

---

### Task 5: Debounce Store Updates

**Description:** Add debouncing to prop updates and search inputs.

**Files:**
- CREATE: `src/lib/studio/utils/debounce.ts`
- MODIFY: `src/lib/studio/store/editor-store.ts`

**Code:**
```typescript
// src/lib/studio/utils/debounce.ts

/**
 * Simple debounce implementation that doesn't require external dependencies
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
      timeoutId = null;
    }, delay);
  };
  
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };
  
  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };
  
  return debounced;
}

/**
 * Hook for debounced value
 */
import { useState, useEffect, useRef } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook for debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const debouncedRef = useRef<ReturnType<typeof debounce> | null>(null);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Create debounced function once
  useEffect(() => {
    debouncedRef.current = debounce((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay);
    
    return () => {
      debouncedRef.current?.cancel();
    };
  }, [delay]);
  
  return ((...args: Parameters<T>) => {
    debouncedRef.current?.(...args);
  }) as T;
}
```

**Editor Store Updates:**
```typescript
// src/lib/studio/store/editor-store.ts

import { debounce } from '@/lib/studio/utils/debounce';

// Create debounced save function
const debouncedSaveToDatabase = debounce(
  async (pageId: string, data: StudioPageData) => {
    try {
      await savePageData(pageId, data);
      console.log('[Studio] Auto-saved');
    } catch (error) {
      console.error('[Studio] Auto-save failed:', error);
    }
  },
  1000 // 1 second debounce for auto-save
);

// In store:
setComponentProps: (id, props) => {
  // Immediate update for UI responsiveness
  set((state) => {
    if (!state.components[id]) return;
    
    state.components[id] = {
      ...state.components[id],
      props: {
        ...state.components[id].props,
        ...props,
      },
    };
  });
  
  // Debounced save to database
  const pageId = get().pageId;
  if (pageId) {
    debouncedSaveToDatabase(pageId, get().getPageData());
  }
},

// For immediate prop updates (no debounce), use separate method:
setComponentPropsImmediate: (id, props) => {
  set((state) => {
    if (!state.components[id]) return;
    
    state.components[id] = {
      ...state.components[id],
      props: {
        ...state.components[id].props,
        ...props,
      },
    };
  });
},
```

**Acceptance Criteria:**
- [ ] Prop updates don't trigger save immediately
- [ ] Auto-save triggers after 1 second of inactivity
- [ ] UI updates are still instant
- [ ] Cancel/flush methods work

---

### Task 6: Code Split Panels

**Description:** Lazy load panels using next/dynamic to reduce initial bundle.

**Files:**
- CREATE: `src/components/studio/panels/index.ts`
- MODIFY: `src/components/studio/core/studio-layout.tsx`

**Code:**
```typescript
// src/components/studio/panels/index.ts

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Loading skeletons
function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="p-4 space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PropertiesSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Lazy loaded panels
export const LeftPanel = dynamic(
  () => import('./left-panel').then(mod => ({ default: mod.LeftPanel })),
  {
    loading: () => <PanelSkeleton className="w-64" />,
    ssr: false,
  }
);

export const RightPanel = dynamic(
  () => import('./right-panel').then(mod => ({ default: mod.RightPanel })),
  {
    loading: () => <PropertiesSkeleton />,
    ssr: false,
  }
);

export const BottomPanel = dynamic(
  () => import('./bottom-panel').then(mod => ({ default: mod.BottomPanel })),
  {
    loading: () => <PanelSkeleton className="h-48" />,
    ssr: false,
  }
);

// AI components (loaded on demand)
export const AIComponentChat = dynamic(
  () => import('../ai/ai-component-chat').then(mod => ({ default: mod.AIComponentChat })),
  {
    loading: () => (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    ),
    ssr: false,
  }
);

export const AIPageGenerator = dynamic(
  () => import('../ai/ai-page-generator').then(mod => ({ default: mod.AIPageGenerator })),
  {
    loading: () => (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    ),
    ssr: false,
  }
);

// Prefetch functions for better UX
export function prefetchAIChat() {
  import('../ai/ai-component-chat');
}

export function prefetchAIGenerator() {
  import('../ai/ai-page-generator');
}
```

**Studio Layout Integration:**
```typescript
// src/components/studio/core/studio-layout.tsx

import { LeftPanel, RightPanel, BottomPanel, prefetchAIChat } from '../panels';
import { Suspense } from 'react';

export function StudioLayout({ children }: { children: React.ReactNode }) {
  // Prefetch AI on mount (user likely to use it)
  useEffect(() => {
    // Prefetch after 2 seconds of idle
    const timer = setTimeout(() => {
      prefetchAIChat();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="h-screen flex flex-col">
      <TopToolbar />
      
      <div className="flex-1 flex overflow-hidden">
        <Suspense fallback={<PanelSkeleton className="w-64" />}>
          <LeftPanel />
        </Suspense>
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
          
          <Suspense fallback={<PanelSkeleton className="h-48" />}>
            <BottomPanel />
          </Suspense>
        </main>
        
        <Suspense fallback={<PropertiesSkeleton />}>
          <RightPanel />
        </Suspense>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Initial bundle doesn't include panel code
- [ ] Panels load on first render
- [ ] Loading skeletons show during load
- [ ] AI features load on demand
- [ ] Prefetch triggers after idle

---

### Task 7: Optimize Zustand Selectors

**Description:** Create optimized selectors to minimize re-renders.

**Files:**
- CREATE: `src/lib/studio/store/selectors.ts`

**Code:**
```typescript
// src/lib/studio/store/selectors.ts

import { shallow } from 'zustand/shallow';
import { useEditorStore } from './editor-store';
import { useUIStore } from './ui-store';
import { useSelectionStore } from './selection-store';
import { StudioComponent } from '@/types/studio';
import { useMemo } from 'react';

/**
 * Get a single component by ID (stable reference)
 */
export function useComponent(id: string | null): StudioComponent | null {
  return useEditorStore(
    (s) => (id ? s.components[id] : null),
    (a, b) => a?.id === b?.id && a?.props === b?.props
  );
}

/**
 * Get component props only (for property panel)
 */
export function useComponentProps(id: string | null): Record<string, unknown> | null {
  return useEditorStore(
    (s) => (id ? s.components[id]?.props : null),
    shallow
  );
}

/**
 * Get root children IDs only
 */
export function useRootChildren(): string[] {
  return useEditorStore((s) => s.root.children, shallow);
}

/**
 * Get selected component with all needed data
 */
export function useSelectedComponent() {
  const selectedId = useSelectionStore((s) => s.selectedId);
  const component = useEditorStore(
    (s) => (selectedId ? s.components[selectedId] : null),
    (a, b) => a?.id === b?.id && a?.props === b?.props
  );
  
  return { selectedId, component };
}

/**
 * Get multiple components by IDs
 */
export function useComponents(ids: string[]): StudioComponent[] {
  const components = useEditorStore((s) => s.components);
  
  return useMemo(() => {
    return ids.map(id => components[id]).filter(Boolean);
  }, [ids, components]);
}

/**
 * Get UI state for canvas
 */
export function useCanvasUIState() {
  return useUIStore(
    (s) => ({
      zoom: s.zoom,
      viewportWidth: s.viewportWidth,
      viewportHeight: s.viewportHeight,
      previewMode: s.previewMode,
      showRuler: s.showRuler,
      showDeviceFrame: s.showDeviceFrame,
    }),
    shallow
  );
}

/**
 * Get editor actions (stable references)
 */
export function useEditorActions() {
  return useEditorStore(
    (s) => ({
      addComponent: s.addComponent,
      deleteComponent: s.deleteComponent,
      duplicateComponent: s.duplicateComponent,
      setComponentProps: s.setComponentProps,
      moveComponent: s.moveComponent,
    }),
    shallow
  );
}

/**
 * Check if a component is selected
 */
export function useIsSelected(id: string): boolean {
  return useSelectionStore((s) => s.selectedId === id);
}

/**
 * Check if a component is hovered
 */
export function useIsHovered(id: string): boolean {
  return useSelectionStore((s) => s.hoveredId === id);
}

/**
 * Get component count (for performance decisions)
 */
export function useComponentCount(): number {
  return useEditorStore((s) => Object.keys(s.components).length);
}

/**
 * Selector for checking if store has unsaved changes
 */
export function useHasUnsavedChanges(): boolean {
  return useEditorStore((s) => s.hasUnsavedChanges);
}
```

**Usage Example:**
```typescript
// Instead of:
const { components, selectedId, zoom } = useEditorStore();

// Use:
import { useSelectedComponent, useCanvasUIState } from '@/lib/studio/store/selectors';

const { selectedId, component } = useSelectedComponent();
const { zoom } = useCanvasUIState();

// This prevents re-renders when unrelated state changes
```

**Acceptance Criteria:**
- [ ] Selectors use shallow comparison where appropriate
- [ ] Components only re-render when their data changes
- [ ] Canvas doesn't re-render on selection changes
- [ ] Properties panel only re-renders for selected component

---

### Task 8: Create Performance Monitoring Utilities

**Description:** Add utilities to measure and log performance metrics.

**Files:**
- CREATE: `src/lib/studio/utils/performance.ts`

**Code:**
```typescript
// src/lib/studio/utils/performance.ts

const isDev = process.env.NODE_ENV === 'development';
const SLOW_RENDER_THRESHOLD = 16; // 1 frame at 60fps
const VERY_SLOW_RENDER_THRESHOLD = 50;

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

// Store recent metrics for analysis
const metricsBuffer: PerformanceMetric[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Measure render time of a component
 */
export function measureRender(componentName: string) {
  if (!isDev) return () => {};
  
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    
    // Store metric
    metricsBuffer.push({
      name: componentName,
      duration,
      timestamp: Date.now(),
    });
    
    // Keep buffer size manageable
    if (metricsBuffer.length > MAX_BUFFER_SIZE) {
      metricsBuffer.shift();
    }
    
    // Log slow renders
    if (duration > VERY_SLOW_RENDER_THRESHOLD) {
      console.warn(
        `🐢 Very slow render: ${componentName} took ${duration.toFixed(2)}ms`
      );
    } else if (duration > SLOW_RENDER_THRESHOLD) {
      console.log(
        `⚠️ Slow render: ${componentName} took ${duration.toFixed(2)}ms`
      );
    }
  };
}

/**
 * Measure an async operation
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    return await operation();
  } finally {
    const duration = performance.now() - start;
    
    if (isDev) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    metricsBuffer.push({
      name,
      duration,
      timestamp: Date.now(),
    });
  }
}

/**
 * Hook to measure component render time
 */
import { useEffect, useRef } from 'react';

export function useRenderMetrics(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  
  useEffect(() => {
    if (!isDev) return;
    
    renderCount.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    if (renderCount.current > 1 && timeSinceLastRender < 100) {
      console.log(
        `🔄 Rapid re-render: ${componentName} (${renderCount.current} renders, ${timeSinceLastRender.toFixed(0)}ms apart)`
      );
    }
  });
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  if (metricsBuffer.length === 0) {
    return { message: 'No metrics recorded' };
  }
  
  const byName = new Map<string, number[]>();
  
  for (const metric of metricsBuffer) {
    if (!byName.has(metric.name)) {
      byName.set(metric.name, []);
    }
    byName.get(metric.name)!.push(metric.duration);
  }
  
  const summary: Record<string, {
    count: number;
    avgMs: number;
    maxMs: number;
    minMs: number;
  }> = {};
  
  for (const [name, durations] of byName) {
    summary[name] = {
      count: durations.length,
      avgMs: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxMs: Math.max(...durations),
      minMs: Math.min(...durations),
    };
  }
  
  return summary;
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary() {
  if (!isDev) return;
  
  const summary = getPerformanceSummary();
  console.table(summary);
}

/**
 * Create a performance mark for the browser's Performance API
 */
export function mark(name: string) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`studio-${name}`);
  }
}

/**
 * Measure between two marks
 */
export function measureMarks(startMark: string, endMark: string, name: string) {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(
        `studio-${name}`,
        `studio-${startMark}`,
        `studio-${endMark}`
      );
    } catch (e) {
      // Marks might not exist
    }
  }
}

// Export for debugging in console
if (typeof window !== 'undefined') {
  (window as any).__studioPerformance = {
    getSummary: getPerformanceSummary,
    logSummary: logPerformanceSummary,
    getBuffer: () => [...metricsBuffer],
  };
}
```

**Usage in Components:**
```typescript
import { measureRender, useRenderMetrics } from '@/lib/studio/utils/performance';

function ComponentWrapper({ component }: Props) {
  // Track render metrics in dev
  useRenderMetrics(`ComponentWrapper-${component.type}`);
  
  // Measure specific operations
  useEffect(() => {
    const done = measureRender('ComponentWrapper-mount');
    return done;
  }, []);
  
  return <div>...</div>;
}
```

**Acceptance Criteria:**
- [ ] Slow renders logged in development
- [ ] Performance summary available via console
- [ ] Rapid re-renders detected and logged
- [ ] Metrics don't affect production performance

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/components/studio/panels/virtualized-component-list.tsx` | Virtualized component list |
| CREATE | `src/lib/studio/utils/debounce.ts` | Debounce utilities |
| CREATE | `src/components/studio/panels/index.ts` | Code-split panel exports |
| CREATE | `src/lib/studio/store/selectors.ts` | Optimized Zustand selectors |
| CREATE | `src/lib/studio/utils/performance.ts` | Performance monitoring |
| MODIFY | `src/components/studio/panels/left-panel.tsx` | Use virtualized list |
| MODIFY | `src/components/studio/features/layers-panel.tsx` | Virtualize layers |
| MODIFY | `src/components/studio/core/component-wrapper.tsx` | Add memoization |
| MODIFY | `src/lib/studio/store/editor-store.ts` | Add debounced updates |
| MODIFY | `src/components/studio/core/studio-layout.tsx` | Use lazy panels |

## Testing Requirements

### Unit Tests
- [ ] Debounce fires after delay
- [ ] Debounce cancel/flush work
- [ ] Selectors return correct data
- [ ] Performance metrics calculate correctly

### Performance Tests
- [ ] Component library scrolls at 60fps with 200 items
- [ ] Layers panel scrolls at 60fps with 100 layers
- [ ] Selection change takes < 50ms
- [ ] Initial load < 2 seconds

### Manual Testing
- [ ] Open React DevTools Profiler
- [ ] Verify reduced re-renders
- [ ] Check Network tab for code splitting
- [ ] Test with 500+ components
- [ ] Verify auto-save debouncing

## Dependencies to Install

```bash
cd next-platform-dashboard
pnpm add @tanstack/react-virtual
```

## Rollback Plan

If performance issues arise:
1. Disable virtualization by setting threshold to Infinity
2. Remove memoization (React is generally efficient)
3. Increase debounce delays
4. Disable code splitting (import directly)

## Success Criteria

- [ ] Initial load under 2 seconds
- [ ] Smooth 60fps scroll with 200+ components
- [ ] No unnecessary re-renders visible in Profiler
- [ ] Panels lazy load (verify in Network tab)
- [ ] AI features not in initial bundle
- [ ] Auto-save debounces correctly
- [ ] Performance summary available in console
- [ ] Memory stays under 100MB for large pages
