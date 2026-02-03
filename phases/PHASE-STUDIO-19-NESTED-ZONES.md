# PHASE-STUDIO-19: Nested Components & Zones

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-19 |
| Title | Nested Components & Zones |
| Priority | Medium |
| Estimated Time | 12-14 hours |
| Dependencies | STUDIO-05 (DnD), STUDIO-06 (Canvas), STUDIO-16 (Layers) |
| Risk Level | High |

## Problem Statement

Currently, components can only be placed at the root level or as direct children. Complex layouts require:
- Components with multiple drop zones (e.g., Tabs with content per tab)
- Zone-specific restrictions (e.g., Hero footer only accepts buttons)
- Visual indicators showing available drop zones while dragging
- Zones visible in the layers panel hierarchy

This phase adds **Nested Components & Zones**:
- Components can define named drop zones
- Zones have their own allowed component lists
- Visual indicators during drag operations
- Layers panel shows zone hierarchy

## Goals

- [ ] Define zone system in component definitions
- [ ] Extend page data structure for zones
- [ ] Create droppable zone component
- [ ] Update drag-and-drop to handle zone drops
- [ ] Add visual zone indicators during drag
- [ ] Update layers panel to show zones
- [ ] Create example components with zones
- [ ] Support zone management in properties panel

## Technical Approach

### Architecture Overview

```
COMPONENT WITH ZONES (e.g., Section)
┌─────────────────────────────────────────────────────────────────┐
│  📦 Section                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📍 HEADER ZONE                     [Only: Heading, Text]  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Drop heading or text here                          │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📍 CONTENT ZONE                         [Accepts all]     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  📝 Heading "Welcome"                               │  │  │
│  │  │  📄 Text "Lorem ipsum..."                           │  │  │
│  │  │  🔘 Button "Learn More"                             │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📍 FOOTER ZONE                        [Only: Button]      │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  🔘 Button "Get Started"                            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

LAYERS PANEL VIEW:
📦 Section
├── 📍 header (Zone)
│   └── 📝 Heading
├── 📍 content (Zone)
│   ├── 📄 Text
│   └── 🔘 Button
└── 📍 footer (Zone)
    └── 🔘 Button
```

### Zone Data Model

Zones are identified by `${componentId}:${zoneName}` pattern. The page data tracks which components are in which zones.

### Zone Restrictions

Each zone can define:
- `allowedComponents`: Array of component types allowed
- `minChildren` / `maxChildren`: Constraints on child count
- `defaultComponent`: Auto-add when zone created

## Implementation Tasks

### Task 1: Extend Types for Zones

**Description:** Add zone types to component definitions and page data.

**Files:**
- MODIFY: `src/types/studio.ts`

**Code:**

```typescript
// Add to src/types/studio.ts

/**
 * Definition of a drop zone within a component
 */
export interface ZoneDefinition {
  /** Display name for the zone (e.g., "Header", "Content", "Footer") */
  label: string;
  
  /** List of allowed component types. If undefined, all components allowed */
  allowedComponents?: string[];
  
  /** Whether the zone accepts child components */
  acceptsChildren: boolean;
  
  /** Minimum number of children required */
  minChildren?: number;
  
  /** Maximum number of children allowed */
  maxChildren?: number;
  
  /** Component type to auto-add when zone is created */
  defaultComponent?: string;
  
  /** Custom styling for the zone container */
  className?: string;
  
  /** Placeholder text when zone is empty */
  placeholder?: string;
}

/**
 * Extended component definition with zones
 */
export interface ComponentDefinition {
  // ... existing properties
  
  /** Named drop zones within this component */
  zones?: Record<string, ZoneDefinition>;
}

/**
 * Extended page data with zones mapping
 */
export interface StudioPageData {
  version: "1.0";
  root: {
    id: "root";
    type: "Root";
    props: Record<string, unknown>;
    children: string[]; // Root-level component IDs
  };
  components: Record<string, StudioComponent>;
  /** Maps zoneId to array of component IDs */
  zones: Record<string, string[]>;
}

/**
 * Extended component with zone reference
 */
export interface StudioComponent {
  // ... existing properties
  
  /** Zone ID this component belongs to (format: parentId:zoneName) */
  zoneId?: string;
}

/**
 * Zone ID format helper
 */
export type ZoneId = `${string}:${string}`;

/**
 * Parse zone ID into parent and zone name
 */
export function parseZoneId(zoneId: string): { parentId: string; zoneName: string } | null {
  const parts = zoneId.split(':');
  if (parts.length !== 2) return null;
  return { parentId: parts[0], zoneName: parts[1] };
}

/**
 * Create zone ID from parent ID and zone name
 */
export function createZoneId(parentId: string, zoneName: string): ZoneId {
  return `${parentId}:${zoneName}` as ZoneId;
}
```

**Acceptance Criteria:**
- [ ] ZoneDefinition type defined
- [ ] ComponentDefinition extended with zones
- [ ] StudioPageData has zones mapping
- [ ] StudioComponent has zoneId reference
- [ ] Zone ID helpers created

---

### Task 2: Extend Editor Store with Zone Actions

**Description:** Add zone-related actions to the editor store.

