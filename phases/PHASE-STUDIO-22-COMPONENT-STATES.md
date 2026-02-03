# PHASE-STUDIO-22: Component States (Hover, Active, Focus)

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-22 |
| Title | Component States (Hover, Active, Focus) |
| Priority | Medium |
| Estimated Time | 10-12 hours |
| Dependencies | STUDIO-06 (Canvas), STUDIO-08 (Properties), STUDIO-09 (Fields) |
| Risk Level | Medium |

## Problem Statement

Currently, components in DRAMAC Studio only have a single visual state. Modern websites require interactive states:

- **Hover state**: Button changes color when mouse hovers
- **Active state**: Element appearance when being clicked
- **Focus state**: Form elements when keyboard-focused

Without state editing:
- Buttons look static and unprofessional
- No hover feedback for interactive elements
- Accessibility suffers (focus states important for keyboard users)
- Generated CSS lacks pseudo-class rules

This phase implements **component state editing**:
- State selector UI (default/hover/active/focus)
- Per-state property overrides
- Live preview of states in canvas
- CSS generation with :hover/:active/:focus
- Transition settings for smooth state changes

## Goals

- [ ] Create state selector component for toolbar/properties
- [ ] Extend component data model with states object
- [ ] Build state-aware property editor
- [ ] Implement state preview in canvas
- [ ] Generate CSS with pseudo-class selectors
- [ ] Add transition settings field
- [ ] Limit state editing to visual properties only
- [ ] Create state copy/reset utilities

## Technical Approach

### State System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT WITH STATES                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  {                                                               │
│    id: "btn-1",                                                  │
│    type: "Button",                                               │
│    props: {                              ← DEFAULT STATE         │
│      text: "Click Me",                                           │
│      backgroundColor: "#3b82f6",                                 │
│      color: "#ffffff",                                           │
│      scale: 1,                                                   │
│      borderRadius: "8px",                                        │
│    },                                                            │
│    states: {                             ← STATE OVERRIDES       │
│      hover: {                                                    │
│        backgroundColor: "#2563eb",       ← Darker on hover       │
│        scale: 1.02,                      ← Slight grow           │
│      },                                                          │
│      active: {                                                   │
│        backgroundColor: "#1d4ed8",       ← Even darker           │
│        scale: 0.98,                      ← Slight shrink         │
│      },                                                          │
│      focus: {                                                    │
│        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.5)",          │
│      },                                                          │
│    },                                                            │
│    transition: {                         ← TRANSITION SETTINGS   │
│      property: "all",                                            │
│      duration: 200,                                              │
│      easing: "ease-out",                                         │
│    },                                                            │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

GENERATED CSS:
─────────────
[data-component-id="btn-1"] {
  background-color: #3b82f6;
  color: #ffffff;
  transform: scale(1);
  border-radius: 8px;
  transition: all 200ms ease-out;
}

[data-component-id="btn-1"]:hover {
  background-color: #2563eb;
  transform: scale(1.02);
}

[data-component-id="btn-1"]:active {
  background-color: #1d4ed8;
  transform: scale(0.98);
}

[data-component-id="btn-1"]:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

### State-Editable Properties

Only visual properties that make sense for states can be edited:

