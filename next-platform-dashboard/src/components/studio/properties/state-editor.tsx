/**
 * DRAMAC Studio State Editor
 * 
 * Properties panel section for editing state-specific properties.
 * PHASE-STUDIO-22: Component States (Hover, Active, Focus)
 */

'use client';

import { useState, useMemo } from 'react';
import { 
  ComponentState, 
  StudioComponent,
  isStateEditableProperty,
  DEFAULT_TRANSITION,
  TransitionSettings,
  FieldValue,
} from '@/types/studio';
import { StateSelector } from '../features/state-selector';
import { useEditorStore, useUIStore } from '@/lib/studio/store';
import { componentRegistry } from '@/lib/studio/registry/component-registry';
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
  Zap,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { FieldDefinition } from '@/types/studio';

// =============================================================================
// TYPES
// =============================================================================

interface StateEditorProps {
  component: StudioComponent;
}

// =============================================================================
// STATE-EDITABLE FIELD DEFINITIONS
// =============================================================================

/**
 * Default field definitions for state-editable properties
 * Used when the component doesn't define these in its fields
 */
const STATE_FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  backgroundColor: {
    type: 'color',
    label: 'Background Color',
    description: 'Background color for this state',
  },
  color: {
    type: 'color',
    label: 'Text Color',
    description: 'Text color for this state',
  },
  borderColor: {
    type: 'color',
    label: 'Border Color',
    description: 'Border color for this state',
  },
  outlineColor: {
    type: 'color',
    label: 'Outline Color',
    description: 'Outline color for this state (useful for focus)',
  },
  scale: {
    type: 'number',
    label: 'Scale',
    description: 'Scale factor (1 = normal, 1.05 = 5% larger)',
    min: 0.5,
    max: 2,
    step: 0.01,
  },
  opacity: {
    type: 'number',
    label: 'Opacity',
    description: 'Transparency (0 = invisible, 1 = fully visible)',
    min: 0,
    max: 1,
    step: 0.05,
  },
  rotate: {
    type: 'number',
    label: 'Rotation',
    description: 'Rotation in degrees',
    min: -360,
    max: 360,
    step: 1,
  },
  translateX: {
    type: 'number',
    label: 'Translate X',
    description: 'Horizontal offset in pixels',
    min: -100,
    max: 100,
    step: 1,
  },
  translateY: {
    type: 'number',
    label: 'Translate Y',
    description: 'Vertical offset in pixels',
    min: -100,
    max: 100,
    step: 1,
  },
  boxShadow: {
    type: 'text',
    label: 'Box Shadow',
    description: 'CSS box-shadow value',
    placeholder: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  borderWidth: {
    type: 'number',
    label: 'Border Width',
    description: 'Border width in pixels',
    min: 0,
    max: 20,
    step: 1,
  },
  outlineWidth: {
    type: 'number',
    label: 'Outline Width',
    description: 'Outline width in pixels',
    min: 0,
    max: 10,
    step: 1,
  },
  outlineOffset: {
    type: 'number',
    label: 'Outline Offset',
    description: 'Space between element and outline',
    min: 0,
    max: 20,
    step: 1,
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function StateEditor({ component }: StateEditorProps) {
  const editingState = useUIStore(s => s.editingState);
  const setEditingState = useUIStore(s => s.setEditingState);
  const setPreviewingState = useUIStore(s => s.setPreviewingState);
  
  const setComponentStateProps = useEditorStore(s => s.setComponentStateProps);
  const clearComponentState = useEditorStore(s => s.clearComponentState);
  const copyStateFromDefault = useEditorStore(s => s.copyStateFromDefault);
  const setComponentTransition = useEditorStore(s => s.setComponentTransition);
  const updateComponentProps = useEditorStore(s => s.updateComponentProps);
  
  const definition = componentRegistry.get(component.type);
  
  const [transitionOpen, setTransitionOpen] = useState(false);
  
  // Get state-editable fields - merge component fields with defaults
  const stateEditableFields = useMemo(() => {
    const fields: Record<string, FieldDefinition> = {};
    
    // Check component definition fields first
    if (definition?.fields) {
      for (const [key, field] of Object.entries(definition.fields)) {
        if (isStateEditableProperty(key)) {
          fields[key] = field;
        }
      }
    }
    
    // Add common state properties if component has visual properties in props
    const commonStateProps = ['backgroundColor', 'color', 'opacity', 'scale', 'boxShadow'];
    for (const key of commonStateProps) {
      if (!fields[key] && (component.props[key] !== undefined || STATE_FIELD_DEFINITIONS[key])) {
        fields[key] = STATE_FIELD_DEFINITIONS[key];
      }
    }
    
    return fields;
  }, [definition, component.props]);
  
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
      // Update default props
      updateComponentProps(component.id, { [key]: value });
    } else {
      // Update state-specific override
      setComponentStateProps(component.id, editingState, { [key]: value });
    }
  };
  
  // Clear state overrides
  const handleClearState = (state: 'hover' | 'active' | 'focus') => {
    clearComponentState(component.id, state);
    toast.success(`${state} state cleared`);
  };
  
  // Copy from default
  const handleCopyFromDefault = (state: 'hover' | 'active' | 'focus') => {
    copyStateFromDefault(component.id, state);
    toast.success(`Copied visual properties to ${state} state`);
  };
  
  // Transition settings
  const transition = component.transition || DEFAULT_TRANSITION;
  
  const handleTransitionChange = (updates: Partial<TransitionSettings>) => {
    setComponentTransition(component.id, { ...transition, ...updates });
  };
  
  // If no editable fields, show message
  if (Object.keys(stateEditableFields).length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <Info className="h-5 w-5 mx-auto mb-2 opacity-50" />
        <p>This component has no state-editable properties.</p>
        <p className="text-xs mt-1">States are typically used for buttons, links, and form elements.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-3">
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
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Visual Properties
        </h4>
        
        {Object.entries(stateEditableFields).map(([key, field]) => {
          const value = currentValues[key];
          const hasOverride = 
            editingState !== 'default' && 
            component.states?.[editingState]?.[key as keyof typeof component.states.hover] !== undefined;
          
          return (
            <div key={key} className="relative group">
              <FieldRenderer
                field={{ ...field, key }}
                value={value as FieldValue}
                onChange={(newValue) => handlePropertyChange(key, newValue)}
              />
              
              {/* Override indicator */}
              {hasOverride && (
                <button
                  className="absolute right-0 top-0 p-1 text-primary hover:text-primary/80 
                             opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    // Remove this override by re-setting the state without this key
                    const currentOverrides = { ...component.states?.[editingState] };
                    delete currentOverrides[key as keyof typeof currentOverrides];
                    
                    if (Object.keys(currentOverrides).length === 0) {
                      clearComponentState(component.id, editingState);
                    } else {
                      // We need to clear and re-set since we're removing a key
                      clearComponentState(component.id, editingState);
                      if (Object.keys(currentOverrides).length > 0) {
                        setComponentStateProps(component.id, editingState, currentOverrides);
                      }
                    }
                    toast.success(`Reset ${key} to default`);
                  }}
                  title="Remove override (use default)"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Transition Settings */}
      <Collapsible open={transitionOpen} onOpenChange={setTransitionOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-foreground/80">
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
              onChange={(e) => handleTransitionChange({
                duration: parseInt(e.target.value) || 0,
              })}
              className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
            />
          </div>
          
          {/* Easing */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Easing</label>
            <select
              value={transition.easing}
              onChange={(e) => handleTransitionChange({
                easing: e.target.value as TransitionSettings['easing'],
              })}
              className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
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
              onChange={(e) => handleTransitionChange({
                property: e.target.value as TransitionSettings['property'],
              })}
              className="w-full px-3 py-1.5 text-sm border rounded-md bg-background"
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
