# PHASE-STUDIO-10: Responsive Field System

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-10 |
| Title | Responsive Field System |
| Priority | High |
| Estimated Time | 10-14 hours |
| Dependencies | STUDIO-05, STUDIO-06, STUDIO-07, STUDIO-08, STUDIO-09 |
| Risk Level | Medium |

## Problem Statement

Modern websites must be responsive, adapting seamlessly to mobile, tablet, and desktop screens. The current field system edits a single value, but premium components need per-breakpoint values. Without a responsive field system:

- Users cannot set different font sizes for mobile vs desktop
- Padding/spacing cannot adapt to screen size
- Column layouts cannot change responsively
- The editor cannot preview how components look at different breakpoints
- Component properties are "one size fits all"

This phase implements a complete responsive editing system that allows any visual property to have different values per breakpoint (mobile, tablet, desktop), with the canvas preview matching the selected breakpoint.

## Goals

- [ ] Add breakpoint selector to top toolbar (📱 💻 🖥️)
- [ ] Create breakpoint state in UI store
- [ ] Implement ResponsiveFieldWrapper component
- [ ] Update canvas to resize based on breakpoint
- [ ] Add responsive toggle to applicable fields
- [ ] Show current breakpoint indicator in properties panel
- [ ] Ensure components render with breakpoint-specific values
- [ ] Update all 10 existing components to use responsive fields
- [ ] Create responsive value utilities

## Technical Approach

### Responsive Value Pattern

```typescript
// A responsive value can be:
// 1. A plain value (same for all breakpoints)
// 2. An object with mobile (required) + optional tablet/desktop

type ResponsiveValue<T> = T | {
  mobile: T;      // Required - base/default
  tablet?: T;     // Optional tablet override
  desktop?: T;    // Optional desktop override
};

// Example usage:
const fontSize: ResponsiveValue<string> = {
  mobile: '16px',
  tablet: '18px',
  desktop: '24px',
};
```

### Breakpoint State Flow

```
1. User clicks breakpoint selector (📱 💻 🖥️)
2. UI store updates currentBreakpoint
3. Canvas resizes to breakpoint width
4. Properties panel shows values for current breakpoint
5. Editing updates only current breakpoint's value
6. Components render using current breakpoint's values
```

### Smart Field Detection

Fields marked with `responsive: true` in their definition will:
- Show a responsive toggle button
- When enabled, store values as ResponsiveValue<T>
- When disabled, store as plain value

---

## Implementation Tasks

### Task 1: Create Responsive Value Utilities

**Description:** Create utilities for working with responsive values.

**Files:**
- CREATE: `src/lib/studio/utils/responsive-utils.ts`

**Code:**

```typescript
// src/lib/studio/utils/responsive-utils.ts
'use client';

/**
 * Responsive value utilities for DRAMAC Studio
 * 
 * These utilities help work with values that can vary per breakpoint.
 */

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export const BREAKPOINTS: Record<Breakpoint, number> = {
  mobile: 375,     // iPhone SE width
  tablet: 768,     // iPad portrait
  desktop: 1280,   // Standard desktop
} as const;

export const BREAKPOINT_LABELS: Record<Breakpoint, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
} as const;

export const BREAKPOINT_ICONS: Record<Breakpoint, string> = {
  mobile: '📱',
  tablet: '💻',
  desktop: '🖥️',
} as const;

export const BREAKPOINT_MAX_WIDTHS: Record<Breakpoint, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
} as const;

// Type guard: check if value is a ResponsiveValue object
export function isResponsiveValue<T>(value: unknown): value is ResponsiveObject<T> {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;
  return 'mobile' in (value as object);
}

// ResponsiveValue types
export type ResponsiveObject<T> = {
  mobile: T;
  tablet?: T;
  desktop?: T;
};

export type ResponsiveValue<T> = T | ResponsiveObject<T>;

/**
 * Get the value for a specific breakpoint from a responsive value.
 * Falls back to mobile, then to the raw value.
 */
export function getResponsiveValue<T>(
  value: ResponsiveValue<T>,
  breakpoint: Breakpoint
): T {
  // If not a responsive object, return as-is
  if (!isResponsiveValue<T>(value)) {
    return value;
  }
  
  // Try to get breakpoint-specific value, falling back through hierarchy
  if (breakpoint === 'desktop') {
    return value.desktop ?? value.tablet ?? value.mobile;
  }
  
  if (breakpoint === 'tablet') {
    return value.tablet ?? value.mobile;
  }
  
  // Mobile is always the base
  return value.mobile;
}

/**
 * Set the value for a specific breakpoint in a responsive value.
 * Returns a new responsive object.
 */
export function setResponsiveValue<T>(
  currentValue: ResponsiveValue<T>,
  breakpoint: Breakpoint,
  newValue: T
): ResponsiveObject<T> {
  // If current is not responsive, create responsive object
  if (!isResponsiveValue<T>(currentValue)) {
    const responsive: ResponsiveObject<T> = { mobile: currentValue };
    responsive[breakpoint] = newValue;
    return responsive;
  }
  
  // Update the specific breakpoint
  return {
    ...currentValue,
    [breakpoint]: newValue,
  };
}

/**
 * Convert a plain value to a responsive value with same value for all breakpoints.
 */
export function toResponsiveValue<T>(value: T): ResponsiveObject<T> {
  if (isResponsiveValue<T>(value)) {
    return value;
  }
  
  return {
    mobile: value,
    tablet: value,
    desktop: value,
  };
}

/**
 * Convert a responsive value back to a plain value (using mobile as default).
 */
export function fromResponsiveValue<T>(value: ResponsiveValue<T>): T {
  if (isResponsiveValue<T>(value)) {
    return value.mobile;
  }
  return value;
}

/**
 * Check if all breakpoint values are the same (can be simplified to plain value).
 */
export function areAllBreakpointsSame<T>(value: ResponsiveObject<T>): boolean {
  const mobile = value.mobile;
  const tablet = value.tablet ?? mobile;
  const desktop = value.desktop ?? tablet;
  
  // For objects, do deep comparison
  if (typeof mobile === 'object' && mobile !== null) {
    return JSON.stringify(mobile) === JSON.stringify(tablet) && 
           JSON.stringify(tablet) === JSON.stringify(desktop);
  }
  
  return mobile === tablet && tablet === desktop;
}

/**
 * Generate CSS with media queries for a responsive value.
 */
export function generateResponsiveCSS(
  property: string,
  value: ResponsiveValue<string>
): string {
  if (!isResponsiveValue<string>(value)) {
    return `${property}: ${value};`;
  }
  
  let css = `${property}: ${value.mobile};`;
  
  if (value.tablet && value.tablet !== value.mobile) {
    css += `\n@media (min-width: 768px) { ${property}: ${value.tablet}; }`;
  }
  
  if (value.desktop && value.desktop !== (value.tablet ?? value.mobile)) {
    css += `\n@media (min-width: 1024px) { ${property}: ${value.desktop}; }`;
  }
  
  return css;
}

/**
 * Generate inline style object for current breakpoint.
 */
export function getResponsiveStyles(
  styles: Record<string, ResponsiveValue<string | number>>,
  breakpoint: Breakpoint
): React.CSSProperties {
  const result: Record<string, string | number> = {};
  
  for (const [key, value] of Object.entries(styles)) {
    result[key] = getResponsiveValue(value, breakpoint);
  }
  
  return result as React.CSSProperties;
}

/**
 * Create a hook for using responsive values in components.
 */
export function createResponsiveHook<T>(defaultValue: T) {
  return function useResponsiveValue(
    value: ResponsiveValue<T> | undefined,
    breakpoint: Breakpoint
  ): T {
    if (value === undefined) {
      return defaultValue;
    }
    return getResponsiveValue(value, breakpoint);
  };
}

// Pre-built hooks for common types
export const useResponsiveString = createResponsiveHook('');
export const useResponsiveNumber = createResponsiveHook(0);
export const useResponsiveBoolean = createResponsiveHook(false);

/**
 * Get all defined breakpoint values as a summary string.
 */
export function getResponsiveSummary<T>(
  value: ResponsiveValue<T>,
  formatter?: (val: T) => string
): string {
  const format = formatter || ((v: T) => String(v));
  
  if (!isResponsiveValue<T>(value)) {
    return format(value);
  }
  
  const parts: string[] = [];
  parts.push(`📱 ${format(value.mobile)}`);
  
  if (value.tablet !== undefined && value.tablet !== value.mobile) {
    parts.push(`💻 ${format(value.tablet)}`);
  }
  
  if (value.desktop !== undefined && value.desktop !== (value.tablet ?? value.mobile)) {
    parts.push(`🖥️ ${format(value.desktop)}`);
  }
  
  return parts.join(' | ');
}
```