**Files:**
- MODIFY: `src/lib/studio/store/editor-store.ts`

**Code:**

```typescript
// Add to EditorState interface
interface EditorState {
  // ... existing properties
  
  // Zone actions
  addComponentToZone: (
    componentType: string,
    zoneId: string,
    index?: number
  ) => string | null;
  
  moveComponentToZone: (
    componentId: string,
    zoneId: string,
    index?: number
  ) => boolean;
  
  removeComponentFromZone: (componentId: string) => boolean;
  
  getZoneComponents: (zoneId: string) => StudioComponent[];
  
  canDropInZone: (componentType: string, zoneId: string) => boolean;
  
  initializeZonesForComponent: (componentId: string) => void;
}

// Add implementations
addComponentToZone: (componentType, zoneId, index) => {
  const { pageData } = get();
  const parsedZone = parseZoneId(zoneId);
  if (!parsedZone) return null;
  
  const { parentId, zoneName } = parsedZone;
  const parentComponent = pageData.components[parentId];
  if (!parentComponent) return null;
  
  // Get zone definition
  const componentDef = getComponentDefinition(parentComponent.type);
  const zoneDef = componentDef?.zones?.[zoneName];
  if (!zoneDef || !zoneDef.acceptsChildren) return null;
  
  // Check if component type is allowed
  if (zoneDef.allowedComponents && !zoneDef.allowedComponents.includes(componentType)) {
    return null;
  }
  
  // Check max children
  const currentZoneComponents = pageData.zones[zoneId] || [];
  if (zoneDef.maxChildren && currentZoneComponents.length >= zoneDef.maxChildren) {
    return null;
  }
  
  // Create the component
  const newId = nanoid();
  const newComponentDef = getComponentDefinition(componentType);
  if (!newComponentDef) return null;
  
  set((state) => {
    const component: StudioComponent = {
      id: newId,
      type: componentType,
      props: { ...newComponentDef.defaultProps },
      zoneId,
      parentId,
    };
    
    state.pageData.components[newId] = component;
    
    // Add to zone
    if (!state.pageData.zones[zoneId]) {
      state.pageData.zones[zoneId] = [];
    }
    
    if (index !== undefined) {
      state.pageData.zones[zoneId].splice(index, 0, newId);
    } else {
      state.pageData.zones[zoneId].push(newId);
    }
    
    // Initialize zones if the new component has zones
    const newCompDef = getComponentDefinition(componentType);
    if (newCompDef?.zones) {
      Object.keys(newCompDef.zones).forEach((zName) => {
        const zId = createZoneId(newId, zName);
        state.pageData.zones[zId] = [];
      });
    }
  });
  
  return newId;
},

moveComponentToZone: (componentId, zoneId, index) => {
  const { pageData } = get();
  const component = pageData.components[componentId];
  if (!component || component.locked) return false;
  
  const parsedZone = parseZoneId(zoneId);
  if (!parsedZone) return false;
  
  const { parentId, zoneName } = parsedZone;
  const parentComponent = pageData.components[parentId];
  if (!parentComponent) return false;
  
  // Get zone definition
  const componentDef = getComponentDefinition(parentComponent.type);
  const zoneDef = componentDef?.zones?.[zoneName];
  if (!zoneDef) return false;
  
  // Check if component type is allowed
  if (zoneDef.allowedComponents && !zoneDef.allowedComponents.includes(component.type)) {
    return false;
  }
  
  set((state) => {
    // Remove from current location
    const oldZoneId = component.zoneId;
    if (oldZoneId && state.pageData.zones[oldZoneId]) {
      state.pageData.zones[oldZoneId] = state.pageData.zones[oldZoneId].filter(
        id => id !== componentId
      );
    } else if (component.parentId) {
      const oldParent = state.pageData.components[component.parentId];
      if (oldParent?.children) {
        oldParent.children = oldParent.children.filter(id => id !== componentId);
      }
    } else {
      state.pageData.root.children = state.pageData.root.children.filter(
        id => id !== componentId
      );
    }
    
    // Update component's zone reference
    const comp = state.pageData.components[componentId];
    comp.zoneId = zoneId;
    comp.parentId = parentId;
    
    // Add to new zone
    if (!state.pageData.zones[zoneId]) {
      state.pageData.zones[zoneId] = [];
    }
    
    if (index !== undefined) {
      state.pageData.zones[zoneId].splice(index, 0, componentId);
    } else {
      state.pageData.zones[zoneId].push(componentId);
    }
  });
  
  return true;
},

removeComponentFromZone: (componentId) => {
  const { pageData } = get();
  const component = pageData.components[componentId];
  if (!component?.zoneId) return false;
  
  set((state) => {
    const zoneId = component.zoneId!;
    if (state.pageData.zones[zoneId]) {
      state.pageData.zones[zoneId] = state.pageData.zones[zoneId].filter(
        id => id !== componentId
      );
    }
    
    const comp = state.pageData.components[componentId];
    comp.zoneId = undefined;
    comp.parentId = undefined;
  });
  
  return true;
},

getZoneComponents: (zoneId) => {
  const { pageData } = get();
  const componentIds = pageData.zones[zoneId] || [];
  return componentIds
    .map(id => pageData.components[id])
    .filter((c): c is StudioComponent => c !== undefined);
},

canDropInZone: (componentType, zoneId) => {
  const { pageData } = get();
  const parsedZone = parseZoneId(zoneId);
  if (!parsedZone) return false;
  
  const { parentId, zoneName } = parsedZone;
  const parentComponent = pageData.components[parentId];
  if (!parentComponent) return false;
  
  const componentDef = getComponentDefinition(parentComponent.type);
  const zoneDef = componentDef?.zones?.[zoneName];
  if (!zoneDef || !zoneDef.acceptsChildren) return false;
  
  // Check allowed components
  if (zoneDef.allowedComponents && !zoneDef.allowedComponents.includes(componentType)) {
    return false;
  }
  
  // Check max children
  const currentZoneComponents = pageData.zones[zoneId] || [];
  if (zoneDef.maxChildren && currentZoneComponents.length >= zoneDef.maxChildren) {
    return false;
  }
  
  return true;
},

initializeZonesForComponent: (componentId) => {
  const { pageData } = get();
  const component = pageData.components[componentId];
  if (!component) return;
  
  const componentDef = getComponentDefinition(component.type);
  if (!componentDef?.zones) return;
  
  set((state) => {
    Object.keys(componentDef.zones!).forEach((zoneName) => {
      const zoneId = createZoneId(componentId, zoneName);
      if (!state.pageData.zones[zoneId]) {
        state.pageData.zones[zoneId] = [];
      }
    });
  });
},
```

