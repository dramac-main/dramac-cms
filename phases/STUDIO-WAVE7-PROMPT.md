# TASK: Generate Implementation Phases - WAVE 7 (Polish & Optimization)

You are a senior software architect. Wave 6 (Advanced Features) has been successfully implemented. Now generate the **next 4 polish & optimization phases** for DRAMAC Studio.

## ✅ Wave 6 Completion Status

The following has been implemented:

### Files Created (Wave 6):
```
src/components/studio/panels/
  └── bottom-panel.tsx                   ✅ Bottom panel container

src/components/studio/features/
  ├── layers-panel.tsx                   ✅ Component tree view
  ├── layer-item.tsx                     ✅ Individual layer row
  ├── history-panel.tsx                  ✅ History timeline
  ├── snapshot-dialog.tsx                ✅ Create/restore snapshots
  ├── responsive-controls.tsx            ✅ Device presets & zoom
  ├── studio-frame.tsx                   ✅ Device frame wrapper
  ├── ruler.tsx                          ✅ Canvas ruler
  └── droppable-zone.tsx                 ✅ Nested zone drop areas

src/lib/studio/store/
  └── snapshot-store.ts                  ✅ Named snapshots state

Integration:
  ✅ Bottom panel with layers tree
  ✅ Click layer → select in canvas
  ✅ Drag to reorder in tree
  ✅ Lock/unlock components
  ✅ Hide/show components
  ✅ Context menu on right-click
  ✅ History panel with undo/redo list
  ✅ Named snapshots (save/restore)
  ✅ Device preset selector
  ✅ Custom width/height input
  ✅ Zoom controls (50-200%)
  ✅ Nested drop zones in components
  ✅ Zone restrictions enforced
```

### Current State:
- ✅ Layers panel shows full component hierarchy
- ✅ Lock prevents editing/deletion
- ✅ Hide removes from canvas (stays in layers)
- ✅ History shows all changes with descriptions
- ✅ Snapshots stored in IndexedDB + database
- ✅ Device presets (iPhone, iPad, Desktop, Custom)
- ✅ Zoom smooth and responsive
- ✅ Ruler shows pixel measurements
- ✅ Components can define zones (Tabs, Hero, Section)
- ✅ Zone-specific allowed components
- ✅ Visual zone indicators while dragging

### What's Missing (Wave 7 Will Add):
- ❌ Full keyboard shortcut system
- ❌ Command palette (Cmd+K)
- ❌ Performance virtualization
- ❌ Memoization optimization
- ❌ Component state editing (hover, active, focus)
- ❌ Export optimization (critical CSS, lazy loading)

---

## 🎯 Generate These Phases (Wave 7):

1. **PHASE-STUDIO-20: Keyboard Shortcuts**
2. **PHASE-STUDIO-21: Performance Optimization**
3. **PHASE-STUDIO-22: Component States (Hover, Active)**
4. **PHASE-STUDIO-23: Export & Render Optimization**

## Expected Outcome After Wave 7

After implementing these 4 phases, we should have:
- ✅ All keyboard shortcuts working (save, undo, delete, duplicate, etc.)
- ✅ Command palette for quick actions (Cmd/Ctrl+K)
- ✅ Shortcuts help panel
- ✅ Virtualized component list (handles 500+ components)
- ✅ Memoized renders (no unnecessary re-renders)
- ✅ Code-split panels (lazy loaded)
- ✅ Component hover state editing
- ✅ Component active/focus state editing
- ✅ State preview in canvas
- ✅ Optimized HTML/CSS export
- ✅ Critical CSS extraction
- ✅ Lazy-loaded components in output

---

## Key Implementation Context

### Existing Infrastructure (Already Built)

```typescript
// Editor store has undo/redo (zundo)
// UI store has panel states
// Selection store tracks selected component
// Component wrapper handles selection/hover visuals
// Canvas renders all components
// History panel shows undo/redo list
```

---

## PHASE-STUDIO-20: Keyboard Shortcuts