**Acceptance Criteria:**
- [ ] Type guards work correctly
- [ ] getResponsiveValue returns correct value per breakpoint
- [ ] setResponsiveValue updates only target breakpoint
- [ ] CSS generation includes media queries
- [ ] Utilities are TypeScript type-safe

---

### Task 2: Update UI Store with Breakpoint State

**Description:** Add current breakpoint state to the UI store.

**Files:**
- MODIFY: `src/lib/studio/store/ui-store.ts`

**Code:**

```typescript
// src/lib/studio/store/ui-store.ts
// Add these types and state to the existing UI store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Breakpoint } from '../utils/responsive-utils';

export interface PanelState {
  isOpen: boolean;
  width?: number;
  height?: number;
}

export interface UIState {
  // Panel states
  leftPanel: PanelState;
  rightPanel: PanelState;
  bottomPanel: PanelState;
  
  // Zoom
  zoom: number;
  
  // View mode
  isPreviewMode: boolean;
  
  // Breakpoint (NEW)
  currentBreakpoint: Breakpoint;
  
  // AI panel
  aiChatOpen: boolean;
  
  // Actions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setZoom: (zoom: number) => void;
  setPreviewMode: (preview: boolean) => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  toggleAIChat: () => void;
  resetUI: () => void;
}

const DEFAULT_PANEL_STATE: PanelState = {
  isOpen: true,
};

const DEFAULT_UI_STATE = {
  leftPanel: { ...DEFAULT_PANEL_STATE, width: 260 },
  rightPanel: { ...DEFAULT_PANEL_STATE, width: 320 },
  bottomPanel: { ...DEFAULT_PANEL_STATE, isOpen: false, height: 200 },
  zoom: 100,
  isPreviewMode: false,
  currentBreakpoint: 'desktop' as Breakpoint,
  aiChatOpen: false,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...DEFAULT_UI_STATE,
      
      toggleLeftPanel: () => set((state) => ({
        leftPanel: { ...state.leftPanel, isOpen: !state.leftPanel.isOpen },
      })),
      
      toggleRightPanel: () => set((state) => ({
        rightPanel: { ...state.rightPanel, isOpen: !state.rightPanel.isOpen },
      })),
      
      toggleBottomPanel: () => set((state) => ({
        bottomPanel: { ...state.bottomPanel, isOpen: !state.bottomPanel.isOpen },
      })),
      
      setZoom: (zoom) => set({ zoom }),
      
      setPreviewMode: (isPreviewMode) => set({ isPreviewMode }),
      
      setBreakpoint: (currentBreakpoint) => set({ currentBreakpoint }),
      
      toggleAIChat: () => set((state) => ({
        aiChatOpen: !state.aiChatOpen,
      })),
      
      resetUI: () => set(DEFAULT_UI_STATE),
    }),
    {
      name: 'dramac-studio-ui',
      partialize: (state) => ({
        leftPanel: state.leftPanel,
        rightPanel: state.rightPanel,
        bottomPanel: state.bottomPanel,
        zoom: state.zoom,
        currentBreakpoint: state.currentBreakpoint,
      }),
    }
  )
);

// Selector hooks for convenience
export const useCurrentBreakpoint = () => useUIStore((state) => state.currentBreakpoint);
export const useSetBreakpoint = () => useUIStore((state) => state.setBreakpoint);
export const useZoom = () => useUIStore((state) => state.zoom);
export const useIsPreviewMode = () => useUIStore((state) => state.isPreviewMode);

export default useUIStore;
```

**Acceptance Criteria:**
- [ ] currentBreakpoint state added to store
- [ ] setBreakpoint action works
- [ ] Breakpoint persists in localStorage
- [ ] Selector hooks exported

---

### Task 3: Create Breakpoint Selector Component

**Description:** Create a toolbar component for selecting the current breakpoint.

**Files:**
- CREATE: `src/components/studio/layout/breakpoint-selector.tsx`

**Code:**