**Acceptance Criteria:**
- [ ] addComponentToZone creates component in zone
- [ ] moveComponentToZone moves component between zones
- [ ] canDropInZone validates drop
- [ ] Zone restrictions enforced
- [ ] initializeZonesForComponent creates empty zones

---

### Task 3: Create Droppable Zone Component

**Description:** Create a component that renders a drop zone within another component.

**Files:**
- CREATE: `src/components/studio/dnd/droppable-zone.tsx`

**Code:**

```typescript
// src/components/studio/dnd/droppable-zone.tsx
'use client';

import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Target, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { SortableComponent } from './sortable-component';
import { createZoneId } from '@/types/studio';
import type { ZoneDefinition, StudioComponent } from '@/types/studio';

interface DroppableZoneProps {
  parentId: string;
  zoneName: string;
  zoneDef: ZoneDefinition;
  className?: string;
}

export function DroppableZone({
  parentId,
  zoneName,
  zoneDef,
  className,
}: DroppableZoneProps) {
  const zoneId = createZoneId(parentId, zoneName);
  const { getZoneComponents, canDropInZone } = useEditorStore();
  
  const components = useMemo(
    () => getZoneComponents(zoneId),
    [getZoneComponents, zoneId]
  );
  
  const { setNodeRef, isOver, active } = useDroppable({
    id: zoneId,
    data: {
      type: 'zone',
      zone: zoneId,
      parentId,
      zoneName,
      allowedComponents: zoneDef.allowedComponents,
    },
  });
  
  // Check if the dragged component can be dropped here
  const draggedType = active?.data?.current?.componentType;
  const canDrop = draggedType ? canDropInZone(draggedType, zoneId) : true;
  const isActive = isOver && active;
  
  const isEmpty = components.length === 0;
  const isAtMax = zoneDef.maxChildren 
    ? components.length >= zoneDef.maxChildren 
    : false;
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-all duration-200',
        'min-h-[60px] rounded-md',
        // Base styles
        'border-2 border-dashed',
        isEmpty && !isActive && 'border-muted-foreground/20 bg-muted/5',
        // Hover styles when dragging
        isActive && canDrop && 'border-primary bg-primary/5',
        isActive && !canDrop && 'border-destructive/50 bg-destructive/5',
        // At max capacity
        isAtMax && 'opacity-50',
        zoneDef.className,
        className
      )}
      data-zone={zoneId}
      data-zone-name={zoneName}
    >
      {/* Zone header (visible when editing) */}
      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs',
            isActive && !canDrop && 'text-destructive'
          )}>
            {isActive && !canDrop ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Target className="h-3 w-3" />
            )}
            <span className="font-medium">{zoneDef.label}</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {isActive && !canDrop 
              ? `${draggedType} not allowed here`
              : zoneDef.placeholder || `Drop ${zoneDef.allowedComponents?.join(', ') || 'components'} here`
            }
          </p>
          
          {zoneDef.allowedComponents && (
            <p className="text-[10px] text-muted-foreground/70">
              Accepts: {zoneDef.allowedComponents.join(', ')}
            </p>
          )}
        </div>
      )}
      
      {/* Zone content */}
      {!isEmpty && (
        <SortableContext
          items={components.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-2 space-y-2">
            {components.map((component) => (
              <SortableComponent
                key={component.id}
                component={component}
                inZone={zoneId}
              />
            ))}
          </div>
        </SortableContext>
      )}
      
      {/* Zone label badge (always visible) */}
      {!isEmpty && (
        <div className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-background border rounded text-[10px] text-muted-foreground font-medium">
          {zoneDef.label}
          {zoneDef.maxChildren && (
            <span className="ml-1 text-muted-foreground/70">
              ({components.length}/{zoneDef.maxChildren})
            </span>
          )}
        </div>
      )}
      
      {/* Drop indicator */}
      {isActive && canDrop && (
        <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Zone shows placeholder when empty
- [ ] Zone highlights when dragging over
- [ ] Invalid drops show error state
- [ ] Zone label always visible
- [ ] Components render inside zone
- [ ] Max capacity shown and enforced

---

### Task 4: Update Drag and Drop Handler for Zones

**Description:** Modify the DnD handler to support dropping into zones.

**Files:**
- MODIFY: `src/components/studio/dnd/dnd-context.tsx`

**Code:**

```typescript
// Update the handleDragEnd function in dnd-context.tsx