### Requirements

#### 1. React Hotkeys Hook Setup

```typescript
// Use react-hotkeys-hook (already installed)
import { useHotkeys } from 'react-hotkeys-hook';

// src/lib/studio/hooks/use-studio-shortcuts.ts

export function useStudioShortcuts() {
  const { selectedId, deleteComponent, duplicateComponent } = useEditorStore();
  const { undo, redo } = useEditorStore.temporal;
  const { save, isSaving } = useSavePage();
  const { setCommandPaletteOpen } = useUIStore();
  
  // Save
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    if (!isSaving) save();
  }, { enableOnFormTags: false });
  
  // Undo/Redo
  useHotkeys('mod+z', (e) => {
    e.preventDefault();
    undo();
  });
  
  useHotkeys('mod+shift+z', (e) => {
    e.preventDefault();
    redo();
  });
  
  // Delete
  useHotkeys('delete, backspace', (e) => {
    if (selectedId && !isInputFocused()) {
      e.preventDefault();
      deleteComponent(selectedId);
    }
  });
  
  // Duplicate
  useHotkeys('mod+d', (e) => {
    if (selectedId) {
      e.preventDefault();
      duplicateComponent(selectedId);
    }
  });
  
  // Copy/Paste
  useHotkeys('mod+c', (e) => {
    if (selectedId && !isInputFocused()) {
      e.preventDefault();
      copyComponent(selectedId);
    }
  });
  
  useHotkeys('mod+v', (e) => {
    if (!isInputFocused()) {
      e.preventDefault();
      pasteComponent();
    }
  });
  
  // Deselect
  useHotkeys('escape', () => {
    deselectComponent();
  });
  
  // Command Palette
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setCommandPaletteOpen(true);
  });
  
  // Zoom
  useHotkeys('mod+=, mod+plus', (e) => {
    e.preventDefault();
    zoomIn();
  });
  
  useHotkeys('mod+-', (e) => {
    e.preventDefault();
    zoomOut();
  });
  
  useHotkeys('mod+0', (e) => {
    e.preventDefault();
    resetZoom();
  });
  
  // Preview
  useHotkeys('mod+p', (e) => {
    e.preventDefault();
    togglePreview();
  });
  
  // AI Chat
  useHotkeys('mod+/', (e) => {
    if (selectedId) {
      e.preventDefault();
      openAIChat();
    }
  });
}
```

#### 2. Command Palette

```typescript
// src/components/studio/features/command-palette.tsx

import { Command } from 'cmdk'; // Or use shadcn/ui command component

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
  category: 'edit' | 'view' | 'components' | 'ai' | 'file';
}

const COMMANDS: CommandItem[] = [
  { id: 'save', label: 'Save Page', shortcut: '⌘S', icon: 'save', action: save, category: 'file' },
  { id: 'undo', label: 'Undo', shortcut: '⌘Z', icon: 'undo', action: undo, category: 'edit' },
  { id: 'redo', label: 'Redo', shortcut: '⌘⇧Z', icon: 'redo', action: redo, category: 'edit' },
  { id: 'delete', label: 'Delete Component', shortcut: 'Del', icon: 'trash', action: deleteSelected, category: 'edit' },
  { id: 'duplicate', label: 'Duplicate Component', shortcut: '⌘D', icon: 'copy', action: duplicateSelected, category: 'edit' },
  { id: 'preview', label: 'Toggle Preview', shortcut: '⌘P', icon: 'eye', action: togglePreview, category: 'view' },
  { id: 'zoom-in', label: 'Zoom In', shortcut: '⌘+', icon: 'zoom-in', action: zoomIn, category: 'view' },
  { id: 'zoom-out', label: 'Zoom Out', shortcut: '⌘-', icon: 'zoom-out', action: zoomOut, category: 'view' },
  { id: 'ai-generate', label: 'Generate Page with AI', icon: 'sparkles', action: openAIGenerator, category: 'ai' },
  { id: 'add-heading', label: 'Add Heading', icon: 'heading', action: () => addComponent('Heading'), category: 'components' },
  { id: 'add-text', label: 'Add Text', icon: 'type', action: () => addComponent('Text'), category: 'components' },
  { id: 'add-button', label: 'Add Button', icon: 'square', action: () => addComponent('Button'), category: 'components' },
  { id: 'add-section', label: 'Add Section', icon: 'layout', action: () => addComponent('Section'), category: 'components' },
  // ... more commands
];

export function CommandPalette() {
  const [open, setOpen] = useUIStore(s => [s.commandPaletteOpen, s.setCommandPaletteOpen]);
  const [search, setSearch] = useState('');
  
  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input 
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        
        <Command.Group heading="Edit">
          {COMMANDS.filter(c => c.category === 'edit').map(cmd => (
            <Command.Item key={cmd.id} onSelect={cmd.action}>
              <Icon name={cmd.icon} />
              <span>{cmd.label}</span>
              {cmd.shortcut && <kbd>{cmd.shortcut}</kbd>}
            </Command.Item>
          ))}
        </Command.Group>
        
        {/* More groups... */}
      </Command.List>
    </Command.Dialog>
  );
}
```