```typescript
// src/components/studio/layout/breakpoint-selector.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { 
  type Breakpoint, 
  BREAKPOINT_LABELS, 
  BREAKPOINT_MAX_WIDTHS,
  BREAKPOINTS,
} from '@/lib/studio/utils/responsive-utils';
import { Smartphone, Tablet, Monitor, ChevronDown } from 'lucide-react';

interface BreakpointOption {
  id: Breakpoint;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  width: string;
  pixels: number;
}

const BREAKPOINT_OPTIONS: BreakpointOption[] = [
  { 
    id: 'mobile', 
    label: 'Mobile', 
    icon: Smartphone, 
    width: '375px',
    pixels: BREAKPOINTS.mobile,
  },
  { 
    id: 'tablet', 
    label: 'Tablet', 
    icon: Tablet, 
    width: '768px',
    pixels: BREAKPOINTS.tablet,
  },
  { 
    id: 'desktop', 
    label: 'Desktop', 
    icon: Monitor, 
    width: '100%',
    pixels: BREAKPOINTS.desktop,
  },
];

interface BreakpointSelectorProps {
  variant?: 'buttons' | 'dropdown';
  showLabels?: boolean;
  showWidths?: boolean;
  className?: string;
}

export function BreakpointSelector({
  variant = 'buttons',
  showLabels = false,
  showWidths = true,
  className,
}: BreakpointSelectorProps) {
  const { currentBreakpoint, setBreakpoint } = useUIStore();
  
  // Get current breakpoint details
  const currentOption = BREAKPOINT_OPTIONS.find(opt => opt.id === currentBreakpoint)!;
  
  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <currentOption.icon className="h-4 w-4" />
            {showLabels && <span>{currentOption.label}</span>}
            {showWidths && (
              <span className="text-xs text-muted-foreground">
                {currentOption.width}
              </span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {BREAKPOINT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => setBreakpoint(option.id)}
              className={cn(
                "gap-2",
                currentBreakpoint === option.id && "bg-accent"
              )}
            >
              <option.icon className="h-4 w-4" />
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {option.width}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // Button group variant
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex items-center bg-muted rounded-lg p-0.5", className)}>
        {BREAKPOINT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = currentBreakpoint === option.id;
          
          return (
            <Tooltip key={option.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setBreakpoint(option.id)}
                  className={cn(
                    "h-8 px-3 gap-1.5",
                    isActive && "bg-background shadow-sm"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  {showLabels && (
                    <span className={cn(
                      "text-xs",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-center">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.width}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Compact version for tight spaces
export function BreakpointSelectorCompact({ className }: { className?: string }) {
  const { currentBreakpoint, setBreakpoint } = useUIStore();
  
  const nextBreakpoint = (): Breakpoint => {
    const order: Breakpoint[] = ['mobile', 'tablet', 'desktop'];
    const currentIndex = order.indexOf(currentBreakpoint);
    return order[(currentIndex + 1) % order.length];
  };
  
  const currentOption = BREAKPOINT_OPTIONS.find(opt => opt.id === currentBreakpoint)!;
  const Icon = currentOption.icon;
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setBreakpoint(nextBreakpoint())}
            className={cn("h-8 w-8", className)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>{currentOption.label}</span>
          <span className="text-xs text-muted-foreground ml-1">
            (click to cycle)
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Indicator that shows in properties panel
export function BreakpointIndicator({ className }: { className?: string }) {
  const currentBreakpoint = useUIStore((state) => state.currentBreakpoint);
  const option = BREAKPOINT_OPTIONS.find(opt => opt.id === currentBreakpoint)!;
  const Icon = option.icon;
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs text-muted-foreground",
      className
    )}>
      <Icon className="h-3.5 w-3.5" />
      <span>Editing for {option.label}</span>
    </div>
  );
}

export default BreakpointSelector;
```

**Acceptance Criteria:**
- [ ] Buttons show mobile/tablet/desktop icons
- [ ] Active breakpoint is highlighted
- [ ] Clicking changes breakpoint
- [ ] Tooltips show breakpoint name and width
- [ ] Compact version cycles through breakpoints

---

### Task 4: Create Responsive Field Wrapper Component

**Description:** Create a wrapper that makes any field responsive-aware.

**Files:**
- CREATE: `src/components/studio/fields/responsive-field-wrapper.tsx`

**Code:**

```typescript
// src/components/studio/fields/responsive-field-wrapper.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/studio/store/ui-store';
import {
  type Breakpoint,
  type ResponsiveValue,
  isResponsiveValue,
  getResponsiveValue,
  setResponsiveValue,
  toResponsiveValue,
  fromResponsiveValue,
  getResponsiveSummary,
  BREAKPOINT_ICONS,
} from '@/lib/studio/utils/responsive-utils';
import type { FieldDefinition } from '@/types/studio';
import { Smartphone, Tablet, Monitor, Link, Unlink } from 'lucide-react';

interface ResponsiveFieldWrapperProps<T> {
  /** Field definition with responsive flag */
  field: FieldDefinition;
  
  /** Current value (may be T or ResponsiveValue<T>) */
  value: ResponsiveValue<T> | undefined;
  
  /** Called when value changes */
  onChange: (value: ResponsiveValue<T>) => void;
  
  /** Default value if undefined */
  defaultValue?: T;
  
  /** Render the actual field editor */
  children: (props: {
    value: T;
    onChange: (value: T) => void;
    isResponsive: boolean;
    currentBreakpoint: Breakpoint;
  }) => React.ReactNode;
}

interface BreakpointIndicatorProps {
  breakpoint: Breakpoint;
  isActive: boolean;
  hasValue: boolean;
  onClick: () => void;
}

function BreakpointIndicatorButton({ 
  breakpoint, 
  isActive, 
  hasValue,
  onClick 
}: BreakpointIndicatorProps) {
  const icons: Record<Breakpoint, React.ComponentType<{ className?: string }>> = {
    mobile: Smartphone,
    tablet: Tablet,
    desktop: Monitor,
  };
  
  const Icon = icons[breakpoint];
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "p-1 rounded transition-colors",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : hasValue 
                  ? "bg-muted text-foreground hover:bg-muted/80" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)}
          {isActive && ' (editing)'}
          {!isActive && hasValue && ' (has value)'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ResponsiveFieldWrapper<T>({
  field,
  value,
  onChange,
  defaultValue,
  children,
}: ResponsiveFieldWrapperProps<T>) {
  const { currentBreakpoint, setBreakpoint } = useUIStore();
  
  // Determine if field is currently in responsive mode
  const isResponsive = isResponsiveValue<T>(value);
  
  // Get the value to edit (current breakpoint's value or plain value)
  const getCurrentValue = (): T => {
    if (value === undefined) {
      return defaultValue as T;
    }
    return getResponsiveValue(value, currentBreakpoint);
  };
  
  // Handle value change from child editor
  const handleChange = React.useCallback((newValue: T) => {
    if (isResponsive) {
      // Update only the current breakpoint
      const updated = setResponsiveValue(value as ResponsiveValue<T>, currentBreakpoint, newValue);
      onChange(updated);
    } else {
      // Plain value, update directly
      onChange(newValue);
    }
  }, [value, currentBreakpoint, isResponsive, onChange]);
  
  // Toggle responsive mode
  const toggleResponsive = React.useCallback(() => {
    if (isResponsive) {
      // Convert to plain value (use mobile value)
      onChange(fromResponsiveValue(value as ResponsiveValue<T>));
    } else {
      // Convert to responsive (same value for all breakpoints initially)
      const currentVal = value ?? defaultValue;
      onChange(toResponsiveValue(currentVal as T));
    }
  }, [value, defaultValue, isResponsive, onChange]);
  
  // Check if field supports responsive mode
  if (!field.responsive) {
    // Render without responsive controls
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{field.label}</Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        {children({
          value: (value ?? defaultValue) as T,
          onChange: onChange as (value: T) => void,
          isResponsive: false,
          currentBreakpoint,
        })}
      </div>
    );
  }
  
  // Get values for each breakpoint (for indicators)
  const getBreakpointHasValue = (bp: Breakpoint): boolean => {
    if (!isResponsive) return false;
    const responsiveVal = value as { mobile: T; tablet?: T; desktop?: T };
    if (bp === 'mobile') return true; // Mobile always has value
    return responsiveVal[bp] !== undefined;
  };
  
  return (
    <div className="space-y-2">
      {/* Header with label and responsive toggle */}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">{field.label}</Label>
        
        <div className="flex items-center gap-1">
          {/* Responsive mode toggle */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleResponsive}
                >
                  {isResponsive ? (
                    <Unlink className="h-3 w-3 text-primary" />
                  ) : (
                    <Link className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isResponsive 
                  ? 'Click to use same value for all breakpoints'
                  : 'Click to set different values per breakpoint'
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      
      {/* Breakpoint indicators when in responsive mode */}
      {isResponsive && (
        <div className="flex items-center gap-1 pb-1">
          {(['mobile', 'tablet', 'desktop'] as Breakpoint[]).map((bp) => (
            <BreakpointIndicatorButton
              key={bp}
              breakpoint={bp}
              isActive={currentBreakpoint === bp}
              hasValue={getBreakpointHasValue(bp)}
              onClick={() => setBreakpoint(bp)}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            Editing: {currentBreakpoint}
          </span>
        </div>
      )}
      
      {/* Render the actual field */}
      {children({
        value: getCurrentValue(),
        onChange: handleChange,
        isResponsive,
        currentBreakpoint,
      })}
      
      {/* Summary of all breakpoint values when responsive */}
      {isResponsive && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">
          {getResponsiveSummary(value as ResponsiveValue<T>, (v) => {
            if (typeof v === 'string') return v;
            if (typeof v === 'number') return String(v);
            if (typeof v === 'object' && v !== null) return JSON.stringify(v);
            return String(v);
          })}
        </div>
      )}
    </div>
  );
}

export default ResponsiveFieldWrapper;
```

