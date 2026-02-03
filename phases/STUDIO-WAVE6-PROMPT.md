# TASK: Generate Implementation Phases - WAVE 6 (Advanced Features)

You are a senior software architect. Wave 5 (Module Integration) has been successfully implemented. Now generate the **next 4 advanced feature phases** for DRAMAC Studio.

## ✅ Wave 5 Completion Status

The following has been implemented:

### Files Created (Wave 5):
```
src/lib/studio/registry/
  └── module-loader.ts                ✅ Module discovery and loading

src/lib/studio/hooks/
  └── use-module-sync.ts              ✅ Real-time module sync

src/lib/studio/registry/
  └── field-registry.ts               ✅ Custom field registration (extended)

src/app/api/modules/
  └── [moduleId]/[...endpoint]/       ✅ Module API routing
      └── route.ts

Integration:
  ✅ Component registry loads module components
  ✅ Module components appear in library with badge
  ✅ Custom field types render in properties panel
  ✅ Module data binding (product selectors, etc.)
  ✅ Enable/disable module updates component list
  ✅ Real-time sync via Supabase subscriptions
```

### Current State:
- ✅ Modules can export Studio components
- ✅ Dynamic import and registration system
- ✅ Module components work like core components
- ✅ Custom field types (ProductSelector, CategorySelector, etc.)
- ✅ Module API integration for data fetching
- ✅ Hot reload when modules installed/uninstalled
- ✅ Module components support AI, responsive, all features
- ✅ Example: E-Commerce module provides Product Card, Cart Widget

### What's Missing (Wave 6 Will Add):
- ❌ Visual layers/component tree panel
- ❌ Click to select in tree view
- ❌ Drag to reorder in tree
- ❌ Lock/hide components
- ❌ History panel with undo/redo visualization
- ❌ Named snapshots
- ❌ Device frame previews
- ❌ Custom breakpoint widths
- ❌ Zoom controls
- ❌ Nested drop zones within components

---

## 🎯 Generate These Phases (Wave 6):

1. **PHASE-STUDIO-16: Layers & Structure Panel**
2. **PHASE-STUDIO-17: History & Versioning**
3. **PHASE-STUDIO-18: Responsive Preview**
4. **PHASE-STUDIO-19: Nested Components & Zones**

## Expected Outcome After Wave 6

After implementing these 4 phases, we should have:
- ✅ Bottom panel showing component tree (layers)
- ✅ Click component in tree to select
- ✅ Drag to reorder components in tree
- ✅ Lock/unlock components (prevents editing)
- ✅ Hide/show components (visibility toggle)
- ✅ Visual history panel with timeline
- ✅ Undo/redo list with descriptions
- ✅ Named snapshots (save/restore states)
- ✅ Version comparison UI
- ✅ Device frame selector (iPhone, iPad, Desktop)
- ✅ Custom width input for testing
- ✅ Zoom in/out on canvas
- ✅ Ruler and guides
- ✅ Nested drop zones (components that accept children in specific areas)
- ✅ Zone-specific component restrictions

---

## Key Implementation Context

### Existing Infrastructure (Already Built)

```typescript
// Editor store already has:
- components (tree structure via parentId)
- selectedComponentId
- history with zundo middleware
- setComponentProps, moveComponent, deleteComponent

// UI store already has:
- panelVisibility (left, right, bottom)
- breakpoint (mobile, tablet, desktop)
- zoom level

// Component wrapper already handles:
- Selection state
- Hover state
- Click to select
```

---

## PHASE-STUDIO-16: Layers & Structure Panel

### Requirements

#### 1. Bottom Panel UI

```typescript
// src/components/studio/panels/bottom-panel.tsx

interface BottomPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

// Panel shows:
// - Component tree (hierarchical)
// - Each row: icon, name, lock toggle, visibility toggle
// - Drag handle for reordering
// - Indent for children
// - Click to select
// - Context menu (duplicate, delete, lock, hide)
```

#### 2. Component Tree Rendering

```typescript
// src/components/studio/features/layers-panel.tsx

interface LayerItem {
  id: string;
  type: string;
  label: string;
  icon: string;
  children: LayerItem[];
  isLocked: boolean;
  isHidden: boolean;
  isSelected: boolean;
}

// Features:
// - Recursive tree rendering
// - Collapsible branches (expand/collapse)
// - Search/filter components
// - Show/hide all
// - Lock/unlock all
```