import { parseZoneId } from '@/types/studio';
import { toast } from 'sonner';

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  
  if (!over) {
    setDragState(null);
    return;
  }
  
  const activeData = active.data.current;
  const overData = over.data.current;
  
  // Check if dropping into a zone
  if (overData?.type === 'zone') {
    const zoneId = overData.zone;
    const componentType = activeData?.componentType;
    
    if (!componentType) {
      setDragState(null);
      return;
    }
    
    // Check if allowed
    if (!canDropInZone(componentType, zoneId)) {
      const parsedZone = parseZoneId(zoneId);
      const zoneDef = getZoneDefinition(parsedZone?.parentId, parsedZone?.zoneName);
      
      toast.error(`${componentType} cannot be dropped in ${zoneDef?.label || 'this zone'}`, {
        description: zoneDef?.allowedComponents 
          ? `Allowed: ${zoneDef.allowedComponents.join(', ')}`
          : undefined,
      });
      setDragState(null);
      return;
    }
    
    // Check if moving existing component or adding new
    const existingId = activeData?.componentId;
    
    if (existingId) {
      // Moving existing component to zone
      const success = moveComponentToZone(existingId, zoneId);
      if (success) {
        recordAction('component.move', pageData, existingId, componentType);
      }
    } else {
      // Adding new component to zone
      const newId = addComponentToZone(componentType, zoneId);
      if (newId) {
        selectComponent(newId);
        recordAction('component.add', pageData, newId, componentType);
      }
    }
    
    setDragState(null);
    return;
  }
  
  // Dropping into another component that might have a default zone
  if (overData?.type === 'component') {
    const targetId = overData.componentId;
    const targetDef = getComponentDefinition(overData.componentType);
    
    // Check if target has a default content zone
    if (targetDef?.zones) {
      const defaultZone = Object.entries(targetDef.zones).find(
        ([_, def]) => def.label.toLowerCase() === 'content' || 
                      Object.keys(targetDef.zones!).length === 1
      );
      
      if (defaultZone) {
        const [zoneName, zoneDef] = defaultZone;
        const zoneId = createZoneId(targetId, zoneName);
        const componentType = activeData?.componentType;
        
        if (componentType && canDropInZone(componentType, zoneId)) {
          const existingId = activeData?.componentId;
          
          if (existingId) {
            moveComponentToZone(existingId, zoneId);
          } else {
            const newId = addComponentToZone(componentType, zoneId);
            if (newId) selectComponent(newId);
          }
          
          setDragState(null);
          return;
        }
      }
    }
  }
  
  // Fall back to existing root-level or children drop logic
  // ... existing code for regular drops
  
  setDragState(null);
}

// Helper to get zone definition
function getZoneDefinition(parentId?: string, zoneName?: string) {
  if (!parentId || !zoneName) return null;
  const parent = pageData.components[parentId];
  if (!parent) return null;
  const parentDef = getComponentDefinition(parent.type);
  return parentDef?.zones?.[zoneName];
}
```

**Acceptance Criteria:**
- [ ] Drop into zone creates component in zone
- [ ] Move to zone updates component location
- [ ] Invalid drops show toast error
- [ ] Default zone used when dropping on component
- [ ] Existing root-level drops still work

---

### Task 5: Create Zone Renderer for Components

**Description:** Create a helper that renders zones for components that have them.

**Files:**
- CREATE: `src/components/studio/core/zone-renderer.tsx`

**Code:**

```typescript
// src/components/studio/core/zone-renderer.tsx
'use client';

import React from 'react';
import { DroppableZone } from '@/components/studio/dnd/droppable-zone';
import { getComponentDefinition } from '@/lib/studio/registry/component-registry';
import type { StudioComponent } from '@/types/studio';

interface ZoneRendererProps {
  component: StudioComponent;
  children?: React.ReactNode;
}

/**
 * Renders zones for a component based on its definition
 */
export function ZoneRenderer({ component, children }: ZoneRendererProps) {
  const definition = getComponentDefinition(component.type);
  
  if (!definition?.zones) {
    // No zones defined, just render children (if any)
    return <>{children}</>;
  }
  
  return (
    <>
      {Object.entries(definition.zones).map(([zoneName, zoneDef]) => (
        <DroppableZone
          key={zoneName}
          parentId={component.id}
          zoneName={zoneName}
          zoneDef={zoneDef}
        />
      ))}
    </>
  );
}

interface WithZonesProps {
  component: StudioComponent;
  renderZone: (zoneName: string) => React.ReactNode;
  children?: React.ReactNode;
}