**Acceptance Criteria:**
- [ ] Non-responsive fields render without extra controls
- [ ] Responsive fields show toggle button
- [ ] Toggle converts between plain and responsive values
- [ ] Breakpoint indicators show which have values
- [ ] Clicking indicator switches breakpoint
- [ ] Summary shows all breakpoint values

---

### Task 5: Update FieldRenderer to Support Responsive Fields

**Description:** Modify the FieldRenderer to wrap responsive fields.

**Files:**
- MODIFY: `src/components/studio/fields/field-renderer.tsx`

**Code:**

```typescript
// src/components/studio/fields/field-renderer.tsx
// UPDATE the existing FieldRenderer to handle responsive fields

'use client';

import * as React from 'react';
import type { FieldDefinition, FieldType } from '@/types/studio';
import { ResponsiveFieldWrapper } from './responsive-field-wrapper';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { getResponsiveValue, isResponsiveValue } from '@/lib/studio/utils/responsive-utils';

// Import all field editors
import { TextFieldEditor } from '@/lib/studio/fields/text-field-editor';
import { NumberFieldEditor } from '@/lib/studio/fields/number-field-editor';
import { SelectFieldEditor } from '@/lib/studio/fields/select-field-editor';
import { ToggleFieldEditor } from '@/lib/studio/fields/toggle-field-editor';
import { ColorFieldEditor } from '@/lib/studio/fields/color-field-editor';
import { ImageFieldEditor } from '@/lib/studio/fields/image-field-editor';
import { LinkFieldEditor } from '@/lib/studio/fields/link-field-editor';
import { SpacingFieldEditor } from '@/lib/studio/fields/spacing-field-editor';
import { TypographyFieldEditor } from '@/lib/studio/fields/typography-field-editor';
import { 
  ArrayFieldEditor, 
  ArrayFieldEditorProvider 
} from '@/lib/studio/fields/array-field-editor';
import { 
  ObjectFieldEditor,
  ObjectFieldEditorProvider 
} from '@/lib/studio/fields/object-field-editor';

export interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

// Map field types to their editors
const FIELD_EDITORS: Partial<Record<FieldType, React.ComponentType<any>>> = {
  text: TextFieldEditor,
  textarea: TextFieldEditor,
  number: NumberFieldEditor,
  select: SelectFieldEditor,
  toggle: ToggleFieldEditor,
  checkbox: ToggleFieldEditor,
  color: ColorFieldEditor,
  image: ImageFieldEditor,
  link: LinkFieldEditor,
  spacing: SpacingFieldEditor,
  typography: TypographyFieldEditor,
  array: ArrayFieldEditor,
  object: ObjectFieldEditor,
};

// Fields that support responsive mode
const RESPONSIVE_FIELD_TYPES: FieldType[] = [
  'text',
  'number',
  'spacing',
  'typography',
  'color',
];

// Get field-specific props based on type
function getFieldProps(field: FieldDefinition, value: unknown) {
  const commonProps = {
    label: field.label,
    description: field.description,
    required: field.required,
  };
  
  switch (field.type) {
    case 'textarea':
      return { ...commonProps, multiline: true, rows: field.rows || 3 };
    case 'number':
      return { ...commonProps, min: field.min, max: field.max, step: field.step };
    case 'select':
    case 'radio':
      return { ...commonProps, options: field.options || [] };
    case 'image':
      return { ...commonProps, accepts: field.accepts };
    case 'array':
      return { 
        ...commonProps, 
        itemFields: field.itemFields || {},
        itemLabel: field.label?.replace(/s$/, '') || 'Item',
        minItems: field.min,
        maxItems: field.max,
      };
    case 'object':
      return { ...commonProps, fields: field.fields || {} };
    default:
      return commonProps;
  }
}

// Inner renderer without responsive wrapper
function InnerFieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  const Editor = FIELD_EDITORS[field.type];
  
  if (!Editor) {
    return (
      <div className="p-2 border rounded bg-muted text-xs text-muted-foreground">
        Unknown field type: {field.type}
      </div>
    );
  }
  
  const fieldProps = getFieldProps(field, value);
  
  return (
    <Editor
      {...fieldProps}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

// Main field renderer with responsive support
export function FieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  const currentBreakpoint = useUIStore((state) => state.currentBreakpoint);
  
  // Check if this field supports and has responsive mode enabled
  const supportsResponsive = field.responsive && RESPONSIVE_FIELD_TYPES.includes(field.type);
  
  // Wrap in providers for array/object recursion
  const renderWithProviders = (element: React.ReactNode) => (
    <ArrayFieldEditorProvider fieldRenderer={InnerFieldRenderer}>
      <ObjectFieldEditorProvider fieldRenderer={InnerFieldRenderer}>
        {element}
      </ObjectFieldEditorProvider>
    </ArrayFieldEditorProvider>
  );
  
  // If field supports responsive and is marked responsive
  if (supportsResponsive) {
    return renderWithProviders(
      <ResponsiveFieldWrapper
        field={field}
        value={value}
        onChange={onChange}
        defaultValue={field.defaultValue}
      >
        {({ value: currentValue, onChange: handleChange, isResponsive, currentBreakpoint: bp }) => (
          <InnerFieldRenderer
            field={{ ...field, label: '', description: '' }} // Label handled by wrapper
            value={currentValue}
            onChange={handleChange}
            disabled={disabled}
          />
        )}
      </ResponsiveFieldWrapper>
    );
  }
  
  // Non-responsive field
  return renderWithProviders(
    <InnerFieldRenderer
      field={field}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export { FIELD_EDITORS };
export default FieldRenderer;
```