#### 3. Drag to Reorder in Tree

```typescript
// Use @dnd-kit/sortable for tree reordering

// When dragging in tree:
// 1. Show drop indicator (line above/below/inside)
// 2. Allow dropping as sibling or child
// 3. Update component parentId and children arrays
// 4. Sync with canvas immediately
```

#### 4. Lock/Hide Functionality

```typescript
// Add to StudioComponent type:
interface StudioComponent {
  // ... existing props
  locked?: boolean;  // Can't edit, delete, or move
  hidden?: boolean;  // Not visible in canvas (but in layers)
}

// When locked:
// - Component wrapper shows lock icon
// - Can't select in canvas
// - Can't edit properties
// - Can't delete
// - Can still see in layers panel

// When hidden:
// - Component doesn't render in canvas
// - Still visible in layers (with eye-slash icon)
// - Can toggle visibility to show again
```

#### 5. Context Menu

```typescript
// Right-click on layer item shows menu:
// - Rename
// - Duplicate
// - Delete
// - Lock / Unlock
// - Hide / Show
// - Move Up
// - Move Down
// - Copy ID (for debugging)
```

#### 6. Integration with Editor Store

```typescript
// Add to editor store:
lockComponent(id: string): void
unlockComponent(id: string): void
hideComponent(id: string): void
showComponent(id: string): void
moveComponentInTree(id: string, targetId: string, position: 'before' | 'after' | 'inside'): void

// Canvas must respect locked/hidden:
// - Hidden components don't render
// - Locked components don't accept clicks
```

---

## PHASE-STUDIO-17: History & Versioning

### Requirements

#### 1. History Panel UI

```typescript
// src/components/studio/features/history-panel.tsx

// Shows:
// - Timeline of all changes (most recent first)
// - Each entry: timestamp, action, component name
// - Current position indicator
// - Undo/Redo buttons
// - Branch visualization (if needed)
```

#### 2. History Entry Types

```typescript
interface HistoryEntry {
  id: string;
  timestamp: number;
  action: HistoryAction;
  componentId?: string;
  componentType?: string;
  description: string; // Human-readable
  canUndo: boolean;
  canRedo: boolean;
}

type HistoryAction =
  | 'component.add'
  | 'component.delete'
  | 'component.move'
  | 'component.edit'
  | 'component.duplicate'
  | 'component.lock'
  | 'component.hide'
  | 'page.generate'
  | 'snapshot.restore';

// Examples:
// "Added Heading component"
// "Moved Button to Hero Section"
// "Changed text to 'Welcome'"
// "Deleted Container"
```

#### 3. Zundo Integration

```typescript
// Editor store already uses zundo middleware
// Enhance with:

import { temporal } from 'zundo';

// Add middleware options:
const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      // ... store implementation
    }),
    {
      limit: 50, // Max history entries
      equality: (a, b) => a === b,
      handleSet: (handleSet) => 
        throttle(handleSet, 100), // Debounce rapid changes
    }
  )
);

// Expose history:
export const useHistory = () => {
  const { undo, redo, clear, futureStates, pastStates } = useEditorStore.temporal;
  return { undo, redo, clear, futureStates, pastStates };
};
```

#### 4. Named Snapshots

```typescript
// src/lib/studio/store/snapshot-store.ts

interface Snapshot {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  data: StudioPageData; // Full page state
  thumbnail?: string; // Canvas screenshot
}

interface SnapshotStore {
  snapshots: Snapshot[];
  saveSnapshot(name: string, description?: string): Promise<void>;
  restoreSnapshot(id: string): void;
  deleteSnapshot(id: string): void;
  compareSnapshots(id1: string, id2: string): SnapshotDiff;
}

// Snapshots saved to:
// - LocalStorage (for quick access)
// - Database (for persistence)
```

#### 5. Snapshot UI

```typescript
// Panel sections:
// 1. History Timeline (undo/redo)
// 2. Snapshots List
//    - Each snapshot: thumbnail, name, date
//    - Buttons: Restore, Delete, Compare
//    - Create Snapshot button

// Create Snapshot Dialog:
// - Name input (required)
// - Description textarea (optional)
// - Cancel / Save buttons
```

#### 6. Version Comparison