#### 3. Shortcuts Help Panel

```typescript
// src/components/studio/features/shortcuts-panel.tsx

const SHORTCUT_GROUPS = [
  {
    name: 'General',
    shortcuts: [
      { keys: ['⌘', 'S'], description: 'Save page' },
      { keys: ['⌘', 'Z'], description: 'Undo' },
      { keys: ['⌘', '⇧', 'Z'], description: 'Redo' },
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['Esc'], description: 'Deselect / Close panel' },
    ],
  },
  {
    name: 'Components',
    shortcuts: [
      { keys: ['Del'], description: 'Delete selected' },
      { keys: ['⌘', 'D'], description: 'Duplicate selected' },
      { keys: ['⌘', 'C'], description: 'Copy component' },
      { keys: ['⌘', 'V'], description: 'Paste component' },
    ],
  },
  {
    name: 'View',
    shortcuts: [
      { keys: ['⌘', 'P'], description: 'Toggle preview' },
      { keys: ['⌘', '+'], description: 'Zoom in' },
      { keys: ['⌘', '-'], description: 'Zoom out' },
      { keys: ['⌘', '0'], description: 'Reset zoom' },
    ],
  },
  {
    name: 'AI',
    shortcuts: [
      { keys: ['⌘', '/'], description: 'Open AI chat for selected' },
    ],
  },
];

// Show with button in toolbar: "⌨️" or "?"
```

#### 4. Clipboard System

```typescript
// src/lib/studio/clipboard.ts

interface ClipboardData {
  type: 'studio-component';
  component: StudioComponent;
  timestamp: number;
}

let clipboard: ClipboardData | null = null;

export function copyComponent(id: string) {
  const component = getComponent(id);
  if (component) {
    clipboard = {
      type: 'studio-component',
      component: structuredClone(component),
      timestamp: Date.now(),
    };
    toast.success('Component copied');
  }
}

export function pasteComponent(targetId?: string) {
  if (clipboard?.type === 'studio-component') {
    const newComponent = {
      ...clipboard.component,
      id: generateId(), // New ID
    };
    addComponent(newComponent, targetId);
    toast.success('Component pasted');
  }
}

export function hasClipboardData(): boolean {
  return clipboard !== null;
}
```

---

## PHASE-STUDIO-21: Performance Optimization

### Requirements

#### 1. Virtualize Component Library

```typescript
// src/components/studio/panels/left-panel.tsx

import { useVirtualizer } from '@tanstack/react-virtual';

function ComponentLibrary() {
  const parentRef = useRef<HTMLDivElement>(null);
  const allComponents = useComponentRegistry(s => Object.values(s.getAllComponents()));
  
  const virtualizer = useVirtualizer({
    count: allComponents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Each component item height
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
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
            <ComponentItem component={allComponents[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2. Memoize Component Renders

```typescript
// src/components/studio/core/component-wrapper.tsx