**Acceptance Criteria:**
- [ ] Responsive fields get wrapped in ResponsiveFieldWrapper
- [ ] Non-responsive fields render directly
- [ ] Array/Object fields work with recursion
- [ ] Value handling works correctly

---

### Task 6: Update Canvas to Respect Breakpoint

**Description:** Modify the editor canvas to resize based on current breakpoint.

**Files:**
- MODIFY: `src/components/studio/canvas/editor-canvas.tsx`

**Code:**

```typescript
// src/components/studio/canvas/editor-canvas.tsx
// Add/update these sections

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { useSelectionStore } from '@/lib/studio/store/selection-store';
import { 
  type Breakpoint, 
  BREAKPOINT_MAX_WIDTHS,
  BREAKPOINTS,
} from '@/lib/studio/utils/responsive-utils';
import { DroppableCanvas } from '../dnd/droppable-canvas';
import { SortableComponent } from '../dnd/sortable-component';
import { ComponentWrapper } from './component-wrapper';

// Device frame styles
const DEVICE_FRAMES: Record<Breakpoint, React.CSSProperties> = {
  mobile: {
    maxWidth: '375px',
    boxShadow: '0 0 0 12px hsl(var(--muted)), 0 0 0 14px hsl(var(--border))',
    borderRadius: '36px',
  },
  tablet: {
    maxWidth: '768px',
    boxShadow: '0 0 0 10px hsl(var(--muted)), 0 0 0 12px hsl(var(--border))',
    borderRadius: '20px',
  },
  desktop: {
    maxWidth: '100%',
    boxShadow: 'none',
    borderRadius: '0',
  },
};

interface CanvasContainerProps {
  breakpoint: Breakpoint;
  zoom: number;
  children: React.ReactNode;
}

function CanvasContainer({ breakpoint, zoom, children }: CanvasContainerProps) {
  const frameStyle = DEVICE_FRAMES[breakpoint];
  const width = BREAKPOINT_MAX_WIDTHS[breakpoint];
  
  return (
    <div 
      className="flex justify-center items-start p-8 min-h-full"
      style={{
        backgroundColor: 'hsl(var(--muted))',
        backgroundImage: `
          radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }}
    >
      <div
        className={cn(
          "bg-background transition-all duration-300 ease-out",
          "min-h-[600px] relative overflow-hidden"
        )}
        style={{
          width,
          maxWidth: frameStyle.maxWidth,
          boxShadow: frameStyle.boxShadow,
          borderRadius: frameStyle.borderRadius,
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Breakpoint info bar at top of canvas
function BreakpointInfo({ breakpoint }: { breakpoint: Breakpoint }) {
  const width = BREAKPOINTS[breakpoint];
  
  return (
    <div className="absolute top-0 left-0 right-0 bg-primary/10 text-primary text-xs py-1 px-2 text-center z-10">
      {breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)} View
      {breakpoint !== 'desktop' && ` (${width}px)`}
    </div>
  );
}

export function EditorCanvas() {
  const { currentBreakpoint, zoom, isPreviewMode } = useUIStore();
  const { data } = useEditorStore();
  const { selectedId, setSelectedId } = useSelectionStore();
  
  // Get root children IDs
  const rootChildren = data.root.children || [];
  
  // Handle click on canvas (deselect)
  const handleCanvasClick = React.useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas
    if (e.target === e.currentTarget) {
      setSelectedId(null);
    }
  }, [setSelectedId]);
  
  return (
    <div className="relative flex-1 overflow-auto">
      {/* Breakpoint indicator */}
      {!isPreviewMode && currentBreakpoint !== 'desktop' && (
        <BreakpointInfo breakpoint={currentBreakpoint} />
      )}
      
      <CanvasContainer breakpoint={currentBreakpoint} zoom={zoom}>
        <DroppableCanvas onClick={handleCanvasClick}>
          {rootChildren.map((componentId, index) => {
            const component = data.components[componentId];
            if (!component) return null;
            
            return (
              <SortableComponent key={componentId} id={componentId} index={index}>
                <ComponentWrapper
                  component={component}
                  isSelected={selectedId === componentId}
                  onSelect={() => setSelectedId(componentId)}
                  breakpoint={currentBreakpoint}
                />
              </SortableComponent>
            );
          })}
        </DroppableCanvas>
      </CanvasContainer>
    </div>
  );
}