```typescript
// Compare two snapshots or current vs snapshot:
interface SnapshotDiff {
  componentsAdded: string[]; // Component IDs
  componentsRemoved: string[];
  componentsModified: Array<{
    id: string;
    type: string;
    changes: Record<string, { old: any; new: any }>;
  }>;
}

// Comparison UI:
// - Side-by-side view
// - Highlight differences
// - Option to restore individual components
```

---

## PHASE-STUDIO-18: Responsive Preview

### Requirements

#### 1. Device Frame Selector

```typescript
// src/components/studio/features/responsive-controls.tsx

const DEVICE_PRESETS = [
  { name: 'Mobile S', width: 320, height: 568, icon: '📱' },
  { name: 'Mobile M', width: 375, height: 667, icon: '📱' },
  { name: 'Mobile L', width: 414, height: 896, icon: '📱' },
  { name: 'Tablet', width: 768, height: 1024, icon: '💻' },
  { name: 'Laptop', width: 1366, height: 768, icon: '💻' },
  { name: 'Desktop', width: 1920, height: 1080, icon: '🖥️' },
  { name: 'Custom', width: null, height: null, icon: '⚙️' },
] as const;

// Toolbar shows:
// - Device preset dropdown
// - Width input (editable)
// - Height input (editable)
// - Orientation toggle (portrait/landscape)
// - Zoom level (50%, 75%, 100%, 150%, 200%)
```

#### 2. Canvas Wrapper with Frame

```typescript
// src/components/studio/core/studio-frame.tsx

interface StudioFrameProps {
  width: number;
  height: number;
  zoom: number;
  showFrame: boolean; // Device bezel
  showRuler: boolean;
  children: React.ReactNode;
}

// Features:
// - Centered in viewport
// - Zoom transform
// - Device frame (iPhone-style bezel when enabled)
// - Scrollable if content exceeds viewport
// - Background (checkerboard pattern)
```

#### 3. Zoom Controls

```typescript
// Toolbar zoom controls:
// - Zoom In button (+)
// - Zoom Out button (-)
// - Reset to 100% button
// - Zoom dropdown (50%, 75%, 100%, 150%, 200%, Fit)
// - Keyboard shortcuts: Ctrl/Cmd + / - / 0

// Zoom implementation:
<div style={{ 
  transform: `scale(${zoom / 100})`,
  transformOrigin: 'top center',
  width: `${width}px`,
  height: `${height}px`,
}}>
  {children}
</div>

// UI store:
interface UIStore {
  // ... existing
  zoom: number; // 25 to 400
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void; // Calculate zoom to fit canvas in viewport
}
```

#### 4. Ruler & Guides

```typescript
// src/components/studio/features/ruler.tsx

// Horizontal ruler (top edge)
// Vertical ruler (left edge)
// - Show pixel measurements
// - Update based on zoom level
// - Click to add guide (optional, advanced)

// Guides (optional):
// - Vertical/horizontal lines
// - Snap to guides when dragging
// - Double-click ruler to add guide
// - Drag guide to reposition
// - Drag guide off ruler to delete
```

#### 5. Responsive Breakpoint Integration

```typescript
// When changing device:
// 1. Determine which breakpoint (mobile/tablet/desktop)
// 2. Update canvas width
// 3. Update UI store breakpoint
// 4. Canvas re-renders with breakpoint-specific values
// 5. Properties panel shows values for current breakpoint

// Example:
// Select "iPhone 13" (390px) → Breakpoint: mobile
// Select "iPad" (768px) → Breakpoint: tablet
// Select "Desktop" (1920px) → Breakpoint: desktop
```

#### 6. Viewport Meta Simulation

```typescript
// Canvas should simulate mobile viewport behavior:
// - Touch interactions (if applicable)
// - Font size scaling
// - Media query matching
// - Viewport units (vw, vh)

// Note: If using iframe for canvas, set viewport meta:
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

---

## PHASE-STUDIO-19: Nested Components & Zones

### Requirements

#### 1. Zone Concept

```typescript
// Zones are named drop areas within a component

interface ComponentDefinition {
  // ... existing props
  zones?: Record<string, ZoneDefinition>;
}

interface ZoneDefinition {
  label: string; // "Header", "Content", "Footer"
  allowedComponents?: string[]; // Restrict component types
  acceptsChildren: boolean;
  minChildren?: number;
  maxChildren?: number;
  defaultComponent?: string; // Auto-add on create
}