/**
 * HOC pattern for components that need custom zone placement
 */
export function WithZones({ component, renderZone, children }: WithZonesProps) {
  const definition = getComponentDefinition(component.type);
  
  if (!definition?.zones) {
    return <>{children}</>;
  }
  
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props['data-zone']) {
          const zoneName = child.props['data-zone'];
          return renderZone(zoneName);
        }
        return child;
      })}
    </>
  );
}
```

**Acceptance Criteria:**
- [ ] ZoneRenderer creates zones from definition
- [ ] Components with zones render DroppableZone for each
- [ ] WithZones allows custom zone placement

---

### Task 6: Update Layers Panel for Zones

**Description:** Modify layers panel to show zones in the hierarchy.

**Files:**
- MODIFY: `src/lib/studio/utils/layer-utils.ts`

**Code:**

```typescript
// Update buildLayerTree to include zones

import { getComponentDefinition } from '@/lib/studio/registry/component-registry';
import { createZoneId } from '@/types/studio';

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
  isZone?: boolean; // NEW: Flag for zone items
  zoneName?: string; // NEW: Zone name
  zoneParentId?: string; // NEW: Parent component ID
}

export function buildLayerTree(
  pageData: StudioPageData,
  selectedComponentId: string | null,
  expandedLayers: Set<string>
): LayerItem[] {
  const { root, components, zones } = pageData;
  
  function buildNode(componentId: string, depth: number): LayerItem | null {
    const component = components[componentId];
    if (!component) return null;
    
    const definition = getComponentDefinition(component.type);
    const children: LayerItem[] = [];
    
    // Add zones as children
    if (definition?.zones) {
      Object.entries(definition.zones).forEach(([zoneName, zoneDef]) => {
        const zoneId = createZoneId(componentId, zoneName);
        const zoneComponents = zones[zoneId] || [];
        
        const zoneChildren = zoneComponents
          .map(childId => buildNode(childId, depth + 2))
          .filter((child): child is LayerItem => child !== null);
        
        children.push({
          id: zoneId,
          type: 'Zone',
          label: zoneDef.label,
          icon: 'target',
          children: zoneChildren,
          isLocked: false,
          isHidden: false,
          isSelected: false,
          isExpanded: expandedLayers.has(zoneId),
          depth: depth + 1,
          parentId: componentId,
          isZone: true,
          zoneName,
          zoneParentId: componentId,
        });
      });
    }
    
    // Add regular children (non-zone)
    if (component.children) {
      component.children.forEach(childId => {
        const childNode = buildNode(childId, depth + 1);
        if (childNode) children.push(childNode);
      });
    }
    
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
```

**Acceptance Criteria:**
- [ ] Zones appear in layer tree
- [ ] Zone children show correctly
- [ ] Zone icon different from components
- [ ] Zone items not selectable as components

---

### Task 7: Update Layer Row for Zones

**Description:** Modify layer row to handle zone items differently.

**Files:**
- MODIFY: `src/components/studio/features/layer-row.tsx`

**Code:**

```typescript
// Update LayerRow to handle zones

export const LayerRow = memo(function LayerRow({
  item,
  onSelect,
  onToggleExpand,
  onToggleLock,
  onToggleVisibility,
  onContextMenu,
}: LayerRowProps) {
  const isZone = item.isZone || false;
  
  // Zones are not draggable or selectable as regular components
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: item.isLocked || isZone, // Zones can't be dragged
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = isZone 
    ? require('lucide-react').Target 
    : (iconComponents[item.icon] || Component);
  
  const hasChildren = item.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isZone) {
      onSelect(item.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center h-8 px-2 gap-1 rounded-md',
        !isZone && 'cursor-pointer hover:bg-accent/50',
        isZone && 'cursor-default bg-muted/30',
        item.isSelected && !isZone && 'bg-primary/10 hover:bg-primary/15',
        item.isHidden && 'opacity-50',
        isDragging && 'opacity-50 bg-accent'
      )}
      onClick={handleClick}
      onContextMenu={(e) => !isZone && onContextMenu(e, item.id)}
    >
      {/* Indent based on depth */}
      <div style={{ width: item.depth * 16 }} className="shrink-0" />
      
      {/* Drag handle - only for non-zones */}
      {!isZone && (
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
      )}
      {isZone && <div className="w-3.5 shrink-0" />}
      
      {/* Expand/Collapse button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-5 w-5 shrink-0 p-0',
          !hasChildren && 'invisible'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand(item.id);
        }}
      >
        {item.isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </Button>
      
      {/* Component/Zone icon */}
      <IconComponent 
        className={cn(
          'h-4 w-4 shrink-0',
          isZone ? 'text-primary/60' : 'text-muted-foreground'
        )} 
      />
      
      {/* Label */}
      <span className={cn(
        'flex-1 text-sm truncate',
        item.isSelected && !isZone && 'font-medium',
        isZone && 'text-muted-foreground italic'
      )}>
        {item.label}
        {isZone && ` (${item.children.length})`}
      </span>
      
      {/* Type badge - only for components */}
      {!isZone && (
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
          {item.type}
        </span>
      )}
      
      {/* Lock/visibility toggles - only for components */}
      {!isZone && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-5 w-5 shrink-0 p-0',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              item.isLocked && 'opacity-100'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(item.id, !item.isLocked);
            }}
            title={item.isLocked ? 'Unlock' : 'Lock'}
          >
            {item.isLocked ? (
              <Lock className="h-3 w-3 text-amber-500" />
            ) : (
              <Unlock className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-5 w-5 shrink-0 p-0',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              item.isHidden && 'opacity-100'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(item.id, !item.isHidden);
            }}
            title={item.isHidden ? 'Show' : 'Hide'}
          >
            {item.isHidden ? (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Eye className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        </>
      )}
    </div>
  );
});
```

**Acceptance Criteria:**
- [ ] Zone rows styled differently
- [ ] Zones not draggable
- [ ] Zones show child count
- [ ] Zones don't have lock/hide buttons
- [ ] Clicking zone expands/collapses only

---

### Task 8: Create Example Components with Zones

**Description:** Create Section, Tabs, and Hero components with zone definitions.

**Files:**
- MODIFY: `src/lib/studio/registry/core-components.ts`

**Code:**

```typescript
// Add zone definitions to core components

