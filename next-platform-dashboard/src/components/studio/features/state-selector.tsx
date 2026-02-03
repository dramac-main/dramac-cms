/**
 * DRAMAC Studio State Selector
 * 
 * UI for switching between component states when editing.
 * PHASE-STUDIO-22: Component States (Hover, Active, Focus)
 */

'use client';

import { ComponentState } from '@/types/studio';
import { cn } from '@/lib/utils';
import { 
  MousePointer2, 
  MousePointerClick, 
  Focus, 
  Circle,
  type LucideIcon
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// =============================================================================
// TYPES
// =============================================================================

interface StateSelectorProps {
  currentState: ComponentState;
  onChange: (state: ComponentState) => void;
  availableStates?: ComponentState[];
  disabled?: boolean;
  size?: 'sm' | 'md';
}

// =============================================================================
// STATE CONFIGURATION
// =============================================================================

const STATE_CONFIG: Record<ComponentState, {
  label: string;
  icon: LucideIcon;
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

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

// =============================================================================
// COMPACT VERSION FOR INLINE USE
// =============================================================================

interface StateSelectorInlineProps {
  currentState: ComponentState;
  onChange: (state: ComponentState) => void;
  hasStateOverrides?: Record<ComponentState, boolean>;
}

export function StateSelectorInline({
  currentState,
  onChange,
  hasStateOverrides,
}: StateSelectorInlineProps) {
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

// =============================================================================
// STATE BADGE
// =============================================================================

interface StateBadgeProps {
  state: ComponentState;
  className?: string;
}

export function StateBadge({ state, className }: StateBadgeProps) {
  if (state === 'default') return null;
  
  const config = STATE_CONFIG[state];
  
  return (
    <span 
      className={cn(
        "px-2 py-0.5 text-xs font-medium rounded",
        state === 'hover' && "bg-blue-500 text-white",
        state === 'active' && "bg-orange-500 text-white",
        state === 'focus' && "bg-purple-500 text-white",
        className
      )}
    >
      {config.label} State
    </span>
  );
}