// Example: Section with zones
const SectionDefinition: ComponentDefinition = {
  type: 'Section',
  // ...
  zones: {
    content: {
      label: 'Content',
      allowedComponents: ['Container', 'Heading', 'Text', 'Button'], // No other Sections
      acceptsChildren: true,
    },
  },
};

// Example: Tabs with zones per tab
const TabsDefinition: ComponentDefinition = {
  type: 'Tabs',
  zones: {
    tab1: { label: 'Tab 1', acceptsChildren: true },
    tab2: { label: 'Tab 2', acceptsChildren: true },
    tab3: { label: 'Tab 3', acceptsChildren: true },
  },
};
```

#### 2. Zone Data Structure

```typescript
// Page data extended:
interface StudioPageData {
  version: "1.0";
  root: {
    id: "root";
    type: "Root";
    props: {...};
    children: string[]; // Root-level components
  };
  components: Record<string, StudioComponent>;
  zones: Record<string, string[]>; // zoneId → component IDs
}

// Component with zone:
interface StudioComponent {
  // ... existing props
  zones?: string[]; // Zone IDs for this component
}

// Zone ID format: `${componentId}:${zoneName}`
// Example: "section-abc123:content"
```

#### 3. Zone Rendering in Canvas

```typescript
// src/components/studio/dnd/droppable-zone.tsx

interface DroppableZoneProps {
  componentId: string;
  zoneName: string;
  components: StudioComponent[];
  allowedComponents?: string[];
  className?: string;
}

// Render:
<div 
  className={cn(
    "relative min-h-[100px]",
    "border-2 border-dashed border-transparent",
    "hover:border-primary/30", // Show on hover
    isEmpty && "bg-muted/20", // Show when empty
    className
  )}
  data-zone={`${componentId}:${zoneName}`}
>
  {isEmpty && (
    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
      Drop components here
    </div>
  )}
  
  {components.map(comp => (
    <SortableComponent key={comp.id} component={comp} />
  ))}
</div>
```

#### 4. Zone Drop Logic

```typescript
// Modify drag and drop handler:

function handleDrop(event: DragEndEvent) {
  const { active, over } = event;
  
  // Check if dropping into a zone
  const zoneId = over?.data?.current?.zone; // Format: "componentId:zoneName"
  
  if (zoneId) {
    const [parentId, zoneName] = zoneId.split(':');
    
    // Validate component type allowed in this zone
    const parentDef = getComponentDefinition(parentId);
    const zoneDef = parentDef.zones?.[zoneName];
    const draggedType = active.data.current.type;
    
    if (zoneDef.allowedComponents && !zoneDef.allowedComponents.includes(draggedType)) {
      toast.error(`${draggedType} not allowed in ${zoneDef.label}`);
      return;
    }
    
    // Add component to zone
    addComponentToZone(active.id, zoneId);
  } else {
    // Regular drop (root level)
    addComponent(active.id, over.id);
  }
}
```

#### 5. Zone Visual Indicators

```typescript
// While dragging:
// 1. Highlight available zones (green border)
// 2. Dim unavailable zones (gray, with "Not allowed" text)
// 3. Show zone name on hover
// 4. Show component count (e.g., "Content (3 items)")

// CSS for zone states:
.zone {
  transition: all 0.2s;
}

.zone--available {
  border-color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.05);
}

.zone--unavailable {
  border-color: hsl(var(--muted));
  background: hsl(var(--muted) / 0.1);
  cursor: not-allowed;
}