// Section component with zones
const SectionDefinition: ComponentDefinition = {
  type: 'Section',
  label: 'Section',
  description: 'A container with header, content, and footer zones',
  category: 'Layout',
  icon: 'layout',
  fields: {
    backgroundColor: {
      type: 'color',
      label: 'Background Color',
      defaultValue: 'transparent',
    },
    padding: {
      type: 'spacing',
      label: 'Padding',
      responsive: true,
    },
  },
  defaultProps: {
    backgroundColor: 'transparent',
    padding: { mobile: '16px', tablet: '32px', desktop: '64px' },
  },
  zones: {
    header: {
      label: 'Header',
      allowedComponents: ['Heading', 'Text'],
      acceptsChildren: true,
      maxChildren: 2,
      placeholder: 'Add a heading or text',
    },
    content: {
      label: 'Content',
      acceptsChildren: true,
      placeholder: 'Add content components',
    },
    footer: {
      label: 'Footer',
      allowedComponents: ['Button', 'Link'],
      acceptsChildren: true,
      maxChildren: 3,
      placeholder: 'Add buttons or links',
    },
  },
  render: SectionRender,
  ai: {
    description: 'A section with header, content, and footer areas',
    canModify: ['backgroundColor', 'padding'],
  },
};

// Tabs component with zones per tab
const TabsDefinition: ComponentDefinition = {
  type: 'Tabs',
  label: 'Tabs',
  description: 'Tabbed content with multiple panels',
  category: 'Interactive',
  icon: 'panel-top',
  fields: {
    tabs: {
      type: 'array',
      label: 'Tabs',
      itemFields: {
        label: { type: 'text', label: 'Tab Label' },
        icon: { type: 'select', label: 'Icon', options: [...] },
      },
    },
    activeTab: {
      type: 'number',
      label: 'Default Active Tab',
      defaultValue: 0,
    },
  },
  defaultProps: {
    tabs: [
      { label: 'Tab 1' },
      { label: 'Tab 2' },
      { label: 'Tab 3' },
    ],
    activeTab: 0,
  },
  zones: {
    tab0: {
      label: 'Tab 1 Content',
      acceptsChildren: true,
      placeholder: 'Content for Tab 1',
    },
    tab1: {
      label: 'Tab 2 Content',
      acceptsChildren: true,
      placeholder: 'Content for Tab 2',
    },
    tab2: {
      label: 'Tab 3 Content',
      acceptsChildren: true,
      placeholder: 'Content for Tab 3',
    },
  },
  render: TabsRender,
  ai: {
    description: 'Tabbed interface with multiple content panels',
    canModify: ['tabs', 'activeTab'],
  },
};

// Hero component with zones
const HeroDefinition: ComponentDefinition = {
  type: 'Hero',
  label: 'Hero Section',
  description: 'Full-width hero with structured zones',
  category: 'Marketing',
  icon: 'sparkles',
  fields: {
    backgroundImage: { type: 'image', label: 'Background Image' },
    overlay: { type: 'color', label: 'Overlay Color' },
    minHeight: { type: 'text', label: 'Minimum Height', defaultValue: '60vh' },
  },
  defaultProps: {
    minHeight: '60vh',
    overlay: 'rgba(0,0,0,0.5)',
  },
  zones: {
    eyebrow: {
      label: 'Eyebrow',
      allowedComponents: ['Text'],
      acceptsChildren: true,
      maxChildren: 1,
      placeholder: 'Add eyebrow text',
    },
    headline: {
      label: 'Headline',
      allowedComponents: ['Heading'],
      acceptsChildren: true,
      maxChildren: 1,
      placeholder: 'Add main headline',
    },
    subheadline: {
      label: 'Subheadline',
      allowedComponents: ['Text', 'RichText'],
      acceptsChildren: true,
      maxChildren: 1,
      placeholder: 'Add supporting text',
    },
    cta: {
      label: 'Call to Action',
      allowedComponents: ['Button', 'Link'],
      acceptsChildren: true,
      maxChildren: 2,
      placeholder: 'Add CTA buttons',
    },
  },
  render: HeroRender,
  ai: {
    description: 'Hero section with eyebrow, headline, subheadline, and CTA zones',
    canModify: ['backgroundImage', 'overlay', 'minHeight'],
  },
};