| Property Category | Allowed in States | Examples |
|------------------|-------------------|----------|
| Colors | ✅ | backgroundColor, color, borderColor |
| Transform | ✅ | scale, rotate, translateX, translateY |
| Opacity | ✅ | opacity |
| Shadows | ✅ | boxShadow, textShadow |
| Borders | ✅ | borderWidth, borderColor |
| Text | ❌ | text, content (doesn't change on hover) |
| Layout | ❌ | width, height, padding, margin |
| Structure | ❌ | children, type |

### Preview Mode Behavior

When editing states:
1. Canvas shows component in selected state
2. Orange ring indicates "viewing non-default state"
3. Properties panel shows state-specific values
4. Clicking "Test" button cycles through states

## Implementation Tasks

### Task 1: Extend Types for Component States

**Description:** Add state types to the component interface.

**Files:**
- MODIFY: `src/types/studio.ts`

**Code:**
```typescript
// src/types/studio.ts

// Add new types for component states

export type ComponentState = 'default' | 'hover' | 'active' | 'focus';

export interface TransitionSettings {
  property: 'all' | 'transform' | 'opacity' | 'colors' | 'shadow' | 'none';
  duration: number; // milliseconds
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  delay?: number; // milliseconds
}

export const DEFAULT_TRANSITION: TransitionSettings = {
  property: 'all',
  duration: 200,
  easing: 'ease-out',
  delay: 0,
};

// Properties that can be different per state
export const STATE_EDITABLE_PROPERTIES = [
  // Colors
  'backgroundColor',
  'color',
  'borderColor',
  'outlineColor',
  
  // Transform
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'translateX',
  'translateY',
  'skewX',
  'skewY',
  
  // Opacity
  'opacity',
  
  // Shadows
  'boxShadow',
  'textShadow',
  
  // Borders
  'borderWidth',
  'borderStyle',
  
  // Outline (for focus)
  'outlineWidth',
  'outlineStyle',
  'outlineOffset',
] as const;

export type StateEditableProperty = typeof STATE_EDITABLE_PROPERTIES[number];

// State overrides (partial props that override default)
export type StateOverrides = Partial<Record<StateEditableProperty, unknown>>;

// Extended component interface
export interface StudioComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[];
  parentId?: string;
  zoneId?: string;
  locked?: boolean;
  hidden?: boolean;
  
  // NEW: State-specific property overrides
  states?: {
    hover?: StateOverrides;
    active?: StateOverrides;
    focus?: StateOverrides;
  };
  
  // NEW: Transition settings
  transition?: TransitionSettings;
}

// Helper to check if a property can be edited per state
export function isStateEditableProperty(property: string): property is StateEditableProperty {
  return STATE_EDITABLE_PROPERTIES.includes(property as StateEditableProperty);
}

// Helper to get effective props for a state
export function getEffectiveProps(
  component: StudioComponent,
  state: ComponentState
): Record<string, unknown> {
  if (state === 'default' || !component.states?.[state]) {
    return component.props;
  }
  
  return {
    ...component.props,
    ...component.states[state],
  };
}
```

**Acceptance Criteria:**
- [ ] ComponentState type defined
- [ ] TransitionSettings interface complete
- [ ] STATE_EDITABLE_PROPERTIES list complete
- [ ] Helper functions work correctly

---

### Task 2: Create State Selector Component

**Description:** UI for switching between component states when editing.

**Files:**
- CREATE: `src/components/studio/features/state-selector.tsx`

**Code:**
```typescript
// src/components/studio/features/state-selector.tsx

'use client';

import { ComponentState } from '@/types/studio';
import { cn } from '@/lib/utils';
import { 
  MousePointer2, 
  MousePointerClick, 
  Focus, 
  Circle 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StateSelectorProps {
  currentState: ComponentState;
  onChange: (state: ComponentState) => void;
  availableStates?: ComponentState[];
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const STATE_CONFIG: Record<ComponentState, {
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}> = {
  default: {
    label: 'Default',
    icon: Circle,
    description: 'Normal state (no interaction)',
    color: 'text-foreground',
  },
  hover: {
    label: 'Hover',
    icon: MousePointer2,
    description: 'When mouse hovers over',
    color: 'text-blue-500',
  },
  active: {
    label: 'Active',
    icon: MousePointerClick,
    description: 'When being clicked/pressed',
    color: 'text-orange-500',
  },
  focus: {
    label: 'Focus',
    icon: Focus,
    description: 'When focused (keyboard navigation)',
    color: 'text-purple-500',
  },
};

export function StateSelector({
  currentState,
  onChange,
  availableStates = ['default', 'hover', 'active', 'focus'],
  disabled = false,
  size = 'md',
}: StateSelectorProps) {
  return (
    <TooltipProvider>
      <div 
        className={cn(
          "inline-flex items-center gap-0.5 p-1 rounded-lg",
          "bg-muted/50 border border-border",
          disabled && "opacity-50 pointer-events-none"
        )}
        role="radiogroup"
        aria-label="Component state"
      >
        {availableStates.map((state) => {
          const config = STATE_CONFIG[state];
          const Icon = config.icon;
          const isSelected = currentState === state;
          
          return (
            <Tooltip key={state}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onChange(state)}
                  className={cn(
                    "flex items-center justify-center rounded transition-colors",
                    size === 'sm' ? "p-1.5" : "px-2.5 py-1.5",
                    isSelected
                      ? "bg-background shadow-sm border border-border"
                      : "hover:bg-background/50",
                    isSelected && config.color
                  )}
                >
                  <Icon className={cn(
                    size === 'sm' ? "h-3.5 w-3.5" : "h-4 w-4",
                    !isSelected && "text-muted-foreground"
                  )} />
                  {size === 'md' && (
                    <span className={cn(
                      "ml-1.5 text-xs font-medium",
                      !isSelected && "text-muted-foreground"
                    )}>
                      {config.label}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Compact version for inline use
export function StateSelectorInline({
  currentState,
  onChange,
  hasStateOverrides,
}: {
  currentState: ComponentState;
  onChange: (state: ComponentState) => void;
  hasStateOverrides?: Record<ComponentState, boolean>;
}) {
  return (
    <div className="flex items-center gap-1">
      {(['default', 'hover', 'active', 'focus'] as const).map((state) => {
        const config = STATE_CONFIG[state];
        const Icon = config.icon;
        const isSelected = currentState === state;
        const hasOverride = hasStateOverrides?.[state];
        
        return (
          <button
            key={state}
            type="button"
            onClick={() => onChange(state)}
            className={cn(
              "relative p-1 rounded transition-colors",
              isSelected
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title={config.label}
          >
            <Icon className="h-3.5 w-3.5" />
            {hasOverride && state !== 'default' && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] State buttons render correctly
- [ ] Current state visually highlighted
- [ ] Tooltips show state descriptions
- [ ] Indicator shows which states have overrides
- [ ] Keyboard accessible

---

### Task 3: Add State Editing to UI Store

**Description:** Track the currently editing state in UI store.

**Files:**
- MODIFY: `src/lib/studio/store/ui-store.ts`

**Code:**
```typescript
// Add to ui-store.ts

import { ComponentState } from '@/types/studio';

interface UIState {
  // ... existing state ...
  
  // Component state editing
  editingState: ComponentState;
  setEditingState: (state: ComponentState) => void;
  
  // State preview mode (shows the state in canvas)
  previewingState: ComponentState | null;
  setPreviewingState: (state: ComponentState | null) => void;
}

// Add to store implementation:
editingState: 'default',
setEditingState: (state) => set({ editingState: state }),

previewingState: null,
setPreviewingState: (state) => set({ previewingState: state }),
```

**Acceptance Criteria:**
- [ ] editingState tracks current state being edited
- [ ] previewingState tracks state for canvas preview

---

### Task 4: Create State Editor Panel

**Description:** Properties panel section for editing state-specific properties.

**Files:**
- CREATE: `src/components/studio/properties/state-editor.tsx`

**Code:**
```typescript
// src/components/studio/properties/state-editor.tsx

'use client';

import { useState, useMemo } from 'react';
import { 
  ComponentState, 
  StudioComponent,
  STATE_EDITABLE_PROPERTIES,
  isStateEditableProperty,
  DEFAULT_TRANSITION,
} from '@/types/studio';
import { StateSelector } from '../features/state-selector';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { useComponentRegistry } from '@/lib/studio/registry/component-registry';
import { FieldRenderer } from './field-renderer';
import { Button } from '@/components/ui/button';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  Copy, 
  Trash2, 
  ChevronDown, 
  RotateCcw,
  Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StateEditorProps {
  component: StudioComponent;
}

export function StateEditor({ component }: StateEditorProps) {
  const editingState = useUIStore(s => s.editingState);
  const setEditingState = useUIStore(s => s.setEditingState);
  const setPreviewingState = useUIStore(s => s.setPreviewingState);
  
  const setComponentStateProps = useEditorStore(s => s.setComponentStateProps);
  const clearComponentState = useEditorStore(s => s.clearComponentState);
  const copyStateFromDefault = useEditorStore(s => s.copyStateFromDefault);
  const setComponentTransition = useEditorStore(s => s.setComponentTransition);
  
  const registry = useComponentRegistry();
  const definition = registry.getComponent(component.type);
  
  const [transitionOpen, setTransitionOpen] = useState(false);
  
  // Get state-editable fields from component definition
  const stateEditableFields = useMemo(() => {
    if (!definition?.fields) return {};
    
    const fields: Record<string, any> = {};
    
    for (const [key, field] of Object.entries(definition.fields)) {
      if (isStateEditableProperty(key)) {
        fields[key] = field;
      }
    }
    
    return fields;
  }, [definition]);
  
  // Check which states have overrides
  const hasStateOverrides = useMemo(() => ({
    default: true,
    hover: Object.keys(component.states?.hover || {}).length > 0,
    active: Object.keys(component.states?.active || {}).length > 0,
    focus: Object.keys(component.states?.focus || {}).length > 0,
  }), [component.states]);
  
  // Get current values for the editing state
  const currentValues = useMemo(() => {
    if (editingState === 'default') {
      return component.props;
    }
    
    // Merge default with state overrides
    return {
      ...component.props,
      ...component.states?.[editingState],
    };
  }, [component.props, component.states, editingState]);
  
  // Handle property change
  const handlePropertyChange = (key: string, value: unknown) => {
    if (editingState === 'default') {
      // Update default props (handled by parent)
      useEditorStore.getState().setComponentProps(component.id, { [key]: value });
    } else {
      // Update state-specific override
      setComponentStateProps(component.id, editingState, { [key]: value });
    }
  };
  
  // Handle preview (hover over state button)
  const handlePreviewState = (state: ComponentState | null) => {
    setPreviewingState(state);
  };
  
  // Clear state overrides
  const handleClearState = (state: Exclude<ComponentState, 'default'>) => {
    clearComponentState(component.id, state);
    toast.success(`${state} state cleared`);
  };
  
  // Copy from default
  const handleCopyFromDefault = (state: Exclude<ComponentState, 'default'>) => {
    copyStateFromDefault(component.id, state);
    toast.success(`Copied visual properties to ${state} state`);
  };
  
  // Transition settings
  const transition = component.transition || DEFAULT_TRANSITION;
  
  return (
    <div className="space-y-4">
      {/* State Selector */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Component State</label>
        <StateSelector
          currentState={editingState}
          onChange={setEditingState}
          size="sm"
        />
      </div>
      
      {/* State Info */}
      {editingState !== 'default' && (
        <div className={cn(
          "p-3 rounded-lg text-sm",
          editingState === 'hover' && "bg-blue-500/10 border border-blue-500/20",
          editingState === 'active' && "bg-orange-500/10 border border-orange-500/20",
          editingState === 'focus' && "bg-purple-500/10 border border-purple-500/20",
        )}>
          <p className="font-medium mb-1">
            Editing {editingState} state
          </p>
          <p className="text-xs text-muted-foreground">
            Changes here only apply when the component is in {editingState} state.
            Only visual properties can be edited.
          </p>
          
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyFromDefault(editingState)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy from Default
            </Button>
            
            {hasStateOverrides[editingState] && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearState(editingState)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* State-Editable Fields */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Visual Properties
        </h4>
        
        {Object.entries(stateEditableFields).map(([key, field]) => {
          const value = currentValues[key];
          const hasOverride = 
            editingState !== 'default' && 
            component.states?.[editingState]?.[key] !== undefined;
          
          return (
            <div key={key} className="relative">
              <FieldRenderer
                field={field}
                value={value}
                onChange={(newValue) => handlePropertyChange(key, newValue)}
              />
              
              {/* Override indicator */}
              {hasOverride && (
                <button
                  className="absolute right-0 top-0 p-1 text-primary hover:text-primary/80"
                  onClick={() => {
                    // Remove this override
                    const newOverrides = { ...component.states?.[editingState] };
                    delete newOverrides[key];
                    setComponentStateProps(component.id, editingState, newOverrides);
                  }}
                  title="Remove override (use default)"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
        
        {Object.keys(stateEditableFields).length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            This component has no state-editable properties.
          </p>
        )}
      </div>
      
      {/* Transition Settings */}
      <Collapsible open={transitionOpen} onOpenChange={setTransitionOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Transition
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            transitionOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Duration */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Duration (ms)</label>
            <input
              type="number"
              min={0}
              max={2000}
              step={50}
              value={transition.duration}
              onChange={(e) => setComponentTransition(component.id, {
                ...transition,
                duration: parseInt(e.target.value) || 0,
              })}
              className="w-full px-3 py-1.5 text-sm border rounded-md"
            />
          </div>
          
          {/* Easing */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Easing</label>
            <select
              value={transition.easing}
              onChange={(e) => setComponentTransition(component.id, {
                ...transition,
                easing: e.target.value as any,
              })}
              className="w-full px-3 py-1.5 text-sm border rounded-md"
            >
              <option value="ease">Ease</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In-Out</option>
              <option value="linear">Linear</option>
            </select>
          </div>
          
          {/* Property */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Apply to</label>
            <select
              value={transition.property}
              onChange={(e) => setComponentTransition(component.id, {
                ...transition,
                property: e.target.value as any,
              })}
              className="w-full px-3 py-1.5 text-sm border rounded-md"
            >
              <option value="all">All Properties</option>
              <option value="transform">Transform Only</option>
              <option value="opacity">Opacity Only</option>
              <option value="colors">Colors Only</option>
              <option value="shadow">Shadows Only</option>
              <option value="none">None (Instant)</option>
            </select>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] State selector switches editing context
- [ ] Fields show state-specific values
- [ ] Override indicators visible
- [ ] Clear and copy buttons work
- [ ] Transition settings editable

---

### Task 5: Update Editor Store with State Methods

**Description:** Add methods for managing component states.

**Files:**
- MODIFY: `src/lib/studio/store/editor-store.ts`

**Code:**
```typescript
// Add to editor-store.ts

import { ComponentState, TransitionSettings, STATE_EDITABLE_PROPERTIES } from '@/types/studio';

interface EditorState {
  // ... existing state ...
  
  // State management
  setComponentStateProps: (
    id: string, 
    state: Exclude<ComponentState, 'default'>, 
    props: Record<string, unknown>
  ) => void;
  
  clearComponentState: (
    id: string, 
    state: Exclude<ComponentState, 'default'>
  ) => void;
  
  copyStateFromDefault: (
    id: string, 
    state: Exclude<ComponentState, 'default'>
  ) => void;
  
  setComponentTransition: (
    id: string, 
    transition: TransitionSettings
  ) => void;
}

// Add to store implementation:

setComponentStateProps: (id, state, props) => {
  set((draft) => {
    const component = draft.components[id];
    if (!component) return;
    
    // Initialize states object if needed
    if (!component.states) {
      component.states = {};
    }
    
    // Initialize specific state if needed
    if (!component.states[state]) {
      component.states[state] = {};
    }
    
    // Merge new props (filter to only state-editable)
    for (const [key, value] of Object.entries(props)) {
      if (STATE_EDITABLE_PROPERTIES.includes(key as any)) {
        component.states[state]![key] = value;
      }
    }
  });
},

clearComponentState: (id, state) => {
  set((draft) => {
    const component = draft.components[id];
    if (!component?.states) return;
    
    delete component.states[state];
    
    // Clean up empty states object
    if (Object.keys(component.states).length === 0) {
      delete component.states;
    }
  });
},

copyStateFromDefault: (id, state) => {
  set((draft) => {
    const component = draft.components[id];
    if (!component) return;
    
    // Initialize states object if needed
    if (!component.states) {
      component.states = {};
    }
    
    // Copy only state-editable props from default
    const stateProps: Record<string, unknown> = {};
    
    for (const key of STATE_EDITABLE_PROPERTIES) {
      if (component.props[key] !== undefined) {
        stateProps[key] = component.props[key];
      }
    }
    
    component.states[state] = stateProps;
  });
},

setComponentTransition: (id, transition) => {
  set((draft) => {
    const component = draft.components[id];
    if (!component) return;
    
    component.transition = transition;
  });
},
```

**Acceptance Criteria:**
- [ ] setComponentStateProps updates state overrides
- [ ] clearComponentState removes state
- [ ] copyStateFromDefault copies visual props only
- [ ] setComponentTransition updates transition

---

### Task 6: Update Component Wrapper for State Preview

**Description:** Show components in their preview state in the canvas.

**Files:**
- MODIFY: `src/components/studio/core/component-wrapper.tsx`

**Code:**
```typescript
// Add to component-wrapper.tsx

import { getEffectiveProps, ComponentState } from '@/types/studio';
import { useUIStore } from '@/lib/studio/store/ui-store';

// In ComponentWrapper:
function ComponentWrapper({ component, isSelected, isHovered, previewMode }: Props) {
  // Get previewing state from UI store
  const previewingState = useUIStore(s => s.previewingState);
  const editingState = useUIStore(s => s.editingState);
  
  // Determine which state to show
  const displayState: ComponentState = isSelected 
    ? (previewingState || editingState) 
    : 'default';
  
  // Get effective props for the current display state
  const effectiveProps = useMemo(() => {
    return getEffectiveProps(component, displayState);
  }, [component, displayState]);
  
  // Generate inline transition style
  const transitionStyle = useMemo(() => {
    if (!component.transition || component.transition.property === 'none') {
      return {};
    }
    
    const { property, duration, easing, delay = 0 } = component.transition;
    
    const propertyValue = property === 'colors' 
      ? 'background-color, color, border-color'
      : property === 'shadow'
      ? 'box-shadow, text-shadow'
      : property;
    
    return {
      transition: `${propertyValue} ${duration}ms ${easing} ${delay}ms`,
    };
  }, [component.transition]);
  
  // State indicator for non-default states
  const showStateIndicator = isSelected && displayState !== 'default';
  
  return (
    <div
      className={cn(
        'relative transition-shadow duration-150',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isHovered && !isSelected && 'ring-1 ring-primary/50',
        showStateIndicator && 'ring-orange-500', // Different color for state preview
      )}
      data-component-id={component.id}
      data-state={displayState}
      style={transitionStyle}
    >
      <RenderComponent {...effectiveProps} />
      
      {/* State indicator badge */}
      {showStateIndicator && (
        <div className="absolute -top-6 right-0 px-2 py-0.5 bg-orange-500 text-white text-xs rounded">
          {displayState} state
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Selected component shows edited state
- [ ] State indicator badge visible
- [ ] Transition styles applied
- [ ] Non-selected components show default state

---

### Task 7: Create CSS Generator for States

**Description:** Generate CSS with pseudo-class selectors for states.

**Files:**
- CREATE: `src/lib/studio/engine/css-generator.ts`

**Code:**
```typescript
// src/lib/studio/engine/css-generator.ts

import { 
  StudioComponent, 
  StudioPageData,
  TransitionSettings,
  DEFAULT_TRANSITION,
} from '@/types/studio';

/**
 * Generate CSS for a single component including all states
 */
export function generateComponentCSS(component: StudioComponent): string {
  const selector = `[data-component-id="${component.id}"]`;
  const lines: string[] = [];
  
  // Default state
  lines.push(`${selector} {`);
  lines.push(propsToCSS(component.props));
  
  // Add transition
  const transition = component.transition || DEFAULT_TRANSITION;
  if (transition.property !== 'none') {
    lines.push(transitionToCSS(transition));
  }
  
  lines.push('}');
  
  // Hover state
  if (component.states?.hover && Object.keys(component.states.hover).length > 0) {
    lines.push(`${selector}:hover {`);
    lines.push(propsToCSS(component.states.hover));
    lines.push('}');
  }
  
  // Active state
  if (component.states?.active && Object.keys(component.states.active).length > 0) {
    lines.push(`${selector}:active {`);
    lines.push(propsToCSS(component.states.active));
    lines.push('}');
  }
  
  // Focus state
  if (component.states?.focus && Object.keys(component.states.focus).length > 0) {
    lines.push(`${selector}:focus, ${selector}:focus-visible {`);
    lines.push(propsToCSS(component.states.focus));
    lines.push('}');
  }
  
  return lines.join('\n');
}

/**
 * Convert props object to CSS declarations
 */
function propsToCSS(props: Record<string, unknown>): string {
  const declarations: string[] = [];
  
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    
    const cssProperty = camelToKebab(key);
    const cssValue = formatCSSValue(key, value);
    
    if (cssValue) {
      declarations.push(`  ${cssProperty}: ${cssValue};`);
    }
  }
  
  return declarations.join('\n');
}

/**
 * Convert transition settings to CSS
 */
function transitionToCSS(transition: TransitionSettings): string {
  let property = transition.property;
  
  // Map custom property names to CSS
  if (property === 'colors') {
    property = 'background-color, color, border-color' as any;
  } else if (property === 'shadow') {
    property = 'box-shadow, text-shadow' as any;
  }
  
  const delay = transition.delay ? ` ${transition.delay}ms` : '';
  
  return `  transition: ${property} ${transition.duration}ms ${transition.easing}${delay};`;
}

/**
 * Format value for CSS
 */
function formatCSSValue(property: string, value: unknown): string | null {
  if (typeof value === 'number') {
    // Properties that need units
    const pxProperties = [
      'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'gap', 'borderWidth', 'borderRadius', 'fontSize', 'lineHeight',
      'translateX', 'translateY', 'outlineWidth', 'outlineOffset',
    ];
    
    if (pxProperties.some(p => property.toLowerCase().includes(p.toLowerCase()))) {
      return `${value}px`;
    }
    
    // Unitless properties
    if (property === 'opacity' || property === 'scale') {
      return String(value);
    }
    
    // Degrees for rotation
    if (property === 'rotate' || property.includes('skew')) {
      return `${value}deg`;
    }
    
    return String(value);
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  return null;
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Generate CSS for entire page
 */
export function generatePageCSS(data: StudioPageData): string {
  const lines: string[] = [];
  
  // CSS Reset (minimal)
  lines.push(`/* Generated by DRAMAC Studio */`);
  lines.push(`*, *::before, *::after { box-sizing: border-box; }`);
  lines.push(``);
  
  // Generate CSS for each component
  for (const component of Object.values(data.components)) {
    lines.push(`/* ${component.type} - ${component.id} */`);
    lines.push(generateComponentCSS(component));
    lines.push(``);
  }
  
  return lines.join('\n');
}

/**
 * Minify CSS (basic)
 */
export function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove space around syntax
    .replace(/;}/g, '}')               // Remove last semicolon
    .trim();
}
```

**Acceptance Criteria:**
- [ ] Default state CSS generated
- [ ] :hover CSS generated when state exists
- [ ] :active CSS generated when state exists
- [ ] :focus CSS generated when state exists
- [ ] Transition CSS included
- [ ] Values properly formatted with units

---

### Task 8: Add State Test Button

**Description:** Button to cycle through states for testing appearance.

**Files:**
- CREATE: `src/components/studio/features/state-test-button.tsx`

**Code:**
```typescript
// src/components/studio/features/state-test-button.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { ComponentState } from '@/types/studio';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { cn } from '@/lib/utils';

const STATES: ComponentState[] = ['default', 'hover', 'active', 'focus'];
const CYCLE_INTERVAL = 1500; // ms per state

export function StateTestButton() {
  const [testing, setTesting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const setPreviewingState = useUIStore(s => s.setPreviewingState);
  
  // Cycle through states
  useEffect(() => {
    if (!testing) {
      setPreviewingState(null);
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % STATES.length);
    }, CYCLE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [testing, setPreviewingState]);
  
  // Update preview state
  useEffect(() => {
    if (testing) {
      setPreviewingState(STATES[currentIndex]);
    }
  }, [currentIndex, testing, setPreviewingState]);
  
  const handleToggle = useCallback(() => {
    setTesting(prev => !prev);
    setCurrentIndex(0);
  }, []);
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className={cn(
        "gap-1.5",
        testing && "bg-primary/10 border-primary"
      )}
    >
      {testing ? (
        <>
          <Pause className="h-3 w-3" />
          Stop Test
        </>
      ) : (
        <>
          <Play className="h-3 w-3" />
          Test States
        </>
      )}
    </Button>
  );
}
```

**Acceptance Criteria:**
- [ ] Button toggles state cycling
- [ ] States cycle every 1.5 seconds
- [ ] Canvas shows cycling state
- [ ] Stop resets to default

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | `src/types/studio.ts` | Add state types and helpers |
| CREATE | `src/components/studio/features/state-selector.tsx` | State selection UI |
| CREATE | `src/components/studio/properties/state-editor.tsx` | State-aware property editing |
| CREATE | `src/components/studio/features/state-test-button.tsx` | State cycling test |
| CREATE | `src/lib/studio/engine/css-generator.ts` | CSS generation with states |
| MODIFY | `src/lib/studio/store/ui-store.ts` | Add state editing state |
| MODIFY | `src/lib/studio/store/editor-store.ts` | Add state management methods |
| MODIFY | `src/components/studio/core/component-wrapper.tsx` | State preview rendering |

## Testing Requirements

### Unit Tests
- [ ] getEffectiveProps merges correctly
- [ ] CSS generator produces valid CSS
- [ ] Transition CSS formats correctly
- [ ] State methods update store correctly

### Integration Tests
- [ ] State changes update canvas immediately
- [ ] State editor syncs with canvas preview
- [ ] CSS export includes all states

### Manual Testing
- [ ] Edit hover state for Button
- [ ] Preview hover state in canvas
- [ ] Clear hover state
- [ ] Copy from default
- [ ] Test state cycling
- [ ] Verify generated CSS has :hover rules

## Rollback Plan

If state editing causes issues:
1. Hide state selector from properties panel
2. Default editingState to 'default' always
3. Skip state CSS generation in export

Components will still work with default state only.

## Success Criteria

- [ ] State selector shows in properties panel when component selected
- [ ] Can switch between default/hover/active/focus editing
- [ ] Only visual properties editable per state
- [ ] Canvas shows edited state when selected
- [ ] State indicator badge visible for non-default states
- [ ] Transition settings editable
- [ ] Generated CSS includes :hover/:active/:focus rules
- [ ] State test button cycles through states
- [ ] Copy from default works
- [ ] Clear state works
- [ ] Override indicators show which props differ