.zone--active { // Currently dragging over
  border-color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.1);
  border-style: solid;
}
```

#### 6. Examples of Components with Zones

**Section** (single zone):
```typescript
zones: {
  content: { label: 'Content', acceptsChildren: true }
}
```

**Tabs** (multiple zones):
```typescript
zones: {
  tab1: { label: 'Tab 1', acceptsChildren: true },
  tab2: { label: 'Tab 2', acceptsChildren: true },
  tab3: { label: 'Tab 3', acceptsChildren: true },
}
```

**Accordion** (per-item zones):
```typescript
zones: {
  item1: { label: 'Item 1', acceptsChildren: true },
  item2: { label: 'Item 2', acceptsChildren: true },
}
```

**Hero** (header/content/footer zones):
```typescript
zones: {
  header: { 
    label: 'Header', 
    allowedComponents: ['Heading', 'Text'],
    maxChildren: 2,
  },
  content: { label: 'Content', acceptsChildren: true },
  footer: { 
    label: 'Footer (Buttons)', 
    allowedComponents: ['Button'],
  },
}
```

**Grid** (cell zones):
```typescript
zones: {
  cell1: { label: 'Cell 1', acceptsChildren: true },
  cell2: { label: 'Cell 2', acceptsChildren: true },
  cell3: { label: 'Cell 3', acceptsChildren: true },
  cell4: { label: 'Cell 4', acceptsChildren: true },
}
```

#### 7. Zone Management in Properties Panel

```typescript
// When component with zones is selected:
// - Show "Zones" section
// - List each zone with:
//   - Zone name
//   - Component count
//   - "Add Component" button (opens picker)
//   - Allowed types info
```

#### 8. Layers Panel with Zones

```typescript
// Component tree shows zones:
📦 Section
  └── 📍 Content (Zone)
      ├── Heading
      ├── Text
      └── Button

📦 Tabs
  ├── 📍 Tab 1 (Zone)
  │   └── Text
  ├── 📍 Tab 2 (Zone)
  │   ├── Image
  │   └── Text
  └── 📍 Tab 3 (Zone)
```

---

## Important Constraints

1. **Performance**: Layers panel must virtualize for pages with 100+ components
2. **History limit**: Max 50 undo states (prevent memory issues)
3. **Snapshots**: Store in IndexedDB, sync to database periodically
4. **Zoom**: Smooth transitions, no lag
5. **Device frames**: Optional (toggle on/off for cleaner view)
6. **Zones**: Maximum 10 zones per component (prevent complexity)
7. **Lock/Hide**: Persist in page data (survives reload)

---

## Wave 6 Checklist

After implementation, verify:

- [ ] Bottom panel shows component tree
- [ ] Click layer to select component in canvas
- [ ] Drag to reorder components in tree
- [ ] Lock component (can't edit/delete)
- [ ] Hide component (invisible in canvas)
- [ ] Context menu on right-click
- [ ] Search/filter in layers
- [ ] History panel shows all changes
- [ ] Undo/redo from history list
- [ ] Save named snapshot
- [ ] Restore snapshot
- [ ] Compare two snapshots
- [ ] Device preset selector
- [ ] Custom width/height input
- [ ] Zoom in/out controls
- [ ] Fit to screen zoom
- [ ] Keyboard shortcuts work
- [ ] Ruler on canvas edges
- [ ] Component with zones renders drop areas
- [ ] Drag component into zone
- [ ] Zone restrictions enforced (allowed components)
- [ ] Zones show in layers panel
- [ ] AI works with zone components
- [ ] Module components can have zones

---

## Output Format

Generate each phase as a complete markdown document with:

```markdown
# PHASE-STUDIO-XX: [Title]

## Overview
| Property | Value |
|----------|-------|
| Phase | STUDIO-XX |
| Priority | Medium |
| Estimated Time | X hours |
| Dependencies | STUDIO-14, STUDIO-15 |

## Problem Statement
[What this phase solves]

## Implementation Tasks

### Task 1: [Specific task name]

**Files to create:**
- `src/path/to/file.tsx`

**Complete code:**
```typescript
// Full implementation
```

**Acceptance Criteria:**
- [ ] Specific testable criterion

## Testing Instructions

## Success Criteria
```

---

## Dependencies Already Installed

Wave 6 uses existing packages:
- @dnd-kit/* (already installed)
- zundo (already installed)
- All UI components (already available)

---

## Start Now

Generate phases in order:
1. **PHASE-STUDIO-16** - Layers & Structure Panel
2. **PHASE-STUDIO-17** - History & Versioning
3. **PHASE-STUDIO-18** - Responsive Preview
4. **PHASE-STUDIO-19** - Nested Components & Zones

Each phase should be detailed enough that an AI agent can implement it without additional context beyond this prompt and the master prompt.

---

# MASTER PROMPT CONTEXT

[The master prompt PHASE-STUDIO-00-MASTER-PROMPT.md provides additional context about:
- Overall architecture
- Design system
- Mobile-first responsive system
- Component structure
- Existing stores and utilities
- All previous waves (1-5) that are now complete]