// Accordion component with dynamic zones
const AccordionDefinition: ComponentDefinition = {
  type: 'Accordion',
  label: 'Accordion',
  description: 'Collapsible sections',
  category: 'Interactive',
  icon: 'chevrons-down-up',
  fields: {
    items: {
      type: 'array',
      label: 'Items',
      itemFields: {
        title: { type: 'text', label: 'Title' },
        isOpen: { type: 'toggle', label: 'Initially Open' },
      },
    },
    allowMultiple: {
      type: 'toggle',
      label: 'Allow Multiple Open',
      defaultValue: false,
    },
  },
  defaultProps: {
    items: [
      { title: 'Section 1', isOpen: true },
      { title: 'Section 2', isOpen: false },
      { title: 'Section 3', isOpen: false },
    ],
    allowMultiple: false,
  },
  zones: {
    item0: {
      label: 'Section 1 Content',
      acceptsChildren: true,
    },
    item1: {
      label: 'Section 2 Content',
      acceptsChildren: true,
    },
    item2: {
      label: 'Section 3 Content',
      acceptsChildren: true,
    },
  },
  render: AccordionRender,
  ai: {
    description: 'Accordion with collapsible sections',
    canModify: ['items', 'allowMultiple'],
  },
};
```

**Acceptance Criteria:**
- [ ] Section has header/content/footer zones
- [ ] Tabs has zone per tab
- [ ] Hero has structured zones
- [ ] Accordion has zone per item
- [ ] All zones have proper restrictions

---

### Task 9: Create Zone Section in Properties Panel

**Description:** Add a section in properties panel to manage zones.

**Files:**
- CREATE: `src/components/studio/properties/zones-section.tsx`

**Code:**

```typescript
// src/components/studio/properties/zones-section.tsx
'use client';