import { memo, useMemo } from 'react';

const ComponentWrapper = memo(function ComponentWrapper({
  component,
  isSelected,
  isHovered,
}: ComponentWrapperProps) {
  const definition = useComponentRegistry(s => s.getComponent(component.type));
  
  // Memoize the render
  const RenderComponent = useMemo(() => definition?.render, [definition]);
  
  // Memoize props to prevent re-renders
  const memoizedProps = useMemo(() => component.props, [component.props]);
  
  if (!RenderComponent) return null;
  
  return (
    <div
      className={cn(
        'relative',
        isSelected && 'ring-2 ring-primary',
        isHovered && !isSelected && 'ring-1 ring-primary/50',
      )}
    >
      <RenderComponent {...memoizedProps} />
      {/* Selection handles */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.component.id === nextProps.component.id &&
    prevProps.component.props === nextProps.component.props &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered
  );
});
```

#### 3. Debounce Store Updates

```typescript
// src/lib/studio/store/editor-store.ts

import { debounce } from 'lodash-es';

const debouncedSave = debounce((data: StudioPageData) => {
  saveToDatabase(data);
}, 1000);

// When updating props:
setComponentProps: (id, props) => {
  set((state) => {
    state.components[id].props = { ...state.components[id].props, ...props };
  });
  
  // Debounce save
  debouncedSave(get().getPageData());
}
```

#### 4. Code Split Panels

```typescript
// src/components/studio/panels/index.ts

import dynamic from 'next/dynamic';

export const LeftPanel = dynamic(() => import('./left-panel'), {
  loading: () => <PanelSkeleton />,
  ssr: false,
});

export const RightPanel = dynamic(() => import('./right-panel'), {
  loading: () => <PanelSkeleton />,
  ssr: false,
});

export const BottomPanel = dynamic(() => import('./bottom-panel'), {
  loading: () => <PanelSkeleton />,
  ssr: false,
});

// Lazy load AI features
export const AIComponentChat = dynamic(() => import('../ai/ai-component-chat'), {
  loading: () => <Spinner />,
  ssr: false,
});

export const AIPageGenerator = dynamic(() => import('../ai/ai-page-generator'), {
  loading: () => <Spinner />,
  ssr: false,
});
```

#### 5. Optimize Re-renders with Selectors

```typescript
// src/lib/studio/store/selectors.ts

import { shallow } from 'zustand/shallow';

// Instead of:
const { components, selectedId, zoom } = useEditorStore();

// Use selectors:
const components = useEditorStore(s => s.components);
const selectedId = useEditorStore(s => s.selectedId);
const zoom = useUIStore(s => s.zoom);

// For multiple values:
const { undo, redo } = useEditorStore(
  s => ({ undo: s.undo, redo: s.redo }),
  shallow
);
```

#### 6. Performance Metrics

```typescript
// src/lib/studio/utils/performance.ts

export function measureRender(componentName: string) {
  const start = performance.now();
  
  return () => {
    const end = performance.now();
    const duration = end - start;
    
    if (duration > 16) { // More than 1 frame
      console.warn(`Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  };
}

// Usage in component:
useEffect(() => {
  const done = measureRender('ComponentWrapper');
  return done;
});
```

---

## PHASE-STUDIO-22: Component States (Hover, Active)

### Requirements

#### 1. State Selector in Component Wrapper

```typescript
// src/components/studio/core/state-selector.tsx

type ComponentState = 'default' | 'hover' | 'active' | 'focus';

interface StateSelectorProps {
  currentState: ComponentState;
  onChange: (state: ComponentState) => void;
}

export function StateSelector({ currentState, onChange }: StateSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-background border rounded-md">
      {(['default', 'hover', 'active', 'focus'] as const).map((state) => (
        <button
          key={state}
          onClick={() => onChange(state)}
          className={cn(
            'px-2 py-1 text-xs rounded',
            currentState === state
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          )}
        >
          {state}
        </button>
      ))}
    </div>
  );
}
```

#### 2. Component Props with States

```typescript
// Extend component props to include states
interface ComponentWithStates {
  id: string;
  type: string;
  props: Record<string, unknown>;
  states?: {
    hover?: Partial<Record<string, unknown>>; // Props that change on hover
    active?: Partial<Record<string, unknown>>; // Props that change on active
    focus?: Partial<Record<string, unknown>>; // Props that change on focus
  };
}

// Example Button with states:
const buttonComponent = {
  id: 'btn-1',
  type: 'Button',
  props: {
    text: 'Click Me',
    backgroundColor: '#3b82f6', // Default: blue
    color: '#ffffff',
    scale: 1,
  },
  states: {
    hover: {
      backgroundColor: '#2563eb', // Darker blue on hover
      scale: 1.05,
    },
    active: {
      backgroundColor: '#1d4ed8', // Even darker on press
      scale: 0.98,
    },
  },
};
```

#### 3. State Editing in Properties Panel

```typescript
// src/components/studio/properties/state-editor.tsx

export function StateEditor() {
  const selectedId = useEditorStore(s => s.selectedId);
  const [editingState, setEditingState] = useState<ComponentState>('default');
  
  return (
    <div className="space-y-4">
      {/* State tabs */}
      <Tabs value={editingState} onValueChange={setEditingState}>
        <TabsList>
          <TabsTrigger value="default">Default</TabsTrigger>
          <TabsTrigger value="hover">Hover</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="focus">Focus</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Show fields for current state */}
      <div className="space-y-2">
        {editingState === 'default' ? (
          <FieldList fields={definition.fields} />
        ) : (
          <StateFieldList 
            state={editingState} 
            availableFields={getStyleFields(definition.fields)}
          />
        )}
      </div>
      
      {editingState !== 'default' && (
        <p className="text-xs text-muted-foreground">
          Only visual properties can change per state
        </p>
      )}
    </div>
  );
}

// Only these fields can be edited per-state:
const STATE_EDITABLE_FIELDS = [
  'backgroundColor',
  'color',
  'borderColor',
  'scale',
  'opacity',
  'shadow',
  'translateX',
  'translateY',
];
```

#### 4. Preview State in Canvas

```typescript
// src/components/studio/core/component-wrapper.tsx

function ComponentWrapper({ component, isSelected }: Props) {
  const previewState = useUIStore(s => s.previewState); // 'default' | 'hover' | 'active'
  
  // Merge state-specific props
  const effectiveProps = useMemo(() => {
    if (previewState === 'default' || !component.states?.[previewState]) {
      return component.props;
    }
    
    return {
      ...component.props,
      ...component.states[previewState],
    };
  }, [component.props, component.states, previewState]);
  
  // When editing, show the state preview
  return (
    <div className={cn(isSelected && previewState !== 'default' && 'ring-2 ring-orange-500')}>
      <RenderComponent {...effectiveProps} />
    </div>
  );
}
```

#### 5. CSS Generation with States

```typescript
// src/lib/studio/engine/css-generator.ts

function generateComponentCSS(component: ComponentWithStates): string {
  const selector = `[data-component-id="${component.id}"]`;
  
  let css = `${selector} { ${generatePropsCSS(component.props)} }`;
  
  if (component.states?.hover) {
    css += `${selector}:hover { ${generatePropsCSS(component.states.hover)} }`;
  }
  
  if (component.states?.active) {
    css += `${selector}:active { ${generatePropsCSS(component.states.active)} }`;
  }
  
  if (component.states?.focus) {
    css += `${selector}:focus { ${generatePropsCSS(component.states.focus)} }`;
  }
  
  return css;
}
```

#### 6. Transition Support

```typescript
// Add transition field to components
interface TransitionSettings {
  property: 'all' | 'transform' | 'opacity' | 'colors';
  duration: number; // ms
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

// Default transition
const defaultTransition: TransitionSettings = {
  property: 'all',
  duration: 200,
  easing: 'ease-out',
};

// Generated CSS:
// transition: all 200ms ease-out;
```

---

## PHASE-STUDIO-23: Export & Render Optimization

### Requirements

#### 1. Optimized HTML Generator

```typescript
// src/lib/studio/engine/html-generator.ts

export function generateOptimizedHTML(data: StudioPageData): string {
  const components = data.root.children.map(id => data.components[id]);
  
  let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
  html += '<meta charset="UTF-8">\n';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  html += `<title>${data.root.props.title || 'Page'}</title>\n`;
  
  // Inline critical CSS
  const criticalCSS = extractCriticalCSS(components);
  html += `<style>${criticalCSS}</style>\n`;
  
  // Preload important assets
  const preloadAssets = extractPreloadAssets(components);
  preloadAssets.forEach(asset => {
    html += `<link rel="preload" href="${asset.url}" as="${asset.type}">\n`;
  });
  
  html += '</head>\n<body>\n';
  
  // Render components
  components.forEach(comp => {
    html += renderComponentToHTML(comp, data.components);
  });
  
  // Deferred CSS
  const deferredCSS = extractDeferredCSS(components);
  html += `<link rel="stylesheet" href="styles.css" media="print" onload="this.media='all'">\n`;
  
  html += '</body>\n</html>';
  
  return html;
}
```

#### 2. Critical CSS Extraction

```typescript
// src/lib/studio/engine/critical-css.ts

export function extractCriticalCSS(components: StudioComponent[]): string {
  // Get above-the-fold components (first 3-5 sections)
  const aboveFold = components.slice(0, 5);
  
  let css = '';
  
  // Base reset
  css += '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n';
  
  // Above-fold component styles
  aboveFold.forEach(comp => {
    css += generateComponentCSS(comp);
  });
  
  // Minify
  return minifyCSS(css);
}

export function extractDeferredCSS(components: StudioComponent[]): string {
  // Below-the-fold components
  const belowFold = components.slice(5);
  
  let css = '';
  belowFold.forEach(comp => {
    css += generateComponentCSS(comp);
  });
  
  return minifyCSS(css);
}
```

#### 3. Image Optimization

```typescript
// src/lib/studio/engine/image-optimizer.ts

interface OptimizedImage {
  src: string;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
  placeholder: string; // Base64 blur placeholder
}

export async function optimizeImages(data: StudioPageData): Promise<Map<string, OptimizedImage>> {
  const imageComponents = Object.values(data.components)
    .filter(c => c.type === 'Image' || c.props.image);
  
  const optimized = new Map<string, OptimizedImage>();
  
  for (const comp of imageComponents) {
    const originalSrc = comp.props.src || comp.props.image;
    
    if (originalSrc && !optimized.has(originalSrc)) {
      const result = await processImage(originalSrc);
      optimized.set(originalSrc, result);
    }
  }
  
  return optimized;
}

async function processImage(src: string): Promise<OptimizedImage> {
  // Generate multiple sizes
  const sizes = [320, 640, 768, 1024, 1280, 1920];
  
  return {
    src: src,
    srcset: sizes.map(w => `${src}?w=${w} ${w}w`).join(', '),
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    width: 1920,
    height: 1080,
    placeholder: await generateBlurPlaceholder(src),
  };
}
```

#### 4. Lazy Loading Components

```typescript
// src/lib/studio/engine/lazy-renderer.tsx

// For heavy components (video, maps, complex animations)
const LAZY_LOAD_COMPONENTS = ['Video', 'Map', 'Lottie', 'Carousel'];

export function LazyComponent({ component }: { component: StudioComponent }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  if (!isVisible) {
    return (
      <div 
        ref={ref} 
        className="animate-pulse bg-muted"
        style={{ minHeight: component.props.height || 200 }}
      />
    );
  }
  
  return <ComponentRenderer component={component} />;
}
```

#### 5. Code Splitting for Published Sites

```typescript
// src/lib/studio/engine/code-splitter.ts

export function generateCodeSplitBundle(data: StudioPageData) {
  const componentTypes = new Set(
    Object.values(data.components).map(c => c.type)
  );
  
  const bundles: Record<string, string[]> = {
    core: ['Section', 'Container', 'Heading', 'Text', 'Button', 'Image'],
    interactive: ['Accordion', 'Tabs', 'Modal', 'Carousel'],
    marketing: ['Hero', 'CTA', 'Testimonial', 'Pricing'],
    ecommerce: ['ProductCard', 'Cart', 'Checkout'],
    forms: ['Form', 'Input', 'Select'],
  };
  
  // Only include bundles for used components
  const neededBundles = Object.entries(bundles)
    .filter(([_, types]) => types.some(t => componentTypes.has(t)))
    .map(([name]) => name);
  
  return neededBundles;
}
```

#### 6. Build Optimization Script

```typescript
// src/lib/studio/engine/build.ts

export async function buildOptimizedSite(siteId: string): Promise<BuildResult> {
  const pages = await fetchSitePages(siteId);
  
  const results: BuildResult = {
    pages: [],
    assets: [],
    totalSize: 0,
    buildTime: 0,
  };
  
  const startTime = performance.now();
  
  for (const page of pages) {
    // Generate optimized HTML
    const html = generateOptimizedHTML(page.data);
    
    // Extract and optimize CSS
    const css = extractAllCSS(page.data);
    const minifiedCSS = minifyCSS(css);
    
    // Optimize images
    const images = await optimizeImages(page.data);
    
    results.pages.push({
      path: page.slug,
      html: html,
      css: minifiedCSS,
      images: Array.from(images.values()),
    });
  }
  
  results.buildTime = performance.now() - startTime;
  results.totalSize = calculateTotalSize(results);
  
  return results;
}
```

---

## Important Constraints

1. **Keyboard shortcuts**: Don't interfere with text inputs
2. **Virtualization**: Only for lists with 50+ items (avoid overhead for small lists)
3. **Memoization**: Don't over-memoize (adds complexity)
4. **Code splitting**: Keep core bundle under 100KB
5. **Critical CSS**: Keep under 14KB (fits in first TCP packet)
6. **State editing**: Only visual props can change per state
7. **Lazy loading**: Threshold 100px before viewport

---

## Wave 7 Checklist

After implementation, verify:

- [ ] All keyboard shortcuts work (test on Mac and Windows)
- [ ] Shortcuts don't fire when typing in inputs
- [ ] Command palette opens with Cmd/Ctrl+K
- [ ] Can search and execute commands
- [ ] Shortcuts help panel shows all shortcuts
- [ ] Component list virtualized (test with 200+ components)
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Panels code-split (check Network tab)
- [ ] AI features lazy loaded
- [ ] State selector shows in toolbar when component selected
- [ ] Can edit hover/active/focus states
- [ ] State preview works in canvas
- [ ] Generated HTML is valid
- [ ] Critical CSS inlined
- [ ] Images have srcset and lazy loading
- [ ] Heavy components lazy load
- [ ] Build produces optimized output
- [ ] Lighthouse score 90+ for published pages

---

## Dependencies to Install

```bash
# Command palette (if not using shadcn/ui command)
pnpm add cmdk

# Virtualization
pnpm add @tanstack/react-virtual

# CSS minification (for build)
pnpm add cssnano

# Image processing (optional, for build)
pnpm add sharp
```

---

## Output Format

Generate each phase as a complete markdown document with full implementation details.

---

# MASTER PROMPT CONTEXT

[The master prompt PHASE-STUDIO-00-MASTER-PROMPT.md provides additional context about:
- Overall architecture
- Design system
- Mobile-first responsive system
- Keyboard shortcuts table
- All previous waves (1-6) that are now complete]