export default EditorCanvas;
```

**Acceptance Criteria:**
- [ ] Canvas resizes for mobile/tablet/desktop
- [ ] Device frame styling applied
- [ ] Smooth transition between breakpoints
- [ ] Zoom applies correctly
- [ ] Breakpoint indicator shows

---

### Task 7: Update ComponentWrapper to Pass Breakpoint

**Description:** Ensure components receive current breakpoint for rendering.

**Files:**
- MODIFY: `src/components/studio/canvas/component-wrapper.tsx`

**Code:**

```typescript
// src/components/studio/canvas/component-wrapper.tsx
// Add breakpoint prop and pass to render

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { StudioComponent } from '@/types/studio';
import type { Breakpoint } from '@/lib/studio/utils/responsive-utils';
import { getResponsiveValue, isResponsiveValue } from '@/lib/studio/utils/responsive-utils';
import { useComponentRegistry } from '@/lib/studio/registry/component-registry';
import { GripVertical, Trash2, Copy, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComponentWrapperProps {
  component: StudioComponent;
  isSelected: boolean;
  onSelect: () => void;
  breakpoint: Breakpoint;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

// Resolve responsive props for current breakpoint
function resolveResponsiveProps(
  props: Record<string, unknown>,
  breakpoint: Breakpoint
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(props)) {
    if (isResponsiveValue<unknown>(value)) {
      resolved[key] = getResponsiveValue(value, breakpoint);
    } else {
      resolved[key] = value;
    }
  }
  
  return resolved;
}

export function ComponentWrapper({
  component,
  isSelected,
  onSelect,
  breakpoint,
  onDelete,
  onDuplicate,
}: ComponentWrapperProps) {
  const { getComponent } = useComponentRegistry();
  const definition = getComponent(component.type);
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Resolve responsive props for current breakpoint
  const resolvedProps = React.useMemo(
    () => resolveResponsiveProps(component.props, breakpoint),
    [component.props, breakpoint]
  );
  
  if (!definition) {
    return (
      <div className="p-4 border-2 border-dashed border-destructive rounded bg-destructive/10">
        <p className="text-sm text-destructive">
          Unknown component: {component.type}
        </p>
      </div>
    );
  }
  
  const RenderComponent = definition.render;
  
  return (
    <div
      className={cn(
        "relative group",
        "transition-all duration-150"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection/Hover Outline */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none z-10",
          "border-2 rounded transition-colors",
          isSelected 
            ? "border-primary" 
            : isHovered 
              ? "border-primary/50" 
              : "border-transparent"
        )}
      />
      
      {/* Component Label */}
      {(isSelected || isHovered) && (
        <div className={cn(
          "absolute -top-6 left-0 z-20",
          "flex items-center gap-1 px-2 py-0.5 rounded-t",
          "text-xs font-medium",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}>
          <GripVertical className="h-3 w-3 cursor-grab" />
          <span>{definition.label}</span>
        </div>
      )}
      
      {/* Quick Actions */}
      {isSelected && (
        <div className="absolute -top-6 right-0 z-20 flex gap-0.5">
          {onDuplicate && (
            <Button
              variant="secondary"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      
      {/* Actual Component Render */}
      <div className={cn(
        component.hidden && "opacity-50",
        component.locked && "pointer-events-none"
      )}>
        <RenderComponent 
          {...resolvedProps} 
          _breakpoint={breakpoint}
          _isEditor={true}
        />
      </div>
    </div>
  );
}

export default ComponentWrapper;
```

**Acceptance Criteria:**
- [ ] Components receive breakpoint prop
- [ ] Responsive props resolved to current breakpoint
- [ ] Re-renders when breakpoint changes
- [ ] Selection/hover still works

---

### Task 8: Update Top Toolbar with Breakpoint Selector

**Description:** Add breakpoint selector to the studio toolbar.

**Files:**
- MODIFY: `src/components/studio/layout/studio-toolbar.tsx`

**Code:**

```typescript
// src/components/studio/layout/studio-toolbar.tsx
// Add BreakpointSelector to the toolbar

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { BreakpointSelector } from './breakpoint-selector';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  Eye, 
  Save, 
  Loader2,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import Link from 'next/link';

interface StudioToolbarProps {
  siteId: string;
  pageId: string;
  siteName?: string;
  pageName?: string;
}

export function StudioToolbar({
  siteId,
  pageId,
  siteName = 'My Site',
  pageName = 'Home',
}: StudioToolbarProps) {
  const { undo, redo, canUndo, canRedo, save, isSaving, isDirty } = useEditorStore();
  const { zoom, setZoom, isPreviewMode, setPreviewMode } = useUIStore();
  
  const handleSave = async () => {
    await save();
  };
  
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 25, 200));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 25, 25));
  };
  
  const handleZoomReset = () => {
    setZoom(100);
  };
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-12 border-b bg-background flex items-center justify-between px-2 gap-2">
        {/* Left Section: Back + Site/Page */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/dashboard/sites/${siteId}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Site</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1 text-sm">
                <span className="font-medium">{siteName}</span>
                <span className="text-muted-foreground">/</span>
                <span>{pageName}</span>
                <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Page Settings</DropdownMenuItem>
              <DropdownMenuItem>Switch Page</DropdownMenuItem>
              <DropdownMenuItem>Site Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Center Section: Undo/Redo + Breakpoints + Zoom */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Breakpoint Selector */}
          <BreakpointSelector />
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-16 font-mono text-xs">
                  {zoom}%
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {[50, 75, 100, 125, 150, 200].map((z) => (
                  <DropdownMenuItem key={z} onClick={() => setZoom(z)}>
                    {z}%
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomReset}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Zoom</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Right Section: Preview + Save */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPreviewMode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPreviewMode(!isPreviewMode)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Preview Mode (Ctrl+P)</TooltipContent>
          </Tooltip>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : isDirty ? 'Save' : 'Saved'}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default StudioToolbar;
```

**Acceptance Criteria:**
- [ ] Breakpoint selector visible in toolbar
- [ ] Centered between undo/redo and zoom
- [ ] Works correctly with other toolbar features

---

### Task 9: Update Properties Panel Header with Breakpoint Indicator

**Description:** Show current breakpoint in properties panel.

**Files:**
- MODIFY: `src/components/studio/panels/right-panel.tsx`

**Code:**

```typescript
// src/components/studio/panels/right-panel.tsx
// Add breakpoint indicator to header

'use client';

import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSelectionStore } from '@/lib/studio/store/selection-store';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { useComponentRegistry } from '@/lib/studio/registry/component-registry';
import { FieldRenderer } from '../fields/field-renderer';
import { BreakpointIndicator, BreakpointSelectorCompact } from '../layout/breakpoint-selector';
import { 
  Settings2, 
  Sparkles, 
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FieldGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FieldGroup({ title, children, defaultOpen = true }: FieldGroupProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
        <span className="text-sm font-medium">{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function RightPanel() {
  const { selectedId, setSelectedId } = useSelectionStore();
  const { data, updateComponent, deleteComponent } = useEditorStore();
  const currentBreakpoint = useUIStore((state) => state.currentBreakpoint);
  const { getComponent } = useComponentRegistry();
  
  // Get selected component
  const selectedComponent = selectedId ? data.components[selectedId] : null;
  const componentDef = selectedComponent ? getComponent(selectedComponent.type) : null;
  
  // Handle field change
  const handleFieldChange = React.useCallback((fieldName: string, value: unknown) => {
    if (!selectedId) return;
    updateComponent(selectedId, { [fieldName]: value });
  }, [selectedId, updateComponent]);
  
  // Handle delete
  const handleDelete = React.useCallback(() => {
    if (!selectedId) return;
    deleteComponent(selectedId);
    setSelectedId(null);
  }, [selectedId, deleteComponent, setSelectedId]);
  
  // Group fields by category
  const groupFields = (fields: Record<string, any>) => {
    const groups: Record<string, Record<string, any>> = {
      content: {},
      style: {},
      spacing: {},
      advanced: {},
    };
    
    Object.entries(fields).forEach(([name, field]) => {
      // Auto-categorize based on field name/type
      if (['text', 'title', 'subtitle', 'heading', 'label', 'items', 'children'].some(k => name.toLowerCase().includes(k))) {
        groups.content[name] = field;
      } else if (['color', 'background', 'border', 'shadow', 'typography'].some(k => name.toLowerCase().includes(k) || field.type === k)) {
        groups.style[name] = field;
      } else if (['padding', 'margin', 'spacing', 'gap'].some(k => name.toLowerCase().includes(k) || field.type === 'spacing')) {
        groups.spacing[name] = field;
      } else {
        groups.advanced[name] = field;
      }
    });
    
    return groups;
  };
  
  if (!selectedComponent || !componentDef) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a component to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }
  
  const fieldGroups = groupFields(componentDef.fields);
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">{componentDef.label}</h3>
            <p className="text-xs text-muted-foreground">{componentDef.description}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Component?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the {componentDef.label} component from the page.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {/* Breakpoint Indicator */}
        <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5">
          <BreakpointIndicator />
          <BreakpointSelectorCompact />
        </div>
      </div>
      
      {/* AI Button */}
      {componentDef.ai && (
        <div className="p-3 border-b">
          <Button variant="outline" className="w-full gap-2" size="sm">
            <Sparkles className="h-4 w-4" />
            Ask AI to modify
          </Button>
        </div>
      )}
      
      {/* Fields */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Content Fields */}
          {Object.keys(fieldGroups.content).length > 0 && (
            <FieldGroup title="Content">
              {Object.entries(fieldGroups.content).map(([name, field]) => (
                <FieldRenderer
                  key={name}
                  field={field}
                  value={selectedComponent.props[name]}
                  onChange={(value) => handleFieldChange(name, value)}
                />
              ))}
            </FieldGroup>
          )}
          
          {Object.keys(fieldGroups.content).length > 0 && <Separator />}
          
          {/* Style Fields */}
          {Object.keys(fieldGroups.style).length > 0 && (
            <FieldGroup title="Style">
              {Object.entries(fieldGroups.style).map(([name, field]) => (
                <FieldRenderer
                  key={name}
                  field={field}
                  value={selectedComponent.props[name]}
                  onChange={(value) => handleFieldChange(name, value)}
                />
              ))}
            </FieldGroup>
          )}
          
          {Object.keys(fieldGroups.style).length > 0 && <Separator />}
          
          {/* Spacing Fields */}
          {Object.keys(fieldGroups.spacing).length > 0 && (
            <FieldGroup title="Spacing">
              {Object.entries(fieldGroups.spacing).map(([name, field]) => (
                <FieldRenderer
                  key={name}
                  field={field}
                  value={selectedComponent.props[name]}
                  onChange={(value) => handleFieldChange(name, value)}
                />
              ))}
            </FieldGroup>
          )}
          
          {Object.keys(fieldGroups.spacing).length > 0 && <Separator />}
          
          {/* Advanced Fields */}
          {Object.keys(fieldGroups.advanced).length > 0 && (
            <FieldGroup title="Advanced" defaultOpen={false}>
              {Object.entries(fieldGroups.advanced).map(([name, field]) => (
                <FieldRenderer
                  key={name}
                  field={field}
                  value={selectedComponent.props[name]}
                  onChange={(value) => handleFieldChange(name, value)}
                />
              ))}
            </FieldGroup>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default RightPanel;
```

**Acceptance Criteria:**
- [ ] Breakpoint indicator shows in panel header
- [ ] Compact selector allows quick switching
- [ ] Fields grouped by category
- [ ] AI button present when component has AI config

---

### Task 10: Update Existing Components with Responsive Fields

**Description:** Update the 10 premium components to use responsive field definitions.

**Files:**
- MODIFY: `src/components/studio/blocks/layout/section.tsx`
- MODIFY: `src/components/studio/blocks/layout/container.tsx`
- MODIFY: `src/components/studio/blocks/layout/columns.tsx`
- MODIFY: `src/components/studio/blocks/layout/spacer.tsx`
- MODIFY: `src/components/studio/blocks/layout/divider.tsx`
- MODIFY: `src/components/studio/blocks/typography/heading.tsx`
- MODIFY: `src/components/studio/blocks/typography/text.tsx`
- MODIFY: `src/components/studio/blocks/interactive/button.tsx`
- MODIFY: `src/components/studio/blocks/media/image.tsx`
- MODIFY: `src/components/studio/blocks/media/icon.tsx`

**Example update for Section component:**

```typescript
// src/components/studio/blocks/layout/section.tsx
// Update the fields definition to use responsive: true

import type { ComponentDefinition } from '@/types/studio';

export const SectionDefinition: ComponentDefinition = {
  type: 'Section',
  label: 'Section',
  description: 'Full-width section with background options',
  category: 'Layout',
  icon: 'layout',
  
  fields: {
    // Style Fields
    backgroundColor: {
      type: 'color',
      label: 'Background Color',
      defaultValue: 'transparent',
    },
    backgroundImage: {
      type: 'image',
      label: 'Background Image',
    },
    backgroundOverlay: {
      type: 'color',
      label: 'Overlay Color',
      description: 'Color overlay on background image',
    },
    
    // Spacing Fields - RESPONSIVE
    paddingTop: {
      type: 'text',
      label: 'Padding Top',
      responsive: true,
      defaultValue: { mobile: '32px', tablet: '48px', desktop: '64px' },
    },
    paddingBottom: {
      type: 'text',
      label: 'Padding Bottom',
      responsive: true,
      defaultValue: { mobile: '32px', tablet: '48px', desktop: '64px' },
    },
    paddingLeft: {
      type: 'text',
      label: 'Padding Left',
      responsive: true,
      defaultValue: { mobile: '16px', tablet: '24px', desktop: '32px' },
    },
    paddingRight: {
      type: 'text',
      label: 'Padding Right',
      responsive: true,
      defaultValue: { mobile: '16px', tablet: '24px', desktop: '32px' },
    },
    
    // Size Fields - RESPONSIVE
    minHeight: {
      type: 'text',
      label: 'Minimum Height',
      responsive: true,
      defaultValue: { mobile: 'auto', desktop: '400px' },
    },
    maxWidth: {
      type: 'select',
      label: 'Max Width',
      options: [
        { label: 'Full Width', value: 'none' },
        { label: 'Container (1280px)', value: '1280px' },
        { label: 'Narrow (960px)', value: '960px' },
        { label: 'Wide (1440px)', value: '1440px' },
      ],
      defaultValue: 'none',
    },
    
    // Advanced
    id: {
      type: 'text',
      label: 'Section ID',
      description: 'For anchor links',
    },
  },
  
  defaultProps: {
    backgroundColor: 'transparent',
    paddingTop: { mobile: '32px', tablet: '48px', desktop: '64px' },
    paddingBottom: { mobile: '32px', tablet: '48px', desktop: '64px' },
    paddingLeft: { mobile: '16px', tablet: '24px', desktop: '32px' },
    paddingRight: { mobile: '16px', tablet: '24px', desktop: '32px' },
    minHeight: { mobile: 'auto', desktop: '400px' },
    maxWidth: 'none',
  },
  
  render: SectionRender,
  acceptsChildren: true,
  
  ai: {
    description: 'A full-width section for grouping content with background options',
    canModify: ['backgroundColor', 'paddingTop', 'paddingBottom', 'minHeight'],
    suggestions: [
      'Add a gradient background',
      'Make this section taller',
      'Add more padding on mobile',
    ],
  },
};

// Update render to use _breakpoint prop
function SectionRender(props: SectionProps & { _breakpoint?: Breakpoint }) {
  const {
    backgroundColor,
    backgroundImage,
    backgroundOverlay,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    minHeight,
    maxWidth,
    id,
    children,
    _breakpoint = 'desktop',
  } = props;
  
  // Resolve responsive values
  const resolvedPaddingTop = getResponsiveValue(paddingTop, _breakpoint);
  const resolvedPaddingBottom = getResponsiveValue(paddingBottom, _breakpoint);
  const resolvedPaddingLeft = getResponsiveValue(paddingLeft, _breakpoint);
  const resolvedPaddingRight = getResponsiveValue(paddingRight, _breakpoint);
  const resolvedMinHeight = getResponsiveValue(minHeight, _breakpoint);
  
  return (
    <section
      id={id}
      style={{
        backgroundColor,
        backgroundImage: backgroundImage?.url ? `url(${backgroundImage.url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        paddingTop: resolvedPaddingTop,
        paddingBottom: resolvedPaddingBottom,
        paddingLeft: resolvedPaddingLeft,
        paddingRight: resolvedPaddingRight,
        minHeight: resolvedMinHeight,
        maxWidth: maxWidth === 'none' ? undefined : maxWidth,
        marginLeft: maxWidth !== 'none' ? 'auto' : undefined,
        marginRight: maxWidth !== 'none' ? 'auto' : undefined,
        position: 'relative',
      }}
    >
      {/* Overlay */}
      {backgroundOverlay && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: backgroundOverlay,
          }}
        />
      )}
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </section>
  );
}
```

**Update pattern for all components:**

1. Mark visual props with `responsive: true`
2. Set `defaultValue` as ResponsiveValue object
3. In render, use `getResponsiveValue(prop, _breakpoint)`
4. Add `_breakpoint?: Breakpoint` to props type

**Fields to make responsive per component:**

| Component | Responsive Fields |
|-----------|------------------|
| Section | padding*, minHeight |
| Container | padding*, maxWidth, gap |
| Columns | columns, gap |
| Spacer | height |
| Divider | margin* |
| Heading | fontSize, textAlign, margin* |
| Text | fontSize, lineHeight, columns |
| Button | padding*, fontSize |
| Image | width, height, margin* |
| Icon | size |

**Acceptance Criteria:**
- [ ] All 10 components have responsive field definitions
- [ ] Default values use ResponsiveValue format
- [ ] Render functions resolve values per breakpoint
- [ ] Components re-render when breakpoint changes

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/lib/studio/utils/responsive-utils.ts` | Responsive value utilities |
| MODIFY | `src/lib/studio/store/ui-store.ts` | Add breakpoint state |
| CREATE | `src/components/studio/layout/breakpoint-selector.tsx` | Breakpoint selector |
| CREATE | `src/components/studio/fields/responsive-field-wrapper.tsx` | Field wrapper |
| MODIFY | `src/components/studio/fields/field-renderer.tsx` | Add responsive support |
| MODIFY | `src/components/studio/canvas/editor-canvas.tsx` | Canvas breakpoint sizing |
| MODIFY | `src/components/studio/canvas/component-wrapper.tsx` | Pass breakpoint |
| MODIFY | `src/components/studio/layout/studio-toolbar.tsx` | Add breakpoint selector |
| MODIFY | `src/components/studio/panels/right-panel.tsx` | Breakpoint indicator |
| MODIFY | `src/components/studio/blocks/layout/*.tsx` | Responsive fields |
| MODIFY | `src/components/studio/blocks/typography/*.tsx` | Responsive fields |
| MODIFY | `src/components/studio/blocks/interactive/*.tsx` | Responsive fields |
| MODIFY | `src/components/studio/blocks/media/*.tsx` | Responsive fields |

---

## Testing Requirements

### Unit Tests
- [ ] `responsive-utils.ts` - All utility functions
- [ ] `isResponsiveValue` correctly identifies responsive objects
- [ ] `getResponsiveValue` returns correct breakpoint value
- [ ] `setResponsiveValue` only updates target breakpoint

### Integration Tests
- [ ] Changing breakpoint updates canvas width
- [ ] Changing breakpoint updates component renders
- [ ] Toggling responsive mode converts values
- [ ] Field values persist correctly

### Manual Testing
- [ ] Click through mobile → tablet → desktop
- [ ] Canvas resizes smoothly
- [ ] Edit a responsive field value
- [ ] Toggle responsive mode on/off
- [ ] Check that values are correct per breakpoint
- [ ] Save and reload, verify persistence

---

## Dependencies to Install

```bash
# No new dependencies required - all packages installed in previous waves
```

---

## Environment Variables

```env
# No new environment variables needed
```

---

## Database Changes

```sql
-- No database changes needed
-- Page data already supports nested objects (ResponsiveValue format)
```

---

## Rollback Plan

1. Remove breakpoint selector from toolbar
2. Revert UI store changes
3. Remove ResponsiveFieldWrapper
4. Revert FieldRenderer to non-responsive version
5. Revert component field definitions
6. Fields fall back to single-value editing

---

## Success Criteria

- [ ] Breakpoint selector visible and functional in toolbar
- [ ] Canvas resizes to 375px/768px/100% for each breakpoint
- [ ] Smooth CSS transitions between breakpoints
- [ ] Properties panel shows current breakpoint indicator
- [ ] Responsive toggle appears on supported fields
- [ ] Editing in responsive mode only updates current breakpoint
- [ ] Components render with correct values per breakpoint
- [ ] Values persist correctly after save/reload
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All 10 components have responsive field support
- [ ] Mobile-first: mobile value always required
- [ ] Tablet/desktop fallback to previous breakpoint if not set