import React from 'react';
import { Plus, Target, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { getComponentDefinition, getComponentsByCategory } from '@/lib/studio/registry/component-registry';
import { createZoneId } from '@/types/studio';
import type { StudioComponent, ZoneDefinition } from '@/types/studio';

interface ZonesSectionProps {
  component: StudioComponent;
}

export function ZonesSection({ component }: ZonesSectionProps) {
  const definition = getComponentDefinition(component.type);
  const { getZoneComponents, addComponentToZone, selectComponent, pageData } = useEditorStore();
  
  if (!definition?.zones) {
    return null;
  }
  
  const zones = Object.entries(definition.zones);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Target className="h-4 w-4" />
        Zones
      </div>
      
      <Accordion type="multiple" defaultValue={zones.map(([name]) => name)}>
        {zones.map(([zoneName, zoneDef]) => {
          const zoneId = createZoneId(component.id, zoneName);
          const zoneComponents = getZoneComponents(zoneId);
          
          return (
            <AccordionItem key={zoneName} value={zoneName}>
              <AccordionTrigger className="py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>{zoneDef.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {zoneComponents.length}
                    {zoneDef.maxChildren && `/${zoneDef.maxChildren}`}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ZoneContent
                  zoneId={zoneId}
                  zoneDef={zoneDef}
                  components={zoneComponents}
                  onAddComponent={(type) => {
                    const newId = addComponentToZone(type, zoneId);
                    if (newId) selectComponent(newId);
                  }}
                  onSelectComponent={selectComponent}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

interface ZoneContentProps {
  zoneId: string;
  zoneDef: ZoneDefinition;
  components: StudioComponent[];
  onAddComponent: (type: string) => void;
  onSelectComponent: (id: string) => void;
}

function ZoneContent({
  zoneId,
  zoneDef,
  components,
  onAddComponent,
  onSelectComponent,
}: ZoneContentProps) {
  const atMax = zoneDef.maxChildren 
    ? components.length >= zoneDef.maxChildren 
    : false;
  
  // Get available components for this zone
  const availableComponents = zoneDef.allowedComponents
    ? zoneDef.allowedComponents.map(type => getComponentDefinition(type)).filter(Boolean)
    : Object.values(getComponentsByCategory()).flat();
  
  return (
    <div className="space-y-2 pl-2">
      {/* List of components in zone */}
      {components.length > 0 && (
        <div className="space-y-1">
          {components.map((comp) => (
            <button
              key={comp.id}
              onClick={() => onSelectComponent(comp.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-left',
                'hover:bg-accent transition-colors'
              )}
            >
              <span className="flex-1 truncate">{comp.type}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {getComponentLabel(comp)}
              </span>
            </button>
          ))}
        </div>
      )}
      
      {/* Add component button */}
      {!atMax && (
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
            >
              <Plus className="h-3 w-3 mr-2" />
              Add to {zoneDef.label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1">
                {availableComponents.map((def) => def && (
                  <button
                    key={def.type}
                    onClick={() => onAddComponent(def.type)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left',
                      'hover:bg-accent transition-colors'
                    )}
                  >
                    {def.label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
      
      {/* Zone info */}
      {zoneDef.allowedComponents && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Accepts: {zoneDef.allowedComponents.join(', ')}
        </p>
      )}
      
      {atMax && (
        <p className="text-xs text-muted-foreground">
          Zone is at maximum capacity
        </p>
      )}
    </div>
  );
}

function getComponentLabel(component: StudioComponent): string {
  const labelProps = ['title', 'text', 'label', 'heading'];
  for (const prop of labelProps) {
    const value = component.props[prop];
    if (typeof value === 'string' && value.trim()) {
      return value.slice(0, 20) + (value.length > 20 ? '...' : '');
    }
  }
  return '';
}
```

**Acceptance Criteria:**
- [ ] Zones section shows for components with zones
- [ ] Each zone expandable/collapsible
- [ ] Zone shows component count and max
- [ ] Add button shows allowed components
- [ ] Click component to select

---

### Task 10: Integrate Zones Section into Properties Panel

**Description:** Add ZonesSection to the properties panel.

**Files:**
- MODIFY: `src/components/studio/properties/properties-panel.tsx`

**Code:**

```typescript
// Add to properties-panel.tsx

import { ZonesSection } from './zones-section';

// In the panel, add after fields section:
{selectedComponent && (
  <>
    {/* Existing field sections */}
    
    <Separator className="my-4" />
    
    {/* Zones section - only if component has zones */}
    <ZonesSection component={selectedComponent} />
  </>
)}
```

**Acceptance Criteria:**
- [ ] Zones section appears for zone-enabled components
- [ ] Section hidden for components without zones

---

### Task 11: Export Zone Components

**Description:** Export all zone-related components.

**Files:**
- MODIFY: `src/components/studio/dnd/index.ts`
- MODIFY: `src/components/studio/core/index.ts`
- MODIFY: `src/components/studio/properties/index.ts`

**Code:**

```typescript
// src/components/studio/dnd/index.ts
export { DroppableZone } from './droppable-zone';

// src/components/studio/core/index.ts
export { ZoneRenderer, WithZones } from './zone-renderer';

// src/components/studio/properties/index.ts
export { ZonesSection } from './zones-section';
```

**Acceptance Criteria:**
- [ ] All zone components exported

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | `src/types/studio.ts` | Add zone types and helpers |
| MODIFY | `src/lib/studio/store/editor-store.ts` | Add zone actions |
| CREATE | `src/components/studio/dnd/droppable-zone.tsx` | Droppable zone component |
| MODIFY | `src/components/studio/dnd/dnd-context.tsx` | Handle zone drops |
| CREATE | `src/components/studio/core/zone-renderer.tsx` | Zone renderer helper |
| MODIFY | `src/lib/studio/utils/layer-utils.ts` | Include zones in tree |
| MODIFY | `src/components/studio/features/layer-row.tsx` | Handle zone items |
| MODIFY | `src/lib/studio/registry/core-components.ts` | Add example components |
| CREATE | `src/components/studio/properties/zones-section.tsx` | Zones in properties |
| MODIFY | `src/components/studio/properties/properties-panel.tsx` | Integrate zones |
| MODIFY | `src/components/studio/dnd/index.ts` | Export |
| MODIFY | `src/components/studio/core/index.ts` | Export |
| MODIFY | `src/components/studio/properties/index.ts` | Export |

## Testing Requirements

### Unit Tests
- [ ] parseZoneId parses correctly
- [ ] createZoneId formats correctly
- [ ] canDropInZone validates restrictions
- [ ] addComponentToZone creates component
- [ ] moveComponentToZone moves correctly

### Integration Tests
- [ ] Drag component into zone
- [ ] Zone restrictions enforced
- [ ] Layers panel shows zones
- [ ] Properties panel manages zones

### Manual Testing
- [ ] Create Section with zones
- [ ] Drag Heading into header zone
- [ ] Drag Button into footer zone
- [ ] Try dropping invalid component (should fail)
- [ ] Verify max children enforced
- [ ] Check layers panel hierarchy
- [ ] Add component via properties panel
- [ ] Switch between tabs in Tabs component
- [ ] Expand/collapse zones in layers
- [ ] AI generation includes zone components

## Dependencies to Install

```bash
# No new dependencies needed
```

## Rollback Plan

1. Remove zone-related types from studio.ts
2. Remove zone actions from editor-store.ts
3. Remove DroppableZone component
4. Revert layer-utils.ts
5. Revert layer-row.tsx
6. Remove ZonesSection component
7. Revert properties-panel.tsx
8. Revert core-components.ts

## Success Criteria

- [ ] Components can define multiple named zones
- [ ] Zones render as drop targets in canvas
- [ ] Dropping component into zone works
- [ ] Zone restrictions enforced (allowed types, max)
- [ ] Invalid drops show error toast
- [ ] Zones appear in layers panel hierarchy
- [ ] Zone items styled differently from components
- [ ] Properties panel shows zone management
- [ ] Add component to zone via properties
- [ ] Section, Tabs, Hero, Accordion have zones
- [ ] AI respects zone structure
- [ ] Module components can define zones
- [ ] Maximum 10 zones per component (enforced)
- [ ] Zones persist in page data
